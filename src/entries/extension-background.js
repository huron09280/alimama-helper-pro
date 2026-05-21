(() => {
    'use strict';

    const VERIFY_ENDPOINT = 'https://am-licee-server-mpbzozflkj.cn-hangzhou.fcapp.run/v1/license/verify';
    const VERIFY_REQUEST_TYPE = 'AM_LICENSE_VERIFY_REQUEST';

    const safeParseJson = (value = '') => {
        const text = String(value || '').trim();
        if (!text) return null;
        try {
            const parsed = JSON.parse(text);
            return parsed && typeof parsed === 'object' ? parsed : null;
        } catch {
            return null;
        }
    };

    const isAllowedSenderUrl = (value = '') => {
        try {
            const url = new URL(String(value || ''));
            const protocol = String(url.protocol || '').toLowerCase();
            const hostname = String(url.hostname || '').toLowerCase();
            if (protocol !== 'https:' && protocol !== 'http:') return false;
            return hostname === 'alimama.com' || hostname.endsWith('.alimama.com');
        } catch {
            return false;
        }
    };

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message?.type !== VERIFY_REQUEST_TYPE) return false;

        (async () => {
            if (!isAllowedSenderUrl(sender?.url || '')) {
                sendResponse({
                    ok: false,
                    status: 403,
                    message: 'sender_not_allowed'
                });
                return;
            }

            const payload = message?.payload && typeof message.payload === 'object'
                ? message.payload
                : null;
            if (!payload) {
                sendResponse({
                    ok: false,
                    status: 400,
                    message: 'payload_invalid'
                });
                return;
            }

            let response;
            try {
                response = await fetch(VERIFY_ENDPOINT, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify(payload)
                });
            } catch (error) {
                sendResponse({
                    ok: false,
                    status: 0,
                    message: String(error?.message || 'network_error')
                });
                return;
            }

            const status = Number(response.status || 0);
            const text = await response.text().catch(() => '');
            const json = safeParseJson(text);
            if (!response.ok) {
                sendResponse({
                    ok: false,
                    status,
                    text,
                    json,
                    message: `HTTP ${status}`
                });
                return;
            }

            sendResponse({
                ok: true,
                status,
                ...(json ? { json } : { text })
            });
        })();

        return true;
    });
})();
