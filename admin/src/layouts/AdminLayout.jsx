import { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useLocation, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import {
  FiMenu,
  FiX,
  FiSearch,
  FiBell,
  FiChevronDown,
  FiLogOut,
  FiUser,
  FiShield,
  FiExternalLink,
  FiChevronRight,
  FiHome,
  FiCheck,
  FiAlertTriangle,
  FiClock,
} from 'react-icons/fi';
import { MdQrCodeScanner } from 'react-icons/md';
import { SIDEBAR_NAV_ITEMS, ROLE_COLORS } from '../constants';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import {
  globalSearchApi,
  fetchAdminNotificationsApi,
  markAdminNotificationReadApi,
  markAllAdminNotificationsReadApi,
} from '../services/adminService';
import { safeString, formatDate } from '../utils/formatters';
import toast from 'react-hot-toast';

export const AdminLayout = () => {
  const { admin, logout } = useAdminAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // Global Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  // Notification Center State
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifLoading, setNotifLoading] = useState(false);

  // Support Mode Inspection Banner
  const [supportModeData, setSupportModeData] = useState(() => {
    try {
      const stored = sessionStorage.getItem('support_mode');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const searchRef = useRef(null);
  const profileRef = useRef(null);
  const notifRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch notifications
  const loadNotifications = async () => {
    try {
      setNotifLoading(true);
      const res = await fetchAdminNotificationsApi({ limit: 10 });
      if (res.success && res.data) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setNotifLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();

    const backendUrl =
      import.meta.env.VITE_SOCKET_URL ||
      import.meta.env.VITE_BACKEND_URL ||
      (import.meta.env.VITE_API_URL
        ? import.meta.env.VITE_API_URL.replace(/\/api.*$/, '')
        : 'https://cravti.onrender.com');

    const socket = io(backendUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socket.emit('join-admin');

    // Real-time notification receiver (Phase 4.2)
    socket.on('notification.created', (payload) => {
      if (payload?.type === 'ADMIN' && payload?.notification) {
        setNotifications((prev) => [payload.notification, ...prev]);
        setUnreadCount((c) => c + 1);
        toast(payload.notification.title || 'New Admin Alert', {
          icon: '🔔',
          duration: 4000,
        });
      }
    });

    socket.on('restaurant.updated', (payload) => {
      toast(`Restaurant "${payload?.data?.restaurant?.restaurantName || 'Merchant'}" updated profile`, {
        icon: '🏪',
        duration: 3500,
      });
    });

    socket.on('order.created', (order) => {
      toast(`New order #${order?.orderNumber || 'CRV'} received`, {
        icon: '🛍️',
        duration: 3000,
      });
    });

    socket.on('restaurant.bank.updated', (payload) => {
      if (payload?.data?.status === 'submitted') {
        toast(`New bank verification submitted`, {
          icon: '🏦',
          duration: 4000,
        });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Mark single notification read
  const handleMarkRead = async (id, link) => {
    try {
      await markAdminNotificationReadApi(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      if (link) {
        setNotificationsOpen(false);
        navigate(link);
      }
    } catch (err) {
      console.error('Mark read failed:', err);
    }
  };

  // Mark all notifications read
  const handleMarkAllRead = async () => {
    try {
      await markAllAdminNotificationsReadApi();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    }
  };

  // Exit Support Mode
  const handleExitSupportMode = () => {
    sessionStorage.removeItem('support_mode');
    setSupportModeData(null);
    toast.success('Exited Support Mode');
  };

  // Global search debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setSearchLoading(true);
        const res = await globalSearchApi(searchQuery);
        if (res.success && res.data) {
          setSearchResults(res.data);
          setSearchOpen(true);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setSearchLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const pathSegments = location.pathname.split('/').filter(Boolean);
  const currentNav = SIDEBAR_NAV_ITEMS.find((item) => item.path === location.pathname);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col">
      {/* Support Mode Top Warning Banner */}
      {supportModeData && (
        <div className="bg-gradient-to-r from-purple-700 to-indigo-800 text-white px-6 py-2.5 flex items-center justify-between text-xs font-bold sticky top-0 z-50 shadow-md">
          <div className="flex items-center gap-2.5">
            <FiShield className="w-4 h-4 text-purple-200 animate-pulse" />
            <span>
              VIEWING RESTAURANT: <u>{supportModeData.restaurantName}</u> — READ-ONLY SUPPORT MODE
            </span>
          </div>
          <button
            type="button"
            onClick={handleExitSupportMode}
            className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-white font-extrabold text-[11px] transition-all"
          >
            Exit Support Mode
          </button>
        </div>
      )}

      <div className="flex-1 flex">
        {/* Mobile/Tablet Sidebar Backdrop */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-xs"
            />
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <aside
          className={`fixed top-0 bottom-0 left-0 w-64 bg-white border-r border-slate-200 z-50 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } ${supportModeData ? 'top-10' : ''}`}
        >
          {/* Brand Header */}
          <div className="h-16 px-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                <MdQrCodeScanner className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-base tracking-tight text-[#0F172A] block leading-tight">
                  CRAVITI
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block">
                  Platform Admin
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 lg:hidden"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
            {SIDEBAR_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Bottom Current Admin Strip */}
          <div className="p-3 border-t border-slate-100 bg-slate-50/60">
            <div className="flex items-center gap-3 p-2 rounded-xl bg-white border border-slate-200/60 shadow-2xs">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs shrink-0 overflow-hidden">
                {admin?.avatar ? (
                  <img src={admin.avatar} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  safeString(admin?.name?.charAt(0), 'A')
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-[#0F172A] truncate leading-tight">{admin?.name}</p>
                <span
                  className={`inline-block text-[9px] font-extrabold uppercase tracking-wide px-1.5 py-0.2 rounded border ${
                    ROLE_COLORS[admin?.role] || 'bg-slate-50 text-slate-700'
                  }`}
                >
                  {admin?.role || 'ADMIN'}
                </span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Container */}
        <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
          {/* Top Navbar */}
          <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between gap-4 shadow-2xs">
            <div className="flex items-center gap-3 flex-1 max-w-lg">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 lg:hidden"
              >
                <FiMenu className="w-5 h-5" />
              </button>

              {/* Enhanced Global Search Bar */}
              <div ref={searchRef} className="relative w-full">
                <div className="relative">
                  <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => searchResults && setSearchOpen(true)}
                    placeholder="Search restaurants, owners, phones, orders..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                  />
                </div>

                {/* Enhanced Categorized Results Dropdown */}
                <AnimatePresence>
                  {searchOpen && searchResults && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 z-50 max-h-96 overflow-y-auto"
                    >
                      {searchLoading && (
                        <p className="text-xs text-slate-400 p-2 text-center">Searching database...</p>
                      )}

                      {/* Restaurants Category */}
                      {Array.isArray(searchResults.restaurants) && searchResults.restaurants.length > 0 && (
                        <div className="mb-3">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 block mb-1">
                            Restaurants ({searchResults.restaurants.length})
                          </span>
                          {searchResults.restaurants.map((r) => (
                            <div
                              key={r._id}
                              onClick={() => {
                                navigate(`/restaurants/${r._id}`);
                                setSearchOpen(false);
                              }}
                              className="p-2 hover:bg-blue-50 rounded-xl cursor-pointer flex items-center justify-between text-xs"
                            >
                              <div>
                                <p className="font-bold text-slate-900">{r.restaurantName}</p>
                                <p className="text-[11px] text-slate-500">
                                  {r.ownerName} • {r.ownerPhone}
                                </p>
                              </div>
                              <span className="text-[10px] font-bold text-blue-600 bg-blue-100/60 px-2 py-0.5 rounded">
                                {r.verificationStatus}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Orders Category */}
                      {Array.isArray(searchResults.orders) && searchResults.orders.length > 0 && (
                        <div className="mb-3">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 block mb-1">
                            Orders ({searchResults.orders.length})
                          </span>
                          {searchResults.orders.map((o) => (
                            <div
                              key={o._id}
                              onClick={() => {
                                navigate('/orders');
                                setSearchOpen(false);
                              }}
                              className="p-2 hover:bg-blue-50 rounded-xl cursor-pointer flex items-center justify-between text-xs"
                            >
                              <div>
                                <p className="font-bold text-slate-900">
                                  #{o.orderNumber} (Table {o.tableNumber})
                                </p>
                                <p className="text-[11px] text-slate-500">
                                  {o.restaurantId?.restaurantName || 'Restaurant'}
                                </p>
                              </div>
                              <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded capitalize">
                                {o.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Receipts Category */}
                      {Array.isArray(searchResults.receipts) && searchResults.receipts.length > 0 && (
                        <div className="mb-3">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 block mb-1">
                            Receipts ({searchResults.receipts.length})
                          </span>
                          {searchResults.receipts.map((rcp) => (
                            <div
                              key={rcp._id}
                              onClick={() => {
                                navigate('/orders');
                                setSearchOpen(false);
                              }}
                              className="p-2 hover:bg-blue-50 rounded-xl cursor-pointer flex items-center justify-between text-xs"
                            >
                              <div>
                                <p className="font-mono font-bold text-slate-900">{rcp.receiptNumber}</p>
                                <p className="text-[11px] text-slate-500">Order: {rcp.orderNumber}</p>
                              </div>
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                                ₹{rcp.grandTotal}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Tickets Category */}
                      {Array.isArray(searchResults.tickets) && searchResults.tickets.length > 0 && (
                        <div className="mb-3">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 block mb-1">
                            Support Tickets ({searchResults.tickets.length})
                          </span>
                          {searchResults.tickets.map((t) => (
                            <div
                              key={t._id}
                              onClick={() => {
                                navigate('/support');
                                setSearchOpen(false);
                              }}
                              className="p-2 hover:bg-blue-50 rounded-xl cursor-pointer flex items-center justify-between text-xs"
                            >
                              <div>
                                <p className="font-mono font-bold text-slate-900">{t.ticketNumber}</p>
                                <p className="text-[11px] text-slate-500">{t.subject}</p>
                              </div>
                              <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded uppercase">
                                {t.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Invoices Category */}
                      {Array.isArray(searchResults.invoices) && searchResults.invoices.length > 0 && (
                        <div className="mb-3">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 block mb-1">
                            Billing Invoices ({searchResults.invoices.length})
                          </span>
                          {searchResults.invoices.map((inv) => (
                            <div
                              key={inv._id}
                              onClick={() => {
                                navigate('/billing');
                                setSearchOpen(false);
                              }}
                              className="p-2 hover:bg-blue-50 rounded-xl cursor-pointer flex items-center justify-between text-xs"
                            >
                              <div>
                                <p className="font-mono font-bold text-slate-900">{inv.invoiceNumber}</p>
                                <p className="text-[11px] text-slate-500">{inv.restaurantId?.restaurantName || 'Tenant'}</p>
                              </div>
                              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                                ₹{inv.totalAmount}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Announcements Category */}
                      {Array.isArray(searchResults.announcements) && searchResults.announcements.length > 0 && (
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 block mb-1">
                            Announcements ({searchResults.announcements.length})
                          </span>
                          {searchResults.announcements.map((ann) => (
                            <div
                              key={ann._id}
                              onClick={() => {
                                navigate('/announcements');
                                setSearchOpen(false);
                              }}
                              className="p-2 hover:bg-blue-50 rounded-xl cursor-pointer flex items-center justify-between text-xs"
                            >
                              <div>
                                <p className="font-bold text-slate-900">{ann.title}</p>
                                <p className="text-[11px] text-slate-500 capitalize">{ann.type?.replace(/_/g, ' ')}</p>
                              </div>
                              <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded capitalize">
                                {ann.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {searchResults.restaurants?.length === 0 &&
                        searchResults.orders?.length === 0 &&
                        searchResults.receipts?.length === 0 &&
                        searchResults.tickets?.length === 0 &&
                        searchResults.invoices?.length === 0 && (
                          <p className="text-xs text-slate-400 p-4 text-center">No matching records found.</p>
                        )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Right Header Icons & Profile */}
            <div className="flex items-center gap-3">
              {/* Notification Center Popover */}
              <div ref={notifRef} className="relative">
                <button
                  type="button"
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors relative"
                  title="Platform Notifications"
                >
                  <FiBell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-blue-600 text-white font-extrabold text-[10px] ring-2 ring-white">
                      {unreadCount}
                    </span>
                  )}
                </button>

                <AnimatePresence>
                  {notificationsOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 5 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 5 }}
                      className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden"
                    >
                      <div className="p-3.5 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-[#0F172A]">Notifications</span>
                          {unreadCount > 0 && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[10px] font-bold">
                              {unreadCount} unread
                            </span>
                          )}
                        </div>
                        {unreadCount > 0 && (
                          <button
                            type="button"
                            onClick={handleMarkAllRead}
                            className="text-[11px] font-bold text-blue-600 hover:underline"
                          >
                            Mark all as read
                          </button>
                        )}
                      </div>

                      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 text-xs">
                        {notifLoading && (
                          <p className="p-4 text-center text-slate-400 text-xs">Loading notifications...</p>
                        )}
                        {!notifLoading && notifications.length === 0 && (
                          <p className="p-6 text-center text-slate-400 text-xs">No notifications yet.</p>
                        )}
                        {!notifLoading &&
                          notifications.map((item) => (
                            <div
                              key={item._id}
                              onClick={() => handleMarkRead(item._id, item.link)}
                              className={`p-3.5 hover:bg-slate-50 cursor-pointer transition-colors ${
                                !item.isRead ? 'bg-blue-50/30' : ''
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <span className="font-bold text-slate-900 block leading-tight">
                                  {item.title}
                                </span>
                                {!item.isRead && (
                                  <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1" />
                                )}
                              </div>
                              <p className="text-[11px] text-slate-600 mt-1 font-medium leading-relaxed">
                                {item.message}
                              </p>
                              <span className="text-[10px] text-slate-400 font-mono mt-1.5 block">
                                {formatDate(item.createdAt)}
                              </span>
                            </div>
                          ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Profile Dropdown */}
              <div ref={profileRef} className="relative">
                <button
                  type="button"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-xs overflow-hidden shadow-xs">
                    {admin?.avatar ? (
                      <img src={admin.avatar} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      safeString(admin?.name?.charAt(0), 'A')
                    )}
                  </div>
                  <div className="hidden sm:block text-left">
                    <span className="text-xs font-bold text-[#0F172A] block leading-tight">
                      {admin?.name}
                    </span>
                    <span className="text-[10px] text-slate-400 block">{admin?.role}</span>
                  </div>
                  <FiChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
                </button>

                <AnimatePresence>
                  {profileDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 5 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 5 }}
                      className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50"
                    >
                      <div className="px-4 py-2.5 border-b border-slate-100">
                        <p className="text-xs font-bold text-[#0F172A]">{admin?.name}</p>
                        <p className="text-[11px] text-slate-500 truncate">{admin?.email}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          navigate('/profile');
                          setProfileDropdownOpen(false);
                        }}
                        className="w-full px-4 py-2.5 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors font-medium"
                      >
                        <FiUser className="w-4 h-4 text-slate-400" />
                        <span>My Profile & Login History</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          navigate('/settings');
                          setProfileDropdownOpen(false);
                        }}
                        className="w-full px-4 py-2.5 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors font-medium"
                      >
                        <FiShield className="w-4 h-4 text-slate-400" />
                        <span>Platform Settings</span>
                      </button>

                      <div className="border-t border-slate-100 my-1" />

                      <button
                        type="button"
                        onClick={() => {
                          logout();
                          navigate('/login');
                        }}
                        className="w-full px-4 py-2.5 text-left text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors font-bold"
                      >
                        <FiLogOut className="w-4 h-4 text-rose-500" />
                        <span>Log Out</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </header>

          {/* Breadcrumb Bar */}
          <div className="px-6 py-2.5 bg-white border-b border-slate-200/60 flex items-center gap-1.5 text-xs text-slate-500">
            <NavLink to="/" className="hover:text-blue-600 flex items-center gap-1">
              <FiHome className="w-3.5 h-3.5" />
              <span>Admin</span>
            </NavLink>
            {pathSegments.length > 0 && <FiChevronRight className="w-3 h-3 text-slate-300" />}
            {currentNav && <span className="font-bold text-slate-900">{currentNav.label}</span>}
          </div>

          {/* Content Outlet */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};
