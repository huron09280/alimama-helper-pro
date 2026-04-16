import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const serviceIndex = readFileSync(new URL('../services/license-server/index.mjs', import.meta.url), 'utf8');
const html = readFileSync(new URL('../dev/license-admin.html', import.meta.url), 'utf8');
const serviceHtml = readFileSync(new URL('../services/license-server/license-admin.html', import.meta.url), 'utf8');

test('服务端会累积记录同店铺子账号并写入状态快照', () => {
    assert.match(serviceIndex, /const normalizeSubAccountList = \(value = \[\], shopName = ''\) => \{/, '缺少子账号列表归一化函数');
    assert.match(serviceIndex, /const nextSubAccounts = normalizeSubAccountList\(/, '活跃店铺记录缺少子账号累积入口');
    assert.match(serviceIndex, /subAccounts:\s*nextSubAccounts,/, '活跃店铺记录未写入子账号列表');
    assert.match(serviceIndex, /subAccounts:\s*normalizeSubAccountList\(entry\.subAccounts,\s*entry\.shopName\),/, '状态快照未持久化子账号列表');
    assert.match(serviceIndex, /const subAccount = normalizeSubAccount\(payload\.subAccount \|\| ''\);/, 'verify 未透传 subAccount 字段');
    assert.match(serviceIndex, /const subAccounts = Array\.isArray\(payload\.subAccounts\)\s*\?\s*payload\.subAccounts\.map\(\(item\) => normalizeSubAccount\(item\)\)\.filter\(Boolean\)\s*:\s*\[\];/, 'verify 未透传 subAccounts 字段');
    assert.match(serviceIndex, /const subAccounts = normalizeSubAccountList\(/, 'admin_allow 未声明子账号合并入口');
    assert.match(serviceIndex, /MEMORY_SHOP_STORE\.set\(shopId,\s*\{[\s\S]*subAccounts,[\s\S]*authExpiresAt,[\s\S]*\}\);/, 'admin_allow 未把子账号列表写入店铺状态');
});

test('仅授权成功请求才允许把活跃记录回写到店铺状态', () => {
    assert.match(
        serviceIndex,
        /const upsertActiveShopRecord = \(payload = \{\}, verifyResult = \{\}, options = \{\}\) => \{[\s\S]*const syncShopProfile = options && typeof options === 'object' && options\.syncShopProfile === true;[\s\S]*const canSyncShopProfile = syncShopProfile && verifyResult && verifyResult\.authorized === true;[\s\S]*if \(currentShopProfile && canSyncShopProfile\) \{/,
        'upsertActiveShopRecord 未收敛为“显式允许且授权成功”才回写店铺状态'
    );
    assert.match(
        serviceIndex,
        /upsertActiveShopRecord\(checked,\s*\{[\s\S]*authorized:\s*true[\s\S]*code:\s*'ok'[\s\S]*\},\s*\{\s*syncShopProfile:\s*true\s*\}\);/,
        '授权成功分支未显式开启店铺状态回写'
    );
});

test('授权管理页会展示同店铺完整子账号列表', () => {
    assert.match(html, /const normalizeSubAccountList = \(value = \[\], shopName = ''\) => \{/, '本地管理页缺少子账号列表归一化函数');
    assert.match(html, /subAccounts:\s*entry\?\.subAccounts,/, '本地管理页未接入服务端子账号列表字段');
    assert.match(html, /const items = Array\.from\(map\.values\(\)\)\.flatMap\(\(item\) => \{/, '本地管理页未按子账号展开明细行');
    assert.match(html, /const rowSubAccounts = subAccounts\.length \? subAccounts : \['-'\];/, '本地管理页未处理无子账号兜底行');
    assert.match(html, /subAccount:\s*normalizeSubAccount\(subAccount\)\s*\|\|\s*'-',/, '本地管理页未按单子账号写入明细行');

    assert.match(serviceHtml, /const normalizeSubAccountList = \(value = \[\], shopName = ''\) => \{/, '服务端模板缺少子账号列表归一化函数');
    assert.match(serviceHtml, /subAccounts:\s*entry\?\.subAccounts,/, '服务端模板未接入服务端子账号列表字段');
    assert.match(serviceHtml, /const items = Array\.from\(map\.values\(\)\)\.flatMap\(\(item\) => \{/, '服务端模板未按子账号展开明细行');
    assert.match(serviceHtml, /const rowSubAccounts = subAccounts\.length \? subAccounts : \['-'\];/, '服务端模板未处理无子账号兜底行');
    assert.match(serviceHtml, /subAccount:\s*normalizeSubAccount\(subAccount\)\s*\|\|\s*'-',/, '服务端模板未按单子账号写入明细行');
});

test('授权统计按店铺名称聚合而不是按 shopId 回退', () => {
    assert.match(html, /const storeNameKey = normalizeStoreNameKey\(item\.storeName \|\| ''\);[\s\S]*if \(!storeNameKey\) return;[\s\S]*shopStatsMap\.set\(storeNameKey,\s*current\);/, '本地管理页统计未按店铺名称聚合');
    assert.doesNotMatch(html, /shopid:/, '本地管理页统计仍包含按 shopId 回退逻辑');

    assert.match(serviceHtml, /const storeNameKey = normalizeStoreNameKey\(item\.storeName \|\| ''\);[\s\S]*if \(!storeNameKey\) return;[\s\S]*shopStatsMap\.set\(storeNameKey,\s*current\);/, '服务端模板统计未按店铺名称聚合');
    assert.doesNotMatch(serviceHtml, /shopid:/, '服务端模板统计仍包含按 shopId 回退逻辑');
});
