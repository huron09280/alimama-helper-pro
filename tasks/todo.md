# TODO - 2026-05-05 矩阵页趋势主题组合常驻入口

## 需求规格
- 目标：
  - 将矩阵页 `选择趋势主题` 维度里的 `添加趋势主题组合` 从下拉面板内移到卡片外层常驻区域；
  - 用户无需先点开 `点击选择` 下拉，就能直接新增趋势主题组合；
  - 保留已有下拉勾选能力，用于选择已添加的趋势主题组合和 `清空趋势主题`；
  - 不真实提交线上计划，只验证 UI 交互与矩阵配置写回。
- 成功标准：
  - 真实页面里 `选择趋势主题` 维度卡片上可以直接看到并点击 `添加趋势主题组合`；
  - `点击选择` 下拉里不再把新增入口藏在选项列表末尾；
  - 点击常驻入口能打开趋势主题弹窗，确认后写回当前维度并可在下拉中勾选；
  - 回归测试、构建、浏览器验证通过。

## 执行计划（可核对）
- [x] 回顾用户截图与现有入口实现，确认痛点是入口藏在下拉内。
- [x] 调整维度卡片渲染，把趋势主题新增入口移动到值选择器外层。
- [x] 更新样式，保证常驻按钮在卡片内清晰但不挤占选择器。
- [x] 更新回归测试，防止新增入口再次被放回下拉 panel。
- [x] 构建生成 userscript/extension 产物，并运行目标测试。
- [x] 使用 `chrome-devtools` MCP 在真实页面刷新插件后验证入口常驻和写回链路。
- [x] 运行完整检查并归档结果。

## 改动摘要
- 已将 `添加趋势主题组合` 从 `点击选择` 下拉 panel 内移出，改为渲染在 `选择趋势主题` 维度卡片的值选择器下方。
- 下拉 panel 现在只保留已有值选择，例如 `清空趋势主题` 或已创建的趋势主题组合；新增动作不再混在选项列表里。
- 事件处理继续复用原 `data-matrix-trend-theme-edit` 链路，不新增状态分支；点击常驻按钮仍会打开编辑页同源趋势主题弹窗，并把确认结果写回当前矩阵维度。
- 常驻按钮复用原 `am-wxt-matrix-trend-theme-actions` 样式，外置后保持卡片内分隔和整行按钮形态，不额外引入新的视觉规则。
- 已补回归测试，明确断言新增入口位于 `${valueEditorHtml}` 之后，并且值下拉 panel 内不再包含 `${trendThemeEditorHtml}`。

## 验证记录
- `node scripts/build.mjs`：通过。
- `node --check "阿里妈妈多合一助手.js"`：通过。
- `node --test tests/matrix-plan-config.test.mjs tests/keyword-trend-theme-setting.test.mjs`：通过，27/27。
- `node scripts/build.mjs --check`：通过。
- `git diff --check`：通过。
- `node --test tests/*.test.mjs`：通过，423 个测试，421 通过，2 个跳过（既有 `agent-cluster/index.mjs` 缺失）。
- `bash scripts/review-team.sh`：通过，最终输出 `All automated review checks passed.`。
- `chrome-devtools` MCP（2026-05-05）：刷新 unpacked extension 后，在真实 `one.alimama.com` 页面打开向导，进入矩阵页并切换营销目标到 `趋势明星`，添加 `选择趋势主题` 维度后，未展开 `点击选择` 下拉即可直接看到 `添加趋势主题组合`。
- `chrome-devtools` MCP（2026-05-05）：展开 `点击选择` 下拉后，panel 内只显示 `清空趋势主题`，确认新增入口不在下拉选项内；DOM 检查 `buttonInsidePanel=false`。
- `chrome-devtools` MCP（2026-05-05）：点击常驻 `添加趋势主题组合` 后成功打开趋势主题弹窗，点击 `确定` 后矩阵维度回写为 `已选 1 项：已选 5/6：美的消毒碗柜、消毒碗柜、消毒碗柜家用等`。
- 验证过程中未点击 `立即投放`，未真实创建或提交线上计划；验证后已清理向导会话草稿并移除弹窗。

## 结果复盘
- 上一轮把新建入口放进下拉 panel，功能能用但路径过深；用户每新增一次都要先打开选择器，交互成本不合理。
- 更合适的划分是：常驻按钮负责创建/编辑复杂组合，下拉只负责选择已有值。这样也避免未来把多个动作继续堆到同一个选项面板里。
- 已将该经验沉淀到 `tasks/lessons.md` 的 L39。

# TODO - 2026-05-05 矩阵页“生成计划”点击无反应二次修复

## 需求规格
- 目标：
  - 复现用户当前反馈的“点击生成计划，没有反应”；
  - 定位真实点击链路中是事件未触发、异常中断、状态未同步、日志不可见还是运行态未刷新；
  - 修复后必须用用户可见的矩阵页操作路径验证，而不是只用脚本构造状态。
- 成功标准：
  - 在真实 `one.alimama.com` 页面，点击矩阵页 `生成计划` 后必须有明确结果：成功生成计划或可见错误日志；
  - 满足矩阵配置和商品前置条件时，点击后能生成计划列表；
  - 回归测试覆盖二次根因；
  - 自动化验证和 `chrome-devtools` MCP 真实页面验证通过。

## 执行计划（可核对）
- [x] 记录二次反馈，确认上一轮交付不足。
- [x] 检查当前真实页面按钮 DOM、disabled 状态、事件触发、日志区和控制台异常。
- [x] 定位并修复点击无反应的第二根因。
- [x] 补充/更新回归测试。
- [x] 重新构建并刷新浏览器运行态。
- [x] 按用户可见路径完成真实页面复测。
- [x] 运行目标测试、全量测试、`review-team` 和 `git diff --check`。
- [x] 更新 lessons、改动摘要、验证记录和结果复盘。

## 改动摘要
- 二次根因已在真实页面复现：`生成计划` 点击事件会触发，但缺商品等前置失败只写入隐藏的日志页，矩阵页当前操作区没有可见反馈，用户看到的是“点击没有反应”。
- 已新增矩阵页操作提示写入入口 `setMatrixActionNote`，并在点击生成的前置校验里通过 `showMatrixGenerateFeedback` 同步写入日志和矩阵页提示。
- 已拆分缺场景、缺矩阵配置、缺商品、缺策略、无有效计划等错误提示，缺商品时明确提示“请先回首页添加商品，再回矩阵页点击补齐5维或添加商品维度后生成计划”。
- 已为矩阵操作提示增加红色错误态和绿色成功态样式，避免点击后只有隐藏日志变化。
- 已更新矩阵回归测试，覆盖可见提示 helper、生成点击反馈和错误样式契约。

## 验证记录
- `node scripts/build.mjs`：通过。
- `node --check "阿里妈妈多合一助手.js"`：通过。
- `node --test tests/matrix-plan-config.test.mjs`：通过，24/24。
- `node scripts/build.mjs --check`：通过。
- `node --test tests/matrix-plan-config.test.mjs tests/matrix-bid-target-cost-package.test.mjs tests/matrix-dimension-structured-values.test.mjs tests/keyword-trend-theme-setting.test.mjs`：通过，41/41。
- `git diff --check`：通过。
- `node --test tests/*.test.mjs`：通过，423 个测试，421 通过，2 个跳过（既有 `agent-cluster/index.mjs` 缺失）。
- `bash scripts/review-team.sh`：通过，最终输出 `All automated review checks passed.`。
- `chrome-devtools` MCP（2026-05-05）：刷新 unpacked extension 后，在真实 `one.alimama.com` 页面复现到点击事件触发但只进入日志页的问题；矩阵页没有商品时，点击 `生成计划` 现在会在当前矩阵页显示红色提示 `请先回首页添加商品，再回矩阵页点击“补齐5维”或添加“商品”维度后生成计划`。
- `chrome-devtools` MCP（2026-05-05）：按用户可见路径回首页添加 1 个真实商品后，回到矩阵页点击 `补齐5维`，矩阵摘要显示 `矩阵：开启 ｜ 组合 32 ｜ 批次 13`，商品维度显示已选商品；点击 `生成计划` 后成功回首页计划列表，日志提示 `已生成计划 128 个，已追加到首页计划列表（共 132 个）`。
- 验证过程中未点击 `立即投放`，未真实创建或提交线上计划；验证后已通过向导 API 清理会话草稿并刷新页面。

## 结果复盘
- 上一轮修复只验证了按钮可点击、隐藏日志和成功生成路径，没有覆盖“前置条件失败时当前页必须可见反馈”，导致缺商品场景仍会被用户感知为无反应。
- 本轮修复把失败反馈放回用户当前操作区域，同时保留日志记录；这比继续扩大按钮禁用态更清晰，也能让用户知道下一步该补什么。
- 已将该教训沉淀到 `tasks/lessons.md`：点击类修复必须同时验证事件触发、隐藏日志、当前页反馈和成功路径。

# TODO - 2026-05-05 矩阵页“生成计划”点击生成修复

## 需求规格
- 目标：
  - 修复批量建计划 API 向导矩阵页里“生成计划”按钮无法点击或点击后无法生成计划的问题；
  - 保持矩阵页已有营销目标、维度卡片、复杂字段和请求写回能力不退化；
  - 不真实提交线上计划，只验证到生成计划草稿/预览或可生成状态。
- 成功标准：
  - 矩阵页满足必要配置后，“生成计划”按钮处于可点击状态；
  - 点击“生成计划”后能生成矩阵计划列表/预览，不被空维度、禁用态或事件链路阻断；
  - 回归测试覆盖本次根因，避免后续矩阵页再次出现可见按钮不可点击或点击无效；
  - `node scripts/build.mjs`、语法检查、相关测试、全量测试和 `scripts/review-team.sh` 通过；
  - 使用 `chrome-devtools` MCP 在真实 `one.alimama.com` 页面刷新运行态后验证通过。
- 非目标：
  - 不真实创建或提交线上计划；
  - 不重构整个批量建计划向导；
  - 不处理当前未跟踪目录和无关文件。

## 执行计划（可核对）
- [x] 回顾 `tasks/lessons.md`，确认矩阵页修复必须覆盖真实点击链路和浏览器复测。
- [x] 建立本轮需求规格、成功标准和验证计划。
- [x] 定位矩阵页“生成计划”按钮的渲染、禁用态和点击事件链路。
- [x] 复现或推断点击无效根因，并选择最小且优雅的修复方案。
- [x] 实现修复并补充/更新回归测试。
- [x] 运行构建、语法、目标测试、全量测试、`review-team` 和 `git diff --check`。
- [x] 使用 `chrome-devtools` MCP 在真实 `one.alimama.com` 页面复验矩阵页生成链路。
- [x] 回填改动摘要、验证记录和结果复盘。

## 改动摘要
- 根因是矩阵页 `生成计划` 按钮的禁用态把“已添加商品”和“已启用策略”等生成前置条件也纳入了按钮级禁用判断；真实页面里矩阵已开启且有组合，但商品池为空时按钮被置灰，用户无法点击并看到已有的错误提示。
- 已将按钮可点击条件收窄为“当前场景允许编辑矩阵维度”，缺矩阵配置、缺商品或缺策略时仍允许点击，由既有点击守卫输出可操作日志。
- 已在点击生成前主动同步矩阵页当前营销目标和维度 UI 状态，避免刚编辑的矩阵配置尚未写回草稿时被旧状态阻断。
- 已更新矩阵回归测试，覆盖按钮不再被缺商品前置条件置灰，以及点击链路会先同步场景和矩阵配置。

## 验证记录
- `node scripts/build.mjs`：通过。
- `node --check "阿里妈妈多合一助手.js"`：通过。
- `node --test tests/matrix-plan-config.test.mjs`：通过，24/24。
- `node scripts/build.mjs --check`：通过。
- `node --test tests/matrix-plan-config.test.mjs tests/matrix-bid-target-cost-package.test.mjs tests/matrix-dimension-structured-values.test.mjs tests/keyword-trend-theme-setting.test.mjs`：通过，41/41。
- `git diff --check`：通过。
- `node --test tests/*.test.mjs`：通过，423 个测试，421 通过，2 个跳过（既有 `agent-cluster/index.mjs` 缺失）。
- `bash scripts/review-team.sh`：通过，最终输出 `All automated review checks passed.`。
- `chrome-devtools` MCP（2026-05-05）：刷新 unpacked extension 后，在真实 `one.alimama.com` 页面打开批量建计划 API 向导，矩阵页无完整配置时 `生成计划` 按钮可点击，点击后日志提示 `请先开启矩阵并补齐至少 1 组有效组合，再生成计划`。
- `chrome-devtools` MCP（2026-05-05）：添加 1 个真实商品后进入矩阵页，点击 `补齐5维` 得到 `矩阵：开启 ｜ 组合 32 ｜ 批次 4`，点击 `生成计划` 后成功回到首页计划列表，显示 `已选 33 个`，日志提示 `已生成计划 32 个，已追加到首页计划列表（共 33 个）`。
- 验证过程中未点击 `立即投放`，未真实创建或提交线上计划；验证后已通过向导 API 清理会话草稿。

## 结果复盘
- 本轮缺陷不是矩阵物化核心失败，而是 UI 层把可诊断的前置条件提前折叠成禁用态，导致用户无法触发已有生成守卫和错误日志。
- 更优雅的修复是保留点击入口，把复杂前置校验集中在生成事件里输出明确原因，而不是继续扩展按钮禁用条件；这样既解决“无法点击”，也避免隐藏真实缺口。
- 真实页面验证覆盖了缺配置诊断链路和完整生成链路；本轮只生成本地草稿计划列表，没有触发线上投放。

# TODO - 2026-05-04 维度卡片支持新增趋势主题组合

## 需求规格
- 目标：
  - 修复矩阵页 `选择趋势主题` 维度卡只能选择 `清空趋势主题` 的问题；
  - 在维度卡片内提供新增/编辑趋势主题组合的入口，复用已有趋势主题选择能力；
  - 新增组合后进入该维度卡的可选值，并可被勾选为矩阵组合值；
  - 保持最终写回 `campaign.trendThemeList`。
- 成功标准：
  - `选择趋势主题` 维度卡中，值下拉除 `清空趋势主题` 外有可新增趋势主题组合的入口；
  - 从卡片入口选择趋势主题后，卡片值摘要显示 `已选 N/6：...`，而不是只有 `清空趋势主题`；
  - 回归测试、构建同步和真实页面 UI 验证通过；
  - 不真实提交线上计划。

## 执行计划（可核对）
- [x] 回顾 lessons，确认矩阵字段修复要覆盖维度卡片完整交互。
- [x] 定位编辑页趋势主题弹窗打开、确认、写回链路。
  - 已确认编辑页 `openKeywordTrendThemeSettingPopup` 返回 `trendThemeRaw/summary`，现有实现只依赖 `campaign.trendThemeList` 隐藏控件，需要改成可接收外部初始值的复用入口。
- [x] 为矩阵趋势主题维度卡增加新增/编辑组合入口，并将结果写回当前行。
  - 已在 `选择趋势主题` 多选面板中加入 `添加趋势主题组合`，确认后写回当前维度并刷新矩阵摘要。
- [x] 更新回归测试覆盖卡片入口和写回摘要。
  - 已覆盖矩阵卡片入口、脱离隐藏字段模式复用趋势主题弹窗、保存后写回当前维度。
- [x] 运行构建、语法、目标测试、全量测试和 `review-team`。
- [x] 使用 `chrome-devtools` MCP 在真实 `one.alimama.com` 页面复验。
- [x] 更新 lessons 与结果复盘。

## 改动摘要
- 已将编辑页趋势主题弹窗改成可复用入口：保留原隐藏控件写回方式，同时支持矩阵页传入 `initialRaw` 的 detached 模式。
- 已在矩阵趋势主题维度卡片的值下拉面板中增加 `添加趋势主题组合` 按钮，复用同一个趋势主题弹窗。
- 已在矩阵维度卡片点击链路中处理弹窗确认结果，将 `trendThemeRaw` 加入当前维度值，移除默认 `清空趋势主题`，并刷新草稿/摘要/预览。
- 已补充趋势主题弹窗和矩阵配置回归测试。

## 验证记录
- `node scripts/build.mjs`：通过。
- `node --check "阿里妈妈多合一助手.js"`：通过。
- `node --test tests/matrix-plan-config.test.mjs tests/keyword-trend-theme-setting.test.mjs tests/matrix-bid-target-cost-package.test.mjs`：通过，36/36。
- `node scripts/build.mjs --check`：通过。
- `node --test tests/*.test.mjs`：通过，423 个测试，421 通过，2 个跳过（既有 `agent-cluster/index.mjs` 缺失）。
- `bash scripts/review-team.sh`：通过，最终输出 `All automated review checks passed.`。
- `git diff --check`：通过。
- `chrome-devtools` MCP（2026-05-04）：刷新 unpacked extension 后，在真实 `one.alimama.com` 页面打开 API 向导，矩阵页切到 `关键词推广 -> 趋势明星`，维度卡片新增 `选择趋势主题` 后，值下拉除 `清空趋势主题` 外已显示 `添加趋势主题组合`。
- `chrome-devtools` MCP（2026-05-04）：点击 `添加趋势主题组合` 后成功打开趋势主题弹窗；确认默认推荐后，卡片值摘要显示 `已选 1 项：已选 5/6：美的消毒碗柜、消毒碗柜、消毒碗柜家用等`，可选项中同步出现当前 JSON 组合值；验证后已清理向导草稿，未触发真实计划提交。

## 结果复盘
- 根因是前两轮已经让矩阵页能添加 `选择趋势主题` 维度，但维度值编辑器仍只按已有值渲染；当编辑页没有预先保存趋势主题时，候选列表自然只剩 `清空趋势主题`。
- 修复策略是把编辑页趋势主题弹窗改成可复用的 detached 模式，并通过窄桥暴露给矩阵页；矩阵卡片确认后把 `trendThemeRaw` 序列化为当前维度值，再复用现有矩阵物化写回 `campaign.trendThemeList`。
- 本轮未真实创建或提交线上计划；真实页面验证只覆盖插件运行态、矩阵维度值入口、弹窗选择、卡片摘要和草稿清理。

# TODO - 2026-05-04 维度卡片补齐 `趋势主题` 添加入口

## 需求规格
- 目标：
  - 修复矩阵页 `维度卡片` 中不能自然增加 `趋势主题` 的问题；
  - 在 `关键词推广 -> 趋势明星` 下，除快捷预设外，维度卡片的新增/选择路径也必须能选到 `选择趋势主题`；
  - 保持最终写回 `campaign.trendThemeList` 与可读摘要逻辑不变。
- 成功标准：
  - 点击 `添加维度` 时，若当前目标为 `趋势明星` 且尚未添加趋势主题，应优先新增 `选择趋势主题`；
  - 维度卡片的维度类型下拉可见 `选择趋势主题`；
  - 回归测试、构建同步和真实页面 UI 验证通过；
  - 不真实提交线上计划。

## 执行计划（可核对）
- [x] 回顾 `tasks/lessons.md`，确认矩阵页不能只验证快捷预设路径。
- [x] 定位维度卡片 `添加维度` 与维度类型下拉的候选生成链路。
- [x] 将 `选择趋势主题` 接入维度卡片新增优先级与类型候选。
- [x] 更新回归测试覆盖维度卡片添加路径。
- [x] 运行构建、语法、目标测试、全量测试和 `review-team`。
- [x] 使用 `chrome-devtools` MCP 在真实 `one.alimama.com` 页面复验。
- [x] 更新 `tasks/lessons.md` 与结果复盘。

## 改动摘要
- 已确认维度卡片底部 `添加维度` 只取 `getNextAvailableMatrixPresetKey` 的第一个结果；此前排序先给预算、出价、前缀、商品，导致 `选择趋势主题` 虽在候选目录内，但用户很难从卡片路径直接新增。
- 已新增当前营销目标专属字段优先级：`getMatrixAppendablePresetKeys` 会先取当前目标的场景字段，再取通用推荐维度。
- 在 `关键词推广 -> 趋势明星` 下，维度卡片 `添加维度` 会优先新增 `选择趋势主题`；维度类型下拉仍保留 `选择趋势主题` 可选。
- 已补充回归断言，防止维度卡片添加入口再次只按通用推荐维度排序。

## 验证记录
- `node scripts/build.mjs`：通过。
- `node --test tests/matrix-plan-config.test.mjs`：通过，24/24。
- `node --test tests/matrix-plan-config.test.mjs tests/keyword-trend-theme-setting.test.mjs tests/matrix-bid-target-cost-package.test.mjs`：通过，36/36。
- `node --check "阿里妈妈多合一助手.js"`：通过。
- `node scripts/build.mjs --check`：通过。
- `node --test tests/*.test.mjs`：通过，423 个测试，421 通过，2 个跳过（既有 `agent-cluster/index.mjs` 缺失）。
- `bash scripts/review-team.sh`：通过，最终输出 `All automated review checks passed.`。
- `git diff --check`：通过。
- `chrome-devtools` MCP（2026-05-04）：刷新 unpacked extension 后，在真实 `one.alimama.com` 页面打开 API 向导，矩阵页 `关键词推广 -> 趋势明星` 下，维度卡片 `添加维度` 显示 `下一个可加：选择趋势主题`，其 `data-matrix-preset-key` 为 `scene_field:趋势主题`。
- `chrome-devtools` MCP（2026-05-04）：点击维度卡片 `添加维度` 后新增 `选择趋势主题` 行，维度类型下拉包含 `选择趋势主题`；新增后下一张添加卡显示 `冷启加速`，未再暴露 `scene_field:*` 内部 key；随后已移除验证行，未触发真实计划提交。

## 结果复盘
- 根因是上一轮只把当前目标专属字段前置到了快捷预设目录，维度卡片底部 `添加维度` 仍按通用推荐维度排序，所以趋势主题被排在预算/出价/前缀/商品之后。
- 修复策略是把“当前营销目标专属字段”抽成维度卡片追加优先级，并且只保留当前 catalog 中真实可编辑的 key，避免 `scene_field:出价目标` 这类被固定维度承接的内部 key 显示出来。
- 本轮未真实创建或提交线上计划；真实页面验证只覆盖插件运行态、维度卡片添加入口、维度行新增和清理。

# TODO - 2026-05-04 矩阵页补齐 `趋势明星` 的 `选择趋势主题`

## 需求规格
- 目标：
  - 修复批量建计划 API 向导矩阵页中 `关键词推广 -> 趋势明星` 的预设条件缺口；
  - 让矩阵页在切到 `趋势明星` 后可以看到编辑页已有的 `选择趋势主题` 能力；
  - 矩阵组合写回时保留 `campaign.trendThemeList`，避免只写中文展示字段导致最终请求丢失趋势主题。
- 成功标准：
  - 矩阵页 `关键词推广 -> 趋势明星` 快捷预设出现 `选择趋势主题`；
  - 新增维度后默认带入当前编辑页已选趋势主题集合，可作为矩阵组合值使用；
  - 矩阵物化计划时同步写入 `campaign.trendThemeList`；
  - 回归测试、构建同步和真实页面 UI 验证通过；
  - 不真实提交线上计划。

## 执行计划（可核对）
- [x] 回顾 `tasks/lessons.md`，确认目标专属原生控件不能只靠通用字段兜底。
- [x] 定位编辑页 `选择趋势主题` 的控件、隐藏字段和最终请求映射。
- [x] 将 `选择趋势主题` 纳入矩阵页 `趋势明星` 目标专属预设。
- [x] 增加矩阵趋势主题值的安全写回逻辑，保证落到 `campaign.trendThemeList`。
- [x] 更新回归测试覆盖矩阵预设、默认值和物化写回。
- [x] 运行构建、语法、目标测试、全量测试和 `review-team`。
- [x] 使用 `chrome-devtools` MCP 在真实 `one.alimama.com` 页面复验。
- [x] 更新 `tasks/lessons.md` 与结果复盘。

## 改动摘要
- 已将 `关键词推广 -> 趋势明星` 的矩阵快捷预设补齐 `选择趋势主题`，并保留目标专属顺序：`选择趋势主题 / 出价目标 / 冷启加速 / 预算类型 / 人群设置 / 人群优化目标`。
- 已为趋势主题增加矩阵专用适配：从编辑页当前 `campaign.trendThemeList` 生成可选组合值，摘要显示 `已选 N 项` 或 `清空趋势主题`，避免把底层 JSON 直接展示给用户。
- 已在矩阵物化计划时把该维度同步写回 `campaign.trendThemeList`，同时兼容中文展示字段，确保最终请求不会丢失趋势主题。
- 已更新矩阵回归测试，覆盖预设出现、复杂值不过滤、可选值生成和计划物化写回。

## 验证记录
- `node scripts/build.mjs`：通过。
- `node --test tests/matrix-plan-config.test.mjs`：通过，24/24。
- `node --test tests/matrix-plan-config.test.mjs tests/keyword-trend-theme-setting.test.mjs tests/matrix-bid-target-cost-package.test.mjs`：通过，36/36。
- `node --check "阿里妈妈多合一助手.js"`：通过。
- `node scripts/build.mjs --check`：通过。
- `node --test tests/*.test.mjs`：通过，423 个测试，421 通过，2 个跳过（既有 `agent-cluster/index.mjs` 缺失）。
- `bash scripts/review-team.sh`：通过，最终输出 `All automated review checks passed.`。
- `git diff --check`：通过。
- `chrome-devtools` MCP（2026-05-04）：刷新 unpacked extension 后，在真实 `one.alimama.com` `关键词推广 -> 搜索卡位` 页面打开 API 向导，矩阵页切到 `关键词推广 -> 趋势明星`，快捷预设已显示 `选择趋势主题`，其 key 为 `scene_field:趋势主题`。
- `chrome-devtools` MCP（2026-05-04）：点击 `选择趋势主题` 预设后新增维度行，展示为 `选择趋势主题`，值摘要为 `清空趋势主题`，未出现底层 JSON；随后已移除该验证维度，未触发真实计划提交。

## 结果复盘
- 根因是趋势主题属于目标专属复杂弹窗字段，底层请求字段为 `campaign.trendThemeList`；矩阵页原有的通用场景字段过滤会排除 JSON 复杂值，且只写中文字段不足以驱动最终请求。
- 修复策略是在矩阵层为趋势主题建立轻量适配：UI 预设、可读摘要、值选项和请求写回一起补齐，不把它伪装成普通文本维度。
- 本轮未真实创建或提交线上计划；真实页面验证只覆盖插件运行态、矩阵预设展示和维度添加/移除。

# TODO - 2026-05-04 矩阵页补充 `营销目标` 选择

## 需求规格
- 目标：
  - 在批量建计划 API 向导矩阵页的 `场景选择` 区域补充 `营销目标`；
  - 让矩阵页可直接切换 `关键词推广` 下的 `搜索卡位 / 趋势明星 / 流量金卡 / 自定义推广` 等目标；
  - 切换后同步编辑页同一份场景条件，并刷新快捷预设与维度可选项。
- 成功标准：
  - 矩阵页在 `场景选择` 下方可见 `营销目标` 行；
  - 点击目标后，编辑页 `营销目标` 和矩阵页快捷预设保持一致；
  - 回归测试、构建同步和真实页面 UI 验证通过；
  - 不真实提交线上计划。

## 执行计划（可核对）
- [x] 回顾 `tasks/lessons.md`，确认浏览器复测前必须刷新运行态。
- [x] 定位矩阵页场景卡片模板、编辑页营销目标行和目标同步链路。
- [x] 实现矩阵页 `营销目标` 行，并接入场景条件 bucket。
- [x] 更新回归测试覆盖矩阵页目标行、选项和点击后刷新链路。
- [x] 运行构建、语法、目标测试、全量测试和 `review-team`。
- [x] 使用 `chrome-devtools` MCP 在真实 `one.alimama.com` 页面复验矩阵页目标行。
- [x] 回填验证记录和结果复盘。

## 改动摘要
- 已在矩阵页 `场景选择` 下方新增 `营销目标` 行，用于直接切换 `关键词推广` 的 `搜索卡位 / 趋势明星 / 流量金卡 / 自定义推广`。
- 已让矩阵页目标切换写回同一份 `sceneSettingValues` bucket，并同步当前编辑策略的 `marketingGoal / sceneSettings`，随后刷新动态配置、矩阵摘要和请求预览。
- 已修正矩阵快捷预设目录：渲染时优先读取矩阵页当前高亮的营销目标，再读编辑 bucket，避免刚切换目标后仍展示旧目标字段。
- 已更新矩阵回归测试，覆盖目标行渲染、点击链路、当前目标优先级和目标专属快捷预设前置。

## 验证记录
- `node scripts/build.mjs`：通过。
- `node --test tests/matrix-plan-config.test.mjs`：通过，24/24。
- `node --check "阿里妈妈多合一助手.js"`：通过。
- `node scripts/build.mjs --check`：通过。
- `node --test tests/*.test.mjs`：通过，423 个测试，421 通过，2 个跳过（既有 `agent-cluster/index.mjs` 缺失）。
- `bash scripts/review-team.sh`：通过，最终输出 `All automated review checks passed.`。
- `git diff --check`：通过。
- `chrome-devtools` MCP（2026-05-04）：刷新 unpacked extension 后，在真实 `one.alimama.com` `关键词推广 -> 搜索卡位` 页面打开 API 向导，矩阵页 `场景选择` 下方已显示 `营销目标` 行。
- `chrome-devtools` MCP（2026-05-04）：点击矩阵页 `流量金卡` 后，编辑动态字段变为 `套餐卡 / 套餐包档位 / 套餐包自动续投 / 支付方式`，快捷预设同步显示这些流量金卡专属字段。
- `chrome-devtools` MCP（2026-05-04）：点击矩阵页 `自定义推广` 后，快捷预设恢复 `流量智选 / 冷启加速 / 预算类型 / 人群设置 / 人群优化目标`；未触发真实计划提交。

## 结果复盘
- 根因是矩阵页原本只有场景选择，没有暴露编辑页的 `营销目标` 分支；用户需要在矩阵页做目标切换时，预设目录仍只能从旧的场景默认值或 bucket 推断。
- 修复点选择在 `场景选择` 正下方，和“先选场景、再选该场景下目标”的心智一致，也避免把目标混入维度卡片造成误解。
- 真实页复验时发现扩展运行态可能缓存旧 bundle，因此浏览器验证前必须先在 `chrome://extensions` 重载 unpacked extension，再刷新 `one.alimama.com` 页面。

# TODO - 2026-05-04 `关键词推广` 矩阵页场景预设条件同步编辑页

## 需求规格
- 目标：
  - 修复批量建计划 API 向导矩阵页中 `关键词推广` 的场景选择预设条件；
  - 让矩阵页预设条件与编辑页中已有的条件/字段定义保持同步；
  - 避免后续编辑页新增条件后矩阵页继续遗漏。
- 成功标准：
  - `关键词推广` 在矩阵页选择场景时，可见的预设条件覆盖编辑页同目标条件；
  - 预设条件不会引入其他营销目标不适用的字段；
  - 构建产物与源码同步，相关回归测试通过；
  - 若改动影响 userscript 入口，完成语法与构建校验。
- 非目标：
  - 不重构整个 API 向导；
  - 不真实提交线上计划；
  - 不处理未跟踪临时目录和无关业务文件。

## 执行计划（可核对）
- [x] 回顾 `tasks/lessons.md`，确认本轮要避免只补通用兜底而遗漏真实编辑页条件。
- [x] 建立本轮需求规格、成功标准和验证计划。
- [x] 定位矩阵页场景选择的预设条件生成链路。
- [x] 定位编辑页条件定义和已有同步/复用模式。
- [x] 对比缺失字段，选择最小且可复用的同步修复方案。
- [x] 实现修复并补充/更新回归测试。
- [x] 运行构建、语法和目标/全量测试。
- [x] 使用 `chrome-devtools` MCP 在真实 `one.alimama.com` 页面复验矩阵页预设条件。
- [x] 回填改动摘要、验证记录和结果复盘。

## 改动摘要
- 已建立本轮 goal-driven 计划，并启动只读子代理并行定位矩阵页与编辑页条件链路。
- 已确认矩阵预设来源为固定维度 + `scene_field:*` 场景字段目录，编辑页条件来源为 `sceneSettings / sceneSettingValues`。
- 已在矩阵预设渲染、点击预设和“补齐5维”前同步编辑页当前 `data-scene-field` 控件，避免矩阵页读取旧 bucket。
- 已补齐关键词推广各目标可矩阵化的编辑页条件：`流量智选`、`冷启加速`、`预算类型`、`人群设置`、`人群优化目标` 等；保留高级设置这类复杂弹窗字段的排除，不把 JSON 弹窗误当普通文本维度。
- 已更新 `tests/matrix-plan-config.test.mjs` 覆盖矩阵预设与编辑页条件同步。

## 验证记录
- `node scripts/build.mjs`：通过。
- `node --check "阿里妈妈多合一助手.js"`：通过。
- `node --test tests/matrix-plan-config.test.mjs`：通过，24/24。
- `node --test tests/matrix-bid-target-cost-package.test.mjs tests/keyword-custom-settings-sync.test.mjs tests/keyword-custom-popup-config.test.mjs`：通过，49/49。
- `node scripts/build.mjs --check`：通过。
- `node --test tests/*.test.mjs`：通过，423 个测试，421 通过，2 个跳过（既有 `agent-cluster/index.mjs` 缺失）。
- `bash scripts/review-team.sh`：通过，最终输出 `All automated review checks passed.`。
- `chrome-devtools` MCP（2026-05-04）：刷新真实 `one.alimama.com` `关键词推广 -> 搜索卡位` 页面后打开 `关键词推广批量建计划 API 向导`，矩阵页 `关键词推广` 预设已显示 `流量智选`、`冷启加速`、`预算类型`、`人群设置`、`人群优化目标`。
- `chrome-devtools` MCP（2026-05-04）：点击 `人群设置` 预设后，维度值下拉包含 `设置优先投放客户`、`添加精选人群`、`关闭`，未触发真实计划提交。

## 结果复盘
- 根因是矩阵页预设目录读取了静态场景字段目录，但渲染/应用预设前没有先同步编辑页当前 `sceneSettings`，且关键词推广默认矩阵候选遗漏了部分可直接映射的编辑页条件。
- 修复策略是把“同步编辑页字段”收口成矩阵预设入口前置步骤，并只开放能稳定映射请求字段的普通条件；复杂高级设置弹窗继续保持排除，避免把 JSON 配置误作为普通文本维度。
- 本轮未真实创建或提交线上计划；真实页面验证只覆盖插件运行态、矩阵预设展示和值选择。

# TODO - 2026-05-04 `关键词推广 -> 自定义推广` 高级设置/人群/词包收口

## 需求规格
- 目标：
  - 基于当前未提交工作树继续收口，不回退既有趋势明星与关键词四目标改造；
  - 先审读现有改动并确认它们补齐的真实页面能力，再补齐 `关键词推广 -> 自定义推广` 的高级设置、人群、词包和请求一致性缺口；
  - 最终插件配置、请求预览、实际提交裁剪和真实 `one.alimama.com` 页面运行态表现一致。
- 范围：
  - 自定义推广的 `投放资源位 / 投放地域 / 分时折扣` 组合弹窗；
  - 手动出价与智能出价下的人群设置入口分流；
  - `流量智选` 词包在编辑态/预览态保留，提交态按原生契约裁剪；
  - 默认策略与请求预览一致性；
  - 自动化回归、构建校验与 `chrome-devtools` MCP 真实页面复验。
- 非目标：
  - 不真实创建或提交线上计划；
  - 不重构整个关键词计划 API 向导；
  - 不修改未跟踪临时目录、构建产物以外的无关文件。

## 当前未提交改动审读结论
- `defaults-and-presets.js / matrix-scene-fields.js`：已开始把关键词默认策略从 2 类扩展为搜索卡位、趋势明星、流量金卡、自定义推广 4 类，并让矩阵维度按营销目标展示，避免自定义推广看到不属于它的卡位/匹配字段。
- `search-and-draft.js / request-builder-preview.js`：已开始修正自定义推广智能出价预算类型不应强制切每日预算，并让趋势明星 ROI 出价目标不被策略默认值覆盖。
- `render-scene-dynamic-core.js / render-scene-dynamic-item-adzone-popup.js / style.js`：大量改动集中在趋势明星趋势主题原生弹窗，同步补了推荐接口、三红榜、联想搜索、底部已选浮层等真实页面能力。
- `component-config.js`：补齐商品素材图片字段归一化，服务于本店/竞店宝贝选择类弹窗展示。
- 当前缺口集中在自定义推广高级设置组合弹窗、人群设置按出价模式分流、流量智选词包保留/提交裁剪，以及默认策略和请求预览的一致性断言。

## 执行计划（可核对）
- [x] 审读当前未提交改动，按真实页面能力归类并写入本计划。
- [x] 定位自定义推广高级设置、人群设置、词包、请求预览和提交裁剪的现有链路。
- [x] 补齐 `投放资源位 / 投放地域 / 分时折扣` 组合弹窗：三块设置同窗编辑、摘要回填、隐藏字段同步。
- [x] 补齐手动/智能出价的人群设置分流：手动出价展示优先投放客户，智能出价展示人群优化目标，并保证提交字段互不串扰。
- [x] 补齐流量智选词包逻辑：编辑态/预览态保留词包，提交态按原生契约裁剪不应提交的冗余字段。
- [x] 对齐默认策略与请求预览：默认自定义推广策略、预算类型、出价目标、词包和高级设置预览保持一致。
- [x] 增加/更新回归测试，覆盖上述四类能力。
- [x] 运行 `node scripts/build.mjs`、`node scripts/build.mjs --check`、相关 `node --test` 与必要语法检查。
- [x] 使用 `chrome-devtools` MCP 在真实 `one.alimama.com` 自定义推广页面复验弹窗入口、摘要、分流和预览。
- [x] 回填验证记录与结果复盘。

## 改动摘要
- 已建立本轮收口计划。
- 已审读当前工作树并确认既有改动主要在补关键词四目标默认/矩阵契约、趋势明星趋势主题弹窗、商品图片字段归一化和预算/预览一致性。
- 已将自定义推广智能出价下的 `投放资源位 / 投放地域 / 分时折扣` 从三个独立入口收敛为和手动出价一致的组合弹窗，统一写回 `campaign.adzoneList`、`campaign.launchPeriodList`、`campaign.launchAreaStrList`。
- 已补充回归测试：组合弹窗手动/智能双分支、流量智选预览保留与提交裁剪、默认策略与请求预览/最终提交一致性。
- 已在真实页面验证自定义推广智能/手动出价分支：智能出价展示“设置优先投放客户”与“人群优化目标”；手动出价展示“添加精选人群”弹窗入口；两者均保留统一高级设置组合入口。

## 验证记录
- `node scripts/build.mjs`：通过。
- `node --check "阿里妈妈多合一助手.js"`：通过。
- `node --test tests/keyword-custom-popup-config.test.mjs`：通过，25/25。
- `node --test tests/keyword-custom-mode-wordpackage.test.mjs tests/keyword-custom-preview-submit-parity.test.mjs tests/keyword-custom-popup-config.test.mjs`：通过，46/46。
- `node scripts/build.mjs --check`：通过。
- `node --test tests/keyword-custom-popup-config.test.mjs tests/keyword-custom-mode-wordpackage.test.mjs tests/keyword-custom-preview-submit-parity.test.mjs tests/keyword-custom-settings-sync.test.mjs tests/keyword-custom-native-parity-ui.test.mjs tests/keyword-search-p0-contract.test.mjs tests/matrix-plan-config.test.mjs`：通过，99/99。
- `node --test tests/*.test.mjs`：通过，423 个测试，421 通过，2 个跳过（既有 `agent-cluster/index.mjs` 缺失）。
- `bash scripts/review-team.sh`：通过，最终输出 `All automated review checks passed.`。
- `chrome-devtools` MCP（2026-05-04）：在真实 `one.alimama.com` 页面复验，页面为 `计划创建_万相台无界版`，店铺为 `美的洗碗机旗舰店`，插件向导切到 `关键词推广 -> 自定义推广`。
- `chrome-devtools` MCP（2026-05-04）：智能出价分支确认存在 `投放资源位/投放地域/分时折扣` 组合行，触发器为 `adzone`，摘要为 `资源位:默认｜地域:全部｜分时:全时段`，隐藏字段同步 `campaign.adzoneList`、`campaign.launchPeriodList`、`campaign.launchAreaStrList`。
- `chrome-devtools` MCP（2026-05-04）：组合弹窗打开后为 `高级设置`，插件弹窗内三个页签为 `投放资源位 / 投放地域 / 分时折扣`。
- `chrome-devtools` MCP（2026-05-04）：手动出价分支确认 `人群设置` 切到 `添加精选人群`，触发器为 `crowd`，并继续保留同一个高级设置组合入口；未触发真实计划提交。

## 结果复盘
- 本轮现有工作树主要在补趋势明星趋势主题与关键词四目标默认能力；自定义推广缺口集中在动态配置层的入口形态与请求层的字段裁剪一致性。
- 最小收口点是把智能出价下分散的资源位、地域、时段入口合并到既有高级设置弹窗，而不是新增第二套弹窗状态；这样手动/智能共享同一组隐藏字段和摘要生成逻辑。
- 词包链路按“预览保留、提交裁剪”处理：预览继续表达 `流量智选` 开关，最终请求只在 adgroup 保留受控的 `wordPackageList`，campaign 不放行词包噪音字段。
- 本轮未真实创建或提交线上计划；真实页面验证只覆盖插件运行态、弹窗和分支切换。

# TODO - 2026-04-30 `趋势明星` 新增趋势主题设置

## 需求规格
- 目标：
  - 浏览真实 `one.alimama.com` 原生 `关键词推广 -> 趋势明星` 页面，弄清“新增趋势主题”的入口、选择逻辑、数据结构和提交字段；
  - 在插件 API 向导中按现有配置风格新增趋势主题设置；
  - 最终组包必须能把插件设置映射到原生 `trendThemeList` 等字段，不影响 P0/P1 已修复的其他关键词目标。
- 范围：
  - 原生页面交互观察与网络/运行态字段确认；
  - `src/optimizer/keyword-plan-api/` 中趋势明星动态配置、草稿、预览和最终组包；
  - 自动化回归测试与 `chrome-devtools` 真实页面复验。
- 非目标：
  - 不真实提交计划；
  - 不重新设计整套趋势明星主题管理；
  - 不触碰用户未跟踪目录或无关业务模块。

## 执行计划（可核对）
- [x] 关闭插件弹窗，切到原生 `趋势明星` 并观察“新增趋势主题”入口与弹窗/列表结构。
- [x] 捕获或推断趋势主题选择后的页面状态与请求字段，确认 `trendThemeList` 元素结构。
- [x] 定位插件中趋势明星场景字段、弹窗组件、预览与最终组包路径。
- [x] 按现有向导风格新增“趋势主题”设置入口，支持选择、展示摘要、保存到草稿与 sceneSettings。
- [x] 将趋势主题设置映射到最终请求的 `campaign.trendThemeList`，并保证请求预览一致。
- [x] 增加回归测试覆盖 UI 入口、草稿字段、预览和组包字段。
- [x] 运行构建、语法、目标测试、全量测试和 `review-team`。
- [x] 用 `chrome-devtools` MCP 刷新真实页面复验插件趋势明星配置入口。
- [x] 回填验证记录和结果复盘。

## 改动摘要
- 已建立本轮修复计划。
- 已通过 `chrome-devtools` MCP 观察真实 `one.alimama.com` 原生 `关键词推广 -> 趋势明星` 页面：
  - 页面入口为 `选择趋势主题 5 / 6`，弹窗标题为 `选择趋势主题`，包含趋势排行榜、快捷联想、已选趋势和候选主题表格；
  - 弹窗打开会请求 `recommendTheme.json`、`recommendThemeExclude.json`、`themeAssociation.json`；
  - 确认选择后会请求 `recommendItem.json`，请求体包含 `trendThemeList` 与 `themeIdList`，并刷新主题数量与推荐商品。
- 已确认趋势主题上限为 6 个；`trendThemeList` 元素结构至少包含 `trendThemeId`、`trendThemeName`，默认推荐主题通常还包含 `itemCount`。
- 已在趋势明星编辑态新增“趋势主题 / 选择趋势主题”专属设置入口，隐藏底层 `campaign.trendThemeList` 原始 JSON 字段。
- 已新增趋势主题弹窗：进入时读取原生 `recommendThemeDefault.json` 与 `recommendTheme.json` 推荐主题，支持搜索、补齐默认、手动添加、移除和清空，确认后写回完整 `trendThemeList` 对象数组。
- 已新增 `tests/keyword-trend-theme-setting.test.mjs` 覆盖 UI 入口、原生推荐接口、6 个主题上限和 `campaign.trendThemeList` 写回链路。
- 根据用户修正，趋势主题候选区已演进为原生同屏三榜单；最新实现保留 4 列信息（`趋势主题 / 指标列 / 推荐商品数 / 操作`），其中指标列按榜单显示 `趋势指数 / 投产指数 / 搜索指数`。

## 验证记录
- `node scripts/build.mjs`：通过。
- `node scripts/build.mjs --check`：通过。
- `node --test tests/keyword-search-p0-contract.test.mjs tests/keyword-trend-theme-setting.test.mjs`：通过，9/9。
- `node --test tests/*.test.mjs`：通过，417 个测试，415 通过，2 个跳过（既有 `agent-cluster/index.mjs` 缺失）。
- `bash scripts/review-team.sh`：通过，最终输出 `All automated review checks passed.`。
- `chrome-devtools` MCP（2026-04-30）：已重新连接调试浏览器并打开原生 `关键词推广 -> 趋势明星` 页面。
- `chrome-devtools` MCP（2026-04-30）：插件弹窗 `选择趋势主题` 已验证为 3 列表头，且无“趋势指数”列；表头顺序为 `趋势主题 / 推荐商品数 / 操作`。

## 结果复盘
- 本轮根因是“提交字段同构”优先于“列表结构同构”，导致首版趋势主题弹窗虽然字段正确，但列布局与原生不一致。
- 修复策略是以原生列结构为准，把候选表头和行网格收敛到 3 列，并补充自动化断言防回退。
- 当前趋势主题链路已同时满足：原生接口拉取、6 个上限控制、完整对象写回、3 列 UI 同构。

## 增补修复（用户二次修正：三红榜缺失）

### 执行计划（可核对）
- [x] 对齐原生榜单入口，确认“趋势红榜 / 效果红榜 / 流量红榜”均在弹窗中可见。
- [x] 补齐榜单切换行为，切换后按对应指标重排候选趋势主题。
- [x] 增加回归测试断言三红榜入口与切换逻辑，防止后续回退。
- [x] 运行构建与目标测试，确认无语法/契约回归。
- [x] 通过 `chrome-devtools` MCP 在真实页面复验三红榜入口与切换。

### 增补改动摘要
- 已在趋势主题弹窗头部增加三红榜入口：`趋势红榜 / 效果红榜 / 流量红榜`，沿用现有插件 tab 视觉风格。
- 已补齐三红榜切换逻辑：切换榜单后按对应指标分组重排候选主题，再按推荐商品数与主题名稳定排序。
- 已更新 `tests/keyword-trend-theme-setting.test.mjs`，新增三红榜入口、切换事件、排序逻辑断言。
- 已增强测试切块工具：当结束锚点缺失时自动回退到尾部切块，避免构建产物结构变更导致假失败。

### 增补验证记录
- `node scripts/build.mjs`：通过。
- `node --test tests/keyword-trend-theme-setting.test.mjs`：通过，3/3。
- `node --test tests/keyword-search-p0-contract.test.mjs tests/keyword-trend-theme-setting.test.mjs`：通过，9/9。

## 增补修复（用户八次修正：已选浮条固定在底部，不随列表滚动）

### 执行计划（可核对）
- [x] 把已选主题浮条从顶部改到底部悬浮位置。
- [x] 保证浮条固定在弹窗底部，不随榜单列表滚动漂移。
- [x] 预留底部内容空间，避免浮条遮挡列表末尾行。
- [x] 构建并跑趋势主题专项测试。

### 增补改动摘要
- 结构上将 `am-wxt-scene-trend-selected-dock` 移到趋势主区域底部。
- 样式改为 `position:absolute; left/right/bottom` 固定在主区域底部，替换原 `sticky top`。
- 为主区域增加 `padding-bottom`，给底部浮条留出可滚动可见空间。

### 增补验证记录
- `node scripts/build.mjs`：通过。
- `node --test tests/keyword-trend-theme-setting.test.mjs`：通过，3/3。
- `node --test tests/*.test.mjs`：通过，417 个测试，415 通过，2 个跳过（既有 `agent-cluster/index.mjs` 缺失）。
- `bash scripts/review-team.sh`：通过，最终输出 `All automated review checks passed.`。
- `chrome-devtools` MCP（2026-04-30）：真实页面插件弹窗存在三红榜入口，`document.querySelectorAll('[data-scene-popup-trend-rank-tab]')` 返回 `趋势红榜 / 效果红榜 / 流量红榜`。
- `chrome-devtools` MCP（2026-04-30）：切换 `trend -> effect -> traffic` 后 active tab 正常变更，候选主题前 8 条顺序三组均不相同，证明切换后重排生效。

## 增补修复（用户三次修正：同屏三列 + 趋势指数 + 原生视觉对齐）

### 执行计划（可核对）
- [x] 改造三榜单为同屏并排卡片，不再依赖 tab 切换视图。
- [x] 增加并保留榜单指标列，满足趋势指数可视化诉求。
- [x] 参考原生截图对齐三列标题、副文案、卡片层级和列表行样式。
- [x] 更新回归测试断言三榜单对应指标列与并行渲染逻辑。
- [x] 运行构建、目标测试、全量测试与 `review-team`。
- [x] 通过 `chrome-devtools` MCP 在真实页面复验三列内容与指标标题。

### 增补改动摘要
- 趋势主题弹窗候选区升级为三列同屏卡片：`趋势红榜 / 效果红榜 / 流量红榜`，每列独立滚动，便于并排对比选择。
- 每列指标标题按原生语义区分：趋势列显示 `趋势指数`，效果列显示 `投产指数`，流量列显示 `搜索指数`。
- 三列卡片新增副文案与分列底色；列表主体改为“彩色卡片 + 白色表格区 + 分隔行”结构，视觉更贴近原生截图。
- 指标取值按榜单维度读取：趋势列优先 `trendIndex/trend`，效果列优先 `roi/roiIndex/...`，流量列优先 `searchIndex/capacity/...`。
- 更新 `tests/keyword-trend-theme-setting.test.mjs` 断言，覆盖三榜单指标标题与分榜指标输出逻辑。

### 增补验证记录
- `node scripts/build.mjs`：通过。
- `node --test tests/keyword-trend-theme-setting.test.mjs`：通过，3/3。
- `node --test tests/keyword-search-p0-contract.test.mjs tests/keyword-trend-theme-setting.test.mjs`：通过，9/9。
- `node --test tests/*.test.mjs`：通过，417 个测试，415 通过，2 个跳过（既有 `agent-cluster/index.mjs` 缺失）。
- `bash scripts/review-team.sh`：通过，最终输出 `All automated review checks passed.`。
- `chrome-devtools` MCP（2026-04-30）：真实页面弹窗复验通过，检测到三列榜单且指标列分别为 `趋势指数 / 投产指数 / 搜索指数`。
- `chrome-devtools` MCP（2026-04-30）：运行态校验结果 `count=3`，列标识为 `trend/effect/traffic`，每列均包含副文案与对应指标标题。

## 增补修复（用户四次修正：趋势主题文字可见性 + 已选面板宽度）

### 执行计划（可核对）
- [x] 缩窄右侧“已选趋势”面板宽度，为左侧三榜单释放主内容空间。
- [x] 收紧趋势榜单数值列和操作列固定宽度，优先保证“趋势主题”文本显示。
- [x] 复验移动端断点，避免窄屏出现右侧面板被限宽问题。
- [x] 运行构建和趋势主题专项回归测试。
- [x] 用 `chrome-devtools` MCP 在真实页面测量渲染宽度与首行主题文本可见宽度。

### 增补改动摘要
- `am-wxt-scene-crowd-native-layout` 主栅格调整为左宽右窄（`2.15fr / 0.78fr`），右侧 `am-wxt-scene-crowd-native-right` 限宽 `280px`。
- 趋势榜单行网格调整为 `主题 / 指标 / 商品数 / 操作 = 1fr / 32px / 38px / 34px`（移动端 `1fr / 30px / 34px / 32px`），并对指标列增加省略处理，避免挤压主题文本。
- 已选列表头/行宽度同步收窄为 `1fr / 68px / 48px`（移动端 `1fr / 64px / 44px`），`移除`按钮尺寸下调。
- 移动端媒体查询新增右侧面板复位规则：`max-width:none`、`justify-self:stretch`，保证单列堆叠时不被限宽。

### 增补验证记录
- `node scripts/build.mjs`：通过。
- `node --test tests/keyword-trend-theme-setting.test.mjs`：通过，3/3。
- `chrome-devtools` MCP（2026-04-30）：弹窗测量结果 `layoutWidth=1144`，`leftWidth=830.65`，`rightWidth=280`。
- `chrome-devtools` MCP（2026-04-30）：趋势榜单行列模板为 `96.88px 32px 38px 34px`，首行主题文本可见宽度提升到 `97px`，已可直接阅读。

## 增补修复（用户五次修正：弹窗继续加宽 + 输入框边框统一灰色）

### 执行计划（可核对）
- [x] 把趋势主题弹窗最大宽度从 `1180` 提升到更大档位。
- [x] 将“搜索输入框”和“手动添加输入框”边框与聚焦态统一为灰色。
- [x] 构建并运行趋势主题专项测试，确认无回归。
- [x] 页面运行态检查新样式规则已注入。

### 增补改动摘要
- `am-wxt-scene-popup-dialog-filter` 宽度改为 `min(1320px, 98vw)`，同屏可视区域更大。
- 新增输入框样式覆盖：
  - `.am-wxt-scene-crowd-native-toolbar .am-wxt-input`
  - `.am-wxt-scene-crowd-native-manual .am-wxt-input`
  统一为灰色边框，并在 `:focus` 维持灰色与无高亮阴影。

### 增补验证记录
- `node scripts/build.mjs`：通过。
- `node --test tests/keyword-trend-theme-setting.test.mjs`：通过，3/3。
- `chrome-devtools` MCP（2026-04-30）：运行态样式检测 `has1320=true`、`hasGrayInputRule=true`，确认新宽度与灰色边框规则生效。

## 增补修复（用户六次修正：输入框高度与按钮对齐）

### 执行计划（可核对）
- [x] 对搜索输入框和手动添加输入框设置固定高度，与同排按钮一致。
- [x] 同步调整输入框行高与垂直内边距，避免“看起来仍不齐”。
- [x] 构建并做趋势主题专项测试。

### 增补改动摘要
- 两个输入框统一新增：`height:30px`、`min-height:30px`、`line-height:28px`、`padding-top/bottom:0`，与同排按钮高度对齐。

### 增补验证记录
- `node scripts/build.mjs`：通过。
- `node --test tests/keyword-trend-theme-setting.test.mjs`：通过，3/3。

## 增补修复（用户七次修正：改勾选方式 + 去操作列 + 已选主题置顶浮条）

### 执行计划（可核对）
- [x] 三榜单候选主题从“添加按钮”改为“复选框勾选”交互。
- [x] 去掉候选区“操作”列，仅保留 `主题 / 指标 / 推荐商品数` 三列。
- [x] 移除右侧已选面板，改为顶部置顶已选浮条（含数量、宝贝计数、可移除标签）。
- [x] 支持三榜单表头全选/取消全选（受最多 6 个上限约束）。
- [x] 更新回归测试断言并运行构建、目标测试。

### 增补改动摘要
- 弹窗结构改造：
  - 新增 `am-wxt-scene-trend-selected-dock` 置顶浮条，已选主题以 chip 方式展示，点击 `x` 即移除；
  - 右侧 `am-wxt-scene-crowd-native-right` 已选表格区域移除；
  - 三榜单表头改为勾选样式，加入 `data-scene-popup-trend-select-all` 全选入口。
- 候选行交互改造：
  - 原 `data-scene-popup-trend-add` 按钮逻辑替换为 `data-scene-popup-trend-toggle` 勾选逻辑；
  - 新增 `buildVisibleThemes / syncSelectAllState / toggleTheme`，按当前过滤结果维护“全选/半选”状态；
  - 继续保留最多 6 个主题限制。
- 样式改造：
  - 新增勾选控件视觉 `am-wxt-scene-trend-check*`；
  - 新增顶部浮条和 chip 样式 `am-wxt-scene-trend-selected-*`；
  - 三榜单网格列由 4 列收敛到 3 列，移动端同步收敛。
- 测试改造：
  - `tests/keyword-trend-theme-setting.test.mjs` 新增勾选入口、置顶浮条、移除旧“添加操作列”断言。

### 增补验证记录
- `node scripts/build.mjs`：通过。
- `node --test tests/keyword-trend-theme-setting.test.mjs`：通过，3/3。
- `node --test tests/keyword-search-p0-contract.test.mjs tests/keyword-trend-theme-setting.test.mjs`：通过，9/9。

## 增补修复（用户十次修正：已选浮条立即可见 + 效果红榜投产指数无数据）

### 执行计划（可核对）
- [x] 修复趋势主题弹窗底部已选浮条未固定显示问题。
- [x] 补充效果红榜数据来源，修复投产指数显示空值问题。
- [x] 运行构建与趋势主题相关回归测试。

### 增补改动摘要
- 趋势主题弹窗改为专属对话框类名 `am-wxt-scene-popup-dialog-trend-theme`，并将弹窗滚动收敛到内部列表区域，避免整窗滚动导致“需要滚到底部才看到已选浮条”。
- 对趋势主题弹窗补接 `themeAssociation.json` 联想结果（按已选/默认主题种子查询并并入候选池，刷新时同步补拉），作为 AI 联想候选补充。
- 二次修正：趋势主题弹窗必须设置明确高度 `height: min(760px, calc(100vh - 32px))`，并让 `popup-body / trend-layout / trend-main` 逐层撑满，否则 `height:100%` 在 auto 高度父容器下不生效。
- 二次修正：候选合并顺序调整为 `associationThemes -> selectedThemes -> defaultThemes -> nativeBundle.candidateList`，避免带投产指标的联想主题被无指标推荐主题去重覆盖。
- 三次修正：原生 `recommendTheme.json` 同时返回 `trendThemeInfo / effectThemeInfo / capacityThemeInfo` 三个分榜；插件现在分别保存为 `trendRankList / effectRankList / trafficRankList`，并按分榜原始顺序渲染，不再用统一候选池排序模拟三红榜。

### 增补验证记录
- `node scripts/build.mjs`：通过。
- `node --test tests/keyword-trend-theme-setting.test.mjs`：通过，3/3。
- `node --test tests/keyword-search-p0-contract.test.mjs tests/keyword-trend-theme-setting.test.mjs`：通过，9/9。
- `chrome-devtools` MCP（2026-04-30）：真实页面弹窗快照已看到 `已选明星趋势主题 5/6` 在当前弹窗可视区域内直接显示。
- `chrome-devtools` MCP（2026-04-30）：已确认原生 `recommendTheme.json` 响应字段：`trendThemeInfo` 对应趋势红榜，`effectThemeInfo` 对应效果红榜，`capacityThemeInfo` 对应流量红榜。

## 增补修复（用户十一次修正：红榜最右标签列 + 手动联想搜索区）

### 执行计划（可核对）
- [x] 补齐三红榜列表最右侧标签/状态列，并保留原生分榜顺序。
- [x] 保留原生响应中的标签、周增幅、收藏加购等字段，避免渲染时丢指标。
- [x] 在红榜下方新增原生风格手动联想搜索区，展示快捷联想与结果表格。
- [x] 将手动联想结果接入当前勾选/已选主题逻辑，支持添加、移除和 6 个上限。
- [x] 更新回归测试覆盖新列、新搜索区和指标字段。
- [x] 构建、运行专项回归与语法检查，并用 `chrome-devtools` MCP 做真实页面复验。

### 增补改动摘要
- `normalizeTrendThemeItem` 现在保留 `recommendItemCount`、`wcvr`、周变化比例、`resourceType`、`trendLv` 和 `tagText` 等原生字段，避免红榜标签和手动联想指标在归一化时丢失。
- 三红榜表格新增最右列：趋势红榜显示 `趋势增长中 / 周增幅 ...`，效果红榜与流量红榜显示 `淘宝热搜 / 行业趋势 / 大促热销` 等原生标签。
- 修复趋势红榜状态列误用 `trendLv` 单字母等级的问题，趋势列优先读取周增幅与趋势状态，不再显示 `A`。
- 红榜下方新增原生风格手动联想搜索区，包含 `关键词 / 本店宝贝 / 竞店宝贝` 入口、`深度搜索`、快捷联想已选趋势、结果表格和添加/移除操作。
- 手动联想结果已并入候选池，和红榜勾选、底部已选浮条、6 个上限共用同一套选择逻辑。
- 回归测试新增红榜标签列、联想搜索区、联想结果勾选和指标字段保留断言。

### 增补验证记录
- `node scripts/build.mjs`：通过。
- `node --test tests/keyword-trend-theme-setting.test.mjs`：通过，3/3。
- `node --test tests/keyword-search-p0-contract.test.mjs tests/keyword-trend-theme-setting.test.mjs`：通过，9/9。
- `node --check "阿里妈妈多合一助手.js"`：通过。
- `chrome-devtools` MCP（2026-04-30）：真实 `one.alimama.com` 页面刷新后打开插件趋势主题弹窗，检测到红榜标签列前 8 项为 `趋势增长中 / 周增幅 13.8% / 周增幅 270.4% / ...`，不再显示 `A`。
- `chrome-devtools` MCP（2026-04-30）：真实页面弹窗检测到手动联想区，表头为 `趋势主题 / 推荐店铺商品数 / 趋势指数 / 搜索指数 / 竞争热度 / 收藏加购指数 / 转化指数 / 投产指数 / 操作`。
- `chrome-devtools` MCP（2026-04-30）：真实页面弹窗底部已选浮条仍为 `absolute` 固定在弹窗内部底部，当前显示 `已选明星趋势主题 5/6`。

## 增补修复（用户十二次修正：红榜标签完整显示 + 区域增高 + 已选浮条固定）

### 执行计划（可核对）
- [x] 放宽趋势红榜最右列宽度，确保 `趋势增长中 / 周增幅 xx%` 完整显示。
- [x] 按原生语义修正趋势标签颜色：增长状态为绿色，周增幅为红色；效果/流量标签按标签类型区分颜色。
- [x] 将红榜区域和下方手动联想搜索区高度提高约一倍，减少滚动压缩。
- [x] 把已选明星趋势主题浮条改为弹窗内悬浮固定层，不受弹窗内容滚动影响。
- [x] 更新回归测试并完成构建、专项测试、真实页面复验。

### 增补改动摘要
- 红榜行网格最右列从 `70px` 放宽到 `112px`，并为趋势红榜标签增加 `data-rank-tag-tone`，避免 `周增幅 270.4%` 等文案被截断。
- 标签颜色按语义区分：`趋势增长中` 为绿色，`周增幅` 为红色，`淘宝热搜` 为橙色，`行业趋势` 为蓝紫色，`大促热销` 为红色。
- 红榜区高度放大到 `420px`，手动联想区高度放大到 `380px`，弹窗高度提升到 `min(960px, calc(100vh - 16px))`。
- 已选明星趋势主题条改为相对专属弹窗的悬浮层，定位在底部操作按钮上方（`bottom:62px`），内容区滚动时不随内容移动。
- 更新趋势主题专项测试，覆盖悬浮层、放大高度和标签 tone 输出。

### 增补验证记录
- `node scripts/build.mjs`：通过。
- `node --test tests/keyword-trend-theme-setting.test.mjs`：通过，3/3。
- `node --test tests/keyword-search-p0-contract.test.mjs tests/keyword-trend-theme-setting.test.mjs`：通过，9/9。
- `node --check "阿里妈妈多合一助手.js"`：通过。
- `node scripts/build.mjs --check`：通过。
- `chrome-devtools` MCP（2026-04-30）：真实页面刷新后复验，弹窗尺寸 `1320x960`，红榜区域高度 `420px`，手动联想区高度 `380px`。
- `chrome-devtools` MCP（2026-04-30）：趋势红榜前 12 个标签均完整显示，示例 `趋势增长中 / 周增幅 13.8% / 周增幅 270.4%`；增长状态为绿色，周增幅为红色。
- `chrome-devtools` MCP（2026-04-30）：已选主题条 `position:absolute`，相对趋势主题弹窗悬浮在操作按钮上方，`bottom:62px`，内容滚动不改变位置。

---

# TODO - 2026-04-30 `onebpSearch` API 向导 P1 修复

## 需求规格
- 目标：
  - 完成上一轮对照检查中标记的 P1 问题，补齐关键词推广四类营销目标在默认策略、矩阵兜底、预算类型与请求预览层的目标感知行为；
  - 保持 P0 已修好的 `搜索卡位 / 趋势明星 / 流量金卡 / 自定义推广` UI 与最终请求契约不回退；
  - 用自动化回归和真实页面 `chrome-devtools` MCP 验证证明修复有效。
- 范围：
  - 默认策略列表、矩阵字段兜底、卡位方式兜底选项、自定义推广预算类型、请求预览覆盖逻辑；
  - `src/optimizer/keyword-plan-api/` 相关实现与 `tests/*.test.mjs` 回归测试；
  - 构建、语法、单测、review-team 和真实页面浏览器复验。
- 非目标：
  - 不真实提交计划；
  - 不重新摸排 `addList.md` 未覆盖的新分支；
  - 不处理 P2 的完整控件体验增强。

## 执行计划（可核对）
- [x] 静态核查 P1 五项清单，区分 P0 已覆盖项与仍需修复项。
- [x] 补齐或重构默认策略列表，使 `搜索卡位 / 趋势明星 / 流量金卡 / 自定义推广` 均有目标感知默认策略。
- [x] 按营销目标收敛矩阵兜底字段，确保四目标混合默认矩阵不注入 `卡位方式 / 匹配方式`。
- [x] 修正自定义推广智能出价预算类型，不再把文档样本应为 `day_average` 的链路强制为 `normal`。
- [x] 复核 `request-builder-preview.js` 的策略覆盖逻辑，确保不会覆盖 `搜索卡位 / 流量金卡 / 趋势明星 ROI` 原生字段。
- [x] 补充或更新回归测试，覆盖 P1 默认策略、矩阵兜底、预算类型和预览覆盖。
- [x] 运行构建、语法、全量测试和 `bash scripts/review-team.sh`。
- [x] 通过 `chrome-devtools` MCP 刷新真实页面并复验 P1 相关 UI/运行态。
- [x] 回填验证记录、结果复盘和剩余风险。

## 改动摘要
- 已补齐关键词推广默认策略列表，默认草稿现在直接包含 `搜索卡位 / 趋势明星 / 流量金卡 / 自定义推广` 四类目标，并为搜索卡位、流量金卡补齐目标感知的基础场景设置。
- 已把关键词推广矩阵兜底从场景级数组改为目标感知配置：四目标混合默认状态只展示安全维度；`卡位方式` 兜底选项补齐 `位置不限提升市场渗透`；趋势明星、流量金卡、自定义推广不会被矩阵默认注入 `卡位方式 / 匹配方式`。
- 已移除自定义推广智能出价下强制 `dmcType=normal` 的最终组包逻辑，恢复按真实来源与 `DEFAULTS.dmcType=day_average` 兜底。
- 已修正请求预览层的趋势明星出价目标读取优先级：趋势明星优先使用场景里的 `出价目标 / 优化目标`，避免策略默认 `conv` 覆盖 ROI。
- 已更新回归测试，覆盖默认策略四目标、矩阵目标感知兜底、`permeability` 选项、自定义推广预算类型、搜索/金卡固定目标与趋势明星 ROI 预览。

## 验证记录
- `node scripts/build.mjs`：通过，已重新生成根 userscript、packages 与 extension page bundle。
- `node scripts/build.mjs --check`：通过。
- `node --check "阿里妈妈多合一助手.js"`：通过。
- `node --test tests/keyword-search-p0-contract.test.mjs tests/keyword-custom-mode-wordpackage.test.mjs tests/keyword-custom-settings-sync.test.mjs tests/matrix-plan-config.test.mjs`：通过，61/61。
- `node --test tests/*.test.mjs`：通过，414 个测试，412 通过，2 个跳过；跳过项仍为既有可选 `agent-cluster/index.mjs` 缺失。
- `bash scripts/review-team.sh`：通过，最终输出 `All automated review checks passed.`。
- `chrome-devtools` MCP：已刷新真实 `one.alimama.com` 页面并确认插件运行态存在 `__AM_WXT_KEYWORD_API__`。
- `chrome-devtools` MCP：清空旧草稿后打开向导，默认策略列表为 4 个目标：`搜索卡位 / 趋势明星 / 流量金卡 / 自定义推广`，且预算类型均为 `day_average`。
- `chrome-devtools` MCP：矩阵页四目标混合默认状态未展示可注入的 `卡位方式 / 匹配方式` 场景维度，仅展示安全兜底维度。
- `chrome-devtools` MCP：搜索卡位编辑态仍展示 `卡位方式 / 匹配方式`，并包含 `位置不限提升市场渗透`。

## 结果复盘
- P1 的根因分成两类：默认策略仍停留在两目标时代，矩阵兜底仍按“关键词推广”整体注入字段，导致四目标默认策略扩展后更容易把 `卡位方式 / 匹配方式` 错写进不匹配目标。
- 修复策略采用“安全默认 + 目标感知”：默认策略补四目标；矩阵在混合目标默认状态只暴露不会污染目标契约的维度，目标相关字段必须由目标上下文明确驱动。
- 自定义推广预算类型不再在智能出价下强制改成 `normal`；后续若要支持用户显式选择每日预算，仍应通过场景预算字段进入，而不是在最终裁剪层无条件覆盖。
- 本轮未真实提交计划，避免影响线上投放；请求契约通过自动化测试和预览层源码契约覆盖，UI 运行态通过真实页面刷新复验。

---

# TODO - 2026-04-29 `onebpSearch` API 向导 P0 修复

## 需求规格
- 目标：
  - 修复关键词推广 API 向导 P0 问题，使 `搜索卡位`、`趋势明星`、`流量金卡`、`自定义推广` 的最终组包按各自真实请求契约保留关键字段；
  - 避免四类关键词营销目标继续统一套用 `自定义推广/智能出价` 的字段裁剪逻辑；
  - 补齐 P0 中明确要求的运行时默认值、字段映射、控件展示/隐藏和最终请求保留字段。
- 范围：
  - `src/optimizer/keyword-plan-api/` 下默认值、场景动态表单、请求预览、草稿组包与字段裁剪；
  - 覆盖 P0 关键字段的回归测试；
  - 构建、语法、单测和 review-team 验证。
- 非目标：
  - 不重新抓真实页面流量；
  - 不真实提交计划；
  - 不处理 P1/P2 中未被 P0 依赖的完整体验增强。

## 执行计划（可核对）
- [x] 定位 P0 涉及代码路径和现有测试契约，确认最小侵入方案。
- [x] 为四类关键词营销目标拆分目标感知的字段保留和默认映射。
- [x] 修复 `搜索卡位`、`趋势明星`、`流量金卡` 的 P0 运行时默认值、UI 控件和请求字段组包。
- [x] 补充或更新关键回归测试，覆盖 P0 字段不丢失与目标特异映射。
- [x] 运行 `node scripts/build.mjs --check`、`node --check "阿里妈妈多合一助手.js"`、`node --test tests/*.test.mjs`、`bash scripts/review-team.sh`。
- [x] 通过 `chrome-devtools` MCP 复验刷新插件后的真实页面 UI。
- [x] 回填验证记录、结果复盘和剩余风险。

## 改动摘要
- 已建立本次 P0 修复计划，待进入代码定位。
- 已确认核心落点：
  - `src/optimizer/keyword-plan-api/runtime.js`：关键词目标默认契约与动态字段兜底；
  - `src/optimizer/keyword-plan-api/wizard-scene-config/render-scene-dynamic-core.js`：编辑态控件展示/隐藏；
  - `src/optimizer/keyword-plan-api/request-builder-preview.js`：策略预览层对出价目标的通用覆盖；
  - `src/optimizer/keyword-plan-api/search-and-draft.js`：最终请求组包、字段保留和目标契约裁剪。
- 已完成四类关键词目标的目标感知运行时契约拆分：
  - `搜索卡位` 固定 `promotion_scene_search_detent / itemSelectedMode=search_detent / bidType=max_amount / dmcType=day_average / searchDetentType`；
  - `趋势明星` 固定 `promotion_scene_search_trend / itemSelectedMode=trend / trendType`，并区分普通智能目标、ROI 与平均直接成交成本契约；
  - `流量金卡` 固定 `promotion_scene_golden_traffic_card_package / itemSelectedMode=user_define / bidTargetV2=conv`，并保留套餐、订单与续投字段；
  - `自定义推广` 继续保留自定义智能/手动出价链路，并补齐 `aiMaxSwitch / aiMaxInfo` 等原生字段保留。
- 已修复真实页面复验暴露的 UI 残留：`趋势明星 / 流量金卡` 不再从通用关键词兜底里显示 `核心词设置 / 匹配方式 / 卡位方式 / 流量智选`。
- 已修复最终复验暴露的搜索卡位细节：`卡位方式` 只在 `搜索卡位` 下展示，并强制补齐 `位置不限提升市场渗透`；`自定义推广` 不再残留 `卡位方式`。
- 已新增 `tests/keyword-search-p0-contract.test.mjs`，并更新既有 UI 契约测试，覆盖 P0 默认值、字段保留、目标分支组包、编辑态隐藏和请求预览覆盖。

## 验证记录
- `node scripts/build.mjs`：通过，已重新生成根 userscript、packages 与 extension page bundle。
- `node scripts/build.mjs --check`：通过。
- `node --check "阿里妈妈多合一助手.js"`：通过。
- `node --test tests/keyword-search-p0-contract.test.mjs`：通过，5/5。
- `node --test tests/*.test.mjs`：通过，412 个测试，410 通过，2 个跳过；跳过项为既有可选 `agent-cluster/index.mjs` 缺失。
- `bash scripts/review-team.sh`：通过，最终输出 `All automated review checks passed.`。
- `chrome-devtools` MCP：已确认真实 `one.alimama.com` 页面、插件面板与 API 向导可打开；清空旧草稿后发现并修复了 `趋势明星` 仍显示通用 `匹配方式` 的 UI 残留。
- `chrome-devtools` MCP 最终复验：通过，真实页面 URL 为 `https://one.alimama.com/index.html#!/main/index?bizCode=onebpSearch&promotionScene=promotion_scene_search_detent&stepIndex=1&subStepIndex=0`。
  - `搜索卡位`：不显示通用 `出价方式 / 出价目标`，显示 `卡位方式`，并包含 `位置不限提升市场渗透`；保留 `匹配方式 / 手动关键词`。
  - `趋势明星`：显示 `出价方式 / 出价目标 / 平均直接成交成本`，不显示 `卡位方式 / 匹配方式 / 手动关键词`。
  - `流量金卡`：显示 `套餐卡 / 套餐包档位 / 套餐包自动续投 / 支付方式`，不显示 `出价方式 / 出价目标 / 卡位方式 / 匹配方式 / 手动关键词`。
  - `自定义推广`：显示 `出价方式 / 出价目标 / 匹配方式 / 手动关键词`，不显示 `卡位方式`。

## 结果复盘
- 本次根因是关键词推广四个营销目标此前共用“自定义推广/智能出价”模型，导致默认值、字段裁剪、请求预览和最终组包都会覆盖或丢弃非自定义目标的原生字段。
- 修复策略采用目标感知分支，而不是继续扩大单一 allowlist：默认值、UI 过滤、请求预览与最终裁剪均按 `搜索卡位 / 趋势明星 / 流量金卡 / 自定义推广` 分别处理。
- 真实页面复验发现旧草稿与通用兜底字段会掩盖新逻辑；后续复验必须先清空或切换到新草稿，避免用历史草稿判断当前实现。
- 本轮剩余风险：未真实提交计划，避免影响线上投放；最终请求契约通过自动化回归覆盖，真实页面复验覆盖到向导 UI 字段收敛。

---

# TODO - 2026-04-28 `onebpSearch` API 向导编辑选项对照检查

## 需求规格
- 目标：
  - 以 `addList.md` 作为关键词推广新建计划最终请求的唯一对照来源；
  - 检查插件“关键词推广批量建计划 API 向导”的编辑态选择项；
  - 明确哪些选项已正确覆盖、哪些漏配、哪些实现存在风险；
  - 建立可执行修复清单，暂不直接修改业务逻辑。
- 范围：
  - `onebpSearch` 下已沉淀的 `搜索卡位`、`趋势明星`、`流量金卡`、`自定义推广`；
  - 向导编辑 UI 的可见选择项、默认值、字段映射、提交组包相关逻辑；
  - 已有测试中的关键词推广契约。
- 非目标：
  - 不重新抓真实页面流量；
  - 不真实提交计划；
  - 不在本轮直接实现修复，除非后续明确要求。

## 执行计划（可核对）
- [x] 阅读并提取 `addList.md` 中 `onebpSearch` 控件与字段映射。
- [x] 定位 API 向导编辑 UI、场景配置、提交组包、测试覆盖。
- [x] 对照四类营销目标，标记已覆盖、遗漏、问题项。
- [x] 按优先级输出修复清单，包含预期字段与验证方式。
- [x] 回填本文件的结果复盘。

## 改动摘要
- 已建立本轮检查计划。
- 已完成 `addList.md` 第 17-20 章的 `onebpSearch` 样本对照，覆盖 `搜索卡位`、`趋势明星`、`流量金卡`、`自定义推广` 四个营销目标。
- 已完成 API 向导编辑态相关代码静态检查，重点检查默认策略、营销目标运行时映射、动态表单、请求预览、最终组包与字段裁剪逻辑。
- 本轮仅形成修复清单，未修改业务逻辑。

## 验证记录
- 已对照文档样本：
  - `搜索卡位`：`KS01-KS10`
  - `趋势明星`：`KT01-KT25`
  - `流量金卡`：`GK01-GK09`
  - `自定义推广`：`KD01-KD03`
- 已检查实现文件：
  - `src/optimizer/keyword-plan-api/runtime.js`
  - `src/optimizer/keyword-plan-api/wizard-style-and-state/defaults-and-presets.js`
  - `src/optimizer/keyword-plan-api/wizard-scene-config/render-scene-dynamic-core.js`
  - `src/optimizer/keyword-plan-api/request-builder-preview.js`
  - `src/optimizer/keyword-plan-api/search-and-draft.js`
- 已确认一个子代理完成 `addList.md` 字段提取；另一个实现检查子代理因额度中断，已由本轮本地静态检查补足。
- 本轮未运行构建或测试，因为未修改业务代码；后续实现修复时必须执行 `node scripts/build.mjs --check`、`node --check "阿里妈妈多合一助手.js"`、`node --test tests/*.test.mjs`，涉及 UI 后还需通过 `chrome-devtools` MCP 做真实页面验证。

## 结果复盘
- 已设置好的部分：
  - `关键词推广` 的营销目标候选已经包含 `搜索卡位 / 趋势明星 / 流量金卡 / 自定义推广`。
  - 营销目标切换后，运行时已有把 `promotionScene / itemSelectedMode` 同步进场景设置的基础逻辑。
  - 编辑态已有计划名称、预算、出价方式、部分出价目标、冷启加速、投放资源位、投放时间、投放地域、手动关键词等通用控件。
  - `自定义推广` 是当前覆盖最完整的目标，已有智能/手动出价、人群、成本约束、高级设置和手动关键词面板。
  - `冷启加速` 到 `campaignColdStartVO.coldStartStatus` 的基础映射已经存在。
- 总体问题：
  - 当前实现把四个关键词营销目标过度套进同一套“自定义推广/智能出价”模型，导致 UI 选择项、默认值、字段保留和最终组包都与 `addList.md` 的真实请求不完全一致。
  - 字段裁剪函数按通用 allowlist 处理全部关键词目标，会丢弃 `searchDetentType / trendType / trendThemeList / packageId / planId / orderInfo / orderAutoRenewalInfo / launchTime / aiMaxSwitch / aiMaxInfo` 等真实请求关键字段。
  - 动态表单对 `趋势明星`、`流量金卡` 仍展示 `卡位方式 / 匹配方式 / 手动关键词` 这类不匹配控件，反而缺少主题、套餐、自动续投、人群目标等真实控件。
- P0 修复清单：
  - 为 `搜索卡位 / 趋势明星 / 流量金卡 / 自定义推广` 拆分独立的关键词目标契约，不再把全部关键词目标统一走 `pruneKeywordCampaignForCustomScene`。
  - `搜索卡位` 需要把 `卡位方式` 映射为 `searchDetentType`，补齐 `permeability`，使用真实 `bidType=max_amount` 和 `dmcType=day_average`，隐藏通用智能出价目标和平均直接成交成本。
  - `趋势明星` 需要移除 `卡位方式 / 匹配方式 / 手动关键词`，新增并保留 `trendType / trendThemeList / itemIdList / adgroupList / crowdList / adzoneList / launchAreaStrList / launchPeriodList`。
  - `趋势明星` 的出价目标需要按真实请求处理：`conv / click / coll_cart` 保持普通智能目标，`roi` 只保留 `bidTargetV2=roi + constraintType=roi + constraintValue`，平均直接成交成本走 `setSingleCostV2=true + constraintType=dir_conv + constraintValue` 且不提交 `optimizeTarget`。
  - `流量金卡` 需要把运行时默认修正为 `itemSelectedMode=user_define`、`bidTargetV2=conv`，并新增套餐卡、套餐包档位、自动续投、支付方式、冷启开关等控件与字段保留。
  - 最终组包需要按目标保留真实字段，至少补齐 `searchDetentType`、`trendType`、`trendThemeList`、`packageId`、`packageTemplateId`、`planId`、`planTemplateId`、`orderInfo`、`orderAutoRenewalInfo`、`orderChargeType`、`launchTime`、`aiMaxSwitch`、`aiMaxInfo`。
- P1 修复清单：
  - 默认策略列表当前只有 `趋势明星` 与 `自定义推广`，需要补齐或改造成能覆盖 `搜索卡位` 与 `流量金卡`。
  - 矩阵兜底配置需要按营销目标分组，避免给 `趋势明星 / 流量金卡 / 自定义推广` 注入 `卡位方式 / 匹配方式`。
  - `卡位方式` 兜底选项缺少 `位置不限提升市场渗透`，需要补齐并映射为 `permeability`。
  - `自定义推广` 需要保留 `aiMaxSwitch / aiMaxInfo`，并修正智能出价下把预算类型强制改为 `normal` 的逻辑，文档样本为 `dmcType=day_average`。
  - `request-builder-preview.js` 当前会用策略出价目标覆盖场景设置，后续需要改为目标感知，避免覆盖 `搜索卡位 / 流量金卡 / 趋势明星 ROI` 的原生字段。
- P2 修复清单：
  - 为四个营销目标分别补回归测试，断言 UI 设置到最终 `solution/addList.json` 请求体的关键字段。
  - 后续如果要完整支持 `自定义推广` 的出价目标、成本约束、预算类型、高级设置，还需要继续补抓 `addList.md`。
  - 后续如果要完整支持 `流量金卡` 的自动续投门槛与支付方式，还需要再次抓取有效样本，因为当前 `GK08 / GK09` 样本未观察到阈值和支付方式真实落库。

---

# TODO - 2026-04-28 `onebpSearch` 关键词推广提交流量摸排

## 需求规格
- 目标：
  - 在真实 `one.alimama.com` 页面继续覆盖“下一个场景”，默认从 `关键词推广` 开始；
  - 先确认该场景的 `bizCode`、默认营销目标、商品前置条件与提交前最后一跳接口；
  - 继续沿用离线提交方式，逐步沉淀到 `addList.md`。
- 范围：
  - Chrome DevTools MCP 真实页面测试；
  - `关键词推广` 的页面结构梳理、前置条件确认、离线提交抓包；
  - `tasks/todo.md` 进度同步。
- 非目标：
  - 不真实提交计划；
  - 不修改业务代码；
  - 本轮先从 `关键词推广` 开始，不承诺一次覆盖完全部关键词子场景。

## 执行计划（可核对）
- [x] 恢复 DevTools 连接并切回真实阿里妈妈页面。
- [x] 切换到下一个场景 `关键词推广`，确认 URL 与默认营销目标。
- [x] 跑通 `关键词推广` 当前默认子场景的离线提交，确认接口与请求体结构。
- [x] 梳理该场景的首批可确认分支，并补写到 `addList.md`。
- [x] 回填验证记录与结果复盘。
- [x] 补抓“核心词设置 -> 添加关键词”入口及其对 `wordList` 的影响。
- [x] 补抓“手动输入添加关键词”入口及其对 `wordList` 的影响。
- [x] 补抓“清空关键词”入口及页面阻塞/提交前置条件。
- [x] 补抓“广泛 / 中心词 / 精准”切换对 `wordList.matchScope` 的影响。
- [x] 重新验证 `位置不限提升市场渗透` 的真实选中行为与提交字段。
- [x] 切换到下一个关键词营销目标，抓取新的基线提交结构。
- [x] 补抓 `趋势明星 -> 设置平均直接成交成本` 的默认档、分档与自定义值。
- [x] 补抓 `趋势明星 -> 设置优先投放客户 / 人群优化目标` 总开关对 `crowdList` 的影响。
- [x] 补抓 `趋势明星 -> 新客户获取 / 流失老客挽回 / 高价值客户获取` 三个人群开关。
- [x] 验证 `趋势明星` 的人群倍率输入是否真实落到提交体。
- [x] 补抓 `趋势明星 -> 选择趋势主题` 对 `trendThemeList` 的影响。
- [x] 补抓 `趋势明星 -> 添加自选商品` 对 `itemIdList / adgroupList` 的影响。
- [x] 补抓 `趋势明星 -> 清空` 对 `trendThemeList / itemIdList / adgroupList` 的影响。
- [x] 补抓 `趋势明星 -> 高级设置 -> 投放地域 / 投放时间` 的非默认提交结构。
- [x] 复核 `趋势明星 -> 设置平均直接成交成本` 的默认档是否为动态值。
- [x] 补抓 `流量金卡` 基线、解决方案卡切换与套餐包档位切换。
- [x] 补抓 `流量金卡` 的冷启开关与套餐包自动续投开关。
- [x] 补抓 `自定义推广` 基线（含加商品后可提交态）。
- [x] 补抓 `自定义推广 -> AI点睛` 关闭后的可提交分支。
- [x] 补抓 `趋势明星 -> 高级设置 -> 投放资源位` 的非默认结构。

## 改动摘要
- 已从 `货品全站推广` 切换到 `关键词推广`。
- 当前页面 URL：
  - `https://one.alimama.com/index.html#!/main/index?bizCode=onebpSearch&promotionScene=promotion_scene_search_detent`
- 当前默认营销目标：
  - `搜索卡位`
- 已把 `关键词推广 -> 搜索卡位` 的基线样本与首批分支写入 `addList.md`：
  - `KS01` 基线
  - `KS02` 抢前三
  - `KS03` 抢首页
  - `KS04` 冷启加速 = 关
  - `KS05` 添加关键词（推荐词：美的小魔方）
  - `KS06` 手动输入关键词（方太水槽）
  - `KS07` 手动词匹配方式 = 中心词
  - `KS08` 手动词匹配方式 = 精准
  - `KS09` 清空关键词
  - `KS10` 位置不限提升市场渗透
- 已新增 `关键词推广 -> 趋势明星` 的基线与首批分支：
  - `KT01` 基线
  - `KT02` 冷启加速 = 关
  - `KT03` 出价目标 = 增加点击量
  - `KT04` 出价目标 = 增加收藏加购量
  - `KT05` 出价目标 = 稳定投产比（推荐档 6.89）
  - `KT06` 稳定投产比档位 = 5.51
  - `KT07` 稳定投产比档位 = 8.27
  - `KT08` 稳定投产比档位 = 自定义 7.11
- 已继续补齐 `趋势明星` 的成本与人群层：
  - `KT09` 平均直接成交成本 = 默认档 370.9
  - `KT10` 平均直接成交成本 = 445.08
  - `KT11` 平均直接成交成本 = 296.72
  - `KT12` 平均直接成交成本 = 自定义 333.33
  - `KT13` 设置优先投放客户 = 关
  - `KT14` 人群优化目标 = 关
  - `KT15` 新客户获取 = 关
  - `KT16` 流失老客挽回 = 关
  - `KT17` 高价值客户获取 = 关
  - `KT18` 新客户倍率 = 1.8
  - `KT19` 高价值客户倍率 = 1.6
- 已继续补齐 `趋势明星` 的商品与主题层：
  - `KT20` 选择趋势主题 = 补满第 6 个主题（美的酷省电二代空调）
  - `KT21` 清空 = 趋势主题与商品全部清空
  - `KT22` 添加自选商品 = 新增 `1029803691231`
- 已继续补齐 `趋势明星` 的高级设置层：
  - `KT23` 投放地域 = 取消上海
  - `KT24` 投放时间 = `08:00-13:00`
- 已追加复核 `趋势明星 -> 设置平均直接成交成本`：
  - 旧样本默认档 `constraintValue = 370.9`
  - 当前页面在 `dayAverageBudget = 1430` 下，默认档已变为 `362.56`
  - 结论：默认档是动态值，不能硬编码
- 已补齐用户指出的遗漏点：
  - `核心词设置 -> 添加关键词`
- 已新增 `关键词推广 -> 流量金卡` 的基线与首批分支：
  - `GK01` 类目精准词卡基线（`packageId=47, planId=171, orderAmount=500`）
  - `GK02` 百亿秒杀节-大促成交抢量卡（`packageId=2008, planId=158, orderAmount=3000`）
  - `GK03` 一人食炖煮家电高转化卡（补商品到 `8/30` 后可提交）
  - `GK04` 增量畅享包（`planId=228, orderAmount=10000`）
  - `GK05` 自定义成交包（`planId=229, orderAmount=30000`）
  - `GK06` 冷启加速=关（`coldStartStatus=0`）
  - `GK07` 套餐包自动续投=关（`orderAutoRenewalSwitch=0`）
  - `GK08` 设置自动续投门槛（当前样本 `orderAutoRenewalCondition` 仍为空）
  - `GK09` 点击支付宝支付（当前样本 `orderChargeType` 仍为 `balance_charge`）
- 已新增 `关键词推广 -> 自定义推广` 基线：
  - `KD01` 自定义选品基线（加商品后）：
    - `promotionScene=promotion_scene_search_user_define`
    - `itemSelectedMode=user_define`
    - `bidTypeV2=smart_bid`
    - `bidTargetV2/optimizeTarget=conv`
    - `dmcType=day_average, dayAverageBudget=1480`
    - `itemIdListLength=8, adgroupListLength=8`
- 已补齐 `自定义推广` 的关键分支：
  - `KD02` `AI点睛=关`（`aiMaxSwitch=0`）
  - `KD03` `核心词设置->添加关键词(洗碗机家用全自动)`（新增词同步写入全部 `8` 个 adgroup）
- 已补齐 `趋势明星` 的高级设置最后分支：
  - `KT25` `投放资源位=仅1个开启`（`adzoneList` 呈现 `pause + start` 组合）

## 验证记录
- 浏览器连接：
  - `http://127.0.0.1:9222/json/version` 正常返回 `webSocketDebuggerUrl`
  - `chrome-devtools` MCP 可正常列出并切换页签
- 页面切换：
  - 已成功从 `onebpSite` 切到 `onebpSearch`
  - 当前默认子目标为 `搜索卡位`
- 离线提交：
  - 已通过 `一键上车` 自动加入 `5` 个商品
  - 页面自动带出 `dayAverageBudget = 1640`
  - 离线提交命中：
    - `POST https://one.alimama.com/solution/addList.json?...&bizCode=onebpSearch`
- 添加关键词补抓：
  - 已打开 `添加关键词` 弹窗并勾选推荐词 `美的小魔方`
  - 确认后主页面从 `10` 个关键词变为 `11` 个关键词
  - 为保证可提交态，重新通过 `一键上车` 恢复 `5` 个商品后执行离线触发
- 手动输入与匹配方式补抓：
  - 已通过 `点击此处可手动输入添加关键词` 新增手动词 `方太水槽`
  - 确认后主页面从 `11` 个关键词变为 `12` 个关键词
  - 手动词对象已确认带 `isManual = true`、`originalWord = "方太水槽"`、默认 `matchScope = "4"`
  - 已确认 `matchScope` 映射：
    - `广泛 = "4"`
    - `中心词 = "16"`
    - `精准 = "1"`
- 清空补抓：
  - 点击 `清空` 后无二次确认，关键词立即归零
  - 商品区域同时回落到 `0 / 30`
  - 即便页面进入空态，离线点击 `创建完成` 仍会发 `POST addList.json`
- `位置不限提升市场渗透` 复抓：
  - 已确认该分支真实可选，最终提交不是 `home_page`
  - 真实提交字段为：
    - `searchDetentType = permeability`
  - 页面存在一个关键行为：
    - 先选 `位置不限提升市场渗透` 再 `一键上车` 加商品时，页面会自动重置回 `抢首条`
    - 提交前必须重新选一次 `位置不限提升市场渗透`
- `趋势明星` 基线补抓：
  - 已成功切到：
    - `https://one.alimama.com/index.html#!/main/index?bizCode=onebpSearch&promotionScene=promotion_scene_search_trend`
  - 离线提交仍命中：
    - `POST https://one.alimama.com/solution/addList.json?...&bizCode=onebpSearch`
  - 已确认基线结构核心字段：
    - `promotionScene = promotion_scene_search_trend`
    - `itemSelectedMode = trend`
    - `trendType = 0`
    - `bidTypeV2 = smart_bid`
    - `bidTargetV2 = conv`
    - `optimizeTarget = conv`
    - `trendThemeListLength = 5`
    - `itemIdListLength = 9`
    - `adgroupListLength = 9`
    - `crowdListLength = 5`
    - `campaignColdStartVO.coldStartStatus = 1`
    - `dayAverageBudget = 1640`
- `趋势明星` 分支补抓：
  - 已确认冷启加速关闭后：
    - `campaignColdStartVO.coldStartStatus = 0`
  - 页面可见 checkbox 直接点击时曾出现：
    - `系统异常，请稍后重试。status=0`
  - 但底层开关实际切换后，请求体会稳定带出 `coldStartStatus = 0`
  - 已确认出价目标映射：
    - `获取成交量 = bidTargetV2 / optimizeTarget = conv`
    - `增加收藏加购量 = bidTargetV2 / optimizeTarget = coll_cart`
    - `增加点击量 = bidTargetV2 / optimizeTarget = click`
    - `稳定投产比 = bidTargetV2 = roi`，且不再提交 `optimizeTarget / setSingleCostV2`
  - 已确认 `稳定投产比` 额外字段：
    - `constraintType = roi`
    - `constraintValue` 会随档位变化
  - 已确认的 ROI 档位：
    - `5.51`
    - `6.89`
    - `8.27`
    - `自定义 7.11`
  - 已确认 `设置平均直接成交成本` 会改写提交模型：
    - `bidTargetV2` 仍是 `conv`
    - 新增：
      - `setSingleCostV2 = true`
      - `constraintType = dir_conv`
      - `constraintValue`
    - `optimizeTarget` 不再提交
  - 已确认的平均直接成交成本档位：
    - 默认档 `370.9`
    - `445.08`
    - `296.72`
    - 自定义 `333.33`
  - 已确认人群总开关行为：
    - `设置优先投放客户 = 关 -> crowdList = []`
    - `人群优化目标 = 关 -> crowdList = []`
  - 已确认客群开关到 `crowdList` 的映射：
    - `新客户获取 = 关 -> 删除 3008_3000949_3000949`
    - `流失老客挽回 = 关 -> 删除 3009_3000951_3000951`
    - `高价值客户获取 = 关 -> 一次性删除 3 条 3010_*`
  - 已确认倍率字段会真实落到 `crowdList.price.discount`：
    - 基线 `1.3 / 1.5 / 1.3 -> 30 / 50 / 30`
    - 自定义样本：
      - `新客户 1.8 -> 80`
      - `高价值 1.6 -> 60 / 60 / 60`
  - 已确认 `选择趋势主题` 补到第 6 个主题后：
    - `trendThemeListLength = 6`
    - 新增主题：
      - `895617013 / 美的酷省电二代空调 / itemCount = 0`
    - `itemIdListLength / adgroupListLength` 仍保持 `9`
  - 已确认 `清空` 后：
    - `trendThemeList = []`
    - `itemIdList = []`
    - `adgroupList = []`
    - `campaignColdStartVO.coldStartStatus = 0`
    - `crowdList / adzoneList / launchAreaStrList / launchPeriodList` 仍保留默认值
  - 已确认 `添加自选商品` 样本：
    - 为避免真实提交，改用页面内拦截 `addList.json` 的方式取最终请求体
    - 新增商品：
      - `1029803691231 / 美的洗碗机V6pro灶下家用15套大容量全自动热风烘干消毒一体机`
    - `itemIdListLength = 10`
    - `adgroupListLength = 10`
    - `trendThemeListLength` 仍为 `6`
    - 页面“将暂停全站推场景计划”提示未进入请求体
  - 页面存在一个重要联动异常：
    - 关闭单个客群时，界面上的 `人群优化目标` 会被联动取消选中
    - 但真实提交仍会保留剩余 `crowdList`
- `流量金卡` 分支补抓：
  - 已确认三张解决方案卡会整体切换模板（包/词/货/周期联动变化）：
    - `类目精准词卡`：`packageId=47, planId=171, itemIdListLength=5, wordListLength=0`
    - `百亿秒杀节-大促成交抢量卡`：`packageId=2008, planId=158, itemIdListLength=3`
    - `一人食炖煮家电高转化卡`：先补商品到 `8/30` 后可提交，`packageId=2004, planId=227, wordListLength=49`
  - 已确认套餐包档位映射（基于一人食卡）：
    - `基础起量包 -> planId=227, orderAmount=3000`
    - `增量畅享包 -> planId=228, orderAmount=10000`
    - `自定义成交包 -> planId=229, orderAmount=30000`
  - 已确认开关行为：
    - `冷启加速=关 -> campaignColdStartVO.coldStartStatus=0`
    - `套餐包自动续投=关 -> orderAutoRenewalInfo.orderAutoRenewalSwitch=0`
  - 已确认当前限制：
    - `设置自动续投门槛` 当前样本未写入有效阈值（`orderAutoRenewalCondition` 仍为空）
    - 点击 `支付宝支付` 后当前样本仍是 `orderChargeType=balance_charge`
- `自定义推广` 补抓：
  - 已确认可提交基线 `KD01`（需先加商品到 `8/30`）
  - 已确认 `AI点睛=关` 可稳定触发 `addList.json`
  - 已确认 `核心词设置 -> 添加关键词` 会改写 `adgroupList[*].wordList`
- 已确认字段：
  - `promotionScene = promotion_scene_search_detent`
  - `itemSelectedMode = search_detent`
  - `searchDetentType`
  - `campaignColdStartVO.coldStartStatus`
  - `wordList`
  - `wordPackageList`
  - `itemIdList`
  - `adzoneList`
  - `launchAreaStrList`
  - `launchPeriodList`
  - `dmcType = day_average`
  - `dayAverageBudget = 1640`
- 已确认分支：
  - `抢首条 -> searchDetentType = first_place`
  - `抢前三 -> searchDetentType = third_place`
  - `抢首页 -> searchDetentType = home_page`
  - `冷启加速 = 关 -> campaignColdStartVO.coldStartStatus = 0`
  - `添加关键词（推荐词：美的小魔方） -> wordListCount = 11，新增词插入 wordList[0]，matchScope = "4"，recReason = "aiRecWord"`
  - `手动输入关键词（方太水槽） -> wordListCount = 12，wordList[0].isManual = true，originalWord = "方太水槽"`
  - `手动词切到中心词 -> wordList[0].matchScope = "16"`
  - `手动词切到精准 -> wordList[0].matchScope = "1"`
  - `清空关键词 -> wordList = []，itemIdList = []，adgroupList = []，但仍会 POST addList.json`
  - `位置不限提升市场渗透 -> searchDetentType = permeability`
  - `趋势明星基线 -> bidTypeV2 = smart_bid，bidTargetV2 = conv，optimizeTarget = conv，trendThemeListLength = 5，itemIdListLength = 9，crowdListLength = 5`
  - `趋势明星冷启加速 = 关 -> campaignColdStartVO.coldStartStatus = 0`
  - `趋势明星出价目标 = 增加收藏加购量 -> bidTargetV2 / optimizeTarget = coll_cart`
  - `趋势明星出价目标 = 增加点击量 -> bidTargetV2 / optimizeTarget = click`
  - `趋势明星出价目标 = 稳定投产比 -> bidTargetV2 = roi，新增 constraintType = roi / constraintValue，且不再提交 optimizeTarget / setSingleCostV2`
  - `趋势明星稳定投产比档位 5.51 -> constraintValue = 5.51`
  - `趋势明星稳定投产比档位 8.27 -> constraintValue = 8.27`
  - `趋势明星稳定投产比自定义 7.11 -> constraintValue = 7.11`
  - `趋势明星平均直接成交成本默认档 370.9 -> setSingleCostV2 = true，constraintType = dir_conv，constraintValue = 370.9，且不再提交 optimizeTarget`
  - `趋势明星平均直接成交成本 445.08 -> constraintValue = 445.08`
  - `趋势明星平均直接成交成本 296.72 -> constraintValue = 296.72`
  - `趋势明星平均直接成交成本自定义 333.33 -> constraintValue = 333.33`
  - `趋势明星设置优先投放客户 = 关 -> crowdList = []`
  - `趋势明星人群优化目标 = 关 -> crowdList = []`
  - `趋势明星新客户获取 = 关 -> crowdList 删除 3008_3000949_3000949`
  - `趋势明星流失老客挽回 = 关 -> crowdList 删除 3009_3000951_3000951`
  - `趋势明星高价值客户获取 = 关 -> crowdList 仅剩 3008 / 3009 两条`
  - `趋势明星新客户倍率 1.8 -> 3008 对应 discount = 80`
  - `趋势明星高价值客户倍率 1.6 -> 全部 3010_* 对应 discount = 60`
  - `趋势明星选择趋势主题补到 6 个 -> trendThemeList[5] = 895617013 / 美的酷省电二代空调 / itemCount = 0，itemIdListLength 仍为 9`
  - `趋势明星清空 -> trendThemeList = []，itemIdList = []，adgroupList = []，coldStartStatus = 0`
  - `趋势明星添加自选商品 1029803691231 -> itemIdListLength = 10，adgroupListLength = 10，trendThemeListLength 仍为 6`
  - `流量金卡类目精准词卡基线 -> packageId=47，planId=171，orderAmount=500，wordListLength=0，itemIdListLength=5`
  - `流量金卡百亿秒杀节基线 -> packageId=2008，planId=158，orderAmount=3000，itemIdListLength=3`
  - `流量金卡一人食基线（补商品后） -> packageId=2004，planId=227，orderAmount=3000，wordListLength=49，itemIdListLength=8`
  - `流量金卡一人食增量畅享包 -> planId=228，orderAmount=10000`
  - `流量金卡一人食自定义成交包 -> planId=229，orderAmount=30000`
  - `流量金卡冷启加速=关 -> coldStartStatus=0`
  - `流量金卡自动续投=关 -> orderAutoRenewalSwitch=0，且无二次确认弹窗`
  - `流量金卡自动续投门槛勾选 -> orderAutoRenewalCondition 仍为空`
  - `流量金卡点击支付宝支付 -> 当前样本 orderChargeType 仍为 balance_charge`
  - `自定义推广基线（KD01） -> promotionScene=promotion_scene_search_user_define，bidTypeV2=smart_bid，bidTargetV2/optimizeTarget=conv，dayAverageBudget=1480，itemIdListLength=8`
  - `自定义推广 AI点睛=关（KD02） -> aiMaxSwitch=0，aiMaxInfo.aiMaxSwitch=0，itemIdListLength=8，adgroupListLength=8`
  - `自定义推广添加关键词（KD03） -> 新词“洗碗机家用全自动”进入全部8个adgroup.wordList，matchScope=1，isManual=true`
  - `趋势明星高级设置投放资源位（KT25） -> adzoneList: 114790550288=status pause，114786650498=status start`

## 结果复盘
- `onebpSearch` 的默认 `搜索卡位` 和 `onebpSite` 结构差异很大，后续开发不能复用全站推广的 ROI/起量模型。
- 这个场景的核心不是 ROI，而是：
  - `wordList`
  - `wordPackageList`
  - `searchDetentType`
  - `campaignColdStartVO`
  - `adzoneList / launchAreaStrList / launchPeriodList`
- 已补齐本轮明确遗漏点：
  - `核心词设置 -> 添加关键词` 已单独记录，且确认它不会改写商品、卡位方式、预算类型等基线结构，只会扩展 `wordList` 并追加 `aiword` 恢复信息。
- 核心词设置这组高频分支目前已补齐：
  - 推荐词新增
  - 手动输入新增
  - `广泛 / 中心词 / 精准` 三档映射
  - 清空关键词
- `位置不限提升市场渗透` 也已从“待确认”转为“已确认”：
  - 真实值是 `permeability`
  - 但“先选卡位再加商品”会被页面重置，自动化顺序必须调整为“加商品后再选卡位”
- `趋势明星` 与 `搜索卡位` 的结构差异已经明确：
  - `搜索卡位` 以 `wordList / searchDetentType` 为核心
  - `趋势明星` 以 `trendThemeList / crowdList / bidTargetV2` 为核心
- `趋势明星 -> 高级设置` 追加验证：
  - `投放地域` 从 `["all"]` 切为部分地域后，会改成数值型 `launchAreaStrList`
  - `投放时间` 编辑态虽然是半小时网格，但提交体会压缩成 `launchPeriodList`
  - `08:00-13:00` 样本已确认会序列化为每周 `7` 条、每条 `3` 段的 `timeSpanList`
  - `投放资源位` 关闭单个资源位后，提交体不是删项，而是对应 `adzone.status` 由 `start` 变为 `pause`
- `趋势明星 -> 稳定投产比` 还存在一层子配置：
  - 同样是 `bidTargetV2 = roi`，真正决定 ROI 强弱的是 `constraintValue`
  - 后续开发不能只识别“是否 ROI”，还要序列化具体档位或自定义值
- `趋势明星 -> 设置平均直接成交成本` 是另一条独立的 `conv` 约束链路：
  - 它不是简单布尔开关，而是改为 `setSingleCostV2 + constraintType = dir_conv + constraintValue`
  - 后续开发不能把它和普通 `conv / optimizeTarget` 混成同一结构
  - 补充复核已确认 `constraintValue` 会随页面当前预算/商品状态变化，默认档并不固定
- `趋势明星 -> crowdList` 不是按 UI 行数一一对应：
  - `新客户获取 = 1` 条
  - `流失老客挽回 = 1` 条
  - `高价值客户获取 = 3` 条
- `趋势明星` 的剩余商品层也已经明确：
  - `补主题` 只改 `trendThemeList`
  - `加自选商品` 只扩 `itemIdList / adgroupList`
  - `清空` 会一起清空 `trendThemeList / itemIdList / adgroupList`
- 从多组样本可推断倍率与折扣的换算规则是：
  - `price.discount ≈ (倍率 - 1) * 100`
- 单个人群关闭会把 `人群优化目标` 的视觉状态一起取消，但请求体仍会带剩余人群：
  - 自动化与后续开发必须以真实请求字段为准，不能只靠页面选中态判断
- 离线断网并不总能稳定拿到提交体：
  - `添加自选商品` 这条分支在断网下出现过状态回退且不发 `addList.json`
  - 后续若仍要求“只模拟不提交”，优先用页面内拦截 `addList.json` 的方式取参数，再阻断真实发送
- 当前仍待继续覆盖的上层分支：
  - `自定义推广 -> 出价目标 / 成本约束 / 预算类型` 分支
  - `流量金卡 -> 关键词设置 / 人群屏蔽` 的提交体差异

---

# TODO - 2026-04-28 `addList.md` 整理为开发文档

## 需求规格
- 目标：
  - 将仓库根目录 `addList.md` 从“抓包流水账”整理成“后续开发可直接查阅”的开发文档；
  - 保留真实页面抓取得到的关键请求结构、字段映射、分支差异、异常样本与覆盖范围；
  - 让后续开发在不回看会话的情况下，也能直接据此实现 `addList.json` 组包、字段映射与异常兼容。
- 范围：
  - 重构 `addList.md` 文档结构与章节表达；
  - 在 `tasks/todo.md` 回填计划、执行摘要与整理结果。
- 非目标：
  - 不新增新的页面抓包；
  - 不修改业务代码；
  - 不改动既有样本含义，仅调整表达与归类方式。

## 执行计划（可核对）
- [x] 盘点 `addList.md` 现有信息，区分“接口事实”“分支样本”“开发注意事项”三类内容。
- [x] 按开发文档格式重组 `addList.md`，补齐总览、字段映射、覆盖矩阵、异常说明与样本附录。
- [x] 自检文档可读性与信息完整度，并回填本节结果复盘。

## 改动摘要
- `addList.md`
  - 标题从“提交流量记录”重构为“`addList.json` 开发文档”；
  - 新增“开发先读”“接口总览”“字段映射”“样本索引”“已知异常”“后续追加规则”等章节；
  - 原有 `onebpSite` 13 条样本全部保留，但重排为“基线 + 分支附录”的开发向结构；
  - 把 `algoPredictionExtraInfo` 独立为附录，并明确其“结构可参考、数值不可硬编码”的开发语义。

## 验证记录
- 文档结构自检：
  - 已确认 `addList.md` 具备 13 个一级/二级开发章节，覆盖“抓取方式、接口结构、字段映射、样本附录、异常说明、追加规则”。
  - 已确认 `S01` 到 `S13` 样本索引与详细附录均保留，未丢失已有抓包结论。
  - 已确认关键异常样本仍保留：
    - `campaignGroupId = null`
    - `campaignGroupName = "小白鲸"`
- 自动化测试：
  - 本次仅整理文档，未修改业务代码，未运行测试。

## 结果复盘
- `addList.md` 已从“按时间堆叠的抓包流水账”转成“面向开发实现的结构化文档”，后续做 `addList.json` 组包时可先看字段映射，再按样本附录核对分支差异。
- 这次整理保留了全部已抓取事实，但把“接口事实”“字段语义”“分支样本”“已知异常”四类信息拆开，后续查文档不需要再全文扫读。

---

# TODO - 2026-04-15 出价调控保留 + 新增净投产比调控并存

## 需求规格
- 目标：
  - 不删除“出价调控（bidConstraintValue）”；
  - 在手动设置与方案展示中新增并保留“净投产比调控（netBidConstraintValue）”；
  - 面板未配置/未勾选的方案默认不执行；
  - 方案名称全量展示，状态独立展示，详情保留方案介绍。
- 范围：
  - `src/optimizer/ui.js`（方案表映射、弹窗读取、手动面板模板/读写/回填）；
  - `tests/optimizer-escort-new-flow-fallback.test.mjs`（文案与结构断言）；
  - 浏览器实页“立即检查并优化”复测。
- 非目标：
  - 不改 openV3 请求结构；
  - 不改与护航无关逻辑。

## 执行计划（可核对）
- [x] 补齐 `ui.js` 里出价/净投产比双方案的名称、详情、读取与手动表单字段。
- [x] 更新测试断言，确保“出价调控 + 净投产比调控并存”长期稳定。
- [x] 运行目标测试、全量测试与构建校验。
- [x] 在真实阿里妈妈页面点击“立即检查并优化”验证勾选与执行一致。

## 改动摘要
- `src/optimizer/ui.js`
  - `escortSettingTable` 默认顺序保留并新增双方案：`出价调控(bidConstraintValue)` + `净投产比调控(netBidConstraintValue)`；
  - 详情文案拆分为两条默认说明：出价与净投产比分别兜底；
  - 护航弹窗精确读取补齐三路映射：出价/净投产比/预算，分别读取开关、区间、次数、次日恢复；
  - 手动设置面板新增“净投产比调控”独立卡片（`manual-net-bid-*`），并保留“出价调控”原卡片；
  - 表单读写/回填/主从勾选同步逻辑均纳入 `netBidConstraintValue`。
- `tests/optimizer-escort-new-flow-fallback.test.mjs`
  - 更新全量方案顺序断言为包含 `netBidConstraintValue`；
  - 更新详情兜底断言为“出价 + 净投产比 + 预算”三路；
  - 更新手动面板断言为“双入口并存（manual-bid-enabled + manual-net-bid-enabled）”；
  - 更新弹窗精确读取断言为“出价/净投产比/预算”三路标签匹配。

## 验证记录
- `node --test tests/optimizer-escort-new-flow-fallback.test.mjs`
  - 结果：`35/35 passed`
- `node scripts/build.mjs`
  - 结果：构建成功（v7.02）
- `node --test tests/*.test.mjs`
  - 结果：`403 passed, 0 failed, 2 skipped`
- 浏览器实页（`one.alimama.com`，点击“立即扫描并优化”）
  - 关键日志：
    - `使用手动设置参数（未勾选）：6 个设置项`
    - 方案表同时展示：
      - `出价调控` -> `未勾选`
      - `净投产比调控` -> `未勾选`
      - `预算调控` -> `未勾选`
      - `添加关键词/切换关键词匹配方式/屏蔽关键词` -> `未勾选`
  - 结论：手动未勾选时不执行，且“出价调控 + 净投产比调控”并存显示生效。

## 结果复盘
- 根因：之前把 `bidConstraintValue` 语义替换成净投产比，导致“新增需求”被误做成“替换方案”。
- 修复：恢复出价方案原语义，新增 `netBidConstraintValue` 独立链路，并在展示、读取、手动面板、回归测试四层同步落地。

---

# TODO - 2026-04-15 手动设置与方案执行映射一致性（净投产比调控补齐）

## 需求规格
- 目标：
  - 手动设置面板中补齐“净投产比调控”配置入口（参考预算/原出价调控卡片）；
  - 方案表“方案名称”需全量展示，不因是否执行而缺失；
  - 若手动设置未开启对应方案，则默认不执行；
  - 保留方案详情介绍文案，不回退为错误状态语义。
- 范围：
  - `src/optimizer/ui.js` 手动设置 UI、读取/回填、方案名称映射；
  - `src/optimizer/core.js` 方案别名匹配与提交映射稳定性；
  - `tests/optimizer-escort-new-flow-fallback.test.mjs` 回归断言；
  - 真实阿里妈妈页面点击“立即检查并优化”复测。
- 非目标：
  - 不改动接口协议；
  - 不改动与护航设置无关模块。

## 执行计划（可核对）
- [x] 新增手动设置“净投产比调控”面板与表单读写，沿用 `bidConstraintValue` 数据键。
- [x] 调整方案名称/默认详情文案，将 `bidConstraintValue` 统一展示为“净投产比调控”。
- [x] 校验“手动未配置/未勾选默认不执行”链路，避免回退为默认执行所有方案。
- [x] 更新回归测试并执行目标测试 + 全量测试 + 构建。
- [x] 浏览器真实页面点击“立即扫描并优化”验证执行状态与手动设置一致。

## 改动摘要
- `src/optimizer/ui.js`
  - 手动设置面板把原“出价调控（成本）”统一为“净投产比调控”，并补齐对应读写与展示字段；
  - 方案表渲染改为“全量方案名称 + 独立状态列 + 详情列保留方案介绍/配置说明”；
  - 弹窗读取支持“净投产比调控/成本调控”标签兼容，避免线上字段差异导致映射失败。
- `src/optimizer/core.js`
  - `bidConstraintValue` 增加“净投产比/净投产比调控”别名；
  - 手动合并时按 `manualTargetKeySet` 对所有方案显式收敛：未在手动配置内一律 `enabled=false`；
  - 主开关未勾选时通过 `buildManualDisabledOverride` 强制全部方案按未勾选提交，不再回退默认执行。
- `tests/optimizer-escort-new-flow-fallback.test.mjs`
  - 更新净投产比文案与标签读取断言；
  - 新增“未在手动面板配置默认关闭”与“手动未勾选不执行”回归断言。

## 验证记录
- `node --test tests/optimizer-escort-new-flow-fallback.test.mjs`
  - 结果：`35/35 passed`
- `node scripts/build.mjs`
  - 结果：构建成功（v7.02）
- `node --test tests/*.test.mjs`
  - 结果：全量通过（dot reporter 退出码 `0`）
- 浏览器实页（`one.alimama.com`，点击“立即扫描并优化”）：
  - 场景A：主开关未勾选、子项未勾选，方案表展示 `净投产比调控/预算调控/添加关键词/切换关键词匹配方式/屏蔽关键词`，状态均为 `未勾选`；
  - 场景B：主开关仍未勾选，但手动勾选“净投产比调控 + 预算调控”子项再执行，结果仍全部 `未勾选`，提交来源为 `手动设置参数（未勾选）`；
  - 详情列保留方案说明（如范围、次数、次日恢复、关键词偏好），未被状态文案覆盖。

## 结果复盘
- 根因：提交层在“手动主开关未勾选”场景下会回退默认执行语义，且方案键别名不完整，导致预算/净投产比出现误执行感知。
- 修复：统一净投产比方案键映射；提交层显式以手动快照收敛所有方案 `enabled`；未勾选主开关时强制“全部未勾选提交”。
- 结论：手动面板与方案执行已对齐，且方案名称与详情展示保持稳定。

---

# TODO - 2026-04-15 用户复测“还是一样生效”闭环复核（小万护航手动设置）

## 需求规格
- 目标：
  - 处理用户“还是一样生效了”的复测反馈，确认“使用手动设置提交”主开关与执行方案严格一致；
  - 在真实阿里妈妈页面点击“立即扫描并优化”完成闭环验证。
- 范围：
  - 浏览器实页复测“主开关关闭/开启”两条链路；
  - 校验执行日志中的提交来源与方案数量，确认不再出现“默认执行所有方案”误判。
- 非目标：
  - 不新增业务字段；
  - 不改动与本问题无关模块。

## 执行计划（可核对）
- [x] 定位方案详情被“状态文案”覆盖的触发分支。
- [x] 调整 `escortSettingTable` 详情构造：详情优先展示方案介绍，状态仅在“状态”列呈现。
- [x] 更新回归测试，防止详情再次被“未开启”回退覆盖。
- [x] 构建并在真实阿里妈妈页面复测“立即扫描并优化”。

## 改动摘要
- `src/optimizer/ui.js`
  - 新增详情文本归一化/去重逻辑；
  - 新增配置描述提取逻辑（`description/desc/intro/...`）；
  - 新增默认方案介绍文案映射（出价/预算/关键词类）；
  - 移除“详情列回退为已开启/未开启”逻辑，状态由“状态列”单独表达。
- `tests/optimizer-escort-new-flow-fallback.test.mjs`
  - 更新“方案详情保留介绍文案”断言，改为校验默认介绍文案与“不再回退未开启”。

## 验证记录
- `node --test tests/optimizer-escort-new-flow-fallback.test.mjs`
  - 结果：`33/33 passed`
- `node scripts/build.mjs`
  - 结果：构建成功，产物刷新（v7.02）
- 浏览器实页（`one.alimama.com`，点击“立即扫描并优化”）
  - 结果：日志表格显示 `方案名称 / 状态 / 详情`；
  - 详情示例：
    - `净投产比调控`：`范围 13-39；最多 10 次/日；次日不恢复`
    - `预算调控`：`范围 50-不限；最多 20 次/日；次日恢复初始值`
    - `切换关键词匹配方式`：`自动在广泛匹配与精准匹配间切换`
    - `屏蔽关键词`：`自动屏蔽低转化关键词`

## 结果复盘
- 根因：详情兜底复用了状态语义，导致未开启时“方案介绍”被覆盖。
- 修复策略：状态与详情职责彻底分离，详情优先使用后端描述与方案介绍，缺省再用功能性介绍兜底。

---

# TODO - 2026-04-15 手动未勾选仍执行预算/净投产比（二次复测闭环）

## 需求规格
- 目标：
  - 修复“手动设置主开关未勾选时，方案仍默认执行预算调控/净投产比调控”的映射错位；
  - 在真实阿里妈妈页面点击“立即扫描并优化”验证状态与手动设置一致。
- 范围：
  - `openV3` 提交设置来源解析；
  - 回归测试与浏览器实测。
- 非目标：
  - 不改动业务接口；
  - 不改动无关模块。

## 执行计划（可核对）
- [x] 修复提交层在“手动未勾选”场景下的设置来源，禁止回退为诊断/默认执行方案。
- [x] 修正对应回归断言并通过目标测试。
- [x] 完整跑测并构建产物。
- [x] 真实页面执行“立即扫描并优化”复测方案状态与来源文案。

## 改动摘要
- `src/optimizer/core.js`
  - `resolveOpenV3Setting` 读取手动设置快照时改为 `includeDisabled: true`；
  - 新增“手动主开关未勾选”分支：构造 `operationList: []` 的手动设置提交；
  - 来源文案明确为 `手动设置参数（未勾选）`，并标记 `fromManual = true`。
- `tests/optimizer-escort-new-flow-fallback.test.mjs`
  - 补充并修正“手动未启用仍按手动快照提交”的断言；
  - 修复一条因分支结构升级导致的过期正则断言。

## 验证记录
- `node --test tests/optimizer-escort-new-flow-fallback.test.mjs`
  - 结果：`33/33 passed`
- `node --test tests/*.test.mjs`
  - 结果：`401 passed, 0 failed, 2 skipped`
- `node scripts/build.mjs`
  - 结果：构建成功（v7.02）
- 浏览器实页（`one.alimama.com`，点击“立即扫描并优化”）
  - 结果：
    - 日志显示：`使用手动设置参数（未勾选）：5 个设置项`
    - 方案表状态显示：`出价调控/预算调控/添加关键词/切换匹配/屏蔽关键词` 全部为 `未勾选`
    - 不再出现 `预算调控`、`净投产比调控` 被误标为 `已执行`。

## 结果复盘
- 根因：主开关未勾选时，提交层仍可能回退到诊断/默认设置来源，导致执行状态与手动设置错位。
- 修复策略：在提交层显式保留“手动未勾选”语义，提交来源与展示状态统一以手动快照为准。

---

# TODO - 2026-04-15 手动子项勾选后未执行（净投产比与全项复测）

## 需求规格
- 目标：
  - 修复“手动面板勾选净投产比调控后执行未生效”；
  - 检查其它手动子项是否存在同类问题；
  - 在真实页面浏览器中回归到通过为止。
- 范围：
  - 手动主开关与子项勾选联动逻辑；
  - 护航执行状态渲染链路验证。
- 非目标：
  - 不改动接口协议；
  - 不改动与手动设置无关模块。

## 执行计划（可核对）
- [x] 复现“仅勾子项、主开关未开”场景，确认执行链路来源与状态。
- [x] 修改主从联动：子项有勾选时自动开启主开关。
- [x] 更新回归测试覆盖新联动规则。
- [x] 构建并在 `one.alimama.com` 实页逐项验证（净投产比、出价、预算、加词、切换匹配、屏蔽）。

## 改动摘要
- `src/optimizer/ui.js`
  - `syncManualEscortMasterCheckbox` 改为：当任一主子项勾选时，自动 `master.checked = true`；
  - 保留部分勾选 `indeterminate` 语义，避免展示与提交状态不一致。
- `tests/optimizer-escort-new-flow-fallback.test.mjs`
  - 将“主开关不反向开启”旧断言更新为“子项勾选自动开启主开关”；
  - 同步更新“外层与内层勾选状态保持同步”的正则断言。

## 验证记录
- `node --test tests/optimizer-escort-new-flow-fallback.test.mjs`
  - 结果：`35/35 passed`
- `node --test tests/*.test.mjs`
  - 结果：`403 passed, 0 failed, 2 skipped`
- `node scripts/build.mjs`
  - 结果：构建成功（v7.02）
- 浏览器实页（`https://one.alimama.com/index.html#!/manage/search?...`）
  - 逐项单独勾选执行（单计划 `campaignId=69514602419`）：
    - `净投产比调控`：状态 `执行失败`（接口提示重复创建），其余项 `未勾选`；
    - `出价调控/预算调控/添加关键词/切换关键词匹配方式/屏蔽关键词`：各自状态 `已执行`，其余项 `未勾选`；
  - 每次“仅勾子项”时，主开关均自动变为勾选（`masterAfterChildCheck = true`）；
  - 全部不勾选执行时：6 项状态均为 `未勾选`。

## 结果复盘
- 根因：主开关关闭时，子项勾选不回写主开关，提交层按“手动未勾选”处理，造成“看起来勾了但不执行”。
- 修复：子项勾选反向开启主开关，确保面板视觉状态与提交语义一致。

---

# TODO - 2026-04-16 小万护航面板初始宽度放大 + 净投产比默认下限调整

## 需求规格
- 目标：
  - 小万护航在“未开始优化前”的面板宽度放大 1/3；
  - 手动设置中“净投产比调控”的下限默认值改为 `20`。
- 范围：
  - `src/optimizer/ui.js` 面板初始/恢复宽度与净投产比默认回填；
  - `src/optimizer/bootstrap.js` 默认配置基线。
- 非目标：
  - 不改动执行链路与接口协议；
  - 不改动其它方案的默认下限。

## 执行计划（可核对）
- [x] 定位并统一“未开始优化前”宽度设置入口（初始化与返回态）。
- [x] 调整净投产比下限默认值（读取 fallback、表单 fallback、默认配置）。
- [x] 跑回归测试并构建产物。

## 改动摘要
- `src/optimizer/ui.js`
  - 新增 `idlePanelWidthPx = 667`（500 放大约 1/3）；
  - 初始化面板 `width/min-width` 改为 `667px`；
  - `restoreIdlePanelView` 恢复宽度改为 `667px`；
  - `manual-net-bid-lower` 默认读取/回填从 `0.15` 改为 `20`；
  - 手动设置默认对象 `netBidConstraintValue.lowerLimit` 从 `0.15` 改为 `20`。
- `src/optimizer/bootstrap.js`
  - 默认配置 `manualEscortSetting.netBidConstraintValue.lowerLimit` 从 `0.15` 改为 `20`。

## 验证记录
- `node --test tests/optimizer-escort-new-flow-fallback.test.mjs`
  - 结果：`35/35 passed`
- `node --test tests/*.test.mjs`
  - 结果：`403 passed, 0 failed, 2 skipped`
- `node scripts/build.mjs`
  - 结果：构建成功（v7.02）

## 结果复盘
- 这次改动为纯 UI 与默认值层，不影响执行协议；
- 初始宽度与返回态宽度已统一，避免“优化后返回时宽度不一致”。
# TODO - 2026-04-27 `sycm.taobao.com` 插件真实页面测试

## 需求规格
- 目标：
  - 打开真实 `sycm.taobao.com` 页面，验证当前仓库插件能否正常加载；
  - 确认页面侧是否出现插件注入痕迹、控制台是否有报错、基础交互是否可用；
  - 输出明确的测试结论与阻塞点，避免只停留在“页面能打开”层面。
- 范围：
  - 当前仓库构建产物 `dist/extension/`；
  - Chrome DevTools MCP 真实浏览器测试；
  - `sycm.taobao.com` 页面加载、注入、控制台、网络与页面痕迹检查。
- 非目标：
  - 不在本轮修改业务逻辑；
  - 不替代后续更细的功能专项回归。

## 执行计划（可核对）
- [ ] 回顾仓库说明、历史教训与当前插件加载方式。
- [ ] 构建最新扩展产物，确保浏览器加载的是当前代码。
- [ ] 打开真实 `sycm.taobao.com` 页面并确认页面完成刷新。
- [ ] 检查插件注入痕迹、控制台日志与关键页面交互。
- [ ] 在本文档回填测试结果、结论与后续动作。

## 改动摘要
- 待执行。

## 验证记录
- 待执行。

## 结果复盘
- 待执行。

---

# TODO - 2026-04-27 `one.alimama.com` 新建计划提交流量摸排

## 需求规格
- 目标：
  - 打开真实 `https://one.alimama.com/index.html#!/main/index?bizCode=onebpSite` 新建计划页面；
  - 在“不真实提交”的前提下，按“每个计划类型 × 每个可选分支”逐一尝试，并尽可能触发到提交前最后一步；
  - 记录每类计划显示条件、点击路径、是否依赖先添加商品，以及提交前请求的 URL、Method、Query、Body、Header/鉴权关键信息；
  - 输出后续开发可直接复用的参数清单与差异点。
- 范围：
  - Chrome DevTools MCP 真实页面测试；
  - 页面 UI 路径梳理、网络请求抓取、提交前参数归档；
  - `tasks/todo.md` 结果回填。
- 非目标：
  - 不真实提交计划；
  - 不在本轮直接修改业务代码；
  - 不伪造不存在的入口，若页面因账号/商品状态不展示，只记录阻塞条件。

## 执行计划（可核对）
- [x] 回顾仓库约束、任务文档与现有脏工作树，避免覆盖无关改动。
- [x] 连接 Chrome DevTools，打开目标页面并确认运行态已刷新。
- [ ] 梳理新建计划入口，记录每个计划类型的显示前提与全部可选分支。
- [ ] 对每个可进入的计划类型、每个可选分支分别模拟填写到最后一步，逐次抓取提交前相关网络参数。
- [ ] 整理参数差异、公共字段、阻塞点与建议，回填本文档结果复盘。

## 改动摘要
- 已根据用户补充，把范围从“计划抽样”收紧为“每个计划 × 每个分支都要各自模拟提交并记录”。
- 记录载体已切换为仓库根目录 `addList.md`，后续提交流量参数与分支差异统一沉淀到该文件，`tasks/todo.md` 只保留任务管理与复盘。

## 验证记录
- `onebpSite` 全站推广页面已完成真实页面离线抓取，抓取方式为 `chrome-devtools` MCP + 页面内 `window.__AM_HOOK_MANAGER__`。
- 本轮新增覆盖分支：
  - `起量时间地域设置 = 8点~13点`
  - `起量地域 = 部分地域（取消上海）`
  - `设置计划组 = 归属到已有计划组（小白鲸）`
  - `设置计划组 = 不归属任何计划组`
  - `设置计划组 = 新建计划组并归属`
- 全部新增记录已集中写入仓库根目录 `addList.md`，未再散落到其它文档。

## 结果复盘
- 当前 `onebpSite` 全站推广页面可见的结构性分支已补齐，后续开发可以直接对照 `addList.md` 里的 13 条样本做组包。
- `起量时间地域设置` 最终都落在 `quickLiftBudgetCommand`：
  - 时间段字段是 `quickLiftTimeSlot`
  - 地域字段是 `quickLiftLaunchArea`
- `设置计划组` 有一条关键异常：
  - 选择“不归属任何计划组”后，`campaignGroupId` 会变成 `null`
  - 但 `campaignGroupName` 仍残留上一条已有组名称 `小白鲸`
  - 这意味着后续开发不能只看 `campaignGroupName` 判断是否真的归属了计划组。

---

# TODO - 2026-04-30 趋势主题联想入口对齐原生关键词/本店宝贝/竞店宝贝

## 需求规格
- 目标：
  - 将趋势主题手动联想区从“静态三按钮 + 通用输入框”改为原生同构交互；
  - `关键词` 支持直接输入并触发深度搜索；
  - `本店宝贝` 弹出本店商品列表，可按宝贝标题过滤并选择后联想趋势主题；
  - `竞店宝贝` 弹出全网商品搜索列表，可按宝贝标题搜索并选择后联想趋势主题。
- 范围：
  - 趋势主题弹窗 DOM、状态与事件；
  - 商品列表归一化与搜索；
  - 对应样式、回归测试、构建产物与浏览器实测。
- 非目标：
  - 不改变趋势主题最终提交字段；
  - 不改动非趋势明星目标的商品选择流程。

## 执行计划（可核对）
- [x] 复核原生截图与当前插件差异，明确三类入口的交互边界。
- [x] 改造趋势主题联想区：关键词输入内嵌、宝贝入口可打开选择面板。
- [x] 接入本店商品与竞店商品搜索，选择宝贝后用宝贝标题/ID 调用趋势联想接口。
- [x] 补充样式与回归断言，确保不退回静态按钮方案。
- [x] 运行构建、语法检查、目标测试。
- [x] 通过 Chrome DevTools 在真实 `one.alimama.com` 页面验证弹窗交互。

## 改动摘要
- 趋势主题联想区已改成原生同构入口：`关键词` 可直接输入，`本店宝贝` / `竞店宝贝` 打开宝贝选择面板。
- `本店宝贝` 继续使用趋势明星上下文的店内物料接口，保留店内商品与标题搜索。
- `竞店宝贝` 独立接入 `https://ai.alimama.com/ai/common/searchItemPage.json`，使用 `similarItemQueryStr` 搜索全网商品，不再复用本店商品接口。
- 商品归一化补充图片字段与多层响应列表解析，确保宝贝标题、ID、缩略图能稳定展示。
- 回归测试新增对关键词输入、宝贝面板、竞店 AI 全网搜索接口、本店/竞店数据源分离的断言。

## 验证记录
- `node scripts/build.mjs`：通过，生成根 userscript、packages 与 extension 产物。
- `node --test tests/keyword-trend-theme-setting.test.mjs`：通过 3/3。
- `node --test tests/keyword-search-p0-contract.test.mjs tests/keyword-trend-theme-setting.test.mjs && node --check "阿里妈妈多合一助手.js" && node scripts/build.mjs --check`：通过 9/9、语法检查通过、构建同步检查通过。
- Chrome DevTools 真实页面 `one.alimama.com` 验证：
  - `关键词` 输入 `洗碗机` 后返回 20 个趋势热点，首行包含 `洗碗机`、趋势指数 `334`、搜索指数 `35919`。
  - `本店宝贝` 面板显示 `本店宝贝标题` 搜索框，返回 40 条店内商品。
  - `竞店宝贝` 面板显示 `竞店宝贝标题` 搜索框，输入 `洗碗机` 后返回 79 条全网商品，并捕获到 `ai/common/searchItemPage.json` 请求。
  - 选择竞店商品后，已选文案显示 `已选竞店宝贝：...`，面板收起并触发趋势主题联想。

## 结果复盘
- 竞店宝贝的根因不是 UI，而是错误复用了本店/可投商品接口；修复后已按原生 AI 全网商品搜索链路独立实现。
- 后续类似“本店/竞店/全网”入口，必须先确认数据源和请求字段，再复刻 UI，避免同形控件误用同一接口。

## 缺陷修复计划 - 宝贝联想无趋势结果与快捷联想选中态
- [x] 复核当前宝贝选中后的联想查询方式，避免只用完整宝贝标题导致 `themeAssociation` 无结果。
- [x] 为本店/竞店宝贝选中后增加可联想关键词降级：完整标题无结果时提取类目/核心商品词继续查询。
- [x] 修复“快捷联想已选趋势”点击后的当前选中圆点状态，确保点击哪个趋势就高亮哪个趋势。
- [x] 更新回归断言覆盖宝贝联想降级查询与快捷联想 active 状态。
- [x] 重新构建、运行测试，并用真实 `one.alimama.com` 页面验证。

### 缺陷修复结果
- 宝贝联想不再只用完整标题：会按“宝贝搜索词 -> 已选/红榜中匹配的趋势词 -> 核心商品词 -> 完整标题”的顺序尝试，避免长标题导致无结果。
- 快捷联想已选趋势新增当前选中态，点击 `pro套` 后圆点切换到 `pro套`，不再固定第一个。
- 真实页面验证：
  - 选择本店宝贝 `美的消毒柜150R02...` 后返回 20 条趋势热点，状态显示 `联想词：美的消毒柜`。
  - 选择竞店宝贝 `304不锈钢筷子筒...洗碗机专用` 后返回 20 条趋势热点，状态显示 `联想词：洗碗机`。
  - 快捷联想点击第二个趋势后 active 圆点切换到 `pro套`。

## 缺陷修复计划 - 移除趋势旧手动入口并固定联想区高度
- [x] 删除趋势主题弹窗里多余的旧 `am-wxt-scene-crowd-native-manual` 手动添加区域及对应事件逻辑。
- [x] 为趋势主题专项测试补充旧入口不存在的回归断言。
- [x] 将趋势联想区设置为 `height:100%`、`overflow:hidden`，不再依赖滚动才能看到下方内容。
- [x] 重新构建、运行专项测试与契约检查。
- [x] 用真实 `one.alimama.com` 页面验证旧入口不存在且联想区完整可见。

### 缺陷修复结果
- 趋势主题弹窗旧手动添加区已移除，源码和生成后的 userscript 不再包含 `data-scene-popup-trend-manual` / `data-scene-popup-trend-manual-add` / `添加自定义主题`。
- 趋势联想区样式已改为 `flex:1 1 0`、`height:100%`、`overflow:hidden`，主内容区不再需要滚动才能看到联想区下方内容。
- 真实页面验证：
  - 旧 `.am-wxt-scene-crowd-native-manual` 不存在；
  - 联想区 CSSOM 规则为 `height: 100%`、`overflow: hidden`；
  - `mainScroll` 与 `associationScroll` 均无外层滚动，红榜、联想搜索、结果表头和已选悬浮条均在当前弹窗窗口内可见。

### 二次修复 - 联想区只露一行
- [x] 将红榜区固定压缩到 `180px`，释放纵向空间给下方联想区。
- [x] 按用户最新要求允许趋势主题弹窗整窗滚动，不再强制固定窗口内全部压缩展示。
- [x] 去掉联想区和联想结果表内部滚动/截断，让“联想相关趋势主题”下方结果自然展开显示全。
- [x] 重新构建并在真实页面确认联想区不再只露一行。

### 二次修复验证结果
- `node scripts/build.mjs`：通过。
- `node --test tests/keyword-trend-theme-setting.test.mjs`：通过，3/3。
- `node --test tests/keyword-search-p0-contract.test.mjs tests/keyword-trend-theme-setting.test.mjs`：通过，9/9。
- `node --check "阿里妈妈多合一助手.js"`：通过。
- `node scripts/build.mjs --check`：通过。
- Chrome DevTools 真实页面验证：
  - 旧手动入口仍不存在；
  - 弹窗外层 `overflow:auto`，允许整窗滚动；
  - 联想区 `overflow:visible`，结果表 `overflow:visible`；
  - 联想结果共 20 行，联想区内展开 20 行；
  - 联想区、结果表均 `clientHeight == scrollHeight`，没有内部滚动条。

### 三次修复 - 红榜增高与已选主题底部悬浮
- [x] 将三列红榜区域从 `180px` 增高到 `900px`，每个红榜卡片按当前压缩高度放大 5 倍。
- [x] 将“已选明星趋势主题”从弹窗内容绝对定位改成视窗底部 `fixed` 悬浮层。
- [x] 将趋势主题主内容底部避让空间增加到 `180px`，避免底部悬浮条遮住列表内容。
- [x] 重新构建、运行专项测试，并在真实页面确认红榜高度和底部悬浮条。

### 三次修复验证结果
- `node scripts/build.mjs`：通过。
- `node --test tests/keyword-trend-theme-setting.test.mjs`：通过，3/3。
- `node --check "阿里妈妈多合一助手.js"`：通过。
- `node scripts/build.mjs --check`：通过。
- Chrome DevTools 真实页面验证：
  - 红榜区 CSS 为 `flex: 0 0 900px`、`min-height: 900px`；
  - 三个红榜卡片实际高度约 `880px`；
  - 已选主题条 CSS 为 `position: fixed`、`bottom: 24px`；
  - 弹窗滚动前后已选主题条位置不变；
  - 联想区与结果表仍为 `overflow: visible`，结果表没有内部滚动条。

### 四次修复 - 红榜高度回归自然流与底部按钮合并
- [x] 删除红榜区 `flex: 0 0 900px` 与 `min-height: 900px/800px` 固定高度，恢复内容自然撑开。
- [x] 将顶部趋势主题搜索框改成与联想区“关键词”一致的胶囊样式。
- [x] 将“确定/取消”按钮移动到已选浮条中“全部移除”的右侧，按钮原有保存/取消逻辑不变。
- [x] 重新构建、运行专项测试，并在真实页面确认样式与按钮位置。

### 四次修复验证结果
- `node scripts/build.mjs`：通过。
- `node --test tests/keyword-trend-theme-setting.test.mjs`：通过，3/3。
- `node --test tests/keyword-search-p0-contract.test.mjs tests/keyword-trend-theme-setting.test.mjs`：通过，9/9。
- `node --check "阿里妈妈多合一助手.js"`：通过。
- `node scripts/build.mjs --check`：通过。
- Chrome DevTools 真实页面验证：
  - 红榜容器为 `flex: 0 1 auto`、`min-height: auto`，固定 `900px/800px` 已删除；
  - 顶部趋势主题搜索框与联想区“关键词”标签同为蓝色胶囊样式，圆角 `7px`、无边框、字重 `600`；
  - “确定/取消”显示在“全部移除”右侧；
  - 两个按钮仍是原 `data-scene-popup-save/cancel` 节点，父级已移动到 `data-scene-popup-trend-actions`；
  - 原底部 footer 已隐藏，已选主题条仍 `position: fixed` 固定在视窗底部。
