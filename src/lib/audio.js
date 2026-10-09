/**
 * Gentle synthesised sound effect for Pocket Mode timer completion.
 * Pure Web Audio API: 100% offline, zero network requests, zero audio file assets.
 */

export function playGentleChime() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    const now = ctx.currentTime;

    // Harmonic frequencies resembling a soft Tibetan singing bowl / wind chime
    const notes = [528, 660, 792]; // C5 harmonic aura

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);

      // Gentle attack and slow exponential decay
      gain.gain.setValueAtTime(0.0001, now + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.12, now + idx * 0.12 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.12 + 2.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 2.6);
    });
  } catch (err) {
    console.warn('Audio chime skipped (audio context unavailable):', err);
  }
}
