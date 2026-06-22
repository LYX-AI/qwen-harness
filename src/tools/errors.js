export class ToolError extends Error {
  constructor(message, { kind, toolName, cause } = {}) {
    super(message);
    this.name = "ToolError";
    this.kind = kind ?? "unknown";
    this.toolName = toolName;
    this.cause = cause;
  }
}
