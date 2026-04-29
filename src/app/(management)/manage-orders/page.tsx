'use client';

import React, { useState, useEffect } from 'react';
import api, { extractData } from '@/lib/api';
import { formatPrice, formatDate, getStatusLabel, getStatusColor, showToast } from '@/lib/utils';

const STATUS_TABS = [
  { value: '', label: 'Todos' },
  { value: 'pending', label: 'Pendiente' },
  { value: 'confirmed', label: 'Confirmado' },
  { value: 'preparing', label: 'En preparación' },
  { value: 'shipped', label: 'Enviado' },
  { value: 'delivered', label: 'Entregado' },
  { value: 'cancelled', label: 'Cancelado' },
];

const NEXT_STATUS: Record<string, string> = {
  pending: 'confirmed',
  confirmed: 'preparing',
  preparing: 'shipped',
  shipped: 'delivered',
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      let url = '/orders';
      if (activeTab) url += `?status=${activeTab}`;
      const res = await api.get(url);
      setOrders(extractData(res));
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchOrders(); }, [activeTab]);

  const updateStatus = async (orderId: string, newStatus: string) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status: newStatus });
      showToast('Estado actualizado', 'success');
      fetchOrders();
    } catch (err: any) {
      showToast(err?.message || 'Error al actualizar', 'error');
    }
  };

  const getOrderTotal = (order: any): number => {
    if (order.total) return order.total;
    if (order.totalAmount) return order.totalAmount;
    const items = order.items || order.orderItems || [];
    return items.reduce((sum: number, item: any) => {
      return sum + (item.price || item.unitPrice || 0) * (item.quantity || 1);
    }, 0);
  };

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', marginBottom: 20 }}>Pedidos</h1>

      {/* Status tabs */}
      <div className="scrollbar-hide" style={{
        display: 'flex', gap: 8, marginBottom: 20, overflowX: 'auto', paddingBottom: 4,
      }}>
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            style={{
              padding: '8px 18px', borderRadius: 10, border: 'none', fontSize: 13, fontWeight: activeTab === tab.value ? 600 : 500,
              whiteSpace: 'nowrap', cursor: 'pointer',
              background: activeTab === tab.value ? 'var(--primary-gradient)' : '#FFFFFF',
              color: activeTab === tab.value ? 'white' : 'var(--text-secondary)',
              boxShadow: 'var(--shadow)',
              transition: 'all 0.2s ease',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div style={{
            width: 36, height: 36,
            border: '3px solid var(--border)', borderTopColor: 'var(--primary)',
            borderRadius: '50%', animation: 'spin 1s linear infinite',
          }} />
        </div>
      ) : orders.length === 0 ? (
        <div style={{ background: '#FFFFFF', borderRadius: 14, padding: 48, textAlign: 'center', boxShadow: 'var(--shadow)' }}>
          <p style={{ fontSize: 48, marginBottom: 12 }}>📋</p>
          <p style={{ fontSize: 15, color: 'var(--text-secondary)' }}>No hay pedidos</p>
          <p style={{ fontSize: 13, color: 'var(--text-light)', marginTop: 4 }}>Los pedidos aparecerán aquí cuando los clientes compren</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {orders.map((order: any) => {
            const status = order.status || order.estado || 'pending';
            const isExpanded = expandedOrder === order.id;
            const items = order.items || order.orderItems || [];
            const total = getOrderTotal(order);
            const nextStatus = NEXT_STATUS[status];
            const statusColor = getStatusColor(status);

            return (
              <div
                key={order.id} className="animate-fade-in"
                style={{
                  background: '#FFFFFF', borderRadius: 14,
                  boxShadow: isExpanded ? 'var(--shadow-md)' : 'var(--shadow)',
                  overflow: 'hidden',
                  transition: 'all 0.2s ease',
                }}
              >
                {/* Order header */}
                <div
                  style={{ padding: 18, cursor: 'pointer' }}
                  onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
                        #{String(order.id).slice(-8).toUpperCase()}
                      </span>
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        {formatDate(order.createdAt || order.created_at)}
                      </span>
                    </div>
                    <span style={{
                      padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                      background: statusColor + '18', color: statusColor,
                    }}>
                      {getStatusLabel(status)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                      {order.user?.name || order.userName || 'Cliente'} · {items.length} artículo(s)
                    </p>
                    <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--primary)' }}>{formatPrice(total)}</p>
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div style={{ borderTop: '1px solid var(--border)', padding: 18, background: '#F5F6FA' }}>
                    {/* Items */}
                    {items.map((item: any, idx: number) => (
                      <div key={idx} style={{
                        display: 'flex', justifyContent: 'space-between', padding: '10px 0',
                        borderBottom: idx < items.length - 1 ? '1px solid var(--border)' : 'none',
                      }}>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{item.name || item.productName || `Producto #${item.productId}`}</p>
                          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>Cantidad: {item.quantity}</p>
                        </div>
                        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
                          {formatPrice((item.price || item.unitPrice || 0) * (item.quantity || 1))}
                        </p>
                      </div>
                    ))}

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
                      {nextStatus && status !== 'cancelled' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); updateStatus(order.id, nextStatus); }}
                          style={{
                            padding: '10px 18px', borderRadius: 10, border: 'none',
                            background: 'var(--primary-gradient)',
                            color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                            boxShadow: 'var(--shadow-accent)',
                            transition: 'all 0.2s ease',
                          }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
                        >
                          Marcar como {getStatusLabel(nextStatus)}
                        </button>
                      )}
                      {status !== 'cancelled' && status !== 'delivered' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); updateStatus(order.id, 'cancelled'); }}
                          style={{
                            padding: '10px 18px', borderRadius: 10,
                            border: '2px solid #FF6B6B', background: '#FFFFFF',
                            color: '#FF6B6B', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                            transition: 'all 0.2s ease',
                          }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#FFE8E8'; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#FFFFFF'; }}
                        >
                          Cancelar pedido
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
