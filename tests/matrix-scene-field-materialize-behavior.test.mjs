import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const matrixSource = readFileSync(new URL('../src/optimizer/keyword-plan-api/matrix.js', import.meta.url), 'utf8');

function loadMatrixRuntime() {
    const start = matrixSource.indexOf('const applyMatrixNamingPattern = (pattern = MATRIX_DEFAULT_NAMING_PATTERN, plan = {}, combination = {}, index = 0) => {');
    const end = matrixSource.indexOf('const wizardDefaultDraft = () => ({', start);
    assert.ok(start > -1 && end > start, '无法定位矩阵物化运行时代码块');
    const block = matrixSource.slice(start, end);

    return Function(`
        const MATRIX_DEFAULT_NAMING_PATTERN = '{planName}_{index}';
        const MATRIX_SCENE_FIELD_KEY_PREFIX = 'scene_field:';
        const isPlainObject = (value) => !!value && typeof value === 'object' && !Array.isArray(value);
        const cloneValue = (value) => {
            if (Array.isArray(value)) return value.map(cloneValue);
            if (!isPlainObject(value)) return value;
            return Object.keys(value).reduce((acc, key) => {
                acc[key] = cloneValue(value[key]);
                return acc;
            }, {});
        };
        const mergeDeep = (...objects) => objects.reduce((acc, sourceObj) => {
            if (!isPlainObject(sourceObj)) return acc;
            Object.keys(sourceObj).forEach((key) => {
                const nextValue = sourceObj[key];
                if (isPlainObject(nextValue) && isPlainObject(acc[key])) {
                    acc[key] = mergeDeep(acc[key], nextValue);
                    return;
                }
                acc[key] = cloneValue(nextValue);
            });
            return acc;
        }, {});
        const normalizeText = (value = '') => String(value ?? '').trim();
        const toNumber = (value = 0, fallback = 0) => {
            const parsed = Number(value);
            return Number.isFinite(parsed) ? parsed : fallback;
        };
        const chunk = (list = [], size = 1) => {
            const output = [];
            for (let index = 0; index < list.length; index += size) {
                output.push(list.slice(index, index + size));
            }
            return output;
        };
        const toIdValue = (value = '') => String(value ?? '').trim();
        const normalizeItem = (item = {}) => cloneValue(item);
        const normalizeSceneFieldKey = (label = '') => {
            const raw = String(label || '').trim();
            if (!raw) return 'field';
            if (/^(campaign|adgroup)\\./i.test(raw)) return raw.replace(/\\s+/g, '');
            return raw
                .replace(/[^\\u4e00-\\u9fa5A-Za-z0-9]+/g, '_')
                .replace(/^_+|_+$/g, '') || 'field';
        };
        const isMatrixSceneFieldBindingKey = (key = '') => /^scene_field:/i.test(String(key || '').trim());
        const normalizeMatrixSceneRenderFieldLabel = (fieldLabel = '') => String(fieldLabel || '').replace(/[：:]/g, '').trim();
        const isMatrixTrendThemeFieldLabel = (fieldLabel = '') => {
            const normalized = normalizeMatrixSceneRenderFieldLabel(fieldLabel);
            const token = normalized.replace(/[\\s_-]+/g, '');
            return /^campaign\\.trendThemeList$/i.test(normalized)
                || /^(选择趋势主题|趋势主题|趋势主题列表)$/.test(token);
        };
        const serializeMatrixTrendThemeRawValue = (rawValue = '') => {
            if (String(rawValue || '').trim() === '[]') return '[]';
            let parsed = rawValue;
            if (typeof rawValue === 'string') {
                try {
                    parsed = JSON.parse(rawValue);
                } catch {
                    return '';
                }
            }
            const list = Array.isArray(parsed) ? parsed : (isPlainObject(parsed) ? [parsed] : []);
            return list.length ? JSON.stringify(list) : '';
        };
        ${block}
        return {
            materializePlansFromMatrix
        };
    `)();
}

test('矩阵物化会把动态场景字段写回 sceneSettings 和 sceneSettingValues', () => {
    const { materializePlansFromMatrix } = loadMatrixRuntime();
    const plans = materializePlansFromMatrix(
        [{
            sceneName: '关键词推广',
            planName: '模板计划',
            sceneSettings: {},
            sceneSettingValues: {}
        }],
        [{
            values: [{
                key: 'scene_field:冷启加速',
                value: '开启',
                label: '开启',
                dimensionLabel: '冷启加速'
            }],
            labels: ['冷启加速=开启']
        }],
        { sceneName: '关键词推广' }
    );

    assert.equal(plans.length, 1);
    assert.equal(plans[0].sceneSettings['冷启加速'], '开启');
    assert.equal(plans[0].sceneSettingValues['冷启加速'], '开启');
});

test('矩阵物化会把趋势主题场景字段落到 campaign.trendThemeList', () => {
    const { materializePlansFromMatrix } = loadMatrixRuntime();
    const trendThemeRaw = JSON.stringify([
        {
            trendThemeId: '101',
            trendThemeName: '露营推车'
        }
    ]);
    const plans = materializePlansFromMatrix(
        [{
            sceneName: '关键词推广',
            planName: '趋势明星模板',
            sceneSettings: {},
            sceneSettingValues: {}
        }],
        [{
            values: [{
                key: 'scene_field:趋势主题',
                value: trendThemeRaw,
                label: '露营推车',
                dimensionLabel: '选择趋势主题'
            }],
            labels: ['露营推车']
        }],
        { sceneName: '关键词推广' }
    );

    assert.equal(plans.length, 1);
    assert.equal(plans[0].sceneSettings['选择趋势主题'], trendThemeRaw);
    assert.equal(plans[0].sceneSettings['campaign.trendThemeList'], trendThemeRaw);
    assert.equal(plans[0].sceneSettingValues['趋势主题'], trendThemeRaw);
    assert.equal(plans[0].sceneSettingValues['campaign.trendThemeList'], trendThemeRaw);
});
