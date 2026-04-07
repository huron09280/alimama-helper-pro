import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../scripts/review-team.sh', import.meta.url), 'utf8');

test('review-team 使用全量回归测试而非单文件 logger 测试', () => {
    assert.doesNotMatch(source, /TEST_FILE="tests\/logger-api\.test\.mjs"/, '仍然绑定到单文件 logger 测试');
    assert.match(source, /collect_test_files\(\)/, '缺少测试文件收集逻辑');
    assert.match(source, /find tests -maxdepth 1 -type f -name '\*\.test\.mjs'/, '未从 tests 目录收集全量回归文件');
    assert.match(source, /node --test "\$\{TEST_FILES\[@\]\}"/, '未执行全量回归测试集合');
});

test('review-team 将 CLAUDE 版本校验降级为可选检查', () => {
    assert.doesNotMatch(source, /require_file "\$CLAUDE_FILE"/, '仍然把 CLAUDE.md 当成硬依赖');
    assert.match(source, /if \[\[ -f "\$CLAUDE_FILE" \]\]; then/, '缺少 CLAUDE.md 可选分支');
    assert.match(source, /Optional version file missing: CLAUDE\.md \(skipped\)/, '缺少跳过 CLAUDE.md 时的通过提示');
    assert.match(source, /Version aligned with CLAUDE\.md: \$script_version/, '缺少 CLAUDE.md 存在时的版本比对');
});

test('review-team 不允许跟踪 .DS_Store', () => {
    assert.match(source, /assert_no_tracked_ds_store/, '缺少追踪 .DS_Store 的断言');
    assert.match(source, /git ls-files -- '\*\.DS_Store'/, '缺少列出 tracked .DS_Store 的命令');
});
