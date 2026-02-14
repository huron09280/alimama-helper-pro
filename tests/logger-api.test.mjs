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
