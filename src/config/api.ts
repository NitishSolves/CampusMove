// API and Socket.IO configuration
// Supports Vercel frontend pointing to Render backend via VITE_API_URL / VITE_SOCKET_URL,
// as well as unified full-stack hosting fallback to current origin.

const getBaseUrl = (): string => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return '';
};

const getSocketUrl = (): string => {
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return '';
};

export const API_BASE_URL = getBaseUrl();
export const SOCKET_BASE_URL = getSocketUrl();
