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
export const WIZARD_STYLE_SEGMENT = 'src/optimizer/keyword-plan-api/wizard-style-and-state/style.js';
export const EXTENSION_WIZARD_STYLE_FILE = 'wizard-style.css';
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
    WIZARD_STYLE_SEGMENT,
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
    ...PRE_KEYWORD_SEGMENTS.filter((relativePath) => relativePath !== 'src/shared/script-preamble.js'),
    ...KEYWORD_PLAN_API_SEGMENTS,
    ...POST_KEYWORD_SEGMENTS
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

const WIZARD_STYLE_FUNCTION_PATTERN = /        const ensureWizardStyle = \(\) => \{[\s\S]*?\n        \};/;

export const extractWizardStyleCss = () => {
    const source = readText(WIZARD_STYLE_SEGMENT);
    const match = source.match(/style\.textContent = `([\s\S]*?)`;\n\s*document\.head\.appendChild\(style\);/);
    if (!match) {
        throw new Error(`无法从 ${WIZARD_STYLE_SEGMENT} 提取组建计划样式`);
    }
    return normalizeTrailingNewline(
        String(match[1] || '')
            .replace(/^\n/, '')
            .replace(/\n\s*$/, '\n')
            .split('\n')
            .map((line) => (line.startsWith('                ') ? line.slice(16) : line))
            .join('\n')
            .trimEnd()
    );
};

export const renderExtensionWizardStyleLoader = () => `        const ensureWizardStyle = () => {
            const readyPromiseKey = '__AM_WXT_WIZARD_STYLE_READY_PROMISE__';
            if (window[readyPromiseKey]) return window[readyPromiseKey];
            const existingStyleNode = document.getElementById('am-wxt-keyword-style');
            if (existingStyleNode) {
                const existingTagName = String(existingStyleNode.tagName || '').toUpperCase();
                const existingStyleText = String(existingStyleNode.textContent || '');
                const compactStyleText = existingStyleText.replace(/\\s+/g, '');
                const isLegacyInlineBlocker = existingTagName !== 'LINK'
                    && compactStyleText === '#am-wxt-keyword-overlay{display:none!important;}';
                if (existingTagName === 'LINK' && existingStyleNode.dataset?.amHelperFullStyleLoaded === '1') {
                    window[readyPromiseKey] = Promise.resolve({ ok: true, source: 'external-existing' });
                    return window[readyPromiseKey];
                }
                if (isLegacyInlineBlocker) {
                    existingStyleNode.remove();
                } else if (existingTagName !== 'LINK' && existingStyleText.includes('#am-wxt-keyword-overlay') && existingStyleText.length > 200000) {
                    window[readyPromiseKey] = Promise.resolve({ ok: true, source: 'inline-existing' });
                    return window[readyPromiseKey];
                } else if (existingTagName === 'LINK' && existingStyleNode.dataset?.amHelperExternalStyle === '1') {
                    existingStyleNode.remove();
                }
            }
            if (document.querySelector('link#am-wxt-keyword-style[data-am-helper-full-style-loaded="1"]')) {
                window[readyPromiseKey] = Promise.resolve({ ok: true, source: 'external-existing' });
                return window[readyPromiseKey];
            }
            if (!document.getElementById('am-wxt-keyword-critical-style')) {
                const critical = document.createElement('style');
                critical.id = 'am-wxt-keyword-critical-style';
                critical.textContent = [
                    '#am-wxt-keyword-overlay{position:fixed;inset:0;z-index:1000006;display:none;align-items:center;justify-content:center;overscroll-behavior:contain;}',
                    '#am-wxt-keyword-overlay.open{display:flex;}',
                    '#am-wxt-keyword-modal{width:min(1160px,96vw);max-height:92vh;display:flex;flex-direction:column;overflow:hidden;position:relative;z-index:1000008;background:#f7f8fc;border:1px solid rgba(69,84,229,0.2);border-radius:14px;box-shadow:0 16px 42px rgba(17,24,39,0.28);font-family:PingFangSC-Regular,PingFang SC,"Microsoft Yahei","SimHei",sans-serif;color:#1f2937;}',
                    '#am-wxt-keyword-modal .hidden,#am-wxt-keyword-modal .collapsed{display:none!important;}',
                    '#am-wxt-keyword-modal .am-wxt-header{height:48px;padding:0 16px;display:flex;align-items:center;justify-content:space-between;background:linear-gradient(135deg,#eef2ff,#f8f9ff);border-bottom:1px solid rgba(69,84,229,0.18);font-weight:600;}',
                    '#am-wxt-keyword-modal .am-wxt-title{margin:0;font-size:15px;font-weight:650;color:#1f2937;}',
                    '#am-wxt-keyword-modal .am-wxt-close{border:0;background:transparent!important;color:#4b5563;cursor:pointer;width:32px;height:32px;padding:0;display:inline-flex;align-items:center;justify-content:center;border-radius:8px;}',
                    '#am-wxt-keyword-overlay[data-style-load-failed="1"] #am-wxt-keyword-modal .am-wxt-workbench-tabs,#am-wxt-keyword-overlay[data-style-load-failed="1"] #am-wxt-keyword-modal .am-wxt-body{display:none!important;}',
                    '#am-wxt-keyword-overlay[data-style-load-failed="1"] #am-wxt-keyword-modal::after{content:"组建计划样式加载失败，请刷新页面或重新加载扩展。";display:block;padding:24px 28px;font-size:13px;line-height:1.7;color:#7f1d1d;background:rgba(255,255,255,0.72);}'
                ].join('');
                document.head.appendChild(critical);
            }
            const runtime = window.__AM_PLATFORM_RUNTIME__ || {};
            const baseUrl = String(runtime.resourceBaseUrl || window.__AM_EXTENSION_RESOURCE_BASE_URL__ || '').trim();
            if (!baseUrl) {
                const critical = document.getElementById('am-wxt-keyword-critical-style');
                if (critical) critical.dataset.amHelperFullStyleFailed = 'extension_resource_base_url_missing';
                window[readyPromiseKey] = Promise.resolve({ ok: false, reason: 'extension_resource_base_url_missing' });
                return window[readyPromiseKey];
            }
            const link = document.createElement('link');
            link.id = 'am-wxt-keyword-style';
            link.rel = 'stylesheet';
            link.href = new URL('${EXTENSION_WIZARD_STYLE_FILE}', baseUrl).href;
            link.dataset.amHelperExternalStyle = '1';
            let loadTimeoutId = 0;
            window[readyPromiseKey] = new Promise((resolve) => {
                let settled = false;
                const settle = (result) => {
                    if (settled) return;
                    settled = true;
                    resolve(result);
                };
                loadTimeoutId = setTimeout(() => {
                    const critical = document.getElementById('am-wxt-keyword-critical-style');
                    if (critical) critical.dataset.amHelperFullStyleFailed = 'wizard_style_load_timeout';
                    settle({ ok: false, reason: 'wizard_style_load_timeout' });
                }, 1600);
                link.onload = () => {
                    clearTimeout(loadTimeoutId);
                    link.dataset.amHelperFullStyleLoaded = '1';
                    const critical = document.getElementById('am-wxt-keyword-critical-style');
                    if (critical) critical.dataset.amHelperFullStyleLoaded = '1';
                    const overlay = document.getElementById('am-wxt-keyword-overlay');
                    if (overlay?.dataset) {
                        delete overlay.dataset.styleLoading;
                        delete overlay.dataset.styleLoadFailed;
                        delete overlay.dataset.styleLoadReason;
                    }
                    window[readyPromiseKey] = Promise.resolve({ ok: true, source: settled ? 'external-late' : 'external' });
                    settle({ ok: true, source: 'external' });
                };
                link.onerror = () => {
                    clearTimeout(loadTimeoutId);
                    link.remove();
                    const critical = document.getElementById('am-wxt-keyword-critical-style');
                    if (critical) critical.dataset.amHelperFullStyleFailed = 'wizard_style_load_failed';
                    settle({ ok: false, reason: 'wizard_style_load_failed' });
                };
            });
            document.head.appendChild(link);
            wizardState.styleCleanupHandlers = Array.isArray(wizardState.styleCleanupHandlers) ? wizardState.styleCleanupHandlers : [];
            wizardState.styleCleanupHandlers.push(() => {
                clearTimeout(loadTimeoutId);
                link.onload = null;
                link.onerror = null;
                if (link.parentNode) link.parentNode.removeChild(link);
                const critical = document.getElementById('am-wxt-keyword-critical-style');
                if (critical?.parentNode) {
                    critical.parentNode.removeChild(critical);
                }
                if (window[readyPromiseKey]) {
                    try {
                        delete window[readyPromiseKey];
                    } catch {
                        window[readyPromiseKey] = null;
                    }
                }
            });
            return window[readyPromiseKey];
        };`;

export const renderExtensionSegment = (relativePath, version) => {
    const source = replaceTemplateTokens(readText(relativePath), { AM_EXTENSION_VERSION: JSON.stringify(version) });
    if (relativePath !== WIZARD_STYLE_SEGMENT) return source;
    if (!WIZARD_STYLE_FUNCTION_PATTERN.test(source)) {
        throw new Error(`无法替换 extension 组建计划样式加载器: ${relativePath}`);
    }
    return source.replace(WIZARD_STYLE_FUNCTION_PATTERN, renderExtensionWizardStyleLoader());
};

export const renderUserscriptSource = () => USERSCRIPT_SEGMENTS.map(readText).join('');

export const extractVersion = (source = '') => {
    const match = String(source || '').match(/^\/\/ @version\s+([0-9]+(?:\.[0-9]+)*)/m);
    if (!match) {
        throw new Error('无法从 userscript 头部解析版本号');
    }
    return match[1];
};

export const normalizeExtensionManifestVersion = (version) => {
    const parts = String(version || '').split('.');
    if (!parts.length || parts.length > 4 || parts.some((part) => !/^[0-9]+$/.test(part))) {
        throw new Error(`extension manifest version 格式不符合 Chrome 规则: ${version}`);
    }

    const normalizedParts = parts.map((part) => {
        const numericValue = Number.parseInt(part, 10);
        if (!Number.isInteger(numericValue) || numericValue < 0 || numericValue > 65535) {
            throw new Error(`extension manifest version 分段超出 Chrome 允许范围: ${version}`);
        }
        return String(numericValue);
    });

    if (normalizedParts.every((part) => part === '0')) {
        throw new Error(`extension manifest version 不能全为 0: ${version}`);
    }

    return normalizedParts.join('.');
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
    const manifestVersion = normalizeExtensionManifestVersion(version);
    const manifest = {
        manifest_version: 3,
        name: '阿里妈妈多合一助手 (Pro版)',
        version: manifestVersion,
        ...(manifestVersion !== version ? { version_name: version } : {}),
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
        background: {
            service_worker: 'background.js'
        },
        host_permissions: [
            'https://am-licee-server-mpbzozflkj.cn-hangzhou.fcapp.run/*'
        ],
        content_scripts: [
            {
                matches: [
                    '*://alimama.com/*',
                    '*://*.alimama.com/*',
                    'https://one.alimama.com/*',
                    'https://myseller.taobao.com/*'
                ],
                js: ['content.js'],
                run_at: 'document_start'
            }
        ],
        web_accessible_resources: [
            {
                resources: ['page.bundle.js', EXTENSION_WIZARD_STYLE_FILE],
                matches: [
                    '*://alimama.com/*',
                    '*://*.alimama.com/*',
                    'https://one.alimama.com/*',
                    'https://myseller.taobao.com/*'
                ]
            }
        ]
    };
    return `${JSON.stringify(manifest, null, 4)}\n`;
};

export const renderExtensionContent = () => readText('src/entries/extension-content.js');
export const renderExtensionBackground = () => readText('src/entries/extension-background.js');

export const renderExtensionPageBundle = (version) => EXTENSION_PAGE_SEGMENTS
    .map((relativePath) => renderExtensionSegment(relativePath, version))
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
            'background.js': renderExtensionBackground(),
            'page.bundle.js': renderExtensionPageBundle(version),
            [EXTENSION_WIZARD_STYLE_FILE]: extractWizardStyleCss()
        }
    };
};

const readExisting = (absolutePath) => (existsSync(absolutePath) ? readFileSync(absolutePath, 'utf8') : null);

export const listGeneratedTextOutputs = (outputs) => {
    if (!outputs || typeof outputs !== 'object') {
        throw new Error('listGeneratedTextOutputs requires renderBuildOutputs() result');
    }
    return [
        {
            relativePath: ROOT_SCRIPT_FILE,
            content: outputs.userscriptSource
        },
        {
            relativePath: 'dist/packages/alimama-helper-pro.user.js',
            content: outputs.userscriptSource
        },
        {
            relativePath: 'dist/packages/alimama-helper-pro.meta.js',
            content: outputs.metaSource
        },
        ...Object.entries(outputs.extensionFiles).map(([filename, content]) => ({
            relativePath: `dist/extension/${filename}`,
            content
        }))
    ];
};

const assertGeneratedTextOutputsSynced = (outputs) => {
    listGeneratedTextOutputs(outputs).forEach(({ relativePath, content }) => {
        const absolutePath = path.join(ROOT_DIR, relativePath);
        const current = readExisting(absolutePath);
        if (current !== content) {
            throw new Error(`构建文本产物未与 src 同步，请先运行 node scripts/build.mjs: ${relativePath}`);
        }
    });
};

const assertExtensionIconsSynced = () => {
    EXTENSION_ICON_FILES.forEach((filename) => {
        const sourcePath = path.join(EXTENSION_ICON_DIR, filename);
        const outputPath = path.join(EXTENSION_DIR, filename);
        if (!existsSync(sourcePath)) {
            throw new Error(`extension icon 文件缺失: src/entries/extension-icons/${filename}`);
        }
        if (!existsSync(outputPath)) {
            throw new Error(`extension icon 产物缺失，请先运行 node scripts/build.mjs: dist/extension/${filename}`);
        }
        const source = readFileSync(sourcePath);
        const output = readFileSync(outputPath);
        if (!source.equals(output)) {
            throw new Error(`extension icon 产物未与 src 同步，请先运行 node scripts/build.mjs: dist/extension/${filename}`);
        }
    });
};

export const checkBuildOutputs = () => {
    const outputs = renderBuildOutputs();
    assertGeneratedTextOutputsSynced(outputs);

    const extensionBundle = outputs.extensionFiles['page.bundle.js'];
    if (!extensionBundle.includes('__ALIMAMA_OPTIMIZER_TOGGLE__')) {
        throw new Error('extension page bundle 缺少关键桥接: __ALIMAMA_OPTIMIZER_TOGGLE__');
    }
    if (!extensionBundle.includes('GM_getValue')) {
        throw new Error('extension page bundle 缺少 GM 兼容层');
    }
    if (!extensionBundle.includes('const KeywordPlanApi = (() => {')) {
        throw new Error('extension page bundle 缺少完整 keyword-plan-api 主体，点击路径不应承担首次解析大包');
    }
    if (!outputs.extensionFiles['background.js']?.includes('AM_LICENSE_VERIFY_REQUEST')) {
        throw new Error('extension background 缺少授权 verify 桥');
    }
    if (!outputs.extensionFiles[EXTENSION_WIZARD_STYLE_FILE]?.includes('#am-wxt-keyword-overlay')) {
        throw new Error(`extension ${EXTENSION_WIZARD_STYLE_FILE} 缺少组建计划样式`);
    }

    assertExtensionIconsSynced();

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
    console.log('[build] extension=dist/extension/manifest.json, dist/extension/content.js, dist/extension/background.js, dist/extension/page.bundle.js, dist/extension/wizard-style.css, dist/extension/icon-16.png, dist/extension/icon-32.png, dist/extension/icon-48.png, dist/extension/icon-128.png');
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
