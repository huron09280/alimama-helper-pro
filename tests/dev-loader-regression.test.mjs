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

test('Dev Loader 保留 URL 加备注解析兼容', () => {
    assert.match(source, /line\.split\(\/\\s\*\[\|｜\]\\s\*\/\)/, '缺少备注分隔解析');
    assert.match(source, /remark:\s*String\(rawItem\.remark \|\| rawItem\.note \|\| rawItem\.name \|\| ''\)\.trim\(\)/, '缺少备注字段兼容');
});

test('Dev Loader 编辑列表支持逐条显示备注名', () => {
    assert.match(source, /class="am-dev-entry-list"/, '缺少逐条列表容器');
    assert.match(source, /item\.remark \|\| shortenUrl\(item\.url\)/, '列表项未优先显示备注名');
    assert.match(source, /data-role="entry-remark"/, '缺少备注名输入框');
});

test('Dev Loader 编辑列表支持点击编辑单条', () => {
    assert.match(source, /data-act="edit-entry"/, '缺少单条编辑入口');
    assert.match(source, /const beginEditEntry = \(index\) => \{/, '缺少单条编辑逻辑');
    assert.match(source, /entryListBox\.addEventListener\('click', \(event\) => \{/, '缺少列表点击编辑事件');
    assert.doesNotMatch(source, /editBtn\.addEventListener\('click',[\s\S]*?prompt\(/, '编辑列表不应依赖浏览器 prompt');
});

test('Dev Loader 下拉列表优先显示备注', () => {
    assert.match(source, /escapeHtml\(remark \|\| shortenUrl\(url\)\)/, '下拉项未优先显示备注');
    assert.match(source, /getEntryDisplayText\(state\.effective \|\| '未识别', state\.entryMap\)/, '当前入口提示未接入备注显示');
});
