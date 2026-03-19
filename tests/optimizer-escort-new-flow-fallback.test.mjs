import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const coreSource = readFileSync(new URL('../src/optimizer/core.js', import.meta.url), 'utf8');
const uiSource = readFileSync(new URL('../src/optimizer/ui.js', import.meta.url), 'utf8');

test('无 actionList 时可识别小万护航新链路信号', () => {
    assert.match(
        coreSource,
        /护航工作授权[\s\S]*确认修改规划/,
        '新护航链路关键词缺失，无法识别待授权流程'
    );
});

test('命中新链路后会走 openV3 护航授权接口', () => {
    assert.match(
        coreSource,
        /API\.request\('https:\/\/ai\.alimama\.com\/ai\/escort\/openV3\.json'/,
        '新链路未提交 openV3 护航授权接口'
    );
});

test('openV3 授权请求仅保留护航权益（不勾选其他调控）', () => {
    assert.match(
        coreSource,
        /userSetting:\s*\{[\s\S]*bidConstraintValue:\s*\{\s*enabled:\s*false\s*\}[\s\S]*budget:\s*\{\s*enabled:\s*false\s*\}[\s\S]*\}[\s\S]*actionType:\s*openV3ActionType/,
        'openV3 请求未固定为仅护航权益配置'
    );
});

test('openV3 成功后卡片状态更新为护航中', () => {
    assert.match(
        coreSource,
        /card\.setStatus\(openV3Success \? '护航中' : '失败',\s*openV3Success \? 'success' : 'error'\)/,
        'openV3 成功后未更新为护航中状态'
    );
});

test('计划处于护航中/已结束时仍会强制重新提交一次护航', () => {
    assert.match(
        coreSource,
        /护航调优中\|护航中\|护航工作报告[\s\S]*护航已结束[\s\S]*按配置强制重新提交护航/,
        '未实现忽略原状态并强制重新提交护航'
    );
});

test('新链路会解析 escortSettingTable 并渲染方案详情', () => {
    assert.match(
        coreSource,
        /renderCode === 'escortSettingTable'[\s\S]*normalizeEscortSettingTable[\s\S]*UI\.renderEscortSettingTableToCard/,
        '新链路未解析并渲染 escortSettingTable 方案'
    );
});

test('旧 actionList 链路仍保留 open.json 提交', () => {
    assert.match(
        coreSource,
        /API\.request\('https:\/\/ai\.alimama\.com\/ai\/escort\/open\.json',\s*\{[\s\S]*actionList/,
        '旧护航 actionList 链路被误删'
    );
});

test('无 actionList 时会读取计划行护航状态做兜底', () => {
    assert.match(
        coreSource,
        /计划护航已结束（页面状态识别）[\s\S]*计划当前处于小万护航中（页面状态识别）[\s\S]*按配置强制重新提交护航/,
        '未实现基于计划行状态的护航兜底识别'
    );
});

test('escortSettingTable 渲染包含操作项与范围信息', () => {
    assert.match(
        uiSource,
        /renderEscortSettingTableToCard[\s\S]*operationList[\s\S]*范围[\s\S]*提交按钮/,
        'escortSettingTable 渲染信息不完整'
    );
});
