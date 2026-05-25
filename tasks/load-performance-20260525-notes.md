# 加载性能优化笔记 - 2026-05-25

## 测量口径
- 构建产物体积：`Buffer.byteLength` 统计 UTF-8 原始字节，`gzipSync` 统计 gzip 字节。
- 解析/编译耗时：Node `vm.Script` 连续 9 次编译，取 min/median/max，作为浏览器 JS parse/compile 的本地代理指标。
- extension 首段加载口径：content script 在 `document_start` 同步执行的 JS 体积；若 content script 立即注入 page bundle，则把 page bundle 计入关键路径。

## 基线数据
- `npm run build`：通过，版本 `7.03`。
- `userscript`：3,777,502 bytes，gzip 581,798 bytes，68,085 行；编译 median 34.49 ms。
- `extension page.bundle.js`：3,869,584 bytes，gzip 600,023 bytes，70,374 行；编译 median 35.32 ms。
- `dist/extension/content.js`：4,161 bytes；当前 `document_start` 立即注入 `page.bundle.js`，因此 extension 关键路径约 3,873,745 bytes。
- 构建渲染 `renderBuildOutputs()` median 31.18 ms。
- 最大源码分片：
  - `src/optimizer/keyword-plan-api/wizard-style-and-state/style.js`：340,026 bytes；
  - `src/main-assistant/magic-report.js`：319,673 bytes；
  - `src/optimizer/keyword-plan-api/search-and-draft.js`：277,329 bytes；
  - `src/optimizer/keyword-plan-api/wizard-scene-config/render-scene-dynamic-core.js`：271,392 bytes。

## 瓶颈定位
- 主要瓶颈 1：MV3 extension 的 `content.js` 配置 `run_at: document_start`，且当前内容脚本立即向页面注入 3.87 MB `page.bundle.js`。这会把完整助手运行时代码解析/执行放进页面早期加载关键路径。
- 主要瓶颈 2：主助手 `UI.injectStyles()` 启动即注入样式；其中 `#am-trigger-optimizer` 下有一整段原生 CSS 变量快照，36,579 bytes / 595 行，但实际按钮已由 `.am-tool-btn` 样式覆盖，变量不会改变交互语义。
- 次要瓶颈：关键词计划向导 CSS 与业务分片体积较大，但向导样式已是打开向导时才注入；本轮不做高风险拆包。

## 优化方案
- 删除主助手 `#am-trigger-optimizer` 冗余原生变量 CSS 快照，保留现有 `.am-tool-btn` 按钮样式和所有事件绑定。
- 已评估 extension page bundle 延后注入：虽然可把 3.87 MB 移出 `document_start` 关键路径，但 page bundle 内含授权守卫；本轮不改变授权时序，避免安全语义退化。

## 复测数据
- `npm run build`：通过，已同步根 userscript、`dist/packages` 与 `dist/extension`。
- 最小回归集：`node --test tests/build-segments.test.mjs tests/build-output-sync.test.mjs tests/extension-static-build.test.mjs tests/package-scripts.test.mjs tests/keyword-plan-api-slim.test.mjs tests/optimizer-entry-error-handling.test.mjs tests/logger-api.test.mjs` 通过，33/33。
- `npm run build:check`：通过。
- `npm run check:syntax`：通过。
- `git diff --check`：通过。
- `npm run review`：通过，476 pass / 0 fail / 2 skipped。
- 复测指标：
  - `userscript`：3,740,923 bytes，gzip 576,093 bytes，67,491 行；编译 median 32.36 ms。
  - `extension page.bundle.js`：3,833,005 bytes，gzip 595,182 bytes，69,780 行；编译 median 33.30 ms。
  - 主助手启动 CSS：29,133 bytes，gzip 4,408 bytes，667 行。
  - `PRE_KEYWORD_SEGMENTS`：724,611 bytes，gzip 135,995 bytes。
  - `renderBuildOutputs()` median 24.55 ms。
- 修改前后对比：
  - userscript raw：3,777,502 -> 3,740,923，减少 36,579 bytes（-0.97%）。
  - userscript gzip：581,798 -> 576,093，减少 5,705 bytes（-0.98%）。
  - extension page bundle raw：3,869,584 -> 3,833,005，减少 36,579 bytes（-0.95%）。
  - extension page bundle gzip：600,023 -> 595,182，减少 4,841 bytes（-0.81%）。
  - userscript 编译 median：34.49 ms -> 32.36 ms，减少 2.14 ms（-6.19%）。
  - extension page bundle 编译 median：35.32 ms -> 33.30 ms，减少 2.02 ms（-5.71%）。
  - 主助手启动 CSS raw：65,712 -> 29,133，减少 36,579 bytes（-55.67%）。
  - `PRE_KEYWORD_SEGMENTS` raw：761,190 -> 724,611，减少 36,579 bytes（-4.81%）。
- Chrome DevTools 真实页面只读验证：
  - 页面：`https://one.alimama.com/index.html#!/manage/search?orderField=charge&orderBy=desc`，刷新后 `document.readyState=complete`，脚本版本 `7.03`。
  - 主助手悬浮入口可展开；面板可见，工具按钮 `算法护航 / 组建计划 / 万能查数 / 辅助显示` 均可见且尺寸正常。
  - `#am-helper-pro-v26-style` 已不包含 `Native Style for Optimizer Trigger` 和 `--mux-ai-brand-gradient-line`；浏览器端样式文本约 29 KB。
  - 点击 `算法护航` 仅打开护航面板，按钮 `立即扫描并优化` 可见，未点击执行。
  - 点击 `组建计划` 打开关键词向导，标题为 `关键词推广批量建计划 API 向导 / 向导就绪`，主按钮 `提交创建` 可见；随后关闭向导。
  - 安全边界：未点击 `立即扫描并优化`、`提交创建`、`确认提交创建` 或任何真实创建/投放入口。
  - 控制台存在平台侧既有 `Uncaught (in promise)` 噪声；本轮验证动作未阻断主助手展开、护航面板打开和关键词向导打开。

## 本轮复核补充
- 重新执行 `npm run build` 后产物保持同步。
- `npm run test`：通过，478 tests / 476 pass / 0 fail / 2 skipped。
- `npm run build:check`：通过。
- `npm run check:syntax`：通过。
- `git diff --check`：通过。
- `npm run review`：通过，review-team 全部自动检查通过。
- 5 个子代理并行复核：
  - CSS 删除风险复核：`#am-trigger-optimizer` DOM、`.am-tool-btn` 样式和事件绑定均保留；
  - 分片/注入瓶颈复核：最大瓶颈仍是 `document_start` 注入约 3.83 MB 单体 `page.bundle.js`，`keyword-plan-api` 约 2.8 MB；
  - 指标复测：当前三个产物体积与 parse/compile 指标已复现；
  - 相关验证代理：最小回归、`build:check`、`check:syntax` 均通过；
  - 生成产物复核：root userscript、package userscript、extension page bundle 均已删除原生变量快照并保留通用按钮样式。
- 追加唯一注释避免 `vm.Script` 热缓存后的当前 parse/compile median：
  - `阿里妈妈多合一助手.js`：3,740,923 bytes，gzip(level 9) 566,992 bytes，67,490 行，median 36.842 ms；
  - `dist/packages/alimama-helper-pro.user.js`：3,740,923 bytes，gzip(level 9) 566,992 bytes，67,490 行，median 40.348 ms；
  - `dist/extension/page.bundle.js`：3,833,005 bytes，gzip(level 9) 586,134 bytes，69,779 行，median 41.465 ms。
- Chrome DevTools MCP 真实页面只读复核：
  - 页面刷新后 `document.readyState=complete`，脚本版本 `7.03`；
  - `#am-helper-pro-v26-style` 为 29,133 bytes，不含 `Native Style for Optimizer Trigger`、`--mux-ai-brand-gradient-line` 或 `#am-trigger-optimizer { ... }`；
  - `算法护航 / 组建计划 / 万能查数 / 辅助显示` 四个工具按钮均可见；
  - 点击 `算法护航` 可打开护航面板，点击 `组建计划` 可打开关键词向导并显示 `提交创建`；
  - 未点击执行、创建、投放或确认提交入口，`performance` resource 中未发现 `create/submit/launch` 类请求。
- 测量脚本注意：首次本地脚本曾把 `PRE_KEYWORD_SEGMENTS` 当完整 JS 编译，触发 `Unexpected end of input`；已修正为分片只统计体积、完整 bundle 才做编译估算。
