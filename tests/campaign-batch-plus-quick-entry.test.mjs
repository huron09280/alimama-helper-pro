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
    assert.match(quickEntry, /const focusBackTarget = this\.getOpenBatchPlusTrigger\(\)[\s\S]*?this\.closeBatchPlusMenu\(\)[\s\S]*?this\.runBatchPlusAction\(action,\s*bizCode,\s*focusBackTarget \|\| batchPlusItem\)/, '点击菜单项后应在菜单移除前记录批量+触发器用于确认窗关闭回焦');
    assert.match(quickEntry, /const batchPlusBtn = target\.closest\('\[data-am-campaign-batch-plus="1"\]'\)/, '缺少批量+按钮点击入口');
    assert.match(quickEntryStyle, /#am-campaign-batch-plus-menu\s*\{[\s\S]*?min-width:\s*120px;[\s\S]*?box-shadow:/, '批量+菜单应按原生 popmenu 尺寸渲染');
    assert.match(quickEntryStyle, /#am-campaign-batch-plus-menu \.am-campaign-batch-plus-item\.is-danger/, '批量删除菜单项应有危险态样式');
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
