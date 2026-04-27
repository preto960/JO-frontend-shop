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
          background: 'var(--primary-gradient)',
          color: 'var(--white)',
          padding: '0 16px',
          height: 60,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          boxShadow: '0 2px 20px rgba(255,107,53,0.3)',
        }}
      >
        {/* Left section */}
        <div style={{
          position: 'absolute',
          left: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          zIndex: 1,
        }}>
          {!showBack && (
            <button
              onClick={() => setMenuOpen(true)}
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: 'none',
                color: 'var(--white)',
                cursor: 'pointer',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 40,
                height: 40,
                borderRadius: 'var(--radius-sm)',
                transition: 'var(--transition-fast)',
              }}
              aria-label="Abrir menú"
            >
              <Menu size={22} />
            </button>
          )}
          {showBack && (
            <button
              onClick={onBack || (() => router.back())}
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: 'none',
                color: 'var(--white)',
                cursor: 'pointer',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 40,
                height: 40,
                borderRadius: 'var(--radius-sm)',
                transition: 'var(--transition-fast)',
              }}
              aria-label="Volver"
            >
              <ArrowLeft size={22} />
            </button>
          )}
        </div>

        {/* Center title */}
        <h1 style={{ fontSize: 18, fontWeight: 700, textAlign: 'center', letterSpacing: '-0.2px', zIndex: 1 }}>{title}</h1>

        {/* Right section */}
        <div style={{ position: 'absolute', right: 16, display: 'flex', gap: 8, alignItems: 'center', zIndex: 1 }}>
          {canShowSettings && (
            <button
              onClick={() => router.push('/admin/users')}
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: 'none',
                color: 'var(--white)',
                cursor: 'pointer',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 40,
                height: 40,
                borderRadius: 'var(--radius-sm)',
                transition: 'var(--transition-fast)',
              }}
              aria-label="Configuración"
            >
              <Settings size={20} />
            </button>
          )}
          {rightAction}
          {showLogout && (
            <button
              onClick={logout}
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: 'none',
                color: 'var(--white)',
                cursor: 'pointer',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 40,
                height: 40,
                borderRadius: 'var(--radius-sm)',
                transition: 'var(--transition-fast)',
              }}
              aria-label="Cerrar sesión"
            >
              <LogOut size={20} />
            </button>
          )}
        </div>
      </header>

      {/* Sidebar menu */}
      <SidebarMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
