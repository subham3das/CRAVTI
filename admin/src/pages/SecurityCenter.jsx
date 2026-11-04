import { useState, useEffect } from 'react';
import {
  FiShield,
  FiLock,
  FiUserCheck,
  FiUserX,
  FiAlertTriangle,
  FiActivity,
  FiMonitor,
  FiGlobe,
} from 'react-icons/fi';
import { fetchSecurityOverviewApi } from '../services/adminService';
import { formatDateTime, formatDate } from '../utils/formatters';
import { TableSkeleton } from '../components/Skeleton';
import toast from 'react-hot-toast';

export const SecurityCenter = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSecurity = async () => {
      try {
        setLoading(true);
        const res = await fetchSecurityOverviewApi();
        if (res.success && res.data) {
          setData(res.data);
        }
      } catch (err) {
        console.error('Failed to load security overview:', err);
        toast.error('Could not load security telemetry');
      } finally {
        setLoading(false);
      }
    };

    loadSecurity();
  }, []);

  const d = data || {};

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">
          Platform Security Center & Access Governance
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Active administrative tokens, brute-force defenses, device footprints, and threat monitoring
        </p>
      </div>

      {/* Security Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Active Admins
          </span>
          <span className="text-2xl font-black text-emerald-600 block">
            {d.activeAdmins || 1}
          </span>
          <span className="text-[11px] text-slate-400 block mt-1">Authorized staff</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Suspended Accounts
          </span>
          <span className="text-2xl font-black text-rose-600 block">
            {d.lockedAdmins || 0}
          </span>
          <span className="text-[11px] text-slate-400 block mt-1">Revoked access tiers</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Recent Failed Logins
          </span>
          <span className="text-2xl font-black text-amber-600 block">
            {d.failedLogins || 0}
          </span>
          <span className="text-[11px] text-slate-400 block mt-1">Brute-force guarded</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Unique IP Footprints
          </span>
          <span className="text-2xl font-black text-blue-600 block">
            {d.uniqueIpsCount || 1}
          </span>
          <span className="text-[11px] text-slate-400 block mt-1">Distinct client origins</span>
        </div>
      </div>

      {/* Security Policies Overview */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
        <h2 className="text-sm font-bold text-[#0F172A] uppercase tracking-wider">
          Enforced Defense Policies
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
            <span className="font-extrabold text-slate-900 block">JWT Token Boundary</span>
            <p className="text-slate-600">Admin tokens carry <code>type: 'admin'</code> and are rejected with 401 on restaurant endpoints.</p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
            <span className="font-extrabold text-slate-900 block">Rate Limiting & Lockout</span>
            <p className="text-slate-600">Rate-limiting on auth endpoints with a 15-minute lockout after 5 consecutive failures.</p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
            <span className="font-extrabold text-slate-900 block">Granular RBAC Guards</span>
            <p className="text-slate-600">Strict permission checks (e.g. <code>restaurant.verify</code>) enforced on every API route.</p>
          </div>
        </div>
      </div>

      {/* Login Sessions Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
        <h2 className="text-sm font-bold text-[#0F172A] uppercase tracking-wider border-b border-slate-100 pb-3">
          Authenticated Admin Sessions & Device Telemetry
        </h2>

        {loading ? (
          <TableSkeleton rows={4} cols={5} />
        ) : !Array.isArray(d.loginHistory) || d.loginHistory.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No recent sessions recorded.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[11px] border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Admin Email</th>
                  <th className="px-4 py-3">IP Address</th>
                  <th className="px-4 py-3">Device / Platform</th>
                  <th className="px-4 py-3">Browser</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {d.loginHistory.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-700">
                      {formatDateTime(item.createdAt || item.loginTime)}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-800">{item.adminEmail}</td>
                    <td className="px-4 py-3 font-mono text-slate-600">{item.ip || '127.0.0.1'}</td>
                    <td className="px-4 py-3 text-slate-700">{item.os || 'Windows'} ({item.device || 'Desktop'})</td>
                    <td className="px-4 py-3 text-slate-700">{item.browser || 'Chrome'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                          item.success ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
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

