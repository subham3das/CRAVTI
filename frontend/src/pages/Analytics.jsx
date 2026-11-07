import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiCalendar,
  FiDownload,
  FiRefreshCw,
  FiTrendingUp,
  FiTrendingDown,
  FiShoppingBag,
  FiUsers,
  FiClock,
  FiCheckCircle,
  FiDollarSign,
  FiPieChart,
  FiAward,
  FiActivity,
  FiCreditCard,
  FiPercent,
  FiLayers,
  FiPrinter,
  FiAlertCircle,
  FiChevronRight,
} from 'react-icons/fi';
import { MdOutlineTableRestaurant, MdRestaurantMenu } from 'react-icons/md';
import toast from 'react-hot-toast';

import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Table } from '../components/Table';
import { StatusBadge } from '../components/StatusBadge';
import { FoodTypeBadge } from '../components/FoodTypeBadge';
import { EmptyState } from '../components/EmptyState';
import { Loader } from '../components/Loader';
import { ThreeHealthOrb } from '../components/analytics/ThreeHealthOrb';
import { formatCurrency, safeNumber, formatDate } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import { fetchRestaurantAnalyticsApi, exportAnalyticsReportApi } from '../services/analyticsService';

const PERIOD_OPTIONS = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: '7days', label: 'Last 7 Days' },
  { id: '30days', label: 'Last 30 Days' },
  { id: 'this_month', label: 'This Month' },
  { id: 'last_month', label: 'Last Month' },
  { id: 'custom', label: 'Custom' },
];

export const Analytics = () => {
  const { restaurant } = useAuth();

  const [period, setPeriod] = useState('7days');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);

  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [activeHoverPoint, setActiveHoverPoint] = useState(null);

  // Load analytics from backend API
  const loadAnalytics = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);

      const params = { period };
      if (period === 'custom' && customStart && customEnd) {
        params.startDate = customStart;
        params.endDate = customEnd;
      }

      const res = await fetchRestaurantAnalyticsApi(params);
      if (res?.success && res?.data) {
        setAnalyticsData(res.data);
      }
    } catch (err) {
      console.error('Failed to load restaurant analytics:', err);
      toast.error('Failed to load analytics. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period, customStart, customEnd]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  // Handle CSV Download
  const handleExportCSV = async () => {
    try {
      setExporting(true);
      const params = { period };
      if (period === 'custom' && customStart && customEnd) {
        params.startDate = customStart;
        params.endDate = customEnd;
      }

      const blob = await exportAnalyticsReportApi(params);
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'text/csv' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Craviti_Analytics_${period}_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Analytics CSV report downloaded.');
    } catch (err) {
      console.error('Export failed:', err);
      toast.error('Failed to export CSV report.');
    } finally {
      setExporting(false);
    }
  };

  // Handle Print/PDF
  const handlePrint = () => {
    window.print();
  };

  // Safe KPI calculations
  const totalRevenue = analyticsData?.totalRevenue ?? 0;
  const totalOrders = analyticsData?.totalOrders ?? 0;
  const averageOrderValue = analyticsData?.averageOrderValue ?? 0;
  const customersServed = analyticsData?.customersServed ?? 0;
  const activeTables = analyticsData?.activeTables ?? 0;
  const totalTables = analyticsData?.totalTables ?? 0;
  const todayRevenue = analyticsData?.todayRevenue ?? 0;
  const pendingOrders = analyticsData?.pendingOrders ?? 0;
  const completedOrders = analyticsData?.completedOrders ?? 0;
  const revenueGrowth = analyticsData?.revenueGrowth ?? 0;
  const ordersGrowth = analyticsData?.ordersGrowth ?? 0;
  const healthScore = analyticsData?.healthScore ?? 85;

  const salesTrend = analyticsData?.salesTrend || [];
  const topItems = analyticsData?.topItems || [];
  const categoryPerformance = analyticsData?.categoryPerformance || [];
  const peakHours = analyticsData?.peakHours || [];
  const topCustomers = analyticsData?.topCustomers || [];
  const paymentBreakdown = analyticsData?.paymentBreakdown || [];
  const discountAnalysis = analyticsData?.discountAnalysis || {};
  const tablePerformance = analyticsData?.tablePerformance || [];
  const recentOrders = analyticsData?.recentOrders || [];
  const mealTimeTrends = analyticsData?.mealTimeTrends || { Breakfast: 0, Lunch: 0, Dinner: 0, Night: 0 };
  const dailySummary = analyticsData?.dailySummary || {};
  const weeklySummary = analyticsData?.weeklySummary || {};
  const monthlySummary = analyticsData?.monthlySummary || {};

  // Compute SVG Trend Line Points
  const trendSvgPath = useMemo(() => {
    if (salesTrend.length < 2) return { path: '', area: '', points: [] };
    const maxVal = Math.max(...salesTrend.map((d) => d.revenue), 100);
    const width = 800;
    const height = 240;
    const paddingX = 40;
    const paddingY = 30;

    const points = salesTrend.map((d, i) => {
      const x = paddingX + (i / (salesTrend.length - 1)) * (width - 2 * paddingX);
      const y = height - paddingY - (d.revenue / maxVal) * (height - 2 * paddingY);
      return { x, y, ...d };
    });

    const pathD = points.reduce((acc, pt, i) => (i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`), '');
    const areaD = `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`;

    return { path: pathD, area: areaD, points };
  }, [salesTrend]);

  // Meal times calculation
  const totalMealOrders = useMemo(() => {
    return Object.values(mealTimeTrends).reduce((a, b) => a + b, 0) || 1;
  }, [mealTimeTrends]);

  // Categories total calculation
  const totalCategoryRevenue = useMemo(() => {
    return categoryPerformance.reduce((acc, curr) => acc + curr.revenue, 0) || 1;
  }, [categoryPerformance]);

  if (loading) {
    return <Loader fullScreen message="Aggregating live restaurant analytics..." />;
  }

  const isZeroData = totalOrders === 0 && totalRevenue === 0;

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight font-display">
              {analyticsData?.restaurantName || restaurant?.restaurantName || 'Restaurant'} Analytics
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-[#16A34A] text-xs font-bold border border-emerald-200/80">
              Live Production
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time metrics, sales intelligence, customer insights, and financial summaries.
          </p>
        </div>

        {/* Header Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Date Range Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl overflow-x-auto scrollbar-none">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  if (opt.id === 'custom') {
                    setIsCustomModalOpen(true);
                  } else {
                    setPeriod(opt.id);
                  }
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  period === opt.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Refresh Button */}
          <Button
            size="sm"
            variant="secondary"
            onClick={() => loadAnalytics(true)}
            disabled={refreshing}
            leftIcon={FiRefreshCw}
            className={refreshing ? 'animate-spin' : ''}
            title="Refresh analytics telemetry"
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>

          {/* Export Report CSV */}
          <Button
            size="sm"
            variant="secondary"
            onClick={handleExportCSV}
            disabled={exporting}
            leftIcon={FiDownload}
          >
            {exporting ? 'Exporting...' : 'Export CSV'}
          </Button>

          {/* Print / PDF */}
          <Button
            size="sm"
            variant="secondary"
            onClick={handlePrint}
            leftIcon={FiPrinter}
            className="hidden sm:inline-flex"
          >
            Print
          </Button>
        </div>
      </div>

      {/* Custom Date Range Modal */}
      {isCustomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 max-w-sm w-full space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Select Custom Date Range</h3>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase">Start Date</label>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#16A34A]"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase">End Date</label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#16A34A]"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button size="sm" variant="secondary" onClick={() => setIsCustomModalOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                variant="primary"
                onClick={() => {
                  if (!customStart || !customEnd) {
                    toast.error('Please select both start and end dates.');
                    return;
                  }
                  setPeriod('custom');
                  setIsCustomModalOpen(false);
                }}
              >
                Apply Range
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State Banner if completely 0 records */}
      {isZeroData && (
        <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-5 flex items-start gap-3.5">
          <FiAlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-amber-900">No analytics data recorded for this timeframe</h3>
            <p className="text-xs text-amber-700 mt-0.5">
              There are currently zero orders logged for the selected period ({analyticsData?.dateRange?.label || period}).
              Customer QR orders and walk-in counter sales will automatically populate charts and telemetry in real-time.
            </p>
          </div>
        </div>
      )}

      {/* 2. Key Performance Indicators (8 Cards Grid) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* Total Revenue */}
        <Card className="p-4 bg-white border border-slate-100 hover:border-slate-200 transition-all shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Revenue</span>
            <span className="w-8 h-8 rounded-xl bg-emerald-50 text-[#16A34A] flex items-center justify-center">
              <FiDollarSign className="w-4 h-4" />
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 mt-2 font-display">
            {formatCurrency(totalRevenue)}
          </p>
          <div className="flex items-center gap-1.5 mt-2">
            <span
              className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                revenueGrowth >= 0
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                  : 'bg-rose-50 text-rose-700 border border-rose-200/60'
              }`}
            >
              {revenueGrowth >= 0 ? <FiTrendingUp className="w-3 h-3" /> : <FiTrendingDown className="w-3 h-3" />}
              {Math.abs(revenueGrowth)}%
            </span>
            <span className="text-[10px] text-slate-400">vs previous period</span>
          </div>
        </Card>

        {/* Total Orders */}
        <Card className="p-4 bg-white border border-slate-100 hover:border-slate-200 transition-all shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Orders</span>
            <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FiShoppingBag className="w-4 h-4" />
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 mt-2 font-display">
            {totalOrders} <span className="text-xs font-normal text-slate-400">orders</span>
          </p>
          <div className="flex items-center gap-1.5 mt-2">
            <span
              className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                ordersGrowth >= 0
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                  : 'bg-rose-50 text-rose-700 border border-rose-200/60'
              }`}
            >
              {ordersGrowth >= 0 ? '+' : ''}{ordersGrowth}%
            </span>
            <span className="text-[10px] text-slate-400">order volume</span>
          </div>
        </Card>

        {/* Average Order Value (AOV) */}
        <Card className="p-4 bg-white border border-slate-100 hover:border-slate-200 transition-all shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Average Bill (AOV)</span>
            <span className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <FiTrendingUp className="w-4 h-4" />
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 mt-2 font-display">
            {formatCurrency(averageOrderValue)}
          </p>
          <p className="text-[10px] text-slate-400 mt-2">Revenue ÷ Total Orders</p>
        </Card>

        {/* Customers Served */}
        <Card className="p-4 bg-white border border-slate-100 hover:border-slate-200 transition-all shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Customers Served</span>
            <span className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <FiUsers className="w-4 h-4" />
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 mt-2 font-display">
            {customersServed} <span className="text-xs font-normal text-slate-400">guests</span>
          </p>
          <p className="text-[10px] text-slate-400 mt-2">Unique dining parties</p>
        </Card>

        {/* Active Tables Today */}
        <Card className="p-4 bg-white border border-slate-100 hover:border-slate-200 transition-all shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Tables</span>
            <span className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <MdOutlineTableRestaurant className="w-4 h-4" />
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 mt-2 font-display">
            {activeTables} <span className="text-xs font-normal text-slate-400">/ {totalTables} occupied</span>
          </p>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-teal-500 h-full rounded-full transition-all"
              style={{ width: `${totalTables > 0 ? (activeTables / totalTables) * 100 : 0}%` }}
            />
          </div>
        </Card>

        {/* Today's Revenue */}
        <Card className="p-4 bg-white border border-slate-100 hover:border-slate-200 transition-all shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Today's Revenue</span>
            <span className="w-8 h-8 rounded-xl bg-emerald-50 text-[#16A34A] flex items-center justify-center">
              <FiActivity className="w-4 h-4" />
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-[#16A34A] mt-2 font-display">
            {formatCurrency(todayRevenue)}
          </p>
          <p className="text-[10px] text-slate-400 mt-2">Real-time daily intake</p>
        </Card>

        {/* Pending Orders */}
        <Card className="p-4 bg-white border border-slate-100 hover:border-slate-200 transition-all shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Pending Orders</span>
            <span className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <FiClock className="w-4 h-4" />
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-amber-600 mt-2 font-display">
            {pendingOrders}
          </p>
          <p className="text-[10px] text-slate-400 mt-2">Placed & in preparation</p>
        </Card>

        {/* Completed Orders */}
        <Card className="p-4 bg-white border border-slate-100 hover:border-slate-200 transition-all shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Completed Orders</span>
            <span className="w-8 h-8 rounded-xl bg-emerald-50 text-[#16A34A] flex items-center justify-center">
              <FiCheckCircle className="w-4 h-4" />
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 mt-2 font-display">
            {completedOrders}
          </p>
          <p className="text-[10px] text-slate-400 mt-2">Successfully closed bills</p>
        </Card>
      </div>

      {/* 3. Main Row: Sales Trend Chart & Restaurant Health Score (with Three.js Orb) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Trend Interactive Curve (Takes 2 cols) */}
        <Card className="lg:col-span-2 p-5 bg-white border border-slate-100 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <FiTrendingUp className="w-4 h-4 text-[#16A34A]" />
                Sales & Revenue Trend
              </h2>
              <p className="text-xs text-slate-400">Interactive revenue distribution across timeline</p>
            </div>
            {activeHoverPoint && (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-900 text-white text-xs font-bold animate-fadeIn">
                <span>{activeHoverPoint.label}:</span>
                <span className="text-emerald-400">{formatCurrency(activeHoverPoint.revenue)}</span>
                <span className="text-slate-400 font-normal">({activeHoverPoint.orders} orders)</span>
              </div>
            )}
          </div>

          {/* SVG Line & Gradient Area Chart */}
          {salesTrend.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs">
              <FiActivity className="w-8 h-8 mb-2 text-slate-300" />
              <span>No sales data recorded for this time range yet.</span>
            </div>
          ) : (
            <div className="relative w-full overflow-hidden">
              <svg viewBox="0 0 800 240" className="w-full h-64 overflow-visible">
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#16A34A" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#16A34A" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Subtle horizontal grid lines */}
                <line x1="40" y1="30" x2="760" y2="30" stroke="#f1f5f9" strokeDasharray="4 4" />
                <line x1="40" y1="90" x2="760" y2="90" stroke="#f1f5f9" strokeDasharray="4 4" />
                <line x1="40" y1="150" x2="760" y2="150" stroke="#f1f5f9" strokeDasharray="4 4" />
                <line x1="40" y1="210" x2="760" y2="210" stroke="#e2e8f0" />

                {/* Area under curve */}
                {trendSvgPath.area && <path d={trendSvgPath.area} fill="url(#revenueGrad)" />}

                {/* Line Path */}
                {trendSvgPath.path && (
                  <path
                    d={trendSvgPath.path}
                    fill="none"
                    stroke="#16A34A"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Data Points */}
                {trendSvgPath.points.map((pt, idx) => (
                  <g
                    key={idx}
                    className="cursor-pointer group"
                    onMouseEnter={() => setActiveHoverPoint(pt)}
                    onMouseLeave={() => setActiveHoverPoint(null)}
                  >
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="5"
                      className="fill-white stroke-[#16A34A] stroke-[2.5] transition-transform group-hover:scale-150"
                    />
                    <text
                      x={pt.x}
                      y="230"
                      textAnchor="middle"
                      className="text-[9px] font-bold fill-slate-400 select-none"
                    >
                      {pt.label}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          )}
        </Card>

        {/* Restaurant Health Score (with Three.js Orb) */}
        <Card className="p-5 bg-white border border-slate-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                <FiActivity className="w-4 h-4 text-emerald-600" />
                Restaurant Health Score
              </h2>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Optimal
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Calculated from fulfillment, speed & efficiency</p>
          </div>

          {/* 3D Three.js Health Orb */}
          <div className="py-2 text-center relative">
            <ThreeHealthOrb score={healthScore} />
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-black text-slate-900 font-display">{healthScore}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">/ 100</span>
            </div>
          </div>

          {/* Sub-Metrics Breakdown */}
          <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
            <div className="flex justify-between items-center text-slate-600">
              <span>Order Success Rate</span>
              <span className="font-bold text-slate-900">
                {totalOrders > 0 ? `${Math.round((completedOrders / totalOrders) * 100)}%` : '100%'}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>Preparation Efficiency</span>
              <span className="font-bold text-emerald-600">Fast (Avg 15m)</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>Customer Satisfaction</span>
              <span className="font-bold text-slate-900">4.8 ★ / 5.0</span>
            </div>
          </div>
        </Card>
      </div>

      {/* 4. Second Row: Orders Trend by Meal Time & Category Performance Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Meal Time Breakdown Bar Chart */}
        <Card className="p-5 bg-white border border-slate-100 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <FiClock className="w-4 h-4 text-blue-600" />
                Orders by Dining Window
              </h2>
              <p className="text-xs text-slate-400">Breakfast, Lunch, Dinner & Late Night distribution</p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {[
              { time: 'Breakfast', icon: '🌅', range: '6 AM - 11 AM', count: mealTimeTrends.Breakfast || 0 },
              { time: 'Lunch', icon: '☀️', range: '11 AM - 4 PM', count: mealTimeTrends.Lunch || 0 },
              { time: 'Dinner', icon: '🌆', range: '4 PM - 10 PM', count: mealTimeTrends.Dinner || 0 },
              { time: 'Night', icon: '🌙', range: '10 PM - 6 AM', count: mealTimeTrends.Night || 0 },
            ].map((slot) => {
              const pct = Math.round((slot.count / totalMealOrders) * 100);
              return (
                <div key={slot.time} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <span>{slot.icon}</span>
                      <span>{slot.time}</span>
                      <span className="text-[10px] text-slate-400 font-normal">({slot.range})</span>
                    </span>
                    <span>
                      {slot.count} orders <span className="text-slate-400 font-normal">({pct}%)</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6 }}
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Category Performance */}
        <Card className="p-5 bg-white border border-slate-100 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <FiPieChart className="w-4 h-4 text-purple-600" />
                Category Performance
              </h2>
              <p className="text-xs text-slate-400">Revenue split across menu categories</p>
            </div>
          </div>

          {categoryPerformance.length === 0 ? (
            <div className="h-44 flex flex-col items-center justify-center text-slate-400 text-xs">
              <MdRestaurantMenu className="w-8 h-8 mb-2 text-slate-300" />
              <span>No category revenue recorded yet.</span>
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              {categoryPerformance.map((cat, idx) => {
                const pct = Math.round((cat.revenue / totalCategoryRevenue) * 100);
                const colors = ['bg-emerald-500', 'bg-purple-500', 'bg-blue-500', 'bg-amber-500', 'bg-rose-500'];
                const color = colors[idx % colors.length];

                return (
                  <div key={cat.category} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-slate-700">
                      <span>{cat.category}</span>
                      <span className="flex items-center gap-2">
                        <span className="text-slate-500 font-normal">{cat.orders} items</span>
                        <span className="text-slate-900">{formatCurrency(cat.revenue)}</span>
                        <span className="text-slate-400 font-normal">({pct}%)</span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* 5. Best Selling Items (Top 10) & Peak Operating Hours */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top 10 Best Sellers Table (2 cols) */}
        <Card className="lg:col-span-2 p-5 bg-white border border-slate-100 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <FiAward className="w-4 h-4 text-amber-500" />
                Top 10 Best-Selling Items
              </h2>
              <p className="text-xs text-slate-400">Most ordered dishes ranked by volume and revenue</p>
            </div>
          </div>

          {topItems.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <FiShoppingBag className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              No items sold in this period yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] tracking-wider">
                    <th className="pb-2.5 font-bold">Rank</th>
                    <th className="pb-2.5 font-bold">Item</th>
                    <th className="pb-2.5 font-bold text-right">Orders Sold</th>
                    <th className="pb-2.5 font-bold text-right">Total Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {topItems.map((item) => (
                    <tr key={item.rank} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 font-black">
                        <span
                          className={`w-5 h-5 rounded-md inline-flex items-center justify-center text-[10px] ${
                            item.rank === 1
                              ? 'bg-amber-100 text-amber-800 font-extrabold'
                              : item.rank === 2
                              ? 'bg-slate-200 text-slate-800'
                              : item.rank === 3
                              ? 'bg-amber-50 text-amber-700'
                              : 'text-slate-400'
                          }`}
                        >
                          #{item.rank}
                        </span>
                      </td>
                      <td className="py-2.5 font-bold text-slate-800">
                        <div className="flex items-center gap-1.5">
                          <FoodTypeBadge type={item.foodType} size="sm" />
                          <span className="truncate max-w-[200px]">{item.name}</span>
                        </div>
                      </td>
                      <td className="py-2.5 text-right font-medium text-slate-600">{item.orders}</td>
                      <td className="py-2.5 text-right font-extrabold text-[#16A34A]">
                        {formatCurrency(item.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Peak Operating Hours */}
        <Card className="p-5 bg-white border border-slate-100 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <FiClock className="w-4 h-4 text-emerald-600" />
                Peak Operating Hours
              </h2>
              <p className="text-xs text-slate-400">Order traffic across the day</p>
            </div>
          </div>

          <div className="space-y-2 pt-2 max-h-80 overflow-y-auto pr-1 scrollbar-none">
            {peakHours.map((slot) => {
              const maxHourOrders = Math.max(...peakHours.map((h) => h.orders), 1);
              const pct = Math.round((slot.orders / maxHourOrders) * 100);
              const isPeak = pct >= 80 && slot.orders > 0;

              return (
                <div key={slot.hour} className="flex items-center gap-2 text-xs">
                  <span className="w-14 text-[11px] font-bold text-slate-500 shrink-0">{slot.label}</span>
                  <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isPeak ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-12 text-right text-[11px] font-semibold text-slate-700 shrink-0">
                    {slot.orders} <span className="text-[9px] text-slate-400 font-normal">ord</span>
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* 6. Third Row: Top Customers, Payment Breakdown & Discount Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Top Customers Leaderboard */}
        <Card className="p-5 bg-white border border-slate-100 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <FiUsers className="w-4 h-4 text-blue-600" />
                Top Customers
              </h2>
              <p className="text-xs text-slate-400">Loyal dining guests</p>
            </div>
          </div>

          {topCustomers.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">No customer orders recorded yet.</div>
          ) : (
            <div className="space-y-2.5">
              {topCustomers.slice(0, 5).map((cust, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-slate-50/70 border border-slate-100 text-xs">
                  <div>
                    <p className="font-bold text-slate-900">{cust.customer}</p>
                    <p className="text-[10px] text-slate-400">{cust.orders} visits • Avg {formatCurrency(cust.averageBill)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-extrabold text-slate-900">{formatCurrency(cust.spent)}</p>
                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-200/60">
                      ★ {cust.loyaltyPoints} pts
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Payment Breakdown */}
        <Card className="p-5 bg-white border border-slate-100 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <FiCreditCard className="w-4 h-4 text-emerald-600" />
                Payment Breakdown
              </h2>
              <p className="text-xs text-slate-400">Cash vs Online vs UPI collection</p>
            </div>
          </div>

          {paymentBreakdown.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">No settled payments yet.</div>
          ) : (
            <div className="space-y-3 pt-1">
              {paymentBreakdown.map((pm) => {
                const totalPayRev = paymentBreakdown.reduce((a, b) => a + b.revenue, 0) || 1;
                const pct = Math.round((pm.revenue / totalPayRev) * 100);

                return (
                  <div key={pm.method} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-slate-700">
                      <span>{pm.method === 'ONLINE' ? '💳 Pay Online' : pm.method === 'CASH' ? '💵 Pay Cash' : pm.method}</span>
                      <span>
                        {formatCurrency(pm.revenue)} <span className="text-slate-400 font-normal">({pct}%)</span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          pm.method === 'ONLINE' ? 'bg-indigo-600' : 'bg-[#16A34A]'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Discount Analysis */}
        <Card className="p-5 bg-white border border-slate-100 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <FiPercent className="w-4 h-4 text-rose-500" />
                Discount Analysis
              </h2>
              <p className="text-xs text-slate-400">Promo codes and bill concessions</p>
            </div>
          </div>

          <div className="space-y-3 text-xs pt-1">
            <div className="flex justify-between items-center p-2 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-500">Total Discounts</span>
              <span className="font-black text-rose-600">{formatCurrency(discountAnalysis.totalDiscounts)}</span>
            </div>
            <div className="flex justify-between items-center p-2 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-500">Average Discount</span>
              <span className="font-bold text-slate-900">{formatCurrency(discountAnalysis.avgDiscount)}</span>
            </div>
            <div className="flex justify-between items-center p-2 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-500">Discounted Orders</span>
              <span className="font-bold text-slate-900">{discountAnalysis.discountedOrders || 0} orders</span>
            </div>
            <div className="flex justify-between items-center p-2 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-500">Revenue Lost</span>
              <span className="font-bold text-slate-900">{formatCurrency(discountAnalysis.revenueLost)}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* 7. Table Performance & Daily/Weekly/Monthly Summaries */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table Performance (Takes 2 cols) */}
        <Card className="lg:col-span-2 p-5 bg-white border border-slate-100 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <MdOutlineTableRestaurant className="w-4 h-4 text-emerald-600" />
                Table Performance
              </h2>
              <p className="text-xs text-slate-400">Order count, revenue & occupancy time per table</p>
            </div>
          </div>

          {tablePerformance.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">No table orders recorded yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] tracking-wider">
                    <th className="pb-2.5 font-bold">Table</th>
                    <th className="pb-2.5 font-bold">Total Orders</th>
                    <th className="pb-2.5 font-bold text-right">Avg Bill</th>
                    <th className="pb-2.5 font-bold text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {tablePerformance.map((tbl) => (
                    <tr key={tbl.tableNumber} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 font-bold text-slate-800">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-extrabold text-[11px]">
                          Table {tbl.tableNumber}
                        </span>
                      </td>
                      <td className="py-2.5 font-medium text-slate-600">{tbl.orders} orders</td>
                      <td className="py-2.5 text-right font-medium text-slate-600">
                        {formatCurrency(tbl.averageBill)}
                      </td>
                      <td className="py-2.5 text-right font-extrabold text-[#16A34A]">
                        {formatCurrency(tbl.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Financial Summaries: Daily, Weekly, Monthly */}
        <Card className="p-5 bg-white border border-slate-100 space-y-4">
          <div>
            <h2 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <FiLayers className="w-4 h-4 text-indigo-600" />
              Financial Summaries
            </h2>
            <p className="text-xs text-slate-400">Aggregated operating summaries</p>
          </div>

          <div className="space-y-3">
            {/* Daily */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
              <div className="flex justify-between items-center font-bold text-slate-900">
                <span>Daily Summary</span>
                <span className="text-[#16A34A]">{formatCurrency(dailySummary.revenue)}</span>
              </div>
              <p className="text-[10px] text-slate-400">
                {dailySummary.orders} orders • Avg {formatCurrency(dailySummary.avgBill)}
              </p>
            </div>

            {/* Weekly */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
              <div className="flex justify-between items-center font-bold text-slate-900">
                <span>Weekly Summary</span>
                <span className="text-[#16A34A]">{formatCurrency(weeklySummary.revenue)}</span>
              </div>
              <p className="text-[10px] text-slate-400">
                {weeklySummary.orders} orders • Growth: {weeklySummary.growth >= 0 ? '+' : ''}{weeklySummary.growth}%
              </p>
            </div>

            {/* Monthly */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
              <div className="flex justify-between items-center font-bold text-slate-900">
                <span>Monthly Summary</span>
                <span className="text-[#16A34A]">{formatCurrency(monthlySummary.revenue)}</span>
              </div>
              <p className="text-[10px] text-slate-400">
                Net Earnings: {formatCurrency(monthlySummary.netEarnings)} • Taxes: {formatCurrency(monthlySummary.taxes)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* 8. Recent 10 Orders Table */}
      <Card className="p-5 bg-white border border-slate-100 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <FiShoppingBag className="w-4 h-4 text-emerald-600" />
              Latest 10 Orders
            </h2>
            <p className="text-xs text-slate-400">Most recent dining transactions</p>
          </div>
        </div>

        {recentOrders.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">No recent orders found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] tracking-wider">
                  <th className="pb-2.5 font-bold">Order ID</th>
                  <th className="pb-2.5 font-bold">Table</th>
                  <th className="pb-2.5 font-bold">Customer</th>
                  <th className="pb-2.5 font-bold">Status</th>
                  <th className="pb-2.5 font-bold">Payment</th>
                  <th className="pb-2.5 font-bold text-right">Amount</th>
                  <th className="pb-2.5 font-bold text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentOrders.map((ord) => (
                  <tr key={ord.orderId} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 font-extrabold text-slate-900">{ord.orderId}</td>
                    <td className="py-2.5 font-bold text-slate-700">Table {ord.tableNumber}</td>
                    <td className="py-2.5 font-medium text-slate-600">{ord.customerName}</td>
                    <td className="py-2.5">
                      <StatusBadge status={ord.status} />
                    </td>
                    <td className="py-2.5">
                      <span className="capitalize text-[11px] font-semibold text-slate-600">
                        {ord.paymentMethod}
                      </span>
                    </td>
                    <td className="py-2.5 text-right font-extrabold text-[#16A34A]">
                      {formatCurrency(ord.amount)}
                    </td>
                    <td className="py-2.5 text-right text-slate-400 font-medium">
                      {formatDate(ord.time)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Analytics;
