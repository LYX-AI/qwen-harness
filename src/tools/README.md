# Tool Layer

This folder will contain the tool registry and first five tools:

- `list_directory`
- `read_file`
- `search_files`
- `edit_file`
- `run_shell`

The design rule is simple:

> Every external action must go through a named tool contract.

Current implementation:

- `registry.js` registers and executes tools by name.
- `listDirectory.js` implements the first read-only tool.
- `pathSafety.js` ensures requested paths stay inside the configured workspace.
- `errors.js` defines `ToolError` for tool-layer failures.
