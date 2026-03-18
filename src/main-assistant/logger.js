    // ==========================================
    // 2. 日志系统 (DOM 缓存优化)
    // ==========================================
    const Logger = {
        el: null,
        buffer: [],
        timer: null,

        info(msg, ...args) {
            this.log(msg, false, ...args);
        },

        warn(msg, ...args) {
            this.log(msg, true, ...args);
        },

        error(msg, ...args) {
            this.log(msg, true, ...args);
        },

        log(msg, isError = false, ...args) {
            const now = new Date();
            const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

            const toText = (value) => {
                if (typeof value === 'string') return value;
                if (value === null || value === undefined) return String(value ?? '');
                try {
                    return JSON.stringify(value);
                } catch {
                    return String(value);
                }
            };
            const fullMsg = [msg, ...args].map(toText).filter(Boolean).join(' ');

            // Console output
            const logStyle = isError ? 'color: #ff4d4f' : 'color: #1890ff';
            console.log(`%c[AM] ${fullMsg}`, logStyle);

            // Buffer for UI update
            this.buffer.push({ time, msg: fullMsg, isError });
            this.scheduleFlush();
        },

        scheduleFlush() {
            if (this.timer) return;
            this.timer = requestAnimationFrame(() => this.flush());
        },

        flush() {
            if (!this.el || this.buffer.length === 0) {
                this.timer = null;
                return;
            }

            const fragment = document.createDocumentFragment();
            const today = new Date().toLocaleDateString('zh-CN');

            // 准确检查是否需要插入日期标题 (查找容器内最后一个日期标题)
            const dateHeaders = this.el.getElementsByClassName('am-log-date-header');
            const lastDateText = dateHeaders.length > 0 ? dateHeaders[dateHeaders.length - 1].dataset.date : '';

            this.buffer.forEach(({ time, msg, isError }) => {
                if (today !== this.lastFlushedDate && today !== lastDateText) {
                    const dateDiv = document.createElement('div');
                    dateDiv.className = 'am-log-date-header';
                    dateDiv.dataset.date = today;
                    dateDiv.style.cssText = 'color:#888;font-size:10px;text-align:center;margin:8px 0;border-bottom:1px solid #eee;position:relative;';
                    const dateText = document.createElement('span');
                    dateText.style.cssText = 'background:#fff;padding:0 8px;position:relative;top:8px;';
                    dateText.textContent = today;
                    dateDiv.appendChild(dateText);
                    fragment.appendChild(dateDiv);
                    this.lastFlushedDate = today;
                }

                const div = document.createElement('div');
                div.className = 'am-log-line';
                const timeNode = document.createElement('span');
                timeNode.className = 'am-log-time';
                timeNode.textContent = `[${time}]`;
                div.appendChild(timeNode);
                div.appendChild(document.createTextNode(msg));
                if (isError) div.style.color = '#ff4d4f';
                fragment.appendChild(div);
            });

            this.el.appendChild(fragment);

            // 清理旧日志 (保持约100条)
            while (this.el.childElementCount > 100) {
                this.el.firstChild.remove();
            }

            // 滚动到底部
            if (State.config.logExpanded && (this.el.scrollHeight - this.el.scrollTop - this.el.clientHeight < 50)) {
                this.el.scrollTop = this.el.scrollHeight;
            }

            this.buffer = [];
            this.timer = null;
        },

        clear() {
            if (this.el) this.el.innerHTML = '';
        }
    };

