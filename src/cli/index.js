#!/usr/bin/env node

import { runAgentTurn } from "../core/agentLoop.js";
import { loadConfig } from "../config/loadConfig.js";
import { createSessionStore } from "../session/store.js";
import { executeTool, listTools } from "../tools/registry.js";

const args = process.argv.slice(2);
const command = args[0] ?? "help";

async function main() {
  if (command === "help" || command === "--help" || command === "-h") {
    printHelp();
    return;
  }

  if (command === "doctor") {
    const config = await loadConfig();
    const store = createSessionStore(config.sessionDir);
    const session = await store.getOrCreateLatestSession(config);

    console.log("Qwen Harness doctor");
    console.log(`version: ${config.version}`);
    console.log(`workspaceRoot: ${config.workspaceRoot}`);
    console.log(`sessionDir: ${config.sessionDir}`);
    console.log(`modelEndpoint: ${config.modelEndpoint}`);
    console.log(`modelName: ${config.modelName}`);
    console.log(`modelTimeoutMs: ${config.modelTimeoutMs}`);
    console.log(`tools: ${listTools().map((tool) => tool.name).join(", ")}`);
    console.log(`latestSession: ${session.id}`);
    return;
  }

  if (command === "tool") {
    const toolName = args[1];
    if (!toolName) {
      console.error("Usage: qwen-harness tool <tool-name> [path]");
      process.exitCode = 1;
      return;
    }

    const config = await loadConfig();
    const store = createSessionStore(config.sessionDir);
    const session = await store.getOrCreateLatestSession(config);
    const input = { path: args[2] ?? "." };
    const result = await executeTool({
      name: toolName,
      input,
      config
    });

    await store.appendToolCall(session.id, {
      toolName,
      input,
      result,
      status: "success",
      createdAt: new Date().toISOString()
    });

    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (command === "prompt") {
    const prompt = args.slice(1).join(" ").trim();
    if (!prompt) {
      console.error("Usage: qwen-harness prompt \"your request\"");
      process.exitCode = 1;
      return;
    }

    const config = await loadConfig();
    const store = createSessionStore(config.sessionDir);
    const session = await store.getOrCreateLatestSession(config);
    const result = await runAgentTurn({ prompt, config, session, store });

    console.log(result.text);
    return;
  }

  console.error(`Unknown command: ${command}`);
  printHelp();
  process.exitCode = 1;
}

function printHelp() {
  console.log(`Qwen Harness

Usage:
  qwen-harness doctor
  qwen-harness tool list_directory [path]
  qwen-harness tool read_file <path>
  qwen-harness prompt "your request"

Day 1 commands:
  doctor   Print config and session status
  tool     Run a registered tool manually
  prompt   Run one placeholder agent turn and save it to the latest session
`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
