    const UI = {
        // 公共样式
        styles: {
            table: `width:100%;border-collapse:collapse;font-size:10px;margin:4px 0 8px;border-radius:12px;overflow:hidden;border:1px solid var(--am26-border,rgba(255,255,255,.4));background:rgb(227 227 227 / 20%);`,
            th: `padding:5px 6px;text-align:left;font-weight:600;border-bottom:1px solid var(--am26-border,rgba(255,255,255,.4));background:rgba(255,255,255,.14);color:var(--am26-text,#1b2438);`,
            td: `padding:4px 6px;border-bottom:1px solid var(--am26-border,rgba(255,255,255,.28));color:var(--am26-text-soft,#505a74);`
        },
        manualKeywordOutsideHandler: null,

        // 全局状态日志（用于非计划相关的消息）
        updateStatus: (text, color = '#aaa') => {
            const container = document.getElementById(`${CONFIG.UI_ID}-log`);
            if (!container) return;

            const time = new Date().toLocaleTimeString('zh-CN', { hour12: false });
            const line = document.createElement('div');
            line.className = 'am26-log-status-line';
            line.style.cssText = `
                display:block;width:100%;box-sizing:border-box;margin:0 0 8px;padding:6px 8px;
                border-radius:8px;background:rgba(255,255,255,.16);border:1px solid var(--am26-border,rgba(255,255,255,.32));
                break-inside:avoid;-webkit-column-break-inside:avoid;column-span:all;
            `;
            const timeSpan = document.createElement('span');
            timeSpan.style.cssText = 'color:#666;margin-right:4px;';
            timeSpan.textContent = `[${time}]`;
            const textSpan = document.createElement('span');
            textSpan.style.color = color;
            textSpan.textContent = text;
            line.appendChild(timeSpan);
            line.appendChild(textSpan);
            container.appendChild(line);

            while (container.children.length > 50) container.removeChild(container.firstChild);
            container.parentElement.scrollTop = container.parentElement.scrollHeight;
        },

        // 创建计划卡片（每个计划独立的日志区域）
        createCampaignCard: (campaignId, campaignName, index, total) => {
            const container = document.getElementById(`${CONFIG.UI_ID}-log`);
            if (!container) return null;

            const cardId = `${CONFIG.UI_ID}-card-${campaignId}`;
            const safeCampaignName = Utils.escapeHtml(campaignName);
            const safeCampaignId = Utils.escapeHtml(campaignId);
            const card = document.createElement('div');
            card.id = cardId;
            card.className = 'am26-campaign-card';
            card.style.cssText = `
                display:inline-block;width:100%;box-sizing:border-box;vertical-align:top;
                break-inside:avoid;-webkit-column-break-inside:avoid;
                background:var(--am26-surface,rgba(255,255,255,.25));
                border:1px solid var(--am26-border,rgba(255,255,255,.4));
                border-radius:12px;margin-bottom:8px;overflow:hidden;transition:all 0.3s ease;
                backdrop-filter:blur(6px);
            `;
            card.innerHTML = `
                <div class="card-header" style="
                    padding:8px 12px;background:rgba(255,255,255,.22);border-bottom:1px solid var(--am26-border,rgba(255,255,255,.4));
                    display:flex;justify-content:space-between;align-items:center;cursor:pointer;
                ">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span style="
                            display:inline-block;min-width:24px;height:18px;line-height:18px;
                            background:var(--am26-primary,#2a5bff);color:#fff;border-radius:9px;text-align:center;font-size:10px;
                        ">${index}/${total}</span>
                        <span style="font-weight:500;color:var(--am26-text,#1b2438);max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"
                              title="${safeCampaignName}">${safeCampaignName}</span>
                        <span style="color:var(--am26-text-soft,#505a74);font-size:10px;">(${safeCampaignId})</span>
                    </div>
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span class="status-badge" style="
                            padding:2px 8px;border-radius:10px;font-size:10px;
                            background:rgba(42,91,255,.12);color:var(--am26-primary,#2a5bff);border:1px solid rgba(42,91,255,.28);
                        ">处理中</span>
                        <span class="arrow" style="
                            display:inline-block;transition:transform 0.2s;
                            font-size:10px;color:var(--am26-text-soft,#505a74);
                        ">▼</span>
                    </div>
                </div>
                <div class="card-body" style="padding:8px 12px;font-size:11px;max-height:150px;overflow-y:auto;background:rgba(255,255,255,.12);">
                    <div class="log-content" style="display:flex;flex-direction:column;gap:2px;"></div>
                </div>
                <style>
                    #${cardId} .card-body.collapsed { display:none; }
                    #${cardId} .arrow.rotated { transform:rotate(-90deg); }
                </style>
            `;
            container.appendChild(card);
            container.parentElement.scrollTop = container.parentElement.scrollHeight;

            const header = card.querySelector('.card-header');
            const body = card.querySelector('.card-body');
            const arrow = card.querySelector('.arrow');
            if (header) {
                header.style.setProperty('border', '0', 'important');
                header.style.setProperty('border-bottom', '0', 'important');
            }
            if (header && body && arrow) {
                header.addEventListener('click', () => {
                    body.classList.toggle('collapsed');
                    arrow.classList.toggle('rotated');
                });
            }

            // 返回卡片操作对象
            return {
                log: (text, color = '#555', options = {}) => {
                    const logContent = card.querySelector('.log-content');
                    if (!logContent) return;
                    const time = new Date().toLocaleTimeString('zh-CN', { hour12: false });
                    const line = document.createElement('div');
                    const timeSpan = document.createElement('span');
                    timeSpan.style.cssText = 'color:#aaa;margin-right:4px;font-size:10px;';
                    timeSpan.textContent = time;
                    line.appendChild(timeSpan);
                    if (options.html) {
                        const htmlWrap = document.createElement('div');
                        htmlWrap.style.color = color;
                        htmlWrap.innerHTML = text;
                        line.appendChild(htmlWrap);
                    } else {
                        const textSpan = document.createElement('span');
                        textSpan.style.color = color;
                        textSpan.textContent = text;
                        line.appendChild(textSpan);
                    }
                    logContent.appendChild(line);
                    card.querySelector('.card-body').scrollTop = card.querySelector('.card-body').scrollHeight;
                },
                setStatus: (status, type = 'info') => {
                    const badge = card.querySelector('.status-badge');
                    if (!badge) return;
                    const styles = {
                        info: 'background:rgba(42,91,255,.12);color:var(--am26-primary,#2a5bff);border:1px solid rgba(42,91,255,.28);',
                        success: 'background:rgba(14,168,111,.12);color:var(--am26-success,#0ea86f);border:1px solid rgba(14,168,111,.28);',
                        warning: 'background:rgba(232,163,37,.12);color:var(--am26-warning,#e8a325);border:1px solid rgba(232,163,37,.28);',
                        error: 'background:rgba(234,79,79,.12);color:var(--am26-danger,#ea4f4f);border:1px solid rgba(234,79,79,.28);'
                    };
                    badge.style.cssText = `padding:2px 8px;border-radius:10px;font-size:10px;${styles[type] || styles.info}`;
                    badge.textContent = status;

                    // 同时更新卡片边框颜色
                    const borderColors = {
                        info: 'rgba(42,91,255,.32)',
                        success: 'rgba(14,168,111,.35)',
                        warning: 'rgba(232,163,37,.35)',
                        error: 'rgba(234,79,79,.35)'
                    };
                    const borderColor = borderColors[type] || borderColors.info;
                    card.style.borderColor = borderColor;
                    const headerEl = card.querySelector('.card-header');
                    if (headerEl) {
                        headerEl.style.setProperty('border', '0', 'important');
                        headerEl.style.setProperty('border-bottom', '0', 'important');
                    }
                },
                collapse: () => {
                    card.querySelector('.card-body')?.classList.add('collapsed');
                    card.querySelector('.arrow')?.classList.add('rotated');
                }
            };
        },

        // 渲染表格到指定卡片（通用）
        renderTableToCard: (cardLogger, data, columns, options = {}) => {
            if (!data.length) return;

            const { headerBg = 'rgba(255,255,255,.14)', headerColor = 'var(--am26-text,#1b2438)', highlight } = options;
            const { table, th, td } = UI.styles;

            let html = `<table style="${table}margin-top:4px;">
                <thead><tr>${columns.map(c =>
                `<th style="${th}background:${headerBg};color:${headerColor};${c.width ? `width:${c.width};` : ''}">${c.title}</th>`
            ).join('')}</tr></thead><tbody>`;

            data.forEach((row, idx) => {
                const isHighlight = !!highlight?.(row);
                const rowStyle = isHighlight ? 'background:rgba(42,91,255,.08);' : '';
                const nameStyle = isHighlight ? 'color:var(--am26-primary,#2a5bff);font-weight:600;' : '';

                html += `<tr style="${rowStyle}">${columns.map((c, i) => {
                    const val = typeof c.render === 'function' ? c.render(row, idx) : row[c.key];
                    const safeVal = Utils.escapeHtml(val ?? '-');
                    return `<td style="${td}${i === 1 ? nameStyle : ''}">${safeVal}</td>`;
                }).join('')}</tr>`;
            });

            html += '</tbody></table>';
            cardLogger.log(html, '#555', { html: true });
        },

        // 渲染所有原始方案表格（到卡片）
        renderAllActionsToCard: (cardLogger, allActionLists) => {
            const data = [];
            allActionLists.forEach(list => {
                list.forEach(item => {
                    const actionText = item.actionText || '';
                    if (!actionText || actionText === '未知' || actionText === '未知方案') return;
                    data.push(item);
                });
            });

            if (!data.length) return;

            UI.renderTableToCard(cardLogger, data, [
                { title: '#', width: '24px', render: (_, i) => i + 1 },
                { title: '方案名称', render: row => row.actionText },
                { title: '详情', render: row => Utils.extractDetail(row) }
            ], {
                highlight: row => Utils.isEscortActionText(row?.actionText)
            });
        },

        // 渲染新链路护航配置（escortSettingTable）
        renderEscortSettingTableToCard: (cardLogger, settingData, options = {}) => {
            if (!settingData || typeof settingData !== 'object') return;

            const operationList = Array.isArray(settingData.operationList) ? settingData.operationList : [];
            const userSetting = settingData.userSetting && typeof settingData.userSetting === 'object'
                ? settingData.userSetting
                : {};
            const keyAliasMap = {
                bidConstraintValue: ['bidConstraintValue'],
                budget: ['budget'],
                addKeyword: ['addKeyword', 'keywordAdd'],
                keywordAdd: ['keywordAdd', 'addKeyword'],
                switchKeywordMatchType: ['switchKeywordMatchType', 'keywordSwitch'],
                keywordSwitch: ['keywordSwitch', 'switchKeywordMatchType'],
                shieldKeyword: ['shieldKeyword', 'keywordMask'],
                keywordMask: ['keywordMask', 'shieldKeyword']
            };
            const normalizeOperationKey = (key) => {
                if (key === 'addKeyword' || key === 'keywordAdd') return 'keywordAdd';
                if (key === 'switchKeywordMatchType' || key === 'keywordSwitch') return 'keywordSwitch';
                if (key === 'shieldKeyword' || key === 'keywordMask') return 'keywordMask';
                return key;
            };
            const findConfigByKey = (key) => {
                const candidates = keyAliasMap[key] || [key];
                for (const candidate of candidates) {
                    const cfg = userSetting[candidate];
                    if (cfg && typeof cfg === 'object') return cfg;
                }
                return {};
            };
            const toFiniteNumber = (value) => {
                if (typeof value === 'number') return Number.isFinite(value) ? value : null;
                if (value === null || value === undefined) return null;
                const text = String(value).trim();
                if (!text) return null;
                const num = Number(text);
                return Number.isFinite(num) ? num : null;
            };
            const resolveKeywordPreferenceText = (value) => {
                if (value === null || value === undefined) return '';
                const code = toFiniteNumber(value);
                if (code === 2) return '类目流量飙升词';
                const text = String(value).trim();
                return text || '';
            };
            const resolveKeywordMatchText = (value) => {
                const code = toFiniteNumber(value);
                if (code === 1) return '广泛匹配';
                if (code === 4) return '精准匹配';
                const text = String(value || '').trim();
                if (!text) return '';
                if (text.includes('精准')) return '精准匹配';
                if (text.includes('广泛')) return '广泛匹配';
                return text;
            };
            const formatRangeUpper = (cfg) => {
                if (cfg.upperType === 0 || cfg.upperLimit === '不限') return '不限';
                const upperNum = toFiniteNumber(cfg.upperLimit);
                if (upperNum !== null) return upperNum;
                const text = String(cfg.upperLimit ?? '').trim();
                return text || '-';
            };
            const getActionTextByKey = (key, cfg) => {
                if (key === 'bidConstraintValue') {
                    const targetName = String(cfg.targetName || cfg.targetDisplayName || '').trim();
                    if (targetName) return targetName.endsWith('调控') ? targetName : `${targetName}调控`;
                    return '出价调控';
                }
                if (key === 'budget') return '预算调控';
                if (key === 'keywordAdd') return '添加关键词';
                if (key === 'keywordSwitch') return '切换关键词匹配方式';
                if (key === 'keywordMask') return '屏蔽关键词';
                return key;
            };
            const resolveExecutionIcon = (rawKey, normalizedKey) => {
                const executionState = options?.executionState;
                if (executionState === undefined || executionState === null) return '';
                if (typeof executionState === 'boolean') return executionState ? '✅' : '❌';
                if (typeof executionState === 'object') {
                    const keyCandidates = [rawKey, normalizedKey];
                    for (const candidate of keyCandidates) {
                        if (!candidate) continue;
                        if (typeof executionState[candidate] === 'boolean') {
                            return executionState[candidate] ? '✅' : '❌';
                        }
                    }
                }
                return '';
            };

            const sourceKeys = operationList.length
                ? operationList
                : Object.keys(userSetting).filter(key => {
                    const cfg = userSetting[key];
                    return cfg && typeof cfg === 'object' && cfg.enabled !== false;
                });

            const rows = sourceKeys.map((rawKey, index) => {
                const cfg = findConfigByKey(rawKey);
                const key = normalizeOperationKey(rawKey);
                const actionText = getActionTextByKey(key, cfg);
                const detailParts = [];

                switch (key) {
                    case 'bidConstraintValue':
                    case 'budget': {
                        const lowerNum = toFiniteNumber(cfg.lowerLimit);
                        const lower = lowerNum !== null ? lowerNum : '-';
                        const upper = formatRangeUpper(cfg);
                        if (lower !== '-' || upper !== '-') detailParts.push(`范围 ${lower}-${upper}`);

                        const limitNum = toFiniteNumber(cfg.modifyTimesLimit);
                        if (limitNum !== null) detailParts.push(`最多 ${limitNum} 次/日`);

                        if (typeof cfg.dailyReset === 'boolean') {
                            detailParts.push(cfg.dailyReset ? '次日恢复初始值' : '次日不恢复');
                        }
                        break;
                    }
                    case 'keywordAdd': {
                        const preferenceText = resolveKeywordPreferenceText(
                            cfg.preference ?? cfg.keywordPreference ?? cfg.buyWordPreference
                        );
                        if (preferenceText) detailParts.push(`买词偏好：${preferenceText}`);

                        const matchText = resolveKeywordMatchText(cfg.matchPattern ?? cfg.matchType ?? cfg.pattern);
                        if (matchText) detailParts.push(`匹配方式：${matchText}`);

                        const keywordLimit = toFiniteNumber(
                            cfg.wordCntLimit ?? cfg.keywordLimit ?? cfg.upperLimit ?? cfg.limit
                        );
                        if (keywordLimit !== null) detailParts.push(`自选词上限：${keywordLimit}个`);

                        if (!detailParts.length) detailParts.push('按默认策略补词');
                        break;
                    }
                    case 'keywordSwitch':
                        detailParts.push(cfg.enabled === false ? '未开启' : '自动在广泛匹配与精准匹配间切换');
                        break;
                    case 'keywordMask':
                        detailParts.push(cfg.enabled === false ? '未开启' : '自动屏蔽低转化关键词');
                        break;
                    default:
                        if (typeof cfg.enabled === 'boolean') detailParts.push(cfg.enabled ? '已开启' : '未开启');
                        break;
                }

                return {
                    order: index + 1,
                    actionText: `${resolveExecutionIcon(rawKey, key)}${resolveExecutionIcon(rawKey, key) ? ' ' : ''}${actionText}`,
                    detail: detailParts.join('；') || '-'
                };
            }).filter(row => row.actionText && row.actionText !== '-');

            if (!rows.length) return;

            UI.renderTableToCard(cardLogger, rows, [
                { title: '#', width: '24px', render: row => row.order },
                { title: '方案名称', render: row => row.actionText },
                { title: '详情', render: row => row.detail }
            ], {
                headerBg: 'rgba(42,91,255,.12)',
                headerColor: 'var(--am26-primary,#2a5bff)'
            });

            const footerText = settingData.footerInfo?.enterText ? `提交按钮：${settingData.footerInfo.enterText}` : '';
            const actionTypeText = settingData.actionType ? `提交类型：${settingData.actionType}` : '';
            const hintText = [footerText, actionTypeText].filter(Boolean).join('，');
            if (hintText) cardLogger.log(`新链路提交信息：${hintText}`, '#4b5563');
        },

        // 从护航弹窗读取最新设置（用于主面板展示）
        readLatestEscortSettingPreview: () => {
            const selectorList = [
                '#ai_analyst_action_modal > div > div.dialog-modal-body.flex-1.min-height-0 > div',
                '#ai_analyst_action_modal .dialog-modal-body.flex-1.min-height-0 > div',
                '#ai_analyst_action_modal .dialog-modal-body > div'
            ];

            let root = null;
            let matchedSelector = '';
            for (const selector of selectorList) {
                const el = document.querySelector(selector);
                if (el instanceof HTMLElement) {
                    root = el;
                    matchedSelector = selector;
                    break;
                }
            }

            if (!(root instanceof HTMLElement)) {
                return {
                    found: false,
                    selector: '',
                    userSetting: {}
                };
            }

            const normalize = (value) => String(value || '').replace(/\s+/g, '').toLowerCase();
            const toDisplayValue = (value) => {
                if (typeof value === 'boolean') return value;
                if (value === null || value === undefined) return '';
                const text = String(value).trim();
                if (!text) return '';
                const num = Number(text);
                if (Number.isFinite(num) && /^-?\d+(?:\.\d+)?$/.test(text)) return num;
                return text;
            };
            const findLabelNode = (label, scope = root) => {
                const needle = normalize(label);
                if (!needle) return null;
                const candidates = Array.from(scope.querySelectorAll('.mxform-name, label, span, div'));
                return candidates.find(node => normalize(node.textContent) === needle) || null;
            };
            const findLineByLabel = (label, scope = root) => {
                const labelNode = findLabelNode(label, scope);
                if (!(labelNode instanceof Element)) return null;
                return labelNode.closest('.mxform-line') || labelNode.closest('[data-adc-comp]') || labelNode.closest('div');
            };
            const findLinesByLabel = (label, scope = root) => {
                const needle = normalize(label);
                const candidates = Array.from(scope.querySelectorAll('.mxform-name, label, span, div'))
                    .filter(node => normalize(node.textContent) === needle)
                    .map(node => node.closest('.mxform-line') || node.closest('[data-adc-comp]') || node.closest('div'))
                    .filter(Boolean);
                const unique = [];
                const seen = new Set();
                candidates.forEach(line => {
                    if (!(line instanceof Element)) return;
                    if (seen.has(line)) return;
                    seen.add(line);
                    unique.push(line);
                });
                return unique;
            };
            const readTextInputsInLine = (line) => {
                if (!(line instanceof Element)) return [];
                return Array.from(line.querySelectorAll('input'))
                    .filter(input => input instanceof HTMLInputElement)
                    .filter(input => {
                        const type = String(input.type || '').toLowerCase();
                        return type === 'text' || type === 'number' || type === '';
                    });
            };
            const readNumberFromInput = (input) => {
                if (!(input instanceof HTMLInputElement)) return undefined;
                const value = toDisplayValue(input.value);
                if (value === '') return undefined;
                if (typeof value === 'number') return value;
                const num = Number(value);
                return Number.isFinite(num) ? num : undefined;
            };
            const readCheckboxByLabel = (label, scope = root) => {
                const needle = normalize(label);
                const candidates = Array.from(scope.querySelectorAll('input[type="checkbox"]'))
                    .filter(input => !input.disabled)
                    .filter(input => {
                        const container = input.closest('label,.display-flex,.mxform-line,[data-adc-comp],div');
                        return normalize(container?.textContent).includes(needle);
                    });
                if (!candidates.length) return undefined;
                return !!candidates[0].checked;
            };
            const readSwitchByLabel = (label, scope = root) => {
                const line = findLineByLabel(label, scope);
                if (!(line instanceof Element)) return undefined;
                const switchInner = line.querySelector('.mxgc-switch > span');
                if (!(switchInner instanceof HTMLElement)) return undefined;
                const styleText = String(switchInner.getAttribute('style') || '').toLowerCase();
                const classText = String(switchInner.className || '');
                if (styleText.includes('#c3c9d9')) return false;
                if (styleText.includes('#4554e5')) return true;
                if (/asiyysfazn/i.test(classText)) return false;
                if (/asiyysfazo/i.test(classText)) return true;
                return undefined;
            };
            const readKeywordPreference = () => {
                const line = findLineByLabel('买词偏好');
                if (!(line instanceof Element)) return undefined;
                const picked = line.querySelector('.asiYysfafj');
                if (picked instanceof HTMLElement) {
                    const text = String(picked.textContent || '').trim();
                    if (text) return text;
                }
                const lineText = String(line.textContent || '');
                const match = lineText.match(/我希望增加[:：]\s*([^\s]+)/);
                return match && match[1] ? String(match[1]).trim() : undefined;
            };
            const readKeywordMatchType = () => {
                const line = findLineByLabel('匹配方式');
                if (!(line instanceof Element)) return undefined;
                const optionList = Array.from(line.querySelectorAll('[data-index], .mxgc-dropdown-box [mx-click], .mxgc-dropdown-box div'))
                    .map(node => ({
                        text: String(node.textContent || '').trim(),
                        classText: String(node.className || '')
                    }))
                    .filter(item => /广泛匹配|精准匹配/.test(item.text));
                const selected = optionList.find(item => /selected|active|checked|asiyysfafj/i.test(item.classText));
                const chosen = selected ? selected.text : (optionList[0] ? optionList[0].text : '');
                if (/精准匹配/.test(chosen)) return '精准匹配';
                if (/广泛匹配/.test(chosen)) return '广泛匹配';
                return undefined;
            };

            const preciseSetting = {};
            const bidSetting = {};
            const bidEnabled = readCheckboxByLabel('成本调控');
            if (typeof bidEnabled === 'boolean') bidSetting.enabled = bidEnabled;
            const bidRangeLine = findLineByLabel('平均点击成本');
            const bidRangeInputs = readTextInputsInLine(bidRangeLine).filter(input => !input.disabled);
            const bidLower = readNumberFromInput(bidRangeInputs[0]);
            const bidUpper = readNumberFromInput(bidRangeInputs[1]);
            if (typeof bidLower === 'number') bidSetting.lowerLimit = bidLower;
            if (typeof bidUpper === 'number') bidSetting.upperLimit = bidUpper;
            const timesLines = findLinesByLabel('修改次数上限');
            const bidTimes = readNumberFromInput(readTextInputsInLine(timesLines[0])[0]);
            if (typeof bidTimes === 'number') bidSetting.modifyTimesLimit = bidTimes;
            const bidDailyReset = readSwitchByLabel('次日恢复初始出价');
            if (typeof bidDailyReset === 'boolean') bidSetting.dailyReset = bidDailyReset;
            if (Object.keys(bidSetting).length) preciseSetting.bidConstraintValue = bidSetting;

            const budgetSetting = {};
            const budgetEnabled = readCheckboxByLabel('预算调控');
            if (typeof budgetEnabled === 'boolean') budgetSetting.enabled = budgetEnabled;
            const budgetRangeLine = findLineByLabel('每日预算调控区间');
            const budgetInputs = readTextInputsInLine(budgetRangeLine);
            const budgetEnabledInputs = budgetInputs.filter(input => !input.disabled);
            const budgetLower = readNumberFromInput(budgetEnabledInputs[0]);
            if (typeof budgetLower === 'number') budgetSetting.lowerLimit = budgetLower;
            const budgetLineText = normalize(budgetRangeLine?.textContent || '');
            if (budgetLineText.includes('不限')) {
                budgetSetting.upperLimit = '不限';
            } else {
                const budgetUpper = readNumberFromInput(budgetEnabledInputs[1]);
                if (typeof budgetUpper === 'number') budgetSetting.upperLimit = budgetUpper;
            }
            const budgetTimes = readNumberFromInput(readTextInputsInLine(timesLines[1])[0]);
            if (typeof budgetTimes === 'number') budgetSetting.modifyTimesLimit = budgetTimes;
            const budgetDailyReset = readSwitchByLabel('次日恢复初始预算');
            if (typeof budgetDailyReset === 'boolean') budgetSetting.dailyReset = budgetDailyReset;
            if (Object.keys(budgetSetting).length) preciseSetting.budget = budgetSetting;

            const keywordSetting = {};
            const keywordEnabled = readCheckboxByLabel('添加关键词');
            if (typeof keywordEnabled === 'boolean') keywordSetting.enabled = keywordEnabled;
            const keywordPreference = readKeywordPreference();
            if (keywordPreference) keywordSetting.keywordPreference = keywordPreference;
            const keywordLimit = readNumberFromInput(readTextInputsInLine(findLineByLabel('自选词上限'))[0]);
            if (typeof keywordLimit === 'number') keywordSetting.keywordLimit = keywordLimit;
            const keywordMatchType = readKeywordMatchType();
            if (keywordMatchType) keywordSetting.matchType = keywordMatchType;
            if (Object.keys(keywordSetting).length) preciseSetting.addKeyword = keywordSetting;

            const switchKeywordValue = readCheckboxByLabel('切换关键词匹配方式');
            if (typeof switchKeywordValue === 'boolean') {
                preciseSetting.switchKeywordMatchType = { enabled: switchKeywordValue };
            }
            const shieldKeywordValue = readCheckboxByLabel('屏蔽关键词');
            if (typeof shieldKeywordValue === 'boolean') {
                preciseSetting.shieldKeyword = { enabled: shieldKeywordValue };
            }

            if (Object.keys(preciseSetting).length) {
                return {
                    found: true,
                    selector: matchedSelector,
                    userSetting: preciseSetting
                };
            }

            const findContextNode = (control) => {
                let node = control.closest('label,li,tr');
                if (node instanceof Element) return node;

                let cursor = control.parentElement;
                while (cursor && cursor !== root) {
                    if (!(cursor instanceof Element)) break;
                    const text = normalize(cursor.textContent);
                    const controlCount = cursor.querySelectorAll('input,select,textarea').length;
                    if (text && text.length <= 180 && controlCount <= 4) return cursor;
                    cursor = cursor.parentElement;
                }
                return control.parentElement || control;
            };
            const collectContexts = (control) => {
                const contexts = [];
                const pushText = (value) => {
                    const normalized = normalize(value);
                    if (!normalized) return;
                    contexts.push(normalized);
                };

                pushText(control.getAttribute('aria-label'));
                pushText(control.getAttribute('placeholder'));
                pushText(control.getAttribute('name'));
                pushText(control.getAttribute('id'));
                pushText(control.className);

                const contextNode = findContextNode(control);
                if (contextNode instanceof Element) pushText(contextNode.textContent);

                let cursor = contextNode instanceof Element ? contextNode.parentElement : control.parentElement;
                let step = 0;
                while (cursor && cursor instanceof Element && cursor !== root && step < 6) {
                    const text = normalize(cursor.textContent);
                    if (text && /(预算调控|投产比|添加关键词|切换关键词匹配方式|屏蔽关键词|自选词上限)/.test(text)) {
                        pushText(text);
                        break;
                    }
                    cursor = cursor.parentElement;
                    step += 1;
                }
                return contexts;
            };

            const keyRuleList = [
                { key: 'budget', tokens: ['budget', '预算调控', '每日预算调控区间', '每日预算', 'budget.enabled', 'budget.modifytimeslimit', 'budget.dailyreset'] },
                { key: 'bidConstraintValue', tokens: ['bidconstraintvalue', '成本调控', '平均点击成本', '出价调控', 'bidconstraintvalue.enabled', 'bidconstraintvalue.modifytimeslimit', 'bidconstraintvalue.dailyreset'] },
                { key: 'addKeyword', tokens: ['keywordadd', 'addkeyword', '添加关键词', '买词偏好', '自选词上限', '关键词调控', 'keywordadd.wordcntlimit', 'keywordadd.preference', 'keywordadd.matchpattern'] },
                { key: 'switchKeywordMatchType', tokens: ['keywordswitch', 'switchkeywordmatchtype', '切换关键词匹配方式', '切换匹配方式'] },
                { key: 'shieldKeyword', tokens: ['keywordmask', 'shieldkeyword', '屏蔽关键词', '流量智选关键词'] }
            ];
            const resolveKey = (contexts) => {
                const text = contexts.join(' ');
                let bestKey = '';
                let bestScore = 0;
                keyRuleList.forEach(rule => {
                    const score = rule.tokens.reduce((sum, token) => {
                        const normalizedToken = normalize(token);
                        if (!normalizedToken || !text.includes(normalizedToken)) return sum;
                        const isLongToken = normalizedToken.length >= 4;
                        return sum + (isLongToken ? 2 : 1);
                    }, 0);
                    if (score > bestScore) {
                        bestKey = rule.key;
                        bestScore = score;
                    }
                });
                return bestKey;
            };
            const resolveField = (contexts, control) => {
                const text = contexts.join(' ');
                if (control instanceof HTMLInputElement && (control.type === 'checkbox' || control.type === 'radio')) {
                    return 'enabled';
                }
                if (/wordcntlimit|自选词上限|关键词上限|词上限/.test(text)) return 'keywordLimit';
                if (/preference|买词偏好|我希望增加/.test(text)) return 'keywordPreference';
                if (/matchpattern|匹配方式/.test(text)) return 'matchType';
                if (/modifytimeslimit|修改次数上限|次数上限|频次|次\/日|times/.test(text)) return 'modifyTimesLimit';
                if (/下限|最小|lower/.test(text)) return 'lowerLimit';
                if (/上限|最大|upper/.test(text)) return 'upperLimit';
                if (/次日|恢复|dailyreset/.test(text)) return 'dailyReset';
                return '';
            };
            const ensureSetting = (bucket, key) => {
                if (!bucket[key] || typeof bucket[key] !== 'object') bucket[key] = {};
                return bucket[key];
            };
            const userSetting = {};
            const controlList = Array.from(root.querySelectorAll('input,select,textarea'));

            controlList.forEach(control => {
                if (!(control instanceof Element)) return;
                if (control instanceof HTMLInputElement) {
                    const type = String(control.type || '').toLowerCase();
                    if (type === 'hidden' || type === 'button' || type === 'submit' || type === 'reset') return;
                    if (control.disabled && type !== 'checkbox' && type !== 'radio') return;
                }
                if ((control instanceof HTMLSelectElement || control instanceof HTMLTextAreaElement) && control.disabled) {
                    return;
                }
                const contexts = collectContexts(control);
                const key = resolveKey(contexts);
                if (!key) return;
                const field = resolveField(contexts, control);
                if (!field) return;

                let value = '';
                if (control instanceof HTMLInputElement) {
                    if (control.type === 'checkbox' || control.type === 'radio') value = !!control.checked;
                    else value = toDisplayValue(control.value);
                } else if (control instanceof HTMLSelectElement || control instanceof HTMLTextAreaElement) {
                    value = toDisplayValue(control.value);
                }
                if (value === '') return;

                if (field === 'upperLimit') {
                    const contextText = contexts.join(' ');
                    if (/不限/.test(contextText)) value = '不限';
                }
                if (field === 'dailyReset') value = !!value;

                const bucket = ensureSetting(userSetting, key);
                bucket[field] = value;
            });

            Array.from(root.querySelectorAll('[role="switch"],[aria-checked]')).forEach(node => {
                if (!(node instanceof Element)) return;
                const ariaChecked = node.getAttribute('aria-checked');
                if (ariaChecked !== 'true' && ariaChecked !== 'false') return;
                const contexts = collectContexts(node);
                const key = resolveKey(contexts);
                const checked = ariaChecked === 'true';
                if (key) {
                    const bucket = ensureSetting(userSetting, key);
                    if (typeof bucket.enabled !== 'boolean') bucket.enabled = checked;
                    if (/次日|恢复|dailyreset/.test(contexts.join(' '))) bucket.dailyReset = checked;
                } else if (/次日|恢复|dailyreset/.test(contexts.join(' '))) {
                    const budgetSetting = ensureSetting(userSetting, 'budget');
                    budgetSetting.dailyReset = checked;
                }
            });

            return {
                found: true,
                selector: matchedSelector,
                userSetting
            };
        },

        // 从面板读取“手动设置”参数（提交时优先）
        readManualEscortSettingOverride: () => {
            const readChecked = (id, fallback = false) => {
                const node = document.getElementById(id);
                return node instanceof HTMLInputElement ? !!node.checked : fallback;
            };
            const readNumber = (id, fallback = null) => {
                const node = document.getElementById(id);
                if (!(node instanceof HTMLInputElement)) return fallback;
                const raw = String(node.value || '').trim();
                if (!raw) return fallback;
                const value = Number(raw);
                return Number.isFinite(value) ? value : fallback;
            };
            const readText = (id, fallback = '') => {
                const node = document.getElementById(id);
                if (!(node instanceof HTMLInputElement) && !(node instanceof HTMLSelectElement) && !(node instanceof HTMLTextAreaElement)) return fallback;
                return String(node.value || '').trim() || fallback;
            };

            const manualEnabled = readChecked(`${CONFIG.UI_ID}-manual-enable`, true);
            if (!manualEnabled) return null;

            const bidUpperRaw = readText(`${CONFIG.UI_ID}-manual-bid-upper`, '不限');
            const bidSetting = {
                enabled: readChecked(`${CONFIG.UI_ID}-manual-bid-enabled`, false),
                lowerLimit: readNumber(`${CONFIG.UI_ID}-manual-bid-lower`, 0.15),
                modifyTimesLimit: readNumber(`${CONFIG.UI_ID}-manual-bid-times`, 10),
                dailyReset: readChecked(`${CONFIG.UI_ID}-manual-bid-reset`, false)
            };
            if (bidUpperRaw === '不限') {
                bidSetting.upperLimit = '不限';
            } else {
                const upperLimit = Number(bidUpperRaw);
                if (Number.isFinite(upperLimit)) bidSetting.upperLimit = upperLimit;
            }

            const budgetUpperRaw = readText(`${CONFIG.UI_ID}-manual-budget-upper`, '不限');
            const budgetSetting = {
                enabled: readChecked(`${CONFIG.UI_ID}-manual-budget-enabled`, true),
                lowerLimit: readNumber(`${CONFIG.UI_ID}-manual-budget-lower`, 200),
                modifyTimesLimit: readNumber(`${CONFIG.UI_ID}-manual-budget-times`, 20),
                dailyReset: readChecked(`${CONFIG.UI_ID}-manual-budget-reset`, true)
            };
            if (budgetUpperRaw === '不限') {
                budgetSetting.upperLimit = '不限';
            } else {
                const upperLimit = Number(budgetUpperRaw);
                if (Number.isFinite(upperLimit)) budgetSetting.upperLimit = upperLimit;
            }

            const addKeywordSetting = {
                enabled: readChecked(`${CONFIG.UI_ID}-manual-addkeyword-enabled`, true),
                keywordPreference: readText(`${CONFIG.UI_ID}-manual-keyword-preference`, '类目流量飙升词'),
                matchType: readText(`${CONFIG.UI_ID}-manual-keyword-match`, '广泛匹配'),
                keywordLimit: readNumber(`${CONFIG.UI_ID}-manual-keyword-limit`, 200)
            };
            const switchKeywordMatchType = {
                enabled: readChecked(`${CONFIG.UI_ID}-manual-switchmatch-enabled`, true)
            };
            const shieldKeyword = {
                enabled: readChecked(`${CONFIG.UI_ID}-manual-shield-enabled`, true)
            };

            const operationList = [];
            if (bidSetting.enabled) operationList.push('bidConstraintValue');
            if (budgetSetting.enabled) operationList.push('budget');
            if (addKeywordSetting.enabled) operationList.push('addKeyword');
            if (switchKeywordMatchType.enabled) operationList.push('switchKeywordMatchType');
            if (shieldKeyword.enabled) operationList.push('shieldKeyword');

            return {
                enabled: true,
                actionType: 'openInDialog',
                operationList,
                userSetting: {
                    bidConstraintValue: bidSetting,
                    budget: budgetSetting,
                    addKeyword: addKeywordSetting,
                    switchKeywordMatchType,
                    shieldKeyword
                }
            };
        },

        fillManualEscortSettingForm: (settingData = {}) => {
            const setting = settingData && typeof settingData === 'object' ? settingData : {};
            const bid = setting.bidConstraintValue && typeof setting.bidConstraintValue === 'object' ? setting.bidConstraintValue : {};
            const budget = setting.budget && typeof setting.budget === 'object' ? setting.budget : {};
            const addKeyword = setting.addKeyword && typeof setting.addKeyword === 'object' ? setting.addKeyword : {};
            const switchKeywordMatchType = setting.switchKeywordMatchType && typeof setting.switchKeywordMatchType === 'object'
                ? setting.switchKeywordMatchType
                : {};
            const shieldKeyword = setting.shieldKeyword && typeof setting.shieldKeyword === 'object' ? setting.shieldKeyword : {};
            const setInputValue = (id, value) => {
                const node = document.getElementById(id);
                if (!(node instanceof HTMLInputElement)) return;
                node.value = value === null || value === undefined ? '' : String(value);
            };
            const setControlValue = (id, value) => {
                const node = document.getElementById(id);
                if (!(node instanceof HTMLInputElement) && !(node instanceof HTMLSelectElement) && !(node instanceof HTMLTextAreaElement)) return;
                node.value = value === null || value === undefined ? '' : String(value);
            };
            const setCheckboxValue = (id, value, fallback = false) => {
                const node = document.getElementById(id);
                if (!(node instanceof HTMLInputElement)) return;
                node.checked = typeof value === 'boolean' ? value : fallback;
            };

            setCheckboxValue(`${CONFIG.UI_ID}-manual-enable`, setting.enabled, true);
            setCheckboxValue(`${CONFIG.UI_ID}-manual-bid-enabled`, bid.enabled, false);
            setInputValue(`${CONFIG.UI_ID}-manual-bid-lower`, bid.lowerLimit ?? 0.15);
            setInputValue(`${CONFIG.UI_ID}-manual-bid-upper`, bid.upperLimit === undefined ? '不限' : bid.upperLimit);
            setInputValue(`${CONFIG.UI_ID}-manual-bid-times`, bid.modifyTimesLimit ?? 10);
            setCheckboxValue(`${CONFIG.UI_ID}-manual-bid-reset`, bid.dailyReset, false);

            setCheckboxValue(`${CONFIG.UI_ID}-manual-budget-enabled`, budget.enabled, true);
            setInputValue(`${CONFIG.UI_ID}-manual-budget-lower`, budget.lowerLimit ?? 200);
            setInputValue(`${CONFIG.UI_ID}-manual-budget-upper`, budget.upperLimit === undefined ? '不限' : budget.upperLimit);
            setInputValue(`${CONFIG.UI_ID}-manual-budget-times`, budget.modifyTimesLimit ?? 20);
            setCheckboxValue(`${CONFIG.UI_ID}-manual-budget-reset`, budget.dailyReset, true);

            setCheckboxValue(`${CONFIG.UI_ID}-manual-addkeyword-enabled`, addKeyword.enabled, true);
            setControlValue(`${CONFIG.UI_ID}-manual-keyword-preference`, addKeyword.keywordPreference ?? addKeyword.preference ?? addKeyword.buyWordPreference ?? '类目流量飙升词');
            setControlValue(`${CONFIG.UI_ID}-manual-keyword-match`, addKeyword.matchType ?? addKeyword.matchPattern ?? '广泛匹配');
            setInputValue(`${CONFIG.UI_ID}-manual-keyword-limit`, addKeyword.keywordLimit ?? 200);
            setCheckboxValue(`${CONFIG.UI_ID}-manual-switchmatch-enabled`, switchKeywordMatchType.enabled, true);
            setCheckboxValue(`${CONFIG.UI_ID}-manual-shield-enabled`, shieldKeyword.enabled, true);
            UI.refreshManualKeywordControls();
        },

        closeManualKeywordPreferenceMenu: () => {
            const menu = document.getElementById(`${CONFIG.UI_ID}-manual-keyword-preference-menu`);
            const trigger = document.getElementById(`${CONFIG.UI_ID}-manual-keyword-preference-trigger`);
            if (menu instanceof HTMLElement) {
                menu.style.display = 'none';
                menu.dataset.open = 'false';
            }
            if (trigger instanceof HTMLButtonElement) {
                trigger.setAttribute('aria-expanded', 'false');
            }
        },

        refreshManualKeywordControls: () => {
            const preferenceInput = document.getElementById(`${CONFIG.UI_ID}-manual-keyword-preference`);
            const preferenceValue = document.getElementById(`${CONFIG.UI_ID}-manual-keyword-preference-value`);
            const preferenceRaw = preferenceInput instanceof HTMLInputElement
                ? String(preferenceInput.value || '').trim()
                : '';
            const preference = preferenceRaw || '类目流量飙升词';
            if (preferenceInput instanceof HTMLInputElement && !preferenceRaw) {
                preferenceInput.value = preference;
            }
            if (preferenceValue) preferenceValue.textContent = preference;

            const preferenceMenu = document.getElementById(`${CONFIG.UI_ID}-manual-keyword-preference-menu`);
            if (preferenceMenu) {
                preferenceMenu.querySelectorAll('button[data-pref-value]').forEach(node => {
                    if (!(node instanceof HTMLButtonElement)) return;
                    const active = node.dataset.prefValue === preference;
                    node.classList.toggle('is-selected', active);
                });
            }

            const matchInput = document.getElementById(`${CONFIG.UI_ID}-manual-keyword-match`);
            const matchRaw = matchInput instanceof HTMLInputElement ? String(matchInput.value || '').trim() : '';
            const matchValue = matchRaw === '精准匹配' ? '精准匹配' : '广泛匹配';
            if (matchInput instanceof HTMLInputElement) {
                matchInput.value = matchValue;
            }

            const segment = document.getElementById(`${CONFIG.UI_ID}-manual-keyword-match-segment`);
            if (segment) {
                segment.querySelectorAll('button[data-match-value]').forEach(node => {
                    if (!(node instanceof HTMLButtonElement)) return;
                    const active = node.dataset.matchValue === matchValue;
                    node.classList.toggle('is-active', active);
                    node.setAttribute('aria-pressed', active ? 'true' : 'false');
                });
            }
        },

        bindManualKeywordControls: () => {
            const preferenceInput = document.getElementById(`${CONFIG.UI_ID}-manual-keyword-preference`);
            const preferenceTrigger = document.getElementById(`${CONFIG.UI_ID}-manual-keyword-preference-trigger`);
            const preferenceMenu = document.getElementById(`${CONFIG.UI_ID}-manual-keyword-preference-menu`);
            const preferenceDropdown = document.getElementById(`${CONFIG.UI_ID}-manual-keyword-preference-dropdown`);
            if (
                preferenceInput instanceof HTMLInputElement
                && preferenceTrigger instanceof HTMLButtonElement
                && preferenceMenu instanceof HTMLElement
            ) {
                preferenceTrigger.onclick = (event) => {
                    event.preventDefault();
                    const open = preferenceMenu.dataset.open === 'true';
                    if (open) {
                        UI.closeManualKeywordPreferenceMenu();
                    } else {
                        preferenceMenu.style.display = 'block';
                        preferenceMenu.dataset.open = 'true';
                        preferenceTrigger.setAttribute('aria-expanded', 'true');
                    }
                };

                preferenceMenu.querySelectorAll('button[data-pref-value]').forEach(node => {
                    if (!(node instanceof HTMLButtonElement)) return;
                    node.onclick = () => {
                        const value = String(node.dataset.prefValue || '').trim();
                        if (!value) return;
                        preferenceInput.value = value;
                        UI.refreshManualKeywordControls();
                        UI.closeManualKeywordPreferenceMenu();
                        preferenceInput.dispatchEvent(new Event('change', { bubbles: true }));
                    };
                });
            }

            const matchInput = document.getElementById(`${CONFIG.UI_ID}-manual-keyword-match`);
            const segment = document.getElementById(`${CONFIG.UI_ID}-manual-keyword-match-segment`);
            if (matchInput instanceof HTMLInputElement && segment instanceof HTMLElement) {
                segment.querySelectorAll('button[data-match-value]').forEach(node => {
                    if (!(node instanceof HTMLButtonElement)) return;
                    node.onclick = () => {
                        const value = String(node.dataset.matchValue || '').trim();
                        if (!value) return;
                        matchInput.value = value;
                        UI.refreshManualKeywordControls();
                        matchInput.dispatchEvent(new Event('change', { bubbles: true }));
                    };
                });
            }

            if (UI.manualKeywordOutsideHandler) {
                document.removeEventListener('mousedown', UI.manualKeywordOutsideHandler, true);
            }
            UI.manualKeywordOutsideHandler = (event) => {
                if (!(preferenceMenu instanceof HTMLElement) || preferenceMenu.dataset.open !== 'true') return;
                if (
                    preferenceDropdown instanceof HTMLElement
                    && event.target instanceof Node
                    && preferenceDropdown.contains(event.target)
                ) {
                    return;
                }
                UI.closeManualKeywordPreferenceMenu();
            };
            document.addEventListener('mousedown', UI.manualKeywordOutsideHandler, true);
            UI.refreshManualKeywordControls();
        },

        persistManualEscortSettingFromForm: () => {
            const manual = UI.readManualEscortSettingOverride();
            userConfig.manualEscortSetting = manual || { enabled: false };
            GM_setValue('config', userConfig);
            return manual;
        },

        syncManualEscortSettingFromDialog: () => {
            const preview = UI.readLatestEscortSettingPreview();
            const hint = document.getElementById(`${CONFIG.UI_ID}-manual-setting-hint`);
            if (!preview.found) {
                if (hint) hint.textContent = '未检测到护航弹窗，无法带入。';
                return false;
            }

            const setting = preview.userSetting && typeof preview.userSetting === 'object' ? preview.userSetting : {};
            const bidSetting = setting.bidConstraintValue && typeof setting.bidConstraintValue === 'object'
                ? setting.bidConstraintValue
                : {};
            const budgetSetting = setting.budget && typeof setting.budget === 'object'
                ? setting.budget
                : {};
            const addKeywordSetting = setting.addKeyword && typeof setting.addKeyword === 'object'
                ? setting.addKeyword
                : (setting.keywordAdd && typeof setting.keywordAdd === 'object' ? setting.keywordAdd : {});
            const switchKeywordSetting = setting.switchKeywordMatchType && typeof setting.switchKeywordMatchType === 'object'
                ? setting.switchKeywordMatchType
                : (setting.keywordSwitch && typeof setting.keywordSwitch === 'object' ? setting.keywordSwitch : {});
            const shieldKeywordSetting = setting.shieldKeyword && typeof setting.shieldKeyword === 'object'
                ? setting.shieldKeyword
                : (setting.keywordMask && typeof setting.keywordMask === 'object' ? setting.keywordMask : {});
            UI.fillManualEscortSettingForm({
                enabled: true,
                bidConstraintValue: {
                    enabled: bidSetting.enabled,
                    lowerLimit: bidSetting.lowerLimit,
                    upperLimit: bidSetting.upperLimit,
                    modifyTimesLimit: bidSetting.modifyTimesLimit,
                    dailyReset: bidSetting.dailyReset
                },
                budget: {
                    enabled: budgetSetting.enabled,
                    lowerLimit: budgetSetting.lowerLimit,
                    upperLimit: budgetSetting.upperLimit,
                    modifyTimesLimit: budgetSetting.modifyTimesLimit,
                    dailyReset: budgetSetting.dailyReset
                },
                addKeyword: {
                    enabled: addKeywordSetting.enabled,
                    keywordPreference: addKeywordSetting.keywordPreference ?? addKeywordSetting.preference ?? addKeywordSetting.buyWordPreference,
                    matchType: addKeywordSetting.matchType ?? addKeywordSetting.matchPattern,
                    keywordLimit: addKeywordSetting.keywordLimit ?? addKeywordSetting.upperLimit ?? addKeywordSetting.wordCntLimit
                },
                switchKeywordMatchType: {
                    enabled: switchKeywordSetting.enabled
                },
                shieldKeyword: {
                    enabled: shieldKeywordSetting.enabled
                }
            });
            UI.persistManualEscortSettingFromForm();
            if (hint) {
                const time = new Date().toLocaleTimeString('zh-CN', { hour12: false });
                hint.textContent = `已从弹窗带入（${time}）`;
            }
            return true;
        },

        renderLatestEscortSettingPreview: () => {
            const content = document.getElementById(`${CONFIG.UI_ID}-latest-setting-content`);
            if (!content) return null;

            content.innerHTML = `
                <style>
                    #${CONFIG.UI_ID}-latest-setting-content .am26-manual-root { display:grid; gap:10px; color:#1f2433; }
                    #${CONFIG.UI_ID}-latest-setting-content .am26-manual-top { display:flex; justify-content:space-between; align-items:center; gap:8px; }
                    #${CONFIG.UI_ID}-latest-setting-content .am26-manual-main-switch { display:flex; align-items:center; gap:6px; font-size:12px; font-weight:600; color:#1b2438; }
                    #${CONFIG.UI_ID}-latest-setting-content .am26-manual-waterfall { column-count:2; column-gap:10px; }
                    #${CONFIG.UI_ID}-latest-setting-content .am26-manual-card {
                        display:inline-block; width:100%; box-sizing:border-box; margin:0 0 10px;
                        break-inside:avoid; -webkit-column-break-inside:avoid;
                        padding:10px 12px; border:1px solid #d7e2fb; border-radius:12px;
                        background:linear-gradient(180deg,#f9fbff,#f4f7ff);
                        box-shadow:inset 0 1px 0 rgba(255,255,255,.85);
                    }
                    #${CONFIG.UI_ID}-latest-setting-content .am26-manual-card-head { display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:10px; }
                    #${CONFIG.UI_ID}-latest-setting-content .am26-manual-toggle { display:flex; align-items:center; gap:6px; font-size:12px; font-weight:600; color:#1f2638; }
                    #${CONFIG.UI_ID}-latest-setting-content .am26-manual-inline { display:flex; align-items:center; gap:6px; color:#5b6785; font-size:11px; }
                    #${CONFIG.UI_ID}-latest-setting-content .am26-manual-inline input[type="number"],
                    #${CONFIG.UI_ID}-latest-setting-content .am26-manual-inline input[type="text"] {
                        width:68px; box-sizing:border-box; padding:5px 8px; height:18px;
                        border:1px solid #d7dfef; border-radius:8px; background:#fff; color:#1f2638;
                    }
                    #${CONFIG.UI_ID}-latest-setting-content .am26-manual-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
                    #${CONFIG.UI_ID}-latest-setting-content .am26-manual-field { display:grid; gap:4px; font-size:10px; color:#5f6c8e; }
                    #${CONFIG.UI_ID}-latest-setting-content .am26-manual-field.full { grid-column:1 / -1; }
                    #${CONFIG.UI_ID}-latest-setting-content .am26-manual-field input {
                        width:100%; box-sizing:border-box; padding:5px 8px; height:28px;
                        border:1px solid #d7dfef; border-radius:8px; background:#fff; color:#1f2638;
                    }
                    #${CONFIG.UI_ID}-latest-setting-content .am26-manual-switch-item {
                        display:flex; align-items:center; gap:6px; padding:7px 8px;
                        background:#fff; border:1px solid #dbe3f1; border-radius:9px; color:#5b6785; font-size:11px;
                    }
                    #${CONFIG.UI_ID}-latest-setting-content .am26-dropdown { position:relative; }
                    #${CONFIG.UI_ID}-latest-setting-content .am26-dropdown-trigger {
                        width:100%; height:26px; padding:0 10px; border:1px solid #d7dfef; border-radius:8px;
                        background:#fff; color:#1f2638; display:flex; align-items:center; gap:6px; cursor:pointer;
                    }
                    #${CONFIG.UI_ID}-latest-setting-content .am26-dropdown-prefix { color:#5f6c8e; font-size:11px; white-space:nowrap; }
                    #${CONFIG.UI_ID}-latest-setting-content .am26-dropdown-value { flex:1; text-align:left; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:11px; }
                    #${CONFIG.UI_ID}-latest-setting-content .am26-dropdown-arrow { font-size:10px; color:#5f6c8e; transition:transform .2s ease; }
                    #${CONFIG.UI_ID}-latest-setting-content .am26-dropdown-trigger[aria-expanded="true"] .am26-dropdown-arrow { transform:rotate(180deg); }
                    #${CONFIG.UI_ID}-latest-setting-content .am26-dropdown-menu {
                        display:none; position:absolute; left:0; right:0; top:calc(100% + 4px); z-index:20;
                        border:1px solid #d7dfef; border-radius:10px; background:#fff;
                        box-shadow:0 8px 24px rgba(30,64,175,.16); padding:6px;
                    }
                    #${CONFIG.UI_ID}-latest-setting-content .am26-dropdown-group-title {
                        font-size:10px; color:#7b86a6; font-weight:600; padding:4px 8px; margin-top:2px;
                    }
                    #${CONFIG.UI_ID}-latest-setting-content .am26-dropdown-item {
                        width:100%; border:none; background:transparent; border-radius:8px; cursor:pointer;
                        padding:6px 8px; text-align:left; font-size:11px; color:#1f2638;
                    }
                    #${CONFIG.UI_ID}-latest-setting-content .am26-dropdown-item:hover { background:#f3f6ff; }
                    #${CONFIG.UI_ID}-latest-setting-content .am26-dropdown-item.is-selected { background:#ebf2ff; color:#2a5bff; font-weight:600; }
                    #${CONFIG.UI_ID}-latest-setting-content .am26-segment {
                        height:30px; display:flex; border:1px solid #d7dfef; border-radius:9px; overflow:hidden; background:#fff;
                    }
                    #${CONFIG.UI_ID}-latest-setting-content .am26-segment button {
                        flex:1; border:none; background:transparent; font-size:11px; color:#5f6c8e; cursor:pointer;
                    }
                    #${CONFIG.UI_ID}-latest-setting-content .am26-segment button.is-active {
                        background:linear-gradient(180deg,#2a5bff,#1f49d4); color:#fff; font-weight:600;
                    }
                    @media (max-width:760px) {
                        #${CONFIG.UI_ID}-latest-setting-content .am26-manual-waterfall { column-count:1; }
                    }
                </style>
                <div class="am26-manual-root">
                    <div class="am26-manual-top">
                        <label class="am26-manual-main-switch">
                            <input id="${CONFIG.UI_ID}-manual-enable" type="checkbox" />
                            <span>使用手动设置提交</span>
                        </label>
                    </div>
                    <div class="am26-manual-waterfall">
                        <div class="am26-manual-card">
                            <div class="am26-manual-card-head">
                                <label class="am26-manual-toggle">
                                    <input id="${CONFIG.UI_ID}-manual-bid-enabled" type="checkbox" />
                                    <span>出价调控（成本）</span>
                                </label>
                                <label class="am26-manual-inline">
                                    <input id="${CONFIG.UI_ID}-manual-bid-reset" type="checkbox" />
                                    <span>次日恢复</span>
                                </label>
                            </div>
                            <div class="am26-manual-grid">
                                <label class="am26-manual-field">
                                    <span>下限（元）</span>
                                    <input id="${CONFIG.UI_ID}-manual-bid-lower" type="number" min="0" step="0.01" />
                                </label>
                                <label class="am26-manual-field">
                                    <span>上限（元）</span>
                                    <input id="${CONFIG.UI_ID}-manual-bid-upper" type="text" placeholder="不限" />
                                </label>
                                <label class="am26-manual-field full">
                                    <span>修改次数上限（次/日）</span>
                                    <input id="${CONFIG.UI_ID}-manual-bid-times" type="number" min="0" step="1" />
                                </label>
                            </div>
                        </div>

                        <div class="am26-manual-card">
                            <div class="am26-manual-card-head">
                                <label class="am26-manual-toggle">
                                    <input id="${CONFIG.UI_ID}-manual-budget-enabled" type="checkbox" />
                                    <span>预算调控</span>
                                </label>
                                <label class="am26-manual-inline">
                                    <input id="${CONFIG.UI_ID}-manual-budget-reset" type="checkbox" />
                                    <span>次日恢复</span>
                                </label>
                            </div>
                            <div class="am26-manual-grid">
                                <label class="am26-manual-field">
                                    <span>下限（元）</span>
                                    <input id="${CONFIG.UI_ID}-manual-budget-lower" type="number" min="0" step="1" />
                                </label>
                                <label class="am26-manual-field">
                                    <span>上限（元）</span>
                                    <input id="${CONFIG.UI_ID}-manual-budget-upper" type="text" placeholder="不限" />
                                </label>
                                <label class="am26-manual-field full">
                                    <span>修改次数上限（次/日）</span>
                                    <input id="${CONFIG.UI_ID}-manual-budget-times" type="number" min="0" step="1" />
                                </label>
                            </div>
                        </div>

                        <div class="am26-manual-card">
                            <div class="am26-manual-card-head">
                                <label class="am26-manual-toggle">
                                    <input id="${CONFIG.UI_ID}-manual-addkeyword-enabled" type="checkbox" />
                                    <span>添加关键词</span>
                                </label>
                                <label class="am26-manual-inline">
                                    <span>词上限</span>
                                    <input id="${CONFIG.UI_ID}-manual-keyword-limit" type="number" min="0" step="1" />
                                </label>
                            </div>
                            <div class="am26-manual-grid">
                                <div class="am26-manual-field full">
                                    <span>买词偏好</span>
                                    <input id="${CONFIG.UI_ID}-manual-keyword-preference" type="hidden" />
                                    <div id="${CONFIG.UI_ID}-manual-keyword-preference-dropdown" class="am26-dropdown">
                                        <button id="${CONFIG.UI_ID}-manual-keyword-preference-trigger" type="button" class="am26-dropdown-trigger" aria-expanded="false">
                                            <span class="am26-dropdown-prefix">我希望增加：</span>
                                            <span id="${CONFIG.UI_ID}-manual-keyword-preference-value" class="am26-dropdown-value">类目流量飙升词</span>
                                            <span class="am26-dropdown-arrow">▼</span>
                                        </button>
                                        <div id="${CONFIG.UI_ID}-manual-keyword-preference-menu" class="am26-dropdown-menu" data-open="false">
                                            <div class="am26-dropdown-group-title">相似商家买词</div>
                                            <button type="button" class="am26-dropdown-item" data-pref-value="类目流量飙升词">类目流量飙升词</button>
                                            <button type="button" class="am26-dropdown-item" data-pref-value="类目精准词">类目精准词</button>
                                            <button type="button" class="am26-dropdown-item" data-pref-value="趋势机会词">趋势机会词</button>
                                            <div class="am26-dropdown-group-title">宝贝相关词</div>
                                            <button type="button" class="am26-dropdown-item" data-pref-value="宝贝适投关键词，要求相关性好">宝贝适投关键词，要求相关性好</button>
                                            <button type="button" class="am26-dropdown-item" data-pref-value="优势好词扩写，要求相关性好">优势好词扩写，要求相关性好</button>
                                        </div>
                                    </div>
                                </div>
                                <div class="am26-manual-field full">
                                    <span>匹配方式</span>
                                    <input id="${CONFIG.UI_ID}-manual-keyword-match" type="hidden" />
                                    <div id="${CONFIG.UI_ID}-manual-keyword-match-segment" class="am26-segment">
                                        <button type="button" data-match-value="广泛匹配">广泛匹配</button>
                                        <button type="button" data-match-value="精准匹配">精准匹配</button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="am26-manual-card">
                            <div class="am26-manual-card-head">
                                <label class="am26-manual-toggle">
                                    <input id="${CONFIG.UI_ID}-manual-switchmatch-enabled" type="checkbox" />
                                    <span>切换匹配方式</span>
                                </label>
                            </div>
                            <div class="am26-manual-switch-item">
                                <span>自动在广泛匹配与精准匹配间切换</span>
                            </div>
                        </div>

                        <div class="am26-manual-card">
                            <div class="am26-manual-card-head">
                                <label class="am26-manual-toggle">
                                    <input id="${CONFIG.UI_ID}-manual-shield-enabled" type="checkbox" />
                                    <span>屏蔽关键词</span>
                                </label>
                            </div>
                            <div class="am26-manual-switch-item">
                                <span>自动屏蔽低转化关键词</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div id="${CONFIG.UI_ID}-manual-setting-hint" style="margin-top:6px;color:#7f8bab;line-height:1.45;">你可直接修改以上参数，提交时按此配置生效。</div>
            `;

            const manualSetting = userConfig.manualEscortSetting && typeof userConfig.manualEscortSetting === 'object'
                ? userConfig.manualEscortSetting
                : {
                    enabled: true,
                    bidConstraintValue: { enabled: false, lowerLimit: 0.15, upperLimit: 0.54, modifyTimesLimit: 10, dailyReset: false },
                    budget: { enabled: true, lowerLimit: 200, upperLimit: '不限', modifyTimesLimit: 20, dailyReset: true },
                    addKeyword: { enabled: true, keywordPreference: '类目流量飙升词', matchType: '广泛匹配', keywordLimit: 200 },
                    switchKeywordMatchType: { enabled: true },
                    shieldKeyword: { enabled: true }
                };
            UI.fillManualEscortSettingForm(manualSetting);
            UI.bindManualKeywordControls();

            content.querySelectorAll('input,select,textarea').forEach(control => {
                control.addEventListener('change', () => {
                    UI.persistManualEscortSettingFromForm();
                });
            });

            return manualSetting;
        },

        // 渲染护航方案表格（到卡片）
        renderEscortActionsToCard: (cardLogger, actionList) => {
            const data = actionList.filter(a => Utils.isValidAction(Utils.getActionName(a)));
            if (!data.length) return;

            UI.renderTableToCard(cardLogger, data, [
                { title: '#', width: '24px', render: (_, i) => i + 1 },
                { title: '方案名称', render: row => Utils.getActionName(row) },
                {
                    title: '详情', render: row => {
                        if (!row.adjustInfo) return '-';
                        try {
                            const info = typeof row.adjustInfo === 'string' ? JSON.parse(row.adjustInfo) : row.adjustInfo;
                            if (info.adjustValue) return `调整值: ${info.adjustValue}`;
                            return info.adjustType || '-';
                        } catch { return '-'; }
                    }
                }
            ], { headerBg: 'rgba(42,91,255,.12)', headerColor: 'var(--am26-primary,#2a5bff)' });
        },

        // 渲染执行结果（全屏模态弹窗）
        renderResults: (successList, failList) => {
            const data = [
                ...successList.map(item => ({ ...item, success: true })),
                ...failList.map(item => ({ ...item, success: false }))
            ];
            if (!data.length) return;

            // 移除旧结果弹窗
            const prevOverlay = document.getElementById(`${CONFIG.UI_ID}-result-overlay`);
            if (prevOverlay) prevOverlay.remove();

            // 创建模态遮罩层
            const overlay = document.createElement('div');
            overlay.id = `${CONFIG.UI_ID}-result-overlay`;
            overlay.style.cssText = `
                position:fixed;top:0;left:0;right:0;bottom:0;
                background:rgba(15,23,42,0.42);backdrop-filter:blur(6px);
                z-index:1000002;display:flex;align-items:center;justify-content:center;
                animation:fadeIn 0.3s ease;
            `;

            // 创建结果卡片
            const successCount = successList.length;
            const failCount = failList.length;
            const totalCount = successCount + failCount;
            const isAllSuccess = failCount === 0;

            const rowsHtml = data.map((row, i) => {
                const safeName = Utils.escapeHtml(row.name ?? '-');
                return `
                                    <tr style="${row.success ? '' : 'background:rgba(234,79,79,.08);'}">
                                        <td style="padding:8px 12px;border-bottom:1px solid var(--am26-border,rgba(255,255,255,.35));color:var(--am26-text-soft,#505a74);">${i + 1}</td>
                                        <td style="padding:8px 12px;border-bottom:1px solid var(--am26-border,rgba(255,255,255,.35));${row.success ? 'color:var(--am26-text,#1b2438);' : 'color:var(--am26-danger,#ea4f4f);'}">${safeName}</td>
                                        <td style="padding:8px 12px;border-bottom:1px solid var(--am26-border,rgba(255,255,255,.35));text-align:center;">
                                            ${row.success
                        ? '<span style="color:var(--am26-success,#0ea86f);font-weight:600;">✓ 成功</span>'
                        : '<span style="color:var(--am26-danger,#ea4f4f);font-weight:600;">✗ 失败</span>'}
                                        </td>
                                    </tr>
                `;
            }).join('');

            overlay.innerHTML = `
                <style>
                    @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
                    @keyframes slideUp { from { transform:translateY(20px);opacity:0; } to { transform:translateY(0);opacity:1; } }
                </style>
                <div style="
                    background:var(--am26-panel-strong,rgba(255,255,255,.45));
                    border:1px solid var(--am26-border,rgba(255,255,255,.4));
                    border-radius:18px;padding:24px 32px;min-width:400px;max-width:600px;
                    box-shadow:0 20px 60px rgba(17,24,39,0.28);animation:slideUp 0.4s ease;
                    color:var(--am26-text,#1b2438);font-family:var(--am26-font,-apple-system,system-ui,sans-serif);
                    backdrop-filter:blur(16px);
                ">
                    <div style="text-align:center;margin-bottom:20px;">
                        <div style="font-size:48px;margin-bottom:12px;">${isAllSuccess ? '🎉' : '⚠️'}</div>
                        <div style="font-size:20px;font-weight:600;color:var(--am26-text,#1b2438);">执行完成</div>
                        <div style="font-size:14px;color:var(--am26-text-soft,#505a74);margin-top:8px;">
                            共 ${totalCount} 个计划，
                            <span style="color:var(--am26-success,#0ea86f);font-weight:600;">${successCount} 成功</span>
                            ${failCount > 0 ? `，<span style="color:var(--am26-danger,#ea4f4f);font-weight:600;">${failCount} 失败</span>` : ''}
                        </div>
                    </div>
                    <div style="max-height:300px;overflow-y:auto;border:1px solid var(--am26-border,rgba(255,255,255,.4));border-radius:12px;">
                        <table style="width:100%;border-collapse:collapse;font-size:13px;">
                            <thead>
                                <tr style="background:rgba(255,255,255,.16);">
                                    <th style="padding:10px 12px;text-align:left;border-bottom:1px solid var(--am26-border,rgba(255,255,255,.35));width:40px;">#</th>
                                    <th style="padding:10px 12px;text-align:left;border-bottom:1px solid var(--am26-border,rgba(255,255,255,.35));">计划名称</th>
                                    <th style="padding:10px 12px;text-align:center;border-bottom:1px solid var(--am26-border,rgba(255,255,255,.35));width:80px;">状态</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${rowsHtml}
                            </tbody>
                        </table>
                    </div>
                    <div style="text-align:center;margin-top:20px;">
                        <button id="${CONFIG.UI_ID}-result-close" style="
                            padding:10px 32px;background:linear-gradient(135deg,var(--am26-primary,#2a5bff),var(--am26-primary-strong,#1d3fcf));color:#fff;
                            border:none;border-radius:10px;cursor:pointer;font-size:14px;font-weight:500;
                            transition:transform 0.2s,box-shadow 0.2s;
                        ">关闭</button>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);

            // 绑定关闭事件
            const closeBtn = document.getElementById(`${CONFIG.UI_ID}-result-close`);
            if (closeBtn) {
                closeBtn.addEventListener('mouseenter', () => {
                    closeBtn.style.transform = 'scale(1.05)';
                    closeBtn.style.boxShadow = '0 4px 12px rgba(42,91,255,0.35)';
                });
                closeBtn.addEventListener('mouseleave', () => {
                    closeBtn.style.transform = 'scale(1)';
                    closeBtn.style.boxShadow = 'none';
                });
            }
            if (closeBtn) closeBtn.onclick = () => {
                overlay.style.opacity = '0';
                overlay.style.transition = 'opacity 0.3s ease';
                setTimeout(() => overlay.remove(), 300);
            };

            // 点击遮罩层也可关闭
            overlay.onclick = (e) => {
                if (e.target === overlay) {
                    overlay.style.opacity = '0';
                    overlay.style.transition = 'opacity 0.3s ease';
                    setTimeout(() => overlay.remove(), 300);
                }
            };
        },

        // 创建主界面
        create: () => {
            if (document.getElementById(CONFIG.UI_ID)) return;

            // 主面板（默认隐藏，用户点击最小化按钮后显示）
            const panel = document.createElement('div');
            panel.id = CONFIG.UI_ID;
            panel.style.cssText = `
                position:fixed;top:20px;right:20px;width:500px;min-width:500px;max-width:1200px;
                padding:15px;background:var(--am26-panel-strong,rgba(255,255,255,.45));
                color:var(--am26-text,#1b2438);border-radius:18px;z-index:1000001;
                font-size:13px;box-shadow:var(--am26-shadow,0 8px 32px rgba(31,38,135,.15));border:1px solid var(--am26-border,rgba(255,255,255,.4));
                font-family:var(--am26-font,-apple-system,system-ui,sans-serif);
                opacity:0;transform:scale(0.8);transform-origin:top right;pointer-events:none;
                transition:opacity 0.3s ease, transform 0.3s ease, width 0.8s cubic-bezier(0.4,0,0.2,1);
                overflow:hidden;
            `;


            panel.innerHTML = `
                <style>
                    #${CONFIG.UI_ID}-log.am26-log-waterfall { column-count:2; column-gap:10px; }
                    #${CONFIG.UI_ID}-log .am26-campaign-card { width:100%; }
                    #${CONFIG.UI_ID}-log .am26-log-status-line { width:100%; }
                    @media (max-width:1100px) {
                        #${CONFIG.UI_ID}-log.am26-log-waterfall { column-count:1; }
                    }
                </style>
                <div style="font-weight:bold;margin-bottom:12px;border-bottom:0;padding-bottom:8px;display:flex;justify-content:space-between;align-items:center;">
                    <span style="color:var(--am26-primary,#2a5bff);">🛡️ 小万护航 v${CONFIG.VERSION}</span>
                    <div style="display:flex;align-items:center;gap:2px;">
                        <span style="font-size:10px;color:var(--am26-text-soft,#505a74);margin-right:6px;opacity:0.6;">API版</span>
                        <span id="${CONFIG.UI_ID}-center" class="am-icon-btn" title="居中">
                            <svg viewBox="0 0 1024 1024" style="width:0.8em;height:0.8em;vertical-align:middle;fill:currentColor;overflow:hidden;"><path d="M838 314H197c-19.9 0-36-16.1-36-36s16.1-36 36-36h641c19.9 0 36 16.1 36 36s-16.1 36-36 36zM745 468H290c-19.9 0-36-16.1-36-36s16.1-36 36-36h455c19.9 0 36 16.1 36 36s-16.1 36-36 36zM838 621H197c-19.9 0-36-16.1-36-36s16.1-36 36-36h641c19.9 0 36 16.1 36 36s-16.1 36-36 36zM745 775H290c-19.9 0-36-16.1-36-36s16.1-36 36-36h455c19.9 0 36 16.1 36 36s-16.1 36-36 36z"></path></svg>
                        </span>
                        <span id="${CONFIG.UI_ID}-maximize" class="am-icon-btn" title="最大化">
                            <svg viewBox="0 0 1024 1024" style="width:0.8em;height:1.0em;vertical-align:middle;fill:currentColor;overflow:hidden;"><path d="M444.3 539.9L202 782.2 199.8 563c0-16.5-13.5-30-30-30s-30 13.5-30 30l2.2 285.1c0 8.8 3.8 16.7 9.8 22.2 5.5 6 13.4 9.8 22.2 9.8h295.6c16.5 0 30-13.5 30-30s-13.5-30-30-30H248.9l237.8-237.8c11.7-11.7 11.7-30.8 0-42.4-11.6-11.6-30.7-11.6-42.4 0zM578.1 488l242.3-242.3 2.2 219.2c0 16.5 13.5 30 30 30s30-13.5 30-30l-2.2-285.1c0-8.8-3.8-16.7-9.8-22.2-5.5-6-13.4-9.8-22.2-9.8H552.8c-16.5 0-30 13.5-30 30s13.5 30 30 30h220.7L535.7 445.6c-11.7 11.7-11.7 30.8 0 42.4 11.7 11.7 30.8 11.7 42.4 0z"></path></svg>
                        </span>
                        <span id="${CONFIG.UI_ID}-close" class="am-icon-btn danger" title="关闭">
                            <svg viewBox="0 0 1024 1024" style="width:1.2em;height:1.2em;vertical-align:middle;fill:currentColor;overflow:hidden;"><path d="M551.424 512l195.072-195.072c9.728-9.728 9.728-25.6 0-36.864l-1.536-1.536c-9.728-9.728-25.6-9.728-35.328 0L514.56 475.136 319.488 280.064c-9.728-9.728-25.6-9.728-35.328 0l-1.536 1.536c-9.728 9.728-9.728 25.6 0 36.864L477.696 512 282.624 707.072c-9.728 9.728-9.728 25.6 0 36.864l1.536 1.536c9.728 9.728 25.6 9.728 35.328 0L514.56 548.864l195.072 195.072c9.728 9.728 25.6 9.728 35.328 0l1.536-1.536c9.728-9.728 9.728-25.6 0-36.864L551.424 512z"></path></svg>
                        </span>
                    </div>
                </div>
                <div id="${CONFIG.UI_ID}-log-wrapper" style="background:rgba(255,255,255,.22);padding:0;border-radius:12px;font-size:11px;height:0;max-height:500px;overflow:hidden;margin-bottom:0;border:1px solid var(--am26-border,rgba(255,255,255,.35));font-family:Monaco,Consolas,monospace;opacity:0;transform:scaleY(0.8);transform-origin:top;transition:all 0.6s ease-out;">
                    <div id="${CONFIG.UI_ID}-log" style="color:var(--am26-text-soft,#505a74);line-height:1.5;padding:10px;"></div>
                </div>
                <div id="${CONFIG.UI_ID}-latest-setting-panel" style="margin-bottom:8px;padding:8px;border:1px solid var(--am26-border,rgba(255,255,255,.35));border-radius:10px;background:rgba(255,255,255,.24);">
                    <div id="${CONFIG.UI_ID}-latest-setting-content" style="font-size:10px;line-height:1.45;color:#4d5875;">正在读取...</div>
                </div>
                <button id="${CONFIG.UI_ID}-run" style="width:100%;padding:8px;background:linear-gradient(135deg,var(--am26-primary,#2a5bff),var(--am26-primary-strong,#1d3fcf));color:#fff;border:none;border-radius:10px;cursor:pointer;font-weight:500;margin-bottom:8px;">立即扫描并优化</button>
                <div style="margin-bottom:8px;display:flex;gap:5px;align-items:center;">
                    <label style="color:var(--am26-text-soft,#505a74);font-size:10px;white-space:nowrap;">诊断话术:</label>
                    <input id="${CONFIG.UI_ID}-prompt" type="text" style="flex:1;padding:4px;border:1px solid var(--am26-border,rgba(255,255,255,.45));border-radius:10px;font-size:10px;background:rgba(255,255,255,.72);color:var(--am26-text,#1b2438);" placeholder="例: 深度拿量" />
                </div>
                <div style="margin-bottom:8px;display:flex;gap:5px;align-items:center;">
                    <label style="color:var(--am26-text-soft,#505a74);font-size:10px;white-space:nowrap;">同时执行:</label>
                    <input id="${CONFIG.UI_ID}-concurrency" type="number" min="1" max="10" style="width:50px;padding:4px;border:1px solid var(--am26-border,rgba(255,255,255,.45));border-radius:10px;font-size:10px;text-align:center;background:rgba(255,255,255,.72);color:var(--am26-text,#1b2438);" />
                    <span style="color:var(--am26-text-soft,#505a74);font-size:10px;">个计划 (1-10)</span>
                </div>
                <div style="margin-top:10px;font-size:10px;color:var(--am26-text-soft,#505a74);display:flex;justify-content:space-between;">
                    <span id="${CONFIG.UI_ID}-user" style="max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"></span>
                    <span id="${CONFIG.UI_ID}-token" style="cursor:help;" title="Token状态">● Token</span>
                </div>
            `;

            document.body.appendChild(panel);

            const promptInput = document.getElementById(`${CONFIG.UI_ID}-prompt`);
            if (promptInput) promptInput.value = userConfig.customPrompt || CONFIG.DEFAULT.customPrompt;
            const concurrencyInput = document.getElementById(`${CONFIG.UI_ID}-concurrency`);
            if (concurrencyInput) concurrencyInput.value = userConfig.concurrency || 3;
            UI.renderLatestEscortSettingPreview();

            // 事件绑定
            ['center', 'maximize', 'close'].forEach(key => {
                const el = document.getElementById(`${CONFIG.UI_ID}-${key}`);
                if (!el) return;
                el.addEventListener('mouseenter', () => { el.style.color = 'var(--am26-primary,#2a5bff)'; });
                el.addEventListener('mouseleave', () => { el.style.color = 'var(--am26-text-soft,#505a74)'; });
            });

            document.getElementById(`${CONFIG.UI_ID}-close`).onclick = () => {
                panel.style.opacity = '0';
                panel.style.transform = 'scale(0.8)';
                panel.style.pointerEvents = 'none';
            };

            // 居中按钮事件（切换模式）
            document.getElementById(`${CONFIG.UI_ID}-center`).onclick = () => {
                const isCentered = panel.dataset.centered === 'true';

                if (isCentered) {
                    // 恢复原位置（右上角）
                    panel.style.left = 'auto';
                    panel.style.right = '20px';
                    panel.style.top = '20px';
                    panel.dataset.centered = 'false';
                } else {
                    // 居中显示
                    const panelWidth = panel.offsetWidth;
                    const panelHeight = panel.offsetHeight;
                    const screenWidth = window.innerWidth;
                    const screenHeight = window.innerHeight;
                    panel.style.left = `${(screenWidth - panelWidth) / 2}px`;
                    panel.style.top = `${(screenHeight - panelHeight) / 2}px`;
                    panel.style.right = 'auto';
                    panel.dataset.centered = 'true';
                }
            };

            const getLogAreaAvailableHeight = (screenHeight) => {
                const settingPanel = document.getElementById(`${CONFIG.UI_ID}-latest-setting-panel`);
                const reservedHeight = settingPanel && settingPanel.style.display !== 'none' ? 300 : 180;
                return Math.max(200, screenHeight - 40 - reservedHeight);
            };
            const runBtn = document.getElementById(`${CONFIG.UI_ID}-run`);
            const setRunButtonMode = (mode = 'run') => {
                // 跨 userscript/extension 运行上下文时，instanceof 可能失效，这里只做最小可用检查。
                if (!runBtn || runBtn.nodeType !== 1) return;
                if (mode === 'back') {
                    runBtn.dataset.mode = 'back';
                    runBtn.textContent = '返回';
                    runBtn.style.background = 'linear-gradient(135deg,#6b7280,#4b5563)';
                    return;
                }
                runBtn.dataset.mode = 'run';
                runBtn.textContent = '立即扫描并优化';
                runBtn.style.background = 'linear-gradient(135deg,var(--am26-primary,#2a5bff),var(--am26-primary-strong,#1d3fcf))';
            };
            const restoreIdlePanelView = ({ clearLog = true } = {}) => {
                const wrapper = document.getElementById(`${CONFIG.UI_ID}-log-wrapper`);
                const logEl = document.getElementById(`${CONFIG.UI_ID}-log`);
                const settingPanel = document.getElementById(`${CONFIG.UI_ID}-latest-setting-panel`);

                if (settingPanel) settingPanel.style.display = '';
                if (logEl) {
                    logEl.classList.remove('am26-log-waterfall');
                    if (clearLog) logEl.textContent = '';
                }
                if (wrapper) {
                    wrapper.dataset.expanded = '';
                    wrapper.style.height = '0';
                    wrapper.style.maxHeight = '500px';
                    wrapper.style.opacity = '0';
                    wrapper.style.marginBottom = '0';
                    wrapper.style.transform = 'scaleY(0.8)';
                    wrapper.style.overflow = 'hidden';
                }

                panel.style.width = '500px';
                panel.style.height = 'auto';
                panel.style.top = '20px';
                panel.style.right = '20px';
                panel.style.left = 'auto';
                panel.dataset.maximized = 'false';
                panel.dataset.centered = 'false';
                setRunButtonMode('run');
            };
            setRunButtonMode('run');

            // 最大化按钮事件
            document.getElementById(`${CONFIG.UI_ID}-maximize`).onclick = () => {
                const wrapper = document.getElementById(`${CONFIG.UI_ID}-log-wrapper`);
                const isMaximized = panel.dataset.maximized === 'true';

                if (isMaximized) {
                    // 恢复默认尺寸
                    panel.style.top = '20px';
                    panel.style.height = 'auto';
                    if (wrapper) {
                        wrapper.style.height = '200px';
                        wrapper.style.maxHeight = '500px';
                    }
                    panel.dataset.maximized = 'false';
                } else {
                    // 最大化：高度占满屏幕，宽度保持不变
                    const screenHeight = window.innerHeight;
                    panel.style.top = '20px';
                    panel.style.height = `${screenHeight - 40}px`;  // 上下各留 20px 边距
                    if (wrapper) {
                        wrapper.dataset.expanded = 'true';
                        // 计算日志区域可用高度：根据参数区可见状态动态预留空间
                        wrapper.style.height = `${getLogAreaAvailableHeight(screenHeight)}px`;
                        wrapper.style.maxHeight = 'none';
                        wrapper.style.opacity = '1';
                        wrapper.style.marginBottom = '12px';
                        wrapper.style.transform = 'scaleY(1)';
                        setTimeout(() => wrapper.style.overflow = 'auto', 300);
                    }
                    panel.dataset.maximized = 'true';
                }
            };

            if (runBtn) runBtn.onclick = () => {
                if (runBtn.dataset.mode === 'back') {
                    try {
                        if (State.runAbortController) State.runAbortController.abort();
                    } catch { }
                    State.currentRunId++;
                    restoreIdlePanelView({ clearLog: true });
                    return;
                }

                UI.persistManualEscortSettingFromForm();
                const settingPanel = document.getElementById(`${CONFIG.UI_ID}-latest-setting-panel`);
                if (settingPanel) settingPanel.style.display = 'none';
                const logEl = document.getElementById(`${CONFIG.UI_ID}-log`);
                if (logEl) logEl.classList.add('am26-log-waterfall');
                // 展开日志区域（使用最大化效果）
                const wrapper = document.getElementById(`${CONFIG.UI_ID}-log-wrapper`);
                if (wrapper && (!wrapper.dataset.expanded || panel.dataset.maximized !== 'true')) {
                    const screenHeight = window.innerHeight;
                    panel.style.top = '20px';
                    panel.style.height = `${screenHeight - 40}px`;
                    panel.style.width = '1000px';
                    wrapper.dataset.expanded = 'true';
                    wrapper.style.height = `${getLogAreaAvailableHeight(screenHeight)}px`;
                    wrapper.style.maxHeight = 'none';
                    wrapper.style.opacity = '1';
                    wrapper.style.marginBottom = '12px';
                    wrapper.style.transform = 'scaleY(1)';
                    setTimeout(() => wrapper.style.overflow = 'auto', 300);
                    panel.dataset.maximized = 'true';
                }
                setRunButtonMode('back');

                // 保存配置
                const prompt = document.getElementById(`${CONFIG.UI_ID}-prompt`).value.trim();
                const concurrency = parseInt(document.getElementById(`${CONFIG.UI_ID}-concurrency`).value) || 3;
                userConfig.customPrompt = prompt || CONFIG.DEFAULT.customPrompt;
                userConfig.concurrency = Math.min(10, Math.max(1, concurrency));
                GM_setValue('config', userConfig);

                Core.run();
            };

            // ==================== 拖拽调整尺寸 ====================
            let resizeState = { active: null, startX: 0, startY: 0, startW: 0, startH: 0 };

            // 左侧拖拽条（调整宽度）
            const resizerLeft = document.createElement('div');
            resizerLeft.style.cssText = 'position:absolute;left:0;top:0;bottom:0;width:6px;cursor:ew-resize;z-index:10;';
            resizerLeft.onmouseenter = () => resizerLeft.style.background = 'rgba(42,91,255,0.28)';
            resizerLeft.onmouseleave = () => resizerLeft.style.background = 'transparent';
            panel.appendChild(resizerLeft);

            // 底部拖拽条（调整高度）
            const resizerBottom = document.createElement('div');
            resizerBottom.style.cssText = 'position:absolute;left:0;right:0;bottom:0;height:6px;cursor:ns-resize;z-index:10;';
            resizerBottom.onmouseenter = () => resizerBottom.style.background = 'rgba(42,91,255,0.28)';
            resizerBottom.onmouseleave = () => resizerBottom.style.background = 'transparent';
            panel.appendChild(resizerBottom);

            // 左下角（同时调整宽高）
            const resizerCorner = document.createElement('div');
            resizerCorner.style.cssText = 'position:absolute;left:0;bottom:0;width:12px;height:12px;cursor:nesw-resize;z-index:11;';
            resizerCorner.onmouseenter = () => resizerCorner.style.background = 'rgba(42,91,255,0.42)';
            resizerCorner.onmouseleave = () => resizerCorner.style.background = 'transparent';
            panel.appendChild(resizerCorner);

            const startResize = (type, e) => {
                resizeState = {
                    active: type,
                    startX: e.clientX,
                    startY: e.clientY,
                    startW: panel.offsetWidth,
                    startH: document.getElementById(`${CONFIG.UI_ID}-log-wrapper`)?.offsetHeight || 200
                };
                e.preventDefault();
                document.body.style.userSelect = 'none';
            };

            const onResizeMove = e => {
                const wrapper = document.getElementById(`${CONFIG.UI_ID}-log-wrapper`);
                if (resizeState.active === 'width' || resizeState.active === 'both') {
                    panel.style.width = Math.min(1400, Math.max(400, resizeState.startW + resizeState.startX - e.clientX)) + 'px';
                }
                if ((resizeState.active === 'height' || resizeState.active === 'both') && wrapper) {
                    wrapper.style.height = Math.min(500, Math.max(100, resizeState.startH + e.clientY - resizeState.startY)) + 'px';
                }
            };

            const onResizeEnd = () => {
                resizeState.active = null;
                document.body.style.userSelect = '';
                document.removeEventListener('mousemove', onResizeMove);
                document.removeEventListener('mouseup', onResizeEnd);
            };

            const bindResize = (type, e) => {
                startResize(type, e);
                document.addEventListener('mousemove', onResizeMove);
                document.addEventListener('mouseup', onResizeEnd);
            };

            resizerLeft.onmousedown = e => bindResize('width', e);
            resizerBottom.onmousedown = e => bindResize('height', e);
            resizerCorner.onmousedown = e => bindResize('both', e);

            // Token 状态检测
            let lastTokenRefreshAt = 0;
            setInterval(() => {
                const now = Date.now();
                const tokenReady = !!(State.tokens.dynamicToken && State.tokens.loginPointId);
                if (!tokenReady && now - lastTokenRefreshAt >= 2500) {
                    lastTokenRefreshAt = now;
                    try {
                        TokenManager.refresh();
                    } catch { }
                }
                const tokenDot = document.getElementById(`${CONFIG.UI_ID}-token`);
                if (tokenDot) {
                    tokenDot.style.color = (State.tokens.dynamicToken && State.tokens.loginPointId) ? '#52c41a' : '#ff4d4f';
                }
            }, 1000);
        }
    };

    // ==================== 核心业务逻辑 ====================
