'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, ShoppingBag, LogOut, Menu } from 'lucide-react';
import SidebarMenu from '@/components/SidebarMenu';
import { formatPrice, showToast } from '@/lib/utils';
import api from '@/lib/api';

export default function CheckoutPage() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const [cart, setCart] = useState<any[]>([]);
  const [placing, setPlacing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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

  const total = cart.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);

  const placeOrder = async () => {
    if (cart.length === 0 || placing) return;
    setPlacing(true);
    try {
      const items = cart.map(item => ({
        id: item.id,
        name: item.name || item.title,
        price: item.price,
        quantity: item.quantity,
      }));
      // Get user data from auth
      const auth = JSON.parse(localStorage.getItem('joshop_auth') || '{}');
      const user = auth?.user || {};
      const total = cart.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);
      await api.post('/orders', {
        customer: {
          name: user.name || '',
          phone: user.phone || '',
        },
        items,
        total,
        totalItems: cart.length,
      });
      showToast('Pedido realizado con exito!', 'success');
      localStorage.removeItem('joshop_cart');
      window.dispatchEvent(new Event('cartUpdated'));
      router.push('/my-orders');
    } catch (err: any) {
      showToast(err?.message || 'Error al realizar el pedido', 'error');
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

      <div style={{ padding: '16px 16px 140px', maxWidth: 900, margin: '0 auto' }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Resumen del pedido</h2>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {cart.map(item => (
              <div key={item.id} style={{
                background: 'var(--white)', borderRadius: 14, padding: 14,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                boxShadow: 'var(--shadow)',
              }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600 }}>{item.name || 'Producto'}</p>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Qty: {item.quantity}</p>
                </div>
                <p style={{ fontSize: 15, fontWeight: 700 }}>{formatPrice(item.price * item.quantity)}</p>
              </div>
            ))}
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
