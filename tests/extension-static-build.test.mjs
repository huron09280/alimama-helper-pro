import test from 'node:test';
import assert from 'node:assert/strict';
import { Script, createContext } from 'node:vm';
import { normalizeExtensionManifestVersion, renderBuildOutputs } from '../scripts/build.mjs';

const outputs = renderBuildOutputs();
const manifest = JSON.parse(outputs.extensionFiles['manifest.json']);
const contentSource = outputs.extensionFiles['content.js'];
const backgroundSource = outputs.extensionFiles['background.js'];
const pageBundle = outputs.extensionFiles['page.bundle.js'];
const wizardStyleCss = outputs.extensionFiles['wizard-style.css'];

function createContentScriptHarness(initialUrl, options = {}) {
  const appendedScripts = [];
  const timers = new Map();
  const listeners = new Map();
  const nodesById = new Map();
  let currentUrl = new URL(initialUrl);
  let nextTimerId = 1;
  let visibilityState = String(options.visibilityState || 'visible');
  const addListener = (type, handler) => {
    if (!listeners.has(type)) listeners.set(type, []);
    listeners.get(type).push(handler);
  };
  const removeListener = (type, handler) => {
    if (!listeners.has(type)) return;
    const nextHandlers = listeners.get(type).filter((item) => item !== handler);
    if (nextHandlers.length) listeners.set(type, nextHandlers);
    else listeners.delete(type);
  };
  const updateLocation = (nextUrl) => {
    currentUrl = new URL(nextUrl, currentUrl.href);
    windowRef.location.href = currentUrl.href;
    windowRef.location.origin = currentUrl.origin;
  };
  const makeElement = (tagName) => {
    const element = {
      tagName: String(tagName || '').toUpperCase(),
      id: '',
      className: '',
      tabIndex: 0,
      textContent: '',
      style: {},
      dataset: {},
      attrs: {},
      setAttribute(name, value) {
        this.attrs[name] = String(value);
      },
      appendChild(child) {
        if (child?.id) nodesById.set(child.id, child);
        return child;
      },
      remove() {
        if (this.id) nodesById.delete(this.id);
        this.removed = true;
      },
      focus() { }
    };
    return element;
  };
  const mountNode = {
    appendChild(node) {
      if (node?.id) nodesById.set(node.id, node);
      if (node?.tagName === 'SCRIPT') {
        appendedScripts.push(node);
        if (typeof node.onload === 'function') node.onload();
      }
      return node;
    }
  };
  const documentRef = {
    head: mountNode,
    documentElement: mountNode,
    body: mountNode,
    get visibilityState() {
      return visibilityState;
    },
    getElementById(id) {
      return nodesById.get(id) || null;
    },
    createElement: makeElement,
    addEventListener: addListener,
    removeEventListener: removeListener
  };
  const windowRef = {
    location: {
      href: currentUrl.href,
      origin: currentUrl.origin
    },
    history: {
      pushState(_state, _title, url) {
        if (url) updateLocation(url);
        return null;
      },
      replaceState(_state, _title, url) {
        if (url) updateLocation(url);
        return null;
      }
    },
    postMessage() { },
    addEventListener: addListener,
    removeEventListener: removeListener,
    setTimeout(handler, delay = 0) {
      const timerId = nextTimerId;
      nextTimerId += 1;
      if (typeof handler === 'function') timers.set(timerId, { handler, delay: Number(delay) || 0 });
      return timerId;
    },
    clearTimeout(timerId) {
      timers.delete(timerId);
    }
  };
  const context = createContext({
    window: windowRef,
    document: documentRef,
    chrome: {
      runtime: {
        getURL: (path) => `chrome-extension://am-helper/${path}`,
        sendMessage: (_payload, callback) => {
          if (typeof callback === 'function') callback({ ok: true });
        },
        lastError: null
      }
    },
    URL,
    String,
    Date,
    Object
  });
  new Script(contentSource).runInContext(context);
  return {
    appendedScripts,
    timers,
    listeners,
    window: windowRef,
    tickTimers() {
      const entries = Array.from(timers.entries());
      entries.forEach(([timerId, timer]) => {
        if (!timers.has(timerId)) return;
        timers.delete(timerId);
        timer.handler();
      });
    },
    setVisibilityState(nextState) {
      visibilityState = String(nextState || 'visible');
      const handlers = Array.from(listeners.get('visibilitychange') || []);
      handlers.forEach((handler) => handler({ type: 'visibilitychange' }));
    },
    getTimerDelays() {
      return Array.from(timers.values()).map((timer) => timer.delay);
    }
  };
}

test('extension manifest 为 MV3 且指向阿里妈妈域名', () => {
  assert.equal(manifest.manifest_version, 3, 'manifest_version 必须为 3');
  assert.deepEqual(manifest.icons, {
    16: 'icon-16.png',
    32: 'icon-32.png',
    48: 'icon-48.png',
    128: 'icon-128.png'
  }, '扩展图标配置缺失或不正确');
  assert.deepEqual(manifest.action.default_icon, {
    16: 'icon-16.png',
    32: 'icon-32.png',
    48: 'icon-48.png'
  }, '工具栏图标配置缺失或不正确');
  assert.deepEqual(manifest.background, {
    service_worker: 'background.js'
  }, '缺少 background service worker 配置');
  assert.ok(Array.isArray(manifest.host_permissions), '缺少 host_permissions 配置');
  assert.ok(manifest.host_permissions.includes('https://am-licee-server-mpbzozflkj.cn-hangzhou.fcapp.run/*'), '缺少授权服务 host permission');
  assert.deepEqual(manifest.content_scripts[0].js, ['content.js']);
  assert.ok(manifest.content_scripts[0].matches.includes('*://*.alimama.com/*'), '缺少阿里妈妈子域匹配');
  assert.ok(manifest.content_scripts[0].matches.includes('https://myseller.taobao.com/*'), '缺少 myseller.taobao.com 匹配');
  assert.ok(manifest.web_accessible_resources[0].resources.includes('page.bundle.js'), '缺少 page bundle 暴露');
  assert.ok(manifest.web_accessible_resources[0].resources.includes('wizard-style.css'), '缺少组建计划外置样式暴露');
  assert.ok(!manifest.web_accessible_resources[0].resources.includes('keyword-plan-api.bundle.js'), '不应暴露点击时加载的 keyword-plan-api lazy bundle');
  assert.ok(manifest.web_accessible_resources[0].matches.includes('https://myseller.taobao.com/*'), '缺少 myseller.taobao.com web_accessible 匹配');
});

test('extension manifest 使用 Chrome 规范版本并保留展示版本', () => {
  assert.equal(normalizeExtensionManifestVersion('7.05'), '7.5');
  assert.equal(manifest.version, '7.5', 'manifest.version 不能包含带前导零的分段');
  assert.equal(manifest.version_name, outputs.version, 'manifest.version_name 应保留 userscript 展示版本');
});

test('extension content script 负责注入 page bundle', () => {
  assert.match(contentSource, /chrome\.runtime\.getURL\('page\.bundle\.js'\)/, '未通过 runtime URL 注入 page bundle');
  assert.doesNotMatch(contentSource, /keyword-plan-api\.bundle\.js/, 'content script 不应把 keyword-plan-api 大包延后到点击路径');
  assert.match(contentSource, /SCRIPT_ID = 'am-helper-pro-extension-page-bundle'/, '缺少固定注入节点 ID');
  assert.match(contentSource, /const shouldInjectPageBundle = \(\) => \{/, 'content script 缺少 page bundle 注入资格守卫');
  assert.match(contentSource, /let pageBundleInjected = false;/, 'content script 缺少已注入状态位，路由变化可能重复注入 page bundle');
  assert.match(contentSource, /if \(hostname === 'one\.alimama\.com'\) return true;/, 'one.alimama.com 必须继续注入完整 page bundle');
  assert.match(contentSource, /if \(isMysellerHost\(hostname\)\) return isSmartAssistantBudgetPage\(url\);/, 'myseller.taobao.com 只应允许 SmartAssistant 预算页注入');
  assert.match(contentSource, /const shouldWatchForDeferredInjection = \(\) => \{[\s\S]*return isMysellerHost\(normalizeHostname\(url\.hostname\)\);[\s\S]*\};/, '只有 myseller 普通页需要保留延迟注入监听');
  assert.match(contentSource, /return false;\s*\};[\s\S]*const renderInjectionError/, '非业务匹配页默认不应注入完整 page bundle');
  assert.match(contentSource, /const URL_POLL_INITIAL_INTERVAL_MS = 600;/, '未注入页应使用轻量 URL 快查兜底捕获主世界 SPA 路由变化');
  assert.match(contentSource, /const URL_POLL_MAX_INTERVAL_MS = 4800;/, '未注入页长期停留时应退避 URL 轮询频率');
  assert.match(contentSource, /let pendingHiddenUrlPoll = false;/, '未注入页 URL 轮询缺少隐藏页 pending 状态');
  assert.match(contentSource, /const isDocumentHidden = \(\) => document\.visibilityState === 'hidden';/, '未注入页 URL 轮询缺少隐藏态判定');
  assert.match(contentSource, /const markHiddenUrlPollPending = \(\) => \{[\s\S]*pendingHiddenUrlPoll = true;[\s\S]*clearInjectionCheckTimer\(\);[\s\S]*clearUrlPollTimer\(\);[\s\S]*\};/, '隐藏页应清理注入检查和 URL poll timer');
  assert.match(contentSource, /function handleDeferredInjectionVisibilityChange\(\) \{[\s\S]*if \(isDocumentHidden\(\)\) \{[\s\S]*markHiddenUrlPollPending\(\);[\s\S]*return;[\s\S]*\}[\s\S]*if \(!pendingHiddenUrlPoll\) return;[\s\S]*pendingHiddenUrlPoll = false;[\s\S]*scheduleInjectionCheck\(\);[\s\S]*startUrlPolling\(\);[\s\S]*\}/, '恢复可见时应补一次注入检查并恢复 URL polling');
  assert.match(contentSource, /document\.addEventListener\('visibilitychange', handleDeferredInjectionVisibilityChange\);[\s\S]*startUrlPolling\(\);/, '延迟注入监听启动时应监听 visibilitychange');
  assert.match(contentSource, /document\.removeEventListener\('visibilitychange', handleDeferredInjectionVisibilityChange\);[\s\S]*deferredInjectionWatchActive = false;[\s\S]*pendingHiddenUrlPoll = false;/, '延迟注入监听停止时应移除 visibilitychange 并清理 pending 状态');
  assert.match(contentSource, /window\.setTimeout\(\(\) => \{[\s\S]*urlPollDelayMs = Math\.min\(URL_POLL_MAX_INTERVAL_MS,[\s\S]*urlPollDelayMs \* 2[\s\S]*scheduleNextUrlPoll\(\);[\s\S]*\}, urlPollDelayMs\);/, '未注入页 URL 轮询应使用可退避 timeout 循环');
  assert.match(contentSource, /const scheduleNextUrlPoll = \(\) => \{[\s\S]*if \(isDocumentHidden\(\)\) \{[\s\S]*markHiddenUrlPollPending\(\);[\s\S]*return;[\s\S]*\}[\s\S]*urlPollTimer = window\.setTimeout\(\(\) => \{[\s\S]*if \(isDocumentHidden\(\)\) \{[\s\S]*markHiddenUrlPollPending\(\);[\s\S]*return;[\s\S]*\}/, 'URL polling 调度前和触发后都应复核隐藏态');
  assert.match(contentSource, /window\.addEventListener\('hashchange', scheduleInjectionCheck\);[\s\S]*window\.addEventListener\('popstate', scheduleInjectionCheck\);[\s\S]*startUrlPolling\(\);/, '未注入页面应监听 URL 变化以便后续进入业务页时恢复注入');
  assert.match(contentSource, /window\.removeEventListener\('hashchange', scheduleInjectionCheck\);[\s\S]*window\.removeEventListener\('popstate', scheduleInjectionCheck\);/, 'page bundle 注入成功后应释放延迟注入 URL 监听');
  assert.doesNotMatch(contentSource, /setInterval\(\(\) => \{[\s\S]*lastObservedUrl/, '未注入页不应继续保留固定 600ms interval URL 轮询');
  assert.doesNotMatch(contentSource, /historyRef\[methodName\] = wrapped;/, 'content script 不应依赖隔离世界包装页面 history 方法捕获主世界 SPA 跳转');
  assert.match(contentSource, /const renderInjectionError = \(message = ''\) => \{/, '缺少 extension 注入失败可见反馈');
  assert.match(contentSource, /root\.setAttribute\('role', 'alert'\);/, 'extension 注入失败提示缺少 alert 语义');
  assert.match(contentSource, /root\.setAttribute\('aria-live', 'assertive'\);/, 'extension 注入失败提示缺少 assertive live 区域');
  assert.match(contentSource, /root\.setAttribute\('aria-atomic', 'true'\);/, 'extension 注入失败提示缺少 aria-atomic');
  assert.match(contentSource, /root\.tabIndex = -1;/, 'extension 注入失败提示缺少可聚焦锚点');
  assert.match(contentSource, /root\.textContent = message \|\| '阿里妈妈助手加载失败，请刷新页面或重新加载扩展。';/, 'extension 注入失败提示必须通过 textContent 渲染');
  assert.match(contentSource, /background:linear-gradient\(135deg, rgba\(255,255,255,\.86\), rgba\(255,255,255,\.58\)\)/, 'extension 注入失败提示未使用浅玻璃背景');
  assert.match(contentSource, /backdrop-filter:blur\(18px\) saturate\(1\.28\)/, 'extension 注入失败提示缺少玻璃模糊效果');
  assert.doesNotMatch(contentSource, /root\.innerHTML\s*=/, 'extension 注入失败提示不得用 innerHTML 渲染');
  assert.doesNotMatch(contentSource, /background:#b91c1c/, 'extension 注入失败提示仍保留旧红色实底');
  assert.match(contentSource, /script\.onerror = \(\) => \{[\s\S]*renderInjectionError\(\);[\s\S]*\};/, 'page bundle 注入失败未展示页面错误');
  assert.match(contentSource, /nextMountNode\.appendChild\(script\);[\s\S]*catch \{[\s\S]*renderInjectionError\(\);/, 'appendChild 失败未兜底展示页面错误');
  assert.match(contentSource, /const LICENSE_VERIFY_BRIDGE_CHANNEL = 'am-helper-pro:license-verify';/, '缺少授权桥 channel 常量');
  assert.match(contentSource, /if \(data\.channel !== LICENSE_VERIFY_BRIDGE_CHANNEL\) return;/, 'content script 未限制授权桥 channel');
  assert.match(contentSource, /if \(data\.type !== LICENSE_VERIFY_REQUEST_TYPE\) return;/, 'content script 未限制授权桥消息类型');
  assert.match(contentSource, /try \{[\s\S]*chrome\.runtime\.sendMessage\(\{\s*type: LICENSE_VERIFY_MESSAGE_TYPE,\s*payload\s*\},\s*\(response\) => \{/, 'content script 未保护式转发授权请求给 background');
  assert.match(contentSource, /catch \(err\) \{[\s\S]*markLicenseBridgeRuntimeUnavailable\(err\);[\s\S]*postLicenseBridgeRuntimeUnavailable\(requestId\);[\s\S]*\}/, 'content script 未捕获扩展上下文失效错误');
  assert.match(contentSource, /type: LICENSE_VERIFY_RESPONSE_TYPE,/, 'content script 未回传授权桥响应');
});

test('extension content script 只在业务页面注入完整 page bundle', () => {
  const one = createContentScriptHarness('https://one.alimama.com/index.html#!/manage/display');
  assert.equal(one.appendedScripts.length, 1, 'one.alimama.com 应继续注入完整 page bundle');
  assert.match(one.appendedScripts[0].src, /page\.bundle\.js$/, 'one.alimama.com 注入的脚本应为 page.bundle.js');

  const mysellerHome = createContentScriptHarness('https://myseller.taobao.com/home.htm/QnworkbenchHome/');
  assert.equal(mysellerHome.appendedScripts.length, 0, 'myseller 普通工作台不应注入完整 page bundle');
  assert.ok(mysellerHome.listeners.has('hashchange'), '未注入页应监听 hashchange 以恢复注入');
  assert.ok(mysellerHome.listeners.has('popstate'), '未注入页应监听 popstate 以恢复注入');
  assert.ok(mysellerHome.listeners.has('visibilitychange'), '未注入页应监听 visibilitychange 以暂停隐藏页轮询');
  assert.equal(mysellerHome.timers.size, 1, '未注入页应启动轻量 URL 轮询兜底');
  assert.deepEqual(mysellerHome.getTimerDelays(), [600], '未注入页初始 URL 轮询应保持快速捕获');
  mysellerHome.tickTimers();
  assert.deepEqual(mysellerHome.getTimerDelays(), [1200], 'URL 未变化时应退避到 1200ms');
  mysellerHome.tickTimers();
  assert.deepEqual(mysellerHome.getTimerDelays(), [2400], 'URL 持续未变化时应继续退避');
  mysellerHome.tickTimers();
  assert.deepEqual(mysellerHome.getTimerDelays(), [4800], 'URL 轮询退避应达到 4800ms 上限');
  mysellerHome.tickTimers();
  assert.deepEqual(mysellerHome.getTimerDelays(), [4800], 'URL 轮询退避达到上限后不应继续增长');

  mysellerHome.window.history.pushState(null, '', 'https://myseller.taobao.com/home.htm/crm-workbench/smartassistant');
  assert.equal(mysellerHome.appendedScripts.length, 0, '隔离世界不应假设页面主世界 pushState 会直接触发注入');
  mysellerHome.tickTimers();
  assert.deepEqual(mysellerHome.getTimerDelays().sort((a, b) => a - b), [80, 600], 'URL 变化后应恢复快查并安排注入检查');
  mysellerHome.tickTimers();
  assert.equal(mysellerHome.appendedScripts.length, 1, 'myseller 跳转 SmartAssistant 后应恢复注入');
  assert.equal(mysellerHome.timers.size, 0, 'page bundle 成功注入后应停止 URL 轮询');
  assert.ok(!mysellerHome.listeners.has('hashchange'), 'page bundle 成功注入后应移除 hashchange 监听');
  assert.ok(!mysellerHome.listeners.has('popstate'), 'page bundle 成功注入后应移除 popstate 监听');
  assert.ok(!mysellerHome.listeners.has('visibilitychange'), 'page bundle 成功注入后应移除 visibilitychange 监听');
  mysellerHome.window.history.replaceState(null, '', 'https://myseller.taobao.com/home.htm/crm-workbench/smartassistant?from=codex');
  mysellerHome.window.history.pushState(null, '', 'https://myseller.taobao.com/home.htm/crm-workbench/smartassistant#dailyBudget');
  mysellerHome.tickTimers();
  assert.equal(mysellerHome.appendedScripts.length, 1, 'page bundle 成功注入后不应被后续 URL 变化重复注入');

  const smartAssistant = createContentScriptHarness('https://myseller.taobao.com/home.htm/crm-workbench/smartassistant');
  assert.equal(smartAssistant.appendedScripts.length, 1, 'SmartAssistant 预算页应允许注入预算补丁运行时');

  const hiddenMyseller = createContentScriptHarness('https://myseller.taobao.com/home.htm/QnworkbenchHome/', { visibilityState: 'hidden' });
  assert.equal(hiddenMyseller.appendedScripts.length, 0, '隐藏 myseller 普通页不应立即注入完整 page bundle');
  assert.equal(hiddenMyseller.timers.size, 0, '隐藏 myseller 普通页不应保留 URL poll timer');
  assert.ok(hiddenMyseller.listeners.has('visibilitychange'), '隐藏 myseller 普通页应保留恢复可见监听');
  hiddenMyseller.window.history.pushState(null, '', 'https://myseller.taobao.com/home.htm/crm-workbench/smartassistant');
  assert.equal(hiddenMyseller.appendedScripts.length, 0, '隐藏页跳转 SmartAssistant 前不应在后台注入 page bundle');
  hiddenMyseller.setVisibilityState('visible');
  assert.deepEqual(hiddenMyseller.getTimerDelays().sort((a, b) => a - b), [80, 600], '恢复可见后应补注入检查并恢复快速 URL 轮询');
  hiddenMyseller.tickTimers();
  assert.equal(hiddenMyseller.appendedScripts.length, 1, '隐藏页恢复可见后应能注入 SmartAssistant page bundle');
  assert.equal(hiddenMyseller.timers.size, 0, '隐藏页恢复注入成功后应停止所有延迟注入 timer');
  assert.ok(!hiddenMyseller.listeners.has('visibilitychange'), '隐藏页恢复注入成功后应移除 visibilitychange 监听');

  const broadAlimama = createContentScriptHarness('https://pub.alimama.com/');
  assert.equal(broadAlimama.appendedScripts.length, 0, '宽泛 alimama 子域默认不应注入 4.4MB page bundle');
  assert.equal(broadAlimama.timers.size, 0, '宽泛 alimama 子域不应保留 myseller 专用 URL 轮询');
  assert.equal(broadAlimama.listeners.size, 1, '宽泛 alimama 子域仅应保留授权 bridge message 监听');
});

test('extension build output 包含授权 background 桥', () => {
  assert.equal(typeof backgroundSource, 'string', 'build output 缺少 background.js');
  assert.match(backgroundSource, /const VERIFY_ENDPOINT = 'https:\/\/am-licee-server-mpbzozflkj\.cn-hangzhou\.fcapp\.run\/v1\/license\/verify';/, 'background 未固定授权 verify endpoint');
  assert.match(backgroundSource, /const VERIFY_REQUEST_TYPE = 'AM_LICENSE_VERIFY_REQUEST';/, 'background 缺少授权消息类型');
  assert.match(backgroundSource, /if \(message\?\.type !== VERIFY_REQUEST_TYPE\) return false;/, 'background 未限制消息类型');
  assert.match(backgroundSource, /if \(!isAllowedSenderUrl\(sender\?\.url \|\| ''\)\) \{/, 'background 未校验 sender.url');
  assert.match(
    backgroundSource,
    /return hostname === 'alimama\.com'[\s\S]*hostname === 'myseller\.taobao\.com'[\s\S]*hostname\.endsWith\('\.myseller\.taobao\.com'\)[\s\S]*hostname\.endsWith\('\.alimama\.com'\);/,
    'background 未限制阿里妈妈来源'
  );
  assert.match(backgroundSource, /response = await fetch\(VERIFY_ENDPOINT, \{/, 'background 未请求固定授权地址');
  assert.doesNotMatch(backgroundSource, /payload\.(?:url|endpoint)/, 'background 不应接受页面传入任意 URL');
});

test('extension page bundle 包含 GM 兼容层与核心桥接', () => {
  assert.match(pageBundle, /window\.GM_getValue = GM_getValue_impl/, '缺少 GM_getValue 兼容层');
  assert.match(pageBundle, /window\.__AM_PLATFORM_RUNTIME__ = \{/, '缺少 extension 运行时标记');
  assert.match(pageBundle, /window\.__AM_EXTENSION_RESOURCE_BASE_URL__ = EXTENSION_RESOURCE_BASE_URL;/, 'extension 运行态未暴露资源 base URL');
  assert.match(pageBundle, /resourceBaseUrl: EXTENSION_RESOURCE_BASE_URL/, 'extension 运行时标记缺少资源 base URL');
  assert.doesNotMatch(pageBundle, /keywordPlanApiBundle/, 'extension 运行态不应记录点击时加载的 keyword-plan-api lazy bundle');
  assert.match(pageBundle, /window\.__ALIMAMA_OPTIMIZER_TOGGLE__ = \(\) => \{/, '缺少核心桥接入口');
});

test('extension 组建计划样式外置并保留首屏关键样式', () => {
  assert.equal(typeof wizardStyleCss, 'string', 'build output 缺少 wizard-style.css');
  assert.match(wizardStyleCss, /#am-wxt-keyword-overlay\s*\{/, 'wizard-style.css 缺少组建计划 overlay 样式');
  assert.match(wizardStyleCss, /#am-wxt-keyword-modal \.am-wxt-workbench-tabs/, 'wizard-style.css 缺少组建计划工作台样式');
  assert.match(wizardStyleCss, /#am-wxt-keyword-modal \.am-wxt-home-summary/, 'wizard-style.css 缺少组建计划首页摘要样式');
  assert.ok(wizardStyleCss.length > 200000, 'wizard-style.css 体积异常，可能未提取完整组建计划样式');

  assert.match(pageBundle, /const ensureWizardStyle = \(\) => \{[\s\S]*link\.rel = 'stylesheet';[\s\S]*new URL\('wizard-style\.css', baseUrl\)\.href/, 'extension page bundle 未使用外置 CSS loader');
  assert.match(pageBundle, /link\.dataset\.amHelperExternalStyle = '1';/, '外置 CSS link 缺少可观测标记');
  assert.match(pageBundle, /isLegacyInlineBlocker[\s\S]*#am-wxt-keyword-overlay\{display:none!important;\}[\s\S]*existingStyleNode\.remove\(\);/, '外置 CSS loader 必须清理旧运行态遗留的隐藏占位 style');
  assert.match(pageBundle, /inline-existing/, '外置 CSS loader 应识别已有完整内联样式，避免 userscript 或热更新场景重复加载');
  assert.match(pageBundle, /am-wxt-keyword-critical-style/, '外置 CSS loader 缺少关键首屏样式兜底');
  assert.match(pageBundle, /extension_resource_base_url_missing/, '外置 CSS loader 缺少资源 base URL 失败信号');
  assert.match(pageBundle, /__AM_WXT_WIZARD_STYLE_READY_PROMISE__/, '外置 CSS loader 缺少样式加载 Promise 契约');
  assert.match(pageBundle, /wizard_style_load_timeout/, '外置 CSS loader 缺少加载超时兜底');
  assert.match(pageBundle, /wizard_style_load_failed/, '外置 CSS loader 缺少加载失败兜底');
  assert.match(pageBundle, /clearTimeout\(loadTimeoutId\);[\s\S]*link\.onload = null;[\s\S]*link\.onerror = null;[\s\S]*if \(link\.parentNode\) link\.parentNode\.removeChild\(link\);/, '关闭组建计划时必须取消外置样式加载定时器并移除 link');
  assert.match(pageBundle, /const critical = document\.getElementById\('am-wxt-keyword-critical-style'\);[\s\S]*if \(critical\?\.parentNode\) \{[\s\S]*critical\.parentNode\.removeChild\(critical\);[\s\S]*\}/, '关闭组建计划时必须清理 critical style，覆盖快开快关未加载完成场景');
  assert.match(pageBundle, /delete window\[readyPromiseKey\]/, '关闭组建计划时必须清理样式 Promise，允许下次打开重新加载样式');
  assert.match(pageBundle, /revealWizardAfterStyleReady\(openToken\);/, '组建计划打开前未等待外置样式加载结果');
  assert.match(pageBundle, /wizardState\.els\.overlay\.dataset\.styleLoading = '1';[\s\S]*wizardState\.els\.overlay\.classList\.remove\('open'\);/, '组建计划打开时应先保持 overlay 隐藏，避免外置 CSS 加载前露出裸 DOM');
  assert.match(pageBundle, /delete overlay\.dataset\.styleLoading;[\s\S]*overlay\.classList\.add\('open'\);/, '组建计划展示时应清理样式加载态');
  assert.doesNotMatch(pageBundle, /style\.textContent = `\s*#am-wxt-keyword-overlay \{/, 'extension page bundle 不应继续内联完整组建计划样式');
  assert.doesNotMatch(pageBundle, /#am-wxt-keyword-modal \.am-wxt-home-summary \{[\s\S]*#am-wxt-keyword-modal \.am-wxt-strategy-list/, 'extension page bundle 不应保留完整 wizard CSS 大段');
});

test('extension page bundle 授权锁定遮罩符合统一 UI 规范', () => {
  assert.match(pageBundle, /root\.setAttribute\('role', 'dialog'\);/, '授权遮罩缺少 dialog 语义');
  assert.match(pageBundle, /root\.setAttribute\('aria-modal', 'true'\);/, '授权遮罩缺少 aria-modal');
  assert.match(pageBundle, /root\.setAttribute\('aria-labelledby', 'am-license-lock-title'\);/, '授权遮罩缺少标题关联');
  assert.match(pageBundle, /root\.setAttribute\('aria-describedby', 'am-license-lock-message'\);/, '授权遮罩缺少描述关联');
  assert.match(pageBundle, /__AM_RENDER_ICON__\('alert-triangle', \{ size: 20, strokeWidth: 2\.2 \}\)/, '授权遮罩缺少共享告警图标');
  assert.match(pageBundle, /messageNode\.textContent = reason;/, '授权遮罩正文必须通过 textContent 展示');
  assert.match(pageBundle, /metaNode\.replaceChildren\(\);[\s\S]*document\.createElement\('span'\)[\s\S]*badge\.textContent = `\$\{label\}: \$\{value\}`;[\s\S]*metaNode\.appendChild\(badge\);/, '授权遮罩 meta 必须通过 DOM/textContent 渲染');
  assert.match(pageBundle, /background: linear-gradient\(135deg, rgba\(255, 255, 255, 0\.72\), rgba\(255, 255, 255, 0\.48\)\);/, '授权遮罩 overlay 未使用白色玻璃遮罩');
  assert.match(pageBundle, /backdrop-filter: blur\(12px\) saturate\(1\.18\);/, '授权遮罩 overlay 未使用统一玻璃模糊');
  assert.match(pageBundle, /background: var\(--am26-panel-strong,/, '授权遮罩卡片未使用统一 panel token');
  assert.match(pageBundle, /box-shadow: var\(--am26-shadow,/, '授权遮罩卡片未使用统一阴影 token');
  assert.match(pageBundle, /@media \(prefers-reduced-motion: reduce\)/, '授权遮罩缺少 reduced-motion 覆盖');
  assert.doesNotMatch(pageBundle, /metaNode\.innerHTML\s*=/, '授权遮罩 meta 不得用 innerHTML 拼接 state 字符串');
  assert.doesNotMatch(pageBundle, /background: rgba\(27, 36, 56, 0\.28\);/, '授权遮罩仍保留旧灰蓝遮罩');
  assert.doesNotMatch(pageBundle, /background: rgba\(6, 9, 19, 0\.82\);/, '授权遮罩仍保留旧深色遮罩');
  assert.doesNotMatch(pageBundle, /rgba\(17, 24, 39, 0\.94\)/, '授权遮罩仍保留旧深色卡片背景');

  const overlayBlock = pageBundle.slice(
    pageBundle.indexOf('const renderOverlay = () => {'),
    pageBundle.indexOf('const lock = (reasonCode =')
  );
  assert.doesNotMatch(overlayBlock, /leaseToken|policyToken|deviceHash|nonce/, '授权遮罩不应展示敏感授权字段');
});

test('extension page bundle 包含完整计划 API 且不默认暴露到页面全局', () => {
  assert.match(pageBundle, /const isExtensionPageRuntime = \(\) => \{[\s\S]*__AM_PLATFORM_RUNTIME__\?\.mode === 'extension'/, '缺少 extension 运行态判定');
  assert.match(pageBundle, /const KeywordPlanApi = \(\(\) => \{/, 'extension page bundle 应包含完整 KeywordPlanApi 主体，避免点击时首次解析大包');
  assert.match(pageBundle, /\bKeywordPlanRuntime\b/, 'extension page bundle 应在启动期初始化关键词运行时');
  assert.match(
    pageBundle,
    /if \(typeof globalThis !== 'undefined' && !isExtensionPageRuntime\(\)\) \{[\s\S]*globalThis\.__AM_WXT_KEYWORD_API__ = KeywordPlanApi;[\s\S]*globalThis\.__AM_WXT_PLAN_API__ = KeywordPlanApi;/,
    'sandbox 全局计划 API 未被 extension 运行态隔离'
  );
  assert.doesNotMatch(
    pageBundle,
    /if \(typeof globalThis !== 'undefined'\) \{\s*globalThis\.__AM_TOKENS__ = State\.tokens;[\s\S]*globalThis\.__AM_WXT_PLAN_API__ = KeywordPlanApi;/,
    'extension page bundle 仍会无条件向 window/globalThis 暴露完整计划 API'
  );
});

test('extension page bundle 默认保留组建计划打开窄桥', () => {
  assert.match(pageBundle, /const KEYWORD_PLAN_OPEN_BRIDGE_READY_KEY = '__AM_WXT_KEYWORD_OPEN_BRIDGE_READY__';/, '缺少组建计划打开窄桥常量');
  assert.doesNotMatch(pageBundle, /loadKeywordPlanApiForExtension\(\)/, '组建计划点击路径不应再懒加载 keyword-plan-api 大包');
  assert.doesNotMatch(pageBundle, /am-helper-pro-extension-keyword-plan-bundle/, '不应保留点击时注入 keyword-plan-api 大包的 script 标识');
  assert.match(pageBundle, /installKeywordPlanOpenBridgeHost\(\);\s*if \(isExtensionPageRuntime\(\) \|\| shouldExposePageApiDebug\(\)\) \{[\s\S]*?installPageApiBridgeHost\(\);[\s\S]*?\}\s*if \(shouldExposePageApiDebug\(\)\) \{/s, 'extension 应默认安装内部完整桥 host，完整 page API 客户端仍受 debug 开关保护');
  assert.match(pageBundle, /if \(window\[KEYWORD_PLAN_OPEN_BRIDGE_READY_KEY\] === '1'\) \{[\s\S]*?return createKeywordPlanOpenBridgeApi\(\);[\s\S]*?\}/s, '主助手未回退到组建计划打开窄桥');
});

test('extension page bundle 不把 API 控制流失败写入 Chrome 扩展错误页', () => {
  assert.match(pageBundle, /Logger\.info\(`\[\$\{reqId\}\] 请求失败 \(\$\{elapsed\}ms\):`, \{/, '单次请求失败应保留日志但不使用 console.error');
  assert.match(pageBundle, /Logger\.info\(`✗ 请求失败 \(第\$\{attempt\}\/\$\{totalAttempts\}次\): \$\{err\.message\}`\);/, '重试失败应保留日志但不使用 console.warn');
  assert.match(pageBundle, /Logger\.info\(`❌ 请求最终失败: \$\{finalError\.message\}`, \{ url, attempts: totalAttempts \}\);/, '最终失败应保留日志但不使用 console.error');
  assert.doesNotMatch(pageBundle, /Logger\.error\(`\[\$\{reqId\}\] 请求失败 \(\$\{elapsed\}ms\):`/, '单次请求失败不应进入 Chrome error collection');
  assert.doesNotMatch(pageBundle, /Logger\.warn\(`✗ 请求失败 \(第\$\{attempt\}\/\$\{totalAttempts\}次\): \$\{err\.message\}`\);/, '重试失败不应进入 Chrome warning collection');
  assert.doesNotMatch(pageBundle, /Logger\.error\(`❌ 请求最终失败: \$\{finalError\.message\}`/, '最终失败不应进入 Chrome error collection');
});
