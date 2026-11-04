export const Card = ({
  children,
  className = '',
  title,
  subtitle,
  action,
  headerBorder = true,
  padding = 'p-6',
  ...props
}) => {
  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 shadow-sm ${className}`}
      {...props}
    >
      {(title || action) && (
        <div
          className={`px-6 py-4 flex items-center justify-between ${
            headerBorder ? 'border-b border-slate-200' : ''
          }`}
        >
          <div>
            {title && <h3 className="text-base font-semibold text-slate-900">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className={padding}>{children}</div>
    </div>
  );
};

