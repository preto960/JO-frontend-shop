'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function HomePage() {
  const { user, isLoading, isAdmin, isEditor, isDelivery } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (isAdmin || isEditor) {
      router.replace('/admin');
    } else if (isDelivery) {
      router.replace('/delivery');
    } else {
      router.replace('/home');
    }
  }, [user, isLoading, router]);

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--primary-gradient)', color: 'white', position: 'relative', overflow: 'hidden',
    }}>
      {/* Decorative floating elements */}
      <div style={{
        position: 'absolute', top: '-60px', right: '-60px',
        width: 200, height: 200, borderRadius: '50%',
        background: 'rgba(255,255,255,0.08)',
      }} />
      <div style={{
        position: 'absolute', bottom: '-40px', left: '-40px',
        width: 160, height: 160, borderRadius: '50%',
        background: 'rgba(255,255,255,0.06)',
      }} />
      <div style={{
        position: 'absolute', top: '20%', left: '10%',
        width: 30, height: 30, borderRadius: '50%',
        background: 'rgba(255,255,255,0.05)',
      }} />

      <div className="animate-fade-in" style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'rgba(255,255,255,0.2)',
          backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, fontSize: 30, margin: '0 auto 20px',
          border: '2px solid rgba(255,255,255,0.3)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        }}>
          JO
        </div>

        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8, textShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          JO-Shop
        </h1>
        <p style={{ fontSize: 16, opacity: 0.85, marginBottom: 24 }}>
          Tu tienda en línea
        </p>

        {/* Spinner */}
        <div style={{
          width: 28, height: 28, border: '3px solid rgba(255,255,255,0.3)',
          borderTopColor: 'white', borderRadius: '50%', margin: '0 auto',
          animation: 'spin 1s linear infinite',
        }} />
      </div>
    </div>
  );
}
