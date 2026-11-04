import { useState, useEffect, useCallback, useMemo } from 'react';
import { io } from 'socket.io-client';
import { AnimatePresence } from 'framer-motion';
import { PageHeader } from '../components/PageHeader';
import { SearchBar } from '../components/SearchBar';
import { Table } from '../components/Table';
import { StatusBadge } from '../components/StatusBadge';
import { Pagination } from '../components/Pagination';
import { Button } from '../components/Button';
import { Loader } from '../components/Loader';
import { LiveOrderCard } from '../components/orders/LiveOrderCard';
import { OrderDetailsModal } from '../components/orders/OrderDetailsModal';
import { LiveOrderTimer } from '../components/orders/LiveOrderTimer';
import {
  fetchLiveOrdersApi,
  fetchHistoricalOrdersApi,
  updateOrderStatusApi,
  updateOrderPaymentStatusApi,
} from '../services/orderService';
import { useAuth } from '../context/AuthContext';
import { playOrderChime } from '../utils/soundNotification';
import { formatCurrency, formatTime, formatDateTime } from '../utils/formatters';
import {
  FiGrid,
  FiList,
  FiVolume2,
  FiVolumeX,
  FiFilter,
  FiClock,
  FiRefreshCw,
  FiDollarSign,
  FiCheckCircle,
  FiXCircle,
  FiActivity,
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const MAIN_TABS = [
  { key: 'active', label: 'Active Orders', isLive: true, icon: FiActivity },
  { key: 'completed', label: 'Completed Orders', isLive: false, icon: FiCheckCircle },
  { key: 'cancelled', label: 'Cancelled Orders', isLive: false, icon: FiXCircle },
];

const ACTIVE_SUB_STATUSES = [
  { key: 'all', label: 'All Active' },
  { key: 'placed', label: 'Placed' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'served', label: 'Served' },
];

export const Orders = () => {
  const { restaurant } = useAuth();

  // State
  const [liveOrders, setLiveOrders] = useState([]);
  const [historicalOrders, setHistoricalOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeMainTab, setActiveMainTab] = useState('active');
  const [activeSubStatus, setActiveSubStatus] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'oldest'
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [newOrderIds, setNewOrderIds] = useState(new Set());

  // Modal State
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Pagination for historical orders
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);

  // 1. Fetch Live Orders
  const loadLiveOrders = useCallback(async () => {
    try {
      const res = await fetchLiveOrdersApi();
      if (res.success && Array.isArray(res.orders)) {
        setLiveOrders(res.orders);
      }
    } catch (err) {
      console.error('Failed to load live orders:', err);
    }
  }, []);

  // 2. Fetch Historical Orders (completed / cancelled)
  const loadHistoricalOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchHistoricalOrdersApi({
        status: activeMainTab,
        paymentStatus: paymentFilter === 'all' ? undefined : paymentFilter,
        search: searchQuery,
        sort: sortBy,
        page: historyPage,
        limit: 20,
      });
      if (res.success && res.data) {
        setHistoricalOrders(res.data.orders);
        setHistoryTotal(res.data.pagination?.total || 0);
      }
    } catch (err) {
      console.error('Failed to load historical orders:', err);
    } finally {
      setLoading(false);
    }
  }, [activeMainTab, paymentFilter, searchQuery, sortBy, historyPage]);

  // Initial load
  useEffect(() => {
    if (activeMainTab === 'active') {
      setLoading(true);
      loadLiveOrders().finally(() => setLoading(false));
    } else {
      loadHistoricalOrders();
    }
  }, [activeMainTab, loadLiveOrders, loadHistoricalOrders]);

  // 3. Real-Time Socket.IO Subscriptions (Zero polling!)
  useEffect(() => {
    if (!restaurant?._id) return;

    const socketUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      socket.emit('join-restaurant', restaurant._id);
    });

    // New Incoming Order
    const handleNewOrder = (order) => {
      if (!order) return;

      if (soundEnabled) {
        playOrderChime();
      }

      toast.success(
        `🔔 Order #${order.orderNumber} (Table ${order.tableNumber}) received!`,
        { duration: 5000 }
      );

      // Highlight new card for 8 seconds
      setNewOrderIds((prev) => new Set([...prev, order._id]));
      setTimeout(() => {
        setNewOrderIds((prev) => {
          const next = new Set(prev);
          next.delete(order._id);
          return next;
        });
      }, 8000);

      // Add to live orders list in memory
      setLiveOrders((prev) => {
        const exists = prev.some((o) => o._id === order._id);
        if (exists) {
          return prev.map((o) => (o._id === order._id ? { ...o, ...order } : o));
        }
        return [order, ...prev];
      });
    };

    socket.on('new-order', handleNewOrder);
    socket.on('new_order', handleNewOrder);

    // Order Updated
    const handleOrderUpdate = (updatedOrder) => {
      if (!updatedOrder) return;

      setLiveOrders((prev) => {
        // If completed or cancelled, remove from live active list
        if (['completed', 'cancelled'].includes(updatedOrder.status) || updatedOrder.isDeleted) {
          return prev.filter((o) => o._id !== updatedOrder._id);
        }
        const index = prev.findIndex((o) => o._id === updatedOrder._id);
        if (index > -1) {
          const next = [...prev];
          next[index] = { ...next[index], ...updatedOrder };
          return next;
        }
        return [updatedOrder, ...prev];
      });

      setSelectedOrder((prev) =>
        prev && prev._id === updatedOrder._id ? { ...prev, ...updatedOrder } : prev
      );
    };

    socket.on('order-updated', handleOrderUpdate);
    socket.on('status-updated', handleOrderUpdate);
    socket.on('payment-updated', handleOrderUpdate);

    return () => {
      socket.disconnect();
    };
  }, [restaurant?._id, soundEnabled]);

  // Order Action: Change Status
  const handleStatusChange = async (orderId, newStatus, note = '') => {
    try {
      const res = await updateOrderStatusApi(orderId, newStatus, note);
      if (res.order?.status === 'completed') {
        toast.success('Order Served & Automatically Completed (Paid Online)!');
      } else {
        toast.success(`Order marked as ${newStatus}`);
      }
      if (res.order) {
        setLiveOrders((prev) => {
          if (['completed', 'cancelled'].includes(res.order.status)) {
            return prev.filter((o) => o._id !== orderId);
          }
          return prev.map((o) => (o._id === orderId ? { ...o, ...res.order } : o));
        });
        setSelectedOrder((prev) =>
          prev && prev._id === orderId ? { ...prev, ...res.order } : prev
        );
      }
    } catch {
      toast.error('Failed to update status');
    }
  };

  // Order Action: Change Payment
  const handlePaymentChange = async (orderId, paymentStatus, paymentMethod = 'cash') => {
    try {
      const res = await updateOrderPaymentStatusApi(orderId, paymentStatus, paymentMethod);
      if (res.order?.status === 'completed') {
        toast.success('Payment Collected & Order Automatically Completed!');
      } else {
        toast.success(`Payment updated: ${paymentStatus}`);
      }
      if (res.order) {
        setLiveOrders((prev) => {
          if (['completed', 'cancelled'].includes(res.order.status)) {
            return prev.filter((o) => o._id !== orderId);
          }
          return prev.map((o) => (o._id === orderId ? { ...o, ...res.order } : o));
        });
        setSelectedOrder((prev) =>
          prev && prev._id === orderId ? { ...prev, ...res.order } : prev
        );
      }
    } catch {
      toast.error('Failed to update payment');
    }
  };

  // Filter & Sort Live Orders
  const isLiveTab = activeMainTab === 'active';

  const displayOrders = useMemo(() => {
    if (!isLiveTab) {
      return historicalOrders;
    }

    let list = [...liveOrders];

    // Sub Status filter
    if (activeSubStatus !== 'all') {
      list = list.filter((o) => o.status === activeSubStatus);
    }

    // Payment Filter
    if (paymentFilter !== 'all') {
      list = list.filter((o) => o.paymentStatus === paymentFilter);
    }

    // Search Query (Order Number or Table Number)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (o) =>
          o.orderNumber?.toLowerCase().includes(q) ||
          String(o.tableNumber || '').includes(q) ||
          o.customerName?.toLowerCase().includes(q)
      );
    }

    // Sort
    if (sortBy === 'oldest') {
      list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else {
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return list;
  }, [isLiveTab, historicalOrders, liveOrders, activeSubStatus, paymentFilter, searchQuery, sortBy]);

  // Table Columns (when viewMode === 'table')
  const tableColumns = [
    {
      header: 'Order #',
      cell: (row) => (
        <span className="font-mono font-bold text-xs text-slate-900">{row.orderNumber}</span>
      ),
    },
    {
      header: 'Table',
      cell: (row) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-emerald-50 text-[#16A34A] font-extrabold text-xs border border-emerald-200">
          T{row.tableNumber}
        </span>
      ),
    },
    {
      header: 'Customer',
      cell: (row) => (
        <div>
          <p className="text-xs font-semibold text-slate-800">{row.customerName || 'Guest'}</p>
          {row.customerPhone && <p className="text-[10px] text-slate-400">{row.customerPhone}</p>}
        </div>
      ),
    },
    {
      header: 'Dishes',
      cell: (row) => (
        <div className="max-w-[220px]">
          <p className="text-xs text-slate-700 truncate font-medium">
            {row.items?.map((i) => `${i.quantity}x ${i.itemName || i.name}`).join(', ')}
          </p>
        </div>
      ),
    },
    {
      header: 'Total',
      cell: (row) => (
        <span className="font-extrabold text-xs text-slate-900">
          {formatCurrency(row.grandTotal)}
        </span>
      ),
    },
    {
      header: 'Elapsed',
      cell: (row) => (
        <LiveOrderTimer
          createdAt={row.createdAt}
          estimatedPrepTime={row.estimatedPrepTime || 15}
          isFinished={['completed', 'cancelled'].includes(row.status)}
        />
      ),
    },
    {
      header: 'Status',
      cell: (row) => <StatusBadge status={row.status} size="sm" />,
    },
    {
      header: 'Payment',
      cell: (row) => (
        <span
          className={`text-xs font-bold ${
            row.paymentStatus === 'paid_cash' || row.paymentStatus === 'paid_online'
              ? 'text-emerald-600'
              : 'text-amber-600'
          }`}
        >
          {row.paymentStatus === 'paid_cash'
            ? 'Paid Cash'
            : row.paymentStatus === 'paid_online'
            ? 'Paid Online'
            : 'Pending Cash'}
        </span>
      ),
    },
    {
      header: 'Action',
      cell: (row) => {
        if (row.status === 'placed') {
          return (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleStatusChange(row._id, 'accepted');
              }}
              className="px-2.5 py-1 rounded-lg text-xs font-bold text-white bg-[#16A34A] hover:bg-[#15803d]"
            >
              Accept
            </button>
          );
        }
        if (row.status === 'accepted') {
          return (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleStatusChange(row._id, 'served');
              }}
              className="px-2.5 py-1 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700"
            >
              Serve
            </button>
          );
        }
        if (row.status === 'served' && row.paymentStatus !== 'paid_cash') {
          return (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePaymentChange(row._id, 'paid_cash', 'cash');
              }}
              className="px-2.5 py-1 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700"
            >
              Mark Cash Paid
            </button>
          );
        }
        return (
          <button
            onClick={() => setSelectedOrder(row)}
            className="text-xs text-slate-500 hover:text-slate-700 font-semibold underline"
          >
            Details
          </button>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Live Order Management"
        description="Streamlined real-time order workflow: Placed → Accepted → Served → Auto-Completed."
        actions={
          <div className="flex items-center gap-2">
            {/* Audio Chime Toggle */}
            <button
              type="button"
              onClick={() => setSoundEnabled((v) => !v)}
              className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors ${
                soundEnabled
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-slate-100 text-slate-400 border-slate-200'
              }`}
              title={soundEnabled ? 'Kitchen chime enabled' : 'Kitchen chime muted'}
            >
              {soundEnabled ? <FiVolume2 className="w-4 h-4" /> : <FiVolumeX className="w-4 h-4" />}
              <span className="hidden sm:inline">{soundEnabled ? 'Sound ON' : 'Muted'}</span>
            </button>

            {/* Refresh */}
            <Button
              variant="outline"
              size="sm"
              leftIcon={FiRefreshCw}
              onClick={() => (isLiveTab ? loadLiveOrders() : loadHistoricalOrders())}
            >
              Refresh
            </Button>
          </div>
        }
      />

      {/* Main Tabs (Active Orders, Completed Orders, Cancelled Orders) */}
      <div className="border-b border-slate-200">
        <div className="flex gap-4">
          {MAIN_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeMainTab === tab.key;
            const count = tab.key === 'active' ? liveOrders.length : null;

            return (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveMainTab(tab.key);
                  setSearchQuery('');
                }}
                className={`flex items-center gap-2 pb-3 pt-1 text-sm font-bold border-b-2 transition-all relative ${
                  isActive
                    ? 'border-[#16A34A] text-[#16A34A]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {count !== null && (
                  <span
                    className={`ml-1 text-xs px-2 py-0.5 rounded-full font-extrabold ${
                      isActive ? 'bg-[#16A34A] text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sub Status Filter (When Active Orders tab is selected) */}
      {isLiveTab && (
        <div className="flex flex-wrap items-center gap-2">
          {ACTIVE_SUB_STATUSES.map((sub) => {
            const isSelected = activeSubStatus === sub.key;
            const subCount =
              sub.key === 'all'
                ? liveOrders.length
                : liveOrders.filter((o) => o.status === sub.key).length;

            return (
              <button
                key={sub.key}
                onClick={() => setActiveSubStatus(sub.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>{sub.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {subCount}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="w-full sm:w-64">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search order #, table #..."
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Payment filter */}
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="text-xs font-semibold border border-slate-200 rounded-xl px-2.5 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
          >
            <option value="all">All Payments</option>
            <option value="pending">Pending Cash</option>
            <option value="paid_cash">Paid Cash</option>
            <option value="paid_online">Paid Online</option>
          </select>

          {/* Sort order */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-xs font-semibold border border-slate-200 rounded-xl px-2.5 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>

          {/* View Mode Switcher */}
          <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden p-0.5 bg-slate-50">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-400'
              }`}
              title="Grid Cards"
            >
              <FiGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'table' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-400'
              }`}
              title="Table View"
            >
              <FiList className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Orders Content View */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <Loader size="lg" />
        </div>
      ) : displayOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 mx-auto mb-3">
            <FiClock className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-sm text-slate-800">No Orders Found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {isLiveTab
              ? 'There are currently no active dining orders on the floor. Live orders appear automatically upon customer QR scan.'
              : 'No orders recorded in this category.'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence>
            {(Array.isArray(displayOrders) ? displayOrders : []).map((order) => (
              <LiveOrderCard
                key={order._id}
                order={order}
                isNew={newOrderIds.has(order._id)}
                onStatusChange={handleStatusChange}
                onPaymentChange={handlePaymentChange}
                onSelectOrder={setSelectedOrder}
              />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
          <Table
            columns={tableColumns}
            data={displayOrders}
            onRowClick={(row) => setSelectedOrder(row)}
          />
        </div>
      )}

      {/* Pagination for historical orders */}
      {!isLiveTab && historyTotal > 20 && (
        <Pagination
          currentPage={historyPage}
          totalItems={historyTotal}
          pageSize={20}
          onPageChange={setHistoryPage}
        />
      )}

      {/* Order Details Modal */}
      <OrderDetailsModal
        order={selectedOrder}
        isOpen={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
        onStatusChange={handleStatusChange}
        onPaymentChange={handlePaymentChange}
        restaurantName={restaurant?.restaurantName}
      />
    </div>
  );
};
