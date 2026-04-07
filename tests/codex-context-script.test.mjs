import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../scripts/codex-context.sh', import.meta.url), 'utf8');

test('codex-context 限定检索范围并排除生成产物', () => {
    assert.match(source, /SEARCH_SCOPE=\(/, '缺少固定检索范围');
    assert.match(source, /src/, '检索范围缺少 src');
    assert.match(source, /tests/, '检索范围缺少 tests');
    assert.match(source, /scripts/, '检索范围缺少 scripts');
    assert.match(source, /docs/, '检索范围缺少 docs');
    assert.match(source, /README\.md/, '检索范围缺少 README.md');
    assert.match(source, /package\.json/, '检索范围缺少 package.json');
    assert.match(source, /AGENTS\.md/, '检索范围缺少 AGENTS.md');
    assert.match(source, /--glob '!阿里妈妈多合一助手\.js'/, '缺少生成主脚本排除规则');
    assert.match(source, /--glob '!dist\/\*\*'/, '缺少 dist 目录排除规则');
    assert.match(source, /--glob '!node_modules\/\*\*'/, '缺少 node_modules 排除规则');
});

test('codex-context 提供 map find changed 子命令', () => {
    assert.match(source, /map\)/, '缺少 map 子命令');
    assert.match(source, /find\)/, '缺少 find 子命令');
    assert.match(source, /changed\)/, '缺少 changed 子命令');
    assert.match(source, /git status --short -- "\$\{SEARCH_SCOPE\[@\]\}"/, 'changed 子命令未聚焦源码范围');
});
