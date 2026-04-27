'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Home,
  ShoppingCart,
  ClipboardList,
  User,
  X,
  LogOut,
  Package,
  Tag,
  Store,
  Shield,
  Users,
  LayoutDashboard,
  Truck,
  Settings,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useConfig } from '@/contexts/ConfigContext';

interface SidebarMenuProps {
  open: boolean;
  onClose: () => void;
}

export default function SidebarMenu({ open, onClose }: SidebarMenuProps) {
  const { user, logout } = useAuth();
  const { isMultiStore } = useConfig();
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

  // Prevent body scroll when sidebar is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Close on escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [open, onClose]);

  const navigate = (path: string) => {
    router.push(path);
    onClose();
  };

  const handleLogout = () => {
    onClose();
    logout();
  };

  const getNavItems = () => {
    const role = user?.role;

    if (role === 'admin' || role === 'editor') {
      const items: any[] = [
        { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/admin/products', label: 'Productos', icon: Package },
        { path: '/admin/categories', label: 'Categorías', icon: Tag },
        { path: '/admin/orders', label: 'Pedidos', icon: ClipboardList },
        ...(isMultiStore ? [{ path: '/admin/stores', label: 'Tiendas', icon: Store }] : []),
        { path: '/admin/roles', label: 'Roles', icon: Shield },
      ];
      if (role === 'admin') {
        items.push({ path: '/admin/users', label: 'Usuarios', icon: Users });
      }
      return items;
    }

    if (role === 'delivery') {
      return [
        { path: '/delivery', label: 'Entregas', icon: Truck },
        { path: '/profile', label: 'Mi Perfil', icon: User },
      ];
    }

    // Customer
    return [
      { path: '/home', label: 'Inicio', icon: Home },
      { path: '/cart', label: 'Carrito', icon: ShoppingCart, badge: cartCount },
      { path: '/orders', label: 'Pedidos', icon: ClipboardList },
      { path: '/profile', label: 'Perfil', icon: User },
    ];
  };

  const navItems = getNavItems();

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.4)',
          zIndex: 300,
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 0.3s ease',
        }}
      />

      {/* Sidebar panel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: 280,
          background: 'var(--white)',
          zIndex: 400,
          transform: open ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s ease',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '4px 0 24px rgba(0,0,0,0.15)',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 16px 16px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--primary)',
          color: 'var(--white)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: 16,
              color: 'white',
            }}>
              JO
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: 16 }}>JO-Shop</p>
              <p style={{ fontSize: 12, opacity: 0.8 }}>
                {user?.name || 'Usuario'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              width: 36,
              height: 36,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Cerrar menú"
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav items */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px 8px',
        }}>
          {navItems.map((item: any) => {
            const isActive = pathname === item.path;
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '14px 16px',
                  borderRadius: 10,
                  border: 'none',
                  background: isActive ? 'var(--primary)' : 'transparent',
                  color: isActive ? 'var(--white)' : 'var(--text)',
                  cursor: 'pointer',
                  marginBottom: 2,
                  transition: 'all 0.2s',
                  fontSize: 15,
                  fontWeight: isActive ? 600 : 400,
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'var(--input-bg)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <Icon size={20} style={{ flexShrink: 0 }} />
                <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>
                {item.badge > 0 && (
                  <span style={{
                    background: 'var(--accent)',
                    color: 'white',
                    fontSize: 11,
                    fontWeight: 700,
                    minWidth: 20,
                    height: 20,
                    borderRadius: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 6px',
                  }}>
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer - Logout */}
        <div style={{
          padding: '12px 8px',
          borderTop: '1px solid var(--border)',
        }}>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '14px 16px',
              borderRadius: 10,
              border: 'none',
              background: 'transparent',
              color: 'var(--accent)',
              cursor: 'pointer',
              fontSize: 15,
              fontWeight: 500,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(233,69,96,0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <LogOut size={20} />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </div>
    </>
  );
}
