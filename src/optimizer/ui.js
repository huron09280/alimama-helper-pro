    const UI = {
        // 公共样式
        styles: {
            table: `width:100%;border-collapse:collapse;font-size:10px;margin:4px 0 8px;border-radius:12px;overflow:hidden;border:1px solid var(--am26-border,rgba(255,255,255,.4));background:rgb(227 227 227 / 20%);`,
            th: `padding:5px 6px;text-align:left;font-weight:600;border-bottom:1px solid var(--am26-border,rgba(255,255,255,.4));background:rgba(255,255,255,.14);color:var(--am26-text,#1b2438);`,
            td: `padding:4px 6px;border-bottom:1px solid var(--am26-border,rgba(255,255,255,.28));color:var(--am26-text-soft,#505a74);`
        },

        // 全局状态日志（用于非计划相关的消息）
        updateStatus: (text, color = '#aaa') => {
            const container = document.getElementById(`${CONFIG.UI_ID}-log`);
            if (!container) return;

            const time = new Date().toLocaleTimeString('zh-CN', { hour12: false });
            const line = document.createElement('div');
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
            card.style.cssText = `
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
                highlight: row => row.actionText?.includes('算法护航')
            });
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
                position:fixed;top:20px;right:20px;width:250px;min-width:250px;max-width:600px;
                padding:15px;background:var(--am26-panel-strong,rgba(255,255,255,.45));
                color:var(--am26-text,#1b2438);border-radius:18px;z-index:1000001;
                font-size:13px;box-shadow:var(--am26-shadow,0 8px 32px rgba(31,38,135,.15));border:1px solid var(--am26-border,rgba(255,255,255,.4));
                font-family:var(--am26-font,-apple-system,system-ui,sans-serif);
                opacity:0;transform:scale(0.8);transform-origin:top right;pointer-events:none;
                transition:opacity 0.3s ease, transform 0.3s ease, width 0.8s cubic-bezier(0.4,0,0.2,1);
                overflow:hidden;
            `;


            panel.innerHTML = `
                <div style="font-weight:bold;margin-bottom:12px;border-bottom:0;padding-bottom:8px;display:flex;justify-content:space-between;align-items:center;">
                    <span style="color:var(--am26-primary,#2a5bff);">🛡️ 算法护航 v${CONFIG.VERSION}</span>
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
                    <div id="${CONFIG.UI_ID}-log" style="color:var(--am26-text-soft,#505a74);display:flex;flex-direction:column;gap:3px;line-height:1.5;padding:10px;"></div>
                </div>
                <button id="${CONFIG.UI_ID}-run" style="width:100%;padding:8px;background:linear-gradient(135deg,var(--am26-primary,#2a5bff),var(--am26-primary-strong,#1d3fcf));color:#fff;border:none;border-radius:10px;cursor:pointer;font-weight:500;margin-bottom:8px;">立即扫描并优化</button>
                <div style="margin-bottom:8px;display:flex;gap:5px;align-items:center;">
                    <label style="color:var(--am26-text-soft,#505a74);font-size:10px;white-space:nowrap;">诊断话术:</label>
                    <input id="${CONFIG.UI_ID}-prompt" type="text" style="flex:1;padding:4px;border:1px solid var(--am26-border,rgba(255,255,255,.45));border-radius:10px;font-size:10px;background:rgba(255,255,255,.72);color:var(--am26-text,#1b2438);" placeholder="例: 帮我进行深度诊断" />
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
                        // 计算日志区域可用高度：额外预留 100px 给下方配置区，避免遮挡
                        const availableHeight = screenHeight - 40 - 300;
                        wrapper.style.height = `${Math.max(200, availableHeight)}px`;
                        wrapper.style.maxHeight = 'none';
                        wrapper.style.opacity = '1';
                        wrapper.style.marginBottom = '12px';
                        wrapper.style.transform = 'scaleY(1)';
                        setTimeout(() => wrapper.style.overflow = 'auto', 300);
                    }
                    panel.dataset.maximized = 'true';
                }
            };

            document.getElementById(`${CONFIG.UI_ID}-run`).onclick = () => {
                // 展开日志区域（使用最大化效果）
                const wrapper = document.getElementById(`${CONFIG.UI_ID}-log-wrapper`);
                if (!wrapper.dataset.expanded || panel.dataset.maximized !== 'true') {
                    const screenHeight = window.innerHeight;
                    panel.style.top = '20px';
                    panel.style.height = `${screenHeight - 40}px`;
                    panel.style.width = '600px';
                    wrapper.dataset.expanded = 'true';
                    const availableHeight = screenHeight - 40 - 300;
                    wrapper.style.height = `${Math.max(200, availableHeight)}px`;
                    wrapper.style.maxHeight = 'none';
                    wrapper.style.opacity = '1';
                    wrapper.style.marginBottom = '12px';
                    wrapper.style.transform = 'scaleY(1)';
                    setTimeout(() => wrapper.style.overflow = 'auto', 300);
                    panel.dataset.maximized = 'true';
                }

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
                    panel.style.width = Math.min(800, Math.max(200, resizeState.startW + resizeState.startX - e.clientX)) + 'px';
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
            setInterval(() => {
                const tokenDot = document.getElementById(`${CONFIG.UI_ID}-token`);
                if (tokenDot) {
                    tokenDot.style.color = (State.tokens.dynamicToken && State.tokens.loginPointId) ? '#52c41a' : '#ff4d4f';
                }
            }, 1000);
        }
    };

    // ==================== 核心业务逻辑 ====================
