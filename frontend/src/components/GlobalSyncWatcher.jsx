import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { FiAlertTriangle, FiX } from 'react-icons/fi';

export const GlobalSyncWatcher = () => {
  const [maintenanceMessage, setMaintenanceMessage] = useState(null);

  useEffect(() => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';
    const socket = io(backendUrl, { transports: ['websocket', 'polling'] });

    socket.on('maintenance.enabled', (data) => {
      setMaintenanceMessage(
        data?.message || 'Platform Maintenance Active: Systems are undergoing scheduled updates.'
      );
    });

    socket.on('maintenance.disabled', () => {
      setMaintenanceMessage(null);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  if (!maintenanceMessage) return null;

  return (
    <div className="bg-amber-500 text-slate-950 px-4 py-2.5 text-xs font-bold flex items-center justify-between shadow-xs sticky top-0 z-50 animate-fadeIn">
      <div className="flex items-center gap-2 max-w-6xl mx-auto flex-1">
        <FiAlertTriangle className="w-4 h-4 shrink-0 text-slate-950" />
        <span>{maintenanceMessage}</span>
      </div>
      <button
        type="button"
        onClick={() => setMaintenanceMessage(null)}
        className="p-1 hover:bg-amber-600 rounded text-slate-950"
      >
        <FiX className="w-4 h-4" />
      </button>
    </div>
  );
};

export default GlobalSyncWatcher;

