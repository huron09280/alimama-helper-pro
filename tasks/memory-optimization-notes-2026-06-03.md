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

## Round 2 Result: Extension Injection Guard

### Change
- Updated the extension content-script injection gate.
- `one.alimama.com` continues to inject the full page bundle.
- `myseller.taobao.com` only injects the full page bundle on the SmartAssistant budget route.
- Ordinary `myseller` pages keep a lightweight URL polling fallback so an in-page navigation into SmartAssistant still injects once.
- Broad `*.alimama.com` pages that do not need the helper no longer parse/start `page.bundle.js`.

### Before
- Ordinary `myseller.taobao.com/home.htm/QnworkbenchHome/` could enter the full extension runtime.
- Old observed ordinary `myseller` state: `hasPlatformRuntime: true`, `hasHookManager: true`, JS heap `82716091/112302731`.
- Every non-business matched page paid the cost of loading the roughly 4.4MB page bundle.

### After
- Ordinary `myseller` workbench: `hasPlatformRuntime: false`, `hasHookManager: false`, `pageBundleEntries: []`, JS heap `79658927/106309623`.
- In-page navigation from ordinary `myseller` to SmartAssistant restores full runtime: `hasPlatformRuntime: true`, `hasHookManager: true`.
- Direct SmartAssistant route loads full runtime with JS heap `74031888/77616448`.
- `pub.alimama.com` remains lightweight: `hasPlatformRuntime: false`, `hasHookManager: false`, `pageBundleEntries: []`, JS heap `20216987/21453363`.

### Comparison
- Non-business pages avoid parsing and starting `dist/extension/page.bundle.js`.
- Main business page and SmartAssistant budget page still inject correctly.
- The change avoids shifting any 4.4MB parsing cost onto a user click path.

### Verification
- `node --test tests/extension-static-build.test.mjs tests/build-output-sync.test.mjs tests/build-segments.test.mjs`: pass, 17 tests.
- `npm run check:syntax`: pass.
- `npm run build:check`: pass.
- `git diff --check`: pass.
- Chrome DevTools MCP negative and positive route checks: pass.

### Risk
- Keeping the manifest broad match is intentional so the lightweight content script can still recover supported SPA routes.
- New supported domains/routes need to be added to the injection eligibility gate explicitly.

## Round 3 Result: External Wizard CSS for Extension

### Change
- Extracted the large keyword-plan wizard CSS from the extension `page.bundle.js` into `dist/extension/wizard-style.css`.
- Added `wizard-style.css` to MV3 `web_accessible_resources`.
- Exposed `resourceBaseUrl` from the extension page runtime.
- `openWizard()` waits for the external stylesheet result before revealing the overlay.
- Userscript output stays self-contained with inline CSS.

### Before
- Baseline commit: `59405c8`.
- `dist/extension/page.bundle.js` raw: `4,404,170` bytes.
- `dist/extension/page.bundle.js` gzip: `671,659` bytes.
- `page.bundle.js` lines: `80,711`.

### After
- `dist/extension/page.bundle.js` raw: `3,973,021` bytes.
- `dist/extension/page.bundle.js` gzip: `637,854` bytes.
- `page.bundle.js` lines: `71,076`.
- Added `dist/extension/wizard-style.css`: raw `289,478` bytes, gzip `31,638` bytes, `9,765` lines.

### Comparison
- Extension JS first bundle reduced by `431,149` raw bytes, about `9.79%`.
- Extension JS gzip reduced by `33,805` bytes, about `5.03%`.
- Combined extension `page.bundle.js + wizard-style.css` raw reduced by `141,671` bytes.
- The main benefit is lower document-start JS parse/compile work and fewer long-lived CSS template strings in JS, not total download size.

### Chrome Probe
- Runtime resource base: `chrome-extension://egaeghgcogbdikndhlmmmolelbfffnjk/`.
- Fetching current `page.bundle.js` from the page showed `hasExternalLoader: true`, `hasCriticalStyle: true`, and `hasLegacyCleanup: true`.
- Fetching `wizard-style.css` returned `length: 289478` and contained the overlay, workbench tab, and home summary styles.
- Opening through `__AM_WXT_KEYWORD_OPEN_BRIDGE_REQ__` inserted `link#am-wxt-keyword-style` with `data-am-helper-full-style-loaded="1"`.
- Old hidden inline style was removed; overlay rendered with `display: flex`; modal was visible at about `1320x821`.
- `fetchResourcesAdded: 0` during the open bridge smoke test.

### Verification
- `node --test tests/extension-static-build.test.mjs tests/build-output-sync.test.mjs tests/build-segments.test.mjs tests/keyword-wizard-entry-regression.test.mjs`: pass, 27 tests.
- `npm run check:syntax`: pass.
- `npm run build:check`: pass.
- `git diff --check`: pass.
- Chrome DevTools MCP resource and visible wizard smoke test: pass.

### Risk
- Heap delta was not attributed directly in this round because the page route state also changed.
- If extension resources fail to load, the critical style error state is shown and the user must refresh or reload the extension.

## Round 4 Result: Unmount Hidden Wizard DOM After Close

### Finding
- Chrome DevTools MCP page probe found the wizard overlay was closed but still retained in DOM:
  - `overlayDescendantCount: 631`.
  - `modalDescendantCount: 629`.
  - `keywordNodes: 450`.
- This was plugin-owned hidden DOM and element references, not required runtime state.

### Change
- On wizard close, save the draft, close the run-mode menu, invalidate pending open tasks, remove the overlay, remove the body-mounted run-mode menu, clear `wizardState.els`, and set `wizardState.mounted = false`.
- Added a `cleanupHandlers` queue for window-level resize/scroll listeners so repeated open/close does not stack global listeners.
- Reset `manualKeywordDelegatedBound` after unmounting old `sceneDynamic`, so manual keyword controls bind correctly after the next rebuild.

### Before
- Current route before opening: `totalNodesApprox: 461`, `helperNodes: 46`, `keywordNodes: 0`, no overlay/modal.
- After opening: `totalNodesApprox: 1095`, `helperNodes: 532`, `keywordNodes: 450`, `overlayDescendantCount: 631`, `modalDescendantCount: 629`.
- Before this round, closing only removed the `open` class and left the overlay/modal tree resident.

### After
- After first close: `totalNodesApprox: 463`, `helperNodes: 48`, `keywordNodes: 2`, overlay/modal absent.
- Second open rebuilt successfully with `overlayDescendantCount: 631` and `modalDescendantCount: 629`.
- Second close again returned to `totalNodesApprox: 463`, `helperNodes: 48`, `keywordNodes: 2`, overlay/modal absent.
- `fetchResourcesAdded: 0` for open, close, reopen, close.

### Comparison
- Hidden wizard DOM after close: `631` overlay descendants and `629` modal descendants -> `0`.
- Keyword wizard helper nodes after close: `450` -> `2` retained style/link nodes.
- The optimization affects close-time residency only; it does not remove the wizard runtime code from the bundle.

### Verification
- `node --test tests/keyword-wizard-entry-regression.test.mjs tests/extension-static-build.test.mjs tests/build-output-sync.test.mjs tests/build-segments.test.mjs`: pass, 28 tests.
- `npm run check:syntax`: pass.
- `npm run build:check`: pass.
- `git diff --check`: pass.
- Chrome DevTools MCP open/close/reopen/close probe: pass.

### Risk
- The Chrome proof was collected on the `one.alimama.com` login route, which is enough for extension runtime and DOM lifecycle validation.
- Full business-page interaction should still be smoke-tested on a logged-in management route if future changes touch item selection, draft restoration, or submit flow.

## Current Best Assessment
- Estimated best point: `4` rounds.
- Completed low-risk high-yield items:
  - Request history pruning.
  - Non-business page injection guard.
  - External extension wizard CSS.
  - Wizard DOM unmount after close.
- Further work should start from retained-size heap analysis and should only proceed if it finds a plugin-owned object with clear cleanup semantics. Current remaining candidates are lower-confidence and riskier than the four completed items.
