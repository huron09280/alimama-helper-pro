import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../AGENTS.md', import.meta.url), 'utf8');
const lines = source.trim().split(/\r?\n/);

test('AGENTS.md 保持精简，避免重新堆入任务级噪声', () => {
    assert.ok(lines.length <= 90, `AGENTS.md 当前 ${lines.length} 行，已超过精简上限`);
    assert.doesNotMatch(source, /页面\s*1|页面\s*15|逐页优化|每完成一个页面切片/, 'AGENTS.md 不应包含历史任务切片噪声');
    assert.doesNotMatch(source, /python3 -m http\.server 5173/, 'AGENTS.md 不应重复列出底层临时命令');
});

test('AGENTS.md 保留项目硬边界', () => {
    [
        'tasks/todo.md',
        'tasks/lessons.md',
        'src/',
        'dist/packages/',
        'dist/extension/',
        'docs/插件UI统一设计规范.md',
        'docs/图标设计规范.md',
        'renderAmIcon()',
        'Chrome DevTools MCP',
        'one.alimama.com',
        'policy token',
        'shopId',
        '__AM_WXT_*',
        '不点击会真实创建、投放、提交、删除或扣费的入口',
        '60 秒',
    ].forEach((needle) => {
        assert.match(source, new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `缺少硬边界：${needle}`);
    });
});
