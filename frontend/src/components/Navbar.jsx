import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import {
  FiMenu,
  FiBell,
  FiCheckCircle,
  FiAlertCircle,
  FiCreditCard,
  FiStar,
  FiVolume2,
  FiMessageSquare,
  FiShield,
  FiCheck,
  FiClock,
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { RESTAURANT_INFO } from '../constants/navigation';
import {
  fetchRestaurantNotificationsApi,
  markRestaurantNotificationReadApi,
  markAllRestaurantNotificationsReadApi,
} from '../services/notificationService';
import { playOrderChime } from '../utils/soundNotification';
import toast from 'react-hot-toast';

export const Navbar = ({ onOpenSidebar }) => {
  const { user, restaurant } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifLoading, setNotifLoading] = useState(false);

  const notifRef = useRef(null);

  const displayName = restaurant?.restaurantName || user?.restaurantName || RESTAURANT_INFO.name;
  const branchName = restaurant?.address?.city || RESTAURANT_INFO.branch;
  const logoUrl = restaurant?.logo?.url;

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch initial notifications
  const loadNotifications = async () => {
    if (!restaurant?._id) return;
    try {
      setNotifLoading(true);
      const res = await fetchRestaurantNotificationsApi({ limit: 15 });
      if (res.success && res.data) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      console.warn('Could not load notifications:', err.message);
    } finally {
      setNotifLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [restaurant?._id]);

  // Zero-polling real-time socket listener for notifications & cross-panel events
  useEffect(() => {
    const restaurantId = restaurant?._id;
    if (!restaurantId) return;

    const backendUrl =
      import.meta.env.VITE_SOCKET_URL ||
      import.meta.env.VITE_BACKEND_URL ||
      (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api.*$/, '') : 'https://cravti.onrender.com');

    const socket = io(backendUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socket.emit('join-restaurant', restaurantId);

    // Real-time notification receiver
    socket.on('notification.created', (payload) => {
      if (payload?.notification) {
        setNotifications((prev) => [payload.notification, ...prev]);
        setUnreadCount((c) => c + 1);

        if (settings?.notificationSound !== false) {
          playOrderChime();
        }
        toast(payload.notification.title || 'New Notification', {
          icon: '🔔',
          duration: 4000,
        });
      }
    });

    // Real-time synchronization events
    socket.on('restaurant.approved', () => {
      toast.success('Your restaurant account has been officially verified & approved!');
    });

    socket.on('restaurant.rejected', (data) => {
      toast.error(`Verification rejected: ${data?.reason || 'Compliance criteria not met'}`);
    });

    socket.on('announcement.created', (data) => {
      toast(data?.announcement?.title || 'Platform Announcement', {
        icon: '📢',
        duration: 5000,
      });
    });

    socket.on('maintenance.enabled', () => {
      toast('Platform maintenance mode is currently active.', {
        icon: '⚠️',
        duration: 6000,
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [restaurant?._id, settings?.notificationSound]);

  const handleMarkRead = async (notif) => {
    if (notif.isRead) {
      if (notif.link) {
        navigate(notif.link);
        setNotificationsOpen(false);
      }
      return;
    }

    try {
      await markRestaurantNotificationReadApi(notif._id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      if (notif.link) {
        navigate(notif.link);
        setNotificationsOpen(false);
      }
    } catch (e) {
      console.warn('Failed to mark read:', e.message);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllRestaurantNotificationsReadApi();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (e) {
      console.warn('Failed to mark all read:', e.message);
    }
  };

  const getNotifIcon = (type) => {
    switch (type) {
      case 'APPROVAL':
        return <FiCheckCircle className="w-4 h-4 text-emerald-600" />;
      case 'REJECTION':
        return <FiAlertCircle className="w-4 h-4 text-rose-600" />;
      case 'PAYMENT':
        return <FiCreditCard className="w-4 h-4 text-emerald-600" />;
      case 'SUBSCRIPTION':
        return <FiStar className="w-4 h-4 text-purple-600" />;
      case 'ANNOUNCEMENT':
        return <FiVolume2 className="w-4 h-4 text-blue-600" />;
      case 'SUPPORT_REPLY':
        return <FiMessageSquare className="w-4 h-4 text-cyan-600" />;
      case 'VERIFICATION':
        return <FiShield className="w-4 h-4 text-amber-600" />;
      case 'MAINTENANCE':
        return <FiAlertCircle className="w-4 h-4 text-orange-600" />;
      default:
        return <FiBell className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between">
      {/* Left: Mobile Menu Toggle & Restaurant Identity */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 focus:outline-none"
        >
          <FiMenu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={displayName}
              className="w-8 h-8 rounded-lg object-cover border border-slate-200"
            />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#16A34A] font-bold text-sm">
              {displayName.charAt(0)}
            </div>
          )}
          <div>
            <h2 className="text-sm font-semibold text-slate-900 leading-tight">
              {displayName}
            </h2>
            <p className="text-[11px] text-slate-400 font-medium">
              {branchName}
            </p>
          </div>
        </div>
      </div>

      {/* Right: Notifications & Profile Avatar */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Global Notification Center Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            title="Notifications"
          >
            <FiBell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#16A34A] text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Floating Dropdown Panel */}
          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200/90 z-50 overflow-hidden flex flex-col">
              <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-slate-900">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="text-[11px] font-semibold text-[#16A34A] hover:underline flex items-center gap-1"
                  >
                    <FiCheck className="w-3 h-3" />
                    <span>Mark all read</span>
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifLoading && notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">Loading notifications...</div>
                ) : notifications.length === 0 ? (
                  <div className="p-8 text-center space-y-1">
                    <FiBell className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs font-bold text-slate-700">No Notifications</p>
                    <p className="text-[11px] text-slate-400">You are all caught up with alerts and approvals.</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n._id}
                      onClick={() => handleMarkRead(n)}
                      className={`p-3 flex items-start gap-3 transition-colors cursor-pointer hover:bg-slate-50 ${
                        !n.isRead ? 'bg-emerald-50/30' : ''
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                        {getNotifIcon(n.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className={`text-xs truncate ${!n.isRead ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                            {n.title}
                          </h4>
                          {!n.isRead && (
                            <span className="w-2 h-2 rounded-full bg-[#16A34A] shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                          {n.message}
                        </p>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-1 font-mono">
                          <FiClock className="w-3 h-3" />
                          {new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-slate-200" />

        {/* Profile Avatar */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-semibold text-xs ring-2 ring-emerald-500/20">
            {restaurant?.ownerName?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || 'A'}
          </div>
          <div className="hidden md:block text-left">
            <span className="text-xs font-semibold text-slate-800 block leading-tight">
              {restaurant?.ownerName || user?.email?.split('@')[0] || 'Manager'}
            </span>
            <span className="text-[10px] text-slate-400 uppercase font-medium">
              {user?.role || 'Owner'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
