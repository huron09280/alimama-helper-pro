    const Core = {
        // 处理单个计划（使用独立卡片日志）
        processCampaign: async (campaignId, campaignName, index, total) => {
            // 创建该计划的独立卡片
            // 如果没有 ID，使用通用 ID "GLOBAL"
            const realId = campaignId || '0';
            const realName = campaignId ? campaignName : '通用问答';

            const card = UI.createCampaignCard(realId, realName, index, total);
            if (!card) {
                Logger.error(`无法创建卡片: ${realId}`);
                return { success: false, msg: '创建卡片失败' };
            }

            Logger.info(`[${index}/${total}] ${realName}(${realId}) 开始处理...`);
            card.log('开始处理...', '#1890ff');
            card.setStatus('诊断中', 'info');

            try {
                const today = Utils.toLocalYMD();
                // 构造请求数据
                const talkData = {
                    fromPage: '/manage/search-detail',
                    entrance: 'huhang-pop_escort@onebpSearch@horizontal',
                    business: 'escort@onebpSearch@horizontal',
                    contextParam: {
                        mx_bizCode: 'onebpSearch',
                        bizCode: 'onebpSearch',
                        startTime: today,
                        endTime: today,
                        campaignGroupId: Utils.getCampaignGroupId(),
                        newUi: true,
                        bizQueryReference: 'escort',
                        campaignId: parseInt(campaignId)
                    },
                    bizCode: 'universalBP',
                    requestType: 'NlAnalysis',
                    client: 'pc_uni_bp',
                    product: 'escort',
                    sessionId: Utils.uuid(),
                    campaignId: parseInt(campaignId),
                    prompt: {
                        promptType: 'text',
                        valided: true,
                        isEmpty: false,
                        params: { questionSource: 'input' },
                        wordList: [{
                            word: `针对计划：${campaignId}，${userConfig.customPrompt}`,
                            wordType: 'text'
                        }]
                    },
                    promptType: 'text',
                    timeStr: Date.now(),
                    ...State.tokens
                };

                card.log('请求诊断接口...', 'orange');
                const talkRes = await API.request('https://ai.alimama.com/ai/chat/talk.json', talkData, {
                    signal: State.runAbortController?.signal
                });

                // 收集所有 actionList
                const allActionLists = [];
                const seenKeys = new Set();

                const collect = (obj, depth = 0) => {
                    if (!obj || depth > 20) return;
                    if (Array.isArray(obj)) {
                        obj.forEach(item => collect(item, depth + 1));
                        return;
                    }
                    if (Array.isArray(obj.actionList) && obj.actionList.length) {
                        const key = obj.actionList.map(i => {
                            const infoStr = typeof i.actionInfo === 'string'
                                ? i.actionInfo
                                : JSON.stringify(i.actionInfo ?? '');
                            return `${i.actionText}::${(infoStr || '').substring(0, 100)}`;
                        }).join('|||');
                        if (!seenKeys.has(key)) {
                            seenKeys.add(key);
                            allActionLists.push(obj.actionList);
                        }
                    }
                    if (typeof obj === 'object') {
                        for (const k in obj) collect(obj[k], depth + 1);
                    }
                };

                if (talkRes.isStream) {
                    talkRes.chunks.forEach(c => collect(c));
                } else {
                    collect(talkRes);
                }

                // 显示所有方案
                if (allActionLists.length) {
                    Logger.debug('方案列表:', allActionLists.flat().map((a, i) => ({
                        序号: i + 1,
                        actionText: a.actionText || '-',
                        actionType: a.actionType || '-',
                        hasInfo: a.actionInfo ? '✓' : '-'
                    })));

                    card.log(`收到 ${allActionLists.length} 组方案`, '#1890ff');
                    UI.renderAllActionsToCard(card, allActionLists);
                }

                // 寻找算法护航
                let actionList = null, targetInfo = null;
                for (const list of allActionLists) {
                    const escort = list.find(i => i.actionText?.includes('算法护航'));
                    if (escort?.actionInfo) {
                        try {
                            const info = JSON.parse(escort.actionInfo);
                            if (info.actionList) {
                                actionList = info.actionList;
                                targetInfo = info;
                                break;
                            }
                        } catch { }
                    }
                }

                if (!actionList?.length) {
                    card.log('⚠️ 未发现"算法护航"方案', 'orange');
                    card.setStatus('无方案', 'warning');
                    card.collapse();
                    return { success: false, msg: '无护航方案' };
                }

                // 显示护航方案
                card.log(`获取到 ${actionList.length} 个护航方案`, '#1890ff');
                UI.renderEscortActionsToCard(card, actionList);

                // 提交护航
                card.log('提交护航请求...', 'orange');
                card.setStatus('提交中', 'info');

                const openRes = await API.request('https://ai.alimama.com/ai/escort/open.json', {
                    actionList,
                    campaignId: campaignId.toString(),
                    continueDays: 3650,
                    target: targetInfo?.target || '深度诊断拿量',
                    timeStr: Date.now(),
                    bizCode: userConfig.bizCode,
                    ...State.tokens
                }, {
                    signal: State.runAbortController?.signal
                });

                const success = openRes?.success || openRes?.ok || openRes?.info?.ok;
                const msg = openRes?.info?.message || (success ? '成功' : '未知错误');

                card.log(`${success ? '✓' : '✗'} ${msg}`, success ? 'green' : 'red');
                card.setStatus(success ? '成功' : '失败', success ? 'success' : 'error');
                card.collapse();
                return { success, msg };

            } catch (e) {
                if (e?.name === 'AbortError') {
                    card.log('已取消', '#999');
                    card.setStatus('已取消', 'warning');
                    card.collapse();
                    return { success: false, msg: '已取消' };
                }
                card.log(`异常: ${e.message}`, 'red');
                card.setStatus('异常', 'error');
                card.collapse();
                return { success: false, msg: e.message };
            }
        },

        // 扫描页面计划（单次 DOM 遍历）
        scanCampaigns: () => {
            const tasks = new Map();
            const campaignIdRegex = /campaignId=(\d{6,})/;

            document.querySelectorAll('a[href*="campaignId="], input[type="checkbox"][value]').forEach(el => {
                if (el.tagName === 'A') {
                    const m = el.href.match(campaignIdRegex);
                    if (m && !tasks.has(m[1])) {
                        tasks.set(m[1], el.innerText.trim() || '未知计划');
                    }
                } else if (/^\d{6,}$/.test(el.value) && !el.closest('div[mx-view*="user-pop"]')) {
                    if (!tasks.has(el.value)) {
                        const row = el.closest('tr');
                        const name = row?.querySelector('a[title]')?.getAttribute('title') || '未知计划';
                        tasks.set(el.value, name);
                    }
                }
            });

            return Array.from(tasks.entries());
        },

        // 主运行函数 - 并发执行版本
        run: async () => {
            State.currentRunId++;
            const runId = State.currentRunId;
            if (State.runAbortController) State.runAbortController.abort();
            State.runAbortController = new AbortController();

            // 清空日志
            const log = document.getElementById(`${CONFIG.UI_ID}-log`);
            if (log) log.textContent = '';

            UI.updateStatus('正在解析页面...', 'blue');

            TokenManager.refresh();

            if (!State.tokens.loginPointId || !State.tokens.dynamicToken) {
                UI.updateStatus('Token 未就绪，请点击页面任意处', 'red');
                return;
            }

            const campaigns = Core.scanCampaigns();
            if (!campaigns.length) {
                UI.updateStatus('未找到计划ID', '#ff4d4f');
                return;
            }

            const total = campaigns.length;
            const concurrency = userConfig.concurrency || 3;
            UI.updateStatus(`识别到 ${total} 个计划，开始并发处理 (并发数: ${concurrency})...`, '#1890ff');

            // 创建任务函数数组
            const taskFns = campaigns.map(([id, name], i) => async () => {
                if (State.currentRunId !== runId) return { success: false, id, name, msg: '已取消' };
                const res = await Core.processCampaign(id, name, i + 1, total);
                return { ...res, id, name };
            });

            // 并发执行（使用用户设置的并发数）
            const results = await Utils.concurrentLimit(taskFns, concurrency);

            // 统计结果
            const successList = [], failList = [];
            results.forEach(r => {
                if (r.status === 'fulfilled') {
                    const { success, id, name, msg } = r.value;
                    (success ? successList : failList).push({ id, name, msg });
                } else {
                    failList.push({ id: '-', name: '未知', msg: r.reason?.message || '执行异常' });
                }
            });

            // 显示结果
            UI.updateStatus('--------------------------------', '#999');
            UI.updateStatus(`执行完成。成功: ${successList.length}, 失败: ${failList.length}`,
                successList.length ? 'green' : 'red');
        }
    };

    // ==================== 初始化 ====================
    try {
        const hooks = createHookManager();
        hooks?.install?.();
    } catch { }
    TokenManager.hookXHR();

    // NOTE: page bridge 默认仅在调试模式下暴露，避免向页面脚本开放高权限 API
    const pageGlobal = (typeof unsafeWindow !== 'undefined' && unsafeWindow) ? unsafeWindow : window;
    const PAGE_API_DEBUG_STORAGE_KEY = '__AM_WXT_DEBUG_PAGE_API__';
    const shouldExposePageApiDebug = () => {
        try {
            return window.localStorage?.getItem?.(PAGE_API_DEBUG_STORAGE_KEY) === '1';
        } catch { }
        return false;
    };
    const API_BRIDGE_REQ_EVENT = '__AM_WXT_PLAN_API_BRIDGE_REQ__';
    const API_BRIDGE_RES_EVENT = '__AM_WXT_PLAN_API_BRIDGE_RES__';
    const API_BRIDGE_MSG_CHANNEL = '__AM_WXT_PLAN_API_BRIDGE_MSG__';
