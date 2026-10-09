import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { onRequestGet as healthGet } from '../../functions/api/health.js';
import { onRequestPost as missionPost } from '../../functions/api/mission.js';
import { onRequestPost as reflectPost } from '../../functions/api/reflect.js';

describe('Cloudflare Pages Function: GET /api/health', () => {
  it('returns 200 when Workers AI binding is present', async () => {
    const mockContext = {
      env: {
        AI: {
          run: async () => ({ response: 'ok' }),
        },
      },
    };

    const response = await healthGet(mockContext);
    assert.equal(response.status, 200);

    const data = await response.json();
    assert.equal(data.ok, true);
    assert.equal(data.provider, 'cloudflare-workers-ai');
    assert.equal(data.model, '@cf/meta/llama-3.2-3b-instruct');
    assert.equal(data.bindingConfigured, true);
    assert.match(data.message, /configured/i);
  });

  it('returns 503 with dashboard diagnostic instructions when AI binding is missing', async () => {
    const mockContext = {
      env: {},
    };

    const response = await healthGet(mockContext);
    assert.equal(response.status, 503);

    const data = await response.json();
    assert.equal(data.ok, false);
    assert.equal(data.provider, 'cloudflare-workers-ai');
    assert.equal(data.bindingConfigured, false);
    assert.match(data.error, /Bindings/i);
  });
});

describe('Cloudflare Pages Function: POST /api/mission', () => {
  it('rejects payload exceeding size limit with 413', async () => {
    const req = new Request('http://localhost/api/mission', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'content-length': '100000',
      },
      body: JSON.stringify({ duration: 10 }),
    });

    const response = await missionPost({ request: req, env: { AI: {} } });
    assert.equal(response.status, 413);
    const data = await response.json();
    assert.match(data.error, /maximum allowed size/i);
  });

  it('rejects invalid duration with 400', async () => {
    const req = new Request('http://localhost/api/mission', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ duration: -5, environment: 'park' }),
    });

    const response = await missionPost({ request: req, env: { AI: {} } });
    assert.equal(response.status, 400);
    const data = await response.json();
    assert.match(data.error, /duration/i);
  });

  it('rejects empty environment with 400', async () => {
    const req = new Request('http://localhost/api/mission', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ duration: 10, environment: '   ' }),
    });

    const response = await missionPost({ request: req, env: { AI: {} } });
    assert.equal(response.status, 400);
    const data = await response.json();
    assert.match(data.error, /environment/i);
  });

  it('returns 503 when AI binding is missing', async () => {
    const req = new Request('http://localhost/api/mission', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ duration: 10, environment: 'park' }),
    });

    const response = await missionPost({ request: req, env: {} });
    assert.equal(response.status, 503);
    const data = await response.json();
    assert.match(data.error, /binding 'AI' is missing/i);
  });

  it('handles rate limits / daily neuron exhaustion gracefully with 429', async () => {
    const req = new Request('http://localhost/api/mission', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ duration: 10, environment: 'park' }),
    });

    const mockAi = {
      run: async () => {
        throw new Error('Rate limit exceeded: daily neuron limit reached (429)');
      },
    };

    const response = await missionPost({ request: req, env: { AI: mockAi } });
    assert.equal(response.status, 429);
    const data = await response.json();
    assert.match(data.error, /daily free neuron allowance/i);
  });

  it('handles malformed model output with 502 without crashing', async () => {
    const req = new Request('http://localhost/api/mission', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ duration: 10, environment: 'park' }),
    });

    const mockAi = {
      run: async () => ({ response: 'I am not returning JSON, just random text.' }),
    };

    const response = await missionPost({ request: req, env: { AI: mockAi } });
    assert.equal(response.status, 502);
    const data = await response.json();
    assert.match(data.error, /invalid mission structure/i);
  });

  it('generates and formats valid mission when model returns JSON', async () => {
    const req = new Request('http://localhost/api/mission', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        duration: 10,
        environment: 'rooftop garden',
        interests: ['clouds', 'birds'],
        experience: 'curious observer',
      }),
    });

    const mockAi = {
      run: async (model, options) => {
        assert.equal(model, '@cf/meta/llama-3.2-3b-instruct');
        assert.ok(Array.isArray(options.messages));
        return {
          response: JSON.stringify({
            title: 'Skyward Watch',
            description: 'Observe shifting clouds and high flyers from above.',
            steps: ['Look toward the horizon', 'Trace a cloud edge', 'Listen for bird calls'],
            reflectionQuestion: 'How does the sky change the feel of the city below?',
            safetyReminder: 'Stay securely behind all railings.',
          }),
        };
      },
    };

    const response = await missionPost({ request: req, env: { AI: mockAi } });
    assert.equal(response.status, 200);
    const data = await response.json();
    assert.equal(data.ok, true);
    assert.equal(data.mission.title, 'Skyward Watch');
    assert.equal(data.mission.duration, 10);
    assert.equal(data.mission.environment, 'rooftop garden');
    assert.equal(data.mission.steps.length, 3);
    assert.ok(data.mission.createdAt);
  });
});

describe('Cloudflare Pages Function: POST /api/reflect', () => {
  it('rejects empty reflection input with 400', async () => {
    const req = new Request('http://localhost/api/reflect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: '', surprises: '' }),
    });

    const response = await reflectPost({ request: req, env: { AI: {} } });
    assert.equal(response.status, 400);
    const data = await response.json();
    assert.match(data.error, /observation/i);
  });

  it('returns 503 when AI binding is missing', async () => {
    const req = new Request('http://localhost/api/reflect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: 'Saw lichen on brick' }),
    });

    const response = await reflectPost({ request: req, env: {} });
    assert.equal(response.status, 503);
  });

  it('organizes field notes faithfully when model responds with JSON', async () => {
    const req = new Request('http://localhost/api/reflect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        missionTitle: 'Skyward Watch',
        notes: 'Pale cirrus clouds drifted eastward. A pigeon rested on the chimney.',
        surprises: 'Wind felt warmer than expected.',
        location: 'Roof Terrace',
        duration: 10,
        environment: 'rooftop garden',
      }),
    });

    const mockAi = {
      run: async () => ({
        response: JSON.stringify({
          title: 'Roofline and Cirrus',
          originalSummary: 'Watched eastward-drifting cirrus and a chimney-perched pigeon.',
          readableNotes: 'Under soft morning light, feather-light cirrus clouds moved quietly across the sky.',
          tags: ['cirrus', 'pigeon', 'warm-wind'],
          reflectionPrompt: 'Notice how cloud formations signal changing weather patterns tomorrow.',
        }),
      }),
    };

    const response = await reflectPost({ request: req, env: { AI: mockAi } });
    assert.equal(response.status, 200);
    const data = await response.json();
    assert.equal(data.ok, true);
    assert.equal(data.entry.title, 'Roofline and Cirrus');
    assert.deepEqual(data.entry.tags, ['cirrus', 'pigeon', 'warm-wind']);
    assert.equal(data.entry.rawInput.notes, 'Pale cirrus clouds drifted eastward. A pigeon rested on the chimney.');
    assert.equal(data.entry.rawInput.surprises, 'Wind felt warmer than expected.');
    assert.equal(data.entry.location, 'Roof Terrace');
  });
});
