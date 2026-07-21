import test from "node:test";
import assert from "node:assert/strict";

import { evaluateApproval } from "../src/approval/policy.js";

test("denies invalid approval modes", () => {
  const result = evaluateApproval({
    tool: {
      name: "read_file",
      readOnly: true
    },
    approvalMode: "unknown"
  });

  assert.equal(result.decision, "deny");
});

test("denies tools without valid readOnly metadata", () => {
  const result = evaluateApproval({
    tool: {
      name: "unknown_tool"
    },
    approvalMode: "ask"
  });

  assert.equal(result.decision, "deny");
});

test("allows read-only tools", () => {
  const result = evaluateApproval({
    tool: {
      name: "read_file",
      readOnly: true
    },
    approvalMode: "ask"
  });

  assert.equal(result.decision, "allow");
});

test("allows mutating tools in allow mode", () => {
  const result = evaluateApproval({
    tool: {
      name: "edit_file",
      readOnly: false
    },
    approvalMode: "allow"
  });

  assert.equal(result.decision, "allow");
});

test("asks before mutating tools in ask mode", () => {
  const result = evaluateApproval({
    tool: {
      name: "edit_file",
      readOnly: false
    },
    approvalMode: "ask"
  });

  assert.equal(result.decision, "ask");
});

test("denies mutating tools in deny mode", () => {
  const result = evaluateApproval({
    tool: {
      name: "edit_file",
      readOnly: false
    },
    approvalMode: "deny"
  });

  assert.equal(result.decision, "deny");
});
