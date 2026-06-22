import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

export function createSessionStore(sessionDir) {
  return {
    async getOrCreateLatestSession(config) {
      await mkdir(sessionDir, { recursive: true });
      const files = await readdir(sessionDir);
      const sessions = files.filter((file) => file.endsWith(".json")).sort();

      if (sessions.length > 0) {
        const latest = sessions.at(-1);
        const session = JSON.parse(await readFile(join(sessionDir, latest), "utf8"));
        return session;
      }

      const session = createSession(config);
      await writeSession(sessionDir, session);
      return session;
    },

    async appendMessage(sessionId, message) {
      const path = join(sessionDir, `${sessionId}.json`);
      const session = JSON.parse(await readFile(path, "utf8"));
      session.messages.push(message);
      session.updatedAt = new Date().toISOString();
      await writeSession(sessionDir, session);
      return session;
    },

    async appendToolCall(sessionId, toolCall) {
      const path = join(sessionDir, `${sessionId}.json`);
      const session = JSON.parse(await readFile(path, "utf8"));
      session.toolCalls ??= [];
      session.toolCalls.push(toolCall);
      session.updatedAt = new Date().toISOString();
      await writeSession(sessionDir, session);
      return session;
    }
  };
}

function createSession(config) {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, "-");

  return {
    id: `session-${timestamp}`,
    version: config.version,
    modelName: config.modelName,
    workspaceRoot: config.workspaceRoot,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    messages: [],
    toolCalls: []
  };
}

async function writeSession(sessionDir, session) {
  await mkdir(sessionDir, { recursive: true });
  await writeFile(join(sessionDir, `${session.id}.json`), `${JSON.stringify(session, null, 2)}\n`, "utf8");
}
