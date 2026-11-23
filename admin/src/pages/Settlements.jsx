import React, { useState, useEffect, useCallback } from 'react';
import {
  FiDollarSign,
  FiCreditCard,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiSearch,
  FiFilter,
  FiRefreshCw,
  FiSliders,
  FiCheck,
  FiX,
  FiArrowUpRight,
  FiFileText,
  FiUser,
  FiBriefcase,
} from 'react-icons/fi';
import {
  fetchAdminSettlementsApi,
  fetchAdminRestaurantWalletsApi,
  processAdminSettlementApi,
  updateAdminRestaurantCommissionApi,
} from '../services/adminService';
import { formatCurrency, formatDate } from '../utils/formatters';
import { TableSkeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import toast from 'react-hot-toast';

export const Settlements = () => {
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'wallets', 'pending', 'completed', 'failed'
  const [settlements, setSettlements] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [summary, setSummary] = useState({
    totalPendingAmount: 0,
    totalCompletedAmount: 0,
    totalCommissionEarned: 0,
    pendingCount: 0,
    completedCount: 0,
    failedCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSettlement, setSelectedSettlement] = useState(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Manual Settlement Process Modal State
  const [utrInput, setUtrInput] = useState('');
  const [notesInput, setNotesInput] = useState('');

  // Commission Edit Modal State
  const [commissionRateInput, setCommissionRateInput] = useState(5.0);
  const [linkedAccountInput, setLinkedAccountInput] = useState('');
  const [cycleInput, setCycleInput] = useState('weekly');
  const [minimumSettlementInput, setMinimumSettlementInput] = useState(500);
  const [termsNotesInput, setTermsNotesInput] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const statusParam =
        activeTab === 'pending'
          ? 'pending'
          : activeTab === 'completed'
          ? 'completed'
          : activeTab === 'failed'
          ? 'failed'
          : 'all';

      const [settlementsRes, walletsRes] = await Promise.all([
        fetchAdminSettlementsApi({ search, status: statusParam }),
        fetchAdminRestaurantWalletsApi({ search }),
      ]);

      if (settlementsRes.success) {
        setSettlements(settlementsRes.data.settlements || []);
        if (settlementsRes.data.summary) {
          setSummary(settlementsRes.data.summary);
        }
      }

      if (walletsRes.success) {
        setWallets(walletsRes.data.restaurants || []);
      }
    } catch (err) {
      console.error('Failed to load settlements telemetry:', err);
      toast.error('Could not load settlement data');
    } finally {
      setLoading(false);
    }
  }, [activeTab, search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleProcessSettlement = async (status = 'completed') => {
    if (!selectedSettlement) return;
    try {
      setActionLoading(true);
      const res = await processAdminSettlementApi({
        settlementId: selectedSettlement._id || selectedSettlement.settlementId,
        utr: utrInput,
        notes: notesInput,
        status,
      });

      if (res.success) {
        toast.success(`Settlement marked as ${status.toUpperCase()}`);
        setSelectedSettlement(null);
        setUtrInput('');
        setNotesInput('');
        loadData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to process settlement');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveCommission = async () => {
    if (!selectedRestaurant) return;
    try {
      setActionLoading(true);
      const res = await updateAdminRestaurantCommissionApi({
        restaurantId: selectedRestaurant._id,
        commissionRate: Number(commissionRateInput),
        linkedAccountId: linkedAccountInput,
        settlementCycle: cycleInput,
        minimumSettlement: Number(minimumSettlementInput),
        notes: termsNotesInput,
      });

      if (res.success) {
        toast.success('Restaurant commission terms updated!');
        setSelectedRestaurant(null);
        loadData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update commission');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight flex items-center gap-2">
            <FiDollarSign className="text-emerald-600" />
            Merchant Settlements & Payouts Engine
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage restaurant balances, Razorpay linked accounts, commission rates, and manual payouts
          </p>
        </div>
        <button
          onClick={loadData}
          className="self-start sm:self-auto px-3.5 py-2 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition flex items-center gap-1.5 shadow-xs"
        >
          <FiRefreshCw className={loading ? 'animate-spin' : ''} /> Refresh Telemetry
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Pending Settlements
          </span>
          <p className="text-xl font-black text-amber-600 mt-1">
            {formatCurrency(summary.totalPendingAmount)}
          </p>
          <span className="text-[11px] text-slate-400 font-medium">
            {summary.pendingCount} payout(s) awaiting processing
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Completed Payouts
          </span>
          <p className="text-xl font-black text-emerald-600 mt-1">
            {formatCurrency(summary.totalCompletedAmount)}
          </p>
          <span className="text-[11px] text-slate-400 font-medium">
            {summary.completedCount} settlement(s) disbursed
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Platform Commission
          </span>
          <p className="text-xl font-black text-blue-600 mt-1">
            {formatCurrency(summary.totalCommissionEarned)}
          </p>
          <span className="text-[11px] text-slate-400 font-medium">
            Gross commission earned
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Merchant Wallets
          </span>
          <p className="text-xl font-black text-slate-900 mt-1">
            {summary.merchantWallets ?? wallets.length}
          </p>
          <span className="text-[11px] text-slate-400 font-medium">
            Active verified restaurant accounts
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2 overflow-x-auto">
        {[
          { id: 'dashboard', label: 'Settlement Dashboard' },
          { id: 'wallets', label: 'Restaurant Wallets' },
          { id: 'pending', label: `Pending Payouts (${summary.pendingCount || 0})` },
          { id: 'completed', label: 'Completed Settlements' },
          { id: 'failed', label: 'Failed Settlements' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Restaurant Wallets */}
      {activeTab === 'wallets' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Verified Restaurant Wallets</h2>
              <p className="text-xs text-slate-500">
                Live net earnings, unpaid balance, Razorpay linked account IDs, and commission terms
              </p>
            </div>
            <div className="relative">
              <FiSearch className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by restaurant, owner, ID, or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 w-72"
              />
            </div>
          </div>

          {loading ? (
            <div className="p-4">
              <TableSkeleton rows={5} cols={8} />
            </div>
          ) : wallets.length === 0 ? (
            <div className="py-12 px-4 flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3 text-2xl border border-amber-100 shadow-xs">
                🍽️
              </div>
              <h4 className="text-sm font-bold text-slate-900">
                No verified restaurants available for settlements.
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Only approved and verified restaurant accounts appear in the settlement ledger and payouts engine.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[11px] border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3">Restaurant</th>
                    <th className="px-4 py-3">Commission %</th>
                    <th className="px-4 py-3">Linked Razorpay ID</th>
                    <th className="px-4 py-3">Pending Balance</th>
                    <th className="px-4 py-3">Total Settled</th>
                    <th className="px-4 py-3">Lifetime Earnings</th>
                    <th className="px-4 py-3">Cycle</th>
                    <th className="px-4 py-3 text-right">Settings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {wallets.map((w) => (
                    <tr key={w._id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs shrink-0 overflow-hidden shadow-2xs">
                            {w.logo?.url ? (
                              <img src={w.logo.url} alt={w.restaurantName} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-sm">🍽️</span>
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block leading-tight">
                              {w.restaurantName || w.name || 'Unnamed Restaurant'}
                            </span>
                            <span className="text-xs text-slate-500 block">
                              {w.ownerName || 'Owner'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono block">
                              {w.restaurantId || `REST-${w._id?.toString().slice(-5).toUpperCase()}`}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          {w.commissionRate}%
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
                        {w.linkedAccountId && w.linkedAccountId !== '--' ? (
                          <span className="text-blue-600 font-bold">{w.linkedAccountId}</span>
                        ) : (
                          <span className="text-slate-400">Not Linked</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-bold text-amber-600">
                        {formatCurrency(w.pendingBalance)}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {formatCurrency(w.paidBalance ?? w.settledBalance)}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-600">
                        {formatCurrency(w.lifetimeEarnings)}
                      </td>
                      <td className="px-4 py-3 uppercase text-[10px] font-bold text-slate-500">
                        {w.settlementCycle}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => {
                            setSelectedRestaurant(w);
                            setCommissionRateInput(w.commissionRate ?? 5.0);
                            setLinkedAccountInput(w.linkedAccountId === '--' ? '' : (w.linkedAccountId || ''));
                            setCycleInput(w.settlementCycle || 'weekly');
                            setMinimumSettlementInput(w.minimumSettlement || 500);
                            setTermsNotesInput(w.settlementNotes || '');
                          }}
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition"
                        >
                          Edit Terms
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Settlements List (Dashboard / Pending / Completed / Failed) */}
      {activeTab !== 'wallets' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {activeTab === 'pending'
                  ? 'Pending Payouts Awaiting Action'
                  : activeTab === 'completed'
                  ? 'Completed Payout History'
                  : activeTab === 'failed'
                  ? 'Failed Settlements & Exceptions'
                  : 'All Merchant Settlement Records'}
              </h2>
              <p className="text-xs text-slate-500">
                Itemized breakdown of sales, platform cuts, gateway deductions, and net transfers
              </p>
            </div>
            <div className="relative">
              <FiSearch className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search settlement or UTR..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 w-64"
              />
            </div>
          </div>

          {loading ? (
            <TableSkeleton rows={5} cols={7} />
          ) : settlements.length === 0 ? (
            <EmptyState
              title="No settlement records found"
              description="No payouts match your current view or filter criteria."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[11px] border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3">Settlement ID</th>
                    <th className="px-4 py-3">Restaurant</th>
                    <th className="px-4 py-3">Gross Sales</th>
                    <th className="px-4 py-3">Commission</th>
                    <th className="px-4 py-3">Gateway Fee</th>
                    <th className="px-4 py-3">Net Payout</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">UTR / Ref</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {settlements.map((s) => (
                    <tr key={s._id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">
                        {s.settlementId}
                        <span className="block text-[10px] text-slate-400 font-sans font-normal">
                          {formatDate(s.createdAt)}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        {s.restaurantId?.restaurantName || 'Unknown'}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {formatCurrency(s.grossAmount)}
                      </td>
                      <td className="px-4 py-3 text-blue-600 font-semibold">
                        -{formatCurrency(s.commissionAmount)}
                        <span className="text-[10px] text-slate-400 block font-normal">
                          ({s.commissionRate}%)
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        -{formatCurrency(s.gatewayFee)}
                      </td>
                      <td className="px-4 py-3 font-black text-emerald-600 text-sm">
                        {formatCurrency(s.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                            s.status === 'completed'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : s.status === 'pending'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : s.status === 'waiting_for_route_account'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : s.status === 'processing'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                          title={s.remarks || s.status}
                        >
                          {s.status === 'waiting_for_route_account' ? 'Waiting Route Acc' : s.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-600">
                        {s.utr || '--'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {s.status === 'pending' ? (
                          <button
                            onClick={() => {
                              setSelectedSettlement(s);
                              setUtrInput('');
                              setNotesInput('');
                            }}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
                          >
                            Disburse
                          </button>
                        ) : (
                          <span className="text-slate-400 text-xs">Processed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal 1: Disburse Payout (Manual Settlement) */}
      {selectedSettlement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Process Payout #{selectedSettlement.settlementId}
              </h3>
              <button
                onClick={() => setSelectedSettlement(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <FiX size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Restaurant:</span>
                  <span className="font-bold text-slate-900">
                    {selectedSettlement.restaurantId?.restaurantName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Gross Sales:</span>
                  <span className="font-semibold text-slate-800">
                    {formatCurrency(selectedSettlement.grossAmount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Commission Deducted:</span>
                  <span className="font-semibold text-blue-600">
                    -{formatCurrency(selectedSettlement.commissionAmount)}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-1 font-bold text-sm">
                  <span>Net Amount to Disburse:</span>
                  <span className="text-emerald-600">
                    {formatCurrency(selectedSettlement.amount)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Bank Reference Number / UTR / Payout ID:
                </label>
                <input
                  type="text"
                  placeholder="e.g. UTR19283746520 or payout_rzp_123"
                  value={utrInput}
                  onChange={(e) => setUtrInput(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl bg-slate-50 focus:bg-white text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Disbursement Notes:</label>
                <input
                  type="text"
                  placeholder="e.g. Settled via ICICI Bank IMPS"
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl bg-slate-50 focus:bg-white text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                onClick={() => setSelectedSettlement(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={() => handleProcessSettlement('failed')}
                disabled={actionLoading}
                className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold"
              >
                Mark Failed
              </button>
              <button
                onClick={() => handleProcessSettlement('completed')}
                disabled={actionLoading}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
              >
                Confirm Payout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Edit Restaurant Commission & Linked Account */}
      {selectedRestaurant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Commission Terms: {selectedRestaurant.restaurantName}
              </h3>
              <button
                onClick={() => setSelectedRestaurant(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <FiX size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Platform Commission Rate (%):
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={commissionRateInput}
                  onChange={(e) => setCommissionRateInput(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl bg-slate-50 focus:bg-white text-xs"
                />
                <span className="text-[10px] text-slate-400">
                  Deducted automatically from each customer order.
                </span>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Linked Razorpay Account ID (acc_...):
                </label>
                <input
                  type="text"
                  placeholder="e.g. acc_Tw98H1x7yZ0"
                  value={linkedAccountInput}
                  onChange={(e) => setLinkedAccountInput(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl bg-slate-50 focus:bg-white text-xs font-mono"
                />
                <span className="text-[10px] text-slate-400">
                  Route payouts directly via Razorpay Route Transfers.
                </span>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Settlement Cycle:</label>
                <select
                  value={cycleInput}
                  onChange={(e) => setCycleInput(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl bg-slate-50 text-xs font-semibold"
                >
                  <option value="daily">Daily Settlement</option>
                  <option value="weekly">Weekly Settlement</option>
                  <option value="biweekly">Bi-weekly Settlement</option>
                  <option value="monthly">Monthly Settlement</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Minimum Settlement Threshold (₹):
                </label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={minimumSettlementInput}
                  onChange={(e) => setMinimumSettlementInput(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl bg-slate-50 focus:bg-white text-xs font-mono"
                />
                <span className="text-[10px] text-slate-400">
                  Minimum unpaid earnings required before a payout is dispatched.
                </span>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Settlement & Payout Notes:
                </label>
                <textarea
                  rows="2"
                  placeholder="Optional internal remarks or banking notes..."
                  value={termsNotesInput}
                  onChange={(e) => setTermsNotesInput(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl bg-slate-50 focus:bg-white text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                onClick={() => setSelectedRestaurant(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCommission}
                disabled={actionLoading}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settlements;

