import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Script, createContext } from 'node:vm';

const read = (relativePath) => readFileSync(new URL(`../${relativePath}`, import.meta.url), 'utf8');

const quickEntry = read('src/main-assistant/campaign-id-quick-entry.js');
const quickEntryStyle = read('src/main-assistant/ui.js');
const keywordPlanApi = read('src/optimizer/keyword-plan-api/search-and-draft.js');
const sharedPreamble = read('src/shared/script-preamble.js');

function getQuickEntryMethodSlice(methodName, nextMethodName) {
    const start = quickEntry.search(new RegExp(`\\n\\s*${methodName}\\(`));
    assert.ok(start > -1, `无法定位 ${methodName} 代码块`);
    const rest = quickEntry.slice(start);
    if (!nextMethodName) return rest;
    const end = rest.search(new RegExp(`\\n\\s*${nextMethodName}\\(`));
    assert.ok(end > 0, `无法定位 ${methodName} 的结束位置`);
    return rest.slice(0, end);
}

function createBatchPlusMenuCloseHarness(initialVisibilityState = 'visible') {
    let visibilityState = String(initialVisibilityState || 'visible');
    let nextTimerId = 1;
    const timers = new Map();
    const listeners = new Map();

    class FakeHTMLElement {
        constructor(id = '') {
            this.isConnected = true;
            this.removed = false;
            this.children = [];
            this.parentElement = null;
            this.dataset = {};
            this.attributes = new Map();
            this.classListValues = new Set();
            this.classList = {
                add: (...names) => names.forEach((name) => this.classListValues.add(String(name))),
                remove: (...names) => names.forEach((name) => this.classListValues.delete(String(name))),
                contains: (name) => this.classListValues.has(String(name))
            };
            if (id) this.setAttribute('id', id);
        }

        setAttribute(name, value) {
            this.attributes.set(String(name), String(value));
        }

        getAttribute(name) {
            return this.attributes.get(String(name)) || '';
        }

        removeAttribute(name) {
            this.attributes.delete(String(name));
        }

        remove() {
            this.isConnected = false;
            this.removed = true;
        }

        contains(node) {
            if (node === this) return true;
            return this.children.some((child) => child?.contains?.(node));
        }
    }

    const menu = new FakeHTMLElement('am-campaign-batch-plus-menu');
    const trigger = new FakeHTMLElement();
    trigger.classList.add('is-open');
    trigger.setAttribute('data-am-campaign-batch-plus', '1');
    trigger.setAttribute('aria-expanded', 'true');
    trigger.setAttribute('aria-controls', 'am-campaign-batch-plus-menu');

    const addListener = (type, handler) => {
        if (typeof handler !== 'function') return;
        if (!listeners.has(type)) listeners.set(type, new Set());
        listeners.get(type).add(handler);
    };
    const removeListener = (type, handler) => {
        listeners.get(type)?.delete(handler);
    };
    const documentRef = {
        get visibilityState() {
            return visibilityState;
        },
        addEventListener: addListener,
        removeEventListener: removeListener,
        getElementById(id) {
            return id === 'am-campaign-batch-plus-menu' && menu.isConnected ? menu : null;
        },
        querySelectorAll(selector) {
            if (String(selector) !== '[data-am-campaign-batch-plus="1"].is-open') return [];
            return trigger.classList.contains('is-open') ? [trigger] : [];
        }
    };
    const windowRef = {
        setTimeout(handler, delay = 0) {
            const timerId = nextTimerId;
            nextTimerId += 1;
            if (typeof handler === 'function') {
                timers.set(timerId, { handler, delay: Math.max(0, Number(delay) || 0) });
            }
            return timerId;
        },
        clearTimeout(timerId) {
            timers.delete(timerId);
        }
    };
    const context = createContext({
        document: documentRef,
        window: windowRef,
        HTMLElement: FakeHTMLElement,
        Node: FakeHTMLElement
    });
    const methodSource = [
        getQuickEntryMethodSlice('closeBatchPlusMenu', 'getConnectedBatchPlusMenu'),
        getQuickEntryMethodSlice('getConnectedBatchPlusMenu', 'isBatchPlusMenuCloseDocumentHidden'),
        getQuickEntryMethodSlice('isBatchPlusMenuCloseDocumentHidden', 'clearBatchPlusMenuCloseTimer'),
        getQuickEntryMethodSlice('clearBatchPlusMenuCloseTimer', 'clearBatchPlusMenuCloseVisibilityHandler'),
        getQuickEntryMethodSlice('clearBatchPlusMenuCloseVisibilityHandler', 'clearBatchPlusMenuCloseState'),
        getQuickEntryMethodSlice('clearBatchPlusMenuCloseState', 'bindBatchPlusMenuCloseVisibilityHandler'),
        getQuickEntryMethodSlice('bindBatchPlusMenuCloseVisibilityHandler', 'cancelBatchPlusMenuClose'),
        getQuickEntryMethodSlice('cancelBatchPlusMenuClose', 'scheduleBatchPlusMenuClose'),
        getQuickEntryMethodSlice('scheduleBatchPlusMenuClose', 'clearCampaignListRefreshTimer')
    ].join('\n');
    const runtime = new Script(`({
        batchPlusMenuEl: menu,
        batchPlusMenuCloseTimer: null,
        batchPlusMenuCloseVisibilityHandler: null,
        ${methodSource}
    })`).runInContext(createContext({
        ...context,
        menu
    }));

    return {
        runtime,
        menu,
        trigger,
        timers,
        getTimerDelays() {
            return Array.from(timers.values()).map((timer) => timer.delay);
        },
        listenerCount(type = 'visibilitychange') {
            return listeners.get(type)?.size || 0;
        },
        setVisibilityState(nextState) {
            visibilityState = String(nextState || 'visible');
            Array.from(listeners.get('visibilitychange') || []).forEach((handler) => handler({ type: 'visibilitychange' }));
        },
        tickTimers() {
            Array.from(timers.entries()).forEach(([timerId, timer]) => {
                if (!timers.has(timerId)) return;
                timers.delete(timerId);
                timer.handler();
            });
        }
    };
}

test('批量+ 克隆批量计划设置结构并挂载到右侧', () => {
    assert.doesNotMatch(quickEntry, /BATCH_PLUS_ICON_SVG|BATCH_PLUS_CHEVRON_SVG|am-campaign-batch-plus-btn/, '批量+不得再使用自定义图标按钮');
    assert.match(quickEntry, /isBatchPlanSettingHost\(el\)[\s\S]*?text\.includes\('批量计划设置'\)/, '批量+应以原生“批量计划设置”为锚点');
    assert.match(quickEntry, /ensureBatchPlanHostAnchor\(host\)[\s\S]*?data-am-batch-plan-anchor/, '批量+应给原生锚点建立稳定关联');
    assert.match(quickEntry, /stripBatchPlusNativeAttrs\(root\)[\s\S]*?name\.startsWith\('mx-'\)/, '克隆原生按钮后应移除 Magix 事件属性');
    assert.match(quickEntry, /stripBatchPlusNativeAttrs\(root\)[\s\S]*?data-spm-click/, '克隆原生按钮后应移除埋点事件属性');
    assert.match(quickEntry, /pruneBatchPlusNativeButtonOnly\(root\)[\s\S]*?child !== keep[\s\S]*?child\.remove\(\)/, '克隆原生按钮后应剔除“优化效果”等非按钮附属节点');
    assert.match(quickEntry, /createBatchPlusButton\(bizCode = '',\s*nativeHost = null\)[\s\S]*?source\.cloneNode\(true\)[\s\S]*?syncBatchPlusNativeState/, '批量+应克隆原生批量计划设置结构');
    assert.match(quickEntry, /setBatchPlusNativeContent\(root\)[\s\S]*?批量\+/, '克隆后应只替换按钮文案为批量+');
    assert.match(quickEntry, /syncBatchPlusNativeState\(batchPlusHost,\s*nativeHost = null,\s*bizCode = ''\)[\s\S]*?setAttribute\('data-am-campaign-batch-plus',\s*'1'\)/, '缺少批量+原生同构状态同步');
    assert.match(quickEntry, /isBatchPlanSettingDisabled\(host\)[\s\S]*?getAttribute\('mx-view'\)[\s\S]*?disabled=.*true.*1[\s\S]*?button instanceof HTMLButtonElement[\s\S]*?button\.disabled/, '批量+应识别原生批量计划设置禁用态用于调试标记');
    assert.match(quickEntry, /setAttribute\('data-am-native-disabled',\s*nativeDisabled \? '1' : '0'\)/, '批量+应记录原生禁用态但不阻止展开菜单');
    assert.match(quickEntry, /batchPlusHost\.setAttribute\('aria-disabled',\s*'false'\)[\s\S]*?batchPlusHost\.classList\.remove\('is-disabled'\)/, '批量+自身不能继承原生 disabled 交互态');
    assert.match(quickEntry, /button\.disabled = false[\s\S]*?button\.removeAttribute\('disabled'\)/, '批量+内部 button 不能被原生 disabled 拦截 hover');
    assert.doesNotMatch(quickEntry, /isBatchPlusTriggerDisabled|button\.disabled = nativeButtonDisabled/, '批量+不得因原生禁用态拦截菜单展开');
    assert.match(quickEntry, /copyBatchPlusNativeButtonStyle\(batchPlusHost,\s*nativeHost = null\)[\s\S]*?window\.getComputedStyle\(sourceButton\)[\s\S]*?targetButton\.style\[key\] = sourceStyle\[key\][\s\S]*?batchPlusHost\.style\.width = 'max-content'[\s\S]*?targetButton\.style\.width = 'auto'/, '去掉 Magix 属性后应同步原生 computed style，但宽度要按“批量+”文案自适应');
    assert.doesNotMatch(quickEntry, /batchPlusHost\.style\.width = width[\s\S]*?targetButton\.style\.width = width/, '批量+不得硬拷贝“批量计划设置”的固定宽度');
    assert.match(quickEntry, /syncBatchPlusWrapLayout\(wrap,\s*nativeHost = null\)[\s\S]*?sourceStyle\?\.float === 'left'[\s\S]*?wrap\.classList\.toggle\('fl',\s*shouldFloatLeft\)/, '批量+外层应跟随原生按钮的 float 排布，避免不同页面间距漂移');
    assert.match(quickEntry, /wrap\.className = 'am-campaign-batch-plus-wrap'[\s\S]*?syncBatchPlusWrapLayout\(wrap,\s*host\)/, '批量+新建外层时应按原生锚点同步布局');
    assert.match(quickEntry, /insertAdjacentElement\('afterend',\s*wrap\)/, '批量+应插入到批量计划设置右侧');
    assert.match(quickEntry, /enhanceBatchPlusNodes\(\);/, 'run 流程应增强批量+节点');
    assert.match(quickEntry, /#am-campaign-batch-plus-menu/, '批量+菜单应加入忽略区域，避免污染计划扫描');
    assert.match(quickEntryStyle, /\.am-campaign-batch-plus-wrap\s*\{[\s\S]*?display:\s*inline-block;[\s\S]*?float:\s*none;[\s\S]*?margin-left:\s*0;/, '批量+默认应复用 inline-block 按钮组间距，不额外叠加间距');
    assert.match(quickEntryStyle, /\.am-campaign-batch-plus-wrap\.fl\s*\{[\s\S]*?display:\s*block;[\s\S]*?float:\s*left;/, '批量+在原生左浮动按钮组内应切换为左浮动');
    assert.match(quickEntryStyle, /\.am-campaign-batch-plus-native\s*\{[\s\S]*?display:\s*inline-block;/, '批量+应保留原生按钮结构并仅加必要外层标识');
});

test('批量+ 菜单只保留插件增强能力且不重复原生已有入口', () => {
    assert.match(quickEntry, /getBatchPlusMenuItems\(bizCode = ''\)[\s\S]*?label:\s*'批量开启'/, '菜单缺少批量开启');
    assert.match(quickEntry, /getBatchPlusMenuItems\(bizCode = ''\)[\s\S]*?label:\s*'批量暂停'/, '菜单缺少批量暂停');
    assert.match(quickEntry, /getBatchPlusMenuItems\(bizCode = ''\)[\s\S]*?label:\s*'批量删除'/, '菜单缺少批量删除');
    assert.match(quickEntry, /getBatchPlusMenuItems\(bizCode = ''\)[\s\S]*?label:\s*'批量修改计划名称'/, '菜单缺少批量修改计划名称');
    assert.match(quickEntry, /getBatchPlusMenuItems\(bizCode = ''\)[\s\S]*?action:\s*'aiMax'[\s\S]*?label:\s*'批量编辑AI点睛'/, '菜单缺少批量编辑AI点睛');
    assert.match(quickEntry, /getBatchPlusMenuItems\(bizCode = ''\)[\s\S]*?label:\s*'批量修改屏蔽人群'/, '菜单缺少批量修改屏蔽人群');
    assert.match(quickEntry, /getBatchPlusMenuItems\(bizCode = ''\)[\s\S]*?label:\s*'批量人群设置'/, '菜单缺少批量人群设置');
    assert.doesNotMatch(quickEntry, /nativeBatchPlanItems|getNativeBatchPlanSettingActionMetas|getNativeBatchPlanSettingActionMeta|runNativeBatchPlanSettingAction/, '批量+ 不应再接入原生已有的批量计划设置入口');
    assert.doesNotMatch(quickEntry, /label:\s*'批量修改每日预算'|label:\s*'批量修改投放资源位'|label:\s*'批量修改投放地域'|label:\s*'批量修改分时折扣'|label:\s*'批量修改出价'|label:\s*'批量调整计划组'/, '批量+ 菜单不应重复原生已有的批量修改入口');
    assert.match(quickEntry, /showBatchPlusMenu\(triggerEl\)[\s\S]*?className = 'mxgc-popmenu am-campaign-batch-plus-native-menu'[\s\S]*?setAttribute\('role',\s*'menu'\)[\s\S]*?data-am-campaign-batch-plus-action/, '批量+应渲染原生 popmenu 类菜单项');
    assert.match(quickEntry, /showBatchPlusMenu\(triggerEl\)[\s\S]*?menu\.style\.minWidth = `\$\{Math\.max\(120,\s*Math\.round\(rect\.width\)\)\}px`/, '批量+弹层宽度应跟随原生按钮宽度');
    assert.match(quickEntry, /getConnectedBatchPlusMenu\(\)[\s\S]*?storedMenu instanceof HTMLElement && storedMenu\.isConnected[\s\S]*?this\.batchPlusMenuEl = null/, '批量+应清理已脱离 DOM 的旧菜单状态，避免 hover 被误判为已打开');
    assert.match(quickEntry, /document\.addEventListener\('mouseover'[\s\S]*?showBatchPlusMenu\(trigger\)/, '批量+应和原生 popmenu 一样鼠标移入即弹出菜单');
    assert.match(quickEntry, /document\.addEventListener\('mouseover'[\s\S]*?const trigger = target\.closest\('\[data-am-campaign-batch-plus="1"\]'\)/, '批量+ hover 必须兼容鼠标落在内部 button/span 上的真实目标');
    assert.match(quickEntry, /document\.addEventListener\('mouseout'[\s\S]*?scheduleBatchPlusMenuClose\(\)/, '批量+鼠标移出按钮和菜单后应延迟关闭');
    assert.match(quickEntry, /isInsideOpenBatchPlusSurface\(node\)[\s\S]*?menu\.contains\(node\)[\s\S]*?trigger\.contains\(node\)/, '批量+菜单内移动不得误关闭弹层');
    assert.match(quickEntry, /const batchPlusItem = target\.closest\('\[data-am-campaign-batch-plus-action\]'\)/, '缺少批量+菜单项点击入口');
    assert.match(quickEntry, /const focusBackTarget = this\.getOpenBatchPlusTrigger\(\)[\s\S]*?this\.closeBatchPlusMenu\(\)[\s\S]*?this\.runBatchPlusAction\(action,\s*bizCode,\s*focusBackTarget \|\| batchPlusItem\)/, '点击菜单项后应在菜单移除前记录批量+触发器用于确认窗关闭回焦');
    assert.match(quickEntry, /const batchPlusBtn = target\.closest\('\[data-am-campaign-batch-plus="1"\]'\)/, '缺少批量+按钮点击入口');
    assert.match(quickEntryStyle, /#am-campaign-batch-plus-menu\s*\{[\s\S]*?min-width:\s*120px;[\s\S]*?box-shadow:/, '批量+菜单应按原生 popmenu 尺寸渲染');
    assert.match(quickEntryStyle, /#am-campaign-batch-plus-menu \.am-campaign-batch-plus-item\.is-danger/, '批量删除菜单项应有危险态样式');
});

test('批量+ 菜单 hover 关闭 timer 在隐藏页即时收尾且不触发业务动作', () => {
    assert.match(quickEntry, /batchPlusMenuCloseVisibilityHandler:\s*null,/, '批量+菜单关闭缺少 visibility handler 状态');
    assert.match(
        quickEntry,
        /closeBatchPlusMenu\(\)\s*\{[\s\S]*?this\.clearBatchPlusMenuCloseState\(\);[\s\S]*?menu\.remove\(\)[\s\S]*?btn\.removeAttribute\('aria-controls'\)/,
        '批量+菜单显式关闭应统一释放 timer/listener 并清理 aria 状态'
    );
    assert.match(
        quickEntry,
        /isBatchPlusMenuCloseDocumentHidden\(\)\s*\{[\s\S]*?return document\.visibilityState === 'hidden';[\s\S]*?\}/,
        '批量+菜单关闭缺少隐藏页判定 helper'
    );
    assert.match(
        quickEntry,
        /clearBatchPlusMenuCloseTimer\(\)\s*\{[\s\S]*?window\.clearTimeout\(this\.batchPlusMenuCloseTimer\);[\s\S]*?this\.batchPlusMenuCloseTimer = null;[\s\S]*?\}/,
        '批量+菜单关闭 timer 应支持显式清理'
    );
    assert.match(
        quickEntry,
        /clearBatchPlusMenuCloseVisibilityHandler\(\)\s*\{[\s\S]*?document\.removeEventListener\('visibilitychange',\s*this\.batchPlusMenuCloseVisibilityHandler\);[\s\S]*?this\.batchPlusMenuCloseVisibilityHandler = null;[\s\S]*?\}/,
        '批量+菜单关闭应支持释放 visibilitychange handler'
    );
    assert.match(
        quickEntry,
        /bindBatchPlusMenuCloseVisibilityHandler\(\)\s*\{[\s\S]*?if \(typeof this\.batchPlusMenuCloseVisibilityHandler === 'function'\) return;[\s\S]*?if \(!this\.isBatchPlusMenuCloseDocumentHidden\(\)\) return;[\s\S]*?this\.closeBatchPlusMenu\(\);[\s\S]*?document\.addEventListener\('visibilitychange',\s*this\.batchPlusMenuCloseVisibilityHandler\);[\s\S]*?\}/,
        '批量+菜单关闭应在转 hidden 时立即关闭菜单'
    );
    const scheduleBlock = getQuickEntryMethodSlice('scheduleBatchPlusMenuClose', 'clearCampaignListRefreshTimer');
    assert.match(
        scheduleBlock,
        /this\.clearBatchPlusMenuCloseState\(\);[\s\S]*?if \(this\.isBatchPlusMenuCloseDocumentHidden\(\)\) \{[\s\S]*?this\.closeBatchPlusMenu\(\);[\s\S]*?return;[\s\S]*?\}[\s\S]*?this\.bindBatchPlusMenuCloseVisibilityHandler\(\);[\s\S]*?this\.batchPlusMenuCloseTimer = window\.setTimeout\(\(\) => \{[\s\S]*?this\.batchPlusMenuCloseTimer = null;[\s\S]*?this\.clearBatchPlusMenuCloseVisibilityHandler\(\);[\s\S]*?this\.closeBatchPlusMenu\(\);[\s\S]*?\}, delay\);/,
        '批量+菜单关闭调度应保留可见页 delay，并在隐藏页即时关闭'
    );
    assert.doesNotMatch(
        scheduleBlock,
        /runBatchPlusAction|refreshCampaignListOnly|runBatchUpdateCampaignStatus|runBatchDeleteCampaigns|runDisplayBatchCrowdAction|runLeadBatchShieldCrowd|runCopyCurrentPlanFlow|runConcurrentStartFlow|openV3|solution\/addList|solution\/copy|campaign\/create|campaign\/delete|budget\/batchUpdate|updatePart/,
        '批量+菜单 hover 关闭 timer 不得触发批量业务、刷新、复制创建提交或预算/护航链路'
    );

    const hiddenHarness = createBatchPlusMenuCloseHarness('hidden');
    hiddenHarness.runtime.scheduleBatchPlusMenuClose();
    assert.equal(hiddenHarness.timers.size, 0, '隐藏页调度不应排 160ms timeout');
    assert.equal(hiddenHarness.listenerCount(), 0, '隐藏页即时关闭后不应残留 visibilitychange');
    assert.equal(hiddenHarness.menu.isConnected, false, '隐藏页调度应立即移除菜单');
    assert.equal(hiddenHarness.trigger.classList.contains('is-open'), false, '隐藏页调度应清理触发器 open 状态');
    assert.equal(hiddenHarness.trigger.getAttribute('aria-expanded'), 'false', '隐藏页调度应收回 aria-expanded');
    assert.equal(hiddenHarness.trigger.getAttribute('aria-controls'), '', '隐藏页调度应清理 aria-controls');

    const visibleHarness = createBatchPlusMenuCloseHarness('visible');
    visibleHarness.runtime.scheduleBatchPlusMenuClose();
    assert.deepEqual(visibleHarness.getTimerDelays(), [160], '可见页应保留原 160ms hover 关闭延迟');
    assert.equal(visibleHarness.listenerCount(), 1, '可见页等待关闭时应监听转 hidden');
    assert.equal(visibleHarness.menu.isConnected, true, '可见页 timer 触发前菜单应仍存在');
    visibleHarness.tickTimers();
    assert.equal(visibleHarness.menu.isConnected, false, '可见页 timer 触发后应关闭菜单');
    assert.equal(visibleHarness.listenerCount(), 0, '可见页 timer 完成后应释放 visibilitychange');

    const switchHarness = createBatchPlusMenuCloseHarness('visible');
    switchHarness.runtime.scheduleBatchPlusMenuClose();
    switchHarness.setVisibilityState('hidden');
    assert.equal(switchHarness.timers.size, 0, '转 hidden 应取消已排关闭 timer');
    assert.equal(switchHarness.listenerCount(), 0, '转 hidden 收尾后应释放 visibilitychange');
    assert.equal(switchHarness.menu.isConnected, false, '转 hidden 应立即关闭菜单');

    const cancelHarness = createBatchPlusMenuCloseHarness('visible');
    cancelHarness.runtime.scheduleBatchPlusMenuClose();
    cancelHarness.runtime.cancelBatchPlusMenuClose();
    assert.equal(cancelHarness.timers.size, 0, '取消 hover 关闭应清理 timer');
    assert.equal(cancelHarness.listenerCount(), 0, '取消 hover 关闭应清理 visibilitychange');
    assert.equal(cancelHarness.menu.isConnected, true, '取消 hover 关闭不应移除菜单');

    const closeHarness = createBatchPlusMenuCloseHarness('visible');
    closeHarness.runtime.scheduleBatchPlusMenuClose();
    closeHarness.runtime.closeBatchPlusMenu();
    assert.equal(closeHarness.timers.size, 0, '显式关闭菜单应清理 timer');
    assert.equal(closeHarness.listenerCount(), 0, '显式关闭菜单应清理 visibilitychange');
    assert.equal(closeHarness.menu.isConnected, false, '显式关闭菜单应移除菜单');
});

test('批量+ 自有菜单和确认弹窗符合统一 UI 规范', () => {
    const menuBlock = quickEntry.slice(
        quickEntry.indexOf('showBatchPlusMenu(triggerEl)'),
        quickEntry.indexOf('findSelectedCampaignContextFromCheckbox')
    );
    const confirmDialogBlock = quickEntry.slice(
        quickEntry.indexOf('openBatchPlusConfirmDialog({'),
        quickEntry.indexOf('async runBatchUpdateCampaignStatus')
    );
    assert.match(quickEntry, /getBatchPlusMenuItems\(bizCode = ''\)[\s\S]*?action:\s*'start'[\s\S]*?icon:\s*'layers-play'/, '批量开启菜单项应使用共享图标');
    assert.match(quickEntry, /getBatchPlusMenuItems\(bizCode = ''\)[\s\S]*?action:\s*'delete'[\s\S]*?icon:\s*'x-circle'/, '批量删除菜单项应使用危险动作共享图标');
    assert.match(quickEntry, /getBatchPlusMenuItems\(bizCode = ''\)[\s\S]*?action:\s*'rename'[\s\S]*?icon:\s*'edit'[\s\S]*?label:\s*'批量修改计划名称'/, '批量修改计划名称菜单项应使用共享编辑图标');
    assert.match(quickEntry, /getBatchPlusMenuItems\(bizCode = ''\)[\s\S]*?action:\s*'aiMax'[\s\S]*?icon:\s*'sparkles'[\s\S]*?label:\s*'批量编辑AI点睛'/, '批量编辑AI点睛菜单项应使用共享 sparkles 图标');
    assert.doesNotMatch(quickEntry, /action:\s*'nativeDailyBudget'|action:\s*'nativeLaunchArea'|action:\s*'nativeCampaignGroup'/, '批量+ 不应重复原生预算、地域、计划组等入口');
    assert.match(quickEntry, /showBatchPlusMenu\(triggerEl\)[\s\S]*?am-campaign-batch-plus-item-icon[\s\S]*?renderAmIcon\(item\.icon \|\| 'logo'/, '批量+菜单项应渲染共享 SVG 图标');
    assert.match(menuBlock, /triggerEl\.setAttribute\('aria-controls',\s*'am-campaign-batch-plus-menu'\)/, '批量+菜单打开时触发器应指向菜单 id');
    assert.match(menuBlock, /menu\.setAttribute\('aria-label',\s*'批量\+菜单'\)/, '批量+菜单应提供可访问名称');
    assert.match(menuBlock, /menu\.addEventListener\('keydown'[\s\S]*?event\.key === 'Escape'[\s\S]*?this\.closeBatchPlusMenu\(\)[\s\S]*?triggerEl\.focus\(\{ preventScroll: true \}\)/, '批量+菜单应支持 Escape 关闭并回焦触发器');
    assert.match(menuBlock, /event\.key !== 'ArrowDown' && event\.key !== 'ArrowUp'[\s\S]*?const direction = event\.key === 'ArrowDown' \? 1 : -1[\s\S]*?items\[nextIndex\]\.focus\(\{ preventScroll: true \}\)/, '批量+菜单应支持上下方向键移动菜单项焦点');
    assert.match(quickEntry, /closeBatchPlusMenu\(\)[\s\S]*?btn\.removeAttribute\('aria-controls'\)/, '批量+菜单关闭时应清理触发器 aria-controls');
    assert.match(quickEntry, /syncBatchPlusNativeState\(batchPlusHost,\s*nativeHost = null,\s*bizCode = ''\)[\s\S]*?if \(open\) \{[\s\S]*?setAttribute\('aria-controls',\s*'am-campaign-batch-plus-menu'\)[\s\S]*?\} else \{[\s\S]*?removeAttribute\('aria-controls'\)/, '批量+原生克隆状态同步应维护 aria-controls');
    assert.match(quickEntry, /renderBatchPlusChevronIcon\(\)[\s\S]*?data-am-batch-plus-fallback-chevron="1"[\s\S]*?renderAmIcon\('chevron-down'/, '批量+ fallback 箭头应使用共享 chevron 图标');
    assert.doesNotMatch(quickEntry, /\uE646/, '批量+源码不得再自造私有字体箭头字符');
    assert.match(confirmDialogBlock, /popup\.setAttribute\('aria-labelledby',\s*titleId\)/, '批量确认弹窗应通过标题建立可访问名称');
    assert.match(confirmDialogBlock, /const bodyId = `am-campaign-batch-confirm-body-/, '批量确认弹窗应生成稳定正文 id');
    assert.match(confirmDialogBlock, /popup\.setAttribute\('aria-describedby',\s*bodyId\)/, '批量确认弹窗应通过正文建立可访问描述');
    assert.match(confirmDialogBlock, /body\.id = bodyId/, '批量确认正文节点应挂载 aria-describedby 对应 id');
    assert.match(confirmDialogBlock, /icon\.innerHTML = renderAmIcon\(danger \? 'x-circle' : 'alert-triangle'/, '批量确认弹窗应使用共享 SVG 告警/危险图标');
    assert.doesNotMatch(confirmDialogBlock, /icon\.textContent = '!'/, '批量确认弹窗不得使用文本感叹号作为功能图标');
    assert.match(confirmDialogBlock, /focusBackTarget = null/, '批量确认弹窗应支持外部传入回焦目标');
    assert.match(confirmDialogBlock, /const focusableSelector = 'button, \[href\], input, select, textarea, \[tabindex\]:not\(\[tabindex="-1"\]\)'/, '批量确认弹窗应复用可聚焦选择器');
    assert.match(confirmDialogBlock, /const resolveFocusTarget = \(candidate\) => \{[\s\S]*?candidate\.querySelector\(focusableSelector\)[\s\S]*?isFocusableElement\(nested\) \? nested : null/, '批量确认弹窗应能把外层触发器解析到内部可聚焦按钮');
    assert.match(confirmDialogBlock, /const focusTarget = resolveFocusTarget\(focusBackTarget\) \|\| resolveFocusTarget\(previousActiveElement\)[\s\S]*?focusTarget\.focus\(\{ preventScroll: true \}\)/, '批量确认弹窗关闭后应优先恢复到批量+触发器内部按钮，兜底恢复原焦点');
    assert.match(confirmDialogBlock, /const getFocusableElements = \(\) => Array\.from\(popup\.querySelectorAll\(focusableSelector\)\)[\s\S]*?\.filter\(isFocusableElement\)/, '批量确认弹窗应收集弹窗内可聚焦元素');
    assert.match(confirmDialogBlock, /event\.key !== 'Tab'[\s\S]*?const focusable = getFocusableElements\(\)/, '批量确认弹窗应处理 Tab 焦点循环');
    assert.match(confirmDialogBlock, /event\.preventDefault\(\);[\s\S]*?const activeIndex = focusable\.indexOf\(document\.activeElement\)/, '批量确认弹窗应完全接管 Tab 默认焦点移动');
    assert.match(confirmDialogBlock, /const direction = event\.shiftKey \? -1 : 1[\s\S]*?const nextIndex = activeIndex >= 0[\s\S]*?\(activeIndex \+ direction \+ focusable\.length\) % focusable\.length/, '批量确认弹窗 Tab/Shift+Tab 应按方向循环计算下一焦点');
    assert.match(confirmDialogBlock, /focusable\[nextIndex\]\.focus\(\{ preventScroll: true \}\)/, '批量确认弹窗应把焦点移动到循环后的下一项');
    assert.match(confirmDialogBlock, /requestAnimationFrame\(\(\) => cancelBtn\.focus\(\)\)/, '批量确认弹窗默认焦点应落在取消按钮，降低误触真实写操作风险');
    assert.match(quickEntryStyle, /--am26-focus:\s*rgba\(69,\s*84,\s*229,\s*0\.32\);[\s\S]*?--am26-danger-soft:\s*rgba\(234,\s*79,\s*79,\s*0\.12\);[\s\S]*?--am26-warning-soft:\s*rgba\(232,\s*163,\s*37,\s*0\.14\);/, 'Page 11 交互态应有统一 focus/危险/警告 soft token');
    assert.match(quickEntryStyle, /#am-campaign-batch-plus-menu\s*\{[\s\S]*?border:\s*1px solid var\(--am26-border[\s\S]*?background:\s*var\(--am26-panel-strong[\s\S]*?box-shadow:\s*var\(--am26-shadow/, '批量+菜单应使用统一 token');
    assert.match(quickEntryStyle, /#am-campaign-batch-plus-menu \.am-campaign-batch-plus-item:hover,[\s\S]*?background:\s*var\(--am26-surface-strong[\s\S]*?outline:\s*2px solid var\(--am26-focus/, '批量+菜单 hover/focus 应使用统一 token');
    assert.match(quickEntryStyle, /#am-campaign-batch-plus-menu \.am-campaign-batch-plus-item\.is-danger:hover,[\s\S]*?background:\s*var\(--am26-danger-soft/, '批量删除菜单项 hover/focus 应使用危险 soft token');
    assert.match(quickEntryStyle, /#am-campaign-batch-plus-menu \.am-campaign-batch-plus-item:focus-visible[\s\S]*?outline:\s*2px solid/, '批量+菜单项应有可见 focus 态');
    assert.match(quickEntryStyle, /#am-campaign-batch-confirm-popup\s*\{[\s\S]*?background:\s*linear-gradient\(135deg,\s*rgba\(255,\s*255,\s*255,\s*0\.78\),\s*rgba\(255,\s*255,\s*255,\s*0\.48\)\);[\s\S]*?backdrop-filter:\s*blur\(8px\) saturate\(1\.15\);/, '批量确认弹窗外层应使用白色玻璃渐变遮罩');
    assert.doesNotMatch(quickEntryStyle, /#am-campaign-batch-confirm-popup\s*\{[\s\S]*?background:\s*rgba\(15,\s*23,\s*42,\s*0\.42\)/, '批量确认弹窗外层不得回退为深灰遮罩');
    assert.match(quickEntryStyle, /#am-campaign-batch-confirm-popup \.am-batch-confirm-card\s*\{[\s\S]*?width:\s*min\(360px,\s*calc\(100vw - 28px\)\);[\s\S]*?border:\s*1px solid var\(--am26-border[\s\S]*?border-radius:\s*18px[\s\S]*?background:\s*var\(--am26-panel-strong/, '批量确认弹窗应使用 360px 阅读宽度和统一面板 token');
    assert.doesNotMatch(quickEntryStyle, /#am-campaign-batch-confirm-popup \.am-batch-confirm-card\s*\{[\s\S]*?width:\s*min\(320px,\s*calc\(100vw - 28px\)\);/, '批量确认弹窗宽度不应回退到 320px');
    assert.match(quickEntryStyle, /#am-campaign-batch-confirm-popup \.am-batch-confirm-icon\s*\{[\s\S]*?background:\s*var\(--am26-warning-soft[\s\S]*?color:\s*var\(--am26-warning/, '批量确认警告图标应使用 warning token');
    assert.match(quickEntryStyle, /#am-campaign-batch-confirm-popup \.am-batch-confirm-icon\.is-danger\s*\{[\s\S]*?background:\s*var\(--am26-danger-soft[\s\S]*?color:\s*var\(--am26-danger/, '批量确认危险图标应使用 danger token');
    assert.match(quickEntryStyle, /#am-campaign-batch-confirm-popup \.am-batch-confirm-body\s*\{[\s\S]*?color:\s*var\(--am26-text-soft[\s\S]*?background:\s*var\(--am26-surface/, '批量确认正文应使用统一正文与 surface token');
    assert.match(quickEntryStyle, /#am-campaign-batch-confirm-popup \.am-batch-confirm-footer\s*\{[\s\S]*?background:\s*var\(--am26-surface/, '批量确认底部应使用统一 surface token');
    assert.match(quickEntryStyle, /#am-campaign-batch-confirm-popup \.am-batch-confirm-submit,[\s\S]*?border-radius:\s*10px/, '批量确认按钮圆角应符合统一按钮口径');
    assert.match(quickEntryStyle, /#am-campaign-batch-confirm-popup \.am-batch-confirm-submit\.is-danger:hover,[\s\S]*?background:\s*var\(--am26-danger[\s\S]*?outline:\s*2px solid var\(--am26-danger-soft/, '批量确认危险按钮 hover/focus 不应回退硬编码红色');
    assert.match(quickEntryStyle, /@media \(prefers-reduced-motion: reduce\)[\s\S]*?#am-campaign-batch-plus-menu \.am-campaign-batch-plus-item/, '批量+自有控件应适配减少动画');
});

test('批量+ AI点睛复用原生生成链路并支持管理展开与保存', () => {
    assert.match(
        quickEntry,
        /runBatchPlusAction\(action = '',\s*bizCode = '',\s*triggerEl = null\)[\s\S]*?if \(action === 'aiMax'\)[\s\S]*?runBatchAiMaxCampaigns\(contexts,\s*normalizedBizCode,\s*triggerEl\)/,
        '批量+ aiMax 动作应分发到 AI 点睛工作台'
    );
    assert.match(
        quickEntry,
        /runBatchAiMaxCampaigns\(contexts = \[\],\s*fallbackBizCode = '',\s*triggerEl = null\)[\s\S]*?targetBizCode !== 'onebpSearch'[\s\S]*?当前仅支持关键词推广计划/,
        '批量 AI 点睛应先限制关键词推广业务线'
    );
    assert.match(
        quickEntry,
        /resolveBatchAiMaxRow\(context = \{\},\s*fallbackBizCode = '',\s*authContext = \{\}\)[\s\S]*?queryCampaignDetail\(campaignId,\s*bizCode,\s*authContext\)[\s\S]*?isKeywordAiMaxCampaignEnabled\(campaign\)[\s\S]*?queryCampaignCrowdList\(campaignId,\s*bizCode,\s*authContext,\s*row\.aiMaxEnabled \? '' : adgroupId\)/,
        'AI 点睛工作台应读取计划详情、AI 开关和当前人群'
    );
    assert.match(
        quickEntry,
        /generateAiMaxCrowdsForRow\(row = \{\}\)[\s\S]*?const prompt = this\.getAiMaxBatchPromptText\(targetRow\)[\s\S]*?const shieldWords = this\.getAiMaxBatchShieldWords\(targetRow\)[\s\S]*?const requestPrompt = this\.buildAiMaxPromptWithShieldWords\(prompt,\s*shieldWords\)[\s\S]*?api\.fetchKeywordAiMaxInfo\(\{[\s\S]*?bizCode:\s*'onebpSearch'[\s\S]*?item,[\s\S]*?prompt:\s*requestPrompt[\s\S]*?\}\)[\s\S]*?withAiMaxPrompt\(info,\s*prompt,\s*shieldWords\)[\s\S]*?nativeCrowdList/,
        '批量获取新人群必须复用 fetchKeywordAiMaxInfo 的原生 AI 点睛生成链路，并把屏蔽词约束合并进本次请求 prompt'
    );
    assert.match(
        quickEntry,
        /resolveBatchAiMaxRow\(context = \{\},[\s\S]*?currentAiMaxInfo = \{[\s\S]*?campaign\.aiMaxInfo[\s\S]*?nativeCrowdList:\s*row\.currentCrowdList/,
        '读取当前计划后应把 campaign.aiMaxInfo 与当前人群合成可管理的 AI 点睛信息'
    );
    assert.match(
        quickEntry,
        /buildAiMaxDemandDetailHtml\(crowdItem = \{\},\s*demandName = '',\s*tooltipId = ''\)[\s\S]*?am-ai-max-demand-detail[\s\S]*?role="tooltip"[\s\S]*?am-ai-max-demand-keywords/,
        'AI 点睛需求人群详情应由共享 tooltip 渲染，包含关键词和人群解析'
    );
    assert.match(
        quickEntry,
        /buildAiMaxDemandDetailHtml\(crowdItem = \{\},[\s\S]*?crowdProfileList[\s\S]*?am-ai-max-demand-personas[\s\S]*?aria-label="人群解析"/,
        'AI 点睛需求人群 tooltip 应保留人群解析'
    );
    assert.match(
        quickEntry,
        /formatAiMaxCrowdTags\(crowdList = \[\],\s*limit = 4,\s*idPrefix = 'crowd',\s*options = \{\}\)[\s\S]*?expanded \? list : list\.slice\(0,\s*safeLimit\)[\s\S]*?am-ai-max-demand-popover[\s\S]*?am-ai-max-demand-card am-ai-max-crowd-tag[\s\S]*?<\/button>[\s\S]*?buildAiMaxDemandDetailHtml\(item,\s*name,\s*tooltipId\)[\s\S]*?<\/span>/,
        '批量弹窗当前/新生成人群详情应作为按钮外侧 sibling 弹窗渲染'
    );
    assert.match(
        quickEntry,
        /data-am-ai-max-action="toggleCrowds"[\s\S]*?data-crowd-scope="\$\{this\.escapeHtml\(options\.scope \|\| ''\)\}"[\s\S]*?\$\{expanded \? '收起' : `\+\$\{list\.length - safeLimit\}`\}/,
        '+N 应是可点击的当前行需求展开入口'
    );
    assert.match(
        quickEntry,
        /toggleAiMaxBatchCrowds\(campaignId = '',\s*scope = ''\)[\s\S]*?showAllNewCrowds[\s\S]*?showAllCurrentCrowds[\s\S]*?renderAiMaxBatchRows\(\)/,
        '+N 展开状态应只记录在当前 AI 点睛行上'
    );
    assert.match(
        quickEntry,
        /am-ai-max-demand-personas[\s\S]*?aria-label="人群解析"[\s\S]*?personaList\.map/,
        '就近详情应保留当前人群的具体解析'
    );
    assert.match(
        quickEntry,
        /renderAiMaxManagePanel\(row = \{\}\)[\s\S]*?this\.buildAiMaxDemandDetailHtml\(crowd,\s*item,\s*tooltipId\)[\s\S]*?am-ai-max-demand-mark[\s\S]*?am-ai-max-demand-copy[\s\S]*?detailHtml/,
        '备用管理面板中的需求卡片也应复用 hover/focus 详情浮层'
    );
    assert.doesNotMatch(
        quickEntry.slice(
            quickEntry.indexOf('renderAiMaxManagePanel(row = {})'),
            quickEntry.indexOf('async saveAiMaxRow')
        ),
        /am-ai-max-selected-detail|am-ai-max-selected-card|方案计划/,
        '需求详情不应再固定渲染成远离卡片的大块信息'
    );
    assert.match(
        quickEntry,
        /if \(action === 'manage'\) \{[\s\S]*?openAiMaxNativeManager\(row\)/,
        '管理入口应调用原生页面 AI 点睛设置入口'
    );
    assert.doesNotMatch(
        quickEntry.slice(
            quickEntry.indexOf('openAiMaxNativeManager(row = {})'),
            quickEntry.indexOf('findNativeAiMaxSettingDrawer()')
        ),
        /closeAiMaxBatchPopup\(\)/,
        '点击管理打开官方 AI 点睛设置时不应关闭原批量编辑 AI 点睛弹窗'
    );
    assert.match(
        quickEntry,
        /openAiMaxNativeManager\(row = \{\}\) \{[\s\S]*?findNativeActionButtonForContext\(context,\s*'aiMax'\)[\s\S]*?popup\.classList\.add\('is-native-open'\)[\s\S]*?beforeUrl = window\.location\.href[\s\S]*?button\.click\(\)[\s\S]*?navigatedToDetail[\s\S]*?window\.location\.href = beforeUrl[\s\S]*?findNativeAiMaxSettingDrawer[\s\S]*?raiseAiMaxNativeDrawer\(drawer\)[\s\S]*?watchAiMaxNativeDrawerClose/,
        '管理入口应保留批量弹窗并把官方 AI 点睛设置弹窗置顶'
    );
    assert.match(
        quickEntry,
        /raiseAiMaxNativeDrawer\(drawer = null\)[\s\S]*?style\.zIndex = '2147483600'[\s\S]*?restoreAiMaxNativeDrawerZIndex\(drawer = null\)[\s\S]*?removeProperty\('z-index'\)/,
        '官方 AI 点睛弹窗置顶应在关闭后恢复原 z-index'
    );
    assert.doesNotMatch(
        quickEntry,
        /pendingAiMaxNativeManager|openPendingAiMaxNativeDetailManager|findNativeAiMaxDetailSettingButton|schedulePendingAiMaxNativeManagerCheck/,
        '管理入口不应再通过详情页 pending 跟随打开 AI 点睛设置'
    );
    assert.match(
        quickEntry,
        /if \(normalizedAction === 'aiMax'\) \{[\s\S]*?return \[\/\^AI点睛设置\(\?:NEW\)\?\$\/\]/,
        'AI 点睛管理只能匹配当前行官方 AI点睛设置按钮，不能退化到高级设置或更多'
    );
    assert.match(
        quickEntry,
        /findNativeAiMaxSettingDrawer\(\) \{[\s\S]*?AI点睛设置[\s\S]*?方案解析[\s\S]*?已投放方案[\s\S]*?搜索需求[\s\S]*?开启AI点睛/,
        '管理入口应以官方 AI 点睛设置抽屉作为完成条件'
    );
    assert.doesNotMatch(
        quickEntry.slice(
            quickEntry.indexOf('openAiMaxNativeManager(row = {})'),
            quickEntry.indexOf('async generateAiMaxCrowdsForRow')
        ),
        /buildCampaignDetailUrl|window\.open/,
        '管理入口找不到当前行官方按钮时不应自动跳详情页'
    );
    assert.match(
        quickEntry,
        /resolveNativeActionRowElement\(context = \{\}\)[\s\S]*?a\[href\*="campaignId=\$\{campaignId\}"\][\s\S]*?closest\('tr'\)/,
        '官方按钮定位应能在 rowEl 失效时按 campaignId 重新找到列表行'
    );
    assert.match(
        quickEntry,
        /openAiMaxBatchPopup\(rows = \[\],\s*options = \{\}\)[\s\S]*?\$\{this\.renderAiMaxPromptCard\(\)\}[\s\S]*?data-am-ai-max-batch-body/,
        '批量弹窗顶部应挂载诉求卡到计划列表上方'
    );
    assert.match(
        quickEntry,
        /renderAiMaxPromptCard\(\)[\s\S]*?data-am-ai-max-action="toggleTemplate"[\s\S]*?data-am-ai-max-action="toggleShield"[\s\S]*?data-am-ai-max-action="resetPrompt"[\s\S]*?data-am-ai-max-action="generateAll"/,
        '诉求卡应提供模板、屏蔽词、恢复默认和方案解析入口'
    );
    assert.match(
        quickEntry,
        /getAiMaxPromptTemplates\(\)[\s\S]*?提升商品质量分[\s\S]*?核心流量竞争[\s\S]*?热门流量追踪[\s\S]*?低成本稳增长[\s\S]*?爆品拉新破圈[\s\S]*?新品快速测款/,
        '模板入口应补回 6 个推荐诉求模板'
    );
    assert.match(
        quickEntry,
        /renderAiMaxPromptCard\(\)[\s\S]*?class="am-ai-max-prompt-card"[\s\S]*?data-am-ai-max-prompt[\s\S]*?document[\s\S]*?<span>模板<\/span>[\s\S]*?minus-circle[\s\S]*?<span>屏蔽词 <em data-am-ai-max-shield-count>[\s\S]*?star[\s\S]*?方案解析/,
        '诉求卡样式结构应对齐官方：上方诉求文案，下方模板、屏蔽词、星标和方案解析'
    );
    assert.match(
        quickEntry,
        /renderAiMaxShieldPanel\(\)[\s\S]*?屏蔽词设置[\s\S]*?renderBox\('center',\s*'中心词屏蔽',\s*10,\s*state\.center\)[\s\S]*?renderBox\('exact',\s*'精确词屏蔽',\s*100,\s*state\.exact\)/,
        '屏蔽词入口应补回中心词和精确词编辑面板'
    );
    assert.match(
        quickEntry,
        /renderAiMaxShieldPanel\(\)[\s\S]*?data-am-ai-max-shield-input="\$\{this\.escapeHtml\(type\)\}"[\s\S]*?data-am-ai-max-action="addShieldWord"[\s\S]*?data-am-ai-max-shield-list="\$\{this\.escapeHtml\(type\)\}"/,
        '屏蔽词面板应提供输入、添加和标签列表'
    );
    assert.match(
        quickEntry,
        /if \(action === 'toggleTemplate'\)[\s\S]*?toggleAiMaxPromptPanel\(popup,\s*'template'[\s\S]*?if \(action === 'toggleShield'\)[\s\S]*?toggleAiMaxPromptPanel\(popup,\s*'shield'[\s\S]*?if \(action === 'applyTemplate'\)[\s\S]*?setAiMaxBatchPrompt\(template\.text\)[\s\S]*?if \(action === 'addShieldWord'\)[\s\S]*?addAiMaxBatchShieldWord\(type,\s*input\.value\)[\s\S]*?if \(action === 'removeShieldWord'\)[\s\S]*?removeAiMaxBatchShieldWord/,
        '诉求卡的模板应用和屏蔽词增删必须接入弹窗事件'
    );
    assert.match(
        quickEntry,
        /getInitialAiMaxBatchPrompt\(rows = \[\]\)[\s\S]*?extractAiMaxInfoPrompt\(row\?\.newAiMaxInfo\)[\s\S]*?extractAiMaxInfoPrompt\(row\?\.currentAiMaxInfo\)[\s\S]*?getDefaultAiMaxPrompt/,
        '获取新人群诉求应优先从已读取 AI 点睛信息初始化，缺省时再使用默认诉求'
    );
    assert.match(
        quickEntry,
        /getInitialAiMaxBatchShieldWords\(rows = \[\]\)[\s\S]*?getAiMaxInfoShieldWordState\(info\)[\s\S]*?centerWords\.push\(\.\.\.state\.center\)[\s\S]*?exactWords\.push\(\.\.\.state\.exact\)/,
        '屏蔽词应能从已读取 AI 点睛信息初始化'
    );
    assert.match(
        quickEntry,
        /buildAiMaxPromptWithShieldWords\(prompt = '',\s*shieldWords = \{\}\)[\s\S]*?中心词屏蔽：\$\{center\.join\('、'\)\}[\s\S]*?精确词屏蔽：\$\{exact\.join\('、'\)\}[\s\S]*?屏蔽词要求：/,
        '生成请求 prompt 应追加屏蔽词要求'
    );
    assert.match(
        quickEntry,
        /withAiMaxPrompt\(info = \{\},\s*prompt = '',\s*shieldWords = \{\}\)[\s\S]*?next\.trafficAppeal = promptText[\s\S]*?next\.aiMaxPureUserInput = promptText[\s\S]*?aiMaxUserInput[\s\S]*?word:\s*promptText[\s\S]*?next\.centerShieldWordList = centerShieldWordList[\s\S]*?next\.exactShieldWordList = exactShieldWordList[\s\S]*?blockWordConfig[\s\S]*?centerWordList:\s*centerShieldWordList[\s\S]*?exactWordList:\s*exactShieldWordList/,
        '生成结果应写回纯诉求和结构化屏蔽词，保证后续保存 payload 不丢失字段'
    );
    assert.doesNotMatch(
        quickEntry,
        /promptInput|am-ai-max-prompt-editor|customPrompt|data-am-ai-max-action="savePrompt"|data-am-ai-max-action="applyPrompt"/,
        '批量弹窗不应自建官方 prompt 设置表单或绕过原生 AI 点睛设置'
    );
    assert.doesNotMatch(
        quickEntry,
        /selectAiMaxBatchDemand|data-am-ai-max-action="selectDemand"|activeDemandIndex|aria-pressed/,
        '需求人群详情不应再依赖点击切换状态，应由 hover/focus 临时显示'
    );
    assert.match(
        quickEntry,
        /getAiMaxSelectedDemandList\(info = \{\},\s*crowdList = \[\]\)[\s\S]*?if \(this\.hasAiMaxSelectedDemandList\(info\)\)[\s\S]*?return allDemandList/,
        'AI 点睛需求没有显式选择状态时应默认全选全部需求'
    );
    const demandSelectBlock = getQuickEntryMethodSlice('renderAiMaxDemandSelect', 'withAiMaxPrompt');
    assert.match(demandSelectBlock, /需求 已选 \$\{checkedCount\}\/\$\{demandList\.length\}/, '需求下拉触发按钮应显示已选数量');
    assert.match(demandSelectBlock, /data-am-ai-max-demand-check-all/, '需求下拉应提供全选项');
    assert.match(demandSelectBlock, /data-am-ai-max-demand-check="1"/, '需求下拉应提供单项复选框');
    assert.match(demandSelectBlock, /data-am-ai-max-action="applyDemandSelect"[\s\S]*?确定/, '需求下拉应提供确定按钮');
    assert.match(demandSelectBlock, /data-am-ai-max-action="cancelDemandSelect"[\s\S]*?取消/, '需求下拉应提供取消按钮');
    assert.match(
        quickEntry,
        /if \(action === 'toggleDemandSelect'\) \{[\s\S]*?closeAiMaxPromptPanels\(popup\)[\s\S]*?toggleAiMaxDemandSelect\(campaignId\)[\s\S]*?if \(action === 'applyDemandSelect'\) \{[\s\S]*?applyAiMaxDemandSelect\(campaignId,[\s\S]*?if \(action === 'cancelDemandSelect'\) \{[\s\S]*?closeAiMaxDemandSelectPanels\(\)/,
        '需求下拉的打开、确定和取消必须接入批量弹窗点击事件'
    );
    assert.match(
        quickEntry,
        /popup\.addEventListener\('change',\s*\(event\) => \{[\s\S]*?data-am-ai-max-demand-select-panel[\s\S]*?data-am-ai-max-demand-check-all[\s\S]*?data-am-ai-max-demand-check[\s\S]*?syncAiMaxDemandSelectPanelState\(panel\)/,
        '需求下拉 checkbox 变更应同步全选、半选和已选数量'
    );
    assert.match(
        quickEntry,
        /if \(event\.key !== 'Escape'\) return;[\s\S]*?openDemandPanel[\s\S]*?closeAiMaxDemandSelectPanels\(\)[\s\S]*?openPanel[\s\S]*?closeAiMaxPromptPanels\(popup\)/,
        'Esc 应优先关闭需求下拉，再关闭 prompt 弹层，最后关闭批量弹窗'
    );
    assert.match(
        quickEntry,
        /buildAiMaxSavePayload\(row = \{\}\)[\s\S]*?const allDemandList = this\.getAiMaxAllDemandList\(info,\s*editableCrowdList\)[\s\S]*?const selectedDemandList = this\.getAiMaxSelectedDemandList\(info,\s*editableCrowdList\)[\s\S]*?getAiMaxCrowdListByDemand\(editableCrowdList,\s*selectedDemandList\)[\s\S]*?aiMaxInfo\.demandList = allDemandList[\s\S]*?aiMaxInfo\.selectedDemandList = selectedDemandList[\s\S]*?nativeCrowdList[\s\S]*?crowdList/,
        '保存 payload 应按已选需求过滤 nativeCrowdList 与顶层 crowdList，未选需求等同删除'
    );
    assert.match(
        quickEntry,
        /buildAiMaxSavePayload\(row = \{\}\)[\s\S]*?const shieldWords = this\.getAiMaxInfoShieldWordState\(info\)[\s\S]*?aiMaxUserInput[\s\S]*?wordList[\s\S]*?centerShieldWordList:\s*shieldWords\.center[\s\S]*?exactShieldWordList:\s*shieldWords\.exact[\s\S]*?blockWordConfig[\s\S]*?centerWordList:\s*shieldWords\.center[\s\S]*?exactWordList:\s*shieldWords\.exact[\s\S]*?aiMaxDeliveryPlan[\s\S]*?nativeCrowdList[\s\S]*?crowdList/,
        '保存 payload 应包含原生合同的 aiMaxInfo、prompt、方案计划、顶层 crowdList 和结构化屏蔽词'
    );
    assert.match(
        quickEntry,
        /saveAiMaxRow\(row = \{\},\s*authContext = \{\}\)[\s\S]*?aimax\/updateUserInput\.json\?\$\{query\.toString\(\)\}[\s\S]*?OneApiTransport\.postJson\(url,\s*payload/,
        '保存应调用原生 aimax/updateUserInput.json 合同'
    );
    assert.match(
        quickEntry,
        /saveAiMaxBatchRow\(campaignId = '',\s*triggerEl = null\)[\s\S]*?openBatchPlusConfirmDialog\(\{[\s\S]*?确认保存AI点睛[\s\S]*?saveAiMaxRow\(row,\s*authContext\)/,
        '单行保存前必须二次确认并调用统一保存 helper'
    );
    assert.match(
        quickEntry,
        /saveAiMaxCrowdsForAllRows\(triggerEl = null\)[\s\S]*?确认批量保存AI点睛[\s\S]*?saveAiMaxRow\(row,\s*authContext\)/,
        '批量保存前必须二次确认并逐行调用统一保存 helper'
    );
    assert.match(quickEntry, /data-am-ai-max-action="saveAll"[\s\S]*?批量保存/, 'AI 点睛工作台应提供批量保存入口');
    assert.match(quickEntry, /data-am-ai-max-action="save"[\s\S]*?>保存<\/button>/, 'AI 点睛工作台应提供行级保存入口');
    assert.match(
        quickEntry,
        /formatAiMaxCrowdTags\(row\.currentCrowdList,\s*4,[\s\S]*?formatAiMaxCrowdTags\(row\.newCrowdList,\s*4/,
        '当前/新生成需求人群默认应横向展示更多卡片'
    );
    assert.match(
        quickEntry,
        /am-ai-max-row-footer[\s\S]*?am-ai-max-row-status[\s\S]*?am-ai-max-row-actions[\s\S]*?data-am-ai-max-action="manage"[\s\S]*?data-am-ai-max-action="generate"[\s\S]*?data-am-ai-max-action="save"/,
        '状态提示和行级操作应放在对应计划内容下方'
    );
    assert.doesNotMatch(
        quickEntry.slice(
            quickEntry.indexOf('renderAiMaxBatchRows()'),
            quickEntry.indexOf('closeAiMaxBatchPopup()')
        ),
        /am-ai-max-row-side/,
        'AI 点睛计划行不应再使用右侧操作列挤占需求人群空间'
    );
    assert.match(
        quickEntry,
        /if \(action === 'toggleCrowds'\) \{[\s\S]*?toggleAiMaxBatchCrowds\(row\.campaignId,\s*target\.getAttribute\('data-crowd-scope'\) \|\| ''\)/,
        '+N 按钮点击应展开当前行对应分组的全部需求人群'
    );
    assert.doesNotMatch(
        quickEntry.slice(
            quickEntry.indexOf('async generateAiMaxCrowdsForRow'),
            quickEntry.indexOf('async generateAiMaxCrowdsForAllRows')
        ),
        /updatePart|solution\/addList|campaign\/create|campaign\/delete|rightList\s*=|saveAiMaxRow|aimax\/updateUserInput/,
        'AI 点睛批量获取新人群不得在生成阶段直接提交或改写人群'
    );
    assert.match(
        keywordPlanApi,
        /const normalizeAiMaxPrompt = \(prompt = ''\) => \{[\s\S]*?return text \|\| KEYWORD_AI_MAX_NATIVE_PROMPT/,
        '底层 AI 点睛生成接口应规范化自定义 prompt 并保留默认兜底'
    );
    assert.match(
        keywordPlanApi,
        /requestAiMaxBusinessTalk = async \(\{ bizCode,\s*item,\s*prompt,\s*requestOptions \} = \{\}\) => \{[\s\S]*?const promptText = normalizeAiMaxPrompt\(prompt\)[\s\S]*?prompt:\s*\{[\s\S]*?wordList:\s*\[\{ word:\s*promptText \}\]/,
        '底层 businessTalk 请求必须把自定义 prompt 写入 prompt.wordList'
    );
    assert.match(
        keywordPlanApi,
        /fetchKeywordAiMaxInfo = async \(\{ bizCode,\s*item,\s*prompt,\s*requestOptions \} = \{\}\) => \{[\s\S]*?const promptText = normalizeAiMaxPrompt\(prompt\)[\s\S]*?requestAiMaxBusinessTalk\(\{ bizCode:\s*targetBizCode,\s*item,\s*prompt:\s*promptText,\s*requestOptions \}\)[\s\S]*?normalizeNativeAiMaxInfo\(\{ item,\s*aiData,\s*budgetData,\s*effectData,\s*prompt \}\)/,
        'fetchKeywordAiMaxInfo 应把 prompt 传入原生生成请求和结果归一化'
    );
    assert.match(
        keywordPlanApi,
        /const rawPrompt = String\(prompt \|\| ''\)\.trim\(\)[\s\S]*?const trafficAppeal = String\(rawPrompt \|\| nativeInfo\.aiMaxPureUserInput \|\| promptText\)\.trim\(\)[\s\S]*?aiMaxUserInput:[\s\S]*?word:\s*trafficAppeal/,
        '归一化结果应优先使用显式本次 prompt，并在未自定义时保留原生诉求'
    );
    assert.match(quickEntryStyle, /#am-campaign-ai-max-batch-popup\s*\{[\s\S]*?background:\s*linear-gradient\(135deg,\s*rgba\(255,\s*255,\s*255,\s*0\.76\),\s*rgba\(255,\s*255,\s*255,\s*0\.46\)\)/, 'AI 点睛工作台应使用统一浅玻璃遮罩');
    assert.match(quickEntryStyle, /#am-campaign-ai-max-batch-popup \.am-ai-max-card\s*\{[\s\S]*?overflow:\s*visible/, 'AI 点睛工作台卡片应允许需求详情浮层越过弹窗边界显示');
    assert.match(quickEntryStyle, /#am-campaign-ai-max-batch-popup \.am-ai-max-prompt-card\s*\{[\s\S]*?border:\s*2px solid rgba\(112,\s*130,\s*255,\s*0\.82\)[\s\S]*?border-radius:\s*18px[\s\S]*?background:\s*rgba\(255,\s*255,\s*255,\s*0\.9\)/, '获取新人群诉求区应渲染成参考截图的整块描边诉求卡');
    assert.match(quickEntryStyle, /#am-campaign-ai-max-batch-popup \.am-ai-max-prompt-input\s*\{[\s\S]*?min-height:\s*42px[\s\S]*?resize:\s*vertical[\s\S]*?background:\s*transparent/, '获取新人群诉求文案应在卡片上方可换行编辑');
    assert.match(quickEntryStyle, /#am-campaign-ai-max-batch-popup \.am-ai-max-prompt-chip,[\s\S]*?#am-campaign-ai-max-batch-popup \.am-ai-max-prompt-submit\s*\{[\s\S]*?border-radius:\s*999px[\s\S]*?white-space:\s*nowrap/, '模板、屏蔽词、恢复默认和方案解析应使用胶囊按钮并避免文字换行挤压');
    assert.match(quickEntryStyle, /#am-campaign-ai-max-batch-popup \.am-ai-max-prompt-submit\s*\{[\s\S]*?margin-left:\s*auto[\s\S]*?background:\s*linear-gradient\(135deg,\s*#6b5cff,\s*#8c3dff\)/, '方案解析按钮应靠右并使用紫色主按钮样式');
    assert.match(quickEntryStyle, /#am-campaign-ai-max-batch-popup \.am-ai-max-template-list\s*\{[\s\S]*?grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/, '模板弹层应以三列展示 6 个推荐模板');
    assert.match(quickEntryStyle, /#am-campaign-ai-max-batch-popup \.am-ai-max-shield-grid\s*\{[\s\S]*?grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/, '屏蔽词弹层应区分中心词与精确词两列编辑');
    assert.match(quickEntryStyle, /#am-campaign-ai-max-batch-popup \.am-ai-max-body\s*\{[\s\S]*?overflow:\s*visible/, '需求详情浮层不应被 body 滚动容器裁剪');
    assert.match(quickEntryStyle, /#am-campaign-ai-max-batch-popup \.am-ai-max-row\s*\{[\s\S]*?grid-template-columns:\s*32px minmax\(0,\s*1fr\)/, 'AI 点睛计划行应释放右侧操作列宽');
    assert.doesNotMatch(quickEntryStyle, /grid-template-columns:\s*32px minmax\(0,\s*1fr\) 220px|\.am-ai-max-row-side/, 'AI 点睛计划行不应保留旧右侧操作列样式');
    assert.match(quickEntryStyle, /#am-campaign-ai-max-batch-popup \.am-ai-max-row-footer\s*\{[\s\S]*?justify-content:\s*space-between;[\s\S]*?flex-wrap:\s*wrap/, '状态和操作按钮应在计划内容底部横排并可换行');
    assert.match(quickEntryStyle, /#am-campaign-ai-max-batch-popup \.am-ai-max-row-crowds \.am-ai-max-demand-popover\s*\{[\s\S]*?flex:\s*0 1 188px;[\s\S]*?max-width:\s*188px/, '需求人群卡片应收紧宽度以横向展示更多');
    assert.match(quickEntryStyle, /#am-campaign-ai-max-batch-popup \.am-ai-max-demand-card\.am-ai-max-crowd-tag\s*\{[\s\S]*?max-width:\s*188px/, '批量行需求人群卡片最大宽度应更紧凑');
    assert.match(quickEntryStyle, /#am-campaign-ai-max-batch-popup \.am-ai-max-manage-panel\s*\{[\s\S]*?display:\s*grid;[\s\S]*?border-radius:\s*10px/, '管理展开板块应有稳定容器样式');
    assert.match(quickEntryStyle, /#am-campaign-ai-max-batch-popup \.am-ai-max-demand-grid\s*\{[\s\S]*?grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/, 'AI 点睛需求卡片应按稳定网格展示');
    assert.match(quickEntryStyle, /#am-campaign-ai-max-batch-popup\.is-native-open\s*\{[\s\S]*?z-index:\s*2147482000;[\s\S]*?pointer-events:\s*none/, '官方 AI 点睛弹窗打开时批量弹窗应保留在下层且不拦截操作');
    const demandSelectStyle = quickEntryStyle.slice(
        quickEntryStyle.indexOf('#am-campaign-ai-max-batch-popup .am-ai-max-demand-select {'),
        quickEntryStyle.indexOf('#am-campaign-ai-max-batch-popup .am-ai-max-manage-panel')
    );
    assert.match(demandSelectStyle, /\.am-ai-max-demand-select\s*\{[\s\S]*?position:\s*relative;[\s\S]*?overflow:\s*visible/, '需求下拉容器应允许 popover 越过行内按钮区域显示');
    assert.match(demandSelectStyle, /\.am-ai-max-demand-select-popover\s*\{[\s\S]*?position:\s*absolute[\s\S]*?right:\s*0;[\s\S]*?top:\s*calc\(100% \+ 6px\);[\s\S]*?z-index:\s*2147483645[\s\S]*?width:\s*min\(360px,\s*calc\(100vw - 72px\)\)/, '需求下拉应是锚定触发按钮的紧凑多选弹层');
    assert.match(demandSelectStyle, /\.am-ai-max-demand-select-popover\[hidden\]\s*\{[\s\S]*?display:\s*none/, '需求下拉关闭态应从布局中隐藏');
    assert.match(demandSelectStyle, /\.am-ai-max-demand-select-list\s*\{[\s\S]*?max-height:\s*220px;[\s\S]*?overflow:\s*auto/, '需求下拉长列表应内部滚动，避免撑破批量弹窗');
    assert.match(demandSelectStyle, /\.am-ai-max-demand-select-item input:checked \+ \.am-ai-max-demand-select-check\s*\{[\s\S]*?background:\s*var\(--am26-primary/, '需求下拉应有清晰的勾选状态');
    assert.match(demandSelectStyle, /\.am-ai-max-demand-select-item input:indeterminate \+ \.am-ai-max-demand-select-check/, '需求下拉全选项应支持半选态');
    assert.match(quickEntryStyle, /#am-campaign-ai-max-batch-popup \.am-ai-max-demand-popover\s*\{[\s\S]*?position:\s*relative;[\s\S]*?display:\s*block/, '需求人群详情弹窗应由卡片外层 wrapper 定位');
    assert.match(quickEntryStyle, /#am-campaign-ai-max-batch-popup \.am-ai-max-demand-card\s*\{[\s\S]*?grid-template-columns:\s*22px minmax\(0,\s*1fr\)[\s\S]*?background:\s*#f7f9ff;/, '需求人群卡片应使用纯色背景');
    const demandCardStyle = quickEntryStyle.match(/#am-campaign-ai-max-batch-popup \.am-ai-max-demand-card\s*\{[\s\S]*?\n\s*\}/)?.[0] || '';
    assert.doesNotMatch(demandCardStyle, /linear-gradient/, '需求人群卡片默认态不应再使用渐变背景');
    assert.match(quickEntryStyle, /#am-campaign-ai-max-batch-popup \.am-ai-max-demand-detail\s*\{[\s\S]*?position:\s*absolute[\s\S]*?left:\s*0;[\s\S]*?top:\s*calc\(100% \+ 8px\);[\s\S]*?z-index:\s*2147483647;[\s\S]*?pointer-events:\s*none/, '需求详情应作为对应按钮下方弹窗显示，不占用卡片布局');
    assert.doesNotMatch(quickEntryStyle, /is-popover-left|right:\s*calc\(100% \+ 10px\)|translateY\(-50%\)/, '需求详情不应再左右侧弹出');
    assert.match(quickEntryStyle, /#am-campaign-ai-max-batch-popup \.am-ai-max-demand-popover:hover \.am-ai-max-demand-detail,[\s\S]*?\.am-ai-max-demand-popover:focus-within \.am-ai-max-demand-detail\s*\{[\s\S]*?display:\s*grid/, '需求详情应在鼠标移入或键盘聚焦 wrapper 时显示，移出后由 CSS 自动关闭');
    assert.match(quickEntryStyle, /#am-campaign-ai-max-batch-popup \.am-ai-max-inline-keyword\s*\{[\s\S]*?white-space:\s*normal;[\s\S]*?overflow-wrap:\s*anywhere/, '需求详情关键词应允许换行完整显示');
    assert.match(quickEntryStyle, /#am-campaign-ai-max-batch-popup \.am-ai-max-demand-personas\s*\{[\s\S]*?grid-template-columns:\s*56px minmax\(0,\s*1fr\)/, '需求详情人群解析应紧凑展示');
    assert.match(sharedPreamble, /document:\s*\{[\s\S]*?body:\s*'<rect[\s\S]*?M9 8h6/, '共享图标应补充模板 document 图标');
    assert.match(sharedPreamble, /['"]minus-circle['"]:\s*\{[\s\S]*?body:\s*'<circle[\s\S]*?M8 12h8/, '共享图标应补充屏蔽词 minus-circle 图标');
});

test('批量+ 读取表格勾选计划并按业务线分组', () => {
    assert.match(quickEntry, /getCurrentCampaignBizCode\(\)[\s\S]*?#\\!\\\/manage\\\/display[\s\S]*?onebpDisplay[\s\S]*?#\\!\\\/manage\\\/hky[\s\S]*?onebpAdStrategyLiuZi[\s\S]*?#\\!\\\/manage\\\/search[\s\S]*?onebpSearch/, '批量+应从当前管理页路由识别业务线');
    assert.match(quickEntry, /collectSelectedCampaignContexts\(preferredBizCode = ''\)[\s\S]*?input\[type="checkbox"\]:checked,[\s\S]*?\[role="checkbox"\]\[aria-checked="true"\]/, '批量+应读取原生表格勾选项');
    assert.match(quickEntry, /const routeBizCode = this\.normalizeBizCode\(preferredBizCode \|\| this\.getCurrentCampaignBizCode\(\) \|\| ''\)/, '勾选项收集应绑定当前路由业务线');
    assert.match(quickEntry, /if \(routeBizCode && bizCode !== routeBizCode\) return;/, 'SPA 切页后的旧业务线选中残留应被过滤');
    assert.match(quickEntry, /isSelectableControlVisible\(el\)[\s\S]*?closest\('label, \.next-checkbox, \.ant-checkbox, \.mx-checkbox, \[role="checkbox"\]'\)/, '透明原生 checkbox 应回退到外层可见控件判断');
    assert.match(quickEntry, /collectSelectedCampaignContexts\(preferredBizCode = ''\)[\s\S]*?isSelectableControlVisible\(checkbox\)/, '选中项扫描应使用 checkbox 可见性兜底');
    assert.match(quickEntry, /findSelectedCampaignContextFromCheckbox\(checkbox\)[\s\S]*?rect\.height > 360 \|\| pointer\.id === 'app'[\s\S]*?resolveCampaignContextFromElement\(pointer\)/, '勾选项解析应避免从整页误提计划 ID');
    assert.match(quickEntry, /groupCampaignContextsByBizCode\(contexts = \[\],\s*fallbackBizCode = ''\)/, '批量+应按 bizCode 分组执行');
    assert.match(quickEntry, /请先勾选需要\$\{meta\.label\}的计划/, '状态批量动作无选中项时应提示再执行');
    assert.match(quickEntry, /未能识别需要\$\{meta\.label\}的计划ID/, '状态批量动作识别不到计划ID时不得继续执行');
    assert.match(quickEntry, /请先勾选需要批量删除的计划/, '无选中项时应提示再执行');
    assert.match(quickEntry, /请先勾选需要批量处理的计划/, '人群类动作无选中项时应提示再执行');
});

test('批量开启与批量暂停使用原生状态接口且有二次确认', () => {
    const batchStatusBlock = quickEntry.slice(
        quickEntry.indexOf('async runBatchUpdateCampaignStatus'),
        quickEntry.indexOf('async runBatchDeleteCampaigns')
    );
    assert.match(quickEntry, /getBatchStatusActionMeta\(action = ''\)[\s\S]*?normalized === 'start'[\s\S]*?onlineStatus:\s*1[\s\S]*?label:\s*'批量开启'/, '批量开启应映射到 onlineStatus=1');
    assert.match(quickEntry, /getBatchStatusActionMeta\(action = ''\)[\s\S]*?normalized === 'pause'[\s\S]*?onlineStatus:\s*0[\s\S]*?label:\s*'批量暂停'/, '批量暂停应映射到 onlineStatus=0');
    assert.match(quickEntry, /runBatchUpdateCampaignStatus\(action = '',\s*contexts = \[\],\s*fallbackBizCode = '',\s*triggerEl = null\)/, '缺少批量状态执行函数');
    assert.match(quickEntry, /openBatchPlusConfirmDialog\(\{[\s\S]*?title:\s*`确认\$\{meta\.verb\}计划`[\s\S]*?message:\s*`确认\$\{meta\.verb\}选中的 \$\{ids\.length\} 个\$\{sceneName\}计划[\s\S]*?focusBackTarget:\s*triggerEl/, '批量开启/暂停前必须二次确认并传入回焦目标');
    assert.match(quickEntry, /updateCampaignStatusBatchByBiz\(campaignIds = \[\],\s*bizCode,\s*onlineStatus,\s*authContext\)[\s\S]*?campaign\/updatePart\.json\?\$\{query\.toString\(\)\}[\s\S]*?displayStatus:\s*status === 1 \? 'start' : 'pause'/, '批量开启/暂停应调用原生 campaign/updatePart.json 并写 displayStatus');
    assert.match(quickEntry, /runBatchUpdateCampaignStatus\(action = '',[\s\S]*?updateCampaignStatusBatchByBiz\(list\.map\(item => item\.campaignId\),\s*bizCode,\s*meta\.onlineStatus,\s*authContext\)/, '批量状态执行应按业务线分组调用状态接口');
    assert.match(quickEntry, /runBatchPlusAction\(action = '',\s*bizCode = '',\s*triggerEl = null\)[\s\S]*?if \(action === 'start' \|\| action === 'pause'\)[\s\S]*?runBatchUpdateCampaignStatus\(action,\s*contexts,\s*normalizedBizCode,\s*triggerEl\)/, '批量+ start/pause 动作应接入状态流程');
    assert.match(batchStatusBlock, /refreshCampaignListOnly\(\{[\s\S]*?reason:\s*meta\.label/, '批量状态变更成功后应只刷新计划列表');
    assert.doesNotMatch(batchStatusBlock, /window\.location\.reload\(\)/, '批量状态变更成功后不得整页刷新');
});

test('批量删除使用原生删除接口且有二次确认', () => {
    const batchDeleteBlock = quickEntry.slice(
        quickEntry.indexOf('async runBatchDeleteCampaigns'),
        quickEntry.indexOf('getDisplayCrowdDateRange()')
    );
    assert.match(quickEntry, /deleteCampaignsBatchByBiz\(campaignIds = \[\],\s*bizCode = '',\s*authContext = \{\}\)/, '缺少批量删除执行函数');
    assert.match(quickEntry, /campaign\/delete\.json\?\$\{query\.toString\(\)\}/, '批量删除应调用原生 campaign/delete.json');
    assert.match(quickEntry, /campaignIdList:\s*normalizedIds\.map\(id => Number\(id\)\)/, '批量删除应提交 campaignIdList');
    assert.match(quickEntry, /openBatchPlusConfirmDialog\(\{[\s\S]*?title:\s*'确认删除计划'[\s\S]*?message:\s*`确认删除选中的 \$\{ids\.length\} 个\$\{sceneName\}计划[\s\S]*?focusBackTarget:\s*triggerEl/, '批量删除前必须二次确认并传入回焦目标');
    assert.doesNotMatch(quickEntry, /window\.confirm\(/, '批量删除不得使用浏览器原生 confirm');
    assert.match(quickEntry, /runBatchPlusAction\(action = '',\s*bizCode = '',\s*triggerEl = null\)[\s\S]*?if \(action === 'delete'\)[\s\S]*?runBatchDeleteCampaigns\(contexts,\s*normalizedBizCode,\s*triggerEl\)/, '批量+ delete 动作应接入删除流程');
    assert.match(batchDeleteBlock, /refreshCampaignListOnly\(\{[\s\S]*?reason:\s*'批量删除'/, '批量删除成功后应只刷新计划列表');
    assert.doesNotMatch(batchDeleteBlock, /window\.location\.reload\(\)/, '批量删除成功后不得整页刷新');
});

test('批量修改计划名称复用复制一览窗、提供名称批处理并提交原生 updatePart 合同', () => {
    const renameBlock = quickEntry.slice(
        quickEntry.indexOf('async runBatchRenameCampaigns'),
        quickEntry.indexOf('async runBatchDeleteCampaigns')
    );
    const submitRenameBlock = quickEntry.slice(
        quickEntry.indexOf('async submitBatchRenameCampaignRows'),
        quickEntry.indexOf('async runBatchRenameCampaigns')
    );
    const updateNameBlock = quickEntry.slice(
        quickEntry.indexOf('async updateCampaignNamesBatchByBiz'),
        quickEntry.indexOf('async runSiteCustomBreakthroughStrategy')
    );
    const rowHtmlBlock = getQuickEntryMethodSlice('buildCopyOverviewRowHtml', 'getCopyOverviewSubtitle');
    const validateBlock = getQuickEntryMethodSlice('validateCopyOverviewRows', 'getCopyOverviewRowElements');
    const restoreRenameBlock = getQuickEntryMethodSlice('restoreRenameOriginalNamesToPopup', 'applyRenameActionToPopup');
    const overviewBlock = quickEntry.slice(
        quickEntry.indexOf('openCopyPlanOverviewDialog(context = {}, submitCallback, options = {})'),
        quickEntry.indexOf('async prepareCopyCurrentPlanContext')
    );
    const queryByIdBlock = quickEntry.slice(
        quickEntry.indexOf('async queryCampaignListById'),
        quickEntry.indexOf('async resolveCopySourcePlan')
    );

    assert.match(quickEntry, /runBatchPlusAction\(action = '',\s*bizCode = '',\s*triggerEl = null\)[\s\S]*?if \(action === 'rename'\)[\s\S]*?runBatchRenameCampaigns\(contexts,\s*normalizedBizCode,\s*triggerEl\)/, '批量+ rename 动作应分发到批量改名流程');
    assert.match(renameBlock, /openCopyPlanOverviewDialog\(quickContext,[\s\S]*?\{[\s\S]*?mode:\s*'rename'[\s\S]*?prepareContext:\s*async \(\) =>/, '批量改名应复用复制计划一览窗并传入 rename 模式');
    assert.match(renameBlock, /guessCampaignNameFromContext\(context\)/, '批量改名初始行应先从勾选行上下文猜测计划名');
    assert.match(renameBlock, /buildBatchRenameRows\(selected,\s*targetBizCode,\s*authContext\)/, '批量改名应异步补齐真实计划名称');
    assert.match(quickEntry, /resolveBatchRenamePlanName\(context = \{\},[\s\S]*?guessCampaignNameFromContext\(context\)[\s\S]*?queryCampaignListById\(campaignId,\s*bizCode,\s*authContext\)[\s\S]*?queryCampaignDetail\(campaignId,\s*bizCode,\s*authContext\)/, '计划名称补齐应按行 DOM、列表接口、详情接口顺序兜底');
    assert.match(queryByIdBlock, /campaign\/horizontal\/findPage\.json\?\$\{query\.toString\(\)\}[\s\S]*?searchKey:\s*'campaignId'[\s\S]*?searchValue:\s*id[\s\S]*?campaignIdList:\s*\[id\]/, '计划名称只读补齐应命中 findPage 并带 campaignId 查询条件');

    assert.match(rowHtmlBlock, /const renameMode = mode === 'rename';/, '复制一览窗行渲染应识别 rename 模式');
    assert.match(rowHtmlBlock, /data-am-copy-field="planName"[\s\S]*?value="\$\{this\.escapeHtml\(row\.planName \|\| ''\)\}"[\s\S]*?data-campaign-id="\$\{this\.escapeHtml\(row\.campaignId \|\| ''\)\}" data-original-plan-name="\$\{this\.escapeHtml\(row\.originalPlanName \|\| row\.planName \|\| ''\)\}"/, 'rename 行应保留 campaignId 和原始名称，属性值必须经过 escapeHtml 转义');
    assert.match(quickEntry, /escapeHtml\(value\)[\s\S]*?const map = \{ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' \}/, '计划名写入 input value 和 data-original-plan-name 前必须转义单双引号');
    assert.match(rowHtmlBlock, /<td\$\{renameMode \? ' data-am-copy-mode-hidden="rename"' : ''\}>[\s\S]*?data-am-copy-field="bidModeDisplay"[\s\S]*?<td\$\{renameMode \? ' data-am-copy-mode-hidden="rename"' : ''\}>[\s\S]*?data-am-copy-field="bidPrice"[\s\S]*?<td\$\{renameMode \? ' data-am-copy-mode-hidden="rename"' : ''\}>[\s\S]*?data-am-copy-field="budgetField"/, 'rename 模式应隐藏出价方式、出价价格和预算行内列');
    assert.match(overviewBlock, /const titleText = renameMode \? '批量修改计划名称' : '复制计划一览';[\s\S]*?const submitButtonText = renameMode \? '确认修改' : '确认生成';/, 'rename 弹窗标题和提交按钮文案应替换为批量改名语义');
    assert.match(overviewBlock, /popup\.setAttribute\('data-am-copy-dialog-mode',\s*dialogMode\)/, 'rename 弹窗应设置模式属性供 CSS 隐藏列');
    assert.match(overviewBlock, /<div class="am-copy-overview-bulkbar"\$\{renameMode \? ' data-am-copy-mode-hidden="rename"' : ''\}>/, 'rename 模式应隐藏批量出价和批量预算工具条');
    assert.match(overviewBlock, /am-copy-overview-renamebar[\s\S]*?data-am-copy-rename="prefix"[\s\S]*?data-am-copy-rename-action="prefix"[\s\S]*?加前缀/, 'rename 模式应提供批量加前缀');
    assert.match(overviewBlock, /data-am-copy-rename="suffix"[\s\S]*?data-am-copy-rename-action="suffix"[\s\S]*?加后缀/, 'rename 模式应提供批量加后缀');
    assert.match(overviewBlock, /data-am-copy-rename="find"[\s\S]*?data-am-copy-rename="replace"[\s\S]*?data-am-copy-rename-action="replace"[\s\S]*?替换/, 'rename 模式应提供批量查找替换');
    assert.match(overviewBlock, /data-am-copy-rename="deleteText"[\s\S]*?data-am-copy-rename-action="deleteText"[\s\S]*?删除文本/, 'rename 模式应提供批量删除指定文本');
    assert.match(overviewBlock, /data-am-copy-rename="sequenceBase"[\s\S]*?data-am-copy-rename="sequenceStart"[\s\S]*?data-am-copy-rename-action="sequence"[\s\S]*?按序号改名/, 'rename 模式应提供按序号改名');
    assert.match(overviewBlock, /data-am-copy-rename-action="clean"[\s\S]*?清理名称[\s\S]*?data-am-copy-rename-action="restore"[\s\S]*?恢复原名/, 'rename 模式应提供清理名称和恢复原名');
    assert.match(overviewBlock, /<th\$\{renameMode \? ' data-am-copy-mode-hidden="rename"' : ''\}>计划出价方式<\/th>[\s\S]*?<th\$\{renameMode \? ' data-am-copy-mode-hidden="rename"' : ''\}>出价价格<\/th>[\s\S]*?<th\$\{renameMode \? ' data-am-copy-mode-hidden="rename"' : ''\}>预算<\/th>/, 'rename 模式应隐藏非计划名称表头');
    assert.match(quickEntryStyle, /#am-campaign-copy-overview-popup\[data-am-copy-dialog-mode="rename"\] \[data-am-copy-mode-hidden="rename"\]\s*\{[\s\S]*?display:\s*none !important;/, 'rename 模式隐藏列应复用现有复制一览窗样式，不新增视觉系统');
    assert.match(quickEntryStyle, /#am-campaign-copy-overview-popup \.am-copy-overview-renamebar[\s\S]*?align-items:\s*flex-start;[\s\S]*?#am-campaign-copy-overview-popup \.am-copy-overview-renamebar \.am-copy-overview-bulk-group[\s\S]*?flex-wrap:\s*wrap;/, 'rename 工具条应复用复制一览窗工具条并支持换行');
    assert.match(overviewBlock, /if \(!contextReady\) \{[\s\S]*?setReadyState\(false\);[\s\S]*?\}/, '读取计划名期间应进入未就绪状态');
    assert.match(overviewBlock, /const setReadyState = \(ready,[\s\S]*?contextReady = !!ready;[\s\S]*?popup\.querySelectorAll\('input, select'\)\.forEach\(\(el\) => \{[\s\S]*?el\.disabled = !contextReady \|\| el\.dataset\.amCopyReadonly === '1';/, '未就绪时应禁用输入，避免异步补齐覆盖用户已编辑内容');
    assert.match(overviewBlock, /popup\.querySelectorAll\('\[data-am-copy-bulk-action\], \[data-am-copy-rename-action\]'\)\.forEach\(\(el\) => \{[\s\S]*?el\.disabled = !contextReady \|\| el\.dataset\.amCopyReadonly === '1';/, '读取计划名期间应禁用 rename 批处理动作');
    assert.match(overviewBlock, /const renameActionButtons = Array\.from\(popup\.querySelectorAll\('\[data-am-copy-rename-action\]'\)\)[\s\S]*?button\.addEventListener\('click'[\s\S]*?applyRenameActionToPopup\(popup,\s*button\.dataset\.amCopyRenameAction \|\| ''\)/, 'rename 批处理按钮应统一调用名称批处理 helper');
    assert.match(overviewBlock, /if \(renameMode\) \{[\s\S]*?removePopup\(\);[\s\S]*?\} else \{[\s\S]*?popup\.remove\(\);[\s\S]*?\}/, 'rename 提交成功后应移除弹窗并恢复焦点');

    assert.match(quickEntry, /getRenamePlanNameInputs\(popup\)[\s\S]*?querySelectorAll\('\[data-am-copy-field="planName"\]'\)[\s\S]*?input instanceof HTMLInputElement && !input\.disabled/, 'rename 批处理应只操作可编辑计划名称输入框');
    assert.match(quickEntry, /setRenamePlanNameInputValue\(input,\s*value = ''\)[\s\S]*?normalizeBatchRenamePlanName\(value\)[\s\S]*?dispatchEvent\(new Event\('input'[\s\S]*?dispatchEvent\(new Event\('change'/, 'rename 批处理更新名称后应派发 input/change');
    assert.match(quickEntry, /applyRenamePrefixToPopup\(popup\)[\s\S]*?`\$\{prefix\}\$\{nameInput\.value \|\| ''\}`/, '批量加前缀应写入所有计划名称');
    assert.match(quickEntry, /applyRenameSuffixToPopup\(popup\)[\s\S]*?`\$\{nameInput\.value \|\| ''\}\$\{suffix\}`/, '批量加后缀应写入所有计划名称');
    assert.match(quickEntry, /applyRenameReplaceToPopup\(popup\)[\s\S]*?split\(findText\)\.join\(replaceText\)/, '批量替换应按字面文本全量替换');
    assert.match(quickEntry, /applyRenameDeleteToPopup\(popup\)[\s\S]*?data-am-copy-rename="deleteText"[\s\S]*?applyRenameReplaceToPopup\(popup\)/, '批量删除文本应复用替换为空的逻辑');
    assert.match(quickEntry, /applyRenameSequenceToPopup\(popup\)[\s\S]*?sequenceBase[\s\S]*?sequenceStart[\s\S]*?padStart\(width,\s*'0'\)[\s\S]*?`\$\{baseName\}\$\{seq\}`/, '按序号改名应按基础名和起始序号生成名称');
    assert.match(quickEntry, /applyRenameCleanWhitespaceToPopup\(popup\)[\s\S]*?setRenamePlanNameInputValue\(nameInput,\s*nameInput\.value \|\| ''\)/, '清理名称应复用规范化名称写入');
    assert.match(restoreRenameBlock, /getAttribute\('data-original-plan-name'\)/, '恢复原名应读取 data-original-plan-name');
    assert.match(restoreRenameBlock, /setRenamePlanNameInputValue\(nameInput,\s*nameInput\.getAttribute\('data-original-plan-name'\) \|\| ''\)/, '恢复原名应写回原计划名输入框');
    assert.match(quickEntry, /applyRenameActionToPopup\(popup,\s*action = ''\)[\s\S]*?normalizedAction === 'prefix'[\s\S]*?normalizedAction === 'suffix'[\s\S]*?normalizedAction === 'replace'[\s\S]*?normalizedAction === 'deleteText'[\s\S]*?normalizedAction === 'sequence'[\s\S]*?normalizedAction === 'clean'[\s\S]*?normalizedAction === 'restore'/, 'rename 批处理 action 应覆盖前缀、后缀、替换、删除、序号、清理和恢复');

    assert.match(validateBlock, /const renameMode = String\(options\.mode \|\| ''\)\.trim\(\) === 'rename';/, '行校验应识别 rename 模式');
    assert.match(validateBlock, /return renameMode \? '没有可提交的计划名称' : '没有可提交的复制计划'/, 'rename 无行时应提示没有可提交的计划名称');
    assert.match(validateBlock, /if \(!String\(row\.planName \|\| ''\)\.trim\(\)\) return `第 \$\{lineNo\} 行计划名称不能为空`;/, 'rename 应拦截空计划名');
    assert.match(validateBlock, /if \(names\.has\(row\.planName\)\) return `计划名称重复：\$\{row\.planName\}`;/, 'rename 应拦截同次提交内重复名称');
    assert.match(validateBlock, /if \(!this\.normalizeCampaignId\(row\.campaignId \|\| ''\)\) return `第 \$\{lineNo\} 行计划ID无效`;/, 'rename 应要求每行保留计划 ID');
    assert.match(validateBlock, /if \(renameMode && changedCount <= 0\) return '没有需要修改的计划名称';/, 'rename 全部未改名时不得提交');
    assert.match(validateBlock, /if \(renameMode\) \{[\s\S]*?changedCount \+= 1;[\s\S]*?continue;[\s\S]*?\}[\s\S]*?row\.bidPrice/, 'rename 模式应跳过复制用出价和预算校验');

    assert.match(submitRenameBlock, /\.filter\(row => row\.campaignId && row\.planName && row\.planName !== row\.originalPlanName\)/, '批量改名提交前应过滤未改名行');
    assert.match(submitRenameBlock, /groupCampaignContextsByBizCode\(changedRows,\s*context\.bizCode \|\| this\.DEFAULT_BIZ_CODE\)/, '批量改名应按 bizCode 分组提交');
    assert.match(submitRenameBlock, /this\.resolveAuthContext\(bizCode \|\| context\.bizCode \|\| this\.DEFAULT_BIZ_CODE\)/, '批量改名每个业务线分组应使用对应 authContext');
    assert.match(submitRenameBlock, /refreshCampaignListOnly\(\{[\s\S]*?reason:\s*'批量修改计划名称'/, '批量改名成功后应局部刷新计划列表');
    assert.match(updateNameBlock, /campaign\/updatePart\.json\?\$\{query\.toString\(\)\}/, '批量改名应调用原生 campaign/updatePart.json');
    assert.match(updateNameBlock, /campaignList:\s*normalizedRows\.map\(row => \(\{[\s\S]*?campaignId:\s*Number\(row\.campaignId\),[\s\S]*?campaignName:\s*row\.campaignName[\s\S]*?\}\)\)/, '批量改名 payload 只应提交 campaignId 和 campaignName');
    assert.match(updateNameBlock, /bizCode:\s*targetBizCode,[\s\S]*?csrfId:[\s\S]*?strategyRecoverys:\s*\[\],[\s\S]*?loginPointId:[\s\S]*?lrsIdList:\s*\[\]/, '批量改名 payload 应保持 updatePart 状态接口同款基础合同');
    assert.doesNotMatch(updateNameBlock, /bidPrice|budgetValue|dayBudget|dayAverageBudget|displayStatus/, '批量改名 payload 不应混入出价、预算或状态字段');
});

test('批量+ 不重复原生已有批量计划设置项', () => {
    const menuBlock = getQuickEntryMethodSlice('getBatchPlusMenuItems', 'closeBatchPlusMenu');
    const dispatchBlock = getQuickEntryMethodSlice('async runBatchPlusAction', 'normalizeCampaignId');
    const nativeLabels = [
        '批量修改每日预算',
        '批量修改投放资源位',
        '批量修改投放地域',
        '批量修改分时折扣',
        '批量修改出价',
        '批量调整计划组'
    ];

    nativeLabels.forEach((label) => {
        assert.doesNotMatch(menuBlock, new RegExp(label), `批量+ 菜单不得重复原生入口：${label}`);
    });
    assert.doesNotMatch(menuBlock, /nativeBatchPlanItems|getNativeBatchPlanSettingActionMetas/, '批量+ 菜单不得再批量接入原生批量计划设置元数据');
    assert.doesNotMatch(dispatchBlock, /getNativeBatchPlanSettingActionMeta|runNativeBatchPlanSettingAction/, '批量+ 动作分发不得再委托原生已有批量计划设置项');
    assert.doesNotMatch(quickEntry, /getNativeBatchPlanSettingActionMetas|getNativeBatchPlanSettingActionMeta|runNativeBatchPlanSettingAction|findNativeBatchPlanSettingHost|triggerNativeBatchPlanSettingMenu|findNativeBatchPlanMenuItem|dispatchNativeMouseClick/, '原生已有批量计划设置委托 helper 应从插件增强路径移除');
    assert.doesNotMatch(quickEntry, /action:\s*'nativeDailyBudget'|action:\s*'nativeAdzone'|action:\s*'nativeLaunchArea'|action:\s*'nativeLaunchPeriod'|action:\s*'nativeBidPrice'|action:\s*'nativeCampaignGroup'/, '批量+ 不应保留原生已有入口 action');
});

test('批量+ 成功后复用原生计划列表刷新而不整页 reload', () => {
    assert.match(quickEntry, /findCampaignListVframe\(magixRef = null,\s*bizCode = ''\)[\s\S]*?expectedViewPath = `onebp\/views\/pages\/manage\/\$\{listPath\}\/campaign-list`/, '应按当前业务线定位官方计划列表 VFrame');
    assert.match(quickEntry, /refreshCampaignListVframe\(bizCode = ''\)[\s\S]*?const methods = \['render',\s*'asyncRenderData'\][\s\S]*?vf\.invoke\(method,\s*\[\]\)/, '局部刷新应优先复用官方列表 render 以重新拉取 findPage 列表');
    assert.match(quickEntry, /triggerCampaignListSearchRefresh\(\)[\s\S]*?findCopySuccessPlanNameSearchInput\(\)[\s\S]*?dispatchCopySuccessSearchEnter\(input\)/, '局部刷新应可触发原生列表搜索框回车刷新');
    assert.match(quickEntry, /refreshCampaignListOnlyNow\(\{ bizCode = '',\s*reason = '批量操作' \} = \{\}\)[\s\S]*?refreshCampaignListVframe\(targetBizCode\)[\s\S]*?vframeTriggered \? false : this\.triggerCampaignListSearchRefresh\(\)/, '成功收尾应优先刷新列表 VFrame，找不到时再回车触发搜索刷新');
    assert.match(quickEntry, /campaignListRefreshTimer:\s*null,/, '批量+成功收尾刷新 timer 缺少可清理句柄');
    assert.match(quickEntry, /clearCampaignListRefreshTimer\(\)\s*\{[\s\S]*?if \(!this\.campaignListRefreshTimer\) return;[\s\S]*?window\.clearTimeout\(this\.campaignListRefreshTimer\);[\s\S]*?this\.campaignListRefreshTimer = null;[\s\S]*?\}/, '批量+成功收尾刷新 timer 应支持显式清理并归零');
    assert.match(quickEntry, /scheduleCampaignListRefresh\(options = \{\}\)\s*\{[\s\S]*?this\.clearCampaignListRefreshTimer\(\);[\s\S]*?const delay = Number\.isFinite\(Number\(options\?\.delay\)\) \? Number\(options\.delay\) : 600;[\s\S]*?this\.campaignListRefreshTimer = window\.setTimeout\(\(\) => \{[\s\S]*?this\.campaignListRefreshTimer = null;[\s\S]*?this\.refreshCampaignListOnlyNow\(options\)\.catch/, '成功收尾应复用可取消的延迟刷新调度');
    assert.match(quickEntry, /refreshCampaignListOnly\(options = \{\}\)\s*\{\s*this\.scheduleCampaignListRefresh\(options\);\s*\}/, 'refreshCampaignListOnly 应只委托刷新调度 helper');
    assert.doesNotMatch(quickEntry, /refreshCampaignListOnly\(options = \{\}\)\s*\{[\s\S]*?window\.setTimeout\(\(\) => \{[\s\S]*?refreshCampaignListOnlyNow\(options\)/, '成功收尾不应继续排无句柄延迟刷新 timeout');
    assert.doesNotMatch(quickEntry, /window\.location\.reload\(\)/, '批量+ 成功收尾不得再整页刷新');
});

test('人群推广屏蔽人群与人群设置走官方接口且不跳转', () => {
    assert.match(quickEntry, /getBatchPlusMenuItems\(bizCode = ''\)[\s\S]*?isDisplayScene[\s\S]*?打开官方编辑过滤人群弹窗并批量同步屏蔽人群[\s\S]*?打开官方批量编辑人群抽屉/, '人群推广菜单 title 应指向官方编辑弹窗/官方抽屉');
    assert.match(quickEntry, /runDisplayBatchCrowdAction\(action = '',\s*contexts = \[\]\)/, '缺少人群推广专用批量动作分发');
    assert.match(quickEntry, /runBatchPlusAction\(action = '',\s*bizCode = '',\s*triggerEl = null\)[\s\S]*?normalizedBizCode === 'onebpDisplay'[\s\S]*?runDisplayBatchCrowdAction\(action,\s*contexts,\s*normalizedBizCode\)/, '人群推广人群类动作应先进入专用官方接口流程');
    assert.match(quickEntry, /findDisplayBlackCrowdList\(campaignId,\s*authContext = \{\}\)[\s\S]*?blackCrowd\/findList\.json\?\$\{query\.toString\(\)\}[\s\S]*?crowdBindQueryList:\s*\[\{[\s\S]*?campaignId:\s*String\(id\)/, '批量修改屏蔽人群应读取官方编辑过滤人群数据');
    assert.match(quickEntry, /modifyDisplayBlackCrowdList\(campaignId,\s*crowdList = \[\],\s*authContext = \{\}\)[\s\S]*?blackCrowd\/batchModify\.json\?\$\{query\.toString\(\)\}[\s\S]*?crowdList:\s*this\.prepareBlackCrowdListForCampaign\(crowdList,\s*id\)/, '批量修改屏蔽人群应调用官方 batchModify 接口提交');
    assert.match(quickEntry, /deleteDisplayBlackCrowdList\(campaignId,\s*crowdList = \[\],\s*authContext = \{\}\)[\s\S]*?blackCrowd\/batchDelete\.json\?\$\{query\.toString\(\)\}/, '批量修改屏蔽人群移除项应调用官方 batchDelete 接口');
    assert.match(quickEntry, /openDisplayBlackCrowdEditorModal\(\{[\s\S]*?filterCodes:\s*\['campaignCrowdFilterList'\]/, '官方编辑弹窗应只展示过滤人群组件');
    assert.match(quickEntry, /openDisplayBlackCrowdEditorModal\(\{[\s\S]*?vf\.invoke\('mxModal',\s*\['onebp\/views\/pages\/manage\/campaign\/info'/, '批量修改屏蔽人群应调用官方 campaign/info 弹窗');
    assert.match(quickEntry, /openDisplayBlackCrowdEditorModal\(\{[\s\S]*?title:\s*'编辑过滤人群'/, '批量修改屏蔽人群弹窗标题应与官方一致');
    assert.match(quickEntry, /const enterCallback = async \(payload = \{\}\) => \{[\s\S]*?extractDialogBlackCrowdList\(payload\)[\s\S]*?syncDisplayBlackCrowdListForCampaign/, '官方弹窗提交回调应批量同步选中计划');
    assert.match(quickEntry, /openDisplayBlackCrowdEditorModal\(\{[\s\S]*?const results = \[\];[\s\S]*?for \(const id of ids\)[\s\S]*?syncDisplayBlackCrowdListForCampaign/, '人群推广批量提交应逐个计划同步并等待回查完成');
    const displayBlackCrowdModalBlock = quickEntry.slice(
        quickEntry.indexOf('openDisplayBlackCrowdEditorModal({'),
        quickEntry.indexOf('openLeadBlackCrowdEditorModal({')
    );
    assert.doesNotMatch(displayBlackCrowdModalBlock, /Promise\.allSettled\(ids\.map/, '人群推广批量修改屏蔽人群不得并发提交后漏掉逐个回查');
    assert.match(quickEntry, /syncDisplayBlackCrowdListForCampaign\(campaignId,\s*newCrowdList = \[\],[\s\S]*?verifyDisplayBlackCrowdListSynced\(id,\s*newCrowdList,\s*authContext\)/, '人群推广提交后必须回查过滤人群是否真实落库');
    assert.match(quickEntry, /verifyBlackCrowdListSynced\(fetchCurrent,\s*campaignId,[\s\S]*?过滤人群未确认落库/, '过滤人群回查失败时不得误报成功');
    assert.match(quickEntry, /vf\.invoke\('mxModal'[\s\S]*?enterCallback/, '官方弹窗提交回调应传入 mxModal');
    assert.match(quickEntry, /getPageMagix\(\)[\s\S]*?window\.seajs\.use\(\['magix'\]/, '打开官方弹窗应复用页面 Magix/seajs 环境');
    assert.match(quickEntry, /findMagixModalVframe\(magixRef = null\)[\s\S]*?universalBP_common_layout_main_content_display_campaign_list[\s\S]*?view\.mxModal/, '应优先使用官方页面 VFrame 的 mxModal 宿主');
    assert.match(quickEntry, /isDisplayBlackCrowdEditorDialogOpen\(\)[\s\S]*?编辑过滤人群[\s\S]*?设置过滤人群[\s\S]*?确定[\s\S]*?取消/, '打开后应检测官方编辑过滤人群弹窗');
    const shieldCrowdBlock = quickEntry.slice(
        quickEntry.indexOf('async runDisplayBatchShieldCrowd'),
        quickEntry.indexOf('async runDisplayBatchCrowdAction')
    );
    assert.doesNotMatch(shieldCrowdBlock, /openBatchPlusConfirmDialog/, '批量修改屏蔽人群不得再用自定义确认框替代官方弹窗');
    assert.match(quickEntry, /findDisplayCampaignListVframe\(magixRef = null\)[\s\S]*?universalBP_common_layout_main_content_display_campaign_list[\s\S]*?onebp\/views\/pages\/manage\/display\/campaign-list/, '批量人群设置应定位计划列表 VFrame 作为官方抽屉宿主');
    assert.match(quickEntry, /getDisplayBatchCrowdCampaignIdList\(contexts = \[\]\)[\s\S]*?Number\.isSafeInteger\(numericId\) \? numericId : String\(id\)/, '批量人群设置应把选中计划 ID 转为官方 campaignIdList');
    assert.match(quickEntry, /buildDisplayBatchCrowdModalParams\(vf = null,\s*campaignIdList = \[\]\)[\s\S]*?campaignIdList,[\s\S]*?tab:\s*'crowd'/, '批量人群设置应直接构造官方人群 tab 参数');
    assert.match(quickEntry, /getDisplayBatchCrowdModalOptions\(\)[\s\S]*?title:\s*'批量编辑人群'[\s\S]*?full:\s*true/, '批量人群设置应使用官方全屏抽屉样式');
    assert.match(quickEntry, /openDisplayNativeBatchCrowdDrawer\(contexts = \[\]\)[\s\S]*?findDisplayCampaignListVframe\(magixRef\)[\s\S]*?vf\.invoke\('mxModal',\s*\[[\s\S]*?'onebp\/views\/pages\/manage\/campaign\/batch-show'[\s\S]*?getDisplayBatchCrowdModalOptions\(\)/, '批量人群设置应直接打开官方批量编辑人群抽屉');
    const displayCrowdDrawerBlock = quickEntry.slice(
        quickEntry.indexOf('async openDisplayNativeBatchCrowdDrawer'),
        quickEntry.indexOf('async runDisplayBatchShieldCrowd')
    );
    assert.doesNotMatch(displayCrowdDrawerBlock, /findNativeBatchPlanSettingHost|triggerNativeBatchPlanSettingMenu|findNativeBatchPlanMenuItem|dispatchNativeMouseClick/, '批量人群设置不得再通过官方批量计划设置菜单中转');
    assert.match(quickEntry, /isDisplayNativeBatchCrowdDrawerOpen\(\)[\s\S]*?批量编辑人群[\s\S]*?添加人群[\s\S]*?批量修改状态/, '批量人群设置点击后应检测官方批量编辑人群抽屉');
    const displayCrowdActionBlock = quickEntry.slice(
        quickEntry.indexOf('async runDisplayBatchCrowdAction'),
        quickEntry.indexOf('getNativeBatchActionPatterns')
    );
    assert.doesNotMatch(displayCrowdActionBlock, /window\.open|buildCampaignDetailUrl/, '人群推广官方人群动作不得跳转详情页');
    assert.match(quickEntry, /runBatchOpenNativeAction\(action = '',\s*contexts = \[\],\s*fallbackBizCode = ''\)[\s\S]*?buildCampaignDetailUrl/, '关键词等未确认业务线仍保留原保守兜底');
});

test('线索推广屏蔽人群走官方编辑弹窗且不跳转', () => {
    assert.match(quickEntry, /getBatchPlusMenuItems\(bizCode = ''\)[\s\S]*?isLeadScene[\s\S]*?打开官方编辑过滤人群弹窗并批量同步屏蔽人群/, '线索推广菜单 title 应指向官方编辑弹窗');
    assert.match(quickEntry, /findLeadCampaign\(campaignId,\s*authContext = \{\}\)[\s\S]*?campaign\/get\.json\?\$\{query\.toString\(\)\}[\s\S]*?bizCode:\s*'onebpAdStrategyLiuZi'/, '线索推广应读取官方 campaign/get 以复用详情页完整 campaign 参数');
    assert.match(quickEntry, /findLeadBlackCrowdList\(campaignId,\s*authContext = \{\}\)[\s\S]*?blackCrowd\/findList\.json\?\$\{query\.toString\(\)\}[\s\S]*?bizCode:\s*'onebpAdStrategyLiuZi'[\s\S]*?crowdBindQueryList:\s*\[\{[\s\S]*?campaignId:\s*String\(id\)/, '线索推广批量修改屏蔽人群应读取官方过滤人群数据');
    assert.match(quickEntry, /modifyLeadBlackCrowdList\(campaignId,\s*crowdList = \[\],\s*authContext = \{\}\)[\s\S]*?blackCrowd\/batchModify\.json\?\$\{query\.toString\(\)\}[\s\S]*?mx_bizCode:\s*'onebpAdStrategyLiuZi'[\s\S]*?crowdList:\s*this\.prepareLeadBlackCrowdListForCampaign\(crowdList,\s*id\)/, '线索推广提交应调用官方 batchModify 并保持线索 bizCode');
    assert.match(quickEntry, /deleteLeadBlackCrowdList\(campaignId,\s*crowdList = \[\],\s*authContext = \{\}\)[\s\S]*?blackCrowd\/batchDelete\.json\?\$\{query\.toString\(\)\}/, '线索推广移除过滤人群应调用官方 batchDelete');
    assert.match(quickEntry, /openLeadBlackCrowdEditorModal\(\{[\s\S]*?sourceCampaign\.campaignBizCode = 'onebpAdStrategyLiuZi'[\s\S]*?filterCodes:\s*\['campaignCrowdFilterList'\]/, '线索推广应补齐 campaignBizCode 并只展示过滤人群组件');
    assert.match(quickEntry, /openLeadBlackCrowdEditorModal\(\{[\s\S]*?vf\.invoke\('mxModal',\s*\['onebp\/views\/pages\/manage\/campaign\/info'/, '线索推广应复用官方 campaign/info 弹窗');
    assert.match(quickEntry, /openLeadBlackCrowdEditorModal\(\{[\s\S]*?title:\s*'编辑过滤人群'/, '线索推广弹窗标题应与官方详情页一致');
    assert.match(quickEntry, /runLeadBatchShieldCrowd\(contexts = \[\]\)[\s\S]*?Promise\.all\(\[[\s\S]*?findLeadBlackCrowdList\(sourceId,\s*authContext\)[\s\S]*?findLeadCampaign\(sourceId,\s*authContext\)[\s\S]*?openLeadBlackCrowdEditorModal/, '线索推广执行路径应先读取官方数据再打开弹窗');
    assert.match(quickEntry, /openLeadBlackCrowdEditorModal\(\{[\s\S]*?const results = \[\];[\s\S]*?for \(const id of ids\)[\s\S]*?syncLeadBlackCrowdListForCampaign/, '线索推广批量提交应逐个计划同步并等待回查完成');
    const leadBlackCrowdModalBlock = quickEntry.slice(
        quickEntry.indexOf('openLeadBlackCrowdEditorModal({'),
        quickEntry.indexOf('async runDisplayBatchShieldCrowd')
    );
    assert.doesNotMatch(leadBlackCrowdModalBlock, /Promise\.allSettled\(ids\.map/, '线索推广批量修改屏蔽人群不得并发提交后漏掉逐个回查');
    assert.match(quickEntry, /syncLeadBlackCrowdListForCampaign\(campaignId,\s*newCrowdList = \[\],[\s\S]*?verifyLeadBlackCrowdListSynced\(id,\s*newCrowdList,\s*authContext\)/, '线索推广提交后也必须回查过滤人群是否真实落库');
    assert.match(quickEntry, /runBatchPlusAction\(action = '',\s*bizCode = '',\s*triggerEl = null\)[\s\S]*?normalizedBizCode === 'onebpAdStrategyLiuZi' && action === 'shieldCrowd'[\s\S]*?runLeadBatchShieldCrowd\(contexts\)/, '批量+ shieldCrowd 在线索推广应进入专用官方弹窗流程');
    const leadShieldBlock = quickEntry.slice(
        quickEntry.indexOf('async runLeadBatchShieldCrowd'),
        quickEntry.indexOf('async runDisplayBatchCrowdAction')
    );
    assert.doesNotMatch(leadShieldBlock, /window\.open|buildCampaignDetailUrl|runBatchOpenNativeAction/, '线索推广批量修改屏蔽人群不得再跳转详情页或只点行入口');
});
