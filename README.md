# Qwen Harness

A local-first terminal coding harness for Qwen coder models.

This project starts small on purpose. Version `v0.1.0` is focused on the basic harness shape:

- terminal input
- one central agent loop
- local session storage
- local config loading
- future tool registry for file and shell tools
- future OpenAI-compatible model provider

## Day 1 Status

The current build is a project skeleton with a runnable CLI, config loading, and session persistence.

```bash
npm run doctor
npm run prompt -- "hello"
```

## Design Reference

This project studies architecture ideas from `claude-code-analysis`, especially:

- entry point separation
- central query / agent loop
- explicit session and config layers
- tool registry as the boundary between model intent and real actions

It does not copy implementation code.
