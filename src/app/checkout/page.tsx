'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, ShoppingBag, LogOut, Menu, MapPin, FileText } from 'lucide-react';
import SidebarMenu from '@/components/SidebarMenu';
import { formatPrice, showToast } from '@/lib/utils';
import api from '@/lib/api';

export default function CheckoutPage() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const [cart, setCart] = useState<any[]>([]);
  const [placing, setPlacing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Address fields
  const [addresses, setAddresses] = useState<any[]>([]);
  const [addressesLoaded, setAddressesLoaded] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [addressMode, setAddressMode] = useState<'saved' | 'manual'>('saved');
  const [manualAddress, setManualAddress] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!isLoading && !user) {
      localStorage.setItem('joshop_redirect_after_login', '/checkout');
      router.replace('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    try {
      setCart(JSON.parse(localStorage.getItem('joshop_cart') || '[]'));
    } catch { setCart([]); }
  }, []);

  // Load user addresses
  useEffect(() => {
    const loadAddresses = async () => {
      try {
        const res = await api.get('/addresses');
        const list = res?.data || res || [];
        if (Array.isArray(list)) {
          setAddresses(list);
          // Auto-select default address
          const defaultAddr = list.find((a: any) => a.isDefault);
          if (defaultAddr) setSelectedAddressId(defaultAddr.id);
          else if (list.length > 0) setSelectedAddressId(list[0].id);
          if (list.length === 0) setAddressMode('manual');
        }
      } catch {
        // No addresses or error, use manual mode
        setAddressMode('manual');
      } finally {
        setAddressesLoaded(true);
      }
    };
    if (user) loadAddresses();
  }, [user]);

  const total = cart.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);

  const getSelectedAddress = () => addresses.find(a => a.id === selectedAddressId);

  const placeOrder = async () => {
    if (cart.length === 0 || placing) return;

    // Validate address
    let deliveryAddress = '';
    let addrId: number | null = null;

    if (addressMode === 'saved' && selectedAddressId) {
      const addr = getSelectedAddress();
      deliveryAddress = addr?.address || '';
      addrId = selectedAddressId;
    } else {
      deliveryAddress = manualAddress.trim();
    }

    if (!deliveryAddress) {
      showToast('Por favor selecciona o ingresa una direccion de entrega', 'error');
      return;
    }

    setPlacing(true);
    try {
      const items = cart.map(item => ({
        id: item.id,
        name: item.name || item.title,
        price: item.price,
        quantity: item.quantity,
      }));
      const auth = JSON.parse(localStorage.getItem('joshop_auth') || '{}');
      const authUser = auth?.user || {};
      const orderTotal = cart.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);

      await api.post('/orders', {
        customer: {
          name: authUser.name || '',
          phone: authUser.phone || '',
          address: deliveryAddress,
          notes: notes.trim() || undefined,
        },
        items,
        total: orderTotal,
        totalItems: cart.length,
        addressId: addrId,
      });
      showToast('Pedido realizado con exito!', 'success');
      localStorage.removeItem('joshop_cart');
      window.dispatchEvent(new Event('cartUpdated'));
      router.push('/my-orders');
    } catch (err: any) {
      showToast(err?.error || err?.message || 'Error al realizar el pedido', 'error');
    } finally {
      setPlacing(false);
    }
  };

  if (isLoading || !user) return null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
      {/* Header */}
      <header style={{
        background: 'var(--primary-gradient)', color: 'var(--white)',
        padding: '0 16px', height: 60, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        position: 'sticky', top: 0, zIndex: 100,
        boxShadow: 'var(--shadow-accent)',
      }}>
        <div style={{ position: 'absolute', left: 16, display: 'flex', gap: 4 }}>
          <button onClick={() => router.back()} style={{
            background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white',
            cursor: 'pointer', width: 40, height: 40, borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><ArrowLeft size={22} /></button>
        </div>
        <h1 style={{ fontSize: 18, fontWeight: 700, zIndex: 1 }}>Confirmar Pedido</h1>
        <div style={{ position: 'absolute', right: 16, display: 'flex', gap: 8, zIndex: 1 }}>
          <button onClick={logout} style={{
            background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white',
            cursor: 'pointer', width: 40, height: 40, borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><LogOut size={20} /></button>
        </div>
      </header>
      <SidebarMenu open={menuOpen} onClose={() => setMenuOpen(false)} />

      <div style={{ padding: '16px 16px 160px', maxWidth: 900, margin: '0 auto' }}>
        {cart.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <ShoppingBag size={48} style={{ color: 'var(--text-light)', margin: '0 auto 16px' }} />
            <p style={{ fontSize: 18, fontWeight: 700 }}>Tu carrito esta vacio</p>
            <button onClick={() => router.push('/')} style={{
              marginTop: 16, padding: '12px 28px', borderRadius: 'var(--radius-full)',
              background: 'var(--primary-gradient)', color: 'white', border: 'none',
              cursor: 'pointer', fontWeight: 700, boxShadow: 'var(--shadow-accent)',
            }}>Explorar productos</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* ─── Address Section ─── */}
            <div style={{
              background: 'var(--white)', borderRadius: 14, padding: 16,
              boxShadow: 'var(--shadow)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10, background: 'var(--primary-light)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <MapPin size={18} style={{ color: 'var(--primary)' }} />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>Direccion de entrega</h3>
              </div>

              {/* Mode toggle */}
              {addresses.length > 0 && (
                <div style={{
                  display: 'flex', gap: 8, marginBottom: 12,
                  background: 'var(--input-bg)', borderRadius: 10, padding: 4,
                }}>
                  <button onClick={() => setAddressMode('saved')} style={{
                    flex: 1, padding: '8px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                    border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                    background: addressMode === 'saved' ? 'var(--white)' : 'transparent',
                    color: addressMode === 'saved' ? 'var(--text)' : 'var(--text-secondary)',
                    boxShadow: addressMode === 'saved' ? 'var(--shadow)' : 'none',
                  }}>Direccion guardada</button>
                  <button onClick={() => setAddressMode('manual')} style={{
                    flex: 1, padding: '8px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                    border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                    background: addressMode === 'manual' ? 'var(--white)' : 'transparent',
                    color: addressMode === 'manual' ? 'var(--text)' : 'var(--text-secondary)',
                    boxShadow: addressMode === 'manual' ? 'var(--shadow)' : 'none',
                  }}>Ingresar direccion</button>
                </div>
              )}

              {/* Saved address selector */}
              {addressMode === 'saved' && addresses.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {addresses.map((addr) => (
                    <button key={addr.id} onClick={() => setSelectedAddressId(addr.id)} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 14px', borderRadius: 10, width: '100%',
                      background: selectedAddressId === addr.id ? 'var(--primary-light)' : 'var(--input-bg)',
                      border: selectedAddressId === addr.id ? '2px solid var(--primary)' : '2px solid transparent',
                      cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
                    }}>
                      <div style={{
                        width: 20, height: 20, borderRadius: '50%',
                        border: selectedAddressId === addr.id ? '6px solid var(--primary)' : '2px solid var(--border)',
                        flexShrink: 0, transition: 'all 0.2s',
                      }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{addr.label}</p>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {addr.address}
                        </p>
                        {addr.details && (
                          <p style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 1 }}>{addr.details}</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Manual address input */}
              {addressMode === 'manual' && (
                <textarea
                  value={manualAddress}
                  onChange={(e) => setManualAddress(e.target.value)}
                  placeholder="Escribe tu direccion de entrega..."
                  rows={3}
                  style={{
                    width: '100%', padding: '12px 14px', borderRadius: 10,
                    border: '2px solid var(--border)', fontSize: 14, resize: 'vertical',
                    background: 'var(--input-bg)', color: 'var(--text)',
                    fontFamily: 'inherit', boxSizing: 'border-box',
                    outline: 'none',
                  }}
                  onFocus={(e) => { e.target.style.borderColor = 'var(--primary)'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; }}
                />
              )}
            </div>

            {/* ─── Notes Section ─── */}
            <div style={{
              background: 'var(--white)', borderRadius: 14, padding: 16,
              boxShadow: 'var(--shadow)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10, background: 'var(--info-light)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <FileText size={18} style={{ color: 'var(--info)' }} />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>Notas de entrega</h3>
              </div>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej: Piso 3, apto B, porton azul..."
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: 10,
                  border: '2px solid var(--border)', fontSize: 14,
                  background: 'var(--input-bg)', color: 'var(--text)',
                  boxSizing: 'border-box', outline: 'none',
                }}
                onFocus={(e) => { e.target.style.borderColor = 'var(--primary)'; }}
                onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; }}
              />
            </div>

            {/* ─── Order Summary ─── */}
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Resumen del pedido</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {cart.map(item => (
                  <div key={item.id} style={{
                    background: 'var(--white)', borderRadius: 14, padding: 14,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    boxShadow: 'var(--shadow)',
                  }}>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 600 }}>{item.name || 'Producto'}</p>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Cant.: {item.quantity}</p>
                    </div>
                    <p style={{ fontSize: 15, fontWeight: 700 }}>{formatPrice(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {cart.length > 0 && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: 'var(--white)', borderTopLeftRadius: 20, borderTopRightRadius: 20,
          padding: 18, boxShadow: 'var(--shadow-xl)', zIndex: 50,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14, maxWidth: 900, margin: '0 auto' }}>
            <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-secondary)' }}>Total</span>
            <span style={{ fontSize: 20, fontWeight: 800 }}>{formatPrice(total)}</span>
          </div>
          <button onClick={placeOrder} disabled={placing} style={{
            width: '100%', height: 50, borderRadius: 12,
            background: placing ? 'var(--primary-hover)' : 'var(--primary-gradient)',
            color: 'white', fontSize: 16, fontWeight: 700, border: 'none',
            cursor: placing ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: 'var(--shadow-accent)', opacity: placing ? 0.8 : 1, maxWidth: 900, margin: '0 auto',
          }}>
            {placing ? 'Procesando...' : 'Confirmar pedido'}
          </button>
        </div>
      )}
    </div>
  );
}
