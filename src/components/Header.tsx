'use client';

import React from 'react';
import { LogOut, Settings, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  showLogout?: boolean;
  showSettings?: boolean;
  rightAction?: React.ReactNode;
  onBack?: () => void;
}

export default function Header({ title, showBack, showLogout = true, showSettings, rightAction, onBack }: HeaderProps) {
  const { logout, user } = useAuth();
  const router = useRouter();

  const canShowSettings = showSettings && user?.role !== 'editor';

  return (
    <header
      style={{
        background: 'var(--primary)',
        color: 'var(--white)',
        padding: '0 16px',
        height: '56px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: 'var(--shadow-md)',
      }}
    >
      {showBack && (
        <button
          onClick={onBack || (() => router.back())}
          style={{
            position: 'absolute',
            left: 16,
            background: 'none',
            border: 'none',
            color: 'var(--white)',
            cursor: 'pointer',
            padding: 4,
          }}
          aria-label="Volver"
        >
          <ArrowLeft size={24} />
        </button>
      )}
      <h1 style={{ fontSize: 18, fontWeight: 600, textAlign: 'center' }}>{title}</h1>
      <div style={{ position: 'absolute', right: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
        {canShowSettings && (
          <button
            onClick={() => router.push('/admin/users')}
            style={{ background: 'none', border: 'none', color: 'var(--white)', cursor: 'pointer', padding: 4 }}
            aria-label="Configuración"
          >
            <Settings size={22} />
          </button>
        )}
        {rightAction}
        {showLogout && (
          <button
            onClick={logout}
            style={{ background: 'none', border: 'none', color: 'var(--white)', cursor: 'pointer', padding: 4 }}
            aria-label="Cerrar sesión"
          >
            <LogOut size={22} />
          </button>
        )}
      </div>
    </header>
  );
}
