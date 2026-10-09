export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  host: process.env.HOST || '127.0.0.1',
  ollamaHost: process.env.OLLAMA_HOST || 'http://127.0.0.1:11434',
  ollamaModel: process.env.OLLAMA_MODEL || 'qwen2.5:7b',
  requestTimeoutMs: parseInt(process.env.REQUEST_TIMEOUT_MS || '120000', 10),
};
