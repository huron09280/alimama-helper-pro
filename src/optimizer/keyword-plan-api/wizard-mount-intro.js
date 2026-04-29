        const mountWizard = () => {
            if (wizardState.mounted) return;
            ensureWizardStyle();

            const overlay = document.createElement('div');
            overlay.id = 'am-wxt-keyword-overlay';
            overlay.innerHTML = `
                <div id="am-wxt-keyword-detail-backdrop"></div>
                <div id="am-wxt-keyword-modal" role="dialog" aria-modal="true">
                    <div class="am-wxt-header">
                        <span>关键词推广批量建计划 API 向导</span>
                        <button class="am-wxt-close" id="am-wxt-keyword-close" title="关闭">✕</button>
                    </div>
                    <div class="am-wxt-workbench-tabs" id="am-wxt-workbench-tabs">
                        <button type="button" class="am-wxt-btn primary" data-workbench-page="home">首页</button>
                        <button type="button" class="am-wxt-btn" data-workbench-page="editor">编辑页</button>
                        <button type="button" class="am-wxt-btn" data-workbench-page="matrix">矩阵页</button>
                        <button type="button" class="am-wxt-btn" data-workbench-page="previewlog">日志页</button>
                    </div>
                    <div class="am-wxt-body">
                        <div class="am-wxt-split" id="am-wxt-keyword-item-split" data-workbench-page-panel="home">
                            <div class="am-wxt-panel am-wxt-panel-candidate">
                                <div class="am-wxt-toolbar">
                                    <input id="am-wxt-keyword-search-input" placeholder="输入商品关键词或商品ID（逗号分隔）" />
                                    <button class="am-wxt-btn" id="am-wxt-keyword-search">搜索</button>
                                    <button class="am-wxt-btn" id="am-wxt-keyword-hot">热销最近</button>
                                    <button class="am-wxt-btn" id="am-wxt-keyword-all">全部商品</button>
                                    <button class="am-wxt-btn" id="am-wxt-keyword-add-all">全部添加</button>
                                </div>
                                <div class="am-wxt-list" id="am-wxt-keyword-candidate-list"></div>
                            </div>
                            <div class="am-wxt-panel">
                                <div class="am-wxt-toolbar">
                                    <span>已添加商品 <b id="am-wxt-keyword-added-count">0</b> / ${WIZARD_MAX_ITEMS}</span>
                                    <button class="am-wxt-btn" id="am-wxt-keyword-toggle-candidate">添加商品</button>
                                    <button class="am-wxt-btn am-wxt-toggle-candidate-list-btn hidden" id="am-wxt-keyword-toggle-candidate-list">展开更多</button>
                                    <button class="am-wxt-btn" id="am-wxt-keyword-clear-added">清空</button>
                                </div>
                                <div class="am-wxt-list" id="am-wxt-keyword-added-list"></div>
                            </div>
                        </div>

                        <div class="am-wxt-strategy-board" data-workbench-page-panel="home">
                            <div class="am-wxt-strategy-head">
                                <div class="am-wxt-strategy-head-main">
                                    <button class="am-wxt-btn" id="am-wxt-keyword-add-strategy">新建计划</button>
                                    <span>已选 <b id="am-wxt-keyword-strategy-count">0</b> 个</span>
                                </div>
                                <div class="am-wxt-strategy-head-tools">
                                    <label class="am-wxt-inline-check am-wxt-strategy-select-all">
                                        <input type="checkbox" id="am-wxt-keyword-strategy-select-all" />
                                        <span>全选</span>
                                    </label>
                                    <input
                                        id="am-wxt-keyword-strategy-search"
                                        class="am-wxt-strategy-search-input"
                                        placeholder="搜索计划名称"
                                    />
                                </div>
                                <div class="am-wxt-strategy-head-actions">
                                    <button class="am-wxt-btn" id="am-wxt-keyword-batch-edit-strategy">批量编辑</button>
                                    <button class="am-wxt-btn" id="am-wxt-keyword-clear-strategy">清空</button>
                                </div>
                            </div>
                            <div class="am-wxt-strategy-list" id="am-wxt-keyword-strategy-list"></div>
                            <div class="am-wxt-actions">
                                <div class="am-wxt-run-mode-wrap" id="am-wxt-keyword-run-mode-wrap">
                                    <button class="am-wxt-btn primary" id="am-wxt-keyword-run-quick">立即投放</button>
                                    <button
                                        type="button"
                                        class="am-wxt-btn am-wxt-run-mode-toggle"
                                        id="am-wxt-keyword-run-mode-toggle"
                                        title="提交方式"
                                        aria-label="提交方式"
                                        aria-haspopup="menu"
                                        aria-expanded="false"
                                        data-open="0"
                                    ></button>
                                    <div class="am-wxt-run-mode-menu hidden" id="am-wxt-keyword-run-mode-menu" role="menu">
                                        <button type="button" class="am-wxt-run-mode-item" data-submit-mode="parallel" role="menuitem">
                                            <span class="am-wxt-run-mode-label">并发数</span>
                                            <span class="am-wxt-run-mode-count" data-action="run-mode-count-badge" title="点击增加，右键减少，滚轮可调节">
                                                <span class="am-wxt-run-mode-count-icon">×</span>
                                                <span class="am-wxt-run-mode-count-num" data-submit-mode-count="parallel">${Math.max(1, toNumber(DEFAULT_SCENE_PARALLEL_SUBMIT_TIMES, 1))}</span>
                                            </span>
                                        </button>
                                        <button type="button" class="am-wxt-run-mode-item" data-submit-mode="serial" role="menuitem">
                                            <span class="am-wxt-run-mode-label">单条</span>
                                        </button>
                                    </div>
                                </div>
                                <button class="am-wxt-btn" id="am-wxt-keyword-preview-quick">生成其他策略</button>
                            </div>
                            <div id="am-wxt-keyword-quick-log"></div>
                        </div>

                        <div class="am-wxt-config collapsed" id="am-wxt-keyword-detail-config" data-workbench-page-panel="editor">
                            <div class="am-wxt-detail-title">
                                <span id="am-wxt-keyword-detail-title">同步计划</span>
                                <div class="am-wxt-detail-title-right">
                                    <button class="am-wxt-close" id="am-wxt-keyword-detail-close" title="关闭">✕</button>
                                </div>
                            </div>
                            <div id="am-wxt-keyword-static-settings" class="am-wxt-static-settings">
                                <div class="am-wxt-config-grid">
                                    <div class="am-wxt-setting-row">
                                        <div class="am-wxt-setting-label">场景选择</div>
                                        <div class="am-wxt-setting-control">
                                            <div class="am-wxt-option-line" data-bind-select="am-wxt-keyword-scene-select"></div>
                                            <select id="am-wxt-keyword-scene-select" class="am-wxt-hidden-control">
                                                <option value="货品全站推广">货品全站推广</option>
                                                <option value="关键词推广">关键词推广</option>
                                                <option value="人群推广">人群推广</option>
                                                <option value="店铺直达">店铺直达</option>
                                                <option value="内容营销">内容营销</option>
                                                <option value="线索推广">线索推广</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div class="am-wxt-setting-row">
                                        <div class="am-wxt-setting-label">出价方式</div>
                                        <div class="am-wxt-setting-control">
                                            <div class="am-wxt-option-line" data-bind-select="am-wxt-keyword-bid-mode"></div>
                                            <select id="am-wxt-keyword-bid-mode" class="am-wxt-hidden-control">
                                                <option value="smart">智能出价</option>
                                                <option value="manual">手动出价</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div class="am-wxt-setting-row" id="am-wxt-keyword-bid-target-row">
                                        <div class="am-wxt-setting-label">出价目标</div>
                                        <div class="am-wxt-setting-control">
                                            <div class="am-wxt-option-line" data-bind-select="am-wxt-keyword-bid-target"></div>
                                            <select id="am-wxt-keyword-bid-target" class="am-wxt-hidden-control">
                                                <option value="conv">获取成交量</option>
                                                <option value="similar_item">相似品跟投</option>
                                                <option value="search_rank">抢占搜索卡位</option>
                                                <option value="market_penetration">提升市场渗透</option>
                                                <option value="fav_cart">增加收藏加购量</option>
                                                <option value="click">增加点击量</option>
                                                <option value="roi">稳定投产比</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div class="am-wxt-setting-row">
                                        <div class="am-wxt-setting-label">预算类型</div>
                                        <div class="am-wxt-setting-control">
                                            <div class="am-wxt-option-line" data-bind-select="am-wxt-keyword-budget-type"></div>
                                            <select id="am-wxt-keyword-budget-type" class="am-wxt-hidden-control">
                                                <option value="day_budget">每日预算</option>
                                                <option value="day_average">日均预算</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div class="am-wxt-setting-row">
                                        <div class="am-wxt-setting-label">关键词模式</div>
                                        <div class="am-wxt-setting-control">
                                            <div class="am-wxt-option-line" data-bind-select="am-wxt-keyword-mode"></div>
                                            <select id="am-wxt-keyword-mode" class="am-wxt-hidden-control">
                                                <option value="mixed">混合（手动优先 + 推荐补齐）</option>
                                                <option value="manual">仅手动</option>
                                                <option value="recommend">仅推荐</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div class="am-wxt-setting-row">
                                        <div class="am-wxt-setting-label">计划名前缀</div>
                                        <div class="am-wxt-setting-control">
                                            <input id="am-wxt-keyword-prefix" placeholder="例如：关键词推广_家电" />
                                        </div>
                                    </div>
                                    <div class="am-wxt-setting-row">
                                        <div class="am-wxt-setting-label">日均预算</div>
                                        <div class="am-wxt-setting-control">
                                            <input id="am-wxt-keyword-budget" placeholder="留空则用页面默认" />
                                        </div>
                                    </div>
                                    <div class="am-wxt-setting-row">
                                        <div class="am-wxt-setting-label">默认关键词出价</div>
                                        <div class="am-wxt-setting-control">
                                            <input id="am-wxt-keyword-bid" placeholder="默认 1.00" />
                                        </div>
                                    </div>
                                    <div class="am-wxt-setting-row">
                                        <div class="am-wxt-setting-label">推荐词目标数</div>
                                        <div class="am-wxt-setting-control">
                                            <input id="am-wxt-keyword-recommend-count" placeholder="默认 20" />
                                        </div>
                                    </div>
                                </div>
                                <div class="am-wxt-setting-row">
                                    <div class="am-wxt-setting-label">平均直接成交成本</div>
                                    <div class="am-wxt-setting-control am-wxt-setting-control-inline">
                                        <label class="am-wxt-inline-check">
                                            <input type="checkbox" id="am-wxt-keyword-single-cost-enable" />
                                            <span>启用（非必要）</span>
                                        </label>
                                        <input id="am-wxt-keyword-single-cost" placeholder="成本上限" style="width:140px;" />
                                    </div>
                                </div>
                                <div class="am-wxt-setting-row">
                                    <div class="am-wxt-setting-label">手动关键词</div>
                                    <div class="am-wxt-setting-control">
                                        <textarea id="am-wxt-keyword-manual" placeholder="手动关键词，每行一个，支持：关键词,出价,匹配方式（广泛/精准）"></textarea>
                                    </div>
                                </div>
                            </div>
                            <div id="am-wxt-keyword-scene-dynamic" class="am-wxt-scene-dynamic"></div>
                            <div class="am-wxt-actions">
                                <button class="am-wxt-btn" id="am-wxt-keyword-load-recommend">加载推荐关键词</button>
                                <button class="am-wxt-btn" id="am-wxt-keyword-load-crowd">加载推荐人群</button>
                                <button class="am-wxt-btn" id="am-wxt-keyword-preview-btn">预览请求</button>
                                <button class="am-wxt-btn primary" id="am-wxt-keyword-run-btn">批量创建</button>
                                <button class="am-wxt-btn" data-am-wxt-debug-toggle="1">打开日志</button>
                                <button class="am-wxt-btn" id="am-wxt-keyword-clear-draft">清空会话草稿</button>
                            </div>
                            <div class="am-wxt-crowd-box">
                                <div class="am-wxt-crowd-title">
                                    <span>计划人群 <b id="am-wxt-keyword-crowd-count">0</b></span>
                                    <button class="am-wxt-btn" id="am-wxt-keyword-clear-crowd">清空人群</button>
                                </div>
                                <div class="am-wxt-crowd-list" id="am-wxt-keyword-crowd-list"></div>
                            </div>
                            <div id="am-wxt-keyword-debug-wrap" class="collapsed">
                                <pre id="am-wxt-keyword-preview"></pre>
                                <div id="am-wxt-keyword-log"></div>
                            </div>
                            <div class="am-wxt-detail-footer">
                                <button class="am-wxt-btn primary" id="am-wxt-keyword-back-simple">保存并关闭</button>
                            </div>
                        </div>
                        <div class="am-wxt-config collapsed" id="am-wxt-keyword-matrix-config" data-workbench-page-panel="matrix">
                            <div class="am-wxt-detail-title">
                                <span>矩阵计划配置</span>
                            </div>
                            <div class="am-wxt-matrix-workspace">
                                <div class="am-wxt-matrix-sidebar">
                                    <div class="am-wxt-matrix-card am-wxt-matrix-primary-card">
                                        <div class="am-wxt-crowd-title">
                                            <span>基础参数</span>
                                            <span id="am-wxt-matrix-summary">矩阵：关闭 ｜ 组合 0 ｜ 批次 0</span>
                                        </div>
                                        <div class="am-wxt-config-grid am-wxt-matrix-settings-grid">
                                            <div class="am-wxt-setting-row" data-matrix-setting-span="2">
                                                <div class="am-wxt-setting-label">启用矩阵</div>
                                                <div class="am-wxt-setting-control">
                                                    <label class="am-wxt-inline-check">
                                                        <input type="checkbox" id="am-wxt-matrix-enabled" />
                                                        <span>按组合展开计划</span>
                                                    </label>
                                                </div>
                                            </div>
                                            <div class="am-wxt-setting-row">
                                                <div class="am-wxt-setting-label">组合上限</div>
                                                <div class="am-wxt-setting-control">
                                                    <input id="am-wxt-matrix-max" type="number" min="1" max="200" />
                                                </div>
                                            </div>
                                            <div class="am-wxt-setting-row">
                                                <div class="am-wxt-setting-label">批次大小</div>
                                                <div class="am-wxt-setting-control">
                                                    <input id="am-wxt-matrix-batch" type="number" min="1" max="50" />
                                                </div>
                                            </div>
                                            <div class="am-wxt-setting-row" data-matrix-setting-span="2">
                                                <div class="am-wxt-setting-label">命名模板</div>
                                                <div class="am-wxt-setting-control">
                                                    <input id="am-wxt-matrix-name-pattern" placeholder="{planName}_{index}" />
                                                </div>
                                            </div>
                                        </div>
                                        <div class="am-wxt-matrix-intro" id="am-wxt-matrix-intro">推荐优先配置预算、出价、前缀、商品这 5 类维度。</div>
                                        <div class="am-wxt-matrix-subsection">
                                            <div class="am-wxt-matrix-subtitle">工作台状态</div>
                                            <div class="am-wxt-matrix-summary-grid">
                                                <div class="am-wxt-matrix-stat">
                                                    <span class="am-wxt-matrix-stat-label">状态</span>
                                                    <strong class="am-wxt-matrix-stat-value" id="am-wxt-matrix-stat-enabled">关闭</strong>
                                                </div>
                                                <div class="am-wxt-matrix-stat">
                                                    <span class="am-wxt-matrix-stat-label">已配置维度</span>
                                                    <strong class="am-wxt-matrix-stat-value" id="am-wxt-matrix-stat-dimensions">0</strong>
                                                </div>
                                                <div class="am-wxt-matrix-stat">
                                                    <span class="am-wxt-matrix-stat-label">组合数</span>
                                                    <strong class="am-wxt-matrix-stat-value" id="am-wxt-matrix-stat-combinations">0</strong>
                                                </div>
                                                <div class="am-wxt-matrix-stat">
                                                    <span class="am-wxt-matrix-stat-label">批次数</span>
                                                    <strong class="am-wxt-matrix-stat-value" id="am-wxt-matrix-stat-batches">0</strong>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="am-wxt-matrix-card">
                                        <div class="am-wxt-crowd-title">
                                            <span>快捷预设</span>
                                        </div>
                                        <div class="am-wxt-matrix-action-grid">
                                            <button type="button" class="am-wxt-btn primary" id="am-wxt-matrix-apply-recommended">补齐5维</button>
                                            <button type="button" class="am-wxt-btn primary" id="am-wxt-matrix-generate-plans">生成计划</button>
                                            <button type="button" class="am-wxt-btn" id="am-wxt-matrix-clear-dimensions">清空</button>
                                        </div>
                                        <div class="am-wxt-matrix-action-note" id="am-wxt-matrix-action-note">推荐 5 维可直接补齐。</div>
                                        <div class="am-wxt-matrix-preset-grid" id="am-wxt-matrix-preset-list"></div>
                                    </div>
                                </div>
                                <div class="am-wxt-matrix-main">
                                    <div class="am-wxt-matrix-card am-wxt-matrix-scene-card">
                                        <div class="am-wxt-scene-setting-row">
                                            <div class="am-wxt-scene-setting-label">场景选择</div>
                                            <div class="am-wxt-setting-control">
                                                <div class="am-wxt-option-line segmented" data-bind-select="am-wxt-keyword-scene-select"></div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="am-wxt-crowd-box am-wxt-matrix-dimension-box">
                                        <div class="am-wxt-crowd-title">
                                            <span>维度卡片</span>
                                        </div>
                                        <div class="am-wxt-crowd-list am-wxt-matrix-dimension-list" id="am-wxt-matrix-dimension-list"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="am-wxt-config collapsed" id="am-wxt-keyword-previewlog-panel" data-workbench-page-panel="previewlog">
                            <div class="am-wxt-detail-title">
                                <span>预览与执行日志</span>
                            </div>
                            <div class="am-wxt-crowd-box">
                                <div class="am-wxt-crowd-title"><span>场景摘要</span><span id="am-wxt-preview-scene-summary">-</span></div>
                                <div class="am-wxt-crowd-title"><span>组合摘要</span><span id="am-wxt-preview-combo-summary">未启用</span></div>
                                <div class="am-wxt-crowd-title"><span>批次摘要</span><span id="am-wxt-preview-batch-summary">0 批 / 每批 ${MATRIX_LIMITS.batchSize}</span></div>
                            </div>
                            <div id="am-wxt-workbench-preview-log"></div>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);

            wizardState.els = {
                overlay,
                closeBtn: overlay.querySelector('#am-wxt-keyword-close'),
                detailBackdrop: overlay.querySelector('#am-wxt-keyword-detail-backdrop'),
                workbenchTabs: Array.from(overlay.querySelectorAll('[data-workbench-page]')),
                searchInput: overlay.querySelector('#am-wxt-keyword-search-input'),
                searchBtn: overlay.querySelector('#am-wxt-keyword-search'),
                hotBtn: overlay.querySelector('#am-wxt-keyword-hot'),
                allBtn: overlay.querySelector('#am-wxt-keyword-all'),
                addAllBtn: overlay.querySelector('#am-wxt-keyword-add-all'),
                itemSplit: overlay.querySelector('#am-wxt-keyword-item-split'),
                strategyBoard: overlay.querySelector('.am-wxt-strategy-board'),
                candidateList: overlay.querySelector('#am-wxt-keyword-candidate-list'),
                addedList: overlay.querySelector('#am-wxt-keyword-added-list'),
                addedCount: overlay.querySelector('#am-wxt-keyword-added-count'),
                toggleCandidateBtn: overlay.querySelector('#am-wxt-keyword-toggle-candidate'),
                toggleCandidateListBtn: overlay.querySelector('#am-wxt-keyword-toggle-candidate-list'),
                clearAddedBtn: overlay.querySelector('#am-wxt-keyword-clear-added'),
                strategyList: overlay.querySelector('#am-wxt-keyword-strategy-list'),
                strategyCount: overlay.querySelector('#am-wxt-keyword-strategy-count'),
                addStrategyBtn: overlay.querySelector('#am-wxt-keyword-add-strategy'),
                strategySelectAllInput: overlay.querySelector('#am-wxt-keyword-strategy-select-all'),
                strategySearchInput: overlay.querySelector('#am-wxt-keyword-strategy-search'),
                batchEditStrategyBtn: overlay.querySelector('#am-wxt-keyword-batch-edit-strategy'),
                clearStrategyBtn: overlay.querySelector('#am-wxt-keyword-clear-strategy'),
                runModeWrap: overlay.querySelector('#am-wxt-keyword-run-mode-wrap'),
                runModeToggleBtn: overlay.querySelector('#am-wxt-keyword-run-mode-toggle'),
                runModeMenu: overlay.querySelector('#am-wxt-keyword-run-mode-menu'),
                runQuickBtn: overlay.querySelector('#am-wxt-keyword-run-quick'),
                previewQuickBtn: overlay.querySelector('#am-wxt-keyword-preview-quick'),
                quickLog: overlay.querySelector('#am-wxt-keyword-quick-log'),
                detailConfig: overlay.querySelector('#am-wxt-keyword-detail-config'),
                detailTitle: overlay.querySelector('#am-wxt-keyword-detail-title'),
                detailCloseBtn: overlay.querySelector('#am-wxt-keyword-detail-close'),
                backSimpleBtn: overlay.querySelector('#am-wxt-keyword-back-simple'),
                sceneSelect: overlay.querySelector('#am-wxt-keyword-scene-select'),
                bidModeSelect: overlay.querySelector('#am-wxt-keyword-bid-mode'),
                sceneDynamic: overlay.querySelector('#am-wxt-keyword-scene-dynamic'),
                bidTargetRow: overlay.querySelector('#am-wxt-keyword-bid-target-row'),
                bidTargetSelect: overlay.querySelector('#am-wxt-keyword-bid-target'),
                budgetTypeSelect: overlay.querySelector('#am-wxt-keyword-budget-type'),
                prefixInput: overlay.querySelector('#am-wxt-keyword-prefix'),
                budgetInput: overlay.querySelector('#am-wxt-keyword-budget'),
                bidInput: overlay.querySelector('#am-wxt-keyword-bid'),
                singleCostEnableInput: overlay.querySelector('#am-wxt-keyword-single-cost-enable'),
                singleCostInput: overlay.querySelector('#am-wxt-keyword-single-cost'),
                modeSelect: overlay.querySelector('#am-wxt-keyword-mode'),
                recommendCountInput: overlay.querySelector('#am-wxt-keyword-recommend-count'),
                manualInput: overlay.querySelector('#am-wxt-keyword-manual'),
                loadRecommendBtn: overlay.querySelector('#am-wxt-keyword-load-recommend'),
                loadCrowdBtn: overlay.querySelector('#am-wxt-keyword-load-crowd'),
                previewBtn: overlay.querySelector('#am-wxt-keyword-preview-btn'),
                runBtn: overlay.querySelector('#am-wxt-keyword-run-btn'),
                toggleDebugBtns: Array.from(overlay.querySelectorAll('[data-am-wxt-debug-toggle]')),
                clearDraftBtn: overlay.querySelector('#am-wxt-keyword-clear-draft'),
                crowdCount: overlay.querySelector('#am-wxt-keyword-crowd-count'),
                crowdList: overlay.querySelector('#am-wxt-keyword-crowd-list'),
                clearCrowdBtn: overlay.querySelector('#am-wxt-keyword-clear-crowd'),
                debugWrap: overlay.querySelector('#am-wxt-keyword-debug-wrap'),
                preview: overlay.querySelector('#am-wxt-keyword-preview'),
                log: overlay.querySelector('#am-wxt-keyword-log'),
                matrixPanel: overlay.querySelector('#am-wxt-keyword-matrix-config'),
                matrixEnabledInput: overlay.querySelector('#am-wxt-matrix-enabled'),
                matrixMaxInput: overlay.querySelector('#am-wxt-matrix-max'),
                matrixBatchInput: overlay.querySelector('#am-wxt-matrix-batch'),
                matrixNamePatternInput: overlay.querySelector('#am-wxt-matrix-name-pattern'),
                matrixIntro: overlay.querySelector('#am-wxt-matrix-intro'),
                matrixPresetList: overlay.querySelector('#am-wxt-matrix-preset-list'),
                matrixApplyRecommendedBtn: overlay.querySelector('#am-wxt-matrix-apply-recommended'),
                matrixGenerateBtn: overlay.querySelector('#am-wxt-matrix-generate-plans'),
                matrixClearBtn: overlay.querySelector('#am-wxt-matrix-clear-dimensions'),
                matrixActionNote: overlay.querySelector('#am-wxt-matrix-action-note'),
                matrixDimensionList: overlay.querySelector('#am-wxt-matrix-dimension-list'),
                matrixSummary: overlay.querySelector('#am-wxt-matrix-summary'),
                matrixStatusValue: overlay.querySelector('#am-wxt-matrix-stat-enabled'),
                matrixDimensionCountValue: overlay.querySelector('#am-wxt-matrix-stat-dimensions'),
                matrixCombinationCountValue: overlay.querySelector('#am-wxt-matrix-stat-combinations'),
                matrixBatchCountValue: overlay.querySelector('#am-wxt-matrix-stat-batches'),
                previewlogPanel: overlay.querySelector('#am-wxt-keyword-previewlog-panel'),
                previewSceneSummary: overlay.querySelector('#am-wxt-preview-scene-summary'),
                previewComboSummary: overlay.querySelector('#am-wxt-preview-combo-summary'),
                previewBatchSummary: overlay.querySelector('#am-wxt-preview-batch-summary'),
                workbenchPreviewLog: overlay.querySelector('#am-wxt-workbench-preview-log')
            };

            const ensureQuickLogContainer = () => {
                if (wizardState?.els?.quickLog instanceof HTMLElement) return wizardState.els.quickLog;
                const strategyBoard = wizardState?.els?.overlay?.querySelector('.am-wxt-strategy-board');
                if (!strategyBoard) return null;
                let quickLog = strategyBoard.querySelector('#am-wxt-keyword-quick-log');
                if (!quickLog) {
                    quickLog = document.createElement('div');
                    quickLog.id = 'am-wxt-keyword-quick-log';
                    strategyBoard.appendChild(quickLog);
                }
                if (wizardState?.els) wizardState.els.quickLog = quickLog;
                return quickLog;
            };

            const appendWizardLog = (text, type = 'info') => {
                const timestampText = `[${new Date().toLocaleTimeString('zh-CN', { hour12: false })}] ${text}`;
                const appendLine = (container, maxLines = 120) => {
                    if (!container) return;
                    const line = document.createElement('div');
                    line.className = `line ${type}`;
                    line.textContent = timestampText;
                    container.appendChild(line);
                    while (container.children.length > maxLines) {
                        container.removeChild(container.firstChild);
                    }
                    container.scrollTop = container.scrollHeight;
                };

                appendLine(ensureQuickLogContainer(), 40);
                appendLine(wizardState.els.log, 160);
                appendLine(wizardState.els.workbenchPreviewLog, 160);
            };
            const setWorkbenchPage = (page = 'home') => {
                const nextPage = WORKBENCH_PAGE_SET.has(String(page || '').trim()) ? String(page || '').trim() : 'home';
                wizardState.workbenchPage = nextPage;
                const toggleDisplay = (el, visible) => {
                    if (!(el instanceof HTMLElement)) return;
                    el.style.display = visible ? '' : 'none';
                };
                (Array.isArray(wizardState?.els?.workbenchTabs) ? wizardState.els.workbenchTabs : []).forEach((btn) => {
                    if (!(btn instanceof HTMLButtonElement)) return;
                    const active = btn.dataset.workbenchPage === nextPage;
                    btn.classList.toggle('primary', active);
                });
                toggleDisplay(wizardState.els.itemSplit, nextPage === 'home');
                toggleDisplay(wizardState.els.strategyBoard, nextPage === 'home');
                toggleDisplay(wizardState.els.detailConfig, nextPage === 'editor');
                toggleDisplay(wizardState.els.matrixPanel, nextPage === 'matrix');
                toggleDisplay(wizardState.els.previewlogPanel, nextPage === 'previewlog');
                if (wizardState.els.detailConfig instanceof HTMLElement) {
                    wizardState.els.detailConfig.classList.toggle('collapsed', !(nextPage === 'editor' && wizardState.detailVisible));
                }
                if (wizardState.els.matrixPanel instanceof HTMLElement) {
                    wizardState.els.matrixPanel.classList.toggle('collapsed', nextPage !== 'matrix');
                }
                if (wizardState.els.previewlogPanel instanceof HTMLElement) {
                    wizardState.els.previewlogPanel.classList.toggle('collapsed', nextPage !== 'previewlog');
                }
            };
            const syncMatrixConfigFromUI = () => {
                const draft = ensureWizardDraft();
                const currentSceneName = getMatrixSceneName(draft.sceneName || '');
                const nextMatrixConfig = normalizeMatrixConfig(draft.matrixConfig, currentSceneName);
                if (wizardState.els.matrixEnabledInput instanceof HTMLInputElement) {
                    nextMatrixConfig.enabled = currentSceneName
                        ? wizardState.els.matrixEnabledInput.checked
                        : false;
                }
                if (wizardState.els.matrixMaxInput instanceof HTMLInputElement) {
                    nextMatrixConfig.maxCombinations = Math.max(1, Math.min(200, toNumber(wizardState.els.matrixMaxInput.value, nextMatrixConfig.maxCombinations) || nextMatrixConfig.maxCombinations));
                }
                if (wizardState.els.matrixBatchInput instanceof HTMLInputElement) {
                    nextMatrixConfig.batchSize = Math.max(1, Math.min(50, toNumber(wizardState.els.matrixBatchInput.value, nextMatrixConfig.batchSize) || nextMatrixConfig.batchSize));
                }
                if (wizardState.els.matrixNamePatternInput instanceof HTMLInputElement) {
                    nextMatrixConfig.namingPattern = String(wizardState.els.matrixNamePatternInput.value || nextMatrixConfig.namingPattern || MATRIX_DEFAULT_NAMING_PATTERN).trim() || MATRIX_DEFAULT_NAMING_PATTERN;
                }
                if (wizardState.els.matrixDimensionList instanceof HTMLElement) {
                    nextMatrixConfig.dimensions = Array.from(
                        wizardState.els.matrixDimensionList.querySelectorAll('[data-matrix-dimension-row="1"]')
                    ).map((row) => {
                        const key = String(row.querySelector('[data-matrix-dimension-key="1"]')?.value || '').trim();
                        const preset = getMatrixDimensionPresetByKey(key, currentSceneName);
                        const label = String(
                            row.querySelector('[data-matrix-dimension-label="1"]')?.value
                            || preset?.label
                            || key
                            || ''
                        ).trim();
                        const values = readMatrixDimensionValuesFromRow(row, currentSceneName);
                        const enabled = row.querySelector('[data-matrix-dimension-enabled="1"]')?.checked !== false;
                        return normalizeMatrixDimension({
                            key,
                            label,
                            values,
                            enabled
                        }, currentSceneName);
                    }).filter(item => item?.key);
                }
                draft.matrixConfig = nextMatrixConfig;
            };
            const positionRunModeMenu = () => {
                if (!(wizardState.els.runModeMenu instanceof HTMLElement)) return;
                if (!(wizardState.els.runQuickBtn instanceof HTMLButtonElement)) return;
                if (!(wizardState.els.runModeToggleBtn instanceof HTMLButtonElement)) return;
                const menuRect = wizardState.els.runModeMenu.getBoundingClientRect();
                const runQuickRect = wizardState.els.runQuickBtn.getBoundingClientRect();
                const runModeToggleRect = wizardState.els.runModeToggleBtn.getBoundingClientRect();
                const viewportWidth = Math.max(window.innerWidth || 0, document.documentElement?.clientWidth || 0);
                const viewportHeight = Math.max(window.innerHeight || 0, document.documentElement?.clientHeight || 0);
                let left = Math.round(runModeToggleRect.left);
                let top = Math.round(runQuickRect.bottom);
                const maxLeft = Math.max(8, Math.round(viewportWidth - menuRect.width - 8));
                const maxTop = Math.max(8, Math.round(viewportHeight - menuRect.height - 8));
                left = Math.min(Math.max(8, left), maxLeft);
                top = Math.min(Math.max(8, top), maxTop);
                wizardState.els.runModeMenu.style.left = `${left}px`;
                wizardState.els.runModeMenu.style.top = `${top}px`;
            };
            const setRunModeMenuOpen = (open = false) => {
                const nextOpen = open === true;
                if (wizardState.els.runModeMenu instanceof HTMLElement) {
                    wizardState.els.runModeMenu.classList.toggle('hidden', !nextOpen);
                    if (nextOpen) {
                        requestAnimationFrame(() => {
                            positionRunModeMenu();
                        });
                    }
                }
                if (wizardState.els.runModeToggleBtn instanceof HTMLButtonElement) {
                    wizardState.els.runModeToggleBtn.dataset.open = nextOpen ? '1' : '0';
                    wizardState.els.runModeToggleBtn.setAttribute('aria-expanded', nextOpen ? 'true' : 'false');
                }
            };
            const resolveParallelSubmitHintCount = () => {
                const defaultCount = normalizeParallelSubmitTimes(
                    wizardState?.draft?.parallelSubmitTimes,
                    DEFAULT_SCENE_PARALLEL_SUBMIT_TIMES
                );
                return defaultCount;
            };
            const renderRunModeMenu = () => {
                const mode = normalizeSubmitMode(wizardState?.draft?.submitMode || 'serial');
                if (wizardState.els.runQuickBtn instanceof HTMLButtonElement) {
                    wizardState.els.runQuickBtn.title = `提交方式：${submitModeLabel(mode)}`;
                }
                if (wizardState.els.runModeToggleBtn instanceof HTMLButtonElement) {
                    wizardState.els.runModeToggleBtn.title = `提交方式：${submitModeLabel(mode)}`;
                }
                if (!(wizardState.els.runModeMenu instanceof HTMLElement)) return;
                const parallelCountNode = wizardState.els.runModeMenu.querySelector('[data-submit-mode-count="parallel"]');
                if (parallelCountNode) {
                    parallelCountNode.textContent = String(resolveParallelSubmitHintCount());
                }
                wizardState.els.runModeMenu.querySelectorAll('[data-submit-mode]').forEach(btn => {
                    const button = btn instanceof HTMLButtonElement ? btn : null;
                    if (!button) return;
                    const itemMode = normalizeSubmitMode(button.getAttribute('data-submit-mode') || '');
                    button.classList.toggle('active', itemMode === mode);
                });
            };
            const setSubmitModeFromUI = (mode = 'serial', options = {}) => {
                const nextMode = normalizeSubmitMode(mode);
                const draft = ensureWizardDraft();
                const prevMode = normalizeSubmitMode(draft.submitMode || 'serial');
                draft.submitMode = nextMode;
                renderRunModeMenu();
                commitDraftState(options.syncDraft !== false ? null : draft);
                if (options.silent !== true && prevMode !== nextMode) {
                    appendWizardLog(`提交方式已切换为「${submitModeLabel(nextMode)}」`, 'success');
                }
            };
            const setParallelSubmitTimesFromUI = (next = DEFAULT_SCENE_PARALLEL_SUBMIT_TIMES, options = {}) => {
                const draft = ensureWizardDraft();
                const prevCount = normalizeParallelSubmitTimes(
                    draft.parallelSubmitTimes,
                    DEFAULT_SCENE_PARALLEL_SUBMIT_TIMES
                );
                const nextCount = normalizeParallelSubmitTimes(next, prevCount);
                draft.parallelSubmitTimes = nextCount;
                renderRunModeMenu();
                commitDraftState(options.syncDraft !== false ? null : draft);
                if (options.silent !== true && prevCount !== nextCount) {
                    appendWizardLog(`并发数已调整为 ×${nextCount}`, 'success');
                }
            };

            const formatKeywordLine = (word) => {
                const bid = toNumber(word?.bidPrice, 1);
                const matchText = parseMatchScope(word?.matchScope, DEFAULTS.matchScope) === 1 ? '精准' : '广泛';
                return `${String(word?.word || '').trim()},${bid.toFixed(2)},${matchText}`;
            };
            const keywordMetricKey = (value = '') => String(value || '').trim().toLowerCase();
            const formatRatePercent = (value) => {
                const num = Number(value);
                if (!Number.isFinite(num)) return '-';
                return `${(num * 100).toFixed(2)}%`;
            };
            const formatMetricBid = (value) => {
                const num = Number(value);
                if (!Number.isFinite(num)) return '-';
                return String(num.toFixed(4)).replace(/(?:\.0+|(\.\d+?)0+)$/, '$1');
            };
            const resolveKeywordRelevanceMeta = (value) => {
                const num = toNumber(value, 3);
                if (num <= 1) return { text: '低', className: 'keyword-relevance keyword-relevance-low' };
                if (num === 2) return { text: '中', className: 'keyword-relevance keyword-relevance-mid' };
                return { text: '好', className: 'keyword-relevance' };
            };
            const buildKeywordMetricEntry = (rawWord = {}) => {
                if (!isPlainObject(rawWord)) return null;
                const word = String(rawWord.word || rawWord.keyword || '').trim();
                if (!word) return null;
                const relevanceMeta = resolveKeywordRelevanceMeta(rawWord.relevanceType);
                const searchIndex = Number(rawWord.searchIndex);
                const marketAverageBid = Number(rawWord.marketAverageBid);
                const reasonTagList = Array.isArray(rawWord.reasonTagList)
                    ? rawWord.reasonTagList.map(item => String(item?.name || '').trim()).filter(Boolean)
                    : [];
                const predictClick = Number(rawWord.predictClick);
                return {
                    word,
                    searchIndexText: Number.isFinite(searchIndex) ? String(Math.max(0, Math.round(searchIndex))) : '-',
                    marketClickRateText: formatRatePercent(rawWord.marketClickRate),
                    marketClickConversionRateText: formatRatePercent(rawWord.marketClickConversionRate),
                    marketAverageBidText: formatMetricBid(marketAverageBid),
                    relevanceText: relevanceMeta.text,
                    relevanceClassName: relevanceMeta.className,
                    reasonTagList,
                    predictClickText: Number.isFinite(predictClick) ? String(Math.max(0, predictClick).toFixed(2)) : '-'
                };
            };
            const mergeKeywordMetricMap = (wordList = []) => {
                if (!Array.isArray(wordList) || !wordList.length) return;
                const nextMap = { ...(isPlainObject(wizardState.keywordMetricMap) ? wizardState.keywordMetricMap : {}) };
                wordList.forEach(rawWord => {
                    const metricEntry = buildKeywordMetricEntry(rawWord);
                    if (!metricEntry) return;
                    const key = keywordMetricKey(metricEntry.word);
                    if (!key) return;
                    nextMap[key] = metricEntry;
                });
                wizardState.keywordMetricMap = nextMap;
            };
            const getKeywordMetricByWord = (word = '') => {
                const key = keywordMetricKey(word);
                if (!key) return null;
                return isPlainObject(wizardState.keywordMetricMap) ? wizardState.keywordMetricMap[key] || null : null;
            };

            const getCrowdDisplayName = (crowdItem = {}) => {
                const label = crowdItem?.crowd?.label || {};
                const crowdName = String(crowdItem?.crowd?.crowdName || '').trim();
                if (crowdName) return crowdName;
                const labelName = String(label?.labelName || '').trim();
                const optionNames = uniqueBy(
                    (label?.optionList || []).map(option => String(option?.optionName || '').trim()).filter(Boolean),
                    name => name
                ).join('，');
                return uniqueBy([labelName, optionNames].filter(Boolean), name => name).join('：') || '未命名人群';
            };

            const setDebugVisible = (visible) => {
                wizardState.debugVisible = !!visible;
                if (wizardState.els.debugWrap) {
                    wizardState.els.debugWrap.classList.toggle('collapsed', !wizardState.debugVisible);
                }
                (Array.isArray(wizardState.els.toggleDebugBtns) ? wizardState.els.toggleDebugBtns : [])
                    .forEach(btn => {
                        if (!(btn instanceof HTMLButtonElement)) return;
                        btn.textContent = wizardState.debugVisible ? '隐藏日志' : '打开日志';
                    });
            };
            const refreshItemSplitButtons = () => {
                const listExpanded = wizardState.candidateListExpanded === true;
                if (wizardState.els.toggleCandidateBtn instanceof HTMLButtonElement) {
                    wizardState.els.toggleCandidateBtn.textContent = '添加商品';
                }
                if (wizardState.els.toggleCandidateListBtn instanceof HTMLButtonElement) {
                    wizardState.els.toggleCandidateListBtn.classList.remove('hidden');
                    wizardState.els.toggleCandidateListBtn.textContent = listExpanded ? '收起已选' : '展开已选';
                }
            };
            const setCandidateListExpanded = (expanded) => {
                const nextExpanded = expanded === true;
                wizardState.candidateListExpanded = nextExpanded;
                ensureWizardDraft().candidateListExpanded = nextExpanded;
                if (wizardState.els.itemSplit) {
                    wizardState.els.itemSplit.classList.toggle(
                        'candidate-list-expanded',
                        nextExpanded
                    );
                }
                refreshItemSplitButtons();
                syncItemPickerAddedListViewport();
            };
            const setItemSplitExpanded = (expanded) => {
                const nextExpanded = expanded === true;
                wizardState.itemSplitExpanded = nextExpanded;
                ensureWizardDraft().itemSplitExpanded = nextExpanded;
                if (wizardState.els.itemSplit) {
                    wizardState.els.itemSplit.classList.toggle('compact', !nextExpanded);
                    wizardState.els.itemSplit.classList.toggle(
                        'candidate-list-expanded',
                        wizardState.candidateListExpanded === true
                    );
                }
                refreshItemSplitButtons();
            };
            const createItemSplitShadow = (itemSplit) => {
                if (!(itemSplit instanceof HTMLElement)) return null;
                const shadow = itemSplit.cloneNode(true);
                if (!(shadow instanceof HTMLElement)) return null;
                shadow.setAttribute('data-am-wxt-item-picker-shadow', '1');
                shadow.setAttribute('aria-hidden', 'true');
                shadow.querySelectorAll('[id]').forEach((node) => {
                    if (node instanceof HTMLElement) node.removeAttribute('id');
                });
                return shadow;
            };
            const openKeywordItemPickerPopup = () => {
                if (document.getElementById('am-wxt-keyword-item-picker-mask')) return;
                const itemSplit = wizardState?.els?.itemSplit;
                if (!(itemSplit instanceof HTMLElement)) {
                    appendWizardLog('未找到商品选择区域，请刷新后重试', 'error');
                    return;
                }
                if (!(itemSplit.parentNode instanceof Node)) {
                    appendWizardLog('商品选择区域状态异常，请刷新后重试', 'error');
                    return;
                }
                const splitPanelWidth = Math.round(itemSplit.getBoundingClientRect().width || 0);
                const candidatePanel = itemSplit.querySelector('.am-wxt-panel-candidate');
                const candidatePanelWidth = candidatePanel instanceof HTMLElement
                    ? Math.round(candidatePanel.getBoundingClientRect().width || 0)
                    : 0;

                const initialAddedItemsSnapshot = wizardState.addedItems.map(item => deepClone(item));
                const initialSplitExpanded = wizardState.itemSplitExpanded === true;
                const initialCandidateListExpanded = wizardState.candidateListExpanded === true;
                const placeholder = document.createComment('am-wxt-keyword-item-picker-placeholder');
                const itemSplitShadow = createItemSplitShadow(itemSplit);
                const mask = document.createElement('div');
                mask.id = 'am-wxt-keyword-item-picker-mask';
                mask.innerHTML = `
                    <div class="am-wxt-keyword-item-picker-dialog" role="dialog" aria-modal="true" aria-label="添加商品">
                        <div class="am-wxt-keyword-item-picker-head">
                            <span>添加商品</span>
                            <button type="button" class="am-wxt-btn" data-am-wxt-item-picker-close="1">关闭</button>
                        </div>
                        <div class="am-wxt-keyword-item-picker-body">
                            <div class="am-wxt-keyword-item-picker-host" data-am-wxt-item-picker-host="1"></div>
                        </div>
                        <div class="am-wxt-keyword-item-picker-foot">
                            <button type="button" class="am-wxt-btn" data-am-wxt-item-picker-cancel="1">取消</button>
                            <button type="button" class="am-wxt-btn primary" data-am-wxt-item-picker-confirm="1">确定</button>
                        </div>
                    </div>
                `;
                const panelHost = mask.querySelector('[data-am-wxt-item-picker-host="1"]');
                if (!(panelHost instanceof HTMLElement)) return;
                const dialog = mask.querySelector('.am-wxt-keyword-item-picker-dialog');
                if (dialog instanceof HTMLElement && splitPanelWidth > 0) {
                    const viewportMaxWidth = Math.max(420, Math.round((window.innerWidth || 0) - 32));
                    const desiredWidthSeed = candidatePanelWidth > 0 ? candidatePanelWidth : splitPanelWidth;
                    const desiredWidth = Math.max(460, Math.round(desiredWidthSeed * 0.5));
                    dialog.style.width = `${Math.min(viewportMaxWidth, desiredWidth)}px`;
                }

                const htmlEl = document.documentElement;
                const bodyEl = document.body;
                const previousHtmlOverflow = htmlEl?.style?.overflow || '';
                const previousBodyOverflow = bodyEl?.style?.overflow || '';
                if (wizardState?.els?.overlay instanceof HTMLElement) {
                    wizardState.els.overlay.classList.add('item-picker-open');
                }
                if (htmlEl) htmlEl.style.overflow = 'hidden';
                if (bodyEl) bodyEl.style.overflow = 'hidden';

                itemSplit.parentNode.insertBefore(placeholder, itemSplit);
                if (itemSplitShadow) {
                    itemSplit.parentNode.insertBefore(itemSplitShadow, itemSplit);
                }
                panelHost.appendChild(itemSplit);
                document.body.appendChild(mask);
                setItemSplitExpanded(true);
                commitItemSelectionUiState({
                    renderAdded: true,
                    renderCandidate: true
                });

                let closed = false;
                const handleEsc = (event) => {
                    if (event.key !== 'Escape') return;
                    event.preventDefault();
                    closePicker(false);
                };
                const restoreItemSplit = () => {
                    if (!(itemSplit instanceof HTMLElement) || !(placeholder instanceof Comment)) return;
                    if (placeholder.parentNode) {
                        placeholder.parentNode.insertBefore(itemSplit, placeholder);
                        if (itemSplitShadow?.parentNode) {
                            itemSplitShadow.parentNode.removeChild(itemSplitShadow);
                        }
                        placeholder.parentNode.removeChild(placeholder);
                    }
                };
                const closePicker = (confirmed = false) => {
                    if (closed) return;
                    closed = true;
                    document.removeEventListener('keydown', handleEsc, true);
                    if (!confirmed) {
                        wizardState.addedItems = initialAddedItemsSnapshot.map(item => deepClone(item));
                    }
                    restoreItemSplit();
                    setItemSplitExpanded(initialSplitExpanded);
                    setCandidateListExpanded(initialCandidateListExpanded);
                    commitItemSelectionUiState({
                        renderAdded: true,
                        renderCandidate: true
                    });
                    if (wizardState?.els?.overlay instanceof HTMLElement) {
                        wizardState.els.overlay.classList.remove('item-picker-open');
                    }
                    if (htmlEl) htmlEl.style.overflow = previousHtmlOverflow;
                    if (bodyEl) bodyEl.style.overflow = previousBodyOverflow;
                    if (mask.parentNode) {
                        mask.parentNode.removeChild(mask);
                    }
                };

                document.addEventListener('keydown', handleEsc, true);
                const closeBtn = mask.querySelector('[data-am-wxt-item-picker-close="1"]');
                const cancelBtn = mask.querySelector('[data-am-wxt-item-picker-cancel="1"]');
                const confirmBtn = mask.querySelector('[data-am-wxt-item-picker-confirm="1"]');
                if (closeBtn instanceof HTMLButtonElement) closeBtn.onclick = () => closePicker(false);
                if (cancelBtn instanceof HTMLButtonElement) cancelBtn.onclick = () => closePicker(false);
                if (confirmBtn instanceof HTMLButtonElement) confirmBtn.onclick = () => closePicker(true);
                mask.addEventListener('click', (event) => {
                    if (event.target === mask) {
                        closePicker(false);
                    }
                });

                if (!wizardState.candidates.length) {
                    void loadCandidates('', wizardState.candidateSource || 'all');
                }
                const searchInput = wizardState?.els?.searchInput;
                if (searchInput instanceof HTMLInputElement) {
                    requestAnimationFrame(() => {
                        if (mask.parentNode) {
                            searchInput.focus();
                        }
                    });
                }
            };

            const renderSelectOptionLine = (selectEl) => {
                if (!(selectEl instanceof HTMLSelectElement)) return;
                const lineList = Array.from(wizardState?.els?.overlay?.querySelectorAll?.(`[data-bind-select="${selectEl.id}"]`) || [])
                    .filter(line => line instanceof HTMLElement);
                if (!lineList.length) return;
                const currentValue = String(selectEl.value || '');
                const options = Array.from(selectEl.options || []);
                lineList.forEach((line) => {
                    line.innerHTML = '';
                    options.forEach((option) => {
                        const value = String(option?.value || '');
                        const text = String(option?.textContent || option?.label || value);
                        const chip = document.createElement('button');
                        chip.type = 'button';
                        chip.className = `am-wxt-option-chip${value === currentValue ? ' active' : ''}`;
                        chip.textContent = text;
                        chip.disabled = !!selectEl.disabled;
                        chip.onclick = () => {
                            if (selectEl.disabled) return;
                            if (selectEl.value !== value) {
                                selectEl.value = value;
                                selectEl.dispatchEvent(new Event('input', { bubbles: true }));
                            }
                            selectEl.dispatchEvent(new Event('change', { bubbles: true }));
                            renderSelectOptionLine(selectEl);
                        };
                        line.appendChild(chip);
                    });
                });
            };

            const renderStaticOptionLines = () => {
                renderSelectOptionLine(wizardState?.els?.sceneSelect);
                renderSelectOptionLine(wizardState?.els?.bidModeSelect);
                renderSelectOptionLine(wizardState?.els?.bidTargetSelect);
                renderSelectOptionLine(wizardState?.els?.budgetTypeSelect);
                renderSelectOptionLine(wizardState?.els?.modeSelect);
            };

            const BID_TARGET_OPTIONS = [
                { value: 'conv', label: '获取成交量' },
                { value: 'ad_strategy_buy', label: '增加总成交金额' },
                { value: 'ad_strategy_retained_buy', label: '增加净成交金额' },
                { value: 'similar_item', label: '相似品跟投' },
                { value: 'search_rank', label: '抢占搜索卡位' },
                { value: 'market_penetration', label: '提升市场渗透' },
                { value: 'fav_cart', label: '增加收藏加购量' },
                { value: 'click', label: '增加点击量' },
                { value: 'roi', label: '稳定投产比' }
            ];
            const SCENE_OPTIONS = SCENE_NAME_LIST.slice();
            const escapeRegExp = (text = '') => String(text || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const isAutoGeneratedPlanPrefix = (prefix = '') => {
                const value = String(prefix || '').trim();
                if (!value) return true;
                if (
                    /^[^_\s]+_\d{8}$/.test(value)
                    || /^[^_\s]+_\d{14}$/.test(value)
                    || /^[^_\s]+_\d{8}_\d{6}$/.test(value)
                    || /^[^_\s]+_\d{14}_\d+$/.test(value)
                    || /^[^_\s]+_\d{8}_\d{6}_\d+$/.test(value)
                ) return true;
                return SCENE_OPTIONS.some(scene => {
                    const escaped = escapeRegExp(scene);
                    return new RegExp(`^${escaped}_\\d{8}$`).test(value)
                        || new RegExp(`^${escaped}_\\d{14}$`).test(value)
                        || new RegExp(`^${escaped}_\\d{8}_\\d{6}$`).test(value)
                        || new RegExp(`^${escaped}_\\d{14}_\\d+$`).test(value)
                        || new RegExp(`^${escaped}_\\d{8}_\\d{6}_\\d+$`).test(value);
                });
            };
            const buildDefaultPlanPrefixByScene = (sceneName = '') => buildSceneTimePrefix(sceneName || wizardState?.draft?.sceneName || '关键词推广');
            const stripAutoPlanSerialSuffix = (rawValue = '') => {
                const value = String(rawValue || '').trim();
                if (!value) return '';
                if (/^[^_\s]+_\d{14}_\d+$/.test(value) || /^[^_\s]+_\d{8}_\d{6}_\d+$/.test(value)) {
                    return value.replace(/_\d+$/, '');
                }
                return value;
            };
            const getCurrentEditorSceneName = () => {
                const selected = String(wizardState?.els?.sceneSelect?.value || wizardState?.draft?.sceneName || '关键词推广').trim();
                return SCENE_OPTIONS.includes(selected) ? selected : '关键词推广';
            };
            const createStrategyCloneId = (seed = 'strategy') => `${String(seed || 'strategy').replace(/[^\w]/g, '_')}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
            const createStrategyCloneName = (baseName = '') => {
                const sourceName = String(baseName || '').trim() || '计划';
                const usedNameSet = new Set((wizardState.strategyList || []).map(item => String(item?.name || '').trim()).filter(Boolean));
                let candidate = `${sourceName}_复制`;
                let cursor = 2;
                while (usedNameSet.has(candidate) && cursor < 99) {
                    candidate = `${sourceName}_复制${cursor}`;
                    cursor += 1;
                }
                return candidate;
            };
            const createNewStrategyName = (sceneName = '') => {
                const base = `${String(sceneName || '关键词推广').trim() || '关键词推广'}-新建计划`;
                const usedNameSet = new Set((wizardState.strategyList || []).map(item => String(item?.name || '').trim()).filter(Boolean));
                if (!usedNameSet.has(base)) return base;
                let cursor = 2;
                let candidate = `${base}${cursor}`;
                while (usedNameSet.has(candidate) && cursor < 999) {
                    cursor += 1;
                    candidate = `${base}${cursor}`;
                }
                return candidate;
            };
            const ensureUniqueStrategyPlanName = (basePlanName = '', ignoreStrategyId = '') => {
                const seed = String(basePlanName || '').trim();
                if (!seed) return buildDefaultPlanPrefixByScene(getCurrentEditorSceneName());
                const usedPlanNames = new Set(
                    (wizardState.strategyList || [])
                        .filter(item => String(item?.id || '') !== String(ignoreStrategyId || ''))
                        .map(item => String(item?.planName || '').trim())
                        .filter(Boolean)
                );
                if (!usedPlanNames.has(seed)) return seed;
                let cursor = 2;
                let candidate = `${seed}_${cursor}`;
                while (usedPlanNames.has(candidate) && cursor < 99) {
                    cursor += 1;
                    candidate = `${seed}_${cursor}`;
                }
                return candidate;
            };
            const buildCopiedStrategyPlanName = (sourcePlanName = '', sceneName = '', copyIndex = 0) => {
                const raw = String(sourcePlanName || '').trim();
                const fallback = buildDefaultPlanPrefixByScene(sceneName || getCurrentEditorSceneName());
                const baseSeed = raw || fallback;
                const hasAutoTimeSuffix = /(?:_\d{8}|\d{14}|_\d{8}_\d{6})$/.test(baseSeed);
                const sourceSerial = !hasAutoTimeSuffix && /_(\d+)$/.test(baseSeed)
                    ? Math.max(0, toNumber(baseSeed.match(/_(\d+)$/)?.[1], 0))
                    : 0;
                let base = sourceSerial > 0 ? baseSeed.replace(/_\d+$/, '') : baseSeed;
                if (sourceSerial > 0) {
                    const timestampWithSerialTailMatch = base.match(/^(.*(?:_\d{8}_\d{6}))(?:_\d+)+$/)
                        || (
                            /_\d{8}_\d{6}$/.test(base)
                                ? null
                                : base.match(/^(.*(?:_\d{8}|\d{14}))(?:_\d+)+$/)
                        );
                    if (timestampWithSerialTailMatch?.[1]) {
                        base = timestampWithSerialTailMatch[1];
                    }
                }
                const usedPlanNames = new Set(
                    (wizardState.strategyList || [])
                        .map(item => String(item?.planName || '').trim())
                        .filter(Boolean)
                );
                const serialStart = sourceSerial > 0 ? sourceSerial : 0;
                let serialCursor = serialStart + Math.max(1, toNumber(copyIndex, 1));
                let candidate = `${base}_${serialCursor}`;
                while (usedPlanNames.has(candidate) && serialCursor < 9999) {
                    serialCursor += 1;
                    candidate = `${base}_${serialCursor}`;
                }
                return candidate;
            };
            const getStrategyTargetLabel = (strategy = {}) => {
                const bidTargetValue = normalizeKeywordBidTargetOptionValue(
                    String(strategy?.bidTargetV2 || DEFAULTS.bidTargetV2).trim() || DEFAULTS.bidTargetV2
                ) || DEFAULTS.bidTargetV2;
                return BID_TARGET_OPTIONS.find(item => item.value === bidTargetValue)?.label || '获取成交量';
            };
            const resolveStrategyTargetCostConfig = (bidTarget = '') => {
                const bidTargetCode = normalizeKeywordBidTargetOptionValue(
                    mapSceneBidTargetValue(bidTarget) || bidTarget
                );
                if (bidTargetCode === 'roi') {
                    return {
                        switchLabel: '设置7日投产比',
                        switchOnValue: '自定义',
                        valueLabels: ['目标投产比', 'ROI目标值', '出价目标值', '约束值']
                    };
                }
                if (bidTargetCode === 'conv') {
                    return {
                        switchLabel: '设置平均成交成本',
                        switchOnValue: '开启',
                        valueLabels: ['平均成交成本', '平均直接成交成本', '直接成交成本', '单次成交成本', '目标成交成本', '目标成本']
                    };
                }
                if (bidTargetCode === 'fav_cart') {
                    return {
                        switchLabel: '设置平均收藏加购成本',
                        switchOnValue: '开启',
                        valueLabels: ['平均收藏加购成本', '收藏加购成本', '目标成本']
                    };
                }
                if (bidTargetCode === 'click') {
                    return {
                        switchLabel: '设置平均点击成本',
                        switchOnValue: '开启',
                        valueLabels: ['平均点击成本', '点击成本', '目标成本']
                    };
                }
                return null;
            };
            const resolveStrategySceneValueByLabels = (strategy = {}, labels = []) => {
                const candidates = Array.isArray(labels) ? labels : [];
                if (!candidates.length) return '';
                const strategySceneName = SCENE_OPTIONS.includes(String(strategy?.sceneName || '').trim())
                    ? String(strategy.sceneName).trim()
                    : getCurrentEditorSceneName();
                const buckets = [];
                const strategySceneSettingValues = normalizeSceneSettingBucketValues(
                    strategy?.sceneSettingValues || {},
                    strategySceneName
                );
                const strategySceneSettings = normalizeSceneSettingBucketValues(
                    strategy?.sceneSettings || {},
                    strategySceneName
                );
                if (Object.keys(strategySceneSettingValues).length) buckets.push(strategySceneSettingValues);
                if (Object.keys(strategySceneSettings).length) buckets.push(strategySceneSettings);
                for (const label of candidates) {
                    const fieldLabel = normalizeSceneRenderFieldLabel(label) || label;
                    if (!fieldLabel) continue;
                    const fieldKey = normalizeSceneFieldKey(fieldLabel);
                    for (const bucket of buckets) {
                        const value = normalizeSceneSettingValue(
                            bucket[fieldLabel]
                            || (fieldKey ? bucket[fieldKey] : '')
                            || ''
                        );
                        if (value) return value;
                    }
                }
                return '';
            };
            const resolveStrategyTargetCostValue = (strategy = {}, bidTarget = '') => {
                const config = resolveStrategyTargetCostConfig(bidTarget);
                if (!config) return '';
                const sceneTargetCostValue = resolveStrategySceneValueByLabels(strategy, config.valueLabels || []);
                const candidateValues = [
                    sceneTargetCostValue,
                    strategy?.singleCostV2
                ];
                for (const candidate of candidateValues) {
                    const amount = parseNumberFromSceneValue(candidate);
                    if (!Number.isFinite(amount) || amount <= 0 || amount > 9999) continue;
                    const normalized = toShortSceneValue(String(amount));
                    if (normalized) return normalized;
                }
                return '';
            };
            const syncStrategyTargetCostFields = (strategy = {}, bidTarget = '', inputValue = '') => {
                const config = resolveStrategyTargetCostConfig(bidTarget);
                if (!config || !isPlainObject(strategy)) return '';
                const amount = parseNumberFromSceneValue(inputValue);
                const nextValue = (Number.isFinite(amount) && amount > 0 && amount <= 9999)
                    ? (toShortSceneValue(String(amount)) || '')
                    : '';
                const writeSceneField = (fieldLabel = '', fieldValue = '', markTouched = true) => {
                    const normalizedLabel = normalizeSceneRenderFieldLabel(fieldLabel) || fieldLabel;
                    if (!normalizedLabel) return;
                    const fieldKey = normalizeSceneFieldKey(normalizedLabel);
                    if (!isPlainObject(strategy.sceneSettingValues)) strategy.sceneSettingValues = {};
                    if (!isPlainObject(strategy.sceneSettings)) strategy.sceneSettings = {};
                    [strategy.sceneSettingValues, strategy.sceneSettings].forEach(bucket => {
                        if (!isPlainObject(bucket)) return;
                        if (fieldValue) {
                            bucket[normalizedLabel] = fieldValue;
                            if (fieldKey) bucket[fieldKey] = fieldValue;
                        } else {
                            delete bucket[normalizedLabel];
                            if (fieldKey) delete bucket[fieldKey];
                        }
                    });
                    if (!markTouched) return;
                    if (!isPlainObject(strategy.sceneSettingTouched)) strategy.sceneSettingTouched = {};
                    if (fieldKey) strategy.sceneSettingTouched[fieldKey] = true;
                };
                strategy.setSingleCostV2 = normalizeBidMode(strategy.bidMode || 'smart', 'smart') === 'smart' && !!nextValue;
                strategy.singleCostV2 = nextValue;
                writeSceneField(config.switchLabel, nextValue ? (config.switchOnValue || '开启') : '', false);
                (config.valueLabels || []).forEach(label => {
                    writeSceneField(label, nextValue, true);
                });
                return nextValue;
            };
            const detectKeywordGoalFromText = (text = '') => {
                const value = normalizeGoalLabel(text);
                if (!value) return '';
                if (/搜索卡位|卡位/.test(value)) return '搜索卡位';
                if (/趋势明星|趋势/.test(value)) return '趋势明星';
                if (/流量金卡|金卡/.test(value)) return '流量金卡';
                if (/自定义推广|自定义/.test(value)) return '自定义推广';
                return '';
            };
            const detectKeywordGoalFromBidTarget = (bidTarget = '') => {
                const value = String(bidTarget || '').trim();
                if (!value) return '';
                if (value === 'search_rank') return '搜索卡位';
                if (value === 'market_penetration' || value === 'word_penetration_rate') return '趋势明星';
                if (value === 'click') return '流量金卡';
                return '自定义推广';
            };
            const resolveKeywordGoalFromSceneSettings = (sceneSettings = {}) => {
                const settings = isPlainObject(sceneSettings) ? sceneSettings : {};
                return normalizeGoalLabel(
                    settings.营销目标
                    || settings.选择卡位方案
                    || settings.优化目标
                    || ''
                );
            };
            const resolveGenericGoalFromSceneSettings = (sceneSettings = {}) => {
                const settings = isPlainObject(sceneSettings) ? sceneSettings : {};
                return normalizeGoalLabel(
                    settings.营销目标
                    || settings.选择卡位方案
                    || settings.选择拉新方案
                    || settings.选择方案
                    || settings.选择优化方向
                    || settings.选择解决方案
                    || settings.投放策略
                    || settings.推广模式
                    || settings.选择方式
                    || settings.优化目标
                    || ''
                );
            };
            const resolveStrategyMarketingGoal = (strategy = {}, sceneSettings = {}, sceneName = '') => {
                const currentScene = SCENE_OPTIONS.includes(String(sceneName || '').trim())
                    ? String(sceneName || '').trim()
                    : getCurrentEditorSceneName();
                const currentSceneSettings = normalizeSceneSettingBucketValues(sceneSettings, currentScene);
                if (currentScene !== '关键词推广') {
                    const sceneGoalOptions = getSceneMarketingGoalFallbackList(currentScene);
                    const pickGoalByScene = (text = '') => {
                        const normalized = normalizeGoalLabel(text);
                        if (!normalized) return '';
                        if (!sceneGoalOptions.length) return normalized;
                        const exact = sceneGoalOptions.find(goal => normalizeGoalLabel(goal) === normalized);
                        if (exact) return exact;
                        const included = sceneGoalOptions.find(goal => normalized.includes(goal) || goal.includes(normalized));
                        if (included) return included;
                        return '';
                    };
                    const fromStrategy = pickGoalByScene(strategy?.marketingGoal || '');
                    if (fromStrategy) return fromStrategy;
                    const fromName = pickGoalByScene(strategy?.name || '');
                    if (fromName) return fromName;
                    const fromPlanName = pickGoalByScene(strategy?.planName || '');
                    if (fromPlanName) return fromPlanName;
                    const fromScene = pickGoalByScene(resolveGenericGoalFromSceneSettings(currentSceneSettings));
                    if (fromScene) return fromScene;
                    return sceneGoalOptions[0] || '';
                }
                const readSceneSettingValueByLabels = (source = {}, labels = []) => {
                    if (!isPlainObject(source)) return '';
                    const labelList = Array.isArray(labels) ? labels : [];
                    for (let idx = 0; idx < labelList.length; idx += 1) {
                        const label = String(labelList[idx] || '').trim();
                        if (!label) continue;
                        const key = normalizeSceneFieldKey(label);
                        const value = normalizeSceneSettingValue(
                            (key ? source[key] : '')
                            || source[label]
                            || ''
                        );
                        if (value) return value;
                    }
                    return '';
                };
                const strategySceneSettingValues = normalizeSceneSettingBucketValues(
                    strategy?.sceneSettingValues || {},
                    currentScene
                );
                const strategySceneSettings = normalizeSceneSettingBucketValues(
                    strategy?.sceneSettings || {},
                    currentScene
                );
                const keywordSceneHint = normalizeSceneSettingValue(
                    readSceneSettingValueByLabels(currentSceneSettings, ['campaign.promotionScene'])
                    || readSceneSettingValueByLabels(strategySceneSettingValues, ['campaign.promotionScene'])
                    || readSceneSettingValueByLabels(strategySceneSettings, ['campaign.promotionScene'])
                    || strategy?.promotionScene
                    || ''
                );
                const keywordItemModeHint = normalizeSceneSettingValue(
                    readSceneSettingValueByLabels(currentSceneSettings, ['campaign.itemSelectedMode'])
                    || readSceneSettingValueByLabels(strategySceneSettingValues, ['campaign.itemSelectedMode'])
                    || readSceneSettingValueByLabels(strategySceneSettings, ['campaign.itemSelectedMode'])
                    || strategy?.itemSelectedMode
                    || ''
                );
                if (
                    /promotion_scene_search_user_define/i.test(keywordSceneHint)
                    || /(?:^|[_-])user_define(?:$|[_-])/i.test(keywordItemModeHint)
                ) {
                    return '自定义推广';
                }
                const fromScene = detectKeywordGoalFromText(resolveKeywordGoalFromSceneSettings(currentSceneSettings));
                if (fromScene) return fromScene;
                const fromStrategy = detectKeywordGoalFromText(strategy?.marketingGoal || '');
                if (fromStrategy) return fromStrategy;
                const fromBidTarget = detectKeywordGoalFromBidTarget(strategy?.bidTargetV2 || '');
                if (fromBidTarget) return fromBidTarget;
                const fromName = detectKeywordGoalFromText(strategy?.name || '');
                if (fromName) return fromName;
                const fromPlanName = detectKeywordGoalFromText(strategy?.planName || '');
                if (fromPlanName) return fromPlanName;
                return getSceneMarketingGoalFallbackList(currentScene)[0] || '趋势明星';
            };
            const getStrategyMainLabel = (strategy = {}) => {
                const explicitPlanName = String(strategy?.planName || '').trim();
                if (explicitPlanName) return explicitPlanName;
                const getStrategyAutoPlanPrefix = (targetStrategy = {}) => {
                    const strategyScene = SCENE_OPTIONS.includes(String(targetStrategy?.sceneName || '').trim())
                        ? String(targetStrategy.sceneName).trim()
                        : getCurrentEditorSceneName();
                    const existingPrefix = String(targetStrategy?.autoPlanPrefix || '').trim();
                    if (existingPrefix) return existingPrefix;
                    const draftScene = String(wizardState?.draft?.sceneName || '').trim();
                    const draftPrefix = String(wizardState?.draft?.planNamePrefix || '').trim();
                    const fallbackPrefix = draftPrefix && draftScene === strategyScene
                        ? draftPrefix
                        : buildSceneTimePrefix(strategyScene);
                    if (isPlainObject(targetStrategy)) {
                        targetStrategy.autoPlanPrefix = fallbackPrefix;
                    }
                    return fallbackPrefix;
                };
                const scenePrefix = getStrategyAutoPlanPrefix(strategy);
                const strategyList = Array.isArray(wizardState?.strategyList) ? wizardState.strategyList : [];
                const strategyIndex = strategyList.findIndex(item => String(item?.id || '') === String(strategy?.id || ''));
                if (strategyIndex >= 0) {
                    return `${scenePrefix}_${String(strategyIndex + 1).padStart(2, '0')}`;
                }
                return scenePrefix;
            };
            const updateBidModeControls = (modeValue = 'smart') => {
                const bidMode = normalizeBidMode(modeValue, 'smart');
                const isManual = bidMode === 'manual';
                if (wizardState.els.bidModeSelect) {
                    wizardState.els.bidModeSelect.value = bidMode;
                }
                if (wizardState.els.bidTargetRow instanceof HTMLElement) {
                    wizardState.els.bidTargetRow.style.display = isManual ? 'none' : '';
                }
                if (wizardState.els.bidTargetSelect) {
                    wizardState.els.bidTargetSelect.disabled = isManual;
                    wizardState.els.bidTargetSelect.title = isManual ? '手动出价模式下不启用出价目标' : '';
                }
                if (wizardState.els.singleCostEnableInput) {
                    if (isManual) wizardState.els.singleCostEnableInput.checked = false;
                    wizardState.els.singleCostEnableInput.disabled = isManual;
                }
                if (wizardState.els.singleCostInput) {
                    wizardState.els.singleCostInput.disabled = isManual || !wizardState.els.singleCostEnableInput?.checked;
                }
                renderStaticOptionLines();
            };
            const SCENE_REQUIREMENT_FALLBACK = {
                '货品全站推广': ['选择推广商品', '添加商品', '设置商品推广方案', '设置预算', '预算类型', '设置基础信息', '计划名称', '高级设置'],
                '关键词推广': ['营销目标', '选择卡位方案', '核心词设置', '添加商品', '卡位方式', '设置预算', '预算类型', '设置基础信息', '计划名称', '高级设置'],
                '人群推广': ['营销目标', '选择拉新方案', '选择推广商品', '添加商品', '设置拉新人群', '选择方式', '设置预算及排期', '预算类型', '设置基础信息', '计划名称', '高级设置'],
                '店铺直达': ['设置创意', '设置推广方案', '设置词包', '设置预算及排期', '预算类型', '每日预算', '设置基础信息', '计划名称', '高级设置'],
                '内容营销': ['选择优化方向', '选择方案', '优化目标', '选择推广主体', '设置预算及排期', '投放日期', '出价方式', '设置人群', '设置基础信息', '设置创意', '计划名称', '高级设置'],
                '线索推广': ['营销目标', '选择解决方案', '投放策略', '优化目标', '选择推广商品', '添加商品', '核心词设置', '种子人群', '套餐包', '投放日期', '设置预算及排期', '设置基础信息', '计划名称', '高级设置']
            };
            const SCENE_FIELD_OPTION_FALLBACK = [
                { pattern: /(营销目标|选择卡位方案|选择拉新方案|选择方案|选择优化方向|选择解决方案|投放策略|推广模式)/, options: [] },
                { pattern: /(营销场景)/, options: ['全域投放 · ROI确定交付'] },
                { pattern: /(预算类型)/, options: ['不限预算', '每日预算', '日均预算', '总预算'] },
                { pattern: /(出价方式)/, options: ['智能出价', '手动出价', '最大化拿量', '控成本', '控投产比投放', '控投产比'] },
                { pattern: /(出价目标|优化目标)/, options: ['增加总成交金额', '增加净成交金额', '获取成交量', '收藏加购量', '增加点击量', '稳定投产比', '增加收藏加购量', '提升市场渗透', '优化留资获客成本', '拉新渗透', '扩大新客规模', '稳定新客投产比', '新客收藏加购', '增加成交金额', '增加观看次数', '增加观看时长'] },
                { pattern: /(关键词设置|核心词设置|设置词包)/, options: ['添加关键词', '系统推荐词', '手动自选词'] },
                { pattern: /(匹配方式)/, options: ['广泛', '中心词', '精准'] },
                { pattern: /(流量智选)/, options: ['开启', '关闭'] },
                { pattern: /(冷启加速)/, options: ['开启', '关闭'] },
                { pattern: /(人群设置|种子人群|设置拉新人群|设置人群)/, options: ['智能人群', '添加种子人群', '设置优先投放客户', '关闭'] },
                { pattern: /(资源位溢价)/, options: ['默认溢价', '自定义溢价'] },
                { pattern: /(投放地域\/投放时间)/, options: ['默认投放', '自定义设置'] },
                { pattern: /(选品方式|选择推广商品)/, options: ['自定义选品', '好货快投-大家电专享', '行业推荐选品'] },
                { pattern: /(投放调优|优化模式)/, options: ['多目标优化', '日常优化'] },
                { pattern: /(投放地域|地域设置)/, options: ['全部地域'] },
                { pattern: /(投放时间|投放日期|分时折扣|发布日期|排期)/, options: ['长期投放', '不限时段', '固定时段'] },
                { pattern: /(计划组|设置计划组)/, options: ['不设置计划组'] }
            ];
            const SCENE_FALLBACK_OPTION_MAP = {
                '货品全站推广': {
                    营销目标: ['货品全站推广'],
                    营销场景: ['全域投放 · ROI确定交付'],
                    选品方式: ['自定义选品', '好货快投-大家电专享', '行业推荐选品'],
                    出价方式: ['控投产比投放', '最大化拿量'],
                    出价目标: ['增加总成交金额', '增加净成交金额'],
                    目标投产比: ['5'],
                    预算类型: ['不限预算', '每日预算', '日均预算'],
                    投放调优: ['多目标优化', '日常优化'],
                    发布日期: ['长期投放', '立即投放'],
                    投放时间: ['长期投放', '不限时段', '固定时段'],
                    投放地域: ['全部地域'],
                    设置计划组: ['不设置计划组'],
                    计划组: ['不设置计划组']
                },
                '关键词推广': {
                    营销目标: ['搜索卡位', '趋势明星', '流量金卡', '自定义推广'],
                    选择卡位方案: ['搜索卡位', '趋势明星', '流量金卡', '自定义推广'],
                    卡位方式: ['抢首条', '抢前三', '抢首页'],
                    匹配方式: ['广泛', '中心词', '精准'],
                    流量智选: ['开启', '关闭'],
                    开启冷启加速: ['开启', '关闭'],
                    冷启加速: ['开启', '关闭'],
                    人群设置: ['智能人群', '添加种子人群', '设置优先投放客户', '关闭'],
                    添加商品: ['全部商品', '机会品推荐', '自定义选品'],
                    出价方式: ['智能出价', '手动出价'],
                    出价目标: ['获取成交量', '相似品跟投', '抢占搜索卡位', '提升市场渗透', '增加收藏加购量', '增加点击量', '稳定投产比'],
                    优化目标: ['获取成交量', '相似品跟投', '抢占搜索卡位', '提升市场渗透', '增加收藏加购量', '增加点击量', '稳定投产比'],
                    预算类型: ['每日预算', '日均预算']
                },
                '人群推广': {
                    营销目标: ['高效拉新', '竞店拉新', '借势转化', '机会人群拉新', '跨类目拉新', '自定义推广'],
                    选择拉新方案: ['高效拉新', '竞店拉新', '借势转化', '机会人群拉新', '跨类目拉新', '自定义推广'],
                    投放策略: ['高效拉新', '竞店拉新', '借势转化', '机会人群拉新', '跨类目拉新', '自定义推广'],
                    出价方式: ['智能出价', '手动出价'],
                    出价目标: ['稳定投产比', '获取成交量（最大化拿量）', '收藏加购量（最大化拿量）', '增加点击量（最大化拿量）', '拉新渗透（竞店重合人群）', '获取成交量', '收藏加购量', '增加点击量'],
                    优化目标: ['稳定投产比', '获取成交量（最大化拿量）', '收藏加购量（最大化拿量）', '增加点击量（最大化拿量）', '拉新渗透（竞店重合人群）', '获取成交量', '收藏加购量', '增加点击量'],
                    资源位溢价: ['默认溢价', '自定义溢价'],
                    '投放地域/投放时间': ['默认投放', '自定义设置'],
                    预算类型: ['每日预算', '日均预算']
                },
                '店铺直达': {
                    推广模式: ['持续推广'],
                    出价方式: ['智能出价', '手动出价'],
                    出价目标: ['获取成交量', '稳定投产比', '增加点击量'],
                    预算类型: ['每日预算', '日均预算']
                },
                '内容营销': {
                    营销目标: ['直播间成长', '商品打爆', '拉新增粉'],
                    选择优化方向: ['直播间成长', '商品打爆', '拉新增粉'],
                    选择方案: ['直播间成长', '商品打爆', '拉新增粉'],
                    出价方式: ['最大化拿量', '控成本'],
                    优化目标: ['增加净成交金额', '增加成交金额', '增加观看次数', '增加观看时长'],
                    预算类型: ['每日预算', '日均预算']
                },
                '线索推广': {
                    营销目标: ['收集销售线索', '行业解决方案'],
                    选择解决方案: ['行业解决方案', '自定义方案'],
                    解决方案: ['行业解决方案', '自定义方案'],
                    投放策略: ['行业解决方案', '自定义方案'],
                    出价方式: ['最大化拿量', '控成本'],
                    优化目标: ['优化留资获客成本', '获取成交量'],
                    预算类型: ['每日预算', '日均预算']
                }
            };
            const SCENE_STRICT_OPTION_TYPE_SET = new Set(['goal', 'bidType', 'bidTarget', 'budgetType', 'itemMode', 'keyword', 'crowd', 'schedule']);

            const normalizeSceneFieldKey = (label = '') => {
                const raw = String(label || '').trim();
                if (!raw) return 'field';
                // Keep explicit API paths for direct field passthrough.
                if (/^(campaign|adgroup)\./i.test(raw)) return raw.replace(/\s+/g, '');
                const normalized = raw
                    .replace(/[^\u4e00-\u9fa5A-Za-z0-9]+/g, '_')
                    .replace(/^_+|_+$/g, '');
                return normalized || 'field';
            };

            const migrateCrowdCustomSceneSettingBucket = (sceneName = '') => {
                if (String(sceneName || '').trim() !== '人群推广') return false;
                const draft = ensureWizardDraft();
                if (!isPlainObject(draft.sceneSettingValues)) {
                    draft.sceneSettingValues = {};
                }
                if (!isPlainObject(draft.sceneSettingValues['人群推广'])) {
                    draft.sceneSettingValues['人群推广'] = {};
                }
                if (!isPlainObject(draft.sceneSettingTouched)) {
                    draft.sceneSettingTouched = {};
                }
                if (!isPlainObject(draft.sceneSettingTouched['人群推广'])) {
                    draft.sceneSettingTouched['人群推广'] = {};
                }
                const bucket = draft.sceneSettingValues['人群推广'];
                const touchedBucket = draft.sceneSettingTouched['人群推广'];
                let changed = false;

                const readValueByLabel = (label = '') => {
                    const key = normalizeSceneFieldKey(label);
                    const candidates = [bucket[label], key ? bucket[key] : ''];
                    for (const candidate of candidates) {
                        const normalized = normalizeSceneSettingValue(candidate);
                        if (normalized) return normalized;
                    }
                    return '';
                };
                const readValueByLabels = (labels = []) => {
                    for (const label of (Array.isArray(labels) ? labels : [])) {
                        const value = readValueByLabel(label);
                        if (value) return value;
                    }
                    return '';
                };
                const readTouchedByLabels = (labels = []) => (
                    (Array.isArray(labels) ? labels : []).some((label) => {
                        const key = normalizeSceneFieldKey(label);
                        return touchedBucket[label] === true || (key && touchedBucket[key] === true);
                    })
                );
                const writeValueByLabel = (label = '', value = '', inheritTouchedLabels = []) => {
                    const normalizedValue = normalizeSceneSettingValue(value);
                    if (!label || !normalizedValue) return;
                    const key = normalizeSceneFieldKey(label);
                    if (bucket[label] !== normalizedValue) {
                        bucket[label] = normalizedValue;
                        changed = true;
                    }
                    if (key && bucket[key] !== normalizedValue) {
                        bucket[key] = normalizedValue;
                        changed = true;
                    }
                    if (readTouchedByLabels(inheritTouchedLabels)) {
                        if (touchedBucket[label] !== true) {
                            touchedBucket[label] = true;
                            changed = true;
                        }
                        if (key && touchedBucket[key] !== true) {
                            touchedBucket[key] = true;
                            changed = true;
                        }
                    }
                };
                const dropLabel = (label = '') => {
                    if (!label) return;
                    const key = normalizeSceneFieldKey(label);
                    if (Object.prototype.hasOwnProperty.call(bucket, label)) {
                        delete bucket[label];
                        changed = true;
                    }
                    if (key && Object.prototype.hasOwnProperty.call(bucket, key)) {
                        delete bucket[key];
                        changed = true;
                    }
                    if (Object.prototype.hasOwnProperty.call(touchedBucket, label)) {
                        delete touchedBucket[label];
                        changed = true;
                    }
                    if (key && Object.prototype.hasOwnProperty.call(touchedBucket, key)) {
                        delete touchedBucket[key];
                        changed = true;
                    }
                };

                const crowdGoalLabel = normalizeGoalLabel(
                    readValueByLabels(['营销目标', '选择拉新方案', '投放策略', '方案选择'])
                );
                if (crowdGoalLabel !== '自定义推广') return changed;

                const bidTypeSourceValue = readValueByLabels([
                    '出价方式',
                    'campaign.bidTypeV2',
                    'campaign.bidType'
                ]);
                const crowdBidMode = normalizeBidMode(
                    mapSceneBidTypeValue(bidTypeSourceValue, '人群推广') || bidTypeSourceValue,
                    'manual'
                );
                const targetSourceValue = readValueByLabels([
                    '出价目标',
                    '优化目标',
                    '人群优化目标',
                    '客户口径设置',
                    '人群价值设置',
                    'campaign.bidTargetV2',
                    'campaign.optimizeTarget'
                ]);
                const targetCode = crowdBidMode === 'smart'
                    ? normalizeCrowdCustomSmartBidTargetCode(targetSourceValue, {
                        fallback: 'display_roi'
                    })
                    : normalizeCrowdCustomBidTargetCode(targetSourceValue, {
                        fallback: 'display_pay'
                    });
                const targetLabel = crowdBidMode === 'smart'
                    ? crowdCustomSmartBidTargetCodeToLabel(targetCode)
                    : crowdCustomBidTargetCodeToLabel(targetCode);
                writeValueByLabel('出价目标', targetLabel, [
                    '出价目标',
                    '优化目标',
                    '人群优化目标',
                    '客户口径设置',
                    '人群价值设置',
                    'campaign.bidTargetV2',
                    'campaign.optimizeTarget'
                ]);

                const adzoneSourceValue = readValueByLabels([
                    '资源位溢价',
                    '投放资源位',
                    '资源位设置',
                    '投放资源位/投放地域/分时折扣',
                    '投放资源位/投放地域/投放时间',
                    '高级设置'
                ]);
                const migratedAdzoneValue = /(自定义|手动|关闭|停用)/.test(adzoneSourceValue) ? '自定义溢价' : '默认溢价';
                writeValueByLabel('资源位溢价', migratedAdzoneValue, [
                    '资源位溢价',
                    '投放资源位',
                    '资源位设置',
                    '投放资源位/投放地域/分时折扣',
                    '投放资源位/投放地域/投放时间',
                    '高级设置'
                ]);

                const launchSourceValue = readValueByLabels([
                    '投放地域/投放时间',
                    '投放资源位/投放地域/分时折扣',
                    '投放资源位/投放地域/投放时间',
                    '高级设置'
                ]);
                const migratedLaunchValue = /(自定义|固定|手动|编辑|配置)/.test(launchSourceValue) && !/默认/.test(launchSourceValue)
                    ? '自定义设置'
                    : '默认投放';
                writeValueByLabel('投放地域/投放时间', migratedLaunchValue, [
                    '投放地域/投放时间',
                    '投放资源位/投放地域/分时折扣',
                    '投放资源位/投放地域/投放时间',
                    '高级设置'
                ]);

                [
                    '优化目标',
                    '人群优化目标',
                    '客户口径设置',
                    '人群价值设置',
                    '投放资源位/投放地域/分时折扣',
                    '投放资源位/投放地域/投放时间',
                    '投放资源位',
                    '资源位设置',
                    '高级设置'
                ].forEach(dropLabel);
                return changed;
            };

            const ensureSceneSettingBucket = (sceneName) => {
                const draft = ensureWizardDraft();
                if (!isPlainObject(draft.sceneSettingValues)) {
                    draft.sceneSettingValues = {};
                }
                if (!isPlainObject(draft.sceneSettingValues[sceneName])) {
                    draft.sceneSettingValues[sceneName] = {};
                }
                migrateCrowdCustomSceneSettingBucket(sceneName);
                return draft.sceneSettingValues[sceneName];
            };

            const ensureSceneTouchedBucket = (sceneName) => {
                const draft = ensureWizardDraft();
                if (!isPlainObject(draft.sceneSettingTouched)) {
                    draft.sceneSettingTouched = {};
                }
                if (!isPlainObject(draft.sceneSettingTouched[sceneName])) {
                    draft.sceneSettingTouched[sceneName] = {};
                }
                migrateCrowdCustomSceneSettingBucket(sceneName);
                return draft.sceneSettingTouched[sceneName];
            };
            const resolveSceneSettingBucketSource = (rawValues = {}, sceneName = '') => {
                if (!isPlainObject(rawValues)) return {};
                const normalizedSceneName = SCENE_OPTIONS.includes(String(sceneName || '').trim())
                    ? String(sceneName || '').trim()
                    : '';
                if (normalizedSceneName && isPlainObject(rawValues[normalizedSceneName])) {
                    return rawValues[normalizedSceneName];
                }
                const directFieldLabels = [
                    '营销目标',
                    '选择卡位方案',
                    '选择拉新方案',
                    '出价方式',
                    '出价目标',
                    '人群设置',
                    'campaign.promotionScene',
                    'campaign.itemSelectedMode'
                ];
                const hasDirectField = directFieldLabels.some(label => {
                    const key = normalizeSceneFieldKey(label);
                    if (Object.prototype.hasOwnProperty.call(rawValues, label)) return true;
                    return key ? Object.prototype.hasOwnProperty.call(rawValues, key) : false;
                });
                if (hasDirectField) return rawValues;
                const sceneBuckets = SCENE_OPTIONS
                    .map(name => (isPlainObject(rawValues[name]) ? rawValues[name] : null))
                    .filter(Boolean);
                if (sceneBuckets.length === 1) return sceneBuckets[0];
                return rawValues;
            };
            const normalizeSceneSettingBucketValues = (rawValues = {}, sceneName = '') => {
                const source = resolveSceneSettingBucketSource(rawValues, sceneName);
                const out = {};
                Object.keys(source).forEach(rawKey => {
                    const key = normalizeSceneFieldKey(rawKey);
                    if (!key) return;
                    const value = normalizeSceneSettingValue(source[rawKey]);
                    if (!value) return;
                    out[key] = value;
                });
                return out;
            };
            const normalizeSceneSettingTouchedValues = (rawTouched = {}, sceneName = '') => {
                const source = resolveSceneSettingBucketSource(rawTouched, sceneName);
                const out = {};
                Object.keys(source).forEach(rawKey => {
                    const key = normalizeSceneFieldKey(rawKey);
                    if (!key) return;
                    if (source[rawKey] === true) out[key] = true;
                });
                return out;
            };

            const normalizeSceneLabelToken = (text = '') => normalizeText(String(text || '').replace(/[：:]/g, ''));
            const SCENE_CONNECTED_SETTING_LABEL_RE = /^(营销目标|营销场景|选择卡位方案|选择拉新方案|选择方案|选择优化方向|选择解决方案|投放策略|投放调优|优化模式|推广模式|卡位方式|选择方式|匹配方式|流量智选|开启冷启加速|冷启加速|出价方式|出价目标|目标投产比|净目标投产比|ROI目标值|出价目标值|约束值|设置7日投产比|设置平均成交成本|设置平均收藏加购成本|设置平均点击成本|优化目标|多目标预算|一键起量预算|专属权益|预算类型|每日预算|日均预算|总预算|冻结预算|未来预算|预算值|平均直接成交成本|平均成交成本|平均收藏加购成本|平均点击成本|扣费方式|计费方式|收费方式|支付方式|创意设置|设置创意|创意模式|创意优选|封面智能创意|投放时间|投放日期|分时折扣|发布日期|排期|投放地域|地域设置|起量时间地域设置|投放地域\/投放时间|资源位溢价|计划组|设置计划组|选品方式|选择推广商品|人群设置|人群优化目标|客户口径设置|人群价值设置|设置拉新人群|设置人群|种子人群|趋势主题|趋势主题列表|方案选择|套餐卡|套餐包|套餐包档位|自动续投|套餐包自动续投)$/;
            const SCENE_RENDER_FIELD_ALIAS_RULES = [
                { pattern: /^(关键词设置|核心词设置)$/, label: '核心词设置' },
                { pattern: /^(开启冷启加速|冷启加速)$/, label: '冷启加速' },
                { pattern: /^(设置创意|创意设置|创意模式)$/, label: '创意设置' },
                { pattern: /^(设置拉新人群|设置人群|人群设置|种子人群)$/, label: '人群设置' },
                { pattern: /^(净目标投产比|目标投产比|ROI目标值|出价目标值|约束值)$/, label: '目标投产比' },
                { pattern: /^(投放日期|投放时间|分时折扣|排期)$/, label: '投放时间' },
                { pattern: /^(发布日期|发布时间)$/, label: '投放时间' },
                { pattern: /^(选择推广商品|选品方式)$/, label: '选品方式' },
                { pattern: /^(方案选择|选择方案)$/, label: '选择方案' },
                { pattern: /^(设置计划组|计划组设置)$/, label: '计划组' }
            ];
            const normalizeSceneRenderFieldLabel = (fieldLabel = '') => {
                const raw = normalizeText(fieldLabel).replace(/[：:]/g, '').trim();
                if (!raw) return '';
                if (/^(campaign\.|adgroup\.)/i.test(raw)) return raw;
                const token = normalizeSceneLabelToken(raw);
                for (const rule of SCENE_RENDER_FIELD_ALIAS_RULES) {
                    if (rule.pattern.test(token)) {
                        return rule.label;
                    }
                }
                return raw;
            };
            const normalizeSceneRenderFieldToken = (fieldLabel = '') => normalizeSceneLabelToken(normalizeSceneRenderFieldLabel(fieldLabel));
            const isSceneFieldConnectedToPayload = (fieldLabel = '') => {
                const normalizedLabel = normalizeSceneRenderFieldLabel(fieldLabel);
                if (!normalizedLabel) return false;
                if (/^(campaign\.|adgroup\.)/i.test(normalizedLabel)) return true;
                const token = normalizeSceneLabelToken(normalizedLabel);
                return !!token && SCENE_CONNECTED_SETTING_LABEL_RE.test(token);
            };
            const dedupeSceneFieldLabelsForRender = (labels = []) => {
                const out = [];
                const seen = new Set();
                (Array.isArray(labels) ? labels : []).forEach(label => {
                    const normalizedLabel = normalizeSceneRenderFieldLabel(label);
                    const token = normalizeSceneLabelToken(normalizedLabel);
                    if (!token || seen.has(token)) return;
                    seen.add(token);
                    out.push(normalizedLabel);
                });
                return out;
            };
            const shouldRenderDynamicSceneField = (fieldLabel = '', sceneName = '') => {
                const normalizedLabel = normalizeSceneRenderFieldLabel(fieldLabel);
                const token = normalizeSceneLabelToken(normalizedLabel);
                if (!token) return false;
                const isApiPathField = /^(campaign\.|adgroup\.)/i.test(token);
                if (isApiPathField) return false;
                if (token.length > 24) return false;
                if (!isLikelyFieldLabel(token)) return false;
                if (SCENE_SECTION_ONLY_LABEL_RE.test(token)) return false;
                if (SCENE_LABEL_NOISE_RE.test(token) || token.includes('·')) return false;
                if (SCENE_DYNAMIC_FIELD_BLOCK_RE.test(token)) return false;
                if (!isSceneFieldConnectedToPayload(normalizedLabel)) return false;
                const strictAllow = SCENE_FIELD_LABEL_RE.test(token);
                if (!strictAllow) return false;
                const normalizedSceneName = String(sceneName || wizardState?.draft?.sceneName || '').trim();
                const isKeywordScene = normalizedSceneName === '关键词推广';
                const duplicatedRules = [
                    /场景(名称|选择)?/,
                    /营销场景/,
                    /出价方式/,
                    /出价目标/,
                    /优化目标/,
                    /预算类型/,
                    /每日预算/,
                    /日均预算/,
                    /总预算/,
                    /计划(名称|名)/,
                    /选择推广商品/,
                    /选品方式/,
                    /添加商品/,
                    /选择卡位方案/
                ];
                if (isKeywordScene) {
                    duplicatedRules.push(
                        /关键词模式/,
                        /关键词设置/,
                        /核心词设置/,
                        /平均直接成交成本/
                    );
                }
                return !duplicatedRules.some(rule => rule.test(token));
            };
            const isSceneLabelMatch = (left = '', right = '') => {
                const a = normalizeSceneLabelToken(left);
                const b = normalizeSceneLabelToken(right);
                if (!a || !b) return false;
                return a === b || a.includes(b) || b.includes(a);
            };

            const toShortSceneValue = (text = '') => {
                const normalized = normalizeSceneSettingValue(text);
                if (!normalized) return '';
                if (normalized.length > 24) return '';
                return normalized;
            };

            const pickSceneValueFromOptions = (candidate = '', options = []) => {
                const text = normalizeSceneSettingValue(candidate);
                if (!text || !Array.isArray(options) || !options.length) return '';
                const exact = options.find(opt => opt === text);
                if (exact) return exact;
                const included = options.find(opt => text.includes(opt) || opt.includes(text));
                if (included) return included;
                return '';
            };

            const isSceneOptionMatch = (left = '', right = '') => {
                const a = normalizeSceneOptionText(left);
                const b = normalizeSceneOptionText(right);
                if (!a || !b) return false;
                return a === b || a.includes(b) || b.includes(a);
            };

            const resolveSceneFieldOptionType = (fieldLabel = '') => {
                const token = normalizeSceneLabelToken(fieldLabel);
                if (!token) return '';
                if (/(营销目标|选择卡位方案|选择拉新方案|选择方案|选择优化方向|选择解决方案|投放策略|推广模式|卡位方式|选择方式)/.test(token)) return 'goal';
                if (/(出价方式)/.test(token)) return 'bidType';
                if (/(出价目标|优化目标)/.test(token)) return 'bidTarget';
                if (/(预算类型)/.test(token)) return 'budgetType';
                if (/(选品方式|选择推广商品|添加商品)/.test(token)) return 'itemMode';
                if (/(关键词设置|核心词设置|设置词包|匹配方式)/.test(token)) return 'keyword';
                if (/(人群设置|种子人群|设置拉新人群|设置人群)/.test(token)) return 'crowd';
                if (/(投放调优|优化模式)/.test(token)) return 'strategy';
                if (/(投放时间|投放日期|分时折扣|发布日期|排期|投放地域|地域设置|投放地域\/投放时间|资源位溢价|流量智选|冷启加速)/.test(token)) return 'schedule';
                return '';
            };

            const resolveSceneFallbackOptionSeed = (sceneName = '', fieldLabel = '') => {
                const normalizedSceneName = String(sceneName || '').trim();
                const normalizedLabel = normalizeSceneLabelToken(fieldLabel);
                const sceneOptionMap = isPlainObject(SCENE_FALLBACK_OPTION_MAP[normalizedSceneName])
                    ? SCENE_FALLBACK_OPTION_MAP[normalizedSceneName]
                    : {};
                const options = [];
                let matchedSceneOptionRule = false;
                Object.keys(sceneOptionMap).forEach(ruleLabel => {
                    const normalizedRuleLabel = normalizeSceneLabelToken(ruleLabel);
                    if (!normalizedRuleLabel || !normalizedLabel) return;
                    if (!isSceneLabelMatch(normalizedRuleLabel, normalizedLabel)) return;
                    options.push(...(sceneOptionMap[ruleLabel] || []));
                    matchedSceneOptionRule = true;
                });
                if (!options.length) {
                    SCENE_FIELD_OPTION_FALLBACK.forEach(rule => {
                        if (rule.pattern.test(normalizedLabel)) options.push(...rule.options);
                    });
                }
                const isGoalSelectorLabel = /营销目标/.test(normalizedLabel)
                    || (!/选择解决方案/.test(normalizedLabel) && /^(选择卡位方案|选择拉新方案|选择优化方向|选择方式|推广模式|选择方案)$/.test(normalizedLabel));
                if (resolveSceneFieldOptionType(normalizedLabel) === 'goal' && (isGoalSelectorLabel || !matchedSceneOptionRule)) {
                    options.push(...getSceneMarketingGoalFallbackList(normalizedSceneName));
                }
                return uniqueBy(
                    options
                        .map(item => normalizeSceneOptionText(item))
                        .filter(item => isLikelySceneOptionValue(item))
                        .filter(item => !SCENE_DYNAMIC_FIELD_BLOCK_RE.test(item)),
                    item => item
                ).slice(0, 24);
            };

            const filterSceneOptionsByType = ({ sceneName = '', fieldLabel = '', options = [], fallbackOptions = [] }) => {
                const optionType = resolveSceneFieldOptionType(fieldLabel);
                const normalizedOptions = uniqueBy(
                    (Array.isArray(options) ? options : [])
                        .map(item => normalizeSceneOptionText(item))
                        .filter(item => isLikelySceneOptionValue(item))
                        .filter(item => !SCENE_DYNAMIC_FIELD_BLOCK_RE.test(item)),
                    item => item
                );
                const normalizedFallback = uniqueBy(
                    (Array.isArray(fallbackOptions) ? fallbackOptions : [])
                        .map(item => normalizeSceneOptionText(item))
                        .filter(item => isLikelySceneOptionValue(item))
                        .filter(item => !SCENE_DYNAMIC_FIELD_BLOCK_RE.test(item)),
                    item => item
                );
                if (!SCENE_STRICT_OPTION_TYPE_SET.has(optionType)) {
                    return uniqueBy(normalizedOptions.concat(normalizedFallback), item => item).slice(0, 24);
                }
                if (!normalizedFallback.length) {
                    return normalizedOptions.slice(0, 24);
                }
                const matched = normalizedOptions.filter(item => normalizedFallback.some(seed => isSceneOptionMatch(item, seed)));
                const merged = matched.length
                    ? uniqueBy(matched.concat(normalizedFallback), item => item)
                    : normalizedFallback.slice();
                if (optionType === 'goal' && /营销目标/.test(normalizeSceneLabelToken(fieldLabel))) {
                    const sceneGoals = getSceneMarketingGoalFallbackList(sceneName);
                    if (sceneGoals.length) {
                        const goalMatched = merged.filter(item => sceneGoals.some(goal => isSceneOptionMatch(item, goal)));
                        if (goalMatched.length) return uniqueBy(goalMatched.concat(sceneGoals), item => item).slice(0, 24);
                        return uniqueBy(sceneGoals.concat(merged), item => item).slice(0, 24);
                    }
                }
                return merged.slice(0, 24);
            };

            const toOptionGroupMap = (entry = {}) => {
                const map = {};
                (entry.sections || []).forEach(section => {
                    const title = String(section?.title || '').trim();
                    const options = Array.isArray(section?.options)
                        ? section.options.map(item => normalizeSceneOptionText(item)).filter(item => isLikelySceneOptionValue(item))
                        : [];
                    if (!title || options.length < 2) return;
                    map[title] = uniqueBy((map[title] || []).concat(options), item => item).slice(0, 12);
                });
                (entry.optionGroups || []).forEach(group => {
                    const title = String(group?.label || '').trim();
                    const options = Array.isArray(group?.options)
                        ? group.options.map(item => normalizeSceneOptionText(item)).filter(item => isLikelySceneOptionValue(item))
                        : [];
                    if (!title || options.length < 2) return;
                    map[title] = uniqueBy((map[title] || []).concat(options), item => item).slice(0, 12);
                });
                (entry.radios || []).forEach(radio => {
                    const title = String(radio?.label || '').trim();
                    const text = normalizeSceneOptionText(radio?.text || '');
                    if (!isLikelySceneOptionValue(text)) return;
                    if (!title || !text) return;
                    map[title] = uniqueBy((map[title] || []).concat([text]), item => item).slice(0, 12);
                });
                return map;
            };

            const buildProfileFromSceneSpec = (sceneName = '', spec = null) => {
                const fieldList = Array.isArray(spec?.fields) ? spec.fields : [];
                const requiredFields = [];
                const optionGroups = {};
                const fieldDefaults = {};
                const fieldMeta = {};
                fieldList.forEach(field => {
                    const label = normalizeText(field?.settingKey || field?.label || '').replace(/[：:]/g, '').trim();
                    if (!label || !isLikelyFieldLabel(label)) return;
                    requiredFields.push(label);
                    const key = normalizeSceneFieldKey(label);
                    const rawOptions = uniqueBy(
                        (Array.isArray(field?.options) ? field.options : [])
                            .map(item => normalizeSceneOptionText(item))
                            .filter(item => isLikelySceneOptionValue(item)),
                        item => item
                    ).slice(0, 36);
                    const options = filterSceneOptionsByType({
                        sceneName,
                        fieldLabel: label,
                        options: rawOptions,
                        fallbackOptions: resolveSceneFallbackOptionSeed(sceneName, label)
                    });
                    if (options.length) optionGroups[label] = options;
                    const defaultValue = normalizeSceneSettingValue(field?.defaultValue || '');
                    if (defaultValue) fieldDefaults[key] = defaultValue;
                    fieldMeta[key] = {
                        key,
                        label,
                        options,
                        defaultValue,
                        requiredGuess: !!field?.requiredGuess,
                        criticalGuess: !!field?.criticalGuess,
                        triggerPath: normalizeText(field?.triggerPath || ''),
                        dependsOn: Array.isArray(field?.dependsOn)
                            ? uniqueBy(field.dependsOn.map(item => normalizeText(item)).filter(Boolean), item => item).slice(0, 10)
                            : []
                    };
                });
                const dedupRequiredFields = uniqueBy(requiredFields, item => item);
                return {
                    sceneName,
                    requiredFields: dedupRequiredFields,
                    optionGroups,
                    fieldDefaults,
                    fieldMeta,
                    source: 'scene_spec',
                    coverage: deepClone(spec?.coverage || {})
                };
            };
            const normalizeContractPathKeyForSceneField = (rawPath = '') => {
                let path = String(rawPath || '').trim();
                if (!path) return '';
                path = path.replace(/^(campaign|adgroup)\./i, '');
                if (path.includes('[]')) {
                    path = path.split('[]')[0];
                }
                path = path.replace(/\.+/g, '.').replace(/^\.+|\.+$/g, '');
                return path;
            };
            const inferApiFieldOptionsFromDefault = (fieldPath = '', defaultValue = '') => {
                const options = [];
                const valueText = normalizeSceneSettingValue(defaultValue);
                if (/^(true|false)$/i.test(valueText)) {
                    options.push('true', 'false');
                }
                if (/^(0|1)$/.test(valueText) || /(switch|status|smartcreative)$/i.test(fieldPath)) {
                    options.push('1', '0');
                }
                return uniqueBy(
                    options.map(item => normalizeSceneSettingValue(item)).filter(Boolean),
                    item => item
                ).slice(0, 8);
            };
            const buildProfileFromApiContracts = (sceneName = '') => {
                const requiredFields = [];
                const optionGroups = {};
                const fieldDefaults = {};
                const fieldMeta = {};
                const pushField = (fieldLabel = '', defaultValue = '', options = [], source = 'api_contract') => {
                    const label = normalizeText(fieldLabel).replace(/[：:]/g, '').trim();
                    if (!label) return;
                    const key = normalizeSceneFieldKey(label);
                    const normalizedDefault = normalizeSceneSettingValue(defaultValue);
                    const normalizedOptions = uniqueBy(
                        (Array.isArray(options) ? options : [])
                            .map(item => normalizeSceneSettingValue(item))
                            .filter(Boolean),
                        item => item
                    ).slice(0, 16);
                    requiredFields.push(label);
                    if (normalizedDefault) fieldDefaults[key] = normalizedDefault;
                    if (normalizedOptions.length >= 2) optionGroups[label] = normalizedOptions;
                    fieldMeta[key] = {
                        key,
                        label,
                        options: normalizedOptions,
                        defaultValue: normalizedDefault,
                        requiredGuess: true,
                        criticalGuess: false,
                        triggerPath: '',
                        dependsOn: [],
                        source: [source]
                    };
                };

                const goalSpecs = getSceneCachedGoalSpecs(sceneName);
                const sceneContracts = listCachedSceneCreateContracts(sceneName)
                    .map(item => (isPlainObject(item?.contract) ? item.contract : null))
                    .filter(Boolean);
                const allContracts = [];
                goalSpecs.forEach(goal => {
                    if (isPlainObject(goal?.createContract)) {
                        allContracts.push(goal.createContract);
                    }
                });
                allContracts.push(...sceneContracts);

                const ensureByPath = (prefix = '', path = '', defaultValue = '', source = 'api_contract') => {
                    const normalizedPath = normalizeContractPathKeyForSceneField(path);
                    if (!normalizedPath) return;
                    const fieldLabel = `${prefix}.${normalizedPath}`;
                    const optionSeed = inferApiFieldOptionsFromDefault(fieldLabel, defaultValue);
                    pushField(fieldLabel, defaultValue, optionSeed, source);
                };

                allContracts.forEach(contract => {
                    const defaultCampaign = isPlainObject(contract?.defaultCampaign) ? contract.defaultCampaign : {};
                    const defaultAdgroup = isPlainObject(contract?.defaultAdgroup) ? contract.defaultAdgroup : {};
                    const campaignPairs = flattenObjectToSceneSettingKeyValues(defaultCampaign, '', { maxDepth: 6 });
                    const adgroupPairs = flattenObjectToSceneSettingKeyValues(defaultAdgroup, '', { maxDepth: 6 });
                    campaignPairs.forEach(pair => {
                        ensureByPath('campaign', pair.key, pair.value, 'api_contract.default_campaign');
                    });
                    adgroupPairs.forEach(pair => {
                        ensureByPath('adgroup', pair.key, pair.value, 'api_contract.default_adgroup');
                    });
                    (Array.isArray(contract?.campaignKeyPaths) ? contract.campaignKeyPaths : [])
                        .map(item => normalizeContractPathKeyForSceneField(item))
                        .filter(Boolean)
                        .slice(0, 800)
                        .forEach(path => ensureByPath('campaign', path, '', 'api_contract.campaign_key_path'));
                    (Array.isArray(contract?.adgroupKeyPaths) ? contract.adgroupKeyPaths : [])
                        .map(item => normalizeContractPathKeyForSceneField(item))
                        .filter(Boolean)
                        .slice(0, 800)
                        .forEach(path => ensureByPath('adgroup', path, '', 'api_contract.adgroup_key_path'));
                });

                return {
                    sceneName,
                    requiredFields: uniqueBy(requiredFields, item => item).slice(0, 1200),
                    optionGroups,
                    fieldDefaults,
                    fieldMeta,
                    source: 'api_contract'
                };
            };

            const buildSceneProfiles = () => {
                const profiles = {};
                SCENE_OPTIONS.forEach(sceneName => {
                    profiles[sceneName] = {
                        sceneName,
                        requiredFields: (SCENE_REQUIREMENT_FALLBACK[sceneName] || []).slice(),
                        optionGroups: {},
                        fieldDefaults: {},
                        fieldMeta: {},
                        source: 'fallback'
                    };
                });

                SCENE_OPTIONS.forEach(sceneName => {
                    const sceneBizCode = resolveSceneBizCodeHint(sceneName) || SCENE_BIZCODE_HINT_FALLBACK[sceneName] || '';
                    const cachedSpec = getCachedSceneSpec(sceneName, sceneBizCode);
                    if (!cachedSpec?.ok || !Array.isArray(cachedSpec?.fields)) return;
                    const specProfile = buildProfileFromSceneSpec(sceneName, cachedSpec);
                    if (!specProfile.requiredFields.length) return;
                    profiles[sceneName] = {
                        ...profiles[sceneName],
                        ...specProfile,
                        requiredFields: uniqueBy(
                            (specProfile.requiredFields || []).concat(profiles[sceneName]?.requiredFields || []),
                            item => item
                        ).slice(0, 1200),
                        optionGroups: mergeDeep({}, profiles[sceneName]?.optionGroups || {}, specProfile.optionGroups || {}),
                        fieldDefaults: mergeDeep({}, profiles[sceneName]?.fieldDefaults || {}, specProfile.fieldDefaults || {}),
                        fieldMeta: mergeDeep({}, profiles[sceneName]?.fieldMeta || {}, specProfile.fieldMeta || {}),
                        source: 'scene_spec'
                    };
                });

                SCENE_OPTIONS.forEach(sceneName => {
                    const apiProfile = buildProfileFromApiContracts(sceneName);
                    if (!apiProfile.requiredFields.length) return;
                    profiles[sceneName] = {
                        ...profiles[sceneName],
                        requiredFields: uniqueBy(
                            (profiles[sceneName]?.requiredFields || []).concat(apiProfile.requiredFields || []),
                            item => item
                        ).slice(0, 1200),
                        optionGroups: mergeDeep({}, profiles[sceneName]?.optionGroups || {}, apiProfile.optionGroups || {}),
                        fieldDefaults: mergeDeep({}, profiles[sceneName]?.fieldDefaults || {}, apiProfile.fieldDefaults || {}),
                        fieldMeta: mergeDeep({}, profiles[sceneName]?.fieldMeta || {}, apiProfile.fieldMeta || {}),
                        source: profiles[sceneName]?.source === 'scene_spec' ? 'scene_spec+api_contract' : 'api_contract'
                    };
                });

                const scan = window.__AM_WXT_LAST_SCENE_SCAN__;
                if (!scan || !Array.isArray(scan.list)) return profiles;

                scan.list.forEach(entry => {
                    if (!entry?.ok) return;
                    const sceneName = String(entry.sceneName || '').trim();
                    if (!SCENE_OPTIONS.includes(sceneName)) return;
                    const profile = profiles[sceneName] || {
                        sceneName,
                        requiredFields: [],
                        optionGroups: {},
                        fieldDefaults: {},
                        fieldMeta: {},
                        source: 'scan'
                    };
                    const dynamicFields = uniqueBy([
                        ...(profile.requiredFields || []),
                        ...(entry.labels || []).filter(text => isLikelyFieldLabel(text)).slice(0, 20),
                        ...(entry.sectionTitles || []).filter(text => isLikelyFieldLabel(text)).slice(0, 10)
                    ], item => item).slice(0, 1200);
                    profile.requiredFields = dynamicFields;
                    profile.optionGroups = mergeDeep(profile.optionGroups || {}, toOptionGroupMap(entry));
                    if (String(profile.source || '').includes('api_contract')) {
                        profile.source = `${profile.source}+scan`;
                    } else {
                        profile.source = profile.source === 'scene_spec' ? 'scene_spec' : 'scan';
                    }
                    profiles[sceneName] = profile;
                });
                return profiles;
            };

            const getSceneProfile = (sceneName) => {
                if (!isPlainObject(wizardState.sceneProfiles) || !Object.keys(wizardState.sceneProfiles).length) {
                    wizardState.sceneProfiles = buildSceneProfiles();
                }
                return wizardState.sceneProfiles?.[sceneName] || {
                    sceneName,
                    requiredFields: (SCENE_REQUIREMENT_FALLBACK[sceneName] || []).slice(),
                    optionGroups: {},
                    fieldDefaults: {},
                    fieldMeta: {},
                    source: 'fallback'
                };
            };

            const refreshSceneProfileFromSpec = async (sceneName = '', options = {}) => {
                const targetSceneName = String(sceneName || '').trim();
                if (!targetSceneName || !SCENE_OPTIONS.includes(targetSceneName)) return null;
                const requestId = toNumber(wizardState.sceneProfileRequestId, 0) + 1;
                wizardState.sceneProfileRequestId = requestId;
                const scanMode = options.scanMode || 'full_top_down';
                const unlockPolicy = options.unlockPolicy || 'safe_only';
                const refresh = !!options.refresh;
                const silent = options.silent !== false;
                try {
                    const spec = await getSceneSpec(targetSceneName, {
                        scanMode,
                        unlockPolicy,
                        goalScan: options.goalScan !== false,
                        refresh
                    });
                    if (requestId !== wizardState.sceneProfileRequestId) return spec;
                    if (!spec?.ok || !Array.isArray(spec?.fields) || !spec.fields.length) {
                        if (!silent) {
                            appendWizardLog(`场景设置同步失败：${targetSceneName} 未获取到有效字段`, 'error');
                        }
                        return spec;
                    }
                    wizardState.sceneProfiles = buildSceneProfiles();
                    const currentScene = String(wizardState.els.sceneSelect?.value || wizardState.draft?.sceneName || '').trim();
                    if (currentScene === targetSceneName) {
                        commitSceneDynamicUiState({ renderSceneDynamic: true });
                    }
                    if (!silent) {
                        appendWizardLog(`场景设置已对齐：${targetSceneName}（字段 ${spec.fields.length}，目标 ${(spec.goals || []).length}）`, 'success');
                    }
                    return spec;
                } catch (err) {
                    if (!silent) {
                        appendWizardLog(`场景设置同步异常：${err?.message || err}`, 'error');
                    }
                    return null;
                }
            };

            const resolveSceneFieldOptions = (profile, fieldLabel) => {
                const sceneName = String(profile?.sceneName || wizardState?.els?.sceneSelect?.value || wizardState?.draft?.sceneName || '').trim();
                const normalizedKey = normalizeSceneFieldKey(fieldLabel);
                const token = normalizeSceneLabelToken(fieldLabel);
                const metaOptions = Array.isArray(profile?.fieldMeta?.[normalizedKey]?.options)
                    ? profile.fieldMeta[normalizedKey].options
                    : [];
                const options = [];
                if (metaOptions.length) options.push(...metaOptions);
                const groups = isPlainObject(profile?.optionGroups) ? profile.optionGroups : {};
                Object.keys(groups).forEach(groupLabel => {
                    if (!groupLabel) return;
                    if (!isSceneLabelMatch(fieldLabel, groupLabel)) return;
                    options.push(...(groups[groupLabel] || []));
                });
                const componentRows = Array.isArray(componentConfigCache?.data?.summary?.fieldRows)
                    ? componentConfigCache.data.summary.fieldRows
                    : [];
                componentRows.forEach(row => {
                    if (!isSceneLabelMatch(fieldLabel, row?.label || '')) return;
                    options.push(...(Array.isArray(row?.options) ? row.options : []));
                });
                if (/^(campaign\.|adgroup\.)/i.test(token)) {
                    return uniqueBy(
                        options.map(item => normalizeSceneSettingValue(item)).filter(Boolean),
                        item => item
                    ).slice(0, 24);
                }
                const fallbackOptions = resolveSceneFallbackOptionSeed(sceneName, fieldLabel);
                const filteredOptions = filterSceneOptionsByType({
                    sceneName,
                    fieldLabel,
                    options,
                    fallbackOptions
                });
                if (filteredOptions.length) return filteredOptions.slice(0, 24);
                return fallbackOptions.slice(0, 24);
            };

            const resolveSceneFieldHeuristicDefault = (fieldLabel = '', options = []) => {
                const normalizedLabel = normalizeSceneLabelToken(fieldLabel);
                const optionList = Array.isArray(options) ? options : [];
                const currentSceneName = String(wizardState?.els?.sceneSelect?.value || wizardState?.draft?.sceneName || '关键词推广').trim() || '关键词推广';
                const fallbackOptions = resolveSceneFallbackOptionSeed(currentSceneName, normalizedLabel);
                const sceneDefaults = isPlainObject(SCENE_SPEC_FIELD_FALLBACK[currentSceneName]) ? SCENE_SPEC_FIELD_FALLBACK[currentSceneName] : {};
                const hasVisibleNativeHint = (pattern) => {
                    try {
                        const re = pattern instanceof RegExp ? pattern : new RegExp(String(pattern || ''), 'i');
                        if (!re) return false;
                        const nodes = document.querySelectorAll('div,span,label,button,strong,p,li,a');
                        for (let i = 0; i < nodes.length; i++) {
                            const el = nodes[i];
                            if (!(el instanceof Element)) continue;
                            if (!isElementVisible(el)) continue;
                            const text = normalizeText(getOwnText(el) || el.textContent || '');
                            if (!text) continue;
                            if (re.test(text)) return true;
                        }
                    } catch { }
                    return false;
                };
                const pickByText = (candidate = '', fallbackRaw = false) => {
                    const mapped = pickSceneValueFromOptions(candidate, optionList);
                    if (mapped) return mapped;
                    if (!fallbackRaw) return '';
                    return toShortSceneValue(candidate);
                };
                const extractSceneConstraintValue = () => {
                    const hasConstraintContext = (text = '') => /投产比|ROI|出价目标|净目标|约束|目标值/i.test(normalizeText(text));
                    const normalizeNumericText = (raw = '') => {
                        const num = parseNumberFromSceneValue(raw);
                        if (!Number.isFinite(num) || num <= 0) return '';
                        if (num > 9999) return '';
                        return toShortSceneValue(String(num));
                    };
                    const tryContainerValue = (el) => {
                        if (!(el instanceof Element)) return '';
                        const container = el.closest('label,li,div,section') || el;
                        const containerText = normalizeText(container?.textContent || '');
                        if (!hasConstraintContext(containerText)) return '';
                        const textValue = normalizeNumericText(container?.textContent || '');
                        if (textValue) return textValue;
                        const siblingInput = container?.querySelector?.('input:not([type="radio"]):not([type="checkbox"])');
                        const inputValue = normalizeNumericText(siblingInput?.value || '');
                        if (inputValue) return inputValue;
                        return '';
                    };
                    try {
                        const checkedRadios = Array.from(document.querySelectorAll('input[type="radio"]:checked,[role="radio"][aria-checked="true"]'));
                        for (const radio of checkedRadios) {
                            if (!(radio instanceof Element) || !isElementVisible(radio)) continue;
                            const fromContainer = tryContainerValue(radio);
                            if (fromContainer) return fromContainer;
                        }
                        const focusHints = Array.from(document.querySelectorAll('div,span,label,strong,p,li'))
                            .filter(el => el instanceof Element && isElementVisible(el))
                            .map(el => normalizeText(el.textContent || ''))
                            .filter(Boolean)
                            .filter(text => /投产比|ROI|出价目标|净目标/.test(text));
                        for (const text of focusHints) {
                            const fromHint = normalizeNumericText(text);
                            if (fromHint) return fromHint;
                        }
                    } catch { }
                    return '';
                };
                if (!normalizedLabel) return '';

                if (currentSceneName === '货品全站推广') {
                    if (/营销场景/.test(normalizedLabel)) {
                        if (hasVisibleNativeHint(/全域投放\s*[·.]?\s*ROI确定交付/i)) {
                            return pickByText('全域投放 · ROI确定交付', true)
                                || pickByText('全域投放ROI确定交付', true);
                        }
                    }
                    if (/预算类型/.test(normalizedLabel)) {
                        if (hasVisibleNativeHint(/不限预算/)) {
                            return pickByText('不限预算', true);
                        }
                    }
                    if (/出价方式/.test(normalizedLabel)) {
                        if (hasVisibleNativeHint(/控投产比投放|控投产比/)) {
                            return pickByText('控投产比投放', true)
                                || pickByText('控投产比', true);
                        }
                        if (hasVisibleNativeHint(/最大化拿量/)) {
                            return pickByText('最大化拿量', true);
                        }
                        if (hasVisibleNativeHint(/控成本投放|控成本/)) {
                            return pickByText('控成本', true);
                        }
                    }
                    if (/(出价目标|优化目标)/.test(normalizedLabel)) {
                        if (hasVisibleNativeHint(/增加净成交金额|净成交金额/)) {
                            return pickByText('增加净成交金额', true);
                        }
                        if (hasVisibleNativeHint(/增加总成交金额|总成交金额/)) {
                            return pickByText('增加总成交金额', true);
                        }
                        if (hasVisibleNativeHint(/净目标投产比|目标投产比|ROI/i)) {
                            return pickByText('净目标投产比', true)
                                || pickByText('稳定投产比', true);
                        }
                    }
                    if (/(目标投产比|ROI目标值|出价目标值|约束值|目标值)/.test(normalizedLabel)) {
                        const fromConstraint = extractSceneConstraintValue();
                        if (fromConstraint) return fromConstraint;
                        const runtimeConstraintValue = parseNumberFromSceneValue(
                            runtimeCache?.value?.storeData?.constraintValue
                            || runtimeCache?.value?.solutionTemplate?.campaign?.constraintValue
                            || ''
                        );
                        if (Number.isFinite(runtimeConstraintValue) && runtimeConstraintValue > 0) {
                            return toShortSceneValue(String(runtimeConstraintValue));
                        }
                        const fromDefaults = parseNumberFromSceneValue(
                            sceneDefaults[normalizedLabel]
                            || sceneDefaults.目标投产比
                            || sceneDefaults.净目标投产比
                            || ''
                        );
                        if (Number.isFinite(fromDefaults) && fromDefaults > 0) {
                            return toShortSceneValue(String(fromDefaults));
                        }
                    }
                    if (/(投放调优|优化模式)/.test(normalizedLabel)) {
                        if (hasVisibleNativeHint(/多目标优化|多目标/)) {
                            return pickByText('多目标优化', true);
                        }
                        if (hasVisibleNativeHint(/日常优化/)) {
                            return pickByText('日常优化', true);
                        }
                    }
                    if (/(投放时间|投放日期|分时折扣|发布日期|排期)/.test(normalizedLabel)) {
                        if (hasVisibleNativeHint(/长期投放|不限时段|全天|24小时/)) {
                            return pickByText('长期投放', true) || pickByText('不限时段', true);
                        }
                    }
                    if (/(投放地域|地域设置)/.test(normalizedLabel)) {
                        if (hasVisibleNativeHint(/全部地域|全国|不限地域|全部地区/)) {
                            return pickByText('全部地域', true);
                        }
                    }
                    if (/(计划组|设置计划组)/.test(normalizedLabel)) {
                        if (hasVisibleNativeHint(/设置计划组|计划组/)) {
                            return pickByText('不设置计划组', true);
                        }
                    }
                }

                if (/预算类型/.test(normalizedLabel)) {
                    const budgetType = String(wizardState?.els?.budgetTypeSelect?.value || wizardState?.draft?.strategyList?.[0]?.budgetType || 'day_average').trim();
                    const preferred = budgetType === 'day_budget' ? '每日预算' : '日均预算';
                    return pickByText(preferred, true)
                        || pickByText(sceneDefaults.预算类型 || '', true)
                        || pickByText(fallbackOptions[0] || '', true)
                        || pickByText('每日预算', true)
                        || pickByText('日均预算', true);
                }

                if (/(营销目标|选择卡位方案|选择拉新方案|选择方案|选择优化方向|选择解决方案|投放策略|推广模式|卡位方式|选择方式)/.test(normalizedLabel)) {
                    const defaultGoal = normalizeSceneSettingValue(
                        sceneDefaults[normalizedLabel]
                        || sceneDefaults.营销目标
                        || sceneDefaults.优化目标
                        || ''
                    );
                    const fallbackGoal = getSceneMarketingGoalFallbackList(currentSceneName)[0] || '';
                    return pickByText(defaultGoal, true)
                        || pickByText(fallbackOptions[0] || '', true)
                        || pickByText(fallbackGoal, true);
                }

                if (/(出价方式)/.test(normalizedLabel)) {
                    if (currentSceneName === '关键词推广') {
                        const bidMode = normalizeBidMode(wizardState?.els?.bidModeSelect?.value || wizardState?.draft?.bidMode || 'smart', 'smart');
                        const preferred = bidMode === 'manual' ? '手动出价' : '智能出价';
                        return pickByText(preferred, true)
                            || pickByText('智能出价', true)
                            || pickByText('手动出价', true);
                    }
                    return pickByText(sceneDefaults[normalizedLabel] || '', true)
                        || pickByText(sceneDefaults.出价方式 || '', true)
                        || pickByText(fallbackOptions[0] || '', true);
                }

                if (/(出价目标|优化目标)/.test(normalizedLabel)) {
                    const bidTargetValue = String(wizardState?.els?.bidTargetSelect?.value || DEFAULTS.bidTargetV2).trim() || DEFAULTS.bidTargetV2;
                    const bidTargetLabel = BID_TARGET_OPTIONS.find(item => item.value === bidTargetValue)?.label || '获取成交量';
                    return pickByText(bidTargetLabel, true)
                        || pickByText(sceneDefaults[normalizedLabel] || '', true)
                        || pickByText(sceneDefaults.出价目标 || '', true)
                        || pickByText(sceneDefaults.优化目标 || '', true)
                        || pickByText(fallbackOptions[0] || '', true)
                        || pickByText('获取成交量', true)
                        || pickByText('增加成交金额', true)
                        || pickByText('优化留资获客成本', true);
                }

                if (/(计划名称|计划名)/.test(normalizedLabel)) {
                    const planName = String(wizardState?.els?.prefixInput?.value || wizardState?.draft?.planNamePrefix || buildSceneTimePrefix(currentSceneName)).trim();
                    return toShortSceneValue(planName);
                }

                if (/(每日预算|日均预算)/.test(normalizedLabel)) {
                    const budgetValue = String(wizardState?.els?.budgetInput?.value || wizardState?.draft?.dayAverageBudget || '100').trim();
                    return toShortSceneValue(budgetValue);
                }

                if (/(关键词设置|核心词设置)/.test(normalizedLabel)) {
                    return pickByText('添加关键词', true)
                        || pickByText('系统推荐词', true)
                        || pickByText('手动自选词', true);
                }
                if (/(匹配方式)/.test(normalizedLabel)) {
                    return pickByText(sceneDefaults[normalizedLabel] || '', true)
                        || pickByText(sceneDefaults.匹配方式 || '', true)
                        || pickByText('广泛', true)
                        || pickByText('中心词', true)
                        || pickByText('精准', true);
                }
                if (/(流量智选)/.test(normalizedLabel)) {
                    return pickByText(sceneDefaults[normalizedLabel] || '', true)
                        || pickByText(sceneDefaults.流量智选 || '', true)
                        || pickByText('开启', true)
                        || pickByText('关闭', true);
                }
                if (/(冷启加速)/.test(normalizedLabel)) {
                    return pickByText(sceneDefaults[normalizedLabel] || '', true)
                        || pickByText(sceneDefaults.开启冷启加速 || '', true)
                        || pickByText('开启', true)
                        || pickByText('关闭', true);
                }

                if (/(人群设置|种子人群)/.test(normalizedLabel)) {
                    return pickByText('智能人群', true)
                        || pickByText('设置优先投放客户', true)
                        || pickByText('添加种子人群', true);
                }

                if (/(选择推广商品|选品方式|添加商品)/.test(normalizedLabel)) {
                    return pickByText(sceneDefaults[normalizedLabel] || '', true)
                        || pickByText(sceneDefaults.添加商品 || '', true)
                        || pickByText('全部商品', true)
                        || pickByText('机会品推荐', true)
                        || pickByText('自定义选品', true)
                        || pickByText('好货快投-大家电专享', true)
                        || pickByText('行业推荐选品', true);
                }

                if (/(投放日期|投放时间|分时折扣|排期)/.test(normalizedLabel)) {
                    return pickByText('长期投放', true) || pickByText('不限时段', true);
                }

                return '';
            };

            const resolveSceneFieldDefaultValue = ({ fieldLabel = '', options = [], schema = null }) => {
                const optionList = Array.isArray(options) ? options : [];
                const strictField = SCENE_STRICT_OPTION_TYPE_SET.has(resolveSceneFieldOptionType(fieldLabel));
                const pickFromCandidate = (candidate = '', fallbackRaw = false) => {
                    const mapped = pickSceneValueFromOptions(candidate, optionList);
                    if (mapped) return mapped;
                    if (!fallbackRaw || (strictField && optionList.length > 0)) return '';
                    return toShortSceneValue(candidate);
                };

                if (isPlainObject(schema)) {
                    const matchedSelects = (Array.isArray(schema.selects) ? schema.selects : [])
                        .filter(item => isSceneLabelMatch(item?.label, fieldLabel));
                    for (const selectItem of matchedSelects) {
                        const selectedOption = (selectItem.options || []).find(opt => opt?.selected) || null;
                        const fromSelectedLabel = pickFromCandidate(selectedOption?.label || '', true);
                        if (fromSelectedLabel) return fromSelectedLabel;
                        const fromSelectedValue = pickFromCandidate(selectedOption?.value || '', true);
                        if (fromSelectedValue) return fromSelectedValue;
                        const fromSelectValue = pickFromCandidate(selectItem.value || '', true);
                        if (fromSelectValue) return fromSelectValue;
                    }

                    const matchedRadios = (Array.isArray(schema.radios) ? schema.radios : [])
                        .filter(item => item?.checked && isSceneLabelMatch(item?.label, fieldLabel));
                    for (const radioItem of matchedRadios) {
                        const fromRadio = pickFromCandidate(radioItem.text || '', false);
                        if (fromRadio) return fromRadio;
                        const firstToken = String(radioItem.text || '').split(/[，。,.；;：:\s]/)[0] || '';
                        const fromToken = pickFromCandidate(firstToken, true);
                        if (fromToken) return fromToken;
                    }

                    const matchedInputs = (Array.isArray(schema.inputs) ? schema.inputs : [])
                        .filter(item => isSceneLabelMatch(item?.label, fieldLabel));
                    for (const inputItem of matchedInputs) {
                        const fromInput = toShortSceneValue(inputItem.value || '');
                        if (fromInput) return fromInput;
                    }

                    const matchedGroups = (Array.isArray(schema.optionGroups) ? schema.optionGroups : [])
                        .filter(item => isSceneLabelMatch(item?.label, fieldLabel));
                    for (const groupItem of matchedGroups) {
                        const firstOption = String((groupItem.options || [])[0] || '').trim();
                        const fromGroup = pickFromCandidate(firstOption, true);
                        if (fromGroup) return fromGroup;
                    }
                }

                const heuristicDefault = normalizeSceneSettingValue(resolveSceneFieldHeuristicDefault(fieldLabel, optionList));
                if (heuristicDefault) return heuristicDefault;
                if (optionList.length) return optionList[0];
                return '';
            };

            const autoFillSceneDefaults = ({ sceneName = '', profile = {}, fields = [], bucket = {} }) => {
                const targetSceneName = String(sceneName || '').trim();
                if (!targetSceneName || !Array.isArray(fields) || !fields.length) return 0;
                const missingFields = fields.filter(fieldLabel => {
                    const key = normalizeSceneFieldKey(fieldLabel);
                    if (!key) return false;
                    if (normalizeSceneSettingValue(bucket[key]) !== '') return false;
                    return true;
                });
                if (!missingFields.length) return 0;

                let schema = null;
                try {
                    schema = scanCurrentSceneSettings(targetSceneName);
                } catch {
                    schema = null;
                }

                let fillCount = 0;
                missingFields.forEach(fieldLabel => {
                    const key = normalizeSceneFieldKey(fieldLabel);
                    const options = resolveSceneFieldOptions(profile, fieldLabel);
                    const scannedValue = normalizeSceneSettingValue(resolveSceneFieldDefaultValue({
                        fieldLabel,
                        options,
                        schema
                    }));
                    if (scannedValue) {
                        bucket[key] = scannedValue;
                        fillCount += 1;
                        return;
                    }
                    const profileDefaultValue = normalizeSceneSettingValue(
                        profile?.fieldMeta?.[key]?.defaultValue
                        || profile?.fieldDefaults?.[key]
                        || ''
                    );
                    if (profileDefaultValue) {
                        bucket[key] = profileDefaultValue;
                        fillCount += 1;
                        return;
                    }
                    const fallbackDefaultValue = normalizeSceneSettingValue(
                        SCENE_SPEC_FIELD_FALLBACK?.[targetSceneName]?.[normalizeSceneRenderFieldLabel(fieldLabel) || fieldLabel]
                        || ''
                    );
                    if (fallbackDefaultValue) {
                        bucket[key] = fallbackDefaultValue;
                        fillCount += 1;
                        return;
                    }
                    if (options.length) {
                        bucket[key] = options[0];
                        fillCount += 1;
                    }
                });
                return fillCount;
            };

            const syncSceneSettingValuesFromUI = () => {
                const sceneName = String(wizardState.els.sceneSelect?.value || wizardState.draft?.sceneName || '关键词推广').trim();
                if (!sceneName) return;
                const bucket = ensureSceneSettingBucket(sceneName);
                const controls = wizardState.els.sceneDynamic?.querySelectorAll('[data-scene-field]') || [];
                controls.forEach(control => {
                    const key = String(control.getAttribute('data-scene-field') || '').trim();
                    if (!key) return;
                    bucket[key] = normalizeSceneSettingValue(control.value);
                });
            };

            const buildSceneSettingsPayload = (sceneName = '') => {
                const targetSceneName = String(sceneName || wizardState?.draft?.sceneName || '关键词推广').trim() || '关键词推广';
                const profile = getSceneProfile(targetSceneName);
                const bucket = ensureSceneSettingBucket(targetSceneName);
                const touchedBucket = ensureSceneTouchedBucket(targetSceneName);
                const labelMap = {};
                if (isPlainObject(profile?.fieldMeta)) {
                    Object.keys(profile.fieldMeta).forEach(key => {
                        const meta = profile.fieldMeta[key];
                        const label = normalizeSceneRenderFieldLabel(meta?.label || key);
                        const normalizedKey = normalizeSceneFieldKey(label);
                        if (!label || !normalizedKey) return;
                        if (!labelMap[normalizedKey]) labelMap[normalizedKey] = label;
                    });
                }
                (profile?.requiredFields || []).forEach(fieldLabel => {
                    if (!shouldRenderDynamicSceneField(fieldLabel, targetSceneName)) return;
                    const label = normalizeSceneRenderFieldLabel(fieldLabel);
                    const key = normalizeSceneFieldKey(label);
                    if (!label || !key || labelMap[key]) return;
                    labelMap[key] = label;
                });
                const skippedDynamicKeySet = new Set(
                    (profile?.requiredFields || [])
                        .filter(fieldLabel => !shouldRenderDynamicSceneField(fieldLabel, targetSceneName))
                        .map(fieldLabel => normalizeSceneFieldKey(normalizeSceneRenderFieldLabel(fieldLabel)))
                        .filter(Boolean)
                );
                const preserveDynamicKeySet = new Set(
                    ['投放调优', '优化目标', '多目标预算', '一键起量预算', '专属权益', '发布日期', '投放时间', '投放地域', '计划组', '目标投产比']
                        .map(label => normalizeSceneFieldKey(label))
                        .filter(Boolean)
                );
                const hiddenSceneSettingKeySet = new Set(
                    [
                        normalizeSceneFieldKey('campaign.bidTargetV2'),
                        normalizeSceneFieldKey('campaign.optimizeTarget')
                    ].filter(Boolean)
                );

                const sceneSettings = {};
                Object.keys(bucket || {}).forEach(rawKey => {
                    const key = normalizeText(rawKey).replace(/[：:]/g, '').trim();
                    if (hiddenSceneSettingKeySet.has(key)) return;
                    if (skippedDynamicKeySet.has(key) && !preserveDynamicKeySet.has(key)) return;
                    const value = normalizeSceneSettingValue(bucket[rawKey]);
                    if (!key || !value) return;
                    const mappedLabel = labelMap[key] || normalizeSceneRenderFieldLabel(key) || key;
                    if (!isSceneFieldConnectedToPayload(mappedLabel)) return;
                    sceneSettings[mappedLabel] = value;
                });
                const crowdGoalForSettings = normalizeGoalLabel(
                    sceneSettings.营销目标
                    || sceneSettings.选择拉新方案
                    || sceneSettings.投放策略
                    || bucket[normalizeSceneFieldKey('营销目标')]
                    || bucket[normalizeSceneFieldKey('选择拉新方案')]
                    || bucket[normalizeSceneFieldKey('投放策略')]
                    || ''
                );
                const isCrowdCustomGoal = targetSceneName === '人群推广' && crowdGoalForSettings === '自定义推广';
                if (isCrowdCustomGoal) {
                    const crowdBidTypeSeed = normalizeSceneSettingValue(
                        sceneSettings.出价方式
                        || bucket[normalizeSceneFieldKey('出价方式')]
                        || bucket[normalizeSceneFieldKey('campaign.bidTypeV2')]
                        || ''
                    );
                    const crowdBidMode = normalizeBidMode(
                        mapSceneBidTypeValue(crowdBidTypeSeed, '人群推广') || crowdBidTypeSeed,
                        'manual'
                    );
                    sceneSettings.出价方式 = crowdBidMode === 'smart' ? '智能出价' : '手动出价';
                    const crowdTargetSeed = normalizeSceneSettingValue(
                        sceneSettings.出价目标
                        || sceneSettings.优化目标
                        || bucket[normalizeSceneFieldKey('出价目标')]
                        || bucket[normalizeSceneFieldKey('优化目标')]
                        || ''
                    );
                    if (crowdBidMode === 'smart') {
                        const crowdSmartTargetCode = normalizeCrowdCustomSmartBidTargetCode(crowdTargetSeed, {
                            fallback: 'display_roi'
                        });
                        sceneSettings.出价目标 = crowdCustomSmartBidTargetCodeToLabel(crowdSmartTargetCode);
                    } else {
                        const crowdTargetCode = normalizeCrowdCustomBidTargetCode(crowdTargetSeed, {
                            fallback: 'display_pay'
                        });
                        sceneSettings.出价目标 = crowdCustomBidTargetCodeToLabel(crowdTargetCode);
                    }
                    const resourcePremiumSeed = normalizeSceneSettingValue(
                        sceneSettings.资源位溢价
                        || bucket[normalizeSceneFieldKey('资源位溢价')]
                        || ''
                    );
                    sceneSettings.资源位溢价 = /(自定义|手动|关闭|停用)/.test(resourcePremiumSeed)
                        ? '自定义溢价'
                        : '默认溢价';
                    const launchSettingSeed = normalizeSceneSettingValue(
                        sceneSettings['投放地域/投放时间']
                        || bucket[normalizeSceneFieldKey('投放地域/投放时间')]
                        || ''
                    );
                    sceneSettings['投放地域/投放时间'] = /(自定义|固定|手动|编辑|配置)/.test(launchSettingSeed) && !/默认/.test(launchSettingSeed)
                        ? '自定义设置'
                        : '默认投放';
                    delete sceneSettings.优化目标;
                    delete sceneSettings['投放资源位/投放地域/分时折扣'];
                    delete sceneSettings['投放资源位/投放地域/投放时间'];
                    delete sceneSettings.投放资源位;
                    delete sceneSettings.高级设置;
                }

                const currentBidMode = normalizeBidMode(
                    wizardState?.els?.bidModeSelect?.value || wizardState?.draft?.bidMode || 'smart',
                    'smart'
                );
                const bidMode = currentBidMode;
                const bidTypeLabel = bidMode === 'manual' ? '手动出价' : '智能出价';
                const budgetTypeValue = String(wizardState?.els?.budgetTypeSelect?.value || wizardState?.draft?.strategyList?.[0]?.budgetType || 'day_average').trim();
                const budgetTypeLabel = budgetTypeValue === 'day_budget' ? '每日预算' : '日均预算';
                const scenePrefix = String(wizardState?.draft?.planNamePrefix || buildSceneTimePrefix(targetSceneName)).trim();
                const budgetValue = normalizeSceneSettingValue(wizardState?.els?.budgetInput?.value || wizardState?.draft?.dayAverageBudget || '');
                const bidTargetValue = String(wizardState?.els?.bidTargetSelect?.value || DEFAULTS.bidTargetV2).trim() || DEFAULTS.bidTargetV2;
                const bidTargetLabel = BID_TARGET_OPTIONS.find(item => item.value === bidTargetValue)?.label || '';
                const keywordModeValue = String(wizardState?.els?.modeSelect?.value || DEFAULTS.keywordMode).trim();
                const keywordModeLabelMap = {
                    mixed: '混合（手动优先 + 推荐补齐）',
                    manual: '仅手动',
                    recommend: '仅推荐'
                };
                const keywordModeLabel = keywordModeLabelMap[keywordModeValue] || keywordModeValue;
                const sceneFieldTokens = uniqueBy(
                    Object.values(labelMap || {})
                        .concat(profile?.requiredFields || [])
                        .map(item => normalizeSceneLabelToken(item))
                        .filter(Boolean),
                    item => item
                );
                const sceneFieldText = sceneFieldTokens.join(' ');
                const hasProfileField = (pattern) => pattern.test(sceneFieldText);
                const allowAutoBidType = targetSceneName === '关键词推广' || hasProfileField(/出价方式/);
                const allowAutoBidTarget = targetSceneName === '关键词推广' || hasProfileField(/出价目标|优化目标/);
                const allowAutoBudgetType = targetSceneName === '关键词推广' || hasProfileField(/预算类型/);
                const allowAutoBudgetAmount = hasProfileField(/预算|日均预算|每日预算|总预算/) || targetSceneName === '关键词推广';

                sceneSettings.场景名称 = sceneSettings.场景名称 || targetSceneName;
                if (allowAutoBidType) {
                    if (targetSceneName === '关键词推广') {
                        sceneSettings.出价方式 = bidTypeLabel;
                    } else if (!sceneSettings.出价方式) {
                        sceneSettings.出价方式 = bidTypeLabel;
                    }
                }
                if (allowAutoBudgetType && !sceneSettings.预算类型) {
                    sceneSettings.预算类型 = budgetTypeLabel;
                }
                if (!sceneSettings.计划名称) {
                    if (scenePrefix) sceneSettings.计划名称 = scenePrefix;
                }
                if (allowAutoBudgetAmount && budgetValue) {
                    if (budgetTypeValue === 'day_budget' && !sceneSettings.每日预算) {
                        sceneSettings.每日预算 = budgetValue;
                    }
                    if (budgetTypeValue !== 'day_budget' && !sceneSettings.日均预算) {
                        sceneSettings.日均预算 = budgetValue;
                    }
                }
                if (allowAutoBidTarget && bidTargetLabel) {
                    if (targetSceneName === '关键词推广') {
                        sceneSettings.出价目标 = bidTargetLabel;
                    } else if (!sceneSettings.出价目标 && !isCrowdCustomGoal) {
                        sceneSettings.出价目标 = bidTargetLabel;
                    }
                }
                if (targetSceneName === '关键词推广') {
                    if (currentBidMode === 'manual') {
                        delete sceneSettings.出价目标;
                        delete sceneSettings.优化目标;
                    }
                    const keywordGoalFromScene = resolveKeywordGoalFromSceneSettings(sceneSettings);
                    const inferredKeywordGoal = (() => {
                        if (keywordGoalFromScene) return keywordGoalFromScene;
                        const bidModeValue = normalizeBidMode(wizardState?.draft?.bidMode || 'smart', 'smart');
                        if (bidModeValue === 'manual') return '自定义推广';
                        return detectKeywordGoalFromBidTarget(bidTargetValue) || '趋势明星';
                    })();
                    if (!keywordGoalFromScene) {
                        sceneSettings.营销目标 = inferredKeywordGoal;
                        if (sceneSettings.选择卡位方案 || hasProfileField(/选择卡位方案/)) {
                            sceneSettings.选择卡位方案 = inferredKeywordGoal;
                        }
                    }
                    const keywordBidTargetSeed = normalizeSceneSettingValue(
                        sceneSettings.出价目标
                        || sceneSettings.优化目标
                        || bucket[normalizeSceneFieldKey('出价目标')]
                        || bucket[normalizeSceneFieldKey('优化目标')]
                        || bidTargetValue
                    );
                    const keywordBidTargetCode = normalizeKeywordBidTargetOptionValue(
                        mapSceneBidTargetValue(keywordBidTargetSeed) || keywordBidTargetSeed
                    ) || 'conv';
                    const keywordSubOptimizeTargetFieldKey = normalizeSceneFieldKey('campaign.subOptimizeTarget');
                    const keywordConvLabelFieldKey = normalizeSceneFieldKey('成交口径');
                    const keywordRoiConstraintFields = ['设置7日投产比', '目标投产比', 'ROI目标值', '出价目标值', '约束值'];
                    const keywordConvCostFields = ['设置平均成交成本', '平均直接成交成本', '平均成交成本', '直接成交成本', '单次成交成本', '目标成交成本', '目标成本'];
                    const keywordCartCostFields = ['设置平均收藏加购成本', '平均收藏加购成本', '目标成本'];
                    const keywordClickCostFields = ['设置平均点击成本', '平均点击成本', '点击成本', '目标成本'];
                    const clearKeywordTargetSpecificFields = (labels = []) => {
                        labels.forEach(label => {
                            const key = normalizeSceneFieldKey(label);
                            delete sceneSettings[label];
                            if (key) delete sceneSettings[key];
                        });
                    };
                    if (
                        currentBidMode !== 'manual'
                        && inferredKeywordGoal === '自定义推广'
                        && keywordBidTargetCode === 'conv'
                    ) {
                        const keywordSubOptimizeTargetSeed = normalizeSceneSettingValue(
                            sceneSettings.成交口径
                            || bucket[keywordConvLabelFieldKey]
                            || bucket[keywordSubOptimizeTargetFieldKey]
                            || runtimeCache?.value?.storeData?.subOptimizeTarget
                            || runtimeCache?.value?.solutionTemplate?.campaign?.subOptimizeTarget
                            || 'retained_buy'
                        );
                        const keywordSubOptimizeTargetCode = normalizeKeywordConvSubOptimizeTargetValue(
                            keywordSubOptimizeTargetSeed,
                            { fallback: 'retained_buy' }
                        ) || 'retained_buy';
                        sceneSettings['campaign.subOptimizeTarget'] = keywordSubOptimizeTargetCode;
                    } else {
                        delete sceneSettings['campaign.subOptimizeTarget'];
                    }
                    if (keywordBidTargetCode === 'roi') {
                        clearKeywordTargetSpecificFields(keywordConvCostFields.concat(keywordCartCostFields, keywordClickCostFields));
                    } else if (keywordBidTargetCode === 'conv') {
                        clearKeywordTargetSpecificFields(keywordRoiConstraintFields.concat(keywordCartCostFields, keywordClickCostFields));
                    } else if (keywordBidTargetCode === 'fav_cart') {
                        clearKeywordTargetSpecificFields(keywordRoiConstraintFields.concat(keywordConvCostFields, keywordClickCostFields));
                    } else if (keywordBidTargetCode === 'click') {
                        clearKeywordTargetSpecificFields(keywordRoiConstraintFields.concat(keywordConvCostFields, keywordCartCostFields));
                    } else {
                        clearKeywordTargetSpecificFields(
                            keywordRoiConstraintFields.concat(keywordConvCostFields, keywordCartCostFields, keywordClickCostFields)
                        );
                    }
                    delete sceneSettings.成交口径;
                    if (keywordModeLabel && !sceneSettings.关键词模式) {
                        sceneSettings.关键词模式 = keywordModeLabel;
                    }
                    const recommendCountValue = normalizeSceneSettingValue(wizardState?.els?.recommendCountInput?.value || '');
                    if (recommendCountValue && !sceneSettings.推荐词目标数) {
                        sceneSettings.推荐词目标数 = recommendCountValue;
                    }
                    const defaultBidValue = normalizeSceneSettingValue(wizardState?.els?.bidInput?.value || '');
                    if (defaultBidValue && !sceneSettings.默认关键词出价) {
                        sceneSettings.默认关键词出价 = defaultBidValue;
                    }
                    const singleCostEnabled = !!wizardState?.els?.singleCostEnableInput?.checked;
                    const singleCostValue = normalizeSceneSettingValue(wizardState?.els?.singleCostInput?.value || '');
                    if (singleCostEnabled && singleCostValue && !sceneSettings.平均直接成交成本) {
                        sceneSettings.平均直接成交成本 = singleCostValue;
                    }
                }
                if (targetSceneName === '货品全站推广') {
                    delete sceneSettings.营销场景;
                    const siteBidType = normalizeSceneSettingValue(sceneSettings.出价方式 || '');
                    if (/最大化拿量/.test(siteBidType)) {
                        delete sceneSettings.目标投产比;
                        delete sceneSettings.净目标投产比;
                        delete sceneSettings.ROI目标值;
                        delete sceneSettings.出价目标值;
                        delete sceneSettings.约束值;
                        if (!sceneSettings.预算类型 || /不限预算/.test(sceneSettings.预算类型)) {
                            sceneSettings.预算类型 = '每日预算';
                        }
                    }
                }

                return sceneSettings;
            };
