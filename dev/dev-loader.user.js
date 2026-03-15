// ==UserScript==
// @name         阿里妈妈多合一助手 (Dev Loader)
// @namespace    http://tampermonkey.net/
// @version      0.2.0
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

    const DEV_ENTRY_SETTING_KEY = 'am.devLoader.entryUrl';
    const DEV_ENTRY_LAST_SUCCESS_KEY = 'am.devLoader.lastSuccessUrl';
    const DEV_ENTRY_LIST_KEY = 'am.devLoader.entryList';
    const DEV_FILENAME_ENCODED = '%E9%98%BF%E9%87%8C%E5%A6%88%E5%A6%88%E5%A4%9A%E5%90%88%E4%B8%80%E5%8A%A9%E6%89%8B.js';
    const DEV_FILENAME_RAW = '阿里妈妈多合一助手.js';
    const DEV_PORTS = [5173, 5500, 8080];
    const DEV_HOSTS = ['127.0.0.1', 'localhost'];
    const DEV_ENTRY_CANDIDATES = [
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
            onerror: () => reject(new Error('Network error')),
            onabort: () => reject(new Error('Request aborted'))
        });
    });

    const loadByFetch = (requestUrl) => fetch(requestUrl, { cache: 'no-store' })
        .then((response) => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return response.text();
        });

    const normalizeEntryItem = (rawItem) => {
        if (typeof rawItem === 'string') {
            const normalizedUrl = normalizeEntryUrl(rawItem);
            return normalizedUrl ? { url: normalizedUrl, remark: '' } : null;
        }
        if (!rawItem || typeof rawItem !== 'object') return null;
        const normalizedUrl = normalizeEntryUrl(rawItem.url || rawItem.value || '');
        if (!normalizedUrl) return null;
        return {
            url: normalizedUrl,
            remark: String(rawItem.remark || rawItem.note || rawItem.name || '').trim()
        };
    };

    const formatEntryItem = (entry) => {
        const normalized = normalizeEntryItem(entry);
        if (!normalized) return '';
        return normalized.remark ? `${normalized.url} | ${normalized.remark}` : normalized.url;
    };

    const parseEntryListText = (rawText = '') => {
        const text = String(rawText || '').trim();
        if (!text) return [];
        if (text.startsWith('[')) {
            try {
                const parsed = JSON.parse(text);
                if (Array.isArray(parsed)) {
                    return parsed.map(item => normalizeEntryItem(item)).filter(Boolean);
                }
            } catch { }
        }

        const lines = text.includes('\n')
            ? text.split(/\r?\n/)
            : text.split(/[,;]/);

        return lines
            .map((item) => {
                const line = String(item || '').trim();
                if (!line) return null;
                const segments = line.split(/\s*[|｜]\s*/);
                const urlPart = String(segments.shift() || '').trim();
                const remarkPart = segments.join(' | ').trim();
                return normalizeEntryItem({ url: urlPart, remark: remarkPart });
            })
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
        parseEntryListText(safeGetValue(DEV_ENTRY_LIST_KEY, '')),
        item => item.url
    );

    const writeConfiguredEntryList = (entryList = []) => {
        const normalizedList = uniqueBy(
            (Array.isArray(entryList) ? entryList : [])
                .map(item => normalizeEntryItem(item))
                .filter(Boolean),
            item => item.url
        );
        safeSetValue(DEV_ENTRY_LIST_KEY, JSON.stringify(normalizedList));
        return normalizedList;
    };

    const createEntryMap = (entryList = []) => {
        const map = new Map();
        (Array.isArray(entryList) ? entryList : []).forEach((item) => {
            const normalized = normalizeEntryItem(item);
            if (!normalized) return;
            map.set(normalized.url, normalized);
        });
        return map;
    };

    const buildAutoExpandedUrls = () => {
        const autoExpanded = [];
        DEV_HOSTS.forEach(host => {
            DEV_PORTS.forEach(port => {
                autoExpanded.push(`http://${host}:${port}/${DEV_FILENAME_ENCODED}`);
                autoExpanded.push(`http://${host}:${port}/${DEV_FILENAME_RAW}`);
            });
        });
        return autoExpanded;
    };

    const buildPresetEntryList = () => {
        const custom = normalizeEntryUrl(safeGetValue(DEV_ENTRY_SETTING_KEY, ''));
        const lastSuccess = normalizeEntryUrl(safeGetValue(DEV_ENTRY_LAST_SUCCESS_KEY, ''));
        const configured = readConfiguredEntryList();
        return uniqueBy(
            [custom, lastSuccess].concat(configured, DEV_ENTRY_CANDIDATES)
                .map(item => normalizeEntryItem(item))
                .filter(Boolean),
            item => item.url
        );
    };

    const buildCandidateUrls = () => uniqueBy(
        buildPresetEntryList().concat(buildAutoExpandedUrls())
            .map(item => normalizeEntryItem(item)?.url || '')
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
        const presetList = buildPresetEntryList();
        const entryMap = createEntryMap(configuredList.concat(presetList));
        const effective = custom || lastSuccess || presetList[0]?.url || DEV_ENTRY_CANDIDATES[0];
        return { custom, lastSuccess, configuredList, presetList, entryMap, effective };
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
                (state.configuredList || []).map(item => item.url || '').filter(Boolean).join('\n')
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

    const escapeHtml = (text = '') => String(text || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    const getEntryRemark = (url = '', entryMap = new Map()) => String(entryMap.get(url)?.remark || '').trim();

    const getEntryDisplayText = (url = '', entryMap = new Map()) => {
        const normalizedUrl = normalizeEntryUrl(url);
        const remark = getEntryRemark(normalizedUrl, entryMap);
        return remark || shortenUrl(normalizedUrl);
    };

    const showLoadFailureBadge = (error) => {
        const detail = String(error?.message || error || 'Unknown error').trim() || 'Unknown error';
        const summary = 'AM Dev Loader 加载失败（点击查看详情）';
        const mount = () => {
            if (document.getElementById('am-dev-loader-error')) return;
            const badge = document.createElement('button');
            badge.type = 'button';
            badge.id = 'am-dev-loader-error';
            badge.textContent = summary;
            badge.title = detail;
            badge.style.cssText = [
                'position:fixed',
                'right:14px',
                'top:14px',
                'z-index:2147483647',
                'padding:8px 10px',
                'border:1px solid rgba(185,28,28,0.45)',
                'border-radius:8px',
                'background:#fff',
                'color:#b91c1c',
                'font:12px/1.4 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
                'cursor:pointer',
                'box-shadow:0 6px 16px rgba(15,23,42,0.18)'
            ].join(';');
            badge.addEventListener('click', () => {
                alert(`${summary}\n\n${detail}`);
            });
            (document.body || document.documentElement).appendChild(badge);
        };
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', mount, { once: true });
            return;
        }
        mount();
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
                #am-dev-loader-switcher .am-dev-btn.danger { border-color: rgba(185,28,28,0.18); color: #b91c1c; }
                #am-dev-loader-switcher .am-dev-tip { font-size: 11px; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                #am-dev-loader-switcher .am-dev-modal-mask { position: fixed; inset: 0; z-index: 2147483646; background: rgba(15,23,42,0.32); display: none; align-items: center; justify-content: center; padding: 16px; }
                #am-dev-loader-switcher .am-dev-modal { width: 560px; max-width: calc(100vw - 32px); max-height: calc(100vh - 32px); overflow: auto; background: #fff; border: 1px solid rgba(15,23,42,0.12); border-radius: 12px; padding: 14px; box-shadow: 0 16px 40px rgba(15,23,42,0.24); }
                #am-dev-loader-switcher .am-dev-modal-title { font-size: 14px; font-weight: 600; color: #111827; }
                #am-dev-loader-switcher .am-dev-modal-desc { margin-top: 6px; font-size: 12px; color: #64748b; }
                #am-dev-loader-switcher .am-dev-entry-editor { margin-top: 10px; border: 1px solid rgba(15,23,42,0.12); border-radius: 10px; padding: 10px; background: #f8fafc; }
                #am-dev-loader-switcher .am-dev-field { display: block; font-size: 12px; color: #475569; }
                #am-dev-loader-switcher .am-dev-field + .am-dev-field { margin-top: 8px; }
                #am-dev-loader-switcher .am-dev-input { width: 100%; height: 34px; margin-top: 4px; border: 1px solid rgba(15,23,42,0.18); border-radius: 8px; padding: 0 10px; box-sizing: border-box; background: #fff; color: #111827; }
                #am-dev-loader-switcher .am-dev-entry-list { margin-top: 10px; border: 1px solid rgba(15,23,42,0.12); border-radius: 10px; background: #fff; max-height: 260px; overflow: auto; }
                #am-dev-loader-switcher .am-dev-entry-empty { padding: 16px 12px; text-align: center; font-size: 12px; color: #94a3b8; }
                #am-dev-loader-switcher .am-dev-entry-item { display: flex; gap: 8px; align-items: flex-start; justify-content: space-between; padding: 10px 12px; border-bottom: 1px solid rgba(15,23,42,0.08); }
                #am-dev-loader-switcher .am-dev-entry-item:last-child { border-bottom: none; }
                #am-dev-loader-switcher .am-dev-entry-main { flex: 1; min-width: 0; cursor: pointer; }
                #am-dev-loader-switcher .am-dev-entry-name { font-size: 13px; font-weight: 600; color: #111827; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                #am-dev-loader-switcher .am-dev-entry-url { margin-top: 4px; font-size: 11px; color: #64748b; word-break: break-all; }
                #am-dev-loader-switcher .am-dev-entry-actions { display: flex; gap: 6px; flex-shrink: 0; }
                #am-dev-loader-switcher .am-dev-modal-actions { display: flex; justify-content: flex-end; gap: 6px; margin-top: 10px; }
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
                <div class="am-dev-modal-mask" hidden>
                    <div class="am-dev-modal">
                        <div class="am-dev-modal-title">编辑列表</div>
                        <div class="am-dev-modal-desc">每一个列表项都可以设置备注名，列表显示备注名，点“编辑”可以继续修改。</div>
                        <div class="am-dev-entry-editor">
                            <label class="am-dev-field">入口 URL
                                <input type="text" class="am-dev-input" data-role="entry-url" placeholder="支持完整 URL 或相对路径">
                            </label>
                            <label class="am-dev-field">备注名
                                <input type="text" class="am-dev-input" data-role="entry-remark" placeholder="例如：本地开发 / 测试入口">
                            </label>
                            <div class="am-dev-modal-actions">
                                <button type="button" class="am-dev-btn" data-act="reset-entry">新增</button>
                                <button type="button" class="am-dev-btn primary" data-act="apply-entry">加入列表</button>
                            </div>
                        </div>
                        <div class="am-dev-entry-list"></div>
                        <div class="am-dev-modal-actions">
                            <button type="button" class="am-dev-btn" data-act="cancel-edit">取消</button>
                            <button type="button" class="am-dev-btn primary" data-act="save-edit">保存</button>
                        </div>
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
            const editMask = wrap.querySelector('.am-dev-modal-mask');
            const editModal = wrap.querySelector('.am-dev-modal');
            const entryUrlInput = wrap.querySelector('[data-role="entry-url"]');
            const entryRemarkInput = wrap.querySelector('[data-role="entry-remark"]');
            const entryListBox = wrap.querySelector('.am-dev-entry-list');
            const resetEntryBtn = wrap.querySelector('[data-act="reset-entry"]');
            const applyEntryBtn = wrap.querySelector('[data-act="apply-entry"]');
            const cancelEditBtn = wrap.querySelector('[data-act="cancel-edit"]');
            const saveEditBtn = wrap.querySelector('[data-act="save-edit"]');
            let tipTimer = 0;
            let draftEntryList = [];
            let editingEntryIndex = -1;

            const restoreTip = () => {
                const state = readLoaderEntryState();
                tip.textContent = `当前: ${getEntryDisplayText(state.effective || '未识别', state.entryMap)}`;
            };

            const flashTip = (message) => {
                tip.textContent = message;
                if (tipTimer) {
                    clearTimeout(tipTimer);
                }
                tipTimer = setTimeout(() => {
                    tipTimer = 0;
                    restoreTip();
                }, 1800);
            };

            const syncEntryFormState = () => {
                applyEntryBtn.textContent = editingEntryIndex >= 0 ? '更新' : '加入列表';
                resetEntryBtn.textContent = editingEntryIndex >= 0 ? '取消编辑' : '新增';
            };

            const resetEntryForm = (shouldFocus = false) => {
                editingEntryIndex = -1;
                entryUrlInput.value = '';
                entryRemarkInput.value = '';
                syncEntryFormState();
                if (shouldFocus) {
                    setTimeout(() => {
                        entryUrlInput.focus();
                    }, 0);
                }
            };

            const renderDraftEntryList = () => {
                if (!draftEntryList.length) {
                    entryListBox.innerHTML = '<div class="am-dev-entry-empty">暂无自定义入口，先新增一条吧。</div>';
                    return;
                }
                entryListBox.innerHTML = draftEntryList.map((item, index) => {
                    const primaryText = item.remark || shortenUrl(item.url);
                    return `
                        <div class="am-dev-entry-item" data-entry-index="${index}">
                            <div class="am-dev-entry-main" data-act="edit-entry" data-entry-index="${index}" title="${escapeHtml(item.url)}">
                                <div class="am-dev-entry-name">${escapeHtml(primaryText)}</div>
                                <div class="am-dev-entry-url">${escapeHtml(item.url)}</div>
                            </div>
                            <div class="am-dev-entry-actions">
                                <button type="button" class="am-dev-btn" data-act="edit-entry" data-entry-index="${index}">编辑</button>
                                <button type="button" class="am-dev-btn danger" data-act="remove-entry" data-entry-index="${index}">删除</button>
                            </div>
                        </div>
                    `;
                }).join('');
            };

            const renderOptions = () => {
                const state = readLoaderEntryState();
                const options = (state.presetList || []).length
                    ? state.presetList
                    : buildCandidateUrls().map(url => ({ url, remark: '' }));
                const activeValue = state.custom || state.effective || options[0] || '';
                select.innerHTML = options.map(({ url, remark }) => (
                    `<option value="${escapeHtml(url)}" title="${escapeHtml(url)}">${escapeHtml(remark || shortenUrl(url))}</option>`
                )).join('');
                if (activeValue) select.value = typeof activeValue === 'string' ? activeValue : activeValue.url;
                if (!select.value && options.length) select.value = options[0].url;
                if (!tipTimer) {
                    restoreTip();
                }
            };

            const closeEditModal = () => {
                editMask.hidden = true;
                editMask.style.display = 'none';
                resetEntryForm();
            };

            const openEditModal = () => {
                const state = readLoaderEntryState();
                draftEntryList = (state.configuredList || []).map(item => normalizeEntryItem(item)).filter(Boolean);
                renderDraftEntryList();
                resetEntryForm();
                editMask.hidden = false;
                editMask.style.display = 'flex';
                setTimeout(() => {
                    entryUrlInput.focus();
                }, 0);
            };

            const beginEditEntry = (index) => {
                const current = draftEntryList[index];
                if (!current) return;
                editingEntryIndex = index;
                entryUrlInput.value = current.url;
                entryRemarkInput.value = current.remark || '';
                syncEntryFormState();
                entryRemarkInput.focus();
                entryRemarkInput.select();
            };

            const removeDraftEntry = (index) => {
                if (!draftEntryList[index]) return;
                draftEntryList = draftEntryList.filter((_, itemIndex) => itemIndex !== index);
                if (editingEntryIndex === index) {
                    resetEntryForm();
                } else if (editingEntryIndex > index) {
                    editingEntryIndex -= 1;
                    syncEntryFormState();
                }
                renderDraftEntryList();
            };

            const applyDraftEntry = () => {
                const normalized = normalizeEntryItem({
                    url: entryUrlInput.value,
                    remark: entryRemarkInput.value
                });
                if (!normalized) {
                    flashTip('请输入有效入口 URL。');
                    entryUrlInput.focus();
                    return;
                }
                const nextList = draftEntryList.slice();
                if (editingEntryIndex >= 0 && nextList[editingEntryIndex]) {
                    nextList[editingEntryIndex] = normalized;
                } else {
                    nextList.push(normalized);
                }
                draftEntryList = uniqueBy(nextList, item => item.url);
                renderDraftEntryList();
                resetEntryForm(true);
                flashTip(normalized.remark ? `已更新：${normalized.remark}` : `已更新：${shortenUrl(normalized.url, 40)}`);
            };

            const saveEditedList = () => {
                const nextList = writeConfiguredEntryList(draftEntryList);
                closeEditModal();
                renderOptions();
                flashTip(nextList.length ? `已保存 ${nextList.length} 个入口。` : '列表已清空，仅保留默认候选。');
            };

            const handleEntryFieldKeydown = (event) => {
                if (event.key === 'Escape') {
                    closeEditModal();
                    return;
                }
                if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                    event.preventDefault();
                    saveEditedList();
                    return;
                }
                if (event.key === 'Enter') {
                    event.preventDefault();
                    applyDraftEntry();
                }
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

            editBtn.addEventListener('click', openEditModal);
            resetEntryBtn.addEventListener('click', () => {
                resetEntryForm(true);
            });
            applyEntryBtn.addEventListener('click', applyDraftEntry);
            cancelEditBtn.addEventListener('click', closeEditModal);
            saveEditBtn.addEventListener('click', saveEditedList);
            entryListBox.addEventListener('click', (event) => {
                const trigger = event.target.closest('[data-act]');
                if (!trigger) return;
                const action = trigger.getAttribute('data-act');
                const index = Number(trigger.getAttribute('data-entry-index'));
                if (!Number.isInteger(index) || index < 0) return;
                if (action === 'edit-entry') {
                    beginEditEntry(index);
                    return;
                }
                if (action === 'remove-entry') {
                    removeDraftEntry(index);
                }
            });
            editMask.addEventListener('click', (event) => {
                if (event.target === editMask) closeEditModal();
            });
            editModal.addEventListener('click', (event) => {
                event.stopPropagation();
            });
            entryUrlInput.addEventListener('keydown', handleEntryFieldKeydown);
            entryRemarkInput.addEventListener('keydown', handleEntryFieldKeydown);

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
            // 直接在 userscript 沙箱内执行，保留 GM_* API 能力。
            eval(`${code}\n//# sourceURL=alimama-helper-pro.dev.js`);
        })
        .catch((error) => {
            console.error('[AM Dev Loader] 本地脚本加载失败：', error);
            showLoadFailureBadge(error);
        });
})();
