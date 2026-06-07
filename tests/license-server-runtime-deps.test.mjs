import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const manifest = JSON.parse(
    readFileSync(new URL('../services/license-server/package.json', import.meta.url), 'utf8')
);
const lockfile = JSON.parse(
    readFileSync(new URL('../services/license-server/package-lock.json', import.meta.url), 'utf8')
);
const reviewScript = readFileSync(new URL('../scripts/review-team.sh', import.meta.url), 'utf8');

test('license-server package.json 声明 tablestore 运行时依赖', () => {
    const dep = String(manifest?.dependencies?.tablestore || '').trim();
    assert.ok(dep, '缺少 dependencies.tablestore');
});

test('license-server package-lock.json 锁定 tablestore 依赖', () => {
    const rootDeps = lockfile?.packages?.['']?.dependencies || {};
    const legacyDeps = lockfile?.dependencies || {};
    const hasRootDep = Object.prototype.hasOwnProperty.call(rootDeps, 'tablestore')
        || Object.prototype.hasOwnProperty.call(legacyDeps, 'tablestore');
    assert.ok(hasRootDep, 'package-lock 缺少根依赖 tablestore');

    const lockPackages = lockfile?.packages || {};
    const hasResolvedEntry = Object.prototype.hasOwnProperty.call(lockPackages, 'node_modules/tablestore')
        || Object.prototype.hasOwnProperty.call(legacyDeps, 'tablestore');
    assert.ok(hasResolvedEntry, 'package-lock 缺少 node_modules/tablestore 解析条目');
});

test('license-server 通过 overrides 锁定 protobufjs 修复版本', () => {
    assert.equal(manifest?.overrides?.protobufjs, '8.6.1', 'package.json 必须通过 overrides 锁定 protobufjs 修复版本');
    const lockPackages = lockfile?.packages || {};
    const protobufEntry = lockPackages['node_modules/protobufjs'];
    assert.equal(protobufEntry?.version, '8.6.1', 'package-lock 未锁定 protobufjs 8.6.1');
    assert.ok(!lockPackages['node_modules/@protobufjs/utf8'], 'protobufjs 8.x 不应继续安装存在 audit 告警的 @protobufjs/utf8');
});

test('review-team 包含 license-server 依赖校验步骤', () => {
    assert.match(reviewScript, /check-license-server-deps\.mjs/, 'review-team 未接入依赖校验脚本');
});
