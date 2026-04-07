                const openKeywordAdvancedSettingPopup = async (initialTab = 'adzone') => {
                    const resolvePopupControlByTriggers = (fieldKey = '', triggerList = []) => {
                        const targetField = String(fieldKey || '').trim();
                        if (!targetField) return null;
                        const list = Array.isArray(triggerList) ? triggerList : [];
                        for (let idx = 0; idx < list.length; idx += 1) {
                            const trigger = String(list[idx] || '').trim();
                            if (!trigger) continue;
                            const control = resolveScenePopupControl(targetField, trigger);
                            if (control instanceof HTMLInputElement) return control;
                        }
                        return null;
                    };
                    const adzoneControl = resolvePopupControlByTriggers('campaign.adzoneList', [
                        'adzone',
                        'adzonePremium',
                        'launchSetting'
                    ]);
                    const launchPeriodControl = resolvePopupControlByTriggers('campaign.launchPeriodList', [
                        'launchPeriod',
                        'launchSetting',
                        'adzone',
                        'adzonePremium'
                    ]);
                    const launchAreaControl = resolvePopupControlByTriggers('campaign.launchAreaStrList', [
                        'launchArea',
                        'launchSetting',
                        'adzone',
                        'adzonePremium'
                    ]);
                    if (!(adzoneControl instanceof HTMLInputElement)) return null;
                    if (!(launchPeriodControl instanceof HTMLInputElement)) return null;
                    if (!(launchAreaControl instanceof HTMLInputElement)) return null;

                    const adzoneFieldKey = normalizeSceneFieldKey('campaign.adzoneList');
                    const launchAreaFieldKey = normalizeSceneFieldKey('campaign.launchAreaStrList');
                    const launchPeriodFieldKey = normalizeSceneFieldKey('campaign.launchPeriodList');
                    const adzoneTouched = !!(adzoneFieldKey && touchedBucket[adzoneFieldKey]);
                    const launchAreaTouched = !!(launchAreaFieldKey && touchedBucket[launchAreaFieldKey]);
                    const launchPeriodTouched = !!(launchPeriodFieldKey && touchedBucket[launchPeriodFieldKey]);

                    let adzoneRaw = normalizeSceneSettingValue(adzoneControl.value || '') || '[]';
                    let launchPeriodRaw = normalizeSceneSettingValue(launchPeriodControl.value || '') || JSON.stringify(buildDefaultLaunchPeriodList());
                    let launchAreaRaw = normalizeSceneSettingValue(launchAreaControl.value || '') || '["all"]';
                    let initialAdzoneList = normalizeAdzoneListForAdvanced(adzoneRaw);
                    let initialAreaList = parseLaunchAreaList(launchAreaRaw);
                    let initialPeriodGridState = buildLaunchPeriodGridState(launchPeriodRaw);
                    const needNativeAdzoneDefaults = !adzoneTouched || isAdzoneListPlaceholderForSync(initialAdzoneList);
                    const needNativeAreaDefaults = !launchAreaTouched || !initialAreaList.length;
                    const needNativePeriodDefaults = !launchPeriodTouched || !parseScenePopupJsonArray(launchPeriodRaw, []).length;
                    if (needNativeAdzoneDefaults || needNativeAreaDefaults || needNativePeriodDefaults) {
                        const nativeDefaults = await loadNativeAdvancedDefaultsSnapshot();
                        if (nativeDefaults) {
                            if (needNativeAdzoneDefaults && Array.isArray(nativeDefaults.adzoneList) && nativeDefaults.adzoneList.length) {
                                adzoneRaw = JSON.stringify(nativeDefaults.adzoneList);
                                initialAdzoneList = normalizeAdzoneListForAdvanced(adzoneRaw);
                            }
                            if (needNativeAreaDefaults && Array.isArray(nativeDefaults.launchAreaList) && nativeDefaults.launchAreaList.length) {
                                launchAreaRaw = JSON.stringify(nativeDefaults.launchAreaList);
                                initialAreaList = parseLaunchAreaList(launchAreaRaw);
                            }
                            if (needNativePeriodDefaults && Array.isArray(nativeDefaults.launchPeriodList) && nativeDefaults.launchPeriodList.length) {
                                launchPeriodRaw = JSON.stringify(nativeDefaults.launchPeriodList);
                                initialPeriodGridState = buildLaunchPeriodGridState(launchPeriodRaw);
                            }
                        }
                    }
                    const defaultFallbackAdzoneList = [
                        {
                            adzoneCode: 'DEFAULT_SEARCH',
                            adzoneName: '淘宝搜索',
                            resourceName: '移动设备（含销量明星）、计算机设备',
                            status: '1',
                            __defaultSynthetic: true
                        },
                        {
                            adzoneCode: 'DEFAULT_SEARCH_CHAIN',
                            adzoneName: '搜索意图全链路投',
                            resourceName: '移动设备（含销量明星）、计算机设备',
                            status: '1',
                            __defaultSynthetic: true
                        }
                    ];
                    const initialTabValue = ['adzone', 'launchArea', 'launchPeriod'].includes(String(initialTab || '').trim())
                        ? String(initialTab || '').trim()
                        : 'adzone';

                    const result = await openScenePopupDialog({
                        title: '高级设置',
                        dialogClassName: 'am-wxt-scene-popup-dialog-advanced',
                        closeLabel: '×',
                        cancelLabel: '取消',
                        saveLabel: '确定',
                        bodyHtml: `
                            <div class="am-wxt-scene-advanced-layout">
                                <div class="am-wxt-scene-advanced-tabs">
                                    <button type="button" class="am-wxt-scene-advanced-tab" data-scene-popup-advanced-tab="adzone">投放资源位</button>
                                    <button type="button" class="am-wxt-scene-advanced-tab" data-scene-popup-advanced-tab="launchArea">投放地域</button>
                                    <button type="button" class="am-wxt-scene-advanced-tab" data-scene-popup-advanced-tab="launchPeriod">分时折扣</button>
                                </div>
                                <div class="am-wxt-scene-advanced-main">
                                    <div class="am-wxt-scene-advanced-content">
                                        <section class="am-wxt-scene-advanced-panel" data-scene-popup-advanced-panel="adzone">
                                            <div class="am-wxt-scene-advanced-tip">平台为您优选广告位，更全面获取优质流量，建议全部开启</div>
                                            <div class="am-wxt-scene-advanced-toolbar">
                                                <button type="button" class="am-wxt-btn" data-scene-popup-adzone-batch="on">全部开启</button>
                                                <button type="button" class="am-wxt-btn" data-scene-popup-adzone-batch="off">全部关闭</button>
                                            </div>
                                            <div class="am-wxt-scene-advanced-adzone-table" data-scene-popup-adzone-table="1">
                                                <div class="am-wxt-scene-advanced-adzone-head">
                                                    <span>资源位</span>
                                                    <span>操作</span>
                                                </div>
                                                <div class="am-wxt-scene-advanced-adzone-list" data-scene-popup-adzone-list="1"></div>
                                            </div>
                                        </section>
                                        <section class="am-wxt-scene-advanced-panel" data-scene-popup-advanced-panel="launchArea">
                                            <div class="am-wxt-scene-advanced-tip">您可以根据该计划内的您想主推的商品品类在各地区的搜索、成交、转化表现，选择您希望投放的区域</div>
                                            <div class="am-wxt-scene-advanced-area-config-row">
                                                <label class="am-wxt-scene-advanced-area-radio">
                                                    <input type="radio" name="am-wxt-area-template" value="current" data-scene-popup-area-template="current" />
                                                    <span>当前设置</span>
                                                </label>
                                                <label class="am-wxt-scene-advanced-area-radio">
                                                    <input type="radio" name="am-wxt-area-template" value="recommended" data-scene-popup-area-template="recommended" />
                                                    <span>推荐投放地域模板</span>
                                                </label>
                                                <select class="am-wxt-scene-advanced-area-select" data-scene-popup-area-recommend-template="1">
                                                    <option value="dishwasher_low_price">大家电/低价引流地域</option>
                                                </select>
                                                <label class="am-wxt-scene-advanced-area-radio">
                                                    <input type="radio" name="am-wxt-area-template" value="custom" data-scene-popup-area-template="custom" />
                                                    <span>自定义投放地域模板</span>
                                                </label>
                                                <select class="am-wxt-scene-advanced-area-select" data-scene-popup-area-custom-template="1">
                                                    <option value="migration_rx600_standard">[迁移]RX600S标准地域</option>
                                                </select>
                                                <button type="button" class="am-wxt-btn" data-scene-popup-area-save-template="1">保存模板</button>
                                            </div>
                                            <div class="am-wxt-scene-advanced-area-tools">
                                                <button type="button" class="am-wxt-btn" data-scene-popup-area-mode="alpha">按首字母选择</button>
                                                <button type="button" class="am-wxt-btn" data-scene-popup-area-mode="geo">按地理区选择</button>
                                                <span class="am-wxt-scene-advanced-area-search-icon"></span>
                                                <input
                                                    type="text"
                                                    class="am-wxt-scene-advanced-area-search"
                                                    data-scene-popup-area-search="1"
                                                    placeholder="省份/城市"
                                                />
                                            </div>
                                            <div class="am-wxt-scene-advanced-area-selector" data-scene-popup-area-selector="1"></div>
                                        </section>
                                        <section class="am-wxt-scene-advanced-panel" data-scene-popup-advanced-panel="launchPeriod">
                                            <div class="am-wxt-scene-advanced-tip">出价方式于非活动性时段，允许对不同时段设置不同的折扣，分时折扣预计可提升流量稳定性。</div>
                                            <div class="am-wxt-scene-time-recommend-cards" data-scene-popup-time-recommend-cards="1">
                                                <button type="button" class="am-wxt-scene-time-recommend-card" data-scene-popup-time-recommend-card="gmv_peak">
                                                    <div class="am-wxt-scene-time-recommend-title">11:00-14:00 午间小单快节奏</div>
                                                    <div class="am-wxt-scene-time-recommend-desc">适合午间高意向成交，建议覆盖午间+晚高峰。</div>
                                                    <span class="am-wxt-scene-time-recommend-tag">预计增量 +6%~10%</span>
                                                </button>
                                                <button type="button" class="am-wxt-scene-time-recommend-card" data-scene-popup-time-recommend-card="night_click">
                                                    <div class="am-wxt-scene-time-recommend-title">17:00-21:00 晚间意向购买</div>
                                                    <div class="am-wxt-scene-time-recommend-desc">覆盖下班后高转化窗口，适合促进成交。</div>
                                                    <span class="am-wxt-scene-time-recommend-tag">预计增量 +8%~12%</span>
                                                </button>
                                                <button type="button" class="am-wxt-scene-time-recommend-card" data-scene-popup-time-recommend-card="morning_click">
                                                    <div class="am-wxt-scene-time-recommend-title">06:00-09:00 早高峰浏览点击</div>
                                                    <div class="am-wxt-scene-time-recommend-desc">早间通勤时段补量，适合提升曝光与点击。</div>
                                                    <span class="am-wxt-scene-time-recommend-tag">预计增量 +5%~9%</span>
                                                </button>
                                            </div>
                                            <div class="am-wxt-scene-advanced-toolbar">
                                                <button type="button" class="am-wxt-btn" data-scene-popup-time-template="current">当前设置</button>
                                                <button type="button" class="am-wxt-btn" data-scene-popup-time-template="full">全日制投放</button>
                                                <button type="button" class="am-wxt-btn" data-scene-popup-time-template="dishwasher">大家电专属时段</button>
                                                <button type="button" class="am-wxt-btn" data-scene-popup-time-template="custom">自定义投放时间模板</button>
                                            </div>
                                            <div class="am-wxt-scene-advanced-toolbar">
                                                <button type="button" class="am-wxt-btn" data-scene-popup-time-action="clear">清空</button>
                                                <button type="button" class="am-wxt-btn" data-scene-popup-time-action="reset">重置</button>
                                                <span class="am-wxt-scene-advanced-tip-inline">支持单击与拖拽选择投放时间</span>
                                            </div>
                                            <div class="am-wxt-scene-popup-time-grid" data-scene-popup-time-grid="1"></div>
                                            <div class="am-wxt-scene-time-legend" data-scene-popup-time-legend="1">
                                                <span class="am-wxt-scene-time-legend-item"><i class="level-1"></i>30-100%</span>
                                                <span class="am-wxt-scene-time-legend-item"><i class="level-2"></i>100-200%</span>
                                                <span class="am-wxt-scene-time-legend-item"><i class="level-3"></i>200-250%</span>
                                                <span class="am-wxt-scene-time-legend-item"><i class="level-4"></i>可以系统智能推算分时折扣</span>
                                            </div>
                                        </section>
                                    </div>
                                    <aside class="am-wxt-scene-advanced-preview">
                                        <div class="am-wxt-scene-advanced-preview-phone">
                                            <div class="am-wxt-scene-advanced-preview-screen">
                                                <div class="am-wxt-scene-advanced-preview-card"></div>
                                                <div class="am-wxt-scene-advanced-preview-card"></div>
                                                <div class="am-wxt-scene-advanced-preview-card"></div>
                                            </div>
                                        </div>
                                        <div class="am-wxt-scene-advanced-preview-desc">模拟展示效果（与原站交互一致）</div>
                                    </aside>
                                </div>
                            </div>
                        `,
                        onMounted: (mask) => {
                            let currentTab = initialTabValue;
                            let areaList = Array.isArray(initialAreaList) ? initialAreaList.slice() : ['all'];
                            const initialAreaListSnapshot = Array.isArray(initialAreaList) ? initialAreaList.slice() : ['all'];
                            let areaTemplate = 'current';
                            let areaMode = 'alpha';
                            let areaSearchKeyword = '';
                            let launchPeriodGridState = deepClone(initialPeriodGridState);
                            const initialLaunchPeriodGridState = deepClone(initialPeriodGridState);
                            let timeTemplate = 'current';
                            let timeRecommendPreset = '';
                            let adzoneList = initialAdzoneList.length
                                ? initialAdzoneList.map(item => deepClone(item))
                                : defaultFallbackAdzoneList.map(item => deepClone(item));
                            const syntheticOnly = !initialAdzoneList.length;
                            let dragState = { active: false, next: null };

                            const tabButtons = Array.from(mask.querySelectorAll('[data-scene-popup-advanced-tab]'));
                            const panelEls = Array.from(mask.querySelectorAll('[data-scene-popup-advanced-panel]'));
                            const adzoneListEl = mask.querySelector('[data-scene-popup-adzone-list]');
                            const areaSelector = mask.querySelector('[data-scene-popup-area-selector="1"]');
                            const areaSearchInput = mask.querySelector('[data-scene-popup-area-search="1"]');
                            const areaRecommendTemplateSelect = mask.querySelector('[data-scene-popup-area-recommend-template="1"]');
                            const areaCustomTemplateSelect = mask.querySelector('[data-scene-popup-area-custom-template="1"]');
                            const areaSaveTemplateButton = mask.querySelector('[data-scene-popup-area-save-template="1"]');
                            const timeGrid = mask.querySelector('[data-scene-popup-time-grid]');
                            const areaTemplateButtons = Array.from(mask.querySelectorAll('input[data-scene-popup-area-template]'));
                            const areaModeButtons = Array.from(mask.querySelectorAll('[data-scene-popup-area-mode]'));
                            const timeTemplateButtons = Array.from(mask.querySelectorAll('[data-scene-popup-time-template]'));
                            const timeRecommendCards = Array.from(mask.querySelectorAll('[data-scene-popup-time-recommend-card]'));

                            const renderTabs = () => {
                                tabButtons.forEach(btn => {
                                    if (!(btn instanceof HTMLButtonElement)) return;
                                    const tab = String(btn.getAttribute('data-scene-popup-advanced-tab') || '').trim();
                                    const active = tab === currentTab;
                                    btn.classList.toggle('active', active);
                                    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
                                });
                                panelEls.forEach(panel => {
                                    if (!(panel instanceof HTMLElement)) return;
                                    const tab = String(panel.getAttribute('data-scene-popup-advanced-panel') || '').trim();
                                    const active = tab === currentTab;
                                    panel.classList.toggle('active', active);
                                    panel.hidden = !active;
                                });
                            };
                            const renderAreaTemplateButtons = () => {
                                areaTemplateButtons.forEach(input => {
                                    if (!(input instanceof HTMLInputElement)) return;
                                    const key = String(input.getAttribute('data-scene-popup-area-template') || '').trim();
                                    const active = key === areaTemplate;
                                    input.checked = active;
                                    const label = input.closest('.am-wxt-scene-advanced-area-radio');
                                    if (label instanceof HTMLElement) {
                                        label.classList.toggle('active', active);
                                    }
                                });
                                if (areaRecommendTemplateSelect instanceof HTMLSelectElement) {
                                    areaRecommendTemplateSelect.disabled = areaTemplate !== 'recommended';
                                }
                                if (areaCustomTemplateSelect instanceof HTMLSelectElement) {
                                    areaCustomTemplateSelect.disabled = areaTemplate !== 'custom';
                                }
                            };
                            const normalizeAreaModeKey = (value = '') => String(value || '').trim() === 'geo' ? 'geo' : 'alpha';
                            const renderAreaModeButtons = () => {
                                const normalizedAreaMode = normalizeAreaModeKey(areaMode);
                                areaMode = normalizedAreaMode;
                                areaModeButtons.forEach(btn => {
                                    if (!(btn instanceof HTMLButtonElement)) return;
                                    const key = String(btn.getAttribute('data-scene-popup-area-mode') || '').trim();
                                    const active = key === normalizedAreaMode;
                                    btn.classList.toggle('primary', active);
                                    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
                                });
                                if (areaSelector instanceof HTMLElement) {
                                    areaSelector.classList.toggle('area-mode-alpha', normalizedAreaMode === 'alpha');
                                    areaSelector.classList.toggle('area-mode-geo', normalizedAreaMode === 'geo');
                                    areaSelector.setAttribute('data-area-mode', normalizedAreaMode);
                                }
                            };
                            const renderTimeTemplateButtons = () => {
                                timeTemplateButtons.forEach(btn => {
                                    if (!(btn instanceof HTMLButtonElement)) return;
                                    const key = String(btn.getAttribute('data-scene-popup-time-template') || '').trim();
                                    const active = key === timeTemplate;
                                    btn.classList.toggle('primary', active);
                                    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
                                });
                            };
                            const renderTimeRecommendCards = () => {
                                timeRecommendCards.forEach(btn => {
                                    if (!(btn instanceof HTMLButtonElement)) return;
                                    const key = String(btn.getAttribute('data-scene-popup-time-recommend-card') || '').trim();
                                    const active = key && key === timeRecommendPreset;
                                    btn.classList.toggle('active', active);
                                    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
                                });
                            };

                            const renderAdzoneList = () => {
                                if (!(adzoneListEl instanceof HTMLElement)) return;
                                adzoneListEl.innerHTML = adzoneList.map((item, idx) => {
                                    const enabled = isAdzoneStatusEnabled(item);
                                    const name = getAdzoneDisplayName(item, idx);
                                    const desc = getAdzoneDisplayDesc(item) || '移动设备（含销量明星）、计算机设备';
                                    return `
                                        <div class="am-wxt-scene-advanced-adzone-row">
                                            <div class="am-wxt-scene-advanced-adzone-cell">
                                                <div class="am-wxt-scene-advanced-adzone-name">${Utils.escapeHtml(name)}</div>
                                                <div class="am-wxt-scene-advanced-adzone-desc">${Utils.escapeHtml(desc)}</div>
                                            </div>
                                            <div class="am-wxt-scene-advanced-adzone-actions">
                                                <button type="button" class="am-wxt-btn ${enabled ? 'primary' : ''}" data-scene-popup-adzone-row-toggle="${idx}" data-scene-popup-adzone-next="on">开</button>
                                                <button type="button" class="am-wxt-btn ${enabled ? '' : 'primary'}" data-scene-popup-adzone-row-toggle="${idx}" data-scene-popup-adzone-next="off">关</button>
                                            </div>
                                        </div>
                                    `;
                                }).join('');
                            };

                            const AREA_GEO_ORDER = ['华北', '华东', '华中', '华南', '东北', '西南', '西北', '港澳台', '其他', '海外'];
                            const AREA_SECTION_LABEL_MAP = {
                                common: '全选 - 常用区域',
                                uncommon: '全选 - 不常用区域',
                                overseas: '全选 - 海外地区'
                            };
                            const buildAreaNameOrderMap = (list = []) => {
                                const map = new Map();
                                (Array.isArray(list) ? list : []).forEach((name, idx) => {
                                    const safeName = String(name || '').trim();
                                    if (!safeName || map.has(safeName)) return;
                                    map.set(safeName, idx);
                                });
                                return map;
                            };
                            const AREA_ALPHA_NAME_ORDER_BY_SECTION = {
                                common: buildAreaNameOrderMap([
                                    '安徽', '北京', '重庆', '福建',
                                    '广东', '广西', '贵州', '甘肃',
                                    '黑龙江', '河北', '河南', '湖北', '湖南', '海南',
                                    '吉林', '江苏', '江西',
                                    '辽宁',
                                    '内蒙古', '宁夏',
                                    '青海',
                                    '山西', '陕西', '山东', '上海', '四川',
                                    '天津',
                                    '云南',
                                    '浙江'
                                ]),
                                uncommon: buildAreaNameOrderMap(['新疆', '西藏', '台湾', '香港', '澳门', '中国其他']),
                                overseas: buildAreaNameOrderMap(['国外'])
                            };
                            const AREA_NATIVE_CODE_CONFIG_URL = 'https://bpcommon.alimama.com/commonapi/tetris/area/getCodeConfig.json';
                            const LEGACY_AREA_REGION_GROUPS = [
                                {
                                    section: 'common',
                                    label: '全选 - 常用区域',
                                    items: [
                                        { code: '110000', name: '北京', initial: 'B', geo: '华北', cityCount: 17 },
                                        { code: '120000', name: '天津', initial: 'T', geo: '华北', cityCount: 16 },
                                        { code: '130000', name: '河北', initial: 'H', geo: '华北', cityCount: 11 },
                                        { code: '140000', name: '山西', initial: 'S', geo: '华北', cityCount: 11 },
                                        { code: '150000', name: '内蒙古', initial: 'N', geo: '华北', cityCount: 12 },
                                        { code: '210000', name: '辽宁', initial: 'L', geo: '东北', cityCount: 14 },
                                        { code: '220000', name: '吉林', initial: 'J', geo: '东北', cityCount: 9 },
                                        { code: '230000', name: '黑龙江', initial: 'H', geo: '东北', cityCount: 13 },
                                        { code: '310000', name: '上海', initial: 'S', geo: '华东', cityCount: 16 },
                                        { code: '320000', name: '江苏', initial: 'J', geo: '华东', cityCount: 13 },
                                        { code: '330000', name: '浙江', initial: 'Z', geo: '华东', cityCount: 11 },
                                        { code: '340000', name: '安徽', initial: 'A', geo: '华东', cityCount: 17 },
                                        { code: '350000', name: '福建', initial: 'F', geo: '华东', cityCount: 9 },
                                        { code: '360000', name: '江西', initial: 'J', geo: '华东', cityCount: 11 },
                                        { code: '370000', name: '山东', initial: 'S', geo: '华东', cityCount: 16 },
                                        { code: '410000', name: '河南', initial: 'H', geo: '华中', cityCount: 17 },
                                        { code: '420000', name: '湖北', initial: 'H', geo: '华中', cityCount: 17 },
                                        { code: '430000', name: '湖南', initial: 'H', geo: '华中', cityCount: 14 },
                                        { code: '440000', name: '广东', initial: 'G', geo: '华南', cityCount: 21 },
                                        { code: '450000', name: '广西', initial: 'G', geo: '华南', cityCount: 14 },
                                        { code: '460000', name: '海南', initial: 'H', geo: '华南', cityCount: 18 },
                                        { code: '500000', name: '重庆', initial: 'C', geo: '西南', cityCount: 38 },
                                        { code: '510000', name: '四川', initial: 'S', geo: '西南', cityCount: 21 },
                                        { code: '520000', name: '贵州', initial: 'G', geo: '西南', cityCount: 9 },
                                        { code: '530000', name: '云南', initial: 'Y', geo: '西南', cityCount: 16 },
                                        { code: '610000', name: '陕西', initial: 'S', geo: '西北', cityCount: 10 },
                                        { code: '620000', name: '甘肃', initial: 'G', geo: '西北', cityCount: 14 },
                                        { code: '630000', name: '青海', initial: 'Q', geo: '西北', cityCount: 8 },
                                        { code: '640000', name: '宁夏', initial: 'N', geo: '西北', cityCount: 5 }
                                    ]
                                },
                                {
                                    section: 'uncommon',
                                    label: '全选 - 不常用区域',
                                    items: [
                                        { code: '650000', name: '新疆', initial: 'X', geo: '西北', cityCount: 17 },
                                        { code: '540000', name: '西藏', initial: 'X', geo: '西南', cityCount: 7 },
                                        { code: '810000', name: '香港', initial: 'X', geo: '港澳台', cityCount: 1 },
                                        { code: '710000', name: '台湾', initial: 'T', geo: '港澳台', cityCount: 1 },
                                        { code: '820000', name: '澳门', initial: 'A', geo: '港澳台', cityCount: 1 },
                                        { code: '990000', name: '中国其他', initial: 'Z', geo: '其他', cityCount: 1 }
                                    ]
                                },
                                {
                                    section: 'overseas',
                                    label: '全选 - 海外地区',
                                    items: [
                                        { code: 'foreign', name: '国外', initial: 'G', geo: '海外', cityCount: 1 }
                                    ]
                                }
                            ];
                            const LEGACY_AREA_CODE_NAME_MAP = new Map(
                                LEGACY_AREA_REGION_GROUPS.flatMap(section => section.items.map(item => [String(item.code || '').trim(), String(item.name || '').trim()]))
                            );
                            const LEGACY_AREA_NAME_CODE_MAP = new Map(
                                Array.from(LEGACY_AREA_CODE_NAME_MAP.entries()).map(([code, name]) => [String(name || '').trim(), code])
                            );
                            let areaRegionGroups = [];
                            let areaCodeSet = new Set();
                            let areaProvinceMap = new Map();
                            let areaCityParentMap = new Map();
                            let areaAllProvinceCodes = [];
                            let areaTokenMap = new Map();
                            let areaExpandedProvinceSet = new Set();
                            let areaDataLoading = false;
                            let areaDataLoaded = false;
                            const normalizeAreaToken = (value = '') => String(value || '').trim().toLowerCase();
                            const stripAreaSuffix = (value = '') => String(value || '')
                                .trim()
                                .replace(/(壮族自治区|回族自治区|维吾尔自治区|特别行政区|自治区|省|市)$/g, '');
                            const resolveInitialLetter = (value = '') => {
                                const text = String(value || '').trim();
                                if (!text) return '#';
                                const first = text.charAt(0).toUpperCase();
                                return /^[A-Z]$/.test(first) ? first : '#';
                            };
                            const normalizeGeoName = (name = '') => String(name || '').trim().replace(/地区$/g, '').trim() || '其他';
                            const normalizeAreaNodeCode = (value = '') => String(value ?? '').trim();
                            const appendAreaAlias = (alias = '', code = '') => {
                                const token = normalizeAreaToken(alias);
                                const normalizedCode = normalizeAreaNodeCode(code);
                                if (!token || !normalizedCode) return;
                                areaTokenMap.set(token, normalizedCode);
                            };
                            const normalizeAreaNode = (node = {}, options = {}) => {
                                const code = normalizeAreaNodeCode(node?.id ?? node?.code ?? node?.value);
                                const name = String(node?.name || '').trim();
                                if (!code || !name) return null;
                                const cityList = Array.isArray(node?.cities)
                                    ? node.cities
                                        .map(city => {
                                            const cityCode = normalizeAreaNodeCode(city?.id ?? city?.code ?? city?.value);
                                            const cityName = String(city?.name || '').trim();
                                            if (!cityCode || !cityName) return null;
                                            return {
                                                code: cityCode,
                                                name: cityName,
                                                initial: resolveInitialLetter(options.initial || cityName),
                                                geo: String(options.geo || '其他').trim() || '其他',
                                                parentCode: code
                                            };
                                        })
                                        .filter(Boolean)
                                    : [];
                                const cityCount = cityList.length || Math.max(0, toNumber(node?.cityCount, 0));
                                return {
                                    code,
                                    name,
                                    initial: resolveInitialLetter(options.initial || name),
                                    geo: String(options.geo || '其他').trim() || '其他',
                                    cityCount,
                                    cityList,
                                    section: String(options.section || 'common').trim() || 'common',
                                    sourceOrder: toNumber(options.sourceOrder, Number.MAX_SAFE_INTEGER),
                                    alphaOrder: toNumber(options.alphaOrder, Number.MAX_SAFE_INTEGER)
                                };
                            };
                            const buildAreaRegionGroupsFallback = () => (
                                LEGACY_AREA_REGION_GROUPS.map(section => ({
                                    section: section.section,
                                    label: section.label,
                                    items: section.items.map((item, idx) => ({
                                        code: String(item.code || '').trim(),
                                        name: String(item.name || '').trim(),
                                        initial: resolveInitialLetter(item.initial || item.name),
                                        geo: normalizeGeoName(item.geo || '其他'),
                                        cityCount: Math.max(0, toNumber(item.cityCount, 0)),
                                        cityList: [],
                                        sourceOrder: idx,
                                        alphaOrder: idx
                                    }))
                                }))
                            );
                            const buildAreaRegionGroupsFromNativeConfig = (payload = {}) => {
                                const source = isPlainObject(payload?.data) ? payload.data : payload;
                                if (!isPlainObject(source)) return [];
                                const letterLookup = new Map();
                                const alphaOrderLookup = new Map();
                                let alphaOrderSeed = 0;
                                const letterGroups = Array.isArray(source.letterGroups) ? source.letterGroups : [];
                                letterGroups.forEach(group => {
                                    const initial = resolveInitialLetter(group?.name || '');
                                    (Array.isArray(group?.provinces) ? group.provinces : []).forEach(province => {
                                        const provinceCode = normalizeAreaNodeCode(province?.id ?? province?.code ?? province?.value);
                                        if (!provinceCode) return;
                                        letterLookup.set(provinceCode, initial);
                                        if (!alphaOrderLookup.has(provinceCode)) {
                                            alphaOrderLookup.set(provinceCode, alphaOrderSeed++);
                                        }
                                    });
                                });
                                const seenProvinceCodes = new Set();
                                const commonItems = [];
                                let sourceOrderSeed = 0;
                                const locationGroups = Array.isArray(source.locationGroups) ? source.locationGroups : [];
                                locationGroups.forEach(group => {
                                    const geo = normalizeGeoName(group?.name || '其他');
                                    (Array.isArray(group?.provinces) ? group.provinces : []).forEach(province => {
                                        const provinceCode = normalizeAreaNodeCode(province?.id ?? province?.code ?? province?.value);
                                        if (!provinceCode || seenProvinceCodes.has(provinceCode)) return;
                                        const normalized = normalizeAreaNode(province, {
                                            section: 'common',
                                            geo,
                                            initial: letterLookup.get(provinceCode) || resolveInitialLetter(province?.name || ''),
                                            sourceOrder: sourceOrderSeed++,
                                            alphaOrder: alphaOrderLookup.get(provinceCode)
                                        });
                                        if (!normalized) return;
                                        seenProvinceCodes.add(normalized.code);
                                        commonItems.push(normalized);
                                    });
                                });
                                const uncommonItems = [];
                                const lastProvinces = Array.isArray(source.lastProvinces) ? source.lastProvinces : [];
                                lastProvinces.forEach(province => {
                                    const provinceCode = normalizeAreaNodeCode(province?.id ?? province?.code ?? province?.value);
                                    if (!provinceCode || seenProvinceCodes.has(provinceCode)) return;
                                    const provinceName = String(province?.name || '').trim();
                                    let geo = '其他';
                                    if (/(香港|澳门|台湾)/.test(provinceName)) geo = '港澳台';
                                    else if (/新疆/.test(provinceName)) geo = '西北';
                                    else if (/西藏/.test(provinceName)) geo = '西南';
                                    const normalized = normalizeAreaNode(province, {
                                        section: 'uncommon',
                                        geo,
                                        initial: letterLookup.get(provinceCode) || resolveInitialLetter(provinceName),
                                        sourceOrder: sourceOrderSeed++,
                                        alphaOrder: alphaOrderLookup.get(provinceCode)
                                    });
                                    if (!normalized) return;
                                    seenProvinceCodes.add(normalized.code);
                                    uncommonItems.push(normalized);
                                });
                                const overseasItems = [];
                                const overseas = Array.isArray(source.overseas) ? source.overseas : [];
                                overseas.forEach(province => {
                                    const provinceCode = normalizeAreaNodeCode(province?.id ?? province?.code ?? province?.value);
                                    if (!provinceCode || seenProvinceCodes.has(provinceCode)) return;
                                    const normalized = normalizeAreaNode(province, {
                                        section: 'overseas',
                                        geo: '海外',
                                        initial: resolveInitialLetter(province?.name || 'H'),
                                        sourceOrder: sourceOrderSeed++,
                                        alphaOrder: alphaOrderLookup.get(provinceCode)
                                    });
                                    if (!normalized) return;
                                    seenProvinceCodes.add(normalized.code);
                                    overseasItems.push(normalized);
                                });
                                const groups = [
                                    { section: 'common', label: AREA_SECTION_LABEL_MAP.common, items: commonItems },
                                    { section: 'uncommon', label: AREA_SECTION_LABEL_MAP.uncommon, items: uncommonItems },
                                    { section: 'overseas', label: AREA_SECTION_LABEL_MAP.overseas, items: overseasItems }
                                ].filter(section => Array.isArray(section.items) && section.items.length);
                                return groups;
                            };
                            const refreshAreaMetadata = () => {
                                areaCodeSet = new Set();
                                areaProvinceMap = new Map();
                                areaCityParentMap = new Map();
                                areaAllProvinceCodes = [];
                                areaTokenMap = new Map();
                                areaRegionGroups.forEach(section => {
                                    const list = Array.isArray(section?.items) ? section.items : [];
                                    list.forEach(province => {
                                        const provinceCode = normalizeAreaNodeCode(province?.code);
                                        const provinceName = String(province?.name || '').trim();
                                        if (!provinceCode || !provinceName) return;
                                        areaProvinceMap.set(provinceCode, province);
                                        areaCodeSet.add(provinceCode);
                                        areaAllProvinceCodes.push(provinceCode);
                                        appendAreaAlias(provinceCode, provinceCode);
                                        appendAreaAlias(provinceName, provinceCode);
                                        appendAreaAlias(stripAreaSuffix(provinceName), provinceCode);
                                        const legacyCode = LEGACY_AREA_NAME_CODE_MAP.get(provinceName);
                                        if (legacyCode) appendAreaAlias(legacyCode, provinceCode);
                                        const cityList = Array.isArray(province?.cityList) ? province.cityList : [];
                                        cityList.forEach(city => {
                                            const cityCode = normalizeAreaNodeCode(city?.code);
                                            const cityName = String(city?.name || '').trim();
                                            if (!cityCode || !cityName) return;
                                            areaCodeSet.add(cityCode);
                                            areaCityParentMap.set(cityCode, provinceCode);
                                            appendAreaAlias(cityCode, cityCode);
                                            appendAreaAlias(`${provinceName}${cityName}`, cityCode);
                                            appendAreaAlias(`${stripAreaSuffix(provinceName)}${cityName}`, cityCode);
                                        });
                                    });
                                });
                                areaAllProvinceCodes = uniqueBy(areaAllProvinceCodes, code => normalizeAreaToken(code));
                            };
                            const mapAreaTokenToCode = (token = '') => {
                                const normalized = normalizeAreaToken(token);
                                if (!normalized) return '';
                                if (normalized === 'all') return 'all';
                                if (areaTokenMap.has(normalized)) {
                                    return String(areaTokenMap.get(normalized) || '').trim();
                                }
                                if (/^\d+$/.test(normalized) && areaCodeSet.has(normalized)) {
                                    return normalized;
                                }
                                if (/^\d{6}$/.test(normalized) && LEGACY_AREA_CODE_NAME_MAP.has(normalized)) {
                                    const legacyName = String(LEGACY_AREA_CODE_NAME_MAP.get(normalized) || '').trim();
                                    const mapped = areaTokenMap.get(normalizeAreaToken(legacyName));
                                    if (mapped) return String(mapped).trim();
                                }
                                return '';
                            };
                            const getAreaProvinceByCode = (code = '') => areaProvinceMap.get(normalizeAreaNodeCode(code)) || null;
                            const getAreaCityCodeList = (provinceCode = '') => {
                                const province = getAreaProvinceByCode(provinceCode);
                                return Array.isArray(province?.cityList)
                                    ? province.cityList.map(city => normalizeAreaNodeCode(city?.code)).filter(Boolean)
                                    : [];
                            };
                            const getAreaCodesBySection = (section = '') => {
                                const normalizedSection = String(section || '').trim();
                                const matched = areaRegionGroups.find(item => String(item?.section || '').trim() === normalizedSection);
                                return Array.isArray(matched?.items)
                                    ? matched.items.map(item => normalizeAreaNodeCode(item?.code)).filter(Boolean)
                                    : [];
                            };
                            const isProvinceFullySelected = (province = null, selected = new Set()) => {
                                const safeProvince = isPlainObject(province) ? province : null;
                                if (!safeProvince || !(selected instanceof Set)) return false;
                                const provinceCode = normalizeAreaNodeCode(safeProvince.code);
                                if (!provinceCode) return false;
                                if (selected.has(provinceCode)) return true;
                                const cityCodes = getAreaCityCodeList(provinceCode);
                                if (!cityCodes.length) return false;
                                return cityCodes.every(code => selected.has(code));
                            };
                            const getProvinceSelectedCityCount = (province = null, selected = new Set()) => {
                                const safeProvince = isPlainObject(province) ? province : null;
                                if (!safeProvince || !(selected instanceof Set)) return 0;
                                const provinceCode = normalizeAreaNodeCode(safeProvince.code);
                                if (!provinceCode) return 0;
                                const cityCodes = getAreaCityCodeList(provinceCode);
                                if (!cityCodes.length) return selected.has(provinceCode) ? 1 : 0;
                                if (selected.has(provinceCode)) return cityCodes.length;
                                return cityCodes.filter(code => selected.has(code)).length;
                            };
                            const isCitySelected = (cityCode = '', provinceCode = '', selected = new Set()) => {
                                const normalizedCityCode = normalizeAreaNodeCode(cityCode);
                                const normalizedProvinceCode = normalizeAreaNodeCode(provinceCode || areaCityParentMap.get(normalizedCityCode) || '');
                                if (!(selected instanceof Set) || !normalizedCityCode) return false;
                                if (normalizedProvinceCode && selected.has(normalizedProvinceCode)) return true;
                                return selected.has(normalizedCityCode);
                            };
                            const canonicalizeSelectedAreaSet = (selected = new Set()) => {
                                if (!(selected instanceof Set)) return selected;
                                areaProvinceMap.forEach((province, provinceCode) => {
                                    const cityCodes = getAreaCityCodeList(provinceCode);
                                    if (selected.has(provinceCode)) {
                                        cityCodes.forEach(code => selected.delete(code));
                                        return;
                                    }
                                    if (!cityCodes.length) return;
                                    if (cityCodes.every(code => selected.has(code))) {
                                        selected.add(provinceCode);
                                        cityCodes.forEach(code => selected.delete(code));
                                    }
                                });
                                return selected;
                            };
                            const collectUnknownAreaTokens = (list = []) => {
                                const rawList = uniqueBy(
                                    (Array.isArray(list) ? list : [])
                                        .map(item => String(item || '').trim())
                                        .filter(Boolean),
                                    item => normalizeAreaToken(item)
                                );
                                return rawList.filter(item => {
                                    if (/^all$/i.test(item)) return false;
                                    const mapped = mapAreaTokenToCode(item);
                                    return !(mapped && mapped !== 'all' && areaCodeSet.has(mapped));
                                });
                            };
                            const buildSelectedAreaCodeSet = (list = []) => {
                                const rawList = uniqueBy(
                                    (Array.isArray(list) ? list : [])
                                        .map(item => String(item || '').trim())
                                        .filter(Boolean),
                                    item => normalizeAreaToken(item)
                                );
                                if (!rawList.length || rawList.some(item => /^all$/i.test(item))) {
                                    return new Set(areaAllProvinceCodes);
                                }
                                const selected = new Set();
                                rawList.forEach(item => {
                                    const mapped = mapAreaTokenToCode(item);
                                    if (!mapped || mapped === 'all' || !areaCodeSet.has(mapped)) return;
                                    selected.add(mapped);
                                });
                                canonicalizeSelectedAreaSet(selected);
                                return selected;
                            };
                            const normalizeAreaListForStorage = (list = []) => {
                                const rawList = uniqueBy(
                                    (Array.isArray(list) ? list : [])
                                        .map(item => String(item || '').trim())
                                        .filter(Boolean),
                                    item => normalizeAreaToken(item)
                                );
                                if (!rawList.length || rawList.some(item => /^all$/i.test(item))) return ['all'];
                                const selected = new Set();
                                const unknownList = [];
                                rawList.forEach(item => {
                                    const mapped = mapAreaTokenToCode(item);
                                    if (mapped && mapped !== 'all' && areaCodeSet.has(mapped)) {
                                        selected.add(mapped);
                                        return;
                                    }
                                    if (mapped && mapped !== 'all') {
                                        unknownList.push(mapped);
                                        return;
                                    }
                                    unknownList.push(item);
                                });
                                canonicalizeSelectedAreaSet(selected);
                                const allSelected = areaAllProvinceCodes.length > 0
                                    && areaAllProvinceCodes.every(code => isProvinceFullySelected(getAreaProvinceByCode(code), selected));
                                if (allSelected && !unknownList.length) return ['all'];
                                const normalizedUnknown = uniqueBy(
                                    unknownList
                                        .map(item => String(item || '').trim())
                                        .filter(Boolean),
                                    item => normalizeAreaToken(item)
                                );
                                const merged = Array.from(selected).concat(normalizedUnknown);
                                return merged.length ? merged : ['all'];
                            };
                            const isAreaListSame = (left = [], right = []) => {
                                const leftNormalized = normalizeAreaListForStorage(left);
                                const rightNormalized = normalizeAreaListForStorage(right);
                                const leftIsAll = leftNormalized.length === 1 && /^all$/i.test(leftNormalized[0]);
                                const rightIsAll = rightNormalized.length === 1 && /^all$/i.test(rightNormalized[0]);
                                if (leftIsAll || rightIsAll) return leftIsAll === rightIsAll;
                                const leftSet = new Set(leftNormalized.map(item => normalizeAreaToken(item)));
                                const rightSet = new Set(rightNormalized.map(item => normalizeAreaToken(item)));
                                if (leftSet.size !== rightSet.size) return false;
                                return Array.from(leftSet).every(token => rightSet.has(token));
                            };
                            const loadAreaCodeConfig = async () => {
                                if (areaDataLoaded) return areaRegionGroups;
                                try {
                                    const token = ensureTokens();
                                    const params = new URLSearchParams();
                                    params.set('bizCode', DEFAULTS.bizCode || 'onebpSearch');
                                    params.set('templateType', 'AREA');
                                    params.set('csrfId', token.csrfId);
                                    params.set('loginPointId', token.loginPointId);
                                    const requestBody = params.toString();
                                    recordApiRequestToHookHistory(AREA_NATIVE_CODE_CONFIG_URL, 'POST', requestBody, 'api_fetch_preflight');
                                    const response = await fetch(AREA_NATIVE_CODE_CONFIG_URL, {
                                        method: 'POST',
                                        credentials: 'include',
                                        headers: {
                                            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                                            Accept: 'application/json, text/javascript, */*; q=0.01'
                                        },
                                        body: requestBody
                                    });
                                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                                    const payload = await response.json().catch(() => ({}));
                                    const parsedGroups = buildAreaRegionGroupsFromNativeConfig(payload?.data || payload);
                                    if (!parsedGroups.length) throw new Error('EMPTY_AREA_CONFIG');
                                    areaRegionGroups = parsedGroups;
                                    refreshAreaMetadata();
                                    areaDataLoaded = true;
                                } catch {
                                    if (!areaRegionGroups.length) {
                                        areaRegionGroups = buildAreaRegionGroupsFallback();
                                        refreshAreaMetadata();
                                    }
                                }
                                return areaRegionGroups;
                            };
                            const areaRecommendTemplateMap = {
                                dishwasher_low_price: ['110000', '310000', '320000', '330000', '370000', '440000', '500000']
                            };
                            const defaultCustomTemplateList = (() => {
                                const normalizedInitial = normalizeAreaListForStorage(initialAreaListSnapshot);
                                if (normalizedInitial.length === 1 && /^all$/i.test(normalizedInitial[0])) {
                                    return ['110000', '310000', '320000', '330000', '440000'];
                                }
                                return normalizedInitial.filter(item => !/^all$/i.test(item));
                            })();
                            const areaCustomTemplateMap = {
                                migration_rx600_standard: defaultCustomTemplateList
                            };
                            const resolveAreaTemplateList = (templateKey = '') => {
                                const key = String(templateKey || '').trim();
                                if (key === 'current') {
                                    return normalizeAreaListForStorage(initialAreaListSnapshot);
                                }
                                if (key === 'recommended') {
                                    const selectedKey = String(
                                        areaRecommendTemplateSelect instanceof HTMLSelectElement
                                            ? areaRecommendTemplateSelect.value
                                            : 'dishwasher_low_price'
                                    ).trim() || 'dishwasher_low_price';
                                    return normalizeAreaListForStorage(
                                        areaRecommendTemplateMap[selectedKey] || areaRecommendTemplateMap.dishwasher_low_price || []
                                    );
                                }
                                if (key === 'custom') {
                                    const selectedKey = String(
                                        areaCustomTemplateSelect instanceof HTMLSelectElement
                                            ? areaCustomTemplateSelect.value
                                            : 'migration_rx600_standard'
                                    ).trim() || 'migration_rx600_standard';
                                    return normalizeAreaListForStorage(
                                        areaCustomTemplateMap[selectedKey] || areaCustomTemplateMap.migration_rx600_standard || []
                                    );
                                }
                                return normalizeAreaListForStorage(areaList);
                            };
                            const syncAreaTemplateByAreaList = () => {
                                if (isAreaListSame(areaList, initialAreaListSnapshot)) {
                                    areaTemplate = 'current';
                                    return;
                                }
                                if (isAreaListSame(areaList, resolveAreaTemplateList('recommended'))) {
                                    areaTemplate = 'recommended';
                                    return;
                                }
                                areaTemplate = 'custom';
                            };
                            const applyAreaTemplate = (templateKey = '') => {
                                const key = String(templateKey || '').trim();
                                const normalizedKey = ['current', 'recommended', 'custom'].includes(key) ? key : 'current';
                                areaTemplate = normalizedKey;
                                areaList = resolveAreaTemplateList(normalizedKey);
                                areaExpandedProvinceSet.clear();
                                renderAreaTemplateButtons();
                                renderAreaModeButtons();
                                renderAreaSelector();
                            };
                            const toggleAreaGroupSelection = (group = '', enabled = true) => {
                                const section = String(group || '').trim();
                                if (!section) return;
                                const provinceCodes = getAreaCodesBySection(section);
                                if (!provinceCodes.length) return;
                                const selected = buildSelectedAreaCodeSet(areaList);
                                const unknownTokens = collectUnknownAreaTokens(areaList);
                                provinceCodes.forEach(code => {
                                    const cityCodes = getAreaCityCodeList(code);
                                    if (enabled) selected.add(code);
                                    else selected.delete(code);
                                    cityCodes.forEach(cityCode => selected.delete(cityCode));
                                });
                                areaList = normalizeAreaListForStorage(Array.from(selected).concat(unknownTokens));
                                syncAreaTemplateByAreaList();
                            };
                            const toggleAreaProvinceSelection = (provinceCode = '', enabled = true) => {
                                const code = mapAreaTokenToCode(provinceCode);
                                if (!code || code === 'all') return;
                                const province = getAreaProvinceByCode(code);
                                if (!province) return;
                                const selected = buildSelectedAreaCodeSet(areaList);
                                const unknownTokens = collectUnknownAreaTokens(areaList);
                                if (enabled) selected.add(code);
                                else selected.delete(code);
                                getAreaCityCodeList(code).forEach(cityCode => selected.delete(cityCode));
                                areaList = normalizeAreaListForStorage(Array.from(selected).concat(unknownTokens));
                                syncAreaTemplateByAreaList();
                            };
                            const toggleAreaCitySelection = (provinceCode = '', cityCode = '', enabled = true) => {
                                const safeProvinceCode = mapAreaTokenToCode(provinceCode);
                                const safeCityCode = mapAreaTokenToCode(cityCode);
                                if (!safeProvinceCode || !safeCityCode || safeProvinceCode === 'all' || safeCityCode === 'all') return;
                                const province = getAreaProvinceByCode(safeProvinceCode);
                                if (!province) return;
                                const cityCodes = getAreaCityCodeList(safeProvinceCode);
                                if (!cityCodes.includes(safeCityCode)) return;
                                const selected = buildSelectedAreaCodeSet(areaList);
                                const unknownTokens = collectUnknownAreaTokens(areaList);
                                const provinceSelected = selected.has(safeProvinceCode);
                                if (enabled) {
                                    if (!provinceSelected) {
                                        selected.add(safeCityCode);
                                        if (cityCodes.every(code => selected.has(code))) {
                                            selected.add(safeProvinceCode);
                                            cityCodes.forEach(code => selected.delete(code));
                                        }
                                    }
                                } else if (provinceSelected) {
                                    selected.delete(safeProvinceCode);
                                    cityCodes.forEach(code => {
                                        if (code !== safeCityCode) selected.add(code);
                                    });
                                } else {
                                    selected.delete(safeCityCode);
                                }
                                areaList = normalizeAreaListForStorage(Array.from(selected).concat(unknownTokens));
                                syncAreaTemplateByAreaList();
                            };
                            const toggleAreaItemSelection = (areaCode = '', enabled = true) => {
                                toggleAreaProvinceSelection(areaCode, enabled);
                            };
                            const matchesAreaSearch = (item = {}, keyword = '') => {
                                const token = normalizeAreaToken(keyword);
                                if (!token) return true;
                                const code = normalizeAreaToken(item?.code || '');
                                const name = normalizeAreaToken(item?.name || '');
                                const shortName = normalizeAreaToken(stripAreaSuffix(item?.name || ''));
                                const geo = normalizeAreaToken(item?.geo || '');
                                if (code.includes(token) || name.includes(token) || shortName.includes(token) || geo.includes(token)) return true;
                                const cityList = Array.isArray(item?.cityList) ? item.cityList : [];
                                return cityList.some(city => {
                                    const cityCode = normalizeAreaToken(city?.code || '');
                                    const cityName = normalizeAreaToken(city?.name || '');
                                    return cityCode.includes(token) || cityName.includes(token);
                                });
                            };
                            const getProvinceRenderState = (province = {}, keyword = '') => {
                                const cityList = Array.isArray(province?.cityList) ? province.cityList : [];
                                const token = normalizeAreaToken(keyword);
                                if (!token) {
                                    return {
                                        visible: true,
                                        visibleCities: cityList.slice(),
                                        autoExpand: false
                                    };
                                }
                                const provinceMatched = (() => {
                                    const code = normalizeAreaToken(province?.code || '');
                                    const name = normalizeAreaToken(province?.name || '');
                                    const shortName = normalizeAreaToken(stripAreaSuffix(province?.name || ''));
                                    const geo = normalizeAreaToken(province?.geo || '');
                                    return code.includes(token) || name.includes(token) || shortName.includes(token) || geo.includes(token);
                                })();
                                const matchedCities = cityList.filter(city => {
                                    const cityCode = normalizeAreaToken(city?.code || '');
                                    const cityName = normalizeAreaToken(city?.name || '');
                                    return cityCode.includes(token) || cityName.includes(token);
                                });
                                if (!provinceMatched && !matchedCities.length) {
                                    return { visible: false, visibleCities: [], autoExpand: false };
                                }
                                if (provinceMatched && !matchedCities.length) {
                                    return { visible: true, visibleCities: cityList.slice(), autoExpand: false };
                                }
                                return { visible: true, visibleCities: matchedCities, autoExpand: matchedCities.length > 0 };
                            };
                            const renderAreaSectionGroups = (items = [], selected = new Set(), keyword = '', sectionName = 'common') => {
                                const mode = areaMode === 'geo' ? 'geo' : 'alpha';
                                const normalizedSection = String(sectionName || '').trim() || 'common';
                                const useInitialGrouping = mode === 'alpha' && normalizedSection === 'common';
                                const grouped = {};
                                const resolveProvinceOrderWeight = (province = null, currentMode = 'alpha') => {
                                    const safeProvince = isPlainObject(province) ? province : {};
                                    if (currentMode === 'alpha') {
                                        const section = String(safeProvince?.section || '').trim() || 'common';
                                        const customOrderMap = AREA_ALPHA_NAME_ORDER_BY_SECTION?.[section];
                                        const provinceName = String(safeProvince?.name || '').trim();
                                        if (customOrderMap instanceof Map && customOrderMap.has(provinceName)) {
                                            return customOrderMap.get(provinceName);
                                        }
                                        const alphaOrder = toNumber(safeProvince?.alphaOrder, Number.MAX_SAFE_INTEGER);
                                        if (Number.isFinite(alphaOrder)) return alphaOrder;
                                    }
                                    const sourceOrder = toNumber(safeProvince?.sourceOrder, Number.MAX_SAFE_INTEGER);
                                    if (Number.isFinite(sourceOrder)) return sourceOrder;
                                    return Number.MAX_SAFE_INTEGER;
                                };
                                (Array.isArray(items) ? items : []).forEach(item => {
                                    const province = getAreaProvinceByCode(item?.code || '');
                                    if (!province) return;
                                    const renderState = getProvinceRenderState(province, keyword);
                                    if (!renderState.visible) return;
                                    const key = mode === 'geo'
                                        ? String(province?.geo || '其他').trim() || '其他'
                                        : (useInitialGrouping ? resolveInitialLetter(province?.initial || '#') : '__all__');
                                    if (!Array.isArray(grouped[key])) grouped[key] = [];
                                    grouped[key].push({ province, renderState });
                                });
                                const groupKeys = Object.keys(grouped).sort((left, right) => {
                                    if (mode === 'alpha' && !useInitialGrouping) return 0;
                                    if (mode === 'geo') {
                                        const leftIdx = AREA_GEO_ORDER.indexOf(left);
                                        const rightIdx = AREA_GEO_ORDER.indexOf(right);
                                        const safeLeft = leftIdx < 0 ? AREA_GEO_ORDER.length + 1 : leftIdx;
                                        const safeRight = rightIdx < 0 ? AREA_GEO_ORDER.length + 1 : rightIdx;
                                        if (safeLeft !== safeRight) return safeLeft - safeRight;
                                    }
                                    return left.localeCompare(right, 'zh-Hans-CN', { sensitivity: 'base' });
                                });
                                return groupKeys.map(groupKey => {
                                    const rowHtml = grouped[groupKey]
                                        .slice()
                                        .sort((left, right) => {
                                            const leftWeight = resolveProvinceOrderWeight(left?.province, mode);
                                            const rightWeight = resolveProvinceOrderWeight(right?.province, mode);
                                            if (leftWeight !== rightWeight) return leftWeight - rightWeight;
                                            return String(left?.province?.name || '').localeCompare(String(right?.province?.name || ''), 'zh-Hans-CN', { sensitivity: 'base' });
                                        })
                                        .map(({ province, renderState }) => {
                                            const provinceCode = normalizeAreaNodeCode(province?.code);
                                            const cityList = Array.isArray(renderState?.visibleCities) ? renderState.visibleCities : [];
                                            const cityCodes = getAreaCityCodeList(provinceCode);
                                            const cityTotal = cityCodes.length;
                                            const selectedCityCount = getProvinceSelectedCityCount(province, selected);
                                            const fullChecked = isProvinceFullySelected(province, selected);
                                            const partialChecked = !fullChecked && cityTotal > 0 && selectedCityCount > 0;
                                            const hasCities = cityTotal > 0;
                                            const expanded = hasCities && areaExpandedProvinceSet.has(provinceCode);
                                            const labelText = cityTotal > 0
                                                ? `${String(province?.name || '').trim()}(${selectedCityCount}/${cityTotal})`
                                                : String(province?.name || '').trim();
                                            const cityHtml = hasCities
                                                ? `
                                                    <div
                                                        class="am-wxt-scene-area-city-list am-wxt-scene-area-city-popover ${expanded ? 'open' : ''}"
                                                        data-scene-popup-area-city-list="${Utils.escapeHtml(provinceCode)}"
                                                        ${expanded ? '' : 'hidden'}
                                                    >
                                                        ${cityList
                                                    .map(city => {
                                                        const cityCode = normalizeAreaNodeCode(city?.code);
                                                        const checked = isCitySelected(cityCode, provinceCode, selected);
                                                        return `
                                                                    <button
                                                                        type="button"
                                                                        class="am-wxt-scene-area-city-item ${checked ? 'checked' : ''}"
                                                                        data-scene-popup-area-item-toggle="${Utils.escapeHtml(cityCode)}"
                                                                        data-scene-popup-area-city-toggle="${Utils.escapeHtml(cityCode)}"
                                                                        data-scene-popup-area-city-parent="${Utils.escapeHtml(provinceCode)}"
                                                                    >
                                                                        <span class="am-wxt-scene-area-check-icon">${checked ? '✓' : ''}</span>
                                                                        <span class="am-wxt-scene-area-item-label">${Utils.escapeHtml(String(city?.name || '').trim())}</span>
                                                                    </button>
                                                                `;
                                                    })
                                                    .join('')}
                                                    </div>
                                                `
                                                : '';
                                            if (!hasCities) {
                                                return `
                                                    <div class="am-wxt-scene-area-province-row" data-scene-popup-area-province-row="${Utils.escapeHtml(provinceCode)}">
                                                        <button
                                                            type="button"
                                                            class="am-wxt-scene-area-item am-wxt-scene-area-province-item ${fullChecked ? 'checked' : ''} ${partialChecked ? 'partial' : ''}"
                                                            data-scene-popup-area-item-toggle="${Utils.escapeHtml(provinceCode)}"
                                                            data-scene-popup-area-province-toggle="${Utils.escapeHtml(provinceCode)}"
                                                        >
                                                            <span class="am-wxt-scene-area-check-icon">${fullChecked ? '✓' : (partialChecked ? '−' : '')}</span>
                                                            <span class="am-wxt-scene-area-item-label">${Utils.escapeHtml(labelText)}</span>
                                                        </button>
                                                    </div>
                                                `;
                                            }
                                            return `
                                                <div class="am-wxt-scene-area-province-row" data-scene-popup-area-province-row="${Utils.escapeHtml(provinceCode)}">
                                                    <div class="am-wxt-scene-area-province-main">
                                                        <button
                                                            type="button"
                                                            class="am-wxt-scene-area-province-check ${fullChecked ? 'checked' : ''} ${partialChecked ? 'partial' : ''}"
                                                            data-scene-popup-area-province-toggle="${Utils.escapeHtml(provinceCode)}"
                                                            title="${Utils.escapeHtml(`全选${labelText}`)}"
                                                        >
                                                            <span class="am-wxt-scene-area-check-icon">${fullChecked ? '✓' : (partialChecked ? '−' : '')}</span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            class="am-wxt-scene-area-province-open ${expanded ? 'open' : ''} ${fullChecked ? 'checked' : ''} ${partialChecked ? 'partial' : ''}"
                                                            data-scene-popup-area-city-expand="${Utils.escapeHtml(provinceCode)}"
                                                            data-scene-popup-area-province-open="${Utils.escapeHtml(provinceCode)}"
                                                            aria-expanded="${expanded ? 'true' : 'false'}"
                                                        >
                                                            <span class="am-wxt-scene-area-item-label">${Utils.escapeHtml(labelText)}</span>
                                                            <span class="am-wxt-scene-area-caret">${expanded ? '▴' : '▾'}</span>
                                                        </button>
                                                    </div>
                                                    ${cityHtml}
                                                </div>
                                            `;
                                        })
                                        .join('');
                                    const isGeoGrouping = mode === 'geo' && groupKey !== '__all__';
                                    const isAlphaGrouping = useInitialGrouping && groupKey !== '__all__';
                                    const showGroupTitle = isGeoGrouping || isAlphaGrouping;
                                    const groupClassName = `am-wxt-scene-area-group ${showGroupTitle ? '' : 'no-title'} ${isGeoGrouping ? 'geo-title' : ''}`.trim();
                                    return `
                                        <div class="${groupClassName}">
                                            ${showGroupTitle ? `<div class="am-wxt-scene-area-group-title">${Utils.escapeHtml(groupKey)}</div>` : ''}
                                            <div class="am-wxt-scene-area-item-grid">${rowHtml}</div>
                                        </div>
                                    `;
                                }).join('');
                            };
                            const renderAreaSelector = () => {
                                if (!(areaSelector instanceof HTMLElement)) return;
                                const selected = buildSelectedAreaCodeSet(areaList);
                                const keyword = String(areaSearchKeyword || '').trim();
                                const loadingHtml = areaDataLoading
                                    ? `<div class="am-wxt-scene-area-loading">地域数据加载中...</div>`
                                    : '';
                                const sectionHtml = areaRegionGroups.map(section => {
                                    const sectionItems = Array.isArray(section?.items) ? section.items : [];
                                    const visibleItems = sectionItems.filter(item => matchesAreaSearch(item, keyword));
                                    const groupCodes = getAreaCodesBySection(section.section);
                                    const fullCheckedCount = groupCodes.filter(code => isProvinceFullySelected(getAreaProvinceByCode(code), selected)).length;
                                    const allChecked = groupCodes.length > 0 && fullCheckedCount === groupCodes.length;
                                    const partialChecked = fullCheckedCount > 0 && !allChecked;
                                    const contentHtml = visibleItems.length
                                        ? renderAreaSectionGroups(visibleItems, selected, keyword, section.section)
                                        : `<div class="am-wxt-scene-area-empty">${areaDataLoading ? '正在同步地域...' : '无匹配地域'}</div>`;
                                    return `
                                        <section class="am-wxt-scene-area-section" data-scene-popup-area-section="${Utils.escapeHtml(section.section)}">
                                            <button
                                                type="button"
                                                class="am-wxt-scene-area-section-toggle ${allChecked ? 'checked' : ''} ${partialChecked ? 'partial' : ''}"
                                                data-scene-popup-area-group-toggle="${Utils.escapeHtml(section.section)}"
                                            >
                                                <span class="am-wxt-scene-area-check-icon">${allChecked ? '✓' : (partialChecked ? '−' : '')}</span>
                                                <span>${Utils.escapeHtml(String(section?.label || AREA_SECTION_LABEL_MAP[section.section] || '全选').trim())}</span>
                                            </button>
                                            <div class="am-wxt-scene-area-section-body">${contentHtml}</div>
                                        </section>
                                    `;
                                }).join('');
                                areaSelector.innerHTML = `${loadingHtml}${sectionHtml}`;
                                renderAreaTemplateButtons();
                                renderAreaModeButtons();
                            };
                            areaRegionGroups = buildAreaRegionGroupsFallback();
                            refreshAreaMetadata();
                            areaList = normalizeAreaListForStorage(areaList);
                            syncAreaTemplateByAreaList();
                            void (async () => {
                                areaDataLoading = true;
                                renderAreaSelector();
                                await loadAreaCodeConfig();
                                areaDataLoading = false;
                                areaList = normalizeAreaListForStorage(areaList);
                                syncAreaTemplateByAreaList();
                                renderAreaSelector();
                            })();

                            const WEEKDAY_DAY_KEYS = ['1', '2', '3', '4', '5'];
                            const WEEKEND_DAY_KEYS = ['6', '7'];
                            const setAllLaunchPeriodSlots = (enabled = true) => {
                                ADVANCED_DAY_COLUMNS.forEach(day => {
                                    ADVANCED_TIME_SLOTS.forEach(slot => {
                                        setTimeSlot(day.key, slot.key, enabled);
                                    });
                                });
                            };
                            const setTimeSlot = (dayKey = '', slotKey = '', enabled = true) => {
                                if (!isPlainObject(launchPeriodGridState?.[dayKey])) return;
                                if (!hasOwn(launchPeriodGridState[dayKey], slotKey)) return;
                                launchPeriodGridState[dayKey][slotKey] = !!enabled;
                            };
                            const setHourRange = (dayKeys = [], startHour = 0, endHour = 24, enabled = true) => {
                                const safeStart = Math.max(0, Math.min(24, toNumber(startHour, 0)));
                                const safeEnd = Math.max(safeStart, Math.min(24, toNumber(endHour, 24)));
                                (Array.isArray(dayKeys) ? dayKeys : []).forEach(dayKey => {
                                    ADVANCED_TIME_SLOTS.forEach(slot => {
                                        if (slot.hour >= safeStart && slot.hour < safeEnd) {
                                            setTimeSlot(dayKey, slot.key, enabled);
                                        }
                                    });
                                });
                            };
                            const applyTimeRecommendCard = (recommendKey = '') => {
                                const key = String(recommendKey || '').trim();
                                launchPeriodGridState = createEmptyLaunchPeriodGridState();
                                setAllLaunchPeriodSlots(false);
                                if (key === 'gmv_peak') {
                                    setHourRange(WEEKDAY_DAY_KEYS, 11, 14, true);
                                    setHourRange(WEEKDAY_DAY_KEYS, 17, 21, true);
                                    setHourRange(WEEKEND_DAY_KEYS, 10, 22, true);
                                } else if (key === 'night_click') {
                                    setHourRange(['1', '2', '3', '4', '5', '6', '7'], 17, 24, true);
                                } else if (key === 'morning_click') {
                                    setHourRange(['1', '2', '3', '4', '5', '6', '7'], 6, 10, true);
                                } else {
                                    launchPeriodGridState = deepClone(initialLaunchPeriodGridState);
                                }
                                timeTemplate = 'custom';
                                timeRecommendPreset = key;
                                renderTimeGrid();
                            };
                            const copyDayPatternToGroup = (sourceDayKey = '', group = '') => {
                                if (!sourceDayKey || !isPlainObject(launchPeriodGridState?.[sourceDayKey])) return;
                                const source = deepClone(launchPeriodGridState[sourceDayKey]);
                                const targets = (() => {
                                    if (group === 'workday') return WEEKDAY_DAY_KEYS.slice();
                                    if (group === 'weekend') return WEEKEND_DAY_KEYS.slice();
                                    if (group === 'other') {
                                        return ADVANCED_DAY_COLUMNS
                                            .map(day => day.key)
                                            .filter(dayKey => dayKey !== sourceDayKey);
                                    }
                                    return [];
                                })();
                                targets.forEach(dayKey => {
                                    if (!isPlainObject(launchPeriodGridState?.[dayKey])) return;
                                    launchPeriodGridState[dayKey] = deepClone(source);
                                });
                                timeTemplate = 'custom';
                                timeRecommendPreset = '';
                                renderTimeGrid();
                            };
                            const renderTimeGrid = () => {
                                if (!(timeGrid instanceof HTMLElement)) return;
                                const hourHeaderHtml = ADVANCED_TIME_SLOTS.map(slot => {
                                    const hourLabel = String(slot.hour);
                                    return `
                                        <div
                                            class="am-wxt-scene-time-hour"
                                            data-scene-popup-time-hour="${Utils.escapeHtml(hourLabel)}"
                                        >${Utils.escapeHtml(hourLabel)}</div>
                                    `;
                                }).join('');
                                const rowHtml = ADVANCED_DAY_COLUMNS.map(day => {
                                    const cells = ADVANCED_TIME_SLOTS.map(slot => {
                                        const active = !!launchPeriodGridState?.[day.key]?.[slot.key];
                                        return `
                                            <button
                                                type="button"
                                                class="am-wxt-scene-time-cell ${active ? 'active' : ''}"
                                                data-scene-popup-time-slot="${Utils.escapeHtml(`${day.key}:${slot.key}`)}"
                                                data-scene-popup-time-day="${Utils.escapeHtml(day.key)}"
                                                data-scene-popup-time-range="${Utils.escapeHtml(slot.key)}"
                                                title="${Utils.escapeHtml(`${day.label} ${slot.label}`)}"
                                            ></button>
                                        `;
                                    }).join('');
                                    return `
                                        <div class="am-wxt-scene-time-week-row">
                                            <div class="am-wxt-scene-time-week-label">${Utils.escapeHtml(day.shortLabel || day.label)}</div>
                                            <div class="am-wxt-scene-time-cells">${cells}</div>
                                            <div class="am-wxt-scene-time-week-actions">
                                                <button type="button" class="am-wxt-scene-time-copy" data-scene-popup-time-copy-day="${Utils.escapeHtml(day.key)}" data-scene-popup-time-copy-group="workday">工作日</button>
                                                <button type="button" class="am-wxt-scene-time-copy" data-scene-popup-time-copy-day="${Utils.escapeHtml(day.key)}" data-scene-popup-time-copy-group="weekend">周末</button>
                                                <button type="button" class="am-wxt-scene-time-copy" data-scene-popup-time-copy-day="${Utils.escapeHtml(day.key)}" data-scene-popup-time-copy-group="other">其他</button>
                                            </div>
                                        </div>
                                    `;
                                }).join('');
                                timeGrid.innerHTML = `
                                    <div class="am-wxt-scene-time-head">
                                        <div class="am-wxt-scene-time-head-day">星期</div>
                                        <div class="am-wxt-scene-time-hours">${hourHeaderHtml}</div>
                                        <div class="am-wxt-scene-time-head-actions">复制到</div>
                                    </div>
                                    <div class="am-wxt-scene-time-body">${rowHtml}</div>
                                `;
                                renderTimeTemplateButtons();
                                renderTimeRecommendCards();
                            };

                            tabButtons.forEach(btn => {
                                if (!(btn instanceof HTMLButtonElement)) return;
                                btn.onclick = () => {
                                    currentTab = String(btn.getAttribute('data-scene-popup-advanced-tab') || '').trim() || currentTab;
                                    renderTabs();
                                };
                            });
                            if (adzoneListEl instanceof HTMLElement) {
                                adzoneListEl.addEventListener('click', (event) => {
                                    const target = event.target instanceof HTMLElement
                                        ? event.target.closest('[data-scene-popup-adzone-row-toggle]')
                                        : null;
                                    if (!(target instanceof HTMLElement)) return;
                                    const index = toNumber(target.getAttribute('data-scene-popup-adzone-row-toggle'), -1);
                                    const nextEnabled = String(target.getAttribute('data-scene-popup-adzone-next') || '').trim() === 'on';
                                    if (!Number.isFinite(index) || index < 0 || index >= adzoneList.length) return;
                                    adzoneList[index] = setAdzoneStatus(adzoneList[index], nextEnabled);
                                    renderAdzoneList();
                                });
                            }
                            mask.querySelectorAll('[data-scene-popup-adzone-batch]').forEach(btn => {
                                if (!(btn instanceof HTMLButtonElement)) return;
                                btn.onclick = () => {
                                    const nextEnabled = String(btn.getAttribute('data-scene-popup-adzone-batch') || '').trim() === 'on';
                                    adzoneList = adzoneList.map(item => setAdzoneStatus(item, nextEnabled));
                                    renderAdzoneList();
                                };
                            });
                            areaTemplateButtons.forEach(input => {
                                if (!(input instanceof HTMLInputElement)) return;
                                input.addEventListener('change', () => {
                                    const templateKey = String(input.getAttribute('data-scene-popup-area-template') || '').trim();
                                    if (!templateKey || !input.checked) return;
                                    applyAreaTemplate(templateKey);
                                });
                            });
                            if (areaRecommendTemplateSelect instanceof HTMLSelectElement) {
                                areaRecommendTemplateSelect.addEventListener('change', () => {
                                    if (areaTemplate !== 'recommended') return;
                                    applyAreaTemplate('recommended');
                                });
                            }
                            if (areaCustomTemplateSelect instanceof HTMLSelectElement) {
                                areaCustomTemplateSelect.addEventListener('change', () => {
                                    if (areaTemplate !== 'custom') return;
                                    applyAreaTemplate('custom');
                                });
                            }
                            if (areaSaveTemplateButton instanceof HTMLButtonElement) {
                                areaSaveTemplateButton.addEventListener('click', () => {
                                    const selectedKey = String(
                                        areaCustomTemplateSelect instanceof HTMLSelectElement
                                            ? areaCustomTemplateSelect.value
                                            : 'migration_rx600_standard'
                                    ).trim() || 'migration_rx600_standard';
                                    areaCustomTemplateMap[selectedKey] = normalizeAreaListForStorage(areaList)
                                        .filter(item => !/^all$/i.test(String(item || '').trim()));
                                    areaTemplate = 'custom';
                                    renderAreaTemplateButtons();
                                });
                            }
                            areaModeButtons.forEach(btn => {
                                if (!(btn instanceof HTMLButtonElement)) return;
                                btn.onclick = () => {
                                    const modeKey = String(btn.getAttribute('data-scene-popup-area-mode') || '').trim();
                                    if (!modeKey) return;
                                    areaMode = normalizeAreaModeKey(modeKey);
                                    areaExpandedProvinceSet.clear();
                                    renderAreaSelector();
                                };
                            });
                            if (areaSearchInput instanceof HTMLInputElement) {
                                areaSearchInput.addEventListener('input', () => {
                                    areaSearchKeyword = String(areaSearchInput.value || '').trim();
                                    if (areaSearchKeyword) {
                                        areaExpandedProvinceSet.clear();
                                    }
                                    renderAreaSelector();
                                });
                            }
                            if (areaSelector instanceof HTMLElement) {
                                areaSelector.addEventListener('click', (event) => {
                                    const groupTrigger = event.target instanceof HTMLElement
                                        ? event.target.closest('[data-scene-popup-area-group-toggle]')
                                        : null;
                                    if (groupTrigger instanceof HTMLElement) {
                                        const group = String(groupTrigger.getAttribute('data-scene-popup-area-group-toggle') || '').trim();
                                        if (!group) return;
                                        const groupCodes = getAreaCodesBySection(group);
                                        const selected = buildSelectedAreaCodeSet(areaList);
                                        const allChecked = groupCodes.length > 0
                                            && groupCodes.every(code => isProvinceFullySelected(getAreaProvinceByCode(code), selected));
                                        toggleAreaGroupSelection(group, !allChecked);
                                        renderAreaSelector();
                                        return;
                                    }
                                    const cityTrigger = event.target instanceof HTMLElement
                                        ? event.target.closest('[data-scene-popup-area-city-toggle]')
                                        : null;
                                    if (cityTrigger instanceof HTMLElement) {
                                        const provinceCode = String(cityTrigger.getAttribute('data-scene-popup-area-city-parent') || '').trim();
                                        const cityCode = String(cityTrigger.getAttribute('data-scene-popup-area-city-toggle') || '').trim();
                                        if (!provinceCode || !cityCode) return;
                                        const selected = buildSelectedAreaCodeSet(areaList);
                                        const checked = isCitySelected(cityCode, provinceCode, selected);
                                        toggleAreaCitySelection(provinceCode, cityCode, !checked);
                                        renderAreaSelector();
                                        return;
                                    }
                                    const provinceTrigger = event.target instanceof HTMLElement
                                        ? event.target.closest('[data-scene-popup-area-province-toggle]')
                                        : null;
                                    if (provinceTrigger instanceof HTMLElement) {
                                        const provinceCode = String(provinceTrigger.getAttribute('data-scene-popup-area-province-toggle') || '').trim();
                                        if (!provinceCode) return;
                                        const selected = buildSelectedAreaCodeSet(areaList);
                                        const checked = isProvinceFullySelected(getAreaProvinceByCode(provinceCode), selected);
                                        toggleAreaProvinceSelection(provinceCode, !checked);
                                        renderAreaSelector();
                                        return;
                                    }
                                    const expandTrigger = event.target instanceof HTMLElement
                                        ? event.target.closest('[data-scene-popup-area-city-expand], [data-scene-popup-area-province-open]')
                                        : null;
                                    if (expandTrigger instanceof HTMLElement) {
                                        const provinceCode = String(expandTrigger.getAttribute('data-scene-popup-area-city-expand') || '').trim();
                                        if (!provinceCode) return;
                                        if (areaExpandedProvinceSet.has(provinceCode)) {
                                            areaExpandedProvinceSet.delete(provinceCode);
                                        } else {
                                            areaExpandedProvinceSet = new Set([provinceCode]);
                                        }
                                        renderAreaSelector();
                                        return;
                                    }
                                    const itemTrigger = event.target instanceof HTMLElement
                                        ? event.target.closest('[data-scene-popup-area-item-toggle]')
                                        : null;
                                    if (!(itemTrigger instanceof HTMLElement)) return;
                                    const areaCode = String(itemTrigger.getAttribute('data-scene-popup-area-item-toggle') || '').trim();
                                    if (!areaCode) return;
                                    const selected = buildSelectedAreaCodeSet(areaList);
                                    const checked = selected.has(areaCode);
                                    toggleAreaItemSelection(areaCode, !checked);
                                    renderAreaSelector();
                                });
                            }
                            timeTemplateButtons.forEach(btn => {
                                if (!(btn instanceof HTMLButtonElement)) return;
                                btn.onclick = () => {
                                    const templateKey = String(btn.getAttribute('data-scene-popup-time-template') || '').trim();
                                    if (templateKey === 'full') {
                                        launchPeriodGridState = createEmptyLaunchPeriodGridState();
                                        setAllLaunchPeriodSlots(true);
                                        timeTemplate = 'full';
                                        timeRecommendPreset = '';
                                    } else if (templateKey === 'dishwasher') {
                                        launchPeriodGridState = createEmptyLaunchPeriodGridState();
                                        setAllLaunchPeriodSlots(false);
                                        setHourRange(WEEKDAY_DAY_KEYS, 9, 12, true);
                                        setHourRange(WEEKDAY_DAY_KEYS, 18, 23, true);
                                        setHourRange(WEEKEND_DAY_KEYS, 10, 23, true);
                                        timeTemplate = 'dishwasher';
                                        timeRecommendPreset = '';
                                    } else if (templateKey === 'custom') {
                                        timeTemplate = 'custom';
                                    } else {
                                        launchPeriodGridState = deepClone(initialLaunchPeriodGridState);
                                        timeTemplate = 'current';
                                        timeRecommendPreset = '';
                                    }
                                    renderTimeGrid();
                                };
                            });
                            timeRecommendCards.forEach(btn => {
                                if (!(btn instanceof HTMLButtonElement)) return;
                                btn.onclick = () => {
                                    const recommendKey = String(btn.getAttribute('data-scene-popup-time-recommend-card') || '').trim();
                                    if (!recommendKey) return;
                                    applyTimeRecommendCard(recommendKey);
                                };
                            });
                            if (timeGrid instanceof HTMLElement) {
                                const applyFromCell = (cell, enabled) => {
                                    const dayKey = String(cell.getAttribute('data-scene-popup-time-day') || '').trim();
                                    const slotKey = String(cell.getAttribute('data-scene-popup-time-range') || '').trim();
                                    if (!dayKey || !slotKey) return;
                                    setTimeSlot(dayKey, slotKey, enabled);
                                };
                                timeGrid.addEventListener('mousedown', (event) => {
                                    const cell = event.target instanceof HTMLElement
                                        ? event.target.closest('[data-scene-popup-time-slot]')
                                        : null;
                                    if (!(cell instanceof HTMLElement)) return;
                                    event.preventDefault();
                                    const dayKey = String(cell.getAttribute('data-scene-popup-time-day') || '').trim();
                                    const slotKey = String(cell.getAttribute('data-scene-popup-time-range') || '').trim();
                                    const current = !!launchPeriodGridState?.[dayKey]?.[slotKey];
                                    dragState = { active: true, next: !current };
                                    applyFromCell(cell, !current);
                                    timeTemplate = 'custom';
                                    timeRecommendPreset = '';
                                    renderTimeGrid();
                                });
                                timeGrid.addEventListener('mouseover', (event) => {
                                    if (!dragState.active) return;
                                    const cell = event.target instanceof HTMLElement
                                        ? event.target.closest('[data-scene-popup-time-slot]')
                                        : null;
                                    if (!(cell instanceof HTMLElement)) return;
                                    applyFromCell(cell, !!dragState.next);
                                    timeTemplate = 'custom';
                                    timeRecommendPreset = '';
                                    renderTimeGrid();
                                });
                                timeGrid.addEventListener('click', (event) => {
                                    const trigger = event.target instanceof HTMLElement
                                        ? event.target.closest('[data-scene-popup-time-copy-day]')
                                        : null;
                                    if (!(trigger instanceof HTMLElement)) return;
                                    const sourceDayKey = String(trigger.getAttribute('data-scene-popup-time-copy-day') || '').trim();
                                    const group = String(trigger.getAttribute('data-scene-popup-time-copy-group') || '').trim();
                                    if (!sourceDayKey || !group) return;
                                    copyDayPatternToGroup(sourceDayKey, group);
                                });
                                const handleMouseUp = () => {
                                    dragState = { active: false, next: null };
                                };
                                document.addEventListener('mouseup', handleMouseUp);
                                mask._amWxtCleanup = () => {
                                    document.removeEventListener('mouseup', handleMouseUp);
                                };
                            }
                            mask.querySelectorAll('[data-scene-popup-time-action]').forEach(btn => {
                                if (!(btn instanceof HTMLButtonElement)) return;
                                btn.onclick = () => {
                                    const action = String(btn.getAttribute('data-scene-popup-time-action') || '').trim();
                                    if (action === 'clear') {
                                        launchPeriodGridState = createEmptyLaunchPeriodGridState();
                                        timeTemplate = 'custom';
                                        timeRecommendPreset = '';
                                    } else if (action === 'reset') {
                                        launchPeriodGridState = deepClone(initialPeriodGridState);
                                        timeTemplate = 'current';
                                        timeRecommendPreset = '';
                                    }
                                    renderTimeGrid();
                                };
                            });

                            renderTabs();
                            renderAdzoneList();
                            renderAreaTemplateButtons();
                            renderAreaModeButtons();
                            renderAreaSelector();
                            renderTimeGrid();

                            mask.dataset.scenePopupSyntheticAdzone = syntheticOnly ? '1' : '0';
                            mask._scenePopupState = {
                                getAdzoneList: () => deepClone(adzoneList),
                                getLaunchAreaList: () => (Array.isArray(areaList) ? areaList.slice() : ['all']),
                                getLaunchPeriodGridState: () => deepClone(launchPeriodGridState)
                            };
                        },
                        onSave: (mask) => {
                            const syntheticOnly = String(mask.dataset.scenePopupSyntheticAdzone || '') === '1';
                            const state = mask._scenePopupState || {};
                            const adzoneListRaw = typeof state.getAdzoneList === 'function' ? state.getAdzoneList() : [];
                            const launchAreaListRaw = typeof state.getLaunchAreaList === 'function' ? state.getLaunchAreaList() : ['all'];
                            const launchPeriodGridState = typeof state.getLaunchPeriodGridState === 'function'
                                ? state.getLaunchPeriodGridState()
                                : createEmptyLaunchPeriodGridState();

                            const normalizedAdzoneList = Array.isArray(adzoneListRaw)
                                ? adzoneListRaw
                                    .filter(item => isPlainObject(item))
                                    .map(item => {
                                        const next = deepClone(item);
                                        delete next.__defaultSynthetic;
                                        return next;
                                    })
                                : [];
                            const useDefaultAdzone = syntheticOnly && normalizedAdzoneList.every(item => isAdzoneStatusEnabled(item));
                            const finalAdzoneList = useDefaultAdzone ? [] : normalizedAdzoneList;
                            const finalLaunchAreaList = uniqueBy(
                                (Array.isArray(launchAreaListRaw) ? launchAreaListRaw : ['all'])
                                    .map(item => String(item || '').trim())
                                    .filter(Boolean),
                                item => item
                            );
                            const nextAreaList = !finalLaunchAreaList.length || finalLaunchAreaList.some(item => /^all$/i.test(item))
                                ? ['all']
                                : finalLaunchAreaList;
                            const nextLaunchPeriodList = buildLaunchPeriodListFromGridState(launchPeriodGridState);
                            const nextAdzoneRaw = JSON.stringify(finalAdzoneList);
                            const nextLaunchAreaRaw = JSON.stringify(nextAreaList);
                            const nextLaunchPeriodRaw = JSON.stringify(nextLaunchPeriodList);

                            return {
                                ok: true,
                                adzoneRaw: nextAdzoneRaw,
                                launchAreaRaw: nextLaunchAreaRaw,
                                launchPeriodRaw: nextLaunchPeriodRaw,
                                adzoneSummary: describeAdzoneSummary(nextAdzoneRaw),
                                launchAreaSummary: describeLaunchAreaSummary(nextLaunchAreaRaw),
                                launchPeriodSummary: describeLaunchPeriodSummary(nextLaunchPeriodRaw)
                            };
                        }
                    });
                    if (!result || result.ok !== true) return null;
                    return {
                        ok: true,
                        result,
                        adzoneControl,
                        launchPeriodControl,
                        launchAreaControl
                    };
                };
