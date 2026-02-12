import { execSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT, 'dist');

const readText = (target) => fs.readFile(target, 'utf8');
const writeText = async (target, content) => {
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, content, 'utf8');
};
const copyFile = async (source, target) => {
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.copyFile(source, target);
};

const replaceVersionToken = (content, version) => content.replace(/__AM_VERSION__/g, version);

const toRepoSlug = (remoteUrl) => {
    if (!remoteUrl) return null;
    const normalized = remoteUrl.trim();

    const sshMatch = normalized.match(/^git@github\.com:([^/]+)\/([^/]+?)(\.git)?$/i);
    if (sshMatch) return `${sshMatch[1]}/${sshMatch[2]}`;

    const httpsMatch = normalized.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+?)(\.git)?$/i);
    if (httpsMatch) return `${httpsMatch[1]}/${httpsMatch[2]}`;

    return null;
};

const detectRepoSlug = () => {
    if (process.env.GITHUB_REPOSITORY) return process.env.GITHUB_REPOSITORY;

    try {
        const remoteUrl = execSync('git remote get-url origin', {
            cwd: ROOT,
            stdio: ['ignore', 'pipe', 'ignore'],
            encoding: 'utf8'
        });
        return toRepoSlug(remoteUrl) || 'owner/repo';
    } catch {
        return 'owner/repo';
    }
};

const applyTemplate = (template, mappings) => {
    let output = template;
    for (const [key, value] of Object.entries(mappings)) {
        const token = new RegExp(`{{${key}}}`, 'g');
        output = output.replace(token, value);
    }
    return output;
};

const build = async () => {
    const packageJsonPath = path.join(ROOT, 'package.json');
    const pkg = JSON.parse(await readText(packageJsonPath));
    const version = pkg.version;
    const repoSlug = detectRepoSlug();

    const downloadUrl = `https://github.com/${repoSlug}/releases/latest/download/alimama-helper-pro.user.js`;
    const updateUrl = `https://github.com/${repoSlug}/releases/latest/download/alimama-helper-pro.meta.js`;

    await fs.rm(DIST_DIR, { recursive: true, force: true });
    await fs.mkdir(DIST_DIR, { recursive: true });

    const coreSourcePath = path.join(ROOT, 'src/core/alimama-helper-core.js');
    const gmShimSourcePath = path.join(ROOT, 'src/platform/gm-shim.js');
    const injectorSourcePath = path.join(ROOT, 'extension/common/content-injector.js');
    const iconSourceDir = path.join(ROOT, 'extension/common/icons');
    const userHeaderPath = path.join(ROOT, 'src/userscript/header.template.txt');

    const [coreSourceRaw, gmShimRaw, injectorRaw, userHeaderRaw] = await Promise.all([
        readText(coreSourcePath),
        readText(gmShimSourcePath),
        readText(injectorSourcePath),
        readText(userHeaderPath)
    ]);

    const coreSource = replaceVersionToken(coreSourceRaw, version);
    const gmShim = replaceVersionToken(gmShimRaw, version);

    const chromeManifestTemplate = await readText(path.join(ROOT, 'extension/chrome/manifest.json'));
    const firefoxManifestTemplate = await readText(path.join(ROOT, 'extension/firefox/manifest.json'));

    const chromeManifest = replaceVersionToken(chromeManifestTemplate, version);
    const firefoxManifest = replaceVersionToken(firefoxManifestTemplate, version);

    const userHeader = applyTemplate(userHeaderRaw, {
        VERSION: version,
        DOWNLOAD_URL: downloadUrl,
        UPDATE_URL: updateUrl
    });

    const userScriptBundle = `${userHeader}\n\n${coreSource}\n`;

    const distChromeDir = path.join(DIST_DIR, 'extension/chrome');
    const distFirefoxDir = path.join(DIST_DIR, 'extension/firefox');
    const iconFiles = ['icon-16.png', 'icon-32.png', 'icon-48.png', 'icon-128.png'];

    await Promise.all([
        writeText(path.join(distChromeDir, 'manifest.json'), chromeManifest),
        writeText(path.join(distChromeDir, 'content-injector.js'), injectorRaw),
        writeText(path.join(distChromeDir, 'scripts/gm-shim.js'), gmShim),
        writeText(path.join(distChromeDir, 'scripts/alimama-helper-core.js'), coreSource),

        writeText(path.join(distFirefoxDir, 'manifest.json'), firefoxManifest),
        writeText(path.join(distFirefoxDir, 'content-injector.js'), injectorRaw),
        writeText(path.join(distFirefoxDir, 'scripts/gm-shim.js'), gmShim),
        writeText(path.join(distFirefoxDir, 'scripts/alimama-helper-core.js'), coreSource),

        writeText(path.join(DIST_DIR, 'userscript/alimama-helper-pro.user.js'), userScriptBundle),
        writeText(path.join(DIST_DIR, 'userscript/alimama-helper-pro.meta.js'), `${userHeader}\n`)
    ]);

    for (const iconFile of iconFiles) {
        await Promise.all([
            copyFile(path.join(iconSourceDir, iconFile), path.join(distChromeDir, 'icons', iconFile)),
            copyFile(path.join(iconSourceDir, iconFile), path.join(distFirefoxDir, 'icons', iconFile))
        ]);
    }

    console.log(`[build] version=${version}`);
    console.log(`[build] repo=${repoSlug}`);
    console.log('[build] generated dist/extension/{chrome,firefox} and dist/userscript outputs');
};

build().catch((error) => {
    console.error('[build] failed:', error);
    process.exitCode = 1;
});
