/**
 * Runtime-independent input validation helpers for FieldNote API endpoints.
 * Compatible with both Node.js (Express) and Cloudflare Workers (Pages Functions).
 */

export function validateMissionInput(body = {}) {
  const {
    duration = 10,
    interests = ['plants', 'trees'],
    environment = 'park',
    experience = 'curious observer',
    previousObservations = [],
  } = body || {};

  const numericDuration = Number(duration);
  if (isNaN(numericDuration) || numericDuration <= 0 || numericDuration > 120) {
    return {
      isValid: false,
      error: 'Invalid duration. Please choose between 1 and 120 minutes.',
    };
  }

  if (!environment || typeof environment !== 'string' || environment.trim().length === 0) {
    return {
      isValid: false,
      error: 'Environment is required (e.g., park, garden, balcony, street).',
    };
  }

  const safeInterests = Array.isArray(interests)
    ? interests.map((i) => String(i).trim()).filter((i) => i.length > 0)
    : ['general nature'];

  const safePreviousObservations = Array.isArray(previousObservations)
    ? previousObservations.map((p) => String(p).trim()).filter((p) => p.length > 0).slice(0, 5)
    : [];

  return {
    isValid: true,
    data: {
      duration: numericDuration,
      interests: safeInterests.length > 0 ? safeInterests : ['general nature'],
      environment: String(environment).trim(),
      experience: String(experience || 'curious observer').trim(),
      previousObservations: safePreviousObservations,
    },
  };
}

export function validateReflectInput(body = {}) {
  const {
    missionTitle = 'Outdoor Observation',
    notes = '',
    surprises = '',
    location = '',
    sensoryDetails = '',
    duration = 10,
    environment = 'outdoor space',
  } = body || {};

  const cleanNotes = String(notes || '').trim();
  const cleanSurprises = String(surprises || '').trim();

  if (!cleanNotes && !cleanSurprises) {
    return {
      isValid: false,
      error: 'Please enter at least one observation or surprising detail.',
    };
  }

  return {
    isValid: true,
    data: {
      missionTitle: String(missionTitle || 'Outdoor Observation').trim(),
      notes: cleanNotes,
      surprises: cleanSurprises,
      location: String(location || '').trim(),
      sensoryDetails: String(sensoryDetails || '').trim(),
      duration: Number(duration) || 10,
      environment: String(environment || 'outdoor space').trim(),
    },
  };
}
