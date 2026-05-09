'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, User, Phone, Package } from 'lucide-react';
import api, { extractItem } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { usePusher } from '@/contexts/PusherContext';
import { getStatusLabel, getStatusColor } from '@/lib/utils';

interface LocationPoint {
  id: number;
  orderId: number;
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
  createdAt: string;
}

export default function TrackingPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.id as string;

  const { isLoading, user } = useAuth();
  const { isConnected, subscribeToOrderChannel, unsubscribeFromOrderChannel } = usePusher();

  const [order, setOrder] = useState<any>(null);
  const [latestLocation, setLatestLocation] = useState<LocationPoint | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [footerExpanded, setFooterExpanded] = useState(true);

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoading && !user) router.replace('/login');
  }, [user, isLoading, router]);

  // Fetch order details
  const fetchOrder = useCallback(async () => {
    if (!orderId) return;
    try {
      const res = await api.get(`/orders/${orderId}`);
      setOrder(extractItem(res));
    } catch (err: any) {
      console.error('[tracking] Error fetching order:', err);
      setError('No se pudo cargar la orden');
    }
  }, [orderId]);

  // Fetch latest location
  const fetchLatestLocation = useCallback(async () => {
    if (!orderId) return;
    try {
      const res = await api.get(`/tracking/${orderId}/latest`);
      const data = extractItem(res) || res;
      setLatestLocation(data || null);
    } catch (err: any) {
      console.error('[tracking] Error fetching latest location:', err);
    }
  }, [orderId]);

  // Initial data load
  useEffect(() => {
    if (!user || !orderId) return;
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchOrder(), fetchLatestLocation()]);
      setLoading(false);
    };
    load();
  }, [user, orderId, fetchOrder, fetchLatestLocation]);

  // Subscribe to real-time location updates
  useEffect(() => {
    if (!isConnected || !orderId || !user) return;

    subscribeToOrderChannel(orderId);

    const onLocationUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail) {
        console.log('[tracking] Location update:', detail);
        setLatestLocation(detail);
      }
    };

    window.addEventListener('pusher:location-update', onLocationUpdate);
    return () => {
      window.removeEventListener('pusher:location-update', onLocationUpdate);
      if (orderId) unsubscribeFromOrderChannel(orderId);
    };
  }, [isConnected, orderId, user, subscribeToOrderChannel, unsubscribeFromOrderChannel]);

  // Build the iframe map URL
  const getMapUrl = () => {
    if (latestLocation && latestLocation.lat != null && latestLocation.lng != null && latestLocation.lat !== 0 && latestLocation.lng !== 0) {
      // Has valid coordinates - center on delivery
      const lat = latestLocation.lat;
      const lng = latestLocation.lng;
      const delta = 0.005;
      return `https://www.openstreetmap.org/export/embed.html?bbox=${lng - delta},${lat - delta},${lng + delta},${lat + delta}&layer=mapnik&marker=${lat},${lng}`;
    }
    // Default: Caracas area
    return 'https://www.openstreetmap.org/export/embed.html?bbox=-66.96,-10.52,-66.82,-10.42&layer=mapnik';
  };

  const delivery = order?.delivery || order?.Delivery || null;
  const status = order?.status || 'pending';

  const callDelivery = (phone: string) => {
    if (!phone) return;
    window.open(`tel:${phone}`, '_self');
  };

  if (isLoading || !user) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--background)' }}>
        <div style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '14px 16px',
        background: 'var(--primary-gradient)',
        color: 'var(--white)',
        flexShrink: 0,
        zIndex: 10,
      }}>
        <button
          onClick={() => router.back()}
          style={{ background: 'none', border: 'none', color: 'var(--white)', cursor: 'pointer', padding: 4 }}
          aria-label="Volver"
        >
          <ArrowLeft size={22} />
        </button>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>
            Seguimiento de Envio
          </p>
          <p style={{ fontSize: 12, opacity: 0.85, margin: '2px 0 0' }}>
            Pedido #{String(orderId).slice(-8).toUpperCase()}
          </p>
        </div>
        <div style={{
          padding: '4px 10px',
          borderRadius: 'var(--radius-full)',
          background: 'rgba(255,255,255,0.2)',
          fontSize: 11,
          fontWeight: 600,
        }}>
          {order ? getStatusLabel(status) : '...'}
        </div>
      </div>

      {loading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        </div>
      ) : error || !order ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ textAlign: 'center' }}>
            <Package size={48} color="var(--text-light)" style={{ marginBottom: 12 }} />
            <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', margin: '0 0 6px' }}>
              {error || 'Orden no encontrada'}
            </p>
            <button
              onClick={() => router.push('/my-orders')}
              style={{
                marginTop: 12,
                padding: '10px 24px',
                borderRadius: 'var(--radius-full)',
                border: 'none',
                background: 'var(--primary)',
                color: 'var(--white)',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Ver mis pedidos
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Map - fills all available space between header and footer */}
          <div style={{
            flex: 1,
            position: 'relative',
            minHeight: 0,
          }}>
            {/* Live indicator overlay */}
            {latestLocation && latestLocation.lat != null && latestLocation.lng != null && latestLocation.lat !== 0 && latestLocation.lng !== 0 && (
              <div style={{
                position: 'absolute',
                top: 12,
                right: 12,
                background: 'rgba(255,255,255,0.95)',
                borderRadius: 8,
                padding: '6px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                zIndex: 10,
              }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: '#2ECC71',
                  animation: 'pulse 2s ease infinite',
                }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: '#333' }}>En vivo</span>
              </div>
            )}

            {/* No location overlay */}
            {(!latestLocation || latestLocation.lat == null || latestLocation.lng == null || latestLocation.lat === 0) && (
              <div style={{
                position: 'absolute',
                top: 12,
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(255,255,255,0.9)',
                borderRadius: 8,
                padding: '8px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                zIndex: 10,
              }}>
                <MapPin size={16} color="#999" />
                <span style={{ fontSize: 12, fontWeight: 500, color: '#666' }}>
                  Esperando ubicacion del repartidor...
                </span>
              </div>
            )}

            <iframe
              key={latestLocation ? `${latestLocation.lat}-${latestLocation.lng}` : 'default'}
              src={getMapUrl()}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                display: 'block',
              }}
              title="Mapa de seguimiento"
              loading="lazy"
            />
          </div>

          {/* Footer Panel */}
          <div style={{
            flexShrink: 0,
            background: 'var(--white)',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
            zIndex: 10,
          }}>
            {/* Drag handle */}
            <button
              onClick={() => setFooterExpanded(prev => !prev)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                padding: '10px 16px 6px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <div style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                background: 'var(--border)',
                marginBottom: 2,
              }} />
            </button>

            <div style={{
              maxHeight: footerExpanded ? 300 : 0,
              overflow: 'hidden',
              transition: 'max-height 0.3s ease',
            }}>
              <div style={{ padding: '0 16px 16px' }}>
                {/* Delivery Info */}
                {delivery ? (
                  <div style={{
                    background: 'var(--input-bg)',
                    borderRadius: 12,
                    padding: 14,
                    marginBottom: 10,
                  }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10,
                    }}>
                      <User size={14} color="#1ABC9C" />
                      <p style={{
                        fontSize: 11, fontWeight: 700, color: '#1ABC9C',
                        textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0,
                      }}>
                        Tu repartidor
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: '50%',
                        background: '#1ABC9C15',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <User size={20} color="#1ABC9C" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', margin: 0 }}>
                          {delivery.name || 'Repartidor asignado'}
                        </p>
                        {delivery.phone && (
                          <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '1px 0 0' }}>
                            {delivery.phone}
                          </p>
                        )}
                      </div>
                      {delivery.phone && (
                        <button
                          onClick={() => callDelivery(delivery.phone)}
                          style={{
                            width: 40, height: 40, borderRadius: '50%',
                            background: '#1ABC9C',
                            border: 'none',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer',
                            flexShrink: 0,
                          }}
                        >
                          <Phone size={18} color="var(--white)" />
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div style={{
                    background: 'var(--input-bg)',
                    borderRadius: 12,
                    padding: 14,
                    marginBottom: 10,
                    textAlign: 'center',
                  }}>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>
                      Aun no se ha asignado un repartidor
                    </p>
                  </div>
                )}

                {/* Address */}
                {order.customerAddr && (
                  <div style={{
                    background: 'var(--input-bg)',
                    borderRadius: 12,
                    padding: 14,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                  }}>
                    <MapPin size={16} color="#E74C3C" style={{ flexShrink: 0, marginTop: 2 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontSize: 11, fontWeight: 700, color: '#E74C3C',
                        textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px',
                      }}>
                        Direccion de entrega
                      </p>
                      <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.4, margin: 0 }}>
                        {order.customerAddr}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
      `}</style>
    </div>
  );
}
