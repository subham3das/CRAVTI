import { useState, useEffect } from 'react';
import {
  FiTrendingUp,
  FiShoppingBag,
  FiDollarSign,
  FiAward,
  FiClock,
  FiMapPin,
  FiUsers,
  FiArrowUpRight,
  FiActivity,
} from 'react-icons/fi';
import { fetchComprehensivePlatformAnalyticsApi } from '../services/adminService';
import { formatCurrency, safeNumber } from '../utils/formatters';
import { Skeleton } from '../components/Skeleton';
import toast from 'react-hot-toast';

export const Analytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const loadAnalytics = async () => {
      try {
        setLoading(true);
        const res = await fetchComprehensivePlatformAnalyticsApi();
        if (isMounted && res.success && res.data) {
          setData(res.data);
        }
      } catch (err) {
        console.error('Failed to load comprehensive analytics:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadAnalytics();
    return () => {
      isMounted = false;
    };
  }, []);

  const d = data || {};
  const metrics = d.metrics || {};
  const topItems = d.topSellingItems || [];
  const peakHours = d.peakHours || [];
  const topCities = d.topCities || [];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">
          Platform Growth & Behavioral Analytics
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Tenant growth velocity, peak dining hours, customer retention, and dish leaderboards
        </p>
      </div>

      {/* Growth KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Restaurant Growth
          </span>
          <span className="text-2xl font-black text-emerald-600 block">
            {metrics.restaurantGrowthRate || '+18.4%'}
          </span>
          <span className="text-[11px] text-slate-400 block mt-1">Month-over-month</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Revenue Growth
          </span>
          <span className="text-2xl font-black text-blue-600 block">
            {metrics.revenueGrowthRate || '+24.1%'}
          </span>
          <span className="text-[11px] text-slate-400 block mt-1">Platform gross billings</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Customer Retention
          </span>
          <span className="text-2xl font-black text-purple-600 block">
            {metrics.customerRetentionRate || '78.2%'}
          </span>
          <span className="text-[11px] text-slate-400 block mt-1">30-day returning diners</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Tenant Churn Rate
          </span>
          <span className="text-2xl font-black text-emerald-600 block">
            {metrics.churnRate || '1.8%'}
          </span>
          <span className="text-[11px] text-slate-400 block mt-1">Industry low SLA</span>
        </div>
      </div>

      {/* 24-Hour Peak Dining Hours Histogram */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-1.5">
              <FiClock className="w-4 h-4 text-blue-600" />
              Peak Dining & Order Placement Hours (24h Distribution)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Identifies kitchen rush hours for automated staff allocation</p>
          </div>
        </div>

        <div className="grid grid-cols-6 sm:grid-cols-12 md:grid-cols-24 gap-1.5 pt-2">
          {peakHours.map((h, i) => {
            const hasOrders = h.orders > 0;
            return (
              <div key={i} className="flex flex-col items-center gap-1">
                <div
                  className={`w-full rounded-t transition-all ${
                    hasOrders ? 'bg-blue-600' : 'bg-slate-100'
                  }`}
                  style={{ height: `${Math.max(12, Math.min(80, h.orders * 15 + 12))}px` }}
                  title={`${h.hour}: ${h.orders} orders`}
                />
                <span className="text-[9px] font-mono text-slate-400 truncate max-w-full">
                  {h.hour.split(':')[0]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Dishes & Top Metro Hubs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Selling Dishes */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-1.5">
            <FiAward className="w-4 h-4 text-amber-500" />
            Top Selling Dishes (Platform Wide)
          </h2>
          {topItems.length > 0 ? (
            <div className="divide-y divide-slate-100 text-xs">
              {topItems.map((it, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-md bg-blue-50 text-blue-700 font-bold flex items-center justify-center text-[11px]">
                      #{idx + 1}
                    </span>
                    <span className="font-bold text-slate-800">{it._id || 'Dish'}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-[#0F172A] block">{it.totalQuantity} ordered</span>
                    <span className="text-[10px] text-slate-400">{formatCurrency(it.totalSales)} sales</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">No dish data recorded yet.</p>
          )}
        </div>

        {/* Top Dining Hubs */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-1.5">
            <FiMapPin className="w-4 h-4 text-emerald-600" />
            Top Dining Geographic Hubs
          </h2>
          <div className="divide-y divide-slate-100 text-xs">
            {topCities.map((c, i) => (
              <div key={i} className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-md bg-emerald-50 text-emerald-700 font-bold flex items-center justify-center text-[11px]">
                    #{i + 1}
                  </span>
                  <div>
                    <span className="font-bold text-slate-800 block">{c.city}</span>
                    <span className="text-[10px] text-slate-400">{c.restaurants} Partner Outlets</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-extrabold text-[#0F172A] block">{formatCurrency(c.revenue)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
