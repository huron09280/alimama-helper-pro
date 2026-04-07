# Notes: 批量建计划参数缺失修复

## Confirmed issues from prior report
- `marketingGoal` 会过强回退，并回写 request/plan。
- `normalizePlans` 不识别 `plan.materialId`，且会静默过滤缺商品 plan。
- `planGoalWarnings` 只走进度事件，不进入最终结果。

## Candidate first fixes
- Fix A: `normalizePlans` 支持 `plan.materialId`，并减少缺商品导致的意外过滤。
- Fix B: 最终结果汇总 `planGoalWarnings`，提高批量异常可见性。
- Fix C: 为上述两点补行为级测试，而不是继续依赖 bundle 正则测试。

## Implemented
- `normalizePlans` 现在接受 `plan.materialId`，并补齐 `plan.itemId` / `plan.item`。
- `createPlansBatch` 新增 `mergeGoalWarnings`，最终结果会合并请求级与计划级告警。
- `validate` 与 `hasPlansWithoutItem` 同步接受 `plan.materialId`，避免误告警和不必要的商品补齐查询。

## Verification
- `node scripts/build.mjs`
- `node scripts/build.mjs --check`
- `node --check "阿里妈妈多合一助手.js"`
- `node --test tests/keyword-create-repair-item-binding-guard.test.mjs tests/keyword-create-goal-warning-merge.test.mjs tests/site-scene-submit-mode.test.mjs`
- `node --test tests/site-scene-item-binding.test.mjs`

## Follow-up implemented
- `resolveGoalSpecForScene` 的 fuzzy 命中现在会追加 warning，并将 `goalFallbackUsed` 标记为 `true`。
- 新增 `tests/goal-resolution-fuzzy-fallback.test.mjs` 覆盖 fuzzy/exact 两条行为路径。

## Follow-up verification
- `node scripts/build.mjs`
- `node --test tests/goal-resolution-fuzzy-fallback.test.mjs tests/keyword-create-goal-warning-merge.test.mjs tests/site-scene-submit-mode.test.mjs`
- `node scripts/build.mjs --check`
- `node --check "阿里妈妈多合一助手.js"`

## Follow-up implemented (drop visibility)
- `normalizePlans` 新增 `onDroppedPlan` 回调，在缺商品且无法补齐时上报被过滤计划。
- `createPlansBatch` 接入 drop 上报，并将其并入 `prebuildFailures`；全部计划被过滤时直接返回明确失败明细。
- 新增 `tests/keyword-create-normalize-drop-failures.test.mjs`，并扩展 `tests/keyword-create-repair-item-binding-guard.test.mjs` 覆盖 `onDroppedPlan` 行为。

## Follow-up verification (drop visibility)
- `node scripts/build.mjs`
- `node --test tests/keyword-create-repair-item-binding-guard.test.mjs tests/keyword-create-normalize-drop-failures.test.mjs tests/keyword-create-goal-warning-merge.test.mjs tests/goal-resolution-fuzzy-fallback.test.mjs tests/site-scene-submit-mode.test.mjs`
- `node scripts/build.mjs --check`
- `node --check "阿里妈妈多合一助手.js"`

## Follow-up implemented (strict goal match)
- `createPlansBatch` 增加 `strictGoalMatch` 开关（`options.strictGoalMatch` 或 `request.strictGoalMatch`）。
- strict 开启时，若 plan 目标解析出现 fallback（含模糊匹配），聚合为 `strictGoalFailures` 并提前失败返回，不进入提交。
- 最终结果增加 `strictGoalMatch` 字段用于诊断开关状态。
- 新增 `tests/keyword-create-strict-goal-match.test.mjs` 覆盖开关接入与提前失败分支。

## Follow-up verification (strict goal match)
- `node scripts/build.mjs`
- `node --test tests/keyword-create-strict-goal-match.test.mjs tests/keyword-create-repair-item-binding-guard.test.mjs tests/keyword-create-normalize-drop-failures.test.mjs tests/keyword-create-goal-warning-merge.test.mjs tests/goal-resolution-fuzzy-fallback.test.mjs tests/site-scene-submit-mode.test.mjs`
- `node scripts/build.mjs --check`
- `node --check "阿里妈妈多合一助手.js"`

## Follow-up implemented (remaining risk closure)
- `normalizePlans` 统一 `planCount` 语义：自动建计划时将其作为 `preferredItems` 上限。
- 线索推广移除 `308/74` 模板 ID 硬编码兜底，缺失关键模板参数时 fail-fast。
- 显式字段保留增强：`itemIdList` / `bidTargetV2` / `optimizeTarget` 在高风险裁剪分支不再被误删。
- 本轮通过 3 个 AGENTS 并行分析后落地修复。

## Follow-up verification (remaining risk closure)
- `node scripts/build.mjs`
- `node --test tests/keyword-create-repair-item-binding-guard.test.mjs tests/lead-scene-template-id-guard.test.mjs tests/keyword-create-explicit-field-preserve.test.mjs tests/keyword-create-strict-goal-match.test.mjs tests/keyword-create-normalize-drop-failures.test.mjs tests/keyword-create-goal-warning-merge.test.mjs tests/goal-resolution-fuzzy-fallback.test.mjs tests/site-scene-submit-mode.test.mjs`
- `node scripts/build.mjs --check`
- `node --check "阿里妈妈多合一助手.js"`

## Follow-up implemented (default policy hardening)
- `createPlansBatch` 的 `strictGoalMatch` 政策已改为默认开启（可显式 `strictGoalMatch=false` 关闭）。
- 新增 `allowFuzzyGoalMatch` 开关，默认关闭 fuzzy 目标匹配；`resolveGoalSpecForScene` 仅在显式开启时执行 fuzzy。
- `normalizePlans` 中 `request.itemId/materialId` 兜底仅允许单计划场景，阻断多计划同商品批量回填。

## Follow-up implemented (override/lead consistency + tests)
- `applyOverrides` 合并顺序调整为 `common passthrough` 在 `planCampaignOverride` 之前，确保 plan 显式字段优先。
- 新增 `resolveLeadTemplateTriplet`，线索模板三元组采用单来源优先解析并 fail-fast。
- 新增 `tests/keyword-build-solution-payload-behavior.test.mjs`，覆盖：
  - `applyOverrides` 优先级行为
  - `resolveLeadTemplateTriplet` 选源与 ID 清洗边界
  - `stripKeywordTrafficArtifacts` 行为
  - 非关键词模板裁剪与 itemIdList 二次重写分支契约

## Follow-up verification (default policy hardening)
- `node scripts/build.mjs`
- `node --test tests/keyword-build-solution-payload-behavior.test.mjs tests/keyword-create-repair-item-binding-guard.test.mjs tests/lead-scene-template-id-guard.test.mjs tests/keyword-create-explicit-field-preserve.test.mjs tests/keyword-create-strict-goal-match.test.mjs tests/keyword-create-normalize-drop-failures.test.mjs tests/keyword-create-goal-warning-merge.test.mjs tests/goal-resolution-fuzzy-fallback.test.mjs tests/site-scene-submit-mode.test.mjs`
- `node scripts/build.mjs --check`
- `node --check "阿里妈妈多合一助手.js"`

## Follow-up implemented (strict request-level fallback)
- `strictGoalMatch` 开启时，request 级 `goalFallbackUsed` 现在会提前失败返回，不再先回写 `mergedRequest.marketingGoal` 再继续后续流程。
- 失败返回包含 `marketingGoal/submitEndpoint/goalWarnings` 与可用目标提示，便于定位。

## Follow-up verification (strict request-level fallback)
- `node scripts/build.mjs`
- `node --test tests/keyword-create-strict-goal-match.test.mjs tests/goal-resolution-fuzzy-fallback.test.mjs tests/keyword-create-repair-item-binding-guard.test.mjs tests/keyword-create-goal-warning-merge.test.mjs`
- `node scripts/build.mjs --check`
- `node --check "阿里妈妈多合一助手.js"`

## Follow-up implemented (fuzzy ambiguity hardening)
- `allowFuzzyMatch=true` 时，目标候选改为“仅单一候选可命中”；若命中多个候选则回退默认目标并输出“匹配到多个候选”警告，避免 fuzzy 误命中。

## Follow-up verification (fuzzy ambiguity hardening)
- `node scripts/build.mjs`
- `node --test tests/goal-resolution-fuzzy-fallback.test.mjs`
- `node scripts/build.mjs --check`
- `node --check "阿里妈妈多合一助手.js"`

## Follow-up implemented (strict early-return contract + test drift fix)
- 修复 `tests/keyword-create-goal-warning-merge.test.mjs` 的函数切片终点：改为 `const buildStrictGoalFailureError =`，避免 helper 重构后切片污染导致 `Unexpected token ';'`。
- 修复 `tests/keyword-create-normalize-drop-failures.test.mjs` 断言：匹配 `normalizedPlanDropFailures.push(buildDroppedPlanFailure(...))`，对齐新 helper 实现。
- 修复 `createPlansBatch` 在 `strictGoalFailures` 早退返回缺少 `allowFuzzyGoalMatch` 字段的问题，并在 `tests/keyword-create-strict-goal-match.test.mjs` 增加对应断言。
- 本轮通过 3 个 AGENTS 并行完成失败根因定位、断言更新与风险复核。

## Follow-up verification (strict early-return contract + test drift fix)
- `node scripts/build.mjs`
- `node --test tests/keyword-create-runtime-helpers.test.mjs tests/non-keyword-optional-prune-runtime.test.mjs tests/keyword-build-solution-payload-behavior.test.mjs tests/keyword-create-repair-item-binding-guard.test.mjs tests/lead-scene-template-id-guard.test.mjs tests/keyword-create-explicit-field-preserve.test.mjs tests/keyword-create-strict-goal-match.test.mjs tests/keyword-create-normalize-drop-failures.test.mjs tests/keyword-create-goal-warning-merge.test.mjs tests/goal-resolution-fuzzy-fallback.test.mjs tests/site-scene-submit-mode.test.mjs`
- `node scripts/build.mjs --check`
- `node --check "阿里妈妈多合一助手.js"`

## Follow-up implemented (early-return result shape alignment)
- 继续通过 3 个 AGENTS 并行审查后，统一补齐了 `createPlansBatch` 早退分支结果结构：
  - `sceneRuntimeMismatch && strictSceneRuntimeMatch`
  - `requireTemplateForScene && !isRuntimeTemplateReadyForScene(runtime)`
  - `!plans.length`（含 `normalizedPlanDropFailures` 分支）
  - `!builtList.length`
- 上述分支新增统一上下文字段：`runtime`、`marketingGoal`、`goalFallbackUsed`、`goalWarnings`、`submitEndpoint`、`fallbackPolicy`、`conflictPolicy`、`stopScope`、`strictGoalMatch`、`allowFuzzyGoalMatch`、`rawResponses`。
- 新增 `tests/keyword-create-early-return-shape.test.mjs`，覆盖这 4 类早退返回结构的契约断言。

## Follow-up verification (early-return result shape alignment)
- `node scripts/build.mjs`
- `node --test tests/keyword-create-runtime-helpers.test.mjs tests/non-keyword-optional-prune-runtime.test.mjs tests/keyword-build-solution-payload-behavior.test.mjs tests/keyword-create-repair-item-binding-guard.test.mjs tests/lead-scene-template-id-guard.test.mjs tests/keyword-create-explicit-field-preserve.test.mjs tests/keyword-create-strict-goal-match.test.mjs tests/keyword-create-normalize-drop-failures.test.mjs tests/keyword-create-goal-warning-merge.test.mjs tests/keyword-create-early-return-shape.test.mjs tests/goal-resolution-fuzzy-fallback.test.mjs tests/site-scene-submit-mode.test.mjs`
- `node scripts/build.mjs --check`
- `node --check "阿里妈妈多合一助手.js"`

## Follow-up implemented (early-return failure item contract)
- 继续通过 3 个 AGENTS 并行审查后，补齐了多个早退分支 `failures[*]` 的条目结构，统一包含：
  - `planName`
  - `item`
  - `marketingGoal`
  - `submitEndpoint`
  - `error`
- 覆盖分支：
  - `sceneRuntimeMismatch && strictSceneRuntimeMatch`
  - `requireTemplateForScene && !isRuntimeTemplateReadyForScene(runtime)`
  - `!plans.length` 的兜底失败条目
  - `!builtList.length` 的兜底失败条目
- 新增/增强测试：`tests/keyword-create-early-return-shape.test.mjs` 对早退 common 字段与 failure 条目进行契约断言。

## Follow-up verification (early-return failure item contract)
- `node scripts/build.mjs`
- `node --test tests/keyword-create-runtime-helpers.test.mjs tests/non-keyword-optional-prune-runtime.test.mjs tests/keyword-build-solution-payload-behavior.test.mjs tests/keyword-create-repair-item-binding-guard.test.mjs tests/lead-scene-template-id-guard.test.mjs tests/keyword-create-explicit-field-preserve.test.mjs tests/keyword-create-strict-goal-match.test.mjs tests/keyword-create-normalize-drop-failures.test.mjs tests/keyword-create-goal-warning-merge.test.mjs tests/keyword-create-early-return-shape.test.mjs tests/goal-resolution-fuzzy-fallback.test.mjs tests/site-scene-submit-mode.test.mjs`
- `node scripts/build.mjs --check`
- `node --check "阿里妈妈多合一助手.js"`

## Follow-up implemented (createPlansBatch strict runtime executable test)
- 新增 `tests/keyword-create-strict-goal-runtime.test.mjs`，通过 `Function + stub` 方式可执行 `createPlansBatch` 主流程分支，而不只是源码正则匹配。
- 覆盖点：
  - `strictGoalMatch` plan 级早退会命中真实返回路径；
  - `allowFuzzyGoalMatch` 在默认/request/options 三种输入来源下，返回值与归一化策略一致。
  - 多计划 strict fallback 明细隔离校验（`planName/marketingGoal/submitEndpoint` 不串值）。

## Follow-up verification (createPlansBatch strict runtime executable test)
- `node scripts/build.mjs`
- `node --test tests/keyword-create-runtime-helpers.test.mjs tests/non-keyword-optional-prune-runtime.test.mjs tests/keyword-build-solution-payload-behavior.test.mjs tests/keyword-create-repair-item-binding-guard.test.mjs tests/lead-scene-template-id-guard.test.mjs tests/keyword-create-explicit-field-preserve.test.mjs tests/keyword-create-strict-goal-match.test.mjs tests/keyword-create-strict-goal-runtime.test.mjs tests/keyword-create-normalize-drop-failures.test.mjs tests/keyword-create-goal-warning-merge.test.mjs tests/keyword-create-early-return-shape.test.mjs tests/goal-resolution-fuzzy-fallback.test.mjs tests/site-scene-submit-mode.test.mjs`
- `node scripts/build.mjs --check`
- `node --check "阿里妈妈多合一助手.js"`
