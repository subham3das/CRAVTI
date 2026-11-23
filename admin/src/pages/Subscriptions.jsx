import { useState, useEffect } from 'react';
import {
  FiCheck,
  FiCreditCard,
  FiBox,
  FiFilter,
  FiSearch,
  FiRefreshCw,
  FiAlertCircle,
  FiShield,
  FiCalendar,
  FiClock,
  FiLock,
  FiXCircle,
  FiPlay,
} from 'react-icons/fi';
import { fetchSubscriptionsApi, updateRestaurantSubscriptionApi } from '../services/adminService';
import { formatCurrency, formatDate } from '../utils/formatters';
import { TableSkeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import toast from 'react-hot-toast';

const CRAVITI_PRO_FEATURES = [
  'Unlimited QR Codes',
  'Unlimited Tables',
  'Digital Menu',
  'Customer QR Ordering',
  'Manual POS Billing',
  'Kitchen Order Management',
  'Table Management',
  'Order Management',
  'Payment Management',
  'Analytics Dashboard',
  'Receipt Generation',
  'Restaurant Finance Dashboard',
  'Restaurant Settlement History',
  'Priority Support',
  'Future Updates Included',
];

export const Subscriptions = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [metrics, setMetrics] = useState({
    monthlyRevenue: 0,
    mrr: 0,
    arr: 0,
    totalActive: 0,
    totalExpired: 0,
    totalPending: 0,
    totalTrials: 0,
    renewalsToday: 0,
    planId: '',
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('all'); // all, active, trial, expired, pending, plan
  const [selectedSub, setSelectedSub] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      const res = await fetchSubscriptionsApi({
        search,
        status: activeTab !== 'all' && activeTab !== 'plan' ? activeTab : statusFilter,
      });
      if (res.success && res.data) {
        setSubscriptions(res.data.subscriptions || []);
        if (res.data.metrics) {
          setMetrics(res.data.metrics);
        }
      }
    } catch (err) {
      console.error('Failed to load subscriptions:', err);
      toast.error('Could not load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubscriptions();
  }, [statusFilter, activeTab]);

  const handleAction = async (restaurantId, action, reason = '', days = 14) => {
    try {
      setActionLoading(true);
      const res = await updateRestaurantSubscriptionApi(restaurantId, {
        plan: 'pro',
        action,
        reason,
        days,
      });
      if (res.success) {
        toast.success(`Subscription action '${action}' completed successfully`);
        setSelectedSub(null);
        loadSubscriptions();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Subscription action failed');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">
            Restaurant Subscriptions & SaaS Governance
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage tenant software tiers, 14-day free trials, MRR telemetry, and Razorpay subscriptions
          </p>
        </div>
        <button
          onClick={loadSubscriptions}
          className="self-start sm:self-auto px-3.5 py-2 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition flex items-center gap-1.5 shadow-xs cursor-pointer"
        >
          <FiRefreshCw className={loading ? 'animate-spin' : ''} /> Refresh Data
        </button>
      </div>

      {/* Analytics KPI Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Monthly MRR</span>
          <p className="text-lg font-black text-slate-900 mt-0.5">{formatCurrency(metrics.mrr)}</p>
          <span className="text-[10px] text-emerald-600 font-semibold">ARR {formatCurrency(metrics.arr)}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Active Tenants</span>
          <p className="text-lg font-black text-emerald-600 mt-0.5">{metrics.totalActive}</p>
          <span className="text-[10px] text-slate-400 font-medium">₹699 / month</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Trial Restaurants</span>
          <p className="text-lg font-black text-amber-600 mt-0.5">{metrics.totalTrials}</p>
          <span className="text-[10px] text-slate-400 font-medium">14-day window</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Expired</span>
          <p className="text-lg font-black text-rose-600 mt-0.5">{metrics.totalExpired}</p>
          <span className="text-[10px] text-slate-400 font-medium">Dashboard locked</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Pending Pay</span>
          <p className="text-lg font-black text-blue-600 mt-0.5">{metrics.totalPending}</p>
          <span className="text-[10px] text-slate-400 font-medium">Awaiting charge</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Renewals Today</span>
          <p className="text-lg font-black text-purple-600 mt-0.5">{metrics.renewalsToday}</p>
          <span className="text-[10px] text-slate-400 font-medium">Due for charge</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Gateway Plan</span>
          <p className="text-xs font-mono font-bold text-slate-700 mt-1 truncate" title={metrics.planId}>
            {metrics.planId || 'Craviti Pro'}
          </p>
          <span className="text-[10px] text-slate-400 font-medium">Razorpay Sub API</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2 overflow-x-auto">
        {[
          { id: 'all', label: 'All Subscriptions' },
          { id: 'active', label: 'Active Members' },
          { id: 'trial', label: 'Trial Restaurants' },
          { id: 'expired', label: 'Expired & Cancelled' },
          { id: 'pending', label: 'Pending Payment' },
          { id: 'plan', label: 'Craviti Pro Model (₹699)' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Plan Card Overview (Shown when 'plan' tab is selected) */}
      {activeTab === 'plan' && (
        <div className="bg-white rounded-3xl p-8 border-2 border-emerald-500 shadow-md max-w-2xl mx-auto space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Unified SaaS Plan
                </span>
                <span className="text-xs text-slate-400 font-mono">14-Day Free Trial Auto-Assigned</span>
              </div>
              <h2 className="text-2xl font-black text-slate-900 mt-2">Craviti Pro</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Full-featured single plan covering all restaurant operations with zero artificial restrictions.
              </p>
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-slate-900">{formatCurrency(699)}</span>
            <span className="text-xs text-slate-400 font-medium">/ month</span>
          </div>

          <div className="space-y-2.5 border-t border-slate-100 pt-5">
            <h4 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">Features Included:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {CRAVITI_PRO_FEATURES.map((f, i) => (
                <div key={i} className="flex items-start gap-2.5 text-xs text-slate-700 font-medium">
                  <FiCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span>Razorpay Plan ID: <strong className="font-mono text-slate-800">{metrics.planId || 'plan_Tyyafj66ChK8u3'}</strong></span>
            <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">Live Production Model</span>
          </div>
        </div>
      )}

      {/* Live Tenant Subscriptions Management Table */}
      {activeTab !== 'plan' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden space-y-4 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-[#0F172A]">Tenant Subscriptions & Trials</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                View trial countdowns, renewal dates, and manually activate or extend restaurant access
              </p>
            </div>

            {/* Filter and Search */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                <input
                  type="text"
                  placeholder="Search restaurant..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadSubscriptions()}
                  className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 w-44 sm:w-56"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="trial">Trial Only</option>
                <option value="expired">Expired Only</option>
                <option value="cancelled">Cancelled Only</option>
                <option value="suspended">Suspended Only</option>
              </select>
            </div>
          </div>

          {loading ? (
            <TableSkeleton rows={5} cols={6} />
          ) : subscriptions.length === 0 ? (
            <EmptyState title="No subscriptions found" description="No tenant records matched your filter criteria." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[11px] border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3">Restaurant</th>
                    <th className="px-4 py-3">Plan</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Monthly Fee</th>
                    <th className="px-4 py-3">Trial / Renewal Date</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {subscriptions.map((sub) => {
                    const r = sub.restaurantId || {};
                    const isSubTrial = sub.status === 'trial';
                    const isSubActive = sub.status === 'active';
                    const isSubExpired = sub.status === 'expired' || sub.status === 'cancelled';

                    return (
                      <tr key={sub._id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3">
                          <span className="font-bold text-slate-900 block">{r.restaurantName || 'Unknown'}</span>
                          <span className="text-[11px] text-slate-400 font-mono">{r.ownerName || r.email}</span>
                        </td>

                        <td className="px-4 py-3">
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Craviti Pro
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <span
                            className={`inline-block text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                              isSubActive
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : isSubTrial
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}
                          >
                            {sub.status}
                          </span>
                        </td>

                        <td className="px-4 py-3 font-bold text-[#0F172A]">
                          {formatCurrency(sub.priceMonthly || 699)}
                        </td>

                        <td className="px-4 py-3 font-mono text-[11px] text-slate-600">
                          {isSubTrial && r.subscription?.trialEndsAt ? (
                            <span className="text-amber-700">
                              Trial ends {formatDate(r.subscription.trialEndsAt)}
                            </span>
                          ) : (
                            formatDate(sub.currentPeriodEnd)
                          )}
                        </td>

                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedSub(sub)}
                            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition cursor-pointer"
                          >
                            Manage Access
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Plan Management Modal */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-sm text-[#0F172A]">
                  Manage Subscription: {selectedSub.restaurantId?.restaurantName}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Plan: <strong className="uppercase text-slate-700">Craviti Pro (₹699)</strong> • Status:{' '}
                  <span className="font-bold uppercase text-slate-700">{selectedSub.status}</span>
                </p>
              </div>
              <button onClick={() => setSelectedSub(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="font-bold text-slate-700 block">Restaurant Details:</span>
                <p className="text-slate-600">Owner: {selectedSub.restaurantId?.ownerName || 'N/A'}</p>
                <p className="text-slate-600">Email: {selectedSub.restaurantId?.email || 'N/A'}</p>
                <p className="text-slate-600">Current End: {formatDate(selectedSub.currentPeriodEnd)}</p>
              </div>

              <div className="space-y-2">
                <label className="font-bold text-slate-700 block">Subscription Lifecycle Actions:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleAction(selectedSub.restaurantId._id, 'extend_trial', 'Trial extended by Admin', 14)}
                    disabled={actionLoading}
                    className="p-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <FiClock />
                    <span>Extend Trial (+14 Days)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAction(selectedSub.restaurantId._id, 'activate', 'Activated by Admin')}
                    disabled={actionLoading}
                    className="p-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <FiCheck />
                    <span>Activate (+30 Days)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAction(selectedSub.restaurantId._id, 'suspend', 'Suspended by Admin')}
                    disabled={actionLoading}
                    className="p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-xl font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <FiLock />
                    <span>Suspend Access</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAction(selectedSub.restaurantId._id, 'cancel', 'Cancelled by Admin')}
                    disabled={actionLoading}
                    className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-xl font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <FiXCircle />
                    <span>Cancel Subscription</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedSub(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Subscriptions;
