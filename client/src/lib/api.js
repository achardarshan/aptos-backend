import { clearSession, getToken } from './auth';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export async function apiFetch(path, options = {}) {
  const headers = new Headers(options.headers || {});
  const token = getToken();

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (response.status === 401) {
    clearSession();
    window.location.assign('/login');
    return null;
  }

  if (!response.ok) {
    if (typeof data === 'object' && data !== null) {
      return { success: false, message: data.message || response.statusText };
    }

    return { success: false, message: response.statusText || 'Request failed' };
  }

  return data;
}

export const formatDate = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const formatDateTime = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatTime = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

export const formatStatus = (value = '') => {
  const normalised = String(value).replace(/-/g, ' ');
  return normalised.charAt(0).toUpperCase() + normalised.slice(1);
};

export const statusTone = (status = '') => {
  const value = String(status).toLowerCase();

  if (['approved', 'resolved', 'paid', 'present', 'active'].includes(value)) return 'success';
  if (['rejected', 'unpaid', 'absent', 'danger'].includes(value)) return 'danger';
  if (['pending', 'in-progress', 'warning'].includes(value)) return 'warning';
  if (['admin', 'security'].includes(value)) return 'accent';
  return 'neutral';
};
