# TODO - 2026-04-01 浏览器自动化通道 `Transport closed` 修复（继续）

## 需求规格
- 目标：恢复当前会话 `chrome-devtools` MCP 自动化通道，消除 `Transport closed`，恢复浏览器自动化验收能力。
- 范围：
  - 校验 Chrome 调试端口与 profile 进程健康；
  - 固化 Codex MCP 启动命令，避免 `npx @latest` 不确定性；
  - 形成可重复的恢复步骤并完成复测。
- 非目标：
  - 不改动授权业务接口；
  - 不改动插件功能逻辑。

## 执行计划（含校验）
- [x] 1. 复现并定位故障层级（浏览器端口 / MCP 进程 / 会话握手）。
  - 摘要：`127.0.0.1:9222` 正常监听且 `json/version` 可达，故障定位为 MCP 会话桥接层而非 Chrome 未启动。
- [x] 2. 固化本机 MCP 启动配置，切换为固定二进制。
  - 摘要：已将 `~/.codex` 的 `chrome-devtools` 配置从 `npx -y chrome-devtools-mcp@latest` 切换为 `/Users/liangchao/.nvm/versions/node/v22.20.0/bin/chrome-devtools-mcp --browser-url=http://127.0.0.1:9222`。
- [x] 3. 验证端口与调试目标可见性。
  - 摘要：已确认 Chrome 专用 profile 进程与 `9222` 端口存活，`json/version`/`json/list` 可访问。
- [ ] 4. 会话级重连验证。
  - 摘要：当前线程的 MCP 连接仍保持旧会话状态，需重启/重开 Codex 会话后复测 `list_pages`。

## 结果复盘
- 状态：进行中
- 当前结论：
  - 浏览器与端口健康；
  - MCP 启动配置已固定；
  - 剩余阻塞点是“当前线程未热重载 MCP 配置”，需在新会话完成最终复测。

# TODO - 2026-04-01 本地授权管理页（店铺列表/授权开关/租约管理）

## 追加任务 - 2026-04-01 到期日期改到“授权到期列”直接修改

### 需求规格
- 目标：将“到期日期修改”从操作区移到“授权到期”列，点击日期直接修改生效；避免同一信息在多处重复展示。
- 范围：
  - `dev/license-admin.html` 调整表格结构和交互事件；
  - 同步 `services/license-server/license-admin.html` 模板；
  - 更新测试与文档说明。
- 非目标：
  - 不调整授权核心 API；
  - 不改动吊销与租约逻辑。

### 执行计划（含校验）
- [x] 1. 调整授权到期列：显示值 + 日期输入，改为 `change` 即调用设置到期接口。
  - 摘要：日期输入移到授权到期列，修改后自动执行 `set-expire-date` 逻辑。
- [x] 2. 精简操作列，移除“设置到期日期”下拉项和操作区日期输入。
  - 摘要：操作列只保留授权/吊销/店名相关动作，避免到期信息重复出现。
- [x] 3. 同步服务端模板并更新测试文档。
  - 摘要：`services/license-server/license-admin.html` 与 `dev` 同步；`tests/license-admin-page.test.mjs` 和文档更新为“到期列直接修改”。
- [x] 4. 行为校验。
  - 摘要：已通过定向测试与源码断言确认“到期列日期输入保留、操作下拉移除到期动作、日期修改走 `set-expire-date` 自动提交”。当前会话 `chrome-devtools` MCP 连接为 `Transport closed`，待连接恢复后可补一轮浏览器走查。

### 结果复盘
- 状态：已完成
- 当前结论：
  - 代码、模板、测试和文档已同步完成；
  - “到期日期就地编辑 + 立即生效 + 去重显示”已落地。

## 追加任务 - 2026-04-01 线上函数部署与字段生效复核（继续）

### 需求规格
- 目标：将“线上入口管理页缺少首次使用/到期字段”的代码修复发布到阿里云 FC，并完成线上实操验证。
- 范围：
  - 打包并上传 `am-license-server` 代码到 LATEST；
  - 校验线上 `GET /` 返回管理页源码包含新字段；
  - 在管理页执行一次“设置到期日期”回放并确认成功。
- 非目标：
  - 不修改授权业务规则；
  - 不改动其他函数或扩展端代码。

### 执行计划（含校验）
- [x] 1. 构建线上部署 ZIP 包（包含依赖与新模板）。
  - 摘要：生成 `/tmp/am-license-server-deploy.zip`，内容含 `index.mjs`、`license-admin.html`、`node_modules/tablestore`。
- [x] 2. 在 FC 控制台上传 ZIP 并保存部署。
  - 摘要：通过“上传代码 -> 上传 ZIP 包 -> 保存并部署”发布到 `LATEST`，代码大小更新为 `5.74 MB`。
- [x] 3. 验证线上根路径与状态接口字段。
  - 摘要：`curl /` 已匹配到“首次使用/授权到期/expiry-date-input”；`/v1/license/admin/state` 返回 `defaultAuthValidDays=3`、`activeShops.firstSeenAt`、`shops.authExpiresAt`。
- [x] 4. 浏览器实操“设置到期日期”并回滚状态。
  - 摘要：为 `114025783` 成功设置到 `2026-04-10`，随后执行“永久授权”恢复原状态，日志均返回成功。

### 结果复盘
- 状态：已完成
- 交付结果：
  - 线上函数已发布新管理页能力；
  - 管理页“首次使用/授权到期/日期直设”可用；
  - 实操验证成功且测试改动已回滚，不影响当前授权策略。

## 追加任务 - 2026-04-01 线上管理页缺少“首次使用/到期时间”字段修复

### 需求规格
- 目标：修复“线上函数根路径管理页看不到首次使用与到期时间”的问题，并支持到期日期直接设置。
- 根因：`dev/license-admin.html` 已升级，但 `services/license-server/index.mjs` 仍在输出旧版内嵌 HTML，线上入口未使用新版模板。
- 范围：
  - 服务端管理页改为从模板文件加载；
  - 同步服务端模板为新版管理页；
  - 增加回归测试，防止再次出现“本地页和线上页不同步”。
- 非目标：
  - 不改动授权鉴权协议和接口路径；
  - 不改动插件端租约逻辑。

### 执行计划（含校验）
- [x] 1. 将服务端管理页改为模板文件加载。
  - 摘要：`renderAdminPage` 改为读取 `services/license-server/license-admin.html`，并保留模板缺失时的降级页面。
- [x] 2. 同步服务端模板为最新管理页能力。
  - 摘要：新增 `services/license-server/license-admin.html`，包含“首次使用/授权到期”列、日期输入框、下拉即执行。
- [x] 3. 增加定向测试防回退。
  - 摘要：`tests/license-admin-page.test.mjs` 新增服务端模板字段断言与入口加载方式断言。
- [x] 4. 执行语法/测试/浏览器验证。
  - 摘要：`node --check services/license-server/index.mjs`、`node --test tests/license-admin-page.test.mjs`、`node --test tests/extension-license-shopid-guard.test.mjs` 全通过；浏览器打开服务端模板页确认字段可见。

### 结果复盘
- 状态：已完成
- 交付结果：
  - 线上入口页与本地管理页已对齐，不再缺失“首次使用/授权到期”；
  - 可直接通过日期输入框设置到期日并执行；
  - 增加了防回退测试，后续改动能自动发现不同步问题。

## 追加任务 - 2026-04-01 管理页补“首次使用 + 到期日期直设”

### 需求规格
- 目标：管理页明确展示“首次使用时间”和“到期时间”，并支持在行级直接选择日期设置到期时间。
- 范围：
  - 服务端 `activeShops` 增加 `firstSeenAt` 持久化；
  - 管理页列表新增“首次使用”“授权到期”列；
  - 行级操作新增日期输入 + “设置到期日期”动作。
- 非目标：
  - 不改动授权短租约（lease）机制；
  - 不改变吊销优先级。

### 执行计划（含校验）
- [x] 1. 服务端扩展首次使用时间字段并持久化。
  - 摘要：`upsertActiveShopRecord` 首次命中时记录 `firstSeenAt`，并同步到快照读写链路。
- [x] 2. 管理页增加首次使用与到期时间展示。
  - 摘要：表格新增“首次使用”“授权到期”两列，状态中区分“已过期”。
- [x] 3. 增加“到期日期直接设置”交互。
  - 摘要：操作列新增日期输入框和“设置到期日期”动作，按当天 `23:59:59.999` 上传 `authExpiresAt`。
- [x] 4. 文档与测试回归。
  - 摘要：同步 `docs/授权管理页.md`、`services/license-server/README.md`、`tests/license-admin-page.test.mjs` 并执行定向验证。

### 结果复盘
- 状态：已完成
- 交付结果：
  - 管理页可直接看到店铺首次使用时间与授权到期时间；
  - 支持按日期直接改到期时间，无需手工拼接口时间字符串。

## 追加任务 - 2026-04-01 店铺授权有效期（默认3天 + 月/季度/年）

### 需求规格
- 目标：在店铺授权层新增有效期控制，支持 `3天（默认）/1个月/3个月/1年/永久`，并在授权校验时自动拦截过期店铺。
- 用户约束：默认激活有效期为 3 天。
- 范围：
  - 服务端 `admin/allow` 支持有效期参数并持久化；
  - `verify` 增加过期判定与错误码；
  - 管理页下拉操作增加有效期选项并展示到期时间。
- 非目标：
  - 不改插件端 `lease` 租约协议（仍是短租约 + 签名）；
  - 不改吊销机制优先级。

### 执行计划（含校验）
- [x] 1. 服务端引入店铺授权到期字段并持久化。
  - 摘要：`MEMORY_SHOP_STORE` 扩展 `authExpiresAt`，同步写入快照文件/Tablestore。
- [x] 2. 授权判定接入“到期即失效”。
  - 摘要：`isShopAllowed` 纳入到期判断；`verify` 新增 `shop_license_expired` 分支。
- [x] 3. 管理页接入有效期操作与可视化。
  - 摘要：行级操作增加“默认3天/1月/3月/1年/永久”；列表详情显示 `authExpiresAt` 与 `authExpired`。
- [x] 4. 文档与回归验证。
  - 摘要：同步 `docs/授权管理页.md`、`services/license-server/README.md`、`tests/license-admin-page.test.mjs`，并执行定向测试与浏览器检查。

### 结果复盘
- 状态：已完成
- 交付结果：
  - 默认授权周期已改为 3 天；
  - 支持授权时按月/季度/年/永久配置；
  - 店铺过期会在 `verify` 直接返回“授权已过期”并锁定功能。

## 追加任务 - 2026-04-01 下拉操作改为“选中即执行”

### 需求规格
- 目标：移除行级操作中的“执行”按钮，改为下拉选中后立即执行，减少额外点击。
- 范围：
  - 更新 `dev/license-admin.html` 行级操作交互；
  - 更新测试断言与文档描述。
- 非目标：
  - 不调整后端接口；
  - 不变更具体业务动作（设置店名/授权/取消授权/吊销/取消吊销）。

### 执行计划（含校验）
- [x] 1. 移除行级执行按钮，保留操作下拉并标注自动执行。
  - 摘要：操作列改为单下拉，默认项为“选择操作（自动执行）”。
- [x] 2. 将事件从点击执行改为监听下拉 `change` 直接触发动作。
  - 摘要：新增 `onTableChange`，选中动作后立即调用既有授权链路，完成后自动重置下拉值。
- [x] 3. 更新测试与文档并验证。
  - 摘要：`tests/license-admin-page.test.mjs` 改为断言自动执行文案；`docs/授权管理页.md` 同步“选中后自动执行”；已完成定向测试与浏览器交互验证。

### 结果复盘
- 状态：已完成
- 交付结果：
  - 行级操作已变为“下拉选中即执行”，不再需要额外点击“执行”按钮；
  - 管理逻辑与接口调用保持兼容。

## 追加任务 - 2026-04-01 管理页行级操作改为下拉执行

### 需求规格
- 目标：将 `dev/license-admin.html` 店铺列表“操作”列由多按钮改为“下拉选择 + 执行”模式，降低误触。
- 范围：
  - 更新行级操作渲染结构与样式；
  - 更新点击事件分发逻辑；
  - 同步测试与文档描述。
- 非目标：
  - 不改动服务端接口；
  - 不改动店铺筛选、分页、统计逻辑。

### 执行计划（含校验）
- [x] 1. 改造行级操作 UI 为“操作下拉 + 执行按钮”。
  - 摘要：移除每行 5 个操作按钮，改为单个下拉（设置店名/授权放行/取消授权/吊销/取消吊销）+ 执行按钮。
- [x] 2. 改造事件逻辑读取当前行下拉值并执行对应动作。
  - 摘要：新增 `run-selected` 分支，执行前校验“已选择操作”，再复用既有 `callAllow/callRevoke/promptAndSetShopName` 链路。
- [x] 3. 更新定向测试与文档说明并验证。
  - 摘要：`tests/license-admin-page.test.mjs` 改为断言下拉选项与执行按钮；`docs/授权管理页.md` 同步为“操作下拉 -> 执行”说明；完成定向测试与浏览器点击验证。

### 结果复盘
- 状态：已完成
- 交付结果：
  - 管理页行级操作已切换为下拉执行模式；
  - 原有授权/吊销/店名回填行为保持不变，交互更聚焦且误触风险更低。

## 追加任务 - 2026-04-01 插件端店铺名称为空修复（shopName 识别与回填）

### 需求规格
- 目标：修复“插件已识别 `shopId` 但 `shopName` 为空”的上报问题，避免授权管理页长期显示 `-`。
- 背景：用户反馈 `114025783` 在 `activeShops` 中持续空名，判断为插件端未稳定上传店名。
- 范围：
  - 增强 extension 端 `shopName` 识别兜底（支持 `shopId` 与 `shopName` 异源场景）；
  - 保持授权主流程不受影响，仅做增强回填；
  - 补齐定向断言并执行回归验证。
- 非目标：
  - 不改动授权服务端 API 协议；
  - 不引入外部“shopId->shopName”查询服务。

### 执行计划（含校验）
- [x] 1. 修正授权模块回归测试中的 brittle 正则断言。
  - 摘要：修复 `tests/extension-license-shopid-guard.test.mjs` 的“同一行店铺名解析”断言，避免误报导致定向测试失败。
- [x] 2. 在 extension 授权模块增加“松耦合店名兜底解析”。
  - 摘要：新增 `resolveLooseShopNameCandidate`，当 `shopId` 已识别但同源候选无名时，从 DOM 属性与“店铺名称/当前店铺”等文本行补抓店名。
- [x] 3. 将松耦合店名兜底接入 `resolveShopIdentity` 最终返回路径。
  - 摘要：在 `nameMatch/primary.shopName` 均为空时，使用 `fallbackShopName` 作为最后回填来源，提升上传 `shopName` 的命中率。
- [x] 4. 执行语法 + 定向测试校验。
  - 摘要：已执行 `node --check dist/extension/page.bundle.js`、`node --test tests/extension-license-shopid-guard.test.mjs`、`node --test tests/license-admin-page.test.mjs`，全部通过。

### 结果复盘
- 状态：已完成
- 交付结果：
  - 扩展在“ID 与名称来自不同来源”时可自动补齐店铺名并参与后续授权上报；
  - 回归测试恢复绿色，并新增店名松耦合兜底相关断言，后续改动可被自动守护。

## 追加任务 - 2026-04-01 多店铺空店名回填（114025783）

### 需求规格
- 目标：解决“`shopId` 已上报但 `shopName` 为空”的运营可见性问题，支持在管理页直接回填店名并持久化。
- 背景：`114025783` 属于另一店铺，服务端 `activeShops` 已有活跃记录，但该店铺上报链路未提供有效 `shopName`，列表长期显示 `-`。
- 范围：
  - 更新 `dev/license-admin.html`，新增行级“设置店名”操作；
  - 通过 `POST /v1/license/admin/allow` 携带 `shopName` 回填名称；
  - 同步文档与测试断言。
- 非目标：
  - 不变更线上授权协议；
  - 不在本次接入外部“shopId -> 店名”查询服务。

### 执行计划（含校验）
- [x] 1. 管理页新增“设置店名”行级操作入口。
  - 摘要：店铺行操作区新增 `data-action="set-name"` 按钮，支持直接弹窗输入店名。
- [x] 2. 设置店名请求改造为可携带 `shopName`，并保持当前授权/吊销状态不被破坏。
  - 摘要：`callAllow` 支持 `shopName` 参数；回填时按当前 `allowed/revoked` 状态执行补偿调用，避免误改授权状态。
- [x] 3. 更新文档与定向测试。
  - 摘要：`docs/授权管理页.md` 增补“回填店名”说明和 curl 示例；`tests/license-admin-page.test.mjs` 增加“设置店名”按钮断言。
- [ ] 4. 浏览器回放 `114025783` 的店名回填并截图确认。
  - 摘要：待用户提供该店铺真实名称后执行一键回填，复核列表展示。

### 结果复盘
- 状态：进行中（代码与测试已完成，待真实店名回填）
- 当前结论：
  - 空店名问题根因是该店铺上报链路未提供有效 `shopName`（服务端已保留空值，不再误覆盖）；
  - 管理页已具备“手工回填店名”闭环能力，后续可在不改协议前提下快速修复展示。

## 追加任务 - 2026-04-01 店铺名称缺失修复（shopName 回填与防覆盖）

### 需求规格
- 目标：修复“店铺能授权但名称为空/被清空”的问题，确保授权管理页尽可能显示真实店铺名。
- 根因：
  - `POST /v1/license/admin/allow` 在不传 `shopName` 时会把已有名称覆盖为空；
  - `GET /v1/license/admin/state` 聚合 `shops` 时未优先补齐 `activeShops` 的名称；
  - `verify` 成功后未把 `shopName` 回填到 `MEMORY_SHOP_STORE`（env 店铺首次上报名称后不落主列表）。
- 范围：
  - 修改 `services/license-server/index.mjs` 的 `handleAdminAllow`、`handleVerify`、`resolveAdminState` 及相关名称归一逻辑；
  - 不改动接口路径和鉴权协议。
- 非目标：
  - 不引入额外“shopId -> shopName”外部查询接口；
  - 不变更插件端授权协议。

### 执行计划（含校验）
- [x] 1. 增加 `shopName` 优先级选择逻辑，忽略无意义占位值（如 `-`）。
  - 摘要：新增 `pickPreferredShopName`，统一处理 `shopName` 的非空/非占位优先级选择。
- [x] 2. 修复 `admin/allow` 空名覆盖问题。
  - 摘要：`handleAdminAllow` 改为“payload shopName > 现有内存店铺名 > active 店铺名”，不再因按钮操作把名称清空。
- [x] 3. 在 `verify` 成功路径回填店铺名到主店铺存储。
  - 摘要：新增 `backfillShopNameFromVerify`，对已允许店铺（含 env 店铺）在首次拿到有效名称时回填到 `MEMORY_SHOP_STORE`。
- [x] 4. 优化 `admin/state` 店铺聚合展示。
  - 摘要：`resolveAdminState` 使用去重 `shopMap` 合并 env/memory，并优先用 `activeShops` 名称补齐。
- [x] 5. 执行语法与定向测试校验。
  - 摘要：已执行 `node --check services/license-server/index.mjs` 与 `node --test tests/license-admin-page.test.mjs`，均通过。

### 结果复盘
- 状态：已完成
- 交付结果：
  - 行级“授权放行/取消授权”不再把已有店铺名覆盖为空；
  - 当插件上报到真实 `shopName` 后，`admin/state.shops` 会回填并稳定展示；
  - 管理页店铺列表对同一 `shopId` 不再出现 env/memory 名称冲突导致的空名覆盖。

## 追加任务 - 2026-04-01 云数据库授权链路浏览器闭环复核（继续）

### 需求规格
- 目标：在用户要求“继续”的前提下，通过浏览器实操完成授权链路最终闭环，确认“在用店铺可见 + 插件不再锁定 + 云数据库真实落库 + FC 最新日志无新 403”。
- 范围：
  - 在 Tablestore 控制台核对 `license_state` 数据行快照；
  - 在本地管理页与真实页面分别回放 `allow/verify`；
  - 在 FC 函数日志确认修复后时间段无 `OTSAuthFailed` 新增。
- 非目标：
  - 不改动线上函数代码；
  - 不调整管理页功能，仅做线上链路核验与恢复操作。

### 执行计划（含校验）
- [x] 1. 核对 Tablestore `license_state` 表是否有真实快照行，并确认快照内容可读。
  - 摘要：在 `amlicenseots01/license_state/dataManage` 查询到 `pk=license_state` 行，后续刷新后 `updatedAt` 已推进至 `2026-04-01T10:08:37.468Z`。
- [x] 2. 在浏览器回放授权链路，补齐当前锁定店铺与刷单店铺两条链路。
  - 摘要：已对 `114025783` 与 `2957960066` 执行 `allow/verify`，返回均为 `200 + authorized=true`；`admin/state.storage.mode=tablestore`。
- [x] 3. 回到本地管理页确认“在用店铺”展示恢复。
  - 摘要：`dev/license-admin.html` 刷新后显示 `全量店铺=2`、`24h 活跃=1`，并出现 `114025783` 的活跃记录（`source=state.activeShops`）。
- [x] 4. 回到阿里妈妈真实页面确认插件不再锁定，并复核 FC 最新日志。
  - 摘要：页面锁罩由“授权租约已过期”恢复为正常；`window.__AM_LICENSE_STATE__` 显示 `authorized=true`。FC `18:08` 后仅见 `license_audit info`，无新 `OTSAuthFailed/403`。

### 结果复盘
- 状态：已完成
- 关键结论：
  - 本次“店铺未授权/功能锁定”已在浏览器侧闭环恢复；
  - 根因仍是先前的 OTS 网络访问策略（公网未放开）导致的持久化失败，放开公网后新请求已稳定写入云表；
  - 受影响店铺不仅是 `114025783`，当前页面店铺 `2957960066` 也已同步恢复授权租约。

## 追加任务 - 2026-04-01 阿里云线上 API 对齐接入

### 需求规格
- 目标：基于阿里云 FC 线上函数 `am-license-server` 的真实实现，修正本地管理页接口与文档，确保“可直接接入可用”。
- 已确认线上地址：`https://am-licee-server-mpbzozflkj.cn-hangzhou.fcapp.run`
- 已确认线上真实路由：
  - `GET /v1/license/admin/state`
  - `POST /v1/license/admin/allow`
  - `POST /v1/license/admin/revoke`
  - `POST /v1/license/verify`
  - `POST /v1/license/revoke`（同样要求管理员鉴权）
- 已确认管理员鉴权头：
  - `x-am-admin-token`（兼容 `x-admin-token`）
- 范围：
  - 更新 `dev/license-admin.html` 的请求路径、鉴权头与列表解析逻辑；
  - 更新 `docs/授权管理页.md` 与 `README.md` 的接口说明；
  - 更新 `tests/license-admin-page.test.mjs` 契约断言。
- 非目标：
  - 不暴露或硬编码真实管理员 token；
  - 不改动线上 FC 代码，仅对齐本地接入。

### 执行计划（含校验）
- [x] 1. 将本地管理页 API 映射改为线上真实路由，并改为 `x-am-admin-token` 鉴权。
  - 摘要：`dev/license-admin.html` 已改为 `state/allow/revoke` 三个管理接口，并按服务端实现发送 `x-am-admin-token`。
- [x] 2. 依据 `admin/state` 返回结构重构前端列表解析与授权操作调用。
  - 摘要：前端列表改为解析 `allowed/revoked/shops/activeShops` 聚合数据，行级操作改为“授权/取消授权/吊销/取消吊销”。
- [x] 3. 同步更新文档与 README 的接口契约。
  - 摘要：`docs/授权管理页.md` 与 `README.md` 已改为真实线上协议与鉴权说明。
- [x] 4. 更新并执行定向测试 `tests/license-admin-page.test.mjs`。
  - 摘要：测试断言已切换到新路由与新操作按钮，定向测试通过。

### 结果复盘
- 状态：已完成
- 验证命令：
  - `node --test tests/license-admin-page.test.mjs`（通过）
  - `chrome-devtools 打开 file:///.../dev/license-admin.html + 页面快照 + 控制台检查`（通过，无控制台报错）
- 追加修正：
  - 空列表提示改为区分“无数据”与“筛选未命中”；
  - “重置筛选”改为 `activeWithinHours=0` 并触发重新拉取，避免误判“没有在用店铺”。

## 追加任务 - 2026-04-01 License Server 状态持久化（activeShops/allow/revoke）

### 需求规格
- 目标：解决 `activeShops` 与手动授权状态仅在单实例内存可见的问题，降低函数实例切换/冷启动导致“管理页看不到在用店铺”与“授权忽隐忽现”。
- 范围：
  - 在 `services/license-server/index.mjs` 引入云数据库持久化层（Tablestore）；
  - 保留文件持久化作为兜底（未配置 Tablestore 时启用）；
  - 每次请求前同步持久化状态，写操作后落盘；
  - 保持现有 API 契约不变（`/v1/license/admin/state|allow|revoke|verify`）。
- 非目标：
  - 不改动插件前端授权校验协议；
  - 不在本次引入复杂分库分表，只做单行快照持久化。

### 执行计划（含校验）
- [x] 1. 增加 Tablestore 状态读写与同步机制（可选开启）。
  - 摘要：新增 `syncStateFromTablestore/persistStateToTablestore`，使用 `tablestore` SDK 懒加载，并支持 AK/SK 或运行时凭证。
- [x] 2. 将 `MEMORY_SHOP_STORE`、`MEMORY_REVOKE_STORE`、`MEMORY_ACTIVE_SHOP_STORE` 接入统一持久化流程。
  - 摘要：三类内存状态统一序列化为快照，写操作统一 `await persistStateChanges()`（Tablestore 优先、文件兜底）。
- [x] 3. 在 `handler` 请求入口增加“读前同步”，在写操作后执行“落盘”。
  - 摘要：新增 `syncStateBeforeRequest(route)`，对关键管理写路由强制同步；其余按 `AM_LICENSE_STATE_SYNC_INTERVAL_MS` 节流同步。
- [x] 4. 更新 `services/license-server/README.md` 环境变量说明与运维指引。
  - 摘要：文档新增 Tablestore 环境变量与“云数据库优先、文件兜底、内存最后”的持久化策略说明。
- [x] 5. 进行本地回归验证（定向脚本 + 现有测试）。
  - 摘要：完成 `node --check services/license-server/index.mjs` 与 `node --test tests/license-admin-page.test.mjs`。

### 结果复盘
- 状态：已完成
- 交付结果：
  - `services/license-server` 已支持 Tablestore 持久化，解决多实例下 `activeShops`/授权状态不一致；
  - 未配置 Tablestore 时自动回退到文件持久化，继续兼容原部署形态；
  - `admin/state` 增加 `storage` 字段，可直接确认当前运行模式。

## 需求规格
- 目标：提供一个可本地打开的 `HTML` 管理页，用于查看“正在使用插件的店铺”并执行授权管理操作（授权/禁用/租约到期）。
- 背景：当前插件前端仅有 `LicenseGuard` 校验入口与 `/v1/license/verify` 调用，不包含后台管理 UI 与店铺全量查询能力。
- 范围：
  - 新增 `dev/license-admin.html` 本地管理页；
  - 新增 `docs/授权管理页.md` API 契约与落地说明；
  - 新增 `tests/license-admin-page.test.mjs` 静态契约回归；
  - 在 `README.md` 增加入口说明。
- 非目标：
  - 不在插件端实现绕过授权逻辑；
  - 不在仓库内实现完整线上授权服务后端，仅定义并消费 API 契约。

## 执行计划（含校验）
- [x] 1. 设计并落地本地授权管理页。
  - 摘要：已新增 `dev/license-admin.html`，支持店铺列表查询、关键词/状态筛选、分页、授权放行、立即禁用、到期时间/备注保存与日志追踪。
- [x] 2. 定义管理 API 契约并补充文档。
  - 摘要：已新增 `docs/授权管理页.md`，明确“本地 HTML + 授权服务”职责边界与最小可用 API（`GET /v1/license/admin/shops`、`POST /v1/license/admin/shops/update`）。
- [x] 3. 增加静态契约测试。
  - 摘要：已新增 `tests/license-admin-page.test.mjs`，覆盖管理页核心控件、固定 API 路径与文档契约断言。
- [x] 4. 执行构建与回归验证。
  - 摘要：已执行 `build + 定向测试 + 全量测试`；新增能力验证通过，全量测试存在既有失败（`tests/extension-license-shopid-guard.test.mjs`）。

## 结果复盘
- 状态：已完成
- 交付结果：
  - 你可以直接使用 `dev/license-admin.html` 管理店铺授权；
  - 可以在管理页查看店铺活跃信息（依赖服务端汇总 `verify` 日志）；
  - 可通过“授权放行/立即禁用”实现授权状态切换。
- 验证命令：
  - `node scripts/build.mjs`（通过）
  - `node --test tests/license-admin-page.test.mjs`（通过）
  - `chrome-devtools 打开 file:///.../dev/license-admin.html + 页面快照`（通过；页面结构正常，服务端未实现管理接口时会返回 404）
  - `node --test tests/*.test.mjs`（失败：既有 `tests/extension-license-shopid-guard.test.mjs` 2 项断言失败）

# TODO - 2026-03-25 tooltip/柱子联动改为按标签内容对齐

## 需求规格
- 目标：tooltip 与跨周期柱子高亮联动按“标签内容”对齐，不再依赖同索引位置对齐。
- 背景：在各周期独立排序场景下，同索引不一定代表同一省份/城市，导致对比错位。
- 范围：`src/main-assistant/magic-report.js`、`tests/magic-report-crowd-matrix.test.mjs` 与构建产物同步。

## 执行计划（含校验）
- [x] 1. 新增标签内容键并写入柱节点。
  - 摘要：新增 `normalizeCrowdLabelKey`，在柱节点写入 `data-label-key`。
- [x] 2. 悬停联动索引从 labelIndex 改为 labelKey。
  - 摘要：`getCrowdMatrixLinkedBars`、`buildCrowdMatrixHoverMetricIndex`、`buildCrowdMatrixHoverTipText` 改为按标签内容键聚合。
- [x] 3. 更新契约测试并执行回归。
  - 摘要：新增“按标签内容键对齐”断言，完成 `build + 定向测试 + 全量测试`。

## 结果复盘
- 交付结果：跨周期排序不一致时，tooltip 与柱子联动仍按同一标签内容对齐，不会出现“同索引错位比较”。
- 验证命令：
  - `node scripts/build.mjs`
  - `node --test tests/magic-report-crowd-matrix.test.mjs`
  - `node --test tests/*.test.mjs`

# TODO - 2026-03-25 省份/城市排序改为默认独立并支持图标切换主周期优先

## 需求规格
- 目标：省份/城市维度默认按“各周期自身标签顺序”渲染；在省份/城市行头增加排序图标，点击后切换为“主周期优先（90→30→7→3）”。
- 范围：`src/main-assistant/magic-report.js`、`tests/magic-report-crowd-matrix.test.mjs` 与构建产物同步。
- 约束：其它维度排序逻辑不变；切换后需即时重绘，无需重跑查数请求。

## 执行计划（含校验）
- [x] 1. 增加省份/城市排序模式状态与切换逻辑。
  - 摘要：新增 `crowdMatrixGroupSortModeMap`（默认空），通过 `toggleCrowdGroupSortMode` 在 `period/priority` 两种模式间切换。
- [x] 2. 调整数据构建为“按模式分支”。
  - 摘要：`buildMatrixDataset` 新增 `groupSortModeMap` 读取；默认走各周期独立标签，`priority` 模式才使用稳定标签并按 `90/30/7/3` 比较。
- [x] 3. 在省份/城市行头增加排序图标并绑定事件。
  - 摘要：`renderCrowdMatrixCharts` 为省份/城市行头渲染 `⇅` 按钮，`matrixGrid` 监听点击后切换模式并重绘。
- [x] 4. 更新契约测试并执行回归。
  - 摘要：新增“默认独立排序 + 图标切换主周期优先”断言，完成定向与全量测试。

## 结果复盘
- 交付结果：省份/城市默认回到“各周期独立排序”；点击行头排序图标后可切到“主周期优先（90→30→7→3）”，再次点击可切回默认。
- 验证命令：
  - `node scripts/build.mjs`
  - `node --test tests/magic-report-crowd-matrix.test.mjs`
  - `node --test tests/*.test.mjs`

# TODO - 2026-03-25 人群看板省份/城市稳定排序改为90天优先

## 需求规格
- 目标：在已完成“跨周期同标签对齐”基础上，将省份/城市稳定标签顺序改为“按90天数据优先”，缺失时再按 30/7/3 天兜底。
- 背景：仅按全周期累计值排序会让“90天核心对比”的业务语义不够直观。
- 范围：`src/main-assistant/magic-report.js`、`tests/magic-report-crowd-matrix.test.mjs` 与构建产物同步。

## 执行计划（含校验）
- [x] 1. 调整稳定标签排序策略为主周期优先。
  - 摘要：在 `buildMatrixDataset` 中新增 `periodSortPriority = [90, 30, 7, 3]`，排序先比较各周期分值，再回退总分与原顺序。
- [x] 2. 更新契约测试覆盖新排序规则。
  - 摘要：为 `magic-report-crowd-matrix` 新增“主周期优先”相关源码断言，避免后续回归到累计值优先。
- [x] 3. 构建与回归验证。
  - 摘要：执行 `build + 定向测试 + 全量测试`，确认无回归后补齐结论。

## 结果复盘
- 状态：已完成。
- 验证命令：
  - `node scripts/build.mjs`
  - `node --test tests/magic-report-crowd-matrix.test.mjs`
  - `node --test tests/*.test.mjs`

# TODO - 2026-03-25 人群看板省份/城市跨周期标签错位修复

## 需求规格
- 目标：修复省份/城市在不同周期标签顺序不固定，导致“第 N 个对第 N 个”错位比较的问题。
- 根因：`buildMatrixDataset` 按“每个周期自身返回顺序”构造标签列表，周期间标签索引不稳定。
- 范围：`src/main-assistant/magic-report.js`、`tests/magic-report-crowd-matrix.test.mjs` 与构建产物同步。

## 执行计划（含校验）
- [x] 1. 在数据构建阶段为省份/城市生成全周期稳定标签顺序。
  - 摘要：按 3/7/30/90 天与各指标聚合累计值生成统一标签顺序，并缓存到 `stableLabelMap`。
- [x] 2. 周期渲染优先使用稳定标签顺序。
  - 摘要：`labelList` 对省份/城市优先使用稳定列表，避免跨周期索引错位；其它维度保持原逻辑。
- [x] 3. 更新契约断言并执行回归。
  - 摘要：新增稳定排序与稳定标签读取断言，执行定向与全量测试。

## 结果复盘
- 修复结果：省份/城市维度在 3/7/30/90 天按同一标签序列对齐，比较不再依赖“同位置索引”。
- 验证命令：
  - `node scripts/build.mjs`
  - `node --test tests/magic-report-crowd-matrix.test.mjs`
  - `node --test tests/*.test.mjs`

# TODO - 2026-03-25 人群看板下拉弹窗样式二次对齐（仅弹窗）

## 需求规格
- 目标：按用户澄清，仅调整“下拉弹窗面板”样式，不改触发器样式。
- 范围：`src/main-assistant/magic-report.js` 样式层与构建产物同步。
- 要求：弹窗视觉对齐周期置顶表头风格（白玻璃渐变、轻边框、柔和阴影）。

## 执行计划（含校验）
- [x] 1. 回退触发器样式到原方案。
  - 摘要：移除触发器新增玻璃态，避免超出用户要求范围。
- [x] 2. 仅重绘下拉弹窗与选项样式。
  - 摘要：弹窗采用置顶表头同源背景与边框，选项改为块级卡片式并保留选中态。
- [x] 3. 构建与定向回归。
  - 摘要：执行 `build + magic-report-crowd-matrix.test.mjs`，确认无功能回归。

## 结果复盘
- 交付结果：下拉“弹窗”样式已按要求对齐；触发器样式未继续扩改。
- 验证命令：
  - `node scripts/build.mjs`
  - `node --test tests/magic-report-crowd-matrix.test.mjs`

# TODO - 2026-03-25 人群看板商品下拉样式对齐“周期置顶表头”风格

## 需求规格
- 目标：将商品ID下拉样式对齐“周期滚动到下方后置顶在上面”的视觉风格。
- 范围：`src/main-assistant/magic-report.js` 样式层与构建产物同步。
- 要求：仅改样式，不改交互逻辑（展开、选择、关闭、刷新链路保持不变）。

## 执行计划（含校验）
- [x] 1. 对齐触发器视觉到置顶表头语义。
  - 摘要：触发器改为白玻璃渐变背景、轻边框、阴影与 hover/open 态。
- [x] 2. 对齐下拉面板视觉到置顶表头语义。
  - 摘要：面板改为半透明白底 + blur + 轻边框，选中项改为同色系高亮。
- [x] 3. 构建与定向回归验证。
  - 摘要：执行 `build` 与 `magic-report-crowd-matrix` 测试，确认无功能回归。

## 结果复盘
- 视觉结果：商品下拉触发器与弹层已与“周期置顶表头”统一为白玻璃系样式，交互态更一致。
- 功能结果：仅样式调整，商品切换后仍是“只刷新 itemdeal”。
- 验证命令：
  - `node scripts/build.mjs`
  - `node --test tests/magic-report-crowd-matrix.test.mjs`

# TODO - 2026-03-25 人群看板商品ID下拉横排异常热修（改回竖排）

## 需求规格
- 目标：修复自定义商品下拉选项“横向一排”问题，恢复为竖向列表。
- 根因：父容器 `white-space: nowrap` 被继承到下拉区域，选项按钮仍是内联布局，导致同一行横排。
- 范围：`src/main-assistant/magic-report.js`（样式）与构建产物同步。

## 执行计划（含校验）
- [x] 1. 在下拉容器显式重置换行策略。
  - 摘要：`.am-crowd-matrix-item-dropdown` 增加 `white-space: normal`。
- [x] 2. 在下拉选项显式固定块级布局。
  - 摘要：`.am-crowd-matrix-item-option` 增加 `display: block`，确保逐行竖排。
- [x] 3. 构建与定向回归校验。
  - 摘要：执行 `build + magic-report-crowd-matrix.test.mjs`，确认无回归。

## 结果复盘
- 修复结果：下拉项布局策略已从“继承内联流”改为“容器可换行 + 选项块级”，可稳定竖排显示。
- 验证命令：
  - `node scripts/build.mjs`
  - `node --test tests/magic-report-crowd-matrix.test.mjs`

# TODO - 2026-03-25 人群看板商品ID下拉改为网页自定义样式（非系统下拉）

## 需求规格
- 目标：将人群看板“商品ID”从原生 `<select>` 改为网页自定义下拉弹层，避免系统/浏览器默认下拉样式。
- 范围：`src/main-assistant/magic-report.js` 与 `tests/magic-report-crowd-matrix.test.mjs`。
- 验收：
  - 不再依赖 `HTMLSelectElement`/`change` 事件；
  - 下拉触发器、选项列表、选中态均由页面样式控制；
  - 选择商品后仍只刷新 `itemdeal` 指标，不影响既有并发排队逻辑。

## 执行计划（含校验）
- [x] 1. 改造头部 DOM：替换原生 `<select>` 为自定义触发器 + 选项面板结构。
  - 摘要：保留 `id="am-crowd-matrix-item-select"` 作为锚点，新增展示文本和下拉箭头节点。
- [x] 2. 改造渲染逻辑：`renderCrowdCampaignItemSelect` 改为渲染按钮列表并维护选中态。
  - 摘要：不再写入 `<option>`，改用 `data-item-id` 的自定义选项节点。
- [x] 3. 改造交互：点击展开/收起、点击选项完成选择、点击外部关闭。
  - 摘要：复用现有 `setCrowdCampaignSelectedItemId` 与 `reloadCrowdMatrixMetric(itemdeal)` 业务链路。
- [x] 4. 更新契约测试并执行构建/回归。
  - 摘要：同步替换 `select/change` 相关断言，验证新的自定义下拉结构与点击事件。

## 结果复盘
- 实现结果：商品ID下拉已改为网页自定义弹层组件（触发器 + 选项列表），不再依赖浏览器/系统原生下拉控件。
- 交互结果：点击触发器可展开/收起；点击选项后保持“仅刷新 `itemdeal`”链路；点击外部或按 `Esc` 会关闭下拉。
- 样式结果：看板头部维持原有视觉语言，选中态、悬浮态和弹层阴影均由页面 CSS 控制。
- 验证命令：
  - `node scripts/build.mjs`
  - `node --test tests/magic-report-crowd-matrix.test.mjs`
  - `node --test tests/*.test.mjs`
  - `node scripts/build.mjs --check`
  - `node --check "阿里妈妈多合一助手.js"`

# TODO - 2026-03-24 Review 修复：商品成交人群局部刷新一致性

## 需求规格
- 目标：修复 code review 提出的 3 个问题，避免商品成交人群切换后出现旧数据残留、刷新中切换丢请求、未知状态商品被误过滤。
- 范围：`src/main-assistant/magic-report.js`、`tests/magic-report-crowd-matrix.test.mjs`。
- 验收：
  - 局部刷新不会混入旧商品周期数据；
  - 刷新中切换商品会在结束后自动补跑最新请求；
  - 商品下拉仅过滤明确暂停项，未知状态可保留。

## 执行计划（含校验）
- [x] 1. 修复局部刷新缓存替换语义。
  - 摘要：新增 `replaceCrowdMatrixMetricResults`，局部刷新时先清理 `metric|period` 旧缓存再回写新结果，避免残留旧商品周期。
- [x] 2. 修复刷新中切换商品丢请求问题。
  - 摘要：新增 `scheduleCrowdMatrixMetricReload/flushPendingCrowdMatrixMetricReload`，刷新中切换会排队，当前刷新结束后自动补跑最新请求。
- [x] 3. 修复未知状态商品过滤过严问题。
  - 摘要：下拉候选改为仅过滤 `active === false`，并保持 `active === true` 优先排序，保留未知状态商品。
- [x] 4. 更新契约测试并执行验证。
  - 摘要：更新 `magic-report-crowd-matrix` 相关断言，覆盖缓存替换、排队补跑、状态过滤规则。

## 结果复盘
- 局部刷新一致性：`itemdeal` 切换后不会再混入历史商品周期结果；刷新失败周期会按“该指标无数据”表现。
- 并发交互一致性：刷新进行中用户再次切换商品，会排队并在当前刷新结束后自动触发最新请求。
- 候选完整性：商品下拉保留未知状态候选，仅剔除明确暂停项，减少因状态字段不完整导致的漏项。
- 验证命令：
  - `node scripts/build.mjs`
  - `node --test tests/magic-report-crowd-matrix.test.mjs`
  - `node --test tests/*.test.mjs`

# TODO - 2026-03-24 人群看板修正：商品下拉为空（状态误判导致全过滤）

## 需求规格
- 目标：修复人群看板商品下拉“为空”的问题，保证推广中商品能正常展示。
- 根因：商品状态判断把通用 `status` 数值字段直接当成暂停/开启，导致正常商品被误判为暂停并被过滤。
- 修复策略：仅将 `onlineStatus/isOnline/online` 作为数值状态来源；`status/itemStatus` 等仅参与文本关键词判断，不再直接数值判定。
- 范围：`src/main-assistant/magic-report.js` 状态判定函数。

## 执行计划（含校验）
- [x] 1. 定位下拉空列表的过滤路径与状态判定来源。
  - 摘要：确认空列表发生在 `activeOptions/itemOptions` 过滤后；误判点在 `resolveCrowdItemActiveState` 对 `status` 数值判断。
- [x] 2. 收紧状态判定，移除 `status` 数值强判定。
  - 摘要：只保留 `onlineStatus` 数值判定和状态文本关键词判定，避免通用 `status=0` 误判为暂停。
- [x] 3. 构建与定向测试验证。
  - 摘要：构建与 `magic-report-crowd-matrix` 定向测试通过。

## 结果复盘
- 修复后：商品状态误判显著降低，避免推广中商品被错误过滤成空下拉。
- 验证命令：
  - `node scripts/build.mjs`
  - `node --test tests/magic-report-crowd-matrix.test.mjs`
- 浏览器验证：已按 `$alimama-devtools-profile` 启动专用 profile，并确认 `127.0.0.1:9222/json/version` 可用；但当前 `chrome-devtools` MCP 仍报 `Could not find DevToolsActivePort`，暂无法完成线上页面自动化复测。

# TODO - 2026-03-24 人群看板商品下拉二次增强：显示标题 + 仅推广中 + 切换仅刷新商品成交人群

## 需求规格
- 目标：人群看板中的商品下拉在展示 `itemdeal` 商品时，显示商品标题；并过滤掉暂停推广商品，仅保留推广中商品。
- 交互规则：切换商品时只重新查询 `商品成交人群(itemdeal)`，不再全量重跑 click/cart/deal。
- 默认规则：下拉默认仍为计划内花费最高商品（在“可展示商品集合”内按 `spend DESC, itemId ASC`）。
- 范围：`src/main-assistant/magic-report.js` 与 `tests/magic-report-crowd-matrix.test.mjs`。

## 执行计划（含校验）
- [x] 1. 扩展商品候选聚合，补充标题与推广状态信息。
  - 摘要：新增商品标题归一化与状态判定（推广中/暂停）逻辑，聚合 `findPage + campaign/get + adgroup/get` 的商品元信息。
- [x] 2. 调整下拉展示与过滤规则。
  - 摘要：下拉文案改为“商品标题（商品ID，花费）”；候选列表优先保留 `active === true`，兜底过滤显式暂停 `active === false`。
- [x] 3. 改造切换行为为仅刷新 `itemdeal`。
  - 摘要：新增 `reloadCrowdMatrixMetric` 和结果缓存 Map，切换商品后只重跑 `itemdeal` 四周期并合并渲染。
- [x] 4. 更新回归断言并执行验证。
  - 摘要：更新 `tests/magic-report-crowd-matrix.test.mjs` 契约断言；构建/定向测试/语法检查全部通过。

## 结果复盘
- 展示变化：商品下拉现在显示商品标题 + 商品ID + 花费，标题缺失时兜底为 `商品{ID}`。
- 过滤变化：暂停推广商品不会进入下拉；推广中商品优先展示，避免误选暂停商品做商品成交人群分析。
- 切换变化：切换商品时仅刷新 `itemdeal`，其它三类指标保持现有结果，不再触发全量重跑。
- 浏览器验证：尝试通过 `chrome-devtools` MCP 做线上页面回归，但当前环境仍无法连接 Chrome（`Could not find DevToolsActivePort`），暂未完成真实页面走查。
- 验证命令：
  - `node scripts/build.mjs`
  - `node --test tests/magic-report-crowd-matrix.test.mjs`
  - `node scripts/build.mjs --check`
  - `node --check "阿里妈妈多合一助手.js"`

# TODO - 2026-03-24 人群看板：商品成交人群支持按计划花费商品下拉切换

## 需求规格
- 目标：在人群看板中，`商品成交人群(itemdeal)` 的商品ID不再固定文本展示，改为“当前推广计划下有花费商品ID”的单选下拉。
- 默认规则：默认选中该计划内花费最高的商品ID。
- 交互规则：切换下拉项后，重新加载并展示所选商品ID对应的商品成交人群数据。
- 范围：`src/main-assistant/magic-report.js` UI/状态/请求链路与 `tests/magic-report-crowd-matrix.test.mjs` 回归断言。
- 验证：构建成功、定向测试通过、根脚本语法检查通过。

## 执行计划（含校验）
- [x] 1. 完成现状梳理并确认改造点。
  - 摘要：已定位 `refreshCrowdMatrixCampaignMeta`、`queryCrowdInsight(itemdeal)`、popup 头部 DOM 与回归测试断言位置。
- [x] 2. 增加“计划内有花费商品ID”解析与缓存，支持默认选中花费最高商品。
  - 摘要：新增 `collectCrowdItemSpendSummaryFromPayload` + `queryCrowdCampaignSpendPayload` + `refreshCrowdCampaignItemOptions`，默认按 `spend` 降序取首项作为当前商品。
- [x] 3. 将“商品ID：XXXX”改为下拉单选，并绑定切换后重载逻辑。
  - 摘要：`am-crowd-matrix-campaign` 改为“计划名/计划ID + 商品ID下拉”；切换下拉后写入手动选中态并 `ensureCrowdMatrixLoaded(true)` 重载看板；`itemdeal` 查询支持锁定手动所选商品。
- [x] 4. 更新回归测试并执行验证命令。
  - 摘要：已更新 `tests/magic-report-crowd-matrix.test.mjs`，并通过构建/定向测试/语法检查。

## 结果复盘
- 交互变化：人群看板头部“商品ID”从静态文本改为单选下拉，展示当前计划下可识别的商品ID（含花费信息）。
- 默认策略：自动选中该计划中花费最高的商品ID（若花费数据不可得，回退候选商品列表首项）。
- 查询行为：用户手动切换后，`itemdeal` 查询锁定该商品ID，避免自动跳回其他候选；切换即触发看板重载，展示对应商品成交人群数据。
- 浏览器验证：已尝试使用 `chrome-devtools` MCP 打开阿里妈妈线上页面进行真实验证，但当前环境无法连接到 Chrome（`Could not find DevToolsActivePort`），因此未完成线上页面走查。
- 二次修正（用户反馈默认排序/全量商品异常）：
  - 商品花费提取从“递归全对象扫描”改为“结构化列表行提取”，避免误把非商品级 `charge` 纳入排序。
  - 商品ID补齐链路增加“计划详情 + 全量单元详情（adgroup/get）”遍历，确保计划下商品ID尽可能全量回收。
  - 默认选择逻辑改为对“全量商品集合”按 `spend DESC, itemId ASC` 排序后取首项。
- 验证命令：
  - `node scripts/build.mjs`
  - `node --test tests/magic-report-crowd-matrix.test.mjs`
  - `node scripts/build.mjs --check`
  - `node --check "阿里妈妈多合一助手.js"`

# TODO - 2026-03-24 并发提交流程修正：全站场景并发数生效 + 重复提交失败去重

## 需求规格
- 目标：修正并发提交行为，确保全站场景也使用配置并发数，并在汇总结果中对“同计划已成功但出现重复提交失败”做去重。
- 范围：`request-builder-preview` 并发数透传与结果汇总、`wizard-mount-intro` 并发数提示、对应回归测试。
- 验证：构建通过，`tests/site-scene-submit-mode.test.mjs` 通过。

## 执行计划（含校验）
- [x] 1. 移除全站场景并发数强制为 1 的分流逻辑。
  - 摘要：`buildSceneRequestsFromWizard` 改为统一使用 `configuredParallelSubmitTimes`。
- [x] 2. 修正并发数 UI 提示逻辑，避免全站场景被固定显示为 1。
  - 摘要：`resolveParallelSubmitHintCount` 改为直接返回草稿并发数。
- [x] 3. 在结果汇总阶段增加“同计划重复提交失败去重”。
  - 摘要：若同计划存在成功且失败错误命中“请勿重复提交/重复提交/duplicate submit”，则从 failures 中剔除并回写 failCount。
- [x] 4. 构建与定向测试验证并回填复盘。
  - 摘要：`node scripts/build.mjs`、`node --test tests/site-scene-submit-mode.test.mjs`、`node scripts/build.mjs --check`、`node --check "阿里妈妈多合一助手.js"` 全部通过。

## 结果复盘
- 并发数透传：全站场景不再强制降到 `1`，点击并发后会按菜单里的并发数执行。
- 结果统计收敛：同计划出现“重复提交”失败但已有成功时，最终汇总会自动去重，避免“成功同时又记失败”的误导统计。
- 验证命令：
  - `node scripts/build.mjs`
  - `node --test tests/site-scene-submit-mode.test.mjs`
  - `node scripts/build.mjs --check`
  - `node --check "阿里妈妈多合一助手.js"`

# TODO - 2026-03-24 版本号升级到 v6.08

## 需求规格
- 目标：将仓库版本从 `v6.07` 升级到 `v6.08`，并同步版本相关文档与发布头信息。
- 范围：`src/entries/userscript-meta.js`、`src/shared/script-preamble.js`、`README.md`、`CLAUDE.md` 及构建产物。
- 验证：构建与校验命令通过，根脚本版本号与更新日志一致。

## 执行计划（含校验）
- [x] 1. 同步源码版本号与更新日志条目到 `v6.08`。
  - 摘要：已更新 `src/entries/userscript-meta.js`、`src/shared/script-preamble.js`、`README.md`、`CLAUDE.md`。
- [x] 2. 运行构建并刷新根脚本与 dist 产物。
  - 摘要：已执行 `node scripts/build.mjs`，根脚本与 `dist/packages`、`dist/extension` 产物同步到 `6.08`。
- [x] 3. 执行校验命令并回填结果。
  - 摘要：`node scripts/build.mjs --check`、`node --check "阿里妈妈多合一助手.js"` 全部通过。

## 结果复盘
- 版本已从 `v6.07` 升级到 `v6.08`，版本号与更新日志三处（userscript 头、脚本 preamble、README）一致。
- `CLAUDE.md` 当前版本已同步为 `v6.08`。
- 验证命令：
  - `node scripts/build.mjs`
  - `node scripts/build.mjs --check`
  - `node --check "阿里妈妈多合一助手.js"`

# TODO - 2026-03-24 并发语义修复：所有计划同时提交 + 按并发数复制同计划

## 需求规格
- 目标：修复“并发”提交语义，确保并发模式下是所有计划同时提交，且每个计划按并发数复制并发提交。
- 范围：调整 `createPlansBatch` 并发分支逻辑与回归测试，不改非并发（单条）行为。
- 验证：定向测试覆盖并发语义，构建与语法检查通过。

## 执行计划（含校验）
- [x] 1. 定位并发语义偏差点与当前限制条件。
  - 摘要：已定位 `create-and-suggest.js` 中 `remainingEntries.length === 1 && parallelSubmitTimes > 1` 导致仅单计划走并发复制。
- [x] 2. 改造并发分支为“批次内所有计划并发复制提交”。
  - 摘要：`createPlansBatch` 新增批次并发 helper，`parallelSubmitTimes > 1` 时对 remainingEntries 全量并发提交，每个计划按并发数复制提交。
- [x] 3. 更新回归测试断言并同步构建产物。
  - 摘要：已更新 `tests/site-scene-submit-mode.test.mjs` 并发语义断言，`node scripts/build.mjs` 同步根脚本与 dist 产物。
- [x] 4. 运行定向测试与构建校验并复盘。
  - 摘要：`node --test tests/site-scene-submit-mode.test.mjs`、`node scripts/build.mjs --check`、`node --check "阿里妈妈多合一助手.js"` 全部通过。

## 结果复盘
- 根因：并发复制逻辑仅在 `remainingEntries.length === 1` 时触发，导致多计划批次无法按“每个计划复制并发提交”执行。
- 修复：并发条件改为 `parallelSubmitTimes > 1`，并新增“批次内所有计划并发复制提交”逻辑，失败计划继续进入现有失败收集/兜底单条链路。
- 影响范围：
  - `src/optimizer/keyword-plan-api/create-and-suggest.js`
  - `tests/site-scene-submit-mode.test.mjs`
- 验证命令（顺序执行）：
  - `node scripts/build.mjs`
  - `node --test tests/site-scene-submit-mode.test.mjs`
  - `node scripts/build.mjs --check`
  - `node --check "阿里妈妈多合一助手.js"`

# TODO - 2026-03-24 批量建计划“立即投放”默认提交方式改为单条

## 需求规格
- 目标：在“关键词推广批量建计划 API 向导”中，点击“立即投放”时默认提交方式从“并发”调整为“单条”。
- 范围：仅调整默认值与兜底值（`submitMode`）及对应测试断言，不改变手动切换菜单行为。
- 验证：构建产物同步后，定向回归测试通过，且根脚本包含新默认值。

## 执行计划（含校验）
- [x] 1. 定位“立即投放”默认提交方式的状态来源与兜底链路。
  - 摘要：已定位 `matrix.js` 默认草稿值与 `wizard-mount-intro.js` / `strategy-state-and-draft.js` / `request-builder-preview.js` 多处 `|| 'parallel'` 兜底。
- [x] 2. 将默认与兜底统一改为 `serial`（单条），保持菜单可切换并发。
  - 摘要：已修改 `matrix.js` 默认草稿值，以及 `wizard-mount-intro.js` / `strategy-state-and-draft.js` / `request-builder-preview.js` 的 submitMode 空值兜底。
- [x] 3. 更新对应测试断言并同步构建产物。
  - 摘要：已更新 `tests/site-scene-submit-mode.test.mjs` 里默认值/兜底断言并执行构建同步根脚本与 dist 产物。
- [x] 4. 运行定向测试与构建校验，回填复盘。
  - 摘要：`node --test tests/site-scene-submit-mode.test.mjs`、`node scripts/build.mjs --check`、`node --check "阿里妈妈多合一助手.js"` 全部通过。

## 结果复盘
- 行为变化：首次进入向导且未手动切换提交方式时，“立即投放”默认按“单条”提交；用户仍可在下拉菜单切回“并发数”。
- 改动文件：
  - `src/optimizer/keyword-plan-api/matrix.js`
  - `src/optimizer/keyword-plan-api/wizard-mount-intro.js`
  - `src/optimizer/keyword-plan-api/wizard-scene-config/strategy-state-and-draft.js`
  - `src/optimizer/keyword-plan-api/request-builder-preview.js`
  - `tests/site-scene-submit-mode.test.mjs`
- 验证命令：
  - `node scripts/build.mjs`
  - `node --test tests/site-scene-submit-mode.test.mjs`
  - `node scripts/build.mjs --check`
  - `node --check "阿里妈妈多合一助手.js"`

# TODO - 2026-03-23 全仓收口验证（全量 tests + review-team）

## 需求规格
- 目标：执行最终收口验证，覆盖 `tests/*.test.mjs` 与 `scripts/review-team.sh`，确认当前工作区可通过全仓门禁。
- 方式：继续建立不少于 3 个 AGENTS 并行执行与复核，主线程汇总结果。
- 验证标准：
  - `node --test tests/*.test.mjs` 通过
  - `bash scripts/review-team.sh` 通过
  - 若失败，记录失败点并继续修复到通过

## 执行计划（含校验）
- [x] 1. 建立不少于 3 个 AGENTS 并行分工执行全仓验证。
  - 摘要：Agent A 跑全量 tests；Agent B 跑 review-team；Agent C 跑 build/check/syntax 复核。
- [x] 2. 主线程同步执行同等验证并交叉比对输出。
  - 摘要：主线程复跑 `node --test tests/*.test.mjs` 与 `bash scripts/review-team.sh`；与 3 个 AGENTS 结论一致。
- [x] 3. 汇总结果并回填复盘。
  - 摘要：已完成版本修复与全仓收口，门禁通过。

## 结果复盘
- 首次收口失败点：`scripts/review-team.sh` 在版本一致性阶段报 `script=6.07 CLAUDE=6.06`。
- 修复动作：将 `CLAUDE.md` 的当前版本更新为 `v6.07`。
- 复跑结果：
  - `node --test tests/*.test.mjs`：`tests=347 pass=345 fail=0 skipped=2`
  - `bash scripts/review-team.sh`：全流程 PASS（含 Build/Architecture/Security/Test/Release）
- 并行复核：3 个 AGENTS（全量测试 / review-team / 版本一致性）结论均为通过。

# TODO - 2026-03-23 更新日志与内容同步（v6.07）

## 需求规格
- 目标：同步本轮修复的更新日志与版本内容，确保 `README`、脚本头部更新日志、`@version` 三处一致。
- 范围：`README.md`、`src/shared/script-preamble.js`、`src/entries/userscript-meta.js` 及构建产物。
- 验证：构建后核对根脚本 `@version` 与更新日志条目一致。

## 执行计划（含校验）
- [x] 1. 新增 `v6.07 (2026-03-23)` 更新日志条目，统一描述本轮批量建计划修复内容。
  - 摘要：README 与脚本 preamble 已新增 v6.07 四条变更说明。
- [x] 2. 同步 `@version` 到 `6.07`。
  - 摘要：`src/entries/userscript-meta.js` 已更新为 6.07。
- [x] 3. 运行构建并校验产物版本一致性。
  - 摘要：`build/build --check/syntax` 通过，根脚本与 dist 产物均已同步为 `6.07`。

## 结果复盘
- `README`、脚本 preamble、`@version` 三处已同步为 v6.07。
- 验证命令：
  - `node scripts/build.mjs`
  - `node scripts/build.mjs --check`
  - `node --check "阿里妈妈多合一助手.js"`

# TODO - 2026-03-23 runtime harness 多计划 strict fallback 覆盖评估

## 需求规格
- 目标：评估现有 runtime harness 是否足以覆盖 `createPlansBatch` 的“多计划 strict fallback”早退分支。
- 范围：只读评估为主，必要时仅执行定向测试；不新增依赖、不改业务实现。
- 输出：覆盖充分性结论 + 风险与注意事项。
- 验证：运行 `tests/keyword-create-strict-goal-runtime.test.mjs` 并核对 strict 早退分支源码。

## 执行计划（含校验）
- [x] 1. 核对 harness 结构与依赖清单，确认是否可独立执行 strict 分支。
  - 摘要：重点检查 `CREATE_PLANS_BATCH_DEP_KEYS`、`createPlansBatchFromSource`、stub 最小集。
- [x] 2. 核对“多计划 strict fallback”用例对关键返回结构的断言覆盖。
  - 摘要：确认是否覆盖 `failCount`、`failures` 计划隔离、错误类型与 strict 早退路径。
- [x] 3. 执行定向测试并回填评估结论与注意事项。
  - 摘要：执行 `node --test tests/keyword-create-strict-goal-runtime.test.mjs`。

## 结果复盘
- 覆盖结论：现有 runtime harness 已足以覆盖“多计划 strict fallback 早退”主分支，不需要新增依赖。
- 关键依据：
  - harness 通过 `Function(...deps)` 动态注入 31 个最小依赖，可独立执行 `createPlansBatch`（非 regex-only）。
  - 已有多计划用例命中 `strictGoalMatch && strictGoalFailures.length` 分支，并断言 `failCount=2`、`failures[*].planName/marketingGoal/submitEndpoint` 逐计划隔离。
  - 定向测试通过：`node --test tests/keyword-create-strict-goal-runtime.test.mjs`（3/3）。
  - 产物同步通过：`node scripts/build.mjs --check`。

# TODO - 2026-03-23 strict fallback 多计划隔离测试最小断言增强

## 需求规格
- 目标：在 `tests/keyword-create-strict-goal-runtime.test.mjs` 增加一个“多计划 strict fallback 隔离”的最小断言建议。
- 范围：仅增强现有多计划用例断言，不修改业务实现。
- 验证：运行目标测试文件并确认通过。

## 执行计划（含校验）
- [x] 1. 核对现有多计划 strict fallback 用例已覆盖字段，定位最小可补点。
  - 摘要：现有用例已校验 `planName/marketingGoal` 隔离，缺少 `submitEndpoint` 维度隔离保护。
- [x] 2. 以最小改动补充隔离断言。
  - 摘要：新增 `result.failures[*].submitEndpoint` 顺序断言，校验与 plan 级 endpoint 一一对应。
- [x] 3. 运行定向测试并回填结果复盘。
  - 摘要：`node --test tests/keyword-create-strict-goal-runtime.test.mjs` 通过（3/3）。

## 结果复盘
- 核心结果：多计划 strict fallback 失败明细除 `planName/marketingGoal` 外，新增了 `submitEndpoint` 隔离回归保护。
- 验证：`node --test tests/keyword-create-strict-goal-runtime.test.mjs` 通过。

# TODO - 2026-03-23 测试层最小增强建议：早退 failures 条目校验 submitEndpoint / marketingGoal

## 需求规格
- 目标：给出测试层最小增强建议，验证 `createPlansBatch` 早退结果中的 `failures[*]` 条目包含 `submitEndpoint` 与 `marketingGoal`。
- 范围：仅核对并记录最小测试补强点；不修改业务实现。
- 约束：优先复用已有 `tests/keyword-create-early-return-shape.test.mjs`，避免新增运行时 harness 或扩大测试面。
- 验证：运行目标测试文件，确认对应断言可通过。

## 执行计划（含校验）
- [ ] 1. 核对早退分支中 `failures[*]` 的实际结构与现有测试覆盖。
  - 摘要：重点看 `sceneRuntimeMismatch`、`template not ready`、`!plans.length`、`!builtList.length` 4 个早退分支。
- [ ] 2. 收敛最小增强建议，确认是否只需在现有正则测试中增加 failure 条目 lookahead/顺序断言。
  - 摘要：优先复用现有 `keyword-create-early-return-shape`，不新增新测试文件。
- [ ] 3. 运行定向测试并回填结果复盘。
  - 摘要：执行 `node --test tests/keyword-create-early-return-shape.test.mjs`。

# TODO - 2026-03-23 早退分支 failures 条目结构统一

## 需求规格
- 目标：统一 `createPlansBatch` 关键早退分支的 `failures[*]` 结构，避免仅 `error` 字段导致上层消费不稳定。
- 范围：仅改 `src/optimizer/keyword-plan-api/create-and-suggest.js` 与对应测试；不改接口语义。
- 验证：目标测试集、构建检查、语法检查全部通过。

## 执行计划（含校验）
- [x] 1. 建立不少于 3 个 AGENTS 并行定位仍缺失结构字段的早退分支。
  - 摘要：并行确认 scene runtime、无可提交计划、build 全失败兜底是本轮统一重点。
- [x] 2. 统一补齐 `failures[*]` 五字段结构（`planName/item/marketingGoal/submitEndpoint/error`）。
  - 摘要：已在 4 个早退分支落地统一 failure 条目结构。
- [x] 3. 增强回归测试并完成验证。
  - 摘要：`tests/keyword-create-early-return-shape.test.mjs` 增强通过；目标测试集 45/45 通过。

## 结果复盘
- 核心结果：早退结果不再出现仅 `error` 的 failure 条目，批量失败明细结构与其余失败路径保持一致。
- 验证：
  - `node scripts/build.mjs`
  - `node --test tests/keyword-create-runtime-helpers.test.mjs tests/non-keyword-optional-prune-runtime.test.mjs tests/keyword-build-solution-payload-behavior.test.mjs tests/keyword-create-repair-item-binding-guard.test.mjs tests/lead-scene-template-id-guard.test.mjs tests/keyword-create-explicit-field-preserve.test.mjs tests/keyword-create-strict-goal-match.test.mjs tests/keyword-create-normalize-drop-failures.test.mjs tests/keyword-create-goal-warning-merge.test.mjs tests/keyword-create-early-return-shape.test.mjs tests/goal-resolution-fuzzy-fallback.test.mjs tests/site-scene-submit-mode.test.mjs`
  - `node scripts/build.mjs --check`
  - `node --check "阿里妈妈多合一助手.js"`

# TODO - 2026-03-23 tests 最小断言增强：scene runtime / 无可提交计划早退 common 字段

## 需求规格
- 目标：为 `scene runtime` 早退与“无可提交计划”早退补结构回归保护，确保结果包含公共上下文字段。
- 范围：新增目标测试文件并回填任务记录；不改业务行为语义。
- 约束：优先使用稳健正则，避免绑定过长源码细节或字段顺序。
- 验证：运行目标测试文件，确认新增断言通过。

## 执行计划（含校验）
- [x] 1. 精确核对两个早退分支的返回结构与现有测试缺口。
  - 摘要：确认 `scene runtime mismatch`、`template not ready`、`!plans.length`、`!builtList.length` 4 个早退分支均需要稳定字段保护。
- [x] 2. 以最小改动补充稳健正则断言覆盖上述分支。
  - 摘要：新增 `tests/keyword-create-early-return-shape.test.mjs`，使用 lookahead 正则锁定 `runtime/submitEndpoint/policy/flag/rawResponses` 等共享字段。
- [x] 3. 运行定向测试并回填结果复盘。
  - 摘要：`node --test tests/keyword-create-early-return-shape.test.mjs` 与完整目标测试集均通过。

## 结果复盘
- 核心结果：新增独立测试文件保护 4 个关键早退分支的公共结果字段，避免后续重构造成字段漂移。
- 稳健性：采用 lookahead 断言，减少对字段顺序和邻近分支文本的耦合。
- 验证：`node --test tests/keyword-create-early-return-shape.test.mjs`、`node scripts/build.mjs --check`、`node --check "阿里妈妈多合一助手.js"` 通过。

# TODO - 2026-03-23 strictGoalFailures 早退返回 vs request级严格失败/最终成功 字段一致性检查

# TODO - 2026-03-23 scene runtime mismatch / template not ready 早退结果字段核对

## 需求规格
- 目标：核对 `src/optimizer/keyword-plan-api/create-and-suggest.js` 中 `scene runtime mismatch` / `template not ready` 早退返回，与最终 `result` 同构所需的最小字段集。
- 输出：列出最小应补齐字段，并区分“顶层结果字段”与“`failures[*]` 子项字段”。
- 约束：本次仅做只读分析，不修改业务代码。

## 执行计划（含校验）
- [x] 1. 定位两个早退分支与最终 `result` 的源码位置。
  - 摘要：已核对 `create-and-suggest.js` 中 `sceneRuntimeMismatch && strictSceneRuntimeMatch`、`requireTemplateForScene && !isRuntimeTemplateReadyForScene(runtime)` 两个早退返回，以及最终 `const result = { ... }`。
- [x] 2. 对比顶层字段与 `failures[*]` 子项 contract，并核对仓内消费方。
  - 摘要：已确认两处分支的顶层字段已基本对齐最终 `result`；仓内实际消费主要集中在 `successCount` / `failCount` / `failures` / `submitEndpoint` / `rawResponses`，`sceneConfigMapping` 暂未发现外部读取。
- [x] 3. 回填结果复盘，形成最小缺口结论。
  - 摘要：已收敛为“顶层可选补 1 项，failure 子项建议补 4 项”的最小集合。

## 结果复盘
- 核心结论：
  - 这两个早退分支的顶层结果目前已经带上 `runtime`、`marketingGoal`、`goalFallbackUsed`、`goalWarnings`、`submitEndpoint`、`fallbackPolicy`、`conflictPolicy`、`stopScope`、`strictGoalMatch`、`allowFuzzyGoalMatch`、`rawResponses`，与最终 `result` 的顶层差异实际上只剩 `sceneConfigMapping`。
  - 如果按“最小稳定 contract”收敛，我不把 `sceneConfigMapping` 算进必须项；它仓内暂无明确消费，而且分支发生时尚未进入 `resolveSceneSettingOverrides`。
  - 当前更实质的缺口在 `failures[0]` 子项：这两个分支只返回了 `error`，还没和最终失败项常见结构对齐。
- 最小补齐建议：
  - 顶层可选：`sceneConfigMapping`
  - `failures[0]` 建议补齐：`planName`、`item`、`marketingGoal`、`submitEndpoint`

# TODO - 2026-03-23 create-and-suggest 计划缺失 / 构建空结果 早退返回结构统一建议

## 需求规格
- 目标：定位 `src/optimizer/keyword-plan-api/create-and-suggest.js` 中 `!plans.length` 与 `!builtList.length` 两个早退分支，并给出统一返回结构建议。
- 输出：说明精确位置、当前字段差异、建议复用的最小返回 contract，以及避免未初始化变量的实现约束。
- 约束：本次仅做只读分析，不修改业务代码。

## 执行计划（含校验）
- [x] 1. 读取两个早退分支及 request 级严格失败、最终主返回，确认现状。
  - 摘要：已定位 `!plans.length` 在约第 921 行，`!builtList.length` 在约第 988 行；并补看 request 级严格失败 helper 与最终 `result` 返回。
- [x] 2. 对比字段差异，收敛最小统一返回结构。
  - 摘要：当前工作树里这两个早退分支已补齐 `runtime/marketingGoal/goalFallbackUsed/goalWarnings/submitEndpoint/fallbackPolicy/conflictPolicy/stopScope/strictGoalMatch/allowFuzzyGoalMatch/rawResponses`，与 strict/request 失败和最终主返回已基本同构；主要剩余选择是是否额外收口一个统一的 `common` 子对象，以及是否补 `sceneConfigMapping` 占位。
- [x] 3. 记录避免未初始化变量的实现边界。
  - 摘要：统一结构可安全依赖 `mergedRequest/runtime/mergedGoalWarnings/sceneConfigMapping` 等在早退前已稳定可用的变量；真正不能提前引用的是 `sampleMeta`、`sampleCampaign`、`sampleAdgroup` 等只在 `builtList.length > 0` 后才派生的值，以及后面才声明的 `rawResponses` 变量本身（早退分支应直接写死 `[]`）。

## 结果复盘
- 核心结论：建议新增一个“早退结果 helper”，让 `!plans.length` 与 `!builtList.length` 共享同一返回骨架；如果还要继续统一 contract，优先新增稳定的 `common` 子对象，而不是强行把 dry-run snapshot 或 `sceneConfigMapping` 复制到所有失败分支。
- 核心结论：建议新增一个“早退结果 helper”，让 `!plans.length` 与 `!builtList.length` 共享同一返回骨架；如果还要继续统一 contract，优先新增稳定的 `common` 子对象。`sceneConfigMapping` 本身已可安全纳入统一结果，但不建议引入依赖 `builtList[0]` 的 snapshot 字段。
- 边界约束：helper 参数必须全部有默认值，尤其 `failures = []`、`runtime = {}`、`mergedRequest = {}`、`goalWarnings = []`，避免后续为统一结构引入未初始化变量或访问空对象链。

## 需求规格
- 目标：检查 `src/optimizer/keyword-plan-api/create-and-suggest.js` 中 `strictGoalFailures` 早退返回，与 request 级严格失败、最终成功返回之间的字段差异。
- 输出：给出“最小一致化字段列表”，最多 8 项，并说明每项保留理由。
- 约束：本次仅做只读分析，不修改业务代码。

## 执行计划（含校验）
- [x] 1. 读取三类返回分支源码，列出字段集合。
  - 摘要：已核对 request 级严格失败 helper、`strictGoalFailures` 早退分支、最终成功 `result` 分支。
- [x] 2. 对比交集、缺口与语义差异，筛出最小一致化字段。
  - 摘要：已确认 `strictGoalFailures` 早退与 request 级严格失败顶层字段基本同构；与最终成功相比，唯一明显缺口是 `sceneConfigMapping`，其余主要是同名字段取值语义差异。
- [x] 3. 回填结果复盘，输出建议清单。
  - 摘要：已形成 8 项以内的最小 contract 建议，优先覆盖上层真实消费字段，不把 `sceneConfigMapping` 纳入最小集合。

## 结果复盘
- 核心结论：`strictGoalFailures` 早退分支在顶层结构上已基本对齐 request 级严格失败；如果只做“最小一致化”，更应锁定一组稳定 contract 字段，而不是为了对齐最终成功分支额外把 `sceneConfigMapping` 塞进早退结果。
- 额外发现：`sceneConfigMapping` 仅在 `create-and-suggest.js` 内构造并出现在最终成功结果中，仓内未发现其他消费方读取它；而 `successCount`、`failCount`、`failures`、`submitEndpoint`、`rawResponses` 等字段已有上层实际依赖。

# TODO - 2026-03-23 任务B strictGoal plan级早退 allowFuzzyGoalMatch 回归测试草案

## 需求规格
- 目标：设计一个可执行回归测试，验证 `strictGoalMatch` 在 plan 级早退时，返回结果包含 `allowFuzzyGoalMatch`，且值与请求/选项归一化结果一致。
- 输出：可直接落地的测试代码草案。
- 约束：不修改业务代码；本次仅给测试方案。

## 执行计划（含校验）
- [x] 1. 建立不少于 3 个并行分析代理，分别核对现有 strictGoal 测试、`createPlansBatch` 最新实现、可复用 harness 模式。
  - 摘要：3 个分析代理均确认现有 `tests/keyword-create-strict-goal-match.test.mjs` 仍是 regex-only；`tests/keyword-create-runtime-helpers.test.mjs` 的 `Function(...)` 切片模式可直接复用。
- [x] 2. 收敛最小可执行测试入口。
  - 摘要：最佳入口是提取 `createPlansBatch` 本体并注入最小依赖 stub，构造“request 级不 fallback、plan 级 fallback”的场景，直接断言返回结果。
- [x] 3. 整理可直接落地的测试草案。
  - 摘要：已形成单文件草案，覆盖 `options.allowFuzzyGoalMatch=true` 与 `request.allowFuzzyGoalMatch=true` 两条来源。

## 结果复盘
- 核心结论：要验证“plan 级早退结果里带出 `allowFuzzyGoalMatch` 且值正确”，必须执行 `createPlansBatch`；只测 helper 或正则都不够。
- 最小实现策略：stub 掉 `getRuntimeDefaults`、`normalizePlans`、`resolveGoalContextForPlan`、`resolveSceneCapabilities`、`resolvePreferredItems` 等重依赖，仅保留 strict 早退主链路。

# TODO - 2026-03-23 任务B normalize-drop-failures 断言失配根因分析

## 需求规格
- 目标：定位 `tests/keyword-create-normalize-drop-failures.test.mjs` 的失败根因，并结合 `create-and-suggest.js` 最新实现给出最小断言更新方案。
- 输出：失败根因、建议正则或结构断言。
- 约束：仅分析与建议，不修改业务代码。

## 执行计划（含校验）
- [x] 1. 运行测试并确认当前失败/通过状态。
  - 摘要：已发现一次失败输出对应旧断言；当前工作树重新执行 `node --test tests/keyword-create-normalize-drop-failures.test.mjs` 已通过。
- [x] 2. 对照 `create-and-suggest.js` 最新实现定位断言失配点。
  - 摘要：失配点集中在 `onDroppedPlan` 回调：实现已从内联 `push({ ... })` 改为 `push(buildDroppedPlanFailure(droppedPlan, mergedRequest))`。
- [x] 3. 整理最小断言更新方案并回填结果。
  - 摘要：建议仅更新第二条 regex，或拆成“存在回调 + 调用 helper”两个更稳的结构断言。

## 结果复盘
- 核心结论：业务行为没有回退，失败来自测试正则过度绑定旧实现细节。
- 最小补丁面：只需要把 `normalizedPlanDropFailures.push({` 的旧断言改成 helper 调用断言；其余三条断言可保持不变。

# TODO - 2026-03-23 strictGoal / dropped failures / optional prune 可执行测试方案

## 需求规格
- 目标：为以下 3 个行为设计“可执行、非正则源码匹配”的最小测试方案：
  - `strictGoal` request 级早失败；
  - `dropped plan failures` 合并；
  - 非关键词 `optional prune` 对显式字段保留。
- 输出：建议测试文件、最小 harness 方案、关键断言点。
- 约束：本次不改业务代码与测试代码；仅做只读分析与任务记录。

## 执行计划（含校验）
- [x] 1. 阅读相关源码与现有测试，区分源码匹配测试和已存在的可执行测试。
  - 摘要：已确认 `tests/keyword-create-strict-goal-match.test.mjs`、`tests/keyword-create-normalize-drop-failures.test.mjs`、`tests/keyword-create-explicit-field-preserve.test.mjs` 仍是正则匹配；`tests/keyword-create-runtime-helpers.test.mjs`、`tests/non-keyword-optional-prune-runtime.test.mjs` 已有可复用的 `Function(...)` 切片执行模式。
- [x] 2. 为 3 个行为分别收敛最小可执行测试入口。
  - 摘要：第 1/2 项建议以 `createPlansBatch` 轻量 stub harness 覆盖真实返回结果；第 3 项最小入口为 `applyNonKeywordOptionalCampaignPrune`，若要替换掉当前 regex 保护，建议再补一个 `buildSolutionFromPlan` 窄集成用例。
- [x] 3. 回填结果复盘，准备对外输出。
  - 摘要：已整理建议文件、测试输入和断言点；不涉及代码改动。

## 结果复盘
- 核心结论：第 1/2 项都应落在 `createPlansBatch` 可执行 harness，单测 helper 不足以证明“提前返回 / failures 合并”；第 3 项已有 helper 级可执行测试雏形，可最小扩展，但若要完整替代现有 regex 测试，仍建议补一个 `buildSolutionFromPlan` 级窄集成断言。
- 风险说明：如果继续保留当前 regex-only 方案，最容易漏掉的是“分支仍在，但返回结果或 merge 顺序已变”的行为回归。

# TODO - 2026-03-22 万能查数双面板样式调整

# TODO - 2026-03-23 strictGoalFailures 早退结果补齐 allowFuzzyGoalMatch

## 需求规格
- 目标：修复 `createPlansBatch` 在 `strictGoalFailures` 早退返回结果中缺少 `allowFuzzyGoalMatch` 字段的问题。
- 范围：仅修改相关实现与最小测试覆盖；不做无关重构。
- 约束：避免覆盖当前工作区已有改动，只处理目标文件。
- 验证：至少覆盖对应测试，并确认读取根 userscript 的断言通过。

## 执行计划（含校验）
- [x] 1. 核对源码、根 userscript 与测试读取路径，确认缺口落点。
  - 摘要：确认缺口位于 `strictGoalFailures` 早退返回分支，缺少 `allowFuzzyGoalMatch` 字段。
- [x] 2. 在最小范围内补齐缺失实现或同步产物。
  - 摘要：已在 `src/optimizer/keyword-plan-api/create-and-suggest.js` 的 strict 早退结果补齐 `allowFuzzyGoalMatch`。
- [x] 3. 补最小测试覆盖并跑定向测试。
  - 摘要：已更新 `tests/keyword-create-strict-goal-match.test.mjs`，新增对 strict 早退返回含 `allowFuzzyGoalMatch` 的断言。
- [x] 4. 回填结果复盘。
  - 摘要：构建、目标测试集、`build --check` 与语法检查均通过。

## 当前进度
- 当前阶段：已完成。
- 风险提示：仓库当前工作区较脏，需避免覆盖他人已存在改动；优先最小补丁。

## 结果复盘
- 修复内容：
  - `strictGoalFailures` 提前失败返回新增 `allowFuzzyGoalMatch` 字段，避免与 request 级失败/最终结果结构不一致。
  - `keyword-create-strict-goal-match` 增加对应契约断言，防止后续回归。
- 验证命令：
  - `node scripts/build.mjs`
  - `node --test tests/keyword-create-runtime-helpers.test.mjs tests/non-keyword-optional-prune-runtime.test.mjs tests/keyword-build-solution-payload-behavior.test.mjs tests/keyword-create-repair-item-binding-guard.test.mjs tests/lead-scene-template-id-guard.test.mjs tests/keyword-create-explicit-field-preserve.test.mjs tests/keyword-create-strict-goal-match.test.mjs tests/keyword-create-normalize-drop-failures.test.mjs tests/keyword-create-goal-warning-merge.test.mjs tests/goal-resolution-fuzzy-fallback.test.mjs tests/site-scene-submit-mode.test.mjs`
  - `node scripts/build.mjs --check`
  - `node --check "阿里妈妈多合一助手.js"`

# TODO - 2026-03-23 payload prune / createPlansBatch 可测性闭环核查

## 需求规格
- 目标：基于当前最新代码，列出仍未闭环、且可直接修的 2-3 个高优先项。
- 重点：
  - `payload prune` 行为可测性；
  - `createPlansBatch` 运行时分支可测性。
- 约束：本次不改业务代码；仅核查源码、测试与当前可观测性缺口。
- 判定标准：
  - 已闭环：关键行为已被运行时测试直接执行，或至少被可复用函数级测试覆盖，而非仅正则/源码片段断言。
  - 未闭环：当前只能证明“代码分支存在”，不能证明分支组合后行为正确。

## 执行计划（含校验）
- [x] 1. 回顾历史 `Report.md` / `tasks/lessons.md` / 既有 TODO，锁定本次核查范围。
  - 摘要：已确认上一轮调查的剩余风险集中在 `buildSolutionFromPlan` payload prune 与 `createPlansBatch` 多分支执行路径。
- [x] 2. 阅读 `search-and-draft.js`、`create-and-suggest.js` 的关键实现并抓取精确行号。
  - 摘要：已核对关键词白名单裁剪、非关键词 optional prune、`itemIdList` 二次重写、`dryRunOnly`、场景运行时同步、并发提交/单条兜底等核心路径。
- [x] 3. 对照现有测试，判断哪些是运行时测试，哪些只是源码契约测试。
  - 摘要：`normalizePlans`、`mergeGoalWarnings`、`buildDroppedPlanFailure` 有函数级执行测试；多数 `createPlansBatch` 与 prune 相关用例仍是 bundle 正则或源码片段提取。
- [x] 4. 输出未闭环高优先项，并回填结果复盘。
  - 摘要：已形成 3 个高优先项，均可直接通过新增运行时测试或最小测试接口暴露来闭环。

## 当前进度
- 当前阶段：核查完成，整理结论中。
- 风险提示：当前测试仍偏“代码存在性”校验，无法充分约束多计划组合、场景运行时分支和 prune 后最终 payload 的真实行为。

## 结果复盘
- 结论：当前最值得直接修的不是业务逻辑本身，而是两类测试盲区：
  - `buildSolutionFromPlan` / prune 相关分支缺少真实 payload 断言；
  - `createPlansBatch` 多数运行时分支缺少可执行入口，只验证了代码块存在。
- 优先级建议：
  - P1：先让 `dryRunOnly` 可返回多 plan 明细或暴露可测试 builder，再补 payload snapshot 测试；
  - P1：补 `createPlansBatch` 的运行时分支注入测试能力，覆盖 scene runtime sync / strict mismatch / template not ready；
  - P1：补批次提交分支的行为测试，覆盖 grouped endpoint / parallel single submit / disable fallback single retry / conflict auto stop retry。

# TODO - 2026-03-23 Report.md 核心发现闭环核查

## 需求规格
- 目标：逐条对照 `Report.md` 的核心发现，基于当前最新代码与测试判断是否已闭环。
- 输出：给出“已修复 / 部分修复 / 未修复”矩阵，最多 10 条。
- 约束：本次不改代码；仅做代码、测试与已有修复记录核查。
- 判定标准：
  - 已修复：当前代码已覆盖问题点，且有直接测试或明确实现证据支撑。
  - 部分修复：问题被缩小或只修其中一部分，仍存在剩余风险或缺少完整行为级验证。
  - 未修复：当前代码与测试不足以证明问题已消除，或报告中的风险点仍原样存在。

## 执行计划（含校验）
- [ ] 1. 读取 `Report.md`，抽取核心发现与优先级。
  - 摘要：待执行。
- [ ] 2. 对照 `tasks/todo.md` 中后续修复记录，定位可能已处理的问题。
  - 摘要：待执行。
- [ ] 3. 阅读对应源码与测试，确认每条发现的当前实现状态。
  - 摘要：待执行。
- [ ] 4. 形成闭环判断矩阵，并回填结果复盘。
  - 摘要：待执行。

## 当前进度
- 当前阶段：规划完成，开始读取报告与后续修复证据。
- 风险提示：若某条发现只有任务记录但缺少当前代码/测试证据，不会判定为“已修复”。

## 结果复盘
- 待执行。

## 需求规格
- 目标模块：万能查数弹窗（`src/main-assistant/magic-report.js`）
- 目标改动：将“万能查数 / 人群对比看板”两面板切换器改成参考图中的分段样式。
- 布局要求：切换器放到弹窗头部最上方。
- 行为要求：保持现有 tab 切换能力与默认视图持久化能力不变。
- 兼容要求：不破坏已有回归测试对默认图标和切换逻辑的断言。

## 执行计划（含校验）
- [x] 1. 定位现有 tab DOM/CSS 与事件绑定实现。
  - 摘要：确认 `createPopup` 中 tab 位于 header 底部，样式定义在同文件 style 文本内。
- [x] 2. 调整 DOM 顺序，把 tab 切换器上移到 header 顶部。
  - 摘要：`am-magic-view-tabs` 已移至 `.am-magic-header` 第一行，视觉位于最上方。
- [x] 3. 重写 tab 容器/按钮样式为分段风格，并确保默认图标能力仍可用。
  - 摘要：切换器改为浅灰容器 + 白色激活胶囊；默认图标保留并在 hover/focus/default 时显示。
- [x] 4. 运行构建与关键测试验证改动可用。
  - 摘要：`node scripts/build.mjs`、`node scripts/build.mjs --check`、`node --check "阿里妈妈多合一助手.js"`、`node --test tests/magic-report-crowd-matrix.test.mjs` 全部通过；并使用 chrome-devtools MCP 在 `one.alimama.com` 真实页面验证 tab 位于顶部且样式生效。
- [x] 5. 结果复盘与风险记录。
  - 摘要：本次仅调整 DOM 顺序与样式，不改 tab 行为逻辑；默认视图图标能力仍保留（hover/focus/default 显示）。

## 结果复盘
- 目标达成：万能查数双面板切换已改为灰底分段样式，且在弹窗最上方。
- 影响范围：`src/main-assistant/magic-report.js`（源实现）及构建产物（根 userscript + dist）。
- 回归状态：构建、语法、关键回归测试、真实页面 MCP 验证均通过。
- 风险说明：默认视图星标改为弱显式（非 hover/focus 时隐藏），如需常驻展示可再调整视觉权重。

---

# TODO - 2026-03-22 万能查数头部层级与质感微调（用户修正）

## 需求规格
- 目标模块：万能查数弹窗头部（`src/main-assistant/magic-report.js`）
- 用户修正1：`#am-magic-report-popup > div.am-magic-header > div.am-magic-header-main` 需要放在最上面。
- 用户修正2：`#am-magic-view-tabs` 字号过大，需要调小。
- 用户修正3：tab 灰色底与当前整体风格一致，使用更轻的透明质感。

## 执行计划（含校验）
- [x] 1. 明确修正点并制定最小改动方案。
  - 摘要：仅调整 header 子元素顺序与 tabs 视觉参数，不改行为逻辑。
- [x] 2. 调整 header DOM 顺序，确保 `am-magic-header-main` 位于最上层。
  - 摘要：header 子节点顺序调整为 `am-magic-header-main -> am-magic-view-tabs -> am-quick-prompts`。
- [x] 3. 收敛 tabs 字号与尺寸，更新灰底为半透明玻璃质感。
  - 摘要：active tab 字号降至 `13px`，容器改为半透明灰色渐变 + 轻边框 + blur 背景。
- [x] 4. 构建与关键回归验证，确认功能无回归。
  - 摘要：`node scripts/build.mjs`、`node --test tests/magic-report-crowd-matrix.test.mjs` 全通过；chrome-devtools MCP 实页确认 header-main 在顶部、tabs 字号与质感生效。
- [x] 5. 追加结果复盘与风险说明。
  - 摘要：本次仍为纯 UI 微调，不涉及逻辑与接口，回归风险低。

## 结果复盘
- 交付结果：`am-magic-header-main` 已回到最上方；`am-magic-view-tabs` 字号变小，且灰底改为透明质感。
- 影响范围：`src/main-assistant/magic-report.js` 与构建产物（`dist`、根 userscript）。
- 风险说明：透明度与 blur 受页面渲染环境影响会有轻微视觉差异，但功能行为不受影响。

---

# TODO - 2026-03-22 人群计划信息与 tabs 同行对齐（用户修正）

## 需求规格
- 目标：将 `#am-crowd-matrix-campaign` 放到 `#am-magic-view-tabs` 右侧。
- 视觉：与 tabs 保持统一的半透明质感风格。
- 行为：不改变看板加载逻辑；仅在人群看板视图展示计划信息。

## 执行计划（含校验）
- [x] 1. 定位结构与样式改造点，确认最小改动路径。
  - 摘要：将 campaign 节点从 `.am-magic-content-matrix` 移至 header 内，与 tabs 组成同一行容器。
- [x] 2. 调整 DOM 结构并更新样式，实现“tabs 左 + campaign 右”。
  - 摘要：新增 `.am-magic-view-meta` 容器；tabs 与 campaign 同行，campaign 右对齐并统一玻璃灰风格。
- [x] 3. 更新视图切换展示逻辑，保证 query 视图隐藏 campaign 信息。
  - 摘要：`switchMagicView` 新增 `matrixCampaignEl` 显隐控制（matrix 显示，query 隐藏）。
- [x] 4. 运行构建与回归，并做 chrome-devtools MCP 实页验证。
  - 摘要：`node scripts/build.mjs`、`node --check "阿里妈妈多合一助手.js"`、`node --test tests/magic-report-crowd-matrix.test.mjs` 全通过；MCP 实页确认 campaign 在 tabs 右侧且样式统一。
- [x] 5. 记录复盘和 lessons。
  - 摘要：补充“跨区域信息搬迁需同步显隐逻辑”的规则，防止 query 视图信息污染。

## 结果复盘
- 交付结果：`#am-crowd-matrix-campaign` 已移至 tabs 右侧，样式与 tabs 统一为半透明灰质感。
- 行为结果：query 视图隐藏 campaign 信息，matrix 视图显示且持续更新计划名/计划ID/商品ID。
- 风险说明：header 一行信息密度提高，极窄窗口下 campaign 文案会走省略号（已加截断）。

### 追加修正（用户反馈：需要“紧接 tabs”，非右贴边）
- 调整内容：移除 `#am-crowd-matrix-campaign` 的 `margin-left: auto;`，保持与 tabs 仅留容器 `gap` 间距。
- 验证结果：chrome-devtools MCP 实页测得 tabs 与 campaign 间距约 `10px`，符合“紧接”要求。

---

# TODO - 2026-03-22 插件滚动防穿透（用户修正）

## 需求规格
- 目标：插件内部滚动到顶/到底时，不要继续带动原网页滚动。
- 范围：主面板、万能查数弹窗、护航弹窗、并发日志弹窗、运行日志区等插件容器。
- 要求：优先最小侵入；不改变现有滚动行为，只阻断向页面链式滚动。

## 执行计划（含校验）
- [x] 1. 定位插件内滚动容器与现有样式/事件绑定点。
  - 摘要：主入口在 `src/main-assistant/ui.js`，多个区域 `overflow:auto` 但未统一防滚动穿透。
- [x] 2. 增加统一 wheel 链路守卫（捕获阶段）作为行为兜底。
  - 摘要：新增 `bindPluginScrollChainGuard + shouldBlockPluginWheel`，当插件内部无可继续滚动容器时阻断事件冒泡到页面。
- [x] 3. 为关键滚动容器补充 `overscroll-behavior: contain`。
  - 摘要：对主插件根容器、护航弹窗、并发日志体、日志区补充 CSS 防链式滚动。
- [x] 4. 构建+测试+实页验证滚动到底不再联动页面。
  - 摘要：`node scripts/build.mjs`、`node --check "阿里妈妈多合一助手.js"`、`node --test tests/logger-api.test.mjs tests/magic-report-crowd-matrix.test.mjs` 全通过；chrome-devtools MCP 实页验证 `#am-log-content` 触底滚轮 `defaultPrevented=true`，中段滚轮 `defaultPrevented=false`，符合预期。
- [x] 5. 复盘与 lessons 更新。
  - 摘要：补充“滚动防穿透默认双层保护 + 实页验证”的团队规则。

## 结果复盘
- 交付结果：插件内部滚动容器触底/触顶后不再连带滚动原网页；容器内部可滚动时仍保持正常滚动体验。
- 技术策略：`overscroll-behavior: contain`（样式层）+ `wheel capture guard`（行为兜底层）。
- 风险说明：旧浏览器对 `overscroll-behavior` 支持不完全时，仍由 wheel 守卫保证核心行为。

### 追加修正（用户反馈：按 period 第4个按钮样式）
- 调整内容：`#am-crowd-matrix-campaign` 按 `#am-crowd-matrix-global-legend > .am-crowd-matrix-legend-group-period > button:nth-child(4)` 逐项对齐（背景、边框、圆角、字号、内边距、阴影、布局）；并修正 matrix 视图展示逻辑为清空内联 `display`，避免覆盖 CSS 的 `display:flex`。
- 校验结果：chrome-devtools MCP 实页比对，target 与 campaign 的关键计算样式一致。

---

# TODO - 2026-03-22 tabs 背景同源与 campaign 下对齐（用户修正）

## 需求规格
- 目标1：`#am-magic-view-tabs` 的背景与 `#am-crowd-matrix-grid > div > div.am-crowd-matrix-cell.am-crowd-matrix-header.am-crowd-matrix-corner` 保持一致。
- 目标2：`#am-crowd-matrix-campaign` 与 `#am-magic-view-tabs` 下边缘对齐。

## 执行计划（含校验）
- [x] 1. 对齐 tabs 背景到 corner 的同款渐变值。
  - 摘要：tabs 容器背景统一为 `linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(245, 250, 255, 0.85))`。
- [x] 2. 调整 tabs+campaign 容器纵向对齐方式。
  - 摘要：`.am-magic-view-meta` 使用 `align-items: flex-end`，确保两者底部同一基线。
- [x] 3. 构建与回归校验。
  - 摘要：`node scripts/build.mjs`、`node --test tests/magic-report-crowd-matrix.test.mjs` 通过。
- [x] 4. chrome-devtools MCP 实页校验计算样式与几何对齐。
  - 摘要：`tabsBackgroundImage` 与 `cornerBackgroundImage` 相同；`tabsBottom=95`、`campaignBottom=95`，`bottomAligned=true`。

## 结果复盘
- 交付结果：tabs 背景已与 corner 背景同源，campaign 与 tabs 已下对齐。
- 风险说明：该修正仅涉及样式参数和 flex 对齐，不影响视图切换与数据逻辑。

---

# TODO - 2026-03-22 批量建计划参数缺失问题全面调查

## 需求规格
- 目标问题：排查“批量建立计划项目”链路中是否存在建立计划参数缺失、参数错误、场景映射偏差、请求裁剪异常或测试覆盖不足的问题。
- 交付物：形成 `Report.md`，给出问题清单、代码证据、影响范围、风险判断与建议优先级。
- 调查范围：`src/optimizer/keyword-plan-api/` 主链路、桥接导出、向导草稿/场景设置同步、相关回归测试、近期相关提交。
- 调查方式：主线程整合 + 不少于 5 个子代理并行调查；必要时补充本地只读验证。
- 本次约束：以调查与报告为主，不在未确认根因前直接改逻辑。

## 执行计划（含校验）
- [x] 1. 复盘历史 lessons 并锁定本次调查入口文件。
  - 摘要：已回顾 `tasks/lessons.md`，本次坚持“先证据后结论”；入口先锁定 `component-config.js`（批量草稿/向导）、`search-and-draft.js`（normalize/build/create 主链路）、`scene-spec.js`（目标与场景解析）、`runtime.js`（运行时契约/能力）。
- [x] 2. 启动至少 5 个子代理并行调查不同维度。
  - 摘要：计划启动 6 个子代理，分别覆盖入口与草稿来源、normalize/默认兜底、场景目标映射、payload 构造与裁剪、测试覆盖缺口、近期提交回归风险。
- [x] 3. 主线程交叉阅读关键实现并核对子代理结论。
  - 摘要：已补读 `request-builder-preview.js`、`create-and-suggest.js`、`search-and-draft.js`、`scene-spec.js`，确认问题不是单点缺参，而是“回退默认值 + 静默过滤 + payload prune”三类机制叠加。
- [x] 4. 运行必要的本地只读验证。
  - 摘要：已运行 `node --test tests/keyword-create-repair-item-binding-guard.test.mjs tests/site-scene-item-binding.test.mjs tests/site-scene-submit-mode.test.mjs tests/keyword-edit-request-scene-settings-sync.test.mjs tests/matrix-plan-config.test.mjs`，41 项通过；同时核对高风险提交 `af1c1a3/859f7fc/97a9d1c/c591f1c/edde912/d6555a7/586ca0d` 的变更主题。
- [x] 5. 生成 `Report.md` 并回填 `tasks/todo.md` 结果复盘。
  - 摘要：已生成 `Report.md`，包含参数来源链路、P0/P1 发现、历史回归窗口、测试现状与修复优先级；并补充 `tasks/batch-plan-investigation-notes.md` 作为调查笔记。

## 当前进度
- 当前阶段：调查完成，已进入结果归档。
- 已完成动作：6 个子代理并行调查（5 个正常收敛，1 个超时后由主线程补读入口链路补齐）；主线程完成代码交叉核对、测试验证、历史提交回溯与报告落盘。
- 已确认主因：`marketingGoal` 过强回退、`normalizePlans` 静默吞掉缺商品 plan、`buildSolutionFromPlan`/template capability prune 二次删改字段、线索推广默认 `planId/planTemplateId/packageTemplateId` 掩盖真实缺参来源。

## 结果复盘
- 交付结果：已生成 `Report.md`，可直接作为后续修复任务的需求与证据输入。
- 核心结论：当前“批量建立计划参数缺失/错误”更像结构性风险，而不是单个参数点漏传；主要集中在目标回退、计划过滤、场景裁剪三条链路。
- 验证结果：相关 41 项测试通过，但现有测试主要覆盖源码契约，不足以证明多计划行为级 payload 正确。
- 风险说明：若直接改逻辑而不先补行为级测试，极易把“被吞掉的参数问题”修成另一类静默问题。
- 建议下一步：优先补 `createPlansBatch/normalizePlans/buildSolutionFromPlan` 的多计划行为测试，再做最小修复。

---

# TODO - 2026-03-22 批量建计划参数缺失修复（继续）

## 需求规格
- 目标：基于 `Report.md` 的调查结论，先修复最明确的 P0 行为问题，并补充对应行为级回归测试。
- 优先级：
  - P0-1：`normalizePlans` 识别 `plan.materialId`，避免合法商品参数被误判为缺失。
  - P0-2：plan 级 `goalWarnings` 进入最终结果，避免批量异常只出现在进度事件里。
- 约束：保持最小侵入，不重写整条建计划链路；先补测试，再改逻辑。
- 验证：至少覆盖新行为测试、目标模块相关回归测试、构建同步检查。

## 执行计划（含校验）
- [x] 1. 复读关键实现与现有测试，确认最小修复边界。
  - 摘要：复读 `create-and-suggest.js`、`search-and-draft.js`、`keyword-create-repair-item-binding-guard.test.mjs`、`site-scene-submit-mode.test.mjs`，确认首批只修 `plan.materialId` 和 `goalWarnings` 汇总两个 P0 点。
- [x] 2. 新增行为级测试，先复现当前缺陷。
  - 摘要：新增 `tests/keyword-create-goal-warning-merge.test.mjs`；并在 `tests/keyword-create-repair-item-binding-guard.test.mjs` 通过提取 `normalizePlans` 的方式补了 `plan.materialId` 行为测试。
- [x] 3. 实施最小修复。
  - 摘要：`search-and-draft.js` 支持 `plan.materialId -> plan.item`；`create-and-suggest.js` 新增 `mergeGoalWarnings`，并同步放宽 `validate` / `hasPlansWithoutItem` 对 `plan.materialId` 的识别。
- [x] 4. 运行回归与构建验证。
  - 摘要：`node scripts/build.mjs`、`node scripts/build.mjs --check`、`node --check "阿里妈妈多合一助手.js"`、`node --test tests/keyword-create-repair-item-binding-guard.test.mjs tests/keyword-create-goal-warning-merge.test.mjs tests/site-scene-submit-mode.test.mjs`、`node --test tests/site-scene-item-binding.test.mjs` 全部通过。
- [x] 5. 回填结果复盘与风险说明。
  - 摘要：已记录本次修复范围、验证命令与剩余风险；后续再继续处理报告里的更深层 `marketingGoal` 回退和 payload prune 问题。

## 结果复盘
- 交付结果：批量建计划现在会识别 `plan.materialId`，不会再把合法计划静默过滤；最终结果 `goalWarnings` 也会合并请求级和计划级告警，便于排查批量异常。
- 影响范围：`src/optimizer/keyword-plan-api/search-and-draft.js`、`src/optimizer/keyword-plan-api/create-and-suggest.js`、`tests/keyword-create-repair-item-binding-guard.test.mjs`、`tests/keyword-create-goal-warning-merge.test.mjs` 以及构建产物（根 userscript、`dist/packages/alimama-helper-pro.user.js`、`dist/extension/page.bundle.js`）。
- 验证结果：定向构建、bundle 同步检查、根脚本语法检查、商品绑定相关回归、场景提交相关回归全部通过。
- 风险说明：本次没有处理 `Report.md` 中更深层的 `marketingGoal` 过强回退、template capability prune 二次删字段等问题；这些仍需后续单独补行为测试后再修。

---

# TODO - 2026-03-22 批量建计划 marketingGoal 模糊匹配可观测性修复（继续）

## 需求规格
- 目标：修复 `marketingGoal` 模糊匹配被视为“正常命中”的观测偏差，避免错配目标被静默吞掉。
- 范围：仅调整 `resolveGoalSpecForScene` 的 fuzzy 分支行为；不改 create contract 映射与 endpoint 决策主逻辑。
- 期望行为：
  - fuzzy 命中时输出显式 warning；
  - fuzzy 命中时 `goalFallbackUsed=true`，让日志和结果反映“非精确命中”；
  - exact 命中行为保持不变。
- 验证：新增行为测试 + 关键回归 + 构建同步检查。

## 执行计划（含校验）
- [x] 1. 复读 `scene-spec.js` 目标解析逻辑并锁定最小改动点。
  - 摘要：确认仅改 `resolveGoalSpecForScene` 的 fuzzy 分支，避免影响 default/exact/未命中回退分支。
- [x] 2. 新增行为级测试，覆盖 fuzzy 与 exact 两条路径。
  - 摘要：新增 `tests/goal-resolution-fuzzy-fallback.test.mjs`，验证 fuzzy 下 `goalFallbackUsed=true` 且输出“模糊匹配”告警，exact 下 `goalFallbackUsed=false` 且无 warning。
- [x] 3. 实施最小修复并同步日志语义。
  - 摘要：`scene-spec.js` fuzzy 分支新增显式 warning，并把 `goalFallbackUsed` 从 `false` 调整为 `true`，让结果与日志可观测“非精确命中”。
- [x] 4. 运行回归与构建验证。
  - 摘要：`node scripts/build.mjs`、`node --test tests/goal-resolution-fuzzy-fallback.test.mjs tests/keyword-create-goal-warning-merge.test.mjs tests/site-scene-submit-mode.test.mjs`、`node scripts/build.mjs --check`、`node --check "阿里妈妈多合一助手.js"` 全部通过。
- [x] 5. 回填结果复盘与风险说明。
  - 摘要：已记录修复边界、验证结果与剩余风险；后续继续推进 payload prune 行为快照测试。

## 结果复盘
- 交付结果：`marketingGoal` 的 fuzzy 命中不再被当成“正常命中”，现在会显式告警并标记为 fallback，避免错配目标被静默吞掉。
- 影响范围：`src/optimizer/keyword-plan-api/scene-spec.js`、`tests/goal-resolution-fuzzy-fallback.test.mjs`，以及构建产物（根 userscript、`dist/packages/alimama-helper-pro.user.js`、`dist/extension/page.bundle.js`）。
- 验证结果：新增行为测试、既有目标告警测试与场景提交流程契约测试均通过；构建同步检查和根脚本语法检查通过。
- 风险说明：本次只提升“模糊命中可观测性”，并未改变 fuzzy 命中后继续使用该目标的策略；若需要“严格仅精确匹配”，需新增 strict 模式并补充兼容验证。

---

# TODO - 2026-03-22 批量建计划缺商品计划失败可见化修复（继续）

## 需求规格
- 目标：消除 `normalizePlans` 对缺商品计划的静默吞掉行为，让被过滤计划进入 `createPlansBatch.failures`。
- 范围：`normalizePlans` 增加 drop 回调，`createPlansBatch` 接收并转成失败明细；不改现有 plan 归一逻辑和提交主流程。
- 期望行为：

---

# TODO - 2026-03-23 Report.md payload 快照测试覆盖检查

## 需求规格
- 目标：检查当前测试是否覆盖 `Report.md` 建议中的“最终 payload 快照验证”四类项。
- 检查项：
  - 关键词白名单裁剪
  - 非关键词 `template/capability prune`
  - `itemIdList` 二次重写
  - 线索推广模板参数（`planId/planTemplateId/packageTemplateId/orderInfo`）
- 交付物：指出现有覆盖与缺口，并给出最小可落地测试方案（建议新增 test 文件、断言点）。
- 约束：不修改业务代码与测试代码；仅做只读分析与任务记录。

## 执行计划（含校验）
- [x] 1. 回顾 `tasks/lessons.md` 与 `Report.md`，锁定本次检查范围。
  - 摘要：已确认本次只核对 `Report.md` 第 5 条 payload snapshot 建议，不扩展到其他修复项。
- [x] 2. 检索并阅读现有相关测试，区分静态契约与行为级覆盖。
  - 摘要：已核对 `tests/site-scene-item-binding.test.mjs`、`tests/keyword-create-explicit-field-preserve.test.mjs`、`tests/lead-scene-template-id-guard.test.mjs`、`tests/keyword-custom-mode-wordpackage.test.mjs`、`tests/keyword-custom-settings-sync.test.mjs`、`tests/keyword-create-repair-item-binding-guard.test.mjs`、`tests/keyword-create-goal-warning-merge.test.mjs`、`tests/goal-resolution-fuzzy-fallback.test.mjs`。

---

# TODO - 2026-03-23 search-and-draft 最新改动代码审查

## 需求规格
- 目标文件：`src/optimizer/keyword-plan-api/search-and-draft.js`
- 审查范围1：`applyOverrides` 的合并顺序调整，重点关注 `common.passthrough`、`campaignOverride`、`rawOverrides` 的优先级副作用。
- 审查范围2：`resolveLeadTemplateTriplet` 新逻辑及其在线索推广 payload 组装中的消费路径。
- 输出要求：仅输出潜在回归风险（最多 5 条）与“是否需要补丁”的判断；不修改业务代码。

## 执行计划（含校验）
- [x] 1. 回顾 `tasks/lessons.md`、定位目标 diff，并锁定本次只读审查边界。
  - 摘要：已确认本次不扩展到 `create-and-suggest.js` 等其他改动，只围绕 `search-and-draft.js` 的两个指定点审查。
- [ ] 2. 对比新旧实现与调用点，确认行为差异是否真实可触发。
  - 摘要：重点核对 `applyOverrides -> buildSolutionFromPlan` 与 `resolveLeadTemplateTriplet -> 线索推广 orderInfo` 两条链路。
- [ ] 3. 阅读新增测试，判断覆盖是否足以兜住主要回归面。
  - 摘要：重点检查 `tests/keyword-build-solution-payload-behavior.test.mjs` 与既有线索推广 guard 测试。
- [ ] 4. 输出风险结论与是否建议补丁，并回填结果复盘。
  - 摘要：按代码评审格式给出最多 5 条风险，按严重度排序，附文件/行号引用。
- [x] 3. 归纳覆盖缺口并制定最小新增测试方案。
  - 摘要：已确认四类建议项都缺少“执行后最终 payload 快照”断言，现有命中主要是源码结构断言和局部 helper 行为测试。
- [x] 4. 回填结果复盘，准备对外输出。
  - 摘要：结论已整理为覆盖矩阵、缺口说明和最小文件建议。

## 结果复盘
- 核心结论：当前测试对四类项均只有“部分静态契约覆盖”，没有一项真正覆盖到 `buildSolutionFromPlan` 产出的最终 payload 快照层。
- 现状判断：仓库已有通过 `Function(...)` 抽取单函数做行为测试的模式，可沿用该模式补 payload snapshot 测试，不需要先引入新测试框架。
- 风险说明：如果继续只保留正则契约测试，最容易漏掉的是“merge 后又被 prune/重写”的回归，这正是 `Report.md` 指出的风险面。
  - 需要商品场景下，缺商品且无法补齐的 plan 会被记录为失败项；
  - 若全部 plan 被过滤，返回明确失败明细而非单条泛化错误；
  - 与已有 prebuild 失败合并，不丢原始错误信息。
- 验证：行为测试 + createPlansBatch 接入测试 + 构建同步检查。

## 执行计划（含校验）
- [x] 1. 复读 `normalizePlans` 与 `createPlansBatch`，锁定最小改动点。
  - 摘要：确认仅新增 drop 上报通道，不改变 `normalizePlans` 返回类型，不重写提交流程。
- [x] 2. 补测试先描述目标行为。
  - 摘要：新增 `tests/keyword-create-normalize-drop-failures.test.mjs`；并在 `tests/keyword-create-repair-item-binding-guard.test.mjs` 增加 `onDroppedPlan` 行为测试。
- [x] 3. 实施最小修复。
  - 摘要：`normalizePlans` 新增 `onDroppedPlan` 回调并在缺商品过滤时上报；`createPlansBatch` 接入上报结果并合并到失败明细，全部 plan 被过滤时返回明确 failures。
- [x] 4. 运行回归与构建验证。
  - 摘要：`node scripts/build.mjs`、`node --test tests/keyword-create-repair-item-binding-guard.test.mjs tests/keyword-create-normalize-drop-failures.test.mjs tests/keyword-create-goal-warning-merge.test.mjs tests/goal-resolution-fuzzy-fallback.test.mjs tests/site-scene-submit-mode.test.mjs`、`node scripts/build.mjs --check`、`node --check "阿里妈妈多合一助手.js"` 全部通过。
- [x] 5. 回填结果复盘与风险说明。
  - 摘要：已记录行为变化与兼容边界；后续仍需覆盖 payload prune 行为快照。

## 结果复盘
- 交付结果：缺商品且无法补齐的计划不再被静默吞掉，会进入 `createPlansBatch.failures`；若全部计划被过滤，返回明确失败列表而不是单条泛化错误。
- 影响范围：`src/optimizer/keyword-plan-api/search-and-draft.js`、`src/optimizer/keyword-plan-api/create-and-suggest.js`、`tests/keyword-create-repair-item-binding-guard.test.mjs`、`tests/keyword-create-normalize-drop-failures.test.mjs`，以及构建产物（根 userscript、`dist/packages/alimama-helper-pro.user.js`、`dist/extension/page.bundle.js`）。
- 验证结果：新增测试与相关关键回归全部通过；构建同步检查和根脚本语法检查通过。
- 风险说明：本次只解决“被过滤计划可见化”，未改变“缺商品计划默认过滤”的策略；如需改为“保留并走构建失败”，需单独评估对批量提交流程的影响。

---

# TODO - 2026-03-22 批量建计划 marketingGoal 严格匹配模式（继续）

## 需求规格
- 目标：新增可选严格模式，避免 `marketingGoal` fallback（含模糊命中）后继续提交。
- 范围：仅改 `createPlansBatch` 目标解析后的决策逻辑；默认行为保持不变。
- 期望行为：
  - 当 `strictGoalMatch=true` 且任意 plan 目标解析触发 fallback 时，直接返回失败，不进入提交；
  - 失败项包含 `planName/item/marketingGoal/submitEndpoint/error`，便于定位；
  - 默认 `strictGoalMatch=false` 时行为与现状一致。
- 验证：新增严格模式接入测试 + 既有关键回归 + 构建同步检查。

## 执行计划（含校验）
- [x] 1. 复读 `createPlansBatch` 目标解析链路，锁定最小接入点。
  - 摘要：确认在 plan 级目标解析后即可复用 `goalContext.goalFallbackUsed` 做严格拦截，无需修改 scene-spec 规则。
- [x] 2. 新增测试描述严格模式行为。
  - 摘要：新增 `tests/keyword-create-strict-goal-match.test.mjs`，覆盖 strict 开关接入、fallback 失败聚合、提前返回分支与结果标记。
- [x] 3. 实施最小修复。
  - 摘要：`createPlansBatch` 新增 `strictGoalMatch` 归一化和 `strictGoalFailures` 聚合；当 strict 开启且 plan 触发 fallback 时，直接返回失败并附可用目标提示。
- [x] 4. 运行回归与构建验证。
  - 摘要：`node scripts/build.mjs`、`node --test tests/keyword-create-strict-goal-match.test.mjs tests/keyword-create-repair-item-binding-guard.test.mjs tests/keyword-create-normalize-drop-failures.test.mjs tests/keyword-create-goal-warning-merge.test.mjs tests/goal-resolution-fuzzy-fallback.test.mjs tests/site-scene-submit-mode.test.mjs`、`node scripts/build.mjs --check`、`node --check "阿里妈妈多合一助手.js"` 全部通过。
- [x] 5. 回填结果复盘与风险说明。
  - 摘要：已记录兼容边界与风险；默认行为保持不变，仅 strict 开启时生效。

## 结果复盘
- 交付结果：新增可选 `strictGoalMatch` 模式；开启后任意 plan 目标解析触发 fallback（含模糊命中）会直接失败返回，不再继续提交。
- 影响范围：`src/optimizer/keyword-plan-api/create-and-suggest.js`、`tests/keyword-create-strict-goal-match.test.mjs`，以及构建产物（根 userscript、`dist/packages/alimama-helper-pro.user.js`、`dist/extension/page.bundle.js`）。
- 验证结果：严格模式新增测试与相关关键回归全部通过；构建同步检查与根脚本语法检查通过。
- 风险说明：严格模式为显式开关，默认关闭；启用后会把原先可自动回退成功的请求转为失败，调用方需按需启用并处理失败返回。

---

# TODO - 2026-03-22 批量建计划剩余问题收敛修复（继续）

## 需求规格
- 目标：继续按 `Report.md` 收敛剩余高风险项：`planCount` 语义、线索推广模板 ID 硬编码兜底、显式字段被 prune 误删。
- 范围：仅对 `search-and-draft.js` 做最小修改，保持调用协议不变；补充对应行为/契约测试。
- 要求：
  - `planCount` 在自动建计划场景对 `preferredItems` 生效为上限；
  - 线索推广去掉 `308/74` 硬编码兜底，缺参 fail-fast；
  - 显式 `itemIdList/bidTargetV2/optimizeTarget` 不被兜底裁剪误删。

## 执行计划（含校验）
- [x] 1. 建立不少于 3 个 AGENTS 并行分析修复方案。
  - 摘要：3 个 AGENTS 分别分析 `planCount`、线索模板 ID、prune 误删字段，并输出最小改动建议与测试清单。
- [x] 2. 实施 `planCount` 语义修复。
  - 摘要：`normalizePlans` 在自动建计划场景下统一解析 `requestedPlanCount`；`preferredItems` 存在时按上限切片，不再无视 `planCount`。
- [x] 3. 实施线索推广模板参数 fail-fast 修复。
  - 摘要：移除 `308/74` 硬编码默认值；仅使用 request/orderInfo/runtime 的合法 ID，缺失时抛出“线索推广缺少关键模板参数”错误。
- [x] 4. 实施显式字段保留修复并补测试。
  - 摘要：`itemIdList` 删除分支增加显式字段保护；`bidTargetV2/optimizeTarget` 在兜底裁剪分支增加显式字段保护；新增对应测试。
- [x] 5. 运行回归与构建验证，并回填结果。
  - 摘要：`node scripts/build.mjs`、定向 27 测试、`node scripts/build.mjs --check`、`node --check "阿里妈妈多合一助手.js"` 全部通过。

## 结果复盘
- 交付结果：`planCount` 行为统一、线索模板 ID 不再硬编码掩盖缺参、显式关键字段不再被误删。
- 影响范围：`src/optimizer/keyword-plan-api/search-and-draft.js`、`tests/keyword-create-repair-item-binding-guard.test.mjs`、`tests/lead-scene-template-id-guard.test.mjs`、`tests/keyword-create-explicit-field-preserve.test.mjs`，以及构建产物（根 userscript、`dist/packages/alimama-helper-pro.user.js`、`dist/extension/page.bundle.js`）。
- 验证结果：27 项相关回归全部通过，构建同步与语法检查通过。
- 风险说明：本次修复不改变主调用协议；线索推广在缺模板参数时会更早失败，调用方需处理更明确的失败返回。

---

# TODO - 2026-03-23 Report.md 全量发现状态核对

## 需求规格
- 目标：核对 `Report.md` 的全部核心发现，基于当前代码与测试判断“已修复 / 未修复 / 部分修复”。
- 输出要求：给出精简矩阵，并为每条结论保留代码/测试证据文件与行号范围。
- 约束：不修改业务代码；仅允许只读核对、运行定向测试，并把结论归档到任务文档。

## 执行计划（含校验）
- [x] 1. 回顾 `tasks/lessons.md`、`Report.md` 与现有修复记录，明确逐条核对口径。
  - 摘要：按 `Report.md` 的 8 条核心发现逐条核对，不把“新增观测/保护”误判成“根因已消失”。
- [x] 2. 逐条回到当前源码取证，确认后续修复是否覆盖原始风险。
  - 摘要：重点核对 `scene-spec.js`、`create-and-suggest.js`、`search-and-draft.js` 的当前实现和写回/裁剪/失败明细行为。
- [x] 3. 运行定向测试，验证代码状态与新增保护是否真实存在。
  - 摘要：执行 9 个测试文件共 31 项用例，覆盖 fuzzy fallback、strictGoalMatch、goalWarnings 汇总、缺商品失败明细、planCount、线索模板 ID、防误删字段、全站商品绑定与提交模式。
- [x] 4. 归档核对结果并准备对外矩阵输出。
  - 摘要：结论为“已修复 3 项、部分修复 5 项、未修复 0 项”；剩余风险主要集中在默认 fallback、宽松 fuzzy、request 级商品批量回填、以及缺少最终 payload 快照/多计划隔离测试。

## 结果复盘
- 交付结果：已完成 `Report.md` 全量发现核对，并形成当前状态判断：`已修复` 3 项（`planCount`、线索模板 ID 硬编码、最终结果 `goalWarnings` 聚合），`部分修复` 5 项（`marketingGoal` 默认回退、fuzzy 过宽、缺商品 plan 处理、payload prune、测试覆盖缺口）。
- 验证结果：`node --test tests/goal-resolution-fuzzy-fallback.test.mjs tests/keyword-create-goal-warning-merge.test.mjs tests/keyword-create-strict-goal-match.test.mjs tests/keyword-create-repair-item-binding-guard.test.mjs tests/keyword-create-normalize-drop-failures.test.mjs tests/lead-scene-template-id-guard.test.mjs tests/keyword-create-explicit-field-preserve.test.mjs tests/site-scene-item-binding.test.mjs tests/site-scene-submit-mode.test.mjs` 31 项全部通过。
- 风险说明：当前多数剩余问题已从“静默”变成“可观测或可选严格失败”，但默认行为仍保留原先的宽松兼容策略，因此不能判定为完全消失。
# TODO - 2026-03-23 多计划 request/common/plan 与模板参数风险复查

## 需求规格
- 目标：基于当前 `src/` 与 `tests/`，复查三类风险是否仍存在，并给出剩余风险与建议修复点。
- 风险范围：
  - 多计划场景下 `request/common/plan` 覆盖优先级是否仍有歧义或回归风险。
  - `planId` / `planTemplateId` 请求构造是否仍存在缺参、错参或来源污染风险。
  - `planNamePrefix` / `planCount` 自动扩展链路是否仍存在行为偏差或覆盖盲区。
- 交付约束：只读审查，不修改业务代码；结论必须以当前源码与测试证据为依据。
- 验证要求：同时核对实现与测试，不以“已有测试”替代真实代码链路确认。

## 执行计划（含校验）
- [ ] 1. 回顾历史调查结论与当前入口文件，锁定审查边界。
  - 摘要：重点审查 `search-and-draft.js`、`create-and-suggest.js`、`request-builder-preview.js` 与相关 tests。
- [ ] 2. 阅读 `src/` 中与三类风险直接相关的实现，确认当前真实行为。
  - 摘要：重点核对 merge 顺序、lead 模板参数来源、自动生成 plans 的前缀与数量逻辑。
- [ ] 3. 阅读 `tests/` 中对应回归测试，标注已覆盖行为与缺口。
  - 摘要：确认现有测试是否覆盖多计划、跨 plan 差异、负向场景与组合场景。
- [ ] 4. 汇总结论，区分“已修复/已收敛”和“剩余风险/建议修复点”。
  - 摘要：只给可证据化结论，避免基于猜测扩大范围。
- [ ] 5. 回填结果复盘并输出最终审查结论。
  - 摘要：在 `tasks/todo.md` 记录复盘、验证状态与后续建议。

---

# TODO - 2026-03-23 Report.md 剩余可修复项复核（只读）

## 需求规格
- 目标：重新对照 `Report.md`，基于当前已改源码与测试，识别“明确可修复且尚未修复”的剩余项。
- 输出约束：只做只读分析，不改业务代码；结论需区分“问题本体仍在”与“仅新增了观测/严格开关”。
- 交付要求：给出不超过 5 条最小后续动作，并保留源码/测试证据。

## 执行计划（含校验）
- [x] 1. 回顾 `Report.md`、`tasks/todo.md` 和 `tasks/lessons.md`，确认逐项核对口径。
  - 摘要：继续沿用 `Report.md` 的 8 条核心发现口径，不把“加 warning / 加 strict 开关”误判为根因已消失。
- [x] 2. 复核当前源码，确认哪些默认行为仍保留原风险。
  - 摘要：重点复核 `scene-spec.js` 的默认/fuzzy 目标解析，`create-and-suggest.js` 的 request/plan 级回写，`search-and-draft.js` 的 request 商品回填、payload prune 与线索模板参数逻辑。
- [x] 3. 复核当前测试，确认新增测试是否覆盖到最终行为层。
  - 摘要：执行 10 个测试文件 36 项用例，全部通过；但 `keyword-build-solution-payload-behavior.test.mjs` 仍以函数抽取/源码分支断言为主，不是最终 payload 快照。
- [x] 4. 归纳“明确可修复且尚未修复”的剩余项，并压缩成最小动作。
  - 摘要：剩余项集中在默认宽松兼容仍存在的 4 个面：目标默认回退、fuzzy 过宽、request 级商品批量回填、多计划/最终 payload 行为级快照覆盖缺口。
- [x] 5. 回填复盘与验证状态。
  - 摘要：本次未改业务代码，仅完成只读复核、证据整理与定向测试验证。

## 结果复盘
- 结论：当前代码已修掉或明显收敛了 `plan.materialId`、plan 过滤可见化、`goalWarnings` 汇总、`planCount`、线索模板 ID 硬编码、显式字段误删等问题；但仍有 4 类“明确可修复且尚未修复”的剩余项。
- 剩余项 1：`marketingGoal` 默认仍会回退并回写 request/plan，而不是默认失败。
  - 证据：`scene-spec.js` 仍在缺失或未命中时回退默认目标（`src/optimizer/keyword-plan-api/scene-spec.js:3760-3800`）；`create-and-suggest.js` 仍把解析后的目标回写到 request 与 plan（`src/optimizer/keyword-plan-api/create-and-suggest.js:510-518`、`src/optimizer/keyword-plan-api/create-and-suggest.js:754-767`）。
- 剩余项 2：fuzzy 目标匹配仍然过宽，只是现在变成“有 warning 的 fallback”。
  - 证据：当前仍使用 `includes` 做子串匹配（`src/optimizer/keyword-plan-api/scene-spec.js:3784-3793`）；`strictGoalMatch` 只是可选开关，默认关闭（`src/optimizer/keyword-plan-api/create-and-suggest.js:349-350`、`src/optimizer/keyword-plan-api/create-and-suggest.js:721-796`）。
- 剩余项 3：缺商品计划虽不再静默吞掉，但 request 级 `itemId/materialId` 仍会批量回填到每个缺商品 plan，仍可能造成“多 plan 绑同一商品”。
  - 证据：`normalizePlans` 仍保留 `fallbackRequestItemId -> normalized.item` 的批量回填分支（`src/optimizer/keyword-plan-api/search-and-draft.js:2285-2291`）；当前新增测试只覆盖“会补齐”和“会把无法补齐的计划记为 failure”，未覆盖“多 plan 缺商品时禁止共享同一 request 商品”。
- 剩余项 4：payload prune 风险只做了局部保护，仍缺最终 payload 快照和多计划隔离验证。
  - 证据：`buildSolutionFromPlan` 仍存在大量非关键词模板/能力裁剪逻辑（`src/optimizer/keyword-plan-api/search-and-draft.js:4000-4045` 及其后续 optional keys/prune 分支）；`tests/keyword-build-solution-payload-behavior.test.mjs` 当前主要验证函数片段与源码分支存在性，不是“给定 request/plan 后断言最终 payload”的快照级测试。
- 验证结果：`node --test tests/goal-resolution-fuzzy-fallback.test.mjs tests/keyword-create-goal-warning-merge.test.mjs tests/keyword-create-strict-goal-match.test.mjs tests/keyword-create-repair-item-binding-guard.test.mjs tests/keyword-create-normalize-drop-failures.test.mjs tests/lead-scene-template-id-guard.test.mjs tests/keyword-create-explicit-field-preserve.test.mjs tests/site-scene-item-binding.test.mjs tests/site-scene-submit-mode.test.mjs tests/keyword-build-solution-payload-behavior.test.mjs` 共 36 项全部通过。
- 风险说明：当前剩余问题大多已从“静默错误”收敛成“默认宽松兼容 + 可观测/可选严格模式”，因此不属于阻塞一切的未知风险，但仍是明确、可继续收口的修复项。

---

# TODO - 2026-03-23 Report.md 剩余默认宽松行为收敛修复（继续）

## 需求规格
- 目标：收敛 `Report.md` 中仍未闭环的 3 条默认宽松行为，并补充对应回归测试。
- 修复范围：
  - `strictGoalMatch` 默认策略从“默认关闭”收敛为“默认开启，可显式关闭”。
  - `marketingGoal` fuzzy 匹配改为默认关闭，仅在显式 `allowFuzzyGoalMatch=true` 时启用。
  - `normalizePlans` 禁止多计划场景用同一个 `request.itemId/materialId` 批量回填。
- 约束：保持最小侵入，不改 API 名称；通过开关保留必要兼容退路。

## 执行计划（含校验）
- [x] 1. 继续建立不少于 3 个 AGENTS 做并行复核并锁定剩余问题。
  - 摘要：并行 AGENTS 复核确认剩余 3 条为默认宽松策略（目标回退、fuzzy、多计划商品回填）。
- [x] 2. 实施 `strictGoalMatch` 默认开启与 `allowFuzzyGoalMatch` 显式开关。
  - 摘要：`create-and-suggest.js` 改为 strict 默认开启（`!== false`），新增 `allowFuzzyGoalMatch` 入参透传与结果标记；`scene-spec.js` 仅在 `allowFuzzyMatch=true` 时执行 fuzzy。
- [x] 3. 实施多计划 request 商品回填收敛。
  - 摘要：`search-and-draft.js` 中 `request.itemId/materialId` 仅在单计划时兜底，避免多计划同商品批量回填。
- [x] 4. 补测试并同步旧断言。
  - 摘要：更新 strict/fuzzy/normalizePlans 相关测试；新增 `resolveLeadTemplateTriplet` 边界行为测试；补 `applyOverrides` 优先级行为测试。
- [x] 5. 构建与回归验证。
  - 摘要：`node scripts/build.mjs`、定向 9 文件 36 测试、`node scripts/build.mjs --check`、`node --check "阿里妈妈多合一助手.js"` 全部通过。

## 结果复盘
- 交付结果：`Report.md` 剩余的 3 条默认宽松行为已收敛为更安全默认值（strict 默认开启、fuzzy 默认关闭、多计划不再共享 request 商品兜底）。
- 影响范围：
  - `src/optimizer/keyword-plan-api/create-and-suggest.js`
  - `src/optimizer/keyword-plan-api/scene-spec.js`
  - `src/optimizer/keyword-plan-api/search-and-draft.js`
  - `tests/keyword-create-strict-goal-match.test.mjs`
  - `tests/goal-resolution-fuzzy-fallback.test.mjs`
  - `tests/keyword-create-repair-item-binding-guard.test.mjs`
  - `tests/keyword-build-solution-payload-behavior.test.mjs`
  - `tests/lead-scene-template-id-guard.test.mjs`
- 风险说明：默认行为收紧后，历史依赖“宽松自动回退”的调用会更早失败；可通过 `strictGoalMatch=false` 或 `allowFuzzyGoalMatch=true` 显式回退到兼容路径。

### 追加收口（request 级 strict 失败）
- 修复内容：`createPlansBatch` 在 `strictGoalMatch=true` 且 request 级目标解析触发 fallback 时，直接失败返回，不再继续回写和提交流程。
- 对应测试：`tests/keyword-create-strict-goal-match.test.mjs` 已新增 request 级 strict 分支断言。
- 验证状态：`node scripts/build.mjs`、定向 36 测试、`node scripts/build.mjs --check`、`node --check \"阿里妈妈多合一助手.js\"` 全通过。
- 追加修复：`allowFuzzyMatch` 在多候选命中时不再直接命中某一目标，改为回退默认目标并显式告警（已补测试）。

# TODO - 2026-03-23 createPlansBatch runtime 最小可执行测试：strictGoal plan级早退

## 需求规格
- 目标：设计并落地最小可执行 `createPlansBatch` runtime 测试（`Function + stub`），验证 `strictGoalMatch` 在 plan 级早退时返回的 `allowFuzzyGoalMatch` 与输入归一化结果一致。
- 范围：仅新增测试，不修改业务实现；复用现有源码切片测试模式。
- 约束：尽量减少 stub 依赖，避免引入额外测试框架或浏览器环境。
- 验证：运行新增测试文件并确认用例通过。

## 执行计划（含校验）
- [x] 1. 回顾 lessons 与现有 harness 模式，锁定可执行切片方案。
  - 摘要：复用 `Function(...)` + 源码切片方案，避免 regex-only 断言。
- [x] 2. 新增 runtime 测试：构造 request 级不 fallback、plan 级 fallback 的最小链路。
  - 摘要：通过 `resolveGoalContextForPlan` stub 让 `planIndex=-1` 不 fallback、`planIndex>=0` fallback，触发 `strictGoalFailures` 早退。
- [x] 3. 断言 `allowFuzzyGoalMatch` 与输入一致，并输出最小依赖清单。
  - 摘要：覆盖 options/request/default 三种输入来源，验证归一化结果。
- [x] 4. 运行定向测试并回填复盘。
  - 摘要：执行新增 runtime 测试与 strictGoal 相关定向测试集，均通过。

## 结果复盘
- 交付结果：新增 `tests/keyword-create-strict-goal-runtime.test.mjs`，以 `Function + stub` 运行时切片方式执行 `createPlansBatch`，验证 plan 级 strict 早退路径的 `allowFuzzyGoalMatch` 返回值与输入归一化一致。
- 最小依赖清单：`validate`、`isSceneLikelyRequireItem`、`mergeDeep`、`normalizeFallbackPolicy`、`REPAIR_DEFAULTS`、`isPlainObject`、`normalizeSceneSettingEntries`、`findSceneSettingEntry`、`normalizeGoalLabel`、`normalizeBidMode`、`DEFAULTS`、`normalizeSceneBizCode`、`resolveSceneBizCodeHint`、`getRuntimeDefaults`、`isRuntimeBizCodeMatched`、`normalizeGoalCreateEndpoint`、`SCENE_CREATE_ENDPOINT_FALLBACK`、`resolveGoalContextForPlan`、`buildStrictRequestGoalFailureResult`、`SCENE_BIDTYPE_V2_ONLY`、`mergeRuntimeWithGoalPatch`、`resolveSceneDefaultPromotionScene`、`resolveSceneSettingOverrides`、`SCENE_BIDTYPE_V2_DEFAULT`、`resolveSceneCapabilities`、`emitProgress`、`resolvePreferredItems`、`normalizePlans`、`buildDroppedPlanFailure`、`buildStrictGoalFailureError`、`mergeGoalWarnings`。
- 验证结果：`node --test tests/keyword-create-strict-goal-runtime.test.mjs` 与 `node --test tests/keyword-create-strict-goal-match.test.mjs tests/keyword-create-strict-goal-runtime.test.mjs` 全部通过。

# TODO - 2026-03-24 同步指定 commit cf30463 到本地

## 需求规格
- 目标：将远端提交 `cf30463fa5d1a3c9fc6eeb6bbe130516cba15d83` 同步到当前本地工作树。
- 约束：不破坏当前未提交改动；同步方式可复现、可验证。
- 验证：确认提交已可在本地 `git log`/`git show` 中查看，并给出受影响文件摘要。

## 执行计划（含校验）
- [ ] 1. 校验当前分支状态、远程可达性与目标提交存在性。
  - 摘要：待执行。
- [ ] 2. 采用安全方式将目标提交应用到当前工作树（优先 cherry-pick，必要时改为补丁三方应用）。
  - 摘要：待执行。
- [ ] 3. 验证同步结果并输出差异摘要。
  - 摘要：待执行。

# TODO - 2026-04-01 扩展授权误锁修复（shopId 识别失败）

## 需求规格
- 目标：修复 extension 运行时出现“店铺授权校验失败 / 未识别到店铺标识（shopId）”导致功能被误锁的问题。
- 背景：`LicenseGuard.assertAuthorized` 在首屏过早执行，`shopId` 尚未暴露时直接锁定；当前识别来源较窄，且无缓存兜底与重试缓冲。
- 范围：`dist/extension/page.bundle.js`、`tests/extension-license-shopid-guard.test.mjs`。
- 验收：
  - 首次未识别到 `shopId` 时，不再立即误锁；会先走短暂重试与缓存兜底。
  - 识别仍失败时才执行锁定，维持授权门禁语义。
  - 定向测试与关键构建检查通过。

## 执行计划（含校验）
- [x] 1. 扩展 `shopId` 识别来源并加入缓存兜底。
  - 摘要：补充更多全局对象候选，且在运行态未识别时允许使用有效缓存中的 `shopId` 继续校验。
- [x] 2. 增加 `shopId` 识别重试缓冲，避免首屏过早锁定。
  - 摘要：对 `shop_not_found` 增加短暂重试；仅在重试后仍失败时锁定。
- [x] 3. 新增回归测试并执行验证。
  - 摘要：新增 extension 授权门禁契约测试，并执行定向测试 + `node scripts/build.mjs --check`。

## 结果复盘
- 状态：已完成。
- 交付结果：
  - `LicenseGuard` 新增多来源 `shopId` 识别（补充 `__INITIAL_STATE__` 等全局对象、cookie、local/session storage、DOM 属性、缓存候选）。
  - `shopId` 识别新增重试链路（默认 6 次，`bootstrap_preflight` 默认提升到 8 次）并支持缓存兜底，减少首屏信息尚未就绪时的误锁。
  - `bootstrap_preflight` 在 `shopId` 缺失时改为“仅抛错不立即 lock”，避免预热阶段直接覆盖层锁死页面。
  - 新增 `tests/extension-license-shopid-guard.test.mjs` 回归断言。
- 验证命令：
  - `node --check dist/extension/page.bundle.js`
  - `node --test tests/extension-license-shopid-guard.test.mjs tests/extension-static-build.test.mjs`
  - `node scripts/build.mjs --check`
- 浏览器实测（chrome-devtools MCP）：
  - 复现旧问题：`one.alimama.com` 页面出现 `shop_not_found`，遮罩文案为“未识别到店铺标识（shopId）”。
  - 部署修复后复测：同页面可识别 `shopId=2957960066` 与 `shopName=美的洗碗机旗舰店`，无缓存强制校验也不再报 `shop_not_found`，而是进入授权请求阶段。
  - 当前剩余阻塞：授权请求地址仍为 `https://mock-license.local/v1/license/verify`，浏览器网络失败后会锁定（`reason=request_failed`），属于环境/配置问题而非 `shopId` 识别问题。

# TODO - 2026-04-01 扩展授权显示修复（shopName Unicode 中文名）

## 需求规格
- 目标：修复授权遮罩与状态对象中 `shopName` 显示为 `\uXXXX` 转义串的问题，确保展示为中文店名。
- 背景：部分来源返回了 Unicode 转义字符串（例如 `\u7F8E\u7684\u6D17\u7897\u673A\u65D7\u8230\u5E97`），现网展示可读性差。
- 范围：`dist/extension/page.bundle.js`、`tests/extension-license-shopid-guard.test.mjs`、任务文档同步。
- 验收：
  - 遮罩 `shopName` badge 显示中文（如“美的洗碗机旗舰店”），不显示 `\uXXXX`。
  - `window.__AM_LICENSE_STATE__.shopName` 为中文字符串。
  - 定向测试、构建检查与浏览器实测通过。

## 执行计划（含校验）
- [x] 1. 在授权模块补充 Unicode 转义解码并接入 `shopName` 归一化链路。
  - 摘要：新增 `decodeUnicodeEscapes`，`normalizeShopName` 统一做 `\uXXXX -> 中文` 转换。
- [x] 2. 确保展示路径和状态快照都使用归一化后的中文名。
  - 摘要：遮罩渲染 `renderOverlay` 与 `__AM_LICENSE_STATE__` 快照均走 `normalizeShopName`。
- [x] 3. 更新回归断言并执行构建/测试/浏览器复测。
  - 摘要：补充 Unicode 解码相关断言，执行 `node --check`、`node --test`、`node scripts/build.mjs --check`，并在 `one.alimama.com` 实页复测。

## 结果复盘
- 状态：已完成。
- 交付结果：
  - `shopName` 归一化新增 Unicode 解码，不再透传 `\uXXXX` 原文。
  - 授权遮罩显示与全局状态快照都输出中文店名。
  - 浏览器实测页面遮罩展示 `shopName: 美的洗碗机旗舰店`，`window.__AM_LICENSE_STATE__.shopName` 同步为中文。
- 验证命令：
  - `node --check dist/extension/page.bundle.js`
  - `node --test tests/extension-license-shopid-guard.test.mjs tests/extension-static-build.test.mjs`
  - `node scripts/build.mjs --check`
- 浏览器实测（chrome-devtools MCP）：
  - 目标页面：`https://one.alimama.com/index.html?...#!/manage/onesite`
  - 结果：`shopName` 已显示中文，`hasUnicodeEscape=false`。
  - 现存阻塞：授权仍会因 `AUTH_BASE_URL=https://mock-license.local` 请求失败进入 `reason=request_failed` 锁定，此为环境配置问题，与中文名修复无关。

# TODO - 2026-04-01 扩展授权服务地址切换到阿里云并完成浏览器回归

## 需求规格
- 目标：将 extension 授权服务地址从 `https://mock-license.local` 切换为真实可用的阿里云地址，并完成一轮基于 `chrome-devtools` MCP 的浏览器回归。
- 背景：当前授权请求会因 `.local` 地址不可达触发 `request_failed` 锁定，阻塞真实授权链路验证。
- 范围：`dist/extension/page.bundle.js`、必要测试断言、任务文档回填。
- 验收：
  - 授权请求基础地址改为可访问的阿里云函数地址；
  - 定向测试通过；
  - 真实阿里妈妈页面浏览器回归可观察到 `v1/license/verify` 请求命中新地址，且不再出现 `mock-license.local` 网络失败。

## 执行计划（含校验）
- [x] 1. 确认可用阿里云授权服务地址并固化变更点。
  - 摘要：已通过 `curl POST /v1/license/verify` 验证 `https://am-licee-server-mpbzozflkj.cn-hangzhou.fcapp.run` 可访问并返回授权 JSON。
- [x] 2. 修改 extension 授权基础地址并补充回归断言。
  - 摘要：`dist/extension/page.bundle.js` 已替换 `AUTH_BASE_URL`；`tests/extension-license-shopid-guard.test.mjs` 新增“地址已切换 + 不含 mock 域名”断言。
- [x] 3. 执行定向测试与静态检查。
  - 摘要：`node --check dist/extension/page.bundle.js` 与 `node --test tests/extension-license-shopid-guard.test.mjs tests/extension-static-build.test.mjs` 全部通过。
- [x] 4. 使用 chrome-devtools MCP 做真实页面浏览器回归。
  - 摘要：在 `one.alimama.com` 实页强制触发 `LicenseGuard.assertAuthorized({ force: true })`，抓到 `POST https://am-licee-server-mpbzozflkj.cn-hangzhou.fcapp.run/v1/license/verify`（HTTP 200，`authorized:true`）。
- [x] 5. 回填结果复盘与风险说明。
  - 摘要：已补齐测试结论、浏览器证据、残留风险与回滚方式。

## 结果复盘
- 状态：已完成。
- 交付结果：
  - `dist/extension/page.bundle.js` 的 `AUTH_BASE_URL` 已从 `https://mock-license.local` 切换为 `https://am-licee-server-mpbzozflkj.cn-hangzhou.fcapp.run`。
  - `tests/extension-license-shopid-guard.test.mjs` 新增授权地址断言，防止回退到 mock 域名。
- 验证命令：
  - `node --check dist/extension/page.bundle.js`
  - `node --test tests/extension-license-shopid-guard.test.mjs tests/extension-static-build.test.mjs`
- 浏览器回归（chrome-devtools MCP，真实页面）：
  - 页面：`https://one.alimama.com/index.html#!/manage/onesite?orderField=charge&orderBy=desc`
  - 运行态状态：`window.__AM_LICENSE_STATE__.build.authBaseUrl = https://am-licee-server-mpbzozflkj.cn-hangzhou.fcapp.run`
  - 网络请求：`POST /v1/license/verify` 命中阿里云函数域名（reqid=92，HTTP 200）
  - 响应结果：`authorized=true`，返回有效 `leaseToken/expiresAt/signature`，不再出现 `mock-license.local` 的 `request_failed`
- 残留风险与回滚：
  - 当前仓库 `src/` 构建链路不包含该授权模块，执行 `node scripts/build.mjs` 可能覆盖 `dist/extension/page.bundle.js` 的授权改动；后续需把授权模块纳入可追踪源码。
  - 若需回滚，仅需将 `AUTH_BASE_URL` 改回 `https://mock-license.local` 并复跑本节测试。

# TODO - 2026-04-01 阿里云 Tablestore ACL 修复与授权链路复测（浏览器实操）

## 需求规格
- 目标：修复 `am-license-server` 写入 Tablestore 被实例 ACL 拒绝（`OTSAuthFailed`）问题，恢复授权状态持久化与“在使用店铺”可见性。
- 范围：仅通过阿里云控制台（浏览器）调整 OTS 实例安全策略/权限相关配置，并对 FC 接口做在线复测。
- 非目标：不改动插件前端协议，不做绕过授权逻辑。

## 执行计划（含校验）
- [ ] 1. 在阿里云控制台确认 FC 最新日志仍为 ACL 拒绝，并记录当前 AccessId/错误模式。
  - 摘要：待执行。
- [ ] 2. 修正 Tablestore 实例安全策略（从无效规则改为可生效授权），确保 FC 运行身份可读写 `license_state`。
  - 摘要：待执行。
- [ ] 3. 触发 `admin/allow` + `verify` 回放请求，验证状态写入。
  - 摘要：待执行。
- [ ] 4. 回看 FC 日志与 OTS 表数据，确认不再出现 403 ACL denied。
  - 摘要：待执行。

## 结果复盘
- 状态：进行中
- 交付结果：待补充。
- 验证命令/动作：待补充。

# TODO - 2026-04-01 小万护航 Token 红色误报修复

## 需求规格
- 目标：修复“小万护航 Token 指示灯长期红色、提示 Token 未就绪”的误报问题，使其能从真实页面请求中正确提取 Token。
- 根因假设：当前 `src/optimizer/token-manager.js` 仅依赖 XHR open/send 与浅层全局变量扫描，未利用统一 Hook 管理器的 `requestHistory`；当 Token 出现在历史请求（尤其 fetch/xhr 混合链路）时无法回填。
- 范围：
  - 增强 `TokenManager.refresh()` 的 Token 提取链路（URL/body/object/hook history）。
  - 保持现有 UI 与业务流程不变，仅修复 Token 判定输入数据。
  - 补充/更新回归测试，覆盖 hook history 回填。
- 非目标：
  - 不改授权服务逻辑；
  - 不改小万护航接口协议与请求参数。

## 执行计划（含校验）
- [x] 1. 在浏览器复现并固化根因证据。
  - 摘要：已确认 `alimama-escort-helper-ui-token` 为红色且 `window.__AM_TOKENS__` 全空；同时在 Network 与 `__AM_HOOK_MANAGER__.getRequestHistory()` 中确认存在 `dynamicToken/loginPointId/csrfId`。
- [x] 2. 增强 TokenManager 的历史请求回填能力。
  - 摘要：`src/optimizer/token-manager.js` 已新增 URL/body/object 统一解析、hook history 回填（`getRequestHistory`）与 `fetch` 捕获；`refresh()` 已接入历史请求回填链路。
- [x] 3. 增加回归测试覆盖新提取链路。
  - 摘要：新增 `tests/optimizer-token-capture-history.test.mjs`，覆盖 hook history 回填、fetch/xhr 双链路捕获和 Token 指示器主动刷新逻辑。
- [x] 4. 构建 + 测试 + 浏览器复测。
  - 摘要：已执行 `node --test tests/optimizer-token-capture-history.test.mjs`、`node --test tests/optimizer-default-prompt.test.mjs tests/optimizer-escort-keyword-compat.test.mjs tests/optimizer-escort-new-flow-fallback.test.mjs`、`node scripts/build.mjs`、`node scripts/build.mjs --check`、`node --check "阿里妈妈多合一助手.js"`；浏览器复测显示 Token 指示器已转绿且 `__AM_TOKENS__` 三字段均已回填。

## 结果复盘
- 状态：已完成
- 当前结论：
  - 根因是 Token 提取链路遗漏了 hook history/fetch 场景，导致页面有 token 请求但状态未回填；
  - 修复后在真实阿里妈妈页面验证通过，`小万护航` Token 状态恢复正常。

# TODO - 2026-04-01 Code Review Findings 修复（授权守卫 / Token 容错 / MCP 脚本）

## 需求规格
- 目标：修复评审提出的 3 个问题：
  - extension bundle 丢失 `LicenseGuard` 启动块；
  - `parseAuthFromObject` 深搜对 getter 异常缺少兜底；
  - `recover-chrome-devtools-mcp.sh` 硬编码 Node 版本路径导致不可移植。
- 范围：
  - `src/entries/*` 与 `scripts/build.mjs`（从源码层恢复授权守卫并接入构建链）；
  - `src/optimizer/token-manager.js`（异常容错）；
  - `scripts/recover-chrome-devtools-mcp.sh`（PATH 解析）。
- 验收：
  - extension 产物可看到 `AUTH_BASE_URL` 与 `LicenseGuard` 定义；
  - Token 深搜逻辑遇到异常 getter 不会中断刷新；
  - MCP 修复脚本不依赖固定 `~/.nvm/.../v22.20.0` 路径。

## 执行计划（含校验）
- [x] 1. 把授权守卫迁回源码并挂入 extension 构建链。
  - 摘要：新增 `src/entries/extension-license-guard.js`，并在 `scripts/build.mjs` 的 `EXTENSION_PAGE_SEGMENTS` 注入 extension 专用 runtime 段。
- [x] 2. 修复 Token 深搜的属性访问容错。
  - 摘要：`parseAuthFromObject` 的 `obj[key]` 与 `value.accessInfo` 增加 `try/catch`，异常属性跳过不阻断整体扫描。
- [x] 3. 修复 MCP 恢复脚本路径可移植性。
  - 摘要：`MCP_BIN` 改为 `AM_CHROME_DEVTOOLS_MCP_BIN` 或 `command -v chrome-devtools-mcp` 自动解析，不再硬编码版本目录。
- [x] 4. 重建并做定向验证。
  - 摘要：执行构建、语法检查、定向测试与关键字符串检查。

## 结果复盘
- 状态：已完成
- 交付结果：
  - extension bundle 已重新包含授权守卫启动块（含 `AUTH_BASE_URL`、`LicenseGuard`、`bootstrap_preflight`）；
  - Token 深搜已具备 getter 异常防护，降低页面对象扫描中断风险；
  - MCP 修复脚本改为 PATH/环境变量驱动，跨机器可用性恢复。
- 验证命令：
  - `node scripts/build.mjs`
  - `node scripts/build.mjs --check`
  - `node --check "阿里妈妈多合一助手.js"`
  - `node --test tests/extension-license-shopid-guard.test.mjs tests/optimizer-token-capture-history.test.mjs tests/license-admin-page.test.mjs`
  - `bash -n scripts/recover-chrome-devtools-mcp.sh`
  - `rg -n "AUTH_BASE_URL|const LicenseGuard = {" dist/extension/page.bundle.js`

# TODO - 2026-04-02 店铺授权管理默认筛选导致新店铺不可见（浏览器验证闭环）

## 需求规格
- 目标：修复“新增店铺正在使用，但授权管理页默认看不到”的问题；并让新店铺默认授权 3 天，最终完成浏览器实测通过。
- 根因候选：
  - 管理页默认 `activeWithinHours=168` 导致无 `lastSeenAt` 的店铺被过滤；
  - 新店铺首次进入授权链路时未自动授予默认有效期；
  - 多实例场景下活跃数据展示依赖持久化与路由实例命中。
- 范围：
  - 调整管理页默认筛选行为（`dev/license-admin.html` 与 `services/license-server/license-admin.html` 同步）；
  - 在 `services/license-server/index.mjs` 落地“新店铺默认 3 天授权”；
  - 更新定向测试与文档说明（包含服务端说明）；
  - 通过 `chrome-devtools` MCP 执行浏览器验证并保留证据。
- 非目标：
  - 不改动授权协议与后端路由；
  - 不改动插件端业务功能。

## 执行计划（含校验）
- [x] 1. 修改管理页“最近活跃（小时）”默认值为 `0`（不默认过滤）。
  - 摘要：已将 `dev/license-admin.html` 与 `services/license-server/license-admin.html` 的 `activeWithinInput` 默认值从 `168` 改为 `0`。
- [x] 2. 更新自动化测试断言，覆盖默认筛选值。
  - 摘要：`tests/license-admin-page.test.mjs` 新增本地模板与服务端模板的 `activeWithinInput value=\"0\"` 断言。
- [x] 3. 实现“新店铺默认授权 3 天”服务端逻辑。
  - 摘要：`handleVerify` 新增 `provisionDefaultAuthForNewShop`，仅对“首次出现且未吊销”的店铺自动写入 `enabled=true` 与 `authExpiresAt=now+DEFAULT_AUTH_VALID_DAYS`。
- [x] 4. 增加回归测试与文档更新，覆盖新增行为。
  - 摘要：新增 `tests/license-server-new-shop-default-auth.test.mjs`；同步 `docs/授权管理页.md` 与 `services/license-server/README.md`。
- [ ] 5. 执行定向测试，确认页面契约与逻辑正常。
  - 摘要：待执行。
- [ ] 6. 执行浏览器测试（mock 状态含“新店铺无 lastSeenAt”），确认页面默认可见且新店铺默认 3 天授权。
  - 摘要：待执行。
- [ ] 7. 回填结果复盘与风险说明。
  - 摘要：待执行。

## 结果复盘
- 状态：进行中
- 交付结果：待补充。
