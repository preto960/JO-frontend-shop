'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { showToast } from '@/lib/utils';

interface ShopConfig {
  multi_store: string;
  shop_name: string;
  shop_logo_url: string;
  primary_color: string;
  accent_color: string;
  [key: string]: string;
}

interface ConfigContextType {
  config: ShopConfig;
  isMultiStore: boolean;
  isLoading: boolean;
  isSaving: boolean;
  refresh: () => Promise<void>;
  updateConfig: (settings: Record<string, string>) => Promise<void>;
  uploadLogo: (file: File) => Promise<string>;
  deleteLogo: () => Promise<void>;
}

const defaultConfig: ShopConfig = {
  multi_store: 'false',
  shop_name: 'JO-Shop',
  shop_logo_url: '',
  primary_color: '#FF6B35',
  accent_color: '#E94560',
};

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export function ConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<ShopConfig>(defaultConfig);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchConfig = useCallback(async () => {
    try {
      const data = await api.get('/config');
      // data is a flat object { multi_store: "true", shop_name: "...", ... }
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        setConfig(prev => ({ ...prev, ...data }));
      }
    } catch {
      // Config endpoint might not be available
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateConfig = useCallback(async (settings: Record<string, string>) => {
    try {
      setIsSaving(true);
      await api.put('/config', { settings });
      setConfig(prev => ({ ...prev, ...settings }));
      showToast('Configuracion actualizada', 'success');
    } catch (err: any) {
      console.error('Error updating config:', err);
      showToast(err?.error || err?.message || 'Error al guardar configuracion', 'error');
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, []);

  const uploadLogo = useCallback(async (file: File): Promise<string> => {
    try {
      setIsSaving(true);
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/config/upload-logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = res?.url || res?.data?.url;
      if (url) {
        setConfig(prev => ({ ...prev, shop_logo_url: url }));
      }
      showToast('Logo actualizado', 'success');
      return url;
    } catch (err: any) {
      console.error('Error uploading logo:', err);
      showToast(err?.error || err?.message || 'Error al subir logo', 'error');
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, []);

  const deleteLogo = useCallback(async () => {
    try {
      setIsSaving(true);
      await api.delete('/config/upload-logo');
      setConfig(prev => ({ ...prev, shop_logo_url: '' }));
      showToast('Logo eliminado', 'success');
    } catch (err: any) {
      console.error('Error deleting logo:', err);
      showToast(err?.error || err?.message || 'Error al eliminar logo', 'error');
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  // ─── Sync config colors to CSS custom properties + persist to localStorage ──
  useEffect(() => {
    const root = document.documentElement;

    if (config.primary_color) {
      root.style.setProperty('--primary', config.primary_color);
      root.style.setProperty('--primary-hover', config.primary_color);
      root.style.setProperty('--primary-light', config.primary_color + '1A');
      root.style.setProperty('--primary-gradient', `linear-gradient(135deg, ${config.primary_color} 0%, ${config.primary_color}CC 100%)`);
      root.style.setProperty('--shadow-accent', `0 4px 14px ${config.primary_color}4D`);
    }

    if (config.accent_color) {
      root.style.setProperty('--accent', config.accent_color);
      root.style.setProperty('--accent-light', config.accent_color + '1A');
    }

    if (config.shop_name && config.shop_name !== 'JO-Shop') {
      document.title = config.shop_name;
    }

    // Persist colors to localStorage for instant load on next visit
    try {
      localStorage.setItem('joshop_theme', JSON.stringify({
        primary_color: config.primary_color,
        accent_color: config.accent_color,
        shop_name: config.shop_name,
      }));
    } catch { /* ignore */ }

    // Signal the loader script that the page is fully ready
    root.setAttribute('data-theme-ready', '');
    window.dispatchEvent(new Event('theme-ready'));
  }, [config.primary_color, config.accent_color, config.shop_name]);

  const isMultiStore = config.multi_store === 'true' || config.multi_store === true as any;

  return (
    <ConfigContext.Provider value={{ config, isMultiStore, isLoading, isSaving, refresh: fetchConfig, updateConfig, uploadLogo, deleteLogo }}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  const ctx = useContext(ConfigContext);
  if (!ctx) throw new Error('useConfig must be used within ConfigProvider');
  return ctx;
}
