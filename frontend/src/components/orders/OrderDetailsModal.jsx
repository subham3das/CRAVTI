import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiX,
  FiClock,
  FiPrinter,
  FiDownload,
  FiCheckCircle,
  FiAlertCircle,
  FiDollarSign,
  FiUser,
  FiPhone,
  FiMapPin,
  FiRotateCcw,
} from 'react-icons/fi';
import { MdQrCodeScanner } from 'react-icons/md';
import { StatusBadge } from '../StatusBadge';
import { CustomerVegBadge } from '../customer/CustomerVegBadge';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { fetchOrderReceiptApi } from '../../services/orderService';
import { generateReceiptPdf, RECEIPT_TEMPLATES } from '../../utils/receiptGenerator';
import toast from 'react-hot-toast';

export const OrderDetailsModal = ({
  order,
  isOpen,
  onClose,
  onStatusChange,
  onPaymentChange,
  restaurantName,
}) => {
  const [isDownloadingReceipt, setIsDownloadingReceipt] = useState(false);

  if (!isOpen || !order) return null;

  const items = Array.isArray(order.items) ? order.items : [];

  // Deterministic Thermal PDF Receipt Download (matches customer panel 100%)
  const handleDownloadReceipt = async () => {
    if (isDownloadingReceipt || !order?._id) return;
    try {
      setIsDownloadingReceipt(true);
      const res = await fetchOrderReceiptApi(order._id);
      if (res.success && res.receipt) {
        generateReceiptPdf(res.receipt, { template: RECEIPT_TEMPLATES.THERMAL_80MM });
        toast.success('Thermal receipt downloaded successfully!');
      } else {
        toast.error(res.message || 'Unable to load receipt snapshot');
      }
    } catch (err) {
      console.error('Failed to download receipt snapshot:', err);
      toast.error(err.response?.data?.message || 'Error generating receipt PDF');
    } finally {
      setIsDownloadingReceipt(false);
    }
  };

  const handlePrintReceipt = handleDownloadReceipt;

  const isCashPending = order.paymentStatus === 'pending';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[92vh] z-10 overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#16A34A] flex items-center justify-center font-extrabold text-sm border border-emerald-100">
                T{order.tableNumber}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-base text-slate-900 font-mono">
                    {order.orderNumber}
                  </h3>
                  <StatusBadge status={order.status} size="sm" />
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ordered on {formatDateTime(order.createdAt)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {order.status === 'completed' && (
                <button
                  type="button"
                  onClick={handleDownloadReceipt}
                  disabled={isDownloadingReceipt}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-black text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-60 cursor-pointer"
                  title="Download Receipt (Thermal PDF)"
                >
                  <FiDownload className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Download Receipt</span>
                </button>
              )}
              <button
                type="button"
                onClick={handlePrintReceipt}
                className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
                title="Print / Download Receipt"
              >
                <FiPrinter className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
            {/* Customer & Table Meta */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl border border-slate-100 bg-slate-50">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Customer
                </p>
                <p className="font-bold text-xs text-slate-800 mt-1 flex items-center gap-1.5">
                  <FiUser className="w-3.5 h-3.5 text-slate-400" />
                  <span>{order.customerName || 'Guest'}</span>
                </p>
                {order.customerPhone && (
                  <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                    <FiPhone className="w-3 h-3 text-slate-400" />
                    <span>{order.customerPhone}</span>
                  </p>
                )}
              </div>

              <div className="p-3 rounded-xl border border-slate-100 bg-slate-50">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Dining Table
                </p>
                <p className="font-bold text-xs text-slate-800 mt-1">
                  Table {order.tableNumber}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {order.tableId?.floor || 'Main Hall'}
                </p>
              </div>

              <div className="p-3 rounded-xl border border-slate-100 bg-slate-50 flex flex-col justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Payment Status
                  </p>
                  <p className="font-bold text-xs mt-1 capitalize text-slate-800">
                    {order.paymentStatus === 'paid_cash'
                      ? 'Paid Cash'
                      : order.paymentStatus === 'paid_online'
                      ? 'Paid Online'
                      : 'Pending Payment'}
                  </p>
                </div>
                {isCashPending && onPaymentChange && (
                  <button
                    type="button"
                    onClick={() => onPaymentChange(order._id, 'paid_cash', 'cash')}
                    className="mt-2 text-[11px] font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 py-1 px-2 rounded-lg transition-colors text-center"
                  >
                    ✓ Mark Paid (Cash)
                  </button>
                )}
              </div>
            </div>

            {/* Ordered Dishes List */}
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-3">
                Ordered Items ({items.length})
              </h4>

              <div className="border border-slate-100 rounded-xl overflow-hidden divide-y divide-slate-100">
                {items.map((item, idx) => (
                  <div key={idx} className="p-3 flex items-start justify-between gap-3 bg-white">
                    <div className="flex items-start gap-2.5">
                      <CustomerVegBadge type={item.foodType} className="mt-0.5" />
                      <div>
                        <p className="font-bold text-xs text-slate-900 leading-tight">
                          {item.quantity}× {item.itemName || item.name || 'Dish'}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {formatCurrency(item.sellingPrice || item.price || 0)} each
                        </p>

                        {/* Kitchen Notes */}
                        {item.specialInstructions && (
                          <div className="mt-1.5 inline-block bg-amber-50 text-amber-800 border border-amber-200/80 rounded-md px-2 py-0.5 text-[11px] font-medium">
                            Kitchen Note: <strong>{item.specialInstructions}</strong>
                          </div>
                        )}
                      </div>
                    </div>

                    <span className="font-extrabold text-xs text-slate-900">
                      {formatCurrency((item.sellingPrice || item.price || 0) * (item.quantity || 1))}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bill Summary */}
            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2">
              <div className="flex justify-between text-xs text-slate-600">
                <span>Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-xs font-medium text-emerald-600">
                  <span>Discount</span>
                  <span>- {formatCurrency(order.discount)}</span>
                </div>
              )}
              {order.tax > 0 && (
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Taxes (5% GST)</span>
                  <span>{formatCurrency(order.tax)}</span>
                </div>
              )}
              <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-extrabold text-slate-900">
                <span>Grand Total</span>
                <span className="text-[#16A34A] text-base">{formatCurrency(order.grandTotal)}</span>
              </div>
            </div>

            {/* Status History Timeline */}
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-3">
                Order Activity Timeline
              </h4>

              <div className="relative pl-6 space-y-3.5 border-l-2 border-slate-100 ml-2">
                {(order.statusHistory || []).map((hist, idx) => (
                  <div key={idx} className="relative">
                    <span className="absolute -left-[31px] top-0.5 w-3 h-3 rounded-full bg-[#16A34A] border-2 border-white ring-2 ring-emerald-100" />
                    <div className="flex items-baseline justify-between text-xs">
                      <span className="font-bold text-slate-900 capitalize">
                        {hist.status}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {formatDateTime(hist.timestamp)}
                      </span>
                    </div>
                    {hist.note && (
                      <p className="text-[11px] text-slate-500 mt-0.5">{hist.note}</p>
                    )}
                    <span className="text-[10px] text-slate-400 font-mono">
                      By: {hist.updatedBy}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Quick Move:</span>
              {['placed', 'accepted', 'served', 'completed'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => onStatusChange(order._id, st)}
                  disabled={order.status === st}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg capitalize transition-colors ${
                    order.status === st
                      ? 'bg-slate-900 text-white cursor-default'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              {order.status === 'completed' && (
                <button
                  type="button"
                  onClick={handleDownloadReceipt}
                  disabled={isDownloadingReceipt}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-60 cursor-pointer"
                >
                  <FiDownload className="w-3.5 h-3.5" />
                  <span>Download Receipt</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

