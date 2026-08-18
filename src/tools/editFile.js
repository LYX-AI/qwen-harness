import { ToolError } from "./errors.js";
import {relative} from "node:path";
import {resolveInsideWorkspace} from "./pathSafety.js";
import {readFile,stat,writeFile} from "node:fs/promises";
const DEFAULT_MAX_BYTES = 64 * 1024;
export const editFileTool = {
    name: 'edit_file',
    description: 'Replace exact text in a file inside the configured workspace',
    readOnly: false,

    async execute({config,input = {}}){
        const requestedPath = input.path;
        const oldText = input.oldText;
        const newText = input.newText;
        const replaceAll = input.replaceAll ?? false;
        if (typeof requestedPath !== 'string' || requestedPath.trim() === '') {
            throw new ToolError("edit_file requires a non-empty input.path ", { 
                kind: 'invalid_input',
                toolName: this.name 
            });
    }
       if (typeof oldText !== 'string'||oldText.length === 0) {
            throw new ToolError("edit_file requires a non-empty input.oldText ", { 
                kind: 'invalid_input',
                toolName: this.name 
            });
        }
        if (typeof newText !== 'string') {
            throw new ToolError("edit_file requires a string input.newText ", { 
                kind: 'invalid_input',
                toolName: this.name 
            });
        }

        if(typeof replaceAll !== 'boolean'){
            throw new ToolError(
                "edit_file requires boolean input.replaceAll",
                {
                    kind: "invalid_input",
                    toolName: this.name
                }
            );
        }

        const targetPath = resolveInsideWorkspace(
            config.workspaceRoot, 
            requestedPath
        );

        let fileStats;
        try {
            fileStats = await stat(targetPath);
        } catch (error) {
            throw new ToolError(`Could not inspect file: ${requestedPath}`, {
                kind: 'stat_failed',
                toolName: this.name,
                cause: error
            });
        }
        //不能把目录当成文件修改

        if(!fileStats.isFile()){
            throw new ToolError(`Path is not a file: ${requestedPath}`, {
                kind: 'not_file',
                toolName: this.name
            });
        }

        const maxBytes = config.maxFileEditBytes ?? DEFAULT_MAX_BYTES;
        if(fileStats.size > maxBytes){
            throw new ToolError(`File is too large to edit: ${requestedPath} (${fileStats.size} bytes > ${maxBytes} bytes)`, {
                kind: 'file_too_large',
                toolName: this.name
            });
        }

        let content;
        try {
            content = await readFile(targetPath, 'utf8');
        } catch (error) {
            throw new ToolError(`Could not read file: ${requestedPath}`, {
                kind: 'read_failed',
                toolName: this.name,
                cause: error
            });
        }
        const matchCount = content.split(oldText).length -1;
        if(matchCount === 0){
            throw new ToolError(`Old text not found in file: ${requestedPath}`, {
                kind: 'old_text_not_found',
                toolName: this.name
            });
        }
        if (matchCount > 1 && !replaceAll) {
            throw new ToolError(`Old text found multiple times in file: ${requestedPath}. Use replaceAll to replace all occurrences.`, {
                kind: 'multiple_occurrences',
                toolName: this.name
            });
    
        }
        const nextContent = replaceAll ? content.replaceAll(oldText, newText) : content.replace(oldText, newText);
        try {
            await writeFile(targetPath, nextContent,"utf8");
        } catch (error) {
            throw new ToolError(`Could not write file:${requestedPath}`,{
                kind: "write_failed",
                toolName: this.name,
                cause: error
            });

    }
    return{
        toolName: this.name,
        path: relative(config.workspaceRoot,targetPath),
        replacements:matchCount,
        bytesBefore:fileStats.size,
        bytesAfter:Buffer.byteLength(nextContent,'utf8')
        };
    }
};
