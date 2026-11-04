export const safeNumber = (value, fallback = 0) => {
  const num = Number(value);
  return isNaN(num) ? fallback : num;
};

export const safeString = (value, fallback = '--') => {
  if (value === null || value === undefined || value === '') return fallback;
  return String(value);
};

export const formatCurrency = (amount) => {
  const num = safeNumber(amount, 0);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num);
};

export const formatDate = (dateVal) => {
  if (!dateVal) return '--';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return '--';
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const formatDateTime = (dateVal) => {
  if (!dateVal) return '--';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return '--';
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

