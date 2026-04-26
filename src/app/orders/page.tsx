'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import api, { extractData } from '@/lib/api';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
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

  const fetchOrders = async () => {
    try {
      setLoading(true);
      let url = '/orders';
      if (activeTab) url += `?status=${activeTab}`;
      const res = await api.get(url);
      setOrders(extractData(res));
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [activeTab]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <Header
        title="Mis Pedidos"
        showLogout={false}
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
              padding: '8px 16px', borderRadius: 20, border: 'none', fontSize: 13, fontWeight: 500,
              whiteSpace: 'nowrap', cursor: 'pointer', transition: 'all 0.2s',
              background: activeTab === tab.value ? 'var(--accent)' : 'var(--input-bg)',
              color: activeTab === tab.value ? 'white' : 'var(--text)',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders list */}
      <div style={{ padding: '16px 16px 80px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <div style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          </div>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-secondary)' }}>
            <p style={{ fontSize: 48, marginBottom: 12 }}>📋</p>
            <p style={{ fontSize: 16, fontWeight: 500 }}>No hay pedidos</p>
            <p style={{ fontSize: 13, marginTop: 4 }}>
              {activeTab ? 'No tienes pedidos con este estado' : 'Realiza tu primer pedido'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {orders.map((order: any) => {
              const status = order.status || order.estado || 'pending';
              const items = order.items || order.orderItems || [];
              const total = order.total || order.totalAmount || 0;
              const date = order.createdAt || order.created_at || order.date;
              return (
                <div
                  key={order.id}
                  className="animate-fade-in"
                  style={{
                    background: 'var(--white)', borderRadius: 12, padding: 16,
                    boxShadow: 'var(--shadow)',
                  }}
                >
                  {/* Order header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div>
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 2 }}>
                        Pedido #{String(order.id).slice(-8).toUpperCase()}
                      </p>
                      <p style={{ fontSize: 12, color: 'var(--text-light)' }}>
                        {formatDate(date)}
                      </p>
                    </div>
                    <span
                      className={getStatusClass(status)}
                      style={{
                        padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600,
                      }}
                    >
                      {getStatusLabel(status)}
                    </span>
                  </div>

                  {/* Items summary */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                      {items.length} {items.length === 1 ? 'artículo' : 'artículos'}
                    </p>
                    <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
                      {formatPrice(total)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
