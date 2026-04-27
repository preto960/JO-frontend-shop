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
  const [isDesktop, setIsDesktop] = useState(false);

  // Track viewport size for responsive behavior
  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

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
        <div style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  if (!user || (!isAdmin && !isEditor)) return null;

  const sidebarWidth = collapsed ? 76 : 280;

  // Get user initials for avatar
  const initials = (user?.name || 'A')
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
      {/* Mobile: AppHeader (already redesigned with orange gradient) */}
      {!isDesktop && <AppHeader />}

      {/* ═══════════════════════════════════════════
          Desktop Sidebar — dark charcoal, fixed left
         ═══════════════════════════════════════════ */}
      {isDesktop && (
        <aside
          style={{
            position: 'fixed',
            left: 0, top: 0, bottom: 0,
            width: sidebarWidth,
            background: 'var(--secondary)',
            color: 'var(--white)',
            transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            flexDirection: 'column',
            zIndex: 200,
            overflow: 'hidden',
            display: 'flex',
          }}
        >
          {/* ── Logo area ── */}
          <div style={{
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            minHeight: 70,
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%',
              background: 'var(--primary-gradient)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 18, color: 'var(--white)',
              flexShrink: 0,
              letterSpacing: '-0.5px',
            }}>
              JO
            </div>
            {!collapsed && (
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontWeight: 700, fontSize: 17, whiteSpace: 'nowrap', color: 'var(--white)' }}>
                  JO-Shop
                </div>
                <div style={{ fontSize: 13, whiteSpace: 'nowrap', opacity: 0.5, color: 'var(--white)' }}>
                  {user?.name || 'Admin'}
                </div>
              </div>
            )}
          </div>

          {/* ── Navigation items ── */}
          <nav style={{ flex: 1, padding: '8px', overflowY: 'auto' }}>
            {filteredNavItems.map((item) => {
              const isActive = pathname === item.path;
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => router.push(item.path)}
                  title={collapsed ? item.label : undefined}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 16px',
                    borderRadius: 10,
                    border: 'none',
                    borderLeft: isActive ? '3px solid var(--primary)' : '3px solid transparent',
                    background: isActive
                      ? 'rgba(255,107,53,0.12)'
                      : 'transparent',
                    color: isActive
                      ? 'var(--primary)'
                      : 'rgba(255,255,255,0.65)',
                    cursor: 'pointer',
                    marginBottom: 2,
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap',
                    fontSize: 14,
                    fontWeight: isActive ? 600 : 400,
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                      e.currentTarget.style.color = 'var(--white)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'rgba(255,255,255,0.65)';
                    }
                  }}
                >
                  <Icon
                    size={20}
                    style={{
                      flexShrink: 0,
                      color: isActive ? 'var(--primary)' : 'currentColor',
                    }}
                  />
                  {!collapsed && <span>{item.label}</span>}
                </button>
              );
            })}
          </nav>

          {/* ── Footer: logout + collapse toggle ── */}
          <div style={{
            padding: '8px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
          }}>
            <button
              onClick={logout}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 16px',
                borderRadius: 10,
                border: 'none',
                background: 'transparent',
                color: 'rgba(255,255,255,0.65)',
                cursor: 'pointer',
                marginBottom: 4,
                fontSize: 14,
                textAlign: 'left',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--danger)';
                e.currentTarget.style.background = 'rgba(255,107,107,0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'rgba(255,255,255,0.65)';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <LogOut size={20} style={{ flexShrink: 0 }} />
              {!collapsed && <span>Cerrar sesión</span>}
            </button>
            <button
              onClick={() => setCollapsed(!collapsed)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px',
                borderRadius: 10,
                border: 'none',
                background: 'rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.5)',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
                e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
              }}
            >
              {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
          </div>
        </aside>
      )}

      {/* ═══════════════════════════════════════════
          Desktop Header — clean, minimal
         ═══════════════════════════════════════════ */}
      {isDesktop && (
        <header
          style={{
            position: 'fixed',
            top: 0,
            left: sidebarWidth,
            right: 0,
            height: 64,
            background: 'var(--white)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            zIndex: 100,
            transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {/* Left: breadcrumb / page name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>JO-Shop</h1>
          </div>

          {/* Right: user info + avatar + logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              {user?.name || 'Admin'}
            </span>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'var(--primary-gradient)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--white)', fontSize: 13, fontWeight: 600,
              flexShrink: 0,
            }}>
              {initials}
            </div>
            <button
              onClick={logout}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-light)',
                cursor: 'pointer',
                padding: 6,
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--danger)';
                e.currentTarget.style.background = 'var(--danger-light)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-light)';
                e.currentTarget.style.background = 'none';
              }}
              aria-label="Cerrar sesión"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>
      )}

      {/* ═══════════════════════════════════════════
          Main content area
         ═══════════════════════════════════════════ */}
      <main style={{
        minHeight: '100vh',
        background: 'var(--background)',
        paddingTop: isDesktop ? 64 : 56,
        paddingLeft: isDesktop ? sidebarWidth : 0,
        transition: 'padding-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
        {children}
      </main>
    </>
  );
}
