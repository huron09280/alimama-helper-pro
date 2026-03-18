    // ==================== API 请求模块 ====================
    const API = {
        /**
         * 单次请求（使用原生 fetch API）
         * NOTE: 由于 GM_xmlhttpRequest 在某些油猴管理器中存在跨域问题，
         * 这里改用页面原生的 fetch API。阿里妈妈网站本身应该已配置 CORS 允许子域请求。
         */
        _singleRequest: async (url, data, timeout = 30000, signal) => {
            const startTime = Date.now();
            const reqId = Math.random().toString(36).substring(2, 8);

            Logger.debug(`[${reqId}] 发起请求:`, { url, timeout: `${timeout}ms` });
            Logger.debug(`[${reqId}] 请求数据:`, data);

            // 创建 AbortController 用于超时控制
            const controller = new AbortController();
            let timedOut = false;
            const timeoutId = setTimeout(() => {
                timedOut = true;
                controller.abort();
            }, timeout);
            if (signal) {
                if (signal.aborted) controller.abort();
                else signal.addEventListener('abort', () => controller.abort(), { once: true });
            }

            try {
                Logger.debug(`[${reqId}] 使用原生 fetch 发送请求...`);
                recordApiRequestToHookHistory(url, 'POST', data, 'api_fetch_preflight');

                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json, text/event-stream, */*'
                    },
                    body: JSON.stringify(data),
                    credentials: 'include',  // 自动携带 Cookie
                    signal: controller.signal
                });

                clearTimeout(timeoutId);
                const elapsed = Date.now() - startTime;

                Logger.debug(`[${reqId}] 响应状态:`, {
                    status: response.status,
                    statusText: response.statusText,
                    elapsed: `${elapsed}ms`
                });

                if (!response.ok) {
                    const errorText = await response.text().catch(() => '');
                    throw new Error(`HTTP ${response.status}: ${response.statusText}${errorText ? ` - ${errorText.substring(0, 200)}` : ''}`);
                }

                const contentType = (response.headers.get('content-type') || '').toLowerCase();
                if (contentType.includes('text/event-stream') && response.body?.getReader) {
                    const reader = response.body.getReader();
                    const decoder = new TextDecoder();
                    let buffer = '';
                    const chunks = [];

                    while (true) {
                        const { value, done } = await reader.read();
                        if (done) break;
                        buffer += decoder.decode(value, { stream: true });

                        const lines = buffer.split(/\r?\n/);
                        buffer = lines.pop() || '';
                        lines.forEach(line => {
                            const trimmed = line.trim();
                            if (!trimmed.startsWith('data:')) return;
                            const payload = trimmed.substring(5).trim();
                            if (!payload) return;
                            try { chunks.push(JSON.parse(payload)); } catch { }
                        });
                    }

                    if (buffer.trim().startsWith('data:')) {
                        const payload = buffer.trim().substring(5).trim();
                        if (payload) {
                            try { chunks.push(JSON.parse(payload)); } catch { }
                        }
                    }

                    if (chunks.length) {
                        Logger.debug(`[${reqId}] SSE 流解析: ${chunks.length} 条数据 (${Date.now() - startTime}ms)`);
                        return { isStream: true, chunks };
                    }
                    throw new Error('SSE 响应为空');
                }

                const responseText = await response.text();
                Logger.debug(`[${reqId}] 响应内容 (${responseText.length}字符):`, responseText.substring(0, 500));

                // 尝试解析 JSON
                try {
                    const result = JSON.parse(responseText);
                    Logger.debug(`[${reqId}] 请求成功 (${elapsed}ms)`);
                    return result;
                } catch {
                    // 尝试解析 SSE 流格式
                    if (responseText.includes('data:')) {
                        const chunks = responseText.split('\n')
                            .filter(line => line.trim().startsWith('data:'))
                            .map(line => {
                                try { return JSON.parse(line.substring(5).trim()); }
                                catch { return null; }
                            })
                            .filter(Boolean);

                        if (chunks.length) {
                            Logger.debug(`[${reqId}] SSE 流解析: ${chunks.length} 条数据 (${elapsed}ms)`);
                            return { isStream: true, chunks };
                        }
                    }
                    throw new Error(`解析响应失败: ${responseText.substring(0, 100)}`);
                }

            } catch (err) {
                clearTimeout(timeoutId);
                const elapsed = Date.now() - startTime;

                if (err.name === 'AbortError') {
                    if (timedOut) {
                        Logger.error(`[${reqId}] 请求超时 (${elapsed}ms, 配置${timeout}ms)`);
                        throw new Error(`请求超时 (>${timeout}ms)`);
                    }
                    const abortErr = new Error('请求已取消');
                    abortErr.name = 'AbortError';
                    throw abortErr;
                }

                Logger.error(`[${reqId}] 请求失败 (${elapsed}ms):`, {
                    error: err.message,
                    name: err.name,
                    stack: err.stack?.split('\n').slice(0, 3).join('\n')
                });
                throw err;
            }
        },

        // 带重试的请求
        request: async (url, data, options = {}) => {
            const { maxRetries = 3, timeout = 30000, retryDelay = 2000, signal } = options;
            const parsedMaxRetries = Number(maxRetries);
            const totalAttempts = Number.isFinite(parsedMaxRetries)
                ? Math.max(1, Math.floor(parsedMaxRetries))
                : 3;
            let lastError = null;

            Logger.info(`📡 API请求: ${url.split('/').pop()}`, { maxRetries: totalAttempts, timeout });

            for (let attempt = 1; attempt <= totalAttempts; attempt++) {
                try {
                    const result = await API._singleRequest(url, data, timeout, signal);
                    Logger.info(`✓ 请求成功 (第${attempt}次)`);
                    return result;
                } catch (err) {
                    lastError = err;
                    if (err.name === 'AbortError') throw err;
                    Logger.warn(`✗ 请求失败 (第${attempt}/${totalAttempts}次): ${err.message}`);

                    if (attempt < totalAttempts) {
                        Logger.info(`⏳ ${retryDelay / 1000}秒后重试...`);
                        await Utils.delay(retryDelay);
                    }
                }
            }

            const finalError = lastError instanceof Error
                ? lastError
                : new Error(`请求失败：未捕获到具体异常（maxRetries=${totalAttempts}）`);
            Logger.error(`❌ 请求最终失败: ${finalError.message}`, { url, attempts: totalAttempts });
            throw finalError;
        }
    };

