/**
 * Gentle synthesised sound effect for Pocket Mode timer completion.
 * Pure Web Audio API: 100% offline, zero network requests, zero audio file assets.
 */

export const TONE_PRESETS = {
  bowl: {
    name: 'Singing Bowl',
    notes: [528, 660, 792],
    decay: 2.5,
  },
  bell: {
    name: 'Crystal Bell',
    notes: [880, 1056, 1320],
    decay: 1.8,
  },
  gong: {
    name: 'Earth Gong',
    notes: [220, 330, 440],
    decay: 3.2,
  },
};

const AUDIO_SETTINGS_KEY = 'fieldnote_audio_settings_v1';

export function getAudioSettings() {
  try {
    const raw = localStorage.getItem(AUDIO_SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        enabled: parsed.enabled !== false,
        preset: TONE_PRESETS[parsed.preset] ? parsed.preset : 'bowl',
        volume: typeof parsed.volume === 'number' ? Math.max(0, Math.min(1, parsed.volume)) : 0.8,
      };
    }
  } catch {
    // Fallback to defaults
  }
  return { enabled: true, preset: 'bowl', volume: 0.8 };
}

export function saveAudioSettings(settings) {
  try {
    localStorage.setItem(AUDIO_SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage quota errors
  }
}

export function playGentleChime(presetKey, customVolume) {
  try {
    const settings = getAudioSettings();
    if (settings.enabled === false && customVolume === undefined) return;

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    const now = ctx.currentTime;

    const chosenPreset = TONE_PRESETS[presetKey] || TONE_PRESETS[settings.preset] || TONE_PRESETS.bowl;
    const notes = chosenPreset.notes;
    const baseVolume = (customVolume !== undefined ? customVolume : settings.volume) * 0.15;

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);

      // Gentle attack and slow exponential decay
      gain.gain.setValueAtTime(0.0001, now + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.001, baseVolume), now + idx * 0.12 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.12 + chosenPreset.decay);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + chosenPreset.decay + 0.1);
    });
  } catch (err) {
    console.warn('Audio chime skipped (audio context unavailable):', err);
  }
}
