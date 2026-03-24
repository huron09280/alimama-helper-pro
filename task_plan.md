# Task Plan: Report.md 全量问题收敛修复

## Goal
按 `Report.md` 逐项收敛到可验证闭环，优先修复默认宽松导致的参数误判/误绑定风险，并补足对应回归测试。

## Phases
- [x] Phase 1: 核对剩余问题并并行调研
- [x] Phase 2: 最小逻辑修复（优先级、模板参数、默认策略）
- [x] Phase 3: 补齐行为级测试与契约测试
- [x] Phase 4: 构建与回归验证
- [x] Phase 5: 文档归档与结果复核

## Decisions Made
- `strictGoalMatch` 改为默认开启，允许显式关闭（`strictGoalMatch=false`）。
- fuzzy 目标匹配默认关闭，仅显式 `allowFuzzyGoalMatch=true` 时启用。
- `request.itemId/materialId` 仅在单计划场景允许兜底，阻断多计划同商品批量回填。
- `applyOverrides` 合并顺序收敛为 plan 优先于 common passthrough。
- 线索模板三元组按“单来源优先”解析并 fail-fast，避免跨来源拼接。

## Verification
- `node scripts/build.mjs`
- `node --test tests/keyword-build-solution-payload-behavior.test.mjs tests/keyword-create-repair-item-binding-guard.test.mjs tests/lead-scene-template-id-guard.test.mjs tests/keyword-create-explicit-field-preserve.test.mjs tests/keyword-create-strict-goal-match.test.mjs tests/keyword-create-normalize-drop-failures.test.mjs tests/keyword-create-goal-warning-merge.test.mjs tests/goal-resolution-fuzzy-fallback.test.mjs tests/site-scene-submit-mode.test.mjs`
- `node scripts/build.mjs --check`
- `node --check "阿里妈妈多合一助手.js"`

## Status
**Completed** - 当前回归全部通过，剩余工作为用户确认是否继续扩展“最终 payload 执行级快照”测试深度。
