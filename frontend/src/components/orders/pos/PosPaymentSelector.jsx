import React from 'react';
import { formatCurrency } from '../../../utils/formatters';

const PAYMENT_METHODS = [
  { id: 'cash', label: 'Cash', icon: '💵' },
  { id: 'upi', label: 'UPI', icon: '📱' },
  { id: 'card', label: 'Card', icon: '💳' },
  { id: 'split', label: 'Split', icon: '🧾' },
];

export const PosPaymentSelector = ({
  paymentMethod = 'cash',
  onSelectPaymentMethod,
  splitCash = 0,
  onSplitCashChange,
  splitUpi = 0,
  onSplitUpiChange,
  splitCard = 0,
  onSplitCardChange,
  grandTotal = 0,
}) => {
  const splitTotal = Number(splitCash || 0) + Number(splitUpi || 0) + Number(splitCard || 0);
  const splitRemaining = Math.round((grandTotal - splitTotal) * 100) / 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
          Payment Method
        </span>
        <span className="text-[10px] text-slate-400 font-medium">Select tender</span>
      </div>

      {/* 4 Icon Buttons */}
      <div className="grid grid-cols-4 gap-1.5">
        {PAYMENT_METHODS.map((m) => {
          const isSelected = paymentMethod === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onSelectPaymentMethod(m.id)}
              className={`py-2 px-1 rounded-xl text-xs font-black flex flex-col items-center justify-center gap-1 transition-all duration-150 cursor-pointer active:scale-95 ${
                isSelected
                  ? 'bg-slate-900 text-white shadow-xs ring-2 ring-slate-900/20'
                  : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <span className="text-base leading-none">{m.icon}</span>
              <span className="text-[11px] font-bold tracking-tight">{m.label}</span>
            </button>
          );
        })}
      </div>

      {/* Split Payment Allocation Inputs */}
      {paymentMethod === 'split' && (
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 animate-in fade-in duration-150 text-xs">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] text-slate-600 font-bold block mb-0.5">
                💵 Cash (₹)
              </label>
              <input
                type="number"
                min="0"
                value={splitCash || ''}
                onChange={(e) => onSplitCashChange(Number(e.target.value) || 0)}
                placeholder="0"
                className="w-full text-xs p-1.5 bg-white border border-slate-200 rounded-lg font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-600 font-bold block mb-0.5">
                📱 UPI (₹)
              </label>
              <input
                type="number"
                min="0"
                value={splitUpi || ''}
                onChange={(e) => onSplitUpiChange(Number(e.target.value) || 0)}
                placeholder="0"
                className="w-full text-xs p-1.5 bg-white border border-slate-200 rounded-lg font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-600 font-bold block mb-0.5">
                💳 Card (₹)
              </label>
              <input
                type="number"
                min="0"
                value={splitCard || ''}
                onChange={(e) => onSplitCardChange(Number(e.target.value) || 0)}
                placeholder="0"
                className="w-full text-xs p-1.5 bg-white border border-slate-200 rounded-lg font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>

          <div className="flex justify-between items-center text-[11px] pt-1.5 border-t border-slate-200">
            <span className="text-slate-500 font-medium">Unallocated Balance:</span>
            <span
              className={`font-black font-mono ${
                Math.abs(splitRemaining) < 0.05 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {formatCurrency(splitRemaining)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PosPaymentSelector;

