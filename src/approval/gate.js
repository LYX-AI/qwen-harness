import { evaluateApproval } from "./policy.js";

export async function enforceApproval({
  tool,
  input,
  approvalMode,
  requestApproval
}) {
  const approval = evaluateApproval({
    tool,
    approvalMode
  });

  if (approval.decision === "deny") {
    throw new Error(`Tool execution denied: ${approval.reason}`);
  }

  if (approval.decision === "allow") {
    return approval;
  }

  if (approval.decision === "ask") {
    if (typeof requestApproval !== "function") {
      throw new Error(
        "requestApproval function is required for approval mode 'ask'."
      );
    }

    const approved = await requestApproval({
      tool,
      input,
      reason: approval.reason
    });

    if (approved !== true) {
      throw new Error("Tool execution denied by user.");
    }

    return {
      decision: "allow",
      reason: "Tool execution approved by user."
    };
  }

  throw new Error(`Unknown approval decision: ${approval.decision}`);
}
