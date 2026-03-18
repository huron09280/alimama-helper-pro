import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

test('package.json 暴露常用开发脚本入口', () => {
    assert.equal(packageJson.private, true, 'package.json 应保持 private');
    assert.equal(packageJson.scripts.build, 'node scripts/build.mjs');
    assert.equal(packageJson.scripts['build:check'], 'node scripts/build.mjs --check');
    assert.equal(packageJson.scripts['build:watch'], 'node scripts/build.mjs --watch');
    assert.equal(packageJson.scripts['check:syntax'], 'node --check "阿里妈妈多合一助手.js"');
    assert.equal(packageJson.scripts.test, 'node --test tests/*.test.mjs');
    assert.equal(packageJson.scripts.review, 'bash scripts/review-team.sh');
    assert.equal(packageJson.scripts['dev:serve'], 'python3 -m http.server 5173');
});
