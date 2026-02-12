(function () {
    'use strict';

    const VERSION = '__AM_VERSION__';
    const STORAGE_PREFIX = '__AM_GM_STORE__';
    const globalObj = typeof window !== 'undefined' ? window : globalThis;

    const serialize = (value) => {
        try {
            return JSON.stringify(value);
        } catch {
            return JSON.stringify(null);
        }
    };

    const deserialize = (raw, defaultValue) => {
        if (raw === null || raw === undefined) return defaultValue;
        try {
            return JSON.parse(raw);
        } catch {
            return defaultValue;
        }
    };

    const getKey = (key) => `${STORAGE_PREFIX}:${String(key)}`;

    const gmGetValue = (key, defaultValue = undefined) => {
        try {
            return deserialize(localStorage.getItem(getKey(key)), defaultValue);
        } catch {
            return defaultValue;
        }
    };

    const gmSetValue = (key, value) => {
        try {
            localStorage.setItem(getKey(key), serialize(value));
            return true;
        } catch {
            return false;
        }
    };

    const gmSetClipboard = async (text) => {
        const value = text === null || text === undefined ? '' : String(text);

        try {
            await navigator.clipboard.writeText(value);
            return true;
        } catch {
            const ta = document.createElement('textarea');
            ta.value = value;
            ta.setAttribute('readonly', '');
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            ta.setSelectionRange(0, ta.value.length);
            document.execCommand('copy');
            ta.remove();
            return true;
        }
    };

    if (typeof globalObj.GM_getValue !== 'function') {
        globalObj.GM_getValue = gmGetValue;
    }
    if (typeof globalObj.GM_setValue !== 'function') {
        globalObj.GM_setValue = gmSetValue;
    }
    if (typeof globalObj.GM_setClipboard !== 'function') {
        globalObj.GM_setClipboard = gmSetClipboard;
    }

    if (typeof globalObj.GM_info === 'undefined' || !globalObj.GM_info?.script) {
        globalObj.GM_info = {
            script: {
                name: '阿里妈妈多合一助手 (Pro版)',
                version: VERSION
            }
        };
    }
})();
