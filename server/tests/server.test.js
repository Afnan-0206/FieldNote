import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { extractJson, isModelAvailable } from '../ollama.js';
import { buildMissionPrompt, buildReflectPrompt } from '../prompts.js';
import { validateMissionInput, validateReflectInput } from '../validators.js';

describe('Ollama JSON Extraction', () => {
  it('parses direct JSON objects', () => {
    const raw = '{"title":"Watch the Pine","steps":["Look up","Listen"]}';
    const parsed = extractJson(raw);
    assert.equal(parsed.title, 'Watch the Pine');
    assert.equal(parsed.steps.length, 2);
  });

  it('extracts JSON enclosed within markdown code blocks', () => {
    const raw = 'Here is your mission:\n```json\n{\n  "title": "Moss Patterns",\n  "description": "Look at moss"\n}\n```\nEnjoy!';
    const parsed = extractJson(raw);
    assert.equal(parsed.title, 'Moss Patterns');
    assert.equal(parsed.description, 'Look at moss');
  });

  it('extracts JSON surrounded by preamble and postamble text without code blocks', () => {
    const raw = 'Certainly! {\n  "title": "Cloud Shadows",\n  "steps": ["Observe sky"]\n}\nHope this helps!';
    const parsed = extractJson(raw);
    assert.equal(parsed.title, 'Cloud Shadows');
  });

  it('throws an error when no valid JSON is present', () => {
    assert.throws(() => {
      extractJson('Just some plain text without any brackets.');
    }, /Model output did not contain a valid JSON object/);
  });
});

describe('Model Name Matching', () => {
  it('matches exact and base tag model names', () => {
    const models = ['qwen2.5:7b', 'llama3:latest'];
    assert.equal(isModelAvailable(models, 'qwen2.5:7b'), true);
    assert.equal(isModelAvailable(models, 'qwen2.5'), true);
    assert.equal(isModelAvailable(models, 'mistral:latest'), false);
  });
});

describe('Prompt Construction', () => {
  it('constructs mission prompt with custom interests and environment', () => {
    const { systemPrompt, userPrompt } = buildMissionPrompt({
      duration: 15,
      interests: ['birds', 'trees'],
      environment: 'community garden',
      experience: 'keen observer',
      previousObservations: ['noticed a chickadee yesterday'],
    });

    assert.match(systemPrompt, /FieldNote/);
    assert.match(systemPrompt, /NEVER encourage touching unknown plants/);
    assert.match(userPrompt, /15-minute/);
    assert.match(userPrompt, /community garden/);
    assert.match(userPrompt, /chickadee yesterday/);
  });

  it('constructs reflection prompt without fabricating facts', () => {
    const { systemPrompt, userPrompt } = buildReflectPrompt({
      missionTitle: 'Morning Walk',
      notes: 'Rough bark on oak tree with lichen.',
      surprises: 'A small blue butterfly appeared.',
      location: 'South Ridge Park',
      sensoryDetails: 'Smelled damp pine needles.',
    });

    assert.match(systemPrompt, /PRESERVE WHAT THE USER ACTUALLY REPORTED/);
    assert.match(userPrompt, /Rough bark on oak tree/);
    assert.match(userPrompt, /small blue butterfly/);
    assert.match(userPrompt, /South Ridge Park/);
  });
});

describe('API Input Validation', () => {
  it('rejects invalid mission requests with bad duration', () => {
    const invalidNegative = validateMissionInput({ duration: -5, environment: 'park' });
    assert.equal(invalidNegative.isValid, false);
    assert.match(invalidNegative.error, /duration/i);

    const invalidString = validateMissionInput({ duration: 'twenty', environment: 'park' });
    assert.equal(invalidString.isValid, false);
    assert.match(invalidString.error, /duration/i);

    const invalidEmptyEnv = validateMissionInput({ duration: 10, environment: '   ' });
    assert.equal(invalidEmptyEnv.isValid, false);
    assert.match(invalidEmptyEnv.error, /environment/i);
  });

  it('accepts and normalizes valid mission input', () => {
    const valid = validateMissionInput({
      duration: '15',
      environment: 'neighborhood street',
      interests: ['clouds', 'trees', ''],
      previousObservations: ['spotted dandelion', ''],
    });
    assert.equal(valid.isValid, true);
    assert.equal(valid.data.duration, 15);
    assert.equal(valid.data.environment, 'neighborhood street');
    assert.deepEqual(valid.data.interests, ['clouds', 'trees']);
    assert.deepEqual(valid.data.previousObservations, ['spotted dandelion']);
  });

  it('rejects reflection requests when notes and surprises are both empty', () => {
    const empty = validateReflectInput({ notes: '', surprises: '' });
    assert.equal(empty.isValid, false);
    assert.match(empty.error, /observation/i);

    const whitespace = validateReflectInput({ notes: '   ', surprises: '  ' });
    assert.equal(whitespace.isValid, false);
  });

  it('accepts valid reflection input with either notes or surprises', () => {
    const withNotes = validateReflectInput({
      notes: 'Saw a raven perched atop a silver birch.',
      missionTitle: 'Tree Watch',
      location: 'City Park',
    });
    assert.equal(withNotes.isValid, true);
    assert.equal(withNotes.data.notes, 'Saw a raven perched atop a silver birch.');
    assert.equal(withNotes.data.missionTitle, 'Tree Watch');

    const withSurpriseOnly = validateReflectInput({
      notes: '',
      surprises: 'A praying mantis was still on a leaf.',
    });
    assert.equal(withSurpriseOnly.isValid, true);
    assert.equal(withSurpriseOnly.data.surprises, 'A praying mantis was still on a leaf.');
  });
});
