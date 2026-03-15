import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../阿里妈妈多合一助手.js', import.meta.url), 'utf8');

function getLoadRecommendedKeywordsBlock() {
  const start = source.indexOf('const loadRecommendedKeywords = async');
  const end = source.indexOf('const maybeAutoLoadManualKeywords =', start);
  assert.ok(start > -1 && end > start, '无法定位 loadRecommendedKeywords 代码块');
  return source.slice(start, end);
}

test('点击加载推荐关键词后会输出完整 console 报告', () => {
  const block = getLoadRecommendedKeywordsBlock();
  assert.match(
    source,
    /const logRecommendedKeywordConsoleReport = \(/,
    '缺少推荐关键词 console 报告函数'
  );
  assert.match(
    block,
    /logRecommendedKeywordConsoleReport\(\s*\{/,
    'loadRecommendedKeywords 未调用 console 报告函数'
  );
  for (const key of ['recommendedWords', 'normalizedRecommend', 'manualWords', 'mergedWords']) {
    assert.match(
      block,
      new RegExp(`\\b${key}\\b`),
      `console 报告未包含字段: ${key}`
    );
  }
});
