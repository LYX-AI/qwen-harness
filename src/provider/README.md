# Provider Layer

This folder will contain the model provider abstraction.

The first implementation targets an OpenAI-compatible endpoint so the harness can work with:

- llama.cpp server
- Ollama-compatible adapters
- vLLM
- other local or low-cost endpoints

Current implementation:

- `openaiCompatibleProvider.js`

It sends a non-streaming `chat/completions` request and normalizes the assistant text response for the agent loop.
