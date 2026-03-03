import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../阿里妈妈多合一助手.js', import.meta.url), 'utf8');

test('创建失败分类新增 throttle 分支，识别 FAIL_SYS_USER_VALIDATE/被挤爆', () => {
  assert.match(
    source,
    /const CREATE_FAILURE_THROTTLE_RE = \/\(FAIL_SYS_USER_VALIDATE\|被挤爆\|稍后重试\|系统繁忙\|服务繁忙\|请求过于频繁\|rate\.\?limit\|throttle\|too\\\\s\*many\\\\s\*requests\)\/i;/,
    '缺少创建限流错误识别正则，无法归类 RGV587 挤爆类错误'
  );
  assert.match(
    source,
    /if \(CREATE_FAILURE_THROTTLE_RE\.test\(text\)\) return 'throttle';/,
    'classifyCreateFailure 未接入 throttle 分类'
  );
});

test('runCreateRepairByItem 对 throttle 错误执行退避重试并可标记修复通过', () => {
  assert.match(
    source,
    /const throttleRetryTimes = Math\.max\(0, Math\.min\(6, toNumber\(options\.throttleRetryTimes, 2\)\)\);/,
    '缺少 throttle 重试次数配置'
  );
  assert.match(
    source,
    /const throttleBackoffMs = Math\.max\(500, toNumber\(options\.throttleBackoffMs, 1800\)\);/,
    '缺少 throttle 退避时长配置'
  );
  assert.match(
    source,
    /if \(classification === 'throttle' && throttleRetryTimes > 0\) \{[\s\S]*?case_passed_after_throttle_retry[\s\S]*?sceneStats\.repaired \+= 1;[\s\S]*?continue;/,
    '缺少 throttle 重试恢复分支，无法把限流可恢复失败转为修复通过'
  );
});
