import { spawnSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

const requireEnv = (name) => {
    const value = process.env[name];
    if (!value) throw new Error(`Missing required env: ${name}`);
    return value;
};

const main = async () => {
    const apiKey = requireEnv('FIREFOX_API_KEY');
    const apiSecret = requireEnv('FIREFOX_API_SECRET');

    const sourceDir = process.env.FIREFOX_SOURCE_DIR || path.join(ROOT, 'dist/extension/firefox');
    const artifactsDir = process.env.FIREFOX_ARTIFACTS_DIR || path.join(ROOT, 'dist/packages');
    const channel = process.env.FIREFOX_CHANNEL || 'listed';

    await fs.access(sourceDir);
    await fs.mkdir(artifactsDir, { recursive: true });

    const args = [
        '--yes',
        'web-ext@8.3.0',
        'sign',
        '--source-dir',
        sourceDir,
        '--artifacts-dir',
        artifactsDir,
        '--channel',
        channel,
        '--api-key',
        apiKey,
        '--api-secret',
        apiSecret
    ];

    if (process.env.FIREFOX_EXTENSION_ID) {
        args.push('--id', process.env.FIREFOX_EXTENSION_ID);
    }

    const result = spawnSync('npx', args, {
        stdio: 'inherit',
        env: process.env
    });

    if (result.error) throw result.error;
    if (result.status !== 0) {
        throw new Error(`web-ext sign failed with exit code ${result.status}`);
    }

    console.log('[publish-firefox] submitted successfully');
};

main().catch((error) => {
    console.error('[publish-firefox] failed:', error);
    process.exitCode = 1;
});
