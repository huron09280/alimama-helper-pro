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

    const DEV_ENTRY_URL = 'http://127.0.0.1:5173/%E9%98%BF%E9%87%8C%E5%A6%88%E5%A6%88%E5%A4%9A%E5%90%88%E4%B8%80%E5%8A%A9%E6%89%8B.js';
    const requestUrl = `${DEV_ENTRY_URL}?t=${Date.now()}`;

    const loadByGMRequest = () => new Promise((resolve, reject) => {
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

    const loadByFetch = () => fetch(requestUrl, { cache: 'no-store' })
        .then((response) => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return response.text();
        });

    loadByGMRequest()
        .catch(() => loadByFetch())
        .then((code) => {
            // 直接在 userscript 沙箱内执行，保留 GM_* API 能力。
            eval(`${code}\n//# sourceURL=alimama-helper-pro.dev.js`);
        })
        .catch((error) => {
            console.error('[AM Dev Loader] 本地脚本加载失败：', error);
        });
})();
