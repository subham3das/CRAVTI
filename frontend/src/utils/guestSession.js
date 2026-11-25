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

/**
 * Table Session Persistence across navigation, refreshes, and checkout
 */
export const saveTableSession = ({ restaurantId, restaurantSlug, tableId, tableNumber, tableName } = {}) => {
  try {
    const session = {
      restaurantId: restaurantId ? String(restaurantId) : '',
      restaurantSlug: restaurantSlug ? String(restaurantSlug) : '',
      tableId: tableId ? String(tableId) : '',
      tableNumber: tableNumber != null ? String(tableNumber) : '',
      tableName: tableName ? String(tableName) : '',
      savedAt: Date.now(),
    };
    sessionStorage.setItem('craviti_table_session', JSON.stringify(session));
    localStorage.setItem('craviti_last_table', JSON.stringify(session));
  } catch {
    /* ignore storage errors */
  }
};

export const getTableSession = () => {
  try {
    const raw = sessionStorage.getItem('craviti_table_session') || localStorage.getItem('craviti_last_table');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const saveActiveOrderSession = (orderOrId) => {
  try {
    if (orderOrId) {
      const id = typeof orderOrId === 'object' ? (orderOrId._id || orderOrId.id) : orderOrId;
      if (id && id !== '[object Object]') {
        sessionStorage.setItem('craviti_active_order_id', String(id));
        localStorage.setItem('craviti_last_active_order', String(id));
        if (typeof orderOrId === 'object') {
          sessionStorage.setItem('craviti_active_order_obj', JSON.stringify(orderOrId));
          localStorage.setItem('craviti_last_active_order_obj', JSON.stringify(orderOrId));
        }
      }
    } else {
      sessionStorage.removeItem('craviti_active_order_id');
      localStorage.removeItem('craviti_last_active_order');
      sessionStorage.removeItem('craviti_active_order_obj');
      localStorage.removeItem('craviti_last_active_order_obj');
    }
  } catch {}
};

export const getActiveOrderSession = () => {
  try {
    const rawObj = sessionStorage.getItem('craviti_active_order_obj') || localStorage.getItem('craviti_last_active_order_obj');
    if (rawObj) {
      try {
        const parsed = JSON.parse(rawObj);
        if (parsed?._id) return parsed;
      } catch {}
    }
    const id = sessionStorage.getItem('craviti_active_order_id') || localStorage.getItem('craviti_last_active_order');
    if (id && id !== '[object Object]') {
      return { _id: id };
    }
    return null;
  } catch {
    return null;
  }
};

export const clearTableSession = () => {
  try {
    sessionStorage.removeItem('craviti_table_session');
    localStorage.removeItem('craviti_last_table');
  } catch {
    /* ignore */
  }
};
