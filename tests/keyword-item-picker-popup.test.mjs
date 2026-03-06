import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../阿里妈妈多合一助手.js', import.meta.url), 'utf8');

function getToggleCandidateHandlerBlock() {
  const start = source.indexOf('wizardState.els.toggleCandidateBtn.onclick = () => {');
  const end = source.indexOf('wizardState.els.toggleCandidateListBtn.onclick = () => {', start);
  assert.ok(start > -1 && end > start, '无法定位“添加商品”按钮事件处理代码');
  return source.slice(start, end);
}

test('关键词向导“添加商品”按钮保持为弹窗入口', () => {
  assert.match(source, /const openKeywordItemPickerPopup = \(\) => \{/, '缺少“添加商品”弹窗函数 openKeywordItemPickerPopup');
  const handlerBlock = getToggleCandidateHandlerBlock();
  assert.match(handlerBlock, /openKeywordItemPickerPopup\(\);/, '“添加商品”按钮未触发弹窗打开');
  assert.doesNotMatch(handlerBlock, /const nextExpanded = wizardState\.itemSplitExpanded !== true;/, '“添加商品”按钮不应切回内联展开');
});

test('商品弹窗改为承载整个商品 split，并保留主向导静态镜像', () => {
  assert.match(source, /const createItemSplitShadow = \(itemSplit\) => \{/, '缺少商品区静态镜像函数 createItemSplitShadow');
  assert.match(source, /const shadow = itemSplit\.cloneNode\(true\);/, '静态镜像未克隆整个商品区');
  assert.match(source, /shadow\.setAttribute\('data-am-wxt-item-picker-shadow', '1'\);/, '静态镜像缺少阴影标记');
  assert.match(source, /shadow\.querySelectorAll\('\[id\]'\)\.forEach\(\(node\) => \{[\s\S]*?node\.removeAttribute\('id'\);[\s\S]*?\}\);/, '静态镜像未移除重复 id');
  assert.match(source, /const itemSplit = wizardState\?\.els\?\.itemSplit;/, '弹窗未读取整个商品 split');
  assert.match(source, /const splitPanelWidth = Math\.round\(itemSplit\.getBoundingClientRect\(\)\.width \|\| 0\);/, '弹窗未按整个商品区宽度计算尺寸');
  assert.match(source, /itemSplit\.parentNode\.insertBefore\(placeholder, itemSplit\);/, '弹窗打开前未保留商品区插入点');
  assert.match(source, /itemSplit\.parentNode\.insertBefore\(itemSplitShadow, itemSplit\);/, '弹窗打开前未保留主向导商品区镜像');
  assert.match(source, /panelHost\.appendChild\(itemSplit\);/, '弹窗未承载整个商品区');
  assert.match(source, /setItemSplitExpanded\(true\);/, '弹窗打开后未展开完整商品区');
  assert.match(source, /placeholder\.parentNode\.insertBefore\(itemSplit, placeholder\);/, '关闭弹窗时未恢复商品区');
  assert.match(source, /itemSplitShadow\.parentNode\.removeChild\(itemSplitShadow\);/, '关闭弹窗时未移除静态镜像');
  assert.match(source, /wizardState\.addedItems = initialAddedItemsSnapshot\.map\(item => deepClone\(item\)\);/, '取消弹窗时未回滚已选商品快照');
});

test('商品弹窗仅保留候选商品左列', () => {
  assert.match(source, /#am-wxt-keyword-item-picker-mask \.am-wxt-split \{[\s\S]*?display: grid;[\s\S]*?grid-template-columns: minmax\(0, 1fr\);/, '商品弹窗应改为单列候选布局');
  assert.match(source, /#am-wxt-keyword-item-picker-mask \.am-wxt-split > \.am-wxt-panel:nth-child\(1\) \{[\s\S]*?display: flex;/, '商品弹窗左列未保持展示');
  assert.match(source, /#am-wxt-keyword-item-picker-mask \.am-wxt-split > \.am-wxt-panel:nth-child\(2\) \{[\s\S]*?display: none;/, '商品弹窗右列“已添加商品”未隐藏');
  assert.match(source, /#am-wxt-keyword-item-picker-mask \.am-wxt-keyword-item-picker-dialog \{[\s\S]*?min-height: min\(310px, calc\(100vh - 80px\)\);/, '商品弹窗整体未设置最小高度');
  assert.match(source, /#am-wxt-keyword-item-picker-mask \.am-wxt-keyword-item-picker-host > #am-wxt-keyword-item-split \{[\s\S]*?height: 100%;/, '商品弹窗 split 未撑满宿主高度');
  assert.match(source, /#am-wxt-keyword-item-picker-mask \.am-wxt-panel \{[\s\S]*?height: 100%;[\s\S]*?min-height: 310px;/, '商品弹窗候选列高度未跟随容器');
  assert.match(source, /#am-wxt-keyword-item-picker-mask \.am-wxt-panel-candidate \{[\s\S]*?min-height: 310px;/, '商品弹窗缺少候选面板样式映射');
});

test('商品区与列表高度改为自适应', () => {
  assert.match(source, /#am-wxt-keyword-item-split \{[\s\S]*?height: auto;[\s\S]*?min-height: 0;[\s\S]*?overflow: hidden;/, '商品 split 未改为内层滚动承载');
  assert.match(source, /#am-wxt-keyword-item-split > \.am-wxt-panel \{[\s\S]*?min-height: 0;/, '商品 split 子面板未允许内部滚动收缩');
  assert.match(source, /#am-wxt-keyword-candidate-list \{[\s\S]*?flex: 1 1 auto;[\s\S]*?height: auto;[\s\S]*?max-height: none;/, '主向导候选列表未改为高度自适应');
  assert.match(source, /#am-wxt-keyword-added-list \{[\s\S]*?flex: 0 0 auto;[\s\S]*?height: 168px;[\s\S]*?max-height: 168px;/, '主向导已添加列表未设置固定高度');
  assert.match(source, /#am-wxt-keyword-item-split\.candidate-list-expanded #am-wxt-keyword-added-list \{[\s\S]*?flex: 1 1 auto;[\s\S]*?height: auto;[\s\S]*?max-height: none;/, '主向导展开已选后未恢复自动高度');
  assert.match(source, /#am-wxt-keyword-modal \.am-wxt-list \{[\s\S]*?min-height: 0;[\s\S]*?overscroll-behavior: contain;/, '主向导列表容器未补齐滚动承载能力');
  assert.match(source, /#am-wxt-keyword-item-picker-mask \.am-wxt-keyword-item-picker-body \{[\s\S]*?overflow: hidden;[\s\S]*?display: flex;[\s\S]*?flex-direction: column;/, '商品弹窗 body 未关闭外层整体滚动');
  assert.match(source, /#am-wxt-keyword-item-picker-mask \.am-wxt-keyword-item-picker-host \{[\s\S]*?display: flex;[\s\S]*?flex: 1 1 auto;[\s\S]*?overflow: hidden;/, '商品弹窗 host 未改为内层滚动容器');
  assert.match(source, /#am-wxt-keyword-item-picker-mask \.am-wxt-keyword-item-picker-host > #am-wxt-keyword-item-split \{[\s\S]*?flex: 1 1 auto;[\s\S]*?overflow: hidden;/, '商品弹窗 split 未关闭整体滚动');
  assert.match(source, /#am-wxt-keyword-item-picker-mask \.am-wxt-split > \.am-wxt-panel \{[\s\S]*?min-height: 0;/, '商品弹窗子面板未允许内部滚动收缩');
  assert.match(source, /#am-wxt-keyword-item-picker-mask #am-wxt-keyword-candidate-list \{[\s\S]*?flex: 1 1 auto;[\s\S]*?height: auto;[\s\S]*?max-height: none;/, '商品弹窗候选列表未改为高度自适应');
  assert.match(source, /#am-wxt-keyword-item-picker-mask \.am-wxt-list \{[\s\S]*?min-height: 0;[\s\S]*?overscroll-behavior: contain;/, '商品弹窗列表容器未补齐滚动承载能力');
  assert.doesNotMatch(source, /#am-wxt-keyword-item-picker-mask #am-wxt-keyword-candidate-list \{[\s\S]*?height: 222px;/, '商品弹窗候选列表仍保留固定高度');
});

test('关键词向导主页面已添加列表使用固定高度，不做延时或测量调整', () => {
  assert.match(source, /const syncItemPickerAddedListViewport = \(\) => \{/, '缺少商品弹窗已添加列表视口同步函数');
  assert.match(source, /const keywordModal = addedListEl\.closest\('#am-wxt-keyword-modal'\);/, '已添加列表视口同步未覆盖关键词向导主页面');
  assert.match(source, /if \(!\(keywordModal instanceof HTMLElement\)\) \{[\s\S]*?addedListEl\.style\.removeProperty\('visibility'\);[\s\S]*?return;[\s\S]*?\}/, '已添加列表视口同步应仅在关键词向导主页面生效');
  assert.match(source, /if \(wizardState\.candidateListExpanded === true \|\| wizardState\.addedItems\.length <= 0\) \{[\s\S]*?clearCompactViewport\(\);[\s\S]*?return;[\s\S]*?\}/, '展开已选后未恢复更高可见区域');
  assert.match(source, /const compactHeight = 168;/, '主页面已添加列表未使用固定高度');
  assert.match(source, /addedListEl\.style\.height = `\$\{compactHeight\}px`;/, '已添加列表未按固定高度设置 height');
  assert.match(source, /addedListEl\.style\.maxHeight = `\$\{compactHeight\}px`;/, '已添加列表未按固定高度设置 max-height');
  assert.doesNotMatch(source, /const visibleCount = Math\.min\(3, wizardState\.addedItems\.length, itemRows\.length\);/, '已添加列表不应再依赖逐条测量高度');
  assert.doesNotMatch(source, /const queueRetry = \(delay = 0\) => \{/, '不应使用延时重算，避免先全高再收缩');
  assert.match(source, /const renderAddedList = \(\) => \{[\s\S]*?syncItemPickerAddedListViewport\(\);[\s\S]*?\};/, '已添加商品列表渲染后未同步弹窗视口高度');
  assert.match(source, /const setCandidateListExpanded = \(expanded\) => \{[\s\S]*?syncItemPickerAddedListViewport\(\);[\s\S]*?\};/, '切换展开已选时未同步已添加列表视口高度');
});

test('候选列表支持保留滚动位置，避免异步回填触发滚动闪烁', () => {
  assert.match(source, /const renderCandidateList = \(options = \{\}\) => \{/, '候选列表渲染未支持 options 参数');
  assert.match(source, /const preserveScroll = options && options\.preserveScroll === true;/, '候选列表未读取 preserveScroll 选项');
  assert.match(source, /const previousScrollTop = preserveScroll \? candidateListEl\.scrollTop : 0;/, '候选列表未记录滚动位置');
  assert.match(source, /candidateListEl\.scrollTop = Math\.min\(previousScrollTop, maxScrollTop\);/, '候选列表未恢复滚动位置');
  assert.match(source, /wizardState\.renderCandidateList\(\{ preserveScroll: true \}\);/, '初始化回填未启用保留滚动渲染');
});
