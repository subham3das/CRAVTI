import { useState, useEffect } from 'react';
import {
  FiFileText,
  FiDownload,
  FiPlus,
  FiCheckCircle,
  FiClock,
  FiCreditCard,
  FiDollarSign,
  FiFilter,
} from 'react-icons/fi';
import { fetchPlatformInvoicesApi, generatePlatformInvoiceApi, fetchRestaurantsApi } from '../services/adminService';
import { formatCurrency, formatDate, safeString, safeNumber } from '../utils/formatters';
import { generateReceiptPdf, RECEIPT_TEMPLATES } from '../utils/receiptGenerator';
import { TableSkeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import toast from 'react-hot-toast';

export const Billing = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [restaurantsList, setRestaurantsList] = useState([]);
  const [generating, setGenerating] = useState(false);

  const [form, setForm] = useState({
    restaurantId: '',
    plan: 'professional',
    amount: 699,
    status: 'paid',
    paymentMethod: 'Razorpay / UPI',
  });

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const res = await fetchPlatformInvoicesApi({ status: statusFilter });
      if (res.success && res.data) {
        setInvoices(res.data.invoices || []);
      }
    } catch (err) {
      console.error('Failed to load invoices:', err);
      toast.error('Could not load billing invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, [statusFilter]);

  const openGenerateModal = async () => {
    try {
      setShowGenerateModal(true);
      if (restaurantsList.length === 0) {
        const res = await fetchRestaurantsApi({ limit: 50 });
        if (res.success && res.data) {
          setRestaurantsList(res.data.restaurants || []);
          if (res.data.restaurants?.length > 0) {
            setForm((prev) => ({ ...prev, restaurantId: res.data.restaurants[0]._id }));
          }
        }
      }
    } catch {
      toast.error('Could not load restaurants list');
    }
  };

  const handleGenerateInvoice = async (e) => {
    e.preventDefault();
    if (!form.restaurantId) {
      toast.error('Please select a restaurant');
      return;
    }

    try {
      setGenerating(true);
      const res = await generatePlatformInvoiceApi(form.restaurantId, form);
      if (res.success) {
        toast.success('Platform invoice generated successfully');
        setShowGenerateModal(false);
        loadInvoices();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invoice generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadInvoice = (inv) => {
    try {
      const rest = inv.restaurantId || {};
      const receiptData = {
        receiptNumber: inv.invoiceNumber,
        orderNumber: inv.invoiceNumber,
        createdAt: inv.createdAt,
        paymentMethod: inv.paymentMethod || 'Razorpay / UPI',
        paymentStatus: inv.status?.toUpperCase() || 'PAID',
        restaurantSnapshot: {
          restaurantName: 'CRAVITI SAAS PLATFORM',
          address: 'Billed to: ' + (rest.restaurantName || 'Tenant Restaurant'),
          phone: rest.ownerPhone || '9876543210',
          gstNumber: '27AABCC1234D1Z9',
          fssaiNumber: 'SaaS Platform License',
        },
        tableSnapshot: {
          tableNumber: `Plan: ${inv.plan?.toUpperCase()}`,
        },
        items: [
          {
            itemName: `SaaS Monthly Subscription (${inv.plan})`,
            quantity: 1,
            sellingPrice: safeNumber(inv.amount, 699),
            foodType: 'veg',
          },
        ],
        pricing: {
          subtotal: safeNumber(inv.amount, 699),
          discountAmount: 0,
          taxAmount: safeNumber(inv.taxAmount, 35),
          taxRatePercent: 5,
          finalAmount: safeNumber(inv.totalAmount, 734),
          roundOff: 0,
        },
      };

      generateReceiptPdf(receiptData, {
        template: RECEIPT_TEMPLATES.A4_INVOICE,
        autoDownload: true,
        filename: `Craviti_Invoice_${inv.invoiceNumber}.pdf`,
      });
      toast.success(`Downloaded Invoice ${inv.invoiceNumber}`);
    } catch (err) {
      console.error('Invoice download error:', err);
      toast.error('Failed to generate invoice PDF');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">
            Billing Center & Invoicing
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            SaaS subscription invoices, tax receipts, transaction logs, and settlement tracking
          </p>
        </div>

        <button
          type="button"
          onClick={openGenerateModal}
          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
        >
          <FiPlus className="w-3.5 h-3.5" />
          Create Invoice
        </button>
      </div>

      {/* Invoices List Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-[#0F172A]">Issued Invoices & Receipts</h2>
            <p className="text-xs text-slate-400 mt-0.5">Automated and manually generated platform billing statements</p>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        {loading ? (
          <TableSkeleton rows={5} cols={6} />
        ) : invoices.length === 0 ? (
          <EmptyState title="No invoices found" description="No platform invoices match your selected status." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[11px] border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3">Invoice #</th>
                  <th className="px-4 py-3">Restaurant</th>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Total Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Payment Method</th>
                  <th className="px-4 py-3">Issued Date</th>
                  <th className="px-4 py-3 text-right">PDF Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {invoices.map((inv) => (
                  <tr key={inv._id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-mono font-bold text-blue-600">{inv.invoiceNumber}</td>
                    <td className="px-4 py-3 font-bold text-slate-800">
                      {inv.restaurantId?.restaurantName || 'Unknown Restaurant'}
                    </td>
                    <td className="px-4 py-3 capitalize text-slate-600">{inv.plan}</td>
                    <td className="px-4 py-3 font-black text-[#0F172A]">{formatCurrency(inv.totalAmount)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                          inv.status === 'paid'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{inv.paymentMethod}</td>
                    <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">{formatDate(inv.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDownloadInvoice(inv)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1.5"
                      >
                        <FiDownload className="w-3 h-3 text-slate-500" />
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Generate Invoice Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-[#0F172A]">Generate New Billing Invoice</h3>
              <button onClick={() => setShowGenerateModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleGenerateInvoice} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Target Restaurant</label>
                <select
                  value={form.restaurantId}
                  onChange={(e) => setForm({ ...form, restaurantId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  required
                >
                  {restaurantsList.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.restaurantName} ({r.ownerName})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Plan</label>
                  <select
                    value={form.plan}
                    onChange={(e) => setForm({ ...form, plan: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="starter">Starter</option>
                    <option value="professional">Professional</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Base Amount (₹)</label>
                  <input
                    type="number"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="paid">Paid</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Payment Method</label>
                  <input
                    type="text"
                    value={form.paymentMethod}
                    onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generating}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold disabled:opacity-50"
                >
                  {generating ? 'Generating...' : 'Issue Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

