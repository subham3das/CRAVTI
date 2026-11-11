import React, { useState, useRef, useEffect } from 'react';
import { MdOutlineTableRestaurant } from 'react-icons/md';
import { FiChevronDown, FiCheck, FiUsers } from 'react-icons/fi';

export const PosTableSelector = ({
  tables = [],
  selectedTableId = '',
  onSelectTable,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedTable = tables.find((t) => t._id === selectedTableId);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-[11px] font-bold text-slate-700 mb-1">
        Dining Table <span className="text-rose-500">*</span>
      </label>

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl border text-left transition-all duration-150 ${
          isOpen
            ? 'border-slate-900 ring-2 ring-slate-900/10 bg-white'
            : 'border-slate-200 bg-white hover:border-slate-300'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
            <MdOutlineTableRestaurant className="w-3.5 h-3.5" />
          </div>

          {selectedTable ? (
            <div className="flex items-center gap-1.5 min-w-0 text-xs">
              <span className="font-extrabold text-slate-900 whitespace-nowrap">
                Table {selectedTable.tableNumber}
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-600 font-medium whitespace-nowrap">
                {selectedTable.capacity || 4} Seats
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-500 truncate">
                {selectedTable.floor || 'Ground Floor'}
              </span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.2 rounded whitespace-nowrap ${
                  selectedTable.status === 'occupied'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                }`}
              >
                {selectedTable.status === 'occupied' ? 'Occupied' : 'Available'}
              </span>
            </div>
          ) : (
            <span className="text-xs text-slate-400 font-medium">
              -- Choose Dining Table --
            </span>
          )}
        </div>

        <FiChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-56 overflow-y-auto p-1 space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
          {tables.length === 0 ? (
            <div className="px-3 py-3 text-center text-xs text-slate-400">
              No tables found in this restaurant
            </div>
          ) : (
            tables.map((t) => {
              const isSelected = t._id === selectedTableId;
              const isOccupied = t.status === 'occupied';

              return (
                <button
                  key={t._id}
                  type="button"
                  onClick={() => {
                    onSelectTable(t._id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-colors cursor-pointer text-left ${
                    isSelected
                      ? 'bg-slate-900 text-white'
                      : 'hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-extrabold whitespace-nowrap">
                      Table {t.tableNumber}
                    </span>
                    <span className="opacity-40">•</span>
                    <span
                      className={`flex items-center gap-1 font-medium whitespace-nowrap ${
                        isSelected ? 'text-slate-200' : 'text-slate-500'
                      }`}
                    >
                      <FiUsers className="w-3 h-3 opacity-70" />
                      {t.capacity || 4} Seats
                    </span>
                    <span className="opacity-40">•</span>
                    <span
                      className={`truncate ${
                        isSelected ? 'text-slate-300' : 'text-slate-400'
                      }`}
                    >
                      {t.floor || 'Ground Floor'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span
                      className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded tracking-wider ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : isOccupied
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {isOccupied ? 'Occupied' : 'Available'}
                    </span>
                    {isSelected && <FiCheck className="w-3.5 h-3.5 text-white" />}
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default PosTableSelector;

