/**
 * Production Loading Skeletons (Standard 16)
 * Replaces blank flashing screens with smooth animated pulse placeholders.
 */
export const Skeleton = ({ className = '', ...props }) => {
  return (
    <div
      className={`animate-pulse bg-slate-200/80 rounded-xl ${className}`}
      {...props}
    />
  );
};

Skeleton.Card = ({ count = 3, className = '' }) => (
  <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3 shadow-2xs">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-24 rounded-lg" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-14 w-full rounded-xl" />
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-24 rounded-xl" />
        </div>
      </div>
    ))}
  </div>
);

Skeleton.Table = ({ rows = 5, cols = 5, className = '' }) => (
  <div className={`bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs ${className}`}>
    <div className="p-4 border-b border-slate-100 bg-slate-50/60 flex gap-4">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} className="h-4 flex-1 rounded" />
      ))}
    </div>
    <div className="divide-y divide-slate-100 p-4 space-y-4">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 items-center">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="h-5 flex-1 rounded-md" />
          ))}
        </div>
      ))}
    </div>
  </div>
);

Skeleton.MenuItem = ({ count = 4, className = '' }) => (
  <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="bg-white rounded-2xl border border-slate-200 overflow-hidden p-4 flex gap-4 shadow-2xs">
        <Skeleton className="w-24 h-24 rounded-xl shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4 rounded" />
          <Skeleton className="h-3 w-full rounded" />
          <Skeleton className="h-3 w-1/2 rounded" />
          <div className="flex justify-between items-center pt-2">
            <Skeleton className="h-5 w-16 rounded" />
            <Skeleton className="h-7 w-20 rounded-xl" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

Skeleton.Metric = ({ count = 4, className = '' }) => (
  <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 space-y-2 shadow-2xs">
        <Skeleton className="h-3 w-20 rounded" />
        <Skeleton className="h-7 w-28 rounded-lg" />
        <Skeleton className="h-3 w-32 rounded" />
      </div>
    ))}
  </div>
);

export default Skeleton;

