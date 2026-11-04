export const PageLoader = ({ message = 'Loading...' }) => {
  return (
    <div className="min-h-[400px] w-full flex flex-col items-center justify-center p-8 text-center">
      <div className="w-10 h-10 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-3" />
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{message}</p>
    </div>
  );
};

