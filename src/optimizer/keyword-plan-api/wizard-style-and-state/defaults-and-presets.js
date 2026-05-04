        const getDefaultStrategyList = () => ([
            {
                id: 'search_detent',
                name: '关键词推广-搜索卡位',
                marketingGoal: '搜索卡位',
                enabled: true,
                dayAverageBudget: '100',
                bidMode: 'smart',
                budgetType: 'day_average',
                useWordPackage: DEFAULTS.useWordPackage,
                sceneSettings: {
                    营销目标: '搜索卡位',
                    选择卡位方案: '搜索卡位',
                    卡位方式: '抢首条'
                }
            },
            {
                id: 'trend_star',
                name: '关键词推广-趋势明星',
                marketingGoal: '趋势明星',
                enabled: true,
                dayAverageBudget: '100',
                bidMode: 'smart',
                budgetType: 'day_average',
                bidTargetV2: 'conv',
                useWordPackage: DEFAULTS.useWordPackage,
                sceneSettings: {
                    营销目标: '趋势明星',
                    选择卡位方案: '趋势明星',
                    出价目标: '获取成交量'
                }
            },
            {
                id: 'golden_traffic_card',
                name: '关键词推广-流量金卡',
                marketingGoal: '流量金卡',
                enabled: true,
                dayAverageBudget: '100',
                bidMode: 'smart',
                budgetType: 'day_average',
                bidTargetV2: 'conv',
                useWordPackage: DEFAULTS.useWordPackage,
                sceneSettings: {
                    营销目标: '流量金卡',
                    选择卡位方案: '流量金卡',
                    套餐卡: '类目精准词卡',
                    套餐包档位: '自定义预算包',
                    套餐包自动续投: '开启',
                    支付方式: '余额支付'
                }
            },
            {
                id: 'custom_define',
                name: '关键词推广-自定义推广',
                marketingGoal: '自定义推广',
                enabled: true,
                dayAverageBudget: '100',
                bidMode: 'smart',
                budgetType: 'day_average',
                bidTargetV2: 'conv',
                useWordPackage: DEFAULTS.useWordPackage,
                sceneSettings: {
                    营销目标: '自定义推广',
                    选择卡位方案: '自定义推广',
                    出价目标: '获取成交量',
                    匹配方式: '广泛'
                }
            }
        ]);

        const buildDefaultMatrixConfig = () => ({
            enabled: false,
            maxCombinations: MATRIX_LIMITS.maxCombinations,
            batchSize: MATRIX_LIMITS.batchSize,
            namingPattern: MATRIX_DEFAULT_NAMING_PATTERN,
            dimensions: []
        });

        const MATRIX_DIMENSION_PRESET_CATALOG = [
            {
                key: 'budget',
                label: '预算值',
                hint: '按当前计划预算类型写入预算；值可用换行或逗号分隔。',
                placeholder: '例如 100, 200',
                suggestedValues: ['100', '200'],
                valueType: 'number'
            },
            {
                key: 'day_budget',
                label: '每日预算',
                hint: '强制写入每日预算；适合需要区分预算类型的矩阵场景。',
                placeholder: '例如 100, 300',
                suggestedValues: ['100', '300'],
                valueType: 'number'
            },
            {
                key: 'day_average_budget',
                label: '日均预算',
                hint: '强制写入日均预算；会覆盖通用预算值绑定。',
                placeholder: '例如 50, 100',
                suggestedValues: ['50', '100'],
                valueType: 'number'
            },
            {
                key: 'bid_mode',
                label: '出价方式',
                hint: '支持按组合切换智能/手动出价。',
                placeholder: '例如 智能出价, 手动出价',
                suggestedValues: ['智能出价', '手动出价'],
                valueInputMode: 'multi_select',
                valueOptions: ['智能出价', '手动出价']
            },
            {
                key: 'bid_target',
                label: '出价目标',
                sceneNames: ['关键词推广'],
                hint: '仅关键词推广生效；会映射到 bidTargetV2/optimizeTarget。',
                placeholder: '例如 获取成交量, 稳定投产比',
                suggestedValues: ['获取成交量', '稳定投产比'],
                valueInputMode: 'multi_select',
                valueOptions: ['获取成交量', '相似品跟投', '抢占搜索卡位', '提升市场渗透', '增加收藏加购量', '增加点击量', '稳定投产比']
            },
            {
                key: 'bid_target_cost_package',
                label: '智能出价目标包',
                sceneNames: ['关键词推广'],
                hint: '仅用于关键词推广-自定义推广-智能出价；每个出价目标单独占一行，同一行可追加多个目标成本/ROI值，不用手写分隔符。',
                valueInputMode: 'package_rows',
                placeholder: '例如 获取成交量|35\n增加收藏加购量|5\n增加点击量|0.5\n稳定投产比|5',
                suggestedValues: ['获取成交量|35', '增加收藏加购量|5', '增加点击量|0.5', '稳定投产比|5']
            },
            {
                key: 'plan_prefix',
                label: '计划名前缀',
                hint: '在命名模板计算前先拼接前缀，适合区分素材/预算分组。',
                placeholder: '例如 核心款, 拉新款',
                suggestedValues: ['核心款', '拉新款'],
                valueType: 'text'
            },
            {
                key: 'material_id',
                label: '商品',
                hint: '值必须命中“已添加商品”池中的商品 ID。',
                placeholder: '例如 682357641421',
                suggestedValues: [],
                valueInputMode: 'multi_select'
            }
        ];
        const MATRIX_SCENE_FIELD_KEY_PREFIX = 'scene_field:';
        const MATRIX_SCENE_FIELD_EXCLUDE_LABEL_RE = /^(场景名称|计划名称|计划名|预算值|每日预算|日均预算|总预算|出价方式|出价目标|商品|手动关键词|核心词设置|创意设置|设置创意|人群设置|设置拉新人群|设置人群|种子人群|投放资源位\/投放地域\/分时折扣|投放资源位\/投放地域\/投放时间|投放资源位|资源位设置|高级设置)$/;
        const MATRIX_SCENE_DIMENSION_FALLBACK_LABELS = {
            '货品全站推广': ['预算类型', '目标投产比', '投放时间', '投放地域', '计划组'],
            '关键词推广': {
                __default: ['流量智选', '冷启加速', '预算类型'],
                搜索卡位: ['卡位方式', '匹配方式', '冷启加速', '预算类型'],
                趋势明星: ['冷启加速', '预算类型', '人群设置', '人群优化目标'],
                流量金卡: ['套餐卡', '套餐包档位', '套餐包自动续投', '支付方式', '冷启加速'],
                自定义推广: ['流量智选', '冷启加速', '预算类型']
            },
            '人群推广': ['预算类型', '资源位溢价', '投放地域/投放时间', '人群设置', '出价目标'],
            '店铺直达': ['预算类型', '投放时间', '创意设置', '推广模式', '计划组'],
            '内容营销': ['投放时间', '出价方式', '优化目标', '人群设置', '创意设置'],
            '线索推广': ['投放时间', '投放地域', '套餐包', '种子人群', '预算类型']
        };
        const MATRIX_SCENE_DIMENSION_OPTION_FALLBACKS = {
            '货品全站推广': {
                '预算类型': ['不限预算', '每日预算', '日均预算'],
                '目标投产比': ['5'],
                '投放时间': ['长期投放', '不限时段', '固定时段'],
                '投放地域': ['全部地域'],
                '计划组': ['不设置计划组']
            },
            '关键词推广': {
                '匹配方式': ['广泛', '中心词', '精准'],
                '卡位方式': ['抢首条', '抢前三', '抢首页', '位置不限提升市场渗透'],
                '流量智选': ['开启', '关闭'],
                '冷启加速': ['开启', '关闭'],
                '预算类型': ['每日预算', '日均预算'],
                '人群设置': ['设置优先投放客户', '关闭'],
                '人群优化目标': ['人群优化目标', '关闭'],
                '套餐卡': ['类目精准词卡', '大促成交抢量卡', '高转化卡'],
                '套餐包档位': ['自定义预算包', '增量畅享包', '自定义成交包'],
                '套餐包自动续投': ['开启', '关闭'],
                '支付方式': ['余额支付', '支付宝支付']
            },
            '人群推广': {
                '预算类型': ['每日预算', '日均预算'],
                '资源位溢价': ['默认溢价', '自定义溢价'],
                '投放地域/投放时间': ['默认投放', '自定义设置'],
                '人群设置': ['智能人群', '手动添加人群'],
                '出价目标': ['稳定投产比', '获取成交量', '收藏加购量', '增加点击量']
            },
            '店铺直达': {
                '预算类型': ['每日预算', '日均预算'],
                '投放时间': ['长期投放', '不限时段', '固定时段'],
                '创意设置': ['系统优选', '自定义创意'],
                '推广模式': ['店铺直达'],
                '计划组': ['不设置计划组']
            },
            '内容营销': {
                '投放时间': ['长期投放', '不限时段', '固定时段'],
                '出价方式': ['最大化拿量', '智能出价'],
                '优化目标': ['增加净成交金额', '增加成交金额', '增加观看次数'],
                '人群设置': ['智能人群', '自定义人群'],
                '创意设置': ['系统优选', '自定义创意']
            },
            '线索推广': {
                '投放时间': ['长期投放', '不限时段', '固定时段'],
                '投放地域': ['全部地域'],
                '套餐包': ['默认套餐包'],
                '种子人群': ['智能人群', '手动添加人群'],
                '预算类型': ['每日预算', '日均预算']
            }
        };
        const MATRIX_SCENE_DIMENSION_DEFAULT_VALUES = {
            '货品全站推广': {
                '预算类型': '不限预算',
                '目标投产比': '5',
                '投放时间': '长期投放',
                '投放地域': '全部地域',
                '计划组': '不设置计划组'
            },
            '关键词推广': {
                '匹配方式': '广泛',
                '卡位方式': '抢首条',
                '流量智选': '开启',
                '冷启加速': '开启',
                '预算类型': '每日预算'
            },
            '人群推广': {
                '预算类型': '每日预算',
                '资源位溢价': '默认溢价',
                '投放地域/投放时间': '默认投放',
                '人群设置': '智能人群',
                '出价目标': '稳定投产比'
            },
            '店铺直达': {
                '预算类型': '每日预算',
                '投放时间': '长期投放',
                '创意设置': '系统优选',
                '推广模式': '店铺直达',
                '计划组': '不设置计划组'
            },
            '内容营销': {
                '投放时间': '长期投放',
                '出价方式': '最大化拿量',
                '优化目标': '增加净成交金额',
                '人群设置': '智能人群',
                '创意设置': '系统优选'
            },
            '线索推广': {
                '投放时间': '长期投放',
                '投放地域': '全部地域',
                '套餐包': '默认套餐包',
                '种子人群': '智能人群',
                '预算类型': '每日预算'
            }
        };
        const MATRIX_SCENE_STRICT_OPTION_TYPE_SET = new Set(['goal', 'bidType', 'bidTarget', 'budgetType', 'itemMode', 'keyword', 'crowd', 'schedule']);
        const MATRIX_KEYWORD_BID_TARGET_COST_FIELD_LABEL_RE = /^(设置7日投产比|目标投产比|ROI目标值|出价目标值|约束值|设置平均成交成本|平均直接成交成本|平均成交成本|直接成交成本|单次成交成本|目标成交成本|目标成本|设置平均收藏加购成本|平均收藏加购成本|收藏加购成本|设置平均点击成本|平均点击成本|点击成本)$/;
        const MATRIX_SCENE_RENDER_FIELD_ALIAS_RULES = [
            { pattern: /^(关键词设置|核心词设置)$/, label: '核心词设置' },
            { pattern: /^(开启冷启加速|冷启加速)$/, label: '冷启加速' },
            { pattern: /^(设置创意|创意设置|创意模式)$/, label: '创意设置' },
            { pattern: /^(设置拉新人群|设置人群|人群设置|种子人群)$/, label: '人群设置' },
            { pattern: /^(净目标投产比|目标投产比|ROI目标值|出价目标值|约束值)$/, label: '目标投产比' },
            { pattern: /^(投放日期|投放时间|分时折扣|排期)$/, label: '投放时间' },
            { pattern: /^(发布日期|发布时间)$/, label: '投放时间' },
            { pattern: /^(选择推广商品|选品方式)$/, label: '选品方式' },
            { pattern: /^(方案选择|选择方案)$/, label: '选择方案' },
            { pattern: /^(设置计划组|计划组设置)$/, label: '计划组' }
        ];
