import { useState, useEffect, useCallback } from 'react';
import { FiCloudOff, FiRefreshCw } from 'react-icons/fi';
import env from '../config/env.js';

export const BackendHealthWatcher = () => {
  const [isOffline, setIsOffline] = useState(false);
  const [retrying, setRetrying] = useState(false);

  const checkHealth = useCallback(async () => {
    try {
      const rawUrl = env.API_BASE_URL;
      const healthUrl = rawUrl.replace(/\/admin.*$/, '') + '/health';
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10000);

      const res = await fetch(healthUrl, {
        signal: controller.signal,
        cache: 'no-store',
      });
      clearTimeout(timer);

      if (res.ok) {
        setIsOffline(false);
      } else {
        setIsOffline(true);
      }
    } catch {
      setIsOffline(true);
    } finally {
      setRetrying(false);
    }
  }, []);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 60000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  const handleManualRetry = () => {
    setRetrying(true);
    checkHealth();
  };

  if (!isOffline) return null;

  return (
    <div className="bg-slate-900 text-white px-4 py-2.5 text-xs font-medium flex items-center justify-between shadow-lg sticky top-0 z-50 border-b border-slate-800">
      <div className="flex items-center gap-2.5 max-w-5xl mx-auto flex-1">
        <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0" />
        <FiCloudOff className="w-4 h-4 text-amber-400 shrink-0" />
        <span>
          Connecting to Craviti Production Cloud (<code className="text-amber-300 font-mono">cravti.onrender.com</code>). Services may be warming up.
        </span>
      </div>
      <button
        type="button"
        onClick={handleManualRetry}
        disabled={retrying}
        className="flex items-center gap-1.5 px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors shrink-0 disabled:opacity-50"
      >
        <FiRefreshCw className={`w-3.5 h-3.5 ${retrying ? 'animate-spin' : ''}`} />
        <span>{retrying ? 'Connecting...' : 'Retry'}</span>
      </button>
    </div>
  );
};

export default BackendHealthWatcher;

