import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  FiDollarSign,
  FiCreditCard,
  FiClock,
  FiCheckCircle,
  FiDownload,
  FiRefreshCw,
  FiFileText,
  FiZap,
  FiInfo,
  FiArrowUpRight,
  FiShield,
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import {
  fetchRestaurantFinanceOverviewApi,
  fetchRestaurantSettlementsApi,
  fetchRestaurantInvoicesApi,
  exportRestaurantSettlementReportApi,
} from '../services/financeService';
import { formatCurrency, formatDate } from '../utils/formatters';
import toast from '../utils/toast';

export const Finance = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('settlements'); // 'settlements', 'invoices'
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState({
    wallet: {
      currentBalance: 0,
      pendingBalance: 0,
      settledBalance: 0,
      lifetimeEarnings: 0,
      lifetimeCommission: 0,
      lifetimeGatewayFees: 0,
      lastSettlementAt: null,
    },
    subscription: null,
  });
  const [settlements, setSettlements] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [exporting, setExporting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [overviewRes, settlementsRes, invoicesRes] = await Promise.all([
        fetchRestaurantFinanceOverviewApi(),
        fetchRestaurantSettlementsApi({ limit: 50 }),
        fetchRestaurantInvoicesApi(),
      ]);

      if (overviewRes.success) {
        setOverview(overviewRes);
      }
      if (settlementsRes.success) {
        setSettlements(settlementsRes.settlements || []);
      }
      if (invoicesRes.success) {
        setInvoices(invoicesRes.invoices || []);
      }
    } catch (err) {
      toast.error('Failed to load finance data: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleExportCSV = async () => {
    try {
      setExporting(true);
      const blob = await exportRestaurantSettlementReportApi();
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `settlements_report_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Settlement report downloaded.');
    } catch (err) {
      toast.error('Export failed: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  const wallet = overview.wallet || {};
  const subscription = overview.subscription || {};

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
              <FiDollarSign className="w-5 h-5" />
            </span>
            Finance & Settlements
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track payout ledger, pending balances, platform invoices, and billing history.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition shadow-xs disabled:opacity-60"
          >
            <FiDownload className="w-4 h-4 text-emerald-600" />
            {exporting ? 'Exporting...' : 'Export Reports'}
          </button>
          <button
            onClick={loadData}
            className="p-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl transition shadow-xs"
            title="Refresh Data"
          >
            <FiRefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Wallet Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending Settlement */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Pending Settlement
            </span>
            <span className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
              <FiClock className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-bold text-amber-600 mt-2">
            {formatCurrency(wallet.pendingBalance || 0)}
          </p>
          <span className="text-xs text-slate-400 mt-2 block">
            Accumulated from recent completed orders
          </span>
        </div>

        {/* Settled / Paid Balance */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Completed Settlement
            </span>
            <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <FiCheckCircle className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-bold text-emerald-600 mt-2">
            {formatCurrency(wallet.settledBalance || 0)}
          </p>
          <span className="text-xs text-slate-400 mt-2 block">
            Transferred directly to your bank account
          </span>
        </div>

        {/* Lifetime Earnings */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Lifetime Net Earnings
            </span>
            <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <FiDollarSign className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {formatCurrency(wallet.lifetimeEarnings || 0)}
          </p>
          <span className="text-xs text-slate-400 mt-2 block">
            Net revenue processed through Craviti
          </span>
        </div>

        {/* Subscription Status Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Plan & Renewal
              </span>
              <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                <FiZap className="w-4 h-4" />
              </span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <p className="text-lg font-bold text-slate-900">
                {subscription.planName || 'Free Trial'}
              </p>
              <span
                className={`px-2 py-0.5 text-[10px] font-semibold uppercase rounded-md ${
                  subscription.status === 'active'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                    : 'bg-blue-50 text-blue-700 border border-blue-100'
                }`}
              >
                {subscription.status || 'trial'}
              </span>
            </div>
          </div>
          <button
            onClick={() => navigate('/subscription')}
            className="mt-3 w-full py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition"
          >
            Manage Subscription
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('settlements')}
          className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold border-b-2 transition ${
            activeTab === 'settlements'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <FiCreditCard className="w-4 h-4" />
          Settlement Ledger
        </button>
        <button
          onClick={() => setActiveTab('invoices')}
          className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold border-b-2 transition ${
            activeTab === 'invoices'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <FiFileText className="w-4 h-4" />
          Platform Invoices
        </button>
      </div>

      {/* Tab 1: Settlement Ledger */}
      {activeTab === 'settlements' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Order Settlements</h3>
              <p className="text-xs text-slate-400">
                Immutable ledger of orders, commissions deducted, and net amounts payable.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                  <th className="py-3 px-4">Settlement ID</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Gross Sales</th>
                  <th className="py-3 px-4">Platform Fee</th>
                  <th className="py-3 px-4">Gateway Fee</th>
                  <th className="py-3 px-4">Net Payable</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Bank UTR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="py-8 text-center text-slate-400">Loading settlements...</td>
                  </tr>
                ) : settlements.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-8 text-center text-slate-400">No settlement history found yet.</td>
                  </tr>
                ) : (
                  settlements.map((s) => (
                    <tr key={s._id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-900">{s.settlementId}</td>
                      <td className="py-3.5 px-4 text-slate-500">{formatDate(s.createdAt)}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">{formatCurrency(s.grossAmount)}</td>
                      <td className="py-3.5 px-4 text-blue-600">
                        -{formatCurrency(s.platformCommission || s.commissionAmount)}
                        <span className="text-[10px] text-slate-400 ml-1">({s.commissionRate}%)</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        -{formatCurrency(s.gatewayFee || 0)}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-emerald-600">
                        {formatCurrency(s.netAmount || s.amount)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex px-2 py-0.5 text-[10px] font-semibold uppercase rounded-md ${
                            s.status === 'completed' || s.status === 'paid'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                              : s.status === 'approved' || s.status === 'processing'
                              ? 'bg-blue-50 text-blue-700 border border-blue-100'
                              : 'bg-amber-50 text-amber-700 border border-amber-100'
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-500">{s.utr || '--'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Platform Invoices */}
      {activeTab === 'invoices' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900">Subscription & Platform Invoices</h3>
            <p className="text-xs text-slate-400">
              Tax invoices for Craviti SaaS subscription and software license fees.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Plan</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-400">No invoices issued yet.</td>
                  </tr>
                ) : (
                  invoices.map((inv) => (
                    <tr key={inv._id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-900">{inv.invoiceNumber}</td>
                      <td className="py-3.5 px-4 font-medium text-slate-800">{inv.planName}</td>
                      <td className="py-3.5 px-4 text-slate-500">{formatDate(inv.invoiceDate || inv.createdAt)}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">{formatCurrency(inv.totalAmount)}</td>
                      <td className="py-3.5 px-4 capitalize text-slate-600">{inv.paymentMethod}</td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex px-2 py-0.5 text-[10px] font-semibold uppercase rounded-md bg-emerald-50 text-emerald-700">
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Finance;

