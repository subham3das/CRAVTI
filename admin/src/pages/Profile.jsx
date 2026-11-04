import { useState, useEffect } from 'react';
import { FiUser, FiShield, FiMail, FiClock, FiKey, FiGlobe, FiMonitor } from 'react-icons/fi';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { ROLE_COLORS } from '../constants';
import { formatDateTime, safeString } from '../utils/formatters';
import { fetchAdminLoginHistoryApi } from '../services/adminService';
import { TableSkeleton } from '../components/Skeleton';
import toast from 'react-hot-toast';

export const Profile = () => {
  const { admin } = useAdminAuth();
  const [loginHistory, setLoginHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        setLoadingHistory(true);
        const res = await fetchAdminLoginHistoryApi({ limit: 10 });
        if (res.success && res.data) {
          setLoginHistory(res.data.history || []);
        }
      } catch (err) {
        console.error('Failed to load login history:', err);
      } finally {
        setLoadingHistory(false);
      }
    };

    loadHistory();
  }, []);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">
          Administrator Profile & Security
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Active administrative credentials, RBAC tier, device fingerprints, and authentication history.
        </p>
      </div>

      {/* Main Credentials Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white font-extrabold flex items-center justify-center text-xl shadow-lg shadow-blue-500/20 overflow-hidden">
            {admin?.avatar ? (
              <img src={admin.avatar} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              safeString(admin?.name?.charAt(0), 'A')
            )}
          </div>
          <div>
            <h3 className="text-lg font-black text-[#0F172A] leading-tight">{admin?.name}</h3>
            <p className="text-xs text-slate-500 font-mono mt-0.5">{admin?.email}</p>
            <span
              className={`inline-block text-[10px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded border mt-2 ${
                ROLE_COLORS[admin?.role] || 'bg-slate-50 text-slate-700'
              }`}
            >
              {admin?.role}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Account Status
            </span>
            <span className="font-extrabold text-emerald-600 capitalize text-sm">
              {admin?.status || 'Active'}
            </span>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Last Login Recorded
            </span>
            <span className="font-mono text-slate-800 text-sm">
              {formatDateTime(admin?.lastLogin)}
            </span>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Token Security
            </span>
            <span className="font-semibold text-slate-800">
              JWT Isolated (Admin Scope Only)
            </span>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Brute Force Protection
            </span>
            <span className="font-semibold text-slate-800">
              Active (Max 5 Attempts with 15m Lock)
            </span>
          </div>
        </div>
      </div>

      {/* Module 6: Login History Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-[#0F172A] uppercase tracking-wider">
              Recent Login & Device Activity
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Parsed user-agent, IP address, OS, and authentication state
            </p>
          </div>
        </div>

        {loadingHistory ? (
          <TableSkeleton rows={4} cols={5} />
        ) : loginHistory.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-4">No login history recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[11px] border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Administrator</th>
                  <th className="px-4 py-3">IP Address</th>
                  <th className="px-4 py-3">Device / OS</th>
                  <th className="px-4 py-3">Browser</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {loginHistory.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-700">
                      {formatDateTime(item.createdAt || item.loginTime)}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{item.adminEmail}</td>
                    <td className="px-4 py-3 font-mono text-slate-600">{item.ip || '127.0.0.1'}</td>
                    <td className="px-4 py-3 text-slate-700">
                      {item.os || 'Windows'} ({item.device || 'Desktop'})
                    </td>
                    <td className="px-4 py-3 text-slate-700">{item.browser || 'Chrome'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                          item.success
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {item.success ? 'Success' : 'Failed'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
