'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api, { extractItem } from '@/lib/api';
import { showToast } from '@/lib/utils';

interface Config {
  id?: string;
  key: string;
  value: string;
}

interface ConfigContextType {
  config: Config | null;
  isMultiStore: boolean;
  isLoading: boolean;
  isSaving: boolean;
  refresh: () => Promise<void>;
  updateConfig: (settings: Record<string, string>) => Promise<void>;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export function ConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<Config | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchConfig = useCallback(async () => {
    try {
      const res = await api.get('/config');
      const items = extractItem(res);
      // Config might come as an array of {key, value} pairs
      if (Array.isArray(items)) {
        const multiStore = items.find((c: any) => c.key === 'multi_store');
        if (multiStore) setConfig(multiStore);
      } else if (items && items.key) {
        setConfig(items);
      } else if (items) {
        // Could be an object with multi_store property
        if (items.multi_store !== undefined) {
          setConfig({ key: 'multi_store', value: String(items.multi_store) });
        }
      }
    } catch {
      // Config endpoint might not exist yet
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateConfig = useCallback(async (settings: Record<string, string>) => {
    try {
      setIsSaving(true);
      await api.put('/config', { settings });
      // Immediately update local state
      setConfig((prev) => {
        const updated: Config = prev ? { ...prev } : { key: 'multi_store', value: 'false' };
        for (const [key, value] of Object.entries(settings)) {
          if (key === 'multi_store') {
            updated.key = 'multi_store';
            updated.value = value;
          }
        }
        return updated;
      });
      showToast('Configuracion actualizada', 'success');
    } catch (err: any) {
      console.error('Error updating config:', err);
      showToast(err?.message || 'Error al guardar configuracion', 'error');
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const isMultiStore = config?.value === 'true' || config?.value === true as any;

  return (
    <ConfigContext.Provider value={{ config, isMultiStore, isLoading, isSaving, refresh: fetchConfig, updateConfig }}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  const ctx = useContext(ConfigContext);
  if (!ctx) throw new Error('useConfig must be used within ConfigProvider');
  return ctx;
}
