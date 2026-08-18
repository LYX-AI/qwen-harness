import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { executeTool } from "../src/tools/registry.js";

async function withTempWorkspace(run) {
  const workspaceRoot = await mkdtemp(join(tmpdir(), "qwen-edit-"));

  try {
    await run(workspaceRoot);
  } finally {
    await rm(workspaceRoot, { recursive: true, force: true });
  }
}

function editConfig(workspaceRoot) {
  return {
    workspaceRoot,
    approvalMode: "ask",
    maxFileEditBytes: 65536
  };
}

test("replaces text after explicit approval", async () => {
  await withTempWorkspace(async (workspaceRoot) => {
    await writeFile(join(workspaceRoot, "note.txt"), "hello world\n", "utf8");

    const result = await executeTool({
      name: "edit_file",
      input: {
        path: "note.txt",
        oldText: "hello",
        newText: "hi",
        replaceAll: false
      },
      config: editConfig(workspaceRoot),
      requestApproval: async () => true
    });

    assert.equal(result.toolName, "edit_file");
    assert.equal(result.path, "note.txt");
    assert.equal(result.replacements, 1);
    assert.equal(await readFile(join(workspaceRoot, "note.txt"), "utf8"), "hi world\n");
  });
});

test("rejects a path outside the workspace", async () => {
  await withTempWorkspace(async (workspaceRoot) => {
    await assert.rejects(
      executeTool({
        name: "edit_file",
        input: {
          path: "..",
          oldText: "hello",
          newText: "hi",
          replaceAll: false
        },
        config: editConfig(workspaceRoot),
        requestApproval: async () => true
      }),
      /Path is outside workspace/
    );
  });
});

test("rejects when old text is not found", async () => {
  await withTempWorkspace(async (workspaceRoot) => {
    await writeFile(join(workspaceRoot, "note.txt"), "hello world\n", "utf8");

    await assert.rejects(
      executeTool({
        name: "edit_file",
        input: {
          path: "note.txt",
          oldText: "missing",
          newText: "hi",
          replaceAll: false
        },
        config: editConfig(workspaceRoot),
        requestApproval: async () => true
      }),
      /Old text not found/
    );

    assert.equal(await readFile(join(workspaceRoot, "note.txt"), "utf8"), "hello world\n");
  });
});

test("rejects multiple matches unless replaceAll is true", async () => {
  await withTempWorkspace(async (workspaceRoot) => {
    await writeFile(join(workspaceRoot, "note.txt"), "hello hello\n", "utf8");

    await assert.rejects(
      executeTool({
        name: "edit_file",
        input: {
          path: "note.txt",
          oldText: "hello",
          newText: "hi",
          replaceAll: false
        },
        config: editConfig(workspaceRoot),
        requestApproval: async () => true
      }),
      /multiple times/
    );

    assert.equal(await readFile(join(workspaceRoot, "note.txt"), "utf8"), "hello hello\n");
  });
});

test("does not edit a file when approval is denied", async () => {
  await withTempWorkspace(async (workspaceRoot) => {
    const filePath = join(workspaceRoot, "note.txt");
    const original = "hello world\n";
    await writeFile(filePath, original, "utf8");

    await assert.rejects(
      executeTool({
        name: "edit_file",
        input: {
          path: "note.txt",
          oldText: "hello",
          newText: "hi",
          replaceAll: false
        },
        config: editConfig(workspaceRoot),
        // 请你补上：requestApproval 返回 false 的函数
        requestApproval: async () => false
      }),
      /Tool execution denied by user\./
    );

    assert.equal(await readFile(filePath, "utf8"), original);
  });
});
