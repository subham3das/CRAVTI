import { useState, useEffect } from 'react';
import {
  FiCheck,
  FiCreditCard,
  FiBox,
  FiFilter,
  FiSearch,
  FiArrowUp,
  FiArrowDown,
  FiSlash,
  FiRefreshCw,
  FiAlertCircle,
  FiShield,
} from 'react-icons/fi';
import { fetchSubscriptionsApi, updateRestaurantSubscriptionApi } from '../services/adminService';
import { formatCurrency, formatDate, safeString, safeNumber } from '../utils/formatters';
import { PLAN_CONFIG, SUBSCRIPTION_PLANS, SUBSCRIPTION_STATUS } from '../constants';
import { TableSkeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import toast from 'react-hot-toast';

export const Subscriptions = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedSub, setSelectedSub] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      const res = await fetchSubscriptionsApi({
        search,
        plan: planFilter,
        status: statusFilter,
      });
      if (res.success && res.data) {
        setSubscriptions(res.data.subscriptions || []);
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
  }, [planFilter, statusFilter]);

  const handleAction = async (restaurantId, plan, action, reason = '') => {
    try {
      setActionLoading(true);
      const res = await updateRestaurantSubscriptionApi(restaurantId, { plan, action, reason });
      if (res.success) {
        toast.success(`Subscription ${action} completed successfully`);
        setSelectedSub(null);
        loadSubscriptions();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Subscription action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const PLANS_DISPLAY = [
    {
      key: SUBSCRIPTION_PLANS.STARTER,
      name: 'Starter Plan',
      price: '₹0',
      period: '/ month',
      commission: '5.0% commission',
      description: 'Ideal for small cafes, quick bites & standalone dining establishments.',
      features: [
        'Up to 5 Smart QR Dining Tables',
        'Max 30 Catalog Dishes',
        'Customer QR Ordering',
        'Online Payments (Standard)',
        'Basic Thermal Receipts',
      ],
      badge: 'Free Tier',
      highlight: false,
    },
    {
      key: SUBSCRIPTION_PLANS.PROFESSIONAL,
      name: 'Professional Plan',
      price: '₹1,499',
      period: '/ month',
      commission: '2.5% commission',
      description: 'Designed for high-traffic multi-floor bistros and full-service dining halls.',
      features: [
        'Up to 25 Smart QR Dining Tables',
        'Max 150 Catalog Dishes',
        'Comprehensive Analytics Access',
        'Custom Restaurant Branding',
        'Thermal Receipt Custom Footer',
        'Priority 24/7 Support',
      ],
      badge: 'Most Popular',
      highlight: true,
    },
    {
      key: SUBSCRIPTION_PLANS.ENTERPRISE,
      name: 'Enterprise Plan',
      price: '₹3,999',
      period: '/ month',
      commission: '1.0% commission',
      description: 'Built for enterprise franchise chains with multi-outlet brand governance.',
      features: [
        'Up to 100 Smart QR Dining Tables',
        'Max 1,000 Catalog Dishes',
        'Dedicated SLA & Support Agent',
        'Custom Domain & Whitelabel',
        'Multiple Staff Roles & Accounts',
        'Priority Settlement Window',
      ],
      badge: 'Franchise Scale',
      highlight: false,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">
          Restaurant Subscriptions & SaaS Tiers
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage tenant software tiers, dining table limits, menu caps, and billing lifecycle
        </p>
      </div>

      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLANS_DISPLAY.map((p) => (
          <div
            key={p.key}
            className={`bg-white rounded-3xl p-6 border shadow-xs flex flex-col justify-between transition-all ${
              p.highlight ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-md' : 'border-slate-200/80'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span
                  className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                    p.highlight ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  {p.badge}
                </span>
                <span className="text-[11px] font-bold text-slate-400">{p.commission}</span>
              </div>

              <h2 className="text-lg font-black text-[#0F172A] tracking-tight">{p.name}</h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{p.description}</p>

              <div className="my-5 flex items-baseline gap-1">
                <span className="text-3xl font-black text-[#0F172A]">{p.price}</span>
                <span className="text-xs text-slate-400 font-medium">{p.period}</span>
              </div>

              <div className="space-y-2.5 border-t border-slate-100 pt-5">
                {p.features.map((f, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs text-slate-600 font-medium">
                    <FiCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Live Tenant Subscriptions Management Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden space-y-4 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-[#0F172A]">Active Tenant Subscriptions</h2>
            <p className="text-xs text-slate-400 mt-0.5">Upgrade, downgrade, renew, or suspend restaurant plan quotas</p>
          </div>

          {/* Filter options */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer"
            >
              <option value="all">All Plans</option>
              <option value="starter">Starter Only</option>
              <option value="professional">Professional Only</option>
              <option value="enterprise">Enterprise Only</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="suspended">Suspended Only</option>
              <option value="expired">Expired Only</option>
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
                  <th className="px-4 py-3">Active Plan</th>
                  <th className="px-4 py-3">Quotas (Tables / Items)</th>
                  <th className="px-4 py-3">Monthly Fee</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Renewal Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {subscriptions.map((sub) => {
                  const r = sub.restaurantId || {};
                  return (
                    <tr key={sub._id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3">
                        <span className="font-bold text-slate-900 block">{r.restaurantName || 'Unknown'}</span>
                        <span className="text-[11px] text-slate-400 font-mono">{r.ownerName}</span>
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                            sub.plan === 'enterprise'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : sub.plan === 'professional'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {sub.plan}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-slate-700">
                        <span>{sub.maxTables} Tables</span> • <span>{sub.maxMenuItems} Dishes</span>
                      </td>

                      <td className="px-4 py-3 font-bold text-[#0F172A]">
                        {formatCurrency(sub.priceMonthly)}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`inline-block text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                            sub.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {sub.status}
                        </span>
                      </td>

                      <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
                        {formatDate(sub.currentPeriodEnd)}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedSub(sub)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all"
                        >
                          Manage Plan
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

      {/* Plan Management Modal */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-sm text-[#0F172A]">
                  Manage Subscription: {selectedSub.restaurantId?.restaurantName}
                </h3>
                <p className="text-xs text-slate-400">Current Plan: <strong className="uppercase">{selectedSub.plan}</strong></p>
              </div>
              <button onClick={() => setSelectedSub(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <label className="font-bold text-slate-700 block">Choose New Subscription Plan:</label>
              <div className="grid grid-cols-3 gap-2">
                {Object.values(SUBSCRIPTION_PLANS).map((pKey) => (
                  <button
                    key={pKey}
                    type="button"
                    onClick={() => handleAction(selectedSub.restaurantId._id, pKey, 'upgrade', `Upgraded to ${pKey}`)}
                    disabled={actionLoading || selectedSub.plan === pKey}
                    className={`p-3 rounded-xl border text-center font-bold capitalize transition-all ${
                      selectedSub.plan === pKey
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-blue-400'
                    }`}
                  >
                    {pKey}
                  </button>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-2">
                <label className="font-bold text-slate-700 block">Lifecycle Actions:</label>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleAction(selectedSub.restaurantId._id, selectedSub.plan, 'renew', 'Manual renewal')}
                    disabled={actionLoading}
                    className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl font-bold hover:bg-emerald-100"
                  >
                    Renew +30 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAction(selectedSub.restaurantId._id, selectedSub.plan, 'suspend', 'Suspended by admin')}
                    disabled={actionLoading}
                    className="px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl font-bold hover:bg-rose-100"
                  >
                    Suspend Subscription
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAction(selectedSub.restaurantId._id, selectedSub.plan, 'expire', 'Expired manually')}
                    disabled={actionLoading}
                    className="px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl font-bold hover:bg-amber-100"
                  >
                    Mark Expired
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedSub(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
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
