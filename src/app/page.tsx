'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (user.role === 'admin' || user.role === 'editor') {
      router.replace('/admin');
    } else if (user.role === 'delivery') {
      router.replace('/delivery');
    } else {
      router.replace('/home');
    }
  }, [user, isLoading, router]);

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--primary)', color: 'white',
    }}>
      <div className="animate-fade-in" style={{ textAlign: 'center' }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%', background: 'var(--accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, fontSize: 24, margin: '0 auto 16px',
        }}>
          JO
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>JO-Shop</h1>
        <div style={{
          width: 24, height: 24, border: '3px solid rgba(255,255,255,0.3)',
          borderTopColor: 'white', borderRadius: '50%', margin: '0 auto',
          animation: 'spin 1s linear infinite',
        }} />
      </div>
    </div>
  );
}
