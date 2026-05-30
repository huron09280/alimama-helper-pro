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
    assert.match(html, /id="rememberTokenInput"[^>]*type="checkbox"/, '缺少管理员 token 持久化开关');
    assert.match(html, /id="operatorInput"/, '缺少操作人输入框');
    assert.match(html, /id="keywordInput"/, '缺少关键词筛选输入框');
    assert.match(html, /id="statusSelect"/, '缺少状态筛选下拉');
    assert.match(html, /id="expirySelect"/, '缺少到期筛选下拉');
    assert.match(html, /id="activeWithinInput"[^>]*value="0"/, '最近活跃默认筛选值应为 0');
    assert.match(html, /<option value="expired">已过期<\/option>/, '状态筛选缺少已过期项');
    assert.match(html, /<option value="not-expired">未过期<\/option>/, '到期筛选缺少未过期项');
});

test('本地授权管理页包含店铺列表与行级授权操作', () => {
    assert.match(html, /id="tableBody"/, '缺少店铺列表容器');
    assert.match(html, /子账号/, '缺少子账号列');
    assert.match(html, /店铺名称/, '缺少店铺名称列');
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

test('授权管理页使用统一浅玻璃工作台视觉', () => {
    assert.match(html, /--am26-panel-strong:/, '管理页缺少统一 am26 面板 token');
    assert.match(html, /background:\s*var\(--am26-panel-strong\);/, '管理页面板未使用统一浅玻璃背景');
    assert.match(html, /backdrop-filter:\s*blur\(20px\) saturate\(1\.24\);/, '管理页面板缺少玻璃模糊');
    assert.match(html, /box-shadow:\s*var\(--am26-shadow\);/, '管理页未使用统一浅玻璃阴影');
    assert.match(html, /class="confirm-mask"/, '管理页缺少统一确认遮罩');
    assert.match(html, /background: linear-gradient\(135deg, rgba\(255, 255, 255, 0\.72\), rgba\(255, 255, 255, 0\.48\)\);/, '确认遮罩未使用白色玻璃背景');
});

test('授权管理页默认不把管理员 token 持久化到本机', () => {
    const saveSettingsBlock = html.slice(
        html.indexOf('const saveSettings = () => {'),
        html.indexOf('const getSettings = () => {')
    );
    assert.match(html, /const SESSION_TOKEN_KEY = '__AM_LICENSE_ADMIN_SESSION_TOKEN_V1__';/, '缺少 session token 存储键');
    assert.match(html, /const rememberToken = !!dom\.rememberTokenInput\.checked;/, '缺少 token 持久化开关读取');
    assert.match(html, /if \(rememberToken\) \{[\s\S]*next\.token = token;[\s\S]*sessionStorage\.removeItem\(SESSION_TOKEN_KEY\);[\s\S]*\} else \{[\s\S]*sessionStorage\.setItem\(SESSION_TOKEN_KEY, token\);[\s\S]*\}/, '管理员 token 默认应只保存到 sessionStorage');
    assert.match(html, /localStorage\.setItem\(SETTINGS_KEY, JSON\.stringify\(next\)\);/, '非敏感设置仍应保存到 localStorage');
    assert.doesNotMatch(saveSettingsBlock, /token:\s*String\(dom\.tokenInput\.value \|\| ''\)\.trim\(\)/, '管理员 token 不应无条件写入 localStorage settings');
});

test('授权管理页写操作必须经过自定义确认弹窗', () => {
    assert.match(html, /id="confirmMask" role="dialog" aria-modal="true"/, '缺少确认弹窗 dialog 语义');
    assert.match(html, /id="confirmCancelBtn">取消<\/button>/, '确认弹窗缺少取消按钮');
    assert.match(html, /const requestActionConfirm = \(shopId, action, context = \{\}\) => new Promise/, '缺少写操作确认流程');
    assert.match(html, /dom\.confirmCancelBtn\.focus\(\{ preventScroll: true \}\);/, '确认弹窗默认焦点应停在取消按钮');
    assert.match(html, /await executeShopActionWithConfirm\(shopId, 'delete-row'\);/, '删除当前行未先进入确认弹窗');
    assert.match(html, /await executeShopActionWithConfirm\(shopId, action\);/, '菜单写操作未先进入确认弹窗');
    assert.match(html, /await executeShopActionWithConfirm\(shopId, 'set-expire-date', \{ expireDate \}\);/, '日期直设未先进入确认弹窗');
    assert.match(html, /if \(!executed\) \{[\s\S]*renderTable\(\);[\s\S]*\}/, '取消日期直设后应恢复当前渲染值');
    assert.doesNotMatch(html, /window\.confirm\(/, '不应使用浏览器 confirm');
});

test('本地授权管理页调用固定管理 API 路径', () => {
    assert.match(html, /state:\s*'\/v1\/license\/admin\/state'/, '管理状态 API 路径缺失或变更');
    assert.match(html, /allow:\s*'\/v1\/license\/admin\/allow'/, '授权接口路径缺失或变更');
    assert.match(html, /revoke:\s*'\/v1\/license\/admin\/revoke'/, '吊销接口路径缺失或变更');
    assert.match(html, /delete:\s*'\/v1\/license\/admin\/delete'/, '删除接口路径缺失或变更');
    assert.match(html, /x-am-admin-token/, '管理鉴权头缺失');
    assert.match(html, /durationKey/, '授权有效期参数缺失');
    assert.match(html, /defaultAuthValidDays/, '默认授权有效期展示字段缺失');
    assert.match(html, /status === 'expired'/, '状态筛选缺少已过期分支');
    assert.match(html, /expiry === 'expired'/, '到期筛选缺少已过期分支');
    assert.match(html, /expiry === 'not-expired'/, '到期筛选缺少未过期分支');
    assert.match(html, /已授权' : \(item\.authExpired \? '已过期' : '未授权'\)/, '授权状态展示未区分已过期');
    assert.match(html, /dom\.expirySelect\.addEventListener\('change',\s*applyLocalFilters\)/, '到期筛选未绑定本地过滤事件');
    assert.match(html, /resolveDefaultBaseUrl/, '缺少默认 Base URL 解析逻辑');
    assert.match(html, /STATIC_HOST_RE/, '缺少静态托管域名识别逻辑');
    assert.match(html, /resolveStoreScopedShopIds/, '缺少店铺维度授权作用域解析');
    assert.match(html, /runStoreScopedAllowAction/, '缺少按店铺名称维度同步授权入口');
    assert.match(html, /按店铺名称维度同步/, '缺少店铺维度授权同步日志提示');
    assert.match(html, /网络请求失败：\$\{method\} \$\{requestUrl\}/, '网络错误日志缺少 method 与 URL 上下文');
    assert.match(html, /请求失败：\$\{method\} \$\{requestUrl\} ->/, 'HTTP 错误日志缺少 method 与 URL 上下文');
});

test('本地与服务端授权管理页模板保持一致', () => {
    assert.equal(serviceHtml, html, '本地授权管理页与服务端模板必须完全一致');
});

test('服务端管理页模板包含首次使用与到期日期直设能力', () => {
    assert.match(serviceHtml, /id="tableBody"/, '服务端模板缺少店铺列表容器');
    assert.match(serviceHtml, /子账号/, '服务端模板缺少子账号列');
    assert.match(serviceHtml, /店铺名称/, '服务端模板缺少店铺名称列');
    assert.match(serviceHtml, /首次使用/, '服务端模板缺少首次使用时间列');
    assert.match(serviceHtml, /授权到期/, '服务端模板缺少授权到期时间列');
    assert.match(serviceHtml, /id="activeWithinInput"[^>]*value="0"/, '服务端模板最近活跃默认筛选值应为 0');
    assert.match(serviceHtml, /id="expirySelect"/, '服务端模板缺少到期筛选下拉');
    assert.match(serviceHtml, /<option value="expired">已过期<\/option>/, '服务端模板状态筛选缺少已过期项');
    assert.match(serviceHtml, /data-col="auth-expiry"/, '服务端模板授权到期列缺少独立标记');
    assert.match(serviceHtml, /data-role="inline-menu-toggle"/, '服务端模板缺少网页内下拉触发器');
    assert.match(serviceHtml, /data-role="inline-menu-action"/, '服务端模板缺少网页内下拉操作项');
    assert.match(serviceHtml, /data-role="delete-row-btn"/, '服务端模板缺少行内删除按钮');
    assert.match(serviceHtml, /data-role="expiry-date-input"/, '服务端模板缺少到期日期输入框');
    assert.match(serviceHtml, /授权（默认3天）/, '服务端模板缺少授权日期默认3天下拉项');
    assert.match(serviceHtml, /browser:\s*\$\{item\.browserVersion \|\| '-'\}/, '服务端模板缺少浏览器版本展示');
    assert.match(serviceHtml, /os:\s*\$\{item\.osVersion \|\| '-'\}/, '服务端模板缺少操作系统版本展示');
    assert.match(serviceHtml, /resolveStoreScopedShopIds/, '服务端模板缺少店铺维度授权作用域解析');
    assert.match(serviceHtml, /runStoreScopedAllowAction/, '服务端模板缺少按店铺名称维度同步授权入口');
    assert.match(serviceHtml, /resolveDefaultBaseUrl/, '服务端模板缺少默认 Base URL 解析逻辑');
    assert.match(serviceHtml, /网络请求失败：\$\{method\} \$\{requestUrl\}/, '服务端模板网络错误日志缺少上下文');
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
    assert.match(doc, /已过期/, '文档缺少已过期状态说明');
    assert.match(doc, /到期筛选/, '文档缺少到期筛选说明');
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
