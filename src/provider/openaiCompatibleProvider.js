export class ModelProviderError extends Error {
  constructor(message, { kind, cause } = {}) {
    super(message);
    this.name = "ModelProviderError";
    this.kind = kind ?? "unknown";
    this.cause = cause;
  }
}

export async function callOpenAICompatibleProvider({ config, messages }) {
  const timeoutMs = config.modelTimeoutMs ?? 5000;
  const signal = AbortSignal.timeout(timeoutMs);

  let response;
  try {
    response = await fetch(config.modelEndpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      signal,
      body: JSON.stringify({
        model: config.modelName,
        messages: messages.map((message) => ({
          role: message.role,
          content: message.content
        })),
        temperature: 0.2,
        stream: false
      })
    });
  } catch (error) {
    const kind = error?.name === "TimeoutError" ? "timeout" : "network";
    throw new ModelProviderError(`Could not reach model provider: ${error.message}`, {
      kind,
      cause: error
    });
  }

  if (!response.ok) {
    const body = await response.text();
    throw new ModelProviderError(`Model provider returned HTTP ${response.status}: ${body}`, {
      kind: "http"
    });
  }

  let payload;
  try {
    payload = await response.json();
  } catch (error) {
    throw new ModelProviderError(`Model provider returned invalid JSON: ${error.message}`, {
      kind: "invalid_json",
      cause: error
    });
  }

  const text = extractAssistantText(payload);
  if (typeof text !== "string" || text.trim() === "") {
    throw new ModelProviderError("Model provider response did not contain choices[0].message.content", {
      kind: "invalid_schema"
    });
  }

  return {
    text
  };
}

function extractAssistantText(payload) {
  return payload?.choices?.[0]?.message?.content;
}
