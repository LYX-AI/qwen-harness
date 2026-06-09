export async function runAgentTurn({ prompt, config, session, store }) {
  const userMessage = {
    role: "user",
    content: prompt,
    createdAt: new Date().toISOString()
  };

  await store.appendMessage(session.id, userMessage);

  const assistantMessage = {
    role: "assistant",
    content: [
      "Day 1 harness loop is running.",
      "Model provider and tool execution are intentionally not connected yet.",
      `Configured model endpoint: ${config.modelEndpoint}`
    ].join("\n"),
    createdAt: new Date().toISOString()
  };

  await store.appendMessage(session.id, assistantMessage);

  return {
    text: assistantMessage.content
  };
}
