            const setCandidateSource = (source = 'all') => {
                wizardState.candidateSource = source === 'recommend' ? 'recommend' : 'all';
                if (wizardState.els.hotBtn) {
                    wizardState.els.hotBtn.classList.toggle('primary', wizardState.candidateSource === 'recommend');
                }
                if (wizardState.els.allBtn) {
                    wizardState.els.allBtn.classList.toggle('primary', wizardState.candidateSource === 'all');
                }
            };

            const renderCrowdList = () => {
                if (!wizardState.els.crowdList || !wizardState.els.crowdCount) return;
                wizardState.els.crowdCount.textContent = String(wizardState.crowdList.length);
                wizardState.els.crowdList.innerHTML = '';
                if (!wizardState.crowdList.length) {
                    wizardState.els.crowdList.innerHTML = '<div class="am-wxt-crowd-item"><span>未设置人群（默认不限）</span></div>';
                    return;
                }
                wizardState.crowdList.forEach((crowdItem, idx) => {
                    const row = document.createElement('div');
                    row.className = 'am-wxt-crowd-item';
                    const labelId = crowdItem?.crowd?.label?.labelId || '';
                    row.innerHTML = `
                        <span>${Utils.escapeHtml(getCrowdDisplayName(crowdItem))}${labelId ? `（${Utils.escapeHtml(labelId)}）` : ''}</span>
                        <button class="am-wxt-btn">移除</button>
                    `;
                    const removeBtn = row.querySelector('button');
                    removeBtn.onclick = () => {
                        wizardState.crowdList = wizardState.crowdList.filter((_, i) => i !== idx);
                        commitCrowdUiState({ refreshPreview: false });
                    };
                    wizardState.els.crowdList.appendChild(row);
                });
            };

            const renderCandidateList = (options = {}) => {
                const preserveScroll = options && options.preserveScroll === true;
                const addedSet = new Set(wizardState.addedItems.map(item => String(item.materialId)));
                const candidateListEl = wizardState.els.candidateList;
                const previousScrollTop = preserveScroll ? candidateListEl.scrollTop : 0;
                candidateListEl.innerHTML = '';
                if (!wizardState.candidates.length) {
                    candidateListEl.innerHTML = '<div class="am-wxt-item"><div class="name">暂无候选商品</div></div>';
                    return;
                }
                wizardState.candidates.forEach(item => {
                    const row = document.createElement('div');
                    row.className = 'am-wxt-item';
                    row.innerHTML = `
                        <div>
                            <div class="name">${Utils.escapeHtml(item.materialName || '(无标题商品)')}</div>
                            <div class="meta">宝贝ID：${Utils.escapeHtml(item.materialId)}</div>
                        </div>
                        <div class="actions">
                            <button class="am-wxt-btn">${addedSet.has(String(item.materialId)) ? '已添加' : '添加'}</button>
                        </div>
                    `;
                    const addBtn = row.querySelector('button');
                    addBtn.disabled = addedSet.has(String(item.materialId));
                    addBtn.onclick = () => {
                        if (wizardState.addedItems.length >= WIZARD_MAX_ITEMS) {
                            appendWizardLog(`最多添加 ${WIZARD_MAX_ITEMS} 个商品`, 'error');
                            return;
                        }
                        if (addedSet.has(String(item.materialId))) return;
                        wizardState.addedItems.push(item);
                        wizardState.addedItems = uniqueBy(wizardState.addedItems, x => String(x.materialId)).slice(0, WIZARD_MAX_ITEMS);
                        commitItemSelectionUiState({
                            renderAdded: true,
                            renderCandidate: true
                        });
                    };
                    candidateListEl.appendChild(row);
                });
                if (preserveScroll) {
                    const maxScrollTop = Math.max(0, candidateListEl.scrollHeight - candidateListEl.clientHeight);
                    candidateListEl.scrollTop = Math.min(previousScrollTop, maxScrollTop);
                }
            };

            const syncItemPickerAddedListViewport = () => {
                const addedListEl = wizardState?.els?.addedList;
                if (!(addedListEl instanceof HTMLElement)) return;
                const clearCompactViewport = () => {
                    addedListEl.style.removeProperty('height');
                    addedListEl.style.removeProperty('max-height');
                    addedListEl.style.removeProperty('scrollbar-gutter');
                    addedListEl.style.removeProperty('visibility');
                };
                const keywordModal = addedListEl.closest('#am-wxt-keyword-modal');
                if (!(keywordModal instanceof HTMLElement)) {
                    addedListEl.style.removeProperty('visibility');
                    return;
                }
                if (wizardState.candidateListExpanded === true || wizardState.addedItems.length <= 0) {
                    clearCompactViewport();
                    return;
                }
                const compactHeight = 168;
                addedListEl.style.height = `${compactHeight}px`;
                addedListEl.style.maxHeight = `${compactHeight}px`;
                addedListEl.style.scrollbarGutter = 'stable';
                addedListEl.scrollTop = 0;
                addedListEl.style.visibility = 'visible';
                if (wizardState?.els?.itemSplit instanceof HTMLElement) {
                    wizardState.els.itemSplit.scrollTop = 0;
                }
            };

            const renderAddedList = () => {
                wizardState.els.addedCount.textContent = String(wizardState.addedItems.length);
                wizardState.els.addedList.innerHTML = '';
                if (!wizardState.addedItems.length) {
                    wizardState.els.addedList.innerHTML = '<div class="am-wxt-item"><div class="name">请点击上方“添加商品”按钮</div></div>';
                    syncItemPickerAddedListViewport();
                    return;
                }
                wizardState.addedItems.forEach((item, idx) => {
                    const row = document.createElement('div');
                    row.className = 'am-wxt-item';
                    row.innerHTML = `
                        <div>
                            <div class="name">${Utils.escapeHtml(item.materialName || '(无标题商品)')}</div>
                            <div class="meta">宝贝ID：${Utils.escapeHtml(item.materialId)}</div>
                        </div>
                        <div class="actions">
                            <button class="am-wxt-btn">上移</button>
                            <button class="am-wxt-btn">下移</button>
                            <button class="am-wxt-btn">移除</button>
                        </div>
                    `;
                    const [upBtn, downBtn, removeBtn] = row.querySelectorAll('button');
                    upBtn.disabled = idx === 0;
                    downBtn.disabled = idx === wizardState.addedItems.length - 1;
                    upBtn.onclick = () => {
                        if (idx === 0) return;
                        const clone = wizardState.addedItems.slice();
                        [clone[idx - 1], clone[idx]] = [clone[idx], clone[idx - 1]];
                        wizardState.addedItems = clone;
                        commitItemSelectionUiState({ renderAdded: true });
                    };
                    downBtn.onclick = () => {
                        if (idx >= wizardState.addedItems.length - 1) return;
                        const clone = wizardState.addedItems.slice();
                        [clone[idx + 1], clone[idx]] = [clone[idx], clone[idx + 1]];
                        wizardState.addedItems = clone;
                        commitItemSelectionUiState({ renderAdded: true });
                    };
                    removeBtn.onclick = () => {
                        wizardState.addedItems = wizardState.addedItems.filter((_, i) => i !== idx);
                        commitItemSelectionUiState({
                            renderAdded: true,
                            renderCandidate: true
                        });
                    };
                    wizardState.els.addedList.appendChild(row);
                });
                syncItemPickerAddedListViewport();
            };
            const filterCandidateListByQuery = (list = [], query = '') => {
                const normalizedQuery = String(query || '').trim().toLowerCase();
                if (!normalizedQuery) return Array.isArray(list) ? list : [];
                const queryTokens = uniqueBy(
                    normalizedQuery
                        .split(/[\s,，]+/g)
                        .map(token => String(token || '').trim())
                        .filter(Boolean),
                    token => token
                );
                if (!queryTokens.length) return Array.isArray(list) ? list : [];
                const idTokens = queryTokens.filter(token => /^\d{4,}$/.test(token));
                const textTokens = queryTokens.filter(token => !/^\d{4,}$/.test(token));
                return (Array.isArray(list) ? list : []).filter((item) => {
                    const itemId = String(toIdValue(item?.materialId || item?.itemId || '')).trim();
                    const name = String(item?.materialName || item?.title || item?.name || '').trim().toLowerCase();
                    const haystack = `${name} ${itemId}`.trim();
                    const textMatched = !textTokens.length || textTokens.every(token => haystack.includes(token));
                    const idMatched = !idTokens.length || idTokens.some(token => itemId.includes(token));
                    return textMatched && idMatched;
                });
            };

            const loadCandidates = async (query = '', source = wizardState.candidateSource || 'all') => {
                const normalizedQuery = String(query || '').trim();
                const effectiveSource = normalizedQuery ? 'all' : source;
                const requestToken = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
                wizardState.candidateLoadToken = requestToken;
                setCandidateSource(effectiveSource);
                wizardState.els.candidateList.innerHTML = '<div class="am-wxt-item"><div class="name">正在加载候选商品...</div></div>';
                try {
                    const useAll = wizardState.candidateSource === 'all';
                    const res = await searchItems({
                        bizCode: wizardState.draft?.bizCode || DEFAULTS.bizCode,
                        promotionScene: wizardState.draft?.promotionScene || DEFAULTS.promotionScene,
                        query: normalizedQuery,
                        pageSize: 40,
                        tagId: useAll ? null : '101111310',
                        channelKey: useAll ? '' : (normalizedQuery ? '' : 'effect')
                    });
                    if (wizardState.candidateLoadToken !== requestToken) return;
                    const remoteList = Array.isArray(res.list) ? res.list : [];
                    const filteredList = normalizedQuery
                        ? filterCandidateListByQuery(remoteList, normalizedQuery)
                        : remoteList;
                    wizardState.candidates = filteredList;
                    renderItemSelectionLists({
                        renderAdded: false,
                        renderCandidate: true
                    });
                    const sourceLabel = useAll ? '全部商品' : '机会品推荐';
                    const countLabel = normalizedQuery && filteredList.length !== remoteList.length
                        ? `${filteredList.length}（接口返回 ${remoteList.length}）`
                        : String(filteredList.length);
                    appendWizardLog(`候选商品已加载 ${countLabel} 条（${sourceLabel}${normalizedQuery ? `，关键词：${normalizedQuery}` : ''}）`, 'success');
                } catch (err) {
                    if (wizardState.candidateLoadToken !== requestToken) return;
                    wizardState.candidates = [];
                    renderItemSelectionLists({
                        renderAdded: false,
                        renderCandidate: true
                    });
                    appendWizardLog(`加载候选商品失败：${err?.message || err}`, 'error');
                }
            };

