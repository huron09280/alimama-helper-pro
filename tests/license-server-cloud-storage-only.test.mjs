import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../services/license-server/index.mjs', import.meta.url), 'utf8');

test('状态同步与持久化仅走 Tablestore', () => {
    assert.match(
        source,
        /const syncStateBeforeRequest = async \(route = \{\}\) => \{[\s\S]*return syncStateFromTablestore\(\{ force \}\);[\s\S]*\};/,
        'syncStateBeforeRequest 未强制走 Tablestore'
    );
    assert.doesNotMatch(
        source,
        /const syncStateBeforeRequest = async[\s\S]*syncStateFromFile\(/,
        'syncStateBeforeRequest 仍回退到文件存储'
    );
    assert.match(
        source,
        /const persistStateChanges = async \(\) => \{[\s\S]*persistStateToTablestore\(\{ force: true \}\)/,
        'persistStateChanges 未写入 Tablestore'
    );
    assert.doesNotMatch(
        source,
        /const persistStateChanges = async[\s\S]*persistStateToFile\(/,
        'persistStateChanges 仍回退到文件存储'
    );
});

test('Tablestore 不可用时返回统一 503 错误', () => {
    assert.match(source, /const STORAGE_UNAVAILABLE_CODE = 'license_storage_unavailable';/, '缺少云存储不可用错误码');
    assert.match(source, /const responseStorageUnavailable = \(req = \{\}, error = null\) =>/, '缺少云存储不可用响应构造');
    assert.match(
        source,
        /try \{\s*assertTablestoreEnabled\(\);[\s\S]*await syncStateBeforeRequest\(route\);[\s\S]*\} catch \(error\) \{[\s\S]*return responseStorageUnavailable\(req, error\);[\s\S]*\}/,
        'handler 未在云存储异常时返回统一 503'
    );
});
