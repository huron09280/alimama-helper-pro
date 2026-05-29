        const ensureWizardStyle = () => {
            if (document.getElementById('am-wxt-keyword-style')) return;
            const style = document.createElement('style');
            style.id = 'am-wxt-keyword-style';
            style.textContent = `
                #am-wxt-keyword-overlay {
                    position: fixed;
                    inset: 0;
                    background: transparent;
                    backdrop-filter: none;
                    -webkit-backdrop-filter: none;
                    z-index: 1000006;
                    display: none;
                    align-items: center;
                    justify-content: center;
                    overscroll-behavior: contain;
                }
                #am-wxt-keyword-overlay.open {
                    display: flex;
                }
                #am-wxt-keyword-overlay.item-picker-open {
                    backdrop-filter: none;
                    -webkit-backdrop-filter: none;
                }
                #am-wxt-keyword-modal {
                    width: min(1160px, 96vw);
                    max-height: 92vh;
                    background: #f7f8fc;
                    border: 1px solid rgba(69,84,229,0.2);
                    border-radius: 14px;
                    box-shadow: 0 16px 42px rgba(17,24,39,0.28);
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    position: relative;
                    z-index: 1000008;
                    font-family: PingFangSC-Regular,PingFang SC,"Microsoft Yahei","SimHei",sans-serif;
                    color: #1f2937;
                }
                #am-wxt-keyword-modal .am-wxt-header {
                    height: 48px;
                    padding: 0 16px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    background: linear-gradient(135deg, #eef2ff, #f8f9ff);
                    border-bottom: 1px solid rgba(69,84,229,0.18);
                    font-weight: 600;
                }
                #am-wxt-keyword-modal .am-wxt-close {
                    border: 0;
                    background: transparent !important;
                    border-color: transparent !important;
                    box-shadow: none !important;
                    color: #4b5563;
                    cursor: pointer;
                    width: 32px;
                    height: 32px;
                    padding: 0;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 8px;
                }
                #am-wxt-keyword-modal .am-wxt-close:hover {
                    background: rgba(234, 79, 79, 0.1);
                    color: var(--am26-danger, #ea4f4f);
                }
                #am-wxt-keyword-modal .am-wxt-body {
                    padding: 12px 14px 14px;
                    overflow: auto;
                }
                #am-wxt-keyword-modal .am-wxt-split {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 12px;
                }
                #am-wxt-keyword-item-split {
                    height: auto;
                    min-height: 0;
                    align-items: stretch;
                    overflow: hidden;
                    overscroll-behavior: contain;
                }
                #am-wxt-keyword-item-split > .am-wxt-panel {
                    min-height: 0;
                }
                #am-wxt-keyword-modal .am-wxt-split.compact {
                    grid-template-columns: 1fr;
                    align-items: start;
                }
                #am-wxt-keyword-modal .am-wxt-split.compact .am-wxt-panel:nth-child(1) {
                    display: none;
                }
                #am-wxt-keyword-modal .am-wxt-split.compact .am-wxt-panel:nth-child(2) {
                    display: flex;
                    flex: 0 0 auto;
                    height: auto;
                    min-height: 0;
                    overflow: hidden;
                }
                #am-wxt-keyword-modal .am-wxt-split.compact #am-wxt-keyword-added-list {
                    flex: 1 1 auto;
                    min-height: 0;
                    height: auto;
                    max-height: none;
                }
                #am-wxt-keyword-modal .am-wxt-panel {
                    border: 1px solid rgba(148,163,184,0.35);
                    border-radius: 10px;
                    background: #fff;
                    display: flex;
                    flex-direction: column;
                    min-height: 310px;
                    overflow: hidden;
                }
                #am-wxt-keyword-modal .am-wxt-panel-candidate {
                    min-height: 0;
                }
                #am-wxt-keyword-modal .am-wxt-toolbar {
                    padding: 10px;
                    border-bottom: 1px solid rgba(148,163,184,0.28);
                    display: flex;
                    gap: 8px;
                    align-items: center;
                    flex-wrap: wrap;
                }
                #am-wxt-keyword-modal .am-wxt-toolbar input:not([type="checkbox"]):not([type="radio"]),
                #am-wxt-keyword-modal .am-wxt-config input:not([type="checkbox"]):not([type="radio"]),
                #am-wxt-keyword-modal .am-wxt-config select,
                #am-wxt-keyword-modal .am-wxt-config textarea {
                    border: 1px solid rgba(148,163,184,0.5);
                    border-radius: 8px;
                    padding: 6px 8px;
                    font-size: 12px;
                    background: #fff;
                    color: #1f2937;
                    min-height: 30px;
                    box-sizing: border-box;
                }
                #am-wxt-keyword-modal .am-wxt-toolbar input {
                    flex: 1;
                    min-width: 180px;
                }
                #am-wxt-keyword-modal .am-wxt-config input[type="checkbox"] {
                    width: 14px;
                    height: 14px;
                    min-height: 14px;
                    margin: 0;
                    padding: 0;
                    border: 0;
                    background: transparent;
                    box-sizing: border-box;
                    -webkit-appearance: auto !important;
                    appearance: auto !important;
                    accent-color: #4f68ff;
                    cursor: pointer;
                    flex: 0 0 auto;
                }
                #am-wxt-keyword-modal .am-wxt-config input[type="checkbox"]:disabled {
                    cursor: not-allowed;
                    opacity: 0.55;
                }
                #am-wxt-keyword-modal .am-wxt-btn {
                    border: 1px solid rgba(69,84,229,0.3);
                    border-radius: 8px;
                    padding: 6px 10px;
                    font-size: 12px;
                    line-height: 1;
                    background: #eef2ff;
                    color: #2e3ab8;
                    cursor: pointer;
                }
                #am-wxt-keyword-modal .am-wxt-btn.primary {
                    background: linear-gradient(135deg, #4554e5, #4f68ff);
                    color: #fff;
                    border-color: #4554e5;
                }
                #am-wxt-keyword-modal .am-wxt-btn.danger {
                    background: #fee2e2;
                    color: #b91c1c;
                    border-color: rgba(185, 28, 28, 0.32);
                }
                #am-wxt-keyword-modal .am-wxt-btn.am-wxt-right {
                    margin-left: auto;
                }
                #am-wxt-keyword-modal .am-wxt-list {
                    padding: 6px;
                    overflow: auto;
                    flex: 1;
                    min-height: 0;
                    overscroll-behavior: contain;
                }
                #am-wxt-keyword-candidate-list {
                    flex: 1 1 auto;
                    min-height: 0;
                    height: auto;
                    max-height: none;
                }
                #am-wxt-keyword-added-list {
                    flex: 0 0 auto;
                    min-height: 72px;
                    height: 168px;
                    max-height: 168px;
                }
                #am-wxt-keyword-item-split.candidate-list-expanded #am-wxt-keyword-added-list {
                    flex: 1 1 auto;
                    height: auto;
                    max-height: none;
                    min-height: 0;
                }
                #am-wxt-keyword-modal .am-wxt-toggle-candidate-list-btn.hidden {
                    display: none;
                }
                #am-wxt-keyword-modal .am-wxt-item {
                    border: 1px solid rgba(148,163,184,0.34);
                    border-radius: 8px;
                    padding: 8px;
                    margin-bottom: 6px;
                    display: flex;
                    justify-content: space-between;
                    gap: 8px;
                    align-items: center;
                }
                #am-wxt-keyword-modal .am-wxt-item-main,
                #am-wxt-keyword-item-picker-mask .am-wxt-item-main {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    min-width: 0;
                    flex: 1 1 auto;
                }
                #am-wxt-keyword-modal .am-wxt-item-info,
                #am-wxt-keyword-item-picker-mask .am-wxt-item-info {
                    min-width: 0;
                    flex: 1 1 auto;
                }
                #am-wxt-keyword-modal .am-wxt-item-thumb,
                #am-wxt-keyword-item-picker-mask .am-wxt-item-thumb {
                    width: 44px;
                    height: 44px;
                    border-radius: 8px;
                    flex: 0 0 44px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                    border: 1px solid rgba(148,163,184,0.28);
                    background: rgba(241,245,249,0.86);
                    color: #64748b;
                    font-size: 13px;
                    font-weight: 600;
                    line-height: 1;
                }
                #am-wxt-keyword-modal .am-wxt-item-thumb img,
                #am-wxt-keyword-item-picker-mask .am-wxt-item-thumb img {
                    width: 100%;
                    height: 100%;
                    display: block;
                    object-fit: cover;
                }
                #am-wxt-keyword-modal .am-wxt-item .name,
                #am-wxt-keyword-item-picker-mask .am-wxt-item .name {
                    font-size: 12px;
                    line-height: 1.35;
                    color: #111827;
                    min-width: 0;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow-wrap: anywhere;
                }
                #am-wxt-keyword-modal .am-wxt-item .meta {
                    font-size: 11px;
                    color: #64748b;
                    margin-top: 2px;
                }
                #am-wxt-keyword-modal .am-wxt-item .actions {
                    display: flex;
                    gap: 4px;
                    flex-shrink: 0;
                }
                #am-wxt-keyword-modal .am-wxt-strategy-board {
                    margin-top: 12px;
                    border: 1px solid rgba(148,163,184,0.35);
                    border-radius: 10px;
                    background: #fff;
                    padding: 10px;
                }
                #am-wxt-keyword-modal .am-wxt-strategy-head {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 8px;
                    flex-wrap: wrap;
                    font-size: 13px;
                    color: #334155;
                    margin-bottom: 8px;
                }
                #am-wxt-keyword-modal .am-wxt-strategy-head-main,
                #am-wxt-keyword-modal .am-wxt-strategy-head-right,
                #am-wxt-keyword-modal .am-wxt-strategy-head-tools {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                #am-wxt-keyword-modal .am-wxt-strategy-head-tools {
                    flex: 1 1 280px;
                    justify-content: flex-end;
                    flex-wrap: wrap;
                }
                #am-wxt-keyword-modal .am-wxt-strategy-search-input {
                    width: min(260px, 100%);
                    min-width: 0;
                    border: 1px solid rgba(69,84,229,0.3);
                    border-radius: 8px;
                    padding: 6px 10px;
                    font-size: 12px;
                    line-height: 1;
                    background: #eef2ff;
                    color: #2e3ab8;
                    box-sizing: border-box;
                }
                #am-wxt-keyword-modal .am-wxt-strategy-search-input::placeholder {
                    color: rgba(46,58,184,0.56);
                }
                #am-wxt-keyword-modal .am-wxt-strategy-select-all {
                    color: #475569;
                    white-space: nowrap;
                }
                #am-wxt-keyword-modal .am-wxt-strategy-head-actions {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    flex-wrap: wrap;
                }
                #am-wxt-keyword-modal .am-wxt-strategy-list {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                #am-wxt-keyword-modal .am-wxt-strategy-empty {
                    border: 1px dashed rgba(148,163,184,0.4);
                    border-radius: 10px;
                    padding: 18px 14px;
                    text-align: center;
                    font-size: 12px;
                    color: #64748b;
                    background: rgba(248,250,252,0.8);
                }
                #am-wxt-keyword-modal .am-wxt-strategy-item {
                    border: 1px solid rgba(148,163,184,0.3);
                    border-radius: 10px;
                    padding: 10px;
                    background: #f8fafc;
                }
                #am-wxt-keyword-modal .am-wxt-strategy-main {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 8px;
                }
                #am-wxt-keyword-modal .am-wxt-strategy-left {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 13px;
                    color: #111827;
                    font-weight: 600;
                }
                #am-wxt-keyword-modal .am-wxt-strategy-right {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    color: #374151;
                    font-size: 12px;
                    flex-wrap: wrap;
                    justify-content: flex-end;
                    flex: 1 1 420px;
                    min-width: 0;
                }
                #am-wxt-keyword-modal .am-wxt-strategy-summary {
                    white-space: nowrap;
                }
                #am-wxt-keyword-modal .am-wxt-strategy-right > .am-wxt-strategy-summary:first-child {
                    flex: 1 1 auto;
                    min-width: 0;
                    text-align: right;
                }
                #am-wxt-keyword-modal .am-wxt-strategy-target-cost {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 2px 2px 2px 6px;
                    border-radius: 999px;
                    border: 1px solid rgba(37,99,235,0.28);
                    background: rgba(37,99,235,0.08);
                    color: #1e3a8a;
                    flex: 0 0 auto;
                    width: auto;
                    box-sizing: border-box;
                    justify-content: flex-start;
                }
                #am-wxt-keyword-modal .am-wxt-strategy-target-cost-field {
                    position: relative;
                    flex: 0 0 auto;
                    min-width: 0;
                    display: inline-flex;
                    align-items: center;
                }
                #am-wxt-keyword-modal .am-wxt-strategy-target-cost input {
                    width: auto;
                    min-width: 0;
                    padding: 2px 8px;
                    border-radius: 999px;
                    border: 1px solid rgba(148,163,184,0.45);
                    font-size: 12px;
                    line-height: 18px;
                    box-sizing: border-box;
                    padding-right: 20px;
                }
                #am-wxt-keyword-modal .am-wxt-strategy-target-cost input::placeholder {
                    color: #9ca3af;
                    opacity: 1;
                }
                #am-wxt-keyword-modal .am-wxt-strategy-target-cost input[type="number"] {
                    appearance: textfield;
                    -moz-appearance: textfield;
                }
                #am-wxt-keyword-modal .am-wxt-strategy-target-cost input[type="number"]::-webkit-outer-spin-button,
                #am-wxt-keyword-modal .am-wxt-strategy-target-cost input[type="number"]::-webkit-inner-spin-button {
                    -webkit-appearance: none;
                    margin: 0;
                }
                #am-wxt-keyword-modal .am-wxt-strategy-target-cost-field:not(.with-unit) input {
                    width: auto;
                    min-width: 0;
                    padding-right: 8px;
                }
                #am-wxt-keyword-modal .am-wxt-strategy-target-cost-unit {
                    position: absolute;
                    right: 8px;
                    top: 50%;
                    transform: translateY(-50%) !important;
                    font-size: 11px;
                    color: #475569;
                    pointer-events: none;
                }
                #am-wxt-keyword-modal .am-wxt-strategy-right > .am-wxt-strategy-summary:nth-of-type(2) {
                    flex: 0 0 73px;
                    width: 73px;
                }
                #am-wxt-keyword-modal .am-wxt-copy-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                }
                #am-wxt-keyword-modal .am-wxt-copy-multi {
                    display: inline-flex;
                    align-items: center;
                    gap: 2px;
                    padding: 2px 6px;
                    border-radius: 10px;
                    border: 1px solid rgba(99,102,241,0.32);
                    background: rgba(255,255,255,0.88);
                    color: #3344c8;
                    font-size: 11px;
                    line-height: 1;
                    user-select: none;
                }
                #am-wxt-keyword-modal .am-wxt-copy-multi-icon {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0.9;
                }
                #am-wxt-keyword-modal .am-wxt-copy-multi-num {
                    min-width: 12px;
                    text-align: center;
                    font-weight: 600;
                }
                #am-wxt-keyword-modal .am-wxt-detail-title {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 6px;
                    font-size: 13px;
                    color: #334155;
                }
                #am-wxt-keyword-modal .am-wxt-detail-title-right {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                #am-wxt-keyword-overlay #am-wxt-keyword-detail-backdrop {
                    position: fixed;
                    inset: 0;
                    background: rgba(255, 255, 255, 0.72);
                    backdrop-filter: blur(8px) saturate(1.15);
                    -webkit-backdrop-filter: blur(8px) saturate(1.15);
                    z-index: 1000007;
                    display: none;
                }
                #am-wxt-keyword-overlay #am-wxt-keyword-detail-backdrop.open {
                    display: block;
                }
                #am-wxt-keyword-overlay #am-wxt-keyword-detail-backdrop.open + #am-wxt-keyword-modal {
                    overflow: visible;
                }
                #am-wxt-keyword-modal .am-wxt-config {
                    margin-top: 12px;
                    border: 1px solid rgba(148,163,184,0.35);
                    border-radius: 10px;
                    background: #fff;
                    padding: 10px;
                }
                #am-wxt-keyword-detail-config {
                    position: fixed;
                    left: 50%;
                    top: 50%;
                    transform: translate(-50%, -50%);
                    width: min(1240px, 94vw);
                    max-height: 90vh;
                    overflow: auto;
                    z-index: 1000008;
                    margin-top: 0;
                    color: var(--am26-text, #1b2438);
                    background: var(--am26-panel-strong, linear-gradient(135deg, rgba(255,255,255,0.6), rgba(255,255,255,0.2)));
                    border: 1px solid var(--am26-border-strong, rgba(255,255,255,0.6));
                    border-radius: 18px;
                    box-shadow: var(--am26-shadow, 0 8px 32px rgba(31,38,135,0.15));
                    backdrop-filter: blur(18px) saturate(1.35);
                    -webkit-backdrop-filter: blur(18px) saturate(1.35);
                }
                #am-wxt-keyword-modal .am-wxt-config.collapsed {
                    display: none;
                }
                #am-wxt-keyword-detail-config .am-wxt-detail-title {
                    position: sticky;
                    top: 0;
                    background: var(--am26-surface-strong, rgba(255,255,255,0.45));
                    color: var(--am26-text, #1b2438);
                    z-index: 2;
                    margin: -10px -10px 10px;
                    padding: 10px;
                    border-bottom: 1px solid var(--am26-border, rgba(255,255,255,0.4));
                    box-shadow: inset 0 1px 0 rgba(255,255,255,0.28);
                }
                #am-wxt-keyword-detail-config .am-wxt-detail-footer {
                    position: sticky;
                    bottom: 0;
                    background: var(--am26-surface-strong, rgba(255,255,255,0.45));
                    z-index: 2;
                    margin: 10px -10px -10px;
                    padding: 10px;
                    border-top: 1px solid var(--am26-border, rgba(255,255,255,0.4));
                    box-shadow: inset 0 1px 0 rgba(255,255,255,0.28);
                    display: flex;
                    justify-content: flex-end;
                    align-items: center;
                }
                #am-wxt-keyword-modal .am-wxt-config-grid {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-intro {
                    margin-top: 2px;
                    padding: 0;
                    border: 0;
                    border-radius: 0;
                    background: transparent;
                    color: #64748b;
                    font-size: 11px;
                    line-height: 1.5;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-workspace {
                    margin-top: 10px;
                    display: grid;
                    grid-template-columns: minmax(312px, 336px) minmax(0, 1fr);
                    gap: 16px;
                    align-items: start;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-sidebar,
                #am-wxt-keyword-modal .am-wxt-matrix-main {
                    min-width: 0;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-sidebar {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-main {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-card {
                    border: 1px solid rgba(148,163,184,0.22);
                    border-radius: 14px;
                    background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.96));
                    padding: 12px;
                    box-shadow: none;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-card .am-wxt-crowd-title {
                    margin-bottom: 10px;
                    gap: 8px;
                    align-items: center;
                    flex-wrap: wrap;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-side-tip {
                    display: none;
                }
                #am-wxt-keyword-modal #am-wxt-matrix-summary {
                    display: inline-flex;
                    align-items: center;
                    padding: 4px 8px;
                    border-radius: 999px;
                    background: rgba(241,245,249,0.96);
                    color: #64748b;
                    font-size: 11px;
                    line-height: 1.35;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-settings-grid {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 0;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-settings-grid .am-wxt-setting-row {
                    grid-column: 1 / -1;
                    grid-template-columns: 74px minmax(0, 1fr);
                    gap: 8px;
                    padding: 4px 0;
                    border-bottom: 0;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-settings-grid .am-wxt-setting-row[data-matrix-setting-span="2"] {
                    grid-column: 1 / -1;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-settings-grid .am-wxt-setting-label {
                    line-height: 32px;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-settings-grid .am-wxt-setting-control input:not([type="checkbox"]),
                #am-wxt-keyword-modal .am-wxt-matrix-settings-grid .am-wxt-setting-control select {
                    width: 100%;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-settings-grid .am-wxt-inline-check {
                    min-height: 32px;
                    color: #475569;
                    white-space: nowrap;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-subsection {
                    margin-top: 10px;
                    padding-top: 10px;
                    border-top: 1px solid rgba(148,163,184,0.18);
                }
                #am-wxt-keyword-modal .am-wxt-matrix-subtitle {
                    margin-bottom: 8px;
                    color: #64748b;
                    font-size: 11px;
                    font-weight: 600;
                    line-height: 1.3;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-summary-grid {
                    display: grid;
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                    gap: 6px;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-stat {
                    display: flex;
                    align-items: baseline;
                    gap: 6px;
                    min-width: 0;
                    border: 1px solid rgba(148,163,184,0.18);
                    border-radius: 999px;
                    padding: 7px 10px;
                    background: rgba(248,250,252,0.96);
                }
                #am-wxt-keyword-modal .am-wxt-matrix-stat-label {
                    display: inline;
                    color: #64748b;
                    font-size: 11px;
                    margin-bottom: 0;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-stat-value {
                    display: inline;
                    color: #0f172a;
                    font-size: 13px;
                    font-weight: 700;
                    line-height: 1.2;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-preset-grid {
                    display: grid;
                    grid-template-columns: repeat(3, minmax(0, 1fr));
                    gap: 6px;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-action-grid {
                    display: grid;
                    grid-template-columns: repeat(3, minmax(0, 1fr));
                    gap: 6px;
                    margin-bottom: 6px;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-action-grid .am-wxt-btn {
                    width: 100%;
                    min-height: 32px;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-action-note {
                    margin-bottom: 8px;
                    color: #94a3b8;
                    font-size: 10.5px;
                    line-height: 1.45;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-action-note.is-error,
                #am-wxt-keyword-modal .am-wxt-matrix-action-note.is-success {
                    border-radius: 6px;
                    padding: 6px 8px;
                    font-size: 11px;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-action-note.is-error {
                    border: 1px solid #fecaca;
                    background: #fef2f2;
                    color: #b91c1c;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-action-note.is-success {
                    border: 1px solid #bbf7d0;
                    background: #f0fdf4;
                    color: #15803d;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-preset-grid .am-wxt-btn {
                    width: 100%;
                    min-height: 30px;
                    justify-content: center;
                    text-align: center;
                    white-space: nowrap;
                    line-height: 1.2;
                    font-size: 11px;
                    border-radius: 999px;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-scene-card {
                    display: flex;
                    flex-direction: column;
                    gap: 14px;
                    padding: 12px 14px;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-scene-card .am-wxt-scene-setting-row {
                    grid-template-columns: 74px minmax(0, 1fr);
                    gap: 10px;
                    padding: 0;
                    border-bottom: 0;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-scene-card .am-wxt-scene-setting-label {
                    color: #334155;
                    font-weight: 600;
                    line-height: 32px;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-scene-card .am-wxt-option-line {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-dimension-box {
                    margin-top: 0;
                    border: 0;
                    border-radius: 0;
                    padding: 0;
                    background: transparent;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-dimension-box > .am-wxt-crowd-title {
                    margin-bottom: 10px;
                    padding: 0 4px;
                }
                #am-wxt-keyword-modal .am-wxt-crowd-list.am-wxt-matrix-dimension-list {
                    max-height: none;
                    min-height: 0;
                    overflow: visible;
                    padding-right: 0;
                    padding-bottom: 4px;
                    column-count: 2;
                    column-width: 280px;
                    column-gap: 12px;
                }
                #am-wxt-keyword-modal .am-wxt-crowd-list.am-wxt-matrix-dimension-list.is-empty {
                    column-count: 1;
                    column-width: auto;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-empty-state {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 6px;
                    min-height: 180px;
                    width: min(560px, 100%);
                    padding: 20px 22px;
                    border: 1px dashed rgba(148,163,184,0.34);
                    border-radius: 16px;
                    background: linear-gradient(180deg, rgba(248,250,252,0.94), rgba(255,255,255,0.98));
                    color: #334155;
                    box-sizing: border-box;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-empty-title {
                    color: #0f172a;
                    font-size: 14px;
                    font-weight: 700;
                    line-height: 1.3;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-empty-desc,
                #am-wxt-keyword-modal .am-wxt-matrix-empty-hint {
                    color: #64748b;
                    font-size: 12px;
                    line-height: 1.55;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-empty-hint {
                    color: #475569;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-dimension-row {
                    position: relative;
                    display: inline-block;
                    width: 100%;
                    box-sizing: border-box;
                    break-inside: avoid;
                    -webkit-column-break-inside: avoid;
                    border: 1px solid rgba(148,163,184,0.24);
                    border-radius: 14px;
                    padding: 10px 10px 12px;
                    background: #fff;
                    margin: 0 0 10px;
                    box-shadow: 0 6px 16px rgba(15,23,42,0.04);
                }
                #am-wxt-keyword-modal .am-wxt-matrix-dimension-add-card {
                    position: relative;
                    display: inline-flex;
                    flex-direction: column;
                    align-items: flex-start;
                    justify-content: center;
                    gap: 6px;
                    width: 100%;
                    min-height: 132px;
                    margin: 0 0 10px;
                    padding: 16px 14px;
                    border: 1px dashed rgba(148,163,184,0.42);
                    border-radius: 14px;
                    background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.98));
                    color: #334155;
                    text-align: left;
                    box-sizing: border-box;
                    break-inside: avoid;
                    -webkit-column-break-inside: avoid;
                    transition: border-color 0.2s ease, background 0.2s ease, transform 0.2s ease;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-dimension-add-card:hover:not(:disabled) {
                    border-color: rgba(79,104,255,0.38);
                    background: linear-gradient(180deg, rgba(248,250,255,0.98), rgba(255,255,255,0.98));
                    transform: translateY(-1px);
                }
                #am-wxt-keyword-modal .am-wxt-matrix-dimension-add-card.is-disabled,
                #am-wxt-keyword-modal .am-wxt-matrix-dimension-add-card:disabled {
                    opacity: 0.72;
                    cursor: default;
                    transform: none;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-dimension-add-icon {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 36px;
                    min-width: 36px;
                    height: 36px;
                    border-radius: 999px;
                    background: rgba(79,104,255,0.08);
                    color: #3354d1;
                    line-height: 1;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-dimension-add-icon svg {
                    width: 18px;
                    height: 18px;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-dimension-add-title {
                    color: #0f172a;
                    font-size: 13px;
                    font-weight: 700;
                    line-height: 1.35;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-dimension-add-desc {
                    color: #64748b;
                    font-size: 12px;
                    line-height: 1.5;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-dimension-row::before {
                    content: "";
                    position: absolute;
                    left: 12px;
                    right: 12px;
                    top: 0;
                    height: 3px;
                    border-radius: 0 0 999px 999px;
                    background: linear-gradient(90deg, rgba(79,104,255,0.46), rgba(79,104,255,0.12));
                }
                #am-wxt-keyword-modal .am-wxt-matrix-dimension-top {
                    display: grid;
                    grid-template-columns: minmax(0, 1fr) auto;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 8px;
                    padding-top: 4px;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-dimension-top-main {
                    min-width: 0;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    flex-wrap: nowrap;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-dimension-enable-inline {
                    display: inline-flex;
                    align-items: center;
                    gap: 0;
                    color: #475569;
                    font-size: 12px;
                    line-height: 1.2;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-dimension-enable-inline input[type="checkbox"] {
                    margin: 0;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-dimension-top-actions {
                    flex: 0 0 auto;
                    display: flex;
                    gap: 0;
                    justify-content: flex-end;
                    align-items: center;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-chip {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    border-radius: 999px;
                    padding: 4px 8px;
                    background: rgba(79,104,255,0.08);
                    color: #3354d1;
                    font-size: 11px;
                    line-height: 1.3;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-chip.muted {
                    color: #6b7280;
                    background: rgba(241,245,249,0.96);
                }
                #am-wxt-keyword-modal .am-wxt-matrix-dimension-hidden-label {
                    display: none !important;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-dimension-remove-icon {
                    width: 34px;
                    min-width: 34px;
                    height: 34px;
                    padding: 0;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    border: 0;
                    border-radius: 999px;
                    background: transparent;
                    color: #94a3b8;
                    line-height: 1;
                    box-shadow: none;
                    visibility: hidden;
                    opacity: 0;
                    pointer-events: none;
                    transform: scale(0.86);
                    transition: color 0.2s ease, background 0.2s ease, opacity 0.2s ease, transform 0.2s ease;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-dimension-remove-icon svg {
                    width: 16px;
                    height: 16px;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-dimension-row:hover .am-wxt-matrix-dimension-remove-icon,
                #am-wxt-keyword-modal .am-wxt-matrix-dimension-row:focus-within .am-wxt-matrix-dimension-remove-icon {
                    visibility: visible;
                    opacity: 1;
                    pointer-events: auto;
                    transform: none;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-dimension-remove-icon:hover {
                    background: rgba(79,104,255,0.05);
                    color: #3354d1;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-dimension-row textarea {
                    width: 100%;
                    min-height: 96px;
                    resize: vertical;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-value-editor {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-value-summary {
                    color: #64748b;
                    font-size: 12px;
                    line-height: 1.45;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-value-body {
                    display: flex;
                    align-items: flex-start;
                    gap: 6px;
                    flex-wrap: wrap;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-value-list {
                    flex: 1 1 auto;
                    min-width: 0;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    flex-wrap: wrap;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-value-item {
                    flex: 0 0 auto;
                    min-width: 0;
                    display: inline-flex;
                    align-items: center;
                    border: 1px solid rgba(148,163,184,0.28);
                    border-radius: 10px;
                    background: #fff;
                    transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-value-item:focus-within {
                    border-color: rgba(79,104,255,0.42);
                    box-shadow: 0 0 0 3px rgba(79,104,255,0.08);
                }
                #am-wxt-keyword-modal .am-wxt-matrix-value-item.is-pending {
                    border-style: dashed;
                    background: rgba(248,250,255,0.88);
                }
                #am-wxt-keyword-modal .am-wxt-matrix-value-item input {
                    width: min(220px, calc(var(--am-wxt-matrix-value-chars, 8) * 1ch + 28px));
                    min-width: 72px;
                    max-width: 220px;
                    min-height: 30px;
                    padding: 0 7px;
                    border: 0;
                    border-radius: 10px;
                    background: transparent;
                    color: #334155;
                    font-size: 12px;
                    line-height: 1.4;
                    text-align: left;
                    appearance: none;
                    -webkit-appearance: none;
                    box-shadow: none;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-value-item.is-numeric input {
                    width: calc(var(--am-wxt-matrix-value-chars, 4) * 1ch + 14px);
                    min-width: calc(3ch + 14px);
                    max-width: calc(10ch + 14px);
                    min-height: 30px;
                    padding: 0 7px;
                    border: 0;
                    border-radius: 10px;
                    background: transparent;
                    color: #334155;
                    font-size: 12px;
                    line-height: 1.4;
                    text-align: center;
                    appearance: none;
                    -webkit-appearance: none;
                    box-shadow: none;
                    font-variant-numeric: tabular-nums;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-value-item input:focus {
                    outline: none;
                    box-shadow: none;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-value-item-remove {
                    flex: 0 0 14px;
                    width: 14px;
                    min-width: 14px;
                    height: 30px;
                    margin-left: -14px;
                    padding: 0;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    border: 0;
                    border-radius: 0 10px 10px 0;
                    background: transparent;
                    color: #94a3b8;
                    line-height: 1;
                    box-shadow: none;
                    visibility: hidden;
                    opacity: 0;
                    pointer-events: none;
                    transform: translateX(4px) scale(0.82);
                    transition: width 0.2s ease, min-width 0.2s ease, margin-left 0.2s ease, opacity 0.2s ease, transform 0.2s ease, color 0.2s ease, background 0.2s ease;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-value-item-remove svg {
                    width: 12px;
                    height: 12px;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-value-item:hover .am-wxt-matrix-value-item-remove {
                    width: 26px;
                    min-width: 26px;
                    margin-left: 0;
                    visibility: visible;
                    opacity: 1;
                    pointer-events: auto;
                    transform: none;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-value-item-remove:hover {
                    color: #3354d1;
                    background: rgba(79,104,255,0.06);
                }
                #am-wxt-keyword-modal .am-wxt-matrix-value-actions {
                    flex: 0 0 auto;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-value-add {
                    flex: 0 0 auto;
                    width: 30px;
                    min-width: 30px;
                    min-height: 30px;
                    padding: 0 0 1px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    border: 0;
                    border-radius: 999px;
                    background: transparent;
                    color: rgba(148,163,184,0.9);
                    line-height: 1;
                    box-shadow: none;
                    visibility: hidden;
                    opacity: 0;
                    pointer-events: none;
                    transform: scale(0.86);
                    transition: border-color 0.2s ease, background 0.2s ease, color 0.2s ease, opacity 0.2s ease, transform 0.2s ease;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-value-add svg {
                    width: 14px;
                    height: 14px;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-dimension-row:hover .am-wxt-matrix-value-add,
                #am-wxt-keyword-modal .am-wxt-matrix-dimension-row:focus-within .am-wxt-matrix-value-add,
                #am-wxt-keyword-modal .am-wxt-matrix-value-actions.open .am-wxt-matrix-value-add {
                    visibility: visible;
                    opacity: 1;
                    pointer-events: auto;
                    transform: none;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-value-actions.open .am-wxt-matrix-value-add,
                #am-wxt-keyword-modal .am-wxt-matrix-value-actions .am-wxt-matrix-value-add:hover,
                #am-wxt-keyword-modal .am-wxt-matrix-value-actions .am-wxt-matrix-value-add:focus-visible {
                    border: 1px dashed rgba(79,104,255,0.34);
                    background: rgba(79,104,255,0.12);
                    color: #3354d1;
                    opacity: 1;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-value-batch-menu {
                    left: auto;
                    right: 0;
                    width: 196px;
                    min-width: 196px;
                    max-width: 196px;
                    padding: 8px;
                    overflow: hidden;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-value-batch-note {
                    color: #64748b;
                    font-size: 11px;
                    line-height: 1.35;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-value-batch-help {
                    margin-top: 4px;
                    color: #94a3b8;
                    font-size: 10px;
                    line-height: 1.35;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-value-batch-form {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    margin-top: 8px;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-value-batch-form input {
                    flex: 1 1 0;
                    width: auto;
                    min-width: 0;
                    min-height: 28px;
                    height: 28px;
                    padding: 0 8px;
                    border: 1px solid rgba(148,163,184,0.28);
                    border-radius: 8px;
                    background: #f8fafc;
                    color: #334155;
                    font-size: 12px;
                    line-height: 1.3;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-value-batch-form input:focus {
                    border-color: rgba(79,104,255,0.38);
                    box-shadow: 0 0 0 3px rgba(79,104,255,0.08);
                }
                #am-wxt-keyword-modal .am-wxt-matrix-value-batch-form input[data-matrix-dimension-value-batch-count="1"] {
                    flex: 0 0 52px;
                    width: 52px;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-value-batch-option {
                    width: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: flex-start;
                    margin: 0;
                    padding: 8px 10px;
                    border: 0;
                    border-radius: 10px;
                    background: transparent;
                    color: #334155;
                    font-size: 12px;
                    line-height: 1.35;
                    text-align: left;
                    white-space: nowrap;
                    cursor: pointer;
                    transition: background 0.2s ease, color 0.2s ease, opacity 0.2s ease;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-value-batch-option:hover {
                    background: rgba(79,104,255,0.08);
                    color: #3354d1;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-value-batch-submit {
                    width: 100%;
                    min-height: 30px;
                    margin-top: 8px;
                    padding: 0 10px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    border: 1px solid rgba(79,104,255,0.16);
                    border-radius: 10px;
                    background: rgba(79,104,255,0.08);
                    color: #3354d1;
                    font-size: 12px;
                    font-weight: 600;
                    line-height: 1;
                    box-shadow: none;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-value-batch-submit:hover {
                    border-color: rgba(79,104,255,0.3);
                    background: rgba(79,104,255,0.14);
                }
                #am-wxt-keyword-modal .am-wxt-matrix-value-batch-submit.is-disabled,
                #am-wxt-keyword-modal .am-wxt-matrix-value-batch-submit:disabled {
                    opacity: 0.52;
                    cursor: not-allowed;
                    background: rgba(241,245,249,0.88);
                    color: #94a3b8;
                    border-color: rgba(148,163,184,0.2);
                }
                #am-wxt-keyword-modal .am-wxt-matrix-bid-package-editor {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-bid-package-summary {
                    color: #64748b;
                    font-size: 12px;
                    line-height: 1.45;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-bid-package-list {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-bid-package-row {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    padding: 2px 0;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-bid-package-row.is-pending {
                    opacity: 0.96;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-bid-package-row-head {
                    width: 100%;
                    min-width: 0;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-bid-package-row-head .am-wxt-matrix-bid-package-target-picker {
                    flex: 1 1 auto;
                    min-width: 0;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-bid-package-row-body {
                    width: 100%;
                    min-width: 0;
                    display: flex;
                    align-items: flex-start;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-bid-package-row input {
                    flex: 0 0 auto;
                    width: calc(var(--am-wxt-matrix-bid-package-cost-chars, 4) * 1ch + 14px);
                    min-width: calc(3ch + 14px);
                    max-width: calc(10ch + 14px);
                    min-height: 30px;
                    padding: 0 7px;
                    border: 0;
                    border-radius: 10px;
                    background: transparent;
                    color: #334155;
                    font-size: 12px;
                    line-height: 1.4;
                    text-align: center;
                    appearance: none;
                    -webkit-appearance: none;
                    box-shadow: none;
                    font-variant-numeric: tabular-nums;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-bid-package-row input:focus {
                    outline: none;
                    box-shadow: none;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-bid-package-target-picker .am-wxt-matrix-dimension-picker-trigger {
                    min-height: 32px;
                    padding: 5px 11px;
                    border: 1px solid rgba(79,104,255,0.14);
                    border-radius: 999px;
                    background: rgba(79,104,255,0.08);
                    color: #3354d1;
                    font-weight: 600;
                    box-shadow: none;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-bid-package-target-picker .am-wxt-matrix-dimension-picker-trigger:hover,
                #am-wxt-keyword-modal .am-wxt-matrix-bid-package-target-picker.open .am-wxt-matrix-dimension-picker-trigger {
                    border-color: rgba(79,104,255,0.26);
                    background: rgba(79,104,255,0.12);
                    box-shadow: 0 0 0 3px rgba(79,104,255,0.06);
                }
                #am-wxt-keyword-modal .am-wxt-matrix-bid-package-target-picker .am-wxt-matrix-dimension-picker-panel {
                    left: 0;
                    right: auto;
                    min-width: 188px;
                    max-width: 220px;
                    overflow-x: hidden;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-bid-package-target-option {
                    width: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: flex-start;
                    margin: 0;
                    padding: 9px 10px;
                    border: 0;
                    border-radius: 10px;
                    background: transparent;
                    color: #334155;
                    font-size: 12px;
                    line-height: 1.35;
                    text-align: left;
                    white-space: nowrap;
                    cursor: pointer;
                    transition: background 0.2s ease, color 0.2s ease;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-bid-package-target-option + .am-wxt-matrix-bid-package-target-option {
                    margin-top: 4px;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-bid-package-target-option:hover,
                #am-wxt-keyword-modal .am-wxt-matrix-bid-package-target-option.is-active {
                    background: rgba(79,104,255,0.08);
                    color: #3354d1;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-bid-package-target-option.is-active {
                    font-weight: 600;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-bid-package-cost-list {
                    flex: 1 1 auto;
                    width: 100%;
                    min-width: 0;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    flex-wrap: wrap;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-bid-package-cost-item {
                    flex: 0 0 auto;
                    min-width: 0;
                    display: inline-flex;
                    align-items: center;
                    border: 1px solid rgba(148,163,184,0.28);
                    border-radius: 10px;
                    background: #fff;
                    transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-bid-package-cost-item:focus-within {
                    border-color: rgba(79,104,255,0.42);
                    box-shadow: 0 0 0 3px rgba(79,104,255,0.08);
                }
                #am-wxt-keyword-modal .am-wxt-matrix-bid-package-cost-item.is-pending {
                    border-style: dashed;
                    background: rgba(248,250,255,0.88);
                }
                #am-wxt-keyword-modal .am-wxt-matrix-bid-package-cost-remove {
                    flex: 0 0 14px;
                    width: 14px;
                    min-width: 14px;
                    height: 30px;
                    margin-left: -14px;
                    padding: 0;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    border: 0;
                    border-radius: 0 10px 10px 0;
                    background: transparent;
                    color: #94a3b8;
                    line-height: 1;
                    box-shadow: none;
                    visibility: hidden;
                    opacity: 0;
                    pointer-events: none;
                    transform: translateX(4px) scale(0.82);
                    transition: width 0.2s ease, min-width 0.2s ease, margin-left 0.2s ease, opacity 0.2s ease, transform 0.2s ease, color 0.2s ease, background 0.2s ease;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-bid-package-cost-remove svg {
                    width: 12px;
                    height: 12px;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-bid-package-cost-item:hover .am-wxt-matrix-bid-package-cost-remove {
                    width: 26px;
                    min-width: 26px;
                    margin-left: 0;
                    visibility: visible;
                    opacity: 1;
                    pointer-events: auto;
                    transform: none;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-bid-package-cost-remove:hover {
                    color: #3354d1;
                    background: rgba(79,104,255,0.06);
                }
                #am-wxt-keyword-modal .am-wxt-matrix-bid-package-cost-add {
                    flex: 0 0 auto;
                    width: 30px;
                    min-width: 30px;
                    min-height: 30px;
                    padding: 0 0 1px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    border: 0;
                    border-radius: 999px;
                    background: transparent;
                    color: rgba(148,163,184,0.9);
                    line-height: 1;
                    box-shadow: none;
                    visibility: hidden;
                    opacity: 0;
                    pointer-events: none;
                    transform: scale(0.86);
                    transition: border-color 0.2s ease, background 0.2s ease, color 0.2s ease, opacity 0.2s ease, transform 0.2s ease;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-bid-package-cost-add svg {
                    width: 14px;
                    height: 14px;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-bid-package-row:hover .am-wxt-matrix-bid-package-cost-add,
                #am-wxt-keyword-modal .am-wxt-matrix-bid-package-row:focus-within .am-wxt-matrix-bid-package-cost-add,
                #am-wxt-keyword-modal .am-wxt-matrix-bid-package-cost-actions.open .am-wxt-matrix-bid-package-cost-add {
                    visibility: visible;
                    opacity: 1;
                    pointer-events: auto;
                    transform: none;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-bid-package-cost-actions {
                    flex: 0 0 auto;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-bid-package-cost-actions .am-wxt-matrix-bid-package-cost-add {
                    box-shadow: none;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-bid-package-cost-actions.open .am-wxt-matrix-bid-package-cost-add,
                #am-wxt-keyword-modal .am-wxt-matrix-bid-package-cost-actions .am-wxt-matrix-bid-package-cost-add:hover,
                #am-wxt-keyword-modal .am-wxt-matrix-bid-package-cost-actions .am-wxt-matrix-bid-package-cost-add:focus-visible {
                    border: 1px dashed rgba(79,104,255,0.34);
                    background: rgba(79,104,255,0.12);
                    color: #3354d1;
                    opacity: 1;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-bid-package-cost-batch-menu {
                    left: auto;
                    right: 0;
                    width: 196px;
                    min-width: 196px;
                    max-width: 196px;
                    padding: 8px;
                    overflow: hidden;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-bid-package-batch-note {
                    color: #64748b;
                    font-size: 11px;
                    line-height: 1.35;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-bid-package-batch-help {
                    margin-top: 4px;
                    color: #94a3b8;
                    font-size: 10px;
                    line-height: 1.35;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-bid-package-batch-form {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    margin-top: 8px;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-bid-package-batch-form input {
                    flex: 1 1 0;
                    width: auto;
                    min-width: 0;
                    min-height: 28px;
                    height: 28px;
                    padding: 0 8px;
                    border: 1px solid rgba(148,163,184,0.28);
                    border-radius: 8px;
                    background: #f8fafc;
                    color: #334155;
                    font-size: 12px;
                    line-height: 1.3;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-bid-package-batch-form input:focus {
                    border-color: rgba(79,104,255,0.38);
                    box-shadow: 0 0 0 3px rgba(79,104,255,0.08);
                }
                #am-wxt-keyword-modal .am-wxt-matrix-bid-package-batch-form input[data-matrix-bid-package-batch-count="1"] {
                    flex: 0 0 52px;
                    width: 52px;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-bid-package-batch-option {
                    width: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: flex-start;
                    margin: 0;
                    padding: 8px 10px;
                    border: 0;
                    border-radius: 10px;
                    background: transparent;
                    color: #334155;
                    font-size: 12px;
                    line-height: 1.35;
                    text-align: left;
                    white-space: nowrap;
                    cursor: pointer;
                    transition: background 0.2s ease, color 0.2s ease, opacity 0.2s ease;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-bid-package-batch-option + .am-wxt-matrix-bid-package-batch-option {
                    margin-top: 4px;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-bid-package-batch-option:hover {
                    background: rgba(79,104,255,0.08);
                    color: #3354d1;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-bid-package-batch-option.is-disabled,
                #am-wxt-keyword-modal .am-wxt-matrix-bid-package-batch-option:disabled {
                    opacity: 0.52;
                    cursor: not-allowed;
                    background: transparent;
                    color: #94a3b8;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-bid-package-batch-submit {
                    width: 100%;
                    min-height: 30px;
                    margin-top: 8px;
                    padding: 0 10px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    border: 1px solid rgba(79,104,255,0.16);
                    border-radius: 10px;
                    background: rgba(79,104,255,0.08);
                    color: #3354d1;
                    font-size: 12px;
                    font-weight: 600;
                    line-height: 1;
                    box-shadow: none;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-bid-package-batch-submit:hover {
                    border-color: rgba(79,104,255,0.3);
                    background: rgba(79,104,255,0.14);
                }
                #am-wxt-keyword-modal .am-wxt-matrix-bid-package-batch-submit.is-disabled,
                #am-wxt-keyword-modal .am-wxt-matrix-bid-package-batch-submit:disabled {
                    opacity: 0.52;
                    cursor: not-allowed;
                    background: rgba(241,245,249,0.88);
                    color: #94a3b8;
                    border-color: rgba(148,163,184,0.2);
                }
                #am-wxt-keyword-modal .am-wxt-matrix-bid-package-cost-meta {
                    flex: 0 0 auto;
                    display: inline-block;
                    padding: 0;
                    min-height: 0;
                    background: transparent;
                    color: #64748b;
                    font-size: 10px;
                    line-height: 1.2;
                    font-weight: 600;
                    white-space: nowrap;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-bid-package-remove {
                    width: 18px;
                    min-width: 18px;
                    height: 32px;
                    margin-left: -18px;
                    padding: 0;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    border: 0;
                    border-radius: 999px;
                    background: rgba(241,245,249,0.72);
                    color: #94a3b8;
                    line-height: 1;
                    box-shadow: none;
                    visibility: hidden;
                    opacity: 0;
                    pointer-events: none;
                    transform: translateX(6px) scale(0.78);
                    transition: width 0.2s ease, min-width 0.2s ease, margin-left 0.2s ease, opacity 0.2s ease, transform 0.2s ease, color 0.2s ease, background 0.2s ease;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-bid-package-remove svg {
                    width: 14px;
                    height: 14px;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-bid-package-row:hover .am-wxt-matrix-bid-package-remove {
                    width: 32px;
                    min-width: 32px;
                    margin-left: 0;
                    visibility: visible;
                    opacity: 1;
                    pointer-events: auto;
                    transform: none;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-bid-package-remove:hover {
                    background: rgba(79,104,255,0.08);
                    color: #3354d1;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-bid-package-suggests {
                    display: flex;
                    align-items: center;
                    justify-content: flex-end;
                    gap: 6px;
                    flex: 1 1 auto;
                    flex-wrap: wrap;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-bid-package-suggest {
                    min-height: 28px;
                    padding: 0 9px;
                    border: 1px solid rgba(148,163,184,0.24);
                    border-radius: 999px;
                    background: #fff;
                    color: #475569;
                    font-size: 11px;
                    line-height: 1.2;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-bid-package-suggest:hover {
                    border-color: rgba(79,104,255,0.26);
                    color: #3354d1;
                }
                @media (max-width: 720px) {
                    #am-wxt-keyword-modal .am-wxt-matrix-bid-package-row-head {
                        gap: 5px;
                    }
                }
                #am-wxt-keyword-modal .am-wxt-matrix-dimension-picker {
                    position: relative;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-dimension-picker-trigger {
                    width: 100%;
                    min-height: 38px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 8px;
                    padding: 8px 12px;
                    border: 1px solid rgba(148,163,184,0.3);
                    border-radius: 10px;
                    background: #fff;
                    color: #334155;
                    font-size: 12px;
                    line-height: 1.4;
                    text-align: left;
                    transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-dimension-picker-trigger:hover:not(:disabled),
                #am-wxt-keyword-modal .am-wxt-matrix-dimension-picker.open .am-wxt-matrix-dimension-picker-trigger {
                    border-color: rgba(79,104,255,0.34);
                    box-shadow: 0 0 0 3px rgba(79,104,255,0.08);
                    background: rgba(248,250,255,0.98);
                }
                #am-wxt-keyword-modal .am-wxt-matrix-dimension-picker-trigger:disabled {
                    color: #94a3b8;
                    cursor: not-allowed;
                    background: rgba(248,250,252,0.96);
                }
                #am-wxt-keyword-modal .am-wxt-matrix-dimension-picker-label {
                    flex: 1 1 auto;
                    min-width: 0;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-dimension-picker-arrow {
                    flex: 0 0 auto;
                    width: 16px;
                    height: 16px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    color: transparent;
                    background: center / 16px 16px no-repeat url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none'%3E%3Cpath d='M7 10l5 5 5-5' stroke='%2394A3B8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
                    transition: opacity 0.2s ease;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-dimension-picker-panel {
                    display: none;
                    position: absolute;
                    top: calc(100% + 6px);
                    left: 0;
                    right: 0;
                    z-index: 20;
                    max-height: 224px;
                    overflow: auto;
                    padding: 6px;
                    border: 1px solid rgba(148,163,184,0.24);
                    border-radius: 12px;
                    background: #fff;
                    box-shadow: 0 14px 32px rgba(15,23,42,0.1);
                }
                #am-wxt-keyword-modal .am-wxt-matrix-dimension-picker.open .am-wxt-matrix-dimension-picker-panel {
                    display: block;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-dimension-key-picker .am-wxt-matrix-dimension-picker-trigger {
                    min-height: 32px;
                    padding: 6px 12px;
                    border: 1px solid rgba(79,104,255,0.14);
                    border-radius: 999px;
                    background: rgba(79,104,255,0.08);
                    color: #3354d1;
                    font-weight: 600;
                    box-shadow: none;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-dimension-key-picker .am-wxt-matrix-dimension-picker-trigger:hover,
                #am-wxt-keyword-modal .am-wxt-matrix-dimension-key-picker.open .am-wxt-matrix-dimension-picker-trigger {
                    border-color: rgba(79,104,255,0.26);
                    background: rgba(79,104,255,0.12);
                    box-shadow: 0 0 0 3px rgba(79,104,255,0.06);
                }
                #am-wxt-keyword-modal .am-wxt-matrix-dimension-key-picker .am-wxt-matrix-dimension-picker-arrow {
                    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none'%3E%3Cpath d='M7 10l5 5 5-5' stroke='%233354D1' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
                }
                #am-wxt-keyword-modal .am-wxt-matrix-dimension-key-picker .am-wxt-matrix-dimension-picker-panel {
                    left: 0;
                    right: auto;
                    min-width: 188px;
                    max-height: min(360px, calc(100vh - 180px));
                    overflow-y: auto;
                    overflow-x: hidden;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-dimension-picker-option {
                    display: flex;
                    align-items: flex-start;
                    gap: 8px;
                    padding: 8px 10px;
                    border-radius: 10px;
                    color: #334155;
                    cursor: pointer;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-dimension-picker-option:hover {
                    background: rgba(79,104,255,0.05);
                }
                #am-wxt-keyword-modal .am-wxt-matrix-dimension-picker-option input[type="checkbox"],
                #am-wxt-keyword-modal .am-wxt-matrix-dimension-picker-option input[type="radio"] {
                    flex: 0 0 auto;
                    margin-top: 2px;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-dimension-picker-option-text {
                    flex: 1 1 auto;
                    min-width: 0;
                    font-size: 12px;
                    line-height: 1.45;
                    word-break: break-word;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-dimension-picker-empty {
                    padding: 10px;
                    color: #94a3b8;
                    font-size: 12px;
                    line-height: 1.45;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-trend-theme-actions {
                    margin-top: 6px;
                    padding-top: 6px;
                    border-top: 1px solid rgba(148,163,184,0.18);
                }
                #am-wxt-keyword-modal .am-wxt-matrix-trend-theme-edit {
                    width: 100%;
                    min-height: 34px;
                    padding: 7px 10px;
                    border: 1px solid rgba(79,104,255,0.22);
                    border-radius: 8px;
                    background: rgba(79,104,255,0.08);
                    color: #3354d1;
                    font-size: 12px;
                    font-weight: 600;
                    cursor: pointer;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-trend-theme-edit:hover {
                    border-color: rgba(79,104,255,0.34);
                    background: rgba(79,104,255,0.13);
                }
                #am-wxt-keyword-modal .am-wxt-matrix-dimension-value-select {
                    width: 100%;
                    min-height: 92px;
                    padding: 6px 8px;
                    border: 1px solid rgba(148,163,184,0.4);
                    border-radius: 10px;
                    background: #fff;
                }
                #am-wxt-keyword-modal .am-wxt-matrix-dimension-value-select:disabled {
                    color: #94a3b8;
                    background: rgba(248,250,252,0.9);
                    cursor: not-allowed;
                }
                #am-wxt-keyword-modal .am-wxt-setting-row {
                    display: grid;
                    grid-template-columns: 140px minmax(0, 1fr);
                    align-items: flex-start;
                    gap: 10px;
                    padding: 6px 0;
                    border-bottom: 1px dashed rgba(148,163,184,0.28);
                }
                #am-wxt-keyword-modal .am-wxt-setting-row:last-child {
                    border-bottom: 0;
                }
                #am-wxt-keyword-modal .am-wxt-setting-label {
                    font-size: 12px;
                    color: #334155;
                    line-height: 30px;
                    white-space: nowrap;
                }
                #am-wxt-keyword-modal .am-wxt-setting-control {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                    min-width: 0;
                }
                #am-wxt-keyword-modal .am-wxt-setting-control.am-wxt-setting-control-pair {
                    flex-direction: row;
                    align-items: center;
                    gap: 10px;
                    flex-wrap: nowrap;
                }
                #am-wxt-keyword-modal .am-wxt-setting-control.am-wxt-setting-control-pair .am-wxt-option-line.segmented {
                    flex: 0 1 auto;
                    min-width: 0;
                }
                #am-wxt-keyword-modal .am-wxt-scene-inline-input {
                    display: inline-flex;
                    align-items: center;
                    justify-content: flex-start;
                    gap: 6px;
                    min-width: 178px;
                    flex: 0 0 auto;
                    margin-left: 8px;
                }
                #am-wxt-keyword-modal .am-wxt-scene-inline-input .am-wxt-inline-label {
                    font-size: 12px;
                    color: #475569;
                    line-height: 1.2;
                    white-space: nowrap;
                }
                #am-wxt-keyword-modal .am-wxt-scene-inline-input .am-wxt-inline-input-wrap {
                    position: relative;
                    display: inline-flex;
                    align-items: center;
                }
                #am-wxt-keyword-modal .am-wxt-scene-inline-input input {
                    width: 120px;
                }
                #am-wxt-keyword-modal .am-wxt-scene-inline-input.with-unit input {
                    padding-right: 24px;
                }
                #am-wxt-keyword-modal .am-wxt-scene-inline-input .am-wxt-inline-unit {
                    position: absolute;
                    right: 8px;
                    top: 50%;
                    transform: translateY(-50%);
                    font-size: 11px;
                    color: #64748b;
                    pointer-events: none;
                }
                #am-wxt-keyword-modal .am-wxt-site-optimize-box {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    padding: 8px 10px;
                    border: 1px solid rgba(148,163,184,0.28);
                    border-radius: 12px;
                    background: #f8fafc;
                }
                #am-wxt-keyword-modal .am-wxt-site-optimize-item {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                #am-wxt-keyword-modal .am-wxt-site-optimize-main {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    flex-wrap: wrap;
                    min-width: 0;
                }
                #am-wxt-keyword-modal .am-wxt-site-optimize-title {
                    min-width: 68px;
                    font-size: 12px;
                    color: #334155;
                    font-weight: 600;
                    line-height: 1.4;
                }
                #am-wxt-keyword-modal .am-wxt-site-toggle {
                    display: inline-flex;
                    gap: 0;
                    border: 1px solid rgba(148,163,184,0.28);
                    border-radius: 12px;
                    overflow: hidden;
                    background: #fff;
                }
                #am-wxt-keyword-modal .am-wxt-site-toggle .am-wxt-option-chip {
                    border: none;
                    border-right: 1px solid rgba(148,163,184,0.2);
                    border-radius: 0;
                    padding: 8px 14px;
                    background: #fff;
                    color: #475569;
                }
                #am-wxt-keyword-modal .am-wxt-site-toggle .am-wxt-option-chip:last-child {
                    border-right: none;
                }
                #am-wxt-keyword-modal .am-wxt-site-toggle .am-wxt-option-chip.active {
                    background: rgba(79,104,255,0.1);
                    color: #5f76cc;
                    box-shadow: inset 0 0 0 1px rgba(63,94,251,0.62);
                    border-radius: 0;
                }
                #am-wxt-keyword-modal .am-wxt-site-toggle .am-wxt-option-chip:first-child.active {
                    border-top-left-radius: 11px;
                    border-bottom-left-radius: 11px;
                }
                #am-wxt-keyword-modal .am-wxt-site-toggle .am-wxt-option-chip:last-child.active {
                    border-top-right-radius: 11px;
                    border-bottom-right-radius: 11px;
                }
                #am-wxt-keyword-modal .am-wxt-site-toggle.am-wxt-site-toggle-wide {
                    flex-wrap: nowrap;
                    max-width: 100%;
                    overflow-x: auto;
                }
                #am-wxt-keyword-modal .am-wxt-site-switch {
                    position: relative;
                    display: inline-flex;
                    align-items: center;
                    justify-content: flex-start;
                    width: 36px;
                    min-width: 36px;
                    height: 18px;
                    border: none;
                    border-radius: 999px;
                    padding: 0 4px;
                    background: #4f68ff;
                    color: #fff !important;
                    cursor: pointer;
                    font-size: 10px;
                    line-height: 1;
                    font-weight: 700;
                    transition: background 0.2s ease;
                }
                #am-wxt-keyword-modal .am-wxt-site-switch.is-off {
                    justify-content: flex-end;
                    background: #cbd5e1;
                    color: #64748b;
                }
                #am-wxt-keyword-modal .am-wxt-site-switch .am-wxt-site-switch-handle {
                    position: absolute;
                    top: 2px;
                    left: 20px;
                    width: 14px;
                    height: 14px;
                    border-radius: 50%;
                    background: #fff;
                    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.25);
                    transition: left 0.2s ease;
                }
                #am-wxt-keyword-modal .am-wxt-site-switch.is-off .am-wxt-site-switch-handle {
                    left: 2px;
                }
                #am-wxt-keyword-modal .am-wxt-site-switch .am-wxt-site-switch-state {
                    position: relative;
                    z-index: 1;
                    pointer-events: none;
                    user-select: none;
                }
                #am-wxt-keyword-modal .am-wxt-site-switch.is-on .am-wxt-site-switch-state {
                    padding-right: 10px;
                }
                #am-wxt-keyword-modal .am-wxt-site-switch.is-off .am-wxt-site-switch-state {
                    padding-left: 10px;
                }
                #am-wxt-keyword-modal .am-wxt-site-switch:focus-visible {
                    outline: 2px solid rgba(59, 130, 246, 0.65);
                    outline-offset: 2px;
                }
                #am-wxt-keyword-modal .am-wxt-site-optimize-inline-row {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    flex-wrap: wrap;
                }
                #am-wxt-keyword-modal .am-wxt-site-optimize-inline-label {
                    font-size: 12px;
                    color: #475569;
                    white-space: nowrap;
                }
                #am-wxt-keyword-modal .am-wxt-site-optimize-inline-input {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 12px;
                    color: #475569;
                }
                #am-wxt-keyword-modal .am-wxt-site-optimize-inline-input input {
                    width: 92px;
                }
                #am-wxt-keyword-modal .am-wxt-site-optimize-hint {
                    font-size: 12px;
                    color: #64748b;
                    line-height: 1.4;
                }
                #am-wxt-keyword-modal .am-wxt-site-optimize-link {
                    font-size: 12px;
                    color: #4f68ff;
                    line-height: 1.2;
                }
                #am-wxt-keyword-modal .am-wxt-site-optimize-config {
                    display: flex;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 8px;
                    padding-left: 78px;
                }
                #am-wxt-keyword-modal .am-wxt-site-optimize-config input {
                    width: 180px;
                }
                #am-wxt-keyword-modal .am-wxt-static-settings {
                    display: none;
                }
                #am-wxt-keyword-modal .am-wxt-setting-control-inline {
                    flex-direction: row;
                    align-items: center;
                    gap: 10px;
                    flex-wrap: wrap;
                }
                #am-wxt-keyword-modal .am-wxt-inline-check {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 12px;
                }
                #am-wxt-keyword-modal .am-wxt-option-line {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                }
                #am-wxt-keyword-modal .am-wxt-option-line.segmented {
                    display: inline-flex;
                    width: fit-content;
                    max-width: 100%;
                    gap: 0;
                    flex-wrap: nowrap;
                    overflow-x: auto;
                    border: 1px solid rgba(148,163,184,0.28);
                    border-radius: 14px;
                    background: #fff;
                }
                #am-wxt-keyword-modal .am-wxt-option-chip {
                    border: 1px solid rgba(148,163,184,0.5);
                    border-radius: 9px;
                    padding: 5px 10px;
                    background: #fff;
                    color: #475569;
                    cursor: pointer;
                    font-size: 12px;
                    line-height: 1.2;
                }
                #am-wxt-keyword-modal .am-wxt-option-chip.active {
                    border-color: #4f68ff;
                    background: rgba(79,104,255,0.1);
                    color: #3344c8;
                    font-weight: 600;
                }
                #am-wxt-keyword-modal .am-wxt-option-chip:disabled {
                    cursor: not-allowed;
                    opacity: 0.48;
                }
                #am-wxt-keyword-modal .am-wxt-option-line.segmented .am-wxt-option-chip {
                    flex: 0 0 auto;
                    border: none;
                    border-right: 1px solid rgba(148,163,184,0.2);
                    border-radius: 0;
                    padding: 11px 16px;
                    background: #fff;
                    color: #64748b;
                    font-size: 13px;
                    line-height: 1.25;
                    position: relative;
                    z-index: 1;
                    pointer-events: auto;
                }
                #am-wxt-keyword-modal .am-wxt-option-line.segmented .am-wxt-option-chip:last-child {
                    border-right: none;
                }
                #am-wxt-keyword-modal .am-wxt-option-line.segmented .am-wxt-option-chip.active {
                    background: rgba(79,104,255,0.1);
                    color: #5f76cc;
                    font-weight: 600;
                    box-shadow: inset 0 0 0 1px rgba(63,94,251,0.62);
                    border-radius: 0;
                }
                #am-wxt-keyword-modal .am-wxt-option-line.segmented .am-wxt-option-chip:first-child.active {
                    border-top-left-radius: 13px;
                    border-bottom-left-radius: 13px;
                }
                #am-wxt-keyword-modal .am-wxt-option-line.segmented .am-wxt-option-chip:last-child.active {
                    border-top-right-radius: 13px;
                    border-bottom-right-radius: 13px;
                }
                #am-wxt-keyword-modal .am-wxt-option-chip .am-wxt-option-badge {
                    display: inline-flex;
                    align-items: center;
                    margin-left: 6px;
                    padding: 1px 7px;
                    border-radius: 10px;
                    background: #ffe4e8;
                    color: #ef4444;
                    font-size: 11px;
                    line-height: 1.25;
                    font-weight: 600;
                }
                #am-wxt-keyword-modal .am-wxt-hidden-control {
                    display: none !important;
                }
                #am-wxt-keyword-modal .am-wxt-scene-popup-control {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    margin-left: 8px;
                }
                #am-wxt-keyword-modal .am-wxt-scene-popup-summary {
                    font-size: 12px;
                    color: #64748b;
                    white-space: nowrap;
                }
                #am-wxt-keyword-modal .am-wxt-scene-popup-summary[data-scene-popup-trigger-proxy] {
                    cursor: pointer;
                    user-select: none;
                }
                #am-wxt-keyword-modal .am-wxt-scene-popup-summary[data-scene-popup-trigger-proxy]:hover {
                    color: #475569;
                    text-decoration: underline;
                }
                #am-wxt-keyword-modal .am-wxt-scene-popup-summary[data-scene-popup-trigger-proxy]:focus-visible {
                    outline: 2px solid rgba(59,130,246,0.45);
                    outline-offset: 2px;
                    border-radius: 4px;
                }
                #am-wxt-keyword-modal .am-wxt-ai-max-setting-row {
                    align-items: flex-start;
                }
                #am-wxt-keyword-modal .am-wxt-ai-max-setting-row .am-wxt-setting-control {
                    width: 100%;
                    max-width: 100%;
                }
                #am-wxt-keyword-modal .am-wxt-ai-max-switch-row {
                    align-items: center;
                }
                #am-wxt-keyword-modal .am-wxt-ai-max-switch-label {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                }
                #am-wxt-keyword-modal .am-wxt-ai-max-help-icon {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 14px;
                    height: 14px;
                    border-radius: 50%;
                    background: #eef2ff;
                    color: #64748b;
                    line-height: 1;
                    cursor: help;
                }
                #am-wxt-keyword-modal .am-wxt-ai-max-help-icon svg {
                    width: 12px;
                    height: 12px;
                }
                #am-wxt-keyword-modal .am-wxt-ai-max-switch-control {
                    flex-direction: row;
                    align-items: center;
                    gap: 8px;
                    min-height: 32px;
                    overflow: hidden;
                }
                #am-wxt-keyword-modal .am-wxt-ai-max-switch-control .am-wxt-option-line.segmented {
                    flex: 0 0 auto;
                }
                #am-wxt-keyword-modal .am-wxt-ai-max-switch-desc {
                    flex: 1 1 auto;
                    min-width: 0;
                    overflow: hidden;
                    white-space: nowrap;
                    text-overflow: ellipsis;
                    color: #64748b;
                    font-size: 12px;
                    line-height: 1.4;
                }
                #am-wxt-keyword-modal .am-wxt-ai-max-doc-link {
                    flex: 0 0 auto;
                    display: inline-flex;
                    align-items: center;
                    gap: 3px;
                    color: #4f68ff;
                    font-size: 12px;
                    line-height: 1.4;
                    text-decoration: none;
                    white-space: nowrap;
                }
                #am-wxt-keyword-modal .am-wxt-ai-max-doc-link svg {
                    width: 12px;
                    height: 12px;
                }
                #am-wxt-keyword-modal .am-wxt-ai-max-panel {
                    width: 100%;
                    border: none;
                    border-radius: 6px;
                    background: #f7f9fc;
                    padding: 12px 16px;
                    color: #1f2937;
                    box-sizing: border-box;
                    box-shadow: inset 0 0 0 1px rgba(226,232,240,0.9);
                }
                #am-wxt-keyword-modal .am-wxt-ai-max-panel-pending {
                    background: #f8fafc;
                    border-color: rgba(148,163,184,0.45);
                }
                #am-wxt-keyword-modal .am-wxt-ai-max-head {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    flex-wrap: wrap;
                    font-size: 13px;
                    line-height: 1.45;
                    color: #475569;
                }
                #am-wxt-keyword-modal .am-wxt-ai-max-link {
                    border: 0;
                    background: transparent;
                    color: #4f68ff;
                    font-size: 13px;
                    font-weight: 600;
                    cursor: pointer;
                    padding: 0;
                }
                #am-wxt-keyword-modal .am-wxt-ai-max-status {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 8px;
                    margin-top: 14px;
                    min-height: 32px;
                    border-radius: 0;
                    background: transparent;
                    padding: 0 0 0 16px;
                    color: #334155;
                    font-size: 13px;
                }
                #am-wxt-keyword-modal .am-wxt-ai-max-status-title {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    min-width: 0;
                }
                #am-wxt-keyword-modal .am-wxt-ai-max-status-icon {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    background: #e8f7ef;
                    color: #16a34a;
                }
                #am-wxt-keyword-modal .am-wxt-ai-max-status-icon svg {
                    width: 13px;
                    height: 13px;
                }
                #am-wxt-keyword-modal .am-wxt-ai-max-detail-btn {
                    border: 0;
                    background: transparent;
                    color: #4f68ff;
                    font-size: 13px;
                    cursor: pointer;
                    padding: 0;
                    display: inline-flex;
                    align-items: center;
                    justify-content: flex-end;
                    gap: 3px;
                }
                #am-wxt-keyword-modal .am-wxt-ai-max-detail-btn:not(:empty) {
                    min-width: 70px;
                    text-align: right;
                }
                #am-wxt-keyword-modal .am-wxt-ai-max-detail-btn svg {
                    width: 12px;
                    height: 12px;
                }
                #am-wxt-keyword-modal .am-wxt-ai-max-deep-detail {
                    margin: 14px 8px 18px;
                    border-radius: 18px;
                    background: linear-gradient(110deg, rgba(248,250,255,0.96), rgba(252,247,255,0.96));
                    padding: 16px 18px;
                }
                #am-wxt-keyword-modal .am-wxt-ai-max-deep-detail.hidden {
                    display: none;
                }
                #am-wxt-keyword-modal .am-wxt-ai-max-deep-box {
                    display: grid;
                    gap: 2px;
                    border-radius: 18px;
                    background: #fff;
                    padding: 12px 18px;
                }
                #am-wxt-keyword-modal .am-wxt-ai-max-deep-step {
                    display: grid;
                    grid-template-columns: minmax(0, 1fr) auto;
                    align-items: start;
                    gap: 14px;
                    min-height: 40px;
                    padding: 10px 0;
                    color: #1f2937;
                }
                #am-wxt-keyword-modal .am-wxt-ai-max-deep-step-main {
                    display: grid;
                    gap: 6px;
                    min-width: 0;
                }
                #am-wxt-keyword-modal .am-wxt-ai-max-deep-step-title {
                    font-size: 14px;
                    font-weight: 700;
                    line-height: 1.45;
                    min-height: 20px;
                }
                #am-wxt-keyword-modal .am-wxt-ai-max-deep-step-desc {
                    max-width: 760px;
                    font-size: 12px;
                    line-height: 1.55;
                    color: #64748b;
                }
                #am-wxt-keyword-modal .am-wxt-ai-max-deep-step-desc.hidden {
                    display: none;
                }
                #am-wxt-keyword-modal .am-wxt-ai-max-step-btn {
                    border: 0;
                    background: transparent;
                    color: #4f68ff;
                    padding: 0;
                    font-size: 13px;
                    line-height: 1.45;
                    cursor: pointer;
                    white-space: nowrap;
                    display: inline-flex;
                    align-items: center;
                    gap: 3px;
                }
                #am-wxt-keyword-modal .am-wxt-ai-max-step-btn svg {
                    width: 12px;
                    height: 12px;
                }
                #am-wxt-keyword-modal .am-wxt-ai-max-copy {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 10px;
                    font-size: 14px;
                    font-weight: 600;
                    line-height: 1.5;
                    color: #1f2937;
                    min-width: 0;
                }
                #am-wxt-keyword-modal .am-wxt-ai-max-copy-row {
                    display: grid;
                    grid-template-columns: minmax(0, 1fr) auto;
                    align-items: center;
                    gap: 12px;
                    margin-top: 12px;
                    padding: 0 16px;
                }
                #am-wxt-keyword-modal .am-wxt-ai-max-demand-summary {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    min-height: 32px;
                    border: 1px solid rgba(79,104,255,0.42);
                    border-radius: 999px;
                    background: #fff;
                    color: #4f68ff;
                    padding: 0 12px;
                    font-size: 13px;
                    cursor: pointer;
                    white-space: nowrap;
                }
                #am-wxt-keyword-modal .am-wxt-ai-max-demand-summary span {
                    color: #94a3b8;
                }
                #am-wxt-keyword-modal .am-wxt-ai-max-demand-summary b {
                    font-weight: 600;
                    color: #4f68ff;
                }
                #am-wxt-keyword-modal .am-wxt-ai-max-demand-summary svg {
                    width: 12px;
                    height: 12px;
                    color: #4f68ff;
                }
                #am-wxt-ai-max-demand-popover {
                    position: absolute;
                    width: 270px;
                    border-radius: 10px;
                    background: #fff;
                    box-shadow: 0 10px 30px rgba(15,23,42,0.18);
                    border: 1px solid rgba(226,232,240,0.9);
                    color: #4f68ff;
                    z-index: 2147483647;
                    overflow: hidden;
                    font-size: 15px;
                }
                #am-wxt-ai-max-demand-popover .am-wxt-ai-max-demand-popover-body {
                    padding: 12px 18px 10px;
                }
                #am-wxt-ai-max-demand-popover .am-wxt-ai-max-demand-popover-head {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 10px;
                    margin-bottom: 8px;
                }
                #am-wxt-ai-max-demand-popover .am-wxt-ai-max-demand-popover-list {
                    display: grid;
                    gap: 8px;
                }
                #am-wxt-ai-max-demand-popover .am-wxt-ai-max-demand-popover-item {
                    display: grid;
                    grid-template-columns: 18px minmax(0, 1fr);
                    align-items: center;
                    gap: 6px;
                    min-width: 0;
                    cursor: pointer;
                    color: #4f68ff;
                    line-height: 1.35;
                }
                #am-wxt-ai-max-demand-popover .am-wxt-ai-max-demand-popover-item.all {
                    flex: 1 1 auto;
                }
                #am-wxt-ai-max-demand-popover .am-wxt-ai-max-demand-popover-item input {
                    position: absolute;
                    opacity: 0;
                    pointer-events: none;
                }
                #am-wxt-ai-max-demand-popover .am-wxt-ai-max-demand-popover-check {
                    width: 16px;
                    height: 16px;
                    border-radius: 4px;
                    border: 1px solid #4f68ff;
                    background: #4f68ff;
                    color: #fff;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    line-height: 1;
                    box-sizing: border-box;
                }
                #am-wxt-ai-max-demand-popover .am-wxt-ai-max-demand-popover-check svg {
                    width: 12px;
                    height: 12px;
                }
                #am-wxt-ai-max-demand-popover input:not(:checked) + .am-wxt-ai-max-demand-popover-check {
                    background: #fff;
                    color: transparent;
                    border-color: #cbd5e1;
                }
                #am-wxt-ai-max-demand-popover input:indeterminate + .am-wxt-ai-max-demand-popover-check {
                    background: #4f68ff;
                    color: transparent;
                    border-color: #4f68ff;
                    position: relative;
                }
                #am-wxt-ai-max-demand-popover input:indeterminate + .am-wxt-ai-max-demand-popover-check::after {
                    content: "";
                    width: 8px;
                    height: 2px;
                    border-radius: 99px;
                    background: #fff;
                    position: absolute;
                }
                #am-wxt-ai-max-demand-popover .am-wxt-ai-max-demand-popover-text {
                    min-width: 0;
                    overflow: hidden;
                    white-space: nowrap;
                    text-overflow: ellipsis;
                }
                #am-wxt-ai-max-demand-popover .am-wxt-ai-max-demand-popover-count {
                    flex: 0 0 auto;
                    color: #94a3b8;
                    font-size: 14px;
                }
                #am-wxt-ai-max-demand-popover .am-wxt-ai-max-demand-popover-count b {
                    color: #64748b;
                    font-weight: 500;
                }
                #am-wxt-ai-max-demand-popover .am-wxt-ai-max-demand-popover-foot {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    border-top: 1px solid rgba(226,232,240,0.95);
                    padding: 10px 18px;
                    background: #fff;
                }
                #am-wxt-ai-max-demand-popover .am-wxt-btn {
                    min-width: 62px;
                    height: 34px;
                    border-radius: 18px;
                    padding: 0 16px;
                    font-size: 14px;
                }
                #am-wxt-keyword-modal .am-wxt-ai-max-demand-list-wrap {
                    position: relative;
                    margin-top: 12px;
                    padding: 0 16px;
                }
                #am-wxt-keyword-modal .am-wxt-ai-max-demand-list {
                    display: flex;
                    gap: 10px;
                    overflow-x: auto;
                    overflow-y: visible;
                    scroll-behavior: smooth;
                    scrollbar-width: none;
                    padding: 0 0 2px;
                }
                #am-wxt-keyword-modal .am-wxt-ai-max-demand-list::-webkit-scrollbar {
                    display: none;
                }
                #am-wxt-keyword-modal .am-wxt-ai-max-demand-card {
                    display: flex;
                    align-items: flex-start;
                    gap: 8px;
                    flex: 0 0 calc((100% - 20px) / 3);
                    min-width: calc((100% - 20px) / 3);
                    border: 1px solid rgba(226,232,240,0.95);
                    border-radius: 8px;
                    background: rgba(255,255,255,0.86);
                    padding: 12px;
                    text-align: left;
                    cursor: pointer;
                    color: #334155;
                }
                #am-wxt-keyword-modal .am-wxt-ai-max-demand-card:hover {
                    border-color: rgba(79,104,255,0.45);
                }
                #am-wxt-keyword-modal .am-wxt-ai-max-demand-card.active {
                    border-color: #4f46e5;
                    box-shadow: inset 0 0 0 1px rgba(79,70,229,0.24);
                }
                #am-wxt-keyword-modal .am-wxt-ai-max-demand-next {
                    position: absolute;
                    top: 50%;
                    right: 0;
                    transform: translate(50%, -50%);
                    width: 34px;
                    height: 58px;
                    border: 0;
                    border-radius: 4px;
                    background: rgba(71,85,105,0.66);
                    color: #fff;
                    font-size: 34px;
                    line-height: 1;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 2;
                }
                #am-wxt-keyword-modal .am-wxt-ai-max-demand-next:hover {
                    background: rgba(51,65,85,0.78);
                }
                #am-wxt-keyword-modal .am-wxt-ai-max-demand-icon {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    color: #4f46e5;
                    line-height: 1.2;
                }
                #am-wxt-keyword-modal .am-wxt-ai-max-demand-icon svg {
                    width: 16px;
                    height: 16px;
                }
                #am-wxt-keyword-modal .am-wxt-ai-max-demand-main {
                    display: grid;
                    gap: 6px;
                    min-width: 0;
                }
                #am-wxt-keyword-modal .am-wxt-ai-max-demand-main b {
                    font-size: 14px;
                    color: #1f2937;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                #am-wxt-keyword-modal .am-wxt-ai-max-demand-main em {
                    font-style: normal;
                    font-size: 12px;
                    line-height: 1.45;
                    color: #64748b;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
                #am-wxt-keyword-modal .am-wxt-ai-max-analysis {
                    margin-top: 12px;
                    padding: 0 16px;
                    font-size: 13px;
                    color: #475569;
                    line-height: 1.5;
                }
                #am-wxt-keyword-modal .am-wxt-ai-max-budget {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin: 10px 16px 0;
                    border-radius: 8px;
                    background: rgba(255,255,255,0.78);
                    border: 1px solid rgba(191,219,254,0.8);
                    padding: 10px 12px;
                    font-size: 13px;
                    color: #334155;
                }
                #am-wxt-keyword-modal .am-wxt-ai-max-budget b {
                    color: #1d4ed8;
                }
                #am-wxt-keyword-modal .am-wxt-ai-max-detail-grid {
                    display: grid;
                    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
                    margin: 12px 16px 0;
                    border: 1px solid rgba(203,213,225,0.75);
                    border-radius: 8px;
                    overflow: hidden;
                    background: rgba(255,255,255,0.86);
                }
                #am-wxt-keyword-modal .am-wxt-ai-max-detail-grid.hidden {
                    display: none;
                }
                #am-wxt-keyword-modal .am-wxt-ai-max-word-cloud,
                #am-wxt-keyword-modal .am-wxt-ai-max-persona-list {
                    padding: 16px;
                    min-width: 0;
                }
                #am-wxt-keyword-modal .am-wxt-ai-max-word-cloud {
                    border-right: 1px solid rgba(203,213,225,0.72);
                }
                #am-wxt-keyword-modal .am-wxt-ai-max-word-cloud > b,
                #am-wxt-keyword-modal .am-wxt-ai-max-persona-list > b {
                    display: block;
                    margin-bottom: 14px;
                    font-size: 13px;
                    color: #1f2937;
                }
                #am-wxt-keyword-modal .am-wxt-ai-max-word-cloud > div {
                    min-height: 126px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-direction: column;
                    gap: 8px;
                }
                #am-wxt-keyword-modal .am-wxt-ai-max-word {
                    font-weight: 800;
                    line-height: 1.05;
                    color: #2563eb;
                }
                #am-wxt-keyword-modal .am-wxt-ai-max-word.word-1 {
                    font-size: 28px;
                }
                #am-wxt-keyword-modal .am-wxt-ai-max-word.word-2 {
                    font-size: 24px;
                    color: #7c3aed;
                }
                #am-wxt-keyword-modal .am-wxt-ai-max-word.word-3 {
                    font-size: 22px;
                    color: #0891b2;
                }
                #am-wxt-keyword-modal .am-wxt-ai-max-persona-list {
                    display: grid;
                    gap: 12px;
                }
                #am-wxt-keyword-modal .am-wxt-ai-max-persona {
                    display: grid;
                    grid-template-columns: 34px minmax(0, 1fr);
                    gap: 10px;
                    align-items: flex-start;
                }
                #am-wxt-keyword-modal .am-wxt-ai-max-persona-icon {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 34px;
                    height: 34px;
                    border-radius: 8px;
                    background: #f1f5f9;
                    color: #4f46e5;
                }
                #am-wxt-keyword-modal .am-wxt-ai-max-persona-icon svg {
                    width: 16px;
                    height: 16px;
                }
                #am-wxt-keyword-modal .am-wxt-ai-max-persona b,
                #am-wxt-keyword-modal .am-wxt-ai-max-persona em {
                    display: block;
                    font-style: normal;
                    line-height: 1.45;
                }
                #am-wxt-keyword-modal .am-wxt-ai-max-persona b {
                    font-size: 13px;
                    color: #334155;
                }
                #am-wxt-keyword-modal .am-wxt-ai-max-persona em {
                    margin-top: 2px;
                    font-size: 12px;
                    color: #64748b;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-popup-dialog-ai-max {
                    width: min(920px, calc(100vw - 48px));
                }
                #am-wxt-scene-popup-mask .am-wxt-ai-max-popup {
                    display: grid;
                    gap: 14px;
                }
                #am-wxt-scene-popup-mask .am-wxt-ai-max-popup-section {
                    border: 1px solid rgba(226,232,240,0.9);
                    border-radius: 8px;
                    background: #fff;
                    padding: 14px;
                }
                #am-wxt-scene-popup-mask .am-wxt-ai-max-popup-title {
                    font-size: 14px;
                    font-weight: 700;
                    color: #1f2937;
                }
                #am-wxt-scene-popup-mask .am-wxt-ai-max-popup-help {
                    margin-top: 6px;
                    font-size: 12px;
                    line-height: 1.5;
                    color: #64748b;
                }
                #am-wxt-scene-popup-mask .am-wxt-ai-max-popup textarea {
                    width: 100%;
                    min-height: 86px;
                    margin-top: 10px;
                    resize: vertical;
                    box-sizing: border-box;
                }
                #am-wxt-scene-popup-mask .am-wxt-ai-max-template-list {
                    display: grid;
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                    gap: 10px;
                    margin-top: 10px;
                }
                #am-wxt-scene-popup-mask .am-wxt-ai-max-template-card {
                    display: grid;
                    gap: 8px;
                    border: 1px solid rgba(203,213,225,0.85);
                    border-radius: 8px;
                    padding: 12px;
                    min-width: 0;
                }
                #am-wxt-scene-popup-mask .am-wxt-ai-max-template-card b {
                    font-size: 13px;
                    color: #1f2937;
                }
                #am-wxt-scene-popup-mask .am-wxt-ai-max-template-card p {
                    margin: 0;
                    color: #64748b;
                    font-size: 12px;
                    line-height: 1.5;
                }
                #am-wxt-scene-popup-mask .am-wxt-ai-max-shield-grid {
                    display: grid;
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                    gap: 12px;
                    margin-top: 12px;
                }
                #am-wxt-scene-popup-mask .am-wxt-ai-max-shield-box {
                    display: grid;
                    gap: 10px;
                    border: 1px solid rgba(226,232,240,0.9);
                    border-radius: 8px;
                    padding: 12px;
                }
                #am-wxt-scene-popup-mask .am-wxt-ai-max-shield-head {
                    display: flex;
                    justify-content: space-between;
                    gap: 8px;
                    font-size: 12px;
                    color: #64748b;
                }
                #am-wxt-scene-popup-mask .am-wxt-ai-max-shield-head b {
                    color: #334155;
                }
                #am-wxt-scene-popup-mask .am-wxt-ai-max-shield-add {
                    display: grid;
                    grid-template-columns: minmax(0, 1fr) auto;
                    gap: 8px;
                }
                #am-wxt-scene-popup-mask .am-wxt-ai-max-shield-list {
                    display: flex;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 6px;
                    min-height: 28px;
                }
                #am-wxt-scene-popup-mask .am-wxt-ai-max-shield-tag {
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                    border-radius: 999px;
                    background: rgba(69,84,229,0.10);
                    color: var(--am26-primary-strong, #1d3fcf);
                    padding: 4px 8px;
                    font-size: 12px;
                }
                #am-wxt-scene-popup-mask .am-wxt-ai-max-shield-remove {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 16px;
                    height: 16px;
                    border: 0;
                    border-radius: 999px;
                    background: transparent;
                    color: inherit;
                    cursor: pointer;
                    padding: 0;
                    line-height: 1;
                }
                #am-wxt-scene-popup-mask .am-wxt-ai-max-shield-remove svg {
                    width: 12px;
                    height: 12px;
                    flex: 0 0 auto;
                }
                #am-wxt-scene-popup-mask .am-wxt-ai-max-shield-remove:hover {
                    background: rgba(234,79,79,0.12);
                    color: var(--am26-danger, #ea4f4f);
                }
                #am-wxt-scene-popup-mask .am-wxt-ai-max-shield-remove:focus-visible {
                    outline: 2px solid rgba(37,99,235,0.45);
                    outline-offset: 2px;
                    box-shadow: 0 0 0 4px rgba(69,84,229,0.12);
                }
                #am-wxt-scene-popup-mask .am-wxt-ai-max-empty {
                    color: #94a3b8;
                    font-size: 12px;
                }
                #am-wxt-scene-popup-mask .am-wxt-ai-max-demand-check-list {
                    display: grid;
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                    gap: 8px;
                    margin-top: 10px;
                }
                #am-wxt-scene-popup-mask .am-wxt-ai-max-demand-check {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    color: #334155;
                    font-size: 13px;
                    line-height: 1.4;
                    cursor: pointer;
                }
                #am-wxt-scene-popup-mask .am-wxt-ai-max-demand-check.all {
                    margin-top: 10px;
                }
                #am-wxt-keyword-modal .am-wxt-scene-label-main {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    line-height: 1.3;
                }
                #am-wxt-keyword-modal .am-wxt-scene-label-help {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 14px;
                    height: 14px;
                    border: 1px solid #cbd5e1;
                    border-radius: 999px;
                    color: #94a3b8;
                    line-height: 1;
                    cursor: help;
                    user-select: none;
                }
                #am-wxt-keyword-modal .am-wxt-scene-label-help svg {
                    width: 12px;
                    height: 12px;
                }
                #am-wxt-keyword-modal .am-wxt-smart-crowd-control {
                    gap: 6px;
                    padding-top: 2px;
                }
                #am-wxt-keyword-modal .am-wxt-smart-crowd-check {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    color: #334155;
                    font-size: 13px;
                    line-height: 1.35;
                    cursor: pointer;
                    width: fit-content;
                }
                #am-wxt-keyword-modal .am-wxt-smart-crowd-check input[type="checkbox"] {
                    margin: 0;
                    cursor: pointer;
                }
                #am-wxt-keyword-modal .am-wxt-smart-crowd-desc {
                    display: inline-flex;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 4px 8px;
                    color: #64748b;
                    font-size: 12px;
                    line-height: 1.5;
                }
                #am-wxt-keyword-modal .am-wxt-smart-crowd-link {
                    display: inline-flex;
                    align-items: center;
                    color: #4f68ff;
                    text-decoration: none;
                    font-size: 12px;
                    line-height: 1.2;
                }
                #am-wxt-keyword-modal .am-wxt-smart-crowd-link:hover {
                    color: #3344c8;
                    text-decoration: underline;
                }
                #am-wxt-keyword-modal .am-wxt-smart-crowd-target-panel {
                    border: 1px solid rgba(148,163,184,0.26);
                    border-radius: 10px;
                    background: #fff;
                    overflow: hidden;
                }
                #am-wxt-keyword-modal .am-wxt-smart-crowd-target-head,
                #am-wxt-keyword-modal .am-wxt-smart-crowd-target-row {
                    display: grid;
                    grid-template-columns: minmax(180px, 1.15fr) minmax(220px, 1.4fr) minmax(220px, 1.35fr);
                    align-items: center;
                    gap: 12px;
                    padding: 10px 12px;
                }
                #am-wxt-keyword-modal .am-wxt-smart-crowd-target-head {
                    border-bottom: 1px solid rgba(148,163,184,0.22);
                    background: #f8fafc;
                    color: #334155;
                    font-size: 13px;
                    font-weight: 600;
                }
                #am-wxt-keyword-modal .am-wxt-smart-crowd-target-row {
                    border-bottom: 1px solid rgba(148,163,184,0.18);
                }
                #am-wxt-keyword-modal .am-wxt-smart-crowd-target-row:last-child {
                    border-bottom: none;
                }
                #am-wxt-keyword-modal .am-wxt-smart-crowd-target-check {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    color: #334155;
                    font-size: 14px;
                    line-height: 1.35;
                }
                #am-wxt-keyword-modal .am-wxt-smart-crowd-target-check input[type="checkbox"] {
                    margin: 0;
                }
                #am-wxt-keyword-modal .am-wxt-smart-crowd-target-select {
                    width: min(100%, 460px);
                    min-height: 36px;
                    padding: 0 32px 0 12px;
                    border: 1px solid rgba(203,213,225,0.95);
                    border-radius: 14px;
                    background: #f8fafc;
                    color: #334155;
                    font-size: 14px;
                }
                #am-wxt-keyword-modal .am-wxt-smart-crowd-target-value {
                    display: inline-flex;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 8px;
                    color: #475569;
                    font-size: 14px;
                }
                #am-wxt-keyword-modal .am-wxt-smart-crowd-target-value input[type="number"] {
                    width: 86px;
                    min-height: 36px;
                    padding: 0 10px;
                    border: 1px solid rgba(203,213,225,0.95);
                    border-radius: 14px;
                    background: #f8fafc;
                    color: #334155;
                    font-size: 14px;
                }
                #am-wxt-keyword-modal .am-wxt-smart-crowd-target-help {
                    display: inline-flex;
                    align-items: center;
                    justify-content: flex-end;
                    font-size: 12px;
                    color: #4f68ff;
                    text-decoration: none;
                    margin-left: auto;
                    font-weight: 500;
                }
                #am-wxt-keyword-modal .am-wxt-smart-crowd-target-help:hover {
                    text-decoration: underline;
                    color: #3344c8;
                }
                #am-wxt-keyword-modal .am-wxt-crowd-target-panel {
                    border: 1px solid rgba(148,163,184,0.3);
                    border-radius: 10px;
                    background: #fff;
                    overflow: hidden;
                }
                #am-wxt-keyword-modal .am-wxt-crowd-target-toolbar {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    flex-wrap: wrap;
                    padding: 8px 10px;
                    border-bottom: 1px solid rgba(148,163,184,0.2);
                    background: #f8fafc;
                }
                #am-wxt-keyword-modal .am-wxt-crowd-target-batch {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 12px;
                    color: #334155;
                    flex-wrap: wrap;
                }
                #am-wxt-keyword-modal .am-wxt-crowd-target-batch input {
                    width: 100px;
                }
                #am-wxt-keyword-modal .am-wxt-crowd-target-view-tips {
                    margin-left: auto;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 12px;
                    color: #94a3b8;
                }
                #am-wxt-keyword-modal .am-wxt-crowd-target-view-tips .active {
                    color: #4f68ff;
                    font-weight: 600;
                }
                #am-wxt-keyword-modal .am-wxt-crowd-target-summary {
                    padding: 6px 10px 0;
                    font-size: 12px;
                    color: #64748b;
                }
                #am-wxt-keyword-modal .am-wxt-crowd-target-list {
                    display: flex;
                    flex-direction: column;
                    gap: 0;
                    max-height: 420px;
                    overflow: auto;
                    padding: 6px 0;
                }
                #am-wxt-keyword-modal .am-wxt-crowd-target-row {
                    display: grid;
                    grid-template-columns: minmax(180px, 2fr) minmax(140px, 1.2fr) minmax(160px, 1.4fr) auto;
                    align-items: center;
                    gap: 10px;
                    padding: 8px 10px;
                    border-top: 1px dashed rgba(148,163,184,0.2);
                }
                #am-wxt-keyword-modal .am-wxt-crowd-target-row:first-child {
                    border-top: 0;
                }
                #am-wxt-keyword-modal .am-wxt-crowd-target-name {
                    min-width: 0;
                }
                #am-wxt-keyword-modal .am-wxt-crowd-target-name .name {
                    font-size: 13px;
                    color: #1f2937;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                #am-wxt-keyword-modal .am-wxt-crowd-target-name .meta {
                    margin-top: 3px;
                    font-size: 11px;
                    color: #94a3b8;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                #am-wxt-keyword-modal .am-wxt-crowd-target-bid {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 12px;
                    color: #475569;
                }
                #am-wxt-keyword-modal .am-wxt-crowd-target-bid input {
                    width: 96px;
                }
                #am-wxt-keyword-modal .am-wxt-crowd-target-suggest {
                    font-size: 12px;
                    color: #64748b;
                    line-height: 1.3;
                }
                #am-wxt-keyword-modal .am-wxt-crowd-target-actions {
                    justify-self: end;
                }
                #am-wxt-keyword-modal .am-wxt-crowd-target-empty {
                    padding: 10px;
                    font-size: 12px;
                    color: #94a3b8;
                }
                #am-wxt-keyword-item-picker-mask {
                    position: fixed;
                    inset: 0;
                    z-index: 1000010;
                    background: rgba(255, 255, 255, 0.72);
                    backdrop-filter: blur(8px) saturate(1.15);
                    -webkit-backdrop-filter: blur(8px) saturate(1.15);
                    display: flex;
                    align-items: flex-start;
                    justify-content: center;
                    padding: 56px 16px 24px;
                    box-sizing: border-box;
                    overscroll-behavior: contain;
                }
                #am-wxt-keyword-item-picker-mask .am-wxt-keyword-item-picker-dialog {
                    width: min(620px, 96vw);
                    min-height: min(310px, calc(100vh - 80px));
                    max-height: 92vh;
                    background: var(--am26-panel-strong, linear-gradient(135deg, rgba(255,255,255,0.6), rgba(255,255,255,0.2)));
                    border: 1px solid var(--am26-border-strong, rgba(255,255,255,0.6));
                    border-radius: 14px;
                    box-shadow: var(--am26-shadow, 0 8px 32px rgba(31,38,135,0.15));
                    backdrop-filter: blur(18px) saturate(1.35);
                    -webkit-backdrop-filter: blur(18px) saturate(1.35);
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    font-family: PingFangSC-Regular,PingFang SC,"Microsoft Yahei","SimHei",sans-serif;
                    color: var(--am26-text, #1b2438);
                }
                #am-wxt-keyword-item-picker-mask .am-wxt-keyword-item-picker-head {
                    height: 48px;
                    padding: 0 16px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 8px;
                    font-size: 14px;
                    font-weight: 600;
                    color: var(--am26-text, #1b2438);
                    background: var(--am26-surface-strong, rgba(255,255,255,0.45));
                    border-bottom: 1px solid var(--am26-border, rgba(255,255,255,0.4));
                }
                #am-wxt-keyword-item-picker-mask .am-wxt-keyword-item-picker-body {
                    padding: 12px 14px 14px;
                    overflow: hidden;
                    min-height: 0;
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    overscroll-behavior: contain;
                }
                #am-wxt-keyword-item-picker-mask .am-wxt-keyword-item-picker-host {
                    min-height: 0;
                    display: flex;
                    flex: 1 1 auto;
                    flex-direction: column;
                    overflow: hidden;
                }
                #am-wxt-keyword-item-picker-mask .am-wxt-keyword-item-picker-host > #am-wxt-keyword-item-split {
                    flex: 1 1 auto;
                    height: 100%;
                    min-height: 0;
                    overflow: hidden;
                    overscroll-behavior: contain;
                }
                #am-wxt-keyword-item-picker-mask .am-wxt-split {
                    display: grid;
                    grid-template-columns: minmax(0, 1fr);
                    gap: 12px;
                    align-items: stretch;
                    min-height: 0;
                }
                #am-wxt-keyword-item-picker-mask .am-wxt-split > .am-wxt-panel {
                    min-height: 0;
                }
                #am-wxt-keyword-item-picker-mask .am-wxt-split > .am-wxt-panel:nth-child(1) {
                    display: flex;
                }
                #am-wxt-keyword-item-picker-mask .am-wxt-split > .am-wxt-panel:nth-child(2) {
                    display: none;
                }
                #am-wxt-keyword-item-picker-mask .am-wxt-panel {
                    border: 1px solid var(--am26-border, rgba(255,255,255,0.4));
                    border-radius: 10px;
                    background: var(--am26-surface, rgba(255,255,255,0.25));
                    box-shadow: inset 0 1px 0 rgba(255,255,255,0.26);
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    min-height: 310px;
                    overflow: hidden;
                }
                #am-wxt-keyword-item-picker-mask .am-wxt-panel-candidate {
                    min-height: 310px;
                }
                #am-wxt-keyword-item-picker-mask .am-wxt-toolbar {
                    padding: 10px;
                    border-bottom: 1px solid var(--am26-border, rgba(255,255,255,0.4));
                    background: var(--am26-surface, rgba(255,255,255,0.25));
                    display: flex;
                    gap: 8px;
                    align-items: center;
                    flex-wrap: wrap;
                }
                #am-wxt-keyword-item-picker-mask .am-wxt-toolbar input:not([type="checkbox"]):not([type="radio"]) {
                    border: 1px solid var(--am26-border, rgba(255,255,255,0.4));
                    border-radius: 8px;
                    padding: 6px 8px;
                    font-size: 12px;
                    background: var(--am26-surface-strong, rgba(255,255,255,0.45));
                    color: var(--am26-text, #1b2438);
                    box-shadow: inset 0 1px 0 rgba(255,255,255,0.3);
                    min-height: 30px;
                    box-sizing: border-box;
                    flex: 1;
                    min-width: 180px;
                }
                #am-wxt-keyword-item-picker-mask .am-wxt-toolbar input:not([type="checkbox"]):not([type="radio"])::placeholder {
                    color: rgba(80,90,116,0.62);
                }
                #am-wxt-keyword-item-picker-mask .am-wxt-toolbar input:not([type="checkbox"]):not([type="radio"]):focus {
                    outline: none;
                    border-color: rgba(69,84,229,0.42);
                    background: rgba(255,255,255,0.62);
                    box-shadow: 0 0 0 3px rgba(69,84,229,0.12);
                }
                #am-wxt-keyword-item-picker-mask .am-wxt-btn {
                    border: 1px solid var(--am26-border, rgba(255,255,255,0.4));
                    border-radius: 8px;
                    padding: 6px 10px;
                    font-size: 12px;
                    line-height: 1;
                    background: var(--am26-surface-strong, rgba(255,255,255,0.45));
                    color: var(--am26-text-soft, #505a74);
                    box-shadow: inset 0 1px 0 rgba(255,255,255,0.28);
                    cursor: pointer;
                    transition: border-color 0.16s ease, background 0.16s ease, color 0.16s ease, box-shadow 0.16s ease;
                }
                #am-wxt-keyword-item-picker-mask .am-wxt-btn:hover {
                    border-color: rgba(69,84,229,0.42);
                    background: rgba(255,255,255,0.62);
                    color: var(--am26-text, #1b2438);
                }
                #am-wxt-keyword-item-picker-mask .am-wxt-btn:focus-visible {
                    outline: 2px solid rgba(37,99,235,0.45);
                    outline-offset: 2px;
                    box-shadow: 0 0 0 4px rgba(69,84,229,0.12);
                }
                #am-wxt-keyword-item-picker-mask .am-wxt-btn.am-wxt-icon-only-btn {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 30px;
                    height: 30px;
                    min-width: 30px;
                    padding: 0;
                    line-height: 1;
                }
                #am-wxt-keyword-item-picker-mask .am-wxt-btn.am-wxt-icon-only-btn svg {
                    width: 14px;
                    height: 14px;
                }
                #am-wxt-keyword-item-picker-mask .am-wxt-btn.primary {
                    background: linear-gradient(135deg, var(--am26-primary, rgba(69,84,229,1)), var(--am26-primary-strong, #1d3fcf));
                    color: rgba(255,255,255,0.96);
                    border-color: var(--am26-primary, rgba(69,84,229,1));
                    box-shadow: 0 8px 18px rgba(69,84,229,0.18);
                }
                #am-wxt-keyword-item-picker-mask .am-wxt-btn:disabled {
                    cursor: not-allowed;
                    opacity: 0.55;
                    background: var(--am26-surface, rgba(255,255,255,0.25));
                    color: rgba(80,90,116,0.62);
                    box-shadow: none;
                }
                #am-wxt-keyword-item-picker-mask .am-wxt-list {
                    padding: 6px;
                    overflow: auto;
                    flex: 1;
                    min-height: 0;
                    overscroll-behavior: contain;
                }
                #am-wxt-keyword-item-picker-mask #am-wxt-keyword-candidate-list {
                    flex: 1 1 auto;
                    min-height: 0;
                    height: auto;
                    max-height: none;
                }
                #am-wxt-keyword-item-picker-mask .am-wxt-item {
                    border: 1px solid var(--am26-border, rgba(255,255,255,0.4));
                    border-radius: 8px;
                    padding: 8px;
                    margin-bottom: 6px;
                    background: var(--am26-surface-strong, rgba(255,255,255,0.45));
                    box-shadow: inset 0 1px 0 rgba(255,255,255,0.28);
                    display: flex;
                    justify-content: space-between;
                    gap: 8px;
                    align-items: center;
                }
                #am-wxt-keyword-item-picker-mask .am-wxt-item .name {
                    font-size: 12px;
                    line-height: 1.35;
                    color: var(--am26-text, #1b2438);
                }
                #am-wxt-keyword-item-picker-mask .am-wxt-item .meta {
                    font-size: 11px;
                    color: var(--am26-text-soft, #505a74);
                    margin-top: 2px;
                }
                #am-wxt-keyword-item-picker-mask .am-wxt-item .actions {
                    display: flex;
                    gap: 4px;
                    flex-shrink: 0;
                }
                #am-wxt-keyword-modal .am-wxt-remove-icon-btn,
                #am-wxt-keyword-item-picker-mask .am-wxt-remove-icon-btn,
                #am-wxt-scene-popup-mask .am-wxt-remove-icon-btn {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 24px;
                    height: 24px;
                    min-width: 24px;
                    padding: 0;
                    border: 1px solid var(--am26-border, rgba(255,255,255,0.4));
                    border-radius: 999px;
                    background: var(--am26-surface, rgba(255,255,255,0.25));
                    color: var(--am26-text-soft, #505a74);
                    line-height: 1;
                    cursor: pointer;
                    box-shadow: inset 0 1px 0 rgba(255,255,255,0.24);
                    transition: background .16s ease, border-color .16s ease, color .16s ease, box-shadow .16s ease;
                }
                #am-wxt-keyword-modal .am-wxt-remove-icon-btn svg,
                #am-wxt-keyword-item-picker-mask .am-wxt-remove-icon-btn svg,
                #am-wxt-scene-popup-mask .am-wxt-remove-icon-btn svg {
                    width: 12px;
                    height: 12px;
                    pointer-events: none;
                }
                #am-wxt-keyword-modal .am-wxt-remove-icon-btn:hover,
                #am-wxt-keyword-item-picker-mask .am-wxt-remove-icon-btn:hover,
                #am-wxt-scene-popup-mask .am-wxt-remove-icon-btn:hover {
                    background: rgba(234,79,79,0.1);
                    border-color: rgba(234,79,79,0.28);
                    color: var(--am26-danger, #ea4f4f);
                }
                #am-wxt-keyword-modal .am-wxt-remove-icon-btn:focus-visible,
                #am-wxt-keyword-item-picker-mask .am-wxt-remove-icon-btn:focus-visible,
                #am-wxt-scene-popup-mask .am-wxt-remove-icon-btn:focus-visible {
                    outline: none;
                    border-color: rgba(37,99,235,0.45);
                    box-shadow: 0 0 0 3px rgba(37,99,235,0.18), inset 0 1px 0 rgba(255,255,255,0.24);
                }
                #am-wxt-keyword-modal .am-wxt-remove-icon-btn:disabled,
                #am-wxt-keyword-item-picker-mask .am-wxt-remove-icon-btn:disabled,
                #am-wxt-scene-popup-mask .am-wxt-remove-icon-btn:disabled {
                    cursor: not-allowed;
                    color: rgba(80,90,116,0.42);
                    background: var(--am26-surface, rgba(255,255,255,0.25));
                    border-color: var(--am26-border, rgba(255,255,255,0.4));
                }
                #am-wxt-keyword-item-picker-mask .am-wxt-keyword-item-picker-foot {
                    padding: 0 14px 14px;
                    display: flex;
                    justify-content: flex-end;
                    gap: 8px;
                    background: var(--am26-surface, rgba(255,255,255,0.25));
                }
                #am-wxt-scene-popup-mask {
                    position: fixed;
                    inset: 0;
                    z-index: 2147483500;
                    background: rgba(15, 23, 42, 0.52);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 16px;
                }
                #am-wxt-scene-popup-mask.am-wxt-scene-popup-mask-batch-number {
                    background: linear-gradient(135deg, rgba(255, 255, 255, 0.78), rgba(255, 255, 255, 0.48));
                    backdrop-filter: blur(8px) saturate(1.15);
                    -webkit-backdrop-filter: blur(8px) saturate(1.15);
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-popup-dialog {
                    width: min(720px, 96vw);
                    max-height: 86vh;
                    overflow: auto;
                    background: #fff;
                    border-radius: 12px;
                    border: 1px solid rgba(148,163,184,0.32);
                    box-shadow: 0 16px 48px rgba(15, 23, 42, 0.26);
                    padding: 12px;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-popup-head {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 8px;
                    font-size: 14px;
                    color: #1f2937;
                    font-weight: 600;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-popup-body {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-popup-foot {
                    display: flex;
                    justify-content: flex-end;
                    gap: 8px;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-popup-tips {
                    font-size: 12px;
                    color: #64748b;
                    line-height: 1.5;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-popup-label {
                    font-size: 12px;
                    color: #334155;
                    font-weight: 600;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-popup-actions {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-crowd-layout {
                    display: grid;
                    grid-template-columns: minmax(0, 1fr) minmax(240px, 280px);
                    gap: 12px;
                    min-height: min(500px, 62vh);
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-crowd-pane {
                    border: 1px solid rgba(148,163,184,0.28);
                    border-radius: 10px;
                    background: #fff;
                    min-height: 0;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-crowd-tabs {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 10px 10px 8px;
                    border-bottom: 1px solid rgba(148,163,184,0.18);
                    overflow: auto;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-crowd-tab {
                    border: 1px solid rgba(148,163,184,0.36);
                    background: #fff;
                    color: #475569;
                    border-radius: 14px;
                    padding: 4px 10px;
                    font-size: 12px;
                    line-height: 1.3;
                    white-space: nowrap;
                    cursor: pointer;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-crowd-tab.active {
                    border-color: rgba(79,104,255,0.4);
                    background: rgba(79,104,255,0.12);
                    color: #3447cf;
                    font-weight: 600;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-crowd-pane.is-left .am-wxt-scene-popup-actions {
                    padding: 8px 10px;
                    border-bottom: 1px solid rgba(148,163,184,0.18);
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-crowd-quick-filters {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 8px 10px;
                    border-bottom: 1px solid rgba(148,163,184,0.18);
                    overflow: auto;
                    background: #fff;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-crowd-quick-filter {
                    border: 1px solid rgba(148,163,184,0.34);
                    border-radius: 14px;
                    background: #fff;
                    color: #64748b;
                    font-size: 11px;
                    line-height: 1.2;
                    white-space: nowrap;
                    padding: 4px 9px;
                    cursor: pointer;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-crowd-quick-filter.active {
                    border-color: rgba(79,104,255,0.38);
                    background: rgba(79,104,255,0.11);
                    color: #3344c8;
                    font-weight: 600;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-crowd-table-head {
                    display: grid;
                    grid-template-columns: minmax(0, 1fr) 96px 136px 96px 72px;
                    gap: 8px;
                    align-items: center;
                    padding: 8px 10px;
                    border-bottom: 1px solid rgba(148,163,184,0.18);
                    background: #f8fafc;
                    color: #475569;
                    font-size: 12px;
                    font-weight: 600;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-crowd-candidate-list,
                #am-wxt-scene-popup-mask .am-wxt-scene-crowd-selected-list {
                    overflow: auto;
                    min-height: 0;
                    flex: 1;
                    padding: 8px 10px;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-crowd-candidate-row {
                    display: grid;
                    grid-template-columns: minmax(0, 1fr) 96px 136px 96px 72px;
                    gap: 8px;
                    align-items: center;
                    border: 1px solid rgba(148,163,184,0.24);
                    border-radius: 8px;
                    padding: 8px;
                    background: #fff;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-crowd-candidate-scale {
                    font-size: 12px;
                    color: #334155;
                    text-align: right;
                    font-variant-numeric: tabular-nums;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-crowd-candidate-reason {
                    display: flex;
                    align-items: center;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-crowd-candidate-reason .tag {
                    display: inline-flex;
                    align-items: center;
                    max-width: 100%;
                    border-radius: 999px;
                    padding: 2px 8px;
                    font-size: 11px;
                    line-height: 1.25;
                    color: #3344c8;
                    background: rgba(79,104,255,0.14);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-crowd-candidate-name .name,
                #am-wxt-scene-popup-mask .am-wxt-scene-crowd-selected-name .name {
                    font-size: 12px;
                    line-height: 1.35;
                    color: #1f2937;
                    font-weight: 600;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-crowd-candidate-name .meta,
                #am-wxt-scene-popup-mask .am-wxt-scene-crowd-selected-name .meta {
                    margin-top: 2px;
                    font-size: 11px;
                    line-height: 1.35;
                    color: #64748b;
                    word-break: break-all;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-crowd-candidate-bid {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-crowd-candidate-bid input {
                    width: 72px;
                    height: 28px;
                    border: 1px solid rgba(148,163,184,0.42);
                    border-radius: 7px;
                    padding: 0 8px;
                    background: #fff;
                    color: #1f2937;
                    font-size: 12px;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-crowd-candidate-bid span {
                    font-size: 12px;
                    color: #64748b;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-crowd-selected-head {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 8px;
                    padding: 10px;
                    border-bottom: 1px solid rgba(148,163,184,0.18);
                    background: #f8fafc;
                    color: #334155;
                    font-size: 12px;
                    font-weight: 600;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-crowd-selected-actions {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-crowd-selected-row {
                    display: grid;
                    grid-template-columns: minmax(0, 1fr) 86px 58px;
                    align-items: center;
                    gap: 8px;
                    border: 1px solid rgba(148,163,184,0.24);
                    border-radius: 8px;
                    padding: 8px;
                    background: #fff;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-crowd-selected-bid {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    justify-content: flex-end;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-crowd-selected-bid input {
                    width: 56px;
                    height: 28px;
                    border: 1px solid rgba(148,163,184,0.42);
                    border-radius: 7px;
                    padding: 0 6px;
                    background: #fff;
                    color: #1f2937;
                    font-size: 12px;
                    text-align: right;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-crowd-selected-bid span {
                    font-size: 12px;
                    color: #64748b;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-crowd-empty {
                    border: 1px dashed rgba(148,163,184,0.28);
                    border-radius: 8px;
                    padding: 12px;
                    color: #64748b;
                    font-size: 12px;
                    line-height: 1.45;
                    text-align: center;
                    background: #f8fafc;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-crowd-json.hidden {
                    display: none;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-crowd-json {
                    border: 1px solid rgba(148,163,184,0.26);
                    border-radius: 10px;
                    background: #f8fafc;
                    padding: 10px;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-crowd-add-mask.hidden {
                    display: none;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-crowd-add-mask {
                    position: absolute;
                    inset: 0;
                    background: rgba(15, 23, 42, 0.38);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 16px;
                    z-index: 3;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-crowd-add-dialog {
                    width: min(1260px, 96vw);
                    max-height: 86vh;
                    background: #fff;
                    border: 1px solid rgba(148,163,184,0.28);
                    border-radius: 12px;
                    box-shadow: 0 18px 36px rgba(15, 23, 42, 0.28);
                    display: flex;
                    flex-direction: column;
                    min-height: 0;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-crowd-add-head {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 8px;
                    padding: 10px 12px;
                    border-bottom: 1px solid rgba(148,163,184,0.2);
                    color: #1e293b;
                    font-size: 14px;
                    font-weight: 700;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-crowd-add-body {
                    padding: 10px 12px 12px;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    min-height: 0;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-crowd-native-title {
                    display: inline-flex;
                    align-items: center;
                    gap: 10px;
                    min-width: 0;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-crowd-native-help {
                    color: #3b82f6;
                    text-decoration: none;
                    font-size: 12px;
                    font-weight: 500;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-crowd-native-help:hover {
                    text-decoration: underline;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-crowd-native-layout {
                    min-height: min(560px, 66vh);
                    display: block;
                    min-width: 0;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-crowd-native-left,
                #am-wxt-scene-popup-mask .am-wxt-scene-crowd-native-right {
                    border: 1px solid rgba(148,163,184,0.24);
                    border-radius: 10px;
                    background: #fff;
                    min-height: 0;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-crowd-native-left.am-wxt-scene-trend-main {
                    position: static;
                    padding-bottom: 180px;
                    overflow: visible;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-crowd-native-right {
                    max-width: 280px;
                    justify-self: end;
                    width: 100%;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-crowd-native-tabs {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    flex-wrap: wrap;
                    padding: 10px;
                    border-bottom: 1px solid rgba(148,163,184,0.2);
                    background: #f8fafc;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-crowd-native-tab {
                    border: 1px solid rgba(148,163,184,0.34);
                    border-radius: 16px;
                    background: #fff;
                    color: #475569;
                    font-size: 12px;
                    line-height: 1.25;
                    padding: 5px 10px;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    max-width: 100%;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-crowd-native-tab i {
                    font-style: normal;
                    font-size: 11px;
                    color: #6a76ea;
                    background: rgba(106,118,234,0.12);
                    border-radius: 999px;
                    padding: 1px 7px;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-crowd-native-tab.active {
                    border-color: rgba(79,104,255,0.45);
                    color: #3344c8;
                    background: rgba(79,104,255,0.1);
                    font-weight: 600;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-crowd-native-subtabs {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 10px 8px;
                    border-bottom: 1px solid rgba(148,163,184,0.2);
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-crowd-native-subtabs.hidden {
                    display: none;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-crowd-native-subtab {
                    border: 1px solid rgba(148,163,184,0.34);
                    border-radius: 8px;
                    background: #fff;
                    color: #475569;
                    font-size: 12px;
                    line-height: 1.25;
                    padding: 5px 10px;
                    cursor: pointer;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-crowd-native-subtab.active {
                    border-color: rgba(79,104,255,0.4);
                    background: rgba(79,104,255,0.12);
                    color: #3344c8;
                    font-weight: 600;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-crowd-native-toolbar,
                #am-wxt-scene-popup-mask .am-wxt-scene-crowd-native-manual {
                    display: grid;
                    grid-template-columns: minmax(0, 1fr) auto auto;
                    gap: 8px;
                    padding: 8px 10px;
                    align-items: center;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-crowd-native-manual {
                    grid-template-columns: minmax(0, 1fr) auto;
                    border-top: 1px dashed rgba(148,163,184,0.26);
                    border-bottom: 1px solid rgba(148,163,184,0.2);
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-crowd-native-toolbar .am-wxt-input,
                #am-wxt-scene-popup-mask .am-wxt-scene-crowd-native-manual .am-wxt-input {
                    border: 1px solid rgba(148,163,184,0.38);
                    height: 30px;
                    min-height: 30px;
                    line-height: 28px;
                    padding-top: 0;
                    padding-bottom: 0;
                    box-shadow: none;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-crowd-native-toolbar .am-wxt-input:focus,
                #am-wxt-scene-popup-mask .am-wxt-scene-crowd-native-manual .am-wxt-input:focus {
                    border-color: rgba(148,163,184,0.42);
                    box-shadow: none;
                    outline: none;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-crowd-native-layout[data-scene-popup-trend-layout="1"] .am-wxt-scene-crowd-native-toolbar .am-wxt-input {
                    justify-self: start;
                    width: min(260px, 100%);
                    border: none;
                    border-radius: 7px;
                    padding: 3px 12px;
                    background: rgba(79,104,255,0.12);
                    color: #4f68ff;
                    font-size: 12px;
                    font-weight: 600;
                    height: 30px;
                    min-height: 30px;
                    line-height: 24px;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-crowd-native-layout[data-scene-popup-trend-layout="1"] .am-wxt-scene-crowd-native-toolbar .am-wxt-input::placeholder {
                    color: rgba(79,104,255,0.56);
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-crowd-native-layout[data-scene-popup-trend-layout="1"] .am-wxt-scene-crowd-native-toolbar .am-wxt-input:focus {
                    border: none;
                    box-shadow: none;
                    outline: none;
                    background: rgba(79,104,255,0.16);
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-trend-selected-dock {
                    position: fixed;
                    left: max(24px, calc((100vw - min(1320px, 98vw)) / 2 + 38px));
                    right: max(24px, calc((100vw - min(1320px, 98vw)) / 2 + 38px));
                    bottom: 24px;
                    z-index: 2147483502;
                    border: 1px solid rgba(148,163,184,0.26);
                    border-radius: 12px;
                    background: rgba(255,255,255,0.99);
                    box-shadow: 0 14px 34px rgba(15,23,42,0.14);
                    padding: 10px 12px;
                    pointer-events: auto;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-trend-selected-summary {
                    display: flex;
                    align-items: center;
                    gap: 14px;
                    font-size: 13px;
                    line-height: 1.35;
                    color: #334155;
                    font-weight: 600;
                    flex-wrap: wrap;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-trend-selected-summary b {
                    color: #3f4ddb;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-trend-selected-summary a {
                    margin-left: auto;
                    color: #3b82f6;
                    text-decoration: none;
                    font-size: 12px;
                    font-weight: 500;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-trend-selected-actions {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    margin-left: 0;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-trend-selected-actions .am-wxt-btn {
                    min-width: 72px;
                    padding: 6px 14px;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-trend-selected-chip-list {
                    margin-top: 8px;
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-trend-selected-chip {
                    border: none;
                    background: rgba(236,240,252,0.95);
                    color: #334155;
                    border-radius: 10px;
                    padding: 6px 10px;
                    font-size: 12px;
                    line-height: 1.25;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    cursor: pointer;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-trend-selected-chip i {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    font-style: normal;
                    color: #64748b;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-trend-selected-chip i svg {
                    width: 12px;
                    height: 12px;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-trend-selected-empty {
                    color: #94a3b8;
                    font-size: 12px;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-trend-rank-board {
                    display: grid;
                    grid-template-columns: repeat(3, minmax(0, 1fr));
                    gap: 10px;
                    padding: 10px;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-trend-rank-column {
                    border: 1px solid rgba(226,232,240,0.7);
                    border-radius: 12px;
                    background: linear-gradient(180deg, rgba(248,250,252,0.98), rgba(241,245,249,0.96));
                    min-height: 0;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-trend-rank-column[data-scene-popup-trend-rank-column="trend"] {
                    background: linear-gradient(180deg, rgba(252,242,247,0.98), rgba(247,238,245,0.95));
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-trend-rank-column[data-scene-popup-trend-rank-column="effect"] {
                    background: linear-gradient(180deg, rgba(252,245,240,0.98), rgba(248,241,236,0.95));
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-trend-rank-column[data-scene-popup-trend-rank-column="traffic"] {
                    background: linear-gradient(180deg, rgba(241,244,254,0.98), rgba(236,240,252,0.95));
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-trend-rank-title {
                    padding: 10px 12px 8px;
                    color: #1f2937;
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-trend-rank-title strong {
                    font-size: 16px;
                    line-height: 1.25;
                    font-weight: 700;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-trend-rank-title small {
                    font-size: 11px;
                    line-height: 1.35;
                    color: #64748b;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-trend-rank-content {
                    margin: 0 10px 10px;
                    border: 1px solid rgba(226,232,240,0.86);
                    border-radius: 12px;
                    background: rgba(255,255,255,0.96);
                    min-height: 0;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-crowd-native-candidate-head {
                    display: grid;
                    grid-template-columns: minmax(0, 1fr) 150px 112px 86px;
                    gap: 8px;
                    align-items: center;
                    padding: 8px 10px;
                    border-bottom: 1px solid rgba(148,163,184,0.2);
                    background: #f8fafc;
                    color: #475569;
                    font-size: 12px;
                    font-weight: 600;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-crowd-native-candidate-list,
                #am-wxt-scene-popup-mask .am-wxt-scene-crowd-native-selected-list {
                    flex: 1;
                    min-height: 0;
                    overflow: auto;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    padding: 10px;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-crowd-native-candidate-row {
                    display: grid;
                    grid-template-columns: minmax(0, 1fr) 150px 112px 86px;
                    gap: 8px;
                    align-items: center;
                    border: 1px solid rgba(148,163,184,0.24);
                    border-radius: 8px;
                    padding: 8px;
                    background: #fff;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-crowd-native-candidate-head.am-wxt-scene-trend-candidate-head,
                #am-wxt-scene-popup-mask .am-wxt-scene-crowd-native-candidate-row.am-wxt-scene-trend-candidate-row {
                    grid-template-columns: minmax(0, 1fr) 52px 64px 112px;
                    gap: 6px;
                    font-size: 11px;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-trend-candidate-head .am-wxt-scene-trend-check i {
                    font-style: normal;
                    font-size: 12px;
                    color: #334155;
                    font-weight: 600;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-trend-check {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    cursor: pointer;
                    user-select: none;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-trend-check input {
                    position: absolute;
                    opacity: 0;
                    pointer-events: none;
                    width: 0;
                    height: 0;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-trend-check-icon {
                    width: 16px;
                    height: 16px;
                    border: 1px solid rgba(148,163,184,0.62);
                    border-radius: 5px;
                    background: #fff;
                    position: relative;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    color: #fff;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-trend-check input:checked + .am-wxt-scene-trend-check-icon {
                    border-color: #4f68ff;
                    background: #4f68ff;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-trend-check-icon svg {
                    width: 12px;
                    height: 12px;
                    opacity: 0;
                    transition: opacity 0.16s ease;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-trend-check input:checked + .am-wxt-scene-trend-check-icon svg {
                    opacity: 1;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-trend-check input:disabled + .am-wxt-scene-trend-check-icon {
                    border-color: rgba(203,213,225,0.9);
                    background: rgba(241,245,249,0.9);
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-trend-candidate-name-cell {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    min-width: 0;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-trend-rank-list {
                    padding: 0;
                    gap: 0;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-trend-rank-column .am-wxt-scene-trend-candidate-row {
                    border: none;
                    border-radius: 0;
                    border-bottom: 1px solid rgba(226,232,240,0.82);
                    padding: 8px 10px;
                    background: transparent;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-trend-rank-column .am-wxt-scene-trend-candidate-row:last-child {
                    border-bottom: none;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-trend-rank-column .am-wxt-scene-crowd-native-candidate-name .name {
                    font-size: 11px;
                    line-height: 1.28;
                    font-weight: 600;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                    word-break: break-word;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-trend-rank-column .am-wxt-scene-crowd-native-candidate-name .meta {
                    margin-top: 1px;
                    font-size: 10px;
                    line-height: 1.2;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-trend-rank-column .am-wxt-scene-crowd-native-candidate-scale {
                    font-size: 11px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-trend-rank-tag {
                    justify-self: stretch;
                    max-width: none;
                    min-width: 0;
                    border-radius: 999px;
                    padding: 4px 8px;
                    background: rgba(255,237,237,0.92);
                    color: #ef4444;
                    font-size: 11px;
                    line-height: 1.2;
                    font-weight: 600;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    text-align: center;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-trend-rank-tag[data-rank-tag-tone="growth"] {
                    background: rgba(220,252,231,0.92);
                    color: #16a34a;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-trend-rank-tag[data-rank-tag-tone="up"] {
                    background: rgba(255,228,230,0.96);
                    color: #ff314a;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-trend-rank-tag[data-rank-tag-tone="industry"] {
                    background: rgba(238,242,255,0.92);
                    color: #4f46e5;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-trend-rank-tag[data-rank-tag-tone="taobao"] {
                    background: rgba(255,237,213,0.92);
                    color: #ff5a3d;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-trend-rank-tag[data-rank-tag-tone="hot"] {
                    background: rgba(255,228,230,0.96);
                    color: #ff314a;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-trend-rank-tag[data-rank-tag-tone="effect"] {
                    background: rgba(255,237,213,0.92);
                    color: #f97316;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-trend-rank-tag[data-rank-tag-tone="traffic"] {
                    background: rgba(238,242,255,0.92);
                    color: #4f46e5;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-trend-rank-column .am-wxt-btn {
                    min-width: 0;
                    padding: 4px 6px;
                    font-size: 11px;
                    border-radius: 999px;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-trend-association {
                    flex: 0 0 auto;
                    height: auto;
                    max-height: none;
                    min-height: 0;
                    margin: 0 10px 10px;
                    border: 1px solid rgba(99,102,241,0.3);
                    border-radius: 14px;
                    background: linear-gradient(#fff,#fff) padding-box, linear-gradient(135deg, #42d9ff, #8b5cf6) border-box;
                    box-shadow: 0 8px 24px rgba(79,70,229,0.08);
                    overflow: visible;
                    display: flex;
                    flex-direction: column;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-trend-association.has-item-panel {
                    flex-basis: auto;
                    min-height: 0;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-trend-main:has(.am-wxt-scene-trend-association.has-item-panel) .am-wxt-scene-trend-rank-board {
                    min-height: 0;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-trend-association-search {
                    display: grid;
                    grid-template-columns: minmax(0, 1fr) auto;
                    gap: 10px;
                    padding: 10px 12px 8px;
                    align-items: center;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-trend-association-query {
                    display: flex;
                    align-items: center;
                    gap: 7px;
                    min-width: 0;
                    color: #334155;
                    font-size: 13px;
                    line-height: 1.35;
                    flex-wrap: wrap;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-trend-association-type {
                    border: none;
                    border-radius: 7px;
                    padding: 5px 10px;
                    background: rgba(241,245,249,0.95);
                    color: #94a3b8;
                    font-size: 12px;
                    line-height: 1.2;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    min-height: 30px;
                    box-sizing: border-box;
                }
                #am-wxt-scene-popup-mask label.am-wxt-scene-trend-association-type {
                    padding: 3px 8px;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-trend-association-type.active {
                    background: rgba(79,104,255,0.12);
                    color: #4f68ff;
                    font-weight: 600;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-trend-association-type input {
                    width: 0;
                    height: 24px;
                    min-width: 0;
                    border: none;
                    background: transparent;
                    color: #334155;
                    outline: none;
                    font-size: 12px;
                    padding: 0;
                    opacity: 0;
                    transition: width 0.16s ease, opacity 0.16s ease;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-trend-association-type.active input {
                    width: 150px;
                    opacity: 1;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-trend-association-query em[data-scene-popup-trend-association-picked] {
                    color: #4f68ff;
                    font-style: normal;
                    font-size: 12px;
                    max-width: 320px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-trend-association-actions {
                    display: grid;
                    grid-template-columns: auto 32px;
                    gap: 8px;
                    align-items: center;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-trend-association-arrow {
                    width: 32px;
                    height: 32px;
                    border: none;
                    border-radius: 999px;
                    background: linear-gradient(135deg, #4f68ff, #7c3aed);
                    color: #fff;
                    font-size: 16px;
                    line-height: 32px;
                    cursor: pointer;
                    box-shadow: 0 4px 12px rgba(79,70,229,0.28);
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-trend-association-item-panel {
                    margin: 0 12px 10px;
                    border: 1px solid rgba(226,232,240,0.95);
                    border-radius: 12px;
                    background: #fff;
                    box-shadow: 0 12px 28px rgba(15,23,42,0.08);
                    overflow: hidden;
                    flex: 0 0 260px;
                    min-height: 220px;
                    display: flex;
                    flex-direction: column;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-trend-association-item-panel.hidden {
                    display: none;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-trend-association-item-head {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 12px;
                    padding: 10px 12px;
                    border-bottom: 1px solid rgba(226,232,240,0.95);
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-trend-association-item-head strong {
                    color: #334155;
                    font-size: 13px;
                    line-height: 1.3;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-trend-association-item-head label {
                    width: 240px;
                    height: 34px;
                    border-radius: 10px;
                    background: rgba(241,245,249,0.95);
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 0 12px;
                    box-sizing: border-box;
                    color: #64748b;
                    font-size: 12px;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-trend-association-item-head input {
                    flex: 1;
                    min-width: 0;
                    border: none;
                    outline: none;
                    background: transparent;
                    color: #334155;
                    font-size: 12px;
                    height: 100%;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-trend-association-item-list {
                    min-height: 0;
                    overflow: auto;
                    display: flex;
                    flex-direction: column;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-trend-association-item-row {
                    display: grid;
                    grid-template-columns: 28px 46px minmax(0, 1fr);
                    align-items: center;
                    gap: 12px;
                    padding: 9px 12px;
                    border-bottom: 1px solid rgba(226,232,240,0.82);
                    color: #334155;
                    cursor: pointer;
                    min-height: 70px;
                    box-sizing: border-box;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-trend-association-item-row.selected {
                    background: rgba(79,104,255,0.06);
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-trend-association-item-radio input {
                    width: 14px;
                    height: 14px;
                    margin: 0;
                    accent-color: #4f68ff;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-trend-association-item-thumb {
                    width: 42px;
                    height: 42px;
                    border-radius: 6px;
                    background: #f1f5f9;
                    overflow: hidden;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #94a3b8;
                    font-size: 12px;
                    font-weight: 600;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-trend-association-item-thumb img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    display: block;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-trend-association-item-thumb i {
                    font-style: normal;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-trend-association-item-info {
                    min-width: 0;
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-trend-association-item-info strong {
                    min-width: 0;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    font-size: 13px;
                    line-height: 1.35;
                    color: #334155;
                    font-weight: 600;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-trend-association-item-info em {
                    color: #94a3b8;
                    font-size: 12px;
                    line-height: 1.2;
                    font-style: normal;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-trend-association-quick {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 0 12px 8px;
                    color: #94a3b8;
                    font-size: 12px;
                    min-width: 0;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-trend-association-quick > div {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    min-width: 0;
                    overflow: hidden;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-trend-association-quick button {
                    border: none;
                    background: transparent;
                    color: #475569;
                    font-size: 12px;
                    white-space: nowrap;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                    padding: 0;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-trend-association-quick button span {
                    width: 13px;
                    height: 13px;
                    border-radius: 999px;
                    border: 1px solid rgba(203,213,225,0.95);
                    background: #fff;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-trend-association-quick button.active span {
                    border-color: #4f68ff;
                    box-shadow: inset 0 0 0 4px #4f68ff;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-trend-association-quick em {
                    color: #94a3b8;
                    font-style: normal;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-trend-association-status {
                    padding: 0 12px 7px;
                    color: #64748b;
                    font-size: 12px;
                    line-height: 1.25;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-trend-association-table {
                    border-top: 1px solid rgba(226,232,240,0.9);
                    overflow: visible;
                    min-height: 0;
                    flex: 0 0 auto;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-trend-association-head,
                #am-wxt-scene-popup-mask .am-wxt-scene-trend-association-row {
                    display: grid;
                    grid-template-columns: minmax(150px, 1.25fr) 98px 74px 74px 74px 92px 74px 74px 56px;
                    gap: 8px;
                    align-items: center;
                    min-width: 860px;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-trend-association-head {
                    position: sticky;
                    top: 0;
                    z-index: 1;
                    padding: 9px 12px;
                    background: #fff;
                    border-bottom: 1px solid rgba(226,232,240,0.9);
                    color: #334155;
                    font-size: 12px;
                    font-weight: 700;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-trend-association-list {
                    display: flex;
                    flex-direction: column;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-trend-association-row {
                    padding: 8px 12px;
                    border-bottom: 1px solid rgba(226,232,240,0.82);
                    color: #475569;
                    font-size: 12px;
                    line-height: 1.3;
                    font-variant-numeric: tabular-nums;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-trend-association-row.selected {
                    background: rgba(79,104,255,0.06);
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-trend-association-theme {
                    display: flex;
                    align-items: center;
                    gap: 7px;
                    min-width: 0;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-trend-association-theme i {
                    flex: 0 0 auto;
                    border-radius: 999px;
                    background: rgba(241,245,249,0.95);
                    color: #94a3b8;
                    font-style: normal;
                    padding: 2px 7px;
                    font-size: 11px;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-trend-association-theme span {
                    min-width: 0;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    color: #334155;
                    font-weight: 600;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-trend-association-op {
                    border: none;
                    background: transparent;
                    color: #4f68ff;
                    font-size: 12px;
                    cursor: pointer;
                    padding: 0;
                    white-space: nowrap;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-trend-association-op:disabled {
                    color: #cbd5e1;
                    cursor: not-allowed;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-trend-association-op.am-wxt-remove-icon-btn {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 24px;
                    height: 24px;
                    min-width: 24px;
                    padding: 0;
                    border: 1px solid var(--am26-border, rgba(255,255,255,0.4));
                    border-radius: 999px;
                    background: var(--am26-surface, rgba(255,255,255,0.25));
                    color: var(--am26-text-soft, #505a74);
                    box-shadow: inset 0 1px 0 rgba(255,255,255,0.24);
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-crowd-native-candidate-name .name,
                #am-wxt-scene-popup-mask .am-wxt-scene-crowd-native-selected-name {
                    font-size: 12px;
                    line-height: 1.35;
                    color: #1f2937;
                    font-weight: 600;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-crowd-native-candidate-name .meta {
                    margin-top: 2px;
                    font-size: 11px;
                    line-height: 1.3;
                    color: #64748b;
                    word-break: break-all;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-crowd-native-candidate-reason {
                    font-size: 12px;
                    line-height: 1.35;
                    color: #334155;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-crowd-native-candidate-scale {
                    font-size: 12px;
                    color: #334155;
                    text-align: right;
                    font-variant-numeric: tabular-nums;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-crowd-native-selected-head {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 8px;
                    padding: 10px;
                    border-bottom: 1px solid rgba(148,163,184,0.2);
                    background: #f8fafc;
                    color: #334155;
                    font-size: 12px;
                    font-weight: 600;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-crowd-native-selected-head a,
                #am-wxt-scene-popup-mask .am-wxt-scene-crowd-native-selected-actions a {
                    color: #3b82f6;
                    text-decoration: none;
                    font-size: 12px;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-crowd-native-selected-head a:hover,
                #am-wxt-scene-popup-mask .am-wxt-scene-crowd-native-selected-actions a:hover {
                    text-decoration: underline;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-crowd-native-selected-table-head {
                    display: grid;
                    grid-template-columns: minmax(0, 1fr) 68px 48px;
                    gap: 8px;
                    align-items: center;
                    padding: 8px 10px;
                    border-bottom: 1px solid rgba(148,163,184,0.2);
                    color: #64748b;
                    font-size: 12px;
                    font-weight: 600;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-crowd-native-selected-row {
                    display: grid;
                    grid-template-columns: minmax(0, 1fr) 68px 48px;
                    gap: 8px;
                    align-items: center;
                    border: 1px solid rgba(148,163,184,0.24);
                    border-radius: 8px;
                    padding: 8px;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-crowd-native-selected-row .am-wxt-btn {
                    min-width: 0;
                    padding: 4px 6px;
                    font-size: 11px;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-crowd-native-selected-source {
                    font-size: 11px;
                    color: #64748b;
                    line-height: 1.25;
                    text-align: center;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-crowd-native-foot {
                    justify-content: flex-end;
                    border-top: 1px solid rgba(148,163,184,0.2);
                    padding-top: 10px;
                }
                #am-wxt-keyword-modal .am-wxt-scene-budget-guard-main {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    flex-wrap: wrap;
                }
                #am-wxt-keyword-modal .am-wxt-scene-budget-guard-text {
                    font-size: 12px;
                    color: #64748b;
                    line-height: 1.45;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-popup-dialog.am-wxt-scene-popup-dialog-filter {
                    width: min(1320px, 98vw);
                    max-height: 90vh;
                    border-radius: 14px;
                    padding: 14px;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-popup-dialog.am-wxt-scene-popup-dialog-filter .am-wxt-scene-popup-head {
                    font-size: 16px;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-popup-dialog.am-wxt-scene-popup-dialog-filter .am-wxt-scene-popup-body {
                    gap: 10px;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-popup-dialog.am-wxt-scene-popup-dialog-trend-theme {
                    position: relative;
                    height: auto;
                    max-height: calc(100vh - 16px);
                    overflow: auto;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-popup-dialog.am-wxt-scene-popup-dialog-trend-theme .am-wxt-scene-popup-body {
                    flex: 0 0 auto;
                    min-height: 0;
                    overflow: visible;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-crowd-native-layout[data-scene-popup-trend-layout="1"] {
                    flex: 0 0 auto;
                    height: auto;
                    min-height: 0;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-crowd-native-layout[data-scene-popup-trend-layout="1"] .am-wxt-scene-trend-main {
                    height: auto;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-filter-layout {
                    min-height: min(560px, 68vh);
                    display: grid;
                    grid-template-columns: minmax(0, 1fr) minmax(220px, 280px);
                    gap: 12px;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-filter-left,
                #am-wxt-scene-popup-mask .am-wxt-scene-filter-right {
                    border: 1px solid rgba(148,163,184,0.28);
                    border-radius: 10px;
                    background: #fff;
                    min-height: 0;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-filter-tabs {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 10px 8px;
                    border-bottom: 1px solid rgba(148,163,184,0.2);
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-filter-tab {
                    border: 1px solid rgba(148,163,184,0.34);
                    background: #fff;
                    color: #475569;
                    border-radius: 14px;
                    padding: 5px 11px;
                    font-size: 12px;
                    line-height: 1.25;
                    cursor: pointer;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-filter-tab.active {
                    border-color: rgba(79,104,255,0.4);
                    background: rgba(79,104,255,0.12);
                    color: #3344c8;
                    font-weight: 600;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-filter-panel {
                    display: none;
                    flex-direction: column;
                    gap: 10px;
                    padding: 10px;
                    min-height: 0;
                    overflow: auto;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-filter-panel.active {
                    display: flex;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-filter-group {
                    border: 1px solid rgba(148,163,184,0.22);
                    border-radius: 8px;
                    background: #f8fafc;
                    padding: 8px;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-filter-group-title {
                    font-size: 12px;
                    color: #334155;
                    font-weight: 600;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-filter-option-grid {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    flex-wrap: wrap;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-filter-option-chip {
                    border: 1px solid rgba(148,163,184,0.34);
                    border-radius: 999px;
                    background: #fff;
                    color: #475569;
                    font-size: 12px;
                    line-height: 1.2;
                    padding: 5px 10px;
                    cursor: pointer;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-filter-option-chip.active {
                    border-color: rgba(79,104,255,0.42);
                    background: rgba(79,104,255,0.12);
                    color: #3344c8;
                    font-weight: 600;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-filter-option-check {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 2px 6px;
                    border: 1px solid transparent;
                    border-radius: 6px;
                    font-size: 12px;
                    color: #334155;
                    line-height: 1.2;
                    cursor: pointer;
                    user-select: none;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-filter-option-check.active {
                    border-color: rgba(79,104,255,0.28);
                    background: rgba(79,104,255,0.1);
                    color: #3344c8;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-filter-option-check input[type="checkbox"] {
                    margin: 0;
                    width: 14px;
                    height: 14px;
                    accent-color: #4f68ff;
                    cursor: pointer;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-filter-tools {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    flex-wrap: wrap;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-filter-custom-input {
                    width: 100%;
                    min-height: 84px;
                    border: 1px solid rgba(148,163,184,0.34);
                    border-radius: 8px;
                    padding: 8px;
                    background: #fff;
                    font-size: 12px;
                    line-height: 1.45;
                    resize: vertical;
                }
                #am-wxt-scene-popup-mask input.am-wxt-scene-filter-custom-input[type="text"] {
                    min-height: 32px;
                    height: 32px;
                    padding: 0 8px;
                    resize: none;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-filter-selected-head {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 8px;
                    padding: 10px;
                    border-bottom: 1px solid var(--am26-border, rgba(255,255,255,0.4));
                    background: var(--am26-surface, rgba(255,255,255,0.25));
                    color: var(--am26-text, #1b2438);
                    font-size: 12px;
                    font-weight: 600;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-filter-selected-list {
                    flex: 1;
                    min-height: 0;
                    overflow: auto;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    padding: 10px;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-filter-selected-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 8px;
                    border: 1px solid var(--am26-border, rgba(255,255,255,0.4));
                    border-radius: 8px;
                    padding: 8px;
                    background: var(--am26-surface-strong, rgba(255,255,255,0.45));
                    font-size: 12px;
                    color: var(--am26-text, #1b2438);
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-filter-selected-row > span {
                    min-width: 0;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-filter-remove {
                    flex: 0 0 auto;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 24px;
                    height: 24px;
                    padding: 0;
                    border: 1px solid rgba(148,163,184,0.24);
                    border-radius: 999px;
                    background: var(--am26-surface, rgba(255,255,255,0.25));
                    color: var(--am26-text-soft, #505a74);
                    cursor: pointer;
                    line-height: 1;
                    transition: color .18s ease, background .18s ease, border-color .18s ease, box-shadow .18s ease, transform .18s ease;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-filter-remove svg {
                    width: 12px;
                    height: 12px;
                    flex: 0 0 auto;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-filter-remove:hover {
                    color: var(--am26-danger, #ea4f4f);
                    border-color: rgba(234,79,79,0.22);
                    background: rgba(234,79,79,0.1);
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-filter-remove:focus-visible {
                    outline: none;
                    border-color: rgba(37,99,235,0.42);
                    box-shadow: 0 0 0 3px rgba(37,99,235,0.22);
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-filter-selected-empty {
                    border: 1px dashed var(--am26-border, rgba(255,255,255,0.4));
                    border-radius: 8px;
                    padding: 12px;
                    text-align: center;
                    color: var(--am26-text-soft, #505a74);
                    font-size: 12px;
                    line-height: 1.45;
                    background: var(--am26-surface, rgba(255,255,255,0.25));
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-filter-footnote {
                    margin-top: 6px;
                    font-size: 12px;
                    color: var(--am26-text-soft, #505a74);
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-popup-dialog.am-wxt-scene-popup-dialog-budget-guard {
                    width: min(760px, 96vw);
                    max-height: 90vh;
                    border-radius: 14px;
                    padding: 14px;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-popup-dialog.am-wxt-scene-popup-dialog-budget-guard .am-wxt-scene-popup-head {
                    font-size: 16px;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-budget-guard-form {
                    border: 1px solid rgba(148,163,184,0.24);
                    border-radius: 10px;
                    background: #f8fafc;
                    padding: 12px;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-budget-guard-section {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-budget-guard-section-title {
                    font-size: 13px;
                    color: #334155;
                    font-weight: 700;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-budget-guard-grid {
                    display: grid;
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                    gap: 8px;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-budget-guard-field {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 12px;
                    color: #334155;
                    flex-wrap: wrap;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-budget-guard-field input[type=\"number\"] {
                    width: 82px;
                    height: 30px;
                    border: 1px solid rgba(148,163,184,0.36);
                    border-radius: 8px;
                    padding: 0 8px;
                    background: #fff;
                    color: #1f2937;
                    font-size: 12px;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-budget-guard-toggle {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 12px;
                    color: #334155;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-budget-guard-toggle-label {
                    margin-right: auto;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-budget-guard-toggle input[type="checkbox"] {
                    margin: 0;
                    width: 34px;
                    height: 20px;
                    border: none;
                    border-radius: 999px;
                    background: #cbd5e1;
                    appearance: none;
                    cursor: pointer;
                    position: relative;
                    transition: background 0.15s ease;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-budget-guard-toggle input[type="checkbox"]::after {
                    content: '';
                    position: absolute;
                    left: 2px;
                    top: 2px;
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    background: #fff;
                    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.2);
                    transition: transform 0.15s ease;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-budget-guard-toggle input[type="checkbox"]:checked {
                    background: #4f68ff;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-budget-guard-toggle input[type="checkbox"]:checked::after {
                    transform: translateX(14px);
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-budget-guard-switch-text {
                    min-width: 16px;
                    text-align: center;
                    font-size: 12px;
                    color: #334155;
                    font-weight: 600;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-budget-guard-note {
                    font-size: 12px;
                    color: #64748b;
                    line-height: 1.45;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-popup-dialog.am-wxt-scene-popup-dialog-batch-number {
                    width: min(560px, calc(100vw - 32px));
                    background: var(--am26-panel-strong, linear-gradient(135deg, rgba(255,255,255,0.6), rgba(255,255,255,0.2)));
                    border: 1px solid var(--am26-border-strong, rgba(255,255,255,0.6));
                    border-radius: 18px;
                    box-shadow: var(--am26-shadow, 0 8px 32px rgba(31,38,135,0.15));
                    backdrop-filter: blur(18px) saturate(1.35);
                }
                #am-wxt-scene-popup-mask .am-wxt-strategy-batch-number-form {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }
                #am-wxt-scene-popup-mask .am-wxt-strategy-batch-number-grid {
                    display: grid;
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                    gap: 10px;
                }
                #am-wxt-scene-popup-mask .am-wxt-strategy-batch-number-field {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                    font-size: 12px;
                    color: var(--am26-text, #1b2438);
                    font-weight: 600;
                }
                #am-wxt-scene-popup-mask .am-wxt-strategy-batch-number-field input[type="number"] {
                    width: 100%;
                    min-width: 0;
                    height: 34px;
                    border: 1px solid var(--am26-border, rgba(255,255,255,0.4));
                    border-radius: 8px;
                    padding: 0 10px;
                    background: rgba(255,255,255,0.72);
                    color: var(--am26-text, #1b2438);
                    font-size: 13px;
                }
                #am-wxt-scene-popup-mask .am-wxt-strategy-batch-number-field input[type="number"]:focus-visible {
                    outline: 2px solid rgba(37,99,235,0.45);
                    outline-offset: 2px;
                    box-shadow: 0 0 0 4px rgba(69,84,229,0.12);
                }
                #am-wxt-scene-popup-mask .am-wxt-strategy-batch-number-field input[type="number"]:disabled {
                    background: var(--am26-surface, rgba(255,255,255,0.25));
                    color: rgba(80,90,116,0.62);
                    cursor: not-allowed;
                }
                #am-wxt-scene-popup-mask .am-wxt-strategy-batch-number-note {
                    font-size: 12px;
                    color: var(--am26-text-soft, #505a74);
                    line-height: 1.45;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-popup-error {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    border: 1px solid rgba(234,79,79,0.26);
                    border-radius: 10px;
                    padding: 8px 10px;
                    background: rgba(234,79,79,0.10);
                    color: var(--am26-danger, #ea4f4f);
                    font-size: 12px;
                    line-height: 1.45;
                    font-weight: 600;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-popup-error[hidden] {
                    display: none !important;
                }
                #am-wxt-scene-popup-mask .am-wxt-btn {
                    border: 1px solid rgba(69,84,229,0.3);
                    border-radius: 8px;
                    padding: 6px 10px;
                    font-size: 12px;
                    line-height: 1;
                    background: #eef2ff;
                    color: #2e3ab8;
                    cursor: pointer;
                }
                #am-wxt-scene-popup-mask .am-wxt-btn.primary {
                    background: linear-gradient(135deg, #4554e5, #4f68ff);
                    color: #fff;
                    border-color: #4554e5;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-popup-dialog-batch-number .am-wxt-btn {
                    border-color: var(--am26-border, rgba(255,255,255,0.4));
                    background: var(--am26-surface-strong, rgba(255,255,255,0.45));
                    color: var(--am26-text, #1b2438);
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-popup-dialog-batch-number .am-wxt-btn.primary {
                    background: linear-gradient(135deg, var(--am26-primary, #4554e5), var(--am26-primary-strong, #1d3fcf));
                    color: #fff;
                    border-color: var(--am26-primary, #4554e5);
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-popup-dialog-batch-number .am-wxt-btn:focus-visible {
                    outline: 2px solid rgba(37,99,235,0.45);
                    outline-offset: 2px;
                    box-shadow: 0 0 0 4px rgba(69,84,229,0.12);
                }
                #am-wxt-scene-popup-mask .am-wxt-btn.danger {
                    background: #fee2e2;
                    color: #b91c1c;
                    border-color: rgba(185, 28, 28, 0.32);
                }
                #am-wxt-scene-popup-mask .am-wxt-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-popup-textarea {
                    width: 100%;
                    min-height: 120px;
                    border: 1px solid rgba(148,163,184,0.42);
                    border-radius: 8px;
                    padding: 8px;
                    font-family: Menlo, Consolas, monospace;
                    font-size: 12px;
                    line-height: 1.45;
                    resize: vertical;
                    background: #f8fafc;
                    color: #1f2937;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-popup-dialog.am-wxt-scene-popup-dialog-crowd {
                    width: min(1180px, 96vw);
                    max-height: 90vh;
                    border-radius: 14px;
                    padding: 14px;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-popup-dialog.am-wxt-scene-popup-dialog-crowd .am-wxt-scene-popup-body {
                    gap: 10px;
                    position: relative;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-popup-dialog.am-wxt-scene-popup-dialog-advanced {
                    width: min(1120px, 96vw);
                    max-height: 90vh;
                    padding: 0;
                    gap: 0;
                    overflow: hidden;
                    border-radius: 16px;
                    border-color: rgba(148,163,184,0.26);
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-popup-dialog.am-wxt-scene-popup-dialog-advanced .am-wxt-scene-popup-head {
                    padding: 14px 18px;
                    border-bottom: 1px solid rgba(148,163,184,0.2);
                    background: #fff;
                    font-size: 16px;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-popup-dialog.am-wxt-scene-popup-dialog-advanced .am-wxt-scene-popup-head [data-scene-popup-close] {
                    min-width: 32px;
                    width: 32px;
                    height: 32px;
                    padding: 0;
                    border-radius: 16px;
                    font-size: 18px;
                    line-height: 1;
                    color: #64748b;
                }
                #am-wxt-scene-popup-mask .am-wxt-icon-only-btn,
                #am-wxt-scene-popup-mask .am-wxt-scene-popup-head [data-scene-popup-close].am-wxt-icon-only-btn {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    min-width: 32px;
                    width: 32px;
                    height: 32px;
                    padding: 0;
                    line-height: 1;
                }
                #am-wxt-scene-popup-mask .am-wxt-icon-only-btn svg {
                    width: 16px;
                    height: 16px;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-popup-dialog.am-wxt-scene-popup-dialog-advanced .am-wxt-scene-popup-body {
                    padding: 18px;
                    gap: 0;
                    min-height: min(640px, 72vh);
                    overflow: hidden;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-popup-dialog.am-wxt-scene-popup-dialog-advanced .am-wxt-scene-popup-foot {
                    padding: 12px 18px;
                    border-top: 1px solid rgba(148,163,184,0.2);
                    background: #fff;
                    justify-content: flex-start;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-popup-dialog.am-wxt-scene-popup-dialog-quick-lift {
                    width: min(1248px, 96vw);
                    max-height: 94vh;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-popup-dialog.am-wxt-scene-popup-dialog-quick-lift .am-wxt-scene-popup-body {
                    padding: 16px 24px;
                    overflow: auto;
                    min-height: min(720px, 74vh);
                    background: #fff;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-popup-dialog.am-wxt-scene-popup-dialog-quick-lift .am-wxt-scene-popup-foot {
                    justify-content: flex-start;
                    padding-left: 24px;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-quick-lift-layout {
                    display: flex;
                    flex-direction: column;
                    gap: 18px;
                    color: #1f2937;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-quick-lift-section {
                    display: grid;
                    grid-template-columns: 72px minmax(0, 1fr);
                    gap: 8px;
                    align-items: flex-start;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-quick-lift-label {
                    color: #666;
                    font-size: 13px;
                    line-height: 32px;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-quick-lift-control {
                    min-width: 0;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-quick-lift-summary-row {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    min-height: 32px;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-quick-lift-summary {
                    color: #666;
                    font-size: 13px;
                    line-height: 20px;
                    white-space: nowrap;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-quick-lift-toggle {
                    border: 0;
                    background: transparent;
                    padding: 0;
                    color: #4554e5;
                    font-size: 13px;
                    line-height: 18px;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    gap: 3px;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-quick-lift-toggle svg {
                    width: 12px;
                    height: 12px;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-quick-lift-panel {
                    margin-top: 12px;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-quick-time-card {
                    border: 1px solid #e4e7f0;
                    border-radius: 6px;
                    padding: 12px;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-quick-time-row {
                    display: flex;
                    align-items: stretch;
                    gap: 12px;
                    min-width: 0;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-quick-time-label {
                    width: 104px;
                    min-width: 104px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 4px;
                    color: #fff;
                    background: #4554e5;
                    font-size: 12px;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-quick-time-hours {
                    flex: 1;
                    min-width: 0;
                    display: grid;
                    grid-template-columns: repeat(25, minmax(22px, 1fr));
                    border: 1px solid #e4e7f0;
                    border-radius: 4px;
                    overflow: hidden;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-quick-time-hour {
                    min-width: 0;
                    height: 36px;
                    border: 0;
                    border-right: 1px solid #e4e7f0;
                    background: #fff;
                    color: #667085;
                    font-size: 12px;
                    cursor: pointer;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-quick-time-hour:last-child {
                    border-right: 0;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-quick-time-hour.active {
                    background: rgba(69,84,229,0.12);
                    color: #4554e5;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-quick-time-hour.endpoint {
                    background: #4554e5;
                    color: #fff;
                    font-weight: 600;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-quick-time-hour.boundary:not(.endpoint) {
                    color: #4554e5;
                    font-weight: 600;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-quick-time-actions {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-top: 12px;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-quick-time-error {
                    color: #d9480f;
                    font-size: 12px;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-quick-lift-panel .am-wxt-scene-advanced-area-selector {
                    max-height: none;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-advanced-layout {
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    background: #f8fafc;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-advanced-tabs {
                    display: inline-flex;
                    gap: 10px;
                    padding: 14px 18px 10px;
                    border-bottom: 1px solid rgba(148,163,184,0.2);
                    background: #fff;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-advanced-tab {
                    border: 1px solid rgba(148,163,184,0.4);
                    border-radius: 16px;
                    background: #fff;
                    color: #475569;
                    font-size: 13px;
                    line-height: 1.2;
                    padding: 6px 14px;
                    cursor: pointer;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-advanced-tab.active {
                    border-color: rgba(79,104,255,0.45);
                    background: rgba(79,104,255,0.11);
                    color: #3344c8;
                    font-weight: 600;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-advanced-main {
                    flex: 1;
                    min-height: 0;
                    display: grid;
                    grid-template-columns: minmax(0, 1fr) 230px;
                    gap: 0;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-advanced-content {
                    min-height: 0;
                    padding: 14px 18px 18px;
                    overflow: auto;
                    background: #fff;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-advanced-panel {
                    display: none;
                    flex-direction: column;
                    gap: 10px;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-advanced-panel.active {
                    display: flex;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-advanced-tip {
                    font-size: 12px;
                    color: #64748b;
                    line-height: 1.45;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-advanced-toolbar {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    flex-wrap: wrap;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-advanced-tip-inline {
                    font-size: 12px;
                    color: #64748b;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-time-recommend-cards {
                    display: grid;
                    grid-template-columns: repeat(3, minmax(0, 1fr));
                    gap: 8px;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-time-recommend-card {
                    text-align: left;
                    border: 1px solid rgba(148,163,184,0.3);
                    border-radius: 10px;
                    background: #f8fafc;
                    padding: 10px 10px 9px;
                    cursor: pointer;
                    display: flex;
                    flex-direction: column;
                    gap: 5px;
                    color: #334155;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-time-recommend-card.active {
                    border-color: rgba(79,104,255,0.5);
                    background: rgba(79,104,255,0.08);
                    box-shadow: inset 0 0 0 1px rgba(79,104,255,0.18);
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-time-recommend-title {
                    font-size: 12px;
                    line-height: 1.35;
                    font-weight: 700;
                    color: #1f2937;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-time-recommend-desc {
                    font-size: 11px;
                    line-height: 1.35;
                    color: #64748b;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-time-recommend-tag {
                    display: inline-flex;
                    width: fit-content;
                    border-radius: 999px;
                    padding: 2px 8px;
                    background: rgba(79,104,255,0.16);
                    color: #3447cf;
                    font-size: 11px;
                    line-height: 1.3;
                    font-weight: 600;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-advanced-adzone-table {
                    border: 1px solid rgba(148,163,184,0.32);
                    border-radius: 10px;
                    overflow: hidden;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-advanced-adzone-head,
                #am-wxt-scene-popup-mask .am-wxt-scene-advanced-adzone-row {
                    display: grid;
                    grid-template-columns: minmax(0, 1fr) 160px;
                    align-items: center;
                    gap: 10px;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-advanced-adzone-head {
                    background: #f8fafc;
                    color: #475569;
                    font-size: 12px;
                    font-weight: 600;
                    padding: 10px 12px;
                    border-bottom: 1px solid rgba(148,163,184,0.22);
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-advanced-adzone-list {
                    display: flex;
                    flex-direction: column;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-advanced-adzone-row {
                    padding: 10px 12px;
                    border-bottom: 1px solid rgba(148,163,184,0.18);
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-advanced-adzone-row:last-child {
                    border-bottom: none;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-advanced-adzone-name {
                    font-size: 13px;
                    color: #1f2937;
                    font-weight: 600;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-advanced-adzone-desc {
                    margin-top: 3px;
                    font-size: 12px;
                    color: #64748b;
                    line-height: 1.35;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-advanced-adzone-actions {
                    display: inline-flex;
                    justify-content: flex-end;
                    gap: 6px;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-adzone-premium-shell {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-adzone-premium-batch {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    flex-wrap: wrap;
                    font-size: 12px;
                    color: #334155;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-adzone-premium-batch input {
                    width: 110px;
                    height: 30px;
                    border: 1px solid rgba(148,163,184,0.4);
                    border-radius: 8px;
                    padding: 0 8px;
                    font-size: 12px;
                    color: #1f2937;
                    background: #fff;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-adzone-premium-hot {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    flex-wrap: wrap;
                    border-radius: 10px;
                    border: 1px solid rgba(59,130,246,0.24);
                    background: rgba(59,130,246,0.07);
                    padding: 8px 10px;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-adzone-premium-hot .tag {
                    display: inline-flex;
                    align-items: center;
                    border-radius: 999px;
                    background: #ef4444;
                    color: #fff;
                    font-size: 11px;
                    line-height: 1;
                    font-weight: 700;
                    padding: 3px 7px;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-adzone-premium-hot .text {
                    font-size: 12px;
                    color: #1e3a8a;
                    line-height: 1.45;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-adzone-premium-hot a {
                    font-size: 12px;
                    color: #1d4ed8;
                    text-decoration: none;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-adzone-premium-hot a:hover {
                    text-decoration: underline;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-adzone-premium-op {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-end;
                    gap: 6px;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-adzone-premium-input-wrap {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 12px;
                    color: #334155;
                    flex-wrap: nowrap;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-adzone-premium-input-wrap input {
                    width: 84px;
                    height: 30px;
                    border: 1px solid rgba(148,163,184,0.42);
                    border-radius: 8px;
                    padding: 0 8px;
                    font-size: 12px;
                    color: #1f2937;
                    background: #fff;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-adzone-premium-suggest {
                    font-size: 12px;
                    color: #64748b;
                }
                #am-wxt-scene-popup-mask .am-wxt-site-switch {
                    position: relative;
                    display: inline-flex;
                    align-items: center;
                    justify-content: flex-start;
                    width: 36px;
                    min-width: 36px;
                    height: 18px;
                    border: none;
                    border-radius: 999px;
                    padding: 0 4px;
                    background: #4f68ff;
                    color: #fff;
                    cursor: pointer;
                    font-size: 10px;
                    line-height: 1;
                    font-weight: 700;
                    transition: background 0.2s ease;
                }
                #am-wxt-scene-popup-mask .am-wxt-site-switch.is-off {
                    justify-content: flex-end;
                    background: #cbd5e1;
                    color: #64748b;
                }
                #am-wxt-scene-popup-mask .am-wxt-site-switch .am-wxt-site-switch-handle {
                    position: absolute;
                    top: 2px;
                    left: 20px;
                    width: 14px;
                    height: 14px;
                    border-radius: 50%;
                    background: #fff;
                    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.25);
                    transition: left 0.2s ease;
                }
                #am-wxt-scene-popup-mask .am-wxt-site-switch.is-off .am-wxt-site-switch-handle {
                    left: 2px;
                }
                #am-wxt-scene-popup-mask .am-wxt-site-switch .am-wxt-site-switch-state {
                    position: relative;
                    z-index: 1;
                    pointer-events: none;
                    user-select: none;
                }
                #am-wxt-scene-popup-mask .am-wxt-site-switch.is-on .am-wxt-site-switch-state {
                    padding-right: 10px;
                }
                #am-wxt-scene-popup-mask .am-wxt-site-switch.is-off .am-wxt-site-switch-state {
                    padding-left: 10px;
                }
                #am-wxt-scene-popup-mask .am-wxt-site-switch:focus-visible {
                    outline: 2px solid rgba(59, 130, 246, 0.65);
                    outline-offset: 2px;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-adzone-premium-switch {
                    display: inline-flex;
                    gap: 6px;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-adzone-premium-op-muted {
                    font-size: 12px;
                    color: #94a3b8;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-advanced-area-config-row {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    flex-wrap: wrap;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-advanced-area-radio {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    font-size: 12px;
                    color: #475569;
                    padding: 3px 8px;
                    border: 1px solid rgba(148,163,184,0.35);
                    border-radius: 999px;
                    background: #fff;
                    cursor: pointer;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-advanced-area-radio.active {
                    border-color: rgba(79,104,255,0.42);
                    background: rgba(79,104,255,0.08);
                    color: #3241b9;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-advanced-area-radio input {
                    margin: 0;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-advanced-area-select {
                    min-width: 178px;
                    max-width: 260px;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-advanced-area-tools {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    flex-wrap: wrap;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-advanced-area-search-icon {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    color: #94a3b8;
                    margin-left: 4px;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-advanced-area-search-icon svg {
                    width: 14px;
                    height: 14px;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-advanced-area-search {
                    width: 220px;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-advanced-area-selector {
                    min-height: 320px;
                    max-height: 420px;
                    overflow: auto;
                    border: 1px solid rgba(148,163,184,0.28);
                    border-radius: 10px;
                    background: #fff;
                    padding: 10px 12px;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-area-section {
                    border-bottom: 1px dashed rgba(148,163,184,0.25);
                    padding-bottom: 10px;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-area-section:last-child {
                    border-bottom: none;
                    padding-bottom: 0;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-area-section-toggle {
                    border: none;
                    background: transparent;
                    padding: 0;
                    font-size: 12px;
                    color: #334155;
                    font-weight: 600;
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    cursor: pointer;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-area-section-toggle.checked,
                #am-wxt-scene-popup-mask .am-wxt-scene-area-section-toggle.partial {
                    color: #3450d6;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-area-check-icon {
                    width: 14px;
                    height: 14px;
                    border-radius: 3px;
                    border: 1px solid rgba(79,104,255,0.45);
                    color: #fff;
                    background: #fff;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    line-height: 1;
                    flex-shrink: 0;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-area-check-icon svg {
                    width: 12px;
                    height: 12px;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-area-section-toggle.checked .am-wxt-scene-area-check-icon,
                #am-wxt-scene-popup-mask .am-wxt-scene-area-section-toggle.partial .am-wxt-scene-area-check-icon,
                #am-wxt-scene-popup-mask .am-wxt-scene-area-item.checked .am-wxt-scene-area-check-icon,
                #am-wxt-scene-popup-mask .am-wxt-scene-area-province-check.checked .am-wxt-scene-area-check-icon,
                #am-wxt-scene-popup-mask .am-wxt-scene-area-province-check.partial .am-wxt-scene-area-check-icon {
                    background: #4f68ff;
                    border-color: #4f68ff;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-area-section-body {
                    margin-top: 8px;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    overflow: visible;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-area-group {
                    display: flex;
                    align-items: flex-start;
                    gap: 8px;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-area-group.no-title {
                    display: block;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-area-group.geo-title {
                    display: block;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-area-group-title {
                    width: 20px;
                    flex-shrink: 0;
                    font-size: 12px;
                    color: #64748b;
                    line-height: 26px;
                    text-align: center;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-area-group.geo-title .am-wxt-scene-area-group-title {
                    width: auto;
                    margin: 0 0 6px;
                    color: #334155;
                    line-height: 1.4;
                    text-align: left;
                    font-weight: 600;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-area-item-grid {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                    flex: 1;
                    position: relative;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-advanced-area-selector.area-mode-alpha .am-wxt-scene-area-item-grid {
                    display: grid;
                    grid-template-columns: repeat(4, minmax(0, 1fr));
                    gap: 8px 14px;
                    align-items: start;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-advanced-area-selector.area-mode-geo .am-wxt-scene-area-item-grid {
                    display: grid;
                    grid-template-columns: repeat(4, minmax(0, 1fr));
                    gap: 8px 14px;
                    align-items: start;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-area-province-row {
                    position: relative;
                    min-height: 24px;
                    min-width: 0;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-area-province-main {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    max-width: 100%;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-area-item {
                    border: none;
                    background: transparent;
                    padding: 0;
                    min-height: 24px;
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    cursor: pointer;
                    color: #334155;
                    font-size: 12px;
                    text-align: left;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-area-item.checked {
                    color: #2f45c9;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-area-item.partial {
                    color: #2f45c9;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-area-province-item {
                    max-width: 100%;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-area-province-check {
                    border: none;
                    background: transparent;
                    width: 16px;
                    height: 16px;
                    padding: 0;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    flex-shrink: 0;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-area-province-open {
                    border: none;
                    background: transparent;
                    padding: 0;
                    min-height: 24px;
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    cursor: pointer;
                    color: #334155;
                    font-size: 12px;
                    text-align: left;
                    max-width: 100%;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-area-province-open:hover,
                #am-wxt-scene-popup-mask .am-wxt-scene-area-province-open.open,
                #am-wxt-scene-popup-mask .am-wxt-scene-area-province-open.checked,
                #am-wxt-scene-popup-mask .am-wxt-scene-area-province-open.partial {
                    color: #2f45c9;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-area-province-open .am-wxt-scene-area-item-label {
                    white-space: nowrap;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-area-caret {
                    color: #94a3b8;
                    width: 12px;
                    height: 12px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    line-height: 1;
                    transform: translateY(1px);
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-area-province-open.open .am-wxt-scene-area-caret {
                    color: #2f45c9;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-area-expand {
                    display: none;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-area-city-list {
                    position: absolute;
                    left: 22px;
                    top: calc(100% + 4px);
                    z-index: 12;
                    width: min(520px, calc(100% - 22px));
                    min-width: 320px;
                    padding: 10px 12px;
                    border-radius: 10px;
                    border: 1px solid rgba(148,163,184,0.28);
                    background: #fff;
                    box-shadow: 0 10px 24px rgba(15,23,42,0.12);
                    display: none;
                    grid-template-columns: repeat(4, minmax(0, 1fr));
                    gap: 8px 10px;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-area-city-list.open {
                    display: grid;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-area-city-popover {
                    pointer-events: auto;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-area-city-item {
                    min-height: 22px;
                    font-size: 12px;
                    color: #334155;
                    border: none;
                    background: transparent;
                    padding: 0;
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    cursor: pointer;
                    text-align: left;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-area-city-item.checked {
                    color: #2f45c9;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-area-city-item.checked .am-wxt-scene-area-check-icon {
                    background: #4f68ff;
                    border-color: #4f68ff;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-area-item-label {
                    line-height: 1.2;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-area-loading {
                    font-size: 12px;
                    color: #64748b;
                    line-height: 1.4;
                    margin-bottom: 4px;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-area-empty {
                    font-size: 12px;
                    color: #94a3b8;
                    line-height: 1.5;
                    padding: 6px 0 2px;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-popup-time-grid {
                    border: 1px solid rgba(148,163,184,0.3);
                    border-radius: 10px;
                    overflow: hidden;
                    background: #fff;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-time-head {
                    display: grid;
                    grid-template-columns: 54px minmax(0, 1fr) 126px;
                    border-bottom: 1px solid rgba(148,163,184,0.2);
                    background: #f8fafc;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-time-head-day,
                #am-wxt-scene-popup-mask .am-wxt-scene-time-head-actions {
                    font-size: 11px;
                    color: #64748b;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-time-hours {
                    display: grid;
                    grid-template-columns: repeat(24, minmax(24px, 1fr));
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-time-hour {
                    font-size: 10px;
                    color: #64748b;
                    padding: 8px 0;
                    text-align: center;
                    border-left: 1px solid rgba(148,163,184,0.12);
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-time-body {
                    display: flex;
                    flex-direction: column;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-time-week-row {
                    display: grid;
                    grid-template-columns: 54px minmax(0, 1fr) 126px;
                    border-bottom: 1px solid rgba(148,163,184,0.12);
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-time-week-row:last-child {
                    border-bottom: none;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-time-week-label {
                    font-size: 12px;
                    color: #64748b;
                    padding: 8px 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #f8fafc;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-time-cells {
                    display: grid;
                    grid-template-columns: repeat(24, minmax(24px, 1fr));
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-time-cell {
                    border: none;
                    border-left: 1px solid rgba(148,163,184,0.12);
                    border-radius: 0;
                    background: rgba(100,116,139,0.08);
                    min-height: 26px;
                    cursor: pointer;
                    padding: 0;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-time-cell.active {
                    background: rgba(79,104,255,0.23);
                    box-shadow: inset 0 0 0 1px rgba(79,104,255,0.45);
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-time-week-actions {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    padding: 0 6px;
                    background: #fff;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-time-copy {
                    border: none;
                    background: transparent;
                    color: #4f68ff;
                    font-size: 11px;
                    line-height: 1.2;
                    padding: 0;
                    cursor: pointer;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-time-copy:hover {
                    text-decoration: underline;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-time-legend {
                    display: flex;
                    align-items: center;
                    justify-content: flex-end;
                    flex-wrap: wrap;
                    gap: 12px;
                    color: #64748b;
                    font-size: 11px;
                    line-height: 1.3;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-time-legend-item {
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-time-legend-item i {
                    width: 9px;
                    height: 9px;
                    border-radius: 50%;
                    display: inline-block;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-time-legend-item i.level-1 { background: #9ca3af; }
                #am-wxt-scene-popup-mask .am-wxt-scene-time-legend-item i.level-2 { background: #f59e0b; }
                #am-wxt-scene-popup-mask .am-wxt-scene-time-legend-item i.level-3 { background: #f472b6; }
                #am-wxt-scene-popup-mask .am-wxt-scene-time-legend-item i.level-4 { background: #4f68ff; }
                #am-wxt-scene-popup-mask .am-wxt-scene-advanced-preview {
                    border-left: 1px solid rgba(148,163,184,0.18);
                    background: linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%);
                    padding: 20px 14px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: flex-start;
                    gap: 12px;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-advanced-preview-phone {
                    width: 150px;
                    height: 282px;
                    border-radius: 26px;
                    background: #e2e8f0;
                    padding: 10px 8px;
                    box-shadow: inset 0 0 0 1px rgba(100,116,139,0.25);
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-advanced-preview-screen {
                    width: 100%;
                    height: 100%;
                    border-radius: 18px;
                    background: linear-gradient(180deg, #fff 0%, #dbeafe 100%);
                    padding: 12px 8px;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-advanced-preview-card {
                    height: 58px;
                    border-radius: 10px;
                    background: linear-gradient(120deg, rgba(79,104,255,0.28), rgba(59,130,246,0.16));
                    border: 1px solid rgba(79,104,255,0.2);
                }
                #am-wxt-scene-popup-mask .am-wxt-scene-advanced-preview-desc {
                    font-size: 12px;
                    color: #64748b;
                    text-align: center;
                    line-height: 1.45;
                }
                @media (max-width: 980px) {
                    #am-wxt-scene-popup-mask .am-wxt-scene-popup-dialog.am-wxt-scene-popup-dialog-advanced {
                        width: min(96vw, 900px);
                    }
                    #am-wxt-scene-popup-mask .am-wxt-scene-popup-dialog.am-wxt-scene-popup-dialog-crowd {
                        width: min(96vw, 900px);
                    }
                    #am-wxt-scene-popup-mask .am-wxt-strategy-batch-number-grid {
                        grid-template-columns: minmax(0, 1fr);
                    }
                    #am-wxt-scene-popup-mask .am-wxt-scene-advanced-main {
                        grid-template-columns: minmax(0, 1fr);
                    }
                    #am-wxt-scene-popup-mask .am-wxt-scene-crowd-layout {
                        grid-template-columns: minmax(0, 1fr);
                    }
                    #am-wxt-scene-popup-mask .am-wxt-scene-crowd-add-dialog {
                        width: min(96vw, 940px);
                    }
                    #am-wxt-scene-popup-mask .am-wxt-scene-crowd-native-layout {
                        display: block;
                    }
                    #am-wxt-scene-popup-mask .am-wxt-scene-crowd-native-right {
                        max-width: none;
                        justify-self: stretch;
                    }
                    #am-wxt-scene-popup-mask .am-wxt-scene-crowd-native-left.am-wxt-scene-trend-main {
                        padding-bottom: 176px;
                    }
                    #am-wxt-scene-popup-mask .am-wxt-scene-trend-selected-dock {
                        left: 8px;
                        right: 8px;
                        bottom: 64px;
                    }
                    #am-wxt-scene-popup-mask .am-wxt-scene-crowd-native-toolbar {
                        grid-template-columns: minmax(0, 1fr) auto;
                    }
                    #am-wxt-scene-popup-mask .am-wxt-scene-crowd-native-toolbar .am-wxt-input {
                        grid-column: 1 / -1;
                    }
                    #am-wxt-scene-popup-mask .am-wxt-scene-crowd-native-manual {
                        grid-template-columns: minmax(0, 1fr);
                    }
                    #am-wxt-scene-popup-mask .am-wxt-scene-crowd-native-candidate-head {
                        grid-template-columns: minmax(0, 1fr) 120px 88px 72px;
                    }
                    #am-wxt-scene-popup-mask .am-wxt-scene-crowd-native-candidate-row {
                        grid-template-columns: minmax(0, 1fr) 120px 88px 72px;
                    }
                    #am-wxt-scene-popup-mask .am-wxt-scene-crowd-native-candidate-head.am-wxt-scene-trend-candidate-head,
                    #am-wxt-scene-popup-mask .am-wxt-scene-crowd-native-candidate-row.am-wxt-scene-trend-candidate-row {
                        grid-template-columns: minmax(0, 1fr) 46px 54px 100px;
                    }
                    #am-wxt-scene-popup-mask .am-wxt-scene-trend-rank-board {
                        grid-template-columns: minmax(0, 1fr);
                        min-height: 520px;
                    }
                    #am-wxt-scene-popup-mask .am-wxt-scene-trend-rank-title strong {
                        font-size: 14px;
                    }
                    #am-wxt-scene-popup-mask .am-wxt-scene-trend-rank-content {
                        margin: 0 8px 8px;
                    }
                    #am-wxt-scene-popup-mask .am-wxt-scene-trend-association {
                        height: 100%;
                        max-height: 100%;
                        min-height: 0;
                        margin: 0 8px 8px;
                    }
                    #am-wxt-scene-popup-mask .am-wxt-scene-trend-association-search {
                        grid-template-columns: minmax(0, 1fr);
                    }
                    #am-wxt-scene-popup-mask .am-wxt-scene-trend-association-actions {
                        grid-template-columns: minmax(0, 1fr) auto 32px;
                    }
                    #am-wxt-scene-popup-mask .am-wxt-scene-crowd-native-selected-table-head,
                    #am-wxt-scene-popup-mask .am-wxt-scene-crowd-native-selected-row {
                        grid-template-columns: minmax(0, 1fr) 64px 44px;
                    }
                    #am-wxt-scene-popup-mask .am-wxt-scene-time-recommend-cards {
                        grid-template-columns: minmax(0, 1fr);
                    }
                    #am-wxt-scene-popup-mask .am-wxt-scene-advanced-area-select,
                    #am-wxt-scene-popup-mask .am-wxt-scene-advanced-area-search {
                        width: 100%;
                        max-width: 100%;
                    }
                    #am-wxt-scene-popup-mask .am-wxt-scene-area-city-list {
                        position: static;
                        left: auto;
                        top: auto;
                        width: 100%;
                        min-width: 0;
                        max-width: 100%;
                        margin: 6px 0 0 22px;
                        box-shadow: none;
                        grid-template-columns: repeat(2, minmax(0, 1fr));
                    }
                    #am-wxt-scene-popup-mask .am-wxt-scene-advanced-area-selector.area-mode-alpha .am-wxt-scene-area-item-grid {
                        grid-template-columns: repeat(2, minmax(0, 1fr));
                        gap: 8px 12px;
                    }
                    #am-wxt-scene-popup-mask .am-wxt-scene-advanced-area-selector.area-mode-geo .am-wxt-scene-area-item-grid {
                        grid-template-columns: repeat(2, minmax(0, 1fr));
                        gap: 8px 12px;
                    }
                    #am-wxt-scene-popup-mask .am-wxt-scene-time-head {
                        grid-template-columns: 46px minmax(0, 1fr);
                    }
                    #am-wxt-scene-popup-mask .am-wxt-scene-time-head-actions,
                    #am-wxt-scene-popup-mask .am-wxt-scene-time-week-actions {
                        display: none;
                    }
                    #am-wxt-scene-popup-mask .am-wxt-scene-time-week-row {
                        grid-template-columns: 46px minmax(0, 1fr);
                    }
                    #am-wxt-scene-popup-mask .am-wxt-scene-advanced-preview {
                        display: none;
                    }
                }
                #am-wxt-keyword-modal .am-wxt-scene-dynamic {
                    margin-top: 8px;
                    border: none;
                    border-radius: 8px;
                    background: #f8fafc;
                    padding: 8px;
                }
                #am-wxt-keyword-modal .am-wxt-scene-dynamic .title {
                    font-size: 12px;
                    color: #334155;
                    font-weight: 600;
                    margin-bottom: 6px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 8px;
                }
                #am-wxt-keyword-modal .am-wxt-scene-dynamic .meta {
                    color: #64748b;
                    font-size: 11px;
                }
                #am-wxt-keyword-modal .am-wxt-scene-grid {
                    display: flex;
                    flex-direction: column;
                    gap: 0;
                }
                #am-wxt-keyword-modal .am-wxt-scene-setting-row {
                    display: grid;
                    grid-template-columns: 160px minmax(0, 1fr);
                    align-items: flex-start;
                    gap: 8px;
                    padding: 6px 0;
                    border-bottom: none;
                }
                #am-wxt-keyword-modal .am-wxt-scene-setting-row:last-child {
                    border-bottom: 0;
                }
                #am-wxt-keyword-modal .am-wxt-scene-setting-label {
                    font-size: 12px;
                    color: #334155;
                    line-height: 30px;
                }
                #am-wxt-keyword-modal .am-wxt-scene-empty {
                    color: #64748b;
                    font-size: 12px;
                }
                #am-wxt-keyword-modal .am-wxt-manual-keyword-panel {
                    border: 1px solid rgba(148,163,184,0.28);
                    border-radius: 10px;
                    background: #fff;
                    overflow: hidden;
                }
                #am-wxt-keyword-modal .am-wxt-manual-keyword-panel.is-collapsed .am-wxt-manual-keyword-layout,
                #am-wxt-keyword-modal .am-wxt-manual-keyword-panel.is-collapsed .am-wxt-manual-keyword-actions {
                    display: none;
                }
                #am-wxt-keyword-modal .am-wxt-manual-keyword-panel.is-collapsed .am-wxt-manual-keyword-toolbar {
                    border-bottom: 0;
                }
                #am-wxt-keyword-modal .am-wxt-manual-keyword-toolbar {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 8px;
                    padding: 8px 10px;
                    border-bottom: 1px solid rgba(148,163,184,0.2);
                    background: #f8fafc;
                }
                #am-wxt-keyword-modal .am-wxt-manual-keyword-toolbar-left {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    flex-wrap: wrap;
                }
                #am-wxt-keyword-modal .am-wxt-manual-keyword-match-menu {
                    position: relative;
                }
                #am-wxt-keyword-modal .am-wxt-manual-keyword-match-pop {
                    position: absolute;
                    top: calc(100% + 4px);
                    left: 0;
                    min-width: 136px;
                    z-index: 3;
                    padding: 6px;
                    border-radius: 8px;
                    border: 1px solid rgba(148,163,184,0.35);
                    background: #fff;
                    box-shadow: 0 8px 24px rgba(15,23,42,0.14);
                    display: none;
                    gap: 6px;
                    flex-direction: column;
                }
                #am-wxt-keyword-modal .am-wxt-manual-keyword-match-menu.open .am-wxt-manual-keyword-match-pop {
                    display: flex;
                }
                #am-wxt-keyword-modal .am-wxt-manual-keyword-toolbar .tips {
                    font-size: 12px;
                    color: #64748b;
                }
                #am-wxt-keyword-modal .am-wxt-manual-keyword-toolbar-right {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    margin-left: auto;
                }
                #am-wxt-keyword-modal .am-wxt-manual-keyword-layout {
                    display: grid;
                    grid-template-columns: minmax(220px, 0.44fr) minmax(0, 1fr);
                    gap: 10px;
                    padding: 10px;
                }
                #am-wxt-keyword-modal .am-wxt-manual-keyword-left {
                    border: 1px solid rgba(148,163,184,0.22);
                    border-radius: 8px;
                    background: #fff;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                    min-height: 0;
                }
                #am-wxt-keyword-modal .am-wxt-manual-keyword-left-head,
                #am-wxt-keyword-modal .am-wxt-manual-keyword-left-item {
                    display: grid;
                    grid-template-columns: minmax(0, 1fr) 92px;
                    gap: 8px;
                    align-items: center;
                    padding: 10px 10px;
                }
                #am-wxt-keyword-modal .am-wxt-manual-keyword-left-head {
                    font-size: 12px;
                    font-weight: 600;
                    color: #334155;
                    border-bottom: 1px solid rgba(148,163,184,0.2);
                }
                #am-wxt-keyword-modal .am-wxt-manual-keyword-left-list {
                    min-height: 0;
                    max-height: 360px;
                    overflow: auto;
                }
                #am-wxt-keyword-modal .am-wxt-manual-keyword-left-item {
                    border-top: 1px solid rgba(148,163,184,0.14);
                }
                #am-wxt-keyword-modal .am-wxt-manual-keyword-left-item:first-child {
                    border-top: 0;
                }
                #am-wxt-keyword-modal .am-wxt-manual-left-check {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    min-width: 0;
                    color: #334155;
                }
                #am-wxt-keyword-modal .am-wxt-manual-left-check span {
                    min-width: 0;
                    line-height: 1.25;
                    word-break: break-word;
                }
                #am-wxt-keyword-modal .am-wxt-manual-left-title {
                    color: #334155;
                    font-size: 13px;
                    font-weight: 600;
                    line-height: 1.4;
                }
                #am-wxt-keyword-modal .am-wxt-manual-left-meta {
                    margin-top: 2px;
                    font-size: 12px;
                    color: #94a3b8;
                }
                #am-wxt-keyword-modal .am-wxt-manual-left-meta.status {
                    color: #10b981;
                    font-weight: 600;
                }
                #am-wxt-keyword-modal .am-wxt-manual-left-bid {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 4px;
                    font-size: 13px;
                    color: #475569;
                    border: 1px solid rgba(148,163,184,0.24);
                    border-radius: 10px;
                    height: 36px;
                    background: #f8fafc;
                    width: 92px;
                }
                #am-wxt-keyword-modal .am-wxt-manual-keyword-right {
                    min-width: 0;
                    border: 1px solid rgba(148,163,184,0.22);
                    border-radius: 8px;
                    overflow: hidden;
                    background: #fff;
                }
                #am-wxt-keyword-modal .am-wxt-manual-keyword-head,
                #am-wxt-keyword-modal .am-wxt-manual-keyword-item {
                    display: grid;
                    grid-template-columns: minmax(220px, 1.9fr) 0.9fr 0.9fr 1fr minmax(160px, 1fr) minmax(130px, 0.95fr);
                    gap: 8px;
                    align-items: center;
                    padding: 8px 10px;
                }
                #am-wxt-keyword-modal .am-wxt-manual-keyword-head {
                    background: #f8fafc;
                    border-bottom: 1px solid rgba(148,163,184,0.22);
                    font-size: 12px;
                    font-weight: 600;
                    color: #334155;
                }
                #am-wxt-keyword-modal .am-wxt-manual-keyword-head .keyword-col,
                #am-wxt-keyword-modal .am-wxt-manual-keyword-item .keyword-col {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    min-width: 0;
                }
                #am-wxt-keyword-modal .am-wxt-manual-keyword-item .keyword-main {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    min-width: 0;
                }
                #am-wxt-keyword-modal .am-wxt-manual-keyword-item .keyword-text {
                    min-width: 0;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    font-size: 13px;
                    color: #1f2937;
                }
                #am-wxt-keyword-modal .am-wxt-manual-keyword-item .keyword-submeta {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    min-width: 0;
                    color: #94a3b8;
                    font-size: 12px;
                    line-height: 1;
                }
                #am-wxt-keyword-modal .am-wxt-manual-keyword-item .keyword-submeta-text {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    min-width: 0;
                    white-space: nowrap;
                }
                #am-wxt-keyword-modal .am-wxt-manual-keyword-item .keyword-relevance {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    padding: 0 7px;
                    min-width: 22px;
                    height: 18px;
                    border-radius: 10px;
                    background: #e7efff;
                    color: #4f65ff;
                    font-size: 11px;
                    font-weight: 600;
                    line-height: 18px;
                }
                #am-wxt-keyword-modal .am-wxt-manual-keyword-item .keyword-relevance-mid {
                    background: #fef3c7;
                    color: #92400e;
                }
                #am-wxt-keyword-modal .am-wxt-manual-keyword-item .keyword-relevance-low {
                    background: #fee2e2;
                    color: #b91c1c;
                }
                #am-wxt-keyword-modal .am-wxt-manual-keyword-item {
                    border-top: 1px solid rgba(148,163,184,0.16);
                    font-size: 12px;
                    color: #475569;
                }
                #am-wxt-keyword-modal .am-wxt-manual-keyword-item:first-child {
                    border-top: 0;
                }
                #am-wxt-keyword-modal .am-wxt-manual-keyword-list {
                    max-height: 360px;
                    overflow: auto;
                }
                #am-wxt-keyword-modal .am-wxt-manual-keyword-item .metric-muted {
                    color: #94a3b8;
                }
                #am-wxt-keyword-modal .am-wxt-manual-keyword-item .bid-value {
                    color: #334155;
                    font-weight: 600;
                }
                #am-wxt-keyword-modal .am-wxt-manual-keyword-actions {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 8px;
                    padding: 8px 10px;
                    border-top: 1px solid rgba(148,163,184,0.22);
                    background: #f8fafc;
                }
                #am-wxt-keyword-modal .am-wxt-manual-keyword-actions .tips {
                    font-size: 11px;
                    color: #64748b;
                }
                #am-wxt-keyword-modal .am-wxt-manual-keyword-empty {
                    padding: 12px 10px;
                    font-size: 12px;
                    color: #94a3b8;
                }
                #am-wxt-keyword-modal .am-wxt-manual-keyword-item .am-wxt-bid-edit {
                    display: inline-flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 6px;
                    border: 1px solid rgba(148,163,184,0.3);
                    border-radius: 10px;
                    padding: 0 8px;
                    height: 36px;
                    background: #fff;
                }
                #am-wxt-keyword-modal .am-wxt-config .am-wxt-manual-keyword-item .am-wxt-bid-edit input:not([type="checkbox"]):not([type="radio"]) {
                    width: 64px;
                    border: 0;
                    outline: none;
                    font-size: 13px;
                    color: #1f2937;
                    background: transparent;
                }
                #am-wxt-keyword-modal .am-wxt-manual-keyword-item .am-wxt-bid-edit span {
                    color: #64748b;
                    font-size: 12px;
                }
                #am-wxt-keyword-modal .am-wxt-config textarea {
                    width: 100%;
                    min-height: 76px;
                    margin-top: 0;
                    resize: vertical;
                }
                #am-wxt-keyword-modal .am-wxt-actions {
                    margin-top: 10px;
                    display: flex;
                    gap: 8px;
                    align-items: center;
                    flex-wrap: wrap;
                }
                #am-wxt-keyword-modal .am-wxt-workbench-tabs {
                    display: flex;
                    gap: 8px;
                    padding: 10px 12px 0;
                    flex-wrap: wrap;
                    border-bottom: 1px solid rgba(148,163,184,0.18);
                }
                #am-wxt-keyword-modal #am-wxt-workbench-preview-log {
                    margin-top: 10px;
                    border: 1px solid rgba(148,163,184,0.35);
                    border-radius: 8px;
                    background: #fff;
                    min-height: 96px;
                    max-height: 220px;
                    overflow: auto;
                    padding: 8px;
                    font-size: 12px;
                }
                #am-wxt-keyword-modal #am-wxt-workbench-preview-log .line {
                    margin-bottom: 4px;
                    color: #334155;
                }
                #am-wxt-keyword-modal #am-wxt-workbench-preview-log .line.error {
                    color: #b91c1c;
                }
                #am-wxt-keyword-modal #am-wxt-workbench-preview-log .line.success {
                    color: #15803d;
                }
                #am-wxt-keyword-modal .am-wxt-run-mode-wrap {
                    position: relative;
                    display: inline-flex;
                    align-items: center;
                    width: fit-content;
                }
                #am-wxt-keyword-modal .am-wxt-run-mode-wrap .am-wxt-btn.primary {
                    padding-right: 28px;
                }
                #am-wxt-keyword-modal .am-wxt-run-mode-toggle {
                    position: absolute;
                    right: 8px;
                    top: 50%;
                    transform: translateY(-50%);
                    min-width: 24px;
                    width: 24px;
                    height: 24px;
                    padding: 0;
                    border: 0;
                    border-radius: 4px;
                    background: transparent;
                    color: #fff;
                    font-size: 0;
                    line-height: 1;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    z-index: 2;
                    transition: color 0.16s ease, transform 0.16s ease;
                }
                #am-wxt-keyword-modal .am-wxt-run-mode-toggle::before {
                    content: none;
                }
                #am-wxt-keyword-modal .am-wxt-run-mode-toggle[data-open="1"]::before {
                    content: none;
                }
                #am-wxt-keyword-modal .am-wxt-run-mode-toggle:hover {
                    background: transparent !important;
                    border-color: transparent !important;
                    box-shadow: none !important;
                    color: #fff !important;
                    transform: translateY(calc(-50% - 1px)) !important;
                }
                #am-wxt-keyword-modal #am-wxt-keyword-run-mode-toggle.am-wxt-run-mode-toggle,
                #am-wxt-keyword-modal #am-wxt-keyword-run-mode-toggle.am-wxt-run-mode-toggle:hover,
                #am-wxt-keyword-modal #am-wxt-keyword-run-mode-toggle.am-wxt-run-mode-toggle:active,
                #am-wxt-keyword-modal #am-wxt-keyword-run-mode-toggle.am-wxt-run-mode-toggle:focus {
                    background: transparent !important;
                    background-color: transparent !important;
                    background-image: none !important;
                    border: 0 !important;
                    box-shadow: none !important;
                    outline: 0;
                    color: #fff !important;
                }
                #am-wxt-keyword-modal #am-wxt-keyword-run-mode-toggle.am-wxt-run-mode-toggle {
                    transform: translateY(-50%) !important;
                }
                #am-wxt-keyword-modal #am-wxt-keyword-run-mode-toggle.am-wxt-run-mode-toggle:hover,
                #am-wxt-keyword-modal #am-wxt-keyword-run-mode-toggle.am-wxt-run-mode-toggle:active {
                    transform: translateY(calc(-50% - 1px)) !important;
                }
                #am-wxt-keyword-modal #am-wxt-keyword-run-mode-toggle.am-wxt-run-mode-toggle::before {
                    background: transparent !important;
                    border: 0 !important;
                    box-shadow: none !important;
                    text-shadow: none;
                }
                #am-wxt-keyword-modal #am-wxt-keyword-run-mode-toggle.am-wxt-run-mode-toggle::after {
                    content: none !important;
                    display: none !important;
                }
                #am-wxt-keyword-modal .am-wxt-run-mode-toggle:focus-visible {
                    outline: 2px solid rgba(255,255,255,0.72);
                    outline-offset: 1px;
                }
                #am-wxt-keyword-modal .am-wxt-run-mode-toggle:disabled {
                    cursor: not-allowed;
                    opacity: 0.72;
                }
                #am-wxt-keyword-modal .am-wxt-run-mode-menu {
                    position: fixed;
                    z-index: 2147483647;
                    top: 0;
                    left: 0;
                    right: auto;
                    min-width: 84px;
                    width: max-content;
                    padding: 4px;
                    border-radius: 10px;
                    border: 1px solid var(--am26-border-strong, rgba(255,255,255,0.6));
                    background: var(--am26-panel-strong, linear-gradient(135deg, rgba(255,255,255,0.6), rgba(255,255,255,0.2)));
                    box-shadow: var(--am26-shadow, 0 8px 32px rgba(31,38,135,0.15));
                    backdrop-filter: blur(12px) saturate(1.25);
                    -webkit-backdrop-filter: blur(12px) saturate(1.25);
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }
                #am-wxt-keyword-modal .am-wxt-run-mode-menu.hidden {
                    display: none;
                }
                #am-wxt-keyword-modal .am-wxt-run-mode-item {
                    border: 0;
                    background: transparent;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 8px;
                    text-align: left;
                    white-space: nowrap;
                    padding: 6px 10px;
                    border-radius: 8px;
                    font-size: 12px;
                    color: var(--am26-text-soft, #505a74);
                    cursor: pointer;
                }
                #am-wxt-keyword-modal .am-wxt-run-mode-label {
                    flex: 1;
                }
                #am-wxt-keyword-modal .am-wxt-run-mode-count {
                    display: inline-flex;
                    align-items: center;
                    gap: 2px;
                    padding: 2px 6px;
                    border-radius: 10px;
                    border: 1px solid var(--am26-border, rgba(255,255,255,0.4));
                    background: var(--am26-surface, rgba(255,255,255,0.25));
                    color: var(--am26-text-soft, #505a74);
                    font-size: 11px;
                    line-height: 1;
                    user-select: none;
                }
                #am-wxt-keyword-modal .am-wxt-run-mode-count-icon {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0.9;
                }
                #am-wxt-keyword-modal .am-wxt-run-mode-count-num {
                    min-width: 12px;
                    text-align: center;
                    font-weight: 600;
                }
                #am-wxt-keyword-modal .am-wxt-run-mode-item:hover {
                    background: var(--am26-surface-strong, rgba(255,255,255,0.45));
                    color: var(--am26-primary-strong, #1d3fcf);
                }
                #am-wxt-keyword-modal .am-wxt-run-mode-item.active {
                    background: rgba(69,84,229,0.10);
                    color: var(--am26-primary-strong, #1d3fcf);
                    font-weight: 600;
                }
                #am-wxt-keyword-run-mode-menu.am-wxt-run-mode-menu {
                    position: fixed;
                    z-index: 2147483647;
                    top: 0;
                    left: 0;
                    right: auto;
                    min-width: 84px;
                    width: max-content;
                    padding: 4px;
                    border-radius: 10px;
                    border: 1px solid var(--am26-border-strong, rgba(255,255,255,0.6));
                    background: var(--am26-panel-strong, linear-gradient(135deg, rgba(255,255,255,0.6), rgba(255,255,255,0.2)));
                    box-shadow: var(--am26-shadow, 0 8px 32px rgba(31,38,135,0.15));
                    backdrop-filter: blur(12px) saturate(1.25);
                    -webkit-backdrop-filter: blur(12px) saturate(1.25);
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }
                #am-wxt-keyword-run-mode-menu.am-wxt-run-mode-menu.hidden {
                    display: none;
                }
                #am-wxt-keyword-run-mode-menu .am-wxt-run-mode-item {
                    border: 0;
                    background: transparent;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 8px;
                    text-align: left;
                    white-space: nowrap;
                    padding: 6px 10px;
                    border-radius: 8px;
                    font-size: 12px;
                    color: var(--am26-text-soft, #505a74);
                    cursor: pointer;
                }
                #am-wxt-keyword-run-mode-menu .am-wxt-run-mode-label {
                    flex: 1;
                }
                #am-wxt-keyword-run-mode-menu .am-wxt-run-mode-count {
                    display: inline-flex;
                    align-items: center;
                    gap: 2px;
                    padding: 2px 6px;
                    border-radius: 10px;
                    border: 1px solid var(--am26-border, rgba(255,255,255,0.4));
                    background: var(--am26-surface, rgba(255,255,255,0.25));
                    color: var(--am26-text-soft, #505a74);
                    font-size: 11px;
                    line-height: 1;
                    user-select: none;
                }
                #am-wxt-keyword-run-mode-menu .am-wxt-run-mode-count-icon {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0.9;
                }
                #am-wxt-keyword-run-mode-menu .am-wxt-run-mode-count-num {
                    min-width: 12px;
                    text-align: center;
                    font-weight: 600;
                }
                #am-wxt-keyword-run-mode-menu .am-wxt-run-mode-item:hover {
                    background: var(--am26-surface-strong, rgba(255,255,255,0.45));
                    color: var(--am26-primary-strong, #1d3fcf);
                }
                #am-wxt-keyword-run-mode-menu .am-wxt-run-mode-item.active {
                    background: rgba(69,84,229,0.10);
                    color: var(--am26-primary-strong, #1d3fcf);
                    font-weight: 600;
                }
                #am-wxt-keyword-quick-log {
                    margin-top: 8px;
                    border: 1px solid rgba(148,163,184,0.35);
                    border-radius: 8px;
                    background: #fff;
                    min-height: 48px;
                    max-height: 96px;
                    overflow: auto;
                    padding: 6px 8px;
                    font-size: 12px;
                }
                #am-wxt-keyword-quick-log .line {
                    margin-bottom: 4px;
                    color: #334155;
                }
                #am-wxt-keyword-quick-log .line.error {
                    color: #b91c1c;
                }
                #am-wxt-keyword-quick-log .line.success {
                    color: #15803d;
                }
                #am-wxt-keyword-modal .am-wxt-crowd-box {
                    margin-top: 8px;
                    border: 1px dashed rgba(100,116,139,0.4);
                    border-radius: 8px;
                    padding: 8px;
                    background: #f8fafc;
                }
                #am-wxt-keyword-modal .am-wxt-crowd-title {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    font-size: 12px;
                    color: #334155;
                    margin-bottom: 6px;
                }
                #am-wxt-keyword-modal .am-wxt-crowd-list {
                    max-height: 104px;
                    overflow: auto;
                }
                #am-wxt-keyword-modal .am-wxt-crowd-item {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 8px;
                    font-size: 12px;
                    color: #334155;
                    padding: 4px 0;
                    border-bottom: 1px dashed rgba(148,163,184,0.3);
                }
                #am-wxt-keyword-modal .am-wxt-crowd-item:last-child {
                    border-bottom: 0;
                }
                #am-wxt-keyword-preview {
                    margin-top: 8px;
                    background: #0f172a;
                    color: #d1d5db;
                    border-radius: 8px;
                    padding: 10px;
                    min-height: 96px;
                    max-height: 180px;
                    overflow: auto;
                    font-family: Menlo, Consolas, monospace;
                    font-size: 11px;
                    white-space: pre-wrap;
                }
                #am-wxt-keyword-debug-wrap.collapsed {
                    display: none;
                }
                #am-wxt-keyword-modal .am-wxt-debug-toggle {
                    margin-top: 8px;
                    display: flex;
                    justify-content: flex-end;
                }
                #am-wxt-keyword-log {
                    margin-top: 8px;
                    border: 1px solid rgba(148,163,184,0.35);
                    border-radius: 8px;
                    background: #fff;
                    min-height: 90px;
                    max-height: 180px;
                    overflow: auto;
                    padding: 8px;
                    font-size: 12px;
                }
                #am-wxt-keyword-log .line {
                    margin-bottom: 4px;
                    color: #334155;
                }
                #am-wxt-keyword-log .line.error {
                    color: #b91c1c;
                }
                #am-wxt-keyword-log .line.success {
                    color: #15803d;
                }
                @media (max-width: 980px) {
                    #am-wxt-keyword-modal .am-wxt-split {
                        grid-template-columns: 1fr;
                    }
                    #am-wxt-keyword-modal .am-wxt-strategy-main {
                        grid-template-columns: 1fr;
                        align-items: flex-start;
                    }
                    #am-wxt-keyword-modal .am-wxt-strategy-right {
                        width: 100%;
                        justify-content: flex-start;
                    }
                    #am-wxt-keyword-modal .am-wxt-strategy-summary {
                        white-space: normal;
                    }
                    #am-wxt-keyword-modal .am-wxt-strategy-right > .am-wxt-strategy-summary:first-child {
                        flex: 0 1 auto;
                        text-align: left;
                    }
                    #am-wxt-keyword-modal .am-wxt-strategy-target-cost,
                    #am-wxt-keyword-modal .am-wxt-strategy-right > .am-wxt-strategy-summary:nth-of-type(2) {
                        flex: 0 0 auto;
                        width: auto;
                    }
                    #am-wxt-keyword-modal .am-wxt-setting-row {
                        grid-template-columns: 1fr;
                        gap: 6px;
                    }
                    #am-wxt-keyword-modal .am-wxt-setting-label {
                        line-height: 1.3;
                    }
                    #am-wxt-keyword-modal .am-wxt-matrix-workspace {
                        grid-template-columns: 1fr;
                    }
                    #am-wxt-keyword-modal .am-wxt-strategy-head-actions {
                        width: 100%;
                        margin-left: 0;
                        justify-content: flex-end;
                    }
                    #am-wxt-keyword-modal .am-wxt-strategy-head-tools {
                        width: 100%;
                        justify-content: flex-start;
                    }
                    #am-wxt-keyword-modal .am-wxt-strategy-search-input {
                        width: 100%;
                    }
                    #am-wxt-keyword-modal .am-wxt-matrix-action-grid,
                    #am-wxt-keyword-modal .am-wxt-matrix-settings-grid,
                    #am-wxt-keyword-modal .am-wxt-matrix-preset-grid,
                    #am-wxt-keyword-modal .am-wxt-matrix-summary-grid {
                        grid-template-columns: 1fr;
                    }
                    #am-wxt-keyword-modal .am-wxt-matrix-dimension-head {
                        grid-template-columns: 1fr;
                        align-items: stretch;
                    }
                    #am-wxt-keyword-modal .am-wxt-matrix-dimension-top {
                        grid-template-columns: 1fr;
                    }
                    #am-wxt-keyword-modal .am-wxt-matrix-dimension-top-main,
                    #am-wxt-keyword-modal .am-wxt-matrix-dimension-top-actions {
                        width: 100%;
                    }
                    #am-wxt-keyword-modal .am-wxt-matrix-dimension-top-actions {
                        grid-template-columns: minmax(0, 1fr) auto;
                    }
                    #am-wxt-keyword-modal .am-wxt-crowd-list.am-wxt-matrix-dimension-list {
                        max-height: none;
                        min-height: 0;
                        column-count: 1;
                        column-width: auto;
                    }
                    #am-wxt-keyword-modal .am-wxt-scene-setting-row {
                        grid-template-columns: 1fr;
                        gap: 6px;
                    }
                    #am-wxt-keyword-modal .am-wxt-scene-setting-label {
                        line-height: 1.3;
                    }
                    #am-wxt-keyword-modal .am-wxt-setting-control.am-wxt-setting-control-pair {
                        flex-wrap: wrap;
                        align-items: flex-start;
                    }
                    #am-wxt-keyword-modal .am-wxt-scene-inline-input {
                        justify-content: flex-start;
                        min-width: 0;
                        width: 100%;
                        margin-left: 0;
                    }
                    #am-wxt-keyword-modal .am-wxt-scene-inline-input input {
                        width: min(220px, 100%);
                        flex: 1 1 auto;
                    }
                    #am-wxt-keyword-modal .am-wxt-site-optimize-config {
                        padding-left: 0;
                    }
                    #am-wxt-keyword-modal .am-wxt-site-optimize-inline-row {
                        align-items: flex-start;
                    }
                    #am-wxt-keyword-modal .am-wxt-site-optimize-inline-input {
                        width: 100%;
                        justify-content: flex-start;
                    }
                    #am-wxt-keyword-modal .am-wxt-site-optimize-inline-input input {
                        width: min(220px, 100%);
                        flex: 1 1 auto;
                    }
                    #am-wxt-keyword-modal .am-wxt-site-optimize-config input {
                        width: min(220px, 100%);
                        flex: 1 1 auto;
                    }
                    #am-wxt-keyword-modal .am-wxt-crowd-target-toolbar {
                        align-items: flex-start;
                    }
                    #am-wxt-keyword-modal .am-wxt-crowd-target-view-tips {
                        margin-left: 0;
                    }
                    #am-wxt-keyword-modal .am-wxt-crowd-target-row {
                        grid-template-columns: 1fr;
                        gap: 6px;
                    }
                    #am-wxt-keyword-modal .am-wxt-crowd-target-actions {
                        justify-self: start;
                    }
                    #am-wxt-keyword-modal .am-wxt-smart-crowd-target-head,
                    #am-wxt-keyword-modal .am-wxt-smart-crowd-target-row {
                        grid-template-columns: 1fr;
                        gap: 8px;
                    }
                    #am-wxt-keyword-modal .am-wxt-smart-crowd-target-select {
                        width: 100%;
                    }
                    #am-wxt-keyword-modal .am-wxt-smart-crowd-target-help {
                        margin-left: 0;
                    }
                    #am-wxt-keyword-modal .am-wxt-manual-keyword-toolbar {
                        flex-direction: column;
                        align-items: flex-start;
                    }
                    #am-wxt-keyword-modal .am-wxt-manual-keyword-layout {
                        grid-template-columns: 1fr;
                    }
                    #am-wxt-keyword-modal .am-wxt-manual-keyword-head,
                    #am-wxt-keyword-modal .am-wxt-manual-keyword-item {
                        grid-template-columns: minmax(160px, 1.4fr) 1fr 1fr 1fr;
                    }
                    #am-wxt-keyword-modal .am-wxt-manual-keyword-head > :last-child,
                    #am-wxt-keyword-modal .am-wxt-manual-keyword-item > :last-child {
                        grid-column: 1 / -1;
                    }
                }

                #am-wxt-keyword-overlay {
                    --am-wxt-glass-border: rgba(255, 255, 255, 0.66);
                    --am-wxt-glass-bg: rgba(248, 250, 255, 0.72);
                    --am-wxt-soft-stroke: rgba(79, 102, 224, 0.24);
                    --am-wxt-surface: rgba(255, 255, 255, 0.85);
                    background: transparent;
                    backdrop-filter: none;
                    -webkit-backdrop-filter: none;
                }

                #am-wxt-keyword-overlay:not(.item-picker-open) {
                    background: transparent;
                    backdrop-filter: none;
                    -webkit-backdrop-filter: none;
                }

                #am-wxt-keyword-modal {
                    color: #1f2937;
                    background: linear-gradient(140deg, rgba(255, 255, 255, 0.92), rgba(240, 246, 255, 0.72));
                    border: 1px solid var(--am-wxt-glass-border);
                    box-shadow: 0 22px 56px rgba(15, 23, 42, 0.28);
                    border-radius: 18px;
                    backdrop-filter: blur(10px);
                    -webkit-backdrop-filter: blur(10px);
                    overflow: hidden;
                }

                #am-wxt-keyword-modal .am-wxt-header {
                    height: 52px;
                    padding: 0 18px;
                    background: linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(245, 250, 255, 0.9));
                    border-bottom: 1px solid var(--am-wxt-soft-stroke);
                    color: #1d4ed8;
                    box-shadow: 0 10px 16px rgba(15, 23, 42, 0.04);
                }

                #am-wxt-keyword-modal .am-wxt-close {
                    width: 32px;
                    height: 32px;
                    border-radius: 8px;
                    color: #4b5563;
                    background: transparent;
                }

                #am-wxt-keyword-modal .am-wxt-close:hover {
                    background: rgba(234, 79, 79, 0.1);
                    color: var(--am26-danger, #ea4f4f);
                }

                #am-wxt-keyword-modal .am-wxt-body {
                    background: transparent;
                    padding: 12px;
                }

                #am-wxt-keyword-modal .am-wxt-workbench-tabs {
                    display: inline-flex;
                    gap: 6px;
                    padding: 10px 10px 0;
                    flex-wrap: wrap;
                    border-bottom: 0;
                }

                #am-wxt-keyword-modal .am-wxt-workbench-tabs .am-wxt-btn {
                    border: 1px solid rgba(79, 104, 255, 0.2);
                    border-radius: 999px;
                    background: rgba(255, 255, 255, 0.82);
                    color: #334155;
                    padding: 7px 14px;
                    min-height: 30px;
                    font-weight: 600;
                }

                #am-wxt-keyword-modal .am-wxt-workbench-tabs .am-wxt-btn.primary {
                    background: linear-gradient(135deg, #4f68ff, #3754d2);
                    border-color: rgba(79, 104, 255, 0.55);
                    color: #ffffff;
                    box-shadow: 0 8px 18px rgba(79, 104, 255, 0.28);
                }

                #am-wxt-keyword-modal .am-wxt-split {
                    gap: 12px;
                }

                #am-wxt-keyword-modal .am-wxt-panel,
                #am-wxt-keyword-modal .am-wxt-config,
                #am-wxt-keyword-modal .am-wxt-matrix-card,
                #am-wxt-keyword-modal .am-wxt-strategy-board,
                #am-wxt-keyword-modal .am-wxt-matrix-dimension-row,
                #am-wxt-keyword-modal .am-wxt-manual-keyword-panel {
                    border: 1px solid rgba(255, 255, 255, 0.65);
                    border-radius: 16px;
                    background: linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(244, 248, 255, 0.86));
                    backdrop-filter: blur(8px);
                    -webkit-backdrop-filter: blur(8px);
                    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
                }

                #am-wxt-keyword-modal .am-wxt-toolbar {
                    border-bottom: 1px solid rgba(148, 163, 184, 0.24);
                    background: linear-gradient(180deg, rgba(255, 255, 255, 0.82), rgba(248, 250, 255, 0.8));
                    border-top-left-radius: 16px;
                    border-top-right-radius: 16px;
                }

                #am-wxt-keyword-modal .am-wxt-list {
                    background: rgba(255, 255, 255, 0.25);
                }

                #am-wxt-keyword-modal .am-wxt-toolbar input:not([type="checkbox"]):not([type="radio"]),
                #am-wxt-keyword-modal .am-wxt-config input:not([type="checkbox"]):not([type="radio"]),
                #am-wxt-keyword-modal .am-wxt-config select,
                #am-wxt-keyword-modal .am-wxt-config textarea,
                #am-wxt-keyword-modal .am-wxt-setting-control select {
                    border: 1px solid rgba(148, 163, 184, 0.58);
                    border-radius: 10px;
                    background: rgba(255, 255, 255, 0.96);
                }

                #am-wxt-keyword-modal .am-wxt-toolbar input:focus,
                #am-wxt-keyword-modal .am-wxt-config input:focus,
                #am-wxt-keyword-modal .am-wxt-config select:focus,
                #am-wxt-keyword-modal .am-wxt-config textarea:focus,
                #am-wxt-keyword-modal .am-wxt-setting-control select:focus {
                    border-color: rgba(79, 104, 255, 0.6);
                    box-shadow: 0 0 0 3px rgba(79, 104, 255, 0.14);
                    outline: none;
                }

                #am-wxt-keyword-modal .am-wxt-btn {
                    border-radius: 999px;
                    border-color: rgba(79, 104, 255, 0.34);
                    background: rgba(255, 255, 255, 0.88);
                    color: #334155;
                    padding: 7px 12px;
                    min-height: 30px;
                    line-height: 1;
                    transition: all 0.2s ease;
                }

                #am-wxt-keyword-modal .am-wxt-btn:hover {
                    border-color: rgba(79, 104, 255, 0.56);
                    transform: translateY(-1px);
                }

                #am-wxt-keyword-modal .am-wxt-btn:focus-visible {
                    outline: 2px solid rgba(79, 104, 255, 0.45);
                    outline-offset: 1px;
                }

                #am-wxt-keyword-modal .am-wxt-btn.primary {
                    color: #ffffff;
                    background: linear-gradient(135deg, #4554e5, #4f68ff);
                    border-color: rgba(79, 104, 255, 0.65);
                    box-shadow: 0 8px 18px rgba(79, 104, 255, 0.24);
                }

                #am-wxt-keyword-modal .am-wxt-detail-title,
                #am-wxt-keyword-modal .am-wxt-crowd-title {
                    color: #334155;
                    font-size: 12px;
                    letter-spacing: 0.01em;
                }

                #am-wxt-keyword-detail-config {
                    color: var(--am26-text, #1b2438);
                    background: var(--am26-panel-strong, linear-gradient(135deg, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.2)));
                    border: 1px solid var(--am26-border-strong, rgba(255, 255, 255, 0.6));
                    border-radius: 18px;
                    box-shadow: var(--am26-shadow, 0 8px 32px rgba(31, 38, 135, 0.15));
                    backdrop-filter: blur(18px) saturate(1.35);
                    -webkit-backdrop-filter: blur(18px) saturate(1.35);
                }

                #am-wxt-keyword-detail-config .am-wxt-detail-title,
                #am-wxt-keyword-detail-config .am-wxt-detail-footer {
                    background: var(--am26-surface-strong, rgba(255, 255, 255, 0.45));
                    color: var(--am26-text, #1b2438);
                    border-color: var(--am26-border, rgba(255, 255, 255, 0.4));
                    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.28);
                }

                #am-wxt-keyword-modal #am-wxt-workbench-preview-log,
                #am-wxt-keyword-quick-log,
                #am-wxt-keyword-log,
                #am-wxt-keyword-preview {
                    border-radius: 12px;
                    border-color: rgba(148, 163, 184, 0.35);
                    background: linear-gradient(180deg, rgba(255, 255, 255, 0.9), rgba(244, 248, 255, 0.82));
                    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9);
                }

                #am-wxt-keyword-modal .am-wxt-run-mode-wrap {
                    margin-top: 4px;
                }

                #am-wxt-keyword-modal .am-wxt-run-mode-menu,
                #am-wxt-keyword-run-mode-menu.am-wxt-run-mode-menu {
                    border: 1px solid var(--am26-border-strong, rgba(255, 255, 255, 0.6));
                    background: var(--am26-panel-strong, linear-gradient(135deg, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.2)));
                    backdrop-filter: blur(12px) saturate(1.25);
                    -webkit-backdrop-filter: blur(12px) saturate(1.25);
                    box-shadow: var(--am26-shadow, 0 8px 32px 0 rgba(31, 38, 135, 0.15));
                }

                #am-wxt-keyword-overlay #am-wxt-keyword-detail-backdrop {
                    background: rgba(255, 255, 255, 0.72);
                    backdrop-filter: blur(8px) saturate(1.15);
                    -webkit-backdrop-filter: blur(8px) saturate(1.15);
                }

                #am-wxt-keyword-detail-config .am-wxt-inline-check,
                #am-wxt-keyword-modal .am-wxt-inline-check {
                    border-radius: 999px;
                }

                #am-wxt-keyword-modal .am-wxt-inline-check input[type="checkbox"] {
                    width: 16px;
                    height: 16px;
                    border-radius: 4px;
                }

                #am-wxt-keyword-modal .am-wxt-crowd-list .am-wxt-crowd-item {
                    border-bottom-color: rgba(100, 116, 139, 0.22);
                    padding: 6px 0;
                }

                #am-wxt-keyword-modal .am-wxt-strategy-item {
                    border: 1px solid rgba(255, 255, 255, 0.72);
                    border-radius: 12px;
                    background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(247, 250, 255, 0.9));
                    box-shadow: 0 8px 18px rgba(15, 23, 42, 0.06);
                }

                #am-wxt-keyword-modal .am-wxt-item {
                    border-radius: 10px;
                    border-color: rgba(148, 163, 184, 0.26);
                    background: rgba(255, 255, 255, 0.9);
                    box-shadow: 0 3px 8px rgba(15, 23, 42, 0.04);
                }

                #am-wxt-keyword-modal .am-wxt-strategy-summary,
                #am-wxt-keyword-modal .am-wxt-matrix-stat {
                    border-radius: 999px;
                    border-color: rgba(148, 163, 184, 0.3);
                    background: rgba(241, 245, 249, 0.9);
                }

                #am-wxt-keyword-modal .am-wxt-matrix-dimension-add-card,
                #am-wxt-keyword-modal .am-wxt-matrix-empty-state {
                    border-radius: 14px;
                    background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(244, 249, 255, 0.9));
                }

                #am-wxt-keyword-overlay {
                    --am-wxt-primary: var(--am26-primary, #4554e5);
                    --am-wxt-primary-soft: rgba(69, 84, 229, 0.1);
                    --am-wxt-border: var(--am26-border, rgba(255, 255, 255, 0.4));
                    --am-wxt-muted-border: rgba(255, 255, 255, 0.48);
                    --am-wxt-text: var(--am26-text, #1b2438);
                    --am-wxt-muted: var(--am26-text-soft, #505a74);
                }

                #am-wxt-keyword-overlay:not(.item-picker-open) {
                    background: linear-gradient(135deg, rgba(255, 255, 255, 0.78), rgba(255, 255, 255, 0.48));
                    backdrop-filter: blur(8px) saturate(1.15);
                    -webkit-backdrop-filter: blur(8px) saturate(1.15);
                }

                #am-wxt-keyword-overlay.item-picker-open {
                    background: transparent;
                    backdrop-filter: none;
                    -webkit-backdrop-filter: none;
                }

                #am-wxt-keyword-modal {
                    width: min(1320px, calc(100vw - 48px));
                    color: var(--am26-text, #1b2438);
                    background: var(--am26-panel-strong, linear-gradient(135deg, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.2)));
                    border: 1px solid var(--am26-border-strong, rgba(255, 255, 255, 0.6));
                    border-radius: 18px;
                    box-shadow: var(--am26-shadow, 0 8px 32px 0 rgba(31, 38, 135, 0.15));
                    backdrop-filter: blur(20px) saturate(1.4);
                    -webkit-backdrop-filter: blur(20px) saturate(1.4);
                    font-family: var(--am26-font, "SF Pro Display", "SF Pro Text", "PingFang SC", "Microsoft YaHei", sans-serif);
                }

                #am-wxt-keyword-modal .am-wxt-header {
                    height: 48px;
                    padding: 0 16px;
                    background: linear-gradient(135deg, rgba(255, 255, 255, 0.56), rgba(255, 255, 255, 0.24));
                    border-bottom: 1px solid var(--am26-border, rgba(255, 255, 255, 0.4));
                    color: var(--am26-text, #1b2438);
                    box-shadow: 0 1px 0 rgba(255, 255, 255, 0.28);
                }

                #am-wxt-keyword-modal .am-wxt-header-main {
                    display: inline-flex;
                    align-items: center;
                    gap: 10px;
                    min-width: 0;
                    font-weight: 700;
                }

                #am-wxt-keyword-modal .am-wxt-close {
                    width: 32px;
                    height: 32px;
                    border-radius: 8px;
                    color: var(--am26-text-soft, #505a74);
                    background: transparent !important;
                    border: 0;
                    box-shadow: none !important;
                    transition: background 0.16s ease, color 0.16s ease, box-shadow 0.16s ease;
                }

                #am-wxt-keyword-modal .am-wxt-close:hover {
                    background: rgba(234, 79, 79, 0.1) !important;
                    color: var(--am26-danger, #ea4f4f);
                }

                #am-wxt-keyword-modal .am-wxt-title {
                    margin: 0;
                    min-width: 0;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    font-size: 14px;
                    line-height: 20px;
                    font-weight: 700;
                    letter-spacing: 0;
                }

                #am-wxt-keyword-modal .am-wxt-runtime-pill {
                    display: inline-flex;
                    align-items: center;
                    min-height: 22px;
                    padding: 0 9px;
                    border: 1px solid rgba(69, 84, 229, 0.22);
                    border-radius: 999px;
                    background: rgba(69, 84, 229, 0.08);
                    color: var(--am26-primary, #4554e5);
                    font-size: 11px;
                    font-weight: 600;
                    white-space: nowrap;
                }

                #am-wxt-keyword-modal .am-wxt-body {
                    padding: 12px;
                    background: transparent;
                }

                #am-wxt-keyword-modal .am-wxt-workbench-tabs {
                    display: flex;
                    gap: 18px;
                    padding: 0 16px;
                    min-height: 42px;
                    align-items: flex-end;
                    border-bottom: 1px solid var(--am26-border, rgba(255, 255, 255, 0.4));
                    background: transparent;
                }

                #am-wxt-keyword-modal .am-wxt-workbench-tabs .am-wxt-btn {
                    position: relative;
                    min-height: 40px;
                    padding: 0 0 10px;
                    border: 0;
                    border-radius: 0;
                    background: transparent;
                    box-shadow: none;
                    color: #475569;
                    font-weight: 600;
                    transform: none;
                }

                #am-wxt-keyword-modal .am-wxt-workbench-tabs .am-wxt-btn::after {
                    content: "";
                    position: absolute;
                    left: 0;
                    right: 0;
                    bottom: -1px;
                    height: 2px;
                    border-radius: 999px 999px 0 0;
                    background: transparent;
                }

                #am-wxt-keyword-modal .am-wxt-workbench-tabs .am-wxt-btn.primary {
                    color: var(--am-wxt-primary);
                    background: transparent;
                    border: 0;
                    box-shadow: none;
                }

                #am-wxt-keyword-modal .am-wxt-workbench-tabs .am-wxt-btn.primary::after {
                    background: var(--am-wxt-primary);
                }

                #am-wxt-keyword-modal .am-wxt-btn {
                    min-height: 32px;
                    padding: 0 12px;
                    border-radius: 8px;
                    border: 1px solid rgba(69, 84, 229, 0.2);
                    background: rgba(255, 255, 255, 0.46);
                    color: var(--am26-text-soft, #505a74);
                    box-shadow: none;
                    line-height: 30px;
                    transform: none;
                    transition: border-color 0.16s ease, background 0.16s ease, color 0.16s ease, box-shadow 0.16s ease;
                }

                #am-wxt-keyword-modal .am-wxt-btn:hover {
                    border-color: rgba(69, 84, 229, 0.42);
                    background: rgba(255, 255, 255, 0.68);
                    transform: none;
                }

                #am-wxt-keyword-modal .am-wxt-btn:focus-visible,
                #am-wxt-keyword-modal .am-wxt-close:focus-visible {
                    outline: 2px solid rgba(37, 99, 235, 0.45);
                    outline-offset: 2px;
                    box-shadow: 0 0 0 4px rgba(69, 84, 229, 0.12);
                }

                #am-wxt-keyword-modal .am-wxt-btn.primary {
                    background: linear-gradient(135deg, var(--am26-primary, #4554e5), var(--am26-primary-strong, #1d3fcf));
                    border-color: rgba(69, 84, 229, 0.68);
                    color: #fff;
                    box-shadow: 0 8px 18px rgba(69, 84, 229, 0.18);
                }

                #am-wxt-keyword-modal .am-wxt-home-summary {
                    display: grid;
                    grid-template-columns: repeat(3, minmax(0, 1fr));
                    gap: 14px;
                    margin-bottom: 12px;
                }

                #am-wxt-keyword-modal .am-wxt-home-stat {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 10px;
                    min-height: 54px;
                    padding: 10px 14px;
                    border: 1px solid var(--am26-border, rgba(255, 255, 255, 0.4));
                    border-radius: 8px;
                    background: var(--am26-surface-strong, rgba(255, 255, 255, 0.45));
                    box-sizing: border-box;
                    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.32);
                }

                #am-wxt-keyword-modal .am-wxt-home-stat-label {
                    color: var(--am26-text-soft, #505a74);
                    font-size: 12px;
                    white-space: nowrap;
                }

                #am-wxt-keyword-modal .am-wxt-home-stat strong {
                    color: var(--am26-primary-strong, #1d3fcf);
                    font-size: 18px;
                    font-weight: 750;
                    line-height: 1.1;
                    white-space: nowrap;
                }

                #am-wxt-keyword-modal .am-wxt-home-stat strong small {
                    margin-left: 2px;
                    color: var(--am26-text, #1b2438);
                    font-size: 14px;
                    font-weight: 700;
                }

                #am-wxt-keyword-modal .am-wxt-panel,
                #am-wxt-keyword-modal .am-wxt-config,
                #am-wxt-keyword-modal .am-wxt-matrix-card,
                #am-wxt-keyword-modal .am-wxt-strategy-board,
                #am-wxt-keyword-modal .am-wxt-matrix-dimension-row,
                #am-wxt-keyword-modal .am-wxt-manual-keyword-panel {
                    border: 1px solid var(--am26-border, rgba(255, 255, 255, 0.4));
                    border-radius: 8px;
                    background: var(--am26-surface, rgba(255, 255, 255, 0.25));
                    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.26);
                    backdrop-filter: blur(10px) saturate(1.15);
                    -webkit-backdrop-filter: blur(10px) saturate(1.15);
                }

                #am-wxt-keyword-modal #am-wxt-keyword-detail-config {
                    color: var(--am26-text, #1b2438);
                    background: var(--am26-panel-strong, linear-gradient(135deg, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.2)));
                    border: 1px solid var(--am26-border-strong, rgba(255, 255, 255, 0.6));
                    border-radius: 18px;
                    box-shadow: var(--am26-shadow, 0 8px 32px rgba(31, 38, 135, 0.15));
                    backdrop-filter: blur(18px) saturate(1.35);
                    -webkit-backdrop-filter: blur(18px) saturate(1.35);
                }

                #am-wxt-keyword-modal .am-wxt-toolbar {
                    min-height: 42px;
                    padding: 8px 10px;
                    border-bottom: 1px solid var(--am26-border, rgba(255, 255, 255, 0.4));
                    border-radius: 8px 8px 0 0;
                    background: var(--am26-surface, rgba(255, 255, 255, 0.25));
                }

                #am-wxt-keyword-modal .am-wxt-product-toolbar {
                    justify-content: space-between;
                    gap: 12px;
                    padding: 8px 12px;
                }

                #am-wxt-keyword-modal .am-wxt-toolbar-actions {
                    display: inline-flex;
                    align-items: center;
                    justify-content: flex-end;
                    gap: 6px;
                    flex-wrap: wrap;
                }

                #am-wxt-keyword-modal .am-wxt-toolbar input:not([type="checkbox"]):not([type="radio"]),
                #am-wxt-keyword-modal .am-wxt-config input:not([type="checkbox"]):not([type="radio"]),
                #am-wxt-keyword-modal .am-wxt-config select,
                #am-wxt-keyword-modal .am-wxt-config textarea,
                #am-wxt-keyword-modal .am-wxt-setting-control select,
                #am-wxt-keyword-modal .am-wxt-strategy-search-input {
                    min-height: 32px;
                    border: 1px solid var(--am26-border, rgba(255, 255, 255, 0.4));
                    border-radius: 8px;
                    background: var(--am26-surface-strong, rgba(255, 255, 255, 0.45));
                    color: var(--am26-text, #1b2438);
                    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.3);
                }

                #am-wxt-keyword-modal .am-wxt-toolbar input:not([type="checkbox"]):not([type="radio"])::placeholder,
                #am-wxt-keyword-modal .am-wxt-config input:not([type="checkbox"]):not([type="radio"])::placeholder,
                #am-wxt-keyword-modal .am-wxt-config textarea::placeholder,
                #am-wxt-keyword-modal .am-wxt-strategy-search-input::placeholder {
                    color: rgba(80, 90, 116, 0.62);
                }

                #am-wxt-keyword-modal .am-wxt-toolbar input:not([type="checkbox"]):not([type="radio"]):focus,
                #am-wxt-keyword-modal .am-wxt-config input:not([type="checkbox"]):not([type="radio"]):focus,
                #am-wxt-keyword-modal .am-wxt-config select:focus,
                #am-wxt-keyword-modal .am-wxt-config textarea:focus,
                #am-wxt-keyword-modal .am-wxt-setting-control select:focus,
                #am-wxt-keyword-modal .am-wxt-strategy-search-input:focus {
                    outline: none;
                    border-color: rgba(69, 84, 229, 0.42);
                    background: rgba(255, 255, 255, 0.62);
                    box-shadow: 0 0 0 3px rgba(69, 84, 229, 0.12);
                }

                #am-wxt-keyword-modal #am-wxt-keyword-search-input {
                    border: 1px solid var(--am26-border, rgba(255, 255, 255, 0.4));
                    background: var(--am26-surface-strong, rgba(255, 255, 255, 0.45));
                    color: var(--am26-text, #1b2438);
                    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.3);
                }

                #am-wxt-keyword-modal #am-wxt-keyword-search-input::placeholder {
                    color: rgba(80, 90, 116, 0.62);
                }

                #am-wxt-keyword-modal #am-wxt-keyword-search-input:focus {
                    outline: none;
                    border-color: rgba(69, 84, 229, 0.42);
                    background: rgba(255, 255, 255, 0.62);
                    box-shadow: 0 0 0 3px rgba(69, 84, 229, 0.12);
                }

                #am-wxt-keyword-modal .am-wxt-item {
                    border-radius: 8px;
                    border-color: var(--am26-border, rgba(255, 255, 255, 0.4));
                    background: var(--am26-surface-strong, rgba(255, 255, 255, 0.45));
                    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.24);
                }

                #am-wxt-keyword-modal #am-wxt-keyword-added-list {
                    min-height: 72px;
                    height: 72px;
                    max-height: 72px;
                }

                #am-wxt-keyword-modal .am-wxt-strategy-board {
                    margin-top: 10px;
                    padding: 0;
                    overflow: hidden;
                }

                #am-wxt-keyword-modal .am-wxt-strategy-head {
                    display: grid;
                    grid-template-columns: minmax(180px, auto) minmax(260px, 1fr) auto;
                    align-items: center;
                    gap: 10px;
                    margin: 0;
                    padding: 12px;
                    border-bottom: 1px solid var(--am26-border, rgba(255, 255, 255, 0.4));
                    background: var(--am26-surface, rgba(255, 255, 255, 0.25));
                }

                #am-wxt-keyword-modal .am-wxt-strategy-section-title {
                    color: var(--am26-text, #1b2438);
                    font-size: 13px;
                    font-weight: 700;
                    white-space: nowrap;
                }

                #am-wxt-keyword-modal .am-wxt-strategy-head-main,
                #am-wxt-keyword-modal .am-wxt-strategy-head-tools,
                #am-wxt-keyword-modal .am-wxt-strategy-head-actions {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    min-width: 0;
                    flex-wrap: wrap;
                }

                #am-wxt-keyword-modal .am-wxt-strategy-head-tools {
                    justify-content: flex-end;
                    flex: initial;
                }

                #am-wxt-keyword-modal .am-wxt-strategy-head-actions {
                    justify-content: flex-end;
                }

                #am-wxt-keyword-modal .am-wxt-strategy-head-actions .am-wxt-btn,
                #am-wxt-keyword-modal #am-wxt-keyword-batch-edit-strategy,
                #am-wxt-keyword-modal #am-wxt-keyword-clear-strategy {
                    border: 1px solid var(--am26-border, rgba(255, 255, 255, 0.4));
                    background: var(--am26-surface-strong, rgba(255, 255, 255, 0.45));
                    color: var(--am26-text-soft, #505a74);
                    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.32);
                }

                #am-wxt-keyword-modal .am-wxt-strategy-head-actions .am-wxt-btn:hover,
                #am-wxt-keyword-modal .am-wxt-strategy-head-actions .am-wxt-btn:focus-visible {
                    border-color: rgba(69, 84, 229, 0.42);
                    background: rgba(255, 255, 255, 0.72);
                    color: var(--am26-text, #1b2438);
                    box-shadow: 0 0 0 3px rgba(69, 84, 229, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.36);
                }

                #am-wxt-keyword-modal .am-wxt-strategy-head-actions .am-wxt-btn:disabled,
                #am-wxt-keyword-modal #am-wxt-keyword-batch-edit-strategy:disabled,
                #am-wxt-keyword-modal #am-wxt-keyword-clear-strategy:disabled {
                    border-color: var(--am26-border, rgba(255, 255, 255, 0.4));
                    background: var(--am26-surface, rgba(255, 255, 255, 0.25));
                    color: rgba(80, 90, 116, 0.62);
                    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.22);
                    opacity: 1;
                    cursor: not-allowed;
                }

                #am-wxt-keyword-modal .am-wxt-strategy-search-input {
                    width: min(280px, 100%);
                    padding: 0 10px;
                    color: var(--am26-text, #1b2438);
                    background: var(--am26-surface-strong, rgba(255, 255, 255, 0.45));
                }

                #am-wxt-keyword-modal .am-wxt-strategy-search-input::placeholder {
                    color: rgba(80, 90, 116, 0.62);
                }

                #am-wxt-keyword-modal .am-wxt-strategy-list {
                    display: flex;
                    flex-direction: column;
                    gap: 0;
                    background: transparent;
                }

                #am-wxt-keyword-modal .am-wxt-strategy-list-head,
                #am-wxt-keyword-modal .am-wxt-strategy-main {
                    display: grid;
                    grid-template-columns: 28px minmax(180px, 1.05fr) minmax(190px, 0.95fr) minmax(220px, 1fr) minmax(120px, 0.55fr) minmax(180px, auto);
                    gap: 10px;
                    align-items: center;
                }

                #am-wxt-keyword-modal .am-wxt-strategy-list-head {
                    min-height: 34px;
                    padding: 0 12px;
                    border-bottom: 1px solid var(--am26-border, rgba(255, 255, 255, 0.4));
                    color: var(--am26-text-soft, #505a74);
                    font-size: 11px;
                    font-weight: 600;
                    background: var(--am26-surface, rgba(255, 255, 255, 0.25));
                }

                #am-wxt-keyword-modal .am-wxt-strategy-item {
                    border: 0;
                    border-bottom: 1px solid var(--am26-border, rgba(255, 255, 255, 0.4));
                    border-radius: 0;
                    padding: 0;
                    background: transparent;
                    box-shadow: none;
                }

                #am-wxt-keyword-modal .am-wxt-strategy-main {
                    min-height: 52px;
                    padding: 8px 12px;
                    box-sizing: border-box;
                }

                #am-wxt-keyword-modal .am-wxt-strategy-check {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                }

                #am-wxt-keyword-modal .am-wxt-strategy-name {
                    display: flex;
                    align-items: center;
                    min-width: 0;
                    color: var(--am26-text, #1b2438);
                    font-size: 12px;
                    font-weight: 700;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                #am-wxt-keyword-modal .am-wxt-strategy-name .am-wxt-strategy-inline-view {
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                    overflow-wrap: anywhere;
                    white-space: normal;
                    line-height: 1.35;
                }

                #am-wxt-keyword-modal .am-wxt-strategy-inline-edit {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    width: 100%;
                    min-width: 0;
                }

                #am-wxt-keyword-modal .am-wxt-strategy-inline-view {
                    min-width: 0;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                #am-wxt-keyword-modal .am-wxt-strategy-inline-input {
                    display: none;
                    width: 100%;
                    min-width: 0;
                    height: 28px;
                    box-sizing: border-box;
                    padding: 0 8px;
                    border: 1px solid var(--am26-border, rgba(255, 255, 255, 0.4));
                    border-radius: 6px;
                    background: var(--am26-surface-strong, rgba(255, 255, 255, 0.45));
                    color: var(--am26-text, #1b2438);
                    font-size: 12px;
                    font-weight: 600;
                    line-height: 26px;
                    outline: none;
                }

                #am-wxt-keyword-modal .am-wxt-strategy-inline-input:focus {
                    border-color: rgba(69, 84, 229, 0.42);
                    background: rgba(255, 255, 255, 0.62);
                    box-shadow: 0 0 0 3px rgba(69, 84, 229, 0.12);
                }

                #am-wxt-keyword-modal .am-wxt-strategy-budget-input {
                    max-width: 82px;
                    text-align: right;
                }

                #am-wxt-keyword-modal .am-wxt-strategy-inline-edit.is-editing .am-wxt-strategy-inline-view {
                    display: none;
                }

                #am-wxt-keyword-modal .am-wxt-strategy-inline-edit.is-editing .am-wxt-strategy-inline-input {
                    display: block;
                }

                #am-wxt-keyword-modal .am-wxt-strategy-inline-edit-btn {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    flex: 0 0 24px;
                    width: 24px;
                    height: 24px;
                    padding: 0;
                    border: 0;
                    border-radius: 6px;
                    background: transparent;
                    color: var(--am26-text-soft, #505a74);
                    cursor: pointer;
                    opacity: 0;
                    visibility: hidden;
                    transition: color 0.16s ease, background 0.16s ease, opacity 0.16s ease;
                }

                #am-wxt-keyword-modal .am-wxt-strategy-inline-edit-btn:hover,
                #am-wxt-keyword-modal .am-wxt-strategy-inline-edit-btn:focus-visible {
                    background: var(--am26-surface-strong, rgba(255, 255, 255, 0.45));
                    color: var(--am26-primary-strong, #1d3fcf);
                    outline: none;
                    box-shadow: 0 0 0 3px rgba(69, 84, 229, 0.12);
                }

                #am-wxt-keyword-modal .am-wxt-strategy-item:hover .am-wxt-strategy-inline-edit-btn,
                #am-wxt-keyword-modal .am-wxt-strategy-item:focus-within .am-wxt-strategy-inline-edit-btn,
                #am-wxt-keyword-modal .am-wxt-strategy-inline-edit.is-editing .am-wxt-strategy-inline-edit-btn {
                    opacity: 1;
                    visibility: visible;
                }

                #am-wxt-keyword-modal .am-wxt-strategy-tags {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    min-width: 0;
                    flex-wrap: nowrap;
                }

                #am-wxt-keyword-modal .am-wxt-strategy-tag {
                    display: inline-flex;
                    align-items: center;
                    max-width: 100%;
                    min-height: 22px;
                    padding: 0 7px;
                    border: 1px solid var(--am-wxt-strategy-tag-border, #dbeafe);
                    border-radius: 999px;
                    background: var(--am-wxt-strategy-tag-bg, #eff6ff);
                    color: var(--am-wxt-strategy-tag-text, #1d4ed8);
                    font-size: 11px;
                    font-weight: var(--am-wxt-strategy-tag-weight, 650);
                    line-height: 20px;
                    white-space: nowrap;
                }

                #am-wxt-keyword-modal .am-wxt-strategy-tag-scene {
                    --am-wxt-strategy-tag-weight: 700;
                }

                #am-wxt-keyword-modal .am-wxt-strategy-tag-goal {
                    --am-wxt-strategy-tag-weight: 650;
                }

                #am-wxt-keyword-modal .am-wxt-strategy-tag-bid {
                    --am-wxt-strategy-tag-weight: 600;
                }

                #am-wxt-keyword-modal .am-wxt-strategy-tag-tone-keyword {
                    --am-wxt-strategy-tag-bg: #dbeafe;
                    --am-wxt-strategy-tag-border: #93c5fd;
                    --am-wxt-strategy-tag-text: #1d4ed8;
                }

                #am-wxt-keyword-modal .am-wxt-strategy-tag-tone-trend {
                    --am-wxt-strategy-tag-bg: #ecfeff;
                    --am-wxt-strategy-tag-border: #67e8f9;
                    --am-wxt-strategy-tag-text: #0e7490;
                }

                #am-wxt-keyword-modal .am-wxt-strategy-tag-tone-search {
                    --am-wxt-strategy-tag-bg: #eef2ff;
                    --am-wxt-strategy-tag-border: #c7d2fe;
                    --am-wxt-strategy-tag-text: #4338ca;
                }

                #am-wxt-keyword-modal .am-wxt-strategy-tag-tone-traffic,
                #am-wxt-keyword-modal .am-wxt-strategy-tag-tone-site {
                    --am-wxt-strategy-tag-bg: #fffbeb;
                    --am-wxt-strategy-tag-border: #fde68a;
                    --am-wxt-strategy-tag-text: #b45309;
                }

                #am-wxt-keyword-modal .am-wxt-strategy-tag-tone-custom,
                #am-wxt-keyword-modal .am-wxt-strategy-tag-tone-crowd {
                    --am-wxt-strategy-tag-bg: #ecfdf5;
                    --am-wxt-strategy-tag-border: #a7f3d0;
                    --am-wxt-strategy-tag-text: #047857;
                }

                #am-wxt-keyword-modal .am-wxt-strategy-tag-tone-lead {
                    --am-wxt-strategy-tag-bg: #fdf2f8;
                    --am-wxt-strategy-tag-border: #fbcfe8;
                    --am-wxt-strategy-tag-text: #be185d;
                }

                #am-wxt-keyword-modal .am-wxt-strategy-tag-tone-smart {
                    --am-wxt-strategy-tag-bg: #f5f3ff;
                    --am-wxt-strategy-tag-border: #ddd6fe;
                    --am-wxt-strategy-tag-text: #6d28d9;
                }

                #am-wxt-keyword-modal .am-wxt-strategy-tag-tone-manual {
                    --am-wxt-strategy-tag-bg: #fff7ed;
                    --am-wxt-strategy-tag-border: #fed7aa;
                    --am-wxt-strategy-tag-text: #c2410c;
                }

                #am-wxt-keyword-modal .am-wxt-strategy-tag-tone-goal,
                #am-wxt-keyword-modal .am-wxt-strategy-tag-tone-neutral {
                    --am-wxt-strategy-tag-bg: #f8fafc;
                    --am-wxt-strategy-tag-border: #cbd5e1;
                    --am-wxt-strategy-tag-text: #475569;
                }

                #am-wxt-keyword-modal .am-wxt-strategy-target,
                #am-wxt-keyword-modal .am-wxt-strategy-budget,
                #am-wxt-keyword-modal .am-wxt-strategy-actions {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    min-width: 0;
                }

                #am-wxt-keyword-modal .am-wxt-strategy-actions {
                    justify-content: flex-end;
                    flex-wrap: nowrap;
                    opacity: 0;
                    visibility: hidden;
                    pointer-events: none;
                    transition: opacity 0.16s ease, visibility 0.16s ease;
                }

                #am-wxt-keyword-modal .am-wxt-strategy-item:hover .am-wxt-strategy-actions,
                #am-wxt-keyword-modal .am-wxt-strategy-item:focus-within .am-wxt-strategy-actions {
                    opacity: 1;
                    visibility: visible;
                    pointer-events: auto;
                }

                #am-wxt-keyword-modal .am-wxt-strategy-target {
                    flex-wrap: wrap;
                }

                #am-wxt-keyword-modal .am-wxt-strategy-budget {
                    justify-content: flex-start;
                }

                #am-wxt-keyword-modal .am-wxt-strategy-summary {
                    border: 0;
                    border-radius: 0;
                    background: transparent;
                    color: var(--am26-text-soft, #505a74);
                    font-size: 12px;
                    white-space: nowrap;
                }

                #am-wxt-keyword-modal .am-wxt-strategy-summary.muted {
                    color: rgba(80, 90, 116, 0.62);
                }

                #am-wxt-keyword-modal .am-wxt-strategy-target-cost {
                    min-height: 28px;
                    padding: 0 4px 0 8px;
                    border-radius: 8px;
                    border: 1px solid #bfdbfe;
                    background: #eff6ff;
                    color: #1e40af;
                    gap: 6px;
                }

                #am-wxt-keyword-modal .am-wxt-strategy-target-cost input {
                    min-height: 24px;
                    line-height: 22px;
                    border-radius: 6px;
                    background: #fff;
                }

                #am-wxt-keyword-modal .am-wxt-strategy-target-cost-field.with-unit input {
                    min-width: 52px;
                }

                #am-wxt-keyword-modal .am-wxt-strategy-target-cost-field.is-empty input {
                    border-color: #f59e0b;
                    background: #fffbeb;
                }

                #am-wxt-keyword-modal .am-wxt-strategy-actions .am-wxt-btn {
                    min-width: 56px;
                    padding: 0 9px;
                }

                #am-wxt-keyword-modal .am-wxt-strategy-action-secondary {
                    color: #475569;
                    background: #f8fafc;
                    border-color: #cbd5e1;
                }

                #am-wxt-keyword-modal .am-wxt-strategy-action-main {
                    color: #1d4ed8;
                    background: #eff6ff;
                    border-color: #bfdbfe;
                    font-weight: 600;
                }

                #am-wxt-keyword-modal .am-wxt-strategy-delete-btn {
                    color: #b91c1c;
                    background: #fff;
                    border-color: #fecaca;
                }

                #am-wxt-keyword-modal .am-wxt-strategy-delete-btn:hover {
                    color: #991b1b;
                    background: #fef2f2;
                    border-color: #fca5a5;
                }

                #am-wxt-keyword-modal .am-wxt-copy-multi {
                    border-radius: 999px;
                    background: var(--am26-surface, rgba(255,255,255,0.25));
                    border-color: var(--am26-border, rgba(255,255,255,0.4));
                    color: var(--am26-text-soft, #505a74);
                }

                #am-wxt-keyword-modal .am-wxt-run-mode-count {
                    border-radius: 999px;
                    background: var(--am26-surface, rgba(255,255,255,0.25));
                    border-color: var(--am26-border, rgba(255,255,255,0.4));
                    color: var(--am26-text-soft, #505a74);
                }

                #am-wxt-keyword-modal .am-wxt-strategy-footer {
                    position: sticky;
                    bottom: 0;
                    z-index: 2;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 12px;
                    padding: 12px;
                    border-top: 1px solid var(--am26-border, rgba(255,255,255,0.4));
                    background: var(--am26-surface-strong, rgba(255,255,255,0.45));
                    box-shadow: 0 -8px 18px rgba(31,38,135,0.06);
                }

                #am-wxt-keyword-modal .am-wxt-submit-summary {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    flex-wrap: wrap;
                    color: var(--am26-text-soft, #505a74);
                    font-size: 13px;
                    line-height: 1.4;
                }

                #am-wxt-keyword-modal .am-wxt-submit-summary span {
                    display: inline-flex;
                    align-items: center;
                    min-height: 24px;
                    white-space: nowrap;
                }

                #am-wxt-keyword-modal .am-wxt-submit-summary strong {
                    color: var(--am26-primary-strong, #1d3fcf);
                    font-size: 18px;
                    font-weight: 750;
                    margin: 0 3px;
                }

                #am-wxt-keyword-modal .am-wxt-primary-actions {
                    margin-top: 0;
                    justify-content: flex-end;
                    flex-wrap: nowrap;
                }

                #am-wxt-keyword-modal .am-wxt-run-mode-wrap {
                    margin-top: 0;
                }

                #am-wxt-keyword-modal .am-wxt-run-mode-wrap .am-wxt-btn.primary {
                    min-width: 120px;
                    padding-right: 30px;
                    font-weight: 700;
                }

                #am-wxt-keyword-modal .am-wxt-run-mode-toggle:hover {
                    transform: translateY(-50%) !important;
                }

                #am-wxt-keyword-modal .am-wxt-quick-log-panel {
                    padding: 10px;
                    border-top: 1px solid var(--am26-border, rgba(255,255,255,0.4));
                    background: var(--am26-surface, rgba(255,255,255,0.25));
                }

                #am-wxt-keyword-modal .am-wxt-quick-log-title {
                    margin-bottom: 6px;
                    color: var(--am26-text-soft, #505a74);
                    font-size: 12px;
                    font-weight: 700;
                }

                #am-wxt-keyword-quick-log {
                    margin-top: 0;
                    min-height: 82px;
                    max-height: 112px;
                    padding: 8px 10px;
                    border: 1px solid var(--am26-border, rgba(255,255,255,0.4));
                    border-radius: 8px;
                    background: var(--am26-surface, rgba(255,255,255,0.25));
                    box-shadow: inset 0 1px 0 rgba(255,255,255,0.42);
                }

                #am-wxt-keyword-quick-log .line {
                    min-height: 24px;
                    color: var(--am26-text-soft, #505a74);
                    line-height: 1.45;
                }

                #am-wxt-keyword-modal #am-wxt-keyword-previewlog-panel {
                    color: var(--am26-text, #1b2438);
                    border-color: var(--am26-border, rgba(255,255,255,0.4));
                    background: var(--am26-surface, rgba(255,255,255,0.25));
                    box-shadow: inset 0 1px 0 rgba(255,255,255,0.26);
                }

                #am-wxt-keyword-modal #am-wxt-keyword-previewlog-panel .am-wxt-crowd-box {
                    border: 1px solid var(--am26-border, rgba(255,255,255,0.4));
                    border-radius: 12px;
                    background: var(--am26-surface, rgba(255,255,255,0.25));
                    box-shadow: inset 0 1px 0 rgba(255,255,255,0.32);
                }

                #am-wxt-keyword-modal #am-wxt-keyword-previewlog-panel .am-wxt-crowd-title {
                    min-width: 0;
                    padding-bottom: 6px;
                    border-bottom: 1px dashed rgba(255,255,255,0.32);
                    color: var(--am26-text-soft, #505a74);
                }

                #am-wxt-keyword-modal #am-wxt-keyword-previewlog-panel .am-wxt-crowd-title:last-child {
                    margin-bottom: 0;
                    padding-bottom: 0;
                    border-bottom: 0;
                }

                #am-wxt-keyword-modal #am-wxt-keyword-previewlog-panel .am-wxt-crowd-title span:last-child {
                    min-width: 0;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    color: var(--am26-text, #1b2438);
                    font-weight: 700;
                }

                #am-wxt-keyword-modal #am-wxt-workbench-preview-log,
                #am-wxt-keyword-modal #am-wxt-keyword-log,
                #am-wxt-keyword-modal #am-wxt-keyword-preview {
                    border: 1px solid var(--am26-border, rgba(255,255,255,0.4));
                    border-radius: 12px;
                    background: var(--am26-surface, rgba(255,255,255,0.25));
                    color: var(--am26-text-soft, #505a74);
                    box-shadow: inset 0 1px 0 rgba(255,255,255,0.42);
                }

                #am-wxt-keyword-modal #am-wxt-keyword-preview {
                    color: var(--am26-text, #1b2438);
                    font-family: Menlo, Consolas, monospace;
                }

                #am-wxt-keyword-modal #am-wxt-workbench-preview-log .line,
                #am-wxt-keyword-modal #am-wxt-keyword-log .line {
                    color: var(--am26-text-soft, #505a74);
                    line-height: 1.45;
                }

                #am-wxt-keyword-modal #am-wxt-workbench-preview-log .line.error,
                #am-wxt-keyword-modal #am-wxt-keyword-log .line.error {
                    color: var(--am26-danger, #ea4f4f);
                }

                #am-wxt-keyword-modal #am-wxt-workbench-preview-log .line.success,
                #am-wxt-keyword-modal #am-wxt-keyword-log .line.success {
                    color: var(--am26-success, #0ea86f);
                }

                #am-wxt-keyword-modal .am-wxt-matrix-dimension-picker-trigger,
                #am-wxt-keyword-modal .am-wxt-matrix-bid-package-target-picker .am-wxt-matrix-dimension-picker-trigger {
                    border: 1px solid var(--am26-border, rgba(255,255,255,0.4));
                    background: var(--am26-surface-strong, rgba(255,255,255,0.45));
                    color: var(--am26-text, #1b2438);
                    box-shadow: inset 0 1px 0 rgba(255,255,255,0.3);
                }

                #am-wxt-keyword-modal .am-wxt-matrix-dimension-picker-trigger:hover:not(:disabled),
                #am-wxt-keyword-modal .am-wxt-matrix-dimension-picker.open .am-wxt-matrix-dimension-picker-trigger,
                #am-wxt-keyword-modal .am-wxt-matrix-bid-package-target-picker .am-wxt-matrix-dimension-picker-trigger:hover,
                #am-wxt-keyword-modal .am-wxt-matrix-bid-package-target-picker.open .am-wxt-matrix-dimension-picker-trigger {
                    border-color: rgba(69,84,229,0.42);
                    background: rgba(255,255,255,0.68);
                    color: var(--am26-primary-strong, #1d3fcf);
                    box-shadow: 0 0 0 3px rgba(69,84,229,0.12), inset 0 1px 0 rgba(255,255,255,0.34);
                }

                #am-wxt-keyword-modal .am-wxt-matrix-dimension-picker-trigger:disabled {
                    border-color: var(--am26-border, rgba(255,255,255,0.4));
                    background: var(--am26-surface, rgba(255,255,255,0.25));
                    color: rgba(80,90,116,0.62);
                    box-shadow: inset 0 1px 0 rgba(255,255,255,0.22);
                }

                #am-wxt-keyword-modal .am-wxt-matrix-dimension-key-picker .am-wxt-matrix-dimension-picker-trigger,
                #am-wxt-keyword-modal .am-wxt-matrix-bid-package-target-picker .am-wxt-matrix-dimension-picker-trigger {
                    border-color: var(--am26-border, rgba(255,255,255,0.4));
                    background: rgba(69,84,229,0.10);
                    color: var(--am26-primary-strong, #1d3fcf);
                    box-shadow: inset 0 1px 0 rgba(255,255,255,0.28);
                }

                #am-wxt-keyword-modal .am-wxt-matrix-dimension-key-picker .am-wxt-matrix-dimension-picker-trigger:hover,
                #am-wxt-keyword-modal .am-wxt-matrix-dimension-key-picker.open .am-wxt-matrix-dimension-picker-trigger {
                    border-color: rgba(69,84,229,0.42);
                    background: rgba(69,84,229,0.14);
                    color: var(--am26-primary-strong, #1d3fcf);
                    box-shadow: 0 0 0 3px rgba(69,84,229,0.12), inset 0 1px 0 rgba(255,255,255,0.3);
                }

                #am-wxt-keyword-modal .am-wxt-matrix-dimension-picker-arrow {
                    color: var(--am26-text-soft, #505a74);
                    background-image: none;
                }

                #am-wxt-keyword-modal .am-wxt-matrix-dimension-picker-arrow::before {
                    content: "";
                    width: 8px;
                    height: 8px;
                    border-right: 2px solid currentColor;
                    border-bottom: 2px solid currentColor;
                    transform: translateY(-2px) rotate(45deg);
                    border-radius: 1px;
                }

                #am-wxt-keyword-modal .am-wxt-matrix-dimension-key-picker .am-wxt-matrix-dimension-picker-arrow {
                    color: var(--am26-primary-strong, #1d3fcf);
                    background-image: none;
                }

                #am-wxt-keyword-modal .am-wxt-matrix-dimension-picker-panel {
                    border: 1px solid var(--am26-border-strong, rgba(255,255,255,0.6));
                    background: var(--am26-panel-strong, linear-gradient(135deg, rgba(255,255,255,0.6), rgba(255,255,255,0.2)));
                    box-shadow: var(--am26-shadow, 0 8px 32px rgba(31,38,135,0.15));
                    backdrop-filter: blur(12px) saturate(1.25);
                    -webkit-backdrop-filter: blur(12px) saturate(1.25);
                }

                #am-wxt-keyword-modal .am-wxt-matrix-dimension-picker-option,
                #am-wxt-keyword-modal .am-wxt-matrix-bid-package-target-option,
                #am-wxt-keyword-modal .am-wxt-matrix-value-batch-option,
                #am-wxt-keyword-modal .am-wxt-matrix-bid-package-batch-option {
                    color: var(--am26-text-soft, #505a74);
                    background: transparent;
                }

                #am-wxt-keyword-modal .am-wxt-matrix-dimension-picker-option:hover,
                #am-wxt-keyword-modal .am-wxt-matrix-dimension-picker-option:has(input:checked),
                #am-wxt-keyword-modal .am-wxt-matrix-bid-package-target-option:hover,
                #am-wxt-keyword-modal .am-wxt-matrix-bid-package-target-option.is-active,
                #am-wxt-keyword-modal .am-wxt-matrix-value-batch-option:hover,
                #am-wxt-keyword-modal .am-wxt-matrix-bid-package-batch-option:hover {
                    background: var(--am26-surface-strong, rgba(255,255,255,0.45));
                    color: var(--am26-primary-strong, #1d3fcf);
                }

                #am-wxt-keyword-modal .am-wxt-matrix-dimension-picker-empty,
                #am-wxt-keyword-modal .am-wxt-matrix-bid-package-summary,
                #am-wxt-keyword-modal .am-wxt-matrix-bid-package-batch-note,
                #am-wxt-keyword-modal .am-wxt-matrix-bid-package-cost-meta {
                    color: var(--am26-text-soft, #505a74);
                }

                #am-wxt-keyword-modal .am-wxt-matrix-trend-theme-actions {
                    border-top: 1px solid var(--am26-border, rgba(255,255,255,0.4));
                }

                #am-wxt-keyword-modal .am-wxt-matrix-trend-theme-edit,
                #am-wxt-keyword-modal .am-wxt-matrix-value-batch-submit,
                #am-wxt-keyword-modal .am-wxt-matrix-bid-package-batch-submit {
                    border: 1px solid var(--am26-border, rgba(255,255,255,0.4));
                    background: rgba(69,84,229,0.10);
                    color: var(--am26-primary-strong, #1d3fcf);
                    box-shadow: inset 0 1px 0 rgba(255,255,255,0.28);
                }

                #am-wxt-keyword-modal .am-wxt-matrix-trend-theme-edit:hover,
                #am-wxt-keyword-modal .am-wxt-matrix-value-batch-submit:hover,
                #am-wxt-keyword-modal .am-wxt-matrix-bid-package-batch-submit:hover {
                    border-color: rgba(69,84,229,0.42);
                    background: rgba(69,84,229,0.14);
                    box-shadow: 0 0 0 3px rgba(69,84,229,0.12), inset 0 1px 0 rgba(255,255,255,0.3);
                }

                #am-wxt-keyword-modal .am-wxt-matrix-dimension-value-select,
                #am-wxt-keyword-modal .am-wxt-matrix-bid-package-cost-item,
                #am-wxt-keyword-modal .am-wxt-matrix-bid-package-batch-form input {
                    border: 1px solid var(--am26-border, rgba(255,255,255,0.4));
                    background: var(--am26-surface-strong, rgba(255,255,255,0.45));
                    color: var(--am26-text, #1b2438);
                    box-shadow: inset 0 1px 0 rgba(255,255,255,0.3);
                }

                #am-wxt-keyword-modal .am-wxt-matrix-dimension-value-select:disabled,
                #am-wxt-keyword-modal .am-wxt-matrix-value-batch-submit.is-disabled,
                #am-wxt-keyword-modal .am-wxt-matrix-value-batch-submit:disabled,
                #am-wxt-keyword-modal .am-wxt-matrix-bid-package-batch-submit.is-disabled,
                #am-wxt-keyword-modal .am-wxt-matrix-bid-package-batch-submit:disabled {
                    border-color: var(--am26-border, rgba(255,255,255,0.4));
                    background: var(--am26-surface, rgba(255,255,255,0.25));
                    color: rgba(80,90,116,0.62);
                    opacity: 1;
                    cursor: not-allowed;
                }

                #am-wxt-scene-popup-mask .am-wxt-scene-popup-dialog-submit-confirm {
                    width: min(520px, calc(100vw - 32px));
                }

                #am-wxt-scene-popup-mask .am-wxt-submit-confirm {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                #am-wxt-scene-popup-mask .am-wxt-submit-confirm-grid {
                    display: grid;
                    grid-template-columns: repeat(4, minmax(0, 1fr));
                    gap: 8px;
                }

                #am-wxt-scene-popup-mask .am-wxt-submit-confirm-stat {
                    min-width: 0;
                    padding: 10px;
                    border: 1px solid #e5eaf2;
                    border-radius: 8px;
                    background: #f8fafc;
                }

                #am-wxt-scene-popup-mask .am-wxt-submit-confirm-stat span {
                    display: block;
                    color: #64748b;
                    font-size: 12px;
                    line-height: 1.35;
                }

                #am-wxt-scene-popup-mask .am-wxt-submit-confirm-stat strong {
                    display: block;
                    margin-top: 4px;
                    color: #0f172a;
                    font-size: 18px;
                    line-height: 1.2;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                #am-wxt-scene-popup-mask .am-wxt-submit-confirm-scenes {
                    padding: 8px 10px;
                    border-radius: 8px;
                    background: #eff6ff;
                    color: #1d4ed8;
                    font-size: 12px;
                    line-height: 1.45;
                }

                #am-wxt-scene-popup-mask .am-wxt-submit-confirm-risk {
                    padding: 10px 12px;
                    border: 1px solid #fed7aa;
                    border-radius: 8px;
                    background: #fff7ed;
                    color: #9a3412;
                    font-size: 12px;
                    line-height: 1.55;
                }

                #am-wxt-keyword-modal .am-wxt-workbench-tabs {
                    display: inline-flex;
                    align-self: flex-start;
                    gap: 4px;
                    min-height: 0;
                    margin: 10px 12px 0;
                    padding: 4px;
                    border: 1px solid var(--am26-border, rgba(255,255,255,0.4));
                    border-radius: 999px;
                    background: var(--am26-surface, rgba(255,255,255,0.25));
                    box-shadow: inset 0 1px 0 rgba(255,255,255,0.32);
                    backdrop-filter: blur(10px) saturate(1.18);
                    -webkit-backdrop-filter: blur(10px) saturate(1.18);
                }

                #am-wxt-keyword-modal .am-wxt-workbench-tabs .am-wxt-btn {
                    min-height: 30px;
                    padding: 0 13px;
                    border: 0;
                    border-radius: 999px;
                    background: transparent;
                    color: var(--am26-text-soft, #505a74);
                    line-height: 30px;
                    font-size: 12px;
                    font-weight: 700;
                    box-shadow: none;
                    white-space: nowrap;
                }

                #am-wxt-keyword-modal .am-wxt-workbench-tabs .am-wxt-btn::after {
                    content: none;
                }

                #am-wxt-keyword-modal .am-wxt-workbench-tabs .am-wxt-btn:hover,
                #am-wxt-keyword-modal .am-wxt-workbench-tabs .am-wxt-btn:focus-visible {
                    background: var(--am26-surface-strong, rgba(255,255,255,0.45));
                    color: var(--am26-text, #1b2438);
                }

                #am-wxt-keyword-modal .am-wxt-workbench-tabs .am-wxt-btn.primary,
                #am-wxt-keyword-modal .am-wxt-workbench-tabs .am-wxt-btn[aria-selected="true"] {
                    border: 1px solid var(--am26-border-strong, rgba(255,255,255,0.6));
                    background: var(--am26-surface-strong, rgba(255,255,255,0.45));
                    color: var(--am26-primary-strong, #1d3fcf);
                    box-shadow: 0 8px 18px rgba(69,84,229,0.12), inset 0 1px 0 rgba(255,255,255,0.42);
                }

                #am-wxt-keyword-modal .am-wxt-body {
                    padding: 10px 12px 12px;
                    background: transparent;
                }

                #am-wxt-keyword-modal .am-wxt-home-summary {
                    display: grid;
                    grid-template-columns: repeat(3, minmax(0, 1fr));
                    gap: 10px;
                    margin-bottom: 10px;
                }

                #am-wxt-keyword-modal .am-wxt-home-stat {
                    min-width: 0;
                    min-height: 48px;
                    padding: 9px 12px;
                    border: 1px solid var(--am26-border, rgba(255,255,255,0.4));
                    border-radius: 12px;
                    background: linear-gradient(145deg, var(--am26-surface-strong, rgba(255,255,255,0.45)), var(--am26-surface, rgba(255,255,255,0.25)));
                    box-shadow: inset 0 1px 0 rgba(255,255,255,0.36), 0 8px 20px rgba(31,38,135,0.06);
                }

                #am-wxt-keyword-modal .am-wxt-home-stat-label,
                #am-wxt-keyword-modal .am-wxt-product-toolbar > span,
                #am-wxt-keyword-modal .am-wxt-strategy-head-main > span:not(.am-wxt-strategy-section-title) {
                    min-width: 0;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                #am-wxt-keyword-modal .am-wxt-home-stat strong {
                    color: var(--am26-primary-strong, #1d3fcf);
                    overflow: hidden;
                    text-overflow: ellipsis;
                    font-variant-numeric: tabular-nums;
                    font-feature-settings: "tnum" 1;
                }

                #am-wxt-keyword-modal .am-wxt-panel {
                    min-height: 250px;
                    overflow: hidden;
                }

                #am-wxt-keyword-modal .am-wxt-panel-candidate {
                    min-height: 250px;
                }

                #am-wxt-keyword-modal .am-wxt-toolbar {
                    gap: 6px;
                    padding: 8px;
                }

                #am-wxt-keyword-modal .am-wxt-toolbar input:not([type="checkbox"]):not([type="radio"]) {
                    min-width: 150px;
                }

                #am-wxt-keyword-modal .am-wxt-product-toolbar {
                    display: grid;
                    grid-template-columns: minmax(0, 1fr) auto;
                    align-items: center;
                }

                #am-wxt-keyword-modal .am-wxt-toolbar-actions {
                    flex-wrap: nowrap;
                }

                #am-wxt-keyword-modal .am-wxt-strategy-board {
                    margin-top: 10px;
                    border-radius: 12px;
                }

                #am-wxt-keyword-modal .am-wxt-strategy-head {
                    grid-template-columns: minmax(190px, auto) minmax(220px, 1fr) auto;
                    gap: 8px;
                    padding: 10px;
                }

                #am-wxt-keyword-modal .am-wxt-strategy-section-title {
                    display: inline-flex;
                    align-items: center;
                    min-height: 24px;
                    padding: 0 8px;
                    border: 1px solid rgba(69,84,229,0.16);
                    border-radius: 999px;
                    background: rgba(69,84,229,0.08);
                    color: var(--am26-primary-strong, #1d3fcf);
                    line-height: 22px;
                }

                #am-wxt-keyword-modal .am-wxt-strategy-search-input {
                    width: min(240px, 100%);
                }

                #am-wxt-keyword-modal .am-wxt-strategy-list {
                    background: transparent;
                    max-height: min(296px, 34vh);
                    overflow: auto;
                    overscroll-behavior: contain;
                }

                #am-wxt-keyword-modal .am-wxt-strategy-list-head {
                    position: sticky;
                    top: 0;
                    z-index: 1;
                    backdrop-filter: blur(10px) saturate(1.12);
                    -webkit-backdrop-filter: blur(10px) saturate(1.12);
                }

                #am-wxt-keyword-modal .am-wxt-strategy-item:hover {
                    background: rgba(255,255,255,0.18);
                }

                #am-wxt-keyword-modal .am-wxt-strategy-footer {
                    min-height: 58px;
                    padding: 10px;
                    background: linear-gradient(135deg, rgba(255,255,255,0.5), rgba(255,255,255,0.24));
                }

                #am-wxt-keyword-modal .am-wxt-submit-summary {
                    min-width: 0;
                    overflow: hidden;
                }

                #am-wxt-keyword-modal .am-wxt-submit-summary span {
                    min-width: 0;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                #am-wxt-keyword-modal .am-wxt-primary-actions {
                    flex: 0 0 auto;
                }

                #am-wxt-keyword-modal .am-wxt-run-mode-toggle {
                    right: 6px;
                    border-radius: 999px;
                }

                #am-wxt-keyword-modal .am-wxt-run-mode-toggle::before {
                    content: none !important;
                }

                #am-wxt-keyword-modal .am-wxt-run-mode-toggle-icon {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    transition: transform 0.16s ease;
                }

                #am-wxt-keyword-modal .am-wxt-run-mode-toggle[data-open="1"] .am-wxt-run-mode-toggle-icon {
                    transform: rotate(180deg);
                }

                #am-wxt-keyword-modal .am-wxt-quick-log-panel {
                    padding: 9px 10px 10px;
                    background: linear-gradient(180deg, rgba(255,255,255,0.28), rgba(255,255,255,0.16));
                }

                #am-wxt-keyword-modal .am-wxt-quick-log-title {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                }

                #am-wxt-keyword-modal .am-wxt-quick-log-title::before {
                    content: "";
                    width: 6px;
                    height: 6px;
                    border-radius: 999px;
                    background: var(--am26-primary, #4554e5);
                    box-shadow: 0 0 0 4px rgba(69,84,229,0.1);
                }

                #am-wxt-keyword-quick-log,
                #am-wxt-keyword-modal #am-wxt-workbench-preview-log {
                    font-variant-numeric: tabular-nums;
                    font-feature-settings: "tnum" 1;
                }

                #am-wxt-keyword-quick-log .line,
                #am-wxt-keyword-modal #am-wxt-workbench-preview-log .line {
                    position: relative;
                    padding-left: 12px;
                    overflow-wrap: anywhere;
                }

                #am-wxt-keyword-quick-log .line::before,
                #am-wxt-keyword-modal #am-wxt-workbench-preview-log .line::before {
                    content: "";
                    position: absolute;
                    left: 0;
                    top: 0.72em;
                    width: 5px;
                    height: 5px;
                    border-radius: 999px;
                    background: rgba(80,90,116,0.46);
                }

                #am-wxt-keyword-quick-log .line.error::before,
                #am-wxt-keyword-modal #am-wxt-workbench-preview-log .line.error::before {
                    background: var(--am26-danger, #ea4f4f);
                }

                #am-wxt-keyword-quick-log .line.success::before,
                #am-wxt-keyword-modal #am-wxt-workbench-preview-log .line.success::before {
                    background: var(--am26-success, #0ea86f);
                }

                #am-wxt-keyword-modal #am-wxt-keyword-previewlog-panel {
                    padding: 10px;
                    border-color: var(--am26-border, rgba(255,255,255,0.4));
                    border-radius: 12px;
                    background: var(--am26-surface, rgba(255,255,255,0.25));
                    color: var(--am26-text, #1b2438);
                }

                #am-wxt-keyword-modal #am-wxt-keyword-previewlog-panel .am-wxt-detail-title {
                    margin-bottom: 10px;
                    color: var(--am26-text, #1b2438);
                    font-weight: 700;
                }

                #am-wxt-keyword-modal #am-wxt-keyword-previewlog-panel .am-wxt-crowd-box {
                    display: grid;
                    grid-template-columns: repeat(3, minmax(0, 1fr));
                    gap: 8px;
                    margin-top: 0;
                    padding: 0;
                    border: 0;
                    background: transparent;
                    box-shadow: none;
                }

                #am-wxt-keyword-modal #am-wxt-keyword-previewlog-panel .am-wxt-crowd-title {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 8px;
                    min-height: 40px;
                    margin: 0;
                    padding: 8px 10px;
                    border: 1px solid var(--am26-border, rgba(255,255,255,0.4));
                    border-radius: 10px;
                    background: var(--am26-surface, rgba(255,255,255,0.25));
                    color: var(--am26-text-soft, #505a74);
                    box-shadow: inset 0 1px 0 rgba(255,255,255,0.3);
                }

                #am-wxt-keyword-modal #am-wxt-keyword-previewlog-panel .am-wxt-crowd-title:last-child {
                    padding: 8px 10px;
                    border: 1px solid var(--am26-border, rgba(255,255,255,0.4));
                }

                #am-wxt-keyword-modal #am-wxt-workbench-preview-log {
                    min-height: 180px;
                    max-height: min(380px, 42vh);
                    padding: 10px 12px;
                }

                @media (max-width: 980px) {
                    #am-wxt-keyword-modal .am-wxt-home-summary,
                    #am-wxt-keyword-modal .am-wxt-strategy-head {
                        grid-template-columns: 1fr;
                    }

                    #am-wxt-keyword-modal .am-wxt-strategy-head-tools,
                    #am-wxt-keyword-modal .am-wxt-strategy-head-actions,
                    #am-wxt-keyword-modal .am-wxt-toolbar-actions {
                        justify-content: flex-start;
                    }

                    #am-wxt-keyword-modal .am-wxt-product-toolbar {
                        grid-template-columns: 1fr;
                        align-items: flex-start;
                    }

                    #am-wxt-keyword-modal #am-wxt-keyword-previewlog-panel .am-wxt-crowd-box {
                        display: grid;
                        grid-template-columns: 1fr;
                        background: transparent;
                    }

                    #am-wxt-keyword-modal .am-wxt-strategy-search-input {
                        width: 100%;
                    }

                    #am-wxt-keyword-modal .am-wxt-strategy-list-head {
                        display: none;
                    }

                    #am-wxt-keyword-modal .am-wxt-strategy-main {
                        grid-template-columns: 28px minmax(0, 1fr);
                        align-items: start;
                    }

                    #am-wxt-keyword-modal .am-wxt-strategy-tags,
                    #am-wxt-keyword-modal .am-wxt-strategy-target,
                    #am-wxt-keyword-modal .am-wxt-strategy-budget,
                    #am-wxt-keyword-modal .am-wxt-strategy-actions {
                        grid-column: 2 / -1;
                        justify-content: flex-start;
                        flex-wrap: wrap;
                    }

                    #am-wxt-keyword-modal .am-wxt-strategy-footer {
                        position: static;
                        flex-direction: column;
                        align-items: flex-start;
                    }

                    #am-wxt-keyword-modal .am-wxt-primary-actions {
                        width: 100%;
                        justify-content: flex-start;
                        flex-wrap: wrap;
                    }

                    #am-wxt-scene-popup-mask .am-wxt-submit-confirm-grid {
                        grid-template-columns: repeat(2, minmax(0, 1fr));
                    }
                }

                @media (prefers-reduced-motion: reduce) {
                    #am-wxt-keyword-modal .am-wxt-btn,
                    #am-wxt-keyword-modal .am-wxt-close,
                    #am-wxt-keyword-modal .am-wxt-strategy-actions,
                    #am-wxt-keyword-modal .am-wxt-strategy-inline-edit-btn {
                        transition: none !important;
                    }
                }
            `;
            document.head.appendChild(style);
        };
