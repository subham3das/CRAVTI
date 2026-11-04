const variants = {
  neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  primary: 'bg-emerald-50 text-[#16A34A] border-emerald-200',
  success: 'bg-green-50 text-[#22C55E] border-green-200',
  warning: 'bg-amber-50 text-[#F59E0B] border-amber-200',
  danger: 'bg-red-50 text-[#EF4444] border-red-200',
  blue: 'bg-blue-50 text-blue-600 border-blue-200',
};

const sizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm',
};

export const Badge = ({
  children,
  variant = 'neutral',
  size = 'md',
  dot = false,
  className = '',
}) => {
  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${variants[variant]} ${sizes[size]} gap-1.5 ${className}`}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            variant === 'primary' ? 'bg-[#16A34A]' :
            variant === 'success' ? 'bg-[#22C55E]' :
            variant === 'warning' ? 'bg-[#F59E0B]' :
            variant === 'danger' ? 'bg-[#EF4444]' : 'bg-slate-400'
          }`}
        />
      )}
      {children}
    </span>
  );
};

