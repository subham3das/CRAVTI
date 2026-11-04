import { useState, useEffect, useCallback } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  FiSearch,
  FiFilter,
  FiCheckCircle,
  FiSlash,
  FiExternalLink,
  FiMoreVertical,
  FiPhone,
  FiMapPin,
  FiClock,
} from 'react-icons/fi';
import { fetchRestaurantsApi, toggleRestaurantStatusApi } from '../services/adminService';
import { formatDate, safeString } from '../utils/formatters';
import { Skeleton, TableSkeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import { ConfirmModal } from '../components/ConfirmModal';
import toast from 'react-hot-toast';

export const Restaurants = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [verificationFilter, setVerificationFilter] = useState('all');
  const [page, setPage] = useState(1);

  // Modal State
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  const loadRestaurants = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchRestaurantsApi({
        search,
        status: statusFilter,
        verification: verificationFilter,
        page,
        limit: 12,
      });
      if (res.success && res.data) {
        setRestaurants(res.data.restaurants || []);
        setPagination(res.data.pagination || { page: 1, pages: 1, total: 0 });
      }
    } catch (err) {
      console.error('Failed to load restaurants:', err);
      toast.error('Failed to load restaurants');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, verificationFilter, page]);

  useEffect(() => {
    loadRestaurants();
  }, [loadRestaurants]);

  const handleToggleStatus = async () => {
    if (!selectedRestaurant) return;
    try {
      setIsTogglingStatus(true);
      const newStatus = !selectedRestaurant.isDeleted;
      const res = await toggleRestaurantStatusApi(selectedRestaurant._id, newStatus, 'Status changed by admin');
      if (res.success) {
        toast.success(`Restaurant ${newStatus ? 'disabled' : 'enabled'} successfully`);
        setSelectedRestaurant(null);
        loadRestaurants();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update restaurant status');
    } finally {
      setIsTogglingStatus(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">
            Restaurant Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Total of {pagination.total} registered restaurant tenant accounts across the platform.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by restaurant name, owner, phone..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-medium"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-600 cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="disabled">Disabled Only</option>
          </select>

          {/* Verification Filter */}
          <select
            value={verificationFilter}
            onChange={(e) => {
              setVerificationFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-600 cursor-pointer"
          >
            <option value="all">All Verifications</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Restaurants Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-6">
            <TableSkeleton rows={6} cols={5} />
          </div>
        ) : restaurants.length === 0 ? (
          <EmptyState
            title="No restaurants found"
            description="No restaurant accounts matched your filter criteria."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200/70">
                <tr>
                  <th className="px-5 py-3.5">Restaurant</th>
                  <th className="px-5 py-3.5">Owner & Contact</th>
                  <th className="px-5 py-3.5">City & State</th>
                  <th className="px-5 py-3.5">Verification</th>
                  <th className="px-5 py-3.5">Account Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {restaurants.map((r) => {
                  const isDisabled = Boolean(r.isDeleted);
                  return (
                    <tr key={r._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3.5">
                        <Link to={`/restaurants/${r._id}`} className="flex items-center gap-3 group">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs shrink-0 overflow-hidden group-hover:border-blue-500 transition-colors">
                            {r.logo?.url ? (
                              <img src={r.logo.url} alt="logo" className="w-full h-full object-cover" />
                            ) : (
                              safeString(r.restaurantName?.charAt(0), 'R')
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-[#0F172A] block leading-tight group-hover:text-blue-600 transition-colors">
                              {r.restaurantName}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono block">
                              slug: {r.slug || 'N/A'}
                            </span>
                          </div>
                        </Link>
                      </td>

                      <td className="px-5 py-3.5">
                        <span className="font-semibold text-slate-800 block">{r.ownerName}</span>
                        <span className="text-[11px] text-slate-400 block">{r.ownerPhone}</span>
                      </td>

                      <td className="px-5 py-3.5 text-slate-600">
                        <span>{r.address?.city || '--'}</span>
                        <span className="text-[11px] text-slate-400 block">{r.address?.state || ''}</span>
                      </td>

                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-block text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                            r.verificationStatus === 'verified'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : r.verificationStatus === 'rejected'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {r.verificationStatus || 'pending'}
                        </span>
                      </td>

                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-block text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded border ${
                            isDisabled
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {isDisabled ? 'Disabled' : 'Active'}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/restaurants/${r._id}`}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold transition-all bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"
                          >
                            Manage
                          </Link>
                          <button
                            type="button"
                            onClick={() => setSelectedRestaurant(r)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border ${
                              isDisabled
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                            }`}
                          >
                            {isDisabled ? 'Enable' : 'Suspend'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {pagination.pages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing page {pagination.page} of {pagination.pages}
            </span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 font-bold"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                disabled={page >= pagination.pages}
                className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 font-bold"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(selectedRestaurant)}
        onClose={() => setSelectedRestaurant(null)}
        onConfirm={handleToggleStatus}
        isLoading={isTogglingStatus}
        isDanger={!selectedRestaurant?.isDeleted}
        title={selectedRestaurant?.isDeleted ? 'Enable Restaurant?' : 'Suspend Restaurant?'}
        message={
          selectedRestaurant?.isDeleted
            ? `Are you sure you want to re-enable "${selectedRestaurant?.restaurantName}"? Customers will be able to view their menu.`
            : `Are you sure you want to suspend "${selectedRestaurant?.restaurantName}"? Their customer menu and ordering access will be disabled.`
        }
        confirmText={selectedRestaurant?.isDeleted ? 'Enable Restaurant' : 'Suspend Restaurant'}
      />
    </div>
  );
};

