import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

let AgentCluster = null;
let agentClusterImportError = null;
const agentClusterModulePath = "../agent-cluster/index.mjs";

try {
    ({ AgentCluster } = await import(agentClusterModulePath));
} catch (error) {
    const message = String(error?.message || "");
    const isMissingModule = error?.code === "ERR_MODULE_NOT_FOUND"
        && /agent-cluster\/index\.mjs/.test(message);
    if (isMissingModule) {
        agentClusterImportError = error;
    } else {
        throw error;
    }
}

const agentClusterSkipReason = agentClusterImportError
    ? `缺少 agent-cluster/index.mjs：${agentClusterImportError?.code || agentClusterImportError?.message || "模块不可用"}`
    : false;

test("AgentCluster 能完成任务执行并写入上下文与日志", { skip: agentClusterSkipReason }, async () => {
    const runtimeDir = await mkdtemp(join(tmpdir(), "agent-cluster-"));
    const cluster = new AgentCluster({
        concurrency: 2,
        runtimeDir,
        notifierOptions: { printToConsole: false, enableDesktop: false },
        loggerOptions: { printToConsole: false }
    });

    cluster.registerHandler("echo", async ({ payload }) => `echo:${payload.text}`);
    cluster.registerHandler("sum", async ({ payload }) => payload.values.reduce((a, b) => a + b, 0));

    try {
        await cluster.start();
        const first = cluster.submitTask({
            type: "echo",
            payload: { text: "hello" },
            priority: 1
        });
        const second = cluster.submitTask({
            type: "sum",
            payload: { values: [1, 2, 3] },
            priority: 10
        });

        const [firstResult, secondResult] = await Promise.all([first.done, second.done]);
        assert.equal(firstResult, "echo:hello");
        assert.equal(secondResult, 6);

        await cluster.waitForIdle();

        const snapshot = cluster.getContextSnapshot();
        assert.equal(snapshot.tasks[first.taskId].status, "completed");
        assert.equal(snapshot.tasks[second.taskId].status, "completed");
        assert.equal(snapshot.tasks[second.taskId].result, 6);

        const logText = await readFile(cluster.getLogPath(), "utf8");
        assert.match(logText, /cluster\.task\.queued/);
        assert.match(logText, /cluster\.task\.completed/);
    } finally {
        await cluster.stop();
        await rm(runtimeDir, { recursive: true, force: true });
    }
});

test("AgentCluster 会把失败任务标记为 failed 并返回异常", { skip: agentClusterSkipReason }, async () => {
    const runtimeDir = await mkdtemp(join(tmpdir(), "agent-cluster-failed-"));
    const cluster = new AgentCluster({
        concurrency: 1,
        runtimeDir,
        notifierOptions: { printToConsole: false, enableDesktop: false },
        loggerOptions: { printToConsole: false }
    });

    cluster.registerHandler("boom", async () => {
        throw new Error("intentional failure");
    });

    try {
        await cluster.start();
        const task = cluster.submitTask({ type: "boom" });
        await assert.rejects(task.done, /intentional failure/);
        await cluster.waitForIdle();

        const snapshot = cluster.getContextSnapshot();
        assert.equal(snapshot.tasks[task.taskId].status, "failed");
        assert.match(snapshot.tasks[task.taskId].error.message, /intentional failure/);
    } finally {
        await cluster.stop();
        await rm(runtimeDir, { recursive: true, force: true });
    }
});
