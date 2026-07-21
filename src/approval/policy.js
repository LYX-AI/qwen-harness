const VALID_APPROVAL_MODES = new Set(["allow", "ask", "deny"]);

export function evaluateApproval({ tool, approvalMode }) {
  if (!VALID_APPROVAL_MODES.has(approvalMode)) {
    return {
      decision: "deny",
      reason: "Invalid approval mode."
    };
  }

  if (!tool || typeof tool.readOnly !== "boolean") {
    return {
      decision: "deny",
      reason: "Tool readOnly property is not a boolean."
    };
  }

  if (tool.readOnly) {
    return {
      decision: "allow",
      reason: "Tool is read-only."
    };
  }

  if (approvalMode === "allow") {
    return {
      decision: "allow",
      reason: "Approval mode is allow."
    };
  }

  if (approvalMode === "ask") {
    return {
      decision: "ask",
      reason: "This tool requires approval. Please confirm whether to allow or deny."
    };
  }

  return {
    decision: "deny",
    reason: "Approval mode is deny."
  };
}
