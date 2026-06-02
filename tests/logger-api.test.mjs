import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Script, createContext } from 'node:vm';

const source = readFileSync(new URL('../阿里妈妈多合一助手.js', import.meta.url), 'utf8');
const bootstrapSource = readFileSync(new URL('../src/main-assistant/bootstrap.js', import.meta.url), 'utf8');

function getMainLoggerBlock() {
  const start = source.indexOf('const Logger = {');
  const end = source.indexOf('// ==========================================', start);
  assert.ok(start > -1 && end > start, '无法定位主助手 Logger 定义');
  return source.slice(start, end);
}

function getMainUIBlock() {
  const start = source.indexOf('const UI = {');
  const end = source.indexOf('// ==========================================', start);
  assert.ok(start > -1 && end > start, '无法定位主助手 UI 定义');
  return source.slice(start, end);
}

function getMainBootstrapBlock() {
  const start = source.indexOf('const CONSTANTS = {');
  const end = source.indexOf('// ==========================================', source.indexOf('const State = {', start));
  assert.ok(start > -1 && end > start, '无法定位主助手配置与状态定义');
  return source.slice(start, end);
}

function getMainEntrypointBlock() {
  const start = source.indexOf('function main() {');
  const end = source.indexOf('// ==========================================', start);
  assert.ok(start > -1 && end > start, '无法定位主助手启动程序定义');
  return source.slice(start, end);
}

function createHookManagerForTest() {
  const start = bootstrapSource.indexOf('const resolveHookTargetWindow = () => {');
  const end = bootstrapSource.indexOf('const safeParseJSON = (raw) => {', start);
  assert.ok(start > -1 && end > start, '无法定位 createHookManager 测试片段');
  const windowRef = {
    location: { origin: 'https://one.alimama.com' }
  };
  const context = createContext({
    window: windowRef,
    URL,
    URLSearchParams,
    FormData,
    Blob,
    ArrayBuffer,
    RegExp,
    Number,
    String,
    Date
  });
  new Script(`${bootstrapSource.slice(start, end)}\nglobalThis.__manager = window.__AM_HOOK_MANAGER__;`).runInContext(context);
  assert.ok(context.__manager, '测试环境未创建 hook manager');
  return context.__manager;
}

test('主助手 Logger 暴露 log/info/warn/error 方法', () => {
  const loggerBlock = getMainLoggerBlock();
  for (const method of ['log', 'info', 'warn', 'error']) {
    assert.match(
      loggerBlock,
      new RegExp(`\\b${method}\\s*\\(`),
      `缺少 Logger.${method} 方法`
    );
  }
});

test('主助手 Logger.flush 在早退分支会重置 timer，避免日志刷新锁死', () => {
  const loggerBlock = getMainLoggerBlock();
  assert.match(
    loggerBlock,
    /flush\(\)\s*\{[\s\S]*if\s*\(!this\.el\s*\|\|\s*this\.buffer\.length\s*===\s*0\)\s*\{[\s\S]*this\.timer\s*=\s*null;[\s\S]*return;[\s\S]*\}/,
    'flush 早退分支未重置 timer，可能导致后续日志不再刷新'
  );
});

test('主助手 Logger 的 info/warn/error 支持透传额外参数', () => {
  const loggerBlock = getMainLoggerBlock();
  for (const method of ['info', 'warn', 'error']) {
    assert.match(
      loggerBlock,
      new RegExp(`\\b${method}\\s*\\(msg,\\s*\\.\\.\\.args\\)`),
      `${method} 未透传可变参数`
    );
  }
  assert.match(
    loggerBlock,
    /log\(msg,\s*isError\s*=\s*false,\s*\.\.\.args\)/,
    'log 未声明可变参数，无法承接 info/warn/error 的额外参数'
  );
});

test('主面板工具区包含算法护航/万能查数/辅助显示三个入口', () => {
  for (const id of ['am-trigger-optimizer', 'am-trigger-magic-report', 'am-toggle-assist-display']) {
    assert.match(
      source,
      new RegExp(`id=["']${id}["']`),
      `缺少工具按钮: ${id}`
    );
  }
});

test('主面板交互控件使用原生 button 并同步可访问状态', () => {
  const uiBlock = getMainUIBlock();
  assert.match(uiBlock, /<button id="am-helper-icon" type="button"[\s\S]*?aria-label="展开助手面板"/, '悬浮球应是可聚焦 button');
  assert.match(uiBlock, /<button type="button" class="am-close-btn"[\s\S]*?aria-label="最小化助手面板"/, '关闭控件应是 button 且有 aria-label');
  for (const id of ['am-trigger-optimizer', 'am-trigger-keyword-plan-api', 'am-trigger-magic-report']) {
    assert.match(
      uiBlock,
      new RegExp(`<button type="button" class="am-tool-btn" id="${id}"`),
      `工具入口 ${id} 应使用 button`
    );
  }
  assert.match(
    uiBlock,
    /<button type="button" class="am-tool-btn" id="am-toggle-assist-display"[\s\S]*?aria-expanded="false"[\s\S]*?aria-controls="am-assist-switches"[\s\S]*?aria-pressed="false"/,
    '辅助显示入口应声明展开与按下状态'
  );
  assert.match(uiBlock, /<button type="button" class="am-switch-btn" data-key="showCost" aria-pressed="false">询单成本<\/button>/, '辅助开关应使用 button 与 aria-pressed');
  assert.match(uiBlock, /<button type="button" class="am-action-btn" id="am-log-clear">清空<\/button>/, '日志清空应使用 button');
  assert.match(uiBlock, /<button type="button" class="am-action-btn" id="am-log-toggle" aria-controls="am-log-content" aria-expanded="false">展开<\/button>/, '日志展开按钮应关联日志区域');
  assert.doesNotMatch(uiBlock, /<div class="am-tool-btn"|<div class="am-switch-btn"|<span class="am-action-btn"/, '主面板交互控件不得回退为 div/span');
  assert.match(uiBlock, /btn\.setAttribute\('aria-pressed',\s*active \? 'true' : 'false'\)/, '辅助开关状态应同步 aria-pressed');
  assert.match(uiBlock, /assistToggleBtn\.setAttribute\('aria-expanded',\s*this\.runtime\.assistExpanded \? 'true' : 'false'\)/, '辅助显示入口应同步 aria-expanded');
  assert.match(uiBlock, /logToggle\.setAttribute\('aria-expanded',\s*'true'\)[\s\S]*?logToggle\.setAttribute\('aria-expanded',\s*'false'\)/, '日志展开按钮应同步 aria-expanded');
});

test('默认配置中日志收起且包含配置版本号', () => {
  assert.match(source, /logExpanded:\s*false/, '默认日志未设为收起');
  assert.match(source, /configRevision:\s*CONSTANTS\.CONFIG_REVISION/, '默认配置缺少 configRevision');
});

test('辅助显示具备容器与展开状态同步逻辑', () => {
  const uiBlock = getMainUIBlock();
  assert.match(source, /id=["']am-assist-switches["']/, '缺少辅助显示容器');
  assert.match(uiBlock, /assistExpanded:\s*false/, '缺少辅助显示运行时状态');
  assert.match(
    uiBlock,
    /assistPanel\.classList\.toggle\(['"]open['"],\s*this\.runtime\.assistExpanded\)/,
    '辅助显示容器未在 updateState 中同步 open 状态'
  );
});

test('主面板 P2 样式收敛到统一浅玻璃 token', () => {
  const uiBlock = getMainUIBlock();
  assert.match(
    uiBlock,
    /#am-helper-icon:hover \{[\s\S]*?transform:\s*translateY\(-2px\);[\s\S]*?background:\s*var\(--am26-surface-strong\);[\s\S]*?box-shadow:\s*0 10px 28px rgba\(31,\s*38,\s*135,\s*0\.18\), var\(--am26-glow\);/,
    '悬浮球 hover 应使用克制位移、统一表面 token 和轻阴影'
  );
  assert.match(
    uiBlock,
    /\.am-tools-row \{[\s\S]*?border-radius:\s*14px;[\s\S]*?border:\s*1px solid var\(--am26-border\);[\s\S]*?background:\s*var\(--am26-surface\);[\s\S]*?box-shadow:\s*inset 0 1px 0 rgba\(255,\s*255,\s*255,\s*0\.56\), 0 4px 14px rgba\(31,\s*53,\s*109,\s*0\.05\);/,
    '主工具区应收敛为统一浅玻璃控制组'
  );
  assert.match(
    uiBlock,
    /\.am-tool-label \{[\s\S]*?min-width:\s*0;[\s\S]*?overflow:\s*hidden;[\s\S]*?text-overflow:\s*ellipsis;[\s\S]*?white-space:\s*nowrap;/,
    '工具按钮文字应防止窄面板溢出'
  );
  assert.doesNotMatch(
    uiBlock,
    /#am-helper-icon:hover \{[\s\S]*?scale\(1\.08\)/,
    '悬浮球 hover 不应使用大幅缩放'
  );
  assert.match(
    uiBlock,
    /#am-assist-switches\.open \{[\s\S]*?padding:\s*8px;[\s\S]*?border-color:\s*var\(--am26-border\);[\s\S]*?background:\s*var\(--am26-surface\);[\s\S]*?box-shadow:\s*inset 0 1px 0 rgba\(255,\s*255,\s*255,\s*0\.52\), 0 4px 14px rgba\(31,\s*53,\s*109,\s*0\.04\);/,
    '辅助显示展开区应使用统一浅玻璃容器'
  );
  assert.match(
    uiBlock,
    /\.am-switch-btn\.active \{[\s\S]*?border-color:\s*rgba\(69,\s*84,\s*229,\s*0\.26\);[\s\S]*?background:\s*rgba\(69,\s*84,\s*229,\s*0\.10\);[\s\S]*?color:\s*var\(--am26-primary-strong\);/,
    '辅助开关 active 态应有清晰品牌状态'
  );
  assert.match(
    uiBlock,
    /\.am-switch-btn:hover \{[\s\S]*?border-color:\s*var\(--am26-border-strong\);[\s\S]*?background:\s*var\(--am26-surface-strong\);/,
    '辅助开关 hover 应使用统一边框和表面 token'
  );
  assert.match(
    uiBlock,
    /\.am-switch-btn:not\(\.active\)::before \{[\s\S]*?background:\s*rgba\(80,\s*90,\s*116,\s*0\.28\);/,
    '辅助开关弱态圆点应使用统一文本柔色派生值'
  );
  assert.match(
    uiBlock,
    /#am-log-content \{[\s\S]*?background:\s*var\(--am26-surface\);[\s\S]*?border:\s*1px solid var\(--am26-border\);[\s\S]*?box-shadow:\s*inset 0 1px 0 rgba\(255,\s*255,\s*255,\s*0\.48\), 0 2px 8px rgba\(31,\s*53,\s*109,\s*0\.04\);/,
    '日志区应使用统一浅玻璃背景、边框和轻阴影'
  );
  assert.match(
    uiBlock,
    /\.am-log-header \{[\s\S]*?border:\s*1px solid var\(--am26-border\);[\s\S]*?border-radius:\s*12px;[\s\S]*?background:\s*var\(--am26-surface\);/,
    '日志头部应使用统一工具条容器'
  );
  assert.match(
    uiBlock,
    /\.am-log-line \{[\s\S]*?border-bottom:\s*1px dashed rgba\(80,\s*90,\s*116,\s*0\.16\);[\s\S]*?\.am-log-time \{ color:\s*var\(--am26-text-soft\); opacity:\s*0\.72;/,
    '日志行分隔线和时间色应使用统一柔色'
  );
  assert.doesNotMatch(uiBlock, /rgba\(0,\s*0,\s*0,\s*0\.03\)/, '主面板不应保留暗色日志底');
  assert.doesNotMatch(uiBlock, /border-color:\s*rgba\(47,\s*84,\s*235,\s*0\.4\)/, '辅助开关 hover 不应保留硬编码蓝色边框');
});

test('主样式层不覆盖万能查数头部统一表面 token', () => {
  const uiBlock = getMainUIBlock();
  assert.match(
    uiBlock,
    /#am-magic-report-popup \.am-magic-header \{[\s\S]*?background:\s*var\(--am26-surface-strong\) !important;/,
    '主样式层不应把万能查数头部覆盖回旧半透明背景'
  );
  assert.doesNotMatch(
    uiBlock,
    /#am-magic-report-popup \.am-magic-header \{[\s\S]*?background:\s*rgba\(255,\s*255,\s*255,\s*0\.3\) !important;/,
    '万能查数头部不应保留旧 rgba 背景覆盖'
  );
});

test('主助手配置读写使用安全存储封装，避免部分浏览器阻断辅助显示启动', () => {
  const bootstrapBlock = getMainBootstrapBlock();
  assert.match(bootstrapBlock, /const fallbackStorage = new Map\(\);/, '缺少配置存储内存兜底');
  assert.match(bootstrapBlock, /const safeStorageGetItem = \(key\) => \{[\s\S]*localStorage\.getItem\(key\)[\s\S]*catch \(err\)[\s\S]*fallbackStorage\.has\(key\)/, '配置读取未捕获 localStorage 异常并兜底');
  assert.match(bootstrapBlock, /const safeStorageSetItem = \(key, value\) => \{[\s\S]*fallbackStorage\.set\(key, text\)[\s\S]*localStorage\.setItem\(key, text\)[\s\S]*catch \(err\)/, '配置写入未捕获 localStorage 异常并兜底');
  assert.doesNotMatch(bootstrapBlock, /localStorage\.(getItem|setItem)\(CONSTANTS\.STORAGE_KEY/, '主配置仍在直接读写 localStorage');
});

test('请求历史缓冲过滤高频埋点并限制常驻体积', () => {
  const bootstrapBlock = getMainBootstrapBlock();
  assert.match(bootstrapBlock, /requestHistoryLimit:\s*1200,/, '请求历史默认上限应收敛到 1200，避免 Chrome 长期保留高频请求对象');
  assert.match(bootstrapBlock, /requestHistoryBodyCharLimit:\s*240000,/, '请求历史应限制单条 body 文本体积');
  assert.match(
    bootstrapBlock,
    /shouldSkipRequestHistory\(normalizedUrl = ''\)[\s\S]*hostname === 'club\.alimama\.com'[\s\S]*pathname === '\/api\/b\/side\/engine\/trace\/report\.json'/,
    '请求历史未过滤 club.alimama.com 高频曝光埋点'
  );
  assert.match(bootstrapBlock, /return `\$\{text\.slice\(0, maxLength\)\}\.\.\.\[AM_TRUNCATED:\$\{text\.length\}\]`;/, '超大 body 未保留可识别截断标记');
  assert.match(bootstrapBlock, /body:\s*this\.normalizeRequestHistoryBody\(entry\?\.body \?\? null\)/, 'recordRequest 未在入队前归一化 body');
  assert.match(bootstrapBlock, /const maxSize = Math\.max\(300,[\s\S]*1200\);/, '请求历史运行时上限兜底不应回退到 4000');
  assert.match(bootstrapBlock, /const fallbackLimit = Number\.isFinite\(fallbackLimitRaw\) \? fallbackLimitRaw : 1200;/, 'getRequestHistory 默认读取上限不应回退到 4000');
});

test('请求历史运行时保留业务请求并跳过 trace 埋点', () => {
  const manager = createHookManagerForTest();
  manager.recordRequest({
    method: 'GET',
    url: 'https://club.alimama.com/api/b/side/engine/trace/report.json?bizCode=universalBP&actionType=pv',
    source: 'xhr'
  });
  assert.equal(manager.requestHistory.length, 0, 'trace report 埋点不应进入常驻请求历史');

  manager.recordRequest({
    method: 'POST',
    url: 'https://one.alimama.com/campaign/budget/batchUpdate.json?bizCode=onebpSite',
    body: '{"campaignId":"123","dayBudget":220.8}',
    source: 'xhr'
  });
  assert.equal(manager.requestHistory.length, 1, '普通业务 JSON 请求应保留');
  assert.equal(manager.requestHistory[0].method, 'POST');
  assert.match(manager.requestHistory[0].url, /\/campaign\/budget\/batchUpdate\.json\?bizCode=onebpSite$/);
  assert.equal(manager.requestHistory[0].body, '{"campaignId":"123","dayBudget":220.8}');

  const params = new URLSearchParams();
  params.set('dynamicToken', 'tok_1');
  params.set('loginPointId', 'lp_1');
  params.set('csrfID', 'csrf_1');
  manager.recordRequest({
    method: 'POST',
    url: '/ai/report/dataQuery.json',
    body: params,
    source: 'fetch'
  });
  const aiHistory = manager.getRequestHistory({ includePattern: /\/ai\/report\//i });
  assert.equal(aiHistory.length, 1, 'AI report 请求应可按路径回放');
  assert.match(aiHistory[0].body, /dynamicToken=tok_1/);
  assert.match(aiHistory[0].body, /loginPointId=lp_1/);
  assert.match(aiHistory[0].body, /csrfID=csrf_1/);
});

test('请求历史运行时裁剪上限并摘要化大 body', () => {
  const manager = createHookManagerForTest();
  manager.requestHistoryLimit = 300;
  manager.requestHistoryBodyCharLimit = 12000;
  for (let index = 0; index < 305; index++) {
    manager.recordRequest({
      method: 'GET',
      url: `https://one.alimama.com/member/getMemberConfig.json?seq=${index}`,
      source: 'xhr'
    });
  }
  assert.equal(manager.requestHistory.length, 300, '请求历史应裁剪到配置上限');
  assert.deepEqual(
    [
      new URL(manager.requestHistory[0].url).searchParams.get('seq'),
      new URL(manager.requestHistory[manager.requestHistory.length - 1].url).searchParams.get('seq')
    ],
    ['5', '304'],
    '请求历史应保留最近请求'
  );

  manager.recordRequest({
    method: 'POST',
    url: 'https://one.alimama.com/campaign/create.json',
    body: 'x'.repeat(13050),
    source: 'fetch'
  });
  const last = manager.requestHistory[manager.requestHistory.length - 1];
  assert.ok(last.body.length < 13050, '超大 body 不应完整常驻保留');
  assert.match(last.body, /\[AM_TRUNCATED:13050\]$/, '超大 body 应保留截断标记和原始长度');
});

test('主助手 DOM 观察覆盖属性和文本变化，兼容 SPA 表格复用', () => {
  const entrypointBlock = getMainEntrypointBlock();
  assert.match(entrypointBlock, /observer\.observe\(document\.body,\s*\{[\s\S]*childList:\s*true,[\s\S]*subtree:\s*true,[\s\S]*attributes:\s*true,[\s\S]*attributeFilter:\s*\[[\s\S]*'class'[\s\S]*'style'[\s\S]*'aria-hidden'[\s\S]*'disabled'[\s\S]*'mx-view'[\s\S]*\],[\s\S]*characterData:\s*true[\s\S]*\}\);/, 'MutationObserver 未覆盖属性/文本变化');
});

test('辅助显示标签样式保留单元格占位宽度', () => {
  assert.match(source, /TAG_BASE_STYLE:\s*'[^']*display:inline-flex;[^']*height:var\(--mx-effects-tag-height,16px\);[^']*width:100%;margin-top:2px;/, '辅助标签未保留 width:100% 与 margin-top 占位样式');
});

test('辅助显示只选择当前可见且有可见行的表格', () => {
  assert.match(source, /isElementVisible\(el\)\s*\{[\s\S]*while\s*\(node && node\.nodeType === 1\)[\s\S]*aria-hidden[\s\S]*getClientRects\(\)[\s\S]*rect\.width > 0 && rect\.height > 0/, '可见性判断未覆盖祖先隐藏和实际尺寸');
  assert.match(source, /getTableVisibleRowCount\(table,\s*maxScanRows = 30\)/, '缺少表格可见行计数');
  assert.match(source, /const visibleRowCount = visible \? this\.getTableVisibleRowCount\(table\) : 0;[\s\S]*if \(!visible \|\| visibleRowCount <= 0\) return;/, '表格选择仍可能命中不可见表格副本');
});

test('辅助显示会遍历所有可见指标表格，避免只更新上方汇总表', () => {
  assert.match(source, /resolveTableContexts\(\)\s*\{[\s\S]*return contexts;[\s\S]*resolveTableContext\(\)\s*\{[\s\S]*return contexts\[0\] \|\| null;/, '辅助显示未保留多表格上下文集合');
  assert.match(source, /tableContexts\.forEach\(tableContext => \{[\s\S]*updatedCount \+= this\.runTableContext\(tableContext,\s*totals\);[\s\S]*\}\);/, '辅助显示未遍历所有候选表格渲染');
  assert.match(source, /applyAutoSort\(tableContexts = \[\]\)[\s\S]*return true; \/\/ 等待排序完成后再渲染数据/, '多表格场景未把自动排序收口为一次触发');
});

test('辅助显示提供页面内诊断函数，便于定位标签存在但不可见', () => {
  assert.match(source, /getAssistDisplayDiagnostics\(\)\s*\{[\s\S]*tagCount:[\s\S]*visibleTagCount:[\s\S]*tableCount:[\s\S]*tables:[\s\S]*sampleTags:/, '缺少辅助显示诊断数据');
  assert.match(source, /Object\.defineProperty\(window,\s*'__AM_ASSIST_DISPLAY_DIAGNOSTICS__'[\s\S]*Core\.getAssistDisplayDiagnostics\(\)/, '缺少页面内辅助显示诊断函数');
});
