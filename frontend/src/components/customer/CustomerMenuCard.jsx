import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiMinus, FiClock, FiStar, FiThumbsUp } from 'react-icons/fi';
import { CustomerVegBadge } from './CustomerVegBadge';
import { formatCurrency, safeNumber } from '../../utils/formatters';
import { ImageWithFallback } from '../ImageWithFallback';

export const CustomerMenuCard = React.memo(
  ({
    item = {},
    quantity = 0,
    disabled = false,
    onAdd,
    onUpdateQuantity,
    onSelect,
    onOpenModal,
  }) => {
    const isOutOfStock = item?.availability === 'out_of_stock';
    const hasDiscount = item?.discountType && item.discountType !== 'none' && safeNumber(item.discountValue) > 0;
    const isPopular = item?.popular;
    const isRecommended = item?.recommended;

    const handleCardClick = () => {
      if (disabled) return;
      if (onSelect) onSelect(item);
      else if (onOpenModal) onOpenModal(item);
    };

    const handleAddClick = (e) => {
      e.stopPropagation();
      if (isOutOfStock || disabled) return;
      onAdd && onAdd(item);
    };

    const handleIncrement = (e) => {
      e.stopPropagation();
      if (disabled) return;
      onUpdateQuantity && onUpdateQuantity(item?._id, quantity + 1);
    };

    const handleDecrement = (e) => {
      e.stopPropagation();
      if (disabled) return;
      onUpdateQuantity && onUpdateQuantity(item?._id, quantity - 1);
    };

    return (
      <motion.div
        onClick={handleCardClick}
        whileTap={{ scale: disabled ? 1 : 0.985 }}
        whileHover={{ y: disabled ? 0 : -1.5 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className={`w-full bg-white rounded-xl p-3.5 sm:p-4 border border-slate-100 shadow-sm hover:border-slate-200 transition-all cursor-pointer flex gap-3 sm:gap-4 relative overflow-hidden select-none ${
          isOutOfStock ? 'opacity-60 grayscale-[40%]' : ''
        } ${disabled ? 'pointer-events-none opacity-80' : ''}`}
      >
        {/* Left: Info */}
        <div className="flex-1 flex flex-col justify-between min-w-0 pr-1">
          <div>
            {/* Top Row: Type & Badges */}
            <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
              <CustomerVegBadge type={item?.foodType} />

              {isPopular && (
                <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-200/80 shrink-0">
                  <FiStar className="w-2.5 h-2.5 fill-amber-500 text-amber-500" /> Popular
                </span>
              )}

              {isRecommended && (
                <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200/80 shrink-0">
                  <FiThumbsUp className="w-2.5 h-2.5 text-emerald-600" /> Must Try
                </span>
              )}
            </div>

            {/* Item Name - Displays Full Name without truncation */}
            <h3
              className="font-extrabold text-sm sm:text-base text-slate-900 leading-snug break-words"
              title={item?.itemName}
            >
              {item?.itemName ?? 'Dish'}
            </h3>

            {/* Description */}
            {item?.description && (
              <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed font-normal">
                {item.description}
              </p>
            )}
          </div>

          {/* Bottom Row: Price & Prep Time */}
          <div className="mt-3 flex items-center justify-between gap-2">
            <div className="flex items-baseline gap-1.5">
              <span className="font-extrabold text-sm sm:text-base text-slate-900">
                {formatCurrency(item?.sellingPrice || item?.price || 0)}
              </span>

              {hasDiscount && (
                <span className="text-xs text-slate-400 line-through">
                  {formatCurrency(item?.price || 0)}
                </span>
              )}
            </div>

            {item?.preparationTime && (
              <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-0.5 shrink-0">
                <FiClock className="w-2.5 h-2.5" /> {item.preparationTime}m
              </span>
            )}
          </div>
        </div>

        {/* Right: Image & Add Stepper */}
        <div className="w-24 sm:w-28 shrink-0 flex flex-col justify-between items-center self-stretch">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden relative bg-slate-50 border border-slate-100 shadow-2xs shrink-0">
            <ImageWithFallback
              src={item?.image?.url}
              alt={item?.itemName}
              type="menu"
              className="w-full h-full object-cover rounded-xl transition-transform duration-300 hover:scale-105"
            />

            {isOutOfStock && (
              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[1px] flex items-center justify-center text-center p-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-white bg-rose-600 px-2 py-0.5 rounded shadow">
                  Sold Out
                </span>
              </div>
            )}
          </div>

          {/* Add Button / Stepper with Framer Motion */}
          <div className="mt-2 w-full">
            {isOutOfStock ? (
              <button
                disabled
                className="w-full py-1 text-xs font-semibold text-slate-400 bg-slate-100 rounded-lg cursor-not-allowed text-center"
              >
                Unavailable
              </button>
            ) : (
              <AnimatePresence mode="wait">
                {quantity === 0 ? (
                  <motion.button
                    key="add"
                    type="button"
                    disabled={disabled}
                    onClick={handleAddClick}
                    whileTap={{ scale: disabled ? 1 : 0.92 }}
                    whileHover={{ scale: disabled ? 1 : 1.02 }}
                    className="w-full py-1.5 bg-emerald-50 hover:bg-[#16A34A] text-[#16A34A] hover:text-white border border-[#16A34A]/40 hover:border-[#16A34A] rounded-xl text-xs font-bold tracking-wider transition-colors shadow-2xs flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiPlus className="w-3.5 h-3.5" /> ADD
                  </motion.button>
                ) : (
                  <motion.div
                    key="stepper"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="w-full flex items-center justify-between bg-[#16A34A] text-white rounded-xl px-1.5 py-1 shadow-sm"
                  >
                    <motion.button
                      type="button"
                      disabled={disabled}
                      onClick={handleDecrement}
                      whileTap={{ scale: disabled ? 1 : 0.8 }}
                      className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                    >
                      <FiMinus className="w-3.5 h-3.5" />
                    </motion.button>
                    <span className="text-xs font-extrabold px-1">{quantity}</span>
                    <motion.button
                      type="button"
                      disabled={disabled}
                      onClick={handleIncrement}
                      whileTap={{ scale: disabled ? 1 : 0.8 }}
                      className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                    >
                      <FiPlus className="w-3.5 h-3.5" />
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>
        </div>
      </motion.div>
    );
  },
  (prev, next) => {
    return (
      prev.item?._id === next.item?._id &&
      prev.quantity === next.quantity &&
      prev.disabled === next.disabled &&
      prev.item?.sellingPrice === next.item?.sellingPrice &&
      prev.item?.price === next.item?.price &&
      prev.item?.availability === next.item?.availability
    );
  }
);

export default CustomerMenuCard;
