import { readFileSync, writeFileSync, mkdirSync, existsSync, watch, readdirSync, copyFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const ROOT_DIR = path.resolve(__dirname, '..');
export const ROOT_SCRIPT_FILE = '阿里妈妈多合一助手.js';
export const DIST_DIR = path.join(ROOT_DIR, 'dist');
export const PACKAGE_DIR = path.join(DIST_DIR, 'packages');
export const EXTENSION_DIR = path.join(DIST_DIR, 'extension');
export const EXTENSION_ICON_DIR = path.join(ROOT_DIR, 'src', 'entries', 'extension-icons');
export const EXTENSION_ICON_FILES = ['icon-16.png', 'icon-32.png', 'icon-48.png', 'icon-128.png'];
const USERSCRIPT_UPDATE_URL = 'https://github.com/huron09280/alimama-helper-pro/releases/latest/download/alimama-helper-pro.meta.js';
const USERSCRIPT_DOWNLOAD_URL = 'https://github.com/huron09280/alimama-helper-pro/releases/latest/download/alimama-helper-pro.user.js';

export const KEYWORD_PLAN_API_SEGMENTS = [
    'src/optimizer/keyword-plan-api/intro.js',
    'src/optimizer/keyword-plan-api/runtime.js',
    'src/optimizer/keyword-plan-api/scene-spec.js',
    'src/optimizer/keyword-plan-api/network-capture-lifecycle.js',
    'src/optimizer/keyword-plan-api/component-config.js',
    'src/optimizer/keyword-plan-api/search-and-draft.js',
    'src/optimizer/keyword-plan-api/create-and-suggest.js',
    'src/optimizer/keyword-plan-api/wizard-style-and-state/style.js',
    'src/optimizer/keyword-plan-api/wizard-style-and-state/defaults-and-presets.js',
    'src/optimizer/keyword-plan-api/wizard-style-and-state/matrix-scene-fields.js',
    'src/optimizer/keyword-plan-api/wizard-style-and-state/matrix-generic-editors.js',
    'src/optimizer/keyword-plan-api/wizard-style-and-state/matrix-bid-package.js',
    'src/optimizer/keyword-plan-api/wizard-style-and-state/matrix-config.js',
    'src/optimizer/keyword-plan-api/matrix.js',
    'src/optimizer/keyword-plan-api/wizard-mount-intro.js',
    'src/optimizer/keyword-plan-api/wizard-scene-config/render-scene-dynamic-core.js',
    'src/optimizer/keyword-plan-api/wizard-scene-config/render-scene-dynamic-grid.js',
    'src/optimizer/keyword-plan-api/wizard-scene-config/render-scene-dynamic-advanced-popup.js',
    'src/optimizer/keyword-plan-api/wizard-scene-config/render-scene-dynamic-item-adzone-popup.js',
    'src/optimizer/keyword-plan-api/wizard-scene-config/render-scene-dynamic-crowd-popup.js',
    'src/optimizer/keyword-plan-api/wizard-scene-config/manual-keywords-and-detail.js',
    'src/optimizer/keyword-plan-api/wizard-scene-config/batch-edit-popup.js',
    'src/optimizer/keyword-plan-api/wizard-scene-config/strategy-state-and-draft.js',
    'src/optimizer/keyword-plan-api/wizard-scene-config/item-selection.js',
    'src/optimizer/keyword-plan-api/request-builder-preview.js',
    'src/optimizer/keyword-plan-api/wizard-open-and-create.js',
    'src/optimizer/keyword-plan-api/repair.js',
    'src/optimizer/keyword-plan-api/exports.js'
];

export const PRE_KEYWORD_SEGMENTS = [
    'src/shared/script-preamble.js',
    'src/main-assistant/bootstrap.js',
    'src/main-assistant/logger.js',
    'src/main-assistant/core.js',
    'src/main-assistant/ui.js',
    'src/main-assistant/budget-frontend-limit-bypass.js',
    'src/main-assistant/interceptor.js',
    'src/main-assistant/magic-report.js',
    'src/main-assistant/campaign-id-quick-entry.js',
    'src/main-assistant/potential-plan-daily-exporter.js',
    'src/main-assistant/main.js',
    'src/optimizer/bootstrap.js',
    'src/optimizer/token-manager.js',
    'src/optimizer/api.js'
];

export const POST_KEYWORD_SEGMENTS = [
    'src/optimizer/ui.js',
    'src/optimizer/core.js',
    'src/optimizer/bridge.js',
    'src/optimizer/public-api.js'
];

export const CORE_RUNTIME_SEGMENTS = [
    ...PRE_KEYWORD_SEGMENTS,
    ...KEYWORD_PLAN_API_SEGMENTS,
    ...POST_KEYWORD_SEGMENTS
];

export const USERSCRIPT_SEGMENTS = [
    'src/entries/userscript-meta.js',
    ...CORE_RUNTIME_SEGMENTS
];

export const EXTENSION_PAGE_RUNTIME_SEGMENTS = [
    'src/shared/script-preamble.js',
    'src/entries/extension-license-guard.js',
    ...CORE_RUNTIME_SEGMENTS.filter((relativePath) => relativePath !== 'src/shared/script-preamble.js')
];

export const EXTENSION_PAGE_SEGMENTS = [
    'src/entries/extension-page-compat.js',
    ...EXTENSION_PAGE_RUNTIME_SEGMENTS
];

export const WATCH_DIRS = [
    path.join(ROOT_DIR, 'src'),
    path.join(ROOT_DIR, 'scripts')
];

export const KEYWORD_PLAN_API_SEGMENT_ROOT = 'src/optimizer/keyword-plan-api';

const readText = (relativePath) => readFileSync(path.join(ROOT_DIR, relativePath), 'utf8');
const ensureDir = (dir) => mkdirSync(dir, { recursive: true });
const normalizeTrailingNewline = (text) => (text.endsWith('\n') ? text : `${text}\n`);
const toPosixRelativePath = (absolutePath) => path.relative(ROOT_DIR, absolutePath).split(path.sep).join('/');

const collectJsFilesRecursively = (absoluteDir) => {
    const stack = [absoluteDir];
    const files = [];
    while (stack.length) {
        const current = stack.pop();
        const entries = readdirSync(current, { withFileTypes: true });
        entries.forEach((entry) => {
            const nextPath = path.join(current, entry.name);
            if (entry.isDirectory()) {
                stack.push(nextPath);
                return;
            }
            if (entry.isFile() && entry.name.endsWith('.js')) {
                files.push(toPosixRelativePath(nextPath));
            }
        });
    }
    return files.sort();
};

export const listKeywordPlanApiSegmentFiles = () => (
    collectJsFilesRecursively(path.join(ROOT_DIR, KEYWORD_PLAN_API_SEGMENT_ROOT))
);

export const findMissingKeywordPlanApiSegments = () => {
    const listedSegments = new Set(KEYWORD_PLAN_API_SEGMENTS);
    return listKeywordPlanApiSegmentFiles().filter((relativePath) => !listedSegments.has(relativePath));
};

export const assertKeywordPlanApiSegmentCoverage = () => {
    const missingSegments = findMissingKeywordPlanApiSegments();
    if (missingSegments.length) {
        throw new Error(
            [
                'keyword-plan-api 新增文件未加入 KEYWORD_PLAN_API_SEGMENTS：',
                ...missingSegments.map((relativePath) => `- ${relativePath}`)
            ].join('\n')
        );
    }
};

const replaceTemplateTokens = (text, tokens = {}) => {
    let output = String(text || '');
    Object.entries(tokens).forEach(([key, value]) => {
        output = output.split(`__${key}__`).join(String(value));
    });
    return output;
};

export const renderUserscriptSource = () => USERSCRIPT_SEGMENTS.map(readText).join('');

export const extractVersion = (source = '') => {
    const match = String(source || '').match(/^\/\/ @version\s+([0-9]+(?:\.[0-9]+)*)/m);
    if (!match) {
        throw new Error('无法从 userscript 头部解析版本号');
    }
    return match[1];
};

export const renderMetaSource = (userscriptSource) => {
    const headerStart = userscriptSource.indexOf('// ==UserScript==');
    const headerEnd = userscriptSource.indexOf('// ==/UserScript==');
    if (headerStart === -1 || headerEnd === -1 || headerEnd < headerStart) {
        throw new Error('无法解析 UserScript 头部');
    }

    const endMarker = '// ==/UserScript==';
    let meta = userscriptSource.slice(headerStart, headerEnd + endMarker.length);
    if (!/@updateURL\b/.test(meta)) {
        meta = meta.replace(endMarker, `// @updateURL    ${USERSCRIPT_UPDATE_URL}\n${endMarker}`);
    }
    if (!/@downloadURL\b/.test(meta)) {
        meta = meta.replace(endMarker, `// @downloadURL  ${USERSCRIPT_DOWNLOAD_URL}\n${endMarker}`);
    }
    return normalizeTrailingNewline(meta);
};

export const renderExtensionManifest = (version) => {
    const manifest = {
        manifest_version: 3,
        name: '阿里妈妈多合一助手 (Pro版)',
        version,
        description: '阿里妈妈投放平台增强工具，支持主面板、万能查数、算法护航与计划辅助能力。',
        icons: {
            16: 'icon-16.png',
            32: 'icon-32.png',
            48: 'icon-48.png',
            128: 'icon-128.png'
        },
        action: {
            default_title: '阿里妈妈多合一助手 (Pro版)',
            default_icon: {
                16: 'icon-16.png',
                32: 'icon-32.png',
                48: 'icon-48.png'
            }
        },
        content_scripts: [
            {
                matches: [
                    '*://alimama.com/*',
                    '*://*.alimama.com/*',
                    'https://one.alimama.com/*'
                ],
                js: ['content.js'],
                run_at: 'document_start'
            }
        ],
        web_accessible_resources: [
            {
                resources: ['page.bundle.js'],
                matches: [
                    '*://alimama.com/*',
                    '*://*.alimama.com/*',
                    'https://one.alimama.com/*'
                ]
            }
        ]
    };
    return `${JSON.stringify(manifest, null, 4)}\n`;
};

export const renderExtensionContent = () => readText('src/entries/extension-content.js');

export const renderExtensionPageBundle = (version) => EXTENSION_PAGE_SEGMENTS
    .map((relativePath) => replaceTemplateTokens(readText(relativePath), { AM_EXTENSION_VERSION: JSON.stringify(version) }))
    .join('');

export const renderBuildOutputs = () => {
    assertKeywordPlanApiSegmentCoverage();
    const userscriptSource = renderUserscriptSource();
    const version = extractVersion(userscriptSource);
    return {
        version,
        userscriptSource,
        metaSource: renderMetaSource(userscriptSource),
        extensionFiles: {
            'manifest.json': renderExtensionManifest(version),
            'content.js': renderExtensionContent(),
            'page.bundle.js': renderExtensionPageBundle(version)
        }
    };
};

const readExisting = (absolutePath) => (existsSync(absolutePath) ? readFileSync(absolutePath, 'utf8') : null);

export const checkBuildOutputs = () => {
    const outputs = renderBuildOutputs();
    const rootScriptPath = path.join(ROOT_DIR, ROOT_SCRIPT_FILE);
    const currentRoot = readExisting(rootScriptPath);
    if (currentRoot !== outputs.userscriptSource) {
        throw new Error(`根文件未与 src 同步，请先运行 node scripts/build.mjs: ${ROOT_SCRIPT_FILE}`);
    }

    const extensionBundle = outputs.extensionFiles['page.bundle.js'];
    if (!extensionBundle.includes('__ALIMAMA_OPTIMIZER_TOGGLE__')) {
        throw new Error('extension page bundle 缺少关键桥接: __ALIMAMA_OPTIMIZER_TOGGLE__');
    }
    if (!extensionBundle.includes('GM_getValue')) {
        throw new Error('extension page bundle 缺少 GM 兼容层');
    }

    EXTENSION_ICON_FILES.forEach((filename) => {
        if (!existsSync(path.join(EXTENSION_ICON_DIR, filename))) {
            throw new Error(`extension icon 文件缺失: src/entries/extension-icons/${filename}`);
        }
    });

    return outputs;
};

export const writeBuildOutputs = () => {
    const outputs = renderBuildOutputs();
    ensureDir(PACKAGE_DIR);
    ensureDir(EXTENSION_DIR);

    writeFileSync(path.join(ROOT_DIR, ROOT_SCRIPT_FILE), outputs.userscriptSource, 'utf8');
    writeFileSync(path.join(PACKAGE_DIR, 'alimama-helper-pro.user.js'), outputs.userscriptSource, 'utf8');
    writeFileSync(path.join(PACKAGE_DIR, 'alimama-helper-pro.meta.js'), outputs.metaSource, 'utf8');

    Object.entries(outputs.extensionFiles).forEach(([filename, content]) => {
        writeFileSync(path.join(EXTENSION_DIR, filename), content, 'utf8');
    });

    EXTENSION_ICON_FILES.forEach((filename) => {
        copyFileSync(path.join(EXTENSION_ICON_DIR, filename), path.join(EXTENSION_DIR, filename));
    });

    return outputs;
};

const printSummary = (outputs, mode = 'build') => {
    console.log(`[build] mode=${mode}`);
    console.log(`[build] version=${outputs.version}`);
    console.log(`[build] root=${ROOT_SCRIPT_FILE}`);
    console.log('[build] packages=dist/packages/alimama-helper-pro.user.js, dist/packages/alimama-helper-pro.meta.js');
    console.log('[build] extension=dist/extension/manifest.json, dist/extension/content.js, dist/extension/page.bundle.js, dist/extension/icon-16.png, dist/extension/icon-32.png, dist/extension/icon-48.png, dist/extension/icon-128.png');
};

const runWatch = () => {
    let timer = null;
    const trigger = () => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
            try {
                const outputs = writeBuildOutputs();
                printSummary(outputs, 'watch');
            } catch (error) {
                console.error('[build] watch rebuild failed');
                console.error(error?.stack || error?.message || String(error));
            }
        }, 120);
    };

    const watchers = WATCH_DIRS.map((dir) => watch(dir, { recursive: true }, trigger));
    const outputs = writeBuildOutputs();
    printSummary(outputs, 'watch');
    console.log('[build] watching src/ and scripts/ ...');

    const cleanup = () => {
        watchers.forEach((watcher) => watcher.close());
        process.exit(0);
    };
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
};

const isCliEntry = () => {
    const argvPath = process.argv[1];
    return argvPath ? import.meta.url === pathToFileURL(path.resolve(argvPath)).href : false;
};

if (isCliEntry()) {
    const args = new Set(process.argv.slice(2));
    try {
        if (args.has('--check')) {
            const outputs = checkBuildOutputs();
            printSummary(outputs, 'check');
        } else if (args.has('--watch')) {
            runWatch();
        } else {
            const outputs = writeBuildOutputs();
            printSummary(outputs, 'build');
        }
    } catch (error) {
        console.error('[build] failed');
        console.error(error?.stack || error?.message || String(error));
        process.exitCode = 1;
    }
}
