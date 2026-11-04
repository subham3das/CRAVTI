import { useState, useEffect, useCallback } from 'react';
import { FiCheckCircle, FiXCircle, FiClock, FiFileText, FiShield } from 'react-icons/fi';
import { fetchRestaurantsApi, verifyRestaurantApi } from '../services/adminService';
import { formatDate, safeString } from '../utils/formatters';
import { TableSkeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import toast from 'react-hot-toast';

export const RestaurantVerification = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedForReject, setSelectedForReject] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processingId, setProcessingId] = useState(null);

  const loadPendingRestaurants = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchRestaurantsApi({ verification: 'pending', limit: 20 });
      if (res.success && res.data) {
        setRestaurants(res.data.restaurants || []);
      }
    } catch (err) {
      console.error('Failed to load pending restaurants:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPendingRestaurants();
  }, [loadPendingRestaurants]);

  const handleApprove = async (id, name) => {
    try {
      setProcessingId(id);
      const res = await verifyRestaurantApi(id, 'verified', 'Approved by administrator');
      if (res.success) {
        toast.success(`"${name}" verified and approved!`);
        loadPendingRestaurants();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification update failed');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectSubmit = async () => {
    if (!selectedForReject) return;
    try {
      setProcessingId(selectedForReject._id);
      const res = await verifyRestaurantApi(selectedForReject._id, 'rejected', rejectReason || 'Incomplete verification documents');
      if (res.success) {
        toast.success(`"${selectedForReject.restaurantName}" rejected.`);
        setSelectedForReject(null);
        setRejectReason('');
        loadPendingRestaurants();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject verification');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">
          Restaurant Verification Queue
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Review legal identity, FSSAI, GSTIN, and ownership information before public listing.
        </p>
      </div>

      {/* Verification Cards */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-6">
            <TableSkeleton rows={4} cols={4} />
          </div>
        ) : restaurants.length === 0 ? (
          <EmptyState
            icon={FiCheckCircle}
            title="Verification queue is all clear"
            description="There are currently no restaurants waiting for identity verification."
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {restaurants.map((r) => {
              const isWorking = processingId === r._id;
              return (
                <div key={r._id} className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-sm border border-blue-100">
                        {safeString(r.restaurantName?.charAt(0), 'R')}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-sm text-[#0F172A] leading-tight">
                          {r.restaurantName}
                        </h3>
                        <p className="text-xs text-slate-500">
                          Owner: <strong>{r.ownerName}</strong> • Phone: {r.ownerPhone}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
                      <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">GSTIN</span>
                        <span className="font-mono text-slate-800">{r.taxInfo?.gstNumber || 'Not Provided'}</span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">FSSAI Number</span>
                        <span className="font-mono text-slate-800">{r.taxInfo?.fssAI || r.taxInfo?.fssaiNumber || 'Not Provided'}</span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Location</span>
                        <span className="text-slate-800 truncate">{r.address?.city || '--'}, {r.address?.state || ''}</span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Bank Details</span>
                        <span className="text-slate-800">{r.bankDetails?.bankName ? `${r.bankDetails.bankName}` : 'Pending'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
                    <button
                      type="button"
                      onClick={() => setSelectedForReject(r)}
                      disabled={isWorking}
                      className="px-3.5 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors disabled:opacity-50"
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApprove(r._id, r.restaurantName)}
                      disabled={isWorking}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm shadow-blue-500/20 flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {isWorking && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                      <span>Approve & Verify</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {selectedForReject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setSelectedForReject(null)} />
          <div className="relative bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 z-10 border border-slate-100">
            <h3 className="text-base font-bold text-[#0F172A]">Reject Verification</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              State the reason for rejecting "{selectedForReject.restaurantName}". This note is saved in the audit logs.
            </p>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Invalid FSSAI license image or mismatched bank account holder name..."
              className="w-full p-3 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600 focus:outline-none mb-4"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedForReject(null)}
                className="flex-1 py-2 px-3 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectSubmit}
                className="flex-1 py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

