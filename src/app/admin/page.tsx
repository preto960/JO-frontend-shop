'use client';

import React, { useState, useEffect } from 'react';
import api, { extractData } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { formatPrice, formatDate } from '@/lib/utils';
import { ShoppingBag, DollarSign, TrendingUp, Users, Package } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  icon: any;
  color: string;
}

function StatCard({ title, value, icon: Icon, color }: StatCardProps) {
  return (
    <div style={{
      background: 'var(--white)', borderRadius: 12, padding: 20,
      boxShadow: 'var(--shadow)', display: 'flex', alignItems: 'center', gap: 16,
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: 12, background: color + '15',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={24} color={color} />
      </div>
      <div>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 2 }}>{title}</p>
        <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>{value}</p>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch orders for stats
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

        // Recent orders (last 10)
        const sorted = [...orders].sort((a: any, b: any) => {
          return new Date(b.createdAt || b.created_at).getTime() - new Date(a.createdAt || a.created_at).getTime();
        });
        setRecentOrders(sorted.slice(0, 10));

        // Try to fetch users and products counts
        try {
          const usersRes = await api.get('/users');
          const productsRes = await api.get('/products');
          setStats((prev: any) => ({
            ...prev,
            totalUsers: extractData(usersRes).length,
            totalProducts: extractData(productsRes).length,
          }));
        } catch { /* ignore if endpoints not available */ }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: '#F39C12', confirmed: '#3498DB', preparing: '#9B59B6',
      shipped: '#2ECC71', delivered: '#27AE60', cancelled: '#E94560',
    };
    return colors[status] || '#7F8C8D';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Pendiente', confirmed: 'Confirmado', preparing: 'En preparación',
      shipped: 'Enviado', delivered: 'Entregado', cancelled: 'Cancelado',
    };
    return labels[status] || status;
  };

  return (
    <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
          Dashboard
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
          Bienvenido, {user?.name || 'Admin'}
        </p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        </div>
      ) : (
        <>
          {/* Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 16,
            marginBottom: 24,
          }}>
            <StatCard title="Total pedidos" value={stats?.totalOrders ?? '0'} icon={ShoppingBag} color="#E94560" />
            <StatCard title="Ingresos" value={formatPrice(stats?.revenue ?? 0)} icon={DollarSign} color="#2ECC71" />
            <StatCard title="Pedidos hoy" value={stats?.todayOrders ?? '0'} icon={TrendingUp} color="#F39C12" />
            <StatCard title="Clientes" value={stats?.totalUsers ?? '0'} icon={Users} color="#3498DB" />
            <StatCard title="Productos" value={stats?.totalProducts ?? '0'} icon={Package} color="#9B59B6" />
          </div>

          {/* Recent Orders */}
          <div style={{
            background: 'var(--white)', borderRadius: 12, padding: 20,
            boxShadow: 'var(--shadow)',
          }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)', marginBottom: 16 }}>
              Pedidos recientes
            </h2>
            {recentOrders.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 20 }}>
                No hay pedidos aún
              </p>
            ) : (
              <div className="table-responsive">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border)' }}>
                      <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Pedido</th>
                      <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Fecha</th>
                      <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Cliente</th>
                      <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Total</th>
                      <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order: any) => (
                      <tr key={order.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 500 }}>
                          #{String(order.id).slice(-8).toUpperCase()}
                        </td>
                        <td style={{ padding: '10px 12px', fontSize: 13, color: 'var(--text-secondary)' }}>
                          {formatDate(order.createdAt || order.created_at)}
                        </td>
                        <td style={{ padding: '10px 12px', fontSize: 13 }}>
                          {order.user?.name || order.userName || order.customerName || 'N/A'}
                        </td>
                        <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 600 }}>
                          {formatPrice(order.total || order.totalAmount || 0)}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{
                            padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600,
                            background: getStatusColor(order.status || order.estado || 'pending') + '20',
                            color: getStatusColor(order.status || order.estado || 'pending'),
                          }}>
                            {getStatusLabel(order.status || order.estado || 'pending')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
