                const openKeywordTrendThemeSettingPopup = async (options = {}) => {
                    const popupOptions = isPlainObject(options) ? options : {};
                    const isDetachedTrendThemePopup = popupOptions.detached === true
                        || typeof popupOptions.onSave === 'function';
                    const trendThemeControl = resolveScenePopupControl('campaign.trendThemeList', 'trendTheme');
                    if (!(trendThemeControl instanceof HTMLInputElement) && !isDetachedTrendThemePopup) return null;
                    const runtime = await getRuntimeDefaults(false).catch(() => ({}));
                    const expectedBizCode = normalizeSceneBizCode(
                        wizardState?.draft?.bizCode
                        || runtime?.bizCode
                        || parseRouteParamFromHash('bizCode')
                        || DEFAULTS.bizCode
                    ) || DEFAULTS.bizCode;
                    const initialTrendThemeRaw = normalizeSceneSettingValue(
                        popupOptions.initialRaw
                        || popupOptions.trendThemeRaw
                        || popupOptions.value
                        || ''
                    ) || (trendThemeControl instanceof HTMLInputElement ? trendThemeControl.value : '[]') || '[]';
                    let selectedThemes = normalizeTrendThemeList(initialTrendThemeRaw, 6);
                    let defaultThemes = [];
                    let candidateThemes = selectedThemes;
                    let rankThemeMap = {
                        trend: [],
                        effect: [],
                        traffic: []
                    };
                    const associationThemeCache = new Map();
                    const fetchAssociationThemes = async (query = '') => {
                        const normalizedQuery = normalizeSceneSettingValue(query);
                        if (!normalizedQuery) return [];
                        const cacheKey = normalizedQuery.toLowerCase();
                        if (associationThemeCache.has(cacheKey)) {
                            return associationThemeCache.get(cacheKey) || [];
                        }
                        try {
                            const response = await requestOne('/trendtheme/themeAssociation.json', expectedBizCode, {
                                bizCode: expectedBizCode,
                                query: normalizedQuery
                            }, {});
                            const list = normalizeTrendThemeList(collectTrendThemeResponseList(response), 120);
                            associationThemeCache.set(cacheKey, list);
                            return list;
                        } catch (err) {
                            log.warn('加载趋势主题联想失败:', err?.message || err);
                            associationThemeCache.set(cacheKey, []);
                            return [];
                        }
                    };
                    const resolveTrendAssociationItemId = (item = {}) => String(
                        toIdValue(item?.materialId || item?.itemId || item?.id || item?.auctionId || '')
                    ).trim();
                    const resolveTrendAssociationItemPic = (item = {}) => {
                        const raw = isPlainObject(item?.raw) ? item.raw : {};
                        return normalizeSceneSettingValue(
                            item?.picUrl
                            || item?.imgUrl
                            || item?.imageUrl
                            || item?.pictUrl
                            || item?.itemPicUrl
                            || item?.materialPicUrl
                            || item?.materialImageUrl
                            || item?.mainPic
                            || raw?.picUrl
                            || raw?.imgUrl
                            || raw?.imageUrl
                            || raw?.pictUrl
                            || raw?.itemPicUrl
                            || raw?.materialPicUrl
                            || raw?.materialImageUrl
                            || raw?.mainPic
                            || ''
                        );
                    };
                    const normalizeTrendAssociationItem = (item = null) => {
                        if (!isPlainObject(item)) return null;
                        const normalized = normalizeItem(item);
                        const itemId = resolveTrendAssociationItemId(normalized) || resolveTrendAssociationItemId(item);
                        if (!/^\d{4,}$/.test(itemId)) return null;
                        const raw = isPlainObject(item.raw) ? item.raw : {};
                        const materialName = normalizeSceneSettingValue(
                            normalized.materialName
                            || item?.materialName
                            || item?.title
                            || item?.name
                            || raw?.materialName
                            || raw?.title
                            || raw?.name
                            || ''
                        ) || `宝贝${itemId}`;
                        return {
                            ...normalized,
                            materialId: itemId,
                            itemId,
                            materialName,
                            picUrl: resolveTrendAssociationItemPic(item) || resolveTrendAssociationItemPic(normalized)
                        };
                    };
                    const uniqueTrendAssociationItems = (list = [], limit = 120) => uniqueBy(
                        (Array.isArray(list) ? list : [])
                            .map(item => normalizeTrendAssociationItem(item))
                            .filter(Boolean),
                        item => resolveTrendAssociationItemId(item)
                    ).slice(0, limit);
                    const collectTrendAssociationItemResponseList = (response = {}) => {
                        const data = isPlainObject(response?.data) ? response.data : {};
                        const nestedData = isPlainObject(data?.data) ? data.data : {};
                        const candidates = [
                            data.list,
                            data.itemList,
                            data.records,
                            data.result,
                            data.resultList,
                            data.items,
                            nestedData.list,
                            nestedData.itemList,
                            nestedData.records,
                            response?.list,
                            response?.itemList
                        ];
                        const list = candidates.find(item => Array.isArray(item));
                        return Array.isArray(list) ? list : [];
                    };
                    const filterTrendAssociationItems = (list = [], query = '') => {
                        const normalizedQuery = normalizeSceneSettingValue(query).toLowerCase();
                        if (!normalizedQuery) return Array.isArray(list) ? list : [];
                        const tokens = uniqueBy(
                            normalizedQuery.split(/[\s,，]+/g).map(token => token.trim()).filter(Boolean),
                            token => token
                        );
                        if (!tokens.length) return Array.isArray(list) ? list : [];
                        return (Array.isArray(list) ? list : []).filter((item) => {
                            const haystack = [
                                item?.materialName,
                                item?.itemId,
                                item?.materialId
                            ].map(value => normalizeSceneSettingValue(value).toLowerCase()).join(' ');
                            return tokens.every(token => haystack.includes(token));
                        });
                    };
                    const resolveTrendAssociationItemQuery = (item = {}) => normalizeSceneSettingValue(
                        item?.materialName || item?.title || item?.name || item?.itemId || item?.materialId || ''
                    );
                    const normalizeTrendAssociationQueryCandidate = (query = '') => normalizeSceneSettingValue(query)
                        .replace(/[｜|【】\[\]（）()「」《》,，;；:：]/g, ' ')
                        .replace(/\s+/g, ' ')
                        .trim();
                    const TREND_ASSOCIATION_CORE_TERMS = [
                        '消毒碗柜',
                        '嵌入式消毒柜',
                        '嵌入式洗碗机',
                        '台式洗碗机',
                        '水槽洗碗机',
                        '全自动洗碗机',
                        '家用洗碗机',
                        '洗碗机',
                        '消毒柜',
                        '洗碗粉',
                        '洗碗块',
                        '清洁剂',
                        '空调',
                        '冰箱',
                        '洗衣机',
                        '烟机',
                        '灶具',
                        '热水器',
                        '净水器'
                    ];
                    const collectTrendAssociationThemeNames = () => uniqueBy(
                        []
                            .concat(selectedThemes || [])
                            .concat(defaultThemes || [])
                            .concat(candidateThemes || [])
                            .concat(rankThemeMap?.trend || [])
                            .concat(rankThemeMap?.effect || [])
                            .concat(rankThemeMap?.traffic || [])
                            .map(item => normalizeTrendAssociationQueryCandidate(item?.trendThemeName || item?.themeName || item?.name || ''))
                            .filter(item => item.length >= 2),
                        item => item.toLowerCase()
                    );
                    const buildTrendAssociationCoreQueries = (text = '') => {
                        const normalizedText = normalizeTrendAssociationQueryCandidate(text);
                        const haystack = normalizedText.toLowerCase();
                        if (!haystack) return [];
                        const themeMatches = collectTrendAssociationThemeNames()
                            .filter(name => haystack.includes(name.toLowerCase()))
                            .sort((left, right) => right.length - left.length);
                        const coreMatches = TREND_ASSOCIATION_CORE_TERMS
                            .filter(name => haystack.includes(name.toLowerCase()));
                        return uniqueBy(
                            themeMatches.concat(coreMatches),
                            item => item.toLowerCase()
                        ).slice(0, 8);
                    };
                    const fetchCompetitorAssociationItems = async (query = '') => {
                        const normalizedQuery = normalizeSceneSettingValue(query);
                        if (!normalizedQuery) return [];
                        const token = ensureTokens();
                        const params = new URLSearchParams();
                        params.set('csrfId', token.csrfId);
                        params.set('bizCode', expectedBizCode);
                        if (token.loginPointId) params.set('loginPointId', token.loginPointId);
                        const url = `https://ai.alimama.com/ai/common/searchItemPage.json?${params.toString()}`;
                        const payload = {
                            bizCode: expectedBizCode,
                            similarItemQueryStr: normalizedQuery,
                            offset: 0,
                            pageNo: 1,
                            pageSize: 80
                        };
                        const response = await API.request(url, payload, {
                            maxRetries: 1,
                            timeout: 15000
                        });
                        assertResponseOk(response, '/ai/common/searchItemPage.json');
                        return uniqueTrendAssociationItems(
                            collectTrendAssociationItemResponseList(response),
                            120
                        );
                    };
                    const nativeBundle = await fetchNativeTrendThemeBundle(expectedBizCode);
                    defaultThemes = normalizeTrendThemeList(nativeBundle.defaultList || [], 6);
                    if (!selectedThemes.length && defaultThemes.length) {
                        selectedThemes = defaultThemes.slice(0, 6);
                    }
                    rankThemeMap = {
                        trend: normalizeTrendThemeList(nativeBundle.trendRankList || nativeBundle.candidateList || [], 160),
                        effect: normalizeTrendThemeList(nativeBundle.effectRankList || nativeBundle.candidateList || [], 160),
                        traffic: normalizeTrendThemeList(nativeBundle.trafficRankList || nativeBundle.candidateList || [], 160)
                    };
                    const associationSeedQuery = normalizeSceneSettingValue(
                        selectedThemes[0]?.trendThemeName
                        || defaultThemes[0]?.trendThemeName
                        || ''
                    );
                    const associationThemes = associationSeedQuery
                        ? await fetchAssociationThemes(associationSeedQuery)
                        : [];
                    candidateThemes = uniqueTrendThemeList(
                        associationThemes
                            .concat(selectedThemes)
                            .concat(defaultThemes)
                            .concat(nativeBundle.candidateList || []),
                        160
                    );
                    let associationSearchType = 'keyword';
                    let associationKeyword = associationSeedQuery;
                    let associationSelectedItem = null;
                    let associationSelectedItemType = '';
                    let associationItemPanelType = '';
                    let associationItemSearchKeyword = '';
                    let associationItemLoadStatus = '';
                    let associationItemLoadToken = '';
                    let associationShopItems = uniqueTrendAssociationItems(
                        []
                            .concat(Array.isArray(wizardState?.addedItems) ? wizardState.addedItems : [])
                            .concat(Array.isArray(wizardState?.draft?.addedItems) ? wizardState.draft.addedItems : [])
                            .concat(Array.isArray(wizardState?.candidates) ? wizardState.candidates : []),
                        120
                    );
                    let associationCompetitorItems = [];
                    let associationSearchThemes = associationThemes;
                    let associationSearchStatus = associationSearchThemes.length
                        ? `搜索完毕，共找到${associationSearchThemes.length}个趋势热点`
                        : '输入关键词后深度搜索，或点击已选趋势快捷联想';
                    let associationQuickActiveQuery = associationSeedQuery;

                    const result = await openScenePopupDialog({
                        title: '选择趋势主题',
                        dialogClassName: 'am-wxt-scene-popup-dialog-filter am-wxt-scene-popup-dialog-trend-theme',
                        closeLabel: '×',
                        cancelLabel: '取消',
                        saveLabel: '确定',
                        saveFirst: true,
                        bodyHtml: `
                            <div class="am-wxt-scene-popup-tips">对齐原生“选择趋势主题”逻辑：最多 6 个，确认后写入 campaign.trendThemeList，最终创建计划按完整主题对象提交。</div>
                            <div class="am-wxt-scene-crowd-native-layout" data-scene-popup-trend-layout="1">
                                <section class="am-wxt-scene-crowd-native-left am-wxt-scene-trend-main">
                                    <div class="am-wxt-scene-crowd-native-tabs">
                                        <button type="button" class="am-wxt-scene-crowd-native-tab active">
                                            <span>趋势排行榜</span>
                                            <i>原生推荐</i>
                                        </button>
                                        <button type="button" class="am-wxt-scene-crowd-native-tab">
                                            <span>趋势AI联想</span>
                                        </button>
                                    </div>
                                    <div class="am-wxt-scene-crowd-native-toolbar">
                                        <input
                                            type="text"
                                            class="am-wxt-input"
                                            data-scene-popup-trend-search="1"
                                            placeholder="搜索趋势主题名称或ID"
                                        />
                                        <button type="button" class="am-wxt-btn" data-scene-popup-trend-refresh="1">刷新原生推荐</button>
                                        <button type="button" class="am-wxt-btn" data-scene-popup-trend-fill-default="1">补齐默认</button>
                                    </div>
                                    <div class="am-wxt-scene-trend-rank-board">
                                        <section class="am-wxt-scene-trend-rank-column" data-scene-popup-trend-rank-column="trend">
                                            <div class="am-wxt-scene-trend-rank-title">
                                                <strong>趋势红榜</strong>
                                                <small>提前布局新趋势赛道</small>
                                            </div>
                                            <div class="am-wxt-scene-trend-rank-content">
                                                <div class="am-wxt-scene-crowd-native-candidate-head am-wxt-scene-trend-candidate-head">
                                                    <span>
                                                        <label class="am-wxt-scene-trend-check">
                                                            <input type="checkbox" data-scene-popup-trend-select-all="trend" />
                                                            <span class="am-wxt-scene-trend-check-icon"></span>
                                                            <i>主题</i>
                                                        </label>
                                                    </span>
                                                    <span>趋势指数</span>
                                                    <span>推荐商品数</span>
                                                    <span>状态</span>
                                                </div>
                                                <div class="am-wxt-scene-crowd-native-candidate-list am-wxt-scene-trend-rank-list" data-scene-popup-trend-candidate-list="trend"></div>
                                            </div>
                                        </section>
                                        <section class="am-wxt-scene-trend-rank-column" data-scene-popup-trend-rank-column="effect">
                                            <div class="am-wxt-scene-trend-rank-title">
                                                <strong>效果红榜</strong>
                                                <small>助力店铺获得更多成交</small>
                                            </div>
                                            <div class="am-wxt-scene-trend-rank-content">
                                                <div class="am-wxt-scene-crowd-native-candidate-head am-wxt-scene-trend-candidate-head">
                                                    <span>
                                                        <label class="am-wxt-scene-trend-check">
                                                            <input type="checkbox" data-scene-popup-trend-select-all="effect" />
                                                            <span class="am-wxt-scene-trend-check-icon"></span>
                                                            <i>主题</i>
                                                        </label>
                                                    </span>
                                                    <span>投产指数</span>
                                                    <span>推荐商品数</span>
                                                    <span>标签</span>
                                                </div>
                                                <div class="am-wxt-scene-crowd-native-candidate-list am-wxt-scene-trend-rank-list" data-scene-popup-trend-candidate-list="effect"></div>
                                            </div>
                                        </section>
                                        <section class="am-wxt-scene-trend-rank-column" data-scene-popup-trend-rank-column="traffic">
                                            <div class="am-wxt-scene-trend-rank-title">
                                                <strong>流量红榜</strong>
                                                <small>流量潜力大，触达更多新客</small>
                                            </div>
                                            <div class="am-wxt-scene-trend-rank-content">
                                                <div class="am-wxt-scene-crowd-native-candidate-head am-wxt-scene-trend-candidate-head">
                                                    <span>
                                                        <label class="am-wxt-scene-trend-check">
                                                            <input type="checkbox" data-scene-popup-trend-select-all="traffic" />
                                                            <span class="am-wxt-scene-trend-check-icon"></span>
                                                            <i>主题</i>
                                                        </label>
                                                    </span>
                                                    <span>搜索指数</span>
                                                    <span>推荐商品数</span>
                                                    <span>标签</span>
                                                </div>
                                                <div class="am-wxt-scene-crowd-native-candidate-list am-wxt-scene-trend-rank-list" data-scene-popup-trend-candidate-list="traffic"></div>
                                            </div>
                                        </section>
                                    </div>
                                    <section class="am-wxt-scene-trend-association" data-scene-popup-trend-association="1">
                                        <div class="am-wxt-scene-trend-association-search">
                                            <div class="am-wxt-scene-trend-association-query">
                                                <span>通过</span>
                                                <label class="am-wxt-scene-trend-association-type active" data-scene-popup-trend-association-type="keyword">
                                                    <span>关键词</span>
                                                    <input
                                                        type="text"
                                                        data-scene-popup-trend-association-keyword-input="1"
                                                        placeholder="请输入"
                                                    />
                                                </label>
                                                <span>或</span>
                                                <button type="button" class="am-wxt-scene-trend-association-type" data-scene-popup-trend-association-type="shopItem">本店宝贝</button>
                                                <span>或</span>
                                                <button type="button" class="am-wxt-scene-trend-association-type" data-scene-popup-trend-association-type="competitorItem">竞店宝贝</button>
                                                <span>联想相关趋势主题</span>
                                                <em data-scene-popup-trend-association-picked="1"></em>
                                            </div>
                                            <div class="am-wxt-scene-trend-association-actions">
                                                <button type="button" class="am-wxt-btn" data-scene-popup-trend-association-search="1">深度搜索</button>
                                                <button type="button" class="am-wxt-scene-trend-association-arrow" data-scene-popup-trend-association-search-arrow="1">↑</button>
                                            </div>
                                        </div>
                                        <div class="am-wxt-scene-trend-association-item-panel hidden" data-scene-popup-trend-association-item-panel="1">
                                            <div class="am-wxt-scene-trend-association-item-head">
                                                <strong>宝贝/主体信息</strong>
                                                <label>
                                                    <span>搜索</span>
                                                    <input
                                                        type="text"
                                                        data-scene-popup-trend-association-item-search="1"
                                                        placeholder="宝贝标题"
                                                    />
                                                </label>
                                            </div>
                                            <div class="am-wxt-scene-trend-association-item-list" data-scene-popup-trend-association-item-list="1"></div>
                                        </div>
                                        <div class="am-wxt-scene-trend-association-quick">
                                            <span>快捷联想已选趋势：</span>
                                            <div data-scene-popup-trend-association-quick="1"></div>
                                        </div>
                                        <div class="am-wxt-scene-trend-association-status" data-scene-popup-trend-association-status="1"></div>
                                        <div class="am-wxt-scene-trend-association-table">
                                            <div class="am-wxt-scene-trend-association-head">
                                                <span>趋势主题</span>
                                                <span>推荐店铺商品数</span>
                                                <span>趋势指数</span>
                                                <span>搜索指数</span>
                                                <span>竞争热度</span>
                                                <span>收藏加购指数</span>
                                                <span>转化指数</span>
                                                <span>投产指数</span>
                                                <span>操作</span>
                                            </div>
                                            <div class="am-wxt-scene-trend-association-list" data-scene-popup-trend-association-list="1"></div>
                                        </div>
                                    </section>
                                    <div class="am-wxt-scene-trend-selected-dock" data-scene-popup-trend-selected-dock="1">
                                        <div class="am-wxt-scene-trend-selected-summary">
                                            <span>已选明星趋势主题 <b data-scene-popup-trend-selected-count="1">0</b>/6</span>
                                            <span>含相关宝贝 <b data-scene-popup-trend-selected-item-count="1">0</b></span>
                                            <a href="javascript:;" data-scene-popup-trend-clear="1">全部移除</a>
                                            <span class="am-wxt-scene-trend-selected-actions" data-scene-popup-trend-actions="1"></span>
                                        </div>
                                        <div class="am-wxt-scene-trend-selected-chip-list" data-scene-popup-trend-selected-list="1"></div>
                                    </div>
                                </section>
                            </div>
                        `,
                        onMounted: (mask) => {
                            const searchInput = mask.querySelector('[data-scene-popup-trend-search="1"]');
                            const refreshBtn = mask.querySelector('[data-scene-popup-trend-refresh="1"]');
                            const fillDefaultBtn = mask.querySelector('[data-scene-popup-trend-fill-default="1"]');
                            const selectedListEl = mask.querySelector('[data-scene-popup-trend-selected-list="1"]');
                            const selectedCountEl = mask.querySelector('[data-scene-popup-trend-selected-count="1"]');
                            const selectedItemCountEl = mask.querySelector('[data-scene-popup-trend-selected-item-count="1"]');
                            const clearBtn = mask.querySelector('[data-scene-popup-trend-clear="1"]');
                            const selectedActionsEl = mask.querySelector('[data-scene-popup-trend-actions="1"]');
                            const associationRootEl = mask.querySelector('[data-scene-popup-trend-association="1"]');
                            const associationKeywordInput = mask.querySelector('[data-scene-popup-trend-association-keyword-input="1"]');
                            const associationSearchBtn = mask.querySelector('[data-scene-popup-trend-association-search="1"]');
                            const associationSearchArrowBtn = mask.querySelector('[data-scene-popup-trend-association-search-arrow="1"]');
                            const associationQuickEl = mask.querySelector('[data-scene-popup-trend-association-quick="1"]');
                            const associationStatusEl = mask.querySelector('[data-scene-popup-trend-association-status="1"]');
                            const associationListEl = mask.querySelector('[data-scene-popup-trend-association-list="1"]');
                            const associationPickedEl = mask.querySelector('[data-scene-popup-trend-association-picked="1"]');
                            const associationItemPanelEl = mask.querySelector('[data-scene-popup-trend-association-item-panel="1"]');
                            const associationItemSearchInput = mask.querySelector('[data-scene-popup-trend-association-item-search="1"]');
                            const associationItemListEl = mask.querySelector('[data-scene-popup-trend-association-item-list="1"]');
                            const associationTypeEls = Array.from(mask.querySelectorAll('[data-scene-popup-trend-association-type]'));
                            const rankTabs = ['trend', 'effect', 'traffic'];
                            const candidateListEls = rankTabs.reduce((acc, rankTab) => {
                                const listEl = mask.querySelector(`[data-scene-popup-trend-candidate-list="${rankTab}"]`);
                                if (listEl instanceof HTMLElement) {
                                    acc[rankTab] = listEl;
                                }
                                return acc;
                            }, {});
                            const selectAllEls = rankTabs.reduce((acc, rankTab) => {
                                const checkboxEl = mask.querySelector(`[data-scene-popup-trend-select-all="${rankTab}"]`);
                                if (checkboxEl instanceof HTMLInputElement) {
                                    acc[rankTab] = checkboxEl;
                                }
                                return acc;
                            }, {});
                            const popupFootEl = mask.querySelector('.am-wxt-scene-popup-foot');
                            if (selectedActionsEl instanceof HTMLElement && popupFootEl instanceof HTMLElement) {
                                const actionButtons = Array.from(popupFootEl.querySelectorAll('[data-scene-popup-save], [data-scene-popup-cancel]'));
                                actionButtons.forEach(button => selectedActionsEl.appendChild(button));
                                popupFootEl.style.display = 'none';
                            }

                            const syncPopupState = () => {
                                mask._scenePopupTrendThemeState = {
                                    getSelectedThemes: () => normalizeTrendThemeList(selectedThemes, 6)
                                };
                            };
                            const isThemeSelected = (item = {}) => {
                                const key = getTrendThemeKey(item);
                                return selectedThemes.some(candidate => getTrendThemeKey(candidate) === key);
                            };
                            const getMetricText = (item = {}, keys = []) => {
                                const value = keys
                                    .map(key => item?.[key])
                                    .find(candidate => candidate !== undefined && candidate !== null && candidate !== '');
                                if (value === undefined || value === null || value === '') return '-';
                                return String(value);
                            };
                            const getMetricNumber = (item = {}, keys = []) => {
                                const value = keys
                                    .map(key => item?.[key])
                                    .find(candidate => candidate !== undefined && candidate !== null && candidate !== '');
                                const num = Number(value);
                                return Number.isFinite(num) ? num : 0;
                            };
                            const formatTrendRatio = (value) => {
                                const num = Number(value);
                                if (!Number.isFinite(num) || num <= 0) return '';
                                const rounded = Math.abs(num - Math.round(num)) < 0.05
                                    ? String(Math.round(num))
                                    : num.toFixed(1).replace(/\.0$/, '');
                                return `周增幅 ${rounded}%`;
                            };
                            const getRankTagText = (item = {}, rankTab = 'trend') => {
                                const directTag = normalizeSceneSettingValue(
                                    item?.resourceType?.tagText
                                    || item?.resourceType?.operateText
                                    || item?.tagText
                                    || item?.trendLv?.tagText
                                    || item?.statusText
                                    || ''
                                );
                                if (rankTab === 'trend') {
                                    return formatTrendRatio(
                                        item?.weekCapacityChangeRatio
                                        ?? item?.weekTrendChangeRatio
                                        ?? item?.capacityChangeRatio
                                        ?? item?.trendChangeRatio
                                    ) || (/^[A-Z]$/i.test(directTag) ? '' : directTag) || '趋势增长中';
                                }
                                if (directTag) return directTag;
                                return '-';
                            };
                            const getRankTagTone = (text = '', rankTab = 'trend') => {
                                const normalized = normalizeSceneSettingValue(text);
                                if (rankTab === 'trend') {
                                    return normalized.includes('周增幅') ? 'up' : 'growth';
                                }
                                if (normalized.includes('行业趋势')) return 'industry';
                                if (normalized.includes('大促热销')) return 'hot';
                                if (normalized.includes('淘宝热搜')) return 'taobao';
                                return rankTab === 'traffic' ? 'traffic' : 'effect';
                            };
                            const getRankScore = (item = {}, rankTab = 'trend') => {
                                if (rankTab === 'effect') {
                                    return getMetricNumber(item, ['roi', 'roiIndex', 'cvr', 'convertIndex', 'wcvr', 'favCartIndex']);
                                }
                                if (rankTab === 'traffic') {
                                    return getMetricNumber(item, ['capacity', 'searchIndex', 'trend', 'trendIndex', 'itemCount', 'recommendItemCount']);
                                }
                                return getMetricNumber(item, ['trend', 'trendIndex', 'capacity', 'searchIndex']);
                            };
                            const getRankLabel = (rankTab = 'trend') => {
                                if (rankTab === 'effect') return '效果红榜';
                                if (rankTab === 'traffic') return '流量红榜';
                                return '趋势红榜';
                            };
                            const getRankMetricText = (item = {}, rankTab = 'trend') => {
                                if (rankTab === 'effect') {
                                    return getMetricText(item, ['roi', 'roiIndex', 'cvr', 'convertIndex', 'wcvr', 'favCartIndex']);
                                }
                                if (rankTab === 'traffic') {
                                    return getMetricText(item, ['searchIndex', 'capacity', 'trend', 'trendIndex']);
                                }
                                return getMetricText(item, ['trendIndex', 'trend']);
                            };
                            const findThemeByKey = (key = '') => {
                                const sourceThemes = []
                                    .concat(candidateThemes || [])
                                    .concat(associationSearchThemes || [])
                                    .concat(selectedThemes || [])
                                    .concat(defaultThemes || [])
                                    .concat(rankThemeMap?.trend || [])
                                    .concat(rankThemeMap?.effect || [])
                                    .concat(rankThemeMap?.traffic || []);
                                return sourceThemes.find((candidate, index) => getTrendThemeKey(candidate, index) === key) || null;
                            };
                            const buildVisibleThemes = (rankTab = 'trend') => {
                                const keyword = normalizeSceneSettingValue(
                                    searchInput instanceof HTMLInputElement ? searchInput.value : ''
                                ).toLowerCase();
                                const nativeRankThemes = rankThemeMap?.[rankTab] || [];
                                const sourceThemes = nativeRankThemes.length ? nativeRankThemes : candidateThemes;
                                const filteredThemes = sourceThemes
                                    .filter(item => {
                                        if (!keyword) return true;
                                        const haystack = [
                                            item?.trendThemeId,
                                            item?.trendThemeName
                                        ].map(value => normalizeSceneSettingValue(value).toLowerCase()).join(' ');
                                        return haystack.includes(keyword);
                                    });
                                if (nativeRankThemes.length) {
                                    return filteredThemes.slice(0, 80);
                                }
                                return filteredThemes
                                    .sort((a, b) => {
                                        const scoreDiff = getRankScore(b, rankTab) - getRankScore(a, rankTab);
                                        if (scoreDiff !== 0) return scoreDiff;
                                        const itemCountDiff = getMetricNumber(b, ['itemCount', 'recommendItemCount']) - getMetricNumber(a, ['itemCount', 'recommendItemCount']);
                                        if (itemCountDiff !== 0) return itemCountDiff;
                                        return normalizeSceneSettingValue(a?.trendThemeName || '').localeCompare(
                                            normalizeSceneSettingValue(b?.trendThemeName || ''),
                                            'zh-Hans-CN'
                                        );
                                    })
                                    .slice(0, 80);
                            };
                            const syncSelectAllState = (rankTab = 'trend', visibleThemes = []) => {
                                const checkboxEl = selectAllEls?.[rankTab];
                                if (!(checkboxEl instanceof HTMLInputElement)) return;
                                if (!visibleThemes.length) {
                                    checkboxEl.checked = false;
                                    checkboxEl.indeterminate = false;
                                    checkboxEl.disabled = true;
                                    return;
                                }
                                checkboxEl.disabled = false;
                                const selectedCount = visibleThemes.filter(item => isThemeSelected(item)).length;
                                checkboxEl.checked = selectedCount > 0 && selectedCount === visibleThemes.length;
                                checkboxEl.indeterminate = selectedCount > 0 && selectedCount < visibleThemes.length;
                            };
                            const renderCandidateList = (rankTab = 'trend') => {
                                const candidateListEl = candidateListEls?.[rankTab];
                                if (!(candidateListEl instanceof HTMLElement)) return;
                                const visibleThemes = buildVisibleThemes(rankTab);
                                syncSelectAllState(rankTab, visibleThemes);
                                if (!visibleThemes.length) {
                                    candidateListEl.innerHTML = `<div class="am-wxt-scene-crowd-empty">${getRankLabel(rankTab)}暂无可添加趋势主题</div>`;
                                    return;
                                }
                                candidateListEl.innerHTML = visibleThemes.map((item, index) => {
                                    const key = getTrendThemeKey(item, index);
                                    const selected = isThemeSelected(item);
                                    const disabled = !selected && selectedThemes.length >= 6;
                                    const rankMetricText = getRankMetricText(item, rankTab);
                                    const itemCountText = getMetricText(item, ['itemCount', 'recommendItemCount']);
                                    const rankTagText = getRankTagText(item, rankTab);
                                    const rankTagTone = getRankTagTone(rankTagText, rankTab);
                                        return `
                                            <div class="am-wxt-scene-crowd-native-candidate-row am-wxt-scene-trend-candidate-row">
                                                <div class="am-wxt-scene-crowd-native-candidate-name am-wxt-scene-trend-candidate-name-cell">
                                                    <label class="am-wxt-scene-trend-check">
                                                        <input
                                                            type="checkbox"
                                                            data-scene-popup-trend-toggle="${Utils.escapeHtml(key)}"
                                                            ${selected ? 'checked' : ''}
                                                            ${disabled ? 'disabled' : ''}
                                                        />
                                                        <span class="am-wxt-scene-trend-check-icon"></span>
                                                    </label>
                                                    <div class="name">${Utils.escapeHtml(item.trendThemeName || item.trendThemeId || `趋势主题${index + 1}`)}</div>
                                                </div>
                                                <div class="am-wxt-scene-crowd-native-candidate-scale">${Utils.escapeHtml(rankMetricText)}</div>
                                                <div class="am-wxt-scene-crowd-native-candidate-scale">${Utils.escapeHtml(itemCountText)}</div>
                                                <div class="am-wxt-scene-trend-rank-tag" data-rank-tag-type="${Utils.escapeHtml(rankTab)}" data-rank-tag-tone="${Utils.escapeHtml(rankTagTone)}">${Utils.escapeHtml(rankTagText)}</div>
                                            </div>
                                    `;
                                }).join('');
                            };
                            const renderCandidateLists = () => {
                                rankTabs.forEach(rankTab => renderCandidateList(rankTab));
                            };
                            const renderSelectedList = () => {
                                if (selectedCountEl instanceof HTMLElement) {
                                    selectedCountEl.textContent = String(selectedThemes.length);
                                }
                                if (selectedItemCountEl instanceof HTMLElement) {
                                    const selectedItemCount = selectedThemes.reduce((sum, item) => {
                                        const value = getMetricNumber(item, ['itemCount', 'recommendItemCount']);
                                        return sum + (Number.isFinite(value) ? value : 0);
                                    }, 0);
                                    selectedItemCountEl.textContent = String(selectedItemCount);
                                }
                                if (!(selectedListEl instanceof HTMLElement)) return;
                                if (!selectedThemes.length) {
                                    selectedListEl.innerHTML = '<span class="am-wxt-scene-trend-selected-empty">暂无已选趋势主题</span>';
                                    syncPopupState();
                                    return;
                                }
                                selectedListEl.innerHTML = selectedThemes.map((item, index) => {
                                    const key = getTrendThemeKey(item, index);
                                    return `
                                        <button type="button" class="am-wxt-scene-trend-selected-chip" data-scene-popup-trend-remove="${Utils.escapeHtml(key)}">
                                            <span>${Utils.escapeHtml(item.trendThemeName || item.trendThemeId || `趋势主题${index + 1}`)}</span>
                                            <i>×</i>
                                        </button>
                                    `;
                                }).join('');
                                syncPopupState();
                            };
                            const getAssociationItemTypeLabel = (type = associationSearchType) => (
                                type === 'competitorItem' ? '竞店宝贝' : '本店宝贝'
                            );
                            const getAssociationItemsByType = (type = associationSearchType) => (
                                type === 'competitorItem' ? associationCompetitorItems : associationShopItems
                            );
                            const findAssociationItemByKey = (key = '') => {
                                const normalizedKey = String(key || '').trim();
                                if (!normalizedKey) return null;
                                const sourceItems = []
                                    .concat(associationShopItems || [])
                                    .concat(associationCompetitorItems || [])
                                    .concat(associationSelectedItem ? [associationSelectedItem] : []);
                                return sourceItems.find(item => resolveTrendAssociationItemId(item) === normalizedKey) || null;
                            };
                            const renderAssociationItemPanel = () => {
                                const panelType = associationItemPanelType || '';
                                const panelVisible = panelType === 'shopItem' || panelType === 'competitorItem';
                                if (associationRootEl instanceof HTMLElement) {
                                    associationRootEl.classList.toggle('has-item-panel', panelVisible);
                                }
                                if (associationItemPanelEl instanceof HTMLElement) {
                                    associationItemPanelEl.classList.toggle('hidden', !panelVisible);
                                    associationItemPanelEl.setAttribute('data-panel-type', panelType || '');
                                }
                                if (associationItemSearchInput instanceof HTMLInputElement) {
                                    const placeholderPrefix = panelType === 'competitorItem' ? '竞店' : '本店';
                                    associationItemSearchInput.placeholder = `${placeholderPrefix}宝贝标题`;
                                    if (document.activeElement !== associationItemSearchInput && associationItemSearchInput.value !== associationItemSearchKeyword) {
                                        associationItemSearchInput.value = associationItemSearchKeyword || '';
                                    }
                                }
                                if (!(associationItemListEl instanceof HTMLElement)) return;
                                if (!panelVisible) {
                                    associationItemListEl.innerHTML = '';
                                    return;
                                }
                                if (associationItemLoadStatus) {
                                    associationItemListEl.innerHTML = `<div class="am-wxt-scene-crowd-empty">${Utils.escapeHtml(associationItemLoadStatus)}</div>`;
                                    return;
                                }
                                const typeLabel = getAssociationItemTypeLabel(panelType);
                                const visibleItems = filterTrendAssociationItems(
                                    getAssociationItemsByType(panelType),
                                    associationItemSearchKeyword
                                ).slice(0, 80);
                                if (!visibleItems.length) {
                                    associationItemListEl.innerHTML = `<div class="am-wxt-scene-crowd-empty">暂无${Utils.escapeHtml(typeLabel)}，可输入宝贝标题后回车搜索</div>`;
                                    return;
                                }
                                const selectedItemId = associationSelectedItemType === panelType
                                    ? resolveTrendAssociationItemId(associationSelectedItem || {})
                                    : '';
                                associationItemListEl.innerHTML = visibleItems.map((item) => {
                                    const itemId = resolveTrendAssociationItemId(item);
                                    const itemName = normalizeSceneSettingValue(item?.materialName || item?.name || item?.title || '') || `宝贝${itemId}`;
                                    const picUrl = resolveTrendAssociationItemPic(item);
                                    const selected = itemId && itemId === selectedItemId;
                                    return `
                                        <label class="am-wxt-scene-trend-association-item-row ${selected ? 'selected' : ''}" data-scene-popup-trend-association-item-select="${Utils.escapeHtml(itemId)}">
                                            <span class="am-wxt-scene-trend-association-item-radio">
                                                <input type="radio" name="am-wxt-trend-association-item" ${selected ? 'checked' : ''} />
                                            </span>
                                            <span class="am-wxt-scene-trend-association-item-thumb">
                                                ${picUrl ? `<img src="${Utils.escapeHtml(picUrl)}" alt="" />` : '<i>宝</i>'}
                                            </span>
                                            <span class="am-wxt-scene-trend-association-item-info">
                                                <strong>${Utils.escapeHtml(itemName)}</strong>
                                                <em>ID:${Utils.escapeHtml(itemId)}</em>
                                            </span>
                                        </label>
                                    `;
                                }).join('');
                            };
                            const renderAssociationSearch = () => {
                                associationTypeEls.forEach((item) => {
                                    if (!(item instanceof HTMLElement)) return;
                                    const type = String(item.getAttribute('data-scene-popup-trend-association-type') || '').trim();
                                    item.classList.toggle('active', type === associationSearchType);
                                });
                                if (associationKeywordInput instanceof HTMLInputElement) {
                                    if (document.activeElement !== associationKeywordInput && associationKeywordInput.value !== associationKeyword) {
                                        associationKeywordInput.value = associationKeyword || '';
                                    }
                                    associationKeywordInput.tabIndex = associationSearchType === 'keyword' ? 0 : -1;
                                }
                                if (associationPickedEl instanceof HTMLElement) {
                                    const activePickedItem = associationSelectedItemType === associationSearchType
                                        ? associationSelectedItem
                                        : null;
                                    const pickedName = resolveTrendAssociationItemQuery(activePickedItem || {});
                                    associationPickedEl.textContent = associationSearchType === 'keyword' || !pickedName
                                        ? ''
                                        : `已选${getAssociationItemTypeLabel(associationSearchType)}：${pickedName}`;
                                }
                                renderAssociationItemPanel();
                                if (associationStatusEl instanceof HTMLElement) {
                                    associationStatusEl.textContent = associationSearchStatus || '';
                                }
                                if (associationQuickEl instanceof HTMLElement) {
                                    const quickThemes = (selectedThemes.length ? selectedThemes : defaultThemes).slice(0, 6);
                                    const activeQuickQuery = normalizeSceneSettingValue(associationQuickActiveQuery);
                                    associationQuickEl.innerHTML = quickThemes.length
                                        ? quickThemes.map((item, index) => {
                                            const name = normalizeSceneSettingValue(item?.trendThemeName || item?.trendThemeId || `趋势主题${index + 1}`);
                                            const isActive = activeQuickQuery && name === activeQuickQuery;
                                            return `
                                                <button type="button" class="${isActive ? 'active' : ''}" data-scene-popup-trend-association-quick-query="${Utils.escapeHtml(name)}">
                                                    <span></span>${Utils.escapeHtml(name)}
                                                </button>
                                            `;
                                        }).join('')
                                        : '<em>暂无已选趋势，可先从红榜勾选</em>';
                                }
                                if (!(associationListEl instanceof HTMLElement)) return;
                                const list = Array.isArray(associationSearchThemes) ? associationSearchThemes.slice(0, 40) : [];
                                if (!list.length) {
                                    associationListEl.innerHTML = '<div class="am-wxt-scene-crowd-empty">暂无联想结果，输入关键词后点击“深度搜索”</div>';
                                    return;
                                }
                                associationListEl.innerHTML = list.map((item, index) => {
                                    const key = getTrendThemeKey(item, index);
                                    const selected = isThemeSelected(item);
                                    const disabled = !selected && selectedThemes.length >= 6;
                                    const itemCountText = getMetricText(item, ['itemCount', 'recommendItemCount']);
                                    const trendText = getMetricText(item, ['trendIndex', 'trend']);
                                    const searchText = getMetricText(item, ['searchIndex', 'capacity']);
                                    const competitionText = getMetricText(item, ['competition', 'competitionHeat']);
                                    const wcvrText = getMetricText(item, ['wcvr', 'favCartIndex', 'collectCartIndex']);
                                    const cvrText = getMetricText(item, ['cvr', 'convertIndex']);
                                    const roiText = getMetricText(item, ['roi', 'roiIndex']);
                                    const tagText = normalizeSceneSettingValue(item?.tagText || item?.resourceType?.tagText || '');
                                    return `
                                        <div class="am-wxt-scene-trend-association-row ${selected ? 'selected' : ''}">
                                            <div class="am-wxt-scene-trend-association-theme">
                                                ${tagText ? `<i>${Utils.escapeHtml(tagText)}</i>` : ''}
                                                <span>${Utils.escapeHtml(item.trendThemeName || item.trendThemeId || `趋势主题${index + 1}`)}</span>
                                            </div>
                                            <div>宝贝：${Utils.escapeHtml(itemCountText)}</div>
                                            <div>${Utils.escapeHtml(trendText)}</div>
                                            <div>${Utils.escapeHtml(searchText)}</div>
                                            <div>${Utils.escapeHtml(competitionText)}</div>
                                            <div>${Utils.escapeHtml(wcvrText)}</div>
                                            <div>${Utils.escapeHtml(cvrText)}</div>
                                            <div>${Utils.escapeHtml(roiText)}</div>
                                            <button
                                                type="button"
                                                class="am-wxt-scene-trend-association-op"
                                                data-scene-popup-trend-association-toggle="${Utils.escapeHtml(key)}"
                                                ${disabled ? 'disabled' : ''}
                                            >${selected ? '移除' : '添加'}</button>
                                        </div>
                                    `;
                                }).join('');
                            };
                            const renderAll = () => {
                                selectedThemes = normalizeTrendThemeList(selectedThemes, 6);
                                candidateThemes = uniqueTrendThemeList(
                                    selectedThemes
                                        .concat(associationSearchThemes || [])
                                        .concat(candidateThemes),
                                    160
                                );
                                renderCandidateLists();
                                renderAssociationSearch();
                                renderSelectedList();
                            };
                            const addTheme = (item = {}) => {
                                const normalized = normalizeTrendThemeItem(item, selectedThemes.length);
                                if (!normalized) return;
                                if (isThemeSelected(normalized)) return;
                                if (selectedThemes.length >= 6) {
                                    appendWizardLog('趋势主题最多选择 6 个', 'error');
                                    return;
                                }
                                selectedThemes = uniqueTrendThemeList(selectedThemes.concat([normalized]), 6);
                                candidateThemes = uniqueTrendThemeList(candidateThemes.concat([normalized]), 160);
                                renderAll();
                            };
                            const removeTheme = (item = {}) => {
                                const key = getTrendThemeKey(item);
                                selectedThemes = selectedThemes.filter(candidate => getTrendThemeKey(candidate) !== key);
                                renderAll();
                            };
                            const toggleTheme = (item = {}) => {
                                if (isThemeSelected(item)) {
                                    removeTheme(item);
                                    return;
                                }
                                addTheme(item);
                            };
                            const fillDefaultThemes = () => {
                                const sourceThemes = defaultThemes.length ? defaultThemes : candidateThemes;
                                sourceThemes.forEach(item => {
                                    if (selectedThemes.length >= 6) return;
                                    if (!isThemeSelected(item)) {
                                        selectedThemes = uniqueTrendThemeList(selectedThemes.concat([item]), 6);
                                    }
                                });
                                renderAll();
                            };
                            const loadAssociationItems = async (type = associationSearchType, query = associationItemSearchKeyword) => {
                                const itemType = type === 'competitorItem' ? 'competitorItem' : 'shopItem';
                                const normalizedQuery = normalizeSceneSettingValue(query);
                                const competitorQuery = itemType === 'competitorItem'
                                    ? normalizeSceneSettingValue(
                                        normalizedQuery
                                        || associationKeyword
                                        || selectedThemes[0]?.trendThemeName
                                        || defaultThemes[0]?.trendThemeName
                                        || ''
                                    )
                                    : '';
                                const requestToken = `${itemType}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
                                associationItemLoadToken = requestToken;
                                associationItemPanelType = itemType;
                                associationItemLoadStatus = `正在加载${getAssociationItemTypeLabel(itemType)}...`;
                                renderAssociationSearch();
                                try {
                                    const localShopItems = uniqueTrendAssociationItems(
                                        []
                                            .concat(Array.isArray(wizardState?.addedItems) ? wizardState.addedItems : [])
                                            .concat(Array.isArray(wizardState?.draft?.addedItems) ? wizardState.draft.addedItems : [])
                                            .concat(Array.isArray(wizardState?.candidates) ? wizardState.candidates : []),
                                        120
                                    );
                                    const response = itemType === 'competitorItem'
                                        ? { list: await fetchCompetitorAssociationItems(competitorQuery) }
                                        : await searchItems({
                                            bizCode: expectedBizCode,
                                            promotionScene: 'promotion_scene_search_trend',
                                            itemSelectedMode: 'trend',
                                            query: normalizedQuery,
                                            pageSize: 80,
                                            tagId: '101111310',
                                            channelKey: !normalizedQuery ? 'effect' : ''
                                        });
                                    if (associationItemLoadToken !== requestToken) return;
                                    const remoteItems = Array.isArray(response?.list) ? response.list : [];
                                    if (itemType === 'competitorItem') {
                                        associationCompetitorItems = uniqueTrendAssociationItems(remoteItems, 120);
                                    } else {
                                        associationShopItems = uniqueTrendAssociationItems(localShopItems.concat(remoteItems), 120);
                                    }
                                    associationItemLoadStatus = '';
                                } catch (err) {
                                    if (associationItemLoadToken !== requestToken) return;
                                    const fallbackShopItems = uniqueTrendAssociationItems(
                                        []
                                            .concat(associationShopItems || [])
                                            .concat(Array.isArray(wizardState?.addedItems) ? wizardState.addedItems : [])
                                            .concat(Array.isArray(wizardState?.draft?.addedItems) ? wizardState.draft.addedItems : []),
                                        120
                                    );
                                    if (itemType === 'shopItem') {
                                        associationShopItems = fallbackShopItems;
                                    }
                                    associationItemLoadStatus = itemType === 'shopItem' && fallbackShopItems.length
                                        ? ''
                                        : `加载${getAssociationItemTypeLabel(itemType)}失败，可换一个宝贝标题重试`;
                                    appendWizardLog(`趋势主题${getAssociationItemTypeLabel(itemType)}加载失败：${err?.message || err}`, 'error');
                                } finally {
                                    if (associationItemLoadToken === requestToken) {
                                        renderAssociationSearch();
                                    }
                                }
                            };
                            const resolveAssociationSearchQuery = (query = '') => {
                                const directQuery = normalizeSceneSettingValue(query);
                                if (directQuery) return directQuery;
                                if (associationSearchType === 'keyword') {
                                    return normalizeSceneSettingValue(
                                        (associationKeywordInput instanceof HTMLInputElement ? associationKeywordInput.value : '')
                                        || associationKeyword
                                        || selectedThemes[0]?.trendThemeName
                                        || defaultThemes[0]?.trendThemeName
                                        || ''
                                    );
                                }
                                if (associationSelectedItemType !== associationSearchType) return '';
                                return resolveTrendAssociationItemQuery(associationSelectedItem || {});
                            };
                            const resolveAssociationSearchQueries = (query = '') => {
                                const directQuery = resolveAssociationSearchQuery(query);
                                if (!directQuery) return [];
                                if (associationSearchType === 'keyword') {
                                    return [directQuery];
                                }
                                const selectedItemText = associationSelectedItemType === associationSearchType
                                    ? resolveTrendAssociationItemQuery(associationSelectedItem || {})
                                    : '';
                                const itemSearchQuery = normalizeSceneSettingValue(associationItemSearchKeyword);
                                const coreQueries = buildTrendAssociationCoreQueries(`${selectedItemText} ${directQuery}`);
                                return uniqueBy(
                                    []
                                        .concat(itemSearchQuery ? [itemSearchQuery] : [])
                                        .concat(coreQueries)
                                        .concat([directQuery])
                                        .map(item => normalizeTrendAssociationQueryCandidate(item))
                                        .filter(Boolean),
                                    item => item.toLowerCase()
                                ).slice(0, 8);
                            };
                            const runAssociationSearch = async (query = '') => {
                                const normalizedQuery = resolveAssociationSearchQuery(query);
                                if (!normalizedQuery) {
                                    if (associationSearchType !== 'keyword') {
                                        associationItemPanelType = associationSearchType;
                                        renderAssociationSearch();
                                        appendWizardLog(`请先选择${getAssociationItemTypeLabel(associationSearchType)}`, 'error');
                                        return;
                                    }
                                    appendWizardLog('请输入关键词或先选择一个趋势主题', 'error');
                                    return;
                                }
                                const searchQueries = resolveAssociationSearchQueries(query);
                                if (associationSearchType === 'keyword') {
                                    associationKeyword = normalizedQuery;
                                    const quickQuerySet = new Set(
                                        (selectedThemes.length ? selectedThemes : defaultThemes)
                                            .slice(0, 6)
                                            .map(item => normalizeSceneSettingValue(item?.trendThemeName || item?.trendThemeId || ''))
                                    );
                                    associationQuickActiveQuery = quickQuerySet.has(normalizedQuery) ? normalizedQuery : '';
                                    if (associationKeywordInput instanceof HTMLInputElement) {
                                        associationKeywordInput.value = normalizedQuery;
                                    }
                                }
                                associationSearchStatus = '搜索中...';
                                renderAssociationSearch();
                                [associationSearchBtn, associationSearchArrowBtn].forEach((btn) => {
                                    if (btn instanceof HTMLButtonElement) btn.disabled = true;
                                });
                                try {
                                    let usedQuery = normalizedQuery;
                                    associationSearchThemes = [];
                                    for (const queryCandidate of (searchQueries.length ? searchQueries : [normalizedQuery])) {
                                        usedQuery = queryCandidate;
                                        associationSearchThemes = await fetchAssociationThemes(queryCandidate);
                                        if (associationSearchThemes.length) break;
                                    }
                                    candidateThemes = uniqueTrendThemeList(
                                        associationSearchThemes.concat(candidateThemes),
                                        160
                                    );
                                    associationSearchStatus = associationSearchThemes.length
                                        ? `搜索完毕，共找到${associationSearchThemes.length}个趋势热点${usedQuery && usedQuery !== normalizedQuery ? `（联想词：${usedQuery}）` : ''}`
                                        : '搜索完毕，暂无相关趋势热点';
                                } finally {
                                    [associationSearchBtn, associationSearchArrowBtn].forEach((btn) => {
                                        if (btn instanceof HTMLButtonElement) btn.disabled = false;
                                    });
                                    renderAll();
                                }
                            };

                            if (searchInput instanceof HTMLInputElement) {
                                searchInput.addEventListener('input', renderCandidateLists);
                            }
                            if (refreshBtn instanceof HTMLButtonElement) {
                                refreshBtn.onclick = async () => {
                                    refreshBtn.disabled = true;
                                    try {
                                        const refreshedBundle = await fetchNativeTrendThemeBundle(expectedBizCode);
                                        defaultThemes = normalizeTrendThemeList(refreshedBundle.defaultList || [], 6);
                                        rankThemeMap = {
                                            trend: normalizeTrendThemeList(refreshedBundle.trendRankList || refreshedBundle.candidateList || [], 160),
                                            effect: normalizeTrendThemeList(refreshedBundle.effectRankList || refreshedBundle.candidateList || [], 160),
                                            traffic: normalizeTrendThemeList(refreshedBundle.trafficRankList || refreshedBundle.candidateList || [], 160)
                                        };
                                        const fallbackQuery = normalizeSceneSettingValue(
                                            selectedThemes[0]?.trendThemeName
                                            || defaultThemes[0]?.trendThemeName
                                            || ''
                                        );
                                        const associationList = fallbackQuery
                                            ? await fetchAssociationThemes(fallbackQuery)
                                            : [];
                                        associationSearchThemes = associationList;
                                        associationSearchStatus = associationSearchThemes.length
                                            ? `搜索完毕，共找到${associationSearchThemes.length}个趋势热点`
                                            : '输入关键词后深度搜索，或点击已选趋势快捷联想';
                                        candidateThemes = uniqueTrendThemeList(
                                            associationList
                                                .concat(selectedThemes)
                                                .concat(defaultThemes)
                                                .concat(refreshedBundle.candidateList || []),
                                            160
                                        );
                                        if (!selectedThemes.length && defaultThemes.length) {
                                            selectedThemes = defaultThemes.slice(0, 6);
                                        }
                                        appendWizardLog('已刷新原生趋势主题推荐', 'info');
                                        renderAll();
                                    } finally {
                                        refreshBtn.disabled = false;
                                    }
                                };
                            }
                            if (fillDefaultBtn instanceof HTMLButtonElement) {
                                fillDefaultBtn.onclick = fillDefaultThemes;
                            }
                            if (clearBtn instanceof HTMLElement) {
                                clearBtn.onclick = (event) => {
                                    event.preventDefault();
                                    selectedThemes = [];
                                    renderAll();
                                };
                            }
                            associationTypeEls.forEach((item) => {
                                if (!(item instanceof HTMLElement)) return;
                                item.addEventListener('click', (event) => {
                                    const nextType = String(item.getAttribute('data-scene-popup-trend-association-type') || 'keyword').trim() || 'keyword';
                                    associationSearchType = nextType;
                                    if (nextType === 'keyword') {
                                        associationItemPanelType = '';
                                        associationSelectedItemType = '';
                                        renderAssociationSearch();
                                        if (event.target === item && associationKeywordInput instanceof HTMLInputElement) {
                                            associationKeywordInput.focus();
                                        }
                                        return;
                                    }
                                    if (associationSelectedItemType !== nextType) {
                                        associationSelectedItem = null;
                                        associationSelectedItemType = '';
                                    }
                                    associationItemPanelType = nextType;
                                    renderAssociationSearch();
                                    void loadAssociationItems(nextType, associationItemSearchKeyword);
                                });
                            });
                            [associationSearchBtn, associationSearchArrowBtn].forEach((btn) => {
                                if (btn instanceof HTMLButtonElement) {
                                    btn.onclick = () => {
                                        if (associationSearchType !== 'keyword' && (
                                            associationSelectedItemType !== associationSearchType
                                            || !resolveTrendAssociationItemId(associationSelectedItem || {})
                                        )) {
                                            associationItemPanelType = associationSearchType;
                                            renderAssociationSearch();
                                            void loadAssociationItems(associationSearchType, associationItemSearchKeyword);
                                            appendWizardLog(`请先选择${getAssociationItemTypeLabel(associationSearchType)}`, 'error');
                                            return;
                                        }
                                        void runAssociationSearch();
                                    };
                                }
                            });
                            if (associationKeywordInput instanceof HTMLInputElement) {
                                associationKeywordInput.addEventListener('input', () => {
                                    associationSearchType = 'keyword';
                                    associationKeyword = associationKeywordInput.value || '';
                                    associationQuickActiveQuery = '';
                                    associationItemPanelType = '';
                                    associationSelectedItemType = '';
                                    renderAssociationSearch();
                                });
                                associationKeywordInput.addEventListener('keydown', (event) => {
                                    if (event.key !== 'Enter') return;
                                    event.preventDefault();
                                    void runAssociationSearch();
                                });
                            }
                            if (associationItemSearchInput instanceof HTMLInputElement) {
                                associationItemSearchInput.addEventListener('input', () => {
                                    associationItemSearchKeyword = associationItemSearchInput.value || '';
                                    renderAssociationItemPanel();
                                });
                                associationItemSearchInput.addEventListener('keydown', (event) => {
                                    if (event.key !== 'Enter') return;
                                    event.preventDefault();
                                    void loadAssociationItems(associationItemPanelType || associationSearchType, associationItemSearchKeyword);
                                });
                            }
                            if (associationQuickEl instanceof HTMLElement) {
                                associationQuickEl.addEventListener('click', (event) => {
                                    const target = event.target instanceof HTMLElement
                                        ? event.target.closest('[data-scene-popup-trend-association-quick-query]')
                                        : null;
                                    if (!(target instanceof HTMLElement)) return;
                                    const query = String(target.getAttribute('data-scene-popup-trend-association-quick-query') || '').trim();
                                    if (!query) return;
                                    associationSearchType = 'keyword';
                                    associationItemPanelType = '';
                                    associationKeyword = query;
                                    associationQuickActiveQuery = query;
                                    associationSelectedItemType = '';
                                    if (associationKeywordInput instanceof HTMLInputElement) {
                                        associationKeywordInput.value = query;
                                    }
                                    void runAssociationSearch(query);
                                });
                            }
                            if (associationItemListEl instanceof HTMLElement) {
                                associationItemListEl.addEventListener('click', (event) => {
                                    const target = event.target instanceof HTMLElement
                                        ? event.target.closest('[data-scene-popup-trend-association-item-select]')
                                        : null;
                                    if (!(target instanceof HTMLElement)) return;
                                    const itemId = String(target.getAttribute('data-scene-popup-trend-association-item-select') || '').trim();
                                    if (!itemId) return;
                                    const item = findAssociationItemByKey(itemId);
                                    if (!item) return;
                                    associationSelectedItem = item;
                                    associationSelectedItemType = associationItemPanelType || associationSearchType;
                                    associationItemPanelType = '';
                                    const itemQuery = resolveTrendAssociationItemQuery(item);
                                    associationSearchStatus = itemQuery
                                        ? `已选择${getAssociationItemTypeLabel(associationSearchType)}：${itemQuery}，正在联想趋势主题...`
                                        : `已选择${getAssociationItemTypeLabel(associationSearchType)}`;
                                    renderAssociationSearch();
                                    if (itemQuery) {
                                        void runAssociationSearch(itemQuery);
                                    }
                                });
                            }
                            if (associationListEl instanceof HTMLElement) {
                                associationListEl.addEventListener('click', (event) => {
                                    const target = event.target instanceof HTMLElement
                                        ? event.target.closest('[data-scene-popup-trend-association-toggle]')
                                        : null;
                                    if (!(target instanceof HTMLElement)) return;
                                    const key = String(target.getAttribute('data-scene-popup-trend-association-toggle') || '').trim();
                                    if (!key) return;
                                    const item = findThemeByKey(key);
                                    if (!item) return;
                                    toggleTheme(item);
                                });
                            }
                            rankTabs.forEach((rankTab) => {
                                const candidateListEl = candidateListEls?.[rankTab];
                                if (!(candidateListEl instanceof HTMLElement)) return;
                                candidateListEl.addEventListener('click', (event) => {
                                    if (!(event.target instanceof HTMLElement)) return;
                                    const target = event.target.closest('[data-scene-popup-trend-toggle]');
                                    const key = target instanceof HTMLElement
                                        ? String(target.getAttribute('data-scene-popup-trend-toggle') || '').trim()
                                        : String(
                                            event.target.closest('.am-wxt-scene-trend-check')
                                                ?.querySelector('[data-scene-popup-trend-toggle]')
                                                ?.getAttribute('data-scene-popup-trend-toggle') || ''
                                        ).trim();
                                    if (!key) return;
                                    const item = findThemeByKey(key);
                                    if (!item) return;
                                    toggleTheme(item);
                                });
                                const selectAllEl = selectAllEls?.[rankTab];
                                if (selectAllEl instanceof HTMLInputElement) {
                                    selectAllEl.addEventListener('change', () => {
                                        const visibleThemes = buildVisibleThemes(rankTab);
                                        if (!visibleThemes.length) return;
                                        if (selectAllEl.checked) {
                                            visibleThemes.forEach(item => {
                                                if (selectedThemes.length >= 6) return;
                                                if (!isThemeSelected(item)) {
                                                    selectedThemes = uniqueTrendThemeList(selectedThemes.concat([item]), 6);
                                                }
                                            });
                                            renderAll();
                                            return;
                                        }
                                        const keySet = new Set(
                                            visibleThemes.map((item) => getTrendThemeKey(item))
                                        );
                                        selectedThemes = selectedThemes.filter((item, index) => !keySet.has(getTrendThemeKey(item, index)));
                                        renderAll();
                                    });
                                }
                            });
                            if (selectedListEl instanceof HTMLElement) {
                                selectedListEl.addEventListener('click', (event) => {
                                    const target = event.target instanceof HTMLElement
                                        ? event.target.closest('[data-scene-popup-trend-remove]')
                                        : null;
                                    if (!(target instanceof HTMLElement)) return;
                                    const key = String(target.getAttribute('data-scene-popup-trend-remove') || '').trim();
                                    selectedThemes = selectedThemes.filter((item, index) => getTrendThemeKey(item, index) !== key);
                                    renderAll();
                                });
                            }

                            renderAll();
                        },
                        onSave: (mask) => {
                            const state = mask._scenePopupTrendThemeState || {};
                            const nextThemes = typeof state.getSelectedThemes === 'function'
                                ? state.getSelectedThemes()
                                : [];
                            const trendThemeRaw = serializeTrendThemeList(nextThemes);
                            return {
                                ok: true,
                                trendThemeRaw,
                                summary: describeTrendThemeSummary(trendThemeRaw)
                            };
                        }
                    });
                    if (!result || result.ok !== true) return null;
                    if (typeof popupOptions.onSave === 'function') {
                        await popupOptions.onSave(result);
                    }
                    return {
                        ok: true,
                        result,
                        trendThemeControl
                    };
                };
                KeywordPlanPreviewExecutor.openKeywordTrendThemeSettingPopup = openKeywordTrendThemeSettingPopup;
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
