import { mkdir, readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const defaultConfigPath = join(projectRoot, "config", "qwen-harness.json");

export async function loadConfig() {
  const defaults = {
    version: "0.1.0-alpha.0",
    workspaceRoot: projectRoot,
    sessionDir: join(projectRoot, "sessions"),
    modelEndpoint: "http://localhost:8080/v1/chat/completions",
    modelName: "qwen2.5-coder-7b-instruct",
    modelTimeoutMs: 5000,
    approvalMode: "ask"
  };

  await mkdir(join(projectRoot, "config"), { recursive: true });

  let fileConfig = {};
  try {
    const raw = await readFile(defaultConfigPath, "utf8");
    fileConfig = JSON.parse(raw);
  } catch (error) {
    if (error?.code !== "ENOENT") {
      throw error;
    }
  }

  return {
    ...defaults,
    ...fileConfig,
    workspaceRoot: resolve(fileConfig.workspaceRoot ?? defaults.workspaceRoot),
    sessionDir: resolve(fileConfig.sessionDir ?? defaults.sessionDir)
  };
}
