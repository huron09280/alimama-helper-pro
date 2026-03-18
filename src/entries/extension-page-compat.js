(() => {
    const SCRIPT_VERSION = __AM_EXTENSION_VERSION__;
    const STORAGE_KEY = '__AM_EXTENSION_GM_STORE__';

    const readStore = () => {
        try {
            const raw = window.localStorage?.getItem?.(STORAGE_KEY);
            if (!raw) return {};
            const parsed = JSON.parse(raw);
            return parsed && typeof parsed === 'object' ? parsed : {};
        } catch {
            return {};
        }
    };

    const writeStore = (store) => {
        try {
            window.localStorage?.setItem?.(STORAGE_KEY, JSON.stringify(store || {}));
        } catch { }
    };

    const writeClipboardFallback = (text) => {
        try {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.setAttribute('readonly', 'readonly');
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            textarea.style.pointerEvents = 'none';
            (document.body || document.documentElement || document).appendChild(textarea);
            textarea.focus();
            textarea.select();
            document.execCommand('copy');
            textarea.remove();
        } catch { }
    };

    const GM_info_value = {
        script: {
            name: '阿里妈妈多合一助手 (Pro版)',
            version: SCRIPT_VERSION,
            namespace: 'https://github.com/huron09280/alimama-helper-pro'
        }
    };

    const GM_getValue_impl = (key, fallbackValue = undefined) => {
        const normalizedKey = String(key || '').trim();
        if (!normalizedKey) return fallbackValue;
        const store = readStore();
        return Object.prototype.hasOwnProperty.call(store, normalizedKey)
            ? store[normalizedKey]
            : fallbackValue;
    };

    const GM_setValue_impl = (key, value) => {
        const normalizedKey = String(key || '').trim();
        if (!normalizedKey) return;
        const store = readStore();
        store[normalizedKey] = value;
        writeStore(store);
    };

    const GM_setClipboard_impl = (value) => {
        const text = String(value ?? '');
        if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function' && window.isSecureContext) {
            navigator.clipboard.writeText(text).catch(() => writeClipboardFallback(text));
            return;
        }
        writeClipboardFallback(text);
    };

    if (typeof window.GM_getValue !== 'function') {
        window.GM_getValue = GM_getValue_impl;
    }
    if (typeof window.GM_setValue !== 'function') {
        window.GM_setValue = GM_setValue_impl;
    }
    if (typeof window.GM_setClipboard !== 'function') {
        window.GM_setClipboard = GM_setClipboard_impl;
    }

    window.GM_info = window.GM_info || GM_info_value;
    const gmInfo = window.GM && window.GM.info && typeof window.GM.info === 'object'
        ? {
            ...GM_info_value,
            ...window.GM.info,
            script: {
                ...GM_info_value.script,
                ...(window.GM.info.script || {})
            }
        }
        : GM_info_value;
    window.GM = Object.assign({}, window.GM, {
        info: gmInfo,
        getValue: window.GM_getValue,
        setValue: window.GM_setValue,
        setClipboard: window.GM_setClipboard
    });

    if (typeof window.unsafeWindow === 'undefined') {
        window.unsafeWindow = window;
    }

    window.__AM_PLATFORM_RUNTIME__ = {
        mode: 'extension',
        version: SCRIPT_VERSION,
        storage: 'localStorage'
    };
})();
