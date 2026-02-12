import { promises as fs } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

const requireEnv = (name) => {
    const value = process.env[name];
    if (!value) throw new Error(`Missing required env: ${name}`);
    return value;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getAuthHeaders = async () => {
    const productId = requireEnv('EDGE_PRODUCT_ID');
    const clientId = requireEnv('EDGE_CLIENT_ID');

    const apiKey = process.env.EDGE_API_KEY || process.env.EDGE_CLIENT_SECRET;
    if (apiKey) {
        return {
            productId,
            headers: {
                Authorization: `ApiKey ${apiKey}`,
                'X-ClientID': clientId
            },
            mode: 'api-key'
        };
    }

    const tenantId = requireEnv('EDGE_TENANT_ID');
    const clientSecret = requireEnv('EDGE_CLIENT_SECRET');

    const tokenRes = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: 'client_credentials',
            scope: 'https://api.addons.microsoftedge.microsoft.com/.default'
        })
    });

    const tokenJson = await tokenRes.json().catch(() => ({}));
    if (!tokenRes.ok || !tokenJson.access_token) {
        throw new Error(`Failed to get Edge access token: ${tokenRes.status} ${JSON.stringify(tokenJson)}`);
    }

    return {
        productId,
        headers: {
            Authorization: `Bearer ${tokenJson.access_token}`
        },
        mode: 'aad-bearer'
    };
};

const pollOperation = async (url, headers) => {
    const maxAttempts = Number(process.env.EDGE_POLL_MAX_ATTEMPTS || 20);
    const intervalMs = Number(process.env.EDGE_POLL_INTERVAL_MS || 5000);

    for (let i = 1; i <= maxAttempts; i += 1) {
        const res = await fetch(url, { headers });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            throw new Error(`Edge operation polling failed: ${res.status} ${JSON.stringify(data)}`);
        }

        const status = String(data.status || '').toLowerCase();
        if (status === 'succeeded') return data;
        if (status === 'failed') {
            throw new Error(`Edge package validation failed: ${JSON.stringify(data)}`);
        }

        if (i < maxAttempts) await sleep(intervalMs);
    }

    throw new Error(`Edge operation polling timeout after ${maxAttempts} attempts`);
};

const main = async () => {
    const zipPath = process.env.EDGE_ZIP || path.join(ROOT, 'dist/packages/alimama-helper-pro-edge.zip');
    const zipBuffer = await fs.readFile(zipPath);

    const { productId, headers, mode } = await getAuthHeaders();
    const apiBase = process.env.EDGE_API_BASE || 'https://api.addons.microsoftedge.microsoft.com';

    const uploadRes = await fetch(`${apiBase}/v1.1/products/${productId}/submissions/draft/package`, {
        method: 'POST',
        headers: {
            ...headers,
            'Content-Type': 'application/zip'
        },
        body: zipBuffer
    });

    const uploadData = await uploadRes.json().catch(() => ({}));
    if (!uploadRes.ok) {
        throw new Error(`Edge package upload failed: ${uploadRes.status} ${JSON.stringify(uploadData)}`);
    }

    const operationId = uploadData.id || uploadData.operationId;
    if (!operationId) {
        throw new Error(`Edge upload response missing operation id: ${JSON.stringify(uploadData)}`);
    }

    const operationUrl = `${apiBase}/v1.1/products/${productId}/submissions/draft/package/operations/${operationId}`;
    await pollOperation(operationUrl, headers);

    const submitRes = await fetch(`${apiBase}/v1.1/products/${productId}/submissions`, {
        method: 'POST',
        headers
    });

    const submitData = await submitRes.json().catch(() => ({}));
    if (!submitRes.ok) {
        throw new Error(`Edge submission failed: ${submitRes.status} ${JSON.stringify(submitData)}`);
    }

    console.log(`[publish-edge] submitted successfully in ${mode} mode`, submitData);
};

main().catch((error) => {
    console.error('[publish-edge] failed:', error);
    process.exitCode = 1;
});
