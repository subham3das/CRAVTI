import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiPlus, FiMinus, FiTrash2, FiShoppingBag, FiArrowRight, FiUser, FiPhone, FiDollarSign, FiCreditCard } from 'react-icons/fi';
import { CustomerVegBadge } from './CustomerVegBadge';
import { formatCurrency } from '../../utils/formatters';

export const CustomerCartDrawer = ({
  isOpen,
  onClose,
  cart,
  subtotal,
  discount,
  grandTotal,
  onUpdateQuantity,
  onRemoveItem,
  onPlaceOrder,
  tableNumber,
  restaurantName,
  isPlacingOrder,
  hasActiveOrder = false,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash' | 'online'

  if (!isOpen) return null;

  const cartItems = Array.isArray(cart) ? cart : [];

  const handlePlaceOrderSubmit = (e) => {
    e.preventDefault();
    if (cartItems.length === 0 || isPlacingOrder) return;
    onPlaceOrder({ customerName, customerPhone, paymentMethod });
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

        {/* Drawer Container */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="relative bg-white w-full max-w-md rounded-t-3xl shadow-2xl flex flex-col max-h-[92vh] z-10"
        >
          {/* Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#16A34A] flex items-center justify-center font-bold text-xs">
                T{tableNumber}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm leading-tight">
                  {hasActiveOrder ? 'Add to Current Bill' : 'Your Table Order'}
                </h3>
                <p className="text-[11px] text-slate-500">{restaurantName}</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          {cart.length === 0 ? (
            <div className="p-12 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mb-3">
                <FiShoppingBag className="w-8 h-8" />
              </div>
              <p className="font-semibold text-slate-700 text-sm">Your cart is empty</p>
              <p className="text-xs text-slate-400 mt-1">Explore our menu and add your favorite dishes.</p>
              <button
                type="button"
                onClick={onClose}
                className="mt-5 px-5 py-2 text-xs font-bold text-[#16A34A] bg-emerald-50 rounded-xl"
              >
                Browse Menu
              </button>
            </div>
          ) : (
            <div className="overflow-y-auto flex-1 p-4 space-y-4">
              {/* Item List */}
              <div className="space-y-3">
                {cartItems.map((item, index) => (
                  <div
                    key={`${item.menuItemId}-${index}`}
                    className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 flex items-start justify-between gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <CustomerVegBadge type={item.foodType} />
                        <h4 className="font-bold text-xs text-slate-900 truncate">
                          {item.itemName}
                        </h4>
                      </div>

                      <p className="text-xs font-extrabold text-[#16A34A]">
                        {formatCurrency(item.sellingPrice * item.quantity)}
                      </p>

                      {item.specialInstructions && (
                        <p className="text-[10px] text-amber-700 mt-1 italic line-clamp-1">
                          "{item.specialInstructions}"
                        </p>
                      )}
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center border border-slate-200 rounded-lg bg-white shadow-2xs">
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.menuItemId, item.quantity - 1)}
                          className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded-l-lg transition-colors"
                        >
                          <FiMinus className="w-3 h-3" />
                        </button>
                        <span className="w-7 text-center font-bold text-xs text-slate-900">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.menuItemId, item.quantity + 1)}
                          className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded-r-lg transition-colors"
                        >
                          <FiPlus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => onRemoveItem(item.menuItemId)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition-colors"
                        title="Remove"
                      >
                        <FiTrash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Guest Details */}
              <div className="p-3.5 rounded-xl border border-slate-100 bg-white space-y-2.5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Customer Information (Optional)
                </p>

                <div className="relative">
                  <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                  <input
                    type="text"
                    placeholder="Your Name (e.g. John)"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full text-xs pl-8 pr-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#16A34A]"
                  />
                </div>

                <div className="relative">
                  <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                  <input
                    type="tel"
                    placeholder="Phone number (for bill SMS)"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full text-xs pl-8 pr-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#16A34A]"
                  />
                </div>
              </div>

              {/* Payment Mode Selector */}
              <div className="p-3.5 rounded-xl border border-slate-100 bg-white space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Payment Mode
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center flex flex-col items-center justify-center ${
                      paymentMethod === 'cash'
                        ? 'border-[#16A34A] bg-emerald-50/50 text-[#16A34A]'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>💵 Pay Cash</span>
                    <span className="text-[10px] font-normal text-slate-400 mt-0.5">Pay at Counter</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('online')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center flex flex-col items-center justify-center ${
                      paymentMethod === 'online'
                        ? 'border-[#16A34A] bg-emerald-50/50 text-[#16A34A]'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>💳 Pay Online</span>
                    <span className="text-[10px] font-normal text-slate-400 mt-0.5">Instant Checkout</span>
                  </button>
                </div>
              </div>

              {/* Bill Details */}
              <div className="p-3.5 rounded-xl border border-slate-100 bg-white space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Bill Summary
                </p>

                <div className="flex justify-between text-xs text-slate-600">
                  <span>Item Total</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-xs font-medium text-emerald-600">
                    <span>Menu Discounts</span>
                    <span>- {formatCurrency(discount)}</span>
                  </div>
                )}

                <div className="border-t border-slate-100 pt-2 flex justify-between text-sm font-extrabold text-slate-900">
                  <span>Grand Total</span>
                  <span className="text-base text-[#16A34A]">{formatCurrency(grandTotal)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Place Order CTA Button */}
          {cart.length > 0 && (
            <div className="p-4 border-t border-slate-100 bg-white">
              <button
                type="button"
                disabled={isPlacingOrder}
                onClick={handlePlaceOrderSubmit}
                className="w-full py-3.5 px-4 rounded-xl bg-[#16A34A] hover:bg-[#15803d] text-white font-bold text-sm shadow-lg shadow-emerald-500/20 flex items-center justify-between active:scale-[0.98] transition-all disabled:opacity-70"
              >
                <div className="text-left">
                  <p className="text-[10px] uppercase tracking-wider text-emerald-100 font-medium">
                    Table {tableNumber}
                  </p>
                  <p className="text-sm font-extrabold">{formatCurrency(grandTotal)}</p>
                </div>

                <div className="flex items-center gap-1.5 font-bold">
                  {isPlacingOrder ? (
                    <span className="inline-flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Sending to Kitchen...
                    </span>
                  ) : (
                    <>
                      <span>
                        {hasActiveOrder
                          ? 'Add to Active Order'
                          : paymentMethod === 'online'
                          ? 'Pay Online & Order'
                          : 'Place Order'}
                      </span>
                      <FiArrowRight className="w-4 h-4" />
                    </>
                  )}
                </div>
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
