import { promises as fs } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

const requiredEnv = [
    'CHROME_EXTENSION_ID',
    'CHROME_CLIENT_ID',
    'CHROME_CLIENT_SECRET',
    'CHROME_REFRESH_TOKEN'
];

for (const key of requiredEnv) {
    if (!process.env[key]) {
        throw new Error(`Missing required env: ${key}`);
    }
}

const extensionId = process.env.CHROME_EXTENSION_ID;
const zipPath = process.env.CHROME_ZIP || path.join(ROOT, 'dist/packages/alimama-helper-pro-chrome.zip');

const getAccessToken = async () => {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            client_id: process.env.CHROME_CLIENT_ID,
            client_secret: process.env.CHROME_CLIENT_SECRET,
            refresh_token: process.env.CHROME_REFRESH_TOKEN,
            grant_type: 'refresh_token'
        })
    });

    const tokenJson = await tokenRes.json().catch(() => ({}));
    if (!tokenRes.ok || !tokenJson.access_token) {
        throw new Error(`Failed to get Google access token: ${tokenRes.status} ${JSON.stringify(tokenJson)}`);
    }

    return tokenJson.access_token;
};

const main = async () => {
    const accessToken = await getAccessToken();
    const zipBuffer = await fs.readFile(zipPath);

    const uploadRes = await fetch(`https://www.googleapis.com/upload/chromewebstore/v1.1/items/${extensionId}`, {
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/octet-stream'
        },
        body: zipBuffer
    });

    const uploadJson = await uploadRes.json().catch(() => ({}));
    if (!uploadRes.ok) {
        throw new Error(`Chrome upload failed: ${uploadRes.status} ${JSON.stringify(uploadJson)}`);
    }
    if (uploadJson.uploadState && uploadJson.uploadState !== 'SUCCESS') {
        throw new Error(`Chrome uploadState is not SUCCESS: ${JSON.stringify(uploadJson)}`);
    }

    let publishRes = await fetch(`https://www.googleapis.com/chromewebstore/v1.1/items/${extensionId}/publish?publishTarget=default`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    });

    let publishJson = await publishRes.json().catch(() => ({}));
    if (!publishRes.ok) {
        publishRes = await fetch(`https://www.googleapis.com/chromewebstore/v1.1/items/${extensionId}/publish?target=default`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });
        publishJson = await publishRes.json().catch(() => ({}));
    }
    if (!publishRes.ok) {
        throw new Error(`Chrome publish failed: ${publishRes.status} ${JSON.stringify(publishJson)}`);
    }

    console.log('[publish-chrome] upload and publish completed', publishJson);
};

main().catch((error) => {
    console.error('[publish-chrome] failed:', error);
    process.exitCode = 1;
});
