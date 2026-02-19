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

  for (const trigger of ['crowd', 'adzone', 'launchPeriod', 'launchArea']) {
    assert.match(
      block,
      new RegExp(`trigger:\\s*'${escapeRegExp(trigger)}'`),
      `缺少弹窗触发器配置: ${trigger}`
    );
  }

  for (const fieldKey of ['campaign.crowdList', 'adgroup.rightList', 'campaign.adzoneList', 'campaign.launchPeriodList', 'campaign.launchAreaStrList']) {
    assert.match(
      block,
      new RegExp(`const\\s+\\w+\\s*=\\s*'${escapeRegExp(fieldKey)}'`),
      `缺少弹窗字段常量声明: ${fieldKey}`
    );
  }
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
    /data-scene-popup-advanced-tab="launchPeriod"/,
    '缺少投放时间 Tab'
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

test('高级设置补齐地域与时段模板层按钮（最细层）', () => {
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
