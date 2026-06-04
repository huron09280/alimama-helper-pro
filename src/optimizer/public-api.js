    let lastOptimizerLicenseError = null;
    const resolveOptimizerLicenseGuard = () => {
        try {
            if (typeof globalThis !== 'undefined' && globalThis.LicenseGuard) return globalThis.LicenseGuard;
            return window.LicenseGuard || null;
        } catch { }
        return null;
    };
    const buildOptimizerLicenseDeniedResult = (source = 'optimizer_public_api') => {
        const guard = resolveOptimizerLicenseGuard();
        if (guard && typeof guard.buildDeniedResult === 'function') {
            return guard.buildDeniedResult(lastOptimizerLicenseError, source);
        }
        return {
            success: false,
            code: String(lastOptimizerLicenseError?.code || 'license_required'),
            msg: String(lastOptimizerLicenseError?.message || '授权未通过'),
            source
        };
    };
    const requireOptimizerLicense = (source = 'optimizer_public_api') => {
        const guard = resolveOptimizerLicenseGuard();
        if (!guard || typeof guard.requireAuthorizedSync !== 'function') return true;
        try {
            guard.requireAuthorizedSync(source);
            lastOptimizerLicenseError = null;
            return true;
        } catch (err) {
            lastOptimizerLicenseError = err;
            try {
                guard.triggerOnDemandVerify?.(source);
            } catch { }
            Logger.warn(`授权未通过，已阻止算法护航入口：${err?.message || 'unknown'}`);
            return false;
        }
    };

    const revealOptimizerPanel = (panel) => {
        if (!panel) return;
        UI.startTokenStatusMonitor?.();
        if (panel.style.opacity === '0' || panel.style.opacity === '') {
            panel.style.opacity = '1';
            panel.style.transform = 'scale(1)';
            panel.style.pointerEvents = 'auto';
        } else {
            UI.flashPanelHighlight?.(panel);
        }
    };

    window.__ALIMAMA_OPTIMIZER_TOGGLE__ = () => {
        try {
            if (!requireOptimizerLicense('optimizer_toggle')) return false;
            const panel = document.getElementById(CONFIG.UI_ID);
            if (!panel) {
                UI.create();
                UI.schedulePanelReveal?.((createdPanel) => {
                    try {
                        revealOptimizerPanel(createdPanel);
                    } catch (err) {
                        Logger.error('算法护航面板展示失败', err);
                    }
                });
                return true;
            }
            if (panel.style.opacity === '0' || panel.style.opacity === '') {
                revealOptimizerPanel(panel);
                return true;
            }
            UI.flashPanelHighlight?.(panel);
            return true;
        } catch (err) {
            Logger.error('算法护航面板切换失败', err);
            return false;
        }
    };

    // [INTEGRATED] Expose run campaign function for MagicReport
    window.__ALIMAMA_OPTIMIZER_RUN_CAMPAIGN__ = async (campaignId, customPrompt) => {
        try {
            if (!requireOptimizerLicense('optimizer_run_campaign')) {
                return buildOptimizerLicenseDeniedResult('optimizer_run_campaign');
            }
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

            const res = await Core.processCampaign(campaignId, '万能查数任务', 1, 1);
            return res;
        } catch (e) {
            Logger.error('MagicReport 调用算法护航失败', e);
            return { success: false, msg: e?.message || '算法护航执行失败' };
        }
    };
})();
