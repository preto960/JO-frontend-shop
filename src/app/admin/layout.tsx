'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AppHeader from '@/components/AppHeader';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAdmin, isEditor } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!user || (!isAdmin && !isEditor))) {
      router.replace('/login');
    }
  }, [user, isLoading, isAdmin, isEditor, router]);

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--background)' }}>
        <div style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  if (!user || (!isAdmin && !isEditor)) return null;

  return (
    <>
      <AppHeader />
      <main style={{ minHeight: '100vh', background: 'var(--background)' }}>
        {children}
      </main>
    </>
  );
}
