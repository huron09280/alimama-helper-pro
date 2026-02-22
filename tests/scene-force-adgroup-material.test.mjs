import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../阿里妈妈多合一助手.js', import.meta.url), 'utf8');

test('人群推广与线索推广强制回填 adgroup.material，避免站内商品主体为空', () => {
  assert.match(
    source,
    /const SCENE_FORCE_ADGROUP_MATERIAL = \{[\s\S]*?'人群推广':\s*true[\s\S]*?'线索推广':\s*true[\s\S]*?\};/,
    'SCENE_FORCE_ADGROUP_MATERIAL 未包含人群推广或线索推广'
  );

  assert.match(
    source,
    /hasMaterial:\s*SCENE_FORCE_ADGROUP_MATERIAL\[normalizedScene\]\s*\?\s*true\s*:/,
    'resolveSceneCapabilities 未使用 SCENE_FORCE_ADGROUP_MATERIAL 强制回填能力'
  );
});
