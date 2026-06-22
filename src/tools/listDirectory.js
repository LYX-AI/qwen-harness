import { readdir } from "node:fs/promises";
import { relative } from "node:path";

import { ToolError } from "./errors.js";
import { resolveInsideWorkspace } from "./pathSafety.js";

export const listDirectoryTool = {
  name: "list_directory",
  description: "List entries under a directory inside the configured workspace.",
  readOnly: true,

  async execute({ config, input = {} }) {
    const requestedPath = input.path ?? ".";
    const targetPath = resolveInsideWorkspace(config.workspaceRoot, requestedPath);

    let entries;
    try {
      entries = await readdir(targetPath, { withFileTypes: true });
    } catch (error) {
      throw new ToolError(`Could not list directory: ${requestedPath}`, {
        kind: "read_failed",
        toolName: this.name,
        cause: error
      });
    }

    const normalizedEntries = entries
      .map((entry) => ({
        name: entry.name,
        type: entry.isDirectory() ? "directory" : "file"
      }))
      .sort((a, b) => `${a.type}:${a.name}`.localeCompare(`${b.type}:${b.name}`));

    return {
      toolName: this.name,
      path: relative(config.workspaceRoot, targetPath) || ".",
      entries: normalizedEntries
    };
  }
};
