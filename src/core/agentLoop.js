import { callOpenAICompatibleProvider } from "../provider/openaiCompatibleProvider.js";

export async function runAgentTurn({ prompt, config, session, store }) {
  const userMessage = {
    role: "user",
    content: prompt,
    createdAt: new Date().toISOString()
  };

  await store.appendMessage(session.id, userMessage);

  let providerResult;
  try {
    providerResult = await callOpenAICompatibleProvider({
      config,
      messages: [...session.messages, userMessage]
    });
  } catch (error) {
    providerResult = {
      text: [
      "Model provider is not reachable yet.",
      `Endpoint: ${config.modelEndpoint}`,
      `Error kind: ${error?.kind ?? "unknown"}`,
      `Reason: ${error instanceof Error ? error.message : String(error)}`,
      "",
      "This is expected until a local OpenAI-compatible model server is running."
      ].join("\n")
    };
  }

  const assistantMessage = {
    role: "assistant",
    content: providerResult.text,
    createdAt: new Date().toISOString()
  };

  await store.appendMessage(session.id, assistantMessage);

  return {
    text: assistantMessage.content
  };
}
