export const getOrCreateDeviceId = () => {
  const KEY = 'craviti_device_id';
  let deviceId = localStorage.getItem(KEY);
  if (!deviceId) {
    deviceId = 'dev_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
    localStorage.setItem(KEY, deviceId);
  }
  return deviceId;
};

export const getOrCreateSessionId = () => {
  const KEY = 'craviti_session_id';
  let sessionId = sessionStorage.getItem(KEY);
  if (!sessionId) {
    sessionId = 'ses_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
    sessionStorage.setItem(KEY, sessionId);
  }
  return sessionId;
};

export const regenerateSessionId = () => {
  const KEY = 'craviti_session_id';
  const sessionId = 'ses_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
  sessionStorage.setItem(KEY, sessionId);
  return sessionId;
};

export const getOrCreateGuestId = () => {
  const KEY = 'craviti_guest_id';
  let guestId = localStorage.getItem(KEY);
  if (!guestId) {
    guestId = 'gst_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
    localStorage.setItem(KEY, guestId);
  }
  return guestId;
};

export const setGuestId = (guestId) => {
  if (guestId) {
    localStorage.setItem('craviti_guest_id', guestId);
  }
};
