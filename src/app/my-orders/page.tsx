'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, ClipboardList } from 'lucide-react';
import api, { extractData } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';

import { getStatusLabel, getStatusColor, getStatusClass, formatPrice, formatDate } from '@/lib/utils';

const STATUS_TABS = [
  { value: '', label: 'Todos' },
  { value: 'pending', label: 'Pendiente' },
  { value: 'confirmed', label: 'Confirmado' },
  { value: 'preparing', label: 'Preparación' },
  { value: 'shipped', label: 'Enviado' },
  { value: 'delivered', label: 'Entregado' },
  { value: 'cancelled', label: 'Cancelado' },
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('');
  const { isLoading, user } = useAuth();
  const router = useRouter();

  // Protect route
  useEffect(() => {
    if (!isLoading && !user) router.replace('/login');
  }, [user, isLoading, router]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      let url = '/orders';
      if (activeTab) url += `?status=${activeTab}`;
      const res = await api.get(url);
      const data = extractData(res);
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('[my-orders] Error fetching orders:', err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch orders when user is ready or tab changes
  useEffect(() => {
    if (!isLoading && user) fetchOrders();
  }, [activeTab, isLoading, user]);

  if (isLoading || !user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--background)' }}>
        <div style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <Header
        title="Mis Pedidos"
        showLogout={true}
        rightAction={
          <button
            onClick={fetchOrders}
            style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: 4 }}
            aria-label="Actualizar"
          >
            <RefreshCw size={20} />
          </button>
        }
      />

      {/* Status tabs */}
      <div className="scrollbar-hide" style={{
        display: 'flex', gap: 8, padding: '12px 16px', overflowX: 'auto',
        background: 'var(--white)', borderBottom: '1px solid var(--border)',
      }}>
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            style={{
              height: 36,
              padding: '0 18px',
              borderRadius: 'var(--radius-full)',
              border: 'none',
              fontSize: 13,
              fontWeight: 600,
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              transition: 'all 0.25s ease',
              background: activeTab === tab.value ? 'var(--primary-gradient)' : 'var(--input-bg)',
              color: activeTab === tab.value ? '#fff' : 'var(--text-secondary)',
              boxShadow: activeTab === tab.value ? 'var(--shadow-accent)' : 'none',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders list */}
      <div style={{ padding: '16px 16px 24px', maxWidth: 900, margin: '0 auto' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <div style={{
              width: 32, height: 32,
              border: '3px solid var(--border)',
              borderTopColor: 'var(--primary)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }} />
          </div>
        ) : orders.length === 0 ? (
          <div className="animate-fade-in" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'var(--primary-light)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 16,
            }}>
              <ClipboardList size={36} color="var(--primary)" />
            </div>
            <p style={{
              fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 6,
            }}>
              No hay pedidos
            </p>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
              {activeTab ? 'No tienes pedidos con este estado' : 'Realiza tu primer pedido'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {orders.map((order: any) => {
              try {
              const status = order.status || order.estado || 'pending';
              const items = Array.isArray(order.items) ? order.items : (Array.isArray(order.orderItems) ? order.orderItems : []);
              const total = order.total || order.totalAmount || 0;
              const date = order.createdAt || order.created_at || order.date;
              return (
                <div
                  key={order.id}
                  className="animate-fade-in"
                  style={{
                    background: 'var(--white)',
                    borderRadius: 14,
                    padding: 16,
                    boxShadow: 'var(--shadow)',
                    transition: 'box-shadow 0.25s ease',
                    cursor: 'default',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-md)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow)';
                  }}
                >
                  {/* Order header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div>
                      <p style={{
                        fontSize: 13, fontWeight: 600, color: 'var(--text)',
                        marginBottom: 2,
                      }}>
                        Pedido #{String(order.id).slice(-8).toUpperCase()}
                      </p>
                      <p style={{ fontSize: 12, color: 'var(--text-light)' }}>
                        {formatDate(date)}
                      </p>
                    </div>
                    <span
                      className={getStatusClass(status)}
                      style={{
                        padding: '4px 12px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      {getStatusLabel(status)}
                    </span>
                  </div>

                  {/* Items summary */}
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    paddingTop: 12, borderTop: '1px solid var(--border)',
                  }}>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                      {items.length} {items.length === 1 ? 'artículo' : 'artículos'}
                    </p>
                    <p style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>
                      {formatPrice(total)}
                    </p>
                  </div>
                </div>
              );
              } catch (renderErr) {
                console.error('[my-orders] Error rendering order:', order?.id, renderErr);
                return null;
              }
            })}
          </div>
        )}
      </div>

    </div>
  );
}
