import { useState } from 'react';
import {
  FiDownload,
  FiBox,
  FiShoppingBag,
  FiDollarSign,
  FiUsers,
  FiHelpCircle,
  FiFileText,
  FiCheck,
} from 'react-icons/fi';
import { exportPlatformDataApi } from '../services/adminService';
import toast from 'react-hot-toast';

export const ExportCenter = () => {
  const [downloading, setDownloading] = useState('');

  const exportTypes = [
    {
      type: 'restaurants',
      title: 'Restaurants Master Directory',
      description: 'Export all registered restaurant accounts, onboarding states, contact info, and slugs.',
      icon: FiBox,
      color: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    {
      type: 'orders',
      title: 'Dining Orders Transaction Log',
      description: 'Export detailed table orders, gross bill totals, payment statuses, and guest IDs.',
      icon: FiShoppingBag,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      type: 'revenue',
      title: 'Platform GMV & Financial Ledger',
      description: 'Export completed order sales, platform commission breakdowns, and tax values.',
      icon: FiDollarSign,
      color: 'bg-purple-50 text-purple-700 border-purple-200',
    },
    {
      type: 'customers',
      title: 'Unique Dining Customers',
      description: 'Export distinct customer phone records, guest sessions, and total spend aggregations.',
      icon: FiUsers,
      color: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    {
      type: 'tickets',
      title: 'Support Tickets & Inquiries',
      description: 'Export restaurant technical support escalation tickets, categories, and resolution logs.',
      icon: FiHelpCircle,
      color: 'bg-rose-50 text-rose-700 border-rose-200',
    },
    {
      type: 'payments',
      title: 'Payment Transactions & Gateway Logs',
      description: 'Export all captured payments, refunds, failed checkouts, and Razorpay transaction IDs.',
      icon: FiDollarSign,
      color: 'bg-teal-50 text-teal-700 border-teal-200',
    },
  ];

  const handleDownload = async (type, format) => {
    try {
      setDownloading(`${type}_${format}`);
      const res = await exportPlatformDataApi({ type, format });
      if (res.success && res.data) {
        const records = res.data.records || [];
        if (records.length === 0) {
          toast.error('No records available to export for this dataset');
          return;
        }

        let content = '';
        let mime = 'text/plain';
        let ext = 'txt';

        if (format === 'json') {
          content = JSON.stringify(records, null, 2);
          mime = 'application/json';
          ext = 'json';
        } else {
          // Convert array of objects to CSV
          const headers = Object.keys(records[0] || {}).filter((k) => typeof records[0][k] !== 'object');
          const rows = records.map((r) =>
            headers.map((h) => `"${String(r[h] ?? '').replace(/"/g, '""')}"`).join(',')
          );
          content = [headers.join(','), ...rows].join('\n');
          mime = 'text/csv';
          ext = 'csv';
        }

        const blob = new Blob([content], { type: mime });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `craviti_${type}_export_${new Date().toISOString().split('T')[0]}.${ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast.success(`Exported ${records.length} ${type} records as ${ext.toUpperCase()}`);
      }
    } catch {
      toast.error('Export generation failed');
    } finally {
      setDownloading('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">
          Platform Export Center
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Generate compliance exports, financial data dumps, and customer registries in CSV or JSON
        </p>
      </div>

      {/* Export Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {exportTypes.map((item) => {
          const Icon = item.icon;
          const isDownloadingCsv = downloading === `${item.type}_csv`;
          const isDownloadingJson = downloading === `${item.type}_json`;

          return (
            <div
              key={item.type}
              className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${item.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-[#0F172A]">{item.title}</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{item.description}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                <button
                  type="button"
                  disabled={Boolean(downloading)}
                  onClick={() => handleDownload(item.type, 'csv')}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <FiDownload className="w-3.5 h-3.5" />
                  {isDownloadingCsv ? 'Exporting...' : 'Export CSV'}
                </button>

                <button
                  type="button"
                  disabled={Boolean(downloading)}
                  onClick={() => handleDownload(item.type, 'json')}
                  className="flex-1 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <FiFileText className="w-3.5 h-3.5" />
                  {isDownloadingJson ? 'Exporting...' : 'Export JSON'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

