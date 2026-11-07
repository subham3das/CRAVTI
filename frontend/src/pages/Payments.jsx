import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  FiDollarSign,
  FiCreditCard,
  FiTrendingUp,
  FiCalendar,
  FiDownload,
  FiRefreshCw,
  FiSearch,
  FiFilter,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiXCircle,
  FiArrowRight,
  FiPieChart,
  FiLayers,
  FiFileText,
  FiShield,
  FiEdit2,
  FiRepeat,
  FiExternalLink,
} from 'react-icons/fi';
import { MdOutlineAccountBalance, MdOutlinePayments } from 'react-icons/md';
import toast from 'react-hot-toast';

import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { StatusBadge } from '../components/StatusBadge';
import { Loader } from '../components/Loader';
import { Pagination } from '../components/Pagination';
import { formatCurrency, safeNumber, formatDate } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import {
  fetchRestaurantPaymentsSummaryApi,
  fetchRestaurantPaymentsApi,
  fetchRestaurantRevenueChartApi,
  fetchRestaurantPaymentMethodsApi,
  fetchRestaurantSettlementsApi,
  fetchRestaurantRefundsApi,
  fetchRestaurantFailedPaymentsApi,
  fetchRestaurantBankDetailsApi,
  exportRestaurantPaymentsCsvApi,
} from '../services/paymentService';

export const Payments = () => {
  const { restaurant } = useAuth();
  const navigate = useNavigate();

  // Tab & Filters State
  const [dateFilter, setDateFilter] = useState('all'); // 'today', 'week', 'month', 'all'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'success', 'pending', 'refunded'
  const [chartTimeframe, setChartTimeframe] = useState('7days'); // '7days', '30days', '6months'
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Data States
  const [summary, setSummary] = useState(null);
  const [paymentsData, setPaymentsData] = useState({ payments: [], pagination: { total: 0, totalPages: 1 } });
  const [chartData, setChartData] = useState([]);
  const [methodsData, setMethodsData] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [refunds, setRefunds] = useState([]);
  const [failedPayments, setFailedPayments] = useState([]);
  const [bankDetails, setBankDetails] = useState(null);

  // UI States
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Load All Payments Telemetry
  const loadDashboardData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);

      const [
        sumRes,
        payRes,
        chartRes,
        methodsRes,
        settleRes,
        refundsRes,
        failedRes,
        bankRes,
      ] = await Promise.all([
        fetchRestaurantPaymentsSummaryApi().catch(() => null),
        fetchRestaurantPaymentsApi({
          filter: dateFilter,
          status: statusFilter,
          search: searchQuery,
          page: currentPage,
          limit: 15,
        }).catch(() => null),
        fetchRestaurantRevenueChartApi(chartTimeframe).catch(() => null),
        fetchRestaurantPaymentMethodsApi().catch(() => null),
        fetchRestaurantSettlementsApi().catch(() => null),
        fetchRestaurantRefundsApi().catch(() => null),
        fetchRestaurantFailedPaymentsApi().catch(() => null),
        fetchRestaurantBankDetailsApi().catch(() => null),
      ]);

      if (sumRes?.success && sumRes?.data) setSummary(sumRes.data);
      if (payRes?.success && payRes?.data) setPaymentsData(payRes.data);
      if (chartRes?.success && chartRes?.data) setChartData(chartRes.data.data || []);
      if (methodsRes?.success && methodsRes?.data) setMethodsData(methodsRes.data.methods || []);
      if (settleRes?.success && settleRes?.data) setSettlements(settleRes.data.settlements || []);
      if (refundsRes?.success && refundsRes?.data) setRefunds(refundsRes.data.refunds || []);
      if (failedRes?.success && failedRes?.data) setFailedPayments(failedRes.data.failedPayments || []);
      if (bankRes?.success && bankRes?.data) setBankDetails(bankRes.data);
    } catch (err) {
      console.error('Failed to load payments telemetry:', err);
      toast.error('Failed to update payments telemetry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dateFilter, statusFilter, chartTimeframe, searchQuery, currentPage]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Export CSV
  const handleExportCSV = async () => {
    try {
      setExporting(true);
      const blob = await exportRestaurantPaymentsCsvApi({
        filter: dateFilter,
        status: statusFilter,
        search: searchQuery,
      });
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'text/csv' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Craviti_Payments_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Payments CSV statement downloaded.');
    } catch (err) {
      console.error('Export CSV failed:', err);
      toast.error('Failed to export CSV report.');
    } finally {
      setExporting(false);
    }
  };

  // Safe Values
  const totalRevenue = summary?.totalRevenue ?? 0;
  const todayRevenue = summary?.todayRevenue ?? 0;
  const pendingSettlement = summary?.pendingSettlement ?? 0;
  const totalSettled = summary?.totalSettled ?? 0;
  const totalOnlinePayments = summary?.totalOnlinePayments ?? 0;
  const totalCashPayments = summary?.totalCashPayments ?? 0;
  const commission = summary?.commissionBreakdown || { grossSales: 0, platformFee: 699, gst: 126, netSettlement: 0 };
  const timeline = summary?.settlementTimeline || {};
  const gateway = summary?.gatewayStatus || { provider: 'Razorpay', status: 'Live', webhook: 'Connected', settlement: 'Enabled' };

  // Compute Revenue SVG Points
  const revenueSvgPath = useMemo(() => {
    if (chartData.length < 2) return { path: '', area: '', points: [] };
    const maxVal = Math.max(...chartData.map((d) => d.revenue), 100);
    const width = 800;
    const height = 220;
    const paddingX = 40;
    const paddingY = 30;

    const points = chartData.map((d, i) => {
      const x = paddingX + (i / (chartData.length - 1)) * (width - 2 * paddingX);
      const y = height - paddingY - (d.revenue / maxVal) * (height - 2 * paddingY);
      return { x, y, ...d };
    });

    const pathD = points.reduce((acc, pt, i) => (i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`), '');
    const areaD = `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`;

    return { path: pathD, area: areaD, points };
  }, [chartData]);

  if (loading) {
    return <Loader fullScreen message="Loading restaurant payments & settlements..." />;
  }

  const isZeroData = totalRevenue === 0 && (paymentsData?.payments || []).length === 0;

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight font-display">
              Payments & Settlements
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-[#16A34A] text-xs font-bold border border-emerald-200/80">
              Live Gateway
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor real-time online UPI, card payments, counter cash collections, and automated bank payouts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => loadDashboardData(true)}
            disabled={refreshing}
            leftIcon={FiRefreshCw}
            className={refreshing ? 'animate-spin' : ''}
          >
            {refreshing ? 'Syncing...' : 'Refresh'}
          </Button>

          <Button
            size="sm"
            variant="secondary"
            onClick={handleExportCSV}
            disabled={exporting}
            leftIcon={FiDownload}
          >
            {exporting ? 'Exporting...' : 'Export CSV'}
          </Button>

          <Button
            size="sm"
            variant="primary"
            onClick={() => navigate('/profile')}
            leftIcon={FiCreditCard}
          >
            Bank Settings
          </Button>
        </div>
      </div>

      {/* Zero Data Banner */}
      {isZeroData && (
        <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-5 flex items-start gap-3.5">
          <FiAlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-amber-900">No payments yet</h3>
            <p className="text-xs text-amber-700 mt-0.5">
              Once customers start paying online or cash orders are completed, your payment history, commission statements, and automatic settlements will appear here.
            </p>
          </div>
        </div>
      )}

      {/* 1. Overview Cards (6 KPI Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Total Revenue */}
        <Card className="p-4 bg-white border border-slate-100 hover:border-slate-200 transition-all shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Revenue</span>
          <p className="text-lg sm:text-xl font-black text-slate-900 mt-1 font-display">
            {formatCurrency(totalRevenue)}
          </p>
          <span className="text-[10px] text-slate-400 mt-1 block">All completed orders</span>
        </Card>

        {/* Today's Revenue */}
        <Card className="p-4 bg-white border border-slate-100 hover:border-slate-200 transition-all shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Today's Revenue</span>
          <p className="text-lg sm:text-xl font-black text-[#16A34A] mt-1 font-display">
            {formatCurrency(todayRevenue)}
          </p>
          <span className="text-[10px] text-slate-400 mt-1 block">Intake today</span>
        </Card>

        {/* Pending Settlement */}
        <Card className="p-4 bg-white border border-slate-100 hover:border-slate-200 transition-all shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pending Settlement</span>
          <p className="text-lg sm:text-xl font-black text-amber-600 mt-1 font-display">
            {formatCurrency(pendingSettlement)}
          </p>
          <span className="text-[10px] text-slate-400 mt-1 block">Awaiting 02:00 AM payout</span>
        </Card>

        {/* Total Settled */}
        <Card className="p-4 bg-white border border-slate-100 hover:border-slate-200 transition-all shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Settled</span>
          <p className="text-lg sm:text-xl font-black text-slate-900 mt-1 font-display">
            {formatCurrency(totalSettled)}
          </p>
          <span className="text-[10px] text-emerald-600 font-medium mt-1 block">Transferred to bank</span>
        </Card>

        {/* Online Payments Count */}
        <Card className="p-4 bg-white border border-slate-100 hover:border-slate-200 transition-all shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Online Payments</span>
          <p className="text-lg sm:text-xl font-black text-blue-600 mt-1 font-display">
            {totalOnlinePayments}
          </p>
          <span className="text-[10px] text-slate-400 mt-1 block">UPI &amp; Card orders</span>
        </Card>

        {/* Cash Payments Count */}
        <Card className="p-4 bg-white border border-slate-100 hover:border-slate-200 transition-all shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Cash Payments</span>
          <p className="text-lg sm:text-xl font-black text-slate-700 mt-1 font-display">
            {totalCashPayments}
          </p>
          <span className="text-[10px] text-slate-400 mt-1 block">Direct counter cash</span>
        </Card>
      </div>

      {/* 2 & 3. Revenue Trend Chart + Payment Methods Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Line Chart (Takes 2 Cols) */}
        <Card className="lg:col-span-2 p-5 bg-white border border-slate-100 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <FiTrendingUp className="w-4 h-4 text-[#16A34A]" />
                Revenue Trend
              </h2>
              <p className="text-xs text-slate-400">Daily sales performance over time</p>
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
              {[
                { id: '7days', label: 'Last 7 Days' },
                { id: '30days', label: 'Last 30 Days' },
                { id: '6months', label: 'Last 6 Months' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setChartTimeframe(t.id)}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    chartTimeframe === t.id
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* SVG Chart */}
          {chartData.length === 0 ? (
            <div className="h-56 flex flex-col items-center justify-center text-slate-400 text-xs">
              <FiTrendingUp className="w-8 h-8 mb-2 text-slate-300" />
              <span>No revenue data available for this timeframe.</span>
            </div>
          ) : (
            <div className="relative w-full overflow-hidden">
              <svg viewBox="0 0 800 220" className="w-full h-56 overflow-visible">
                <defs>
                  <linearGradient id="payRevGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#16A34A" stopOpacity="0.22" />
                    <stop offset="100%" stopColor="#16A34A" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid */}
                <line x1="40" y1="30" x2="760" y2="30" stroke="#f1f5f9" strokeDasharray="4 4" />
                <line x1="40" y1="90" x2="760" y2="90" stroke="#f1f5f9" strokeDasharray="4 4" />
                <line x1="40" y1="150" x2="760" y2="150" stroke="#f1f5f9" strokeDasharray="4 4" />
                <line x1="40" y1="190" x2="760" y2="190" stroke="#e2e8f0" />

                {/* Area */}
                {revenueSvgPath.area && <path d={revenueSvgPath.area} fill="url(#payRevGrad)" />}

                {/* Line */}
                {revenueSvgPath.path && (
                  <path
                    d={revenueSvgPath.path}
                    fill="none"
                    stroke="#16A34A"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Points */}
                {revenueSvgPath.points.map((pt, idx) => (
                  <g
                    key={idx}
                    className="cursor-pointer group"
                    onMouseEnter={() => setHoveredPoint(pt)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  >
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="4.5"
                      className="fill-white stroke-[#16A34A] stroke-2 transition-transform group-hover:scale-150"
                    />
                    <text
                      x={pt.x}
                      y="208"
                      textAnchor="middle"
                      className="text-[9px] font-bold fill-slate-400 select-none"
                    >
                      {pt.date}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          )}

          {hoveredPoint && (
            <div className="text-center">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-900 text-white text-xs font-bold animate-fadeIn">
                <span>{hoveredPoint.date}:</span>
                <span className="text-emerald-400">{formatCurrency(hoveredPoint.revenue)}</span>
                <span className="text-slate-400 font-normal">({hoveredPoint.orders} orders)</span>
              </span>
            </div>
          )}
        </Card>

        {/* Payment Method Distribution */}
        <Card className="p-5 bg-white border border-slate-100 space-y-4">
          <div>
            <h2 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <FiPieChart className="w-4 h-4 text-purple-600" />
              Payment Method Distribution
            </h2>
            <p className="text-xs text-slate-400">Share of UPI, Cards, and Cash</p>
          </div>

          {methodsData.length === 0 ? (
            <div className="h-44 flex flex-col items-center justify-center text-slate-400 text-xs">
              <FiCreditCard className="w-8 h-8 mb-2 text-slate-300" />
              <span>No payment methods recorded yet.</span>
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              {methodsData.map((m, idx) => {
                const colors = ['bg-indigo-600', 'bg-emerald-600', 'bg-blue-500', 'bg-amber-500', 'bg-rose-500'];
                const color = colors[idx % colors.length];

                return (
                  <div key={m.name} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-slate-700">
                      <span>{m.name}</span>
                      <span className="flex items-center gap-1.5">
                        <span className="text-slate-900">{formatCurrency(m.revenue)}</span>
                        <span className="text-slate-400 font-normal">({m.percentage}%)</span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${color}`} style={{ width: `${m.percentage}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* 4. Recent Payments Table */}
      <Card className="p-5 bg-white border border-slate-100 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <FiDollarSign className="w-4 h-4 text-emerald-600" />
              Recent Payment Transactions
            </h2>
            <p className="text-xs text-slate-400">Individual transaction logs and settlement tracking</p>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
              <input
                type="text"
                placeholder="Search Payment, Order, Guest..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="text-xs pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#16A34A] w-48 sm:w-56"
              />
            </div>

            {/* Date Filter Tabs */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
              {[
                { id: 'all', label: 'All' },
                { id: 'today', label: 'Today' },
                { id: 'week', label: 'This Week' },
                { id: 'month', label: 'This Month' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => {
                    setDateFilter(f.id);
                    setCurrentPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    dateFilter === f.id ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs py-1.5 px-2.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-700"
            >
              <option value="all">All Statuses</option>
              <option value="success">Success</option>
              <option value="pending">Pending</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
        </div>

        {/* Transactions Table */}
        {(paymentsData.payments || []).length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            <FiCreditCard className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            No payment transactions found matching the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] tracking-wider">
                  <th className="pb-2.5 font-bold">Payment ID</th>
                  <th className="pb-2.5 font-bold">Order ID</th>
                  <th className="pb-2.5 font-bold">Customer</th>
                  <th className="pb-2.5 font-bold">Table</th>
                  <th className="pb-2.5 font-bold">Mode</th>
                  <th className="pb-2.5 font-bold">Gateway</th>
                  <th className="pb-2.5 font-bold">Status</th>
                  <th className="pb-2.5 font-bold">Settlement</th>
                  <th className="pb-2.5 font-bold text-right">Amount</th>
                  <th className="pb-2.5 font-bold text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paymentsData.payments.map((p) => (
                  <tr key={p.paymentId} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 font-bold text-slate-900 font-mono text-[11px]">{p.paymentId}</td>
                    <td className="py-2.5 font-extrabold text-slate-800">{p.orderId}</td>
                    <td className="py-2.5 font-medium text-slate-600">{p.customer}</td>
                    <td className="py-2.5 font-bold text-slate-700">{p.table}</td>
                    <td className="py-2.5">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[10px]">
                        {p.paymentMode}
                      </span>
                    </td>
                    <td className="py-2.5 text-slate-500 font-medium">{p.gateway}</td>
                    <td className="py-2.5">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          p.status === 'Success'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : p.status === 'Refunded'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {p.status === 'Success' && <FiCheckCircle className="w-2.5 h-2.5" />}
                        {p.status}
                      </span>
                    </td>
                    <td className="py-2.5">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          p.settlementStatus === 'Settled'
                            ? 'bg-blue-50 text-blue-700'
                            : p.settlementStatus === 'Processing'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {p.settlementStatus}
                      </span>
                    </td>
                    <td className="py-2.5 text-right font-black text-slate-900">
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="py-2.5 text-right text-slate-400 font-medium">
                      {formatDate(p.time)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {paymentsData.pagination?.totalPages > 1 && (
          <div className="pt-2 border-t border-slate-100 flex justify-end">
            <Pagination
              currentPage={currentPage}
              totalPages={paymentsData.pagination.totalPages}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </div>
        )}
      </Card>

      {/* 5, 6, 7. Settlement History + Timeline + Commission Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settlement History Table (Takes 2 cols) */}
        <Card className="lg:col-span-2 p-5 bg-white border border-slate-100 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <MdOutlineAccountBalance className="w-4 h-4 text-emerald-600" />
                Settlement History
              </h2>
              <p className="text-xs text-slate-400">Daily bank transfer batches (T+1 payout cycles)</p>
            </div>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
              Auto 02:00 AM Payouts
            </span>
          </div>

          {settlements.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              No settlements logged yet. Payouts trigger automatically once online orders accumulate.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] tracking-wider">
                    <th className="pb-2 font-bold">Settlement ID</th>
                    <th className="pb-2 font-bold">Date</th>
                    <th className="pb-2 font-bold">Orders</th>
                    <th className="pb-2 font-bold text-right">Gross Amount</th>
                    <th className="pb-2 font-bold text-right">Fee / GST</th>
                    <th className="pb-2 font-bold text-right">Net Payout</th>
                    <th className="pb-2 font-bold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {settlements.map((s) => (
                    <tr key={s.settlementId} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 font-bold font-mono text-slate-900">{s.settlementId}</td>
                      <td className="py-2.5 text-slate-600">{s.settlementDate}</td>
                      <td className="py-2.5 text-slate-600">{s.ordersIncluded} orders</td>
                      <td className="py-2.5 text-right font-medium text-slate-800">{formatCurrency(s.amount)}</td>
                      <td className="py-2.5 text-right text-slate-400">-{formatCurrency(s.commission + s.gst)}</td>
                      <td className="py-2.5 text-right font-black text-[#16A34A]">{formatCurrency(s.netAmount)}</td>
                      <td className="py-2.5 text-right">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            s.status === 'Completed'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Settlement Timeline & Commission Breakdown Card */}
        <div className="space-y-6">
          {/* Settlement Timeline Card */}
          <Card className="p-5 bg-white border border-slate-100 space-y-4">
            <h2 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <FiClock className="w-4 h-4 text-blue-600" />
              Settlement Timeline
            </h2>

            <div className="space-y-3 relative pl-4 border-l-2 border-emerald-200 ml-2 text-xs">
              {/* Yesterday */}
              <div className="relative">
                <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-white" />
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-slate-700">Yesterday</span>
                  <span className="text-emerald-700 font-extrabold">{formatCurrency(timeline.yesterday?.amount || 0)}</span>
                </div>
                <span className="text-[10px] text-emerald-600 font-medium">Completed • Transferred to Bank</span>
              </div>

              {/* Today */}
              <div className="relative pt-2">
                <span className="absolute -left-[21px] top-3 w-2.5 h-2.5 rounded-full bg-amber-500 ring-4 ring-white" />
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-slate-700">Today</span>
                  <span className="text-amber-700 font-extrabold">{formatCurrency(timeline.today?.amount || 0)}</span>
                </div>
                <span className="text-[10px] text-amber-600 font-medium">Processing • Payout at 02:00 AM</span>
              </div>

              {/* Tomorrow */}
              <div className="relative pt-2">
                <span className="absolute -left-[21px] top-3 w-2.5 h-2.5 rounded-full bg-slate-300 ring-4 ring-white" />
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-slate-700">Tomorrow</span>
                  <span className="text-slate-700 font-extrabold">{formatCurrency(timeline.tomorrow?.amount || 0)}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-medium">Estimated Upcoming Volume</span>
              </div>
            </div>
          </Card>

          {/* Commission Breakdown Card */}
          <Card className="p-5 bg-white border border-slate-100 space-y-3">
            <h2 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <FiDollarSign className="w-4 h-4 text-[#16A34A]" />
              Commission Breakdown
            </h2>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Gross Sales</span>
                <span className="font-bold text-slate-900">{formatCurrency(commission.grossSales)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Platform Software Fee</span>
                <span className="text-rose-600 font-medium">-{formatCurrency(commission.platformFee)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>GST (18%)</span>
                <span className="text-rose-600 font-medium">-{formatCurrency(commission.gst)}</span>
              </div>
              <div className="pt-2 border-t border-slate-100 flex justify-between items-baseline font-black">
                <span className="text-slate-900">Net Settlement</span>
                <span className="text-base text-[#16A34A]">{formatCurrency(commission.netSettlement)}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* 8, 9. Refunds & Failed Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Refunds Table */}
        <Card className="p-5 bg-white border border-slate-100 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <FiRepeat className="w-4 h-4 text-purple-600" />
                Refunds &amp; Cancellations
              </h2>
              <p className="text-xs text-slate-400">Processed dining refunds</p>
            </div>
          </div>

          {refunds.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              No refund requests logged. Customer satisfaction remains clean!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] tracking-wider">
                    <th className="pb-2 font-bold">Refund ID</th>
                    <th className="pb-2 font-bold">Order</th>
                    <th className="pb-2 font-bold">Customer</th>
                    <th className="pb-2 font-bold text-right">Amount</th>
                    <th className="pb-2 font-bold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {refunds.map((rf) => (
                    <tr key={rf.refundId} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 font-bold font-mono text-slate-900">{rf.refundId}</td>
                      <td className="py-2.5 font-medium text-slate-700">{rf.orderNumber}</td>
                      <td className="py-2.5 text-slate-600">{rf.customer}</td>
                      <td className="py-2.5 text-right font-black text-rose-600">{formatCurrency(rf.amount)}</td>
                      <td className="py-2.5 text-right">
                        <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 text-[10px] font-bold border border-purple-200">
                          {rf.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Failed Payments */}
        <Card className="p-5 bg-white border border-slate-100 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <FiXCircle className="w-4 h-4 text-rose-500" />
                Failed Transactions
              </h2>
              <p className="text-xs text-slate-400">Declined transactions and timeout alerts</p>
            </div>
          </div>

          {failedPayments.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              Zero failed payments recorded. All gateway sessions processed cleanly.
            </div>
          ) : (
            <div className="space-y-2.5">
              {failedPayments.map((fp, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 font-mono">{fp.paymentId}</span>
                      <span className="text-[10px] text-slate-500 font-medium">({fp.order})</span>
                    </div>
                    <p className="text-[11px] text-rose-600 mt-0.5 font-medium">{fp.reason}</p>
                    <p className="text-[10px] text-slate-400">{fp.customer} • {formatDate(fp.time)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-slate-900">{formatCurrency(fp.amount)}</p>
                    <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-full border border-rose-200">
                      Declined
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* 11, 12. Bank Details Card & Gateway Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bank Details Card */}
        <Card className="p-5 bg-white border border-slate-100 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <MdOutlineAccountBalance className="w-4 h-4 text-emerald-600" />
                Settlement Bank Account
              </h2>
              <p className="text-xs text-slate-400">Primary account receiving automated daily payouts</p>
            </div>
            <Button
              size="sm"
              variant="secondary"
              leftIcon={FiEdit2}
              onClick={() => navigate('/profile')}
            >
              Update Bank Details
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold">Bank Name</span>
              <p className="font-extrabold text-slate-900 mt-0.5">{bankDetails?.bankName || 'HDFC Bank'}</p>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold">Account Holder</span>
              <p className="font-bold text-slate-800 mt-0.5">{bankDetails?.accountHolder || restaurant?.restaurantName || 'Account Holder'}</p>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold">Account Number</span>
              <p className="font-mono font-bold text-slate-900 mt-0.5">{bankDetails?.accountNumberMasked || '•••• •••• 9214'}</p>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold">IFSC Code</span>
              <p className="font-mono font-bold text-slate-900 mt-0.5">{bankDetails?.ifsc || 'HDFC0001234'}</p>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold">UPI ID</span>
              <p className="font-mono font-medium text-slate-700 mt-0.5">{bankDetails?.upiId || 'restaurant@okaxis'}</p>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold">Verification Status</span>
              <p className="mt-0.5">
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-[#16A34A] text-[10px] font-bold border border-emerald-200">
                  {bankDetails?.verificationStatus || 'Active'}
                </span>
              </p>
            </div>
          </div>
        </Card>

        {/* Gateway Status Card */}
        <Card className="p-5 bg-white border border-slate-100 space-y-4">
          <div>
            <h2 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <FiShield className="w-4 h-4 text-emerald-600" />
              Payment Gateway Telemetry
            </h2>
            <p className="text-xs text-slate-400">Razorpay Direct Merchant credentials and connection status</p>
          </div>

          <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold">Gateway Provider</span>
              <p className="font-extrabold text-slate-900 mt-0.5">{gateway.provider || 'Razorpay'}</p>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold">Integration Status</span>
              <p className="mt-0.5 flex items-center gap-1.5 text-emerald-600 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {gateway.status || 'Live'}
              </p>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold">Webhook Handlers</span>
              <p className="font-bold text-emerald-600 mt-0.5 flex items-center gap-1">
                <FiCheckCircle className="w-3 h-3 text-emerald-600" />
                {gateway.webhook || 'Connected'}
              </p>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold">Payouts</span>
              <p className="font-bold text-emerald-600 mt-0.5 flex items-center gap-1">
                <FiCheckCircle className="w-3 h-3 text-emerald-600" />
                {gateway.settlement || 'Enabled'}
              </p>
            </div>

            <div className="col-span-2 pt-2 border-t border-slate-200/60 flex justify-between items-center text-[11px] text-slate-400">
              <span>Last Gateway Telemetry Ping</span>
              <span className="font-medium text-slate-600">{gateway.lastSync || '2 minutes ago'}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Payments;
