# Qwen Harness

A local-first terminal coding harness for Qwen coder models.

This project starts small on purpose. Version `v0.1.0` is focused on the basic harness shape:

- terminal input
- one central agent loop
- local session storage
- local config loading
- future tool registry for file and shell tools
- future OpenAI-compatible model provider

## Current Status

The current build is an early alpha with a runnable CLI, config loading, session persistence, and an OpenAI-compatible model provider boundary.

```bash
npm run doctor
npm run prompt -- "hello"
```

If no model server is running, `prompt` prints a clear provider error instead of hanging indefinitely.

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
