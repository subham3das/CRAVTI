import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FiArrowLeft,
  FiCheckCircle,
  FiSlash,
  FiDollarSign,
  FiShoppingBag,
  FiTrendingUp,
  FiClock,
  FiMapPin,
  FiPhone,
  FiMail,
  FiUser,
  FiCalendar,
  FiCopy,
  FiExternalLink,
  FiFileText,
  FiDownload,
  FiShield,
  FiSliders,
  FiLayers,
  FiList,
  FiCreditCard,
  FiAlertTriangle,
  FiAlertCircle,
  FiSearch,
  FiEye,
} from 'react-icons/fi';
import { MdQrCodeScanner } from 'react-icons/md';
import {
  fetchRestaurantDetailsFullApi,
  updateRestaurantVerificationApi,
  updateRestaurantBankStatusApi,
  fetchRestaurantBankDetailsFullApi,
  approveRestaurantBankDetailsApi,
  rejectRestaurantBankDetailsApi,
  requestChangesRestaurantBankDetailsApi,
  executeRestaurantQuickActionApi,
  fetchRestaurantMenuFullApi,
  fetchRestaurantTablesFullApi,
  fetchRestaurantOrdersFullApi,
  fetchRestaurantAnalyticsFullApi,
  fetchRestaurantTimelineApi,
  updateRestaurantAdminSettingsApi,
  impersonateRestaurantSupportApi,
} from '../services/adminService';
import { formatDate, safeString, safeNumber, formatCurrency } from '../utils/formatters';
import { VERIFICATION_BADGES, VERIFICATION_STATUS, BANK_STATUS } from '../constants';
import { generateReceiptPdf, RECEIPT_TEMPLATES } from '../utils/receiptGenerator';
import { TableSkeleton, Skeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import { ConfirmModal } from '../components/ConfirmModal';
import toast from 'react-hot-toast';

export const RestaurantDetails = () => {
  const { restaurantId } = useParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  // Tab-specific state
  const [menuData, setMenuData] = useState({ categories: [], items: [], loading: false, search: '', filterType: 'all' });
  const [tablesData, setTablesData] = useState({ tables: [], loading: false });
  const [ordersData, setOrdersData] = useState({ orders: [], loading: false, filter: 'all', search: '', page: 1, pagination: {} });
  const [analyticsData, setAnalyticsData] = useState({ stats: null, loading: false });
  const [timelineData, setTimelineData] = useState({ timeline: [], loading: false });
  const [bankDetailsData, setBankDetailsData] = useState({ data: null, loading: false });
  const [bankActionModal, setBankActionModal] = useState({
    open: false,
    action: null, // 'approve' | 'reject' | 'request_changes'
    reason: '',
    submitting: false,
  });
  const [bankDocPreview, setBankDocPreview] = useState(null);

  // Verification form state
  const [verifyForm, setVerifyForm] = useState({
    reviewNotes: '',
    rejectionReason: '',
    requestedChanges: '',
    submitting: false,
  });

  // Settings form state
  const [adminSettings, setAdminSettings] = useState({
    qrEnabled: true,
    paymentEnabled: true,
    maintenanceMode: false,
    isDeleted: false,
    receiptFooter: '',
    submitting: false,
  });

  // Modals
  const [quickActionModal, setQuickActionModal] = useState({ open: false, action: '', title: '', message: '', reason: '' });
  const [supportModal, setSupportModal] = useState(false);

  // Load Main Restaurant Details
  const loadRestaurantDetails = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchRestaurantDetailsFullApi(restaurantId);
      if (res.success && res.data) {
        setData(res.data);
        const rest = res.data.restaurant || {};
        const sett = res.data.settings || {};
        setAdminSettings({
          qrEnabled: rest.qrEnabled !== false,
          paymentEnabled: Boolean(rest.paymentEnabled),
          maintenanceMode: Boolean(sett.maintenanceMode),
          isDeleted: Boolean(rest.isDeleted),
          receiptFooter: sett.receiptFooter || '',
          submitting: false,
        });
      } else {
        toast.error('Failed to load restaurant details');
      }
    } catch (err) {
      console.error('Error fetching restaurant details:', err);
      toast.error('Restaurant not found or access denied');
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    loadRestaurantDetails();
  }, [loadRestaurantDetails]);

  // Load tab-specific data on demand
  useEffect(() => {
    if (!restaurantId) return;

    if (activeTab === 'menu' && menuData.items.length === 0 && !menuData.loading) {
      setMenuData((prev) => ({ ...prev, loading: true }));
      fetchRestaurantMenuFullApi(restaurantId)
        .then((res) => {
          if (res.success && res.data) {
            setMenuData((prev) => ({
              ...prev,
              categories: res.data.categories || [],
              items: res.data.items || [],
              loading: false,
            }));
          }
        })
        .catch(() => setMenuData((prev) => ({ ...prev, loading: false })));
    }

    if (activeTab === 'tables' && tablesData.tables.length === 0 && !tablesData.loading) {
      setTablesData((prev) => ({ ...prev, loading: true }));
      fetchRestaurantTablesFullApi(restaurantId)
        .then((res) => {
          if (res.success && res.data) {
            setTablesData({ tables: res.data.tables || [], loading: false });
          }
        })
        .catch(() => setTablesData((prev) => ({ ...prev, loading: false })));
    }

    if (activeTab === 'orders') {
      loadOrders();
    }

    if (activeTab === 'analytics' && !analyticsData.stats && !analyticsData.loading) {
      setAnalyticsData((prev) => ({ ...prev, loading: true }));
      fetchRestaurantAnalyticsFullApi(restaurantId)
        .then((res) => {
          if (res.success && res.data) {
            setAnalyticsData({ stats: res.data, loading: false });
          }
        })
        .catch(() => setAnalyticsData((prev) => ({ ...prev, loading: false })));
    }

    if (activeTab === 'timeline' && timelineData.timeline.length === 0 && !timelineData.loading) {
      setTimelineData((prev) => ({ ...prev, loading: true }));
      fetchRestaurantTimelineApi(restaurantId)
        .then((res) => {
          if (res.success && res.data) {
            setTimelineData({ timeline: res.data.timeline || [], loading: false });
          }
        })
        .catch(() => setTimelineData((prev) => ({ ...prev, loading: false })));
    }

    if (activeTab === 'bank') {
      loadBankDetailsData();
    }
  }, [activeTab, restaurantId]);

  const loadOrders = async () => {
    try {
      setOrdersData((prev) => ({ ...prev, loading: true }));
      const res = await fetchRestaurantOrdersFullApi(restaurantId, {
        filter: ordersData.filter,
        search: ordersData.search,
        page: ordersData.page,
      });
      if (res.success && res.data) {
        setOrdersData((prev) => ({
          ...prev,
          orders: res.data.orders || [],
          pagination: res.data.pagination || {},
          loading: false,
        }));
      }
    } catch {
      setOrdersData((prev) => ({ ...prev, loading: false }));
    }
  };

  // Quick Action Handler
  const handleExecuteQuickAction = async () => {
    try {
      const res = await executeRestaurantQuickActionApi(
        restaurantId,
        quickActionModal.action,
        quickActionModal.reason
      );
      if (res.success) {
        const actionLabels = {
          approve_verification: 'Restaurant verified and approved successfully',
          suspend: 'Restaurant account suspended',
          reactivate: 'Restaurant account reactivated',
          enable_payments: 'Online payments enabled',
          disable_payments: 'Online payments disabled',
          enable_qr: 'QR ordering enabled',
          disable_qr: 'QR ordering disabled',
        };
        toast.success(actionLabels[quickActionModal.action] || `Action completed successfully`);
        setQuickActionModal({ open: false, action: '', title: '', message: '', reason: '' });
        loadRestaurantDetails();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Quick action failed');
    }
  };

  // Verification State Machine Handler
  const handleUpdateVerification = async (targetStatus) => {
    try {
      setVerifyForm((prev) => ({ ...prev, submitting: true }));
      const res = await updateRestaurantVerificationApi(restaurantId, {
        status: targetStatus,
        reviewNotes: verifyForm.reviewNotes,
        rejectionReason: verifyForm.rejectionReason,
        requestedChanges: verifyForm.requestedChanges,
      });
      if (res.success) {
        toast.success(`Verification status updated to ${targetStatus}`);
        setVerifyForm({ reviewNotes: '', rejectionReason: '', requestedChanges: '', submitting: false });
        loadRestaurantDetails();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update verification status');
      setVerifyForm((prev) => ({ ...prev, submitting: false }));
    }
  };

  // Phase 4.1: Bank Verification Handler & Loader
  const loadBankDetailsData = useCallback(async () => {
    if (!restaurantId) return;
    try {
      setBankDetailsData((prev) => ({ ...prev, loading: true }));
      const res = await fetchRestaurantBankDetailsFullApi(restaurantId);
      if (res.success && res.data) {
        setBankDetailsData({ data: res.data, loading: false });
      } else {
        setBankDetailsData((prev) => ({ ...prev, loading: false }));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load bank details');
      setBankDetailsData((prev) => ({ ...prev, loading: false }));
    }
  }, [restaurantId]);

  const handleBankActionSubmit = async () => {
    const { action, reason } = bankActionModal;
    if ((action === 'reject' || action === 'request_changes') && !reason.trim()) {
      toast.error('A mandatory reason is required.');
      return;
    }

    try {
      setBankActionModal((prev) => ({ ...prev, submitting: true }));
      let res;
      if (action === 'approve') {
        res = await approveRestaurantBankDetailsApi(restaurantId);
        toast.success('Bank details approved successfully!');
      } else if (action === 'reject') {
        res = await rejectRestaurantBankDetailsApi(restaurantId, reason);
        toast.success('Bank details application rejected.');
      } else if (action === 'request_changes') {
        res = await requestChangesRestaurantBankDetailsApi(restaurantId, reason);
        toast.success('Changes requested from restaurant.');
      }

      setBankActionModal({ open: false, action: null, reason: '', submitting: false });
      loadBankDetailsData();
      loadRestaurantDetails();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
      setBankActionModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  // Support Mode ("View As Restaurant")
  const handleLaunchSupportMode = async () => {
    try {
      const res = await impersonateRestaurantSupportApi(restaurantId);
      if (res.success && res.data) {
        sessionStorage.setItem('support_mode', JSON.stringify({
          restaurantId,
          restaurantName: res.data.restaurant?.restaurantName,
          token: res.data.supportToken,
          startedAt: new Date().toISOString(),
        }));
        toast.success('Support Mode activated. Launching read-only restaurant console...');
        setSupportModal(false);
        // Open restaurant panel with support session token
        window.open(`http://localhost:5173/admin-support-session?token=${res.data.supportToken}&restaurantId=${restaurantId}`, '_blank');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Support mode could not be activated');
    }
  };

  // Save Admin Settings
  const handleSaveAdminSettings = async () => {
    try {
      setAdminSettings((prev) => ({ ...prev, submitting: true }));
      const res = await updateRestaurantAdminSettingsApi(restaurantId, {
        qrEnabled: adminSettings.qrEnabled,
        paymentEnabled: adminSettings.paymentEnabled,
        maintenanceMode: adminSettings.maintenanceMode,
        isDeleted: adminSettings.isDeleted,
        receiptFooter: adminSettings.receiptFooter,
      });
      if (res.success) {
        toast.success('Restaurant administrative controls saved');
        loadRestaurantDetails();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setAdminSettings((prev) => ({ ...prev, submitting: false }));
    }
  };

  // Thermal Receipt Downloader
  const handleDownloadThermalReceipt = (order) => {
    try {
      const rest = data?.restaurant || {};
      const receiptData = {
        receiptNumber: `RCP-${order.orderNumber}`,
        orderNumber: order.orderNumber,
        createdAt: order.createdAt,
        paymentMethod: order.paymentMethod || 'Online',
        paymentStatus: order.paymentStatus || 'COMPLETED',
        restaurantSnapshot: {
          restaurantName: rest.restaurantName || 'CRAVITI DINER',
          address: rest.address?.address || 'Restaurant Address',
          phone: rest.ownerPhone || rest.phone || '9999999999',
          gstNumber: rest.gstNumber || rest.taxDetails?.gstNumber || '22AAAAA0000A1Z5',
          fssaiNumber: rest.fssaiNumber || rest.taxDetails?.fssaiNumber || '10019022009876',
        },
        tableSnapshot: {
          tableNumber: order.tableNumber || 1,
        },
        items: Array.isArray(order.items) ? order.items.map((it) => ({
          itemName: it.itemName || 'Item',
          quantity: safeNumber(it.quantity, 1),
          sellingPrice: safeNumber(it.sellingPrice, 0),
          foodType: it.foodType || 'veg',
        })) : [],
        pricing: {
          subtotal: safeNumber(order.subtotal, order.grandTotal),
          discountAmount: safeNumber(order.discount, 0),
          taxAmount: safeNumber(order.tax, 0),
          taxRatePercent: 5,
          finalAmount: safeNumber(order.grandTotal, 0),
          roundOff: 0,
        },
      };

      generateReceiptPdf(receiptData, {
        template: RECEIPT_TEMPLATES.THERMAL_80MM,
        autoDownload: true,
      });
      toast.success(`Thermal Receipt downloaded for #${order.orderNumber}`);
    } catch (err) {
      console.error('Receipt generation error:', err);
      toast.error('Could not generate receipt PDF');
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-32 bg-slate-200 animate-pulse rounded" />
        <div className="h-40 bg-white rounded-2xl border border-slate-200 p-6 flex gap-4">
          <div className="w-20 h-20 bg-slate-200 rounded-xl animate-pulse" />
          <div className="space-y-3 flex-1">
            <div className="h-6 w-1/3 bg-slate-200 rounded" />
            <div className="h-4 w-1/4 bg-slate-200 rounded" />
            <div className="h-4 w-1/2 bg-slate-200 rounded" />
          </div>
        </div>
        <TableSkeleton rows={8} cols={4} />
      </div>
    );
  }

  const restaurant = data?.restaurant || {};
  const stats = data?.stats || {};
  const verification = VERIFICATION_BADGES[restaurant.verificationStatus] || VERIFICATION_BADGES.pending;
  const isSuspended = Boolean(restaurant.isDeleted);

  const TABS = [
    { key: 'overview', label: 'Overview', icon: FiLayers },
    { key: 'profile', label: 'Profile', icon: FiUser },
    { key: 'verification', label: 'Verification', icon: FiCheckCircle },
    { key: 'bank', label: 'Bank Details', icon: FiCreditCard },
    { key: 'menu', label: `Menu (${stats.menuCount ?? 0})`, icon: FiList },
    { key: 'tables', label: `Tables (${stats.tableCount ?? 0})`, icon: MdQrCodeScanner },
    { key: 'orders', label: `Orders (${stats.totalOrdersCount ?? 0})`, icon: FiShoppingBag },
    { key: 'analytics', label: 'Analytics', icon: FiTrendingUp },
    { key: 'timeline', label: 'Activity Timeline', icon: FiClock },
    { key: 'settings', label: 'Admin Settings', icon: FiSliders },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/restaurants"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors"
        >
          <FiArrowLeft className="w-4 h-4" />
          Back to Restaurants List
        </Link>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSupportModal(true)}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            <FiShield className="w-3.5 h-3.5" />
            Support Mode (View As Restaurant)
          </button>
        </div>
      </div>

      {/* Main Operations Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Restaurant Identity */}
          <div className="flex items-start gap-5">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-slate-100 to-slate-200 border border-slate-200 flex items-center justify-center font-extrabold text-2xl text-slate-700 shrink-0 overflow-hidden shadow-xs">
              {restaurant.logo?.url ? (
                <img src={restaurant.logo.url} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                safeString(restaurant.restaurantName?.charAt(0), 'R')
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl font-bold text-[#0F172A] tracking-tight">
                  {safeString(restaurant.restaurantName, 'Restaurant Details')}
                </h1>

                {/* Verification Badge */}
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${verification.color}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  {verification.label}
                </span>

                {/* Account Status Badge */}
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                    isSuspended
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  {isSuspended ? 'Suspended' : 'Active Account'}
                </span>

                {/* QR State */}
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${
                    restaurant.qrEnabled !== false
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-slate-100 text-slate-500 border-slate-200'
                  }`}
                >
                  <MdQrCodeScanner className="w-3 h-3" />
                  {restaurant.qrEnabled !== false ? 'QR Live' : 'QR Disabled'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                <div className="flex items-center gap-1">
                  <span className="font-mono text-slate-400">ID:</span>
                  <span className="font-mono font-medium text-slate-700">{restaurant._id}</span>
                  <button
                    onClick={() => copyToClipboard(restaurant._id, 'Restaurant ID')}
                    className="p-1 hover:text-blue-600 rounded"
                    title="Copy ID"
                  >
                    <FiCopy className="w-3 h-3" />
                  </button>
                </div>

                <span>•</span>
                <span className="font-mono">slug: {restaurant.slug || 'N/A'}</span>

                <span>•</span>
                <div className="flex items-center gap-1">
                  <FiCalendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Joined: {formatDate(restaurant.createdAt)}</span>
                </div>

                <span>•</span>
                <div className="flex items-center gap-1">
                  <FiClock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Last Active: {restaurant.lastActiveAt ? formatDate(restaurant.lastActiveAt) : 'Recently'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {restaurant.verificationStatus !== VERIFICATION_STATUS.VERIFIED && (
              <button
                type="button"
                onClick={() =>
                  setQuickActionModal({
                    open: true,
                    action: 'approve_verification',
                    title: 'Approve Restaurant Verification',
                    message: `Are you sure you want to verify and approve "${restaurant.restaurantName}"?`,
                  })
                }
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
              >
                <FiCheckCircle className="w-4 h-4" />
                Approve Verification
              </button>
            )}

            <button
              type="button"
              onClick={() =>
                setQuickActionModal({
                  open: true,
                  action: isSuspended ? 'reactivate' : 'suspend',
                  title: isSuspended ? 'Reactivate Restaurant Account' : 'Suspend Restaurant Account',
                  message: isSuspended
                    ? `Reactivate "${restaurant.restaurantName}" and restore full customer access?`
                    : `Suspend "${restaurant.restaurantName}"? Customers will be blocked from accessing menus and tables.`,
                })
              }
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border shadow-xs flex items-center gap-1.5 ${
                isSuspended
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
              }`}
            >
              <FiSlash className="w-3.5 h-3.5" />
              {isSuspended ? 'Reactivate Restaurant' : 'Suspend Restaurant'}
            </button>

            <button
              type="button"
              onClick={() =>
                setQuickActionModal({
                  open: true,
                  action: restaurant.paymentEnabled ? 'disable_payments' : 'enable_payments',
                  title: restaurant.paymentEnabled ? 'Disable Online Payments' : 'Enable Online Payments',
                  message: restaurant.paymentEnabled
                    ? 'Disabling payments will restrict customers to Cash/Counter billing.'
                    : 'Enable live online payment collection for this restaurant.',
                })
              }
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <FiDollarSign className="w-3.5 h-3.5" />
              {restaurant.paymentEnabled ? 'Disable Payments' : 'Enable Payments'}
            </button>
          </div>
        </div>

        {/* 10 Operational Tabs Bar */}
        <div className="mt-8 border-b border-slate-100 overflow-x-auto flex items-center gap-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-bold tracking-tight whitespace-nowrap border-b-2 transition-all ${
                  isActive
                    ? 'border-blue-600 text-blue-600 bg-blue-50/40 rounded-t-lg'
                    : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================
          TAB 1: OVERVIEW
      ======================================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Total Revenue
              </span>
              <span className="text-2xl font-extrabold text-[#0F172A] block">
                {formatCurrency(stats.totalRevenue)}
              </span>
              <span className="text-[11px] text-slate-400 block mt-1">Lifetime completed orders</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Total Orders
              </span>
              <span className="text-2xl font-extrabold text-[#0F172A] block">
                {safeNumber(stats.totalOrdersCount, 0)}
              </span>
              <span className="text-[11px] text-emerald-600 font-semibold block mt-1">
                {safeNumber(stats.todayOrdersCount, 0)} placed today
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Average Bill
              </span>
              <span className="text-2xl font-extrabold text-[#0F172A] block">
                {formatCurrency(stats.averageOrderValue)}
              </span>
              <span className="text-[11px] text-slate-400 block mt-1">Per successful order</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Dining Capacity
              </span>
              <span className="text-2xl font-extrabold text-[#0F172A] block">
                {safeNumber(stats.tableCount, 0)} Tables
              </span>
              <span className="text-[11px] text-slate-400 block mt-1">
                {safeNumber(stats.menuCount, 0)} active dishes
              </span>
            </div>
          </div>

          {/* 2-Column Detail Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contact & Legal Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-[#0F172A] uppercase tracking-wider">
                Owner & Contact Information
              </h2>
              <div className="divide-y divide-slate-100 text-xs">
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-400 font-medium">Owner Name</span>
                  <span className="font-bold text-slate-800">{safeString(restaurant.ownerName, '--')}</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-400 font-medium">Owner Phone</span>
                  <span className="font-bold text-slate-800">{safeString(restaurant.ownerPhone, '--')}</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-400 font-medium">Account Email</span>
                  <span className="font-bold text-slate-800">{safeString(restaurant.email, '--')}</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-400 font-medium">FSSAI License</span>
                  <span className="font-mono font-bold text-slate-800">{safeString(restaurant.fssaiNumber || restaurant.taxDetails?.fssaiNumber, 'Not Provided')}</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-400 font-medium">GSTIN</span>
                  <span className="font-mono font-bold text-slate-800">{safeString(restaurant.gstNumber || restaurant.taxDetails?.gstNumber, 'Unregistered')}</span>
                </div>
              </div>
            </div>

            {/* Address & Operational Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-[#0F172A] uppercase tracking-wider">
                Location & Operational Status
              </h2>
              <div className="divide-y divide-slate-100 text-xs">
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-400 font-medium">Street Address</span>
                  <span className="font-semibold text-slate-800 text-right">{safeString(restaurant.address?.address, '--')}</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-400 font-medium">City / State</span>
                  <span className="font-semibold text-slate-800">
                    {safeString(restaurant.address?.city, '--')}, {safeString(restaurant.address?.state, '--')}
                  </span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-400 font-medium">Pincode</span>
                  <span className="font-mono font-semibold text-slate-800">{safeString(restaurant.address?.pincode, '--')}</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-400 font-medium">QR Dine-In Status</span>
                  <span className={`font-bold ${restaurant.qrEnabled !== false ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {restaurant.qrEnabled !== false ? 'Active & Ordering Online' : 'Temporarily Disabled'}
                  </span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-400 font-medium">Online Payment Gateway</span>
                  <span className={`font-bold ${restaurant.paymentEnabled ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {restaurant.paymentEnabled ? 'Active (Razorpay / UPI)' : 'Cash / Counter Only'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 2: PROFILE
      ======================================================== */}
      {activeTab === 'profile' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-[#0F172A]">Public Restaurant Profile</h2>
              <p className="text-xs text-slate-400 mt-0.5">Read-only view of dining info visible to scanning customers</p>
            </div>
          </div>

          {/* Cover & Logo preview */}
          <div className="relative h-48 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center">
            {restaurant.coverImage?.url ? (
              <img src={restaurant.coverImage.url} alt="Cover" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs font-semibold text-slate-400">No cover image uploaded</span>
            )}

            <div className="absolute bottom-4 left-6 flex items-center gap-4 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-200/80 shadow-md">
              <div className="w-12 h-12 rounded-xl bg-slate-200 flex items-center justify-center font-bold text-slate-700 text-lg overflow-hidden">
                {restaurant.logo?.url ? (
                  <img src={restaurant.logo.url} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  safeString(restaurant.restaurantName?.charAt(0), 'R')
                )}
              </div>
              <div>
                <span className="font-extrabold text-sm text-[#0F172A] block">{restaurant.restaurantName}</span>
                <span className="text-[11px] text-slate-500 font-mono">slug: {restaurant.slug}</span>
              </div>
            </div>
          </div>

          {/* Profile Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 text-xs">
            <div className="space-y-1">
              <span className="font-bold text-slate-400 uppercase tracking-wider block">Description / Tagline</span>
              <p className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-slate-700 font-medium min-h-[60px]">
                {safeString(restaurant.description, 'No description provided by restaurant owner.')}
              </p>
            </div>

            <div className="space-y-1">
              <span className="font-bold text-slate-400 uppercase tracking-wider block">Opening Hours</span>
              <p className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-slate-700 font-medium min-h-[60px]">
                {restaurant.openingHours?.open && restaurant.openingHours?.close
                  ? `${restaurant.openingHours.open} - ${restaurant.openingHours.close}`
                  : '10:00 AM - 11:00 PM (Default)'}
              </p>
            </div>

            <div className="space-y-1">
              <span className="font-bold text-slate-400 uppercase tracking-wider block">UPI Billing ID</span>
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-slate-800 font-mono font-semibold">
                {safeString(restaurant.upiId, 'Not Configured')}
              </div>
            </div>

            <div className="space-y-1">
              <span className="font-bold text-slate-400 uppercase tracking-wider block">Seating Capacity</span>
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-slate-800 font-semibold">
                {safeNumber(restaurant.seatingCapacity, 40)} Guests
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 3: VERIFICATION WORKFLOW
      ======================================================== */}
      {activeTab === 'verification' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-[#0F172A]">Verification State Machine</h2>
                <p className="text-xs text-slate-400 mt-0.5">Control onboarding audit & live restaurant verification</p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Current Status:</span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${verification.color}`}>
                  {verification.label}
                </span>
              </div>
            </div>

            {/* Workflow Transition Buttons */}
            <div className="space-y-4">
              <label className="text-xs font-bold text-slate-700 block">
                Change Verification Status:
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={verifyForm.submitting || restaurant.verificationStatus === VERIFICATION_STATUS.UNDER_REVIEW}
                  onClick={() => handleUpdateVerification(VERIFICATION_STATUS.UNDER_REVIEW)}
                  className="px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                >
                  Mark Under Review
                </button>

                <button
                  type="button"
                  disabled={verifyForm.submitting || restaurant.verificationStatus === VERIFICATION_STATUS.VERIFIED}
                  onClick={() => handleUpdateVerification(VERIFICATION_STATUS.VERIFIED)}
                  className="px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl text-xs font-bold transition-all disabled:opacity-50 shadow-xs"
                >
                  Approve & Verify
                </button>

                <button
                  type="button"
                  disabled={verifyForm.submitting || restaurant.verificationStatus === VERIFICATION_STATUS.CHANGES_REQUESTED}
                  onClick={() => handleUpdateVerification(VERIFICATION_STATUS.CHANGES_REQUESTED)}
                  className="px-4 py-2 bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                >
                  Request Changes
                </button>

                <button
                  type="button"
                  disabled={verifyForm.submitting || restaurant.verificationStatus === VERIFICATION_STATUS.REJECTED}
                  onClick={() => handleUpdateVerification(VERIFICATION_STATUS.REJECTED)}
                  className="px-4 py-2 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                >
                  Reject Application
                </button>
              </div>
            </div>

            {/* Review Notes Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Review Notes (Internal or Shared with Restaurant)
                </label>
                <textarea
                  value={verifyForm.reviewNotes}
                  onChange={(e) => setVerifyForm({ ...verifyForm, reviewNotes: e.target.value })}
                  placeholder="e.g. FSSAI certificate verified on national portal. Business license clear."
                  rows={3}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    Rejection / Change Request Reason
                  </label>
                  <input
                    type="text"
                    value={verifyForm.rejectionReason}
                    onChange={(e) => setVerifyForm({ ...verifyForm, rejectionReason: e.target.value })}
                    placeholder="e.g. Incomplete GST certificate or blurred FSSAI scan"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Verification Audit History */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-[#0F172A] uppercase tracking-wider">
              Verification Audit History
            </h3>
            {Array.isArray(restaurant.verificationHistory) && restaurant.verificationHistory.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {restaurant.verificationHistory.map((item, idx) => (
                  <div key={idx} className="py-3 flex items-start justify-between text-xs">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold uppercase text-slate-800">{item.status}</span>
                        <span className="text-slate-400">• By {item.actor || 'Admin'}</span>
                      </div>
                      <p className="text-slate-600 font-medium">{item.notes || item.reason || 'Status updated'}</p>
                    </div>
                    <span className="text-slate-400 font-mono text-[11px] shrink-0">
                      {formatDate(item.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No historical verification events recorded yet.</p>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 4: BANK DETAILS (PHASE 4.1 INTEGRATION)
      ======================================================== */}
      {activeTab === 'bank' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-base font-bold text-[#0F172A]">Settlement & Bank Details</h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    v{bankDetailsData.data?.version || 1}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Live merchant payout account verified for automated revenue settlements
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    bankDetailsData.data?.status === 'approved'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : bankDetailsData.data?.status === 'submitted' || bankDetailsData.data?.status === 'under_review'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : bankDetailsData.data?.status === 'changes_requested'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : bankDetailsData.data?.status === 'rejected'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  Status: {safeString(bankDetailsData.data?.status, 'draft').toUpperCase()}
                </span>
              </div>
            </div>

            {/* Status Alert Banner */}
            {bankDetailsData.data?.status === 'approved' && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
                <FiCheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-800 space-y-0.5">
                  <p className="font-bold">Bank Account Verified & Active for Payouts</p>
                  <p>
                    Approved by <strong>{bankDetailsData.data?.approvedByName || 'Compliance Officer'}</strong> on{' '}
                    {bankDetailsData.data?.approvedAt ? formatDate(bankDetailsData.data.approvedAt) : 'Recently'}.
                  </p>
                </div>
              </div>
            )}

            {bankDetailsData.data?.status === 'changes_requested' && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
                <FiAlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 space-y-1">
                  <p className="font-bold">Changes Requested from Merchant</p>
                  <p className="p-2 bg-white/70 rounded-lg border border-amber-200 font-mono text-[11px]">
                    {bankDetailsData.data?.changeRequestReason || 'Please update details and re-upload proofs.'}
                  </p>
                </div>
              </div>
            )}

            {bankDetailsData.data?.status === 'rejected' && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3">
                <FiAlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="text-xs text-rose-900 space-y-1">
                  <p className="font-bold">Application Rejected</p>
                  <p className="p-2 bg-white/70 rounded-lg border border-rose-200 font-mono text-[11px]">
                    {bankDetailsData.data?.rejectionReason || 'Non-compliant credentials.'}
                  </p>
                </div>
              </div>
            )}

            {/* Read-Only Account Credentials Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="p-4 bg-slate-50 border border-slate-200/70 rounded-xl space-y-1">
                <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">
                  Account Holder
                </span>
                <span className="text-slate-900 font-bold text-sm block">
                  {safeString(bankDetailsData.data?.accountHolderName, 'Not Provided')}
                </span>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200/70 rounded-xl space-y-1">
                <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">
                  Bank Name
                </span>
                <span className="text-slate-900 font-bold text-sm block">
                  {safeString(bankDetailsData.data?.bankName, 'Not Provided')}
                </span>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200/70 rounded-xl space-y-1">
                <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">
                  Branch Name
                </span>
                <span className="text-slate-900 font-bold text-sm block">
                  {safeString(bankDetailsData.data?.branchName, 'Main Branch')}
                </span>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200/70 rounded-xl space-y-1">
                <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">
                  Masked Account No
                </span>
                <span className="text-slate-900 font-mono font-bold text-sm block">
                  {bankDetailsData.data?.maskedAccountNumber || '•••• •••• •••• ••••'}
                </span>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200/70 rounded-xl space-y-1">
                <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">
                  IFSC Code
                </span>
                <span className="text-slate-900 font-mono font-bold text-sm block uppercase">
                  {safeString(bankDetailsData.data?.ifscCode, 'Not Provided')}
                </span>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200/70 rounded-xl space-y-1">
                <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">
                  Account Type
                </span>
                <span className="text-slate-900 font-bold text-sm block">
                  {safeString(bankDetailsData.data?.accountType, 'Current')}
                </span>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200/70 rounded-xl space-y-1">
                <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">
                  Business UPI ID
                </span>
                <span className="text-slate-900 font-mono font-bold text-sm block">
                  {safeString(bankDetailsData.data?.upiId, 'Not Provided')}
                </span>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200/70 rounded-xl space-y-1">
                <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">
                  Submitted Date
                </span>
                <span className="text-slate-900 font-bold text-sm block">
                  {bankDetailsData.data?.submittedAt ? formatDate(bankDetailsData.data.submittedAt) : 'Draft'}
                </span>
              </div>
            </div>

            {/* Legal Documents Review Section */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                Verification Documents
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Cancelled Cheque', doc: bankDetailsData.data?.canceledCheque },
                  { label: 'Bank Passbook', doc: bankDetailsData.data?.passbook },
                  { label: 'PAN Card', doc: bankDetailsData.data?.panCard },
                  { label: 'Business Proof', doc: bankDetailsData.data?.businessProof },
                ].map(({ label, doc }) => (
                  <div key={label} className="p-3.5 bg-slate-50/70 border border-slate-200/70 rounded-xl space-y-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      {label}
                    </span>
                    {doc?.url ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <FiFileText className="w-4 h-4 text-blue-600 shrink-0" />
                          <span className="text-xs font-bold text-slate-800 truncate" title={doc.fileName || label}>
                            {doc.fileName || label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setBankDocPreview(doc)}
                            className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-2xs"
                          >
                            <FiEye className="w-3.5 h-3.5" />
                            <span>Preview</span>
                          </button>
                          <a
                            href={doc.url}
                            download={doc.fileName}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-2xs"
                          >
                            <FiDownload className="w-3.5 h-3.5" />
                            <span>Download</span>
                          </a>
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic block py-1">Not Uploaded</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Compliance Action Buttons */}
            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <span className="text-[11px] text-slate-400 font-medium">
                Admin Panel is read-only. Bank details can only be edited by the restaurant.
              </span>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setBankActionModal({ open: true, action: 'request_changes', reason: '', submitting: false })}
                  className="px-4 py-2 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 rounded-xl text-xs font-bold transition-all"
                >
                  Request Changes
                </button>
                <button
                  type="button"
                  onClick={() => setBankActionModal({ open: true, action: 'reject', reason: '', submitting: false })}
                  className="px-4 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-bold transition-all"
                >
                  Reject Application
                </button>
                <button
                  type="button"
                  disabled={bankDetailsData.data?.status === 'approved'}
                  onClick={() => setBankActionModal({ open: true, action: 'approve', reason: '', submitting: false })}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50"
                >
                  {bankDetailsData.data?.status === 'approved' ? 'Verified Account' : 'Approve Bank Details'}
                </button>
              </div>
            </div>
          </div>

          {/* Audit History Timeline */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-[#0F172A]">Bank Verification Audit Trail</h3>
            {bankDetailsData.data?.auditHistory?.length > 0 ? (
              <div className="space-y-3">
                {bankDetailsData.data.auditHistory.map((item, idx) => (
                  <div key={idx} className="p-3.5 bg-slate-50/70 border border-slate-200/70 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <strong className="text-slate-900 font-bold">{item.who}</strong>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                          {item.role || 'USER'}
                        </span>
                        <span className="font-bold text-blue-600">{item.action}</span>
                        {item.version && (
                          <span className="text-[10px] text-slate-400">v{item.version}</span>
                        )}
                      </div>
                      {item.reason && (
                        <p className="text-slate-600 italic">"{item.reason}"</p>
                      )}
                      <p className="text-[10px] text-slate-400">
                        {item.previousStatus ? `${item.previousStatus} → ` : ''}{item.newStatus || ''} {item.ip ? `• IP: ${item.ip}` : ''}
                      </p>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono shrink-0">
                      {item.timestamp ? new Date(item.timestamp).toLocaleString() : ''}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No audit history entries recorded.</p>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 5: MENU
      ======================================================== */}
      {activeTab === 'menu' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-[#0F172A]">Menu Catalog & Categories</h2>
              <p className="text-xs text-slate-400 mt-0.5">Read-only audit view of food items, prices, and food types</p>
            </div>

            {/* Filter controls */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                <input
                  type="text"
                  placeholder="Filter items..."
                  value={menuData.search}
                  onChange={(e) => setMenuData({ ...menuData, search: e.target.value })}
                  className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-600"
                />
              </div>

              <select
                value={menuData.filterType}
                onChange={(e) => setMenuData({ ...menuData, filterType: e.target.value })}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer"
              >
                <option value="all">All Types</option>
                <option value="veg">Veg Only</option>
                <option value="non-veg">Non-Veg Only</option>
              </select>
            </div>
          </div>

          {menuData.loading ? (
            <TableSkeleton rows={6} cols={5} />
          ) : menuData.items.length === 0 ? (
            <EmptyState title="No menu items found" description="This restaurant has not added any dishes yet." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[11px] border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3">Dish / Item</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Selling Price</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {menuData.items
                    .filter((it) => {
                      if (menuData.filterType === 'veg' && it.foodType !== 'veg') return false;
                      if (menuData.filterType === 'non-veg' && it.foodType !== 'non-veg') return false;
                      if (menuData.search && !it.name?.toLowerCase().includes(menuData.search.toLowerCase())) return false;
                      return true;
                    })
                    .map((item) => (
                      <tr key={item._id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-bold text-slate-800">{item.name}</td>
                        <td className="px-4 py-3 text-slate-500 font-medium">{item.category?.name || 'Main Menu'}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${
                              item.foodType === 'veg'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-red-50 text-red-700 border-red-200'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${item.foodType === 'veg' ? 'bg-emerald-600' : 'bg-red-600'}`} />
                            {item.foodType || 'veg'}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-bold text-[#0F172A]">{formatCurrency(item.price)}</td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-bold ${item.isAvailable !== false ? 'text-emerald-600' : 'text-slate-400'}`}>
                            {item.isAvailable !== false ? 'In Stock' : 'Unavailable'}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          TAB 6: TABLES
      ======================================================== */}
      {activeTab === 'tables' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-[#0F172A]">Dining Tables & QR Deployment</h2>
              <p className="text-xs text-slate-400 mt-0.5">Live status of customer dining sessions and assigned QR codes</p>
            </div>
          </div>

          {tablesData.loading ? (
            <TableSkeleton rows={4} cols={4} />
          ) : tablesData.tables.length === 0 ? (
            <EmptyState title="No tables created" description="Restaurant has not configured dining tables yet." />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {tablesData.tables.map((tbl) => {
                const isOccupied = tbl.status === 'occupied';
                return (
                  <div
                    key={tbl._id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isOccupied ? 'bg-amber-50/40 border-amber-200 shadow-xs' : 'bg-slate-50/50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-extrabold text-sm text-[#0F172A]">Table {tbl.tableNumber}</span>
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                          isOccupied
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        {isOccupied ? 'Occupied' : 'Available'}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 space-y-1">
                      <div>Capacity: {safeNumber(tbl.capacity, 4)} Seats</div>
                      {isOccupied && tbl.currentOrderId && (
                        <div className="text-[11px] font-medium text-amber-900 pt-1 border-t border-amber-200/60 mt-1">
                          Order: #{tbl.currentOrderId.orderNumber || 'Active'}
                          <div className="font-bold">{formatCurrency(tbl.currentOrderId.grandTotal)}</div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          TAB 7: ORDERS
      ======================================================== */}
      {activeTab === 'orders' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-[#0F172A]">Order Transactions</h2>
              <p className="text-xs text-slate-400 mt-0.5">Filterable order history with deterministic thermal receipt printing</p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={ordersData.filter}
                onChange={(e) => {
                  setOrdersData({ ...ordersData, filter: e.target.value });
                  setTimeout(loadOrders, 50);
                }}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer"
              >
                <option value="all">All Orders</option>
                <option value="today">Today Only</option>
                <option value="completed">Completed Only</option>
                <option value="pending">Active / Pending</option>
              </select>
            </div>
          </div>

          {ordersData.loading ? (
            <TableSkeleton rows={6} cols={6} />
          ) : ordersData.orders.length === 0 ? (
            <EmptyState title="No orders found" description="No orders matched the selected filter." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[11px] border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3">Order #</th>
                    <th className="px-4 py-3">Table</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Items</th>
                    <th className="px-4 py-3">Grand Total</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {ordersData.orders.map((ord) => (
                    <tr key={ord._id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-mono font-bold text-blue-600">{ord.orderNumber}</td>
                      <td className="px-4 py-3 text-slate-700 font-bold">Table {ord.tableNumber || 1}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                            ord.status === 'completed'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {ord.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{Array.isArray(ord.items) ? ord.items.length : 0} items</td>
                      <td className="px-4 py-3 font-bold text-[#0F172A]">{formatCurrency(ord.grandTotal)}</td>
                      <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">{formatDate(ord.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleDownloadThermalReceipt(ord)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition-all inline-flex items-center gap-1.5"
                        >
                          <FiDownload className="w-3 h-3 text-slate-500" />
                          Thermal PDF
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

      {/* ========================================================
          TAB 8: ANALYTICS
      ======================================================== */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Today Revenue
              </span>
              <span className="text-2xl font-extrabold text-[#0F172A] block">
                {formatCurrency(analyticsData.stats?.todayRevenue || 0)}
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Average Bill
              </span>
              <span className="text-2xl font-extrabold text-[#0F172A] block">
                {formatCurrency(analyticsData.stats?.averageBill || 0)}
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                7-Day Order Volume
              </span>
              <span className="text-2xl font-extrabold text-[#0F172A] block">
                {safeNumber(analyticsData.stats?.weeklyOrders, 0)}
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                30-Day Orders
              </span>
              <span className="text-2xl font-extrabold text-[#0F172A] block">
                {safeNumber(analyticsData.stats?.monthlyOrders, 0)}
              </span>
            </div>
          </div>

          {/* Top Selling Items */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-[#0F172A] uppercase tracking-wider">
              Top Selling Dishes (Sales Volume)
            </h3>
            {Array.isArray(analyticsData.stats?.topItems) && analyticsData.stats.topItems.length > 0 ? (
              <div className="divide-y divide-slate-100 text-xs">
                {analyticsData.stats.topItems.map((item, idx) => (
                  <div key={idx} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-blue-50 text-blue-700 font-bold flex items-center justify-center text-xs">
                        #{idx + 1}
                      </span>
                      <span className="font-bold text-slate-800">{item._id || 'Dish'}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-[#0F172A] block">{item.count} orders</span>
                      <span className="text-[11px] text-slate-400 block">{formatCurrency(item.totalSales)} sales</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No order volume recorded yet.</p>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 9: ACTIVITY TIMELINE
      ======================================================== */}
      {activeTab === 'timeline' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-[#0F172A]">Chronological Restaurant Timeline</h2>
            <p className="text-xs text-slate-400 mt-0.5">Comprehensive audit trail of registration, admin actions, and status updates</p>
          </div>

          {timelineData.loading ? (
            <TableSkeleton rows={6} cols={3} />
          ) : timelineData.timeline.length === 0 ? (
            <EmptyState title="No timeline records" description="No activity events found for this restaurant." />
          ) : (
            <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {timelineData.timeline.map((event, idx) => (
                <div key={idx} className="relative group text-xs">
                  <div className="absolute -left-6 top-1.5 w-2.5 h-2.5 rounded-full bg-blue-600 ring-4 ring-white" />
                  <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/70 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-900 uppercase tracking-tight">
                        {event.title}
                      </span>
                      <span className="text-slate-400 font-mono text-[11px]">
                        {formatDate(event.timestamp)}
                      </span>
                    </div>
                    <p className="text-slate-600 font-medium">{event.description}</p>
                    <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-400">
                      <span>Actor: <strong className="text-slate-600">{event.actor}</strong></span>
                      {event.ip && <span>IP: {event.ip}</span>}
                      {event.browser && <span>Device: {event.browser}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          TAB 10: ADMIN SETTINGS
      ======================================================== */}
      {activeTab === 'settings' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-[#0F172A]">Administrative Controls & Overrides</h2>
            <p className="text-xs text-slate-400 mt-0.5">Platform governance, soft deletion, and live feature overrides</p>
          </div>

          <div className="space-y-4 max-w-2xl text-xs">
            {/* QR Dine In Toggle */}
            <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
              <div>
                <span className="font-bold text-slate-900 block text-sm">QR Code Ordering</span>
                <span className="text-slate-500">Allow customers to view menus and place orders via QR</span>
              </div>
              <input
                type="checkbox"
                checked={adminSettings.qrEnabled}
                onChange={(e) => setAdminSettings({ ...adminSettings, qrEnabled: e.target.checked })}
                className="w-5 h-5 text-blue-600 rounded cursor-pointer"
              />
            </div>

            {/* Payment Gateway Toggle */}
            <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
              <div>
                <span className="font-bold text-slate-900 block text-sm">Online Payments Enabled</span>
                <span className="text-slate-500">Enable Razorpay / UPI direct payments for dining sessions</span>
              </div>
              <input
                type="checkbox"
                checked={adminSettings.paymentEnabled}
                onChange={(e) => setAdminSettings({ ...adminSettings, paymentEnabled: e.target.checked })}
                className="w-5 h-5 text-blue-600 rounded cursor-pointer"
              />
            </div>

            {/* Maintenance Mode Toggle */}
            <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
              <div>
                <span className="font-bold text-slate-900 block text-sm">Maintenance Mode</span>
                <span className="text-slate-500">Temporarily freeze restaurant operations for staff maintenance</span>
              </div>
              <input
                type="checkbox"
                checked={adminSettings.maintenanceMode}
                onChange={(e) => setAdminSettings({ ...adminSettings, maintenanceMode: e.target.checked })}
                className="w-5 h-5 text-blue-600 rounded cursor-pointer"
              />
            </div>

            {/* Account Suspension / Soft Delete */}
            <div className="flex items-center justify-between p-4 bg-rose-50/50 border border-rose-200 rounded-xl">
              <div>
                <span className="font-bold text-rose-900 block text-sm">Account Suspension (Soft Delete)</span>
                <span className="text-rose-600">Completely block this tenant and its staff from accessing Craviti</span>
              </div>
              <input
                type="checkbox"
                checked={adminSettings.isDeleted}
                onChange={(e) => setAdminSettings({ ...adminSettings, isDeleted: e.target.checked })}
                className="w-5 h-5 text-red-600 rounded cursor-pointer"
              />
            </div>

            {/* Receipt Custom Footer */}
            <div className="space-y-1.5 pt-2">
              <label className="font-bold text-slate-700 block">Custom Receipt Thermal Footer</label>
              <input
                type="text"
                value={adminSettings.receiptFooter}
                onChange={(e) => setAdminSettings({ ...adminSettings, receiptFooter: e.target.value })}
                placeholder="e.g. Thank you for dining with us! Follow us on Instagram @craviti"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="pt-4">
              <button
                type="button"
                disabled={adminSettings.submitting}
                onClick={handleSaveAdminSettings}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50"
              >
                {adminSettings.submitting ? 'Saving Controls...' : 'Save Administrative Controls'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Quick Actions */}
      <ConfirmModal
        isOpen={quickActionModal.open}
        onClose={() => setQuickActionModal({ open: false, action: '', title: '', message: '', reason: '' })}
        onConfirm={handleExecuteQuickAction}
        title={quickActionModal.title}
        message={quickActionModal.message}
        confirmText="Confirm Action"
      />

      {/* Bank Verification Action Modal (Phase 4.1) */}
      {bankActionModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                  bankActionModal.action === 'approve'
                    ? 'bg-emerald-50 text-emerald-600'
                    : bankActionModal.action === 'reject'
                    ? 'bg-rose-50 text-rose-600'
                    : 'bg-amber-50 text-amber-600'
                }`}
              >
                <FiShield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#0F172A]">
                  {bankActionModal.action === 'approve' && 'Approve Bank Verification'}
                  {bankActionModal.action === 'reject' && 'Reject Bank Verification'}
                  {bankActionModal.action === 'request_changes' && 'Request Changes from Merchant'}
                </h3>
                <p className="text-xs text-slate-400">Compliance & Settlement Workflow</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {bankActionModal.action === 'approve' &&
                'Approving will verify this bank account, activate automated payouts, and notify the restaurant via email and dashboard.'}
              {bankActionModal.action === 'reject' &&
                'Rejecting will decline this application. Please provide a clear compliance reason for the restaurant.'}
              {bankActionModal.action === 'request_changes' &&
                'Requesting changes will unlock the form on the restaurant panel so they can update details and re-submit.'}
            </p>

            {(bankActionModal.action === 'reject' || bankActionModal.action === 'request_changes') && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  Mandatory Reason / Notes <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={bankActionModal.reason}
                  onChange={(e) => setBankActionModal((prev) => ({ ...prev, reason: e.target.value }))}
                  placeholder={
                    bankActionModal.action === 'reject'
                      ? 'e.g. Account name does not match business registration certificates.'
                      : 'e.g. The cancelled cheque is blurred. Please upload a clearer scan with visible IFSC code.'
                  }
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setBankActionModal({ open: false, action: null, reason: '', submitting: false })}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={bankActionModal.submitting}
                onClick={handleBankActionSubmit}
                className={`px-4 py-2 text-white rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50 ${
                  bankActionModal.action === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : bankActionModal.action === 'reject'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                {bankActionModal.submitting ? 'Processing...' : 'Confirm Decision'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Full Preview Modal (Phase 4.1) */}
      {bankDocPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900">
                  {bankDocPreview.fileName || 'Verification Document Preview'}
                </h4>
                <p className="text-[10px] text-slate-400">
                  {bankDocPreview.fileSize ? `${Math.round(bankDocPreview.fileSize / 1024)} KB` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={bankDocPreview.url}
                  download={bankDocPreview.fileName}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <FiDownload className="w-3.5 h-3.5" />
                  <span>Download / Open Full</span>
                </a>
                <button
                  type="button"
                  onClick={() => setBankDocPreview(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 text-sm font-bold"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-4 flex-1 overflow-auto flex items-center justify-center bg-slate-50">
              {bankDocPreview.fileType === 'application/pdf' || bankDocPreview.url?.endsWith('.pdf') ? (
                <div className="text-center p-8 space-y-3">
                  <FiFileText className="w-16 h-16 text-rose-500 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">PDF Legal Document</p>
                  <a
                    href={bankDocPreview.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
                  >
                    <FiEye className="w-4 h-4" />
                    <span>View PDF in New Tab</span>
                  </a>
                </div>
              ) : (
                <img
                  src={bankDocPreview.url}
                  alt={bankDocPreview.fileName || 'Preview'}
                  className="max-h-[72vh] object-contain rounded-lg shadow-sm"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Support Mode Launch Modal */}
      {supportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <FiShield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#0F172A]">Launch Support Mode</h3>
                <p className="text-xs text-slate-400">View As Restaurant (Read-Only Inspection)</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              You are about to launch a supervised support session for <strong>{restaurant.restaurantName}</strong>.
              All administrative mutations are strictly locked in Read-Only Mode. A prominent banner will remind you of this inspection session.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSupportModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLaunchSupportMode}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                Launch Support Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

