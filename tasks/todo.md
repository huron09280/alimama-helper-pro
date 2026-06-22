# TODO - 2026-06-22 中文提交并发布 GitHub

## 需求规格
- 用户要求使用中文 commit，并发布到 GitHub。
- 当前分支为 `main`，本地领先 `origin/main` 5 个提交，工作区初始检查无未提交源码改动。
- 本轮只记录发布任务、必要验证、中文提交任务记录并推送；不改业务源码、不改写历史、不创建真实投放或发布包。
- 成功标准：工作区改动有中文提交信息；`main` 成功推送到 `origin/main`；验证命令与最终状态写入本文件。

## 执行计划
- [x] 复核当前分支、远端和领先提交范围，确认没有敏感文件或非预期脏改。
- [x] 运行最小提交前验证：`git diff --check` 与任务记录相关语法/文本检查。
- [x] 使用中文提交信息提交本轮任务记录。
- [x] 推送 `main` 到 GitHub，并确认本地与远端同步。
- [x] 补充高层操作摘要、验证记录和结果复盘。

## 高层操作摘要
- 已确认当前分支为 `main`，远端为 `origin https://github.com/huron09280/alimama-helper-pro.git`。
- 已确认本地 `main` 领先 `origin/main` 5 个提交，提交范围为 `6723908`、`6b9abcc`、`a62d9c4`、`39a8300`、`cd8fbee`。
- 已确认本轮未提交改动仅为 `tasks/todo.md` 的发布任务记录。
- 已按用户要求将提交代理生成的 `chore:` 标题 amend 为全中文标题 `记录 GitHub 发布任务`。
- 已成功推送 `main` 到 GitHub：`31c2ac0..12dd017 main -> main`。

## 验证记录
- `git diff --check`：通过，无输出。
- 推送前 `git status --short --branch`：`main...origin/main [ahead 6]`，工作区无其它未提交文件。
- `git push origin main`：通过。

## 结果复盘
- 已完成中文提交并发布到 GitHub。
- 本轮没有修改业务源码、构建产物或真实页面运行态。
- 为补齐本复盘记录，会追加一个中文任务记录提交并再次推送。

# TODO - 2026-06-22 合并回本地主线 main

## 需求规格
- 用户要求将当前工作合并回本地主线 `main`。
- 当前分支为 `codex/fix-ai-max-popovers`，`main` 在本机另一个 worktree 中检出。
- 当前分支存在未提交改动；若直接 merge 只能合并已提交内容，因此本轮需先确认并提交当前改动，再合并到本地 `main`。
- 不推送远端，不改写历史，不回退用户或其它代理已有改动。

## 执行计划
- [x] 检查当前分支、`main` worktree、提交差异和脏改范围。
- [x] 运行提交前最小验证，确保当前分支改动可合入。
- [x] 提交当前分支未提交改动。
- [x] 到本地 `main` worktree 合并 `codex/fix-ai-max-popovers`，处理可能的冲突。
- [x] 运行合并后验证并记录结果复盘。

## 高层操作摘要
- 已确认 `main` 位于 `/Users/liangchao/Downloads/合美/资料/产品/洗碗机资料/08_工具脚本/小工具/阿里妈妈多合一助手 (Pro版 )/alimama-helper-pro`，当前 worktree 无法直接切换到 `main`。
- 已确认当前分支相对 `main` 为 `main` 多 1 个提交、当前分支多 2 个提交；当前分支还有文档、任务记录、脚本和测试的未提交改动。
- 已确认未跟踪内容仅为 `tasks/archive/` 下任务归档文件，本轮不涉及 `.keys`、构建产物或业务源码脏改。
- 已将当前分支未提交改动提交为“整理代理规则与任务归档”。
- 已在本地 `main` worktree 发现既有未提交仓库探索记录；合并前已用 stash 临时保存，合并后已恢复 `tasks/repo-exploration-2026-06-14.md` 并把对应 todo 段追加进 `tasks/archive/todo-history-2026-04-15-to-2026-06-14.md`。
- 已成功将 `codex/fix-ai-max-popovers` 合并到本地 `main`，无冲突。

## 验证记录
- 提交前 `node --test tests/agents-rules-contract.test.mjs tests/build-output-sync.test.mjs tests/review-team-script.test.mjs`：通过，12/12。
- 提交前 `bash scripts/review-team.sh`：通过；全量回归 647 项中 645 通过、2 个既有 AgentCluster 条件跳过、0 失败；版本检查通过。
- 提交前 `git diff --check`：通过。
- 合并后 `node --test tests/agents-rules-contract.test.mjs tests/build-output-sync.test.mjs tests/review-team-script.test.mjs`：通过，12/12。
- 合并后 `bash scripts/review-team.sh`：通过；全量回归 647 项中 645 通过、2 个既有 AgentCluster 条件跳过、0 失败；版本检查通过。
- 合并后 `git diff --check`：通过。

## 结果复盘
- 已将 `codex/fix-ai-max-popovers` 合并回本地 `main`，未推送远端。
- 合并前 main worktree 的未提交仓库探索记录已保留：详细笔记恢复为 `tasks/repo-exploration-2026-06-14.md`，对应 todo 段已并入 `tasks/archive/todo-history-2026-04-15-to-2026-06-14.md`。
- 本轮未改业务逻辑；最终额外收尾仅为任务记录归档与合并验收记录。

# TODO - 2026-06-15 未处理风险收敛

## 需求规格
- 用户要求处理上轮 `neat-freak` 结果中留下的两个未处理风险。
- 风险 1：`tasks/lessons.md` 历史编号存在重复，需在不破坏引用的前提下消除重复编号或明确稳定映射。
- 风险 2：`CLAUDE.md` 仍可继续瘦身，但 `scripts/review-team.sh` 与 `tests/build-output-sync.test.mjs` 解析其中版本行；需判断是否应同步脚本/测试，让 Claude 入口更接近规则手册。
- 本轮仍是文档/任务记录/测试契约整理，不改业务源码、不改构建产物、不触发真实页面操作。
- 成功标准：重复 lesson 编号清零；`CLAUDE.md` 体量进一步收敛且版本同步测试仍有清晰事实源；相关验证通过，并更新本任务记录。

## 执行计划
- [x] 读取 `neat-freak` 说明、当前 `tasks/todo.md`、`CLAUDE.md`、版本解析脚本和版本同步测试，确认风险边界。
- [x] 统计 `tasks/lessons.md` 全部重复编号，并检索仓库内对这些编号的外部引用。
- [x] 基于引用结果修复 lessons 编号重复，优先采用最小且可审计的连续重编号。
- [x] 评估并瘦身 `CLAUDE.md`；若移除版本事实源，必须同步更新脚本和测试到新的权威来源。
- [x] 运行重复编号检查、版本同步测试、规则契约测试、 stale 指针/相对时间扫描和 `git diff --check`。
- [x] 在本计划中补充高层操作摘要、验证记录和结果复盘。

## 高层操作摘要
- 已确认 `scripts/review-team.sh` 通过 `- **当前版本**: \`v...\`` 解析 `CLAUDE.md`，`tests/build-output-sync.test.mjs` 也要求 `CLAUDE.md` 含当前展示版本。
- 已审计 `tasks/lessons.md` 重复编号：重复集中在历史分段，包含 `L36`、`L43-L61`、`L66-L71`、`L82`、`L127-L130` 等编号。
- 已把后半段重复 lesson 机械重编号为 `L146-L177`，并新增 `L178` 约束“未处理风险不能长期停留在复盘里”；`tasks/lessons.md` 当前 178 条 lesson 编号唯一。
- 已同步修正归档历史里会误导检索的旧编号引用：设计体系、图标审计、原生弹窗设置和开启态验证分别指向新编号。
- 已将 `CLAUDE.md` 从 111 行收敛为 19 行薄入口，去掉当前版本展示，改为指向 `src/entries/userscript-meta.js` 作为版本事实源。
- 已同步 `scripts/review-team.sh`、`tests/build-output-sync.test.mjs`、`tests/review-team-script.test.mjs` 和 README 说明：版本一致性校验以 userscript meta、根 userscript 和 README 为准，`CLAUDE.md` 只保留事实源指针。
- 已在 `tests/agents-rules-contract.test.mjs` 增加两个护栏：`CLAUDE.md` 保持薄入口、`tasks/lessons.md` lesson 编号保持唯一。

## 验证记录
- lesson 重复编号检查：通过，`tasks/lessons.md` 未输出重复编号；连续性抽查显示 178 条 lesson。
- `node --test tests/agents-rules-contract.test.mjs tests/build-output-sync.test.mjs tests/review-team-script.test.mjs`：通过，12/12。
- `bash scripts/review-team.sh`：通过；全量测试 647 项中 645 通过、2 个既有 AgentCluster 条件跳过、0 失败；版本检查显示 userscript meta、README 对齐，`CLAUDE.md` 指向版本事实源。
- 旧失效指针扫描：通过，README、CLAUDE、AGENTS、docs、other、当前 todo 未再命中本轮清理目标。
- 相对日期关键词扫描：通过，README、CLAUDE、AGENTS、docs、当前 todo 未命中。
- `git diff --check`：通过。
- 尺寸复核：`CLAUDE.md` 19 行，`AGENTS.md` 70 行，`tasks/lessons.md` 915 行，`tasks/todo.md` 25 行。

## 结果复盘
- 风险 1 已收敛：`tasks/lessons.md` 不再存在重复 lesson 编号，并有自动化测试防止回归；历史归档中关键旧编号引用已同步到新编号。
- 风险 2 已收敛：`CLAUDE.md` 不再承载当前版本事实，版本源迁回 `src/entries/userscript-meta.js`；review-team 和测试已同步这一契约。
- 本轮没有修改业务源码、构建产物或真实页面运行态。
