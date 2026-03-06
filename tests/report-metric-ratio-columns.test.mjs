import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../阿里妈妈多合一助手.js', import.meta.url), 'utf8');

test('汇总指标抓取支持展现量与点击量总量入口', () => {
    assert.ok(
        source.includes('getSummaryMetricTotal(labels = []) {'),
        '缺少通用顶部汇总指标抓取入口'
    );
    assert.ok(
        source.includes('XPathResult.ORDERED_NODE_SNAPSHOT_TYPE'),
        '顶部汇总指标抓取未按多候选节点遍历'
    );
    assert.ok(
        source.includes("not(ancestor::table) and not(ancestor::*[@id='am-helper-panel'])"),
        '顶部汇总指标抓取未排除表格与助手面板，展现量/点击量占比可能取错总量'
    );
    assert.ok(
        source.includes("return this.getSummaryMetricTotal(['展现量', '展示量', '曝光量']);"),
        '缺少展现量总量抓取入口'
    );
    assert.ok(
        source.includes("return this.getSummaryMetricTotal(['点击量', '点击数', '点击次数']);"),
        '缺少点击量总量抓取入口'
    );
});

test('列表列映射会识别展现量列，并让花费占比开关覆盖三列', () => {
    assert.ok(
        source.includes("const map = { cost: -1, wang: -1, carts: [], guide: -1, impression: -1, click: -1, budget: -1 };"),
        '列索引映射未加入展现量列'
    );
    assert.ok(
        source.includes("else if (text.includes('展现量') || text.includes('展示量') || text.includes('曝光量')) map.impression = idx;"),
        '展现量列识别规则缺失'
    );
    assert.ok(
        source.includes("const needRatio = showCostRatio && (colMap.cost > -1 || colMap.impression > -1 || colMap.click > -1);"),
        '花费占比开关仍只覆盖花费列'
    );
});

test('花费占比渲染会同步为花费、展现量、点击量追加同款占比标签', () => {
    assert.ok(
        source.includes("const totalImpression = needRatio && colMap.impression > -1 ? this.getTotalImpression() : 0;"),
        '未在占比渲染前读取展现量总量'
    );
    assert.ok(
        source.includes("const totalClick = needRatio && colMap.click > -1 ? this.getTotalClick() : 0;"),
        '未在占比渲染前读取点击量总量'
    );
    assert.ok(
        source.includes("const ratioTargets = ["),
        '占比渲染未抽出统一目标列表'
    );
    assert.ok(
        source.includes("{ idx: curMap.impression, total: totalImpression }"),
        '占比渲染未覆盖展现量列'
    );
    assert.ok(
        source.includes("{ idx: curMap.click, total: totalClick }"),
        '占比渲染未覆盖点击量列'
    );
    assert.ok(
        source.includes("this.renderTag(cell, 'ratio-tag', `占比: ${((value / total) * 100).toFixed(1)}%`, CONSTANTS.STYLES.ratio)"),
        '展现量/点击量占比未复用现有 ratio 样式渲染'
    );
});
