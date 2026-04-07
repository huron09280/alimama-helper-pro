import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../阿里妈妈多合一助手.js', import.meta.url), 'utf8');

test('线索推广不再使用 308/74 硬编码模板 ID 兜底', () => {
    assert.doesNotMatch(
        source,
        /planId = runtimeForScene\?\.storeData\?\.planId \|\| 308;/,
        'planId 仍在使用硬编码 308'
    );
    assert.doesNotMatch(
        source,
        /packageTemplateId = runtimeForScene\?\.storeData\?\.packageTemplateId \|\| 74;/,
        'packageTemplateId 仍在使用硬编码 74'
    );
});

test('线索推广缺少关键模板参数时会 fail-fast', () => {
    assert.match(
        source,
        /const leadTemplateTriplet = resolveLeadTemplateTriplet\(\{[\s\S]*?if \(leadTemplateTriplet\.missingFields\.length\) \{[\s\S]*?throw new Error\(`线索推广缺少关键模板参数: \$\{leadTemplateTriplet\.missingFields\.join\(', '\)\}`\);/,
        '缺少线索推广模板参数 fail-fast 保护'
    );
});
