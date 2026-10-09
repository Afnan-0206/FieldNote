import express from 'express';
import { config } from './config.js';
import { checkOllamaHealth, callOllamaChat } from './ollama.js';
import { buildMissionPrompt, buildReflectPrompt } from '../shared/prompts.js';
import { validateMissionInput, validateReflectInput } from '../shared/validators.js';
import { formatMissionOutput, formatReflectionOutput } from '../shared/formatters.js';

export const app = express();

app.use(express.json({ limit: '1mb' }));

// CORS headers for local development convenience
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Request logger for local transparency
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.path.startsWith('/api')) {
      console.log(`[API] ${req.method} ${req.path} -> ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

/**
 * Health check endpoint.
 * Accurately reports whether Ollama is reachable and whether the configured model is installed.
 */
app.get('/api/health', async (req, res) => {
  try {
    const health = await checkOllamaHealth();
    return res.status(health.ollamaReachable ? 200 : 503).json({
      ...health,
      provider: 'ollama',
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      provider: 'ollama',
      ollamaReachable: false,
      modelInstalled: false,
      model: config.ollamaModel,
      error: err.message,
    });
  }
});

/**
 * Generates a personalized outdoor observation mission using local AI.
 */
app.post('/api/mission', async (req, res) => {
  try {
    const validation = validateMissionInput(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        ok: false,
        error: validation.error,
      });
    }

    const { duration, interests, environment, experience, previousObservations } = validation.data;

    const { systemPrompt, userPrompt } = buildMissionPrompt({
      duration,
      interests,
      environment,
      experience,
      previousObservations,
    });

    const mission = await callOllamaChat({ systemPrompt, userPrompt });

    if (!mission || typeof mission !== 'object') {
      return res.status(502).json({
        ok: false,
        error: 'Local AI returned an unexpected response format.',
      });
    }

    const validatedMission = formatMissionOutput(mission, { duration, environment, interests });

    return res.status(200).json({
      ok: true,
      mission: validatedMission,
    });
  } catch (err) {
    console.error('Error generating mission:', err);
    return res.status(500).json({
      ok: false,
      error: err.message || 'Failed to generate mission with local AI.',
    });
  }
});

/**
 * Organizes rough observation notes into a well-structured field journal entry.
 */
app.post('/api/reflect', async (req, res) => {
  try {
    const validation = validateReflectInput(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        ok: false,
        error: validation.error,
      });
    }

    const { missionTitle, notes, surprises, location, sensoryDetails, duration, environment } = validation.data;

    const { systemPrompt, userPrompt } = buildReflectPrompt({
      missionTitle,
      notes,
      surprises,
      location,
      sensoryDetails,
    });

    const reflection = await callOllamaChat({ systemPrompt, userPrompt });

    if (!reflection || typeof reflection !== 'object') {
      return res.status(502).json({
        ok: false,
        error: 'Local AI returned an invalid reflection format.',
      });
    }

    const validatedEntry = formatReflectionOutput(reflection, {
      missionTitle,
      notes,
      surprises,
      sensoryDetails,
      location,
      duration,
      environment,
    });

    return res.status(200).json({
      ok: true,
      entry: validatedEntry,
    });
  } catch (err) {
    console.error('Error organizing notes:', err);
    return res.status(500).json({
      ok: false,
      error: err.message || 'Failed to organize notes with local AI.',
    });
  }
});

let serverInstance = null;

export function startServer(port = config.port, host = config.host) {
  return new Promise((resolve, reject) => {
    serverInstance = app.listen(port, host, () => {
      console.log(`[FieldNote Backend] Server running on http://${host}:${port}`);
      console.log(`[FieldNote Backend] Configured Ollama target: ${config.ollamaHost} (${config.ollamaModel})`);
      resolve(serverInstance);
    });

    serverInstance.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`[FieldNote Backend] Port ${port} is already in use by another process.`);
      } else {
        console.error(`[FieldNote Backend] Server error:`, err);
      }
      reject(err);
    });
  });
}

export function stopServer() {
  return new Promise((resolve) => {
    if (serverInstance) {
      serverInstance.close(() => resolve());
    } else {
      resolve();
    }
  });
}

// Auto-start server when run directly (not in tests or when imported)
const isDirectExecution = process.argv[1] && (
  process.argv[1].endsWith('server\\index.js') ||
  process.argv[1].endsWith('server/index.js')
);

if (isDirectExecution && process.env.NODE_ENV !== 'test') {
  startServer().catch(() => process.exit(1));
}
