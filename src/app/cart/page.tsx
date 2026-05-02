'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, ShoppingCart, ShoppingBag } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { formatPrice, getProductImage, showToast } from '@/lib/utils';
import Header from '@/components/Header';

const PLACEHOLDER_IMG = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiB2aWV3Qm94PSIwIDAgMjAwIDIwMCI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNmNWY1ZjUiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iI2NjYyIgZm9udC1zaXplPSIxNCI+U2luIGltYWdlbjwvdGV4dD48L3N2Zz4=';

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
  const { user, isLoading } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const isLoggedIn = !!user;

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

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', display: 'flex', flexDirection: 'column' }}>
      <Header title="Mi Carrito" />

      <div style={{ flex: 1, padding: '16px 16px 120px', maxWidth: 900, margin: '0 auto', width: '100%', overflowY: 'auto' }}>
        {cart.length === 0 ? (
          <div className="animate-fade-in" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{
              width: 90, height: 90, borderRadius: '50%',
              background: 'var(--primary-light)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 16,
            }}>
              <ShoppingCart size={40} color="var(--primary)" />
            </div>
            <p style={{
              fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 6,
            }}>
              Tu carrito está vacío
            </p>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24 }}>
              Agrega productos para comenzar
            </p>
            <button
              onClick={() => router.push('/')}
              style={{
                padding: '13px 32px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--primary-gradient)',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: 15,
                boxShadow: 'var(--shadow-accent)',
                transition: 'all 0.25s ease',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <ShoppingBag size={18} />
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
                    background: 'var(--white)',
                    borderRadius: 14,
                    padding: 14,
                    display: 'flex',
                    gap: 14,
                    boxShadow: 'var(--shadow)',
                  }}
                >
                  {/* Image */}
                  <div style={{
                    width: 72, height: 72, borderRadius: 10, background: 'var(--input-bg)',
                    overflow: 'hidden', flexShrink: 0,
                  }}>
                    {image ? (
                      <img src={image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { (e.currentTarget as HTMLImageElement).src = PLACEHOLDER_IMG; }} />
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
                      <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--primary)', marginTop: 2 }}>
                        {formatPrice(item.price * (item.quantity || 1))}
                      </p>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      {/* Quantity controls */}
                      <div style={{
                        display: 'flex', alignItems: 'center',
                        borderRadius: 8, overflow: 'hidden',
                        border: '1.5px solid var(--border)',
                      }}>
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          style={{
                            width: 34, height: 34, background: 'var(--input-bg)', border: 'none',
                            cursor: 'pointer', fontSize: 18, fontWeight: 600, color: 'var(--text)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'background 0.15s ease',
                          }}
                        >
                          −
                        </button>
                        <span style={{
                          width: 36, textAlign: 'center', fontSize: 14, fontWeight: 700,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          style={{
                            width: 34, height: 34, background: 'var(--input-bg)', border: 'none',
                            cursor: 'pointer', fontSize: 18, fontWeight: 600, color: 'var(--text)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'background 0.15s ease',
                          }}
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        style={{
                          background: 'none', border: 'none',
                          color: 'var(--danger)', cursor: 'pointer', padding: 4,
                          transition: 'opacity 0.15s ease',
                        }}
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
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: 'var(--white)',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          padding: 18,
          boxShadow: 'var(--shadow-xl)',
          zIndex: 50,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, maxWidth: 900, margin: '0 auto' }}>
            <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-secondary)' }}>
              Total ({cart.length} {cart.length === 1 ? 'producto' : 'productos'})
            </span>
            <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>
              {formatPrice(total)}
            </span>
          </div>
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            {isLoggedIn ? (
              <button
                onClick={() => router.push('/checkout')}
                style={{
                  width: '100%',
                  height: 50,
                  borderRadius: 12,
                  background: 'var(--primary-gradient)',
                  color: 'white',
                  fontSize: 16,
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow: 'var(--shadow-accent)',
                  transition: 'all 0.25s ease',
                }}
              >
                Realizar pedido
              </button>
            ) : (
              <button
                onClick={() => {
                  localStorage.setItem('joshop_redirect_after_login', '/checkout');
                  router.push('/login');
                }}
                style={{
                  width: '100%',
                  height: 50,
                  borderRadius: 12,
                  background: 'var(--primary-gradient)',
                  color: 'white',
                  fontSize: 16,
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow: 'var(--shadow-accent)',
                  transition: 'all 0.25s ease',
                }}
              >
                Inicia sesión para comprar
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
