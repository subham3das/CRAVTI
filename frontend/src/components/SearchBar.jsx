import { FiSearch, FiX } from 'react-icons/fi';

export const SearchBar = ({
  value,
  onChange,
  onClear,
  placeholder = 'Search...',
  className = '',
}) => {
  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
        <FiSearch className="w-4 h-4" />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-8 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-emerald-500/20"
      />
      {value && (
        <button
          type="button"
          onClick={() => (onClear ? onClear() : onChange(''))}
          className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
        >
          <FiX className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

