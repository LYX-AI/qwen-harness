import { isAbsolute, relative, resolve } from "node:path";

import { ToolError } from "./errors.js";

export function resolveInsideWorkspace(workspaceRoot, requestedPath = ".") {
  const root = resolve(workspaceRoot);
  const target = resolve(root, requestedPath);
  const relativePath = relative(root, target);

  if (relativePath === "") {
    return target;
  }

  if (relativePath === ".." || relativePath.startsWith(`..\\`) || relativePath.startsWith("../") || isAbsolute(relativePath)) {
    throw new ToolError(`Path is outside workspace: ${requestedPath}`, {
      kind: "outside_workspace"
    });
  }

  return target;
}
