# Qwen Harness

A local-first terminal coding harness for Qwen coder models.

Qwen Harness is being built as a small, serious AI coding harness rather than a chatbot wrapper. The goal is to wrap an open or low-cost coding model with controlled tools, local sessions, and clear execution boundaries.

Version `v0.1.0` is focused on the basic harness shape:

- terminal input
- one central agent loop
- local session storage
- local config loading
- OpenAI-compatible model provider boundary
- centralized tool registry
- workspace path safety
- permission decisions and approval enforcement

## Current Status

The current build is an early alpha with:

- runnable CLI commands
- config loading
- local JSON session persistence
- OpenAI-compatible model provider boundary
- provider timeout and classified provider errors
- read-only `list_directory`, `read_file`, and `search_files` tools
- a controlled `edit_file` mutating tool
- workspace path safety and file-size limits
- an `allow / ask / deny` approval policy
- an approval gate enforced before registered tools execute
- a CLI `y/n` approval prompt for mutating tools
- automated policy, gate, registry, and `edit_file` tests
- tool call traces saved into the current session

```bash
npm run doctor
npm run prompt -- "hello"
node ./src/cli/index.js tool list_directory .
node ./src/cli/index.js tool read_file package.json
node ./src/cli/index.js tool search_files executeTool src
node ./src/cli/index.js tool edit_file README.md "old text" "new text"
npm test
```

If no model server is running, `prompt` prints a clear provider error instead of hanging indefinitely.

## Current Commands

```bash
node ./src/cli/index.js doctor
node ./src/cli/index.js prompt "your request"
node ./src/cli/index.js tool list_directory [path]
node ./src/cli/index.js tool read_file <path>
node ./src/cli/index.js tool search_files <query> [path]
node ./src/cli/index.js tool edit_file <path> <oldText> <newText> [--replace-all]
```

Read-only tools inspect paths inside the configured workspace. `edit_file`
replaces exact text in a workspace file after approval. Attempts to escape the
workspace, such as `..`, are rejected. File reads, searches, and edits also use
size and result limits to avoid returning or rewriting unbounded content.

In default `ask` mode, `edit_file` prints the tool name, reason, and input, then
waits for `y` or `n`. Only `y` allows the write.

## Approval Boundary

Every registered tool now passes through the approval gate before its
`execute()` method can run:

```text
executeTool()
  -> enforceApproval()
  -> evaluateApproval()
  -> allow: continue
  -> ask: require an explicit approval callback
  -> deny: stop with an error
  -> tool.execute()
```

Read-only tools are allowed without prompting. Mutating tools can be allowed,
denied, or delegated to a caller-provided approval handler according to
`approvalMode`.

The approval handler is intentionally separate from the gate. The CLI supplies a
`requestApproval` function that asks `y/n` in the terminal. Tests inject their
own handler so they can approve or deny without waiting for keyboard input.

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
  "maxFileReadBytes": 65536,
  "maxFileEditBytes": 65536,
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
- permission-first execution before tools can affect the workspace

It does not copy implementation code.

## Design Principles

- Local-first: the first version works as a single-user local developer tool.
- Tool-boundary first: external actions go through registered tools.
- Read-only before mutating: file reads and searches come before edits or shell execution.
- Permission-first: registered tools pass through one approval boundary before execution.
- Traceable execution: messages and tool calls are saved into local sessions.
- Small releases: each milestone adds one understandable capability.

## Current Limitations

- No `run_shell` tool.
- The model does not yet select and invoke tools automatically.
- Session traces do not yet include approval decisions.
- `edit_file` replaces exact strings only; it does not apply patches or regex.

## Roadmap

- `04A`: add `list_directory` read-only tool. Done.
- `04B`: document current harness capabilities. Done.
- `05A`: add `read_file` with workspace safety and basic size limits. Done.
- `05B`: document read-only file access design. Done.
- `06A`: add simple `search_files`. Done.
- `07A`: add approval policy foundation before mutating tools. Done.
- `07B`: enforce approval decisions at the tool registry boundary. Done.
- `08`: add a controlled `edit_file` tool. Done.
- `09`: add a controlled `run_shell` tool.
