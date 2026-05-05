        const normalizeMatrixDimensionValuesByPreset = (values = [], preset = null) => {
            const normalizedValues = normalizeMatrixDimensionValues(values);
            if (String(preset?.key || '').trim() === 'bid_target_cost_package') {
                return uniqueBy(
                    normalizedValues
                        .map(item => parseMatrixBidTargetCostPackageValue(item)?.rawValue || '')
                        .filter(Boolean),
                    item => item
                );
            }
            return normalizedValues;
        };

        const buildMatrixCombinationValueLabel = (dimension = {}, value = '', sceneName = '') => {
            const preset = getMatrixDimensionPresetByKey(dimension?.key || '', sceneName);
            if (String(preset?.key || '').trim() === 'bid_target_cost_package') {
                return parseMatrixBidTargetCostPackageValue(value)?.displayLabel || String(value || '').trim();
            }
            if (typeof isMatrixTrendThemeFieldLabel === 'function' && isMatrixTrendThemeFieldLabel(preset?.label || preset?.key || '')) {
                return describeMatrixTrendThemeRawValue(value);
            }
            return String(value || '').trim();
        };

        const serializeMatrixDimensionValues = (values = []) => (
            normalizeMatrixDimensionValues(values).join('\n')
        );

        const collectMatrixMaterialDimensionValues = (itemList = []) => (
            uniqueBy(
                (Array.isArray(itemList) ? itemList : [])
                    .map(item => String(toIdValue(item?.materialId || item?.itemId || '')).trim())
                    .filter(item => /^\d{4,}$/.test(item)),
                item => item
            ).slice(0, 5)
        );

        const collectDefaultSelectedMatrixMaterialDimensionValues = (itemList = []) => (
            collectMatrixMaterialDimensionValues(itemList).slice(0, 1)
        );

        const buildMatrixDimensionDraft = (key = '', options = {}) => {
            const sceneName = String(options?.sceneName || '').trim();
            const preset = getMatrixDimensionPresetByKey(key, sceneName);
            if (!preset) return null;
            const itemList = Array.isArray(options?.itemList) ? options.itemList : [];
            const defaultMaterialValues = preset.key === 'material_id'
                ? collectDefaultSelectedMatrixMaterialDimensionValues(itemList)
                : [];
            const nextValues = normalizeMatrixDimensionValuesByPreset(
                Array.isArray(options?.values) && options.values.length
                    ? options.values
                    : (preset.key === 'material_id' ? defaultMaterialValues : preset.suggestedValues),
                preset
            );
            return {
                key: preset.key,
                label: String(options?.label || preset.label || preset.key).trim(),
                values: nextValues,
                enabled: options?.enabled !== false
            };
        };

        const normalizeMatrixDimension = (dimension = {}, sceneName = '') => {
            const normalized = isPlainObject(dimension) ? { ...dimension } : {};
            const key = String(normalized.key || normalized.id || '').trim();
            const preset = getMatrixDimensionPresetByKey(key, sceneName);
            if (!preset) return null;
            const label = String(normalized.label || normalized.name || preset?.label || key || '').trim();
            const values = normalizeMatrixDimensionValuesByPreset(
                Array.isArray(normalized.values) ? normalized.values : (Array.isArray(normalized.options) ? normalized.options : [])
                , preset
            );
            return {
                key,
                label: label || key,
                values,
                enabled: normalized.enabled !== false
            };
        };

        const syncMatrixMaterialDimensionValues = (matrixConfig = {}, itemList = [], sceneName = '') => {
            const currentSceneName = getMatrixSceneName(sceneName || matrixConfig?.sceneName || '');
            const nextMatrixConfig = normalizeMatrixConfig(matrixConfig, currentSceneName);
            const materialValues = collectMatrixMaterialDimensionValues(itemList);
            const defaultSelectedValues = collectDefaultSelectedMatrixMaterialDimensionValues(itemList);
            const materialValueSet = new Set(materialValues);
            nextMatrixConfig.dimensions = nextMatrixConfig.dimensions.map((dimension) => {
                if (dimension.key !== 'material_id') return dimension;
                const currentValues = normalizeMatrixDimensionValues(dimension.values || []);
                const validValues = currentValues.filter(value => materialValueSet.has(value));
                const nextValues = validValues.length ? validValues : defaultSelectedValues;
                return {
                    ...dimension,
                    values: nextValues
                };
            });
            nextMatrixConfig.sceneName = currentSceneName;
            return nextMatrixConfig;
        };

        const normalizeMatrixConfig = (matrixConfig = {}, sceneName = '') => {
            const base = buildDefaultMatrixConfig();
            const raw = isPlainObject(matrixConfig) ? matrixConfig : {};
            const dimensions = uniqueBy(
                (Array.isArray(raw.dimensions) ? raw.dimensions : [])
                    .map(item => normalizeMatrixDimension(item, sceneName))
                    .filter(item => item?.key),
                item => item.key
            );
            return {
                enabled: raw.enabled === true,
                maxCombinations: Math.max(1, Math.min(200, toNumber(raw.maxCombinations, base.maxCombinations) || base.maxCombinations)),
                batchSize: Math.max(1, Math.min(50, toNumber(raw.batchSize, base.batchSize) || base.batchSize)),
                namingPattern: String(raw.namingPattern || base.namingPattern || '').trim() || base.namingPattern,
                dimensions,
                sceneName: String(sceneName || raw.sceneName || '').trim()
            };
        };

        const scrollMatrixDimensionRowIntoView = (presetKey = '') => {
            const targetKey = String(presetKey || '').trim();
            if (!targetKey) return;
            if (!(wizardState?.els?.matrixDimensionList instanceof HTMLElement)) return;
            const targetRow = Array.from(
                wizardState.els.matrixDimensionList.querySelectorAll('[data-matrix-dimension-row="1"]')
            ).find((row) => (
                String(row.querySelector('[data-matrix-dimension-key="1"]')?.value || '').trim() === targetKey
            ));
            if (!(targetRow instanceof HTMLElement)) return;
            requestAnimationFrame(() => {
                targetRow.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                const valuesInput = targetRow.querySelector('[data-matrix-bid-package-target="1"], [data-matrix-bid-package-cost="1"], [data-matrix-dimension-value-item-input="1"], [data-matrix-dimension-value-add="1"], [data-matrix-dimension-values="1"], [data-matrix-dimension-picker-toggle="1"], [data-matrix-dimension-values-select="1"]');
                if (
                    valuesInput instanceof HTMLTextAreaElement
                    || valuesInput instanceof HTMLSelectElement
                    || valuesInput instanceof HTMLButtonElement
                    || valuesInput instanceof HTMLInputElement
                ) {
                    valuesInput.focus({ preventScroll: true });
                }
            });
        };
