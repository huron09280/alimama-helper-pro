import { spawnSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT, 'dist');
const PACKAGES_DIR = path.join(DIST_DIR, 'packages');
const KEYS_DIR = path.join(ROOT, '.keys');
const require = createRequire(import.meta.url);
const crx3 = require('crx3');

const ensureExists = async (target, label) => {
    try {
        await fs.access(target);
    } catch {
        throw new Error(`Missing ${label}: ${target}. Run \`npm run build\` first.`);
    }
};

const zipDirectory = (sourceDir, outputFile) => {
    const result = spawnSync('zip', ['-qr', outputFile, '.'], {
        cwd: sourceDir,
        stdio: 'inherit'
    });

    if (result.error) {
        throw result.error;
    }
    if (result.status !== 0) {
        throw new Error(`zip command failed for ${outputFile}`);
    }
};

const main = async () => {
    const chromeDir = path.join(DIST_DIR, 'extension/chrome');
    const firefoxDir = path.join(DIST_DIR, 'extension/firefox');
    const userScriptPath = path.join(DIST_DIR, 'userscript/alimama-helper-pro.user.js');
    const metaPath = path.join(DIST_DIR, 'userscript/alimama-helper-pro.meta.js');

    await Promise.all([
        ensureExists(chromeDir, 'chrome extension output'),
        ensureExists(firefoxDir, 'firefox extension output'),
        ensureExists(userScriptPath, 'userscript output'),
        ensureExists(metaPath, 'userscript meta output')
    ]);

    await fs.rm(PACKAGES_DIR, { recursive: true, force: true });
    await fs.mkdir(PACKAGES_DIR, { recursive: true });
    await fs.mkdir(KEYS_DIR, { recursive: true });

    const chromeZip = path.join(PACKAGES_DIR, 'alimama-helper-pro-chrome.zip');
    const edgeZip = path.join(PACKAGES_DIR, 'alimama-helper-pro-edge.zip');
    const firefoxXpi = path.join(PACKAGES_DIR, 'alimama-helper-pro-firefox.xpi');
    const chromeCrx = path.join(PACKAGES_DIR, 'alimama-helper-pro.crx');
    const chromeCrxKeyPath = process.env.CHROME_CRX_KEY_PATH || path.join(KEYS_DIR, 'alimama-helper-pro.pem');

    zipDirectory(chromeDir, chromeZip);
    await fs.copyFile(chromeZip, edgeZip);
    zipDirectory(firefoxDir, firefoxXpi);

    await crx3([path.join(chromeDir, 'manifest.json')], {
        keyPath: chromeCrxKeyPath,
        crxPath: chromeCrx
    });

    await Promise.all([
        fs.copyFile(userScriptPath, path.join(PACKAGES_DIR, 'alimama-helper-pro.user.js')),
        fs.copyFile(metaPath, path.join(PACKAGES_DIR, 'alimama-helper-pro.meta.js'))
    ]);

    console.log('[package] built:');
    console.log(`  - ${chromeZip}`);
    console.log(`  - ${edgeZip}`);
    console.log(`  - ${firefoxXpi}`);
    console.log(`  - ${chromeCrx}`);
    console.log(`  - ${path.join(PACKAGES_DIR, 'alimama-helper-pro.user.js')}`);
    console.log(`  - ${path.join(PACKAGES_DIR, 'alimama-helper-pro.meta.js')}`);
    console.log(`[package] crx key: ${chromeCrxKeyPath}`);
};

main().catch((error) => {
    console.error('[package] failed:', error);
    process.exitCode = 1;
});
