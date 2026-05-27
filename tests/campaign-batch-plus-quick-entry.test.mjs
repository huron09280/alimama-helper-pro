import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (relativePath) => readFileSync(new URL(`../${relativePath}`, import.meta.url), 'utf8');

const quickEntry = read('src/main-assistant/campaign-id-quick-entry.js');
const quickEntryStyle = read('src/main-assistant/ui.js');

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

test('批量+ 菜单覆盖批量计划设置缺失的首批能力', () => {
    assert.match(quickEntry, /getBatchPlusMenuItems\(bizCode = ''\)[\s\S]*?label:\s*'批量开启'/, '菜单缺少批量开启');
    assert.match(quickEntry, /getBatchPlusMenuItems\(bizCode = ''\)[\s\S]*?label:\s*'批量暂停'/, '菜单缺少批量暂停');
    assert.match(quickEntry, /getBatchPlusMenuItems\(bizCode = ''\)[\s\S]*?label:\s*'批量删除'/, '菜单缺少批量删除');
    assert.match(quickEntry, /getBatchPlusMenuItems\(bizCode = ''\)[\s\S]*?label:\s*'批量修改屏蔽人群'/, '菜单缺少批量修改屏蔽人群');
    assert.match(quickEntry, /getBatchPlusMenuItems\(bizCode = ''\)[\s\S]*?label:\s*'批量人群设置'/, '菜单缺少批量人群设置');
    assert.match(quickEntry, /showBatchPlusMenu\(triggerEl\)[\s\S]*?className = 'mxgc-popmenu am-campaign-batch-plus-native-menu'[\s\S]*?setAttribute\('role',\s*'menu'\)[\s\S]*?data-am-campaign-batch-plus-action/, '批量+应渲染原生 popmenu 类菜单项');
    assert.match(quickEntry, /showBatchPlusMenu\(triggerEl\)[\s\S]*?menu\.style\.minWidth = `\$\{Math\.max\(120,\s*Math\.round\(rect\.width\)\)\}px`/, '批量+弹层宽度应跟随原生按钮宽度');
    assert.match(quickEntry, /getConnectedBatchPlusMenu\(\)[\s\S]*?storedMenu instanceof HTMLElement && storedMenu\.isConnected[\s\S]*?this\.batchPlusMenuEl = null/, '批量+应清理已脱离 DOM 的旧菜单状态，避免 hover 被误判为已打开');
    assert.match(quickEntry, /document\.addEventListener\('mouseover'[\s\S]*?showBatchPlusMenu\(trigger\)/, '批量+应和原生 popmenu 一样鼠标移入即弹出菜单');
    assert.match(quickEntry, /document\.addEventListener\('mouseover'[\s\S]*?const trigger = target\.closest\('\[data-am-campaign-batch-plus="1"\]'\)/, '批量+ hover 必须兼容鼠标落在内部 button/span 上的真实目标');
    assert.match(quickEntry, /document\.addEventListener\('mouseout'[\s\S]*?scheduleBatchPlusMenuClose\(\)/, '批量+鼠标移出按钮和菜单后应延迟关闭');
    assert.match(quickEntry, /isInsideOpenBatchPlusSurface\(node\)[\s\S]*?menu\.contains\(node\)[\s\S]*?trigger\.contains\(node\)/, '批量+菜单内移动不得误关闭弹层');
    assert.match(quickEntry, /const batchPlusItem = target\.closest\('\[data-am-campaign-batch-plus-action\]'\)/, '缺少批量+菜单项点击入口');
    assert.match(quickEntry, /const batchPlusBtn = target\.closest\('\[data-am-campaign-batch-plus="1"\]'\)/, '缺少批量+按钮点击入口');
    assert.match(quickEntryStyle, /#am-campaign-batch-plus-menu\s*\{[\s\S]*?min-width:\s*120px;[\s\S]*?box-shadow:/, '批量+菜单应按原生 popmenu 尺寸渲染');
    assert.match(quickEntryStyle, /#am-campaign-batch-plus-menu \.am-campaign-batch-plus-item\.is-danger/, '批量删除菜单项应有危险态样式');
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
    assert.match(quickEntry, /getBatchStatusActionMeta\(action = ''\)[\s\S]*?normalized === 'start'[\s\S]*?onlineStatus:\s*1[\s\S]*?label:\s*'批量开启'/, '批量开启应映射到 onlineStatus=1');
    assert.match(quickEntry, /getBatchStatusActionMeta\(action = ''\)[\s\S]*?normalized === 'pause'[\s\S]*?onlineStatus:\s*0[\s\S]*?label:\s*'批量暂停'/, '批量暂停应映射到 onlineStatus=0');
    assert.match(quickEntry, /runBatchUpdateCampaignStatus\(action = '',\s*contexts = \[\],\s*fallbackBizCode = ''\)/, '缺少批量状态执行函数');
    assert.match(quickEntry, /openBatchPlusConfirmDialog\(\{[\s\S]*?title:\s*`确认\$\{meta\.verb\}计划`[\s\S]*?message:\s*`确认\$\{meta\.verb\}选中的 \$\{ids\.length\} 个\$\{sceneName\}计划/, '批量开启/暂停前必须二次确认');
    assert.match(quickEntry, /updateCampaignStatusBatchByBiz\(campaignIds = \[\],\s*bizCode,\s*onlineStatus,\s*authContext\)[\s\S]*?campaign\/updatePart\.json\?\$\{query\.toString\(\)\}[\s\S]*?displayStatus:\s*status === 1 \? 'start' : 'pause'/, '批量开启/暂停应调用原生 campaign/updatePart.json 并写 displayStatus');
    assert.match(quickEntry, /runBatchUpdateCampaignStatus\(action = '',[\s\S]*?updateCampaignStatusBatchByBiz\(list\.map\(item => item\.campaignId\),\s*bizCode,\s*meta\.onlineStatus,\s*authContext\)/, '批量状态执行应按业务线分组调用状态接口');
    assert.match(quickEntry, /runBatchPlusAction\(action = '',\s*bizCode = '',\s*triggerEl = null\)[\s\S]*?if \(action === 'start' \|\| action === 'pause'\)[\s\S]*?runBatchUpdateCampaignStatus\(action,\s*contexts,\s*normalizedBizCode\)/, '批量+ start/pause 动作应接入状态流程');
    assert.match(quickEntry, /window\.setTimeout\(\(\) => window\.location\.reload\(\),\s*600\)/, '批量状态变更成功后应刷新列表');
});

test('批量删除使用原生删除接口且有二次确认', () => {
    assert.match(quickEntry, /deleteCampaignsBatchByBiz\(campaignIds = \[\],\s*bizCode = '',\s*authContext = \{\}\)/, '缺少批量删除执行函数');
    assert.match(quickEntry, /campaign\/delete\.json\?\$\{query\.toString\(\)\}/, '批量删除应调用原生 campaign/delete.json');
    assert.match(quickEntry, /campaignIdList:\s*normalizedIds\.map\(id => Number\(id\)\)/, '批量删除应提交 campaignIdList');
    assert.match(quickEntry, /openBatchPlusConfirmDialog\(\{[\s\S]*?title:\s*'确认删除计划'[\s\S]*?message:\s*`确认删除选中的 \$\{ids\.length\} 个\$\{sceneName\}计划/, '批量删除前必须二次确认');
    assert.doesNotMatch(quickEntry, /window\.confirm\(/, '批量删除不得使用浏览器原生 confirm');
    assert.match(quickEntry, /runBatchPlusAction\(action = '',\s*bizCode = '',\s*triggerEl = null\)[\s\S]*?if \(action === 'delete'\)[\s\S]*?runBatchDeleteCampaigns/, '批量+ delete 动作应接入删除流程');
    assert.match(quickEntry, /window\.setTimeout\(\(\) => window\.location\.reload\(\),\s*600\)/, '批量删除成功后应刷新列表');
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
    assert.match(quickEntry, /runBatchOpenNativeAction\(action = '',\s*contexts = \[\],\s*fallbackBizCode = ''\)[\s\S]*?buildCampaignDetailUrl/, '关键词/线索等未确认业务线仍保留原保守兜底');
});
