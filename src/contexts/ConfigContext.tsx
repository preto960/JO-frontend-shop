'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import api, { extractItem } from '@/lib/api';

interface Config {
  id?: string;
  key: string;
  value: string;
}

interface ConfigContextType {
  config: Config | null;
  isMultiStore: boolean;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export function ConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<Config | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchConfig = async () => {
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
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const isMultiStore = config?.value === 'true' || config?.value === true as any;

  return (
    <ConfigContext.Provider value={{ config, isMultiStore, isLoading, refresh: fetchConfig }}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  const ctx = useContext(ConfigContext);
  if (!ctx) throw new Error('useConfig must be used within ConfigProvider');
  return ctx;
}
