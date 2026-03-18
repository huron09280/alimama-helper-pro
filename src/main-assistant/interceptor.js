    // ==========================================
    // 6. 网络拦截与报表抓取 (Interceptor)
    // ==========================================
    const Interceptor = {
        panel: null,
        keywords: CONSTANTS.DL_KEYWORDS,
        excludePatterns: [
            /videocloud\.cn-hangzhou\.log\.aliyuncs\.com\/logstores\/newplayer\/track(?:[/?#]|$)/i,
            /\/logstores\/[^/?#]+\/track(?:[/?#]|$)/i
        ],
        hooksRegistered: false,
        maxParseBytes: 1024 * 1024,
        parsableTypeHints: ['json', 'text', 'javascript', 'xml', 'html', 'csv', 'plain', 'event-stream'],
        debugHints: new Set(),

        init() {
            this.createPanel();
            this.registerHooks();
        },

        createPanel() {
            const div = document.createElement('div');
            div.id = 'am-report-capture-panel';
            // Inline fallback: even if style injection fails, ensure popup is visible and clickable.
            div.style.cssText = 'font-size:13px;position:fixed;right:20px;bottom:20px;z-index:2147483647;display:none;';
            document.body.appendChild(div);
            this.panel = div;
        },

        debugOnce(key, msg) {
            if (this.debugHints.has(key)) return;
            this.debugHints.add(key);
            console.debug(`[AM][Interceptor] ${msg} `);
        },

        sanitizeUrl(url) {
            if (typeof url !== 'string') return '';
            try {
                const parsed = new URL(url, window.location.origin);
                if (!/^https?:$/.test(parsed.protocol)) return '';
                return parsed.href;
            } catch {
                return '';
            }
        },

        isImageUrl(url) {
            if (typeof url !== 'string') return false;
            const clean = url.split('#')[0].split('?')[0].toLowerCase();
            return /\.(jpg|png|gif|jpeg|webp|svg|bmp)$/i.test(clean);
        },

        isExcludedUrl(url) {
            if (typeof url !== 'string') return false;
            return this.excludePatterns.some(pattern => pattern.test(url));
        },

        isDownloadUrl(url) {
            const safeUrl = this.sanitizeUrl(url);
            if (!safeUrl) return false;
            const lowerUrl = safeUrl.toLowerCase();
            if (this.isExcludedUrl(lowerUrl)) {
                this.debugOnce('exclude-non-download-url', `过滤非下载地址: ${safeUrl} `);
                return false;
            }
            const hasKeyword = this.keywords.some(k => lowerUrl.includes(String(k).toLowerCase()));
            const hasFileExt = /\.(xlsx|xls|csv|zip|txt)(?:$|[?#])/i.test(lowerUrl);
            return (hasKeyword || hasFileExt) && !this.isImageUrl(lowerUrl);
        },

        inspectUrl(url, source) {
            if (!this.isDownloadUrl(url)) return;
            this.show(url, source);
        },

        shouldParseResponse(meta = {}) {
            const source = meta.source || 'Unknown';
            const responseType = String(meta.responseType || '');
            if (responseType && responseType !== 'text') {
                this.debugOnce(`${source}: responseType:${responseType} `, `${source} 跳过解析: responseType = ${responseType} `);
                return false;
            }

            const contentType = String(meta.contentType || '').toLowerCase();
            if (!contentType) {
                this.debugOnce(`${source}: contentType: empty`, `${source} 跳过解析: content - type 为空`);
                return false;
            }
            if (!this.parsableTypeHints.some(type => contentType.includes(type))) {
                this.debugOnce(`${source}: contentType:${contentType} `, `${source} 跳过解析: content - type=${contentType} `);
                return false;
            }

            const contentLength = Number.parseInt(String(meta.contentLength || ''), 10);
            if (Number.isFinite(contentLength) && contentLength > this.maxParseBytes) {
                this.debugOnce(`${source}: contentLength`, `${source} 跳过解析: content - length=${contentLength} 超过限制 ${this.maxParseBytes} `);
                return false;
            }

            if (typeof meta.textLength === 'number' && meta.textLength > this.maxParseBytes) {
                this.debugOnce(`${source}: textLength`, `${source} 跳过解析: 响应文本长度 ${meta.textLength} 超过限制 ${this.maxParseBytes} `);
                return false;
            }

            return true;
        },

        show(url, source) {
            const safeUrl = this.sanitizeUrl(url);
            if (!safeUrl) {
                this.debugOnce('invalid-url', '检测到非法协议 URL，已忽略下载弹窗渲染');
                return;
            }

            if (this.panel.dataset.lastUrl === safeUrl && this.panel.style.display === 'block') return;
            this.panel.dataset.lastUrl = safeUrl;

            Logger.log(`📂 捕获报表: ${source} `, true);

            this.panel.textContent = '';

            const header = document.createElement('div');
            header.className = 'am-download-header';
            const headerTitle = document.createElement('span');
            headerTitle.textContent = '✅ 捕获报表';
            const headerSource = document.createElement('span');
            headerSource.className = 'am-download-source';
            headerSource.textContent = source;
            header.appendChild(headerTitle);
            header.appendChild(headerSource);

            const urlBox = document.createElement('div');
            urlBox.className = 'am-download-url';
            urlBox.textContent = safeUrl;

            const actions = document.createElement('div');
            actions.className = 'am-download-actions';

            const dlLink = document.createElement('a');
            dlLink.href = safeUrl;
            dlLink.target = '_blank';
            dlLink.rel = 'noopener noreferrer';
            dlLink.className = 'am-download-link';
            dlLink.textContent = '⚡ 直连下载';

            const copyBtn = document.createElement('button');
            copyBtn.className = 'am-download-btn am-download-copy';
            copyBtn.textContent = '复制';

            const closeBtn = document.createElement('button');
            closeBtn.className = 'am-download-btn am-download-close';
            closeBtn.textContent = 'X';

            actions.appendChild(dlLink);
            actions.appendChild(copyBtn);
            actions.appendChild(closeBtn);

            const hint = document.createElement('div');
            hint.className = 'am-download-hint';
            hint.textContent = '提示：如果下载的文件名无后缀，请手动添加 .xlsx';

            this.panel.appendChild(header);
            this.panel.appendChild(urlBox);
            this.panel.appendChild(actions);
            this.panel.appendChild(hint);
            this.panel.style.display = 'block';

            copyBtn.onclick = function () {
                GM_setClipboard(safeUrl);
                this.innerText = '已复制';
                setTimeout(() => this.innerText = '复制', 1500);
            };
            closeBtn.onclick = () => this.panel.style.display = 'none';
        },

        // --- 递归解析 JSON (Restored Original Logic) ---
        // NOTE: maxDepth 防止极深嵌套 JSON 触发调用栈溢出（理论场景，保险起见加限制）
        // 允许深度恰好为 0 的叶子节点继续判断，避免边界层 URL 被漏检。
        findUrlInObject(obj, source, maxDepth = 20) {
            if (!obj || maxDepth < 0) return;
            if (typeof obj === 'string') {
                if (obj.startsWith('http') && this.isDownloadUrl(obj)) {
                    this.show(obj, source);
                }
                return;
            }
            if (typeof obj === 'object') {
                for (let key in obj) {
                    this.findUrlInObject(obj[key], source, maxDepth - 1);
                }
            }
        },

        handleResponse(text, source, meta = {}) {
            if (typeof text !== 'string' || !text) return;
            if (!this.shouldParseResponse({ ...meta, source, textLength: text.length })) return;

            try {
                const json = JSON.parse(text);
                this.findUrlInObject(json, `JSON:${source} `);
            } catch (e) {
                // Fallback Regex from original code
                if (text && this.keywords.some(k => text.includes(k))) {
                    const regex = /https?:\/\/[^"'\s\\]+(?:xlsx|csv|MAIN)[^"'\s\\]*/g;
                    const matches = text.match(regex);
                    if (matches) matches.forEach(m => {
                        if (this.isDownloadUrl(m)) this.show(m, `Regex:${source} `);
                    });
                }
            }
        },

        registerHooks() {
            if (this.hooksRegistered) return;
            const hooks = createHookManager();

            hooks.registerFetch(({ args, response }) => {
                const requestUrl = typeof args?.[0] === 'string' ? args[0] : args?.[0]?.url;
                const responseUrl = response?.url || '';
                this.inspectUrl(requestUrl, 'Fetch:RequestURL');
                this.inspectUrl(responseUrl, 'Fetch:ResponseURL');

                const contentType = response?.headers?.get('content-type') || '';
                const contentLength = response?.headers?.get('content-length') || '';
                if (!this.shouldParseResponse({ source: 'Fetch', contentType, contentLength })) return;

                const clone = response.clone();
                clone.text()
                    .then(text => this.handleResponse(text, 'Fetch', { contentType, contentLength }))
                    .catch(() => { });
            });

            hooks.registerXHROpen(({ url }) => {
                this.inspectUrl(url, 'XHR:OpenURL');
            });

            hooks.registerXHRLoad(({ xhr }) => {
                this.inspectUrl(xhr.responseURL || xhr.__amHookUrl, 'XHR:ResponseURL');

                const contentType = xhr.getResponseHeader?.('content-type') || '';
                const contentLength = xhr.getResponseHeader?.('content-length') || '';
                const responseType = xhr.responseType || '';
                const text = typeof xhr.responseText === 'string' ? xhr.responseText : '';

                if (responseType === 'json' && xhr.response && typeof xhr.response === 'object') {
                    this.findUrlInObject(xhr.response, 'JSON:XHR(response)');
                }

                this.handleResponse(text, 'XHR', { contentType, contentLength, responseType });
            });

            document.addEventListener('click', (e) => {
                const target = e.target;
                if (!(target instanceof Element)) return;

                const isExitModeBtn = !!target.closest('#mx_2517 > button');
                const textBtn = target.closest('button');
                const text = (textBtn?.textContent || '').trim();
                const isExitModeText = text.includes('退出模式');

                if (isExitModeBtn || isExitModeText) {
                    if (this.panel) this.panel.style.display = 'none';
                }
            }, true);

            hooks.install();
            this.hooksRegistered = true;
        }
    };

