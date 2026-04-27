'use client';

import React, { useState } from 'react';
import { LogOut, Settings, ArrowLeft, Menu } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import SidebarMenu from './SidebarMenu';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  showLogout?: boolean;
  showSettings?: boolean;
  rightAction?: React.ReactNode;
  onBack?: () => void;
}

export default function Header({ title, showBack, showLogout = true, showSettings, rightAction, onBack }: HeaderProps) {
  const { logout, user, isEditor } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const canShowSettings = showSettings && !isEditor;

  return (
    <>
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
        {/* Left section */}
        <div style={{
          position: 'absolute',
          left: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}>
          {!showBack && (
            <button
              onClick={() => setMenuOpen(true)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--white)',
                cursor: 'pointer',
                padding: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 36,
                height: 36,
                borderRadius: 8,
              }}
              aria-label="Abrir menú"
            >
              <Menu size={24} />
            </button>
          )}
          {showBack && (
            <button
              onClick={onBack || (() => router.back())}
              style={{
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
        </div>

        <h1 style={{ fontSize: 18, fontWeight: 600, textAlign: 'center' }}>{title}</h1>

        {/* Right section */}
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

      {/* Sidebar menu */}
      <SidebarMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
