'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useConfig } from '@/contexts/ConfigContext';
import { LogOut, Menu, ShoppingBag, ShoppingCart, Heart } from 'lucide-react';
import SidebarMenu from '@/components/SidebarMenu';
import CartDropdown from '@/components/CartDropdown';
import FavoritesDropdown from '@/components/FavoritesDropdown';

export default function AppHeader() {
  const { logout, isEditor, user } = useAuth();
  const { config } = useConfig();
  const shopName = config.shop_name || 'JO-Shop';
  const shopLogoUrl = config.shop_logo_url || '';
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [cartOpen, setCartOpen] = useState(false);
  const cartBtnRef = useRef<HTMLButtonElement>(null);
  const [favCount, setFavCount] = useState(0);
  const [favOpen, setFavOpen] = useState(false);
  const favBtnRef = useRef<HTMLButtonElement>(null);

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

  useEffect(() => {
    const updateFavs = () => {
      try {
        const favs: string[] = JSON.parse(localStorage.getItem('joshop_favorites') || '[]');
        setFavCount(favs.length);
      } catch {
        setFavCount(0);
      }
    };
    updateFavs();
    window.addEventListener('favoritesUpdated', updateFavs);
    window.addEventListener('storage', updateFavs);
    return () => {
      window.removeEventListener('favoritesUpdated', updateFavs);
      window.removeEventListener('storage', updateFavs);
    };
  }, []);

  return (
    <>
      <header style={{
        background: 'var(--primary-gradient)',
        color: 'var(--white)',
        padding: '0 16px',
        height: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: 'var(--shadow-accent)',
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
              width: 44,
              height: 44,
              borderRadius: 'var(--radius-sm)',
              transition: 'var(--transition-fast)',
            }}
            aria-label="Abrir menú"
          >
            <Menu size={24} />
          </button>
        </div>

        {/* Center: Logo + Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, zIndex: 1 }}>
          {shopLogoUrl ? (
            <img src={shopLogoUrl} alt={shopName} style={{ height: 80, width: 'auto', objectFit: 'contain' }} />
          ) : (
            <>
              <ShoppingBag size={26} strokeWidth={2.5} />
              <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.3px' }}>{shopName}</h1>
            </>
          )}
        </div>

        {/* Right: favorites + cart dropdown + logout */}
        <div style={{ position: 'absolute', right: 16, zIndex: 1, display: 'flex', gap: 8 }}>
          {/* Favorites icon with badge + dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              ref={favBtnRef}
              onClick={() => { setFavOpen(!favOpen); setCartOpen(false); }}
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: 'none',
                color: 'var(--white)',
                cursor: 'pointer',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 44,
                height: 44,
                borderRadius: 'var(--radius-sm)',
                transition: 'var(--transition-fast)',
                position: 'relative',
              }}
              aria-label="Favoritos"
            >
              <Heart size={22} />
              {favCount > 0 && (
                <span style={{
                  position: 'absolute', top: 2, right: 2,
                  background: 'var(--danger)', color: 'var(--white)',
                  fontSize: 10, fontWeight: 700,
                  minWidth: 16, height: 16, borderRadius: 8,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0 4px',
                }}>
                  {favCount > 9 ? '9+' : favCount}
                </span>
              )}
            </button>
            <FavoritesDropdown
              isOpen={favOpen}
              onClose={() => setFavOpen(false)}
              anchorRef={favBtnRef}
            />
          </div>
          {/* Cart icon with badge + dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              ref={cartBtnRef}
              onClick={() => { setCartOpen(!cartOpen); setFavOpen(false); }}
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: 'none',
                color: 'var(--white)',
                cursor: 'pointer',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 44,
                height: 44,
                borderRadius: 'var(--radius-sm)',
                transition: 'var(--transition-fast)',
                position: 'relative',
              }}
              aria-label="Carrito"
            >
              <ShoppingCart size={22} />
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
              width: 44,
              height: 44,
              borderRadius: 'var(--radius-sm)',
              transition: 'var(--transition-fast)',
            }}
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
