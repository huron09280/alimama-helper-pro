import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Script, createContext } from 'node:vm';

const source = readFileSync(new URL('../阿里妈妈多合一助手.js', import.meta.url), 'utf8');
const dynamicGridSource = readFileSync(new URL('../src/optimizer/keyword-plan-api/wizard-scene-config/render-scene-dynamic-grid.js', import.meta.url), 'utf8');

function getKeywordCustomSceneBlock() {
  const start = source.indexOf("if (activeKeywordGoal === '自定义推广') {");
  const end = source.indexOf("if (sceneName === '货品全站推广') {", start);
  assert.ok(start > -1 && end > start, '无法定位关键词自定义推广场景配置代码块');
  return source.slice(start, end);
}

function getRenderSceneDynamicConfigBlock() {
  const start = source.indexOf('const renderSceneDynamicConfig = () => {');
  const end = source.indexOf('const collectManualKeywordRowsFromPanel = (panel) => (', start);
  assert.ok(start > -1 && end > start, '无法定位 renderSceneDynamicConfig 代码块');
  return source.slice(start, end);
}

function sliceSource(text, startText, endText) {
  const start = text.indexOf(startText);
  const end = text.indexOf(endText, start + startText.length);
  assert.ok(start > -1 && end > start, `无法定位代码片段：${startText}`);
  return text.slice(start, end);
}

function getResolveSceneSettingOverridesBlock() {
  const start = source.indexOf("const resolveSceneSettingOverrides = ({ sceneName = '', sceneSettings = {}, runtime = {} }) => {");
  const end = source.indexOf("const buildFallbackSolutionTemplate = (runtime, sceneName = '') => {", start);
  assert.ok(start > -1 && end > start, '无法定位 resolveSceneSettingOverrides 代码块');
  return source.slice(start, end);
}

function extractBraceBlock(text, anchorIndex, label = '代码块') {
  const openIndex = text.indexOf('{', anchorIndex);
  assert.ok(openIndex > -1, `无法定位${label}起始大括号`);
  let depth = 0;
  for (let idx = openIndex; idx < text.length; idx += 1) {
    const ch = text[idx];
    if (ch === '{') depth += 1;
    if (ch === '}') {
      depth -= 1;
      if (depth === 0) {
        return {
          start: openIndex,
          end: idx,
          body: text.slice(openIndex + 1, idx)
        };
      }
    }
  }
  assert.fail(`无法定位${label}结束位置`);
}

function createAiMaxTypewriterHarness(initialVisibilityState = 'visible') {
  let visibilityState = String(initialVisibilityState || 'visible');
  let nextTimerId = 1;
  const timers = new Map();
  const listeners = new Map();
  class FakeHTMLElement {
    constructor(attrs = {}) {
      this.dataset = {};
      this.textContent = String(attrs.textContent || '');
      this.isConnected = attrs.isConnected !== false;
      this.children = Array.isArray(attrs.children) ? attrs.children : [];
      this.attributes = new Map();
      Object.entries(attrs.attributes || {}).forEach(([key, value]) => {
        this.attributes.set(key, String(value));
      });
    }

    getAttribute(name) {
      return this.attributes.get(name) || '';
    }

    matches(selector) {
      if (selector === '[data-ai-max-step-detail="1"].hidden') {
        return this.getAttribute('data-ai-max-step-detail') === '1' && /\bhidden\b/.test(this.getAttribute('class'));
      }
      return false;
    }

    querySelectorAll(selector) {
      if (selector !== '[data-ai-max-typewriter-text]') return [];
      return this.children.filter(child => child instanceof FakeHTMLElement && child.getAttribute('data-ai-max-typewriter-text'));
    }
  }
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
    removeEventListener: removeListener
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
      timers.delete(Number(timerId));
    }
  };
  const dynamicBlock = getRenderSceneDynamicConfigBlock();
  const helperSource = sliceSource(
    dynamicBlock,
    'const ensureAiMaxTypewriterTimers = () => {',
    'const unbindAiMaxDetailDelegatedHandlers = () => {'
  );
  const context = createContext({
    document: documentRef,
    window: windowRef,
    HTMLElement: FakeHTMLElement,
    Map,
    Set,
    Array,
    Number,
    String,
    normalizeSceneSettingValue: (value = '') => String(value || '').replace(/\s+/g, ' ').trim(),
    wizardState: {
      aiMaxTypewriterTimers: new Map(),
      aiMaxTypewriterCleanupRegistered: false,
      aiMaxTypewriterVisibilityHandler: null,
      cleanupHandlers: []
    }
  });
  new Script(`${helperSource}
globalThis.__runAiMaxTypewriter = runAiMaxTypewriter;
globalThis.__cleanupAiMaxTypewriterTimers = cleanupAiMaxTypewriterTimers;
globalThis.__wizardState = wizardState;`).runInContext(context);
  return {
    context,
    timers,
    FakeHTMLElement,
    listenerCount(type = 'visibilitychange') {
      return listeners.get(type)?.size || 0;
    },
    setVisibilityState(nextState) {
      visibilityState = String(nextState || 'visible');
      const handlers = Array.from(listeners.get('visibilitychange') || []);
      handlers.forEach(handler => handler({ type: 'visibilitychange' }));
    },
    tickNextTimer() {
      const [timerId, timer] = Array.from(timers.entries())[0] || [];
      if (!timer) return false;
      timers.delete(timerId);
      timer.handler();
      return true;
    },
    getTimerDelays() {
      return Array.from(timers.values()).map(timer => timer.delay);
    },
    get wizardState() {
      return context.__wizardState;
    },
    run(panel) {
      context.__runAiMaxTypewriter(panel);
    },
    cleanup() {
      context.__cleanupAiMaxTypewriterTimers();
    }
  };
}

function createAiMaxDemandPopoverBindHarness(initialVisibilityState = 'visible') {
  let visibilityState = String(initialVisibilityState || 'visible');
  let nextTimerId = 1;
  const timers = new Map();
  const listeners = new Map();
  class FakeHTMLElement {
    constructor(id = '') {
      this.id = String(id || '');
      this.isConnected = true;
      this.children = [];
    }

    contains(target) {
      return target === this || this.children.includes(target);
    }

    remove() {
      this.isConnected = false;
    }
  }
  const popover = new FakeHTMLElement('am-wxt-ai-max-demand-popover');
  const triggerButton = new FakeHTMLElement('trigger');
  const outsideNode = new FakeHTMLElement('outside');
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
      if (id !== 'am-wxt-ai-max-demand-popover') return null;
      return popover.isConnected ? popover : null;
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
      timers.delete(Number(timerId));
    }
  };
  const helperSource = sliceSource(
    dynamicGridSource,
    'const clearKeywordAiMaxDemandPopoverBindVisibilityHandler = () => {',
    'const openKeywordAiMaxDemandPopover = (triggerButton = null) => {'
  );
  const context = createContext({
    document: documentRef,
    window: windowRef,
    HTMLElement: FakeHTMLElement,
    wizardState: {
      closeKeywordAiMaxDemandPopover: null,
      aiMaxDemandPopoverBindTimer: 0,
      aiMaxDemandPopoverBindPending: false,
      aiMaxDemandPopoverBindVisibilityHandler: null,
      aiMaxDemandPopoverListenersBound: false,
      aiMaxDemandPopoverOutsideClick: null,
      aiMaxDemandPopoverEscClose: null
    },
    isWizardDocumentHidden: () => documentRef.visibilityState === 'hidden'
  });
  new Script(`${helperSource}
globalThis.__closeKeywordAiMaxDemandPopover = closeKeywordAiMaxDemandPopover;
globalThis.__scheduleKeywordAiMaxDemandPopoverListenerBind = scheduleKeywordAiMaxDemandPopoverListenerBind;
globalThis.__wizardState = wizardState;`).runInContext(context);
  const setPopoverHandlers = () => {
    context.__wizardState.closeKeywordAiMaxDemandPopover = context.__closeKeywordAiMaxDemandPopover;
    context.__wizardState.aiMaxDemandPopoverOutsideClick = (event) => {
      const target = event?.target;
      if (popover.contains(target) || triggerButton.contains(target)) return;
      context.__closeKeywordAiMaxDemandPopover();
    };
    context.__wizardState.aiMaxDemandPopoverEscClose = (event) => {
      if (event?.key !== 'Escape') return;
      if (typeof event.preventDefault === 'function') event.preventDefault();
      context.__closeKeywordAiMaxDemandPopover();
    };
  };
  return {
    context,
    popover,
    triggerButton,
    outsideNode,
    timers,
    listenerCount(type = 'visibilitychange') {
      return listeners.get(type)?.size || 0;
    },
    getTimerDelays() {
      return Array.from(timers.values()).map(timer => timer.delay);
    },
    setVisibilityState(nextState) {
      visibilityState = String(nextState || 'visible');
      const handlers = Array.from(listeners.get('visibilitychange') || []);
      handlers.forEach(handler => handler({ type: 'visibilitychange' }));
    },
    tickNextTimer() {
      const [timerId, timer] = Array.from(timers.entries())[0] || [];
      if (!timer) return false;
      timers.delete(timerId);
      timer.handler();
      return true;
    },
    fireDocumentClick(target = outsideNode) {
      const handlers = Array.from(listeners.get('click') || []);
      handlers.forEach(handler => handler({ target }));
    },
    fireDocumentKeydown(key = 'Escape') {
      let prevented = false;
      const handlers = Array.from(listeners.get('keydown') || []);
      handlers.forEach(handler => handler({
        key,
        preventDefault() {
          prevented = true;
        }
      }));
      return prevented;
    },
    schedule() {
      setPopoverHandlers();
      context.__scheduleKeywordAiMaxDemandPopoverListenerBind(popover);
    },
    close() {
      context.__closeKeywordAiMaxDemandPopover();
    },
    get wizardState() {
      return context.__wizardState;
    }
  };
}

function getKeywordCustomBidModeBranches() {
  const customBlock = getKeywordCustomSceneBlock();
  const manualMarker = "if (keywordBidMode === 'manual') {";
  const manualStart = customBlock.indexOf(manualMarker);
  assert.ok(manualStart > -1, '自定义推广缺少手动出价分支');
  const manualBlock = extractBraceBlock(customBlock, manualStart, '手动分支');
  const elseStart = customBlock.indexOf('else {', manualBlock.end);
  assert.ok(elseStart > -1, '自定义推广缺少智能出价分支');
  const smartBlock = extractBraceBlock(customBlock, elseStart, '智能分支');
  return {
    manualBranch: manualBlock.body,
    smartBranch: smartBlock.body
  };
}

test('关键词自定义推广隐藏选品方式配置项', () => {
  const block = getKeywordCustomSceneBlock();
  assert.doesNotMatch(
    block,
    /label:\s*'选品方式'/,
    '自定义推广分支仍展示“选品方式”配置项'
  );
  assert.doesNotMatch(
    block,
    /options:\s*\[\s*'自定义选品'\s*,\s*'好货快投-大家电专享'\s*\]/,
    '自定义推广分支仍展示“选品方式”选项'
  );
});

test('关键词自定义推广只展示 AI 点睛开启态创意只读说明，不恢复创意设置分段按钮', () => {
  const block = getKeywordCustomSceneBlock();
  const renderBlock = getRenderSceneDynamicConfigBlock();
  assert.doesNotMatch(
    block,
    /label:\s*'创意设置'/,
    '关键词自定义推广仍在展示“创意设置”按钮组'
  );
  assert.match(
    renderBlock,
    /am-wxt-scene-setting-label">创意设置[\s\S]*当前解决方案下暂不支持设置创意，默认开启智能创意。/,
    'AI点睛开启态缺少原生只读创意设置说明'
  );
  assert.doesNotMatch(
    renderBlock,
    /data-scene-field="\$\{Utils\.escapeHtml\([^}]*创意设置/,
    '只读创意说明不应写入可提交的创意设置字段'
  );
});

test('关键词自定义推广提供 AI点睛独立开关并同步原生 aiMax 字段', () => {
  const block = getRenderSceneDynamicConfigBlock();
  assert.match(
    block,
    /const keywordAiMaxFieldLabel = 'AI点睛';/,
    '自定义推广缺少 AI点睛 独立字段声明'
  );
  assert.match(
    block,
    /buildKeywordAiMaxSwitchRow\(\{[\s\S]*fieldKey:\s*keywordAiMaxFieldKey[\s\S]*selectedValue:\s*keywordAiMaxValue/,
    '自定义推广缺少 AI点睛 开启/关闭开关'
  );
  assert.match(
    block,
    /借助AI点睛开“搜索外挂”，智能识别您表达的搜索流量诉求，精准触达目标客群，有效提升精准流量比例[\s\S]*N7dx2rn0JbxOaqnACQ5kRDGvWMGjLRb3[\s\S]*介绍文档/,
    'AI点睛开关行未对齐原生说明文案和介绍文档入口'
  );
  assert.match(
    block,
    /const keywordAiMaxSwitchField = 'campaign\.aiMaxSwitch';[\s\S]*const keywordAiMaxInfoField = 'campaign\.aiMaxInfo';/,
    'AI点睛开关未绑定 campaign.aiMaxSwitch / campaign.aiMaxInfo'
  );
  assert.match(
    block,
    /keywordAiMaxEnabled[\s\S]*wizardState\.els\.bidModeSelect\.value = 'smart';/,
    '开启 AI点睛 时未强制回到智能出价'
  );
  assert.match(
    block,
    /allowedValues:\s*keywordAiMaxEnabled \? \['smart'\] : \[\]/,
    '开启 AI点睛 时出价方式未限制为智能出价'
  );
  assert.match(
    block,
    /开启‘AI点睛’后仅支持智能出价。如需使用手动出价，可关闭该功能。/,
    'AI点睛开启时出价方式提示未对齐原生完整文案'
  );
  assert.match(
    block,
    /keywordAvgDealCostVisibleLabel = keywordAiMaxEnabled[\s\S]*设置平均直接净成交成本（非必要）[\s\S]*设置平均成交成本/,
    'AI点睛开启态获取成交量成本项可见文案未对齐原生'
  );
  assert.match(
    block,
    /buildInlineSceneInputControl\([\s\S]*'目标成本'[\s\S]*keywordAvgDealCostFieldKey[\s\S]*\{ unit: '元', hideLabel: keywordAiMaxEnabled \}/,
    'AI点睛开启态成本输入仍可能显示额外“目标成本”小标签'
  );
  assert.match(
    block,
    /buildKeywordAiMaxInsightPanelRow\(/,
    '开启 AI点睛 后缺少添加商品后的原生同构详情面板'
  );
  assert.match(
    block,
    /表达更多流量诉求/,
    'AI点睛详情面板缺少“表达更多流量诉求”入口'
  );
  assert.match(
    block,
    /KEYWORD_AI_MAX_TEMPLATE_LIST[\s\S]*提升商品质量分[\s\S]*核心流量竞争[\s\S]*热门流量追踪[\s\S]*低成本稳增长[\s\S]*爆品拉新破圈[\s\S]*新品快速测款/,
    'AI点睛设置缺少原生 6 个模板推荐'
  );
  assert.match(
    block,
    /centerShieldWordList[\s\S]*exactShieldWordList[\s\S]*selectedDemandList/,
    'AI点睛设置缺少屏蔽词和已选需求结构化字段'
  );

  const mappingBlock = getResolveSceneSettingOverridesBlock();
  assert.match(
    mappingBlock,
    /const keywordAiMaxEntry = normalizedSceneName === '关键词推广'[\s\S]*findSceneSettingEntry\(entries,\s*\[\/AI点睛\/\]\)/,
    '提交流程未识别 AI点睛 设置'
  );
  assert.match(
    mappingBlock,
    /applyCampaign\('aiMaxSwitch',\s*keywordAiMaxSwitch/,
    'AI点睛未映射到 campaign.aiMaxSwitch'
  );
  assert.match(
    mappingBlock,
    /applyCampaign\([\s\S]*'aiMaxInfo'[\s\S]*\{ aiMaxSwitch: keywordAiMaxSwitch \}/,
    'AI点睛未映射到 campaign.aiMaxInfo.aiMaxSwitch'
  );
});

test('关键词预算类型按原生顺序展示日均预算在前', () => {
  const selectStart = source.indexOf('<select id="am-wxt-keyword-budget-type"');
  assert.ok(selectStart > -1, '无法定位关键词预算类型 select');
  const selectEnd = source.indexOf('</select>', selectStart);
  assert.ok(selectEnd > selectStart, '无法定位关键词预算类型 select 结束');
  const selectBlock = source.slice(selectStart, selectEnd);
  assert.ok(
    selectBlock.indexOf('value="day_average"') > -1
      && selectBlock.indexOf('value="day_budget"') > -1
      && selectBlock.indexOf('value="day_average"') < selectBlock.indexOf('value="day_budget"'),
    '关键词预算类型未按原生顺序展示：日均预算应在每日预算前'
  );
});

test('关键词自定义推广智能出价展示人群优化目标面板并保留 crowd 开关映射兼容', () => {
  const { smartBranch } = getKeywordCustomBidModeBranches();
  assert.match(
    smartBranch,
    /buildKeywordSmartCrowdTargetPanelRow\(/,
    '自定义推广智能出价分支缺少“人群优化目标”同构面板'
  );
  assert.match(
    smartBranch,
    /targetFieldKey:\s*keywordCrowdTargetFieldKey[\s\S]*campaignFieldKey:\s*crowdCampaignField/,
    '人群优化目标面板未绑定目标字段与 campaign.crowdList'
  );

  const mappingBlock = getResolveSceneSettingOverridesBlock();
  assert.match(
    mappingBlock,
    /const crowdTargetEntry = findSceneSettingEntry\(entries,\s*\[\/人群优化目标\/,\s*\/客户口径设置\/,\s*\/人群价值设置\//,
    '提交流程未识别“人群优化目标”'
  );
});

test('关键词自定义推广智能出价人群设置复刻原生 checkbox 结构', () => {
  const { smartBranch } = getKeywordCustomBidModeBranches();
  assert.match(
    smartBranch,
    /buildKeywordSmartCrowdPriorityRow\(/,
    '智能出价人群设置未切到原生 checkbox 行渲染'
  );
  assert.match(
    smartBranch,
    /helpText:\s*'智能出价方式下，可通过人群设置，提高特定客户的投放权重。特别的，价值设置用于调整算法的出价系数，并不等于最终的出价。'/,
    '智能出价人群设置缺少原生提示文案'
  );
  assert.match(
    smartBranch,
    /description:\s*'支持对特定客户设置更高权重，进行优先获取。'/,
    '智能出价人群设置缺少原生说明文案'
  );
  assert.match(
    smartBranch,
    /detailUrl:\s*'https:\/\/alidocs\.dingtalk\.com\/i\/nodes\/Y1OQX0akWmzdBowLFk0vRgKlVGlDd3mE'/,
    '智能出价人群设置缺少原生“了解详情”跳转'
  );
  assert.doesNotMatch(
    smartBranch,
    /options:\s*\[\s*'设置优先投放客户'\s*,\s*'关闭'\s*\]/,
    '智能出价人群设置仍在使用旧的分段按钮结构'
  );
});

test('关键词自定义推广增加点击量默认目标成本为0.5，且不覆盖手动清空', () => {
  const { smartBranch } = getKeywordCustomBidModeBranches();
  assert.match(
    smartBranch,
    /const keywordAvgClickCostTouched = !!\([\s\S]*touchedBucket\[keywordAvgClickCostFieldKey\][\s\S]*touchedBucket\[keywordAvgClickCostFieldLabel\][\s\S]*\);/,
    '增加点击量目标成本缺少手动编辑保护判断'
  );
  assert.match(
    smartBranch,
    /if \(!keywordAvgClickCostValue && !keywordAvgClickCostTouched\) \{[\s\S]*keywordAvgClickCostValue = '0\.5';[\s\S]*\}/,
    '增加点击量目标成本未默认回填 0.5'
  );
});

test('关键词自定义推广手动出价展示原生人群弹窗入口并隐藏人群优化目标', () => {
  const { manualBranch } = getKeywordCustomBidModeBranches();
  assert.match(
    manualBranch,
    /label:\s*'人群设置'[\s\S]*?trigger:\s*'crowd'/,
    '自定义推广手动出价缺少“人群设置”弹窗入口'
  );
  assert.match(
    manualBranch,
    /label:\s*'人群设置'[\s\S]*?title:\s*'添加精选人群'/,
    '手动出价“人群设置”弹窗标题未对齐原生“添加精选人群”'
  );
  assert.doesNotMatch(
    manualBranch,
    /label:\s*'人群优化目标'/,
    '手动出价仍展示无效“人群优化目标”配置'
  );
  assert.match(
    manualBranch,
    /label:\s*'投放资源位\/投放地域\/分时折扣'/,
    '手动出价缺少原生“投放资源位/投放地域/分时折扣”组合设置'
  );
});

test('关键词自定义推广出价目标过滤掉卡位目标，仅保留原生目标集合', () => {
  assert.match(
    source,
    /const keywordCustomBidTargetAllowedValues = \['conv', 'similar_item', 'market_penetration', 'fav_cart', 'click', 'roi'\];/,
    'AI点睛关闭时自定义推广“出价目标”白名单常量缺失'
  );
  assert.match(
    source,
    /const keywordAiMaxBidTargetAllowedValues = \['conv', 'fav_cart', 'click', 'roi'\];/,
    'AI点睛开启时自定义推广“出价目标”原生白名单常量缺失'
  );
  assert.match(
    source,
    /allowedValues:\s*activeKeywordGoal === '自定义推广'[\s\S]*\?\s*\(keywordAiMaxEnabled \? keywordAiMaxBidTargetAllowedValues : keywordCustomBidTargetAllowedValues\)[\s\S]*:\s*\(activeKeywordGoal === '趋势明星' \? keywordTrendBidTargetAllowedValues : \[\]\)/,
    '自定义推广“出价目标”未按 AI点睛 开关启用原生白名单过滤'
  );
  assert.match(
    source,
    /resolveOptionText:\s*\(\{ value, text \}\) => \([\s\S]*activeKeywordGoal === '自定义推广' && value === 'market_penetration'[\s\S]*\? '提升词市场渗透'[\s\S]*: text/,
    'AI点睛关闭时自定义推广“出价目标”未对齐原生“提升词市场渗透”文案'
  );
  assert.doesNotMatch(
    source,
    /keywordCustomBidTargetAllowedValues[\s\S]*'search_rank'/,
    '自定义推广“出价目标”错误包含卡位目标 search_rank'
  );
});

test('AI点睛添加商品后重渲染并隐藏关键词/人群独立设置', () => {
  const block = getRenderSceneDynamicConfigBlock();
  assert.match(
    block,
    /const keywordAiMaxPrimaryItem = activeKeywordGoal === '自定义推广'[\s\S]*resolveKeywordAiMaxPrimaryItem\(\)/,
    'AI点睛未读取已添加商品作为生成上下文'
  );
  assert.match(
    block,
    /const keywordAiMaxHasItem = !!\([\s\S]*toIdValue\(keywordAiMaxPrimaryItem\?\.materialId[\s\S]*normalizeKeywordAiMaxItemTitle\(keywordAiMaxPrimaryItem\)/,
    'AI点睛未判断添加商品后才展示完整解析面板'
  );
  assert.match(
    block,
    /if \(!keywordAiMaxHasItem\) \{[\s\S]*buildKeywordAiMaxPendingPanelRow\([\s\S]*AI点睛正在按原生接口生成投放内容，请稍候[\s\S]*buildKeywordAiMaxInsightPanelRow\(/,
    'AI点睛缺少添加商品前等待、生成中和详情面板切换'
  );
  assert.match(
    block,
    /if \(!keywordAiMaxEnabled\) \{[\s\S]*buildKeywordCustomKeywordSettingRow\([\s\S]*buildKeywordSmartCrowdPriorityRow\([\s\S]*buildKeywordSmartCrowdTargetPanelRow\(/,
    'AI点睛开启时未隐藏关键词设置、人群设置和人群优化目标'
  );
  assert.match(
    source,
    /commitItemSelectionUiState = \(options = \{\}\) => \{[\s\S]*if \(options\.renderSceneDynamic === true\) \{[\s\S]*wizardState\.detailVisible === true \|\| wizardState\.workbenchPage === 'editor'[\s\S]*renderSceneDynamicConfig\(\);[\s\S]*wizardState\.sceneDynamicDirty = true;/,
    '添加商品状态提交应在编辑页可见时重渲染场景设置，隐藏时只标记 dirty'
  );
  assert.match(
    source,
    /wizardState\.addedItems\.push\(item\);[\s\S]*commitItemSelectionUiState\(\{[\s\S]*renderSceneDynamic:\s*true/,
    '单个添加商品后未刷新 AI点睛动态面板'
  );
  assert.match(
    source,
    /wizardState\.addedItems = wizardState\.addedItems\.concat\(pick\);[\s\S]*commitItemSelectionUiState\(\{[\s\S]*renderSceneDynamic:\s*true/,
    '全部添加商品后未刷新 AI点睛动态面板'
  );
  assert.match(
    source,
    /wizardState\.addedItems = \[\];[\s\S]*commitItemSelectionUiState\(\{[\s\S]*renderSceneDynamic:\s*true/,
    '清空商品后未刷新 AI点睛动态面板'
  );
});

test('AI点睛添加商品后走原生接口生成，不再本地写死解析结果', () => {
  const block = getRenderSceneDynamicConfigBlock();
  assert.doesNotMatch(
    block,
    /KEYWORD_AI_MAX_DEFAULT_ITEM_TITLE|buildKeywordAiMaxDerivedInfo|KEYWORD_AI_MAX_DEFAULT_DEMANDS|KEYWORD_AI_MAX_DEFAULT_SEARCH_WORDS|KEYWORD_AI_MAX_DEFAULT_PERSONAS/,
    'AI点睛仍保留本地默认标题/需求/搜索词/人群画像生成逻辑'
  );
  assert.doesNotMatch(
    source,
    /amount:\s*'890'|clickEstimate:\s*'2747'/,
    'AI点睛仍写死预算 890 或点击量 2747'
  );
  assert.match(
    source,
    /const parseAiMaxEventStream = \(rawText = ''\) =>[\s\S]*const requestAiMaxBusinessTalk = async[\s\S]*https:\/\/ai\.alimama\.com\/ai\/chat\/businessTalk\.json[\s\S]*parseAiMaxEventStream\(rawText\)/,
    'AI点睛缺少原生 businessTalk 事件流生成链路'
  );
  assert.match(
    source,
    /additionalData\.aiMaxInfo/,
    'AI点睛没有读取原生返回的 additionalData.aiMaxInfo'
  );
  assert.match(
    source,
    /const normalizeNativeAiMaxInfo = \(\{[\s\S]*budgetSuggestion[\s\S]*ENDPOINTS\.budgetSuggestion[\s\S]*ENDPOINTS\.effectPrediction/,
    'AI点睛缺少预算建议和效果预估的原生数据归一化'
  );
  assert.match(
    block,
    /keywordAiMaxGenerationMap[\s\S]*ensureKeywordAiMaxGeneration[\s\S]*fetchKeywordAiMaxInfo/,
    'AI点睛添加商品后未接入异步生成状态'
  );
  assert.match(
    block,
    /AI点睛正在按原生接口生成投放内容，请稍候[\s\S]*AI点睛生成失败/,
    'AI点睛缺少接口等待或失败状态'
  );
  assert.match(
    block,
    /if \(!info\.nativeGenerated && !info\.nativeSource\)[\s\S]*buildKeywordAiMaxPendingPanelRow/,
    'AI点睛无原生数据时仍可能渲染完整内容面板'
  );
  assert.match(
    block,
    /AI小万建议[\s\S]*预计可获得点击量[\s\S]*建议日均预算/,
    'AI点睛详情面板缺少原生预算建议展示'
  );
  assert.match(
    block,
    /class="am-wxt-ai-max-demand-summary"[\s\S]*data-scene-popup-summary="\$\{Utils\.escapeHtml\(popupTrigger\)\}"[\s\S]*<span>已选：<\/span>[\s\S]*\$\{\(Array\.isArray\(info\.selectedDemandList\)/,
    'AI点睛缺少原生右侧“已选：N个需求”入口'
  );
  assert.match(
    block,
    /resolveKeywordAiMaxDemandDetail[\s\S]*nativeCrowdList[\s\S]*data-ai-max-demand-analysis[\s\S]*data-ai-max-demand-search-words[\s\S]*data-ai-max-demand-personas/,
    'AI点睛需求卡片未绑定原生逐需求解析、搜索词和人群画像'
  );
  assert.match(
    source,
    /data-ai-max-demand-preview[\s\S]*addEventListener\('click'[\s\S]*data-ai-max-analysis-target[\s\S]*data-ai-max-word-target[\s\S]*data-ai-max-persona-target/,
    'AI点睛需求卡片不能点击切换当前解析详情'
  );
  assert.match(
    source,
    /const aiMaxDeepSteps = \[[\s\S]*第1步：计划定向画像分析[\s\S]*第2步：关键词深度分析[\s\S]*第3步：流入流失竞对分析[\s\S]*第4步：同行定向画像分析[\s\S]*第5步：搜索需求分析/,
    'AI点睛展开详情缺少原生 5 步深度分析结构'
  );
  assert.match(
    source,
    /am-wxt-ai-max-deep-detail hidden[\s\S]*data-ai-max-detail-section="deep"[\s\S]*\$\{aiMaxDeepStepHtml\}/,
    'AI点睛展开详情缺少 5 步分析容器挂载点'
  );
  assert.match(
    source,
    /class="am-wxt-ai-max-detail-grid" data-ai-max-demand-detail-grid="1"[\s\S]*<b>热门搜索词<\/b>[\s\S]*<b>搜索人群画像与特征<\/b>/,
    'AI点睛热门搜索词和搜索人群画像默认应常驻展开'
  );
  assert.match(
    source,
    /querySelectorAll\('\[data-ai-max-detail-section="deep"\]'\)[\s\S]*classList\.toggle\('hidden', expanded\)/,
    'AI点睛展开详情按钮应只控制 5 步深度分析，不应隐藏热门搜索词版块'
  );
  assert.match(
    source,
    /const runAiMaxTypewriter = \(panel = null\) =>[\s\S]*data-ai-max-typewriter-text[\s\S]*const scheduleNextAiMaxTypewriterStep = \(\) => \{[\s\S]*window\.setTimeout\(\(\) => \{[\s\S]*target\.textContent = fullText\.slice/,
    'AI点睛展开详情缺少可取消 timeout 逐字展示逻辑'
  );
  assert.doesNotMatch(
    source,
    /runAiMaxTypewriter[\s\S]*window\.setInterval/,
    'AI点睛逐字动效不应再使用固定 interval'
  );
  assert.doesNotMatch(
    source,
    /cleanupAiMaxTypewriterTimers[\s\S]*window\.clearInterval/,
    'AI点睛逐字动效 cleanup 不应再保留 interval 清理分支'
  );
  assert.match(
    source,
    /aiMaxTypewriterTimers:\s*new Map\(\),[\s\S]*aiMaxTypewriterCleanupRegistered:\s*false,[\s\S]*aiMaxTypewriterVisibilityHandler:\s*null,/,
    'AI点睛逐字动效缺少 timer、cleanup 和 visibility 状态声明'
  );
  assert.match(
    source,
    /const clearAiMaxTypewriterVisibilityHandler = \(\) => \{[\s\S]*document\.removeEventListener\('visibilitychange', handler\);[\s\S]*wizardState\.aiMaxTypewriterVisibilityHandler = null;/,
    'AI点睛逐字动效缺少 visibilitychange 监听释放 helper'
  );
  assert.match(
    source,
    /const finishAiMaxTypewriterPendingTargets = \(\) => \{[\s\S]*const finishedTargets = new Set\(\);[\s\S]*finishAiMaxTypewriterTarget\(target, fullText\);[\s\S]*finishedTargets\.add\(target\);/,
    'AI点睛逐字动效隐藏页收口应按目标去重并填完全文本'
  );
  assert.match(
    source,
    /const clearAiMaxTypewriterTimerRecords = \(\) => \{[\s\S]*window\.clearTimeout\(record\.timerId\);[\s\S]*delete record\.target\.dataset\[record\.datasetKey\];[\s\S]*wizardState\.aiMaxTypewriterTimers\.clear\(\);/,
    'AI点睛逐字动效 timeout 必须支持统一释放 timer 记录'
  );
  assert.match(
    source,
    /const flushAiMaxTypewriterTimersForHiddenPage = \(\) => \{[\s\S]*finishAiMaxTypewriterPendingTargets\(\);[\s\S]*clearAiMaxTypewriterTimerRecords\(\);[\s\S]*clearAiMaxTypewriterVisibilityHandler\(\);/,
    'AI点睛逐字动效隐藏页收口必须同时完成文本、清 timer 和释放 visibility handler'
  );
  assert.match(
    source,
    /const bindAiMaxTypewriterVisibilityHandler = \(\) => \{[\s\S]*if \(typeof wizardState\.aiMaxTypewriterVisibilityHandler === 'function'\) return;[\s\S]*if \(!isAiMaxTypewriterHidden\(\)\) return;[\s\S]*flushAiMaxTypewriterTimersForHiddenPage\(\);[\s\S]*document\.addEventListener\('visibilitychange', wizardState\.aiMaxTypewriterVisibilityHandler\);/,
    'AI点睛逐字动效应通过 visibilitychange 在转隐藏时立即收口'
  );
  assert.match(
    source,
    /const cleanupAiMaxTypewriterTimers = \(\) => \{[\s\S]*clearAiMaxTypewriterTimerRecords\(\);[\s\S]*clearAiMaxTypewriterVisibilityHandler\(\);[\s\S]*wizardState\.aiMaxTypewriterCleanupRegistered = false;/,
    'AI点睛逐字动效 cleanup 必须清 timer、释放 visibility handler 并重置注册状态'
  );
  assert.match(
    source,
    /wizardState\.cleanupHandlers = Array\.isArray\(wizardState\.cleanupHandlers\)[\s\S]*wizardState\.cleanupHandlers\.push\(cleanupAiMaxTypewriterTimers\);[\s\S]*wizardState\.aiMaxTypewriterCleanupRegistered = true;/,
    'AI点睛逐字动效 timer cleanup 必须注册进向导 cleanupHandlers'
  );
  assert.match(
    source,
    /const trackAiMaxTypewriterTimer = \(type = '', timerId = 0, target = null, datasetKey = '', fullText = ''\) => \{[\s\S]*const record = \{ type, timerId: id, target, datasetKey, fullText \};[\s\S]*bindAiMaxTypewriterVisibilityHandler\(\);[\s\S]*registerAiMaxTypewriterCleanup\(\);/,
    'AI点睛逐字动效 timer 记录必须保存 fullText 并绑定 visibility handler'
  );
  assert.match(
    source,
    /const delayTimer = window\.setTimeout\(\(\) => \{[\s\S]*releaseAiMaxTypewriterTimer\('timeout', delayTimer\);[\s\S]*scheduleNextAiMaxTypewriterStep\(\);[\s\S]*trackAiMaxTypewriterTimer\('timeout', delayTimer, target, 'aiMaxTypeDelayTimer', fullText\);/,
    'AI点睛逐字动效 delay timeout 必须登记到 wizardState timer 表'
  );
  assert.match(
    source,
    /const stepTimer = window\.setTimeout\(\(\) => \{[\s\S]*releaseAiMaxTypewriterTimer\('timeout', stepTimer\);[\s\S]*if \(cursor < fullText\.length\) \{[\s\S]*scheduleNextAiMaxTypewriterStep\(\);[\s\S]*trackAiMaxTypewriterTimer\('timeout', stepTimer, target, 'aiMaxTypeTimer', fullText\);/,
    'AI点睛逐字动效 step timeout 必须逐步登记并在完成后释放'
  );
  assert.match(
    source,
    /const isAiMaxTypewriterHidden = \(\) => document\.visibilityState === 'hidden';[\s\S]*const shouldFinishImmediately = \(\) => isAiMaxTypewriterHidden\(\) \|\| target\.isConnected === false;[\s\S]*if \(shouldFinishImmediately\(\)\) \{[\s\S]*finishAiMaxTypewriterTarget\(target, fullText\);/,
    'AI点睛逐字动效必须在隐藏页或目标断开时直接完成文本并释放 timer'
  );
  assert.match(
    source,
    /class="am-wxt-ai-max-demand-next"[\s\S]*data-ai-max-demand-next="1"[\s\S]*aria-label="查看更多AI点睛需求"/,
    'AI点睛需求卡片超过 3 个时缺少右侧灰色切换箭头'
  );
  assert.match(
    source,
    /data-ai-max-demand-next="1"[\s\S]*data-ai-max-demand-list="1"[\s\S]*(scrollBy|scrollTo)/,
    'AI点睛需求卡片右侧箭头缺少滚动切换逻辑'
  );
  assert.match(
    source,
    /aiMaxDemandPopoverBindTimer:\s*0,[\s\S]*aiMaxDemandPopoverBindPending:\s*false,[\s\S]*aiMaxDemandPopoverBindVisibilityHandler:\s*null,[\s\S]*aiMaxDemandPopoverListenersBound:\s*false,[\s\S]*aiMaxDemandPopoverOutsideClick:\s*null,[\s\S]*aiMaxDemandPopoverEscClose:\s*null,/,
    'AI点睛需求弹层缺少 bind timer、pending、visibility 和 document listener 生命周期状态声明'
  );
  assert.match(
    source,
    /const clearKeywordAiMaxDemandPopoverBindVisibilityHandler = \(\) => \{[\s\S]*document\.removeEventListener\('visibilitychange', wizardState\.aiMaxDemandPopoverBindVisibilityHandler\);[\s\S]*wizardState\.aiMaxDemandPopoverBindVisibilityHandler = null;[\s\S]*\};/,
    'AI点睛需求弹层 bind 应支持释放 visibilitychange handler'
  );
  assert.match(
    source,
    /const clearKeywordAiMaxDemandPopoverBindTimer = \(\) => \{[\s\S]*window\.clearTimeout\(wizardState\.aiMaxDemandPopoverBindTimer\);[\s\S]*wizardState\.aiMaxDemandPopoverBindTimer = 0;[\s\S]*clearKeywordAiMaxDemandPopoverBindVisibilityHandler\(\);[\s\S]*wizardState\.aiMaxDemandPopoverBindPending = false;[\s\S]*\};/,
    'AI点睛需求弹层 bind timer 应统一清理 timer、visibility 和 pending 状态'
  );
  assert.match(
    source,
    /const unbindKeywordAiMaxDemandPopoverDocumentListeners = \(\) => \{[\s\S]*document\.removeEventListener\('click', wizardState\.aiMaxDemandPopoverOutsideClick, true\);[\s\S]*document\.removeEventListener\('keydown', wizardState\.aiMaxDemandPopoverEscClose, true\);[\s\S]*wizardState\.aiMaxDemandPopoverListenersBound = false;[\s\S]*\};/,
    'AI点睛需求弹层关闭时必须释放已绑定 document 监听'
  );
  assert.match(
    source,
    /const bindKeywordAiMaxDemandPopoverBindVisibilityHandler = \(popover = null\) => \{[\s\S]*if \(typeof wizardState\.aiMaxDemandPopoverBindVisibilityHandler === 'function'\) return;[\s\S]*if \(isWizardDocumentHidden\(\)\) \{[\s\S]*window\.clearTimeout\(wizardState\.aiMaxDemandPopoverBindTimer\);[\s\S]*wizardState\.aiMaxDemandPopoverBindTimer = 0;[\s\S]*return;[\s\S]*scheduleKeywordAiMaxDemandPopoverListenerBind\(popover\);[\s\S]*document\.addEventListener\('visibilitychange', wizardState\.aiMaxDemandPopoverBindVisibilityHandler\);/,
    'AI点睛需求弹层 bind 应在隐藏时取消 timer，恢复可见后继续同一个 pending bind'
  );
  assert.match(
    source,
    /const scheduleKeywordAiMaxDemandPopoverListenerBind = \(popover = null\) => \{[\s\S]*clearKeywordAiMaxDemandPopoverBindTimer\(\);[\s\S]*wizardState\.aiMaxDemandPopoverBindPending = true;[\s\S]*bindKeywordAiMaxDemandPopoverBindVisibilityHandler\(popover\);[\s\S]*if \(isWizardDocumentHidden\(\)\) return;[\s\S]*wizardState\.aiMaxDemandPopoverBindTimer = window\.setTimeout\(\(\) => \{[\s\S]*wizardState\.aiMaxDemandPopoverBindTimer = 0;[\s\S]*if \(isWizardDocumentHidden\(\)\) return;[\s\S]*bindKeywordAiMaxDemandPopoverDocumentListeners\(popover\);[\s\S]*clearKeywordAiMaxDemandPopoverBindVisibilityHandler\(\);[\s\S]*wizardState\.aiMaxDemandPopoverBindPending = false;[\s\S]*\}, 0\);[\s\S]*\};/,
    'AI点睛需求弹层延迟绑定应隐藏页暂停，可见页按 0ms 延迟绑定，并在触发前复核隐藏态'
  );
  assert.match(
    source,
    /const closeKeywordAiMaxDemandPopover = \(\) => \{[\s\S]*clearKeywordAiMaxDemandPopoverBindTimer\(\);[\s\S]*unbindKeywordAiMaxDemandPopoverDocumentListeners\(\);[\s\S]*wizardState\.aiMaxDemandPopoverOutsideClick = null;[\s\S]*wizardState\.aiMaxDemandPopoverEscClose = null;[\s\S]*\};/,
    'AI点睛需求弹层关闭时必须清理 bind timer、visibility、pending 和 document listener'
  );
  assert.match(
    source,
    /wizardState\.closeKeywordAiMaxDemandPopover = closeKeywordAiMaxDemandPopover;[\s\S]*scheduleKeywordAiMaxDemandPopoverListenerBind\(popover\);/,
    'AI点睛需求弹层打开后应通过统一 helper 延迟绑定外点和 ESC 监听'
  );
  assert.match(
    source,
    /const unbindAiMaxDetailDelegatedHandlers = \(\) => \{[\s\S]*document\.removeEventListener\('click', wizardState\.aiMaxDetailToggleClickHandler\);[\s\S]*document\.removeEventListener\('click', wizardState\.aiMaxStepToggleClickHandler\);[\s\S]*document\.removeEventListener\('click', wizardState\.aiMaxDemandNextClickHandler\);[\s\S]*wizardState\.aiMaxDetailDelegatedBound = false;/,
    'AI点睛详情区 document click 委托关闭向导时必须释放'
  );
  assert.match(
    source,
    /wizardState\.aiMaxDetailToggleClickHandler = \(event\) => \{[\s\S]*wizardState\.aiMaxStepToggleClickHandler = \(event\) => \{[\s\S]*wizardState\.aiMaxDemandNextClickHandler = \(event\) => \{[\s\S]*document\.addEventListener\('click', wizardState\.aiMaxDetailToggleClickHandler\);[\s\S]*document\.addEventListener\('click', wizardState\.aiMaxStepToggleClickHandler\);[\s\S]*document\.addEventListener\('click', wizardState\.aiMaxDemandNextClickHandler\);/,
    'AI点睛详情区 document click 委托必须使用可解绑的命名 handler'
  );
  assert.match(
    source,
    /wizardState\.cleanupHandlers = Array\.isArray\(wizardState\.cleanupHandlers\)[\s\S]*wizardState\.cleanupHandlers\.push\(unbindAiMaxDetailDelegatedHandlers\);[\s\S]*wizardState\.aiMaxDetailDelegatedCleanupRegistered = true;/,
    'AI点睛详情区 document click 委托解绑函数必须注册进向导 cleanupHandlers'
  );
  assert.doesNotMatch(
    source,
    /aiMaxDetailDelegatedBound[\s\S]{0,180}document\.addEventListener\('click', \(event\) => \{/,
    'AI点睛详情区不能继续注册匿名 document click 委托'
  );
  assert.match(
    source,
    /data-ai-max-demand-selector-trigger="1"[\s\S]*data-ai-max-info-field="\$\{Utils\.escapeHtml\(normalizedInfoField\)\}"/,
    'AI点睛“5个需求”入口未绑定独立需求下拉浮层'
  );
  assert.match(
    source,
    /openKeywordAiMaxDemandPopover[\s\S]*am-wxt-ai-max-demand-popover[\s\S]*data-ai-max-demand-popover-all="1"[\s\S]*data-ai-max-demand-popover-confirm="1"[\s\S]*data-ai-max-demand-popover-cancel="1"/,
    'AI点睛“5个需求”缺少原生小浮层的全选、确定和取消结构'
  );
  assert.doesNotMatch(
    source,
    /class="am-wxt-ai-max-demand-summary"[\s\S]{0,500}data-scene-popup-trigger-proxy="\$\{Utils\.escapeHtml\(popupTrigger\)\}"/,
    'AI点睛“5个需求”仍复用完整设置弹窗，而不是原生小浮层'
  );
});

test('AI点睛逐字动效隐藏页切换会立即完成文本并释放 timer', () => {
  const hiddenHarness = createAiMaxTypewriterHarness('hidden');
  const hiddenTarget = new hiddenHarness.FakeHTMLElement({
    attributes: { 'data-ai-max-typewriter-text': '隐藏页直接完成' }
  });
  const hiddenPanel = new hiddenHarness.FakeHTMLElement({ children: [hiddenTarget] });
  hiddenHarness.run(hiddenPanel);
  assert.equal(hiddenTarget.textContent, '隐藏页直接完成', '隐藏页启动时应直接填完文本');
  assert.equal(hiddenTarget.dataset.aiMaxTyped, '1', '隐藏页启动时应标记完成');
  assert.equal(hiddenHarness.timers.size, 0, '隐藏页启动不应排逐字动效 timeout');
  assert.equal(hiddenHarness.listenerCount(), 0, '隐藏页启动不应绑定 visibilitychange');

  const visibleHarness = createAiMaxTypewriterHarness('visible');
  const visibleTarget = new visibleHarness.FakeHTMLElement({
    attributes: { 'data-ai-max-typewriter-text': '可见页转隐藏完成' }
  });
  const visiblePanel = new visibleHarness.FakeHTMLElement({ children: [visibleTarget] });
  visibleHarness.run(visiblePanel);
  assert.deepEqual(visibleHarness.getTimerDelays(), [0], '可见页第一个目标应先排 0ms delay timeout');
  assert.equal(visibleHarness.listenerCount(), 1, '可见页排 timer 后应绑定 visibilitychange');
  assert.equal(visibleHarness.wizardState.cleanupHandlers.length, 1, '可见页排 timer 后应注册向导 cleanup');
  assert.equal(visibleTarget.textContent, '', '可见页启动后应进入逐字展示初始态');

  visibleHarness.setVisibilityState('hidden');
  assert.equal(visibleHarness.timers.size, 0, '转隐藏时应立即清理 pending timeout');
  assert.equal(visibleTarget.textContent, '可见页转隐藏完成', '转隐藏时应立即填完全文本');
  assert.equal(visibleTarget.dataset.aiMaxTyped, '1', '转隐藏完成后应保留完成标记');
  assert.equal(visibleTarget.dataset.aiMaxTypeDelayTimer, undefined, '转隐藏完成后应清理 delay timer 标记');
  assert.equal(visibleTarget.dataset.aiMaxTypeTimer, undefined, '转隐藏完成后应清理 step timer 标记');
  assert.equal(visibleHarness.listenerCount(), 0, '转隐藏收口后应解绑 visibilitychange');
  assert.equal(visibleHarness.wizardState.aiMaxTypewriterCleanupRegistered, true, '隐藏页收口不应重复/提前取消向导 cleanup 注册');

  visibleHarness.cleanup();
  assert.equal(visibleHarness.wizardState.aiMaxTypewriterCleanupRegistered, false, '关闭向导 cleanup 后应重置注册状态');
  assert.equal(visibleHarness.listenerCount(), 0, '关闭向导 cleanup 后不应残留 visibilitychange');

  const stepHarness = createAiMaxTypewriterHarness('visible');
  const stepTarget = new stepHarness.FakeHTMLElement({
    attributes: { 'data-ai-max-typewriter-text': 'AB' }
  });
  const stepPanel = new stepHarness.FakeHTMLElement({ children: [stepTarget] });
  stepHarness.run(stepPanel);
  assert.equal(stepHarness.tickNextTimer(), true, '应触发 delay timer');
  assert.deepEqual(stepHarness.getTimerDelays(), [14], 'delay 后应按 14ms 排 step timer');
  assert.equal(stepTarget.dataset.aiMaxTypeDelayTimer, undefined, 'delay timer 触发后应释放 delay 标记');
  stepHarness.setVisibilityState('hidden');
  assert.equal(stepHarness.timers.size, 0, 'step timer pending 时转隐藏应清理 timer');
  assert.equal(stepTarget.textContent, 'AB', 'step timer pending 时转隐藏应填完全文本');
  assert.equal(stepHarness.listenerCount(), 0, 'step timer pending 时转隐藏应释放 listener');
});

test('AI点睛需求弹层外点监听绑定 timer 在隐藏页暂停并恢复可见后补排', () => {
  const hiddenHarness = createAiMaxDemandPopoverBindHarness('hidden');
  hiddenHarness.schedule();
  assert.equal(hiddenHarness.timers.size, 0, '隐藏页不应排 0ms 外点监听绑定 timeout');
  assert.equal(hiddenHarness.listenerCount('visibilitychange'), 1, '隐藏页应保留 visibilitychange 恢复监听');
  assert.equal(hiddenHarness.listenerCount('click'), 0, '隐藏页不应立即绑定 document click');
  assert.equal(hiddenHarness.listenerCount('keydown'), 0, '隐藏页不应立即绑定 document keydown');
  assert.equal(hiddenHarness.wizardState.aiMaxDemandPopoverBindPending, true, '隐藏页应保留 pending bind');

  hiddenHarness.setVisibilityState('visible');
  assert.deepEqual(hiddenHarness.getTimerDelays(), [0], '恢复可见后应按原 0ms 节奏补排监听绑定');
  assert.equal(hiddenHarness.listenerCount('click'), 0, '补排 timer 触发前仍不应同步绑定 click，避免当前点击自关闭');
  assert.equal(hiddenHarness.tickNextTimer(), true, '应能触发恢复后的 0ms bind timeout');
  assert.equal(hiddenHarness.listenerCount('visibilitychange'), 0, '绑定完成后应释放 visibilitychange');
  assert.equal(hiddenHarness.listenerCount('click'), 1, '绑定完成后应绑定一次 document click');
  assert.equal(hiddenHarness.listenerCount('keydown'), 1, '绑定完成后应绑定一次 document keydown');
  assert.equal(hiddenHarness.wizardState.aiMaxDemandPopoverBindPending, false, '绑定完成后应释放 pending bind');

  hiddenHarness.fireDocumentClick(hiddenHarness.triggerButton);
  assert.equal(hiddenHarness.popover.isConnected, true, '点击 triggerButton 不应触发外点关闭');
  hiddenHarness.fireDocumentClick(hiddenHarness.popover);
  assert.equal(hiddenHarness.popover.isConnected, true, '点击 popover 内部不应触发外点关闭');
  const prevented = hiddenHarness.fireDocumentKeydown('Escape');
  assert.equal(prevented, true, 'ESC 关闭时应 preventDefault');
  assert.equal(hiddenHarness.popover.isConnected, false, 'ESC 应关闭需求弹层');
  assert.equal(hiddenHarness.listenerCount('click'), 0, '关闭后应释放 document click');
  assert.equal(hiddenHarness.listenerCount('keydown'), 0, '关闭后应释放 document keydown');

  const visibleHarness = createAiMaxDemandPopoverBindHarness('visible');
  visibleHarness.schedule();
  assert.deepEqual(visibleHarness.getTimerDelays(), [0], '可见页应保留原 0ms 延迟绑定 timeout');
  assert.equal(visibleHarness.listenerCount('visibilitychange'), 1, '可见页等待 bind 时应监听 visibilitychange');
  assert.equal(visibleHarness.listenerCount('click'), 0, '可见页 timer 触发前不应同步绑定 click');
  visibleHarness.setVisibilityState('hidden');
  assert.equal(visibleHarness.timers.size, 0, '可见页转隐藏时应取消已排 bind timeout');
  assert.equal(visibleHarness.wizardState.aiMaxDemandPopoverBindPending, true, '转隐藏时应保留 pending bind');
  visibleHarness.setVisibilityState('visible');
  assert.deepEqual(visibleHarness.getTimerDelays(), [0], '再次恢复可见后应重新排 0ms bind timeout');
  assert.equal(visibleHarness.tickNextTimer(), true, '再次恢复后的 bind timeout 应可触发');
  assert.equal(visibleHarness.listenerCount('click'), 1, '再次恢复后应绑定 document click');
  visibleHarness.fireDocumentClick(visibleHarness.outsideNode);
  assert.equal(visibleHarness.popover.isConnected, false, '外点点击应关闭需求弹层');
  assert.equal(visibleHarness.listenerCount('click'), 0, '外点关闭后应释放 document click');
  assert.equal(visibleHarness.listenerCount('keydown'), 0, '外点关闭后应释放 document keydown');

  const clearHarness = createAiMaxDemandPopoverBindHarness('hidden');
  clearHarness.schedule();
  clearHarness.close();
  assert.equal(clearHarness.timers.size, 0, '显式关闭后不应残留 bind timeout');
  assert.equal(clearHarness.listenerCount('visibilitychange'), 0, '显式关闭后不应残留 visibilitychange');
  assert.equal(clearHarness.listenerCount('click'), 0, '显式关闭后不应残留 document click');
  assert.equal(clearHarness.listenerCount('keydown'), 0, '显式关闭后不应残留 document keydown');
  assert.equal(clearHarness.wizardState.aiMaxDemandPopoverBindPending, false, '显式关闭后不应残留 pending bind');
  assert.equal(clearHarness.wizardState.aiMaxDemandPopoverOutsideClick, null, '显式关闭后不应残留 outside click handler');
  assert.equal(clearHarness.wizardState.aiMaxDemandPopoverEscClose, null, '显式关闭后不应残留 ESC handler');
});

test('关键词自定义推广编辑计划不依赖未定义 runtime 变量', () => {
  const customBlock = getKeywordCustomSceneBlock();
  assert.doesNotMatch(
    customBlock,
    /runtime\?\.storeData\?\.needTargetCrowd|runtime\?\.solutionTemplate\?\.campaign\?\.needTargetCrowd/,
    '自定义推广场景渲染仍依赖未定义 runtime，编辑计划会报错'
  );
  assert.match(
    customBlock,
    /isCrowdTargetEnabled\s*=\s*!\/\^\(0\|false\|off\|关闭\|否\)\$\/i\.test/,
    '人群优化目标开关对“关闭”值识别不完整'
  );
});
