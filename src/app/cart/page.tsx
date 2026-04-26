'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, ShoppingCart, LogOut } from 'lucide-react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { formatPrice, getProductImage, showToast } from '@/lib/utils';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  thumbnail?: string;
  image_url?: string;
}

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);

  const loadCart = () => {
    try {
      const stored = JSON.parse(localStorage.getItem('joshop_cart') || '[]');
      setCart(stored);
    } catch {
      setCart([]);
    }
  };

  useEffect(() => {
    loadCart();
    window.addEventListener('cartUpdated', loadCart);
    return () => window.removeEventListener('cartUpdated', loadCart);
  }, []);

  const updateQuantity = (id: string, delta: number) => {
    const updated = cart.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, (item.quantity || 1) + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    });
    setCart(updated);
    localStorage.setItem('joshop_cart', JSON.stringify(updated));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const removeItem = (id: string) => {
    const updated = cart.filter(item => item.id !== id);
    setCart(updated);
    localStorage.setItem('joshop_cart', JSON.stringify(updated));
    window.dispatchEvent(new Event('cartUpdated'));
    showToast('Producto eliminado del carrito', 'info');
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('joshop_cart');
    window.dispatchEvent(new Event('cartUpdated'));
    showToast('Carrito vaciado', 'info');
  };

  const total = cart.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);

  const placeOrder = async () => {
    if (cart.length === 0) return;
    try {
      const { default: api } = await import('@/lib/api');
      const items = cart.map(item => ({
        productId: item.id,
        quantity: item.quantity,
        price: item.price,
      }));
      await api.post('/orders', { items });
      showToast('¡Pedido realizado con éxito!', 'success');
      setCart([]);
      localStorage.removeItem('joshop_cart');
      window.dispatchEvent(new Event('cartUpdated'));
      router.push('/orders');
    } catch (err: any) {
      showToast(err?.message || 'Error al realizar el pedido', 'error');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', display: 'flex', flexDirection: 'column' }}>
      <Header
        title="Mi Carrito"
        showLogout={false}
        rightAction={
          cart.length > 0 ? (
            <button
              onClick={clearCart}
              style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: 4 }}
              aria-label="Vaciar carrito"
            >
              <Trash2 size={20} />
            </button>
          ) : undefined
        }
      />

      <div style={{ flex: 1, padding: '16px 16px 160px', overflowY: 'auto' }}>
        {cart.length === 0 ? (
          <div className="animate-fade-in" style={{ textAlign: 'center', padding: 60, color: 'var(--text-secondary)' }}>
            <p style={{ fontSize: 64, marginBottom: 12 }}>🛒</p>
            <p style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>Tu carrito está vacío</p>
            <p style={{ fontSize: 14, marginBottom: 20 }}>Agrega productos para comenzar</p>
            <button
              onClick={() => router.push('/home')}
              style={{
                padding: '12px 24px', borderRadius: 8, background: 'var(--accent)',
                color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14,
              }}
            >
              Explorar productos
            </button>
          </div>
        ) : (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {cart.map((item) => {
              const image = item.image || item.thumbnail || item.image_url || '';
              return (
                <div
                  key={item.id}
                  style={{
                    background: 'var(--white)', borderRadius: 12, padding: 12,
                    display: 'flex', gap: 12, boxShadow: 'var(--shadow)',
                  }}
                >
                  {/* Image */}
                  <div style={{
                    width: 80, height: 80, borderRadius: 8, background: 'var(--input-bg)',
                    overflow: 'hidden', flexShrink: 0,
                  }}>
                    {image ? (
                      <img src={image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-light)' }}>
                        <ShoppingCart size={24} />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0 }}>
                    <div>
                      <h3 style={{
                        fontSize: 14, fontWeight: 600, color: 'var(--text)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {item.name}
                      </h3>
                      <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent)', marginTop: 2 }}>
                        {formatPrice(item.price * (item.quantity || 1))}
                      </p>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      {/* Quantity controls */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 0, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          style={{
                            width: 32, height: 32, background: 'var(--input-bg)', border: 'none',
                            cursor: 'pointer', fontSize: 18, fontWeight: 600, color: 'var(--text)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          −
                        </button>
                        <span style={{
                          width: 36, textAlign: 'center', fontSize: 14, fontWeight: 600,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          style={{
                            width: 32, height: 32, background: 'var(--input-bg)', border: 'none',
                            cursor: 'pointer', fontSize: 18, fontWeight: 600, color: 'var(--text)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', padding: 4 }}
                        aria-label="Eliminar"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer with total */}
      {cart.length > 0 && (
        <div style={{
          position: 'fixed', bottom: 64, left: 0, right: 0,
          background: 'var(--white)', borderTop: '1px solid var(--border)',
          padding: '16px', boxShadow: '0 -2px 8px rgba(0,0,0,0.08)', zIndex: 50,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>
              Total ({cart.length} {cart.length === 1 ? 'producto' : 'productos'})
            </span>
            <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent)' }}>
              {formatPrice(total)}
            </span>
          </div>
          <button
            onClick={placeOrder}
            style={{
              width: '100%', padding: '14px', borderRadius: 12,
              background: 'var(--accent)', color: 'white',
              fontSize: 16, fontWeight: 700, border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            Realizar pedido
          </button>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
