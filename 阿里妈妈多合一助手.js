// ==UserScript==
// @name         阿里妈妈多合一助手 (Pro版)
// @namespace    http://tampermonkey.net/
// @version      5.30
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
 * v5.30 (2026-02-15)
 * - ✅ 新增代码检查团队机制：补充团队职责文档与 PR 检查清单
 * - ✅ 新增一键审查脚本：`scripts/review-team.sh` 统一架构/安全/测试/版本校验
 * - 🔧 CI/Release 流程统一：发布前检查改为复用同一套团队检查入口
 * - 🔧 审查责任自动分配：新增 `.github/CODEOWNERS`
 * 
 * v5.29 (2026-02-15)
 * - ✨ 主面板工具区重构：新增「辅助显示」入口，与「算法护航」「万能查数」形成三入口布局
 * - ✨ 辅助显示体验优化：开关区改为主面板内联展开/收起，加入过渡动画并默认收起
 * - 🔧 配置版本化迁移：新增 `configRevision`，升级时自动修正默认配置并持久化
 * - 🔧 默认行为修订：日志区默认折叠，首次打开更聚焦核心操作区
 * - ✅ 冒烟与回归增强：补充辅助显示与配置迁移相关检查，新增本地烟测页 `dev/smoke-harness.html`
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
 * - 🔧 主面板三入口排版修复：按钮文案强制单行显示，避免“万能查数/辅助显示”在窄宽度下换行
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
        CONFIG_REVISION: 2,
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
        logExpanded: false,
        magicReportOpen: false,
        configRevision: CONSTANTS.CONFIG_REVISION
    };

    const createHookManager = () => {
        if (window.__AM_HOOK_MANAGER__) return window.__AM_HOOK_MANAGER__;

        const manager = {
            installed: false,
            fetchHandlers: [],
            xhrOpenHandlers: [],
            xhrSendHandlers: [],
            xhrLoadHandlers: [],

            unregisterHandler(listName, handler) {
                const list = this[listName];
                if (!Array.isArray(list) || typeof handler !== 'function') return false;
                const index = list.indexOf(handler);
                if (index < 0) return false;
                list.splice(index, 1);
                return true;
            },

            registerFetch(handler) {
                if (typeof handler !== 'function') return () => false;
                this.fetchHandlers.push(handler);
                return () => this.unregisterHandler('fetchHandlers', handler);
            },

            registerXHROpen(handler) {
                if (typeof handler !== 'function') return () => false;
                this.xhrOpenHandlers.push(handler);
                return () => this.unregisterHandler('xhrOpenHandlers', handler);
            },

            registerXHRSend(handler) {
                if (typeof handler !== 'function') return () => false;
                this.xhrSendHandlers.push(handler);
                return () => this.unregisterHandler('xhrSendHandlers', handler);
            },

            registerXHRLoad(handler) {
                if (typeof handler !== 'function') return () => false;
                this.xhrLoadHandlers.push(handler);
                return () => this.unregisterHandler('xhrLoadHandlers', handler);
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

    const normalizeConfig = (rawConfig) => {
        const parsedRevision = Number(rawConfig?.configRevision);
        const hasValidRevision = Number.isFinite(parsedRevision);
        const needsRevisionUpgrade = !hasValidRevision || parsedRevision < CONSTANTS.CONFIG_REVISION;
        const nextConfig = { ...DEFAULT_CONFIG, ...rawConfig, panelOpen: false };

        if (needsRevisionUpgrade) {
            nextConfig.logExpanded = false;
            nextConfig.configRevision = CONSTANTS.CONFIG_REVISION;
        } else {
            nextConfig.configRevision = parsedRevision;
        }

        return { config: nextConfig, migrated: needsRevisionUpgrade };
    };

    const loadConfig = () => {
        const current = safeParseJSON(localStorage.getItem(CONSTANTS.STORAGE_KEY));
        if (current && typeof current === 'object') {
            const { config, migrated } = normalizeConfig(current);
            if (migrated) {
                localStorage.setItem(CONSTANTS.STORAGE_KEY, JSON.stringify(config));
            }
            return config;
        }

        for (const legacyKey of CONSTANTS.LEGACY_STORAGE_KEYS) {
            const legacy = safeParseJSON(localStorage.getItem(legacyKey));
            if (legacy && typeof legacy === 'object') {
                const { config } = normalizeConfig(legacy);
                localStorage.setItem(CONSTANTS.STORAGE_KEY, JSON.stringify(config));
                return config;
            }
        }

        return { ...DEFAULT_CONFIG };
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
        runtime: {
            assistExpanded: false
        },

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



                .am-tools-row {
                    display: grid;
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                    gap: 8px;
                    margin-bottom: 0;
                }
                .am-tool-btn {
                    flex: 1; text-align: center; padding: 12px 0; border-radius: 10px;
                    background: var(--mx-number-report-brand-color1); 
                    border: 1px solid rgba(0, 0, 0, 0.1);
                    color: var(--am26-text-soft); font-size: 12px; font-weight: 500;
                    cursor: pointer; transition: all 0.3s;
                    display: flex; align-items: center; justify-content: center; gap: 4px;
                    white-space: nowrap;
                    word-break: keep-all;
                    flex-wrap: nowrap;
                    line-height: 1.2;
                }
                .am-tool-btn svg {
                    width: 14px;
                    height: 14px;
                    flex: 0 0 14px;
                }
                .am-tool-btn:hover {
                    background: var(--mx-number-report-brand-color10); 
                    border-color: var(--mx-number-report-brand-color);
                    color: var(--mx-number-report-brand-color);
                    box-shadow: 0 0 10px var(--mx-number-report-brand-color50); /* 亮灯效果 */
                    transform: translateY(-1px);
                }
                .am-tool-btn.active {
                    background: linear-gradient(135deg, var(--mx-number-report-brand-color10), rgba(69, 84, 229, 0.2));
                    border-color: var(--mx-number-report-brand-color);
                    color: var(--mx-number-report-brand-color);
                    box-shadow: inset 0 0 0 1px var(--mx-number-report-brand-color10), 0 0 10px var(--mx-number-report-brand-color50);
                }

                #am-assist-switches {
                    max-height: 0;
                    opacity: 0;
                    transform: translateY(-6px);
                    overflow: hidden;
                    pointer-events: none;
                    margin-top: 0;
                    padding: 0 10px;
                    border-radius: 12px;
                    border: 1px solid transparent;
                    background: linear-gradient(135deg, rgba(69, 84, 229, 0.14), rgba(69, 84, 229, 0.04) 55%, rgba(255, 255, 255, 0.24));
                    transition: max-height 0.32s ease, opacity 0.24s ease, transform 0.32s ease, margin-top 0.32s ease, padding 0.32s ease, border-color 0.32s ease;
                }
                #am-assist-switches.open {
                    max-height: 220px;
                    opacity: 1;
                    transform: translateY(0);
                    pointer-events: auto;
                    margin-top: 10px;
                    padding: 12px 10px;
                    border-color: rgba(69, 84, 229, 0.22);
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
                    <div class="am-tool-btn" id="am-trigger-keyword-plan-api">
                        <svg viewBox="0 0 1024 1024" width="16" height="16" fill="currentColor"><path d="M128 176a48 48 0 0 1 48-48h672a48 48 0 0 1 48 48v80H128v-80zm0 192h768v480a48 48 0 0 1-48 48H176a48 48 0 0 1-48-48V368zm160 96v64h448v-64H288zm0 160v64h288v-64H288z"></path></svg>
                        关键词建计划
                    </div>
                    <div class="am-tool-btn" id="am-trigger-magic-report">
                        <svg viewBox="0 0 1024 1024" width="16" height="16" fill="currentColor"><path d="M128 128h768v768H128z m60.8 60.8V835.2h646.4V188.8H188.8z M256 384h128v320H256V384z m192-128h128v448H448V256z m192 192h128v256H640V448z"></path></svg>
                        万能查数
                    </div>
                    <div class="am-tool-btn" id="am-toggle-assist-display">
                        <svg viewBox="0 0 1024 1024" width="16" height="16" fill="currentColor"><path d="M512 208c219.8 0 401.4 124.4 472 302.2a23.7 23.7 0 0 1 0 17.6C913.4 705.6 731.8 830 512 830S110.6 705.6 40 527.8a23.7 23.7 0 0 1 0-17.6C110.6 332.4 292.2 208 512 208zm0 104c-110.6 0-200 89.4-200 200s89.4 200 200 200 200-89.4 200-200-89.4-200-200-200zm0 88a112 112 0 1 1 0 224 112 112 0 0 1 0-224z"></path></svg>
                        辅助显示
                    </div>
                </div>

                <!-- Section 2: Settings -->
                <div id="am-assist-switches">
                    <div class="am-switches-grid">
                        <div class="am-switch-btn" data-key="showCost">询单成本</div>
                        <div class="am-switch-btn" data-key="showCartCost">加购成本</div>
                        <div class="am-switch-btn" data-key="showPercent">潜客占比</div>
                        <div class="am-switch-btn" data-key="showCostRatio">花费占比</div>
                        <div class="am-switch-btn" data-key="showBudget">预算进度</div>
                        <div class="am-switch-btn" data-key="autoSortCharge">花费排序</div>
                        <!-- <div class="am-switch-btn" data-key="autoClose">弹窗速闭</div> -->
                    </div>
                </div>
                <div class="am-log-section">
                    <div class="am-log-header">
                        <span>📋 运行日志</span>
                        <div>
                            <span class="am-action-btn" id="am-log-clear">清空</span>
                            <span class="am-action-btn" id="am-log-toggle">展开</span>
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
            const magicBtn = document.getElementById('am-trigger-magic-report');
            if (magicBtn) {
                magicBtn.onclick = () => {
                    MagicReport.toggle(true);
                };
            }

            const assistToggleBtn = document.getElementById('am-toggle-assist-display');
            if (assistToggleBtn) {
                assistToggleBtn.onclick = () => {
                    this.runtime.assistExpanded = !this.runtime.assistExpanded;
                    this.updateState();
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

            const keywordPlanBtn = document.getElementById('am-trigger-keyword-plan-api');
            if (keywordPlanBtn) {
                const resolveKeywordPlanApi = () => {
                    try {
                        if (KeywordPlanApi && typeof KeywordPlanApi.openWizard === 'function') {
                            return KeywordPlanApi;
                        }
                    } catch { }
                    try {
                        const fromWindow = window.__AM_WXT_KEYWORD_API__;
                        if (fromWindow && typeof fromWindow.openWizard === 'function') {
                            return fromWindow;
                        }
                    } catch { }
                    try {
                        const fromGlobal = globalThis.__AM_WXT_KEYWORD_API__;
                        if (fromGlobal && typeof fromGlobal.openWizard === 'function') {
                            return fromGlobal;
                        }
                    } catch { }
                    return null;
                };

                const openExistingKeywordOverlay = () => {
                    const overlay = document.getElementById('am-wxt-keyword-overlay');
                    if (!overlay) return false;
                    overlay.classList.add('open');
                    return true;
                };

                keywordPlanBtn.onclick = () => {
                    const api = resolveKeywordPlanApi();
                    if (api && typeof api.openWizard === 'function') {
                        api.openWizard();
                        return;
                    }
                    if (openExistingKeywordOverlay()) return;

                    Logger.log('⚠️ 关键词建计划模块初始化中...', true);
                    setTimeout(() => {
                        const retryApi = resolveKeywordPlanApi();
                        if (retryApi && typeof retryApi.openWizard === 'function') {
                            retryApi.openWizard();
                        } else if (openExistingKeywordOverlay()) {
                            Logger.log('ℹ️ 已打开关键词计划弹窗（兜底）');
                        } else {
                            alert('关键词建计划模块不可用，请刷新页面重试');
                        }
                    }, 800);
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
            const assistPanel = document.getElementById('am-assist-switches');
            const assistToggleBtn = document.getElementById('am-toggle-assist-display');

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

            if (assistPanel) {
                assistPanel.classList.toggle('open', this.runtime.assistExpanded);
            }
            if (assistToggleBtn) {
                assistToggleBtn.classList.toggle('active', this.runtime.assistExpanded);
            }

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
            const mouseOpts = { bubbles: true, cancelable: true };
            ['mousedown', 'mouseup', 'click'].forEach(type => {
                try {
                    el.dispatchEvent(new MouseEvent(type, mouseOpts));
                } catch {
                    try {
                        el.dispatchEvent(new Event(type, { bubbles: true, cancelable: true }));
                    } catch { }
                }
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
        isStrongCsrf: (value) => {
            const v = value === null || value === undefined ? '' : String(value).trim();
            if (!v) return false;
            // one 平台有效 csrfId 通常包含下划线并且长度较长，例如: xxxxx_1_1_1
            if (v.includes('_') && v.length >= 12) return true;
            // 兼容部分场景：长度较长的非纯数字 token 也视为有效
            if (!/^\d+$/.test(v) && v.length >= 16) return true;
            return false;
        },
        applyCsrf: (value) => {
            const next = value === null || value === undefined ? '' : String(value).trim();
            if (!next) return;
            const prev = State.tokens.csrfID === null || State.tokens.csrfID === undefined
                ? '' : String(State.tokens.csrfID).trim();
            if (!prev || TokenManager.isStrongCsrf(next) || !TokenManager.isStrongCsrf(prev)) {
                State.tokens.csrfID = next;
            }
        },

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
                    if (!rawUrl
                        || (!rawUrl.includes('dynamicToken')
                            && !rawUrl.includes('loginPointId')
                            && !rawUrl.includes('csrfId')
                            && !rawUrl.includes('csrfID'))) return;
                    const urlObj = new URL(rawUrl, window.location.origin);
                    State.tokens.dynamicToken = urlObj.searchParams.get('dynamicToken') || State.tokens.dynamicToken;
                    State.tokens.loginPointId = urlObj.searchParams.get('loginPointId') || State.tokens.loginPointId;
                    TokenManager.applyCsrf(urlObj.searchParams.get('csrfId') || urlObj.searchParams.get('csrfID'));
                } catch { }
            };

            const syncFromBody = (body) => {
                if (!body || typeof body !== 'string') return;
                try {
                    const json = JSON.parse(body);
                    State.tokens.dynamicToken = json.dynamicToken || State.tokens.dynamicToken;
                    State.tokens.loginPointId = json.loginPointId || State.tokens.loginPointId;
                    TokenManager.applyCsrf(json.csrfId || json.csrfID);
                } catch {
                    const params = new URLSearchParams(body);
                    State.tokens.dynamicToken = params.get('dynamicToken') || State.tokens.dynamicToken;
                    State.tokens.loginPointId = params.get('loginPointId') || State.tokens.loginPointId;
                    TokenManager.applyCsrf(params.get('csrfId') || params.get('csrfID'));
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
            if (State.tokens.dynamicToken && State.tokens.loginPointId && TokenManager.isStrongCsrf(State.tokens.csrfID)) return;

            const findInObj = (obj, depth = 0) => {
                if (!obj || depth > 3) return;
                try {
                    for (const key in obj) {
                        if (key === 'dynamicToken') State.tokens.dynamicToken = obj[key];
                        if (key === 'loginPointId') State.tokens.loginPointId = obj[key];
                        if (key === 'csrfId' || key === 'csrfID') TokenManager.applyCsrf(obj[key]);
                        if (key === 'user' && obj[key]?.accessInfo) {
                            State.tokens.dynamicToken = obj[key].accessInfo.dynamicToken || State.tokens.dynamicToken;
                            State.tokens.loginPointId = obj[key].accessInfo.loginPointId || State.tokens.loginPointId;
                            TokenManager.applyCsrf(obj[key].accessInfo.csrfId || obj[key].accessInfo.csrfID);
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

            // 从 URL 参数补充 CSRF（如果存在）
            try {
                const href = window.location.href || '';
                const urlObj = new URL(href, window.location.origin);
                TokenManager.applyCsrf(urlObj.searchParams.get('csrfId') || urlObj.searchParams.get('csrfID'));
                if (window.location.hash && window.location.hash.includes('?')) {
                    const hashQuery = window.location.hash.split('?')[1] || '';
                    const hashParams = new URLSearchParams(hashQuery);
                    TokenManager.applyCsrf(hashParams.get('csrfId') || hashParams.get('csrfID'));
                }
            } catch { }

            // 从 cookie 获取 CSRF
            const csrfMatch = document.cookie.match(/_tb_token_=([^;]+)/);
            if (csrfMatch) {
                // 仅当当前未拿到有效 csrfId 时，才用 _tb_token_ 兜底，避免覆盖真实 csrfId
                if (!TokenManager.isStrongCsrf(State.tokens.csrfID)) {
                    State.tokens.csrfID = csrfMatch[1];
                }
            }

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
                            TokenManager.applyCsrf(info.csrfId || info.csrfID);
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

    // ==================== 无界关键词建计划 API ====================
    const KeywordPlanApi = (() => {
        const TAG = '[KeywordPlanAPI]';
        const BUILD_VERSION = '2026-02-17 21:30';
        const SESSION_DRAFT_KEY = 'am.wxt.keyword_plan_wizard.draft';
        const WIZARD_MAX_ITEMS = 30;
        const DEFAULTS = {
            bizCode: 'onebpSearch',
            promotionScene: 'promotion_scene_search_user_define',
            itemSelectedMode: 'user_define',
            subPromotionType: 'item',
            promotionType: 'item',
            bidTypeV2: 'smart_bid',
            bidTargetV2: 'conv',
            dmcType: 'day_average',
            keywordMode: 'mixed',
            recommendCount: 20,
            matchScope: 4,
            keywordOnlineStatus: 1,
            chunkSize: 10,
            batchRetry: 1,
            recommendCrowdLabelIds: ['3000949', '3000950', '3000951', '3000952', '3000953', '3000980', '3000995']
        };
        const SCENE_SYNC_DEFAULT_ITEM_ID = '682357641421';
        const SCENE_DEFAULT_PROMOTION_SCENE = {
            '货品全站推广': 'promotion_scene_site',
            '关键词推广': 'promotion_scene_search_user_define',
            '人群推广': 'promotion_scene_display_laxin',
            '内容营销': 'scene_live_room',
            '线索推广': 'leads_collection'
        };
        const SCENE_FALLBACK_BID_TARGET = {};
        const SCENE_BIDTYPE_V2_ONLY = new Set(['关键词推广', '人群推广']);
        const SCENE_BIDTYPE_V2_DEFAULT = {
            '关键词推广': 'smart_bid',
            '人群推广': 'custom_bid'
        };
        const ENDPOINTS = {
            solutionAddList: '/solution/addList.json',
            solutionBusinessAddList: '/solution/business/addList.json',
            materialFindPage: '/material/item/findPage.json',
            bidwordSuggestDefault: '/bidword/suggest/default/list.json',
            bidwordSuggestKr: '/bidword/suggest/kr/list.json',
            wordPackageSuggestDefault: '/wordpackage/suggest/default/list.json',
            bidwordAdd: '/bidword/add.json',
            labelFindList: '/label/findList.json'
        };
        const runtimeCache = {
            value: null,
            ts: 0,
            magix: null,
            magixPending: null
        };
        const wizardState = {
            mounted: false,
            visible: false,
            draft: null,
            sceneProfiles: {},
            candidateSource: 'recommend',
            candidates: [],
            addedItems: [],
            crowdList: [],
            debugVisible: false,
            strategyList: [],
            editingStrategyId: '',
            detailVisible: false,
            sceneSyncTimer: 0,
            sceneSyncInFlight: false,
            sceneSyncPendingToken: '',
            els: {}
        };

        const log = {
            info: (...args) => console.log(TAG, ...args),
            warn: (...args) => console.warn(TAG, ...args),
            error: (...args) => console.error(TAG, ...args)
        };

        const isPlainObject = (value) => Object.prototype.toString.call(value) === '[object Object]';
        const deepClone = (value) => value === undefined ? value : JSON.parse(JSON.stringify(value));
        const toNumber = (value, fallback = 0) => {
            const num = Number(value);
            return Number.isFinite(num) ? num : fallback;
        };
        const toIdValue = (value) => {
            const n = Number(value);
            if (Number.isFinite(n) && n > 0) return n;
            const s = value === null || value === undefined ? '' : String(value).trim();
            return s;
        };
        const uniqueBy = (list, getKey) => {
            const map = new Map();
            (list || []).forEach(item => {
                const key = getKey(item);
                if (!key && key !== 0) return;
                if (!map.has(key)) map.set(key, item);
            });
            return Array.from(map.values());
        };
        const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj || {}, key);
        const chunk = (list, size) => {
            const out = [];
            if (!Array.isArray(list) || !list.length) return out;
            const chunkSize = Math.max(1, toNumber(size, DEFAULTS.chunkSize));
            for (let i = 0; i < list.length; i += chunkSize) {
                out.push(list.slice(i, i + chunkSize));
            }
            return out;
        };
        const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
        const todayStamp = () => {
            const d = new Date();
            const pad = (n) => String(n).padStart(2, '0');
            return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
        };
        const nowStampSeconds = () => {
            const d = new Date();
            const pad = (n) => String(n).padStart(2, '0');
            return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
        };
        const buildSceneTimePrefix = (sceneName = '') => {
            const scene = String(sceneName || '').trim() || '关键词推广';
            return `${scene}_${nowStampSeconds()}`;
        };
        const BUDGET_FIELDS = ['dayBudget', 'dayAverageBudget', 'totalBudget', 'futureBudget'];
        const DMC_BUDGET_FIELD_MAP = {
            normal: 'dayBudget',
            total: 'totalBudget',
            day_freeze: 'futureBudget',
            day_average: 'dayAverageBudget'
        };
        const BUDGET_FIELD_DMC_MAP = {
            dayBudget: 'normal',
            totalBudget: 'total',
            futureBudget: 'day_freeze',
            dayAverageBudget: 'day_average'
        };

        const sniffCsrfFromPerformance = () => {
            try {
                const entries = performance.getEntriesByType('resource') || [];
                for (let i = entries.length - 1; i >= 0; i--) {
                    const name = entries[i]?.name || '';
                    if (!name || !name.includes('alimama.com')) continue;
                    const match = name.match(/[?&]csrfId=([^&]+)/i) || name.match(/[?&]csrfID=([^&]+)/i);
                    if (!match || !match[1]) continue;
                    return decodeURIComponent(match[1]);
                }
            } catch { }
            return '';
        };

        const mergeDeep = (target, ...sources) => {
            const out = isPlainObject(target) ? { ...target } : {};
            sources.forEach(src => {
                if (!isPlainObject(src)) return;
                Object.keys(src).forEach(key => {
                    const srcVal = src[key];
                    const curVal = out[key];
                    if (isPlainObject(srcVal)) {
                        out[key] = mergeDeep(isPlainObject(curVal) ? curVal : {}, srcVal);
                    } else if (Array.isArray(srcVal)) {
                        out[key] = srcVal.slice();
                    } else {
                        out[key] = srcVal;
                    }
                });
            });
            return out;
        };

        const ensureTokens = () => {
            TokenManager.refresh();
            if (!TokenManager.isStrongCsrf(State.tokens.csrfID)) {
                const perfCsrf = sniffCsrfFromPerformance();
                if (perfCsrf) TokenManager.applyCsrf(perfCsrf);
            }
            const { dynamicToken, loginPointId, csrfID } = State.tokens;
            if (!loginPointId || !csrfID) {
                throw new Error('Token 未就绪，请先在页面任意位置点击一次后重试');
            }
            return { dynamicToken, loginPointId, csrfId: csrfID };
        };

        const buildOneApiUrl = (path, bizCode) => {
            const { csrfId } = ensureTokens();
            const hasQuery = path.includes('?');
            return `https://one.alimama.com${path}${hasQuery ? '&' : '?'}csrfId=${encodeURIComponent(csrfId)}&bizCode=${encodeURIComponent(bizCode)}`;
        };

        const isResponseOk = (res) => {
            if (!res || typeof res !== 'object') return false;
            if (res.success === false || res.ok === false) return false;
            if (res.info && res.info.ok === false) return false;
            if (res.info && res.info.errorCode) return false;
            return true;
        };

        const assertResponseOk = (res, action) => {
            if (isResponseOk(res)) return;
            const msg = res?.info?.message || res?.message || `${action}失败`;
            throw new Error(msg);
        };

        const requestOne = async (path, bizCode, payload = {}, options = {}) => {
            const token = ensureTokens();
            const url = buildOneApiUrl(path, bizCode);
            const body = {
                ...payload,
                csrfId: token.csrfId,
                loginPointId: token.loginPointId
            };
            const res = await API.request(url, body, options);
            assertResponseOk(res, path);
            return res;
        };

        const pickMaterialFields = (material = {}) => ({
            materialId: material.materialId,
            materialName: material.materialName,
            promotionType: material.promotionType,
            subPromotionType: material.subPromotionType,
            fromTab: material.fromTab,
            linkUrl: material.linkUrl,
            goalLifeCycleList: material.goalLifeCycleList,
            shopId: material.shopId,
            shopName: material.shopName,
            bidCount: material.bidCount,
            categoryLevel1: material.categoryLevel1
        });

        const sanitizeCampaign = (campaign = {}) => {
            const out = {};
            Object.keys(campaign || {}).forEach(key => {
                if (key.startsWith('mx_')) return;
                if (key === 'adgroupList') return;
                if (key === 'couponId' && !campaign[key]) return;
                out[key] = campaign[key];
            });
            return out;
        };

        const sanitizeAdgroup = (adgroup = {}) => {
            const out = {};
            Object.keys(adgroup || {}).forEach(key => {
                if (key.startsWith('mx_')) return;
                if (key === 'material') {
                    out.material = pickMaterialFields(adgroup.material || {});
                    return;
                }
                out[key] = adgroup[key];
            });
            return out;
        };

        const purgeCreateTransientFields = (value) => {
            const dropKeys = new Set(['campaignId', 'adgroupId', 'copyCampaignId', 'copyAdgroupId', 'id', 'gmtCreate', 'gmtModified', 'createTime', 'modifyTime']);
            if (Array.isArray(value)) return value.map(v => purgeCreateTransientFields(v));
            if (!isPlainObject(value)) return value;
            const out = {};
            Object.keys(value).forEach(key => {
                if (key.startsWith('mx_')) return;
                if (dropKeys.has(key)) return;
                out[key] = purgeCreateTransientFields(value[key]);
            });
            return out;
        };

        const getMagixInstance = async () => {
            if (window.Magix?.Vframe?.all) return window.Magix;
            if (runtimeCache.magix?.Vframe?.all) return runtimeCache.magix;
            if (!window.seajs || typeof window.seajs.use !== 'function') return null;
            if (runtimeCache.magixPending) return runtimeCache.magixPending;
            runtimeCache.magixPending = new Promise(resolve => {
                try {
                    window.seajs.use(['magix'], (magixRef) => resolve(magixRef || null));
                } catch (err) {
                    log.warn('seajs 加载 magix 失败:', err?.message || err);
                    resolve(null);
                }
            }).then((magixRef) => {
                if (magixRef?.Vframe?.all) runtimeCache.magix = magixRef;
                runtimeCache.magixPending = null;
                return magixRef;
            }).catch(() => {
                runtimeCache.magixPending = null;
                return null;
            });
            return runtimeCache.magixPending;
        };

        const getAllVframes = async () => {
            const magixRef = await getMagixInstance();
            if (!magixRef?.Vframe?.all) return {};
            try {
                return magixRef.Vframe.all() || {};
            } catch (err) {
                log.warn('读取 Vframe 列表失败:', err?.message || err);
                return {};
            }
        };

        const parseRouteParamFromHash = (param = '', hash = '') => {
            const key = String(param || '').trim();
            if (!key) return '';
            const raw = String(hash || window.location.hash || '').trim();
            if (!raw) return '';
            const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const match = raw.match(new RegExp(`[?&]${escaped}=([^&#]+)`, 'i'));
            if (!match || !match[1]) return '';
            try {
                return decodeURIComponent(match[1]);
            } catch {
                return String(match[1] || '').trim();
            }
        };

        const invokeSolutionDataViaPageBridge = async (expectedBizCode = '', options = {}) => {
            const timeoutMs = Math.max(1200, toNumber(options.timeoutMs, 5800));
            const bridgeKey = `am_wxt_solution_bridge_${Date.now()}_${Math.random().toString(36).slice(2)}`;
            const expected = String(expectedBizCode || '').trim();
            return new Promise((resolve) => {
                let settled = false;
                let timer = null;
                const cleanup = () => {
                    if (timer) {
                        clearTimeout(timer);
                        timer = null;
                    }
                    window.removeEventListener('message', onMessage);
                };
                const finalize = (payload) => {
                    if (settled) return;
                    settled = true;
                    cleanup();
                    resolve(payload || null);
                };
                const onMessage = (event) => {
                    try {
                        if (event.source !== window) return;
                    } catch { }
                    const data = event.data || {};
                    if (!data || data.__amWxtBridgeKey !== bridgeKey) return;
                    finalize(data.ok ? (data.result || null) : null);
                };
                window.addEventListener('message', onMessage);
                timer = setTimeout(() => finalize(null), timeoutMs);
                try {
                    const payload = JSON.stringify({
                        key: bridgeKey,
                        expectedBizCode: expected
                    });
                    const script = document.createElement('script');
                    script.type = 'text/javascript';
                    script.textContent = `;(() => {
                        const payload = ${payload};
                        const aliasMap = {
                            onebpSite: 'onebpSite',
                            onebpSearch: 'onebpSearch',
                            onebpDisplay: 'onebpDisplay',
                            onebpShopMarketing: 'onebpStarShop',
                            onebpStarShop: 'onebpStarShop',
                            onebpContentMarketing: 'onebpLive',
                            onebpLive: 'onebpLive',
                            onebpAdStrategyLiuZi: 'onebpAdStrategyLiuZi'
                        };
                        const normalizeBiz = (biz) => {
                            const value = String(biz || '').trim();
                            if (!value) return '';
                            return String(aliasMap[value] || value).trim();
                        };
                        const serialize = (value) => {
                            try { return JSON.parse(JSON.stringify(value)); } catch { return null; }
                        };
                        const post = (ok, result) => {
                            window.postMessage({ __amWxtBridgeKey: payload.key, ok: !!ok, result: serialize(result) }, '*');
                        };
                        const run = async () => {
                            let magixRef = window.Magix && window.Magix.Vframe && window.Magix.Vframe.all
                                ? window.Magix
                                : null;
                            if (!magixRef && window.seajs && typeof window.seajs.use === 'function') {
                                try {
                                    magixRef = await new Promise((resolve) => {
                                        window.seajs.use(['magix'], (ref) => resolve(ref || null));
                                    });
                                } catch { }
                            }
                            if (!magixRef || !magixRef.Vframe || typeof magixRef.Vframe.all !== 'function') {
                                post(true, null);
                                return;
                            }
                            const all = magixRef.Vframe.all() || {};
                            const ids = Object.keys(all || {});
                            if (!ids.length) {
                                post(true, null);
                                return;
                            }
                            const expectedBiz = normalizeBiz(payload.expectedBizCode || '');
                            const rankedIds = [
                                ...ids.filter(id => id.includes('universalBP_common_layout_main_content')),
                                ...ids.filter(id => !id.includes('universalBP_common_layout_main_content') && id.includes('main_content')),
                                ...ids.filter(id => !id.includes('main_content') && id.includes('universalBP_common_layout')),
                                ...ids.filter(id => !id.includes('universalBP_common_layout') && id.toLowerCase().includes('onebp')),
                                ...ids.filter(id => !id.toLowerCase().includes('onebp'))
                            ];
                            const tried = new Set();
                            let fallback = null;
                            for (const id of rankedIds) {
                                if (tried.has(id)) continue;
                                tried.add(id);
                                const vf = all[id];
                                if (!vf || typeof vf.invoke !== 'function') continue;
                                try {
                                    const res = await vf.invoke('getSolutionData');
                                    if (!res || !Array.isArray(res.solutionList) || !res.solutionList.length) continue;
                                    if (!expectedBiz) {
                                        post(true, res);
                                        return;
                                    }
                                    const storeBiz = normalizeBiz((res.storeData && res.storeData.bizCode) || res.bizCode || '');
                                    const matched = res.solutionList.some((solution) => (
                                        normalizeBiz((solution && solution.bizCode) || storeBiz) === expectedBiz
                                    )) || (storeBiz && storeBiz === expectedBiz);
                                    if (matched) {
                                        post(true, res);
                                        return;
                                    }
                                    if (!fallback) fallback = res;
                                } catch { }
                            }
                            if (!expectedBiz && fallback) {
                                post(true, fallback);
                                return;
                            }
                            post(true, null);
                        };
                        run().catch(() => post(false, null));
                    })();`;
                    (document.documentElement || document.head || document.body).appendChild(script);
                    script.remove();
                } catch {
                    finalize(null);
                }
            });
        };

        const invokeMainVframe = async (method, ...args) => {
            const all = await getAllVframes();
            const ids = Object.keys(all);
            if (!ids.length) return null;
            const expectedBizCode = method === 'getSolutionData'
                ? normalizeSceneBizCode(parseRouteParamFromHash('bizCode'))
                : '';

            const rankedIds = [
                ...ids.filter(id => id.includes('universalBP_common_layout_main_content')),
                ...ids.filter(id => !id.includes('universalBP_common_layout_main_content') && id.includes('main_content')),
                ...ids.filter(id => !id.includes('main_content') && id.includes('universalBP_common_layout')),
                ...ids.filter(id => !id.includes('universalBP_common_layout') && id.toLowerCase().includes('onebp')),
                ...ids.filter(id => !id.toLowerCase().includes('onebp'))
            ];

            const tried = new Set();
            let fallbackSolutionData = null;
            for (const id of rankedIds) {
                if (tried.has(id)) continue;
                tried.add(id);
                const vf = all[id];
                if (!vf || typeof vf.invoke !== 'function') continue;
                try {
                    const result = await vf.invoke(method, ...args);
                    if (method === 'getSolutionData') {
                        if (result && Array.isArray(result.solutionList) && result.solutionList.length) {
                            if (!expectedBizCode) return result;
                            const storeBizCode = normalizeSceneBizCode(result?.storeData?.bizCode || result?.bizCode || '');
                            const hasExpectedBizCode = result.solutionList.some(solution => (
                                normalizeSceneBizCode(solution?.bizCode || solution?.campaign?.bizCode || storeBizCode) === expectedBizCode
                            )) || (storeBizCode && storeBizCode === expectedBizCode);
                            if (hasExpectedBizCode) return result;
                            if (!fallbackSolutionData) fallbackSolutionData = result;
                            continue;
                        }
                        if (result !== null && result !== undefined && !expectedBizCode) {
                            return result;
                        }
                    } else if (result !== null && result !== undefined) {
                        return result;
                    }
                } catch { }
            }
            if (method === 'getSolutionData') {
                if (!expectedBizCode && fallbackSolutionData) return fallbackSolutionData;
                return null;
            }
            return null;
        };

        const readCheckedValue = (acceptedValues = []) => {
            const checked = Array.from(document.querySelectorAll('input[type="radio"]:checked'));
            const found = checked.find(el => acceptedValues.includes(el.value));
            return found ? found.value : '';
        };

        const inferRuntimeFromDom = () => {
            const routeBizCode = normalizeSceneBizCode(parseRouteParamFromHash('bizCode') || DEFAULTS.bizCode);
            const useKeywordDefaults = !routeBizCode || routeBizCode === DEFAULTS.bizCode;
            const routePromotionScene = parseRouteParamFromHash('promotionScene');
            const promotionScene = routePromotionScene || readCheckedValue([
                'promotion_scene_search_user_define',
                'promotion_scene_search_detent',
                'promotion_scene_search_trend',
                'promotion_scene_golden_traffic_card_package'
            ]) || (useKeywordDefaults ? DEFAULTS.promotionScene : '');
            const itemSelectedMode = readCheckedValue(['user_define', 'shop']) || (useKeywordDefaults ? DEFAULTS.itemSelectedMode : '');
            const bidTypeV2 = readCheckedValue(['smart_bid', 'custom_bid']) || (useKeywordDefaults ? DEFAULTS.bidTypeV2 : '');
            const dmcType = readCheckedValue(['normal', 'total', 'day_freeze', 'day_average']) || DEFAULTS.dmcType;
            const budgetInput = document.querySelector('input[placeholder*="预算"], input[aria-label*="预算"], input[title*="预算"]');
            const budgetValue = budgetInput ? toNumber(budgetInput.value, NaN) : NaN;
            const dayAverageBudget = Number.isFinite(budgetValue) && budgetValue > 0 ? budgetValue : '';
            return {
                bizCode: routeBizCode || DEFAULTS.bizCode,
                promotionScene,
                itemSelectedMode,
                bidTypeV2,
                dmcType,
                dayAverageBudget
            };
        };

        const getRuntimeDefaults = async (forceRefresh = false) => {
            if (!forceRefresh && runtimeCache.value) {
                return deepClone(runtimeCache.value);
            }

            const routeBizCode = normalizeSceneBizCode(parseRouteParamFromHash('bizCode'));
            const domDefaults = inferRuntimeFromDom();
            const runtime = {
                ...DEFAULTS,
                ...domDefaults,
                solutionTemplate: null,
                storeData: null
            };
            if (routeBizCode) {
                runtime.bizCode = routeBizCode;
                if (routeBizCode !== DEFAULTS.bizCode) {
                    runtime.promotionScene = domDefaults.promotionScene || '';
                    runtime.itemSelectedMode = domDefaults.itemSelectedMode || '';
                    runtime.bidTypeV2 = domDefaults.bidTypeV2 || '';
                    runtime.bidTargetV2 = '';
                    runtime.optimizeTarget = '';
                }
            }

            let solutionData = await invokeMainVframe('getSolutionData');
            if ((!solutionData || !Array.isArray(solutionData.solutionList) || !solutionData.solutionList.length)) {
                const bridgedSolutionData = await invokeSolutionDataViaPageBridge(routeBizCode, {
                    timeoutMs: 6200
                });
                if (bridgedSolutionData && Array.isArray(bridgedSolutionData.solutionList) && bridgedSolutionData.solutionList.length) {
                    solutionData = bridgedSolutionData;
                }
            }
            if (solutionData && Array.isArray(solutionData.solutionList) && solutionData.solutionList.length) {
                const matchedSolution = routeBizCode
                    ? solutionData.solutionList.find(solution => normalizeSceneBizCode(
                        solution?.bizCode || solution?.campaign?.bizCode || solutionData?.storeData?.bizCode || ''
                    ) === routeBizCode)
                    : null;
                const firstSolution = deepClone(matchedSolution || solutionData.solutionList[0]);
                const templateBizCode = normalizeSceneBizCode(
                    firstSolution?.bizCode || firstSolution?.campaign?.bizCode || solutionData?.storeData?.bizCode || ''
                );
                // 路由已知时，模板必须携带同场景 bizCode 才可复用，避免串用上一个场景模板。
                const shouldUseTemplate = !routeBizCode || (templateBizCode && templateBizCode === routeBizCode);
                if (shouldUseTemplate && firstSolution) {
                    runtime.solutionTemplate = {
                        bizCode: templateBizCode || runtime.bizCode,
                        campaign: sanitizeCampaign(firstSolution.campaign || {}),
                        adgroupList: Array.isArray(firstSolution.adgroupList)
                            ? firstSolution.adgroupList.map(sanitizeAdgroup)
                            : []
                    };
                }

                const storeData = deepClone(solutionData.storeData || {});
                const storeDataBizCode = normalizeSceneBizCode(storeData?.bizCode || runtime?.solutionTemplate?.bizCode || '');
                if (!routeBizCode || (storeDataBizCode && storeDataBizCode === routeBizCode)) {
                    runtime.storeData = storeData;
                }

                runtime.bizCode = normalizeSceneBizCode(runtime.solutionTemplate?.bizCode || runtime.bizCode);
                runtime.itemSelectedMode = runtime.storeData?.itemSelectedMode || runtime.itemSelectedMode;
                runtime.promotionScene = runtime.storeData?.promotionScene || runtime.promotionScene;
                runtime.bidTypeV2 = runtime.storeData?.bidTypeV2 || runtime.bidTypeV2;
                runtime.bidTargetV2 = runtime.storeData?.bidTargetV2 || runtime.bidTargetV2;
                runtime.dmcType = runtime.storeData?.dmcType || runtime.solutionTemplate?.campaign?.dmcType || runtime.dmcType;
                BUDGET_FIELDS.forEach(field => {
                    if (runtime.storeData?.[field] !== undefined && runtime.storeData?.[field] !== null && runtime.storeData?.[field] !== '') {
                        runtime[field] = runtime.storeData[field];
                    } else if (runtime.solutionTemplate?.campaign?.[field] !== undefined && runtime.solutionTemplate?.campaign?.[field] !== null && runtime.solutionTemplate?.campaign?.[field] !== '') {
                        runtime[field] = runtime.solutionTemplate.campaign[field];
                    }
                });
                if (runtime.storeData?.dayAverageBudget) {
                    runtime.dayAverageBudget = runtime.storeData.dayAverageBudget;
                }
            }

            runtimeCache.value = runtime;
            runtimeCache.ts = Date.now();
            return deepClone(runtime);
        };

        const SCENE_NAME_LIST = ['货品全站推广', '关键词推广', '人群推广', '店铺直达', '内容营销', '线索推广'];
        const SCENE_BIZCODE_HINT_FALLBACK = {
            '货品全站推广': 'onebpSite',
            '关键词推广': 'onebpSearch',
            '人群推广': 'onebpDisplay',
            '店铺直达': 'onebpStarShop',
            '内容营销': 'onebpLive',
            '线索推广': 'onebpAdStrategyLiuZi'
        };
        const SCENE_BIZCODE_ALIAS_MAP = {
            onebpSite: 'onebpSite',
            onebpSearch: 'onebpSearch',
            onebpDisplay: 'onebpDisplay',
            onebpShopMarketing: 'onebpStarShop',
            onebpStarShop: 'onebpStarShop',
            onebpContentMarketing: 'onebpLive',
            onebpLive: 'onebpLive',
            onebpAdStrategyLiuZi: 'onebpAdStrategyLiuZi'
        };
        const normalizeSceneBizCode = (bizCode = '') => {
            const normalized = String(bizCode || '').trim();
            if (!normalized) return '';
            return String(SCENE_BIZCODE_ALIAS_MAP[normalized] || normalized).trim();
        };
        const resolveRuntimeBizCode = (runtime = {}) => {
            const candidates = [
                runtime?.solutionTemplate?.bizCode,
                runtime?.storeData?.bizCode,
                runtime?.bizCode
            ];
            for (const candidate of candidates) {
                const normalized = normalizeSceneBizCode(candidate);
                if (normalized) return normalized;
            }
            return '';
        };
        const isRuntimeBizCodeMatched = (runtime = {}, expectedBizCode = '', options = {}) => {
            const expected = normalizeSceneBizCode(expectedBizCode);
            if (!expected) return true;
            const coreCandidates = [
                runtime?.bizCode,
                runtime?.solutionTemplate?.bizCode,
                runtime?.storeData?.bizCode
            ].map(item => normalizeSceneBizCode(item)).filter(Boolean);
            if (coreCandidates.length) {
                return coreCandidates.includes(expected);
            }
            if (options?.includeRoute === false) return false;
            const routeBizCode = normalizeSceneBizCode(parseRouteParamFromHash('bizCode'));
            return !!routeBizCode && routeBizCode === expected;
        };
        const SCENE_REQUIRE_ITEM_FALLBACK = {
            '货品全站推广': true,
            '关键词推广': true,
            '人群推广': true,
            '店铺直达': false,
            '内容营销': false,
            '线索推广': true
        };
        const SCENE_FORCE_ADGROUP_MATERIAL = {
            '货品全站推广': true,
            '关键词推广': true,
            '店铺直达': true,
            '内容营销': true
        };
        const SCENE_SKIP_TEXT_RE = /^(上手指南|了解更多|了解详情|思考过程|立即投放|生成其他策略|创建完成|保存并关闭|清空|升级|收起|展开)$/;
        const SCENE_FIELD_LABEL_RE = /^(场景名称|营销目标|计划名称|预算类型|出价方式|出价目标|选品方式|关键词设置|核心词设置|人群设置|创意设置|添加商品|选择推广商品|选择解决方案|设置计划组|收集销售线索|投放资源位\/投放地域\/投放时间|推广模式|投放策略|优化目标|投放日期|投放时间|选择卡位方案|卡位方式|种子人群|套餐包|选择拉新方案|选择方式|选择方案|选择优化方向|选择推广主体|设置拉新人群|设置词包|设置人群|设置创意|设置落地页|设置宝贝落地页|设置出价及预算|设置预算及排期|设置商品推广方案)$/;
        const SCENE_SECTION_ONLY_LABEL_RE = /^(营销场景与目标|营销场景|推广方案设置(?:-.+)?|推广方案设置|设置预算(?:及排期)?|设置基础信息|高级设置|创建完成|收集销售线索|行业解决方案|自定义方案)$/;
        const SCENE_LABEL_NOISE_RE = /[，。,！？!；;]/;
        const SCENE_LABEL_NOISE_PREFIX_RE = /^(请|建议|支持|算法|未添加|如有|当前|完成后|符合条件|在投商品|想探测|卡位客户都在玩|流量规模)/;
        const SCENE_LABEL_NOISE_CONTENT_RE = /(上手指南|了解|可覆盖|预计|提升|完成添加后|完成后可|默认屏蔽|系统默认|仅需|一键创建|投放效果|智能分配|介绍|说明|提示|攻略)/;
        const SCENE_OPTION_NOISE_RE = /(步骤|近\d+天|上涨|详情|一键|分析|策略属性|案例|案例魔方|帮我快速|竞争案例|搜更多|完成|主播|主播ID|ID：|HOT|NEW|思考过程|上手指南|了解更多|点击查看|推荐理由|覆盖|潜力|同比|环比|一站式|能力介绍|定制投放策略|分行业定制)/i;
        const SCENE_DYNAMIC_FIELD_BLOCK_RE = /(步骤|案例|同行|上涨|关键作用|全链路|打造|双出价模式|近\d+天|一键|详情|主播|ID|HOT|NEW|分析|策略属性|匹配到|完成|覆盖|潜力|同比|环比|帮我快速|竞争案例|已设置\d+个关键词|修改匹配方案)/i;
        const SCENE_KEYWORD_HINT_RE = /(设置|选择|预算|出价|关键词|人群|创意|商品|投放|落地页|线索|计划|方案|目标|资源位|地域|时间|店铺|内容|货品)/;
        const SCENE_FORBIDDEN_ACTION_RE = /(创建完成|立即投放|保存并关闭|确认提交|提交并投放|提交计划|确认投放|创建计划|确定提交|提交审核)/;
        const SCENE_SECTION_HINT_RE = /(营销场景与目标|推广方案设置|选择推广商品|设置出价及预算|设置预算及排期|设置基础信息|高级设置|设置商品推广方案|设置落地页|收集销售线索|设置创意|设置推广方案|设置计划组|核心词设置|设置拉新人群|投放日期|投放时间|设置人群|选择解决方案)/;
        const SCENE_REQUIRED_GUESS_RE = /(预算|出价|目标|计划名称|计划名|商品|关键词|人群|投放|创意|方式|类型|落地页|线索|方案)/;
        const SCENE_GOAL_GROUP_HINT_RE = /(营销目标|优化目标|投放目标|目标)/;
        const SCENE_GOAL_OPTION_HINT_RE = /(卡位|趋势|金卡|自定义|拉新|成交|点击|收藏|加购|渗透|投产|ROI|线索|留资|观看|转化|曝光|引流|促活|店铺|内容|直播|收集)/i;
        const SCENE_GOAL_OPTION_SKIP_RE = /(添加商品|添加关键词|添加种子人群|设置基础信息|高级设置|预算|出价|计划名称|计划名|上手指南|了解更多|思考过程|保存并关闭|创建完成|立即投放|场景名称|营销场景与目标|设置预算|设置出价|设置推广|投放时间|投放资源位)/;
        const SCENE_GOAL_LABEL_HINTS = [
            '货品全站推广',
            '关键词推广',
            '人群推广',
            '店铺直达',
            '内容营销',
            '线索推广',
            '搜索卡位',
            '趋势明星',
            '流量金卡',
            '自定义推广',
            '高效拉新',
            '竞店拉新',
            '借势转化',
            '机会人群拉新',
            '跨类目拉新',
            '直播间成长',
            '商品打爆',
            '拉新增粉',
            '全站推广',
            '收集销售线索',
            '行业解决方案'
        ];
        const SCENE_GOAL_RUNTIME_KEYS = [
            'bizCode',
            'promotionScene',
            'optimizeTarget',
            'bidTypeV2',
            'bidTargetV2',
            'orderChargeType',
            'dmcType',
            'itemSelectedMode',
            'subPromotionType',
            'promotionType',
            'promotionModel',
            'promotionModelMarketing'
        ];
        const SCENE_CREATE_ENDPOINT_FALLBACK = '/solution/addList.json';
        const SCENE_BIZCODE_TO_NAME_FALLBACK = Object.keys(SCENE_BIZCODE_HINT_FALLBACK).reduce((acc, sceneName) => {
            const bizCode = String(SCENE_BIZCODE_HINT_FALLBACK[sceneName] || '').trim();
            if (!bizCode || acc[bizCode]) return acc;
            acc[bizCode] = sceneName;
            return acc;
        }, {});
        const GOAL_CONTRACT_RUNTIME_PATCH_KEYS = [
            'promotionScene',
            'optimizeTarget',
            'bidTypeV2',
            'bidTargetV2',
            'orderChargeType',
            'dmcType',
            'itemSelectedMode',
            'subPromotionType',
            'promotionType',
            'promotionModel',
            'promotionModelMarketing',
            'selectedTargetBizCode',
            'dmpSolutionId',
            'activityId',
            'specialSourceForMainStep',
            'bpStrategyId',
            'bpStrategyType',
            'subOptimizeTarget'
        ];
        const SCENE_SPEC_CACHE_STORAGE_KEY = 'am.wxt.plan_api.scene_spec_cache.v2';
        const SCENE_SPEC_CACHE_TTL_MS = 12 * 60 * 60 * 1000;
        const SCENE_CREATE_CONTRACT_CACHE_STORAGE_KEY = 'am.wxt.plan_api.scene_contract_cache.v1';
        const SCENE_CREATE_CONTRACT_CACHE_TTL_MS = 12 * 60 * 60 * 1000;
        const SCENE_SPEC_FIELD_FALLBACK = {
            '货品全站推广': {
                营销目标: '货品全站推广',
                选品方式: '自定义选品',
                预算类型: '每日预算'
            },
            '关键词推广': {
                营销目标: '自定义推广',
                出价方式: '智能出价',
                出价目标: '获取成交量',
                预算类型: '每日预算',
                核心词设置: '添加关键词'
            },
            '人群推广': {
                营销目标: '高效拉新',
                选品方式: '自定义选品',
                预算类型: '每日预算'
            },
            '店铺直达': {
                推广模式: '持续推广',
                预算类型: '每日预算'
            },
            '内容营销': {
                营销目标: '直播间成长',
                优化目标: '增加净成交金额',
                出价方式: '最大化拿量',
                预算类型: '每日预算'
            },
            '线索推广': {
                营销目标: '收集销售线索',
                解决方案: '行业解决方案',
                出价方式: '最大化拿量',
                优化目标: '优化留资获客成本',
                预算类型: '每日预算'
            }
        };
        const SCENE_MARKETING_GOAL_FALLBACK_OPTIONS = {
            '货品全站推广': ['货品全站推广'],
            '关键词推广': ['搜索卡位', '趋势明星', '流量金卡', '自定义推广'],
            '人群推广': ['高效拉新', '竞店拉新', '借势转化', '机会人群拉新', '跨类目拉新'],
            '店铺直达': ['店铺直达'],
            '内容营销': ['直播间成长', '商品打爆', '拉新增粉'],
            '线索推广': ['收集销售线索', '行业解决方案']
        };
        const sceneSpecCache = {
            loaded: false,
            map: {}
        };
        const sceneCreateContractCache = {
            loaded: false,
            map: {}
        };

        const normalizeText = (text = '') => String(text || '').replace(/\s+/g, ' ').trim();
        const normalizeSceneOptionText = (text = '') => normalizeText(text).replace(/[：:]+$/g, '').trim();
        const isLikelySceneOptionValue = (text = '') => {
            const value = normalizeSceneOptionText(text);
            if (!value) return false;
            if (value.length < 1 || value.length > 22) return false;
            if (SCENE_SKIP_TEXT_RE.test(value)) return false;
            if (SCENE_LABEL_NOISE_RE.test(value) || value.includes('·')) return false;
            if (/^\d+(?:[./-]\d+)?$/.test(value)) return false;
            if (/^\d+\s*[.)、]/.test(value)) return false;
            if (SCENE_OPTION_NOISE_RE.test(value)) return false;
            if (SCENE_LABEL_NOISE_PREFIX_RE.test(value)) return false;
            if (SCENE_LABEL_NOISE_CONTENT_RE.test(value) && value.length > 6) return false;
            return true;
        };
        const normalizeGoalLabel = (text = '') => normalizeText(text).replace(/^\d+\s*/, '').trim();
        const normalizeGoalCandidateLabel = (text = '') => {
            const normalized = normalizeGoalLabel(text);
            if (!normalized) return '';
            const exact = SCENE_GOAL_LABEL_HINTS.find(item => item === normalized);
            if (exact) return exact;
            const included = SCENE_GOAL_LABEL_HINTS
                .filter(item => normalized.includes(item))
                .sort((a, b) => b.length - a.length)[0];
            if (included) return included;
            const segments = normalized
                .split(/[，,。；;！!？?：:、|/]/)
                .map(item => normalizeGoalLabel(item))
                .filter(Boolean);
            const segmentPicked = segments.find(item => item.length >= 2 && item.length <= 24) || '';
            const compact = normalizeGoalLabel(segmentPicked || normalized);
            return compact.length > 22 ? compact.slice(0, 22) : compact;
        };
        const normalizeGoalKey = (text = '') => {
            const normalized = normalizeGoalCandidateLabel(text)
                .toLowerCase()
                .replace(/[^\w\u4e00-\u9fa5]+/g, '_')
                .replace(/^_+|_+$/g, '');
            return normalized || 'default_goal';
        };
        const getSceneMarketingGoalFallbackList = (sceneName = '') => {
            const scene = String(sceneName || '').trim();
            const list = Array.isArray(SCENE_MARKETING_GOAL_FALLBACK_OPTIONS[scene])
                ? SCENE_MARKETING_GOAL_FALLBACK_OPTIONS[scene]
                : [];
            return uniqueBy(
                list
                    .map(item => normalizeGoalCandidateLabel(item))
                    .filter(Boolean),
                item => item
            ).slice(0, 20);
        };
        const isLikelyGoalOptionText = (text = '') => {
            const normalized = normalizeGoalCandidateLabel(text);
            if (!normalized) return false;
            if (normalized.length < 2 || normalized.length > 22) return false;
            if (SCENE_SKIP_TEXT_RE.test(normalized)) return false;
            if (SCENE_GOAL_OPTION_SKIP_RE.test(normalized)) return false;
            if (SCENE_GOAL_OPTION_HINT_RE.test(normalized)) return true;
            return SCENE_GOAL_LABEL_HINTS.some(item => item.includes(normalized) || normalized.includes(item));
        };
        const isLikelyGoalGroup = (group = {}) => {
            const label = normalizeText(group?.groupLabel || '');
            const options = Array.isArray(group?.options) ? group.options : [];
            const optionTexts = options.map(item => normalizeGoalLabel(item?.optionText || '')).filter(Boolean);
            if (optionTexts.length < 2) return false;
            if (/场景名称/.test(label)) return false;
            if (label && /预算|出价|计划名称|计划名|投放时间|预算类型|出价方式|出价目标/.test(label)) return false;
            if (SCENE_GOAL_GROUP_HINT_RE.test(label)) return true;
            if (optionTexts.some(text => isLikelyGoalOptionText(text))) return true;
            return false;
        };
        const scoreGoalGroup = (group = {}) => {
            const label = normalizeText(group?.groupLabel || '');
            const options = Array.isArray(group?.options) ? group.options : [];
            const optionTexts = options.map(item => normalizeGoalLabel(item?.optionText || '')).filter(Boolean);
            let score = 0;
            if (SCENE_GOAL_GROUP_HINT_RE.test(label)) score += 120;
            if (/营销目标/.test(label)) score += 80;
            if (/优化目标/.test(label)) score += 40;
            if (optionTexts.some(text => isLikelyGoalOptionText(text))) score += 30;
            if (Number.isFinite(group?.top) && group.top >= 100 && group.top <= 560) score += 16;
            if (optionTexts.length >= 2 && optionTexts.length <= 8) score += 12;
            if (optionTexts.some(text => /预算|出价|投放时间/.test(text))) score -= 45;
            return score;
        };
        const collectMarketingGoalCandidates = (root) => {
            const collectFromDataCards = () => {
                const targetRoot = root || pickPlanConfigRoot();
                const cards = Array.from(targetRoot.querySelectorAll('[data-card*="_card_"]'));
                const candidates = cards.map(card => {
                    if (!isElementVisible(card)) return null;
                    const dataCard = String(card.getAttribute('data-card') || '').trim();
                    if (!dataCard) return null;
                    if (!/(promotion_scene|goal|target|optimize|order_charge|solution|promotion_model)/i.test(dataCard)) return null;
                    const fullText = normalizeText(card.textContent || '');
                    if (!fullText) return null;
                    const byHints = SCENE_GOAL_LABEL_HINTS
                        .filter(item => fullText.includes(item))
                        .sort((a, b) => b.length - a.length)[0] || '';
                    const optionText = normalizeGoalLabel(
                        byHints
                        || normalizeGoalCandidateLabel(getOwnText(card) || '')
                        || normalizeGoalCandidateLabel(
                            Array.from(card.querySelectorAll('span,div,strong,label'))
                                .map(el => normalizeGoalCandidateLabel(getOwnText(el) || ''))
                                .find(Boolean)
                        )
                        || ''
                    );
                    const goalLabel = normalizeGoalCandidateLabel(optionText);
                    if (!goalLabel || SCENE_GOAL_OPTION_SKIP_RE.test(goalLabel)) return null;
                    const labelText = normalizeText(findNearestLabelText(card) || '');
                    const groupLabel = SCENE_GOAL_GROUP_HINT_RE.test(labelText) ? labelText : '营销目标';
                    const rect = card.getBoundingClientRect();
                    const clickEl = card.querySelector?.('label,[role="radio"],button,[role="button"],input[type="radio"]') || card;
                    const selected = isLikelySelectedElement(card)
                        || isLikelySelectedElement(clickEl)
                        || String(card.getAttribute('aria-checked') || '') === 'true';
                    const disabled = String(card.getAttribute('aria-disabled') || '') === 'true';
                    return {
                        groupKey: `${groupLabel}_${Math.round(rect.top / 24)}_${Math.round(rect.left / 80)}`,
                        groupLabel,
                        optionText,
                        goalLabel,
                        selected,
                        disabled,
                        top: Math.round(rect.top),
                        left: Math.round(rect.left),
                        clickEl
                    };
                }).filter(Boolean);
                return uniqueBy(
                    candidates,
                    item => `${item.groupLabel}::${item.goalLabel || item.optionText}`
                ).slice(0, 18);
            };
            const groups = collectLayerControlGroups(root)
                .filter(group => isLikelyGoalGroup(group))
                .map(group => ({ ...group, _goalScore: scoreGoalGroup(group) }))
                .sort((a, b) => (b._goalScore - a._goalScore) || (a.top - b.top));
            const fromGroups = groups.length
                ? groups[0].options
                .map(option => ({
                    groupKey: groups[0].groupKey,
                    groupLabel: groups[0].groupLabel,
                    optionText: normalizeGoalLabel(option.optionText || ''),
                    goalLabel: normalizeGoalCandidateLabel(option.optionText || ''),
                    selected: !!option.selected,
                    disabled: !!option.disabled,
                    top: groups[0].top,
                    left: groups[0].left
                }))
                .filter(option => option.optionText && !option.disabled)
                .filter(option => !SCENE_GOAL_OPTION_SKIP_RE.test(option.goalLabel || option.optionText))
                .filter(option => isLikelyGoalOptionText(option.goalLabel || option.optionText) || option.selected)
                .slice(0, 12)
                : [];
            const fromCards = collectFromDataCards();
            const merged = uniqueBy(
                fromGroups.concat(fromCards.map(item => ({
                    groupKey: item.groupKey,
                    groupLabel: item.groupLabel,
                    optionText: item.optionText,
                    goalLabel: item.goalLabel,
                    selected: !!item.selected,
                    disabled: !!item.disabled,
                    top: item.top,
                    left: item.left
                }))),
                item => `${item.groupLabel || ''}::${item.goalLabel || item.optionText}`
            ).slice(0, 16);
            return merged;
        };
        const parseCaptureBody = (rawBody) => {
            if (rawBody === undefined || rawBody === null || rawBody === '') return null;
            if (isPlainObject(rawBody)) return rawBody;
            if (typeof rawBody !== 'string') {
                try {
                    const text = String(rawBody);
                    if (!text) return null;
                    rawBody = text;
                } catch {
                    return null;
                }
            }
            const text = String(rawBody || '').trim();
            if (!text) return null;
            try {
                return JSON.parse(text);
            } catch { }
            try {
                const params = new URLSearchParams(text);
                const out = {};
                for (const [key, value] of params.entries()) out[key] = value;
                return Object.keys(out).length ? out : null;
            } catch {
                return null;
            }
        };
        const normalizeCaptureMethod = (method = '') => {
            const normalized = String(method || '').trim().toUpperCase();
            return normalized || 'POST';
        };
        const normalizeCapturePath = (rawUrl = '') => {
            try {
                const url = new URL(String(rawUrl || ''), window.location.origin);
                return String(url.pathname || '').trim();
            } catch {
                return '';
            }
        };
        const createGoalCaptureSession = (options = {}) => {
            const hooks = (() => {
                const existing = window.__AM_HOOK_MANAGER__;
                if (existing && typeof existing.install === 'function') return existing;
                if (typeof createHookManager === 'function') {
                    try {
                        return createHookManager();
                    } catch { }
                }
                return null;
            })();
            if (!hooks || typeof hooks.install !== 'function') {
                throw new Error('hook_manager_unavailable');
            }
            hooks.install();
            const includePattern = options.includePattern instanceof RegExp
                ? options.includePattern
                : /\.json(?:$|\?)/i;
            const records = [];
            const pushRecord = (entry = {}) => {
                const path = normalizeCapturePath(entry?.url || '');
                if (!path || !includePattern.test(path)) return;
                const body = parseCaptureBody(entry?.body);
                records.push({
                    ts: Date.now(),
                    method: normalizeCaptureMethod(entry?.method),
                    path,
                    queryKeys: (() => {
                        try {
                            const url = new URL(String(entry?.url || ''), window.location.origin);
                            return uniqueBy(Array.from(url.searchParams.keys()).filter(Boolean), item => item).slice(0, 80);
                        } catch {
                            return [];
                        }
                    })(),
                    bodyKeys: body && typeof body === 'object'
                        ? uniqueBy(Object.keys(body).filter(Boolean), item => item).slice(0, 160)
                        : [],
                    sampleBody: body && typeof body === 'object'
                        ? Object.keys(body).slice(0, 24).reduce((acc, key) => {
                            acc[key] = body[key];
                            return acc;
                        }, {})
                        : null
                });
            };
            const offFetch = hooks.registerFetch(({ args, response }) => {
                const first = args?.[0];
                const second = args?.[1];
                const method = second?.method
                    || first?.method
                    || 'GET';
                const url = typeof first === 'string'
                    ? first
                    : first?.url || response?.url || '';
                const body = second?.body || first?.body || '';
                pushRecord({ method, url, body });
            });
            const offXhrSend = hooks.registerXHRSend(({ method, url, data }) => {
                pushRecord({
                    method: method || 'POST',
                    url,
                    body: data
                });
            });
            let cursor = 0;
            return {
                records,
                mark() {
                    cursor = records.length;
                    return cursor;
                },
                sliceFrom(start = cursor) {
                    const idx = Number.isFinite(start) && start >= 0 ? Math.floor(start) : 0;
                    return records.slice(idx).map(item => ({ ...item }));
                },
                stop() {
                    try { offFetch?.(); } catch { }
                    try { offXhrSend?.(); } catch { }
                }
            };
        };
        const summarizeGoalLoadContracts = (records = []) => {
            if (!Array.isArray(records) || !records.length) return [];
            const map = new Map();
            records.forEach(record => {
                const method = normalizeCaptureMethod(record?.method);
                const path = normalizeCapturePath(record?.path || '');
                if (!path) return;
                const key = `${method} ${path}`;
                if (!map.has(key)) {
                    map.set(key, {
                        method,
                        path,
                        count: 0,
                        queryKeys: new Set(),
                        bodyKeys: new Set(),
                        sampleBody: null
                    });
                }
                const bucket = map.get(key);
                bucket.count += 1;
                (record?.queryKeys || []).forEach(item => bucket.queryKeys.add(item));
                (record?.bodyKeys || []).forEach(item => bucket.bodyKeys.add(item));
                if (!bucket.sampleBody && isPlainObject(record?.sampleBody)) {
                    bucket.sampleBody = deepClone(record.sampleBody);
                }
            });
            return Array.from(map.values())
                .map(item => ({
                    method: item.method,
                    path: item.path,
                    count: item.count,
                    queryKeys: Array.from(item.queryKeys).slice(0, 80),
                    bodyKeys: Array.from(item.bodyKeys).slice(0, 160),
                    sampleBody: item.sampleBody || null
                }))
                .sort((a, b) => b.count - a.count || a.path.localeCompare(b.path))
                .slice(0, 120);
        };
        const mergeContractSummaries = (contracts = []) => {
            if (!Array.isArray(contracts) || !contracts.length) return [];
            const map = new Map();
            contracts.forEach(contract => {
                const method = normalizeCaptureMethod(contract?.method);
                const path = normalizeCapturePath(contract?.path || '');
                if (!path) return;
                const key = `${method} ${path}`;
                if (!map.has(key)) {
                    map.set(key, {
                        method,
                        path,
                        count: 0,
                        queryKeys: new Set(),
                        bodyKeys: new Set(),
                        sampleBody: null
                    });
                }
                const bucket = map.get(key);
                bucket.count += Math.max(1, toNumber(contract?.count, 1));
                (contract?.queryKeys || []).forEach(item => {
                    const text = normalizeText(item);
                    if (text) bucket.queryKeys.add(text);
                });
                (contract?.bodyKeys || []).forEach(item => {
                    const text = normalizeText(item);
                    if (text) bucket.bodyKeys.add(text);
                });
                if (!bucket.sampleBody && isPlainObject(contract?.sampleBody)) {
                    bucket.sampleBody = deepClone(contract.sampleBody);
                }
            });
            return Array.from(map.values()).map(item => ({
                method: item.method,
                path: item.path,
                count: item.count,
                queryKeys: Array.from(item.queryKeys).slice(0, 120),
                bodyKeys: Array.from(item.bodyKeys).slice(0, 240),
                sampleBody: item.sampleBody || null
            })).sort((a, b) => b.count - a.count || a.path.localeCompare(b.path));
        };
        const isGoalCreateSubmitPath = (path = '') => /\/solution\/(?:business\/)?addList\.json$/i.test(String(path || '').trim());
        const pickGoalCreateSubmitContract = (contracts = []) => {
            const list = (Array.isArray(contracts) ? contracts : [])
                .filter(item => isGoalCreateSubmitPath(item?.path || ''))
                .sort((a, b) => {
                    const countDiff = toNumber(b?.count, 0) - toNumber(a?.count, 0);
                    if (countDiff !== 0) return countDiff;
                    const aBusiness = /\/solution\/business\/addList\.json$/i.test(String(a?.path || '')) ? 1 : 0;
                    const bBusiness = /\/solution\/business\/addList\.json$/i.test(String(b?.path || '')) ? 1 : 0;
                    return bBusiness - aBusiness;
                });
            return list[0] || null;
        };
        const tryParseMaybeJSON = (raw) => {
            if (isPlainObject(raw) || Array.isArray(raw)) return raw;
            const text = String(raw || '').trim();
            if (!text) return null;
            try {
                return JSON.parse(text);
            } catch {
                return null;
            }
        };
        const findSolutionPayloadFromSample = (sampleBody = null) => {
            if (!isPlainObject(sampleBody)) return { requestBody: {}, solution: {} };
            const directSolutionList = Array.isArray(sampleBody.solutionList) ? sampleBody.solutionList : tryParseMaybeJSON(sampleBody.solutionList);
            if (Array.isArray(directSolutionList) && isPlainObject(directSolutionList[0])) {
                return {
                    requestBody: sampleBody,
                    solution: directSolutionList[0]
                };
            }
            const nestedCandidates = [
                sampleBody.request,
                sampleBody.params,
                sampleBody.data,
                sampleBody.payload
            ].filter(isPlainObject);
            for (const nested of nestedCandidates) {
                const nestedSolutionList = Array.isArray(nested.solutionList) ? nested.solutionList : tryParseMaybeJSON(nested.solutionList);
                if (Array.isArray(nestedSolutionList) && isPlainObject(nestedSolutionList[0])) {
                    return {
                        requestBody: nested,
                        solution: nestedSolutionList[0]
                    };
                }
            }
            return {
                requestBody: sampleBody,
                solution: {}
            };
        };
        const summarizeCreateInterfacesFromContracts = (contracts = []) => {
            const createContracts = mergeContractSummaries(contracts || [])
                .filter(item => isGoalCreateSubmitPath(item?.path || ''));
            return createContracts.map(item => {
                const payloadSample = findSolutionPayloadFromSample(item?.sampleBody || null);
                const requestBody = isPlainObject(payloadSample?.requestBody) ? payloadSample.requestBody : {};
                const solution = isPlainObject(payloadSample?.solution) ? payloadSample.solution : {};
                const campaign = isPlainObject(solution?.campaign) ? solution.campaign : {};
                const adgroup = Array.isArray(solution?.adgroupList) && isPlainObject(solution.adgroupList[0])
                    ? solution.adgroupList[0]
                    : {};
                const requestKeys = Object.keys(requestBody || {}).slice(0, 240);
                const solutionKeys = Object.keys(solution || {}).slice(0, 240);
                return {
                    method: normalizeCaptureMethod(item?.method || 'POST'),
                    path: normalizeCapturePath(item?.path || ''),
                    count: toNumber(item?.count, 0),
                    requestKeys: requestKeys.length ? requestKeys : (Array.isArray(item?.bodyKeys) ? item.bodyKeys.slice(0, 240) : []),
                    solutionKeys,
                    campaignKeys: Object.keys(campaign || {}).slice(0, 240),
                    adgroupKeys: Object.keys(adgroup || {}).slice(0, 240),
                    sampleBody: isPlainObject(item?.sampleBody) ? deepClone(item.sampleBody) : null
                };
            }).slice(0, 80);
        };
        const mergeInterfaceKeyList = (lists = [], limit = 320) => uniqueBy(
            (Array.isArray(lists) ? lists : [])
                .flatMap(list => (Array.isArray(list) ? list : []))
                .map(item => normalizeText(item))
                .filter(Boolean),
            item => item
        ).slice(0, limit);
        const summarizeCreateInterfaceHints = (createInterfaces = []) => {
            const list = Array.isArray(createInterfaces) ? createInterfaces : [];
            if (!list.length) {
                return {
                    method: 'POST',
                    path: '',
                    count: 0,
                    requestKeys: [],
                    solutionKeys: [],
                    campaignKeys: [],
                    adgroupKeys: []
                };
            }
            const sorted = list.slice().sort((a, b) => toNumber(b?.count, 0) - toNumber(a?.count, 0));
            const first = sorted[0] || {};
            return {
                method: normalizeCaptureMethod(first?.method || 'POST'),
                path: normalizeCapturePath(first?.path || ''),
                count: sorted.reduce((sum, item) => sum + Math.max(1, toNumber(item?.count, 1)), 0),
                requestKeys: mergeInterfaceKeyList(sorted.map(item => item?.requestKeys), 320),
                solutionKeys: mergeInterfaceKeyList(sorted.map(item => item?.solutionKeys), 320),
                campaignKeys: mergeInterfaceKeyList(sorted.map(item => item?.campaignKeys), 320),
                adgroupKeys: mergeInterfaceKeyList(sorted.map(item => item?.adgroupKeys), 320)
            };
        };
        const rememberSceneCreateInterfaces = (sceneName = '', goalLabel = '', createInterfaces = [], extra = {}) => {
            const scene = String(sceneName || '').trim();
            if (!scene || !Array.isArray(createInterfaces) || !createInterfaces.length) return null;
            const summary = summarizeCreateInterfaceHints(createInterfaces);
            const endpoint = normalizeCapturedCreateEndpoint(summary.path || '');
            const contract = {
                sceneName: scene,
                goalLabel: normalizeGoalCandidateLabel(goalLabel || ''),
                method: summary.method || 'POST',
                endpoint: endpoint || '',
                requestKeys: summary.requestKeys.slice(0, 320),
                solutionKeys: summary.solutionKeys.slice(0, 320),
                campaignKeys: summary.campaignKeys.slice(0, 320),
                adgroupKeys: summary.adgroupKeys.slice(0, 320),
                count: summary.count || 0,
                sampledAt: new Date().toISOString(),
                source: normalizeText(extra?.source || 'network_capture'),
                createInterfaces: deepClone(createInterfaces).slice(0, 80)
            };
            setCachedSceneCreateContract(scene, contract.goalLabel, contract);
            // 场景级兜底合同（无营销目标）。
            setCachedSceneCreateContract(scene, '', contract);
            return contract;
        };
        const resolveGoalCreateEndpoint = (loadContracts = []) => {
            const list = Array.isArray(loadContracts) ? loadContracts : [];
            const createCandidate = list.find(item => /\/solution\/business\/addList\.json$/i.test(item?.path || ''))
                || list.find(item => /\/solution\/addList\.json$/i.test(item?.path || ''));
            return normalizeCapturePath(createCandidate?.path || '') || SCENE_CREATE_ENDPOINT_FALLBACK;
        };

        const collectSceneBizCodeHintsFromPage = () => {
            const map = { ...SCENE_BIZCODE_HINT_FALLBACK };
            try {
                const cards = Array.from(document.querySelectorAll('[data-card*="_card_"]'));
                cards.forEach(card => {
                    const dataCard = String(card.getAttribute('data-card') || '').trim();
                    const suffix = dataCard.replace(/^.*_card_/, '').trim();
                    const mappedBizCode = SCENE_BIZCODE_ALIAS_MAP[suffix] || suffix;
                    if (!mappedBizCode) return;
                    const mappedSceneByBiz = SCENE_BIZCODE_TO_NAME_FALLBACK[mappedBizCode];
                    if (mappedSceneByBiz) {
                        map[mappedSceneByBiz] = mappedBizCode;
                        return;
                    }

                    // 兜底：仅在卡片文本中唯一命中一个场景名时才采纳，避免整段容器文本导致串场景。
                    const text = normalizeText(card.textContent || '');
                    const matchedScenes = SCENE_NAME_LIST.filter(sceneName => text.includes(sceneName));
                    if (matchedScenes.length === 1) {
                        map[matchedScenes[0]] = mappedBizCode;
                    }
                });
            } catch { }
            return map;
        };

        const resolveSceneBizCodeHint = (sceneName = '') => {
            const normalizedScene = String(sceneName || '').trim();
            if (!normalizedScene) return '';
            const map = collectSceneBizCodeHintsFromPage();
            return normalizeSceneBizCode(map[normalizedScene] || '');
        };

        const resolveSceneDefaultPromotionScene = (sceneName = '', fallback = '') => {
            const normalizedScene = String(sceneName || '').trim();
            if (!normalizedScene) return String(fallback || '').trim();
            return String(SCENE_DEFAULT_PROMOTION_SCENE[normalizedScene] || fallback || '').trim();
        };

        const isLikelySectionTitle = (text = '') => {
            if (!text) return false;
            if (text.length < 2 || text.length > 26) return false;
            if (SCENE_SKIP_TEXT_RE.test(text)) return false;
            if (SCENE_FIELD_LABEL_RE.test(text)) return true;
            if (/^(设置.+|选择.+|.+方案设置.*|.+设置)$/.test(text)) return true;
            if (SCENE_KEYWORD_HINT_RE.test(text) && text.length <= 14) return true;
            return false;
        };

        const isLikelyFieldLabel = (text = '') => {
            if (!text) return false;
            if (text.length < 2 || text.length > 28) return false;
            if (SCENE_SKIP_TEXT_RE.test(text)) return false;
            if (SCENE_SECTION_ONLY_LABEL_RE.test(text)) return false;
            if (/^\d+\s*[.)。、]/.test(text)) return false;
            if (SCENE_LABEL_NOISE_RE.test(text)) return false;
            if (text.includes('·')) return false;
            if (SCENE_LABEL_NOISE_PREFIX_RE.test(text)) return false;
            if (SCENE_LABEL_NOISE_CONTENT_RE.test(text)) return false;
            if (SCENE_DYNAMIC_FIELD_BLOCK_RE.test(text)) return false;
            if (SCENE_FIELD_LABEL_RE.test(text)) return true;
            if (!SCENE_KEYWORD_HINT_RE.test(text)) return false;
            return /^(?:(?:设置|选择).+|.+(?:名称|目标|方式|类型|设置|预算|出价|关键词|人群|创意|投放|落地页|线索|计划|方案|计划组|模式))$/.test(text);
        };

        const isElementVisible = (el) => {
            if (!el || !(el instanceof Element)) return false;
            if (el.closest('#am-wxt-keyword-overlay')) return false;
            const style = window.getComputedStyle(el);
            if (style.display === 'none' || style.visibility === 'hidden') return false;
            if (Number(style.opacity) === 0) return false;
            const rect = el.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0
                && rect.bottom > 0 && rect.right > 0
                && rect.top < window.innerHeight && rect.left < window.innerWidth;
        };

        const getOwnText = (el) => {
            if (!el) return '';
            let text = '';
            const nodes = el.childNodes || [];
            for (let i = 0; i < nodes.length; i++) {
                const node = nodes[i];
                if (node?.nodeType === Node.TEXT_NODE) text += node.textContent || '';
            }
            return normalizeText(text);
        };

        const findNearestLabelText = (el) => {
            if (!el) return '';
            const explicit = normalizeText(el.getAttribute?.('aria-label') || el.getAttribute?.('title') || '');
            if (explicit) return explicit;
            const wrapped = el.closest?.('label');
            if (wrapped) {
                const wrappedText = normalizeText(getOwnText(wrapped) || wrapped.textContent || '');
                if (wrappedText && wrappedText.length <= 40) return wrappedText;
            }

            let cursor = el;
            for (let depth = 0; depth < 5 && cursor; depth++) {
                const parent = cursor.parentElement;
                if (!parent) break;

                let prev = cursor.previousElementSibling;
                while (prev) {
                    const prevText = normalizeText(prev.textContent || '');
                    if (prevText && prevText.length <= 30) return prevText;
                    prev = prev.previousElementSibling;
                }

                const parentText = normalizeText(getOwnText(parent));
                if (parentText && parentText.length <= 24) return parentText;
                cursor = parent;
            }

            const placeholder = normalizeText(el.getAttribute?.('placeholder') || '');
            return placeholder;
        };

        const pickPlanConfigRoot = () => {
            const list = Array.from(document.querySelectorAll('div,section,form')).filter(el => {
                if (!isElementVisible(el)) return false;
                const text = normalizeText(el.innerText || el.textContent || '');
                if (!text || text.length < 60) return false;
                if (!text.includes('场景名称')) return false;
                const matchHints = [
                    '设置基础信息',
                    '创建完成',
                    '选择推广商品',
                    '设置出价及预算',
                    '设置预算及排期',
                    '设置商品推广方案',
                    '设置落地页',
                    '选择解决方案'
                ].filter(item => text.includes(item)).length;
                if (matchHints < 2) return false;
                const rect = el.getBoundingClientRect();
                return rect.width >= 760 && rect.height >= 360 && rect.top < 560;
            });
            if (!list.length) return document.body;
            return list.sort((a, b) => {
                const ra = a.getBoundingClientRect();
                const rb = b.getBoundingClientRect();
                const areaA = ra.width * ra.height;
                const areaB = rb.width * rb.height;
                return areaA - areaB;
            })[0];
        };

        const collectVisibleTextEntries = (root) => {
            const out = [];
            const nodes = root.querySelectorAll('div,span,label,button,a,strong,h1,h2,h3,h4,p,li');
            nodes.forEach(el => {
                if (!isElementVisible(el)) return;
                let text = getOwnText(el);
                if (!text && el.childElementCount === 0) text = normalizeText(el.textContent || '');
                if (!text) return;
                if (text.length < 2 || text.length > 80) return;
                const rect = el.getBoundingClientRect();
                out.push({
                    text,
                    top: Math.round(rect.top),
                    left: Math.round(rect.left),
                    tag: el.tagName.toLowerCase()
                });
            });
            out.sort((a, b) => (a.top - b.top) || (a.left - b.left));
            return out;
        };

        const collectControlSchemaFromRoot = (root) => {
            const textEntries = collectVisibleTextEntries(root);
            const textSeen = new Set();
            const uniqueTexts = [];
            textEntries.forEach(entry => {
                if (textSeen.has(entry.text)) return;
                textSeen.add(entry.text);
                uniqueTexts.push(entry.text);
            });

            const radios = uniqueBy(
                Array.from(root.querySelectorAll('[role="radio"], input[type="radio"]')).map(el => {
                    if (!isElementVisible(el)) return null;
                    const text = normalizeText(el.getAttribute?.('aria-label') || el.textContent || findNearestLabelText(el));
                    if (!text) return null;
                    const checked = String(el.getAttribute?.('aria-checked') || '') === 'true'
                        || !!el.checked
                        || el.getAttribute?.('checked') !== null;
                    return {
                        label: findNearestLabelText(el),
                        text,
                        value: el.value || '',
                        checked
                    };
                }).filter(Boolean),
                item => `${item.text}::${item.value}`
            );

            const checkboxes = uniqueBy(
                Array.from(root.querySelectorAll('[role="checkbox"], input[type="checkbox"]')).map(el => {
                    if (!isElementVisible(el)) return null;
                    const text = normalizeText(el.getAttribute?.('aria-label') || el.textContent || findNearestLabelText(el));
                    if (!text) return null;
                    const checked = String(el.getAttribute?.('aria-checked') || '') === 'true'
                        || !!el.checked
                        || el.getAttribute?.('checked') !== null;
                    return {
                        label: findNearestLabelText(el),
                        text,
                        checked,
                        disabled: !!el.disabled || String(el.getAttribute?.('aria-disabled') || '') === 'true'
                    };
                }).filter(Boolean),
                item => item.text
            );

            const selects = Array.from(root.querySelectorAll('select')).filter(isElementVisible).map(el => ({
                label: findNearestLabelText(el),
                value: el.value || '',
                options: Array.from(el.options || []).map(opt => ({
                    label: normalizeText(opt.textContent || ''),
                    value: opt.value,
                    selected: !!opt.selected
                }))
            }));

            const inputs = uniqueBy(
                Array.from(root.querySelectorAll('input:not([type="radio"]):not([type="checkbox"]):not([type="hidden"]), textarea')).map(el => {
                    if (!isElementVisible(el)) return null;
                    return {
                        label: findNearestLabelText(el),
                        type: el.tagName.toLowerCase() === 'textarea' ? 'textarea' : (el.type || 'text'),
                        placeholder: normalizeText(el.getAttribute('placeholder') || ''),
                        value: normalizeText(el.value || ''),
                        disabled: !!el.disabled
                    };
                }).filter(Boolean),
                item => `${item.label}::${item.placeholder}::${item.type}`
            );

            const buttonLike = uniqueBy(
                Array.from(root.querySelectorAll('button, [role="button"], [role="tab"], a')).map(el => {
                    if (!isElementVisible(el)) return '';
                    return normalizeText(el.textContent || '');
                }).filter(text => {
                    if (!text) return false;
                    if (text.length > 24) return false;
                    if (SCENE_SKIP_TEXT_RE.test(text)) return false;
                    return true;
                }),
                text => text
            );

            const optionGroups = uniqueBy(
                Array.from(root.querySelectorAll('div,ul,section')).map(parent => {
                    if (!isElementVisible(parent)) return null;
                    const rect = parent.getBoundingClientRect();
                    if (rect.width < 120 || rect.width > 1300 || rect.height < 24 || rect.height > 280) return null;
                    const plainText = normalizeText(parent.textContent || '');
                    if (!plainText || plainText.length > 280) return null;

                    const options = uniqueBy(
                        Array.from(parent.children || []).map(child => {
                            if (!isElementVisible(child)) return '';
                            let text = getOwnText(child);
                            if (!text && child.childElementCount === 0) text = normalizeText(child.textContent || '');
                            if (!text) return '';
                            if (text.length < 2 || text.length > 20) return '';
                            if (SCENE_SKIP_TEXT_RE.test(text)) return '';
                            if (/^[0-9]+$/.test(text)) return '';
                            if (/[，。,.：:]/.test(text) && text.length > 12) return '';
                            return text;
                        }).filter(Boolean),
                        text => text
                    );
                    if (options.length < 2 || options.length > 12) return null;

                    const label = findNearestLabelText(parent);
                    if (!label && !options.some(item => SCENE_KEYWORD_HINT_RE.test(item))) return null;
                    return { label, options };
                }).filter(Boolean),
                item => `${item.label || ''}::${item.options.join('|')}`
            );

            const sectionHeadings = uniqueBy(
                textEntries
                    .filter(entry => entry.left < 620 && isLikelySectionTitle(entry.text))
                    .map(entry => ({ title: entry.text, top: entry.top, left: entry.left })),
                item => item.title
            ).sort((a, b) => a.top - b.top);

            const sections = sectionHeadings.map((heading, idx) => {
                const nextTop = sectionHeadings[idx + 1]?.top || (heading.top + 520);
                const options = uniqueBy(
                    textEntries
                        .filter(entry => entry.top > heading.top + 4 && entry.top < nextTop && entry.left >= heading.left - 20)
                        .map(entry => entry.text)
                        .filter(text => text.length <= 24 && text !== heading.title && !isLikelySectionTitle(text)),
                    text => text
                );
                return {
                    title: heading.title,
                    options
                };
            });

            const labels = uniqueBy(
                uniqueTexts.filter(text => isLikelyFieldLabel(text)),
                text => text
            );

            const optionTexts = uniqueBy(
                uniqueTexts.filter(text => {
                    if (text.length > 20) return false;
                    if (isLikelyFieldLabel(text)) return false;
                    if (SCENE_SKIP_TEXT_RE.test(text)) return false;
                    if (/^\d+$/.test(text)) return false;
                    return true;
                }),
                text => text
            );

            return {
                sectionTitles: sections.map(item => item.title),
                sections,
                labels,
                radios,
                checkboxes,
                selects,
                inputs,
                buttonLikeOptions: buttonLike,
                optionGroups,
                optionTexts,
                textSamples: uniqueTexts.slice(0, 300)
            };
        };

        const getSceneCardElement = (sceneName) => {
            const exactTextNodes = Array.from(document.querySelectorAll('div,span,a,button')).filter(el => {
                if (!isElementVisible(el)) return false;
                const text = normalizeText(el.textContent || '');
                if (text !== sceneName) return false;
                const rect = el.getBoundingClientRect();
                return rect.top >= 100 && rect.top <= 360 && rect.left >= 260;
            });

            const scored = [];
            exactTextNodes.forEach(node => {
                let cursor = node;
                for (let depth = 0; depth < 6 && cursor && cursor !== document.body; depth++) {
                    if (!isElementVisible(cursor)) {
                        cursor = cursor.parentElement;
                        continue;
                    }
                    const text = normalizeText(cursor.textContent || '');
                    const rect = cursor.getBoundingClientRect();
                    if (text.includes(sceneName)
                        && rect.top >= 100 && rect.top <= 360
                        && rect.left >= 260
                        && rect.width >= 120 && rect.width <= 280
                        && rect.height >= 70 && rect.height <= 180) {
                        const score = rect.width * rect.height - Math.abs(rect.top - 160) * 40;
                        scored.push({ el: cursor, score });
                    }
                    cursor = cursor.parentElement;
                }
            });

            if (scored.length) {
                scored.sort((a, b) => b.score - a.score);
                return scored[0].el;
            }

            const fallback = Array.from(document.querySelectorAll('a,button,li,div,span')).find(el => {
                if (!isElementVisible(el)) return false;
                const text = normalizeText(el.textContent || '');
                return text === sceneName;
            });
            return fallback || null;
        };

        const clickElement = (el) => {
            if (!el) return false;
            const rect = el.getBoundingClientRect();
            const clientX = rect.left + Math.max(3, Math.min(rect.width - 3, rect.width / 2));
            const clientY = rect.top + Math.max(3, Math.min(rect.height - 3, rect.height / 2));

            const dispatchPointerMouse = (type) => {
                const base = {
                    bubbles: true,
                    cancelable: true,
                    clientX,
                    clientY
                };
                try {
                    if (type.startsWith('pointer') && typeof PointerEvent === 'function') {
                        el.dispatchEvent(new PointerEvent(type, base));
                    } else {
                        el.dispatchEvent(new MouseEvent(type, base));
                    }
                    return true;
                } catch {
                    try {
                        el.dispatchEvent(new MouseEvent(type, {
                            bubbles: true,
                            cancelable: true
                        }));
                        return true;
                    } catch {
                        try {
                            el.dispatchEvent(new Event(type, {
                                bubbles: true,
                                cancelable: true
                            }));
                            return true;
                        } catch {
                            return false;
                        }
                    }
                }
            };

            ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'].forEach(type => {
                dispatchPointerMouse(type);
            });
            if (typeof el.click === 'function') el.click();
            return true;
        };

        const waitUntil = async (predicate, timeoutMs = 5000, intervalMs = 120) => {
            const start = Date.now();
            while (Date.now() - start < timeoutMs) {
                try {
                    if (predicate()) return true;
                } catch { }
                await sleep(intervalMs);
            }
            return false;
        };

        const waitForDomStable = async (options = {}) => {
            const timeoutMs = Math.max(300, toNumber(options.waitMs, 3600));
            const stabilizeMs = Math.max(120, toNumber(options.stabilizeMs, 420));
            const intervalMs = Math.max(80, toNumber(options.intervalMs, 130));
            const start = Date.now();
            let lastSignature = getCurrentSceneSignature();
            let stableSince = Date.now();
            while (Date.now() - start < timeoutMs) {
                await sleep(intervalMs);
                const current = getCurrentSceneSignature();
                if (current !== lastSignature) {
                    lastSignature = current;
                    stableSince = Date.now();
                    continue;
                }
                if (Date.now() - stableSince >= stabilizeMs) return true;
            }
            return false;
        };

        const parseBizCodeFromHash = (hash = '') => {
            const raw = String(hash || window.location.hash || '').trim();
            if (!raw) return '';
            const match = raw.match(/[?&]bizCode=([^&#]+)/i);
            if (!match || !match[1]) return '';
            return decodeURIComponent(match[1]);
        };

        const buildSceneRouteHash = (sceneName = '') => {
            const targetScene = String(sceneName || '').trim();
            if (!targetScene) return '';
            const bizCode = resolveSceneBizCodeHint(targetScene) || SCENE_BIZCODE_HINT_FALLBACK[targetScene] || '';
            if (!bizCode) return '';
            return `#!/main/index?bizCode=${encodeURIComponent(bizCode)}`;
        };

        const ensureSceneRoute = async (sceneName = '', options = {}) => {
            const targetScene = String(sceneName || '').trim();
            const routeHash = buildSceneRouteHash(targetScene);
            const targetBizCode = parseBizCodeFromHash(routeHash);
            const currentBizCode = parseBizCodeFromHash(window.location.hash);
            if (routeHash && targetBizCode && currentBizCode !== targetBizCode) {
                window.location.hash = routeHash;
                await waitUntil(() => parseBizCodeFromHash(window.location.hash) === targetBizCode, Math.max(1400, toNumber(options.waitMs, 4800)), 140);
                await waitForDomStable(options);
            }
            if (targetScene) {
                try {
                    await clickScene(targetScene, options);
                } catch { }
            }
            return {
                targetScene,
                routeHash,
                targetBizCode,
                currentBizCode: parseBizCodeFromHash(window.location.hash),
                location: window.location.href
            };
        };

        const getCurrentSceneSignature = () => {
            const root = pickPlanConfigRoot();
            if (!root) return '';
            const snapshot = normalizeText((root.innerText || root.textContent || '').slice(0, 1200));
            return snapshot;
        };

        const clickScene = async (sceneName, options = {}) => {
            const target = getSceneCardElement(sceneName);
            if (!target) throw new Error(`未找到场景卡片：${sceneName}`);
            const before = getCurrentSceneSignature();
            clickElement(target);
            await sleep(Math.max(240, toNumber(options.clickDelay, 640)));
            await waitUntil(() => {
                const current = getCurrentSceneSignature();
                return current && current !== before;
            }, Math.max(1200, toNumber(options.waitTimeout, 5200)), 160);
            await sleep(Math.max(180, toNumber(options.settleDelay, 420)));
            return true;
        };

        // NOTE: 这些场景辅助函数需要给 openWizard 使用，必须放在外层作用域。
        const inferCurrentSceneName = () => {
            for (const sceneName of SCENE_NAME_LIST) {
                const card = getSceneCardElement(sceneName);
                if (!card) continue;
                try {
                    const style = window.getComputedStyle(card);
                    const borderColor = String(style.borderColor || '');
                    const border = String(style.border || '');
                    if (borderColor.includes('69, 84, 229') || border.includes('69, 84, 229')) {
                        return sceneName;
                    }
                } catch { }
            }
            if (wizardState?.draft?.sceneName && SCENE_NAME_LIST.includes(wizardState.draft.sceneName)) {
                return wizardState.draft.sceneName;
            }
            return '关键词推广';
        };

        const applyRuntimeToDraft = (runtime = {}, sceneName = '') => {
            if (!wizardState.draft) wizardState.draft = wizardDefaultDraft();
            if (sceneName && SCENE_NAME_LIST.includes(sceneName)) wizardState.draft.sceneName = sceneName;
            if (runtime?.bizCode) wizardState.draft.bizCode = runtime.bizCode;
            if (runtime?.promotionScene) wizardState.draft.promotionScene = runtime.promotionScene;
        };

        const refreshSceneSelect = () => {
            if (!wizardState?.els?.sceneSelect) return;
            if (!wizardState.draft) wizardState.draft = wizardDefaultDraft();
            const draftSceneName = SCENE_NAME_LIST.includes(wizardState.draft.sceneName) ? wizardState.draft.sceneName : '';
            const inferredSceneName = inferCurrentSceneName();
            const sceneName = draftSceneName || (SCENE_NAME_LIST.includes(inferredSceneName) ? inferredSceneName : '关键词推广');
            wizardState.els.sceneSelect.value = sceneName;
            wizardState.draft.sceneName = sceneName;
        };

        const SCENE_LAYER_OPTION_SKIP_RE = /^(上手指南|了解更多|了解详情|查看详情|思考过程|立即投放|生成其他策略|创建完成|保存并关闭|清空|升级|收起|展开|添加商品|添加关键词|修改匹配方案|一键上车|恢复默认推荐|新建模板创意|从创意库添加|批量修改词包溢价比例|添加种子人群|设置计划组|详情|移除|图搜同款|开|关|今日|不限|new|NEW|HOT)$/;

        const isLikelySelectedElement = (el) => {
            if (!el || !(el instanceof Element)) return false;
            try {
                if (String(el.getAttribute?.('aria-checked') || '') === 'true') return true;
                if (String(el.getAttribute?.('aria-selected') || '') === 'true') return true;
                if (el.getAttribute?.('checked') !== null) return true;
                if (typeof el.checked === 'boolean' && el.checked) return true;
                const className = String(el.className || '');
                if (/(^|\\s)(active|selected|checked|current|is-active|is-selected|next-radio-checked|next-tab-active)(\\s|$)/i.test(className)) {
                    return true;
                }
            } catch { }
            return false;
        };

        const isValidLayerOptionText = (text = '') => {
            const normalized = normalizeText(text);
            if (!normalized) return false;
            if (normalized.length < 2 || normalized.length > 22) return false;
            if (SCENE_SKIP_TEXT_RE.test(normalized)) return false;
            if (SCENE_FORBIDDEN_ACTION_RE.test(normalized)) return false;
            if (SCENE_LAYER_OPTION_SKIP_RE.test(normalized)) return false;
            if (SCENE_NAME_LIST.includes(normalized)) return false;
            if (/^[\\d.%‰\\-]+$/.test(normalized)) return false;
            if (/^(推荐|新品|潜力品|机会爆品)$/.test(normalized)) return false;
            return true;
        };

        const normalizeLayerGroupLabel = (label = '', optionText = '') => {
            const normalized = normalizeText(label);
            if (!normalized) return '';
            if (normalized === optionText) return '';
            if (normalized.includes(optionText) && optionText.length >= 4) return '';
            if (normalized.length > 26) return '';
            if (SCENE_SKIP_TEXT_RE.test(normalized)) return '';
            if (SCENE_LAYER_OPTION_SKIP_RE.test(normalized)) return '';
            if (SCENE_NAME_LIST.includes(normalized)) return '';
            return normalized;
        };

        const findLayerOptionContainer = (el, selectors = []) => {
            let cursor = el;
            for (let depth = 0; depth < 6 && cursor && cursor !== document.body; depth++) {
                const parent = cursor.parentElement;
                if (!parent) break;
                const rect = parent.getBoundingClientRect();
                if (rect.width < 120 || rect.width > 1300 || rect.height < 20 || rect.height > 340) {
                    cursor = parent;
                    continue;
                }
                let count = 0;
                selectors.forEach(selector => {
                    try {
                        count += parent.querySelectorAll(selector).length;
                    } catch { }
                });
                if (count >= 2) return parent;
                cursor = parent;
            }
            return el.parentElement || el;
        };

        const buildLayerCandidate = (el, type = 'button') => {
            if (!isElementVisible(el)) return null;
            const text = normalizeText(
                el.getAttribute?.('aria-label')
                || getOwnText(el)
                || el.textContent
                || findNearestLabelText(el)
            );
            if (!isValidLayerOptionText(text)) return null;
            const selectorList = type === 'radio'
                ? ['[role="radio"]', 'input[type="radio"]']
                : ['[role="tab"]', 'button', '[role="button"]'];
            const container = findLayerOptionContainer(el, selectorList);
            const containerLabel = normalizeText(findNearestLabelText(container) || '');
            const ownLabel = normalizeText(findNearestLabelText(el) || '');
            const groupLabel = normalizeLayerGroupLabel(containerLabel || ownLabel, text);
            const rect = (container || el).getBoundingClientRect();
            const groupKey = groupLabel || `${type}_${Math.round(rect.top / 28)}_${Math.round(rect.left / 80)}`;
            const clickEl = el.matches?.('input[type="radio"]')
                ? (el.closest('label,[role="radio"],button,[role="button"],div,span') || el)
                : (el.closest('[role="radio"],[role="tab"],button,[role="button"],label,div,span') || el);
            const selected = isLikelySelectedElement(el) || isLikelySelectedElement(container);
            const disabled = !!el.disabled
                || String(el.getAttribute?.('aria-disabled') || '') === 'true'
                || String(container?.getAttribute?.('aria-disabled') || '') === 'true';
            return {
                type,
                optionText: text,
                groupLabel,
                groupKey,
                selected,
                disabled,
                top: Math.round(rect.top),
                left: Math.round(rect.left),
                clickEl,
                el
            };
        };

        const collectLayerControlCandidates = (root) => {
            const targetRoot = root || pickPlanConfigRoot();
            const raw = [];
            Array.from(targetRoot.querySelectorAll('[role="radio"], input[type="radio"]')).forEach(el => {
                const candidate = buildLayerCandidate(el, 'radio');
                if (candidate) raw.push(candidate);
            });
            Array.from(targetRoot.querySelectorAll('[role="tab"], button, [role="button"]')).forEach(el => {
                const candidate = buildLayerCandidate(el, 'button');
                if (candidate) raw.push(candidate);
            });
            const dedup = new Map();
            raw.forEach(item => {
                const key = `${item.groupKey}::${item.optionText}`;
                const prev = dedup.get(key);
                if (!prev) {
                    dedup.set(key, item);
                    return;
                }
                if (!prev.selected && item.selected) {
                    dedup.set(key, item);
                    return;
                }
                if (prev.disabled && !item.disabled) {
                    dedup.set(key, item);
                }
            });
            return Array.from(dedup.values());
        };

        const collectLayerControlGroups = (root) => {
            const candidates = collectLayerControlCandidates(root);
            const groups = {};
            candidates.forEach(candidate => {
                if (!groups[candidate.groupKey]) {
                    groups[candidate.groupKey] = {
                        groupKey: candidate.groupKey,
                        groupLabel: candidate.groupLabel || '',
                        top: candidate.top,
                        left: candidate.left,
                        options: []
                    };
                }
                groups[candidate.groupKey].options.push({
                    optionText: candidate.optionText,
                    selected: !!candidate.selected,
                    disabled: !!candidate.disabled
                });
            });
            return Object.values(groups)
                .map(group => ({
                    ...group,
                    options: uniqueBy(group.options, item => item.optionText).slice(0, 12)
                }))
                .filter(group => group.options.length >= 2)
                .filter(group => {
                    const optionTextList = group.options.map(item => item.optionText);
                    const sceneOptionCount = optionTextList.filter(item => SCENE_NAME_LIST.includes(item)).length;
                    if (sceneOptionCount >= Math.min(4, SCENE_NAME_LIST.length - 1)) return false;
                    if (/场景名称/.test(group.groupLabel)) return false;
                    return true;
                })
                .sort((a, b) => (a.top - b.top) || (a.left - b.left));
        };

        const findLayerCandidateByStep = (step, root) => {
            const candidates = collectLayerControlCandidates(root);
            const targetText = normalizeText(step?.optionText || '');
            if (!targetText) return null;
            const normalizeMatchToken = (text = '') => normalizeText(text).replace(/[^\u4e00-\u9fa5a-zA-Z0-9]+/g, '').toLowerCase();
            const exact = candidates.filter(item => item.optionText === targetText);
            const matched = exact.length
                ? exact
                : candidates.filter(item => {
                    const candidateText = normalizeText(item?.optionText || '');
                    if (!candidateText) return false;
                    if (candidateText.includes(targetText) || targetText.includes(candidateText)) return true;
                    const compactCandidate = normalizeMatchToken(candidateText);
                    const compactTarget = normalizeMatchToken(targetText);
                    if (!compactCandidate || !compactTarget) return false;
                    return compactCandidate.includes(compactTarget) || compactTarget.includes(compactCandidate);
                });
            if (!matched.length) {
                const targetRoot = root || pickPlanConfigRoot();
                const cardCandidates = Array.from(targetRoot.querySelectorAll('[data-card*="_card_"]'))
                    .map(card => {
                        if (!isElementVisible(card)) return null;
                        const text = normalizeText(card.textContent || '');
                        if (!text) return null;
                        const compactCandidate = normalizeMatchToken(text);
                        const compactTarget = normalizeMatchToken(targetText);
                        if (!compactCandidate || !compactTarget) return null;
                        if (!compactCandidate.includes(compactTarget) && !compactTarget.includes(compactCandidate)) return null;
                        const labelText = normalizeText(findNearestLabelText(card) || '');
                        const rect = card.getBoundingClientRect();
                        return {
                            type: 'button',
                            optionText: targetText,
                            groupLabel: SCENE_GOAL_GROUP_HINT_RE.test(labelText) ? labelText : '营销目标',
                            groupKey: `data_card_${Math.round(rect.top / 24)}_${Math.round(rect.left / 80)}`,
                            selected: isLikelySelectedElement(card) || String(card.getAttribute('aria-checked') || '') === 'true',
                            disabled: String(card.getAttribute('aria-disabled') || '') === 'true',
                            top: Math.round(rect.top),
                            left: Math.round(rect.left),
                            clickEl: card.querySelector('label,[role="radio"],button,[role="button"],input[type="radio"]') || card,
                            el: card
                        };
                    })
                    .filter(Boolean)
                    .sort((a, b) => Number(a.disabled) - Number(b.disabled) || Number(a.selected) - Number(b.selected) || (a.top - b.top));
                return cardCandidates[0] || null;
            }
            const byGroupKey = step?.groupKey ? matched.filter(item => item.groupKey === step.groupKey) : [];
            const byGroupLabel = step?.groupLabel
                ? matched.filter(item => item.groupLabel === step.groupLabel || item.groupLabel.includes(step.groupLabel) || step.groupLabel.includes(item.groupLabel))
                : [];
            const list = (byGroupKey.length ? byGroupKey : (byGroupLabel.length ? byGroupLabel : matched)).slice();
            list.sort((a, b) => Number(a.disabled) - Number(b.disabled) || Number(a.selected) - Number(b.selected) || (a.top - b.top));
            return list[0] || null;
        };

        const clickLayerOptionByStep = async (step, options = {}) => {
            const root = pickPlanConfigRoot();
            const before = getCurrentSceneSignature();
            let candidate = findLayerCandidateByStep(step, root);
            if (!candidate) return false;
            if (candidate.disabled) return false;
            if (!candidate.selected) {
                clickElement(candidate.clickEl || candidate.el);
            }
            await sleep(Math.max(120, toNumber(options.layerClickDelay, 320)));
            await waitUntil(() => {
                const fresh = findLayerCandidateByStep(step, pickPlanConfigRoot());
                if (fresh && fresh.selected) return true;
                const current = getCurrentSceneSignature();
                return current && current !== before;
            }, Math.max(800, toNumber(options.layerWaitTimeout, 2800)), 140);
            await sleep(Math.max(100, toNumber(options.layerSettleDelay, 220)));
            candidate = findLayerCandidateByStep(step, pickPlanConfigRoot());
            return !!candidate;
        };

        const applySceneLayerPath = async (sceneName, layerPath = [], options = {}) => {
            await clickScene(sceneName, options);
            for (let i = 0; i < layerPath.length; i++) {
                const ok = await clickLayerOptionByStep(layerPath[i], options);
                if (!ok) {
                    const stepText = `${layerPath[i]?.groupLabel || '分组'} -> ${layerPath[i]?.optionText || ''}`;
                    throw new Error(`未找到层级选项：${stepText}`);
                }
            }
        };

        const mergeSceneSchema = (target, schema = {}) => {
            target.sectionTitles = uniqueBy((target.sectionTitles || []).concat((schema.sectionTitles || []).map(item => normalizeText(item))).filter(Boolean), item => item).slice(0, 220);
            target.sections = uniqueBy(
                (target.sections || []).concat((schema.sections || []).map(item => ({
                    title: normalizeText(item?.title || ''),
                    options: uniqueBy((item?.options || []).map(opt => normalizeText(opt)).filter(Boolean), opt => opt).slice(0, 24)
                }))).filter(item => item.title),
                item => `${item.title}::${(item.options || []).join('|')}`
            ).slice(0, 180);
            target.labels = uniqueBy((target.labels || []).concat((schema.labels || []).map(item => normalizeText(item))).filter(Boolean), item => item).slice(0, 260);
            target.radios = uniqueBy(
                (target.radios || []).concat((schema.radios || []).map(item => ({
                    label: normalizeText(item?.label || ''),
                    text: normalizeText(item?.text || ''),
                    value: normalizeText(item?.value || ''),
                    checked: !!item?.checked
                }))).filter(item => item.text),
                item => `${item.label}::${item.text}::${item.value}`
            ).slice(0, 320);
            target.checkboxes = uniqueBy(
                (target.checkboxes || []).concat((schema.checkboxes || []).map(item => ({
                    label: normalizeText(item?.label || ''),
                    text: normalizeText(item?.text || ''),
                    checked: !!item?.checked,
                    disabled: !!item?.disabled
                }))).filter(item => item.text),
                item => `${item.label}::${item.text}`
            ).slice(0, 220);
            target.selects = uniqueBy(
                (target.selects || []).concat((schema.selects || []).map(item => ({
                    label: normalizeText(item?.label || ''),
                    value: normalizeText(item?.value || ''),
                    options: uniqueBy((item?.options || []).map(opt => ({
                        label: normalizeText(opt?.label || ''),
                        value: normalizeText(opt?.value || ''),
                        selected: !!opt?.selected
                    })).filter(opt => opt.label || opt.value), opt => `${opt.label}::${opt.value}`).slice(0, 30)
                }))),
                item => `${item.label}::${item.value}::${(item.options || []).map(opt => `${opt.label}|${opt.value}`).join(',')}`
            ).slice(0, 120);
            target.inputs = uniqueBy(
                (target.inputs || []).concat((schema.inputs || []).map(item => ({
                    label: normalizeText(item?.label || ''),
                    type: normalizeText(item?.type || ''),
                    placeholder: normalizeText(item?.placeholder || ''),
                    value: normalizeText(item?.value || ''),
                    disabled: !!item?.disabled
                }))),
                item => `${item.label}::${item.type}::${item.placeholder}`
            ).slice(0, 240);
            target.buttonLikeOptions = uniqueBy((target.buttonLikeOptions || []).concat((schema.buttonLikeOptions || []).map(item => normalizeText(item))).filter(Boolean), item => item).slice(0, 260);
            target.optionGroups = uniqueBy(
                (target.optionGroups || []).concat((schema.optionGroups || []).map(item => ({
                    label: normalizeText(item?.label || ''),
                    options: uniqueBy((item?.options || []).map(opt => normalizeText(opt)).filter(Boolean), opt => opt).slice(0, 24)
                })).filter(item => item.options.length >= 2)),
                item => `${item.label}::${item.options.join('|')}`
            ).slice(0, 200);
            target.optionTexts = uniqueBy((target.optionTexts || []).concat((schema.optionTexts || []).map(item => normalizeText(item))).filter(Boolean), item => item).slice(0, 320);
            target.textSamples = uniqueBy((target.textSamples || []).concat((schema.textSamples || []).map(item => normalizeText(item))).filter(Boolean), item => item).slice(0, 500);
        };

        const scanCurrentSceneSettings = (sceneName = '', extra = {}) => {
            const root = pickPlanConfigRoot();
            const schema = collectControlSchemaFromRoot(root);
            return {
                ok: true,
                sceneName: String(sceneName || '').trim(),
                location: window.location.href,
                scannedAt: new Date().toISOString(),
                signature: getCurrentSceneSignature(),
                ...schema,
                ...extra
            };
        };

        const scanSceneLayeredSettings = async (sceneName = '', options = {}) => {
            const targetSceneName = String(sceneName || '').trim();
            const maxDepth = Math.max(1, Math.min(3, toNumber(options.layerMaxDepth, 3)));
            const maxGroupsPerLevel = Math.max(1, Math.min(6, toNumber(options.layerMaxGroupsPerLevel, 4)));
            const maxOptionsPerGroup = Math.max(1, Math.min(8, toNumber(options.layerMaxOptionsPerGroup, 5)));
            const maxSnapshots = Math.max(1, Math.min(60, toNumber(options.layerMaxSnapshots, 28)));
            const seenPathSet = new Set();
            const pathErrors = [];
            const routeSet = new Set();
            const snapshots = [];
            const aggregate = {
                ok: true,
                sceneName: targetSceneName,
                location: window.location.href,
                scannedAt: new Date().toISOString(),
                sectionTitles: [],
                sections: [],
                labels: [],
                radios: [],
                checkboxes: [],
                selects: [],
                inputs: [],
                buttonLikeOptions: [],
                optionGroups: [],
                optionTexts: [],
                textSamples: [],
                layerSnapshots: [],
                layerSummary: {}
            };

            const toPathText = (layerPath = []) => layerPath.length
                ? layerPath.map(step => `${step.groupLabel || '分组'}:${step.optionText || ''}`).join(' > ')
                : '(根层)';

            const scanPath = async (layerPath = []) => {
                if (snapshots.length >= maxSnapshots) return;
                const pathKey = layerPath.map(step => `${step.groupKey || ''}:${step.optionText || ''}`).join('>') || '__root__';
                if (seenPathSet.has(pathKey)) return;
                seenPathSet.add(pathKey);
                const depth = layerPath.length;

                try {
                    await applySceneLayerPath(targetSceneName, layerPath, options);
                } catch (err) {
                    pathErrors.push({
                        pathText: toPathText(layerPath),
                        error: err?.message || String(err)
                    });
                    if (typeof options.onProgress === 'function') {
                        try {
                            options.onProgress({
                                event: 'scene_layer_path_error',
                                sceneName: targetSceneName,
                                depth,
                                pathText: toPathText(layerPath),
                                error: err?.message || String(err)
                            });
                        } catch { }
                    }
                    return;
                }

                const snapshot = scanCurrentSceneSettings(targetSceneName, {
                    depth,
                    layerPath: layerPath.map(step => ({
                        groupKey: step.groupKey,
                        groupLabel: step.groupLabel,
                        optionText: step.optionText
                    })),
                    layerPathText: toPathText(layerPath)
                });
                snapshots.push(snapshot);
                mergeSceneSchema(aggregate, snapshot);
                routeSet.add(snapshot.location);
                if (typeof options.onProgress === 'function') {
                    try {
                        options.onProgress({
                            event: 'scene_layer_snapshot',
                            sceneName: targetSceneName,
                            depth,
                            pathText: snapshot.layerPathText,
                            snapshotIndex: snapshots.length,
                            maxSnapshots
                        });
                    } catch { }
                }

                if (depth >= maxDepth || snapshots.length >= maxSnapshots) return;
                const groups = collectLayerControlGroups(pickPlanConfigRoot())
                    .filter(group => !layerPath.some(step => step.groupKey === group.groupKey))
                    .slice(0, maxGroupsPerLevel);
                for (let gi = 0; gi < groups.length; gi++) {
                    const group = groups[gi];
                    const optionList = group.options
                        .filter(option => !option.disabled)
                        .slice(0, maxOptionsPerGroup);
                    for (let oi = 0; oi < optionList.length; oi++) {
                        if (snapshots.length >= maxSnapshots) return;
                        const option = optionList[oi];
                        const nextPath = layerPath.concat([{
                            groupKey: group.groupKey,
                            groupLabel: group.groupLabel,
                            optionText: option.optionText
                        }]);
                        await scanPath(nextPath);
                    }
                }
            };

            await scanPath([]);
            aggregate.layerSnapshots = snapshots.map(item => ({
                sceneName: item.sceneName,
                depth: item.depth,
                layerPath: item.layerPath || [],
                layerPathText: item.layerPathText || '',
                location: item.location,
                labels: item.labels || [],
                sectionTitles: item.sectionTitles || [],
                radios: item.radios || []
            }));
            aggregate.layerSummary = {
                maxDepth,
                maxGroupsPerLevel,
                maxOptionsPerGroup,
                maxSnapshots,
                snapshotCount: snapshots.length,
                exploredPathCount: seenPathSet.size,
                routeList: Array.from(routeSet),
                errorCount: pathErrors.length
            };
            if (pathErrors.length) {
                aggregate.layerErrors = pathErrors.slice(0, 30);
            }
            aggregate.location = window.location.href;
            aggregate.scannedAt = new Date().toISOString();
            return aggregate;
        };

        const scanAllSceneSettings = async (options = {}) => {
            const scenes = Array.isArray(options.scenes) && options.scenes.length
                ? uniqueBy(options.scenes.map(item => String(item || '').trim()).filter(Boolean), item => item)
                : SCENE_NAME_LIST.slice();
            const list = [];
            const beforeSignature = getCurrentSceneSignature();
            const useLayeredScan = options.layered !== false;

            for (let i = 0; i < scenes.length; i++) {
                const sceneName = scenes[i];
                try {
                    if (typeof options.onProgress === 'function') {
                        try { options.onProgress({ event: 'scene_start', index: i + 1, total: scenes.length, sceneName }); } catch { }
                    }
                    const scanned = useLayeredScan
                        ? await scanSceneLayeredSettings(sceneName, options)
                        : (await clickScene(sceneName, options), scanCurrentSceneSettings(sceneName));
                    list.push(scanned);
                    if (typeof options.onProgress === 'function') {
                        try {
                            options.onProgress({
                                event: 'scene_done',
                                index: i + 1,
                                total: scenes.length,
                                sceneName,
                                labels: (scanned.labels || []).length,
                                radios: (scanned.radios || []).length,
                                snapshots: scanned.layerSummary?.snapshotCount || 1
                            });
                        } catch { }
                    }
                } catch (err) {
                    list.push({
                        ok: false,
                        sceneName,
                        error: err?.message || String(err),
                        scannedAt: new Date().toISOString(),
                        location: window.location.href
                    });
                }
            }

            if (options.restoreSceneSignature && beforeSignature) {
                await waitUntil(() => getCurrentSceneSignature() === beforeSignature, 800, 200);
            }

            const result = {
                ok: list.every(item => item.ok),
                layered: useLayeredScan,
                sceneOrder: scenes,
                scannedAt: new Date().toISOString(),
                count: list.length,
                successCount: list.filter(item => item.ok).length,
                failCount: list.filter(item => !item.ok).length,
                list
            };

            window.__AM_WXT_LAST_SCENE_SCAN__ = result;
            if (options.copyToClipboard && navigator.clipboard?.writeText) {
                try {
                    await navigator.clipboard.writeText(JSON.stringify(result, null, 2));
                } catch { }
            }
            return result;
        };

        const normalizeSceneSpecFieldKey = (label = '') => {
            const text = String(label || '')
                .replace(/[：:]/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
            return text || 'field';
        };

        const isLikelyCriticalSceneField = (label = '') => /计划名称|计划名|预算|出价|目标|商品|关键词|人群|落地页|线索/.test(String(label || ''));

        const inferSceneFieldDependsOn = (label = '') => {
            const text = String(label || '');
            const deps = [];
            if (/关键词|核心词/.test(text)) deps.push('添加商品');
            if (/人群/.test(text)) deps.push('营销目标');
            if (/出价|预算|投放/.test(text)) deps.push('营销目标');
            if (/创意/.test(text)) deps.push('选择推广商品');
            return uniqueBy(deps, item => item);
        };

        const normalizeSceneSpecOptions = (options = {}) => {
            const scanMode = options.scanMode === 'visible' ? 'visible' : 'full_top_down';
            const unlockPolicy = ['auto_rollback', 'safe_only', 'manual'].includes(options.unlockPolicy)
                ? options.unlockPolicy
                : 'auto_rollback';
            const goalScan = options.goalScan === true
                || (options.goalScan !== false && scanMode === 'full_top_down');
            const goalFieldScan = options.goalFieldScan === true;
            const goalFieldScanMode = options.goalFieldScanMode === 'visible' ? 'visible' : 'full_top_down';
            return {
                scanMode,
                unlockPolicy,
                goalScan,
                goalFieldScan,
                goalFieldScanMode,
                goalFieldMaxDepth: Math.max(1, Math.min(4, toNumber(options.goalFieldMaxDepth, 2))),
                goalFieldMaxSnapshots: Math.max(1, Math.min(120, toNumber(options.goalFieldMaxSnapshots, 48))),
                goalFieldMaxGroupsPerLevel: Math.max(1, Math.min(10, toNumber(options.goalFieldMaxGroupsPerLevel, 6))),
                goalFieldMaxOptionsPerGroup: Math.max(1, Math.min(12, toNumber(options.goalFieldMaxOptionsPerGroup, 8))),
                maxDepth: Math.max(1, Math.min(4, toNumber(options.maxDepth, 3))),
                maxSnapshots: Math.max(1, Math.min(96, toNumber(options.maxSnapshots, 36))),
                maxGroupsPerLevel: Math.max(1, Math.min(8, toNumber(options.maxGroupsPerLevel, 5))),
                maxOptionsPerGroup: Math.max(1, Math.min(10, toNumber(options.maxOptionsPerGroup, 6))),
                waitMs: Math.max(300, toNumber(options.waitMs, 4200)),
                stabilizeMs: Math.max(120, toNumber(options.stabilizeMs, 420)),
                refresh: !!options.refresh,
                restore: options.restore !== false
            };
        };

        const buildSceneSpecCacheKey = (sceneName = '', bizCode = '') => {
            const scene = String(sceneName || '').trim();
            const biz = String(bizCode || '').trim();
            return `${scene}::${biz || 'unknown'}`;
        };

        const loadSceneSpecCache = () => {
            if (sceneSpecCache.loaded) return;
            sceneSpecCache.loaded = true;
            sceneSpecCache.map = {};
            try {
                const raw = sessionStorage.getItem(SCENE_SPEC_CACHE_STORAGE_KEY);
                if (!raw) return;
                const parsed = JSON.parse(raw);
                if (!isPlainObject(parsed)) return;
                Object.keys(parsed).forEach(key => {
                    const entry = parsed[key];
                    if (!isPlainObject(entry)) return;
                    const ts = toNumber(entry.ts, 0);
                    if (!ts || Date.now() - ts > SCENE_SPEC_CACHE_TTL_MS) return;
                    if (!isPlainObject(entry.data)) return;
                    sceneSpecCache.map[key] = {
                        ts,
                        data: entry.data
                    };
                });
            } catch { }
        };

        const persistSceneSpecCache = () => {
            try {
                sessionStorage.setItem(SCENE_SPEC_CACHE_STORAGE_KEY, JSON.stringify(sceneSpecCache.map || {}));
            } catch { }
        };

        const getCachedSceneSpec = (sceneName = '', bizCode = '') => {
            loadSceneSpecCache();
            const key = buildSceneSpecCacheKey(sceneName, bizCode);
            const entry = sceneSpecCache.map[key];
            if (!entry || !entry.ts || !entry.data) return null;
            if (Date.now() - entry.ts > SCENE_SPEC_CACHE_TTL_MS) {
                delete sceneSpecCache.map[key];
                persistSceneSpecCache();
                return null;
            }
            return deepClone(entry.data);
        };

        const setCachedSceneSpec = (sceneName = '', bizCode = '', spec = null) => {
            if (!sceneName || !isPlainObject(spec)) return;
            loadSceneSpecCache();
            const key = buildSceneSpecCacheKey(sceneName, bizCode);
            sceneSpecCache.map[key] = {
                ts: Date.now(),
                data: deepClone(spec)
            };
            persistSceneSpecCache();
        };

        const clearSceneSpecCache = (sceneName = '') => {
            loadSceneSpecCache();
            const targetScene = String(sceneName || '').trim();
            if (!targetScene) {
                sceneSpecCache.map = {};
                persistSceneSpecCache();
                return { ok: true, cleared: 'all' };
            }
            const keys = Object.keys(sceneSpecCache.map || {});
            let clearedCount = 0;
            keys.forEach(key => {
                if (!key.startsWith(`${targetScene}::`)) return;
                delete sceneSpecCache.map[key];
                clearedCount += 1;
            });
            persistSceneSpecCache();
            return { ok: true, cleared: targetScene, clearedCount };
        };

        const clearSceneCreateContractCache = (sceneName = '', goalLabel = '') => {
            loadSceneCreateContractCache();
            const targetScene = String(sceneName || '').trim();
            const targetGoal = normalizeGoalCandidateLabel(goalLabel || '');
            if (!targetScene && !targetGoal) {
                sceneCreateContractCache.map = {};
                persistSceneCreateContractCache();
                return { ok: true, cleared: 'all', clearedCount: 0 };
            }
            const keys = Object.keys(sceneCreateContractCache.map || {});
            let clearedCount = 0;
            keys.forEach(key => {
                const [scenePart, goalPartRaw] = String(key || '').split('::');
                const scenePartText = String(scenePart || '').trim();
                if (targetScene && scenePartText !== targetScene) return;
                const goalPart = String(goalPartRaw || '').trim();
                const normalizedGoalPart = goalPart === '__scene_default__'
                    ? ''
                    : normalizeGoalCandidateLabel(goalPart);
                if (targetGoal && normalizedGoalPart !== targetGoal) return;
                delete sceneCreateContractCache.map[key];
                clearedCount += 1;
            });
            persistSceneCreateContractCache();
            return {
                ok: true,
                clearedScene: targetScene || '',
                clearedGoal: targetGoal || '',
                clearedCount
            };
        };

        const loadSceneCreateContractCache = () => {
            if (sceneCreateContractCache.loaded) return;
            sceneCreateContractCache.loaded = true;
            sceneCreateContractCache.map = {};
            try {
                const raw = sessionStorage.getItem(SCENE_CREATE_CONTRACT_CACHE_STORAGE_KEY);
                if (!raw) return;
                const parsed = JSON.parse(raw);
                if (!isPlainObject(parsed)) return;
                Object.keys(parsed).forEach(key => {
                    const entry = parsed[key];
                    if (!isPlainObject(entry)) return;
                    const ts = toNumber(entry.ts, 0);
                    if (!ts || Date.now() - ts > SCENE_CREATE_CONTRACT_CACHE_TTL_MS) return;
                    const data = isPlainObject(entry.data) ? entry.data : null;
                    if (!data) return;
                    sceneCreateContractCache.map[key] = {
                        ts,
                        data
                    };
                });
            } catch { }
        };

        const persistSceneCreateContractCache = () => {
            try {
                sessionStorage.setItem(SCENE_CREATE_CONTRACT_CACHE_STORAGE_KEY, JSON.stringify(sceneCreateContractCache.map || {}));
            } catch { }
        };

        const buildSceneCreateContractCacheKey = (sceneName = '', goalLabel = '') => {
            const scene = String(sceneName || '').trim();
            const goal = normalizeGoalCandidateLabel(goalLabel || '');
            return `${scene}::${goal || '__scene_default__'}`;
        };

        const getCachedSceneCreateContract = (sceneName = '', goalLabel = '') => {
            loadSceneCreateContractCache();
            const key = buildSceneCreateContractCacheKey(sceneName, goalLabel);
            const entry = sceneCreateContractCache.map[key];
            if (!entry || !entry.ts || !isPlainObject(entry.data)) return null;
            if (Date.now() - entry.ts > SCENE_CREATE_CONTRACT_CACHE_TTL_MS) {
                delete sceneCreateContractCache.map[key];
                persistSceneCreateContractCache();
                return null;
            }
            return deepClone(entry.data);
        };

        const getSceneCreateContract = (sceneName = '', goalLabel = '') => {
            const targetScene = String(sceneName || inferCurrentSceneName() || '').trim();
            const targetGoal = normalizeGoalCandidateLabel(goalLabel || '');
            if (!targetScene) {
                return {
                    ok: false,
                    sceneName: '',
                    goalLabel: targetGoal || '',
                    contract: null,
                    error: '缺少 sceneName'
                };
            }
            const contract = getCachedSceneCreateContract(targetScene, targetGoal)
                || getCachedSceneCreateContract(targetScene, '');
            return {
                ok: !!contract,
                sceneName: targetScene,
                goalLabel: targetGoal || '',
                contract: contract ? deepClone(contract) : null,
                fallbackUsed: !targetGoal && !!contract,
                error: contract ? '' : 'scene_create_contract_not_cached'
            };
        };

        const setCachedSceneCreateContract = (sceneName = '', goalLabel = '', value = null) => {
            const scene = String(sceneName || '').trim();
            if (!scene || !isPlainObject(value)) return;
            loadSceneCreateContractCache();
            const key = buildSceneCreateContractCacheKey(scene, goalLabel);
            sceneCreateContractCache.map[key] = {
                ts: Date.now(),
                data: deepClone(value)
            };
            persistSceneCreateContractCache();
        };

        const collectTopDownSections = (root) => {
            if (!root) return [];
            const entries = collectVisibleTextEntries(root);
            const dedup = new Map();
            entries.forEach(entry => {
                const text = normalizeText(entry?.text || '');
                if (!text) return;
                if (SCENE_NAME_LIST.includes(text)) return;
                const likelySection = isLikelySectionTitle(text) || SCENE_SECTION_HINT_RE.test(text);
                if (!likelySection) return;
                if (SCENE_SKIP_TEXT_RE.test(text)) return;
                if (!dedup.has(text)) {
                    dedup.set(text, {
                        title: text,
                        top: entry.top,
                        left: entry.left
                    });
                } else {
                    const prev = dedup.get(text);
                    if (entry.top < prev.top) {
                        dedup.set(text, {
                            title: text,
                            top: entry.top,
                            left: entry.left
                        });
                    }
                }
            });
            const list = Array.from(dedup.values())
                .sort((a, b) => (a.top - b.top) || (a.left - b.left))
                .slice(0, 36);
            if (!list.length) {
                return [{
                    title: '页面根层',
                    top: Math.round(root.getBoundingClientRect().top || 0),
                    left: Math.round(root.getBoundingClientRect().left || 0),
                    bottom: Math.round((root.getBoundingClientRect().bottom || 0))
                }];
            }
            return list.map((item, idx) => ({
                ...item,
                bottom: idx < list.length - 1 ? list[idx + 1].top - 1 : Number.MAX_SAFE_INTEGER
            }));
        };

        const resolveGroupSection = (group = {}, sections = []) => {
            if (!Array.isArray(sections) || !sections.length) return '页面根层';
            const top = toNumber(group?.top, NaN);
            if (!Number.isFinite(top)) return sections[0].title;
            const matched = sections.find(section => top >= section.top && top <= section.bottom);
            return matched?.title || sections[sections.length - 1].title;
        };

        const toLayerPathText = (layerPath = []) => layerPath.length
            ? layerPath.map(step => `${step.groupLabel || '分组'}:${step.optionText || ''}`).join(' > ')
            : '(根层)';

        const normalizeSnapshotLayerPath = (layerPath = []) => (Array.isArray(layerPath) ? layerPath : []).map(step => ({
            groupKey: step?.groupKey || '',
            groupLabel: step?.groupLabel || '',
            optionText: step?.optionText || ''
        }));

        const captureEditableState = (root) => {
            if (!root) return [];
            const controls = Array.from(root.querySelectorAll('input,textarea,select'))
                .filter(el => isElementVisible(el) && !el.disabled)
                .slice(0, 240);
            return controls.map(el => ({
                el,
                tag: el.tagName.toLowerCase(),
                type: String(el.type || '').toLowerCase(),
                label: findNearestLabelText(el),
                placeholder: normalizeText(el.getAttribute?.('placeholder') || ''),
                value: String(el.value ?? ''),
                checked: !!el.checked
            }));
        };

        const dispatchControlEvents = (el) => {
            try { el.dispatchEvent(new Event('input', { bubbles: true })); } catch { }
            try { el.dispatchEvent(new Event('change', { bubbles: true })); } catch { }
            try { el.dispatchEvent(new Event('blur', { bubbles: true })); } catch { }
        };

        const restoreEditableState = (stateList = []) => {
            if (!Array.isArray(stateList) || !stateList.length) return 0;
            let restoreCount = 0;
            stateList.forEach(item => {
                const el = item?.el;
                if (!el || !el.isConnected || el.disabled) return;
                try {
                    if (item.tag === 'input' && (item.type === 'checkbox' || item.type === 'radio')) {
                        if (el.checked !== !!item.checked) {
                            el.checked = !!item.checked;
                            dispatchControlEvents(el);
                            restoreCount += 1;
                        }
                        return;
                    }
                    const nextValue = String(item.value ?? '');
                    if (String(el.value ?? '') !== nextValue) {
                        el.value = nextValue;
                        dispatchControlEvents(el);
                        restoreCount += 1;
                    }
                } catch { }
            });
            return restoreCount;
        };

        const setInputValue = (el, value) => {
            if (!el || el.disabled) return false;
            const nextValue = String(value ?? '');
            if (String(el.value ?? '') === nextValue) return false;
            el.value = nextValue;
            dispatchControlEvents(el);
            return true;
        };

        const autoFillMinimumInputs = (root, sceneName = '') => {
            if (!root) return [];
            const actions = [];
            const inputs = Array.from(root.querySelectorAll('input:not([type="radio"]):not([type="checkbox"]):not([type="hidden"]), textarea'))
                .filter(el => isElementVisible(el) && !el.disabled)
                .slice(0, 120);
            inputs.forEach(el => {
                const label = normalizeText(findNearestLabelText(el));
                const placeholder = normalizeText(el.getAttribute?.('placeholder') || '');
                const token = `${label} ${placeholder}`;
                const current = String(el.value || '').trim();
                if (!current && /预算/.test(token)) {
                    if (setInputValue(el, '100')) {
                        actions.push({ type: 'fill_input', field: label || placeholder || '预算', value: '100' });
                    }
                    return;
                }
                if (!current && /(计划名称|计划名)/.test(token)) {
                    const value = `${sceneName || '计划'}_${todayStamp()}`;
                    if (setInputValue(el, value)) {
                        actions.push({ type: 'fill_input', field: label || placeholder || '计划名称', value });
                    }
                }
            });
            return actions;
        };

        const findSafeClickTargetByText = (pattern) => {
            if (!pattern) return null;
            const matcher = pattern instanceof RegExp ? pattern : new RegExp(String(pattern || ''));
            const elements = Array.from(document.querySelectorAll('button,[role="button"],a,div,span'))
                .filter(isElementVisible);
            for (const el of elements) {
                const text = normalizeText(getOwnText(el) || el.textContent || el.getAttribute?.('aria-label') || '');
                if (!text) continue;
                if (SCENE_FORBIDDEN_ACTION_RE.test(text)) continue;
                if (!matcher.test(text)) continue;
                return el;
            }
            return null;
        };

        const tryTemporaryAddItem = async (sceneName = '', scanOptions = {}) => {
            const beforeIds = extractPageAddedItemIds();
            if (!isSceneLikelyRequireItem(sceneName) || beforeIds.length) {
                return {
                    beforeIds,
                    afterIds: beforeIds.slice(),
                    tempIds: [],
                    actions: []
                };
            }
            const actions = [];
            const addBtn = findSafeClickTargetByText(/^(\+)?\s*添加商品(\s*\d+\s*\/\s*\d+)?$/);
            if (!addBtn) {
                return {
                    beforeIds,
                    afterIds: beforeIds.slice(),
                    tempIds: [],
                    actions
                };
            }

            clickElement(addBtn);
            actions.push({ type: 'click', text: '添加商品' });
            await waitForDomStable(scanOptions);

            const checkbox = Array.from(document.querySelectorAll('input[type="checkbox"]'))
                .find(el => isElementVisible(el) && !el.disabled && !el.checked);
            if (checkbox) {
                clickElement(checkbox.closest('label,[role="checkbox"],span,div') || checkbox);
                actions.push({ type: 'click', text: '勾选候选商品' });
                await sleep(140);
            }

            const confirmBtn = findSafeClickTargetByText(/^(确认添加|确定|完成|加入计划|加入投放|添加)$/);
            if (confirmBtn) {
                clickElement(confirmBtn);
                actions.push({ type: 'click', text: normalizeText(confirmBtn.textContent || '确认添加') });
                await waitForDomStable(scanOptions);
            }

            const afterIds = extractPageAddedItemIds();
            const tempIds = afterIds.filter(id => !beforeIds.includes(id));
            return {
                beforeIds,
                afterIds,
                tempIds,
                actions
            };
        };

        const rollbackTemporaryItems = async (unlockState = {}, scanOptions = {}) => {
            const beforeIds = Array.isArray(unlockState?.beforeIds) ? unlockState.beforeIds : [];
            const tempIds = Array.isArray(unlockState?.tempIds) ? unlockState.tempIds : [];
            if (beforeIds.length || !tempIds.length) return 0;
            let removed = 0;
            for (let i = 0; i < tempIds.length; i++) {
                const removeBtn = findSafeClickTargetByText(/^(移除|删除)$/);
                if (!removeBtn) break;
                clickElement(removeBtn);
                removed += 1;
                await sleep(120);
                const confirmBtn = findSafeClickTargetByText(/^(确定|确认|删除)$/);
                if (confirmBtn) clickElement(confirmBtn);
                await waitForDomStable(scanOptions);
            }
            return removed;
        };

        const scanSceneTopDownSettings = async (sceneName = '', options = {}) => {
            const targetSceneName = String(sceneName || '').trim();
            const maxDepth = Math.max(1, Math.min(4, toNumber(options.maxDepth, 3)));
            const maxGroupsPerLevel = Math.max(1, Math.min(8, toNumber(options.maxGroupsPerLevel, 5)));
            const maxOptionsPerGroup = Math.max(1, Math.min(10, toNumber(options.maxOptionsPerGroup, 6)));
            const maxSnapshots = Math.max(1, Math.min(96, toNumber(options.maxSnapshots, 36)));
            const baseLayerPath = normalizeSnapshotLayerPath(
                Array.isArray(options.baseLayerPath) ? options.baseLayerPath : []
            );
            const baseLayerPathText = toLayerPathText(baseLayerPath);
            const seenPathSet = new Set();
            const pathErrors = [];
            const routeSet = new Set();
            const snapshots = [];
            const sectionTrails = [];
            const aggregate = {
                ok: true,
                sceneName: targetSceneName,
                location: window.location.href,
                scannedAt: new Date().toISOString(),
                sectionTitles: [],
                sections: [],
                labels: [],
                radios: [],
                checkboxes: [],
                selects: [],
                inputs: [],
                buttonLikeOptions: [],
                optionGroups: [],
                optionTexts: [],
                textSamples: [],
                layerSnapshots: [],
                layerSummary: {},
                sectionTraversal: []
            };

            const pushSnapshot = (sectionTitle = '', layerPath = []) => {
                const snapshot = scanCurrentSceneSettings(targetSceneName, {
                    depth: layerPath.length,
                    sectionTitle: sectionTitle || '',
                    layerPath: normalizeSnapshotLayerPath(layerPath),
                    layerPathText: toLayerPathText(layerPath),
                    triggerPath: toLayerPathText(layerPath)
                });
                snapshots.push(snapshot);
                mergeSceneSchema(aggregate, snapshot);
                routeSet.add(snapshot.location);
                sectionTrails.push({
                    sectionTitle: sectionTitle || '',
                    pathText: snapshot.layerPathText || '(根层)',
                    depth: layerPath.length
                });
                if (typeof options.onProgress === 'function') {
                    try {
                        options.onProgress({
                            event: 'scene_top_down_snapshot',
                            sceneName: targetSceneName,
                            sectionTitle: sectionTitle || '',
                            depth: layerPath.length,
                            pathText: snapshot.layerPathText,
                            snapshotIndex: snapshots.length,
                            maxSnapshots
                        });
                    } catch { }
                }
            };

            const scanPath = async (sectionTitle = '', layerPath = []) => {
                if (snapshots.length >= maxSnapshots) return;
                const effectivePath = baseLayerPath.concat(layerPath);
                const pathKey = `${sectionTitle || '根层'}::${effectivePath.map(step => `${step.groupKey || ''}:${step.optionText || ''}`).join('>') || '__root__'}`;
                if (seenPathSet.has(pathKey)) return;
                seenPathSet.add(pathKey);
                const depth = layerPath.length;

                try {
                    await applySceneLayerPath(targetSceneName, effectivePath, options);
                    await waitForDomStable(options);
                } catch (err) {
                    pathErrors.push({
                        sectionTitle,
                        pathText: toLayerPathText(effectivePath),
                        error: err?.message || String(err)
                    });
                    return;
                }

                pushSnapshot(sectionTitle, effectivePath);
                if (depth >= maxDepth || snapshots.length >= maxSnapshots) return;

                const root = pickPlanConfigRoot();
                const sections = collectTopDownSections(root);
                const usedGroupKeys = new Set(effectivePath.map(step => String(step?.groupKey || '')).filter(Boolean));
                const nextGroups = collectLayerControlGroups(root)
                    .filter(group => !usedGroupKeys.has(String(group?.groupKey || '')))
                    .filter(group => {
                        if (!sectionTitle || depth > 0) return true;
                        return resolveGroupSection(group, sections) === sectionTitle;
                    })
                    .slice(0, maxGroupsPerLevel);
                for (let gi = 0; gi < nextGroups.length; gi++) {
                    const group = nextGroups[gi];
                    const optionList = group.options
                        .filter(option => !option.disabled && !SCENE_FORBIDDEN_ACTION_RE.test(option.optionText || ''))
                        .slice(0, maxOptionsPerGroup);
                    for (let oi = 0; oi < optionList.length; oi++) {
                        if (snapshots.length >= maxSnapshots) return;
                        const option = optionList[oi];
                        const nextPath = layerPath.concat([{
                            groupKey: group.groupKey,
                            groupLabel: group.groupLabel,
                            optionText: option.optionText
                        }]);
                        await scanPath(sectionTitle, nextPath);
                    }
                }
            };

            await ensureSceneRoute(targetSceneName, options);
            await waitForDomStable(options);
            if (baseLayerPath.length) {
                try {
                    await applySceneLayerPath(targetSceneName, baseLayerPath, options);
                    await waitForDomStable(options);
                } catch (err) {
                    pathErrors.push({
                        sectionTitle: '页面根层',
                        pathText: baseLayerPathText,
                        error: err?.message || String(err)
                    });
                }
            }
            const root = pickPlanConfigRoot();
            const sections = collectTopDownSections(root);
            pushSnapshot('页面根层', baseLayerPath);
            const groups = collectLayerControlGroups(root);
            const baseGroupSet = new Set(baseLayerPath.map(step => String(step?.groupKey || '')).filter(Boolean));
            for (let si = 0; si < sections.length; si++) {
                const section = sections[si];
                const sectionGroups = groups
                    .filter(group => !baseGroupSet.has(String(group?.groupKey || '')))
                    .filter(group => resolveGroupSection(group, sections) === section.title)
                    .slice(0, maxGroupsPerLevel);
                for (let gi = 0; gi < sectionGroups.length; gi++) {
                    if (snapshots.length >= maxSnapshots) break;
                    const group = sectionGroups[gi];
                    const optionList = group.options
                        .filter(option => !option.disabled && !SCENE_FORBIDDEN_ACTION_RE.test(option.optionText || ''))
                        .slice(0, maxOptionsPerGroup);
                    for (let oi = 0; oi < optionList.length; oi++) {
                        if (snapshots.length >= maxSnapshots) break;
                        const option = optionList[oi];
                        await scanPath(section.title, [{
                            groupKey: group.groupKey,
                            groupLabel: group.groupLabel,
                            optionText: option.optionText
                        }]);
                    }
                }
                if (snapshots.length >= maxSnapshots) break;
            }

            aggregate.layerSnapshots = snapshots.map(item => ({
                sceneName: item.sceneName,
                depth: item.depth,
                sectionTitle: item.sectionTitle || '',
                layerPath: item.layerPath || [],
                layerPathText: item.layerPathText || '',
                triggerPath: item.triggerPath || '',
                location: item.location,
                labels: item.labels || [],
                sectionTitles: item.sectionTitles || [],
                radios: item.radios || [],
                selects: item.selects || [],
                inputs: item.inputs || []
            }));
            aggregate.sectionTraversal = sectionTrails.slice(0, 240);
            aggregate.layerSummary = {
                mode: 'full_top_down',
                maxDepth,
                maxGroupsPerLevel,
                maxOptionsPerGroup,
                maxSnapshots,
                snapshotCount: snapshots.length,
                exploredPathCount: seenPathSet.size,
                baseLayerPath: deepClone(baseLayerPath),
                baseLayerPathText,
                routeList: Array.from(routeSet),
                errorCount: pathErrors.length,
                sectionCount: sections.length
            };
            if (pathErrors.length) {
                aggregate.layerErrors = pathErrors.slice(0, 60);
            }
            aggregate.location = window.location.href;
            aggregate.scannedAt = new Date().toISOString();
            return aggregate;
        };

        const pickGoalRuntimeSnapshot = (runtime = {}) => {
            const campaign = runtime?.solutionTemplate?.campaign || {};
            const storeData = runtime?.storeData || {};
            const out = {};
            SCENE_GOAL_RUNTIME_KEYS.forEach(key => {
                const fromStore = storeData?.[key];
                const fromCampaign = campaign?.[key];
                const fromRuntime = runtime?.[key];
                const picked = fromStore !== undefined && fromStore !== null && fromStore !== ''
                    ? fromStore
                    : (fromCampaign !== undefined && fromCampaign !== null && fromCampaign !== ''
                        ? fromCampaign
                        : fromRuntime);
                if (picked === undefined || picked === null || picked === '') return;
                out[key] = deepClone(picked);
            });
            return out;
        };

        const normalizeGoalCreateEndpoint = (path = '') => {
            const raw = String(path || '').trim();
            const normalized = normalizeCapturePath(raw);
            // 空值在 URL 归一化后会变成 "/"，需要视为无效并回退。
            if (!raw || !normalized || normalized === '/') return SCENE_CREATE_ENDPOINT_FALLBACK;
            if (!/\/solution\/.+addList\.json$/i.test(normalized)) return normalized;
            return normalized;
        };
        const normalizeCapturedCreateEndpoint = (path = '') => {
            const raw = String(path || '').trim();
            const normalized = normalizeCapturePath(raw);
            if (!raw || !normalized || normalized === '/') return '';
            return normalized;
        };

        const buildGoalCreateContract = ({ runtime = {}, loadContracts = [], networkOnly = false } = {}) => {
            const runtimeCampaign = purgeCreateTransientFields(sanitizeCampaign(runtime?.solutionTemplate?.campaign || {}));
            const runtimeAdgroup = purgeCreateTransientFields(sanitizeAdgroup(runtime?.solutionTemplate?.adgroupList?.[0] || {}));
            const mergedContracts = mergeContractSummaries(loadContracts || []);
            const createCapture = pickGoalCreateSubmitContract(mergedContracts);
            const endpoint = normalizeGoalCreateEndpoint(
                createCapture?.path
                || resolveGoalCreateEndpoint(mergedContracts)
                || SCENE_CREATE_ENDPOINT_FALLBACK
            );
            const payloadSample = findSolutionPayloadFromSample(createCapture?.sampleBody || null);
            const requestBody = isPlainObject(payloadSample.requestBody) ? payloadSample.requestBody : {};
            const sampledSolution = isPlainObject(payloadSample.solution) ? payloadSample.solution : {};
            const sampledCampaign = isPlainObject(sampledSolution.campaign) ? sampledSolution.campaign : {};
            const sampledAdgroup = Array.isArray(sampledSolution.adgroupList) && isPlainObject(sampledSolution.adgroupList[0])
                ? sampledSolution.adgroupList[0]
                : {};
            const campaign = Object.keys(sampledCampaign).length
                ? purgeCreateTransientFields(sanitizeCampaign(sampledCampaign))
                : (networkOnly ? {} : runtimeCampaign);
            const adgroup = Object.keys(sampledAdgroup).length
                ? purgeCreateTransientFields(sanitizeAdgroup(sampledAdgroup))
                : (networkOnly ? {} : runtimeAdgroup);
            const requestKeys = Object.keys(requestBody || {}).slice(0, 240);
            const solutionKeys = Object.keys(sampledSolution || {}).slice(0, 240);
            if (networkOnly && !createCapture) {
                return {
                    endpoint: '',
                    method: 'POST',
                    requestKeys: [],
                    solutionKeys: [],
                    campaignKeys: [],
                    adgroupKeys: [],
                    defaultCampaign: {},
                    defaultAdgroup: {},
                    source: 'network_missing'
                };
            }
            return {
                endpoint,
                method: normalizeCaptureMethod(createCapture?.method || 'POST'),
                requestKeys: requestKeys.length
                    ? requestKeys
                    : (Array.isArray(createCapture?.bodyKeys) ? createCapture.bodyKeys.slice(0, 240) : ['bizCode', 'solutionList']),
                solutionKeys: solutionKeys.length
                    ? solutionKeys
                    : (networkOnly ? [] : ['bizCode', 'campaign', 'adgroupList']),
                campaignKeys: Object.keys(campaign || {}).slice(0, 240),
                adgroupKeys: Object.keys(adgroup || {}).slice(0, 240),
                defaultCampaign: deepClone(campaign || {}),
                defaultAdgroup: deepClone(adgroup || {}),
                source: createCapture ? 'network_capture' : (networkOnly ? 'network_missing' : 'runtime_fallback')
            };
        };

        const normalizeGoalFieldRows = (fieldRows = []) => uniqueBy(
            (Array.isArray(fieldRows) ? fieldRows : [])
                .map(field => {
                    const label = normalizeText(field?.label || field?.settingKey || '');
                    if (!label) return null;
                    const options = uniqueBy(
                        (Array.isArray(field?.options) ? field.options : [])
                            .map(item => normalizeText(item))
                            .filter(Boolean),
                        item => item
                    ).slice(0, 48);
                    return {
                        key: normalizeSceneSpecFieldKey(label),
                        label,
                        options,
                        defaultValue: normalizeSceneSettingValue(field?.defaultValue || ''),
                        dependsOn: uniqueBy((Array.isArray(field?.dependsOn) ? field.dependsOn : []).map(item => normalizeText(item)).filter(Boolean), item => item).slice(0, 16),
                        requiredGuess: !!field?.requiredGuess,
                        criticalGuess: !!field?.criticalGuess,
                        triggerPath: normalizeText(field?.triggerPath || ''),
                        pathHints: uniqueBy((Array.isArray(field?.pathHints) ? field.pathHints : []).map(item => normalizeText(item)).filter(Boolean), item => item).slice(0, 18),
                        source: uniqueBy((Array.isArray(field?.source) ? field.source : []).map(item => normalizeText(item)).filter(Boolean), item => item).slice(0, 18)
                    };
                })
                .filter(Boolean),
            item => `${item.key}::${item.label}`
        ).slice(0, 320);

        const buildGoalFieldRowsFromSceneScan = ({
            sceneName = '',
            runtime = {},
            scanResult = null,
            scanOptions = {}
        } = {}) => {
            const sceneSpec = buildSceneSpecFromScan({
                sceneName,
                runtime,
                scanResult,
                scanMeta: {
                    scanMode: scanOptions?.scanMode || 'full_top_down',
                    unlockPolicy: scanOptions?.unlockPolicy || 'safe_only',
                    goalSpecs: [],
                    goalWarnings: [],
                    unlockActions: [],
                    warnings: []
                }
            });
            const fieldRows = normalizeGoalFieldRows(sceneSpec?.fields || []);
            const fieldMatrix = fieldRows.reduce((acc, row) => {
                acc[row.label] = {
                    options: row.options.slice(0, 48),
                    defaultValue: row.defaultValue || '',
                    requiredGuess: !!row.requiredGuess,
                    criticalGuess: !!row.criticalGuess,
                    dependsOn: row.dependsOn.slice(0, 16),
                    triggerPath: row.triggerPath || ''
                };
                return acc;
            }, {});
            return {
                fieldRows,
                fieldMatrix,
                sectionOrder: Array.isArray(sceneSpec?.sectionOrder) ? sceneSpec.sectionOrder.slice(0, 80) : [],
                fieldCoverage: {
                    fieldCount: fieldRows.length,
                    optionCount: fieldRows.reduce((sum, row) => sum + (Array.isArray(row.options) ? row.options.length : 0), 0),
                    requiredCount: fieldRows.filter(row => row.requiredGuess).length,
                    criticalCount: fieldRows.filter(row => row.criticalGuess).length,
                    sectionCount: toNumber(sceneSpec?.coverage?.sectionCount, 0),
                    snapshotCount: toNumber(sceneSpec?.coverage?.snapshotCount, 0),
                    scanMode: sceneSpec?.scanMode || scanOptions?.scanMode || 'full_top_down'
                }
            };
        };

        const buildGoalSpecFromOption = ({
            option = {},
            runtime = {},
            loadContracts = [],
            triggerPath = '',
            contractMode = '',
            fieldRows = [],
            fieldMatrix = {},
            fieldCoverage = {},
            sectionOrder = []
        } = {}) => {
            const goalLabel = normalizeGoalCandidateLabel(option?.goalLabel || option?.optionText || '');
            const runtimeSnapshot = pickGoalRuntimeSnapshot(runtime);
            const createContract = buildGoalCreateContract({
                runtime,
                loadContracts,
                networkOnly: contractMode === 'network_only'
            });
            return {
                goalKey: normalizeGoalKey(goalLabel || option?.optionText || ''),
                goalLabel: goalLabel || normalizeGoalCandidateLabel(option?.goalLabel || option?.optionText || ''),
                isDefault: !!option?.selected,
                runtimeSnapshot,
                createContract,
                loadContracts,
                triggerPath: triggerPath || toLayerPathText([{
                    groupLabel: option?.groupLabel || '',
                    optionText: option?.optionText || ''
                }]),
                groupKey: option?.groupKey || '',
                groupLabel: option?.groupLabel || '',
                fieldRows: normalizeGoalFieldRows(fieldRows),
                fieldMatrix: isPlainObject(fieldMatrix) ? deepClone(fieldMatrix) : {},
                fieldCoverage: isPlainObject(fieldCoverage) ? deepClone(fieldCoverage) : {},
                sectionOrder: uniqueBy((Array.isArray(sectionOrder) ? sectionOrder : []).map(item => normalizeText(item)).filter(Boolean), item => item).slice(0, 80)
            };
        };

        const scanSceneGoalSpecs = async (sceneName = '', options = {}) => {
            const targetSceneName = String(sceneName || '').trim();
            if (!targetSceneName) {
                return {
                    ok: false,
                    sceneName: '',
                    goals: [],
                    warnings: ['缺少 sceneName，无法采集营销目标配置']
                };
            }
            await ensureSceneRoute(targetSceneName, options);
            await waitForDomStable(options);
            const root = pickPlanConfigRoot();
            const goalOptions = collectMarketingGoalCandidates(root);
            const warnings = [];
            const goals = [];
            const contractMode = String(options.contractMode || '').trim();
            const goalFieldScan = options.goalFieldScan !== false;
            const goalFieldScanMode = options.goalFieldScanMode === 'visible' ? 'visible' : 'full_top_down';
            const goalFieldScanOptions = {
                scanMode: goalFieldScanMode,
                unlockPolicy: options.unlockPolicy || 'safe_only',
                maxDepth: Math.max(1, Math.min(4, toNumber(options.goalFieldMaxDepth, 2))),
                maxSnapshots: Math.max(1, Math.min(120, toNumber(options.goalFieldMaxSnapshots, 48))),
                maxGroupsPerLevel: Math.max(1, Math.min(10, toNumber(options.goalFieldMaxGroupsPerLevel, 6))),
                maxOptionsPerGroup: Math.max(1, Math.min(12, toNumber(options.goalFieldMaxOptionsPerGroup, 8)))
            };
            const captureSession = createGoalCaptureSession({
                includePattern: /\.json(?:$|\?)/i
            });
            let mark = captureSession.mark();
            if (!goalOptions.length) {
                const runtime = await getRuntimeDefaults(true);
                const fallbackGoalLabel = normalizeGoalLabel(
                    runtime?.storeData?.promotionModelMarketing
                    || runtime?.storeData?.promotionModel
                    || runtime?.storeData?.optimizeTarget
                    || runtime?.storeData?.promotionScene
                    || SCENE_SPEC_FIELD_FALLBACK[targetSceneName]?.营销目标
                    || ''
                );
                const loadContracts = summarizeGoalLoadContracts(captureSession.sliceFrom(mark));
                let goalFieldRows = [];
                let goalFieldMatrix = {};
                let goalFieldCoverage = {};
                let goalSectionOrder = [];
                if (goalFieldScan) {
                    try {
                        const visibleSnapshot = scanCurrentSceneSettings(targetSceneName, {
                            depth: 0,
                            sectionTitle: '页面根层',
                            layerPath: [],
                            layerPathText: '(根层)',
                            triggerPath: '(根层)'
                        });
                        visibleSnapshot.layerSnapshots = [{
                            sceneName: targetSceneName,
                            depth: 0,
                            sectionTitle: '页面根层',
                            layerPath: [],
                            layerPathText: '(根层)',
                            triggerPath: '(根层)',
                            labels: visibleSnapshot.labels || [],
                            sectionTitles: visibleSnapshot.sectionTitles || [],
                            radios: visibleSnapshot.radios || [],
                            selects: visibleSnapshot.selects || [],
                            inputs: visibleSnapshot.inputs || []
                        }];
                        visibleSnapshot.layerSummary = {
                            mode: 'visible',
                            snapshotCount: 1,
                            sectionCount: (visibleSnapshot.sectionTitles || []).length || 1
                        };
                        const goalFieldBundle = buildGoalFieldRowsFromSceneScan({
                            sceneName: targetSceneName,
                            runtime,
                            scanResult: visibleSnapshot,
                            scanOptions: {
                                scanMode: 'visible',
                                unlockPolicy: options.unlockPolicy || 'safe_only'
                            }
                        });
                        goalFieldRows = goalFieldBundle.fieldRows || [];
                        goalFieldMatrix = goalFieldBundle.fieldMatrix || {};
                        goalFieldCoverage = goalFieldBundle.fieldCoverage || {};
                        goalSectionOrder = goalFieldBundle.sectionOrder || [];
                    } catch (err) {
                        warnings.push(`营销目标行配置采集失败：默认目标 -> ${err?.message || err}`);
                    }
                }
                const fallbackGoal = buildGoalSpecFromOption({
                    option: {
                        optionText: fallbackGoalLabel || `默认目标_${targetSceneName}`,
                        selected: true,
                        groupKey: 'fallback',
                        groupLabel: '营销目标'
                    },
                    runtime,
                    loadContracts,
                    triggerPath: '(根层)',
                    contractMode,
                    fieldRows: goalFieldRows,
                    fieldMatrix: goalFieldMatrix,
                    fieldCoverage: goalFieldCoverage,
                    sectionOrder: goalSectionOrder
                });
                const fallbackGoalLabels = getSceneMarketingGoalFallbackList(targetSceneName);
                const fallbackGoals = [fallbackGoal];
                fallbackGoalLabels.forEach(label => {
                    if (!label) return;
                    if (normalizeGoalCandidateLabel(fallbackGoal.goalLabel || '') === label) return;
                    const clone = deepClone(fallbackGoal);
                    clone.goalLabel = label;
                    clone.goalKey = normalizeGoalKey(label);
                    clone.isDefault = false;
                    clone.triggerPath = `营销目标:${label}`;
                    fallbackGoals.push(clone);
                });
                captureSession.stop();
                return {
                    ok: true,
                    sceneName: targetSceneName,
                    scannedAt: new Date().toISOString(),
                    goals: uniqueBy(fallbackGoals, goal => `${goal.goalKey}::${goal.goalLabel}`),
                    warnings: ['未识别到可点击的营销目标选项，已回退当前运行时默认目标']
                };
            }

            for (let i = 0; i < goalOptions.length; i++) {
                const option = goalOptions[i];
                try {
                    const goalStep = {
                        groupKey: option.groupKey,
                        groupLabel: option.groupLabel,
                        optionText: option.optionText
                    };
                    await applySceneLayerPath(targetSceneName, [goalStep], options);
                    await waitForDomStable(options);
                    const runtime = await getRuntimeDefaults(true);
                    let goalFieldRows = [];
                    let goalFieldMatrix = {};
                    let goalFieldCoverage = {};
                    let goalSectionOrder = [];
                    if (goalFieldScan) {
                        try {
                            let goalFieldScanResult = null;
                            if (goalFieldScanMode === 'visible') {
                                goalFieldScanResult = scanCurrentSceneSettings(targetSceneName, {
                                    depth: 1,
                                    sectionTitle: '页面根层',
                                    layerPath: [goalStep],
                                    layerPathText: toLayerPathText([goalStep]),
                                    triggerPath: toLayerPathText([goalStep])
                                });
                                goalFieldScanResult.layerSnapshots = [{
                                    sceneName: targetSceneName,
                                    depth: 1,
                                    sectionTitle: '页面根层',
                                    layerPath: [goalStep],
                                    layerPathText: toLayerPathText([goalStep]),
                                    triggerPath: toLayerPathText([goalStep]),
                                    labels: goalFieldScanResult.labels || [],
                                    sectionTitles: goalFieldScanResult.sectionTitles || [],
                                    radios: goalFieldScanResult.radios || [],
                                    selects: goalFieldScanResult.selects || [],
                                    inputs: goalFieldScanResult.inputs || []
                                }];
                                goalFieldScanResult.layerSummary = {
                                    mode: 'visible',
                                    snapshotCount: 1,
                                    sectionCount: (goalFieldScanResult.sectionTitles || []).length || 1
                                };
                            } else {
                                goalFieldScanResult = await scanSceneTopDownSettings(targetSceneName, {
                                    ...options,
                                    maxDepth: goalFieldScanOptions.maxDepth,
                                    maxSnapshots: goalFieldScanOptions.maxSnapshots,
                                    maxGroupsPerLevel: goalFieldScanOptions.maxGroupsPerLevel,
                                    maxOptionsPerGroup: goalFieldScanOptions.maxOptionsPerGroup,
                                    baseLayerPath: [goalStep]
                                });
                            }
                            const goalFieldBundle = buildGoalFieldRowsFromSceneScan({
                                sceneName: targetSceneName,
                                runtime,
                                scanResult: goalFieldScanResult,
                                scanOptions: goalFieldScanOptions
                            });
                            goalFieldRows = goalFieldBundle.fieldRows || [];
                            goalFieldMatrix = goalFieldBundle.fieldMatrix || {};
                            goalFieldCoverage = goalFieldBundle.fieldCoverage || {};
                            goalSectionOrder = goalFieldBundle.sectionOrder || [];
                        } catch (err) {
                            warnings.push(`营销目标行配置采集失败：${option.optionText || '未知选项'} -> ${err?.message || err}`);
                        }
                    }
                    const delta = captureSession.sliceFrom(mark);
                    mark = captureSession.mark();
                    const loadContracts = summarizeGoalLoadContracts(delta);
                    goals.push(buildGoalSpecFromOption({
                        option,
                        runtime,
                        loadContracts,
                        triggerPath: toLayerPathText([{
                            groupKey: option.groupKey,
                            groupLabel: option.groupLabel,
                            optionText: option.optionText
                        }]),
                        contractMode,
                        fieldRows: goalFieldRows,
                        fieldMatrix: goalFieldMatrix,
                        fieldCoverage: goalFieldCoverage,
                        sectionOrder: goalSectionOrder
                    }));
                } catch (err) {
                    warnings.push(`营销目标采集失败：${option.optionText || '未知选项'} -> ${err?.message || err}`);
                }
            }
            captureSession.stop();

            const dedupGoals = uniqueBy(
                goals.filter(goal => goal.goalLabel),
                goal => `${goal.goalKey}::${goal.goalLabel}`
            );
            const fallbackGoalLabels = getSceneMarketingGoalFallbackList(targetSceneName);
            if (fallbackGoalLabels.length && dedupGoals.length) {
                const existingGoalSet = new Set(
                    dedupGoals
                        .map(goal => normalizeGoalCandidateLabel(goal?.goalLabel || ''))
                        .filter(Boolean)
                );
                let addedFallbackCount = 0;
                fallbackGoalLabels.forEach(label => {
                    if (existingGoalSet.has(label)) return;
                    const sample = dedupGoals[0] || {};
                    const clone = deepClone(sample);
                    clone.goalLabel = label;
                    clone.goalKey = normalizeGoalKey(label);
                    clone.isDefault = false;
                    clone.triggerPath = clone.triggerPath || `营销目标:${label}`;
                    dedupGoals.push(clone);
                    existingGoalSet.add(label);
                    addedFallbackCount += 1;
                });
                if (addedFallbackCount > 0) {
                    warnings.push(`场景「${targetSceneName}」营销目标识别不足，已补齐兜底目标 ${addedFallbackCount} 条`);
                }
            }
            if (dedupGoals.length && !dedupGoals.some(goal => goal.isDefault)) {
                dedupGoals[0].isDefault = true;
            }
            return {
                ok: true,
                sceneName: targetSceneName,
                scannedAt: new Date().toISOString(),
                goals: dedupGoals,
                warnings
            };
        };

        const deriveTemplateSceneSettings = (runtime = {}) => {
            const campaign = runtime?.solutionTemplate?.campaign || {};
            const out = {};
            const bidType = mapSceneBidTypeValue(campaign.bidTypeV2 || runtime.bidTypeV2 || '');
            const bidTarget = mapSceneBidTargetValue(campaign.bidTargetV2 || campaign.optimizeTarget || runtime.bidTargetV2 || '');
            const budgetType = mapSceneBudgetTypeValue(campaign.dmcType || runtime.dmcType || '');
            if (bidType === 'smart_bid') out.出价方式 = '智能出价';
            if (bidType === 'manual_bid') out.出价方式 = '手动出价';
            if (bidTarget) {
                const map = {
                    conv: '获取成交量',
                    roi: '稳定投产比',
                    click: '增加点击量',
                    fav_cart: '增加收藏加购量',
                    market_penetration: '提升市场渗透',
                    similar_item: '相似品跟投',
                    search_rank: '抢占搜索卡位',
                    display_shentou: '拉新渗透'
                };
                out.出价目标 = map[bidTarget] || '';
            }
            if (budgetType === 'day_average') out.预算类型 = '日均预算';
            if (budgetType === 'normal') out.预算类型 = '每日预算';
            if (campaign.campaignName) out.计划名称 = String(campaign.campaignName).trim();
            return Object.keys(out).reduce((acc, key) => {
                if (!out[key]) return acc;
                acc[key] = out[key];
                return acc;
            }, {});
        };

        const buildSceneSpecFromScan = ({ sceneName = '', runtime = {}, scanResult = null, scanMeta = {} }) => {
            const targetScene = String(sceneName || '').trim();
            const source = isPlainObject(scanResult) ? scanResult : {};
            const snapshots = Array.isArray(source.layerSnapshots) ? source.layerSnapshots : [];
            const sections = collectTopDownSections(pickPlanConfigRoot());
            const templateDefaults = deriveTemplateSceneSettings(runtime);
            const fallbackDefaults = isPlainObject(SCENE_SPEC_FIELD_FALLBACK[targetScene]) ? SCENE_SPEC_FIELD_FALLBACK[targetScene] : {};
            const fieldMap = new Map();

            const pushField = (label = '', patch = {}) => {
                const fieldLabel = normalizeText(label);
                if (!fieldLabel || !isLikelyFieldLabel(fieldLabel)) return;
                const key = normalizeSceneSpecFieldKey(fieldLabel);
                const current = fieldMap.get(key) || {
                    key,
                    label: fieldLabel,
                    settingKey: fieldLabel,
                    options: [],
                    pathHints: [],
                    triggerPath: '',
                    dependsOn: inferSceneFieldDependsOn(fieldLabel),
                    requiredGuess: SCENE_REQUIRED_GUESS_RE.test(fieldLabel),
                    defaultValue: '',
                    source: []
                };
                const mergedOptions = uniqueBy((current.options || []).concat((patch.options || []).map(item => normalizeText(item)).filter(Boolean)), item => item).slice(0, 36);
                const mergedHints = uniqueBy((current.pathHints || []).concat((patch.pathHints || []).map(item => normalizeText(item)).filter(Boolean)), item => item).slice(0, 16);
                const mergedSource = uniqueBy((current.source || []).concat((patch.source || []).map(item => normalizeText(item)).filter(Boolean)), item => item).slice(0, 12);
                const defaultValue = normalizeSceneSettingValue(
                    patch.defaultValue
                    || current.defaultValue
                    || templateDefaults[fieldLabel]
                    || fallbackDefaults[fieldLabel]
                    || ''
                );
                fieldMap.set(key, {
                    ...current,
                    ...patch,
                    label: fieldLabel,
                    settingKey: fieldLabel,
                    options: mergedOptions,
                    pathHints: mergedHints,
                    source: mergedSource,
                    triggerPath: patch.triggerPath || current.triggerPath || '',
                    dependsOn: uniqueBy((current.dependsOn || []).concat((patch.dependsOn || []).map(item => normalizeText(item)).filter(Boolean)), item => item).slice(0, 10),
                    requiredGuess: patch.requiredGuess === true || current.requiredGuess === true,
                    defaultValue
                });
            };

            (source.labels || []).forEach(label => pushField(label, { source: ['label'] }));
            (source.sectionTitles || []).forEach(label => pushField(label, { source: ['section_title'], pathHints: [label] }));
            (source.sections || []).forEach(section => {
                pushField(section?.title || '', {
                    options: Array.isArray(section?.options) ? section.options : [],
                    source: ['section_options'],
                    pathHints: [section?.title || '']
                });
            });
            (source.selects || []).forEach(selectItem => {
                const selectedOption = (selectItem?.options || []).find(opt => opt?.selected) || null;
                pushField(selectItem?.label || '', {
                    options: (selectItem?.options || []).map(opt => opt?.label || opt?.value || ''),
                    defaultValue: selectedOption?.label || selectedOption?.value || selectItem?.value || '',
                    source: ['select']
                });
            });
            const radioMap = new Map();
            (source.radios || []).forEach(radio => {
                const label = normalizeText(radio?.label || '');
                if (!label) return;
                if (!radioMap.has(label)) {
                    radioMap.set(label, {
                        options: [],
                        selected: ''
                    });
                }
                const bucket = radioMap.get(label);
                const optionText = normalizeText(radio?.text || '');
                if (optionText) bucket.options.push(optionText);
                if (radio?.checked && optionText) bucket.selected = optionText;
            });
            radioMap.forEach((bucket, label) => {
                pushField(label, {
                    options: bucket.options,
                    defaultValue: bucket.selected,
                    source: ['radio']
                });
            });
            (source.inputs || []).forEach(input => {
                pushField(input?.label || '', {
                    defaultValue: input?.value || '',
                    source: ['input']
                });
            });

            snapshots.forEach(snapshot => {
                const pathText = String(snapshot?.layerPathText || '').trim();
                const sectionTitle = String(snapshot?.sectionTitle || '').trim();
                const labels = uniqueBy([
                    ...((snapshot?.labels || []).filter(Boolean)),
                    ...((snapshot?.sectionTitles || []).filter(Boolean)),
                    ...((snapshot?.selects || []).map(item => item?.label || '').filter(Boolean)),
                    ...((snapshot?.inputs || []).map(item => item?.label || '').filter(Boolean)),
                    ...((snapshot?.radios || []).map(item => item?.label || '').filter(Boolean))
                ], item => item);
                labels.forEach(label => {
                    const key = normalizeSceneSpecFieldKey(label);
                    if (!fieldMap.has(key)) return;
                    const current = fieldMap.get(key);
                    if (!current.triggerPath && pathText) {
                        current.triggerPath = pathText;
                    }
                    if (sectionTitle) {
                        current.pathHints = uniqueBy((current.pathHints || []).concat([sectionTitle]), item => item).slice(0, 16);
                    }
                    fieldMap.set(key, current);
                });
            });

            Object.keys(templateDefaults).forEach(label => {
                pushField(label, {
                    defaultValue: templateDefaults[label],
                    source: ['runtime_template']
                });
            });
            Object.keys(fallbackDefaults).forEach(label => {
                pushField(label, {
                    defaultValue: fallbackDefaults[label],
                    source: ['scene_fallback']
                });
            });

            const fields = Array.from(fieldMap.values())
                .map(field => ({
                    key: field.key,
                    label: field.label,
                    settingKey: field.settingKey,
                    options: field.options || [],
                    pathHints: field.pathHints || [],
                    triggerPath: field.triggerPath || '',
                    dependsOn: field.dependsOn || [],
                    requiredGuess: !!field.requiredGuess,
                    defaultValue: normalizeSceneSettingValue(field.defaultValue || ''),
                    source: (field.source || []).filter(Boolean),
                    criticalGuess: isLikelyCriticalSceneField(field.label)
                }))
                .sort((a, b) => {
                    const ai = a.pathHints?.[0] ? sections.findIndex(section => section.title === a.pathHints[0]) : -1;
                    const bi = b.pathHints?.[0] ? sections.findIndex(section => section.title === b.pathHints[0]) : -1;
                    if (ai !== bi) return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi);
                    return a.label.localeCompare(b.label, 'zh-CN');
                });

            const optionCount = fields.reduce((sum, field) => sum + (Array.isArray(field.options) ? field.options.length : 0), 0);
            const goals = uniqueBy(
                (Array.isArray(scanMeta?.goalSpecs) ? scanMeta.goalSpecs : [])
                    .map(goal => ({
                        goalKey: normalizeGoalKey(goal?.goalKey || goal?.goalLabel || ''),
                        goalLabel: normalizeGoalLabel(goal?.goalLabel || ''),
                        isDefault: !!goal?.isDefault,
                        runtimeSnapshot: isPlainObject(goal?.runtimeSnapshot) ? deepClone(goal.runtimeSnapshot) : {},
                        createContract: isPlainObject(goal?.createContract) ? deepClone(goal.createContract) : {},
                        loadContracts: Array.isArray(goal?.loadContracts) ? deepClone(goal.loadContracts) : [],
                        triggerPath: normalizeText(goal?.triggerPath || ''),
                        groupKey: normalizeText(goal?.groupKey || ''),
                        groupLabel: normalizeText(goal?.groupLabel || ''),
                        fieldRows: normalizeGoalFieldRows(goal?.fieldRows || goal?.settingsRows || []),
                        fieldMatrix: isPlainObject(goal?.fieldMatrix) ? deepClone(goal.fieldMatrix) : {},
                        fieldCoverage: isPlainObject(goal?.fieldCoverage) ? deepClone(goal.fieldCoverage) : {},
                        sectionOrder: uniqueBy((Array.isArray(goal?.sectionOrder) ? goal.sectionOrder : []).map(item => normalizeText(item)).filter(Boolean), item => item).slice(0, 80)
                    }))
                    .filter(goal => goal.goalLabel),
                goal => `${goal.goalKey}::${goal.goalLabel}`
            ).slice(0, 24);
            if (goals.length && !goals.some(goal => goal.isDefault)) {
                goals[0].isDefault = true;
            }
            const goalWarnings = Array.isArray(scanMeta?.goalWarnings)
                ? uniqueBy(scanMeta.goalWarnings.map(item => normalizeText(item)).filter(Boolean), item => item).slice(0, 80)
                : [];
            return {
                ok: true,
                sceneName: targetScene,
                bizCode: resolveSceneBizCodeHint(targetScene) || runtime?.bizCode || '',
                location: source.location || window.location.href,
                scannedAt: new Date().toISOString(),
                scanMode: scanMeta.scanMode || 'full_top_down',
                unlockPolicy: scanMeta.unlockPolicy || 'auto_rollback',
                fields,
                goals,
                sectionOrder: uniqueBy((sections || []).map(section => section.title).filter(Boolean), item => item),
                coverage: {
                    sectionCount: (sections || []).length || (source.sectionTitles || []).length,
                    fieldCount: fields.length,
                    optionCount,
                    goalCount: goals.length,
                    snapshotCount: source?.layerSummary?.snapshotCount || snapshots.length || 1,
                    unlockActions: Array.isArray(scanMeta.unlockActions) ? scanMeta.unlockActions.length : 0,
                    warnings: Array.isArray(scanMeta.warnings) ? scanMeta.warnings.slice(0, 80) : []
                },
                goalCoverage: {
                    goalCount: goals.length,
                    defaultGoal: (goals.find(goal => goal.isDefault) || goals[0] || null)?.goalLabel || '',
                    goalFieldCount: goals.reduce((sum, goal) => sum + (Array.isArray(goal?.fieldRows) ? goal.fieldRows.length : 0), 0),
                    goalOptionCount: goals.reduce((sum, goal) => sum + (Array.isArray(goal?.fieldRows)
                        ? goal.fieldRows.reduce((acc, field) => acc + (Array.isArray(field?.options) ? field.options.length : 0), 0)
                        : 0), 0),
                    goalsWithFieldRows: goals.filter(goal => Array.isArray(goal?.fieldRows) && goal.fieldRows.length > 0).length,
                    goalsWithOptionRows: goals.filter(goal => Array.isArray(goal?.fieldRows) && goal.fieldRows.some(field => Array.isArray(field?.options) && field.options.length >= 2)).length,
                    warnings: goalWarnings
                },
                rawSamples: {
                    labels: (source.labels || []).slice(0, 240),
                    sectionTitles: (source.sectionTitles || []).slice(0, 120),
                    sections: (source.sections || []).slice(0, 120),
                    radios: (source.radios || []).slice(0, 160),
                    selects: (source.selects || []).slice(0, 160),
                    inputs: (source.inputs || []).slice(0, 200),
                    layerSnapshots: snapshots.slice(0, 60)
                },
                triggerPaths: (source.sectionTraversal || []).slice(0, 240)
            };
        };

        const scanSceneSpec = async (sceneName, options = {}) => {
            const targetScene = String(sceneName || '').trim();
            if (!targetScene) {
                return {
                    ok: false,
                    sceneName: '',
                    error: '缺少 sceneName'
                };
            }
            const normalizedOptions = normalizeSceneSpecOptions(options);
            const sceneBizCode = resolveSceneBizCodeHint(targetScene) || SCENE_BIZCODE_HINT_FALLBACK[targetScene] || '';
            if (!normalizedOptions.refresh) {
                const cached = getCachedSceneSpec(targetScene, sceneBizCode);
                if (cached) return cached;
            }

            const initialHash = window.location.hash;
            const initialScene = inferCurrentSceneName();
            const initialRoot = pickPlanConfigRoot();
            const controlState = captureEditableState(initialRoot);
            const warnings = [];
            let unlockActions = [];
            let tempUnlockState = {
                beforeIds: [],
                afterIds: [],
                tempIds: [],
                actions: []
            };

            try {
                await ensureSceneRoute(targetScene, normalizedOptions);
                await waitForDomStable(normalizedOptions);
                const activeRoot = pickPlanConfigRoot();
                if (normalizedOptions.unlockPolicy !== 'manual') {
                    unlockActions = unlockActions.concat(autoFillMinimumInputs(activeRoot, targetScene));
                }
                if (normalizedOptions.unlockPolicy === 'auto_rollback') {
                    tempUnlockState = await tryTemporaryAddItem(targetScene, normalizedOptions);
                    unlockActions = unlockActions.concat(tempUnlockState.actions || []);
                }

                let scanResult = null;
                let goalSpecs = [];
                let goalWarnings = [];
                if (normalizedOptions.scanMode === 'visible') {
                    scanResult = scanCurrentSceneSettings(targetScene, {
                        depth: 0,
                        sectionTitle: '页面根层',
                        layerPath: [],
                        layerPathText: '(根层)',
                        triggerPath: '(根层)'
                    });
                    scanResult.layerSnapshots = [{
                        sceneName: targetScene,
                        depth: 0,
                        sectionTitle: '页面根层',
                        layerPath: [],
                        layerPathText: '(根层)',
                        triggerPath: '(根层)',
                        labels: scanResult.labels || [],
                        sectionTitles: scanResult.sectionTitles || [],
                        radios: scanResult.radios || [],
                        selects: scanResult.selects || [],
                        inputs: scanResult.inputs || []
                    }];
                    scanResult.layerSummary = {
                        mode: 'visible',
                        snapshotCount: 1,
                        sectionCount: (scanResult.sectionTitles || []).length || 1
                    };
                } else {
                    scanResult = await scanSceneTopDownSettings(targetScene, normalizedOptions);
                }
                if (normalizedOptions.goalScan) {
                    try {
                        const goalScanResult = await scanSceneGoalSpecs(targetScene, normalizedOptions);
                        if (Array.isArray(goalScanResult?.goals)) {
                            goalSpecs = goalScanResult.goals.slice(0, 24);
                        }
                        if (Array.isArray(goalScanResult?.warnings)) {
                            goalWarnings = goalScanResult.warnings
                                .map(item => normalizeText(item))
                                .filter(Boolean)
                                .slice(0, 80);
                        }
                    } catch (err) {
                        goalWarnings.push(`营销目标采集失败: ${err?.message || err}`);
                    }
                }

                const runtime = await getRuntimeDefaults(false);
                const spec = buildSceneSpecFromScan({
                    sceneName: targetScene,
                    runtime,
                    scanResult,
                    scanMeta: {
                        scanMode: normalizedOptions.scanMode,
                        unlockPolicy: normalizedOptions.unlockPolicy,
                        unlockActions,
                        warnings,
                        goalSpecs,
                        goalWarnings
                    }
                });
                setCachedSceneSpec(targetScene, sceneBizCode, spec);
                return spec;
            } catch (err) {
                return {
                    ok: false,
                    sceneName: targetScene,
                    scannedAt: new Date().toISOString(),
                    location: window.location.href,
                    error: err?.message || String(err)
                };
            } finally {
                if (normalizedOptions.unlockPolicy === 'auto_rollback') {
                    try {
                        await rollbackTemporaryItems(tempUnlockState, normalizedOptions);
                    } catch (err) {
                        warnings.push(`回滚临时商品失败: ${err?.message || err}`);
                    }
                    try {
                        restoreEditableState(controlState);
                    } catch (err) {
                        warnings.push(`回滚输入值失败: ${err?.message || err}`);
                    }
                }
                if (normalizedOptions.restore) {
                    try {
                        if (initialHash && window.location.hash !== initialHash) {
                            window.location.hash = initialHash;
                            await waitForDomStable(normalizedOptions);
                        }
                        if (initialScene && SCENE_NAME_LIST.includes(initialScene)) {
                            await clickScene(initialScene, normalizedOptions);
                        }
                    } catch { }
                }
            }
        };

        const scanAllSceneSpecs = async (options = {}) => {
            const normalizedOptions = normalizeSceneSpecOptions(options);
            const scenes = Array.isArray(options.scenes) && options.scenes.length
                ? uniqueBy(options.scenes.map(item => String(item || '').trim()).filter(Boolean), item => item)
                : SCENE_NAME_LIST.slice();
            const initialHash = window.location.hash;
            const initialScene = inferCurrentSceneName();
            const list = [];
            for (let i = 0; i < scenes.length; i++) {
                const sceneName = scenes[i];
                if (typeof options.onProgress === 'function') {
                    try { options.onProgress({ event: 'scene_spec_start', sceneName, index: i + 1, total: scenes.length }); } catch { }
                }
                const result = await scanSceneSpec(sceneName, {
                    ...normalizedOptions,
                    restore: false,
                    refresh: options.refresh === true
                });
                list.push(result);
                if (typeof options.onProgress === 'function') {
                    try {
                        options.onProgress({
                            event: 'scene_spec_done',
                            sceneName,
                            index: i + 1,
                            total: scenes.length,
                            ok: !!result?.ok,
                            fieldCount: result?.coverage?.fieldCount || 0,
                            snapshotCount: result?.coverage?.snapshotCount || 0
                        });
                    } catch { }
                }
            }

            if (normalizedOptions.restore) {
                try {
                    if (initialHash && window.location.hash !== initialHash) {
                        window.location.hash = initialHash;
                        await waitForDomStable(normalizedOptions);
                    }
                    if (initialScene && SCENE_NAME_LIST.includes(initialScene)) {
                        await clickScene(initialScene, normalizedOptions);
                    }
                } catch { }
            }

            return {
                ok: list.every(item => item?.ok),
                scannedAt: new Date().toISOString(),
                scanMode: normalizedOptions.scanMode,
                unlockPolicy: normalizedOptions.unlockPolicy,
                sceneOrder: scenes,
                count: list.length,
                successCount: list.filter(item => item?.ok).length,
                failCount: list.filter(item => !item?.ok).length,
                list
            };
        };

        const getSceneSpec = async (sceneName = '', options = {}) => {
            const targetScene = String(sceneName || inferCurrentSceneName() || '').trim();
            if (!targetScene) {
                return {
                    ok: false,
                    error: '缺少 sceneName'
                };
            }
            const sceneBizCode = resolveSceneBizCodeHint(targetScene) || SCENE_BIZCODE_HINT_FALLBACK[targetScene] || '';
            if (!options.refresh) {
                const cached = getCachedSceneSpec(targetScene, sceneBizCode);
                if (cached) return cached;
            }
            return scanSceneSpec(targetScene, {
                ...options,
                refresh: true
            });
        };

        const resolveGoalSpecForScene = ({
            sceneName = '',
            sceneSpec = null,
            marketingGoal = '',
            runtime = {}
        } = {}) => {
            const warnings = [];
            const targetScene = String(sceneName || '').trim();
            const requestGoalRaw = normalizeGoalCandidateLabel(marketingGoal);
            const availableGoals = Array.isArray(sceneSpec?.goals)
                ? sceneSpec.goals
                    .map(goal => ({
                        ...goal,
                        goalLabel: normalizeGoalCandidateLabel(goal?.goalLabel || ''),
                        goalKey: normalizeGoalKey(goal?.goalKey || goal?.goalLabel || '')
                    }))
                    .filter(goal => goal.goalLabel)
                : [];
            const fallbackDefaultLabel = normalizeGoalCandidateLabel(
                SCENE_SPEC_FIELD_FALLBACK[targetScene]?.营销目标
                || runtime?.storeData?.promotionModelMarketing
                || runtime?.storeData?.promotionModel
                || runtime?.storeData?.optimizeTarget
                || runtime?.storeData?.promotionScene
                || ''
            );
            if (!availableGoals.length) {
                const resolved = requestGoalRaw || fallbackDefaultLabel || '';
                const fallbackUsed = !requestGoalRaw && !!resolved;
                if (!requestGoalRaw && resolved) {
                    warnings.push(`marketingGoal 缺失，已回退默认目标：${resolved}`);
                } else if (requestGoalRaw && !resolved) {
                    warnings.push(`marketingGoal「${requestGoalRaw}」无法识别，且当前场景无可用默认目标`);
                }
                return {
                    goalSpec: null,
                    resolvedMarketingGoal: resolved,
                    goalFallbackUsed: fallbackUsed,
                    goalWarnings: warnings,
                    availableGoalLabels: []
                };
            }

            const defaultGoal = availableGoals.find(goal => goal.isDefault) || availableGoals[0];
            if (!requestGoalRaw) {
                warnings.push(`marketingGoal 缺失，已回退默认目标：${defaultGoal.goalLabel}`);
                return {
                    goalSpec: defaultGoal,
                    resolvedMarketingGoal: defaultGoal.goalLabel,
                    goalFallbackUsed: true,
                    goalWarnings: warnings,
                    availableGoalLabels: availableGoals.map(goal => goal.goalLabel)
                };
            }

            const normalizedRequestGoalKey = normalizeGoalKey(requestGoalRaw);
            const exactMatch = availableGoals.find(goal => goal.goalLabel === requestGoalRaw)
                || availableGoals.find(goal => goal.goalKey === normalizedRequestGoalKey);
            if (exactMatch) {
                return {
                    goalSpec: exactMatch,
                    resolvedMarketingGoal: exactMatch.goalLabel,
                    goalFallbackUsed: false,
                    goalWarnings: warnings,
                    availableGoalLabels: availableGoals.map(goal => goal.goalLabel)
                };
            }
            const fuzzyMatch = availableGoals.find(goal => goal.goalLabel.includes(requestGoalRaw) || requestGoalRaw.includes(goal.goalLabel));
            if (fuzzyMatch) {
                return {
                    goalSpec: fuzzyMatch,
                    resolvedMarketingGoal: fuzzyMatch.goalLabel,
                    goalFallbackUsed: false,
                    goalWarnings: warnings,
                    availableGoalLabels: availableGoals.map(goal => goal.goalLabel)
                };
            }

            warnings.push(`marketingGoal「${requestGoalRaw}」未命中，已回退默认目标：${defaultGoal.goalLabel}`);
            return {
                goalSpec: defaultGoal,
                resolvedMarketingGoal: defaultGoal.goalLabel,
                goalFallbackUsed: true,
                goalWarnings: warnings,
                availableGoalLabels: availableGoals.map(goal => goal.goalLabel)
            };
        };

        const buildGoalContractDefaults = (goalSpec = null, context = {}) => {
            const normalizedGoalSpec = isPlainObject(goalSpec) ? goalSpec : {};
            const runtimeSnapshot = isPlainObject(normalizedGoalSpec.runtimeSnapshot)
                ? normalizedGoalSpec.runtimeSnapshot
                : {};
            const createContract = isPlainObject(normalizedGoalSpec.createContract)
                ? normalizedGoalSpec.createContract
                : {};
            const sceneName = String(context?.sceneName || '').trim();
            const goalLabel = normalizeGoalCandidateLabel(
                context?.goalLabel
                || normalizedGoalSpec?.goalLabel
                || ''
            );
            const cachedContract = sceneName
                ? (
                    getCachedSceneCreateContract(sceneName, goalLabel)
                    || getCachedSceneCreateContract(sceneName, '')
                )
                : null;
            const defaultCampaign = isPlainObject(createContract.defaultCampaign)
                ? createContract.defaultCampaign
                : {};
            const defaultAdgroup = isPlainObject(createContract.defaultAdgroup)
                ? createContract.defaultAdgroup
                : {};
            const campaignOverride = {};
            const adgroupOverride = {};
            const runtimePatch = {};

            GOAL_CONTRACT_RUNTIME_PATCH_KEYS.forEach(key => {
                let value = runtimeSnapshot[key];
                if (value === undefined || value === null || value === '') {
                    value = defaultCampaign[key];
                }
                if (value === undefined || value === null || value === '') return;
                campaignOverride[key] = deepClone(value);
            });
            if (runtimeSnapshot.bizCode || defaultCampaign.bizCode) {
                campaignOverride.bizCode = deepClone(runtimeSnapshot.bizCode || defaultCampaign.bizCode);
            }

            if (campaignOverride.bizCode) runtimePatch.bizCode = campaignOverride.bizCode;
            if (campaignOverride.promotionScene) runtimePatch.promotionScene = campaignOverride.promotionScene;
            if (campaignOverride.itemSelectedMode) runtimePatch.itemSelectedMode = campaignOverride.itemSelectedMode;
            if (campaignOverride.bidTypeV2) runtimePatch.bidTypeV2 = campaignOverride.bidTypeV2;
            if (campaignOverride.bidTargetV2) runtimePatch.bidTargetV2 = campaignOverride.bidTargetV2;
            if (campaignOverride.dmcType) runtimePatch.dmcType = campaignOverride.dmcType;
            if (campaignOverride.subPromotionType) runtimePatch.subPromotionType = campaignOverride.subPromotionType;
            if (campaignOverride.promotionType) runtimePatch.promotionType = campaignOverride.promotionType;
            if (campaignOverride.optimizeTarget) runtimePatch.optimizeTarget = campaignOverride.optimizeTarget;

            if (Array.isArray(defaultAdgroup.rightList)) {
                adgroupOverride.rightList = deepClone(defaultAdgroup.rightList);
            }
            if (defaultAdgroup.smartCreative !== undefined && defaultAdgroup.smartCreative !== null && defaultAdgroup.smartCreative !== '') {
                adgroupOverride.smartCreative = deepClone(defaultAdgroup.smartCreative);
            }

            const endpoint = normalizeGoalCreateEndpoint(
                createContract.endpoint
                || cachedContract?.endpoint
                || resolveGoalCreateEndpoint(normalizedGoalSpec.loadContracts || [])
                || SCENE_CREATE_ENDPOINT_FALLBACK
            );
            const mergeContractKeys = (contractRef = null, key = '') => uniqueBy(
                (Array.isArray(createContract?.[key]) ? createContract[key] : [])
                    .concat(Array.isArray(contractRef?.[key]) ? contractRef[key] : [])
                    .map(item => normalizeText(item))
                    .filter(Boolean),
                item => item
            ).slice(0, 320);
            const contractHints = {
                source: normalizeText(createContract?.source || cachedContract?.source || ''),
                requestKeys: mergeContractKeys(cachedContract, 'requestKeys'),
                solutionKeys: mergeContractKeys(cachedContract, 'solutionKeys'),
                campaignKeys: mergeContractKeys(cachedContract, 'campaignKeys'),
                adgroupKeys: mergeContractKeys(cachedContract, 'adgroupKeys')
            };

            return {
                campaignOverride,
                adgroupOverride,
                runtimePatch,
                endpoint,
                contractHints
            };
        };

        const mergeRuntimeWithGoalPatch = (runtime = {}, patch = {}) => {
            const output = deepClone(runtime || {});
            if (!isPlainObject(patch)) return output;
            Object.keys(patch).forEach(key => {
                const value = patch[key];
                if (value === undefined || value === null || value === '') return;
                output[key] = deepClone(value);
            });
            return output;
        };

        const resolveGoalContextForPlan = ({
            sceneName = '',
            sceneSpec = null,
            runtime = {},
            marketingGoal = '',
            planName = '',
            planIndex = 0
        } = {}) => {
            const resolution = resolveGoalSpecForScene({
                sceneName,
                sceneSpec,
                marketingGoal,
                runtime
            });
            const defaults = buildGoalContractDefaults(resolution.goalSpec, {
                sceneName: String(sceneName || '').trim(),
                goalLabel: resolution.resolvedMarketingGoal || marketingGoal || ''
            });
            const resolvedGoal = resolution.resolvedMarketingGoal || normalizeGoalLabel(marketingGoal) || '';
            const warningPrefix = planName
                ? `计划「${planName}」`
                : (Number.isFinite(planIndex) && planIndex >= 0 ? `plans[${planIndex}]` : 'request');
            const goalWarnings = Array.isArray(resolution.goalWarnings)
                ? resolution.goalWarnings
                    .map(msg => normalizeText(msg))
                    .filter(Boolean)
                    .map(msg => `${warningPrefix} ${msg}`)
                : [];
            return {
                goalSpec: resolution.goalSpec ? deepClone(resolution.goalSpec) : null,
                resolvedMarketingGoal: resolvedGoal,
                goalFallbackUsed: !!resolution.goalFallbackUsed,
                goalWarnings,
                availableGoalLabels: resolution.availableGoalLabels || [],
                campaignOverride: defaults.campaignOverride || {},
                adgroupOverride: defaults.adgroupOverride || {},
                runtimePatch: defaults.runtimePatch || {},
                endpoint: defaults.endpoint || SCENE_CREATE_ENDPOINT_FALLBACK,
                contractHints: isPlainObject(defaults.contractHints) ? deepClone(defaults.contractHints) : {}
            };
        };

        const getGoalSpec = async (sceneName = '', marketingGoal = '', options = {}) => {
            const targetScene = String(sceneName || inferCurrentSceneName() || '').trim();
            if (!targetScene) {
                return {
                    ok: false,
                    sceneName: '',
                    marketingGoal: normalizeGoalLabel(marketingGoal),
                    error: '缺少 sceneName'
                };
            }
            let sceneSpec = await getSceneSpec(targetScene, {
                ...options,
                scanMode: options.scanMode || 'full_top_down',
                unlockPolicy: options.unlockPolicy || 'safe_only',
                goalScan: options.goalScan !== false,
                refresh: !!options.refresh
            });
            if (!Array.isArray(sceneSpec?.goals) || !sceneSpec.goals.length) {
                sceneSpec = await scanSceneSpec(targetScene, {
                    ...options,
                    scanMode: options.scanMode || 'full_top_down',
                    unlockPolicy: options.unlockPolicy || 'safe_only',
                    goalScan: true,
                    refresh: true
                });
            }
            const shouldLoadGoalFields = options.goalFieldScan !== false;
            const hasGoalFieldRows = Array.isArray(sceneSpec?.goals)
                && sceneSpec.goals.some(goal => Array.isArray(goal?.fieldRows) && goal.fieldRows.length > 0);
            if (shouldLoadGoalFields && (!hasGoalFieldRows || options.refreshGoalFields === true)) {
                try {
                    const extracted = await extractSceneGoalSpecs(targetScene, {
                        ...options,
                        scanMode: options.goalFieldScanMode || options.scanMode || 'full_top_down',
                        unlockPolicy: options.unlockPolicy || 'safe_only',
                        goalScan: true,
                        goalFieldScan: true,
                        goalFieldScanMode: options.goalFieldScanMode || 'full_top_down',
                        goalFieldMaxDepth: toNumber(options.goalFieldMaxDepth, 2),
                        goalFieldMaxSnapshots: toNumber(options.goalFieldMaxSnapshots, 48),
                        goalFieldMaxGroupsPerLevel: toNumber(options.goalFieldMaxGroupsPerLevel, 6),
                        goalFieldMaxOptionsPerGroup: toNumber(options.goalFieldMaxOptionsPerGroup, 8),
                        refresh: options.refresh !== false
                    });
                    if (Array.isArray(extracted?.goals) && extracted.goals.length) {
                        sceneSpec = mergeDeep({}, sceneSpec || {}, {
                            goals: extracted.goals.slice(0, 24)
                        });
                    }
                } catch { }
            }
            let runtime = {};
            try {
                runtime = await getRuntimeDefaults(false);
            } catch { }
            const resolution = resolveGoalSpecForScene({
                sceneName: targetScene,
                sceneSpec,
                marketingGoal,
                runtime
            });
            return {
                ok: !!sceneSpec?.ok,
                sceneName: targetScene,
                marketingGoal: normalizeGoalLabel(marketingGoal),
                resolvedMarketingGoal: resolution.resolvedMarketingGoal || '',
                goalFallbackUsed: !!resolution.goalFallbackUsed,
                goalWarnings: resolution.goalWarnings || [],
                availableGoals: resolution.availableGoalLabels || [],
                goalSpec: resolution.goalSpec ? deepClone(resolution.goalSpec) : null,
                goalFieldRows: Array.isArray(resolution?.goalSpec?.fieldRows) ? deepClone(resolution.goalSpec.fieldRows) : [],
                goalFieldCoverage: isPlainObject(resolution?.goalSpec?.fieldCoverage) ? deepClone(resolution.goalSpec.fieldCoverage) : {},
                goalFieldMatrix: isPlainObject(resolution?.goalSpec?.fieldMatrix) ? deepClone(resolution.goalSpec.fieldMatrix) : {},
                sceneSpecMeta: sceneSpec?.coverage || null
            };
        };

        const networkCaptureRegistry = {
            seq: 0,
            sessions: new Map()
        };
        const normalizeGoalSpecContracts = (goals = []) => {
            const list = Array.isArray(goals) ? goals : [];
            return list.map(goal => {
                const fieldRows = normalizeGoalFieldRows(goal?.fieldRows || goal?.settingsRows || []);
                const matrixFromRows = fieldRows.reduce((acc, row) => {
                    acc[row.label] = {
                        options: row.options.slice(0, 48),
                        defaultValue: row.defaultValue || '',
                        requiredGuess: !!row.requiredGuess,
                        criticalGuess: !!row.criticalGuess,
                        dependsOn: row.dependsOn.slice(0, 16),
                        triggerPath: row.triggerPath || ''
                    };
                    return acc;
                }, {});
                const inputMatrix = isPlainObject(goal?.fieldMatrix) ? deepClone(goal.fieldMatrix) : {};
                const fieldMatrix = Object.keys(inputMatrix).length ? inputMatrix : matrixFromRows;
                const defaultFieldCoverage = {
                    fieldCount: fieldRows.length,
                    optionCount: fieldRows.reduce((sum, row) => sum + (Array.isArray(row.options) ? row.options.length : 0), 0),
                    requiredCount: fieldRows.filter(row => row.requiredGuess).length,
                    criticalCount: fieldRows.filter(row => row.criticalGuess).length
                };
                return {
                    fieldRows,
                    goalKey: normalizeGoalKey(goal?.goalKey || goal?.goalLabel || ''),
                    goalLabel: normalizeGoalLabel(goal?.goalLabel || ''),
                    isDefault: !!goal?.isDefault,
                    triggerPath: normalizeText(goal?.triggerPath || ''),
                    groupKey: normalizeText(goal?.groupKey || ''),
                    groupLabel: normalizeText(goal?.groupLabel || ''),
                    runtimeSnapshot: isPlainObject(goal?.runtimeSnapshot) ? deepClone(goal.runtimeSnapshot) : {},
                    createContract: isPlainObject(goal?.createContract) ? deepClone(goal.createContract) : {},
                    loadContracts: Array.isArray(goal?.loadContracts) ? deepClone(goal.loadContracts) : [],
                    fieldMatrix,
                    fieldCoverage: mergeDeep({}, defaultFieldCoverage, isPlainObject(goal?.fieldCoverage) ? goal.fieldCoverage : {}),
                    sectionOrder: uniqueBy((Array.isArray(goal?.sectionOrder) ? goal.sectionOrder : []).map(item => normalizeText(item)).filter(Boolean), item => item).slice(0, 80)
                };
            }).filter(goal => goal.goalLabel);
        };
        const summarizeSceneNetworkContractsFromGoals = (goals = []) => {
            const contracts = mergeContractSummaries(
                (Array.isArray(goals) ? goals : []).flatMap(goal => Array.isArray(goal?.loadContracts) ? goal.loadContracts : [])
            );
            const createContracts = contracts.filter(item => isGoalCreateSubmitPath(item?.path || ''));
            const createInterfaces = summarizeCreateInterfacesFromContracts(createContracts);
            return {
                contracts,
                createContracts,
                createInterfaces,
                createEndpoints: uniqueBy(
                    createContracts.map(item => `${normalizeCaptureMethod(item?.method)} ${normalizeCapturePath(item?.path || '')}`).filter(Boolean),
                    item => item
                )
            };
        };
        const startNetworkCapture = (options = {}) => {
            const includePattern = options.includePattern instanceof RegExp ? options.includePattern : /\.json(?:$|\?)/i;
            const session = createGoalCaptureSession({ includePattern });
            const captureId = `wxt_capture_${Date.now()}_${++networkCaptureRegistry.seq}`;
            const sceneName = String(options.sceneName || inferCurrentSceneName() || '').trim();
            const startedAt = new Date().toISOString();
            networkCaptureRegistry.sessions.set(captureId, {
                captureId,
                sceneName,
                startedAt,
                includePattern: String(includePattern),
                session
            });
            return {
                ok: true,
                captureId,
                sceneName,
                startedAt,
                includePattern: String(includePattern)
            };
        };
        const getNetworkCapture = (captureId = '', options = {}) => {
            const id = String(captureId || '').trim();
            const entry = id ? networkCaptureRegistry.sessions.get(id) : null;
            if (!entry) {
                return {
                    ok: false,
                    captureId: id,
                    error: 'captureId 不存在或已结束'
                };
            }
            const records = entry.session.sliceFrom(0);
            const contracts = summarizeGoalLoadContracts(records);
            const createInterfaces = summarizeCreateInterfacesFromContracts(contracts);
            const createEndpoints = uniqueBy(
                createInterfaces.map(item => `${normalizeCaptureMethod(item?.method)} ${normalizeCapturePath(item?.path || '')}`).filter(Boolean),
                item => item
            );
            return {
                ok: true,
                captureId: id,
                sceneName: entry.sceneName || '',
                startedAt: entry.startedAt,
                includePattern: entry.includePattern,
                recordCount: records.length,
                contractCount: contracts.length,
                contracts,
                createInterfaceCount: createInterfaces.length,
                createInterfaces,
                createEndpoints,
                records: options.withRecords ? records : []
            };
        };
        const stopNetworkCapture = (captureId = '', options = {}) => {
            const snapshot = getNetworkCapture(captureId, options);
            if (!snapshot.ok) return snapshot;
            const id = String(captureId || '').trim();
            const entry = networkCaptureRegistry.sessions.get(id);
            try {
                entry?.session?.stop?.();
            } catch { }
            networkCaptureRegistry.sessions.delete(id);
            return {
                ...snapshot,
                stoppedAt: new Date().toISOString(),
                stopped: true
            };
        };
        const listNetworkCaptures = () => {
            const list = Array.from(networkCaptureRegistry.sessions.values()).map(item => ({
                captureId: item.captureId,
                sceneName: item.sceneName || '',
                startedAt: item.startedAt,
                includePattern: item.includePattern
            })).sort((a, b) => String(a.startedAt).localeCompare(String(b.startedAt)));
            return {
                ok: true,
                count: list.length,
                list
            };
        };
        const stopAllNetworkCaptures = (options = {}) => {
            const ids = Array.from(networkCaptureRegistry.sessions.keys());
            const list = ids.map(id => stopNetworkCapture(id, options));
            return {
                ok: list.every(item => item?.ok),
                count: list.length,
                list
            };
        };

        const extractSceneGoalSpecs = async (sceneName = '', options = {}) => {
            const targetScene = String(sceneName || inferCurrentSceneName() || '').trim();
            if (!targetScene) {
                return {
                    ok: false,
                    sceneName: '',
                    error: '缺少 sceneName'
                };
            }
            const goalResult = await scanSceneGoalSpecs(targetScene, {
                ...options,
                scanMode: options.scanMode || 'full_top_down',
                unlockPolicy: options.unlockPolicy || 'safe_only',
                goalScan: options.goalScan !== false,
                goalFieldScan: options.goalFieldScan !== false,
                goalFieldScanMode: options.goalFieldScanMode || (options.scanMode === 'visible' ? 'visible' : 'full_top_down'),
                goalFieldMaxDepth: toNumber(options.goalFieldMaxDepth, 2),
                goalFieldMaxSnapshots: toNumber(options.goalFieldMaxSnapshots, 48),
                goalFieldMaxGroupsPerLevel: toNumber(options.goalFieldMaxGroupsPerLevel, 6),
                goalFieldMaxOptionsPerGroup: toNumber(options.goalFieldMaxOptionsPerGroup, 8),
                contractMode: options.contractMode || 'network_only',
                refresh: options.refresh !== false
            });
            const goals = normalizeGoalSpecContracts(goalResult?.goals || []);
            const networkSummary = summarizeSceneNetworkContractsFromGoals(goals);
            if (networkSummary.createInterfaces.length) {
                rememberSceneCreateInterfaces(targetScene, '', networkSummary.createInterfaces, {
                    source: 'extract_scene_goal_specs'
                });
            }
            goals.forEach(goal => {
                const goalCreateContracts = mergeContractSummaries(
                    (Array.isArray(goal?.loadContracts) ? goal.loadContracts : [])
                        .filter(item => isGoalCreateSubmitPath(item?.path || ''))
                );
                const goalCreateInterfaces = summarizeCreateInterfacesFromContracts(goalCreateContracts);
                if (!goalCreateInterfaces.length) return;
                rememberSceneCreateInterfaces(targetScene, goal?.goalLabel || '', goalCreateInterfaces, {
                    source: 'extract_scene_goal_specs_goal'
                });
            });
            const goalFieldCount = goals.reduce((sum, goal) => sum + (Array.isArray(goal?.fieldRows) ? goal.fieldRows.length : 0), 0);
            const goalOptionCount = goals.reduce((sum, goal) => sum + ((goal?.fieldCoverage?.optionCount && Number.isFinite(goal.fieldCoverage.optionCount))
                ? toNumber(goal.fieldCoverage.optionCount, 0)
                : (Array.isArray(goal?.fieldRows) ? goal.fieldRows.reduce((acc, row) => acc + (Array.isArray(row?.options) ? row.options.length : 0), 0) : 0)), 0);
            const goalsWithFieldRows = goals.filter(goal => Array.isArray(goal?.fieldRows) && goal.fieldRows.length > 0).length;
            const goalsWithOptionRows = goals.filter(goal => Array.isArray(goal?.fieldRows) && goal.fieldRows.some(row => Array.isArray(row?.options) && row.options.length >= 2)).length;
            const extractWarnings = Array.isArray(goalResult?.warnings) ? goalResult.warnings.slice(0, 120) : [];
            if (!networkSummary.createContracts.length) {
                extractWarnings.push(`场景「${targetScene}」未捕获到创建提交接口，请在开启抓包后执行一次“新建计划提交”再提取`);
            }
            if (goals.length && goalsWithFieldRows < goals.length) {
                extractWarnings.push(`场景「${targetScene}」存在营销目标未采集到行配置（${goalsWithFieldRows}/${goals.length}）`);
            }
            if (goals.length && goalsWithOptionRows < goals.length) {
                extractWarnings.push(`场景「${targetScene}」存在营销目标未采集到可切换选项（${goalsWithOptionRows}/${goals.length}）`);
            }
            return {
                ok: !!goalResult?.ok,
                source: 'network_listener',
                sceneName: targetScene,
                scannedAt: goalResult?.scannedAt || new Date().toISOString(),
                goalCount: goals.length,
                goals,
                contracts: networkSummary.contracts,
                createContracts: networkSummary.createContracts,
                createInterfaces: networkSummary.createInterfaces,
                createEndpoints: networkSummary.createEndpoints,
                goalCoverage: {
                    mode: 'network_listener',
                    goalCount: goals.length,
                    contractCount: networkSummary.contracts.length,
                    createContractCount: networkSummary.createContracts.length,
                    createInterfaceCount: networkSummary.createInterfaces.length
                },
                goalFieldCoverage: {
                    goalCount: goals.length,
                    goalsWithFieldRows,
                    goalsWithOptionRows,
                    fieldCount: goalFieldCount,
                    optionCount: goalOptionCount
                },
                coverage: {
                    source: 'network_listener'
                },
                warnings: uniqueBy(extractWarnings, item => item)
            };
        };

        const extractAllSceneGoalSpecs = async (options = {}) => {
            const scenes = Array.isArray(options.scenes) && options.scenes.length
                ? uniqueBy(options.scenes.map(item => String(item || '').trim()).filter(Boolean), item => item)
                : SCENE_NAME_LIST.slice();
            const list = [];
            for (let i = 0; i < scenes.length; i++) {
                const sceneName = scenes[i];
                if (typeof options.onProgress === 'function') {
                    try {
                        options.onProgress({
                            event: 'scene_goal_spec_start',
                            sceneName,
                            index: i + 1,
                            total: scenes.length
                        });
                    } catch { }
                }
                const result = await extractSceneGoalSpecs(sceneName, {
                    ...options,
                    refresh: options.refresh !== false
                });
                list.push(result);
                if (typeof options.onProgress === 'function') {
                    try {
                        options.onProgress({
                            event: 'scene_goal_spec_done',
                            sceneName,
                            index: i + 1,
                            total: scenes.length,
                            ok: !!result?.ok,
                            goalCount: result?.goalCount || 0
                        });
                    } catch { }
                }
            }
            return {
                ok: list.every(item => item?.ok),
                source: 'network_listener',
                scannedAt: new Date().toISOString(),
                sceneOrder: scenes,
                count: list.length,
                successCount: list.filter(item => item?.ok).length,
                failCount: list.filter(item => !item?.ok).length,
                goalCount: list.reduce((sum, item) => sum + toNumber(item?.goalCount, 0), 0),
                goalFieldCount: list.reduce((sum, item) => sum + toNumber(item?.goalFieldCoverage?.fieldCount, 0), 0),
                goalOptionCount: list.reduce((sum, item) => sum + toNumber(item?.goalFieldCoverage?.optionCount, 0), 0),
                goalsWithFieldRows: list.reduce((sum, item) => sum + toNumber(item?.goalFieldCoverage?.goalsWithFieldRows, 0), 0),
                goalsWithOptionRows: list.reduce((sum, item) => sum + toNumber(item?.goalFieldCoverage?.goalsWithOptionRows, 0), 0),
                contractCount: list.reduce((sum, item) => sum + toNumber(Array.isArray(item?.contracts) ? item.contracts.length : 0, 0), 0),
                createContractCount: list.reduce((sum, item) => sum + toNumber(Array.isArray(item?.createContracts) ? item.createContracts.length : 0, 0), 0),
                createInterfaceCount: list.reduce((sum, item) => sum + toNumber(Array.isArray(item?.createInterfaces) ? item.createInterfaces.length : 0, 0), 0),
                list
            };
        };
        const extractSceneCreateInterfaces = (sceneName = '', options = {}) => extractSceneGoalSpecs(sceneName, options);
        const extractAllSceneCreateInterfaces = (options = {}) => extractAllSceneGoalSpecs(options);
        const parseCreateEndpointFromMethodPath = (value = '') => {
            const text = String(value || '').trim();
            if (!text) return '';
            const match = text.match(/^[A-Z]+\s+(.+)$/);
            return normalizeCapturePath(match ? match[1] : text);
        };
        const buildTemplateTimestamp = (date = new Date()) => {
            const d = date instanceof Date ? date : new Date();
            const pad = (n) => String(n).padStart(2, '0');
            return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
        };
        const buildDefaultCommonByScene = (sceneName = '') => {
            if (sceneName === '关键词推广') {
                return {
                    bidMode: 'smart',
                    keywordMode: 'mixed',
                    keywordDefaults: {
                        matchScope: 4,
                        bidPrice: 1,
                        onlineStatus: 1
                    }
                };
            }
            return {};
        };
        const buildDefaultPlanByScene = (sceneName = '', stamp = '', suffix = '') => {
            const baseName = `${sceneName || '计划'}_${stamp}${suffix}`;
            const plan = {
                planName: baseName
            };
            if (isSceneLikelyRequireItem(sceneName)) {
                plan.itemId = '';
            }
            if (sceneName === '关键词推广') {
                plan.keywords = [''];
            }
            return plan;
        };
        const normalizeTemplateSceneListInput = (source = null) => {
            if (Array.isArray(source)) return source;
            if (isPlainObject(source)) {
                if (Array.isArray(source.scenes)) return source.scenes;
                if (Array.isArray(source.list)) return source.list;
                if (Array.isArray(source.results)) return source.results;
            }
            const fromWindow = window.__AM_WXT_SCENE_CREATE_API_REPORT__;
            if (isPlainObject(fromWindow) && Array.isArray(fromWindow.scenes)) {
                return fromWindow.scenes;
            }
            return [];
        };
        const inferCreateInterfacesFromSceneEntry = (entry = {}) => {
            if (Array.isArray(entry?.createInterfaces) && entry.createInterfaces.length) {
                return deepClone(entry.createInterfaces);
            }
            if (Array.isArray(entry?.createContracts) && entry.createContracts.length) {
                return summarizeCreateInterfacesFromContracts(entry.createContracts);
            }
            return [];
        };
        const buildSceneGoalRequestTemplates = async (source = null, options = {}) => {
            const sceneEntries = normalizeTemplateSceneListInput(source);
            const requestedScenes = Array.isArray(options?.scenes) && options.scenes.length
                ? uniqueBy(options.scenes.map(item => String(item || '').trim()).filter(Boolean), item => item)
                : [];
            const sceneNameList = requestedScenes.length
                ? requestedScenes
                : uniqueBy(sceneEntries.map(item => String(item?.sceneName || '').trim()).filter(Boolean), item => item);
            const fallbackScenes = sceneNameList.length ? sceneNameList : SCENE_NAME_LIST.slice();
            const stamp = buildTemplateTimestamp(new Date());
            const outList = [];

            for (let i = 0; i < fallbackScenes.length; i++) {
                const sceneName = fallbackScenes[i];
                const sceneEntry = sceneEntries.find(item => String(item?.sceneName || '').trim() === sceneName) || {};
                const createInterfaces = inferCreateInterfacesFromSceneEntry(sceneEntry);
                const createEndpoints = uniqueBy(
                    (Array.isArray(sceneEntry?.createEndpoints) ? sceneEntry.createEndpoints : []).map(item => String(item || '').trim()).filter(Boolean),
                    item => item
                );
                let goals = Array.isArray(sceneEntry?.goals) ? sceneEntry.goals : [];
                const warnings = [];
                if (!goals.length && options.resolveGoals !== false) {
                    try {
                        const sceneGoalResult = await extractSceneGoalSpecs(sceneName, {
                            scanMode: options.scanMode || 'visible',
                            unlockPolicy: options.unlockPolicy || 'safe_only',
                            refresh: !!options.refresh,
                            contractMode: 'network_only'
                        });
                        if (Array.isArray(sceneGoalResult?.goals) && sceneGoalResult.goals.length) {
                            goals = sceneGoalResult.goals;
                        }
                        if (Array.isArray(sceneGoalResult?.warnings) && sceneGoalResult.warnings.length) {
                            warnings.push(...sceneGoalResult.warnings);
                        }
                    } catch (err) {
                        warnings.push(`读取营销目标失败：${err?.message || err}`);
                    }
                }
                const normalizedGoals = uniqueBy(
                    (Array.isArray(goals) ? goals : []).map(goal => ({
                        goalLabel: normalizeGoalLabel(goal?.goalLabel || ''),
                        isDefault: !!goal?.isDefault
                    })).filter(goal => goal.goalLabel),
                    goal => goal.goalLabel
                );
                if (!normalizedGoals.length) {
                    normalizedGoals.push({
                        goalLabel: '',
                        isDefault: true
                    });
                } else if (!normalizedGoals.some(goal => goal.isDefault)) {
                    normalizedGoals[0].isDefault = true;
                }

                const preferredInterface = createInterfaces
                    .slice()
                    .sort((a, b) => toNumber(b?.count, 0) - toNumber(a?.count, 0))[0] || null;
                const submitEndpoint = normalizeCapturedCreateEndpoint(
                    preferredInterface?.path
                    || parseCreateEndpointFromMethodPath(createEndpoints[0] || '')
                    || ''
                );
                const contractHints = {
                    requestKeys: Array.isArray(preferredInterface?.requestKeys) ? preferredInterface.requestKeys.slice(0, 240) : [],
                    solutionKeys: Array.isArray(preferredInterface?.solutionKeys) ? preferredInterface.solutionKeys.slice(0, 240) : [],
                    campaignKeys: Array.isArray(preferredInterface?.campaignKeys) ? preferredInterface.campaignKeys.slice(0, 240) : [],
                    adgroupKeys: Array.isArray(preferredInterface?.adgroupKeys) ? preferredInterface.adgroupKeys.slice(0, 240) : []
                };

                normalizedGoals.forEach((goal, goalIdx) => {
                    const requestTemplate = {
                        sceneName,
                        marketingGoal: goal.goalLabel || '',
                        common: buildDefaultCommonByScene(sceneName),
                        plans: [
                            buildDefaultPlanByScene(sceneName, stamp, String(i * 20 + goalIdx + 1).padStart(2, '0'))
                        ]
                    };
                    if (submitEndpoint) requestTemplate.submitEndpoint = submitEndpoint;
                    outList.push({
                        sceneName,
                        marketingGoal: goal.goalLabel || '',
                        isDefaultGoal: !!goal.isDefault,
                        submitEndpoint,
                        createInterfaces: createInterfaces.slice(0, 12),
                        createEndpoints: createEndpoints.slice(0, 12),
                        contractHints,
                        warnings: uniqueBy(warnings, item => item).slice(0, 40),
                        requestTemplate
                    });
                });
            }

            const templateMap = {};
            outList.forEach(item => {
                const sceneName = item.sceneName || '';
                const goalLabel = item.marketingGoal || '默认目标';
                if (!templateMap[sceneName]) templateMap[sceneName] = {};
                templateMap[sceneName][goalLabel] = deepClone(item.requestTemplate);
            });
            const result = {
                ok: true,
                source: 'capture_report_to_request_templates',
                generatedAt: new Date().toISOString(),
                sceneCount: uniqueBy(outList.map(item => item.sceneName).filter(Boolean), item => item).length,
                templateCount: outList.length,
                list: outList,
                map: templateMap
            };
            window.__AM_WXT_SCENE_GOAL_REQUEST_TEMPLATES__ = result;
            return result;
        };

        const toSafeItemRaw = (item = {}) => {
            const source = isPlainObject(item?.raw) ? item.raw : (isPlainObject(item) ? item : {});
            const materialId = String(source.materialId || source.itemId || item.materialId || item.itemId || '').trim();
            const itemId = String(source.itemId || source.materialId || item.itemId || item.materialId || '').trim();
            return {
                materialId: materialId || itemId,
                itemId: itemId || materialId,
                materialName: source.materialName || source.title || source.name || '',
                shopId: source.shopId || '',
                shopName: source.shopName || '',
                linkUrl: source.linkUrl || '',
                bidCount: source.bidCount || 0,
                categoryLevel1: source.categoryLevel1 || ''
            };
        };

        const normalizeItem = (item = {}) => {
            const materialId = String(item.materialId || item.itemId || '').trim();
            const itemId = String(item.itemId || item.materialId || '').trim();
            return {
                materialId: materialId || itemId,
                itemId: itemId || materialId,
                materialName: item.materialName || item.title || item.name || '',
                shopId: item.shopId || '',
                shopName: item.shopName || '',
                linkUrl: item.linkUrl || '',
                bidCount: item.bidCount || 0,
                categoryLevel1: item.categoryLevel1 || '',
                fromTab: item.fromTab || 'manual',
                raw: toSafeItemRaw(item)
            };
        };

        const parseItemIdsFromText = (text = '') => {
            const ids = [];
            const regex = /\d{6,}/g;
            let m;
            while ((m = regex.exec(text))) ids.push(m[0]);
            return uniqueBy(ids, id => id);
        };

        const parseQueryToItemIds = (query = '') => {
            if (!query) return [];
            const candidates = query.split(/[,，\s]+/).map(s => s.trim()).filter(Boolean);
            if (!candidates.length) return [];
            if (candidates.every(v => /^\d{6,}$/.test(v))) return uniqueBy(candidates, id => id);
            return [];
        };

        const searchItems = async (params = {}) => {
            const runtime = await getRuntimeDefaults(false);
            const bizCode = params.bizCode || runtime.bizCode || DEFAULTS.bizCode;
            const query = (params.query || '').trim();
            const queryItemIds = parseQueryToItemIds(query);
            const itemIdList = uniqueBy([...(params.itemIdList || []), ...queryItemIds].map(v => String(v).trim()).filter(Boolean), v => v);
            const hasTagId = Object.prototype.hasOwnProperty.call(params, 'tagId');
            const hasChannelKey = Object.prototype.hasOwnProperty.call(params, 'channelKey');
            const payload = {
                needQualification: true,
                materialType: 1,
                bizCode,
                promotionScene: params.promotionScene || runtime.promotionScene || DEFAULTS.promotionScene,
                itemSelectedMode: params.itemSelectedMode || runtime.itemSelectedMode || DEFAULTS.itemSelectedMode,
                subPromotionType: params.subPromotionType || DEFAULTS.subPromotionType,
                promotionType: params.promotionType || DEFAULTS.promotionType,
                offset: toNumber(params.offset, 0),
                pageSize: Math.max(1, Math.min(200, toNumber(params.pageSize, 40)))
            };
            if (hasTagId) {
                if (params.tagId !== undefined && params.tagId !== null && String(params.tagId).trim() !== '') {
                    payload.tagId = params.tagId;
                }
            } else {
                payload.tagId = '101111310';
            }
            if (hasChannelKey) {
                if (params.channelKey !== undefined && params.channelKey !== null && String(params.channelKey).trim() !== '') {
                    payload.channelKey = params.channelKey;
                }
            } else if (!query) {
                payload.channelKey = 'effect';
            }
            if (itemIdList.length) payload.itemIdList = itemIdList;
            if (query && !itemIdList.length) {
                payload.searchKeyword = query;
                payload.keyword = query;
                payload.itemTitle = query;
            }
            if (isPlainObject(params.extra)) Object.assign(payload, params.extra);

            const res = await requestOne(ENDPOINTS.materialFindPage, bizCode, payload, params.requestOptions || {});
            const list = Array.isArray(res?.data?.list) ? res.data.list.map(normalizeItem).filter(item => item.materialId) : [];
            return {
                ok: true,
                count: toNumber(res?.data?.count, list.length),
                list,
                raw: res
            };
        };

        const parseMatchScope = (value, fallback = DEFAULTS.matchScope) => {
            if (value === undefined || value === null || value === '') return fallback;
            if (value === 1 || value === '1' || value === 'exact' || value === '精准' || value === '精确') return 1;
            if (value === 4 || value === '4' || value === 'broad' || value === '广泛') return 4;
            return fallback;
        };

        const parseKeywordItem = (input, keywordDefaults = {}) => {
            const fallbackBid = toNumber(keywordDefaults.bidPrice, 1);
            const fallbackMatch = parseMatchScope(keywordDefaults.matchScope, DEFAULTS.matchScope);
            const fallbackStatus = toNumber(keywordDefaults.onlineStatus, DEFAULTS.keywordOnlineStatus);

            if (isPlainObject(input)) {
                const word = String(input.word || input.keyword || '').trim();
                if (!word) return null;
                return {
                    word,
                    bidPrice: toNumber(input.bidPrice, fallbackBid),
                    matchScope: parseMatchScope(input.matchScope, fallbackMatch),
                    onlineStatus: toNumber(input.onlineStatus, fallbackStatus)
                };
            }

            const raw = String(input || '').trim();
            if (!raw) return null;
            const parts = raw.split(/[,\t，]/).map(s => s.trim()).filter(Boolean);
            const [word, bidPrice, matchScope] = parts;
            if (!word) return null;
            return {
                word,
                bidPrice: toNumber(bidPrice, fallbackBid),
                matchScope: parseMatchScope(matchScope, fallbackMatch),
                onlineStatus: fallbackStatus
            };
        };

        const parseKeywords = (keywordsInput, keywordDefaults = {}) => {
            if (!keywordsInput) return [];
            if (Array.isArray(keywordsInput)) {
                return uniqueBy(
                    keywordsInput.map(item => parseKeywordItem(item, keywordDefaults)).filter(Boolean),
                    item => item.word
                );
            }
            const text = String(keywordsInput);
            const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
            return uniqueBy(
                lines.map(line => parseKeywordItem(line, keywordDefaults)).filter(Boolean),
                item => item.word
            );
        };

        const fetchRecommendWordList = async ({ bizCode, materialId, defaults, source = 'auto', requestOptions }) => {
            const idValue = toIdValue(materialId);
            const body = {
                bizCode,
                itemSelectedMode: defaults.itemSelectedMode,
                bidTypeV2: defaults.bidTypeV2,
                bidTargetV2: defaults.bidTargetV2,
                promotionScene: defaults.promotionScene,
                materialId: idValue,
                materialIdList: [idValue]
            };
            const paths = source === 'kr'
                ? [ENDPOINTS.bidwordSuggestKr, ENDPOINTS.bidwordSuggestDefault]
                : source === 'default'
                    ? [ENDPOINTS.bidwordSuggestDefault]
                    : [ENDPOINTS.bidwordSuggestDefault, ENDPOINTS.bidwordSuggestKr];
            for (const path of paths) {
                try {
                    const res = await requestOne(path, bizCode, body, requestOptions || {});
                    const list = res?.data?.list?.[0]?.wordList;
                    if (Array.isArray(list) && list.length) return list;
                } catch (err) {
                    log.warn(`推荐词接口失败 ${path}:`, err?.message || err);
                }
            }
            return [];
        };

        const fetchRecommendWordPackageList = async ({ bizCode, materialId, defaults, requestOptions }) => {
            const idValue = toIdValue(materialId);
            const body = {
                bizCode,
                itemSelectedMode: defaults.itemSelectedMode,
                bidTypeV2: defaults.bidTypeV2,
                bidTargetV2: defaults.bidTargetV2,
                promotionScene: defaults.promotionScene,
                materialId: idValue,
                materialIdList: [idValue]
            };
            try {
                const res = await requestOne(ENDPOINTS.wordPackageSuggestDefault, bizCode, body, requestOptions || {});
                const list = res?.data?.list?.[0]?.wordPackageList;
                return Array.isArray(list) ? list : [];
            } catch (err) {
                log.warn('推荐词包接口失败:', err?.message || err);
                return [];
            }
        };

        const getCrowdMxId = (label = {}) => {
            const targetType = label?.targetType;
            const labelId = label?.labelId;
            const priceDimension = label?.priceDimension;
            const isMulti = !!label?.isMulti;
            if (priceDimension === 'OPTION' || (priceDimension === 'LABEL' && isMulti)) {
                const optionValues = (label?.optionList || [])
                    .map(option => String(option?.optionValue ?? '').trim())
                    .filter(Boolean)
                    .sort();
                return `${targetType}_${labelId}_${optionValues.join('_')}`;
            }
            return `${targetType}_${labelId}`;
        };

        const buildCrowdName = (label = {}) => {
            const labelName = String(label?.labelName || '').trim();
            const optionName = uniqueBy(
                (label?.optionList || []).map(option => String(option?.optionName || '').trim()).filter(Boolean),
                name => name
            ).join('，');
            return uniqueBy([labelName, optionName].filter(Boolean), name => name).join('：');
        };

        const labelListToCrowdList = (labelList = []) => {
            const out = [];
            (labelList || []).forEach((labelItem) => {
                if (!labelItem || typeof labelItem !== 'object') return;
                const priceDimension = labelItem.priceDimension;
                const priceMode = String(labelItem.priceMode);
                const optionList = Array.isArray(labelItem.optionList) ? labelItem.optionList : [];

                if (priceDimension === 'OPTION' || ((priceDimension === 'LABEL') && !!labelItem.isMulti)) {
                    optionList.forEach((option) => {
                        const label = deepClone(labelItem);
                        label.optionList = [deepClone(option)];
                        const crowd = {
                            crowd: {
                                targetType: labelItem.targetType,
                                label,
                                crowdName: buildCrowdName(label)
                            },
                            price: deepClone(option?.price || {}),
                            showTagList: label.showTagList || []
                        };
                        crowd.mx_crowdId = getCrowdMxId(label);
                        out.push(crowd);
                    });
                    return;
                }

                if (priceDimension === 'LABEL' || ['0', '1', '-1', '2', '3'].includes(priceMode)) {
                    const label = deepClone(labelItem);
                    const crowd = {
                        crowd: {
                            targetType: labelItem.targetType,
                            label,
                            crowdName: buildCrowdName(label)
                        },
                        price: deepClone(label?.price || {}),
                        showTagList: label.showTagList || []
                    };
                    crowd.mx_crowdId = getCrowdMxId(label);
                    out.push(crowd);
                }
            });
            return uniqueBy(out, item => item?.mx_crowdId || `${item?.crowd?.label?.labelId || ''}_${item?.crowd?.label?.optionList?.[0]?.optionValue || ''}`);
        };

        const fetchRecommendCrowdList = async ({ bizCode, defaults, labelIdList, materialIdList = [], requestOptions }) => {
            const ids = uniqueBy(
                (Array.isArray(labelIdList) ? labelIdList : DEFAULTS.recommendCrowdLabelIds)
                    .map(id => String(id || '').trim())
                    .filter(Boolean),
                id => id
            );
            if (!ids.length) return [];

            const labelResults = [];
            for (const labelId of ids) {
                try {
                    const res = await requestOne(ENDPOINTS.labelFindList, bizCode, {
                        bizCode,
                        promotionScene: defaults.promotionScene,
                        promotionType: defaults.promotionType || DEFAULTS.promotionType,
                        subPromotionType: defaults.subPromotionType || DEFAULTS.subPromotionType,
                        optimizeTarget: defaults.bidTargetV2 || DEFAULTS.bidTargetV2,
                        labelList: [{ labelId }],
                        materialIdList: (materialIdList || []).map(toIdValue).filter(Boolean)
                    }, requestOptions || {});
                    const list = Array.isArray(res?.data?.list) ? res.data.list : [];
                    if (list.length) labelResults.push(...list);
                } catch (err) {
                    log.warn(`推荐人群接口失败 labelId=${labelId}:`, err?.message || err);
                }
            }
            return labelListToCrowdList(labelResults);
        };

        const applyKeywordDefaults = (word, keywordDefaults = {}) => {
            const fallbackBid = toNumber(keywordDefaults.bidPrice, 1);
            const fallbackMatch = parseMatchScope(keywordDefaults.matchScope, DEFAULTS.matchScope);
            const fallbackStatus = toNumber(keywordDefaults.onlineStatus, DEFAULTS.keywordOnlineStatus);
            return {
                word: String(word.word || word.keyword || '').trim(),
                bidPrice: toNumber(word.bidPrice, fallbackBid),
                matchScope: parseMatchScope(word.matchScope, fallbackMatch),
                onlineStatus: toNumber(word.onlineStatus, fallbackStatus)
            };
        };

        const WORD_PACKAGE_FIELD_RE = /(wordpackage|word_package|词包|krpackage|traffic.*package|package.*word|package)/i;
        const stripWordPackageArtifacts = (value) => {
            if (Array.isArray(value)) {
                return value
                    .map(item => stripWordPackageArtifacts(item))
                    .filter(item => item !== undefined && item !== null);
            }
            if (!isPlainObject(value)) return value;
            const out = {};
            Object.keys(value).forEach(key => {
                if (WORD_PACKAGE_FIELD_RE.test(key)) return;
                const nextValue = stripWordPackageArtifacts(value[key]);
                if (nextValue === undefined) return;
                out[key] = nextValue;
            });
            return out;
        };

        const KEYWORD_TRAFFIC_PACKAGE_FIELD_RE = /(golden|detent|trend|traffic|kr|card|flow|package|词包|卡位|趋势|流量金卡)/i;
        const stripKeywordTrafficArtifacts = (value) => {
            if (Array.isArray(value)) {
                return value
                    .map(item => stripKeywordTrafficArtifacts(item))
                    .filter(item => item !== undefined && item !== null);
            }
            if (!isPlainObject(value)) return value;
            const out = {};
            Object.keys(value).forEach(key => {
                const lower = key.toLowerCase();
                if (key !== 'promotionScene'
                    && key !== 'subPromotionType'
                    && key !== 'promotionType'
                    && key !== 'itemSelectedMode'
                    && key !== 'campaignName'
                    && KEYWORD_TRAFFIC_PACKAGE_FIELD_RE.test(lower)) {
                    return;
                }
                const nextValue = stripKeywordTrafficArtifacts(value[key]);
                if (nextValue === undefined) return;
                out[key] = nextValue;
            });
            return out;
        };

        const KEYWORD_CUSTOM_CAMPAIGN_ALLOW_KEYS = new Set([
            'operation',
            'bizCode',
            'promotionScene',
            'subPromotionType',
            'promotionType',
            'itemSelectedMode',
            'bidTypeV2',
            'bidTargetV2',
            'campaignCycleBudgetInfo',
            'itemIdList',
            'deleteAdgroupList',
            'updatedRightInfoAdgroupList',
            'setSingleCostV2',
            'singleCostV2',
            'optimizeTarget',
            'dmcType',
            'campaignName',
            'campaignGroupId',
            'campaignGroupName',
            'supportCouponId',
            'crowdList',
            'adzoneList',
            'launchAreaStrList',
            'launchPeriodList',
            'dayBudget',
            'dayAverageBudget',
            'totalBudget',
            'futureBudget'
        ]);
        const KEYWORD_WORD_PACKAGE_ERROR_RE = /流量智选词包校验失败/;

        const normalizeBidMode = (value, fallback = 'smart') => {
            const raw = String(value || '').trim().toLowerCase();
            if (raw === 'smart' || raw === 'smart_bid') return 'smart';
            if (raw === 'manual' || raw === 'custom' || raw === 'custom_bid' || raw === 'manual_bid') return 'manual';
            if (fallback === '') return '';
            return fallback === 'manual' ? 'manual' : 'smart';
        };

        const normalizeFallbackPolicy = (value, fallback = 'confirm') => {
            const raw = String(value || '').trim().toLowerCase();
            if (raw === 'auto' || raw === 'none' || raw === 'confirm') return raw;
            return fallback === 'auto' || fallback === 'none' ? fallback : 'confirm';
        };

        const bidModeToBidType = (bidMode = 'smart') => normalizeBidMode(bidMode) === 'manual' ? 'custom_bid' : 'smart_bid';

        const isWordPackageValidationError = (errorText = '') => KEYWORD_WORD_PACKAGE_ERROR_RE.test(String(errorText || ''));

        const resolvePlanBidMode = ({ plan = {}, request = {}, runtime = {}, campaign = {} } = {}) => {
            const fromPlan = normalizeBidMode(plan?.bidMode || '', '');
            if (fromPlan) return fromPlan;
            const fromCommon = normalizeBidMode(request?.common?.bidMode || '', '');
            if (fromCommon) return fromCommon;
            const fromRequest = normalizeBidMode(request?.bidMode || '', '');
            if (fromRequest) return fromRequest;
            const fromPlanCampaign = normalizeBidMode(plan?.campaignOverride?.bidTypeV2 || '', '');
            if (fromPlanCampaign) return fromPlanCampaign;
            const fromCommonCampaign = normalizeBidMode(request?.common?.campaignOverride?.bidTypeV2 || '', '');
            if (fromCommonCampaign) return fromCommonCampaign;
            const fromRequestCampaign = normalizeBidMode(request?.bidTypeV2 || '', '');
            if (fromRequestCampaign) return fromRequestCampaign;
            const fromCampaign = normalizeBidMode(campaign?.bidTypeV2 || '', '');
            if (fromCampaign) return fromCampaign;
            return normalizeBidMode(runtime?.bidTypeV2 || DEFAULTS.bidTypeV2, 'smart');
        };

        const normalizeKeywordWordListForSubmit = (wordList = []) => {
            if (!Array.isArray(wordList)) return [];
            return uniqueBy(
                wordList
                    .map(item => applyKeywordDefaults(item || {}, {}))
                    .filter(item => item.word)
                    .map(item => ({
                        word: item.word,
                        bidPrice: item.bidPrice,
                        matchScope: item.matchScope,
                        onlineStatus: item.onlineStatus
                    })),
                item => item.word
            ).slice(0, 200);
        };

        const pruneKeywordCampaignForCustomScene = (campaign = {}, options = {}) => {
            const request = options?.request || {};
            const input = isPlainObject(campaign) ? campaign : {};
            const bidMode = normalizeBidMode(
                options?.bidMode
                    || request?.common?.bidMode
                    || request?.bidMode
                    || input?.bidTypeV2
                    || request?.common?.campaignOverride?.bidTypeV2
                    || request?.bidTypeV2
                    || DEFAULTS.bidTypeV2,
                'smart'
            );
            const isManual = bidMode === 'manual';
            const out = {};
            Object.keys(input).forEach(key => {
                if (!KEYWORD_CUSTOM_CAMPAIGN_ALLOW_KEYS.has(key)) return;
                out[key] = deepClone(input[key]);
            });
            out.bizCode = String(out.bizCode || '').trim() || DEFAULTS.bizCode;
            out.promotionScene = DEFAULTS.promotionScene;
            out.subPromotionType = out.subPromotionType || DEFAULTS.subPromotionType;
            out.promotionType = out.promotionType || DEFAULTS.promotionType;
            out.itemSelectedMode = DEFAULTS.itemSelectedMode;
            out.bidTypeV2 = bidModeToBidType(bidMode);
            if (isManual) {
                delete out.bidTargetV2;
                delete out.optimizeTarget;
                out.setSingleCostV2 = false;
                delete out.singleCostV2;
            } else {
                out.bidTargetV2 = out.bidTargetV2 || DEFAULTS.bidTargetV2;
                out.optimizeTarget = out.optimizeTarget || out.bidTargetV2 || DEFAULTS.bidTargetV2;
                out.setSingleCostV2 = !!out.setSingleCostV2;
                if (!out.setSingleCostV2) delete out.singleCostV2;
            }
            out.dmcType = out.dmcType || DEFAULTS.dmcType;
            out.campaignName = String(out.campaignName || `关键词推广_${todayStamp()}`).trim();
            if (!isPlainObject(out.campaignCycleBudgetInfo)) {
                out.campaignCycleBudgetInfo = { currentCampaignActivityCycleBudgetStatus: '0' };
            } else if (!out.campaignCycleBudgetInfo.currentCampaignActivityCycleBudgetStatus) {
                out.campaignCycleBudgetInfo.currentCampaignActivityCycleBudgetStatus = '0';
            }
            if (!Array.isArray(out.itemIdList)) out.itemIdList = [];
            if (!Array.isArray(out.deleteAdgroupList)) out.deleteAdgroupList = [];
            if (!Array.isArray(out.updatedRightInfoAdgroupList)) out.updatedRightInfoAdgroupList = [];
            if (!Array.isArray(out.crowdList)) out.crowdList = [];
            if (!Array.isArray(out.adzoneList)) out.adzoneList = [];
            if (!Array.isArray(out.launchAreaStrList) || !out.launchAreaStrList.length) out.launchAreaStrList = ['all'];
            if (!Array.isArray(out.launchPeriodList) || !out.launchPeriodList.length) out.launchPeriodList = buildDefaultLaunchPeriodList();
            return out;
        };

        const pruneKeywordAdgroupForCustomScene = (adgroup = {}, item = null) => {
            const input = isPlainObject(adgroup) ? adgroup : {};
            const out = {};
            out.rightList = Array.isArray(input.rightList) ? deepClone(input.rightList) : [];
            out.wordList = normalizeKeywordWordListForSubmit(input.wordList || []);
            if (item && (item.materialId || item.itemId)) {
                out.material = pickMaterialFields(mergeDeep(input.material || {}, {
                    materialId: toIdValue(item.materialId || item.itemId),
                    materialName: item.materialName || '',
                    promotionType: DEFAULTS.promotionType,
                    subPromotionType: DEFAULTS.subPromotionType,
                    fromTab: item.fromTab || 'manual',
                    linkUrl: item.linkUrl || '',
                    goalLifeCycleList: item.goalLifeCycleList || null,
                    shopId: item.shopId || '',
                    shopName: item.shopName || '',
                    bidCount: item.bidCount || 0,
                    categoryLevel1: item.categoryLevel1 || ''
                }));
            } else if (isPlainObject(input.material)) {
                out.material = pickMaterialFields(input.material);
            }
            return out;
        };

        const deriveFallbackKeywordListFromItem = (item = {}, keywordDefaults = {}) => {
            const title = String(item?.materialName || '').trim();
            if (!title) return [];
            const seeds = [];
            const normalized = title.replace(/[，。、“”‘’!！?？:：;；,.\-_/()（）【】\[\]\s]+/g, ' ').trim();
            if (normalized) {
                const parts = normalized.split(/\s+/).filter(Boolean);
                if (parts.length) seeds.push(parts[0]);
                if (parts.length > 1) seeds.push(parts.slice(0, 2).join(' '));
            }
            seeds.push(title.slice(0, 12));
            const words = uniqueBy(
                seeds
                    .map(text => String(text || '').trim())
                    .filter(text => text.length >= 2)
                    .map(text => applyKeywordDefaults({ word: text }, keywordDefaults)),
                item => item.word
            ).slice(0, 3);
            return words;
        };

        const buildKeywordBundle = async ({ plan, item, runtimeDefaults, request, requestOptions }) => {
            const commonKeywordDefaults = request?.common?.keywordDefaults || {};
            const planKeywordDefaults = plan?.keywordDefaults || {};
            const keywordDefaults = {
                bidPrice: toNumber(planKeywordDefaults.bidPrice, toNumber(commonKeywordDefaults.bidPrice, 1)),
                matchScope: parseMatchScope(planKeywordDefaults.matchScope, parseMatchScope(commonKeywordDefaults.matchScope, DEFAULTS.matchScope)),
                onlineStatus: toNumber(planKeywordDefaults.onlineStatus, toNumber(commonKeywordDefaults.onlineStatus, DEFAULTS.keywordOnlineStatus))
            };
            const sourceCfg = plan?.keywordSource || {};
            const mode = sourceCfg.mode || request?.common?.keywordMode || DEFAULTS.keywordMode;
            const recommendCount = Math.max(0, toNumber(sourceCfg.recommendCount, toNumber(request?.common?.recommendCount, DEFAULTS.recommendCount)));
            const recommendSource = sourceCfg.recommendSource || 'auto';
            const useWordPackage = sourceCfg.useWordPackage === true
                || plan?.useWordPackage === true
                || request?.useWordPackage === true
                || request?.common?.useWordPackage === true;
            const manualWords = parseKeywords(plan?.keywords || [], keywordDefaults).map(word => applyKeywordDefaults(word, keywordDefaults));

            let recommendedWords = [];
            let recommendedPackages = [];
            if (mode !== 'manual') {
                recommendedWords = await fetchRecommendWordList({
                    bizCode: runtimeDefaults.bizCode,
                    materialId: item.materialId,
                    defaults: runtimeDefaults,
                    source: recommendSource,
                    requestOptions
                });
                if (useWordPackage) {
                    recommendedPackages = await fetchRecommendWordPackageList({
                        bizCode: runtimeDefaults.bizCode,
                        materialId: item.materialId,
                        defaults: runtimeDefaults,
                        requestOptions
                    });
                }
            }

            const normalizedRecommend = recommendedWords
                .map(word => applyKeywordDefaults(word, keywordDefaults))
                .filter(word => word.word);

            let mergedWordList = [];
            if (mode === 'manual') {
                mergedWordList = manualWords;
            } else if (mode === 'recommend') {
                mergedWordList = normalizedRecommend.slice(0, recommendCount || normalizedRecommend.length);
            } else {
                const dedupMap = new Map();
                manualWords.forEach(word => dedupMap.set(word.word, word));
                normalizedRecommend.forEach(word => {
                    if (dedupMap.size >= Math.max(recommendCount, manualWords.length)) return;
                    if (!dedupMap.has(word.word)) dedupMap.set(word.word, word);
                });
                mergedWordList = Array.from(dedupMap.values());
                if (recommendCount > 0 && mergedWordList.length < recommendCount) {
                    normalizedRecommend.forEach(word => {
                        if (mergedWordList.length >= recommendCount) return;
                        if (!dedupMap.has(word.word)) {
                            dedupMap.set(word.word, word);
                            mergedWordList.push(word);
                        }
                    });
                }
            }
            mergedWordList = uniqueBy(mergedWordList, word => word.word).slice(0, 200);
            if (!mergedWordList.length) {
                mergedWordList = deriveFallbackKeywordListFromItem(item, keywordDefaults);
            }
            const wordPackageList = Array.isArray(recommendedPackages) ? recommendedPackages.slice(0, 100) : [];
            return {
                wordList: mergedWordList,
                wordPackageList,
                useWordPackage,
                mode,
                manualCount: manualWords.length,
                recommendCount: normalizedRecommend.length
            };
        };

        const extractPageAddedItemIds = () => {
            const addBtn = Array.from(document.querySelectorAll('button,div,a')).find(el =>
                /添加商品\s*\d+\s*\/\s*\d+/.test((el.textContent || '').replace(/\s+/g, ' '))
            );
            const expectedCount = toNumber(((addBtn?.textContent || '').match(/(\d+)\s*\/\s*\d+/) || [])[1], 0);
            const root = addBtn?.closest('section,div')?.parentElement || document.body;

            const idsFromText = parseItemIdsFromText(root?.innerText || '');
            const idsFromHref = uniqueBy(
                Array.from(root?.querySelectorAll?.('a[href*="item.htm?id="]') || [])
                    .map(a => {
                        const match = (a.getAttribute('href') || '').match(/id=(\d{6,})/);
                        return match ? match[1] : '';
                    })
                    .filter(Boolean),
                id => id
            );
            const all = uniqueBy([...idsFromText, ...idsFromHref], id => id);
            return expectedCount > 0 ? all.slice(0, expectedCount) : all;
        };

        const fetchItemsByIds = async (itemIdList, runtime) => {
            if (!Array.isArray(itemIdList) || !itemIdList.length) return [];
            const res = await searchItems({
                bizCode: runtime.bizCode,
                promotionScene: runtime.promotionScene,
                itemIdList,
                pageSize: Math.max(40, itemIdList.length)
            });
            const map = new Map(res.list.map(item => [String(item.materialId), item]));
            return itemIdList.map(id => map.get(String(id))).filter(Boolean);
        };

        const readSessionDraft = () => {
            try {
                const raw = sessionStorage.getItem(SESSION_DRAFT_KEY);
                if (!raw) return null;
                const parsed = JSON.parse(raw);
                return isPlainObject(parsed) ? parsed : null;
            } catch {
                return null;
            }
        };

        const saveSessionDraft = (draft) => {
            try {
                sessionStorage.setItem(SESSION_DRAFT_KEY, JSON.stringify(draft || {}));
            } catch (err) {
                log.warn('保存向导草稿失败:', err?.message || err);
            }
        };

        const clearSessionDraft = () => {
            try {
                sessionStorage.removeItem(SESSION_DRAFT_KEY);
            } catch { }
            wizardState.draft = null;
            wizardState.addedItems = [];
            wizardState.crowdList = [];
            wizardState.debugVisible = false;
            wizardState.strategyList = getDefaultStrategyList();
            wizardState.editingStrategyId = '';
            wizardState.detailVisible = false;
        };

        const resolvePreferredItems = async (request, runtime) => {
            const draft = readSessionDraft();
            const draftItems = Array.isArray(draft?.addedItems)
                ? draft.addedItems.map(normalizeItem).filter(item => item.materialId)
                : [];
            if (draftItems.length) return draftItems.slice(0, WIZARD_MAX_ITEMS);

            const pageItemIds = extractPageAddedItemIds();
            if (pageItemIds.length) {
                const fromPage = await fetchItemsByIds(pageItemIds, runtime);
                if (fromPage.length) return fromPage.slice(0, WIZARD_MAX_ITEMS);
            }

            if (request?.itemSearch) {
                const searched = await searchItems(request.itemSearch);
                return searched.list.slice(0, WIZARD_MAX_ITEMS);
            }

            return [];
        };

        const isSceneLikelyRequireItem = (sceneName = '') => {
            const normalizedScene = String(sceneName || '').trim();
            if (!normalizedScene) return true;
            if (SCENE_REQUIRE_ITEM_FALLBACK[normalizedScene] !== undefined) {
                return !!SCENE_REQUIRE_ITEM_FALLBACK[normalizedScene];
            }
            return true;
        };

        const resolveSceneCapabilities = ({ sceneName = '', runtime = {}, request = {} }) => {
            const normalizedScene = String(sceneName || request?.sceneName || '').trim();
            const expectedSceneBizCode = normalizeSceneBizCode(
                resolveSceneBizCodeHint(normalizedScene)
                || SCENE_BIZCODE_HINT_FALLBACK[normalizedScene]
                || ''
            );
            const runtimeTemplateBizCode = normalizeSceneBizCode(
                runtime?.solutionTemplate?.bizCode
                || runtime?.solutionTemplate?.campaign?.bizCode
                || ''
            );
            const templateMatchedScene = !expectedSceneBizCode
                || !runtimeTemplateBizCode
                || runtimeTemplateBizCode === expectedSceneBizCode;
            const template = templateMatchedScene ? (runtime?.solutionTemplate || {}) : {};
            const templateCampaign = isPlainObject(template.campaign) ? template.campaign : {};
            const templateAdgroup = Array.isArray(template.adgroupList) && isPlainObject(template.adgroupList[0])
                ? template.adgroupList[0]
                : {};
            const capabilityFallback = {
                '货品全站推广': { hasMaterial: true, hasItemIdList: false, hasWordList: false, hasWordPackageList: false, hasRightList: false },
                '关键词推广': { hasMaterial: true, hasItemIdList: true, hasWordList: true, hasWordPackageList: true, hasRightList: true },
                '人群推广': { hasMaterial: false, hasItemIdList: true, hasWordList: false, hasWordPackageList: false, hasRightList: true },
                '店铺直达': { hasMaterial: true, hasItemIdList: false, hasWordList: false, hasWordPackageList: true, hasRightList: false },
                '内容营销': { hasMaterial: true, hasItemIdList: false, hasWordList: false, hasWordPackageList: false, hasRightList: false },
                '线索推广': { hasMaterial: false, hasItemIdList: true, hasWordList: true, hasWordPackageList: true, hasRightList: false }
            }[normalizedScene] || {};
            const hasTemplateCampaign = isPlainObject(templateCampaign) && Object.keys(templateCampaign).length > 0;
            const hasTemplateAdgroup = isPlainObject(templateAdgroup) && Object.keys(templateAdgroup).length > 0;
            const useFallbackCapability = !hasTemplateCampaign || !hasTemplateAdgroup || !templateMatchedScene;
            const hasMaterial = isPlainObject(templateAdgroup.material) && Object.keys(templateAdgroup.material).length > 0;
            const hasItemIdList = hasOwn(templateCampaign, 'itemIdList') || (!!capabilityFallback.hasItemIdList && useFallbackCapability);
            const hasWordList = hasOwn(templateAdgroup, 'wordList') || (!!capabilityFallback.hasWordList && useFallbackCapability);
            const hasWordPackageList = hasOwn(templateAdgroup, 'wordPackageList') || (!!capabilityFallback.hasWordPackageList && useFallbackCapability);
            const hasRightList = hasOwn(templateAdgroup, 'rightList') || (!!capabilityFallback.hasRightList && useFallbackCapability);

            const requireItemOverride = request?.requireItem;
            let requiresItem = false;
            if (requireItemOverride === true || requireItemOverride === false) {
                requiresItem = !!requireItemOverride;
            } else if (hasMaterial || hasItemIdList) {
                requiresItem = true;
            } else {
                requiresItem = isSceneLikelyRequireItem(normalizedScene);
            }

            const enableKeywordsOverride = request?.enableKeywords;
            let enableKeywords = false;
            if (enableKeywordsOverride === true || enableKeywordsOverride === false) {
                enableKeywords = !!enableKeywordsOverride;
            } else {
                enableKeywords = /(关键词推广|线索推广)/.test(normalizedScene) || hasWordList || hasWordPackageList;
            }

            // 关键词推广必须按“商品 + 关键词单元”提交，不能依赖模板是否返回这些字段。
            if (normalizedScene === '关键词推广') {
                requiresItem = true;
                enableKeywords = true;
            }

            return {
                sceneName: normalizedScene,
                expectedSceneBizCode,
                runtimeTemplateBizCode,
                templateMatchedScene,
                hasTemplateCampaign,
                hasTemplateAdgroup,
                requiresItem,
                enableKeywords,
                hasMaterial: SCENE_FORCE_ADGROUP_MATERIAL[normalizedScene]
                    ? true
                    : (normalizedScene === '关键词推广' ? true : (hasMaterial || (!!capabilityFallback.hasMaterial && useFallbackCapability))),
                hasItemIdList: normalizedScene === '关键词推广' ? true : hasItemIdList,
                hasWordList: normalizedScene === '关键词推广' ? true : hasWordList,
                hasWordPackageList: normalizedScene === '关键词推广' ? true : hasWordPackageList,
                hasRightList
            };
        };

        const resolvePlanNamePrefix = (request = {}) => {
            const fromRequest = String(request?.planNamePrefix || '').trim();
            if (fromRequest) return fromRequest;
            const sceneName = String(request?.sceneName || '关键词推广').trim() || '关键词推广';
            return buildSceneTimePrefix(sceneName);
        };

        const normalizePlans = (request, preferredItems, options = {}) => {
            const requiresItem = options.requiresItem !== false;
            const commonBidMode = normalizeBidMode(request?.common?.bidMode || request?.bidMode || '', 'smart');
            const plans = Array.isArray(request?.plans) ? request.plans.map(plan => ({ ...plan })) : [];
            if (!plans.length) {
                const prefix = resolvePlanNamePrefix(request);
                if (!preferredItems.length) {
                    if (requiresItem) return [];
                    const rawCount = request?.planCount ?? request?.count ?? 1;
                    const planCount = Math.max(1, Math.min(50, toNumber(rawCount, 1)));
                    return Array.from({ length: planCount }).map((_, idx) => ({
                        planName: `${prefix}_${String(idx + 1).padStart(2, '0')}`,
                        bidMode: commonBidMode,
                        keywords: request?.keywords || [],
                        keywordSource: request?.keywordSource || {}
                    }));
                }
                return preferredItems.map((item, idx) => ({
                    planName: `${prefix}_${String(idx + 1).padStart(2, '0')}`,
                    item,
                    bidMode: commonBidMode,
                    keywords: request?.keywords || [],
                    keywordSource: request?.keywordSource || {}
                }));
            }

            let fillCursor = 0;
            return plans.map((plan, idx) => {
                const normalized = { ...plan };
                if (!normalized.planName) {
                    const prefix = resolvePlanNamePrefix(request);
                    normalized.planName = `${prefix}_${String(idx + 1).padStart(2, '0')}`;
                }
                normalized.bidMode = normalizeBidMode(
                    normalized.bidMode
                        || normalized.campaignOverride?.bidTypeV2
                        || commonBidMode,
                    commonBidMode
                );
                if (normalized.item) {
                    normalized.item = normalizeItem(normalized.item);
                } else if (normalized.itemId) {
                    normalized.item = normalizeItem({
                        materialId: normalized.itemId,
                        itemId: normalized.itemId,
                        materialName: normalized.itemName || ''
                    });
                } else if (preferredItems[fillCursor]) {
                    normalized.item = normalizeItem(preferredItems[fillCursor]);
                    fillCursor++;
                }
                return normalized;
            }).filter(plan => {
                if (!requiresItem) return true;
                return !!plan.item?.materialId;
            });
        };

        const applyOverrides = (target, request, plan) => {
            const commonCampaignOverride = request?.common?.campaignOverride || {};
            const commonAdgroupOverride = request?.common?.adgroupOverride || {};
            const commonPassthrough = request?.common?.passthrough || {};
            const planCampaignOverride = plan?.campaignOverride || {};
            const planAdgroupOverride = plan?.adgroupOverride || {};
            const goalForcedCampaignOverride = request?.goalForcedCampaignOverride || {};
            const goalForcedAdgroupOverride = request?.goalForcedAdgroupOverride || {};
            const planGoalCampaignOverride = plan?.goalForcedCampaignOverride || {};
            const planGoalAdgroupOverride = plan?.goalForcedAdgroupOverride || {};
            const sceneForcedCampaignOverride = request?.sceneForcedCampaignOverride || {};
            const sceneForcedAdgroupOverride = request?.sceneForcedAdgroupOverride || {};
            const requestRawOverrides = isPlainObject(request?.rawOverrides) ? request.rawOverrides : {};
            const commonRawOverrides = isPlainObject(request?.common?.rawOverrides) ? request.common.rawOverrides : {};
            const planRawOverrides = isPlainObject(plan?.rawOverrides) ? plan.rawOverrides : {};

            const pickCampaignRaw = (raw) => {
                if (!isPlainObject(raw)) return {};
                if (isPlainObject(raw.campaign)) return raw.campaign;
                if (isPlainObject(raw.adgroup)) return {};
                return raw;
            };
            const pickAdgroupRaw = (raw) => {
                if (!isPlainObject(raw)) return {};
                if (isPlainObject(raw.adgroup)) return raw.adgroup;
                return {};
            };

            // 合并顺序：模板基底(已在 buildSolutionFromPlan) -> GoalSpec 默认 -> 场景映射 -> common/plan override -> rawOverrides。
            target.campaign = mergeDeep(
                target.campaign,
                goalForcedCampaignOverride,
                planGoalCampaignOverride,
                sceneForcedCampaignOverride,
                commonCampaignOverride,
                planCampaignOverride,
                commonPassthrough,
                pickCampaignRaw(requestRawOverrides),
                pickCampaignRaw(commonRawOverrides),
                pickCampaignRaw(planRawOverrides)
            );
            target.adgroup = mergeDeep(
                target.adgroup,
                goalForcedAdgroupOverride,
                planGoalAdgroupOverride,
                sceneForcedAdgroupOverride,
                commonAdgroupOverride,
                planAdgroupOverride,
                pickAdgroupRaw(requestRawOverrides),
                pickAdgroupRaw(commonRawOverrides),
                pickAdgroupRaw(planRawOverrides)
            );
        };

        const buildDefaultLaunchPeriodList = () => {
            const list = [];
            for (let day = 1; day <= 7; day++) {
                list.push({
                    dayOfWeek: String(day),
                    timeSpanList: [{ discount: 100, time: '00:00-24:00' }]
                });
            }
            return list;
        };

        const formatDateYmd = (date = new Date()) => {
            const d = date instanceof Date ? date : new Date();
            const pad = (n) => String(n).padStart(2, '0');
            return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
        };

        const buildDefaultLaunchTime = ({ days = 7, forever = false } = {}) => {
            const safeDays = Math.max(1, toNumber(days, 7));
            const start = new Date();
            const startTime = formatDateYmd(start);
            if (forever) {
                return {
                    startTime,
                    launchForever: true
                };
            }
            const end = new Date(start.getTime() + (safeDays - 1) * 24 * 60 * 60 * 1000);
            return {
                startTime,
                endTime: formatDateYmd(end),
                launchForever: false
            };
        };

        const normalizeSceneSettingValue = (text = '') => {
            const value = String(text || '').trim();
            if (!value) return '';
            if (/^(请选择|默认|无|不设置|未设置)$/i.test(value)) return '';
            return value;
        };

        const mapSceneBidTargetValue = (text = '') => {
            const value = normalizeSceneSettingValue(text);
            if (!value) return '';
            if (/^(conv|roi|click|fav_cart|market_penetration|similar_item|search_rank|display_shentou|display_roi|display_uv|display_cart|detent|word_penetration_rate|coll_cart)$/i.test(value)) return value;
            if (/稳定新客投产比|display[_\s-]*roi/i.test(value)) return 'display_roi';
            if (/扩大新客规模|新客规模|display[_\s-]*uv/i.test(value)) return 'display_uv';
            if (/新客收藏加购|display[_\s-]*cart/i.test(value)) return 'display_cart';
            if (/搜索卡位|抢占.*卡位|卡位|抢位|抢首|抢前|抢首页/i.test(value)) return 'search_rank';
            if (/市场渗透|词市场渗透|penetration|word[_\s-]*penetration/i.test(value)) return 'word_penetration_rate';
            if (/相似品/.test(value)) return 'similar_item';
            if (/渗透|趋势|趋势明星/.test(value)) return 'market_penetration';
            if (/拉新|拉新人群|拉新渗透|引力魔方|人群推广|display[_\s-]*shentou/i.test(value)) return 'display_shentou';
            if (/流量金卡/.test(value)) return 'click';
            if (/投产|ROI|投产比/i.test(value)) return 'roi';
            if (/点击/.test(value)) return 'click';
            if (/收藏|加购/.test(value)) return 'fav_cart';
            if (/渗透/.test(value)) return 'market_penetration';
            if (/成交|GMV|观看.*成交|净成交/i.test(value)) return 'conv';
            if (/自定义推广|线索|留资/.test(value)) return 'conv';
            return '';
        };

        const mapSceneBudgetTypeValue = (text = '') => {
            const value = normalizeSceneSettingValue(text);
            if (!value) return '';
            if (/^(day_average|normal|total|day_freeze|unlimit)$/i.test(value)) return value;
            if (/不限预算/.test(value)) return 'unlimit';
            if (/日均预算/.test(value)) return 'day_average';
            if (/每日预算/.test(value)) return 'normal';
            if (/总预算/.test(value)) return 'total';
            if (/冻结|未来/.test(value)) return 'day_freeze';
            return '';
        };

        const mapSceneBidTypeValue = (text = '', sceneName = '') => {
            const value = normalizeSceneSettingValue(text);
            if (!value) return '';
            if (/^(smart_bid|manual_bid|custom_bid|bcb|mcb|max_amount|cost_control|roi_control)$/i.test(value)) {
                return value.toLowerCase() === 'manual_bid' ? 'custom_bid' : value.toLowerCase();
            }
            const normalizedScene = String(sceneName || '').trim();
            if (/智能出价/.test(value)) return 'smart_bid';
            if (/手动出价|手动/.test(value)) return 'custom_bid';
            if (/控投产比/.test(value)) return 'roi_control';
            if (/控成本/.test(value)) {
                if (normalizedScene === '内容营销') return 'mcb';
                return 'cost_control';
            }
            if (/最大化拿量/.test(value)) {
                if (normalizedScene === '内容营销') return 'bcb';
                return 'max_amount';
            }
            return '';
        };

        const normalizeBidTypeForCampaignField = (bidType = '', targetKey = '', sceneName = '') => {
            const source = String(bidType || '').trim().toLowerCase();
            const key = String(targetKey || '').trim();
            const normalizedScene = String(sceneName || '').trim();
            if (!source || !key) return '';
            if (key === 'bidTypeV2') {
                if (normalizedScene === '人群推广') {
                    if (/^(smart_bid|manual_bid|custom_bid|bcb|mcb|max_amount|cost_control|roi_control)$/i.test(source)) {
                        return 'custom_bid';
                    }
                }
                if (source === 'manual_bid') return 'custom_bid';
                if (source === 'smart_bid' || source === 'custom_bid') return source;
                return '';
            }
            if (key === 'bidType') {
                if (normalizedScene === '人群推广') return '';
                if (source === 'manual_bid' || source === 'custom_bid') {
                    if (normalizedScene === '内容营销') return 'mcb';
                    if (normalizedScene === '线索推广') return 'cost_control';
                    if (normalizedScene === '货品全站推广') return 'roi_control';
                    return 'custom_bid';
                }
                if (source === 'smart_bid') {
                    if (normalizedScene === '内容营销') return 'bcb';
                    if (normalizedScene === '线索推广') return 'max_amount';
                    if (normalizedScene === '货品全站推广') return 'max_amount';
                    return 'max_amount';
                }
                if (/^(bcb|mcb|max_amount|cost_control|roi_control|custom_bid)$/i.test(source)) return source;
            }
            return '';
        };

        const mapSceneItemSelectedModeValue = (text = '') => {
            const value = normalizeSceneSettingValue(text);
            if (!value) return '';
            if (/^(user_define|shop|search_detent|trend)$/i.test(value)) return value;
            if (/自定义|手动|指定商品/.test(value)) return 'user_define';
            if (/搜索卡位/.test(value)) return 'search_detent';
            if (/趋势/.test(value)) return 'trend';
            if (/店铺|全店|自动选品|推荐选品|行业推荐/.test(value)) return 'shop';
            return '';
        };

        const mapSceneCreativeSetModeValue = (text = '') => {
            const value = normalizeSceneSettingValue(text);
            if (!value) return '';
            if (/^(minimalist|professional|smart)$/i.test(value)) return value;
            if (/极简|基础|默认/.test(value)) return 'minimalist';
            if (/专业|进阶/.test(value)) return 'professional';
            if (/智能|自动/.test(value)) return 'smart';
            return '';
        };

        const mapScenePromotionStrategyValue = (sceneName = '', text = '', runtime = {}) => {
            const normalizedScene = String(sceneName || '').trim();
            const value = normalizeSceneSettingValue(text);
            if (!value) return '';
            if (normalizedScene !== '人群推广') {
                return '';
            }
            if (/^(jingdian_laxin|jihui_laxin|zidingyi_laxin|leimu_laxin)$/i.test(value)) {
                return value;
            }
            if (/竞店|经典/.test(value)) return 'jingdian_laxin';
            if (/机会/.test(value)) return 'jihui_laxin';
            if (/跨类目/.test(value)) return 'leimu_laxin';
            if (/自定义/.test(value)) return 'zidingyi_laxin';
            return normalizeSceneSettingValue(runtime?.storeData?.promotionStrategy || runtime?.solutionTemplate?.campaign?.promotionStrategy || '');
        };

        const mapSceneOrderChargeTypeValue = (text = '', runtime = {}) => {
            const value = normalizeSceneSettingValue(text);
            if (!value) return '';
            if (/^(click|cpc|conv|cpa|cps|show|cpm|balance_charge|pc_direct_charge|uni_budget_charge)$/i.test(value)) return value.toLowerCase();
            if (/点击|CPC/i.test(value)) return 'click';
            if (/成交|转化|CPA|CPS/i.test(value)) return 'conv';
            if (/展示|曝光|CPM/i.test(value)) return 'show';
            if (/预算通/.test(value)) return 'uni_budget_charge';
            if (/支付宝/.test(value)) return 'pc_direct_charge';
            if (/余额/.test(value)) return 'balance_charge';
            return normalizeSceneSettingValue(runtime?.storeData?.orderChargeType || runtime?.solutionTemplate?.campaign?.orderChargeType || '');
        };

        const resolveSceneTargetCode = ({ sceneName = '', sourceKey = '', sourceValue = '', runtime = {} } = {}) => {
            const normalizedScene = String(sceneName || '').trim();
            const normalizedSourceKey = normalizeText(sourceKey).replace(/[：:]/g, '').trim();
            const value = normalizeSceneSettingValue(sourceValue);
            if (!value) return '';
            const fromExplicitTargetField = /(出价目标|优化目标)/.test(normalizedSourceKey);
            const fromMarketingField = /营销目标/.test(normalizedSourceKey);
            const runtimeTarget = normalizeSceneSettingValue(
                runtime?.storeData?.optimizeTarget
                || runtime?.storeData?.bidTargetV2
                || runtime?.solutionTemplate?.campaign?.optimizeTarget
                || runtime?.solutionTemplate?.campaign?.bidTargetV2
                || ''
            );

            if (normalizedScene !== '关键词推广' && fromMarketingField && !fromExplicitTargetField) {
                // 非关键词场景的“营销目标”仅用于目标分流，不直接覆盖目标码字段。
                return '';
            }

            let code = mapSceneBidTargetValue(value);
            if (normalizedScene === '人群推广') {
                if (!code || code === DEFAULTS.bidTargetV2 || code === 'market_penetration') {
                    code = runtimeTarget;
                }
                return code || runtimeTarget;
            }

            if (!code) return runtimeTarget;
            if (normalizedScene !== '关键词推广' && code === DEFAULTS.bidTargetV2 && runtimeTarget) {
                return runtimeTarget;
            }
            return code;
        };

        const parseNumberFromSceneValue = (text = '') => {
            const raw = String(text || '').replace(/,/g, '').trim();
            if (!raw) return NaN;
            const matched = raw.match(/-?\d+(?:\.\d+)?/);
            if (!matched || !matched[0]) return NaN;
            const value = Number(matched[0]);
            return Number.isFinite(value) ? value : NaN;
        };

        const normalizeSceneSettingEntries = (sceneSettings = {}) => {
            if (!isPlainObject(sceneSettings)) return [];
            return Object.keys(sceneSettings).map(key => ({
                key: String(key || '').trim(),
                value: normalizeSceneSettingValue(sceneSettings[key])
            })).filter(item => item.key && item.value);
        };

        const findSceneSettingEntry = (entries = [], patterns = []) => {
            if (!Array.isArray(entries) || !entries.length) return null;
            if (!Array.isArray(patterns) || !patterns.length) return null;
            for (const pattern of patterns) {
                const found = entries.find(item => pattern.test(item.key));
                if (found) return found;
            }
            return null;
        };

        const resolveSceneSettingOverrides = ({ sceneName = '', sceneSettings = {}, runtime = {} }) => {
            const entries = normalizeSceneSettingEntries(sceneSettings);
            const mapping = {
                sceneName: String(sceneName || '').trim(),
                applied: [],
                skipped: [],
                campaignOverride: {},
                adgroupOverride: {}
            };
            if (!entries.length) return mapping;

            const normalizedSceneName = String(sceneName || '').trim();
            const templateCampaign = runtime?.solutionTemplate?.campaign || {};
            const templateAdgroup = runtime?.solutionTemplate?.adgroupList?.[0] || {};
            const allowedCampaignKeys = new Set(Object.keys(templateCampaign || {}));
            [
                'campaignName',
                'dmcType',
                'bidType',
                'bidTargetV2',
                'optimizeTarget',
                'constraintType',
                'constraintValue',
                'smartCreative',
                'creativeSetMode',
                'itemSelectedMode',
                'promotionModel',
                'promotionModelMarketing',
                'launchPeriodList',
                'launchAreaStrList',
                'promotionStrategy',
                'needTargetCrowd',
                'aiXiaowanCrowdListSwitch',
                'user_level',
                'orderChargeType',
                'subOptimizeTarget',
                'dayBudget',
                'dayAverageBudget',
                'totalBudget',
                'futureBudget',
                'sourceChannel',
                'channelLocation',
                'selectedTargetBizCode',
                'dmpSolutionId',
                'activityId',
                'specialSourceForMainStep',
                'bpStrategyId',
                'bpStrategyType'
            ]
                .forEach(key => allowedCampaignKeys.add(key));
            if (SCENE_BIDTYPE_V2_ONLY.has(normalizedSceneName) || hasOwn(templateCampaign, 'bidTypeV2')) {
                allowedCampaignKeys.add('bidTypeV2');
            }
            const allowedAdgroupKeys = new Set(Object.keys(templateAdgroup || {}));
            ['rightList', 'smartCreative', 'material', 'wordList', 'wordPackageList']
                .forEach(key => allowedAdgroupKeys.add(key));

            const applyCampaign = (key, value, sourceKey = '', sourceValue = '') => {
                if (value === undefined || value === null || value === '') return;
                if (!allowedCampaignKeys.has(key)) {
                    mapping.skipped.push({
                        sourceKey,
                        sourceValue,
                        targetKey: key,
                        reason: 'campaign字段不在当前模板中'
                    });
                    return;
                }
                mapping.campaignOverride[key] = deepClone(value);
                mapping.applied.push({
                    sourceKey,
                    sourceValue,
                    targetKey: key,
                    targetValue: deepClone(value)
                });
            };

            const applyAdgroup = (key, value, sourceKey = '', sourceValue = '') => {
                if (value === undefined || value === null || value === '') return;
                if (!allowedAdgroupKeys.has(key)) {
                    mapping.skipped.push({
                        sourceKey,
                        sourceValue,
                        targetKey: `adgroup.${key}`,
                        reason: 'adgroup字段不在当前模板中'
                    });
                    return;
                }
                mapping.adgroupOverride[key] = deepClone(value);
                mapping.applied.push({
                    sourceKey,
                    sourceValue,
                    targetKey: `adgroup.${key}`,
                    targetValue: deepClone(value)
                });
            };

            const parseDirectSettingValue = (key = '', rawValue = '') => {
                const value = normalizeSceneSettingValue(rawValue);
                if (!value) return '';
                if ((value.startsWith('{') && value.endsWith('}')) || (value.startsWith('[') && value.endsWith(']'))) {
                    try {
                        return JSON.parse(value);
                    } catch { }
                }
                if (/^(true|false)$/i.test(value)) return /^true$/i.test(value);
                if (/List$/i.test(key) && /[,，]/.test(value)) {
                    return value
                        .split(/[,，]/)
                        .map(item => normalizeSceneSettingValue(item))
                        .filter(Boolean);
                }
                const numeric = parseNumberFromSceneValue(value);
                if (Number.isFinite(numeric) && /(?:budget|cost|price|rate|switch|smartcreative|discount|singlecost)$/i.test(key)) {
                    return numeric;
                }
                return value;
            };

            const targetPatterns = normalizedSceneName === '关键词推广'
                ? [/出价目标/, /优化目标/, /营销目标/]
                : [/出价目标/, /优化目标/];
            const targetEntry = findSceneSettingEntry(entries, targetPatterns);
            const targetCode = resolveSceneTargetCode({
                sceneName: normalizedSceneName,
                sourceKey: targetEntry?.key || '',
                sourceValue: targetEntry?.value || '',
                runtime
            });
            const supportsBidTargetFields = normalizedSceneName === '关键词推广'
                || normalizedSceneName === '人群推广'
                || hasOwn(templateCampaign, 'bidTargetV2')
                || hasOwn(templateCampaign, 'optimizeTarget');
            if (targetEntry && targetCode && supportsBidTargetFields) {
                applyCampaign('bidTargetV2', targetCode, targetEntry.key, targetEntry.value);
                applyCampaign('optimizeTarget', targetCode, targetEntry.key, targetEntry.value);
            } else if (targetEntry && targetCode && !supportsBidTargetFields) {
                mapping.skipped.push({
                    sourceKey: targetEntry.key,
                    sourceValue: targetEntry.value,
                    targetKey: 'bidTargetV2/optimizeTarget',
                    reason: '当前场景未识别到可用目标字段'
                });
            }

            const budgetTypeEntry = findSceneSettingEntry(entries, [/预算类型/]);
            const budgetTypeCode = mapSceneBudgetTypeValue(budgetTypeEntry?.value || '');
            if (budgetTypeEntry && budgetTypeCode) {
                applyCampaign('dmcType', budgetTypeCode, budgetTypeEntry.key, budgetTypeEntry.value);
            }

            const orderChargeTypeEntry = findSceneSettingEntry(entries, [/扣费方式/, /计费方式/, /收费方式/, /支付方式/]);
            const orderChargeTypeCode = mapSceneOrderChargeTypeValue(orderChargeTypeEntry?.value || '', runtime);
            if (orderChargeTypeEntry && orderChargeTypeCode) {
                applyCampaign('orderChargeType', orderChargeTypeCode, orderChargeTypeEntry.key, orderChargeTypeEntry.value);
            }

            const bidTypeEntry = findSceneSettingEntry(entries, [/出价方式/]);
            const bidTypeCode = mapSceneBidTypeValue(bidTypeEntry?.value || '', normalizedSceneName);
            if (bidTypeEntry && bidTypeCode) {
                const targetKeys = [];
                if (SCENE_BIDTYPE_V2_ONLY.has(normalizedSceneName) || hasOwn(templateCampaign, 'bidTypeV2')) {
                    targetKeys.push('bidTypeV2');
                }
                if (
                    hasOwn(templateCampaign, 'bidType')
                    || ['货品全站推广', '内容营销', '线索推广'].includes(normalizedSceneName)
                ) {
                    targetKeys.push('bidType');
                }
                uniqueBy(targetKeys, key => key).forEach(targetKey => {
                    const mappedCode = normalizeBidTypeForCampaignField(bidTypeCode, targetKey, normalizedSceneName);
                    if (!mappedCode) return;
                    applyCampaign(targetKey, mappedCode, bidTypeEntry.key, bidTypeEntry.value);
                });
            }
            if (bidTypeEntry && bidTypeCode && !hasOwn(mapping.campaignOverride, 'bidTypeV2') && !hasOwn(mapping.campaignOverride, 'bidType')) {
                mapping.skipped.push({
                    sourceKey: bidTypeEntry.key,
                    sourceValue: bidTypeEntry.value,
                    targetKey: 'bidTypeV2/bidType',
                    reason: '当前场景未识别到可用出价类型字段'
                });
            }

            const itemModeEntry = findSceneSettingEntry(entries, [/选品方式/, /选择推广商品/]);
            const itemModeCode = mapSceneItemSelectedModeValue(itemModeEntry?.value || '');
            if (itemModeEntry && itemModeCode) {
                applyCampaign('itemSelectedMode', itemModeCode, itemModeEntry.key, itemModeEntry.value);
            }

            const budgetEntries = [
                { patterns: [/每日预算(?!类型)/], field: 'dayBudget' },
                { patterns: [/日均预算/], field: 'dayAverageBudget' },
                { patterns: [/总预算/], field: 'totalBudget' },
                { patterns: [/冻结预算/, /未来预算/], field: 'futureBudget' }
            ];
            budgetEntries.forEach(item => {
                const entry = findSceneSettingEntry(entries, item.patterns);
                const amount = parseNumberFromSceneValue(entry?.value || '');
                if (entry && Number.isFinite(amount) && amount > 0) {
                    applyCampaign(item.field, amount, entry.key, entry.value);
                }
            });
            const genericBudgetEntry = findSceneSettingEntry(entries, [/预算值/]);
            const genericBudgetAmount = parseNumberFromSceneValue(genericBudgetEntry?.value || '');
            if (genericBudgetEntry && Number.isFinite(genericBudgetAmount) && genericBudgetAmount > 0) {
                const dmcHint = String(
                    mapping?.campaignOverride?.dmcType
                    || templateCampaign?.dmcType
                    || runtime?.dmcType
                    || DEFAULTS.dmcType
                    || 'day_average'
                ).trim();
                const budgetField = DMC_BUDGET_FIELD_MAP[dmcHint] || 'dayAverageBudget';
                applyCampaign(budgetField, genericBudgetAmount, genericBudgetEntry.key, genericBudgetEntry.value);
            }

            const singleCostEntry = findSceneSettingEntry(entries, [/平均直接成交成本/, /直接成交成本/, /单次成交成本/, /目标成交成本/]);
            if (singleCostEntry) {
                const singleCostAmount = parseNumberFromSceneValue(singleCostEntry.value || '');
                if (Number.isFinite(singleCostAmount) && singleCostAmount > 0) {
                    applyCampaign('setSingleCostV2', true, singleCostEntry.key, singleCostEntry.value);
                    applyCampaign('singleCostV2', singleCostAmount, singleCostEntry.key, singleCostEntry.value);
                } else if (/关|关闭|不启用/.test(singleCostEntry.value || '')) {
                    applyCampaign('setSingleCostV2', false, singleCostEntry.key, singleCostEntry.value);
                }
            }

            const smartCreativeEntry = findSceneSettingEntry(entries, [/创意优选/, /封面智能创意/]);
            if (smartCreativeEntry) {
                if (/关/.test(smartCreativeEntry.value) && !/开/.test(smartCreativeEntry.value)) {
                    applyCampaign('smartCreative', 0, smartCreativeEntry.key, smartCreativeEntry.value);
                } else if (/开/.test(smartCreativeEntry.value)) {
                    applyCampaign('smartCreative', 1, smartCreativeEntry.key, smartCreativeEntry.value);
                }
            }

            const creativeModeEntry = findSceneSettingEntry(entries, [/创意设置/, /设置创意/, /创意模式/]);
            const creativeModeCode = mapSceneCreativeSetModeValue(creativeModeEntry?.value || '');
            if (creativeModeEntry && creativeModeCode) {
                applyCampaign('creativeSetMode', creativeModeCode, creativeModeEntry.key, creativeModeEntry.value);
            }

            const launchTimeEntry = findSceneSettingEntry(entries, [/投放时间/, /投放日期/, /排期/]);
            if (launchTimeEntry && /(不限|长期|全天|24小时)/.test(launchTimeEntry.value)) {
                applyCampaign('launchPeriodList', buildDefaultLaunchPeriodList(), launchTimeEntry.key, launchTimeEntry.value);
            }

            const launchAreaEntry = findSceneSettingEntry(entries, [/投放地域/, /地域设置/]);
            if (launchAreaEntry) {
                if (/(全部|全国|不限|all)/i.test(launchAreaEntry.value)) {
                    applyCampaign('launchAreaStrList', ['all'], launchAreaEntry.key, launchAreaEntry.value);
                } else {
                    const list = launchAreaEntry.value
                        .split(/[,，\s]/)
                        .map(item => normalizeSceneSettingValue(item))
                        .filter(Boolean)
                        .slice(0, 80);
                    if (list.length) {
                        applyCampaign('launchAreaStrList', list, launchAreaEntry.key, launchAreaEntry.value);
                    }
                }
            }

            if (normalizedSceneName === '人群推广') {
                const strategyEntry = findSceneSettingEntry(entries, [/选择拉新方案/, /投放策略/, /方案选择/, /方案/]);
                const strategyCode = mapScenePromotionStrategyValue(normalizedSceneName, strategyEntry?.value || '', runtime);
                if (strategyEntry && strategyCode) {
                    applyCampaign('promotionStrategy', strategyCode, strategyEntry.key, strategyEntry.value);
                }
                const crowdEntry = findSceneSettingEntry(entries, [/设置拉新人群/, /人群设置/, /种子人群/]);
                if (crowdEntry) {
                    if (/(关|关闭|不启用)/.test(crowdEntry.value)) {
                        applyCampaign('needTargetCrowd', '0', crowdEntry.key, crowdEntry.value);
                        applyCampaign('aiXiaowanCrowdListSwitch', '0', crowdEntry.key, crowdEntry.value);
                    } else if (/(开|开启|启用|智能|优先)/.test(crowdEntry.value)) {
                        applyCampaign('needTargetCrowd', '1', crowdEntry.key, crowdEntry.value);
                        applyCampaign('aiXiaowanCrowdListSwitch', '1', crowdEntry.key, crowdEntry.value);
                    }
                }
            }

            entries.forEach(entry => {
                const rawKey = String(entry?.key || '').trim();
                if (!rawKey || /[\u4e00-\u9fa5]/.test(rawKey)) return;
                const directValue = parseDirectSettingValue(rawKey, entry?.value || '');
                if (directValue === '' || directValue === undefined || directValue === null) return;

                if (/^campaign\./i.test(rawKey)) {
                    const campaignKey = rawKey.replace(/^campaign\./i, '').trim();
                    if (campaignKey) applyCampaign(campaignKey, directValue, entry.key, entry.value);
                    return;
                }
                if (/^adgroup\./i.test(rawKey)) {
                    const adgroupKey = rawKey.replace(/^adgroup\./i, '').trim();
                    if (adgroupKey) applyAdgroup(adgroupKey, directValue, entry.key, entry.value);
                    return;
                }
                if (allowedCampaignKeys.has(rawKey)) {
                    applyCampaign(rawKey, directValue, entry.key, entry.value);
                    return;
                }
                if (allowedAdgroupKeys.has(rawKey)) {
                    applyAdgroup(rawKey, directValue, entry.key, entry.value);
                }
            });

            if (isPlainObject(runtime?.solutionTemplate?.adgroupList?.[0])) {
                const templateAdgroupRef = runtime.solutionTemplate.adgroupList[0];
                if (hasOwn(templateAdgroupRef, 'smartCreative')
                    && mapping.adgroupOverride.smartCreative === undefined
                    && mapping.campaignOverride.smartCreative !== undefined) {
                    applyAdgroup('smartCreative', mapping.campaignOverride.smartCreative, '创意优选', String(mapping.campaignOverride.smartCreative));
                }
            }

            return mapping;
        };

        const buildFallbackSolutionTemplate = (runtime, sceneName = '') => {
            const normalizedSceneName = String(sceneName || '').trim();
            if (normalizedSceneName && normalizedSceneName !== '关键词推广') {
                const fallbackCampaign = {
                    operation: '',
                    bizCode: runtime.bizCode,
                    promotionScene: runtime.promotionScene || '',
                    subPromotionType: runtime.subPromotionType || DEFAULTS.subPromotionType,
                    promotionType: runtime.promotionType || DEFAULTS.promotionType,
                    dmcType: runtime.dmcType || DEFAULTS.dmcType,
                    campaignName: `${normalizedSceneName}_${todayStamp()}`,
                    campaignGroupId: '',
                    campaignGroupName: '',
                    itemIdList: [],
                    crowdList: [],
                    launchAreaStrList: ['all'],
                    launchPeriodList: buildDefaultLaunchPeriodList()
                };
                if (normalizedSceneName === '人群推广') {
                    const crowdTarget = String(runtime.bidTargetV2 || runtime.optimizeTarget || SCENE_FALLBACK_BID_TARGET['人群推广'] || '').trim();
                    const crowdBidTypeV2 = normalizeBidTypeForCampaignField(
                        runtime?.storeData?.bidTypeV2 || runtime?.storeData?.bidType || runtime?.bidTypeV2 || '',
                        'bidTypeV2',
                        '人群推广'
                    ) || SCENE_BIDTYPE_V2_DEFAULT['人群推广'];
                    fallbackCampaign.itemSelectedMode = runtime.itemSelectedMode || DEFAULTS.itemSelectedMode;
                    if (crowdTarget) {
                        fallbackCampaign.bidTargetV2 = crowdTarget;
                        fallbackCampaign.optimizeTarget = crowdTarget;
                    }
                    fallbackCampaign.bidTypeV2 = crowdBidTypeV2;
                    fallbackCampaign.promotionStrategy = runtime.storeData?.promotionStrategy || 'jingdian_laxin';
                    fallbackCampaign.user_level = runtime.storeData?.user_level || 'm3';
                    fallbackCampaign.needTargetCrowd = runtime.storeData?.needTargetCrowd || '1';
                    fallbackCampaign.aiXiaowanCrowdListSwitch = runtime.storeData?.aiXiaowanCrowdListSwitch || '1';
                    fallbackCampaign.creativeSetMode = runtime.storeData?.creativeSetMode || 'professional';
                }
                return {
                    bizCode: runtime.bizCode,
                    campaign: fallbackCampaign,
                    adgroupList: [{
                        rightList: [],
                        smartCreative: 1
                    }]
                };
            }
            return {
                bizCode: runtime.bizCode,
                campaign: {
                    operation: '',
                    bizCode: runtime.bizCode,
                    promotionScene: runtime.promotionScene,
                    subPromotionType: runtime.subPromotionType,
                    promotionType: runtime.promotionType,
                    itemSelectedMode: runtime.itemSelectedMode,
                    bidTypeV2: runtime.bidTypeV2,
                    bidTargetV2: runtime.bidTargetV2,
                    campaignCycleBudgetInfo: { currentCampaignActivityCycleBudgetStatus: '0' },
                    subsidy: null,
                    itemIdList: [],
                    deleteAdgroupList: [],
                    updatedRightInfoAdgroupList: [],
                    campaignColdStartVO: { coldStartStatus: '0' },
                    subOptimizeTarget: 'retained_buy',
                    setSingleCostV2: false,
                    optimizeTarget: runtime.bidTargetV2 || 'conv',
                    dmcType: runtime.dmcType || DEFAULTS.dmcType,
                    campaignName: `关键词推广_${todayStamp()}`,
                    campaignGroupId: '',
                    campaignGroupName: '',
                    supportCouponId: '',
                    creativeSetMode: 'minimalist',
                    smartCreative: 1,
                    crowdList: [],
                    adzoneList: [],
                    launchAreaStrList: ['all'],
                    launchPeriodList: buildDefaultLaunchPeriodList(),
                    sourceChannel: 'onebp',
                    channelLocation: '',
                    selectedTargetBizCode: '',
                    dmpSolutionId: '',
                    activityId: '',
                    specialSourceForMainStep: '',
                    bpStrategyId: '',
                    bpStrategyType: ''
                },
                adgroupList: [{
                    material: {
                        materialId: '',
                        materialName: '',
                        promotionType: runtime.promotionType,
                        subPromotionType: runtime.subPromotionType,
                        fromTab: 'manual',
                        linkUrl: '',
                        goalLifeCycleList: null,
                        shopId: '',
                        shopName: '',
                        bidCount: 0,
                        categoryLevel1: ''
                    },
                    rightList: [],
                    wordList: [],
                    wordPackageList: [],
                    smartCreative: 1
                }]
            };
        };

        const resolveBudgetForCampaign = (planBudget, runtime, campaign) => {
            const budget = isPlainObject(planBudget) ? planBudget : {};
            let dmcType = String(budget.dmcType || campaign?.dmcType || runtime.dmcType || DEFAULTS.dmcType || '').trim();
            if (!dmcType) dmcType = DEFAULTS.dmcType;

            let selectedField = '';
            let selectedValue = NaN;
            for (const key of BUDGET_FIELDS) {
                if (budget[key] === undefined || budget[key] === null || budget[key] === '') continue;
                selectedField = key;
                selectedValue = toNumber(budget[key], NaN);
                break;
            }
            if (!budget.dmcType && selectedField && BUDGET_FIELD_DMC_MAP[selectedField]) {
                dmcType = BUDGET_FIELD_DMC_MAP[selectedField];
            }

            if (!selectedField && planBudget !== undefined && planBudget !== null && planBudget !== '' && !isPlainObject(planBudget)) {
                selectedField = DMC_BUDGET_FIELD_MAP[dmcType] || 'dayAverageBudget';
                selectedValue = toNumber(planBudget, NaN);
            }

            if (!selectedField) {
                const mappedField = DMC_BUDGET_FIELD_MAP[dmcType] || 'dayAverageBudget';
                if (runtime[mappedField] !== undefined && runtime[mappedField] !== null && runtime[mappedField] !== '') {
                    selectedField = mappedField;
                    selectedValue = toNumber(runtime[mappedField], NaN);
                } else if (runtime.dayAverageBudget !== undefined && runtime.dayAverageBudget !== null && runtime.dayAverageBudget !== '') {
                    selectedField = mappedField;
                    selectedValue = toNumber(runtime.dayAverageBudget, NaN);
                } else if (campaign?.[mappedField] !== undefined && campaign?.[mappedField] !== null && campaign?.[mappedField] !== '') {
                    selectedField = mappedField;
                    selectedValue = toNumber(campaign[mappedField], NaN);
                }
            }

            return {
                dmcType,
                field: selectedField,
                value: selectedValue
            };
        };

        const buildSolutionFromPlan = async ({ plan, request, runtime, requestOptions }) => {
            const sceneCapabilities = resolveSceneCapabilities({
                sceneName: request?.sceneName || '',
                runtime,
                request
            });
            const goalResolution = isPlainObject(plan?.__goalResolution)
                ? plan.__goalResolution
                : (isPlainObject(request?.__goalResolution) ? request.__goalResolution : {});
            const resolvedMarketingGoal = normalizeGoalLabel(
                plan?.marketingGoal
                || goalResolution?.resolvedMarketingGoal
                || request?.marketingGoal
                || request?.common?.marketingGoal
                || ''
            );
            const submitEndpoint = normalizeGoalCreateEndpoint(
                plan?.submitEndpoint
                || request?.submitEndpoint
                || goalResolution?.endpoint
                || ENDPOINTS.solutionAddList
            );
            const isKeywordScene = sceneCapabilities.sceneName === '关键词推广';
            const planBidMode = isKeywordScene
                ? resolvePlanBidMode({ plan, request, runtime })
                : '';
            const isKeywordManualMode = isKeywordScene && planBidMode === 'manual';
            const sceneBizCodeHint = normalizeSceneBizCode(
                sceneCapabilities.expectedSceneBizCode
                || resolveSceneBizCodeHint(sceneCapabilities.sceneName || request?.sceneName || '')
                || request?.bizCode
                || runtime?.bizCode
                || ''
            );
            const runtimeTemplateBizCode = normalizeSceneBizCode(
                runtime?.solutionTemplate?.bizCode
                || runtime?.solutionTemplate?.campaign?.bizCode
                || ''
            );
            const templateMatchesScene = !sceneBizCodeHint
                || !runtimeTemplateBizCode
                || runtimeTemplateBizCode === sceneBizCodeHint;
            const runtimeForScene = mergeDeep({}, runtime, {
                bizCode: sceneBizCodeHint || runtime?.bizCode || DEFAULTS.bizCode,
                promotionScene: resolveSceneDefaultPromotionScene(
                    sceneCapabilities.sceneName || request?.sceneName || '',
                    runtime?.promotionScene || ''
                ) || runtime?.promotionScene || '',
                solutionTemplate: templateMatchesScene ? runtime?.solutionTemplate : null
            });
            const template = runtimeForScene.solutionTemplate || buildFallbackSolutionTemplate(runtimeForScene, request?.sceneName || '');
            const item = plan?.item ? normalizeItem(plan.item) : null;
            const hasItem = !!(item?.materialId || item?.itemId);
            if (sceneCapabilities.requiresItem && !hasItem) {
                throw new Error(`场景「${sceneCapabilities.sceneName || '未命名'}」要求先选择商品`);
            }

            const campaign = purgeCreateTransientFields(sanitizeCampaign(deepClone(template.campaign || {})));
            const baseAdgroup = (Array.isArray(template.adgroupList) && template.adgroupList[0]) ? template.adgroupList[0] : {};
            const adgroup = purgeCreateTransientFields(sanitizeAdgroup(deepClone(baseAdgroup)));

            campaign.bizCode = campaign.bizCode || runtimeForScene.bizCode || DEFAULTS.bizCode;
            campaign.subPromotionType = campaign.subPromotionType || runtimeForScene.subPromotionType || DEFAULTS.subPromotionType;
            campaign.promotionType = campaign.promotionType || runtimeForScene.promotionType || DEFAULTS.promotionType;
            campaign.bidTypeV2 = isKeywordScene
                ? bidModeToBidType(planBidMode)
                : (campaign.bidTypeV2 || runtimeForScene.bidTypeV2 || '');
            if (isKeywordScene) {
                campaign.promotionScene = DEFAULTS.promotionScene;
                campaign.itemSelectedMode = DEFAULTS.itemSelectedMode;
                if (planBidMode === 'smart') {
                    campaign.bidTargetV2 = campaign.bidTargetV2 || runtimeForScene.bidTargetV2 || DEFAULTS.bidTargetV2;
                    campaign.optimizeTarget = campaign.optimizeTarget || campaign.bidTargetV2;
                } else {
                    delete campaign.bidTargetV2;
                    delete campaign.optimizeTarget;
                    campaign.setSingleCostV2 = false;
                    delete campaign.singleCostV2;
                }
            } else {
                const forcedScenePromotionScene = resolveSceneDefaultPromotionScene(
                    sceneCapabilities.sceneName || request?.sceneName || '',
                    runtimeForScene.promotionScene || ''
                );
                campaign.promotionScene = forcedScenePromotionScene || campaign.promotionScene || runtimeForScene.promotionScene || '';
                campaign.itemSelectedMode = campaign.itemSelectedMode || runtimeForScene.itemSelectedMode || '';
                campaign.bidTargetV2 = campaign.bidTargetV2 || runtimeForScene.bidTargetV2 || '';
                if (!campaign.bidTypeV2) delete campaign.bidTypeV2;
                if (!campaign.itemSelectedMode) delete campaign.itemSelectedMode;
                if (!campaign.promotionScene) delete campaign.promotionScene;
                if (!campaign.bidTargetV2) {
                    delete campaign.bidTargetV2;
                    delete campaign.optimizeTarget;
                } else if (!campaign.optimizeTarget) {
                    campaign.optimizeTarget = campaign.bidTargetV2;
                }
            }
            campaign.dmcType = campaign.dmcType || runtimeForScene.dmcType || DEFAULTS.dmcType;
            campaign.campaignName = plan.planName;
            if (hasItem && sceneCapabilities.hasItemIdList) {
                campaign.itemIdList = [toIdValue(item.materialId || item.itemId)];
            } else if (Array.isArray(campaign.itemIdList)) {
                campaign.itemIdList = [];
            } else if (!sceneCapabilities.hasItemIdList && hasOwn(campaign, 'itemIdList')) {
                delete campaign.itemIdList;
            }
            if (!isPlainObject(campaign.campaignCycleBudgetInfo)) {
                campaign.campaignCycleBudgetInfo = { currentCampaignActivityCycleBudgetStatus: '0' };
            } else if (!campaign.campaignCycleBudgetInfo.currentCampaignActivityCycleBudgetStatus) {
                campaign.campaignCycleBudgetInfo.currentCampaignActivityCycleBudgetStatus = '0';
            }

            const budgetConfig = resolveBudgetForCampaign(plan?.budget, runtimeForScene, campaign);
            campaign.dmcType = budgetConfig.dmcType || campaign.dmcType;
            if (budgetConfig.field && Number.isFinite(budgetConfig.value) && budgetConfig.value > 0) {
                BUDGET_FIELDS.forEach(field => {
                    if (field !== budgetConfig.field) delete campaign[field];
                });
                campaign[budgetConfig.field] = budgetConfig.value;
            }

            let keywordBundle = {
                wordList: [],
                wordPackageList: [],
                mode: 'none'
            };
            if (sceneCapabilities.enableKeywords) {
                if (!hasItem) {
                    throw new Error(`场景「${sceneCapabilities.sceneName || '未命名'}」启用关键词时必须提供商品`);
                }
                keywordBundle = await buildKeywordBundle({
                    plan,
                    item,
                    runtimeDefaults: runtimeForScene,
                    request,
                    requestOptions
                });
                if (isKeywordManualMode) {
                    keywordBundle.useWordPackage = false;
                    keywordBundle.wordPackageList = [];
                }
            }

            if (sceneCapabilities.hasMaterial && hasItem) {
                const materialId = toIdValue(item.materialId || item.itemId);
                const fallbackMaterialName = `商品${item.itemId || item.materialId || ''}`;
                const materialName = String(item.materialName || '').trim() || fallbackMaterialName;
                adgroup.material = pickMaterialFields(mergeDeep(adgroup.material || {}, {
                    materialId,
                    materialName,
                    promotionType: runtimeForScene.promotionType,
                    subPromotionType: runtimeForScene.subPromotionType,
                    fromTab: item.fromTab || adgroup.material?.fromTab || 'manual',
                    linkUrl: item.linkUrl || adgroup.material?.linkUrl || '',
                    shopId: item.shopId || adgroup.material?.shopId || '',
                    shopName: item.shopName || adgroup.material?.shopName || '',
                    bidCount: item.bidCount || adgroup.material?.bidCount || 0,
                    categoryLevel1: item.categoryLevel1 || adgroup.material?.categoryLevel1 || ''
                }));
            } else if (hasOwn(adgroup, 'material') && !sceneCapabilities.hasMaterial) {
                delete adgroup.material;
            }

            if (sceneCapabilities.hasWordList) {
                adgroup.wordList = keywordBundle.wordList;
            } else if (hasOwn(adgroup, 'wordList')) {
                delete adgroup.wordList;
            }

            if (sceneCapabilities.hasWordPackageList && keywordBundle.useWordPackage) {
                adgroup.wordPackageList = keywordBundle.wordPackageList;
            } else if (hasOwn(adgroup, 'wordPackageList')) {
                delete adgroup.wordPackageList;
            }

            if (sceneCapabilities.hasRightList && !Array.isArray(adgroup.rightList)) {
                adgroup.rightList = [];
            } else if (!sceneCapabilities.hasRightList && hasOwn(adgroup, 'rightList')) {
                delete adgroup.rightList;
            }

            if (!isKeywordScene
                && !hasOwn(baseAdgroup || {}, 'smartCreative')
                && hasOwn(adgroup, 'smartCreative')) {
                delete adgroup.smartCreative;
            }

            const merged = { campaign, adgroup };
            applyOverrides(merged, request, plan);
            const hasExplicitCampaignField = (key = '') => {
                const sourceValues = [
                    request?.[key],
                    request?.common?.[key],
                    request?.common?.campaignOverride?.[key],
                    request?.goalForcedCampaignOverride?.[key],
                    request?.sceneForcedCampaignOverride?.[key],
                    request?.rawOverrides?.[key],
                    request?.rawOverrides?.campaign?.[key],
                    request?.common?.rawOverrides?.campaign?.[key],
                    plan?.[key],
                    plan?.campaignOverride?.[key],
                    plan?.goalForcedCampaignOverride?.[key],
                    plan?.rawOverrides?.[key],
                    plan?.rawOverrides?.campaign?.[key]
                ];
                return sourceValues.some(value => value !== undefined && value !== null && value !== '');
            };
            if (isKeywordScene) {
                merged.campaign.promotionScene = DEFAULTS.promotionScene;
                merged.campaign.itemSelectedMode = DEFAULTS.itemSelectedMode;
            }
            if (sceneCapabilities.enableKeywords && !keywordBundle.useWordPackage) {
                merged.campaign = stripWordPackageArtifacts(merged.campaign);
                merged.adgroup = stripWordPackageArtifacts(merged.adgroup);
                if (isKeywordScene) {
                    merged.campaign = stripKeywordTrafficArtifacts(merged.campaign);
                    merged.adgroup = stripKeywordTrafficArtifacts(merged.adgroup);
                    merged.campaign.promotionScene = DEFAULTS.promotionScene;
                    merged.campaign.itemSelectedMode = DEFAULTS.itemSelectedMode;
                }
            }
            if (isKeywordScene) {
                merged.campaign = pruneKeywordCampaignForCustomScene(merged.campaign, {
                    request,
                    bidMode: planBidMode
                });
                merged.adgroup = pruneKeywordAdgroupForCustomScene(merged.adgroup, hasItem ? item : null);
            } else {
                const expectedSceneBizCode = normalizeSceneBizCode(sceneCapabilities.expectedSceneBizCode || sceneBizCodeHint || request?.bizCode || '');
                const templateBizCode = normalizeSceneBizCode(runtimeForScene?.solutionTemplate?.bizCode || runtimeForScene?.solutionTemplate?.campaign?.bizCode || '');
                const hasRuntimeTemplateCampaign = isPlainObject(runtimeForScene?.solutionTemplate?.campaign)
                    && Object.keys(runtimeForScene.solutionTemplate.campaign).length > 0
                    && (!expectedSceneBizCode || (templateBizCode && templateBizCode === expectedSceneBizCode));
                const runtimeTemplateCampaign = hasRuntimeTemplateCampaign
                    ? (runtimeForScene.solutionTemplate.campaign || {})
                    : {};
                const explicitBidTypeV2 = hasExplicitCampaignField('bidTypeV2');
                const explicitBidType = hasExplicitCampaignField('bidType');
                const explicitOptimizeTarget = hasExplicitCampaignField('optimizeTarget');
                const scenePrefersBidTypeV2 = SCENE_BIDTYPE_V2_ONLY.has(sceneCapabilities.sceneName);
                const supportsTemplateBidTypeV2 = hasOwn(runtimeTemplateCampaign, 'bidTypeV2');
                const shouldKeepBidTypeV2 = scenePrefersBidTypeV2 || supportsTemplateBidTypeV2;
                if (!explicitBidTypeV2 && !shouldKeepBidTypeV2) {
                    delete merged.campaign.bidTypeV2;
                }
                if ((!explicitBidType && !hasRuntimeTemplateCampaign) || scenePrefersBidTypeV2) {
                    delete merged.campaign.bidType;
                }

                const supportsBidTargetFields = sceneCapabilities.sceneName === '人群推广'
                    || hasRuntimeTemplateCampaign && (
                        hasOwn(runtimeForScene.solutionTemplate.campaign || {}, 'bidTargetV2')
                        || hasOwn(runtimeForScene.solutionTemplate.campaign || {}, 'optimizeTarget')
                    );
                const fallbackBidTarget = SCENE_FALLBACK_BID_TARGET[sceneCapabilities.sceneName] || '';
                let bidTarget = String(merged.campaign.bidTargetV2 || '').trim();
                if ((!bidTarget || bidTarget === DEFAULTS.bidTargetV2) && fallbackBidTarget) {
                    bidTarget = fallbackBidTarget;
                }
                const keepOptimizeTarget = sceneCapabilities.sceneName === '内容营销'
                    || sceneCapabilities.sceneName === '线索推广';
                if (!supportsBidTargetFields || !bidTarget) {
                    delete merged.campaign.bidTargetV2;
                    if (!keepOptimizeTarget) {
                        delete merged.campaign.optimizeTarget;
                    }
                } else {
                    merged.campaign.bidTargetV2 = bidTarget;
                    const optimizeTarget = String(merged.campaign.optimizeTarget || '').trim();
                    const shouldSyncOptimizeTarget = sceneCapabilities.sceneName === '人群推广'
                        || !optimizeTarget
                        || optimizeTarget === DEFAULTS.bidTargetV2
                        || (!explicitOptimizeTarget && !hasRuntimeTemplateCampaign);
                    if (shouldSyncOptimizeTarget) {
                        merged.campaign.optimizeTarget = bidTarget;
                    }
                }

                if (sceneCapabilities.sceneName === '人群推广') {
                    if (!merged.campaign.promotionScene || /promotion_scene_search_/i.test(String(merged.campaign.promotionScene || ''))) {
                        merged.campaign.promotionScene = resolveSceneDefaultPromotionScene('人群推广', runtimeForScene?.storeData?.promotionScene || 'promotion_scene_display_laxin');
                    }
                    const runtimeCrowdBidTypeV2 = normalizeBidTypeForCampaignField(
                        runtimeForScene?.storeData?.bidTypeV2 || runtimeForScene?.storeData?.bidType || runtimeForScene?.bidTypeV2 || '',
                        'bidTypeV2',
                        '人群推广'
                    );
                    const mergedCrowdBidTypeV2 = normalizeBidTypeForCampaignField(
                        merged.campaign.bidTypeV2 || merged.campaign.bidType || '',
                        'bidTypeV2',
                        '人群推广'
                    );
                    merged.campaign.bidTypeV2 = mergedCrowdBidTypeV2 || runtimeCrowdBidTypeV2 || SCENE_BIDTYPE_V2_DEFAULT['人群推广'];
                    delete merged.campaign.bidType;
                    if (!merged.campaign.itemSelectedMode) {
                        merged.campaign.itemSelectedMode = runtimeForScene.itemSelectedMode || DEFAULTS.itemSelectedMode;
                    }
                    if (!merged.campaign.promotionStrategy) {
                        merged.campaign.promotionStrategy = runtimeForScene?.storeData?.promotionStrategy || 'jingdian_laxin';
                    }
                    if (!merged.campaign.user_level) {
                        merged.campaign.user_level = runtimeForScene?.storeData?.user_level || 'm3';
                    }
                    if (merged.campaign.needTargetCrowd === undefined || merged.campaign.needTargetCrowd === null || merged.campaign.needTargetCrowd === '') {
                        merged.campaign.needTargetCrowd = runtimeForScene?.storeData?.needTargetCrowd || '1';
                    }
                    if (merged.campaign.aiXiaowanCrowdListSwitch === undefined || merged.campaign.aiXiaowanCrowdListSwitch === null || merged.campaign.aiXiaowanCrowdListSwitch === '') {
                        merged.campaign.aiXiaowanCrowdListSwitch = runtimeForScene?.storeData?.aiXiaowanCrowdListSwitch || '1';
                    }
                    if (!merged.campaign.creativeSetMode) {
                        merged.campaign.creativeSetMode = runtimeForScene?.storeData?.creativeSetMode || 'professional';
                    }
                }

                if (sceneCapabilities.sceneName === '货品全站推广') {
                    merged.campaign.promotionScene = merged.campaign.promotionScene || runtimeForScene?.storeData?.promotionScene || 'promotion_scene_site';
                    merged.campaign.itemSelectedMode = merged.campaign.itemSelectedMode || runtimeForScene?.storeData?.itemSelectedMode || 'user_define';
                    merged.campaign.bidType = merged.campaign.bidType || runtimeForScene?.storeData?.bidType || 'roi_control';
                    merged.campaign.optimizeTarget = merged.campaign.optimizeTarget || runtimeForScene?.storeData?.optimizeTarget || 'ad_strategy_retained_buy';
                    merged.campaign.constraintType = merged.campaign.constraintType || runtimeForScene?.storeData?.constraintType || 'roi';
                    if (merged.campaign.constraintValue === undefined || merged.campaign.constraintValue === null || merged.campaign.constraintValue === '') {
                        merged.campaign.constraintValue = toNumber(runtimeForScene?.storeData?.constraintValue, 5.0);
                    }
                    if (!isPlainObject(merged.campaign.multiTarget)) {
                        merged.campaign.multiTarget = { multiTargetSwitch: '0' };
                    } else if (!merged.campaign.multiTarget.multiTargetSwitch) {
                        merged.campaign.multiTarget.multiTargetSwitch = '0';
                    }
                    if (!hasOwn(merged.campaign, 'campaignId')) {
                        merged.campaign.campaignId = '';
                    }
                    if (!merged.campaign.sourceChannel) {
                        merged.campaign.sourceChannel = 'onebp';
                    }
                    delete merged.campaign.bidTargetV2;
                    delete merged.campaign.wordList;
                    delete merged.campaign.wordPackageList;
                    const safeSiteCampaignName = String(merged.campaign.campaignName || '').trim();
                    if (!/^[A-Za-z0-9]{2,64}$/.test(safeSiteCampaignName)) {
                        merged.campaign.campaignName = `site${nowStampSeconds()}`;
                    }
                    const adgroupName = String(
                        merged.adgroup?.adgroupName
                        || merged.adgroup?.material?.materialName
                        || merged.campaign.campaignName
                        || plan.planName
                        || ''
                    ).trim();
                    if (adgroupName) {
                        merged.adgroup.adgroupName = /单元$/.test(adgroupName) ? adgroupName : `${adgroupName}_单元`;
                    }
                }
                if (sceneCapabilities.sceneName === '店铺直达') {
                    delete merged.campaign.bidTypeV2;
                    delete merged.campaign.bidTargetV2;
                    delete merged.campaign.optimizeTarget;
                    if (!merged.campaign.promotionModel) {
                        merged.campaign.promotionModel = runtimeForScene?.storeData?.promotionModel || 'daily';
                    }
                }
                if (sceneCapabilities.sceneName === '内容营销') {
                    delete merged.campaign.bidTypeV2;
                    if (!merged.campaign.promotionScene) {
                        merged.campaign.promotionScene = resolveSceneDefaultPromotionScene('内容营销', runtimeForScene?.storeData?.promotionScene || 'scene_live_room');
                    }
                    if (!merged.campaign.bidType) {
                        merged.campaign.bidType = runtimeForScene?.storeData?.bidType || 'bcb';
                    }
                    if (!merged.campaign.optimizeTarget) {
                        merged.campaign.optimizeTarget = runtimeForScene?.storeData?.optimizeTarget || 'ad_strategy_buy_net';
                    }
                    if (!merged.campaign.itemSelectedMode) {
                        merged.campaign.itemSelectedMode = runtimeForScene?.storeData?.itemSelectedMode || 'user_define';
                    }
                    if (!merged.campaign.promotionModel) {
                        merged.campaign.promotionModel = runtimeForScene?.storeData?.promotionModel || 'daily';
                    }
                    if (!Array.isArray(merged.campaign.launchPeriodList) || !merged.campaign.launchPeriodList.length) {
                        merged.campaign.launchPeriodList = buildDefaultLaunchPeriodList();
                    }
                    if (!Array.isArray(merged.campaign.launchAreaStrList) || !merged.campaign.launchAreaStrList.length) {
                        merged.campaign.launchAreaStrList = ['all'];
                    }
                    if (!isPlainObject(merged.campaign.launchTime)) {
                        merged.campaign.launchTime = buildDefaultLaunchTime({ forever: true });
                    }
                }
                if (sceneCapabilities.sceneName === '线索推广') {
                    delete merged.campaign.bidTypeV2;
                    merged.campaign.dmcType = 'total';
                    if (!merged.campaign.promotionScene) {
                        merged.campaign.promotionScene = resolveSceneDefaultPromotionScene('线索推广', runtimeForScene?.storeData?.promotionScene || 'leads_collection');
                    }
                    if (!merged.campaign.bidType) {
                        merged.campaign.bidType = runtimeForScene?.storeData?.bidType || 'max_amount';
                    }
                    if (!merged.campaign.promotionModel) {
                        merged.campaign.promotionModel = runtimeForScene?.storeData?.promotionModel
                            || 'order';
                    }
                    if (!merged.campaign.promotionModelMarketing) {
                        merged.campaign.promotionModelMarketing = runtimeForScene?.storeData?.promotionModelMarketing
                            || 'strategy';
                    }
                    if (!merged.campaign.orderChargeType) {
                        merged.campaign.orderChargeType = runtimeForScene?.storeData?.orderChargeType
                            || 'balance_charge';
                    }
                    if (!merged.campaign.itemSelectedMode) {
                        merged.campaign.itemSelectedMode = runtimeForScene?.storeData?.itemSelectedMode
                            || 'user_define';
                    }
                    if (!merged.campaign.optimizeTarget) {
                        merged.campaign.optimizeTarget = runtimeForScene?.storeData?.optimizeTarget
                            || 'leads_cost';
                    }
                    if (!Array.isArray(merged.campaign.launchPeriodList) || !merged.campaign.launchPeriodList.length) {
                        merged.campaign.launchPeriodList = buildDefaultLaunchPeriodList();
                    }
                    if (!Array.isArray(merged.campaign.launchAreaStrList) || !merged.campaign.launchAreaStrList.length) {
                        merged.campaign.launchAreaStrList = ['all'];
                    }
                    if (!isPlainObject(merged.campaign.launchTime)) {
                        merged.campaign.launchTime = buildDefaultLaunchTime({ days: 7, forever: false });
                    }
                    if (merged.campaign.planId === undefined || merged.campaign.planId === null || merged.campaign.planId === '') {
                        merged.campaign.planId = runtimeForScene?.storeData?.planId || 308;
                    }
                    if (merged.campaign.planTemplateId === undefined || merged.campaign.planTemplateId === null || merged.campaign.planTemplateId === '') {
                        merged.campaign.planTemplateId = runtimeForScene?.storeData?.planTemplateId || merged.campaign.planId || 308;
                    }
                    if (merged.campaign.packageTemplateId === undefined || merged.campaign.packageTemplateId === null || merged.campaign.packageTemplateId === '') {
                        merged.campaign.packageTemplateId = runtimeForScene?.storeData?.packageTemplateId || 74;
                    }
                    const orderAmountBase = Math.max(1500, toNumber(
                        merged.campaign.orderAmount
                        || merged.campaign.totalBudget
                        || merged.campaign.dayBudget
                        || merged.campaign.dayAverageBudget
                        || 3000,
                        3000
                    ));
                    merged.campaign.orderAmount = orderAmountBase;
                    merged.campaign.totalBudget = Math.max(1500, toNumber(merged.campaign.totalBudget, orderAmountBase));
                    delete merged.campaign.dayBudget;
                    delete merged.campaign.dayAverageBudget;
                    delete merged.campaign.futureBudget;
                    if (!isPlainObject(merged.campaign.orderInfo)) {
                        merged.campaign.orderInfo = {};
                    }
                    merged.campaign.orderInfo.orderAmount = Math.max(1500, toNumber(merged.campaign.orderInfo.orderAmount, orderAmountBase));
                    merged.campaign.orderInfo.planId = merged.campaign.orderInfo.planId || merged.campaign.planId;
                    merged.campaign.orderInfo.planTemplateId = merged.campaign.orderInfo.planTemplateId || merged.campaign.planTemplateId;
                    merged.campaign.orderInfo.packageTemplateId = merged.campaign.orderInfo.packageTemplateId || merged.campaign.packageTemplateId;
                    merged.campaign.orderInfo.launchTimeType = merged.campaign.orderInfo.launchTimeType || 'adjustable';
                    merged.campaign.orderInfo.isCustom = merged.campaign.orderInfo.isCustom !== undefined
                        ? merged.campaign.orderInfo.isCustom
                        : true;
                    merged.campaign.orderInfo.name = merged.campaign.orderInfo.name || '自定义方案包';
                    merged.campaign.orderInfo.planName = merged.campaign.orderInfo.planName || '自定义方案包';
                    merged.campaign.orderInfo.minBudget = Math.max(1500, toNumber(merged.campaign.orderInfo.minBudget, 1500));
                    merged.campaign.orderInfo.maxBudget = Math.max(merged.campaign.orderInfo.minBudget, toNumber(merged.campaign.orderInfo.maxBudget, 1000000));
                    merged.campaign.orderInfo.predictCycle = Math.max(1, toNumber(merged.campaign.orderInfo.predictCycle, 7));
                    merged.campaign.orderInfo.dmcPeriod = Math.max(1, toNumber(merged.campaign.orderInfo.dmcPeriod, 7));
                    merged.campaign.orderInfo.supportRefund = merged.campaign.orderInfo.supportRefund !== undefined
                        ? merged.campaign.orderInfo.supportRefund
                        : true;
                    merged.campaign.orderInfo.supportRenewal = merged.campaign.orderInfo.supportRenewal !== undefined
                        ? merged.campaign.orderInfo.supportRenewal
                        : true;
                }

                // 非关键词场景按当前模板剔除可选字段，避免把上一个场景字段串到当前场景。
                if (hasRuntimeTemplateCampaign) {
                    const templateCampaign = runtimeForScene.solutionTemplate.campaign || {};
                    const optionalKeys = [
                        'bidTypeV2',
                        'adzoneList',
                        'launchAreaStrList',
                        'launchPeriodList',
                        'crowdList',
                        'itemIdList',
                        'promotionStrategy',
                        'needTargetCrowd',
                        'aiXiaowanCrowdListSwitch',
                        'creativeSetMode',
                        'user_level',
                        'orderChargeType'
                    ];
                    optionalKeys.forEach(key => {
                        if (hasOwn(templateCampaign, key)) return;
                        if (hasExplicitCampaignField(key)) return;
                        if (sceneCapabilities.sceneName === '人群推广' && key === 'bidTypeV2') return;
                        if ((sceneCapabilities.sceneName === '内容营销' || sceneCapabilities.sceneName === '线索推广')
                            && (key === 'launchPeriodList' || key === 'launchAreaStrList')) return;
                        delete merged.campaign[key];
                    });
                } else if (sceneCapabilities.sceneName !== '人群推广') {
                    // 无可用模板时，保守移除高频报错字段。
                    delete merged.campaign.bidTypeV2;
                    delete merged.campaign.adzoneList;
                    delete merged.campaign.crowdList;
                    if (sceneCapabilities.sceneName !== '内容营销' && sceneCapabilities.sceneName !== '线索推广') {
                        delete merged.campaign.launchAreaStrList;
                        delete merged.campaign.launchPeriodList;
                    }
                }
            }

            return {
                solution: {
                    bizCode: runtimeForScene.bizCode,
                    campaign: merged.campaign,
                    adgroupList: [merged.adgroup]
                },
                meta: {
                    planName: plan.planName,
                    item: hasItem ? item : null,
                    marketingGoal: resolvedMarketingGoal,
                    goalFallbackUsed: !!goalResolution?.goalFallbackUsed,
                    goalWarnings: Array.isArray(goalResolution?.goalWarnings) ? goalResolution.goalWarnings.slice(0, 20) : [],
                    submitEndpoint,
                    keywordCount: keywordBundle.wordList.length,
                    wordPackageCount: keywordBundle.wordPackageList.length,
                    mode: keywordBundle.mode,
                    bidMode: isKeywordScene ? planBidMode : '',
                    bidTypeV2: merged?.campaign?.bidTypeV2 || merged?.campaign?.bidType || '',
                    bidTargetV2: merged?.campaign?.bidTargetV2 || '',
                    isKeywordScene,
                    fallbackTriggered: false
                }
            };
        };

        const emitProgress = (options, event, payload = {}) => {
            if (typeof options?.onProgress !== 'function') return;
            try {
                options.onProgress({ event, ...payload });
            } catch { }
        };

        const summarizeServerErrors = (res = {}) => {
            const detailList = Array.isArray(res?.data?.errorDetails) ? res.data.errorDetails : [];
            if (detailList.length) {
                return detailList
                    .map(detail => `${detail?.code || 'ERROR'}：${detail?.msg || '未知错误'}`)
                    .join('；');
            }
            return res?.info?.message || res?.message || '';
        };

        const parseAddListOutcome = (res, entries = []) => {
            const createdList = Array.isArray(res?.data?.list) ? res.data.list : [];
            const globalError = summarizeServerErrors(res);
            const successes = [];
            const failures = [];
            const failedEntries = [];

            entries.forEach((entry, idx) => {
                const created = createdList[idx] || {};
                const campaignId = created?.campaignId || null;
                if (campaignId) {
                    successes.push({
                        planName: entry.meta.planName,
                        item: entry.meta.item,
                        campaignId,
                        adgroupIdList: created.adgroupIdList || [],
                        marketingGoal: entry?.meta?.marketingGoal || '',
                        submitEndpoint: entry?.meta?.submitEndpoint || '',
                        keywordCount: entry.meta.keywordCount,
                        wordPackageCount: entry.meta.wordPackageCount,
                        mode: entry.meta.mode,
                        bidMode: entry.meta.bidMode || ''
                    });
                    return;
                }

                const error = created?.errorMsg || globalError || '服务端未返回 campaignId';
                failures.push({
                    planName: entry.meta.planName,
                    item: entry.meta.item,
                    error,
                    response: created
                });
                failedEntries.push({
                    ...entry,
                    lastError: error,
                    meta: {
                        ...(entry.meta || {}),
                        lastError: error
                    }
                });
            });

            return { successes, failures, failedEntries };
        };

        const validate = (request, options = {}) => {
            const result = { ok: true, errors: [], warnings: [] };
            if (!isPlainObject(request)) {
                result.ok = false;
                result.errors.push('请求体必须是对象');
                return result;
            }
            const sceneName = String(request?.sceneName || '').trim();
            const requiresItem = (options?.requiresItem === true || options?.requiresItem === false)
                ? !!options.requiresItem
                : isSceneLikelyRequireItem(sceneName);
            if (request.plans !== undefined && !Array.isArray(request.plans)) {
                result.ok = false;
                result.errors.push('plans 必须是数组');
            }
            if (Array.isArray(request.plans) && request.plans.length > 0) {
                request.plans.forEach((plan, idx) => {
                    if (!plan || typeof plan !== 'object') {
                        result.ok = false;
                        result.errors.push(`plans[${idx}] 非法`);
                        return;
                    }
                    if (!plan.planName) {
                        result.warnings.push(`plans[${idx}] 未提供 planName，将自动生成`);
                    }
                    if (!plan.item && !plan.itemId) {
                        if (requiresItem) {
                            result.warnings.push(`plans[${idx}] 未提供 item，将尝试从页面已添加商品补齐`);
                        }
                    }
                });
            } else {
                if (requiresItem) {
                    result.warnings.push('未显式提供 plans，将尝试读取当前已添加商品自动生成计划');
                } else {
                    result.warnings.push('未显式提供 plans，将按场景自动生成计划（默认 1 个，可通过 planCount 指定）');
                }
            }
            return result;
        };

        const normalizeSceneSettingsObject = (sceneSettings = {}) => {
            if (!isPlainObject(sceneSettings)) return {};
            const out = {};
            Object.keys(sceneSettings).forEach(key => {
                const normalizedKey = normalizeText(key).replace(/[：:]/g, '').trim();
                if (!normalizedKey) return;
                out[normalizedKey] = normalizeSceneSettingValue(sceneSettings[key]);
            });
            return out;
        };

        const mergeSceneSettingsDefaults = ({
            sceneName = '',
            targetSettings = {},
            spec = null,
            runtime = {}
        }) => {
            const filledDefaults = [];
            const warnings = [];
            const merged = normalizeSceneSettingsObject(targetSettings);
            const applyDefault = (key, value, source) => {
                const normalizedKey = normalizeText(key).replace(/[：:]/g, '').trim();
                const normalizedValue = normalizeSceneSettingValue(value);
                if (!normalizedKey || !normalizedValue) return;
                if (/^计划名称$|^计划名$/.test(normalizedKey)) return;
                if (normalizeSceneSettingValue(merged[normalizedKey]) !== '') return;
                merged[normalizedKey] = normalizedValue;
                filledDefaults.push({
                    key: normalizedKey,
                    value: normalizedValue,
                    source
                });
            };

            const specFields = Array.isArray(spec?.fields) ? spec.fields : [];
            specFields.forEach(field => {
                const settingKey = normalizeText(field?.settingKey || field?.label || '').replace(/[：:]/g, '').trim();
                if (!settingKey) return;
                const defaultValue = normalizeSceneSettingValue(field?.defaultValue || '');
                if (defaultValue) applyDefault(settingKey, defaultValue, 'scene_spec');
            });

            const templateDefaults = deriveTemplateSceneSettings(runtime);
            Object.keys(templateDefaults).forEach(key => {
                applyDefault(key, templateDefaults[key], 'runtime_template');
            });

            const fallbackDefaults = isPlainObject(SCENE_SPEC_FIELD_FALLBACK[sceneName]) ? SCENE_SPEC_FIELD_FALLBACK[sceneName] : {};
            Object.keys(fallbackDefaults).forEach(key => {
                applyDefault(key, fallbackDefaults[key], 'scene_fallback');
            });

            const missingCritical = specFields
                .filter(field => field?.requiredGuess)
                .map(field => normalizeText(field?.settingKey || field?.label || '').replace(/[：:]/g, '').trim())
                .filter(Boolean)
                .filter(key => normalizeSceneSettingValue(merged[key]) === '');
            if (missingCritical.length) {
                warnings.push(`场景「${sceneName || '未命名'}」仍缺少关键字段：${missingCritical.slice(0, 12).join('，')}`);
            }

            return {
                sceneSettings: merged,
                filledDefaults,
                warnings,
                missingCritical
            };
        };

        const validateSceneRequest = async (sceneName, request = {}, options = {}) => {
            const targetScene = String(sceneName || request?.sceneName || inferCurrentSceneName() || '').trim();
            if (!targetScene) {
                return {
                    ok: false,
                    sceneName: '',
                    normalizedRequest: mergeDeep({}, request),
                    resolvedMarketingGoal: '',
                    goalFallbackUsed: false,
                    goalWarnings: [],
                    filledDefaults: [],
                    warnings: ['缺少 sceneName，无法做场景级校验'],
                    missingCritical: ['sceneName']
                };
            }

            let runtime = null;
            try {
                runtime = await getRuntimeDefaults(!!options.forceRuntimeRefresh);
            } catch {
                runtime = {};
            }

            const sceneSpec = await getSceneSpec(targetScene, {
                scanMode: options.scanMode || 'visible',
                unlockPolicy: options.unlockPolicy || 'safe_only',
                goalScan: options.goalScan !== false,
                refresh: !!options.refresh
            });

            const normalizedRequest = mergeDeep({}, request, {
                sceneName: targetScene
            });
            const currentSettings = normalizeSceneSettingsObject(normalizedRequest.sceneSettings || {});
            const defaultsResult = mergeSceneSettingsDefaults({
                sceneName: targetScene,
                targetSettings: currentSettings,
                spec: sceneSpec,
                runtime
            });
            normalizedRequest.sceneSettings = defaultsResult.sceneSettings;

            const sceneBizCode = resolveSceneBizCodeHint(targetScene) || SCENE_BIZCODE_HINT_FALLBACK[targetScene] || '';
            if (!normalizedRequest.bizCode && sceneBizCode) {
                normalizedRequest.bizCode = sceneBizCode;
            }
            const scenePromotionScene = resolveSceneDefaultPromotionScene(targetScene, normalizedRequest.promotionScene || runtime?.promotionScene || '');
            if (!normalizedRequest.promotionScene && scenePromotionScene) {
                normalizedRequest.promotionScene = scenePromotionScene;
            }

            const goalResolution = resolveGoalContextForPlan({
                sceneName: targetScene,
                sceneSpec,
                runtime,
                marketingGoal: normalizedRequest.marketingGoal || normalizedRequest?.common?.marketingGoal || '',
                planName: '',
                planIndex: -1
            });
            if (!isPlainObject(normalizedRequest.common)) {
                normalizedRequest.common = {};
            }
            if (goalResolution.resolvedMarketingGoal) {
                normalizedRequest.marketingGoal = goalResolution.resolvedMarketingGoal;
                if (!normalizedRequest.common.marketingGoal) {
                    normalizedRequest.common.marketingGoal = goalResolution.resolvedMarketingGoal;
                }
            }
            if (goalResolution.endpoint) {
                normalizedRequest.submitEndpoint = normalizeGoalCreateEndpoint(
                    normalizedRequest.submitEndpoint || goalResolution.endpoint
                );
            }
            if (!isPlainObject(normalizedRequest.goalForcedCampaignOverride)) {
                normalizedRequest.goalForcedCampaignOverride = {};
            }
            if (!isPlainObject(normalizedRequest.goalForcedAdgroupOverride)) {
                normalizedRequest.goalForcedAdgroupOverride = {};
            }
            normalizedRequest.goalForcedCampaignOverride = mergeDeep(
                {},
                goalResolution.campaignOverride || {},
                normalizedRequest.goalForcedCampaignOverride || {}
            );
            normalizedRequest.goalForcedAdgroupOverride = mergeDeep(
                {},
                goalResolution.adgroupOverride || {},
                normalizedRequest.goalForcedAdgroupOverride || {}
            );

            const runtimePatch = goalResolution.runtimePatch || {};
            if (!normalizedRequest.bizCode && runtimePatch.bizCode) {
                normalizedRequest.bizCode = runtimePatch.bizCode;
            }
            if (!normalizedRequest.promotionScene && runtimePatch.promotionScene) {
                normalizedRequest.promotionScene = runtimePatch.promotionScene;
            }
            normalizedRequest.__sceneSpec = sceneSpec && sceneSpec.ok ? deepClone(sceneSpec) : null;
            normalizedRequest.__goalResolution = {
                resolvedMarketingGoal: goalResolution.resolvedMarketingGoal || '',
                goalFallbackUsed: !!goalResolution.goalFallbackUsed,
                goalWarnings: goalResolution.goalWarnings || [],
                availableGoals: goalResolution.availableGoalLabels || [],
                goalSpec: goalResolution.goalSpec ? deepClone(goalResolution.goalSpec) : null,
                endpoint: goalResolution.endpoint || '',
                contractHints: isPlainObject(goalResolution.contractHints) ? deepClone(goalResolution.contractHints) : {}
            };

            const passthroughWarnings = [];
            if (isPlainObject(normalizedRequest.rawOverrides)) {
                const knownCampaignKeys = new Set(Object.keys(runtime?.solutionTemplate?.campaign || {}));
                const rawCampaign = isPlainObject(normalizedRequest.rawOverrides.campaign)
                    ? normalizedRequest.rawOverrides.campaign
                    : normalizedRequest.rawOverrides;
                Object.keys(rawCampaign || {}).forEach(key => {
                    if (!knownCampaignKeys.size || knownCampaignKeys.has(key)) return;
                    passthroughWarnings.push(`rawOverrides.campaign.${key} 非模板字段，按透传提交`);
                });
            }

            return {
                ok: true,
                sceneName: targetScene,
                normalizedRequest,
                filledDefaults: defaultsResult.filledDefaults,
                resolvedMarketingGoal: goalResolution.resolvedMarketingGoal || '',
                goalFallbackUsed: !!goalResolution.goalFallbackUsed,
                goalWarnings: goalResolution.goalWarnings || [],
                warnings: defaultsResult.warnings.concat(goalResolution.goalWarnings || [], passthroughWarnings),
                missingCritical: defaultsResult.missingCritical,
                sceneSpecMeta: {
                    ok: !!sceneSpec?.ok,
                    sceneName: sceneSpec?.sceneName || targetScene,
                    fieldCount: sceneSpec?.coverage?.fieldCount || 0,
                    goalCount: sceneSpec?.coverage?.goalCount || sceneSpec?.goalCoverage?.goalCount || 0,
                    snapshotCount: sceneSpec?.coverage?.snapshotCount || 0,
                    scanMode: sceneSpec?.scanMode || options.scanMode || 'visible'
                },
                sceneSpec: sceneSpec?.ok ? deepClone(sceneSpec) : null
            };
        };

        const createPlansBatch = async (request = {}, options = {}) => {
            const validation = validate(request, {
                requiresItem: isSceneLikelyRequireItem(String(request?.sceneName || '').trim())
            });
            if (!validation.ok) {
                return { ok: false, partial: false, validation, successCount: 0, failCount: 0, successes: [], failures: [] };
            }

            const mergedRequest = mergeDeep({}, request);
            const fallbackPolicy = normalizeFallbackPolicy(
                options?.fallbackPolicy || mergedRequest?.fallbackPolicy || 'confirm',
                'confirm'
            );
            mergedRequest.fallbackPolicy = fallbackPolicy;
            if (!isPlainObject(mergedRequest.common)) {
                mergedRequest.common = {};
            }
            if (!isPlainObject(mergedRequest.sceneSettings)) {
                mergedRequest.sceneSettings = {};
            }
            const settingEntriesForGoal = normalizeSceneSettingEntries(mergedRequest.sceneSettings);
            const settingGoalEntry = findSceneSettingEntry(settingEntriesForGoal, [/营销目标/, /优化目标/]);
            const settingGoalLabel = normalizeGoalLabel(settingGoalEntry?.value || '');
            if (settingGoalLabel) {
                if (!normalizeGoalLabel(mergedRequest.marketingGoal || '')) {
                    mergedRequest.marketingGoal = settingGoalLabel;
                }
                if (!normalizeGoalLabel(mergedRequest?.common?.marketingGoal || '')) {
                    mergedRequest.common.marketingGoal = settingGoalLabel;
                }
            }
            mergedRequest.common.bidMode = normalizeBidMode(
                mergedRequest?.common?.bidMode
                    || mergedRequest?.bidMode
                    || mergedRequest?.bidTypeV2
                    || DEFAULTS.bidTypeV2,
                'smart'
            );
            const requestedSceneName = String(mergedRequest.sceneName || '').trim();
            const expectedSceneBizCode = normalizeSceneBizCode(resolveSceneBizCodeHint(requestedSceneName));
            if (!mergedRequest.bizCode && expectedSceneBizCode) {
                mergedRequest.bizCode = expectedSceneBizCode;
            } else if (mergedRequest.bizCode) {
                mergedRequest.bizCode = normalizeSceneBizCode(mergedRequest.bizCode);
            }

            let runtime = await getRuntimeDefaults(!!options.forceRuntimeRefresh);
            const requireTemplateForScene = options.requireSceneTemplate === true
                && requestedSceneName
                && requestedSceneName !== '关键词推广';
            const isRuntimeTemplateReadyForScene = (runtimeRef = {}) => {
                if (!requireTemplateForScene) return true;
                const hasTemplateCampaign = isPlainObject(runtimeRef?.solutionTemplate?.campaign)
                    && Object.keys(runtimeRef.solutionTemplate.campaign).length > 0;
                if (!hasTemplateCampaign) return false;
                const templateBizCode = normalizeSceneBizCode(runtimeRef?.solutionTemplate?.bizCode || '');
                if (!expectedSceneBizCode || !templateBizCode) return true;
                return templateBizCode === expectedSceneBizCode;
            };
            const isSceneRuntimeReady = (runtimeRef = {}) => (
                isRuntimeBizCodeMatched(runtimeRef, expectedSceneBizCode, {
                    includeRoute: !requireTemplateForScene
                })
                && isRuntimeTemplateReadyForScene(runtimeRef)
            );
            const shouldSyncSceneRuntime = options.syncSceneRuntime !== false;
            if (shouldSyncSceneRuntime
                && requestedSceneName
                && expectedSceneBizCode
                && !isSceneRuntimeReady(runtime)) {
                emitProgress(options, 'scene_runtime_sync_start', {
                    sceneName: requestedSceneName,
                    currentBizCode: resolveRuntimeBizCode(runtime) || '',
                    expectedBizCode: expectedSceneBizCode
                });
                try {
                    const syncOptions = options.sceneSyncOptions || {};
                    const sceneSyncRetry = Math.max(3, toNumber(
                        syncOptions.retry,
                        toNumber(options.sceneSyncRetry, 8)
                    ));
                    const sceneSyncIntervalMs = Math.max(240, toNumber(
                        syncOptions.retryIntervalMs,
                        toNumber(options.sceneSyncIntervalMs, 420)
                    ));
                    await ensureSceneRoute(requestedSceneName, syncOptions);
                    await waitForDomStable(syncOptions);
                    let syncedRuntime = null;
                    for (let attempt = 0; attempt < sceneSyncRetry; attempt++) {
                        syncedRuntime = await getRuntimeDefaults(true);
                        if (!expectedSceneBizCode || isSceneRuntimeReady(syncedRuntime)) break;
                        await sleep(sceneSyncIntervalMs);
                    }
                    runtime = syncedRuntime || runtime;
                    const syncedBizCode = resolveRuntimeBizCode(runtime) || '';
                    emitProgress(options, 'scene_runtime_synced', {
                        sceneName: requestedSceneName,
                        currentBizCode: syncedBizCode,
                        expectedBizCode: expectedSceneBizCode,
                        matched: isSceneRuntimeReady(runtime),
                        templateReady: isRuntimeTemplateReadyForScene(runtime),
                        templateBizCode: normalizeSceneBizCode(runtime?.solutionTemplate?.bizCode || '')
                    });
                } catch (err) {
                    emitProgress(options, 'scene_runtime_sync_failed', {
                        sceneName: requestedSceneName,
                        currentBizCode: resolveRuntimeBizCode(runtime) || '',
                        expectedBizCode: expectedSceneBizCode,
                        error: err?.message || String(err)
                    });
                }
            }
            const sceneRuntimeMismatch = !!(
                requestedSceneName
                && expectedSceneBizCode
                && !isRuntimeBizCodeMatched(runtime, expectedSceneBizCode, {
                    includeRoute: !requireTemplateForScene
                })
            );
            if (sceneRuntimeMismatch) {
                const currentRuntimeBizCode = resolveRuntimeBizCode(runtime) || '';
                emitProgress(options, 'scene_runtime_sync_abort', {
                    sceneName: requestedSceneName,
                    currentBizCode: currentRuntimeBizCode,
                    expectedBizCode: expectedSceneBizCode
                });
                return {
                    ok: false,
                    partial: false,
                    validation,
                    successCount: 0,
                    failCount: 1,
                    successes: [],
                    failures: [{
                        error: `场景运行时同步失败：当前 ${currentRuntimeBizCode || 'unknown'}，期望 ${expectedSceneBizCode}（${requestedSceneName}）`
                    }]
                };
            }

            const runtimeTemplateBizCode = normalizeSceneBizCode(runtime?.solutionTemplate?.bizCode || '');
            if (requireTemplateForScene && !isRuntimeTemplateReadyForScene(runtime)) {
                const currentRuntimeBizCode = resolveRuntimeBizCode(runtime) || '';
                emitProgress(options, 'scene_runtime_sync_abort', {
                    sceneName: requestedSceneName,
                    currentBizCode: currentRuntimeBizCode,
                    expectedBizCode: expectedSceneBizCode,
                    error: `场景运行时模板未就绪：当前模板 ${runtimeTemplateBizCode || 'unknown'}，期望 ${expectedSceneBizCode}`
                });
                return {
                    ok: false,
                    partial: false,
                    validation,
                    successCount: 0,
                    failCount: 1,
                    successes: [],
                    failures: [{
                        error: `场景运行时模板未就绪：当前模板 ${runtimeTemplateBizCode || 'unknown'}，期望 ${expectedSceneBizCode}（${requestedSceneName}）`
                    }]
                };
            }

            const sceneNameHint = mergedRequest.sceneName || requestedSceneName || '';
            const useKeywordDefaults = sceneNameHint === '关键词推广';
            runtime.bizCode = normalizeSceneBizCode(mergedRequest.bizCode || runtime.bizCode || DEFAULTS.bizCode);
            runtime.promotionScene = mergedRequest.promotionScene || runtime.promotionScene || (useKeywordDefaults ? DEFAULTS.promotionScene : '');
            runtime.itemSelectedMode = mergedRequest.itemSelectedMode || runtime.itemSelectedMode || (useKeywordDefaults ? DEFAULTS.itemSelectedMode : '');
            runtime.bidTypeV2 = mergedRequest.bidTypeV2 || runtime.bidTypeV2 || (useKeywordDefaults ? DEFAULTS.bidTypeV2 : '');
            runtime.bidTargetV2 = mergedRequest.bidTargetV2 || runtime.bidTargetV2 || (useKeywordDefaults ? DEFAULTS.bidTargetV2 : '');
            if (!useKeywordDefaults) {
                if (!mergedRequest.bidTypeV2) runtime.bidTypeV2 = '';
                if (!mergedRequest.bidTargetV2) runtime.bidTargetV2 = '';
            }
            runtime.dmcType = mergedRequest.dmcType || runtime.dmcType || DEFAULTS.dmcType;
            if (!mergedRequest.sceneName) {
                const inferredSceneName = inferCurrentSceneName();
                if (SCENE_NAME_LIST.includes(inferredSceneName)) {
                    mergedRequest.sceneName = inferredSceneName;
                }
            }
            const sceneNameForRuntime = mergedRequest.sceneName || requestedSceneName || '';
            let sceneSpecForGoal = isPlainObject(mergedRequest.__sceneSpec) ? mergedRequest.__sceneSpec : null;
            if ((!sceneSpecForGoal || !Array.isArray(sceneSpecForGoal?.goals))
                && sceneNameForRuntime
                && options.applySceneSpec !== false) {
                try {
                    sceneSpecForGoal = await getSceneSpec(sceneNameForRuntime, {
                        scanMode: options.goalScanMode || options.scanMode || 'visible',
                        unlockPolicy: options.goalUnlockPolicy || options.unlockPolicy || 'safe_only',
                        goalScan: options.goalScan !== false,
                        refresh: !!options.refreshSceneSpec
                    });
                } catch { }
            }

            const requestGoalContext = resolveGoalContextForPlan({
                sceneName: sceneNameForRuntime,
                sceneSpec: sceneSpecForGoal,
                runtime,
                marketingGoal: mergedRequest.marketingGoal || mergedRequest?.common?.marketingGoal || mergedRequest?.__goalResolution?.resolvedMarketingGoal || '',
                planName: '',
                planIndex: -1
            });
            if (requestGoalContext.goalWarnings.length) {
                emitProgress(options, 'goal_resolution_warning', {
                    sceneName: sceneNameForRuntime,
                    resolvedMarketingGoal: requestGoalContext.resolvedMarketingGoal || '',
                    goalFallbackUsed: !!requestGoalContext.goalFallbackUsed,
                    warnings: requestGoalContext.goalWarnings.slice(0, 20)
                });
            }
            mergedRequest.__goalResolution = {
                resolvedMarketingGoal: requestGoalContext.resolvedMarketingGoal || '',
                goalFallbackUsed: !!requestGoalContext.goalFallbackUsed,
                goalWarnings: requestGoalContext.goalWarnings || [],
                availableGoals: requestGoalContext.availableGoalLabels || [],
                goalSpec: requestGoalContext.goalSpec ? deepClone(requestGoalContext.goalSpec) : null,
                endpoint: requestGoalContext.endpoint || ''
            };
            if (requestGoalContext.resolvedMarketingGoal) {
                mergedRequest.marketingGoal = requestGoalContext.resolvedMarketingGoal;
                mergedRequest.common.marketingGoal = mergedRequest.common.marketingGoal || requestGoalContext.resolvedMarketingGoal;
            }
            mergedRequest.submitEndpoint = normalizeGoalCreateEndpoint(
                mergedRequest.submitEndpoint
                || requestGoalContext.endpoint
                || SCENE_CREATE_ENDPOINT_FALLBACK
            );
            mergedRequest.goalForcedCampaignOverride = mergeDeep(
                {},
                requestGoalContext.campaignOverride || {},
                mergedRequest.goalForcedCampaignOverride || {}
            );
            const sceneKeepBidTypeV2 = SCENE_BIDTYPE_V2_ONLY.has(sceneNameForRuntime);
            if (!sceneKeepBidTypeV2) {
                delete mergedRequest.goalForcedCampaignOverride.bidTypeV2;
                delete mergedRequest.goalForcedCampaignOverride.bidTargetV2;
                delete mergedRequest.goalForcedCampaignOverride.optimizeTarget;
            }
            mergedRequest.goalForcedAdgroupOverride = mergeDeep(
                {},
                requestGoalContext.adgroupOverride || {},
                mergedRequest.goalForcedAdgroupOverride || {}
            );
            runtime = mergeRuntimeWithGoalPatch(runtime, requestGoalContext.runtimePatch || {});
            if (!sceneKeepBidTypeV2) {
                if (!mergedRequest.bidTypeV2) runtime.bidTypeV2 = '';
                if (!mergedRequest.bidTargetV2) runtime.bidTargetV2 = '';
                if (!mergedRequest.optimizeTarget && !mergedRequest?.common?.campaignOverride?.optimizeTarget) {
                    runtime.optimizeTarget = '';
                }
            }

            const forcedPromotionScene = sceneNameForRuntime === '关键词推广'
                ? resolveSceneDefaultPromotionScene(sceneNameForRuntime, runtime.promotionScene)
                : resolveSceneDefaultPromotionScene(sceneNameForRuntime, '');
            if (forcedPromotionScene) {
                mergedRequest.promotionScene = forcedPromotionScene;
                runtime.promotionScene = forcedPromotionScene;
            }
            if (sceneNameForRuntime === '关键词推广') {
                mergedRequest.itemSelectedMode = DEFAULTS.itemSelectedMode;
                runtime.itemSelectedMode = DEFAULTS.itemSelectedMode;
                mergedRequest.common.bidMode = normalizeBidMode(
                    mergedRequest?.common?.bidMode || mergedRequest?.bidMode || mergedRequest?.bidTypeV2 || DEFAULTS.bidTypeV2,
                    'smart'
                );
                runtime.bidTypeV2 = bidModeToBidType(mergedRequest.common.bidMode);
            }

            if (!isPlainObject(mergedRequest.sceneSettings)) {
                mergedRequest.sceneSettings = {};
            }
            const sceneConfigMapping = resolveSceneSettingOverrides({
                sceneName: sceneNameForRuntime,
                sceneSettings: mergedRequest.sceneSettings,
                runtime
            });
            mergedRequest.sceneForcedCampaignOverride = sceneConfigMapping.campaignOverride || {};
            mergedRequest.sceneForcedAdgroupOverride = sceneConfigMapping.adgroupOverride || {};

            const mappedCampaignOverride = mergeDeep(
                {},
                sceneConfigMapping.campaignOverride || {},
                mergedRequest?.common?.campaignOverride || {}
            );
            runtime.bidTypeV2 = mappedCampaignOverride.bidTypeV2
                || mergedRequest.bidTypeV2
                || runtime.bidTypeV2
                || SCENE_BIDTYPE_V2_DEFAULT[sceneNameForRuntime]
                || '';
            runtime.bidTargetV2 = mappedCampaignOverride.bidTargetV2
                || mappedCampaignOverride.optimizeTarget
                || mergedRequest.bidTargetV2
                || runtime.bidTargetV2
                || (sceneNameForRuntime === '关键词推广' ? DEFAULTS.bidTargetV2 : '');
            if (!sceneKeepBidTypeV2) {
                if (!mergedRequest.bidTypeV2 && !mappedCampaignOverride.bidTypeV2) {
                    runtime.bidTypeV2 = '';
                }
                if (!mergedRequest.bidTargetV2 && !mappedCampaignOverride.bidTargetV2 && !mappedCampaignOverride.optimizeTarget) {
                    runtime.bidTargetV2 = '';
                }
            }
            runtime.dmcType = mappedCampaignOverride.dmcType
                || mergedRequest.dmcType
                || runtime.dmcType
                || DEFAULTS.dmcType;

            const sceneCapabilities = resolveSceneCapabilities({
                sceneName: mergedRequest.sceneName || requestedSceneName,
                runtime,
                request: mergedRequest
            });
            const inputPlans = Array.isArray(mergedRequest.plans) ? mergedRequest.plans : [];
            const hasPlansWithoutItem = inputPlans.some(plan => isPlainObject(plan) && !plan.item && !plan.itemId);
            const shouldResolvePreferredItems = sceneCapabilities.requiresItem || !!mergedRequest.itemSearch || hasPlansWithoutItem;

            emitProgress(options, 'resolve_items_start', {
                sceneName: sceneCapabilities.sceneName,
                requiresItem: sceneCapabilities.requiresItem,
                resolvePreferredItems: shouldResolvePreferredItems
            });
            const preferredItems = shouldResolvePreferredItems
                ? await resolvePreferredItems(mergedRequest, runtime)
                : [];
            let plans = normalizePlans(mergedRequest, preferredItems, {
                requiresItem: sceneCapabilities.requiresItem
            });
            const planGoalWarnings = [];
            plans = plans.map((plan, idx) => {
                const goalContext = resolveGoalContextForPlan({
                    sceneName: sceneCapabilities.sceneName || sceneNameForRuntime,
                    sceneSpec: sceneSpecForGoal,
                    runtime,
                    marketingGoal: plan?.marketingGoal || mergedRequest.marketingGoal || mergedRequest?.common?.marketingGoal || '',
                    planName: plan?.planName || '',
                    planIndex: idx
                });
                if (goalContext.goalWarnings.length) {
                    planGoalWarnings.push(...goalContext.goalWarnings);
                }
                const planGoalCampaignOverride = mergeDeep(
                    {},
                    goalContext.campaignOverride || {},
                    plan?.goalForcedCampaignOverride || {}
                );
                if (!sceneKeepBidTypeV2) {
                    delete planGoalCampaignOverride.bidTypeV2;
                    delete planGoalCampaignOverride.bidTargetV2;
                    delete planGoalCampaignOverride.optimizeTarget;
                }
                return {
                    ...plan,
                    marketingGoal: goalContext.resolvedMarketingGoal || normalizeGoalLabel(plan?.marketingGoal || mergedRequest.marketingGoal || ''),
                    goalForcedCampaignOverride: planGoalCampaignOverride,
                    goalForcedAdgroupOverride: mergeDeep(
                        {},
                        goalContext.adgroupOverride || {},
                        plan?.goalForcedAdgroupOverride || {}
                    ),
                    submitEndpoint: normalizeGoalCreateEndpoint(
                        plan?.submitEndpoint
                        || goalContext.endpoint
                        || mergedRequest.submitEndpoint
                        || SCENE_CREATE_ENDPOINT_FALLBACK
                    ),
                    __goalResolution: {
                        resolvedMarketingGoal: goalContext.resolvedMarketingGoal || '',
                        goalFallbackUsed: !!goalContext.goalFallbackUsed,
                        goalWarnings: goalContext.goalWarnings || [],
                        availableGoals: goalContext.availableGoalLabels || [],
                        goalSpec: goalContext.goalSpec ? deepClone(goalContext.goalSpec) : null,
                        endpoint: goalContext.endpoint || ''
                    }
                };
            });
            if (planGoalWarnings.length) {
                emitProgress(options, 'goal_resolution_warning', {
                    sceneName: sceneCapabilities.sceneName || sceneNameForRuntime,
                    resolvedMarketingGoal: mergedRequest.marketingGoal || '',
                    goalFallbackUsed: false,
                    warnings: uniqueBy(planGoalWarnings, item => item).slice(0, 50)
                });
            }
            const forcedDmcType = mappedCampaignOverride.dmcType || '';
            if (forcedDmcType) {
                const targetBudgetField = DMC_BUDGET_FIELD_MAP[forcedDmcType] || 'dayAverageBudget';
                plans.forEach(plan => {
                    if (!isPlainObject(plan?.budget)) return;
                    let budgetValue = NaN;
                    BUDGET_FIELDS.forEach(field => {
                        if (Number.isFinite(budgetValue) && budgetValue > 0) return;
                        if (plan.budget[field] === undefined || plan.budget[field] === null || plan.budget[field] === '') return;
                        budgetValue = toNumber(plan.budget[field], NaN);
                    });
                    if (!Number.isFinite(budgetValue) || budgetValue <= 0) return;
                    plan.budget = { [targetBudgetField]: budgetValue };
                });
            }
            if (!plans.length) {
                return {
                    ok: false,
                    partial: false,
                    validation,
                    successCount: 0,
                    failCount: 1,
                    successes: [],
                    failures: [{
                        error: sceneCapabilities.requiresItem
                            ? '未找到可用商品，请先添加商品或提供 plans/itemSearch'
                            : '未生成可提交计划，请检查 plans 或 planCount 参数'
                    }]
                };
            }

            emitProgress(options, 'build_solution_start', { planCount: plans.length });
            const builtList = [];
            for (let i = 0; i < plans.length; i++) {
                const plan = plans[i];
                emitProgress(options, 'build_solution_item', { index: i + 1, total: plans.length, planName: plan.planName });
                const built = await buildSolutionFromPlan({
                    plan,
                    request: mergedRequest,
                    runtime,
                    requestOptions: options.requestOptions || {}
                });
                builtList.push(built);
            }
            if (builtList.length) {
                const sample = builtList[0]?.solution || {};
                const sampleMeta = builtList[0]?.meta || {};
                const sampleCampaign = isPlainObject(sample.campaign) ? sample.campaign : {};
                const sampleAdgroup = isPlainObject(sample.adgroupList?.[0]) ? sample.adgroupList[0] : {};
                emitProgress(options, 'submit_payload_snapshot', {
                    sceneName: mergedRequest.sceneName || '',
                    marketingGoal: sampleMeta?.marketingGoal || mergedRequest.marketingGoal || '',
                    promotionScene: sampleCampaign.promotionScene || runtime.promotionScene || '',
                    bidTypeV2: sampleCampaign.bidTypeV2 || '',
                    bidTargetV2: sampleCampaign.bidTargetV2 || '',
                    optimizeTarget: sampleCampaign.optimizeTarget || '',
                    bidMode: sampleMeta?.bidMode || '',
                    submitEndpoint: sampleMeta?.submitEndpoint || mergedRequest.submitEndpoint || SCENE_CREATE_ENDPOINT_FALLBACK,
                    materialId: sampleAdgroup?.material?.materialId || '',
                    wordListCount: Array.isArray(sampleAdgroup?.wordList) ? sampleAdgroup.wordList.length : 0,
                    wordPackageCount: Array.isArray(sampleAdgroup?.wordPackageList) ? sampleAdgroup.wordPackageList.length : 0,
                    fallbackTriggered: !!sampleMeta?.fallbackTriggered,
                    goalFallbackUsed: !!sampleMeta?.goalFallbackUsed,
                    campaignKeys: Object.keys(sampleCampaign).slice(0, 80),
                    adgroupKeys: Object.keys(sampleAdgroup).slice(0, 80)
                });
            }

            const chunkSize = Math.max(1, toNumber(options.chunkSize, toNumber(mergedRequest.chunkSize, DEFAULTS.chunkSize)));
            const batchRetry = Math.max(0, toNumber(options.batchRetry, DEFAULTS.batchRetry));
            const resolveEntrySubmitEndpoint = (entry = {}) => normalizeGoalCreateEndpoint(
                entry?.meta?.submitEndpoint
                || mergedRequest.submitEndpoint
                || SCENE_CREATE_ENDPOINT_FALLBACK
            );
            const groupedBatches = (() => {
                const map = new Map();
                builtList.forEach(entry => {
                    const endpoint = resolveEntrySubmitEndpoint(entry);
                    if (!map.has(endpoint)) map.set(endpoint, []);
                    map.get(endpoint).push(entry);
                });
                const out = [];
                Array.from(map.keys()).forEach(endpoint => {
                    const list = map.get(endpoint) || [];
                    chunk(list, chunkSize).forEach(entries => {
                        out.push({ endpoint, entries });
                    });
                });
                return out;
            })();
            const successes = [];
            const failures = [];
            const rawResponses = [];
            const buildFailureFromEntry = (entry = {}, fallbackError = '') => ({
                planName: entry?.meta?.planName || '',
                item: entry?.meta?.item || null,
                marketingGoal: entry?.meta?.marketingGoal || '',
                submitEndpoint: entry?.meta?.submitEndpoint || '',
                error: String(entry?.lastError || entry?.meta?.lastError || fallbackError || '服务端未返回 campaignId')
            });
            const downgradeKeywordEntryToManual = (entry = {}) => {
                const sourceCampaign = isPlainObject(entry?.solution?.campaign) ? entry.solution.campaign : {};
                const sourceAdgroup = isPlainObject(entry?.solution?.adgroupList?.[0]) ? entry.solution.adgroupList[0] : {};
                const downgradedCampaign = pruneKeywordCampaignForCustomScene(sourceCampaign, {
                    request: mergedRequest,
                    bidMode: 'manual'
                });
                const downgradedAdgroup = pruneKeywordAdgroupForCustomScene(sourceAdgroup, entry?.meta?.item || null);
                if (hasOwn(downgradedAdgroup, 'wordPackageList')) {
                    delete downgradedAdgroup.wordPackageList;
                }
                return {
                    ...entry,
                    solution: {
                        ...(entry.solution || {}),
                        campaign: downgradedCampaign,
                        adgroupList: [downgradedAdgroup]
                    },
                    meta: {
                        ...(entry.meta || {}),
                        bidMode: 'manual',
                        bidTypeV2: 'custom_bid',
                        bidTargetV2: '',
                        fallbackTriggered: true,
                        fallbackDowngraded: true
                    }
                };
            };

            for (let batchIndex = 0; batchIndex < groupedBatches.length; batchIndex++) {
                const batchPayload = groupedBatches[batchIndex] || {};
                const batchEndpoint = normalizeGoalCreateEndpoint(batchPayload.endpoint || SCENE_CREATE_ENDPOINT_FALLBACK);
                const batch = Array.isArray(batchPayload.entries) ? batchPayload.entries : [];
                emitProgress(options, 'submit_batch_start', {
                    batchIndex: batchIndex + 1,
                    batchTotal: groupedBatches.length,
                    size: batch.length,
                    endpoint: batchEndpoint
                });

                let remainingEntries = batch.slice();
                let batchError = null;
                for (let attempt = 1; attempt <= batchRetry + 1; attempt++) {
                    const solutionList = remainingEntries.map(entry => entry.solution);
                    try {
                        const res = await requestOne(batchEndpoint, runtime.bizCode, {
                            bizCode: runtime.bizCode,
                            solutionList
                        }, options.requestOptions || {});
                        rawResponses.push(res);
                        const outcome = parseAddListOutcome(res, remainingEntries);
                        if (outcome.successes.length) {
                            successes.push(...outcome.successes);
                        }
                        if (!outcome.failures.length) {
                            emitProgress(options, 'submit_batch_success', {
                                batchIndex: batchIndex + 1,
                                createdCount: outcome.successes.length,
                                failedCount: 0,
                                endpoint: batchEndpoint
                            });
                            remainingEntries = [];
                            break;
                        }

                        const errSummary = outcome.failures.map(item => `${item.planName}: ${item.error}`).join('；');
                        batchError = new Error(errSummary || '服务端未返回 campaignId');
                        emitProgress(options, 'submit_batch_success', {
                            batchIndex: batchIndex + 1,
                            createdCount: outcome.successes.length,
                            failedCount: outcome.failures.length,
                            endpoint: batchEndpoint,
                            error: batchError.message
                        });

                        if (!outcome.successes.length && attempt < batchRetry + 1) {
                            emitProgress(options, 'submit_batch_retry', {
                                batchIndex: batchIndex + 1,
                                attempt,
                                endpoint: batchEndpoint,
                                error: batchError.message
                            });
                            await sleep(1200);
                            continue;
                        }

                        remainingEntries = outcome.failedEntries;
                        break;
                    } catch (err) {
                        batchError = err;
                        emitProgress(options, 'submit_batch_retry', {
                            batchIndex: batchIndex + 1,
                            attempt,
                            endpoint: batchEndpoint,
                            error: err?.message || String(err)
                        });
                        if (attempt < batchRetry + 1) await sleep(1200);
                    }
                }

                if (!remainingEntries.length) continue;

                const downgradeCandidates = remainingEntries.filter(entry => {
                    const bidMode = normalizeBidMode(entry?.meta?.bidMode || 'smart', 'smart');
                    const isKeywordEntry = entry?.meta?.isKeywordScene === true || sceneCapabilities.sceneName === '关键词推广';
                    const errorText = String(entry?.lastError || entry?.meta?.lastError || batchError?.message || '');
                    return isKeywordEntry && bidMode === 'smart' && isWordPackageValidationError(errorText);
                });
                let singleRetryEntries = remainingEntries.slice();
                let skippedEntries = [];
                let downgradeTriggered = false;
                if (downgradeCandidates.length && fallbackPolicy !== 'none') {
                    emitProgress(options, 'fallback_downgrade_pending', {
                        batchIndex: batchIndex + 1,
                        count: downgradeCandidates.length,
                        policy: fallbackPolicy,
                        error: batchError?.message || ''
                    });
                    if (fallbackPolicy === 'auto') {
                        downgradeTriggered = true;
                        emitProgress(options, 'fallback_downgrade_confirmed', {
                            batchIndex: batchIndex + 1,
                            count: downgradeCandidates.length,
                            auto: true
                        });
                    } else if (fallbackPolicy === 'confirm') {
                        let confirmed = false;
                        try {
                            confirmed = window.confirm('检测到流量智选词包校验失败，是否将失败计划改为手动出价后重试？');
                        } catch {
                            confirmed = false;
                        }
                        if (confirmed) {
                            downgradeTriggered = true;
                            emitProgress(options, 'fallback_downgrade_confirmed', {
                                batchIndex: batchIndex + 1,
                                count: downgradeCandidates.length,
                                auto: false
                            });
                        } else {
                            emitProgress(options, 'fallback_downgrade_canceled', {
                                batchIndex: batchIndex + 1,
                                count: downgradeCandidates.length
                            });
                            const downgradeSet = new Set(downgradeCandidates);
                            skippedEntries = remainingEntries.filter(entry => downgradeSet.has(entry));
                            singleRetryEntries = remainingEntries.filter(entry => !downgradeSet.has(entry));
                        }
                    }
                    if (downgradeTriggered) {
                        const downgradeSet = new Set(downgradeCandidates);
                        singleRetryEntries = remainingEntries.map(entry => (
                            downgradeSet.has(entry) ? downgradeKeywordEntryToManual(entry) : entry
                        ));
                    }
                }

                if (skippedEntries.length) {
                    failures.push(...skippedEntries.map(entry => buildFailureFromEntry(entry)));
                }
                if (!singleRetryEntries.length) continue;

                emitProgress(options, 'submit_batch_fallback_single', {
                    batchIndex: batchIndex + 1,
                    endpoint: batchEndpoint,
                    error: batchError?.message || String(batchError),
                    fallbackTriggered: downgradeTriggered,
                    fallbackPolicy
                });
                let downgradeRetrySuccessCount = 0;
                let downgradeRetryFailCount = 0;
                for (const entry of singleRetryEntries) {
                    try {
                        const singleEndpoint = resolveEntrySubmitEndpoint(entry);
                        const res = await requestOne(singleEndpoint, runtime.bizCode, {
                            bizCode: runtime.bizCode,
                            solutionList: [entry.solution]
                        }, options.requestOptions || {});
                        rawResponses.push(res);
                        const outcome = parseAddListOutcome(res, [entry]);
                        if (outcome.successes.length) {
                            successes.push(...outcome.successes);
                            if (entry?.meta?.fallbackDowngraded) downgradeRetrySuccessCount += outcome.successes.length;
                        } else {
                            failures.push(...outcome.failures);
                            if (entry?.meta?.fallbackDowngraded) downgradeRetryFailCount += outcome.failures.length;
                        }
                    } catch (err) {
                        failures.push({
                            planName: entry.meta.planName,
                            item: entry.meta.item,
                            marketingGoal: entry?.meta?.marketingGoal || '',
                            submitEndpoint: entry?.meta?.submitEndpoint || '',
                            error: err?.message || String(err)
                        });
                        if (entry?.meta?.fallbackDowngraded) downgradeRetryFailCount += 1;
                    }
                }
                if (downgradeTriggered) {
                    emitProgress(options, 'fallback_downgrade_result', {
                        batchIndex: batchIndex + 1,
                        successCount: downgradeRetrySuccessCount,
                        failCount: downgradeRetryFailCount
                    });
                }
            }

            const result = {
                ok: failures.length === 0,
                partial: successes.length > 0 && failures.length > 0,
                validation,
                sceneConfigMapping: {
                    sceneName: sceneConfigMapping?.sceneName || mergedRequest.sceneName || '',
                    appliedCount: Array.isArray(sceneConfigMapping?.applied) ? sceneConfigMapping.applied.length : 0,
                    skippedCount: Array.isArray(sceneConfigMapping?.skipped) ? sceneConfigMapping.skipped.length : 0,
                    applied: Array.isArray(sceneConfigMapping?.applied) ? sceneConfigMapping.applied : [],
                    skipped: Array.isArray(sceneConfigMapping?.skipped) ? sceneConfigMapping.skipped : []
                },
                runtime: {
                    bizCode: runtime.bizCode,
                    promotionScene: runtime.promotionScene,
                    itemSelectedMode: runtime.itemSelectedMode,
                    bidTypeV2: runtime.bidTypeV2,
                    bidTargetV2: runtime.bidTargetV2,
                    dmcType: runtime.dmcType
                },
                marketingGoal: mergedRequest?.__goalResolution?.resolvedMarketingGoal || mergedRequest.marketingGoal || '',
                goalFallbackUsed: !!mergedRequest?.__goalResolution?.goalFallbackUsed,
                goalWarnings: Array.isArray(mergedRequest?.__goalResolution?.goalWarnings)
                    ? mergedRequest.__goalResolution.goalWarnings.slice(0, 50)
                    : [],
                submitEndpoint: mergedRequest.submitEndpoint || SCENE_CREATE_ENDPOINT_FALLBACK,
                fallbackPolicy,
                successCount: successes.length,
                failCount: failures.length,
                successes,
                failures,
                rawResponses
            };
            emitProgress(options, 'done', result);
            return result;
        };

        const appendKeywords = async (request = {}, options = {}) => {
            const runtime = await getRuntimeDefaults(false);
            runtime.bizCode = request.bizCode || runtime.bizCode;
            runtime.promotionScene = request.promotionScene || runtime.promotionScene;
            runtime.itemSelectedMode = request.itemSelectedMode || runtime.itemSelectedMode;
            runtime.bidTypeV2 = request.bidTypeV2 || runtime.bidTypeV2;
            runtime.bidTargetV2 = request.bidTargetV2 || runtime.bidTargetV2;

            const entries = Array.isArray(request.entries) ? request.entries : [request];
            const results = [];
            for (const entry of entries) {
                const adgroupId = toIdValue(entry.adgroupId);
                if (!adgroupId) {
                    results.push({ ok: false, adgroupId: '', error: '缺少 adgroupId' });
                    continue;
                }
                const keywordDefaults = {
                    bidPrice: toNumber(entry?.keywordDefaults?.bidPrice, toNumber(request?.keywordDefaults?.bidPrice, 1)),
                    matchScope: parseMatchScope(entry?.keywordDefaults?.matchScope, parseMatchScope(request?.keywordDefaults?.matchScope, DEFAULTS.matchScope)),
                    onlineStatus: toNumber(entry?.keywordDefaults?.onlineStatus, toNumber(request?.keywordDefaults?.onlineStatus, DEFAULTS.keywordOnlineStatus))
                };
                const wordList = parseKeywords(entry.keywords || request.keywords || [], keywordDefaults)
                    .map(word => applyKeywordDefaults(word, keywordDefaults))
                    .slice(0, 200);
                if (!wordList.length) {
                    results.push({ ok: false, adgroupId, error: '关键词为空' });
                    continue;
                }

                try {
                    const res = await requestOne(ENDPOINTS.bidwordAdd, runtime.bizCode, {
                        bizCode: runtime.bizCode,
                        promotionScene: runtime.promotionScene,
                        itemSelectedMode: runtime.itemSelectedMode,
                        bidTypeV2: runtime.bidTypeV2,
                        bidTargetV2: runtime.bidTargetV2,
                        adgroupId,
                        wordList
                    }, options.requestOptions || {});
                    results.push({
                        ok: true,
                        adgroupId,
                        wordCount: wordList.length,
                        response: res
                    });
                } catch (err) {
                    results.push({
                        ok: false,
                        adgroupId,
                        wordCount: wordList.length,
                        error: err?.message || String(err)
                    });
                }
            }

            return {
                ok: results.every(item => item.ok),
                partial: results.some(item => item.ok) && results.some(item => !item.ok),
                results
            };
        };

        const suggestKeywords = async (request = {}, options = {}) => {
            const runtime = await getRuntimeDefaults(false);
            runtime.bizCode = request.bizCode || runtime.bizCode || DEFAULTS.bizCode;
            runtime.promotionScene = request.promotionScene || runtime.promotionScene || DEFAULTS.promotionScene;
            runtime.itemSelectedMode = request.itemSelectedMode || runtime.itemSelectedMode || DEFAULTS.itemSelectedMode;
            runtime.bidTypeV2 = request.bidTypeV2 || runtime.bidTypeV2 || DEFAULTS.bidTypeV2;
            runtime.bidTargetV2 = request.bidTargetV2 || runtime.bidTargetV2 || DEFAULTS.bidTargetV2;

            const materialId = request.materialId || request.itemId;
            if (!materialId) {
                return { ok: false, wordList: [], wordPackageList: [], error: '缺少 materialId/itemId' };
            }

            const keywordDefaults = {
                bidPrice: toNumber(request?.keywordDefaults?.bidPrice, 1),
                matchScope: parseMatchScope(request?.keywordDefaults?.matchScope, DEFAULTS.matchScope),
                onlineStatus: toNumber(request?.keywordDefaults?.onlineStatus, DEFAULTS.keywordOnlineStatus)
            };
            const source = request.source || 'auto';
            const limit = Math.max(1, Math.min(200, toNumber(request.limit, DEFAULTS.recommendCount)));
            const [wordList, wordPackageList] = await Promise.all([
                fetchRecommendWordList({
                    bizCode: runtime.bizCode,
                    materialId,
                    defaults: runtime,
                    source,
                    requestOptions: options.requestOptions || {}
                }),
                fetchRecommendWordPackageList({
                    bizCode: runtime.bizCode,
                    materialId,
                    defaults: runtime,
                    requestOptions: options.requestOptions || {}
                })
            ]);

            return {
                ok: true,
                wordList: (Array.isArray(wordList) ? wordList : [])
                    .map(word => applyKeywordDefaults(word, keywordDefaults))
                    .filter(word => word.word)
                    .slice(0, limit),
                wordPackageList: Array.isArray(wordPackageList) ? wordPackageList.slice(0, 100) : []
            };
        };

        const suggestCrowds = async (request = {}, options = {}) => {
            const runtime = await getRuntimeDefaults(false);
            runtime.bizCode = request.bizCode || runtime.bizCode || DEFAULTS.bizCode;
            runtime.promotionScene = request.promotionScene || runtime.promotionScene || DEFAULTS.promotionScene;
            runtime.bidTargetV2 = request.bidTargetV2 || runtime.bidTargetV2 || DEFAULTS.bidTargetV2;
            runtime.subPromotionType = request.subPromotionType || runtime.subPromotionType || DEFAULTS.subPromotionType;
            runtime.promotionType = request.promotionType || runtime.promotionType || DEFAULTS.promotionType;
            const crowdList = await fetchRecommendCrowdList({
                bizCode: runtime.bizCode,
                defaults: runtime,
                labelIdList: request.labelIdList || DEFAULTS.recommendCrowdLabelIds,
                materialIdList: Array.isArray(request.materialIdList) ? request.materialIdList : [],
                requestOptions: options.requestOptions || {}
            });
            return {
                ok: true,
                crowdList: crowdList.slice(0, Math.max(1, Math.min(100, toNumber(request.limit, 50))))
            };
        };

        const ensureWizardStyle = () => {
            if (document.getElementById('am-wxt-keyword-style')) return;
            const style = document.createElement('style');
            style.id = 'am-wxt-keyword-style';
            style.textContent = `
                #am-wxt-keyword-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(15, 23, 42, 0.36);
                    backdrop-filter: blur(4px);
                    z-index: 1000006;
                    display: none;
                    align-items: center;
                    justify-content: center;
                }
                #am-wxt-keyword-overlay.open {
                    display: flex;
                }
                #am-wxt-keyword-modal {
                    width: min(1160px, 96vw);
                    max-height: 92vh;
                    background: #f7f8fc;
                    border: 1px solid rgba(69,84,229,0.2);
                    border-radius: 14px;
                    box-shadow: 0 16px 42px rgba(17,24,39,0.28);
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    font-family: PingFangSC-Regular,PingFang SC,"Microsoft Yahei","SimHei",sans-serif;
                    color: #1f2937;
                }
                #am-wxt-keyword-modal .am-wxt-header {
                    height: 48px;
                    padding: 0 16px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    background: linear-gradient(135deg, #eef2ff, #f8f9ff);
                    border-bottom: 1px solid rgba(69,84,229,0.18);
                    font-weight: 600;
                }
                #am-wxt-keyword-modal .am-wxt-close {
                    border: 0;
                    background: transparent;
                    color: #4b5563;
                    cursor: pointer;
                    font-size: 16px;
                    padding: 4px 6px;
                }
                #am-wxt-keyword-modal .am-wxt-body {
                    padding: 12px 14px 14px;
                    overflow: auto;
                }
                #am-wxt-keyword-modal .am-wxt-split {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 12px;
                }
                #am-wxt-keyword-modal .am-wxt-panel {
                    border: 1px solid rgba(148,163,184,0.35);
                    border-radius: 10px;
                    background: #fff;
                    display: flex;
                    flex-direction: column;
                    min-height: 310px;
                    overflow: hidden;
                }
                #am-wxt-keyword-modal .am-wxt-panel-candidate {
                    min-height: 0;
                }
                #am-wxt-keyword-modal .am-wxt-toolbar {
                    padding: 10px;
                    border-bottom: 1px solid rgba(148,163,184,0.28);
                    display: flex;
                    gap: 8px;
                    align-items: center;
                    flex-wrap: wrap;
                }
                #am-wxt-keyword-modal .am-wxt-toolbar input,
                #am-wxt-keyword-modal .am-wxt-config input,
                #am-wxt-keyword-modal .am-wxt-config select,
                #am-wxt-keyword-modal .am-wxt-config textarea {
                    border: 1px solid rgba(148,163,184,0.5);
                    border-radius: 8px;
                    padding: 6px 8px;
                    font-size: 12px;
                    background: #fff;
                    color: #1f2937;
                    min-height: 30px;
                    box-sizing: border-box;
                }
                #am-wxt-keyword-modal .am-wxt-toolbar input {
                    flex: 1;
                    min-width: 180px;
                }
                #am-wxt-keyword-modal .am-wxt-btn {
                    border: 1px solid rgba(69,84,229,0.3);
                    border-radius: 8px;
                    padding: 6px 10px;
                    font-size: 12px;
                    line-height: 1;
                    background: #eef2ff;
                    color: #2e3ab8;
                    cursor: pointer;
                }
                #am-wxt-keyword-modal .am-wxt-btn.primary {
                    background: linear-gradient(135deg, #4554e5, #4f68ff);
                    color: #fff;
                    border-color: #4554e5;
                }
                #am-wxt-keyword-scan-scenes {
                    display: none !important;
                }
                #am-wxt-keyword-modal .am-wxt-list {
                    padding: 6px;
                    overflow: auto;
                    flex: 1;
                }
                #am-wxt-keyword-candidate-list {
                    flex: 0 0 auto;
                    height: 222px;
                    max-height: 222px;
                }
                #am-wxt-keyword-modal .am-wxt-item {
                    border: 1px solid rgba(148,163,184,0.34);
                    border-radius: 8px;
                    padding: 8px;
                    margin-bottom: 6px;
                    display: flex;
                    justify-content: space-between;
                    gap: 8px;
                    align-items: center;
                }
                #am-wxt-keyword-modal .am-wxt-item .name {
                    font-size: 12px;
                    line-height: 1.35;
                    color: #111827;
                }
                #am-wxt-keyword-modal .am-wxt-item .meta {
                    font-size: 11px;
                    color: #64748b;
                    margin-top: 2px;
                }
                #am-wxt-keyword-modal .am-wxt-item .actions {
                    display: flex;
                    gap: 4px;
                    flex-shrink: 0;
                }
                #am-wxt-keyword-modal .am-wxt-strategy-board {
                    margin-top: 12px;
                    border: 1px solid rgba(148,163,184,0.35);
                    border-radius: 10px;
                    background: #fff;
                    padding: 10px;
                }
                #am-wxt-keyword-modal .am-wxt-strategy-head {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-size: 13px;
                    color: #334155;
                    margin-bottom: 8px;
                }
                #am-wxt-keyword-modal .am-wxt-strategy-list {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                #am-wxt-keyword-modal .am-wxt-strategy-item {
                    border: 1px solid rgba(148,163,184,0.3);
                    border-radius: 10px;
                    padding: 10px;
                    background: #f8fafc;
                }
                #am-wxt-keyword-modal .am-wxt-strategy-main {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 8px;
                }
                #am-wxt-keyword-modal .am-wxt-strategy-left {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 13px;
                    color: #111827;
                    font-weight: 600;
                }
                #am-wxt-keyword-modal .am-wxt-strategy-right {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    color: #374151;
                    font-size: 12px;
                }
                #am-wxt-keyword-modal .am-wxt-detail-title {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 6px;
                    font-size: 13px;
                    color: #334155;
                }
                #am-wxt-keyword-modal .am-wxt-detail-title-right {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                #am-wxt-keyword-overlay #am-wxt-keyword-detail-backdrop {
                    position: fixed;
                    inset: 0;
                    background: rgba(15, 23, 42, 0.28);
                    z-index: 1000007;
                    display: none;
                }
                #am-wxt-keyword-overlay #am-wxt-keyword-detail-backdrop.open {
                    display: block;
                }
                #am-wxt-keyword-modal .am-wxt-config {
                    margin-top: 12px;
                    border: 1px solid rgba(148,163,184,0.35);
                    border-radius: 10px;
                    background: #fff;
                    padding: 10px;
                }
                #am-wxt-keyword-detail-config {
                    position: fixed;
                    left: 50%;
                    top: 50%;
                    transform: translate(-50%, -50%);
                    width: min(1240px, 94vw);
                    max-height: 90vh;
                    overflow: auto;
                    z-index: 1000008;
                    margin-top: 0;
                    box-shadow: 0 18px 48px rgba(17,24,39,0.26);
                }
                #am-wxt-keyword-modal .am-wxt-config.collapsed {
                    display: none;
                }
                #am-wxt-keyword-detail-config .am-wxt-detail-title {
                    position: sticky;
                    top: 0;
                    background: #fff;
                    z-index: 2;
                    margin: -10px -10px 10px;
                    padding: 10px;
                    border-bottom: 1px solid rgba(148,163,184,0.28);
                }
                #am-wxt-keyword-detail-config .am-wxt-detail-footer {
                    position: sticky;
                    bottom: 0;
                    background: #fff;
                    z-index: 2;
                    margin: 10px -10px -10px;
                    padding: 10px;
                    border-top: 1px solid rgba(148,163,184,0.28);
                    display: flex;
                    justify-content: flex-end;
                    align-items: center;
                }
                #am-wxt-keyword-modal .am-wxt-config-grid {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                #am-wxt-keyword-modal .am-wxt-setting-row {
                    display: grid;
                    grid-template-columns: 140px minmax(0, 1fr);
                    align-items: flex-start;
                    gap: 10px;
                    padding: 6px 0;
                    border-bottom: 1px dashed rgba(148,163,184,0.28);
                }
                #am-wxt-keyword-modal .am-wxt-setting-row:last-child {
                    border-bottom: 0;
                }
                #am-wxt-keyword-modal .am-wxt-setting-label {
                    font-size: 12px;
                    color: #334155;
                    line-height: 30px;
                    white-space: nowrap;
                }
                #am-wxt-keyword-modal .am-wxt-setting-control {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                    min-width: 0;
                }
                #am-wxt-keyword-modal .am-wxt-static-settings {
                    display: none;
                }
                #am-wxt-keyword-modal .am-wxt-setting-control-inline {
                    flex-direction: row;
                    align-items: center;
                    gap: 10px;
                    flex-wrap: wrap;
                }
                #am-wxt-keyword-modal .am-wxt-inline-check {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 12px;
                }
                #am-wxt-keyword-modal .am-wxt-option-line {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                }
                #am-wxt-keyword-modal .am-wxt-option-chip {
                    border: 1px solid rgba(148,163,184,0.5);
                    border-radius: 9px;
                    padding: 5px 10px;
                    background: #fff;
                    color: #475569;
                    cursor: pointer;
                    font-size: 12px;
                    line-height: 1.2;
                }
                #am-wxt-keyword-modal .am-wxt-option-chip.active {
                    border-color: #4f68ff;
                    background: rgba(79,104,255,0.1);
                    color: #3344c8;
                    font-weight: 600;
                }
                #am-wxt-keyword-modal .am-wxt-option-chip:disabled {
                    cursor: not-allowed;
                    opacity: 0.48;
                }
                #am-wxt-keyword-modal .am-wxt-hidden-control {
                    display: none !important;
                }
                #am-wxt-keyword-modal .am-wxt-scene-dynamic {
                    margin-top: 8px;
                    border: 1px dashed rgba(100,116,139,0.35);
                    border-radius: 8px;
                    background: #f8fafc;
                    padding: 8px;
                }
                #am-wxt-keyword-modal .am-wxt-scene-dynamic .title {
                    font-size: 12px;
                    color: #334155;
                    font-weight: 600;
                    margin-bottom: 6px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 8px;
                }
                #am-wxt-keyword-modal .am-wxt-scene-dynamic .meta {
                    color: #64748b;
                    font-size: 11px;
                }
                #am-wxt-keyword-modal .am-wxt-scene-grid {
                    display: flex;
                    flex-direction: column;
                    gap: 0;
                }
                #am-wxt-keyword-modal .am-wxt-scene-setting-row {
                    display: grid;
                    grid-template-columns: 160px minmax(0, 1fr);
                    align-items: flex-start;
                    gap: 8px;
                    padding: 6px 0;
                    border-bottom: 1px dashed rgba(148,163,184,0.25);
                }
                #am-wxt-keyword-modal .am-wxt-scene-setting-row:last-child {
                    border-bottom: 0;
                }
                #am-wxt-keyword-modal .am-wxt-scene-setting-label {
                    font-size: 12px;
                    color: #334155;
                    line-height: 30px;
                }
                #am-wxt-keyword-modal .am-wxt-scene-empty {
                    color: #64748b;
                    font-size: 12px;
                }
                #am-wxt-keyword-modal .am-wxt-config textarea {
                    width: 100%;
                    min-height: 76px;
                    margin-top: 0;
                    resize: vertical;
                }
                #am-wxt-keyword-modal .am-wxt-actions {
                    margin-top: 10px;
                    display: flex;
                    gap: 8px;
                    align-items: center;
                    flex-wrap: wrap;
                }
                #am-wxt-keyword-quick-log {
                    margin-top: 8px;
                    border: 1px solid rgba(148,163,184,0.35);
                    border-radius: 8px;
                    background: #fff;
                    min-height: 48px;
                    max-height: 96px;
                    overflow: auto;
                    padding: 6px 8px;
                    font-size: 12px;
                }
                #am-wxt-keyword-quick-log .line {
                    margin-bottom: 4px;
                    color: #334155;
                }
                #am-wxt-keyword-quick-log .line.error {
                    color: #b91c1c;
                }
                #am-wxt-keyword-quick-log .line.success {
                    color: #15803d;
                }
                #am-wxt-keyword-modal .am-wxt-crowd-box {
                    margin-top: 8px;
                    border: 1px dashed rgba(100,116,139,0.4);
                    border-radius: 8px;
                    padding: 8px;
                    background: #f8fafc;
                }
                #am-wxt-keyword-modal .am-wxt-crowd-title {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    font-size: 12px;
                    color: #334155;
                    margin-bottom: 6px;
                }
                #am-wxt-keyword-modal .am-wxt-crowd-list {
                    max-height: 104px;
                    overflow: auto;
                }
                #am-wxt-keyword-modal .am-wxt-crowd-item {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 8px;
                    font-size: 12px;
                    color: #334155;
                    padding: 4px 0;
                    border-bottom: 1px dashed rgba(148,163,184,0.3);
                }
                #am-wxt-keyword-modal .am-wxt-crowd-item:last-child {
                    border-bottom: 0;
                }
                #am-wxt-keyword-preview {
                    margin-top: 8px;
                    background: #0f172a;
                    color: #d1d5db;
                    border-radius: 8px;
                    padding: 10px;
                    min-height: 96px;
                    max-height: 180px;
                    overflow: auto;
                    font-family: Menlo, Consolas, monospace;
                    font-size: 11px;
                    white-space: pre-wrap;
                }
                #am-wxt-keyword-debug-wrap.collapsed {
                    display: none;
                }
                #am-wxt-keyword-log {
                    margin-top: 8px;
                    border: 1px solid rgba(148,163,184,0.35);
                    border-radius: 8px;
                    background: #fff;
                    min-height: 90px;
                    max-height: 180px;
                    overflow: auto;
                    padding: 8px;
                    font-size: 12px;
                }
                #am-wxt-keyword-log .line {
                    margin-bottom: 4px;
                    color: #334155;
                }
                #am-wxt-keyword-log .line.error {
                    color: #b91c1c;
                }
                #am-wxt-keyword-log .line.success {
                    color: #15803d;
                }
                @media (max-width: 980px) {
                    #am-wxt-keyword-modal .am-wxt-split {
                        grid-template-columns: 1fr;
                    }
                    #am-wxt-keyword-modal .am-wxt-setting-row {
                        grid-template-columns: 1fr;
                        gap: 6px;
                    }
                    #am-wxt-keyword-modal .am-wxt-setting-label {
                        line-height: 1.3;
                    }
                    #am-wxt-keyword-modal .am-wxt-scene-setting-row {
                        grid-template-columns: 1fr;
                        gap: 6px;
                    }
                    #am-wxt-keyword-modal .am-wxt-scene-setting-label {
                        line-height: 1.3;
                    }
                }
            `;
            document.head.appendChild(style);
        };

        const getDefaultStrategyList = () => ([
            { id: 'trend_star', name: '关键词推广-趋势明星', enabled: true, dayAverageBudget: '100', bidMode: 'smart' },
            { id: 'custom_define', name: '关键词推广-自定义推广', enabled: true, dayAverageBudget: '100', bidMode: 'smart' }
        ]);

        const wizardDefaultDraft = () => ({
            bizCode: DEFAULTS.bizCode,
            promotionScene: DEFAULTS.promotionScene,
            sceneName: '关键词推广',
            sceneSettingValues: {},
            sceneSettingTouched: {},
            planNamePrefix: buildSceneTimePrefix('关键词推广'),
            dayAverageBudget: '',
            defaultBidPrice: '1',
            bidMode: 'smart',
            keywordMode: DEFAULTS.keywordMode,
            recommendCount: String(DEFAULTS.recommendCount),
            manualKeywords: '',
            addedItems: [],
            crowdList: [],
            debugVisible: false,
            fallbackPolicy: 'confirm',
            strategyList: getDefaultStrategyList(),
            editingStrategyId: '',
            detailVisible: false
        });

        const mountWizard = () => {
            if (wizardState.mounted) return;
            ensureWizardStyle();

            const overlay = document.createElement('div');
            overlay.id = 'am-wxt-keyword-overlay';
            overlay.innerHTML = `
                <div id="am-wxt-keyword-detail-backdrop"></div>
                <div id="am-wxt-keyword-modal" role="dialog" aria-modal="true">
                    <div class="am-wxt-header">
                        <span>关键词推广批量建计划 API 向导</span>
                        <button class="am-wxt-close" id="am-wxt-keyword-close" title="关闭">✕</button>
                    </div>
                    <div class="am-wxt-body">
                        <div class="am-wxt-split">
                            <div class="am-wxt-panel am-wxt-panel-candidate">
                                <div class="am-wxt-toolbar">
                                    <input id="am-wxt-keyword-search-input" placeholder="输入商品关键词或商品ID（逗号分隔）" />
                                    <button class="am-wxt-btn" id="am-wxt-keyword-search">搜索</button>
                                    <button class="am-wxt-btn" id="am-wxt-keyword-hot">热销最近</button>
                                    <button class="am-wxt-btn" id="am-wxt-keyword-all">全部商品</button>
                                    <button class="am-wxt-btn" id="am-wxt-keyword-add-all">全部添加</button>
                                </div>
                                <div class="am-wxt-list" id="am-wxt-keyword-candidate-list"></div>
                            </div>
                            <div class="am-wxt-panel">
                                <div class="am-wxt-toolbar">
                                    <span>已添加商品 <b id="am-wxt-keyword-added-count">0</b> / ${WIZARD_MAX_ITEMS}</span>
                                    <button class="am-wxt-btn" id="am-wxt-keyword-clear-added">清空</button>
                                </div>
                                <div class="am-wxt-list" id="am-wxt-keyword-added-list"></div>
                            </div>
                        </div>

                        <div class="am-wxt-strategy-board">
                            <div class="am-wxt-strategy-head">
                                <span>小万策略建议</span>
                                <span>已选 <b id="am-wxt-keyword-strategy-count">0</b> 个</span>
                            </div>
                            <div class="am-wxt-strategy-list" id="am-wxt-keyword-strategy-list"></div>
                            <div class="am-wxt-actions">
                                <button class="am-wxt-btn primary" id="am-wxt-keyword-run-quick">立即投放</button>
                                <button class="am-wxt-btn" id="am-wxt-keyword-preview-quick">生成其他策略</button>
                            </div>
                            <div id="am-wxt-keyword-quick-log"></div>
                        </div>

                        <div class="am-wxt-config collapsed" id="am-wxt-keyword-detail-config">
                            <div class="am-wxt-detail-title">
                                <span id="am-wxt-keyword-detail-title">编辑计划</span>
                                <div class="am-wxt-detail-title-right">
                                    <button class="am-wxt-btn" id="am-wxt-keyword-detail-close">关闭</button>
                                </div>
                            </div>
                            <div id="am-wxt-keyword-static-settings" class="am-wxt-static-settings">
                                <div class="am-wxt-config-grid">
                                    <div class="am-wxt-setting-row">
                                        <div class="am-wxt-setting-label">场景选择</div>
                                        <div class="am-wxt-setting-control">
                                            <div class="am-wxt-option-line" data-bind-select="am-wxt-keyword-scene-select"></div>
                                            <select id="am-wxt-keyword-scene-select" class="am-wxt-hidden-control">
                                                <option value="货品全站推广">货品全站推广</option>
                                                <option value="关键词推广">关键词推广</option>
                                                <option value="人群推广">人群推广</option>
                                                <option value="店铺直达">店铺直达</option>
                                                <option value="内容营销">内容营销</option>
                                                <option value="线索推广">线索推广</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div class="am-wxt-setting-row">
                                        <div class="am-wxt-setting-label">出价方式</div>
                                        <div class="am-wxt-setting-control">
                                            <div class="am-wxt-option-line" data-bind-select="am-wxt-keyword-bid-mode"></div>
                                            <select id="am-wxt-keyword-bid-mode" class="am-wxt-hidden-control">
                                                <option value="smart">智能出价</option>
                                                <option value="manual">手动出价</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div class="am-wxt-setting-row">
                                        <div class="am-wxt-setting-label">出价目标</div>
                                        <div class="am-wxt-setting-control">
                                            <div class="am-wxt-option-line" data-bind-select="am-wxt-keyword-bid-target"></div>
                                            <select id="am-wxt-keyword-bid-target" class="am-wxt-hidden-control">
                                                <option value="conv">获取成交量</option>
                                                <option value="similar_item">相似品跟投</option>
                                                <option value="search_rank">抢占搜索卡位</option>
                                                <option value="market_penetration">提升市场渗透</option>
                                                <option value="fav_cart">增加收藏加购量</option>
                                                <option value="click">增加点击量</option>
                                                <option value="roi">稳定投产比</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div class="am-wxt-setting-row">
                                        <div class="am-wxt-setting-label">预算类型</div>
                                        <div class="am-wxt-setting-control">
                                            <div class="am-wxt-option-line" data-bind-select="am-wxt-keyword-budget-type"></div>
                                            <select id="am-wxt-keyword-budget-type" class="am-wxt-hidden-control">
                                                <option value="day_average">每日预算</option>
                                                <option value="day_budget">日均预算</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div class="am-wxt-setting-row">
                                        <div class="am-wxt-setting-label">关键词模式</div>
                                        <div class="am-wxt-setting-control">
                                            <div class="am-wxt-option-line" data-bind-select="am-wxt-keyword-mode"></div>
                                            <select id="am-wxt-keyword-mode" class="am-wxt-hidden-control">
                                                <option value="mixed">混合（手动优先 + 推荐补齐）</option>
                                                <option value="manual">仅手动</option>
                                                <option value="recommend">仅推荐</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div class="am-wxt-setting-row">
                                        <div class="am-wxt-setting-label">计划名前缀</div>
                                        <div class="am-wxt-setting-control">
                                            <input id="am-wxt-keyword-prefix" placeholder="例如：关键词推广_家电" />
                                        </div>
                                    </div>
                                    <div class="am-wxt-setting-row">
                                        <div class="am-wxt-setting-label">日均预算</div>
                                        <div class="am-wxt-setting-control">
                                            <input id="am-wxt-keyword-budget" placeholder="留空则用页面默认" />
                                        </div>
                                    </div>
                                    <div class="am-wxt-setting-row">
                                        <div class="am-wxt-setting-label">默认关键词出价</div>
                                        <div class="am-wxt-setting-control">
                                            <input id="am-wxt-keyword-bid" placeholder="默认 1.00" />
                                        </div>
                                    </div>
                                    <div class="am-wxt-setting-row">
                                        <div class="am-wxt-setting-label">推荐词目标数</div>
                                        <div class="am-wxt-setting-control">
                                            <input id="am-wxt-keyword-recommend-count" placeholder="默认 20" />
                                        </div>
                                    </div>
                                </div>
                                <div class="am-wxt-setting-row">
                                    <div class="am-wxt-setting-label">平均直接成交成本</div>
                                    <div class="am-wxt-setting-control am-wxt-setting-control-inline">
                                        <label class="am-wxt-inline-check">
                                            <input type="checkbox" id="am-wxt-keyword-single-cost-enable" />
                                            <span>启用（非必要）</span>
                                        </label>
                                        <input id="am-wxt-keyword-single-cost" placeholder="成本上限" style="width:140px;" />
                                    </div>
                                </div>
                                <div class="am-wxt-setting-row">
                                    <div class="am-wxt-setting-label">手动关键词</div>
                                    <div class="am-wxt-setting-control">
                                        <textarea id="am-wxt-keyword-manual" placeholder="手动关键词，每行一个，支持：关键词,出价,匹配方式（广泛/精准）"></textarea>
                                    </div>
                                </div>
                            </div>
                            <div id="am-wxt-keyword-scene-dynamic" class="am-wxt-scene-dynamic"></div>
                            <div class="am-wxt-actions">
                                <button class="am-wxt-btn" id="am-wxt-keyword-load-recommend">加载推荐关键词</button>
                                <button class="am-wxt-btn" id="am-wxt-keyword-load-crowd">加载推荐人群</button>
                                <button class="am-wxt-btn" id="am-wxt-keyword-scan-scenes">抓取全部场景参数</button>
                                <button class="am-wxt-btn" id="am-wxt-keyword-preview-btn">预览请求</button>
                                <button class="am-wxt-btn primary" id="am-wxt-keyword-run-btn">批量创建</button>
                                <button class="am-wxt-btn" id="am-wxt-keyword-toggle-debug">显示日志</button>
                                <button class="am-wxt-btn" id="am-wxt-keyword-clear-draft">清空会话草稿</button>
                            </div>
                            <div class="am-wxt-crowd-box">
                                <div class="am-wxt-crowd-title">
                                    <span>计划人群 <b id="am-wxt-keyword-crowd-count">0</b></span>
                                    <button class="am-wxt-btn" id="am-wxt-keyword-clear-crowd">清空人群</button>
                                </div>
                                <div class="am-wxt-crowd-list" id="am-wxt-keyword-crowd-list"></div>
                            </div>
                            <div id="am-wxt-keyword-debug-wrap" class="collapsed">
                                <pre id="am-wxt-keyword-preview"></pre>
                                <div id="am-wxt-keyword-log"></div>
                            </div>
                            <div class="am-wxt-detail-footer">
                                <button class="am-wxt-btn primary" id="am-wxt-keyword-back-simple">保存并关闭</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);

            wizardState.els = {
                overlay,
                closeBtn: overlay.querySelector('#am-wxt-keyword-close'),
                detailBackdrop: overlay.querySelector('#am-wxt-keyword-detail-backdrop'),
                searchInput: overlay.querySelector('#am-wxt-keyword-search-input'),
                searchBtn: overlay.querySelector('#am-wxt-keyword-search'),
                hotBtn: overlay.querySelector('#am-wxt-keyword-hot'),
                allBtn: overlay.querySelector('#am-wxt-keyword-all'),
                addAllBtn: overlay.querySelector('#am-wxt-keyword-add-all'),
                candidateList: overlay.querySelector('#am-wxt-keyword-candidate-list'),
                addedList: overlay.querySelector('#am-wxt-keyword-added-list'),
                addedCount: overlay.querySelector('#am-wxt-keyword-added-count'),
                clearAddedBtn: overlay.querySelector('#am-wxt-keyword-clear-added'),
                strategyList: overlay.querySelector('#am-wxt-keyword-strategy-list'),
                strategyCount: overlay.querySelector('#am-wxt-keyword-strategy-count'),
                runQuickBtn: overlay.querySelector('#am-wxt-keyword-run-quick'),
                previewQuickBtn: overlay.querySelector('#am-wxt-keyword-preview-quick'),
                quickLog: overlay.querySelector('#am-wxt-keyword-quick-log'),
                detailConfig: overlay.querySelector('#am-wxt-keyword-detail-config'),
                detailTitle: overlay.querySelector('#am-wxt-keyword-detail-title'),
                detailCloseBtn: overlay.querySelector('#am-wxt-keyword-detail-close'),
                backSimpleBtn: overlay.querySelector('#am-wxt-keyword-back-simple'),
                sceneSelect: overlay.querySelector('#am-wxt-keyword-scene-select'),
                bidModeSelect: overlay.querySelector('#am-wxt-keyword-bid-mode'),
                sceneDynamic: overlay.querySelector('#am-wxt-keyword-scene-dynamic'),
                bidTargetSelect: overlay.querySelector('#am-wxt-keyword-bid-target'),
                budgetTypeSelect: overlay.querySelector('#am-wxt-keyword-budget-type'),
                prefixInput: overlay.querySelector('#am-wxt-keyword-prefix'),
                budgetInput: overlay.querySelector('#am-wxt-keyword-budget'),
                bidInput: overlay.querySelector('#am-wxt-keyword-bid'),
                singleCostEnableInput: overlay.querySelector('#am-wxt-keyword-single-cost-enable'),
                singleCostInput: overlay.querySelector('#am-wxt-keyword-single-cost'),
                modeSelect: overlay.querySelector('#am-wxt-keyword-mode'),
                recommendCountInput: overlay.querySelector('#am-wxt-keyword-recommend-count'),
                manualInput: overlay.querySelector('#am-wxt-keyword-manual'),
                loadRecommendBtn: overlay.querySelector('#am-wxt-keyword-load-recommend'),
                loadCrowdBtn: overlay.querySelector('#am-wxt-keyword-load-crowd'),
                scanScenesBtn: overlay.querySelector('#am-wxt-keyword-scan-scenes'),
                previewBtn: overlay.querySelector('#am-wxt-keyword-preview-btn'),
                runBtn: overlay.querySelector('#am-wxt-keyword-run-btn'),
                toggleDebugBtn: overlay.querySelector('#am-wxt-keyword-toggle-debug'),
                clearDraftBtn: overlay.querySelector('#am-wxt-keyword-clear-draft'),
                crowdCount: overlay.querySelector('#am-wxt-keyword-crowd-count'),
                crowdList: overlay.querySelector('#am-wxt-keyword-crowd-list'),
                clearCrowdBtn: overlay.querySelector('#am-wxt-keyword-clear-crowd'),
                debugWrap: overlay.querySelector('#am-wxt-keyword-debug-wrap'),
                preview: overlay.querySelector('#am-wxt-keyword-preview'),
                log: overlay.querySelector('#am-wxt-keyword-log')
            };

            const ensureQuickLogContainer = () => {
                if (wizardState?.els?.quickLog instanceof HTMLElement) return wizardState.els.quickLog;
                const strategyBoard = wizardState?.els?.overlay?.querySelector('.am-wxt-strategy-board');
                if (!strategyBoard) return null;
                let quickLog = strategyBoard.querySelector('#am-wxt-keyword-quick-log');
                if (!quickLog) {
                    quickLog = document.createElement('div');
                    quickLog.id = 'am-wxt-keyword-quick-log';
                    strategyBoard.appendChild(quickLog);
                }
                if (wizardState?.els) wizardState.els.quickLog = quickLog;
                return quickLog;
            };

            const appendWizardLog = (text, type = 'info') => {
                const timestampText = `[${new Date().toLocaleTimeString('zh-CN', { hour12: false })}] ${text}`;
                const appendLine = (container, maxLines = 120) => {
                    if (!container) return;
                    const line = document.createElement('div');
                    line.className = `line ${type}`;
                    line.textContent = timestampText;
                    container.appendChild(line);
                    while (container.children.length > maxLines) {
                        container.removeChild(container.firstChild);
                    }
                    container.scrollTop = container.scrollHeight;
                };

                appendLine(ensureQuickLogContainer(), 40);
                appendLine(wizardState.els.log, 160);
            };

            const formatKeywordLine = (word) => {
                const bid = toNumber(word?.bidPrice, 1);
                const matchText = parseMatchScope(word?.matchScope, DEFAULTS.matchScope) === 1 ? '精准' : '广泛';
                return `${String(word?.word || '').trim()},${bid.toFixed(2)},${matchText}`;
            };

            const getCrowdDisplayName = (crowdItem = {}) => {
                const label = crowdItem?.crowd?.label || {};
                const crowdName = String(crowdItem?.crowd?.crowdName || '').trim();
                if (crowdName) return crowdName;
                const labelName = String(label?.labelName || '').trim();
                const optionNames = uniqueBy(
                    (label?.optionList || []).map(option => String(option?.optionName || '').trim()).filter(Boolean),
                    name => name
                ).join('，');
                return uniqueBy([labelName, optionNames].filter(Boolean), name => name).join('：') || '未命名人群';
            };

            const setDebugVisible = (visible) => {
                wizardState.debugVisible = !!visible;
                if (wizardState.els.debugWrap) {
                    wizardState.els.debugWrap.classList.toggle('collapsed', !wizardState.debugVisible);
                }
                if (wizardState.els.toggleDebugBtn) {
                    wizardState.els.toggleDebugBtn.textContent = wizardState.debugVisible ? '隐藏日志' : '显示日志';
                }
            };

            const renderSelectOptionLine = (selectEl) => {
                if (!(selectEl instanceof HTMLSelectElement)) return;
                const line = wizardState?.els?.detailConfig?.querySelector(`[data-bind-select="${selectEl.id}"]`);
                if (!(line instanceof HTMLElement)) return;
                const currentValue = String(selectEl.value || '');
                const options = Array.from(selectEl.options || []);
                line.innerHTML = '';
                options.forEach((option) => {
                    const value = String(option?.value || '');
                    const text = String(option?.textContent || option?.label || value);
                    const chip = document.createElement('button');
                    chip.type = 'button';
                    chip.className = `am-wxt-option-chip${value === currentValue ? ' active' : ''}`;
                    chip.textContent = text;
                    chip.disabled = !!selectEl.disabled;
                    chip.onclick = () => {
                        if (selectEl.disabled) return;
                        if (selectEl.value !== value) {
                            selectEl.value = value;
                            selectEl.dispatchEvent(new Event('input', { bubbles: true }));
                        }
                        selectEl.dispatchEvent(new Event('change', { bubbles: true }));
                        renderSelectOptionLine(selectEl);
                    };
                    line.appendChild(chip);
                });
            };

            const renderStaticOptionLines = () => {
                renderSelectOptionLine(wizardState?.els?.sceneSelect);
                renderSelectOptionLine(wizardState?.els?.bidModeSelect);
                renderSelectOptionLine(wizardState?.els?.bidTargetSelect);
                renderSelectOptionLine(wizardState?.els?.budgetTypeSelect);
                renderSelectOptionLine(wizardState?.els?.modeSelect);
            };

            const BID_TARGET_OPTIONS = [
                { value: 'conv', label: '获取成交量' },
                { value: 'similar_item', label: '相似品跟投' },
                { value: 'search_rank', label: '抢占搜索卡位' },
                { value: 'market_penetration', label: '提升市场渗透' },
                { value: 'fav_cart', label: '增加收藏加购量' },
                { value: 'click', label: '增加点击量' },
                { value: 'roi', label: '稳定投产比' }
            ];
            const SCENE_OPTIONS = SCENE_NAME_LIST.slice();
            const escapeRegExp = (text = '') => String(text || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const isAutoGeneratedPlanPrefix = (prefix = '') => {
                const value = String(prefix || '').trim();
                if (!value) return true;
                if (/^[^_\s]+_\d{8}$/.test(value) || /^[^_\s]+_\d{14}$/.test(value)) return true;
                return SCENE_OPTIONS.some(scene => {
                    const escaped = escapeRegExp(scene);
                    return new RegExp(`^${escaped}_\\d{8}$`).test(value) || new RegExp(`^${escaped}_\\d{14}$`).test(value);
                });
            };
            const buildDefaultPlanPrefixByScene = (sceneName = '') => buildSceneTimePrefix(sceneName || wizardState?.draft?.sceneName || '关键词推广');
            const getCurrentEditorSceneName = () => {
                const selected = String(wizardState?.els?.sceneSelect?.value || wizardState?.draft?.sceneName || '关键词推广').trim();
                return SCENE_OPTIONS.includes(selected) ? selected : '关键词推广';
            };
            const createStrategyCloneId = (seed = 'strategy') => `${String(seed || 'strategy').replace(/[^\w]/g, '_')}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
            const createStrategyCloneName = (baseName = '') => {
                const sourceName = String(baseName || '').trim() || '计划';
                const usedNameSet = new Set((wizardState.strategyList || []).map(item => String(item?.name || '').trim()).filter(Boolean));
                let candidate = `${sourceName}_复制`;
                let cursor = 2;
                while (usedNameSet.has(candidate) && cursor < 99) {
                    candidate = `${sourceName}_复制${cursor}`;
                    cursor += 1;
                }
                return candidate;
            };
            const ensureUniqueStrategyPlanName = (basePlanName = '', ignoreStrategyId = '') => {
                const seed = String(basePlanName || '').trim();
                if (!seed) return buildDefaultPlanPrefixByScene(getCurrentEditorSceneName());
                const usedPlanNames = new Set(
                    (wizardState.strategyList || [])
                        .filter(item => String(item?.id || '') !== String(ignoreStrategyId || ''))
                        .map(item => String(item?.planName || '').trim())
                        .filter(Boolean)
                );
                if (!usedPlanNames.has(seed)) return seed;
                let cursor = 2;
                let candidate = `${seed}_${cursor}`;
                while (usedPlanNames.has(candidate) && cursor < 99) {
                    cursor += 1;
                    candidate = `${seed}_${cursor}`;
                }
                return candidate;
            };
            const buildCopiedStrategyPlanName = (sourcePlanName = '', sceneName = '') => {
                const raw = String(sourcePlanName || '').trim();
                const fallback = buildDefaultPlanPrefixByScene(sceneName || getCurrentEditorSceneName());
                const stamp = nowStampSeconds();
                if (!raw) return ensureUniqueStrategyPlanName(fallback);
                let next = '';
                if (/_\d{8,14}$/.test(raw)) {
                    next = raw.replace(/_\d{8,14}$/, `_${stamp}`);
                } else {
                    next = `${raw}_${stamp}`;
                }
                return ensureUniqueStrategyPlanName(next);
            };
            const getStrategyTargetLabel = (strategy = {}) => {
                const bidTargetValue = String(strategy?.bidTargetV2 || DEFAULTS.bidTargetV2).trim() || DEFAULTS.bidTargetV2;
                return BID_TARGET_OPTIONS.find(item => item.value === bidTargetValue)?.label || '获取成交量';
            };
            const getStrategyMainLabel = (strategy = {}) => {
                const sceneLabel = getCurrentEditorSceneName();
                const fallback = buildDefaultPlanPrefixByScene(sceneLabel);
                return String(strategy?.planName || wizardState?.draft?.planNamePrefix || fallback).trim() || fallback;
            };
            const updateBidModeControls = (modeValue = 'smart') => {
                const bidMode = normalizeBidMode(modeValue, 'smart');
                const isManual = bidMode === 'manual';
                if (wizardState.els.bidModeSelect) {
                    wizardState.els.bidModeSelect.value = bidMode;
                }
                if (wizardState.els.bidTargetSelect) {
                    wizardState.els.bidTargetSelect.disabled = isManual;
                    wizardState.els.bidTargetSelect.title = isManual ? '手动出价模式下不启用出价目标' : '';
                }
                if (wizardState.els.singleCostEnableInput) {
                    if (isManual) wizardState.els.singleCostEnableInput.checked = false;
                    wizardState.els.singleCostEnableInput.disabled = isManual;
                }
                if (wizardState.els.singleCostInput) {
                    wizardState.els.singleCostInput.disabled = isManual || !wizardState.els.singleCostEnableInput?.checked;
                }
                renderStaticOptionLines();
            };
            const SCENE_REQUIREMENT_FALLBACK = {
                '货品全站推广': ['选择推广商品', '添加商品', '设置商品推广方案', '设置预算', '预算类型', '设置基础信息', '计划名称', '高级设置'],
                '关键词推广': ['营销目标', '选择卡位方案', '核心词设置', '添加商品', '卡位方式', '设置预算', '预算类型', '设置基础信息', '计划名称', '高级设置'],
                '人群推广': ['营销目标', '选择拉新方案', '选择推广商品', '添加商品', '设置拉新人群', '选择方式', '设置预算及排期', '预算类型', '设置基础信息', '计划名称', '高级设置'],
                '店铺直达': ['设置创意', '设置推广方案', '设置词包', '设置预算及排期', '预算类型', '每日预算', '设置基础信息', '计划名称', '高级设置'],
                '内容营销': ['选择优化方向', '选择方案', '优化目标', '选择推广主体', '设置预算及排期', '投放日期', '出价方式', '设置人群', '设置基础信息', '设置创意', '计划名称', '高级设置'],
                '线索推广': ['营销目标', '选择解决方案', '投放策略', '优化目标', '选择推广商品', '添加商品', '核心词设置', '种子人群', '套餐包', '投放日期', '设置预算及排期', '设置基础信息', '计划名称', '高级设置']
            };
            const SCENE_FIELD_OPTION_FALLBACK = [
                { pattern: /(营销目标|选择卡位方案|选择拉新方案|选择方案|选择优化方向|选择解决方案|投放策略|推广模式)/, options: [] },
                { pattern: /(预算类型)/, options: ['每日预算', '日均预算', '总预算'] },
                { pattern: /(出价方式)/, options: ['智能出价', '手动出价', '最大化拿量', '控成本', '控投产比'] },
                { pattern: /(出价目标|优化目标)/, options: ['获取成交量', '稳定投产比', '增加点击量', '增加收藏加购量', '提升市场渗透', '优化留资获客成本', '拉新渗透', '扩大新客规模', '稳定新客投产比', '新客收藏加购', '增加净成交金额', '增加成交金额', '增加观看次数', '增加观看时长'] },
                { pattern: /(关键词设置|核心词设置|设置词包)/, options: ['添加关键词', '系统推荐词', '手动自选词'] },
                { pattern: /(人群设置|种子人群|设置拉新人群|设置人群)/, options: ['智能人群', '添加种子人群', '设置优先投放客户'] },
                { pattern: /(选品方式|选择推广商品)/, options: ['自定义选品', '行业推荐选品'] },
                { pattern: /(投放时间|投放日期|排期)/, options: ['长期投放', '不限时段', '固定时段'] }
            ];
            const SCENE_FALLBACK_OPTION_MAP = {
                '货品全站推广': {
                    营销目标: ['货品全站推广'],
                    选品方式: ['自定义选品', '行业推荐选品'],
                    出价方式: ['最大化拿量', '控成本', '控投产比'],
                    出价目标: ['获取成交量', '稳定投产比', '增加点击量', '增加收藏加购量', '提升市场渗透'],
                    预算类型: ['每日预算', '日均预算']
                },
                '关键词推广': {
                    营销目标: ['搜索卡位', '趋势明星', '流量金卡', '自定义推广'],
                    选择卡位方案: ['搜索卡位', '趋势明星', '流量金卡', '自定义推广'],
                    卡位方式: ['抢首条', '抢前三', '抢首页'],
                    出价方式: ['智能出价', '手动出价'],
                    出价目标: ['获取成交量', '相似品跟投', '抢占搜索卡位', '提升市场渗透', '增加收藏加购量', '增加点击量', '稳定投产比'],
                    优化目标: ['获取成交量', '相似品跟投', '抢占搜索卡位', '提升市场渗透', '增加收藏加购量', '增加点击量', '稳定投产比'],
                    预算类型: ['每日预算', '日均预算']
                },
                '人群推广': {
                    营销目标: ['高效拉新', '竞店拉新', '借势转化', '机会人群拉新', '跨类目拉新'],
                    选择拉新方案: ['高效拉新', '竞店拉新', '借势转化', '机会人群拉新', '跨类目拉新'],
                    投放策略: ['高效拉新', '竞店拉新', '借势转化', '机会人群拉新', '跨类目拉新'],
                    出价方式: ['手动出价'],
                    出价目标: ['拉新渗透', '扩大新客规模', '稳定新客投产比', '新客收藏加购'],
                    优化目标: ['拉新渗透', '扩大新客规模', '稳定新客投产比', '新客收藏加购'],
                    预算类型: ['每日预算', '日均预算']
                },
                '店铺直达': {
                    推广模式: ['持续推广'],
                    出价方式: ['智能出价', '手动出价'],
                    出价目标: ['获取成交量', '稳定投产比', '增加点击量'],
                    预算类型: ['每日预算', '日均预算']
                },
                '内容营销': {
                    营销目标: ['直播间成长', '商品打爆', '拉新增粉'],
                    选择优化方向: ['直播间成长', '商品打爆', '拉新增粉'],
                    选择方案: ['直播间成长', '商品打爆', '拉新增粉'],
                    出价方式: ['最大化拿量', '控成本'],
                    优化目标: ['增加净成交金额', '增加成交金额', '增加观看次数', '增加观看时长'],
                    预算类型: ['每日预算', '日均预算']
                },
                '线索推广': {
                    营销目标: ['收集销售线索', '行业解决方案'],
                    选择解决方案: ['行业解决方案', '自定义方案'],
                    解决方案: ['行业解决方案', '自定义方案'],
                    投放策略: ['行业解决方案', '自定义方案'],
                    出价方式: ['最大化拿量', '控成本'],
                    优化目标: ['优化留资获客成本', '获取成交量'],
                    预算类型: ['每日预算', '日均预算']
                }
            };
            const SCENE_STRICT_OPTION_TYPE_SET = new Set(['goal', 'bidType', 'bidTarget', 'budgetType', 'itemMode', 'keyword', 'crowd', 'schedule']);

            const normalizeSceneFieldKey = (label = '') => {
                const normalized = String(label || '')
                    .trim()
                    .replace(/[^\u4e00-\u9fa5A-Za-z0-9]+/g, '_')
                    .replace(/^_+|_+$/g, '');
                return normalized || 'field';
            };

            const ensureSceneSettingBucket = (sceneName) => {
                wizardState.draft = wizardState.draft || wizardDefaultDraft();
                if (!isPlainObject(wizardState.draft.sceneSettingValues)) {
                    wizardState.draft.sceneSettingValues = {};
                }
                if (!isPlainObject(wizardState.draft.sceneSettingValues[sceneName])) {
                    wizardState.draft.sceneSettingValues[sceneName] = {};
                }
                return wizardState.draft.sceneSettingValues[sceneName];
            };

            const ensureSceneTouchedBucket = (sceneName) => {
                wizardState.draft = wizardState.draft || wizardDefaultDraft();
                if (!isPlainObject(wizardState.draft.sceneSettingTouched)) {
                    wizardState.draft.sceneSettingTouched = {};
                }
                if (!isPlainObject(wizardState.draft.sceneSettingTouched[sceneName])) {
                    wizardState.draft.sceneSettingTouched[sceneName] = {};
                }
                return wizardState.draft.sceneSettingTouched[sceneName];
            };

            const normalizeSceneLabelToken = (text = '') => normalizeText(String(text || '').replace(/[：:]/g, ''));
            const shouldRenderDynamicSceneField = (fieldLabel = '', sceneName = '') => {
                const token = normalizeSceneLabelToken(fieldLabel);
                if (!token) return false;
                if (token.length > 24) return false;
                if (!isLikelyFieldLabel(token)) return false;
                if (SCENE_SECTION_ONLY_LABEL_RE.test(token)) return false;
                if (SCENE_LABEL_NOISE_RE.test(token) || token.includes('·')) return false;
                if (SCENE_DYNAMIC_FIELD_BLOCK_RE.test(token)) return false;
                const strictAllow = SCENE_FIELD_LABEL_RE.test(token) || /^(campaign\.|adgroup\.)/i.test(token);
                if (!strictAllow) return false;
                const normalizedSceneName = String(sceneName || wizardState?.draft?.sceneName || '').trim();
                const isKeywordScene = normalizedSceneName === '关键词推广';
                const duplicatedRules = [
                    /场景(名称|选择)?/,
                    /营销场景/,
                    /出价方式/,
                    /出价目标/,
                    /优化目标/,
                    /预算类型/,
                    /每日预算/,
                    /日均预算/,
                    /总预算/,
                    /计划(名称|名)/,
                    /选择推广商品/,
                    /选择卡位方案/,
                    /添加商品/
                ];
                if (isKeywordScene) {
                    duplicatedRules.push(
                        /关键词模式/,
                        /关键词设置/,
                        /核心词设置/,
                        /平均直接成交成本/
                    );
                }
                return !duplicatedRules.some(rule => rule.test(token));
            };
            const isSceneLabelMatch = (left = '', right = '') => {
                const a = normalizeSceneLabelToken(left);
                const b = normalizeSceneLabelToken(right);
                if (!a || !b) return false;
                return a === b || a.includes(b) || b.includes(a);
            };

            const toShortSceneValue = (text = '') => {
                const normalized = normalizeSceneSettingValue(text);
                if (!normalized) return '';
                if (normalized.length > 24) return '';
                return normalized;
            };

            const pickSceneValueFromOptions = (candidate = '', options = []) => {
                const text = normalizeSceneSettingValue(candidate);
                if (!text || !Array.isArray(options) || !options.length) return '';
                const exact = options.find(opt => opt === text);
                if (exact) return exact;
                const included = options.find(opt => text.includes(opt) || opt.includes(text));
                if (included) return included;
                return '';
            };

            const isSceneOptionMatch = (left = '', right = '') => {
                const a = normalizeSceneOptionText(left);
                const b = normalizeSceneOptionText(right);
                if (!a || !b) return false;
                return a === b || a.includes(b) || b.includes(a);
            };

            const resolveSceneFieldOptionType = (fieldLabel = '') => {
                const token = normalizeSceneLabelToken(fieldLabel);
                if (!token) return '';
                if (/(营销目标|选择卡位方案|选择拉新方案|选择方案|选择优化方向|选择解决方案|投放策略|推广模式|卡位方式|选择方式)/.test(token)) return 'goal';
                if (/(出价方式)/.test(token)) return 'bidType';
                if (/(出价目标|优化目标)/.test(token)) return 'bidTarget';
                if (/(预算类型)/.test(token)) return 'budgetType';
                if (/(选品方式|选择推广商品)/.test(token)) return 'itemMode';
                if (/(关键词设置|核心词设置|设置词包)/.test(token)) return 'keyword';
                if (/(人群设置|种子人群|设置拉新人群|设置人群)/.test(token)) return 'crowd';
                if (/(投放时间|投放日期|排期)/.test(token)) return 'schedule';
                return '';
            };

            const resolveSceneFallbackOptionSeed = (sceneName = '', fieldLabel = '') => {
                const normalizedSceneName = String(sceneName || '').trim();
                const normalizedLabel = normalizeSceneLabelToken(fieldLabel);
                const sceneOptionMap = isPlainObject(SCENE_FALLBACK_OPTION_MAP[normalizedSceneName])
                    ? SCENE_FALLBACK_OPTION_MAP[normalizedSceneName]
                    : {};
                const options = [];
                let matchedSceneOptionRule = false;
                Object.keys(sceneOptionMap).forEach(ruleLabel => {
                    const normalizedRuleLabel = normalizeSceneLabelToken(ruleLabel);
                    if (!normalizedRuleLabel || !normalizedLabel) return;
                    if (!isSceneLabelMatch(normalizedRuleLabel, normalizedLabel)) return;
                    options.push(...(sceneOptionMap[ruleLabel] || []));
                    matchedSceneOptionRule = true;
                });
                if (!options.length) {
                    SCENE_FIELD_OPTION_FALLBACK.forEach(rule => {
                        if (rule.pattern.test(normalizedLabel)) options.push(...rule.options);
                    });
                }
                const isGoalSelectorLabel = /营销目标/.test(normalizedLabel)
                    || (!/选择解决方案/.test(normalizedLabel) && /^(选择卡位方案|选择拉新方案|选择优化方向|选择方式|推广模式|选择方案)$/.test(normalizedLabel));
                if (resolveSceneFieldOptionType(normalizedLabel) === 'goal' && (isGoalSelectorLabel || !matchedSceneOptionRule)) {
                    options.push(...getSceneMarketingGoalFallbackList(normalizedSceneName));
                }
                return uniqueBy(
                    options
                        .map(item => normalizeSceneOptionText(item))
                        .filter(item => isLikelySceneOptionValue(item))
                        .filter(item => !SCENE_DYNAMIC_FIELD_BLOCK_RE.test(item)),
                    item => item
                ).slice(0, 24);
            };

            const filterSceneOptionsByType = ({ sceneName = '', fieldLabel = '', options = [], fallbackOptions = [] }) => {
                const optionType = resolveSceneFieldOptionType(fieldLabel);
                const normalizedOptions = uniqueBy(
                    (Array.isArray(options) ? options : [])
                        .map(item => normalizeSceneOptionText(item))
                        .filter(item => isLikelySceneOptionValue(item))
                        .filter(item => !SCENE_DYNAMIC_FIELD_BLOCK_RE.test(item)),
                    item => item
                );
                const normalizedFallback = uniqueBy(
                    (Array.isArray(fallbackOptions) ? fallbackOptions : [])
                        .map(item => normalizeSceneOptionText(item))
                        .filter(item => isLikelySceneOptionValue(item))
                        .filter(item => !SCENE_DYNAMIC_FIELD_BLOCK_RE.test(item)),
                    item => item
                );
                if (!SCENE_STRICT_OPTION_TYPE_SET.has(optionType)) {
                    return uniqueBy(normalizedOptions.concat(normalizedFallback), item => item).slice(0, 24);
                }
                if (!normalizedFallback.length) {
                    return normalizedOptions.slice(0, 24);
                }
                const matched = normalizedOptions.filter(item => normalizedFallback.some(seed => isSceneOptionMatch(item, seed)));
                const merged = matched.length
                    ? uniqueBy(matched.concat(normalizedFallback), item => item)
                    : normalizedFallback.slice();
                if (optionType === 'goal' && /营销目标/.test(normalizeSceneLabelToken(fieldLabel))) {
                    const sceneGoals = getSceneMarketingGoalFallbackList(sceneName);
                    if (sceneGoals.length) {
                        const goalMatched = merged.filter(item => sceneGoals.some(goal => isSceneOptionMatch(item, goal)));
                        if (goalMatched.length) return uniqueBy(goalMatched.concat(sceneGoals), item => item).slice(0, 24);
                        return uniqueBy(sceneGoals.concat(merged), item => item).slice(0, 24);
                    }
                }
                return merged.slice(0, 24);
            };

            const toOptionGroupMap = (entry = {}) => {
                const map = {};
                (entry.sections || []).forEach(section => {
                    const title = String(section?.title || '').trim();
                    const options = Array.isArray(section?.options)
                        ? section.options.map(item => normalizeSceneOptionText(item)).filter(item => isLikelySceneOptionValue(item))
                        : [];
                    if (!title || options.length < 2) return;
                    map[title] = uniqueBy((map[title] || []).concat(options), item => item).slice(0, 12);
                });
                (entry.optionGroups || []).forEach(group => {
                    const title = String(group?.label || '').trim();
                    const options = Array.isArray(group?.options)
                        ? group.options.map(item => normalizeSceneOptionText(item)).filter(item => isLikelySceneOptionValue(item))
                        : [];
                    if (!title || options.length < 2) return;
                    map[title] = uniqueBy((map[title] || []).concat(options), item => item).slice(0, 12);
                });
                (entry.radios || []).forEach(radio => {
                    const title = String(radio?.label || '').trim();
                    const text = normalizeSceneOptionText(radio?.text || '');
                    if (!isLikelySceneOptionValue(text)) return;
                    if (!title || !text) return;
                    map[title] = uniqueBy((map[title] || []).concat([text]), item => item).slice(0, 12);
                });
                return map;
            };

            const buildProfileFromSceneSpec = (sceneName = '', spec = null) => {
                const fieldList = Array.isArray(spec?.fields) ? spec.fields : [];
                const requiredFields = [];
                const optionGroups = {};
                const fieldDefaults = {};
                const fieldMeta = {};
                fieldList.forEach(field => {
                    const label = normalizeText(field?.settingKey || field?.label || '').replace(/[：:]/g, '').trim();
                    if (!label || !isLikelyFieldLabel(label)) return;
                    requiredFields.push(label);
                    const key = normalizeSceneFieldKey(label);
                    const rawOptions = uniqueBy(
                        (Array.isArray(field?.options) ? field.options : [])
                            .map(item => normalizeSceneOptionText(item))
                            .filter(item => isLikelySceneOptionValue(item)),
                        item => item
                    ).slice(0, 36);
                    const options = filterSceneOptionsByType({
                        sceneName,
                        fieldLabel: label,
                        options: rawOptions,
                        fallbackOptions: resolveSceneFallbackOptionSeed(sceneName, label)
                    });
                    if (options.length) optionGroups[label] = options;
                    const defaultValue = normalizeSceneSettingValue(field?.defaultValue || '');
                    if (defaultValue) fieldDefaults[key] = defaultValue;
                    fieldMeta[key] = {
                        key,
                        label,
                        options,
                        defaultValue,
                        requiredGuess: !!field?.requiredGuess,
                        criticalGuess: !!field?.criticalGuess,
                        triggerPath: normalizeText(field?.triggerPath || ''),
                        dependsOn: Array.isArray(field?.dependsOn)
                            ? uniqueBy(field.dependsOn.map(item => normalizeText(item)).filter(Boolean), item => item).slice(0, 10)
                            : []
                    };
                });
                const dedupRequiredFields = uniqueBy(requiredFields, item => item);
                return {
                    sceneName,
                    requiredFields: dedupRequiredFields,
                    optionGroups,
                    fieldDefaults,
                    fieldMeta,
                    source: 'scene_spec',
                    coverage: deepClone(spec?.coverage || {})
                };
            };

            const buildSceneProfiles = () => {
                const profiles = {};
                SCENE_OPTIONS.forEach(sceneName => {
                    profiles[sceneName] = {
                        sceneName,
                        requiredFields: (SCENE_REQUIREMENT_FALLBACK[sceneName] || []).slice(),
                        optionGroups: {},
                        fieldDefaults: {},
                        fieldMeta: {},
                        source: 'fallback'
                    };
                });

                SCENE_OPTIONS.forEach(sceneName => {
                    const sceneBizCode = resolveSceneBizCodeHint(sceneName) || SCENE_BIZCODE_HINT_FALLBACK[sceneName] || '';
                    const cachedSpec = getCachedSceneSpec(sceneName, sceneBizCode);
                    if (!cachedSpec?.ok || !Array.isArray(cachedSpec?.fields)) return;
                    const specProfile = buildProfileFromSceneSpec(sceneName, cachedSpec);
                    if (!specProfile.requiredFields.length) return;
                    profiles[sceneName] = {
                        ...profiles[sceneName],
                        ...specProfile,
                        requiredFields: uniqueBy(
                            (specProfile.requiredFields || []).concat(profiles[sceneName]?.requiredFields || []),
                            item => item
                        ).slice(0, 120),
                        optionGroups: mergeDeep({}, profiles[sceneName]?.optionGroups || {}, specProfile.optionGroups || {}),
                        fieldDefaults: mergeDeep({}, profiles[sceneName]?.fieldDefaults || {}, specProfile.fieldDefaults || {}),
                        fieldMeta: mergeDeep({}, profiles[sceneName]?.fieldMeta || {}, specProfile.fieldMeta || {}),
                        source: 'scene_spec'
                    };
                });

                const scan = window.__AM_WXT_LAST_SCENE_SCAN__;
                if (!scan || !Array.isArray(scan.list)) return profiles;

                scan.list.forEach(entry => {
                    if (!entry?.ok) return;
                    const sceneName = String(entry.sceneName || '').trim();
                    if (!SCENE_OPTIONS.includes(sceneName)) return;
                    const profile = profiles[sceneName] || {
                        sceneName,
                        requiredFields: [],
                        optionGroups: {},
                        fieldDefaults: {},
                        fieldMeta: {},
                        source: 'scan'
                    };
                    const dynamicFields = uniqueBy([
                        ...(profile.requiredFields || []),
                        ...(entry.labels || []).filter(text => isLikelyFieldLabel(text)).slice(0, 20),
                        ...(entry.sectionTitles || []).filter(text => isLikelyFieldLabel(text)).slice(0, 10)
                    ], item => item).slice(0, 30);
                    profile.requiredFields = dynamicFields;
                    profile.optionGroups = mergeDeep(profile.optionGroups || {}, toOptionGroupMap(entry));
                    profile.source = profile.source === 'scene_spec' ? 'scene_spec' : 'scan';
                    profiles[sceneName] = profile;
                });
                return profiles;
            };

            const getSceneProfile = (sceneName) => {
                if (!isPlainObject(wizardState.sceneProfiles) || !Object.keys(wizardState.sceneProfiles).length) {
                    wizardState.sceneProfiles = buildSceneProfiles();
                }
                return wizardState.sceneProfiles?.[sceneName] || {
                    sceneName,
                    requiredFields: (SCENE_REQUIREMENT_FALLBACK[sceneName] || []).slice(),
                    optionGroups: {},
                    fieldDefaults: {},
                    fieldMeta: {},
                    source: 'fallback'
                };
            };

            const refreshSceneProfileFromSpec = async (sceneName = '', options = {}) => {
                const targetSceneName = String(sceneName || '').trim();
                if (!targetSceneName || !SCENE_OPTIONS.includes(targetSceneName)) return null;
                const requestId = toNumber(wizardState.sceneProfileRequestId, 0) + 1;
                wizardState.sceneProfileRequestId = requestId;
                const scanMode = options.scanMode || 'full_top_down';
                const unlockPolicy = options.unlockPolicy || 'safe_only';
                const refresh = !!options.refresh;
                const silent = options.silent !== false;
                try {
                    const spec = await getSceneSpec(targetSceneName, {
                        scanMode,
                        unlockPolicy,
                        goalScan: options.goalScan !== false,
                        refresh
                    });
                    if (requestId !== wizardState.sceneProfileRequestId) return spec;
                    if (!spec?.ok || !Array.isArray(spec?.fields) || !spec.fields.length) {
                        if (!silent) {
                            appendWizardLog(`场景设置同步失败：${targetSceneName} 未获取到有效字段`, 'error');
                        }
                        return spec;
                    }
                    wizardState.sceneProfiles = buildSceneProfiles();
                    const currentScene = String(wizardState.els.sceneSelect?.value || wizardState.draft?.sceneName || '').trim();
                    if (currentScene === targetSceneName) {
                        renderSceneDynamicConfig();
                        syncDraftFromUI();
                        if (typeof wizardState.buildRequest === 'function') {
                            wizardState.renderPreview(wizardState.buildRequest());
                        }
                    }
                    if (!silent) {
                        appendWizardLog(`场景设置已对齐：${targetSceneName}（字段 ${spec.fields.length}，目标 ${(spec.goals || []).length}）`, 'success');
                    }
                    return spec;
                } catch (err) {
                    if (!silent) {
                        appendWizardLog(`场景设置同步异常：${err?.message || err}`, 'error');
                    }
                    return null;
                }
            };

            const resolveSceneFieldOptions = (profile, fieldLabel) => {
                const sceneName = String(profile?.sceneName || wizardState?.els?.sceneSelect?.value || wizardState?.draft?.sceneName || '').trim();
                const normalizedKey = normalizeSceneFieldKey(fieldLabel);
                const metaOptions = Array.isArray(profile?.fieldMeta?.[normalizedKey]?.options)
                    ? profile.fieldMeta[normalizedKey].options
                    : [];
                const options = [];
                if (metaOptions.length) options.push(...metaOptions);
                const groups = isPlainObject(profile?.optionGroups) ? profile.optionGroups : {};
                Object.keys(groups).forEach(groupLabel => {
                    if (!groupLabel) return;
                    if (!isSceneLabelMatch(fieldLabel, groupLabel)) return;
                    options.push(...(groups[groupLabel] || []));
                });
                const fallbackOptions = resolveSceneFallbackOptionSeed(sceneName, fieldLabel);
                const filteredOptions = filterSceneOptionsByType({
                    sceneName,
                    fieldLabel,
                    options,
                    fallbackOptions
                });
                if (filteredOptions.length) return filteredOptions.slice(0, 24);
                return fallbackOptions.slice(0, 24);
            };

            const resolveSceneFieldHeuristicDefault = (fieldLabel = '', options = []) => {
                const normalizedLabel = normalizeSceneLabelToken(fieldLabel);
                const optionList = Array.isArray(options) ? options : [];
                const currentSceneName = String(wizardState?.els?.sceneSelect?.value || wizardState?.draft?.sceneName || '关键词推广').trim() || '关键词推广';
                const fallbackOptions = resolveSceneFallbackOptionSeed(currentSceneName, normalizedLabel);
                const sceneDefaults = isPlainObject(SCENE_SPEC_FIELD_FALLBACK[currentSceneName]) ? SCENE_SPEC_FIELD_FALLBACK[currentSceneName] : {};
                const pickByText = (candidate = '', fallbackRaw = false) => {
                    const mapped = pickSceneValueFromOptions(candidate, optionList);
                    if (mapped) return mapped;
                    if (!fallbackRaw) return '';
                    return toShortSceneValue(candidate);
                };
                if (!normalizedLabel) return '';

                if (/预算类型/.test(normalizedLabel)) {
                    const budgetType = String(wizardState?.els?.budgetTypeSelect?.value || wizardState?.draft?.strategyList?.[0]?.budgetType || 'day_average').trim();
                    const preferred = budgetType === 'day_budget' ? '日均预算' : '每日预算';
                    return pickByText(preferred, true)
                        || pickByText(sceneDefaults.预算类型 || '', true)
                        || pickByText(fallbackOptions[0] || '', true)
                        || pickByText('每日预算', true)
                        || pickByText('日均预算', true);
                }

                if (/(营销目标|选择卡位方案|选择拉新方案|选择方案|选择优化方向|选择解决方案|投放策略|推广模式|卡位方式|选择方式)/.test(normalizedLabel)) {
                    const defaultGoal = normalizeSceneSettingValue(
                        sceneDefaults[normalizedLabel]
                        || sceneDefaults.营销目标
                        || sceneDefaults.优化目标
                        || ''
                    );
                    const fallbackGoal = getSceneMarketingGoalFallbackList(currentSceneName)[0] || '';
                    return pickByText(defaultGoal, true)
                        || pickByText(fallbackOptions[0] || '', true)
                        || pickByText(fallbackGoal, true);
                }

                if (/(出价方式)/.test(normalizedLabel)) {
                    if (currentSceneName === '关键词推广') {
                        const bidMode = normalizeBidMode(wizardState?.els?.bidModeSelect?.value || wizardState?.draft?.bidMode || 'smart', 'smart');
                        const preferred = bidMode === 'manual' ? '手动出价' : '智能出价';
                        return pickByText(preferred, true)
                            || pickByText('智能出价', true)
                            || pickByText('手动出价', true);
                    }
                    return pickByText(sceneDefaults[normalizedLabel] || '', true)
                        || pickByText(sceneDefaults.出价方式 || '', true)
                        || pickByText(fallbackOptions[0] || '', true);
                }

                if (/(出价目标|优化目标)/.test(normalizedLabel)) {
                    const bidTargetValue = String(wizardState?.els?.bidTargetSelect?.value || DEFAULTS.bidTargetV2).trim() || DEFAULTS.bidTargetV2;
                    const bidTargetLabel = BID_TARGET_OPTIONS.find(item => item.value === bidTargetValue)?.label || '获取成交量';
                    return pickByText(bidTargetLabel, true)
                        || pickByText(sceneDefaults[normalizedLabel] || '', true)
                        || pickByText(sceneDefaults.出价目标 || '', true)
                        || pickByText(sceneDefaults.优化目标 || '', true)
                        || pickByText(fallbackOptions[0] || '', true)
                        || pickByText('获取成交量', true)
                        || pickByText('增加成交金额', true)
                        || pickByText('优化留资获客成本', true);
                }

                if (/(计划名称|计划名)/.test(normalizedLabel)) {
                    const planName = String(wizardState?.els?.prefixInput?.value || wizardState?.draft?.planNamePrefix || buildSceneTimePrefix(currentSceneName)).trim();
                    return toShortSceneValue(planName);
                }

                if (/(每日预算|日均预算)/.test(normalizedLabel)) {
                    const budgetValue = String(wizardState?.els?.budgetInput?.value || wizardState?.draft?.dayAverageBudget || '100').trim();
                    return toShortSceneValue(budgetValue);
                }

                if (/(关键词设置|核心词设置)/.test(normalizedLabel)) {
                    return pickByText('添加关键词', true)
                        || pickByText('系统推荐词', true)
                        || pickByText('手动自选词', true);
                }

                if (/(人群设置|种子人群)/.test(normalizedLabel)) {
                    return pickByText('智能人群', true)
                        || pickByText('设置优先投放客户', true)
                        || pickByText('添加种子人群', true);
                }

                if (/(选择推广商品|选品方式|添加商品)/.test(normalizedLabel)) {
                    return pickByText('自定义选品', true) || pickByText('行业推荐选品', true);
                }

                if (/(投放日期|投放时间|排期)/.test(normalizedLabel)) {
                    return pickByText('长期投放', true) || pickByText('不限时段', true);
                }

                return '';
            };

            const resolveSceneFieldDefaultValue = ({ fieldLabel = '', options = [], schema = null }) => {
                const optionList = Array.isArray(options) ? options : [];
                const strictField = SCENE_STRICT_OPTION_TYPE_SET.has(resolveSceneFieldOptionType(fieldLabel));
                const pickFromCandidate = (candidate = '', fallbackRaw = false) => {
                    const mapped = pickSceneValueFromOptions(candidate, optionList);
                    if (mapped) return mapped;
                    if (!fallbackRaw || (strictField && optionList.length > 0)) return '';
                    return toShortSceneValue(candidate);
                };

                if (isPlainObject(schema)) {
                    const matchedSelects = (Array.isArray(schema.selects) ? schema.selects : [])
                        .filter(item => isSceneLabelMatch(item?.label, fieldLabel));
                    for (const selectItem of matchedSelects) {
                        const selectedOption = (selectItem.options || []).find(opt => opt?.selected) || null;
                        const fromSelectedLabel = pickFromCandidate(selectedOption?.label || '', true);
                        if (fromSelectedLabel) return fromSelectedLabel;
                        const fromSelectedValue = pickFromCandidate(selectedOption?.value || '', true);
                        if (fromSelectedValue) return fromSelectedValue;
                        const fromSelectValue = pickFromCandidate(selectItem.value || '', true);
                        if (fromSelectValue) return fromSelectValue;
                    }

                    const matchedRadios = (Array.isArray(schema.radios) ? schema.radios : [])
                        .filter(item => item?.checked && isSceneLabelMatch(item?.label, fieldLabel));
                    for (const radioItem of matchedRadios) {
                        const fromRadio = pickFromCandidate(radioItem.text || '', false);
                        if (fromRadio) return fromRadio;
                        const firstToken = String(radioItem.text || '').split(/[，。,.；;：:\s]/)[0] || '';
                        const fromToken = pickFromCandidate(firstToken, true);
                        if (fromToken) return fromToken;
                    }

                    const matchedInputs = (Array.isArray(schema.inputs) ? schema.inputs : [])
                        .filter(item => isSceneLabelMatch(item?.label, fieldLabel));
                    for (const inputItem of matchedInputs) {
                        const fromInput = toShortSceneValue(inputItem.value || '');
                        if (fromInput) return fromInput;
                    }

                    const matchedGroups = (Array.isArray(schema.optionGroups) ? schema.optionGroups : [])
                        .filter(item => isSceneLabelMatch(item?.label, fieldLabel));
                    for (const groupItem of matchedGroups) {
                        const firstOption = String((groupItem.options || [])[0] || '').trim();
                        const fromGroup = pickFromCandidate(firstOption, true);
                        if (fromGroup) return fromGroup;
                    }
                }

                const heuristicDefault = normalizeSceneSettingValue(resolveSceneFieldHeuristicDefault(fieldLabel, optionList));
                if (heuristicDefault) return heuristicDefault;
                if (optionList.length) return optionList[0];
                return '';
            };

            const autoFillSceneDefaults = ({ sceneName = '', profile = {}, fields = [], bucket = {} }) => {
                const targetSceneName = String(sceneName || '').trim();
                if (!targetSceneName || !Array.isArray(fields) || !fields.length) return 0;
                const missingFields = fields.filter(fieldLabel => {
                    const key = normalizeSceneFieldKey(fieldLabel);
                    if (!key) return false;
                    if (normalizeSceneSettingValue(bucket[key]) !== '') return false;
                    return true;
                });
                if (!missingFields.length) return 0;

                let schema = null;
                try {
                    schema = scanCurrentSceneSettings(targetSceneName);
                } catch {
                    schema = null;
                }

                let fillCount = 0;
                missingFields.forEach(fieldLabel => {
                    const key = normalizeSceneFieldKey(fieldLabel);
                    const profileDefaultValue = normalizeSceneSettingValue(
                        profile?.fieldMeta?.[key]?.defaultValue
                        || profile?.fieldDefaults?.[key]
                        || ''
                    );
                    if (profileDefaultValue) {
                        bucket[key] = profileDefaultValue;
                        fillCount += 1;
                        return;
                    }
                    const options = resolveSceneFieldOptions(profile, fieldLabel);
                    const defaultValue = normalizeSceneSettingValue(resolveSceneFieldDefaultValue({
                        fieldLabel,
                        options,
                        schema
                    }));
                    if (!defaultValue) return;
                    bucket[key] = defaultValue;
                    fillCount += 1;
                });
                return fillCount;
            };

            const syncSceneSettingValuesFromUI = () => {
                const sceneName = String(wizardState.els.sceneSelect?.value || wizardState.draft?.sceneName || '关键词推广').trim();
                if (!sceneName) return;
                const bucket = ensureSceneSettingBucket(sceneName);
                const controls = wizardState.els.sceneDynamic?.querySelectorAll('[data-scene-field]') || [];
                controls.forEach(control => {
                    const key = String(control.getAttribute('data-scene-field') || '').trim();
                    if (!key) return;
                    bucket[key] = normalizeSceneSettingValue(control.value);
                });
            };

            const buildSceneSettingsPayload = (sceneName = '') => {
                const targetSceneName = String(sceneName || wizardState?.draft?.sceneName || '关键词推广').trim() || '关键词推广';
                const profile = getSceneProfile(targetSceneName);
                const bucket = ensureSceneSettingBucket(targetSceneName);
                const labelMap = {};
                if (isPlainObject(profile?.fieldMeta)) {
                    Object.keys(profile.fieldMeta).forEach(key => {
                        const meta = profile.fieldMeta[key];
                        const label = normalizeText(meta?.label || '').replace(/[：:]/g, '').trim();
                        const normalizedKey = normalizeSceneFieldKey(label || key);
                        if (!label || !normalizedKey) return;
                        if (!labelMap[normalizedKey]) labelMap[normalizedKey] = label;
                    });
                }
                (profile?.requiredFields || []).forEach(fieldLabel => {
                    if (!shouldRenderDynamicSceneField(fieldLabel, targetSceneName)) return;
                    const label = normalizeText(fieldLabel).replace(/[：:]/g, '').trim();
                    const key = normalizeSceneFieldKey(fieldLabel);
                    if (!label || !key || labelMap[key]) return;
                    labelMap[key] = label;
                });
                const skippedDynamicKeySet = new Set(
                    (profile?.requiredFields || [])
                        .filter(fieldLabel => !shouldRenderDynamicSceneField(fieldLabel, targetSceneName))
                        .map(fieldLabel => normalizeSceneFieldKey(fieldLabel))
                        .filter(Boolean)
                );

                const sceneSettings = {};
                Object.keys(bucket || {}).forEach(rawKey => {
                    const key = normalizeText(rawKey).replace(/[：:]/g, '').trim();
                    if (skippedDynamicKeySet.has(key)) return;
                    const value = normalizeSceneSettingValue(bucket[rawKey]);
                    if (!key || !value) return;
                    const mappedLabel = labelMap[key] || key;
                    sceneSettings[mappedLabel] = value;
                });

                const bidMode = normalizeBidMode(wizardState?.draft?.bidMode || 'smart', 'smart');
                const bidTypeLabel = bidMode === 'manual' ? '手动出价' : '智能出价';
                const budgetTypeValue = String(wizardState?.els?.budgetTypeSelect?.value || wizardState?.draft?.strategyList?.[0]?.budgetType || 'day_average').trim();
                const budgetTypeLabel = budgetTypeValue === 'day_budget' ? '日均预算' : '每日预算';
                const scenePrefix = String(wizardState?.draft?.planNamePrefix || buildSceneTimePrefix(targetSceneName)).trim();
                const budgetValue = normalizeSceneSettingValue(wizardState?.els?.budgetInput?.value || wizardState?.draft?.dayAverageBudget || '');
                const bidTargetValue = String(wizardState?.els?.bidTargetSelect?.value || DEFAULTS.bidTargetV2).trim() || DEFAULTS.bidTargetV2;
                const bidTargetLabel = BID_TARGET_OPTIONS.find(item => item.value === bidTargetValue)?.label || '';
                const keywordModeValue = String(wizardState?.els?.modeSelect?.value || DEFAULTS.keywordMode).trim();
                const keywordModeLabelMap = {
                    mixed: '混合（手动优先 + 推荐补齐）',
                    manual: '仅手动',
                    recommend: '仅推荐'
                };
                const keywordModeLabel = keywordModeLabelMap[keywordModeValue] || keywordModeValue;
                const sceneFieldTokens = uniqueBy(
                    Object.values(labelMap || {})
                        .concat(profile?.requiredFields || [])
                        .map(item => normalizeSceneLabelToken(item))
                        .filter(Boolean),
                    item => item
                );
                const sceneFieldText = sceneFieldTokens.join(' ');
                const hasProfileField = (pattern) => pattern.test(sceneFieldText);
                const allowAutoBidType = targetSceneName === '关键词推广' || hasProfileField(/出价方式/);
                const allowAutoBidTarget = targetSceneName === '关键词推广' || hasProfileField(/出价目标|优化目标/);
                const allowAutoBudgetType = targetSceneName === '关键词推广' || hasProfileField(/预算类型/);
                const allowAutoBudgetAmount = hasProfileField(/预算|日均预算|每日预算|总预算/) || targetSceneName === '关键词推广';

                sceneSettings.场景名称 = sceneSettings.场景名称 || targetSceneName;
                if (allowAutoBidType && !sceneSettings.出价方式) {
                    sceneSettings.出价方式 = bidTypeLabel;
                }
                if (allowAutoBudgetType && !sceneSettings.预算类型) {
                    sceneSettings.预算类型 = budgetTypeLabel;
                }
                if (!sceneSettings.计划名称) {
                    if (scenePrefix) sceneSettings.计划名称 = scenePrefix;
                }
                if (allowAutoBudgetAmount && budgetValue) {
                    if (budgetTypeValue === 'day_budget' && !sceneSettings.日均预算) {
                        sceneSettings.日均预算 = budgetValue;
                    }
                    if (budgetTypeValue !== 'day_budget' && !sceneSettings.每日预算) {
                        sceneSettings.每日预算 = budgetValue;
                    }
                }
                if (allowAutoBidTarget && bidTargetLabel && !sceneSettings.出价目标) {
                    sceneSettings.出价目标 = bidTargetLabel;
                }
                if (targetSceneName === '关键词推广') {
                    if (keywordModeLabel && !sceneSettings.关键词模式) {
                        sceneSettings.关键词模式 = keywordModeLabel;
                    }
                    const recommendCountValue = normalizeSceneSettingValue(wizardState?.els?.recommendCountInput?.value || '');
                    if (recommendCountValue && !sceneSettings.推荐词目标数) {
                        sceneSettings.推荐词目标数 = recommendCountValue;
                    }
                    const defaultBidValue = normalizeSceneSettingValue(wizardState?.els?.bidInput?.value || '');
                    if (defaultBidValue && !sceneSettings.默认关键词出价) {
                        sceneSettings.默认关键词出价 = defaultBidValue;
                    }
                    const singleCostEnabled = !!wizardState?.els?.singleCostEnableInput?.checked;
                    const singleCostValue = normalizeSceneSettingValue(wizardState?.els?.singleCostInput?.value || '');
                    if (singleCostEnabled && singleCostValue && !sceneSettings.平均直接成交成本) {
                        sceneSettings.平均直接成交成本 = singleCostValue;
                    }
                }

                return sceneSettings;
            };

            const renderSceneDynamicConfig = () => {
                if (!wizardState.els.sceneDynamic) return;
                const sceneName = String(wizardState.els.sceneSelect?.value || wizardState.draft?.sceneName || '关键词推广').trim();
                const profile = getSceneProfile(sceneName);
                const metaFieldLabels = isPlainObject(profile?.fieldMeta)
                    ? Object.keys(profile.fieldMeta)
                        .map(key => normalizeText(profile.fieldMeta[key]?.label || '').replace(/[：:]/g, '').trim())
                        .filter(Boolean)
                    : [];
                const fields = uniqueBy(
                    (profile.requiredFields || [])
                        .concat(metaFieldLabels)
                        .filter(Boolean)
                        .filter(item => shouldRenderDynamicSceneField(item, sceneName)),
                    item => item
                ).slice(0, 120);
                const bucket = ensureSceneSettingBucket(sceneName);
                const autoFilledCount = autoFillSceneDefaults({
                    sceneName,
                    profile,
                    fields,
                    bucket
                });
                if (autoFilledCount > 0) {
                    saveSessionDraft(wizardState.draft);
                    appendWizardLog(`场景默认设置已加载 ${autoFilledCount} 项（${sceneName}）`, 'success');
                }
                const filledCount = Object.keys(bucket || {})
                    .filter(key => normalizeSceneSettingValue(bucket[key]) !== '')
                    .length;

                const buildProxySelectRow = (label, targetId, selectEl) => {
                    if (!(selectEl instanceof HTMLSelectElement)) return '';
                    const selectedValue = String(selectEl.value || '');
                    const optionHtml = Array.from(selectEl.options || []).map(option => {
                        const value = String(option?.value || '');
                        const text = String(option?.textContent || option?.label || value);
                        return `
                            <button
                                type="button"
                                class="am-wxt-option-chip ${value === selectedValue ? 'active' : ''}"
                                data-proxy-select-target="${Utils.escapeHtml(targetId)}"
                                data-proxy-select-value="${Utils.escapeHtml(value)}"
                                ${selectEl.disabled ? 'disabled' : ''}
                            >${Utils.escapeHtml(text)}</button>
                        `;
                    }).join('');
                    return `
                        <div class="am-wxt-scene-setting-row">
                            <div class="am-wxt-scene-setting-label">${Utils.escapeHtml(label)}</div>
                            <div class="am-wxt-setting-control">
                                <div class="am-wxt-option-line">${optionHtml}</div>
                            </div>
                        </div>
                    `;
                };

                const buildProxyInputRow = (label, targetId, value, placeholder = '') => `
                    <div class="am-wxt-scene-setting-row">
                        <div class="am-wxt-scene-setting-label">${Utils.escapeHtml(label)}</div>
                        <div class="am-wxt-setting-control">
                            <input
                                data-proxy-input-target="${Utils.escapeHtml(targetId)}"
                                value="${Utils.escapeHtml(value || '')}"
                                placeholder="${Utils.escapeHtml(placeholder || '')}"
                            />
                        </div>
                    </div>
                `;

                const buildProxyTextareaRow = (label, targetId, value, placeholder = '') => `
                    <div class="am-wxt-scene-setting-row">
                        <div class="am-wxt-scene-setting-label">${Utils.escapeHtml(label)}</div>
                        <div class="am-wxt-setting-control">
                            <textarea
                                data-proxy-input-target="${Utils.escapeHtml(targetId)}"
                                placeholder="${Utils.escapeHtml(placeholder || '')}"
                            >${Utils.escapeHtml(value || '')}</textarea>
                        </div>
                    </div>
                `;

                const sceneFieldText = uniqueBy((profile.requiredFields || []).concat(metaFieldLabels), item => normalizeSceneLabelToken(item)).join(' ');
                const hasSceneField = (pattern) => pattern.test(sceneFieldText);
                const isKeywordScene = sceneName === '关键词推广';
                const staticRows = [];
                staticRows.push(buildProxySelectRow('场景选择', 'am-wxt-keyword-scene-select', wizardState.els.sceneSelect));
                if (isKeywordScene) {
                    staticRows.push(buildProxySelectRow('出价方式', 'am-wxt-keyword-bid-mode', wizardState.els.bidModeSelect));
                    staticRows.push(buildProxySelectRow('出价目标', 'am-wxt-keyword-bid-target', wizardState.els.bidTargetSelect));
                    staticRows.push(buildProxySelectRow('预算类型', 'am-wxt-keyword-budget-type', wizardState.els.budgetTypeSelect));
                }
                staticRows.push(buildProxyInputRow('计划名称', 'am-wxt-keyword-prefix', wizardState.els.prefixInput?.value || '', '例如：场景_时间'));
                if (isKeywordScene || hasSceneField(/预算|日均预算|每日预算|总预算/)) {
                    staticRows.push(buildProxyInputRow('预算值', 'am-wxt-keyword-budget', wizardState.els.budgetInput?.value || '', '请输入预算'));
                }
                if (isKeywordScene) {
                    staticRows.push(buildProxySelectRow('关键词模式', 'am-wxt-keyword-mode', wizardState.els.modeSelect));
                    staticRows.push(buildProxyInputRow('默认关键词出价', 'am-wxt-keyword-bid', wizardState.els.bidInput?.value || '', '默认 1.00'));
                    staticRows.push(buildProxyInputRow('推荐词目标数', 'am-wxt-keyword-recommend-count', wizardState.els.recommendCountInput?.value || '', '默认 20'));
                    staticRows.push(`
                        <div class="am-wxt-scene-setting-row">
                            <div class="am-wxt-scene-setting-label">平均直接成交成本</div>
                            <div class="am-wxt-setting-control am-wxt-setting-control-inline">
                                <label class="am-wxt-inline-check">
                                    <input type="checkbox" data-proxy-check-target="am-wxt-keyword-single-cost-enable" ${wizardState.els.singleCostEnableInput?.checked ? 'checked' : ''} />
                                    <span>启用（非必要）</span>
                                </label>
                                <input
                                    data-proxy-input-target="am-wxt-keyword-single-cost"
                                    value="${Utils.escapeHtml(wizardState.els.singleCostInput?.value || '')}"
                                    placeholder="成本上限"
                                    style="width:140px;"
                                    ${wizardState.els.singleCostInput?.disabled ? 'disabled' : ''}
                                />
                            </div>
                        </div>
                    `);
                    staticRows.push(buildProxyTextareaRow(
                        '手动关键词',
                        'am-wxt-keyword-manual',
                        wizardState.els.manualInput?.value || '',
                        '手动关键词，每行一个，支持：关键词,出价,匹配方式（广泛/精准）'
                    ));
                }
                const staticGridHtml = staticRows.join('');

                const gridRows = fields.map(fieldLabel => {
                    const key = normalizeSceneFieldKey(fieldLabel);
                    const options = resolveSceneFieldOptions(profile, fieldLabel);
                    let value = normalizeSceneSettingValue(bucket[key] || '');
                    const fieldMeta = profile?.fieldMeta?.[key] || {};
                    const token = normalizeSceneLabelToken(fieldLabel);
                    const optionType = resolveSceneFieldOptionType(fieldLabel);
                    const hasExactOptionMatch = (candidate = '') => {
                        const normalizedCandidate = normalizeSceneOptionText(candidate);
                        if (!normalizedCandidate) return false;
                        return options.some(opt => normalizeSceneOptionText(opt) === normalizedCandidate);
                    };
                    if (
                        options.length >= 2
                        && value
                        && SCENE_STRICT_OPTION_TYPE_SET.has(optionType)
                        && !hasExactOptionMatch(value)
                    ) {
                        value = options[0] || '';
                        bucket[key] = value;
                    }
                    if (options.length < 2) {
                        const shouldKeepInputField = (
                            token
                            && token.length <= 14
                            && !SCENE_SECTION_ONLY_LABEL_RE.test(token)
                            && !/添加商品|选择推广商品/.test(token)
                            && (
                                normalizeSceneSettingValue(value) !== ''
                                || fieldMeta?.requiredGuess === true
                                || fieldMeta?.criticalGuess === true
                            )
                        );
                        if (!shouldKeepInputField) return '';
                        return `
                            <div class="am-wxt-scene-setting-row">
                                <div class="am-wxt-scene-setting-label">${Utils.escapeHtml(fieldLabel)}</div>
                                <div class="am-wxt-setting-control">
                                    <input data-scene-field="${Utils.escapeHtml(key)}" value="${Utils.escapeHtml(value)}" placeholder="请输入${Utils.escapeHtml(fieldLabel)}" />
                                </div>
                            </div>
                        `;
                    }
                    const includeCurrentValue = !!(
                        value
                        && isLikelySceneOptionValue(value)
                        && (
                            !SCENE_STRICT_OPTION_TYPE_SET.has(optionType)
                            || hasExactOptionMatch(value)
                        )
                    );
                    const optionList = uniqueBy(
                        (includeCurrentValue ? [value] : []).concat(options).map(item => normalizeSceneSettingValue(item)).filter(Boolean),
                        item => item
                    ).slice(0, 18);
                    const optionHtml = optionList.map(opt => `
                        <button
                            type="button"
                            class="am-wxt-option-chip ${opt === value ? 'active' : ''}"
                            data-scene-option="1"
                            data-scene-option-value="${Utils.escapeHtml(opt)}"
                        >${Utils.escapeHtml(opt)}</button>
                    `).join('');
                    return `
                        <div class="am-wxt-scene-setting-row">
                            <div class="am-wxt-scene-setting-label">${Utils.escapeHtml(fieldLabel)}</div>
                            <div class="am-wxt-setting-control">
                                <div class="am-wxt-option-line">${optionHtml}</div>
                                <input class="am-wxt-hidden-control" data-scene-field="${Utils.escapeHtml(key)}" value="${Utils.escapeHtml(value)}" />
                            </div>
                        </div>
                    `;
                }).filter(Boolean);
                const gridHtml = gridRows.join('');

                wizardState.els.sceneDynamic.innerHTML = `
                    <div class="title">
                        <span>场景配置：${Utils.escapeHtml(sceneName)}</span>
                        <span class="meta">${profile.source === 'scan' ? '动态读取' : '基础模板'} · 已设置 ${filledCount} 项</span>
                    </div>
                    <div class="am-wxt-scene-grid">
                        ${staticGridHtml}
                        ${gridRows.length ? gridHtml : '<div class="am-wxt-scene-empty">当前场景暂无额外动态配置项</div>'}
                    </div>
                `;

                const proxySelectButtons = wizardState.els.sceneDynamic.querySelectorAll('[data-proxy-select-target]');
                proxySelectButtons.forEach(button => {
                    button.addEventListener('click', () => {
                        const targetId = String(button.getAttribute('data-proxy-select-target') || '').trim();
                        const nextValue = String(button.getAttribute('data-proxy-select-value') || '').trim();
                        const target = targetId ? wizardState.els.overlay.querySelector(`#${targetId}`) : null;
                        if (!(target instanceof HTMLSelectElement) || target.disabled) return;
                        if (target.value !== nextValue) {
                            target.value = nextValue;
                            target.dispatchEvent(new Event('input', { bubbles: true }));
                        }
                        target.dispatchEvent(new Event('change', { bubbles: true }));
                        if (targetId !== 'am-wxt-keyword-scene-select') {
                            renderSceneDynamicConfig();
                        }
                    });
                });

                const proxyChecks = wizardState.els.sceneDynamic.querySelectorAll('[data-proxy-check-target]');
                proxyChecks.forEach(checkbox => {
                    checkbox.addEventListener('change', () => {
                        const targetId = String(checkbox.getAttribute('data-proxy-check-target') || '').trim();
                        const target = targetId ? wizardState.els.overlay.querySelector(`#${targetId}`) : null;
                        if (!(target instanceof HTMLInputElement)) return;
                        target.checked = !!checkbox.checked;
                        target.dispatchEvent(new Event('input', { bubbles: true }));
                        target.dispatchEvent(new Event('change', { bubbles: true }));
                        renderSceneDynamicConfig();
                    });
                });

                const proxyInputs = wizardState.els.sceneDynamic.querySelectorAll('[data-proxy-input-target]');
                proxyInputs.forEach(proxy => {
                    const syncProxyValue = () => {
                        const targetId = String(proxy.getAttribute('data-proxy-input-target') || '').trim();
                        const target = targetId ? wizardState.els.overlay.querySelector(`#${targetId}`) : null;
                        if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) return;
                        const nextValue = String(proxy.value || '');
                        if (target.value !== nextValue) target.value = nextValue;
                        target.dispatchEvent(new Event('input', { bubbles: true }));
                        target.dispatchEvent(new Event('change', { bubbles: true }));
                    };
                    proxy.addEventListener('input', syncProxyValue);
                    proxy.addEventListener('change', syncProxyValue);
                });

                const sceneOptionButtons = wizardState.els.sceneDynamic.querySelectorAll('[data-scene-option]');
                sceneOptionButtons.forEach(button => {
                    button.addEventListener('click', () => {
                        const row = button.closest('.am-wxt-scene-setting-row');
                        const hiddenControl = row?.querySelector('input[data-scene-field]');
                        if (!(hiddenControl instanceof HTMLInputElement)) return;
                        const nextValue = String(button.getAttribute('data-scene-option-value') || '').trim();
                        hiddenControl.value = nextValue;
                        row.querySelectorAll('[data-scene-option]').forEach(chip => {
                            chip.classList.toggle('active', chip === button);
                        });
                        hiddenControl.dispatchEvent(new Event('input', { bubbles: true }));
                        hiddenControl.dispatchEvent(new Event('change', { bubbles: true }));
                    });
                });

                const controls = wizardState.els.sceneDynamic.querySelectorAll('[data-scene-field]');
                controls.forEach(control => {
                    const onChange = () => {
                        const activeScene = String(wizardState.els.sceneSelect?.value || wizardState.draft?.sceneName || '关键词推广').trim();
                        const fieldKey = String(control.getAttribute('data-scene-field') || '').trim();
                        if (activeScene && fieldKey) {
                            const touchedBucket = ensureSceneTouchedBucket(activeScene);
                            touchedBucket[fieldKey] = true;
                        }
                        syncSceneSettingValuesFromUI();
                        syncDraftFromUI();
                        if (typeof wizardState.buildRequest === 'function') {
                            wizardState.renderPreview(wizardState.buildRequest());
                        }
                    };
                    control.addEventListener('input', onChange);
                    control.addEventListener('change', onChange);
                });
            };

            const normalizeStrategyList = (rawList, fallbackBudget = '') => {
                const fallback = getDefaultStrategyList();
                const input = Array.isArray(rawList) && rawList.length ? rawList : fallback;
                return input.map((item, idx) => {
                    const base = fallback[idx] || fallback[0];
                    const id = String(item?.id || base?.id || `strategy_${idx + 1}`).trim();
                    const name = String(item?.name || base?.name || `${getCurrentEditorSceneName()}-策略${idx + 1}`).trim();
                    const enabled = item?.enabled !== false;
                    const dayAverageBudget = String(item?.dayAverageBudget ?? fallbackBudget ?? '').trim();
                    const defaultBidPrice = String(item?.defaultBidPrice ?? '1').trim() || '1';
                    const keywordMode = String(item?.keywordMode || DEFAULTS.keywordMode).trim() || DEFAULTS.keywordMode;
                    const recommendCount = String(item?.recommendCount ?? DEFAULTS.recommendCount).trim() || String(DEFAULTS.recommendCount);
                    const manualKeywords = String(item?.manualKeywords || '').trim();
                    const bidMode = normalizeBidMode(
                        item?.bidMode
                            || item?.campaignOverride?.bidTypeV2
                            || base?.bidMode
                            || wizardState?.draft?.bidMode
                            || 'smart',
                        'smart'
                    );
                    const bidTargetV2 = String(item?.bidTargetV2 || DEFAULTS.bidTargetV2).trim() || DEFAULTS.bidTargetV2;
                    const budgetType = String(item?.budgetType || 'day_average').trim() || 'day_average';
                    const setSingleCostV2 = bidMode === 'smart' && item?.setSingleCostV2 === true;
                    const singleCostV2 = String(item?.singleCostV2 || '').trim();
                    const planName = String(item?.planName || '').trim();
                    return {
                        id,
                        name,
                        enabled,
                        bidMode,
                        dayAverageBudget,
                        defaultBidPrice,
                        keywordMode,
                        recommendCount,
                        manualKeywords,
                        bidTargetV2,
                        budgetType,
                        setSingleCostV2,
                        singleCostV2,
                        planName
                    };
                });
            };

            const getStrategyById = (strategyId) => wizardState.strategyList.find(item => item.id === strategyId) || null;

            const applyStrategyToDetailForm = (strategy) => {
                if (!strategy) return;
                if (wizardState.els.detailTitle) {
                    wizardState.els.detailTitle.textContent = `编辑计划：${strategy.name}`;
                }
                if (wizardState.els.sceneSelect) {
                    const selectedScene = wizardState.draft?.sceneName || '关键词推广';
                    wizardState.els.sceneSelect.value = SCENE_OPTIONS.includes(selectedScene) ? selectedScene : '关键词推广';
                }
                renderSceneDynamicConfig();
                const bidMode = normalizeBidMode(strategy.bidMode || wizardState.draft?.bidMode || 'smart', 'smart');
                updateBidModeControls(bidMode);
                if (wizardState.els.bidTargetSelect) wizardState.els.bidTargetSelect.value = strategy.bidTargetV2 || DEFAULTS.bidTargetV2;
                if (wizardState.els.budgetTypeSelect) wizardState.els.budgetTypeSelect.value = strategy.budgetType || 'day_average';
                if (wizardState.els.budgetInput) wizardState.els.budgetInput.value = strategy.dayAverageBudget || wizardState.draft?.dayAverageBudget || '';
                if (wizardState.els.bidInput) wizardState.els.bidInput.value = strategy.defaultBidPrice || wizardState.draft?.defaultBidPrice || '1';
                if (wizardState.els.modeSelect) wizardState.els.modeSelect.value = strategy.keywordMode || wizardState.draft?.keywordMode || DEFAULTS.keywordMode;
                if (wizardState.els.recommendCountInput) wizardState.els.recommendCountInput.value = strategy.recommendCount || wizardState.draft?.recommendCount || String(DEFAULTS.recommendCount);
                if (wizardState.els.manualInput) wizardState.els.manualInput.value = strategy.manualKeywords || '';
                if (wizardState.els.prefixInput) wizardState.els.prefixInput.value = strategy.planName || wizardState.draft?.planNamePrefix || '';
                if (wizardState.els.singleCostEnableInput) wizardState.els.singleCostEnableInput.checked = bidMode === 'smart' && !!strategy.setSingleCostV2;
                if (wizardState.els.singleCostInput) {
                    wizardState.els.singleCostInput.value = strategy.singleCostV2 || '';
                }
                updateBidModeControls(bidMode);
            };

            const pullDetailFormToStrategy = (strategy) => {
                if (!strategy) return;
                const bidMode = normalizeBidMode(
                    wizardState.els.bidModeSelect?.value || strategy.bidMode || wizardState.draft?.bidMode || 'smart',
                    'smart'
                );
                strategy.bidMode = bidMode;
                if (wizardState.els.bidTargetSelect) strategy.bidTargetV2 = wizardState.els.bidTargetSelect.value || DEFAULTS.bidTargetV2;
                if (wizardState.els.budgetTypeSelect) strategy.budgetType = wizardState.els.budgetTypeSelect.value || 'day_average';
                if (wizardState.els.budgetInput) strategy.dayAverageBudget = wizardState.els.budgetInput.value.trim();
                if (wizardState.els.bidInput) strategy.defaultBidPrice = wizardState.els.bidInput.value.trim() || '1';
                if (wizardState.els.modeSelect) strategy.keywordMode = wizardState.els.modeSelect.value;
                if (wizardState.els.recommendCountInput) strategy.recommendCount = wizardState.els.recommendCountInput.value.trim() || String(DEFAULTS.recommendCount);
                if (wizardState.els.manualInput) strategy.manualKeywords = wizardState.els.manualInput.value.trim();
                if (wizardState.els.prefixInput) strategy.planName = wizardState.els.prefixInput.value.trim();
                if (wizardState.els.singleCostEnableInput) strategy.setSingleCostV2 = bidMode === 'smart' && !!wizardState.els.singleCostEnableInput.checked;
                if (wizardState.els.singleCostInput) strategy.singleCostV2 = wizardState.els.singleCostInput.value.trim();
            };

            const setDetailVisible = (visible) => {
                wizardState.detailVisible = !!visible;
                if (wizardState.els.detailConfig) {
                    wizardState.els.detailConfig.classList.toggle('collapsed', !wizardState.detailVisible);
                }
                if (wizardState.els.detailBackdrop) {
                    wizardState.els.detailBackdrop.classList.toggle('open', wizardState.detailVisible);
                }
            };

            const openStrategyDetail = (strategyId) => {
                const strategy = getStrategyById(strategyId);
                if (!strategy) return;
                const previous = getStrategyById(wizardState.editingStrategyId);
                if (previous) pullDetailFormToStrategy(previous);
                if (wizardState.editingStrategyId === strategy.id && wizardState.detailVisible) {
                    setDetailVisible(false);
                    syncDraftFromUI();
                    renderStrategyList();
                    return;
                }
                wizardState.editingStrategyId = strategy.id;
                applyStrategyToDetailForm(strategy);
                setDetailVisible(true);
                syncDraftFromUI();
                renderStrategyList();
            };

            const renderStrategyList = () => {
                if (!wizardState.els.strategyList || !wizardState.els.strategyCount) return;
                wizardState.els.strategyList.innerHTML = '';
                const enabledCount = wizardState.strategyList.filter(item => item.enabled).length;
                wizardState.els.strategyCount.textContent = String(enabledCount);
                wizardState.strategyList.forEach((strategy) => {
                    const bidMode = normalizeBidMode(strategy.bidMode || 'smart', 'smart');
                    strategy.bidMode = bidMode;
                    const bidTargetLabel = BID_TARGET_OPTIONS.find(item => item.value === strategy.bidTargetV2)?.label || '获取成交量';
                    const bidModeLabel = bidMode === 'manual' ? '手动出价' : '智能出价';
                    const row = document.createElement('div');
                    row.className = 'am-wxt-strategy-item';
                    row.innerHTML = `
                        <div class="am-wxt-strategy-main">
                            <div class="am-wxt-strategy-left">
                                <input type="checkbox" ${strategy.enabled ? 'checked' : ''} />
                                <span>${Utils.escapeHtml(getStrategyMainLabel(strategy))}</span>
                            </div>
                            <div class="am-wxt-strategy-right">
                                <span>${Utils.escapeHtml(bidModeLabel)} / ${Utils.escapeHtml(bidTargetLabel)} / 预算 ${Utils.escapeHtml(strategy.dayAverageBudget || wizardState.draft?.dayAverageBudget || '100')} 元</span>
                                <button class="am-wxt-btn" data-action="copy">复制</button>
                                <button class="am-wxt-btn" data-action="delete">删除</button>
                                <button class="am-wxt-btn" data-action="edit">${wizardState.detailVisible && wizardState.editingStrategyId === strategy.id ? '编辑中' : '编辑计划'}</button>
                            </div>
                        </div>
                    `;
                    const checkbox = row.querySelector('input[type="checkbox"]');
                    const copyBtn = row.querySelector('button[data-action="copy"]');
                    const deleteBtn = row.querySelector('button[data-action="delete"]');
                    const editBtn = row.querySelector('button[data-action="edit"]');
                    checkbox.onchange = () => {
                        strategy.enabled = !!checkbox.checked;
                        syncDraftFromUI();
                        renderStrategyList();
                    };
                    copyBtn.onclick = () => {
                        const editing = getStrategyById(wizardState.editingStrategyId);
                        if (editing) pullDetailFormToStrategy(editing);
                        const clone = deepClone(strategy);
                        clone.id = createStrategyCloneId(strategy.id || 'strategy');
                        clone.name = createStrategyCloneName(strategy.name || '计划');
                        clone.planName = buildCopiedStrategyPlanName(
                            strategy.planName || wizardState?.draft?.planNamePrefix || '',
                            getCurrentEditorSceneName()
                        );
                        clone.enabled = true;
                        wizardState.strategyList.push(clone);
                        wizardState.editingStrategyId = clone.id;
                        setDetailVisible(true);
                        applyStrategyToDetailForm(clone);
                        syncDraftFromUI();
                        renderStrategyList();
                        if (typeof wizardState.buildRequest === 'function') {
                            wizardState.renderPreview(wizardState.buildRequest());
                        }
                        appendWizardLog(`已复制计划：${clone.name}`, 'success');
                    };
                    deleteBtn.onclick = () => {
                        if ((wizardState.strategyList || []).length <= 1) {
                            appendWizardLog('至少保留 1 个计划', 'error');
                            return;
                        }
                        const removeIndex = wizardState.strategyList.findIndex(item => item.id === strategy.id);
                        if (removeIndex < 0) return;
                        const removed = wizardState.strategyList.splice(removeIndex, 1)[0];
                        if (wizardState.editingStrategyId === removed.id) {
                            const fallback = wizardState.strategyList[Math.max(0, removeIndex - 1)] || wizardState.strategyList[0] || null;
                            wizardState.editingStrategyId = fallback?.id || '';
                            if (fallback && wizardState.detailVisible) {
                                applyStrategyToDetailForm(fallback);
                            }
                        }
                        syncDraftFromUI();
                        renderStrategyList();
                        if (typeof wizardState.buildRequest === 'function') {
                            wizardState.renderPreview(wizardState.buildRequest());
                        }
                        appendWizardLog(`已删除计划：${removed?.name || ''}`, 'success');
                    };
                    editBtn.onclick = () => {
                        openStrategyDetail(strategy.id);
                    };
                    wizardState.els.strategyList.appendChild(row);
                });
                setDetailVisible(wizardState.detailVisible);
            };

            const syncDraftFromUI = () => {
                wizardState.draft = wizardState.draft || wizardDefaultDraft();
                const editingStrategy = getStrategyById(wizardState.editingStrategyId);
                const selectedScene = wizardState.els.sceneSelect?.value || wizardState.draft.sceneName || '关键词推广';
                wizardState.draft.sceneName = SCENE_OPTIONS.includes(selectedScene) ? selectedScene : '关键词推广';
                syncSceneSettingValuesFromUI();
                const prefixValue = wizardState.els.prefixInput?.value?.trim() || '';
                if (!editingStrategy || !wizardState.detailVisible) {
                    wizardState.draft.planNamePrefix = prefixValue || wizardState.draft.planNamePrefix || buildSceneTimePrefix(wizardState.draft.sceneName);
                } else if (!wizardState.draft.planNamePrefix) {
                    wizardState.draft.planNamePrefix = buildSceneTimePrefix(wizardState.draft.sceneName);
                }
                wizardState.draft.dayAverageBudget = wizardState.els.budgetInput?.value?.trim() || wizardState.draft.dayAverageBudget || '';
                wizardState.draft.defaultBidPrice = wizardState.els.bidInput?.value?.trim() || wizardState.draft.defaultBidPrice || '1';
                wizardState.draft.bidMode = normalizeBidMode(
                    wizardState.els.bidModeSelect?.value || wizardState.draft.bidMode || 'smart',
                    'smart'
                );
                wizardState.draft.keywordMode = wizardState.els.modeSelect?.value || wizardState.draft.keywordMode || DEFAULTS.keywordMode;
                wizardState.draft.recommendCount = wizardState.els.recommendCountInput?.value?.trim() || wizardState.draft.recommendCount || String(DEFAULTS.recommendCount);
                wizardState.draft.manualKeywords = wizardState.els.manualInput?.value || wizardState.draft.manualKeywords || '';
                wizardState.draft.fallbackPolicy = normalizeFallbackPolicy(wizardState.draft.fallbackPolicy || 'confirm', 'confirm');
                if (editingStrategy) {
                    pullDetailFormToStrategy(editingStrategy);
                }
                wizardState.draft.addedItems = wizardState.addedItems.map(item => ({ ...item }));
                wizardState.draft.crowdList = wizardState.crowdList.map(item => deepClone(item));
                wizardState.draft.debugVisible = !!wizardState.debugVisible;
                wizardState.draft.strategyList = wizardState.strategyList.map(item => ({ ...item }));
                wizardState.draft.editingStrategyId = wizardState.editingStrategyId || '';
                wizardState.draft.detailVisible = !!wizardState.detailVisible;
                saveSessionDraft(wizardState.draft);
            };

            const fillUIFromDraft = () => {
                wizardState.draft = wizardState.draft || wizardDefaultDraft();
                wizardState.draft.fallbackPolicy = normalizeFallbackPolicy(wizardState.draft.fallbackPolicy || 'confirm', 'confirm');
                if (!isPlainObject(wizardState.draft.sceneSettingValues)) {
                    wizardState.draft.sceneSettingValues = {};
                }
                if (!isPlainObject(wizardState.draft.sceneSettingTouched)) {
                    wizardState.draft.sceneSettingTouched = {};
                }
                const sceneName = SCENE_OPTIONS.includes(wizardState.draft.sceneName) ? wizardState.draft.sceneName : '关键词推广';
                wizardState.draft.sceneName = sceneName || '关键词推广';
                if (isAutoGeneratedPlanPrefix(wizardState.draft.planNamePrefix || '') || !String(wizardState.draft.planNamePrefix || '').trim()) {
                    wizardState.draft.planNamePrefix = buildDefaultPlanPrefixByScene(wizardState.draft.sceneName);
                }
                if (wizardState.els.sceneSelect) wizardState.els.sceneSelect.value = wizardState.draft.sceneName;
                wizardState.sceneProfiles = buildSceneProfiles();
                if (wizardState.els.prefixInput) wizardState.els.prefixInput.value = wizardState.draft.planNamePrefix || '';
                if (wizardState.els.budgetInput) wizardState.els.budgetInput.value = wizardState.draft.dayAverageBudget || '';
                if (wizardState.els.bidInput) wizardState.els.bidInput.value = wizardState.draft.defaultBidPrice || '';
                if (wizardState.els.bidModeSelect) wizardState.els.bidModeSelect.value = normalizeBidMode(wizardState.draft.bidMode || 'smart', 'smart');
                if (wizardState.els.modeSelect) wizardState.els.modeSelect.value = wizardState.draft.keywordMode || DEFAULTS.keywordMode;
                if (wizardState.els.recommendCountInput) wizardState.els.recommendCountInput.value = wizardState.draft.recommendCount || String(DEFAULTS.recommendCount);
                if (wizardState.els.manualInput) wizardState.els.manualInput.value = wizardState.draft.manualKeywords || '';
                wizardState.crowdList = Array.isArray(wizardState.draft.crowdList) ? wizardState.draft.crowdList.map(item => deepClone(item)) : [];
                wizardState.strategyList = normalizeStrategyList(
                    wizardState.draft.strategyList,
                    wizardState.draft.dayAverageBudget || ''
                );
                wizardState.editingStrategyId = String(wizardState.draft.editingStrategyId || wizardState.strategyList[0]?.id || '').trim();
                setDetailVisible(!!wizardState.draft.detailVisible);
                const editingStrategy = getStrategyById(wizardState.editingStrategyId);
                applyStrategyToDetailForm(editingStrategy || wizardState.strategyList[0] || null);
                updateBidModeControls(editingStrategy?.bidMode || wizardState.draft.bidMode || 'smart');
                setDebugVisible(!!wizardState.draft.debugVisible);
            };

            const setCandidateSource = (source = 'recommend') => {
                wizardState.candidateSource = source === 'all' ? 'all' : 'recommend';
                if (wizardState.els.hotBtn) {
                    wizardState.els.hotBtn.classList.toggle('primary', wizardState.candidateSource === 'recommend');
                }
                if (wizardState.els.allBtn) {
                    wizardState.els.allBtn.classList.toggle('primary', wizardState.candidateSource === 'all');
                }
            };

            const renderCrowdList = () => {
                if (!wizardState.els.crowdList || !wizardState.els.crowdCount) return;
                wizardState.els.crowdCount.textContent = String(wizardState.crowdList.length);
                wizardState.els.crowdList.innerHTML = '';
                if (!wizardState.crowdList.length) {
                    wizardState.els.crowdList.innerHTML = '<div class="am-wxt-crowd-item"><span>未设置人群（默认不限）</span></div>';
                    return;
                }
                wizardState.crowdList.forEach((crowdItem, idx) => {
                    const row = document.createElement('div');
                    row.className = 'am-wxt-crowd-item';
                    const labelId = crowdItem?.crowd?.label?.labelId || '';
                    row.innerHTML = `
                        <span>${Utils.escapeHtml(getCrowdDisplayName(crowdItem))}${labelId ? `（${Utils.escapeHtml(labelId)}）` : ''}</span>
                        <button class="am-wxt-btn">移除</button>
                    `;
                    const removeBtn = row.querySelector('button');
                    removeBtn.onclick = () => {
                        wizardState.crowdList = wizardState.crowdList.filter((_, i) => i !== idx);
                        syncDraftFromUI();
                        renderCrowdList();
                    };
                    wizardState.els.crowdList.appendChild(row);
                });
            };

            const renderCandidateList = () => {
                const addedSet = new Set(wizardState.addedItems.map(item => String(item.materialId)));
                wizardState.els.candidateList.innerHTML = '';
                if (!wizardState.candidates.length) {
                    wizardState.els.candidateList.innerHTML = '<div class="am-wxt-item"><div class="name">暂无候选商品</div></div>';
                    return;
                }
                wizardState.candidates.forEach(item => {
                    const row = document.createElement('div');
                    row.className = 'am-wxt-item';
                    row.innerHTML = `
                        <div>
                            <div class="name">${Utils.escapeHtml(item.materialName || '(无标题商品)')}</div>
                            <div class="meta">宝贝ID：${Utils.escapeHtml(item.materialId)}</div>
                        </div>
                        <div class="actions">
                            <button class="am-wxt-btn">${addedSet.has(String(item.materialId)) ? '已添加' : '添加'}</button>
                        </div>
                    `;
                    const addBtn = row.querySelector('button');
                    addBtn.disabled = addedSet.has(String(item.materialId));
                    addBtn.onclick = () => {
                        if (wizardState.addedItems.length >= WIZARD_MAX_ITEMS) {
                            appendWizardLog(`最多添加 ${WIZARD_MAX_ITEMS} 个商品`, 'error');
                            return;
                        }
                        if (addedSet.has(String(item.materialId))) return;
                        wizardState.addedItems.push(item);
                        wizardState.addedItems = uniqueBy(wizardState.addedItems, x => String(x.materialId)).slice(0, WIZARD_MAX_ITEMS);
                        syncDraftFromUI();
                        renderAddedList();
                        renderCandidateList();
                    };
                    wizardState.els.candidateList.appendChild(row);
                });
            };

            const renderAddedList = () => {
                wizardState.els.addedCount.textContent = String(wizardState.addedItems.length);
                wizardState.els.addedList.innerHTML = '';
                if (!wizardState.addedItems.length) {
                    wizardState.els.addedList.innerHTML = '<div class="am-wxt-item"><div class="name">请先从左侧添加商品</div></div>';
                    return;
                }
                wizardState.addedItems.forEach((item, idx) => {
                    const row = document.createElement('div');
                    row.className = 'am-wxt-item';
                    row.innerHTML = `
                        <div>
                            <div class="name">${Utils.escapeHtml(item.materialName || '(无标题商品)')}</div>
                            <div class="meta">宝贝ID：${Utils.escapeHtml(item.materialId)}</div>
                        </div>
                        <div class="actions">
                            <button class="am-wxt-btn">上移</button>
                            <button class="am-wxt-btn">下移</button>
                            <button class="am-wxt-btn">移除</button>
                        </div>
                    `;
                    const [upBtn, downBtn, removeBtn] = row.querySelectorAll('button');
                    upBtn.disabled = idx === 0;
                    downBtn.disabled = idx === wizardState.addedItems.length - 1;
                    upBtn.onclick = () => {
                        if (idx === 0) return;
                        const clone = wizardState.addedItems.slice();
                        [clone[idx - 1], clone[idx]] = [clone[idx], clone[idx - 1]];
                        wizardState.addedItems = clone;
                        syncDraftFromUI();
                        renderAddedList();
                    };
                    downBtn.onclick = () => {
                        if (idx >= wizardState.addedItems.length - 1) return;
                        const clone = wizardState.addedItems.slice();
                        [clone[idx + 1], clone[idx]] = [clone[idx], clone[idx + 1]];
                        wizardState.addedItems = clone;
                        syncDraftFromUI();
                        renderAddedList();
                    };
                    removeBtn.onclick = () => {
                        wizardState.addedItems = wizardState.addedItems.filter((_, i) => i !== idx);
                        syncDraftFromUI();
                        renderAddedList();
                        renderCandidateList();
                    };
                    wizardState.els.addedList.appendChild(row);
                });
            };

            const loadCandidates = async (query = '', source = wizardState.candidateSource || 'recommend') => {
                setCandidateSource(source);
                wizardState.els.candidateList.innerHTML = '<div class="am-wxt-item"><div class="name">正在加载候选商品...</div></div>';
                try {
                    const useAll = wizardState.candidateSource === 'all';
                    const res = await searchItems({
                        bizCode: wizardState.draft?.bizCode || DEFAULTS.bizCode,
                        promotionScene: wizardState.draft?.promotionScene || DEFAULTS.promotionScene,
                        query,
                        pageSize: 40,
                        tagId: useAll ? null : '101111310',
                        channelKey: useAll ? '' : (query ? '' : 'effect')
                    });
                    wizardState.candidates = res.list;
                    renderCandidateList();
                    appendWizardLog(`候选商品已加载 ${res.list.length} 条（${useAll ? '全部商品' : '机会品推荐'}）`, 'success');
                } catch (err) {
                    wizardState.candidates = [];
                    renderCandidateList();
                    appendWizardLog(`加载候选商品失败：${err?.message || err}`, 'error');
                }
            };

            const buildRequestFromWizard = () => {
                syncDraftFromUI();
                const selectedSceneName = SCENE_OPTIONS.includes(wizardState.draft.sceneName) ? wizardState.draft.sceneName : '关键词推广';
                const sceneSettings = buildSceneSettingsPayload(selectedSceneName);
                const prefix = wizardState.draft.planNamePrefix || buildSceneTimePrefix(selectedSceneName);
                const dayAverageBudget = wizardState.draft.dayAverageBudget;
                const isKeywordScene = selectedSceneName === '关键词推广';
                const enabledStrategies = (wizardState.strategyList || []).filter(item => item.enabled);
                const plans = [];
                let seq = 0;
                wizardState.addedItems.forEach((item) => {
                    enabledStrategies.forEach((strategy) => {
                        const strategyBidMode = normalizeBidMode(strategy.bidMode || wizardState.draft.bidMode || 'smart', 'smart');
                        const strategyKeywordMode = strategy.keywordMode || wizardState.draft.keywordMode || DEFAULTS.keywordMode;
                        const strategyRecommendCount = Math.max(0, toNumber(strategy.recommendCount, toNumber(wizardState.draft.recommendCount, DEFAULTS.recommendCount)));
                        const strategyDefaultBid = toNumber(strategy.defaultBidPrice, toNumber(wizardState.draft.defaultBidPrice, 1));
                        const strategyManualKeywords = parseKeywords(strategy.manualKeywords || wizardState.draft.manualKeywords || '', {
                            bidPrice: strategyDefaultBid,
                            matchScope: DEFAULTS.matchScope,
                            onlineStatus: DEFAULTS.keywordOnlineStatus
                        });
                        seq += 1;
                        const strategySuffix = String(strategy.name || strategy.id || '策略')
                            .replace(/^关键词推广[-_]?/, '')
                            .replace(/[^\u4e00-\u9fa5A-Za-z0-9]/g, '') || '策略';
                        const finalPlanName = String(strategy.planName || '').trim()
                            || `${prefix}_${strategySuffix}_${String(seq).padStart(2, '0')}`;
                        const plan = {
                            planName: finalPlanName,
                            item,
                            bidMode: strategyBidMode,
                            keywords: strategyManualKeywords,
                            keywordDefaults: {
                                bidPrice: strategyDefaultBid,
                                matchScope: DEFAULTS.matchScope,
                                onlineStatus: DEFAULTS.keywordOnlineStatus
                            },
                            keywordSource: {
                                mode: strategyKeywordMode,
                                recommendCount: strategyRecommendCount
                            }
                        };
                        const strategyBudget = String(strategy.dayAverageBudget || '').trim();
                        const finalBudget = strategyBudget !== '' ? strategyBudget : dayAverageBudget;
                        if (finalBudget !== '') {
                            if (strategy.budgetType === 'day_budget') {
                                plan.budget = { dayBudget: toNumber(finalBudget, 0) };
                            } else {
                                plan.budget = { dayAverageBudget: toNumber(finalBudget, 0) };
                            }
                        }
                        const campaignOverride = {};
                        if (isKeywordScene) {
                            campaignOverride.bidTypeV2 = bidModeToBidType(strategyBidMode);
                            if (strategyBidMode === 'smart') {
                                if (strategy.bidTargetV2) {
                                    campaignOverride.bidTargetV2 = strategy.bidTargetV2;
                                    campaignOverride.optimizeTarget = strategy.bidTargetV2;
                                }
                                campaignOverride.setSingleCostV2 = !!strategy.setSingleCostV2;
                                if (strategy.setSingleCostV2 && strategy.singleCostV2 !== '') {
                                    campaignOverride.singleCostV2 = toNumber(strategy.singleCostV2, 0);
                                }
                            } else {
                                campaignOverride.setSingleCostV2 = false;
                            }
                        }
                        if (Object.keys(campaignOverride).length) {
                            plan.campaignOverride = campaignOverride;
                        }
                        plans.push(plan);
                    });
                });

                const commonKeywordMode = wizardState.draft.keywordMode || DEFAULTS.keywordMode;
                const commonRecommendCount = Math.max(0, toNumber(wizardState.draft.recommendCount, DEFAULTS.recommendCount));
                const commonDefaultBid = toNumber(wizardState.draft.defaultBidPrice, 1);
                const commonBidMode = normalizeBidMode(
                    wizardState.draft.bidMode || enabledStrategies[0]?.bidMode || 'smart',
                    'smart'
                );
                const common = {
                    keywordDefaults: {
                        bidPrice: commonDefaultBid,
                        matchScope: DEFAULTS.matchScope,
                        onlineStatus: DEFAULTS.keywordOnlineStatus
                    },
                    keywordMode: commonKeywordMode,
                    recommendCount: commonRecommendCount
                };
                if (isKeywordScene) {
                    common.bidMode = commonBidMode;
                }
                if (wizardState.crowdList.length) {
                    common.adgroupOverride = {
                        rightList: wizardState.crowdList.map(item => deepClone(item))
                    };
                }

                const sceneBizCodeHint = resolveSceneBizCodeHint(selectedSceneName);
                const requestBizCode = sceneBizCodeHint || wizardState.draft.bizCode || DEFAULTS.bizCode;
                const requestPromotionSceneDefault = resolveSceneDefaultPromotionScene(selectedSceneName, wizardState.draft.promotionScene || DEFAULTS.promotionScene);
                const requestPromotionScene = requestBizCode === DEFAULTS.bizCode
                    ? requestPromotionSceneDefault
                    : (wizardState.draft.promotionScene || '');
                const sceneMarketingGoal = normalizeGoalLabel(
                    sceneSettings.营销目标
                    || sceneSettings.优化目标
                    || ''
                );

                return {
                    bizCode: requestBizCode,
                    promotionScene: requestPromotionScene,
                    sceneName: selectedSceneName,
                    marketingGoal: sceneMarketingGoal || undefined,
                    sceneSettings,
                    fallbackPolicy: normalizeFallbackPolicy(wizardState.draft.fallbackPolicy || 'confirm', 'confirm'),
                    plans,
                    common
                };
            };

            const summarizePlanForPreview = (plan = null) => {
                if (!plan || !isPlainObject(plan)) return null;
                const item = isPlainObject(plan.item) ? plan.item : {};
                const budget = isPlainObject(plan.budget) ? plan.budget : null;
                const campaignOverride = isPlainObject(plan.campaignOverride) ? plan.campaignOverride : null;
                return {
                    planName: plan.planName || '',
                    bidMode: normalizeBidMode(plan.bidMode || '', 'smart'),
                    item: {
                        materialId: item.materialId || item.itemId || '',
                        materialName: item.materialName || ''
                    },
                    keywordCount: Array.isArray(plan.keywords) ? plan.keywords.length : 0,
                    keywordSource: isPlainObject(plan.keywordSource) ? plan.keywordSource : {},
                    budget,
                    campaignOverride
                };
            };

            const renderPreview = (request) => {
                const preview = {
                    bizCode: request.bizCode,
                    promotionScene: request.promotionScene,
                    sceneName: request.sceneName || wizardState.draft?.sceneName || '',
                    sceneSettingCount: isPlainObject(request.sceneSettings) ? Object.keys(request.sceneSettings).filter(key => String(request.sceneSettings[key] || '').trim() !== '').length : 0,
                    planCount: request.plans.length,
                    strategyCount: (wizardState.strategyList || []).filter(item => item.enabled).length,
                    bidMode: request.common?.bidMode || 'smart',
                    fallbackPolicy: request.fallbackPolicy || 'confirm',
                    keywordMode: request.common?.keywordMode,
                    recommendCount: request.common?.recommendCount,
                    crowdCount: Array.isArray(request.common?.adgroupOverride?.rightList) ? request.common.adgroupOverride.rightList.length : 0,
                    firstPlan: summarizePlanForPreview(request.plans[0] || null)
                };
                wizardState.els.preview.textContent = JSON.stringify(preview, null, 2);
            };

            const loadRecommendedKeywords = async () => {
                if (!wizardState.addedItems.length) {
                    appendWizardLog('请先添加商品，再加载推荐关键词', 'error');
                    return;
                }
                const editingStrategy = getStrategyById(wizardState.editingStrategyId) || wizardState.strategyList.find(item => item.enabled) || wizardState.strategyList[0];
                if (!editingStrategy) {
                    appendWizardLog('请先选择一个策略并点击“编辑计划”', 'error');
                    return;
                }
                const targetItem = wizardState.addedItems[0];
                const recommendCount = Math.max(1, toNumber(wizardState.els.recommendCountInput.value.trim(), DEFAULTS.recommendCount));
                const defaultBid = toNumber(wizardState.els.bidInput.value.trim(), 1);
                const keywordDefaults = {
                    bidPrice: defaultBid,
                    matchScope: DEFAULTS.matchScope,
                    onlineStatus: DEFAULTS.keywordOnlineStatus
                };
                appendWizardLog(`开始加载推荐关键词：${targetItem.materialName || targetItem.materialId}`);
                try {
                    const runtime = await getRuntimeDefaults(false);
                    runtime.bizCode = wizardState.draft?.bizCode || runtime.bizCode || DEFAULTS.bizCode;
                    runtime.promotionScene = wizardState.draft?.promotionScene || runtime.promotionScene || DEFAULTS.promotionScene;
                    const recommendedWords = await fetchRecommendWordList({
                        bizCode: runtime.bizCode,
                        materialId: targetItem.materialId || targetItem.itemId,
                        defaults: runtime,
                        source: 'auto'
                    });
                    const normalizedRecommend = recommendedWords
                        .map(word => applyKeywordDefaults(word, keywordDefaults))
                        .filter(word => word.word)
                        .slice(0, recommendCount);
                    if (!normalizedRecommend.length) {
                        appendWizardLog('未获取到推荐关键词，请稍后重试', 'error');
                        return;
                    }

                    const manualWords = parseKeywords(wizardState.els.manualInput.value || '', keywordDefaults)
                        .map(word => applyKeywordDefaults(word, keywordDefaults));
                    const dedupMap = new Map();
                    manualWords.forEach(word => dedupMap.set(word.word, word));
                    normalizedRecommend.forEach(word => {
                        if (!dedupMap.has(word.word)) dedupMap.set(word.word, word);
                    });
                    const mergedWords = Array.from(dedupMap.values()).slice(0, 200);
                    wizardState.els.manualInput.value = mergedWords.map(formatKeywordLine).join('\n');
                    pullDetailFormToStrategy(editingStrategy);
                    syncDraftFromUI();
                    renderStrategyList();
                    if (typeof wizardState.buildRequest === 'function') {
                        wizardState.renderPreview(wizardState.buildRequest());
                    }
                    appendWizardLog(`推荐关键词已加载 ${normalizedRecommend.length} 条（合并后 ${mergedWords.length} 条）`, 'success');
                } catch (err) {
                    appendWizardLog(`加载推荐关键词失败：${err?.message || err}`, 'error');
                }
            };

            const loadRecommendedCrowds = async () => {
                appendWizardLog('开始加载推荐人群...');
                try {
                    const runtime = await getRuntimeDefaults(false);
                    runtime.bizCode = wizardState.draft?.bizCode || runtime.bizCode || DEFAULTS.bizCode;
                    runtime.promotionScene = wizardState.draft?.promotionScene || runtime.promotionScene || DEFAULTS.promotionScene;
                    const materialIdList = wizardState.addedItems
                        .map(item => toIdValue(item.materialId || item.itemId))
                        .filter(Boolean)
                        .slice(0, 10);
                    const crowdList = await fetchRecommendCrowdList({
                        bizCode: runtime.bizCode,
                        defaults: runtime,
                        labelIdList: DEFAULTS.recommendCrowdLabelIds,
                        materialIdList
                    });
                    const fallbackRightList = Array.isArray(runtime?.solutionTemplate?.adgroupList?.[0]?.rightList)
                        ? runtime.solutionTemplate.adgroupList[0].rightList.map(item => deepClone(item))
                        : [];
                    const mergedCrowdList = crowdList.length ? crowdList : fallbackRightList;
                    if (!mergedCrowdList.length) {
                        appendWizardLog('未获取到推荐人群，可直接创建（默认不限人群）', 'error');
                        return;
                    }
                    wizardState.crowdList = uniqueBy(
                        mergedCrowdList,
                        item => item?.mx_crowdId || `${item?.crowd?.label?.labelId || ''}_${item?.crowd?.label?.optionList?.[0]?.optionValue || ''}`
                    ).slice(0, 50);
                    syncDraftFromUI();
                    renderCrowdList();
                    if (typeof wizardState.buildRequest === 'function') {
                        wizardState.renderPreview(wizardState.buildRequest());
                    }
                    appendWizardLog(`推荐人群已加载 ${wizardState.crowdList.length} 条`, 'success');
                } catch (err) {
                    appendWizardLog(`加载推荐人群失败：${err?.message || err}`, 'error');
                }
            };

            const resolveSceneSyncItemId = () => {
                const fromWizard = wizardState.addedItems
                    .map(item => String(item?.materialId || item?.itemId || '').trim())
                    .find(Boolean);
                if (fromWizard) return fromWizard;
                const pageItemIds = extractPageAddedItemIds();
                if (Array.isArray(pageItemIds) && pageItemIds.length) {
                    return String(pageItemIds[0] || '').trim();
                }
                return SCENE_SYNC_DEFAULT_ITEM_ID;
            };

            const scheduleSceneCreateContractSync = (sceneName, options = {}) => {
                const targetScene = String(sceneName || '').trim();
                if (!SCENE_OPTIONS.includes(targetScene)) return;
                const forceRefresh = options.forceRefresh === true;
                if (!forceRefresh) {
                    const cached = getCachedSceneCreateContract(targetScene, '');
                    if (cached) return;
                }
                if (wizardState.sceneSyncTimer) {
                    clearTimeout(wizardState.sceneSyncTimer);
                    wizardState.sceneSyncTimer = 0;
                }
                const delayMs = Math.max(180, toNumber(options.delayMs, 420));
                const token = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
                wizardState.sceneSyncPendingToken = token;
                wizardState.sceneSyncTimer = window.setTimeout(async () => {
                    if (wizardState.sceneSyncPendingToken !== token) return;
                    if (wizardState.sceneSyncInFlight) return;
                    wizardState.sceneSyncInFlight = true;
                    const itemId = resolveSceneSyncItemId();
                    appendWizardLog(`场景接口同步：${targetScene}（itemId=${itemId}）`);
                    try {
                        const capture = await captureSceneCreateInterfaces(targetScene, {
                            itemId,
                            passMode: 'interface',
                            captureInterfaces: true,
                            fallbackPolicy: 'none',
                            batchRetry: 0,
                            maxRetries: 1,
                            timeoutMs: Math.max(18000, toNumber(options.timeoutMs, 35000)),
                            requestTimeout: Math.max(10000, toNumber(options.requestTimeout, 22000)),
                            dayAverageBudget: Math.max(50, toNumber(options.dayAverageBudget, 100))
                        });
                        const row = isPlainObject(capture?.row) ? capture.row : {};
                        const createInterfaces = Array.isArray(row?.capture?.createInterfaces)
                            ? row.capture.createInterfaces
                            : [];
                        if (createInterfaces.length) {
                            const goalLabel = normalizeGoalLabel(row?.requestPreview?.marketingGoal || '');
                            const rememberedContract = rememberSceneCreateInterfaces(
                                targetScene,
                                goalLabel,
                                createInterfaces,
                                { source: 'scene_switch_sync' }
                            );
                            appendWizardLog(
                                `场景接口已同步：${targetScene} endpoint=${rememberedContract?.endpoint || row.submitEndpoint || '-'} requestKeys=${toNumber(rememberedContract?.requestKeys?.length, 0)}`,
                                'success'
                            );
                        } else {
                            appendWizardLog(`场景接口同步未捕获到创建请求：${targetScene}${row?.error ? `（${row.error}）` : ''}`, 'error');
                        }
                    } catch (err) {
                        appendWizardLog(`场景接口同步失败：${targetScene} -> ${err?.message || err}`, 'error');
                    } finally {
                        wizardState.sceneSyncInFlight = false;
                    }
                }, delayMs);
            };

            const switchSceneFromEditor = (sceneName) => {
                const nextScene = String(sceneName || '').trim();
                if (!SCENE_OPTIONS.includes(nextScene)) return;
                wizardState.draft = wizardState.draft || wizardDefaultDraft();
                const prevScene = wizardState.draft.sceneName;
                const prevPrefix = String(wizardState.draft.planNamePrefix || '').trim();
                wizardState.draft.sceneName = nextScene;
                const sceneBizCodeHint = resolveSceneBizCodeHint(nextScene);
                if (sceneBizCodeHint) wizardState.draft.bizCode = sceneBizCodeHint;
                if (sceneBizCodeHint && sceneBizCodeHint !== DEFAULTS.bizCode) {
                    wizardState.draft.promotionScene = '';
                } else if (!wizardState.draft.promotionScene) {
                    wizardState.draft.promotionScene = DEFAULTS.promotionScene;
                }
                if (wizardState.els.sceneSelect && wizardState.els.sceneSelect.value !== nextScene) {
                    wizardState.els.sceneSelect.value = nextScene;
                }
                if (isAutoGeneratedPlanPrefix(prevPrefix) || !prevPrefix) {
                    const nextPrefix = buildDefaultPlanPrefixByScene(nextScene);
                    wizardState.draft.planNamePrefix = nextPrefix;
                    if (wizardState.els.prefixInput) wizardState.els.prefixInput.value = nextPrefix;
                }
                renderSceneDynamicConfig();
                renderStaticOptionLines();
                syncDraftFromUI();
                renderStrategyList();
                if (typeof wizardState.buildRequest === 'function') {
                    wizardState.renderPreview(wizardState.buildRequest());
                }
                refreshSceneProfileFromSpec(nextScene, {
                    scanMode: 'full_top_down',
                    unlockPolicy: 'safe_only',
                    goalScan: true,
                    silent: true
                });
                if (prevScene !== nextScene) {
                    appendWizardLog(`场景配置已切换：${nextScene}${sceneBizCodeHint ? `（${sceneBizCodeHint}）` : ''}`, 'success');
                }
                scheduleSceneCreateContractSync(nextScene, {
                    forceRefresh: prevScene !== nextScene
                });
            };

            wizardState.els.closeBtn.onclick = () => {
                syncDraftFromUI();
                setDetailVisible(false);
                overlay.classList.remove('open');
                wizardState.visible = false;
            };
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) wizardState.els.closeBtn.click();
            });
            wizardState.els.searchBtn.onclick = () => loadCandidates(wizardState.els.searchInput.value.trim(), wizardState.candidateSource);
            wizardState.els.hotBtn.onclick = () => {
                wizardState.els.searchInput.value = '';
                loadCandidates('', 'recommend');
            };
            wizardState.els.allBtn.onclick = () => {
                wizardState.els.searchInput.value = '';
                loadCandidates('', 'all');
            };
            wizardState.els.searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    wizardState.els.searchBtn.click();
                }
            });
            wizardState.els.addAllBtn.onclick = () => {
                if (!wizardState.candidates.length) return;
                const room = Math.max(0, WIZARD_MAX_ITEMS - wizardState.addedItems.length);
                if (!room) {
                    appendWizardLog(`已达到上限 ${WIZARD_MAX_ITEMS} 个商品`, 'error');
                    return;
                }
                const addedSet = new Set(wizardState.addedItems.map(item => String(item.materialId)));
                const pick = wizardState.candidates.filter(item => !addedSet.has(String(item.materialId))).slice(0, room);
                wizardState.addedItems = wizardState.addedItems.concat(pick);
                syncDraftFromUI();
                renderAddedList();
                renderCandidateList();
                appendWizardLog(`已批量添加 ${pick.length} 个商品`, 'success');
            };
            wizardState.els.clearAddedBtn.onclick = () => {
                wizardState.addedItems = [];
                syncDraftFromUI();
                renderAddedList();
                renderCandidateList();
            };
            wizardState.els.loadRecommendBtn.onclick = () => {
                loadRecommendedKeywords();
            };
            wizardState.els.loadCrowdBtn.onclick = () => {
                loadRecommendedCrowds();
            };
            wizardState.els.sceneSelect.onchange = () => {
                switchSceneFromEditor(wizardState.els.sceneSelect.value);
            };
            [wizardState.els.sceneSelect, wizardState.els.bidModeSelect, wizardState.els.bidTargetSelect, wizardState.els.budgetTypeSelect, wizardState.els.modeSelect]
                .forEach(select => {
                    if (!(select instanceof HTMLSelectElement)) return;
                    select.addEventListener('change', () => {
                        renderSelectOptionLine(select);
                    });
                });
            wizardState.els.scanScenesBtn.onclick = async () => {
                setDebugVisible(true);
                appendWizardLog('开始抓取 6 个场景的参数与选项（分层扫描）...');
                wizardState.els.scanScenesBtn.disabled = true;
                try {
                    const result = await scanAllSceneSettings({
                        onProgress: ({ event, sceneName, index, total, labels, radios, snapshots, pathText, snapshotIndex, maxSnapshots, error }) => {
                            if (event === 'scene_start') {
                                appendWizardLog(`抓取场景：${sceneName} (${index}/${total})`);
                            } else if (event === 'scene_layer_snapshot') {
                                appendWizardLog(`分层扫描：${sceneName} -> ${pathText || '(根层)'} (${snapshotIndex}/${maxSnapshots})`);
                            } else if (event === 'scene_layer_path_error') {
                                appendWizardLog(`层级路径失败：${sceneName} -> ${pathText || '(根层)'}：${error || '未知错误'}`, 'error');
                            } else if (event === 'scene_done') {
                                appendWizardLog(`场景完成：${sceneName}（标签 ${labels}，单选 ${radios}，快照 ${snapshots || 1}）`, 'success');
                            }
                        }
                    });
                    wizardState.sceneProfiles = buildSceneProfiles();
                    renderSceneDynamicConfig();
                    syncDraftFromUI();
                    wizardState.els.preview.textContent = JSON.stringify(result, null, 2);
                    appendWizardLog(`场景抓取完成：成功 ${result.successCount}，失败 ${result.failCount}`, result.ok ? 'success' : 'error');
                } catch (err) {
                    appendWizardLog(`场景抓取异常：${err?.message || err}`, 'error');
                } finally {
                    wizardState.els.scanScenesBtn.disabled = false;
                }
            };
            wizardState.els.clearCrowdBtn.onclick = () => {
                wizardState.crowdList = [];
                syncDraftFromUI();
                renderCrowdList();
                if (typeof wizardState.buildRequest === 'function') {
                    wizardState.renderPreview(wizardState.buildRequest());
                }
                appendWizardLog('已清空人群设置');
            };
            wizardState.els.toggleDebugBtn.onclick = () => {
                setDebugVisible(!wizardState.debugVisible);
                syncDraftFromUI();
            };

            const closeDetailDialog = () => {
                const editingStrategy = getStrategyById(wizardState.editingStrategyId);
                if (editingStrategy) pullDetailFormToStrategy(editingStrategy);
                setDetailVisible(false);
                syncDraftFromUI();
                renderStrategyList();
                if (typeof wizardState.buildRequest === 'function') {
                    wizardState.renderPreview(wizardState.buildRequest());
                }
            };
            wizardState.els.backSimpleBtn.onclick = closeDetailDialog;
            if (wizardState.els.detailCloseBtn) {
                wizardState.els.detailCloseBtn.onclick = closeDetailDialog;
            }
            if (wizardState.els.detailBackdrop) {
                wizardState.els.detailBackdrop.onclick = closeDetailDialog;
            }

            const handlePreview = () => {
                try {
                    const req = buildRequestFromWizard();
                    renderPreview(req);
                    appendWizardLog(`预览已生成：${req.plans.length} 个计划`, 'success');
                } catch (err) {
                    appendWizardLog(`预览失败：${err?.message || err}`, 'error');
                }
            };
            wizardState.els.previewBtn.onclick = handlePreview;
            wizardState.els.previewQuickBtn.onclick = handlePreview;

            const handleRun = async () => {
                const req = buildRequestFromWizard();
                const pageItemIds = extractPageAddedItemIds();
                if (!req.plans.length && !pageItemIds.length) {
                    appendWizardLog('请先添加商品并勾选策略后再创建', 'error');
                    return;
                }
                if (!req.plans.length && pageItemIds.length) {
                    appendWizardLog(`本地未选商品，已自动读取页面已添加商品 ${pageItemIds.length} 条继续创建`);
                }
                renderPreview(req);
                appendWizardLog(`开始批量创建 ${req.plans.length || pageItemIds.length || 0} 个计划...`);
                wizardState.els.runBtn.disabled = true;
                wizardState.els.runQuickBtn.disabled = true;
                try {
                    const result = await createPlansByScene(req.sceneName, req, {
                        onProgress: ({ event, ...payload }) => {
                            if (event === 'scene_runtime_sync_start') {
                                appendWizardLog(`场景运行时同步：${payload.currentBizCode || '-'} -> ${payload.expectedBizCode || '-'}（${payload.sceneName || '未命名场景'}）`);
                            } else if (event === 'scene_runtime_synced') {
                                if (payload.matched === false) {
                                    appendWizardLog(`场景运行时同步结果不匹配：当前 ${payload.currentBizCode || '-'}，期望 ${payload.expectedBizCode || '-'}（${payload.sceneName || '未命名场景'}）`, 'error');
                                } else {
                                    appendWizardLog(`场景运行时已同步：${payload.currentBizCode || '-'}（${payload.sceneName || '未命名场景'}）`, 'success');
                                }
                            } else if (event === 'scene_runtime_sync_failed') {
                                appendWizardLog(`场景运行时同步失败：${payload.error || '未知错误'}`, 'error');
                            } else if (event === 'scene_runtime_sync_abort') {
                                if (payload.error) {
                                    appendWizardLog(`场景运行时同步中止：${payload.error}`, 'error');
                                } else {
                                    appendWizardLog(`场景运行时同步中止：当前 ${payload.currentBizCode || '-'}，期望 ${payload.expectedBizCode || '-'}（${payload.sceneName || '未命名场景'}）`, 'error');
                                }
                            } else if (event === 'goal_resolution_warning') {
                                const warningList = Array.isArray(payload.warnings) ? payload.warnings : [];
                                if (warningList.length) {
                                    warningList.slice(0, 5).forEach(msg => {
                                        appendWizardLog(`营销目标告警：${msg}`, 'error');
                                    });
                                }
                            } else if (event === 'build_solution_item') {
                                appendWizardLog(`组装计划：${payload.planName} (${payload.index}/${payload.total})`);
                            } else if (event === 'submit_batch_start') {
                                appendWizardLog(`提交批次 ${payload.batchIndex}/${payload.batchTotal}，数量 ${payload.size}${payload.endpoint ? `，endpoint=${payload.endpoint}` : ''}`);
                            } else if (event === 'submit_payload_snapshot') {
                                const campaignKeys = Array.isArray(payload.campaignKeys) ? payload.campaignKeys.join(',') : '';
                                const adgroupKeys = Array.isArray(payload.adgroupKeys) ? payload.adgroupKeys.join(',') : '';
                                appendWizardLog(`提交预览：scene=${payload.sceneName || '-'} goal=${payload.marketingGoal || '-'} promotionScene=${payload.promotionScene || '-'} bidType=${payload.bidTypeV2 || '-'} bidTarget=${payload.bidTargetV2 || '-'} optimizeTarget=${payload.optimizeTarget || '-'} bidMode=${payload.bidMode || '-'} endpoint=${payload.submitEndpoint || '-'} materialId=${payload.materialId || '-'} wordList=${payload.wordListCount || 0} wordPackage=${payload.wordPackageCount || 0} fallbackTriggered=${payload.fallbackTriggered ? 'yes' : 'no'} goalFallback=${payload.goalFallbackUsed ? 'yes' : 'no'} campaignKeys=[${campaignKeys}] adgroupKeys=[${adgroupKeys}]`);
                            } else if (event === 'submit_batch_retry') {
                                appendWizardLog(`批次重试 #${payload.attempt}：${payload.error}`, 'error');
                            } else if (event === 'submit_batch_success') {
                                if (payload.failedCount > 0) {
                                    appendWizardLog(`批次部分成功：成功 ${payload.createdCount}，失败 ${payload.failedCount}${payload.error ? `（${payload.error}）` : ''}`, 'error');
                                } else {
                                    appendWizardLog(`批次成功：${payload.createdCount} 个`, 'success');
                                }
                            } else if (event === 'fallback_downgrade_pending') {
                                const pendingText = payload.policy === 'auto'
                                    ? '检测到词包校验失败，准备自动降级重试'
                                    : '检测到词包校验失败，等待降级确认';
                                appendWizardLog(`${pendingText}（批次 ${payload.batchIndex}，失败 ${payload.count}，策略=${payload.policy}）`, 'error');
                            } else if (event === 'fallback_downgrade_confirmed') {
                                appendWizardLog(`用户确认降级重试（批次 ${payload.batchIndex}，数量 ${payload.count}${payload.auto ? '，自动策略' : ''}）`, 'success');
                            } else if (event === 'fallback_downgrade_canceled') {
                                appendWizardLog(`用户取消降级（批次 ${payload.batchIndex}，数量 ${payload.count}）`, 'error');
                            } else if (event === 'fallback_downgrade_result') {
                                appendWizardLog(`降级重试结果：成功${payload.successCount || 0}/失败${payload.failCount || 0}`, (payload.failCount || 0) > 0 ? 'error' : 'success');
                            } else if (event === 'submit_batch_fallback_single') {
                                appendWizardLog(`${payload.fallbackTriggered ? '批次降级单计划重试' : '批次单计划重试'}：${payload.error}`, 'error');
                            }
                        }
                    });
                    appendWizardLog(`完成：成功 ${result.successCount}，失败 ${result.failCount}`, result.ok ? 'success' : 'error');
                    if (result.failures.length) {
                        result.failures.slice(0, 3).forEach(item => {
                            appendWizardLog(`失败明细：${item.planName || '-'} -> ${item.error || '未知错误'}`, 'error');
                        });
                    }
                } catch (err) {
                    appendWizardLog(`创建异常：${err?.message || err}`, 'error');
                } finally {
                    wizardState.els.runBtn.disabled = false;
                    wizardState.els.runQuickBtn.disabled = false;
                }
            };
            wizardState.els.runBtn.onclick = handleRun;
            wizardState.els.runQuickBtn.onclick = handleRun;
            wizardState.els.clearDraftBtn.onclick = () => {
                clearSessionDraft();
                wizardState.draft = wizardDefaultDraft();
                wizardState.draft.sceneName = '关键词推广';
                wizardState.addedItems = [];
                wizardState.crowdList = [];
                wizardState.candidates = [];
                fillUIFromDraft();
                renderStrategyList();
                renderAddedList();
                renderCrowdList();
                renderCandidateList();
                if (typeof wizardState.buildRequest === 'function') {
                    wizardState.renderPreview(wizardState.buildRequest());
                }
                appendWizardLog('已清空会话草稿');
            };
            [wizardState.els.prefixInput, wizardState.els.budgetInput, wizardState.els.bidInput, wizardState.els.bidModeSelect, wizardState.els.modeSelect, wizardState.els.recommendCountInput, wizardState.els.manualInput, wizardState.els.bidTargetSelect, wizardState.els.budgetTypeSelect, wizardState.els.singleCostEnableInput, wizardState.els.singleCostInput]
                .forEach(el => {
                    if (!el) return;
                    el.addEventListener('input', syncDraftFromUI);
                    el.addEventListener('change', syncDraftFromUI);
                });
            wizardState.els.budgetInput.addEventListener('change', renderStrategyList);
            wizardState.els.bidTargetSelect.addEventListener('change', () => {
                syncDraftFromUI();
                renderStrategyList();
                if (typeof wizardState.buildRequest === 'function') {
                    wizardState.renderPreview(wizardState.buildRequest());
                }
            });
            wizardState.els.bidModeSelect.addEventListener('change', () => {
                updateBidModeControls(wizardState.els.bidModeSelect.value);
                syncDraftFromUI();
                renderStrategyList();
                if (typeof wizardState.buildRequest === 'function') {
                    wizardState.renderPreview(wizardState.buildRequest());
                }
            });
            wizardState.els.singleCostEnableInput.addEventListener('change', () => {
                wizardState.els.singleCostInput.disabled = !wizardState.els.singleCostEnableInput.checked;
                syncDraftFromUI();
            });

            wizardState.renderStrategyList = renderStrategyList;
            wizardState.openStrategyDetail = openStrategyDetail;
            wizardState.renderCandidateList = renderCandidateList;
            wizardState.renderAddedList = renderAddedList;
            wizardState.renderCrowdList = renderCrowdList;
            wizardState.loadCandidates = loadCandidates;
            wizardState.loadRecommendedKeywords = loadRecommendedKeywords;
            wizardState.loadRecommendedCrowds = loadRecommendedCrowds;
            wizardState.setCandidateSource = setCandidateSource;
            wizardState.setDebugVisible = setDebugVisible;
            wizardState.fillUIFromDraft = fillUIFromDraft;
            wizardState.appendWizardLog = appendWizardLog;
            wizardState.renderPreview = renderPreview;
            wizardState.buildRequest = buildRequestFromWizard;
            wizardState.refreshSceneProfileFromSpec = refreshSceneProfileFromSpec;
            wizardState.mounted = true;
        };

        const openWizard = () => {
            mountWizard();
            wizardState.openToken = (toNumber(wizardState.openToken, 0) + 1);
            const openToken = wizardState.openToken;
            const isStaleOpen = () => openToken !== wizardState.openToken;

            wizardState.draft = mergeDeep(wizardDefaultDraft(), readSessionDraft() || {});
            wizardState.draft.detailVisible = false;
            if (!SCENE_NAME_LIST.includes(wizardState.draft.sceneName)) {
                const currentSceneName = inferCurrentSceneName();
                wizardState.draft.sceneName = SCENE_NAME_LIST.includes(currentSceneName) ? currentSceneName : '关键词推广';
            }
            const initSceneBizCodeHint = resolveSceneBizCodeHint(wizardState.draft.sceneName);
            if (initSceneBizCodeHint && !wizardState.draft.bizCode) {
                wizardState.draft.bizCode = initSceneBizCodeHint;
            }
            if (wizardState.draft.bizCode && wizardState.draft.bizCode !== DEFAULTS.bizCode) {
                wizardState.draft.promotionScene = '';
            } else if (!wizardState.draft.promotionScene) {
                wizardState.draft.promotionScene = DEFAULTS.promotionScene;
            }
            wizardState.addedItems = Array.isArray(wizardState.draft.addedItems)
                ? wizardState.draft.addedItems.map(normalizeItem).filter(item => item.materialId).slice(0, WIZARD_MAX_ITEMS)
                : [];

            wizardState.fillUIFromDraft();
            refreshSceneSelect();
            if (typeof wizardState.renderStrategyList === 'function') {
                wizardState.renderStrategyList();
            }
            wizardState.renderAddedList();
            wizardState.renderCrowdList();
            wizardState.renderCandidateList();
            if (typeof wizardState.setCandidateSource === 'function') {
                wizardState.setCandidateSource(wizardState.candidateSource || 'recommend');
            }
            if (typeof wizardState.buildRequest === 'function') {
                wizardState.renderPreview(wizardState.buildRequest());
            }
            wizardState.els.log.innerHTML = '';
            if (wizardState.els.quickLog) {
                wizardState.els.quickLog.innerHTML = '';
            }
            wizardState.appendWizardLog(`向导已就绪（build ${BUILD_VERSION}），支持双列表选品与批量创建`);
            wizardState.appendWizardLog('正在后台同步运行时和商品列表...');

            wizardState.els.overlay.classList.add('open');
            wizardState.visible = true;
            if (typeof wizardState.refreshSceneProfileFromSpec === 'function') {
                wizardState.refreshSceneProfileFromSpec(wizardState.draft.sceneName, {
                    scanMode: 'visible',
                    unlockPolicy: 'safe_only',
                    goalScan: false,
                    silent: true
                });
            }

            if (!wizardState.candidates.length) {
                wizardState.loadCandidates('', wizardState.candidateSource || 'recommend');
            }

            (async () => {
                let runtimeForInit = null;
                try {
                    runtimeForInit = await getRuntimeDefaults(false);
                    if (isStaleOpen()) return;
                    applyRuntimeToDraft(runtimeForInit, wizardState.draft.sceneName);
                    wizardState.fillUIFromDraft();
                    refreshSceneSelect();
                    if (typeof wizardState.renderStrategyList === 'function') {
                        wizardState.renderStrategyList();
                    }
                    if (typeof wizardState.buildRequest === 'function') {
                        wizardState.renderPreview(wizardState.buildRequest());
                    }
                } catch (err) {
                    log.warn('初始化运行时默认值失败:', err?.message || err);
                }

                if (wizardState.addedItems.length) return;
                try {
                    const runtime = runtimeForInit || await getRuntimeDefaults(false);
                    if (isStaleOpen()) return;
                    const preferred = await resolvePreferredItems({}, runtime);
                    if (isStaleOpen()) return;
                    wizardState.addedItems = preferred.slice(0, WIZARD_MAX_ITEMS);
                    wizardState.draft.addedItems = wizardState.addedItems;
                    saveSessionDraft(wizardState.draft);
                    wizardState.renderAddedList();
                    wizardState.renderCandidateList();
                    if (typeof wizardState.buildRequest === 'function') {
                        wizardState.renderPreview(wizardState.buildRequest());
                    }
                } catch (err) {
                    log.warn('初始化已添加商品失败:', err?.message || err);
                }
            })();
        };

        const getSessionDraft = () => readSessionDraft();
        const withSceneRequest = (sceneName, request = {}) => mergeDeep({}, request, {
            sceneName: String(sceneName || '').trim()
        });
        const createPlansByScene = async (sceneName, request = {}, options = {}) => {
            const nextScene = String(sceneName || request?.sceneName || '').trim();
            const sceneRequest = nextScene ? withSceneRequest(nextScene, request) : mergeDeep({}, request);
            if (options?.applySceneSpec === false) {
                return createPlansBatch(sceneRequest, options);
            }
            const sceneValidation = await validateSceneRequest(nextScene, sceneRequest, {
                scanMode: options?.scanMode || 'full_top_down',
                unlockPolicy: options?.unlockPolicy || 'safe_only',
                goalScan: options?.goalScan !== false,
                refresh: !!options?.refreshSceneSpec,
                forceRuntimeRefresh: !!options?.forceRuntimeRefresh
            });
            const normalizedRequest = sceneValidation?.normalizedRequest || sceneRequest;
            const result = await createPlansBatch(normalizedRequest, options);
            result.sceneRequestValidation = {
                filledDefaults: sceneValidation?.filledDefaults || [],
                warnings: sceneValidation?.warnings || [],
                missingCritical: sceneValidation?.missingCritical || [],
                sceneSpecMeta: sceneValidation?.sceneSpecMeta || null,
                resolvedMarketingGoal: sceneValidation?.resolvedMarketingGoal || '',
                goalFallbackUsed: !!sceneValidation?.goalFallbackUsed,
                goalWarnings: sceneValidation?.goalWarnings || []
            };
            return result;
        };
        const buildSmokeTestRequestByScene = (sceneName = '', itemId = '', options = {}) => {
            const stamp = buildTemplateTimestamp(new Date());
            const idx = toNumber(options.index, 1);
            const uniqueTail = `${String(Date.now()).slice(-6)}${Math.floor(Math.random() * 90 + 10)}`;
            const defaultPlanName = `${sceneName}_${stamp}_${String(idx).padStart(2, '0')}_${uniqueTail}`;
            const planName = sceneName === '货品全站推广'
                ? `site${stamp}${String(idx).padStart(2, '0')}`
                : defaultPlanName;
            const plan = {
                planName,
                budget: {
                    dayAverageBudget: Math.max(30, toNumber(options.dayAverageBudget, 100))
                }
            };
            if (itemId) {
                plan.itemId = String(itemId).trim();
            }
            const req = {
                sceneName,
                plans: [plan]
            };
            if (sceneName === '关键词推广') {
                req.common = {
                    bidMode: 'manual',
                    keywordMode: 'manual',
                    keywordDefaults: {
                        matchScope: 4,
                        bidPrice: 1,
                        onlineStatus: 1
                    }
                };
                plan.keywords = ['测试词A', '测试词B', '测试词C'];
            } else if (sceneName === '内容营销') {
                req.common = {
                    campaignOverride: {
                        launchTime: buildDefaultLaunchTime({ forever: true }),
                        optimizeTarget: 'ad_strategy_buy_net',
                        itemSelectedMode: 'user_define',
                        promotionModel: 'daily',
                        launchPeriodList: buildDefaultLaunchPeriodList(),
                        launchAreaStrList: ['all']
                    }
                };
            } else if (sceneName === '线索推广') {
                plan.budget = {
                    totalBudget: Math.max(1500, toNumber(options.dayAverageBudget, 3000))
                };
                req.common = {
                    campaignOverride: {
                        dmcType: 'total',
                        promotionModel: 'order',
                        promotionModelMarketing: 'strategy',
                        orderChargeType: 'balance_charge',
                        optimizeTarget: 'leads_cost',
                        itemSelectedMode: 'user_define',
                        launchTime: buildDefaultLaunchTime({ days: 7, forever: false }),
                        planId: 308,
                        planTemplateId: 308,
                        packageTemplateId: 74,
                        launchPeriodList: buildDefaultLaunchPeriodList(),
                        launchAreaStrList: ['all']
                    }
                };
            }
            return req;
        };
        const runSceneSmokeTests = async (options = {}) => {
            const itemId = String(options.itemId || options.materialId || '').trim();
            const scenes = Array.isArray(options.scenes) && options.scenes.length
                ? uniqueBy(options.scenes.map(item => String(item || '').trim()).filter(Boolean), item => item)
                : SCENE_NAME_LIST.slice();
            const timeoutMs = Math.max(15000, toNumber(options.timeoutMs, 50000));
            const createMode = options.createMode !== false;
            const captureInterfaces = createMode && options.captureInterfaces !== false;
            const passMode = (() => {
                const mode = String(options.passMode || '').trim();
                if (mode === 'create' || mode === 'both' || mode === 'interface') return mode;
                return createMode ? 'interface' : 'create';
            })();
            const list = [];
            for (let i = 0; i < scenes.length; i++) {
                const sceneName = scenes[i];
                const request = buildSmokeTestRequestByScene(sceneName, itemId, {
                    index: i + 1,
                    dayAverageBudget: toNumber(options.dayAverageBudget, 100)
                });
                const row = {
                    sceneName,
                    itemId,
                    mode: createMode ? 'create' : 'validate',
                    passMode,
                    requestPreview: {
                        planName: request?.plans?.[0]?.planName || '',
                        submitEndpoint: request.submitEndpoint || '',
                        marketingGoal: request.marketingGoal || ''
                    },
                    ok: false,
                    createOk: false,
                    interfaceOk: false,
                    timeout: false,
                    successCount: 0,
                    failCount: 0,
                    submitEndpoint: '',
                    failTop: '',
                    error: '',
                    capture: {
                        enabled: captureInterfaces,
                        captureId: '',
                        recordCount: 0,
                        contractCount: 0,
                        createInterfaceCount: 0,
                        createEndpoints: [],
                        createInterfaces: [],
                        contracts: []
                    },
                    ts: new Date().toISOString()
                };
                if (typeof options.onProgress === 'function') {
                    try {
                        options.onProgress({
                            event: 'scene_smoke_start',
                            sceneName,
                            index: i + 1,
                            total: scenes.length,
                            mode: row.mode,
                            passMode
                        });
                    } catch { }
                }
                if (!createMode) {
                    try {
                        const validation = await validateSceneRequest(sceneName, request, {
                            scanMode: options.scanMode || 'visible',
                            unlockPolicy: options.unlockPolicy || 'safe_only',
                            refresh: !!options.refresh
                        });
                        row.createOk = !!validation?.ok;
                        row.ok = row.createOk;
                        row.successCount = row.ok ? 1 : 0;
                        row.failCount = row.ok ? 0 : 1;
                        row.submitEndpoint = validation?.normalizedRequest?.submitEndpoint || '';
                        row.failTop = Array.isArray(validation?.warnings) ? (validation.warnings[0] || '') : '';
                    } catch (err) {
                        row.error = err?.message || String(err);
                        row.failCount = 1;
                    }
                } else {
                    let captureId = '';
                    if (captureInterfaces) {
                        try {
                            const capture = startNetworkCapture({ sceneName });
                            captureId = capture?.captureId || '';
                            row.capture.captureId = captureId;
                        } catch (err) {
                            row.error = err?.message || String(err);
                        }
                    }
                    const run = createPlansByScene(sceneName, request, {
                        batchRetry: Math.max(0, toNumber(options.batchRetry, 0)),
                        fallbackPolicy: options.fallbackPolicy || 'none',
                        requestOptions: {
                            maxRetries: Math.max(1, toNumber(options.maxRetries, 1)),
                            timeout: Math.max(8000, toNumber(options.requestTimeout, 20000))
                        }
                    });
                    const wrapped = await Promise.race([
                        run.then(res => ({ type: 'result', res })).catch(err => ({ type: 'error', err: err?.message || String(err) })),
                        new Promise(resolve => setTimeout(() => resolve({ type: 'timeout' }), timeoutMs))
                    ]);
                    if (wrapped.type === 'timeout') {
                        row.timeout = true;
                        row.error = `timeout_${timeoutMs}ms`;
                        row.failCount = 1;
                    } else if (wrapped.type === 'error') {
                        row.error = wrapped.err;
                        row.failCount = 1;
                    } else {
                        const res = wrapped.res || {};
                        row.createOk = !!res.ok;
                        row.successCount = toNumber(res.successCount, 0);
                        row.failCount = toNumber(res.failCount, 0);
                        row.submitEndpoint = res.submitEndpoint || '';
                        row.failTop = Array.isArray(res.failures) && res.failures.length
                            ? String(res.failures[0]?.error || '')
                            : '';
                    }
                    if (captureInterfaces && captureId) {
                        try {
                            const stopped = stopNetworkCapture(captureId, {
                                withRecords: !!options.withRecords
                            });
                            row.capture.recordCount = toNumber(stopped?.recordCount, 0);
                            row.capture.contractCount = toNumber(stopped?.contractCount, 0);
                            row.capture.createInterfaceCount = toNumber(stopped?.createInterfaceCount, 0);
                            row.capture.createEndpoints = Array.isArray(stopped?.createEndpoints)
                                ? stopped.createEndpoints.slice(0, 40)
                                : [];
                            row.capture.createInterfaces = Array.isArray(stopped?.createInterfaces)
                                ? stopped.createInterfaces.slice(0, 40)
                                : [];
                            row.capture.contracts = Array.isArray(stopped?.contracts)
                                ? stopped.contracts.slice(0, 120)
                                : [];
                            const rememberedContract = rememberSceneCreateInterfaces(
                                sceneName,
                                request?.marketingGoal || request?.common?.marketingGoal || '',
                                row.capture.createInterfaces,
                                { source: 'scene_smoke_test' }
                            );
                            if (rememberedContract) {
                                row.capture.rememberedContract = {
                                    endpoint: rememberedContract.endpoint || '',
                                    goalLabel: rememberedContract.goalLabel || '',
                                    requestKeyCount: Array.isArray(rememberedContract.requestKeys) ? rememberedContract.requestKeys.length : 0,
                                    campaignKeyCount: Array.isArray(rememberedContract.campaignKeys) ? rememberedContract.campaignKeys.length : 0,
                                    adgroupKeyCount: Array.isArray(rememberedContract.adgroupKeys) ? rememberedContract.adgroupKeys.length : 0
                                };
                            }
                            row.interfaceOk = row.capture.createInterfaceCount > 0;
                            if (!row.submitEndpoint && row.capture.createEndpoints.length) {
                                row.submitEndpoint = parseCreateEndpointFromMethodPath(row.capture.createEndpoints[0]);
                            }
                        } catch (err) {
                            row.error = row.error || (err?.message || String(err));
                        }
                    }
                    if (passMode === 'create') {
                        row.ok = !!row.createOk;
                    } else if (passMode === 'both') {
                        row.ok = !!row.createOk && !!row.interfaceOk;
                    } else {
                        row.ok = !!row.interfaceOk;
                        if (!row.ok && !row.error) {
                            row.error = 'create_interface_not_captured';
                        }
                    }
                }
                list.push(row);
                if (typeof options.onProgress === 'function') {
                    try {
                        options.onProgress({
                            event: 'scene_smoke_done',
                            sceneName,
                            index: i + 1,
                            total: scenes.length,
                            ok: row.ok,
                            createOk: row.createOk,
                            interfaceOk: row.interfaceOk,
                            createInterfaceCount: toNumber(row.capture?.createInterfaceCount, 0),
                            timeout: row.timeout,
                            successCount: row.successCount,
                            failCount: row.failCount,
                            submitEndpoint: row.submitEndpoint || '',
                            error: row.error || row.failTop || ''
                        });
                    } catch { }
                }
            }
            const result = {
                ok: list.every(item => item.ok),
                mode: createMode ? 'create' : 'validate',
                passMode,
                captureInterfaces,
                itemId,
                scannedAt: new Date().toISOString(),
                count: list.length,
                successCount: list.filter(item => item.ok).length,
                failCount: list.filter(item => !item.ok).length,
                list
            };
            window.__AM_WXT_SCENE_SMOKE_TEST_RESULT__ = result;
            if (captureInterfaces) {
                window.__AM_WXT_SCENE_CREATE_CAPTURE_RESULT__ = result;
            }
            return result;
        };
        const runSceneGoalOptionTests = async (options = {}) => {
            const scenes = Array.isArray(options.scenes) && options.scenes.length
                ? uniqueBy(options.scenes.map(item => String(item || '').trim()).filter(Boolean), item => item)
                : SCENE_NAME_LIST.slice();
            const strict = options.strict === true;
            const list = [];
            for (let i = 0; i < scenes.length; i++) {
                const sceneName = scenes[i];
                if (typeof options.onProgress === 'function') {
                    try {
                        options.onProgress({
                            event: 'scene_goal_option_test_start',
                            sceneName,
                            index: i + 1,
                            total: scenes.length
                        });
                    } catch { }
                }
                let row = {
                    sceneName,
                    ok: false,
                    goalCount: 0,
                    goalsWithFieldRows: 0,
                    goalsWithOptionRows: 0,
                    fieldCount: 0,
                    optionCount: 0,
                    warnings: [],
                    error: ''
                };
                try {
                    const extracted = await extractSceneGoalSpecs(sceneName, {
                        ...options,
                        scanMode: options.scanMode || 'full_top_down',
                        unlockPolicy: options.unlockPolicy || 'safe_only',
                        goalScan: true,
                        goalFieldScan: options.goalFieldScan !== false,
                        goalFieldScanMode: options.goalFieldScanMode || 'full_top_down',
                        goalFieldMaxDepth: toNumber(options.goalFieldMaxDepth, 2),
                        goalFieldMaxSnapshots: toNumber(options.goalFieldMaxSnapshots, 48),
                        goalFieldMaxGroupsPerLevel: toNumber(options.goalFieldMaxGroupsPerLevel, 6),
                        goalFieldMaxOptionsPerGroup: toNumber(options.goalFieldMaxOptionsPerGroup, 8),
                        refresh: options.refresh !== false
                    });
                    const goals = Array.isArray(extracted?.goals) ? extracted.goals : [];
                    const goalsWithFieldRows = goals.filter(goal => Array.isArray(goal?.fieldRows) && goal.fieldRows.length > 0).length;
                    const goalsWithOptionRows = goals.filter(goal => Array.isArray(goal?.fieldRows) && goal.fieldRows.some(field => Array.isArray(field?.options) && field.options.length >= 2)).length;
                    const fieldCount = goals.reduce((sum, goal) => sum + (Array.isArray(goal?.fieldRows) ? goal.fieldRows.length : 0), 0);
                    const optionCount = goals.reduce((sum, goal) => sum + (Array.isArray(goal?.fieldRows)
                        ? goal.fieldRows.reduce((acc, field) => acc + (Array.isArray(field?.options) ? field.options.length : 0), 0)
                        : 0), 0);
                    const warningList = Array.isArray(extracted?.warnings) ? extracted.warnings : [];
                    const fallbackGoalOnly = warningList.some(msg => /未识别到可点击的营销目标选项/.test(String(msg || '')));
                    const strictPass = goals.length > 0
                        && goalsWithFieldRows === goals.length
                        && goalsWithOptionRows === goals.length;
                    const relaxedPass = goals.length > 0
                        && goalsWithFieldRows > 0
                        && (goalsWithOptionRows > 0 || fallbackGoalOnly);
                    row = {
                        sceneName,
                        ok: !!extracted?.ok && (strict ? strictPass : relaxedPass),
                        goalCount: goals.length,
                        goalsWithFieldRows,
                        goalsWithOptionRows,
                        fieldCount,
                        optionCount,
                        warnings: warningList.slice(0, 40),
                        error: extracted?.error || ''
                    };
                } catch (err) {
                    row.error = err?.message || String(err);
                }
                list.push(row);
                if (typeof options.onProgress === 'function') {
                    try {
                        options.onProgress({
                            event: 'scene_goal_option_test_done',
                            sceneName,
                            index: i + 1,
                            total: scenes.length,
                            ok: row.ok,
                            goalCount: row.goalCount,
                            goalsWithFieldRows: row.goalsWithFieldRows,
                            goalsWithOptionRows: row.goalsWithOptionRows,
                            fieldCount: row.fieldCount,
                            optionCount: row.optionCount,
                            error: row.error || ''
                        });
                    } catch { }
                }
            }
            const result = {
                ok: list.every(item => item.ok),
                strict,
                scannedAt: new Date().toISOString(),
                sceneOrder: scenes,
                count: list.length,
                successCount: list.filter(item => item.ok).length,
                failCount: list.filter(item => !item.ok).length,
                goalCount: list.reduce((sum, item) => sum + toNumber(item?.goalCount, 0), 0),
                goalsWithFieldRows: list.reduce((sum, item) => sum + toNumber(item?.goalsWithFieldRows, 0), 0),
                goalsWithOptionRows: list.reduce((sum, item) => sum + toNumber(item?.goalsWithOptionRows, 0), 0),
                fieldCount: list.reduce((sum, item) => sum + toNumber(item?.fieldCount, 0), 0),
                optionCount: list.reduce((sum, item) => sum + toNumber(item?.optionCount, 0), 0),
                list
            };
            window.__AM_WXT_SCENE_GOAL_OPTION_TEST_RESULT__ = result;
            return result;
        };
        const buildGoalOptionSimulationCases = (goal = {}, options = {}) => {
            const maxOptionsPerField = Math.max(1, Math.min(24, toNumber(options.maxOptionsPerField, 12)));
            const maxCasesPerGoal = Math.max(1, Math.min(360, toNumber(options.maxCasesPerGoal, 96)));
            const includeBaseCase = options.includeBaseCase !== false;
            const fieldRows = normalizeGoalFieldRows(goal?.fieldRows || []);
            const cases = [];
            if (includeBaseCase) {
                cases.push({
                    caseId: 'goal_default',
                    caseType: 'goal_default',
                    fieldLabel: '',
                    optionValue: '',
                    sceneSettingsPatch: {}
                });
            }
            fieldRows.forEach(row => {
                const fieldLabel = normalizeSceneOptionText(row?.label || '');
                if (!fieldLabel) return;
                const defaultValue = normalizeSceneSettingValue(row?.defaultValue || '');
                const optionsList = uniqueBy(
                    (Array.isArray(row?.options) ? row.options : [])
                        .map(item => normalizeSceneSettingValue(item))
                        .filter(Boolean),
                    item => item
                );
                if (defaultValue && !optionsList.includes(defaultValue)) {
                    optionsList.unshift(defaultValue);
                }
                const pickedOptions = optionsList.slice(0, maxOptionsPerField);
                pickedOptions.forEach((optionValue, idx) => {
                    const safeFieldKey = normalizeSceneSpecFieldKey(fieldLabel) || `field_${cases.length + idx + 1}`;
                    const safeValueKey = normalizeSceneSpecFieldKey(optionValue) || `opt_${idx + 1}`;
                    cases.push({
                        caseId: `${safeFieldKey}_${safeValueKey}`,
                        caseType: 'field_option',
                        fieldLabel,
                        optionValue,
                        sceneSettingsPatch: {
                            [fieldLabel]: optionValue
                        },
                        dependsOn: Array.isArray(row?.dependsOn) ? row.dependsOn.slice(0, 12) : [],
                        triggerPath: normalizeText(row?.triggerPath || '')
                    });
                });
            });
            return uniqueBy(cases, item => `${item.caseType}::${item.fieldLabel}::${item.optionValue}`)
                .slice(0, maxCasesPerGoal);
        };
        const runSceneOptionSubmitSimulations = async (options = {}) => {
            const itemId = String(options.itemId || options.materialId || SCENE_SYNC_DEFAULT_ITEM_ID).trim();
            const scenes = Array.isArray(options.scenes) && options.scenes.length
                ? uniqueBy(options.scenes.map(item => String(item || '').trim()).filter(Boolean), item => item)
                : SCENE_NAME_LIST.slice();
            const timeoutMs = Math.max(15000, toNumber(options.timeoutMs, 50000));
            const passMode = (() => {
                const mode = String(options.passMode || '').trim();
                if (mode === 'create' || mode === 'both' || mode === 'interface') return mode;
                return 'interface';
            })();
            const maxGoalsPerScene = Math.max(1, Math.min(40, toNumber(options.maxGoalsPerScene, 16)));
            const maxCasesPerGoal = Math.max(1, Math.min(360, toNumber(options.maxCasesPerGoal, 96)));
            const maxCasesPerScene = Math.max(1, Math.min(520, toNumber(options.maxCasesPerScene, 220)));
            const resolveExplicitGoalLabels = (sceneName = '') => {
                if (Array.isArray(options.goalLabels)) {
                    return uniqueBy(
                        options.goalLabels
                            .map(item => normalizeGoalCandidateLabel(item))
                            .filter(Boolean),
                        item => item
                    ).slice(0, 24);
                }
                if (isPlainObject(options.goalLabels)) {
                    const list = options.goalLabels[sceneName];
                    if (!Array.isArray(list)) return [];
                    return uniqueBy(
                        list
                            .map(item => normalizeGoalCandidateLabel(item))
                            .filter(Boolean),
                        item => item
                    ).slice(0, 24);
                }
                return [];
            };
            const list = [];
            for (let sceneIdx = 0; sceneIdx < scenes.length; sceneIdx++) {
                const sceneName = scenes[sceneIdx];
                if (typeof options.onProgress === 'function') {
                    try {
                        options.onProgress({
                            event: 'scene_option_submit_start',
                            sceneName,
                            index: sceneIdx + 1,
                            total: scenes.length
                        });
                    } catch { }
                }
                let extracted = null;
                const explicitGoalLabels = resolveExplicitGoalLabels(sceneName);
                if (explicitGoalLabels.length) {
                    extracted = {
                        goals: explicitGoalLabels.map((label, idx) => ({
                            goalLabel: label,
                            isDefault: idx === 0,
                            fieldRows: []
                        }))
                    };
                } else {
                    try {
                        extracted = await extractSceneGoalSpecs(sceneName, {
                            ...options,
                            scanMode: options.scanMode || 'full_top_down',
                            unlockPolicy: options.unlockPolicy || 'safe_only',
                            goalScan: true,
                            goalFieldScan: options.goalFieldScan !== false,
                            goalFieldScanMode: options.goalFieldScanMode || 'full_top_down',
                            goalFieldMaxDepth: toNumber(options.goalFieldMaxDepth, 2),
                            goalFieldMaxSnapshots: toNumber(options.goalFieldMaxSnapshots, 48),
                            goalFieldMaxGroupsPerLevel: toNumber(options.goalFieldMaxGroupsPerLevel, 6),
                            goalFieldMaxOptionsPerGroup: toNumber(options.goalFieldMaxOptionsPerGroup, 8),
                            refresh: options.refreshGoalSpecs === true
                        });
                    } catch (err) {
                        list.push({
                            sceneName,
                            goalLabel: '',
                            caseId: '',
                            caseType: 'goal_default',
                            fieldLabel: '',
                            optionValue: '',
                            ok: false,
                            createOk: false,
                            interfaceOk: false,
                            submitEndpoint: '',
                            createInterfaceCount: 0,
                            error: err?.message || String(err),
                            timeout: false,
                            requestPreview: {},
                            capture: {
                                enabled: false,
                                captureId: '',
                                recordCount: 0,
                                contractCount: 0,
                                createInterfaceCount: 0,
                                createEndpoints: [],
                                createInterfaces: [],
                                contracts: []
                            },
                            ts: new Date().toISOString()
                        });
                        continue;
                    }
                }
                const goalsRaw = Array.isArray(extracted?.goals) && extracted.goals.length
                    ? extracted.goals
                    : [{ goalLabel: '', isDefault: true, fieldRows: [] }];
                const fallbackGoalLabels = getSceneMarketingGoalFallbackList(sceneName);
                const goalsExpanded = goalsRaw.slice();
                const existingGoalSet = new Set(
                    goalsExpanded
                        .map(goal => normalizeGoalCandidateLabel(goal?.goalLabel || ''))
                        .filter(Boolean)
                );
                fallbackGoalLabels.forEach(label => {
                    if (existingGoalSet.has(label)) return;
                    goalsExpanded.push({
                        goalLabel: label,
                        isDefault: false,
                        fieldRows: []
                    });
                });
                const goals = goalsExpanded.slice(0, maxGoalsPerScene);
                let sceneCaseCursor = 0;
                for (let goalIdx = 0; goalIdx < goals.length; goalIdx++) {
                    const goal = goals[goalIdx] || {};
                    const goalLabel = normalizeGoalLabel(goal?.goalLabel || '');
                    const cases = buildGoalOptionSimulationCases(goal, {
                        maxOptionsPerField: options.maxOptionsPerField,
                        maxCasesPerGoal,
                        includeBaseCase: options.includeBaseCase !== false
                    });
                    for (let caseIdx = 0; caseIdx < cases.length; caseIdx++) {
                        if (sceneCaseCursor >= maxCasesPerScene) break;
                        sceneCaseCursor += 1;
                        const caseInfo = cases[caseIdx] || {};
                        const request = buildSmokeTestRequestByScene(sceneName, itemId, {
                            index: sceneCaseCursor,
                            dayAverageBudget: toNumber(options.dayAverageBudget, 100)
                        });
                        request.marketingGoal = goalLabel || request.marketingGoal || '';
                        request.common = mergeDeep({}, request.common || {}, {
                            marketingGoal: goalLabel || request?.common?.marketingGoal || ''
                        });
                        request.sceneSettings = mergeDeep({}, request.sceneSettings || {}, caseInfo.sceneSettingsPatch || {});
                        if (isPlainObject(options.requestOverrides)) {
                            mergeDeep(request, options.requestOverrides);
                        }
                        if (Array.isArray(request?.plans) && request.plans[0]) {
                            const tail = `${String(sceneCaseCursor).padStart(3, '0')}${String(Date.now()).slice(-4)}`;
                            request.plans[0].planName = `${request.plans[0].planName}_${tail}`;
                        }
                        const row = {
                            sceneName,
                            goalLabel,
                            caseId: caseInfo.caseId || '',
                            caseType: caseInfo.caseType || 'goal_default',
                            fieldLabel: caseInfo.fieldLabel || '',
                            optionValue: caseInfo.optionValue || '',
                            dependsOn: Array.isArray(caseInfo.dependsOn) ? caseInfo.dependsOn.slice(0, 12) : [],
                            triggerPath: caseInfo.triggerPath || '',
                            ok: false,
                            createOk: false,
                            interfaceOk: false,
                            submitEndpoint: '',
                            createInterfaceCount: 0,
                            error: '',
                            timeout: false,
                            requestPreview: {
                                planName: request?.plans?.[0]?.planName || '',
                                marketingGoal: request.marketingGoal || '',
                                sceneSettings: deepClone(request.sceneSettings || {})
                            },
                            capture: {
                                enabled: true,
                                captureId: '',
                                recordCount: 0,
                                contractCount: 0,
                                createInterfaceCount: 0,
                                createEndpoints: [],
                                createInterfaces: [],
                                contracts: []
                            },
                            ts: new Date().toISOString()
                        };
                        let captureId = '';
                        try {
                            const capture = startNetworkCapture({ sceneName });
                            captureId = capture?.captureId || '';
                            row.capture.captureId = captureId;
                        } catch (err) {
                            row.capture.enabled = false;
                            row.error = err?.message || String(err);
                        }
                        const run = createPlansByScene(sceneName, request, {
                            batchRetry: Math.max(0, toNumber(options.batchRetry, 0)),
                            fallbackPolicy: options.fallbackPolicy || 'none',
                            requestOptions: {
                                maxRetries: Math.max(1, toNumber(options.maxRetries, 1)),
                                timeout: Math.max(8000, toNumber(options.requestTimeout, 20000))
                            }
                        });
                        const wrapped = await Promise.race([
                            run.then(res => ({ type: 'result', res })).catch(err => ({ type: 'error', err: err?.message || String(err) })),
                            new Promise(resolve => setTimeout(() => resolve({ type: 'timeout' }), timeoutMs))
                        ]);
                        if (wrapped.type === 'timeout') {
                            row.timeout = true;
                            row.error = `timeout_${timeoutMs}ms`;
                        } else if (wrapped.type === 'error') {
                            row.error = wrapped.err;
                        } else {
                            const res = wrapped.res || {};
                            row.createOk = !!res.ok;
                            row.submitEndpoint = normalizeGoalCreateEndpoint(res.submitEndpoint || '');
                            if (!row.createOk && !row.error) {
                                row.error = Array.isArray(res?.failures) && res.failures.length
                                    ? String(res.failures[0]?.error || '')
                                    : '';
                            }
                        }
                        if (captureId) {
                            try {
                                const stopped = stopNetworkCapture(captureId, {
                                    withRecords: !!options.withRecords
                                });
                                row.capture.recordCount = toNumber(stopped?.recordCount, 0);
                                row.capture.contractCount = toNumber(stopped?.contractCount, 0);
                                row.capture.createInterfaceCount = toNumber(stopped?.createInterfaceCount, 0);
                                row.capture.createEndpoints = Array.isArray(stopped?.createEndpoints)
                                    ? stopped.createEndpoints.slice(0, 60)
                                    : [];
                                row.capture.createInterfaces = Array.isArray(stopped?.createInterfaces)
                                    ? stopped.createInterfaces.slice(0, 80)
                                    : [];
                                row.capture.contracts = Array.isArray(stopped?.contracts)
                                    ? stopped.contracts.slice(0, 160)
                                    : [];
                                row.createInterfaceCount = row.capture.createInterfaceCount;
                                row.interfaceOk = row.capture.createInterfaceCount > 0;
                                if (!row.submitEndpoint && row.capture.createEndpoints.length) {
                                    row.submitEndpoint = parseCreateEndpointFromMethodPath(row.capture.createEndpoints[0]);
                                }
                                const rememberedContract = rememberSceneCreateInterfaces(
                                    sceneName,
                                    goalLabel,
                                    row.capture.createInterfaces,
                                    { source: 'option_submit_simulation' }
                                );
                                if (rememberedContract) {
                                    row.rememberedContract = {
                                        endpoint: rememberedContract.endpoint || '',
                                        goalLabel: rememberedContract.goalLabel || '',
                                        requestKeyCount: Array.isArray(rememberedContract.requestKeys) ? rememberedContract.requestKeys.length : 0,
                                        campaignKeyCount: Array.isArray(rememberedContract.campaignKeys) ? rememberedContract.campaignKeys.length : 0,
                                        adgroupKeyCount: Array.isArray(rememberedContract.adgroupKeys) ? rememberedContract.adgroupKeys.length : 0
                                    };
                                }
                            } catch (err) {
                                row.error = row.error || (err?.message || String(err));
                            }
                        }
                        if (passMode === 'create') {
                            row.ok = !!row.createOk;
                        } else if (passMode === 'both') {
                            row.ok = !!row.createOk && !!row.interfaceOk;
                        } else {
                            row.ok = !!row.interfaceOk;
                            if (!row.ok && !row.error) row.error = 'create_interface_not_captured';
                        }
                        list.push(row);
                        if (typeof options.onProgress === 'function') {
                            try {
                                options.onProgress({
                                    event: 'scene_option_submit_case_done',
                                    sceneName,
                                    goalLabel,
                                    caseId: row.caseId,
                                    caseType: row.caseType,
                                    fieldLabel: row.fieldLabel,
                                    optionValue: row.optionValue,
                                    ok: row.ok,
                                    createOk: row.createOk,
                                    interfaceOk: row.interfaceOk,
                                    createInterfaceCount: row.createInterfaceCount,
                                    submitEndpoint: row.submitEndpoint || '',
                                    error: row.error || ''
                                });
                            } catch { }
                        }
                    }
                    if (sceneCaseCursor >= maxCasesPerScene) break;
                }
                if (typeof options.onProgress === 'function') {
                    try {
                        const sceneRows = list.filter(item => item.sceneName === sceneName);
                        options.onProgress({
                            event: 'scene_option_submit_done',
                            sceneName,
                            index: sceneIdx + 1,
                            total: scenes.length,
                            caseCount: sceneRows.length,
                            successCount: sceneRows.filter(item => item.ok).length,
                            failCount: sceneRows.filter(item => !item.ok).length
                        });
                    } catch { }
                }
            }
            const byScene = scenes.map(sceneName => {
                const rows = list.filter(item => item.sceneName === sceneName);
                const goalSet = uniqueBy(rows.map(item => normalizeGoalLabel(item.goalLabel || '')).filter(Boolean), item => item);
                return {
                    sceneName,
                    caseCount: rows.length,
                    successCount: rows.filter(item => item.ok).length,
                    failCount: rows.filter(item => !item.ok).length,
                    goalCount: goalSet.length,
                    createInterfaceCount: rows.reduce((sum, item) => sum + toNumber(item?.createInterfaceCount, 0), 0)
                };
            });
            const missingList = list
                .filter(item => !item.ok)
                .map(item => ({
                    sceneName: item.sceneName,
                    goalLabel: item.goalLabel || '',
                    fieldLabel: item.fieldLabel || '',
                    optionValue: item.optionValue || '',
                    caseId: item.caseId || '',
                    error: item.error || ''
                }))
                .slice(0, 400);
            const result = {
                ok: list.length > 0 && list.every(item => item.ok),
                itemId,
                passMode,
                scannedAt: new Date().toISOString(),
                sceneOrder: scenes,
                count: list.length,
                successCount: list.filter(item => item.ok).length,
                failCount: list.filter(item => !item.ok).length,
                missingCount: missingList.length,
                byScene,
                missingList,
                list
            };
            window.__AM_WXT_SCENE_OPTION_SUBMIT_SIM_RESULT__ = result;
            return result;
        };
        const captureSceneCreateInterfaces = async (sceneName = '', options = {}) => {
            const targetScene = String(sceneName || '').trim();
            if (!targetScene) {
                return {
                    ok: false,
                    sceneName: '',
                    error: '缺少 sceneName'
                };
            }
            const result = await runSceneSmokeTests({
                ...options,
                scenes: [targetScene],
                createMode: true,
                captureInterfaces: true,
                passMode: options.passMode || 'interface'
            });
            const row = Array.isArray(result?.list) && result.list.length ? result.list[0] : null;
            return {
                ok: !!row?.ok,
                sceneName: targetScene,
                itemId: row?.itemId || String(options.itemId || options.materialId || '').trim(),
                passMode: result?.passMode || 'interface',
                row: row || null,
                error: row?.error || ''
            };
        };
        const captureAllSceneCreateInterfaces = async (options = {}) => runSceneSmokeTests({
            ...options,
            createMode: true,
            captureInterfaces: true,
            passMode: options.passMode || 'interface'
        });
        const createSitePlansBatch = (request = {}, options = {}) => createPlansByScene('货品全站推广', request, options);
        const createKeywordPlansBatch = (request = {}, options = {}) => createPlansByScene('关键词推广', request, options);
        const createCrowdPlansBatch = (request = {}, options = {}) => createPlansByScene('人群推广', request, options);
        const createShopDirectPlansBatch = (request = {}, options = {}) => createPlansByScene('店铺直达', request, options);
        const createContentPlansBatch = (request = {}, options = {}) => createPlansByScene('内容营销', request, options);
        const createLeadPlansBatch = (request = {}, options = {}) => createPlansByScene('线索推广', request, options);

        return {
            buildVersion: BUILD_VERSION,
            openWizard,
            getRuntimeDefaults,
            searchItems,
            createPlansBatch,
            createPlansByScene,
            createSitePlansBatch,
            createKeywordPlansBatch,
            createCrowdPlansBatch,
            createShopDirectPlansBatch,
            createContentPlansBatch,
            createLeadPlansBatch,
            appendKeywords,
            suggestKeywords,
            suggestCrowds,
            scanCurrentSceneSettings,
            scanAllSceneSettings,
            scanSceneSpec,
            scanAllSceneSpecs,
            startNetworkCapture,
            getNetworkCapture,
            stopNetworkCapture,
            listNetworkCaptures,
            stopAllNetworkCaptures,
            extractSceneGoalSpecs,
            extractAllSceneGoalSpecs,
            extractSceneCreateInterfaces,
            extractAllSceneCreateInterfaces,
            buildSceneGoalRequestTemplates,
            runSceneSmokeTests,
            runSceneGoalOptionTests,
            runSceneOptionSubmitSimulations,
            captureSceneCreateInterfaces,
            captureAllSceneCreateInterfaces,
            getSceneSpec,
            getGoalSpec,
            getSceneCreateContract,
            validateSceneRequest,
            clearSceneSpecCache,
            clearSceneCreateContractCache,
            validate,
            getSessionDraft,
            clearSessionDraft
        };
    })();

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
    try {
        const hooks = createHookManager();
        hooks?.install?.();
    } catch { }
    TokenManager.hookXHR();

    // NOTE: 将 Token 引用暴露到全局，供万能查数弹窗等模块跨作用域读取
    const pageGlobal = (typeof unsafeWindow !== 'undefined' && unsafeWindow) ? unsafeWindow : window;
    const API_BRIDGE_REQ_EVENT = '__AM_WXT_PLAN_API_BRIDGE_REQ__';
    const API_BRIDGE_RES_EVENT = '__AM_WXT_PLAN_API_BRIDGE_RES__';
    const API_BRIDGE_MSG_CHANNEL = '__AM_WXT_PLAN_API_BRIDGE_MSG__';
    const API_BRIDGE_METHODS = [
        'openWizard',
        'getRuntimeDefaults',
        'searchItems',
        'createPlansBatch',
        'createPlansByScene',
        'createSitePlansBatch',
        'createKeywordPlansBatch',
        'createCrowdPlansBatch',
        'createShopDirectPlansBatch',
        'createContentPlansBatch',
        'createLeadPlansBatch',
        'appendKeywords',
        'suggestKeywords',
        'suggestCrowds',
        'scanCurrentSceneSettings',
        'scanAllSceneSettings',
        'scanSceneSpec',
        'scanAllSceneSpecs',
        'startNetworkCapture',
        'getNetworkCapture',
        'stopNetworkCapture',
        'listNetworkCaptures',
        'stopAllNetworkCaptures',
        'extractSceneGoalSpecs',
        'extractAllSceneGoalSpecs',
        'extractSceneCreateInterfaces',
        'extractAllSceneCreateInterfaces',
        'buildSceneGoalRequestTemplates',
        'runSceneSmokeTests',
        'runSceneGoalOptionTests',
        'runSceneOptionSubmitSimulations',
        'captureSceneCreateInterfaces',
        'captureAllSceneCreateInterfaces',
        'getSceneSpec',
        'getGoalSpec',
        'getSceneCreateContract',
        'validateSceneRequest',
        'clearSceneSpecCache',
        'clearSceneCreateContractCache',
        'validate',
        'getSessionDraft',
        'clearSessionDraft'
    ];
    const installPageApiBridgeHost = () => {
        if (window.__AM_WXT_PLAN_API_BRIDGE_HOST__) return;
        window.__AM_WXT_PLAN_API_BRIDGE_HOST__ = true;
        const BRIDGE_RESULT_CACHE_TTL_MS = 90 * 1000;
        const inFlightCallIds = new Set();
        const resolvedPayloadCache = new Map();
        const cleanupBridgeCache = () => {
            const now = Date.now();
            resolvedPayloadCache.forEach((cached, callId) => {
                if (!cached || !Number.isFinite(cached.ts) || now - cached.ts > BRIDGE_RESULT_CACHE_TTL_MS) {
                    resolvedPayloadCache.delete(callId);
                }
            });
        };
        const extractBridgeDetail = (raw) => {
            if (!raw || typeof raw !== 'object') return null;
            const callId = String(raw.callId || '').trim();
            const method = String(raw.method || '').trim();
            const args = Array.isArray(raw.args) ? raw.args : [];
            if (!callId || !method) return null;
            return {
                callId,
                method,
                args
            };
        };
        const dispatchBridgeResponse = (payload) => {
            try {
                window.dispatchEvent(new CustomEvent(API_BRIDGE_RES_EVENT, { detail: payload }));
            } catch { }
            try {
                document.dispatchEvent(new CustomEvent(API_BRIDGE_RES_EVENT, { detail: payload }));
            } catch { }
            try {
                window.postMessage({
                    channel: API_BRIDGE_MSG_CHANNEL,
                    direction: 'res',
                    payload
                }, '*');
            } catch { }
        };
        const processBridgeRequest = async (detail) => {
            const callId = String(detail.callId || '').trim();
            const method = String(detail.method || '').trim();
            const args = Array.isArray(detail.args) ? detail.args : [];
            if (!callId || !method) return;
            cleanupBridgeCache();
            if (resolvedPayloadCache.has(callId)) {
                dispatchBridgeResponse(resolvedPayloadCache.get(callId).payload);
                return;
            }
            if (inFlightCallIds.has(callId)) return;
            inFlightCallIds.add(callId);
            const payload = {
                callId,
                method,
                ok: false,
                result: null,
                error: ''
            };
            try {
                const fn = KeywordPlanApi?.[method];
                if (typeof fn !== 'function') {
                    throw new Error(`method_not_found:${method}`);
                }
                payload.result = await fn(...args);
                payload.ok = true;
            } catch (err) {
                payload.error = err?.message || String(err);
            } finally {
                inFlightCallIds.delete(callId);
            }
            resolvedPayloadCache.set(callId, {
                ts: Date.now(),
                payload
            });
            dispatchBridgeResponse(payload);
        };
        const handleBridgeRequestEvent = (event) => {
            const detail = extractBridgeDetail(event?.detail);
            if (!detail) return;
            processBridgeRequest(detail);
        };
        const handleBridgeRequestMessage = (event) => {
            if (!event || event.source !== window) return;
            const data = event.data;
            if (!data || typeof data !== 'object') return;
            if (String(data.channel || '').trim() !== API_BRIDGE_MSG_CHANNEL) return;
            if (String(data.direction || '').trim() !== 'req') return;
            const detail = extractBridgeDetail(data.payload);
            if (!detail) return;
            processBridgeRequest(detail);
        };
        window.addEventListener(API_BRIDGE_REQ_EVENT, handleBridgeRequestEvent);
        document.addEventListener(API_BRIDGE_REQ_EVENT, handleBridgeRequestEvent);
        window.addEventListener('message', handleBridgeRequestMessage, false);
    };
    const injectPageApiBridgeClient = () => {
        if (document.getElementById('am-wxt-plan-api-bridge-client')) return;
        const script = document.createElement('script');
        script.id = 'am-wxt-plan-api-bridge-client';
        script.type = 'text/javascript';
        script.textContent = `
            ;(function() {
                try {
                    var REQ = ${JSON.stringify(API_BRIDGE_REQ_EVENT)};
                    var RES = ${JSON.stringify(API_BRIDGE_RES_EVENT)};
                    var CHANNEL = ${JSON.stringify(API_BRIDGE_MSG_CHANNEL)};
                    var METHODS = ${JSON.stringify(API_BRIDGE_METHODS)};
                    var BUILD = ${JSON.stringify(KeywordPlanApi.buildVersion || '')};
                    var callApi = function(method, args) {
                        return new Promise(function(resolve, reject) {
                            var callId = 'wxt_bridge_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10);
                            var done = false;
                            var timeoutId = setTimeout(function() {
                                if (done) return;
                                done = true;
                                window.removeEventListener(RES, onResponse, false);
                                document.removeEventListener(RES, onResponse, false);
                                window.removeEventListener('message', onMessage, false);
                                reject(new Error('bridge_timeout:' + method));
                            }, 180000);
                            var onResponse = function(event) {
                                var detail = event && event.detail ? event.detail : {};
                                if (!detail || detail.callId !== callId) return;
                                if (done) return;
                                done = true;
                                clearTimeout(timeoutId);
                                window.removeEventListener(RES, onResponse, false);
                                document.removeEventListener(RES, onResponse, false);
                                window.removeEventListener('message', onMessage, false);
                                if (detail.ok) {
                                    resolve(detail.result);
                                } else {
                                    reject(new Error(detail.error || ('bridge_error:' + method)));
                                }
                            };
                            var onMessage = function(event) {
                                var data = event && event.data ? event.data : null;
                                if (!data || data.channel !== CHANNEL || data.direction !== 'res') return;
                                var detail = data && data.payload ? data.payload : {};
                                if (!detail || detail.callId !== callId) return;
                                if (done) return;
                                done = true;
                                clearTimeout(timeoutId);
                                window.removeEventListener(RES, onResponse, false);
                                document.removeEventListener(RES, onResponse, false);
                                window.removeEventListener('message', onMessage, false);
                                if (detail.ok) {
                                    resolve(detail.result);
                                } else {
                                    reject(new Error(detail.error || ('bridge_error:' + method)));
                                }
                            };
                            window.addEventListener(RES, onResponse, false);
                            document.addEventListener(RES, onResponse, false);
                            window.addEventListener('message', onMessage, false);
                            var requestDetail = {
                                callId: callId,
                                method: method,
                                args: Array.isArray(args) ? args : []
                            };
                            window.dispatchEvent(new CustomEvent(REQ, {
                                detail: requestDetail
                            }));
                            document.dispatchEvent(new CustomEvent(REQ, {
                                detail: requestDetail
                            }));
                            window.postMessage({
                                channel: CHANNEL,
                                direction: 'req',
                                payload: requestDetail
                            }, '*');
                        });
                    };
                    var bridgeApi = {
                        buildVersion: BUILD
                    };
                    METHODS.forEach(function(method) {
                        bridgeApi[method] = function() {
                            return callApi(method, Array.prototype.slice.call(arguments));
                        };
                    });
                    window.__AM_WXT_KEYWORD_API__ = bridgeApi;
                    window.__AM_WXT_PLAN_API__ = bridgeApi;
                    window.__AM_WXT_PLAN_BUILD__ = BUILD;
                } catch (err) {
                    console.warn('[AM] plan api bridge client inject failed', err);
                }
            })();
        `;
        (document.documentElement || document.head || document.body || document).appendChild(script);
        script.remove();
    };
    window.__AM_TOKENS__ = State.tokens;
    window.__AM_WXT_KEYWORD_API__ = KeywordPlanApi;
    window.__AM_WXT_PLAN_API__ = KeywordPlanApi;
    window.__AM_WXT_PLAN_BUILD__ = KeywordPlanApi.buildVersion || '';
    installPageApiBridgeHost();
    injectPageApiBridgeClient();
    if (pageGlobal && pageGlobal !== window) {
        pageGlobal.__AM_TOKENS__ = State.tokens;
        pageGlobal.__AM_WXT_PLAN_BUILD__ = KeywordPlanApi.buildVersion || '';
    }

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
