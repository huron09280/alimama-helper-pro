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
// @grant        GM_registerMenuCommand
// @connect      127.0.0.1
// @connect      localhost
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

<<<<<<< ours
<<<<<<< ours
    const DEV_ENTRY_SETTING_KEY = 'am.devLoader.entryUrl';
    const DEV_ENTRY_LAST_SUCCESS_KEY = 'am.devLoader.lastSuccessUrl';
    const DEV_ENTRY_LIST_KEY = 'am.devLoader.entryList';
    const DEV_FILENAME_ENCODED = '%E9%98%BF%E9%87%8C%E5%A6%88%E5%A6%88%E5%A4%9A%E5%90%88%E4%B8%80%E5%8A%A9%E6%89%8B.js';
    const DEV_FILENAME_RAW = '阿里妈妈多合一助手.js';
    const DEV_PORTS = [5173, 5500, 8080];
    const DEV_HOSTS = ['127.0.0.1', 'localhost'];
    const DEV_ENTRY_CANDIDATES = [
        `http://127.0.0.1:5173/.codex/worktrees/cb4b/alimama-helper-pro/${DEV_FILENAME_ENCODED}`,
        `http://127.0.0.1:5173/${DEV_FILENAME_ENCODED}`,
        `http://127.0.0.1:5173/${DEV_FILENAME_RAW}`
    ];

    const safeGetValue = (key, fallbackValue = '') => {
        try {
            if (typeof GM_getValue === 'function') {
                const value = GM_getValue(key, fallbackValue);
                return String(value || '').trim();
            }
        } catch { }
        return String(fallbackValue || '').trim();
    };

    const safeSetValue = (key, value) => {
        try {
            if (typeof GM_setValue === 'function') {
                GM_setValue(key, value);
            }
        } catch { }
    };

    const uniqueBy = (list, keyGetter) => {
        const out = [];
        const seen = new Set();
        (Array.isArray(list) ? list : []).forEach(item => {
            const key = keyGetter(item);
            if (seen.has(key)) return;
            seen.add(key);
            out.push(item);
        });
        return out;
    };

    const appendNoCacheTs = (baseUrl) => {
        const url = String(baseUrl || '').trim();
        if (!url) return '';
        const ts = Date.now();
        return `${url}${url.includes('?') ? '&' : '?'}t=${ts}`;
    };

    const canUseFetchFallback = (requestUrl) => {
        const pageProtocol = String(location?.protocol || '');
        // https 页面请求 http 会被 Mixed Content 拦截，直接跳过 fetch，避免无意义失败。
        if (pageProtocol === 'https:' && /^http:\/\//i.test(requestUrl)) return false;
        return true;
    };

    const resolveGMRequest = () => {
        if (typeof GM_xmlhttpRequest === 'function') return GM_xmlhttpRequest;
        try {
            if (typeof GM === 'object' && GM && typeof GM.xmlHttpRequest === 'function') {
                return GM.xmlHttpRequest.bind(GM);
            }
        } catch { }
        return null;
    };

    const loadByGMRequest = (requestUrl) => new Promise((resolve, reject) => {
        const requester = resolveGMRequest();
        if (typeof requester !== 'function') {
            reject(new Error('GM request API unavailable'));
=======
    const DEV_ENTRY_CANDIDATES = [
        'http://127.0.0.1:5173/.codex/worktrees/cb4b/alimama-helper-pro/%E9%98%BF%E9%87%8C%E5%A6%88%E5%A6%88%E5%A4%9A%E5%90%88%E4%B8%80%E5%8A%A9%E6%89%8B.js',
        'http://127.0.0.1:5173/%E9%98%BF%E9%87%8C%E5%A6%88%E5%A6%88%E5%A4%9A%E5%90%88%E4%B8%80%E5%8A%A9%E6%89%8B.js'
    ];

=======
    const DEV_ENTRY_CANDIDATES = [
        'http://127.0.0.1:5173/.codex/worktrees/cb4b/alimama-helper-pro/%E9%98%BF%E9%87%8C%E5%A6%88%E5%A6%88%E5%A4%9A%E5%90%88%E4%B8%80%E5%8A%A9%E6%89%8B.js',
        'http://127.0.0.1:5173/%E9%98%BF%E9%87%8C%E5%A6%88%E5%A6%88%E5%A4%9A%E5%90%88%E4%B8%80%E5%8A%A9%E6%89%8B.js'
    ];

>>>>>>> theirs
    const loadByGMRequest = (requestUrl) => new Promise((resolve, reject) => {
        if (typeof GM_xmlhttpRequest !== 'function') {
            reject(new Error('GM_xmlhttpRequest is not available'));
>>>>>>> theirs
            return;
        }

        requester({
            method: 'GET',
            url: requestUrl,
            nocache: true,
            timeout: 6000,
            onload: (response) => {
                const status = Number(response?.status || 0);
                if ((status >= 200 && status < 300) || status === 304) {
                    resolve(String(response?.responseText || ''));
                    return;
                }
                reject(new Error(`HTTP ${status || 'unknown'}`));
            },
            ontimeout: () => reject(new Error('Request timeout')),
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

<<<<<<< ours
<<<<<<< ours
    const parseEntryListText = (rawText = '') => {
        const text = String(rawText || '').trim();
        if (!text) return [];
        if (text.startsWith('[')) {
            try {
                const parsed = JSON.parse(text);
                if (Array.isArray(parsed)) {
                    return parsed.map(item => (typeof item === 'string' ? item : item?.url || '')).filter(Boolean);
                }
            } catch { }
        }
        return text
            .split(/\r?\n|[,;]/)
            .map(item => String(item || '').trim())
            .filter(Boolean);
    };

    const normalizeEntryUrl = (rawValue = '') => {
        const value = String(rawValue || '').trim().replace(/[?&]t=\d+$/i, '');
        if (!value) return '';
        if (/^https?:\/\//i.test(value)) return value;
        if (value.startsWith('/')) return `http://127.0.0.1:5173${value}`;
        return `http://127.0.0.1:5173/${value}`;
    };

    const readConfiguredEntryList = () => uniqueBy(
        parseEntryListText(safeGetValue(DEV_ENTRY_LIST_KEY, ''))
            .map(item => normalizeEntryUrl(item))
            .filter(Boolean),
        item => item
    );

    const writeConfiguredEntryList = (entryList = []) => {
        const normalizedList = uniqueBy(
            (Array.isArray(entryList) ? entryList : [])
                .map(item => normalizeEntryUrl(item))
                .filter(Boolean),
            item => item
        );
        safeSetValue(DEV_ENTRY_LIST_KEY, JSON.stringify(normalizedList));
        return normalizedList;
    };

    const buildAutoExpandedUrls = () => {
        const autoExpanded = [];
        DEV_HOSTS.forEach(host => {
            DEV_PORTS.forEach(port => {
                autoExpanded.push(`http://${host}:${port}/${DEV_FILENAME_ENCODED}`);
                autoExpanded.push(`http://${host}:${port}/${DEV_FILENAME_RAW}`);
                autoExpanded.push(`http://${host}:${port}/.codex/worktrees/cb4b/alimama-helper-pro/${DEV_FILENAME_ENCODED}`);
            });
        });
        return autoExpanded;
    };

    const buildPresetEntryUrls = () => {
        const custom = normalizeEntryUrl(safeGetValue(DEV_ENTRY_SETTING_KEY, ''));
        const lastSuccess = normalizeEntryUrl(safeGetValue(DEV_ENTRY_LAST_SUCCESS_KEY, ''));
        const configured = readConfiguredEntryList();
        return uniqueBy(
            [custom, lastSuccess].concat(configured, DEV_ENTRY_CANDIDATES)
                .map(item => normalizeEntryUrl(item))
                .filter(Boolean),
            item => item
        );
    };

    const buildCandidateUrls = () => uniqueBy(
        buildPresetEntryUrls().concat(buildAutoExpandedUrls())
            .map(item => normalizeEntryUrl(item))
            .filter(Boolean),
        item => item
    );

    const loadFromCandidates = async () => {
        const failures = [];
        const candidates = buildCandidateUrls();

        for (let i = 0; i < candidates.length; i += 1) {
            const baseUrl = candidates[i];
            const requestUrl = appendNoCacheTs(baseUrl);
            if (!requestUrl) continue;
            let gmError = null;

            try {
                const code = await loadByGMRequest(requestUrl);
                if (!code.trim()) throw new Error('Empty response');
                safeSetValue(DEV_ENTRY_LAST_SUCCESS_KEY, baseUrl);
                return { code, baseUrl, via: 'gm' };
            } catch (error) {
                gmError = error instanceof Error ? error : new Error(String(error || 'Unknown error'));
            }

            if (!canUseFetchFallback(requestUrl)) {
                failures.push({ url: baseUrl, reason: `GM failed: ${gmError?.message || 'unknown'}; fetch skipped` });
                continue;
            }

            try {
                const code = await loadByFetch(requestUrl);
                if (!code.trim()) throw new Error('Empty response');
                safeSetValue(DEV_ENTRY_LAST_SUCCESS_KEY, baseUrl);
                return { code, baseUrl, via: 'fetch' };
            } catch (fetchError) {
                const error = fetchError instanceof Error ? fetchError : new Error(String(fetchError || 'Unknown error'));
                failures.push({
                    url: baseUrl,
                    reason: `GM failed: ${gmError?.message || 'unknown'}; fetch failed: ${error.message}`
                });
            }
        }

        const detail = failures.map((item, idx) => `${idx + 1}. ${item.url} -> ${item.reason}`).join('\n');
        const error = new Error(`All candidate URLs failed\n${detail || '(no candidates)'}`);
        error.failures = failures;
        throw error;
    };

    const readLoaderEntryState = () => {
        const custom = normalizeEntryUrl(safeGetValue(DEV_ENTRY_SETTING_KEY, ''));
        const lastSuccess = normalizeEntryUrl(safeGetValue(DEV_ENTRY_LAST_SUCCESS_KEY, ''));
        const configuredList = readConfiguredEntryList();
        const presetList = buildPresetEntryUrls();
        const effective = custom || lastSuccess || presetList[0] || DEV_ENTRY_CANDIDATES[0];
        return { custom, lastSuccess, configuredList, presetList, effective };
    };

    const registerMenuCommands = () => {
        if (typeof GM_registerMenuCommand !== 'function') return;

        GM_registerMenuCommand('AM DevLoader: 查看当前入口', () => {
            const state = readLoaderEntryState();
            const message = [
                `自定义入口: ${state.custom || '(未设置)'}`,
                `最近成功: ${state.lastSuccess || '(无)'}`,
                `当前生效: ${state.effective || '(无)'}`,
                `可选入口数: ${state.presetList.length}`
            ].join('\n');
            alert(message);
        });

        GM_registerMenuCommand('AM DevLoader: 设置自定义入口 URL', () => {
            const state = readLoaderEntryState();
            const input = prompt(
                '输入本地脚本 URL（支持完整 URL 或相对路径，留空则清除）',
                state.custom || state.effective || ''
            );
            if (input === null) return;
            const normalized = normalizeEntryUrl(input);
            if (!normalized) {
                safeSetValue(DEV_ENTRY_SETTING_KEY, '');
                alert('已清除自定义入口，刷新页面后生效。');
                return;
            }
            safeSetValue(DEV_ENTRY_SETTING_KEY, normalized);
            alert(`已设置自定义入口：\n${normalized}\n\n刷新页面后生效。`);
        });

        GM_registerMenuCommand('AM DevLoader: 编辑可选入口列表', () => {
            const state = readLoaderEntryState();
            const input = prompt(
                '每行一个入口 URL（支持完整 URL 或相对路径）',
                (state.configuredList || []).join('\n')
            );
            if (input === null) return;
            const nextList = writeConfiguredEntryList(parseEntryListText(input));
            alert(`已保存 ${nextList.length} 个入口，刷新页面后生效。`);
        });

        GM_registerMenuCommand('AM DevLoader: 清除最近成功缓存', () => {
            safeSetValue(DEV_ENTRY_LAST_SUCCESS_KEY, '');
            alert('已清除最近成功入口缓存。');
        });
    };

    const shortenUrl = (url = '', maxLength = 64) => {
        const text = String(url || '').trim();
        if (!text || text.length <= maxLength) return text;
        return `${text.slice(0, maxLength - 3)}...`;
    };

    const mountPageSwitcher = () => {
        const mount = () => {
            if (!document.body || document.getElementById('am-dev-loader-switcher')) return;

            const style = document.createElement('style');
            style.id = 'am-dev-loader-switcher-style';
            style.textContent = `
                #am-dev-loader-switcher { position: fixed; right: 14px; bottom: 14px; z-index: 2147483647; font: 12px/1.4 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif; color: #1f2937; }
                #am-dev-loader-switcher .am-dev-toggle { border: 1px solid rgba(37,99,235,0.45); background: #fff; color: #1d4ed8; border-radius: 999px; padding: 6px 10px; cursor: pointer; box-shadow: 0 4px 14px rgba(15,23,42,0.16); }
                #am-dev-loader-switcher .am-dev-panel { margin-top: 8px; width: 340px; max-width: 72vw; background: #fff; border: 1px solid rgba(15,23,42,0.12); border-radius: 10px; padding: 8px; box-shadow: 0 10px 28px rgba(15,23,42,0.24); display: none; }
                #am-dev-loader-switcher .am-dev-row { display: flex; gap: 6px; align-items: center; }
                #am-dev-loader-switcher .am-dev-row + .am-dev-row { margin-top: 6px; }
                #am-dev-loader-switcher .am-dev-select { flex: 1; min-width: 0; height: 30px; border: 1px solid rgba(15,23,42,0.22); border-radius: 8px; padding: 0 8px; background: #fff; color: #111827; }
                #am-dev-loader-switcher .am-dev-btn { border: 1px solid rgba(15,23,42,0.18); background: #fff; border-radius: 8px; height: 30px; padding: 0 10px; cursor: pointer; color: #111827; white-space: nowrap; }
                #am-dev-loader-switcher .am-dev-btn.primary { border-color: rgba(29,78,216,0.45); color: #1d4ed8; }
                #am-dev-loader-switcher .am-dev-tip { font-size: 11px; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            `;
            document.documentElement.appendChild(style);

            const wrap = document.createElement('div');
            wrap.id = 'am-dev-loader-switcher';
            wrap.innerHTML = `
                <button type="button" class="am-dev-toggle">Dev JS</button>
                <div class="am-dev-panel">
                    <div class="am-dev-row">
                        <select class="am-dev-select"></select>
                        <button type="button" class="am-dev-btn primary" data-act="apply">切换</button>
                    </div>
                    <div class="am-dev-row">
                        <button type="button" class="am-dev-btn" data-act="edit">编辑列表</button>
                        <button type="button" class="am-dev-btn" data-act="auto">自动</button>
                    </div>
                    <div class="am-dev-row">
                        <div class="am-dev-tip"></div>
                    </div>
                </div>
            `;
            document.body.appendChild(wrap);

            const toggleBtn = wrap.querySelector('.am-dev-toggle');
            const panel = wrap.querySelector('.am-dev-panel');
            const select = wrap.querySelector('.am-dev-select');
            const tip = wrap.querySelector('.am-dev-tip');
            const applyBtn = wrap.querySelector('[data-act="apply"]');
            const editBtn = wrap.querySelector('[data-act="edit"]');
            const autoBtn = wrap.querySelector('[data-act="auto"]');

            const renderOptions = () => {
                const state = readLoaderEntryState();
                const options = (state.presetList || []).length ? state.presetList : buildCandidateUrls();
                const activeValue = state.custom || state.effective || options[0] || '';
                select.innerHTML = options.map(url => (
                    `<option value="${url.replace(/"/g, '&quot;')}">${shortenUrl(url)}</option>`
                )).join('');
                if (activeValue) select.value = activeValue;
                if (!select.value && options.length) select.value = options[0];
                tip.textContent = `当前: ${shortenUrl(state.effective || '未识别')}`;
            };

            toggleBtn.addEventListener('click', () => {
                panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
                if (panel.style.display === 'block') renderOptions();
            });

            applyBtn.addEventListener('click', () => {
                const next = normalizeEntryUrl(select.value || '');
                if (!next) return;
                safeSetValue(DEV_ENTRY_SETTING_KEY, next);
                location.reload();
            });

            editBtn.addEventListener('click', () => {
                const state = readLoaderEntryState();
                const input = prompt(
                    '每行一个入口 URL（支持完整 URL 或相对路径）',
                    (state.configuredList || []).join('\n')
                );
                if (input === null) return;
                const nextList = writeConfiguredEntryList(parseEntryListText(input));
                if (!nextList.length) {
                    alert('列表已清空，仅保留默认候选。');
                }
                renderOptions();
            });

            autoBtn.addEventListener('click', () => {
                safeSetValue(DEV_ENTRY_SETTING_KEY, '');
                location.reload();
            });
        };

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', mount, { once: true });
        } else {
            mount();
        }
    };

    registerMenuCommands();
    mountPageSwitcher();

    loadFromCandidates()
        .then(({ code, baseUrl, via }) => {
            console.info('[AM Dev Loader] Loaded from:', baseUrl, `via=${via}`);
=======
=======
>>>>>>> theirs
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
<<<<<<< ours
>>>>>>> theirs
=======
>>>>>>> theirs
            // 直接在 userscript 沙箱内执行，保留 GM_* API 能力。
            eval(`${code}\n//# sourceURL=alimama-helper-pro.dev.js`);
        })
        .catch((error) => {
            console.error('[AM Dev Loader] 本地脚本加载失败：', error);
        });
})();
