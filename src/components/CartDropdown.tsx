'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { X, Plus, Minus, Trash2, ShoppingCart, ShoppingBag } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface CartDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
}

export default function CartDropdown({ isOpen, onClose, anchorRef }: CartDropdownProps) {
  const { user } = useAuth();
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [cart, setCart] = useState<any[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const loadCart = () => {
      try {
        const items: any[] = JSON.parse(localStorage.getItem('joshop_cart') || '[]');
        setCart(items);
        setTotal(items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0));
      } catch {
        setCart([]);
        setTotal(0);
      }
    };
    loadCart();
    window.addEventListener('cartUpdated', loadCart);
    window.addEventListener('storage', loadCart);
    return () => {
      window.removeEventListener('cartUpdated', loadCart);
      window.removeEventListener('storage', loadCart);
    };
  }, []);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose, anchorRef]);

  const updateQuantity = (index: number, delta: number) => {
    try {
      const items: any[] = JSON.parse(localStorage.getItem('joshop_cart') || '[]');
      if (items[index]) {
        items[index].quantity = Math.max(1, (items[index].quantity || 1) + delta);
        localStorage.setItem('joshop_cart', JSON.stringify(items));
        window.dispatchEvent(new Event('cartUpdated'));
      }
    } catch { /* ignore */ }
  };

  const removeItem = (index: number) => {
    try {
      const items: any[] = JSON.parse(localStorage.getItem('joshop_cart') || '[]');
      items.splice(index, 1);
      localStorage.setItem('joshop_cart', JSON.stringify(items));
      window.dispatchEvent(new Event('cartUpdated'));
    } catch { /* ignore */ }
  };

  const clearCart = () => {
    localStorage.setItem('joshop_cart', '[]');
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const goTo = (path: string) => {
    onClose();
    router.push(path);
  };

  const handleCheckout = () => {
    if (!user) {
      localStorage.setItem('joshop_redirect_after_login', '/');
      onClose();
      router.push('/login');
      return;
    }
    goTo('/checkout');
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop for mobile */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.2)',
        }}
      />

      {/* Dropdown panel */}
      <div
        ref={dropdownRef}
        className="animate-fade-in"
        style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: 8,
          width: 360,
          maxWidth: 'calc(100vw - 32px)',
          background: '#FFFFFF',
          borderRadius: 16,
          boxShadow: '0 20px 60px rgba(0,0,0,0.15), 0 4px 16px rgba(0,0,0,0.08)',
          zIndex: 250,
          overflow: 'hidden',
          border: '1px solid var(--border)',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '16px 18px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--input-bg)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'var(--primary-gradient)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ShoppingBag size={16} color="white" />
            </div>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
                Mi Carrito
              </h3>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                {cart.length} {cart.length === 1 ? 'producto' : 'productos'}
              </p>
            </div>
          </div>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              style={{
                background: '#FFE8E8', border: 'none',
                color: '#FF6B6B', cursor: 'pointer',
                padding: '5px 10px', borderRadius: 8,
                fontSize: 11, fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 4,
              }}
            >
              <Trash2 size={12} /> Vaciar
            </button>
          )}
        </div>

        {/* Cart items */}
        <div style={{
          maxHeight: 320,
          overflowY: 'auto',
          padding: '8px 0',
        }}>
          {cart.length === 0 ? (
            <div style={{
              padding: '36px 20px',
              textAlign: 'center',
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: 'var(--input-bg)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 12,
              }}>
                <ShoppingCart size={24} color="var(--text-light)" />
              </div>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
                Tu carrito esta vacio
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                Agrega productos para comenzar
              </p>
            </div>
          ) : (
            cart.map((item: any, index: number) => (
              <div
                key={item.id || index}
                style={{
                  padding: '10px 18px',
                  display: 'flex',
                  gap: 12,
                  alignItems: 'center',
                  borderBottom: index < cart.length - 1 ? '1px solid var(--input-bg)' : 'none',
                }}
              >
                {/* Product image */}
                <div style={{
                  width: 48, height: 48, borderRadius: 10,
                  background: 'var(--input-bg)',
                  overflow: 'hidden', flexShrink: 0,
                }}>
                  {item.image || item.thumbnail || item.image_url ? (
                    <img
                      src={item.image || item.thumbnail || item.image_url}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      height: '100%', fontSize: 20,
                    }}>
                      📦
                    </div>
                  )}
                </div>

                {/* Product info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontSize: 13, fontWeight: 600, color: 'var(--text)',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {item.name || item.nombre}
                  </p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--primary)', marginTop: 2 }}>
                    {formatPrice(item.price * (item.quantity || 1))}
                  </p>
                </div>

                {/* Quantity controls */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 2,
                  background: 'var(--input-bg)', borderRadius: 8,
                  padding: '2px',
                }}>
                  <button
                    onClick={() => updateQuantity(index, -1)}
                    style={{
                      width: 28, height: 28, borderRadius: 6,
                      border: 'none', background: 'white',
                      cursor: 'pointer', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      color: 'var(--text)',
                    }}
                  >
                    <Minus size={14} />
                  </button>
                  <span style={{
                    fontSize: 13, fontWeight: 700, color: 'var(--text)',
                    minWidth: 20, textAlign: 'center',
                  }}>
                    {item.quantity || 1}
                  </span>
                  <button
                    onClick={() => updateQuantity(index, 1)}
                    style={{
                      width: 28, height: 28, borderRadius: 6,
                      border: 'none', background: 'white',
                      cursor: 'pointer', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      color: 'var(--text)',
                    }}
                  >
                    <Plus size={14} />
                  </button>
                </div>

                {/* Remove button */}
                <button
                  onClick={() => removeItem(index)}
                  style={{
                    width: 28, height: 28, borderRadius: 6,
                    border: 'none', background: '#FFE8E8',
                    cursor: 'pointer', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    color: '#FF6B6B', flexShrink: 0,
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div style={{
            padding: '14px 18px',
            borderTop: '1px solid var(--border)',
            background: 'var(--input-bg)',
          }}>
            {/* Total */}
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: 12,
            }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Total</span>
              <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--primary)' }}>
                {formatPrice(total)}
              </span>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => goTo('/cart')}
                style={{
                  flex: 1, padding: '11px 0', borderRadius: 10,
                  border: '2px solid var(--border)', background: 'white',
                  color: 'var(--text)', cursor: 'pointer',
                  fontWeight: 600, fontSize: 13,
                  transition: 'all 0.2s',
                }}
              >
                Ver carrito
              </button>
              <button
                onClick={handleCheckout}
                style={{
                  flex: 1, padding: '11px 0', borderRadius: 10,
                  border: 'none',
                  background: 'var(--primary-gradient)',
                  color: 'white', cursor: 'pointer',
                  fontWeight: 700, fontSize: 13,
                  boxShadow: 'var(--shadow-accent)',
                  transition: 'all 0.2s',
                }}
              >
                Comprar
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
