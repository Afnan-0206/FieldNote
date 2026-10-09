/**
 * Cloudflare Pages Function: POST /api/reflect
 * Organizes rough field notes into a structured journal entry using Cloudflare Workers AI.
 */

import { validateReflectInput } from '../../shared/validators.js';
import { buildReflectPrompt } from '../../shared/prompts.js';
import { extractJson } from '../../shared/json.js';
import { formatReflectionOutput } from '../../shared/formatters.js';

const WORKERS_AI_MODEL = '@cf/meta/llama-3.2-3b-instruct';
const MAX_PAYLOAD_BYTES = 64 * 1024; // 64 KB

export async function onRequestPost(context) {
  const { request, env } = context;
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
  };

  // 1. Enforce payload size limit
  const contentLength = parseInt(request.headers.get('content-length') || '0', 10);
  if (contentLength > MAX_PAYLOAD_BYTES) {
    return new Response(
      JSON.stringify({ ok: false, error: 'Request payload exceeds maximum allowed size (64KB).' }),
      { status: 413, headers }
    );
  }

  // 2. Parse request JSON body
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ ok: false, error: 'Malformed JSON in request body.' }),
      { status: 400, headers }
    );
  }

  // 3. Validate input
  const validation = validateReflectInput(body);
  if (!validation.isValid) {
    return new Response(
      JSON.stringify({ ok: false, error: validation.error }),
      { status: 400, headers }
    );
  }

  // 4. Verify Workers AI binding
  if (!env || !env.AI) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: "Cloudflare Workers AI binding 'AI' is missing in project configuration. Add a Workers AI binding named 'AI' in Pages Settings > Bindings.",
      }),
      { status: 503, headers }
    );
  }

  const { missionTitle, notes, surprises, location, sensoryDetails, duration, environment } = validation.data;
  const { systemPrompt, userPrompt } = buildReflectPrompt({
    missionTitle,
    notes,
    surprises,
    location,
    sensoryDetails,
  });

  // 5. Invoke Workers AI model
  let rawOutput;
  try {
    const aiResponse = await env.AI.run(WORKERS_AI_MODEL, {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 1024,
    });

    if (typeof aiResponse?.response === 'string') {
      rawOutput = aiResponse.response;
    } else if (aiResponse && typeof aiResponse === 'object') {
      rawOutput = typeof aiResponse.response !== 'undefined'
        ? JSON.stringify(aiResponse.response)
        : JSON.stringify(aiResponse);
    } else {
      throw new Error('Empty or unrecognized response structure from Workers AI.');
    }
  } catch (err) {
    console.error('Workers AI note reflection error:', err);
    const errMessage = String(err.message || err);
    const isRateLimit = errMessage.includes('rate') || errMessage.includes('429') || errMessage.includes('quota') || errMessage.includes('limit');

    return new Response(
      JSON.stringify({
        ok: false,
        error: isRateLimit
          ? 'Cloudflare Workers AI daily free neuron allowance or rate limit reached. Please try again later.'
          : `Workers AI inference error: ${errMessage}`,
      }),
      { status: isRateLimit ? 429 : 502, headers }
    );
  }

  // 6. Extract JSON & validate schema
  try {
    const parsed = extractJson(rawOutput);
    const validatedEntry = formatReflectionOutput(parsed, {
      missionTitle,
      notes,
      surprises,
      sensoryDetails,
      location,
      duration,
      environment,
    });

    return new Response(
      JSON.stringify({ ok: true, entry: validatedEntry }),
      { status: 200, headers }
    );
  } catch (err) {
    console.error('Failed to parse or format model reflection output:', err, 'Raw was:', rawOutput);
    return new Response(
      JSON.stringify({
        ok: false,
        error: `Cloudflare Workers AI returned an invalid reflection structure: ${err.message}`,
      }),
      { status: 502, headers }
    );
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
