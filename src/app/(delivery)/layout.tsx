'use client';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AppHeader from '@/components/AppHeader';

export default function DeliveryLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isDelivery } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!user || !isDelivery)) {
      router.replace('/login');
    }
  }, [user, isLoading, isDelivery, router]);

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--background)' }}>
        <div style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  if (!user || !isDelivery) return null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <AppHeader />
      <div style={{ padding: '0 16px 24px' }}>{children}</div>
    </div>
  );
}
