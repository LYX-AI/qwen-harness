import { listDirectoryTool } from "./listDirectory.js";
import { readFileTool } from "./readFile.js";
import { searchFilesTool } from "./searchFiles.js";

const tools = new Map([
  [listDirectoryTool.name, listDirectoryTool],
  [readFileTool.name, readFileTool],
  [searchFilesTool.name, searchFilesTool]
]);

export function getTool(name) {
  return tools.get(name);
}

export function listTools() {
  return [...tools.values()].map((tool) => ({
    name: tool.name,
    description: tool.description,
    readOnly: tool.readOnly
  }));
}

export async function executeTool({ name, input, config }) {
  const tool = getTool(name);

  if (!tool) {
    throw new Error(`Unknown tool: ${name}`);
  }

  return tool.execute({ input, config });
}
