'use client';

import React, { useState, useEffect, useRef } from 'react';
import { LogOut, Settings, ArrowLeft, Menu, ShoppingCart, LogIn } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import SidebarMenu from './SidebarMenu';
import CartDropdown from './CartDropdown';

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
  const [cartCount, setCartCount] = useState(0);
  const [cartOpen, setCartOpen] = useState(false);
  const cartBtnRef = useRef<HTMLButtonElement>(null);

  const canShowSettings = showSettings && !isEditor;
  const isLoggedIn = !!user;

  useEffect(() => {
    const updateCart = () => {
      try {
        const cart = JSON.parse(localStorage.getItem('joshop_cart') || '[]');
        setCartCount(cart.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0));
      } catch {
        setCartCount(0);
      }
    };
    updateCart();
    window.addEventListener('cartUpdated', updateCart);
    window.addEventListener('storage', updateCart);
    return () => {
      window.removeEventListener('cartUpdated', updateCart);
      window.removeEventListener('storage', updateCart);
    };
  }, []);

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
          boxShadow: 'var(--shadow-accent)',
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
          {!showBack && isLoggedIn && (
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
              onClick={() => router.push('/manage-users')}
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
          {/* Cart icon with badge + dropdown */}
          {isLoggedIn && (
            <div style={{ position: 'relative' }}>
              <button
                ref={cartBtnRef}
                onClick={() => setCartOpen(!cartOpen)}
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
                  position: 'relative',
                }}
                aria-label="Carrito"
              >
                <ShoppingCart size={20} />
                {cartCount > 0 && (
                  <span style={{
                    position: 'absolute', top: 2, right: 2,
                    background: 'var(--danger)', color: 'var(--white)',
                    fontSize: 10, fontWeight: 700,
                    minWidth: 16, height: 16, borderRadius: 8,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '0 4px',
                  }}>
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </button>
              <CartDropdown
                isOpen={cartOpen}
                onClose={() => setCartOpen(false)}
                anchorRef={cartBtnRef}
              />
            </div>
          )}
          {rightAction}
          {isLoggedIn && showLogout && (
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
      {isLoggedIn && <SidebarMenu open={menuOpen} onClose={() => setMenuOpen(false)} />}
    </>
  );
}
