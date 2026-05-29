import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../阿里妈妈多合一助手.js', import.meta.url), 'utf8');
const escapeRegExp = (text) => String(text || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const getLastCssBlock = (selector) => {
  const matches = Array.from(source.matchAll(new RegExp(`${escapeRegExp(selector)}\\s*\\{[^}]*\\}`, 'g')));
  return matches.at(-1)?.[0] || '';
};
const getLastCssBlockWith = (selector, pattern) => {
  const matches = Array.from(source.matchAll(new RegExp(`${escapeRegExp(selector)}\\s*\\{[^}]*\\}`, 'g')))
    .map(match => match[0])
    .filter(block => pattern.test(block));
  return matches.at(-1) || '';
};

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

test('商品弹窗头部显示共享图标和已选数量状态', () => {
  assert.match(
    source,
    /<div class="am-wxt-keyword-item-picker-title">[\s\S]*?class="am-wxt-keyword-item-picker-icon"[\s\S]*?renderAmIcon\('package', \{ size: 16, strokeWidth: 2\.1 \}\)[\s\S]*?class="am-wxt-keyword-item-picker-title-text">添加商品<\/span>[\s\S]*?class="am-wxt-keyword-item-picker-status">已选 <b id="am-wxt-keyword-item-picker-count">\$\{wizardState\.addedItems\.length\}<\/b> \/ \$\{WIZARD_MAX_ITEMS\}<\/span>/,
    '商品弹窗头部未使用共享 package 图标和已选数量状态'
  );
  assert.match(source, /const syncKeywordItemPickerCount = \(\) => \{[\s\S]*?document\.getElementById\('am-wxt-keyword-item-picker-count'\)[\s\S]*?countEl\.textContent = String\(wizardState\.addedItems\.length\);[\s\S]*?\};/, '商品弹窗已选数量未随 addedItems 同步');
  assert.match(source, /const renderAddedList = \(\) => \{[\s\S]*?syncKeywordItemPickerCount\(\);/, '已添加商品列表重渲染后未同步商品弹窗数量');
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

test('商品弹窗遮罩和面板改为白色轻玻璃背景', () => {
  const maskBlock = getLastCssBlock('#am-wxt-keyword-item-picker-mask');
  const dialogBlock = getLastCssBlock('#am-wxt-keyword-item-picker-mask .am-wxt-keyword-item-picker-dialog');
  const headBlock = getLastCssBlock('#am-wxt-keyword-item-picker-mask .am-wxt-keyword-item-picker-head');
  const panelBlock = getLastCssBlock('#am-wxt-keyword-item-picker-mask .am-wxt-panel');
  const toolbarBlock = getLastCssBlock('#am-wxt-keyword-item-picker-mask .am-wxt-toolbar');
  const footBlock = getLastCssBlock('#am-wxt-keyword-item-picker-mask .am-wxt-keyword-item-picker-foot');

  assert.match(maskBlock, /background:\s*linear-gradient\(135deg,\s*rgba\(255,255,255,0\.78\),\s*rgba\(255,255,255,0\.48\)\);/, '商品弹窗遮罩未改为白色轻玻璃渐变背景');
  assert.match(maskBlock, /backdrop-filter:\s*blur\(10px\) saturate\(1\.18\);/, '商品弹窗遮罩缺少轻量玻璃模糊');
  assert.match(maskBlock, /padding:\s*44px 16px 24px;/, '商品弹窗遮罩未保留顶部呼吸空间');
  assert.match(dialogBlock, /border-radius:\s*18px;/, '商品弹窗主体缺少统一圆角');
  assert.match(dialogBlock, /background:\s*var\(--am26-panel-strong,/, '商品弹窗主体未使用 --am26-panel-strong');
  assert.match(dialogBlock, /border:\s*1px solid var\(--am26-border-strong,/, '商品弹窗主体边框未使用 --am26-border-strong');
  assert.match(dialogBlock, /box-shadow:\s*var\(--am26-shadow,/, '商品弹窗主体阴影未使用 --am26-shadow');
  assert.match(dialogBlock, /backdrop-filter:\s*blur\(20px\) saturate\(1\.35\);/, '商品弹窗主体缺少浅玻璃面板模糊');
  assert.match(dialogBlock, /font-family:\s*var\(--am26-font,/, '商品弹窗主体未使用统一字体 token');
  assert.match(headBlock, /min-height:\s*52px;/, '商品弹窗头部未使用稳定高度');
  assert.match(headBlock, /background:\s*linear-gradient\(135deg,\s*rgba\(255,255,255,0\.56\),\s*rgba\(255,255,255,0\.24\)\);/, '商品弹窗头部未使用浅玻璃渐变');
  assert.match(headBlock, /box-shadow:\s*0 1px 0 rgba\(255,255,255,0\.28\);/, '商品弹窗头部缺少内高光分割');
  assert.match(panelBlock, /border-radius:\s*12px;/, '商品弹窗候选面板缺少 12px 圆角');
  assert.match(panelBlock, /background:\s*linear-gradient\(145deg,\s*var\(--am26-surface-strong,/, '商品弹窗候选面板未使用 token 渐变');
  assert.match(panelBlock, /backdrop-filter:\s*blur\(10px\) saturate\(1\.15\);/, '商品弹窗候选面板缺少浅玻璃模糊');
  assert.match(toolbarBlock, /border-bottom:\s*1px solid var\(--am26-border,/, '商品弹窗工具条缺少 token 分割线');
  assert.match(toolbarBlock, /background:\s*var\(--am26-surface,/, '商品弹窗工具条背景未使用 --am26-surface');
  assert.match(footBlock, /border-top:\s*1px solid var\(--am26-border,/, '商品弹窗底部操作区缺少 token 分割线');
  assert.match(footBlock, /background:\s*rgba\(255,255,255,0\.18\);/, '商品弹窗底部操作区背景未收敛为浅玻璃');

  assert.doesNotMatch(maskBlock, /background:\s*rgba\(15,\s*23,\s*42,\s*0\.48\);/, '商品弹窗遮罩不得回退到旧深色压暗背景');
  assert.doesNotMatch(dialogBlock, /(?:background:\s*#f7f8fc|box-shadow:\s*0 16px 42px rgba\(17,\s*24,\s*39,\s*0\.28\)|color:\s*#1f2937);/, '商品弹窗主体不得回退到旧灰底深色样式');
  assert.doesNotMatch(headBlock, /(?:background:\s*linear-gradient\(135deg,\s*#eef2ff,\s*#f8f9ff\)|color:\s*#1f2937);/, '商品弹窗头部不得回退到旧浅蓝硬编码背景');
  assert.doesNotMatch(panelBlock, /(?:border:\s*1px solid rgba\(148,\s*163,\s*184,\s*0\.35\)|background:\s*#fff);/, '商品弹窗候选面板不得回退到硬编码白底灰边');
  assert.doesNotMatch(footBlock, /background:\s*#f7f8fc;/, '商品弹窗底部不得回退到硬编码灰底');
});

test('商品弹窗候选行和按钮收敛到浅玻璃 token', () => {
  const buttonBlock = getLastCssBlockWith('#am-wxt-keyword-item-picker-mask .am-wxt-btn', /background:\s*var\(--am26-surface-strong,/);
  const finalButtonBlock = getLastCssBlock('#am-wxt-keyword-item-picker-mask .am-wxt-btn');
  const buttonHoverBlock = getLastCssBlock('#am-wxt-keyword-item-picker-mask .am-wxt-btn:hover');
  const buttonFocusBlock = getLastCssBlock('#am-wxt-keyword-item-picker-mask .am-wxt-btn:focus-visible');
  const primaryButtonBlock = getLastCssBlock('#am-wxt-keyword-item-picker-mask .am-wxt-btn.primary');
  const disabledButtonBlock = getLastCssBlock('#am-wxt-keyword-item-picker-mask .am-wxt-btn:disabled');
  const itemBlock = getLastCssBlockWith('#am-wxt-keyword-item-picker-mask .am-wxt-item', /background:\s*linear-gradient/);
  const finalItemBlock = getLastCssBlock('#am-wxt-keyword-item-picker-mask .am-wxt-item');
  const itemHoverBlock = getLastCssBlock('#am-wxt-keyword-item-picker-mask .am-wxt-item:hover');
  const selectedItemBlock = getLastCssBlock('#am-wxt-keyword-item-picker-mask .am-wxt-item.is-selected');
  const emptyItemBlock = getLastCssBlock('#am-wxt-keyword-item-picker-mask .am-wxt-item.is-empty');
  const addButtonBlock = getLastCssBlock('#am-wxt-keyword-item-picker-mask .am-wxt-item-add-btn:not(:disabled)');
  const nameBlock = getLastCssBlock('#am-wxt-keyword-item-picker-mask .am-wxt-item .name');
  const metaBlock = getLastCssBlock('#am-wxt-keyword-item-picker-mask .am-wxt-item .meta');

  assert.ok(buttonBlock, '商品弹窗按钮缺少 token 基础样式块');
  assert.match(buttonBlock, /border:\s*1px solid var\(--am26-border,/, '商品弹窗按钮边框未使用 --am26-border');
  assert.match(buttonBlock, /background:\s*var\(--am26-surface-strong,/, '商品弹窗按钮背景未使用 --am26-surface-strong');
  assert.match(buttonBlock, /color:\s*var\(--am26-text-soft,/, '商品弹窗按钮文字未使用 --am26-text-soft');
  assert.match(buttonBlock, /box-shadow:\s*inset 0 1px 0 rgba\(255,\s*255,\s*255,\s*0\.28\);/, '商品弹窗按钮缺少轻量内高光');
  assert.match(finalButtonBlock, /min-height:\s*32px;/, '商品弹窗按钮最终覆盖未固定高度');
  assert.match(finalButtonBlock, /border-radius:\s*10px;/, '商品弹窗按钮最终覆盖未统一圆角');
  assert.match(finalButtonBlock, /white-space:\s*nowrap;/, '商品弹窗按钮最终覆盖未防止文字换行挤压');
  assert.match(buttonHoverBlock, /border-color:\s*rgba\(69,\s*84,\s*229,\s*0\.42\);/, '商品弹窗按钮 hover 缺少品牌弱光边框');
  assert.match(buttonHoverBlock, /background:\s*rgba\(255,\s*255,\s*255,\s*0\.62\);/, '商品弹窗按钮 hover 缺少白色轻玻璃反馈');
  assert.match(buttonFocusBlock, /outline:\s*2px solid rgba\(37,\s*99,\s*235,\s*0\.45\);/, '商品弹窗按钮缺少可见 focus-visible 轮廓');
  assert.match(primaryButtonBlock, /background:\s*linear-gradient\(135deg,\s*var\(--am26-primary,/, '商品弹窗主按钮未使用 --am26-primary 渐变');
  assert.match(primaryButtonBlock, /var\(--am26-primary-strong,/, '商品弹窗主按钮未使用 --am26-primary-strong');
  assert.match(primaryButtonBlock, /border-color:\s*var\(--am26-primary,/, '商品弹窗主按钮边框未使用 --am26-primary');
  assert.match(disabledButtonBlock, /background:\s*var\(--am26-surface,/, '商品弹窗禁用按钮背景未使用 --am26-surface');
  assert.match(disabledButtonBlock, /color:\s*rgba\(80,\s*90,\s*116,\s*0\.62\);/, '商品弹窗禁用按钮文字未使用弱化文本色');
  assert.ok(itemBlock, '商品候选行缺少 token 基础样式块');
  assert.match(itemBlock, /border:\s*1px solid var\(--am26-border,/, '商品候选行边框未使用 --am26-border');
  assert.match(itemBlock, /background:\s*linear-gradient\(145deg,\s*var\(--am26-surface-strong,/, '商品候选行背景未使用浅玻璃 token 渐变');
  assert.match(itemBlock, /box-shadow:\s*inset 0 1px 0 rgba\(255,255,255,0\.3\);/, '商品候选行缺少轻量内高光');
  assert.match(finalItemBlock, /min-height:\s*62px;/, '商品候选行最终覆盖未固定最小高度');
  assert.match(finalItemBlock, /border-radius:\s*12px;/, '商品候选行最终覆盖未统一圆角');
  assert.match(itemHoverBlock, /border-color:\s*rgba\(69,84,229,0\.32\);/, '商品候选行 hover 未使用品牌弱光边框');
  assert.match(selectedItemBlock, /border-color:\s*rgba\(14,168,111,0\.26\);/, '已添加/已选择商品行缺少成功态边框');
  assert.match(emptyItemBlock, /border-style:\s*dashed;/, '商品空状态缺少虚线边界');
  assert.match(addButtonBlock, /background:\s*rgba\(69,84,229,0\.10\);/, '商品添加按钮未使用品牌弱色状态');
  assert.match(nameBlock, /color:\s*var\(--am26-text,/, '商品候选名称未使用 --am26-text');
  assert.match(metaBlock, /color:\s*var\(--am26-text-soft,/, '商品候选 ID 文本未使用 --am26-text-soft');

  assert.doesNotMatch(buttonBlock, /(?:background:\s*#eef2ff|color:\s*#2e3ab8|border:\s*1px solid rgba\(69,\s*84,\s*229,\s*0\.3\))/, '商品弹窗按钮不得回退到旧浅蓝硬编码样式');
  assert.doesNotMatch(primaryButtonBlock, /(?:#4554e5,\s*#4f68ff|color:\s*#fff|border-color:\s*#4554e5)/, '商品弹窗主按钮不得回退到旧硬编码蓝色渐变');
  assert.doesNotMatch(itemBlock, /border:\s*1px solid rgba\(148,\s*163,\s*184,\s*0\.34\)/, '商品候选行不得回退到旧灰边');
  assert.doesNotMatch(nameBlock, /color:\s*#111827;/, '商品候选名称不得回退到旧深灰硬编码');
  assert.doesNotMatch(metaBlock, /color:\s*#64748b;/, '商品候选 ID 不得回退到旧灰蓝硬编码');
});

test('商品弹窗商品行标记已添加、已选择和空状态', () => {
  assert.match(source, /candidateListEl\.innerHTML = '<div class="am-wxt-item is-empty"><div class="name">暂无候选商品<\/div><div class="meta">可搜索商品名称或宝贝 ID<\/div><\/div>';/, '候选商品空状态未补充样式类和说明');
  assert.match(source, /const isAdded = addedSet\.has\(String\(item\.materialId\)\);[\s\S]*?row\.className = `am-wxt-item\$\{isAdded \? ' is-added' : ''\}`;/, '候选商品未按已添加状态标记 is-added');
  assert.match(source, /<button class="am-wxt-btn am-wxt-item-add-btn">\$\{isAdded \? '已添加' : '添加'\}<\/button>/, '候选商品添加按钮缺少专用类或状态文案');
  assert.match(source, /addBtn\.disabled = isAdded;/, '已添加候选商品按钮未禁用');
  assert.match(source, /wizardState\.els\.addedList\.innerHTML = '<div class="am-wxt-item is-empty"><div class="name">请点击上方“添加商品”按钮<\/div><div class="meta">最多可添加 30 个商品<\/div><\/div>';/, '已添加商品空状态未补充样式类和说明');
  assert.match(source, /row\.className = 'am-wxt-item is-selected';/, '已添加商品行未标记 is-selected');
});

test('商品与向导人群移除动作使用共享 close 图标按钮', () => {
  assert.match(
    source,
    /class="am-wxt-remove-icon-btn am-wxt-item-remove-btn"[\s\S]*?aria-label="移除商品：\$\{Utils\.escapeHtml\(itemName\)\}"[\s\S]*?title="移除商品"[\s\S]*?renderAmIcon\('close', \{ size: 12, strokeWidth: 2\.2 \}\)/,
    '已添加商品移除操作未使用共享 close 图标按钮'
  );
  assert.match(
    source,
    /class="am-wxt-remove-icon-btn am-wxt-crowd-remove-btn"[\s\S]*?aria-label="移除人群：\$\{Utils\.escapeHtml\(crowdName\)\}"[\s\S]*?title="移除人群"[\s\S]*?renderAmIcon\('close', \{ size: 12, strokeWidth: 2\.2 \}\)/,
    '向导人群移除操作未使用共享 close 图标按钮'
  );
  assert.match(
    source,
    /#am-wxt-keyword-modal \.am-wxt-remove-icon-btn,[\s\S]*?#am-wxt-keyword-item-picker-mask \.am-wxt-remove-icon-btn,[\s\S]*?#am-wxt-scene-popup-mask \.am-wxt-remove-icon-btn \{[\s\S]*?display:\s*inline-flex;[\s\S]*?width:\s*24px;[\s\S]*?height:\s*24px;[\s\S]*?background:\s*var\(--am26-surface,[\s\S]*?color:\s*var\(--am26-text-soft,[\s\S]*?#am-wxt-keyword-modal \.am-wxt-remove-icon-btn svg,[\s\S]*?width:\s*12px;[\s\S]*?#am-wxt-keyword-modal \.am-wxt-remove-icon-btn:focus-visible,[\s\S]*?box-shadow:\s*0 0 0 3px rgba\(37,99,235,0\.18\),/,
    '移除类图标按钮缺少统一浅玻璃 token 样式或 focus-visible'
  );
  assert.doesNotMatch(
    source,
    /<button class="am-wxt-btn">移除<\/button>/,
    '商品或向导人群移除操作不应回退为通用文字按钮'
  );
});

test('候选商品与已添加商品渲染主图缩略图', () => {
  assert.match(
    source,
    /const resolveKeywordItemPicUrl = \(item = \{\}\) => \{[\s\S]*?item\?\.picUrl[\s\S]*?item\?\.materialImageUrl[\s\S]*?raw\.picUrl[\s\S]*?raw\.mainPic[\s\S]*?\)\.trim\(\);[\s\S]*?\};/,
    '商品主图 URL 解析未覆盖归一化字段与 raw 兼容字段'
  );
  assert.match(
    source,
    /const renderKeywordItemThumb = \(item = \{\}\) => \{[\s\S]*?class="am-wxt-item-thumb empty"[\s\S]*?class="am-wxt-item-thumb has-image"[\s\S]*?<img src="\$\{Utils\.escapeHtml\(picUrl\)\}" alt="" loading="lazy" referrerpolicy="no-referrer" \/>[\s\S]*?\};/,
    '商品缩略图渲染缺少图片或缺图占位'
  );
  assert.ok(
    (source.match(/\$\{renderKeywordItemThumb\(item\)\}/g) || []).length >= 2,
    '候选商品与已添加商品未共用主图渲染'
  );
  assert.match(
    source,
    /#am-wxt-keyword-modal \.am-wxt-item-main,[\s\S]*?#am-wxt-keyword-item-picker-mask \.am-wxt-item-main \{[\s\S]*?display:\s*flex;[\s\S]*?min-width:\s*0;[\s\S]*?flex:\s*1 1 auto;/,
    '首页与商品弹窗的商品主图标题容器缺少稳定布局'
  );
  assert.match(
    source,
    /#am-wxt-keyword-modal \.am-wxt-item-thumb,[\s\S]*?#am-wxt-keyword-item-picker-mask \.am-wxt-item-thumb \{[\s\S]*?width:\s*44px;[\s\S]*?height:\s*44px;[\s\S]*?flex:\s*0 0 44px;/,
    '首页与商品弹窗的商品主图缩略图缺少固定尺寸'
  );
  assert.match(
    source,
    /#am-wxt-keyword-modal \.am-wxt-item \.name,[\s\S]*?#am-wxt-keyword-item-picker-mask \.am-wxt-item \.name \{[\s\S]*?min-width:\s*0;[\s\S]*?text-overflow:\s*ellipsis;[\s\S]*?-webkit-line-clamp:\s*2;/,
    '首页与商品弹窗的商品标题未限制为稳定两行展示'
  );
});

test('商品区与列表高度改为自适应', () => {
  assert.match(source, /#am-wxt-keyword-item-split \{[\s\S]*?height: auto;[\s\S]*?min-height: 0;[\s\S]*?overflow: hidden;/, '商品 split 未改为内层滚动承载');
  assert.match(source, /#am-wxt-keyword-item-split > \.am-wxt-panel \{[\s\S]*?min-height: 0;/, '商品 split 子面板未允许内部滚动收缩');
  assert.match(source, /#am-wxt-keyword-candidate-list \{[\s\S]*?flex: 1 1 auto;[\s\S]*?height: auto;[\s\S]*?max-height: none;/, '主向导候选列表未改为高度自适应');
  assert.match(source, /#am-wxt-keyword-modal #am-wxt-keyword-added-list \{[\s\S]*?min-height: 72px;[\s\S]*?height: 72px;[\s\S]*?max-height: 72px;/, '主向导已添加列表未设置紧凑固定高度');
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
  assert.match(source, /const compactHeight = 72;/, '主页面已添加列表未使用紧凑固定高度');
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
