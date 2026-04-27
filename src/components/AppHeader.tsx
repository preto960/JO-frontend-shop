'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, Settings, Menu, X } from 'lucide-react';
import SidebarMenu from '@/components/SidebarMenu';

export default function AppHeader() {
  const { logout, isEditor, user } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header style={{
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
      }}>
        {/* Left: hamburger */}
        <div style={{ position: 'absolute', left: 16 }}>
          <button
            onClick={() => setMenuOpen(true)}
            style={{
              background: 'none', border: 'none', color: 'var(--white)',
              cursor: 'pointer', padding: 4, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              width: 36, height: 36, borderRadius: 8,
            }}
            aria-label="Abrir menú"
          >
            <Menu size={24} />
          </button>
        </div>

        <h1 style={{ fontSize: 18, fontWeight: 600, textAlign: 'center' }}>JO-Shop</h1>

        {/* Right: logout */}
        <div style={{ position: 'absolute', right: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={logout}
            style={{ background: 'none', border: 'none', color: 'var(--white)', cursor: 'pointer', padding: 4 }}
            aria-label="Cerrar sesión"
          >
            <LogOut size={22} />
          </button>
        </div>
      </header>

      <SidebarMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
