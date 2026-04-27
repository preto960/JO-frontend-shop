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
  Menu,
  X,
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
  const { user, logout, isAdmin, canViewModule } = useAuth();
  const { isMultiStore } = useConfig();
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

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

  const navigate = (path: string) => {
    router.push(path);
    setMobileOpen(false);
  };

  const handleLogout = () => {
    setMobileOpen(false);
    logout();
  };

  // Prevent body scroll when mobile menu is open
  React.useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const renderNavContent = () => (
    <>
      {/* Header */}
      <div style={{ padding: '20px 16px 16px', display: 'flex', alignItems: 'center', gap: 12, minHeight: 56 }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%', background: 'var(--accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16, flexShrink: 0,
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
              onClick={() => navigate(item.path)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px',
                borderRadius: 10,
                border: 'none',
                background: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
                color: 'var(--white)',
                cursor: 'pointer',
                marginBottom: 4,
                transition: 'background 0.2s',
                whiteSpace: 'nowrap',
                fontSize: 14,
                fontWeight: isActive ? 600 : 400,
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

      {/* Footer */}
      <div style={{ padding: '12px 8px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        {!collapsed && user?.role === 'admin' && (
          <button
            onClick={() => navigate('/admin/users')}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px',
              borderRadius: 8, border: 'none', background: 'transparent', color: 'var(--white)',
              cursor: 'pointer', marginBottom: 4, fontSize: 14,
            }}
          >
            <Settings size={20} />
            <span>Configuración</span>
          </button>
        )}
        <button
          onClick={handleLogout}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px',
            borderRadius: 8, border: 'none', background: 'transparent', color: 'var(--white)',
            cursor: 'pointer', fontSize: 14,
          }}
        >
          <LogOut size={20} />
          {!collapsed && <span>Cerrar sesión</span>}
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
    </>
  );

  return (
    <>
      {/* Mobile hamburger button - fixed top left */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden"
        style={{
          position: 'fixed',
          top: 12,
          left: 16,
          zIndex: 150,
          background: 'var(--white)',
          border: 'none',
          borderRadius: 8,
          width: 40,
          height: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: 'var(--shadow-md)',
          color: 'var(--text)',
        }}
        aria-label="Abrir menú"
      >
        <Menu size={22} />
      </button>

      {/* Desktop sidebar */}
      <aside
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          width: collapsed ? 72 : 260,
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
        {renderNavContent()}
      </aside>

      {/* Mobile overlay */}
      <div
        onClick={() => setMobileOpen(false)}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.4)',
          zIndex: 300,
          opacity: mobileOpen ? 1 : 0,
          pointerEvents: mobileOpen ? 'auto' : 'none',
          transition: 'opacity 0.3s ease',
        }}
        className="lg:hidden"
      />

      {/* Mobile sidebar */}
      <aside
        className="lg:hidden"
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          width: 280,
          background: 'var(--primary)',
          color: 'var(--white)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 400,
          transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s ease',
          boxShadow: '4px 0 24px rgba(0,0,0,0.15)',
        }}
      >
        {/* Close button */}
        <button
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'absolute',
            top: 20,
            right: 12,
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
        {renderNavContent()}
      </aside>
    </>
  );
}
