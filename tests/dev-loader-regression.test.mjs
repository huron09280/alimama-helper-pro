import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../dev/dev-loader.user.js', import.meta.url), 'utf8');

test('Dev Loader 默认候选不包含固定 worktree 路径', () => {
    assert.doesNotMatch(
        source,
        /\/\.codex\/worktrees\/[a-zA-Z0-9_-]+\/alimama-helper-pro\//,
        '不应在默认候选中硬编码特定 worktree 目录'
    );
});

test('Dev Loader GM 请求包含 onabort 兜底，避免候选切换卡死', () => {
    assert.match(
        source,
        /onabort:\s*\(\)\s*=>\s*reject\(new Error\('Request aborted'\)\)/,
        '缺少 GM 请求 onabort 分支'
    );
});

test('Dev Loader 加载失败时会渲染页面可见错误提示', () => {
    assert.match(source, /const showLoadFailureBadge = \(error\) => \{/, '缺少可见错误提示入口');
    assert.match(source, /badge\.id = 'am-dev-loader-error'/, '缺少错误提示节点 ID');
    assert.match(source, /showLoadFailureBadge\(error\);/, '加载失败未触发可见提示');
});
