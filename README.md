# Qwen Harness

A local-first terminal coding harness for Qwen coder models.

Qwen Harness is being built as a small, serious AI coding harness rather than a chatbot wrapper. The goal is to wrap an open or low-cost coding model with controlled tools, local sessions, and clear execution boundaries.

Version `v0.1.0` is focused on the basic harness shape:

- terminal input
- one central agent loop
- local session storage
- local config loading
- OpenAI-compatible model provider boundary
- read-only tool registry
- workspace path safety

## Current Status

The current build is an early alpha with:

- runnable CLI commands
- config loading
- local JSON session persistence
- OpenAI-compatible model provider boundary
- provider timeout and classified provider errors
- a read-only `list_directory` tool
- tool call traces saved into the current session

```bash
npm run doctor
npm run prompt -- "hello"
node ./src/cli/index.js tool list_directory .
```

If no model server is running, `prompt` prints a clear provider error instead of hanging indefinitely.

## Current Commands

```bash
node ./src/cli/index.js doctor
node ./src/cli/index.js prompt "your request"
node ./src/cli/index.js tool list_directory [path]
```

`list_directory` only reads paths inside the configured workspace. Attempts to escape the workspace, such as `..`, are rejected.

## Configuration

Defaults are built into `src/config/loadConfig.js`. To override them locally, create:

```text
config/qwen-harness.json
```

Use `config/qwen-harness.example.json` as the template:

```json
{
  "workspaceRoot": "E:/Harness/Project",
  "sessionDir": "E:/Harness/Project/sessions",
  "modelEndpoint": "http://localhost:8080/v1/chat/completions",
  "modelName": "qwen2.5-coder-7b-instruct",
  "modelTimeoutMs": 5000,
  "approvalMode": "ask"
}
```

The model endpoint can point to a local or remote OpenAI-compatible server.

## Design Reference

This project studies architecture ideas from `claude-code-analysis`, especially:

- entry point separation
- central query / agent loop
- explicit session and config layers
- tool registry as the boundary between model intent and real actions

It does not copy implementation code.

## Design Principles

- Local-first: the first version works as a single-user local developer tool.
- Tool-boundary first: external actions go through registered tools.
- Read-only before mutating: file reads and searches come before edits or shell execution.
- Traceable execution: messages and tool calls are saved into local sessions.
- Small releases: each milestone adds one understandable capability.

## Roadmap

- `04A`: add `list_directory` read-only tool. Done.
- `04B`: document current harness capabilities. Done.
- `05A`: add `read_file` with workspace safety and basic size limits.
- `05B`: document read-only file access design.
- `06A`: add simple `search_files`.
- `07A`: add approval policy foundation before mutating tools.
