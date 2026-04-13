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
            customPrompt: '深度拿量',
            concurrency: 3,
            manualEscortSetting: {
                enabled: false,
                bidConstraintValue: { enabled: false, lowerLimit: 0.15, upperLimit: 0.54, modifyTimesLimit: 10, dailyReset: false },
                budget: { enabled: false, lowerLimit: 200, upperLimit: '不限', modifyTimesLimit: 20, dailyReset: false },
                addKeyword: { enabled: false, keywordPreference: '类目流量飙升词', matchType: '广泛匹配', keywordLimit: 200 },
                switchKeywordMatchType: { enabled: false },
                shieldKeyword: { enabled: false }
            }
        }
    };

    let userConfig = { ...CONFIG.DEFAULT, ...GM_getValue('config', {}) };
    const normalizedPrompt = typeof userConfig.customPrompt === 'string'
        ? userConfig.customPrompt.trim()
        : '';
    if (!normalizedPrompt || normalizedPrompt === '帮我进行深度诊断' || normalizedPrompt === '深度诊断拿量') {
        userConfig.customPrompt = CONFIG.DEFAULT.customPrompt;
    }

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

        // 判断是否为护航入口文案（兼容平台新旧文案）
        isEscortActionText: (text) => {
            const normalized = String(text || '');
            return /(?:算法护航|小万护航|实时护航)/.test(normalized);
        },

        // 判断是否为有效方案（非未知）
        isValidAction: (name) => name && name !== '未知方案' && name !== '未知'
    };
