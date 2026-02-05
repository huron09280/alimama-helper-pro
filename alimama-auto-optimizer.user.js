// ==UserScript==
// @name         阿里妈妈万相台自动算法护航助手 (API版)
// @namespace    http://tampermonkey.net/
// @version      2.4
// @description  自动扫描推广计划中的"拿量可调优"建议，并通过后台接口直接提交"算法护航"优化
// @author       Liangchao
// @match        https://one.alimama.com/*
// @grant        GM_setValue
// @grant        GM_getValue

// @grant        GM_xmlhttpRequest
// @connect      alimama.com
// @connect      ai.alimama.com
// @connect      *.alimama.com
// @connect      one.alimama.com
// @downloadURL https://update.greasyfork.org/scripts/564414/%E9%98%BF%E9%87%8C%E5%A6%88%E5%A6%88%E4%B8%87%E7%9B%B8%E5%8F%B0%E8%87%AA%E5%8A%A8%E7%AE%97%E6%B3%95%E6%8A%A4%E8%88%AA%E5%8A%A9%E6%89%8B%20%28API%E7%89%88%29.user.js
// @updateURL https://update.greasyfork.org/scripts/564414/%E9%98%BF%E9%87%8C%E5%A6%88%E5%A6%88%E4%B8%87%E7%9B%B8%E5%8F%B0%E8%87%AA%E5%8A%A8%E7%AE%97%E6%B3%95%E6%8A%A4%E8%88%AA%E5%8A%A9%E6%89%8B%20%28API%E7%89%88%29.meta.js
// ==/UserScript==

/**
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

    // ==================== 配置模块 ====================
    const CONFIG = {
        UI_ID: 'alimama-escort-helper-ui',
        VERSION: '2.4',
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
        currentRunId: 0
    };

    // ==================== 工具函数模块 ====================
    const Utils = {
        delay: (ms) => new Promise(r => setTimeout(r, ms)),

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
        _singleRequest: async (url, data, timeout = 30000) => {
            const startTime = Date.now();
            const reqId = Math.random().toString(36).substring(2, 8);

            Logger.debug(`[${reqId}] 发起请求:`, { url, timeout: `${timeout}ms` });
            Logger.debug(`[${reqId}] 请求数据:`, data);

            // 创建 AbortController 用于超时控制
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);

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
                    Logger.error(`[${reqId}] 请求超时 (${elapsed}ms, 配置${timeout}ms)`);
                    throw new Error(`请求超时 (>${timeout}ms)`);
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
            const { maxRetries = 3, timeout = 30000, retryDelay = 2000 } = options;
            let lastError = null;

            Logger.info(`📡 API请求: ${url.split('/').pop()}`, { maxRetries, timeout });

            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                    const result = await API._singleRequest(url, data, timeout);
                    Logger.info(`✓ 请求成功 (第${attempt}次)`);
                    return result;
                } catch (err) {
                    lastError = err;
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
            line.innerHTML = `<span style="color:#666;margin-right:4px;">[${time}]</span><span style="color:${color}">${text}</span>`;
            container.appendChild(line);

            while (container.children.length > 50) container.removeChild(container.firstChild);
            container.parentElement.scrollTop = container.parentElement.scrollHeight;
        },

        // 创建计划卡片（每个计划独立的日志区域）
        createCampaignCard: (campaignId, campaignName, index, total) => {
            const container = document.getElementById(`${CONFIG.UI_ID}-log`);
            if (!container) return null;

            const cardId = `${CONFIG.UI_ID}-card-${campaignId}`;
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
                " onclick="this.parentElement.querySelector('.card-body').classList.toggle('collapsed');
                           this.querySelector('.arrow').classList.toggle('rotated');">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span style="
                            display:inline-block;min-width:24px;height:18px;line-height:18px;
                            background:#1890ff;color:#fff;border-radius:9px;text-align:center;font-size:10px;
                        ">${index}/${total}</span>
                        <span style="font-weight:500;color:#333;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"
                              title="${campaignName}">${campaignName}</span>
                        <span style="color:#999;font-size:10px;">(${campaignId})</span>
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

            // 返回卡片操作对象
            return {
                log: (text, color = '#555') => {
                    const logContent = card.querySelector('.log-content');
                    if (!logContent) return;
                    const time = new Date().toLocaleTimeString('zh-CN', { hour12: false });
                    const line = document.createElement('div');
                    line.innerHTML = `<span style="color:#aaa;margin-right:4px;font-size:10px;">${time}</span><span style="color:${color}">${text}</span>`;
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
                    return `<td style="${td}${i === 1 ? nameStyle : ''}">${val ?? '-'}</td>`;
                }).join('')}</tr>`;
            });

            html += '</tbody></table>';
            cardLogger.log(html);
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

            // 创建模态遮罩层
            const overlay = document.createElement('div');
            overlay.id = `${CONFIG.UI_ID}-result-overlay`;
            overlay.style.cssText = `
                position:fixed;top:0;left:0;right:0;bottom:0;
                background:rgba(0,0,0,0.5);backdrop-filter:blur(4px);
                z-index:100000;display:flex;align-items:center;justify-content:center;
                animation:fadeIn 0.3s ease;
            `;

            // 创建结果卡片
            const successCount = successList.length;
            const failCount = failList.length;
            const totalCount = successCount + failCount;
            const isAllSuccess = failCount === 0;

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
                                ${data.map((row, i) => `
                                    <tr style="${row.success ? '' : 'background:#fff1f0;'}">
                                        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;color:#666;">${i + 1}</td>
                                        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;${row.success ? '' : 'color:#ff4d4f;'}">${row.name}</td>
                                        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:center;">
                                            ${row.success
                    ? '<span style="color:#52c41a;font-weight:600;">✓ 成功</span>'
                    : '<span style="color:#ff4d4f;font-weight:600;">✗ 失败</span>'}
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                    <div style="text-align:center;margin-top:20px;">
                        <button id="${CONFIG.UI_ID}-result-close" style="
                            padding:10px 32px;background:linear-gradient(135deg,#1890ff,#0050b3);color:#fff;
                            border:none;border-radius:6px;cursor:pointer;font-size:14px;font-weight:500;
                            transition:transform 0.2s,box-shadow 0.2s;
                        " onmouseover="this.style.transform='scale(1.05)';this.style.boxShadow='0 4px 12px rgba(24,144,255,0.4)'"
                           onmouseout="this.style.transform='scale(1)';this.style.boxShadow='none'"
                        >关闭</button>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);

            // 绑定关闭事件
            document.getElementById(`${CONFIG.UI_ID}-result-close`).onclick = () => {
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
                padding:15px;background:#fff;color:#333;border-radius:8px;z-index:10000;
                font-size:13px;box-shadow:0 4px 16px rgba(0,0,0,0.15);border:1px solid #e0e0e0;
                font-family:-apple-system,system-ui,sans-serif;
                opacity:0;transform:scale(0.8);transform-origin:top right;pointer-events:none;
                transition:opacity 0.3s ease, transform 0.3s ease, width 0.8s cubic-bezier(0.4,0,0.2,1);
                overflow:hidden;
            `;

            // 最小化按钮
            const miniBtn = document.createElement('div');
            miniBtn.id = `${CONFIG.UI_ID}-mini`;
            miniBtn.style.cssText = `
                position:fixed;top:20px;right:20px;width:36px;height:36px;
                background:#fff;border-radius:50%;z-index:10001;
                box-shadow:0 4px 12px rgba(0,0,0,0.15);border:1px solid #e0e0e0;
                display:flex;cursor:pointer;align-items:center;justify-content:center;
                font-size:18px;transition:all 0.3s;
            `;
            miniBtn.innerHTML = '🛡️';
            miniBtn.title = '点击展开';

            panel.innerHTML = `
                <div style="font-weight:bold;margin-bottom:12px;border-bottom:1px solid #eee;padding-bottom:8px;display:flex;justify-content:space-between;align-items:center;">
                    <span style="color:#1890ff;">🛡️ 算法护航 v${CONFIG.VERSION}</span>
                    <div style="display:flex;align-items:center;gap:6px;">
                        <span style="font-size:10px;color:#999;margin-right:4px;">API版</span>
                        <span id="${CONFIG.UI_ID}-center" style="cursor:pointer;color:#999;font-size:14px;transition:color 0.2s;" title="居中">⊙</span>
                        <span id="${CONFIG.UI_ID}-maximize" style="cursor:pointer;color:#999;font-size:14px;transition:color 0.2s;" title="最大化">□</span>
                        <span id="${CONFIG.UI_ID}-close" style="cursor:pointer;color:#999;font-size:16px;font-weight:bold;transition:color 0.2s;" title="最小化">−</span>
                    </div>
                </div>
                <div id="${CONFIG.UI_ID}-log-wrapper" style="background:#f5f7fa;padding:0;border-radius:6px;font-size:11px;height:0;max-height:500px;overflow:hidden;margin-bottom:0;border:1px solid #e8e8e8;font-family:Monaco,Consolas,monospace;opacity:0;transform:scaleY(0.8);transform-origin:top;transition:all 0.6s ease-out;">
                    <div id="${CONFIG.UI_ID}-log" style="color:#555;display:flex;flex-direction:column;gap:3px;line-height:1.5;padding:10px;"></div>
                </div>
                <button id="${CONFIG.UI_ID}-run" style="width:100%;padding:8px;background:linear-gradient(135deg,#1890ff,#0050b3);color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:500;margin-bottom:8px;">立即扫描并优化</button>
                <div style="margin-bottom:8px;display:flex;gap:5px;align-items:center;">
                    <label style="color:#666;font-size:10px;white-space:nowrap;">诊断话术:</label>
                    <input id="${CONFIG.UI_ID}-prompt" type="text" value="${userConfig.customPrompt}" style="flex:1;padding:4px;border:1px solid #ddd;border-radius:4px;font-size:10px;" placeholder="例: 帮我进行深度诊断" />
                </div>
                <div style="margin-bottom:8px;display:flex;gap:5px;align-items:center;">
                    <label style="color:#666;font-size:10px;white-space:nowrap;">同时执行:</label>
                    <input id="${CONFIG.UI_ID}-concurrency" type="number" min="1" max="10" value="${userConfig.concurrency || 3}" style="width:50px;padding:4px;border:1px solid #ddd;border-radius:4px;font-size:10px;text-align:center;" />
                    <span style="color:#999;font-size:10px;">个计划 (1-10)</span>
                </div>
                <div style="margin-top:10px;font-size:10px;color:#666;display:flex;justify-content:space-between;">
                    <span id="${CONFIG.UI_ID}-user" style="max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"></span>
                    <span id="${CONFIG.UI_ID}-token" style="cursor:help;" title="Token状态">● Token</span>
                </div>
            `;

            document.body.appendChild(panel);
            document.body.appendChild(miniBtn);

            // 事件绑定
            document.getElementById(`${CONFIG.UI_ID}-close`).onclick = () => {
                panel.style.opacity = '0';
                panel.style.transform = 'scale(0.8)';
                panel.style.pointerEvents = 'none';
                setTimeout(() => miniBtn.style.display = 'flex', 300);
            };

            miniBtn.onclick = () => {
                miniBtn.style.display = 'none';
                panel.style.opacity = '1';
                panel.style.transform = 'scale(1)';
                panel.style.pointerEvents = 'auto';
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
                // 构造请求数据
                const talkData = {
                    fromPage: '/manage/search-detail',
                    entrance: 'huhang-pop_escort@onebpSearch@horizontal',
                    business: 'escort@onebpSearch@horizontal',
                    contextParam: {
                        mx_bizCode: 'onebpSearch',
                        bizCode: 'onebpSearch',
                        startTime: new Date().toISOString().split('T')[0],
                        endTime: new Date().toISOString().split('T')[0],
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
                const talkRes = await API.request('https://ai.alimama.com/ai/chat/talk.json', talkData);

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
                        const key = obj.actionList.map(i => `${i.actionText}::${(i.actionInfo || '').substring(0, 100)}`).join('|||');
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
                });

                const success = openRes?.success || openRes?.ok || openRes?.info?.ok;
                const msg = openRes?.info?.message || (success ? '成功' : '未知错误');

                card.log(`${success ? '✓' : '✗'} ${msg}`, success ? 'green' : 'red');
                card.setStatus(success ? '成功' : '失败', success ? 'success' : 'error');
                card.collapse();
                return { success, msg };

            } catch (e) {
                card.log(`异常: ${e.message}`, 'red');
                card.setStatus('异常', 'error');
                card.collapse();
                return { success: false, msg: e.message };
            }
        },

        // 扫描页面计划（单次 DOM 遍历）
        scanCampaigns: () => {
            const tasks = new Map();
            const campaignIdRegex = /campaignId=(\d{10,})/;

            document.querySelectorAll('a[href*="campaignId="], input[type="checkbox"][value]').forEach(el => {
                if (el.tagName === 'A') {
                    const m = el.href.match(campaignIdRegex);
                    if (m && !tasks.has(m[1])) {
                        tasks.set(m[1], el.innerText.trim() || '未知计划');
                    }
                } else if (/^\d{10,}$/.test(el.value) && !el.closest('div[mx-view*="user-pop"]')) {
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
    setTimeout(() => UI.create(), 3000);

})();
