import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
  baseURL: typeof window !== 'undefined' ? '/api' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000') + '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = Cookies.get('oldkraken-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const locale = typeof localStorage !== 'undefined' ? localStorage.getItem('oldkraken-locale') : 'en';
  if (locale) {
    config.headers['Accept-Language'] = locale;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = Cookies.get('oldkraken-refresh');
      if (refreshToken) {
        try {
          const res = await axios.post(`${api.defaults.baseURL}/auth/refresh`, { refreshToken });
          Cookies.set('oldkraken-token', res.data.accessToken, { expires: 1 });
          Cookies.set('oldkraken-refresh', res.data.refreshToken, { expires: 7 });
          error.config.headers.Authorization = `Bearer ${res.data.accessToken}`;
          return api(error.config);
        } catch {
          Cookies.remove('oldkraken-token');
          Cookies.remove('oldkraken-refresh');
          if (typeof window !== 'undefined') window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  },
);

export default api;
