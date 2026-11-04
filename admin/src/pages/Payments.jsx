import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FiCreditCard,
  FiTrendingUp,
  FiAlertTriangle,
  FiRotateCcw,
  FiSearch,
  FiFilter,
  FiRefreshCw,
  FiEye,
  FiDownload,
  FiDollarSign,
  FiCheckCircle,
  FiXCircle,
  FiFileText,
  FiX,
} from 'react-icons/fi';
import { fetchAdminPaymentsApi, refundAdminPaymentApi } from '../services/adminService';
import { formatCurrency, formatDate, safeNumber } from '../utils/formatters';
import { TableSkeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import { generateReceiptPdf, RECEIPT_TEMPLATES } from '../utils/receiptGenerator';
import toast from 'react-hot-toast';

export const Payments = () => {
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [refundModal, setRefundModal] = useState({ open: false, payment: null, amount: '', reason: '', processing: false });

  const loadPayments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchAdminPaymentsApi({
        search,
        status: statusFilter,
        page,
        limit: 15,
      });

      if (res?.success) {
        setPayments(res.data?.payments || []);
        setMetrics(res.data?.metrics || null);
        setTotalPages(res.data?.pagination?.totalPages || 1);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const handleRefundSubmit = async (e) => {
    e.preventDefault();
    if (!refundModal.payment) return;

    try {
      setRefundModal((prev) => ({ ...prev, processing: true }));
      const res = await refundAdminPaymentApi({
        paymentId: refundModal.payment._id,
        amount: Number(refundModal.amount) || undefined,
        reason: refundModal.reason || 'Customer refund requested by admin',
      });

      if (res?.success) {
        toast.success('Refund processed successfully');
        setRefundModal({ open: false, payment: null, amount: '', reason: '', processing: false });
        loadPayments();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Refund processing failed');
      setRefundModal((prev) => ({ ...prev, processing: false }));
    }
  };

  const handleDownloadReceipt = (payment) => {
    try {
      if (!payment?.orderId) {
        toast.error('Order data not available for this transaction');
        return;
      }
      const orderData = typeof payment.orderId === 'object' ? payment.orderId : { _id: payment.orderId };
      const restaurantData = typeof payment.restaurantId === 'object' ? payment.restaurantId : {};
      generateReceiptPdf(orderData, restaurantData, {
        template: RECEIPT_TEMPLATES.MODERN,
        watermark: payment.status === 'captured' ? 'PAID' : payment.status.toUpperCase(),
      });
      toast.success('Receipt generated');
    } catch {
      toast.error('Failed to generate receipt');
    }
  };

  const kpis = useMemo(() => [
    {
      title: 'Total Payments',
      value: safeNumber(metrics?.totalPayments, payments.length),
      icon: FiCreditCard,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(metrics?.totalRevenue || 0),
      icon: FiDollarSign,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      title: 'Success Rate',
      value: `${safeNumber(metrics?.successRate, 100)}%`,
      icon: FiTrendingUp,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
    },
    {
      title: 'Failed Payments',
      value: safeNumber(metrics?.failedPayments, 0),
      icon: FiAlertTriangle,
      color: 'text-rose-600',
      bg: 'bg-rose-50',
    },
    {
      title: 'Refunds Processed',
      value: safeNumber(metrics?.refundedPayments, 0),
      icon: FiRotateCcw,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
  ], [metrics, payments.length]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Payments Center</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time Razorpay payment processing, gateway status, and audit trail
          </p>
        </div>
        <button
          type="button"
          onClick={loadPayments}
          className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-2xs self-start sm:self-auto cursor-pointer"
        >
          <FiRefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  {kpi.title}
                </span>
                <div className={`w-7 h-7 rounded-lg ${kpi.bg} flex items-center justify-center ${kpi.color}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>
              <p className="text-lg font-bold text-slate-900">{kpi.value}</p>
            </div>
          );
        })}
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Payment ID, Order ID, or Customer..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <FiFilter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs py-2 px-3 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-hidden"
          >
            <option value="all">All Statuses</option>
            <option value="captured">Captured (Success)</option>
            <option value="created">Created (Pending)</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-6">
            <TableSkeleton rows={5} columns={6} />
          </div>
        ) : payments.length === 0 ? (
          <div className="p-12">
            <EmptyState
              title="No Payment Transactions Found"
              message="No online transactions match your selected search or filter criteria."
              icon={FiCreditCard}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-bold uppercase text-slate-500 tracking-wider">
                <tr>
                  <th className="py-3 px-4">Payment ID / Order</th>
                  <th className="py-3 px-4">Restaurant</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {payments.map((p) => {
                  const orderNum = p.orderId?.orderNumber || p.orderId?._id?.slice(-6) || 'N/A';
                  const restName = p.restaurantId?.restaurantName || 'Restaurant';

                  let statusBadge = (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                      {p.status}
                    </span>
                  );
                  if (p.status === 'captured') {
                    statusBadge = (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Captured
                      </span>
                    );
                  } else if (p.status === 'failed') {
                    statusBadge = (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                        Failed
                      </span>
                    );
                  } else if (p.status === 'refunded') {
                    statusBadge = (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                        Refunded
                      </span>
                    );
                  }

                  return (
                    <tr key={p._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-slate-900 truncate max-w-[150px]">
                          {p.razorpayPaymentId || p._id}
                        </div>
                        <div className="text-[11px] text-slate-400">Order #{orderNum}</div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{restName}</td>
                      <td className="py-3.5 px-4 uppercase text-[11px] font-bold text-slate-500">
                        {p.method || 'Online'}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {formatCurrency(p.amount || 0)}
                      </td>
                      <td className="py-3.5 px-4">{statusBadge}</td>
                      <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                        {formatDate(p.createdAt)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            title="View Details"
                            onClick={() => setSelectedPayment(p)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                          >
                            <FiEye className="w-3.5 h-3.5" />
                          </button>
                          {p.status === 'captured' && (
                            <>
                              <button
                                type="button"
                                title="Download Receipt"
                                onClick={() => handleDownloadReceipt(p)}
                                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                              >
                                <FiDownload className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                title="Issue Refund"
                                onClick={() =>
                                  setRefundModal({
                                    open: true,
                                    payment: p,
                                    amount: p.amount,
                                    reason: '',
                                    processing: false,
                                  })
                                }
                                className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors cursor-pointer"
                              >
                                <FiRotateCcw className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-3.5 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-600">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 font-bold"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 font-bold"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Payment Details Drawer / Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 border border-slate-200 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Transaction Details</h3>
              <button
                type="button"
                onClick={() => setSelectedPayment(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl">
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Payment ID</span>
                  <span className="font-mono font-bold text-slate-900 break-all">
                    {selectedPayment.razorpayPaymentId || selectedPayment._id}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Razorpay Order</span>
                  <span className="font-mono font-bold text-slate-900 break-all">
                    {selectedPayment.razorpayOrderId || 'N/A'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Amount</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {formatCurrency(selectedPayment.amount)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Status</span>
                  <span className="font-bold uppercase text-slate-900">{selectedPayment.status}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Payment Method</span>
                  <span className="font-medium text-slate-800">{selectedPayment.method || 'Online'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Customer</span>
                  <span className="font-medium text-slate-800">
                    {selectedPayment.email || selectedPayment.phone || 'Guest'}
                  </span>
                </div>
              </div>

              {selectedPayment.refundHistory?.length > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-slate-400 block text-[10px] font-bold uppercase mb-1">
                    Refund Records ({selectedPayment.refundHistory.length})
                  </span>
                  <div className="space-y-1.5">
                    {selectedPayment.refundHistory.map((rf, i) => (
                      <div key={i} className="p-2 bg-amber-50/70 border border-amber-200/70 rounded-lg text-[11px] text-amber-900">
                        <div className="flex justify-between font-bold">
                          <span>{formatCurrency(rf.amount)}</span>
                          <span className="uppercase">{rf.status}</span>
                        </div>
                        <p className="text-amber-700 mt-0.5">{rf.reason || 'Admin refund'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedPayment(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Confirmation Modal */}
      {refundModal.open && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleRefundSubmit}
            className="bg-white rounded-2xl max-w-md w-full p-5 border border-slate-200 shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5 text-rose-600">
                <FiRotateCcw className="w-4 h-4" />
                Issue Gateway Refund
              </h3>
              <button
                type="button"
                onClick={() => setRefundModal({ open: false, payment: null, amount: '', reason: '', processing: false })}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Trigger a direct refund through Razorpay. Funds will return to customer&apos;s source account within 5-7 business days.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Refund Amount (Max {formatCurrency(refundModal.payment?.amount || 0)})
                </label>
                <input
                  type="number"
                  step="0.01"
                  max={refundModal.payment?.amount}
                  value={refundModal.amount}
                  onChange={(e) => setRefundModal((prev) => ({ ...prev, amount: e.target.value }))}
                  required
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Reason for Refund
                </label>
                <input
                  type="text"
                  placeholder="e.g., Customer cancelled dish, double charge"
                  value={refundModal.reason}
                  onChange={(e) => setRefundModal((prev) => ({ ...prev, reason: e.target.value }))}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRefundModal({ open: false, payment: null, amount: '', reason: '', processing: false })}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={refundModal.processing}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs disabled:opacity-50"
              >
                {refundModal.processing ? 'Processing Refund...' : 'Confirm Refund'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

