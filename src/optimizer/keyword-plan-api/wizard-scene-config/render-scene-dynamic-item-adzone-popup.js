                const openCrowdItemSettingPopup = async () => {
                    const itemIdListControl = resolveScenePopupControl('campaign.itemIdList', 'itemSelect');
                    if (!(itemIdListControl instanceof HTMLInputElement)) return null;

                    const parseEditorItemIds = (text = '') => uniqueBy(
                        String(text || '')
                            .split(/[\s,，]+/g)
                            .map(item => String(toIdValue(item)).trim())
                            .filter(item => /^\d{4,}$/.test(item)),
                        item => item
                    ).slice(0, WIZARD_MAX_ITEMS);
                    const resolveItemId = (item = {}) => String(
                        toIdValue(item?.materialId || item?.itemId || item?.id || '')
                    ).trim();
                    const buildPlaceholderItem = (itemId = '') => normalizeItem({
                        materialId: itemId,
                        itemId,
                        materialName: `默认商品 ${itemId}`
                    });
                    const normalizePopupItem = (item = null) => {
                        if (!isPlainObject(item)) return null;
                        const normalized = normalizeItem(item);
                        const itemId = resolveItemId(normalized);
                        if (!/^\d{4,}$/.test(itemId)) return null;
                        normalized.materialId = itemId;
                        normalized.itemId = itemId;
                        if (!normalizeSceneSettingValue(normalized.materialName)) {
                            normalized.materialName = `默认商品 ${itemId}`;
                        }
                        return normalized;
                    };
                    const uniquePopupItems = (list = []) => uniqueBy(
                        (Array.isArray(list) ? list : [])
                            .map(item => normalizePopupItem(item))
                            .filter(item => item && /^\d{4,}$/.test(resolveItemId(item))),
                        item => resolveItemId(item)
                    ).slice(0, WIZARD_MAX_ITEMS);
                    const toSerializableItemIdListRaw = (items = []) => JSON.stringify(
                        uniqueBy(
                            items.map(item => resolveItemId(item)).filter(item => /^\d{4,}$/.test(item)),
                            item => item
                        ).slice(0, WIZARD_MAX_ITEMS).map((itemId) => {
                            const num = Number(itemId);
                            return Number.isFinite(num) && num > 0 ? num : itemId;
                        })
                    );

                    const initialControlIdList = normalizeScenePopupItemIdList(itemIdListControl.value || '');
                    const initialWizardItems = uniquePopupItems(
                        Array.isArray(wizardState.addedItems) ? wizardState.addedItems : []
                    );
                    let initialItems = initialWizardItems;
                    if (!initialItems.length && initialControlIdList.length) {
                        initialItems = uniquePopupItems(initialControlIdList.map(itemId => buildPlaceholderItem(itemId)));
                    }
                    if (!initialItems.length) {
                        initialItems = [buildPlaceholderItem(SCENE_SYNC_DEFAULT_ITEM_ID)];
                    }

                    const result = await openScenePopupDialog({
                        title: '添加商品',
                        dialogClassName: 'am-wxt-scene-popup-dialog-filter',
                        closeLabel: '×',
                        cancelLabel: '取消',
                        saveLabel: '确定',
                        bodyHtml: `
                            <div class="am-wxt-scene-popup-tips">请先添加商品（建议默认商品 ${SCENE_SYNC_DEFAULT_ITEM_ID}），避免人群设置层级缺失。</div>
                            <div class="am-wxt-scene-filter-layout">
                                <section class="am-wxt-scene-filter-left">
                                    <div class="am-wxt-scene-filter-group">
                                        <div class="am-wxt-scene-filter-group-title">输入商品ID（多个可用逗号、空格或换行分隔）</div>
                                        <textarea
                                            class="am-wxt-scene-popup-textarea"
                                            data-scene-popup-item-editor="1"
                                            placeholder="示例：\n${SCENE_SYNC_DEFAULT_ITEM_ID}\n989362689528"
                                        ></textarea>
                                    </div>
                                    <div class="am-wxt-scene-popup-actions">
                                        <button type="button" class="am-wxt-btn" data-scene-popup-item-apply="1">按ID加载商品</button>
                                        <button type="button" class="am-wxt-btn" data-scene-popup-item-default="1">填入默认商品</button>
                                    </div>
                                </section>
                                <section class="am-wxt-scene-filter-right">
                                    <div class="am-wxt-scene-filter-selected-head">
                                        <span>已添加商品（<b data-scene-popup-item-count="1">0</b>/${WIZARD_MAX_ITEMS}）</span>
                                        <button type="button" class="am-wxt-btn" data-scene-popup-item-clear="1">清空</button>
                                    </div>
                                    <div class="am-wxt-scene-filter-selected-list" data-scene-popup-item-selected-list="1"></div>
                                </section>
                            </div>
                        `,
                        onMounted: (mask) => {
                            const editor = mask.querySelector('[data-scene-popup-item-editor="1"]');
                            const countEl = mask.querySelector('[data-scene-popup-item-count="1"]');
                            const selectedListEl = mask.querySelector('[data-scene-popup-item-selected-list="1"]');
                            const applyBtn = mask.querySelector('[data-scene-popup-item-apply="1"]');
                            const defaultBtn = mask.querySelector('[data-scene-popup-item-default="1"]');
                            const clearBtn = mask.querySelector('[data-scene-popup-item-clear="1"]');
                            let selectedItems = uniquePopupItems(initialItems);

                            const syncEditorFromSelected = () => {
                                if (!(editor instanceof HTMLTextAreaElement)) return;
                                const ids = selectedItems.map(item => resolveItemId(item)).filter(Boolean);
                                editor.value = ids.join('\n');
                            };
                            const renderSelectedList = () => {
                                if (countEl instanceof HTMLElement) {
                                    countEl.textContent = String(selectedItems.length);
                                }
                                if (!(selectedListEl instanceof HTMLElement)) return;
                                if (!selectedItems.length) {
                                    selectedListEl.innerHTML = '<div class="am-wxt-scene-filter-selected-empty">暂无已添加商品</div>';
                                    return;
                                }
                                selectedListEl.innerHTML = selectedItems.map((item) => {
                                    const itemId = resolveItemId(item);
                                    const itemName = normalizeSceneSettingValue(item?.materialName || item?.name || '')
                                        || `默认商品 ${itemId}`;
                                    return `
                                        <div class="am-wxt-scene-filter-selected-row">
                                            <div>
                                                <div>${Utils.escapeHtml(itemName)}</div>
                                                <div class="am-wxt-scene-crowd-selected-name meta">${Utils.escapeHtml(itemId)}</div>
                                            </div>
                                            <button type="button" class="am-wxt-btn" data-scene-popup-item-remove="${Utils.escapeHtml(itemId)}">移除</button>
                                        </div>
                                    `;
                                }).join('');
                            };
                            const resolveItemsByIds = async (itemIdList = []) => {
                                const normalizedIds = uniqueBy(
                                    (Array.isArray(itemIdList) ? itemIdList : [])
                                        .map(item => String(item || '').trim())
                                        .filter(item => /^\d{4,}$/.test(item)),
                                    item => item
                                ).slice(0, WIZARD_MAX_ITEMS);
                                if (!normalizedIds.length) return [];
                                try {
                                    const runtime = await getRuntimeDefaults(false);
                                    const fetchedItems = await fetchItemsByIds(normalizedIds, runtime);
                                    const fetchedMap = new Map(
                                        (Array.isArray(fetchedItems) ? fetchedItems : [])
                                            .map(item => normalizePopupItem(item))
                                            .filter(Boolean)
                                            .map(item => [resolveItemId(item), item])
                                    );
                                    return normalizedIds.map(itemId => (
                                        fetchedMap.get(itemId) || buildPlaceholderItem(itemId)
                                    ));
                                } catch (err) {
                                    log.warn('按ID加载商品失败，回退占位商品:', err?.message || err);
                                    return normalizedIds.map(itemId => buildPlaceholderItem(itemId));
                                }
                            };
                            const applyEditorIds = async () => {
                                if (!(editor instanceof HTMLTextAreaElement)) return;
                                const idList = parseEditorItemIds(editor.value || '');
                                if (!idList.length) {
                                    appendWizardLog('请先输入有效商品ID', 'error');
                                    return;
                                }
                                const nextItems = await resolveItemsByIds(idList);
                                selectedItems = uniquePopupItems(nextItems);
                                syncEditorFromSelected();
                                renderSelectedList();
                            };

                            if (applyBtn instanceof HTMLButtonElement) {
                                applyBtn.onclick = () => { void applyEditorIds(); };
                            }
                            if (defaultBtn instanceof HTMLButtonElement) {
                                defaultBtn.onclick = () => {
                                    if (editor instanceof HTMLTextAreaElement) {
                                        editor.value = SCENE_SYNC_DEFAULT_ITEM_ID;
                                    }
                                    void applyEditorIds();
                                };
                            }
                            if (clearBtn instanceof HTMLButtonElement) {
                                clearBtn.onclick = () => {
                                    selectedItems = [];
                                    syncEditorFromSelected();
                                    renderSelectedList();
                                };
                            }
                            if (selectedListEl instanceof HTMLElement) {
                                selectedListEl.addEventListener('click', (event) => {
                                    const target = event.target instanceof HTMLElement
                                        ? event.target.closest('[data-scene-popup-item-remove]')
                                        : null;
                                    if (!(target instanceof HTMLElement)) return;
                                    const itemId = String(target.getAttribute('data-scene-popup-item-remove') || '').trim();
                                    if (!itemId) return;
                                    selectedItems = selectedItems.filter(item => resolveItemId(item) !== itemId);
                                    syncEditorFromSelected();
                                    renderSelectedList();
                                });
                            }
                            if (editor instanceof HTMLTextAreaElement) {
                                editor.addEventListener('keydown', (event) => {
                                    if (!(event.ctrlKey || event.metaKey) || event.key !== 'Enter') return;
                                    event.preventDefault();
                                    void applyEditorIds();
                                });
                            }

                            mask._scenePopupItemState = {
                                getItems: () => uniquePopupItems(selectedItems)
                            };
                            syncEditorFromSelected();
                            renderSelectedList();
                        },
                        onSave: (mask) => {
                            const state = mask._scenePopupItemState || {};
                            const items = typeof state.getItems === 'function'
                                ? state.getItems()
                                : [];
                            const nextItems = uniquePopupItems(items);
                            if (!nextItems.length) {
                                appendWizardLog('请至少添加 1 个商品', 'error');
                                return { ok: false };
                            }
                            const itemIdListRaw = toSerializableItemIdListRaw(nextItems);
                            return {
                                ok: true,
                                itemList: nextItems,
                                itemIdListRaw,
                                summary: describeCrowdItemSummary(itemIdListRaw)
                            };
                        }
                    });
                    if (!result || result.ok !== true) return null;
                    return {
                        ok: true,
                        result,
                        itemIdListControl
                    };
                };
                const openAdzonePremiumSettingPopup = async () => {
                    const adzoneControl = resolveScenePopupControl('campaign.adzoneList', 'adzonePremium');
                    if (!(adzoneControl instanceof HTMLInputElement)) return null;
                    const expectedBizCode = normalizeSceneBizCode(
                        wizardState?.draft?.bizCode
                        || parseRouteParamFromHash('bizCode')
                        || ''
                    );
                    const adzoneRawValue = normalizeSceneSettingValue(adzoneControl.value || '') || '[]';
                    let adzoneList = normalizeAdzoneListForAdvanced(adzoneRawValue);
                    const isDisplayAdzoneList = (list = []) => (
                        Array.isArray(list)
                        && list.some(item => isDisplayNativeAdzoneItem(item))
                    );
                    const isDisplayBizCode = expectedBizCode === 'onebpDisplay';
                    const needNativeAdzoneRefresh = (
                        !adzoneList.length
                        || isAdzoneListPlaceholderForSync(adzoneList)
                        || (isDisplayBizCode && !isDisplayAdzoneList(adzoneList))
                    );
                    if (needNativeAdzoneRefresh) {
                        const nativeAdzoneList = await resolveNativeAdzoneListFromVframes({
                            expectedBizCode,
                            force: isAdzoneListPlaceholderForSync(adzoneList) || (isDisplayBizCode && !isDisplayAdzoneList(adzoneList))
                        });
                        if (Array.isArray(nativeAdzoneList) && nativeAdzoneList.length) {
                            adzoneList = normalizeAdzoneListForAdvanced(JSON.stringify(nativeAdzoneList));
                        }
                    }
                    if (
                        !adzoneList.length
                        || isAdzoneListPlaceholderForSync(adzoneList)
                        || (isDisplayBizCode && !isDisplayAdzoneList(adzoneList))
                    ) {
                        const nativeDefaults = await loadNativeAdvancedDefaultsSnapshot();
                        if (Array.isArray(nativeDefaults?.adzoneList) && nativeDefaults.adzoneList.length) {
                            adzoneList = normalizeAdzoneListForAdvanced(JSON.stringify(nativeDefaults.adzoneList));
                        }
                    }
                    if (
                        !adzoneList.length
                        || isAdzoneListPlaceholderForSync(adzoneList)
                        || (isDisplayBizCode && !isDisplayAdzoneList(adzoneList))
                    ) {
                        if (isDisplayBizCode) {
                            adzoneList = [
                                {
                                    adzoneCode: 'DISPLAY_INFOFLOW_GROUP',
                                    adzoneId: '115027450244',
                                    adzoneName: '淘系信息流',
                                    resourceName: '覆盖首页猜你喜欢、购中购后猜你喜欢、红包权益、菜鸟等站内外消费者购物全路径信息流',
                                    status: '1',
                                    discount: 100,
                                    fitDiscount: 100,
                                    onlyShow: true
                                },
                                {
                                    adzoneCode: 'DISPLAY_GUESS',
                                    adzoneId: '111287850195',
                                    parentAdoneId: '115027450244',
                                    adzoneName: '首页猜你喜欢',
                                    resourceName: '淘内无线和PC的首页猜你喜欢信息流',
                                    status: '1',
                                    discount: 200,
                                    fitDiscount: 200
                                },
                                {
                                    adzoneCode: 'DISPLAY_FULL_SCREEN',
                                    adzoneId: '111287850198',
                                    parentAdoneId: '115027450244',
                                    adzoneName: '全屏微详情',
                                    resourceName: '首页及购中后的全屏微详情场景',
                                    status: '1',
                                    discount: 100,
                                    fitDiscount: 100
                                },
                                {
                                    adzoneCode: 'DISPLAY_POST_PURCHASE',
                                    adzoneId: '115025700386',
                                    parentAdoneId: '115027450244',
                                    adzoneName: '购中购后猜你喜欢',
                                    resourceName: '淘内无线和PC的订单列表页等购中购后猜你喜欢信息流',
                                    status: '1',
                                    discount: 100,
                                    fitDiscount: 100
                                },
                                {
                                    adzoneCode: 'DISPLAY_RETARGET',
                                    adzoneId: '115031250425',
                                    adzoneName: '信息流人群追投',
                                    resourceName: '在搜索渠道对信息流触达人群进行追投，同时探索搜索优质人群，提高转化效率',
                                    status: '1'
                                }
                            ];
                        }
                    }
                    if (!adzoneList.length || isAdzoneListPlaceholderForSync(adzoneList)) {
                        adzoneList = [
                            {
                                adzoneCode: 'DEFAULT_SEARCH',
                                adzoneName: '淘宝搜索',
                                resourceName: '移动设备（含销量明星）、计算机设备',
                                status: '1'
                            },
                            {
                                adzoneCode: 'DEFAULT_SEARCH_CHAIN',
                                adzoneName: '搜索意图全链路投',
                                resourceName: '移动设备（含销量明星）、计算机设备',
                                status: '1'
                            }
                        ];
                    }
                    const clampAdzoneDiscount = (value = 100, fallback = 100) => {
                        const numeric = toNumber(value, toNumber(fallback, 100));
                        if (!Number.isFinite(numeric)) return 100;
                        return Math.max(0, Math.min(300, Math.round(numeric)));
                    };
                    const resolveAdzoneDiscountValue = (item = {}) => {
                        if (!isPlainObject(item)) return NaN;
                        return toNumber(
                            item.discount
                            ?? item.adzoneDiscount
                            ?? item.premium
                            ?? item.ratio
                            ?? item.rate
                            ?? item.bidRate
                            ?? item.price?.discount
                            ?? item.price?.price
                            ?? item.properties?.discount,
                            NaN
                        );
                    };
                    const resolveAdzoneSuggestedDiscount = (item = {}, fallback = 100) => clampAdzoneDiscount(
                        toNumber(
                            item.suggestDiscount
                            ?? item.recommendDiscount
                            ?? item.fitDiscount
                            ?? item.defaultDiscount
                            ?? item.suggestedDiscount
                            ?? item.def
                            ?? item.properties?.recommendDiscount
                            ?? item.properties?.fitDiscount
                            ?? fallback,
                            fallback
                        ),
                        fallback
                    );
                    const hasAdzoneDiscountField = (item = {}) => (
                        isPlainObject(item)
                        && (
                            hasOwn(item, 'discount')
                            || hasOwn(item, 'adzoneDiscount')
                            || hasOwn(item, 'premium')
                            || hasOwn(item, 'ratio')
                            || hasOwn(item, 'rate')
                            || hasOwn(item, 'bidRate')
                            || hasOwn(item, 'suggestDiscount')
                            || hasOwn(item, 'recommendDiscount')
                            || hasOwn(item, 'fitDiscount')
                            || hasOwn(item, 'defaultDiscount')
                            || hasOwn(item, 'suggestedDiscount')
                            || hasOwn(item, 'def')
                            || hasOwn(item, 'price')
                        )
                    );
                    const normalizeAdzonePremiumRows = (list = []) => {
                        const normalized = Array.isArray(list)
                            ? list.filter(item => isPlainObject(item))
                            : [];
                        const parentCodeSet = new Set(
                            normalized
                                .map((item) => normalizeSceneSettingValue(
                                    item?.parentAdoneId
                                    || item?.parentAdzoneId
                                    || item?.properties?.parentAdoneId
                                    || item?.properties?.parentAdzoneId
                                    || ''
                                ))
                                .filter(Boolean)
                        );
                        return normalized.map((item, idx) => {
                            const name = getAdzoneDisplayName(item, idx);
                            const desc = getAdzoneDisplayDesc(item) || '移动设备（含销量明星）、计算机设备';
                            const discountSeed = resolveAdzoneDiscountValue(item);
                            const hasDiscount = Number.isFinite(discountSeed);
                            const suggestedDiscount = resolveAdzoneSuggestedDiscount(item, hasDiscount ? discountSeed : 100);
                            const discount = clampAdzoneDiscount(hasDiscount ? discountSeed : suggestedDiscount, suggestedDiscount);
                            const enabled = isAdzoneStatusEnabled(item);
                            const text = `${name} ${desc}`;
                            const code = normalizeSceneSettingValue(
                                item?.adzoneCode
                                || item?.adzoneId
                                || item?.code
                                || item?.id
                                || ''
                            );
                            const hasChildren = !!(code && parentCodeSet.has(code));
                            const onlyShowRaw = item?.onlyShow ?? item?.properties?.onlyShow;
                            const onlyShow = onlyShowRaw === true
                                || /^(1|true|yes|on)$/i.test(String(onlyShowRaw || '').trim());
                            const switchHint = /追投|开关|switch|开\/关/i.test(text);
                            const maybeGroup = hasChildren || onlyShow;
                            const switchOnly = !maybeGroup && (
                                switchHint
                                || (
                                    !hasDiscount
                                    && !hasAdzoneDiscountField(item)
                                    && !/猜你喜欢|微详情|购中购后/.test(text)
                                )
                            );
                            const rowType = maybeGroup ? 'group' : (switchOnly ? 'switch' : 'premium');
                            const keySeed = normalizeSceneSettingValue(
                                item?.adzoneCode
                                || item?.adzoneId
                                || item?.id
                                || name
                            ) || `adzone_${idx + 1}`;
                            return {
                                raw: deepClone(item),
                                key: `${keySeed}_${idx}`,
                                rowType,
                                name,
                                desc,
                                enabled,
                                discount,
                                suggestedDiscount
                            };
                        });
                    };
                    const writeAdzoneDiscountToRaw = (raw = {}, value = 100) => {
                        const next = isPlainObject(raw) ? deepClone(raw) : {};
                        const normalizedValue = clampAdzoneDiscount(value, 100);
                        if (
                            hasOwn(next, 'discount')
                            || (!hasOwn(next, 'adzoneDiscount')
                                && !hasOwn(next, 'premium')
                                && !hasOwn(next, 'ratio')
                                && !hasOwn(next, 'rate')
                                && !hasOwn(next, 'bidRate'))
                        ) {
                            next.discount = normalizedValue;
                            return next;
                        }
                        if (hasOwn(next, 'adzoneDiscount')) {
                            next.adzoneDiscount = normalizedValue;
                        } else if (hasOwn(next, 'premium')) {
                            next.premium = normalizedValue;
                        } else if (hasOwn(next, 'ratio')) {
                            next.ratio = normalizedValue;
                        } else if (hasOwn(next, 'rate')) {
                            next.rate = normalizedValue;
                        } else if (hasOwn(next, 'bidRate')) {
                            next.bidRate = normalizedValue;
                        } else {
                            next.discount = normalizedValue;
                        }
                        return next;
                    };
                    let currentRows = normalizeAdzonePremiumRows(adzoneList);
                    if (!currentRows.length) return null;
                    const batchDefaultValue = currentRows.find(row => row.rowType === 'premium')?.discount ?? '';
                    const result = await openScenePopupDialog({
                        title: '资源位溢价',
                        dialogClassName: 'am-wxt-scene-popup-dialog-advanced',
                        closeLabel: '×',
                        cancelLabel: '取消',
                        saveLabel: '确定',
                        bodyHtml: `
                            <div class="am-wxt-scene-adzone-premium-shell">
                                <div class="am-wxt-scene-popup-tips">您可以在“手动出价”模式下，对部分资源位进行溢价，有助于在这些资源位拿量。若溢价设置为 0，则表示不对该资源位溢价。</div>
                                <div class="am-wxt-scene-adzone-premium-batch">
                                    <span>批量修改为</span>
                                    <input
                                        type="number"
                                        min="0"
                                        max="300"
                                        step="1"
                                        value="${Utils.escapeHtml(String(batchDefaultValue))}"
                                        data-scene-popup-adzone-discount-batch-input="1"
                                        placeholder="请输入"
                                    />
                                    <span>%</span>
                                    <button type="button" class="am-wxt-btn" data-scene-popup-adzone-discount-batch-apply="1">批量应用</button>
                                </div>
                                <div class="am-wxt-scene-adzone-premium-hot">
                                    <span class="tag">HOT</span>
                                    <span class="text">AI大模型升级，首页猜你喜欢推广效果平均提升15%+，核心资源位曝光平均占比60%+</span>
                                    <a href="https://alidocs.dingtalk.com/i/nodes/NZQYprEoWoxKPoqwCPkEpZ2BV1waOeDk?utm_scene=team_space" target="_blank" rel="noopener noreferrer">查看介绍</a>
                                </div>
                                <div class="am-wxt-scene-advanced-adzone-table" data-scene-popup-adzone-table="1">
                                    <div class="am-wxt-scene-advanced-adzone-head">
                                        <span>资源位</span>
                                        <span>操作</span>
                                    </div>
                                    <div class="am-wxt-scene-advanced-adzone-list" data-scene-popup-adzone-list="1"></div>
                                </div>
                            </div>
                        `,
                        onMounted: (mask) => {
                            const adzoneListEl = mask.querySelector('[data-scene-popup-adzone-list]');
                            const batchInput = mask.querySelector('[data-scene-popup-adzone-discount-batch-input="1"]');
                            const renderAdzoneList = () => {
                                if (!(adzoneListEl instanceof HTMLElement)) return;
                                adzoneListEl.innerHTML = currentRows.map((row, idx) => {
                                    const name = row.name || `资源位${idx + 1}`;
                                    const desc = row.desc || '移动设备（含销量明星）、计算机设备';
                                    if (row.rowType === 'group') {
                                        return `
                                            <div class="am-wxt-scene-advanced-adzone-row">
                                                <div class="am-wxt-scene-advanced-adzone-cell">
                                                    <div class="am-wxt-scene-advanced-adzone-name">${Utils.escapeHtml(name)}</div>
                                                    <div class="am-wxt-scene-advanced-adzone-desc">${Utils.escapeHtml(desc)}</div>
                                                </div>
                                                <div class="am-wxt-scene-adzone-premium-op">
                                                    <button
                                                        type="button"
                                                        class="am-wxt-site-switch ${row.enabled ? 'is-on' : 'is-off'}"
                                                        data-scene-popup-adzone-row-toggle="${idx}"
                                                        aria-pressed="${row.enabled ? 'true' : 'false'}"
                                                    >
                                                        <span class="am-wxt-site-switch-handle"></span>
                                                        <span class="am-wxt-site-switch-state">${row.enabled ? '开' : '关'}</span>
                                                    </button>
                                                </div>
                                            </div>
                                        `;
                                    }
                                    if (row.rowType === 'switch') {
                                        return `
                                            <div class="am-wxt-scene-advanced-adzone-row">
                                                <div class="am-wxt-scene-advanced-adzone-cell">
                                                    <div class="am-wxt-scene-advanced-adzone-name">${Utils.escapeHtml(name)}</div>
                                                    <div class="am-wxt-scene-advanced-adzone-desc">${Utils.escapeHtml(desc)}</div>
                                                </div>
                                                <div class="am-wxt-scene-adzone-premium-op">
                                                    <button
                                                        type="button"
                                                        class="am-wxt-site-switch ${row.enabled ? 'is-on' : 'is-off'}"
                                                        data-scene-popup-adzone-row-toggle="${idx}"
                                                        aria-pressed="${row.enabled ? 'true' : 'false'}"
                                                    >
                                                        <span class="am-wxt-site-switch-handle"></span>
                                                        <span class="am-wxt-site-switch-state">${row.enabled ? '开' : '关'}</span>
                                                    </button>
                                                </div>
                                            </div>
                                        `;
                                    }
                                    return `
                                        <div class="am-wxt-scene-advanced-adzone-row">
                                            <div class="am-wxt-scene-advanced-adzone-cell">
                                                <div class="am-wxt-scene-advanced-adzone-name">${Utils.escapeHtml(name)}</div>
                                                <div class="am-wxt-scene-advanced-adzone-desc">${Utils.escapeHtml(desc)}</div>
                                            </div>
                                            <div class="am-wxt-scene-adzone-premium-op">
                                                <div class="am-wxt-scene-adzone-premium-input-wrap">
                                                    <span>溢价比例</span>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="300"
                                                        step="1"
                                                        value="${Utils.escapeHtml(String(clampAdzoneDiscount(row.discount, row.suggestedDiscount)))}"
                                                        data-scene-popup-adzone-discount="${idx}"
                                                    />
                                                    <span>%</span>
                                                </div>
                                                <div class="am-wxt-scene-adzone-premium-suggest">建议溢价${Utils.escapeHtml(String(clampAdzoneDiscount(row.suggestedDiscount, 100)))}%</div>
                                            </div>
                                        </div>
                                    `;
                                }).join('');
                            };
                            const applyBatchDiscount = () => {
                                if (!(batchInput instanceof HTMLInputElement)) return;
                                const fallbackValue = currentRows.find(row => row.rowType === 'premium')?.discount ?? 100;
                                const nextValue = clampAdzoneDiscount(batchInput.value, fallbackValue);
                                batchInput.value = String(nextValue);
                                let changed = false;
                                currentRows = currentRows.map((row) => {
                                    if (row.rowType !== 'premium') return row;
                                    changed = true;
                                    return {
                                        ...row,
                                        enabled: true,
                                        discount: nextValue
                                    };
                                });
                                if (!changed) {
                                    appendWizardLog('当前资源位不支持批量溢价设置', 'error');
                                    return;
                                }
                                renderAdzoneList();
                            };
                            renderAdzoneList();
                            mask.addEventListener('click', (event) => {
                                const target = event.target instanceof HTMLElement ? event.target : null;
                                if (!(target instanceof HTMLElement)) return;
                                const batchApplyBtn = target.closest('[data-scene-popup-adzone-discount-batch-apply]');
                                if (batchApplyBtn instanceof HTMLElement) {
                                    applyBatchDiscount();
                                    return;
                                }
                                const rowBtn = target.closest('[data-scene-popup-adzone-row-toggle]');
                                if (!(rowBtn instanceof HTMLElement)) return;
                                const index = toNumber(rowBtn.getAttribute('data-scene-popup-adzone-row-toggle'), -1);
                                if (!Number.isFinite(index) || index < 0 || index >= currentRows.length) return;
                                const rowType = String(currentRows[index]?.rowType || '').trim();
                                if (rowType !== 'switch' && rowType !== 'group') return;
                                const nextMode = String(rowBtn.getAttribute('data-scene-popup-adzone-next') || '').trim();
                                const nextEnabled = nextMode
                                    ? nextMode !== 'off'
                                    : !(currentRows[index]?.enabled !== false);
                                currentRows[index] = {
                                    ...currentRows[index],
                                    enabled: nextEnabled
                                };
                                renderAdzoneList();
                            });
                            if (adzoneListEl instanceof HTMLElement) {
                                adzoneListEl.addEventListener('change', (event) => {
                                    const input = event.target instanceof HTMLElement
                                        ? event.target.closest('[data-scene-popup-adzone-discount]')
                                        : null;
                                    if (!(input instanceof HTMLInputElement)) return;
                                    const index = toNumber(input.getAttribute('data-scene-popup-adzone-discount'), -1);
                                    if (!Number.isFinite(index) || index < 0 || index >= currentRows.length) return;
                                    if (currentRows[index]?.rowType !== 'premium') return;
                                    const fallbackValue = currentRows[index]?.suggestedDiscount ?? 100;
                                    const nextDiscount = clampAdzoneDiscount(input.value, fallbackValue);
                                    currentRows[index] = {
                                        ...currentRows[index],
                                        enabled: true,
                                        discount: nextDiscount
                                    };
                                    input.value = String(nextDiscount);
                                });
                            }
                            if (batchInput instanceof HTMLInputElement) {
                                batchInput.addEventListener('keydown', (event) => {
                                    if (event.key !== 'Enter') return;
                                    event.preventDefault();
                                    applyBatchDiscount();
                                });
                            }
                            mask._sceneAdzonePremiumState = {
                                getRows: () => currentRows.map(row => ({
                                    ...row,
                                    raw: deepClone(row.raw)
                                }))
                            };
                        },
                        onSave: (mask) => {
                            const state = mask._sceneAdzonePremiumState || {};
                            const rows = typeof state.getRows === 'function'
                                ? state.getRows()
                                : [];
                            const adzoneOutput = Array.isArray(rows)
                                ? rows
                                    .map((row) => {
                                        const raw = isPlainObject(row?.raw) ? deepClone(row.raw) : {};
                                        const rowType = String(row?.rowType || '').trim() || 'premium';
                                        if (rowType === 'group') {
                                            return setAdzoneStatus(raw, row?.enabled !== false);
                                        }
                                        if (rowType === 'switch') {
                                            return setAdzoneStatus(raw, row?.enabled !== false);
                                        }
                                        const next = writeAdzoneDiscountToRaw(raw, row?.discount);
                                        return setAdzoneStatus(next, row?.enabled !== false);
                                    })
                                    .filter(item => isPlainObject(item))
                                : [];
                            const adzoneRaw = JSON.stringify(adzoneOutput);
                            const isDefaultMode = Array.isArray(rows) && rows.every((row) => {
                                const rowType = String(row?.rowType || '').trim() || 'premium';
                                if (rowType === 'group') return row?.enabled !== false;
                                if (rowType === 'switch') return row?.enabled !== false;
                                return row?.enabled !== false
                                    && clampAdzoneDiscount(row?.discount, 100) === clampAdzoneDiscount(row?.suggestedDiscount, 100);
                            });
                            return {
                                ok: true,
                                adzoneRaw,
                                summary: describeAdzoneSummary(adzoneRaw),
                                isDefaultMode
                            };
                        }
                    });
                    if (!result || result.ok !== true) return null;
                    return {
                        ok: true,
                        result,
                        adzoneControl
                    };
                };

