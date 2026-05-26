/**
 * 更新日志
 *
 * v7.03 (2026-05-14)
 * - 🔐 授权门禁加固：算法护航公开入口接入同步授权校验，避免页面全局函数绕过未授权拦截
 * - 🧩 关键词组包修复：显式空数组不再回落旧模板，按目标裁剪搜索卡位/趋势明星/流量金卡互斥字段
 * - 🧱 Extension 稳定性修复：注入失败展示页面可见错误，page API 默认仅在 debug 开关下暴露
 * - 🛡️ 入口容错增强：主助手、万能查数和算法护航入口捕获同步异常与 Promise reject
 * - ✅ 回归测试扩充：补齐授权、extension 注入、关键词契约和入口异常处理测试
 *
 * v7.02 (2026-04-13)
 * - 🔐 授权识别收敛：shopId/shop_id 主键优先，降级字段仅在多源校验通过后采用，减少同名店铺误判
 * - 🏪 授权管理台升级：新增“子账号/店铺名称”拆分展示；授权到期时间按店铺名称维度同步到同店子账号
 * - ✅ 小万护航手动设置修复：手动勾选默认关闭，主从 checkbox 双向同步，并补齐复选框可见性兼容样式
 * - 🐛 货品全站推广修复：计划创建时保留插件计划名，不再被改写为 site 时间戳
 * - 🎨 人群看板体验优化：同周期列渐显动画单次触发，减少省市加载阶段上方区域闪烁
 *
 * v7.01 (2026-04-07)
 * - 🔖 版本同步：userscript、extension、文档示例展示统一升级到 v7.01
 * - 📝 日志同步：README 与脚本内“最近更新”条目对齐到最新版本
 *
 * v7.00 (2026-04-03)
 * - 🔖 版本升级：发布版本号更新为 v7.00，统一 userscript 与 extension 构建产物版本标识
 *
 * v6.09 (2026-04-02)
 * - 🔧 授权守卫稳定性修复：新增租约到期前自动续租与失败补偿重试，修复“已授权但租约到期后被锁定”问题
 * - 🔧 授权续租兜底增强：force 场景增加 `state/cache shopId` 兜底，减少页面切换瞬态导致的 `shop_not_found` 误锁
 * - ✅ 云端发布门禁加固：License Server 新增 `tablestore` 依赖契约检查，发布流程强制校验依赖清单与锁文件
 *
 * v6.08 (2026-03-24)
 * - 🔧 批量建计划默认提交方式调整：立即投放默认改为“单条”，降低多计划并发误触发风险
 * - 🔧 并发提交语义修复：并发模式改为“批次内所有计划同时提交”，并按并发数复制同计划并发提交
 * - ✅ 回归测试同步：更新提交模式与并发语义契约断言，覆盖并发分支/批次并行/同计划复制提交流程
 *
 * v6.07 (2026-03-23)
 * - 🔧 批量建计划目标策略加固：`strictGoalMatch` 默认开启，request/plan 级 fallback 统一提前失败，避免静默回退继续提交
 * - 🔧 目标匹配策略收敛：`allowFuzzyGoalMatch` 默认关闭；仅显式开启时才允许 fuzzy，且多候选改为告警后回退默认目标
 * - 🔧 计划归一化与失败可观测性增强：支持 `plan.materialId`，多计划禁用 request 级同商品批量回填，drop 计划进入明确失败明细
 * - ✅ 回归测试扩充：新增 `createPlansBatch` strict runtime harness、多计划 strict 隔离断言、早退结果/失败条目结构契约测试
 *
 * v6.06 (2026-03-21)
 * - ✨ 万能查数快捷提交增强：优先走 Magix `setData/search` 提交，减少“点击上方按钮无响应/串话术”问题
 * - 🐛 快捷占比话术修订：省份/城市占比模板移除“点击人群（加购人群或者成交人群）”冗余描述
 * - 🛡️ 提交兜底增强：iframe 提交失败时自动回退原生查数入口，提升按钮可用性
 * - ✅ 回归测试补齐：新增触发器提交流程与弹窗失联恢复测试
 *
 * v6.05 (2026-03-18)
 * - ✨ extension 清单增强：新增 MV3 `icons` 与 `action.default_icon`，补齐浏览器扩展图标声明
 * - 🔧 构建链路增强：build 阶段自动复制 `src/entries/extension-icons/*` 到 `dist/extension/`
 * - ✅ 构建门禁补齐：`--check` 增加 extension 图标文件存在性校验
 * - ✅ 回归测试补齐：新增 manifest 图标配置断言，防止后续回归
 *
 * v6.04 (2026-03-17)
 * - ✨ 开发入口标准化：新增零依赖 package.json 脚本入口，统一 build/test/review/dev 命令入口
 * - 🔧 构建装配维护性优化：抽出共享 runtime segments，减少 userscript 与 extension 装配重复维护
 * - ✅ 仓库卫生门禁增强：review-team 新增 tracked .DS_Store 检查，阻止 macOS 噪音文件入库
 * - ✅ 回归测试补齐：新增 build segment 装配关系与 review-team 仓库卫生断言
 *
 * v6.03 (2026-03-16)
 * - 🐛 人群看板悬停性能修复：预构建指标索引，移除 mousemove 热路径全表扫描
 * - 🐛 周期查询链路修复：base 维度缺失 queryExecutePlan 时立即失败，不再等待额外维度请求
 * - ✅ 回归测试补齐：新增悬停缓存与 base 快速失败断言
 *
 * v6.02 (2026-03-08)
 * - ✨ Dev Loader 列表增强：自定义入口支持备注名，切换列表优先展示备注名
 * - ✨ Dev Loader 交互升级：编辑列表改为逐条管理，可新增、编辑、删除单条入口
 * - 🔧 Dev Loader 编辑体验修复：编辑列表不再依赖浏览器 `prompt/alert`，改为内置弹层
 *
 * v6.01 (2026-02-27)
 * - ✨ 同商品计划识别扩容：并发识别范围覆盖货品全站、关键词、线索、人群四类计划
 * - ✨ 同商品计划日志增强：弹窗新增四类分类统计与全部计划明细，成功场景同样展示完整执行日志
 * - 🔧 商品ID反查增强：补齐 `campaign/get` + `adgroup/get` 兜底链路，支持 `adgroupIdList/adgroupIds` 多结构提取
 * - 🔧 防串商品修复：并发流程不再直接采用地址栏候选商品ID，优先接口与按钮上下文，避免误用旧商品ID
 * - 🔧 同开突破策略增强：全站与自定义计划按业务线批量并发开启，兼容多业务线混合场景
 *
 * v6.00 (2026-02-27)
 * - 🚀 版本主线升级：正式从 v5.x 切换到 v6.x，后续迭代以 6 系列为基线
 * - ✨ 重点更新：主面板三入口与辅助显示交互流程进一步收敛，默认操作更聚焦
 * - 🔧 稳定性增强：配置迁移、版本同步与 Hook 幂等关键路径继续加固
 * - ✅ 发布门禁统一：发版前检查持续收敛到 `scripts/review-team.sh`
 *
 * v5.30 (2026-02-15)
 * - ✅ 新增代码检查团队机制：补充团队职责文档与 PR 检查清单
 * - ✅ 新增一键审查脚本：`scripts/review-team.sh` 统一架构/安全/测试/版本校验
 * - 🔧 CI/Release 流程统一：发布前检查改为复用同一套团队检查入口
 * - 🔧 审查责任自动分配：新增 `.github/CODEOWNERS`
 *
 * v5.29 (2026-02-15)
 * - ✨ 主面板工具区重构：新增「辅助显示」入口，与「算法护航」「万能查数」形成三入口布局
 * - ✨ 辅助显示体验优化：开关区改为主面板内联展开/收起，加入过渡动画并默认收起
 * - 🔧 配置版本化迁移：新增 `configRevision`，升级时自动修正默认配置并持久化
 * - 🔧 默认行为修订：日志区默认折叠，首次打开更聚焦核心操作区
 * - ✅ 冒烟与回归增强：补充辅助显示与配置迁移相关检查，新增本地烟测页 `dev/smoke-harness.html`
 *
 * v5.28 (2026-02-15)
 * - ✨ 万能查数弹窗头部全量重构：替换为新版品牌头图与文案，统一布局与视觉层级
 * - ✨ 弹窗首屏体验优化：iframe 先隐藏后清理再展示，减少前 1 秒整页闪现
 * - 🔧 样式规则改为动态选择器：兼容动态 `mx_*` 节点，补齐 `mb16` 隐藏与 `top` 定位
 * - 🔧 快捷查数文案升级：由“获取计划ID”改为“计划名：{对应计划名}”
 * - 🐛 计划名识别修复：优先匹配计划区块 `a[title]`，规避误取商品标题/平台推荐等噪音
 * - ✨ 新增开发加载器脚本：`dev/dev-loader.user.js` 支持本地脚本自动加载与执行，便于快速联调
 * - 🔧 版本号同步机制增强：统一动态读取 `GM_info/GM.info`，双 IIFE 版本展示保持一致
 * - 🐛 日志系统稳定性修复：`Logger.flush` 早退分支重置 timer，避免日志刷新锁死
 * - 🔧 自动化质量加固：补充 Logger API 回归测试，CI/Release 工作流适配 userscript 仓库
 * - 🔧 主面板三入口排版修复：按钮文案强制单行显示，避免“万能查数/辅助显示”在窄宽度下换行
 *
 * v5.27 (2026-02-14)
 * - ✨ 版本号改为动态解析：统一从 GM_info / GM.info 读取，移除硬编码版本 fallback
 * - ✨ 双 IIFE 共用同一版本解析器，主面板、护航面板与启动日志版本保持一致
 * - 📝 文档同步：README 徽章改为 GitHub Release 动态版本显示
 *
 * v5.26 (2026-02-13)
 * - ✨ 新增「计划ID识别」模块：自动扫描并为页面 ID 注入「万能查数」快捷入口
 * - ✨ UI 视觉标准升级：统一 iPhone 级圆角规范（18px/12px/10px），视觉更感性
 * - ✨ 深度精装修：全面引入 Glassmorphism 磨砂玻璃质感，优化表格配色与层级感
 * - ✨ 图标体系标准化：全量使用高质量 SVG 替换 Unicode，视觉比重、大小及颜色表现对齐
 * - ✨ 算法护航体验增强：支持面板居中、最大化展示，优化长日志自动高度计算
 * - 🔧 界面微调：精简算法护航标题栏结构，优化数据表格背景配色与各级图标显示比例
 * - 🔧 细节修复：调优刷新图标展示效果，修复日志输出空格格式，提升极致稳定性
 * - 🔧 性能优化：优化 MutationObserver 监听频率，减少扫描开销
 *
 * v5.25 (2026-02-13)
 * - ✨ 修复样式注入缓存机制，通过动态 ID 强制刷新样式
 * - ✨ 优化触发器 UI 样式，提升原生视觉融合度
 * - 🔧 修复日志系统在特定场景下的引用错误
 * - 🔧 增强数据抓取稳定性，优化 API 注入逻辑
 * - ✨ 关键词推广页面新增「全能数据查」快捷入口
 *
 * v5.24 (2026-02-12)
 * - ✨ 新增多表格上下文识别与能力评分，优先处理当前可见且列结构匹配的数据表
 * - ✨ 兼容 Sticky Table 双表头定位，提升表头映射稳定性
 * - 🔧 花费排序改为作用域定位，减少跨模块误触发排序的问题
 * - 🔧 路由变化重置增加节流保护，避免短时间重复重置
 * - 🔧 首次执行增加去重保护，降低 MutationObserver 高频更新下的重复计算
 *
 * v5.23 (2026-02-08)
 * - 🐛 修复作用域引用错误导致的算法护航模块加载失败问题
 * - ✨ 实现全 UI 版本号自动化同步，所有界面均显示最新版本
 * - 🔧 整理并优化今日所有更新日志，保持界面整洁
 * - 🔧 修复日志日期合并逻辑，准确识别并按天分组
 * - ✨ 点击「算法护航」后主面板自动最小化，提升空间利用率
 * - 🔧 优化面板层级 (z-index)，解决层级遮挡问题
 * - 🔧 移除护航「最小化」图标，集成护航模块并支持一键调出
 * - ✨ 新增预算分类占比显示 (基础 + 多目标预算)
 *
 * v5.15 (2026-02-05)
 * - ✨ 新增 Tab 切换监听（关键词、人群、创意等）
 * - ✨ 切换 Tab 时自动重新按花费降序排序
 *
 * v5.12 (2026-01-31)
 * - ✨ 新增「花费排序」开关，自动按花费降序排列表格
 * - ✨ 切换页面/点击计划时自动重新排序
 * - ✨ 监听 URL 变化 (hashchange/popstate)
 * - 🐛 修复总花费日志重复输出问题
 *
 * v4.11 (2026-01-31)
 * - ✨ UI 样式重新设计，灰色系主题
 * - ✨ 悬浮球恢复 40px SVG 图标
 * - ✨ 面板位置对齐悬浮球
 * - ✨ 点击面板外部自动最小化
 * - ✨ 左侧可拖拽调整宽度
 * - ✨ 缩放动画效果
 */

const resolveScriptVersion = () => {
    const fromGMInfo = typeof GM_info !== 'undefined'
        && GM_info
        && GM_info.script
        && GM_info.script.version;
    if (typeof fromGMInfo === 'string' && fromGMInfo.trim()) {
        return fromGMInfo.trim();
    }

    const fromGM = typeof GM !== 'undefined'
        && GM
        && GM.info
        && GM.info.script
        && GM.info.script.version;
    if (typeof fromGM === 'string' && fromGM.trim()) {
        return fromGM.trim();
    }

    return 'dev';
};

if (typeof globalThis !== 'undefined' && typeof globalThis.__AM_GET_SCRIPT_VERSION__ !== 'function') {
    globalThis.__AM_GET_SCRIPT_VERSION__ = resolveScriptVersion;
}

const escapeAmIconHtml = (value) => {
    const str = value === null || value === undefined ? '' : String(value);
    return str.replace(/[&<>"']/g, ch => {
        const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
        return map[ch] || ch;
    });
};

const AM_ICON_DEFS = {
    logo: {
        body: '<path d="M13 3L5 13h6l-1 8 9-12h-6l1-6z"></path>'
    },
    close: {
        body: '<path d="M6 6l12 12M18 6L6 18"></path>'
    },
    multiply: {
        body: '<path d="M8 8l8 8M16 8l-8 8"></path>'
    },
    plus: {
        body: '<path d="M12 5v14M5 12h14"></path>'
    },
    'shield-check': {
        body: '<path d="M12 3l7 3v5c0 4.5-2.8 8-7 10-4.2-2-7-5.5-7-10V6l7-3z"></path><path d="M9 12l2 2 4-5"></path>'
    },
    plan: {
        body: '<rect x="5" y="4" width="14" height="16" rx="2"></rect><path d="M9 8h6M9 12h4M9 16h3M15 14v4M13 16h4"></path>'
    },
    chart: {
        body: '<path d="M4 19h16"></path><rect x="6" y="11" width="3" height="6" rx="1"></rect><rect x="11" y="7" width="3" height="10" rx="1"></rect><rect x="16" y="4" width="3" height="13" rx="1"></rect>'
    },
    eye: {
        body: '<path d="M3 12s3.3-6 9-6 9 6 9 6-3.3 6-9 6-9-6-9-6z"></path><circle cx="12" cy="12" r="2.5"></circle>'
    },
    list: {
        body: '<path d="M9 6h11M9 12h11M9 18h11"></path><path d="M4 6h1M4 12h1M4 18h1"></path>'
    },
    search: {
        body: '<circle cx="11" cy="11" r="6"></circle><path d="M16 16l4 4"></path>'
    },
    edit: {
        body: '<path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3z"></path><path d="M14 8l2 2"></path>'
    },
    'campaign-query': {
        body: '<circle cx="10" cy="10" r="5"></circle><path d="M14 14l5 5"></path>'
    },
    'campaign-concurrent-start': {
        body: '<path d="M8 6l10 6-10 6V6z"></path>'
    },
    'campaign-copy': {
        body: '<rect x="8" y="8" width="10" height="10" rx="2"></rect><path d="M6 16H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1"></path>'
    },
    'layers-play': {
        body: '<rect x="5" y="7" width="12" height="12" rx="2"></rect><path d="M8 5h9a2 2 0 0 1 2 2v9"></path><path d="M10 11l5 3-5 3z"></path>'
    },
    refresh: {
        body: '<path d="M20 6v5h-5"></path><path d="M4 18v-5h5"></path><path d="M18 9a7 7 0 0 0-11.5-2.5L4 9"></path><path d="M6 15a7 7 0 0 0 11.5 2.5L20 15"></path>'
    },
    center: {
        body: '<rect x="8" y="8" width="8" height="8" rx="2"></rect><path d="M12 4v4M12 16v4M4 12h4M16 12h4"></path>'
    },
    expand: {
        body: '<path d="M8 4H4v4M16 4h4v4M20 16v4h-4M4 16v4h4"></path><path d="M9 9L4 4M15 9l5-5M15 15l5 5M9 15l-5 5"></path>'
    },
    tag: {
        body: '<path d="M4 5v6.5L12.5 20 20 12.5 11.5 4H5a1 1 0 0 0-1 1z"></path><circle cx="8.5" cy="8.5" r="1"></circle>'
    },
    cursor: {
        body: '<path d="M6 3l11 11-5 1.5L9.5 21 6 3z"></path><path d="M15 4l2-2M18 8h3M13 2V0"></path>'
    },
    cart: {
        body: '<path d="M3 4h2l2.2 10H18l2-7H7"></path><circle cx="9" cy="19" r="1.5"></circle><circle cx="17" cy="19" r="1.5"></circle>'
    },
    coin: {
        body: '<circle cx="12" cy="12" r="7"></circle><path d="M12 8v8M9.5 10h4a1.5 1.5 0 0 1 0 3h-3a1.5 1.5 0 0 0 0 3h4"></path>'
    },
    pin: {
        body: '<path d="M12 21s6-5.2 6-11a6 6 0 0 0-12 0c0 5.8 6 11 6 11z"></path><circle cx="12" cy="10" r="2"></circle>'
    },
    city: {
        body: '<path d="M4 20V9l5-3v14M9 20V4l6 3v13M15 20v-8l5 2v6"></path><path d="M6 12h1M6 16h1M11 9h1M11 13h1M17 16h1"></path>'
    },
    package: {
        body: '<path d="M4 8l8-4 8 4-8 4-8-4z"></path><path d="M4 8v8l8 4 8-4V8"></path><path d="M12 12v8"></path>'
    },
    star: {
        body: '<path d="M12 4l2.5 5 5.5.8-4 3.9.9 5.5-4.9-2.6-4.9 2.6.9-5.5-4-3.9 5.5-.8L12 4z"></path>'
    },
    'star-filled': {
        fill: 'currentColor',
        stroke: 'none',
        strokeWidth: 0,
        body: '<path d="M12 3.8l2.7 5.5 6 .9-4.4 4.2 1.1 6-5.4-2.8-5.4 2.8 1.1-6-4.4-4.2 6-.9L12 3.8z"></path>'
    },
    'check-circle': {
        body: '<circle cx="12" cy="12" r="8"></circle><path d="M8.5 12.5l2.3 2.3 4.7-5.1"></path>'
    },
    check: {
        body: '<path d="M5 12.5l4.2 4.2L19 7"></path>'
    },
    minus: {
        body: '<path d="M5 12h14"></path>'
    },
    'x-circle': {
        body: '<circle cx="12" cy="12" r="8"></circle><path d="M9 9l6 6M15 9l-6 6"></path>'
    },
    'alert-triangle': {
        body: '<path d="M12 4l9 16H3L12 4z"></path><path d="M12 9v5M12 17h.01"></path>'
    },
    help: {
        body: '<circle cx="12" cy="12" r="8"></circle><path d="M9.8 9.5a2.3 2.3 0 1 1 3.4 2c-.8.5-1.2 1-1.2 2V14"></path><path d="M12 17h.01"></path>'
    },
    user: {
        body: '<circle cx="12" cy="8" r="3"></circle><path d="M5 20c1.4-4 4-6 7-6s5.6 2 7 6"></path>'
    },
    sparkles: {
        body: '<path d="M13 3l1.5 4.5L19 9l-4.5 1.5L13 15l-1.5-4.5L7 9l4.5-1.5L13 3z"></path><path d="M6 14l.9 2.1L9 17l-2.1.9L6 20l-.9-2.1L3 17l2.1-.9L6 14z"></path>'
    },
    'external-link': {
        body: '<path d="M14 5h5v5"></path><path d="M10 14L19 5"></path><path d="M19 14v4a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h4"></path>'
    },
    'chevron-down': {
        body: '<path d="M7 10l5 5 5-5"></path>'
    },
    'chevron-up': {
        body: '<path d="M7 14l5-5 5 5"></path>'
    }
};

const renderAmIcon = (name, options = {}) => {
    const icon = AM_ICON_DEFS[name] || AM_ICON_DEFS.logo;
    const size = Number.isFinite(Number(options.size)) ? Number(options.size) : 16;
    const strokeWidth = options.strokeWidth ?? icon.strokeWidth ?? 2;
    const className = [
        'am-ui-icon',
        `am-ui-icon-${String(name || 'logo').replace(/[^a-z0-9_-]+/gi, '-')}`,
        options.className || ''
    ].filter(Boolean).join(' ');
    const ariaAttrs = options.label
        ? `role="img" aria-label="${escapeAmIconHtml(options.label)}"`
        : 'aria-hidden="true" focusable="false"';
    const title = options.title ? `<title>${escapeAmIconHtml(options.title)}</title>` : '';
    const style = options.style ? ` style="${escapeAmIconHtml(options.style)}"` : '';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${icon.viewBox || '0 0 24 24'}" width="${size}" height="${size}" class="${escapeAmIconHtml(className)}" fill="${icon.fill || 'none'}" stroke="${icon.stroke || 'currentColor'}" stroke-width="${escapeAmIconHtml(strokeWidth)}" stroke-linecap="round" stroke-linejoin="round" ${ariaAttrs}${style}>${title}${icon.body}</svg>`;
};

const renderAmWindowIcon = (name, options = {}) => {
    const baseStyle = 'display:block;width:16px;height:16px;';
    const className = ['am-window-control-icon', options.className || ''].filter(Boolean).join(' ');
    const style = `${baseStyle}${options.style || ''}`;
    return renderAmIcon(name, {
        ...options,
        size: 16,
        strokeWidth: 2.2,
        className,
        style
    });
};

if (typeof globalThis !== 'undefined') {
    globalThis.__AM_RENDER_ICON__ = renderAmIcon;
    globalThis.__AM_RENDER_WINDOW_ICON__ = renderAmWindowIcon;
    globalThis.__AM_ESCAPE_ICON_HTML__ = escapeAmIconHtml;
}
