import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../AGENTS.md', import.meta.url), 'utf8');
const lines = source.trim().split(/\r?\n/);
const claudeSource = readFileSync(new URL('../CLAUDE.md', import.meta.url), 'utf8');
const claudeLines = claudeSource.trim().split(/\r?\n/);
const lessonsSource = readFileSync(new URL('../tasks/lessons.md', import.meta.url), 'utf8');

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

test('CLAUDE.md 保持薄入口而非变更日志', () => {
    assert.ok(claudeLines.length <= 30, `CLAUDE.md 当前 ${claudeLines.length} 行，已超出薄入口上限`);
    assert.match(claudeSource, /版本事实源：`src\/entries\/userscript-meta\.js`/, 'CLAUDE.md 应指向 userscript meta 作为版本事实源');
    assert.match(claudeSource, /项目级硬规则以 `AGENTS\.md` 为准/, 'CLAUDE.md 应明确以 AGENTS.md 为准');
    assert.doesNotMatch(claudeSource, /\*\*当前版本\*\*/u, 'CLAUDE.md 不应再承载当前版本展示');
});

test('tasks/lessons.md lesson 编号保持唯一', () => {
    const ids = [...lessonsSource.matchAll(/^## L(\d+) /gm)].map((match) => match[1]);
    assert.ok(ids.length > 0, 'tasks/lessons.md 未找到 lesson 标题');

    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
    assert.deepEqual([...new Set(duplicates)], [], 'tasks/lessons.md 存在重复 lesson 编号');
});
