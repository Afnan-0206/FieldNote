/**
 * Client API layer for FieldNote local backend.
 */

const API_BASE = '/api';

export async function fetchAiHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`, {
      headers: { Accept: 'application/json' },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        ok: false,
        provider: data.provider || (data.ollamaReachable ? 'ollama' : 'unknown'),
        ollamaReachable: Boolean(data.ollamaReachable),
        modelInstalled: Boolean(data.modelInstalled),
        bindingConfigured: Boolean(data.bindingConfigured),
        model: data.model || 'qwen2.5:7b',
        availableModels: data.availableModels || [],
        error: data.error || `Server responded with status ${res.status}`,
      };
    }
    return {
      provider: data.provider || (data.ollamaReachable ? 'ollama' : 'cloudflare-workers-ai'),
      ...data,
    };
  } catch (err) {
    return {
      ok: false,
      provider: 'unknown',
      ollamaReachable: false,
      modelInstalled: false,
      bindingConfigured: false,
      model: 'unknown',
      availableModels: [],
      error: `Cannot connect to FieldNote API at ${API_BASE}/health. Make sure the backend server or Pages deployment is running. (${err.message})`,
    };
  }
}

export async function generateMission({
  duration = 10,
  interests = ['plants', 'trees'],
  environment = 'park',
  experience = 'curious observer',
  previousObservations = [],
}) {
  try {
    const res = await fetch(`${API_BASE}/mission`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        duration,
        interests,
        environment,
        experience,
        previousObservations,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.ok) {
      throw new Error(data.error || `Failed to generate mission (HTTP ${res.status})`);
    }

    return { ok: true, mission: data.mission };
  } catch (err) {
    return {
      ok: false,
      error: err.message || 'Could not communicate with local AI service.',
    };
  }
}

export async function organizeNotes({
  missionTitle = 'Outdoor Observation',
  notes = '',
  surprises = '',
  location = '',
  sensoryDetails = '',
  duration = 10,
  environment = 'park',
}) {
  try {
    const res = await fetch(`${API_BASE}/reflect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        missionTitle,
        notes,
        surprises,
        location,
        sensoryDetails,
        duration,
        environment,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.ok) {
      throw new Error(data.error || `Failed to organize notes (HTTP ${res.status})`);
    }

    return { ok: true, entry: data.entry };
  } catch (err) {
    return {
      ok: false,
      error: err.message || 'Could not organize notes with local AI.',
    };
  }
}
