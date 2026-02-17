// ==UserScript==
// @name         阿里妈妈多合一助手 (Dev Loader)
// @namespace    http://tampermonkey.net/
// @version      0.1.0
// @description  本地开发加载器：每次刷新页面都拉取最新脚本并执行，避免手动复制粘贴
// @author       Liangchao
// @match        *://alimama.com/*
// @match        *://*.alimama.com/*
// @match        https://one.alimama.com/*
// @grant        GM_setClipboard
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_xmlhttpRequest
// @connect      127.0.0.1
// @connect      localhost
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    const DEV_ENTRY_CANDIDATES = [
        'http://127.0.0.1:5173/.codex/worktrees/cb4b/alimama-helper-pro/%E9%98%BF%E9%87%8C%E5%A6%88%E5%A6%88%E5%A4%9A%E5%90%88%E4%B8%80%E5%8A%A9%E6%89%8B.js',
        'http://127.0.0.1:5173/%E9%98%BF%E9%87%8C%E5%A6%88%E5%A6%88%E5%A4%9A%E5%90%88%E4%B8%80%E5%8A%A9%E6%89%8B.js'
    ];

    const loadByGMRequest = (requestUrl) => new Promise((resolve, reject) => {
        if (typeof GM_xmlhttpRequest !== 'function') {
            reject(new Error('GM_xmlhttpRequest is not available'));
            return;
        }

        GM_xmlhttpRequest({
            method: 'GET',
            url: requestUrl,
            nocache: true,
            onload: (response) => {
                if (response.status >= 200 && response.status < 300) {
                    resolve(response.responseText);
                    return;
                }
                reject(new Error(`HTTP ${response.status}`));
            },
            onerror: () => reject(new Error('Network error'))
        });
    });

    const loadByFetch = (requestUrl) => fetch(requestUrl, { cache: 'no-store' })
        .then((response) => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return response.text();
        });

    const loadFromCandidates = async () => {
        for (let i = 0; i < DEV_ENTRY_CANDIDATES.length; i += 1) {
            const baseUrl = DEV_ENTRY_CANDIDATES[i];
            const requestUrl = `${baseUrl}?t=${Date.now()}`;
            try {
                const code = await loadByGMRequest(requestUrl);
                return { code, baseUrl };
            } catch {
                try {
                    const code = await loadByFetch(requestUrl);
                    return { code, baseUrl };
                } catch {
                    // 继续尝试下一个候选地址
                }
            }
        }
        throw new Error('All candidate URLs failed');
    };

    loadFromCandidates()
        .then(({ code, baseUrl }) => {
            console.info('[AM Dev Loader] Loaded from:', baseUrl);
            // 直接在 userscript 沙箱内执行，保留 GM_* API 能力。
            eval(`${code}\n//# sourceURL=alimama-helper-pro.dev.js`);
        })
        .catch((error) => {
            console.error('[AM Dev Loader] 本地脚本加载失败：', error);
        });
})();
