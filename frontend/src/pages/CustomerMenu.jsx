import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import env from '../config/env';
import {
  FiSearch,
  FiX,
  FiShoppingBag,
  FiAlertCircle,
  FiWifiOff,
  FiClock,
  FiStar,
  FiArrowRight,
  FiMapPin,
  FiPlus,
} from 'react-icons/fi';
import { MdQrCodeScanner, MdRestaurantMenu } from 'react-icons/md';
import { fetchCustomerMenuApi, placeCustomerOrderApi } from '../services/orderService';
import { createPaymentOrderApi, verifyPaymentApi } from '../services/paymentService';
import { openRazorpayModal } from '../utils/razorpay';
import { CustomerCartProvider, useCustomerCart } from '../context/CustomerCartContext';
import { CustomerMenuCard } from '../components/customer/CustomerMenuCard';
import { CustomerItemModal } from '../components/customer/CustomerItemModal';
import { CustomerCartDrawer } from '../components/customer/CustomerCartDrawer';
import { CustomerOrderSuccessModal } from '../components/customer/CustomerOrderSuccessModal';
import { CustomerFooter } from '../components/customer/CustomerFooter';
import { ImageWithFallback } from '../components/ImageWithFallback';
import { getOrCreateGuestId, getOrCreateDeviceId, getOrCreateSessionId, setGuestId } from '../utils/guestSession';
import { formatCurrency } from '../utils/formatters';
import toast from 'react-hot-toast';

const CustomerMenuContent = () => {
  const { restaurantSlug, tableNumber, tableId, qrToken } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const activeTable = tableNumber || tableId || '1';
  const activeToken = qrToken || searchParams.get('token') || searchParams.get('qrToken') || '';

  const {
    cart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getItemQuantity,
    syncCartWithLiveMenu,
    totalCount,
    subtotal,
    discount,
    grandTotal,
  } = useCustomerCart();

  const [restaurant, setRestaurant] = useState(null);
  const [table, setTable] = useState(null);
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [activeOrder, setActiveOrder] = useState(null);
  const [settings, setSettings] = useState(null);
  const [isOrderLocked, setIsOrderLocked] = useState(false);
  const [waitingForPayment, setWaitingForPayment] = useState(false);
  const [dismissActivePrompt, setDismissActivePrompt] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');

  // Modals & Drawers
  const [selectedItem, setSelectedItem] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [stickyPaymentMethod, setStickyPaymentMethod] = useState('cash');

  // Category refs for smooth scrolling
  const categorySectionRefs = useRef({});

  // Prevent duplicate double submission ref
  const isSubmittingRef = useRef(false);

  // Keep a stable ref for syncCartWithLiveMenu to prevent loadMenu recreating on cart changes
  const syncCartRef = useRef(syncCartWithLiveMenu);
  useEffect(() => {
    syncCartRef.current = syncCartWithLiveMenu;
  }, [syncCartWithLiveMenu]);

  // 1. Offline Network Listener
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 2. Fetch Restaurant, Table, Menu & Active Table Order (Single Source of Truth)
  const loadMenu = useCallback(
    async (isSilent = false) => {
      try {
        if (!isSilent) setLoading(true);
        setError(null);
        const guestId = getOrCreateGuestId();
        const deviceId = getOrCreateDeviceId();
        const res = await fetchCustomerMenuApi(
          restaurantSlug,
          activeTable,
          guestId,
          deviceId,
          activeToken
        );
        if (res.success && (res.data || res.restaurant)) {
          const restaurantData = res.data?.restaurant || res.restaurant || null;
          const tableData = res.data?.table || res.table || null;
          const categoriesData = res.data?.categories || res.categories || [];
          const liveItems = res.data?.menuItems || res.data?.items || res.items || res.menuItems || [];
          const settingsData = res.data?.settings || res.settings || null;
          const activeOrderData = res.data?.activeOrder || res.activeOrder || null;
          const orderLocked = Boolean(res.data?.isOrderLocked ?? res.isOrderLocked);
          const paymentWaiting = Boolean(res.data?.waitingForPayment ?? res.waitingForPayment);

          setRestaurant(restaurantData);
          setTable(tableData);
          setCategories(categoriesData);
          setMenuItems(liveItems);
          setSettings(settingsData);
          setIsOrderLocked(orderLocked);
          setWaitingForPayment(paymentWaiting);
          if (activeOrderData) {
            setActiveOrder(activeOrderData);
          }
          // Live sync cart items with latest prices and availability
          if (typeof syncCartRef.current === 'function') {
            syncCartRef.current(liveItems);
          }
        }
      } catch (err) {
        if (!isSilent) {
          const msg =
            err.response?.data?.message ||
            'Unable to load menu. Please scan table QR again or try again.';
          setError(msg);
        }
      } finally {
        if (!isSilent) setLoading(false);
      }
    },
    [restaurantSlug, activeTable, activeToken]
  );

  useEffect(() => {
    if (restaurantSlug && activeTable) {
      loadMenu(false);
    }
  }, [loadMenu, restaurantSlug, activeTable]);

  // 3. Real-Time Socket.IO Synchronization with Restaurant Panel
  useEffect(() => {
    if (!restaurant?._id) return;
    const socketUrl =
      env.SOCKET_URL || (typeof window !== 'undefined' ? window.location.origin : '');
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      socket.emit('join-restaurant', restaurant._id);
      if (restaurantSlug) socket.emit('join-restaurant', restaurantSlug);
      if (table?._id) socket.emit('join-table', table._id);
    });

    const handleMenuSync = () => {
      loadMenu(true);
    };

    socket.on('menu.updated', handleMenuSync);
    socket.on('menu-updated', handleMenuSync);
    socket.on('category.updated', handleMenuSync);
    socket.on('category-updated', handleMenuSync);
    socket.on('restaurant.updated', handleMenuSync);
    socket.on('restaurant.settings.updated', handleMenuSync);

    return () => {
      socket.off('menu.updated', handleMenuSync);
      socket.off('menu-updated', handleMenuSync);
      socket.off('category.updated', handleMenuSync);
      socket.off('category-updated', handleMenuSync);
      socket.off('restaurant.updated', handleMenuSync);
      socket.off('restaurant.settings.updated', handleMenuSync);
      socket.disconnect();
    };
  }, [restaurant?._id, restaurantSlug, table?._id, loadMenu]);

  // Memoized Item Event Handlers to prevent re-rendering unaffected menu cards
  const handleAddToCart = useCallback(
    (item) => {
      addToCart(item, 1);
    },
    [addToCart]
  );

  const handleUpdateQuantity = useCallback(
    (itemId, qty) => {
      updateQuantity(itemId, qty);
    },
    [updateQuantity]
  );

  const handleOpenModal = useCallback((item) => {
    setSelectedItem(item);
  }, []);

  // Filtered menu items
  const filteredItems = useMemo(() => {
    let list = Array.isArray(menuItems) ? menuItems : [];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (i) =>
          i.itemName?.toLowerCase().includes(q) ||
          i.description?.toLowerCase().includes(q)
      );
    }

    if (activeCategory !== 'ALL') {
      list = list.filter(
        (i) =>
          i.categoryId?._id === activeCategory ||
          i.categoryId === activeCategory ||
          i.categoryId?.categoryName === activeCategory
      );
    }

    return list;
  }, [menuItems, searchQuery, activeCategory]);

  // Popular items
  const popularItems = useMemo(() => {
    return (Array.isArray(menuItems) ? menuItems : []).filter((i) => i.popular || i.recommended).slice(0, 5);
  }, [menuItems]);

  // Items grouped by category
  const groupedItems = useMemo(() => {
    if (activeCategory !== 'ALL' || searchQuery.trim()) {
      return null;
    }

    const groups = {};
    for (const cat of categories) {
      groups[cat._id] = {
        categoryName: cat.categoryName,
        items: [],
      };
    }

    const otherKey = 'other';
    groups[otherKey] = { categoryName: 'Specialties', items: [] };

    for (const item of (Array.isArray(menuItems) ? menuItems : [])) {
      const catId = item.categoryId?._id || item.categoryId || otherKey;
      if (groups[catId]) {
        groups[catId].items.push(item);
      } else {
        groups[otherKey].items.push(item);
      }
    }

    return Object.entries(groups).filter(([_, group]) => group.items.length > 0);
  }, [menuItems, categories, activeCategory, searchQuery]);

  // Category scroll handler
  const handleCategoryClick = (catId) => {
    setActiveCategory(catId);
    if (catId === 'ALL') {
      window.scrollTo({ top: 180, behavior: 'smooth' });
    } else {
      const el = categorySectionRefs.current[catId];
      if (el) {
        const offset = 120;
        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = el.getBoundingClientRect().top;
        const elementPosition = elementRect - bodyRect;
        const offsetPosition = elementPosition - offset;
        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      }
    }
  };

  // Tax calculations
  const taxPercent = useMemo(() => {
    if (settings?.gstEnabled === false) return 0;
    return Number(settings?.gstPercentage) || 0;
  }, [settings]);

  const taxAmount = useMemo(() => {
    if (taxPercent <= 0) return 0;
    return Math.round(grandTotal * (taxPercent / 100) * 100) / 100;
  }, [grandTotal, taxPercent]);

  const calculatedGrandTotal = useMemo(() => {
    return Math.round((grandTotal + taxAmount) * 100) / 100;
  }, [grandTotal, taxAmount]);

  // Robust Order Placement with Idempotent Prepay and Cash Flows
  const handlePlaceOrder = async ({ customerName, customerPhone, paymentMethod = 'cash' }) => {
    if (isSubmittingRef.current || isPlacingOrder) return;
    if (!cart || cart.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    try {
      isSubmittingRef.current = true;
      setIsPlacingOrder(true);

      const guestId = getOrCreateGuestId();
      const deviceId = getOrCreateDeviceId();
      const sessionId = getOrCreateSessionId();

      const itemsPayload = cart.map((i) => ({
        menuItemId: i.menuItemId,
        quantity: i.quantity,
        specialInstructions: i.specialInstructions || '',
      }));

      // FLOW A: ONLINE PAYMENT (PREPAY)
      // Generates Razorpay Order first without DB order.
      // Order created in DB ONLY after successful HMAC signature verification.
      // If cancelled or failed: Cart is 100% preserved, no order created.
      if (paymentMethod === 'online') {
        const payRes = await createPaymentOrderApi({
          restaurantSlug,
          tableIdentifier: activeTable,
          guestId,
          deviceId,
          guestSessionId: sessionId,
          customerName: customerName || 'Guest',
          customerPhone: customerPhone || '',
          customerEmail: '',
          items: itemsPayload,
        });

        if (!payRes.success || !payRes.data) {
          throw new Error(payRes.message || 'Failed to initialize payment gateway.');
        }

        await openRazorpayModal({
          orderData: payRes.data,
          onSuccess: async (verifyPayload) => {
            try {
              const vRes = await verifyPaymentApi({
                razorpayOrderId: payRes.data.razorpayOrderId,
                ...verifyPayload,
              });

              if (vRes.success && vRes.order) {
                clearCart();
                setIsCartOpen(false);
                setActiveOrder(vRes.order);
                setPlacedOrder(vRes.order);
                toast.success('Payment verified! Your order has been placed.');
                navigate(`/order/track/${vRes.order._id}`);
              } else {
                toast.error(vRes.message || 'Payment verification failed.');
              }
            } catch (vErr) {
              const errMsg = vErr.response?.data?.message || 'Payment verification failed.';
              toast.error(errMsg);
            } finally {
              setIsPlacingOrder(false);
              isSubmittingRef.current = false;
            }
          },
          onDismiss: () => {
            // Cart preserved!
            setIsPlacingOrder(false);
            isSubmittingRef.current = false;
            toast('Payment cancelled. Your cart has been preserved.', { icon: '🛒' });
          },
          onError: (pErr) => {
            // Cart preserved!
            setIsPlacingOrder(false);
            isSubmittingRef.current = false;
            toast.error(pErr.message || 'Payment failed. No order was placed.');
          },
        });
        return;
      }

      // FLOW B: CASH PAYMENT (POSTPAY)
      // Places order immediately with status: placed, paymentStatus: pending, cashierStatus: unpaid
      const orderPayload = {
        restaurantSlug,
        tableIdentifier: activeTable,
        guestId,
        deviceId,
        sessionId,
        customerName: customerName || 'Guest',
        customerPhone: customerPhone || '',
        paymentMethod: 'cash',
        items: itemsPayload,
      };

      const res = await placeCustomerOrderApi(orderPayload);
      if (res.success && res.order) {
        if (res.guestId) setGuestId(res.guestId);
        clearCart();
        setIsCartOpen(false);
        setActiveOrder(res.order);
        setPlacedOrder(res.order);
        toast.success(res.appended ? 'Items added to your active bill!' : 'Order placed successfully! Pay at counter.');
      } else {
        throw new Error(res.message || 'Failed to place cash order.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to place order. Please try again.';
      toast.error(msg);
    } finally {
      if (paymentMethod !== 'online') {
        setIsPlacingOrder(false);
        isSubmittingRef.current = false;
      }
    }
  };

  // Loading State
  if (loading) {
    return (
      <div className="max-w-md mx-auto min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center">
        <motion.div
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="w-20 h-20 rounded-2xl bg-[#16A34A] flex items-center justify-center text-white shadow-xl shadow-emerald-500/20 mb-5"
        >
          <MdQrCodeScanner className="w-10 h-10" />
        </motion.div>
        <h3 className="font-extrabold text-slate-900 text-lg">Loading Menu...</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-xs">
          Connecting to dining table telemetry and live menu
        </p>
      </div>
    );
  }

  // Closed State
  if (settings?.restaurantStatus === 'closed') {
    return (
      <div className="max-w-md mx-auto min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mb-3">
          <FiAlertCircle className="w-8 h-8" />
        </div>
        <h3 className="font-extrabold text-slate-900 text-lg">Restaurant Closed</h3>
        <p className="text-xs text-slate-500 max-w-xs mt-1 leading-relaxed">
          {restaurant?.restaurantName || 'This restaurant'} is currently closed and not accepting dining orders. Please visit during operating hours.
        </p>
      </div>
    );
  }

  // Paused State
  if (settings?.restaurantStatus === 'pause_orders' || settings?.acceptOrders === false) {
    return (
      <div className="max-w-md mx-auto min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
          <FiClock className="w-8 h-8" />
        </div>
        <h3 className="font-extrabold text-slate-900 text-lg">Orders Temporarily Paused</h3>
        <p className="text-xs text-slate-500 max-w-xs mt-1 leading-relaxed">
          The restaurant has temporarily paused taking new orders. Active dining table orders are continuing. Please check back shortly!
        </p>
        {activeOrder && (
          <button
            onClick={() => navigate(`/order/track/${activeOrder._id}`)}
            className="mt-5 px-5 py-2.5 rounded-xl bg-[#16A34A] text-white font-bold text-xs shadow-md"
          >
            View Your Active Order
          </button>
        )}
      </div>
    );
  }

  // Order Locked / Bill Requested State
  if (isOrderLocked || waitingForPayment) {
    return (
      <div className="max-w-md mx-auto min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
          <FiClock className="w-8 h-8" />
        </div>
        <h3 className="font-extrabold text-slate-900 text-lg">Bill Requested / Table Locked</h3>
        <p className="text-xs text-slate-500 max-w-xs mt-1 leading-relaxed">
          Your table bill has been requested or is awaiting settlement. Further ordering from this device is paused.
        </p>
        {activeOrder && (
          <button
            onClick={() => navigate(`/order/track/${activeOrder._id}`)}
            className="mt-5 px-5 py-2.5 rounded-xl bg-[#16A34A] text-white font-bold text-xs shadow-md"
          >
            Track Order & Settle Bill
          </button>
        )}
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="max-w-md mx-auto min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mb-3">
          <FiAlertCircle className="w-8 h-8" />
        </div>
        <h3 className="font-extrabold text-slate-900 text-lg">Menu Unavailable</h3>
        <p className="text-xs text-slate-500 max-w-xs mt-1 leading-relaxed">{error}</p>
        <button
          onClick={() => loadMenu(false)}
          className="mt-6 px-6 py-2.5 rounded-xl bg-[#16A34A] hover:bg-[#15803d] text-white font-bold text-xs shadow-md active:scale-95 transition-all cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md sm:max-w-2xl md:max-w-4xl xl:max-w-6xl mx-auto min-h-screen bg-[#F8FAFC] flex flex-col relative overflow-x-hidden shadow-2xl">
      {/* Offline Banner */}
      {isOffline && (
        <div className="bg-rose-500 text-white text-xs px-4 py-2 flex items-center justify-center gap-2 sticky top-0 z-50">
          <FiWifiOff className="w-4 h-4" />
          <span>You are offline. Please check your internet connection.</span>
        </div>
      )}

      {/* Top App Header */}
      <header className="bg-white px-4 pt-4 pb-3 border-b border-slate-100 sticky top-0 z-40 shadow-2xs w-full">
        <div className="flex items-center justify-between gap-3 w-full">
          {/* Logo & Restaurant Info */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <ImageWithFallback
              src={restaurant?.logo?.url}
              alt={restaurant?.restaurantName}
              type="logo"
              className="w-10 h-10 rounded-xl object-cover border border-slate-100 shadow-2xs shrink-0"
              fallbackContent={
                <div className="w-10 h-10 rounded-xl bg-[#16A34A] text-white flex items-center justify-center font-black text-sm shrink-0 shadow-2xs">
                  {restaurant?.restaurantName?.charAt(0) || 'C'}
                </div>
              }
            />

            <div className="min-w-0 flex-1">
              <h1 className="font-extrabold text-slate-900 text-base leading-tight truncate">
                {restaurant?.restaurantName ?? 'Craviti Restaurant'}
              </h1>
              {restaurant?.address?.city ? (
                <p className="text-sm text-slate-500 flex items-center gap-1 truncate">
                  <FiMapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                  <span className="truncate">{restaurant.address.city}</span>
                </p>
              ) : (
                <p className="text-sm text-slate-500 truncate">Contactless Dining</p>
              )}
            </div>
          </div>

          {/* Table Chip */}
          <div className="shrink-0 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-xl flex items-center gap-1.5 ml-auto">
            <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse shrink-0" />
            <span className="font-extrabold text-xs whitespace-nowrap">
              Table {table?.tableNumber || activeTable}
            </span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-3 relative w-full">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
          <input
            type="text"
            placeholder="Search delicious dishes, drinks, desserts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-10 pr-9 py-2.5 rounded-xl bg-slate-100/80 border border-slate-200/60 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/30 focus:bg-white transition-all box-border"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
            >
              <FiX className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* Busy Hour Status Alert */}
      {settings?.restaurantStatus === 'busy' && (
        <div className="bg-amber-500 text-white text-xs px-4 py-2 flex items-center justify-center gap-2 sticky top-[108px] z-36 font-bold shadow-xs">
          <FiClock className="w-4 h-4 shrink-0" />
          <span>High dining traffic today. Estimated preparation time ~{settings?.estimatedPreparationTime || 20} mins.</span>
        </div>
      )}

      {/* Sticky Active Order Mini-Banner (when ordering more) */}
      {activeOrder && dismissActivePrompt && (
        <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2 flex items-center justify-between text-xs text-emerald-950 sticky top-[108px] z-35">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
            <span className="font-bold">Active Bill: #{activeOrder.orderNumber}</span>
            <span className="text-emerald-700 text-[11px] hidden sm:inline">• Items will be added to this bill</span>
          </div>
          <button
            type="button"
            onClick={() => navigate(`/order/track/${activeOrder._id}`)}
            className="text-[11px] font-extrabold text-[#16A34A] hover:underline"
          >
            View Live Order →
          </button>
        </div>
      )}

      {/* Sticky Category Chips Horizontal Scroll */}
      {categories.length > 0 && (
        <div
          className={`bg-white/95 backdrop-blur-md px-3 py-2 border-b border-slate-100 sticky ${
            activeOrder && dismissActivePrompt ? 'top-[144px]' : 'top-[108px]'
          } z-30 overflow-x-auto scrollbar-none no-scrollbar flex gap-2 w-full max-w-full`}
        >
          <button
            type="button"
            onClick={() => handleCategoryClick('ALL')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
              activeCategory === 'ALL'
                ? 'bg-[#16A34A] text-white shadow-sm shadow-emerald-500/20'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Items
          </button>

          {(Array.isArray(categories) ? categories : []).map((cat) => (
            <button
              key={cat._id}
              type="button"
              onClick={() => handleCategoryClick(cat._id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                activeCategory === cat._id
                  ? 'bg-[#16A34A] text-white shadow-sm shadow-emerald-500/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.categoryName}
            </button>
          ))}
        </div>
      )}

      {/* Main Content Area with Adaptive Clearance for Persistent Sticky Bottom Checkout Bar */}
      <main className={`flex-1 p-4 ${totalCount > 0 ? 'pb-44 sm:pb-36' : 'pb-8'} space-y-6 w-full overflow-x-hidden`}>
        {menuItems.length === 0 ? (
          <div className="py-20 text-center px-4 space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-[#16A34A] border border-emerald-100 flex items-center justify-center mx-auto shadow-2xs">
              <MdRestaurantMenu className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="font-extrabold text-slate-800 text-base">Menu is being prepared.</h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                Please check back soon.
              </p>
            </div>
            <button
              type="button"
              onClick={() => loadMenu(false)}
              className="mt-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200/90 shadow-2xs transition-all inline-flex items-center gap-1.5 cursor-pointer"
            >
              Refresh Menu
            </button>
          </div>
        ) : (
          <>
            {/* Popular / Recommended Items */}
            {activeCategory === 'ALL' && !searchQuery.trim() && popularItems.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center gap-1.5">
                  <FiStar className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <h2 className="font-extrabold text-slate-900 text-sm">Chef's Recommendations</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {(Array.isArray(popularItems) ? popularItems : []).map((item) => (
                    <CustomerMenuCard
                      key={item._id}
                      item={item}
                      quantity={getItemQuantity(item._id)}
                      disabled={isPlacingOrder}
                      onAdd={handleAddToCart}
                      onUpdateQuantity={handleUpdateQuantity}
                      onOpenModal={handleOpenModal}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Grouped Section or Filtered Flat List */}
            {groupedItems ? (
              groupedItems.map(([catId, group]) => (
                <section
                  key={catId}
                  ref={(el) => (categorySectionRefs.current[catId] = el)}
                  className="space-y-3 pt-2"
                >
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-1.5">
                    <h3 className="font-extrabold text-slate-900 text-sm">{group.categoryName}</h3>
                    <span className="text-[11px] font-bold text-slate-400">
                      {group.items.length} {group.items.length === 1 ? 'item' : 'items'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {(Array.isArray(group?.items) ? group.items : []).map((item) => (
                      <CustomerMenuCard
                        key={item._id}
                        item={item}
                        quantity={getItemQuantity(item._id)}
                        disabled={isPlacingOrder}
                        onAdd={handleAddToCart}
                        onUpdateQuantity={handleUpdateQuantity}
                        onOpenModal={handleOpenModal}
                      />
                    ))}
                  </div>
                </section>
              ))
            ) : (
              <section className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-1.5">
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    {searchQuery ? `Search Results ("${searchQuery}")` : 'Menu Items'}
                  </h3>
                  <span className="text-[11px] font-bold text-slate-400">
                    {filteredItems.length} items
                  </span>
                </div>

                {filteredItems.length === 0 ? (
                  <div className="py-16 text-center">
                    <p className="text-slate-400 text-xs">No matching dishes found.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {(Array.isArray(filteredItems) ? filteredItems : []).map((item) => (
                      <CustomerMenuCard
                        key={item._id}
                        item={item}
                        quantity={getItemQuantity(item._id)}
                        disabled={isPlacingOrder}
                        onAdd={handleAddToCart}
                        onUpdateQuantity={handleUpdateQuantity}
                        onOpenModal={handleOpenModal}
                      />
                    ))}
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </main>

      {/* Craviti Customer Ordering Footer with Adaptive Clearance for Sticky Cart */}
      <CustomerFooter className={`w-full ${totalCount > 0 ? 'pb-36 sm:pb-28' : 'pb-10'}`} />

      {/* Persistent Sticky Bottom Checkout Section (Always Visible During Browsing) */}
      <AnimatePresence>
        {totalCount > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]"
          >
            <div className="max-w-md sm:max-w-2xl md:max-w-4xl xl:max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Left/Top: Items, Breakdown & Payment Selector */}
              <div className="flex items-center justify-between sm:justify-start gap-3 w-full sm:w-auto">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#16A34A] text-white flex items-center justify-center font-black text-sm shadow-sm shrink-0">
                    {totalCount}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-800">
                        {totalCount} {totalCount === 1 ? 'item' : 'items'}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        ({formatCurrency(subtotal)})
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-base font-black text-slate-900 leading-tight">
                        {formatCurrency(calculatedGrandTotal)}
                      </span>
                      {taxPercent > 0 && (
                        <span className="text-[10px] text-slate-400 font-semibold">
                          incl. {taxPercent}% GST
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick Payment Method Selector */}
                <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold shrink-0 ml-auto sm:ml-4">
                  <button
                    type="button"
                    disabled={isPlacingOrder}
                    onClick={() => setStickyPaymentMethod('cash')}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      stickyPaymentMethod === 'cash'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    💵 Cash
                  </button>
                  <button
                    type="button"
                    disabled={isPlacingOrder}
                    onClick={() => setStickyPaymentMethod('online')}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      stickyPaymentMethod === 'online'
                        ? 'bg-[#16A34A] text-white shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    💳 Online
                  </button>
                </div>
              </div>

              {/* Right/Bottom: View Details Drawer & Place Order CTA */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  disabled={isPlacingOrder}
                  onClick={() => setIsCartOpen(true)}
                  className="flex-1 sm:flex-initial py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <FiShoppingBag className="w-3.5 h-3.5" />
                  <span>View Details</span>
                </button>

                <button
                  type="button"
                  disabled={isPlacingOrder}
                  onClick={() => {
                    handlePlaceOrder({
                      paymentMethod: stickyPaymentMethod,
                    });
                  }}
                  className="flex-1 sm:flex-initial py-2.5 px-6 rounded-xl bg-[#16A34A] hover:bg-[#15803d] text-white font-extrabold text-xs shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer disabled:opacity-60 disabled:pointer-events-none"
                >
                  {isPlacingOrder ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <span>
                        {stickyPaymentMethod === 'cash' ? 'Place Order (Cash)' : 'Pay Online & Order'}
                      </span>
                      <FiArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Item Details Bottom Sheet Modal */}
      <CustomerItemModal
        item={selectedItem}
        isOpen={Boolean(selectedItem)}
        onClose={() => setSelectedItem(null)}
        onAddToCart={(item, qty, instructions) => addToCart(item, qty, instructions)}
      />

      {/* Cart Drawer Bottom Sheet */}
      <CustomerCartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        subtotal={subtotal}
        discount={discount}
        grandTotal={grandTotal}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeFromCart}
        onPlaceOrder={handlePlaceOrder}
        tableNumber={table?.tableNumber || activeTable}
        restaurantName={restaurant?.restaurantName || 'Restaurant'}
        isPlacingOrder={isPlacingOrder}
        hasActiveOrder={Boolean(activeOrder)}
        initialPaymentMethod={stickyPaymentMethod}
      />

      {/* Order Placed Success Modal */}
      <CustomerOrderSuccessModal
        isOpen={Boolean(placedOrder)}
        order={placedOrder}
        onTrackOrder={() => {
          const ordId = placedOrder._id;
          setPlacedOrder(null);
          navigate(`/order/track/${ordId}`);
        }}
        onOrderMore={() => {
          setPlacedOrder(null);
        }}
      />

      {/* QR Active Order Session Prompt */}
      <AnimatePresence>
        {activeOrder && !dismissActivePrompt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDismissActivePrompt(true)}
              className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm cursor-pointer"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 text-center z-10 overflow-hidden"
            >
              {/* Close (X) Button */}
              <button
                type="button"
                onClick={() => setDismissActivePrompt(true)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors z-20"
                aria-label="Close"
              >
                <FiX className="w-5 h-5" />
              </button>

              <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-[#16A34A] flex items-center justify-center mx-auto mb-4 border border-emerald-100 shadow-inner">
                <MdRestaurantMenu className="w-8 h-8" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#16A34A] bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                Active Dining Table
              </span>
              <h3 className="text-xl font-black text-slate-900 mt-2">
                You already have an active order.
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Order <strong>#{activeOrder.orderNumber}</strong> is active on Table {table?.tableNumber || activeTable}.
              </p>

              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 my-4 text-xs space-y-1.5 text-left">
                <div className="flex justify-between">
                  <span className="text-slate-400">Current Status:</span>
                  <span className="font-bold text-slate-800 capitalize">{activeOrder.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Current Total:</span>
                  <span className="font-extrabold text-[#16A34A]">{formatCurrency(activeOrder.grandTotal)}</span>
                </div>
              </div>

              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => navigate(`/order/track/${activeOrder._id}`)}
                  className="w-full py-3.5 px-4 rounded-xl bg-[#16A34A] hover:bg-[#15803d] text-white font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse shrink-0" />
                  <span>Watch Live Order</span>
                  <FiArrowRight className="w-4 h-4 ml-0.5" />
                </button>

                <button
                  type="button"
                  onClick={() => setDismissActivePrompt(true)}
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <FiPlus className="w-3.5 h-3.5" />
                  <span>Order More</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const CustomerMenu = () => {
  const { restaurantSlug, tableNumber, tableId } = useParams();
  const activeTable = tableNumber || tableId || '1';
  const storageKey = `craviti_cart_${restaurantSlug}_${activeTable}`;

  return (
    <CustomerCartProvider storageKey={storageKey}>
      <CustomerMenuContent />
    </CustomerCartProvider>
  );
};

export default CustomerMenu;
