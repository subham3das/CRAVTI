import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiBox,
  FiCheckCircle,
  FiClock,
  FiSlash,
  FiShoppingBag,
  FiDollarSign,
  FiActivity,
  FiArrowRight,
  FiUsers,
  FiTrendingUp,
  FiStar,
  FiFileText,
  FiCreditCard,
  FiHelpCircle,
  FiShield,
  FiGrid,
  FiList,
} from 'react-icons/fi';
import { MdQrCodeScanner } from 'react-icons/md';
import { fetchBusinessDashboardApi } from '../services/adminService';
import { formatCurrency, safeNumber } from '../utils/formatters';
import { Skeleton } from '../components/Skeleton';
import toast from 'react-hot-toast';

export const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const loadStats = async () => {
      try {
        setLoading(true);
        const res = await fetchBusinessDashboardApi();
        if (isMounted && res?.success) {
          const statsData = res.data || res;
          if (statsData) {
            setStats(statsData);
          }
        }
      } catch (err) {
        console.error('Failed to load dashboard metrics:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadStats();
    return () => {
      isMounted = false;
    };
  }, []);

  const d = stats || {};

  // All metrics organized with direct click targets
  const metricCards = [
    {
      label: 'Total Restaurants',
      value: safeNumber(d.totalRestaurants, 0),
      sub: 'All tenant accounts',
      icon: FiBox,
      color: 'bg-blue-50 text-blue-700 border-blue-200',
      to: '/restaurants',
    },
    {
      label: 'Active Restaurants',
      value: safeNumber(d.activeRestaurants, 0),
      sub: 'Operating normally',
      icon: FiCheckCircle,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      to: '/restaurants?status=active',
    },
    {
      label: 'Suspended Restaurants',
      value: safeNumber(d.suspendedRestaurants, 0),
      sub: 'Disabled / on hold',
      icon: FiSlash,
      color: 'bg-rose-50 text-rose-700 border-rose-200',
      to: '/restaurants?status=disabled',
    },
    {
      label: 'Pending Verification',
      value: safeNumber(d.pendingVerification, 0),
      sub: 'Requires compliance review',
      icon: FiClock,
      color: 'bg-amber-50 text-amber-700 border-amber-200',
      to: '/verification',
    },
    {
      label: "Today's Orders",
      value: safeNumber(d.todayOrders, 0),
      sub: 'Dining transactions placed',
      icon: FiShoppingBag,
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      to: '/orders',
    },
    {
      label: "Today's Revenue",
      value: formatCurrency(d.todayRevenue || 0),
      sub: 'Gross settled sales',
      icon: FiDollarSign,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      to: '/revenue',
    },
    {
      label: 'Monthly Revenue',
      value: formatCurrency(d.monthlyRevenue || 0),
      sub: 'This calendar month',
      icon: FiTrendingUp,
      color: 'bg-cyan-50 text-cyan-700 border-cyan-200',
      to: '/revenue',
    },
    {
      label: 'Platform Commission',
      value: formatCurrency(d.platformCommission || 0),
      sub: 'Platform net commission fee',
      icon: FiCreditCard,
      color: 'bg-purple-50 text-purple-700 border-purple-200',
      to: '/revenue',
    },
    {
      label: 'Average Order Value',
      value: formatCurrency(d.averageOrderValue || 0),
      sub: 'Per completed bill',
      icon: FiActivity,
      color: 'bg-teal-50 text-teal-700 border-teal-200',
      to: '/analytics',
    },
    {
      label: 'Live Orders',
      value: safeNumber(d.liveOrders, 0),
      sub: 'Currently in kitchen / active table',
      icon: FiActivity,
      color: 'bg-orange-50 text-orange-700 border-orange-200',
      to: '/orders',
    },
    {
      label: 'QR Scans Today',
      value: safeNumber(d.qrScansToday, 0),
      sub: 'Guest sessions initiated',
      icon: MdQrCodeScanner,
      color: 'bg-blue-50 text-blue-700 border-blue-200',
      to: '/orders',
    },
    {
      label: 'New Restaurants (Month)',
      value: safeNumber(d.newRestaurantsMonth, 0),
      sub: 'Joined this month',
      icon: FiBox,
      color: 'bg-sky-50 text-sky-700 border-sky-200',
      to: '/restaurants',
    },
    {
      label: 'Total Customers',
      value: safeNumber(d.totalCustomers, 0),
      sub: 'Unique guest accounts',
      icon: FiUsers,
      color: 'bg-slate-100 text-slate-800 border-slate-200',
      to: '/orders',
    },
    {
      label: 'Active Customers',
      value: safeNumber(d.activeCustomers, 0),
      sub: 'Dining in last 30 days',
      icon: FiUsers,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      to: '/orders',
    },
    {
      label: 'Repeat Customer %',
      value: `${safeNumber(d.repeatCustomerPercent, 0)}%`,
      sub: 'Multi-order diners',
      icon: FiTrendingUp,
      color: 'bg-violet-50 text-violet-700 border-violet-200',
      to: '/analytics',
    },
    {
      label: 'Average Restaurant Rating',
      value: `${safeNumber(d.averageRestaurantRating, 4.8)} ★`,
      sub: 'Platform wide satisfaction',
      icon: FiStar,
      color: 'bg-amber-50 text-amber-700 border-amber-200',
      to: '/restaurants',
    },
    {
      label: 'Total Tables',
      value: safeNumber(d.totalTables, 0),
      sub: 'Deployed QR tables',
      icon: FiGrid,
      color: 'bg-slate-100 text-slate-800 border-slate-200',
      to: '/restaurants',
    },
    {
      label: 'Total Menu Items',
      value: safeNumber(d.totalMenuItems, 0),
      sub: 'Live dishes across catalog',
      icon: FiList,
      color: 'bg-slate-100 text-slate-800 border-slate-200',
      to: '/restaurants',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Platform Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">
            Platform Management & Operations
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time business telemetry, multi-tenant billing, and platform health
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/revenue"
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
          >
            <FiDollarSign className="w-3.5 h-3.5" />
            Revenue Center
          </Link>

          <Link
            to="/health"
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <FiActivity className="w-3.5 h-3.5" />
            System Health
          </Link>
        </div>
      </div>

      {/* 18 Clickable Business Metrics Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 18 }).map((_, i) => (
            <div key={i} className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-7 w-3/4" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {metricCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.02 }}
                onClick={() => navigate(card.to)}
                className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tight block">
                      {card.label}
                    </span>
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center border text-xs shrink-0 ${card.color}`}>
                      {Icon && <Icon className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                  <span className="text-xl font-black text-[#0F172A] block tracking-tight group-hover:text-blue-600 transition-colors">
                    {card.value}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-medium block mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span>{card.sub}</span>
                  <FiArrowRight className="w-3 h-3 text-slate-300 group-hover:text-blue-600 transition-colors" />
                </span>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Quick Navigation Panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
        {/* Subscriptions Panel */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#0F172A] uppercase tracking-wider">
              SaaS Subscriptions
            </h2>
            <Link to="/subscriptions" className="text-xs font-bold text-blue-600 hover:underline">
              Manage Plans →
            </Link>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Configure Starter, Professional, and Enterprise tenant tiers, table limits, and plan overrides.
          </p>
        </div>

        {/* Support Tickets Panel */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#0F172A] uppercase tracking-wider">
              Support Center
            </h2>
            <Link to="/support" className="text-xs font-bold text-blue-600 hover:underline">
              Open Tickets →
            </Link>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Resolve merchant inquiries across QR codes, payouts, onboarding verification, and bugs.
          </p>
        </div>

        {/* Announcement Broadcast Panel */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#0F172A] uppercase tracking-wider">
              Announcements
            </h2>
            <Link to="/announcements" className="text-xs font-bold text-blue-600 hover:underline">
              Send Broadcast →
            </Link>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Publish platform upgrades, maintenance schedules, and feature alerts to all restaurants.
          </p>
        </div>
      </div>
    </div>
  );
};
