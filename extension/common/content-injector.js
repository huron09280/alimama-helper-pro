(() => {
    'use strict';

    const MARKER = '__AM_HELPER_PRO_EXTENSION_INJECTED__';
    if (window[MARKER]) return;
    window[MARKER] = true;

    const runtime = globalThis.browser?.runtime || globalThis.chrome?.runtime;
    if (!runtime?.getURL) {
        console.error('[AM][EXT] runtime.getURL unavailable, skip injection.');
        return;
    }

    const injectScript = (resourcePath) => new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = runtime.getURL(resourcePath);
        script.async = false;
        script.onload = () => {
            script.remove();
            resolve();
        };
        script.onerror = () => {
            script.remove();
            reject(new Error(`Failed to inject ${resourcePath}`));
        };
        (document.head || document.documentElement).appendChild(script);
    });

    injectScript('scripts/gm-shim.js')
        .then(() => injectScript('scripts/alimama-helper-core.js'))
        .catch((err) => {
            console.error('[AM][EXT] Script injection failed:', err);
        });
})();
