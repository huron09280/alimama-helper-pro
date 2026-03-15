import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../阿里妈妈多合一助手.js', import.meta.url), 'utf8');

function getRenderSceneDynamicConfigBlock() {
  const start = source.indexOf('const renderSceneDynamicConfig = () => {');
  const end = source.indexOf('const collectManualKeywordRowsFromPanel = (panel) => (', start);
  assert.ok(start > -1 && end > start, '无法定位 renderSceneDynamicConfig 代码块');
  return source.slice(start, end);
}

function getResolveSceneSettingOverridesBlock() {
  const start = source.indexOf('const resolveSceneSettingOverrides = ({ sceneName = \'\', sceneSettings = {}, runtime = {} }) => {');
  const end = source.indexOf('const buildFallbackSolutionTemplate = (runtime, sceneName = \'\') => {', start);
  assert.ok(start > -1 && end > start, '无法定位 resolveSceneSettingOverrides 代码块');
  return source.slice(start, end);
}

const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

test('自定义推广已提供弹窗配置入口并绑定到 API 字段', () => {
  const block = getRenderSceneDynamicConfigBlock();
  assert.match(
    block,
    /data-scene-popup-trigger=/,
    '缺少弹窗触发器渲染逻辑'
  );

  for (const trigger of ['adzone', 'launchPeriod', 'launchArea', 'crowd']) {
    assert.match(
      block,
      new RegExp(`trigger:\\s*'${escapeRegExp(trigger)}'`),
      `缺少弹窗触发器配置: ${trigger}`
    );
  }

  for (const fieldKey of ['campaign.adzoneList', 'campaign.launchPeriodList', 'campaign.launchAreaStrList', 'campaign.crowdList', 'adgroup.rightList']) {
    assert.match(
      block,
      new RegExp(`const\\s+\\w+\\s*=\\s*'${escapeRegExp(fieldKey)}'`),
      `缺少弹窗字段常量声明: ${fieldKey}`
    );
  }
  assert.match(
    block,
    /label:\s*'投放资源位\/投放地域\/分时折扣'/,
    '手动出价缺少原生“投放资源位/投放地域/分时折扣”组合设置'
  );
});

test('严格选项会归一化旧值，避免手动出价展示无效设置项', () => {
  const block = getRenderSceneDynamicConfigBlock();
  assert.match(
    block,
    /if \(strictOptions === true && optionList\.length\) \{/,
    '缺少 strictOptions 归一化分支'
  );
  assert.match(
    block,
    /const matchedCurrent = pickSceneValueFromOptions\(currentCandidate, optionList\);/,
    '缺少当前值按可选项归一化逻辑'
  );
  assert.match(
    block,
    /const matchedDefault = pickSceneValueFromOptions\(defaultValue, optionList\);/,
    '缺少默认值按可选项归一化逻辑'
  );
  assert.match(
    block,
    /currentValue = matchedDefault \|\| optionList\[0\];/,
    '缺少 strictOptions 无匹配时的兜底逻辑'
  );
});

test('弹窗保存会回写隐藏字段并触发场景配置联动刷新', () => {
  const block = getRenderSceneDynamicConfigBlock();
  assert.match(
    block,
    /const scenePopupButtons = wizardState\.els\.sceneDynamic\.querySelectorAll\('\[data-scene-popup-trigger\]'\);/,
    '缺少弹窗按钮事件绑定'
  );
  assert.match(
    block,
    /data-scene-popup-save/,
    '缺少弹窗保存按钮'
  );
  assert.match(
    block,
    /dispatchEvent\(new Event\('input', \{ bubbles: true \}\)\)/,
    '弹窗保存后未触发 input 事件'
  );
  assert.match(
    block,
    /dispatchEvent\(new Event\('change', \{ bubbles: true \}\)\)/,
    '弹窗保存后未触发 change 事件'
  );
});

test('弹窗摘要支持点击与键盘触发对应配置按钮', () => {
  const block = getRenderSceneDynamicConfigBlock();
  assert.match(
    block,
    /data-scene-popup-trigger-proxy=/,
    '缺少弹窗摘要代理触发标记'
  );
  assert.match(
    block,
    /const scenePopupSummaryTriggers = wizardState\.els\.sceneDynamic\.querySelectorAll\('\[data-scene-popup-trigger-proxy\]'\);/,
    '缺少弹窗摘要触发器绑定'
  );
  assert.match(
    block,
    /addEventListener\('keydown', \(event\) => \{/,
    '缺少弹窗摘要键盘触发绑定'
  );
  assert.match(
    block,
    /event\.key !== 'Enter' && event\.key !== ' '/,
    '缺少 Enter\/Space 键盘过滤'
  );
  assert.match(
    block,
    /button\.click\(\);/,
    '弹窗摘要未触发对应按钮点击'
  );
});

test('资源位与时段使用原站同构高级设置弹窗（三 Tab）', () => {
  const block = getRenderSceneDynamicConfigBlock();
  assert.match(
    block,
    /title:\s*'高级设置'/,
    '缺少高级设置弹窗标题'
  );
  assert.match(
    block,
    /data-scene-popup-advanced-tab="adzone"/,
    '缺少投放资源位 Tab'
  );
  assert.match(
    block,
    /data-scene-popup-advanced-tab="launchArea"/,
    '缺少投放地域 Tab'
  );
  assert.match(
    block,
    /data-scene-popup-advanced-tab="launchPeriod">分时折扣</,
    '缺少“分时折扣”Tab'
  );
  assert.match(
    block,
    /data-scene-popup-time-grid/,
    '缺少投放时间网格容器'
  );
  assert.match(
    block,
    /data-scene-popup-adzone-row-toggle/,
    '缺少资源位逐行开关'
  );
});

test('高级设置补齐原生投放地域结构与时段模板层按钮', () => {
  const block = getRenderSceneDynamicConfigBlock();
  assert.match(
    block,
    /data-scene-popup-area-template="current"/,
    '缺少投放地域“当前设置”模板按钮'
  );
  assert.match(
    block,
    /data-scene-popup-area-template="recommended"/,
    '缺少投放地域“推荐模板”按钮'
  );
  assert.match(
    block,
    /data-scene-popup-area-template="custom"/,
    '缺少投放地域“自定义模板”按钮'
  );
  assert.match(
    block,
    /data-scene-popup-area-recommend-template="1"/,
    '缺少投放地域“推荐模板下拉”'
  );
  assert.match(
    block,
    /data-scene-popup-area-custom-template="1"/,
    '缺少投放地域“自定义模板下拉”'
  );
  assert.match(
    block,
    /data-scene-popup-area-save-template="1"/,
    '缺少投放地域“保存模板”按钮'
  );
  assert.match(
    block,
    /data-scene-popup-area-mode="alpha"/,
    '缺少投放地域“按首字母选择”按钮'
  );
  assert.match(
    block,
    /data-scene-popup-area-mode="geo"/,
    '缺少投放地域“按地理区选择”按钮'
  );
  assert.match(
    block,
    /data-scene-popup-area-search="1"/,
    '缺少投放地域搜索输入框'
  );
  assert.match(
    block,
    /data-scene-popup-area-selector="1"/,
    '缺少投放地域选择器容器'
  );
  assert.match(
    block,
    /data-scene-popup-area-section=/,
    '缺少投放地域分组容器标记'
  );
  assert.match(
    block,
    /data-scene-popup-area-group-toggle=/,
    '缺少投放地域分组全选开关'
  );
  assert.match(
    block,
    /data-scene-popup-area-item-toggle=/,
    '缺少投放地域单项选择开关'
  );
  assert.match(
    block,
    /全选 - 常用区域/,
    '缺少投放地域“全选 - 常用区域”'
  );
  assert.match(
    block,
    /全选 - 不常用区域/,
    '缺少投放地域“全选 - 不常用区域”'
  );
  assert.match(
    block,
    /全选 - 海外地区/,
    '缺少投放地域“全选 - 海外地区”'
  );
  assert.doesNotMatch(
    block,
    /data-scene-popup-editor="launchArea"/,
    '投放地域仍保留旧 textarea 编辑器'
  );
  assert.match(
    block,
    /data-scene-popup-time-template="current"/,
    '缺少投放时间“当前设置”模板按钮'
  );
  assert.match(
    block,
    /data-scene-popup-time-template="full"/,
    '缺少投放时间“全日制投放”模板按钮'
  );
  assert.match(
    block,
    /data-scene-popup-time-template="custom"/,
    '缺少投放时间“自定义投放时间模板”按钮'
  );
  assert.match(
    block,
    /data-scene-popup-time-recommend-card=/,
    '缺少分时折扣推荐策略卡片容器'
  );
  assert.match(
    block,
    /data-scene-popup-time-legend=/,
    '缺少分时折扣图例层'
  );
  assert.match(
    block,
    /data-scene-popup-time-hour=/,
    '缺少分时折扣小时级网格坐标'
  );
  assert.match(
    block,
    /adzoneCode:\s*'DEFAULT_SEARCH_CHAIN'/,
    '缺少高级设置回退资源位：搜索意图全链路投'
  );
  assert.match(
    block,
    /adzoneName:\s*'搜索意图全链路投'/,
    '缺少高级设置回退资源位名称：搜索意图全链路投'
  );
});

test('投放地域弹层支持模板、搜索、分组全选与单项勾选联动', () => {
  const block = getRenderSceneDynamicConfigBlock();
  assert.match(
    block,
    /const areaSelector = mask\.querySelector\('\[data-scene-popup-area-selector="1"\]'\);/,
    '缺少投放地域选择器 DOM 引用'
  );
  assert.match(
    block,
    /const areaSearchInput = mask\.querySelector\('\[data-scene-popup-area-search="1"\]'\);/,
    '缺少投放地域搜索输入 DOM 引用'
  );
  assert.match(
    block,
    /const renderAreaSelector = \(\) => \{/,
    '缺少投放地域列表渲染函数'
  );
  assert.match(
    block,
    /const applyAreaTemplate = \(templateKey = ''\) => \{/,
    '缺少投放地域模板应用函数'
  );
  assert.match(
    block,
    /const toggleAreaGroupSelection = \(group = '', enabled = true\) => \{/,
    '缺少投放地域分组全选逻辑'
  );
  assert.match(
    block,
    /const toggleAreaItemSelection = \(areaCode = '', enabled = true\) => \{/,
    '缺少投放地域单项勾选逻辑'
  );
  assert.match(
    block,
    /areaSelector\.addEventListener\('click', \(event\) => \{/,
    '缺少投放地域列表点击代理事件'
  );
  assert.match(
    block,
    /areaSearchInput\.addEventListener\('input', \(\) => \{/,
    '缺少投放地域搜索输入监听'
  );
});

test('投放地域支持省市两级并优先复用原生地域码表', () => {
  const block = getRenderSceneDynamicConfigBlock();
  assert.match(
    block,
    /commonapi\/tetris\/area\/getCodeConfig\.json/,
    '缺少原生投放地域码表接口调用'
  );
  assert.match(
    block,
    /params\.set\('templateType', 'AREA'\);/,
    '原生投放地域码表请求未声明 AREA 模板类型'
  );
  assert.match(
    block,
    /const buildAreaRegionGroupsFromNativeConfig = \(payload = \{\}\) => \{/,
    '缺少原生地域码表解析逻辑'
  );
  assert.match(
    block,
    /data-scene-popup-area-province-toggle=/,
    '缺少省级勾选交互标记'
  );
  assert.match(
    block,
    /data-scene-popup-area-city-toggle=/,
    '缺少城市勾选交互标记'
  );
  assert.match(
    block,
    /data-scene-popup-area-city-list=/,
    '缺少城市列表容器标记'
  );
  assert.match(
    block,
    /const toggleAreaProvinceSelection = \(provinceCode = '', enabled = true\) => \{/,
    '缺少省级勾选联动函数'
  );
  assert.match(
    block,
    /const toggleAreaCitySelection = \(provinceCode = '', cityCode = '', enabled = true\) => \{/,
    '缺少城市勾选联动函数'
  );
});

test('投放地域支持点击省份弹出城市面板（原生同构交互）', () => {
  const block = getRenderSceneDynamicConfigBlock();
  assert.match(
    block,
    /data-scene-popup-area-province-open=/,
    '缺少省份弹出城市面板触发标记'
  );
  assert.match(
    block,
    /am-wxt-scene-area-city-popover/,
    '缺少城市弹出面板样式容器'
  );
  assert.match(
    block,
    /data-scene-popup-area-city-expand=/,
    '缺少省份城市面板展开按钮'
  );
  assert.match(
    block,
    /areaExpandedProvinceSet = new Set\(\[provinceCode\]\);/,
    '点击省份后未切换为单省份城市面板展开'
  );
});

test('投放地域省市顺序保持原生返回顺序，不按中文名二次重排', () => {
  const block = getRenderSceneDynamicConfigBlock();
  assert.match(
    block,
    /const AREA_ALPHA_NAME_ORDER_BY_SECTION = \{/,
    '缺少按原生截图顺序的省份排序表'
  );
  assert.match(
    block,
    /'黑龙江', '河北', '河南', '湖北', '湖南', '海南'/,
    '常用区域 H 分组顺序未按原生截图排列'
  );
  assert.match(
    block,
    /'山西', '陕西', '山东', '上海', '四川'/,
    '常用区域 S 分组顺序未按原生截图排列'
  );
  assert.match(
    block,
    /const alphaOrderLookup = new Map\(\);/,
    '缺少按原生 letterGroups 记录省份顺序'
  );
  assert.match(
    block,
    /const resolveProvinceOrderWeight = \(province = null, currentMode = 'alpha'\) => \{/,
    '缺少省份顺序权重解析函数'
  );
  assert.match(
    block,
    /const useInitialGrouping = mode === 'alpha' && normalizedSection === 'common';/,
    '非常用区域未关闭首字母分组排序'
  );
  assert.doesNotMatch(
    block,
    /\.sort\(\(left, right\) => String\(left\?\.name \|\| ''\)\.localeCompare\(String\(right\?\.name \|\| ''\)/,
    '城市列表仍按中文名二次排序'
  );
});

test('投放地域按首字母与地理区选择均保持四列布局', () => {
  const block = getRenderSceneDynamicConfigBlock();
  assert.match(
    block,
    /const normalizeAreaModeKey = \(value = ''\) => String\(value \|\| ''\)\.trim\(\) === 'geo' \? 'geo' : 'alpha';/,
    '缺少投放地域模式归一化函数'
  );
  assert.match(
    block,
    /classList\.toggle\('area-mode-alpha', normalizedAreaMode === 'alpha'\);/,
    '缺少按首字母模式容器标记'
  );
  assert.match(
    block,
    /classList\.toggle\('area-mode-geo', normalizedAreaMode === 'geo'\);/,
    '缺少按地理区模式容器标记'
  );
  assert.match(
    block,
    /const isGeoGrouping = mode === 'geo' && groupKey !== '__all__';/,
    '按地理区模式缺少分组标题判定'
  );
  assert.match(
    block,
    /const showGroupTitle = isGeoGrouping \|\| isAlphaGrouping;/,
    '分组标题展示逻辑未包含地理区模式'
  );
  assert.match(
    block,
    /isGeoGrouping \? 'geo-title' : ''/,
    '地理区分组缺少 geo-title 样式标记'
  );
  assert.match(
    source,
    /#am-wxt-scene-popup-mask \.am-wxt-scene-advanced-area-selector\.area-mode-alpha \.am-wxt-scene-area-item-grid \{[\s\S]*?display: grid;[\s\S]*?grid-template-columns: repeat\(4, minmax\(0, 1fr\)\);/,
    '按首字母模式未使用四列网格'
  );
  assert.match(
    source,
    /#am-wxt-scene-popup-mask \.am-wxt-scene-advanced-area-selector\.area-mode-geo \.am-wxt-scene-area-item-grid \{[\s\S]*?display: grid;[\s\S]*?grid-template-columns: repeat\(4, minmax\(0, 1fr\)\);/,
    '按地理区模式未使用四列网格'
  );
  assert.match(
    source,
    /#am-wxt-scene-popup-mask \.am-wxt-scene-area-group\.geo-title \.am-wxt-scene-area-group-title \{[\s\S]*?text-align: left;[\s\S]*?font-weight: 600;/,
    '按地理区模式分组名称样式缺失'
  );
});

test('配置资源位初始值兼容字符串并同步加载到高级弹窗', () => {
  const block = getRenderSceneDynamicConfigBlock();
  assert.match(
    block,
    /const adzoneRawValue = normalizeSceneSettingValue\(/,
    '缺少配置资源位原始值归一化变量'
  );
  assert.match(
    block,
    /const adzoneList = normalizeAdzoneListForAdvanced\(adzoneRawValue\);/,
    '配置资源位未复用高级弹窗同构归一化逻辑'
  );
  assert.match(
    block,
    /const adzoneRaw = JSON\.stringify\(adzoneList\);/,
    '配置资源位归一化后未回填隐藏字段'
  );
});

test('高级设置会优先同步网页默认资源位/地域/时段', () => {
  const block = getRenderSceneDynamicConfigBlock();
  assert.match(
    block,
    /const loadNativeAdvancedDefaultsSnapshot = async \(\) => \{/,
    '缺少网页默认高级设置回源加载器'
  );
  assert.match(
    block,
    /selected\.adzoneList/,
    '网页默认资源位未从原站状态读取'
  );
  assert.match(
    block,
    /selected\.launchAreaStrList/,
    '网页默认地域未从原站状态读取'
  );
  assert.match(
    block,
    /selected\.launchPeriodList/,
    '网页默认时段未从原站状态读取'
  );
  assert.match(
    block,
    /openKeywordAdvancedSettingPopup[\s\S]*loadNativeAdvancedDefaultsSnapshot\(\)/,
    '高级设置弹窗打开时未触发网页默认值同步'
  );
});

test('资源位占位名称会触发默认值回源同步', () => {
  const block = getRenderSceneDynamicConfigBlock();
  assert.match(
    block,
    /const name = normalizeNativeAdzoneName\(item, idx\);/,
    '缺少资源位占位名称归一化读取'
  );
  assert.match(
    block,
    /if \(\/\^\(DEFAULT_SEARCH\|A_TEST_SLOT\|B_TEST_SLOT\|TEST_\|native_adzone_\)\/i\.test\(name\)\) return true;/,
    '资源位占位名称未纳入默认值回源判定'
  );
});

test('网页高级设置入口支持根节点未命中时全局回退', () => {
  const block = getRenderSceneDynamicConfigBlock();
  assert.match(
    block,
    /const searchScopes = \[root, document\];/,
    '缺少网页高级设置入口的全局回退查找范围'
  );
  assert.match(
    block,
    /for \(const scope of searchScopes\)/,
    '缺少网页高级设置入口的回退遍历逻辑'
  );
});

test('网页高级设置入口在视口外时会先滚动再点击', () => {
  const block = getRenderSceneDynamicConfigBlock();
  assert.match(
    block,
    /openButton\.scrollIntoView\(\{ block: 'center', inline: 'nearest', behavior: 'instant' \}\);/,
    '缺少网页高级设置入口的滚动到视口逻辑'
  );
});

test('网页高级设置入口识别“分时折扣”文案', () => {
  const block = getRenderSceneDynamicConfigBlock();
  assert.match(
    block,
    /投放资源位\\\/投放地域\\\/(?:分时折扣|\(投放时间\|分时折扣\))/,
    '高级设置入口未识别“投放资源位/投放地域/分时折扣”文案'
  );
});

test('网页高级设置会优先选择信息更完整的状态快照', () => {
  const block = getRenderSceneDynamicConfigBlock();
  assert.match(
    block,
    /let bestSnapshot = null;/,
    '缺少高级设置状态快照优选容器'
  );
  assert.match(
    block,
    /let bestScore = -1;/,
    '缺少高级设置状态快照评分变量'
  );
  assert.match(
    block,
    /if \(score > bestScore\)/,
    '缺少高级设置状态快照择优逻辑'
  );
});

test('网页高级设置会等待高质量状态快照后再回填', () => {
  const block = getRenderSceneDynamicConfigBlock();
  assert.match(
    block,
    /const isNativeAdvancedSnapshotRich = \(snapshot = {}\) => \{/,
    '缺少高级设置快照质量判定器'
  );
  assert.match(
    block,
    /isNativeAdvancedSnapshotRich\(latestSnapshot\)/,
    '缺少等待高质量快照的判定调用'
  );
});

test('网页高级设置命中后会继续短时采样，避免漏掉后加载资源位', () => {
  const block = getRenderSceneDynamicConfigBlock();
  assert.match(
    block,
    /const sampleBestNativeAdvancedDefaultsSnapshot = async \(seedSnapshot = null, options = {}\) => \{/,
    '缺少高级设置快照二次采样器'
  );
  assert.match(
    block,
    /if \(isNativeAdvancedSnapshotRich\(latestSnapshot\)\) \{[\s\S]*sampleBestNativeAdvancedDefaultsSnapshot\(latestSnapshot,\s*\{[\s\S]*durationMs:\s*420[\s\S]*\}\);[\s\S]*return latestSnapshot;/,
    '命中初始高质量快照后未执行二次采样'
  );
  assert.match(
    block,
    /latestSnapshot = await sampleBestNativeAdvancedDefaultsSnapshot\(latestSnapshot,\s*\{[\s\S]*durationMs:\s*isNativeAdvancedSnapshotRich\(latestSnapshot\) \?\s*560\s*:\s*360[\s\S]*\}\);/,
    '打开原生弹窗后未按快照质量执行二次采样'
  );
});

test('投放时间序列化保留 24:00 结束时间', () => {
  const block = getRenderSceneDynamicConfigBlock();
  assert.match(
    block,
    /if \(safeMinutes >= 24 \* 60 && base === 0\) return '24:00';/,
    '投放时间结束分钟 1440 未被序列化为 24:00'
  );
});

test('自定义推广允许通过 direct API 字段提交弹窗配置', () => {
  const mappingBlock = getResolveSceneSettingOverridesBlock();
  assert.match(
    mappingBlock,
    /\^campaign\\\./,
    '提交流程未覆盖 campaign.* direct 字段'
  );
  assert.match(
    mappingBlock,
    /\^adgroup\\\./,
    '提交流程未覆盖 adgroup.* direct 字段'
  );

  for (const directKey of ['adzoneList', 'launchPeriodList', 'launchAreaStrList', 'crowdList', 'rightList']) {
    assert.match(
      mappingBlock,
      new RegExp(escapeRegExp(directKey)),
      `提交流程未覆盖 direct 字段线索: ${directKey}`
    );
  }
});

test('手动出价人群弹窗采用原生双栏选择器结构并保留 JSON 映射', () => {
  const block = getRenderSceneDynamicConfigBlock();
  assert.match(
    block,
    /dialogClassName:\s*'am-wxt-scene-popup-dialog-crowd'/,
    '人群弹窗缺少独立双栏对齐样式类'
  );
  assert.match(
    block,
    /data-scene-popup-crowd-layout=/,
    '人群弹窗缺少双栏布局容器'
  );
  assert.match(
    block,
    /data-scene-popup-crowd-candidate-list=/,
    '人群弹窗缺少候选人群列表'
  );
  assert.match(
    block,
    /data-scene-popup-crowd-selected-list=/,
    '人群弹窗缺少已选人群列表'
  );
  assert.match(
    block,
    /data-scene-popup-crowd-add=/,
    '人群弹窗缺少添加人群操作'
  );
  assert.match(
    block,
    /data-scene-popup-crowd-remove=/,
    '人群弹窗缺少移除人群操作'
  );
  assert.match(
    block,
    /campaignRaw:\s*JSON\.stringify\(campaignOutput\)/,
    '人群弹窗保存未同步 campaign.crowdList'
  );
  assert.match(
    block,
    /adgroupRaw:\s*JSON\.stringify\(adgroupOutput\)/,
    '人群弹窗保存未同步 adgroup.rightList'
  );
});

test('手动出价人群弹窗补齐原生候选维度与批量溢价控件', () => {
  const block = getRenderSceneDynamicConfigBlock();
  assert.match(
    block,
    /data-scene-popup-crowd-quick-filter=/,
    '人群弹窗缺少原生二级筛选入口'
  );
  assert.match(
    block,
    /<span>人群规模<\/span>/,
    '人群弹窗候选列缺少“人群规模”'
  );
  assert.match(
    block,
    /<span>推荐理由<\/span>/,
    '人群弹窗候选列缺少“推荐理由”'
  );
  assert.match(
    block,
    /<span>设置溢价<\/span>/,
    '人群弹窗候选列缺少“设置溢价”'
  );
  assert.match(
    block,
    /data-scene-popup-crowd-batch-bid=/,
    '人群弹窗右侧缺少“批量设置溢价”控件'
  );
});
