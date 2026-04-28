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
