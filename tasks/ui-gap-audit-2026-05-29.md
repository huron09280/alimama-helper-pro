# 现有页面 UI 规范差距审计 - 2026-05-29

## 审计口径

- 规范来源：`docs/插件UI统一设计规范.md`、`docs/图标设计规范.md`。
- 审计范围：主面板、算法护航、组建计划、批量+、下载面板、计划行快捷入口与复制计划弹窗、并发日志弹窗、万能查数/人群对比看板、授权/错误遮罩。
- 证据来源：`src/` 源码、现有 `docs/images/*.png` 截图、只读子代理审计结果。
- 迁移原则：先修影响 UI 操作确定性的缺陷，再做 token/图标/可访问性统一；不改真实投放、创建、提交、删除业务链路。

## 总体优先级

| 优先级 | 页面 | 迁移主题 | 理由 |
| --- | --- | --- | --- |
| P0/P1 | 组建计划 | 矩阵预设按钮单一路径触发 | 当前同时存在 inline `onclick` 和事件监听，点击可能重复应用预设，影响 UI 操作可靠性。 |
| P1 | 算法护航 | 裸文本图标、结果浮层语义、焦点与动效降级 | 范围集中，直接影响核心弹窗体验，迁移风险可控。 |
| P1 | 批量+ | 菜单浮层 token 化、私有字体箭头替换、确认弹窗图标统一 | 菜单是插件自有 UI；触发按钮继续同构原生，避免破坏页面兼容。 |
| P1/P2 | 组建计划 | `--am-wxt-*` 样式事实源收敛、批量编辑弹窗内错误态 | 文件巨大，需分阶段，避免视觉与行为混改。 |
| P2 | 主面板 | 交互元素语义化、局部硬编码色 token 化 | 视觉已基本达标，主要是可访问性和 token 收敛。 |
| P2 | 下载面板 | 响应式宽度、focus-visible | 已基本符合，补小范围体验缺口即可。 |
| P2 | 并发日志弹窗 | 弹窗语义、焦点恢复、浅玻璃 token 化 | 已完成源码迁移与 `@chrome` 安全运行态验收；不触发真实并发开启。 |
| P2 | 万能查数/人群对比看板 | 窗口动作按钮、视图页签语义、快捷话术与图例可访问性 | 入口频繁使用，首批语义修复已完成，剩余为局部控件可达性。 |
| P2/P3 | 授权/错误遮罩 | 锁定遮罩 ARIA、浅玻璃 token 化、安全展示 | 仅在授权失败时出现，需避免为验收强制清授权缓存；适合静态与构建产物强断言。 |

## 主面板

### 已符合

- `src/main-assistant/ui.js` 已在 `:root` 注入 `--am26-*` token，并统一主面板、下载面板、护航面板基础字体、玻璃背景、阴影和边框。
- 主面板使用 18px 圆角、浅色玻璃面板、两列工具按钮，符合“小面板 + 高密度工作台”的定位。
- 标题、工具按钮、日志标题、关闭按钮使用 `renderAmIcon()` / `renderAmWindowIcon()`，未用 emoji 作为功能图标。
- 辅助显示开关为胶囊形态，带状态圆点和文字，不只靠颜色表达。
- 本轮迁移后，悬浮球、关闭按钮、工具入口、辅助显示开关、日志清空/展开均已改为真实 `button type="button"`。
- 本轮迁移后，辅助显示入口、辅助开关和日志展开状态已同步 `aria-expanded` / `aria-pressed` / `aria-controls`，日志区域具备 `role="log"` 与 `aria-live="polite"`。
- 本轮 P2 迁移后，悬浮球 hover 已从大幅 `scale(1.08)` 收敛为克制位移、统一浅玻璃表面和轻阴影反馈。
- 本轮 P2 迁移后，日志区背景、边框、分隔线、时间色已收敛到 `--am26-surface`、`--am26-border` 和 `--am26-text-soft` 派生值。
- 本轮 P2 迁移后，辅助显示开关 hover 边框/背景和弱态圆点已收敛到 `--am26-*` token/柔色。

### 需要改

- 暂无 P1/P2 样式规范缺口；后续只在真实截图发现新的可读性、溢出或状态表达问题时追加小切片。

### 暂不改

- 日志内容中的 `⚠️`、`✅`、`🚀` 属于运行日志文本，不按功能图标强制替换。
- 主面板当前视觉已接近规范，不做大面积重排或主题重写，避免打断工具入口稳定性。

## 算法护航

### 已符合

- `src/optimizer/ui.js` 主面板、日志卡片、状态徽标、结果浮层已大量使用 `--am26-*` token。
- 标题图标、窗口控制图标、结果成功/失败图标使用共享图标入口。
- 日志卡片具备状态色、折叠、表格和执行结果展示，信息密度符合后台工具页。
- 本轮迁移后，计划卡片折叠箭头与手动设置下拉箭头已统一为 `renderAmIcon('chevron-down')`。
- 本轮迁移后，执行结果浮层已补齐 `role="dialog"`、`aria-modal`、标题关联、Esc 关闭、关闭后焦点恢复、关闭按钮 `focus-visible` 与 `prefers-reduced-motion`。
- 本轮 P2 迁移后，手动设置面板的卡片、输入、下拉、分段按钮、禁用态和提示文案已收敛到 `--am26-*` token，旧蓝紫/白底硬编码色不再作为样式事实源。
- 本轮 P2 迁移后，主护航面板窗口控制已改为 `button type="button"`，并为窗口控制、启动按钮、输入框和手动设置控件补齐可见 `focus-visible` 与 `prefers-reduced-motion`。

### 需要改

- 暂无 P1/P2 样式规范缺口；后续只在真实截图发现新的可读性或溢出问题时追加小切片。

### 暂不改

- `src/optimizer/core.js` 中 `ℹ️`、`⚠️` 是日志文本，暂不纳入图标迁移。
- “立即扫描并优化”和结果浮层真实完成态不为 UI 验收强制触发，避免制造真实优化请求；相关语义与焦点行为由专项断言覆盖。

## 组建计划

### 已符合

- 主弹窗和二级弹窗基本具备 `role="dialog"`、`aria-modal="true"`，关闭按钮有 `aria-label`。
- 本轮迁移后，主向导弹窗已补齐 `aria-labelledby="am-wxt-keyword-title"`，标题为稳定 `h3#am-wxt-keyword-title`，主/详情关闭按钮均显式 `type="button"`。
- 本轮迁移后，最终生效的主向导 overlay/modal/header/close/按钮 focus 样式已收敛到 `--am26-*` 浅玻璃事实源，保留 1320px 工作台宽度，并具备 18px 圆角、低对比边框、可见 `focus-visible` 和 `prefers-reduced-motion`。
- 本轮 P2 迁移后，主向导外层 overlay 已按用户最新反馈改为白色玻璃渐变窗口外背景，去除旧整屏灰色/暗色背景；主面板本体仍保持上一版轻透明玻璃，视觉聚焦当前“组建计划”弹窗内容。
- 本轮 P2 迁移后，主向导内部内容区不再额外铺整块灰/白底：`.am-wxt-body`、工作台页签、计划列表和计划行背景透明，主内容容器与表头改用 `--am26-surface*` 半透明 token，呈现方式与小万护航一致。
- 本轮 P2 迁移后，首页顶部 3 个摘要卡片已收敛到 `--am26-border`、`--am26-surface-strong`、`--am26-text-soft`、`--am26-primary-strong` 和 `--am26-text`，不再以硬编码白底、灰边或深灰数字作为最终样式事实源。
- 本轮 P2 迁移后，首页工具条、计划配置标题、计划搜索框、计划名称/摘要、行内编辑输入、行内编辑按钮和复制数量徽标已收敛到 `--am26-*` token；商品候选选择器搜索输入按真实运行态宿主 `#am-wxt-keyword-item-picker-mask` 完成验证。
- 本轮 P2 迁移后，首页计划头部 `批量编辑` / `清空` 操作按钮已收敛到 `--am26-*` 白色轻玻璃 token；默认、hover/focus 和 disabled 态不再以旧灰蓝硬编码色作为最终样式事实源。
- 本轮 P2 迁移后，`添加商品` 候选选择器外层遮罩已从深色压暗背景改为白色轻玻璃背景；弹窗主体、头部、候选面板和底部操作区已收敛到 `--am26-*` 浅玻璃 token。
- 本轮 P2 迁移后，`添加商品` 候选选择器内部候选商品行、商品名称、宝贝 ID、普通按钮、主按钮和禁用按钮已收敛到 `--am26-*` 浅玻璃 token，不再以旧浅蓝按钮、硬编码蓝色渐变、旧灰边或深灰/灰蓝文字作为最终样式事实源。
- 本轮 P2 迁移后，计划详情打开态的背板、详情面板壳层、标题栏和底部操作区已白色轻玻璃化；`#am-wxt-keyword-detail-backdrop` 不再使用暗色/灰色遮罩，详情面板最终规则已提升到 `#am-wxt-keyword-modal #am-wxt-keyword-detail-config`，避免被通用 `.am-wxt-config` 覆盖。
- 本轮回退后，组建计划主向导面板保持上一版轻透明玻璃背景；窗口外 overlay 后续按用户要求改为白色玻璃渐变，内部整块灰/白铺底仍保持移除，不再把主面板和矩阵主背景提升到过白的强白玻璃值。
- 本轮迁移后，批量编辑数值弹窗已补齐 `aria-labelledby`、稳定标题 id、`role="alert"` / `aria-live="assertive"` 错误容器；空提交、目标成本不可用和字段格式错误都会在弹窗内展示错误并回焦到对应输入。
- 本轮迁移后，批量编辑数值弹窗的外壳、输入、禁用态、错误态和按钮局部覆盖已收敛到 `--am26-*` 浅玻璃 token，通用场景弹窗按钮事实源未被扩大改动。
- 本轮迁移后，点击首页计划头部 `批量编辑` 打开的批量编辑数值弹窗外层遮罩已增加专属 `am-wxt-scene-popup-mask-batch-number` class，并改为白色玻璃渐变背景；通用场景弹窗默认深色 mask 未被扩大替换。
- 本轮迁移后，通用场景弹窗已补齐稳定标题关联、默认聚焦、Tab/Shift+Tab 焦点循环、Esc 关闭、事件解绑和关闭后回焦。
- 本轮迁移后，AI 点睛屏蔽词 tag 删除按钮已从裸文本 `x` 迁移为共享 close SVG，具备 `type="button"`、`aria-label`、`title` 和局部 `focus-visible`，屏蔽词 tag 视觉同步收敛到 `--am26-*` token。
- 本轮迁移后，屏蔽人群设置已选列表的文字“移除”按钮已迁移为共享 close SVG 图标按钮，具备 `type="button"`、`aria-label`、`title`、局部危险 hover 和可见 `focus-visible`。
- 本轮迁移后，屏蔽人群设置已选区标题、已选行、空状态和脚注已收敛到 `--am26-*` 浅玻璃 token，不再使用硬编码白/灰底和灰色文字作为样式事实源。
- 本轮迁移后，首页底部提交条、提交摘要、执行模式数量徽标、执行模式下拉菜单容器/菜单项/hover/active 态/数量徽标和快捷日志区已收敛到 `--am26-*` 浅玻璃 token，不再使用硬编码白/灰底、灰字、旧蓝紫徽标或白底浅蓝菜单覆盖作为样式事实源。
- 本轮迁移后，日志页/预览日志的摘要盒、预览日志、请求预览、执行日志和日志行成功/失败态已收敛到 `--am26-*` 浅玻璃 token，不再以硬编码白底灰边、深色预览底或旧红绿日志色作为最终样式事实源。
- 本轮迁移后，矩阵页维度类型下拉、维度值下拉、目标成本/ROI 包下拉和原生 select 兜底已收敛到 `--am26-*` 浅玻璃 token，触发器、下拉面板、选项、箭头和禁用态不再以旧白底、灰边或旧蓝紫硬编码色作为最终样式事实源。
- 关键动作图标大多使用 `renderAmIcon()` / `renderAmWindowIcon()`，如关闭、删除、添加、帮助、外链等。
- 矩阵配置已有 empty、disabled、success、error 状态承载，且大量处理 `min-width: 0`、省略号和响应式。
- 矩阵页、首页、日志页已经形成工作台结构，功能分区清晰。

### 需要改

- 组建计划内部内容区仍存在 `--am-wxt-*` 局部 token 和硬编码蓝紫/白底样式，后续按控件组继续收敛，避免一次性重写大文件。
- 少量通用移除/取消添加类按钮仍以文字为主，后续若改成图标按钮需按具体弹窗逐项验证；AI 点睛屏蔽词删除裸 `x` 与屏蔽人群已选列表“移除”已完成迁移。

### 暂不改

- 请求构建、提交、修复链路和网络捕获不纳入本轮 UI 迁移，避免把视觉规范扩大成业务链路重构。
- 高级设置中的手机预览区域暂缓，优先级低于矩阵触发可靠性和样式事实源收敛。
- 当前向导后置覆盖更接近高密度后台工具，视觉方向需先统一后再大规模 token 化，避免局部混搭。

## 批量+

### 已符合

- 触发按钮复刻/克隆官方“批量计划设置”结构和 computed style，符合行内增强入口要贴合原生页面的约束。
- 菜单有 `role="menu"`，菜单项有 `role="menuitem"`，触发器有 `aria-haspopup` 和 `aria-expanded`。
- 批量开启、暂停、删除有二次确认；危险动作有危险态。
- 人群推广/线索推广相关动作优先复用官方弹窗和抽屉，不用自定义弹窗替代官方能力。
- 本轮迁移后，插件自有菜单浮层已改用 `--am26-*` token、共享 SVG 图标、10px 圆角、玻璃背景和可见 `focus-visible`。
- 本轮迁移后，自造 fallback 箭头已改为 `renderAmIcon('chevron-down')`；真实原生 DOM 箭头按兼容策略继续保留。
- 本轮迁移后，批量确认弹窗已将文本 `!` 替换为共享告警/危险 SVG 图标，并补齐标题关联与关闭后焦点恢复。
- 本轮 P2 迁移后，批量确认弹窗卡片宽度已从 320px 扩到 360px，保留移动端 `calc(100vw - 28px)` 约束、18px 圆角和统一浅玻璃 token。

### 需要改

- 暂无 P1/P2 样式规范缺口；后续只在真实截图发现新的可读性、溢出或状态表达问题时追加小切片。

### 暂不改

- 触发按钮继续同构原生样式，不强行改成插件玻璃按钮；这是避免跨页面工具栏间距和状态漂移的兼容策略。
- 批量+ 的真实提交类动作不在 UI 迁移中改业务流程，后续只做只读或受保护验收。

## 下载面板

### 已符合

- `src/main-assistant/ui.js` 的 `#am-report-capture-panel` 已使用 `--am26-*`、浅玻璃、低对比边框和主按钮渐变。
- 标题、下载和关闭图标使用共享渲染入口。
- 捕获 URL 使用 `textContent`，下载链接先 `sanitizeUrl()`，避免 URL HTML 注入。
- 本轮迁移后，面板宽度已改为 `min(340px, calc(100vw - 24px))`，并同步到 `Interceptor.createPanel()` 的内联可见性兜底。
- 本轮迁移后，下载链接具备可访问名称，复制/关闭按钮显式声明 `type="button"`，下载/复制/关闭均具备可见 `focus-visible` 和减少动画适配。

### 需要改

- 仅有捕获成功态；当前入口是“捕获后才展示”，可不新增完整 empty/error/retry 状态，但失败态需要在未来真实报错入口出现时补齐。

### 暂不改

- `Interceptor.createPanel()` 的内联 `cssText` 是样式注入失败时的可见性兜底，不作为独立主题系统处理。
- 面板体量小，视觉已符合，本轮不新增独立状态机或主题系统。

## 计划行快捷入口与复制计划弹窗

### 已符合

- 计划行快捷查数、并发开启、复制按钮已使用共享 `renderAmIcon()` 图标，且按钮挂载在原生操作区，符合行内增强入口贴合原生的约束。
- 复制计划一览窗在真实提交前展示待生成计划，并明确“确认后才会提交创建请求”，降低误触真实创建的风险。
- 复制计划一览窗已有生成中、成功、错误状态区，批量出价和预算控件使用轻量下划线形态，符合高密度表格微调场景。
- 复制计划一览窗和复制成功窗已迁移到共享 SVG 图标、`aria-labelledby` 标题关联、Esc 关闭、关闭后焦点恢复、`--am26-*` 浅玻璃面板和减少动画适配；真实页面已验证一览窗打开后 Esc 关闭会回到同一行复制按钮。
- 本轮 P2 迁移后，复制计划一览窗和复制成功窗已从旧灰色遮罩改为白色轻玻璃背景，卡片本体改为更明确的白色轻玻璃面；真实页面已验证一览窗打开、取消关闭且未触发复制创建。
- 并发日志关闭按钮已使用共享 close 图标，不再使用裸 `×`。
- 并发日志弹窗源码已补齐 `aria-labelledby`、标题共享启动图标、状态/日志 live 语义、日志区键盘滚动焦点、打开/关闭 `aria-hidden`、Esc 关闭、关闭后焦点恢复和打开后聚焦关闭按钮。
- 并发日志弹窗样式已从旧黑遮罩/白卡片/深色终端日志区迁移到 `--am26-*` 浅玻璃面板、18px 圆角、低对比边框、状态语义色、可见 `focus-visible` 和 `prefers-reduced-motion`。
- 并发日志弹窗已完成 `@chrome` 安全运行态验收：真实页面确认新版样式注入、旧深色终端样式消失、入口按钮存在且控制台 error/warn 为空；未点击并发开启，避免触发真实全量暂停/重开请求。

### 需要改

- 暂无 P1/P2 样式规范缺口；真实并发开启后的完整日志流只在用户明确授权写操作时再做端到端验证。

### 暂不改

- 复制计划真实创建、官方复制接口、创建后暂停兜底和页内搜索逻辑不纳入 UI 迁移切片。
- 行级复制按钮继续贴合原生操作区，不强行改为大面积插件玻璃按钮，避免和原生列表操作区脱节。

## 万能查数/人群对比看板

### 已符合

- `src/main-assistant/magic-report.js` 已复用 `--am26-*` token、浅玻璃弹窗、统一窗口标题区和共享 SVG 图标，整体方向符合高密度工具弹窗。
- 万能查数与人群对比看板共用一个弹窗壳层，普通查数态和看板全屏态通过状态类切换，不额外引入第二套主题。
- 本轮迁移后，刷新和关闭窗口动作已从可点击 `span` 迁移为真实 `button type="button"`，并补齐 `aria-label`、`title`、共享 SVG 图标、可见 `focus-visible` 与减少动画适配。
- 本轮迁移后，“万能查数 / 人群对比看板”视图切换已补齐 `tablist`、`tab`、`tabpanel`、`aria-selected`、`aria-controls`、`aria-labelledby`、`aria-hidden`、`tabindex` 和 Arrow/Home/End 键盘切换。
- 本轮 P2 迁移后，快捷话术按钮已补齐稳定 `aria-label`、临时 `aria-pressed` 状态同步和可见 `focus-visible`。
- 本轮 P2 迁移后，顶部人群/周期/显示占比/显示提示图例按钮已补齐稳定 `aria-label`、`aria-pressed` 状态同步、装饰色点 `aria-hidden` 和可见 `focus-visible`。
- 本轮 P2 迁移后，商品 ID 自定义下拉已补齐触发器 `aria-label` / `aria-controls`、listbox `id` / `aria-label` / `aria-hidden`、option `id` / `aria-label`，以及 Arrow/Home/End/Enter/Space/Escape/Tab 键盘边界。

### 需要改

- 当前真实列表页未识别计划 ID 时商品 ID 下拉为禁用空列表；有候选商品时的键盘选项切换由专项断言覆盖，后续若能在受保护详情态稳定复现，可补一次真实有选项验收。

### 暂不改

- 快捷话术提交、iframe 查数、人群看板刷新请求、重试和商品数据加载不纳入首批语义迁移，避免触发真实查询或改变数据请求节奏。
- 人群对比看板图表本身暂不重绘；先处理外层窗口、页签和控件可达性，再按真实截图评估图表密度和图例布局。

## 授权/错误遮罩

### 已符合

- 授权锁定遮罩仍保留全屏阻断能力：固定定位、全屏覆盖和最高层级，不降低未授权交互阻断边界。
- 本轮迁移后，遮罩根节点已补齐 `role="dialog"`、`aria-modal`、`aria-labelledby="am-license-lock-title"`、`aria-describedby="am-license-lock-message"`，标题和正文具备稳定 id。
- 本轮迁移后，遮罩卡片可聚焦，状态图标改为共享 `alert-triangle` SVG，视觉收敛到 `--am26-*` 浅玻璃 token、18px 圆角、低对比边框和 `var(--am26-shadow)`。
- 本轮迁移后，meta 信息改为 `replaceChildren()` + `createElement()` + `textContent` 渲染，不再把 `shopName/runtime/version/build/channel` 等 state 字符串拼接成 HTML。
- 本轮测试明确禁止授权遮罩展示 `leaseToken`、`policyToken`、`deviceHash`、`nonce` 等敏感授权字段。

### 需要改

- 当前锁定遮罩没有重试按钮；是否需要“重新校验”入口应另开行为切片评估，必须确保只触发安全的按需校验，不改变授权状态机语义。
- 授权失败正文仍直接使用 `state.message`；目前保持原行为，后续若服务端错误体过长或包含细节，可再做错误码/用户文案分层。

### 暂不改

- 不改授权校验、缓存恢复、续租、shopId 解析、policy token 验签、background 桥或服务端请求。
- 不为视觉验收强制调用 `LicenseGuard.lock()`，避免清授权缓存或改变用户真实页面状态。

## 第一批迁移切片

1. 组建计划：移除矩阵预设 inline `onclick` 和重复 per-button 监听，保留 `matrixPresetList` 统一点击监听。（已完成）
2. 算法护航：替换裸文本功能图标，补结果浮层 dialog 语义、Esc 关闭和 focus-visible。（已完成）
3. 批量+：菜单浮层 token 化，替换私有字体箭头和确认弹窗文本图标。（已完成）
4. 主面板：交互元素语义化，收敛硬编码色。（首批已完成）
5. 下载面板：响应式宽度和 focus-visible。（已完成）
6. 计划行复制弹窗：一览窗/成功窗图标、语义、焦点和 token 化。（已完成）
7. 万能查数/人群对比看板：窗口动作按钮语义化，视图页签补齐 ARIA 和键盘切换。（已完成）
8. 万能查数/人群对比看板 P2：快捷话术、顶部图例、商品 ID 下拉补齐可访问名称、状态同步、focus-visible 和键盘边界。（已完成）
9. 并发日志弹窗：标题关联、live 语义、Esc/焦点恢复和浅玻璃 token 化。（已完成）
10. 组建计划样式事实源：主向导外壳标题关联、关闭按钮 type、最终覆盖块 token 化和 `@chrome` 运行态验收。（已完成）
11. 授权/错误遮罩：锁定遮罩 ARIA、浅玻璃 token、共享告警图标和 DOM/textContent 安全展示。（已完成）
12. 算法护航 P2：手动设置区和主护航面板控件 token、focus 与 reduced-motion 收敛。（已完成）
13. 组建计划批量编辑数值弹窗：可见错误态、字段焦点回退和局部 token 收敛。（已完成）
14. 组建计划 AI 点睛屏蔽词删除按钮：共享 close 图标、可访问名称和局部 focus/token 收敛。（已完成）
15. 主面板 P2：悬浮球 hover、日志区和辅助开关局部 token 收敛。（已完成）
16. 批量+ P2：确认弹窗 360px 阅读宽度和真实页面取消验收。（已完成）
17. 组建计划 P2：主向导去除整屏灰色背景和整页 blur，保留独立浅玻璃工作台面板。（已完成）
18. 组建计划 P2：通用场景弹窗标题关联、默认聚焦、焦点循环、Esc 关闭和关闭后回焦。（已完成）
19. 组建计划 P2：屏蔽人群设置已选列表“移除”按钮迁移为共享 close 图标按钮，并完成真实页面取消验收。（已完成）
20. 组建计划 P2：屏蔽人群设置已选区、已选行、空状态和脚注收敛到 `--am26-*` token，并完成真实页面取消验收。（已完成）
21. 组建计划 P2：首页底部提交条、执行模式数量徽标和快捷日志区收敛到 `--am26-*` token，并完成真实页面打开/菜单展开/关闭验收。（已完成）
22. 组建计划 P2：执行模式下拉菜单容器、菜单项、hover/active 态收敛到 `--am26-*` token，并完成真实页面菜单展开/关闭验收。（已完成）
23. 组建计划 P2：主向导内部整块灰/白底去除，内容区、页签和列表透明化，主内容容器改为 `--am26-surface*` 半透明 token。（已完成）
24. 组建计划 P2：首页摘要卡片收敛到 `--am26-*` token，并完成真实页面只读验收。（已完成）
25. 计划行复制弹窗 P2：复制一览窗/成功窗灰色遮罩改为白色轻玻璃背景，并完成真实页面只读打开/取消验收。（已完成）
26. 组建计划 P2：首页工具条、计划配置标题、计划搜索框、计划名称/摘要、行内编辑输入、行内编辑按钮、复制数量徽标和商品候选搜索输入收敛到 `--am26-*` token，并完成真实页面只读验收。（已完成）
27. 组建计划 P2：`添加商品` 候选选择器深色整屏遮罩改为白色轻玻璃遮罩，弹窗主体/头部/候选面板/底部操作区收敛到 `--am26-*` token，并完成真实页面只读验收。（已完成）
28. 组建计划 P2：计划详情背板和详情面板壳层白色轻玻璃化，标题栏/底部操作区收敛到 `--am26-*` token，并完成真实页面只读打开/关闭验收。（已完成）
29. 组建计划 P2：按用户最新反馈，将主向导面板从过白强玻璃回退到上一版轻透明玻璃，并重新完成只读验证。（已完成）
30. 组建计划 P2：日志页摘要盒、预览日志、请求预览、执行日志和日志行语义色收敛到 `--am26-*` token，并完成真实页面只读打开/切页/关闭验收。（已完成）
31. 组建计划 P2：首页计划头部 `批量编辑` / `清空` 按钮从旧灰蓝按钮收敛到白色轻玻璃 token，并完成真实页面只读打开/关闭验收。（已完成）
32. 组建计划 P2：点击 `批量编辑` 后的数值弹窗外层 mask 从通用深灰遮罩改为白色玻璃渐变，并完成真实页面只读打开/取消验收。（已完成）
33. 组建计划 P2：按用户最新反馈，将主弹窗窗口外 overlay 改为白色玻璃渐变，同时保留主面板本体上一版轻透明玻璃，并完成真实页面只读打开/关闭验收。（已完成）
34. 组建计划 P2：矩阵页维度选择器、下拉面板、选项、箭头和原生兜底收敛到统一 token，并完成真实页面只读展开/关闭验收。（已完成）

## 迁移验收记录

- 组建计划首批切片：源码和产物均不再包含矩阵预设 inline `onclick` 或 per-button 重复监听；专项测试与构建检查通过。
- 组建计划样式事实源切片：源码、根 userscript、`dist/packages/` 与 `dist/extension/page.bundle.js` 均已同步；专项测试覆盖主弹窗标题关联、关闭按钮 `type="button"`、最终生效的 `--am26-*` 浅玻璃外壳、可见 focus 和 reduced-motion。`@chrome` 打开真实 `one.alimama.com` 人群推广页，只点击主面板 `组建计划`，运行态确认弹窗 `role="dialog"`、`aria-labelledby="am-wxt-keyword-title"`、标题为 `H3#am-wxt-keyword-title`、关闭按钮为 `BUTTON type="button"` 且包含共享 SVG，计算样式为 1320px 宽、18px 圆角、`var(--am26-panel-strong)` 玻璃背景、`var(--am26-shadow)` 阴影、`blur(20px) saturate(1.4)`；控制台 error/warning 为空。未点击 `提交创建` 或 `批量创建`。截图见 `tasks/ui-audit-keyword-wizard-shell-chrome-2026-05-29.png`。
- 组建计划去除整屏灰底切片：源码、根 userscript、`dist/packages/` 与 `dist/extension/page.bundle.js` 均已同步；专项测试覆盖外层 overlay 透明背景、禁止旧灰色遮罩/整页 blur 回退。`@chrome` 打开真实 `one.alimama.com` 人群推广页，只点击主面板 `组建计划`；运行态确认 `#am-wxt-keyword-overlay.open` 为 `background-color: rgba(0, 0, 0, 0)`、`background-image: none`、`backdrop-filter: none`，最终覆盖 CSS 命中 `background: transparent` 且不包含旧 `rgba(27, 36, 56, 0.28)` / `blur(10px)` 规则；主面板本体仍保持 1320px 宽、18px 圆角、浅玻璃背景和 `blur(20px) saturate(1.4)` 面板模糊。未点击 `提交创建`、`批量创建` 或任何真实创建/提交入口，关闭后确认 overlay 与 modal 均隐藏。截图见 `tasks/ui-audit-keyword-wizard-no-gray-overlay-chrome-2026-05-29.png`。
- 组建计划去除整屏灰底复核：按用户最新反馈再次复核同一切片，初次 `npm run build:check` 发现根 userscript 未与 `src/` 同步，已运行 `npm run build` 修复并重新通过 `npm run build:check`、组建计划相关测试、`npm run check:syntax`、`node --check dist/extension/page.bundle.js` 和 `git diff --check`。`@chrome` 复核真实 `one.alimama.com` 人群推广页，只点击插件悬浮球与 `组建计划`，运行态确认 `#am-wxt-keyword-overlay.open` 为 `display:flex`、`background-color: rgba(0, 0, 0, 0)`、`background-image: none`、`backdrop-filter: none`，最终 CSS 覆盖块命中 `background: transparent; backdrop-filter: none; -webkit-backdrop-filter: none;`，overlay 规则内不包含旧 `rgba(27, 36, 56, 0.28)` 或 `blur(10px)`；主面板仍为 1320px、18px 圆角、浅玻璃面板，控制台 error/warn 为 0。未点击 `提交创建`、`批量创建`、`生成其他策略` 或任何真实创建/提交入口，关闭后确认 overlay 隐藏、modal 不可见。复核截图见 `tasks/ui-audit-keyword-wizard-no-gray-overlay-chrome-2026-05-29-recheck.png`。
- 组建计划内部整块灰底去除切片：源码、根 userscript、`dist/packages/` 与 `dist/extension/page.bundle.js` 均已同步；专项测试覆盖 `.am-wxt-body`、工作台页签、计划列表、表头和计划行最终生效 CSS，不再回退到整块 `#fff` / `#f8fafc` / 灰白背景。`@chrome` 打开真实 `one.alimama.com` 人群推广页，只点击插件悬浮球与 `组建计划`；未点击 `提交创建`、`批量创建`、`生成其他策略` 或任何真实创建/提交入口。运行态确认 overlay 仍透明无整页 blur，modal 保持 `--am26-panel-strong` 浅玻璃；`.am-wxt-body`、`.am-wxt-workbench-tabs`、`.am-wxt-strategy-list` 和 `.am-wxt-strategy-item` 计算背景均为透明，`.am-wxt-strategy-board` 与 `.am-wxt-strategy-list-head` 为 `rgba(255, 255, 255, 0.25)` 半透明 token 背景；控制台 error/warn 为 0。截图见 `tasks/ui-audit-keyword-wizard-no-inner-gray-chrome-2026-05-29.png`。验收后点击关闭，确认 overlay 不再打开。
- 组建计划首页摘要卡片 token 切片：源码、根 userscript、`dist/packages/` 与 `dist/extension/page.bundle.js` 均已同步；专项测试覆盖首页摘要容器、摘要卡片、标签、数字和单位最终有效 CSS 块使用 `--am26-*` token，并禁止回退到硬编码白底、灰边和深灰数字。`@chrome` 打开真实 `one.alimama.com` 人群推广页，只点击插件悬浮球与 `组建计划` 打开主向导首页；未点击 `提交创建`、`批量创建`、`生成其他策略` 或任何真实创建/提交入口。运行态确认 3 个摘要卡片可见，卡片背景 `rgba(255, 255, 255, 0.45)`、边框 `rgba(255, 255, 255, 0.4)`、标签色 `rgb(80, 90, 116)`、数字色 `rgb(29, 63, 207)`，控制台 error/warn 为 0。历史样式文本中仍有旧色片段，但最终有效 CSS 块、专项断言和 computed style 均指向 `--am26-*` token。截图见 `tasks/ui-audit-keyword-home-summary-token-chrome-2026-05-29.png`。
- 组建计划首页工具条与计划行文字控件 token 切片：源码、根 userscript、`dist/packages/` 与 `dist/extension/page.bundle.js` 均已同步；专项测试覆盖首页工具条、计划搜索框、计划配置标题、计划名称/摘要、行内编辑输入、行内编辑按钮、复制数量徽标和商品候选选择器真实宿主。Chrome DevTools MCP 打开真实 `one.alimama.com` 人群推广页，只点击插件悬浮球与 `组建计划` 打开主向导首页；未点击 `提交创建`、`批量创建`、`生成其他策略`、`删除`、`编辑保存` 或任何真实创建/提交入口。运行态确认计划搜索框背景 `rgba(255, 255, 255, 0.45)`、边框 `rgba(255, 255, 255, 0.4)`、文字 `rgb(27, 36, 56)`，计划配置标题/计划名称为 `rgb(27, 36, 56)`，摘要为 `rgb(80, 90, 116)`，弱摘要为 `rgba(80, 90, 116, 0.62)`，复制数量徽标背景 `rgba(255, 255, 255, 0.25)`、边框 `rgba(255, 255, 255, 0.4)`、文字 `rgb(80, 90, 116)`；只点击 `添加商品` 打开候选选择器后，确认真实宿主搜索输入为白色轻玻璃背景、品牌弱光边框 `rgba(69, 84, 229, 0.42)` 和 `0 0 0 3px rgba(69,84,229,0.12)` focus ring。验收后关闭候选选择器与主向导，确认 overlay、modal 和候选选择器无可见残留，performance resource 未出现创建/复制/更新/删除类接口；控制台仅有页面外部资源 `ERR_TUNNEL_CONNECTION_FAILED` 与浏览器弃用提示噪声。截图见 `tasks/ui-audit-keyword-home-toolbar-row-token-chrome-2026-05-29.png`。
- 组建计划添加商品候选选择器白色背景切片：源码、根 userscript、`dist/packages/` 与 `dist/extension/page.bundle.js` 均已同步；专项测试覆盖候选选择器 mask/dialog/head/panel/toolbar/foot 的白色轻玻璃背景和旧深色遮罩回退防护。Chrome DevTools MCP 刷新真实 `one.alimama.com` 人群推广页，只点击插件悬浮球、`组建计划`、`添加商品` 打开候选选择器；未点击 `全部添加`、单项 `添加`、底部 `确定`、`提交创建`、`批量创建`、`生成其他策略` 或任何真实创建/保存入口。运行态确认 `#am-wxt-keyword-item-picker-mask` 背景为 `rgba(255, 255, 255, 0.72)`、`backdrop-filter: blur(8px) saturate(1.15)`，最终 mask CSS 规则不含旧 `rgba(15, 23, 42, 0.48)`；候选弹窗主体为白色轻玻璃渐变、边框 `rgba(255, 255, 255, 0.6)`、阴影 `rgba(31, 38, 135, 0.15) 0px 8px 32px 0px`、`blur(18px) saturate(1.35)`；头部背景 `rgba(255, 255, 255, 0.45)`，工具条/候选面板/底部操作区背景 `rgba(255, 255, 255, 0.25)`，搜索输入保持品牌弱光 focus ring。验收后关闭候选选择器和主向导，确认 overlay、modal、候选选择器、执行模式菜单和详情页均无残留，performance resource 未出现添加/创建/保存类接口；控制台仅有页面外部资源 `ERR_TUNNEL_CONNECTION_FAILED` 噪声。截图见 `tasks/ui-audit-keyword-item-picker-white-bg-chrome-2026-05-29.png`。
- 组建计划计划详情背板白色化切片：源码、根 userscript、`dist/packages/` 与 `dist/extension/page.bundle.js` 均已同步；专项测试覆盖详情背板白色轻玻璃背景、详情面板壳层 token、标题栏/底部操作区 token 和旧暗色/硬编码白底灰边回退防护。Chrome DevTools MCP 刷新真实 `one.alimama.com` 人群推广页，只点击插件悬浮球、`组建计划`、计划行 `编辑` 打开计划详情；未点击 `保存并关闭`、`批量创建`、`提交创建`、`生成其他策略` 或任何真实创建/保存入口。运行态确认 `#am-wxt-keyword-detail-backdrop` 背景为 `rgba(255, 255, 255, 0.72)`、`backdrop-filter: blur(8px) saturate(1.15)`；`#am-wxt-keyword-detail-config` 为白色轻玻璃渐变、边框 `rgba(255, 255, 255, 0.6)`、18px 圆角、阴影 `rgba(31, 38, 135, 0.15) 0px 8px 32px 0px`、`blur(18px) saturate(1.35)`；标题栏/底部操作区背景 `rgba(255, 255, 255, 0.45)`、边框 `rgba(255, 255, 255, 0.4)`，最终规则不含旧暗色背板或旧硬编码白底灰边。验收后关闭详情和主向导，确认 overlay、modal、详情页和背板无可见残留，performance resource 未出现创建/复制/更新/保存类接口。截图见 `tasks/ui-audit-keyword-detail-backdrop-white-chrome-2026-05-29.png`。
- 组建计划主面板背景回退切片：用户反馈刚才的强白玻璃面板不喜欢，要求回退到上一版。源码已移除组建计划主面板 `0.96 -> 0.88` 强白覆盖，恢复为 `0.6 -> 0.2` 轻透明玻璃；同时移除锁定强白主面板和矩阵主背景的过时专项断言，并在 `tasks/lessons.md` 记录后续不要主动过度白化组建计划主面板。源码、根 userscript、`dist/packages/` 与 `dist/extension/page.bundle.js` 均已同步；专项测试、构建检查、语法检查和空白检查通过。Chrome DevTools MCP 硬刷新真实 `one.alimama.com` 线索推广页，通过 `window.__AM_WXT_KEYWORD_API__.openWizard()` 只打开组建计划主面板；运行态确认 overlay 透明且无整页 blur，`#am-wxt-keyword-modal` 背景为 `linear-gradient(135deg, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.2))`，边框 `rgba(255, 255, 255, 0.6)`，阴影 `rgba(31, 38, 135, 0.15) 0px 8px 32px 0px`。验收后关闭主向导，确认 overlay 隐藏、modal 不可见，performance resource 未出现创建/复制/更新/保存类接口；控制台仅有页面外部资源 `ERR_TUNNEL_CONNECTION_FAILED` 噪声。截图见 `tasks/ui-audit-keyword-background-reverted-chrome-2026-05-29.png`。
- 组建计划主弹窗窗口外白色玻璃渐变切片：源码、根 userscript、`dist/packages/` 与 `dist/extension/page.bundle.js` 均已同步；专项测试覆盖主向导窗口外 `#am-wxt-keyword-overlay:not(.item-picker-open)` 白色玻璃渐变、`item-picker-open` 透明隔离和主面板本体不回到强白背景。Chrome DevTools MCP 硬刷新真实 `one.alimama.com` 人群推广页，通过 `window.__AM_WXT_KEYWORD_API__.openWizard()` 只打开组建计划主弹窗；未点击 `补齐5维`、`生成计划`、`清空`、`批量创建`、`提交创建`、`保存并关闭` 或任何真实创建/保存入口。运行态确认窗口外背景为 `linear-gradient(135deg, rgba(255, 255, 255, 0.78), rgba(255, 255, 255, 0.48))`，`backdrop-filter: blur(8px) saturate(1.15)`；`#am-wxt-keyword-modal` 仍保持 `linear-gradient(135deg, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.2))`，边框 `rgba(255, 255, 255, 0.6)`，阴影 `rgba(31, 38, 135, 0.15) 0px 8px 32px 0px`。验收后关闭主向导，确认 overlay、modal、商品选择器和场景弹窗均无可见残留，performance resource 未出现创建/复制/更新/保存/删除类接口。截图见 `tasks/ui-audit-keyword-main-overlay-white-glass-chrome-2026-05-29.png`。
- 组建计划日志页容器 token 切片：源码、根 userscript、`dist/packages/` 与 `dist/extension/page.bundle.js` 均已同步；专项测试覆盖日志页面板、摘要盒、摘要标题和值、预览日志、请求预览、执行日志、日志行和成功/失败语义色使用 `--am26-*` token，并禁止回退到 `#fff`、`#0f172a`、`#d1d5db`、`#334155`、旧灰边和旧红绿日志色。Chrome DevTools MCP 硬刷新真实 `one.alimama.com` 线索推广页，通过 `window.__AM_WXT_KEYWORD_API__.openWizard()` 只打开组建计划并切到 `日志页`；未点击 `预览请求`、`生成其他策略`、`批量创建`、`提交创建`、`保存并关闭` 或任何真实创建/保存入口。运行态确认 `#am-wxt-keyword-previewlog-panel`、摘要盒和 `#am-wxt-workbench-preview-log` 背景均为 `rgba(255, 255, 255, 0.25)`，边框为 `rgba(255, 255, 255, 0.4)`，日志文字为 `rgb(80, 90, 116)`；隐藏的 `#am-wxt-keyword-preview` / `#am-wxt-keyword-log` 也已命中新背景、边框和文字 token。验收后关闭主向导，确认 overlay 隐藏、modal 不可见，performance resource 未出现创建/复制/更新/保存/删除类接口；控制台仅有页面外部资源 `ERR_TUNNEL_CONNECTION_FAILED` 噪声。截图见 `tasks/ui-audit-keyword-previewlog-token-chrome-2026-05-29.png`。
- 组建计划首页批量编辑按钮白色玻璃切片：源码、根 userscript、`dist/packages/` 与 `dist/extension/page.bundle.js` 均已同步；专项测试覆盖首页计划头部 `批量编辑` / `清空` 按钮默认、hover/focus 和 disabled 态使用 `--am26-*` 白色轻玻璃 token，并禁止回退到旧灰蓝硬编码色。Chrome DevTools MCP 硬刷新真实 `one.alimama.com` 线索推广页，通过 `window.__AM_WXT_KEYWORD_API__.openWizard()` 只打开组建计划首页；未点击 `批量编辑`、`清空`、`提交创建`、`批量创建`、`保存并关闭` 或任何真实创建/保存入口。运行态确认 `批量编辑` 和 `清空` 默认背景均为 `rgba(255, 255, 255, 0.45)`、边框 `rgba(255, 255, 255, 0.4)`、文字 `rgb(80, 90, 116)`；临时只读切换 disabled 并等待 transition 后，两个按钮 disabled 背景均为 `rgba(255, 255, 255, 0.25)`、文字 `rgba(80, 90, 116, 0.62)`、`opacity: 1`。验收后关闭主向导，确认 overlay 无可见残留，performance resource 未出现创建/复制/更新/保存/删除类接口；控制台仅有页面外部资源 `ERR_TUNNEL_CONNECTION_FAILED` 噪声。截图见 `tasks/ui-audit-keyword-batch-edit-button-white-chrome-2026-05-29.png`。
- 组建计划批量编辑数值弹窗外层 mask 白色玻璃切片：源码、根 userscript、`dist/packages/` 与 `dist/extension/page.bundle.js` 均已同步；专项测试覆盖批量编辑弹窗专属 mask class、白色玻璃渐变、blur 和通用场景 mask 未扩大替换。Chrome DevTools MCP 打开真实 `one.alimama.com` 人群推广页，通过 `window.__AM_WXT_KEYWORD_API__.openWizard()` 打开组建计划，只点击 `#am-wxt-keyword-batch-edit-strategy` 打开“批量修改数值”弹窗，未点击弹窗内 `批量修改`、`批量创建`、`提交创建`、`保存并关闭` 或任何真实创建/保存入口。运行态确认 `#am-wxt-scene-popup-mask` 类名为 `am-wxt-scene-popup-mask am-wxt-scene-popup-mask-batch-number`，计算背景为 `linear-gradient(135deg, rgba(255, 255, 255, 0.78), rgba(255, 255, 255, 0.48))`，`backdrop-filter: blur(8px) saturate(1.15)`；弹窗本体仍为 560px 宽、18px 圆角和浅玻璃背景。验收后只点击弹窗 `取消` 并关闭主向导，确认 mask、overlay 和 modal 均无可见残留，performance resource 未出现创建/复制/更新/保存/删除类接口。截图见 `tasks/ui-audit-keyword-batch-edit-popup-white-mask-chrome-2026-05-29.png`。
- 组建计划矩阵页维度选择器 token 切片：源码、根 userscript、`dist/packages/` 与 `dist/extension/page.bundle.js` 均已同步；专项测试覆盖矩阵页维度选择器触发器、hover/open/disabled、胶囊型维度类型、CSS chevron、下拉面板、选项、空状态、趋势主题新增按钮和原生 select 兜底。Chrome DevTools MCP 打开真实 `one.alimama.com` 人群推广页，通过 `window.__AM_WXT_KEYWORD_API__.openWizard()` 打开组建计划并切到 `矩阵页`；当前没有已有维度时只点击本地 UI `添加维度` 生成 1 条临时维度行，再展开维度类型下拉读取样式，未点击 `补齐5维`、`生成计划`、`清空`、`提交创建`、`批量创建`、`保存并关闭` 或任何真实创建/保存入口。运行态确认触发器背景 `rgba(69, 84, 229, 0.14)`、边框 `rgba(69, 84, 229, 0.42)`、文字 `rgb(29, 63, 207)`、`background-image:none`；下拉面板背景为 `linear-gradient(135deg, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.2))`、边框 `rgba(255, 255, 255, 0.6)`、阴影 `rgba(31, 38, 135, 0.15) 0px 8px 32px 0px`、`backdrop-filter: blur(12px) saturate(1.25)`；选项文字 `rgb(80, 90, 116)`、背景透明；箭头最终 `background-image:none`，由 `::before` 8px CSS chevron 绘制；隐藏原生 select 兜底背景为 `rgba(255, 255, 255, 0.45)`、边框 `rgba(255, 255, 255, 0.4)`、文字 `rgb(27, 36, 56)`。验收后删除临时维度行并关闭主向导，确认 `remainingDimensions=0`、overlay 和 picker 均无可见残留，performance resource 未出现创建/复制/更新/保存/删除类接口。截图见 `tasks/ui-audit-keyword-matrix-picker-token-chrome-2026-05-30.png`。
- 组建计划批量编辑数值弹窗切片：源码、根 userscript、`dist/packages/` 与 `dist/extension/page.bundle.js` 均已同步；专项测试覆盖批量弹窗标题关联、错误容器、校验失败 focus 回退、字段异常 `focusSelector`、局部 token 和按钮作用域。`@chrome` 打开真实 `one.alimama.com` 人群推广页，只点击主面板 `组建计划` 和 `批量编辑`，再点击弹窗内 `批量修改` 触发空表单校验；运行态确认弹窗 `role="dialog"`、`aria-labelledby="am-wxt-scene-popup-title"`、错误节点 `role="alert"` / `aria-live="assertive"`，计算样式为 560px 宽、18px 圆角、浅玻璃背景、`var(--am26-shadow)` 对应阴影、`blur(18px) saturate(1.35)`。空提交后弹窗未关闭，错误条显示“请至少填写 1 个需要批量修改的数值字段”，焦点回到 `dayAverageBudget` 输入，控制台 error/warn 为空。未点击 `批量创建`、`提交创建` 或任何真实创建/提交入口。截图见 `tasks/ui-audit-keyword-batch-edit-popup-chrome-2026-05-29.png`。
- 组建计划通用场景弹窗焦点约束切片：源码、根 userscript、`dist/packages/` 与 `dist/extension/page.bundle.js` 均已同步；专项测试覆盖标题关联、默认聚焦、Tab/Shift+Tab 焦点循环、Esc 关闭、事件解绑和关闭后回焦。`@chrome` 打开真实 `one.alimama.com` 人群推广页，进入 `组建计划` 第 4 个“自定义推广”计划详情，只点击 `投放资源位/投放地域/分时折扣` 的 `编辑设置` 打开“高级设置”通用场景弹窗；未点击 `确定`、`保存并关闭`、`批量创建` 或 `提交创建`。运行态确认弹窗 `role="dialog"`、`aria-modal="true"`、`aria-labelledby="am-wxt-scene-popup-title"`，默认焦点在关闭按钮，12 个可聚焦控件被约束在弹窗内，`Shift+Tab` 从首项循环到 `确定`，`Tab` 从末项回到关闭按钮，`Escape` 关闭后焦点恢复到 `编辑设置` 触发按钮，控制台 error/warn 为空。截图见 `tasks/ui-audit-keyword-scene-popup-focus-trap-chrome-2026-05-29.png`。
- 组建计划 AI 点睛屏蔽词删除按钮切片：源码、根 userscript、`dist/packages/` 与 `dist/extension/page.bundle.js` 均已同步；专项测试覆盖共享 close SVG、`aria-label/title`、禁止裸文本 `x` 回退、局部 token 和 `focus-visible`。`@chrome` 打开真实 `one.alimama.com` 人群推广页，进入 `组建计划` 第 4 个“自定义推广”计划详情，只点击 `AI点睛设置` 打开设置弹窗；待 AI 点睛生成完成后，弹窗内临时添加“测试屏蔽词”用于验证删除按钮，未点击保存。运行态确认删除按钮 `BUTTON type="button"`、类名 `am-wxt-ai-max-shield-remove`、文本为空、`aria-label="删除屏蔽词：测试屏蔽词"`、`title="删除屏蔽词"`、包含 `svg.am-ui-icon.am-ui-icon-close`，按钮为 16px 正圆 inline-flex 居中，tag 背景为 `rgba(69, 84, 229, 0.1)`，CSS 包含 `.am-wxt-ai-max-shield-remove:focus-visible`，控制台 error/warn 为空。点击 `取消` 后弹窗关闭，临时词未保存到向导。截图见 `tasks/ui-audit-keyword-ai-max-shield-remove-chrome-2026-05-29.png`。
- 组建计划屏蔽人群移除按钮切片：源码、根 userscript、`dist/packages/` 与 `dist/extension/page.bundle.js` 均已同步；专项测试覆盖共享 close SVG、`aria-label/title`、禁止文字“移除”按钮回退、局部 token 和 `focus-visible`。`@chrome` 打开真实 `one.alimama.com` 人群推广页，进入 `组建计划` 第 4 条计划详情，将场景切到 `人群推广`、营销目标切到 `自定义推广`，只点击 `设置过滤人群` 打开弹窗；未点击 `确定`、`保存并关闭`、`批量创建` 或 `提交创建`。弹窗内临时勾选 `18-24岁` 生成已选行后，运行态确认移除按钮为 `BUTTON type="button"`、类名 `am-wxt-scene-filter-remove`、文本为空、`aria-label="移除已选屏蔽人群：18-24岁"`、`title="移除已选屏蔽人群"`、包含 `svg.am-ui-icon.am-ui-icon-close`，按钮为 24px 正圆 flex 居中，CSS 包含危险 hover 和 `.am-wxt-scene-filter-remove:focus-visible`，旧文字移除按钮数量为 0，控制台 error/warn 为空。点击 `取消` 后弹窗关闭，过滤摘要仍为 `未设置过滤`，临时勾选未保存。截图见 `tasks/ui-audit-keyword-crowd-filter-remove-chrome-2026-05-29.png`。
- 组建计划屏蔽人群已选区 token 切片：源码、根 userscript、`dist/packages/` 与 `dist/extension/page.bundle.js` 均已同步；专项测试覆盖已选区标题、已选行、空状态和脚注使用 `--am26-*` token，并禁止回退到硬编码 `#f8fafc` / `#fff` / `#334155` / `#64748b`。`@chrome` 打开真实 `one.alimama.com` 人群推广页，进入同一屏蔽人群设置弹窗；先验证空状态，再临时勾选 `18-24岁` 生成已选行，运行态确认已选行背景 `rgba(255, 255, 255, 0.45)`、边框 `rgba(255, 255, 255, 0.4)`、文字 `rgb(27, 36, 56)`，控制台 error/warn 为空。点击 `取消` 后弹窗关闭，过滤摘要仍为 `未设置过滤`，临时勾选未保存。截图见 `tasks/ui-audit-keyword-crowd-filter-token-chrome-2026-05-29.png`。
- 组建计划首页底部提交条与快捷日志 token 切片：源码、根 userscript、`dist/packages/` 与 `dist/extension/page.bundle.js` 均已同步；专项测试覆盖底部提交条、提交摘要、执行模式数量徽标、执行模式下拉菜单数量徽标和快捷日志区使用 `--am26-*` token，并禁止回退到硬编码白/灰底、灰色文字和旧蓝紫徽标。`@chrome` 打开真实 `one.alimama.com` 人群推广页，只点击插件悬浮球与 `组建计划` 打开主向导首页；未点击 `提交创建`、`批量创建`、`生成其他策略` 或任何真实创建/提交入口。运行态确认底部提交条背景 `rgba(255, 255, 255, 0.45)`、边框 `rgba(255, 255, 255, 0.4)`，提交摘要文字 `rgb(80, 90, 116)`、强调数字 `rgb(29, 63, 207)`；快捷日志面板/容器背景 `rgba(255, 255, 255, 0.25)`、边框 `rgba(255, 255, 255, 0.4)`，日志行文字 `rgb(80, 90, 116)`；打开执行模式下拉菜单后，并发数量徽标背景 `rgba(255, 255, 255, 0.25)`、边框 `rgba(255, 255, 255, 0.4)`、文字 `rgb(80, 90, 116)`。控制台 error/warn 为空；验收后关闭主向导，确认 overlay、执行模式菜单、详情页和二级弹窗均无残留。截图见 `tasks/ui-audit-keyword-footer-log-token-chrome-2026-05-29.png`。
- 组建计划执行模式下拉菜单 token 切片：源码、根 userscript、`dist/packages/` 与 `dist/extension/page.bundle.js` 均已同步；专项测试覆盖执行模式菜单容器、菜单项、hover/active 态和旧白底浅蓝回退。`@chrome` 打开真实 `one.alimama.com` 人群推广页，只点击插件悬浮球、`组建计划` 和执行模式下拉按钮；未点击 `提交创建`、`批量创建`、`生成其他策略` 或任何真实创建/提交入口。运行态确认菜单容器背景为 `linear-gradient(135deg, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.2))`、边框 `rgba(255, 255, 255, 0.6)`、阴影 `rgba(31, 38, 135, 0.15) 0px 8px 32px 0px`、`backdrop-filter: blur(12px) saturate(1.25)`；最终 CSS 覆盖块命中 `--am26-border-strong` / `--am26-panel-strong` / `--am26-shadow`，旧 `rgba(255,255,255,0.96)`、`rgba(246,249,255,0.9)` 和旧蓝色阴影不存在。菜单项默认文字 `rgb(80, 90, 116)`，active 背景 `rgba(69, 84, 229, 0.1)`、文字 `rgb(29, 63, 207)`，控制台 error/warn 为 0；验收后关闭主向导，确认 overlay 关闭、菜单隐藏、详情页和二级弹窗无残留。截图见 `tasks/ui-audit-keyword-run-mode-menu-token-chrome-2026-05-29.png`。
- 算法护航首批切片：`@chrome` 打开真实 `one.alimama.com` 人群推广页，刷新页面后打开主面板 -> 算法护航，展开手动设置；运行态 DOM 显示手动设置下拉箭头为 SVG chevron，`aria-hidden="true"`，不再渲染裸文本 `▼`。截图见 `tasks/ui-audit-algorithm-chrome-2026-05-29.png`。
- 算法护航结果浮层未通过真实提交触发，避免碰真实护航提交链路；其 dialog 语义、Esc 关闭、焦点恢复和减少动画由专项静态断言覆盖。
- 算法护航 P2 控件样式切片：源码、根 userscript、`dist/packages/` 与 `dist/extension/page.bundle.js` 均已同步；专项测试覆盖手动设置 token/focus/reduced-motion、窗口按钮语义、主面板 focus/reduced-motion 和旧硬编码色回退。`@chrome` 恢复到真实 `https://one.alimama.com/index.html#!/manage/display?offset=0&searchKey=campaignNameLike&searchValue=e7` 人群推广页后，打开主面板 -> 算法护航并展开手动设置；运行态显示 `#alimama-escort-helper-ui` 已打开、手动设置 `aria-expanded="true"`、6 个 `.am26-manual-card`、下拉箭头为 `svg.am-ui-icon` 且 `aria-hidden="true"`，窗口控制 `居中/最大化/关闭` 均为 `BUTTON type="button"` 并具备 `aria-label`，手动区和主面板样式块均包含 `focus-visible` 与 `prefers-reduced-motion`，旧手动设置硬编码色未出现；控制台 error/warn 为空。未点击 `立即扫描并优化`。截图见 `tasks/ui-audit-algorithm-p2-chrome-2026-05-29.png`。
- 批量+ 首批切片：`@chrome` 打开真实 `one.alimama.com` 人群推广页，关闭官方升级说明弹窗后只点击 `批量+` 触发器，不点击任何菜单动作；运行态 DOM 显示菜单 `role="menu"`、5 个 `role="menuitem"`、5 个 `.am-campaign-batch-plus-item-icon svg.am-ui-icon`、1 个危险项，计算样式为 `border-radius: 10px`、`padding: 6px`、玻璃背景、`box-shadow: var(--am26-shadow)` 对应值，且菜单文本不包含私有字体箭头。截图见 `tasks/ui-audit-batch-plus-chrome-2026-05-29.png`。
- 批量+ P2 确认弹窗宽度切片：源码、根 userscript、`dist/packages/` 与 `dist/extension/page.bundle.js` 均已同步；专项测试覆盖 360px 阅读宽度和禁止 320px 回退。`@chrome` 在真实 `one.alimama.com` 人群推广页勾选 1 条可见计划行，只点击 `批量+` -> `批量暂停` 打开二次确认弹窗，未点击 `确认暂停`；运行态显示弹窗 `role="dialog"`、`aria-modal="true"`、标题“确认暂停计划”、正文“确认暂停选中的 1 个人群推广计划？...”，卡片计算宽度 `360px`、18px 圆角、浅玻璃背景，注入 CSS 命中 `width: min(360px, calc(100vw - 28px))` 且不包含 320px 回退。随后点击 `取消`，确认弹窗和菜单均关闭，控制台 error/warn 为空；验收后已恢复临时勾选。截图见 `tasks/ui-audit-batch-plus-confirm-width-chrome-2026-05-29.png`。
- 主面板首批切片：`@chrome` 打开真实 `one.alimama.com` 人群推广页，关闭官方活动弹窗后打开主面板，只点击 `辅助显示` 展开辅助开关；运行态 DOM 显示悬浮球、关闭按钮、4 个工具入口、8 个辅助开关、日志清空/展开均为 `BUTTON`，辅助显示入口 `aria-expanded="true"`、`aria-pressed="true"`、`aria-controls="am-assist-switches"`，辅助区域 `aria-hidden="false"`，键盘 Tab 后焦点落在辅助开关且可见 outline 为 solid。截图见 `tasks/ui-audit-main-panel-chrome-2026-05-29.png`。
- 主面板 P2 切片：源码、根 userscript、`dist/packages/` 与 `dist/extension/page.bundle.js` 均已同步；专项测试覆盖悬浮球 hover 不回退到 `scale(1.08)`、日志区浅玻璃 token、辅助开关 hover/弱态 token 和旧硬编码回退防护。`@chrome` 刷新真实 `one.alimama.com` 人群推广页后，只点击插件悬浮球、辅助显示和日志展开；运行态显示主面板打开、辅助显示展开、悬浮球为 `BUTTON type="button"`，注入 CSS 命中 `#am-helper-icon:hover { transform: translateY(-2px); background: var(--am26-surface-strong); ... }` 且不包含 `scale(1.08)`，日志展开态计算样式为 `background-color: rgba(255, 255, 255, 0.25)`、`border-top: 1px solid rgba(255, 255, 255, 0.4)`、轻量双层阴影，辅助开关 hover 规则使用 `var(--am26-border-strong)` 与 `var(--am26-surface-strong)`，控制台 error/warn 为空。未点击算法护航、组建计划、万能查数或任何业务工具入口。截图见 `tasks/ui-audit-main-panel-p2-chrome-2026-05-29.png`。
- 下载面板首批切片：`@chrome` 刷新真实 `one.alimama.com` 页面，不触发真实报表下载，只验证运行态已注入 `#am-report-capture-panel`，内联兜底样式包含 `width: min(340px, calc(100vw - 24px))` 的等价计算值，注入 CSS 包含响应式宽度、下载/复制/关闭 `focus-visible` 和 `prefers-reduced-motion` 规则，控制台 error/warning 为空；弹出态由专项静态断言覆盖。
- 计划行复制弹窗切片：`@chrome` 刷新真实 `one.alimama.com` 人群推广页，只点击行级 `复制` 按钮打开一览窗，不点击 `确认生成`；运行态 DOM/样式显示一览窗 `role="dialog"`、`aria-modal="true"`、标题关联成功、头部和关闭按钮均为共享 SVG、浅玻璃遮罩与 18px 卡片圆角、首个计划名输入框自动聚焦。按 Esc 关闭后弹窗移除，复制按钮解除禁用，焦点回到同一行 `复制` 按钮。截图见 `tasks/ui-audit-copy-popup-chrome-2026-05-29.png`；复制成功窗未通过真实提交触发，由专项静态断言覆盖。
- 计划行复制弹窗白色背景切片：源码、根 userscript、`dist/packages/` 与 `dist/extension/page.bundle.js` 均已同步；专项测试覆盖一览窗/成功窗白色遮罩、白色卡片和旧灰色遮罩回退防护。Chrome DevTools MCP 刷新真实 `one.alimama.com` 人群推广页，只点击行级 `复制` 按钮打开 `复制计划一览`，未点击 `确认生成`。运行态确认一览窗 `role="dialog"`、`aria-modal="true"`、标题关联成功，状态文案为 `确认后才会提交创建请求。`；遮罩计算样式为 `background-color: rgba(255, 255, 255, 0.72)`、`backdrop-filter: blur(8px) saturate(1.15)`，卡片背景为 `linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(255, 255, 255, 0.88))`；一览窗和成功窗 CSS 规则均不含旧 `rgba(27, 36, 56, 0.28)` / `blur(10px)`。点击 `取消` 后弹窗移除，performance resource 未出现复制/创建/暂停接口。截图见 `tasks/ui-audit-copy-popup-white-bg-chrome-2026-05-29.png`。
- 万能查数/人群对比看板首批切片：`@chrome` 刷新真实 `one.alimama.com` 人群推广页，打开主面板后只点击 `万能查数`；运行态 DOM 显示刷新/关闭均为 `BUTTON type="button"`、带 `aria-label` 与共享 SVG，视图切换容器为 `role="tablist"`，两个页签为 `role="tab"` 且 `aria-selected` / `tabindex` / `aria-controls` 正确，两个内容区为 `role="tabpanel"` 且 `aria-labelledby` / `aria-hidden` 正确。默认人群看板全屏态下按 ArrowLeft 可切回万能查数页签并恢复普通弹窗尺寸；未点击快捷话术、刷新、重试或查数提交。截图见 `tasks/ui-audit-magic-report-chrome-2026-05-29.png`。
- 万能查数/人群对比看板 P2 控件切片：`@chrome` 刷新真实 `one.alimama.com` 人群推广页，打开主面板后只点击 `万能查数`；运行态 DOM 显示 7 个快捷话术均为 `BUTTON type="button"` 且有 `aria-label="快捷话术：..."` 与 `aria-pressed="false"`，10 个顶部图例按钮均有稳定 `aria-label`、`aria-pressed` 和装饰色点 `aria-hidden="true"`，商品 ID 触发器在未识别计划态禁用但已关联 `am-crowd-matrix-item-listbox`，listbox 具备 `role="listbox"`、`aria-label="商品ID候选列表"`、`aria-hidden="true"`；未点击快捷话术、刷新、重试或查数提交，控制台 error/warning 为空。截图见 `tasks/ui-audit-magic-report-p2-chrome-2026-05-29.png`。
- 并发日志弹窗切片：源码、根 userscript、`dist/packages/` 与 `dist/extension/page.bundle.js` 均已同步；专项测试覆盖标题关联、共享启动图标、status/log live 语义、Esc 关闭、焦点恢复、统一 token 玻璃样式、focus-visible、warning 状态和 reduced-motion。`@chrome` 运行态已确认新版并发日志 CSS 注入，旧深色终端样式消失；未点击并发开启按钮，避免触发真实状态更新。
- 授权/错误遮罩切片：源码、根 userscript、`dist/packages/` 与 `dist/extension/page.bundle.js` 均已同步；专项测试覆盖遮罩 `dialog` 语义、标题/正文关联、共享告警图标、`--am26-*` 浅玻璃 token、DOM/textContent 安全渲染、敏感授权字段不展示、reduced-motion 和旧深色遮罩回退防护。`@chrome` 接管真实 `one.alimama.com` 标签时，原人群推广 redirect 阶段被 Chrome 拦截为 `ERR_BLOCKED_BY_CLIENT`；恢复到可用 `货品全站推广_万相台无界版` 后只读检查显示插件主入口与统一样式节点已注入、授权锁定遮罩未出现、控制台 error/warn 为空。未强制调用 `LicenseGuard.lock()`，避免清授权缓存或改变用户页面状态。
