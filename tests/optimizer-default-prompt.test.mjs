import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const bootstrapSource = readFileSync(new URL('../src/optimizer/bootstrap.js', import.meta.url), 'utf8');
const uiSource = readFileSync(new URL('../src/optimizer/ui.js', import.meta.url), 'utf8');
const coreSource = readFileSync(new URL('../src/optimizer/core.js', import.meta.url), 'utf8');

test('默认诊断话术为深度拿量', () => {
    assert.match(
        bootstrapSource,
        /customPrompt:\s*'深度拿量'/,
        'CONFIG.DEFAULT.customPrompt 未设置为 深度拿量'
    );
});

test('历史默认话术会迁移到深度拿量', () => {
    assert.match(
        bootstrapSource,
        /normalizedPrompt === '帮我进行深度诊断'[\s\S]*normalizedPrompt === '深度诊断拿量'/,
        '缺少历史默认话术迁移逻辑'
    );
});

test('UI 话术输入框示例更新为深度拿量', () => {
    assert.match(
        uiSource,
        /placeholder="例: 深度拿量"/,
        'UI 话术输入框 placeholder 未更新'
    );
});

test('旧护航 open.json 提交兜底目标更新为深度拿量', () => {
    assert.match(
        coreSource,
        /target:\s*targetInfo\?\.target\s*\|\|\s*'深度拿量'/,
        'open.json 提交兜底目标未更新为 深度拿量'
    );
});
