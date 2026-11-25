import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiBell,
  FiDroplet,
  FiPackage,
  FiX,
  FiCheck,
  FiClock,
  FiPlus,
  FiMinus,
  FiAlertCircle,
  FiArrowRight,
} from 'react-icons/fi';
import { formatCurrency } from '../../utils/formatters';

/**
 * 1. Call Waiter Confirmation Dialog with 30-Second Cooldown
 */
export const CallWaiterModal = ({
  isOpen,
  onClose,
  onConfirm,
  tableNumber,
  isLoading,
  cooldownSeconds = 0,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-100 text-center"
        >
          {/* Bell Icon Header */}
          <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto mb-3 shadow-xs">
            <FiBell className="w-7 h-7 animate-bounce" />
          </div>

          <h3 className="text-base font-extrabold text-slate-900">
            Call Waiter
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Call a waiter to Table <strong>{tableNumber || 'your table'}</strong> for assistance?
          </p>

          {cooldownSeconds > 0 ? (
            <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center justify-center gap-2">
              <FiClock className="w-4 h-4 animate-spin" />
              <span>Waiter already notified. Please wait {cooldownSeconds}s</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5 mt-5">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={isLoading}
                className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
              >
                {isLoading ? (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <FiBell className="w-3.5 h-3.5" />
                    <span>Call Waiter</span>
                  </>
                )}
              </button>
            </div>
          )}

          {cooldownSeconds > 0 && (
            <button
              type="button"
              onClick={onClose}
              className="mt-4 w-full py-2 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs hover:bg-slate-200 transition"
            >
              Close
            </button>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

/**
 * 2. Request Water Popup with Configurable Water Products & Quantity Selection
 */
export const RequestWaterModal = ({
  isOpen,
  onClose,
  options = [],
  waterOptions,
  onSubmit,
  onSubmitWater,
  isLoading,
  tableNumber,
}) => {
  const [selectedOptionId, setSelectedOptionId] = useState('');
  const [quantity, setQuantity] = useState(1);

  // Normalize options array from various possible structures
  const optionsList = Array.isArray(waterOptions)
    ? waterOptions
    : Array.isArray(waterOptions?.options)
    ? waterOptions.options
    : Array.isArray(options)
    ? options
    : Array.isArray(options?.options)
    ? options.options
    : [];

  const hasWaterItem = (waterOptions && typeof waterOptions === 'object' && 'hasWaterItem' in waterOptions)
    ? Boolean(waterOptions.hasWaterItem)
    : (options && typeof options === 'object' && 'hasWaterItem' in options)
    ? Boolean(options.hasWaterItem)
    : optionsList.length > 0;

  const effectiveOptions = optionsList;

  useEffect(() => {
    if (isOpen && effectiveOptions.length > 0) {
      if (!selectedOptionId || !effectiveOptions.some((o) => (o.id || o._id) === selectedOptionId)) {
        setSelectedOptionId(effectiveOptions[0].id || effectiveOptions[0]._id);
      }
    }
  }, [isOpen, effectiveOptions, selectedOptionId]);

  if (!isOpen) return null;

  const currentOption =
    effectiveOptions.find((o) => (o.id || o._id) === selectedOptionId) ||
    effectiveOptions[0];

  const handleIncrement = () => setQuantity((prev) => Math.min(10, prev + 1));
  const handleDecrement = () => setQuantity((prev) => Math.max(1, prev - 1));

  const totalPrice = currentOption ? (Number(currentOption.price) || 0) * quantity : 0;
  const isFree = totalPrice === 0;

  const handleSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!hasWaterItem || !currentOption) return;

    const submitCallback = onSubmit || onSubmitWater;
    if (typeof submitCallback === 'function') {
      submitCallback({
        productName: currentOption.name || currentOption.itemName || 'Water Bottle',
        price: Number(currentOption.price) || 0,
        quantity: Math.max(1, Number(quantity) || 1),
        optionId: currentOption.id || currentOption._id,
      });
    } else {
      console.error('[RequestWaterModal] Error: No onSubmit callback provided');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="bg-white rounded-t-3xl sm:rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-100 flex flex-col max-h-[85vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
                <FiDroplet className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Request Water
                </h3>
                <p className="text-[10px] text-slate-400">
                  Table {tableNumber || 'Service'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <FiX className="w-4 h-4" />
            </button>
          </div>

          {/* Body: Available Options or Unavailable State */}
          {!hasWaterItem || effectiveOptions.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                <FiDroplet className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-extrabold text-slate-800">
                Water is currently unavailable.
              </h4>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                This restaurant has not configured a water item yet. Please ask your server for assistance.
              </p>
            </div>
          ) : (
            <>
              {/* Options list */}
              <div className="py-3 space-y-2 overflow-y-auto max-h-[45vh] pr-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Select Water Option
                </p>
                {effectiveOptions.map((opt) => {
                  const optId = opt.id || opt._id;
                  const isSelected = selectedOptionId === optId;
                  const price = Number(opt.price) || 0;

                  return (
                    <div
                      key={optId}
                      onClick={() => setSelectedOptionId(optId)}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50/50 shadow-xs ring-1 ring-blue-500'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-slate-900 truncate">
                          {opt.name || opt.itemName}
                        </p>
                        {opt.description && (
                          <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                            {opt.description}
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <span
                          className={`text-xs font-black ${
                            price === 0 ? 'text-emerald-600' : 'text-slate-900'
                          }`}
                        >
                          {price === 0 ? 'Free' : formatCurrency(price)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Quantity selector */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">Quantity</span>
                <div className="flex items-center gap-3 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={handleDecrement}
                    disabled={quantity <= 1}
                    className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-slate-600 hover:bg-slate-200 disabled:opacity-40 transition cursor-pointer"
                  >
                    <FiMinus className="w-3 h-3" />
                  </button>
                  <span className="text-xs font-black text-slate-900 w-5 text-center">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={handleIncrement}
                    disabled={quantity >= 10}
                    className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-slate-600 hover:bg-slate-200 disabled:opacity-40 transition cursor-pointer"
                  >
                    <FiPlus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Submit Button */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || !hasWaterItem || effectiveOptions.length === 0}
            className="mt-4 w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : !hasWaterItem || effectiveOptions.length === 0 ? (
              <span>Water Unavailable</span>
            ) : (
              <>
                <FiDroplet className="w-4 h-4" />
                <span>
                  Add Water • {isFree ? 'Complimentary' : formatCurrency(totalPrice)}
                </span>
              </>
            )}
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

/**
 * 3. No Active Order Dialog
 */
export const NoActiveOrderModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-center"
        >
          <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <FiPackage className="w-7 h-7" />
          </div>
          <h3 className="text-base font-extrabold text-slate-900">
            You don&apos;t have any active orders yet.
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            Browse our delicious menu and add items to your cart to get started!
          </p>
          <button
            type="button"
            onClick={onClose}
            className="mt-5 w-full py-3 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-98 cursor-pointer"
          >
            <span>Continue Browsing</span>
            <FiArrowRight className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

/**
 * 4. Floating Quick Actions Bar (Always visible above cart / bottom navigation)
 * - Before order is placed: ONLY shows Call Waiter + Live Order (2 buttons)
 * - After order is placed: Shows Call Waiter + Request Water + Add More + Live Order (4 buttons)
 */
export const CustomerQuickActionBar = ({
  onCallWaiter,
  onCallWaiterClick,
  onRequestWater,
  onRequestWaterClick,
  onAddMore,
  onAddMoreClick,
  onLiveOrder,
  onLiveOrderClick,
  hasActiveOrder = false,
  activeOrder,
  waiterCooldown = 0,
  className = '',
}) => {
  const isOrderActive = Boolean(hasActiveOrder || (activeOrder && activeOrder._id));
  const handleCallWaiter = onCallWaiter || onCallWaiterClick;
  const handleRequestWater = onRequestWater || onRequestWaterClick;
  const handleAddMore = onAddMore || onAddMoreClick;
  const handleLiveOrder = onLiveOrder || onLiveOrderClick;

  return (
    <div className={`fixed left-0 right-0 z-30 px-3 max-w-md mx-auto pointer-events-none transition-all duration-300 ${className || 'bottom-20'}`}>
      <div
        className={`bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl shadow-lg p-1.5 grid gap-1.5 pointer-events-auto ${
          isOrderActive ? 'grid-cols-4' : 'grid-cols-2'
        }`}
      >
        {/* 1. Call Waiter - ALWAYS VISIBLE */}
        <button
          type="button"
          onClick={handleCallWaiter}
          className={`py-2 px-1.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition active:scale-95 cursor-pointer ${
            waiterCooldown > 0
              ? 'bg-amber-100 text-amber-800'
              : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80'
          }`}
          title="Call waiter to table"
        >
          <FiBell className={`w-3.5 h-3.5 shrink-0 ${waiterCooldown > 0 ? 'animate-spin' : ''}`} />
          <span className="truncate">
            {waiterCooldown > 0 ? `${waiterCooldown}s` : 'Call Waiter'}
          </span>
        </button>

        {/* 2. Request Water - ONLY AFTER ACTIVE ORDER EXISTS */}
        {isOrderActive && (
          <button
            type="button"
            onClick={handleRequestWater}
            className="py-2 px-1.5 rounded-xl text-[11px] font-bold bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200/80 flex items-center justify-center gap-1 transition active:scale-95 cursor-pointer"
            title="Request table water"
          >
            <FiDroplet className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="truncate">Request Water</span>
          </button>
        )}

        {/* 3. Add More - ONLY AFTER ACTIVE ORDER EXISTS */}
        {isOrderActive && (
          <button
            type="button"
            onClick={handleAddMore}
            className="py-2 px-1.5 rounded-xl text-[11px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200/80 flex items-center justify-center gap-1 transition active:scale-95 cursor-pointer"
            title="Add more items to active bill"
          >
            <FiPlus className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">Add More</span>
          </button>
        )}

        {/* 4. Live Order - ALWAYS VISIBLE */}
        <button
          type="button"
          onClick={handleLiveOrder}
          className={`py-2 px-1.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition active:scale-95 cursor-pointer ${
            isOrderActive
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
          title="View live order status"
        >
          <FiPackage className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Live Order</span>
          {isOrderActive && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-ping shrink-0" />
          )}
        </button>
      </div>
    </div>
  );
};
