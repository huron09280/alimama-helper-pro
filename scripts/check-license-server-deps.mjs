import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LICENSE_SERVER_DIR = path.join(ROOT_DIR, 'services', 'license-server');
const MANIFEST_PATH = path.join(LICENSE_SERVER_DIR, 'package.json');
const LOCKFILE_PATH = path.join(LICENSE_SERVER_DIR, 'package-lock.json');
const REQUIRED_DEP = 'tablestore';

const fail = (message) => {
    console.error(`[license-server-deps] ${message}`);
    process.exit(1);
};

const readJson = (targetPath, label) => {
    try {
        return JSON.parse(fs.readFileSync(targetPath, 'utf8'));
    } catch (error) {
        fail(`无法读取 ${label}：${error?.message || error}`);
    }
};

if (!fs.existsSync(MANIFEST_PATH)) {
    fail(`缺少依赖清单：${path.relative(ROOT_DIR, MANIFEST_PATH)}`);
}
if (!fs.existsSync(LOCKFILE_PATH)) {
    fail(`缺少锁文件：${path.relative(ROOT_DIR, LOCKFILE_PATH)}`);
}

const manifest = readJson(MANIFEST_PATH, 'package.json');
const manifestDep = String(manifest?.dependencies?.[REQUIRED_DEP] || '').trim();
if (!manifestDep) {
    fail(`package.json 未声明 dependencies.${REQUIRED_DEP}`);
}

const lockfile = readJson(LOCKFILE_PATH, 'package-lock.json');
const rootDeps = lockfile?.packages?.['']?.dependencies || {};
const legacyDeps = lockfile?.dependencies || {};
const hasRootDep = Object.prototype.hasOwnProperty.call(rootDeps, REQUIRED_DEP)
    || Object.prototype.hasOwnProperty.call(legacyDeps, REQUIRED_DEP);
if (!hasRootDep) {
    fail(`package-lock.json 未声明根依赖 ${REQUIRED_DEP}`);
}

const lockPackages = lockfile?.packages || {};
const hasResolvedEntry = Object.prototype.hasOwnProperty.call(lockPackages, `node_modules/${REQUIRED_DEP}`)
    || Object.prototype.hasOwnProperty.call(legacyDeps, REQUIRED_DEP);
if (!hasResolvedEntry) {
    fail(`package-lock.json 未解析出 ${REQUIRED_DEP} 安装条目`);
}

console.log(`[license-server-deps] ok: ${REQUIRED_DEP}@${manifestDep}`);
