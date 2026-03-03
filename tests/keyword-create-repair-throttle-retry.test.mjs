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
    /const throttleCooldownMs = Math\.max\(0, toNumber\(options\.throttleCooldownMs, Math\.max\(throttleBackoffMs \* 2, 3000\)\)\);/,
    '缺少 throttle 连续失败冷却间隔配置'
  );
  assert.match(
    source,
    /const throttleBurstCooldownMs = Math\.max\(throttleCooldownMs, toNumber\(options\.throttleBurstCooldownMs, Math\.max\(throttleBackoffMs \* 6, 12000\)\)\);/,
    '缺少 throttle 爆发失败冷却间隔配置'
  );
  assert.match(
    source,
    /const caseIntervalMs = Math\.max\(0, toNumber\(options\.caseIntervalMs, 0\)\);[\s\S]*?const caseIntervalJitterMs = Math\.max\(0, toNumber\(options\.caseIntervalJitterMs, 0\)\);/,
    '缺少 case 固定间隔配置，无法降低连续触发风控概率'
  );
  assert.match(
    source,
    /if \(caseIdx > 0\) \{[\s\S]*?const spacingWaitMs = resolveCaseIntervalWaitMs\(\);[\s\S]*?await sleep\(spacingWaitMs\);/,
    '缺少 case 间隔等待逻辑'
  );
  assert.match(
    source,
    /if \(classification === 'throttle' && throttleRetryTimes > 0\) \{[\s\S]*?case_passed_after_throttle_retry[\s\S]*?sceneStats\.repaired \+= 1;[\s\S]*?continue;/,
    '缺少 throttle 重试恢复分支，无法把限流可恢复失败转为修复通过'
  );
  assert.match(
    source,
    /throttleStreak \+= 1;[\s\S]*?const cooldownMs = throttleStreak >= throttleBurstThreshold[\s\S]*?await sleep\(cooldownMs\);/,
    '缺少 throttle 连续失败冷却，容易触发整场景限流雪崩'
  );
});
