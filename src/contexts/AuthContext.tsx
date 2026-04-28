'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';

interface Permission {
  id?: string;
  code: string;
  name?: string;
}

interface Role {
  id?: string;
  name: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  roles?: Role[];
  permissions?: Permission[];
  phone?: string;
  birthdate?: string;
  twoFactorEnabled?: boolean;
  storeId?: string;
  stores?: any[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ requiresOtp: boolean; email?: string; error?: string }>;
  verifyOtp: (email: string, code: string) => Promise<boolean>;
  resendOtpCode: (email: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<any>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  refreshProfile: () => Promise<void>;
  // 2FA functions
  send2FACode: (action: 'enable' | 'disable') => Promise<{ message: string } | null>;
  verify2FASetup: (code: string, action: 'enable' | 'disable') => Promise<boolean>;
  // Role helpers
  userRole: string;
  isAdmin: boolean;
  isEditor: boolean;
  isDelivery: boolean;
  isCustomer: boolean;
  hasPermission: (code: string) => boolean;
  canViewModule: (moduleName: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function extractUser(data: any): User | null {
  if (!data) return null;
  // Direct user object
  if (data.id && (data.email || data.name)) return data;
  // Nested in .data
  if (data.data && typeof data.data === 'object' && data.data.id) return data.data;
  // Nested in .user
  if (data.user && typeof data.user === 'object' && data.user.id) return data.user;
  return null;
}

function extractToken(data: any): string | null {
  if (!data) return null;
  return data.token || data.accessToken || null;
}

function extractRefreshToken(data: any): string | null {
  if (!data) return null;
  return data.refreshToken || null;
}

function getRoleFromUser(user: User): string {
  if (!user) return 'customer';
  // Backend sends roles as array of {name: 'admin'} or role as string
  if (user.roles && Array.isArray(user.roles) && user.roles.length > 0) {
    return user.roles[0].name.toLowerCase();
  }
  if (user.role && typeof user.role === 'string') {
    return user.role.toLowerCase();
  }
  if (user.role && typeof user.role === 'object' && 'name' in user.role) {
    return String((user.role as any).name).toLowerCase();
  }
  return 'customer';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load auth from localStorage on mount
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const stored = localStorage.getItem('joshop_auth');
        if (stored) {
          const parsed = JSON.parse(stored);
          const u = extractUser(parsed);
          const t = parsed.token || extractToken(parsed);

          if (u && t) {
            setToken(t);
            setUser(u);

            // Verify token is still valid by fetching fresh profile
            try {
              const res = await api.get('/auth/me');
              const freshUser = extractUser(res);
              if (freshUser) {
                setUser(freshUser);
                const updated = JSON.stringify({ user: freshUser, token: t, refreshToken: parsed.refreshToken });
                localStorage.setItem('joshop_auth', updated);
              }
            } catch {
              // Token invalid - clear session
              localStorage.removeItem('joshop_auth');
              setToken(null);
              setUser(null);
            }
          }
        }
      } catch {
        localStorage.removeItem('joshop_auth');
      }
      setIsLoading(false);
    };
    restoreSession();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await api.post('/auth/login', { email, password });

      // Check for 2FA
      if (res.requiresOtp || res.data?.requiresOtp) {
        return { requiresOtp: true, email: res.email || res.data?.email || email };
      }

      const u = extractUser(res);
      const t = extractToken(res);
      const rt = extractRefreshToken(res);

      if (u && t) {
        setToken(t);
        setUser(u);
        localStorage.setItem('joshop_auth', JSON.stringify({ user: u, token: t, refreshToken: rt }));
        return { requiresOtp: false };
      }

      return { requiresOtp: false, error: 'Respuesta inesperada del servidor' };
    } catch (err: any) {
      const message = err?.message || err?.error || 'Error al iniciar sesión';
      return { requiresOtp: false, error: message };
    }
  }, []);

  const verifyOtp = useCallback(async (email: string, code: string) => {
    const res = await api.post('/auth/login-verify', { email, code });
    const u = extractUser(res);
    const t = extractToken(res);
    const rt = extractRefreshToken(res);

    if (u && t) {
      setToken(t);
      setUser(u);
      localStorage.setItem('joshop_auth', JSON.stringify({ user: u, token: t, refreshToken: rt }));
      return true;
    }
    return false;
  }, []);

  const resendOtpCode = useCallback(async (email: string) => {
    try {
      await api.post('/auth/2fa/resend-code', { email });
      return true;
    } catch {
      return false;
    }
  }, []);

  // ─── 2FA Setup Functions ─────────────────────────────────────────────
  const send2FACode = useCallback(async (action: 'enable' | 'disable') => {
    try {
      const res = await api.post('/auth/2fa/send-code', { action });
      return { message: res?.message || 'Código enviado' };
    } catch (err: any) {
      throw new Error(err?.message || 'Error al enviar código');
    }
  }, []);

  const verify2FASetup = useCallback(async (code: string, action: 'enable' | 'disable') => {
    try {
      const res = await api.post('/auth/2fa/verify-setup', { code, action });
      const u = extractUser(res);
      if (u) {
        setUser(prev => {
          const updated = { ...prev, ...u } as User;
          localStorage.setItem('joshop_auth', JSON.stringify({ user: updated, token }));
          return updated;
        });
        return true;
      }
      return false;
    } catch (err: any) {
      throw new Error(err?.message || 'Código inválido');
    }
  }, [token]);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const res = await api.post('/auth/register', { name, email, password });
    const u = extractUser(res);
    const t = extractToken(res);
    const rt = extractRefreshToken(res);

    if (u && t) {
      setToken(t);
      setUser(u);
      localStorage.setItem('joshop_auth', JSON.stringify({ user: u, token: t, refreshToken: rt }));
    }
    return res;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('joshop_auth');
    setToken(null);
    setUser(null);
    window.location.href = '/';
  }, []);

  const updateProfile = useCallback(async (data: Partial<User>) => {
    const res = await api.put('/auth/me', data);
    const u = extractUser(res);
    if (u) {
      setUser(prev => {
        const updated = { ...prev, ...u } as User;
        localStorage.setItem('joshop_auth', JSON.stringify({ user: updated, token }));
        return updated;
      });
    }
  }, [token]);

  const refreshProfile = useCallback(async () => {
    try {
      const res = await api.get('/auth/me');
      const u = extractUser(res);
      if (u) {
        setUser(u);
        localStorage.setItem('joshop_auth', JSON.stringify({ user: u, token }));
      }
    } catch {
      // ignore
    }
  }, [token]);

  // ─── Role helpers ─────────────────────────────────────────────────────
  const userRole = user ? getRoleFromUser(user) : '';

  const isAdmin = userRole === 'admin';
  const isEditor = userRole === 'editor';
  const isDelivery = userRole === 'delivery';
  const isCustomer = userRole === 'customer' || (!isAdmin && !isEditor && !isDelivery);

  const hasPermission = useCallback((code: string): boolean => {
    if (!user?.permissions) return false;
    if (Array.isArray(user.permissions)) {
      return user.permissions.some((p: any) => p.code === code);
    }
    return false;
  }, [user?.permissions]);

  const canViewModule = useCallback((moduleName: string): boolean => {
    if (isAdmin) return true;
    if (!user?.permissions) return false;
    if (Array.isArray(user.permissions)) {
      return user.permissions.some((p: any) => p.code === `${moduleName}.view_menu`);
    }
    return false;
  }, [user?.permissions, isAdmin]);

  return (
    <AuthContext.Provider value={{
      user, token, isLoading,
      login, verifyOtp, resendOtpCode, register, logout, updateProfile, refreshProfile,
      send2FACode, verify2FASetup,
      userRole, isAdmin, isEditor, isDelivery, isCustomer,
      hasPermission, canViewModule,
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
