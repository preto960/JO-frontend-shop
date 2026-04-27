'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useConfig } from '@/contexts/ConfigContext';
import {
  LayoutDashboard, Package, Tag, ClipboardList, Store,
  Shield, Users, ChevronLeft, ChevronRight, LogOut,
} from 'lucide-react';
import AppHeader from '@/components/AppHeader';

interface NavItem {
  path: string;
  label: string;
  icon: any;
  permissionKey?: string;
  adminOnly?: boolean;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAdmin, isEditor, logout, canViewModule } = useAuth();
  const { isMultiStore } = useConfig();
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!isLoading && (!user || (!isAdmin && !isEditor))) {
      router.replace('/login');
    }
  }, [user, isLoading, router]);

  const navItems: NavItem[] = [
    { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/products', label: 'Productos', icon: Package, permissionKey: 'products' },
    { path: '/admin/categories', label: 'Categorías', icon: Tag, permissionKey: 'categories' },
    { path: '/admin/orders', label: 'Pedidos', icon: ClipboardList, permissionKey: 'orders' },
    ...(isMultiStore ? [{ path: '/admin/stores', label: 'Tiendas', icon: Store, permissionKey: 'stores' }] : []),
    { path: '/admin/roles', label: 'Roles', icon: Shield, permissionKey: 'roles' },
    { path: '/admin/users', label: 'Usuarios', icon: Users, adminOnly: true },
  ];

  const filteredNavItems = navItems.filter(item => {
    if (item.adminOnly && !isAdmin) return false;
    if (item.permissionKey && !canViewModule(item.permissionKey) && !isAdmin) return false;
    return true;
  });

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--background)' }}>
        <div style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  if (!user || (!isAdmin && !isEditor)) return null;

  return (
    <>
      {/* Mobile: AppHeader with hamburger menu */}
      <div className="lg:hidden">
        <AppHeader />
      </div>

      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex"
        style={{
          position: 'fixed', left: 0, top: 0, bottom: 0,
          width: collapsed ? 72 : 260,
          background: 'var(--primary)', color: 'var(--white)',
          transition: 'width 0.3s', flexDirection: 'column',
          zIndex: 200, overflow: 'hidden',
        }}
      >
        {/* Logo */}
        <div style={{ padding: '20px 16px 16px', display: 'flex', alignItems: 'center', gap: 12, minHeight: 56 }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%', background: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 16, flexShrink: 0,
          }}>
            JO
          </div>
          {!collapsed && (
            <div>
              <span style={{ fontWeight: 700, fontSize: 16, whiteSpace: 'nowrap' }}>JO-Shop</span>
              <p style={{ fontSize: 11, opacity: 0.7 }}>Admin Panel</p>
            </div>
          )}
        </div>

        {/* Nav items */}
        <div style={{ flex: 1, padding: '8px', overflowY: 'auto' }}>
          {filteredNavItems.map((item) => {
            const isActive = pathname === item.path;
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px', borderRadius: 10, border: 'none',
                  background: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
                  color: 'var(--white)', cursor: 'pointer', marginBottom: 4,
                  transition: 'background 0.2s', whiteSpace: 'nowrap',
                  fontSize: 14, fontWeight: isActive ? 600 : 400,
                }}
                onMouseEnter={(e) => { if (!isActive) (e.currentTarget.style.background = 'rgba(255,255,255,0.08)'); }}
                onMouseLeave={(e) => { if (!isActive) (e.currentTarget.style.background = 'transparent'); }}
                title={collapsed ? item.label : undefined}
              >
                <Icon size={20} style={{ flexShrink: 0 }} />
                {!collapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </div>

        {/* Footer: logout + collapse */}
        <div style={{ padding: '8px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <button
            onClick={logout}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px',
              borderRadius: 8, border: 'none', background: 'transparent',
              color: 'var(--white)', cursor: 'pointer', marginBottom: 4, fontSize: 14,
            }}
          >
            <LogOut size={20} />
            {!collapsed && <span>Cerrar sesión</span>}
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '8px', borderRadius: 8, border: 'none',
              background: 'rgba(255,255,255,0.08)', color: 'var(--white)', cursor: 'pointer',
            }}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
      </aside>

      {/* Desktop: header bar at top */}
      <header
        className="hidden lg:flex"
        style={{
          position: 'fixed', top: 0,
          left: collapsed ? 72 : 260, right: 0,
          height: '56px', background: 'var(--white)',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 24px', zIndex: 100,
          boxShadow: 'var(--shadow)',
          transition: 'left 0.3s',
        }}
      >
        <h1 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)' }}>JO-Shop Admin</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{user?.name || 'Admin'}</span>
          <button
            onClick={logout}
            style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', padding: 4 }}
            aria-label="Cerrar sesión"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Main content */}
      <main style={{
        minHeight: '100vh',
        background: 'var(--background)',
        paddingTop: '56px',
      }} className="lg:pt-[56px] lg:pl-[260px]" >
        <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
          {children}
        </div>
      </main>
    </>
  );
}
