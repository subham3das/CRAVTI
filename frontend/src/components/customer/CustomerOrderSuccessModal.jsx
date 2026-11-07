import { motion, AnimatePresence } from 'framer-motion';
import { FiCheckCircle, FiClock, FiArrowRight, FiRotateCcw } from 'react-icons/fi';
import { MdQrCodeScanner } from 'react-icons/md';
import { CustomerFooter } from './CustomerFooter';

export const CustomerOrderSuccessModal = ({
  order,
  isOpen,
  onTrackOrder,
  onOrderMore,
}) => {
  if (!isOpen || !order) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 text-center z-10 overflow-hidden"
        >
          {/* Animated Green Circle */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 15, delay: 0.1 }}
            className="w-20 h-20 bg-emerald-50 text-[#16A34A] rounded-full mx-auto flex items-center justify-center shadow-inner mb-4"
          >
            <FiCheckCircle className="w-10 h-10" />
          </motion.div>

          <span className="text-[10px] font-bold uppercase tracking-widest text-[#16A34A] bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
            Order Sent to Kitchen
          </span>

          <h3 className="text-xl font-extrabold text-slate-900 mt-2">
            Order Successful!
          </h3>

          <p className="text-xs text-slate-500 mt-1">
            Your food is being prepared with care.
          </p>

          {/* Details Card */}
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 my-5 space-y-2.5 text-left">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-medium">Order Number</span>
              <span className="font-extrabold text-slate-900 font-mono tracking-wide">
                {order.orderNumber}
              </span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-medium">Table</span>
              <span className="font-bold text-slate-800">
                Table {order.tableNumber}
              </span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-medium">Estimated Time</span>
              <span className="font-bold text-amber-600 flex items-center gap-1">
                <FiClock className="w-3.5 h-3.5" /> ~{order.estimatedPrepTime || 20} mins
              </span>
            </div>

            <div className="flex justify-between items-center text-xs border-t border-slate-200/60 pt-2">
              <span className="text-slate-500 font-medium">Total Amount</span>
              <span className="font-extrabold text-[#16A34A] text-sm">
                ₹{order.grandTotal}
              </span>
            </div>
          </div>

          {/* CTAs */}
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={onTrackOrder}
              className="w-full py-3.5 px-4 rounded-xl bg-[#16A34A] hover:bg-[#15803d] text-white font-bold text-sm shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <span>View Live Order</span>
              <FiArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onOrderMore}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <FiRotateCcw className="w-3.5 h-3.5" />
              <span>Back to Menu</span>
            </button>
          </div>

          {/* Craviti Customer Ordering Footer */}
          <CustomerFooter compact className="mt-4 bg-slate-50 border border-slate-100" />
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

