'use client';

import { create } from 'zustand';
import Cookies from 'js-cookie';
import api from './api';

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  status: string;
  kycStatus: string;
  twoFactorEnabled: boolean;
  emailVerified?: boolean;
  referralCode?: string;
  lastLoginAt?: string;
  createdAt?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, twoFactorCode?: string) => Promise<any>;
  register: (data: any) => Promise<any>;
  logout: () => void;
  fetchProfile: () => Promise<void>;
  setUser: (user: User | null) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: !!Cookies.get('oldkraken-token'),
  isLoading: false,

  login: async (email, password, twoFactorCode?) => {
    const res = await api.post('/auth/login', { email, password, twoFactorCode });
    if (res.data.requires2FA) return res.data;
    Cookies.set('oldkraken-token', res.data.accessToken, { expires: 1 });
    Cookies.set('oldkraken-refresh', res.data.refreshToken, { expires: 7 });
    set({ user: res.data.user, isAuthenticated: true });
    return res.data;
  },

  register: async (data) => {
    const res = await api.post('/auth/register', data);
    Cookies.set('oldkraken-token', res.data.accessToken, { expires: 1 });
    Cookies.set('oldkraken-refresh', res.data.refreshToken, { expires: 7 });
    set({ user: res.data.user, isAuthenticated: true });
    return res.data;
  },

  logout: () => {
    api.post('/auth/logout').catch(() => {});
    Cookies.remove('oldkraken-token');
    Cookies.remove('oldkraken-refresh');
    set({ user: null, isAuthenticated: false });
    if (typeof window !== 'undefined') window.location.href = '/';
  },

  fetchProfile: async () => {
    try {
      set({ isLoading: true });
      const res = await api.get('/users/profile');
      set({ user: res.data, isAuthenticated: true, isLoading: false });
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  setTokens: (accessToken, refreshToken) => {
    Cookies.set('oldkraken-token', accessToken, { expires: 1 });
    Cookies.set('oldkraken-refresh', refreshToken, { expires: 7 });
    set({ isAuthenticated: true });
  },
}));
