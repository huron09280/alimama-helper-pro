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
