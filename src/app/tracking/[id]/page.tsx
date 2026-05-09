'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, User, Phone, Package } from 'lucide-react';
import api, { extractItem, extractData } from '@/lib/api';
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
  const { isConnected, subscribeToOrderChannel } = usePusher();

  const [order, setOrder] = useState<any>(null);
  const [latestLocation, setLatestLocation] = useState<LocationPoint | null>(null);
  const [history, setHistory] = useState<LocationPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mapRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<any>(null);
  const mapInstanceRef = useRef<any>(null);

  // Inject leaflet CSS inline (avoids tracking-prevention blocking CDN)
  useEffect(() => {
    if (document.getElementById('leaflet-inline-css')) return;
    const style = document.createElement('style');
    style.id = 'leaflet-inline-css';
    style.textContent = `
.leaflet-container{width:100%;height:100%;position:relative;z-index:0}.leaflet-map-pane,.leaflet-tile,.leaflet-marker-icon,.leaflet-marker-shadow,.leaflet-tile-container,.leaflet-pane>svg,.leaflet-pane>canvas,.leaflet-zoom-box,.leaflet-image-layer,.leaflet-layer{position:absolute;left:0;top:0}.leaflet-container{overflow:hidden;-ms-touch-action:none;touch-action:none}.leaflet-tile,.leaflet-marker-icon,.leaflet-marker-shadow{-webkit-user-select:none;-moz-user-select:none;user-select:none}.leaflet-tile::selection{background:transparent}.leaflet-image-layer{z-index:1}.leaflet-pane{z-index:400}.leaflet-tile-pane{z-index:200}.leaflet-overlay-pane{z-index:400}.leaflet-shadow-pane{z-index:500}.leaflet-marker-pane{z-index:600}.leaflet-tooltip-pane{z-index:650}.leaflet-popup-pane{z-index:700}.leaflet-tile{filter:inherit;visibility:hidden}.leaflet-tile-loaded{visibility:inherit}.leaflet-zoom-box{width:0;height:0}.leaflet-tile-container img{max-width:none!important;max-height:none!important;display:block;position:absolute}.leaflet-container img.leaflet-tile{transform-origin:0 0}.leaflet-marker-icon{display:block}.leaflet-control{position:relative;z-index:800;pointer-events:visiblePainted;pointer-events:auto}.leaflet-top,.leaflet-bottom{position:absolute;z-index:1000;pointer-events:none}.leaflet-top{top:0}.leaflet-right{right:0}.leaflet-bottom{bottom:0}.leaflet-left{left:0}.leaflet-control{margin-left:10px;margin-top:10px}.leaflet-control-zoom{box-shadow:0 0 0 2px rgba(0,0,0,.2);border-radius:4px;background:#fff;border:1px solid #bfbfbf;width:36px;height:36px;line-height:34px;text-align:center;font-size:18px;color:#333;cursor:pointer}.leaflet-control-zoom a{width:100%;height:100%;display:block;text-decoration:none;color:inherit}.leaflet-control-zoom a:hover{background:#f4f4f4}.leaflet-control-attribution{background:#fff;background:rgba(255,255,255,.7);margin:0;padding:0 5px;font-size:11px;color:#333}.leaflet-control-attribution a{color:#0078A8}.leaflet-popup{position:absolute;text-align:center;margin-bottom:20px}.leaflet-popup-content-wrapper{padding:1px;text-align:left;border-radius:12px}.leaflet-popup-content{margin:13px 19px;line-height:1.4}.leaflet-popup-tip-container{width:40px;height:20px;position:relative;left:50%;margin-left:-20px;overflow:hidden;pointer-events:auto}.leaflet-popup-tip{width:17px;height:17px;padding:1px;margin:-10px auto 0;transform:rotate(45deg)}.leaflet-popup-close-button{position:absolute;top:0;right:0;padding:4px 4px 0 0;text-align:center;width:18px;height:14px;font:16px/14px Tahoma,Verdana,sans-serif;color:#c3c3c3;text-decoration:none;font-weight:bold;background:transparent}.leaflet-popup-close-button:hover{color:#999}.leaflet-div-icon{background:transparent;border:none}`;
    document.head.appendChild(style);
    return () => { style.remove(); };
  }, []);

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoading && !user) router.replace('/login');
  }, [user, isLoading, router]);

  // Fetch order details
  const fetchOrder = useCallback(async () => {
    if (!orderId) return;
    try {
      const res = await api.get(`/orders/${orderId}`);
      setOrder(extractItem(res) || extractData(res));
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

  // Fetch location history
  const fetchHistory = useCallback(async () => {
    if (!orderId) return;
    try {
      const res = await api.get(`/tracking/${orderId}/history`);
      const data = extractData(res) || res;
      setHistory(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('[tracking] Error fetching history:', err);
    }
  }, [orderId]);

  // Initial data load
  useEffect(() => {
    if (!user || !orderId) return;
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchOrder(), fetchLatestLocation(), fetchHistory()]);
      setLoading(false);
    };
    load();
  }, [user, orderId, fetchOrder, fetchLatestLocation, fetchHistory]);

  // Subscribe to real-time location updates
  useEffect(() => {
    if (!isConnected || !orderId || !user) return;

    const unsub = subscribeToOrderChannel(orderId);

    const onLocationUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail) {
        console.log('[tracking] Location update:', detail);
        setLatestLocation(detail);
        setHistory(prev => {
          const exists = prev.some((p: any) => p.id === detail.id);
          if (exists) return prev;
          return [...prev, detail];
        });
      }
    };

    window.addEventListener('pusher:location-update', onLocationUpdate);
    return () => {
      window.removeEventListener('pusher:location-update', onLocationUpdate);
      if (unsub) unsub();
    };
  }, [isConnected, orderId, user, subscribeToOrderChannel]);

  // Initialize map when location is available
  useEffect(() => {
    if (!latestLocation || !mapRef.current) return;
    if (latestLocation.lat == null || latestLocation.lng == null) return;

    const initMap = async () => {
      try {
        // Dynamic import to avoid SSR issues
        const L = (await import('leaflet')).default;

        // Only init map once
        if (!mapInstanceRef.current) {
          mapInstanceRef.current = L.map(mapRef.current!, {
            zoomControl: true,
            attributionControl: true,
          }).setView([latestLocation.lat, latestLocation.lng], 15);

          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
          }).addTo(mapInstanceRef.current);
        } else {
          mapInstanceRef.current.setView([latestLocation.lat, latestLocation.lng]);
        }

        // Update or create marker
        if (markerRef.current) {
          markerRef.current.setLatLng([latestLocation.lat, latestLocation.lng]);
        } else {
          // Custom delivery icon
          const deliveryIcon = L.divIcon({
            html: `<div style="width:40px;height:40px;background:#3498DB;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="3"/><path d="M12 2v4m0 12v4m-7.07-3.93 2.83-2.83m8.48-8.48 2.83-2.83M2 12h4m12 0h4M4.93 4.93l2.83 2.83m8.48 8.48 2.83 2.83"/>
              </svg>
            </div>`,
            className: '',
            iconSize: [40, 40],
            iconAnchor: [20, 20],
          });

          markerRef.current = L.marker([latestLocation.lat, latestLocation.lng], { icon: deliveryIcon })
            .addTo(mapInstanceRef.current)
            .bindPopup('<b>Repartidor</b>');
        }

        // Force map to recalculate size
        setTimeout(() => {
          mapInstanceRef.current?.invalidateSize();
        }, 200);
      } catch (err) {
        console.error('[tracking] Error initializing map:', err);
      }
    };

    initMap();
  }, [latestLocation]);

  // Cleanup map on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  const delivery = order?.delivery || order?.Delivery || null;
  const status = order?.status || 'pending';

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
    <div style={{ minHeight: '100vh', background: 'var(--background)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '16px 16px',
        background: 'var(--primary-gradient)',
        color: 'var(--white)',
        flexShrink: 0,
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
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 16px' }}>
              No se pudo cargar la informacion de esta orden
            </p>
            <button
              onClick={() => router.push('/my-orders')}
              style={{
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
          {/* Map Container */}
          <div style={{
            width: '100%',
            height: 280,
            position: 'relative',
            flexShrink: 0,
            background: '#e5e7eb',
          }}>
            {latestLocation ? (
              <>
                <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
                {/* Map overlay with live indicator */}
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
                  zIndex: 1000,
                }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: '#2ECC71',
                    animation: 'pulse 2s ease infinite',
                  }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#333' }}>En vivo</span>
                </div>
              </>
            ) : (
              <div style={{
                width: '100%', height: '100%',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 8,
              }}>
                <MapPin size={40} color="#ccc" />
                <p style={{ fontSize: 14, color: '#999', margin: 0 }}>
                  Ubicacion no disponible
                </p>
                <p style={{ fontSize: 12, color: '#bbb', margin: 0 }}>
                  El repartidor aun no ha compartido su ubicacion
                </p>
              </div>
            )}
          </div>

          {/* Info Cards */}
          <div style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>

            {/* Delivery Info Card */}
            {delivery ? (
              <div style={{
                background: 'var(--white)',
                borderRadius: 14,
                padding: 16,
                boxShadow: 'var(--shadow)',
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12,
                }}>
                  <User size={16} color="#1ABC9C" />
                  <p style={{
                    fontSize: 12, fontWeight: 700, color: '#1ABC9C',
                    textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0,
                  }}>
                    Tu repartidor
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: '50%',
                    background: '#1ABC9C15',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <User size={24} color="#1ABC9C" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', margin: 0 }}>
                      {delivery.name || 'Repartidor asignado'}
                    </p>
                    {delivery.phone && (
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                        {delivery.phone}
                      </p>
                    )}
                  </div>
                </div>
                {delivery.phone && (
                  <button
                    onClick={() => callDelivery(delivery.phone)}
                    style={{
                      width: '100%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      padding: '12px 16px',
                      borderRadius: 10,
                      border: 'none',
                      background: '#1ABC9C',
                      color: 'var(--white)',
                      fontSize: 14, fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      fontFamily: 'inherit',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#16A085'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#1ABC9C'; }}
                  >
                    <Phone size={18} />
                    Llamar repartidor
                  </button>
                )}
              </div>
            ) : (
              <div style={{
                background: 'var(--white)',
                borderRadius: 14,
                padding: 16,
                boxShadow: 'var(--shadow)',
                textAlign: 'center',
              }}>
                <User size={32} color="var(--text-light)" style={{ marginBottom: 8 }} />
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
                  Aun no se ha asignado un repartidor
                </p>
              </div>
            )}

            {/* Address Card */}
            {order.customerAddr && (
              <div style={{
                background: 'var(--white)',
                borderRadius: 14,
                padding: 16,
                boxShadow: 'var(--shadow)',
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8,
                }}>
                  <MapPin size={16} color="#E74C3C" />
                  <p style={{
                    fontSize: 12, fontWeight: 700, color: '#E74C3C',
                    textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0,
                  }}>
                    Direccion de entrega
                  </p>
                </div>
                <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5, margin: 0 }}>
                  {order.customerAddr}
                </p>
              </div>
            )}

            {/* Padding bottom for safe area */}
            <div style={{ height: 24 }} />
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
