/**
/**
 * Craviti Kitchen & Notification Audio Synthesizer
 * Production Web Audio API implementation with singleton AudioContext,
 * precise volume scaling (0-100%), auto-unlock on user interaction,
 * multi-order sequential playback queue, and background-tab support.
 */

const STORAGE_KEY_VOLUME = 'craviti_notification_volume';
const DEFAULT_VOLUME = 80;

// Singleton AudioContext instance across the entire application
let sharedAudioCtx = null;
let isAudioUnlocked = false;
let unlockListenersAttached = false;

// Multi-order playback queue state
const playbackQueue = [];
let isQueueProcessing = false;

/**
 * Get or initialize the singleton AudioContext.
 * Reusing a singleton avoids hitting the browser limit on concurrent AudioContexts.
 */
export const getAudioContext = () => {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;

    if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
      sharedAudioCtx = new AudioContextClass();
    }

    return sharedAudioCtx;
  } catch (err) {
    if (import.meta.env?.DEV) {
      console.warn('[Audio] AudioContext initialization notice:', err.message);
    }
    return null;
  }
};

/**
 * Proactively unlock the AudioContext on the first user interaction anywhere in the document.
 * Modern browsers (Chrome, Edge, Safari, Firefox) restrict AudioContext until a user gesture occurs.
 * Once unlocked, AudioContext stays active for all subsequent asynchronous WebSocket events.
 */
export const initAudioUnlock = () => {
  if (typeof window === 'undefined' || isAudioUnlocked || unlockListenersAttached) return;

  unlockListenersAttached = true;

  const handleInteraction = () => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      if (ctx.state === 'suspended') {
        ctx
          .resume()
          .then(() => {
            isAudioUnlocked = true;
            removeListeners();
            if (import.meta.env?.DEV) {
              console.log('[Audio] AudioContext successfully unlocked for session.');
            }
          })
          .catch(() => {});
      } else if (ctx.state === 'running') {
        isAudioUnlocked = true;
        removeListeners();
      }
    } catch {
      // Ignored non-fatal
    }
  };

  const removeListeners = () => {
    ['pointerdown', 'click', 'keydown', 'touchstart'].forEach((event) => {
      window.removeEventListener(event, handleInteraction, true);
    });
    unlockListenersAttached = false;
  };

  ['pointerdown', 'click', 'keydown', 'touchstart'].forEach((event) => {
    window.addEventListener(event, handleInteraction, { capture: true, passive: true });
  });
};

// Automatically arm interaction unlock when module is loaded
if (typeof window !== 'undefined') {
  initAudioUnlock();
}

/**
 * Manually request to unlock audio (e.g. on navigation or button clicks)
 */
export const unlockAudio = async () => {
  try {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      await ctx.resume();
      isAudioUnlocked = true;
    }
  } catch {}
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
 * Internal single-chime synthesizer node graph.
 * Produces a clear, pleasant two-tone kitchen chime (C5 523.25Hz -> G5 783.99Hz).
 * Duration: ~550ms.
 */
const synthesizeChime = (volume) => {
  return new Promise((resolve) => {
    try {
      let vol = volume;
      if (vol === undefined || vol === null) {
        vol = getNotificationVolume();
      }

      const numVol = Number(vol);
      if (isNaN(numVol) || numVol <= 0) {
        return resolve(); // Muted / 0% volume
      }

      // Percentage-based scaling (0 to 100%)
      let ratio = numVol;
      if (ratio > 1) {
        ratio = ratio / 100;
      } else if (ratio === 1) {
        ratio = 0.01;
      }

      // Perceptual logarithmic scaling for human ear
      const normalizedVolume = Math.max(0.0005, Math.min(1, Math.pow(ratio, 1.4)));

      const ctx = getAudioContext();
      if (!ctx) return resolve();

      const proceedWithNodes = () => {
        try {
          const now = ctx.currentTime;

          // Master Gain Node
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

          // Clean up AudioNodes after sound finishes
          setTimeout(() => {
            try {
              osc1.disconnect();
              gain1.disconnect();
              osc2.disconnect();
              gain2.disconnect();
              masterGain.disconnect();
            } catch {}
            resolve();
          }, 600);
        } catch (innerErr) {
          if (import.meta.env?.DEV) console.warn('[Audio] Synth error:', innerErr.message);
          resolve();
        }
      };

      if (ctx.state === 'suspended') {
        ctx
          .resume()
          .then(proceedWithNodes)
          .catch((resErr) => {
            if (import.meta.env?.DEV) {
              console.warn('[Audio] Context resume rejected:', resErr.message);
            }
            resolve();
          });
      } else {
        proceedWithNodes();
      }
    } catch (err) {
      if (import.meta.env?.DEV) console.warn('[Audio] Playback exception:', err.message);
      resolve();
    }
  });
};

/**
 * Sequential queue processor.
 * Guarantees that multiple simultaneous or rapid incoming orders
 * play their notification chimes sequentially with a clean gap,
 * rather than overlapping or getting dropped.
 */
const processQueue = async () => {
  if (isQueueProcessing) return;
  isQueueProcessing = true;

  while (playbackQueue.length > 0) {
    const nextVolume = playbackQueue.shift();
    await synthesizeChime(nextVolume);
    // 150ms gap between consecutive chimes for distinct separation
    if (playbackQueue.length > 0) {
      await new Promise((r) => setTimeout(r, 150));
    }
  }

  isQueueProcessing = false;
};

/**
 * CANONICAL ORDER NOTIFICATION SOUND SERVICE
 * Both "Test Sound" and "Real Orders" MUST invoke this exact function.
 *
 * @param {number|string} [volume] Optional volume override (0-100). Defaults to stored user preference.
 */
export const playNewOrderSound = (volume) => {
  // Push into queue and process cleanly
  playbackQueue.push(volume);
  processQueue().catch(() => {});
};

// Aliases for 100% backward compatibility across all modules
export const playOrderChime = playNewOrderSound;

/**
 * Request desktop notification permission for background tab alerting.
 */
export const requestDesktopNotificationPermission = async () => {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission !== 'denied') {
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch {
      return false;
    }
  }
  return false;
};

/**
 * Show a desktop notification when tab is inactive or in the background.
 */
export const showBackgroundDesktopNotification = ({ title, body, icon = '/favicon.ico' }) => {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission === 'granted' && document.hidden) {
    try {
      new Notification(title, {
        body,
        icon,
        tag: 'craviti-new-order',
        renotify: true,
      });
    } catch (err) {
      if (import.meta.env?.DEV) {
        console.warn('[Desktop Notification] Failed to show:', err.message);
      }
    }
  }
};

export default {
  playNewOrderSound,
  playOrderChime,
  getNotificationVolume,
  setStoredNotificationVolume,
  initAudioUnlock,
  unlockAudio,
  requestDesktopNotificationPermission,
  showBackgroundDesktopNotification,
};
