export const Loader = ({
  size = 'md',
  fullScreen = false,
  message = 'Loading...',
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className={`${sizeClasses[size]} border-slate-200 border-t-[#16A34A] rounded-full animate-spin`}
      />
      {message && <p className="text-xs font-medium text-slate-500">{message}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50/80 backdrop-blur-none">
        {spinner}
      </div>
    );
  }

  return <div className="py-8 flex items-center justify-center">{spinner}</div>;
};

