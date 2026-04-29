'use client';

import React, { useState, useEffect } from 'react';
import api, { extractData } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { formatPrice, formatDate } from '@/lib/utils';
import { ShoppingBag, DollarSign, TrendingUp, Users, Package } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════
   Stat Card — 4px colored top border, 48px circle icon,
   12px uppercase label with letter-spacing, 24px bold value
   ═══════════════════════════════════════════════════════════════ */

interface StatCardProps {
  title: string;
  value: string;
  icon: any;
  color: string;
  bgColor: string;
}

function StatCard({ title, value, icon: Icon, color, bgColor }: StatCardProps) {
  return (
    <div
      style={{
        background: 'var(--white)',
        borderRadius: 16,
        padding: 20,
        boxShadow: 'var(--shadow)',
        borderLeft: `4px solid ${color}`,
        borderTop: `4px solid ${color}`,
        borderRight: 'none',
        borderBottom: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'default',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'var(--shadow)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Icon circle */}
      <div style={{
        width: 48, height: 48, borderRadius: '50%',
        background: bgColor,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon size={24} color={color} />
      </div>

      {/* Text content */}
      <div>
        <p style={{
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--text-light)',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          marginBottom: 4,
        }}>
          {title}
        </p>
        <p style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)' }}>
          {value}
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Dashboard Page
   ═══════════════════════════════════════════════════════════════ */

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Try backend dashboard endpoint first
        try {
          const dashRes = await api.get('/orders/stats/dashboard');
          if (dashRes) {
            setStats({
              totalOrders: dashRes.totalOrders || dashRes.total_orders || 0,
              revenue: dashRes.totalRevenue || dashRes.total_revenue || 0,
              todayOrders: dashRes.todayOrders || dashRes.today_orders || 0,
              totalUsers: dashRes.totalUsers || dashRes.total_users || 0,
              totalProducts: dashRes.totalProducts || dashRes.total_products || 0,
            });
          }
        } catch {
          // Fallback: calculate from orders
          try {
            const ordersRes = await api.get('/orders');
            const orders = extractData(ordersRes);
            const today = new Date().toDateString();
            const todayOrders = orders.filter((o: any) => {
              const d = new Date(o.createdAt || o.created_at);
              return d.toDateString() === today;
            });
            const totalRevenue = orders
              .filter((o: any) => o.status !== 'cancelled')
              .reduce((sum: number, o: any) => sum + (o.total || o.totalAmount || 0), 0);
            setStats({
              totalOrders: orders.length,
              revenue: totalRevenue,
              todayOrders: todayOrders.length,
            });
          } catch { /* ignore */ }
        }

        // Fetch recent orders
        try {
          const ordersRes = await api.get('/orders');
          const orders = extractData(ordersRes);
          const sorted = [...orders].sort((a: any, b: any) => {
            return new Date(b.createdAt || b.created_at).getTime() - new Date(a.createdAt || a.created_at).getTime();
          });
          setRecentOrders(sorted.slice(0, 10));
        } catch { /* ignore */ }

        // Fetch user and product counts if not from dashboard
        try {
          const usersRes = await api.get('/auth/users');
          const productsRes = await api.get('/products');
          setStats((prev: any) => ({
            ...prev,
            totalUsers: prev.totalUsers || extractData(usersRes).length,
            totalProducts: prev.totalProducts || extractData(productsRes).length,
          }));
        } catch { /* ignore */ }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getStatusColor = (status: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      pending:    { bg: 'var(--warning-light)',  text: '#856404' },
      confirmed:  { bg: 'var(--info-light)',     text: '#0C5460' },
      preparing:  { bg: '#E8DAEF',              text: '#6C3483' },
      shipped:    { bg: 'var(--success-light)',  text: '#155724' },
      delivered:  { bg: 'var(--success-light)',  text: '#1B7A42' },
      cancelled:  { bg: 'var(--danger-light)',   text: '#CC3333' },
    };
    return colors[status] || { bg: 'var(--input-bg)', text: 'var(--text-secondary)' };
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Pendiente', confirmed: 'Confirmado', preparing: 'En preparación',
      shipped: 'Enviado', delivered: 'Entregado', cancelled: 'Cancelado',
    };
    return labels[status] || status;
  };

  return (
    <div style={{ padding: '24px' }}>
      {/* ── Welcome Section ── */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
          Dashboard
        </h1>
        <p style={{ fontSize: 15, color: 'var(--text-secondary)' }}>
          Bienvenido, {user?.name || 'Admin'}
        </p>
        <div style={{
          height: 1,
          background: 'var(--border)',
          marginTop: 16,
          borderRadius: 1,
        }} />
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 80 }}>
          <div style={{
            width: 36, height: 36,
            border: '3px solid var(--border)',
            borderTopColor: 'var(--primary)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
        </div>
      ) : (
        <>
          {/* ── Stats Grid: 2 cols mobile, 3 tablet, 5 desktop ── */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 16,
            marginBottom: 28,
          }}
            className="admin-stats-grid"
          >
            <StatCard
              title="Total pedidos"
              value={stats?.totalOrders ?? '0'}
              icon={ShoppingBag}
              color="var(--primary)"
              bgColor="var(--primary-light)"
            />
            <StatCard
              title="Ingresos"
              value={formatPrice(stats?.revenue ?? 0)}
              icon={DollarSign}
              color="#00B894"
              bgColor="#E8FBF5"
            />
            <StatCard
              title="Pedidos hoy"
              value={stats?.todayOrders ?? '0'}
              icon={TrendingUp}
              color="#54A0FF"
              bgColor="#E8F1FF"
            />
            <StatCard
              title="Clientes"
              value={stats?.totalUsers ?? '0'}
              icon={Users}
              color="#FDCB6E"
              bgColor="#FFF9E6"
            />
            <StatCard
              title="Productos"
              value={stats?.totalProducts ?? '0'}
              icon={Package}
              color="#A29BFE"
              bgColor="#F0EDFF"
            />
          </div>

          {/* ── Recent Orders Table ── */}
          <div style={{
            background: 'var(--white)',
            borderRadius: 16,
            padding: 20,
            boxShadow: 'var(--shadow)',
          }}>
            <h2 style={{
              fontSize: 18,
              fontWeight: 700,
              color: 'var(--text)',
              marginBottom: 16,
            }}>
              Pedidos recientes
            </h2>

            {recentOrders.length === 0 ? (
              <p style={{
                textAlign: 'center',
                color: 'var(--text-secondary)',
                padding: '32px 20px',
                fontSize: 14,
              }}>
                No hay pedidos aún
              </p>
            ) : (
              <div className="table-responsive">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['Pedido', 'Fecha', 'Cliente', 'Total', 'Estado'].map((h) => (
                        <th
                          key={h}
                          style={{
                            textAlign: 'left',
                            padding: '10px 12px',
                            fontSize: 12,
                            fontWeight: 700,
                            color: 'var(--text-light)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            background: 'var(--input-bg)',
                            borderRadius: 0,
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order: any) => {
                      const status = order.status || order.estado || 'pending';
                      const sc = getStatusColor(status);
                      return (
                        <tr
                          key={order.id}
                          style={{
                            borderBottom: '1px solid var(--border)',
                            transition: 'background 0.15s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--input-bg)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                          }}
                        >
                          <td style={{ padding: '12px', fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                            #{String(order.id).slice(-8).toUpperCase()}
                          </td>
                          <td style={{ padding: '12px', fontSize: 13, color: 'var(--text-secondary)' }}>
                            {formatDate(order.createdAt || order.created_at)}
                          </td>
                          <td style={{ padding: '12px', fontSize: 13, color: 'var(--text)' }}>
                            {order.user?.name || order.userName || order.customerName || 'N/A'}
                          </td>
                          <td style={{ padding: '12px', fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                            {formatPrice(order.total || order.totalAmount || 0)}
                          </td>
                          <td style={{ padding: '12px' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '4px 12px',
                              borderRadius: 'var(--radius-full)',
                              fontSize: 12,
                              fontWeight: 600,
                              background: sc.bg,
                              color: sc.text,
                            }}>
                              {getStatusLabel(status)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Responsive stats grid media queries ── */}
      <style>{`
        @media (min-width: 768px) {
          .admin-stats-grid {
            grid-template-columns: repeat(3, 1fr) !important;
          }
          /* On tablet, last 2 items span centering */
        }
        @media (min-width: 1024px) {
          .admin-stats-grid {
            grid-template-columns: repeat(5, 1fr) !important;
          }
        }
      `}</style>
    </div>
  );
}
