import test from "node:test";
import assert from "node:assert/strict";

import { enforceApproval } from "../src/approval/gate.js";

const readOnlyTool = {
  name: "read_file",
  readOnly: true
};

const mutatingTool = {
  name: "edit_file",
  readOnly: false
};

const input = {
  path: "src/config.js"
};

test("allows read-only tools without requesting approval", async () => {
  const result = await enforceApproval({
    tool: readOnlyTool,
    input,
    approvalMode: "ask"
  });

  assert.deepEqual(result, {
    decision: "allow",
    reason: "Tool is read-only."
  });
});

test("throws when policy denies a mutating tool", async () => {
  await assert.rejects(
    enforceApproval({
      tool: mutatingTool,
      input,
      approvalMode: "deny"
    }),
    /Tool execution denied: Approval mode is deny\./
  );
});

test("throws when approval is required without a handler", async () => {
  await assert.rejects(
    enforceApproval({
      tool: mutatingTool,
      input,
      approvalMode: "ask"
    }),
    /requestApproval function is required/
  );
});

test("passes operation details and allows explicit user approval", async () => {
  let receivedDetails;

  const result = await enforceApproval({
    tool: mutatingTool,
    input,
    approvalMode: "ask",
    requestApproval: async (details) => {
      receivedDetails = details;
      return true;
    }
  });

  assert.deepEqual(receivedDetails, {
    tool: mutatingTool,
    input,
    reason: "This tool requires approval. Please confirm whether to allow or deny."
  });
  assert.deepEqual(result, {
    decision: "allow",
    reason: "Tool execution approved by user."
  });
});

test("throws when the user rejects approval", async () => {
  await assert.rejects(
    enforceApproval({
      tool: mutatingTool,
      input,
      approvalMode: "ask",
      requestApproval: async () => false
    }),
    /Tool execution denied by user\./
  );
});

test("requires a strict boolean true approval response", async () => {
  await assert.rejects(
    enforceApproval({
      tool: mutatingTool,
      input,
      approvalMode: "ask",
      requestApproval: async () => "yes"
    }),
    /Tool execution denied by user\./
  );
});
