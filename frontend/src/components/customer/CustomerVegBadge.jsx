export const CustomerVegBadge = ({ type = 'veg', className = '' }) => {
  const normalized = (type ?? 'veg').toString().trim().toLowerCase();

  if (normalized === 'veg') {
    return (
      <span
        title="Vegetarian"
        className={`inline-flex items-center justify-center w-4 h-4 border border-emerald-600 rounded-sm p-0.5 bg-white shrink-0 ${className}`}
      >
        <span className="w-2 h-2 rounded-full bg-emerald-600" />
      </span>
    );
  }

  if (normalized === 'non-veg') {
    return (
      <span
        title="Non-Vegetarian"
        className={`inline-flex items-center justify-center w-4 h-4 border border-rose-600 rounded-sm p-0.5 bg-white shrink-0 ${className}`}
      >
        <span className="w-0 h-0 border-l-[3.5px] border-l-transparent border-r-[3.5px] border-r-transparent border-b-[7px] border-b-rose-600" />
      </span>
    );
  }

  // Egg
  return (
    <span
      title="Contains Egg"
      className={`inline-flex items-center justify-center w-4 h-4 border border-amber-500 rounded-sm p-0.5 bg-white shrink-0 ${className}`}
    >
      <span className="w-2 h-2.5 rounded-full bg-amber-500" />
    </span>
  );
};

