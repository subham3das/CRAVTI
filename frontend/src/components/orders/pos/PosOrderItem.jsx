import React, { useState } from 'react';
import { FiPlus, FiMinus, FiTrash2, FiEdit2, FiCheck, FiX } from 'react-icons/fi';
import { CustomerVegBadge } from '../../customer/CustomerVegBadge';
import { formatCurrency, safeNumber } from '../../../utils/formatters';

export const PosOrderItem = ({
  item,
  index,
  onUpdateQuantity,
  onUpdateNotes,
  onRemove,
}) => {
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [tempNotes, setTempNotes] = useState(item.notes || '');

  const lineTotal = safeNumber(item.sellingPrice || item.price || 0) * safeNumber(item.quantity || 1);

  const handleSaveNotes = () => {
    onUpdateNotes(index, tempNotes);
    setIsEditingNotes(false);
  };

  const handleCancelNotes = () => {
    setTempNotes(item.notes || '');
    setIsEditingNotes(false);
  };

  return (
    <div className="bg-white rounded-xl p-2.5 border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        {/* Left: Veg badge + Name */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <CustomerVegBadge type={item.foodType} />
          <div className="min-w-0 flex-1">
            <h5 className="font-bold text-xs text-slate-900 truncate" title={item.itemName}>
              {item.itemName}
            </h5>
            <span className="text-[10px] text-slate-400 font-mono">
              {formatCurrency(item.sellingPrice || item.price || 0)} each
            </span>
          </div>
        </div>

        {/* Right: Stepper + Total + Delete */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Stepper */}
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
            <button
              type="button"
              onClick={() => onUpdateQuantity(index, item.quantity - 1)}
              className="w-5 h-5 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-white rounded transition-colors active:scale-90"
              title="Decrease"
            >
              <FiMinus className="w-2.5 h-2.5" />
            </button>
            <span className="w-6 text-center text-xs font-black text-slate-800 font-mono">
              {item.quantity}
            </span>
            <button
              type="button"
              onClick={() => onUpdateQuantity(index, item.quantity + 1)}
              className="w-5 h-5 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-white rounded transition-colors active:scale-90"
              title="Increase"
            >
              <FiPlus className="w-2.5 h-2.5" />
            </button>
          </div>

          {/* Line Total */}
          <span className="text-xs font-extrabold text-slate-900 min-w-14 text-right">
            {formatCurrency(lineTotal)}
          </span>

          {/* Delete Button */}
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="p-1 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
            title="Remove item"
          >
            <FiTrash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Notes Section (Collapsed by Default) */}
      <div className="pt-0.5 text-[11px]">
        {isEditingNotes ? (
          <div className="flex items-center gap-1.5 pt-1">
            <input
              type="text"
              autoFocus
              placeholder="e.g. Less spicy, no onion, extra cheese..."
              value={tempNotes}
              onChange={(e) => setTempNotes(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveNotes();
                if (e.key === 'Escape') handleCancelNotes();
              }}
              className="flex-1 text-xs px-2.5 py-1 rounded-md bg-slate-50 border border-slate-300 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
            <button
              type="button"
              onClick={handleSaveNotes}
              className="p-1.5 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors"
              title="Save Note"
            >
              <FiCheck className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={handleCancelNotes}
              className="p-1.5 bg-slate-100 text-slate-500 rounded-md hover:bg-slate-200 transition-colors"
              title="Cancel"
            >
              <FiX className="w-3 h-3" />
            </button>
          </div>
        ) : item.notes ? (
          <div className="flex items-center justify-between bg-amber-50/70 border border-amber-200/50 rounded-md px-2 py-0.5 text-amber-800 text-[10px]">
            <span className="truncate italic flex-1" title={item.notes}>
              Note: {item.notes}
            </span>
            <div className="flex items-center gap-1 shrink-0 ml-1">
              <button
                type="button"
                onClick={() => {
                  setTempNotes(item.notes);
                  setIsEditingNotes(true);
                }}
                className="hover:text-amber-950 p-0.5"
                title="Edit note"
              >
                <FiEdit2 className="w-2.5 h-2.5" />
              </button>
              <button
                type="button"
                onClick={() => onUpdateNotes(index, '')}
                className="hover:text-rose-600 p-0.5"
                title="Clear note"
              >
                <FiX className="w-2.5 h-2.5" />
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              setTempNotes('');
              setIsEditingNotes(true);
            }}
            className="text-[10px] text-slate-400 hover:text-slate-700 font-semibold flex items-center gap-1 transition-colors"
          >
            <span>+ Add Note</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default PosOrderItem;

