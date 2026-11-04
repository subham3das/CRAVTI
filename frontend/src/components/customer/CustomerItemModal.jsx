import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiPlus, FiMinus, FiClock, FiStar, FiThumbsUp } from 'react-icons/fi';
import { CustomerVegBadge } from './CustomerVegBadge';
import { formatCurrency, safeNumber } from '../../utils/formatters';
import { ImageWithFallback } from '../ImageWithFallback';

export const CustomerItemModal = ({
  item,
  isOpen,
  onClose,
  onAddToCart,
}) => {
  const [qty, setQty] = useState(1);
  const [instructions, setInstructions] = useState('');

  if (!isOpen || !item) return null;

  const isOutOfStock = item.availability === 'out_of_stock';
  const hasDiscount = item.discountType && item.discountType !== 'none' && item.discountValue > 0;
  const sellingPrice = item.sellingPrice || item.price;
  const totalPrice = sellingPrice * qty;

  const handleAdd = () => {
    if (isOutOfStock) return;
    onAddToCart(item, qty, instructions);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
        />

        {/* Bottom Sheet Card */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="relative bg-white w-full max-w-md rounded-t-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col z-10"
        >
          {/* Close Handle / Button */}
          <div className="absolute top-3 right-3 z-20">
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-900/50 hover:bg-slate-900/70 text-white flex items-center justify-center backdrop-blur-md transition-colors"
            >
              <FiX className="w-4 h-4" />
            </button>
          </div>

          {/* Large Hero Image */}
          <div className="h-56 w-full relative bg-slate-100 shrink-0">
            <ImageWithFallback
              src={item?.image?.url}
              alt={item?.itemName}
              type="menu"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />
          </div>

          {/* Scrollable Content */}
          <div className="p-5 overflow-y-auto space-y-4 flex-1">
            {/* Badges & Type */}
            <div className="flex flex-wrap items-center gap-2">
              <CustomerVegBadge type={item.foodType} />

              {item.popular && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                  <FiStar className="w-3 h-3 fill-amber-500" /> Bestseller
                </span>
              )}

              {item.recommended && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  <FiThumbsUp className="w-3 h-3" /> Chef's Choice
                </span>
              )}

              {item.preparationTime && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                  <FiClock className="w-3 h-3" /> ~{item.preparationTime} mins
                </span>
              )}
            </div>

            {/* Title & Price */}
            <div>
              <h3 className="text-xl font-bold text-slate-900 leading-tight">
                {item.itemName}
              </h3>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-slate-900">
                  {formatCurrency(sellingPrice)}
                </span>
                {hasDiscount && (
                  <span className="text-sm text-slate-400 line-through">
                    {formatCurrency(item.price)}
                  </span>
                )}
                {hasDiscount && (
                  <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                    {item.discountType === 'percentage'
                      ? `${item.discountValue}% OFF`
                      : `₹${item.discountValue} FLAT DISCOUNT`}
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            {item.description && (
              <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                {item.description}
              </p>
            )}

            {/* Special Instructions Note */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Special Instructions (Optional)
              </label>
              <textarea
                rows={2}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="e.g. Less spicy, no extra butter, dressing on side..."
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/30 resize-none bg-slate-50/50"
              />
            </div>
          </div>

          {/* Bottom Actions Bar */}
          <div className="p-4 border-t border-slate-100 bg-white flex items-center gap-3">
            {/* Stepper */}
            <div className="flex items-center border border-slate-200 rounded-xl p-1 bg-slate-50 shrink-0">
              <button
                type="button"
                onClick={() => setQty((prev) => Math.max(1, prev - 1))}
                className="w-8 h-8 rounded-lg bg-white shadow-xs flex items-center justify-center text-slate-700 hover:bg-slate-100 active:scale-95 transition-transform"
              >
                <FiMinus className="w-3.5 h-3.5" />
              </button>
              <span className="w-9 text-center font-bold text-sm text-slate-900">
                {qty}
              </span>
              <button
                type="button"
                onClick={() => setQty((prev) => prev + 1)}
                className="w-8 h-8 rounded-lg bg-white shadow-xs flex items-center justify-center text-slate-700 hover:bg-slate-100 active:scale-95 transition-transform"
              >
                <FiPlus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Add Button */}
            <button
              type="button"
              disabled={isOutOfStock}
              onClick={handleAdd}
              className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm shadow-md flex items-center justify-between transition-all active:scale-[0.98] ${
                isOutOfStock
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-[#16A34A] hover:bg-[#15803d] text-white shadow-emerald-500/20'
              }`}
            >
              <span>Add To Order</span>
              <span>{formatCurrency(totalPrice)}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

