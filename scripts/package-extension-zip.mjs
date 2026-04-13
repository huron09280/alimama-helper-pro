import { existsSync, mkdirSync, statSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const EXTENSION_DIR = path.join(ROOT_DIR, 'dist', 'extension');
const ZIP_PATH = path.join(ROOT_DIR, 'dist', 'packages', 'alimama-helper-pro-extension.zip');

const args = new Set(process.argv.slice(2));
const skipBuild = args.has('--skip-build');

const runOrThrow = (command, commandArgs, description) => {
    const result = spawnSync(command, commandArgs, {
        cwd: ROOT_DIR,
        stdio: 'inherit'
    });
    if (result.status !== 0) {
        throw new Error(`${description}失败，退出码: ${String(result.status)}`);
    }
};

const zipWithPython = () => {
    const pythonScript = [
        'from pathlib import Path',
        'import zipfile',
        'import sys',
        '',
        'ext_dir = Path(sys.argv[1])',
        'out_path = Path(sys.argv[2])',
        'out_path.parent.mkdir(parents=True, exist_ok=True)',
        '',
        "with zipfile.ZipFile(out_path, 'w', zipfile.ZIP_DEFLATED) as zf:",
        "    for file in sorted(ext_dir.rglob('*')):",
        '        if file.is_file():',
        '            zf.write(file, file.relative_to(ext_dir))'
    ].join('\n');
    runOrThrow('python3', ['-c', pythonScript, EXTENSION_DIR, ZIP_PATH], 'extension zip 打包');
};

if (!skipBuild) {
    runOrThrow(process.execPath, ['scripts/build.mjs'], 'build');
}

if (!existsSync(EXTENSION_DIR)) {
    throw new Error('未找到 dist/extension，请先执行构建');
}

mkdirSync(path.dirname(ZIP_PATH), { recursive: true });
zipWithPython();

if (!existsSync(ZIP_PATH)) {
    throw new Error('zip 打包完成但未找到输出文件');
}

const size = statSync(ZIP_PATH).size;
console.log(`[pack:extension] output=dist/packages/alimama-helper-pro-extension.zip`);
console.log(`[pack:extension] size=${size} bytes`);
console.log('[pack:extension] install=解压 zip 后在 chrome://extensions 选择“加载已解压的扩展程序”；不要直接安装 .crx');
