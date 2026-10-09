/**
 * Schema formatters and output sanitizers for FieldNote.
 * Shared across Express backend and Cloudflare Pages Functions.
 */

export function formatMissionOutput(mission, { duration, environment, interests }) {
  if (!mission || typeof mission !== 'object') {
    throw new Error('Local AI returned an unexpected response format.');
  }

  return {
    title: String(mission.title || 'Outdoor Nature Observation Mission').trim(),
    description: String(mission.description || 'Step outside, slow down, and notice the details around you.').trim(),
    steps: Array.isArray(mission.steps) && mission.steps.length > 0
      ? mission.steps.map((s) => String(s).trim())
      : [
          'Find a quiet spot where you can see vegetation or open sky.',
          'Put your phone in your pocket and take three deep breaths.',
          'Notice three different textures or patterns in nature.',
          'Listen for one distinct sound before returning.',
        ],
    reflectionQuestion: String(
      mission.reflectionQuestion || 'What is one detail you would have walked right past on an ordinary day?'
    ).trim(),
    safetyReminder: String(
      mission.safetyReminder || 'Stay aware of your surroundings. Do not touch or consume unknown plants or fungi.'
    ).trim(),
    duration: Number(duration) || 10,
    environment: String(environment || 'outdoor space').trim(),
    interests: Array.isArray(interests) ? interests : ['general nature'],
    createdAt: new Date().toISOString(),
  };
}

export function formatReflectionOutput(reflection, { missionTitle, notes, surprises, sensoryDetails, location, duration, environment }) {
  if (!reflection || typeof reflection !== 'object') {
    throw new Error('Local AI returned an invalid reflection format.');
  }

  const cleanNotes = String(notes || '').trim();
  const cleanSurprises = String(surprises || '').trim();

  return {
    title: String(reflection.title || missionTitle || 'Field Observation').trim(),
    originalSummary: String(reflection.originalSummary || cleanNotes || cleanSurprises).trim(),
    readableNotes: String(reflection.readableNotes || cleanNotes || cleanSurprises).trim(),
    tags: Array.isArray(reflection.tags) && reflection.tags.length > 0
      ? reflection.tags.map((t) => String(t).toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-')).filter(Boolean)
      : ['nature', 'fieldnote'],
    reflectionPrompt: String(
      reflection.reflectionPrompt || 'What might change in this same spot if you return at a different hour?'
    ).trim(),
    rawInput: {
      notes: cleanNotes,
      surprises: cleanSurprises,
      sensoryDetails: String(sensoryDetails || '').trim(),
      location: String(location || '').trim(),
    },
    location: String(location || '').trim(),
    missionTitle: String(missionTitle || '').trim(),
    duration: Number(duration) || 10,
    environment: String(environment || 'outdoor space').trim(),
    createdAt: new Date().toISOString(),
  };
}
