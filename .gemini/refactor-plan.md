# KeywordPlanApi 重构计划 - 删除未使用代码

## 分析结果

### 模块概况

- **模块范围**: L4764 - L21267 (约 16,500 行)
- **导出方法**: 50 个
- **可安全删除**: 15 个导出 + 13 个内部辅助函数 = **28 个函数**
- **预计减少代码行数**: ~1,462 行

### 删除原则

只删除**完全不被核心业务功能调用**的代码。以下分类的函数均通过静态分析确认：

- 定义后仅出现在 `return {}` 导出中，没有任何内部调用
- 或其所有调用者也在删除列表中（级联删除）

### 保留的核心 API (35 个)

| 分类 | 方法 |
|------|------|
| 向导入口 | `openWizard` |
| 运行时 | `getRuntimeDefaults` |
| 商品搜索 | `searchItems` |
| 计划创建 | `createPlansBatch`, `createPlansByScene`, `createSitePlansBatch`, `createKeywordPlansBatch`, `createCrowdPlansBatch`, `createShopDirectPlansBatch`, `createContentPlansBatch`, `createLeadPlansBatch` |
| 关键词/人群 | `appendKeywords`, `suggestKeywords`, `suggestCrowds` |
| 场景扫描(核心) | `scanCurrentSceneSettings`, `scanAllSceneSettings`, `scanSceneSpec` |
| 网络捕获(核心) | `startNetworkCapture`, `getNetworkCapture`, `stopNetworkCapture` |
| 场景规格 | `extractSceneGoalSpecs`, `getNewPlanComponentConfig`, `getSceneSpec` |
| 生命周期 | `extractLifecycleContracts`, `getLifecycleContract`, `resolveCreateConflicts`, `runCreateRepairByItem` |
| 冲突修复 | `captureSceneCreateInterfaces`, `runSceneSmokeTests` |
| 校验/会话 | `validateSceneRequest`, `validate`, `getSessionDraft`, `clearSessionDraft`, `getSceneCreateContract` |

### 删除的函数 (28 个)

#### A. 纯导出（不被内部调用）

1. `buildCreateApiDoc` - API 文档生成
2. `buildSceneGoalRequestTemplates` - 请求模板生成
3. `captureAllSceneCreateInterfaces` - 批量捕获
4. `extractAllSceneCreateInterfaces` - 批量提取
5. `extractSceneCreateInterfaces` - 单场景提取
6. `clearSceneSpecCache` - 清除缓存
7. `clearSceneCreateContractCache` - 清除缓存
8. `clearLifecycleContractCache` - 清除缓存
9. `listNetworkCaptures` - 列出捕获
10. `stopAllNetworkCaptures` - 停止所有捕获
11. `getGoalSpec` - 获取目标规格
12. `scanAllSceneSpecs` - 扫描所有场景
13. `runSceneGoalOptionTests` - 目标选项测试
14. `runSceneOptionSubmitSimulations` - 提交模拟
15. `buildSceneCreateApiDoc` - 场景 API 文档

#### B. 级联删除（仅被 A 组调用的内部函数）

16. `buildFallbackGoalSpecList`
2. `extractAllSceneGoalSpecs`
3. `mergeApiDocKeys`
4. `pickPrimaryCreateInterface`
5. `buildGoalCreateApiDocRow`
6. `buildDefaultCommonByScene`
7. `buildDefaultPlanByScene`
8. `appendGoalContractDefaultsToSceneSettings`
9. `pickSceneSettingDefaultFromFieldRow`
10. `collectGoalFieldRowsForTemplate`
11. `buildSceneSettingsTemplateByGoal`
12. `normalizeTemplateSceneListInput`
13. `inferCreateInterfacesFromSceneEntry`

### 修改位置汇总

除函数体外，还需要修改：

1. `return {}` 导出列表 (L21214-L21266): 删除 15 个导出
2. `API_BRIDGE_METHODS` 数组 (L22114-L22165): 删除 15 个方法名
3. `METHOD_TIMEOUTS` 对象: 删除引用已删方法的超时配置
