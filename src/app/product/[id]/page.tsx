'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, ShoppingCart } from 'lucide-react';
import api from '@/lib/api';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { formatPrice, getProductImage, showToast } from '@/lib/utils';

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchProduct = async () => {
      try {
        const res = await api.get(`/products/${id}`);
        const data = (res as any).data || (res as any).product || res;
        setProduct(data);
      } catch {
        showToast('Error al cargar el producto', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const addToCart = () => {
    if (!product) return;
    try {
      const cart: any[] = JSON.parse(localStorage.getItem('joshop_cart') || '[]');
      const idx = cart.findIndex((item: any) => item.id === product.id);
      if (idx >= 0) {
        cart[idx].quantity = (cart[idx].quantity || 1) + 1;
      } else {
        cart.push({ ...product, quantity: 1 });
      }
      localStorage.setItem('joshop_cart', JSON.stringify(cart));
      window.dispatchEvent(new Event('cartUpdated'));
      showToast('Producto agregado al carrito', 'success');
    } catch {
      showToast('Error al agregar al carrito', 'error');
    }
  };

  const image = getProductImage(product);
  const price = product?.price ?? product?.precio ?? 0;
  const name = product?.name || product?.nombre || 'Sin nombre';
  const desc = product?.description || product?.descripcion || '';
  const inStock = product?.stock === undefined || product?.stock > 0;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <Header title={name} showBack onBack={() => router.push('/home')} showLogout={false} />

      <div style={{ padding: '0 0 80px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <div style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          </div>
        ) : !product ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-secondary)' }}>
            <p style={{ fontSize: 48, marginBottom: 12 }}>😕</p>
            <p>Producto no encontrado</p>
          </div>
        ) : (
          <div className="animate-fade-in">
            {/* Product image */}
            <div style={{
              width: '100%', height: 320, background: 'var(--input-bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
            }}>
              {image ? (
                <img
                  src={image}
                  alt={name}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              ) : (
                <div style={{ color: 'var(--text-light)' }}>
                  <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" />
                  </svg>
                </div>
              )}
            </div>

            {/* Product details */}
            <div style={{ padding: 20, background: 'var(--white)', borderTopLeftRadius: 20, borderTopRightRadius: 20, marginTop: -20, position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', flex: 1, marginRight: 12 }}>
                  {name}
                </h1>
                <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent)', whiteSpace: 'nowrap' }}>
                  {formatPrice(price)}
                </span>
              </div>

              {product?.category && (
                <span style={{
                  display: 'inline-block', background: 'var(--input-bg)', color: 'var(--text-secondary)',
                  padding: '4px 12px', borderRadius: 12, fontSize: 12, marginBottom: 12,
                }}>
                  {typeof product.category === 'object' ? (product.category.name || product.category.nombre) : product.category}
                </span>
              )}

              {desc && (
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 20 }}>
                  {desc}
                </p>
              )}

              {product?.stock !== undefined && (
                <p style={{
                  fontSize: 13, color: inStock ? 'var(--success)' : 'var(--accent)',
                  marginBottom: 20, fontWeight: 500,
                }}>
                  {inStock ? `En stock (${product.stock} disponibles)` : 'Agotado'}
                </p>
              )}

              <button
                onClick={addToCart}
                disabled={!inStock}
                style={{
                  width: '100%', padding: '14px', borderRadius: 12,
                  background: inStock ? 'var(--accent)' : 'var(--text-light)',
                  color: 'white', fontSize: 16, fontWeight: 600,
                  border: 'none', cursor: inStock ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => { if (inStock) e.currentTarget.style.background = 'var(--accent-light)'; }}
                onMouseLeave={(e) => { if (inStock) e.currentTarget.style.background = 'var(--accent)'; }}
              >
                <ShoppingCart size={20} />
                {inStock ? 'Agregar al carrito' : 'Producto agotado'}
              </button>
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
