import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { FiPlus, FiUsers, FiShield, FiX, FiCheck } from 'react-icons/fi';
import { fetchAdminsApi, createAdminApi } from '../services/adminService';
import { ADMIN_ROLES, ROLE_COLORS } from '../constants';
import { formatDate, formatDateTime, safeString } from '../utils/formatters';
import { TableSkeleton } from '../components/Skeleton';
import toast from 'react-hot-toast';

export const Admins = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);

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
      const res = await createAdminApi(data);
      if (res.success) {
        toast.success(`Admin "${data.name}" created successfully!`);
        reset();
        setModalOpen(false);
        loadAdmins();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create admin');
    } finally {
      setCreating(false);
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

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <FiPlus className="w-4 h-4" />
          <span>Add Platform Admin</span>
        </button>
      </div>

      {/* Admins Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-6">
            <TableSkeleton rows={4} cols={4} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200/70">
                <tr>
                  <th className="px-5 py-3.5">Admin Name</th>
                  <th className="px-5 py-3.5">Email</th>
                  <th className="px-5 py-3.5">Role</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Created Date</th>
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
                      <span
                        className={`inline-block text-[10px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded border ${
                          ROLE_COLORS[adm.role] || 'bg-slate-50 text-slate-700'
                        }`}
                      >
                        {adm.role}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {adm.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono text-[11px] text-slate-400">
                      {formatDate(adm.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Admin Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setModalOpen(false)} />
          <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 z-10 border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-[#0F172A]">Create New Administrator</h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
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

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Initial Password
                </label>
                <input
                  type="password"
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 6, message: 'Minimum 6 characters' },
                  })}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:outline-none"
                />
                {errors.password && <p className="text-[11px] text-rose-500 mt-1">{errors.password.message}</p>}
              </div>

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
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-blue-500/20 flex items-center justify-center gap-1.5"
                >
                  {creating && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  <span>Save Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

