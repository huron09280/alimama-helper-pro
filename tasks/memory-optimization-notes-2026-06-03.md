# Chrome Memory Optimization Notes - 2026-06-03

## Goal
Optimize Chrome browser memory usage for the current plugin, estimate how many rounds are needed to reach the current best solution, and verify each optimization item before committing.

## Static Baseline
- `dist/extension/content.js`: 5,793 bytes.
- `dist/extension/page.bundle.js`: 4,400,575 bytes.
- `dist/packages/alimama-helper-pro.user.js`: 4,305,400 bytes.
- Largest source slices:
  - `src/optimizer/keyword-plan-api/wizard-style-and-state/style.js`: 440,381 bytes.
  - `src/main-assistant/magic-report.js`: 347,781 bytes.
  - `src/main-assistant/campaign-id-quick-entry.js`: 296,953 bytes.
  - `src/optimizer/keyword-plan-api/search-and-draft.js`: 293,778 bytes.
  - `src/optimizer/keyword-plan-api/wizard-scene-config/render-scene-dynamic-core.js`: 271,862 bytes.

## Chrome Baseline
- Page: `https://one.alimama.com/index.html#!/manage/display?offset=0&searchKey=campaignNameLike&searchValue=e7`.
- Title: `人群推广_万相台无界版`.
- `performance.memory.usedJSHeapSize`: 2,601,561,440 bytes.
- `performance.memory.totalJSHeapSize`: 2,718,210,496 bytes.
- DOM nodes: 5,032.
- iframe count: 1.
- helper-matched nodes: 316.
- plugin globals present: `__AM_PLATFORM_RUNTIME__`, `__AM_HOOK_MANAGER__`, `__AM_WXT_KEYWORD_OPEN_BRIDGE_READY__`, `__ALIMAMA_OPTIMIZER_TOGGLE__`.
- `__AM_HOOK_MANAGER__.requestHistory.length`: 4,000.
- hook handlers: fetch 2, xhrOpen 2, xhrSend 1, xhrLoad 1.

## Request History Finding
- 3,998 of 4,000 retained request history rows are `https://club.alimama.com/api/b/side/engine/trace/report.json`.
- Total retained request body chars: 140.
- The memory cost is dominated by retaining thousands of long telemetry URLs and object records, not useful business payloads.
- These trace URLs do not help token resolution, shop identity, lifecycle contract capture, budget retry, magic report auth, or create/copy debugging.

## Round Estimate
- Round 1: prune always-on request history and filter high-frequency telemetry. Lowest risk, immediate reduction in retained long-lived objects.
- Round 2: add Chrome extension injection eligibility guard for non-business matched pages, especially `myseller.taobao.com/home.htm/QnworkbenchHome/` and broad `*.alimama.com` pages that do not need the 4.4MB page bundle.
- Round 3: split or defer large style/module initialization without moving heavy parsing onto the first click path; likely requires a prewarmed idle module strategy or build-level bundle split with guardrails from L43.
- Round 4: targeted runtime cleanup for overlays, observers, and iframe-heavy views after real heap snapshots identify retained detached nodes or large closures.
- Expected best point: 3-4 rounds. Round 1 and 2 should capture the low-risk gains; rounds 3-4 are only worthwhile if Chrome heap snapshots still show plugin-owned retained objects after the first two rounds.

## First Optimization Candidate
Filter `club.alimama.com/api/b/side/engine/trace/report.json` before `requestHistory.push()` and reduce default request history limit. Preserve the full hook system and business JSON records.

## Round 1 Result: Request History Pruning

### Change
- Updated `src/main-assistant/bootstrap.js:createHookManager()`.
- Default `requestHistoryLimit`: `4000` -> `1200`.
- Added `requestHistoryBodyCharLimit: 240000`.
- Added `shouldSkipRequestHistory()` to skip `club.alimama.com/api/b/side/engine/trace/report.json`.
- Added body normalization:
  - strings are capped with `[AM_TRUNCATED:<original length>]`.
  - `URLSearchParams` stays query-string parseable.
  - `FormData` is converted to a safe query-string summary.
  - `Blob`, `ArrayBuffer`, typed arrays are stored as compact size summaries.

### Before
- Chrome page: `https://one.alimama.com/index.html#!/manage/display?offset=0&searchKey=campaignNameLike&searchValue=e7`.
- `requestHistory.length`: `4000`.
- `trace/report.json` retained rows: `3998`.
- `requestHistoryLimit`: `4000`.
- `usedJSHeapSize`: `2601561440`.
- `totalJSHeapSize`: `2718210496`.
- DOM nodes: `5032`.
- helper-matched nodes: `316`.

### After
- Same Chrome page after refreshing extension runtime.
- `requestHistoryLimit`: `1200`.
- `requestHistoryBodyCharLimit`: `240000`.
- `hasSkipFn`: `true`.
- `requestHistory.length`: `76`.
- `trace/report.json` retained rows: `0`.
- `usedJSHeapSize`: `89595957`.
- `totalJSHeapSize`: `117022521`.
- DOM nodes: `4270`.
- helper-matched nodes: `156`.

### Probe
- Calling `recordRequest()` with a trace URL kept history length at `76`.
- Calling `recordRequest()` with a normal business JSON probe increased history length to `77`.
- `URLSearchParams` body stayed parseable: `dynamicToken=probe_token&loginPointId=probe_lp&csrfID=probe_csrf`.
- The probe business record was removed after verification.

### Comparison
- Retained request history rows: `4000 -> 76`, reduced by `3924`.
- Retained trace rows: `3998 -> 0`, reduced by `100%`.
- Default retained history limit: `4000 -> 1200`, reduced by `70%`.
- Heap values improved after refresh, but the heap delta is not attributed solely to this change because page refresh also resets host-page state.

### Verification
- `node --test tests/logger-api.test.mjs`: pass, 18 tests.
- `node --test tests/extension-static-build.test.mjs tests/build-output-sync.test.mjs tests/build-segments.test.mjs`: pass, 16 tests.
- `npm run check:syntax`: pass.
- `npm run build:check`: pass.
- Chrome DevTools real page verification: pass.

### Risk
- A long-lived page can still evict older business records once 1200 non-trace records accumulate.
- Bodies larger than `240000` chars are only parseable for fields before the truncation point.
- Real-time fetch/XHR handlers still receive raw body data before history normalization, so normal token and lifecycle capture paths are preserved.
