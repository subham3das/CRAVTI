import { useState, useEffect, useCallback, useMemo } from 'react';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/Card';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { Button } from '../components/Button';
import { Table } from '../components/Table';
import { Loader } from '../components/Loader';
import { formatCurrency, safeNumber } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import { fetchDashboardApi } from '../services/dashboardService';
import {
  FiShoppingBag,
  FiClock,
  FiCheckCircle,
  FiDollarSign,
  FiArrowUpRight,
  FiTrendingUp,
  FiPlus,
  FiAlertCircle,
  FiArrowRight,
  FiBookOpen,
  FiLayers,
  FiStar,
  FiSquare,
  FiActivity,
  FiShield,
  FiRefreshCw,
} from 'react-icons/fi';
import { MdQrCode2, MdOutlineDinnerDining } from 'react-icons/md';

/**
 * Format timestamp into relative elapsed time ("5m ago", "Just now", etc.)
 */
const formatRelativeTime = (dateStr) => {
  if (!dateStr) return '--';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '--';
  const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const Dashboard = () => {
  const navigate = useNavigate();
  const { restaurant } = useAuth();

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load live production metrics from GET /api/dashboard
  const loadDashboard = useCallback(async (isBackground = false) => {
    try {
      if (!isBackground) {
        setLoading((prev) => (dashboardData ? false : true));
      } else {
        setRefreshing(true);
      }

      const res = await fetchDashboardApi();
      if (res?.success && res?.data) {
        setDashboardData(res.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dashboardData]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Real-time zero-polling synchronization via Socket.IO
  useEffect(() => {
    const restaurantId = restaurant?._id || dashboardData?.restaurant?._id;
    if (!restaurantId) return;

    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';
    const socket = io(backendUrl, { transports: ['websocket', 'polling'] });

    socket.emit('join-restaurant', restaurantId);

    const onOrderOrSyncUpdate = () => {
      loadDashboard(true);
    };

    socket.on('new-order', onOrderOrSyncUpdate);
    socket.on('order.created', onOrderOrSyncUpdate);
    socket.on('status-updated', onOrderOrSyncUpdate);
    socket.on('order.updated', onOrderOrSyncUpdate);
    socket.on('payment-updated', onOrderOrSyncUpdate);
    socket.on('restaurant.updated', onOrderOrSyncUpdate);

    return () => {
      socket.disconnect();
    };
  }, [restaurant?._id, dashboardData?.restaurant?._id, loadDashboard]);

  // Extract sections defensively
  const overview = dashboardData?.overview;
  const kitchen = dashboardData?.kitchen;
  const menu = dashboardData?.menu;
  const tables = dashboardData?.tables;
  const profile = dashboardData?.profile;
  const settlement = dashboardData?.settlement;
  const recentOrders = dashboardData?.recentOrders || [];
  const popularItems = dashboardData?.popularItems || [];
  const hourlyTraffic = dashboardData?.hourlyTraffic || [];

  const restaurantName =
    dashboardData?.restaurant?.restaurantName ||
    restaurant?.restaurantName ||
    'Restaurant';

  const isPaymentEnabled =
    dashboardData?.restaurant?.paymentEnabled ??
    restaurant?.paymentEnabled ??
    false;

  const completionPercentage = profile?.percentage ?? 40;

  // Dynamic KPI Cards
  const kpiCards = useMemo(() => [
    {
      title: "Today's Orders",
      value: safeNumber(overview?.todayOrders, 0),
      change: overview?.growth?.ordersChange || '0% from yesterday',
      icon: FiShoppingBag,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      title: 'Pending Orders',
      value: safeNumber(overview?.pendingOrders, 0),
      change:
        safeNumber(overview?.pendingOrders, 0) > 0
          ? 'Requires attention'
          : 'All orders clear',
      icon: FiClock,
      color: 'text-[#F59E0B]',
      bg: 'bg-amber-50',
    },
    {
      title: 'Completed Orders',
      value: safeNumber(overview?.completedOrders, 0),
      change: `${safeNumber(overview?.completionRate, 0)}% completion rate`,
      icon: FiCheckCircle,
      color: 'text-[#22C55E]',
      bg: 'bg-green-50',
    },
    {
      title: 'Today Revenue',
      value: formatCurrency(overview?.todayRevenue || 0),
      change: overview?.growth?.revenueChange || '0% vs yesterday',
      icon: FiDollarSign,
      color: 'text-[#16A34A]',
      bg: 'bg-emerald-50',
    },
  ], [overview]);

  // Columns for Recent Orders Table
  const columns = useMemo(() => [
    {
      header: 'Order ID',
      accessor: 'id',
      cell: (row) => <span className="font-semibold text-slate-900">{row.id}</span>,
    },
    {
      header: 'Table / Type',
      accessor: 'table',
      cell: (row) => <span className="text-slate-600 font-medium">{row.table}</span>,
    },
    {
      header: 'Items',
      accessor: 'items',
      className: 'max-w-[200px] truncate text-slate-500',
    },
    {
      header: 'Amount',
      accessor: 'total',
      cell: (row) => <span className="font-semibold text-slate-900">{formatCurrency(row.total)}</span>,
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (row) => <StatusBadge status={row.status} size="sm" />,
    },
    {
      header: 'Time',
      accessor: 'time',
      className: 'text-slate-400 text-xs font-medium',
      cell: (row) => formatRelativeTime(row.time || row.createdAt),
    },
  ], []);

  if (loading && !dashboardData) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-3">
        <Loader size="lg" message="Loading live restaurant dashboard..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Settlement Verification Status Card (Phase 4.1 Live DB Integration) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="flex items-start gap-4">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
              settlement?.status === 'approved'
                ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                : settlement?.status === 'submitted' || settlement?.status === 'under_review'
                ? 'bg-blue-50 text-blue-600 border-blue-100'
                : settlement?.status === 'changes_requested'
                ? 'bg-amber-50 text-amber-600 border-amber-100'
                : settlement?.status === 'rejected'
                ? 'bg-rose-50 text-rose-600 border-rose-100'
                : 'bg-slate-50 text-slate-500 border-slate-200'
            }`}
          >
            <FiShield className="w-5 h-5" />
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h3 className="text-sm font-bold text-slate-900">Settlement Verification</h3>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                  settlement?.status === 'approved'
                    ? 'bg-emerald-100 text-emerald-800'
                    : settlement?.status === 'submitted' || settlement?.status === 'under_review'
                    ? 'bg-blue-100 text-blue-800'
                    : settlement?.status === 'changes_requested'
                    ? 'bg-amber-100 text-amber-800'
                    : settlement?.status === 'rejected'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {settlement?.status === 'approved' && 'Approved & Active'}
                {(settlement?.status === 'submitted' || settlement?.status === 'under_review') &&
                  `Under Review (v${settlement?.version || 1})`}
                {settlement?.status === 'changes_requested' && 'Changes Requested'}
                {settlement?.status === 'rejected' && 'Rejected'}
                {(!settlement?.status || settlement?.status === 'draft') && 'Draft / Incomplete'}
              </span>
            </div>

            <p className="text-xs text-slate-500">
              {settlement?.status === 'approved' &&
                'Daily order revenues settle automatically into your verified merchant account.'}
              {(settlement?.status === 'submitted' || settlement?.status === 'under_review') &&
                'Your settlement documents are being verified by compliance officers. Turnaround 24-48 hrs.'}
              {settlement?.status === 'changes_requested' &&
                'Compliance requested revisions. Click below to inspect admin notes and resubmit.'}
              {settlement?.status === 'rejected' &&
                'Bank verification was not approved. Review reasons and submit corrected documents.'}
              {(!settlement?.status || settlement?.status === 'draft') &&
                'Connect your bank account and upload cancelled cheque to activate payouts.'}
            </p>

            {/* Live Bank Metadata */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-[11px] text-slate-400">
              {settlement?.bankName && (
                <span>
                  Bank: <strong className="text-slate-600 font-medium">{settlement.bankName}</strong>{' '}
                  {settlement.accountNumberMasked}
                </span>
              )}
              {settlement?.submittedAt && (
                <span>
                  Submitted:{' '}
                  <strong className="text-slate-600 font-medium">
                    {new Date(settlement.submittedAt).toLocaleDateString()}
                  </strong>
                </span>
              )}
              {settlement?.approvedAt && (
                <span>
                  Approved:{' '}
                  <strong className="text-slate-600 font-medium">
                    {new Date(settlement.approvedAt).toLocaleDateString()}
                  </strong>
                </span>
              )}
              {settlement?.approvedByName && (
                <span>
                  Officer:{' '}
                  <strong className="text-slate-600 font-medium">{settlement.approvedByName}</strong>
                </span>
              )}
              {settlement?.updatedAt && (
                <span>
                  Updated:{' '}
                  <strong className="text-slate-600 font-medium">
                    {new Date(settlement.updatedAt).toLocaleDateString()}
                  </strong>
                </span>
              )}
            </div>

            {/* Reason callout if changes requested or rejected */}
            {(settlement?.changeRequestReason || settlement?.rejectionReason) && (
              <div className="mt-2 p-2.5 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 font-medium">
                <strong>Reason:</strong> {settlement.changeRequestReason || settlement.rejectionReason}
              </div>
            )}
          </div>
        </div>

        <div className="shrink-0 pt-2 lg:pt-0">
          <Button
            size="sm"
            variant={settlement?.status === 'approved' ? 'outline' : 'primary'}
            rightIcon={FiArrowRight}
            onClick={() => navigate('/settings?tab=settlement')}
            className={settlement?.status === 'approved' ? '' : 'bg-[#16A34A] hover:bg-[#15803D] text-white'}
          >
            {settlement?.status === 'approved' && 'View Bank Details'}
            {(settlement?.status === 'submitted' || settlement?.status === 'under_review') &&
              'View Status'}
            {settlement?.status === 'changes_requested' && 'Make Corrections'}
            {settlement?.status === 'rejected' && 'Review & Re-apply'}
            {(!settlement?.status || settlement?.status === 'draft') && 'Setup Bank Account'}
          </Button>
        </div>
      </div>

      {/* Payment Activation Banner (Dynamic Profile Completion) */}
      {!isPaymentEnabled && (
        <div className="bg-white rounded-xl border border-amber-200 p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-[#F59E0B] flex items-center justify-center shrink-0 border border-amber-100">
              <FiAlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900">
                Complete your profile to enable online payments.
              </h4>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs text-slate-500">
                  Profile completion: <strong className="text-slate-700">{completionPercentage}%</strong>
                  {profile?.missing?.length > 0 && (
                    <span className="hidden md:inline text-slate-400 ml-1">
                      (Pending: {profile.missing.slice(0, 3).join(', ')}{profile.missing.length > 3 ? '...' : ''})
                    </span>
                  )}
                </span>
                <div className="w-28 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-[#16A34A] h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
          <Button
            size="sm"
            variant="primary"
            rightIcon={FiArrowRight}
            onClick={() => navigate('/profile')}
            className="shrink-0 self-start sm:self-auto"
          >
            Complete Profile
          </Button>
        </div>
      )}

      {/* Header */}
      <PageHeader
        title={`${restaurantName} Overview`}
        description="Monitor today's live orders, kitchen status, and store sales."
        actions={
          <div className="flex items-center gap-2">
            <Button
              size="md"
              variant="outline"
              leftIcon={FiRefreshCw}
              isLoading={refreshing}
              onClick={() => loadDashboard(true)}
              className="text-xs"
            >
              Refresh
            </Button>
            <Button
              size="md"
              variant="primary"
              leftIcon={FiPlus}
              onClick={() => navigate('/orders')}
            >
              Manage Live Orders
            </Button>
          </div>
        }
      />

      {/* KPI Cards Grid (Dynamic from MongoDB) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between"
            >
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  {kpi.title}
                </p>
                <h3 className="text-2xl font-bold text-slate-900 leading-tight">
                  {kpi.value}
                </h3>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <FiArrowUpRight className="w-3.5 h-3.5 text-[#16A34A]" />
                  <span>{kpi.change}</span>
                </p>
              </div>
              <div className={`w-12 h-12 rounded-xl ${kpi.bg} flex items-center justify-center shrink-0`}>
                <Icon className={`w-6 h-6 ${kpi.color}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Order Operations (Requirement 18 - Real DB Metrics) */}
      <Card
        title="Live Kitchen Operations & Order Metrics"
        subtitle="Real-time synchronized order flow directly from QR table scans"
        action={
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Socket
            </span>
            <Button
              size="sm"
              variant="primary"
              rightIcon={FiArrowRight}
              onClick={() => navigate('/orders')}
            >
              Open Live Orders
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          <div
            onClick={() => navigate('/orders')}
            className="p-4 rounded-xl border border-blue-100 bg-blue-50/40 hover:bg-blue-50/70 transition-all cursor-pointer flex items-center gap-3.5"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-100/70 text-blue-600 flex items-center justify-center shrink-0 shadow-xs">
              <FiActivity className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Active Orders</p>
              <p className="text-2xl font-bold text-slate-900 leading-tight">
                {safeNumber(kitchen?.activeOrders, 0)}
              </p>
            </div>
          </div>

          <div
            onClick={() => navigate('/orders')}
            className="p-4 rounded-xl border border-purple-100 bg-purple-50/40 hover:bg-purple-50/70 transition-all cursor-pointer flex items-center gap-3.5"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-100/70 text-purple-600 flex items-center justify-center shrink-0 shadow-xs">
              <MdOutlineDinnerDining className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Served</p>
              <p className="text-2xl font-bold text-purple-600 leading-tight">
                {safeNumber(kitchen?.served, 0)}
              </p>
            </div>
          </div>

          <div
            onClick={() => navigate('/orders')}
            className="p-4 rounded-xl border border-rose-100 bg-rose-50/40 hover:bg-rose-50/70 transition-all cursor-pointer flex items-center gap-3.5"
          >
            <div className="w-10 h-10 rounded-xl bg-rose-100/70 text-rose-600 flex items-center justify-center shrink-0 shadow-xs">
              <FiDollarSign className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Pending Cash</p>
              <p className="text-2xl font-bold text-rose-600 leading-tight">
                {safeNumber(kitchen?.pendingCash, 0)}
              </p>
            </div>
          </div>

          <div
            onClick={() => navigate('/orders')}
            className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/40 hover:bg-emerald-50/70 transition-all cursor-pointer flex items-center gap-3.5"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-100/70 text-[#16A34A] flex items-center justify-center shrink-0 shadow-xs">
              <FiClock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Avg Prep Time</p>
              <p className="text-2xl font-bold text-slate-900 leading-tight">
                {safeNumber(kitchen?.avgPreparationTime, 0)}m
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Menu Management Summary Metrics Bar */}
      <Card
        title="Live Menu Catalog Overview"
        subtitle="Quick snapshot of items, active categories, and stock status"
        action={
          <Button
            size="sm"
            variant="secondary"
            rightIcon={FiArrowRight}
            onClick={() => navigate('/menu')}
          >
            Manage Menu
          </Button>
        }
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            onClick={() => navigate('/menu')}
            className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/60 hover:bg-slate-100/60 transition-colors cursor-pointer flex items-center gap-3"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-[#16A34A] flex items-center justify-center shrink-0">
              <FiBookOpen className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase">Total Dishes</p>
              <p className="text-lg font-bold text-slate-900 leading-tight">
                {safeNumber(menu?.totalItems, 0)}
              </p>
            </div>
          </div>

          <div
            onClick={() => navigate('/categories')}
            className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/60 hover:bg-slate-100/60 transition-colors cursor-pointer flex items-center gap-3"
          >
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <FiLayers className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase">Categories</p>
              <p className="text-lg font-bold text-slate-900 leading-tight">
                {safeNumber(menu?.categoriesCount, 0)}
              </p>
            </div>
          </div>

          <div
            onClick={() => navigate('/menu')}
            className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/60 hover:bg-slate-100/60 transition-colors cursor-pointer flex items-center gap-3"
          >
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
              <FiStar className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase">Popular Items</p>
              <p className="text-lg font-bold text-slate-900 leading-tight">
                {safeNumber(menu?.popularCount, 0)}
              </p>
            </div>
          </div>

          <div
            onClick={() => navigate('/menu')}
            className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/60 hover:bg-slate-100/60 transition-colors cursor-pointer flex items-center gap-3"
          >
            <div className="w-9 h-9 rounded-lg bg-red-50 text-red-500 flex items-center justify-center shrink-0">
              <FiAlertCircle className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase">Out Of Stock</p>
              <p className="text-lg font-bold text-slate-900 leading-tight">
                {safeNumber(menu?.outOfStockCount, 0)}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Table Stats Card */}
      <Card
        title="Tables & QR Overview"
        subtitle="Live dining floor status and QR code coverage"
        action={
          <Button
            size="sm"
            variant="secondary"
            rightIcon={FiArrowRight}
            onClick={() => navigate('/tables')}
          >
            Manage Tables
          </Button>
        }
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Tables', value: safeNumber(tables?.total, 0), icon: FiSquare, color: 'text-slate-700', bg: 'bg-slate-50', path: '/tables' },
            { label: 'Available', value: safeNumber(tables?.available, 0), icon: FiSquare, color: 'text-green-600', bg: 'bg-green-50', path: '/tables' },
            { label: 'Occupied', value: safeNumber(tables?.occupied, 0), icon: FiShoppingBag, color: 'text-red-500', bg: 'bg-red-50', path: '/tables' },
            { label: 'QR Generated', value: safeNumber(tables?.qrGenerated, 0), icon: MdQrCode2, color: 'text-[#16A34A]', bg: 'bg-emerald-50', path: '/qr-codes' },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.label}
                onClick={() => navigate(s.path)}
                className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/60 hover:bg-slate-100/60 transition-colors cursor-pointer flex items-center gap-3"
              >
                <div className={`w-9 h-9 rounded-lg ${s.bg} ${s.color} flex items-center justify-center shrink-0`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase">{s.label}</p>
                  <p className="text-lg font-bold text-slate-900 leading-tight">{s.value}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Middle Section: Sales Chart & Live Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card
          title="Sales & Orders Trend"
          subtitle="Hourly order distribution for today"
          className="lg:col-span-2"
          action={
            <span className="text-xs font-medium text-[#16A34A] bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 flex items-center gap-1">
              <FiTrendingUp className="w-3.5 h-3.5" />
              Live Analytics
            </span>
          }
        >
          <div className="h-64 flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-lg p-6 bg-slate-50/50 text-center">
            <div className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[#16A34A] mb-3 shadow-sm">
              <FiTrendingUp className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-slate-800">Hourly Revenue Curve</h4>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              Order traffic and revenue analytics update dynamically with live customer checkouts.
            </p>

            {hourlyTraffic.length > 0 ? (
              <div className="w-full max-w-md flex items-end justify-between gap-2 h-24 mt-6 pt-4 border-t border-slate-200">
                {hourlyTraffic.map((bar, i) => (
                  <div
                    key={i}
                    className="flex-1 flex flex-col items-center gap-1 h-full justify-end"
                    title={`${bar.hour}: ${bar.count} orders`}
                  >
                    <div
                      style={{ height: `${bar.heightPercent}%` }}
                      className={`w-full rounded-t transition-all ${
                        bar.count > 0 ? 'bg-[#16A34A] hover:bg-emerald-600' : 'bg-slate-200/60 hover:bg-slate-300'
                      }`}
                    />
                    <span className="text-[9px] text-slate-400 font-mono">{bar.hour}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="w-full text-center pt-6 text-xs text-slate-400 border-t border-slate-200 mt-6">
                No orders recorded yet today
              </div>
            )}
          </div>
        </Card>

        {/* Quick Shortcut Card & Popular Dishes */}
        <div className="space-y-6">
          <Card title="Quick Action Center" subtitle="Direct store management controls">
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start text-xs font-semibold"
                leftIcon={FiPlus}
                onClick={() => navigate('/menu')}
              >
                Add New Menu Item
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start text-xs font-semibold"
                leftIcon={FiLayers}
                onClick={() => navigate('/categories')}
              >
                Configure Categories
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start text-xs font-semibold"
                leftIcon={FiClock}
                onClick={() => navigate('/orders')}
              >
                View Kitchen Orders
              </Button>
            </div>
          </Card>

          {/* Top Selling Dishes Snapshot */}
          <Card title="Top Selling Dishes" subtitle="Real sales volume from completed orders">
            {popularItems.length > 0 ? (
              <div className="space-y-2.5">
                {popularItems.slice(0, 3).map((item) => (
                  <div key={item._id} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    <div className="truncate pr-2">
                      <p className="font-bold text-slate-800 truncate">{item.name}</p>
                      <p className="text-[10px] text-slate-400">{item.quantitySold} units sold</p>
                    </div>
                    <span className="font-extrabold text-[#16A34A] shrink-0">{formatCurrency(item.revenue)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic py-2 text-center">No dishes sold yet</p>
            )}
          </Card>
        </div>
      </div>

      {/* Recent Orders Card (100% Real Live Database Data) */}
      <Card
        title="Recent Live Orders"
        subtitle="Real-time incoming customer table and takeaway orders"
        action={
          <Button
            size="sm"
            variant="secondary"
            onClick={() => navigate('/orders')}
          >
            View All Orders
          </Button>
        }
      >
        <Table
          columns={columns}
          data={recentOrders}
          emptyTitle="No Orders Today"
          emptyDescription="Live customer table orders scanned via QR will appear here automatically."
          onRowClick={() => navigate('/orders')}
        />
      </Card>
    </div>
  );
};
