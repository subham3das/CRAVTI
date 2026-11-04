import { useState, useEffect } from 'react';
import {
  FiDollarSign,
  FiTrendingUp,
  FiCreditCard,
  FiDownload,
  FiCalendar,
  FiFilter,
  FiArrowUpRight,
  FiArrowDownRight,
  FiLayers,
} from 'react-icons/fi';
import { fetchPlatformRevenueApi } from '../services/adminService';
import { formatCurrency, safeNumber } from '../utils/formatters';
import { TableSkeleton, Skeleton } from '../components/Skeleton';
import toast from 'react-hot-toast';

export const Revenue = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState({ startDate: '', endDate: '' });

  const loadRevenue = async () => {
    try {
      setLoading(true);
      const res = await fetchPlatformRevenueApi(dateFilter);
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load revenue data:', err);
      toast.error('Could not load platform revenue data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRevenue();
  }, [dateFilter]);

  const handleExport = (format) => {
    if (!data) return;
    const rows = [
      ['Metric', 'Value'],
      ['Platform Gross Revenue', data.platformGrossRevenue || 0],
      ['Restaurant Net Revenue', data.restaurantNetRevenue || 0],
      ['Commission Revenue', data.commissionRevenue || 0],
      ['Subscription Revenue', data.subscriptionRevenue || 0],
      ['Monthly Revenue', data.monthlyRevenue || 0],
      ['Today Revenue', data.todayRevenue || 0],
      ['Pending Settlements', data.pendingSettlements || 0],
      ['Refunds Total', data.refundsTotal || 0],
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Craviti_Platform_Revenue_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xls' : 'csv'}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported platform revenue as ${format.toUpperCase()}`);
  };

  const d = data || {};

  return (
    <div className="space-y-6">
      {/* Title & Export Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">
            Platform Revenue & Commission Engine
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time gross merchandise value, restaurant payouts, commissions, and SaaS billing
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleExport('csv')}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <FiDownload className="w-3.5 h-3.5" />
            Export CSV
          </button>

          <button
            type="button"
            onClick={() => handleExport('excel')}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
          >
            <FiDownload className="w-3.5 h-3.5" />
            Export Excel
          </button>
        </div>
      </div>

      {/* Date Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-4 text-xs">
        <span className="font-bold text-slate-600 flex items-center gap-1.5">
          <FiCalendar className="w-4 h-4 text-blue-600" />
          Date Range Filter:
        </span>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateFilter.startDate}
            onChange={(e) => setDateFilter({ ...dateFilter, startDate: e.target.value })}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-blue-600"
          />
          <span className="text-slate-400">to</span>
          <input
            type="date"
            value={dateFilter.endDate}
            onChange={(e) => setDateFilter({ ...dateFilter, endDate: e.target.value })}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-blue-600"
          />
          {(dateFilter.startDate || dateFilter.endDate) && (
            <button
              type="button"
              onClick={() => setDateFilter({ startDate: '', endDate: '' })}
              className="px-2.5 py-1 text-slate-500 hover:text-slate-800 text-xs font-semibold"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Key Revenue Metrics Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 space-y-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-8 w-3/4" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Platform Gross Revenue
            </span>
            <span className="text-2xl font-black text-[#0F172A] block">
              {formatCurrency(d.platformGrossRevenue || 0)}
            </span>
            <span className="text-[11px] text-slate-400 block mt-1">Total dining GMV processed</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Restaurant Net Payouts
            </span>
            <span className="text-2xl font-black text-emerald-600 block">
              {formatCurrency(d.restaurantNetRevenue || 0)}
            </span>
            <span className="text-[11px] text-slate-400 block mt-1">Merchant earnings after commission</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Commission Revenue
            </span>
            <span className="text-2xl font-black text-purple-600 block">
              {formatCurrency(d.commissionRevenue || 0)}
            </span>
            <span className="text-[11px] text-slate-400 block mt-1">Craviti transaction margin</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
              SaaS Subscription Revenue
            </span>
            <span className="text-2xl font-black text-blue-600 block">
              {formatCurrency(d.subscriptionRevenue || 0)}
            </span>
            <span className="text-[11px] text-slate-400 block mt-1">Monthly software fees</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Monthly Revenue
            </span>
            <span className="text-2xl font-black text-[#0F172A] block">
              {formatCurrency(d.monthlyRevenue || 0)}
            </span>
            <span className="text-[11px] text-slate-400 block mt-1">Current calendar month</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Today's Revenue
            </span>
            <span className="text-2xl font-black text-emerald-600 block">
              {formatCurrency(d.todayRevenue || 0)}
            </span>
            <span className="text-[11px] text-slate-400 block mt-1">Settled today</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Pending Settlements
            </span>
            <span className="text-2xl font-black text-amber-600 block">
              {formatCurrency(d.pendingSettlements || 0)}
            </span>
            <span className="text-[11px] text-slate-400 block mt-1">In payout clearance</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Total Refunds
            </span>
            <span className="text-2xl font-black text-rose-600 block">
              {formatCurrency(d.refundsTotal || 0)}
            </span>
            <span className="text-[11px] text-slate-400 block mt-1">Cancelled & refunded orders</span>
          </div>
        </div>
      )}

      {/* 7-Day Revenue Trend */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-[#0F172A] uppercase tracking-wider">
          7-Day Platform Revenue Velocity
        </h2>
        {Array.isArray(d.trend) && d.trend.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 text-xs">
            {d.trend.map((t, idx) => (
              <div key={idx} className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                <span className="font-bold text-slate-500 block">{t.date}</span>
                <span className="font-extrabold text-[#0F172A] text-sm block">{formatCurrency(t.revenue)}</span>
                <span className="text-[10px] text-purple-600 font-semibold block">+{formatCurrency(t.commission)} fee</span>
                <span className="text-[10px] text-slate-400 block">{t.orders} orders</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">No trend data available.</p>
        )}
      </div>

      {/* Top & Lowest Performing Restaurants */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Earners */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
            <FiArrowUpRight className="w-4 h-4" />
            Top Earning Restaurants
          </h2>
          {Array.isArray(d.topEarningRestaurants) && d.topEarningRestaurants.length > 0 ? (
            <div className="divide-y divide-slate-100 text-xs">
              {d.topEarningRestaurants.map((r, i) => (
                <div key={i} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-md bg-emerald-50 text-emerald-700 font-bold flex items-center justify-center text-[11px]">
                      #{i + 1}
                    </span>
                    <span className="font-bold text-slate-800">{r.restaurantName}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-[#0F172A] block">{formatCurrency(r.totalRevenue)}</span>
                    <span className="text-[10px] text-slate-400">{r.ordersCount} orders</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">No restaurant sales recorded yet.</p>
          )}
        </div>

        {/* Lowest Performing */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
            <FiArrowDownRight className="w-4 h-4" />
            Lowest Performing Restaurants
          </h2>
          {Array.isArray(d.lowestPerformingRestaurants) && d.lowestPerformingRestaurants.length > 0 ? (
            <div className="divide-y divide-slate-100 text-xs">
              {d.lowestPerformingRestaurants.map((r, i) => (
                <div key={i} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-md bg-amber-50 text-amber-700 font-bold flex items-center justify-center text-[11px]">
                      #{i + 1}
                    </span>
                    <span className="font-bold text-slate-800">{r.restaurantName}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-[#0F172A] block">{formatCurrency(r.totalRevenue)}</span>
                    <span className="text-[10px] text-slate-400">{r.ordersCount} orders</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">No restaurant data recorded yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

