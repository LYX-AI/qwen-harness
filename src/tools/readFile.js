import { readFile, stat } from "node:fs/promises";
import { relative } from "node:path";

import { ToolError } from "./errors.js";
import { resolveInsideWorkspace } from "./pathSafety.js";

const DEFAULT_MAX_BYTES = 64 * 1024;

export const readFileTool = {
  name: "read_file",
  description: "Read a UTF-8 text file inside the configured workspace.",
  readOnly: true,

  async execute({ config, input = {} }) {
    const requestedPath = input.path;
    if (!requestedPath) {
      throw new ToolError("read_file requires input.path", {
        kind: "invalid_input",
        toolName: this.name
      });
    }

    const targetPath = resolveInsideWorkspace(config.workspaceRoot, requestedPath);
    const maxBytes = input.maxBytes ?? config.maxFileReadBytes ?? DEFAULT_MAX_BYTES;

    let fileStats;
    try {
      fileStats = await stat(targetPath);
    } catch (error) {
      throw new ToolError(`Could not inspect file: ${requestedPath}`, {
        kind: "stat_failed",
        toolName: this.name,
        cause: error
      });
    }

    if (!fileStats.isFile()) {
      throw new ToolError(`Path is not a file: ${requestedPath}`, {
        kind: "not_file",
        toolName: this.name
      });
    }

    if (fileStats.size > maxBytes) {
      throw new ToolError(`File is too large to read: ${requestedPath} (${fileStats.size} bytes > ${maxBytes} bytes)`, {
        kind: "file_too_large",
        toolName: this.name
      });
    }

    let content;
    try {
      content = await readFile(targetPath, "utf8");
    } catch (error) {
      throw new ToolError(`Could not read file: ${requestedPath}`, {
        kind: "read_failed",
        toolName: this.name,
        cause: error
      });
    }

    return {
      toolName: this.name,
      path: relative(config.workspaceRoot, targetPath),
      bytes: fileStats.size,
      content
    };
  }
};
