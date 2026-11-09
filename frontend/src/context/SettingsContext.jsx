import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import { fetchSettingsApi, updateSettingsApi } from '../services/settingsService';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';
import env from '../config/env.js';

const SettingsContext = createContext(null);

export const SettingsProvider = ({ children }) => {
  const { restaurant } = useAuth();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load settings once when restaurant is authenticated
  const reloadSettings = useCallback(async () => {
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
    if (currentPath.startsWith('/order/')) return;
    if (!restaurant?._id) return;
    try {
      setLoading(true);
      const res = await fetchSettingsApi();
      if (res.success && res.settings) {
        setSettings(res.settings);
      }
    } catch (err) {
      console.warn('Failed to load restaurant settings:', err.message);
    } finally {
      setLoading(false);
    }
  }, [restaurant?._id]);

  useEffect(() => {
    reloadSettings();
  }, [reloadSettings]);

  // Real-time synchronization via Socket.IO
  useEffect(() => {
    if (!restaurant?._id) return;

    const backendUrl = env.SOCKET_URL;

    const socket = io(backendUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socket.emit('join-restaurant', restaurant._id);

    socket.on('settings-updated', (updated) => {
      if (updated) {
        setSettings((prev) => (prev ? { ...prev, ...updated } : updated));
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [restaurant?._id]);

  const updateSettings = async (data) => {
    try {
      setLoading(true);
      const res = await updateSettingsApi(data);
      if (res.success && res.settings) {
        setSettings(res.settings);
        toast.success(res.message || 'Settings saved successfully');
        return res.settings;
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save settings';
      toast.error(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        loading,
        reloadSettings,
        updateSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

