'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, ClipboardList, ChevronDown, ChevronUp, Phone, MessageCircle, Package, User as UserIcon, MapPin } from 'lucide-react';
import api, { extractData } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { usePusher } from '@/contexts/PusherContext';
import Header from '@/components/Header';
import OrderChatModal from '@/components/OrderChatModal';

import { getStatusLabel, getStatusColor, getStatusClass, formatPrice, formatDate, showToast } from '@/lib/utils';

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
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [chatModal, setChatModal] = useState<{ isOpen: boolean; orderId: number; orderNumber: string; otherUserName: string }>({
    isOpen: false,
    orderId: 0,
    orderNumber: '',
    otherUserName: '',
  });
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

  // ─── Real-time Pusher: listen for order updates ─────────────────────
  const { isConnected } = usePusher();
  const fetchOrdersRef = useCallback(fetchOrders, [activeTab]);

  // Open chat modal
  const openChat = (orderId: number, orderNumber: string, deliveryName: string) => {
    setChatModal({
      isOpen: true,
      orderId,
      orderNumber: String(orderNumber).slice(-8).toUpperCase(),
      otherUserName: deliveryName || 'Delivery',
    });
  };

  // Stable ref for openChat so the event listener can use it
  const openChatRef = useRef(openChat);
  openChatRef.current = openChat;

  // Listen for notification click to open chat
  useEffect(() => {
    const onOpenOrderChat = (e: Event) => {
      const { orderId, senderName } = (e as CustomEvent).detail || {};
      if (!orderId) return;
      // Expand the order first
      setExpandedOrder(String(orderId));
      // Open chat modal
      openChatRef.current(orderId, String(orderId), senderName || 'Repartidor');
    };
    window.addEventListener('notification:open-order-chat', onOpenOrderChat);
    return () => window.removeEventListener('notification:open-order-chat', onOpenOrderChat);
  }, []);

  useEffect(() => {
    if (!isConnected || !user) return;

    const onOrderUpdated = (e: Event) => {
      const data = (e as CustomEvent).detail;
      console.log('[my-orders] Pusher order-updated:', data);
      fetchOrdersRef();
    };
    const onOrderCreated = (e: Event) => {
      const data = (e as CustomEvent).detail;
      console.log('[my-orders] Pusher order-created:', data);
      fetchOrdersRef();
    };

    window.addEventListener('pusher:order-updated', onOrderUpdated);
    window.addEventListener('pusher:order-created', onOrderCreated);
    return () => {
      window.removeEventListener('pusher:order-updated', onOrderUpdated);
      window.removeEventListener('pusher:order-created', onOrderCreated);
    };
  }, [isConnected, user, fetchOrdersRef]);

  // Toggle order expansion
  const toggleExpand = (orderId: string) => {
    setExpandedOrder(prev => prev === orderId ? null : orderId);
  };

  // Call delivery
  const callDelivery = (phone: string) => {
    if (!phone) return;
    window.open(`tel:${phone}`, '_self');
  };

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
            style={{ background: 'none', border: 'none', color: 'var(--white)', cursor: 'pointer', padding: 4 }}
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
              color: activeTab === tab.value ? 'var(--white)' : 'var(--text-secondary)',
              boxShadow: activeTab === tab.value ? 'var(--shadow-accent)' : 'none',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders list */}
      <div style={{ padding: '16px 16px 100px', maxWidth: 900, margin: '0 auto' }}>
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
              const orderIdStr = String(order.id);
              const isExpanded = expandedOrder === orderIdStr;
              const delivery = order.delivery || order.Delivery || null;
              const hasDelivery = delivery && (delivery.name || delivery.phone);
              const canChat = ['confirmed', 'preparing', 'shipped'].includes(status) && hasDelivery;
              const isShipped = status === 'shipped';

              return (
                <div
                  key={order.id}
                  className="animate-fade-in"
                  style={{
                    background: 'var(--white)',
                    borderRadius: 14,
                    boxShadow: 'var(--shadow)',
                    transition: 'box-shadow 0.25s ease',
                    overflow: 'hidden',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-md)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow)';
                  }}
                >
                  {/* Order header - Clickable to expand */}
                  <div
                    onClick={() => toggleExpand(orderIdStr)}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: 16,
                      cursor: 'pointer',
                      userSelect: 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 10,
                        background: getStatusColor(status) + '15',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <Package size={20} color={getStatusColor(status)} />
                      </div>
                      <div>
                        <p style={{
                          fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2,
                        }}>
                          Pedido #{orderIdStr.slice(-8).toUpperCase()}
                        </p>
                        <p style={{ fontSize: 12, color: 'var(--text-light)' }}>
                          {formatDate(date)}
                        </p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
                      {isExpanded ? (
                        <ChevronUp size={18} color="var(--text-light)" />
                      ) : (
                        <ChevronDown size={18} color="var(--text-light)" />
                      )}
                    </div>
                  </div>

                  {/* Items summary (always visible) */}
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '0 16px 14px', borderTop: '1px solid var(--border)',
                    paddingTop: 12, marginLeft: 52,
                  }}>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                      {items.length} {items.length === 1 ? 'artículo' : 'artículos'}
                    </p>
                    <p style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>
                      {formatPrice(total)}
                    </p>
                  </div>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div style={{
                      borderTop: '1px solid var(--border)',
                      padding: 16,
                      background: 'var(--input-bg)',
                      animation: 'slideDown 0.2s ease',
                    }}>
                      {/* Items list */}
                      {items.length > 0 && (
                        <div style={{ marginBottom: 16 }}>
                          <p style={{
                            fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)',
                            textTransform: 'uppercase', letterSpacing: '0.5px',
                            marginBottom: 10,
                          }}>
                            Productos
                          </p>
                          {items.map((item: any, idx: number) => (
                            <div key={idx} style={{
                              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                              padding: '8px 0',
                              borderBottom: idx < items.length - 1 ? '1px solid var(--border)' : 'none',
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                                {item.image && (
                                  <div style={{
                                    width: 36, height: 36, borderRadius: 8,
                                    background: 'var(--border)', flexShrink: 0,
                                    overflow: 'hidden',
                                  }}>
                                    <img
                                      src={item.image}
                                      alt={item.name}
                                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                  </div>
                                )}
                                <div style={{ minWidth: 0, flex: 1 }}>
                                  <p style={{
                                    fontSize: 13, fontWeight: 500, color: 'var(--text)',
                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                  }}>
                                    {item.name || item.productName}
                                  </p>
                                  <p style={{ fontSize: 11, color: 'var(--text-light)' }}>
                                    Cantidad: {item.quantity}
                                  </p>
                                </div>
                              </div>
                              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', flexShrink: 0 }}>
                                {formatPrice(item.subtotal || (item.productPrice || item.price || item.unitPrice || 0) * item.quantity)}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Delivery info */}
                      {hasDelivery && (
                        <div style={{
                          background: 'var(--white)',
                          borderRadius: 12,
                          padding: 14,
                          border: '1px solid var(--border)',
                        }}>
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10,
                          }}>
                            <UserIcon size={16} color="#1ABC9C" />
                            <p style={{
                              fontSize: 12, fontWeight: 700, color: '#1ABC9C',
                              textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0,
                            }}>
                              Tu repartidor
                            </p>
                          </div>

                          <div style={{
                            display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12,
                          }}>
                            <div style={{
                              width: 40, height: 40, borderRadius: '50%',
                              background: '#1ABC9C15',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              <UserIcon size={20} color="#1ABC9C" />
                            </div>
                            <div>
                              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', margin: 0 }}>
                                {delivery.name || 'Repartidor asignado'}
                              </p>
                              {delivery.phone && (
                                <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                                  {delivery.phone}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Action buttons: Call, Chat & Track */}
                          <div style={{ display: 'flex', gap: 10 }}>
                            {isShipped && hasDelivery && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/tracking/${orderIdStr}`);
                                }}
                                style={{
                                  flex: 1,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                  padding: '10px 16px',
                                  borderRadius: 10,
                                  border: 'none',
                                  background: '#9B59B6',
                                  color: 'var(--white)',
                                  fontSize: 13, fontWeight: 600,
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                  fontFamily: 'inherit',
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = '#8E44AD'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = '#9B59B6'; }}
                              >
                                <MapPin size={16} />
                                Seguimiento
                              </button>
                            )}
                            {delivery.phone && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  callDelivery(delivery.phone);
                                }}
                                style={{
                                  flex: 1,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                  padding: '10px 16px',
                                  borderRadius: 10,
                                  border: 'none',
                                  background: '#1ABC9C',
                                  color: 'var(--white)',
                                  fontSize: 13, fontWeight: 600,
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                  fontFamily: 'inherit',
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = '#16A085'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = '#1ABC9C'; }}
                              >
                                <Phone size={16} />
                                Llamar
                              </button>
                            )}
                            {canChat && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openChat(order.id, orderIdStr, delivery.name);
                                }}
                                style={{
                                  flex: 1,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                  padding: '10px 16px',
                                  borderRadius: 10,
                                  border: 'none',
                                  background: '#3498DB',
                                  color: 'var(--white)',
                                  fontSize: 13, fontWeight: 600,
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                  fontFamily: 'inherit',
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = '#2980B9'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = '#3498DB'; }}
                              >
                                <MessageCircle size={16} />
                                Chat
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* No delivery assigned yet */}
                      {!hasDelivery && ['confirmed', 'preparing'].includes(status) && (
                        <div style={{
                          padding: 12,
                          background: 'var(--white)',
                          borderRadius: 10,
                          border: '1px solid var(--border)',
                          textAlign: 'center',
                        }}>
                          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
                            Aun no se ha asignado un repartidor
                          </p>
                        </div>
                      )}
                    </div>
                  )}
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

      {/* Order Chat Modal */}
      <OrderChatModal
        isOpen={chatModal.isOpen}
        onClose={() => setChatModal(prev => ({ ...prev, isOpen: false }))}
        orderId={chatModal.orderId}
        orderNumber={chatModal.orderNumber}
        otherUserName={chatModal.otherUserName}
      />

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideDown { from { opacity: 0; max-height: 0; } to { opacity: 1; max-height: 600px; } }
      `}</style>
    </div>
  );
}
