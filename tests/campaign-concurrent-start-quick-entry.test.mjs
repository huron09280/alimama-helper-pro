import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../阿里妈妈多合一助手.js', import.meta.url), 'utf8');

function getCampaignQuickEntryBlock() {
    const start = source.indexOf('const CampaignIdQuickEntry = {');
    const end = source.indexOf('// ==========================================\n    // 7. 启动程序', start);
    assert.ok(start > -1 && end > start, '无法定位 CampaignIdQuickEntry 代码块');
    return source.slice(start, end);
}

test('计划ID快捷入口包含并发开启按钮与样式标识', () => {
    const block = getCampaignQuickEntryBlock();
    assert.match(block, /CONCURRENT_START_ICON_SVG/, '缺少并发开启按钮图标');
    assert.match(block, /data-am-campaign-concurrent-start/, '缺少并发开启 data 标识');
    assert.match(source, /\.am-campaign-concurrent-start-btn/, '缺少并发开启按钮样式类');
});

test('并发开启流程包含全量暂停与原在投并发重试', () => {
    const block = getCampaignQuickEntryBlock();
    assert.match(block, /MAX_START_RETRIES:\s*\d+/, '缺少并发重试次数配置');
    assert.match(block, /runConcurrentStartFlow\(/, '缺少并发开启主流程函数');
    assert.match(block, /resolveConcurrentTargetsByItem\(/, '缺少按商品ID的全量计划识别逻辑');
    assert.match(block, /resolveResumeTargets\(/, '缺少重开计划集合解析逻辑');
    assert.match(block, /resolveConcurrentTargets\(/, '缺少同商品计划集合识别逻辑');
    assert.match(block, /collectSiteCustomTargetBuckets\(/, '缺少全站与自定义计划分桶逻辑');
    assert.match(block, /shouldRunSiteCustomBreakthrough\(/, '缺少全站与自定义同开突破触发逻辑');
    assert.match(block, /runSiteCustomBreakthroughStrategy\(/, '缺少全站与自定义同开突破执行逻辑');
    assert.match(block, /updateCampaignStatusBatchByBiz\(/, '缺少按业务线批量开启突破逻辑');
    assert.match(block, /mandatorySiteTargets/, '缺少货品全站计划强制开启集合');
    assert.match(block, /item\.bizCode === 'onebpSite'/, '缺少货品全站计划筛选逻辑');
    assert.match(
        block,
        /Promise\.allSettled\(\s*allTargets\.map\(target => this\.updateCampaignStatus\(target\.campaignId,\s*target\.bizCode,\s*0,\s*authContext\)\)\s*\)/s,
        '缺少同商品全量暂停并发提交逻辑'
    );
    assert.match(
        block,
        /resumeTargets\.map\(target => this\.updateCampaignStatus\(target\.campaignId,\s*target\.bizCode,\s*1,\s*authContext\)\)/,
        '缺少原在投计划并发重开逻辑'
    );
    assert.match(block, /originalActiveTargets/, '缺少原在投计划集合回溯逻辑');
});

test('并发开启流程使用冲突查询与后台更新接口', () => {
    const block = getCampaignQuickEntryBlock();
    assert.match(block, /campaign\/diff\/findList\.json/, '缺少冲突查询接口');
    assert.match(block, /campaign\/horizontal\/findPage\.json/, '缺少按商品ID查询计划接口');
    assert.match(block, /itemId:\s*Number\(normalizedItemId\)/, '缺少商品ID计划查询参数');
    assert.match(block, /campaignList:\s*\[\s*\{\s*campaignId:\s*numericCampaignId,\s*displayStatus:/s, '缺少状态批量更新 payload');
    assert.match(block, /campaign\/updatePart\.json/, '缺少状态更新接口');
});

test('并发开启流程包含弹窗日志并在成功后提示', () => {
    const block = getCampaignQuickEntryBlock();
    assert.match(source, /#am-campaign-concurrent-log-popup/, '缺少并发执行日志弹窗样式');
    assert.match(block, /openConcurrentLogPopup\(/, '缺少并发日志弹窗打开逻辑');
    assert.match(block, /appendConcurrentLog\(/, '缺少并发日志追加逻辑');
    assert.match(block, /setConcurrentLogStatus\(/, '缺少并发日志状态提示逻辑');
    assert.match(block, /setConcurrentLogStatus\(`执行成功：第\$\{result\?\.attempt \|\| 1\}次即完成`, 'success'\)/, '缺少成功状态提示');
});
