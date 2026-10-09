import { config } from './config.js';
import { extractJson } from '../shared/json.js';

export { extractJson };

/**
 * Checks connection to local Ollama instance and verifies model availability.
 */
export function normalizeModelName(name = '') {
  return name.trim().toLowerCase();
}

export function isModelAvailable(availableModels, targetModel) {
  const target = normalizeModelName(targetModel);
  const targetBase = target.split(':')[0];

  return availableModels.some((m) => {
    const norm = normalizeModelName(m);
    return norm === target || norm.split(':')[0] === targetBase;
  });
}

export async function checkOllamaHealth() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const res = await fetch(`${config.ollamaHost}/api/tags`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return {
        ok: false,
        ollamaReachable: true,
        modelInstalled: false,
        model: config.ollamaModel,
        statusText: `Ollama returned HTTP ${res.status}`,
        error: `Ollama responded with status ${res.status}`,
        availableModels: [],
      };
    }

    const data = await res.json();
    const availableModels = Array.isArray(data?.models)
      ? data.models.map((m) => m.name || m.model || String(m))
      : [];

    const modelInstalled = isModelAvailable(availableModels, config.ollamaModel);

    return {
      ok: modelInstalled,
      ollamaReachable: true,
      modelInstalled,
      model: config.ollamaModel,
      availableModels,
      message: modelInstalled
        ? `Model "${config.ollamaModel}" is ready.`
        : `Ollama is running, but "${config.ollamaModel}" was not found in installed models.`,
    };
  } catch (err) {
    clearTimeout(timeoutId);
    const isTimeout = err.name === 'AbortError';
    return {
      ok: false,
      ollamaReachable: false,
      modelInstalled: false,
      model: config.ollamaModel,
      availableModels: [],
      error: isTimeout
        ? `Connection to Ollama timed out at ${config.ollamaHost}. Is Ollama running?`
        : `Could not connect to Ollama at ${config.ollamaHost}. Run "ollama serve" or launch the Ollama app. (${err.message})`,
    };
  }
}

/**
 * Sends a non-streaming chat request to Ollama with timeout and error handling.
 */
export async function callOllamaChat({ systemPrompt, userPrompt }) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.requestTimeoutMs);

  try {
    const response = await fetch(`${config.ollamaHost}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: config.ollamaModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        stream: false,
        options: {
          temperature: 0.7,
        },
      }),
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(`Ollama chat request failed with status ${response.status}: ${errorText || response.statusText}`);
    }

    const result = await response.json();
    const content = result.message?.content;

    if (!content) {
      throw new Error('Ollama returned an empty response message.');
    }

    return extractJson(content);
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error(`Ollama request timed out after ${config.requestTimeoutMs / 1000}s. Your machine may be under heavy load.`, { cause: err });
    }
    throw err;
  }
}
