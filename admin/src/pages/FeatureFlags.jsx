import { useState, useEffect } from 'react';
import { FiFlag, FiToggleLeft, FiToggleRight, FiShield } from 'react-icons/fi';
import { fetchFeatureFlagsApi, toggleFeatureFlagApi } from '../services/adminService';
import { Skeleton } from '../components/Skeleton';
import toast from 'react-hot-toast';

export const FeatureFlags = () => {
  const [flags, setFlags] = useState({});
  const [loading, setLoading] = useState(true);
  const [togglingKey, setTogglingKey] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const loadFlags = async () => {
      try {
        setLoading(true);
        const res = await fetchFeatureFlagsApi();
        if (isMounted && res.success && res.data?.flags) {
          setFlags(res.data.flags);
        }
      } catch (err) {
        console.error('Failed to load feature flags:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadFlags();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleToggle = async (key) => {
    try {
      setTogglingKey(key);
      const nextVal = !flags[key];
      const res = await toggleFeatureFlagApi(key, nextVal);
      if (res.success) {
        setFlags((prev) => ({ ...prev, [key]: nextVal }));
        toast.success(`Flag "${key}" is now ${nextVal ? 'ENABLED' : 'DISABLED'}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to toggle flag');
    } finally {
      setTogglingKey(null);
    }
  };

  const flagDefinitions = [
    {
      key: 'customerOrderingEnabled',
      title: 'Customer QR Ordering',
      desc: 'Controls whether customers can place orders after scanning table QR codes.',
    },
    {
      key: 'onlinePaymentEnabled',
      title: 'Digital Payments Gateway',
      desc: 'Enables customer online prepayments via UPI, Razorpay and cards.',
    },
    {
      key: 'orderSoundsEnabled',
      title: 'Real-time Audio Chimes',
      desc: 'Plays auditory notifications on the kitchen panel upon new order placement.',
    },
    {
      key: 'receiptEnabled',
      title: 'Thermal 80mm PDF Generation',
      desc: 'Generates immutable receipts on order completion for customers and restaurant staff.',
    },
    {
      key: 'maintenanceMode',
      title: 'Platform Maintenance Mode',
      desc: 'Locks the restaurant and customer portals with a system maintenance banner.',
      danger: true,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">
          System Feature Flags
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Live toggles for platform modules, operational restrictions, and rollout controls.
        </p>
      </div>

      {/* Flag List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : (
          flagDefinitions.map((flag) => {
            const isEnabled = Boolean(flags[flag.key]);
            const isWorking = togglingKey === flag.key;

            return (
              <div key={flag.key} className="p-5 flex items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#0F172A]">{flag.title}</span>
                    <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                      {flag.key}
                    </span>
                    {flag.danger && (
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                        Critical
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 max-w-xl">{flag.desc}</p>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggle(flag.key)}
                  disabled={isWorking}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isEnabled ? 'bg-blue-600' : 'bg-slate-200'
                  } ${isWorking ? 'opacity-50' : ''}`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      isEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

