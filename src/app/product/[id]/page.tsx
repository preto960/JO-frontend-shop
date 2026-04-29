'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, ShoppingCart, ShoppingBag } from 'lucide-react';
import api from '@/lib/api';
import Header from '@/components/Header';

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
      <Header title={name} showBack onBack={() => router.push('/')} showLogout={false} />

      <div style={{ padding: '0 0 100px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <div style={{ width: 36, height: 36, border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          </div>
        ) : !product ? (
          <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-secondary)' }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%', background: 'var(--input-bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <ShoppingBag size={36} style={{ color: 'var(--text-light)' }} />
            </div>
            <p style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>Producto no encontrado</p>
            <p style={{ fontSize: 14 }}>El producto que buscas no existe o fue eliminado</p>
          </div>
        ) : (
          <div className="animate-fade-in">
            {/* Product image */}
            <div style={{
              width: '100%', height: 340, background: 'var(--input-bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
              position: 'relative',
            }}>
              {image ? (
                <img
                  src={image}
                  alt={name}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              ) : (
                <div style={{ color: 'var(--text-light)' }}>
                  <ShoppingBag size={80} />
                </div>
              )}
              {!inStock && (
                <div style={{
                  position: 'absolute', top: 16, right: 16,
                  background: 'var(--danger)', color: 'white',
                  padding: '6px 14px', borderRadius: 'var(--radius-full)',
                  fontSize: 12, fontWeight: 700,
                }}>
                  Agotado
                </div>
              )}
            </div>

            {/* Product details card */}
            <div style={{
              padding: 24, background: 'var(--white)',
              borderTopLeftRadius: 24, borderTopRightRadius: 24,
              marginTop: -24, position: 'relative',
              boxShadow: 'var(--shadow-lg)',
            }}>
              {/* Price + Name */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, gap: 16 }}>
                <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', flex: 1, lineHeight: 1.3 }}>
                  {name}
                </h1>
                <span style={{
                  fontSize: 26, fontWeight: 800, color: 'var(--primary)', whiteSpace: 'nowrap',
                  background: 'var(--primary-light)', padding: '6px 14px', borderRadius: 'var(--radius)',
                }}>
                  {formatPrice(price)}
                </span>
              </div>

              {/* Category badge */}
              {product?.category && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  background: 'var(--input-bg)', color: 'var(--text-secondary)',
                  padding: '6px 14px', borderRadius: 'var(--radius-full)',
                  fontSize: 13, fontWeight: 500, marginBottom: 16,
                }}>
                  {typeof product.category === 'object' ? (product.category.name || product.category.nombre) : product.category}
                </span>
              )}

              {/* Description */}
              {desc && (
                <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 20 }}>
                  {desc}
                </p>
              )}

              {/* Stock */}
              {product?.stock !== undefined && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 16px', borderRadius: 'var(--radius)',
                  background: inStock ? 'var(--success-light)' : 'var(--danger-light)',
                  marginBottom: 24,
                }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: inStock ? 'var(--success)' : 'var(--danger)',
                  }} />
                  <span style={{
                    fontSize: 14, fontWeight: 500,
                    color: inStock ? '#155724' : '#CC3333',
                  }}>
                    {inStock ? `En stock (${product.stock} disponibles)` : 'Agotado'}
                  </span>
                </div>
              )}

              {/* Add to cart button */}
              <button
                onClick={addToCart}
                disabled={!inStock}
                style={{
                  width: '100%', padding: '16px', borderRadius: 14,
                  background: inStock ? 'var(--primary-gradient)' : 'var(--input-bg)',
                  color: 'white', fontSize: 16, fontWeight: 700,
                  border: 'none', cursor: inStock ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  boxShadow: inStock ? 'var(--shadow-accent)' : 'none',
                  opacity: inStock ? 1 : 0.6,
                  transition: 'all 0.25s ease',
                }}
              >
                <ShoppingCart size={22} />
                {inStock ? 'Agregar al carrito' : 'Producto agotado'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
