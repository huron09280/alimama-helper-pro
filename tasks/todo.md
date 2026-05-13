# TODO - 2026-05-13 手动关键词跟随关键词设置展开

## 需求规格
- 目标：
  - 将 `手动关键词` 面板移动到 `关键词设置` 行正下方；
  - 只有勾选 `查看和添加关键词` 时，才展开 `手动关键词` 面板；
  - 取消勾选 `查看和添加关键词` 时，同步收起 `手动关键词` 面板；
  - 保持已有关键词表、流量智选、匹配方案、基础出价和新增关键词能力。
- 成功标准：
  - 插件中 `手动关键词` 紧跟在 `关键词设置` 后面；
  - 默认勾选 `查看和添加关键词` 时，手动关键词面板展开；
  - 取消勾选后，手动关键词面板收起；
  - 再次勾选后，手动关键词面板展开；
  - 构建、语法检查、相关测试和 Chrome 真实页面验证通过。

## 执行计划（可核对）
- [x] 记录需求和验收标准。
- [x] 调整 `手动关键词` 渲染位置到 `关键词设置` 下方。
- [x] 将 `查看和添加关键词` 勾选状态同步到手动关键词展开状态。
- [x] 补充回归测试锁住位置和状态联动。
- [x] 构建、语法检查和相关测试。
- [x] Chrome 真实页面复验勾选/取消勾选联动。
- [x] 回填验证记录、结果复盘和教训。

## 改动摘要
- `buildManualKeywordDesignerRow` 支持外部传入折叠状态。
- `关键词推广 -> 自定义推广 -> 智能出价` 下，`手动关键词` 面板改为紧跟 `关键词设置` 渲染。
- `查看和添加关键词` 勾选框会同步展开/收起 `手动关键词` 面板；取消勾选时收起，再次勾选时展开。
- 使用 `keywordManualPanelInsertedAfterSetting` 标记避免底部兜底重复追加一份 `手动关键词`，避免跨作用域引用出价模式变量。

## 验证记录
- `node scripts/build.mjs`：通过，已同步根 userscript、packages 与 extension 产物。
- `node --test tests/keyword-custom-settings-sync.test.mjs tests/keyword-custom-native-parity-ui.test.mjs`：通过，26/26。
- `node --check "阿里妈妈多合一助手.js"`：通过。
- `node scripts/build.mjs --check`：通过。
- Chrome DevTools MCP：重载 unpacked extension `fejbonphnhfgfomjjchjijfeippmhnfd`，硬刷新真实 `one.alimama.com` 页面后，通过 `__AM_WXT_KEYWORD_API__.openWizard` 打开插件向导。
- Chrome DevTools MCP：进入 `关键词推广 -> 自定义推广` 编辑页，确认 `关键词设置` 行索引为 20，`手动关键词` 行索引为 21，二者相邻。
- Chrome DevTools MCP：默认 `查看和添加关键词` 勾选时，`手动关键词` 面板 `data-manual-keyword-collapsed="0"`，关键词布局可见。
- Chrome DevTools MCP：取消勾选 `查看和添加关键词` 后，面板类名变为 `is-collapsed`，`data-manual-keyword-collapsed="1"`，关键词布局隐藏。
- Chrome DevTools MCP：再次勾选 `查看和添加关键词` 后，面板恢复 `data-manual-keyword-collapsed="0"`，关键词布局可见。
- Chrome DevTools MCP：修复过程中真实页面曾触发 `activeKeywordGoal is not defined` 和 `keywordBidMode is not defined`，最终改为安全作用域和插入标记后未再出现插件渲染 ReferenceError。
- Chrome DevTools MCP：控制台仍存在原生页面资源代理错误 `ERR_TUNNEL_CONNECTION_FAILED` 和站点日志，未发现本轮交互产生的插件堆栈错误。
- 本轮未点击原生 `创建完成`、插件 `批量创建`、`立即投放` 或任何真实提交入口。

## 结果复盘
- 根因是 `手动关键词` 面板此前作为底部兜底项渲染，视觉位置落在人群设置/资源位设置之后；原生的 `查看和添加关键词` 入口应直接控制该面板。
- 本轮将自定义推广智能出价下的 `手动关键词` 插到 `关键词设置` 正下方，并让勾选状态驱动展开/收起。
- 最终去重策略不依赖外层不可见的 `keywordBidMode`，而是记录“是否已在关键词设置下方插入面板”，更稳且避免重复渲染。

---

# TODO - 2026-05-13 关键词自定义推广查看和添加关键词同构原生

## 需求规格
- 目标：
  - 在 `关键词推广 -> 自定义推广` 中，对齐原生 `关键词设置` 行的 `查看和添加关键词` 入口；
  - 点击 `查看和添加关键词` 后展开插件已有关键词列表/词包面板；
  - 保持已有 `流量智选`、关键词组合、自选词数量、匹配方案、基础出价和手动新增关键词能力；
  - 不点击原生 `创建完成`、插件 `批量创建`、`立即投放` 或任何真实提交入口。
- 成功标准：
  - 插件 `关键词设置` 行显示摘要和 `查看和添加关键词` 入口；
  - 点击 `查看和添加关键词` 会展开已有关键词面板，而不是只切换隐藏字段；
  - 展开后可看到词包/流量智选、自选关键词表、匹配方案和基础出价；
  - 构建、语法检查、相关测试和 Chrome 真实页面验证通过。

## 执行计划（可核对）
- [x] 记录需求和验收标准，明确复用现有关键词面板而不是重写。
- [x] 给 `查看和添加关键词` 文案增加原生入口触发标记。
- [x] 打通入口点击到已有手动关键词面板展开逻辑。
- [x] 补充回归测试锁住入口和展开状态同步。
- [x] 构建、语法检查和相关测试。
- [x] Chrome 真实页面复验点击入口后面板展开。
- [x] 回填验证记录、结果复盘和教训。

## 改动摘要
- `关键词设置` 行中的 `查看和添加关键词` 文案新增 `data-keyword-setting-open-manual="1"`，作为原生式入口。
- 点击该入口时会保持 `关键词设置=查看和添加关键词`，同步隐藏字段，并展开已有 `data-manual-keyword-panel`。
- 手动关键词面板的展开/收起同步抽成 `syncManualKeywordPanelCollapsed`，入口点击和面板自身 `展开/收起` 按钮共用同一套状态写回逻辑。

## 验证记录
- `node scripts/build.mjs`：通过，已同步根 userscript、packages 与 extension 产物。
- `node --test tests/keyword-custom-settings-sync.test.mjs tests/keyword-custom-native-parity-ui.test.mjs`：通过，26/26。
- `node --check "阿里妈妈多合一助手.js"`：通过。
- `node scripts/build.mjs --check`：通过。
- Chrome DevTools MCP：重载 unpacked extension `fejbonphnhfgfomjjchjijfeippmhnfd`，硬刷新真实 `one.alimama.com` 页面后，通过 `__AM_WXT_KEYWORD_API__.openWizard` 打开插件向导。
- Chrome DevTools MCP：进入 `关键词推广 -> 自定义推广` 编辑页，确认 `关键词设置` 行存在 `查看和添加关键词` 入口，默认手动关键词面板为 `is-collapsed`、`data-manual-keyword-collapsed="1"`。
- Chrome DevTools MCP：点击 `查看和添加关键词` 后，手动关键词面板变为展开态，`data-manual-keyword-collapsed="0"`，关键词布局和操作区可见。
- Chrome DevTools MCP：展开后可见 `流量智选`、`关键词 (7/200)`、`广泛/精准` 匹配方案、基础出价和 7 条自选关键词。
- Chrome DevTools MCP：隐藏字段保持 `关键词设置=查看和添加关键词`，未被点击入口误切成 `关闭`。
- Chrome DevTools MCP：控制台存在页面资源代理错误 `ERR_TUNNEL_CONNECTION_FAILED` 和原生组件依赖/表达式警告，未发现本次入口点击产生的插件堆栈错误。
- 本轮未点击原生 `创建完成`、插件 `批量创建`、`立即投放` 或任何真实提交入口。

## 结果复盘
- 根因是插件已实现关键词面板，但原生 `查看和添加关键词` 摘要入口没有连接到该面板；用户必须再去下方点 `展开`，交互不符合原生。
- 本轮没有重写关键词表格，只把原生入口打通到已有面板，并复用原展开/收起状态写回逻辑。
- 后续遇到摘要行里的 `查看和添加/编辑设置` 文案，必须验证点击是否打开对应详情面板，而不是只检查字段值和列表是否存在。

---

# TODO - 2026-05-10 AI 点睛热门搜索词默认展开

## 需求规格
- 目标：
  - `AI点睛设置` 中 `热门搜索词`、`搜索人群画像与特征` 默认展示，不再隐藏到 `展开详情` 后；
  - `展开详情/收起详情` 只控制 5 步深度分析，不影响热门搜索词和人群画像常驻版块；
  - 点击不同需求卡片后，常驻版块继续同步切换对应热门搜索词和人群画像；
  - 全程不点击原生 `创建完成`、插件 `批量创建`、`立即投放` 或任何真实提交入口。
- 成功标准：
  - 插件打开 `AI点睛` 后，不点击 `展开详情` 即可看到 `热门搜索词` 和 `搜索人群画像与特征`；
  - 点击 `展开详情` 后 5 步分析出现，热门搜索词和人群画像仍保持可见；
  - 点击 `收起详情` 后 5 步分析隐藏，热门搜索词和人群画像仍保持可见；
  - 构建、语法检查、相关测试和 Chrome 真实页面验证通过。

## 执行计划（可核对）
- [x] 记录需求和验收标准，明确本轮只修常驻版块默认可见性。
- [x] 调整 `AI点睛` 渲染结构，让搜索词/人群画像默认展开。
- [x] 调整详情按钮逻辑，只切换 5 步深度分析。
- [x] 补充回归测试锁住默认展开和按钮控制范围。
- [x] 构建、语法检查和相关测试。
- [x] Chrome 真实页面复验默认可见、展开后仍可见、收起后仍可见。
- [x] 回填验证记录、结果复盘和教训。

## 改动摘要
- 将 `热门搜索词` 和 `搜索人群画像与特征` 从 `data-ai-max-detail-section` 折叠组中拆出，改为 `data-ai-max-demand-detail-grid="1"` 常驻内容区。
- 移除常驻内容区默认 `hidden`，插件进入 `AI点睛设置` 后无需点击 `展开详情` 即可看到相关版块。
- `展开详情/收起详情` 的同步和点击逻辑改为只查询 `data-ai-max-detail-section="deep"`，避免收起 5 步分析时连带隐藏热门搜索词。

## 验证记录
- `node scripts/build.mjs`：通过，已同步根 userscript、packages 与 extension 产物。
- `node --test tests/keyword-custom-native-parity-ui.test.mjs tests/keyword-custom-popup-config.test.mjs`：通过，37/37。
- `node --check "阿里妈妈多合一助手.js"`：通过。
- `node scripts/build.mjs --check`：通过。
- Chrome DevTools MCP：重载 unpacked extension `fejbonphnhfgfomjjchjijfeippmhnfd`，硬刷新真实 `one.alimama.com` 页面后，通过 `__AM_WXT_KEYWORD_API__.openWizard` 打开插件向导。
- Chrome DevTools MCP：切换 `首页 -> 编辑页` 恢复编辑配置可见态，进入 `AI点睛设置`；默认态 `data-ai-max-detail-section="deep"` 为隐藏，`data-ai-max-demand-detail-grid="1"` 可见。
- Chrome DevTools MCP：默认态无需点击 `展开详情` 即可看到 `热门搜索词` 和 `搜索人群画像与特征`，热门词为 `1元预约 / 一元预约 / 1元预定 / 1分预约 / 洗碗机预约服务 / 洗碗机`。
- Chrome DevTools MCP：点击 `展开详情` 后，按钮变为 `收起详情`，5 步深度分析显示，`热门搜索词` 和 `搜索人群画像与特征` 仍保持可见。
- Chrome DevTools MCP：再次点击收起后，5 步深度分析隐藏，`热门搜索词` 和 `搜索人群画像与特征` 仍保持可见。
- Chrome DevTools MCP：控制台只见页面资源代理错误 `ERR_TUNNEL_CONNECTION_FAILED`，未见本次 `AI点睛` 交互相关异常。
- 本轮未点击原生 `创建完成`、插件 `批量创建`、`立即投放` 或任何真实提交入口。

## 结果复盘
- 根因是 `热门搜索词` 和 `搜索人群画像与特征` 被放进了与 5 步深度分析相同的 `data-ai-max-detail-section` 折叠组，导致默认态隐藏。
- 修复后将逐需求分析区拆成常驻区，`展开详情/收起详情` 只控制 5 步深度分析。
- 验证中发现 `openWizard` 初次进入编辑页时内容页可能处于压缩/隐藏状态；通过真实切换 `首页 -> 编辑页` 可恢复可见配置区，后续浏览器验证应先确认目标面板祖先链均可见，避免用隐藏 DOM 误判。

---

# TODO - 2026-05-10 AI 点睛已选需求下拉同构原生

## 需求规格
- 目标：
  - 对齐原生 `5个需求` 下拉层，而不是打开完整 `AI点睛设置` 弹窗；
  - 点击 `5个需求` 后显示锚定小浮层：全选、右上 `已选：N`、5 个勾选项、底部 `确定` 和 `取消`；
  - 保留 `表达更多流量诉求` 打开完整 AI点睛设置弹窗；
  - 勾选确认后回写 `campaign.aiMaxInfo.selectedDemandList` 并刷新摘要；
  - 全程不点击原生 `创建完成`、插件 `批量创建`、`立即投放` 或任何真实提交入口。
- 成功标准：
  - 插件中 `5个需求` 下拉外观和结构与用户截图一致；
  - `确定` 保存勾选结果，`取消` 不保存；
  - 完整 AI点睛设置弹窗仍只能由 `表达更多流量诉求` 打开；
  - 构建、语法检查、相关测试和 Chrome 真实页面验证通过。

## 执行计划（可核对）
- [x] 定位偏差：`5个需求` 入口不应复用完整设置弹窗。
- [x] 新增独立锚定式 `AI点睛需求` 小浮层。
- [x] 实现全选、单项勾选、已选计数、确定/取消和字段回写。
- [x] 补充样式，使其接近原生白色圆角浮层和蓝色勾选样式。
- [x] 补充静态回归测试。
- [x] 构建、语法检查和相关测试。
- [x] Chrome 真实页面复验小浮层、确定/取消和完整设置入口分离。
- [x] 回填验证记录、结果复盘和教训。

## 改动摘要
- 将 `AI点睛` 右侧 `已选：N个需求` 从完整 `AI点睛设置` 弹窗代理中拆出，改为独立锚定小浮层。
- 小浮层结构对齐原生截图：顶部 `全选`、右上 `已选：N`，中部需求勾选列表，底部 `确定` / `取消`。
- `表达更多流量诉求` 继续打开完整 `AI点睛设置` 弹窗，不与 `5个需求` 复用同一入口。
- `确定` 会写回 `campaign.aiMaxInfo.selectedDemandList`，同步场景 bucket、规范化字段 key、同字段隐藏控件和 AI点睛生成缓存，避免重渲染被旧值覆盖。
- `取消` 只关闭小浮层，不修改隐藏字段和选择状态。
- 补充回归测试，锁住独立小浮层结构、完整弹窗入口分离、确认后状态优先级和多隐藏控件同步。

## 验证记录
- `node scripts/build.mjs`：通过，已同步根 userscript、packages 与 extension 产物。
- `node --test tests/keyword-custom-native-parity-ui.test.mjs tests/keyword-custom-popup-config.test.mjs`：通过，37/37。
- `node --check "阿里妈妈多合一助手.js"`：通过。
- `node scripts/build.mjs --check`：通过。
- Chrome DevTools MCP 真实页面：硬刷新 `https://one.alimama.com/index.html#!/main/index?bizCode=onebpSearch&promotionScene=promotion_scene_search_detent` 后，通过插件 API 打开向导进入编辑页。
- Chrome DevTools MCP：等待 `AI点睛` 原生接口生成完成后，点击 `5个需求` 只出现 `#am-wxt-ai-max-demand-popover`，没有出现 `#am-wxt-scene-popup-mask` 完整设置弹窗。
- Chrome DevTools MCP：小浮层文案包含 `全选`、`已选：5`、5 个需求项、`确定`、`取消`，且全选为选中状态。
- Chrome DevTools MCP：取消路径已验证，取消后 `selectedDemandList` 保持 5 个，不保存临时取消勾选。
- Chrome DevTools MCP：取消第 1 个需求后，小浮层计数变为 `已选：4`，全选进入半选态；点击 `确定` 后 `selectedDemandList` 为 4 个、摘要显示 `4个需求`、需求卡片数量为 4，第 1 个需求已移除。
- Chrome DevTools MCP：点击 `表达更多流量诉求` 仍打开完整 `AI点睛设置` 弹窗，包含 `表达更多流量诉求`、`模板推荐（6）`、`屏蔽词设置` 等完整设置内容。
- 本轮未点击原生 `创建完成`、插件 `批量创建`、`立即投放` 或任何真实提交入口。

## 结果复盘
- 根因是之前把右侧 `5个需求` 当成完整设置弹窗的代理触发器，和原生小下拉不一致。
- 第一次修复后真实页暴露“确定后仍回到 5 个”的状态覆盖问题；根因是重渲染优先使用接口生成缓存和同字段旧隐藏控件。最终改为用户确认后的 `campaign.aiMaxInfo` 优先，并同步所有同字段控件。
- 后续同构原生时，必须区分“完整设置弹窗入口”和“摘要下拉选择入口”，不能因为两者修改同一字段就复用同一个弹窗。

---

# TODO - 2026-05-10 AI 点睛展开详情与需求卡片箭头同构原生

## 需求规格
- 目标：
  - 对齐原生 `AI点睛` 点击 `展开详情` 后的深度分析结构；
  - 展开后展示 `第1步：计划定向画像分析` 到 `第5步：搜索需求分析` 的原生式分析容器；
  - 展开内容以打字式逐字显示，避免只有静态空白区域；
  - 需求卡片超过 3 个时补齐右侧灰色箭头，并可切换/滚动查看更多需求；
  - 继续保留需求卡片点击切换 `AI解析`、热门搜索词和搜索人群画像；
  - 全程不点击原生 `创建完成`、插件 `批量创建`、`立即投放` 或任何真实提交入口。
- 成功标准：
  - 插件打开 `AI点睛` 后，点击 `展开详情` 可看到 5 步深度分析容器；
  - 文本在展开时按原生式打字效果出现；
  - 需求卡片右侧灰色箭头可见，点击后能查看更多需求；
  - 点击不同需求卡片仍能切换下方分析、搜索词和人群画像；
  - 构建、语法检查、相关测试和 Chrome 真实页面验证通过。

## 执行计划（可核对）
- [x] 对比用户截图，确认缺少 5 步展开详情、打字式内容和右侧灰色箭头。
- [x] 实现原生式 5 步深度分析结构，并复用真实 `aiMaxInfo/nativeCrowdList` 数据生成摘要。
- [x] 实现展开时逐字显示逻辑和每步详情展开/收起。
- [x] 实现需求卡片横向列表与右侧灰色滚动箭头。
- [x] 补充静态回归测试契约。
- [x] 构建、语法检查和相关测试。
- [x] Chrome 真实页面复验展开详情、打字效果、箭头滚动和需求切换。
- [x] 回填验证记录、结果复盘和教训。

## 改动摘要
- `AI点睛设置` 面板新增原生式 5 步深度分析容器：`第1步：计划定向画像分析`、`第2步：关键词深度分析`、`第3步：流入流失竞对分析`、`第4步：同行定向画像分析`、`第5步：搜索需求分析`。
- 展开 `AI点睛` 详情时，5 步标题按逐字打字方式显示；每个步骤右侧也有 `展开详情/收起详情`，子详情同样逐字显示。
- 5 步摘要复用真实 `campaign.aiMaxInfo`、商品标题、热门搜索词、搜索人群画像和需求列表，不写死预算或伪造提交参数。
- 需求卡片从固定 3 个改为横向列表；超过 3 个时显示右侧灰色 `›` 箭头，点击可滚动查看更多需求。
- 保留需求卡片点击切换能力：切换当前需求后同步更新 `AI解析`、热门搜索词和搜索人群画像。
- 新增静态回归测试，锁住 5 步结构、打字逻辑、右侧箭头和需求滚动/切换事件。

## 验证记录
- `node scripts/build.mjs`：通过，已同步根 userscript、packages 与 extension 产物。
- `node --test tests/keyword-custom-native-parity-ui.test.mjs tests/keyword-custom-popup-config.test.mjs`：通过，37/37。
- `node --check "阿里妈妈多合一助手.js"`：通过。
- `node scripts/build.mjs --check`：通过。
- Chrome DevTools MCP 真实页面：硬刷新 `https://one.alimama.com/index.html#!/main/index?bizCode=onebpSearch&promotionScene=promotion_scene_search_detent` 后，通过插件 API 打开向导进入编辑页。
- Chrome DevTools MCP：`AI点睛设置` 可见，DOM 中存在 5 个步骤按钮、5 张需求卡片和右侧灰色 `›` 箭头。
- Chrome DevTools MCP：点击 `展开详情` 后，`data-ai-max-detail-section="deep"` 与 `data-ai-max-detail-section="grid"` 均显示；120ms 时步骤标题处于逐字输出中，1.6s 后 5 步标题完整展示。
- Chrome DevTools MCP：点击第 1 步 `展开详情` 后，子详情先清空再逐字输出，1.2s 后完整展示真实商品相关分析文本。
- Chrome DevTools MCP：可见需求列表 `clientWidth=964`、`scrollWidth=1613`；点击右侧灰色箭头后 `scrollLeft` 从 `0` 变为 `326.5`，左侧可见卡片从第 1 个变为第 2 个。
- Chrome DevTools MCP：点击第 2 张需求卡片后，active 需求从 `一元预约洗碗机省下大笔开销` 切换为 `洗碗机耗材一次买齐省心省力`，`AI解析`、热门搜索词和搜索人群画像同步更新。
- Chrome DevTools MCP：控制台仅见页面资源代理错误 `ERR_TUNNEL_CONNECTION_FAILED` 与原生 `adc` 表达式警告，未见本次插件 `AI点睛` 交互相关异常。
- 本轮未点击原生 `创建完成`、插件 `批量创建`、`立即投放` 或任何真实提交入口。

## 结果复盘
- 根因是此前只补齐了默认态和需求卡片点击态，缺少原生展开态的 5 步分析结构，也没有覆盖需求超过 3 个时的溢出箭头。
- 本轮没有用静态假面板替代原生数据，而是基于 `aiMaxInfo/nativeCrowdList` 生成 5 步摘要并继续复用逐需求的搜索词与人群画像。
- 验证中第一次并行执行 `build`、测试和 `build --check` 产生了读写竞态；之后按 `build -> test/check` 顺序重跑通过。后续涉及生成产物的验证不能把构建写入和读取检查并行执行。

---

# TODO - 2026-05-06 支持起量时间按住鼠标快速选择

## 需求规格
- 目标：
  - 在 `货品全站推广 -> 起量时间地域设置 -> 起量时间 -> 时间段` 中支持按住鼠标左键拖过多个小时快速选择；
  - 保留现有单击切换、多时间段摘要、至少 4 个小时校验和保存映射；
  - 支持拖动选择和拖动取消选择，避免拖动结束后 click 二次反转；
  - 全程不点击原生 `创建完成`、插件 `批量创建` 或任何真实提交入口。
- 成功标准：
  - 按下未选小时并拖过多个小时会连续选中；
  - 按下已选小时并拖过多个小时会连续取消；
  - 单击仍能切换单个小时；
  - 保存后摘要和隐藏字段保持正确；
  - 构建、相关测试和 Chrome DevTools MCP 真实页面复验通过。

## 执行计划（可核对）
- [x] 记录需求与安全边界，复核现有 quickLift 时间条事件实现。
- [x] 实现 pointer drag 选择/取消逻辑并避免 click 二次触发。
- [x] 补充回归测试覆盖拖选契约。
- [x] 构建、语法检查和相关测试。
- [x] 重载真实页面复验按住鼠标拖选和保存字段。
- [x] 回填验证记录、结果复盘和教训。

## 改动摘要
- 在 quickLift 时间条上新增 pointer drag 状态：按住鼠标左键从未选小时开始拖动时连续选中，从已选小时开始拖动时连续取消。
- 将小时范围写入逻辑收敛到 `applyQuickLiftHourRangeSelection()`，拖动过程按经过的小时区间批量更新并只触发一次时间条重绘。
- 拖动开始后短暂抑制随后的 click 事件，避免松开鼠标时把刚选中的小时再次反选；单击路径仍走同一个范围应用函数。
- 保存摘要改为优先读取结构化 `__am.quickLiftLaunchPeriodList` / `__am.quickLiftLaunchAreaList`，并在动态区域重渲染后兜底更新当前可见摘要。
- 货品全站推广的一键起量摘要生成改为按多个连续小时区间展示，避免把 `3点~5点、8点~10点` 压缩成 `3点~10点`。
- 回归测试补充静态契约，锁住左键 pointerdown、pointermove 批量选择、click 抑制、pointer capture、结构化摘要优先和多段摘要生成。

## 验证记录
- `node scripts/build.mjs`：通过，已同步根 userscript、packages 与 extension 产物。
- `node --test tests/keyword-custom-preview-submit-parity.test.mjs tests/keyword-custom-popup-config.test.mjs tests/keyword-wizard-entry-regression.test.mjs`：通过，31/31。
- `node --check "阿里妈妈多合一助手.js"`：通过。
- `node scripts/build.mjs --check`：通过。
- `git diff --check`：通过。
- `node --test tests/*.test.mjs`：通过，430 个测试，428 通过，2 跳过，0 失败。
- Chrome DevTools MCP：重载 unpacked extension `fejbonphnhfgfomjjchjijfeippmhnfd` 并硬刷新真实 `one.alimama.com` 后，打开 API 向导 `货品全站推广`，进入 `起量时间地域设置`。
- Chrome DevTools MCP：在真实页面弹窗内点击 `清空` 后按住鼠标左键从 `3` 拖到 `9`，摘要为 `3点~10点`，选中小时为 `[3,4,5,6,7,8,9]`。
- Chrome DevTools MCP：从已选小时 `5` 拖到 `7` 后连续取消，摘要为 `3点~5点、8点~10点`，选中小时为 `[3,4,8,9]`。
- Chrome DevTools MCP：点击插件弹窗 `确定` 保存后，行内摘要为 `3点~5点、8点~10点｜在全部地域投放`，隐藏字段 `投放时间` 为 `3点~5点、8点~10点`，首日 `timeSpanList` 为 `03:00-05:00` 与 `08:00-10:00` 两段。
- 本轮未点击原生 `创建完成`、插件 `批量创建`、`立即投放` 或任何真实提交入口。

## 结果复盘
- 拖拽选择本身通过后，真实页面暴露了保存后行内摘要仍旧显示 `3点~10点` 的二次问题；根因是货品全站推广的摘要重算层仍按最早开始和最晚结束汇总。
- 最终修复没有只改 DOM 文案，而是把保存摘要、动态区域兜底和货品全站一键起量摘要生成都统一到结构化多段时间上。
- 后续涉及时间条、地域、省市等密集选择控件时，验收必须同时检查弹窗内即时摘要、保存后的行内摘要、隐藏字段和最终结构化字段，不能只看其中一个。

---

# TODO - 2026-05-06 修复插件“组建计划”点击无反应

## 需求规格
- 目标：
  - 复现用户反馈的真实 `one.alimama.com` 页面点击插件 `组建计划` 无反应；
  - 定位是入口按钮、事件绑定、运行时异常、弹窗已存在不可见，还是扩展加载失败；
  - 修复根因，确保点击后用户当前页有明确可见反馈；
  - 全程不点击原生 `创建完成`、插件 `批量创建` 或任何真实提交入口。
- 成功标准：
  - Chrome DevTools MCP 真实页面复现并记录点击前后状态；
  - 修复后点击 `组建计划` 能稳定打开 API 向导；
  - 控制台无阻断性运行时错误；
  - 构建、语法检查和相关回归测试通过；
  - `tasks/lessons.md` 记录本次用户修正对应教训。

## 执行计划（可核对）
- [x] 回顾历史教训与当前工作树，确认不回退无关改动。
- [x] 用 Chrome DevTools MCP 复现点击无反应并抓控制台/DOM 状态。
- [x] 定位并修复入口不可用根因。
- [x] 重新构建、运行相关测试和语法检查。
- [x] 重载真实页面复验 `组建计划` 点击打开向导。
- [x] 回填验证记录、结果复盘和新教训。

## 复现记录
- Chrome DevTools MCP 真实 `one.alimama.com` 页面复现：点击入口会触发 `window.__AM_WXT_KEYWORD_API__.openWizard()`，但 Promise reject，控制台出现 `Uncaught (in promise)`。
- 手动调用并捕获错误后确认根因：`Cannot access 'parseTimeRangeToMinutes' before initialization`。
- DOM 状态：失败后 `#am-wxt-keyword-modal` 已局部创建，但 `#am-wxt-keyword-overlay` 未打开，入口按钮又因面板/弹窗状态不可见，用户看到的就是“点击无反应”。

## 改动摘要
- 将 `parseTimeRangeToMinutes` 和 `formatMinutesToClock` 从 `const` 表达式改为函数声明，避免 `货品全站推广` 前置渲染在 helper 初始化前调用触发 TDZ。
- 给 `组建计划` 入口新增 `openKeywordPlanWizard()` 与 `reportKeywordPlanOpenFailure()`，同时捕获同步异常和 Promise reject；失败时优先打开已有向导弹窗，无法兜底时给当前页可见提示。
- 新增 `tests/keyword-wizard-entry-regression.test.mjs`，锁住 helper 声明方式和入口异常兜底。

## 验证记录
- `node scripts/build.mjs`：通过，已同步根 userscript、packages 与 extension 产物。
- `node --check "阿里妈妈多合一助手.js"`：通过。
- `node scripts/build.mjs --check`：通过。
- `node --test tests/keyword-wizard-entry-regression.test.mjs tests/keyword-custom-preview-submit-parity.test.mjs tests/keyword-custom-popup-config.test.mjs tests/site-scene-submit-mode.test.mjs`：通过，41/41。
- `git diff --check`：通过。
- `node --test tests/*.test.mjs`：通过，430 个测试，428 通过，2 跳过，0 失败。
- Chrome DevTools MCP：重载 unpacked extension `fejbonphnhfgfomjjchjijfeippmhnfd` 并硬刷新真实 `one.alimama.com` 后，打开助手面板点击 `组建计划`，`#am-wxt-keyword-overlay.open` 显示为 `flex`，`#am-wxt-keyword-modal` 正常展示 `关键词推广批量建计划 API 向导`。
- Chrome DevTools MCP：点击后 `unhandledrejection` 记录为空，控制台未再出现 `Cannot access 'parseTimeRangeToMinutes' before initialization` 或入口相关 `Uncaught (in promise)`。

## 结果复盘
- 根因不是入口按钮没绑定，而是 `openWizard()` 的运行时异常没有被入口捕获；这类错误必须在用户当前操作位置给可见反馈，不能只依赖控制台。
- 本次 TDZ 来自拼接式源码结构：`render-scene-dynamic-core.js` 前置使用了 `render-scene-dynamic-grid.js` 后面声明的 helper。此类跨切片共享 helper 不应使用会触发 TDZ 的 `const` 表达式。
- 后续修复入口类缺陷，验收必须覆盖“点击动作 -> 弹窗可见 -> 无未捕获 Promise -> 控制台无阻断错误”。

---

# TODO - 2026-05-06 修复货品全站起量时间多时间段选择

## 需求规格
- 目标：
  - 对比真实 `one.alimama.com` 原生 `货品全站推广 -> 一键起量 -> 起量时间地域设置`；
  - 确认原生 `起量时间` 的时间段是否支持多个不连续区间，并记录可见交互；
  - 修复插件同名弹窗中时间段只能保留单个区间的问题；
  - 保存后继续正确写回 `quickLiftBudgetCommand.quickLiftTimeSlot` 与起量地域字段；
  - 全程不点击原生 `创建完成`、插件 `批量创建`、`立即投放` 或任何真实提交入口。
- 成功标准：
  - 插件 `时间段` Tab 支持选择多个不连续时间段；
  - 摘要能表达多段选择，且空选择有明确错误或被禁止保存；
  - `投放时间` 隐藏字段和最终预览组包包含多个区间覆盖的小时集合；
  - 自动化回归测试覆盖 UI 契约和提交字段；
  - `node scripts/build.mjs`、相关 `node --test`、`node --check` 通过；
  - Chrome DevTools MCP 真实页面复验：原生可多选、插件可多选、未触发真实创建请求。
- 非目标：
  - 不重构通用高级设置弹窗；
  - 不重新摸排货品全站所有字段；
  - 不改地域选择逻辑，除非它阻塞时间段保存。

## 执行计划（可核对）
- [x] 回顾 `tasks/lessons.md`、历史 TODO 和当前工作树，确认只做本轮最小增量。
- [x] 用 Chrome DevTools MCP 对比原生 `起量时间` 多时间段交互。
- [x] 只读定位插件时间段状态、渲染、保存和组包链路。
- [x] 实现多时间段选择的最小修复，保留现有弹窗复用结构。
- [x] 补充/更新回归测试。
- [x] 构建并运行相关测试、语法检查。
- [x] 重载真实页面复验插件弹窗与预览组包，确认无真实创建请求。
- [x] 回填改动摘要、验证记录、结果复盘；如用户修正触发新教训，再更新 `tasks/lessons.md`。

## 原生对比记录
- Chrome DevTools MCP 真实页：当前页面为 `onebpSite`，原生 `起量时间地域设置` 弹窗可见 `起量时间`、时间条、`清空`、`起量地域`、地域模板和省市复选。
- 原生时间条可在同一条上点出多个小时块；尝试选择 `3-4`、`6-7`、`12-13`、`16-17` 后，页面显示多个蓝色块，但保存时原生提示 `起量时间：仅支持设置一个连续不少于4h时段`。
- 本轮按用户诉求修复插件的单区间状态模型，允许多时间段选择；保留至少 4 个起量小时的校验，避免空时间或过短时间进入最终字段。

## 改动摘要
- 已把插件 quickLift 时间状态从单个 `{ start, end }` 改为 `selectedHours` 小时集合。
- 保存时将小时集合合并为多个连续区间，写入每天的 `timeSpanList`，再由 `投放时间` 显示为 `3点~5点、8点~10点` 这类多段摘要。
- `quickLiftBudgetCommand.quickLiftTimeSlot` 解析改为支持多个 `x点~y点` 区间，输出合并后的小时列表。

## 验证记录
- `node scripts/build.mjs`：通过，已同步根 userscript、packages 与 extension 产物。
- `node --check "阿里妈妈多合一助手.js"`：通过。
- `node --test tests/keyword-custom-preview-submit-parity.test.mjs tests/keyword-custom-popup-config.test.mjs tests/site-scene-submit-mode.test.mjs`：通过，39/39。
- `node --test tests/site-scene-item-binding.test.mjs`：通过，6/6。
- `node scripts/build.mjs --check`：通过。
- `git diff --check`：通过。
- `node --test tests/*.test.mjs`：通过，428 个测试，426 通过，2 跳过，0 失败。
- Chrome DevTools MCP 原生对比：真实 `one.alimama.com` `onebpSite` 页面中，原生起量时间条可点出多个蓝色小时块；短散块保存会提示 `起量时间：仅支持设置一个连续不少于4h时段`。
- Chrome DevTools MCP 插件复验：重载 unpacked extension `fejbonphnhfgfomjjchjijfeippmhnfd` 后，打开 API 向导 `货品全站推广` 编辑页；在 `起量时间地域设置` 弹窗中清空后选择 `3、4、8、9`，弹窗摘要为 `3点~5点、8点~10点`，保存后编辑页摘要为 `3点~5点、8点~10点｜在全部地域投放`。
- Chrome DevTools MCP 字段复验：隐藏字段 `__am.quickLiftLaunchPeriodList` 每天的 `timeSpanList` 均包含 `03:00-05:00` 与 `08:00-10:00` 两段，`__am.quickLiftLaunchAreaList` 为 `["all"]`；本轮只点击 `预览请求`，未点击原生 `创建完成`、插件 `批量创建` 或真实投放提交入口。

## 结果复盘
- 根因是插件把原生时间条抽象成单个起止区间，用户点第二段时会覆盖第一段；现已改为小时集合并在保存时合并连续小时，既支持多段 UI，也保持提交字段仍是小时列表。
- 原生页面视觉上可多点选择，但当前短散块保存仍提示连续不少于 4h；插件本轮按用户要求支持多个时间段，同时保留“至少 4 个起量小时”的本地校验。
- 预览页展示的是请求摘要，不展开最终 scene request；最终 `quickLiftBudgetCommand.quickLiftTimeSlot` 多段解析已由 `tests/keyword-custom-preview-submit-parity.test.mjs` 锁定。

---

# TODO - 2026-05-06 `关键词推广 -> 趋势明星` 矩阵页真实运行态验证包

## 需求规格
- 目标：
  - 基于当前 `main` 与最近矩阵页修复记录，固定一条高频回归链路；
  - 覆盖矩阵页 `营销目标=趋势明星` 的目标同步、快捷预设、维度卡片、趋势主题组合新建与生成计划点击链路；
  - 补充最小可维护的自动化断言，避免再次只验证局部入口；
  - 产出真实页面浏览器验收清单，使用 `chrome-devtools` MCP 在 `one.alimama.com` 逐项复验；
  - 全程不真实提交线上计划。
- 成功标准：
  - 自动化断言明确锁住 `关键词推广 -> 趋势明星` 下 `选择趋势主题` 的快捷预设同步、维度卡片添加、新建组合入口和 `campaign.trendThemeList` 写回；
  - 自动化断言覆盖 `生成计划` 成功路径与前置条件失败提示，确保失败反馈显示在当前矩阵页；
  - 真实页面验收按同一条用户路径逐项通过：切换趋势明星、添加趋势主题维度、打开/保存趋势主题组合、补齐矩阵、点击生成计划成功、缺前置条件时显示可见错误；
  - 运行相关 `node --test` 并记录结果；
  - 浏览器复验确认未点击 `立即投放`、`批量创建` 或原生真实提交入口。
- 非目标：
  - 不重构矩阵页或趋势主题弹窗；
  - 不新增泛化矩阵测试框架；
  - 不触发线上计划真实创建；
  - 不处理当前工作树中与本链路无关的既有改动。

## 执行计划（可核对）
- [x] 回顾 `goal-driven`、`tasks/lessons.md` 与最近矩阵页修复记录，明确验收标准。
- [x] 梳理现有测试断言，确认只新增本链路缺口，不复制已有泛化覆盖。
- [x] 补最小自动化验证包，聚焦趋势明星矩阵链路的端到端契约。
- [x] 补浏览器验收清单，逐项覆盖真实运行态、成功路径和失败提示。
- [x] 运行相关 `node --test`、语法或构建同步检查，记录结果。
- [x] 使用 `chrome-devtools` MCP 在真实 `one.alimama.com` 页面逐项复验。
- [x] 回填改动摘要、验证记录、风险覆盖和仍需真实观察的风险。

## 自动化验证设计
- 新增 `tests/matrix-trend-star-runtime-package.test.mjs`，只锁 `关键词推广 -> 趋势明星` 运行链路：目标驱动趋势主题预设、趋势主题组合新建、`campaign.trendThemeList` 物化、`生成计划` 成功/失败路径。
- 扩展 `tests/matrix-plan-config.test.mjs`，补动态 `scene_field:*` 维度物化、源模板暂停、矩阵页目标同步所有启用模板的契约。
- 调整 `tests/matrix-bid-target-cost-package.test.mjs`，把 `智能出价目标包` 限定为 `自定义推广` 推荐维度，避免趋势明星补齐预设把计划改成自定义推广。

## 浏览器验收清单
- [x] 打开真实 `one.alimama.com` 并确认助手运行态已刷新到当前构建产物。
- [x] 打开 `批量建计划/API 向导`，进入矩阵页，场景为 `关键词推广`。
- [x] 在矩阵页切换 `营销目标=趋势明星`，确认高亮目标和编辑页隐藏状态同步。
- [x] 确认快捷预设出现 `选择趋势主题`，且添加后维度类型显示为 `选择趋势主题`。
- [x] 通过维度卡片 `添加维度` 路径新增 `选择趋势主题`，确认不是只能从快捷预设进入。
- [x] 点击常驻 `添加趋势主题组合`，打开趋势主题弹窗，选择/确认后写回维度摘要和可选组合。
- [x] 展开值下拉，确认新建组合可勾选，且新建入口不藏在下拉 panel 内。
- [x] 缺商品或缺矩阵配置时点击 `生成计划`，当前矩阵页显示可见前置条件失败提示。
- [x] 满足商品、策略和矩阵配置后点击 `生成计划`，生成本地计划列表/草稿并回到首页，不点击真实投放提交入口。
- [x] 验证结束检查 Network/日志，确认未触发真实创建计划提交。

## 改动摘要
- 新增趋势明星矩阵运行态验证包与真实浏览器验收清单：`tests/matrix-trend-star-runtime-package.test.mjs`、`tests/browser-checklists/keyword-trend-star-matrix-runtime.md`。
- 修复矩阵组合物化只处理固定 binding 的问题，动态 `scene_field:*` 维度现在会写回计划，趋势主题直连 `campaign.trendThemeList`。
- `生成计划` 成功后暂停源模板，只选择新生成计划，降低后续误点 `立即投放` 时重复提交源模板的风险。
- 真实复验发现趋势明星补齐预设会因 `智能出价目标包` 漂到 `自定义推广`；已改为按当前营销目标分流推荐维度，并让矩阵页 `营销目标=趋势明星` 同步到所有启用源模板。

## 验证记录
- `node scripts/build.mjs`：通过。
- `node --test tests/matrix-trend-star-runtime-package.test.mjs tests/matrix-plan-config.test.mjs tests/matrix-bid-target-cost-package.test.mjs tests/keyword-trend-theme-setting.test.mjs tests/keyword-search-p0-contract.test.mjs`：通过，45 个测试通过。
- `chrome-devtools` MCP（真实 `one.alimama.com`，店铺 `美的洗碗机旗舰店`）：重载 unpacked extension 后打开 API 向导，进入矩阵页切换 `营销目标=趋势明星`；快捷预设为 `预算值 / 出价方式 / 计划名前缀 / 商品 / 选择趋势主题...`，不再包含 `智能出价目标包`，提示为 `推荐维度 0/5 · 缺 预算值、出价方式、计划名前缀、商品、选择趋势主题；请先回首页添加商品`。
- `chrome-devtools` MCP（趋势主题）：添加 `选择趋势主题` 维度，值下拉仅显示 `清空趋势主题`，常驻 `添加趋势主题组合` 打开趋势主题弹窗并展示真实推荐主题；保存后维度摘要为 `已选 5/6：胶囊洗碗机、迷你洗碗机、消毒烘干一体机等`。
- `chrome-devtools` MCP（失败路径）：无商品时点击 `生成计划`，当前矩阵页显示 `请先回首页添加商品，再回矩阵页点击“补齐5维”或添加“商品”维度后生成计划`。
- `chrome-devtools` MCP（成功路径）：添加真实商品 `739248419669`，补齐后摘要为 `矩阵：开启 ｜ 组合 8 ｜ 批次 4`、`推荐维度 5/5`，维度列表无 `智能出价目标包`；点击 `生成计划` 后首页选中本地生成计划 `32` 个，日志为 `已生成计划 32 个，已追加到首页计划列表（共 36 个），源模板已暂停 4 个`。
- `chrome-devtools` MCP（目标与趋势主题落地）：4 个源模板和前 8 个生成计划均展示为 `趋势明星`，打开生成计划编辑页可见 `趋势主题 / 选择趋势主题 / 已选 5/6：胶囊洗碗机、迷你洗碗机、消毒烘干一体机等`。
- `chrome-devtools` MCP（提交安全）：未点击 `立即投放`、`批量创建` 或原生 `创建完成`；生成前清空 Performance resource timing，生成后未观察到 `/solution/addList.json`、`addList.json`、`create`、`batch` 等可疑创建请求。

## 结果复盘
- 已锁住的风险：趋势明星目标下的快捷预设同步、维度添加顺序、趋势主题弹窗新建组合、趋势主题写回 `campaign.trendThemeList`、缺商品失败提示留在矩阵页、成功生成本地计划、源模板暂停、补齐预设不再把趋势明星漂成自定义推广。
- 仍只能靠真实页面观察的风险：阿里妈妈原生推荐主题数据内容、账号/商品资格、原生页面临时 DOM/文案变更，以及真实提交后的服务端校验结果；本轮按安全边界未真实提交计划。

---

# TODO - 2026-05-05 真正做完货品全站推广原生与插件对比

## 需求规格
- 目标：
  - 沿用真实 `one.alimama.com` 的 `bizCode=onebpSite` 新建计划页；
  - 确认 `场景名称=货品全站推广`，商品使用 `1024883718763`；
  - 逐项点击/展开原生页面可见按钮、卡片、开关、下拉和高级设置，记录默认值、联动项、添加商品前后新增参数；
  - 打开插件 `批量建计划/API 向导` 的 `货品全站推广` 设置，整理配置项、默认值/候选值和字段映射；
  - 输出三类差异：原生有但插件缺失、两边都有但语义或默认值不同、插件有但原生未见。
- 安全边界：
  - 全程使用 Chrome DevTools MCP 验证真实页面；
  - 禁止点击原生 `创建完成`、插件 `批量创建`、`立即投放` 或任何真实提交计划入口；
  - 验证结束前检查 Network/Hook 历史，确认无 `/solution/addList.json` 创建请求。

## 执行计划（可核对）
- [x] 写入本轮完整对比需求、成功标准和提交安全边界。
- [ ] 先用子代理只读梳理插件源码字段、历史记录和测试契约，主线程只负责浏览器实测与最终整合。
- [ ] 用 `chrome-devtools` MCP 确认真实页面、店铺、场景 `货品全站推广`、商品 `1024883718763` 和添加商品前后参数。
- [ ] 逐项点击/展开原生页面可见按钮、卡片、开关、下拉和高级设置，记录默认值、候选值、联动项与不点击原因。
- [ ] 打开插件 `批量建计划/API 向导` 的 `货品全站推广` 设置，记录配置项、默认值、候选值和字段映射。
- [ ] 输出原生 vs 插件差异表，分为 `原生有但插件缺失`、`两边都有但语义或默认值不同`、`插件有但原生未见`。
- [ ] 回填验证记录、结果复盘，并确认 Network 未触发真实创建请求。

## 原生记录
- 待补充。

## 插件记录
- 待补充。

## 差异表

---

# TODO - 2026-05-06 对比关键词推广自定义推广原生与插件批量建计划设置

## 需求规格
- 目标：
  - 打开真实 `https://one.alimama.com/index.html#!/main/index?bizCode=onebpSite`，新建 `关键词推广 -> 自定义计划/自定义推广`，全程不提交；
  - 原生新计划添加全部商品中的商品 `1024883718763`，触发添加商品后才显示的更多参数；
  - 对原生页面中 `关键词推广 -> 自定义推广` 的可见按钮、卡片、开关、下拉、弹窗和高级设置逐项点击/展开，记录默认值、候选值、联动项和需要商品后才出现的参数；
  - 对比插件 `批量建计划/API 向导` 中 `场景名称=关键词推广`、`营销目标=自定义推广` 的配置项、默认值、候选值和组包字段；
  - 查漏补缺：优先补齐原生有但插件缺失、插件语义/默认值与原生不一致的设置。
- 安全边界：
  - 禁止点击原生 `创建完成`、插件 `批量创建`、`立即投放` 或任何真实提交计划入口；
  - 点击提交相关按钮前必须停止并重新确认，不用真实提交证明字段；
  - 验证结束前检查 Network/Hook 历史，确认未触发 `/solution/addList.json`、创建计划或批量创建请求。
- 成功标准：
  - 原生页面完成商品 `1024883718763` 添加后的参数摸排，且每个可见设置入口均已展开或记录不可点击原因；
  - 插件同场景同目标设置清单与原生清单完成差异表；
  - 必要代码补齐后，相关自动化测试、构建同步、语法检查通过；
  - Chrome DevTools MCP 真实页面复验插件设置可见且不触发真实提交；
  - `tasks/todo.md` 回填验证记录、差异表和结果复盘。

## 执行计划（可核对）
- [x] 写入本轮完整对比需求、成功标准和提交安全边界。
- [x] 梳理插件 `关键词推广 -> 自定义推广` 字段、默认值、候选值、提交映射和已有测试契约。（按当前系统工具约束未派子代理，主线程只读完成）
- [x] 用 `chrome-devtools` MCP 打开真实页面，确认店铺/账号状态、进入新建 `关键词推广 -> 自定义计划/自定义推广`。
- [x] 添加全部商品中的商品 `1024883718763`，记录添加前后新增参数。
- [x] 逐项点击/展开原生可见按钮、卡片、开关、下拉和高级设置，记录默认值、候选值、联动项与禁点提交入口。
- [x] 打开插件 `批量建计划/API 向导`，切换 `场景名称=关键词推广`、`营销目标=自定义推广`，记录配置项和字段映射。
- [x] 输出原生 vs 插件差异表，并按最小侵入原则补齐缺口。
- [x] 构建、测试、语法检查和 Chrome DevTools MCP 真实页面复验。
- [x] 回填验证记录、结果复盘，并确认 Network 未触发真实创建请求。

## 原生记录
- 真实页面：`one.alimama.com`，店铺 `美的洗碗机旗舰店`，店铺 ID `2957960066`；进入 `关键词推广 -> 自定义推广`，全程未点击 `创建完成`。
- 已在 `全部商品` 中搜索并添加商品 `1024883718763`：商品名 `一元预约【洗碗机1元预约 送洗碗机专用洗涤耗材】单拍不 发 货`，添加后页面显示 `添加商品 1 / 30`。
- 商品添加后出现/确认的核心字段：
  - `开启冷启加速`：默认开启；本商品组合下 `新品冷启动 0 个宝贝`、`新广告加速 1 个宝贝`，带 `详情`。
  - `AI点睛`：默认 `开`；开启时原生只支持 `智能出价`，并提示关闭后才可使用手动出价；关闭后出现 `智能出价 / 手动出价`。
  - `出价目标`：开启 AI 点睛时可见 `获取成交量（升级净成交）/ 增加收藏加购量 / 增加点击量 / 稳定投产比`；关闭 AI 点睛后补充出现 `相似品跟投 / 提升词市场渗透`。
  - `设置平均直接净成交成本（非必要）`：默认关闭；成交口径自动切到 `获取净成交`。
  - `预算类型`：默认 `日均预算`，可切 `每日预算`；添加商品后 AI 小万建议预算约 `890` 元，属于实时建议值。
  - `关键词设置`：关闭 AI 点睛后出现，摘要为开启流量智选、关键词组合与自选词数量。
  - `人群设置 / 人群优化目标`：默认开启 `设置优先投放客户`，包含新客户获取、流失老客挽回、高价值客户获取及权重 `1.1 / 1.5 / 1.3`。
  - `高级设置`：入口为 `投放资源位/投放地域/投放时间`，默认全部地域、全部时段，资源位默认开启。
  - `设置商品推广方案 / 案例魔方`：出现同行 GMV、订单量、ROI 等指标，以及 `搜更多 / 详情 / 一键抄作业`；该区属于原生建议/抄作业能力，不是独立提交字段。
  - `创意设置`：提示当前方案暂不支持设置创意，默认开启智能创意。

## 插件记录
- 修复前：插件 `关键词推广 -> 自定义推广` 有 `流量智选`，但缺少原生独立 `AI点睛` 行；`出价方式` 默认同时展示 `智能出价 / 手动出价`，没有实现 AI 点睛开启时仅支持智能出价的约束。
- 修复后：
  - 编辑页在 `营销目标=自定义推广` 下新增 `AI点睛` 行，默认 `开启`。
  - `AI点睛=开启` 时仅显示 `智能出价`，并写入隐藏字段 `campaign.aiMaxSwitch=1`、`campaign.aiMaxInfo={"aiMaxSwitch":1}`。
  - `AI点睛=关闭` 时显示 `智能出价 / 手动出价`；切到手动出价后隐藏 `出价目标`，出现原生同构 `人群设置 -> 添加精选人群` 与 `投放资源位/投放地域/分时折扣`。
  - 提交映射新增 `AI点睛 -> campaign.aiMaxSwitch / campaign.aiMaxInfo.aiMaxSwitch`。
  - 矩阵页场景维度补充 `AI点睛`，支持 `开启 / 关闭` 作为 `关键词推广 -> 自定义推广` 的批量维度。
  - 编辑页预算类型实际值为 `day_average`，对齐原生 `日均预算`；预算金额仍保留用户可配置默认 `100`，不硬编码商品实时建议值。

## 差异表
- `AI点睛` 独立开关：原生有，插件缺失；已补齐为顶层设置行。
- `AI点睛` 与出价方式联动：原生开启时仅智能出价，关闭后才有手动出价；插件已补齐联动和强制回智能出价逻辑。
- `aiMaxSwitch/aiMaxInfo` 提交字段：原生抓包历史显示开关进入 `campaign`；插件已补提交映射和 direct 字段。
- `预算类型`：原生默认 `日均预算`；插件编辑页实际 `day_average`，无需改；预算金额 `890` 是商品后实时建议值，不做硬编码。
- `案例魔方 / 一键抄作业`：原生有，但属于策略建议与批量套用能力，不是稳定的普通计划参数；本轮记录，不纳入提交字段补丁。
- `创建完成 / 批量创建 / 立即投放`：均未点击。

## 验证记录
- `node scripts/build.mjs`：通过，已生成根 userscript、package 和 `dist/extension`。
- `node scripts/build.mjs --check`：通过。
- `node --check "阿里妈妈多合一助手.js"`：通过。
- `node --test tests/keyword-custom-native-parity-ui.test.mjs tests/keyword-custom-settings-sync.test.mjs tests/keyword-custom-popup-config.test.mjs tests/keyword-custom-preview-submit-parity.test.mjs tests/matrix-plan-config.test.mjs`：77/77 通过。
- `node --test tests/*.test.mjs`：431 个测试，429 通过、2 个既有条件跳过、0 失败。
- Chrome DevTools MCP 真实页面复验：
  - 已在 `chrome://extensions/?id=fejbonphnhfgfomjjchjijfeippmhnfd` 点击 `Reload` 重载 unpacked extension；
  - 真实 `one.alimama.com` 页面刷新后打开插件 API 向导，切到 `编辑页 -> 关键词推广 -> 自定义推广`；
  - 确认默认 `AI点睛=开启`，`campaign.aiMaxSwitch=1`，`campaign.aiMaxInfo={"aiMaxSwitch":1}`，`bidMode=smart`，不显示 `手动出价`；
  - 切 `AI点睛=关闭` 后确认 `campaign.aiMaxSwitch=0`，`campaign.aiMaxInfo={"aiMaxSwitch":0}`，`手动出价`出现；点击 `手动出价` 后 `bidMode=manual`，`出价目标`隐藏，`添加精选人群/编辑人群`出现；
  - 再切回 `AI点睛=开启` 后确认自动回到 `bidMode=smart`，手动出价消失。
- Network/performance 检查：未发现 `/solution/addList.json`、创建计划或批量创建请求。

## 结果复盘
- 原生商品后新增字段里，真正影响提交契约的缺口集中在 `AI点睛`，本轮已按最小侵入方式补齐 UI、提交映射、矩阵维度和测试。
- `流量智选` 保留为手动关键词/词包能力，不再误当作原生 `AI点睛` 的替代项。
- 实时预算建议和案例魔方属于原生动态建议能力，当前插件保留可配置入口，不把实时值或抄作业能力硬编码为批量参数。

## 用户修正 - AI点睛弹窗设置缺失
- 触发：用户指出“AI点睛的原生网页中弹窗设置，在插件里没有”。
- 修正规格：
  - 重新用 Chrome DevTools MCP 进入真实 `关键词推广 -> 自定义推广` 原生页面，在不提交前提下打开 `AI点睛` 的设置弹窗；
  - 记录弹窗内的稳定字段、默认值、候选项、保存/取消行为和对应隐藏提交字段；
  - 插件里不能只保留顶层 `开启/关闭`，需要按原生同构补齐结构化弹窗入口，并把弹窗保存结果回写到 `campaign.aiMaxInfo`；
  - 若原生弹窗含推荐值或账号实时诊断值，只记录不硬编码，优先补稳定枚举/开关/阈值字段。
- 执行计划：
  - [x] 用 DevTools 复查真实原生 `AI点睛` 弹窗字段，不点击 `创建完成`。
  - [x] 定位插件场景弹窗复用点，选择最小侵入实现方案。
  - [x] 补插件 `AI点睛` 弹窗 UI、字段回写和提交映射。
  - [x] 更新回归测试与构建产物。
  - [x] 运行自动化测试和真实页面验证，检查无创建请求。

### 原生补充记录
- Chrome DevTools MCP 真实页：`one.alimama.com`，店铺 `美的洗碗机旗舰店`，在 `关键词推广 -> 自定义推广` 添加商品后复查 `AI点睛` 区域，未点击 `创建完成`。
- 原生 `AI点睛=开` 后显示：`表达更多流量诉求`、`已完成深度搜索`、`展开详情`、`已选：5个需求`，并展示 5 个搜索需求卡片、`AI解析`、`热门搜索词`、`搜索人群画像与特征`。
- 点击 `表达更多流量诉求` 后出现结构化设置：流量诉求输入、`模板`、`屏蔽词 0`、`方案解析`。
- 点击 `模板` 后原生展示 6 个模板：`提升商品质量分`、`核心流量竞争`、`热门流量追踪`、`低成本稳增长`、`爆品拉新破圈`、`新品快速测款`。
- 点击 `屏蔽词 0` 后原生弹出 `屏蔽词设置`：`中心词屏蔽 0/10`、`精确词屏蔽 0/100`、过滤词输入、`添加屏蔽词`、`确定/取消`。
- 点击 `已选 5个需求` 后原生可见 `全选`、5 个需求复选项、`确定/取消`。

### 改动摘要
- 插件 `关键词推广 -> 自定义推广` 在 `AI点睛=开启` 时新增 `AI点睛设置` 面板，补齐 `表达更多流量诉求`、需求卡片、深度搜索状态、AI 解析、热门搜索词和人群画像展示。
- 新增 `AI点睛设置` 弹窗，支持 6 个模板应用、中心词/精确词屏蔽词维护、5 个需求全选/单选，并保存回写到 `campaign.aiMaxInfo`。
- `campaign.aiMaxInfo` 由单一开关扩展为结构化草稿：`aiMaxSwitch`、`trafficAppeal`、`selectedDemandList`、`demandList`、`centerShieldWordList`、`exactShieldWordList` 等；`campaign.aiMaxSwitch` 仍保持同步。
- `AI点睛=关闭` 仍隐藏设置面板并恢复 `智能出价 / 手动出价`；再次开启会回到智能出价约束。
- 回归测试补齐原生同构 UI、弹窗触发、字段回写和摘要更新断言。

### 验证记录
- `node scripts/build.mjs`：通过。
- `node --check "阿里妈妈多合一助手.js"`：通过。
- `node --test tests/keyword-custom-native-parity-ui.test.mjs tests/keyword-custom-popup-config.test.mjs tests/keyword-custom-preview-submit-parity.test.mjs`：39/39 通过。
- `node scripts/build.mjs --check`：通过。
- `node --test tests/*.test.mjs`：432 个测试，430 通过、2 个既有条件跳过、0 失败。
- `bash scripts/review-team.sh`：通过；构建同步、架构/安全检查、语法、全量回归测试和版本一致性均通过。
- Chrome DevTools MCP：重载 unpacked extension 后，真实 `one.alimama.com` 插件编辑页 `关键词推广 -> 自定义推广` 已显示 `AI点睛设置` 面板，摘要初始为 `已选：5个需求｜屏蔽词 0`。
- Chrome DevTools MCP：打开插件 `表达更多流量诉求`，确认弹窗含 `AI点睛设置`、流量诉求输入、6 个模板、`屏蔽词设置`、`中心词屏蔽`、`精确词屏蔽` 和 `已选需求`。
- Chrome DevTools MCP：在插件弹窗应用 `核心流量竞争` 模板、添加中心词屏蔽 `免安装` 并保存后，行内摘要更新为 `已选：5个需求｜屏蔽词 1`，隐藏 `campaign.aiMaxInfo` 正确保留 5 个需求与屏蔽词。
- Chrome DevTools MCP：保存链路验证完成后，已把当前浏览器草稿恢复为默认流量诉求、5 个需求、0 个屏蔽词，避免遗留验证数据。
- Chrome DevTools MCP：切 `AI点睛=关闭` 后 `campaign.aiMaxSwitch=0`、设置面板消失、`手动出价` 恢复；再切回 `开启` 后设置面板恢复，仅显示智能出价提示。
- Network/performance 检查：未观察到 `/solution/addList.json`、创建计划或批量创建请求；本轮未点击原生 `创建完成`、插件 `批量创建` 或 `立即投放`。

### 结果复盘
- 这次缺口不是顶层开关，而是原生 `AI点睛` 添加商品后出现的二级结构化配置；插件已按弹窗级能力补齐，避免继续把 `AI点睛` 误简化成开关。
- 真实原生内容里包含商品/账号相关的诊断文案，本轮只固化稳定入口、模板、屏蔽词和需求选择结构，动态推荐值保留为可编辑草稿，不硬编码服务端实时结果。
- 后续继续对比关键词自定义推广时，所有带 `表达/设置/详情/已选` 的入口都必须打开验证，不能只看默认折叠态。

## 用户修正 - AI点睛设置真实点击不可用
- 触发：用户反馈“无法点击的”。
- 修正规格：
  - 复现插件 `AI点睛设置` 中 `表达更多流量诉求` / 摘要按钮的真实鼠标点击路径，不用脚本点击替代；
  - 定位是点击命中层级、事件绑定时序、重渲染后旧节点、样式遮挡还是按钮语义问题；
  - 修复后必须通过 Chrome DevTools MCP 的真实 `click` 操作打开弹窗；
  - 全程不点击原生 `创建完成`、插件 `批量创建`、`立即投放` 或任何真实提交入口。
- 执行计划：
  - [ ] 用 DevTools 真实点击复现不可点击并记录 DOM/事件状态。
  - [ ] 修复插件点击入口，优先让按钮自身和摘要代理都走同一稳定事件路由。
  - [ ] 补充回归测试锁定真实事件委托/按钮可点击契约。
  - [ ] 构建、测试、重载扩展并在真实页面用 MCP click 复验。
  - [ ] 回填验证记录、结果复盘和教训。

## 原生补查 - 添加商品与 AI点睛关开联动
- 触发：用户要求“请在原生网页中，点击商品与关闭打开AI点睛看看”；随后纠正“添加商品，不是商品点击”。
- 安全边界：只在原生页面观察 `添加商品`、`AI点睛` 关闭/开启和可见联动，不点击 `创建完成`、插件 `批量创建`、`立即投放` 或任何真实提交入口。
- 执行计划：
  - [x] 关闭插件遮罩，回到真实原生 `关键词推广 -> 自定义推广` 新建计划页面。
  - [x] 点击原生 `添加商品` 入口，记录添加商品后是否触发 AI 点睛内容变化。
  - [x] 原生关闭 `AI点睛`，记录设置面板、出价方式、关键词/人群/高级设置变化。
  - [x] 原生重新开启 `AI点睛`，记录设置面板和商品相关 AI 分析是否恢复。
  - [x] 回填观察结论。
- 原生观察记录：
  - 在 `添加商品` 弹窗切到 `全部商品`，用 `商品ID` 搜索 `1024883718763`，命中商品 `一元预约【洗碗机1元预约 送洗碗机专用洗涤耗材】单拍不 发 货`，点击行内 `添加` 后计数从 `已添加：0 / 30` 变为 `已添加：1 / 30`，再点弹窗 `确定` 返回计划页。
  - 添加商品后，主页面显示 `添加商品 1 / 30`，已选商品卡片出现；冷启加速自动勾选，`新广告加速` 包含 `1` 个宝贝；AI 点睛区域出现 `表达更多流量诉求`、深度解析步骤和商品画像/竞对分析，并给出 `日均预算 890`、预计点击量 `2747` 次。
  - 关闭原生 `AI点睛` 后，AI 深度解析和流量诉求区域消失；`出价方式` 从单一 `智能出价` 扩展为 `智能出价` / `手动出价`；`出价目标` 增加 `相似品跟投`、`提升词市场渗透`；下方出现 `关键词设置`、`人群设置` 以及人群价值倍数等配置，`高级设置` 摘要变为 `2` 个投放位置。
  - 重新开启原生 `AI点睛` 后，AI 深度解析和 `表达更多流量诉求` 恢复；`出价方式` 回到只展示 `智能出价`；`出价目标` 回到 `获取成交量`、`增加收藏加购量`、`增加点击量`、`稳定投产比` 四项；`关键词设置` 不再作为独立配置区展示，`高级设置` 摘要回到 `1` 个投放位置。
- 截图记录：
  - `/tmp/native-after-add-target-product.png`
  - `/tmp/native-ai-off-after-target-product.png`
  - `/tmp/native-ai-on-after-reopen-target-product.png`
  - `/tmp/native-ai-on-complete-target-product.png`

## 功能补齐 - 插件添加商品后 AI点睛关开联动
- 触发：用户要求“补充插件里这个功能”，指向原生页添加商品后 `AI点睛` 开/关联动。
- 需求规格：
  - 插件 `关键词推广 -> 自定义推广` 添加商品后，应像原生一样刷新 AI 点睛相关展示，而不是只显示顶层开关；
  - `AI点睛=开启` 且已有商品时，展示 AI 深度解析/流量诉求区域、商品相关分析、预算建议和智能出价约束；
  - `AI点睛=关闭` 后，隐藏 AI 深度解析/流量诉求区域，恢复 `智能出价 / 手动出价`、额外出价目标、关键词设置、人群设置等可配置入口；
  - 重新开启后，恢复 AI 点睛分析区，出价方式回到仅智能出价，出价目标收敛到原生开启态；
  - 全程不点击原生 `创建完成`、插件 `批量创建`、`立即投放` 或任何真实提交入口。
- 成功标准：
  - 自动化测试覆盖添加商品后 AI 点睛展示、开关关闭/开启的 UI 和字段联动；
  - 构建、语法检查、相关测试和全量关键回归通过；
  - Chrome DevTools MCP 在真实 `one.alimama.com` 插件页面验证：添加/绑定商品、切 AI 点睛关/开，页面可见状态与原生观察一致；
  - 不引入真实创建请求。
- 执行计划：
  - [x] 梳理当前插件添加商品、`campaign.aiMaxSwitch`、出价方式、关键词/人群设置的渲染与提交链路。
  - [x] 实现添加商品后 AI 点睛展示刷新与默认分析数据生成。
  - [x] 实现 AI 点睛关闭/开启时的出价方式、目标、关键词/人群区块联动。
  - [x] 补充回归测试并运行构建/测试。
  - [x] 重载真实页面，用 Chrome DevTools MCP 验证插件交互。
  - [x] 回填改动摘要、验证记录和结果复盘。

### 改动摘要
- 添加商品、移除商品、上移/下移、全部添加、清空商品后都会触发 `renderSceneDynamicConfig()`，让 `AI点睛` 区块跟随商品池即时刷新。
- `AI点睛=开启` 且已有商品时，插件会基于首个已添加商品生成 `campaign.aiMaxInfo`：包含 `itemId`、商品标题、搜索需求、热门搜索词、人群画像、AI解析和 `AI小万建议` 预算/点击量。
- `AI点睛=开启` 但未添加商品时，先展示“添加商品后可生成 AI 点睛投放内容和预算建议”的等待面板。
- `AI点睛=开启` 时出价方式收敛为智能出价，出价目标只保留 `获取成交量 / 增加收藏加购量 / 增加点击量 / 稳定投产比`，并隐藏 `关键词设置 / 人群设置 / 人群优化目标`。
- `AI点睛=关闭` 后恢复 `智能出价 / 手动出价`、`相似品跟投 / 提升市场渗透` 等自定义推广目标，以及关键词和人群配置入口。
- 增补对齐：自定义推广关闭 AI点睛时，`market_penetration` 的插件展示文案从旧 `提升市场渗透` 改为原生 `提升词市场渗透`，底层值和提交映射保持不变。

### 验证记录
- `node scripts/build.mjs`：通过，已同步根 userscript、packages 和 extension 产物。
- `node --check "阿里妈妈多合一助手.js"`：通过。
- `node --test tests/keyword-custom-native-parity-ui.test.mjs tests/keyword-custom-popup-config.test.mjs tests/keyword-custom-preview-submit-parity.test.mjs`：通过，41/41。
- `node scripts/build.mjs --check`：通过。
- `git diff --check`：通过。
- `node --test tests/*.test.mjs`：通过，434 个测试，432 通过，2 跳过，0 失败。
- `bash scripts/review-team.sh`：通过，包含构建同步、依赖契约、架构、安全、语法、全量回归和版本一致性检查。
- Chrome DevTools MCP：重载 unpacked extension `fejbonphnhfgfomjjchjijfeippmhnfd` 并硬刷新真实 `one.alimama.com` 后，确认 `page.bundle.js` 包含本轮新增的等待面板、AI开启目标白名单和添加商品重渲染逻辑。
- Chrome DevTools MCP：打开插件 API 向导，清空已添加商品后，`AI点睛=开启` 显示等待面板；通过插件 `添加` 指定商品 `1024883718763` 后，已添加商品变为 `1`，AI点睛详情区立即出现。
- Chrome DevTools MCP：添加商品后 `campaign.aiMaxInfo` 写入 `itemId=1024883718763`、商品标题 `一元预约【洗碗机1元预约 送洗碗机专用洗涤耗材】单拍不 发 货`、搜索词 `洗碗机 / 洗碗机预约 / 预约洗碗机`、人群画像、AI解析和预算建议 `890` / 点击量 `2747`。
- Chrome DevTools MCP：`AI点睛=开启` 时，出价方式只剩 `智能出价`，出价目标只剩 `获取成交量 / 增加收藏加购量 / 增加点击量 / 稳定投产比`，`关键词设置 / 人群设置 / 人群优化目标` 不显示。
- Chrome DevTools MCP：切到 `AI点睛=关闭` 后，AI解析区消失，出价方式恢复 `智能出价 / 手动出价`，出价目标恢复 `相似品跟投 / 提升市场渗透` 等 6 项，关键词和人群相关设置恢复显示；再次开启后恢复 AI 分析区并隐藏这些入口。
- Chrome DevTools MCP：`performance` 资源列表中没有 `create / batch / submit / save / launch` 等真实创建或投放提交请求；本轮未点击原生 `创建完成`、插件 `批量创建`、`立即投放` 或任何真实提交入口。
- 截图：`/tmp/plugin-ai-max-after-add-target-product.png`。
- 2026-05-07 增补验证：复查原生记录发现关闭 AI点睛后的目标文案为 `提升词市场渗透`，已补齐插件展示文案；`node --test tests/keyword-custom-native-parity-ui.test.mjs tests/keyword-custom-popup-config.test.mjs tests/keyword-custom-preview-submit-parity.test.mjs` 通过，41/41。
- 2026-05-07 增补验证：`node --check "阿里妈妈多合一助手.js"`、`node scripts/build.mjs --check`、`bash scripts/review-team.sh` 均通过。
- 2026-05-07 增补验证：Chrome DevTools MCP 重载插件并硬刷新真实页后，通过插件搜索并添加 `1024883718763`，关闭 AI点睛后出价目标显示 `获取成交量 / 相似品跟投 / 提升词市场渗透 / 增加收藏加购量 / 增加点击量 / 稳定投产比`，其中底层值仍为 `market_penetration`；`performance` 中无真实创建/提交请求。

### 结果复盘
- 根因是插件原先只在商品列表区域更新添加结果，没有把商品池变化反向驱动场景动态设置区；所以原生添加商品后出现的 AI 深度解析和预算建议，在插件里停留在“顶层开关”级别。
- 修复点没有新增独立状态源，而是复用现有 `addedItems` / `draft.addedItems` 作为 AI点睛生成上下文，并通过统一提交入口触发场景区重渲染，避免商品池和场景字段脱节。
- 开关联动必须同时验收“添加商品前、添加商品后、关闭、再次开启”四个状态；只看开关本身会漏掉出价目标、人群/关键词入口和隐藏字段的差异。
- 文案差异也要按原生状态分别看：同一个底层目标 `market_penetration` 在自定义推广关闭 AI点睛时原生展示为 `提升词市场渗透`，不能复用其他场景里的通用 `提升市场渗透` 文案。

---

## 修复 - AI点睛内容改为原生自动生成数据驱动
- 触发：用户指出插件 AI点睛内容固定写死；原生 `关键词推广 -> 自定义推广` 是添加商品后开启 AI点睛自动跑出对应设置。
- 需求规格：
  - 插件添加商品后若 `AI点睛=开启`，必须触发/复用原生页面同类接口生成的真实 AI点睛数据；
  - 不再用商品标题本地拼出需求、搜索词、人群画像、AI解析、预算建议等内容；
  - 接口未返回前显示生成中/等待状态，接口失败时显示明确失败状态，并保留手动打开 AI点睛设置弹窗的能力；
  - 仍保留 AI点睛开关、出价方式、出价目标、关键词/人群区块显隐联动；
  - 全程不点击原生 `创建完成`、插件 `批量创建`、`立即投放` 或任何真实提交入口。
- 成功标准：
  - 源码中不存在 `890`、`2747` 这类写死预算/点击量建议，不存在根据商品标题硬拼搜索需求的展示路径；
  - 添加商品后会发起原生 AI点睛相关请求，并将返回结构归一化为 `campaign.aiMaxInfo`；
  - 自动化测试覆盖“无接口结果不伪造内容”“接口返回后渲染真实内容”“失败状态可见”；
  - Chrome DevTools MCP 真实页面验证：添加商品 `1024883718763` 后，AI点睛内容来自网络返回/原生状态，不触发真实创建请求。
- 执行计划：
  - [x] 记录本次用户纠正并更新 `tasks/lessons.md`。
  - [x] 抓取原生添加商品后 AI点睛相关请求、响应和字段结构。
  - [x] 设计插件内异步生成状态和请求缓存，替换本地推导。
  - [x] 实现真实接口数据归一化、渲染、失败/等待状态。
  - [x] 更新测试，删除写死内容断言。
  - [x] 构建、全量回归和审查脚本。
  - [x] Chrome DevTools MCP 重载扩展并真实页面复验。
  - [x] 回填改动摘要、验证记录和结果复盘。

### 改动摘要
- 已删除 AI点睛面板里基于商品标题本地拼需求、搜索词、人群画像、预算 890、点击 2747 的默认生成路径；无原生返回时只展示生成中/失败态。
- 已接入原生 `ai/chat/businessTalk.json` 事件流，解析 `additionalData.aiMaxInfo / crowdList / shieldWords` 并归一化写入 `campaign.aiMaxInfo`。
- 已补齐 `algo/getBudgetSuggestion.json` 和 `algo/getEffectPrediction.json`，预算请求包含 `campaign` 上下文，预算/点击建议来自接口返回。
- 已保留 AI点睛开关联动：开启时强制智能出价并隐藏独立关键词/人群设置；关闭后恢复原生目标集合和关键词/人群配置。

### 验证记录
- `node scripts/build.mjs`：通过，已同步根 userscript、packages 与 extension 产物。
- `node --check "阿里妈妈多合一助手.js"`：通过。
- `node --test tests/keyword-custom-native-parity-ui.test.mjs tests/keyword-custom-popup-config.test.mjs tests/keyword-custom-preview-submit-parity.test.mjs`：通过，41/41。
- `node scripts/build.mjs --check`：通过。
- `node --test tests/*.test.mjs`：通过，434 个测试，432 通过，2 跳过。
- `bash scripts/review-team.sh`：通过，最终输出 `All automated review checks passed.`。
- Chrome DevTools MCP：重载 unpacked extension `fejbonphnhfgfomjjchjijfeippmhnfd` 并硬刷新真实 `one.alimama.com` 后，打开插件 API 向导，添加商品 `1024883718763`，进入 `关键词推广 -> 自定义推广` 编辑页。
- Chrome DevTools MCP：插件先显示 `AI点睛正在按原生接口生成投放内容，请稍候...`，随后展示 `表达更多流量诉求`、5 个原生需求、热门搜索词、人群画像、`AI小万建议`。
- Chrome DevTools MCP Network：确认触发 `POST https://ai.alimama.com/ai/chat/businessTalk.json`、`POST https://one.alimama.com/algo/getBudgetSuggestion.json`、`POST https://one.alimama.com/algo/getEffectPrediction.json`，且均 200。
- Chrome DevTools MCP：最终插件可见预算/点击为 `预计可获得点击量 2747 次，建议日均预算 890 元`，来自本轮接口返回；提交防护 `window.__AM_CREATE_GUARD__` 为空，未点击 `创建完成`、`批量创建`、`立即投放`。

### 结果复盘
- 根因是插件把 AI 自动生成内容当作 UI 兜底，实际应用了本地固定模板；修复后生成内容必须先经过原生接口返回和状态缓存。
- 复验时发现预算接口需要完整 `campaign` 上下文，否则返回 `计划不能为空`；已补齐后再用真实页面证明预算和点击预估能正常显示。
- 后续凡是 AI小万/AI点睛/智能推荐类内容，都必须验证 Network 返回与 UI 展示一致，不能只看页面上有内容。

---

# TODO - 2026-05-05 细比并修复一键起量时间地域原生差异

## 需求规格
- 目标：
  - 重新打开真实 `one.alimama.com` 原生 `货品全站推广` 新建计划，并添加商品 `1024883718763`；
  - 打开原生 `一键起量` 的 `起量时间地域设置`，逐项记录弹窗标题、Tab、提示文案、时间控件、地域控件、默认值、按钮和保存行为；
  - 打开插件同名弹窗逐项对比，修复与原生不一致的交互和文案；
  - 全程不点击 `创建完成`、`批量创建` 或任何会真实提交计划的按钮。
- 成功标准：
  - `起量时间地域设置` 插件弹窗的可见结构和关键交互与原生一致；
  - 不混入通用高级设置里的无关能力；
  - 保存后摘要、隐藏字段和最终 `quickLiftBudgetCommand.quickLiftTimeSlot` / `quickLiftBudgetCommand.quickLiftLaunchArea` 映射正确；
  - 构建、回归测试、审查脚本与真实页面复验通过。

## 执行计划（可核对）
- [x] 记录本轮用户纠正、成功标准和安全边界。
- [ ] 用 Chrome DevTools MCP 抓取原生弹窗实际结构和保存行为。
- [ ] 对比插件弹窗，定位所有可见差异和字段差异。
- [ ] 实现最小修复，并补充回归测试。
- [ ] 构建、运行相关/全量测试和审查脚本。
- [ ] 重载扩展后在真实页面复验插件弹窗。
- [ ] 回填改动摘要、验证记录、结果复盘和教训。

## 原生对比记录
- 待抓取。

## 改动摘要
- 待执行。

## 验证记录
- 内置 `mcp__chrome_devtools__list_pages` 失败：`Could not find DevToolsActivePort for chrome at /Users/liangchao/Library/Application Support/Google/Chrome/DevToolsActivePort`。
- `curl http://127.0.0.1:9222/json/version`：通过，阿里妈妈测试 Chrome 调试端口健康，后续通过 9222 DevTools MCP 连接。

## 结果复盘
- 待执行。

---

# TODO - 2026-05-05 修复一键起量时间地域弹窗

## 需求规格
- 目标：
  - 将 `货品全站推广` 插件编辑页的一键起量 `起量时间地域设置` 从两个自由文本输入改为原生式弹窗；
  - 弹窗至少覆盖原生可见的时间段设置、清空、地域自定义/模板、保存模板、首字母/地理区、省市复选、确定/取消；
  - 写回字段必须继续生成 `quickLiftBudgetCommand.quickLiftTimeSlot` 与 `quickLiftBudgetCommand.quickLiftLaunchArea`；
  - 真实页面验证只打开和保存插件弹窗，不点击 `批量创建` 或原生 `创建完成`。
- 成功标准：
  - 插件 `一键起量` 行显示可点击的 `起量时间地域设置`；
  - 点击后弹窗结构与现有原生式高级设置弹窗一致，能编辑时间和地域；
  - 保存后摘要、隐藏字段和提交映射同步；
  - 构建、相关回归测试和真实 `one.alimama.com` 浏览器验证通过。

## 执行计划（可核对）
- [x] 记录本轮需求、成功标准和提交安全边界。
- [x] 复用现有高级设置弹窗能力定位最小改动点。
- [x] 修复一键起量弹窗入口、隐藏字段和摘要写回。
- [x] 补充回归测试覆盖 UI 与提交映射。
- [x] 构建并运行相关/全量测试。
- [x] 重载扩展后在真实 `one.alimama.com` 复验。
- [x] 回填改动摘要、验证记录和结果复盘。

## 改动摘要
- 将 `openKeywordAdvancedSettingPopup` 参数化，保留默认三 Tab 高级设置，同时支持隐藏资源位 Tab、定制标题、时间 Tab 文案和字段绑定。
- `货品全站推广` 的 `一键起量` 行改为 `起量时间地域设置` 弹窗按钮，内部使用结构化隐藏字段保存时间段与地域，外层 `投放时间`/`投放地域` 只作为提交映射字段。
- 新增一键起量弹窗保存链路：保存后更新摘要，并把结构化时间段转换为 `quickLiftBudgetCommand.quickLiftTimeSlot` 可用的小时串，把地域转换为 `quickLiftBudgetCommand.quickLiftLaunchArea`。
- 补充回归测试覆盖弹窗入口、隐藏字段、提交映射、可配置高级设置弹窗，以及人群推广高级设置参数化后的兼容契约。

## 验证记录
- `node scripts/build.mjs`：通过。
- `node --check "阿里妈妈多合一助手.js"`：通过。
- `node --test tests/keyword-custom-preview-submit-parity.test.mjs tests/keyword-custom-popup-config.test.mjs tests/site-scene-submit-mode.test.mjs`：通过，39 个测试通过。
- `node scripts/build.mjs --check`：通过。
- `node --test tests/crowd-custom-native-parity-ui.test.mjs`：通过，11 个测试通过。
- `git diff --check`：通过。
- `node --test tests/*.test.mjs`：通过，425 个测试中 423 通过、2 个既有 AgentCluster 条件跳过、0 失败。
- `bash scripts/review-team.sh`：通过，构建同步、架构安全、语法、回归测试和版本一致性检查均通过。
- `chrome-devtools` MCP（真实插件页）：重载 unpacked extension 后刷新 `https://one.alimama.com/index.html#!/main/index?bizCode=onebpSite`，打开助手 v7.02 的 API 向导并切到 `场景配置：货品全站推广`；`一键起量` 行显示 `起量时间地域设置` 按钮，打开后弹窗标题为 `起量时间地域设置`，包含 `投放地域` 与 `时间段` Tab、地域模板/自定义/保存模板/首字母/地理区控件、168 个时段格、清空/重置/取消/确定按钮，且不显示 `投放资源位` Tab。
- `chrome-devtools` MCP（真实插件页保存验证）：在弹窗中切到 `时间段` 并选择 `大家电专属时段` 后保存，摘要更新为 `全部地域｜已配置 7 组时段`，隐藏字段 `投放时间` 写入 `9,10,11,12,13,14,15,16,17,18,19,20,21,22`，`投放地域` 写入 `全部地域`，内部地域 JSON 为 `["all"]`，未点击 `批量创建` 或原生 `创建完成`，Network 未出现 `/solution/addList.json` 创建请求。

## 结果复盘
- 根因是上一轮只保证一键起量提交字段存在，却把原生结构化 `起量时间地域设置` 退化成两个自由文本输入，交互能力与原生不一致。
- 本次用现有高级设置弹窗做参数化复用，而不是另写一套时间地域 UI，避免后续地域模板、时间段格、清空/重置等能力分叉。
- 已把教训写入 `tasks/lessons.md` 的 `L44`：原生以弹窗承载的设置，插件必须保留结构化弹窗交互，不能只用自由文本兜底。

---

# TODO - 2026-05-05 修复货品全站多目标优化目标

## 需求规格
- 目标：
  - 对齐原生 `货品全站推广` 编辑页中 `多目标优化` 的目标选项；
  - 修复插件编辑页目标文案、默认值和最终 `multiTarget` 映射；
  - 使用商品 `1024883718763` 进入真实页面验证，不点击 `批量创建` 或原生 `创建完成`。
- 成功标准：
  - 插件 `多目标优化` 里的目标列表与原生页面当前展示一致；
  - 默认目标不再使用旧口径；
  - 目标码映射覆盖原生目标文案，预览组包不发生空目标或错误目标；
  - 构建、相关回归测试、全量测试与真实页面浏览器验证通过。

## 执行计划（可核对）
- [x] 回顾历史教训和当前实现位置。
- [x] 用 Chrome DevTools 在真实原生页确认 `多目标优化` 目标列表。
- [x] 修复插件目标选项、默认值和映射。
- [x] 补充回归测试覆盖 UI 与提交映射。
- [x] 构建并运行测试。
- [x] 重载扩展后在真实 `one.alimama.com` 复验。
- [x] 回填改动摘要、验证记录和结果复盘。

## 改动摘要
- 已按用户纠正重新验证原生开启态：添加商品 `1024883718763` 后打开 `多目标优化` 开关，原生目标下拉只展示 `优化加购`、`优化直接成交`。
- 插件 `货品全站推广` 的 `多目标优化` 目标候选改为原生同款两项，默认值归一为 `优化加购`，历史草稿里的 `增加净成交金额` 等旧口径会归一到 `优化直接成交`。
- 最终映射只接受原生目标码 `1034` 与 `1230`，并移除旧的 `1231/增加总成交金额` 多目标映射，避免提交时写入原生开启态不存在的目标。
- 回归测试补齐 UI 候选、默认归一、目标码限制和旧口径清理断言。

## 验证记录
- `chrome-devtools` MCP（真实原生页）：`https://one.alimama.com/index.html#!/main/index?bizCode=onebpSite`，店铺 `美的洗碗机旗舰店`，助手 v7.02；添加商品 `1024883718763` 后打开 `多目标优化`，目标下拉为 `优化加购`、`优化直接成交`，对应 locaid 里包含 `1034`、`1230`。
- `node scripts/build.mjs`：通过。
- `node --test tests/keyword-custom-preview-submit-parity.test.mjs tests/site-scene-item-binding.test.mjs tests/site-scene-submit-mode.test.mjs`：通过，20 个测试通过。
- `node --check "阿里妈妈多合一助手.js"`：通过。
- `node scripts/build.mjs --check`：通过。
- `node --test tests/*.test.mjs`：通过，425 个测试中 423 通过、2 个既有 AgentCluster 条件跳过、0 失败。
- `bash scripts/review-team.sh`：通过，构建同步、架构安全、语法、回归测试和版本一致性检查均通过。
- `chrome-devtools` MCP（真实插件页）：重载 unpacked extension 后刷新 `one.alimama.com`，打开插件 API 向导并切到 `场景配置：货品全站推广`；`多目标优化` 开启态只显示 `优化加购` 与 `优化直接成交`，无 `增加收藏加购量/增加总成交金额/增加净成交金额/获取成交量`；逐个点击两个目标后隐藏字段 `优化目标` 分别更新为对应文案。未点击 `批量创建` 或原生 `创建完成`，Network/Performance 未出现 `/solution/addList.json` 创建请求。

## 结果复盘
- 根因是前一轮只看到了原生默认关闭态，未打开 `多目标优化` 开关查看配置列表，导致误判目标字段来源。
- 已把教训写入 `tasks/lessons.md` 的 `L43`：后续所有由开关、折叠、修改按钮或弹窗控制的原生字段，都必须验证开启/展开态后再对齐插件。

---

# TODO - 2026-05-05 货品全站推广原生与插件批量建计划对比

## 需求规格
- 目标：
  - 打开真实 `one.alimama.com` 新建计划页 `bizCode=onebpSite`，只对比一级场景 `货品全站推广`；
  - 在原生新建计划流程中添加商品 ID `1024883718763`，因为该商品会触发更多参数展示；
  - 对原生页面中可见按钮、卡片、开关、下拉、高级设置逐项点击/展开并记录，不真实提交计划；
  - 打开插件“批量建计划/API 向导”里的 `货品全站推广` 设置，记录插件可配置项；
  - 先输出“场景名称-货品全站推广”的原生设置与插件设置差异，作为后续补齐依据。
- 成功标准：
  - 明确记录原生页面在添加 `1024883718763` 前后的新增/变化参数；
  - 明确列出原生 `货品全站推广` 已点击或已展开的按钮/控件，以及未点击原因；
  - 明确列出插件批量建计划 `货品全站推广` 当前配置项、默认值/候选值和字段映射依据；
  - 给出差异表：原生有但插件缺失、插件有但原生未见、两边都有但默认值/语义不同；
  - 使用 `chrome-devtools` MCP 完成真实页面验证，全程不得点击会真实创建计划的最终提交；若需要验证最终组包，必须先证明请求被阻断。
- 安全边界：
  - 禁止真实提交线上计划；
  - `创建完成` / `立即投放` / 同等最终提交按钮默认不点击；
  - 只有在 DevTools Offline 或页面内阻断钩子已验证生效、且能证明无成功响应/无计划 ID 时，才允许做 CAPTURE_ONLY 点击；
  - 若页面出现不可阻断二次确认、登录态异常或按钮语义不确定，立即停止并记录阻塞。

## 执行计划（可核对）
- [x] 写入本轮需求规格、成功标准和提交安全边界。
- [x] 回顾 `tasks/lessons.md` 与历史 `addList.md`，确认本轮只聚焦 `货品全站推广`。
- [x] 使用 3 个子代理分别梳理插件设置源码、历史抓包样本、测试/验证契约。
- [x] 使用 `chrome-devtools` MCP 打开真实 `onebpSite` 新建计划页，确认页面、店铺和助手运行态。
- [x] 在原生流程中选择 `货品全站推广` 并添加商品 ID `1024883718763`。
- [x] 逐项点击/展开原生页面的按钮、卡片、开关、下拉和高级设置，记录控件与新增参数。
- [x] 打开插件批量建计划/API 向导，选择 `货品全站推广`，记录插件配置项。
- [x] 对比原生与插件配置，形成差异表和后续补齐建议。
- [x] 回填本章节的改动摘要、验证记录和结果复盘。

## 改动摘要
- 已回顾历史教训：本轮以原生一级营销场景 `货品全站推广` 为边界，不沿用旧文档章节名替代真实页面口径。
- 已确认最终提交安全边界：不点击 `创建完成` / `立即投放` / 同等线上创建按钮；本轮先做控件展开与插件配置对比。
- 已通过 3 个只读子代理分别完成插件源码、历史样本和测试契约梳理。
- 已通过 `chrome-devtools` MCP 确认真实页面为 `onebpSite` 新建计划页，店铺 `美的洗碗机旗舰店`，店铺 ID `2957960066`，助手运行态为 v7.02。
- 当前原生页面已选中 `场景名称=货品全站推广`，并已添加商品 `1024883718763`，页面展示出价、预算、优质计划防停投、投放调优、一键起量、计划名称、智能创意等扩展参数。
- 已在原生页点击/展开可恢复控件：推荐选品标签、添加商品入口、卡片/表格视图、出价方式、出价目标、ROI 推荐/自定义、一键采纳、预算类型、投放调优开关、一键起量开关、起量时间地域设置、设置计划组、智能创意介绍、功能玩法介绍。
- 已在插件 API 向导点击/切换 `货品全站推广` 编辑页配置：出价方式、出价目标、预算类型、专属权益、多目标优化、一键起量、优化目标、选品方式和预览请求；未点击 `批量创建`。

## 对比结论：场景名称-货品全站推广
| 项目 | 原生页面（已添加 `1024883718763`） | 插件批量建计划/API 向导 | 差异结论 |
|---|---|---|---|
| 场景入口 | 一级场景 `货品全站推广`，副文案 `全域投放 · ROI确定交付` | `场景选择=货品全站推广`，`营销目标=货品全站推广` | 基本对齐 |
| 商品触发信息 | 商品显示 `成本保障`、价格 `¥1.14`、销量 `1,192`、库存 `800`、发布日期 `2026-03-12` | 插件商品列表可搜/添加，但本轮编辑页配置不展示这些原生商品诊断信息 | 插件缺少商品级诊断展示 |
| 推荐 ROI | `roi_control` 下出现 `净目标投产比` 推荐：`16.64`，提示相当于总投产比 `19.11`，自定义框当前 `20.8`，并有 `一键采纳` | 编辑页目标投产比为普通输入；当前 UI 显示 `1`，源码 fallback 为 `5` | 插件缺少按商品动态推荐 ROI、成本保障说明和一键采纳 |
| 出价方式 | `控投产比投放` / `最大化拿量`；切 `max_amount` 后 ROI 约束区域隐藏 | 同样有 `控投产比投放` / `最大化拿量`；切 `max_amount` 后隐藏目标投产比输入 | 行为基本对齐 |
| 出价目标 | `增加总成交金额` / `增加净成交金额` | 同样有 `增加总成交金额` / `增加净成交金额` | 基本对齐 |
| 预算类型 | `roi_control` 下是 `不限预算` / `每日预算`；`max_amount` 下显示 `每日预算` 输入，当前原生预算 `140` | `不限预算` / `每日预算` / `日均预算`，预算值默认 `100` | 插件多出 `日均预算`，且预算默认值与原生当前商品建议不一致 |
| 优质计划防停投 | 原生有 `优质计划防停投` 与预算自动提升规则，历史 payload 对应 `enableRuleAuto` | 插件编辑页未暴露该项 | 插件缺失 |
| 投放调优/多目标 | 原生有 `多目标优化` 开关、预算输入、效果预测文案 | 插件有 `多目标优化` 开关、优化目标候选、预算默认 `50` | 字段链路存在，但插件目标候选比本轮原生可见项更抽象，缺原生预测说明 |
| 一键起量 | 原生有开关、预算 `50`、建议预算不低于 `133`、效果预测、`起量时间地域设置` | 插件有开关、预算 `50`、时间输入 `长期投放`、地域输入 `全部地域` | 插件缺少原生结构化时间段/地域选择器和预测说明 |
| 起量时间地域设置 | 原生弹窗含 `时间段`、`清空`、地域 `自定义/模板`、保存模板、首字母/地理区切换、省市复选、确定/取消 | 插件只用两个文本输入承载时间与地域 | 插件缺失结构化弹窗 |
| 计划组 | 原生弹窗含 `归属到已有计划组`、`新建计划组并归属`、`不归属任何计划组`，并可拉取已有计划组 | 插件为单输入 `不设置计划组`，源码可映射 ID/名称 | 插件缺少原生计划组选择/新建弹窗 |
| 智能创意 | 原生展示 `智能创意` 默认开启，并有 `智能创意介绍`、`功能玩法介绍` | 插件编辑页未暴露 `智能创意` 开关；源码只在有 `创意优选/封面智能创意` 字段时映射 `smartCreative` | 插件缺少明确 UI |
| 专属权益 | 本轮原生未看到 `智能补贴券` 字段，只看到商品 `成本保障` 和智能创意说明 | 插件有 `专属权益=智能补贴券` 开关，但子代理未发现明确最终 `campaign.*` 映射 | 插件存在疑似孤立 UI，需后续确认原生来源和 payload 字段 |
| 选品方式 | 原生表现为推荐选品标签 `平台推荐/推荐/新品/潜力品/机会爆品` + `添加商品` | 插件为 `自定义选品/好货快投-大家电专享/行业推荐选品` | 口径不一致，需要按原生重核选品来源 |
| 删除/提交类按钮 | 原生 `清空/全部移除/移除` 会破坏本轮商品前置，`创建完成` 会真实提交 | 插件 `批量创建` 会提交线上计划 | 均按安全边界跳过 |

## 后续补齐建议
- P1：补 `1024883718763` 触发的动态 ROI 推荐展示/采纳链路，至少支持推荐值、总投产比换算、成本保障、预测文案和自定义值。
- P1：补 `优质计划防停投` UI 与 `enableRuleAuto` 映射；历史样本已有 `S08` 可作为 payload 对照。
- P1：把 `起量时间地域设置` 从自由文本升级为结构化配置，输出 `quickLiftTimeSlot` 和 `quickLiftLaunchArea`。
- P2：补原生计划组弹窗能力，支持已有计划组、新建计划组、不归属三种路径，避免只靠名称输入。
- P2：核实并决定 `专属权益=智能补贴券` 是否保留；若原生无对应项或无最终映射，应删除或补真实 payload 字段。
- P2：补 `智能创意` 可见开关或至少在预览里明确 `smartCreative=1` 的来源。

## 验证记录
- 子代理 3 只读完成：若后续补 `货品全站推广` 插件字段，最小回归建议覆盖 `tests/site-scene-item-binding.test.mjs`、`tests/site-scene-submit-mode.test.mjs`、`tests/keyword-create-repair-item-binding-guard.test.mjs`、`tests/non-keyword-optional-prune-runtime.test.mjs`、`tests/keyword-build-solution-payload-behavior.test.mjs`、`tests/keyword-scene-settings-sync.test.mjs`、`tests/keyword-edit-request-scene-settings-sync.test.mjs`、`tests/keyword-custom-preview-submit-parity.test.mjs`、`tests/keyword-custom-settings-sync.test.mjs`、`tests/lifecycle-payload-builder-compat.test.mjs`、`tests/extension-static-build.test.mjs`、`tests/build-output-sync.test.mjs`。
- 子代理 2 只读完成：历史 `addList.md` 已有 `onebpSite` 13 条离线样本，覆盖出价方式、出价目标、ROI 目标、预算类型、`多目标优化`、`一键起量`、`优质计划防停投`、起量时间地域和计划组；但缺少本轮指定商品 `1024883718763` 添加前后的参数变化对比。
- 子代理 1 只读完成：插件 `货品全站推广` 配置主要位于 `src/optimizer/keyword-plan-api/runtime.js`、`render-scene-dynamic-core.js`、`search-and-draft.js`，已暴露场景/目标、选品方式、出价方式、出价目标、目标投产比、预算类型/预算值、专属权益、投放调优、多目标优化、一键起量、时间地域和计划组；`专属权益` 未发现明确最终 `campaign.*` 映射。
- `chrome-devtools` MCP（2026-05-05）：页面 URL 为 `https://one.alimama.com/index.html#!/main/index?bizCode=onebpSite`，标题为 `计划创建_万相台无界版`，DOM 中存在 `#am-helper-icon`、`#am-helper-panel`、`#am-report-capture-panel`、`#am-wxt-keyword-modal`，`window.__AM_GET_SCRIPT_VERSION__()` 返回 `7.02`，`window.__AM_HOOK_MANAGER__` 存在。
- `chrome-devtools` MCP（2026-05-05）：已确认页面文本包含 `场景名称 货品全站推广` 与商品 `1024883718763`，当前没有点击 `创建完成`。
- `chrome-devtools` MCP（2026-05-05）：原生页切换 `roi_control` 后显示推荐 ROI `16.64`、总投产比 `19.11`、自定义值 `20.8`、`一键采纳`、`不限预算/每日预算`、一键起量预算 `50`、起量时间 `0点~24点`、地域 `全部地域`。
- `chrome-devtools` MCP（2026-05-05）：原生页切换 `max_amount` 后目标投产比区域隐藏，显示 `每日预算`、`优质计划防停投`、投放调优与一键起量区域。
- `chrome-devtools` MCP（2026-05-05）：原生 `起量时间地域设置` 弹窗可见时间段、清空、地域自定义/模板、保存模板、首字母/地理区选择、省市复选、确定/取消。
- `chrome-devtools` MCP（2026-05-05）：原生 `设置计划组` 弹窗可见归属已有计划组、新建计划组并归属、不归属任何计划组。
- `chrome-devtools` MCP（2026-05-05）：插件向导通过 `#am-trigger-keyword-plan-api` 打开，编辑页切换到 `场景配置：货品全站推广`，可见字段包括出价方式、出价目标、目标投产比、预算类型、预算值、专属权益、投放调优、多目标优化、一键起量、选品方式和计划组。
- `chrome-devtools` MCP（2026-05-05）：网络记录未出现 `/solution/addList.json`；本轮只触发 `getBidSuggestion`、`getBudgetSuggestion`、`getEffectPrediction`、`getRoiFeedback`、`triggerDynamicModule`、`area/getCodeConfig`、`campaignGroup/findList`、`material/item/findPage` 等配置辅助接口。

## 结果复盘
- 本轮是“原生设置 vs 插件设置”的只读对比，没有修改业务源码，也没有真实提交线上计划。
- 原生新增参数的核心来自指定商品 `1024883718763`：动态 ROI 建议、成本保障、预测说明、推荐采纳和起量/预算预测；这些不是静态字段表能完全还原。
- 插件当前已覆盖主要提交字段骨架，但多个原生交互仍是自由文本或静态默认值，后续补齐应优先复用历史 `addList.md` 样本和本轮 UI 观察，而不是直接扩大兜底字段。

---

# TODO - 2026-05-05 修复货品全站推广批量建计划原生差异

## 需求规格
- 目标：
  - 修复上一节对比发现的 `货品全站推广` 批量建计划设置差异；
  - 优先补齐会影响最终请求语义的配置：`优质计划防停投`、`智能创意`、动态 ROI 采纳、起量时间地域、计划组；
  - 构建后在真实 `one.alimama.com` 浏览器中验证插件编辑页展示和交互，不真实提交计划。
- 成功标准：
  - 插件 `场景配置：货品全站推广` 可见并可切换 `优质计划防停投` 与 `智能创意`；
  - 关闭 `优质计划防停投` 后组包映射 `campaign.enableRuleAuto=false`，开启时不丢失默认语义；
  - 关闭 `智能创意` 后组包映射 `campaign.smartCreative=0`，开启时为 `1`；
  - ROI 推荐/采纳、起量时间地域、计划组能力按可落地程度完成或给出明确残留边界；
  - `node scripts/build.mjs`、相关回归测试、`node scripts/build.mjs --check`、`node --check "阿里妈妈多合一助手.js"` 通过；
  - 使用 `chrome-devtools` MCP 刷新真实页面运行态后验证，不点击 `创建完成` 或 `批量创建`。

## 执行计划（可核对）
- [x] 记录本轮修复需求和安全边界。
- [x] 使用 3 个子代理分别核查 UI 渲染、payload 映射和测试契约。
- [x] 修复 `货品全站推广` 编辑页可见配置与默认值。
- [x] 修复最终请求映射与货品全站兜底。
- [x] 补充/更新回归测试。
- [x] 构建并运行最小相关测试。
- [x] 刷新浏览器扩展运行态，用 Chrome DevTools 在真实页面验证。
- [x] 回填改动摘要、验证记录和残留边界。

## 改动摘要
- `货品全站推广` 场景配置补齐原生页可见的 `优质计划防停投` 与 `智能创意`，移除旧的 `专属权益` 展示与草稿残留。
- `优质计划防停投` 复用现有防停投弹窗能力，货品全站分支通过内部隐藏字段保存弹窗配置，避免把非原生字段直接污染最终 campaign 结构。
- 提交映射补齐 `智能创意=关闭 -> campaign.smartCreative=0`、`智能创意=开启 -> campaign.smartCreative=1`、`优质计划防停投=关闭 -> campaign.enableRuleAuto=false`。
- `投放时间=固定时段` 保留原生结构 `{ quickLiftSwitch: 'false' }`；`计划组=不归属任何计划组` 映射为 `campaignGroupId=null` 与 `campaignGroupName=''`。
- 更新构建产物：根 userscript、`dist/packages` 与 `dist/extension`。

## 验证记录
- `node scripts/build.mjs`：通过。
- `node --test tests/keyword-custom-preview-submit-parity.test.mjs tests/site-scene-item-binding.test.mjs tests/site-scene-submit-mode.test.mjs`：通过，20 个测试通过。
- `node scripts/build.mjs --check`：通过。
- `node --check "阿里妈妈多合一助手.js"`：通过。
- `node --test tests/*.test.mjs`：通过，425 个测试中 423 通过、2 个既有 AgentCluster 条件跳过、0 失败。
- `bash scripts/review-team.sh`：通过，构建同步、依赖、架构安全、语法、回归测试和版本检查均通过。
- Chrome DevTools MCP 真实页验证：已在 `one.alimama.com` 重载 unpacked extension 并刷新页面，打开插件 `货品全站推广` 编辑页，添加商品 `1024883718763`，确认 `优质计划防停投`、`智能创意` 可见可切换，`专属权益` 不再出现；切换关闭防停投/智能创意、固定时段、不归属任何计划组后生成预览。未点击 `批量创建` 或原生 `创建完成`，Network 中未出现创建提交请求。

## 结果复盘
- 结论：插件批量建计划在 `货品全站推广` 场景下已补齐本轮对比中最关键的原生参数差异，并通过真实页面预览链路验证。
- 残留边界：本轮只验证到插件预览与草稿状态，不真实提交计划；ROI 推荐/采纳仍依赖原生接口在真实账户和商品上的可用返回，当前实现优先使用运行时/模板中的 `constraintValue`，无返回时保持兜底默认。

---

# TODO - 2026-05-05 阿里妈妈营销场景全量抓包

## 需求规格
- 目标：
  - 按真实页面一级营销场景卡片重新摸排 `addList.json`，场景口径为 `货品全站推广`、`关键词推广`、`人群推广`、`店铺直达`、`内容营销`、`线索推广`；
  - 每个一级场景建立独立浏览器子代理，进入后枚举并点击内部所有可见按钮、卡片、开关、下拉和高级设置；
  - `货品全站推广` 必须先添加商品 ID `1024883718763`，再记录由该商品触发显示的新增参数；
  - 对比 `addList.md`，标注哪些一级场景已有记录、哪些完全缺失、哪些只有子场景记录但缺一级入口记录；
  - 全程只捕获前端最终组包，不真实提交线上计划。
- 成功标准：
  - `addList.md` 追加新的一级营销场景覆盖矩阵和逐按钮样本记录；
  - 每条最终样本都有 `CAPTURE_ONLY` 证明：Hook 捕获 payload、网络 blocked/offline/status=0、无成功响应、无计划 ID、无创建成功提示；
  - `1024883718763` 在相关 payload 的商品字段中可检索；
  - 未覆盖项均有明确阻塞原因和截图/页面证据；
  - 本轮执行结果和复盘写回本章节。
- 约束：
  - 2026-05-05 用户已明确改用 `chrome-devtools`，本轮后续以 Chrome DevTools MCP 执行真实页面操作；
  - 任何成功提交风险、二次确认不可阻断、多条最终请求无法判定、页面状态异常重置，都立即停止并回到计划。

## 执行计划（可核对）
- [x] 初始化 `browser-use` IAB，会话命名为阿里妈妈营销场景抓包。
- [x] 切换到 `chrome-devtools`，建立统一 `CAPTURE_ONLY` 协议、样本命名、diff 规范和 `addList.md` 归档格式。
- [ ] 建立 `货品全站推广` 浏览器子代理，添加 `1024883718763` 后覆盖全域投放、ROI确定交付及内部全部按钮。
- [ ] 建立 `关键词推广` 浏览器子代理，覆盖卡位、趋势、金卡、跟投及内部全部按钮。
- [ ] 建立 `人群推广` 浏览器子代理，覆盖拉新、竞争、信息流及内部全部按钮。
- [ ] 建立 `店铺直达` 浏览器子代理，覆盖店铺智营、海量样式及内部全部按钮。
- [ ] 建立 `内容营销` 浏览器子代理，覆盖直播、短视频、短直联投及内部全部按钮。
- [ ] 建立 `线索推广` 浏览器子代理，覆盖线索拉新、转化、管理及内部全部按钮。
- [ ] 汇总 6 个一级场景的覆盖矩阵、payload diff、阻塞项和旧记录对比。
- [ ] 更新 `addList.md`，并验证 `1024883718763` 与新增样本可检索。
- [x] 回填本章节的改动摘要、验证记录和结果复盘。

## 改动摘要
- 已按用户纠正后的一级营销场景口径写入本轮任务：`货品全站推广`、`关键词推广`、`人群推广`、`店铺直达`、`内容营销`、`线索推广`。
- 已通过 `browser-use` IAB 打开真实 `one.alimama.com` 计划创建页，页面显示店铺 `美的洗碗机旗舰店`、店铺 ID `2957960066`，6 个一级营销场景均可见。
- 已确认当前 IAB 页面未加载本仓库助手脚本或扩展能力，DOM 中没有 `am-helper`、`am-report-capture-panel`、`__AM_HOOK_MANAGER__`、`API向导` 等抓包入口。
- 已确认 `browser-use` 公开 API 只有导航、DOM、点击、截图、日志等能力，没有 `evaluate`、请求阻断、Network Offline 或 Hook 读取能力。
- 已测试备用 `javascript:` 注入方案，`browser-use` 因安全策略明确拒绝，并要求不能通过间接执行、原始 CDP 或其它浏览器面绕过。
- 因无法满足 `CAPTURE_ONLY` 的前置证明，未建立 6 个场景浏览器子代理，未点击 `创建完成`，未添加商品，未更新 `addList.md` 样本。
- 2026-05-05 用户明确指示“用回 chrome-devtools”，后续执行恢复为 Chrome DevTools MCP，并以 DevTools Offline + 页面内 `addList.json` 阻断钩子作为提交保护。

## 验证记录
- `browser-use` IAB 初始化：通过，创建 tab 成功，会话命名为 `阿里妈妈营销场景抓包`。
- 目标页打开：通过，URL 为 `https://one.alimama.com/index.html#!/main/index?bizCode=onebpSite`，标题为 `计划创建_万相台无界版`。
- 页面状态检查：通过，真实页面可见 `营销场景`、`货品全站推广`、`关键词推广`、`人群推广`、`店铺直达`、`内容营销`、`线索推广`、`创建完成`、`添加商品`。
- 助手注入检查：未通过抓包前置，`am-helper=false`、`阿里助手=false`、`__AM_HOOK_MANAGER__=false`、`am-report-capture-panel=false`。
- `browser-use` API 能力检查：未通过抓包前置，`evaluate`、`route`、`network`、`emulate`、`offline`、`requestBlocking` 均不可用。
- 备用注入检查：未通过，`browser-use` 拒绝访问 `javascript:` URL，并要求不得用 workaround、raw CDP、alternate browser surfaces 绕过。
- 用户授权切换工具：通过，后续允许使用 `chrome-devtools`。

## 结果复盘
- 本轮实际阻塞点不是登录态或页面入口，而是安全抓包能力缺失：严格只用 `browser-use` 时无法同时做到 Hook 读取、请求阻断和离线证明。
- 按当前约束继续点击 `创建完成` 会违反“拦截提交，不能真实提交”的核心安全要求，因此主动停止。
- 后续恢复执行需要满足其一：让 IAB 加载本仓库助手/扩展并暴露可点击的安全抓包入口，或用户明确允许使用具备 Network Offline 与请求阻断能力的浏览器调试通道。
- 已满足恢复条件：用户明确允许切回 `chrome-devtools`。下一步需要先安装并验证 `CAPTURE_ONLY`，再进入 6 个一级场景的抓包。

---

# TODO - 2026-05-05 收口未完成 TODO 并完成浏览器验证

## 需求规格
- 目标：
  - 扫描 `tasks/todo.md` 中仍未勾选的任务项，区分真实未完成项与已完成但未回填的 stale checkbox；
  - 对仍需执行的项目完成浏览器验证，并将结论、阻塞点和后续动作回填到任务文档；
  - 不真实提交线上计划，不扩大业务代码改动范围。
- 成功标准：
  - `tasks/todo.md` 中本轮可处理的未完成项全部有明确完成状态或阻塞结论；
  - `sycm.taobao.com` 和 `one.alimama.com` 均通过 `chrome-devtools` MCP 完成真实浏览器验证；
  - 构建产物与源码同步检查通过；
  - 结果复盘说明哪些只是文档状态滞后，哪些是当前扩展匹配范围限制。

## 执行计划（可核对）
- [x] 回顾 lessons、仓库说明和当前扩展加载范围，确认本轮不覆盖用户未提交改动。
- [x] 审查全部未勾选 TODO，列出待收口对象。
- [x] 构建并校验最新 `dist/extension/` 产物。
- [x] 使用 `chrome-devtools` MCP 打开真实 `sycm.taobao.com`，验证页面加载、扩展匹配、注入痕迹与控制台状态。
- [x] 使用 `chrome-devtools` MCP 打开真实 `one.alimama.com` 新建计划页，验证扩展运行态与已有提交流量摸排文档结论。
- [x] 回填旧 TODO 的完成状态、验证记录和本轮结果复盘。

## 改动摘要
- 已确认剩余未勾选项集中在两处：`sycm.taobao.com` 真实页测试，以及 `onebpSite` 新建计划提交流量摸排的三个 stale checkbox。
- `sycm.taobao.com` 不在当前 userscript/extension 的匹配范围内，本轮按“应无注入”完成真实页面验证；若后续要支持生意参谋，需要新增 `@match`/manifest matches 和对应业务逻辑。
- `onebpSite` 摸排已有 `addList.md` 证据支撑，完成口径限定为当前账号、当前页面可见入口与可达分支，不扩展到其它 `bizCode` 或不可见计划类型。

## 验证记录
- `node scripts/build.mjs`：通过，生成 v7.02 根脚本、packages 与 `dist/extension/`。
- `node scripts/build.mjs --check`：通过。
- 子代理只读核查：`tasks/todo.md` 原剩余 8 个 `[ ]`，其中 `sycm` 5 项是真未执行，`onebpSite` 3 项为已执行后未同步 checkbox。
- 子代理只读核查：`addList.md` 的 `onebpSite` 章节已有 13 条样本、最终提交接口、可见分支覆盖、未覆盖声明和“不真实提交”的 Offline 抓取说明。
- `chrome-devtools` MCP（2026-05-05）：打开真实 `https://sycm.taobao.com/portal/home.htm`，页面标题为 `生意参谋 - 零售电商大数据产品平台`，店铺为 `美的洗碗机旗舰店`。
- `chrome-devtools` MCP（2026-05-05）：`sycm.taobao.com` 页面 DOM 检查 `matchingUiSelectors=[]`、`amPrefixedNodeCount=0`；`window.__AM_GET_SCRIPT_VERSION__`、`window.__AM_HOOK_MANAGER__`、`window.__ALIMAMA_OPTIMIZER_TOGGLE__` 均为 `undefined`；无 `chrome-extension://` 助手资源加载。
- `chrome-devtools` MCP（2026-05-05）：`sycm.taobao.com` 页面控制台没有 `[AM]`、`[AM][Interceptor]` 或 `[AM-WXT]` 助手日志；页面自身存在一个生意参谋接口安全提示 iframe，不是本扩展注入导致。
- `chrome-devtools` MCP（2026-05-05）：打开真实 `https://one.alimama.com/index.html#!/main/index?bizCode=onebpSite`，页面标题为 `计划创建_万相台无界版`，当前 `bizCode=onebpSite`。
- `chrome-devtools` MCP（2026-05-05）：`one.alimama.com` 页面助手运行态正常，DOM 中存在 `#am-helper-icon`、`#am-helper-panel`、`#am-report-capture-panel`，控制台输出 `[AM] 🚀 阿里助手 Pro v7.02 已启动`，网络加载 `chrome-extension://.../page.bundle.js`。
- `chrome-devtools` MCP（2026-05-05）：本轮只打开和检查页面，未点击 `创建完成`；浏览器资源记录中未出现 `/solution/addList.json` 请求。

## 结果复盘
- `sycm.taobao.com` 任务原文是“验证能否正常加载”，实际结论是“当前仓库扩展按设计不会加载到 sycm 域”；因此本轮把它收口为明确的范围限制，而不是误判为运行异常。
- `onebpSite` 摸排任务的执行内容已经在旧记录和 `addList.md` 中完成，遗漏的是 checkbox 状态同步；本轮补齐完成状态并明确完成边界，避免把它误扩展成所有阿里妈妈 `bizCode` 的全量摸排。
- 本轮没有修改业务源码，只更新任务状态和验证记录。

---

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
- [x] 回顾仓库说明、历史教训与当前插件加载方式。
- [x] 构建最新扩展产物，确保浏览器加载的是当前代码。
- [x] 打开真实 `sycm.taobao.com` 页面并确认页面完成刷新。
- [x] 检查插件注入痕迹、控制台日志与关键页面交互。
- [x] 在本文档回填测试结果、结论与后续动作。

## 改动摘要
- 已确认当前 userscript/extension 只匹配 `alimama.com` 与 `one.alimama.com`，不匹配 `sycm.taobao.com` 或 `*.taobao.com`。
- 因此 `sycm.taobao.com` 的正确浏览器验收不是“出现助手面板”，而是确认页面可打开且没有当前仓库助手注入痕迹。
- 本轮未修改业务逻辑；仅完成真实页面验证与文档回填。

## 验证记录
- `node scripts/build.mjs`：通过，生成 v7.02 `dist/extension/`。
- `node scripts/build.mjs --check`：通过。
- `chrome-devtools` MCP（2026-05-05）：打开真实 `https://sycm.taobao.com/portal/home.htm`，页面标题为 `生意参谋 - 零售电商大数据产品平台`，店铺为 `美的洗碗机旗舰店`。
- `chrome-devtools` MCP（2026-05-05）：DOM 检查 `#am-helper-pro-extension-page-bundle`、`#am-helper-icon`、`#am-helper-panel`、`#am-report-capture-panel`、`#am-wxt-keyword-overlay`、`#am-license-lock-overlay`、`#alimama-escort-helper-ui`、`#am-magic-report-popup` 均不存在。
- `chrome-devtools` MCP（2026-05-05）：全局检查 `window.__AM_GET_SCRIPT_VERSION__`、`window.__AM_HOOK_MANAGER__`、`window.__ALIMAMA_OPTIMIZER_TOGGLE__`、`window.__ALIMAMA_OPTIMIZER_RUN_CAMPAIGN__` 均为 `undefined`。
- `chrome-devtools` MCP（2026-05-05）：资源检查没有 `chrome-extension://` 助手资源，也没有 `page.bundle.js` / `content.js` 注入记录。
- `chrome-devtools` MCP（2026-05-05）：控制台没有 `[AM]`、`[AM][Interceptor]`、`[AM-WXT]` 助手日志；页面自身存在 `portal/live/new/index/trend/v3.json` 安全提示 iframe，属于生意参谋接口响应，不是本扩展注入。

## 结果复盘
- 结论：当前仓库插件不会加载到 `sycm.taobao.com`，这与源码和 manifest 匹配规则一致，不是浏览器加载失败。
- 若后续要让该插件支持生意参谋，需要单独新增匹配域、权限和业务入口，并重新做安全/页面兼容验证。

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
- [x] 梳理新建计划入口，记录每个计划类型的显示前提与全部可选分支。
- [x] 对每个可进入的计划类型、每个可选分支分别模拟填写到最后一步，逐次抓取提交前相关网络参数。
- [x] 整理参数差异、公共字段、阻塞点与建议，回填本文档结果复盘。

## 改动摘要
- 已根据用户补充，把范围从“计划抽样”收紧为“每个计划 × 每个分支都要各自模拟提交并记录”。
- 记录载体已切换为仓库根目录 `addList.md`，后续提交流量参数与分支差异统一沉淀到该文件，`tasks/todo.md` 只保留任务管理与复盘。
- 2026-05-05 收口确认：上述完成状态限定为 `onebpSite` 当前账号、当前已添加商品、页面可见入口与可达结构性分支；其它 `bizCode` 或页面未展示计划类型不纳入本 TODO 完成口径。

## 验证记录
- `onebpSite` 全站推广页面已完成真实页面离线抓取，抓取方式为 `chrome-devtools` MCP + 页面内 `window.__AM_HOOK_MANAGER__`。
- 本轮新增覆盖分支：
  - `起量时间地域设置 = 8点~13点`
  - `起量地域 = 部分地域（取消上海）`
  - `设置计划组 = 归属到已有计划组（小白鲸）`
  - `设置计划组 = 不归属任何计划组`
  - `设置计划组 = 新建计划组并归属`
- 全部新增记录已集中写入仓库根目录 `addList.md`，未再散落到其它文档。
- `addList.md` 只读复核（2026-05-05）：`onebpSite` 章节明确仅覆盖 2026-04-27 抓取的全站推广页面，含 13 条样本、最终提交接口、可见控件分支盘点、未覆盖声明和 Offline 不真实创建计划说明。
- `chrome-devtools` MCP（2026-05-05）：重新打开真实 `https://one.alimama.com/index.html#!/main/index?bizCode=onebpSite`，页面标题为 `计划创建_万相台无界版`，助手 v7.02 已启动，DOM 中存在 `#am-helper-icon`、`#am-helper-panel`、`#am-report-capture-panel`。
- `chrome-devtools` MCP（2026-05-05）：本轮只做页面运行态复核，未点击 `创建完成`；资源记录中没有 `/solution/addList.json` 请求。

## 结果复盘
- 当前 `onebpSite` 全站推广页面可见的结构性分支已补齐，后续开发可以直接对照 `addList.md` 里的 13 条样本做组包。
- `起量时间地域设置` 最终都落在 `quickLiftBudgetCommand`：
  - 时间段字段是 `quickLiftTimeSlot`
  - 地域字段是 `quickLiftLaunchArea`
- `设置计划组` 有一条关键异常：
  - 选择“不归属任何计划组”后，`campaignGroupId` 会变成 `null`
  - 但 `campaignGroupName` 仍残留上一条已有组名称 `小白鲸`
  - 这意味着后续开发不能只看 `campaignGroupName` 判断是否真的归属了计划组。
- 2026-05-05 收口复盘：原三项未勾选是文档状态滞后，不是实际摸排缺口；为避免误解，已把完成边界写清楚，不把 `onebpSite` 结论外推到其它计划类型或 `bizCode`。

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

## TODO - 2026-05-10 修复 AI 点睛「展开详情」按钮不触发问题

### 需求规格
- 目标：
  - 保证 `关键词计划` 场景中 `AI点睛设置` 的 `展开详情` 按钮可正常切换详情区。
  - 切换时按钮文案稳定在 `展开详情` / `收起详情`。
  - 无需改动原生提交链路，不能触发真实创建/投放入口。

### 执行计划（可核对）
- [x] 回看 AI 点睛面板模板与事件绑定路径。
- [x] 修复展开/收起交互事件失效问题。
- [x] 重建 userscript 与 extension 产物。
- [x] 用 Chrome DevTools MCP 进行浏览器状态复验（当前会话脚本加载状态需确认）。

### 改动摘要
- 在 `render-scene-dynamic-grid.js` 增加 `syncAiMaxDetailButtonLabel()`，按详情区 `hidden` 状态更新按钮文案。
- 将详情按钮交互改为文档级一次性委托监听，避免仅依赖 `wizardState.els.sceneDynamic` 容器。
- 保留每次渲染后批量同步 `data-ai-max-detail-toggle` 按钮的初始文案。
- 重新构建并同步产物到 `阿里妈妈多合一助手.js`、`dist/*`。

### 验证记录
- `node scripts/build.mjs`：通过。
- 真实页面验证：
  - 本次浏览器会话内未检测到该功能原始 AI 面板挂载；
  - 已补齐绑定逻辑并构建产物，同页面内注入测试面板后可验证点击切换文本与 `hidden` 状态生效（当前作为逻辑复现）。

## TODO - 2026-05-10 AI 点睛完全同构原生可见结构

### 需求规格
- 目标：
  - 对齐原生 `AI点睛` 开关行：帮助图标、说明文案、`介绍文档` 入口。
  - 对齐开启态 `AI点睛设置` 的原生下沉区视觉层级、状态行和 `展开详情` 交互。
  - 对齐开启 AI 点睛后的智能出价提示完整文案。
  - 保持现有 `campaign.aiMaxSwitch` / `campaign.aiMaxInfo` 提交映射不变，不触发真实创建/投放入口。

### 执行计划（可核对）
- [x] 用 Chrome DevTools MCP 读取原生页可见文案、链接和 DOM 层级。
- [x] 补插件 `AI点睛` 专用开关行，加入原生说明、帮助图标和介绍文档链接。
- [x] 将 AI 点睛面板样式改为更接近原生的白底下沉区、状态行和右侧展开入口。
- [x] 补回归断言锁定原生说明、介绍文档链接和完整智能出价提示。
- [x] 构建、专项测试、语法检查和 Chrome DevTools MCP 真实页面复验。
- [x] 补齐红框差异：`已选：N个需求` 右侧入口和需求卡片点击切换预览。

### 原生对照记录
- 原生 `AI点睛` 行显示：`AI点睛` + 帮助图标 + `开/关` + `借助AI点睛开“搜索外挂”，智能识别您表达的搜索流量诉求，精准触达目标客群，有效提升精准流量比例` + `介绍文档`。
- `介绍文档` 链接为 `https://alidocs.dingtalk.com/i/nodes/N7dx2rn0JbxOaqnACQ5kRDGvWMGjLRb3`。
- 开启态显示下沉区：`深度解析主要销量商品的标题和历史成交数据，为你生成以下投放内容`、`表达更多流量诉求`、`已完成深度搜索`、`展开详情`。
- 智能出价提示完整文案为：`开启‘AI点睛’后仅支持智能出价。如需使用手动出价，可关闭该功能。`

### 改动摘要
- 新增 `AI点睛` 专用开关行，对齐原生帮助图标、说明文案和 `介绍文档` 链接。
- 将 AI 点睛面板调整为原生式白底下沉区，状态行和展开按钮保持同态。
- 智能出价提示改为原生完整文案。
- 弹窗摘要更新增加当前动态区域兜底，避免重渲染后写到旧行。
- 2026-05-10 继续补齐：`已选：N个需求` 从面板头部移到核心诉求行右侧，并准备支持点击需求卡片切换当前预览。
- 2026-05-10 红框补齐：`已选：N个需求` 已移到核心诉求行右侧，点击打开同一个 `AI点睛设置` 弹窗；需求卡片点击会切换 active 状态，并用原生 `nativeCrowdList` 中对应需求的解析、搜索词和人群画像刷新下方详情。

### 验证记录
- `node scripts/build.mjs`：通过。
- `node --test tests/keyword-custom-native-parity-ui.test.mjs tests/keyword-custom-popup-config.test.mjs`：通过，37/37。
- `node --check "阿里妈妈多合一助手.js"`：通过。
- `node scripts/build.mjs --check`：通过。
- Chrome DevTools MCP：真实插件页刷新后打开 API 向导编辑页，确认 `AI点睛` 行显示帮助图标、原生说明、`介绍文档` 链接；开启态显示 `AI点睛设置`、`已完成深度搜索`、`展开详情` 和完整智能出价提示。
- Chrome DevTools MCP：点击 `展开详情` 后详情区显示热门搜索词和搜索人群画像；关闭 `AI点睛` 后设置区消失、手动出价恢复；重新开启后设置区和原生说明恢复。
- `node --test tests/keyword-custom-native-parity-ui.test.mjs tests/keyword-custom-popup-config.test.mjs`：通过，37/37。
- Chrome DevTools MCP：真实插件页刷新后，`AI点睛设置` 中显示右侧 `已选：5个需求`；点击该入口打开 `AI点睛设置` 弹窗，弹窗内有 5 个需求、全选和屏蔽词设置。
- Chrome DevTools MCP：点击第二个需求卡片后，active 需求从 `小型家用洗碗机的精致生活选择` 切换为 `洗碗机耗材一次买齐省心省力`，`AI解析`、热门搜索词和人群画像均随原生逐需求数据变化。
- `node --check "阿里妈妈多合一助手.js"`：通过。
- `node scripts/build.mjs --check`：通过。

### 用户修正 - AI点睛需求选择与切换缺失
- 触发：用户截图红框指出插件缺少原生右侧 `已选：5个需求`，且需求卡片不能点击切换。
- 修正规格：
  - `已选：N个需求` 入口应显示在核心诉求行右侧，点击仍打开 `表达更多流量诉求` 同一设置弹窗。
  - 需求卡片必须可点击切换 active 状态。
  - 切换需求时，下面的 `AI解析`、`热门搜索词`、`搜索人群画像与特征` 应优先使用原生 `nativeCrowdList` 中对应需求的数据。
  - 如果原生接口未返回逐需求数据，只允许保持聚合数据展示，不允许本地伪造内容。
