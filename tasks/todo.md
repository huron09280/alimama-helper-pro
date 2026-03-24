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
