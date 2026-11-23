import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiDollarSign,
  FiCreditCard,
  FiTrendingUp,
  FiLayers,
  FiSliders,
  FiActivity,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiRefreshCw,
  FiCheck,
  FiX,
  FiArrowUpRight,
  FiArrowDownRight,
  FiDownload,
  FiRepeat,
  FiShield,
  FiEdit,
  FiInfo,
  FiPercent,
  FiExternalLink,
} from 'react-icons/fi';
import {
  fetchFinanceOverviewApi,
  fetchCommissionRulesApi,
  updateCommissionRuleApi,
  fetchCommissionHistoryApi,
  fetchFinanceSettingsApi,
  updateFinanceSettingsApi,
} from '../services/adminService';
import { formatCurrency, formatDate } from '../utils/formatters';
import { TableSkeleton } from '../components/Skeleton';
import toast from 'react-hot-toast';

export const Finance = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);

  // 1. Overview State
  const [overviewData, setOverviewData] = useState({
    platformRevenue: {
      todayRevenue: 0,
      monthlyRevenue: 0,
      totalRevenue: 0,
      todayGMV: 0,
      totalGMV: 0,
    },
    platformCommission: {
      commissionEarned: 0,
      pendingCommission: 0,
      totalCommission: 0,
      monthlyCommission: 0,
    },
    razorpayFees: {
      gatewayCharges: 0,
      settlementCharges: 0,
      refundCharges: 0,
      totalRefunds: 0,
    },
    settlementSummary: {
      pending: { amount: 0, count: 0 },
      processing: { amount: 0, count: 0 },
      completed: { amount: 0, count: 0 },
    },
    subscriptionSummary: {
      active: 0,
      trial: 0,
      expired: 0,
      mrr: 0,
      arr: 0,
    },
    kpis: {
      totalGMV: 0,
      todayGMV: 0,
      pendingSettlement: 0,
      completedSettlement: 0,
      monthlyCommission: 0,
      monthlySubscriptionRevenue: 0,
      gatewayFees: 0,
      totalRestaurants: 0,
      activeSubscriptions: 0,
      trialRestaurants: 0,
      expiredRestaurants: 0,
      refunds: 0,
      netRevenue: 0,
    },
    charts: {
      dailyGmv: [],
      settlementTrend: [],
      monthlyRevenueBreakdown: [],
      subscriptionGrowth: [],
    },
  });

  // 2. Commission Rules State
  const [commissionRules, setCommissionRules] = useState({
    defaultCommission: 5.0,
    defaultGst: 5.0,
    gatewayFeePercent: 2.0,
    platformFee: 0,
    convenienceFee: 0,
    settlementCycle: 'weekly',
  });
  const [commissionHistory, setCommissionHistory] = useState([]);
  const [isCommissionModalOpen, setIsCommissionModalOpen] = useState(false);
  const [commissionForm, setCommissionForm] = useState({
    newRate: 5.0,
    reason: '',
  });

  // 3. Platform Settings State
  const [platformSettings, setPlatformSettings] = useState({
    defaultCommission: 5.0,
    defaultGst: 5.0,
    gatewayFeePercent: 2.0,
    platformFee: 0,
    convenienceFee: 0,
    settlementCycle: 'weekly',
    minimumSettlementAmount: 500,
    holdDays: 2,
    autoSettlement: true,
    autoPayout: false,
  });
  const [settingsLoading, setSettingsLoading] = useState(false);

  // ==========================================
  // Data Loaders
  // ==========================================
  const loadOverview = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchFinanceOverviewApi();
      if (res.success && res.data) {
        setOverviewData((prev) => ({
          ...prev,
          ...res.data,
          platformRevenue: res.data.platformRevenue || {
            todayRevenue: (res.data.kpis?.todayGMV || 0) * 0.05,
            monthlyRevenue: res.data.kpis?.netRevenue || 0,
            totalRevenue: (res.data.kpis?.totalGMV || 0) * 0.05,
            todayGMV: res.data.kpis?.todayGMV || 0,
            totalGMV: res.data.kpis?.totalGMV || 0,
          },
          platformCommission: res.data.platformCommission || {
            commissionEarned: res.data.kpis?.completedSettlement
              ? res.data.kpis.completedSettlement * 0.05
              : 0,
            pendingCommission: res.data.kpis?.pendingSettlement
              ? res.data.kpis.pendingSettlement * 0.05
              : 0,
            totalCommission: res.data.kpis?.monthlyCommission || 0,
            monthlyCommission: res.data.kpis?.monthlyCommission || 0,
          },
          razorpayFees: res.data.razorpayFees || {
            gatewayCharges: res.data.kpis?.gatewayFees || 0,
            settlementCharges: 0,
            refundCharges: (res.data.kpis?.refunds || 0) * 0.02,
            totalRefunds: res.data.kpis?.refunds || 0,
          },
          settlementSummary: res.data.settlementSummary || {
            pending: { amount: res.data.kpis?.pendingSettlement || 0, count: 0 },
            processing: { amount: 0, count: 0 },
            completed: { amount: res.data.kpis?.completedSettlement || 0, count: 0 },
          },
          subscriptionSummary: res.data.subscriptionSummary || {
            active: res.data.kpis?.activeSubscriptions || 0,
            trial: res.data.kpis?.trialRestaurants || 0,
            expired: res.data.kpis?.expiredRestaurants || 0,
            mrr: (res.data.kpis?.activeSubscriptions || 0) * 699,
            arr: (res.data.kpis?.activeSubscriptions || 0) * 699 * 12,
          },
        }));
      }
    } catch (err) {
      toast.error('Failed to load finance overview: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCommissionRules = useCallback(async () => {
    try {
      setLoading(true);
      const [rulesRes, histRes] = await Promise.all([
        fetchCommissionRulesApi(),
        fetchCommissionHistoryApi(),
      ]);
      if (rulesRes.success && rulesRes.data) setCommissionRules(rulesRes.data);
      if (histRes.success && histRes.data) setCommissionHistory(histRes.data);
    } catch (err) {
      toast.error('Failed to load commission rules: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPlatformSettings = useCallback(async () => {
    try {
      setSettingsLoading(true);
      const res = await fetchFinanceSettingsApi();
      if (res.success && res.settings) setPlatformSettings(res.settings);
    } catch (err) {
      toast.error('Failed to load platform settings: ' + err.message);
    } finally {
      setSettingsLoading(false);
    }
  }, []);

  useEffect(() => {
    switch (activeTab) {
      case 'overview':
        loadOverview();
        break;
      case 'commission':
        loadCommissionRules();
        break;
      case 'fees':
        loadPlatformSettings();
        break;
      default:
        break;
    }
  }, [activeTab, loadOverview, loadCommissionRules, loadPlatformSettings]);

  // ==========================================
  // Commission Modal Handlers
  // ==========================================
  const handleCommissionSubmit = async (e) => {
    e.preventDefault();
    if (!commissionForm.reason || commissionForm.reason.trim().length < 3) {
      return toast.error('Please specify a mandatory audit reason for changing commission.');
    }
    try {
      const res = await updateCommissionRuleApi({
        newRate: Number(commissionForm.newRate),
        reason: commissionForm.reason.trim(),
      });
      if (res.success) {
        toast.success(res.message || 'Platform default commission updated successfully!');
        setIsCommissionModalOpen(false);
        loadCommissionRules();
      }
    } catch (err) {
      toast.error('Failed to update commission: ' + err.message);
    }
  };

  // ==========================================
  // Platform Settings Save Handler
  // ==========================================
  const handleSettingsSave = async (e) => {
    e.preventDefault();
    try {
      setSettingsLoading(true);
      const res = await updateFinanceSettingsApi(platformSettings);
      if (res.success) {
        toast.success('Platform finance and fee configuration saved!');
        if (res.settings) setPlatformSettings(res.settings);
      }
    } catch (err) {
      toast.error('Failed to save settings: ' + err.message);
    } finally {
      setSettingsLoading(false);
    }
  };

  // ==========================================
  // Quick Action: Export Finance Snapshot CSV
  // ==========================================
  const handleExportFinanceReport = () => {
    try {
      const pRev = overviewData.platformRevenue || {};
      const pCom = overviewData.platformCommission || {};
      const rzFee = overviewData.razorpayFees || {};
      const setSum = overviewData.settlementSummary || {};
      const subSum = overviewData.subscriptionSummary || {};

      const csvRows = [
        ['Craviti Platform Finance Executive Report'],
        ['Generated At', new Date().toISOString()],
        [],
        ['Metric Category', 'Metric Name', 'Value / Amount (INR)'],
        ['Platform Revenue', "Today's Platform Revenue", pRev.todayRevenue || 0],
        ['Platform Revenue', 'Monthly Platform Revenue', pRev.monthlyRevenue || 0],
        ['Platform Revenue', 'Total Lifetime Revenue', pRev.totalRevenue || 0],
        ['Platform Revenue', 'Total Platform GMV', pRev.totalGMV || 0],
        [],
        ['Platform Commission', 'Commission Earned (Completed)', pCom.commissionEarned || 0],
        ['Platform Commission', 'Pending Commission', pCom.pendingCommission || 0],
        ['Platform Commission', 'Total Commission', pCom.totalCommission || 0],
        [],
        ['Razorpay & Gateway Fees', 'Total Gateway Charges', rzFee.gatewayCharges || 0],
        ['Razorpay & Gateway Fees', 'Settlement Charges', rzFee.settlementCharges || 0],
        ['Razorpay & Gateway Fees', 'Refund Charges', rzFee.refundCharges || 0],
        [],
        ['Settlement Summary', 'Pending Settlements Amount', setSum.pending?.amount || 0],
        ['Settlement Summary', 'Pending Settlements Count', setSum.pending?.count || 0],
        ['Settlement Summary', 'Processing Settlements Amount', setSum.processing?.amount || 0],
        ['Settlement Summary', 'Processing Settlements Count', setSum.processing?.count || 0],
        ['Settlement Summary', 'Completed Settlements Amount', setSum.completed?.amount || 0],
        ['Settlement Summary', 'Completed Settlements Count', setSum.completed?.count || 0],
        [],
        ['Subscription Summary', 'Active Paying Restaurants', subSum.active || 0],
        ['Subscription Summary', 'Free Trial Restaurants', subSum.trial || 0],
        ['Subscription Summary', 'Expired / Churned Restaurants', subSum.expired || 0],
        ['Subscription Summary', 'Monthly Recurring Revenue (MRR)', subSum.mrr || 0],
        ['Subscription Summary', 'Annual Run Rate (ARR)', subSum.arr || 0],
      ];

      const csvContent =
        'data:text/csv;charset=utf-8,' +
        csvRows.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `craviti_finance_report_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Finance report downloaded successfully.');
    } catch (err) {
      toast.error('Failed to export report: ' + err.message);
    }
  };

  // Finance-only operational tabs
  const TABS = [
    { id: 'overview', label: 'Overview', icon: FiActivity, description: 'Executive operational dashboard & KPIs' },
    { id: 'commission', label: 'Commission Rules', icon: FiSliders, description: 'Default commission & audit history' },
    { id: 'fees', label: 'Platform Fees', icon: FiCreditCard, description: 'Gateway fees, taxes & payout rules' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FiDollarSign className="text-emerald-600 w-7 h-7" />
            Finance & Platform Revenue
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Executive operational finance dashboard, commission rules, gateway fee structure, and revenue KPIs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (activeTab === 'overview') loadOverview();
              else if (activeTab === 'commission') loadCommissionRules();
              else if (activeTab === 'fees') loadPlatformSettings();
            }}
            disabled={loading || settingsLoading}
            className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl transition shadow-xs disabled:opacity-50"
            title="Refresh Finance Data"
          >
            <FiRefreshCw className={`w-4 h-4 ${loading || settingsLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            onClick={handleExportFinanceReport}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition shadow-xs"
          >
            <FiDownload className="w-4 h-4" />
            Export Finance Report
          </button>
        </div>
      </div>

      {/* Tabs Navigation (Strictly Finance-specific operational tabs) */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-px overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition whitespace-nowrap ${
                isActive
                  ? 'border-emerald-600 text-emerald-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ========================================================= */}
      {/* TAB 1: EXECUTIVE FINANCE OVERVIEW */}
      {/* ========================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Actions Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Quick Actions</span>
              <span className="text-xs text-slate-400">|</span>
              <span className="text-xs text-slate-500">Jump to dedicated operational management centers</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => navigate('/settlements')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
              >
                <FiRepeat className="w-3.5 h-3.5 text-emerald-600" />
                Open Settlements
                <FiExternalLink className="w-3 h-3 text-slate-400" />
              </button>
              <button
                onClick={() => navigate('/subscriptions')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
              >
                <FiLayers className="w-3.5 h-3.5 text-blue-600" />
                Open Subscriptions
                <FiExternalLink className="w-3 h-3 text-slate-400" />
              </button>
              <button
                onClick={() => navigate('/payments')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
              >
                <FiCreditCard className="w-3.5 h-3.5 text-purple-600" />
                Open Payments
                <FiExternalLink className="w-3 h-3 text-slate-400" />
              </button>
              <button
                onClick={handleExportFinanceReport}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-xl border border-emerald-200 transition"
              >
                <FiDownload className="w-3.5 h-3.5 text-emerald-600" />
                Export Finance Report
              </button>
            </div>
          </div>

          {/* Section 1: Platform Revenue */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <FiDollarSign className="w-4 h-4 text-emerald-600" />
                Platform Revenue
              </h2>
              <span className="text-xs text-slate-400 font-medium">Net platform earnings from commissions & subscriptions</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-200 transition">
                <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                  <span>Today's Revenue</span>
                  <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                    <FiTrendingUp className="w-4 h-4" />
                  </span>
                </div>
                <div className="text-2xl font-bold text-slate-900 mt-2">
                  {formatCurrency(overviewData.platformRevenue?.todayRevenue || 0)}
                </div>
                <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                  <span className="text-slate-400">GMV:</span>
                  <span className="font-medium text-slate-700">
                    {formatCurrency(overviewData.platformRevenue?.todayGMV || overviewData.kpis?.todayGMV || 0)}
                  </span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-200 transition">
                <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                  <span>Monthly Revenue</span>
                  <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                    <FiDollarSign className="w-4 h-4" />
                  </span>
                </div>
                <div className="text-2xl font-bold text-slate-900 mt-2">
                  {formatCurrency(overviewData.platformRevenue?.monthlyRevenue || 0)}
                </div>
                <div className="text-xs text-slate-500 mt-1">Current calendar month earnings</div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-200 transition">
                <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                  <span>Total Lifetime Revenue</span>
                  <span className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                    <FiLayers className="w-4 h-4" />
                  </span>
                </div>
                <div className="text-2xl font-bold text-slate-900 mt-2">
                  {formatCurrency(overviewData.platformRevenue?.totalRevenue || 0)}
                </div>
                <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                  <span className="text-slate-400">Platform GMV:</span>
                  <span className="font-semibold text-slate-700">
                    {formatCurrency(overviewData.platformRevenue?.totalGMV || overviewData.kpis?.totalGMV || 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Platform Commission */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <FiPercent className="w-4 h-4 text-emerald-600" />
                Platform Commission
              </h2>
              <span className="text-xs text-slate-400 font-medium">Order commission breakdown across merchant payouts</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                  <span>Commission Earned (Completed)</span>
                  <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                    <FiCheckCircle className="w-4 h-4" />
                  </span>
                </div>
                <div className="text-2xl font-bold text-emerald-600 mt-2">
                  {formatCurrency(overviewData.platformCommission?.commissionEarned || 0)}
                </div>
                <div className="text-xs text-slate-400 mt-1">Realized from settled merchant payouts</div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                  <span>Pending Commission</span>
                  <span className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                    <FiClock className="w-4 h-4" />
                  </span>
                </div>
                <div className="text-2xl font-bold text-amber-600 mt-2">
                  {formatCurrency(overviewData.platformCommission?.pendingCommission || 0)}
                </div>
                <div className="text-xs text-slate-400 mt-1">Awaiting settlement cycle completion</div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                  <span>Total Platform Commission</span>
                  <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                    <FiSliders className="w-4 h-4" />
                  </span>
                </div>
                <div className="text-2xl font-bold text-slate-900 mt-2">
                  {formatCurrency(overviewData.platformCommission?.totalCommission || 0)}
                </div>
                <div className="text-xs text-slate-400 mt-1">Lifetime total accrued platform commission</div>
              </div>
            </div>
          </div>

          {/* Section 3: Razorpay & Gateway Fees */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <FiCreditCard className="w-4 h-4 text-purple-600" />
                Razorpay & Gateway Fees
              </h2>
              <span className="text-xs text-slate-400 font-medium">Third-party payment gateway costs and transfer charges</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                  <span>Total Gateway Charges</span>
                  <span className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                    <FiCreditCard className="w-4 h-4" />
                  </span>
                </div>
                <div className="text-2xl font-bold text-slate-900 mt-2">
                  {formatCurrency(overviewData.razorpayFees?.gatewayCharges || 0)}
                </div>
                <div className="text-xs text-slate-400 mt-1">~2.0% standard online payment gateway fee</div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                  <span>Settlement Charges</span>
                  <span className="p-2 bg-slate-50 text-slate-600 rounded-xl">
                    <FiRepeat className="w-4 h-4" />
                  </span>
                </div>
                <div className="text-2xl font-bold text-slate-900 mt-2">
                  {formatCurrency(overviewData.razorpayFees?.settlementCharges || 0)}
                </div>
                <div className="text-xs text-slate-400 mt-1">IMPS / NEFT transfer payout processing fees</div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                  <span>Refund Charges</span>
                  <span className="p-2 bg-red-50 text-red-600 rounded-xl">
                    <FiArrowDownRight className="w-4 h-4" />
                  </span>
                </div>
                <div className="text-2xl font-bold text-red-600 mt-2">
                  {formatCurrency(overviewData.razorpayFees?.refundCharges || 0)}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Adjustments on {formatCurrency(overviewData.razorpayFees?.totalRefunds || 0)} refunds
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Settlement Summary (Cards only, no management actions or table) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <FiRepeat className="w-4 h-4 text-emerald-600" />
                Settlement Summary
              </h2>
              <button
                onClick={() => navigate('/settlements')}
                className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1"
              >
                Manage in Settlements Page <FiArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-amber-200/80 bg-gradient-to-br from-white to-amber-50/20 shadow-xs">
                <div className="flex items-center justify-between text-amber-700 text-xs font-semibold">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    Pending Settlements
                  </span>
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs font-bold rounded-full">
                    {overviewData.settlementSummary?.pending?.count || 0} batches
                  </span>
                </div>
                <div className="text-2xl font-bold text-amber-700 mt-2">
                  {formatCurrency(overviewData.settlementSummary?.pending?.amount || 0)}
                </div>
                <div className="text-xs text-slate-500 mt-1">Awaiting batch verification & approval</div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-blue-200/80 bg-gradient-to-br from-white to-blue-50/20 shadow-xs">
                <div className="flex items-center justify-between text-blue-700 text-xs font-semibold">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    Processing Settlements
                  </span>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-bold rounded-full">
                    {overviewData.settlementSummary?.processing?.count || 0} batches
                  </span>
                </div>
                <div className="text-2xl font-bold text-blue-700 mt-2">
                  {formatCurrency(overviewData.settlementSummary?.processing?.amount || 0)}
                </div>
                <div className="text-xs text-slate-500 mt-1">Bank route payout in progress</div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-white to-emerald-50/20 shadow-xs">
                <div className="flex items-center justify-between text-emerald-700 text-xs font-semibold">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Completed Payouts
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
                    {overviewData.settlementSummary?.completed?.count || 0} batches
                  </span>
                </div>
                <div className="text-2xl font-bold text-emerald-700 mt-2">
                  {formatCurrency(overviewData.settlementSummary?.completed?.amount || 0)}
                </div>
                <div className="text-xs text-slate-500 mt-1">Successfully transferred to restaurant accounts</div>
              </div>
            </div>
          </div>

          {/* Section 5: Subscription Revenue Summary (Cards only, no management actions or table) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <FiLayers className="w-4 h-4 text-blue-600" />
                Subscription Revenue Summary
              </h2>
              <button
                onClick={() => navigate('/subscriptions')}
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
              >
                Manage in Subscriptions Page <FiArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-xs text-slate-500 font-medium">Active Restaurants</span>
                <p className="text-2xl font-bold text-emerald-600 mt-1">
                  {overviewData.subscriptionSummary?.active || 0}
                </p>
                <span className="text-xs text-slate-400">Paying subscribers</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-xs text-slate-500 font-medium">Trial Restaurants</span>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  {overviewData.subscriptionSummary?.trial || 0}
                </p>
                <span className="text-xs text-slate-400">Active free trials</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-xs text-slate-500 font-medium">Expired / Churned</span>
                <p className="text-2xl font-bold text-red-500 mt-1">
                  {overviewData.subscriptionSummary?.expired || 0}
                </p>
                <span className="text-xs text-slate-400">Past renewal date</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-xs text-slate-500 font-medium">MRR (Monthly Run Rate)</span>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {formatCurrency(overviewData.subscriptionSummary?.mrr || 0)}
                </p>
                <span className="text-xs text-slate-400">Recurring monthly fees</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs col-span-2 sm:col-span-1">
                <span className="text-xs text-slate-500 font-medium">ARR (Annual Run Rate)</span>
                <p className="text-2xl font-bold text-indigo-600 mt-1">
                  {formatCurrency(overviewData.subscriptionSummary?.arr || 0)}
                </p>
                <span className="text-xs text-slate-400">Annualized run rate</span>
              </div>
            </div>
          </div>

          {/* Section 6: Interactive Trends & Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center justify-between">
                <span>Daily Gross Merchandise Value (Last 7 Days)</span>
                <span className="text-xs font-normal text-slate-400">Live order volume</span>
              </h3>
              <div className="space-y-3">
                {overviewData.charts.dailyGmv.length === 0 ? (
                  <p className="text-sm text-slate-400 py-8 text-center">No transactions recorded in this period.</p>
                ) : (
                  overviewData.charts.dailyGmv.map((d) => (
                    <div key={d.date} className="flex items-center gap-3">
                      <span className="text-xs text-slate-500 w-24">{d.date}</span>
                      <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(100, Math.max(8, (d.gmv / (overviewData.kpis?.totalGMV || 1)) * 300))}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-slate-800 w-24 text-right">
                        {formatCurrency(d.gmv)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center justify-between">
                <span>Settlement Trend (Settled vs Pending)</span>
                <span className="text-xs font-normal text-slate-400">Daily reconciliation</span>
              </h3>
              <div className="space-y-3">
                {overviewData.charts.settlementTrend.length === 0 ? (
                  <p className="text-sm text-slate-400 py-8 text-center">No settlements recorded in this period.</p>
                ) : (
                  overviewData.charts.settlementTrend.map((s) => (
                    <div key={s.date} className="flex items-center gap-3">
                      <span className="text-xs text-slate-500 w-24">{s.date}</span>
                      <div className="flex-1 flex gap-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full"
                          style={{
                            width: `${Math.min(100, Math.max(5, (s.settled / ((s.settled + s.pending) || 1)) * 100))}%`,
                          }}
                          title={`Settled: ${formatCurrency(s.settled)}`}
                        />
                        <div
                          className="bg-amber-400 h-full rounded-full"
                          style={{
                            width: `${Math.min(100, Math.max(5, (s.pending / ((s.settled + s.pending) || 1)) * 100))}%`,
                          }}
                          title={`Pending: ${formatCurrency(s.pending)}`}
                        />
                      </div>
                      <span className="text-xs font-semibold text-slate-800 w-28 text-right">
                        ✓ {formatCurrency(s.settled)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: COMMISSION RULES & AUDIT HISTORY */}
      {/* ========================================================= */}
      {activeTab === 'commission' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Platform Commission Rules</h3>
                <p className="text-xs text-slate-500">
                  Global baseline commission applied across all restaurants unless custom terms are assigned in Restaurant Profile.
                </p>
              </div>
              <button
                onClick={() => {
                  setCommissionForm({ newRate: commissionRules.defaultCommission, reason: '' });
                  setIsCommissionModalOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition shadow-xs"
              >
                <FiEdit className="w-4 h-4" /> Update Default Commission
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-500">Default Commission</span>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{commissionRules.defaultCommission}%</p>
                <span className="text-xs text-slate-400">Global merchant baseline</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-500">GST on Commission</span>
                <p className="text-2xl font-bold text-slate-900 mt-1">{commissionRules.defaultGst}%</p>
                <span className="text-xs text-slate-400">Statutory tax standard</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-500">Gateway Fee %</span>
                <p className="text-2xl font-bold text-slate-900 mt-1">{commissionRules.gatewayFeePercent}%</p>
                <span className="text-xs text-slate-400">Online payment fee</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-500">Settlement Cycle</span>
                <p className="text-2xl font-bold capitalize text-slate-900 mt-1">{commissionRules.settlementCycle}</p>
                <span className="text-xs text-slate-400">Standard payout frequency</span>
              </div>
            </div>
          </div>

          {/* Commission Update History */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-slate-900">Commission Change Audit History</h4>
                <p className="text-xs text-slate-400">Permanent audit trail of all commission rate modifications</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
                {commissionHistory.length} Record{commissionHistory.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase">
                    <th className="py-2.5 px-4">Date</th>
                    <th className="py-2.5 px-4">Scope / Target</th>
                    <th className="py-2.5 px-4">Old Rate</th>
                    <th className="py-2.5 px-4">New Rate</th>
                    <th className="py-2.5 px-4">Reason</th>
                    <th className="py-2.5 px-4">Changed By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {commissionHistory.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-slate-400">
                        No commission changes recorded yet.
                      </td>
                    </tr>
                  ) : (
                    commissionHistory.map((h) => (
                      <tr key={h._id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-4 text-slate-500">{formatDate(h.createdAt)}</td>
                        <td className="py-2.5 px-4 font-medium text-slate-900">
                          {h.restaurantId?.restaurantName || h.restaurantId?.name || 'Global Default'}
                        </td>
                        <td className="py-2.5 px-4 text-slate-600">{h.oldRate}%</td>
                        <td className="py-2.5 px-4 font-bold text-emerald-600">{h.newRate}%</td>
                        <td className="py-2.5 px-4 text-slate-700">{h.reason}</td>
                        <td className="py-2.5 px-4 text-slate-500">{h.adminEmail || 'admin'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: PLATFORM FEES & GATEWAY CONFIGURATION */}
      {/* ========================================================= */}
      {activeTab === 'fees' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs max-w-4xl">
          <div className="mb-6">
            <h3 className="text-base font-bold text-slate-900">Platform Fees & Financial Rules</h3>
            <p className="text-xs text-slate-500 mt-1">
              Enterprise parameters for gateway deductions, platform fees, minimum settlement amounts, and payout cycles.
            </p>
          </div>

          <form onSubmit={handleSettingsSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Default Platform Commission (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={platformSettings.defaultCommission}
                  onChange={(e) =>
                    setPlatformSettings({ ...platformSettings, defaultCommission: Number(e.target.value) })
                  }
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <span className="text-xs text-slate-400 mt-1 block">Baseline commission charged per completed order</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  GST on Commission (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={platformSettings.defaultGst}
                  onChange={(e) =>
                    setPlatformSettings({ ...platformSettings, defaultGst: Number(e.target.value) })
                  }
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <span className="text-xs text-slate-400 mt-1 block">Statutory GST on platform services</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Gateway Processing Fee (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={platformSettings.gatewayFeePercent}
                  onChange={(e) =>
                    setPlatformSettings({ ...platformSettings, gatewayFeePercent: Number(e.target.value) })
                  }
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <span className="text-xs text-slate-400 mt-1 block">Online PG transaction deduction (Razorpay / UPI)</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Fixed Platform Fee per Order (₹)
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={platformSettings.platformFee || 0}
                  onChange={(e) =>
                    setPlatformSettings({ ...platformSettings, platformFee: Number(e.target.value) })
                  }
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <span className="text-xs text-slate-400 mt-1 block">Fixed flat charge per order (if applicable)</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Convenience Fee (₹)
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={platformSettings.convenienceFee || 0}
                  onChange={(e) =>
                    setPlatformSettings({ ...platformSettings, convenienceFee: Number(e.target.value) })
                  }
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <span className="text-xs text-slate-400 mt-1 block">Customer checkout convenience fee</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Standard Settlement Cycle
                </label>
                <select
                  value={platformSettings.settlementCycle}
                  onChange={(e) =>
                    setPlatformSettings({ ...platformSettings, settlementCycle: e.target.value })
                  }
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="daily">Daily (T+1)</option>
                  <option value="weekly">Weekly (Standard)</option>
                  <option value="biweekly">Bi-Weekly (Fortnightly)</option>
                  <option value="monthly">Monthly</option>
                  <option value="manual">Manual Batching Only</option>
                </select>
                <span className="text-xs text-slate-400 mt-1 block">Default settlement schedule for verified merchants</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Minimum Settlement Threshold (₹)
                </label>
                <input
                  type="number"
                  step="50"
                  min="0"
                  value={platformSettings.minimumSettlementAmount}
                  onChange={(e) =>
                    setPlatformSettings({ ...platformSettings, minimumSettlementAmount: Number(e.target.value) })
                  }
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <span className="text-xs text-slate-400 mt-1 block">Minimum wallet balance required before triggering a payout</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payout Hold Days (Dispute Window)
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={platformSettings.holdDays}
                  onChange={(e) =>
                    setPlatformSettings({ ...platformSettings, holdDays: Number(e.target.value) })
                  }
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <span className="text-xs text-slate-400 mt-1 block">Days to hold settlement funds for potential chargebacks/refunds</span>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={platformSettings.autoSettlement}
                    onChange={(e) =>
                      setPlatformSettings({ ...platformSettings, autoSettlement: e.target.checked })
                    }
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <span className="text-xs font-medium text-slate-700">Auto-Generate Settlements</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={platformSettings.autoPayout}
                    onChange={(e) =>
                      setPlatformSettings({ ...platformSettings, autoPayout: e.target.checked })
                    }
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <span className="text-xs font-medium text-slate-700">Auto-Trigger Razorpay Route Transfer</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={settingsLoading}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition shadow-xs disabled:opacity-50"
              >
                {settingsLoading ? 'Saving...' : 'Save Platform Fee Settings'}
              </button>
            </div>
          </form>

          <div className="mt-8 p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3">
            <FiInfo className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600 space-y-1">
              <p className="font-semibold text-slate-800">Operational Deductions Architecture</p>
              <p>
                Net payout for each settlement batch is computed as:{' '}
                <span className="font-mono font-medium text-slate-800">
                  Gross GMV - Platform Commission - GST on Commission - Gateway Fee (PG)
                </span>
                . Changes made here will govern future settlement calculations. Completed settlements are immutable financial ledgers.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: UPDATE DEFAULT COMMISSION */}
      {/* ========================================================= */}
      {isCommissionModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">Update Platform Default Commission</h3>
              <button
                onClick={() => setIsCommissionModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCommissionSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Commission Rate (%) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  required
                  value={commissionForm.newRate}
                  onChange={(e) => setCommissionForm({ ...commissionForm, newRate: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mandatory Audit Reason *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Revised platform fee policy for Q4, approved by leadership"
                  value={commissionForm.reason}
                  onChange={(e) => setCommissionForm({ ...commissionForm, reason: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <span className="text-xs text-slate-400 mt-1 block">
                  Every commission rate change is logged in the permanent audit ledger.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCommissionModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition shadow-xs"
                >
                  Apply & Record Audit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Finance;
