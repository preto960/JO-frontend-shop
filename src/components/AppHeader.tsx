'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, Menu, ShoppingBag } from 'lucide-react';
import SidebarMenu from '@/components/SidebarMenu';

export default function AppHeader() {
  const { logout, isEditor, user } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header style={{
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
        borderRadius: '0 0 16px 16px',
      }}>
        {/* Glass overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '0 0 16px 16px',
          background: 'rgba(255,255,255,0.08)',
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
          pointerEvents: 'none',
        }} />

        {/* Left: hamburger */}
        <div style={{ position: 'absolute', left: 16, zIndex: 1 }}>
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
        </div>

        {/* Center: Logo + Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, zIndex: 1 }}>
          <ShoppingBag size={22} strokeWidth={2.5} />
          <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.3px' }}>JO-Shop</h1>
        </div>

        {/* Right: logout */}
        <div style={{ position: 'absolute', right: 16, zIndex: 1 }}>
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
        </div>
      </header>

      <SidebarMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
