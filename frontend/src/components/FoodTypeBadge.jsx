export const FoodTypeBadge = ({ type = 'veg', showLabel = false, size = 'md' }) => {
  const normalized = (type ?? 'veg').toString().trim().toLowerCase();

  const sizeClasses = {
    sm: 'w-3.5 h-3.5 p-0.5',
    md: 'w-4 h-4 p-0.5',
    lg: 'w-5 h-5 p-1',
  };

  const dotClasses = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
  };

  if (normalized === 'veg') {
    return (
      <span className="inline-flex items-center gap-1.5" title="Vegetarian">
        <span
          className={`border-2 border-emerald-600 rounded-[3px] flex items-center justify-center bg-white shrink-0 ${sizeClasses[size]}`}
        >
          <span className={`rounded-full bg-emerald-600 ${dotClasses[size]}`} />
        </span>
        {showLabel && <span className="text-xs font-medium text-emerald-700">Veg</span>}
      </span>
    );
  }

  if (normalized === 'non-veg' || normalized === 'nonveg') {
    return (
      <span className="inline-flex items-center gap-1.5" title="Non-Vegetarian">
        <span
          className={`border-2 border-red-600 rounded-[3px] flex items-center justify-center bg-white shrink-0 ${sizeClasses[size]}`}
        >
          <span
            className="w-0 h-0 border-l-[3.5px] border-r-[3.5px] border-b-[6px] border-transparent border-b-red-600"
          />
        </span>
        {showLabel && <span className="text-xs font-medium text-red-700">Non-Veg</span>}
      </span>
    );
  }

  // Egg
  return (
    <span className="inline-flex items-center gap-1.5" title="Contains Egg">
      <span
        className={`border-2 border-amber-500 rounded-[3px] flex items-center justify-center bg-white shrink-0 ${sizeClasses[size]}`}
      >
        <span className={`rounded-full bg-amber-500 ${dotClasses[size]}`} />
      </span>
      {showLabel && <span className="text-xs font-medium text-amber-700">Egg</span>}
    </span>
  );
};

