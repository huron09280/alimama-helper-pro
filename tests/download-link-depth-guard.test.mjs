import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../阿里妈妈多合一助手.js', import.meta.url), 'utf8');

function extractFindUrlInObject() {
    const match = source.match(
        /findUrlInObject\(obj,\s*source,\s*maxDepth = 20\)\s*\{([\s\S]*?)\n\s*},\n\s*handleResponse\(text,\s*source,\s*meta = \{\}\)\s*\{/
    );
    assert.ok(match, '无法定位 findUrlInObject');
    const fnSource = `function findUrlInObject(obj, source, maxDepth = 20) {${match[1]}\n}`;
    return Function(`return (${fnSource});`)();
}

function buildNestedUrlObject(depth) {
    let value = 'https://demo.oss-accelerate.aliyuncs.com/report.xlsx';
    for (let i = 0; i < depth; i += 1) {
        value = { next: value };
    }
    return value;
}

function createHelper() {
    const hits = [];
    const helper = {
        isDownloadUrl(url) {
            return /xlsx$/i.test(String(url || ''));
        },
        show(url, sourceLabel) {
            hits.push({ url, source: sourceLabel });
        }
    };
    helper.findUrlInObject = extractFindUrlInObject();
    return { helper, hits };
}

test('下载链接递归解析：默认 maxDepth=20 时可命中第 20 层 URL', () => {
    const { helper, hits } = createHelper();
    helper.findUrlInObject(buildNestedUrlObject(20), 'JSON:test');
    assert.equal(hits.length, 1, '第 20 层 URL 不应被深度边界漏检');
});

test('下载链接递归解析：默认 maxDepth=20 时第 21 层仍受限', () => {
    const { helper, hits } = createHelper();
    helper.findUrlInObject(buildNestedUrlObject(21), 'JSON:test');
    assert.equal(hits.length, 0, '第 21 层 URL 应被默认深度限制拦截');
});
