/**
 * Craviti Kitchen & Notification Audio Synthesizer
 * Production Web Audio API implementation with singleton AudioContext,
 * precise volume scaling (0-100%), and zero-regression auto-play handling.
 */

const STORAGE_KEY_VOLUME = 'craviti_notification_volume';
const DEFAULT_VOLUME = 80;

let sharedAudioCtx = null;

/**
 * Get or initialize the singleton AudioContext.
 * Reusing a singleton avoids hitting the browser limit on concurrent AudioContexts.
 */
const getAudioContext = () => {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;

    if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
      sharedAudioCtx = new AudioContextClass();
    }

    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {});
    }

    return sharedAudioCtx;
  } catch (err) {
    console.warn('AudioContext initialization notice:', err.message);
    return null;
  }
};

/**
 * Retrieve current saved volume percentage (0 to 100).
 */
export const getNotificationVolume = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_VOLUME);
    if (stored !== null && !isNaN(Number(stored))) {
      return Math.max(0, Math.min(100, Number(stored)));
    }
  } catch {}
  return DEFAULT_VOLUME;
};

/**
 * Save notification volume percentage (0 to 100).
 */
export const setStoredNotificationVolume = (volume) => {
  try {
    const num = Number(volume);
    if (!isNaN(num)) {
      const clamped = Math.max(0, Math.min(100, Math.round(num)));
      localStorage.setItem(STORAGE_KEY_VOLUME, String(clamped));
    }
  } catch {}
};

/**
 * Play synthesizer order notification chime.
 * @param {number|string} [volume] Optional volume override (0 to 100 or 0.0 to 1.0).
 */
export const playOrderChime = (volume) => {
  try {
    let vol = volume;
    if (vol === undefined || vol === null) {
      vol = getNotificationVolume();
    }

    const numVol = Number(vol);
    if (isNaN(numVol) || numVol <= 0) {
      return; // Muted / 0% volume
    }

    // Percentage-based scaling (0 to 100%)
    // Handle 1-100 from range slider, or float 0.0-1.0
    let ratio = numVol;
    if (ratio > 1) {
      ratio = ratio / 100;
    } else if (ratio === 1) {
      // 1 from a 0-100% slider is 1% (0.01)
      ratio = 0.01;
    }

    // Perceptual logarithmic scaling for human hearing
    const normalizedVolume = Math.max(0.0005, Math.min(1, Math.pow(ratio, 1.4)));

    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // Master Gain Node for linear volume scaling
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(normalizedVolume, now);
    masterGain.connect(ctx.destination);

    // Tone 1: C5 (523.25 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, now);
    gain1.gain.setValueAtTime(0.35, now);
    gain1.gain.linearRampToValueAtTime(0.0001, now + 0.35);

    osc1.connect(gain1);
    gain1.connect(masterGain);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Tone 2: G5 (783.99 Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(783.99, now + 0.12);
    gain2.gain.setValueAtTime(0.45, now + 0.12);
    gain2.gain.linearRampToValueAtTime(0.0001, now + 0.55);

    osc2.connect(gain2);
    gain2.connect(masterGain);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.55);

    // Disconnect oscillators and gain nodes after playing to free resources
    setTimeout(() => {
      try {
        osc1.disconnect();
        gain1.disconnect();
        osc2.disconnect();
        gain2.disconnect();
        masterGain.disconnect();
      } catch {}
    }, 700);
  } catch (err) {
    console.warn('Audio chime playback notice:', err.message);
  }
};
