'use client';

import React, { useEffect, useState } from 'react';
import { Home, ShoppingCart, ClipboardList, User } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';

const tabs = [
  { path: '/', label: 'Inicio', icon: Home },
  { path: '/cart', label: 'Carrito', icon: ShoppingCart },
  { path: '/my-orders', label: 'Pedidos', icon: ClipboardList },
  { path: '/profile', label: 'Perfil', icon: User },
];

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [cartCount, setCartCount] = useState(0);

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
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'var(--white)',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        height: '64px',
        zIndex: 100,
        boxShadow: '0 -2px 8px rgba(0,0,0,0.05)',
      }}
    >
      {tabs.map((tab) => {
        const isActive = pathname === tab.path || (tab.path === '/' && pathname === '/');
        const Icon = tab.icon;
        return (
          <button
            key={tab.path}
            onClick={() => router.push(tab.path)}
            style={{
              background: 'none',
              border: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              cursor: 'pointer',
              color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
              padding: '8px 16px',
              position: 'relative',
              flex: 1,
            }}
          >
            <div style={{ position: 'relative' }}>
              <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
              {tab.path === '/cart' && cartCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: -8,
                    right: -10,
                    background: 'var(--accent)',
                    color: 'white',
                    fontSize: 10,
                    fontWeight: 700,
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </div>
            <span style={{ fontSize: 11, fontWeight: isActive ? 600 : 400 }}>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
