# Notes - 2026-05-14 全面 bug 检查

## 范围
- 自动化基线：构建同步、语法、全量 node:test、review-team。
- 静态审查：入口异常反馈、关键请求载荷、配置同步、extension 注入、license-server 依赖契约、近期高风险 UI 状态链路。
- 修复原则：仅修复可确认缺陷；不因风格偏好做重构。

## 历史教训映射
- L36/L47：入口点击必须有当前页反馈，并捕获同步异常与 Promise reject。
- L42/L45/L49：原生同构不能只看开关或顶层字段，需关注弹窗设置与提交键。
- L46/L48：多段/集合型控件的保存摘要、隐藏字段和结构化字段需一致。
- L25/L28/L29/L30：原生数据源不同形同源，不能用静态模拟替代真实接口语义。

## 检查发现
- P1：`render-scene-dynamic-grid.js` 中时间解析 helper 使用 `const` 函数表达式，入口初始化顺序变化时可能 TDZ 崩溃。已改为函数声明。
- P1：`趋势明星/流量金卡` 固定目标下仍可能渲染手动关键词面板，与原生目标契约不一致。已按关键词目标隐藏。
- P1：extension content 注入失败没有页面可见错误。已补齐无挂载点、URL 解析、script load 和 append 异常提示。
- P0/P1：授权守卫曾依赖事件拦截，页面全局算法护航 API 可被直接调用绕过；缓存 shopId 与当前店铺绑定也不够严。已把租约绑定当前 shopId、远端 policy token 强制验签、公开 API 同步授权门禁全部补齐。
- P1：关键词数组字段解析把显式 `[]` / `"[]"` 当作缺省，导致回落旧模板或运行时默认。已区分显式输入来源。
- P1：关键词目标互斥字段可能跨目标泄漏，例如 `trendThemeList`、搜索卡位字段、流量金卡套餐/订单字段。已在最终组包前按目标裁剪。
- P2：`campaign.*` / `adgroup.*` 直连字段中的数组/对象会被场景设置入口转成字符串。已保留结构化原值。
- P2：万能查数、算法护航、主助手 bootstrap 等入口的同步异常或 Promise reject 没有稳定反馈。已统一捕获并返回/展示错误。

## 验证记录
- `node scripts/build.mjs`：通过。
- `node --test tests/keyword-wizard-entry-regression.test.mjs`：通过。
- `node --test tests/keyword-custom-native-parity-ui.test.mjs tests/keyword-search-p0-contract.test.mjs tests/keyword-custom-settings-sync.test.mjs tests/keyword-wizard-entry-regression.test.mjs`：通过。
- `node --test tests/extension-static-build.test.mjs tests/extension-license-cache-policy-token.test.mjs tests/extension-license-shopid-guard.test.mjs tests/keyword-plan-api-bridge-security.test.mjs tests/optimizer-entry-error-handling.test.mjs tests/keyword-search-p0-contract.test.mjs`：通过。
- `node scripts/build.mjs --check`：通过。
- `node --check "阿里妈妈多合一助手.js"`：通过。
- `node --test --test-reporter=dot tests/*.test.mjs`：通过。
- `bash scripts/review-team.sh`：通过，`All automated review checks passed`。
- Chrome DevTools MCP：真实阿里妈妈页面未授权状态下直接调用公开算法护航入口，确认不创建面板、返回结构化授权失败并展示授权锁定遮罩。
