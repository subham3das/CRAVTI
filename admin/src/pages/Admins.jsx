import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { FiPlus, FiUsers, FiShield, FiX, FiCheck, FiMail, FiSlash, FiUserCheck } from 'react-icons/fi';
import {
  fetchAdminsApi,
  createAdminApi,
  inviteAdminApi,
  updateAdminStatusApi,
  updateAdminRoleApi,
} from '../services/adminService';
import { ADMIN_ROLES, ROLE_COLORS } from '../constants';
import { formatDate, formatDateTime, safeString } from '../utils/formatters';
import { TableSkeleton } from '../components/Skeleton';
import toast from 'react-hot-toast';

export const Admins = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'invite'
  const [creating, setCreating] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      role: ADMIN_ROLES.ADMIN,
    },
  });

  const loadAdmins = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchAdminsApi();
      if (res.success && res.data) {
        setAdmins(res.data.admins || []);
      }
    } catch (err) {
      console.error('Failed to load admins:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAdmins();
  }, [loadAdmins]);

  const onSubmit = async (data) => {
    try {
      setCreating(true);
      if (modalMode === 'invite') {
        const res = await inviteAdminApi({
          name: data.name,
          email: data.email,
          role: data.role,
        });
        if (res.success) {
          toast.success(
            `Admin invited! Temporary password: ${res.data?.tempPassword || 'Generated'}`,
            { duration: 8000 }
          );
          reset();
          setModalOpen(false);
          loadAdmins();
        }
      } else {
        const res = await createAdminApi(data);
        if (res.success) {
          toast.success(`Admin "${data.name}" created successfully!`);
          reset();
          setModalOpen(false);
          loadAdmins();
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to process admin request');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleStatus = async (adm) => {
    const nextStatus = adm.status === 'active' ? 'suspended' : 'active';
    try {
      setActionLoadingId(adm._id);
      const res = await updateAdminStatusApi(adm._id, nextStatus);
      if (res.success) {
        toast.success(`Admin "${adm.name}" is now ${nextStatus.toUpperCase()}`);
        loadAdmins();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update admin status');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleChangeRole = async (adm, newRole) => {
    if (newRole === adm.role) return;
    try {
      setActionLoadingId(adm._id);
      const res = await updateAdminRoleApi(adm._id, newRole);
      if (res.success) {
        toast.success(`Role for "${adm.name}" updated to ${newRole}`);
        loadAdmins();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change admin role');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">
            Administrator Accounts
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Role-Based Access Control (RBAC) governance for internal operations team.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              setModalMode('invite');
              setModalOpen(true);
            }}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FiMail className="w-3.5 h-3.5" />
            <span>Invite Admin</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setModalMode('create');
              setModalOpen(true);
            }}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 flex items-center gap-2 transition-colors cursor-pointer"
          >
            <FiPlus className="w-4 h-4" />
            <span>Add Platform Admin</span>
          </button>
        </div>
      </div>

      {/* Admins Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-6">
            <TableSkeleton rows={4} cols={5} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200/70">
                <tr>
                  <th className="px-5 py-3.5">Admin Name</th>
                  <th className="px-5 py-3.5">Email</th>
                  <th className="px-5 py-3.5">Role Management</th>
                  <th className="px-5 py-3.5">Account Status</th>
                  <th className="px-5 py-3.5">Created Date</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {admins.map((adm) => (
                  <tr key={adm._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs overflow-hidden">
                          {adm.avatar ? (
                            <img src={adm.avatar} alt="avatar" className="w-full h-full object-cover" />
                          ) : (
                            safeString(adm.name?.charAt(0), 'A')
                          )}
                        </div>
                        <span className="font-bold text-[#0F172A]">{adm.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 font-mono text-[11px]">{adm.email}</td>
                    <td className="px-5 py-3.5">
                      <select
                        value={adm.role}
                        onChange={(e) => handleChangeRole(adm, e.target.value)}
                        disabled={actionLoadingId === adm._id}
                        className={`text-[10px] font-extrabold uppercase tracking-wide px-2 py-1 rounded border cursor-pointer focus:outline-none ${
                          ROLE_COLORS[adm.role] || 'bg-slate-50 text-slate-700'
                        }`}
                      >
                        {Object.values(ADMIN_ROLES).map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                          adm.status === 'active'
                            ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                            : 'text-rose-700 bg-rose-50 border-rose-200'
                        }`}
                      >
                        {adm.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-[11px] text-slate-400">
                      {formatDate(adm.createdAt)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        type="button"
                        disabled={actionLoadingId === adm._id}
                        onClick={() => handleToggleStatus(adm)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer border ${
                          adm.status === 'active'
                            ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                        }`}
                      >
                        {adm.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Invite Admin Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setModalOpen(false)} />
          <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 z-10 border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-[#0F172A]">
                {modalMode === 'invite' ? 'Invite Platform Administrator' : 'Create New Administrator'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  {...register('name', { required: 'Name is required' })}
                  placeholder="e.g. Priya Sharma"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:outline-none"
                />
                {errors.name && <p className="text-[11px] text-rose-500 mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  {...register('email', { required: 'Email is required' })}
                  placeholder="priya@craviti.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:outline-none"
                />
                {errors.email && <p className="text-[11px] text-rose-500 mt-1">{errors.email.message}</p>}
              </div>

              {modalMode === 'create' && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Initial Password
                  </label>
                  <input
                    type="password"
                    {...register('password', {
                      required: modalMode === 'create' ? 'Password is required' : false,
                      minLength: { value: 6, message: 'Minimum 6 characters' },
                    })}
                    placeholder="••••••••••••"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:outline-none"
                  />
                  {errors.password && <p className="text-[11px] text-rose-500 mt-1">{errors.password.message}</p>}
                </div>
              )}

              {modalMode === 'invite' && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700">
                  An administrative account will be provisioned with a secure temporary password.
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Role Assignment
                </label>
                <select
                  {...register('role')}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:outline-none cursor-pointer"
                >
                  {Object.values(ADMIN_ROLES).map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
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
                  disabled={creating}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-blue-500/20 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {creating && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  <span>{modalMode === 'invite' ? 'Send Invitation' : 'Save Account'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
