import { readFile, readdir, stat } from "node:fs/promises";
import { join, relative } from "node:path";
import { ToolError } from "./errors.js";
import { resolveInsideWorkspace } from "./pathSafety.js";

const DEFAULT_MAX_FILES = 200;
const DEFAULT_MAX_MATCHES = 50;
const DEFAULT_MAX_SEARCH_FILE_BYTES = 64 * 1024;
const SKIPPED_DIRECTORIES = new Set([".git", "node_modules", "sessions", "dist"]);

export const searchFilesTool = {
  name: "search_files",
  description: "Search for a plain text query inside workspace files.",
  readOnly: true,

  async execute({ config, input = {} }) {
    const query = input.query?.trim();
    if (!query) {
      throw new ToolError("search_files requires input.query", {
        kind: "invalid_input",
        toolName: this.name
      });
    }

    const requestedPath = input.path ?? ".";
    const rootPath = resolveInsideWorkspace(config.workspaceRoot, requestedPath);
    const maxFiles = input.maxFiles ?? config.maxSearchFiles ?? DEFAULT_MAX_FILES;
    const maxMatches = input.maxMatches ?? config.maxSearchMatches ?? DEFAULT_MAX_MATCHES;
    const maxFileBytes = input.maxFileBytes ?? config.maxSearchFileBytes ?? DEFAULT_MAX_SEARCH_FILE_BYTES;
    const candidateFiles = [];
    const scanState = { truncated: false };

    await collectCandidateFiles({
      directoryPath: rootPath,
      workspaceRoot: config.workspaceRoot,
      candidateFiles,
      maxFiles,
      scanState
    });

    const matches = await findMatches({
      workspaceRoot: config.workspaceRoot,
      candidateFiles,
      query,
      maxMatches,
      maxFileBytes,
      scanState
    });

    return {
      toolName: this.name,
      query,
      path: relative(config.workspaceRoot, rootPath) || ".",
      candidateFiles,
      matches,
      truncated: scanState.truncated
    };
  }
};

async function collectCandidateFiles({ directoryPath, workspaceRoot, candidateFiles, maxFiles, scanState }) {
  if (candidateFiles.length >= maxFiles) {
    scanState.truncated = true;
    return;
  }

  let entries;
  try {
    entries = await readdir(directoryPath, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    if (candidateFiles.length >= maxFiles) {
      scanState.truncated = true;
      return;
    }

    const fullPath = join(directoryPath, entry.name);

    if (entry.isDirectory()) {
      if (SKIPPED_DIRECTORIES.has(entry.name)) {
        continue;
      }

      await collectCandidateFiles({
        directoryPath: fullPath,
        workspaceRoot,
        candidateFiles,
        maxFiles,
        scanState
      });
      continue;
    }

    if (entry.isFile()) {
      candidateFiles.push(relative(workspaceRoot, fullPath));
    }
  }
}

async function findMatches({ workspaceRoot, candidateFiles, query, maxMatches, maxFileBytes, scanState }) {
  const matches = [];

  for (const candidateFile of candidateFiles) {
    if (matches.length >= maxMatches) {
      scanState.truncated = true;
      return matches;
    }

    const fullPath = join(workspaceRoot, candidateFile);

    let fileStats;
    try {
      fileStats = await stat(fullPath);
    } catch {
      continue;
    }

    if (!fileStats.isFile() || fileStats.size > maxFileBytes) {
      continue;
    }

    let content;
    try {
      content = await readFile(fullPath, "utf8");
    } catch {
      continue;
    }

    const lines = content.split(/\r?\n/);
    for (const [index, lineText] of lines.entries()) {
      if (!lineText.includes(query)) {
        continue;
      }

      matches.push({
        path: candidateFile,
        line: index + 1,
        text: lineText
      });

      if (matches.length >= maxMatches) {
        scanState.truncated = true;
        return matches;
      }
    }
  }

  return matches;
}
