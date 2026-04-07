        const getRuntimeDefaults = async (forceRefresh = false) => {
            if (!forceRefresh && runtimeCache.value) {
                return deepClone(runtimeCache.value);
            }

            const routeBizCode = normalizeSceneBizCode(parseRouteParamFromHash('bizCode'));
            const domDefaults = inferRuntimeFromDom();
            const runtime = {
                ...DEFAULTS,
                ...domDefaults,
                solutionTemplate: null,
                storeData: null
            };
            if (routeBizCode) {
                runtime.bizCode = routeBizCode;
                if (routeBizCode !== DEFAULTS.bizCode) {
                    runtime.promotionScene = domDefaults.promotionScene || '';
                    runtime.itemSelectedMode = domDefaults.itemSelectedMode || '';
                    runtime.bidTypeV2 = domDefaults.bidTypeV2 || '';
                    runtime.bidTargetV2 = '';
                    runtime.optimizeTarget = '';
                }
            }

            let solutionData = await invokeMainVframe('getSolutionData');
            if ((!solutionData || !Array.isArray(solutionData.solutionList) || !solutionData.solutionList.length)) {
                const bridgedSolutionData = await invokeSolutionDataViaPageBridge(routeBizCode, {
                    timeoutMs: 6200
                });
                if (bridgedSolutionData && Array.isArray(bridgedSolutionData.solutionList) && bridgedSolutionData.solutionList.length) {
                    solutionData = bridgedSolutionData;
                }
            }
            if (solutionData && Array.isArray(solutionData.solutionList) && solutionData.solutionList.length) {
                const matchedSolution = routeBizCode
                    ? solutionData.solutionList.find(solution => normalizeSceneBizCode(
                        solution?.bizCode || solution?.campaign?.bizCode || solutionData?.storeData?.bizCode || ''
                    ) === routeBizCode)
                    : null;
                const firstSolution = deepClone(matchedSolution || solutionData.solutionList[0]);
                const templateBizCode = normalizeSceneBizCode(
                    firstSolution?.bizCode || firstSolution?.campaign?.bizCode || solutionData?.storeData?.bizCode || ''
                );
                // 路由已知时，模板必须携带同场景 bizCode 才可复用，避免串用上一个场景模板。
                const shouldUseTemplate = !routeBizCode || (templateBizCode && templateBizCode === routeBizCode);
                if (shouldUseTemplate && firstSolution) {
                    runtime.solutionTemplate = {
                        bizCode: templateBizCode || runtime.bizCode,
                        campaign: sanitizeCampaign(firstSolution.campaign || {}),
                        adgroupList: Array.isArray(firstSolution.adgroupList)
                            ? firstSolution.adgroupList.map(sanitizeAdgroup)
                            : []
                    };
                }

                const storeData = deepClone(solutionData.storeData || {});
                const storeDataBizCode = normalizeSceneBizCode(storeData?.bizCode || runtime?.solutionTemplate?.bizCode || '');
                if (!routeBizCode || (storeDataBizCode && storeDataBizCode === routeBizCode)) {
                    runtime.storeData = storeData;
                }

                runtime.bizCode = normalizeSceneBizCode(runtime.solutionTemplate?.bizCode || runtime.bizCode);
                runtime.itemSelectedMode = runtime.storeData?.itemSelectedMode || runtime.itemSelectedMode;
                runtime.promotionScene = runtime.storeData?.promotionScene || runtime.promotionScene;
                runtime.bidTypeV2 = runtime.storeData?.bidTypeV2 || runtime.bidTypeV2;
                runtime.bidTargetV2 = runtime.storeData?.bidTargetV2 || runtime.bidTargetV2;
                runtime.dmcType = runtime.storeData?.dmcType || runtime.solutionTemplate?.campaign?.dmcType || runtime.dmcType;
                BUDGET_FIELDS.forEach(field => {
                    if (runtime.storeData?.[field] !== undefined && runtime.storeData?.[field] !== null && runtime.storeData?.[field] !== '') {
                        runtime[field] = runtime.storeData[field];
                    } else if (runtime.solutionTemplate?.campaign?.[field] !== undefined && runtime.solutionTemplate?.campaign?.[field] !== null && runtime.solutionTemplate?.campaign?.[field] !== '') {
                        runtime[field] = runtime.solutionTemplate.campaign[field];
                    }
                });
                if (runtime.storeData?.dayAverageBudget) {
                    runtime.dayAverageBudget = runtime.storeData.dayAverageBudget;
                }
            }

            runtimeCache.value = runtime;
            runtimeCache.ts = Date.now();
            return deepClone(runtime);
        };

        const SCENE_NAME_LIST = ['货品全站推广', '关键词推广', '人群推广', '店铺直达', '内容营销', '线索推广'];
        const SCENE_BIZCODE_HINT_FALLBACK = {
            '货品全站推广': 'onebpSite',
            '关键词推广': 'onebpSearch',
            '人群推广': 'onebpDisplay',
            '店铺直达': 'onebpStarShop',
            '内容营销': 'onebpLive',
            '线索推广': 'onebpAdStrategyLiuZi'
        };
        const SCENE_BIZCODE_ALIAS_MAP = {
            onebpSite: 'onebpSite',
            onebpSearch: 'onebpSearch',
            onebpDisplay: 'onebpDisplay',
            onebpShopMarketing: 'onebpStarShop',
            onebpStarShop: 'onebpStarShop',
            onebpContentMarketing: 'onebpLive',
            onebpLive: 'onebpLive',
            onebpAdStrategyLiuZi: 'onebpAdStrategyLiuZi'
        };
        const normalizeSceneBizCode = (bizCode = '') => {
            const normalized = String(bizCode || '').trim();
            if (!normalized) return '';
            return String(SCENE_BIZCODE_ALIAS_MAP[normalized] || normalized).trim();
        };
        const resolveRuntimeBizCode = (runtime = {}) => {
            const candidates = [
                runtime?.solutionTemplate?.bizCode,
                runtime?.storeData?.bizCode,
                runtime?.bizCode
            ];
            for (const candidate of candidates) {
                const normalized = normalizeSceneBizCode(candidate);
                if (normalized) return normalized;
            }
            return '';
        };
        const isRuntimeBizCodeMatched = (runtime = {}, expectedBizCode = '', options = {}) => {
            const expected = normalizeSceneBizCode(expectedBizCode);
            if (!expected) return true;
            const coreCandidates = [
                runtime?.bizCode,
                runtime?.solutionTemplate?.bizCode,
                runtime?.storeData?.bizCode
            ].map(item => normalizeSceneBizCode(item)).filter(Boolean);
            if (coreCandidates.length) {
                return coreCandidates.includes(expected);
            }
            if (options?.includeRoute === false) return false;
            const routeBizCode = normalizeSceneBizCode(parseRouteParamFromHash('bizCode'));
            return !!routeBizCode && routeBizCode === expected;
        };
        const SCENE_REQUIRE_ITEM_FALLBACK = {
            '货品全站推广': true,
            '关键词推广': true,
            '人群推广': true,
            '店铺直达': false,
            '内容营销': false,
            '线索推广': true
        };
        const SCENE_FORCE_ADGROUP_MATERIAL = {
            '货品全站推广': true,
            '关键词推广': true,
            '人群推广': true,
            '店铺直达': true,
            '内容营销': true,
            '线索推广': true
        };
        const SCENE_SKIP_TEXT_RE = /^(上手指南|了解更多|了解详情|思考过程|立即投放|生成其他策略|创建完成|保存并关闭|清空|升级|收起|展开)$/;
        const SCENE_FIELD_LABEL_RE = /^(场景名称|营销目标|营销场景|计划名称|预算类型|出价方式|出价目标|目标投产比|净目标投产比|ROI目标值|出价目标值|约束值|设置7日投产比|设置平均成交成本|设置平均收藏加购成本|设置平均点击成本|平均直接成交成本|平均成交成本|平均收藏加购成本|平均点击成本|选品方式|关键词设置|核心词设置|关键词匹配方式|默认匹配方式|匹配方式|流量智选|开启冷启加速|冷启加速|人群设置|过滤人群|优质计划防停投|资源位溢价|投放地域\/投放时间|人群优化目标|客户口径设置|人群价值设置|创意设置|添加商品|选择推广商品|选择解决方案|设置计划组|计划组|收集销售线索|投放资源位\/投放地域\/投放时间|投放资源位\/投放地域\/分时折扣|推广模式|投放策略|投放调优|优化模式|优化目标|投放日期|投放时间|分时折扣|发布日期|投放地域|起量时间地域设置|选择卡位方案|卡位方式|种子人群|套餐包|选择拉新方案|选择方式|选择方案|选择优化方向|选择推广主体|设置拉新人群|设置词包|设置人群|设置创意|设置落地页|设置宝贝落地页|设置出价及预算|设置预算及排期|设置商品推广方案)$/;
        const SCENE_SECTION_ONLY_LABEL_RE = /^(营销场景与目标|营销场景|推广方案设置(?:-.+)?|推广方案设置|设置预算(?:及排期)?|设置基础信息|高级设置|创建完成|收集销售线索|行业解决方案|自定义方案)$/;
        const SCENE_LABEL_NOISE_RE = /[，。,！？!；;]/;
        const SCENE_LABEL_NOISE_PREFIX_RE = /^(请|建议|支持|算法|未添加|如有|当前|完成后|符合条件|在投商品|想探测|卡位客户都在玩|流量规模)/;
        const SCENE_LABEL_NOISE_CONTENT_RE = /(上手指南|了解|可覆盖|预计|提升|完成添加后|完成后可|默认屏蔽|系统默认|仅需|一键创建|投放效果|智能分配|介绍|说明|提示|攻略)/;
        const SCENE_OPTION_NOISE_RE = /(步骤|近\d+天|上涨|详情|一键|分析|策略属性|案例|案例魔方|帮我快速|竞争案例|搜更多|完成|主播|主播ID|ID：|HOT|NEW|思考过程|上手指南|了解更多|点击查看|推荐理由|覆盖|潜力|同比|环比|一站式|能力介绍|定制投放策略|分行业定制)/i;
        const SCENE_DYNAMIC_FIELD_BLOCK_RE = /(步骤|案例|同行|上涨|关键作用|全链路|打造|双出价模式|近\d+天|一键|详情|主播|ID|HOT|NEW|分析|策略属性|匹配到|完成|覆盖|潜力|同比|环比|帮我快速|竞争案例|已设置\d+个关键词|修改匹配方案)/i;
        const SCENE_KEYWORD_HINT_RE = /(设置|选择|预算|出价|关键词|人群|创意|商品|投放|落地页|线索|计划|方案|目标|资源位|地域|时间|店铺|内容|货品)/;
        const SCENE_FORBIDDEN_ACTION_RE = /(创建完成|立即投放|保存并关闭|确认提交|提交并投放|提交计划|确认投放|创建计划|确定提交|提交审核)/;
        const SCENE_SECTION_HINT_RE = /(营销场景与目标|推广方案设置|选择推广商品|设置出价及预算|设置预算及排期|设置基础信息|高级设置|设置商品推广方案|设置落地页|收集销售线索|设置创意|设置推广方案|设置计划组|核心词设置|设置拉新人群|投放日期|投放时间|分时折扣|设置人群|选择解决方案)/;
        const SCENE_REQUIRED_GUESS_RE = /(预算|出价|目标|计划名称|计划名|商品|关键词|人群|投放|创意|方式|类型|落地页|线索|方案)/;
        const SCENE_GOAL_GROUP_HINT_RE = /(营销目标|优化目标|投放目标|目标)/;
        const SCENE_GOAL_OPTION_HINT_RE = /(卡位|趋势|金卡|自定义|拉新|成交|点击|收藏|加购|渗透|投产|ROI|线索|留资|观看|转化|曝光|引流|促活|店铺|内容|直播|收集)/i;
        const SCENE_GOAL_OPTION_SKIP_RE = /(添加商品|添加关键词|添加种子人群|设置基础信息|高级设置|预算|出价|计划名称|计划名|上手指南|了解更多|思考过程|保存并关闭|创建完成|立即投放|场景名称|营销场景与目标|设置预算|设置出价|设置推广|投放时间|分时折扣|投放资源位)/;
        const SCENE_GOAL_LABEL_HINTS = [
            '货品全站推广',
            '关键词推广',
            '人群推广',
            '店铺直达',
            '内容营销',
            '线索推广',
            '搜索卡位',
            '趋势明星',
            '流量金卡',
            '自定义推广',
            '高效拉新',
            '竞店拉新',
            '借势转化',
            '机会人群拉新',
            '跨类目拉新',
            '直播间成长',
            '商品打爆',
            '拉新增粉',
            '全站推广',
            '收集销售线索',
            '行业解决方案'
        ];
        const SCENE_GOAL_RUNTIME_KEYS = [
            'bizCode',
            'promotionScene',
            'optimizeTarget',
            'bidTypeV2',
            'bidTargetV2',
            'orderChargeType',
            'dmcType',
            'itemSelectedMode',
            'subPromotionType',
            'promotionType',
            'promotionModel',
            'promotionModelMarketing'
        ];
        const SCENE_CREATE_ENDPOINT_FALLBACK = '/solution/addList.json';
        const SCENE_BIZCODE_TO_NAME_FALLBACK = Object.keys(SCENE_BIZCODE_HINT_FALLBACK).reduce((acc, sceneName) => {
            const bizCode = String(SCENE_BIZCODE_HINT_FALLBACK[sceneName] || '').trim();
            if (!bizCode || acc[bizCode]) return acc;
            acc[bizCode] = sceneName;
            return acc;
        }, {});
        const GOAL_CONTRACT_RUNTIME_PATCH_KEYS = [
            'promotionScene',
            'optimizeTarget',
            'bidTypeV2',
            'bidTargetV2',
            'orderChargeType',
            'dmcType',
            'itemSelectedMode',
            'subPromotionType',
            'promotionType',
            'promotionModel',
            'promotionModelMarketing',
            'selectedTargetBizCode',
            'dmpSolutionId',
            'activityId',
            'specialSourceForMainStep',
            'bpStrategyId',
            'bpStrategyType',
            'subOptimizeTarget'
        ];
        const SCENE_SPEC_CACHE_STORAGE_KEY = 'am.wxt.plan_api.scene_spec_cache.v2';
        const SCENE_SPEC_CACHE_TTL_MS = 12 * 60 * 60 * 1000;
        const SCENE_CREATE_CONTRACT_CACHE_STORAGE_KEY = 'am.wxt.plan_api.scene_contract_cache.v1';
        const SCENE_CREATE_CONTRACT_CACHE_TTL_MS = 12 * 60 * 60 * 1000;
        const SCENE_LIFECYCLE_CONTRACT_CACHE_STORAGE_KEY = 'am.wxt.plan_api.lifecycle_contract_cache.v1';
        const SCENE_LIFECYCLE_CONTRACT_CACHE_TTL_MS = 12 * 60 * 60 * 1000;
        const LIFECYCLE_ACTION_LIST = ['create', 'list_conflict', 'pause', 'delete'];
        const SCENE_SPEC_FIELD_FALLBACK = {
            '货品全站推广': {
                营销目标: '货品全站推广',
                营销场景: '全域投放 · ROI确定交付',
                选品方式: '自定义选品',
                出价方式: '控投产比投放',
                出价目标: '增加净成交金额',
                目标投产比: '5',
                预算类型: '不限预算',
                投放调优: '多目标优化',
                优化目标: '优化加购',
                多目标预算: '50',
                一键起量预算: '50',
                投放时间: '长期投放',
                投放地域: '全部地域',
                计划组: '不设置计划组'
            },
            '关键词推广': {
                营销目标: '自定义推广',
                出价方式: '智能出价',
                出价目标: '获取成交量',
                预算类型: '每日预算',
                核心词设置: '添加关键词',
                匹配方式: '广泛',
                流量智选: '开启',
                开启冷启加速: '开启',
                卡位方式: '抢首条'
            },
            '人群推广': {
                营销目标: '高效拉新',
                选品方式: '自定义选品',
                预算类型: '每日预算'
            },
            '店铺直达': {
                推广模式: '持续推广',
                预算类型: '每日预算'
            },
            '内容营销': {
                营销目标: '直播间成长',
                优化目标: '增加净成交金额',
                出价方式: '最大化拿量',
                预算类型: '每日预算'
            },
            '线索推广': {
                营销目标: '收集销售线索',
                解决方案: '行业解决方案',
                出价方式: '最大化拿量',
                优化目标: '优化留资获客成本',
                预算类型: '每日预算'
            }
        };
        const SCENE_MARKETING_GOAL_FALLBACK_OPTIONS = {
            '货品全站推广': ['货品全站推广'],
            '关键词推广': ['搜索卡位', '趋势明星', '流量金卡', '自定义推广'],
            '人群推广': ['高效拉新', '竞店拉新', '借势转化', '机会人群拉新', '跨类目拉新', '自定义推广'],
            '店铺直达': ['店铺直达'],
            '内容营销': ['直播间成长', '商品打爆', '拉新增粉'],
            '线索推广': ['收集销售线索', '行业解决方案']
        };
        const KEYWORD_GOAL_RUNTIME_FALLBACK_MAP = [
            {
                pattern: /(流量金卡|金卡)/,
                promotionScene: 'promotion_scene_golden_traffic_card_package',
                itemSelectedMode: 'shop',
                bidTargetV2: 'click'
            },
            {
                pattern: /(搜索卡位|卡位)/,
                promotionScene: 'promotion_scene_search_detent',
                itemSelectedMode: 'search_detent',
                bidTargetV2: 'search_rank'
            },
            {
                pattern: /(趋势明星|趋势|渗透)/,
                promotionScene: 'promotion_scene_search_trend',
                itemSelectedMode: 'trend',
                bidTargetV2: 'market_penetration'
            },
            {
                pattern: /(自定义推广|自定义|手动)/,
                promotionScene: 'promotion_scene_search_user_define',
                itemSelectedMode: 'user_define',
                bidTargetV2: 'conv'
            }
        ];
        const SCENE_GOAL_FIELD_ROW_FALLBACK = {
            '货品全站推广': [
                { label: '营销场景', options: ['全域投放 · ROI确定交付'], defaultValue: '全域投放 · ROI确定交付' },
                { label: '选品方式', options: ['自定义选品', '行业推荐选品'], defaultValue: '自定义选品' },
                { label: '出价方式', options: ['控投产比投放', '最大化拿量'], defaultValue: '控投产比投放' },
                { label: '出价目标', options: ['增加总成交金额', '增加净成交金额'], defaultValue: '增加净成交金额' },
                { label: '预算类型', options: ['不限预算', '每日预算', '日均预算'], defaultValue: '不限预算' },
                { label: '投放调优', options: ['多目标优化', '日常优化'], defaultValue: '多目标优化' },
                { label: '发布日期', options: ['长期投放', '立即投放'], defaultValue: '长期投放' },
                { label: '投放时间', options: ['长期投放', '不限时段', '固定时段'], defaultValue: '长期投放' },
                { label: '投放地域', options: ['全部地域'], defaultValue: '全部地域' },
                { label: '计划组', options: ['不设置计划组'], defaultValue: '不设置计划组' }
            ],
            '关键词推广': {
                __default: [
                    { label: '出价方式', options: ['智能出价', '手动出价'], defaultValue: '智能出价' },
                    { label: '出价目标', options: ['获取成交量', '相似品跟投', '抢占搜索卡位', '提升市场渗透', '增加收藏加购量', '增加点击量', '稳定投产比'], defaultValue: '获取成交量' },
                    { label: '核心词设置', options: ['添加关键词', '系统推荐词', '手动自选词'], defaultValue: '添加关键词' },
                    { label: '匹配方式', options: ['广泛', '中心词', '精准'], defaultValue: '广泛' },
                    { label: '流量智选', options: ['开启', '关闭'], defaultValue: '开启' },
                    { label: '开启冷启加速', options: ['开启', '关闭'], defaultValue: '开启' },
                    { label: '卡位方式', options: ['抢首条', '抢前三', '抢首页', '位置不限提升市场渗透'], defaultValue: '抢首条' },
                    { label: '添加商品', options: ['全部商品', '机会品推荐', '自定义选品'], defaultValue: '全部商品' },
                    { label: '预算类型', options: ['每日预算', '日均预算'], defaultValue: '每日预算' }
                ],
                搜索卡位: [
                    { label: '卡位方式', options: ['抢首条', '抢前三', '抢首页', '位置不限提升市场渗透'], defaultValue: '抢首条' },
                    { label: '匹配方式', options: ['广泛', '中心词', '精准'], defaultValue: '广泛' }
                ],
                趋势明星: [
                    { label: '卡位方式', options: ['抢首条', '抢前三', '抢首页', '位置不限提升市场渗透'], defaultValue: '抢前三' },
                    { label: '匹配方式', options: ['广泛', '中心词', '精准'], defaultValue: '广泛' }
                ],
                流量金卡: [
                    { label: '卡位方式', options: ['抢首条', '抢前三', '抢首页'], defaultValue: '抢首页' },
                    { label: '匹配方式', options: ['广泛', '中心词', '精准'], defaultValue: '广泛' }
                ],
                自定义推广: [
                    { label: '卡位方式', options: ['抢首条', '抢前三', '抢首页'], defaultValue: '抢首条' },
                    { label: '匹配方式', options: ['广泛', '中心词', '精准'], defaultValue: '广泛' }
                ]
            },
            '人群推广': [
                { label: '选择推广商品', options: ['自定义选品', '行业推荐选品'], defaultValue: '自定义选品' },
                { label: '出价方式', options: ['智能出价', '手动出价'], defaultValue: '手动出价' },
                { label: '出价目标', options: ['稳定投产比', '获取成交量（最大化拿量）', '收藏加购量（最大化拿量）', '增加点击量（最大化拿量）', '拉新渗透（竞店重合人群）', '获取成交量', '收藏加购量', '增加点击量'], defaultValue: '获取成交量' },
                { label: '预算类型', options: ['每日预算', '日均预算'], defaultValue: '每日预算' }
            ],
            '店铺直达': [
                { label: '出价方式', options: ['智能出价', '手动出价'], defaultValue: '智能出价' },
                { label: '出价目标', options: ['获取成交量', '稳定投产比', '增加点击量'], defaultValue: '获取成交量' },
                { label: '预算类型', options: ['每日预算', '日均预算'], defaultValue: '每日预算' }
            ],
            '内容营销': [
                { label: '出价方式', options: ['最大化拿量', '控成本'], defaultValue: '最大化拿量' },
                { label: '优化目标', options: ['增加净成交金额', '增加成交金额', '增加观看次数', '增加观看时长'], defaultValue: '增加净成交金额' },
                { label: '预算类型', options: ['每日预算', '日均预算'], defaultValue: '每日预算' }
            ],
            '线索推广': [
                { label: '选择解决方案', options: ['行业解决方案', '自定义方案'], defaultValue: '行业解决方案' },
                { label: '出价方式', options: ['最大化拿量', '控成本'], defaultValue: '最大化拿量' },
                { label: '优化目标', options: ['优化留资获客成本', '获取成交量'], defaultValue: '优化留资获客成本' },
                { label: '预算类型', options: ['每日预算', '日均预算'], defaultValue: '每日预算' }
            ]
        };
        const sceneSpecCache = {
            loaded: false,
            map: {}
        };
        const sceneCreateContractCache = {
            loaded: false,
            map: {}
        };
        const sceneLifecycleContractCache = {
            loaded: false,
            map: {}
        };

        const normalizeText = (text = '') => String(text || '').replace(/\s+/g, ' ').trim();
        const normalizeSceneOptionText = (text = '') => normalizeText(text).replace(/[：:]+$/g, '').trim();
        const normalizeSceneLabelToken = (text = '') => normalizeText(String(text || '').replace(/[：:]/g, ''));
