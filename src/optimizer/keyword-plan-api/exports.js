        const createSitePlansBatch = (request = {}, options = {}) => createPlansByScene('货品全站推广', request, options);
        const createKeywordPlansBatch = (request = {}, options = {}) => createPlansByScene('关键词推广', request, options);
        const createCrowdPlansBatch = (request = {}, options = {}) => createPlansByScene('人群推广', request, options);
        const createShopDirectPlansBatch = (request = {}, options = {}) => createPlansByScene('店铺直达', request, options);
        const createContentPlansBatch = (request = {}, options = {}) => createPlansByScene('内容营销', request, options);
        const createLeadPlansBatch = (request = {}, options = {}) => createPlansByScene('线索推广', request, options);

        return {
            buildVersion: BUILD_VERSION,
            openWizard,
            getRuntimeDefaults,
            searchItems,
            createPlansBatch,
            createPlansByScene,
            createSitePlansBatch,
            createKeywordPlansBatch,
            createCrowdPlansBatch,
            createShopDirectPlansBatch,
            createContentPlansBatch,
            createLeadPlansBatch,
            applyMatrixPreset,
            runCreateRepairByItem,
            appendKeywords,
            suggestKeywords,
            suggestCrowds,
            validate,
            getSessionDraft,
            clearSessionDraft
        };
    })();

    // ==================== UI 渲染模块 ====================
