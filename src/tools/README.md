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

- `registry.js` registers and executes tools by name. Mutating tools pass through the approval gate first.
- `listDirectory.js` implements the first read-only tool.
- `readFile.js` reads UTF-8 text files inside the workspace with a basic size limit.
- `searchFiles.js` searches workspace text files and returns matching locations.
- `editFile.js` replaces exact text in a workspace file after approval.
- `pathSafety.js` ensures requested paths stay inside the configured workspace.
- `errors.js` defines `ToolError` for tool-layer failures.

`edit_file` input:

```js
{
  path: "src/example.js",
  oldText: "old",
  newText: "new",
  replaceAll: false
}
```

Default behavior replaces one exact match. Multiple matches require `replaceAll: true`.
The CLI asks `y/n` before the write because `readOnly` is `false`.
