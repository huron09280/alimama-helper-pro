        const normalizeSceneFieldKey = (label = '') => {
            const raw = String(label || '').trim();
            if (!raw) return 'field';
            // Keep explicit API paths for direct field passthrough.
            if (/^(campaign|adgroup)\./i.test(raw)) return raw.replace(/\s+/g, '');
            const normalized = raw
                .replace(/[^\u4e00-\u9fa5A-Za-z0-9]+/g, '_')
                .replace(/^_+|_+$/g, '');
            return normalized || 'field';
        };
        const isSceneLabelMatch = (left = '', right = '') => {
            const a = normalizeSceneLabelToken(left);
            const b = normalizeSceneLabelToken(right);
            if (!a || !b) return false;
            return a === b || a.includes(b) || b.includes(a);
        };
        const isLikelySceneOptionValue = (text = '') => {
            const value = normalizeSceneOptionText(text);
            if (!value) return false;
            if (value.length < 1 || value.length > 22) return false;
            if (SCENE_SKIP_TEXT_RE.test(value)) return false;
            if (SCENE_LABEL_NOISE_RE.test(value) || value.includes('·')) return false;
            if (/^\d+(?:[./-]\d+)?$/.test(value)) return false;
            if (/^\d+\s*[.)、]/.test(value)) return false;
            if (SCENE_OPTION_NOISE_RE.test(value)) return false;
            if (SCENE_LABEL_NOISE_PREFIX_RE.test(value)) return false;
            if (SCENE_LABEL_NOISE_CONTENT_RE.test(value) && value.length > 6) return false;
            return true;
        };
        const normalizeGoalLabel = (text = '') => normalizeText(text).replace(/^\d+\s*/, '').trim();
        const normalizeGoalCandidateLabel = (text = '') => {
            const normalized = normalizeGoalLabel(text);
            if (!normalized) return '';
            const exact = SCENE_GOAL_LABEL_HINTS.find(item => item === normalized);
            if (exact) return exact;
            const included = SCENE_GOAL_LABEL_HINTS
                .filter(item => normalized.includes(item))
                .sort((a, b) => b.length - a.length)[0];
            if (included) return included;
            const segments = normalized
                .split(/[，,。；;！!？?：:、|/]/)
                .map(item => normalizeGoalLabel(item))
                .filter(Boolean);
            const segmentPicked = segments.find(item => item.length >= 2 && item.length <= 24) || '';
            const compact = normalizeGoalLabel(segmentPicked || normalized);
            return compact.length > 22 ? compact.slice(0, 22) : compact;
        };
        const normalizeGoalKey = (text = '') => {
            const normalized = normalizeGoalCandidateLabel(text)
                .toLowerCase()
                .replace(/[^\w\u4e00-\u9fa5]+/g, '_')
                .replace(/^_+|_+$/g, '');
            return normalized || 'default_goal';
        };
        const getSceneMarketingGoalFallbackList = (sceneName = '') => {
            const scene = String(sceneName || '').trim();
            const isKeywordScene = scene === '关键词推广';
            const list = Array.isArray(SCENE_MARKETING_GOAL_FALLBACK_OPTIONS[scene])
                ? SCENE_MARKETING_GOAL_FALLBACK_OPTIONS[scene]
                : [];
            return uniqueBy(
                list
                    .map(item => (isKeywordScene ? normalizeGoalCandidateLabel(item) : normalizeGoalLabel(item)))
                    .filter(Boolean),
                item => item
            ).slice(0, 20);
        };
        const getSceneGoalFieldRowFallback = (sceneName = '', goalLabel = '') => {
            const scene = String(sceneName || '').trim();
            const normalizedGoalLabel = normalizeGoalLabel(goalLabel || '');
            const config = SCENE_GOAL_FIELD_ROW_FALLBACK[scene];
            let rows = [];
            if (Array.isArray(config)) {
                rows = config.slice();
            } else if (isPlainObject(config)) {
                const defaultRows = Array.isArray(config.__default)
                    ? config.__default
                    : (Array.isArray(config.default) ? config.default : []);
                let goalRows = [];
                if (normalizedGoalLabel) {
                    let matchedGoalKey = '';
                    Object.keys(config).forEach(key => {
                        if (!key || key === '__default' || key === 'default') return;
                        if (matchedGoalKey) return;
                        const normalizedKey = normalizeGoalCandidateLabel(key);
                        if (!normalizedKey) return;
                        if (
                            normalizedKey === normalizeGoalCandidateLabel(normalizedGoalLabel)
                            || normalizedKey.includes(normalizedGoalLabel)
                            || normalizedGoalLabel.includes(normalizedKey)
                        ) {
                            matchedGoalKey = key;
                        }
                    });
                    if (matchedGoalKey && Array.isArray(config[matchedGoalKey])) {
                        goalRows = config[matchedGoalKey];
                    }
                }
                const mergedRows = [].concat(defaultRows, goalRows);
                const dedupMap = {};
                mergedRows.forEach(row => {
                    const labelKey = normalizeSceneFieldKey(normalizeSceneOptionText(row?.label || ''));
                    if (!labelKey) return;
                    dedupMap[labelKey] = row;
                });
                rows = Object.values(dedupMap);
            }
            return rows.map((row, idx) => ({
                label: normalizeSceneOptionText(row?.label || ''),
                options: uniqueBy(
                    (Array.isArray(row?.options) ? row.options : [])
                        .map(item => normalizeSceneSettingValue(item))
                        .filter(Boolean),
                    item => item
                ).slice(0, 24),
                defaultValue: normalizeSceneSettingValue(row?.defaultValue || ''),
                dependsOn: normalizedGoalLabel ? ['营销目标'] : [],
                triggerPath: `fallback:${normalizedGoalLabel || 'default'}>${String(row?.label || `field_${idx + 1}`).trim()}`
            })).filter(row => row.label && row.options.length >= 2);
        };
        const buildFallbackGoalSpecList = (sceneName = '') => {
            const targetScene = String(sceneName || '').trim();
            if (!targetScene) return [];
            const fallbackGoalLabels = getSceneMarketingGoalFallbackList(targetScene);
            if (!fallbackGoalLabels.length) return [];
            const defaultGoalLabel = normalizeGoalCandidateLabel(
                SCENE_SPEC_FIELD_FALLBACK?.[targetScene]?.营销目标
                || fallbackGoalLabels[0]
                || ''
            );
            return fallbackGoalLabels.map((goalLabel, idx) => {
                const normalizedGoal = normalizeGoalCandidateLabel(goalLabel);
                const fieldRows = normalizeGoalFieldRows(getSceneGoalFieldRowFallback(targetScene, normalizedGoal));
                const fieldMatrix = fieldRows.reduce((acc, row) => {
                    acc[row.label] = {
                        options: row.options.slice(0, 48),
                        defaultValue: row.defaultValue || '',
                        requiredGuess: !!row.requiredGuess,
                        criticalGuess: !!row.criticalGuess,
                        dependsOn: row.dependsOn.slice(0, 16),
                        triggerPath: row.triggerPath || ''
                    };
                    return acc;
                }, {});
                const runtimeSnapshot = {};
                if (targetScene === '关键词推广') {
                    const keywordRuntime = resolveKeywordGoalRuntimeFallback(normalizedGoal);
                    if (keywordRuntime.promotionScene) runtimeSnapshot.promotionScene = keywordRuntime.promotionScene;
                    if (keywordRuntime.itemSelectedMode) runtimeSnapshot.itemSelectedMode = keywordRuntime.itemSelectedMode;
                    if (keywordRuntime.bidTargetV2) runtimeSnapshot.bidTargetV2 = keywordRuntime.bidTargetV2;
                    if (keywordRuntime.optimizeTarget || keywordRuntime.bidTargetV2) {
                        runtimeSnapshot.optimizeTarget = keywordRuntime.optimizeTarget || keywordRuntime.bidTargetV2;
                    }
                }
                const defaultCampaign = {};
                if (runtimeSnapshot.promotionScene) defaultCampaign.promotionScene = runtimeSnapshot.promotionScene;
                if (runtimeSnapshot.itemSelectedMode) defaultCampaign.itemSelectedMode = runtimeSnapshot.itemSelectedMode;
                if (runtimeSnapshot.bidTargetV2) defaultCampaign.bidTargetV2 = runtimeSnapshot.bidTargetV2;
                if (runtimeSnapshot.optimizeTarget) defaultCampaign.optimizeTarget = runtimeSnapshot.optimizeTarget;
                return {
                    goalKey: normalizeGoalKey(normalizedGoal),
                    goalLabel: normalizedGoal,
                    isDefault: normalizedGoal === defaultGoalLabel || (!defaultGoalLabel && idx === 0),
                    runtimeSnapshot,
                    createContract: {
                        method: 'POST',
                        endpoint: '/solution/addList.json',
                        requestKeys: [],
                        campaignKeyPaths: Object.keys(defaultCampaign),
                        adgroupKeyPaths: [],
                        defaultCampaign,
                        defaultAdgroup: {}
                    },
                    loadContracts: [],
                    triggerPath: `fallback_goal:${targetScene}>${normalizedGoal}`,
                    groupKey: 'fallback',
                    groupLabel: '营销目标',
                    fieldRows,
                    fieldMatrix,
                    fieldCoverage: {
                        fieldCount: fieldRows.length,
                        optionCount: fieldRows.reduce((sum, row) => sum + (Array.isArray(row.options) ? row.options.length : 0), 0),
                        requiredCount: fieldRows.filter(row => row.requiredGuess).length,
                        criticalCount: fieldRows.filter(row => row.criticalGuess).length,
                        sectionCount: 0,
                        snapshotCount: 0,
                        scanMode: 'fallback'
                    },
                    sectionOrder: uniqueBy(fieldRows.map(row => normalizeText(row.label)).filter(Boolean), item => item).slice(0, 80)
                };
            });
        };
        const normalizeLifecycleAction = (action = '') => {
            const raw = String(action || '').trim().toLowerCase();
            if (!raw) return '';
            if (raw === 'create' || raw === 'add' || raw === 'submit') return 'create';
            if (raw === 'list_conflict' || raw === 'conflict_list' || raw === 'listconflict' || raw === 'list') return 'list_conflict';
            if (raw === 'pause' || raw === 'stop' || raw === 'offline' || raw === 'suspend') return 'pause';
            if (raw === 'delete' || raw === 'remove' || raw === 'del') return 'delete';
            return '';
        };
        const isLifecycleAction = (action = '') => LIFECYCLE_ACTION_LIST.includes(normalizeLifecycleAction(action));
        const isLikelyGoalOptionText = (text = '') => {
            const normalized = normalizeGoalCandidateLabel(text);
            if (!normalized) return false;
            if (normalized.length < 2 || normalized.length > 22) return false;
            if (SCENE_SKIP_TEXT_RE.test(normalized)) return false;
            if (SCENE_GOAL_OPTION_SKIP_RE.test(normalized)) return false;
            if (SCENE_GOAL_OPTION_HINT_RE.test(normalized)) return true;
            return SCENE_GOAL_LABEL_HINTS.some(item => item.includes(normalized) || normalized.includes(item));
        };
        const isLikelyGoalGroup = (group = {}) => {
            const label = normalizeText(group?.groupLabel || '');
            const options = Array.isArray(group?.options) ? group.options : [];
            const optionTexts = options.map(item => normalizeGoalLabel(item?.optionText || '')).filter(Boolean);
            if (optionTexts.length < 2) return false;
            if (/场景名称/.test(label)) return false;
            if (label && /预算|出价|计划名称|计划名|投放时间|预算类型|出价方式|出价目标/.test(label)) return false;
            if (SCENE_GOAL_GROUP_HINT_RE.test(label)) return true;
            if (optionTexts.some(text => isLikelyGoalOptionText(text))) return true;
            return false;
        };
        const scoreGoalGroup = (group = {}) => {
            const label = normalizeText(group?.groupLabel || '');
            const options = Array.isArray(group?.options) ? group.options : [];
            const optionTexts = options.map(item => normalizeGoalLabel(item?.optionText || '')).filter(Boolean);
            let score = 0;
            if (SCENE_GOAL_GROUP_HINT_RE.test(label)) score += 120;
            if (/营销目标/.test(label)) score += 80;
            if (/优化目标/.test(label)) score += 40;
            if (optionTexts.some(text => isLikelyGoalOptionText(text))) score += 30;
            if (Number.isFinite(group?.top) && group.top >= 100 && group.top <= 560) score += 16;
            if (optionTexts.length >= 2 && optionTexts.length <= 8) score += 12;
            if (optionTexts.some(text => /预算|出价|投放时间/.test(text))) score -= 45;
            return score;
        };
        const collectMarketingGoalCandidates = (root) => {
            const collectFromDataCards = () => {
                const targetRoot = root || pickPlanConfigRoot();
                const cards = Array.from(targetRoot.querySelectorAll('[data-card*="_card_"]'));
                const candidates = cards.map(card => {
                    if (!isElementVisible(card)) return null;
                    const dataCard = String(card.getAttribute('data-card') || '').trim();
                    if (!dataCard) return null;
                    if (!/(promotion_scene|goal|target|optimize|order_charge|solution|promotion_model)/i.test(dataCard)) return null;
                    const fullText = normalizeText(card.textContent || '');
                    if (!fullText) return null;
                    const byHints = SCENE_GOAL_LABEL_HINTS
                        .filter(item => fullText.includes(item))
                        .sort((a, b) => b.length - a.length)[0] || '';
                    const optionText = normalizeGoalLabel(
                        byHints
                        || normalizeGoalCandidateLabel(getOwnText(card) || '')
                        || normalizeGoalCandidateLabel(
                            Array.from(card.querySelectorAll('span,div,strong,label'))
                                .map(el => normalizeGoalCandidateLabel(getOwnText(el) || ''))
                                .find(Boolean)
                        )
                        || ''
                    );
                    const goalLabel = normalizeGoalCandidateLabel(optionText);
                    if (!goalLabel || SCENE_GOAL_OPTION_SKIP_RE.test(goalLabel)) return null;
                    const labelText = normalizeText(findNearestLabelText(card) || '');
                    const groupLabel = SCENE_GOAL_GROUP_HINT_RE.test(labelText) ? labelText : '营销目标';
                    const rect = card.getBoundingClientRect();
                    const clickEl = card.querySelector?.('label,[role="radio"],button,[role="button"],input[type="radio"]') || card;
                    const selected = isLikelySelectedElement(card)
                        || isLikelySelectedElement(clickEl)
                        || String(card.getAttribute('aria-checked') || '') === 'true';
                    const disabled = String(card.getAttribute('aria-disabled') || '') === 'true';
                    return {
                        groupKey: `${groupLabel}_${Math.round(rect.top / 24)}_${Math.round(rect.left / 80)}`,
                        groupLabel,
                        optionText,
                        goalLabel,
                        selected,
                        disabled,
                        top: Math.round(rect.top),
                        left: Math.round(rect.left),
                        clickEl
                    };
                }).filter(Boolean);
                return uniqueBy(
                    candidates,
                    item => `${item.groupLabel}::${item.goalLabel || item.optionText}`
                ).slice(0, 18);
            };
            const groups = collectLayerControlGroups(root)
                .filter(group => isLikelyGoalGroup(group))
                .map(group => ({ ...group, _goalScore: scoreGoalGroup(group) }))
                .sort((a, b) => (b._goalScore - a._goalScore) || (a.top - b.top));
            const fromGroups = groups.length
                ? groups[0].options
                    .map(option => ({
                        groupKey: groups[0].groupKey,
                        groupLabel: groups[0].groupLabel,
                        optionText: normalizeGoalLabel(option.optionText || ''),
                        goalLabel: normalizeGoalCandidateLabel(option.optionText || ''),
                        selected: !!option.selected,
                        disabled: !!option.disabled,
                        top: groups[0].top,
                        left: groups[0].left
                    }))
                    .filter(option => option.optionText && !option.disabled)
                    .filter(option => !SCENE_GOAL_OPTION_SKIP_RE.test(option.goalLabel || option.optionText))
                    .filter(option => isLikelyGoalOptionText(option.goalLabel || option.optionText) || option.selected)
                    .slice(0, 12)
                : [];
            const fromCards = collectFromDataCards();
            const merged = uniqueBy(
                fromGroups.concat(fromCards.map(item => ({
                    groupKey: item.groupKey,
                    groupLabel: item.groupLabel,
                    optionText: item.optionText,
                    goalLabel: item.goalLabel,
                    selected: !!item.selected,
                    disabled: !!item.disabled,
                    top: item.top,
                    left: item.left
                }))),
                item => `${item.groupLabel || ''}::${item.goalLabel || item.optionText}`
            ).slice(0, 16);
            return merged;
        };
        const parseCaptureBody = (rawBody) => {
            if (rawBody === undefined || rawBody === null || rawBody === '') return null;
            if (isPlainObject(rawBody)) return rawBody;
            if (typeof rawBody !== 'string') {
                try {
                    const text = String(rawBody);
                    if (!text) return null;
                    rawBody = text;
                } catch {
                    return null;
                }
            }
            const text = String(rawBody || '').trim();
            if (!text) return null;
            try {
                return JSON.parse(text);
            } catch { }
            try {
                const params = new URLSearchParams(text);
                const out = {};
                for (const [key, value] of params.entries()) out[key] = value;
                return Object.keys(out).length ? out : null;
            } catch {
                return null;
            }
        };
        const flattenCaptureKeyPaths = (value, options = {}) => {
            const maxDepth = Math.max(1, Math.min(12, toNumber(options.maxDepth, 8)));
            const maxPaths = Math.max(20, Math.min(4000, toNumber(options.maxPaths, 1200)));
            const maxArrayItems = Math.max(1, Math.min(6, toNumber(options.maxArrayItems, 2)));
            const output = [];
            const pushPath = (path = '') => {
                const text = String(path || '').trim();
                if (!text) return;
                output.push(text);
            };
            const walk = (node, basePath = '', depth = 0) => {
                if (output.length >= maxPaths || depth > maxDepth) return;
                if (Array.isArray(node)) {
                    const listPath = basePath ? `${basePath}[]` : '[]';
                    pushPath(listPath);
                    for (let i = 0; i < node.length && i < maxArrayItems; i++) {
                        const item = node[i];
                        if (isPlainObject(item) || Array.isArray(item)) {
                            walk(item, listPath, depth + 1);
                        }
                        if (output.length >= maxPaths) break;
                    }
                    return;
                }
                if (!isPlainObject(node)) return;
                const keys = Object.keys(node).slice(0, 240);
                for (let i = 0; i < keys.length; i++) {
                    const key = String(keys[i] || '').trim();
                    if (!key) continue;
                    const nextPath = basePath ? `${basePath}.${key}` : key;
                    pushPath(nextPath);
                    if (output.length >= maxPaths) break;
                    const child = node[key];
                    if (isPlainObject(child) || Array.isArray(child)) {
                        walk(child, nextPath, depth + 1);
                        if (output.length >= maxPaths) break;
                    }
                }
            };
            walk(value, '', 0);
            return uniqueBy(output, item => item).slice(0, maxPaths);
        };
        const normalizeCaptureMethod = (method = '') => {
            const normalized = String(method || '').trim().toUpperCase();
            return normalized || 'POST';
        };
        const normalizeCapturePath = (rawUrl = '') => {
            try {
                const url = new URL(String(rawUrl || ''), window.location.origin);
                return String(url.pathname || '').trim();
            } catch {
                return '';
            }
        };
        const listHookManagers = () => {
            const managers = [];
            const pushManager = (manager) => {
                if (!manager || typeof manager.install !== 'function') return;
                if (managers.includes(manager)) return;
                managers.push(manager);
            };
            try { pushManager(window.__AM_HOOK_MANAGER__); } catch { }
            try {
                if (typeof unsafeWindow !== 'undefined' && unsafeWindow) {
                    pushManager(unsafeWindow.__AM_HOOK_MANAGER__);
                }
            } catch { }
            if (!managers.length && typeof createHookManager === 'function') {
                try {
                    pushManager(createHookManager());
                } catch { }
            }
            return managers;
        };
        const getHookManager = () => listHookManagers()[0] || null;
        const createGoalCaptureSession = (options = {}) => {
            const hookManagers = listHookManagers();
            const hooks = hookManagers[0];
            if (!hooks || typeof hooks.install !== 'function') {
                throw new Error('hook_manager_unavailable');
            }
            hookManagers.forEach(manager => {
                try { manager.install(); } catch { }
            });
            const includePattern = options.includePattern instanceof RegExp
                ? options.includePattern
                : /\.json(?:$|\?)/i;
            const records = [];
            let historySinceTs = Date.now();
            const pushRecord = (entry = {}) => {
                const path = normalizeCapturePath(entry?.url || '');
                if (!path || !includePattern.test(path)) return;
                const body = parseCaptureBody(entry?.body);
                const bodyKeyPaths = body && typeof body === 'object'
                    ? flattenCaptureKeyPaths(body, {
                        maxDepth: 10,
                        maxPaths: 1400,
                        maxArrayItems: 3
                    })
                    : [];
                records.push({
                    ts: Date.now(),
                    method: normalizeCaptureMethod(entry?.method),
                    path,
                    queryKeys: (() => {
                        try {
                            const url = new URL(String(entry?.url || ''), window.location.origin);
                            return uniqueBy(Array.from(url.searchParams.keys()).filter(Boolean), item => item).slice(0, 80);
                        } catch {
                            return [];
                        }
                    })(),
                    bodyKeys: body && typeof body === 'object'
                        ? uniqueBy(Object.keys(body).filter(Boolean), item => item).slice(0, 160)
                        : [],
                    bodyKeyPaths: bodyKeyPaths.slice(0, 1400),
                    sampleBody: body && typeof body === 'object'
                        ? Object.keys(body).slice(0, 24).reduce((acc, key) => {
                            acc[key] = body[key];
                            return acc;
                        }, {})
                        : null
                });
            };
            const pullHistoryRecords = () => {
                hookManagers.forEach(manager => {
                    if (!manager || typeof manager.getRequestHistory !== 'function') return;
                    let history = [];
                    try {
                        history = manager.getRequestHistory({
                            includePattern,
                            since: Math.max(0, toNumber(historySinceTs, 0) + 1),
                            limit: 6000
                        });
                    } catch {
                        history = [];
                    }
                    if (!Array.isArray(history) || !history.length) return;
                    history.forEach(entry => {
                        const ts = toNumber(entry?.ts, 0);
                        if (ts > historySinceTs) historySinceTs = ts;
                        pushRecord({
                            method: entry?.method || 'POST',
                            url: entry?.url || '',
                            body: entry?.body
                        });
                    });
                });
            };
            const offFetch = hooks.registerFetch(({ args, response }) => {
                const first = args?.[0];
                const second = args?.[1];
                const method = second?.method
                    || first?.method
                    || 'GET';
                const url = typeof first === 'string'
                    ? first
                    : first?.url || response?.url || '';
                const body = second?.body || first?.body || '';
                pushRecord({ method, url, body });
            });
            const offXhrSend = hooks.registerXHRSend(({ method, url, data }) => {
                pushRecord({
                    method: method || 'POST',
                    url,
                    body: data
                });
            });
            let cursor = 0;
            return {
                records,
                mark() {
                    pullHistoryRecords();
                    cursor = records.length;
                    return cursor;
                },
                sliceFrom(start = cursor) {
                    pullHistoryRecords();
                    const idx = Number.isFinite(start) && start >= 0 ? Math.floor(start) : 0;
                    return records.slice(idx).map(item => ({ ...item }));
                },
                stop() {
                    pullHistoryRecords();
                    try { offFetch?.(); } catch { }
                    try { offXhrSend?.(); } catch { }
                }
            };
        };
        const summarizeGoalLoadContracts = (records = []) => {
            if (!Array.isArray(records) || !records.length) return [];
            const map = new Map();
            records.forEach(record => {
                const method = normalizeCaptureMethod(record?.method);
                const path = normalizeCapturePath(record?.path || '');
                if (!path) return;
                const key = `${method} ${path}`;
                if (!map.has(key)) {
                    map.set(key, {
                        method,
                        path,
                        count: 0,
                        queryKeys: new Set(),
                        bodyKeys: new Set(),
                        bodyKeyPaths: new Set(),
                        sampleBody: null
                    });
                }
                const bucket = map.get(key);
                bucket.count += 1;
                (record?.queryKeys || []).forEach(item => bucket.queryKeys.add(item));
                (record?.bodyKeys || []).forEach(item => bucket.bodyKeys.add(item));
                (record?.bodyKeyPaths || []).forEach(item => bucket.bodyKeyPaths.add(item));
                if (!bucket.sampleBody && isPlainObject(record?.sampleBody)) {
                    bucket.sampleBody = deepClone(record.sampleBody);
                }
            });
            return Array.from(map.values())
                .map(item => ({
                    method: item.method,
                    path: item.path,
                    count: item.count,
                    queryKeys: Array.from(item.queryKeys).slice(0, 80),
                    bodyKeys: Array.from(item.bodyKeys).slice(0, 160),
                    bodyKeyPaths: Array.from(item.bodyKeyPaths).slice(0, 1400),
                    sampleBody: item.sampleBody || null
                }))
                .sort((a, b) => b.count - a.count || a.path.localeCompare(b.path))
                .slice(0, 120);
        };
        const mergeContractSummaries = (contracts = []) => {
            if (!Array.isArray(contracts) || !contracts.length) return [];
            const map = new Map();
            contracts.forEach(contract => {
                const method = normalizeCaptureMethod(contract?.method);
                const path = normalizeCapturePath(contract?.path || '');
                if (!path) return;
                const key = `${method} ${path}`;
                if (!map.has(key)) {
                    map.set(key, {
                        method,
                        path,
                        count: 0,
                        queryKeys: new Set(),
                        bodyKeys: new Set(),
                        bodyKeyPaths: new Set(),
                        sampleBody: null
                    });
                }
                const bucket = map.get(key);
                bucket.count += Math.max(1, toNumber(contract?.count, 1));
                (contract?.queryKeys || []).forEach(item => {
                    const text = normalizeText(item);
                    if (text) bucket.queryKeys.add(text);
                });
                (contract?.bodyKeys || []).forEach(item => {
                    const text = normalizeText(item);
                    if (text) bucket.bodyKeys.add(text);
                });
                (contract?.bodyKeyPaths || []).forEach(item => {
                    const text = normalizeText(item);
                    if (text) bucket.bodyKeyPaths.add(text);
                });
                if (!bucket.sampleBody && isPlainObject(contract?.sampleBody)) {
                    bucket.sampleBody = deepClone(contract.sampleBody);
                }
            });
            return Array.from(map.values()).map(item => ({
                method: item.method,
                path: item.path,
                count: item.count,
                queryKeys: Array.from(item.queryKeys).slice(0, 120),
                bodyKeys: Array.from(item.bodyKeys).slice(0, 240),
                bodyKeyPaths: Array.from(item.bodyKeyPaths).slice(0, 1600),
                sampleBody: item.sampleBody || null
            })).sort((a, b) => b.count - a.count || a.path.localeCompare(b.path));
        };
        const isGoalCreateSubmitPath = (path = '') => /\/solution\/(?:business\/)?addList\.json$/i.test(String(path || '').trim());
        const pickGoalCreateSubmitContract = (contracts = []) => {
            const list = (Array.isArray(contracts) ? contracts : [])
                .filter(item => isGoalCreateSubmitPath(item?.path || ''))
                .sort((a, b) => {
                    const countDiff = toNumber(b?.count, 0) - toNumber(a?.count, 0);
                    if (countDiff !== 0) return countDiff;
                    const aBusiness = /\/solution\/business\/addList\.json$/i.test(String(a?.path || '')) ? 1 : 0;
                    const bBusiness = /\/solution\/business\/addList\.json$/i.test(String(b?.path || '')) ? 1 : 0;
                    return bBusiness - aBusiness;
                });
            return list[0] || null;
        };
        const tryParseMaybeJSON = (raw) => {
            if (isPlainObject(raw) || Array.isArray(raw)) return raw;
            const text = String(raw || '').trim();
            if (!text) return null;
            try {
                return JSON.parse(text);
            } catch {
                return null;
            }
        };
        const findSolutionPayloadFromSample = (sampleBody = null) => {
            if (!isPlainObject(sampleBody)) return { requestBody: {}, solution: {} };
            const directSolutionList = Array.isArray(sampleBody.solutionList) ? sampleBody.solutionList : tryParseMaybeJSON(sampleBody.solutionList);
            if (Array.isArray(directSolutionList) && isPlainObject(directSolutionList[0])) {
                return {
                    requestBody: sampleBody,
                    solution: directSolutionList[0]
                };
            }
            const nestedCandidates = [
                sampleBody.request,
                sampleBody.params,
                sampleBody.data,
                sampleBody.payload
            ].filter(isPlainObject);
            for (const nested of nestedCandidates) {
                const nestedSolutionList = Array.isArray(nested.solutionList) ? nested.solutionList : tryParseMaybeJSON(nested.solutionList);
                if (Array.isArray(nestedSolutionList) && isPlainObject(nestedSolutionList[0])) {
                    return {
                        requestBody: nested,
                        solution: nestedSolutionList[0]
                    };
                }
            }
            return {
                requestBody: sampleBody,
                solution: {}
            };
        };
        const summarizeCreateInterfacesFromContracts = (contracts = []) => {
            const createContracts = mergeContractSummaries(contracts || [])
                .filter(item => isGoalCreateSubmitPath(item?.path || ''));
            return createContracts.map(item => {
                const payloadSample = findSolutionPayloadFromSample(item?.sampleBody || null);
                const requestBody = isPlainObject(payloadSample?.requestBody) ? payloadSample.requestBody : {};
                const solution = isPlainObject(payloadSample?.solution) ? payloadSample.solution : {};
                const campaign = isPlainObject(solution?.campaign) ? solution.campaign : {};
                const adgroup = Array.isArray(solution?.adgroupList) && isPlainObject(solution.adgroupList[0])
                    ? solution.adgroupList[0]
                    : {};
                const requestKeys = Object.keys(requestBody || {}).slice(0, 240);
                const solutionKeys = Object.keys(solution || {}).slice(0, 240);
                const requestKeyPaths = flattenCaptureKeyPaths(requestBody, {
                    maxDepth: 10,
                    maxPaths: 1800,
                    maxArrayItems: 3
                });
                const solutionKeyPaths = flattenCaptureKeyPaths(solution, {
                    maxDepth: 10,
                    maxPaths: 1400,
                    maxArrayItems: 3
                });
                const campaignKeyPaths = flattenCaptureKeyPaths(campaign, {
                    maxDepth: 10,
                    maxPaths: 1200,
                    maxArrayItems: 3
                });
                const adgroupKeyPaths = flattenCaptureKeyPaths(adgroup, {
                    maxDepth: 10,
                    maxPaths: 1200,
                    maxArrayItems: 3
                });
                return {
                    method: normalizeCaptureMethod(item?.method || 'POST'),
                    path: normalizeCapturePath(item?.path || ''),
                    count: toNumber(item?.count, 0),
                    requestKeys: requestKeys.length ? requestKeys : (Array.isArray(item?.bodyKeys) ? item.bodyKeys.slice(0, 240) : []),
                    requestKeyPaths: requestKeyPaths.length
                        ? requestKeyPaths
                        : (Array.isArray(item?.bodyKeyPaths) ? item.bodyKeyPaths.slice(0, 1600) : []),
                    solutionKeys,
                    solutionKeyPaths,
                    campaignKeys: Object.keys(campaign || {}).slice(0, 240),
                    campaignKeyPaths,
                    adgroupKeys: Object.keys(adgroup || {}).slice(0, 240),
                    adgroupKeyPaths,
                    sampleBody: isPlainObject(item?.sampleBody) ? deepClone(item.sampleBody) : null
                };
            }).slice(0, 80);
        };
        const mergeInterfaceKeyList = (lists = [], limit = 320) => uniqueBy(
            (Array.isArray(lists) ? lists : [])
                .flatMap(list => (Array.isArray(list) ? list : []))
                .map(item => normalizeText(item))
                .filter(Boolean),
            item => item
        ).slice(0, limit);
        const summarizeCreateInterfaceHints = (createInterfaces = []) => {
            const list = Array.isArray(createInterfaces) ? createInterfaces : [];
            if (!list.length) {
                return {
                    method: 'POST',
                    path: '',
                    count: 0,
                    requestKeys: [],
                    requestKeyPaths: [],
                    solutionKeys: [],
                    solutionKeyPaths: [],
                    campaignKeys: [],
                    campaignKeyPaths: [],
                    adgroupKeys: [],
                    adgroupKeyPaths: []
                };
            }
            const sorted = list.slice().sort((a, b) => toNumber(b?.count, 0) - toNumber(a?.count, 0));
            const first = sorted[0] || {};
            return {
                method: normalizeCaptureMethod(first?.method || 'POST'),
                path: normalizeCapturePath(first?.path || ''),
                count: sorted.reduce((sum, item) => sum + Math.max(1, toNumber(item?.count, 1)), 0),
                requestKeys: mergeInterfaceKeyList(sorted.map(item => item?.requestKeys), 320),
                requestKeyPaths: mergeInterfaceKeyList(sorted.map(item => item?.requestKeyPaths), 1600),
                solutionKeys: mergeInterfaceKeyList(sorted.map(item => item?.solutionKeys), 320),
                solutionKeyPaths: mergeInterfaceKeyList(sorted.map(item => item?.solutionKeyPaths), 1400),
                campaignKeys: mergeInterfaceKeyList(sorted.map(item => item?.campaignKeys), 320),
                campaignKeyPaths: mergeInterfaceKeyList(sorted.map(item => item?.campaignKeyPaths), 1200),
                adgroupKeys: mergeInterfaceKeyList(sorted.map(item => item?.adgroupKeys), 320),
                adgroupKeyPaths: mergeInterfaceKeyList(sorted.map(item => item?.adgroupKeyPaths), 1200)
            };
        };
        const rememberSceneCreateInterfaces = (sceneName = '', goalLabel = '', createInterfaces = [], extra = {}) => {
            const scene = String(sceneName || '').trim();
            if (!scene || !Array.isArray(createInterfaces) || !createInterfaces.length) return null;
            const summary = summarizeCreateInterfaceHints(createInterfaces);
            const endpoint = normalizeCapturedCreateEndpoint(summary.path || '');
            const contract = {
                sceneName: scene,
                goalLabel: normalizeGoalCandidateLabel(goalLabel || ''),
                method: summary.method || 'POST',
                endpoint: endpoint || '',
                requestKeys: summary.requestKeys.slice(0, 320),
                requestKeyPaths: summary.requestKeyPaths.slice(0, 1600),
                solutionKeys: summary.solutionKeys.slice(0, 320),
                solutionKeyPaths: summary.solutionKeyPaths.slice(0, 1400),
                campaignKeys: summary.campaignKeys.slice(0, 320),
                campaignKeyPaths: summary.campaignKeyPaths.slice(0, 1200),
                adgroupKeys: summary.adgroupKeys.slice(0, 320),
                adgroupKeyPaths: summary.adgroupKeyPaths.slice(0, 1200),
                count: summary.count || 0,
                sampledAt: new Date().toISOString(),
                source: normalizeText(extra?.source || 'network_capture'),
                createInterfaces: deepClone(createInterfaces).slice(0, 80)
            };
            setCachedSceneCreateContract(scene, contract.goalLabel, contract);
            // 场景级兜底合同（无营销目标）。
            setCachedSceneCreateContract(scene, '', contract);
            return contract;
        };
        const resolveGoalCreateEndpoint = (loadContracts = []) => {
            const list = Array.isArray(loadContracts) ? loadContracts : [];
            const createCandidate = list.find(item => /\/solution\/business\/addList\.json$/i.test(item?.path || ''))
                || list.find(item => /\/solution\/addList\.json$/i.test(item?.path || ''));
            return normalizeCapturePath(createCandidate?.path || '') || SCENE_CREATE_ENDPOINT_FALLBACK;
        };

        const collectSceneBizCodeHintsFromPage = () => {
            const map = { ...SCENE_BIZCODE_HINT_FALLBACK };
            try {
                const cards = Array.from(document.querySelectorAll('[data-card*="_card_"]'));
                cards.forEach(card => {
                    const dataCard = String(card.getAttribute('data-card') || '').trim();
                    const suffix = dataCard.replace(/^.*_card_/, '').trim();
                    const mappedBizCode = SCENE_BIZCODE_ALIAS_MAP[suffix] || suffix;
                    if (!mappedBizCode) return;
                    const mappedSceneByBiz = SCENE_BIZCODE_TO_NAME_FALLBACK[mappedBizCode];
                    if (mappedSceneByBiz) {
                        map[mappedSceneByBiz] = mappedBizCode;
                        return;
                    }

                    // 兜底：仅在卡片文本中唯一命中一个场景名时才采纳，避免整段容器文本导致串场景。
                    const text = normalizeText(card.textContent || '');
                    const matchedScenes = SCENE_NAME_LIST.filter(sceneName => text.includes(sceneName));
                    if (matchedScenes.length === 1) {
                        map[matchedScenes[0]] = mappedBizCode;
                    }
                });
            } catch { }
            return map;
        };

        const resolveSceneBizCodeHint = (sceneName = '') => {
            const normalizedScene = String(sceneName || '').trim();
            if (!normalizedScene) return '';
            const map = collectSceneBizCodeHintsFromPage();
            return normalizeSceneBizCode(map[normalizedScene] || '');
        };

        const resolveSceneDefaultPromotionScene = (sceneName = '', fallback = '') => {
            const normalizedScene = String(sceneName || '').trim();
            if (!normalizedScene) return String(fallback || '').trim();
            return String(SCENE_DEFAULT_PROMOTION_SCENE[normalizedScene] || fallback || '').trim();
        };

        const isLikelySectionTitle = (text = '') => {
            if (!text) return false;
            if (text.length < 2 || text.length > 26) return false;
            if (SCENE_SKIP_TEXT_RE.test(text)) return false;
            if (SCENE_FIELD_LABEL_RE.test(text)) return true;
            if (/^(设置.+|选择.+|.+方案设置.*|.+设置)$/.test(text)) return true;
            if (SCENE_KEYWORD_HINT_RE.test(text) && text.length <= 14) return true;
            return false;
        };

        const isLikelyFieldLabel = (text = '') => {
            if (!text) return false;
            if (text.length < 2 || text.length > 28) return false;
            if (SCENE_SKIP_TEXT_RE.test(text)) return false;
            if (SCENE_SECTION_ONLY_LABEL_RE.test(text)) return false;
            if (/^\d+\s*[.)。、]/.test(text)) return false;
            if (SCENE_LABEL_NOISE_RE.test(text)) return false;
            if (text.includes('·')) return false;
            if (SCENE_LABEL_NOISE_PREFIX_RE.test(text)) return false;
            if (SCENE_LABEL_NOISE_CONTENT_RE.test(text)) return false;
            if (SCENE_DYNAMIC_FIELD_BLOCK_RE.test(text)) return false;
            if (SCENE_FIELD_LABEL_RE.test(text)) return true;
            if (!SCENE_KEYWORD_HINT_RE.test(text)) return false;
            return /^(?:(?:设置|选择).+|.+(?:名称|目标|方式|类型|设置|预算|出价|关键词|人群|创意|投放|落地页|线索|计划|方案|计划组|模式))$/.test(text);
        };

        const isElementVisible = (el) => {
            if (!el || !(el instanceof Element)) return false;
            if (el.closest('#am-wxt-keyword-overlay')) return false;
            const style = window.getComputedStyle(el);
            if (style.display === 'none' || style.visibility === 'hidden') return false;
            if (Number(style.opacity) === 0) return false;
            const rect = el.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0
                && rect.bottom > 0 && rect.right > 0
                && rect.top < window.innerHeight && rect.left < window.innerWidth;
        };

        const getOwnText = (el) => {
            if (!el) return '';
            let text = '';
            const nodes = el.childNodes || [];
            for (let i = 0; i < nodes.length; i++) {
                const node = nodes[i];
                if (node?.nodeType === Node.TEXT_NODE) text += node.textContent || '';
            }
            return normalizeText(text);
        };

        const findNearestLabelText = (el) => {
            if (!el) return '';
            const explicit = normalizeText(el.getAttribute?.('aria-label') || el.getAttribute?.('title') || '');
            if (explicit) return explicit;
            const wrapped = el.closest?.('label');
            if (wrapped) {
                const wrappedText = normalizeText(getOwnText(wrapped) || wrapped.textContent || '');
                if (wrappedText && wrappedText.length <= 40) return wrappedText;
            }

            let cursor = el;
            for (let depth = 0; depth < 5 && cursor; depth++) {
                const parent = cursor.parentElement;
                if (!parent) break;

                let prev = cursor.previousElementSibling;
                while (prev) {
                    const prevText = normalizeText(prev.textContent || '');
                    if (prevText && prevText.length <= 30) return prevText;
                    prev = prev.previousElementSibling;
                }

                const parentText = normalizeText(getOwnText(parent));
                if (parentText && parentText.length <= 24) return parentText;
                cursor = parent;
            }

            const placeholder = normalizeText(el.getAttribute?.('placeholder') || '');
            return placeholder;
        };

        const pickPlanConfigRoot = () => {
            const list = Array.from(document.querySelectorAll('div,section,form')).filter(el => {
                if (!isElementVisible(el)) return false;
                const text = normalizeText(el.innerText || el.textContent || '');
                if (!text || text.length < 60) return false;
                if (!text.includes('场景名称')) return false;
                const matchHints = [
                    '设置基础信息',
                    '创建完成',
                    '选择推广商品',
                    '设置出价及预算',
                    '设置预算及排期',
                    '设置商品推广方案',
                    '设置落地页',
                    '选择解决方案'
                ].filter(item => text.includes(item)).length;
                if (matchHints < 2) return false;
                const rect = el.getBoundingClientRect();
                return rect.width >= 760 && rect.height >= 360 && rect.top < 560;
            });
            if (!list.length) return document.body;
            return list.sort((a, b) => {
                const ra = a.getBoundingClientRect();
                const rb = b.getBoundingClientRect();
                const areaA = ra.width * ra.height;
                const areaB = rb.width * rb.height;
                return areaA - areaB;
            })[0];
        };

        const collectVisibleTextEntries = (root) => {
            const out = [];
            const nodes = root.querySelectorAll('div,span,label,button,a,strong,h1,h2,h3,h4,p,li');
            nodes.forEach(el => {
                if (!isElementVisible(el)) return;
                let text = getOwnText(el);
                if (!text && el.childElementCount === 0) text = normalizeText(el.textContent || '');
                if (!text) return;
                if (text.length < 2 || text.length > 80) return;
                const rect = el.getBoundingClientRect();
                out.push({
                    text,
                    top: Math.round(rect.top),
                    left: Math.round(rect.left),
                    tag: el.tagName.toLowerCase()
                });
            });
            out.sort((a, b) => (a.top - b.top) || (a.left - b.left));
            return out;
        };

        const collectControlSchemaFromRoot = (root) => {
            const textEntries = collectVisibleTextEntries(root);
            const textSeen = new Set();
            const uniqueTexts = [];
            textEntries.forEach(entry => {
                if (textSeen.has(entry.text)) return;
                textSeen.add(entry.text);
                uniqueTexts.push(entry.text);
            });

            const radios = uniqueBy(
                Array.from(root.querySelectorAll('[role="radio"], input[type="radio"]')).map(el => {
                    if (!isElementVisible(el)) return null;
                    const text = normalizeText(el.getAttribute?.('aria-label') || el.textContent || findNearestLabelText(el));
                    if (!text) return null;
                    const checked = String(el.getAttribute?.('aria-checked') || '') === 'true'
                        || !!el.checked
                        || el.getAttribute?.('checked') !== null;
                    return {
                        label: findNearestLabelText(el),
                        text,
                        value: el.value || '',
                        checked
                    };
                }).filter(Boolean),
                item => `${item.text}::${item.value}`
            );

            const checkboxes = uniqueBy(
                Array.from(root.querySelectorAll('[role="checkbox"], input[type="checkbox"]')).map(el => {
                    if (!isElementVisible(el)) return null;
                    const text = normalizeText(el.getAttribute?.('aria-label') || el.textContent || findNearestLabelText(el));
                    if (!text) return null;
                    const checked = String(el.getAttribute?.('aria-checked') || '') === 'true'
                        || !!el.checked
                        || el.getAttribute?.('checked') !== null;
                    return {
                        label: findNearestLabelText(el),
                        text,
                        checked,
                        disabled: !!el.disabled || String(el.getAttribute?.('aria-disabled') || '') === 'true'
                    };
                }).filter(Boolean),
                item => item.text
            );

            const selects = Array.from(root.querySelectorAll('select')).filter(isElementVisible).map(el => ({
                label: findNearestLabelText(el),
                value: el.value || '',
                options: Array.from(el.options || []).map(opt => ({
                    label: normalizeText(opt.textContent || ''),
                    value: opt.value,
                    selected: !!opt.selected
                }))
            }));

            const inputs = uniqueBy(
                Array.from(root.querySelectorAll('input:not([type="radio"]):not([type="checkbox"]):not([type="hidden"]), textarea')).map(el => {
                    if (!isElementVisible(el)) return null;
                    return {
                        label: findNearestLabelText(el),
                        type: el.tagName.toLowerCase() === 'textarea' ? 'textarea' : (el.type || 'text'),
                        placeholder: normalizeText(el.getAttribute('placeholder') || ''),
                        value: normalizeText(el.value || ''),
                        disabled: !!el.disabled
                    };
                }).filter(Boolean),
                item => `${item.label}::${item.placeholder}::${item.type}`
            );

            const buttonLike = uniqueBy(
                Array.from(root.querySelectorAll('button, [role="button"], [role="tab"], a')).map(el => {
                    if (!isElementVisible(el)) return '';
                    return normalizeText(el.textContent || '');
                }).filter(text => {
                    if (!text) return false;
                    if (text.length > 24) return false;
                    if (SCENE_SKIP_TEXT_RE.test(text)) return false;
                    return true;
                }),
                text => text
            );

            const optionGroups = uniqueBy(
                Array.from(root.querySelectorAll('div,ul,section')).map(parent => {
                    if (!isElementVisible(parent)) return null;
                    const rect = parent.getBoundingClientRect();
                    if (rect.width < 120 || rect.width > 1300 || rect.height < 24 || rect.height > 280) return null;
                    const plainText = normalizeText(parent.textContent || '');
                    if (!plainText || plainText.length > 280) return null;

                    const options = uniqueBy(
                        Array.from(parent.children || []).map(child => {
                            if (!isElementVisible(child)) return '';
                            let text = getOwnText(child);
                            if (!text && child.childElementCount === 0) text = normalizeText(child.textContent || '');
                            if (!text) return '';
                            if (text.length < 2 || text.length > 20) return '';
                            if (SCENE_SKIP_TEXT_RE.test(text)) return '';
                            if (/^[0-9]+$/.test(text)) return '';
                            if (/[，。,.：:]/.test(text) && text.length > 12) return '';
                            return text;
                        }).filter(Boolean),
                        text => text
                    );
                    if (options.length < 2 || options.length > 12) return null;

                    const label = findNearestLabelText(parent);
                    if (!label && !options.some(item => SCENE_KEYWORD_HINT_RE.test(item))) return null;
                    return { label, options };
                }).filter(Boolean),
                item => `${item.label || ''}::${item.options.join('|')}`
            );

            const sectionHeadings = uniqueBy(
                textEntries
                    .filter(entry => entry.left < 620 && isLikelySectionTitle(entry.text))
                    .map(entry => ({ title: entry.text, top: entry.top, left: entry.left })),
                item => item.title
            ).sort((a, b) => a.top - b.top);

            const sections = sectionHeadings.map((heading, idx) => {
                const nextTop = sectionHeadings[idx + 1]?.top || (heading.top + 520);
                const options = uniqueBy(
                    textEntries
                        .filter(entry => entry.top > heading.top + 4 && entry.top < nextTop && entry.left >= heading.left - 20)
                        .map(entry => entry.text)
                        .filter(text => text.length <= 24 && text !== heading.title && !isLikelySectionTitle(text)),
                    text => text
                );
                return {
                    title: heading.title,
                    options
                };
            });

            const labels = uniqueBy(
                uniqueTexts.filter(text => isLikelyFieldLabel(text)),
                text => text
            );

            const optionTexts = uniqueBy(
                uniqueTexts.filter(text => {
                    if (text.length > 20) return false;
                    if (isLikelyFieldLabel(text)) return false;
                    if (SCENE_SKIP_TEXT_RE.test(text)) return false;
                    if (/^\d+$/.test(text)) return false;
                    return true;
                }),
                text => text
            );

            return {
                sectionTitles: sections.map(item => item.title),
                sections,
                labels,
                radios,
                checkboxes,
                selects,
                inputs,
                buttonLikeOptions: buttonLike,
                optionGroups,
                optionTexts,
                textSamples: uniqueTexts.slice(0, 300)
            };
        };

        const getSceneCardElement = (sceneName) => {
            const exactTextNodes = Array.from(document.querySelectorAll('div,span,a,button')).filter(el => {
                if (!isElementVisible(el)) return false;
                const text = normalizeText(el.textContent || '');
                if (text !== sceneName) return false;
                const rect = el.getBoundingClientRect();
                return rect.top >= 100 && rect.top <= 360 && rect.left >= 260;
            });

            const scored = [];
            exactTextNodes.forEach(node => {
                let cursor = node;
                for (let depth = 0; depth < 6 && cursor && cursor !== document.body; depth++) {
                    if (!isElementVisible(cursor)) {
                        cursor = cursor.parentElement;
                        continue;
                    }
                    const text = normalizeText(cursor.textContent || '');
                    const rect = cursor.getBoundingClientRect();
                    if (text.includes(sceneName)
                        && rect.top >= 100 && rect.top <= 360
                        && rect.left >= 260
                        && rect.width >= 120 && rect.width <= 280
                        && rect.height >= 70 && rect.height <= 180) {
                        const score = rect.width * rect.height - Math.abs(rect.top - 160) * 40;
                        scored.push({ el: cursor, score });
                    }
                    cursor = cursor.parentElement;
                }
            });

            if (scored.length) {
                scored.sort((a, b) => b.score - a.score);
                return scored[0].el;
            }

            const fallback = Array.from(document.querySelectorAll('a,button,li,div,span')).find(el => {
                if (!isElementVisible(el)) return false;
                const text = normalizeText(el.textContent || '');
                return text === sceneName;
            });
            return fallback || null;
        };

        const clickElement = (el) => {
            if (!el) return false;
            const rect = el.getBoundingClientRect();
            const clientX = rect.left + Math.max(3, Math.min(rect.width - 3, rect.width / 2));
            const clientY = rect.top + Math.max(3, Math.min(rect.height - 3, rect.height / 2));

            const dispatchPointerMouse = (type) => {
                const base = {
                    bubbles: true,
                    cancelable: true,
                    clientX,
                    clientY
                };
                try {
                    if (type.startsWith('pointer') && typeof PointerEvent === 'function') {
                        el.dispatchEvent(new PointerEvent(type, base));
                    } else {
                        el.dispatchEvent(new MouseEvent(type, base));
                    }
                    return true;
                } catch {
                    try {
                        el.dispatchEvent(new MouseEvent(type, {
                            bubbles: true,
                            cancelable: true
                        }));
                        return true;
                    } catch {
                        try {
                            el.dispatchEvent(new Event(type, {
                                bubbles: true,
                                cancelable: true
                            }));
                            return true;
                        } catch {
                            return false;
                        }
                    }
                }
            };

            ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'].forEach(type => {
                dispatchPointerMouse(type);
            });
            if (typeof el.click === 'function') el.click();
            return true;
        };

        const waitUntil = async (predicate, timeoutMs = 5000, intervalMs = 120) => {
            const start = Date.now();
            while (Date.now() - start < timeoutMs) {
                try {
                    if (predicate()) return true;
                } catch { }
                await sleep(intervalMs);
            }
            return false;
        };

        const waitForDomStable = async (options = {}) => {
            const timeoutMs = Math.max(300, toNumber(options.waitMs, 3600));
            const stabilizeMs = Math.max(120, toNumber(options.stabilizeMs, 420));
            const intervalMs = Math.max(80, toNumber(options.intervalMs, 130));
            const start = Date.now();
            let lastSignature = getCurrentSceneSignature();
            let stableSince = Date.now();
            while (Date.now() - start < timeoutMs) {
                await sleep(intervalMs);
                const current = getCurrentSceneSignature();
                if (current !== lastSignature) {
                    lastSignature = current;
                    stableSince = Date.now();
                    continue;
                }
                if (Date.now() - stableSince >= stabilizeMs) return true;
            }
            return false;
        };

        const parseBizCodeFromHash = (hash = '') => {
            const raw = String(hash || window.location.hash || '').trim();
            if (!raw) return '';
            const match = raw.match(/[?&]bizCode=([^&#]+)/i);
            if (!match || !match[1]) return '';
            return decodeURIComponent(match[1]);
        };

        const buildSceneRouteHash = (sceneName = '') => {
            const targetScene = String(sceneName || '').trim();
            if (!targetScene) return '';
            const bizCode = resolveSceneBizCodeHint(targetScene) || SCENE_BIZCODE_HINT_FALLBACK[targetScene] || '';
            if (!bizCode) return '';
            return `#!/main/index?bizCode=${encodeURIComponent(bizCode)}`;
        };

        const ensureSceneRoute = async (sceneName = '', options = {}) => {
            const targetScene = String(sceneName || '').trim();
            const routeHash = buildSceneRouteHash(targetScene);
            const targetBizCode = parseBizCodeFromHash(routeHash);
            const currentBizCode = parseBizCodeFromHash(window.location.hash);
            if (routeHash && targetBizCode && currentBizCode !== targetBizCode) {
                window.location.hash = routeHash;
                await waitUntil(() => parseBizCodeFromHash(window.location.hash) === targetBizCode, Math.max(1400, toNumber(options.waitMs, 4800)), 140);
                await waitForDomStable(options);
            }
            if (targetScene) {
                try {
                    await clickScene(targetScene, options);
                } catch { }
            }
            return {
                targetScene,
                routeHash,
                targetBizCode,
                currentBizCode: parseBizCodeFromHash(window.location.hash),
                location: window.location.href
            };
        };

        const getCurrentSceneSignature = () => {
            const root = pickPlanConfigRoot();
            if (!root) return '';
            const snapshot = normalizeText((root.innerText || root.textContent || '').slice(0, 1200));
            return snapshot;
        };

        const clickScene = async (sceneName, options = {}) => {
            const target = getSceneCardElement(sceneName);
            if (!target) throw new Error(`未找到场景卡片：${sceneName}`);
            const before = getCurrentSceneSignature();
            clickElement(target);
            await sleep(Math.max(240, toNumber(options.clickDelay, 640)));
            await waitUntil(() => {
                const current = getCurrentSceneSignature();
                return current && current !== before;
            }, Math.max(1200, toNumber(options.waitTimeout, 5200)), 160);
            await sleep(Math.max(180, toNumber(options.settleDelay, 420)));
            return true;
        };

        // NOTE: 这些场景辅助函数需要给 openWizard 使用，必须放在外层作用域。
        const inferCurrentSceneName = () => {
            for (const sceneName of SCENE_NAME_LIST) {
                const card = getSceneCardElement(sceneName);
                if (!card) continue;
                try {
                    const style = window.getComputedStyle(card);
                    const borderColor = String(style.borderColor || '');
                    const border = String(style.border || '');
                    if (borderColor.includes('69, 84, 229') || border.includes('69, 84, 229')) {
                        return sceneName;
                    }
                } catch { }
            }
            if (wizardState?.draft?.sceneName && SCENE_NAME_LIST.includes(wizardState.draft.sceneName)) {
                return wizardState.draft.sceneName;
            }
            return '关键词推广';
        };

        const applyRuntimeToDraft = (runtime = {}, sceneName = '') => {
            const draft = ensureWizardDraft();
            if (sceneName && SCENE_NAME_LIST.includes(sceneName)) draft.sceneName = sceneName;
            if (runtime?.bizCode) draft.bizCode = runtime.bizCode;
            if (runtime?.promotionScene) draft.promotionScene = runtime.promotionScene;
        };

        const refreshSceneSelect = () => {
            if (!wizardState?.els?.sceneSelect) return;
            const draft = ensureWizardDraft();
            const draftSceneName = SCENE_NAME_LIST.includes(draft.sceneName) ? draft.sceneName : '';
            const inferredSceneName = inferCurrentSceneName();
            const sceneName = draftSceneName || (SCENE_NAME_LIST.includes(inferredSceneName) ? inferredSceneName : '关键词推广');
            wizardState.els.sceneSelect.value = sceneName;
            draft.sceneName = sceneName;
        };

        const SCENE_LAYER_OPTION_SKIP_RE = /^(上手指南|了解更多|了解详情|查看详情|思考过程|立即投放|生成其他策略|创建完成|保存并关闭|清空|升级|收起|展开|添加商品|添加关键词|修改匹配方案|一键上车|恢复默认推荐|新建模板创意|从创意库添加|批量修改词包溢价比例|添加种子人群|设置计划组|详情|移除|图搜同款|开|关|今日|不限|new|NEW|HOT)$/;

        const isLikelySelectedElement = (el) => {
            if (!el || !(el instanceof Element)) return false;
            try {
                if (String(el.getAttribute?.('aria-checked') || '') === 'true') return true;
                if (String(el.getAttribute?.('aria-selected') || '') === 'true') return true;
                if (el.getAttribute?.('checked') !== null) return true;
                if (typeof el.checked === 'boolean' && el.checked) return true;
                const className = String(el.className || '');
                if (/(^|\\s)(active|selected|checked|current|is-active|is-selected|next-radio-checked|next-tab-active)(\\s|$)/i.test(className)) {
                    return true;
                }
            } catch { }
            return false;
        };

        const isValidLayerOptionText = (text = '') => {
            const normalized = normalizeText(text);
            if (!normalized) return false;
            if (normalized.length < 2 || normalized.length > 22) return false;
            if (SCENE_SKIP_TEXT_RE.test(normalized)) return false;
            if (SCENE_FORBIDDEN_ACTION_RE.test(normalized)) return false;
            if (SCENE_LAYER_OPTION_SKIP_RE.test(normalized)) return false;
            if (SCENE_NAME_LIST.includes(normalized)) return false;
            if (/^[\\d.%‰\\-]+$/.test(normalized)) return false;
            if (/^(推荐|新品|潜力品|机会爆品)$/.test(normalized)) return false;
            return true;
        };

        const normalizeLayerGroupLabel = (label = '', optionText = '') => {
            const normalized = normalizeText(label);
            if (!normalized) return '';
            if (normalized === optionText) return '';
            if (normalized.includes(optionText) && optionText.length >= 4) return '';
            if (normalized.length > 26) return '';
            if (SCENE_SKIP_TEXT_RE.test(normalized)) return '';
            if (SCENE_LAYER_OPTION_SKIP_RE.test(normalized)) return '';
            if (SCENE_NAME_LIST.includes(normalized)) return '';
            return normalized;
        };

        const findLayerOptionContainer = (el, selectors = []) => {
            let cursor = el;
            for (let depth = 0; depth < 6 && cursor && cursor !== document.body; depth++) {
                const parent = cursor.parentElement;
                if (!parent) break;
                const rect = parent.getBoundingClientRect();
                if (rect.width < 120 || rect.width > 1300 || rect.height < 20 || rect.height > 340) {
                    cursor = parent;
                    continue;
                }
                let count = 0;
                selectors.forEach(selector => {
                    try {
                        count += parent.querySelectorAll(selector).length;
                    } catch { }
                });
                if (count >= 2) return parent;
                cursor = parent;
            }
            return el.parentElement || el;
        };

        const buildLayerCandidate = (el, type = 'button') => {
            if (!isElementVisible(el)) return null;
            const text = normalizeText(
                el.getAttribute?.('aria-label')
                || getOwnText(el)
                || el.textContent
                || findNearestLabelText(el)
            );
            if (!isValidLayerOptionText(text)) return null;
            const selectorList = type === 'radio'
                ? ['[role="radio"]', 'input[type="radio"]']
                : ['[role="tab"]', 'button', '[role="button"]'];
            const container = findLayerOptionContainer(el, selectorList);
            const containerLabel = normalizeText(findNearestLabelText(container) || '');
            const ownLabel = normalizeText(findNearestLabelText(el) || '');
            const groupLabel = normalizeLayerGroupLabel(containerLabel || ownLabel, text);
            const rect = (container || el).getBoundingClientRect();
            const groupKey = groupLabel || `${type}_${Math.round(rect.top / 28)}_${Math.round(rect.left / 80)}`;
            const clickEl = el.matches?.('input[type="radio"]')
                ? (el.closest('label,[role="radio"],button,[role="button"],div,span') || el)
                : (el.closest('[role="radio"],[role="tab"],button,[role="button"],label,div,span') || el);
            const selected = isLikelySelectedElement(el) || isLikelySelectedElement(container);
            const disabled = !!el.disabled
                || String(el.getAttribute?.('aria-disabled') || '') === 'true'
                || String(container?.getAttribute?.('aria-disabled') || '') === 'true';
            return {
                type,
                optionText: text,
                groupLabel,
                groupKey,
                selected,
                disabled,
                top: Math.round(rect.top),
                left: Math.round(rect.left),
                clickEl,
                el
            };
        };

        const collectLayerControlCandidates = (root) => {
            const targetRoot = root || pickPlanConfigRoot();
            const raw = [];
            Array.from(targetRoot.querySelectorAll('[role="radio"], input[type="radio"]')).forEach(el => {
                const candidate = buildLayerCandidate(el, 'radio');
                if (candidate) raw.push(candidate);
            });
            Array.from(targetRoot.querySelectorAll('[role="tab"], button, [role="button"]')).forEach(el => {
                const candidate = buildLayerCandidate(el, 'button');
                if (candidate) raw.push(candidate);
            });
            const dedup = new Map();
            raw.forEach(item => {
                const key = `${item.groupKey}::${item.optionText}`;
                const prev = dedup.get(key);
                if (!prev) {
                    dedup.set(key, item);
                    return;
                }
                if (!prev.selected && item.selected) {
                    dedup.set(key, item);
                    return;
                }
                if (prev.disabled && !item.disabled) {
                    dedup.set(key, item);
                }
            });
            return Array.from(dedup.values());
        };

        const collectLayerControlGroups = (root) => {
            const candidates = collectLayerControlCandidates(root);
            const groups = {};
            candidates.forEach(candidate => {
                if (!groups[candidate.groupKey]) {
                    groups[candidate.groupKey] = {
                        groupKey: candidate.groupKey,
                        groupLabel: candidate.groupLabel || '',
                        top: candidate.top,
                        left: candidate.left,
                        options: []
                    };
                }
                groups[candidate.groupKey].options.push({
                    optionText: candidate.optionText,
                    selected: !!candidate.selected,
                    disabled: !!candidate.disabled
                });
            });
            return Object.values(groups)
                .map(group => ({
                    ...group,
                    options: uniqueBy(group.options, item => item.optionText).slice(0, 12)
                }))
                .filter(group => group.options.length >= 2)
                .filter(group => {
                    const optionTextList = group.options.map(item => item.optionText);
                    const sceneOptionCount = optionTextList.filter(item => SCENE_NAME_LIST.includes(item)).length;
                    if (sceneOptionCount >= Math.min(4, SCENE_NAME_LIST.length - 1)) return false;
                    if (/场景名称/.test(group.groupLabel)) return false;
                    return true;
                })
                .sort((a, b) => (a.top - b.top) || (a.left - b.left));
        };

        const findLayerCandidateByStep = (step, root) => {
            const candidates = collectLayerControlCandidates(root);
            const targetText = normalizeText(step?.optionText || '');
            if (!targetText) return null;
            const normalizeMatchToken = (text = '') => normalizeText(text).replace(/[^\u4e00-\u9fa5a-zA-Z0-9]+/g, '').toLowerCase();
            const exact = candidates.filter(item => item.optionText === targetText);
            const matched = exact.length
                ? exact
                : candidates.filter(item => {
                    const candidateText = normalizeText(item?.optionText || '');
                    if (!candidateText) return false;
                    if (candidateText.includes(targetText) || targetText.includes(candidateText)) return true;
                    const compactCandidate = normalizeMatchToken(candidateText);
                    const compactTarget = normalizeMatchToken(targetText);
                    if (!compactCandidate || !compactTarget) return false;
                    return compactCandidate.includes(compactTarget) || compactTarget.includes(compactCandidate);
                });
            if (!matched.length) {
                const targetRoot = root || pickPlanConfigRoot();
                const cardCandidates = Array.from(targetRoot.querySelectorAll('[data-card*="_card_"]'))
                    .map(card => {
                        if (!isElementVisible(card)) return null;
                        const text = normalizeText(card.textContent || '');
                        if (!text) return null;
                        const compactCandidate = normalizeMatchToken(text);
                        const compactTarget = normalizeMatchToken(targetText);
                        if (!compactCandidate || !compactTarget) return null;
                        if (!compactCandidate.includes(compactTarget) && !compactTarget.includes(compactCandidate)) return null;
                        const labelText = normalizeText(findNearestLabelText(card) || '');
                        const rect = card.getBoundingClientRect();
                        return {
                            type: 'button',
                            optionText: targetText,
                            groupLabel: SCENE_GOAL_GROUP_HINT_RE.test(labelText) ? labelText : '营销目标',
                            groupKey: `data_card_${Math.round(rect.top / 24)}_${Math.round(rect.left / 80)}`,
                            selected: isLikelySelectedElement(card) || String(card.getAttribute('aria-checked') || '') === 'true',
                            disabled: String(card.getAttribute('aria-disabled') || '') === 'true',
                            top: Math.round(rect.top),
                            left: Math.round(rect.left),
                            clickEl: card.querySelector('label,[role="radio"],button,[role="button"],input[type="radio"]') || card,
                            el: card
                        };
                    })
                    .filter(Boolean)
                    .sort((a, b) => Number(a.disabled) - Number(b.disabled) || Number(a.selected) - Number(b.selected) || (a.top - b.top));
                return cardCandidates[0] || null;
            }
            const byGroupKey = step?.groupKey ? matched.filter(item => item.groupKey === step.groupKey) : [];
            const byGroupLabel = step?.groupLabel
                ? matched.filter(item => item.groupLabel === step.groupLabel || item.groupLabel.includes(step.groupLabel) || step.groupLabel.includes(item.groupLabel))
                : [];
            const list = (byGroupKey.length ? byGroupKey : (byGroupLabel.length ? byGroupLabel : matched)).slice();
            list.sort((a, b) => Number(a.disabled) - Number(b.disabled) || Number(a.selected) - Number(b.selected) || (a.top - b.top));
            return list[0] || null;
        };

        const clickLayerOptionByStep = async (step, options = {}) => {
            const root = pickPlanConfigRoot();
            const before = getCurrentSceneSignature();
            let candidate = findLayerCandidateByStep(step, root);
            if (!candidate) return false;
            if (candidate.disabled) return false;
            if (!candidate.selected) {
                clickElement(candidate.clickEl || candidate.el);
            }
            await sleep(Math.max(120, toNumber(options.layerClickDelay, 320)));
            await waitUntil(() => {
                const fresh = findLayerCandidateByStep(step, pickPlanConfigRoot());
                if (fresh && fresh.selected) return true;
                const current = getCurrentSceneSignature();
                return current && current !== before;
            }, Math.max(800, toNumber(options.layerWaitTimeout, 2800)), 140);
            await sleep(Math.max(100, toNumber(options.layerSettleDelay, 220)));
            candidate = findLayerCandidateByStep(step, pickPlanConfigRoot());
            return !!candidate;
        };

        const applySceneLayerPath = async (sceneName, layerPath = [], options = {}) => {
            await clickScene(sceneName, options);
            for (let i = 0; i < layerPath.length; i++) {
                const ok = await clickLayerOptionByStep(layerPath[i], options);
                if (!ok) {
                    const stepText = `${layerPath[i]?.groupLabel || '分组'} -> ${layerPath[i]?.optionText || ''}`;
                    throw new Error(`未找到层级选项：${stepText}`);
                }
            }
        };

        const mergeSceneSchema = (target, schema = {}) => {
            target.sectionTitles = uniqueBy((target.sectionTitles || []).concat((schema.sectionTitles || []).map(item => normalizeText(item))).filter(Boolean), item => item).slice(0, 220);
            target.sections = uniqueBy(
                (target.sections || []).concat((schema.sections || []).map(item => ({
                    title: normalizeText(item?.title || ''),
                    options: uniqueBy((item?.options || []).map(opt => normalizeText(opt)).filter(Boolean), opt => opt).slice(0, 24)
                }))).filter(item => item.title),
                item => `${item.title}::${(item.options || []).join('|')}`
            ).slice(0, 180);
            target.labels = uniqueBy((target.labels || []).concat((schema.labels || []).map(item => normalizeText(item))).filter(Boolean), item => item).slice(0, 260);
            target.radios = uniqueBy(
                (target.radios || []).concat((schema.radios || []).map(item => ({
                    label: normalizeText(item?.label || ''),
                    text: normalizeText(item?.text || ''),
                    value: normalizeText(item?.value || ''),
                    checked: !!item?.checked
                }))).filter(item => item.text),
                item => `${item.label}::${item.text}::${item.value}`
            ).slice(0, 320);
            target.checkboxes = uniqueBy(
                (target.checkboxes || []).concat((schema.checkboxes || []).map(item => ({
                    label: normalizeText(item?.label || ''),
                    text: normalizeText(item?.text || ''),
                    checked: !!item?.checked,
                    disabled: !!item?.disabled
                }))).filter(item => item.text),
                item => `${item.label}::${item.text}`
            ).slice(0, 220);
            target.selects = uniqueBy(
                (target.selects || []).concat((schema.selects || []).map(item => ({
                    label: normalizeText(item?.label || ''),
                    value: normalizeText(item?.value || ''),
                    options: uniqueBy((item?.options || []).map(opt => ({
                        label: normalizeText(opt?.label || ''),
                        value: normalizeText(opt?.value || ''),
                        selected: !!opt?.selected
                    })).filter(opt => opt.label || opt.value), opt => `${opt.label}::${opt.value}`).slice(0, 30)
                }))),
                item => `${item.label}::${item.value}::${(item.options || []).map(opt => `${opt.label}|${opt.value}`).join(',')}`
            ).slice(0, 120);
            target.inputs = uniqueBy(
                (target.inputs || []).concat((schema.inputs || []).map(item => ({
                    label: normalizeText(item?.label || ''),
                    type: normalizeText(item?.type || ''),
                    placeholder: normalizeText(item?.placeholder || ''),
                    value: normalizeText(item?.value || ''),
                    disabled: !!item?.disabled
                }))),
                item => `${item.label}::${item.type}::${item.placeholder}`
            ).slice(0, 240);
            target.buttonLikeOptions = uniqueBy((target.buttonLikeOptions || []).concat((schema.buttonLikeOptions || []).map(item => normalizeText(item))).filter(Boolean), item => item).slice(0, 260);
            target.optionGroups = uniqueBy(
                (target.optionGroups || []).concat((schema.optionGroups || []).map(item => ({
                    label: normalizeText(item?.label || ''),
                    options: uniqueBy((item?.options || []).map(opt => normalizeText(opt)).filter(Boolean), opt => opt).slice(0, 24)
                })).filter(item => item.options.length >= 2)),
                item => `${item.label}::${item.options.join('|')}`
            ).slice(0, 200);
            target.optionTexts = uniqueBy((target.optionTexts || []).concat((schema.optionTexts || []).map(item => normalizeText(item))).filter(Boolean), item => item).slice(0, 320);
            target.textSamples = uniqueBy((target.textSamples || []).concat((schema.textSamples || []).map(item => normalizeText(item))).filter(Boolean), item => item).slice(0, 500);
        };

        const scanCurrentSceneSettings = (sceneName = '', extra = {}) => {
            const root = pickPlanConfigRoot();
            const schema = collectControlSchemaFromRoot(root);
            return {
                ok: true,
                sceneName: String(sceneName || '').trim(),
                location: window.location.href,
                scannedAt: new Date().toISOString(),
                signature: getCurrentSceneSignature(),
                ...schema,
                ...extra
            };
        };

        const scanSceneLayeredSettings = async (sceneName = '', options = {}) => {
            const targetSceneName = String(sceneName || '').trim();
            const maxDepth = Math.max(1, Math.min(3, toNumber(options.layerMaxDepth, 3)));
            const maxGroupsPerLevel = Math.max(1, Math.min(6, toNumber(options.layerMaxGroupsPerLevel, 4)));
            const maxOptionsPerGroup = Math.max(1, Math.min(8, toNumber(options.layerMaxOptionsPerGroup, 5)));
            const maxSnapshots = Math.max(1, Math.min(60, toNumber(options.layerMaxSnapshots, 28)));
            const seenPathSet = new Set();
            const pathErrors = [];
            const routeSet = new Set();
            const snapshots = [];
            const aggregate = {
                ok: true,
                sceneName: targetSceneName,
                location: window.location.href,
                scannedAt: new Date().toISOString(),
                sectionTitles: [],
                sections: [],
                labels: [],
                radios: [],
                checkboxes: [],
                selects: [],
                inputs: [],
                buttonLikeOptions: [],
                optionGroups: [],
                optionTexts: [],
                textSamples: [],
                layerSnapshots: [],
                layerSummary: {}
            };

            const toPathText = (layerPath = []) => layerPath.length
                ? layerPath.map(step => `${step.groupLabel || '分组'}:${step.optionText || ''}`).join(' > ')
                : '(根层)';

            const scanPath = async (layerPath = []) => {
                if (snapshots.length >= maxSnapshots) return;
                const pathKey = layerPath.map(step => `${step.groupKey || ''}:${step.optionText || ''}`).join('>') || '__root__';
                if (seenPathSet.has(pathKey)) return;
                seenPathSet.add(pathKey);
                const depth = layerPath.length;

                try {
                    await applySceneLayerPath(targetSceneName, layerPath, options);
                } catch (err) {
                    pathErrors.push({
                        pathText: toPathText(layerPath),
                        error: err?.message || String(err)
                    });
                    if (typeof options.onProgress === 'function') {
                        try {
                            options.onProgress({
                                event: 'scene_layer_path_error',
                                sceneName: targetSceneName,
                                depth,
                                pathText: toPathText(layerPath),
                                error: err?.message || String(err)
                            });
                        } catch { }
                    }
                    return;
                }

                const snapshot = scanCurrentSceneSettings(targetSceneName, {
                    depth,
                    layerPath: layerPath.map(step => ({
                        groupKey: step.groupKey,
                        groupLabel: step.groupLabel,
                        optionText: step.optionText
                    })),
                    layerPathText: toPathText(layerPath)
                });
                snapshots.push(snapshot);
                mergeSceneSchema(aggregate, snapshot);
                routeSet.add(snapshot.location);
                if (typeof options.onProgress === 'function') {
                    try {
                        options.onProgress({
                            event: 'scene_layer_snapshot',
                            sceneName: targetSceneName,
                            depth,
                            pathText: snapshot.layerPathText,
                            snapshotIndex: snapshots.length,
                            maxSnapshots
                        });
                    } catch { }
                }

                if (depth >= maxDepth || snapshots.length >= maxSnapshots) return;
                const groups = collectLayerControlGroups(pickPlanConfigRoot())
                    .filter(group => !layerPath.some(step => step.groupKey === group.groupKey))
                    .slice(0, maxGroupsPerLevel);
                for (let gi = 0; gi < groups.length; gi++) {
                    const group = groups[gi];
                    const optionList = group.options
                        .filter(option => !option.disabled)
                        .slice(0, maxOptionsPerGroup);
                    for (let oi = 0; oi < optionList.length; oi++) {
                        if (snapshots.length >= maxSnapshots) return;
                        const option = optionList[oi];
                        const nextPath = layerPath.concat([{
                            groupKey: group.groupKey,
                            groupLabel: group.groupLabel,
                            optionText: option.optionText
                        }]);
                        await scanPath(nextPath);
                    }
                }
            };

            await scanPath([]);
            aggregate.layerSnapshots = snapshots.map(item => ({
                sceneName: item.sceneName,
                depth: item.depth,
                layerPath: item.layerPath || [],
                layerPathText: item.layerPathText || '',
                location: item.location,
                labels: item.labels || [],
                sectionTitles: item.sectionTitles || [],
                radios: item.radios || []
            }));
            aggregate.layerSummary = {
                maxDepth,
                maxGroupsPerLevel,
                maxOptionsPerGroup,
                maxSnapshots,
                snapshotCount: snapshots.length,
                exploredPathCount: seenPathSet.size,
                routeList: Array.from(routeSet),
                errorCount: pathErrors.length
            };
            if (pathErrors.length) {
                aggregate.layerErrors = pathErrors.slice(0, 30);
            }
            aggregate.location = window.location.href;
            aggregate.scannedAt = new Date().toISOString();
            return aggregate;
        };

        const scanAllSceneSettings = async (options = {}) => {
            const scenes = Array.isArray(options.scenes) && options.scenes.length
                ? uniqueBy(options.scenes.map(item => String(item || '').trim()).filter(Boolean), item => item)
                : SCENE_NAME_LIST.slice();
            const list = [];
            const beforeSignature = getCurrentSceneSignature();
            const useLayeredScan = options.layered !== false;

            for (let i = 0; i < scenes.length; i++) {
                const sceneName = scenes[i];
                try {
                    if (typeof options.onProgress === 'function') {
                        try { options.onProgress({ event: 'scene_start', index: i + 1, total: scenes.length, sceneName }); } catch { }
                    }
                    const scanned = useLayeredScan
                        ? await scanSceneLayeredSettings(sceneName, options)
                        : (await clickScene(sceneName, options), scanCurrentSceneSettings(sceneName));
                    list.push(scanned);
                    if (typeof options.onProgress === 'function') {
                        try {
                            options.onProgress({
                                event: 'scene_done',
                                index: i + 1,
                                total: scenes.length,
                                sceneName,
                                labels: (scanned.labels || []).length,
                                radios: (scanned.radios || []).length,
                                snapshots: scanned.layerSummary?.snapshotCount || 1
                            });
                        } catch { }
                    }
                } catch (err) {
                    list.push({
                        ok: false,
                        sceneName,
                        error: err?.message || String(err),
                        scannedAt: new Date().toISOString(),
                        location: window.location.href
                    });
                }
            }

            if (options.restoreSceneSignature && beforeSignature) {
                await waitUntil(() => getCurrentSceneSignature() === beforeSignature, 800, 200);
            }

            const result = {
                ok: list.every(item => item.ok),
                layered: useLayeredScan,
                sceneOrder: scenes,
                scannedAt: new Date().toISOString(),
                count: list.length,
                successCount: list.filter(item => item.ok).length,
                failCount: list.filter(item => !item.ok).length,
                list
            };

            window.__AM_WXT_LAST_SCENE_SCAN__ = result;
            if (options.copyToClipboard && navigator.clipboard?.writeText) {
                try {
                    await navigator.clipboard.writeText(JSON.stringify(result, null, 2));
                } catch { }
            }
            return result;
        };

        const normalizeSceneSpecFieldKey = (label = '') => {
            const text = String(label || '')
                .replace(/[：:]/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
            return text || 'field';
        };

        const isLikelyCriticalSceneField = (label = '') => /计划名称|计划名|预算|出价|目标|商品|关键词|人群|落地页|线索/.test(String(label || ''));

        const inferSceneFieldDependsOn = (label = '') => {
            const text = String(label || '');
            const deps = [];
            if (/关键词|核心词/.test(text)) deps.push('添加商品');
            if (/人群/.test(text)) deps.push('营销目标');
            if (/出价|预算|投放/.test(text)) deps.push('营销目标');
            if (/创意/.test(text)) deps.push('选择推广商品');
            return uniqueBy(deps, item => item);
        };

        const normalizeSceneSpecOptions = (options = {}) => {
            const scanMode = options.scanMode === 'visible' ? 'visible' : 'full_top_down';
            const unlockPolicy = ['auto_rollback', 'safe_only', 'manual'].includes(options.unlockPolicy)
                ? options.unlockPolicy
                : 'auto_rollback';
            const goalScan = options.goalScan === true
                || (options.goalScan !== false && scanMode === 'full_top_down');
            const goalFieldScan = options.goalFieldScan === true;
            const goalFieldScanMode = options.goalFieldScanMode === 'visible' ? 'visible' : 'full_top_down';
            return {
                scanMode,
                unlockPolicy,
                goalScan,
                goalFieldScan,
                goalFieldScanMode,
                goalFieldMaxDepth: Math.max(1, Math.min(4, toNumber(options.goalFieldMaxDepth, 2))),
                goalFieldMaxSnapshots: Math.max(1, Math.min(120, toNumber(options.goalFieldMaxSnapshots, 48))),
                goalFieldMaxGroupsPerLevel: Math.max(1, Math.min(10, toNumber(options.goalFieldMaxGroupsPerLevel, 6))),
                goalFieldMaxOptionsPerGroup: Math.max(1, Math.min(12, toNumber(options.goalFieldMaxOptionsPerGroup, 8))),
                maxDepth: Math.max(1, Math.min(4, toNumber(options.maxDepth, 3))),
                maxSnapshots: Math.max(1, Math.min(96, toNumber(options.maxSnapshots, 36))),
                maxGroupsPerLevel: Math.max(1, Math.min(8, toNumber(options.maxGroupsPerLevel, 5))),
                maxOptionsPerGroup: Math.max(1, Math.min(10, toNumber(options.maxOptionsPerGroup, 6))),
                waitMs: Math.max(300, toNumber(options.waitMs, 4200)),
                stabilizeMs: Math.max(120, toNumber(options.stabilizeMs, 420)),
                refresh: !!options.refresh,
                restore: options.restore !== false
            };
        };

        const buildSceneSpecCacheKey = (sceneName = '', bizCode = '') => {
            const scene = String(sceneName || '').trim();
            const biz = String(bizCode || '').trim();
            return `${scene}::${biz || 'unknown'}`;
        };

        const loadSceneSpecCache = () => {
            if (sceneSpecCache.loaded) return;
            sceneSpecCache.loaded = true;
            sceneSpecCache.map = {};
            try {
                const raw = sessionStorage.getItem(SCENE_SPEC_CACHE_STORAGE_KEY);
                if (!raw) return;
                const parsed = JSON.parse(raw);
                if (!isPlainObject(parsed)) return;
                Object.keys(parsed).forEach(key => {
                    const entry = parsed[key];
                    if (!isPlainObject(entry)) return;
                    const ts = toNumber(entry.ts, 0);
                    if (!ts || Date.now() - ts > SCENE_SPEC_CACHE_TTL_MS) return;
                    if (!isPlainObject(entry.data)) return;
                    sceneSpecCache.map[key] = {
                        ts,
                        data: entry.data
                    };
                });
            } catch { }
        };

        const persistSceneSpecCache = () => {
            try {
                sessionStorage.setItem(SCENE_SPEC_CACHE_STORAGE_KEY, JSON.stringify(sceneSpecCache.map || {}));
            } catch { }
        };

        const getCachedSceneSpec = (sceneName = '', bizCode = '') => {
            loadSceneSpecCache();
            const key = buildSceneSpecCacheKey(sceneName, bizCode);
            const entry = sceneSpecCache.map[key];
            if (!entry || !entry.ts || !entry.data) return null;
            if (Date.now() - entry.ts > SCENE_SPEC_CACHE_TTL_MS) {
                delete sceneSpecCache.map[key];
                persistSceneSpecCache();
                return null;
            }
            return deepClone(entry.data);
        };

        const setCachedSceneSpec = (sceneName = '', bizCode = '', spec = null) => {
            if (!sceneName || !isPlainObject(spec)) return;
            loadSceneSpecCache();
            const key = buildSceneSpecCacheKey(sceneName, bizCode);
            sceneSpecCache.map[key] = {
                ts: Date.now(),
                data: deepClone(spec)
            };
            persistSceneSpecCache();
        };

        const clearSceneSpecCache = (sceneName = '') => {
            loadSceneSpecCache();
            const targetScene = String(sceneName || '').trim();
            if (!targetScene) {
                sceneSpecCache.map = {};
                persistSceneSpecCache();
                return { ok: true, cleared: 'all' };
            }
            const keys = Object.keys(sceneSpecCache.map || {});
            let clearedCount = 0;
            keys.forEach(key => {
                if (!key.startsWith(`${targetScene}::`)) return;
                delete sceneSpecCache.map[key];
                clearedCount += 1;
            });
            persistSceneSpecCache();
            return { ok: true, cleared: targetScene, clearedCount };
        };

        const clearSceneCreateContractCache = (sceneName = '', goalLabel = '') => {
            loadSceneCreateContractCache();
            const targetScene = String(sceneName || '').trim();
            const targetGoal = normalizeGoalCandidateLabel(goalLabel || '');
            if (!targetScene && !targetGoal) {
                sceneCreateContractCache.map = {};
                persistSceneCreateContractCache();
                return { ok: true, cleared: 'all', clearedCount: 0 };
            }
            const keys = Object.keys(sceneCreateContractCache.map || {});
            let clearedCount = 0;
            keys.forEach(key => {
                const [scenePart, goalPartRaw] = String(key || '').split('::');
                const scenePartText = String(scenePart || '').trim();
                if (targetScene && scenePartText !== targetScene) return;
                const goalPart = String(goalPartRaw || '').trim();
                const normalizedGoalPart = goalPart === '__scene_default__'
                    ? ''
                    : normalizeGoalCandidateLabel(goalPart);
                if (targetGoal && normalizedGoalPart !== targetGoal) return;
                delete sceneCreateContractCache.map[key];
                clearedCount += 1;
            });
            persistSceneCreateContractCache();
            return {
                ok: true,
                clearedScene: targetScene || '',
                clearedGoal: targetGoal || '',
                clearedCount
            };
        };

        const loadSceneCreateContractCache = () => {
            if (sceneCreateContractCache.loaded) return;
            sceneCreateContractCache.loaded = true;
            sceneCreateContractCache.map = {};
            try {
                const raw = sessionStorage.getItem(SCENE_CREATE_CONTRACT_CACHE_STORAGE_KEY);
                if (!raw) return;
                const parsed = JSON.parse(raw);
                if (!isPlainObject(parsed)) return;
                Object.keys(parsed).forEach(key => {
                    const entry = parsed[key];
                    if (!isPlainObject(entry)) return;
                    const ts = toNumber(entry.ts, 0);
                    if (!ts || Date.now() - ts > SCENE_CREATE_CONTRACT_CACHE_TTL_MS) return;
                    const data = isPlainObject(entry.data) ? entry.data : null;
                    if (!data) return;
                    sceneCreateContractCache.map[key] = {
                        ts,
                        data
                    };
                });
            } catch { }
        };

        const persistSceneCreateContractCache = () => {
            try {
                sessionStorage.setItem(SCENE_CREATE_CONTRACT_CACHE_STORAGE_KEY, JSON.stringify(sceneCreateContractCache.map || {}));
            } catch { }
        };

        const buildSceneCreateContractCacheKey = (sceneName = '', goalLabel = '') => {
            const scene = String(sceneName || '').trim();
            const goal = normalizeGoalCandidateLabel(goalLabel || '');
            return `${scene}::${goal || '__scene_default__'}`;
        };

        const getCachedSceneCreateContract = (sceneName = '', goalLabel = '') => {
            loadSceneCreateContractCache();
            const key = buildSceneCreateContractCacheKey(sceneName, goalLabel);
            const entry = sceneCreateContractCache.map[key];
            if (!entry || !entry.ts || !isPlainObject(entry.data)) return null;
            if (Date.now() - entry.ts > SCENE_CREATE_CONTRACT_CACHE_TTL_MS) {
                delete sceneCreateContractCache.map[key];
                persistSceneCreateContractCache();
                return null;
            }
            return deepClone(entry.data);
        };

        const getSceneCreateContract = (sceneName = '', goalLabel = '') => {
            const targetScene = String(sceneName || inferCurrentSceneName() || '').trim();
            const targetGoal = normalizeGoalCandidateLabel(goalLabel || '');
            if (!targetScene) {
                return {
                    ok: false,
                    sceneName: '',
                    goalLabel: targetGoal || '',
                    contract: null,
                    error: '缺少 sceneName'
                };
            }
            const contract = getCachedSceneCreateContract(targetScene, targetGoal)
                || getCachedSceneCreateContract(targetScene, '');
            return {
                ok: !!contract,
                sceneName: targetScene,
                goalLabel: targetGoal || '',
                contract: contract ? deepClone(contract) : null,
                fallbackUsed: !targetGoal && !!contract,
                error: contract ? '' : 'scene_create_contract_not_cached'
            };
        };

        const setCachedSceneCreateContract = (sceneName = '', goalLabel = '', value = null) => {
            const scene = String(sceneName || '').trim();
            if (!scene || !isPlainObject(value)) return;
            loadSceneCreateContractCache();
            const key = buildSceneCreateContractCacheKey(scene, goalLabel);
            sceneCreateContractCache.map[key] = {
                ts: Date.now(),
                data: deepClone(value)
            };
            persistSceneCreateContractCache();
        };

        const loadSceneLifecycleContractCache = () => {
            if (sceneLifecycleContractCache.loaded) return;
            sceneLifecycleContractCache.loaded = true;
            sceneLifecycleContractCache.map = {};
            try {
                const raw = sessionStorage.getItem(SCENE_LIFECYCLE_CONTRACT_CACHE_STORAGE_KEY);
                if (!raw) return;
                const parsed = JSON.parse(raw);
                if (!isPlainObject(parsed)) return;
                Object.keys(parsed).forEach(key => {
                    const entry = parsed[key];
                    if (!isPlainObject(entry)) return;
                    const ts = toNumber(entry.ts, 0);
                    if (!ts || Date.now() - ts > SCENE_LIFECYCLE_CONTRACT_CACHE_TTL_MS) return;
                    const data = isPlainObject(entry.data) ? entry.data : null;
                    if (!data) return;
                    sceneLifecycleContractCache.map[key] = {
                        ts,
                        data
                    };
                });
            } catch { }
        };

        const persistSceneLifecycleContractCache = () => {
            try {
                sessionStorage.setItem(SCENE_LIFECYCLE_CONTRACT_CACHE_STORAGE_KEY, JSON.stringify(sceneLifecycleContractCache.map || {}));
            } catch { }
        };

        const buildSceneLifecycleContractCacheKey = (sceneName = '', action = '') => {
            const scene = String(sceneName || '').trim();
            const normalizedAction = normalizeLifecycleAction(action);
            return `${scene}::${normalizedAction}`;
        };

        const getCachedSceneLifecycleContract = (sceneName = '', action = '') => {
            const scene = String(sceneName || '').trim();
            const normalizedAction = normalizeLifecycleAction(action);
            if (!scene || !normalizedAction) return null;
            loadSceneLifecycleContractCache();
            const key = buildSceneLifecycleContractCacheKey(scene, normalizedAction);
            const entry = sceneLifecycleContractCache.map[key];
            if (!entry || !entry.ts || !isPlainObject(entry.data)) return null;
            if (Date.now() - entry.ts > SCENE_LIFECYCLE_CONTRACT_CACHE_TTL_MS) {
                delete sceneLifecycleContractCache.map[key];
                persistSceneLifecycleContractCache();
                return null;
            }
            if (!isLifecycleContractUsable(normalizedAction, entry.data)) {
                delete sceneLifecycleContractCache.map[key];
                persistSceneLifecycleContractCache();
                return null;
            }
            return deepClone(entry.data);
        };

        const setCachedSceneLifecycleContract = (sceneName = '', action = '', contract = null) => {
            const scene = String(sceneName || '').trim();
            const normalizedAction = normalizeLifecycleAction(action);
            if (!scene || !normalizedAction || !isPlainObject(contract)) return;
            if (!isLifecycleContractUsable(normalizedAction, contract)) return;
            loadSceneLifecycleContractCache();
            const key = buildSceneLifecycleContractCacheKey(scene, normalizedAction);
            sceneLifecycleContractCache.map[key] = {
                ts: Date.now(),
                data: deepClone(contract)
            };
            persistSceneLifecycleContractCache();
        };

        const clearLifecycleContractCache = (sceneName = '') => {
            loadSceneLifecycleContractCache();
            const targetScene = String(sceneName || '').trim();
            if (!targetScene) {
                sceneLifecycleContractCache.map = {};
                persistSceneLifecycleContractCache();
                return { ok: true, cleared: 'all', clearedCount: 0 };
            }
            let clearedCount = 0;
            Object.keys(sceneLifecycleContractCache.map || {}).forEach(key => {
                if (!key.startsWith(`${targetScene}::`)) return;
                delete sceneLifecycleContractCache.map[key];
                clearedCount += 1;
            });
            persistSceneLifecycleContractCache();
            return {
                ok: true,
                cleared: targetScene,
                clearedCount
            };
        };

        const getLifecycleContract = (sceneName = '', action = '', options = {}) => {
            const targetScene = String(sceneName || inferCurrentSceneName() || '').trim();
            const normalizedAction = normalizeLifecycleAction(action);
            if (!targetScene || !normalizedAction) {
                return {
                    ok: false,
                    sceneName: targetScene || '',
                    action: normalizedAction || '',
                    contract: null,
                    error: !targetScene ? '缺少 sceneName' : '缺少 action'
                };
            }
            const direct = getCachedSceneLifecycleContract(targetScene, normalizedAction);
            if (direct) {
                return {
                    ok: true,
                    sceneName: targetScene,
                    action: normalizedAction,
                    contract: direct,
                    fallbackUsed: false,
                    error: ''
                };
            }
            const fallbackContract = getFallbackLifecycleContract(targetScene, normalizedAction);
            if (fallbackContract) {
                setCachedSceneLifecycleContract(targetScene, normalizedAction, fallbackContract);
                return {
                    ok: true,
                    sceneName: targetScene,
                    action: normalizedAction,
                    contract: fallbackContract,
                    fallbackUsed: true,
                    error: ''
                };
            }
            if (normalizedAction === 'create') {
                const createContract = getSceneCreateContract(targetScene, options.goalLabel || '');
                if (createContract?.ok && createContract.contract) {
                    const normalized = {
                        sceneName: targetScene,
                        action: 'create',
                        method: normalizeCaptureMethod(createContract.contract.method || 'POST'),
                        endpoint: normalizeCapturePath(createContract.contract.endpoint || ''),
                        requestKeys: Array.isArray(createContract.contract.requestKeys) ? createContract.contract.requestKeys.slice(0, 320) : [],
                        requestKeyPaths: Array.isArray(createContract.contract.requestKeyPaths) ? createContract.contract.requestKeyPaths.slice(0, 1600) : [],
                        queryKeys: [],
                        bodyKeys: Array.isArray(createContract.contract.requestKeys) ? createContract.contract.requestKeys.slice(0, 320) : [],
                        bodyKeyPaths: Array.isArray(createContract.contract.requestKeyPaths) ? createContract.contract.requestKeyPaths.slice(0, 1600) : [],
                        responseShape: {},
                        sampleBody: null,
                        count: toNumber(createContract.contract.count, 0),
                        source: normalizeText(createContract.contract.source || 'scene_create_contract_cache'),
                        sampledAt: createContract.contract.sampledAt || new Date().toISOString()
                    };
                    setCachedSceneLifecycleContract(targetScene, 'create', normalized);
                    return {
                        ok: true,
                        sceneName: targetScene,
                        action: normalizedAction,
                        contract: normalized,
                        fallbackUsed: true,
                        error: ''
                    };
                }
            }
            return {
                ok: false,
                sceneName: targetScene,
                action: normalizedAction,
                contract: null,
                error: 'lifecycle_contract_not_cached'
            };
        };

        const collectTopDownSections = (root) => {
            if (!root) return [];
            const entries = collectVisibleTextEntries(root);
            const dedup = new Map();
            entries.forEach(entry => {
                const text = normalizeText(entry?.text || '');
                if (!text) return;
                if (SCENE_NAME_LIST.includes(text)) return;
                const likelySection = isLikelySectionTitle(text) || SCENE_SECTION_HINT_RE.test(text);
                if (!likelySection) return;
                if (SCENE_SKIP_TEXT_RE.test(text)) return;
                if (!dedup.has(text)) {
                    dedup.set(text, {
                        title: text,
                        top: entry.top,
                        left: entry.left
                    });
                } else {
                    const prev = dedup.get(text);
                    if (entry.top < prev.top) {
                        dedup.set(text, {
                            title: text,
                            top: entry.top,
                            left: entry.left
                        });
                    }
                }
            });
            const list = Array.from(dedup.values())
                .sort((a, b) => (a.top - b.top) || (a.left - b.left))
                .slice(0, 36);
            if (!list.length) {
                return [{
                    title: '页面根层',
                    top: Math.round(root.getBoundingClientRect().top || 0),
                    left: Math.round(root.getBoundingClientRect().left || 0),
                    bottom: Math.round((root.getBoundingClientRect().bottom || 0))
                }];
            }
            return list.map((item, idx) => ({
                ...item,
                bottom: idx < list.length - 1 ? list[idx + 1].top - 1 : Number.MAX_SAFE_INTEGER
            }));
        };

        const resolveGroupSection = (group = {}, sections = []) => {
            if (!Array.isArray(sections) || !sections.length) return '页面根层';
            const top = toNumber(group?.top, NaN);
            if (!Number.isFinite(top)) return sections[0].title;
            const matched = sections.find(section => top >= section.top && top <= section.bottom);
            return matched?.title || sections[sections.length - 1].title;
        };

        const toLayerPathText = (layerPath = []) => layerPath.length
            ? layerPath.map(step => `${step.groupLabel || '分组'}:${step.optionText || ''}`).join(' > ')
            : '(根层)';

        const normalizeSnapshotLayerPath = (layerPath = []) => (Array.isArray(layerPath) ? layerPath : []).map(step => ({
            groupKey: step?.groupKey || '',
            groupLabel: step?.groupLabel || '',
            optionText: step?.optionText || ''
        }));

        const captureEditableState = (root) => {
            if (!root) return [];
            const controls = Array.from(root.querySelectorAll('input,textarea,select'))
                .filter(el => isElementVisible(el) && !el.disabled)
                .slice(0, 240);
            return controls.map(el => ({
                el,
                tag: el.tagName.toLowerCase(),
                type: String(el.type || '').toLowerCase(),
                label: findNearestLabelText(el),
                placeholder: normalizeText(el.getAttribute?.('placeholder') || ''),
                value: String(el.value ?? ''),
                checked: !!el.checked
            }));
        };

        const dispatchControlEvents = (el) => {
            try { el.dispatchEvent(new Event('input', { bubbles: true })); } catch { }
            try { el.dispatchEvent(new Event('change', { bubbles: true })); } catch { }
            try { el.dispatchEvent(new Event('blur', { bubbles: true })); } catch { }
        };

        const restoreEditableState = (stateList = []) => {
            if (!Array.isArray(stateList) || !stateList.length) return 0;
            let restoreCount = 0;
            stateList.forEach(item => {
                const el = item?.el;
                if (!el || !el.isConnected || el.disabled) return;
                try {
                    if (item.tag === 'input' && (item.type === 'checkbox' || item.type === 'radio')) {
                        if (el.checked !== !!item.checked) {
                            el.checked = !!item.checked;
                            dispatchControlEvents(el);
                            restoreCount += 1;
                        }
                        return;
                    }
                    const nextValue = String(item.value ?? '');
                    if (String(el.value ?? '') !== nextValue) {
                        el.value = nextValue;
                        dispatchControlEvents(el);
                        restoreCount += 1;
                    }
                } catch { }
            });
            return restoreCount;
        };

        const setInputValue = (el, value) => {
            if (!el || el.disabled) return false;
            const nextValue = String(value ?? '');
            if (String(el.value ?? '') === nextValue) return false;
            el.value = nextValue;
            dispatchControlEvents(el);
            return true;
        };

        const autoFillMinimumInputs = (root, sceneName = '') => {
            if (!root) return [];
            const actions = [];
            const inputs = Array.from(root.querySelectorAll('input:not([type="radio"]):not([type="checkbox"]):not([type="hidden"]), textarea'))
                .filter(el => isElementVisible(el) && !el.disabled)
                .slice(0, 120);
            inputs.forEach(el => {
                const label = normalizeText(findNearestLabelText(el));
                const placeholder = normalizeText(el.getAttribute?.('placeholder') || '');
                const token = `${label} ${placeholder}`;
                const current = String(el.value || '').trim();
                if (!current && /预算/.test(token)) {
                    if (setInputValue(el, '100')) {
                        actions.push({ type: 'fill_input', field: label || placeholder || '预算', value: '100' });
                    }
                    return;
                }
                if (!current && /(计划名称|计划名)/.test(token)) {
                    const value = `${sceneName || '计划'}_${todayStamp()}`;
                    if (setInputValue(el, value)) {
                        actions.push({ type: 'fill_input', field: label || placeholder || '计划名称', value });
                    }
                }
            });
            return actions;
        };

        const findSafeClickTargetByText = (pattern) => {
            if (!pattern) return null;
            const matcher = pattern instanceof RegExp ? pattern : new RegExp(String(pattern || ''));
            const elements = Array.from(document.querySelectorAll('button,[role="button"],a,div,span'))
                .filter(isElementVisible);
            for (const el of elements) {
                const text = normalizeText(getOwnText(el) || el.textContent || el.getAttribute?.('aria-label') || '');
                if (!text) continue;
                if (SCENE_FORBIDDEN_ACTION_RE.test(text)) continue;
                if (!matcher.test(text)) continue;
                return el;
            }
            return null;
        };

        const tryTemporaryAddItem = async (sceneName = '', scanOptions = {}) => {
            const beforeIds = extractPageAddedItemIds();
            if (!isSceneLikelyRequireItem(sceneName) || beforeIds.length) {
                return {
                    beforeIds,
                    afterIds: beforeIds.slice(),
                    tempIds: [],
                    actions: []
                };
            }
            const actions = [];
            const addBtn = findSafeClickTargetByText(/^(\+)?\s*添加商品(\s*\d+\s*\/\s*\d+)?$/);
            if (!addBtn) {
                return {
                    beforeIds,
                    afterIds: beforeIds.slice(),
                    tempIds: [],
                    actions
                };
            }

            clickElement(addBtn);
            actions.push({ type: 'click', text: '添加商品' });
            await waitForDomStable(scanOptions);

            const checkbox = Array.from(document.querySelectorAll('input[type="checkbox"]'))
                .find(el => isElementVisible(el) && !el.disabled && !el.checked);
            if (checkbox) {
                clickElement(checkbox.closest('label,[role="checkbox"],span,div') || checkbox);
                actions.push({ type: 'click', text: '勾选候选商品' });
                await sleep(140);
            }

            const confirmBtn = findSafeClickTargetByText(/^(确认添加|确定|完成|加入计划|加入投放|添加)$/);
            if (confirmBtn) {
                clickElement(confirmBtn);
                actions.push({ type: 'click', text: normalizeText(confirmBtn.textContent || '确认添加') });
                await waitForDomStable(scanOptions);
            }

            const afterIds = extractPageAddedItemIds();
            const tempIds = afterIds.filter(id => !beforeIds.includes(id));
            return {
                beforeIds,
                afterIds,
                tempIds,
                actions
            };
        };

        const rollbackTemporaryItems = async (unlockState = {}, scanOptions = {}) => {
            const beforeIds = Array.isArray(unlockState?.beforeIds) ? unlockState.beforeIds : [];
            const tempIds = Array.isArray(unlockState?.tempIds) ? unlockState.tempIds : [];
            if (beforeIds.length || !tempIds.length) return 0;
            let removed = 0;
            for (let i = 0; i < tempIds.length; i++) {
                const removeBtn = findSafeClickTargetByText(/^(移除|删除)$/);
                if (!removeBtn) break;
                clickElement(removeBtn);
                removed += 1;
                await sleep(120);
                const confirmBtn = findSafeClickTargetByText(/^(确定|确认|删除)$/);
                if (confirmBtn) clickElement(confirmBtn);
                await waitForDomStable(scanOptions);
            }
            return removed;
        };

        const scanSceneTopDownSettings = async (sceneName = '', options = {}) => {
            const targetSceneName = String(sceneName || '').trim();
            const maxDepth = Math.max(1, Math.min(4, toNumber(options.maxDepth, 3)));
            const maxGroupsPerLevel = Math.max(1, Math.min(8, toNumber(options.maxGroupsPerLevel, 5)));
            const maxOptionsPerGroup = Math.max(1, Math.min(10, toNumber(options.maxOptionsPerGroup, 6)));
            const maxSnapshots = Math.max(1, Math.min(96, toNumber(options.maxSnapshots, 36)));
            const baseLayerPath = normalizeSnapshotLayerPath(
                Array.isArray(options.baseLayerPath) ? options.baseLayerPath : []
            );
            const baseLayerPathText = toLayerPathText(baseLayerPath);
            const seenPathSet = new Set();
            const pathErrors = [];
            const routeSet = new Set();
            const snapshots = [];
            const sectionTrails = [];
            const aggregate = {
                ok: true,
                sceneName: targetSceneName,
                location: window.location.href,
                scannedAt: new Date().toISOString(),
                sectionTitles: [],
                sections: [],
                labels: [],
                radios: [],
                checkboxes: [],
                selects: [],
                inputs: [],
                buttonLikeOptions: [],
                optionGroups: [],
                optionTexts: [],
                textSamples: [],
                layerSnapshots: [],
                layerSummary: {},
                sectionTraversal: []
            };

            const pushSnapshot = (sectionTitle = '', layerPath = []) => {
                const snapshot = scanCurrentSceneSettings(targetSceneName, {
                    depth: layerPath.length,
                    sectionTitle: sectionTitle || '',
                    layerPath: normalizeSnapshotLayerPath(layerPath),
                    layerPathText: toLayerPathText(layerPath),
                    triggerPath: toLayerPathText(layerPath)
                });
                snapshots.push(snapshot);
                mergeSceneSchema(aggregate, snapshot);
                routeSet.add(snapshot.location);
                sectionTrails.push({
                    sectionTitle: sectionTitle || '',
                    pathText: snapshot.layerPathText || '(根层)',
                    depth: layerPath.length
                });
                if (typeof options.onProgress === 'function') {
                    try {
                        options.onProgress({
                            event: 'scene_top_down_snapshot',
                            sceneName: targetSceneName,
                            sectionTitle: sectionTitle || '',
                            depth: layerPath.length,
                            pathText: snapshot.layerPathText,
                            snapshotIndex: snapshots.length,
                            maxSnapshots
                        });
                    } catch { }
                }
            };

            const scanPath = async (sectionTitle = '', layerPath = []) => {
                if (snapshots.length >= maxSnapshots) return;
                const effectivePath = baseLayerPath.concat(layerPath);
                const pathKey = `${sectionTitle || '根层'}::${effectivePath.map(step => `${step.groupKey || ''}:${step.optionText || ''}`).join('>') || '__root__'}`;
                if (seenPathSet.has(pathKey)) return;
                seenPathSet.add(pathKey);
                const depth = layerPath.length;

                try {
                    await applySceneLayerPath(targetSceneName, effectivePath, options);
                    await waitForDomStable(options);
                } catch (err) {
                    pathErrors.push({
                        sectionTitle,
                        pathText: toLayerPathText(effectivePath),
                        error: err?.message || String(err)
                    });
                    return;
                }

                pushSnapshot(sectionTitle, effectivePath);
                if (depth >= maxDepth || snapshots.length >= maxSnapshots) return;

                const root = pickPlanConfigRoot();
                const sections = collectTopDownSections(root);
                const usedGroupKeys = new Set(effectivePath.map(step => String(step?.groupKey || '')).filter(Boolean));
                const nextGroups = collectLayerControlGroups(root)
                    .filter(group => !usedGroupKeys.has(String(group?.groupKey || '')))
                    .filter(group => {
                        if (!sectionTitle || depth > 0) return true;
                        return resolveGroupSection(group, sections) === sectionTitle;
                    })
                    .slice(0, maxGroupsPerLevel);
                for (let gi = 0; gi < nextGroups.length; gi++) {
                    const group = nextGroups[gi];
                    const optionList = group.options
                        .filter(option => !option.disabled && !SCENE_FORBIDDEN_ACTION_RE.test(option.optionText || ''))
                        .slice(0, maxOptionsPerGroup);
                    for (let oi = 0; oi < optionList.length; oi++) {
                        if (snapshots.length >= maxSnapshots) return;
                        const option = optionList[oi];
                        const nextPath = layerPath.concat([{
                            groupKey: group.groupKey,
                            groupLabel: group.groupLabel,
                            optionText: option.optionText
                        }]);
                        await scanPath(sectionTitle, nextPath);
                    }
                }
            };

            await ensureSceneRoute(targetSceneName, options);
            await waitForDomStable(options);
            if (baseLayerPath.length) {
                try {
                    await applySceneLayerPath(targetSceneName, baseLayerPath, options);
                    await waitForDomStable(options);
                } catch (err) {
                    pathErrors.push({
                        sectionTitle: '页面根层',
                        pathText: baseLayerPathText,
                        error: err?.message || String(err)
                    });
                }
            }
            const root = pickPlanConfigRoot();
            const sections = collectTopDownSections(root);
            pushSnapshot('页面根层', baseLayerPath);
            const groups = collectLayerControlGroups(root);
            const baseGroupSet = new Set(baseLayerPath.map(step => String(step?.groupKey || '')).filter(Boolean));
            for (let si = 0; si < sections.length; si++) {
                const section = sections[si];
                const sectionGroups = groups
                    .filter(group => !baseGroupSet.has(String(group?.groupKey || '')))
                    .filter(group => resolveGroupSection(group, sections) === section.title)
                    .slice(0, maxGroupsPerLevel);
                for (let gi = 0; gi < sectionGroups.length; gi++) {
                    if (snapshots.length >= maxSnapshots) break;
                    const group = sectionGroups[gi];
                    const optionList = group.options
                        .filter(option => !option.disabled && !SCENE_FORBIDDEN_ACTION_RE.test(option.optionText || ''))
                        .slice(0, maxOptionsPerGroup);
                    for (let oi = 0; oi < optionList.length; oi++) {
                        if (snapshots.length >= maxSnapshots) break;
                        const option = optionList[oi];
                        await scanPath(section.title, [{
                            groupKey: group.groupKey,
                            groupLabel: group.groupLabel,
                            optionText: option.optionText
                        }]);
                    }
                }
                if (snapshots.length >= maxSnapshots) break;
            }

            aggregate.layerSnapshots = snapshots.map(item => ({
                sceneName: item.sceneName,
                depth: item.depth,
                sectionTitle: item.sectionTitle || '',
                layerPath: item.layerPath || [],
                layerPathText: item.layerPathText || '',
                triggerPath: item.triggerPath || '',
                location: item.location,
                labels: item.labels || [],
                sectionTitles: item.sectionTitles || [],
                radios: item.radios || [],
                selects: item.selects || [],
                inputs: item.inputs || []
            }));
            aggregate.sectionTraversal = sectionTrails.slice(0, 240);
            aggregate.layerSummary = {
                mode: 'full_top_down',
                maxDepth,
                maxGroupsPerLevel,
                maxOptionsPerGroup,
                maxSnapshots,
                snapshotCount: snapshots.length,
                exploredPathCount: seenPathSet.size,
                baseLayerPath: deepClone(baseLayerPath),
                baseLayerPathText,
                routeList: Array.from(routeSet),
                errorCount: pathErrors.length,
                sectionCount: sections.length
            };
            if (pathErrors.length) {
                aggregate.layerErrors = pathErrors.slice(0, 60);
            }
            aggregate.location = window.location.href;
            aggregate.scannedAt = new Date().toISOString();
            return aggregate;
        };

        const pickGoalRuntimeSnapshot = (runtime = {}) => {
            const campaign = runtime?.solutionTemplate?.campaign || {};
            const storeData = runtime?.storeData || {};
            const out = {};
            SCENE_GOAL_RUNTIME_KEYS.forEach(key => {
                const fromStore = storeData?.[key];
                const fromCampaign = campaign?.[key];
                const fromRuntime = runtime?.[key];
                const picked = fromStore !== undefined && fromStore !== null && fromStore !== ''
                    ? fromStore
                    : (fromCampaign !== undefined && fromCampaign !== null && fromCampaign !== ''
                        ? fromCampaign
                        : fromRuntime);
                if (picked === undefined || picked === null || picked === '') return;
                out[key] = deepClone(picked);
            });
            return out;
        };

        const normalizeGoalCreateEndpoint = (path = '') => {
            const raw = String(path || '').trim();
            const normalized = normalizeCapturePath(raw);
            // 空值在 URL 归一化后会变成 "/"，需要视为无效并回退。
            if (!raw || !normalized || normalized === '/') return SCENE_CREATE_ENDPOINT_FALLBACK;
            if (!/\/solution\/.+addList\.json$/i.test(normalized)) return normalized;
            return normalized;
        };
        const normalizeCapturedCreateEndpoint = (path = '') => {
            const raw = String(path || '').trim();
            const normalized = normalizeCapturePath(raw);
            if (!raw || !normalized || normalized === '/') return '';
            return normalized;
        };

        const buildGoalCreateContract = ({ runtime = {}, loadContracts = [], networkOnly = false } = {}) => {
            const runtimeCampaign = purgeCreateTransientFields(sanitizeCampaign(runtime?.solutionTemplate?.campaign || {}));
            const runtimeAdgroup = purgeCreateTransientFields(sanitizeAdgroup(runtime?.solutionTemplate?.adgroupList?.[0] || {}));
            const mergedContracts = mergeContractSummaries(loadContracts || []);
            const createCapture = pickGoalCreateSubmitContract(mergedContracts);
            const endpoint = normalizeGoalCreateEndpoint(
                createCapture?.path
                || resolveGoalCreateEndpoint(mergedContracts)
                || SCENE_CREATE_ENDPOINT_FALLBACK
            );
            const payloadSample = findSolutionPayloadFromSample(createCapture?.sampleBody || null);
            const requestBody = isPlainObject(payloadSample.requestBody) ? payloadSample.requestBody : {};
            const sampledSolution = isPlainObject(payloadSample.solution) ? payloadSample.solution : {};
            const sampledCampaign = isPlainObject(sampledSolution.campaign) ? sampledSolution.campaign : {};
            const sampledAdgroup = Array.isArray(sampledSolution.adgroupList) && isPlainObject(sampledSolution.adgroupList[0])
                ? sampledSolution.adgroupList[0]
                : {};
            const campaign = Object.keys(sampledCampaign).length
                ? purgeCreateTransientFields(sanitizeCampaign(sampledCampaign))
                : (networkOnly ? {} : runtimeCampaign);
            const adgroup = Object.keys(sampledAdgroup).length
                ? purgeCreateTransientFields(sanitizeAdgroup(sampledAdgroup))
                : (networkOnly ? {} : runtimeAdgroup);
            const requestKeys = Object.keys(requestBody || {}).slice(0, 240);
            const solutionKeys = Object.keys(sampledSolution || {}).slice(0, 240);
            const requestKeyPaths = flattenCaptureKeyPaths(requestBody, {
                maxDepth: 10,
                maxPaths: 1800,
                maxArrayItems: 3
            });
            const solutionKeyPaths = flattenCaptureKeyPaths(sampledSolution, {
                maxDepth: 10,
                maxPaths: 1400,
                maxArrayItems: 3
            });
            const campaignKeyPaths = flattenCaptureKeyPaths(campaign, {
                maxDepth: 10,
                maxPaths: 1200,
                maxArrayItems: 3
            });
            const adgroupKeyPaths = flattenCaptureKeyPaths(adgroup, {
                maxDepth: 10,
                maxPaths: 1200,
                maxArrayItems: 3
            });
            if (networkOnly && !createCapture) {
                return {
                    endpoint: '',
                    method: 'POST',
                    requestKeys: [],
                    requestKeyPaths: [],
                    solutionKeys: [],
                    solutionKeyPaths: [],
                    campaignKeys: [],
                    campaignKeyPaths: [],
                    adgroupKeys: [],
                    adgroupKeyPaths: [],
                    defaultCampaign: {},
                    defaultAdgroup: {},
                    source: 'network_missing'
                };
            }
            return {
                endpoint,
                method: normalizeCaptureMethod(createCapture?.method || 'POST'),
                requestKeys: requestKeys.length
                    ? requestKeys
                    : (Array.isArray(createCapture?.bodyKeys) ? createCapture.bodyKeys.slice(0, 240) : ['bizCode', 'solutionList']),
                requestKeyPaths: requestKeyPaths.length
                    ? requestKeyPaths
                    : (Array.isArray(createCapture?.bodyKeyPaths) ? createCapture.bodyKeyPaths.slice(0, 1600) : []),
                solutionKeys: solutionKeys.length
                    ? solutionKeys
                    : (networkOnly ? [] : ['bizCode', 'campaign', 'adgroupList']),
                solutionKeyPaths: solutionKeyPaths.slice(0, 1400),
                campaignKeys: Object.keys(campaign || {}).slice(0, 240),
                campaignKeyPaths: campaignKeyPaths.slice(0, 1200),
                adgroupKeys: Object.keys(adgroup || {}).slice(0, 240),
                adgroupKeyPaths: adgroupKeyPaths.slice(0, 1200),
                defaultCampaign: deepClone(campaign || {}),
                defaultAdgroup: deepClone(adgroup || {}),
                source: createCapture ? 'network_capture' : (networkOnly ? 'network_missing' : 'runtime_fallback')
            };
        };

        const normalizeGoalFieldRows = (fieldRows = []) => uniqueBy(
            (Array.isArray(fieldRows) ? fieldRows : [])
                .map(field => {
                    const label = normalizeText(field?.label || field?.settingKey || '');
                    if (!label) return null;
                    const options = uniqueBy(
                        (Array.isArray(field?.options) ? field.options : [])
                            .map(item => normalizeText(item))
                            .filter(Boolean),
                        item => item
                    ).slice(0, 48);
                    return {
                        key: normalizeSceneSpecFieldKey(label),
                        label,
                        options,
                        defaultValue: normalizeSceneSettingValue(field?.defaultValue || ''),
                        dependsOn: uniqueBy((Array.isArray(field?.dependsOn) ? field.dependsOn : []).map(item => normalizeText(item)).filter(Boolean), item => item).slice(0, 16),
                        requiredGuess: !!field?.requiredGuess,
                        criticalGuess: !!field?.criticalGuess,
                        triggerPath: normalizeText(field?.triggerPath || ''),
                        pathHints: uniqueBy((Array.isArray(field?.pathHints) ? field.pathHints : []).map(item => normalizeText(item)).filter(Boolean), item => item).slice(0, 18),
                        source: uniqueBy((Array.isArray(field?.source) ? field.source : []).map(item => normalizeText(item)).filter(Boolean), item => item).slice(0, 18)
                    };
                })
                .filter(Boolean),
            item => `${item.key}::${item.label}`
        ).slice(0, 320);

        const buildGoalFieldRowsFromSceneScan = ({
            sceneName = '',
            runtime = {},
            scanResult = null,
            scanOptions = {}
        } = {}) => {
            const sceneSpec = buildSceneSpecFromScan({
                sceneName,
                runtime,
                scanResult,
                scanMeta: {
                    scanMode: scanOptions?.scanMode || 'full_top_down',
                    unlockPolicy: scanOptions?.unlockPolicy || 'safe_only',
                    goalSpecs: [],
                    goalWarnings: [],
                    unlockActions: [],
                    warnings: []
                }
            });
            const fieldRows = normalizeGoalFieldRows(sceneSpec?.fields || []);
            const fieldMatrix = fieldRows.reduce((acc, row) => {
                acc[row.label] = {
                    options: row.options.slice(0, 48),
                    defaultValue: row.defaultValue || '',
                    requiredGuess: !!row.requiredGuess,
                    criticalGuess: !!row.criticalGuess,
                    dependsOn: row.dependsOn.slice(0, 16),
                    triggerPath: row.triggerPath || ''
                };
                return acc;
            }, {});
            return {
                fieldRows,
                fieldMatrix,
                sectionOrder: Array.isArray(sceneSpec?.sectionOrder) ? sceneSpec.sectionOrder.slice(0, 80) : [],
                fieldCoverage: {
                    fieldCount: fieldRows.length,
                    optionCount: fieldRows.reduce((sum, row) => sum + (Array.isArray(row.options) ? row.options.length : 0), 0),
                    requiredCount: fieldRows.filter(row => row.requiredGuess).length,
                    criticalCount: fieldRows.filter(row => row.criticalGuess).length,
                    sectionCount: toNumber(sceneSpec?.coverage?.sectionCount, 0),
                    snapshotCount: toNumber(sceneSpec?.coverage?.snapshotCount, 0),
                    scanMode: sceneSpec?.scanMode || scanOptions?.scanMode || 'full_top_down'
                }
            };
        };

        const buildGoalSpecFromOption = ({
            option = {},
            runtime = {},
            loadContracts = [],
            triggerPath = '',
            contractMode = '',
            fieldRows = [],
            fieldMatrix = {},
            fieldCoverage = {},
            sectionOrder = []
        } = {}) => {
            const goalLabel = normalizeGoalCandidateLabel(option?.goalLabel || option?.optionText || '');
            const runtimeSnapshot = pickGoalRuntimeSnapshot(runtime);
            const createContract = buildGoalCreateContract({
                runtime,
                loadContracts,
                networkOnly: contractMode === 'network_only'
            });
            return {
                goalKey: normalizeGoalKey(goalLabel || option?.optionText || ''),
                goalLabel: goalLabel || normalizeGoalCandidateLabel(option?.goalLabel || option?.optionText || ''),
                isDefault: !!option?.selected,
                runtimeSnapshot,
                createContract,
                loadContracts,
                triggerPath: triggerPath || toLayerPathText([{
                    groupLabel: option?.groupLabel || '',
                    optionText: option?.optionText || ''
                }]),
                groupKey: option?.groupKey || '',
                groupLabel: option?.groupLabel || '',
                fieldRows: normalizeGoalFieldRows(fieldRows),
                fieldMatrix: isPlainObject(fieldMatrix) ? deepClone(fieldMatrix) : {},
                fieldCoverage: isPlainObject(fieldCoverage) ? deepClone(fieldCoverage) : {},
                sectionOrder: uniqueBy((Array.isArray(sectionOrder) ? sectionOrder : []).map(item => normalizeText(item)).filter(Boolean), item => item).slice(0, 80)
            };
        };

        const scanSceneGoalSpecs = async (sceneName = '', options = {}) => {
            const targetSceneName = String(sceneName || '').trim();
            if (!targetSceneName) {
                return {
                    ok: false,
                    sceneName: '',
                    goals: [],
                    warnings: ['缺少 sceneName，无法采集营销目标配置']
                };
            }
            await ensureSceneRoute(targetSceneName, options);
            await waitForDomStable(options);
            const root = pickPlanConfigRoot();
            const goalOptions = collectMarketingGoalCandidates(root);
            const warnings = [];
            const goals = [];
            const contractMode = String(options.contractMode || '').trim();
            const goalFieldScan = options.goalFieldScan !== false;
            const goalFieldScanMode = options.goalFieldScanMode === 'visible' ? 'visible' : 'full_top_down';
            const goalFieldScanOptions = {
                scanMode: goalFieldScanMode,
                unlockPolicy: options.unlockPolicy || 'safe_only',
                maxDepth: Math.max(1, Math.min(4, toNumber(options.goalFieldMaxDepth, 2))),
                maxSnapshots: Math.max(1, Math.min(120, toNumber(options.goalFieldMaxSnapshots, 48))),
                maxGroupsPerLevel: Math.max(1, Math.min(10, toNumber(options.goalFieldMaxGroupsPerLevel, 6))),
                maxOptionsPerGroup: Math.max(1, Math.min(12, toNumber(options.goalFieldMaxOptionsPerGroup, 8)))
            };
            const captureSession = createGoalCaptureSession({
                includePattern: /\.json(?:$|\?)/i
            });
            let mark = captureSession.mark();
            if (!goalOptions.length) {
                const runtime = await getRuntimeDefaults(true);
                const fallbackGoalLabel = normalizeGoalLabel(
                    runtime?.storeData?.promotionModelMarketing
                    || runtime?.storeData?.promotionModel
                    || runtime?.storeData?.optimizeTarget
                    || runtime?.storeData?.promotionScene
                    || SCENE_SPEC_FIELD_FALLBACK[targetSceneName]?.营销目标
                    || ''
                );
                const loadContracts = summarizeGoalLoadContracts(captureSession.sliceFrom(mark));
                let goalFieldRows = [];
                let goalFieldMatrix = {};
                let goalFieldCoverage = {};
                let goalSectionOrder = [];
                if (goalFieldScan) {
                    try {
                        const visibleSnapshot = scanCurrentSceneSettings(targetSceneName, {
                            depth: 0,
                            sectionTitle: '页面根层',
                            layerPath: [],
                            layerPathText: '(根层)',
                            triggerPath: '(根层)'
                        });
                        visibleSnapshot.layerSnapshots = [{
                            sceneName: targetSceneName,
                            depth: 0,
                            sectionTitle: '页面根层',
                            layerPath: [],
                            layerPathText: '(根层)',
                            triggerPath: '(根层)',
                            labels: visibleSnapshot.labels || [],
                            sectionTitles: visibleSnapshot.sectionTitles || [],
                            radios: visibleSnapshot.radios || [],
                            selects: visibleSnapshot.selects || [],
                            inputs: visibleSnapshot.inputs || []
                        }];
                        visibleSnapshot.layerSummary = {
                            mode: 'visible',
                            snapshotCount: 1,
                            sectionCount: (visibleSnapshot.sectionTitles || []).length || 1
                        };
                        const goalFieldBundle = buildGoalFieldRowsFromSceneScan({
                            sceneName: targetSceneName,
                            runtime,
                            scanResult: visibleSnapshot,
                            scanOptions: {
                                scanMode: 'visible',
                                unlockPolicy: options.unlockPolicy || 'safe_only'
                            }
                        });
                        goalFieldRows = goalFieldBundle.fieldRows || [];
                        goalFieldMatrix = goalFieldBundle.fieldMatrix || {};
                        goalFieldCoverage = goalFieldBundle.fieldCoverage || {};
                        goalSectionOrder = goalFieldBundle.sectionOrder || [];
                    } catch (err) {
                        warnings.push(`营销目标行配置采集失败：默认目标 -> ${err?.message || err}`);
                    }
                }
                const fallbackGoal = buildGoalSpecFromOption({
                    option: {
                        optionText: fallbackGoalLabel || `默认目标_${targetSceneName}`,
                        selected: true,
                        groupKey: 'fallback',
                        groupLabel: '营销目标'
                    },
                    runtime,
                    loadContracts,
                    triggerPath: '(根层)',
                    contractMode,
                    fieldRows: goalFieldRows,
                    fieldMatrix: goalFieldMatrix,
                    fieldCoverage: goalFieldCoverage,
                    sectionOrder: goalSectionOrder
                });
                const fallbackGoalLabels = getSceneMarketingGoalFallbackList(targetSceneName);
                const fallbackGoals = [fallbackGoal];
                fallbackGoalLabels.forEach(label => {
                    if (!label) return;
                    if (normalizeGoalCandidateLabel(fallbackGoal.goalLabel || '') === label) return;
                    const clone = deepClone(fallbackGoal);
                    clone.goalLabel = label;
                    clone.goalKey = normalizeGoalKey(label);
                    clone.isDefault = false;
                    clone.triggerPath = `营销目标:${label}`;
                    fallbackGoals.push(clone);
                });
                captureSession.stop();
                return {
                    ok: true,
                    sceneName: targetSceneName,
                    scannedAt: new Date().toISOString(),
                    goals: uniqueBy(fallbackGoals, goal => `${goal.goalKey}::${goal.goalLabel}`),
                    warnings: ['未识别到可点击的营销目标选项，已回退当前运行时默认目标']
                };
            }

            for (let i = 0; i < goalOptions.length; i++) {
                const option = goalOptions[i];
                try {
                    const goalStep = {
                        groupKey: option.groupKey,
                        groupLabel: option.groupLabel,
                        optionText: option.optionText
                    };
                    await applySceneLayerPath(targetSceneName, [goalStep], options);
                    await waitForDomStable(options);
                    const runtime = await getRuntimeDefaults(true);
                    let goalFieldRows = [];
                    let goalFieldMatrix = {};
                    let goalFieldCoverage = {};
                    let goalSectionOrder = [];
                    if (goalFieldScan) {
                        try {
                            let goalFieldScanResult = null;
                            if (goalFieldScanMode === 'visible') {
                                goalFieldScanResult = scanCurrentSceneSettings(targetSceneName, {
                                    depth: 1,
                                    sectionTitle: '页面根层',
                                    layerPath: [goalStep],
                                    layerPathText: toLayerPathText([goalStep]),
                                    triggerPath: toLayerPathText([goalStep])
                                });
                                goalFieldScanResult.layerSnapshots = [{
                                    sceneName: targetSceneName,
                                    depth: 1,
                                    sectionTitle: '页面根层',
                                    layerPath: [goalStep],
                                    layerPathText: toLayerPathText([goalStep]),
                                    triggerPath: toLayerPathText([goalStep]),
                                    labels: goalFieldScanResult.labels || [],
                                    sectionTitles: goalFieldScanResult.sectionTitles || [],
                                    radios: goalFieldScanResult.radios || [],
                                    selects: goalFieldScanResult.selects || [],
                                    inputs: goalFieldScanResult.inputs || []
                                }];
                                goalFieldScanResult.layerSummary = {
                                    mode: 'visible',
                                    snapshotCount: 1,
                                    sectionCount: (goalFieldScanResult.sectionTitles || []).length || 1
                                };
                            } else {
                                goalFieldScanResult = await scanSceneTopDownSettings(targetSceneName, {
                                    ...options,
                                    maxDepth: goalFieldScanOptions.maxDepth,
                                    maxSnapshots: goalFieldScanOptions.maxSnapshots,
                                    maxGroupsPerLevel: goalFieldScanOptions.maxGroupsPerLevel,
                                    maxOptionsPerGroup: goalFieldScanOptions.maxOptionsPerGroup,
                                    baseLayerPath: [goalStep]
                                });
                            }
                            const goalFieldBundle = buildGoalFieldRowsFromSceneScan({
                                sceneName: targetSceneName,
                                runtime,
                                scanResult: goalFieldScanResult,
                                scanOptions: goalFieldScanOptions
                            });
                            goalFieldRows = goalFieldBundle.fieldRows || [];
                            goalFieldMatrix = goalFieldBundle.fieldMatrix || {};
                            goalFieldCoverage = goalFieldBundle.fieldCoverage || {};
                            goalSectionOrder = goalFieldBundle.sectionOrder || [];
                        } catch (err) {
                            warnings.push(`营销目标行配置采集失败：${option.optionText || '未知选项'} -> ${err?.message || err}`);
                        }
                    }
                    const delta = captureSession.sliceFrom(mark);
                    mark = captureSession.mark();
                    const loadContracts = summarizeGoalLoadContracts(delta);
                    goals.push(buildGoalSpecFromOption({
                        option,
                        runtime,
                        loadContracts,
                        triggerPath: toLayerPathText([{
                            groupKey: option.groupKey,
                            groupLabel: option.groupLabel,
                            optionText: option.optionText
                        }]),
                        contractMode,
                        fieldRows: goalFieldRows,
                        fieldMatrix: goalFieldMatrix,
                        fieldCoverage: goalFieldCoverage,
                        sectionOrder: goalSectionOrder
                    }));
                } catch (err) {
                    warnings.push(`营销目标采集失败：${option.optionText || '未知选项'} -> ${err?.message || err}`);
                }
            }
            captureSession.stop();

            const dedupGoals = uniqueBy(
                goals.filter(goal => goal.goalLabel),
                goal => `${goal.goalKey}::${goal.goalLabel}`
            );
            const fallbackGoalLabels = getSceneMarketingGoalFallbackList(targetSceneName);
            if (fallbackGoalLabels.length && dedupGoals.length) {
                const existingGoalSet = new Set(
                    dedupGoals
                        .map(goal => normalizeGoalCandidateLabel(goal?.goalLabel || ''))
                        .filter(Boolean)
                );
                let addedFallbackCount = 0;
                fallbackGoalLabels.forEach(label => {
                    if (existingGoalSet.has(label)) return;
                    const sample = dedupGoals[0] || {};
                    const clone = deepClone(sample);
                    clone.goalLabel = label;
                    clone.goalKey = normalizeGoalKey(label);
                    clone.isDefault = false;
                    clone.triggerPath = clone.triggerPath || `营销目标:${label}`;
                    dedupGoals.push(clone);
                    existingGoalSet.add(label);
                    addedFallbackCount += 1;
                });
                if (addedFallbackCount > 0) {
                    warnings.push(`场景「${targetSceneName}」营销目标识别不足，已补齐兜底目标 ${addedFallbackCount} 条`);
                }
            }
            if (dedupGoals.length && !dedupGoals.some(goal => goal.isDefault)) {
                dedupGoals[0].isDefault = true;
            }
            return {
                ok: true,
                sceneName: targetSceneName,
                scannedAt: new Date().toISOString(),
                goals: dedupGoals,
                warnings
            };
        };

        const deriveTemplateSceneSettings = (runtime = {}) => {
            const campaign = runtime?.solutionTemplate?.campaign || {};
            const out = {};
            const bidType = mapSceneBidTypeValue(campaign.bidTypeV2 || runtime.bidTypeV2 || '');
            let bidTarget = mapSceneBidTargetValue(campaign.bidTargetV2 || campaign.optimizeTarget || runtime.bidTargetV2 || '');
            const constraintType = String(campaign.constraintType || '').trim().toLowerCase();
            if (
                (bidTarget === 'conv' || bidTarget === 'display_pay' || bidTarget === 'ad_strategy_buy' || bidTarget === 'ad_strategy_retained_buy')
                && (constraintType === 'roi' || constraintType === 'dir_conv')
            ) {
                // 兼容历史 ROI 老合同（conv + dir_conv）与现网 roi 合同，编辑态统一展示为“稳定投产比”。
                bidTarget = 'roi';
            }
            const budgetType = mapSceneBudgetTypeValue(campaign.dmcType || runtime.dmcType || '');
            if (bidType === 'smart_bid') out.出价方式 = '智能出价';
            if (bidType === 'manual_bid') out.出价方式 = '手动出价';
            if (bidTarget) {
                const map = {
                    conv: '获取成交量',
                    roi: '稳定投产比',
                    click: '增加点击量',
                    fav_cart: '增加收藏加购量',
                    coll_cart: '增加收藏加购量',
                    market_penetration: '提升市场渗透',
                    word_penetration_rate: '提升市场渗透',
                    similar_item: '相似品跟投',
                    search_rank: '抢占搜索卡位',
                    display_shentou: '拉新渗透'
                };
                out.出价目标 = map[bidTarget] || '';
            }
            if (budgetType === 'day_average') out.预算类型 = '日均预算';
            if (budgetType === 'normal') out.预算类型 = '每日预算';
            if (campaign.campaignName) out.计划名称 = String(campaign.campaignName).trim();
            return Object.keys(out).reduce((acc, key) => {
                if (!out[key]) return acc;
                acc[key] = out[key];
                return acc;
            }, {});
        };

        const buildSceneSpecFromScan = ({ sceneName = '', runtime = {}, scanResult = null, scanMeta = {} }) => {
            const targetScene = String(sceneName || '').trim();
            const source = isPlainObject(scanResult) ? scanResult : {};
            const snapshots = Array.isArray(source.layerSnapshots) ? source.layerSnapshots : [];
            const sections = collectTopDownSections(pickPlanConfigRoot());
            const templateDefaults = deriveTemplateSceneSettings(runtime);
            const fallbackDefaults = isPlainObject(SCENE_SPEC_FIELD_FALLBACK[targetScene]) ? SCENE_SPEC_FIELD_FALLBACK[targetScene] : {};
            const fieldMap = new Map();

            const pushField = (label = '', patch = {}) => {
                const fieldLabel = normalizeText(label);
                if (!fieldLabel || !isLikelyFieldLabel(fieldLabel)) return;
                const key = normalizeSceneSpecFieldKey(fieldLabel);
                const current = fieldMap.get(key) || {
                    key,
                    label: fieldLabel,
                    settingKey: fieldLabel,
                    options: [],
                    pathHints: [],
                    triggerPath: '',
                    dependsOn: inferSceneFieldDependsOn(fieldLabel),
                    requiredGuess: SCENE_REQUIRED_GUESS_RE.test(fieldLabel),
                    defaultValue: '',
                    source: []
                };
                const mergedOptions = uniqueBy((current.options || []).concat((patch.options || []).map(item => normalizeText(item)).filter(Boolean)), item => item).slice(0, 36);
                const mergedHints = uniqueBy((current.pathHints || []).concat((patch.pathHints || []).map(item => normalizeText(item)).filter(Boolean)), item => item).slice(0, 16);
                const mergedSource = uniqueBy((current.source || []).concat((patch.source || []).map(item => normalizeText(item)).filter(Boolean)), item => item).slice(0, 12);
                const defaultValue = normalizeSceneSettingValue(
                    patch.defaultValue
                    || current.defaultValue
                    || templateDefaults[fieldLabel]
                    || fallbackDefaults[fieldLabel]
                    || ''
                );
                fieldMap.set(key, {
                    ...current,
                    ...patch,
                    label: fieldLabel,
                    settingKey: fieldLabel,
                    options: mergedOptions,
                    pathHints: mergedHints,
                    source: mergedSource,
                    triggerPath: patch.triggerPath || current.triggerPath || '',
                    dependsOn: uniqueBy((current.dependsOn || []).concat((patch.dependsOn || []).map(item => normalizeText(item)).filter(Boolean)), item => item).slice(0, 10),
                    requiredGuess: patch.requiredGuess === true || current.requiredGuess === true,
                    defaultValue
                });
            };

            (source.labels || []).forEach(label => pushField(label, { source: ['label'] }));
            (source.sectionTitles || []).forEach(label => pushField(label, { source: ['section_title'], pathHints: [label] }));
            (source.sections || []).forEach(section => {
                pushField(section?.title || '', {
                    options: Array.isArray(section?.options) ? section.options : [],
                    source: ['section_options'],
                    pathHints: [section?.title || '']
                });
            });
            (source.selects || []).forEach(selectItem => {
                const selectedOption = (selectItem?.options || []).find(opt => opt?.selected) || null;
                pushField(selectItem?.label || '', {
                    options: (selectItem?.options || []).map(opt => opt?.label || opt?.value || ''),
                    defaultValue: selectedOption?.label || selectedOption?.value || selectItem?.value || '',
                    source: ['select']
                });
            });
            const radioMap = new Map();
            (source.radios || []).forEach(radio => {
                const label = normalizeText(radio?.label || '');
                if (!label) return;
                if (!radioMap.has(label)) {
                    radioMap.set(label, {
                        options: [],
                        selected: ''
                    });
                }
                const bucket = radioMap.get(label);
                const optionText = normalizeText(radio?.text || '');
                if (optionText) bucket.options.push(optionText);
                if (radio?.checked && optionText) bucket.selected = optionText;
            });
            radioMap.forEach((bucket, label) => {
                pushField(label, {
                    options: bucket.options,
                    defaultValue: bucket.selected,
                    source: ['radio']
                });
            });
            (source.inputs || []).forEach(input => {
                pushField(input?.label || '', {
                    defaultValue: input?.value || '',
                    source: ['input']
                });
            });

            snapshots.forEach(snapshot => {
                const pathText = String(snapshot?.layerPathText || '').trim();
                const sectionTitle = String(snapshot?.sectionTitle || '').trim();
                const labels = uniqueBy([
                    ...((snapshot?.labels || []).filter(Boolean)),
                    ...((snapshot?.sectionTitles || []).filter(Boolean)),
                    ...((snapshot?.selects || []).map(item => item?.label || '').filter(Boolean)),
                    ...((snapshot?.inputs || []).map(item => item?.label || '').filter(Boolean)),
                    ...((snapshot?.radios || []).map(item => item?.label || '').filter(Boolean))
                ], item => item);
                labels.forEach(label => {
                    const key = normalizeSceneSpecFieldKey(label);
                    if (!fieldMap.has(key)) return;
                    const current = fieldMap.get(key);
                    if (!current.triggerPath && pathText) {
                        current.triggerPath = pathText;
                    }
                    if (sectionTitle) {
                        current.pathHints = uniqueBy((current.pathHints || []).concat([sectionTitle]), item => item).slice(0, 16);
                    }
                    fieldMap.set(key, current);
                });
            });

            Object.keys(templateDefaults).forEach(label => {
                pushField(label, {
                    defaultValue: templateDefaults[label],
                    source: ['runtime_template']
                });
            });
            Object.keys(fallbackDefaults).forEach(label => {
                pushField(label, {
                    defaultValue: fallbackDefaults[label],
                    source: ['scene_fallback']
                });
            });

            const fields = Array.from(fieldMap.values())
                .map(field => ({
                    key: field.key,
                    label: field.label,
                    settingKey: field.settingKey,
                    options: field.options || [],
                    pathHints: field.pathHints || [],
                    triggerPath: field.triggerPath || '',
                    dependsOn: field.dependsOn || [],
                    requiredGuess: !!field.requiredGuess,
                    defaultValue: normalizeSceneSettingValue(field.defaultValue || ''),
                    source: (field.source || []).filter(Boolean),
                    criticalGuess: isLikelyCriticalSceneField(field.label)
                }))
                .sort((a, b) => {
                    const ai = a.pathHints?.[0] ? sections.findIndex(section => section.title === a.pathHints[0]) : -1;
                    const bi = b.pathHints?.[0] ? sections.findIndex(section => section.title === b.pathHints[0]) : -1;
                    if (ai !== bi) return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi);
                    return a.label.localeCompare(b.label, 'zh-CN');
                });

            const optionCount = fields.reduce((sum, field) => sum + (Array.isArray(field.options) ? field.options.length : 0), 0);
            const goals = uniqueBy(
                (Array.isArray(scanMeta?.goalSpecs) ? scanMeta.goalSpecs : [])
                    .map(goal => ({
                        goalKey: normalizeGoalKey(goal?.goalKey || goal?.goalLabel || ''),
                        goalLabel: normalizeGoalLabel(goal?.goalLabel || ''),
                        isDefault: !!goal?.isDefault,
                        runtimeSnapshot: isPlainObject(goal?.runtimeSnapshot) ? deepClone(goal.runtimeSnapshot) : {},
                        createContract: isPlainObject(goal?.createContract) ? deepClone(goal.createContract) : {},
                        loadContracts: Array.isArray(goal?.loadContracts) ? deepClone(goal.loadContracts) : [],
                        triggerPath: normalizeText(goal?.triggerPath || ''),
                        groupKey: normalizeText(goal?.groupKey || ''),
                        groupLabel: normalizeText(goal?.groupLabel || ''),
                        fieldRows: normalizeGoalFieldRows(goal?.fieldRows || goal?.settingsRows || []),
                        fieldMatrix: isPlainObject(goal?.fieldMatrix) ? deepClone(goal.fieldMatrix) : {},
                        fieldCoverage: isPlainObject(goal?.fieldCoverage) ? deepClone(goal.fieldCoverage) : {},
                        sectionOrder: uniqueBy((Array.isArray(goal?.sectionOrder) ? goal.sectionOrder : []).map(item => normalizeText(item)).filter(Boolean), item => item).slice(0, 80)
                    }))
                    .filter(goal => goal.goalLabel),
                goal => `${goal.goalKey}::${goal.goalLabel}`
            ).slice(0, 24);
            if (goals.length && !goals.some(goal => goal.isDefault)) {
                goals[0].isDefault = true;
            }
            const goalWarnings = Array.isArray(scanMeta?.goalWarnings)
                ? uniqueBy(scanMeta.goalWarnings.map(item => normalizeText(item)).filter(Boolean), item => item).slice(0, 80)
                : [];
            return {
                ok: true,
                sceneName: targetScene,
                bizCode: resolveSceneBizCodeHint(targetScene) || runtime?.bizCode || '',
                location: source.location || window.location.href,
                scannedAt: new Date().toISOString(),
                scanMode: scanMeta.scanMode || 'full_top_down',
                unlockPolicy: scanMeta.unlockPolicy || 'auto_rollback',
                fields,
                goals,
                sectionOrder: uniqueBy((sections || []).map(section => section.title).filter(Boolean), item => item),
                coverage: {
                    sectionCount: (sections || []).length || (source.sectionTitles || []).length,
                    fieldCount: fields.length,
                    optionCount,
                    goalCount: goals.length,
                    snapshotCount: source?.layerSummary?.snapshotCount || snapshots.length || 1,
                    unlockActions: Array.isArray(scanMeta.unlockActions) ? scanMeta.unlockActions.length : 0,
                    warnings: Array.isArray(scanMeta.warnings) ? scanMeta.warnings.slice(0, 80) : []
                },
                goalCoverage: {
                    goalCount: goals.length,
                    defaultGoal: (goals.find(goal => goal.isDefault) || goals[0] || null)?.goalLabel || '',
                    goalFieldCount: goals.reduce((sum, goal) => sum + (Array.isArray(goal?.fieldRows) ? goal.fieldRows.length : 0), 0),
                    goalOptionCount: goals.reduce((sum, goal) => sum + (Array.isArray(goal?.fieldRows)
                        ? goal.fieldRows.reduce((acc, field) => acc + (Array.isArray(field?.options) ? field.options.length : 0), 0)
                        : 0), 0),
                    goalsWithFieldRows: goals.filter(goal => Array.isArray(goal?.fieldRows) && goal.fieldRows.length > 0).length,
                    goalsWithOptionRows: goals.filter(goal => Array.isArray(goal?.fieldRows) && goal.fieldRows.some(field => Array.isArray(field?.options) && field.options.length >= 2)).length,
                    warnings: goalWarnings
                },
                rawSamples: {
                    labels: (source.labels || []).slice(0, 240),
                    sectionTitles: (source.sectionTitles || []).slice(0, 120),
                    sections: (source.sections || []).slice(0, 120),
                    radios: (source.radios || []).slice(0, 160),
                    selects: (source.selects || []).slice(0, 160),
                    inputs: (source.inputs || []).slice(0, 200),
                    layerSnapshots: snapshots.slice(0, 60)
                },
                triggerPaths: (source.sectionTraversal || []).slice(0, 240)
            };
        };

        const scanSceneSpec = async (sceneName, options = {}) => {
            const targetScene = String(sceneName || '').trim();
            if (!targetScene) {
                return {
                    ok: false,
                    sceneName: '',
                    error: '缺少 sceneName'
                };
            }
            const normalizedOptions = normalizeSceneSpecOptions(options);
            const sceneBizCode = resolveSceneBizCodeHint(targetScene) || SCENE_BIZCODE_HINT_FALLBACK[targetScene] || '';
            if (!normalizedOptions.refresh) {
                const cached = getCachedSceneSpec(targetScene, sceneBizCode);
                if (cached) return cached;
            }

            const initialHash = window.location.hash;
            const initialScene = inferCurrentSceneName();
            const initialRoot = pickPlanConfigRoot();
            const controlState = captureEditableState(initialRoot);
            const warnings = [];
            let unlockActions = [];
            let tempUnlockState = {
                beforeIds: [],
                afterIds: [],
                tempIds: [],
                actions: []
            };

            try {
                await ensureSceneRoute(targetScene, normalizedOptions);
                await waitForDomStable(normalizedOptions);
                const activeRoot = pickPlanConfigRoot();
                if (normalizedOptions.unlockPolicy !== 'manual') {
                    unlockActions = unlockActions.concat(autoFillMinimumInputs(activeRoot, targetScene));
                }
                if (normalizedOptions.unlockPolicy === 'auto_rollback') {
                    tempUnlockState = await tryTemporaryAddItem(targetScene, normalizedOptions);
                    unlockActions = unlockActions.concat(tempUnlockState.actions || []);
                }

                let scanResult = null;
                let goalSpecs = [];
                let goalWarnings = [];
                if (normalizedOptions.scanMode === 'visible') {
                    scanResult = scanCurrentSceneSettings(targetScene, {
                        depth: 0,
                        sectionTitle: '页面根层',
                        layerPath: [],
                        layerPathText: '(根层)',
                        triggerPath: '(根层)'
                    });
                    scanResult.layerSnapshots = [{
                        sceneName: targetScene,
                        depth: 0,
                        sectionTitle: '页面根层',
                        layerPath: [],
                        layerPathText: '(根层)',
                        triggerPath: '(根层)',
                        labels: scanResult.labels || [],
                        sectionTitles: scanResult.sectionTitles || [],
                        radios: scanResult.radios || [],
                        selects: scanResult.selects || [],
                        inputs: scanResult.inputs || []
                    }];
                    scanResult.layerSummary = {
                        mode: 'visible',
                        snapshotCount: 1,
                        sectionCount: (scanResult.sectionTitles || []).length || 1
                    };
                } else {
                    scanResult = await scanSceneTopDownSettings(targetScene, normalizedOptions);
                }
                if (normalizedOptions.goalScan) {
                    try {
                        const goalScanResult = await scanSceneGoalSpecs(targetScene, normalizedOptions);
                        if (Array.isArray(goalScanResult?.goals)) {
                            goalSpecs = goalScanResult.goals.slice(0, 24);
                        }
                        if (Array.isArray(goalScanResult?.warnings)) {
                            goalWarnings = goalScanResult.warnings
                                .map(item => normalizeText(item))
                                .filter(Boolean)
                                .slice(0, 80);
                        }
                    } catch (err) {
                        goalWarnings.push(`营销目标采集失败: ${err?.message || err}`);
                    }
                }

                const runtime = await getRuntimeDefaults(false);
                const spec = buildSceneSpecFromScan({
                    sceneName: targetScene,
                    runtime,
                    scanResult,
                    scanMeta: {
                        scanMode: normalizedOptions.scanMode,
                        unlockPolicy: normalizedOptions.unlockPolicy,
                        unlockActions,
                        warnings,
                        goalSpecs,
                        goalWarnings
                    }
                });
                setCachedSceneSpec(targetScene, sceneBizCode, spec);
                return spec;
            } catch (err) {
                return {
                    ok: false,
                    sceneName: targetScene,
                    scannedAt: new Date().toISOString(),
                    location: window.location.href,
                    error: err?.message || String(err)
                };
            } finally {
                if (normalizedOptions.unlockPolicy === 'auto_rollback') {
                    try {
                        await rollbackTemporaryItems(tempUnlockState, normalizedOptions);
                    } catch (err) {
                        warnings.push(`回滚临时商品失败: ${err?.message || err}`);
                    }
                    try {
                        restoreEditableState(controlState);
                    } catch (err) {
                        warnings.push(`回滚输入值失败: ${err?.message || err}`);
                    }
                }
                if (normalizedOptions.restore) {
                    try {
                        if (initialHash && window.location.hash !== initialHash) {
                            window.location.hash = initialHash;
                            await waitForDomStable(normalizedOptions);
                        }
                        if (initialScene && SCENE_NAME_LIST.includes(initialScene)) {
                            await clickScene(initialScene, normalizedOptions);
                        }
                    } catch { }
                }
            }
        };

        const scanAllSceneSpecs = async (options = {}) => {
            const normalizedOptions = normalizeSceneSpecOptions(options);
            const scenes = Array.isArray(options.scenes) && options.scenes.length
                ? uniqueBy(options.scenes.map(item => String(item || '').trim()).filter(Boolean), item => item)
                : SCENE_NAME_LIST.slice();
            const initialHash = window.location.hash;
            const initialScene = inferCurrentSceneName();
            const list = [];
            for (let i = 0; i < scenes.length; i++) {
                const sceneName = scenes[i];
                if (typeof options.onProgress === 'function') {
                    try { options.onProgress({ event: 'scene_spec_start', sceneName, index: i + 1, total: scenes.length }); } catch { }
                }
                const result = await scanSceneSpec(sceneName, {
                    ...normalizedOptions,
                    restore: false,
                    refresh: options.refresh === true
                });
                list.push(result);
                if (typeof options.onProgress === 'function') {
                    try {
                        options.onProgress({
                            event: 'scene_spec_done',
                            sceneName,
                            index: i + 1,
                            total: scenes.length,
                            ok: !!result?.ok,
                            fieldCount: result?.coverage?.fieldCount || 0,
                            snapshotCount: result?.coverage?.snapshotCount || 0
                        });
                    } catch { }
                }
            }

            if (normalizedOptions.restore) {
                try {
                    if (initialHash && window.location.hash !== initialHash) {
                        window.location.hash = initialHash;
                        await waitForDomStable(normalizedOptions);
                    }
                    if (initialScene && SCENE_NAME_LIST.includes(initialScene)) {
                        await clickScene(initialScene, normalizedOptions);
                    }
                } catch { }
            }

            return {
                ok: list.every(item => item?.ok),
                scannedAt: new Date().toISOString(),
                scanMode: normalizedOptions.scanMode,
                unlockPolicy: normalizedOptions.unlockPolicy,
                sceneOrder: scenes,
                count: list.length,
                successCount: list.filter(item => item?.ok).length,
                failCount: list.filter(item => !item?.ok).length,
                list
            };
        };

        const getSceneSpec = async (sceneName = '', options = {}) => {
            const targetScene = String(sceneName || inferCurrentSceneName() || '').trim();
            if (!targetScene) {
                return {
                    ok: false,
                    error: '缺少 sceneName'
                };
            }
            const sceneBizCode = resolveSceneBizCodeHint(targetScene) || SCENE_BIZCODE_HINT_FALLBACK[targetScene] || '';
            if (!options.refresh) {
                const cached = getCachedSceneSpec(targetScene, sceneBizCode);
                if (cached) return cached;
            }
            return scanSceneSpec(targetScene, {
                ...options,
                refresh: true
            });
        };

        const resolveGoalSpecForScene = ({
            sceneName = '',
            sceneSpec = null,
            marketingGoal = '',
            runtime = {},
            allowFuzzyMatch = false
        } = {}) => {
            const warnings = [];
            const targetScene = String(sceneName || '').trim();
            const requestGoalRaw = normalizeGoalCandidateLabel(marketingGoal);
            const availableGoals = Array.isArray(sceneSpec?.goals)
                ? sceneSpec.goals
                    .map(goal => ({
                        ...goal,
                        goalLabel: normalizeGoalCandidateLabel(goal?.goalLabel || ''),
                        goalKey: normalizeGoalKey(goal?.goalKey || goal?.goalLabel || '')
                    }))
                    .filter(goal => goal.goalLabel)
                : [];
            const fallbackDefaultLabel = normalizeGoalCandidateLabel(
                SCENE_SPEC_FIELD_FALLBACK[targetScene]?.营销目标
                || runtime?.storeData?.promotionModelMarketing
                || runtime?.storeData?.promotionModel
                || runtime?.storeData?.optimizeTarget
                || runtime?.storeData?.promotionScene
                || ''
            );
            if (!availableGoals.length) {
                const resolved = requestGoalRaw || fallbackDefaultLabel || '';
                const fallbackUsed = !requestGoalRaw && !!resolved;
                if (!requestGoalRaw && resolved) {
                    warnings.push(`marketingGoal 缺失，已回退默认目标：${resolved}`);
                } else if (requestGoalRaw && !resolved) {
                    warnings.push(`marketingGoal「${requestGoalRaw}」无法识别，且当前场景无可用默认目标`);
                }
                return {
                    goalSpec: null,
                    resolvedMarketingGoal: resolved,
                    goalFallbackUsed: fallbackUsed,
                    goalWarnings: warnings,
                    availableGoalLabels: []
                };
            }

            const defaultGoal = availableGoals.find(goal => goal.isDefault) || availableGoals[0];
            if (!requestGoalRaw) {
                warnings.push(`marketingGoal 缺失，已回退默认目标：${defaultGoal.goalLabel}`);
                return {
                    goalSpec: defaultGoal,
                    resolvedMarketingGoal: defaultGoal.goalLabel,
                    goalFallbackUsed: true,
                    goalWarnings: warnings,
                    availableGoalLabels: availableGoals.map(goal => goal.goalLabel)
                };
            }

            const normalizedRequestGoalKey = normalizeGoalKey(requestGoalRaw);
            const exactMatch = availableGoals.find(goal => goal.goalLabel === requestGoalRaw)
                || availableGoals.find(goal => goal.goalKey === normalizedRequestGoalKey);
            if (exactMatch) {
                return {
                    goalSpec: exactMatch,
                    resolvedMarketingGoal: exactMatch.goalLabel,
                    goalFallbackUsed: false,
                    goalWarnings: warnings,
                    availableGoalLabels: availableGoals.map(goal => goal.goalLabel)
                };
            }
            const fuzzyCandidates = allowFuzzyMatch
                ? availableGoals.filter(goal => goal.goalLabel.includes(requestGoalRaw) || requestGoalRaw.includes(goal.goalLabel))
                : [];
            const fuzzyMatch = fuzzyCandidates.length === 1 ? fuzzyCandidates[0] : null;
            if (allowFuzzyMatch && fuzzyCandidates.length > 1) {
                warnings.push(`marketingGoal「${requestGoalRaw}」匹配到多个候选，已回退默认目标`);
            }
            if (fuzzyMatch) {
                warnings.push(`marketingGoal「${requestGoalRaw}」模糊匹配为「${fuzzyMatch.goalLabel}」，已标记为回退`);
                return {
                    goalSpec: fuzzyMatch,
                    resolvedMarketingGoal: fuzzyMatch.goalLabel,
                    goalFallbackUsed: true,
                    goalWarnings: warnings,
                    availableGoalLabels: availableGoals.map(goal => goal.goalLabel)
                };
            }

            warnings.push(`marketingGoal「${requestGoalRaw}」未命中，已回退默认目标：${defaultGoal.goalLabel}`);
            return {
                goalSpec: defaultGoal,
                resolvedMarketingGoal: defaultGoal.goalLabel,
                goalFallbackUsed: true,
                goalWarnings: warnings,
                availableGoalLabels: availableGoals.map(goal => goal.goalLabel)
            };
        };

        const buildGoalContractDefaults = (goalSpec = null, context = {}) => {
            const normalizedGoalSpec = isPlainObject(goalSpec) ? goalSpec : {};
            const runtimeSnapshot = isPlainObject(normalizedGoalSpec.runtimeSnapshot)
                ? normalizedGoalSpec.runtimeSnapshot
                : {};
            const createContract = isPlainObject(normalizedGoalSpec.createContract)
                ? normalizedGoalSpec.createContract
                : {};
            const sceneName = String(context?.sceneName || '').trim();
            const goalLabel = normalizeGoalCandidateLabel(
                context?.goalLabel
                || normalizedGoalSpec?.goalLabel
                || ''
            );
            const cachedContract = sceneName
                ? (
                    getCachedSceneCreateContract(sceneName, goalLabel)
                    || getCachedSceneCreateContract(sceneName, '')
                )
                : null;
            const defaultCampaign = isPlainObject(createContract.defaultCampaign)
                ? createContract.defaultCampaign
                : {};
            const defaultAdgroup = isPlainObject(createContract.defaultAdgroup)
                ? createContract.defaultAdgroup
                : {};
            const campaignOverride = {};
            const adgroupOverride = {};
            const runtimePatch = {};

            GOAL_CONTRACT_RUNTIME_PATCH_KEYS.forEach(key => {
                let value = runtimeSnapshot[key];
                if (value === undefined || value === null || value === '') {
                    value = defaultCampaign[key];
                }
                if (value === undefined || value === null || value === '') return;
                campaignOverride[key] = deepClone(value);
            });

            if (sceneName === '关键词推广') {
                const keywordGoalRuntime = resolveKeywordGoalRuntimeFallback(goalLabel);
                if (keywordGoalRuntime.promotionScene && !campaignOverride.promotionScene) {
                    campaignOverride.promotionScene = keywordGoalRuntime.promotionScene;
                }
                if (keywordGoalRuntime.itemSelectedMode && !campaignOverride.itemSelectedMode) {
                    campaignOverride.itemSelectedMode = keywordGoalRuntime.itemSelectedMode;
                }
                if (keywordGoalRuntime.bidTargetV2 && !campaignOverride.bidTargetV2) {
                    campaignOverride.bidTargetV2 = keywordGoalRuntime.bidTargetV2;
                }
                if (keywordGoalRuntime.optimizeTarget && !campaignOverride.optimizeTarget) {
                    campaignOverride.optimizeTarget = keywordGoalRuntime.optimizeTarget;
                }
            }

            if (campaignOverride.promotionScene) runtimePatch.promotionScene = campaignOverride.promotionScene;
            if (campaignOverride.itemSelectedMode) runtimePatch.itemSelectedMode = campaignOverride.itemSelectedMode;
            if (campaignOverride.bidTypeV2) runtimePatch.bidTypeV2 = campaignOverride.bidTypeV2;
            if (campaignOverride.bidTargetV2) runtimePatch.bidTargetV2 = campaignOverride.bidTargetV2;
            if (campaignOverride.dmcType) runtimePatch.dmcType = campaignOverride.dmcType;
            if (campaignOverride.subPromotionType) runtimePatch.subPromotionType = campaignOverride.subPromotionType;
            if (campaignOverride.promotionType) runtimePatch.promotionType = campaignOverride.promotionType;
            if (campaignOverride.optimizeTarget) runtimePatch.optimizeTarget = campaignOverride.optimizeTarget;

            if (Array.isArray(defaultAdgroup.rightList)) {
                adgroupOverride.rightList = deepClone(defaultAdgroup.rightList);
            }
            if (defaultAdgroup.smartCreative !== undefined && defaultAdgroup.smartCreative !== null && defaultAdgroup.smartCreative !== '') {
                adgroupOverride.smartCreative = deepClone(defaultAdgroup.smartCreative);
            }

            const endpoint = normalizeGoalCreateEndpoint(
                createContract.endpoint
                || cachedContract?.endpoint
                || resolveGoalCreateEndpoint(normalizedGoalSpec.loadContracts || [])
                || SCENE_CREATE_ENDPOINT_FALLBACK
            );
            const mergeContractKeys = (contractRef = null, key = '', limit = 320) => uniqueBy(
                (Array.isArray(createContract?.[key]) ? createContract[key] : [])
                    .concat(Array.isArray(contractRef?.[key]) ? contractRef[key] : [])
                    .map(item => normalizeText(item))
                    .filter(Boolean),
                item => item
            ).slice(0, Math.max(40, Math.min(2000, toNumber(limit, 320))));
            const contractHints = {
                source: normalizeText(createContract?.source || cachedContract?.source || ''),
                requestKeys: mergeContractKeys(cachedContract, 'requestKeys'),
                requestKeyPaths: mergeContractKeys(cachedContract, 'requestKeyPaths', 1600),
                solutionKeys: mergeContractKeys(cachedContract, 'solutionKeys'),
                solutionKeyPaths: mergeContractKeys(cachedContract, 'solutionKeyPaths', 1400),
                campaignKeys: mergeContractKeys(cachedContract, 'campaignKeys'),
                campaignKeyPaths: mergeContractKeys(cachedContract, 'campaignKeyPaths', 1200),
                adgroupKeys: mergeContractKeys(cachedContract, 'adgroupKeys'),
                adgroupKeyPaths: mergeContractKeys(cachedContract, 'adgroupKeyPaths', 1200)
            };

            return {
                campaignOverride,
                adgroupOverride,
                runtimePatch,
                endpoint,
                contractHints
            };
        };

        const mergeRuntimeWithGoalPatch = (runtime = {}, patch = {}) => {
            const output = deepClone(runtime || {});
            if (!isPlainObject(patch)) return output;
            Object.keys(patch).forEach(key => {
                const value = patch[key];
                if (value === undefined || value === null || value === '') return;
                output[key] = deepClone(value);
            });
            return output;
        };

        const resolveGoalContextForPlan = ({
            sceneName = '',
            sceneSpec = null,
            runtime = {},
            marketingGoal = '',
            planName = '',
            planIndex = 0,
            allowFuzzyMatch = false
        } = {}) => {
            const resolution = resolveGoalSpecForScene({
                sceneName,
                sceneSpec,
                marketingGoal,
                runtime,
                allowFuzzyMatch
            });
            const defaults = buildGoalContractDefaults(resolution.goalSpec, {
                sceneName: String(sceneName || '').trim(),
                goalLabel: resolution.resolvedMarketingGoal || marketingGoal || ''
            });
            const resolvedGoal = resolution.resolvedMarketingGoal || normalizeGoalLabel(marketingGoal) || '';
            const warningPrefix = planName
                ? `计划「${planName}」`
                : (Number.isFinite(planIndex) && planIndex >= 0 ? `plans[${planIndex}]` : 'request');
            const goalWarnings = Array.isArray(resolution.goalWarnings)
                ? resolution.goalWarnings
                    .map(msg => normalizeText(msg))
                    .filter(Boolean)
                    .map(msg => `${warningPrefix} ${msg}`)
                : [];
            return {
                goalSpec: resolution.goalSpec ? deepClone(resolution.goalSpec) : null,
                resolvedMarketingGoal: resolvedGoal,
                goalFallbackUsed: !!resolution.goalFallbackUsed,
                goalWarnings,
                availableGoalLabels: resolution.availableGoalLabels || [],
                campaignOverride: defaults.campaignOverride || {},
                adgroupOverride: defaults.adgroupOverride || {},
                runtimePatch: defaults.runtimePatch || {},
                endpoint: defaults.endpoint || SCENE_CREATE_ENDPOINT_FALLBACK,
                contractHints: isPlainObject(defaults.contractHints) ? deepClone(defaults.contractHints) : {}
            };
        };

        const getGoalSpec = async (sceneName = '', marketingGoal = '', options = {}) => {
            const targetScene = String(sceneName || inferCurrentSceneName() || '').trim();
            if (!targetScene) {
                return {
                    ok: false,
                    sceneName: '',
                    marketingGoal: normalizeGoalLabel(marketingGoal),
                    error: '缺少 sceneName'
                };
            }
            let sceneSpec = await getSceneSpec(targetScene, {
                ...options,
                scanMode: options.scanMode || 'full_top_down',
                unlockPolicy: options.unlockPolicy || 'safe_only',
                goalScan: options.goalScan !== false,
                refresh: !!options.refresh
            });
            if (!Array.isArray(sceneSpec?.goals) || !sceneSpec.goals.length) {
                sceneSpec = await scanSceneSpec(targetScene, {
                    ...options,
                    scanMode: options.scanMode || 'full_top_down',
                    unlockPolicy: options.unlockPolicy || 'safe_only',
                    goalScan: true,
                    refresh: true
                });
            }
            const shouldLoadGoalFields = options.goalFieldScan !== false;
            const hasGoalFieldRows = Array.isArray(sceneSpec?.goals)
                && sceneSpec.goals.some(goal => Array.isArray(goal?.fieldRows) && goal.fieldRows.length > 0);
            if (shouldLoadGoalFields && (!hasGoalFieldRows || options.refreshGoalFields === true)) {
                try {
                    const extracted = await extractSceneGoalSpecs(targetScene, {
                        ...options,
                        scanMode: options.goalFieldScanMode || options.scanMode || 'full_top_down',
                        unlockPolicy: options.unlockPolicy || 'safe_only',
                        goalScan: true,
                        goalFieldScan: true,
                        goalFieldScanMode: options.goalFieldScanMode || 'full_top_down',
                        goalFieldMaxDepth: toNumber(options.goalFieldMaxDepth, 2),
                        goalFieldMaxSnapshots: toNumber(options.goalFieldMaxSnapshots, 48),
                        goalFieldMaxGroupsPerLevel: toNumber(options.goalFieldMaxGroupsPerLevel, 6),
                        goalFieldMaxOptionsPerGroup: toNumber(options.goalFieldMaxOptionsPerGroup, 8),
                        refresh: options.refresh !== false
                    });
                    if (Array.isArray(extracted?.goals) && extracted.goals.length) {
                        sceneSpec = mergeDeep({}, sceneSpec || {}, {
                            goals: extracted.goals.slice(0, 24)
                        });
                    }
                } catch { }
            }
            let runtime = {};
            try {
                runtime = await getRuntimeDefaults(false);
            } catch { }
            const resolution = resolveGoalSpecForScene({
                sceneName: targetScene,
                sceneSpec,
                marketingGoal,
                runtime,
                allowFuzzyMatch: options.allowFuzzyMatch === true
            });
            return {
                ok: !!sceneSpec?.ok,
                sceneName: targetScene,
                marketingGoal: normalizeGoalLabel(marketingGoal),
                resolvedMarketingGoal: resolution.resolvedMarketingGoal || '',
                goalFallbackUsed: !!resolution.goalFallbackUsed,
                goalWarnings: resolution.goalWarnings || [],
                availableGoals: resolution.availableGoalLabels || [],
                goalSpec: resolution.goalSpec ? deepClone(resolution.goalSpec) : null,
                goalFieldRows: Array.isArray(resolution?.goalSpec?.fieldRows) ? deepClone(resolution.goalSpec.fieldRows) : [],
                goalFieldCoverage: isPlainObject(resolution?.goalSpec?.fieldCoverage) ? deepClone(resolution.goalSpec.fieldCoverage) : {},
                goalFieldMatrix: isPlainObject(resolution?.goalSpec?.fieldMatrix) ? deepClone(resolution.goalSpec.fieldMatrix) : {},
                sceneSpecMeta: sceneSpec?.coverage || null
            };
        };

        const networkCaptureRegistry = {
            seq: 0,
            sessions: new Map()
        };
        const normalizeGoalSpecContracts = (goals = []) => {
            const list = Array.isArray(goals) ? goals : [];
            return list.map(goal => {
                const fieldRows = normalizeGoalFieldRows(goal?.fieldRows || goal?.settingsRows || []);
                const matrixFromRows = fieldRows.reduce((acc, row) => {
                    acc[row.label] = {
                        options: row.options.slice(0, 48),
                        defaultValue: row.defaultValue || '',
                        requiredGuess: !!row.requiredGuess,
                        criticalGuess: !!row.criticalGuess,
                        dependsOn: row.dependsOn.slice(0, 16),
                        triggerPath: row.triggerPath || ''
                    };
                    return acc;
                }, {});
                const inputMatrix = isPlainObject(goal?.fieldMatrix) ? deepClone(goal.fieldMatrix) : {};
                const fieldMatrix = Object.keys(inputMatrix).length ? inputMatrix : matrixFromRows;
                const defaultFieldCoverage = {
                    fieldCount: fieldRows.length,
                    optionCount: fieldRows.reduce((sum, row) => sum + (Array.isArray(row.options) ? row.options.length : 0), 0),
                    requiredCount: fieldRows.filter(row => row.requiredGuess).length,
                    criticalCount: fieldRows.filter(row => row.criticalGuess).length
                };
                return {
                    fieldRows,
                    goalKey: normalizeGoalKey(goal?.goalKey || goal?.goalLabel || ''),
                    goalLabel: normalizeGoalLabel(goal?.goalLabel || ''),
                    isDefault: !!goal?.isDefault,
                    triggerPath: normalizeText(goal?.triggerPath || ''),
                    groupKey: normalizeText(goal?.groupKey || ''),
                    groupLabel: normalizeText(goal?.groupLabel || ''),
                    runtimeSnapshot: isPlainObject(goal?.runtimeSnapshot) ? deepClone(goal.runtimeSnapshot) : {},
                    createContract: isPlainObject(goal?.createContract) ? deepClone(goal.createContract) : {},
                    loadContracts: Array.isArray(goal?.loadContracts) ? deepClone(goal.loadContracts) : [],
                    fieldMatrix,
                    fieldCoverage: mergeDeep({}, defaultFieldCoverage, isPlainObject(goal?.fieldCoverage) ? goal.fieldCoverage : {}),
                    sectionOrder: uniqueBy((Array.isArray(goal?.sectionOrder) ? goal.sectionOrder : []).map(item => normalizeText(item)).filter(Boolean), item => item).slice(0, 80)
                };
            }).filter(goal => goal.goalLabel);
        };
        const summarizeSceneNetworkContractsFromGoals = (goals = []) => {
            const contracts = mergeContractSummaries(
                (Array.isArray(goals) ? goals : []).flatMap(goal => Array.isArray(goal?.loadContracts) ? goal.loadContracts : [])
            );
            const createContracts = contracts.filter(item => isGoalCreateSubmitPath(item?.path || ''));
            const createInterfaces = summarizeCreateInterfacesFromContracts(createContracts);
            return {
                contracts,
                createContracts,
                createInterfaces,
                createEndpoints: uniqueBy(
                    createContracts.map(item => `${normalizeCaptureMethod(item?.method)} ${normalizeCapturePath(item?.path || '')}`).filter(Boolean),
                    item => item
                )
            };
        };
