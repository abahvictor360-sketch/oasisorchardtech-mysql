export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

// Safari can't parse MySQL-style 'YYYY-MM-DD HH:MM:SS' strings — convert to ISO first
export const parseDate = (value) => {
  if (value instanceof Date) return value;
  if (typeof value === 'string' && value.includes(' ') && !value.includes('T')) {
    return new Date(value.replace(' ', 'T'));
  }
  return new Date(value);
};

export const formatDate = (dateStr) => {
  const d = parseDate(dateStr);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

export const formatDateTime = (dateStr) => {
  const d = parseDate(dateStr);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export const generateOrderId = () => {
  return 'OT-' + Math.floor(10000 + Math.random() * 90000);
};

export const calculateDiscount = (original, current) => {
  const savings = original - current;
  const percent = Math.round((savings / original) * 100);
  return { savings, percent };
};

export const getStockStatus = (stock) => {
  if (stock === 0) return { label: 'Out of Stock', color: 'text-red-500' };
  if (stock < 6) return { label: `Only ${stock} left!`, color: 'text-orange-500' };
  return { label: `In Stock (${stock} units)`, color: 'text-green-500' };
};

export const truncate = (str, n) => str?.length > n ? str.slice(0, n) + '...' : str;

export const getInitials = (name) => {
  return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
};

export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const randomBetween = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
