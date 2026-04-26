'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Tag,
  ClipboardList,
  Store,
  Shield,
  Users,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useConfig } from '@/contexts/ConfigContext';

interface NavItem {
  path: string;
  label: string;
  icon: any;
  permissionKey?: string;
  adminOnly?: boolean;
}

export default function AdminSidebar() {
  const { user, logout } = useAuth();
  const { isMultiStore } = useConfig();
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = React.useState(false);

  const hasPermission = (key: string): boolean => {
    if (user?.role === 'admin') return true;
    const perms = user?.permissions;
    if (!perms) return false;
    if (typeof perms === 'object') {
      return perms[key]?.canView || false;
    }
    return false;
  };

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
    if (item.adminOnly && user?.role !== 'admin') return false;
    if (item.permissionKey && !hasPermission(item.permissionKey)) return false;
    return true;
  });

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          width: collapsed ? 72 : 240,
          background: 'var(--primary)',
          color: 'var(--white)',
          transition: 'width 0.3s',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 200,
          overflow: 'hidden',
        }}
        className="hidden lg:flex"
      >
        {/* Header */}
        <div style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: 12, minHeight: 56 }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%', background: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16, flexShrink: 0,
          }}>
            JO
          </div>
          {!collapsed && <span style={{ fontWeight: 700, fontSize: 16, whiteSpace: 'nowrap' }}>JO-Shop</span>}
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
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px',
                  borderRadius: 8,
                  border: 'none',
                  background: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
                  color: 'var(--white)',
                  cursor: 'pointer',
                  marginBottom: 4,
                  transition: 'background 0.2s',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => { if (!isActive) (e.currentTarget.style.background = 'rgba(255,255,255,0.08)'); }}
                onMouseLeave={(e) => { if (!isActive) (e.currentTarget.style.background = 'transparent'); }}
                title={collapsed ? item.label : undefined}
              >
                <Icon size={20} style={{ flexShrink: 0 }} />
                {!collapsed && <span style={{ fontSize: 14, fontWeight: isActive ? 600 : 400 }}>{item.label}</span>}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 8px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          {!collapsed && user?.role === 'admin' && (
            <button
              onClick={() => router.push('/admin/users')}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px',
                borderRadius: 8, border: 'none', background: 'transparent', color: 'var(--white)',
                cursor: 'pointer', marginBottom: 4,
              }}
            >
              <Settings size={20} />
              <span style={{ fontSize: 14 }}>Configuración</span>
            </button>
          )}
          <button
            onClick={logout}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px',
              borderRadius: 8, border: 'none', background: 'transparent', color: 'var(--white)',
              cursor: 'pointer',
            }}
          >
            <LogOut size={20} />
            {!collapsed && <span style={{ fontSize: 14 }}>Cerrar sesión</span>}
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '8px', marginTop: 8, borderRadius: 8, border: 'none',
              background: 'rgba(255,255,255,0.08)', color: 'var(--white)', cursor: 'pointer',
            }}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav
        className="lg:hidden"
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
          height: 64,
          zIndex: 100,
          boxShadow: '0 -2px 8px rgba(0,0,0,0.05)',
        }}
      >
        {filteredNavItems.slice(0, 5).map((item) => {
          const isActive = pathname === item.path;
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              style={{
                background: 'none', border: 'none', display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 2, cursor: 'pointer',
                color: isActive ? 'var(--accent)' : 'var(--text-secondary)', padding: '8px 12px', flex: 1,
              }}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
              <span style={{ fontSize: 10, fontWeight: isActive ? 600 : 400 }}>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
