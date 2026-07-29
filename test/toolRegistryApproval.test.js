import test from "node:test";
import assert from "node:assert/strict";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { executeTool } from "../src/tools/registry.js";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

test("executes a read-only tool after approval enforcement", async () => {
  const result = await executeTool({
    name: "list_directory",
    input: {
      path: "src/approval"
    },
    config: {
      workspaceRoot: projectRoot,
      approvalMode: "ask"
    }
  });

  assert.equal(result.toolName, "list_directory");
  assert.equal(result.path, join("src", "approval"));
  assert.ok(result.entries.some((entry) => entry.name === "gate.js"));
});

test("rejects an invalid approval mode before tool execution", async () => {
  await assert.rejects(
    executeTool({
      name: "list_directory",
      input: {
        path: "src/approval"
      },
      config: {
        workspaceRoot: projectRoot,
        approvalMode: "unknown"
      }
    }),
    /Tool execution denied: Invalid approval mode\./
  );
});
