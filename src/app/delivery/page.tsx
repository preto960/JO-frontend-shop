'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw, ChevronDown, ChevronUp, MapPin, Phone, User } from 'lucide-react';
import api, { extractData } from '@/lib/api';
import Header from '@/components/Header';
import { formatPrice, formatDate, formatDateTime, getStatusLabel, getStatusColor, showToast } from '@/lib/utils';

export default function DeliveryPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'available' | 'mine'>('available');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get('/orders?status=confirmed,shipped');
      const all = extractData(res);
      // Available: confirmed orders not assigned to delivery
      const available = all.filter((o: any) => o.status === 'confirmed');
      // My orders: orders assigned to current delivery person (shipped)
      const mine = all.filter((o: any) => o.status === 'shipped');
      setOrders(available);
      setMyOrders(mine);
    } catch {
      // Try fetching all orders
      try {
        const res = await api.get('/orders');
        const all = extractData(res);
        setOrders(all.filter((o: any) => o.status === 'confirmed'));
        setMyOrders(all.filter((o: any) => o.status === 'shipped'));
      } catch { /* ignore */ }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const acceptOrder = async (order: any) => {
    try {
      await api.put(`/orders/${order.id}`, { status: 'shipped' });
      showToast('Pedido aceptado', 'success');
      fetchOrders();
    } catch (err: any) {
      showToast(err?.message || 'Error al aceptar pedido', 'error');
    }
  };

  const deliverOrder = async (order: any) => {
    try {
      await api.put(`/orders/${order.id}`, { status: 'delivered' });
      showToast('Pedido entregado', 'success');
      fetchOrders();
    } catch (err: any) {
      showToast(err?.message || 'Error al entregar pedido', 'error');
    }
  };

  const displayOrders = activeTab === 'available' ? orders : myOrders;

  const getOrderTotal = (order: any): number => {
    if (order.total) return order.total;
    if (order.totalAmount) return order.totalAmount;
    const items = order.items || order.orderItems || [];
    return items.reduce((sum: number, item: any) => {
      return sum + (item.price || item.unitPrice || 0) * (item.quantity || 1);
    }, 0);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <Header
        title="Entregas"
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

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 0, background: 'var(--white)', borderBottom: '1px solid var(--border)',
      }}>
        <button
          onClick={() => setActiveTab('available')}
          style={{
            flex: 1, padding: '14px', border: 'none', cursor: 'pointer',
            background: 'transparent',
            color: activeTab === 'available' ? 'var(--accent)' : 'var(--text-secondary)',
            fontSize: 14, fontWeight: activeTab === 'available' ? 600 : 400,
            borderBottom: activeTab === 'available' ? '2px solid var(--accent)' : '2px solid transparent',
          }}
        >
          Disponibles ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab('mine')}
          style={{
            flex: 1, padding: '14px', border: 'none', cursor: 'pointer',
            background: 'transparent',
            color: activeTab === 'mine' ? 'var(--accent)' : 'var(--text-secondary)',
            fontSize: 14, fontWeight: activeTab === 'mine' ? 600 : 400,
            borderBottom: activeTab === 'mine' ? '2px solid var(--accent)' : '2px solid transparent',
          }}
        >
          Mis entregas ({myOrders.length})
        </button>
      </div>

      {/* Orders */}
      <div style={{ padding: '16px', paddingBottom: 32 }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <div style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          </div>
        ) : displayOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-secondary)' }}>
            <p style={{ fontSize: 48, marginBottom: 12 }}>
              {activeTab === 'available' ? '📦' : '🚚'}
            </p>
            <p style={{ fontSize: 16, fontWeight: 500 }}>
              {activeTab === 'available' ? 'No hay entregas disponibles' : 'No tienes entregas activas'}
            </p>
            <p style={{ fontSize: 13, marginTop: 4 }}>
              {activeTab === 'available' ? 'Espera nuevos pedidos confirmados' : 'Acepta una entrega para comenzar'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {displayOrders.map((order: any) => {
              const isExpanded = expandedOrder === order.id;
              const items = order.items || order.orderItems || [];
              const total = getOrderTotal(order);
              const customer = order.user || {};
              const status = order.status || 'pending';

              return (
                <div key={order.id} className="animate-fade-in" style={{
                  background: 'var(--white)', borderRadius: 12, boxShadow: 'var(--shadow)',
                  overflow: 'hidden',
                }}>
                  {/* Order header */}
                  <div
                    style={{ padding: 16, cursor: 'pointer' }}
                    onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <div>
                        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
                          #{String(order.id).slice(-8).toUpperCase()}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{
                          padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600,
                          background: getStatusColor(status) + '20', color: getStatusColor(status),
                        }}>
                          {getStatusLabel(status)}
                        </span>
                        {isExpanded ? <ChevronUp size={16} color="var(--text-secondary)" /> : <ChevronDown size={16} color="var(--text-secondary)" />}
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <User size={14} style={{ color: 'var(--text-secondary)' }} />
                          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                            {customer.name || customer.userName || 'Cliente'}
                          </p>
                        </div>
                        <p style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 2 }}>
                          {formatDate(order.createdAt || order.created_at)}
                        </p>
                      </div>
                      <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{formatPrice(total)}</p>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div style={{ borderTop: '1px solid var(--border)', padding: 16, background: 'var(--background)' }}>
                      {/* Customer info */}
                      {(customer.name || customer.address || customer.phone) && (
                        <div style={{ marginBottom: 12, padding: 12, background: 'var(--white)', borderRadius: 8 }}>
                          <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text)' }}>Datos del cliente</p>
                          {customer.name && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                              <User size={14} style={{ color: 'var(--text-secondary)' }} />
                              <span style={{ fontSize: 13 }}>{customer.name}</span>
                            </div>
                          )}
                          {customer.phone && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                              <Phone size={14} style={{ color: 'var(--text-secondary)' }} />
                              <span style={{ fontSize: 13 }}>{customer.phone}</span>
                            </div>
                          )}
                          {(customer.address || order.address || order.shippingAddress) && (
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                              <MapPin size={14} style={{ color: 'var(--text-secondary)', marginTop: 2 }} />
                              <span style={{ fontSize: 13 }}>{customer.address || order.address || order.shippingAddress}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Items */}
                      <div style={{ marginBottom: 12 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text)' }}>Artículos</p>
                        {items.map((item: any, idx: number) => (
                          <div key={idx} style={{
                            display: 'flex', justifyContent: 'space-between', padding: '6px 0',
                            borderBottom: idx < items.length - 1 ? '1px solid var(--border)' : 'none',
                          }}>
                            <div>
                              <p style={{ fontSize: 13, fontWeight: 500 }}>{item.name || item.productName || `Producto #${item.productId}`}</p>
                              <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>x{item.quantity}</p>
                            </div>
                            <p style={{ fontSize: 14, fontWeight: 600 }}>
                              {formatPrice((item.price || item.unitPrice || 0) * (item.quantity || 1))}
                            </p>
                          </div>
                        ))}
                      </div>

                      {/* Action button */}
                      <div style={{ display: 'flex', gap: 8 }}>
                        {activeTab === 'available' && (
                          <button
                            onClick={() => acceptOrder(order)}
                            style={{
                              flex: 1, padding: '12px', borderRadius: 8, border: 'none',
                              background: 'var(--success)', color: 'white', fontSize: 14,
                              fontWeight: 600, cursor: 'pointer',
                            }}
                          >
                            Aceptar entrega
                          </button>
                        )}
                        {activeTab === 'mine' && (
                          <button
                            onClick={() => deliverOrder(order)}
                            style={{
                              flex: 1, padding: '12px', borderRadius: 8, border: 'none',
                              background: 'var(--success)', color: 'white', fontSize: 14,
                              fontWeight: 600, cursor: 'pointer',
                            }}
                          >
                            Marcar como entregado
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
    </div>
  );
}
