import fs from 'fs';
import path from 'path';

const uiJsPath = path.resolve('./src/main-assistant/ui.js');
const uiJsContent = fs.readFileSync(uiJsPath, 'utf8');

const cssMatch = uiJsContent.match(/const css = `([\s\S]*?)`;/);
const css = cssMatch ? cssMatch[1].replace(/\$\{CURRENT_VERSION\}/g, '6.08') : '';

const domMatch = uiJsContent.match(/root\.innerHTML = `([\s\S]*?)`;/);
let dom = domMatch ? domMatch[1].replace(/\$\{CURRENT_VERSION\}/g, '6.08') : '';

// Fix close button size for headless rendering
dom = dom.replace(/<svg viewBox="0 0 1024 1024" style="width:1\.2em;height:1\.2em;/g, '<svg viewBox="0 0 1024 1024" style="width:16px;height:16px;');

const htmlTemplate = (type) => `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>Mockup</title>
    <style>
        * {
            box-sizing: border-box;
        }
        body {
            margin: 0;
            padding: 0;
            background: linear-gradient(135deg, #f0f2f5 0%, #e0eaf5 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif !important;
            -webkit-font-smoothing: antialiased;
        }
        ${css}
        
        /* Force panels to be displayed properly in our center container */
        #am-helper-icon {
            position: relative !important;
            top: auto !important;
            right: auto !important;
            transform: scale(1.4) !important;
            box-shadow: 0 12px 32px 0 rgba(31, 38, 135, 0.25), inset 0 0 0 1px rgba(255, 255, 255, 0.5) !important;
            background: rgba(255,255,255,0.95) !important;
            border-color: var(--am26-border-strong) !important;
            color: var(--am26-primary-strong) !important;
        }
        
        #am-helper-panel {
            position: relative !important;
            top: auto !important;
            right: auto !important;
            transition: none !important;
            box-shadow: 0 20px 40px rgba(0,0,0,0.15), 0 0 0 1px rgba(255,255,255,0.6) !important;
            transform: scale(1.1) !important; /* Make it slightly bigger for the screenshot */
            transform-origin: center center !important;
        }
        
        #am-report-capture-panel {
            position: relative !important;
            bottom: auto !important;
            right: auto !important;
            display: block !important;
            box-shadow: 0 20px 40px rgba(0,0,0,0.15), 0 0 0 1px rgba(255,255,255,0.6) !important;
            transform: scale(1.2) !important;
        }

        .snapshot-container {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 100%;
            padding: 20px;
        }

        /* Fake data for logs */
        .am-log-line {
            padding: 4px 0 !important; 
            line-height: 1.5 !important;
            border-bottom: 1px dashed rgba(0, 0, 0, 0.1) !important;
            font-size: 11px !important;
        }
        
        /* Table styles for quick entry */
        .mock-table {
            background: white;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.08);
            padding: 24px;
            width: 760px;
            border: 1px solid #e8e8e8;
        }
        .mock-tr {
            display: flex;
            padding: 16px 20px;
            border-bottom: 1px solid #f0f0f0;
            align-items: center;
        }
        .mock-th {
            font-weight: 600;
            color: #666;
            font-size: 14px;
            background: #fafafa;
            border-radius: 6px;
        }
        .mock-td {
            font-size: 14px;
            color: #333;
        }
        .col-id { width: 140px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;}
        .col-name { flex: 1; font-weight: 500;}
        .col-status { width: 100px; color: #52c41a; }
        .col-spend { width: 120px; text-align: right; }
        
        /* Tampermonkey Installation specific styles */
        .tm-header { background: #333; color: white; padding: 15px 30px; display: flex; align-items: center; }
        .tm-logo { width: 32px; height: 32px; background: #fff; border-radius: 8px; margin-right: 15px; position:relative;}
        .tm-logo::before, .tm-logo::after { content: ''; position:absolute; bottom: 4px; width:10px; height:10px; background:#333; border-radius:50%; }
        .tm-logo::before { left: 4px; } .tm-logo::after { right: 4px; }
        .tm-tabs { background: #e0e0e0; padding: 0 20px; border-bottom: 1px solid #ccc; height: 40px; display:flex;}
        .tm-tab { background: white; padding: 10px 20px; border: 1px solid #ccc; border-bottom: none; border-radius: 5px 5px 0 0; margin-top: 5px; font-weight: bold;}
        .tm-content { margin: 20px; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); border: 1px solid #e0e0e0; }
        .tm-container { display: flex; justify-content: space-between; align-items: flex-start;}
        .tm-left { flex: 1; }
        .tm-title { font-size: 24px; font-weight: bold; margin-bottom: 20px; display: flex; align-items:center; color: #111; }
        .tm-version { font-size: 14px; font-weight: normal; color: #666; margin-left: 15px; background: #eee; padding: 2px 6px; border-radius: 4px;}
        .tm-meta-row { display: flex; margin-bottom: 12px; line-height:1.6; font-size: 14px;}
        .tm-meta-key { width: 100px; color: #666; font-weight: bold; text-align: right; margin-right: 20px;}
        .tm-meta-val { flex: 1; color: #333; }
        .tm-hr { border: 0; border-top: 1px solid #eee; margin: 20px 0; }
        .tm-btn { background: #28a745; color: white; border: none; padding: 12px 40px; font-size: 18px; font-weight: bold; border-radius: 6px; cursor: pointer; display: flex; align-items: center; margin-left: 20px; box-shadow:0 4px 12px rgba(40,167,69,0.3); transition: all 0.2s;}
    </style>
</head>
<body>
    <div class="snapshot-container" id="container">
    </div>
    <script>
        const dom = \`${dom.replace(/`/g, '\\`')}\`;
        const type = '${type}';
        const container = document.getElementById('container');
        
        if (['floating-ball', 'main-panel', 'assist-switches'].includes(type)) {
            container.innerHTML = dom;
            const panel = document.getElementById('am-helper-panel');
            const icon = document.getElementById('am-helper-icon');
            const logContent = document.getElementById('am-log-content');
            
            // Populate fake logs cleanly
            logContent.innerHTML = 
                '<div class="am-log-line"><span class="am-log-time">10:45:12</span> <span style="color:#0ea86f">[系统] 阿里助手 Pro v6.08 启动成功</span></div>' +
                '<div class="am-log-line"><span class="am-log-time">10:45:15</span> <span style="color:#1d3fcf">[护航] 算法护航引擎已就绪</span></div>';
            
            if (type === 'floating-ball') {
                panel.classList.add('hidden');
                icon.style.display = 'flex';
                document.body.style.background = 'radial-gradient(circle at center, #ffffff 0%, #eef2f6 100%)';
            } else if (type === 'main-panel') {
                panel.classList.remove('hidden');
                icon.style.display = 'none';
                document.body.style.background = 'radial-gradient(circle at center, #f4f7fb 0%, #e0eaf5 100%)';
            } else if (type === 'assist-switches') {
                panel.classList.remove('hidden');
                icon.style.display = 'none';
                document.getElementById('am-assist-switches').classList.add('open');
                document.getElementById('am-toggle-assist-display').classList.add('active');
                document.body.style.background = 'radial-gradient(circle at center, #f4f7fb 0%, #d5e3f1 100%)';
                
                const buttons = document.querySelectorAll('.am-switch-btn');
                buttons.forEach((btn, i) => {
                    // Turn on specific buttons to look realistic
                    if (i < 4 || i === 4 || i === 6) {
                        btn.classList.add('active');
                    }
                });
            }
        } else if (type === 'download-capture') {
            document.body.style.background = 'radial-gradient(circle at center, #ffffff 0%, #eef2f6 100%)';
            container.innerHTML = \`
                <div id="am-report-capture-panel">
                    <div class="am-download-header">
                        <span style="display:flex;align-items:center;gap:6px;"><svg viewBox="0 0 1024 1024" width="16" height="16" fill="currentColor"><path d="M512 832c-176.4 0-320-143.6-320-320S335.6 192 512 192s320 143.6 320 320-143.6 320-320 320zm0-704C299.6 128 128 299.6 128 512s171.6 384 384 384 384-171.6 384-384S724.4 128 512 128zm-41 386h82v-160h-82v160zm41 230c-26.4 0-48-21.6-48-48s21.6-48 48-48 48 21.6 48 48-21.6 48-48 48z"></path></svg> 报表捕获</span>
                        <span class="am-download-source">来源: 万能查数导出</span>
                    </div>
                    <div class="am-download-url" title="https://report.alimama.com/api/v2/download/report_20260328_102030.xlsx?token=xxx" style="font-family: monospace;">
                        https://report.alimama.com/api/v2/dow...
                    </div>
                    <div class="am-download-actions">
                        <a href="javascript:void(0)" class="am-download-link">下载文件</a>
                        <div class="am-download-copy am-download-btn">复制链接</div>
                    </div>
                    <div class="am-download-hint">💡 链接有效期约30分钟，若失效请重新获取</div>
                </div>
            \`;
        } else if (type === 'campaign-quick-entry') {
            document.body.style.background = 'radial-gradient(circle at center, #fafbfc 0%, #f0f2f5 100%)';
            container.innerHTML = \`
                <div class="mock-table">
                    <div style="font-size:18px;font-weight:bold;margin-bottom:20px;color:#111;display:flex;align-items:center;">
                        推广计划列表
                    </div>
                    <div class="mock-tr mock-th" style="padding:12px 20px;">
                        <div class="col-id">计划名称 / ID</div>
                        <div class="col-status">状态</div>
                        <div class="col-spend">总花费</div>
                        <div class="col-spend" style="text-align:right;flex:1;">转化数</div>
                    </div>
                    <div class="mock-tr">
                        <div class="col-id am-campaign-hover-host" style="display:flex;align-items:center;">
                            12345678 
                            <span class="am-campaign-search-btn" title="万能查数快速入口">
                                <svg viewBox="0 0 1024 1024" style="width:14px;height:14px;"><path d="M909.6 854.5L649.9 594.8C690.2 542.7 712 479 712 412c0-80.2-31.3-155.6-87.9-212.1-56.6-56.7-132-87.9-212.1-87.9s-155.5 31.3-212.1 87.9C143.2 256.5 112 331.8 112 412c0 80.1 31.3 155.5 87.9 212.1C256.5 680.8 331.8 712 412 712c67 0 130.6-21.8 182.7-62l259.7 259.6a8.2 8.2 0 0 0 11.6 0l43.6-43.5a8.2 8.2 0 0 0 0-11.6zM570.4 570.4C528 612.7 471.8 636 412 636s-116-23.3-158.4-65.6C211.3 528 188 471.8 188 412s23.3-116.1 65.6-158.4C296 211.3 352.2 188 412 188s116.1 23.2 158.4 65.6S636 352.2 636 412s-23.3 116.1-65.6 158.4z"></path></svg>
                            </span>
                        </div>
                        <div class="col-name">春季上新大促爆发</div>
                        <div class="col-status">● 投放中</div>
                        <div class="col-spend">￥5,200.00</div>
                        <div class="col-spend" style="flex:1;">125</div>
                    </div>
                    <div class="mock-tr" style="background:#f4f7fb; border-left: 3px solid #1677ff; padding-left: 17px;">
                        <div class="col-id am-campaign-hover-host" style="display:flex;align-items:center;">
                            23456789 
                            <span class="am-campaign-search-btn" title="万能查数快速入口" style="opacity:1;visibility:visible;pointer-events:auto;color:#1677ff;">
                                <svg viewBox="0 0 1024 1024" style="width:16px;height:16px;"><path d="M909.6 854.5L649.9 594.8C690.2 542.7 712 479 712 412c0-80.2-31.3-155.6-87.9-212.1-56.6-56.7-132-87.9-212.1-87.9s-155.5 31.3-212.1 87.9C143.2 256.5 112 331.8 112 412c0 80.1 31.3 155.5 87.9 212.1C256.5 680.8 331.8 712 412 712c67 0 130.6-21.8 182.7-62l259.7 259.6a8.2 8.2 0 0 0 11.6 0l43.6-43.5a8.2 8.2 0 0 0 0-11.6zM570.4 570.4C528 612.7 471.8 636 412 636s-116-23.3-158.4-65.6C211.3 528 188 471.8 188 412s23.3-116.1 65.6-158.4C296 211.3 352.2 188 412 188s116.1 23.2 158.4 65.6S636 352.2 636 412s-23.3 116.1-65.6 158.4z"></path></svg>
                            </span>
                        </div>
                        <div class="col-name" style="font-weight:600; color:#1677ff;">年中品牌爆发护航计划</div>
                        <div class="col-status">● 投放中</div>
                        <div class="col-spend" style="font-weight:600;">￥12,850.50</div>
                        <div class="col-spend" style="flex:1;font-weight:600;">386</div>
                    </div>
                     <div class="mock-tr" style="border-bottom:none;">
                        <div class="col-id am-campaign-hover-host" style="display:flex;align-items:center;">
                            34567890 
                            <span class="am-campaign-search-btn" title="万能查数快速入口">
                                <svg viewBox="0 0 1024 1024" style="width:14px;height:14px;"><path d="M909.6 854.5L649.9 594.8C690.2 542.7 712 479 712 412c0-80.2-31.3-155.6-87.9-212.1-56.6-56.7-132-87.9-212.1-87.9s-155.5 31.3-212.1 87.9C143.2 256.5 112 331.8 112 412c0 80.1 31.3 155.5 87.9 212.1C256.5 680.8 331.8 712 412 712c67 0 130.6-21.8 182.7-62l259.7 259.6a8.2 8.2 0 0 0 11.6 0l43.6-43.5a8.2 8.2 0 0 0 0-11.6zM570.4 570.4C528 612.7 471.8 636 412 636s-116-23.3-158.4-65.6C211.3 528 188 471.8 188 412s23.3-116.1 65.6-158.4C296 211.3 352.2 188 412 188s116.1 23.2 158.4 65.6S636 352.2 636 412s-23.3 116.1-65.6 158.4z"></path></svg>
                            </span>
                        </div>
                        <div class="col-name" style="color:#888;">精选好物日常推</div>
                        <div class="col-status" style="color:#d9d9d9">暂停</div>
                        <div class="col-spend" style="color:#888;">￥0.00</div>
                        <div class="col-spend" style="flex:1;color:#888;">0</div>
                    </div>
                </div>
            \`;
        } else if (type === 'tampermonkey-install') {
            document.body.style.background = '#f4f5f7';
            container.innerHTML = \`
                <div style="width: 800px; box-shadow: 0 10px 40px rgba(0,0,0,0.1); border-radius: 8px; overflow: hidden; border: 1px solid #dcdcdc;">
                    <div class="tm-header">
                        <div class="tm-logo"></div>
                        <div style="font-size: 22px; font-weight: 500;">Tampermonkey®</div>
                    </div>
                    <div class="tm-tabs">
                        <div class="tm-tab">Userscript Installation</div>
                    </div>
                    <div class="tm-content">
                        <div class="tm-container">
                            <div class="tm-left">
                                <div class="tm-title">
                                    阿里妈妈多合一助手 (Pro版) 
                                    <span class="tm-version">v6.08</span>
                                </div>
                                <div class="tm-meta-row">
                                    <div class="tm-meta-key">Author</div>
                                    <div class="tm-meta-val">Gemini & Liangchao</div>
                                </div>
                                <div class="tm-meta-row">
                                    <div class="tm-meta-key">Description</div>
                                    <div class="tm-meta-val">交互优化版：增加加购成本计算、花费占比、预算分类占比、性能优化。包含状态记忆、胶囊按钮UI、日志折叠、报表直连下载拦截。集成算法护航功能。</div>
                                </div>
                                <div class="tm-hr"></div>
                                <div class="tm-meta-row"><div class="tm-meta-key">@match</div><div class="tm-meta-val"><code style="background:#f4f4f4;padding:2px 6px;border-radius:4px;">*://alimama.com/*</code><br><code style="background:#f4f4f4;padding:2px 6px;border-radius:4px;">*://*.alimama.com/*</code><br><code style="background:#f4f4f4;padding:2px 6px;border-radius:4px;">https://one.alimama.com/*</code></div></div>
                                <div class="tm-meta-row"><div class="tm-meta-key">@grant</div><div class="tm-meta-val"><code style="background:#f4f4f4;padding:2px 6px;border-radius:4px;">GM_setClipboard</code><br><code style="background:#f4f4f4;padding:2px 6px;border-radius:4px;">GM_setValue</code><br><code style="background:#f4f4f4;padding:2px 6px;border-radius:4px;">GM_getValue</code></div></div>
                            </div>
                            <div>
                                <button class="tm-btn">安 装</button>
                            </div>
                        </div>
                    </div>
                </div>
            \`;
        }
    </script>
</body>
</html>
`;

['floating-ball', 'main-panel', 'assist-switches', 'download-capture', 'campaign-quick-entry', 'tampermonkey-install'].forEach(type => {
    fs.writeFileSync('./docs/images/mockups/' + type + '.html', htmlTemplate(type));
});

console.log('Mockup HTML generated completely.');
