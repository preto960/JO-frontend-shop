'use client';

import React, { useState, useEffect, useCallback } from 'react';
import api, { extractData } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { formatPrice, formatDate } from '@/lib/utils';
import { ShoppingBag, DollarSign, TrendingUp, Users, Package, Calendar, BarChart3, ShoppingBasket, PieChart } from 'lucide-react';

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
   Chart Card — Reusable wrapper for chart sections
   ═══════════════════════════════════════════════════════════════ */

interface ChartCardProps {
  title: string;
  icon: any;
  children: React.ReactNode;
}

function ChartCard({ title, icon: Icon, children }: ChartCardProps) {
  return (
    <div style={{
      background: 'var(--white)',
      borderRadius: 16,
      padding: 24,
      boxShadow: 'var(--shadow)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'var(--primary-light)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={18} color="var(--primary)" />
        </div>
        <h3 style={{
          fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: 0,
        }}>
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Status config for charts
   ═══════════════════════════════════════════════════════════════ */

const STATUS_COLORS: Record<string, { bg: string; text: string; bar: string }> = {
  pending:    { bg: '#FFF3CD', text: '#856404', bar: '#F0C929' },
  confirmed:  { bg: '#D1ECF1', text: '#0C5460', bar: '#17A2B8' },
  preparing:  { bg: '#E8DAEF', text: '#6C3483', bar: '#8E44AD' },
  shipped:    { bg: '#FFE0B2', text: '#E65100', bar: '#FF9800' },
  delivered:  { bg: '#D4EDDA', text: '#1B7A42', bar: '#28A745' },
  cancelled:  { bg: '#F8D7DA', text: '#CC3333', bar: '#DC3545' },
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente', confirmed: 'Confirmado', preparing: 'En preparación',
  shipped: 'Enviado', delivered: 'Entregado', cancelled: 'Cancelado',
};

/* ═══════════════════════════════════════════════════════════════
   Dashboard Page
   ═══════════════════════════════════════════════════════════════ */

const PERIOD_BUTTONS = [
  { key: 'today',  label: 'Hoy' },
  { key: 'week',   label: 'Semana' },
  { key: 'month',  label: 'Mes' },
  { key: 'year',   label: 'Año' },
  { key: 'custom', label: 'Personalizado' },
];

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [chartData, setChartData] = useState<any>({
    ordersByDay: [],
    topProducts: [],
    revenueByStatus: [],
  });

  /* ── Fetch dashboard data with period support ── */
  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      let url = '/orders/stats/dashboard?';
      if (period === 'custom' && customFrom && customTo) {
        url += `from=${customFrom}&to=${customTo}`;
      } else {
        url += `period=${period}`;
      }

      const dashRes = await api.get(url);
      if (dashRes) {
        // Backend returns { summary: {...}, charts: {...}, recentOrders: [...] }
        const s = dashRes.summary || dashRes;
        const c = dashRes.charts || dashRes;
        setStats({
          totalOrders: s.totalOrders || 0,
          revenue: s.totalRevenue || 0,
          todayOrders: s.todayOrders || s.pendingOrders || 0,
          totalUsers: s.totalCustomers || s.totalUsers || 0,
          totalProducts: s.totalProducts || 0,
        });

        // Chart data from backend
        setChartData({
          ordersByDay: c.ordersByDay || [],
          topProducts: c.topProducts || [],
          revenueByStatus: c.revenueByStatus || [],
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

    // Fetch recent orders (always independent of period)
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
    } finally {
      setLoading(false);
    }
  }, [period, customFrom, customTo]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

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
    return STATUS_LABELS[status] || status;
  };

  /* ── Chart computed values ── */
  const ordersByDay = chartData.ordersByDay || [];
  const maxOrderCount = Math.max(...ordersByDay.map((d: any) => d.count || 0), 1);

  const topProducts = chartData.topProducts || [];
  const maxProductQty = Math.max(...topProducts.map((p: any) => p.quantity || 0), 1);

  const revenueByStatus = chartData.revenueByStatus || [];

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

      {/* ── Date Filter Bar ── */}
      <div style={{
        background: 'var(--white)',
        borderRadius: 16,
        padding: '16px 20px',
        boxShadow: 'var(--shadow)',
        marginBottom: 24,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 12,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          marginRight: 8,
          color: 'var(--text-secondary)', fontSize: 14, fontWeight: 600,
        }}>
          <Calendar size={16} />
          <span>Filtrar:</span>
        </div>

        {/* Period buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {PERIOD_BUTTONS.map((btn) => (
            <button
              key={btn.key}
              onClick={() => setPeriod(btn.key)}
              style={{
                padding: '8px 16px',
                borderRadius: 10,
                border: period === btn.key ? '2px solid var(--primary)' : '2px solid var(--border)',
                background: period === btn.key ? 'var(--primary-light)' : 'var(--white)',
                color: period === btn.key ? 'var(--primary)' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontFamily: 'inherit',
              }}
              onMouseEnter={(e) => {
                if (period !== btn.key) {
                  e.currentTarget.style.borderColor = 'var(--primary)';
                  e.currentTarget.style.color = 'var(--primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (period !== btn.key) {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* Custom date range inputs */}
        {period === 'custom' && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            marginLeft: 'auto',
            animation: 'fadeSlideIn 0.3s ease',
          }}>
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: 10,
                border: '2px solid var(--border)',
                fontSize: 13,
                color: 'var(--text)',
                background: 'var(--white)',
                fontFamily: 'inherit',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
            />
            <span style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500 }}>a</span>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: 10,
                border: '2px solid var(--border)',
                fontSize: 13,
                color: 'var(--text)',
                background: 'var(--white)',
                fontFamily: 'inherit',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
            />
            {(customFrom && customTo) && (
              <button
                onClick={fetchDashboard}
                style={{
                  padding: '8px 20px',
                  borderRadius: 10,
                  border: 'none',
                  background: 'var(--primary)',
                  color: 'var(--white)',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                  transition: 'opacity 0.2s',
                  fontFamily: 'inherit',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85'; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
              >
                Aplicar
              </button>
            )}
          </div>
        )}
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

          {/* ── Charts Grid ── */}
          <div className="admin-charts-grid" style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: 24,
            marginBottom: 28,
          }}>
            {/* Chart 1: Pedidos por día */}
            <ChartCard title="Pedidos por día" icon={BarChart3}>
              {ordersByDay.length === 0 ? (
                <p style={{
                  textAlign: 'center', color: 'var(--text-secondary)',
                  padding: '32px 0', fontSize: 14,
                }}>
                  No hay datos para este período
                </p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  {/* Y-axis labels + bars */}
                  <div style={{ display: 'flex', minHeight: 220 }}>
                    {/* Y-axis */}
                    <div style={{
                      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                      paddingRight: 12, paddingTop: 0, paddingBottom: 28,
                      minWidth: 30, textAlign: 'right',
                    }}>
                      {[maxOrderCount, Math.round(maxOrderCount / 2), 0].map((val, i) => (
                        <span key={i} style={{
                          fontSize: 11, color: 'var(--text-light)', lineHeight: 1,
                        }}>
                          {val}
                        </span>
                      ))}
                    </div>

                    {/* Chart area */}
                    <div style={{ flex: 1, position: 'relative', borderBottom: '1px solid var(--border)' }}>
                      {/* Grid lines */}
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 28, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pointerEvents: 'none' }}>
                        <div style={{ borderBottom: '1px dashed var(--border)', width: '100%', height: 1 }} />
                        <div style={{ borderBottom: '1px dashed var(--border)', width: '100%', height: 1 }} />
                        <div />
                      </div>

                      {/* Bars */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'flex-end',
                        gap: 4,
                        height: 192,
                        paddingTop: 4,
                      }}>
                        {ordersByDay.map((item: any, idx: number) => {
                          const count = item.count || 0;
                          const barHeight = (count / maxOrderCount) * 180;
                          const dateStr = new Date(item.date).toLocaleDateString('es', { day: 'numeric', month: 'short' });
                          return (
                            <div
                              key={item.date || idx}
                              style={{ flex: 1, minWidth: 32, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                              title={`${dateStr}: ${count} pedidos`}
                            >
                              <span style={{
                                fontSize: 11, fontWeight: 700, color: 'var(--text)',
                                marginBottom: 4,
                              }}>
                                {count > 0 ? count : ''}
                              </span>
                              <div style={{
                                width: '100%',
                                maxWidth: 40,
                                backgroundColor: 'var(--primary)',
                                height: `${Math.max(barHeight, 2)}px`,
                                borderRadius: '6px 6px 0 0',
                                transition: 'height 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                                opacity: 0.85,
                                cursor: 'pointer',
                              }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.opacity = '1';
                                  e.currentTarget.style.filter = 'brightness(1.1)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.opacity = '0.85';
                                  e.currentTarget.style.filter = 'none';
                                }}
                              />
                              <span style={{
                                fontSize: 10, color: 'var(--text-light)', marginTop: 6,
                                whiteSpace: 'nowrap',
                              }}>
                                {dateStr}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </ChartCard>

            {/* Chart 2: Productos más vendidos */}
            <ChartCard title="Productos más vendidos" icon={ShoppingBasket}>
              {topProducts.length === 0 ? (
                <p style={{
                  textAlign: 'center', color: 'var(--text-secondary)',
                  padding: '32px 0', fontSize: 14,
                }}>
                  No hay datos para este período
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {topProducts.slice(0, 10).map((item: any, idx: number) => {
                    const qty = item.quantity || 0;
                    const barWidth = (qty / maxProductQty) * 100;
                    const productName = item.name || item.productName || `Producto #${idx + 1}`;
                    return (
                      <div key={item.id || idx}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{
                            fontSize: 13, fontWeight: 500, color: 'var(--text)',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            maxWidth: '65%',
                          }} title={productName}>
                            {productName}
                          </span>
                          <span style={{
                            fontSize: 13, fontWeight: 700, color: 'var(--primary)',
                          }}>
                            {qty} uds
                          </span>
                        </div>
                        <div style={{
                          width: '100%', height: 10, background: 'var(--input-bg)',
                          borderRadius: 5, overflow: 'hidden',
                        }}>
                          <div style={{
                            width: `${Math.max(barWidth, 2)}%`,
                            height: '100%',
                            background: `linear-gradient(90deg, var(--primary), #54A0FF)`,
                            borderRadius: 5,
                            transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                            cursor: 'pointer',
                          }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.filter = 'brightness(1.1)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.filter = 'none';
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ChartCard>

            {/* Chart 3: Ingresos por estado */}
            <ChartCard title="Ingresos por estado" icon={PieChart}>
              {revenueByStatus.length === 0 ? (
                <p style={{
                  textAlign: 'center', color: 'var(--text-secondary)',
                  padding: '32px 0', fontSize: 14,
                }}>
                  No hay datos para este período
                </p>
              ) : (() => {
                const totalRevenue = revenueByStatus.reduce((sum: number, r: any) => sum + (r.revenue || r.total || 0), 0);
                const maxRev = Math.max(...revenueByStatus.map((r: any) => r.revenue || r.total || 0), 1);
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {/* Bar chart view */}
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 140, marginBottom: 8 }}>
                      {revenueByStatus.map((item: any, idx: number) => {
                        const status = item.status || 'pending';
                        const revenue = item.revenue || item.total || 0;
                        const barHeight = (revenue / maxRev) * 120;
                        const colors = STATUS_COLORS[status] || STATUS_COLORS.pending;
                        const label = STATUS_LABELS[status] || status;
                        return (
                          <div
                            key={status}
                            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                            title={`${label}: ${formatPrice(revenue)}`}
                          >
                            <span style={{
                              fontSize: 11, fontWeight: 600, color: 'var(--text)',
                              marginBottom: 4,
                            }}>
                              {revenue > 0 ? formatPrice(revenue) : ''}
                            </span>
                            <div style={{
                              width: '100%',
                              maxWidth: 60,
                              backgroundColor: colors.bar,
                              height: `${Math.max(barHeight, 4)}px`,
                              borderRadius: '6px 6px 0 0',
                              transition: 'height 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                              cursor: 'pointer',
                              opacity: 0.9,
                            }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.opacity = '1';
                                e.currentTarget.style.filter = 'brightness(1.1)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.opacity = '0.9';
                                e.currentTarget.style.filter = 'none';
                              }}
                            />
                            <span style={{
                              fontSize: 11, color: 'var(--text-secondary)', marginTop: 6,
                              textAlign: 'center', fontWeight: 500,
                            }}>
                              {label}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Summary legend */}
                    <div style={{
                      display: 'flex', flexWrap: 'wrap', gap: 16,
                      paddingTop: 14, borderTop: '1px solid var(--border)',
                    }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginRight: 4 }}>
                        Total: {formatPrice(totalRevenue)}
                      </span>
                      {revenueByStatus.map((item: any) => {
                        const status = item.status || 'pending';
                        const colors = STATUS_COLORS[status] || STATUS_COLORS.pending;
                        const label = STATUS_LABELS[status] || status;
                        return (
                          <div key={status} style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                          }}>
                            <div style={{
                              width: 10, height: 10, borderRadius: 3,
                              backgroundColor: colors.bar,
                            }} />
                            <span style={{ fontSize: 12, color: 'var(--text-light)' }}>{label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </ChartCard>
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
          .admin-charts-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (min-width: 1024px) {
          .admin-stats-grid {
            grid-template-columns: repeat(5, 1fr) !important;
          }
          .admin-charts-grid {
            grid-template-columns: repeat(3, 1fr) !important;
          }
        }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
