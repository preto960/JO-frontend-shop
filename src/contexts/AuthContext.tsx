'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  birthdate?: string;
  twoFactorEnabled?: boolean;
  storeId?: string;
  permissions?: any;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ requiresOtp: boolean; email?: string }>;
  verifyOtp: (email: string, code: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<any>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load auth from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('joshop_auth');
    if (stored) {
      try {
        const { user, token } = JSON.parse(stored);
        if (token) {
          setToken(token);
          setUser(user);
          // Verify token is still valid
          api.get('/auth/me').then((res: any) => {
            const u = res.data || res.user || res;
            setUser(u);
            const updated = JSON.stringify({ user: u, token });
            localStorage.setItem('joshop_auth', updated);
            setIsLoading(false);
          }).catch(() => {
            localStorage.removeItem('joshop_auth');
            setToken(null);
            setUser(null);
            setIsLoading(false);
          });
          return;
        }
      } catch {
        localStorage.removeItem('joshop_auth');
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    const data = res.data || res;
    if (data.requiresOtp) {
      return { requiresOtp: true, email: data.email || email };
    }
    const u = data.user || data;
    const t = data.token || data.accessToken;
    if (t) {
      setToken(t);
      setUser(u);
      localStorage.setItem('joshop_auth', JSON.stringify({ user: u, token: t, refreshToken: data.refreshToken }));
    }
    return { requiresOtp: false };
  }, []);

  const verifyOtp = useCallback(async (email: string, code: string) => {
    const res = await api.post('/auth/login-verify', { email, code });
    const data = res.data || res;
    const u = data.user || data;
    const t = data.token || data.accessToken;
    if (t) {
      setToken(t);
      setUser(u);
      localStorage.setItem('joshop_auth', JSON.stringify({ user: u, token: t, refreshToken: data.refreshToken }));
    }
    return true;
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const res = await api.post('/auth/register', { name, email, password });
    return res.data || res;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('joshop_auth');
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  }, []);

  const updateProfile = useCallback(async (data: Partial<User>) => {
    const res = await api.put('/auth/me', data);
    const u = res.data || res.user || res;
    setUser(prev => {
      const updated = { ...prev, ...u };
      localStorage.setItem('joshop_auth', JSON.stringify({ user: updated, token }));
      return updated;
    });
  }, [token]);

  const refreshProfile = useCallback(async () => {
    try {
      const res = await api.get('/auth/me');
      const u = res.data || res.user || res;
      setUser(u);
      localStorage.setItem('joshop_auth', JSON.stringify({ user: u, token }));
    } catch {
      // ignore
    }
  }, [token]);

  return (
    <AuthContext.Provider value={{
      user, token, isLoading,
      login, verifyOtp, register, logout, updateProfile, refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
