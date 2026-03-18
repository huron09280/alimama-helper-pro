    window.__ALIMAMA_OPTIMIZER_TOGGLE__ = () => {
        const panel = document.getElementById(CONFIG.UI_ID);
        if (!panel) {
            UI.create();
            setTimeout(() => {
                const p = document.getElementById(CONFIG.UI_ID);
                if (p) {
                    p.style.opacity = '1';
                    p.style.transform = 'scale(1)';
                    p.style.pointerEvents = 'auto';
                }
            }, 100);
        } else {
            if (panel.style.opacity === '0' || panel.style.opacity === '') {
                panel.style.opacity = '1';
                panel.style.transform = 'scale(1)';
                panel.style.pointerEvents = 'auto';
            } else {
                panel.style.boxShadow = '0 0 20px rgba(24,144,255,0.8)';
                setTimeout(() => panel.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)', 500);
            }
        }
    };

    // [INTEGRATED] Expose run campaign function for MagicReport
    window.__ALIMAMA_OPTIMIZER_RUN_CAMPAIGN__ = async (campaignId, customPrompt) => {
        // 覆盖配置
        userConfig.customPrompt = customPrompt || userConfig.customPrompt;

        // 确保 Token 就绪
        TokenManager.refresh();
        if (!State.tokens.loginPointId || !State.tokens.dynamicToken) {
            return { success: false, msg: 'Token 未就绪，请先在页面点击任意处' };
        }

        // 调用处理逻辑
        // 我们利用 ProcessCampaign，但把 UI 部分剥离或复用？
        // processCampaign 依赖 UI.createCampaignCard。
        // 为了 Magic Report，我们希望它仅仅返回结果，或者我们可以让 Logic 自己处理 UI。
        // 这里简单地调用 processCampaign，它会把日志输出到 Escort 面板。
        // 如果我们想要 Magic Report 独立显示，我们需要修改 Core.processCampaign
        // 但为了最小化修改，我们暂时让它在后台跑，并返回结果。

        // 确保 ESCORT UI 存在（因为 ProcessCampaign 依赖 UI 创建卡片）
        if (!document.getElementById(CONFIG.UI_ID)) UI.create();

        // 强制展开 Escort 面板 (可选)
        // window.__ALIMAMA_OPTIMIZER_TOGGLE__();

        try {
            const res = await Core.processCampaign(campaignId, '万能查数任务', 1, 1);
            return res;
        } catch (e) {
            return { success: false, msg: e.message };
        }
    };
})();
