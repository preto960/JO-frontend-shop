'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Home,
  ShoppingCart,
  ClipboardList,
  User,
  X,
  Package,
  LayoutDashboard,
  Layers,
  Truck,
  Settings,
  Heart,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useConfig } from '@/contexts/ConfigContext';

interface SidebarMenuProps {
  open: boolean;
  onClose: () => void;
}

export default function SidebarMenu({ open, onClose }: SidebarMenuProps) {
  const { user, logout, isAdmin, isEditor, isDelivery, canViewModule, hasPermission } = useAuth();
  const { config, isMultiStore } = useConfig();
  const shopName = config.shop_name || 'JO-Shop';
  const shopLogoUrl = config.shop_logo_url || '';
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

  const getNavItems = () => {
    // Admin or Editor
    if (isAdmin || isEditor) {
      const items: any[] = [
        { path: '/', label: 'Inicio', icon: Home },
        { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      ];
      if (canViewModule('products') || isAdmin) {
        items.push({ path: '/manage-products', label: 'Gestionar Productos', icon: Package });
      }
      if (canViewModule('batches') || isAdmin) {
        items.push({ path: '/product-batches', label: 'Lotes', icon: Layers });
      }
      if (canViewModule('orders') || isAdmin) {
        items.push({ path: '/manage-orders', label: 'Pedidos', icon: ClipboardList });
      }
      if (isAdmin) {
        items.push({ path: '/settings', label: 'Configuracion', icon: Settings });
      }
      return items;
    }

    // Delivery — no landing page access, only their deliveries and profile
    if (isDelivery) {
      return [
        { path: '/deliveries', label: 'Entregas', icon: Truck },
        { path: '/profile', label: 'Mi Perfil', icon: User },
      ];
    }

    // Customer
    return [
      { path: '/', label: 'Inicio', icon: Home },
      { path: '/favorites', label: 'Favoritos', icon: Heart },
      { path: '/cart', label: 'Carrito', icon: ShoppingCart, badge: cartCount },
      { path: '/my-orders', label: 'Mis Pedidos', icon: ClipboardList },
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
          background: 'rgba(26,29,41,0.5)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
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
          width: 300,
          background: 'var(--white)',
          zIndex: 400,
          transform: open ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '8px 0 30px rgba(0,0,0,0.12)',
          borderRadius: '0 20px 20px 0',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '24px 20px 20px',
          background: 'var(--primary-gradient)',
          color: 'var(--white)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {shopLogoUrl ? (
              <img src={shopLogoUrl} alt={shopName} style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <div style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: 24,
                color: 'var(--white)',
                boxShadow: 'var(--shadow-accent)',
                letterSpacing: '0.5px',
              }}>
                {shopName.substring(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <p style={{ fontWeight: 700, fontSize: 18, letterSpacing: '-0.3px' }}>{shopName}</p>
              <p style={{ fontSize: 12, opacity: 0.7, marginTop: 1 }}>
                {user?.name || 'Usuario'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.12)',
              border: 'none',
              color: 'var(--white)',
              cursor: 'pointer',
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'var(--transition-fast)',
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
          padding: '8px 0',
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
                  padding: '13px 20px',
                  border: 'none',
                  background: isActive ? 'var(--primary-light)' : 'transparent',
                  color: isActive ? 'var(--primary)' : 'var(--text)',
                  cursor: 'pointer',
                  marginBottom: 2,
                  transition: 'var(--transition)',
                  fontSize: 14,
                  fontWeight: isActive ? 600 : 400,
                  borderLeft: isActive ? '3px solid var(--primary)' : '3px solid transparent',
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
                <Icon
                  size={20}
                  style={{
                    flexShrink: 0,
                    color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                    transition: 'color 0.2s',
                  }}
                />
                <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>
                {item.badge > 0 && (
                  <span style={{
                    background: 'var(--primary)',
                    color: 'var(--white)',
                    fontSize: 11,
                    fontWeight: 700,
                    minWidth: 20,
                    height: 20,
                    borderRadius: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 6px',
                    boxShadow: 'var(--shadow-accent)',
                  }}>
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom version */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid var(--border)',
        }}>
          <span style={{ fontSize: 11, color: 'var(--text-light)', letterSpacing: '0.3px' }}>
            v1.0
          </span>
        </div>
      </div>
    </>
  );
}
