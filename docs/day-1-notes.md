# Day 1 Notes

Date: 2026-06-08

## Goal

Start the real project with a small but executable foundation.

Today is not about model quality or advanced autonomy. Today is about making the project shape real:

- a runnable CLI
- a central loop module
- a config module
- a session module
- a clear place for future tools and model providers

## Borrowed Ideas From `claude-code-analysis`

The reference project shows that a serious harness is built around explicit subsystems.

Applied today:

- `entrypoints`: represented by `src/cli/index.js`
- `QueryEngine`: simplified as `src/core/agentLoop.js`
- `state/session`: represented by `src/session/store.js`
- `config`: represented by `src/config/loadConfig.js`

Not applied today:

- React / Ink terminal UI
- 40+ tools
- 100+ slash commands
- MCP
- plugins
- multi-agent coordination
- remote sessions

## Day 1 Scope

Implemented:

- CLI command dispatch
- `doctor` command
- one-shot `prompt` command
- config loading with defaults
- session creation and message append
- minimal agent loop placeholder

Next:

- model provider abstraction
- local OpenAI-compatible endpoint call
- tool registry
- read-only tools first
