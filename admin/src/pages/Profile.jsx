import { useState, useEffect } from 'react';
import { FiUser, FiShield, FiMail, FiClock, FiKey, FiGlobe, FiMonitor, FiEdit2, FiCheck, FiX, FiCamera } from 'react-icons/fi';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { ROLE_COLORS } from '../constants';
import { formatDateTime, safeString } from '../utils/formatters';
import { fetchAdminLoginHistoryApi, updateAdminProfileApi } from '../services/adminService';
import { TableSkeleton } from '../components/Skeleton';
import toast from 'react-hot-toast';

export const Profile = () => {
  const { admin, updateAdmin } = useAdminAuth();
  const [loginHistory, setLoginHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Profile Edit State
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: admin?.name || '',
    email: admin?.email || '',
    password: '',
    avatar: admin?.avatar || '',
  });

  useEffect(() => {
    if (admin) {
      setFormData({
        name: admin.name || '',
        email: admin.email || '',
        password: '',
        avatar: admin.avatar || '',
      });
    }
  }, [admin]);

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

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        avatar: formData.avatar.trim(),
      };
      if (formData.password && formData.password.trim()) {
        payload.password = formData.password.trim();
      }

      const res = await updateAdminProfileApi(payload);
      if (res.success) {
        toast.success('Admin profile credentials updated successfully!');
        const updatedUser = res.data?.user || res.data?.admin || res.data;
        if (updateAdmin && updatedUser) {
          updateAdmin(updatedUser);
        }
        setModalOpen(false);
        setFormData((prev) => ({ ...prev, password: '' }));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update admin profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">
            Administrator Profile & Security
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Active administrative credentials, RBAC tier, device fingerprints, and authentication history.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <FiEdit2 className="w-3.5 h-3.5" />
          Edit Profile & Password
        </button>
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
                    <td className="px-4 py-3 font-mono text-slate-600">{item.ip || '--'}</td>
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

      {/* Profile Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setModalOpen(false)} />
          <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 z-10 border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-[#0F172A]">Edit Administrator Profile</h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Subham Das"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="admin@craviti.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  New Password <span className="text-slate-400 font-normal lowercase">(leave blank to keep unchanged)</span>
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Profile Image URL (Avatar)
                </label>
                <input
                  type="url"
                  value={formData.avatar}
                  onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-blue-500/20 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {saving && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
