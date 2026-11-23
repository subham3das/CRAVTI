import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  FiCheck,
  FiZap,
  FiClock,
  FiAlertCircle,
  FiCreditCard,
  FiCalendar,
  FiShield,
  FiFileText,
  FiArrowRight,
  FiRefreshCw,
  FiLock,
  FiAward,
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import {
  fetchSubscriptionStatusApi,
  createSubscriptionApi,
  confirmSubscriptionApi,
  renewSubscriptionApi,
  cancelSubscriptionApi,
} from '../services/subscriptionService';
import { formatCurrency } from '../utils/formatters';
import toast from '../utils/toast';

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

export const Subscription = () => {
  const { restaurant, refreshUser } = useAuth();
  const [subData, setSubData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const loadStatus = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchSubscriptionStatusApi();
      if (res.success && res.data) {
        setSubData(res.data);
      }
    } catch (err) {
      console.error('Failed to load subscription status:', err);
      toast.error('Could not load subscription details');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const handleSubscribe = async () => {
    try {
      setActionLoading(true);
      const res = await createSubscriptionApi({
        planName: 'Craviti Pro',
        planId: subData?.planId,
      });

      if (!res.success) {
        throw new Error(res.message || 'Failed to initialize subscription');
      }

      // Check if Razorpay Checkout script is loaded
      if (typeof window !== 'undefined' && window.Razorpay && res.data?.subscriptionId && res.data?.keyId) {
        const options = {
          key: res.data.keyId,
          subscription_id: res.data.subscriptionId,
          name: 'Craviti',
          description: 'Craviti Pro Monthly Subscription',
          handler: async function (response) {
            try {
              await confirmSubscriptionApi({
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySubscriptionId: response.razorpay_subscription_id || res.data?.subscriptionId,
                razorpaySignature: response.razorpay_signature,
              });
              toast.success('Craviti Pro activated successfully!');
              refreshUser && refreshUser();
              loadStatus();
            } catch {
              toast.success('Subscription payment captured.');
              loadStatus();
            }
          },
          prefill: {
            name: res.data.ownerName || restaurant?.ownerName || '',
            contact: res.data.ownerPhone || restaurant?.ownerPhone || '',
          },
          theme: {
            color: '#16A34A',
          },
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        // Fallback for local mock development / testing
        await confirmSubscriptionApi({
          razorpayPaymentId: `pay_mock_${Date.now()}`,
          razorpaySubscriptionId: res.data?.subscriptionId,
          razorpaySignature: 'mock_signature',
        });
        toast.success('Craviti Pro activated successfully (Localhost Mode)!');
        refreshUser && refreshUser();
        loadStatus();
      }
    } catch (err) {
      console.error('Subscription error:', err);
      toast.error(err.response?.data?.message || err.message || 'Subscription failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRenew = async () => {
    try {
      setActionLoading(true);
      const res = await renewSubscriptionApi({ months: 1 });
      if (res.success) {
        toast.success('Craviti Pro renewed successfully for 30 days!');
        refreshUser && refreshUser();
        loadStatus();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Renewal failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel your Craviti Pro subscription? Your access will end at the end of the billing period.')) {
      return;
    }
    try {
      setActionLoading(true);
      const res = await cancelSubscriptionApi();
      if (res.success) {
        toast.success('Subscription cancelled.');
        refreshUser && refreshUser();
        loadStatus();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel subscription');
    } finally {
      setActionLoading(false);
    }
  };

  const sub = subData?.subscription || restaurant?.subscription;
  const status = sub?.status || 'trial';
  const isActive = status === 'active';
  const isExpired = status === 'expired' || status === 'cancelled' || status === 'halted' || status === 'suspended';
  const isTrial = status === 'trial' && !isExpired;
  const trialDays = sub?.trialDaysRemaining ?? 0;
  const renewalRequired = sub?.renewalRequired || (sub?.daysUntilRenewal !== undefined && sub.daysUntilRenewal <= 7);
  const nextBillingDate = sub?.nextBillingDate || sub?.subscriptionEnd;

  return (
    <div className="max-w-4xl mx-auto px-4 py-5 space-y-5">
      {/* Page Header */}
      <div className="text-center max-w-xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold uppercase tracking-wider mb-2">
          <FiZap className="w-3 h-3" />
          <span>Official SaaS Plan</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Upgrade to Craviti Pro
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Continue managing your restaurant with unlimited access.
        </p>
      </div>

      {/* Current Subscription Status Header Card */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              isActive
                ? 'bg-emerald-100 text-emerald-600'
                : isTrial
                ? 'bg-amber-100 text-amber-600'
                : 'bg-rose-100 text-rose-600'
            }`}
          >
            {isActive ? <FiAward size={20} /> : isTrial ? <FiClock size={20} /> : <FiLock size={20} />}
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Current Status
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  isActive
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : isTrial
                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                    : 'bg-rose-100 text-rose-800 border border-rose-200'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isActive ? 'bg-emerald-500' : isTrial ? 'bg-amber-500' : 'bg-rose-500'
                  }`}
                />
                {isActive ? 'Subscription Active' : isTrial ? 'Free Trial Active' : 'Subscription Expired'}
              </span>
              <span className="text-xs text-slate-500">
                Plan: <strong className="text-slate-800 font-semibold">{sub?.planName || 'Craviti Pro'}</strong>
              </span>
            </div>
          </div>
        </div>

        {isTrial && sub?.trialEndDate && (
          <div className="text-left sm:text-right text-xs text-slate-500">
            <span>Trial Valid Until: </span>
            <strong className="text-slate-800 font-semibold">
              {new Date(sub.trialEndDate).toLocaleDateString()}
            </strong>
          </div>
        )}
      </div>

      {/* Expired State Alert Banner */}
      {isExpired && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-950 shadow-xs"
        >
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-rose-100 flex items-center justify-center shrink-0 text-rose-600">
              <FiLock size={20} />
            </div>
            <div className="flex-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-200/80 text-rose-900 inline-block mb-0.5">
                Subscription Required
              </span>
              <h2 className="text-base font-bold text-rose-950">
                Your trial has ended.
              </h2>
              <p className="text-xs text-rose-800 mt-0.5">
                Please activate your subscription to continue using Craviti. Restaurant operations, orders, menus, and finance dashboards are locked until activated.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Active Subscription Overview Card */}
      {isActive && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl border-2 border-emerald-500 shadow-md p-5 max-w-xl mx-auto"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <FiAward size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-slate-900">Craviti Pro</h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Active
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Subscribed at {formatCurrency(699)} / month with unlimited access.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {renewalRequired ? (
                <button
                  type="button"
                  onClick={handleRenew}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition shadow-xs flex items-center gap-2 cursor-pointer"
                >
                  <FiRefreshCw className={actionLoading ? 'animate-spin' : ''} size={14} />
                  <span>Renew Subscription</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled
                  className="px-4 py-2 bg-slate-100 text-slate-400 border border-slate-200 rounded-xl font-bold text-xs cursor-not-allowed flex items-center gap-2"
                >
                  <FiCheck className="text-emerald-500" size={14} />
                  <span>Already Active</span>
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Next Billing Date
              </span>
              <span className="text-xs font-bold text-slate-800 mt-0.5 block">
                {nextBillingDate ? new Date(nextBillingDate).toLocaleDateString() : 'Auto-renewing'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Renewal Date
              </span>
              <span className="text-xs font-bold text-slate-800 mt-0.5 block">
                {subData?.subscriptionEnd ? new Date(subData.subscriptionEnd).toLocaleDateString() : 'Active'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Subscription ID
              </span>
              <span className="text-[11px] font-mono font-bold text-slate-800 mt-0.5 block truncate" title={subData?.razorpaySubscriptionId || 'N/A'}>
                {subData?.razorpaySubscriptionId || 'CRAVITI-PRO-DIRECT'}
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-400">Need to pause or cancel?</span>
            <button
              type="button"
              onClick={handleCancel}
              disabled={actionLoading}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
            >
              Cancel Subscription
            </button>
          </div>
        </motion.div>
      )}

      {/* Single Premium Subscription Plan Card (Shown when not active or upgrading) */}
      {!isActive && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border-2 border-emerald-500 shadow-md ring-2 ring-emerald-500/10 p-5 max-w-lg mx-auto"
        >
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-extrabold text-slate-900">
                  Craviti Pro
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-600 text-white tracking-wide">
                  Complete POS & QR Suite
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Full enterprise restaurant management with zero restrictions.
              </p>
            </div>
          </div>

          <div className="py-3 border-b border-slate-100 flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              {formatCurrency(699)}
            </span>
            <span className="text-xs font-semibold text-slate-500">
              / month
            </span>
            <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-100 font-bold px-2 py-0.5 rounded-md ml-auto">
              Launch Pricing
            </span>
          </div>

          {/* Included Features List */}
          <div className="py-3">
            <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2.5">
              Everything Included in Craviti Pro:
            </h4>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
              {CRAVITI_PRO_FEATURES.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-slate-700 font-medium leading-tight">
                  <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    <FiCheck size={10} className="stroke-[3]" />
                  </div>
                  <span className="truncate" title={feature}>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Large Primary Action Button */}
          <div className="pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleSubscribe}
              disabled={actionLoading}
              className={`w-full py-2.5 rounded-xl font-extrabold text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-sm cursor-pointer ${
                isExpired
                  ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
              }`}
            >
              <span>{isExpired ? 'Activate Subscription' : 'Subscribe Now'}</span>
              <FiArrowRight size={15} />
            </button>
            <p className="text-[10px] text-center text-slate-400 mt-2">
              Secured with Razorpay 256-bit SSL encryption. Cancel anytime with 1-click.
            </p>
          </div>
        </motion.div>
      )}

      {/* Invoice & Billing History */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FiFileText className="text-slate-500" />
            <span>Invoice & Billing History</span>
          </h3>
          <button
            type="button"
            onClick={loadStatus}
            disabled={loading}
            className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 transition flex items-center gap-1.5"
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>

        {subData?.billingHistory && subData.billingHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold text-[11px] border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Billing Date</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {subData.billingHistory.map((inv, i) => (
                  <tr key={i} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {new Date(inv.date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 font-extrabold text-slate-900">
                      {formatCurrency(inv.amount)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {inv.pdfUrl ? (
                        <a
                          href={inv.pdfUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-600 hover:underline font-bold"
                        >
                          Download
                        </a>
                      ) : (
                        <span className="text-slate-400 font-mono text-[11px]">Paid (Razorpay)</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-xs text-slate-400">
            No past invoices found. When your subscription is billed, records will appear here.
          </div>
        )}
      </div>
    </div>
  );
};

export default Subscription;
