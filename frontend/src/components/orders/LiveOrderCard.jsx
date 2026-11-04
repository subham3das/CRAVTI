import React from 'react';
import { motion } from 'framer-motion';
import {
  FiCheck,
  FiX,
  FiDollarSign,
  FiUser,
  FiChevronRight,
  FiClock,
} from 'react-icons/fi';
import { MdOutlineDinnerDining } from 'react-icons/md';
import { StatusBadge } from '../StatusBadge';
import { LiveOrderTimer } from './LiveOrderTimer';
import { formatCurrency, formatTime } from '../../utils/formatters';

export const LiveOrderCard = React.memo(({
  order,
  onStatusChange,
  onPaymentChange,
  onSelectOrder,
  isNew = false,
}) => {
  if (!order) return null;

  const isFinished = ['completed', 'cancelled'].includes(order.status);
  const isCashPending =
    order.paymentStatus === 'pending' ||
    (order.paymentMethod === 'cash' && order.paymentStatus !== 'paid_cash');
  const items = Array.isArray(order.items) ? order.items : [];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`bg-white rounded-2xl border transition-all shadow-sm hover:shadow-md flex flex-col justify-between overflow-hidden cursor-pointer ${
        isNew
          ? 'ring-2 ring-emerald-500 border-emerald-400'
          : order.status === 'placed'
          ? 'border-amber-300 bg-amber-50/15'
          : 'border-slate-200'
      }`}
      onClick={() => onSelectOrder && onSelectOrder(order)}
    >
      {/* Top Bar: Table Number, Order ID & Timer */}
      <div className="p-3.5 pb-2.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#16A34A] flex items-center justify-center font-extrabold text-xs border border-emerald-200 shrink-0">
            T{order.tableNumber}
          </div>
          <div>
            <h4 className="font-extrabold text-xs font-mono text-slate-900 leading-tight">
              {order.orderNumber}
            </h4>
            <p className="text-[10px] text-slate-400">
              {formatTime(order.createdAt)} • {order.customerName || 'Guest'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <LiveOrderTimer
            createdAt={order.createdAt}
            estimatedPrepTime={order.estimatedPrepTime || 15}
            isFinished={isFinished}
          />
          <StatusBadge status={order.status} size="sm" />
        </div>
      </div>

      {/* Middle: Dish List & Special Notes */}
      <div className="p-3.5 space-y-2 flex-1">
        <div className="space-y-1.5">
          {items.map((item, idx) => (
            <div key={idx} className="text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800 line-clamp-1">
                  <span className="font-extrabold text-slate-900">{item.quantity}×</span>{' '}
                  {item.itemName || item.name || 'Dish'}
                </span>
                <span className="text-[11px] font-bold text-slate-600 shrink-0 ml-2">
                  {formatCurrency((item.sellingPrice || item.price || 0) * (item.quantity || 1))}
                </span>
              </div>

              {/* Special Instructions Pill */}
              {item.specialInstructions && (
                <p className="text-[10px] font-medium text-amber-800 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5 mt-0.5 inline-block">
                  Note: {item.specialInstructions}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Bar: Total, Payment Status & Simplified Action Buttons */}
      <div className="p-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Total
            </span>
            <span className="text-xs font-extrabold text-slate-900">
              {formatCurrency(order.grandTotal)}
            </span>
          </div>

          <span
            className={`text-[10px] font-bold uppercase tracking-wider block ${
              order.paymentStatus === 'paid_cash' || order.paymentStatus === 'paid_online'
                ? 'text-emerald-600'
                : 'text-amber-600'
            }`}
          >
            {order.paymentStatus === 'paid_cash'
              ? 'Paid Cash'
              : order.paymentStatus === 'paid_online'
              ? 'Paid Online'
              : 'Pending (Cash)'}
          </span>
        </div>

        {/* Simplified Actions: Placed -> Accepted -> Served -> Auto Complete */}
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          {/* Action 1: If Placed -> Accept Order / Reject */}
          {order.status === 'placed' && onStatusChange && (
            <>
              <button
                type="button"
                onClick={() => onStatusChange(order._id, 'cancelled', 'Rejected by staff')}
                className="px-2 py-1.5 rounded-lg text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors"
              >
                Reject
              </button>
              <button
                type="button"
                onClick={() => onStatusChange(order._id, 'accepted')}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-[#16A34A] hover:bg-[#15803d] shadow-sm transition-all active:scale-95"
              >
                Accept Order
              </button>
            </>
          )}

          {/* Action 2: If Accepted -> Mark Served */}
          {order.status === 'accepted' && onStatusChange && (
            <button
              type="button"
              onClick={() => onStatusChange(order._id, 'served')}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all active:scale-95 flex items-center gap-1"
            >
              <MdOutlineDinnerDining className="w-4 h-4" />
              Mark Served
            </button>
          )}

          {/* Action 3: If Served & Cash Pending -> Mark Cash Paid (Auto completes!) */}
          {order.status === 'served' && isCashPending && onPaymentChange && (
            <button
              type="button"
              onClick={() => onPaymentChange(order._id, 'paid_cash', 'cash')}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-all active:scale-95 flex items-center gap-1"
            >
              <FiDollarSign className="w-3.5 h-3.5" />
              Mark Cash Paid
            </button>
          )}

          {/* Read Only / Finished indicator */}
          {isFinished && (
            <button
              type="button"
              onClick={() => onSelectOrder && onSelectOrder(order)}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <FiChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
});

export default LiveOrderCard;
