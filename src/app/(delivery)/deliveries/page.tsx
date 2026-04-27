'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw, ChevronDown, ChevronUp, MapPin, Phone, User, Package } from 'lucide-react';
import api, { extractData } from '@/lib/api';
import { formatPrice, formatDate, getStatusLabel, getStatusColor, showToast } from '@/lib/utils';

export default function DeliveryPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'available' | 'mine'>('available');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      try {
        const res = await api.get('/orders/available');
        const available = extractData(res);
        setOrders(available);
      } catch {
        const res = await api.get('/orders?status=confirmed');
        setOrders(extractData(res));
      }
      try {
        const res = await api.get('/orders?status=shipped');
        setMyOrders(extractData(res));
      } catch {
        setMyOrders([]);
      }
    } catch {
      setOrders([]);
      setMyOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const acceptOrder = async (order: any) => {
    try {
      await api.post(`/orders/${order.id}/accept`);
      showToast('Pedido aceptado', 'success');
      fetchOrders();
    } catch (err: any) {
      showToast(err?.message || 'Error al aceptar pedido', 'error');
    }
  };

  const deliverOrder = async (order: any) => {
    try {
      await api.put(`/orders/${order.id}/status`, { status: 'delivered' });
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

  const getDeliveryStatusColors = (status: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      pending: { bg: 'var(--warning-light)', text: '#856404' },
      confirmed: { bg: 'var(--info-light)', text: '#0C5460' },
      preparing: { bg: '#E8DAEF', text: '#6C3483' },
      shipped: { bg: 'var(--success-light)', text: '#155724' },
      delivered: { bg: 'var(--success-light)', text: '#1B7A42' },
      cancelled: { bg: 'var(--danger-light)', text: '#CC3333' },
    };
    return colors[status] || { bg: 'var(--input-bg)', text: 'var(--text-secondary)' };
  };

  return (
    <>
      {/* Refresh button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '10px 0 6px' }}>
        <button
          onClick={fetchOrders}
          style={{
            background: 'var(--white)', border: '2px solid var(--border)',
            borderRadius: 10, padding: '8px 14px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6, fontSize: 13,
            color: 'var(--text)', fontWeight: 500, boxShadow: 'var(--shadow)',
          }}
        >
          <RefreshCw size={16} />
          Actualizar
        </button>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 0, background: 'var(--white)',
        borderRadius: 14, padding: 4, marginBottom: 16, boxShadow: 'var(--shadow)',
      }}>
        <button
          onClick={() => setActiveTab('available')}
          style={{
            flex: 1, padding: '12px', borderRadius: 10, border: 'none', cursor: 'pointer',
            background: activeTab === 'available' ? 'var(--primary-gradient)' : 'transparent',
            color: activeTab === 'available' ? 'white' : 'var(--text-secondary)',
            fontSize: 14, fontWeight: activeTab === 'available' ? 700 : 500,
            boxShadow: activeTab === 'available' ? 'var(--shadow-accent)' : 'none',
            transition: 'all 0.25s ease',
          }}
        >
          Disponibles ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab('mine')}
          style={{
            flex: 1, padding: '12px', borderRadius: 10, border: 'none', cursor: 'pointer',
            background: activeTab === 'mine' ? 'var(--primary-gradient)' : 'transparent',
            color: activeTab === 'mine' ? 'white' : 'var(--text-secondary)',
            fontSize: 14, fontWeight: activeTab === 'mine' ? 700 : 500,
            boxShadow: activeTab === 'mine' ? 'var(--shadow-accent)' : 'none',
            transition: 'all 0.25s ease',
          }}
        >
          Mis entregas ({myOrders.length})
        </button>
      </div>

      {/* Orders list */}
      <div style={{ paddingBottom: 32 }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
            <div style={{ width: 36, height: 36, border: '3px solid var(--border)', borderTopColor: '#FF6B35', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          </div>
        ) : displayOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 80 }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%', background: 'var(--input-bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              {activeTab === 'available' ? <Package size={36} style={{ color: 'var(--text-light)' }} /> : <User size={36} style={{ color: 'var(--text-light)' }} />}
            </div>
            <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
              {activeTab === 'available' ? 'No hay entregas disponibles' : 'No tienes entregas activas'}
            </p>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
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
              const statusColors = getDeliveryStatusColors(status);

              return (
                <div key={order.id} className="animate-fade-in" style={{
                  background: 'var(--white)', borderRadius: 16, boxShadow: isExpanded ? 'var(--shadow-lg)' : 'var(--shadow)',
                  overflow: 'hidden', transition: 'box-shadow 0.25s ease',
                }}>
                  {/* Order header */}
                  <div
                    style={{ padding: '16px 18px', cursor: 'pointer' }}
                    onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
                          #{String(order.id).slice(-8).toUpperCase()}
                        </span>
                        <span style={{
                          padding: '4px 12px', borderRadius: 'var(--radius-full)', fontSize: 12, fontWeight: 600,
                          background: statusColors.bg, color: statusColors.text,
                        }}>
                          {getStatusLabel(status)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <p style={{ fontSize: 18, fontWeight: 800, color: '#FF6B35' }}>{formatPrice(total)}</p>
                        {isExpanded ? <ChevronUp size={18} style={{ color: 'var(--text-light)' }} /> : <ChevronDown size={18} style={{ color: 'var(--text-light)' }} />}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <User size={14} style={{ color: 'var(--text-light)' }} />
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        {customer.name || customer.userName || 'Cliente'}
                      </p>
                      <span style={{ color: 'var(--text-light)', margin: '0 4px' }}>·</span>
                      <p style={{ fontSize: 12, color: 'var(--text-light)' }}>
                        {formatDate(order.createdAt || order.created_at)}
                      </p>
                      <span style={{ color: 'var(--text-light)', margin: '0 4px' }}>·</span>
                      <p style={{ fontSize: 12, color: 'var(--text-light)' }}>
                        {items.length} artículo{items.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div style={{ borderTop: '1px solid var(--border)', padding: 18, background: 'var(--background)' }}>
                      {/* Customer info */}
                      {(customer.name || customer.address || customer.phone) && (
                        <div style={{ marginBottom: 14, padding: 14, background: 'var(--white)', borderRadius: 12, boxShadow: 'var(--shadow)' }}>
                          <p style={{ fontSize: 12, fontWeight: 700, marginBottom: 10, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Datos del cliente
                          </p>
                          {customer.name && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                              <User size={15} style={{ color: 'var(--primary)' }} />
                              <span style={{ fontSize: 14, fontWeight: 500 }}>{customer.name}</span>
                            </div>
                          )}
                          {customer.phone && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                              <Phone size={15} style={{ color: 'var(--success)' }} />
                              <span style={{ fontSize: 14 }}>{customer.phone}</span>
                            </div>
                          )}
                          {(customer.address || order.address || order.shippingAddress) && (
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                              <MapPin size={15} style={{ color: 'var(--danger)', marginTop: 2, flexShrink: 0 }} />
                              <span style={{ fontSize: 14, lineHeight: 1.5 }}>{customer.address || order.address || order.shippingAddress}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Items */}
                      <div style={{ marginBottom: 14, padding: 14, background: 'var(--white)', borderRadius: 12, boxShadow: 'var(--shadow)' }}>
                        <p style={{ fontSize: 12, fontWeight: 700, marginBottom: 10, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Artículos
                        </p>
                        {items.map((item: any, idx: number) => (
                          <div key={idx} style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '8px 0',
                            borderBottom: idx < items.length - 1 ? '1px solid var(--border)' : 'none',
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{
                                width: 6, height: 6, borderRadius: '50%', background: 'var(--primary)',
                              }} />
                              <p style={{ fontSize: 14, fontWeight: 500 }}>{item.name || item.productName || `Producto #${item.productId}`}</p>
                              <span style={{ fontSize: 12, color: 'var(--text-light)' }}>x{item.quantity}</span>
                            </div>
                            <p style={{ fontSize: 14, fontWeight: 600 }}>
                              {formatPrice((item.price || item.unitPrice || 0) * (item.quantity || 1))}
                            </p>
                          </div>
                        ))}
                      </div>

                      {/* Action button */}
                      {activeTab === 'available' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); acceptOrder(order); }}
                          style={{
                            width: '100%', padding: '14px', borderRadius: 12, border: 'none',
                            background: 'linear-gradient(135deg, #00B894, #00D2A0)', color: 'white', fontSize: 15,
                            fontWeight: 700, cursor: 'pointer', boxShadow: 'var(--shadow-success)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                          }}
                        >
                          Aceptar entrega
                        </button>
                      )}
                      {activeTab === 'mine' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); deliverOrder(order); }}
                          style={{
                            width: '100%', padding: '14px', borderRadius: 12, border: 'none',
                            background: 'linear-gradient(135deg, #00B894, #00D2A0)', color: 'white', fontSize: 15,
                            fontWeight: 700, cursor: 'pointer', boxShadow: 'var(--shadow-success)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                          }}
                        >
                          Marcar como entregado
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
