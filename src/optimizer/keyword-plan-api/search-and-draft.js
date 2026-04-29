        const searchItems = async (params = {}) => {
            const runtime = await getRuntimeDefaults(false);
            const bizCode = params.bizCode || runtime.bizCode || DEFAULTS.bizCode;
            const query = (params.query || '').trim();
            const queryItemIds = parseQueryToItemIds(query);
            const itemIdList = uniqueBy([...(params.itemIdList || []), ...queryItemIds].map(v => String(v).trim()).filter(Boolean), v => v);
            const hasTagId = Object.prototype.hasOwnProperty.call(params, 'tagId');
            const hasChannelKey = Object.prototype.hasOwnProperty.call(params, 'channelKey');
            const payload = {
                needQualification: true,
                materialType: 1,
                bizCode,
                promotionScene: params.promotionScene || runtime.promotionScene || DEFAULTS.promotionScene,
                itemSelectedMode: params.itemSelectedMode || runtime.itemSelectedMode || DEFAULTS.itemSelectedMode,
                subPromotionType: params.subPromotionType || DEFAULTS.subPromotionType,
                promotionType: params.promotionType || DEFAULTS.promotionType,
                offset: toNumber(params.offset, 0),
                pageSize: Math.max(1, Math.min(200, toNumber(params.pageSize, 40)))
            };
            if (hasTagId) {
                if (params.tagId !== undefined && params.tagId !== null && String(params.tagId).trim() !== '') {
                    payload.tagId = params.tagId;
                }
            } else {
                payload.tagId = '101111310';
            }
            if (hasChannelKey) {
                if (params.channelKey !== undefined && params.channelKey !== null && String(params.channelKey).trim() !== '') {
                    payload.channelKey = params.channelKey;
                }
            } else if (!query) {
                payload.channelKey = 'effect';
            }
            if (itemIdList.length) payload.itemIdList = itemIdList;
            if (query && !itemIdList.length) {
                payload.searchKeyword = query;
                payload.keyword = query;
                payload.itemTitle = query;
            }
            if (isPlainObject(params.extra)) Object.assign(payload, params.extra);

            const res = await requestOne(ENDPOINTS.materialFindPage, bizCode, payload, params.requestOptions || {});
            const list = Array.isArray(res?.data?.list) ? res.data.list.map(normalizeItem).filter(item => item.materialId) : [];
            return {
                ok: true,
                count: toNumber(res?.data?.count, list.length),
                list,
                raw: res
            };
        };

        const parseMatchScope = (value, fallback = DEFAULTS.matchScope) => {
            if (value === undefined || value === null || value === '') return fallback;
            if (value === 1 || value === '1' || value === 'exact' || value === '精准' || value === '精确') return 1;
            if (value === 4 || value === '4' || value === 'broad' || value === '广泛') return 4;
            return fallback;
        };

        const parseKeywordItem = (input, keywordDefaults = {}) => {
            const fallbackBid = toNumber(keywordDefaults.bidPrice, 1);
            const fallbackMatch = parseMatchScope(keywordDefaults.matchScope, DEFAULTS.matchScope);
            const fallbackStatus = toNumber(keywordDefaults.onlineStatus, DEFAULTS.keywordOnlineStatus);

            if (isPlainObject(input)) {
                const word = String(input.word || input.keyword || '').trim();
                if (!word) return null;
                return {
                    word,
                    bidPrice: toNumber(input.bidPrice, fallbackBid),
                    matchScope: parseMatchScope(input.matchScope, fallbackMatch),
                    onlineStatus: toNumber(input.onlineStatus, fallbackStatus)
                };
            }

            const raw = String(input || '').trim();
            if (!raw) return null;
            const parts = raw.split(/[,\t，]/).map(s => s.trim()).filter(Boolean);
            const [word, bidPrice, matchScope] = parts;
            if (!word) return null;
            return {
                word,
                bidPrice: toNumber(bidPrice, fallbackBid),
                matchScope: parseMatchScope(matchScope, fallbackMatch),
                onlineStatus: fallbackStatus
            };
        };

        const parseKeywords = (keywordsInput, keywordDefaults = {}) => {
            if (!keywordsInput) return [];
            if (Array.isArray(keywordsInput)) {
                return uniqueBy(
                    keywordsInput.map(item => parseKeywordItem(item, keywordDefaults)).filter(Boolean),
                    item => item.word
                );
            }
            const text = String(keywordsInput);
            const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
            return uniqueBy(
                lines.map(line => parseKeywordItem(line, keywordDefaults)).filter(Boolean),
                item => item.word
            );
        };

        const fetchRecommendWordList = async ({ bizCode, materialId, defaults, source = 'auto', requestOptions }) => {
            const idValue = toIdValue(materialId);
            const body = {
                bizCode,
                itemSelectedMode: defaults.itemSelectedMode,
                bidTypeV2: defaults.bidTypeV2,
                bidTargetV2: defaults.bidTargetV2,
                promotionScene: defaults.promotionScene,
                materialId: idValue,
                materialIdList: [idValue]
            };
            const paths = source === 'kr'
                ? [ENDPOINTS.bidwordSuggestKr, ENDPOINTS.bidwordSuggestDefault]
                : source === 'default'
                    ? [ENDPOINTS.bidwordSuggestDefault]
                    : [ENDPOINTS.bidwordSuggestDefault, ENDPOINTS.bidwordSuggestKr];
            for (const path of paths) {
                try {
                    const res = await requestOne(path, bizCode, body, requestOptions || {});
                    const list = res?.data?.list?.[0]?.wordList;
                    if (Array.isArray(list) && list.length) return list;
                } catch (err) {
                    log.warn(`推荐词接口失败 ${path}:`, err?.message || err);
                }
            }
            return [];
        };

        const fetchRecommendWordPackageList = async ({ bizCode, materialId, defaults, requestOptions }) => {
            const idValue = toIdValue(materialId);
            const body = {
                bizCode,
                itemSelectedMode: defaults.itemSelectedMode,
                bidTypeV2: defaults.bidTypeV2,
                bidTargetV2: defaults.bidTargetV2,
                promotionScene: defaults.promotionScene,
                materialId: idValue,
                materialIdList: [idValue]
            };
            try {
                const res = await requestOne(ENDPOINTS.wordPackageSuggestDefault, bizCode, body, requestOptions || {});
                const list = res?.data?.list?.[0]?.wordPackageList;
                return Array.isArray(list) ? list : [];
            } catch (err) {
                log.warn('推荐词包接口失败:', err?.message || err);
                return [];
            }
        };

        const getCrowdMxId = (label = {}) => {
            const targetType = label?.targetType;
            const labelId = label?.labelId;
            const priceDimension = label?.priceDimension;
            const isMulti = !!label?.isMulti;
            if (priceDimension === 'OPTION' || (priceDimension === 'LABEL' && isMulti)) {
                const optionValues = (label?.optionList || [])
                    .map(option => String(option?.optionValue ?? '').trim())
                    .filter(Boolean)
                    .sort();
                return `${targetType}_${labelId}_${optionValues.join('_')}`;
            }
            return `${targetType}_${labelId}`;
        };

        const buildCrowdName = (label = {}) => {
            const labelName = String(label?.labelName || '').trim();
            const optionName = uniqueBy(
                (label?.optionList || []).map(option => String(option?.optionName || '').trim()).filter(Boolean),
                name => name
            ).join('，');
            return uniqueBy([labelName, optionName].filter(Boolean), name => name).join('：');
        };

        const labelListToCrowdList = (labelList = []) => {
            const out = [];
            (labelList || []).forEach((labelItem) => {
                if (!labelItem || typeof labelItem !== 'object') return;
                const priceDimension = labelItem.priceDimension;
                const priceMode = String(labelItem.priceMode);
                const optionList = Array.isArray(labelItem.optionList) ? labelItem.optionList : [];

                if (priceDimension === 'OPTION' || ((priceDimension === 'LABEL') && !!labelItem.isMulti)) {
                    optionList.forEach((option) => {
                        const label = deepClone(labelItem);
                        label.optionList = [deepClone(option)];
                        const crowd = {
                            crowd: {
                                targetType: labelItem.targetType,
                                label,
                                crowdName: buildCrowdName(label)
                            },
                            price: deepClone(option?.price || {}),
                            showTagList: label.showTagList || []
                        };
                        crowd.mx_crowdId = getCrowdMxId(label);
                        out.push(crowd);
                    });
                    return;
                }

                if (priceDimension === 'LABEL' || ['0', '1', '-1', '2', '3'].includes(priceMode)) {
                    const label = deepClone(labelItem);
                    const crowd = {
                        crowd: {
                            targetType: labelItem.targetType,
                            label,
                            crowdName: buildCrowdName(label)
                        },
                        price: deepClone(label?.price || {}),
                        showTagList: label.showTagList || []
                    };
                    crowd.mx_crowdId = getCrowdMxId(label);
                    out.push(crowd);
                }
            });
            return uniqueBy(out, item => item?.mx_crowdId || `${item?.crowd?.label?.labelId || ''}_${item?.crowd?.label?.optionList?.[0]?.optionValue || ''}`);
        };

        const normalizeCrowdRecommendStrategy = (value = '') => {
            const normalized = normalizeSceneSettingValue(value);
            if (!normalized) return '';
            if (/^(jingdian|jihui|zidingyi|leimu)(?:_laxin)?$/i.test(normalized)) {
                return normalized.toLowerCase();
            }
            if (/竞店|经典/.test(normalized)) return 'jingdian';
            if (/机会/.test(normalized)) return 'jihui';
            if (/跨类目/.test(normalized)) return 'leimu';
            if (/自定义/.test(normalized)) return 'zidingyi';
            return '';
        };

        const resolveCrowdRecommendStrategyByGoal = (goalLabel = '') => {
            const goal = normalizeGoalCandidateLabel(goalLabel || '');
            if (!goal) return '';
            if (/竞店|经典/.test(goal)) return 'jingdian';
            if (/机会/.test(goal)) return 'jihui';
            if (/跨类目/.test(goal)) return 'leimu';
            if (/自定义/.test(goal)) return 'zidingyi';
            return '';
        };

        const expandCrowdRecommendStrategyAliases = (strategy = '') => {
            const normalized = normalizeCrowdRecommendStrategy(strategy || '');
            if (!normalized) return [];
            const base = normalized.replace(/_laxin$/i, '');
            return uniqueBy(
                [
                    base,
                    `${base}_laxin`
                ]
                    .map(item => String(item || '').trim().toLowerCase())
                    .filter(Boolean),
                item => item
            );
        };

        const buildCrowdRecommendSceneCandidates = (defaults = {}) => uniqueBy(
            [
                defaults?.promotionScene,
                defaults?.storeData?.promotionScene,
                defaults?.solutionTemplate?.campaign?.promotionScene,
                'promotion_scene_item',
                'promotion_scene_display_laxin'
            ]
                .map(item => normalizeSceneSettingValue(item))
                .filter(item => item && /^promotion_scene_/i.test(item)),
            item => item
        );

        const buildCrowdRecommendStrategyCandidates = (defaults = {}, goalLabel = '') => uniqueBy(
            [
                normalizeCrowdRecommendStrategy(defaults?.promotionStrategy || ''),
                normalizeCrowdRecommendStrategy(defaults?.storeData?.promotionStrategy || ''),
                normalizeCrowdRecommendStrategy(defaults?.solutionTemplate?.campaign?.promotionStrategy || ''),
                resolveCrowdRecommendStrategyByGoal(goalLabel || ''),
                /自定义/.test(normalizeGoalCandidateLabel(goalLabel || '')) ? 'zidingyi' : '',
                'jingdian',
                'zidingyi'
            ]
                .filter(Boolean)
                .flatMap(item => expandCrowdRecommendStrategyAliases(item)),
            item => item
        );

        const normalizeCrowdRecommendMaterialList = (materialList = []) => {
            const normalized = uniqueBy(
                (Array.isArray(materialList) ? materialList : [])
                    .map(item => {
                        if (isPlainObject(item)) {
                            const materialId = toIdValue(item?.materialId || item?.itemId);
                            if (!materialId) return null;
                            const resolvedMaterialName = String(item?.materialName || item?.name || '').trim() || `商品${materialId}`;
                            return {
                                materialId,
                                materialName: resolvedMaterialName
                            };
                        }
                        const materialId = toIdValue(item);
                        if (!materialId) return null;
                        return {
                            materialId,
                            materialName: `商品${materialId}`
                        };
                    })
                    .filter(item => item && item.materialId),
                item => item.materialId
            );
            if (normalized.length) return normalized.slice(0, 10);
            const fallbackId = toIdValue(SCENE_SYNC_DEFAULT_ITEM_ID);
            return fallbackId
                ? [{ materialId: fallbackId, materialName: `商品${fallbackId}` }]
                : [];
        };

        const buildCrowdRecommendLabelList = (labelIdList = []) => {
            const ids = uniqueBy(
                (Array.isArray(labelIdList) && labelIdList.length ? labelIdList : CROWD_RECOMMEND_SEED_LABEL_IDS)
                    .map(item => String(item || '').trim())
                    .filter(Boolean),
                item => item
            );
            return ids.map(labelId => ({
                labelId,
                showTagList: [],
                popContent: '',
                businessType: 'seed'
            }));
        };

        const crowdRecommendListToCrowdList = (list = []) => {
            const normalized = [];
            (Array.isArray(list) ? list : []).forEach(rawItem => {
                if (!isPlainObject(rawItem)) return;
                const item = deepClone(rawItem);
                if (!isPlainObject(item.crowd)) return;
                if (!isPlainObject(item.crowd.label)) item.crowd.label = {};
                const label = item.crowd.label;
                if (!item.crowd.crowdName) {
                    item.crowd.crowdName = buildCrowdName(label) || String(label.labelName || '').trim();
                }
                const labelMxId = getCrowdMxId(label);
                const fallbackMxId = normalizeSceneSettingValue(item?.crowd?.crowdId || item?.crowdId || '');
                item.mx_crowdId = normalizeSceneSettingValue(item.mx_crowdId || labelMxId || fallbackMxId || '');
                if (!item.mx_crowdId) return;
                if (!isPlainObject(item.price)) {
                    const optionPrice = label?.optionList?.[0]?.price;
                    const labelPrice = label?.price;
                    if (isPlainObject(optionPrice)) item.price = deepClone(optionPrice);
                    else if (isPlainObject(labelPrice)) item.price = deepClone(labelPrice);
                    else item.price = { price: 30 };
                }
                const reasonTags = uniqueBy(
                    []
                        .concat(
                            (Array.isArray(item.reasonTagList) ? item.reasonTagList : [])
                                .map(reason => String(reason?.name || reason || '').trim())
                                .filter(Boolean),
                            (Array.isArray(item.suggestTagList) ? item.suggestTagList : [])
                                .map(reason => String(reason?.name || reason || '').trim())
                                .filter(Boolean),
                            [
                                item?.crowd?.label?.optionList?.[0]?.properties?.recommendRedirectTag,
                                item?.crowd?.label?.optionList?.[0]?.properties?.recommendRedirectReason,
                                item?.fitBidPriceTips
                            ]
                                .map(reason => String(reason || '').trim())
                                .filter(Boolean)
                        ),
                    reason => reason
                );
                if (!Array.isArray(item.reasonTagList) || !item.reasonTagList.length) {
                    item.reasonTagList = reasonTags.map(name => ({ name }));
                }
                if (!Array.isArray(item.showTagList)) {
                    item.showTagList = Array.isArray(item?.crowd?.label?.showTagList)
                        ? deepClone(item.crowd.label.showTagList)
                        : [];
                }
                normalized.push(item);
            });
            return uniqueBy(
                normalized,
                item => item?.mx_crowdId || `${item?.crowd?.label?.labelId || ''}_${item?.crowd?.label?.optionList?.[0]?.optionValue || ''}`
            );
        };

        const NATIVE_CROWD_CACHE_TTL_MS = 8 * 1000;
        const getCrowdUniqueKey = (item = {}, fallback = '') => {
            const label = isPlainObject(item?.crowd?.label) ? item.crowd.label : {};
            const labelMxId = (label?.labelId || label?.targetType) ? getCrowdMxId(label) : '';
            return normalizeSceneSettingValue(
                item?.mx_crowdId
                || labelMxId
                || `${label?.labelId || ''}_${label?.optionList?.[0]?.optionValue || ''}`
                || fallback
            );
        };
        const buildNativeCrowdLabelFromFlatItem = (rawItem = {}, index = 0) => {
            if (!isPlainObject(rawItem)) return null;
            if (isPlainObject(rawItem?.crowd?.label)) return deepClone(rawItem.crowd.label);
            if (isPlainObject(rawItem?.label)) return deepClone(rawItem.label);
            const labelId = normalizeSceneSettingValue(
                rawItem?.labelId
                || rawItem?.id
                || rawItem?.crowdId
                || rawItem?.mx_crowdId
                || ''
            );
            const labelName = normalizeSceneSettingValue(
                rawItem?.labelName
                || rawItem?.name
                || rawItem?.crowdName
                || rawItem?.title
                || ''
            );
            const targetType = normalizeSceneSettingValue(rawItem?.targetType || rawItem?.bizType || '') || 'DMP';
            const optionSource = Array.isArray(rawItem?.optionList) ? rawItem.optionList : [];
            const optionList = uniqueBy(
                optionSource
                    .map((option, idx) => {
                        if (!isPlainObject(option)) return null;
                        const optionValue = normalizeSceneSettingValue(option?.optionValue || option?.value || '');
                        const optionName = normalizeSceneSettingValue(option?.optionName || option?.name || '');
                        if (!optionValue && !optionName) return null;
                        return {
                            optionValue: optionValue || optionName || `option_${idx + 1}`,
                            optionName: optionName || optionValue || `选项${idx + 1}`,
                            price: isPlainObject(option?.price) ? deepClone(option.price) : {}
                        };
                    })
                    .filter(item => item && (item.optionValue || item.optionName)),
                item => `${item.optionValue || ''}_${item.optionName || ''}`
            );
            if (!optionList.length) {
                const optionValue = normalizeSceneSettingValue(
                    rawItem?.optionValue
                    || rawItem?.value
                    || rawItem?.properties?.optionValue
                    || ''
                );
                const optionName = normalizeSceneSettingValue(
                    rawItem?.optionName
                    || rawItem?.optionLabel
                    || rawItem?.properties?.optionName
                    || ''
                );
                if (optionValue || optionName) {
                    optionList.push({
                        optionValue: optionValue || optionName || 'option_1',
                        optionName: optionName || optionValue || '默认选项',
                        price: isPlainObject(rawItem?.price) ? deepClone(rawItem.price) : {}
                    });
                }
            }
            if (!labelId && !labelName && !optionList.length) return null;
            const fallbackId = labelId || `native_label_${Math.max(1, index + 1)}`;
            return {
                targetType,
                labelId: fallbackId,
                labelName: labelName || optionList[0]?.optionName || `人群${index + 1}`,
                priceDimension: optionList.length ? 'OPTION' : 'LABEL',
                priceMode: String(rawItem?.priceMode || (optionList.length ? '0' : '1')),
                isMulti: optionList.length > 1 || !!rawItem?.isMulti,
                optionList,
                showTagList: Array.isArray(rawItem?.showTagList) ? deepClone(rawItem.showTagList) : [],
                price: isPlainObject(rawItem?.price) ? deepClone(rawItem.price) : {}
            };
        };
        const normalizeNativeCrowdListForWizard = (inputList = []) => {
            const sourceList = Array.isArray(inputList) ? inputList : [];
            if (!sourceList.length) return [];
            const fromCrowdShape = crowdRecommendListToCrowdList(sourceList);
            const labelSeedList = sourceList
                .map((item, idx) => buildNativeCrowdLabelFromFlatItem(item, idx))
                .filter(item => isPlainObject(item));
            const fromLabelShape = labelListToCrowdList(labelSeedList);
            const merged = uniqueBy(
                fromCrowdShape.concat(fromLabelShape).map((item, idx) => {
                    const cloned = deepClone(item || {});
                    if (!isPlainObject(cloned?.crowd)) cloned.crowd = {};
                    if (!isPlainObject(cloned?.crowd?.label)) cloned.crowd.label = {};
                    if (!cloned.crowd.crowdName) {
                        cloned.crowd.crowdName = buildCrowdName(cloned.crowd.label)
                            || String(cloned.crowd.label?.labelName || '').trim();
                    }
                    const key = getCrowdUniqueKey(cloned, `native_crowd_${idx + 1}`);
                    if (!key) return null;
                    cloned.mx_crowdId = key;
                    if (!isPlainObject(cloned.price)) {
                        const optionPrice = cloned?.crowd?.label?.optionList?.[0]?.price;
                        const labelPrice = cloned?.crowd?.label?.price;
                        if (isPlainObject(optionPrice)) cloned.price = deepClone(optionPrice);
                        else if (isPlainObject(labelPrice)) cloned.price = deepClone(labelPrice);
                        else cloned.price = { price: 30 };
                    }
                    if (!Array.isArray(cloned.showTagList)) {
                        cloned.showTagList = Array.isArray(cloned?.crowd?.label?.showTagList)
                            ? deepClone(cloned.crowd.label.showTagList)
                            : [];
                    }
                    return cloned;
                }).filter(Boolean),
                item => getCrowdUniqueKey(item, '')
            );
            return merged.slice(0, 100);
        };
        const extractNativeCrowdListFromStateData = (stateData = {}) => {
            if (!isPlainObject(stateData)) return [];
            const listCandidates = [
                stateData?.allCrowdList,
                stateData?.selectedCrowdList,
                stateData?.selected?.allCrowdList,
                stateData?.selected?.crowdList,
                stateData?.selected?.rightList,
                stateData?.rightList,
                stateData?.crowdList,
                stateData?.campaign?.crowdList,
                stateData?.adgroup?.rightList,
                stateData?.storeData?.crowdList
            ];
            let best = [];
            let bestScore = -1;
            listCandidates.forEach(candidate => {
                if (!Array.isArray(candidate) || !candidate.length) return;
                const normalized = normalizeNativeCrowdListForWizard(candidate);
                if (!normalized.length) return;
                let score = normalized.length * 3;
                if (candidate === stateData?.allCrowdList) score += 120;
                if (candidate === stateData?.selected?.allCrowdList) score += 110;
                if (candidate === stateData?.selected?.rightList) score += 90;
                if (candidate === stateData?.rightList) score += 70;
                if (score > bestScore) {
                    best = normalized;
                    bestScore = score;
                }
            });
            return best;
        };
        const scoreNativeCrowdListForWizard = (list = []) => {
            const normalized = Array.isArray(list) ? list : [];
            if (!normalized.length) return -1;
            let score = Math.min(360, normalized.length * 4);
            if (normalized.some(item => isPlainObject(item?.price) && item?.price?.price !== undefined)) score += 24;
            if (normalized.some(item => Array.isArray(item?.crowd?.label?.optionList) && item.crowd.label.optionList.length)) score += 18;
            if (normalized.some(item => String(item?.crowd?.label?.labelName || '').trim())) score += 12;
            return score;
        };
        const resolveNativeCrowdListFromVframes = async (options = {}) => {
            const expectedBizCode = normalizeSceneBizCode(
                options?.expectedBizCode
                || parseRouteParamFromHash('bizCode')
                || ''
            );
            const now = Date.now();
            const hasFreshCache = Array.isArray(runtimeCache.nativeCrowdList)
                && runtimeCache.nativeCrowdList.length
                && (now - toNumber(runtimeCache.nativeCrowdTs, 0)) < NATIVE_CROWD_CACHE_TTL_MS;
            if (options?.force !== true && hasFreshCache) {
                const cacheBizCode = normalizeSceneBizCode(runtimeCache.nativeCrowdBizCode || '');
                if (!expectedBizCode || !cacheBizCode || cacheBizCode === expectedBizCode) {
                    return deepClone(runtimeCache.nativeCrowdList);
                }
            }
            const allVframes = await getAllVframes();
            const vframeIds = Object.keys(allVframes || {});
            if (!vframeIds.length) return [];
            const rankedIds = [
                ...vframeIds.filter(id => /crowd/i.test(id)),
                ...vframeIds.filter(id => id.includes('main_content')),
                ...vframeIds.filter(id => !/crowd/i.test(id) && !id.includes('main_content'))
            ];
            let bestList = [];
            let bestScore = -1;
            rankedIds.forEach(id => {
                const vf = allVframes[id];
                const pathText = normalizeSceneSettingValue(
                    vf?.$v?.path
                    || vf?.view?.path
                    || vf?.view?.$os?.path
                    || ''
                );
                const updaterCandidates = [
                    vf?.$v?.updater?.$d,
                    vf?.view?.updater?.$d,
                    vf?.view?.$os?.updater?.$d,
                    vf?.$v?.$d
                ];
                updaterCandidates.forEach((stateData) => {
                    const crowdList = extractNativeCrowdListFromStateData(stateData);
                    if (!crowdList.length) return;
                    let score = scoreNativeCrowdListForWizard(crowdList);
                    if (/onebp\/views\/pages\/main\/crowd\/index/i.test(pathText)) score += 180;
                    else if (/\/crowd\//i.test(pathText)) score += 120;
                    if (/crowd/i.test(id)) score += 28;
                    const stateBizCode = normalizeSceneBizCode(
                        stateData?.bizCode
                        || stateData?.selected?.bizCode
                        || stateData?.storeData?.bizCode
                        || ''
                    );
                    if (expectedBizCode && stateBizCode) {
                        if (stateBizCode === expectedBizCode) score += 80;
                        else score -= 80;
                    }
                    if (score > bestScore) {
                        bestList = crowdList;
                        bestScore = score;
                    }
                });
            });
            if (bestList.length) {
                runtimeCache.nativeCrowdList = deepClone(bestList);
                runtimeCache.nativeCrowdTs = now;
                runtimeCache.nativeCrowdBizCode = expectedBizCode;
            }
            return deepClone(bestList);
        };

        const CROWD_CUSTOM_BID_TARGET_ORDER = ['display_pay', 'display_cart', 'display_click'];
        const CROWD_CUSTOM_BID_TARGET_LABEL_MAP = {
            display_pay: '获取成交量',
            display_cart: '收藏加购量',
            display_click: '增加点击量'
        };
        const CROWD_CUSTOM_SMART_BID_TARGET_ORDER = [
            'display_roi',
            'display_pay',
            'display_cart',
            'display_click',
            'display_shentou'
        ];
        const CROWD_CUSTOM_SMART_BID_TARGET_LABEL_MAP = {
            display_roi: '稳定投产比',
            display_pay: '获取成交量（最大化拿量）',
            display_cart: '收藏加购量（最大化拿量）',
            display_click: '增加点击量（最大化拿量）',
            display_shentou: '拉新渗透（竞店重合人群）'
        };
        const CROWD_NATIVE_RUNTIME_CACHE_TTL_MS = 8 * 1000;

        const normalizeCrowdCustomBidTargetOptionCandidate = (option = {}, fallbackIndex = 0) => {
            const source = isPlainObject(option) ? option : { value: option };
            const codeCandidate = normalizeSceneSettingValue(
                source.code
                || source.value
                || source.key
                || source.bizCode
                || source.optionValue
                || source.targetCode
                || source.targetValue
                || source.id
                || source.name
                || source.label
                || source.text
                || ''
            );
            const code = normalizeCrowdCustomBidTargetCode(codeCandidate, {
                strict: true,
                fallback: ''
            });
            if (!code) return null;
            const rawLabel = normalizeSceneSettingValue(
                source.name
                || source.label
                || source.text
                || source.title
                || source.optionName
                || source.description
                || source.desc
                || ''
            );
            const label = rawLabel && !/^(display_|conv|click|fav_cart|ad_strategy_)/i.test(rawLabel)
                ? rawLabel
                : (CROWD_CUSTOM_BID_TARGET_LABEL_MAP[code] || crowdCustomBidTargetCodeToLabel(code));
            const order = CROWD_CUSTOM_BID_TARGET_ORDER.indexOf(code);
            return {
                code,
                label,
                order: order < 0 ? fallbackIndex + CROWD_CUSTOM_BID_TARGET_ORDER.length : order
            };
        };

        const extractNativeCrowdCustomBidTargetOptionsFromStateData = (stateData = {}) => {
            if (!isPlainObject(stateData)) return [];
            const optionMap = new Map();
            const scoreMap = new Map();
            const appendCandidate = (candidate = [], weight = 0) => {
                if (!Array.isArray(candidate) || !candidate.length) return;
                candidate.forEach((item, index) => {
                    const normalized = normalizeCrowdCustomBidTargetOptionCandidate(item, index);
                    if (!normalized) return;
                    const currentScore = toNumber(scoreMap.get(normalized.code), -1);
                    const nextScore = Math.max(0, weight) + Math.max(0, 30 - normalized.order);
                    if (nextScore >= currentScore) {
                        optionMap.set(normalized.code, {
                            code: normalized.code,
                            label: normalized.label
                        });
                        scoreMap.set(normalized.code, nextScore);
                    }
                });
            };
            const topLevelCandidates = [
                stateData?.bidTargetV2List,
                stateData?.optimizeTargetList,
                stateData?.targetList,
                stateData?.targetOptionList,
                stateData?.data?.bidTargetV2List,
                stateData?.data?.optimizeTargetList,
                stateData?.data?.targetList,
                stateData?.data?.targetOptionList
            ];
            topLevelCandidates.forEach(candidate => appendCandidate(candidate, 30));

            const subComponentCandidates = [
                stateData?.adcConfig?.subComponentList,
                stateData?.data?.adcConfig?.subComponentList,
                stateData?.selected?.adcConfig?.subComponentList,
                stateData?.storeData?.adcConfig?.subComponentList
            ];
            subComponentCandidates.forEach((subList) => {
                if (!Array.isArray(subList) || !subList.length) return;
                subList.forEach((component) => {
                    if (!isPlainObject(component)) return;
                    const hintText = normalizeText([
                        component.code,
                        component.key,
                        component.name,
                        component.label,
                        component.fieldKey,
                        component.title
                    ].filter(Boolean).join(' ')).toLowerCase();
                    const isBidTargetComponent = /(bidtarget|optimizetarget|target|出价目标|优化目标)/i.test(hintText);
                    const optionLists = [
                        component.optionList,
                        component.options,
                        component.selectList,
                        component.dataSource,
                        component.optionData,
                        component.itemList,
                        component.list,
                        component.children,
                        component?.data?.optionList,
                        component?.data?.options,
                        component?.data?.selectList
                    ];
                    optionLists.forEach(optionList => {
                        appendCandidate(optionList, isBidTargetComponent ? 80 : 20);
                    });
                });
            });

            const merged = Array.from(optionMap.values()).sort((a, b) => {
                const orderA = CROWD_CUSTOM_BID_TARGET_ORDER.indexOf(a.code);
                const orderB = CROWD_CUSTOM_BID_TARGET_ORDER.indexOf(b.code);
                const safeA = orderA < 0 ? 99 : orderA;
                const safeB = orderB < 0 ? 99 : orderB;
                return safeA - safeB;
            });
            return merged.slice(0, 3);
        };

        const scoreNativeCrowdCustomBidTargetOptions = (options = []) => {
            const list = Array.isArray(options) ? options : [];
            if (!list.length) return -1;
            let score = list.length * 40;
            if (list.some(item => item?.code === 'display_pay')) score += 20;
            if (list.some(item => item?.code === 'display_cart')) score += 16;
            if (list.some(item => item?.code === 'display_click')) score += 16;
            return score;
        };

        const resolveNativeCrowdCustomBidTargetOptionsFromVframes = async (options = {}) => {
            const expectedBizCode = normalizeSceneBizCode(
                options?.expectedBizCode
                || parseRouteParamFromHash('bizCode')
                || ''
            );
            const now = Date.now();
            const hasFreshCache = Array.isArray(runtimeCache.nativeCrowdCustomBidTargetOptions)
                && runtimeCache.nativeCrowdCustomBidTargetOptions.length
                && (now - toNumber(runtimeCache.nativeCrowdCustomBidTargetTs, 0)) < CROWD_NATIVE_RUNTIME_CACHE_TTL_MS;
            if (options?.force !== true && hasFreshCache) {
                const cacheBizCode = normalizeSceneBizCode(runtimeCache.nativeCrowdCustomBidTargetBizCode || '');
                if (!expectedBizCode || !cacheBizCode || cacheBizCode === expectedBizCode) {
                    return deepClone(runtimeCache.nativeCrowdCustomBidTargetOptions);
                }
            }

            const allVframes = await getAllVframes();
            const vframeIds = Object.keys(allVframes || {});
            if (!vframeIds.length) return [];
            let bestOptions = [];
            let bestScore = -1;
            const rankedIds = [
                ...vframeIds.filter(id => /display|crowd|main_content/i.test(id)),
                ...vframeIds.filter(id => !/display|crowd|main_content/i.test(id))
            ];
            rankedIds.forEach((id) => {
                const vf = allVframes[id];
                const pathText = normalizeSceneSettingValue(
                    vf?.$v?.path
                    || vf?.view?.path
                    || vf?.view?.$os?.path
                    || ''
                );
                const updaterCandidates = [
                    vf?.$v?.updater?.$d,
                    vf?.view?.updater?.$d,
                    vf?.view?.$os?.updater?.$d,
                    vf?.$v?.$d
                ];
                updaterCandidates.forEach((stateData) => {
                    const optionList = extractNativeCrowdCustomBidTargetOptionsFromStateData(stateData);
                    if (!optionList.length) return;
                    let score = scoreNativeCrowdCustomBidTargetOptions(optionList);
                    if (/onebp\/views\/pages\/main\/crowd\/index/i.test(pathText)) score += 120;
                    else if (/display|crowd/i.test(pathText)) score += 80;
                    if (/display|crowd/i.test(id)) score += 24;
                    const stateBizCode = normalizeSceneBizCode(
                        stateData?.bizCode
                        || stateData?.selected?.bizCode
                        || stateData?.storeData?.bizCode
                        || stateData?.data?.bizCode
                        || ''
                    );
                    if (expectedBizCode && stateBizCode) {
                        if (stateBizCode === expectedBizCode) score += 60;
                        else score -= 60;
                    }
                    if (score > bestScore) {
                        bestOptions = optionList;
                        bestScore = score;
                    }
                });
            });
            if (bestOptions.length) {
                runtimeCache.nativeCrowdCustomBidTargetOptions = deepClone(bestOptions);
                runtimeCache.nativeCrowdCustomBidTargetTs = now;
                runtimeCache.nativeCrowdCustomBidTargetBizCode = expectedBizCode;
            }
            return deepClone(bestOptions);
        };

        const normalizeNativeAdzoneListFromStateData = (list = []) => {
            if (!Array.isArray(list)) return [];
            return uniqueBy(
                list
                    .filter(item => isPlainObject(item))
                    .map((item, idx) => {
                        const source = deepClone(item);
                        const adzoneCode = normalizeSceneSettingValue(
                            source.adzoneCode
                            || source.adzoneId
                            || source.code
                            || source.id
                            || source.resourceCode
                            || source.properties?.adzoneId
                            || ''
                        ) || `native_adzone_${idx + 1}`;
                        const adzoneName = normalizeSceneSettingValue(
                            source.adzoneName
                            || source.name
                            || source.title
                            || source.properties?.adzoneName
                            || ''
                        ) || `资源位${idx + 1}`;
                        const statusRaw = source.status ?? source.enabled ?? source.state ?? source.switch;
                        const status = /^(0|false|off|关闭|否)$/i.test(String(statusRaw ?? '1').trim()) ? '0' : '1';
                        const normalized = {
                            ...source,
                            adzoneCode,
                            adzoneId: normalizeSceneSettingValue(source.adzoneId || source.id || source.properties?.adzoneId || adzoneCode),
                            adzoneName,
                            resourceName: normalizeSceneSettingValue(
                                source.resourceName
                                || source.description
                                || source.desc
                                || source.subTitle
                                || source.resourceDesc
                                || source.properties?.desc
                                || ''
                            ),
                            status
                        };
                        if (!hasOwn(normalized, 'discount') && source.discount !== undefined) {
                            normalized.discount = source.discount;
                        }
                        if (!hasOwn(normalized, 'fitDiscount') && source.fitDiscount !== undefined) {
                            normalized.fitDiscount = source.fitDiscount;
                        }
                        if (!hasOwn(normalized, 'suggestDiscount') && source.suggestDiscount !== undefined) {
                            normalized.suggestDiscount = source.suggestDiscount;
                        }
                        if (!hasOwn(normalized, 'parentAdoneId') && source.parentAdoneId !== undefined) {
                            normalized.parentAdoneId = source.parentAdoneId;
                        }
                        return normalized;
                    }),
                item => `${item.adzoneCode || ''}_${item.adzoneId || ''}_${item.adzoneName || ''}`
            ).slice(0, 60);
        };

        const extractNativeAdzoneListFromStateData = (stateData = {}) => {
            if (!isPlainObject(stateData)) return [];
            const candidateLists = [
                stateData?.data?.adzoneList,
                stateData?.adzoneList,
                stateData?.selected?.adzoneList,
                stateData?.data?.selected?.adzoneList
            ];
            let best = [];
            let bestScore = -1;
            candidateLists.forEach((candidate, index) => {
                const normalized = normalizeNativeAdzoneListFromStateData(candidate);
                if (!normalized.length) return;
                let score = normalized.length * 6;
                if (index === 0) score += 40;
                if (index === 1) score += 30;
                if (normalized.some(item => !/^资源位\d+$/.test(item.adzoneName || ''))) score += 20;
                if (score > bestScore) {
                    best = normalized;
                    bestScore = score;
                }
            });
            return best;
        };

        const isDisplayNativeAdzoneItem = (item = {}) => {
            const text = [
                normalizeSceneSettingValue(item?.adzoneName || item?.name || item?.title || ''),
                normalizeSceneSettingValue(item?.resourceName || item?.description || item?.desc || item?.subTitle || '')
            ].join(' ');
            return /(猜你喜欢|信息流|微详情|追投|购中购后)/.test(text);
        };

        const scoreNativeAdzoneList = (list = [], options = {}) => {
            const normalized = Array.isArray(list) ? list : [];
            if (!normalized.length) return -1;
            const expectedBizCode = normalizeSceneBizCode(options?.expectedBizCode || '');
            let score = normalized.length * 6;
            if (normalized.some(item => !/^资源位\d+$/.test(String(item?.adzoneName || '')))) score += 20;
            if (normalized.some(item => String(item?.resourceName || '').trim())) score += 10;
            if (normalized.some(item => Number.isFinite(toNumber(item?.fitDiscount ?? item?.discount, NaN)))) score += 12;
            if (normalized.some(item => normalizeSceneSettingValue(item?.parentAdoneId || item?.properties?.parentAdoneId || ''))) score += 8;
            if (normalized.some(item => /^(DEFAULT_SEARCH|A_TEST_SLOT|B_TEST_SLOT|TEST_|native_adzone_)/i.test(String(item?.adzoneCode || '')))) score -= 36;
            if (expectedBizCode === 'onebpDisplay') {
                const displayCount = normalized.filter(item => isDisplayNativeAdzoneItem(item)).length;
                if (displayCount > 0) {
                    score += Math.min(60, displayCount * 16);
                } else {
                    score -= 120;
                }
                if (normalized.some(item => /淘宝搜索|全链路投/.test(String(item?.adzoneName || '')))) {
                    score -= 50;
                }
            }
            return score;
        };

        const resolveNativeAdzoneListFromVframes = async (options = {}) => {
            const expectedBizCode = normalizeSceneBizCode(
                options?.expectedBizCode
                || parseRouteParamFromHash('bizCode')
                || ''
            );
            const now = Date.now();
            const hasFreshCache = Array.isArray(runtimeCache.nativeAdzoneList)
                && runtimeCache.nativeAdzoneList.length
                && (now - toNumber(runtimeCache.nativeAdzoneTs, 0)) < CROWD_NATIVE_RUNTIME_CACHE_TTL_MS;
            if (options?.force !== true && hasFreshCache) {
                const cacheBizCode = normalizeSceneBizCode(runtimeCache.nativeAdzoneBizCode || '');
                if (!expectedBizCode || !cacheBizCode || cacheBizCode === expectedBizCode) {
                    return deepClone(runtimeCache.nativeAdzoneList);
                }
            }

            const allVframes = await getAllVframes();
            const vframeIds = Object.keys(allVframes || {});
            if (!vframeIds.length) return [];
            let bestList = [];
            let bestScore = -1;
            const rankedIds = [
                ...vframeIds.filter(id => /adzone|display|main_content/i.test(id)),
                ...vframeIds.filter(id => !/adzone|display|main_content/i.test(id))
            ];
            rankedIds.forEach((id) => {
                const vf = allVframes[id];
                const pathText = normalizeSceneSettingValue(
                    vf?.$v?.path
                    || vf?.view?.path
                    || vf?.view?.$os?.path
                    || ''
                );
                const updaterCandidates = [
                    vf?.$v?.updater?.$d,
                    vf?.view?.updater?.$d,
                    vf?.view?.$os?.updater?.$d,
                    vf?.$v?.$d
                ];
                updaterCandidates.forEach((stateData) => {
                    const adzoneList = extractNativeAdzoneListFromStateData(stateData);
                    if (!adzoneList.length) return;
                    let score = scoreNativeAdzoneList(adzoneList, { expectedBizCode });
                    if (/advance-dlg|adzone|display/i.test(pathText)) score += 100;
                    if (/adzone|display/i.test(id)) score += 24;
                    const stateBizCode = normalizeSceneBizCode(
                        stateData?.bizCode
                        || stateData?.selected?.bizCode
                        || stateData?.storeData?.bizCode
                        || stateData?.data?.bizCode
                        || ''
                    );
                    if (expectedBizCode && stateBizCode) {
                        if (stateBizCode === expectedBizCode) score += 60;
                        else score -= 60;
                    }
                    if (score > bestScore) {
                        bestList = adzoneList;
                        bestScore = score;
                    }
                });
            });
            if (bestList.length) {
                runtimeCache.nativeAdzoneList = deepClone(bestList);
                runtimeCache.nativeAdzoneTs = now;
                runtimeCache.nativeAdzoneBizCode = expectedBizCode;
            }
            return deepClone(bestList);
        };

        const fetchRecommendCrowdListByCrowdSuggest = async ({
            bizCode,
            defaults = {},
            materialList = [],
            goalLabel = '',
            labelIdList = [],
            requestOptions
        }) => {
            const targetBizCode = bizCode || defaults?.bizCode || DEFAULTS.bizCode;
            const normalizedMaterialList = normalizeCrowdRecommendMaterialList(materialList);
            if (!normalizedMaterialList.length) return [];
            const sceneCandidates = buildCrowdRecommendSceneCandidates(defaults);
            const strategyCandidates = buildCrowdRecommendStrategyCandidates(defaults, goalLabel);
            const labelList = buildCrowdRecommendLabelList(labelIdList);
            const recSceneList = uniqueBy(
                (Array.isArray(CROWD_RECOMMEND_REC_SCENE_LIST) ? CROWD_RECOMMEND_REC_SCENE_LIST : ['bd_sys'])
                    .map(item => String(item || '').trim())
                    .filter(Boolean),
                item => item
            );
            const materialIdList = normalizedMaterialList.map(item => item.materialId);
            const materialNameList = normalizedMaterialList.map(item => String(item.materialName || '').trim()).filter(Boolean);
            for (const promotionScene of sceneCandidates) {
                for (const promotionStrategy of strategyCandidates) {
                    try {
                        const res = await requestOne(ENDPOINTS.crowdFindRecommend, targetBizCode, {
                            recSceneList,
                            labelList,
                            mx_operation: '',
                            bizCode: targetBizCode,
                            promotionScene,
                            promotionType: defaults?.promotionType || DEFAULTS.promotionType,
                            subPromotionType: defaults?.subPromotionType || DEFAULTS.subPromotionType,
                            promotionStrategy,
                            materialIdList,
                            materialNameList,
                            recQueryTime: '30'
                        }, requestOptions || {});
                        const crowdList = crowdRecommendListToCrowdList(res?.data?.list);
                        if (crowdList.length) return crowdList;
                    } catch (err) {
                        log.warn(
                            `推荐人群接口失败 /crowd/findRecommendCrowd scene=${promotionScene} strategy=${promotionStrategy}:`,
                            err?.message || err
                        );
                    }
                }
            }
            return [];
        };

        const fetchRecommendCrowdList = async ({ bizCode, defaults, labelIdList, materialIdList = [], requestOptions }) => {
            const ids = uniqueBy(
                (Array.isArray(labelIdList) ? labelIdList : DEFAULTS.recommendCrowdLabelIds)
                    .map(id => String(id || '').trim())
                    .filter(Boolean),
                id => id
            );
            if (!ids.length) return [];

            const labelResults = [];
            for (const labelId of ids) {
                try {
                    const res = await requestOne(ENDPOINTS.labelFindList, bizCode, {
                        bizCode,
                        promotionScene: defaults.promotionScene,
                        promotionType: defaults.promotionType || DEFAULTS.promotionType,
                        subPromotionType: defaults.subPromotionType || DEFAULTS.subPromotionType,
                        optimizeTarget: defaults.bidTargetV2 || DEFAULTS.bidTargetV2,
                        labelList: [{ labelId }],
                        materialIdList: (materialIdList || []).map(toIdValue).filter(Boolean)
                    }, requestOptions || {});
                    const list = Array.isArray(res?.data?.list) ? res.data.list : [];
                    if (list.length) labelResults.push(...list);
                } catch (err) {
                    log.warn(`推荐人群接口失败 labelId=${labelId}:`, err?.message || err);
                }
            }
            return labelListToCrowdList(labelResults);
        };

        const applyKeywordDefaults = (word, keywordDefaults = {}) => {
            const fallbackBid = toNumber(keywordDefaults.bidPrice, 1);
            const fallbackMatch = parseMatchScope(keywordDefaults.matchScope, DEFAULTS.matchScope);
            const fallbackStatus = toNumber(keywordDefaults.onlineStatus, DEFAULTS.keywordOnlineStatus);
            return {
                word: String(word.word || word.keyword || '').trim(),
                bidPrice: toNumber(word.bidPrice, fallbackBid),
                matchScope: parseMatchScope(word.matchScope, fallbackMatch),
                onlineStatus: toNumber(word.onlineStatus, fallbackStatus)
            };
        };

        const WORD_PACKAGE_FIELD_RE = /(wordpackage|word_package|词包|krpackage|traffic.*package|package.*word|package)/i;
        const stripWordPackageArtifacts = (value) => {
            if (Array.isArray(value)) {
                return value
                    .map(item => stripWordPackageArtifacts(item))
                    .filter(item => item !== undefined && item !== null);
            }
            if (!isPlainObject(value)) return value;
            const out = {};
            Object.keys(value).forEach(key => {
                if (WORD_PACKAGE_FIELD_RE.test(key)) return;
                const nextValue = stripWordPackageArtifacts(value[key]);
                if (nextValue === undefined) return;
                out[key] = nextValue;
            });
            return out;
        };

        const KEYWORD_TRAFFIC_PACKAGE_FIELD_RE = /(golden|detent|trend|traffic|kr|card|flow|package|词包|卡位|趋势|流量金卡)/i;
        const KEYWORD_NATIVE_CAMPAIGN_CONTRACT_KEYS = new Set([
            'searchDetentType',
            'trendType',
            'trendThemeList',
            'packageId',
            'packageTemplateId',
            'planId',
            'planTemplateId',
            'orderInfo',
            'orderAutoRenewalInfo',
            'orderChargeType',
            'launchTime',
            'aiMaxSwitch',
            'aiMaxInfo'
        ]);
        const stripKeywordTrafficArtifacts = (value) => {
            if (Array.isArray(value)) {
                return value
                    .map(item => stripKeywordTrafficArtifacts(item))
                    .filter(item => item !== undefined && item !== null);
            }
            if (!isPlainObject(value)) return value;
            const out = {};
            Object.keys(value).forEach(key => {
                const lower = key.toLowerCase();
                if (key !== 'promotionScene'
                    && key !== 'subPromotionType'
                    && key !== 'promotionType'
                    && key !== 'itemSelectedMode'
                    && key !== 'campaignName'
                    && !KEYWORD_NATIVE_CAMPAIGN_CONTRACT_KEYS.has(key)
                    && KEYWORD_TRAFFIC_PACKAGE_FIELD_RE.test(lower)) {
                    return;
                }
                const nextValue = stripKeywordTrafficArtifacts(value[key]);
                if (nextValue === undefined) return;
                out[key] = nextValue;
            });
            return out;
        };

        const KEYWORD_CUSTOM_CAMPAIGN_ALLOW_KEYS = new Set([
            'operation',
            'bizCode',
            'promotionScene',
            'subPromotionType',
            'promotionType',
            'itemSelectedMode',
            'bidType',
            'bidTypeV2',
            'bidTargetV2',
            'campaignCycleBudgetInfo',
            'itemIdList',
            'deleteAdgroupList',
            'updatedRightInfoAdgroupList',
            'setSingleCostV2',
            'singleCostV2',
            'optimizeTarget',
            'constraintType',
            'constraintValue',
            'subOptimizeTarget',
            'dmcType',
            'campaignName',
            'campaignGroupId',
            'campaignGroupName',
            'supportCouponId',
            'creativeSetMode',
            'smartCreative',
            'campaignColdStartVO',
            'needTargetCrowd',
            'aiXiaowanCrowdListSwitch',
            'crowdList',
            'adzoneList',
            'launchAreaStrList',
            'launchPeriodList',
            'dayBudget',
            'dayAverageBudget',
            'totalBudget',
            'futureBudget',
            'searchDetentType',
            'trendType',
            'trendThemeList',
            'packageId',
            'packageTemplateId',
            'planId',
            'planTemplateId',
            'orderInfo',
            'orderAutoRenewalInfo',
            'orderChargeType',
            'launchTime',
            'aiMaxSwitch',
            'aiMaxInfo',
            // NOTE: 对齐原生「优质计划防停投」，避免被白名单裁剪
            'enableRuleAuto',
            'ruleCommand'
        ]);
        // 关键词创建口偶发新增 MCB 相关字段，按关键字兜底透传，避免被白名单裁剪导致服务端参数缺失。
        const KEYWORD_CUSTOM_CAMPAIGN_EXTRA_KEY_RE = /(mcb|bidmodel)/i;
        const KEYWORD_WORD_PACKAGE_ERROR_RE = /流量智选词包校验失败/;

        const normalizeBidMode = (value, fallback = 'smart') => {
            const raw = String(value || '').trim().toLowerCase();
            if (raw === 'smart' || raw === 'smart_bid') return 'smart';
            if (raw === 'manual' || raw === 'custom' || raw === 'custom_bid' || raw === 'manual_bid') return 'manual';
            if (fallback === '') return '';
            return fallback === 'manual' ? 'manual' : 'smart';
        };

        const resolveKeywordCampaignContractType = ({ campaign = {}, goalText = '' } = {}) => {
            const goal = normalizeGoalLabel(goalText);
            const scene = String(campaign?.promotionScene || '').trim();
            const itemMode = String(campaign?.itemSelectedMode || '').trim();
            if (scene === 'promotion_scene_search_detent' || itemMode === 'search_detent' || goal === '搜索卡位') return 'search_detent';
            if (scene === 'promotion_scene_search_trend' || itemMode === 'trend' || goal === '趋势明星') return 'trend';
            if (scene === 'promotion_scene_golden_traffic_card_package' || goal === '流量金卡') return 'golden_traffic_card';
            if (scene === 'promotion_scene_search_user_define' || itemMode === 'user_define' || goal === '自定义推广') return 'user_define';
            return '';
        };

        const mapKeywordSearchDetentTypeValue = (text = '') => {
            const value = normalizeSceneSettingValue(text);
            if (!value) return '';
            const token = String(value).trim().toLowerCase();
            if (/^(first_place|third_place|home_page|permeability)$/i.test(token)) return token;
            if (/位置不限|市场渗透|渗透|permeability/i.test(value)) return 'permeability';
            if (/前三|top\s*3|third/i.test(value)) return 'third_place';
            if (/首页|home/i.test(value)) return 'home_page';
            if (/首条|第一|first|top\s*1/i.test(value)) return 'first_place';
            return '';
        };

        const normalizeFallbackPolicy = (value, fallback = 'confirm') => {
            const raw = String(value || '').trim().toLowerCase();
            if (raw === 'auto' || raw === 'none' || raw === 'confirm') return raw;
            return fallback === 'auto' || fallback === 'none' ? fallback : 'confirm';
        };
        const normalizeWizardFallbackPolicy = (value) => {
            const preferred = WIZARD_FORCE_API_ONLY_SCENE_CONFIG ? 'auto' : 'confirm';
            const normalized = normalizeFallbackPolicy(value || preferred, preferred);
            if (WIZARD_FORCE_API_ONLY_SCENE_CONFIG && normalized === 'confirm') return 'auto';
            return normalized;
        };
        const normalizeSubmitMode = (value = '') => {
            const raw = String(value || '').trim().toLowerCase();
            if (raw === 'serial' || raw === 'single' || raw === '单条') return 'serial';
            return 'parallel';
        };
        const normalizeParallelSubmitTimes = (value, fallback = DEFAULT_SCENE_PARALLEL_SUBMIT_TIMES) => {
            const base = Math.max(1, toNumber(fallback, DEFAULT_SCENE_PARALLEL_SUBMIT_TIMES));
            return Math.min(99, Math.max(1, toNumber(value, base)));
        };
        const submitModeLabel = (value = '') => (
            normalizeSubmitMode(value) === 'serial' ? '单条' : '并发'
        );

        const bidModeToBidType = (bidMode = 'smart') => normalizeBidMode(bidMode) === 'manual' ? 'custom_bid' : 'smart_bid';

        const isWordPackageValidationError = (errorText = '') => KEYWORD_WORD_PACKAGE_ERROR_RE.test(String(errorText || ''));

        const resolvePlanBidMode = ({ plan = {}, request = {}, runtime = {}, campaign = {} } = {}) => {
            const keywordGoal = normalizeGoalLabel(
                plan?.marketingGoal
                || plan?.__goalResolution?.resolvedMarketingGoal
                || request?.marketingGoal
                || request?.common?.marketingGoal
                || request?.__goalResolution?.resolvedMarketingGoal
                || ''
            );
            const keywordSceneHint = String(
                plan?.campaignOverride?.promotionScene
                || plan?.goalForcedCampaignOverride?.promotionScene
                || request?.sceneForcedCampaignOverride?.promotionScene
                || request?.goalForcedCampaignOverride?.promotionScene
                || request?.common?.campaignOverride?.promotionScene
                || request?.promotionScene
                || campaign?.promotionScene
                || runtime?.promotionScene
                || ''
            ).trim();
            const keywordItemModeHint = String(
                plan?.campaignOverride?.itemSelectedMode
                || plan?.goalForcedCampaignOverride?.itemSelectedMode
                || request?.sceneForcedCampaignOverride?.itemSelectedMode
                || request?.goalForcedCampaignOverride?.itemSelectedMode
                || request?.common?.campaignOverride?.itemSelectedMode
                || request?.itemSelectedMode
                || campaign?.itemSelectedMode
                || runtime?.itemSelectedMode
                || ''
            ).trim();
            const fromPlan = normalizeBidMode(plan?.bidMode || '', '');
            if (fromPlan) return fromPlan;
            const fromPlanCampaign = normalizeBidMode(plan?.campaignOverride?.bidTypeV2 || '', '');
            if (fromPlanCampaign) return fromPlanCampaign;
            const fromPlanGoalCampaign = normalizeBidMode(plan?.goalForcedCampaignOverride?.bidTypeV2 || '', '');
            if (fromPlanGoalCampaign) return fromPlanGoalCampaign;
            const fromCampaign = normalizeBidMode(campaign?.bidTypeV2 || '', '');
            if (fromCampaign) return fromCampaign;
            const fromCommon = normalizeBidMode(request?.common?.bidMode || '', '');
            if (fromCommon) return fromCommon;
            const fromRequest = normalizeBidMode(request?.bidMode || '', '');
            if (fromRequest) return fromRequest;
            const fromCommonCampaign = normalizeBidMode(request?.common?.campaignOverride?.bidTypeV2 || '', '');
            if (fromCommonCampaign) return fromCommonCampaign;
            const fromSceneForcedCampaign = normalizeBidMode(request?.sceneForcedCampaignOverride?.bidTypeV2 || '', '');
            if (fromSceneForcedCampaign) return fromSceneForcedCampaign;
            const fromGoalForcedCampaign = normalizeBidMode(request?.goalForcedCampaignOverride?.bidTypeV2 || '', '');
            if (fromGoalForcedCampaign) return fromGoalForcedCampaign;
            const fromRequestCampaign = normalizeBidMode(request?.bidTypeV2 || '', '');
            if (fromRequestCampaign) return fromRequestCampaign;
            const hintedBidType = normalizeBidMode(
                keywordGoal === '自定义推广'
                    ? 'custom_bid'
                    : (
                        keywordSceneHint === 'promotion_scene_search_user_define'
                            || keywordItemModeHint === 'user_define'
                            ? 'custom_bid'
                            : ''
                    ),
                ''
            );
            if (hintedBidType) return hintedBidType;
            return normalizeBidMode(runtime?.bidTypeV2 || DEFAULTS.bidTypeV2, 'smart');
        };

        const normalizeKeywordWordListForSubmit = (wordList = []) => {
            if (!Array.isArray(wordList)) return [];
            return uniqueBy(
                wordList
                    .map(item => applyKeywordDefaults(item || {}, {}))
                    .filter(item => item.word)
                    .map(item => ({
                        word: item.word,
                        bidPrice: item.bidPrice,
                        matchScope: item.matchScope,
                        onlineStatus: item.onlineStatus
                    })),
                item => item.word
            ).slice(0, 200);
        };

        const pruneKeywordCampaignForCustomScene = (campaign = {}, options = {}) => {
            const request = options?.request || {};
            const plan = isPlainObject(options?.plan) ? options.plan : {};
            const input = isPlainObject(campaign) ? campaign : {};
            const goalRuntime = isPlainObject(options?.goalRuntime) ? options.goalRuntime : {};
            const runtimeDefaults = isPlainObject(options?.runtimeDefaults) ? options.runtimeDefaults : {};
            const templateCampaign = isPlainObject(options?.templateCampaign) ? options.templateCampaign : {};
            const runtimeStoreData = isPlainObject(runtimeDefaults?.storeData) ? runtimeDefaults.storeData : {};
            const keywordMarketingGoal = normalizeGoalLabel(
                plan?.marketingGoal
                || plan?.__goalResolution?.resolvedMarketingGoal
                || request?.marketingGoal
                || request?.common?.marketingGoal
                || ''
            );
            const bidMode = normalizeBidMode(
                options?.bidMode
                || request?.common?.bidMode
                || request?.bidMode
                || input?.bidTypeV2
                || request?.common?.campaignOverride?.bidTypeV2
                || request?.bidTypeV2
                || DEFAULTS.bidTypeV2,
                'smart'
            );
            const isManual = bidMode === 'manual';
            let keywordRoiContract = false;
            const out = {};
            Object.keys(input).forEach(key => {
                if (!KEYWORD_CUSTOM_CAMPAIGN_ALLOW_KEYS.has(key) && !KEYWORD_CUSTOM_CAMPAIGN_EXTRA_KEY_RE.test(key)) return;
                out[key] = deepClone(input[key]);
            });
            const resolveCampaignField = (field = '', fallback = '') => {
                const candidates = [
                    input?.[field],
                    goalRuntime?.[field],
                    request?.sceneForcedCampaignOverride?.[field],
                    request?.goalForcedCampaignOverride?.[field],
                    request?.common?.campaignOverride?.[field],
                    request?.[field],
                    request?.common?.[field],
                    fallback
                ];
                for (let i = 0; i < candidates.length; i++) {
                    const value = candidates[i];
                    if (value === undefined || value === null || value === '') continue;
                    return deepClone(value);
                }
                return '';
            };
            const resolveNonEmptyArrayField = (field = '', fallback = []) => {
                const candidates = [
                    input?.[field],
                    goalRuntime?.[field],
                    request?.sceneForcedCampaignOverride?.[field],
                    request?.goalForcedCampaignOverride?.[field],
                    request?.common?.campaignOverride?.[field],
                    request?.[field],
                    request?.common?.[field],
                    templateCampaign?.[field],
                    runtimeStoreData?.[field],
                    runtimeDefaults?.[field],
                    fallback
                ];
                for (let i = 0; i < candidates.length; i++) {
                    const value = candidates[i];
                    if (Array.isArray(value)) {
                        if (!value.length) continue;
                        return deepClone(value);
                    }
                    if (typeof value === 'string') {
                        const text = String(value || '').trim();
                        if (!text) continue;
                        if ((text.startsWith('[') && text.endsWith(']')) || (text.startsWith('{') && text.endsWith('}'))) {
                            try {
                                const parsed = JSON.parse(text);
                                if (Array.isArray(parsed) && parsed.length) return deepClone(parsed);
                            } catch { }
                        }
                    }
                }
                return Array.isArray(fallback) ? deepClone(fallback) : [];
            };
            const resolveKeywordMcbBidModel = (fallback = '') => {
                const sourceList = [
                    out,
                    input,
                    goalRuntime,
                    request?.sceneForcedCampaignOverride,
                    request?.goalForcedCampaignOverride,
                    request?.common?.campaignOverride,
                    request?.campaignOverride,
                    request?.common,
                    request,
                    templateCampaign,
                    runtimeStoreData,
                    runtimeDefaults
                ];
                const knownKeyList = [
                    'mcbBidModel',
                    'mcb_bid_model',
                    'mcbModel',
                    'campaignMcbBidModel',
                    'planMcbBidModel',
                    'bidModel',
                    'bid_model'
                ];
                const normalizeValue = (value) => {
                    if (value === undefined || value === null || value === '') return '';
                    const text = String(value).trim();
                    return text || '';
                };
                for (let i = 0; i < sourceList.length; i++) {
                    const source = sourceList[i];
                    if (!isPlainObject(source)) continue;
                    for (let j = 0; j < knownKeyList.length; j++) {
                        const key = knownKeyList[j];
                        const normalized = normalizeValue(source[key]);
                        if (normalized) return normalized;
                    }
                    const keyList = Object.keys(source);
                    for (let j = 0; j < keyList.length; j++) {
                        const key = keyList[j];
                        if (!KEYWORD_CUSTOM_CAMPAIGN_EXTRA_KEY_RE.test(key)) continue;
                        const normalized = normalizeValue(source[key]);
                        if (normalized) return normalized;
                    }
                }
                return normalizeValue(fallback);
            };
            out.bizCode = String(out.bizCode || '').trim() || DEFAULTS.bizCode;
            out.promotionScene = resolveCampaignField('promotionScene', DEFAULTS.promotionScene) || DEFAULTS.promotionScene;
            out.subPromotionType = out.subPromotionType || DEFAULTS.subPromotionType;
            out.promotionType = out.promotionType || DEFAULTS.promotionType;
            out.itemSelectedMode = resolveCampaignField('itemSelectedMode', DEFAULTS.itemSelectedMode) || DEFAULTS.itemSelectedMode;
            out.bidTypeV2 = bidModeToBidType(bidMode);
            const keywordContractType = resolveKeywordCampaignContractType({
                campaign: out,
                goalText: keywordMarketingGoal
            });
            const isSearchDetentContract = keywordContractType === 'search_detent';
            const isTrendContract = keywordContractType === 'trend';
            const isGoldenTrafficCardContract = keywordContractType === 'golden_traffic_card';
            if (isSearchDetentContract) {
                out.promotionScene = 'promotion_scene_search_detent';
                out.itemSelectedMode = 'search_detent';
                out.bidType = 'max_amount';
                delete out.bidTypeV2;
                delete out.bidTargetV2;
                delete out.optimizeTarget;
                delete out.subOptimizeTarget;
                out.dmcType = 'day_average';
                out.searchDetentType = mapKeywordSearchDetentTypeValue(out.searchDetentType) || 'first_place';
                out.setSingleCostV2 = false;
                delete out.singleCostV2;
                delete out.constraintType;
                delete out.constraintValue;
            } else if (isGoldenTrafficCardContract) {
                out.promotionScene = 'promotion_scene_golden_traffic_card_package';
                out.itemSelectedMode = 'user_define';
                out.bidTypeV2 = 'smart_bid';
                out.bidTargetV2 = 'conv';
                delete out.optimizeTarget;
                delete out.subOptimizeTarget;
                out.setSingleCostV2 = false;
                delete out.singleCostV2;
                delete out.constraintType;
                delete out.constraintValue;
                out.orderChargeType = String(out.orderChargeType || runtimeStoreData.orderChargeType || 'balance_charge').trim() || 'balance_charge';
                if (!isPlainObject(out.orderInfo)) {
                    const sourceOrderInfo = isPlainObject(templateCampaign.orderInfo)
                        ? templateCampaign.orderInfo
                        : (isPlainObject(runtimeStoreData.orderInfo) ? runtimeStoreData.orderInfo : {});
                    out.orderInfo = deepClone(sourceOrderInfo);
                }
                if (!isPlainObject(out.orderAutoRenewalInfo)) {
                    const sourceRenewalInfo = isPlainObject(templateCampaign.orderAutoRenewalInfo)
                        ? templateCampaign.orderAutoRenewalInfo
                        : (isPlainObject(runtimeStoreData.orderAutoRenewalInfo) ? runtimeStoreData.orderAutoRenewalInfo : {});
                    out.orderAutoRenewalInfo = Object.keys(sourceRenewalInfo || {}).length
                        ? deepClone(sourceRenewalInfo)
                        : { orderAutoRenewalSwitch: '1', orderAutoRenewalCondition: '' };
                }
            } else if (isTrendContract) {
                out.promotionScene = 'promotion_scene_search_trend';
                out.itemSelectedMode = 'trend';
                out.bidTypeV2 = 'smart_bid';
                out.trendType = String(out.trendType || goalRuntime.trendType || runtimeStoreData.trendType || templateCampaign.trendType || '0').trim() || '0';
                const normalizedTrendTarget = normalizeKeywordBidTargetCode(
                    out.bidTargetV2 || out.optimizeTarget || goalRuntime.bidTargetV2 || DEFAULTS.bidTargetV2
                ) || DEFAULTS.bidTargetV2;
                const trendBidTarget = normalizedTrendTarget === 'fav_cart' ? 'coll_cart' : normalizedTrendTarget;
                const trendSingleCostSeed = toNumber(
                    out.singleCostV2
                    ?? out.constraintValue
                    ?? goalRuntime?.constraintValue
                    ?? runtimeStoreData?.constraintValue
                    ?? templateCampaign?.constraintValue,
                    NaN
                );
                out.bidTargetV2 = trendBidTarget;
                if (trendBidTarget === 'roi') {
                    out.constraintType = 'roi';
                    if (Number.isFinite(trendSingleCostSeed) && trendSingleCostSeed > 0) {
                        out.constraintValue = trendSingleCostSeed;
                    }
                    out.setSingleCostV2 = false;
                    delete out.optimizeTarget;
                    delete out.singleCostV2;
                    delete out.subOptimizeTarget;
                } else if (trendBidTarget === 'conv' && out.setSingleCostV2 && Number.isFinite(trendSingleCostSeed) && trendSingleCostSeed > 0) {
                    out.setSingleCostV2 = true;
                    out.constraintType = 'dir_conv';
                    out.constraintValue = trendSingleCostSeed;
                    delete out.optimizeTarget;
                    delete out.singleCostV2;
                    delete out.subOptimizeTarget;
                } else {
                    out.optimizeTarget = trendBidTarget;
                    out.setSingleCostV2 = false;
                    delete out.singleCostV2;
                    delete out.constraintType;
                    delete out.constraintValue;
                    delete out.subOptimizeTarget;
                }
            } else if (isManual) {
                delete out.bidTargetV2;
                delete out.optimizeTarget;
                delete out.subOptimizeTarget;
                out.setSingleCostV2 = false;
                delete out.singleCostV2;
            } else {
                out.bidTargetV2 = out.bidTargetV2 || DEFAULTS.bidTargetV2;
                out.optimizeTarget = out.optimizeTarget || out.bidTargetV2 || DEFAULTS.bidTargetV2;
                const normalizedKeywordBidTarget = normalizeKeywordBidTargetCode(
                    out.bidTargetV2 || out.optimizeTarget || ''
                );
                if (normalizedKeywordBidTarget) {
                    out.bidTargetV2 = normalizedKeywordBidTarget;
                    out.optimizeTarget = normalizedKeywordBidTarget;
                }
                const keywordRoiTarget = String(
                    out.bidTargetV2 || out.optimizeTarget || ''
                ).trim().toLowerCase() === 'roi';
                if (keywordRoiTarget) {
                    const roiConstraintValue = toNumber(
                        out.constraintValue
                        ?? out.singleCostV2
                        ?? goalRuntime?.constraintValue
                        ?? runtimeStoreData?.constraintValue
                        ?? templateCampaign?.constraintValue
                        ?? runtimeDefaults?.constraintValue,
                        NaN
                    );
                    out.bidTargetV2 = 'roi';
                    out.optimizeTarget = 'roi';
                    out.constraintType = 'roi';
                    if (Number.isFinite(roiConstraintValue) && roiConstraintValue > 0) {
                        out.constraintValue = roiConstraintValue;
                    }
                }
                keywordRoiContract = keywordRoiTarget || (
                    String(out.bidTargetV2 || '').trim().toLowerCase() === 'roi'
                    && String(out.constraintType || '').trim().toLowerCase() === 'roi'
                );
                if (keywordRoiContract) {
                    if (!out.dmcType || String(out.dmcType).trim().toLowerCase() === 'normal') {
                        const roiBudgetValue = toNumber(
                            out.dayAverageBudget,
                            toNumber(out.dayBudget, NaN)
                        );
                        if (Number.isFinite(roiBudgetValue) && roiBudgetValue > 0) {
                            out.dayAverageBudget = roiBudgetValue;
                            delete out.dayBudget;
                        }
                        out.dmcType = 'day_average';
                    }
                }
                const keywordBidTargetCode = normalizeKeywordBidTargetCode(
                    out.bidTargetV2 || out.optimizeTarget || ''
                ) || String(out.bidTargetV2 || out.optimizeTarget || '').trim().toLowerCase();
                const keywordConvContract = keywordBidTargetCode === 'conv';
                const keywordFavCartContract = keywordBidTargetCode === 'fav_cart';
                const keywordClickContract = keywordBidTargetCode === 'click';
                const keywordFavCartMinConstraintValue = 5;
                if (keywordFavCartContract) {
                    // 原生“增加收藏加购量”使用 coll_cart 合同，若提交 fav_cart 会落库成手动出价。
                    out.bidTargetV2 = 'coll_cart';
                    delete out.optimizeTarget;
                    out.constraintType = 'coll_cart';
                } else if (keywordClickContract) {
                    // 原生“增加点击量”使用 click+constraint 合同，提交 display_click 会落库成手动出价。
                    out.bidTargetV2 = 'click';
                    delete out.optimizeTarget;
                    out.constraintType = 'click';
                }
                const resolvedMcbBidModel = resolveKeywordMcbBidModel(
                    (keywordFavCartContract ? 'coll_cart' : keywordBidTargetCode)
                    || String(out.bidTargetV2 || out.optimizeTarget || '').trim().toLowerCase()
                );
                if (keywordFavCartContract) {
                    out.mcbBidModel = 'coll_cart';
                    out.planMcbBidModel = 'coll_cart';
                } else if (keywordClickContract) {
                    // click 合同不走 mcb 字段，避免服务端按非原生契约降级为手动出价。
                    delete out.mcbBidModel;
                    delete out.planMcbBidModel;
                } else if (resolvedMcbBidModel) {
                    // 关键词创建口要求显式携带 MCB 出价模型，缺失时会报 INVALID_PARAMETER。
                    out.mcbBidModel = resolvedMcbBidModel;
                    out.planMcbBidModel = resolvedMcbBidModel;
                }
                const parseKeywordSingleCostEnabled = (value = false) => {
                    if (value === true || value === 1) return true;
                    if (value === false || value === 0) return false;
                    const token = String(value ?? '').trim().toLowerCase();
                    return token === '1' || token === 'true' || token === 'yes' || token === 'on';
                };
                if (keywordConvContract) {
                    const convConstraintValue = toNumber(
                        out.constraintValue
                        ?? out.singleCostV2
                        ?? goalRuntime?.constraintValue
                        ?? runtimeStoreData?.constraintValue
                        ?? templateCampaign?.constraintValue,
                        NaN
                    );
                    out.constraintType = 'dir_conv';
                    if (Number.isFinite(convConstraintValue) && convConstraintValue > 0) {
                        out.constraintValue = convConstraintValue;
                        out.setSingleCostV2 = true;
                    } else {
                        out.setSingleCostV2 = false;
                        delete out.constraintValue;
                    }
                    delete out.optimizeTarget;
                    delete out.subOptimizeTarget;
                    delete out.singleCostV2;
                    // 与原生提交流程对齐：conv 合同不走 mcb 字段，避免触发计划MCB模型校验。
                    delete out.mcbBidModel;
                    delete out.planMcbBidModel;
                } else {
                    delete out.subOptimizeTarget;
                }
                const singleCostValue = toNumber(out.singleCostV2, NaN);
                if (keywordRoiContract) {
                    out.setSingleCostV2 = false;
                    delete out.singleCostV2;
                } else if (keywordConvContract) {
                    // conv 合同已在上方归一化为 constraintType/constraintValue，不再走 singleCostV2。
                } else {
                    if (keywordFavCartContract) {
                        const favCartSingleCostEnabled = parseKeywordSingleCostEnabled(out.setSingleCostV2);
                        const favCartConstraintSeed = toNumber(
                            out.singleCostV2
                            ?? out.constraintValue,
                            NaN
                        );
                        const hasFavCartConstraintValue = Number.isFinite(favCartConstraintSeed);
                        if (hasFavCartConstraintValue && favCartConstraintSeed < keywordFavCartMinConstraintValue) {
                            throw new Error('增加收藏加购量目标成本需填写 5-9999.99 的数值');
                        }
                        if (favCartSingleCostEnabled && hasFavCartConstraintValue) {
                            out.setSingleCostV2 = true;
                            out.constraintValue = favCartConstraintSeed;
                        } else {
                            out.setSingleCostV2 = false;
                            delete out.constraintValue;
                        }
                        delete out.singleCostV2;
                    } else if (keywordClickContract) {
                        const clickSingleCostEnabled = parseKeywordSingleCostEnabled(out.setSingleCostV2);
                        const clickSingleCostSeed = toNumber(
                            out.singleCostV2
                            ?? out.constraintValue,
                            NaN
                        );
                        const hasClickSingleCostValue = Number.isFinite(clickSingleCostSeed) && clickSingleCostSeed > 0;
                        if (clickSingleCostEnabled && hasClickSingleCostValue) {
                            out.setSingleCostV2 = true;
                            out.constraintValue = clickSingleCostSeed;
                        } else {
                            out.setSingleCostV2 = false;
                            delete out.constraintValue;
                        }
                        delete out.singleCostV2;
                    } else {
                        out.setSingleCostV2 = !!out.setSingleCostV2;
                        if (out.setSingleCostV2 && Number.isFinite(singleCostValue) && singleCostValue > 0) {
                            out.singleCostV2 = singleCostValue;
                        } else {
                            out.setSingleCostV2 = false;
                            delete out.singleCostV2;
                        }
                    }
                    // 非 ROI 目标默认只保留 singleCostV2；收藏加购与点击目标需保留原生 constraint 合同字段。
                    if (!keywordFavCartContract && !keywordClickContract) {
                        delete out.constraintType;
                        delete out.constraintValue;
                    }
                }
            }
            const forceKeywordDailyBudget = !isManual
                && keywordMarketingGoal === '自定义推广'
                && !keywordRoiContract;
            const normalizeKeywordBudgetType = (value = '') => {
                const token = String(value || '').trim().toLowerCase();
                if (!token) return '';
                if (token === 'day_budget') return 'normal';
                if (/^(normal|day_average|total|day_freeze|unlimit)$/.test(token)) return token;
                return '';
            };
            const resolveKeywordBudgetValue = (preferredField = '') => {
                const candidateFields = uniqueBy(
                    [
                        preferredField,
                        DMC_BUDGET_FIELD_MAP[out.dmcType],
                        'dayBudget',
                        'dayAverageBudget',
                        'totalBudget',
                        'futureBudget'
                    ].map(item => String(item || '').trim()).filter(Boolean),
                    item => item
                );
                for (let i = 0; i < candidateFields.length; i += 1) {
                    const field = candidateFields[i];
                    const numeric = toNumber(out[field], NaN);
                    if (Number.isFinite(numeric) && numeric > 0) return numeric;
                }
                const runtimeCandidates = [
                    runtimeStoreData.dayBudget,
                    runtimeStoreData.dayAverageBudget,
                    runtimeStoreData.totalBudget,
                    runtimeStoreData.futureBudget,
                    runtimeDefaults.dayBudget,
                    runtimeDefaults.dayAverageBudget,
                    runtimeDefaults.totalBudget,
                    runtimeDefaults.futureBudget,
                    request?.common?.dayAverageBudget,
                    request?.dayAverageBudget
                ];
                for (let i = 0; i < runtimeCandidates.length; i += 1) {
                    const numeric = toNumber(runtimeCandidates[i], NaN);
                    if (Number.isFinite(numeric) && numeric > 0) return numeric;
                }
                return NaN;
            };
            let normalizedDmcType = normalizeKeywordBudgetType(out.dmcType)
                || normalizeKeywordBudgetType(DEFAULTS.dmcType)
                || 'day_average';
            if (forceKeywordDailyBudget) normalizedDmcType = 'normal';
            if (keywordRoiContract) normalizedDmcType = 'day_average';
            out.dmcType = normalizedDmcType;
            if (normalizedDmcType === 'unlimit') {
                delete out.dayBudget;
                delete out.dayAverageBudget;
                delete out.totalBudget;
                delete out.futureBudget;
            } else {
                const targetBudgetField = DMC_BUDGET_FIELD_MAP[normalizedDmcType] || 'dayAverageBudget';
                const resolvedBudgetValue = resolveKeywordBudgetValue(targetBudgetField);
                BUDGET_FIELDS.forEach(field => {
                    if (field !== targetBudgetField) delete out[field];
                });
                if (Number.isFinite(resolvedBudgetValue) && resolvedBudgetValue > 0) {
                    out[targetBudgetField] = resolvedBudgetValue;
                }
            }
            out.campaignName = String(out.campaignName || `关键词推广_${todayStamp()}`).trim();
            if (!isPlainObject(out.campaignCycleBudgetInfo)) {
                out.campaignCycleBudgetInfo = { currentCampaignActivityCycleBudgetStatus: '0' };
            } else if (!out.campaignCycleBudgetInfo.currentCampaignActivityCycleBudgetStatus) {
                out.campaignCycleBudgetInfo.currentCampaignActivityCycleBudgetStatus = '0';
            }
            if (!Array.isArray(out.itemIdList)) out.itemIdList = [];
            if (!Array.isArray(out.deleteAdgroupList)) out.deleteAdgroupList = [];
            if (!Array.isArray(out.updatedRightInfoAdgroupList)) out.updatedRightInfoAdgroupList = [];
            out.crowdList = resolveNonEmptyArrayField('crowdList', Array.isArray(out.crowdList) ? out.crowdList : []);
            if (!Array.isArray(out.crowdList)) out.crowdList = [];
            out.adzoneList = resolveNonEmptyArrayField('adzoneList', Array.isArray(out.adzoneList) ? out.adzoneList : []);
            if (!Array.isArray(out.adzoneList)) out.adzoneList = [];
            const resolvedLaunchAreaList = resolveNonEmptyArrayField(
                'launchAreaStrList',
                Array.isArray(out.launchAreaStrList) ? out.launchAreaStrList : []
            );
            out.launchAreaStrList = Array.isArray(resolvedLaunchAreaList) && resolvedLaunchAreaList.length
                ? resolvedLaunchAreaList
                : ['all'];
            const resolvedLaunchPeriodList = resolveNonEmptyArrayField(
                'launchPeriodList',
                Array.isArray(out.launchPeriodList) ? out.launchPeriodList : []
            );
            out.launchPeriodList = Array.isArray(resolvedLaunchPeriodList) && resolvedLaunchPeriodList.length
                ? resolvedLaunchPeriodList
                : buildDefaultLaunchPeriodList();
            if (isTrendContract) {
                out.trendThemeList = resolveNonEmptyArrayField(
                    'trendThemeList',
                    Array.isArray(out.trendThemeList) ? out.trendThemeList : []
                );
            }
            if (isSearchDetentContract) {
                out.searchDetentType = mapKeywordSearchDetentTypeValue(out.searchDetentType) || 'first_place';
            }
            if (isGoldenTrafficCardContract) {
                if (!isPlainObject(out.orderInfo)) out.orderInfo = {};
                if (!isPlainObject(out.orderAutoRenewalInfo)) {
                    out.orderAutoRenewalInfo = { orderAutoRenewalSwitch: '1', orderAutoRenewalCondition: '' };
                } else if (!out.orderAutoRenewalInfo.orderAutoRenewalSwitch) {
                    out.orderAutoRenewalInfo.orderAutoRenewalSwitch = '1';
                }
                out.orderChargeType = String(out.orderChargeType || 'balance_charge').trim() || 'balance_charge';
            }
            return out;
        };

        const pruneKeywordAdgroupForCustomScene = (adgroup = {}, item = null, options = {}) => {
            const input = isPlainObject(adgroup) ? adgroup : {};
            const out = {};
            out.rightList = Array.isArray(input.rightList) ? deepClone(input.rightList) : [];
            out.wordList = normalizeKeywordWordListForSubmit(input.wordList || []);
            if (hasOwn(input, 'wordPackageList')) {
                out.wordPackageList = Array.isArray(input.wordPackageList)
                    ? deepClone(input.wordPackageList).slice(0, 100)
                    : [];
            }
            if (item && (item.materialId || item.itemId)) {
                const fallbackMaterialName = `商品${item.itemId || item.materialId || ''}`;
                const materialName = String(item.materialName || '').trim() || fallbackMaterialName;
                out.material = pickMaterialFields(mergeDeep(input.material || {}, {
                    materialId: toIdValue(item.materialId || item.itemId),
                    materialName,
                    promotionType: DEFAULTS.promotionType,
                    subPromotionType: DEFAULTS.subPromotionType,
                    fromTab: item.fromTab || 'manual',
                    linkUrl: item.linkUrl || '',
                    goalLifeCycleList: item.goalLifeCycleList || null,
                    shopId: item.shopId || '',
                    shopName: item.shopName || '',
                    bidCount: item.bidCount || 0,
                    categoryLevel1: item.categoryLevel1 || ''
                }));
            } else if (isPlainObject(input.material)) {
                out.material = pickMaterialFields(input.material);
            }
            return out;
        };

        const deriveFallbackKeywordListFromItem = (item = {}, keywordDefaults = {}) => {
            const title = String(item?.materialName || '').trim();
            if (!title) return [];
            const seeds = [];
            const normalized = title.replace(/[，。、“”‘’!！?？:：;；,.\-_/()（）【】\[\]\s]+/g, ' ').trim();
            if (normalized) {
                const parts = normalized.split(/\s+/).filter(Boolean);
                if (parts.length) seeds.push(parts[0]);
                if (parts.length > 1) seeds.push(parts.slice(0, 2).join(' '));
            }
            seeds.push(title.slice(0, 12));
            const words = uniqueBy(
                seeds
                    .map(text => String(text || '').trim())
                    .filter(text => text.length >= 2)
                    .map(text => applyKeywordDefaults({ word: text }, keywordDefaults)),
                item => item.word
            ).slice(0, 3);
            return words;
        };

        const buildKeywordBundle = async ({ plan, item, runtimeDefaults, request, requestOptions }) => {
            const commonKeywordDefaults = request?.common?.keywordDefaults || {};
            const planKeywordDefaults = plan?.keywordDefaults || {};
            const keywordDefaults = {
                bidPrice: toNumber(planKeywordDefaults.bidPrice, toNumber(commonKeywordDefaults.bidPrice, 1)),
                matchScope: parseMatchScope(planKeywordDefaults.matchScope, parseMatchScope(commonKeywordDefaults.matchScope, DEFAULTS.matchScope)),
                onlineStatus: toNumber(planKeywordDefaults.onlineStatus, toNumber(commonKeywordDefaults.onlineStatus, DEFAULTS.keywordOnlineStatus))
            };
            const sourceCfg = plan?.keywordSource || {};
            const mode = sourceCfg.mode || request?.common?.keywordMode || DEFAULTS.keywordMode;
            const recommendCount = Math.max(0, toNumber(sourceCfg.recommendCount, toNumber(request?.common?.recommendCount, DEFAULTS.recommendCount)));
            const recommendSource = sourceCfg.recommendSource || 'auto';
            const toBooleanOrEmpty = (value) => {
                if (value === true || value === false) return value;
                const text = String(value || '').trim().toLowerCase();
                if (!text) return '';
                if (text === 'true' || text === '1' || text === 'yes' || text === 'on') return true;
                if (text === 'false' || text === '0' || text === 'no' || text === 'off') return false;
                return '';
            };
            const resolveWordPackageSwitch = () => {
                const candidates = [
                    sourceCfg.useWordPackage,
                    plan?.useWordPackage,
                    request?.useWordPackage,
                    request?.common?.useWordPackage
                ];
                for (let i = 0; i < candidates.length; i++) {
                    const parsed = toBooleanOrEmpty(candidates[i]);
                    if (parsed === true || parsed === false) return parsed;
                }
                return DEFAULTS.useWordPackage !== false;
            };
            const useWordPackage = resolveWordPackageSwitch();
            const manualWords = parseKeywords(plan?.keywords || [], keywordDefaults).map(word => applyKeywordDefaults(word, keywordDefaults));
            const keywordSuggestDefaults = {
                ...runtimeDefaults,
                itemSelectedMode: runtimeDefaults.itemSelectedMode || DEFAULTS.itemSelectedMode,
                bidTypeV2: runtimeDefaults.bidTypeV2 || DEFAULTS.bidTypeV2,
                bidTargetV2: runtimeDefaults.bidTargetV2 || DEFAULTS.bidTargetV2,
                promotionScene: runtimeDefaults.promotionScene || DEFAULTS.promotionScene
            };

            let recommendedWords = [];
            let recommendedPackages = [];
            if (mode !== 'manual') {
                recommendedWords = await fetchRecommendWordList({
                    bizCode: keywordSuggestDefaults.bizCode,
                    materialId: item.materialId,
                    defaults: keywordSuggestDefaults,
                    source: recommendSource,
                    requestOptions
                });
            }
            if (useWordPackage) {
                recommendedPackages = await fetchRecommendWordPackageList({
                    bizCode: keywordSuggestDefaults.bizCode,
                    materialId: item.materialId,
                    defaults: keywordSuggestDefaults,
                    requestOptions
                });
            }

            const normalizedRecommend = recommendedWords
                .map(word => applyKeywordDefaults(word, keywordDefaults))
                .filter(word => word.word);

            let mergedWordList = [];
            if (mode === 'manual') {
                mergedWordList = manualWords;
            } else if (mode === 'recommend') {
                mergedWordList = normalizedRecommend.slice(0, recommendCount || normalizedRecommend.length);
            } else {
                const dedupMap = new Map();
                manualWords.forEach(word => dedupMap.set(word.word, word));
                normalizedRecommend.forEach(word => {
                    if (dedupMap.size >= Math.max(recommendCount, manualWords.length)) return;
                    if (!dedupMap.has(word.word)) dedupMap.set(word.word, word);
                });
                mergedWordList = Array.from(dedupMap.values());
                if (recommendCount > 0 && mergedWordList.length < recommendCount) {
                    normalizedRecommend.forEach(word => {
                        if (mergedWordList.length >= recommendCount) return;
                        if (!dedupMap.has(word.word)) {
                            dedupMap.set(word.word, word);
                            mergedWordList.push(word);
                        }
                    });
                }
            }
            mergedWordList = uniqueBy(mergedWordList, word => word.word).slice(0, 200);
            if (!mergedWordList.length) {
                mergedWordList = deriveFallbackKeywordListFromItem(item, keywordDefaults);
            }
            const wordPackageList = Array.isArray(recommendedPackages) ? recommendedPackages.slice(0, 100) : [];
            return {
                wordList: mergedWordList,
                wordPackageList,
                useWordPackage,
                mode,
                manualCount: manualWords.length,
                recommendCount: normalizedRecommend.length
            };
        };

        const extractPageAddedItemIds = () => {
            const addBtn = Array.from(document.querySelectorAll('button,div,a')).find(el =>
                /添加商品\s*\d+\s*\/\s*\d+/.test((el.textContent || '').replace(/\s+/g, ' '))
            );
            const expectedCount = toNumber(((addBtn?.textContent || '').match(/(\d+)\s*\/\s*\d+/) || [])[1], 0);
            const root = addBtn?.closest('section,div')?.parentElement || document.body;

            const idsFromText = parseItemIdsFromText(root?.innerText || '');
            const idsFromHref = uniqueBy(
                Array.from(root?.querySelectorAll?.('a[href*="item.htm?id="]') || [])
                    .map(a => {
                        const match = (a.getAttribute('href') || '').match(/id=(\d{6,})/);
                        return match ? match[1] : '';
                    })
                    .filter(Boolean),
                id => id
            );
            const all = uniqueBy([...idsFromText, ...idsFromHref], id => id);
            return expectedCount > 0 ? all.slice(0, expectedCount) : all;
        };

        const fetchItemsByIds = async (itemIdList, runtime) => {
            if (!Array.isArray(itemIdList) || !itemIdList.length) return [];
            const res = await searchItems({
                bizCode: runtime.bizCode,
                promotionScene: runtime.promotionScene,
                itemIdList,
                pageSize: Math.max(40, itemIdList.length)
            });
            const map = new Map(res.list.map(item => [String(item.materialId), item]));
            return itemIdList.map(id => map.get(String(id))).filter(Boolean);
        };

        const readSessionDraft = () => {
            try {
                const raw = sessionStorage.getItem(SESSION_DRAFT_KEY);
                if (!raw) return null;
                const parsed = JSON.parse(raw);
                return isPlainObject(parsed) ? parsed : null;
            } catch {
                return null;
            }
        };

        const saveSessionDraft = (draft) => {
            try {
                sessionStorage.setItem(SESSION_DRAFT_KEY, JSON.stringify(draft || {}));
            } catch (err) {
                log.warn('保存向导草稿失败:', err?.message || err);
            }
        };

        const clearSessionDraft = () => {
            try {
                sessionStorage.removeItem(SESSION_DRAFT_KEY);
            } catch { }
            wizardState.draft = null;
            wizardState.addedItems = [];
            wizardState.crowdList = [];
            wizardState.debugVisible = false;
            wizardState.strategyList = getDefaultStrategyList();
            wizardState.editingStrategyId = '';
            wizardState.detailVisible = false;
        };

        const createWizardDraft = (seed = {}) => mergeDeep(
            KeywordPlanWizardStore.wizardDefaultDraft(),
            isPlainObject(seed) ? seed : {}
        );

        const resetWizardDraft = (patch = {}) => {
            const draft = createWizardDraft(patch);
            wizardState.draft = draft;
            return draft;
        };

        const hydrateWizardDraftForOpen = (storedDraft = {}) => {
            const draft = createWizardDraft(storedDraft);
            const draftSchemaVersion = toNumber(storedDraft?.schemaVersion, 0);
            if (draftSchemaVersion !== SESSION_DRAFT_SCHEMA_VERSION) {
                draft.sceneSettingValues = {};
                draft.sceneSettingTouched = {};
                draft.editingStrategyId = '';
                draft.detailVisible = false;
            }
            draft.schemaVersion = SESSION_DRAFT_SCHEMA_VERSION;
            draft.detailVisible = false;
            draft.itemSplitExpanded = false;
            draft.candidateListExpanded = false;
            if (!SCENE_NAME_LIST.includes(draft.sceneName)) {
                const currentSceneName = inferCurrentSceneName();
                draft.sceneName = SCENE_NAME_LIST.includes(currentSceneName) ? currentSceneName : '关键词推广';
            }
            const initSceneBizCodeHint = resolveSceneBizCodeHint(draft.sceneName);
            if (initSceneBizCodeHint && !draft.bizCode) {
                draft.bizCode = initSceneBizCodeHint;
            }
            if (draft.bizCode && draft.bizCode !== DEFAULTS.bizCode) {
                draft.promotionScene = '';
            } else if (!draft.promotionScene) {
                draft.promotionScene = DEFAULTS.promotionScene;
            }
            return draft;
        };

        const ensureWizardDraft = () => {
            wizardState.draft = wizardState.draft || KeywordPlanWizardStore.wizardDefaultDraft();
            return wizardState.draft;
        };

        const persistWizardDraft = (draft = null) => {
            const nextDraft = isPlainObject(draft) ? draft : ensureWizardDraft();
            KeywordPlanWizardStore.saveSessionDraft(nextDraft);
            return nextDraft;
        };

        const refreshWizardPreview = () => {
            if (typeof wizardState.buildRequest !== 'function' || typeof wizardState.renderPreview !== 'function') return null;
            const request = wizardState.buildRequest();
            wizardState.renderPreview(request);
            return request;
        };

        const prepareWizardStateForOpen = (storedDraft = {}) => {
            const draft = KeywordPlanWizardStore.hydrateWizardDraftForOpen(storedDraft);
            wizardState.draft = draft;
            wizardState.candidateSource = 'all';
            wizardState.addedItems = Array.isArray(draft.addedItems)
                ? draft.addedItems.map(normalizeItem).filter(item => item.materialId).slice(0, WIZARD_MAX_ITEMS)
                : [];
            return draft;
        };

        const renderWizardFromState = (options = {}) => {
            const shouldRefreshPreview = options.refreshPreview !== false;
            const shouldClearLogs = options.clearLogs === true;
            if (typeof wizardState.fillUIFromDraft === 'function') {
                wizardState.fillUIFromDraft();
            }
            if (typeof wizardState.refreshSceneSelect === 'function') {
                wizardState.refreshSceneSelect();
            } else {
                refreshSceneSelect();
            }
            if (typeof wizardState.renderStrategyList === 'function') {
                wizardState.renderStrategyList();
            }
            if (typeof wizardState.renderAddedList === 'function') {
                wizardState.renderAddedList();
            }
            if (typeof wizardState.renderCrowdList === 'function') {
                wizardState.renderCrowdList();
            }
            if (typeof wizardState.renderCandidateList === 'function') {
                wizardState.renderCandidateList();
            }
            if (typeof wizardState.setCandidateSource === 'function') {
                wizardState.setCandidateSource(wizardState.candidateSource || 'all');
            }
            if (typeof wizardState.setWorkbenchPage === 'function') {
                wizardState.setWorkbenchPage(wizardState.workbenchPage || 'home');
            }
            if (shouldRefreshPreview) {
                if (typeof wizardState.renderWizardPreview === 'function') {
                    wizardState.renderWizardPreview();
                } else {
                    refreshWizardPreview();
                }
            }
            if (shouldClearLogs) {
                if (wizardState.els.log) {
                    wizardState.els.log.innerHTML = '';
                }
                if (wizardState.els.quickLog) {
                    wizardState.els.quickLog.innerHTML = '';
                }
                if (wizardState.els.workbenchPreviewLog) {
                    wizardState.els.workbenchPreviewLog.innerHTML = '';
                }
            }
        };

        const resolvePreferredItems = async (request, runtime) => {
            const draft = KeywordPlanWizardStore.readSessionDraft();
            const draftItems = Array.isArray(draft?.addedItems)
                ? draft.addedItems.map(normalizeItem).filter(item => item.materialId)
                : [];
            if (draftItems.length) return draftItems.slice(0, WIZARD_MAX_ITEMS);

            const pageItemIds = extractPageAddedItemIds();
            if (pageItemIds.length) {
                const fromPage = await fetchItemsByIds(pageItemIds, runtime);
                if (fromPage.length) return fromPage.slice(0, WIZARD_MAX_ITEMS);
            }

            if (request?.itemSearch) {
                const searched = await searchItems(request.itemSearch);
                if (Array.isArray(searched?.list) && searched.list.length) {
                    return searched.list.slice(0, WIZARD_MAX_ITEMS);
                }
            }

            const targetScene = String(
                request?.sceneName
                || wizardState?.draft?.sceneName
                || inferCurrentSceneName()
                || ''
            ).trim();
            const targetGoal = normalizeGoalCandidateLabel(
                request?.marketingGoal
                || request?.common?.marketingGoal
                || ''
            );
            const isKeywordScene = targetScene === '关键词推广';
            const isCrowdScene = targetScene === '人群推广';
            const shouldInjectKeywordDefaultItem = isKeywordScene && (!targetGoal || targetGoal === '自定义推广');
            const shouldInjectCrowdDefaultItem = isCrowdScene;
            if (shouldInjectKeywordDefaultItem || shouldInjectCrowdDefaultItem) {
                const defaultItems = await fetchItemsByIds([SCENE_SYNC_DEFAULT_ITEM_ID], runtime);
                if (defaultItems.length) return defaultItems.slice(0, WIZARD_MAX_ITEMS);
            }

            return [];
        };

        const isSceneLikelyRequireItem = (sceneName = '') => {
            const normalizedScene = String(sceneName || '').trim();
            if (!normalizedScene) return true;
            if (SCENE_REQUIRE_ITEM_FALLBACK[normalizedScene] !== undefined) {
                return !!SCENE_REQUIRE_ITEM_FALLBACK[normalizedScene];
            }
            return true;
        };

        const resolveSceneCapabilities = ({ sceneName = '', runtime = {}, request = {} }) => {
            const normalizedScene = String(sceneName || request?.sceneName || '').trim();
            const expectedSceneBizCode = normalizeSceneBizCode(
                resolveSceneBizCodeHint(normalizedScene)
                || SCENE_BIZCODE_HINT_FALLBACK[normalizedScene]
                || ''
            );
            const runtimeTemplateBizCode = normalizeSceneBizCode(
                runtime?.solutionTemplate?.bizCode
                || runtime?.solutionTemplate?.campaign?.bizCode
                || ''
            );
            const templateMatchedScene = !expectedSceneBizCode
                || !runtimeTemplateBizCode
                || runtimeTemplateBizCode === expectedSceneBizCode;
            const template = templateMatchedScene ? (runtime?.solutionTemplate || {}) : {};
            const templateCampaign = isPlainObject(template.campaign) ? template.campaign : {};
            const templateAdgroup = Array.isArray(template.adgroupList) && isPlainObject(template.adgroupList[0])
                ? template.adgroupList[0]
                : {};
            const capabilityFallback = {
                '货品全站推广': { hasMaterial: true, hasItemIdList: true, hasWordList: false, hasWordPackageList: false, hasRightList: false },
                '关键词推广': { hasMaterial: true, hasItemIdList: true, hasWordList: true, hasWordPackageList: true, hasRightList: true },
                '人群推广': { hasMaterial: false, hasItemIdList: true, hasWordList: false, hasWordPackageList: false, hasRightList: true },
                '店铺直达': { hasMaterial: true, hasItemIdList: false, hasWordList: false, hasWordPackageList: true, hasRightList: false },
                '内容营销': { hasMaterial: true, hasItemIdList: false, hasWordList: false, hasWordPackageList: false, hasRightList: false },
                '线索推广': { hasMaterial: false, hasItemIdList: true, hasWordList: true, hasWordPackageList: true, hasRightList: false }
            }[normalizedScene] || {};
            const hasTemplateCampaign = isPlainObject(templateCampaign) && Object.keys(templateCampaign).length > 0;
            const hasTemplateAdgroup = isPlainObject(templateAdgroup) && Object.keys(templateAdgroup).length > 0;
            const useFallbackCapability = !hasTemplateCampaign || !hasTemplateAdgroup || !templateMatchedScene;
            const hasMaterial = isPlainObject(templateAdgroup.material) && Object.keys(templateAdgroup.material).length > 0;
            const hasItemIdList = hasOwn(templateCampaign, 'itemIdList') || (!!capabilityFallback.hasItemIdList && useFallbackCapability);
            const hasWordList = hasOwn(templateAdgroup, 'wordList') || (!!capabilityFallback.hasWordList && useFallbackCapability);
            const hasWordPackageList = hasOwn(templateAdgroup, 'wordPackageList') || (!!capabilityFallback.hasWordPackageList && useFallbackCapability);
            const hasRightList = hasOwn(templateAdgroup, 'rightList') || (!!capabilityFallback.hasRightList && useFallbackCapability);

            const requireItemOverride = request?.requireItem;
            let requiresItem = false;
            if (requireItemOverride === true || requireItemOverride === false) {
                requiresItem = !!requireItemOverride;
            } else if (hasMaterial || hasItemIdList) {
                requiresItem = true;
            } else {
                requiresItem = isSceneLikelyRequireItem(normalizedScene);
            }

            const enableKeywordsOverride = request?.enableKeywords;
            let enableKeywords = false;
            if (enableKeywordsOverride === true || enableKeywordsOverride === false) {
                enableKeywords = !!enableKeywordsOverride;
            } else {
                // `wordPackageList` 在非关键词场景可能仅是模板残留字段，不能直接判定为“启用关键词”。
                enableKeywords = /(关键词推广|线索推广)/.test(normalizedScene) || hasWordList;
            }

            // 关键词推广必须按“商品 + 关键词单元”提交，不能依赖模板是否返回这些字段。
            if (normalizedScene === '关键词推广') {
                requiresItem = true;
                enableKeywords = true;
            }

            return {
                sceneName: normalizedScene,
                expectedSceneBizCode,
                runtimeTemplateBizCode,
                templateMatchedScene,
                hasTemplateCampaign,
                hasTemplateAdgroup,
                requiresItem,
                enableKeywords,
                hasMaterial: SCENE_FORCE_ADGROUP_MATERIAL[normalizedScene]
                    ? true
                    : (normalizedScene === '关键词推广' ? true : (hasMaterial || (!!capabilityFallback.hasMaterial && useFallbackCapability))),
                // 货品全站推广同样依赖 itemIdList 绑定商品，避免创建后出现空商品计划。
                hasItemIdList: (normalizedScene === '关键词推广' || normalizedScene === '货品全站推广') ? true : hasItemIdList,
                hasWordList: normalizedScene === '关键词推广' ? true : hasWordList,
                hasWordPackageList: normalizedScene === '关键词推广' ? true : hasWordPackageList,
                hasRightList
            };
        };

        const resolvePlanNamePrefix = (request = {}) => {
            const fromRequest = String(request?.planNamePrefix || '').trim();
            if (fromRequest) return fromRequest;
            const sceneName = String(request?.sceneName || '关键词推广').trim() || '关键词推广';
            return buildSceneTimePrefix(sceneName);
        };

        const normalizePlans = (request, preferredItems, options = {}) => {
            const requiresItem = options.requiresItem !== false;
            const onDroppedPlan = typeof options.onDroppedPlan === 'function'
                ? options.onDroppedPlan
                : null;
            const commonBidMode = normalizeBidMode(request?.common?.bidMode || request?.bidMode || '', 'smart');
            const plans = Array.isArray(request?.plans) ? request.plans.map(plan => ({ ...plan })) : [];
            const fallbackRequestItemId = String(toIdValue(request?.itemId || request?.materialId || '')).trim();
            const fallbackRequestItemName = String(request?.itemName || request?.materialName || '').trim();
            const hasRequestedPlanCount = request?.planCount !== undefined || request?.count !== undefined;
            const requestedPlanCount = hasRequestedPlanCount
                ? Math.max(1, Math.min(50, toNumber(request?.planCount ?? request?.count, 1)))
                : null;
            // request.itemId/materialId 只作为单计划兜底，避免多计划被同一商品批量回填。
            const allowRequestItemFallback = !!fallbackRequestItemId && plans.length <= 1;
            if (!plans.length) {
                const prefix = resolvePlanNamePrefix(request);
                if (!preferredItems.length) {
                    if (requiresItem) return [];
                    const planCount = requestedPlanCount ?? 1;
                    return Array.from({ length: planCount }).map((_, idx) => ({
                        planName: `${prefix}_${String(idx + 1).padStart(2, '0')}`,
                        bidMode: commonBidMode,
                        keywords: request?.keywords || [],
                        keywordSource: request?.keywordSource || {}
                    }));
                }
                const autoItems = requestedPlanCount === null
                    ? preferredItems
                    : preferredItems.slice(0, requestedPlanCount);
                return autoItems.map((item, idx) => ({
                    planName: `${prefix}_${String(idx + 1).padStart(2, '0')}`,
                    item,
                    bidMode: commonBidMode,
                    keywords: request?.keywords || [],
                    keywordSource: request?.keywordSource || {}
                }));
            }

            let fillCursor = 0;
            const normalizedPlans = plans.map((plan, idx) => {
                const normalized = { ...plan };
                if (!normalized.planName) {
                    const prefix = resolvePlanNamePrefix(request);
                    normalized.planName = `${prefix}_${String(idx + 1).padStart(2, '0')}`;
                }
                normalized.bidMode = normalizeBidMode(
                    normalized.bidMode
                    || normalized.campaignOverride?.bidTypeV2
                    || commonBidMode,
                    commonBidMode
                );
                if (normalized.item) {
                    normalized.item = normalizeItem(normalized.item);
                } else if (normalized.itemId || normalized.materialId) {
                    const normalizedItemId = String(toIdValue(normalized.itemId || normalized.materialId || '')).trim();
                    normalized.itemId = normalizedItemId;
                    normalized.item = normalizeItem({
                        materialId: normalizedItemId,
                        itemId: normalizedItemId,
                        materialName: normalized.itemName || normalized.materialName || ''
                    });
                } else if (allowRequestItemFallback) {
                    normalized.itemId = fallbackRequestItemId;
                    normalized.item = normalizeItem({
                        materialId: fallbackRequestItemId,
                        itemId: fallbackRequestItemId,
                        materialName: fallbackRequestItemName || ''
                    });
                } else if (preferredItems[fillCursor]) {
                    normalized.item = normalizeItem(preferredItems[fillCursor]);
                    fillCursor++;
                }
                return normalized;
            });
            if (!requiresItem) return normalizedPlans;
            const keptPlans = [];
            normalizedPlans.forEach((plan, idx) => {
                if (plan?.item?.materialId) {
                    keptPlans.push(plan);
                    return;
                }
                if (!onDroppedPlan) return;
                onDroppedPlan({
                    planIndex: idx,
                    planName: String(plan?.planName || '').trim(),
                    item: isPlainObject(plan?.item) ? deepClone(plan.item) : null,
                    itemId: String(toIdValue(plan?.itemId || plan?.materialId || '')).trim(),
                    marketingGoal: String(plan?.marketingGoal || '').trim(),
                    submitEndpoint: String(plan?.submitEndpoint || '').trim(),
                    error: '计划缺少商品参数（item/itemId/materialId），且未能从请求或已选商品补齐'
                });
            });
            return keptPlans;
        };

        const applyOverrides = (target, request, plan) => {
            const commonCampaignOverride = request?.common?.campaignOverride || {};
            const commonAdgroupOverride = request?.common?.adgroupOverride || {};
            const commonPassthrough = request?.common?.passthrough || {};
            const planCampaignOverride = plan?.campaignOverride || {};
            const planAdgroupOverride = plan?.adgroupOverride || {};
            const goalForcedCampaignOverride = request?.goalForcedCampaignOverride || {};
            const goalForcedAdgroupOverride = request?.goalForcedAdgroupOverride || {};
            const planGoalCampaignOverride = plan?.goalForcedCampaignOverride || {};
            const planGoalAdgroupOverride = plan?.goalForcedAdgroupOverride || {};
            const sceneForcedCampaignOverride = request?.sceneForcedCampaignOverride || {};
            const sceneForcedAdgroupOverride = request?.sceneForcedAdgroupOverride || {};
            const requestRawOverrides = isPlainObject(request?.rawOverrides) ? request.rawOverrides : {};
            const commonRawOverrides = isPlainObject(request?.common?.rawOverrides) ? request.common.rawOverrides : {};
            const planRawOverrides = isPlainObject(plan?.rawOverrides) ? plan.rawOverrides : {};

            const pickCampaignRaw = (raw) => {
                if (!isPlainObject(raw)) return {};
                if (isPlainObject(raw.campaign)) return raw.campaign;
                if (isPlainObject(raw.adgroup)) return {};
                return raw;
            };
            const pickAdgroupRaw = (raw) => {
                if (!isPlainObject(raw)) return {};
                if (isPlainObject(raw.adgroup)) return raw.adgroup;
                return {};
            };

            // 合并顺序：模板基底(已在 buildSolutionFromPlan) -> GoalSpec 默认 -> 场景映射
            // -> common override/passthrough -> plan override -> rawOverrides。
            // 这样可保证 plan 级显式设置优先于 common 级兜底透传。
            target.campaign = mergeDeep(
                target.campaign,
                goalForcedCampaignOverride,
                planGoalCampaignOverride,
                sceneForcedCampaignOverride,
                commonCampaignOverride,
                commonPassthrough,
                planCampaignOverride,
                pickCampaignRaw(requestRawOverrides),
                pickCampaignRaw(commonRawOverrides),
                pickCampaignRaw(planRawOverrides)
            );
            target.adgroup = mergeDeep(
                target.adgroup,
                goalForcedAdgroupOverride,
                planGoalAdgroupOverride,
                sceneForcedAdgroupOverride,
                commonAdgroupOverride,
                planAdgroupOverride,
                pickAdgroupRaw(requestRawOverrides),
                pickAdgroupRaw(commonRawOverrides),
                pickAdgroupRaw(planRawOverrides)
            );
        };

        const buildDefaultLaunchPeriodList = () => {
            const list = [];
            for (let day = 1; day <= 7; day++) {
                list.push({
                    dayOfWeek: String(day),
                    timeSpanList: [{ discount: 100, time: '00:00-24:00' }]
                });
            }
            return list;
        };

        const formatDateYmd = (date = new Date()) => {
            const d = date instanceof Date ? date : new Date();
            const pad = (n) => String(n).padStart(2, '0');
            return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
        };

        const buildDefaultLaunchTime = ({ days = 7, forever = false } = {}) => {
            const safeDays = Math.max(1, toNumber(days, 7));
            const start = new Date();
            const startTime = formatDateYmd(start);
            if (forever) {
                return {
                    startTime,
                    launchForever: true
                };
            }
            const end = new Date(start.getTime() + (safeDays - 1) * 24 * 60 * 60 * 1000);
            return {
                startTime,
                endTime: formatDateYmd(end),
                launchForever: false
            };
        };

        const normalizeSceneSettingValue = (text = '') => {
            const value = String(text || '').trim();
            if (!value) return '';
            if (/^(请选择|默认|无|不设置|未设置)$/i.test(value)) return '';
            return value;
        };

        const mapSceneBidTargetValue = (text = '') => {
            const value = normalizeSceneSettingValue(text);
            if (!value) return '';
            if (/^(conv|roi|click|fav_cart|market_penetration|similar_item|search_rank|display_shentou|display_roi|display_uv|display_pay|display_cart|display_click|detent|word_penetration_rate|coll_cart|ad_strategy_buy|ad_strategy_retained_buy)$/i.test(value)) return value;
            if (/增加净成交金额|净成交金额|ad_strategy[_\s-]*retained[_\s-]*buy/i.test(value)) return 'ad_strategy_retained_buy';
            if (/增加总成交金额|总成交金额|ad_strategy[_\s-]*buy/i.test(value)) return 'ad_strategy_buy';
            if (/获取成交量|display[_\s-]*pay/i.test(value)) return 'display_pay';
            if (/收藏加购量|display[_\s-]*cart/i.test(value)) return 'display_cart';
            if (/增加点击量|display[_\s-]*click/i.test(value)) return 'display_click';
            if (/稳定新客投产比|display[_\s-]*roi/i.test(value)) return 'display_roi';
            if (/扩大新客规模|新客规模|display[_\s-]*uv/i.test(value)) return 'display_uv';
            if (/新客收藏加购|display[_\s-]*cart/i.test(value)) return 'display_cart';
            if (/搜索卡位|抢占.*卡位|卡位|抢位|抢首|抢前|抢首页/i.test(value)) return 'search_rank';
            if (/市场渗透|词市场渗透|penetration|word[_\s-]*penetration/i.test(value)) return 'word_penetration_rate';
            if (/相似品/.test(value)) return 'similar_item';
            // 人群拉新语义必须先于通用“渗透”匹配，否则“拉新渗透”会被错误映射为 market_penetration。
            if (/拉新|拉新人群|拉新渗透|引力魔方|人群推广|display[_\s-]*shentou/i.test(value)) return 'display_shentou';
            if (/渗透|趋势|趋势明星/.test(value)) return 'market_penetration';
            if (/流量金卡/.test(value)) return 'click';
            if (/投产|ROI|投产比/i.test(value)) return 'roi';
            if (/点击/.test(value)) return 'click';
            if (/收藏|加购/.test(value)) return 'fav_cart';
            if (/渗透/.test(value)) return 'market_penetration';
            if (/成交|GMV|观看.*成交|净成交/i.test(value)) return 'conv';
            if (/自定义推广|线索|留资/.test(value)) return 'conv';
            return '';
        };

        const normalizeKeywordBidTargetCode = (bidTarget = '') => {
            const value = normalizeSceneSettingValue(bidTarget);
            if (!value) return '';
            const token = String(value).trim().toLowerCase();
            if (!token) return '';
            if (token === 'coll_cart' || token === 'display_cart') return 'fav_cart';
            if (token === 'display_click') return 'click';
            if (token === 'display_roi') return 'roi';
            if (token === 'display_pay' || token === 'ad_strategy_buy' || token === 'ad_strategy_retained_buy') {
                return 'conv';
            }
            if (token === 'word_penetration_rate') return 'market_penetration';
            return token;
        };

        const normalizeKeywordBidTargetOptionValue = (bidTarget = '') => {
            const value = normalizeKeywordBidTargetCode(bidTarget);
            if (!value) return '';
            if (value === 'coll_cart') return 'fav_cart';
            if (value === 'word_penetration_rate') return 'market_penetration';
            return value;
        };

        const resolveKeywordCustomBidTargetAlias = (bidTarget = '', marketingGoal = '') => {
            const value = String(bidTarget || '').trim();
            if (!value) return '';
            const goal = normalizeGoalLabel(marketingGoal);
            if (goal !== '自定义推广') return value;
            if (value === 'fav_cart') return 'coll_cart';
            if (value === 'market_penetration') return 'word_penetration_rate';
            return value;
        };

        const normalizeKeywordConvSubOptimizeTargetValue = (value = '', options = {}) => {
            const fallback = normalizeSceneSettingValue(options?.fallback || 'retained_buy') || 'retained_buy';
            const strict = options?.strict === true;
            const token = normalizeSceneSettingValue(value).toLowerCase();
            if (!token) return strict ? '' : fallback;
            if (token === 'retained_buy' || token === 'ad_strategy_retained_buy') return 'retained_buy';
            if (token === 'buy' || token === 'ad_strategy_buy') return 'buy';
            if (/净成交|retained|buy_net|net/.test(token)) return 'retained_buy';
            if (/成交量|总成交|buy/.test(token)) return 'buy';
            return strict ? '' : fallback;
        };

        const keywordConvSubOptimizeTargetCodeToLabel = (code = '') => {
            const value = normalizeSceneSettingValue(code).toLowerCase();
            if (value === 'buy' || value === 'ad_strategy_buy') return '获取成交量';
            return '获取净成交';
        };

        const crowdCustomBidTargetCodeToLabel = (code = '') => {
            const value = normalizeSceneSettingValue(code).toLowerCase();
            if (!value) return '获取成交量';
            if (value === 'display_click') return '增加点击量';
            if (value === 'display_cart') return '收藏加购量';
            return '获取成交量';
        };

        const crowdCustomSmartBidTargetCodeToLabel = (code = '') => {
            const value = normalizeSceneSettingValue(code).toLowerCase();
            if (!value) return CROWD_CUSTOM_SMART_BID_TARGET_LABEL_MAP.display_roi;
            return CROWD_CUSTOM_SMART_BID_TARGET_LABEL_MAP[value] || CROWD_CUSTOM_SMART_BID_TARGET_LABEL_MAP.display_roi;
        };

        const normalizeCrowdCustomBidTargetCode = (value = '', options = {}) => {
            const fallback = normalizeSceneSettingValue(options?.fallback || 'display_pay') || 'display_pay';
            const strict = options?.strict === true;
            const mapped = mapSceneBidTargetValue(value);
            const token = normalizeSceneSettingValue(mapped || value).toLowerCase();
            if (!token) return strict ? '' : fallback;
            if (token === 'display_pay' || token === 'conv' || token === 'ad_strategy_buy' || token === 'ad_strategy_retained_buy') {
                return 'display_pay';
            }
            if (token === 'display_cart' || token === 'fav_cart' || token === 'coll_cart') {
                return 'display_cart';
            }
            if (token === 'display_click' || token === 'click') {
                return 'display_click';
            }
            return strict ? '' : fallback;
        };

        const normalizeCrowdCustomSmartBidTargetCode = (value = '', options = {}) => {
            const fallback = normalizeSceneSettingValue(options?.fallback || 'display_roi') || 'display_roi';
            const strict = options?.strict === true;
            const mapped = mapSceneBidTargetValue(value);
            const token = normalizeSceneSettingValue(mapped || value).toLowerCase();
            if (!token) return strict ? '' : fallback;
            if (token === 'display_roi' || token === 'roi') return 'display_roi';
            if (token === 'display_pay' || token === 'conv' || token === 'ad_strategy_buy' || token === 'ad_strategy_retained_buy') {
                return 'display_pay';
            }
            if (token === 'display_cart' || token === 'fav_cart' || token === 'coll_cart') {
                return 'display_cart';
            }
            if (token === 'display_click' || token === 'click') {
                return 'display_click';
            }
            if (token === 'display_shentou' || token === 'market_penetration' || token === 'word_penetration_rate') {
                return 'display_shentou';
            }
            return strict ? '' : fallback;
        };

        const mapSiteMultiTargetOptimizeTargetValue = (text = '') => {
            const value = normalizeSceneSettingValue(text);
            if (!value) return '';
            if (/^\d{3,6}$/.test(value)) return value;
            if (/优化加购|收藏加购|加购/.test(value)) return '1034';
            if (/优化直接成交|增加净成交金额|净成交金额|直接成交/.test(value)) return '1230';
            if (/增加总成交金额|总成交金额/.test(value)) return '1231';
            return '';
        };

        const buildQuickLiftHourSlotValue = (text = '') => {
            const fullHours = Array.from({ length: 24 }, (_, idx) => String(idx)).join(',');
            const value = normalizeSceneSettingValue(text);
            if (!value) return fullHours;
            if (/长期|全天|24小时|不限/.test(value)) return fullHours;

            const rangeMatch = value.match(/(\d{1,2})\s*(?:点|时)?\s*(?:~|-|至|到)\s*(\d{1,2})/);
            if (rangeMatch) {
                const start = Math.max(0, Math.min(23, toNumber(rangeMatch[1], 0)));
                const endRaw = toNumber(rangeMatch[2], 24);
                const end = Math.max(start + 1, Math.min(24, endRaw));
                const list = [];
                for (let i = start; i < end; i += 1) list.push(String(i));
                if (list.length) return list.join(',');
            }

            const hours = Array.from(
                new Set(
                    (value.match(/\d{1,2}/g) || [])
                        .map(item => toNumber(item, NaN))
                        .filter(num => Number.isFinite(num) && num >= 0 && num <= 23)
                        .map(num => String(num))
                )
            );
            if (hours.length) return hours.join(',');
            return fullHours;
        };

        const mapSceneLaunchAreaList = (text = '') => {
            const value = normalizeSceneSettingValue(text);
            if (!value || /(全部|全国|不限|all)/i.test(value)) return ['all'];
            return value
                .split(/[,，\s、]+/)
                .map(item => normalizeSceneSettingValue(item))
                .filter(Boolean)
                .slice(0, 80);
        };

        const resolveKeywordGoalRuntimeFallback = (goalText = '') => {
            const normalizedGoal = normalizeGoalCandidateLabel(goalText);
            if (!normalizedGoal) return {};
            const matched = KEYWORD_GOAL_RUNTIME_FALLBACK_MAP.find(item => item.pattern.test(normalizedGoal));
            if (!matched) return {};
            const out = {};
            [
                'promotionScene',
                'itemSelectedMode',
                'bidType',
                'bidTypeV2',
                'bidTargetV2',
                'dmcType',
                'searchDetentType',
                'trendType',
                'orderChargeType'
            ].forEach(key => {
                const value = String(matched?.[key] || '').trim();
                if (value) out[key] = value;
            });
            if (out.bidTargetV2 && matched.omitOptimizeTarget !== true) {
                out.optimizeTarget = out.bidTargetV2;
            }
            return out;
        };

        const mapSceneBudgetTypeValue = (text = '') => {
            const value = normalizeSceneSettingValue(text);
            if (!value) return '';
            if (/^day_budget$/i.test(value)) return 'normal';
            if (/^(day_average|normal|total|day_freeze|unlimit)$/i.test(value)) return value;
            if (/不限预算/.test(value)) return 'unlimit';
            if (/日均预算/.test(value)) return 'day_average';
            if (/每日预算/.test(value)) return 'normal';
            if (/总预算/.test(value)) return 'total';
            if (/冻结|未来/.test(value)) return 'day_freeze';
            return '';
        };

        const mapSceneBidTypeValue = (text = '', sceneName = '') => {
            const value = normalizeSceneSettingValue(text);
            if (!value) return '';
            if (/^(smart_bid|manual_bid|custom_bid|bcb|mcb|max_amount|cost_control|roi_control)$/i.test(value)) {
                return value.toLowerCase() === 'manual_bid' ? 'custom_bid' : value.toLowerCase();
            }
            const normalizedScene = String(sceneName || '').trim();
            if (/智能出价/.test(value)) return 'smart_bid';
            if (/手动出价|手动/.test(value)) return 'custom_bid';
            if (/控投产比/.test(value)) return 'roi_control';
            if (/控成本/.test(value)) {
                if (normalizedScene === '内容营销') return 'mcb';
                return 'cost_control';
            }
            if (/最大化拿量/.test(value)) {
                if (normalizedScene === '内容营销') return 'bcb';
                return 'max_amount';
            }
            return '';
        };

        const normalizeBidTypeForCampaignField = (bidType = '', targetKey = '', sceneName = '') => {
            const source = String(bidType || '').trim().toLowerCase();
            const key = String(targetKey || '').trim();
            const normalizedScene = String(sceneName || '').trim();
            if (!source || !key) return '';
            if (key === 'bidTypeV2') {
                if (normalizedScene === '人群推广') {
                    if (/^(smart_bid|manual_bid|custom_bid|bcb|mcb|max_amount|cost_control|roi_control)$/i.test(source)) {
                        return 'custom_bid';
                    }
                }
                if (source === 'manual_bid') return 'custom_bid';
                if (source === 'smart_bid' || source === 'custom_bid') return source;
                return '';
            }
            if (key === 'bidType') {
                if (normalizedScene === '人群推广') return '';
                if (source === 'manual_bid' || source === 'custom_bid') {
                    if (normalizedScene === '内容营销') return 'mcb';
                    if (normalizedScene === '线索推广') return 'cost_control';
                    if (normalizedScene === '货品全站推广') return 'roi_control';
                    return 'custom_bid';
                }
                if (source === 'smart_bid') {
                    if (normalizedScene === '内容营销') return 'bcb';
                    if (normalizedScene === '线索推广') return 'max_amount';
                    if (normalizedScene === '货品全站推广') return 'roi_control';
                    return 'max_amount';
                }
                if (/^(bcb|mcb|max_amount|cost_control|roi_control|custom_bid)$/i.test(source)) return source;
            }
            return '';
        };

        const mapSceneItemSelectedModeValue = (text = '') => {
            const value = normalizeSceneSettingValue(text);
            if (!value) return '';
            if (/^(user_define|shop|search_detent|trend)$/i.test(value)) return value;
            if (/自定义|手动|指定商品/.test(value)) return 'user_define';
            if (/搜索卡位/.test(value)) return 'search_detent';
            if (/趋势/.test(value)) return 'trend';
            if (/店铺|全店|自动选品|推荐选品|行业推荐|好货快投/.test(value)) return 'shop';
            return '';
        };

        const mapSceneCreativeSetModeValue = (text = '') => {
            const value = normalizeSceneSettingValue(text);
            if (!value) return '';
            if (/^(minimalist|professional|smart)$/i.test(value)) return value;
            if (/极简|基础|默认/.test(value)) return 'minimalist';
            if (/专业|进阶/.test(value)) return 'professional';
            if (/智能|自动/.test(value)) return 'smart';
            return '';
        };
        const mapScenePromotionModelValue = (text = '') => {
            const value = normalizeSceneSettingValue(text);
            if (!value) {
                return {
                    promotionModel: '',
                    promotionModelMarketing: ''
                };
            }
            if (/^(order|daily)$/i.test(value)) {
                return {
                    promotionModel: value.toLowerCase(),
                    promotionModelMarketing: /order/i.test(value) ? 'strategy' : ''
                };
            }
            if (/多目标|多策略|起量|策略/.test(value)) {
                return {
                    promotionModel: 'order',
                    promotionModelMarketing: 'strategy'
                };
            }
            if (/日常|单目标|基础|普通/.test(value)) {
                return {
                    promotionModel: 'daily',
                    promotionModelMarketing: ''
                };
            }
            return {
                promotionModel: '',
                promotionModelMarketing: ''
            };
        };

        const mapScenePromotionStrategyValue = (sceneName = '', text = '', runtime = {}) => {
            const normalizedScene = String(sceneName || '').trim();
            const value = normalizeSceneSettingValue(text);
            if (!value) return '';
            if (normalizedScene !== '人群推广') {
                return '';
            }
            if (/^(jingdian_laxin|jihui_laxin|zidingyi_laxin|leimu_laxin)$/i.test(value)) {
                return value;
            }
            if (/竞店|经典/.test(value)) return 'jingdian_laxin';
            if (/机会/.test(value)) return 'jihui_laxin';
            if (/跨类目/.test(value)) return 'leimu_laxin';
            if (/自定义/.test(value)) return 'zidingyi_laxin';
            return normalizeSceneSettingValue(runtime?.storeData?.promotionStrategy || runtime?.solutionTemplate?.campaign?.promotionStrategy || '');
        };

        const mapSceneOrderChargeTypeValue = (text = '', runtime = {}) => {
            const value = normalizeSceneSettingValue(text);
            if (!value) return '';
            if (/^(click|cpc|conv|cpa|cps|show|cpm|balance_charge|pc_direct_charge|uni_budget_charge)$/i.test(value)) return value.toLowerCase();
            if (/点击|CPC/i.test(value)) return 'click';
            if (/成交|转化|CPA|CPS/i.test(value)) return 'conv';
            if (/展示|曝光|CPM/i.test(value)) return 'show';
            if (/预算通/.test(value)) return 'uni_budget_charge';
            if (/支付宝/.test(value)) return 'pc_direct_charge';
            if (/余额/.test(value)) return 'balance_charge';
            return normalizeSceneSettingValue(runtime?.storeData?.orderChargeType || runtime?.solutionTemplate?.campaign?.orderChargeType || '');
        };

        const resolveSceneTargetCode = ({ sceneName = '', sourceKey = '', sourceValue = '', runtime = {} } = {}) => {
            const normalizedScene = String(sceneName || '').trim();
            const normalizedSourceKey = normalizeText(sourceKey).replace(/[：:]/g, '').trim();
            const value = normalizeSceneSettingValue(sourceValue);
            if (!value) return '';
            const fromExplicitTargetField = /(出价目标|优化目标)/.test(normalizedSourceKey);
            const fromMarketingField = /营销目标/.test(normalizedSourceKey);
            const runtimeTarget = normalizeSceneSettingValue(
                runtime?.storeData?.optimizeTarget
                || runtime?.storeData?.bidTargetV2
                || runtime?.solutionTemplate?.campaign?.optimizeTarget
                || runtime?.solutionTemplate?.campaign?.bidTargetV2
                || ''
            );

            if (normalizedScene !== '关键词推广' && fromMarketingField && !fromExplicitTargetField) {
                // 非关键词场景的“营销目标”仅用于目标分流，不直接覆盖目标码字段。
                return '';
            }

            let code = mapSceneBidTargetValue(value);
            if (normalizedScene === '人群推广') {
                const crowdCustomTargetFromValue = normalizeCrowdCustomBidTargetCode(value, {
                    strict: true,
                    fallback: ''
                });
                if (crowdCustomTargetFromValue) {
                    return crowdCustomTargetFromValue;
                }
                const crowdCustomTargetFromRuntime = normalizeCrowdCustomBidTargetCode(runtimeTarget, {
                    strict: true,
                    fallback: ''
                });
                if (!code || code === DEFAULTS.bidTargetV2 || code === 'market_penetration') {
                    if (crowdCustomTargetFromRuntime) {
                        return crowdCustomTargetFromRuntime;
                    }
                    code = runtimeTarget;
                }
                return code || runtimeTarget;
            }
            if (normalizedScene === '关键词推广') {
                const keywordTargetCode = normalizeKeywordBidTargetCode(code || value);
                return keywordTargetCode || runtimeTarget;
            }

            if (!code) return runtimeTarget;
            if (normalizedScene !== '关键词推广' && code === DEFAULTS.bidTargetV2 && runtimeTarget) {
                return runtimeTarget;
            }
            return code;
        };

        const parseNumberFromSceneValue = (text = '') => {
            const raw = String(text || '').replace(/,/g, '').trim();
            if (!raw) return NaN;
            const matched = raw.match(/-?\d+(?:\.\d+)?/);
            if (!matched || !matched[0]) return NaN;
            const value = Number(matched[0]);
            return Number.isFinite(value) ? value : NaN;
        };

        const normalizeSceneSettingEntries = (sceneSettings = {}) => {
            if (!isPlainObject(sceneSettings)) return [];
            return Object.keys(sceneSettings).map(key => ({
                key: String(key || '').trim(),
                value: normalizeSceneSettingValue(sceneSettings[key])
            })).filter(item => item.key && item.value);
        };

        const findSceneSettingEntry = (entries = [], patterns = []) => {
            if (!Array.isArray(entries) || !entries.length) return null;
            if (!Array.isArray(patterns) || !patterns.length) return null;
            for (const pattern of patterns) {
                const found = entries.find(item => pattern.test(item.key));
                if (found) return found;
            }
            return null;
        };

        const resolveSceneSettingOverrides = ({ sceneName = '', sceneSettings = {}, runtime = {} }) => {
            const entries = normalizeSceneSettingEntries(sceneSettings);
            const mapping = {
                sceneName: String(sceneName || '').trim(),
                applied: [],
                skipped: [],
                campaignOverride: {},
                adgroupOverride: {}
            };
            if (!entries.length) return mapping;

            const normalizedSceneName = String(sceneName || '').trim();
            const templateCampaign = runtime?.solutionTemplate?.campaign || {};
            const templateAdgroup = runtime?.solutionTemplate?.adgroupList?.[0] || {};
            const allowedCampaignKeys = new Set(Object.keys(templateCampaign || {}));
            [
                'campaignName',
                'dmcType',
                'bidType',
                'bidTargetV2',
                'optimizeTarget',
                'constraintType',
                'constraintValue',
                'smartCreative',
                'creativeSetMode',
                'itemSelectedMode',
                'promotionModel',
                'promotionModelMarketing',
                'multiTarget',
                'isMultiTarget',
                'quickLiftBudgetCommand',
                'isQuickLift',
                'dmcTypeElement',
                'launchPeriodList',
                'launchAreaStrList',
                'promotionStrategy',
                'needTargetCrowd',
                'aiXiaowanCrowdListSwitch',
                'user_level',
                'orderChargeType',
                'subOptimizeTarget',
                'searchDetentType',
                'trendType',
                'trendThemeList',
                'packageId',
                'packageTemplateId',
                'planId',
                'planTemplateId',
                'orderInfo',
                'orderAutoRenewalInfo',
                'launchTime',
                'aiMaxSwitch',
                'aiMaxInfo',
                'dayBudget',
                'dayAverageBudget',
                'totalBudget',
                'futureBudget',
                'sourceChannel',
                'channelLocation',
                'selectedTargetBizCode',
                'dmpSolutionId',
                'activityId',
                'specialSourceForMainStep',
                'bpStrategyId',
                'bpStrategyType',
                'supportCouponId'
            ]
                .forEach(key => allowedCampaignKeys.add(key));
            allowedCampaignKeys.add('campaignColdStartVO');
            allowedCampaignKeys.add('crowdList');
            allowedCampaignKeys.add('adzoneList');
            if (SCENE_BIDTYPE_V2_ONLY.has(normalizedSceneName) || hasOwn(templateCampaign, 'bidTypeV2')) {
                allowedCampaignKeys.add('bidTypeV2');
            }
            const allowedAdgroupKeys = new Set(Object.keys(templateAdgroup || {}));
            ['rightList', 'smartCreative', 'material', 'wordList', 'wordPackageList']
                .forEach(key => allowedAdgroupKeys.add(key));

            const setValueByPath = (target, path, value) => {
                const normalizedPath = String(path || '').trim();
                if (!normalizedPath) return;
                const segments = normalizedPath.split('.').map(item => String(item || '').trim()).filter(Boolean);
                if (!segments.length) return;
                let cursor = target;
                for (let i = 0; i < segments.length - 1; i++) {
                    const segment = segments[i];
                    if (!isPlainObject(cursor[segment])) {
                        cursor[segment] = {};
                    }
                    cursor = cursor[segment];
                }
                cursor[segments[segments.length - 1]] = deepClone(value);
            };
            const canUseCampaignField = (key = '', sourceKey = '') => {
                const normalizedKey = String(key || '').trim();
                if (!normalizedKey) return false;
                if (allowedCampaignKeys.has(normalizedKey)) return true;
                const root = normalizedKey.split('.')[0];
                if (allowedCampaignKeys.has(root)) return true;
                if (/^campaign\./i.test(String(sourceKey || '').trim())) return true;
                return false;
            };
            const canUseAdgroupField = (key = '', sourceKey = '') => {
                const normalizedKey = String(key || '').trim();
                if (!normalizedKey) return false;
                if (allowedAdgroupKeys.has(normalizedKey)) return true;
                const root = normalizedKey.split('.')[0];
                if (allowedAdgroupKeys.has(root)) return true;
                if (/^adgroup\./i.test(String(sourceKey || '').trim())) return true;
                return false;
            };

            const applyCampaign = (key, value, sourceKey = '', sourceValue = '') => {
                if (value === undefined || value === null || value === '') return;
                if (!canUseCampaignField(key, sourceKey)) {
                    mapping.skipped.push({
                        sourceKey,
                        sourceValue,
                        targetKey: key,
                        reason: 'campaign字段不在当前模板中'
                    });
                    return;
                }
                setValueByPath(mapping.campaignOverride, key, value);
                mapping.applied.push({
                    sourceKey,
                    sourceValue,
                    targetKey: key,
                    targetValue: deepClone(value)
                });
            };

            const applyAdgroup = (key, value, sourceKey = '', sourceValue = '') => {
                if (value === undefined || value === null || value === '') return;
                if (!canUseAdgroupField(key, sourceKey)) {
                    mapping.skipped.push({
                        sourceKey,
                        sourceValue,
                        targetKey: `adgroup.${key}`,
                        reason: 'adgroup字段不在当前模板中'
                    });
                    return;
                }
                setValueByPath(mapping.adgroupOverride, key, value);
                mapping.applied.push({
                    sourceKey,
                    sourceValue,
                    targetKey: `adgroup.${key}`,
                    targetValue: deepClone(value)
                });
            };

            const parseDirectSettingValue = (key = '', rawValue = '') => {
                const value = normalizeSceneSettingValue(rawValue);
                if (!value) return '';
                if ((value.startsWith('{') && value.endsWith('}')) || (value.startsWith('[') && value.endsWith(']'))) {
                    try {
                        return JSON.parse(value);
                    } catch { }
                }
                if (/^(true|false)$/i.test(value)) return /^true$/i.test(value);
                if (/List$/i.test(key) && /[,，]/.test(value)) {
                    return value
                        .split(/[,，]/)
                        .map(item => normalizeSceneSettingValue(item))
                        .filter(Boolean);
                }
                const numeric = parseNumberFromSceneValue(value);
                if (Number.isFinite(numeric) && /(?:budget|cost|price|rate|switch|smartcreative|discount|singlecost|constraintvalue)$/i.test(key)) {
                    return numeric;
                }
                return value;
            };

            const targetPatterns = normalizedSceneName === '关键词推广'
                ? [/出价目标/, /优化目标/, /营销目标/]
                : [/出价目标/, /优化目标/];
            const targetEntry = findSceneSettingEntry(entries, targetPatterns);
            const targetConstraintEntry = findSceneSettingEntry(entries, [
                /目标投产比/,
                /净目标投产比/,
                /7日投产比/,
                /ROI目标值/i,
                /出价目标值/,
                /约束值/,
                /目标值/
            ]);
            const keywordGoalEntry = normalizedSceneName === '关键词推广'
                ? findSceneSettingEntry(entries, [/营销目标/, /选择卡位方案/])
                : null;
            const keywordGoalRuntime = normalizedSceneName === '关键词推广'
                ? resolveKeywordGoalRuntimeFallback(keywordGoalEntry?.value || '')
                : {};
            const rawTargetCode = resolveSceneTargetCode({
                sceneName: normalizedSceneName,
                sourceKey: targetEntry?.key || '',
                sourceValue: targetEntry?.value || '',
                runtime
            });
            const keywordRoiTarget = normalizedSceneName === '关键词推广'
                && String(rawTargetCode || '').trim().toLowerCase() === 'roi';
            const targetCode = rawTargetCode;
            if (normalizedSceneName === '关键词推广') {
                if (keywordGoalEntry && keywordGoalRuntime.promotionScene) {
                    applyCampaign('promotionScene', keywordGoalRuntime.promotionScene, keywordGoalEntry.key, keywordGoalEntry.value);
                }
                if (keywordGoalEntry && keywordGoalRuntime.itemSelectedMode) {
                    applyCampaign('itemSelectedMode', keywordGoalRuntime.itemSelectedMode, keywordGoalEntry.key, keywordGoalEntry.value);
                }
            }
            const supportsBidTargetFields = normalizedSceneName === '关键词推广'
                || normalizedSceneName === '人群推广'
                || normalizedSceneName === '货品全站推广'
                || hasOwn(templateCampaign, 'bidTargetV2')
                || hasOwn(templateCampaign, 'optimizeTarget');
            if (targetEntry && targetCode && supportsBidTargetFields) {
                applyCampaign('bidTargetV2', targetCode, targetEntry.key, targetEntry.value);
                applyCampaign('optimizeTarget', targetCode, targetEntry.key, targetEntry.value);
            } else if (targetEntry && targetCode && !supportsBidTargetFields) {
                mapping.skipped.push({
                    sourceKey: targetEntry.key,
                    sourceValue: targetEntry.value,
                    targetKey: 'bidTargetV2/optimizeTarget',
                    reason: '当前场景未识别到可用目标字段'
                });
            }
            const keywordSubOptimizeTargetEntry = normalizedSceneName === '关键词推广'
                ? findSceneSettingEntry(entries, [/成交口径/, /净成交口径/])
                : null;
            if (keywordSubOptimizeTargetEntry) {
                const keywordTargetToken = normalizeSceneSettingValue(
                    targetCode
                    || mapSceneBidTargetValue(targetEntry?.value || '')
                ).toLowerCase();
                const isKeywordConvTarget = keywordTargetToken === 'conv'
                    || keywordTargetToken === 'display_pay'
                    || keywordTargetToken === 'ad_strategy_buy'
                    || keywordTargetToken === 'ad_strategy_retained_buy';
                if (isKeywordConvTarget) {
                    const keywordSubOptimizeTargetCode = normalizeKeywordConvSubOptimizeTargetValue(
                        keywordSubOptimizeTargetEntry.value || '',
                        {
                            fallback: runtime?.storeData?.subOptimizeTarget
                                || runtime?.solutionTemplate?.campaign?.subOptimizeTarget
                                || 'retained_buy'
                        }
                    );
                    if (keywordSubOptimizeTargetCode) {
                        applyCampaign(
                            'subOptimizeTarget',
                            keywordSubOptimizeTargetCode,
                            keywordSubOptimizeTargetEntry.key,
                            keywordSubOptimizeTargetEntry.value
                        );
                    }
                }
            }

            const budgetTypeEntry = findSceneSettingEntry(entries, [/预算类型/]);
            const budgetTypeCode = mapSceneBudgetTypeValue(budgetTypeEntry?.value || '');
            if (budgetTypeEntry && budgetTypeCode) {
                applyCampaign('dmcType', budgetTypeCode, budgetTypeEntry.key, budgetTypeEntry.value);
            }

            const orderChargeTypeEntry = findSceneSettingEntry(entries, [/扣费方式/, /计费方式/, /收费方式/, /支付方式/]);
            const orderChargeTypeCode = mapSceneOrderChargeTypeValue(orderChargeTypeEntry?.value || '', runtime);
            if (orderChargeTypeEntry && orderChargeTypeCode) {
                applyCampaign('orderChargeType', orderChargeTypeCode, orderChargeTypeEntry.key, orderChargeTypeEntry.value);
            }

            const bidTypeEntry = findSceneSettingEntry(entries, [/出价方式/]);
            const bidTypeCode = mapSceneBidTypeValue(bidTypeEntry?.value || '', normalizedSceneName);
            if (bidTypeEntry && bidTypeCode) {
                const targetKeys = [];
                if (SCENE_BIDTYPE_V2_ONLY.has(normalizedSceneName) || hasOwn(templateCampaign, 'bidTypeV2')) {
                    targetKeys.push('bidTypeV2');
                }
                if (
                    hasOwn(templateCampaign, 'bidType')
                    || ['货品全站推广', '内容营销', '线索推广'].includes(normalizedSceneName)
                ) {
                    targetKeys.push('bidType');
                }
                uniqueBy(targetKeys, key => key).forEach(targetKey => {
                    const mappedCode = normalizeBidTypeForCampaignField(bidTypeCode, targetKey, normalizedSceneName);
                    if (!mappedCode) return;
                    applyCampaign(targetKey, mappedCode, bidTypeEntry.key, bidTypeEntry.value);
                });
            }
            if (bidTypeEntry && bidTypeCode && !hasOwn(mapping.campaignOverride, 'bidTypeV2') && !hasOwn(mapping.campaignOverride, 'bidType')) {
                mapping.skipped.push({
                    sourceKey: bidTypeEntry.key,
                    sourceValue: bidTypeEntry.value,
                    targetKey: 'bidTypeV2/bidType',
                    reason: '当前场景未识别到可用出价类型字段'
                });
            }
            const targetConstraintValue = parseNumberFromSceneValue(targetConstraintEntry?.value || '');
            if (targetConstraintEntry && Number.isFinite(targetConstraintValue) && targetConstraintValue > 0) {
                applyCampaign('constraintValue', targetConstraintValue, targetConstraintEntry.key, targetConstraintEntry.value);
                const constraintTypeHint = [
                    normalizedSceneName,
                    targetEntry?.key || '',
                    targetEntry?.value || '',
                    bidTypeEntry?.value || '',
                    bidTypeCode || '',
                    targetConstraintEntry?.key || ''
                ].join(' ');
                let constraintTypeCode = '';
                if (keywordRoiTarget && /投产比|ROI/i.test(constraintTypeHint)) {
                    // 关键词「稳定投产比」对齐原生创建口：roi 约束。
                    constraintTypeCode = 'roi';
                } else if (/roi_control/i.test(String(bidTypeCode || ''))) {
                    constraintTypeCode = 'roi';
                } else if (/控成本|成本|cpa/i.test(constraintTypeHint)) {
                    constraintTypeCode = 'cost';
                } else if (/投产比|ROI/i.test(constraintTypeHint) || normalizedSceneName === '货品全站推广') {
                    constraintTypeCode = 'roi';
                }
                if (constraintTypeCode) {
                    applyCampaign('constraintType', constraintTypeCode, targetConstraintEntry.key, targetConstraintEntry.value);
                }
            }
            if (keywordRoiTarget) {
                const runtimeConstraintValue = parseNumberFromSceneValue(
                    runtime?.storeData?.constraintValue
                    || runtime?.solutionTemplate?.campaign?.constraintValue
                    || ''
                );
                const roiConstraintValue = Number.isFinite(targetConstraintValue) && targetConstraintValue > 0
                    ? targetConstraintValue
                    : runtimeConstraintValue;
                const targetSourceKey = targetConstraintEntry?.key || targetEntry?.key || '出价目标';
                const targetSourceValue = targetConstraintEntry?.value || targetEntry?.value || '稳定投产比';
                applyCampaign('constraintType', 'roi', targetSourceKey, targetSourceValue);
                if (Number.isFinite(roiConstraintValue) && roiConstraintValue > 0) {
                    applyCampaign('constraintValue', roiConstraintValue, targetSourceKey, targetSourceValue);
                }
            }

            const itemModeEntry = findSceneSettingEntry(entries, [/选品方式/, /选择推广商品/]);
            const itemModeCode = mapSceneItemSelectedModeValue(itemModeEntry?.value || '');
            if (itemModeEntry && itemModeCode) {
                applyCampaign('itemSelectedMode', itemModeCode, itemModeEntry.key, itemModeEntry.value);
            }
            const promotionSceneEntry = findSceneSettingEntry(entries, [/营销场景/]);
            if (promotionSceneEntry) {
                const explicitCode = normalizeSceneSettingValue(promotionSceneEntry.value || '');
                const promotionSceneCode = /^promotion_scene_[a-z0-9_]+$/i.test(explicitCode)
                    ? explicitCode
                    : resolveSceneDefaultPromotionScene(
                        normalizedSceneName,
                        runtime?.storeData?.promotionScene || runtime?.promotionScene || DEFAULTS.promotionScene
                    );
                if (promotionSceneCode) {
                    applyCampaign('promotionScene', promotionSceneCode, promotionSceneEntry.key, promotionSceneEntry.value);
                }
            }
            const promotionModelEntry = findSceneSettingEntry(entries, [/投放调优/, /优化模式/, /多目标优化/]);
            const promotionModelValue = mapScenePromotionModelValue(promotionModelEntry?.value || '');
            if (promotionModelEntry && promotionModelValue.promotionModel) {
                applyCampaign('promotionModel', promotionModelValue.promotionModel, promotionModelEntry.key, promotionModelEntry.value);
                if (promotionModelValue.promotionModelMarketing) {
                    applyCampaign('promotionModelMarketing', promotionModelValue.promotionModelMarketing, promotionModelEntry.key, promotionModelEntry.value);
                }
            }
            const campaignGroupEntry = findSceneSettingEntry(entries, [/计划组/, /设置计划组/]);
            if (campaignGroupEntry) {
                const campaignGroupValue = normalizeSceneSettingValue(campaignGroupEntry.value || '');
                if (campaignGroupValue && !/^(不设置计划组|不设置|默认|无|none|null)$/i.test(campaignGroupValue)) {
                    if (/^\d{1,20}$/.test(campaignGroupValue)) {
                        applyCampaign('campaignGroupId', campaignGroupValue, campaignGroupEntry.key, campaignGroupEntry.value);
                    } else {
                        applyCampaign('campaignGroupName', campaignGroupValue, campaignGroupEntry.key, campaignGroupEntry.value);
                    }
                }
            }

            const budgetEntries = [
                { patterns: [/每日预算(?!类型)/], field: 'dayBudget' },
                { patterns: [/日均预算/], field: 'dayAverageBudget' },
                { patterns: [/总预算/], field: 'totalBudget' },
                { patterns: [/冻结预算/, /未来预算/], field: 'futureBudget' }
            ];
            budgetEntries.forEach(item => {
                const entry = findSceneSettingEntry(entries, item.patterns);
                const amount = parseNumberFromSceneValue(entry?.value || '');
                if (entry && Number.isFinite(amount) && amount > 0) {
                    applyCampaign(item.field, amount, entry.key, entry.value);
                }
            });
            const genericBudgetEntry = findSceneSettingEntry(entries, [/预算值/]);
            const genericBudgetAmount = parseNumberFromSceneValue(genericBudgetEntry?.value || '');
            if (genericBudgetEntry && Number.isFinite(genericBudgetAmount) && genericBudgetAmount > 0) {
                const dmcHint = String(
                    mapping?.campaignOverride?.dmcType
                    || templateCampaign?.dmcType
                    || runtime?.dmcType
                    || DEFAULTS.dmcType
                    || 'day_average'
                ).trim();
                const budgetField = DMC_BUDGET_FIELD_MAP[dmcHint] || 'dayAverageBudget';
                applyCampaign(budgetField, genericBudgetAmount, genericBudgetEntry.key, genericBudgetEntry.value);
            }

            const resolveKeywordSingleCostPatternsByTarget = (target = '', type = 'amount') => {
                const keywordTargetCode = normalizeKeywordBidTargetCode(
                    mapSceneBidTargetValue(target) || target
                ) || 'conv';
                const switchPatternMap = {
                    conv: [/设置平均成交成本/, /控成本投放/],
                    fav_cart: [/设置平均收藏加购成本/, /控成本投放/],
                    click: [/设置平均点击成本/, /控成本投放/]
                };
                const valuePatternMap = {
                    conv: [/平均直接成交成本/, /平均成交成本/, /直接成交成本/, /单次成交成本/, /目标成交成本/, /目标成本/],
                    fav_cart: [/平均收藏加购成本/, /收藏加购成本/, /目标成本/],
                    click: [/平均点击成本/, /点击成本/, /目标成本/]
                };
                if (type === 'switch') {
                    return switchPatternMap[keywordTargetCode] || [/控成本投放/];
                }
                return valuePatternMap[keywordTargetCode] || [
                    /平均直接成交成本/,
                    /平均成交成本/,
                    /平均收藏加购成本/,
                    /平均点击成本/,
                    /直接成交成本/,
                    /单次成交成本/,
                    /目标成交成本/,
                    /点击成本/,
                    /目标成本/
                ];
            };
            const applySceneSingleCostEntries = (singleCostSwitchEntry, singleCostEntry) => {
                const singleCostSwitchOff = singleCostSwitchEntry
                    && /(关|关闭|不启用|禁用|否|off|false|0)/i.test(singleCostSwitchEntry.value || '')
                    && !/(开|开启|启用|是|on|true|1)/i.test(singleCostSwitchEntry.value || '');
                if (singleCostSwitchOff) {
                    applyCampaign('setSingleCostV2', false, singleCostSwitchEntry.key, singleCostSwitchEntry.value);
                }
                if (singleCostEntry) {
                    const singleCostAmount = parseNumberFromSceneValue(singleCostEntry.value || '');
                    if (Number.isFinite(singleCostAmount) && singleCostAmount > 0 && !singleCostSwitchOff) {
                        applyCampaign('setSingleCostV2', true, singleCostEntry.key, singleCostEntry.value);
                        applyCampaign('singleCostV2', singleCostAmount, singleCostEntry.key, singleCostEntry.value);
                    } else if (/关|关闭|不启用/.test(singleCostEntry.value || '')) {
                        applyCampaign('setSingleCostV2', false, singleCostEntry.key, singleCostEntry.value);
                    }
                }
            };
            if (normalizedSceneName === '关键词推广') {
                const keywordSingleCostTargetCode = normalizeKeywordBidTargetCode(
                    mapSceneBidTargetValue(targetCode) || targetCode
                ) || 'conv';
                const singleCostSwitchEntry = findSceneSettingEntry(
                    entries,
                    resolveKeywordSingleCostPatternsByTarget(keywordSingleCostTargetCode, 'switch')
                );
                const singleCostEntry = findSceneSettingEntry(
                    entries,
                    resolveKeywordSingleCostPatternsByTarget(keywordSingleCostTargetCode, 'amount')
                );
                applySceneSingleCostEntries(singleCostSwitchEntry, singleCostEntry);
            } else {
                const singleCostSwitchEntry = findSceneSettingEntry(entries, [
                    /设置平均成交成本/,
                    /设置平均收藏加购成本/,
                    /设置平均点击成本/,
                    /控成本投放/
                ]);
                const singleCostEntry = findSceneSettingEntry(entries, [
                    /平均直接成交成本/,
                    /平均成交成本/,
                    /平均收藏加购成本/,
                    /平均点击成本/,
                    /直接成交成本/,
                    /单次成交成本/,
                    /目标成交成本/,
                    /点击成本/,
                    /目标成本/
                ]);
                applySceneSingleCostEntries(singleCostSwitchEntry, singleCostEntry);
            }

            const smartCreativeEntry = findSceneSettingEntry(entries, [/创意优选/, /封面智能创意/]);
            if (smartCreativeEntry) {
                if (/关/.test(smartCreativeEntry.value) && !/开/.test(smartCreativeEntry.value)) {
                    applyCampaign('smartCreative', 0, smartCreativeEntry.key, smartCreativeEntry.value);
                } else if (/开/.test(smartCreativeEntry.value)) {
                    applyCampaign('smartCreative', 1, smartCreativeEntry.key, smartCreativeEntry.value);
                }
            }

            const creativeModeEntry = findSceneSettingEntry(entries, [/创意设置/, /设置创意/, /创意模式/]);
            const creativeModeCode = mapSceneCreativeSetModeValue(creativeModeEntry?.value || '');
            if (creativeModeEntry && creativeModeCode) {
                applyCampaign('creativeSetMode', creativeModeCode, creativeModeEntry.key, creativeModeEntry.value);
            }

            const coldStartEntry = findSceneSettingEntry(entries, [/开启冷启加速/, /冷启加速/]);
            if (coldStartEntry) {
                const coldStartText = normalizeSceneSettingValue(coldStartEntry.value || '');
                if (coldStartText) {
                    const isColdStartOff = /(关|关闭|不启用|禁用|否|off|false|0)/i.test(coldStartText)
                        && !/(开|开启|启用|是|on|true|1)/i.test(coldStartText);
                    applyCampaign(
                        'campaignColdStartVO.coldStartStatus',
                        isColdStartOff ? '0' : '1',
                        coldStartEntry.key,
                        coldStartEntry.value
                    );
                }
            }

            if (normalizedSceneName === '关键词推广') {
                const keywordContractType = resolveKeywordCampaignContractType({
                    campaign: mergeDeep({}, mapping.campaignOverride, keywordGoalRuntime),
                    goalText: keywordGoalEntry?.value || ''
                });
                if (keywordContractType === 'search_detent') {
                    const detentTypeEntry = findSceneSettingEntry(entries, [/卡位方式/]);
                    const detentTypeCode = mapKeywordSearchDetentTypeValue(detentTypeEntry?.value || '');
                    if (detentTypeEntry && detentTypeCode) {
                        applyCampaign('searchDetentType', detentTypeCode, detentTypeEntry.key, detentTypeEntry.value);
                    }
                    applyCampaign('bidType', 'max_amount', detentTypeEntry?.key || keywordGoalEntry?.key || '营销目标', detentTypeEntry?.value || keywordGoalEntry?.value || '搜索卡位');
                    applyCampaign('dmcType', 'day_average', detentTypeEntry?.key || keywordGoalEntry?.key || '营销目标', detentTypeEntry?.value || keywordGoalEntry?.value || '搜索卡位');
                }
                if (keywordContractType === 'golden_traffic_card') {
                    const renewalEntry = findSceneSettingEntry(entries, [/套餐包自动续投/, /自动续投/]);
                    if (renewalEntry) {
                        const renewalText = normalizeSceneSettingValue(renewalEntry.value || '');
                        const renewalOff = /(关|关闭|不启用|禁用|否|off|false|0)/i.test(renewalText)
                            && !/(开|开启|启用|是|on|true|1)/i.test(renewalText);
                        applyCampaign(
                            'orderAutoRenewalInfo',
                            {
                                orderAutoRenewalSwitch: renewalOff ? '0' : '1',
                                orderAutoRenewalCondition: ''
                            },
                            renewalEntry.key,
                            renewalEntry.value
                        );
                    }
                }
            }

            const launchTimeEntry = findSceneSettingEntry(entries, [/投放时间/, /投放日期/, /分时折扣/, /发布日期/, /排期/]);
            if (launchTimeEntry && /(不限|长期|全天|24小时)/.test(launchTimeEntry.value)) {
                applyCampaign('launchPeriodList', buildDefaultLaunchPeriodList(), launchTimeEntry.key, launchTimeEntry.value);
            }

            const launchAreaEntry = findSceneSettingEntry(entries, [/投放地域/, /地域设置/, /起量时间地域设置/, /投放时间地域设置/]);
            if (launchAreaEntry) {
                const list = mapSceneLaunchAreaList(launchAreaEntry.value || '');
                if (list.length) {
                    applyCampaign('launchAreaStrList', list, launchAreaEntry.key, launchAreaEntry.value);
                }
            }

            if (normalizedSceneName === '货品全站推广') {
                const multiTargetEnabled = promotionModelEntry
                    ? !/日常|关闭|不启用|关/.test(normalizeSceneSettingValue(promotionModelEntry.value || ''))
                    : false;
                if (promotionModelEntry) {
                    applyCampaign('multiTarget.multiTargetSwitch', multiTargetEnabled ? '1' : '0', promotionModelEntry.key, promotionModelEntry.value);
                }
                applyCampaign('isMultiTarget', multiTargetEnabled, promotionModelEntry?.key || '投放调优', promotionModelEntry?.value || '');

                const siteOptimizeTargetEntry = findSceneSettingEntry(entries, [/优化目标/]);
                const siteOptimizeBudgetEntry = findSceneSettingEntry(entries, [/多目标预算/]);
                if (multiTargetEnabled) {
                    const optimizeCode = mapSiteMultiTargetOptimizeTargetValue(siteOptimizeTargetEntry?.value || '');
                    const optimizeBudgetRaw = normalizeSceneSettingValue(siteOptimizeBudgetEntry?.value || '');
                    const optimizeBudgetNum = parseNumberFromSceneValue(optimizeBudgetRaw);
                    const configItem = {};
                    if (optimizeCode) configItem.optimizeTarget = optimizeCode;
                    if (Number.isFinite(optimizeBudgetNum) && optimizeBudgetNum > 0) {
                        configItem.multiTargetBudget = String(optimizeBudgetNum);
                    } else if (optimizeBudgetRaw) {
                        configItem.multiTargetBudget = optimizeBudgetRaw;
                    }
                    if (Object.keys(configItem).length) {
                        applyCampaign(
                            'multiTarget.multiTargetConfigList',
                            [configItem],
                            siteOptimizeTargetEntry?.key || siteOptimizeBudgetEntry?.key || '优化目标',
                            siteOptimizeTargetEntry?.value || siteOptimizeBudgetEntry?.value || ''
                        );
                    }
                } else {
                    applyCampaign('multiTarget.multiTargetConfigList', [], promotionModelEntry?.key || '投放调优', promotionModelEntry?.value || '');
                }

                const launchTimeValue = normalizeSceneSettingValue(launchTimeEntry?.value || '');
                const quickLiftEnabled = !!launchTimeValue && !/固定时段|关闭|不启用|关/.test(launchTimeValue);
                if (launchTimeEntry) {
                    applyCampaign('quickLiftBudgetCommand.quickLiftSwitch', quickLiftEnabled ? 'true' : 'false', launchTimeEntry.key, launchTimeEntry.value);
                }

                const quickLiftBudgetEntry = findSceneSettingEntry(entries, [/一键起量预算/]);
                const quickLiftBudgetRaw = normalizeSceneSettingValue(quickLiftBudgetEntry?.value || '');
                const quickLiftBudgetNum = parseNumberFromSceneValue(quickLiftBudgetRaw);
                if (quickLiftEnabled) {
                    if (Number.isFinite(quickLiftBudgetNum) && quickLiftBudgetNum > 0) {
                        applyCampaign('quickLiftBudgetCommand.quickLiftBudget', String(quickLiftBudgetNum), quickLiftBudgetEntry?.key || '一键起量预算', quickLiftBudgetRaw);
                    } else if (quickLiftBudgetRaw) {
                        applyCampaign('quickLiftBudgetCommand.quickLiftBudget', quickLiftBudgetRaw, quickLiftBudgetEntry?.key || '一键起量预算', quickLiftBudgetRaw);
                    }
                    applyCampaign(
                        'quickLiftBudgetCommand.quickLiftTimeSlot',
                        buildQuickLiftHourSlotValue(launchTimeValue),
                        launchTimeEntry?.key || '投放时间',
                        launchTimeValue
                    );
                    const quickLiftAreaList = mapSceneLaunchAreaList(launchAreaEntry?.value || '');
                    if (quickLiftAreaList.length) {
                        applyCampaign(
                            'quickLiftBudgetCommand.quickLiftLaunchArea',
                            quickLiftAreaList,
                            launchAreaEntry?.key || '投放地域',
                            launchAreaEntry?.value || ''
                        );
                    }
                    applyCampaign(
                        'dmcTypeElement',
                        'quickLiftBudgetCommand.quickLiftBudget',
                        quickLiftBudgetEntry?.key || launchTimeEntry?.key || '一键起量预算',
                        quickLiftBudgetRaw || launchTimeValue
                    );
                } else if (multiTargetEnabled) {
                    applyCampaign(
                        'dmcTypeElement',
                        'multiTarget.multiTargetConfigList',
                        siteOptimizeBudgetEntry?.key || siteOptimizeTargetEntry?.key || '多目标预算',
                        siteOptimizeBudgetEntry?.value || siteOptimizeTargetEntry?.value || ''
                    );
                }
            }

            const crowdPriorityEntry = findSceneSettingEntry(entries, [/设置拉新人群/, /人群设置/, /种子人群/, /选择方式/]);
            if (crowdPriorityEntry) {
                const crowdPriorityValue = normalizeSceneSettingValue(crowdPriorityEntry.value || '');
                const crowdOpenHint = /(开|开启|启用|是|on|true|1)/i.test(crowdPriorityValue);
                const crowdCloseHint = /(关|关闭|不启用|禁用|否|off|false|0)/i.test(crowdPriorityValue);
                // “添加精选人群”属于手动选人模式：关键词推广与人群推广都应关闭 AI 推人开关。
                const preferManualCrowdMode = normalizedSceneName === '人群推广'
                    || normalizedSceneName === '关键词推广';
                const isAIPushCrowd = /(AI推人|智能推人|设置优先投放客户|优先投放客户|优先)/.test(crowdPriorityValue);
                const isManualCustomCrowd = /(手动添加人群|自定义人群)/.test(crowdPriorityValue);
                const isSelectedCrowd = /(添加精选人群|精选人群)/.test(crowdPriorityValue);
                const isSeedCrowd = /(智能人群|添加种子人群|种子人群|智能|种子)/.test(crowdPriorityValue);
                if (isAIPushCrowd || (crowdOpenHint && !isManualCustomCrowd && !isSeedCrowd)) {
                    applyCampaign('needTargetCrowd', '1', crowdPriorityEntry.key, crowdPriorityEntry.value);
                    applyCampaign('aiXiaowanCrowdListSwitch', '1', crowdPriorityEntry.key, crowdPriorityEntry.value);
                } else if (isManualCustomCrowd) {
                    applyCampaign('needTargetCrowd', '1', crowdPriorityEntry.key, crowdPriorityEntry.value);
                    applyCampaign('aiXiaowanCrowdListSwitch', '0', crowdPriorityEntry.key, crowdPriorityEntry.value);
                } else if (isSelectedCrowd) {
                    applyCampaign('needTargetCrowd', '1', crowdPriorityEntry.key, crowdPriorityEntry.value);
                    applyCampaign('aiXiaowanCrowdListSwitch', preferManualCrowdMode ? '0' : '1', crowdPriorityEntry.key, crowdPriorityEntry.value);
                } else if (isSeedCrowd) {
                    applyCampaign('needTargetCrowd', '1', crowdPriorityEntry.key, crowdPriorityEntry.value);
                    applyCampaign('aiXiaowanCrowdListSwitch', '0', crowdPriorityEntry.key, crowdPriorityEntry.value);
                } else if (crowdCloseHint || !crowdPriorityValue) {
                    applyCampaign('needTargetCrowd', '0', crowdPriorityEntry.key, crowdPriorityEntry.value);
                    applyCampaign('aiXiaowanCrowdListSwitch', '0', crowdPriorityEntry.key, crowdPriorityEntry.value);
                }
            }
            const crowdTargetEntry = findSceneSettingEntry(entries, [/人群优化目标/, /客户口径设置/, /人群价值设置/]);
            if (crowdTargetEntry) {
                const crowdTargetValue = normalizeSceneSettingValue(crowdTargetEntry.value || '');
                const crowdTargetEnabled = /(开|开启|启用|是|on|true|1)/i.test(crowdTargetValue)
                    || /人群优化目标/.test(crowdTargetValue);
                const crowdTargetDisabled = /(关|关闭|不启用|禁用|否|off|false|0)/i.test(crowdTargetValue);
                if (crowdTargetEnabled && !crowdTargetDisabled) {
                    applyCampaign('needTargetCrowd', '1', crowdTargetEntry.key, crowdTargetEntry.value);
                } else if (crowdTargetDisabled || !crowdTargetValue) {
                    applyCampaign('needTargetCrowd', '0', crowdTargetEntry.key, crowdTargetEntry.value);
                }
            }

            if (normalizedSceneName === '人群推广') {
                const strategyEntry = findSceneSettingEntry(entries, [/选择拉新方案/, /投放策略/, /方案选择/, /方案/, /营销目标/]);
                const strategyCode = mapScenePromotionStrategyValue(normalizedSceneName, strategyEntry?.value || '', runtime);
                if (strategyEntry && strategyCode) {
                    applyCampaign('promotionStrategy', strategyCode, strategyEntry.key, strategyEntry.value);
                }
            }

            entries.forEach(entry => {
                const rawKey = String(entry?.key || '').trim();
                if (!rawKey || /[\u4e00-\u9fa5]/.test(rawKey)) return;
                const directValue = parseDirectSettingValue(rawKey, entry?.value || '');
                if (directValue === '' || directValue === undefined || directValue === null) return;

                if (/^campaign\./i.test(rawKey)) {
                    const campaignKey = rawKey.replace(/^campaign\./i, '').trim();
                    if (campaignKey) applyCampaign(campaignKey, directValue, entry.key, entry.value);
                    return;
                }
                if (/^adgroup\./i.test(rawKey)) {
                    const adgroupKey = rawKey.replace(/^adgroup\./i, '').trim();
                    if (adgroupKey) applyAdgroup(adgroupKey, directValue, entry.key, entry.value);
                    return;
                }
                if (allowedCampaignKeys.has(rawKey)) {
                    applyCampaign(rawKey, directValue, entry.key, entry.value);
                    return;
                }
                if (allowedAdgroupKeys.has(rawKey)) {
                    applyAdgroup(rawKey, directValue, entry.key, entry.value);
                }
            });

            if (isPlainObject(runtime?.solutionTemplate?.adgroupList?.[0])) {
                const templateAdgroupRef = runtime.solutionTemplate.adgroupList[0];
                if (hasOwn(templateAdgroupRef, 'smartCreative')
                    && mapping.adgroupOverride.smartCreative === undefined
                    && mapping.campaignOverride.smartCreative !== undefined) {
                    applyAdgroup('smartCreative', mapping.campaignOverride.smartCreative, '创意优选', String(mapping.campaignOverride.smartCreative));
                }
            }

            return mapping;
        };

        const buildFallbackSolutionTemplate = (runtime, sceneName = '') => {
            const normalizedSceneName = String(sceneName || '').trim();
            if (normalizedSceneName && normalizedSceneName !== '关键词推广') {
                const fallbackCampaign = {
                    operation: '',
                    bizCode: runtime.bizCode,
                    promotionScene: runtime.promotionScene || '',
                    subPromotionType: runtime.subPromotionType || DEFAULTS.subPromotionType,
                    promotionType: runtime.promotionType || DEFAULTS.promotionType,
                    dmcType: runtime.dmcType || DEFAULTS.dmcType,
                    campaignName: `${normalizedSceneName}_${todayStamp()}`,
                    campaignGroupId: '',
                    campaignGroupName: '',
                    itemIdList: [],
                    crowdList: [],
                    launchAreaStrList: ['all'],
                    launchPeriodList: buildDefaultLaunchPeriodList()
                };
                if (normalizedSceneName === '人群推广') {
                    const crowdTarget = String(runtime.bidTargetV2 || runtime.optimizeTarget || SCENE_FALLBACK_BID_TARGET['人群推广'] || '').trim();
                    const crowdBidTypeV2 = normalizeBidTypeForCampaignField(
                        runtime?.storeData?.bidTypeV2 || runtime?.storeData?.bidType || runtime?.bidTypeV2 || '',
                        'bidTypeV2',
                        '人群推广'
                    ) || SCENE_BIDTYPE_V2_DEFAULT['人群推广'];
                    fallbackCampaign.itemSelectedMode = runtime.itemSelectedMode || DEFAULTS.itemSelectedMode;
                    if (crowdTarget) {
                        fallbackCampaign.bidTargetV2 = crowdTarget;
                        fallbackCampaign.optimizeTarget = crowdTarget;
                    }
                    fallbackCampaign.bidTypeV2 = crowdBidTypeV2;
                    fallbackCampaign.promotionStrategy = runtime.storeData?.promotionStrategy || 'jingdian_laxin';
                    fallbackCampaign.user_level = runtime.storeData?.user_level || 'm3';
                    fallbackCampaign.needTargetCrowd = runtime.storeData?.needTargetCrowd || '1';
                    fallbackCampaign.aiXiaowanCrowdListSwitch = runtime.storeData?.aiXiaowanCrowdListSwitch || '1';
                    fallbackCampaign.creativeSetMode = runtime.storeData?.creativeSetMode || 'professional';
                }
                return {
                    bizCode: runtime.bizCode,
                    campaign: fallbackCampaign,
                    adgroupList: [{
                        rightList: [],
                        smartCreative: 1
                    }]
                };
            }
            return {
                bizCode: runtime.bizCode,
                campaign: {
                    operation: '',
                    bizCode: runtime.bizCode,
                    promotionScene: runtime.promotionScene,
                    subPromotionType: runtime.subPromotionType,
                    promotionType: runtime.promotionType,
                    itemSelectedMode: runtime.itemSelectedMode,
                    bidTypeV2: runtime.bidTypeV2,
                    bidTargetV2: runtime.bidTargetV2,
                    campaignCycleBudgetInfo: { currentCampaignActivityCycleBudgetStatus: '0' },
                    subsidy: null,
                    itemIdList: [],
                    deleteAdgroupList: [],
                    updatedRightInfoAdgroupList: [],
                    campaignColdStartVO: { coldStartStatus: '0' },
                    subOptimizeTarget: 'retained_buy',
                    setSingleCostV2: false,
                    optimizeTarget: runtime.bidTargetV2 || 'conv',
                    dmcType: runtime.dmcType || DEFAULTS.dmcType,
                    campaignName: `关键词推广_${todayStamp()}`,
                    campaignGroupId: '',
                    campaignGroupName: '',
                    supportCouponId: '',
                    creativeSetMode: 'minimalist',
                    smartCreative: 1,
                    crowdList: [],
                    adzoneList: [],
                    launchAreaStrList: ['all'],
                    launchPeriodList: buildDefaultLaunchPeriodList(),
                    sourceChannel: 'onebp',
                    channelLocation: '',
                    selectedTargetBizCode: '',
                    dmpSolutionId: '',
                    activityId: '',
                    specialSourceForMainStep: '',
                    bpStrategyId: '',
                    bpStrategyType: ''
                },
                adgroupList: [{
                    material: {
                        materialId: '',
                        materialName: '',
                        promotionType: runtime.promotionType,
                        subPromotionType: runtime.subPromotionType,
                        fromTab: 'manual',
                        linkUrl: '',
                        goalLifeCycleList: null,
                        shopId: '',
                        shopName: '',
                        bidCount: 0,
                        categoryLevel1: ''
                    },
                    rightList: [],
                    wordList: [],
                    wordPackageList: [],
                    smartCreative: 1
                }]
            };
        };

        const resolveBudgetForCampaign = (planBudget, runtime, campaign) => {
            const budget = isPlainObject(planBudget) ? planBudget : {};
            let dmcType = String(budget.dmcType || campaign?.dmcType || runtime.dmcType || DEFAULTS.dmcType || '').trim();
            if (!dmcType) dmcType = DEFAULTS.dmcType;

            let selectedField = '';
            let selectedValue = NaN;
            for (const key of BUDGET_FIELDS) {
                if (budget[key] === undefined || budget[key] === null || budget[key] === '') continue;
                selectedField = key;
                selectedValue = toNumber(budget[key], NaN);
                break;
            }
            if (!budget.dmcType && selectedField && BUDGET_FIELD_DMC_MAP[selectedField]) {
                dmcType = BUDGET_FIELD_DMC_MAP[selectedField];
            }

            if (!selectedField && planBudget !== undefined && planBudget !== null && planBudget !== '' && !isPlainObject(planBudget)) {
                selectedField = DMC_BUDGET_FIELD_MAP[dmcType] || 'dayAverageBudget';
                selectedValue = toNumber(planBudget, NaN);
            }

            if (!selectedField) {
                const mappedField = DMC_BUDGET_FIELD_MAP[dmcType] || 'dayAverageBudget';
                if (runtime[mappedField] !== undefined && runtime[mappedField] !== null && runtime[mappedField] !== '') {
                    selectedField = mappedField;
                    selectedValue = toNumber(runtime[mappedField], NaN);
                } else if (runtime.dayAverageBudget !== undefined && runtime.dayAverageBudget !== null && runtime.dayAverageBudget !== '') {
                    selectedField = mappedField;
                    selectedValue = toNumber(runtime.dayAverageBudget, NaN);
                } else if (campaign?.[mappedField] !== undefined && campaign?.[mappedField] !== null && campaign?.[mappedField] !== '') {
                    selectedField = mappedField;
                    selectedValue = toNumber(campaign[mappedField], NaN);
                }
            }

            return {
                dmcType,
                field: selectedField,
                value: selectedValue
            };
        };

        const resolveLeadTemplateTriplet = ({ campaign = {}, runtimeStoreData = {} } = {}) => {
            const normalizeLeadTemplateIdText = (value) => {
                const idText = String(toIdValue(value)).trim();
                return /^\d+$/.test(idText) ? idText : '';
            };
            const normalizedCampaign = isPlainObject(campaign) ? campaign : {};
            const normalizedOrderInfo = isPlainObject(normalizedCampaign.orderInfo) ? normalizedCampaign.orderInfo : {};
            const normalizedRuntimeStore = isPlainObject(runtimeStoreData) ? runtimeStoreData : {};
            const candidateSources = [
                {
                    source: 'campaign',
                    values: {
                        planId: normalizeLeadTemplateIdText(normalizedCampaign.planId),
                        planTemplateId: normalizeLeadTemplateIdText(normalizedCampaign.planTemplateId),
                        packageTemplateId: normalizeLeadTemplateIdText(normalizedCampaign.packageTemplateId)
                    }
                },
                {
                    source: 'orderInfo',
                    values: {
                        planId: normalizeLeadTemplateIdText(normalizedOrderInfo.planId),
                        planTemplateId: normalizeLeadTemplateIdText(normalizedOrderInfo.planTemplateId),
                        packageTemplateId: normalizeLeadTemplateIdText(normalizedOrderInfo.packageTemplateId)
                    }
                },
                {
                    source: 'runtime.storeData',
                    values: {
                        planId: normalizeLeadTemplateIdText(normalizedRuntimeStore.planId),
                        planTemplateId: normalizeLeadTemplateIdText(normalizedRuntimeStore.planTemplateId),
                        packageTemplateId: normalizeLeadTemplateIdText(normalizedRuntimeStore.packageTemplateId)
                    }
                }
            ];
            const hasAnyValue = (values = {}) => !!(values.planId || values.planTemplateId || values.packageTemplateId);
            const isCompleteValues = (values = {}) => !!(values.planId && values.planTemplateId && values.packageTemplateId);
            const explicitSources = candidateSources.filter(entry => entry.source !== 'runtime.storeData' && hasAnyValue(entry.values));
            const selectedSource = explicitSources.find(entry => isCompleteValues(entry.values))
                || explicitSources[0]
                || candidateSources[2];
            const selectedValues = selectedSource?.values || {};
            const missingFields = [];
            if (!selectedValues.planId) missingFields.push('planId');
            if (!selectedValues.planTemplateId) missingFields.push('planTemplateId');
            if (!selectedValues.packageTemplateId) missingFields.push('packageTemplateId');
            return {
                source: selectedSource?.source || 'runtime.storeData',
                planId: selectedValues.planId || '',
                planTemplateId: selectedValues.planTemplateId || '',
                packageTemplateId: selectedValues.packageTemplateId || '',
                missingFields
            };
        };

        const applyNonKeywordOptionalCampaignPrune = ({
            campaign = {},
            templateCampaign = {},
            hasItem = false,
            sceneCapabilities = {},
            hasExplicitCampaignField = () => false
        } = {}) => {
            const targetCampaign = isPlainObject(campaign) ? campaign : {};
            const runtimeTemplateCampaign = isPlainObject(templateCampaign) ? templateCampaign : {};
            const sceneName = String(sceneCapabilities?.sceneName || '').trim();
            const optionalKeys = [
                'bidTypeV2',
                'adzoneList',
                'launchAreaStrList',
                'launchPeriodList',
                'crowdList',
                'itemIdList',
                'promotionStrategy',
                'needTargetCrowd',
                'aiXiaowanCrowdListSwitch',
                'creativeSetMode',
                'user_level',
                'orderChargeType'
            ];
            optionalKeys.forEach(key => {
                if (key === 'itemIdList' && hasItem && sceneCapabilities.hasItemIdList) return;
                if (hasOwn(runtimeTemplateCampaign, key)) return;
                if (hasExplicitCampaignField(key)) return;
                if (sceneName === '人群推广' && key === 'bidTypeV2') return;
                if ((sceneName === '内容营销' || sceneName === '线索推广')
                    && (key === 'launchPeriodList' || key === 'launchAreaStrList')) return;
                delete targetCampaign[key];
            });
            return targetCampaign;
        };

        const buildSolutionFromPlan = async ({ plan, request, runtime, requestOptions }) => {
            const sceneCapabilities = resolveSceneCapabilities({
                sceneName: request?.sceneName || '',
                runtime,
                request
            });
            const goalResolution = isPlainObject(plan?.__goalResolution)
                ? plan.__goalResolution
                : (isPlainObject(request?.__goalResolution) ? request.__goalResolution : {});
            const resolvedMarketingGoal = normalizeGoalLabel(
                plan?.marketingGoal
                || goalResolution?.resolvedMarketingGoal
                || request?.marketingGoal
                || request?.common?.marketingGoal
                || ''
            );
            const submitEndpoint = normalizeGoalCreateEndpoint(
                plan?.submitEndpoint
                || request?.submitEndpoint
                || goalResolution?.endpoint
                || ENDPOINTS.solutionAddList
            );
            const isKeywordScene = sceneCapabilities.sceneName === '关键词推广';
            const planBidMode = isKeywordScene
                ? resolvePlanBidMode({ plan, request, runtime })
                : '';
            const isKeywordManualMode = isKeywordScene && planBidMode === 'manual';
            const keywordGoalRuntime = isKeywordScene
                ? resolveKeywordGoalRuntimeFallback(
                    resolvedMarketingGoal
                    || plan?.marketingGoal
                    || request?.marketingGoal
                    || request?.common?.marketingGoal
                    || ''
                )
                : {};
            const sceneBizCodeHint = normalizeSceneBizCode(
                sceneCapabilities.expectedSceneBizCode
                || resolveSceneBizCodeHint(sceneCapabilities.sceneName || request?.sceneName || '')
                || request?.bizCode
                || runtime?.bizCode
                || ''
            );
            const runtimeTemplateBizCode = normalizeSceneBizCode(
                runtime?.solutionTemplate?.bizCode
                || runtime?.solutionTemplate?.campaign?.bizCode
                || ''
            );
            const templateMatchesScene = !sceneBizCodeHint
                || !runtimeTemplateBizCode
                || runtimeTemplateBizCode === sceneBizCodeHint;
            const runtimeSceneName = sceneCapabilities.sceneName || request?.sceneName || '';
            const runtimeScenePromotionScene = isKeywordScene
                ? String(
                    keywordGoalRuntime?.promotionScene
                    || request?.promotionScene
                    || runtime?.promotionScene
                    || resolveSceneDefaultPromotionScene(runtimeSceneName, '')
                ).trim()
                : (
                    resolveSceneDefaultPromotionScene(runtimeSceneName, runtime?.promotionScene || '')
                    || runtime?.promotionScene
                    || ''
                );
            const runtimeForScene = mergeDeep({}, runtime, {
                bizCode: sceneBizCodeHint || runtime?.bizCode || DEFAULTS.bizCode,
                promotionScene: runtimeScenePromotionScene,
                itemSelectedMode: isKeywordScene
                    ? (keywordGoalRuntime?.itemSelectedMode || runtime?.itemSelectedMode || DEFAULTS.itemSelectedMode)
                    : (runtime?.itemSelectedMode || ''),
                bidType: isKeywordScene
                    ? (keywordGoalRuntime?.bidType || runtime?.bidType || '')
                    : (runtime?.bidType || ''),
                bidTypeV2: isKeywordScene
                    ? (keywordGoalRuntime?.bidTypeV2 || runtime?.bidTypeV2 || DEFAULTS.bidTypeV2)
                    : (runtime?.bidTypeV2 || ''),
                bidTargetV2: isKeywordScene
                    ? (keywordGoalRuntime?.bidTargetV2 || runtime?.bidTargetV2 || DEFAULTS.bidTargetV2)
                    : (runtime?.bidTargetV2 || ''),
                optimizeTarget: isKeywordScene
                    ? (keywordGoalRuntime?.optimizeTarget || runtime?.optimizeTarget || '')
                    : (runtime?.optimizeTarget || ''),
                solutionTemplate: templateMatchesScene ? runtime?.solutionTemplate : null
            });
            const template = runtimeForScene.solutionTemplate || buildFallbackSolutionTemplate(runtimeForScene, request?.sceneName || '');
            const item = plan?.item ? normalizeItem(plan.item) : null;
            const hasItem = !!(item?.materialId || item?.itemId);
            if (sceneCapabilities.requiresItem && !hasItem) {
                throw new Error(`场景「${sceneCapabilities.sceneName || '未命名'}」要求先选择商品`);
            }

            const campaign = purgeCreateTransientFields(sanitizeCampaign(deepClone(template.campaign || {})));
            const baseAdgroup = (Array.isArray(template.adgroupList) && template.adgroupList[0]) ? template.adgroupList[0] : {};
            const adgroup = purgeCreateTransientFields(sanitizeAdgroup(deepClone(baseAdgroup)));

            campaign.bizCode = campaign.bizCode || runtimeForScene.bizCode || DEFAULTS.bizCode;
            campaign.subPromotionType = campaign.subPromotionType || runtimeForScene.subPromotionType || DEFAULTS.subPromotionType;
            campaign.promotionType = campaign.promotionType || runtimeForScene.promotionType || DEFAULTS.promotionType;
            campaign.bidTypeV2 = isKeywordScene
                ? bidModeToBidType(planBidMode)
                : (campaign.bidTypeV2 || runtimeForScene.bidTypeV2 || '');
            if (isKeywordScene) {
                campaign.promotionScene = String(
                    campaign.promotionScene
                    || runtimeForScene.promotionScene
                    || keywordGoalRuntime?.promotionScene
                    || DEFAULTS.promotionScene
                ).trim();
                campaign.itemSelectedMode = String(
                    campaign.itemSelectedMode
                    || runtimeForScene.itemSelectedMode
                    || keywordGoalRuntime?.itemSelectedMode
                    || DEFAULTS.itemSelectedMode
                ).trim();
                if (planBidMode === 'smart') {
                    campaign.bidTargetV2 = campaign.bidTargetV2 || runtimeForScene.bidTargetV2 || DEFAULTS.bidTargetV2;
                    campaign.optimizeTarget = campaign.optimizeTarget || campaign.bidTargetV2;
                } else {
                    delete campaign.bidTargetV2;
                    delete campaign.optimizeTarget;
                    campaign.setSingleCostV2 = false;
                    delete campaign.singleCostV2;
                }
            } else {
                const forcedScenePromotionScene = resolveSceneDefaultPromotionScene(
                    sceneCapabilities.sceneName || request?.sceneName || '',
                    runtimeForScene.promotionScene || ''
                );
                campaign.promotionScene = forcedScenePromotionScene || campaign.promotionScene || runtimeForScene.promotionScene || '';
                campaign.itemSelectedMode = campaign.itemSelectedMode || runtimeForScene.itemSelectedMode || '';
                campaign.bidTargetV2 = campaign.bidTargetV2 || runtimeForScene.bidTargetV2 || '';
                if (!campaign.bidTypeV2) delete campaign.bidTypeV2;
                if (!campaign.itemSelectedMode) delete campaign.itemSelectedMode;
                if (!campaign.promotionScene) delete campaign.promotionScene;
                if (!campaign.bidTargetV2) {
                    delete campaign.bidTargetV2;
                    delete campaign.optimizeTarget;
                } else if (!campaign.optimizeTarget) {
                    campaign.optimizeTarget = campaign.bidTargetV2;
                }
            }
            campaign.dmcType = campaign.dmcType || runtimeForScene.dmcType || DEFAULTS.dmcType;
            campaign.campaignName = plan.planName;
            if (hasItem && sceneCapabilities.hasItemIdList) {
                campaign.itemIdList = [toIdValue(item.materialId || item.itemId)];
            } else if (Array.isArray(campaign.itemIdList)) {
                campaign.itemIdList = [];
            } else if (!sceneCapabilities.hasItemIdList && hasOwn(campaign, 'itemIdList')) {
                delete campaign.itemIdList;
            }
            if (!isPlainObject(campaign.campaignCycleBudgetInfo)) {
                campaign.campaignCycleBudgetInfo = { currentCampaignActivityCycleBudgetStatus: '0' };
            } else if (!campaign.campaignCycleBudgetInfo.currentCampaignActivityCycleBudgetStatus) {
                campaign.campaignCycleBudgetInfo.currentCampaignActivityCycleBudgetStatus = '0';
            }

            const budgetConfig = resolveBudgetForCampaign(plan?.budget, runtimeForScene, campaign);
            campaign.dmcType = budgetConfig.dmcType || campaign.dmcType;
            if (budgetConfig.field && Number.isFinite(budgetConfig.value) && budgetConfig.value > 0) {
                BUDGET_FIELDS.forEach(field => {
                    if (field !== budgetConfig.field) delete campaign[field];
                });
                campaign[budgetConfig.field] = budgetConfig.value;
            }

            let keywordBundle = {
                wordList: [],
                wordPackageList: [],
                mode: 'none'
            };
            if (sceneCapabilities.enableKeywords) {
                if (!hasItem) {
                    throw new Error(`场景「${sceneCapabilities.sceneName || '未命名'}」启用关键词时必须提供商品`);
                }
                keywordBundle = await buildKeywordBundle({
                    plan,
                    item,
                    runtimeDefaults: runtimeForScene,
                    request,
                    requestOptions
                });
                const templateWordPackageList = Array.isArray(baseAdgroup?.wordPackageList)
                    ? deepClone(baseAdgroup.wordPackageList)
                    : [];
                if (keywordBundle.useWordPackage && !keywordBundle.wordPackageList.length && templateWordPackageList.length) {
                    keywordBundle.wordPackageList = templateWordPackageList.slice(0, 100);
                }
            }

            if (sceneCapabilities.hasMaterial && hasItem) {
                const materialId = toIdValue(item.materialId || item.itemId);
                const fallbackMaterialName = `商品${item.itemId || item.materialId || ''}`;
                const materialName = String(item.materialName || '').trim() || fallbackMaterialName;
                adgroup.material = pickMaterialFields(mergeDeep(adgroup.material || {}, {
                    materialId,
                    materialName,
                    promotionType: runtimeForScene.promotionType,
                    subPromotionType: runtimeForScene.subPromotionType,
                    fromTab: item.fromTab || adgroup.material?.fromTab || 'manual',
                    linkUrl: item.linkUrl || adgroup.material?.linkUrl || '',
                    shopId: item.shopId || adgroup.material?.shopId || '',
                    shopName: item.shopName || adgroup.material?.shopName || '',
                    bidCount: item.bidCount || adgroup.material?.bidCount || 0,
                    categoryLevel1: item.categoryLevel1 || adgroup.material?.categoryLevel1 || ''
                }));
            } else if (hasOwn(adgroup, 'material') && !sceneCapabilities.hasMaterial) {
                delete adgroup.material;
            }

            if (sceneCapabilities.hasWordList) {
                adgroup.wordList = keywordBundle.wordList;
            } else if (hasOwn(adgroup, 'wordList')) {
                delete adgroup.wordList;
            }

            if (sceneCapabilities.hasWordPackageList && keywordBundle.useWordPackage) {
                adgroup.wordPackageList = keywordBundle.wordPackageList;
            } else if (hasOwn(adgroup, 'wordPackageList')) {
                delete adgroup.wordPackageList;
            }

            if (sceneCapabilities.hasRightList && !Array.isArray(adgroup.rightList)) {
                adgroup.rightList = [];
            } else if (!sceneCapabilities.hasRightList && hasOwn(adgroup, 'rightList')) {
                delete adgroup.rightList;
            }

            if (!isKeywordScene
                && !hasOwn(baseAdgroup || {}, 'smartCreative')
                && hasOwn(adgroup, 'smartCreative')) {
                delete adgroup.smartCreative;
            }

            const merged = { campaign, adgroup };
            applyOverrides(merged, request, plan);
            if (sceneBizCodeHint) {
                merged.campaign.bizCode = sceneBizCodeHint;
            }
            const hasExplicitCampaignField = (key = '') => {
                const sourceValues = [
                    request?.[key],
                    request?.common?.[key],
                    request?.common?.campaignOverride?.[key],
                    request?.goalForcedCampaignOverride?.[key],
                    request?.sceneForcedCampaignOverride?.[key],
                    request?.rawOverrides?.[key],
                    request?.rawOverrides?.campaign?.[key],
                    request?.common?.rawOverrides?.campaign?.[key],
                    plan?.[key],
                    plan?.campaignOverride?.[key],
                    plan?.goalForcedCampaignOverride?.[key],
                    plan?.rawOverrides?.[key],
                    plan?.rawOverrides?.campaign?.[key]
                ];
                return sourceValues.some(value => value !== undefined && value !== null && value !== '');
            };
            if (hasItem && sceneCapabilities.hasItemIdList) {
                merged.campaign.itemIdList = [toIdValue(item.materialId || item.itemId)];
            } else if (!sceneCapabilities.hasItemIdList && hasOwn(merged.campaign, 'itemIdList')) {
                if (!hasExplicitCampaignField('itemIdList')) {
                    delete merged.campaign.itemIdList;
                }
            }
            if (sceneCapabilities.enableKeywords && !keywordBundle.useWordPackage) {
                merged.campaign = stripWordPackageArtifacts(merged.campaign);
                merged.adgroup = stripWordPackageArtifacts(merged.adgroup);
                if (isKeywordScene) {
                    merged.campaign = stripKeywordTrafficArtifacts(merged.campaign);
                    merged.adgroup = stripKeywordTrafficArtifacts(merged.adgroup);
                }
            }
            if (isKeywordScene) {
                merged.campaign = pruneKeywordCampaignForCustomScene(merged.campaign, {
                    request,
                    plan,
                    bidMode: planBidMode,
                    goalRuntime: keywordGoalRuntime,
                    runtimeDefaults: runtimeForScene,
                    templateCampaign: template?.campaign || {}
                });
                merged.adgroup = pruneKeywordAdgroupForCustomScene(merged.adgroup, hasItem ? item : null, {
                    bidMode: planBidMode
                });
            } else {
                const expectedSceneBizCode = normalizeSceneBizCode(sceneCapabilities.expectedSceneBizCode || sceneBizCodeHint || request?.bizCode || '');
                const templateBizCode = normalizeSceneBizCode(runtimeForScene?.solutionTemplate?.bizCode || runtimeForScene?.solutionTemplate?.campaign?.bizCode || '');
                const hasRuntimeTemplateCampaign = isPlainObject(runtimeForScene?.solutionTemplate?.campaign)
                    && Object.keys(runtimeForScene.solutionTemplate.campaign).length > 0
                    && (!expectedSceneBizCode || (templateBizCode && templateBizCode === expectedSceneBizCode));
                const runtimeTemplateCampaign = hasRuntimeTemplateCampaign
                    ? (runtimeForScene.solutionTemplate.campaign || {})
                    : {};
                const explicitBidTypeV2 = hasExplicitCampaignField('bidTypeV2');
                const explicitBidType = hasExplicitCampaignField('bidType');
                const explicitOptimizeTarget = hasExplicitCampaignField('optimizeTarget');
                const explicitBidTargetV2 = hasExplicitCampaignField('bidTargetV2');
                const scenePrefersBidTypeV2 = SCENE_BIDTYPE_V2_ONLY.has(sceneCapabilities.sceneName);
                const supportsTemplateBidTypeV2 = hasOwn(runtimeTemplateCampaign, 'bidTypeV2');
                const shouldKeepBidTypeV2 = scenePrefersBidTypeV2 || supportsTemplateBidTypeV2;
                if (!explicitBidTypeV2 && !shouldKeepBidTypeV2) {
                    delete merged.campaign.bidTypeV2;
                }
                if ((!explicitBidType && !hasRuntimeTemplateCampaign) || scenePrefersBidTypeV2) {
                    delete merged.campaign.bidType;
                }

                const supportsBidTargetFields = sceneCapabilities.sceneName === '人群推广'
                    || sceneCapabilities.sceneName === '货品全站推广'
                    || hasRuntimeTemplateCampaign && (
                        hasOwn(runtimeForScene.solutionTemplate.campaign || {}, 'bidTargetV2')
                        || hasOwn(runtimeForScene.solutionTemplate.campaign || {}, 'optimizeTarget')
                    );
                const fallbackBidTarget = SCENE_FALLBACK_BID_TARGET[sceneCapabilities.sceneName] || '';
                let bidTarget = String(merged.campaign.bidTargetV2 || '').trim();
                if ((!bidTarget || bidTarget === DEFAULTS.bidTargetV2) && fallbackBidTarget) {
                    bidTarget = fallbackBidTarget;
                }
                const keepOptimizeTarget = sceneCapabilities.sceneName === '内容营销'
                    || sceneCapabilities.sceneName === '线索推广';
                if (!supportsBidTargetFields || !bidTarget) {
                    if (!explicitBidTargetV2) {
                        delete merged.campaign.bidTargetV2;
                    }
                    if (!keepOptimizeTarget && !explicitOptimizeTarget) {
                        delete merged.campaign.optimizeTarget;
                    }
                } else {
                    merged.campaign.bidTargetV2 = bidTarget;
                    const optimizeTarget = String(merged.campaign.optimizeTarget || '').trim();
                    const shouldSyncOptimizeTarget = sceneCapabilities.sceneName === '人群推广'
                        || !optimizeTarget
                        || optimizeTarget === DEFAULTS.bidTargetV2
                        || (!explicitOptimizeTarget && !hasRuntimeTemplateCampaign);
                    if (shouldSyncOptimizeTarget) {
                        merged.campaign.optimizeTarget = bidTarget;
                    }
                }

                if (sceneCapabilities.sceneName === '人群推广') {
                    if (!merged.campaign.promotionScene || /promotion_scene_search_/i.test(String(merged.campaign.promotionScene || ''))) {
                        merged.campaign.promotionScene = resolveSceneDefaultPromotionScene('人群推广', runtimeForScene?.storeData?.promotionScene || 'promotion_scene_display_laxin');
                    }
                    const crowdGoalLabel = normalizeGoalLabel(
                        resolvedMarketingGoal
                        || plan?.marketingGoal
                        || request?.marketingGoal
                        || request?.common?.marketingGoal
                        || ''
                    );
                    const isCrowdCustomGoal = crowdGoalLabel === '自定义推广';
                    const runtimeCrowdBidTypeV2 = normalizeBidTypeForCampaignField(
                        runtimeForScene?.storeData?.bidTypeV2 || runtimeForScene?.storeData?.bidType || runtimeForScene?.bidTypeV2 || '',
                        'bidTypeV2',
                        '人群推广'
                    );
                    const mergedCrowdBidTypeV2 = normalizeBidTypeForCampaignField(
                        merged.campaign.bidTypeV2 || merged.campaign.bidType || '',
                        'bidTypeV2',
                        '人群推广'
                    );
                    merged.campaign.bidTypeV2 = mergedCrowdBidTypeV2 || runtimeCrowdBidTypeV2 || SCENE_BIDTYPE_V2_DEFAULT['人群推广'];
                    delete merged.campaign.bidType;
                    if (!merged.campaign.itemSelectedMode) {
                        merged.campaign.itemSelectedMode = runtimeForScene.itemSelectedMode || DEFAULTS.itemSelectedMode;
                    }
                    if (!merged.campaign.promotionStrategy) {
                        merged.campaign.promotionStrategy = runtimeForScene?.storeData?.promotionStrategy || 'jingdian_laxin';
                    }
                    if (!merged.campaign.user_level) {
                        merged.campaign.user_level = runtimeForScene?.storeData?.user_level || 'm3';
                    }
                    if (merged.campaign.needTargetCrowd === undefined || merged.campaign.needTargetCrowd === null || merged.campaign.needTargetCrowd === '') {
                        merged.campaign.needTargetCrowd = runtimeForScene?.storeData?.needTargetCrowd || '1';
                    }
                    if (merged.campaign.aiXiaowanCrowdListSwitch === undefined || merged.campaign.aiXiaowanCrowdListSwitch === null || merged.campaign.aiXiaowanCrowdListSwitch === '') {
                        merged.campaign.aiXiaowanCrowdListSwitch = runtimeForScene?.storeData?.aiXiaowanCrowdListSwitch || '1';
                    }
                    if (!merged.campaign.creativeSetMode) {
                        merged.campaign.creativeSetMode = runtimeForScene?.storeData?.creativeSetMode || 'professional';
                    }
                    if (isCrowdCustomGoal) {
                        // 对齐原生「人群推广-自定义推广」提交契约，避免 campaignType 初始化失败。
                        merged.campaign.promotionScene = 'promotion_scene_item';
                        merged.campaign.promotionStrategy = 'zidingyi';
                        const crowdCustomBidTypeSeed = String(
                            plan?.sceneSettings?.出价方式
                            || request?.sceneSettings?.出价方式
                            || request?.common?.sceneSettings?.出价方式
                            || merged.campaign.bidTypeV2
                            || merged.campaign.bidType
                            || runtimeForScene?.storeData?.bidTypeV2
                            || runtimeForScene?.storeData?.bidType
                            || ''
                        ).trim();
                        const crowdCustomBidMode = normalizeBidMode(
                            mapSceneBidTypeValue(crowdCustomBidTypeSeed, '人群推广') || crowdCustomBidTypeSeed,
                            'manual'
                        );
                        const customGoalTarget = String(
                            merged.campaign.bidTargetV2
                            || merged.campaign.optimizeTarget
                            || runtimeForScene?.storeData?.bidTargetV2
                            || runtimeForScene?.storeData?.optimizeTarget
                            || 'display_pay'
                        ).trim();
                        const normalizedCustomTarget = crowdCustomBidMode === 'smart'
                            ? normalizeCrowdCustomSmartBidTargetCode(customGoalTarget, {
                                fallback: 'display_roi'
                            })
                            : normalizeCrowdCustomBidTargetCode(customGoalTarget, {
                                fallback: 'display_pay'
                            });
                        merged.campaign.bidTargetV2 = normalizedCustomTarget;
                        merged.campaign.optimizeTarget = normalizedCustomTarget;

                        const customDayBudget = toNumber(
                            merged.campaign.dayBudget,
                            toNumber(merged.campaign.dayAverageBudget, NaN)
                        );
                        if (Number.isFinite(customDayBudget) && customDayBudget > 0) {
                            merged.campaign.dmcType = 'normal';
                            merged.campaign.dayBudget = customDayBudget;
                            delete merged.campaign.dayAverageBudget;
                        }

                        if (hasItem) {
                            const materialId = toIdValue(item.materialId || item.itemId);
                            const fallbackMaterialName = `商品${item.itemId || item.materialId || ''}`;
                            const materialName = String(item.materialName || '').trim() || fallbackMaterialName;
                            merged.adgroup.material = pickMaterialFields(mergeDeep(merged.adgroup.material || {}, {
                                materialId,
                                materialName,
                                promotionType: runtimeForScene.promotionType,
                                subPromotionType: runtimeForScene.subPromotionType,
                                fromTab: item.fromTab || merged.adgroup.material?.fromTab || 'manual',
                                linkUrl: item.linkUrl || merged.adgroup.material?.linkUrl || '',
                                shopId: item.shopId || merged.adgroup.material?.shopId || '',
                                shopName: item.shopName || merged.adgroup.material?.shopName || '',
                                bidCount: item.bidCount || merged.adgroup.material?.bidCount || 0,
                                categoryLevel1: item.categoryLevel1 || merged.adgroup.material?.categoryLevel1 || ''
                            }));
                        }
                    }
                }

                if (sceneCapabilities.sceneName === '货品全站推广') {
                    merged.campaign.promotionScene = merged.campaign.promotionScene || runtimeForScene?.storeData?.promotionScene || 'promotion_scene_site';
                    merged.campaign.itemSelectedMode = hasItem
                        ? 'user_define'
                        : (merged.campaign.itemSelectedMode || runtimeForScene?.storeData?.itemSelectedMode || 'user_define');
                    merged.campaign.bidType = merged.campaign.bidType || runtimeForScene?.storeData?.bidType || 'roi_control';
                    merged.campaign.optimizeTarget = merged.campaign.optimizeTarget || runtimeForScene?.storeData?.optimizeTarget || 'ad_strategy_retained_buy';
                    const siteBidType = String(merged.campaign.bidType || '').trim().toLowerCase();
                    const needConstraintValue = siteBidType !== 'max_amount';
                    if (needConstraintValue) {
                        merged.campaign.constraintType = merged.campaign.constraintType || runtimeForScene?.storeData?.constraintType || 'roi';
                        if (merged.campaign.constraintValue === undefined || merged.campaign.constraintValue === null || merged.campaign.constraintValue === '') {
                            merged.campaign.constraintValue = toNumber(runtimeForScene?.storeData?.constraintValue, 5.0);
                        }
                    } else {
                        delete merged.campaign.constraintType;
                        delete merged.campaign.constraintValue;
                    }
                    if (!isPlainObject(merged.campaign.multiTarget)) {
                        merged.campaign.multiTarget = { multiTargetSwitch: '0' };
                    } else if (!merged.campaign.multiTarget.multiTargetSwitch) {
                        merged.campaign.multiTarget.multiTargetSwitch = '0';
                    }
                    const siteMultiTargetSwitch = String(merged.campaign.multiTarget?.multiTargetSwitch || '0').trim() === '1' ? '1' : '0';
                    merged.campaign.multiTarget.multiTargetSwitch = siteMultiTargetSwitch;
                    if (siteMultiTargetSwitch !== '1') {
                        delete merged.campaign.multiTarget.multiTargetConfigList;
                    } else if (!Array.isArray(merged.campaign.multiTarget.multiTargetConfigList)) {
                        merged.campaign.multiTarget.multiTargetConfigList = [];
                    }
                    merged.campaign.isMultiTarget = siteMultiTargetSwitch === '1';

                    const quickLiftCommand = isPlainObject(merged.campaign.quickLiftBudgetCommand)
                        ? merged.campaign.quickLiftBudgetCommand
                        : {};
                    const quickLiftSwitchRaw = String(quickLiftCommand.quickLiftSwitch || '').trim().toLowerCase();
                    const siteQuickLiftEnabled = quickLiftSwitchRaw === '1'
                        || quickLiftSwitchRaw === 'true'
                        || quickLiftSwitchRaw === 'yes'
                        || quickLiftSwitchRaw === 'on';
                    if (siteQuickLiftEnabled) {
                        quickLiftCommand.quickLiftSwitch = 'true';
                        if (!quickLiftCommand.quickLiftTimeSlot) {
                            quickLiftCommand.quickLiftTimeSlot = buildQuickLiftHourSlotValue('长期投放');
                        }
                        if (!Array.isArray(quickLiftCommand.quickLiftLaunchArea) || !quickLiftCommand.quickLiftLaunchArea.length) {
                            quickLiftCommand.quickLiftLaunchArea = ['all'];
                        }
                        merged.campaign.quickLiftBudgetCommand = quickLiftCommand;
                        merged.campaign.dmcTypeElement = 'quickLiftBudgetCommand.quickLiftBudget';
                    } else {
                        delete merged.campaign.quickLiftBudgetCommand;
                        delete merged.campaign.isQuickLift;
                        if (merged.campaign.isMultiTarget) {
                            merged.campaign.dmcTypeElement = 'multiTarget.multiTargetConfigList';
                        } else {
                            delete merged.campaign.dmcTypeElement;
                        }
                    }
                    delete merged.campaign.isQuickLift;
                    if (!hasOwn(merged.campaign, 'campaignId')) {
                        merged.campaign.campaignId = '';
                    }
                    if (!merged.campaign.sourceChannel) {
                        merged.campaign.sourceChannel = 'onebp';
                    }
                    const siteDmcType = String(merged.campaign.dmcType || '').trim().toLowerCase();
                    const siteBudgetValue = [
                        merged.campaign.dayBudget,
                        merged.campaign.dayAverageBudget,
                        runtimeForScene?.storeData?.dayBudget,
                        runtimeForScene?.storeData?.dayAverageBudget,
                        runtimeForScene?.dayBudget,
                        runtimeForScene?.dayAverageBudget
                    ]
                        .map(item => toNumber(item, NaN))
                        .find(item => Number.isFinite(item) && item > 0);
                    const siteBudgetFallback = toNumber(
                        plan?.budget?.dayBudget
                        ?? plan?.budget?.dayAverageBudget
                        ?? request?.common?.dayAverageBudget
                        ?? request?.dayAverageBudget
                        ?? 100,
                        100
                    );
                    const resolvedSiteBudget = Number.isFinite(siteBudgetValue) && siteBudgetValue > 0
                        ? siteBudgetValue
                        : (Number.isFinite(siteBudgetFallback) && siteBudgetFallback > 0 ? siteBudgetFallback : 100);
                    if (siteDmcType === 'unlimit') {
                        delete merged.campaign.dayBudget;
                        delete merged.campaign.dayAverageBudget;
                        delete merged.campaign.totalBudget;
                        delete merged.campaign.futureBudget;
                    } else {
                        merged.campaign.dmcType = 'normal';
                        merged.campaign.dayBudget = resolvedSiteBudget;
                        delete merged.campaign.dayAverageBudget;
                        delete merged.campaign.totalBudget;
                        delete merged.campaign.futureBudget;
                    }
                    delete merged.campaign.bidTargetV2;
                    delete merged.campaign.wordList;
                    delete merged.campaign.wordPackageList;
                    delete merged.campaign.promotionModel;
                    delete merged.campaign.promotionModelMarketing;
                    delete merged.campaign.orderChargeType;
                    delete merged.campaign.orderInfo;
                    merged.campaign.campaignName = String(
                        merged.campaign.campaignName
                        || plan.planName
                        || ''
                    ).trim();
                    const adgroupName = String(
                        merged.adgroup?.adgroupName
                        || merged.adgroup?.material?.materialName
                        || merged.campaign.campaignName
                        || plan.planName
                        || ''
                    ).trim();
                    if (adgroupName) {
                        merged.adgroup.adgroupName = /单元$/.test(adgroupName) ? adgroupName : `${adgroupName}_单元`;
                    }
                }
                if (sceneCapabilities.sceneName === '店铺直达') {
                    delete merged.campaign.bidTypeV2;
                    delete merged.campaign.bidTargetV2;
                    delete merged.campaign.optimizeTarget;
                    if (!merged.campaign.promotionModel) {
                        merged.campaign.promotionModel = runtimeForScene?.storeData?.promotionModel || 'daily';
                    }
                }
                if (sceneCapabilities.sceneName === '内容营销') {
                    delete merged.campaign.bidTypeV2;
                    if (!merged.campaign.promotionScene) {
                        merged.campaign.promotionScene = resolveSceneDefaultPromotionScene('内容营销', runtimeForScene?.storeData?.promotionScene || 'scene_live_room');
                    }
                    if (!merged.campaign.bidType) {
                        merged.campaign.bidType = runtimeForScene?.storeData?.bidType || 'bcb';
                    }
                    if (!merged.campaign.optimizeTarget) {
                        merged.campaign.optimizeTarget = runtimeForScene?.storeData?.optimizeTarget || 'ad_strategy_buy_net';
                    }
                    if (!merged.campaign.itemSelectedMode) {
                        merged.campaign.itemSelectedMode = runtimeForScene?.storeData?.itemSelectedMode || 'user_define';
                    }
                    if (!merged.campaign.promotionModel) {
                        merged.campaign.promotionModel = runtimeForScene?.storeData?.promotionModel || 'daily';
                    }
                    if (!Array.isArray(merged.campaign.launchPeriodList) || !merged.campaign.launchPeriodList.length) {
                        merged.campaign.launchPeriodList = buildDefaultLaunchPeriodList();
                    }
                    if (!Array.isArray(merged.campaign.launchAreaStrList) || !merged.campaign.launchAreaStrList.length) {
                        merged.campaign.launchAreaStrList = ['all'];
                    }
                    if (!isPlainObject(merged.campaign.launchTime)) {
                        merged.campaign.launchTime = buildDefaultLaunchTime({ forever: true });
                    }
                }
                if (sceneCapabilities.sceneName === '线索推广') {
                    delete merged.campaign.bidTypeV2;
                    merged.campaign.dmcType = 'total';
                    if (!merged.campaign.promotionScene) {
                        merged.campaign.promotionScene = resolveSceneDefaultPromotionScene('线索推广', runtimeForScene?.storeData?.promotionScene || 'leads_collection');
                    }
                    if (!merged.campaign.bidType) {
                        merged.campaign.bidType = runtimeForScene?.storeData?.bidType || 'max_amount';
                    }
                    if (!merged.campaign.promotionModel) {
                        merged.campaign.promotionModel = runtimeForScene?.storeData?.promotionModel
                            || 'order';
                    }
                    if (!merged.campaign.promotionModelMarketing) {
                        merged.campaign.promotionModelMarketing = runtimeForScene?.storeData?.promotionModelMarketing
                            || 'strategy';
                    }
                    if (!merged.campaign.orderChargeType) {
                        merged.campaign.orderChargeType = runtimeForScene?.storeData?.orderChargeType
                            || 'balance_charge';
                    }
                    if (!merged.campaign.itemSelectedMode) {
                        merged.campaign.itemSelectedMode = runtimeForScene?.storeData?.itemSelectedMode
                            || 'user_define';
                    }
                    if (!merged.campaign.optimizeTarget) {
                        merged.campaign.optimizeTarget = runtimeForScene?.storeData?.optimizeTarget
                            || 'leads_cost';
                    }
                    if (!Array.isArray(merged.campaign.launchPeriodList) || !merged.campaign.launchPeriodList.length) {
                        merged.campaign.launchPeriodList = buildDefaultLaunchPeriodList();
                    }
                    if (!Array.isArray(merged.campaign.launchAreaStrList) || !merged.campaign.launchAreaStrList.length) {
                        merged.campaign.launchAreaStrList = ['all'];
                    }
                    if (!isPlainObject(merged.campaign.launchTime)) {
                        merged.campaign.launchTime = buildDefaultLaunchTime({ days: 7, forever: false });
                    }
                    const normalizeLeadTemplateIdText = (value) => {
                        const idText = String(toIdValue(value)).trim();
                        return /^\d+$/.test(idText) ? idText : '';
                    };
                    const leadTemplateTriplet = resolveLeadTemplateTriplet({
                        campaign: merged.campaign,
                        runtimeStoreData: runtimeForScene?.storeData || {}
                    });
                    if (leadTemplateTriplet.missingFields.length) {
                        throw new Error(`线索推广缺少关键模板参数: ${leadTemplateTriplet.missingFields.join(', ')}`);
                    }
                    const leadPlanId = leadTemplateTriplet.planId;
                    const leadPlanTemplateId = leadTemplateTriplet.planTemplateId;
                    const leadPackageTemplateId = leadTemplateTriplet.packageTemplateId;
                    merged.campaign.planId = leadPlanId;
                    merged.campaign.planTemplateId = leadPlanTemplateId;
                    merged.campaign.packageTemplateId = leadPackageTemplateId;
                    const orderAmountBase = Math.max(1500, toNumber(
                        merged.campaign.orderAmount
                        || merged.campaign.totalBudget
                        || merged.campaign.dayBudget
                        || merged.campaign.dayAverageBudget
                        || 3000,
                        3000
                    ));
                    merged.campaign.orderAmount = orderAmountBase;
                    merged.campaign.totalBudget = Math.max(1500, toNumber(merged.campaign.totalBudget, orderAmountBase));
                    delete merged.campaign.dayBudget;
                    delete merged.campaign.dayAverageBudget;
                    delete merged.campaign.futureBudget;
                    if (!isPlainObject(merged.campaign.orderInfo)) {
                        merged.campaign.orderInfo = {};
                    }
                    merged.campaign.orderInfo.orderAmount = Math.max(1500, toNumber(merged.campaign.orderInfo.orderAmount, orderAmountBase));
                    merged.campaign.orderInfo.planId = normalizeLeadTemplateIdText(merged.campaign.orderInfo.planId) || leadPlanId;
                    merged.campaign.orderInfo.planTemplateId = normalizeLeadTemplateIdText(merged.campaign.orderInfo.planTemplateId) || leadPlanTemplateId;
                    merged.campaign.orderInfo.packageTemplateId = normalizeLeadTemplateIdText(merged.campaign.orderInfo.packageTemplateId) || leadPackageTemplateId;
                    merged.campaign.orderInfo.launchTimeType = merged.campaign.orderInfo.launchTimeType || 'adjustable';
                    merged.campaign.orderInfo.isCustom = merged.campaign.orderInfo.isCustom !== undefined
                        ? merged.campaign.orderInfo.isCustom
                        : true;
                    merged.campaign.orderInfo.name = merged.campaign.orderInfo.name || '自定义方案包';
                    merged.campaign.orderInfo.planName = merged.campaign.orderInfo.planName || '自定义方案包';
                    merged.campaign.orderInfo.minBudget = Math.max(1500, toNumber(merged.campaign.orderInfo.minBudget, 1500));
                    merged.campaign.orderInfo.maxBudget = Math.max(merged.campaign.orderInfo.minBudget, toNumber(merged.campaign.orderInfo.maxBudget, 1000000));
                    merged.campaign.orderInfo.predictCycle = Math.max(1, toNumber(merged.campaign.orderInfo.predictCycle, 7));
                    merged.campaign.orderInfo.dmcPeriod = Math.max(1, toNumber(merged.campaign.orderInfo.dmcPeriod, 7));
                    merged.campaign.orderInfo.supportRefund = merged.campaign.orderInfo.supportRefund !== undefined
                        ? merged.campaign.orderInfo.supportRefund
                        : true;
                    merged.campaign.orderInfo.supportRenewal = merged.campaign.orderInfo.supportRenewal !== undefined
                        ? merged.campaign.orderInfo.supportRenewal
                        : true;
                }

                // 非关键词场景按当前模板剔除可选字段，避免把上一个场景字段串到当前场景。
                if (hasRuntimeTemplateCampaign) {
                    merged.campaign = applyNonKeywordOptionalCampaignPrune({
                        campaign: merged.campaign,
                        templateCampaign: runtimeForScene.solutionTemplate.campaign || {},
                        hasItem,
                        sceneCapabilities,
                        hasExplicitCampaignField
                    });
                } else if (sceneCapabilities.sceneName !== '人群推广') {
                    // 无可用模板时，保守移除高频报错字段。
                    delete merged.campaign.bidTypeV2;
                    delete merged.campaign.adzoneList;
                    delete merged.campaign.crowdList;
                    if (sceneCapabilities.sceneName !== '内容营销' && sceneCapabilities.sceneName !== '线索推广') {
                        delete merged.campaign.launchAreaStrList;
                        delete merged.campaign.launchPeriodList;
                    }
                }
            }

            return {
                solution: {
                    bizCode: runtimeForScene.bizCode,
                    campaign: merged.campaign,
                    adgroupList: [merged.adgroup]
                },
                meta: {
                    planName: plan.planName,
                    item: hasItem ? item : null,
                    marketingGoal: resolvedMarketingGoal,
                    goalFallbackUsed: !!goalResolution?.goalFallbackUsed,
                    goalWarnings: Array.isArray(goalResolution?.goalWarnings) ? goalResolution.goalWarnings.slice(0, 20) : [],
                    submitEndpoint,
                    keywordCount: keywordBundle.wordList.length,
                    wordPackageCount: keywordBundle.wordPackageList.length,
                    mode: keywordBundle.mode,
                    bidMode: isKeywordScene ? planBidMode : '',
                    bidTypeV2: merged?.campaign?.bidTypeV2 || merged?.campaign?.bidType || '',
                    bidTargetV2: merged?.campaign?.bidTargetV2 || '',
                    isKeywordScene,
                    fallbackTriggered: false
                }
            };
        };

        const emitProgress = (options, event, payload = {}) => {
            if (typeof options?.onProgress !== 'function') return;
            try {
                options.onProgress({ event, ...payload });
            } catch { }
        };

        const summarizeServerErrors = (res = {}) => {
            const detailList = Array.isArray(res?.data?.errorDetails) ? res.data.errorDetails : [];
            if (detailList.length) {
                return detailList
                    .map(detail => `${detail?.code || 'ERROR'}：${detail?.msg || '未知错误'}`)
                    .join('；');
            }
            return res?.info?.message || res?.message || '';
        };

        const CREATE_RESPONSE_CAMPAIGN_ID_KEYS = ['campaignId', 'planId', 'id', 'bpCampaignId', 'targetCampaignId'];
        const CREATE_RESPONSE_CAMPAIGN_ID_LIST_KEYS = ['campaignIdList', 'planIdList', 'campaignIds', 'planIds', 'idList'];

        const toCreateCampaignIdText = (value) => {
            if (value === undefined || value === null || value === '') return '';
            const text = String(value).trim();
            return /^\d{4,}$/.test(text) ? text : '';
        };

        const pickCreateCampaignIdFromNode = (node = null) => {
            if (!node || typeof node !== 'object') return '';
            for (let i = 0; i < CREATE_RESPONSE_CAMPAIGN_ID_KEYS.length; i++) {
                const key = CREATE_RESPONSE_CAMPAIGN_ID_KEYS[i];
                const id = toCreateCampaignIdText(node[key]);
                if (id) return id;
            }
            for (let i = 0; i < CREATE_RESPONSE_CAMPAIGN_ID_LIST_KEYS.length; i++) {
                const key = CREATE_RESPONSE_CAMPAIGN_ID_LIST_KEYS[i];
                const list = Array.isArray(node[key]) ? node[key] : [];
                for (let j = 0; j < list.length; j++) {
                    const id = toCreateCampaignIdText(list[j]);
                    if (id) return id;
                }
            }
            return '';
        };

        const collectCreateCampaignIdsFromResponse = (res = {}, out = []) => {
            const push = (value) => {
                const id = toCreateCampaignIdText(value);
                if (!id) return;
                out.push(id);
            };
            const appendNode = (node = null) => {
                if (!node || typeof node !== 'object') return;
                push(pickCreateCampaignIdFromNode(node));
                CREATE_RESPONSE_CAMPAIGN_ID_LIST_KEYS.forEach((key) => {
                    const list = Array.isArray(node[key]) ? node[key] : [];
                    list.forEach(push);
                });
            };
            appendNode(res?.data || {});
            const createdList = Array.isArray(res?.data?.list) ? res.data.list : [];
            createdList.forEach((node) => appendNode(node));
            const detailList = Array.isArray(res?.data?.errorDetails) ? res.data.errorDetails : [];
            detailList.forEach((detail) => {
                if (isPlainObject(detail?.result)) {
                    appendNode(detail.result);
                } else if (isPlainObject(detail)) {
                    appendNode(detail);
                }
            });
            return out;
        };

        const extractCreatedCampaignIdsFromCreateResult = (result = {}) => {
            const out = [];
            const successList = Array.isArray(result?.successes) ? result.successes : [];
            successList.forEach((entry) => {
                const id = pickCreateCampaignIdFromNode(entry);
                if (id) out.push(id);
            });
            if (!out.length) {
                const rawResponses = Array.isArray(result?.rawResponses) ? result.rawResponses : [];
                rawResponses.forEach((res) => collectCreateCampaignIdsFromResponse(res, out));
            }
            return uniqueBy(out, id => id);
        };

        const parseAddListOutcome = (res, entries = []) => {
            const createdList = Array.isArray(res?.data?.list) ? res.data.list : [];
            const detailList = Array.isArray(res?.data?.errorDetails) ? res.data.errorDetails : [];
            const globalError = summarizeServerErrors(res);
            const successes = [];
            const failures = [];
            const failedEntries = [];

            entries.forEach((entry, idx) => {
                const created = createdList[idx] || {};
                const detail = detailList[idx] || (detailList.length === 1 ? detailList[0] : null);
                const createdCampaignId = pickCreateCampaignIdFromNode(created);
                const detailCode = detail?.code || '';
                const detailMsg = detail?.msg || '';
                const detailHasError = !!(detailCode || detailMsg || created?.errorMsg);
                const detailCampaignId = pickCreateCampaignIdFromNode(isPlainObject(detail?.result) ? detail.result : detail);
                const rootCampaignId = entries.length === 1 ? pickCreateCampaignIdFromNode(res?.data || {}) : '';
                const campaignId = createdCampaignId
                    || (!detailHasError ? (detailCampaignId || rootCampaignId) : '');
                if (campaignId && (!detailHasError || !!createdCampaignId)) {
                    successes.push({
                        planName: entry.meta.planName,
                        item: entry.meta.item,
                        campaignId,
                        adgroupIdList: created.adgroupIdList || [],
                        marketingGoal: entry?.meta?.marketingGoal || '',
                        submitEndpoint: entry?.meta?.submitEndpoint || '',
                        keywordCount: entry.meta.keywordCount,
                        wordPackageCount: entry.meta.wordPackageCount,
                        mode: entry.meta.mode,
                        bidMode: entry.meta.bidMode || ''
                    });
                    return;
                }

                const error = created?.errorMsg
                    || (detailCode || detailMsg ? `${detailCode || 'ERROR'}：${detailMsg || '服务端返回失败'}` : '')
                    || globalError
                    || '服务端未返回 campaignId';
                failures.push({
                    planName: entry.meta.planName,
                    item: entry.meta.item,
                    error,
                    response: created,
                    code: detailCode || '',
                    detail: isPlainObject(detail?.result) ? deepClone(detail.result) : (detail?.result || null),
                    fullResponse: isPlainObject(res) ? deepClone(res) : null
                });
                failedEntries.push({
                    ...entry,
                    lastError: error,
                    meta: {
                        ...(entry.meta || {}),
                        lastError: error,
                        lastErrorCode: detailCode || '',
                        lastErrorDetail: isPlainObject(detail?.result) ? deepClone(detail.result) : (detail?.result || null),
                        lastErrorResponse: isPlainObject(res) ? deepClone(res) : null
                    }
                });
            });

            return { successes, failures, failedEntries };
        };
