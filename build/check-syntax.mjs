import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const files = [
    'src/core/alimama-helper-core.js',
    'src/platform/gm-shim.js',
    'src/userscript/header.template.txt',
    'extension/common/content-injector.js',
    'build/build.mjs',
    'build/package.mjs',
    'build/check-syntax.mjs',
    'scripts/publish-chrome.mjs',
    'scripts/publish-edge.mjs',
    'scripts/publish-firefox.mjs'
];

let hasFailure = false;

for (const file of files) {
    if (!file.endsWith('.js') && !file.endsWith('.mjs')) continue;
    const absolutePath = path.join(ROOT, file);
    const result = spawnSync(process.execPath, ['--check', absolutePath], {
        stdio: 'inherit'
    });

    if (result.status !== 0) {
        hasFailure = true;
    }
}

if (hasFailure) {
    process.exitCode = 1;
    console.error('[check:syntax] failed');
} else {
    console.log('[check:syntax] all JavaScript files passed');
}
