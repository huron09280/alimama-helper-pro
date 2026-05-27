import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../阿里妈妈多合一助手.js', import.meta.url), 'utf8');

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

test('主助手配置读写使用安全存储封装，避免部分浏览器阻断辅助显示启动', () => {
  const bootstrapBlock = getMainBootstrapBlock();
  assert.match(bootstrapBlock, /const fallbackStorage = new Map\(\);/, '缺少配置存储内存兜底');
  assert.match(bootstrapBlock, /const safeStorageGetItem = \(key\) => \{[\s\S]*localStorage\.getItem\(key\)[\s\S]*catch \(err\)[\s\S]*fallbackStorage\.has\(key\)/, '配置读取未捕获 localStorage 异常并兜底');
  assert.match(bootstrapBlock, /const safeStorageSetItem = \(key, value\) => \{[\s\S]*fallbackStorage\.set\(key, text\)[\s\S]*localStorage\.setItem\(key, text\)[\s\S]*catch \(err\)/, '配置写入未捕获 localStorage 异常并兜底');
  assert.doesNotMatch(bootstrapBlock, /localStorage\.(getItem|setItem)\(CONSTANTS\.STORAGE_KEY/, '主配置仍在直接读写 localStorage');
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
