import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { renderBuildOutputs } from '../scripts/build.mjs';

const rootSource = readFileSync(new URL('../阿里妈妈多合一助手.js', import.meta.url), 'utf8');
const outputs = renderBuildOutputs();

test('构建输出与根文件保持同步', () => {
  assert.equal(outputs.userscriptSource, rootSource, '根文件未与 src/ 生成结果保持同步');
});

test('userscript meta 产物包含自动更新地址', () => {
  assert.match(outputs.metaSource, /@updateURL\s+https:\/\/github\.com\/huron09280\/alimama-helper-pro\/releases\/latest\/download\/alimama-helper-pro\.meta\.js/);
  assert.match(outputs.metaSource, /@downloadURL\s+https:\/\/github\.com\/huron09280\/alimama-helper-pro\/releases\/latest\/download\/alimama-helper-pro\.user\.js/);
});
