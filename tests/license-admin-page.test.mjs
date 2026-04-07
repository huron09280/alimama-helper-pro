import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../dev/license-admin.html', import.meta.url), 'utf8');
const serviceHtml = readFileSync(new URL('../services/license-server/license-admin.html', import.meta.url), 'utf8');
const serviceIndex = readFileSync(new URL('../services/license-server/index.mjs', import.meta.url), 'utf8');
const doc = readFileSync(new URL('../docs/授权管理页.md', import.meta.url), 'utf8');
const vercelConfig = readFileSync(new URL('../vercel.json', import.meta.url), 'utf8');
const netlifyConfig = readFileSync(new URL('../netlify.toml', import.meta.url), 'utf8');
const pagesWorkflow = readFileSync(new URL('../.github/workflows/license-admin-pages.yml', import.meta.url), 'utf8');

test('本地授权管理页包含核心配置区与筛选区', () => {
    assert.match(html, /id="am-license-admin-app"/, '缺少管理页根节点');
    assert.match(html, /id="baseUrlInput"/, '缺少授权服务地址输入框');
    assert.match(html, /id="tokenInput"/, '缺少管理员 token 输入框');
    assert.match(html, /id="operatorInput"/, '缺少操作人输入框');
    assert.match(html, /id="keywordInput"/, '缺少关键词筛选输入框');
    assert.match(html, /id="statusSelect"/, '缺少状态筛选下拉');
    assert.match(html, /id="activeWithinInput"[^>]*value="0"/, '最近活跃默认筛选值应为 0');
});

test('本地授权管理页包含店铺列表与行级授权操作', () => {
    assert.match(html, /id="tableBody"/, '缺少店铺列表容器');
    assert.match(html, /首次使用/, '缺少首次使用时间列');
    assert.match(html, /授权到期/, '缺少授权到期时间列');
    assert.match(html, /data-col="auth-expiry"/, '授权到期列缺少独立标记');
    assert.match(html, /data-role="inline-menu-toggle"/, '缺少网页内下拉触发器');
    assert.match(html, /data-role="inline-menu-action"/, '缺少网页内下拉操作项');
    assert.match(html, /data-role="delete-row-btn"/, '缺少行内删除按钮');
    assert.match(html, /data-role="expiry-date-input"/, '缺少到期日期输入框');
    assert.match(html, /data-action="allow-on">已授权<\/button>/, '授权状态下拉缺少已授权项');
    assert.match(html, /data-action="allow-off">未授权<\/button>/, '授权状态下拉缺少未授权项');
    assert.match(html, /data-action="revoke-on">已吊销<\/button>/, '吊销状态下拉缺少已吊销项');
    assert.match(html, /data-action="revoke-off">未吊销<\/button>/, '吊销状态下拉缺少未吊销项');
    assert.match(html, /data-action="allow-1m"/, '网页内下拉缺少1个月授权');
    assert.match(html, /data-action="allow-3m"/, '网页内下拉缺少3个月授权');
    assert.match(html, /data-action="allow-1y"/, '网页内下拉缺少1年授权');
    assert.match(html, /授权（默认3天）/, '授权日期下拉缺少默认3天授权');
    assert.match(html, /browser:\s*\$\{item\.browserVersion \|\| '-'\}/, '详情区缺少浏览器版本展示');
    assert.match(html, /os:\s*\$\{item\.osVersion \|\| '-'\}/, '详情区缺少操作系统版本展示');
    assert.doesNotMatch(html, /data-role="row-action-select"/, '不应再使用原生 select 行级下拉');
    assert.doesNotMatch(html, /window\.prompt\(/, '不应再使用浏览器 prompt');
    assert.doesNotMatch(html, /window\.confirm\(/, '不应再使用浏览器 confirm');
    assert.match(html, /id="logBox"/, '缺少操作日志容器');
});

test('本地授权管理页调用固定管理 API 路径', () => {
    assert.match(html, /state:\s*'\/v1\/license\/admin\/state'/, '管理状态 API 路径缺失或变更');
    assert.match(html, /allow:\s*'\/v1\/license\/admin\/allow'/, '授权接口路径缺失或变更');
    assert.match(html, /revoke:\s*'\/v1\/license\/admin\/revoke'/, '吊销接口路径缺失或变更');
    assert.match(html, /delete:\s*'\/v1\/license\/admin\/delete'/, '删除接口路径缺失或变更');
    assert.match(html, /x-am-admin-token/, '管理鉴权头缺失');
    assert.match(html, /durationKey/, '授权有效期参数缺失');
    assert.match(html, /defaultAuthValidDays/, '默认授权有效期展示字段缺失');
});

test('服务端管理页模板包含首次使用与到期日期直设能力', () => {
    assert.match(serviceHtml, /id="tableBody"/, '服务端模板缺少店铺列表容器');
    assert.match(serviceHtml, /首次使用/, '服务端模板缺少首次使用时间列');
    assert.match(serviceHtml, /授权到期/, '服务端模板缺少授权到期时间列');
    assert.match(serviceHtml, /id="activeWithinInput"[^>]*value="0"/, '服务端模板最近活跃默认筛选值应为 0');
    assert.match(serviceHtml, /data-col="auth-expiry"/, '服务端模板授权到期列缺少独立标记');
    assert.match(serviceHtml, /data-role="inline-menu-toggle"/, '服务端模板缺少网页内下拉触发器');
    assert.match(serviceHtml, /data-role="inline-menu-action"/, '服务端模板缺少网页内下拉操作项');
    assert.match(serviceHtml, /data-role="delete-row-btn"/, '服务端模板缺少行内删除按钮');
    assert.match(serviceHtml, /data-role="expiry-date-input"/, '服务端模板缺少到期日期输入框');
    assert.match(serviceHtml, /授权（默认3天）/, '服务端模板缺少授权日期默认3天下拉项');
    assert.match(serviceHtml, /browser:\s*\$\{item\.browserVersion \|\| '-'\}/, '服务端模板缺少浏览器版本展示');
    assert.match(serviceHtml, /os:\s*\$\{item\.osVersion \|\| '-'\}/, '服务端模板缺少操作系统版本展示');
    assert.doesNotMatch(serviceHtml, /data-role="row-action-select"/, '服务端模板不应再使用原生 select 行级下拉');
    assert.doesNotMatch(serviceHtml, /window\.prompt\(/, '服务端模板不应使用浏览器 prompt');
    assert.doesNotMatch(serviceHtml, /window\.confirm\(/, '服务端模板不应使用浏览器 confirm');
});

test('服务端入口从模板文件加载授权管理页', () => {
    assert.match(serviceIndex, /ADMIN_PAGE_TEMPLATE_PATH/, '服务端未声明管理页模板路径');
    assert.match(serviceIndex, /license-admin\.html/, '服务端模板文件名异常');
    assert.match(serviceIndex, /fs\.readFileSync\(ADMIN_PAGE_TEMPLATE_PATH,\s*'utf8'\)/, '服务端未从模板文件读取管理页');
    assert.match(serviceIndex, /\/v1\/license\/admin\/delete/, '服务端缺少删除路由');
    assert.match(serviceIndex, /resolveVerifyClientProfile/, '服务端缺少客户端环境信息采集');
    assert.match(serviceIndex, /browserVersion/, '服务端缺少浏览器版本字段');
    assert.match(serviceIndex, /osVersion/, '服务端缺少操作系统版本字段');
});

test('授权管理文档包含管理页入口与核心接口说明', () => {
    assert.match(doc, /dev\/license-admin\.html/, '文档未包含管理页入口');
    assert.match(doc, /GET \/v1\/license\/admin\/state/, '文档缺少管理状态接口');
    assert.match(doc, /POST \/v1\/license\/admin\/allow/, '文档缺少授权接口');
    assert.match(doc, /POST \/v1\/license\/admin\/revoke/, '文档缺少吊销接口');
    assert.match(doc, /POST \/v1\/license\/admin\/delete/, '文档缺少删除接口');
    assert.match(doc, /按新店铺语义重新接入/, '文档缺少删除后按新店铺重连说明');
    assert.match(doc, /\/v1\/license\/verify/, '文档缺少与插件校验接口的联动说明');
    assert.match(doc, /browserVersion/, '文档缺少浏览器版本字段说明');
    assert.match(doc, /osVersion/, '文档缺少操作系统版本字段说明');
    assert.match(doc, /deleted\.memory/, '文档缺少删除重置字段说明');
    assert.match(doc, /x-oss-force-download/, '文档缺少默认域名强制下载特征说明');
    assert.match(doc, /0048-00000001/, '文档缺少 OSS 错误码特征说明');
    assert.match(doc, /how-to-ensure-an-object-is-previewed-when-you-access-the-object/, '文档缺少官方说明链接');
    assert.match(doc, /GitHub Pages/, '文档缺少 GitHub Pages 托管说明');
    assert.match(doc, /Vercel/, '文档缺少 Vercel 托管说明');
    assert.match(doc, /Netlify/, '文档缺少 Netlify 托管说明');
});

test('默认域名静态托管配置指向授权管理页', () => {
    assert.match(vercelConfig, /\"destination\":\s*\"\/dev\/license-admin\.html\"/, 'Vercel 根路径未指向授权管理页');
    assert.match(netlifyConfig, /to = \"\/dev\/license-admin\.html\"/, 'Netlify 根路径未指向授权管理页');
    assert.match(pagesWorkflow, /cp dev\/license-admin\.html \.pages\/index\.html/, 'GitHub Pages 工作流未发布授权管理页');
    assert.match(pagesWorkflow, /actions\/deploy-pages@v4/, 'GitHub Pages 工作流缺少部署步骤');
});
