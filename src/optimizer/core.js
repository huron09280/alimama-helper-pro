    const Core = {
        // 处理单个计划（使用独立卡片日志）
        processCampaign: async (campaignId, campaignName, index, total) => {
            // 创建该计划的独立卡片
            // 如果没有 ID，使用通用 ID "GLOBAL"
            const realId = campaignId || '0';
            const realName = campaignId ? campaignName : '通用问答';

            const card = UI.createCampaignCard(realId, realName, index, total);
            if (!card) {
                Logger.error(`无法创建卡片: ${realId}`);
                return { success: false, msg: '创建卡片失败' };
            }

            Logger.info(`[${index}/${total}] ${realName}(${realId}) 开始处理...`);
            card.log('开始处理...', '#1890ff');
            card.setStatus('诊断中', 'info');

            try {
                const today = Utils.toLocalYMD();
                // 构造请求数据
                const talkData = {
                    fromPage: '/manage/search-detail',
                    entrance: 'huhang-pop_escort@onebpSearch@horizontal',
                    business: 'escort@onebpSearch@horizontal',
                    contextParam: {
                        mx_bizCode: 'onebpSearch',
                        bizCode: 'onebpSearch',
                        startTime: today,
                        endTime: today,
                        campaignGroupId: Utils.getCampaignGroupId(),
                        newUi: true,
                        bizQueryReference: 'escort',
                        campaignId: parseInt(campaignId)
                    },
                    bizCode: 'universalBP',
                    requestType: 'NlAnalysis',
                    client: 'pc_uni_bp',
                    product: 'escort',
                    sessionId: Utils.uuid(),
                    campaignId: parseInt(campaignId),
                    prompt: {
                        promptType: 'text',
                        valided: true,
                        isEmpty: false,
                        params: { questionSource: 'input' },
                        wordList: [{
                            word: `针对计划：${campaignId}，${userConfig.customPrompt}`,
                            wordType: 'text'
                        }]
                    },
                    promptType: 'text',
                    timeStr: Date.now(),
                    ...State.tokens
                };

                card.log('请求诊断接口...', 'orange');
                const talkRes = await API.request('https://ai.alimama.com/ai/chat/talk.json', talkData, {
                    signal: State.runAbortController?.signal
                });

                // 收集所有 actionList 与新链路文本信号
                const allActionLists = [];
                const seenKeys = new Set();
                let latestEscortSettingTable = null;
                const flowSignalRules = [
                    { name: '护航工作授权', re: /护航工作授权|授权小万开始护航/ },
                    { name: '确认修改规划', re: /确认修改规划/ },
                    { name: '护航诊断上下文', re: /(?:小万护航|护航诉求|护航操作记录|历史护航诉求|当前护航诉求)/ }
                ];
                const escortFlowSignals = new Set();
                const normalizeEscortSettingTable = (value) => {
                    if (!value || typeof value !== 'object') return null;
                    const operationList = Array.isArray(value.operationList)
                        ? value.operationList.filter(Boolean)
                        : [];
                    const userSetting = value.userSetting && typeof value.userSetting === 'object'
                        ? value.userSetting
                        : null;

                    if (!operationList.length && !userSetting) return null;

                    return {
                        actionType: value.actionType || '',
                        operationList,
                        userSetting: userSetting || {},
                        footerInfo: value.footerInfo && typeof value.footerInfo === 'object'
                            ? value.footerInfo
                            : {}
                    };
                };
                const collectFlowSignalText = (value) => {
                    const text = String(value || '');
                    if (!text) return;
                    flowSignalRules.forEach(rule => {
                        if (rule.re.test(text)) escortFlowSignals.add(rule.name);
                    });
                };
                const normalizeMatchText = (value) => String(value || '').replace(/\s+/g, '').toLowerCase();
                const deepCloneObject = (value) => {
                    if (!value || typeof value !== 'object') return {};
                    try {
                        return JSON.parse(JSON.stringify(value));
                    } catch {
                        return {};
                    }
                };
                const toFiniteNumber = (value) => {
                    if (typeof value === 'number') return Number.isFinite(value) ? value : NaN;
                    if (value === null || value === undefined) return NaN;
                    const text = String(value).trim();
                    if (!text) return NaN;
                    const num = Number(text);
                    return Number.isFinite(num) ? num : NaN;
                };
                const normalizeActionType = (value, fallback = 'openInDialog') => {
                    const text = String(value || '').trim();
                    if (text === 'openInDialog' || text === 'updateInDialog') return text;
                    return fallback;
                };
                const resolveKeywordPreferenceCode = (value) => {
                    const directNum = toFiniteNumber(value);
                    if (Number.isFinite(directNum)) return directNum;
                    const text = normalizeMatchText(value);
                    if (!text) return null;
                    const map = {
                        '类目流量飙升词': 2,
                        '类目流量词': 2,
                        '类目飙升词': 2
                    };
                    return map[text] ?? null;
                };
                const resolveKeywordMatchPatternCode = (value) => {
                    const directNum = toFiniteNumber(value);
                    if (Number.isFinite(directNum)) return directNum;
                    const text = normalizeMatchText(value);
                    if (!text) return null;
                    if (text.includes('精准')) return 4;
                    if (text.includes('广泛')) return 1;
                    return null;
                };
                const normalizeOpenV3SettingKey = (key) => {
                    const keyMap = {
                        addKeyword: 'keywordAdd',
                        keywordAdd: 'keywordAdd',
                        switchKeywordMatchType: 'keywordSwitch',
                        keywordSwitch: 'keywordSwitch',
                        shieldKeyword: 'keywordMask',
                        keywordMask: 'keywordMask',
                        bidConstraintValue: 'bidConstraintValue',
                        netBidConstraintValue: 'netBidConstraintValue',
                        netConstraintValue: 'netBidConstraintValue',
                        netRoiConstraintValue: 'netBidConstraintValue',
                        budget: 'budget'
                    };
                    return keyMap[key] || key;
                };
                const normalizeUserSettingForOpenV3 = (userSettingRaw) => {
                    const userSetting = userSettingRaw && typeof userSettingRaw === 'object' ? userSettingRaw : {};
                    const normalized = {};
                    const mergeConfig = (key, cfg) => {
                        if (!normalized[key] || typeof normalized[key] !== 'object') normalized[key] = {};
                        Object.assign(normalized[key], cfg);
                    };
                    const normalizeKeywordAddConfig = (cfgRaw) => {
                        const cfg = deepCloneObject(cfgRaw);
                        const wordCntLimit = toFiniteNumber(
                            cfg.wordCntLimit ?? cfg.keywordLimit ?? cfg.wordLimit ?? cfg.selfWordLimit ?? cfg.upperLimit
                        );
                        if (Number.isFinite(wordCntLimit)) cfg.wordCntLimit = wordCntLimit;

                        const preference = resolveKeywordPreferenceCode(cfg.preference ?? cfg.keywordPreference ?? cfg.buyWordPreference);
                        if (typeof preference === 'number') cfg.preference = preference;

                        const matchPattern = resolveKeywordMatchPatternCode(cfg.matchPattern ?? cfg.matchType ?? cfg.pattern);
                        if (typeof matchPattern === 'number') cfg.matchPattern = matchPattern;

                        delete cfg.keywordLimit;
                        delete cfg.wordLimit;
                        delete cfg.selfWordLimit;
                        delete cfg.upperLimit;
                        delete cfg.keywordPreference;
                        delete cfg.buyWordPreference;
                        delete cfg.matchType;
                        delete cfg.pattern;
                        return cfg;
                    };
                    const normalizeBudgetConfig = (cfgRaw) => {
                        const cfg = deepCloneObject(cfgRaw);
                        const lowerLimit = toFiniteNumber(cfg.lowerLimit);
                        if (Number.isFinite(lowerLimit)) cfg.lowerLimit = lowerLimit;

                        const modifyTimesLimit = toFiniteNumber(cfg.modifyTimesLimit);
                        if (Number.isFinite(modifyTimesLimit)) cfg.modifyTimesLimit = modifyTimesLimit;

                        if (cfg.upperLimit === '不限') {
                            cfg.upperType = 0;
                        } else {
                            const upperLimit = toFiniteNumber(cfg.upperLimit);
                            if (Number.isFinite(upperLimit)) {
                                cfg.upperLimit = upperLimit;
                                if (cfg.upperType !== 0) cfg.upperType = 1;
                            }
                        }
                        return cfg;
                    };
                    const normalizeBidConfig = (cfgRaw) => {
                        const cfg = deepCloneObject(cfgRaw);
                        const lowerLimit = toFiniteNumber(cfg.lowerLimit);
                        if (Number.isFinite(lowerLimit)) cfg.lowerLimit = lowerLimit;

                        const upperLimit = toFiniteNumber(cfg.upperLimit);
                        if (Number.isFinite(upperLimit)) cfg.upperLimit = upperLimit;

                        const modifyTimesLimit = toFiniteNumber(cfg.modifyTimesLimit);
                        if (Number.isFinite(modifyTimesLimit)) cfg.modifyTimesLimit = modifyTimesLimit;

                        delete cfg.upperType;
                        return cfg;
                    };

                    Object.entries(userSetting).forEach(([rawKey, rawCfg]) => {
                        if (!rawKey || !rawCfg || typeof rawCfg !== 'object') return;
                        const key = normalizeOpenV3SettingKey(rawKey);
                        let cfg = deepCloneObject(rawCfg);
                        if (key === 'keywordAdd') cfg = normalizeKeywordAddConfig(cfg);
                        if (key === 'budget') cfg = normalizeBudgetConfig(cfg);
                        if (key === 'bidConstraintValue' || key === 'netBidConstraintValue') cfg = normalizeBidConfig(cfg);
                        mergeConfig(key, cfg);
                    });
                    return normalized;
                };
                const getModalEscortSettingRoot = () => {
                    const selectorList = [
                        '#ai_analyst_action_modal > div > div.dialog-modal-body.flex-1.min-height-0 > div',
                        '#ai_analyst_action_modal .dialog-modal-body.flex-1.min-height-0 > div',
                        '#ai_analyst_action_modal .dialog-modal-body > div'
                    ];
                    for (const selector of selectorList) {
                        const el = document.querySelector(selector);
                        if (el instanceof HTMLElement) return el;
                    }
                    return null;
                };
                const buildOperationAliases = (key, cfg = {}) => {
                    const aliases = new Set();
                    const pushAlias = (text) => {
                        const normalized = normalizeMatchText(text);
                        if (!normalized) return;
                        aliases.add(normalized);
                        aliases.add(normalized.replace(/调优/g, ''));
                    };
                    pushAlias(key);
                    pushAlias(cfg.targetName);
                    pushAlias(cfg.targetDisplayName);
                    pushAlias(cfg.operationName);
                    pushAlias(cfg.name);
                    if (key === 'budget') {
                        ['budget', '预算', '预算调优', '预算优化', '预算控制', '每日预算调控区间'].forEach(pushAlias);
                    } else if (key === 'bidConstraintValue') {
                        [
                            'bidconstraintvalue',
                            '出价约束',
                            '成本调控',
                            '平均点击成本',
                            '出价调控'
                        ].forEach(pushAlias);
                    } else if (key === 'netBidConstraintValue') {
                        [
                            'netbidconstraintvalue',
                            'netconstraintvalue',
                            'netroiconstraintvalue',
                            '投产比',
                            '净投产比',
                            '净投产比调控',
                            '投产比调优',
                            'roi',
                            '目标投产比',
                            '净目标投产比'
                        ].forEach(pushAlias);
                    } else if (key === 'addKeyword' || key === 'keywordAdd') {
                        ['addkeyword', 'keywordadd', '添加关键词', '买词偏好', '自选词上限', '关键词调控', '匹配方式'].forEach(pushAlias);
                    } else if (key === 'switchKeywordMatchType' || key === 'keywordSwitch') {
                        ['switchkeywordmatchtype', 'keywordswitch', '切换关键词匹配方式', '切换匹配方式'].forEach(pushAlias);
                    } else if (key === 'shieldKeyword' || key === 'keywordMask') {
                        ['shieldkeyword', 'keywordmask', '屏蔽关键词', '流量智选关键词'].forEach(pushAlias);
                    } else if (/bid/i.test(key)) {
                        ['出价', '出价调优', '智能出价'].forEach(pushAlias);
                    }
                    return Array.from(aliases).filter(Boolean);
                };
                const buildControlMatchContext = (root, control) => {
                    if (!(root instanceof HTMLElement) || !(control instanceof Element)) return '';
                    const contextTextList = [];
                    const seenText = new Set();
                    const pushContextText = (value, maxLength = 220) => {
                        const normalized = normalizeMatchText(value);
                        if (!normalized || normalized.length > maxLength) return;
                        if (seenText.has(normalized)) return;
                        seenText.add(normalized);
                        contextTextList.push(normalized);
                    };
                    ['aria-label', 'placeholder', 'name', 'id'].forEach(attr => {
                        pushContextText(control.getAttribute(attr), 120);
                    });
                    pushContextText(control.className, 160);
                    const contextNodes = [
                        control.closest('label'),
                        control.closest('.mxform-line'),
                        control.closest('[data-adc-comp]'),
                        control.closest('tr'),
                        control.closest('li'),
                        control.parentElement
                    ].filter(node => node instanceof Element && node !== root);
                    const seenNode = new Set();
                    contextNodes.forEach(node => {
                        if (seenNode.has(node)) return;
                        seenNode.add(node);
                        pushContextText(node.textContent || '');
                    });
                    let cursor = control.parentElement;
                    let depth = 0;
                    while (cursor && cursor instanceof Element && cursor !== root && depth < 4) {
                        const normalized = normalizeMatchText(cursor.textContent || '');
                        if (normalized && normalized.length <= 200 && /(预算|投产比|关键词|匹配|屏蔽|调控|出价|买词|次日|恢复|护航)/.test(normalized)) {
                            pushContextText(normalized, 200);
                            break;
                        }
                        cursor = cursor.parentElement;
                        depth += 1;
                    }
                    return contextTextList.join(' ');
                };
                const readEnabledFromExplicitControl = (control) => {
                    if (!(control instanceof Element)) return null;
                    if (control instanceof HTMLInputElement) {
                        const type = String(control.type || '').trim().toLowerCase();
                        if (type === 'checkbox') return !!control.checked;
                        if (type === 'radio') return control.checked ? true : null;
                    }
                    const raw = control.getAttribute('aria-checked');
                    if (raw === 'true') return true;
                    if (raw === 'false') return false;
                    return null;
                };
                const resolveSettingFieldByHint = (hint = '') => {
                    if (/wordcntlimit|keywordlimit|自选词上限|关键词上限|词上限/.test(hint)) return 'keywordLimit';
                    if (/preference|买词偏好|我希望增加/.test(hint)) return 'keywordPreference';
                    if (/matchpattern|匹配方式/.test(hint)) return 'matchType';
                    if (/lower|low|down|下限|最小/.test(hint)) return 'lowerLimit';
                    if (/upper|high|up|上限|最大/.test(hint)) return 'upperLimit';
                    if (/times|limit|次数|频次/.test(hint)) return 'modifyTimesLimit';
                    if (/dailyreset|次日|恢复/.test(hint)) return 'dailyReset';
                    if (/targetname|目标名称/.test(hint)) return 'targetName';
                    return '';
                };
                const buildControlOwnHint = (control) => {
                    if (!(control instanceof Element)) return '';
                    const hintTextList = [];
                    const seenHint = new Set();
                    const pushHint = (value, maxLength = 180) => {
                        const normalized = normalizeMatchText(value);
                        if (!normalized || normalized.length > maxLength) return;
                        if (seenHint.has(normalized)) return;
                        seenHint.add(normalized);
                        hintTextList.push(normalized);
                    };
                    ['aria-label', 'placeholder', 'name', 'id'].forEach(attr => {
                        pushHint(control.getAttribute(attr), 120);
                    });
                    if (control instanceof HTMLInputElement) pushHint(control.type, 24);
                    pushHint(control.className, 120);
                    const label = control.closest('label');
                    if (label instanceof Element) pushHint(label.textContent || '');
                    return hintTextList.join(' ');
                };
                const isAuxiliaryExplicitControlHint = (hint = '', key = '') => {
                    if (!hint) return false;
                    const normalizedKey = normalizeOpenV3SettingKey(key);
                    const field = resolveSettingFieldByHint(hint);
                    if (!field) return false;
                    if (field === 'dailyReset') return true;
                    if (field === 'keywordPreference' || field === 'keywordLimit') return true;
                    if (field === 'lowerLimit' || field === 'upperLimit' || field === 'modifyTimesLimit' || field === 'targetName') return true;
                    if (
                        field === 'matchType'
                        && normalizedKey !== 'switchkeywordmatchtype'
                        && normalizedKey !== 'keywordswitch'
                    ) {
                        return true;
                    }
                    return false;
                };
                const extractModalSettingPatch = (root, findSettingKeyByText, resolveControlContextText) => {
                    if (!(root instanceof HTMLElement)) return new Map();
                    const patchByKey = new Map();
                    const controlList = root.querySelectorAll('input,select,textarea');
                    controlList.forEach(control => {
                        if (!(control instanceof Element)) return;
                        const matchContext = typeof resolveControlContextText === 'function'
                            ? resolveControlContextText(control)
                            : '';
                        const key = findSettingKeyByText(matchContext);
                        if (!key) return;

                        const hint = normalizeMatchText(matchContext);
                        const field = resolveSettingFieldByHint(hint);
                        if (!field) return;

                        let value = '';
                        if (control instanceof HTMLInputElement) {
                            if (control.type === 'checkbox' || control.type === 'radio') value = control.checked;
                            else value = control.value;
                        } else if (control instanceof HTMLSelectElement || control instanceof HTMLTextAreaElement) {
                            value = control.value;
                        } else {
                            value = control.getAttribute('value') || '';
                        }
                        if (field === 'lowerLimit' || field === 'upperLimit' || field === 'modifyTimesLimit' || field === 'keywordLimit') {
                            const num = Number(value);
                            if (Number.isFinite(num)) value = num;
                            else return;
                        }
                        if (field === 'dailyReset') value = !!value;

                        const patch = patchByKey.get(key) || {};
                        patch[field] = value;
                        patchByKey.set(key, patch);
                    });
                    return patchByKey;
                };
                const resolveOpenV3Setting = () => {
                    const responseSetting = normalizeEscortSettingTable(latestEscortSettingTable);
                    const defaultUserSetting = {
                        bidConstraintValue: { enabled: false },
                        netBidConstraintValue: { enabled: false },
                        budget: { enabled: false }
                    };
                    const defaultDisplaySetting = normalizeEscortSettingTable({
                        actionType: 'openInDialog',
                        operationList: [],
                        userSetting: {
                            bidConstraintValue: { enabled: false },
                            netBidConstraintValue: { enabled: false },
                            budget: { enabled: false },
                            addKeyword: { enabled: false },
                            switchKeywordMatchType: { enabled: false },
                            shieldKeyword: { enabled: false }
                        },
                        footerInfo: {}
                    });
                    const ensureUserSettingEnabled = (settingTable) => {
                        if (!settingTable || typeof settingTable !== 'object') return null;
                        const baseUserSetting = settingTable.userSetting && typeof settingTable.userSetting === 'object'
                            ? deepCloneObject(settingTable.userSetting)
                            : {};
                        const operationList = Array.isArray(settingTable.operationList)
                            ? settingTable.operationList.filter(Boolean)
                            : [];
                        const allKeys = Array.from(new Set([
                            ...Object.keys(baseUserSetting),
                            ...operationList
                        ])).filter(Boolean);
                        if (!allKeys.length) return null;
                        allKeys.forEach(key => {
                            const cfg = baseUserSetting[key] && typeof baseUserSetting[key] === 'object'
                                ? baseUserSetting[key]
                                : {};
                            if (typeof cfg.enabled !== 'boolean') cfg.enabled = operationList.includes(key);
                            baseUserSetting[key] = cfg;
                        });
                        return baseUserSetting;
                    };
                    const readSettingFromModal = (settingTable) => {
                        if (!settingTable) return null;
                        const modalRoot = getModalEscortSettingRoot();
                        if (!(modalRoot instanceof HTMLElement)) return null;
                        const candidateKeys = Array.from(new Set([
                            ...(Array.isArray(settingTable.operationList) ? settingTable.operationList : []),
                            ...Object.keys(settingTable.userSetting || {})
                        ])).filter(Boolean);
                        if (!candidateKeys.length) return null;

                        const aliasList = candidateKeys.map(key => ({
                            key,
                            alias: buildOperationAliases(key, settingTable.userSetting?.[key] || {})
                        }));
                        const findSettingKeyByText = (text) => {
                            const normalized = normalizeMatchText(text);
                            if (!normalized) return '';
                            let bestKey = '';
                            let bestLength = 0;
                            aliasList.forEach(item => {
                                item.alias.forEach(alias => {
                                    if (!alias || !normalized.includes(alias)) return;
                                    if (alias.length > bestLength) {
                                        bestKey = item.key;
                                        bestLength = alias.length;
                                    }
                                });
                            });
                            return bestKey;
                        };

                        const explicitStateByKey = new Map();
                        modalRoot.querySelectorAll('input[type="checkbox"],input[type="radio"],[role="switch"],[aria-checked]').forEach(control => {
                            if (!(control instanceof Element)) return;
                            if (control instanceof HTMLInputElement) {
                                const type = String(control.type || '').trim().toLowerCase();
                                if (type === 'radio') return;
                            }
                            const matchContext = buildControlMatchContext(modalRoot, control);
                            const key = findSettingKeyByText(matchContext);
                            if (!key) return;
                            const ownHint = buildControlOwnHint(control);
                            if (isAuxiliaryExplicitControlHint(ownHint, key)) return;
                            const enabledFromControl = readEnabledFromExplicitControl(control);
                            if (typeof enabledFromControl !== 'boolean') return;
                            if (!explicitStateByKey.has(key)) {
                                explicitStateByKey.set(key, enabledFromControl);
                            }
                        });
                        const hasExplicitState = explicitStateByKey.size > 0;

                        const patchByKey = extractModalSettingPatch(
                            modalRoot,
                            findSettingKeyByText,
                            (control) => buildControlMatchContext(modalRoot, control)
                        );
                        const mergedSetting = normalizeEscortSettingTable({
                            actionType: settingTable.actionType || '',
                            operationList: [],
                            userSetting: {},
                            footerInfo: settingTable.footerInfo || {}
                        });
                        if (!mergedSetting) return null;

                        candidateKeys.forEach(key => {
                            const baseCfg = deepCloneObject(settingTable.userSetting?.[key] || {});
                            const explicitEnabled = explicitStateByKey.get(key);
                            const fallbackEnabled = Array.isArray(settingTable.operationList)
                                && settingTable.operationList.includes(key);
                            const enabled = typeof explicitEnabled === 'boolean'
                                ? explicitEnabled
                                : (hasExplicitState ? false : fallbackEnabled);
                            baseCfg.enabled = enabled;

                            const patch = patchByKey.get(key);
                            if (patch && typeof patch === 'object') Object.assign(baseCfg, patch);

                            mergedSetting.userSetting[key] = baseCfg;
                            if (enabled) mergedSetting.operationList.push(key);
                        });

                        if (!Object.keys(mergedSetting.userSetting).length) return null;
                        return mergedSetting;
                    };
                    const resolveSettingTargetKey = (userSettingBucket, sourceKey) => {
                        const aliasMap = {
                            bidConstraintValue: ['bidConstraintValue'],
                            netBidConstraintValue: ['netBidConstraintValue', 'netConstraintValue', 'netRoiConstraintValue'],
                            netConstraintValue: ['netConstraintValue', 'netBidConstraintValue', 'netRoiConstraintValue'],
                            netRoiConstraintValue: ['netRoiConstraintValue', 'netBidConstraintValue', 'netConstraintValue'],
                            budget: ['budget'],
                            addKeyword: ['addKeyword', 'keywordAdd'],
                            keywordAdd: ['keywordAdd', 'addKeyword'],
                            switchKeywordMatchType: ['switchKeywordMatchType', 'keywordSwitch'],
                            keywordSwitch: ['keywordSwitch', 'switchKeywordMatchType'],
                            shieldKeyword: ['shieldKeyword', 'keywordMask'],
                            keywordMask: ['keywordMask', 'shieldKeyword']
                        };
                        const candidateList = aliasMap[sourceKey] || [sourceKey];
                        return candidateList.find(key => key in (userSettingBucket || {})) || sourceKey;
                    };
                    const applyManualSetting = (settingTable, manualOverride) => {
                        if (!manualOverride || !manualOverride.enabled) return settingTable;
                        const manualFallbackSetting = normalizeEscortSettingTable({
                            actionType: normalizeActionType(manualOverride.actionType, 'openInDialog'),
                            operationList: Array.isArray(manualOverride.operationList)
                                ? manualOverride.operationList.filter(Boolean)
                                : [],
                            userSetting: deepCloneObject(
                                manualOverride.userSetting && typeof manualOverride.userSetting === 'object'
                                    ? manualOverride.userSetting
                                    : {}
                            ),
                            footerInfo: {}
                        });
                        const base = normalizeEscortSettingTable(settingTable) || manualFallbackSetting;
                        if (!base) return null;

                        const mergedSetting = normalizeEscortSettingTable({
                            actionType: normalizeActionType(manualOverride.actionType, normalizeActionType(base.actionType, 'openInDialog')),
                            operationList: [],
                            userSetting: deepCloneObject(base.userSetting || {}),
                            footerInfo: base.footerInfo || {}
                        });
                        if (!mergedSetting) return null;

                        const setNumericField = (cfg, field, value) => {
                            const num = Number(value);
                            if (Number.isFinite(num)) cfg[field] = num;
                        };
                        const setEnabledField = (cfg, value) => {
                            if (typeof value === 'boolean') cfg.enabled = value;
                        };
                        const patchKeywordLimitField = (cfg, value) => {
                            const num = Number(value);
                            if (!Number.isFinite(num)) return;
                            const candidateFieldList = ['wordCntLimit', 'keywordLimit', 'upperLimit', 'limit', 'wordLimit', 'selfWordLimit'];
                            const targetField = candidateFieldList.find(field => field in cfg) || 'keywordLimit';
                            cfg[targetField] = num;
                        };
                        const patchKeywordPreferenceField = (cfg, value) => {
                            const candidateFieldList = ['preference', 'keywordPreference', 'buyWordPreference'];
                            const targetField = candidateFieldList.find(field => field in cfg) || 'keywordPreference';
                            const preferenceCode = resolveKeywordPreferenceCode(value);
                            if (targetField === 'preference' || typeof cfg[targetField] === 'number') {
                                if (typeof preferenceCode === 'number') cfg[targetField] = preferenceCode;
                                return;
                            }
                            const text = String(value || '').trim();
                            if (!text) return;
                            cfg[targetField] = text;
                        };
                        const patchKeywordMatchTypeField = (cfg, value) => {
                            const candidateFieldList = ['matchPattern', 'matchType', 'pattern'];
                            const targetField = candidateFieldList.find(field => field in cfg) || 'matchType';
                            const matchPattern = resolveKeywordMatchPatternCode(value);
                            if (targetField === 'matchPattern' || targetField === 'pattern' || typeof cfg[targetField] === 'number') {
                                if (typeof matchPattern === 'number') cfg[targetField] = matchPattern;
                                return;
                            }
                            const text = String(value || '').trim();
                            if (!text) return;
                            cfg[targetField] = text;
                        };

                        const manualUserSetting = manualOverride.userSetting && typeof manualOverride.userSetting === 'object'
                            ? manualOverride.userSetting
                            : {};
                        const manualTargetKeySet = new Set();
                        Object.entries(manualUserSetting).forEach(([key, manualCfgRaw]) => {
                            if (!key || !manualCfgRaw || typeof manualCfgRaw !== 'object') return;
                            const manualCfg = manualCfgRaw;
                            const targetKey = resolveSettingTargetKey(mergedSetting.userSetting, key);
                            manualTargetKeySet.add(targetKey);
                            const baseCfg = mergedSetting.userSetting[targetKey] && typeof mergedSetting.userSetting[targetKey] === 'object'
                                ? mergedSetting.userSetting[targetKey]
                                : {};
                            setEnabledField(baseCfg, manualCfg.enabled);

                            if (targetKey === 'budget' || targetKey === 'bidConstraintValue' || targetKey === 'netBidConstraintValue') {
                                setNumericField(baseCfg, 'lowerLimit', manualCfg.lowerLimit);
                                setNumericField(baseCfg, 'modifyTimesLimit', manualCfg.modifyTimesLimit);
                                if (typeof manualCfg.dailyReset === 'boolean') baseCfg.dailyReset = manualCfg.dailyReset;
                                if (manualCfg.upperLimit === '不限') {
                                    if (targetKey === 'budget') baseCfg.upperType = 0;
                                    if (targetKey === 'bidConstraintValue' || targetKey === 'netBidConstraintValue') delete baseCfg.upperType;
                                } else {
                                    const upperLimit = Number(manualCfg.upperLimit);
                                    if (Number.isFinite(upperLimit)) {
                                        baseCfg.upperLimit = upperLimit;
                                        if (targetKey === 'budget') baseCfg.upperType = 1;
                                        if (targetKey === 'bidConstraintValue' || targetKey === 'netBidConstraintValue') delete baseCfg.upperType;
                                    }
                                }
                            }

                            if (targetKey === 'addKeyword' || targetKey === 'keywordAdd') {
                                patchKeywordLimitField(baseCfg, manualCfg.keywordLimit);
                                patchKeywordPreferenceField(baseCfg, manualCfg.keywordPreference);
                                patchKeywordMatchTypeField(baseCfg, manualCfg.matchType);
                            }

                            mergedSetting.userSetting[targetKey] = baseCfg;
                        });
                        Object.entries(mergedSetting.userSetting).forEach(([key, cfgRaw]) => {
                            const cfg = cfgRaw && typeof cfgRaw === 'object' ? cfgRaw : {};
                            if (!manualTargetKeySet.has(key)) {
                                cfg.enabled = false;
                            } else if (typeof cfg.enabled !== 'boolean') {
                                cfg.enabled = false;
                            }
                            mergedSetting.userSetting[key] = cfg;
                        });

                        const operationKeySet = new Set();
                        Object.entries(mergedSetting.userSetting).forEach(([key, cfg]) => {
                            if (cfg && typeof cfg === 'object' && cfg.enabled === true) operationKeySet.add(key);
                        });
                        mergedSetting.operationList = Array.from(operationKeySet);
                        return mergedSetting;
                    };
                    const buildManualDisabledOverride = (manualOverride) => {
                        if (!manualOverride || typeof manualOverride !== 'object') return null;
                        const userSettingSnapshot = deepCloneObject(
                            manualOverride.userSetting && typeof manualOverride.userSetting === 'object'
                                ? manualOverride.userSetting
                                : {}
                        );
                        Object.values(userSettingSnapshot).forEach(cfg => {
                            if (!cfg || typeof cfg !== 'object') return;
                            cfg.enabled = false;
                        });
                        return {
                            ...manualOverride,
                            enabled: true,
                            operationList: [],
                            userSetting: userSettingSnapshot
                        };
                    };

                    const modalSetting = readSettingFromModal(responseSetting);
                    const manualSettingMaster = document.getElementById(`${CONFIG.UI_ID}-manual-enable`);
                    const manualSetting = (
                        manualSettingMaster instanceof HTMLInputElement
                        && typeof UI.readManualEscortSettingOverride === 'function'
                    )
                        ? UI.readManualEscortSettingOverride({ includeDisabled: true })
                        : null;
                    let finalSetting = modalSetting || responseSetting;
                    let sourceLabel = modalSetting
                        ? '弹窗最新设置'
                        : (responseSetting ? '诊断返回设置' : '默认护航设置');
                    let fromModal = !!modalSetting;
                    let fromManual = false;
                    if (manualSetting && typeof manualSetting === 'object') {
                        if (manualSetting.enabled) {
                            const mergedByManual = applyManualSetting(finalSetting, manualSetting);
                            if (mergedByManual) {
                                finalSetting = mergedByManual;
                                sourceLabel = '手动设置参数';
                                fromManual = true;
                                fromModal = false;
                            }
                        } else {
                            const manualDisabledOverride = buildManualDisabledOverride({
                                ...manualSetting,
                                actionType: normalizeActionType(
                                    manualSetting.actionType,
                                    normalizeActionType(finalSetting?.actionType, 'openInDialog')
                                )
                            });
                            const manualDisabledSetting = applyManualSetting(finalSetting, manualDisabledOverride);
                            if (manualDisabledSetting) {
                                finalSetting = manualDisabledSetting;
                                sourceLabel = '手动设置参数（未勾选）';
                                fromManual = true;
                                fromModal = false;
                            }
                        }
                    }
                    const submitSetting = normalizeEscortSettingTable(finalSetting);
                    const displaySetting = submitSetting || defaultDisplaySetting;
                    const userSetting = normalizeUserSettingForOpenV3(ensureUserSettingEnabled(submitSetting) || defaultUserSetting);
                    const actionType = normalizeActionType(submitSetting?.actionType || manualSetting?.actionType || '', 'openInDialog');

                    return {
                        actionType,
                        userSetting,
                        displaySetting,
                        sourceLabel,
                        fromModal,
                        fromManual
                    };
                };
                const submitEscortOpenV3 = async (reasonText = '') => {
                    if (reasonText) card.log(reasonText, 'orange');
                    const resolvedOpenV3Setting = resolveOpenV3Setting();
                    const displayOperationCount = Array.isArray(resolvedOpenV3Setting.displaySetting?.operationList)
                        ? resolvedOpenV3Setting.displaySetting.operationList.length
                        : 0;
                    const displaySettingCount = displayOperationCount || Object.keys(resolvedOpenV3Setting.displaySetting?.userSetting || {}).length;
                    if (displaySettingCount) {
                        card.log(`使用${resolvedOpenV3Setting.sourceLabel}：${displaySettingCount} 个设置项`, '#1890ff');
                    }
                    card.log(`提交护航权益授权（${resolvedOpenV3Setting.sourceLabel}）...`, 'orange');
                    card.setStatus('提交中', 'info');
                    const openV3BizCode = talkData?.contextParam?.bizCode || talkData?.contextParam?.mx_bizCode || 'onebpSearch';

                    const isDuplicateEscortMessage = (message) => /已开启护航|请勿重复开启|重复开启|已在护航|正在护航/.test(String(message || ''));
                    const requestOpenV3ByActionType = async (actionType) => {
                        const openV3Res = await API.request('https://ai.alimama.com/ai/escort/openV3.json', {
                            bizCode: openV3BizCode,
                            campaignId: String(campaignId),
                            userSetting: resolvedOpenV3Setting.userSetting,
                            actionType,
                            timeStr: Date.now(),
                            dynamicToken: State.tokens.dynamicToken || '',
                            csrfID: '',
                            loginPointId: State.tokens.loginPointId || ''
                        }, {
                            signal: State.runAbortController?.signal
                        });
                        const success = openV3Res?.success || openV3Res?.ok || openV3Res?.info?.ok;
                        const msg = openV3Res?.info?.message || (success ? '护航开启成功' : '护航开启失败');
                        return {
                            success,
                            msg,
                            actionType
                        };
                    };
                    const buildExecutionStateMap = (displaySetting, success) => {
                        if (!displaySetting || typeof displaySetting !== 'object') return {};
                        const keySet = new Set();
                        const operationList = Array.isArray(displaySetting.operationList)
                            ? displaySetting.operationList.filter(Boolean)
                            : [];
                        if (operationList.length) {
                            operationList.forEach(key => keySet.add(key));
                        }
                        if (!operationList.length && displaySetting.userSetting && typeof displaySetting.userSetting === 'object') {
                            Object.entries(displaySetting.userSetting).forEach(([key, cfg]) => {
                                if (!key || !cfg || typeof cfg !== 'object') return;
                                if (cfg.enabled === false) return;
                                keySet.add(key);
                            });
                        }
                        if (!keySet.size) {
                            return {};
                        }
                        const map = {};
                        const stateValue = !!success;
                        keySet.forEach(key => {
                            if (!key) return;
                            map[key] = stateValue;
                            map[normalizeOpenV3SettingKey(key)] = stateValue;
                        });
                        return map;
                    };

                    let submitResult = await requestOpenV3ByActionType(resolvedOpenV3Setting.actionType);
                    if (!submitResult.success && isDuplicateEscortMessage(submitResult.msg)) {
                        if (resolvedOpenV3Setting.actionType !== 'updateInDialog') {
                            card.log('检测到计划可能已在护航中，改用 updateInDialog 强制执行一次...', '#fa8c16');
                            const forceResult = await requestOpenV3ByActionType('updateInDialog');
                            if (forceResult.success) {
                                submitResult = {
                                    ...forceResult,
                                    forced: true
                                };
                            } else if (isDuplicateEscortMessage(forceResult.msg)) {
                                submitResult = {
                                    ...forceResult,
                                    success: true,
                                    msg: '当前计划已开启护航，视为执行成功',
                                    forced: true
                                };
                            } else {
                                submitResult = {
                                    ...forceResult,
                                    forced: true
                                };
                            }
                        } else {
                            submitResult = {
                                ...submitResult,
                                success: true,
                                msg: '当前计划已开启护航，视为执行成功'
                            };
                        }
                    }

                    const executionState = buildExecutionStateMap(resolvedOpenV3Setting.displaySetting, submitResult.success);
                    UI.renderEscortSettingTableToCard(card, resolvedOpenV3Setting.displaySetting, {
                        executionState,
                        sourceLabel: resolvedOpenV3Setting.sourceLabel,
                        fromManual: resolvedOpenV3Setting.fromManual
                    });

                    if (submitResult.forced) {
                        card.log(`已按强制模式重提：${submitResult.actionType}`, '#4b5563');
                    }
                    card.log(`${submitResult.success ? '✓' : '✗'} ${submitResult.msg}`, submitResult.success ? 'green' : 'red');
                    card.setStatus(submitResult.success ? '护航中' : '失败', submitResult.success ? 'success' : 'error');
                    card.collapse();
                    return { success: submitResult.success, msg: submitResult.msg };
                };

                const collect = (obj, depth = 0) => {
                    if (!obj || depth > 20) return;
                    if (typeof obj === 'string') {
                        collectFlowSignalText(obj);
                        return;
                    }
                    if (Array.isArray(obj)) {
                        obj.forEach(item => collect(item, depth + 1));
                        return;
                    }
                    if (typeof obj !== 'object') return;

                    for (const field of ['title', 'summary', 'content', 'text', 'actionText']) {
                        if (typeof obj[field] === 'string') collectFlowSignalText(obj[field]);
                    }

                    const escortSettingFromRender = obj.renderCode === 'escortSettingTable'
                        ? normalizeEscortSettingTable(obj.data)
                        : null;
                    const escortSettingCandidate = escortSettingFromRender || normalizeEscortSettingTable(obj);
                    if (escortSettingCandidate) {
                        latestEscortSettingTable = escortSettingCandidate;
                        collectFlowSignalText(escortSettingCandidate.footerInfo?.enterText);
                    }

                    if (Array.isArray(obj.actionList) && obj.actionList.length) {
                        const key = obj.actionList.map(i => {
                            const infoStr = typeof i.actionInfo === 'string'
                                ? i.actionInfo
                                : JSON.stringify(i.actionInfo ?? '');
                            return `${i.actionText}::${(infoStr || '').substring(0, 100)}`;
                        }).join('|||');
                        if (!seenKeys.has(key)) {
                            seenKeys.add(key);
                            allActionLists.push(obj.actionList);
                        }
                    }
                    for (const k in obj) collect(obj[k], depth + 1);
                };

                if (talkRes.isStream) {
                    talkRes.chunks.forEach(c => collect(c));
                } else {
                    collect(talkRes);
                }

                // 显示所有方案
                if (allActionLists.length) {
                    Logger.debug('方案列表:', allActionLists.flat().map((a, i) => ({
                        序号: i + 1,
                        actionText: a.actionText || '-',
                        actionType: a.actionType || '-',
                        hasInfo: a.actionInfo ? '✓' : '-'
                    })));

                    card.log(`收到 ${allActionLists.length} 组方案`, '#1890ff');
                    UI.renderAllActionsToCard(card, allActionLists);
                }

                // 寻找护航方案（兼容平台新旧文案）
                let actionList = null, targetInfo = null;
                for (const list of allActionLists) {
                    const escort = list.find(i => Utils.isEscortActionText(i?.actionText));
                    if (escort?.actionInfo) {
                        try {
                            const info = JSON.parse(escort.actionInfo);
                            if (info.actionList) {
                                actionList = info.actionList;
                                targetInfo = info;
                                break;
                            }
                        } catch { }
                    }
                }

                // 无旧 actionList 时，兼容小万护航新链路（需要用户在右侧面板确认授权）
                if (!actionList?.length) {
                    const matchedSignals = Array.from(escortFlowSignals);
                    const isNewEscortFlow = escortFlowSignals.has('护航工作授权')
                        || escortFlowSignals.has('确认修改规划');

                    if (isNewEscortFlow) {
                        Logger.info('命中新护航链路信号:', matchedSignals);
                        card.log(`识别到小万护航新流程：${matchedSignals.join('、')}`, '#1890ff');
                        if (latestEscortSettingTable?.operationList?.length) {
                            card.log(`获取到 ${latestEscortSettingTable.operationList.length} 个护航方案（新链路）`, '#1890ff');
                        }
                        return await submitEscortOpenV3();
                    }
                }

                // 无 actionList 且未命中新链路关键词时，读取计划行状态避免误判
                if (!actionList?.length) {
                    const rowByCheckbox = document.querySelector(`input[type="checkbox"][value="${campaignId}"]`)?.closest('tr');
                    const rowByPlanId = Array.from(document.querySelectorAll('tr'))
                        .find(tr => (tr.textContent || '').includes(`计划ID：${campaignId}`));
                    const rowText = (rowByCheckbox?.textContent || rowByPlanId?.textContent || '').replace(/\s+/g, '');

                    if (/护航调优中|护航中|护航工作报告/.test(rowText) || /护航已结束/.test(rowText)) {
                        const rowStatusText = /护航已结束/.test(rowText)
                            ? '计划护航已结束（页面状态识别）'
                            : '计划当前处于小万护航中（页面状态识别）';
                        if (latestEscortSettingTable?.operationList?.length) {
                            card.log(`获取到 ${latestEscortSettingTable.operationList.length} 个护航方案（新链路）`, '#1890ff');
                        }
                        return await submitEscortOpenV3(`ℹ️ ${rowStatusText}，按配置强制重新提交护航`);
                    }
                }

                if (!actionList?.length) {
                    card.log('⚠️ 未发现护航方案（算法护航/小万护航）', 'orange');
                    card.setStatus('无方案', 'warning');
                    card.collapse();
                    return { success: false, msg: '无护航方案' };
                }

                // 显示护航方案
                card.log(`获取到 ${actionList.length} 个护航方案`, '#1890ff');
                UI.renderEscortActionsToCard(card, actionList);

                // 提交护航
                card.log('提交护航请求...', 'orange');
                card.setStatus('提交中', 'info');

                const openRes = await API.request('https://ai.alimama.com/ai/escort/open.json', {
                    actionList,
                    campaignId: campaignId.toString(),
                    continueDays: 3650,
                    target: targetInfo?.target || '深度拿量',
                    timeStr: Date.now(),
                    bizCode: userConfig.bizCode,
                    ...State.tokens
                }, {
                    signal: State.runAbortController?.signal
                });

                const success = openRes?.success || openRes?.ok || openRes?.info?.ok;
                const msg = openRes?.info?.message || (success ? '成功' : '未知错误');

                card.log(`${success ? '✓' : '✗'} ${msg}`, success ? 'green' : 'red');
                card.setStatus(success ? '成功' : '失败', success ? 'success' : 'error');
                card.collapse();
                return { success, msg };

            } catch (e) {
                if (e?.name === 'AbortError') {
                    card.log('已取消', '#999');
                    card.setStatus('已取消', 'warning');
                    card.collapse();
                    return { success: false, msg: '已取消' };
                }
                card.log(`异常: ${e.message}`, 'red');
                card.setStatus('异常', 'error');
                card.collapse();
                return { success: false, msg: e.message };
            }
        },

        // 扫描页面计划（单次 DOM 遍历）
        scanCampaigns: () => {
            const tasks = new Map();
            const campaignIdRegex = /campaignId=(\d{6,})/;

            document.querySelectorAll('a[href*="campaignId="], input[type="checkbox"][value]').forEach(el => {
                if (el.tagName === 'A') {
                    const m = el.href.match(campaignIdRegex);
                    if (m && !tasks.has(m[1])) {
                        tasks.set(m[1], el.innerText.trim() || '未知计划');
                    }
                } else if (/^\d{6,}$/.test(el.value) && !el.closest('div[mx-view*="user-pop"]')) {
                    if (!tasks.has(el.value)) {
                        const row = el.closest('tr');
                        const name = row?.querySelector('a[title]')?.getAttribute('title') || '未知计划';
                        tasks.set(el.value, name);
                    }
                }
            });

            return Array.from(tasks.entries());
        },

        // 主运行函数 - 并发执行版本
        run: async () => {
            State.currentRunId++;
            const runId = State.currentRunId;
            if (State.runAbortController) State.runAbortController.abort();
            State.runAbortController = new AbortController();

            // 清空日志
            const log = document.getElementById(`${CONFIG.UI_ID}-log`);
            if (log) log.textContent = '';

            UI.updateStatus('正在解析页面...', 'blue');

            TokenManager.refresh();

            if (!State.tokens.loginPointId || !State.tokens.dynamicToken) {
                UI.updateStatus('Token 未就绪，请点击页面任意处', 'red');
                return;
            }

            const campaigns = Core.scanCampaigns();
            if (!campaigns.length) {
                UI.updateStatus('未找到计划ID', '#ff4d4f');
                return;
            }

            const total = campaigns.length;
            const concurrency = userConfig.concurrency || 3;
            UI.updateStatus(`识别到 ${total} 个计划，开始并发处理 (并发数: ${concurrency})...`, '#1890ff');

            // 创建任务函数数组
            const taskFns = campaigns.map(([id, name], i) => async () => {
                if (State.currentRunId !== runId) return { success: false, id, name, msg: '已取消' };
                const res = await Core.processCampaign(id, name, i + 1, total);
                return { ...res, id, name };
            });

            // 并发执行（使用用户设置的并发数）
            const results = await Utils.concurrentLimit(taskFns, concurrency);

            // 统计结果
            const successList = [], failList = [];
            results.forEach(r => {
                if (r.status === 'fulfilled') {
                    const { success, id, name, msg } = r.value;
                    (success ? successList : failList).push({ id, name, msg });
                } else {
                    failList.push({ id: '-', name: '未知', msg: r.reason?.message || '执行异常' });
                }
            });

            // 显示结果
            UI.updateStatus('--------------------------------', '#999');
            UI.updateStatus(`执行完成。成功: ${successList.length}, 失败: ${failList.length}`,
                successList.length ? 'green' : 'red');
        }
    };

    // ==================== 初始化 ====================
    try {
        const hooks = createHookManager();
        hooks?.install?.();
    } catch { }
    TokenManager.hookXHR();

    // NOTE: page bridge 默认仅在调试模式下暴露，避免向页面脚本开放高权限 API
    const pageGlobal = (typeof unsafeWindow !== 'undefined' && unsafeWindow) ? unsafeWindow : window;
    const PAGE_API_DEBUG_STORAGE_KEY = '__AM_WXT_DEBUG_PAGE_API__';
    const shouldExposePageApiDebug = () => {
        try {
            return window.localStorage?.getItem?.(PAGE_API_DEBUG_STORAGE_KEY) === '1';
        } catch { }
        return false;
    };
    const API_BRIDGE_REQ_EVENT = '__AM_WXT_PLAN_API_BRIDGE_REQ__';
    const API_BRIDGE_RES_EVENT = '__AM_WXT_PLAN_API_BRIDGE_RES__';
    const API_BRIDGE_MSG_CHANNEL = '__AM_WXT_PLAN_API_BRIDGE_MSG__';
