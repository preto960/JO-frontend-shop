'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, Trash2, ShoppingBag, ShoppingCart } from 'lucide-react';
import { formatPrice, showToast } from '@/lib/utils';
import api from '@/lib/api';

interface FavProduct {
  id: string;
  name: string;
  price: number;
  discountPercent?: number;
  image?: string;
  thumbnail?: string;
  image_url?: string;
  imageUrl?: string;
  images?: any;
  category?: any;
  stock?: number;
  description?: string;
}

export default function FavoritesPage() {
  const router = useRouter();
  const [favorites, setFavorites] = useState<FavProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFavorites = async () => {
    try {
      const favIds: string[] = JSON.parse(localStorage.getItem('joshop_favorites') || '[]');
      if (favIds.length === 0) {
        setFavorites([]);
        setLoading(false);
        return;
      }
      const products: FavProduct[] = [];
      await Promise.all(
        favIds.map(async (id) => {
          try {
            const res = await api.get(`/products/${id}`);
            const data = (res as any).data || (res as any).product || res;
            if (data) products.push(data);
          } catch {}
        })
      );
      setFavorites(products);
    } catch {
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFavorites();
    const handler = () => loadFavorites();
    window.addEventListener('favoritesUpdated', handler);
    return () => window.removeEventListener('favoritesUpdated', handler);
  }, []);

  const removeFavorite = (productId: string) => {
    try {
      const favs: string[] = JSON.parse(localStorage.getItem('joshop_favorites') || '[]');
      const updated = favs.filter((f) => f !== productId);
      localStorage.setItem('joshop_favorites', JSON.stringify(updated));
      setFavorites((prev) => prev.filter((p) => p.id !== productId));
      showToast('Eliminado de favoritos', 'info');
      window.dispatchEvent(new Event('favoritesUpdated'));
    } catch {}
  };

  const addToCart = (product: FavProduct) => {
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
      showToast('Agregado al carrito', 'success');
    } catch {
      showToast('Error al agregar al carrito', 'error');
    }
  };

  const getImage = (p: FavProduct) => p.image || p.thumbnail || p.image_url || p.imageUrl || '';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
      {/* Header */}
      <div style={{
        background: 'var(--primary-gradient)',
        color: 'var(--white)',
        padding: '0 20px',
        height: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: 'var(--shadow-accent)',
      }}>
        <h1 style={{ fontSize: 18, fontWeight: 700 }}>Mis Favoritos</h1>
      </div>

      <div style={{ padding: '20px', maxWidth: 960, margin: '0 auto' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <div style={{ width: 36, height: 36, border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          </div>
        ) : favorites.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{
              width: 90, height: 90, borderRadius: '50%', background: 'var(--input-bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <Heart size={38} style={{ color: 'var(--text-light)' }} />
            </div>
            <p style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>
              No tienes favoritos aun
            </p>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24 }}>
              Explora productos y guardalos aqui para encontrarlos facilmente
            </p>
            <button
              onClick={() => router.push('/')}
              style={{
                padding: '12px 28px', borderRadius: 'var(--radius-full)',
                background: 'var(--primary-gradient)', color: 'white',
                fontSize: 15, fontWeight: 600, border: 'none', cursor: 'pointer',
                boxShadow: 'var(--shadow-accent)',
              }}
            >
              Explorar productos
            </button>
          </div>
        ) : (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 16,
          }}>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
              {favorites.length} {favorites.length === 1 ? 'producto' : 'productos'}
            </p>
          </div>
        )}

        {!loading && favorites.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 16,
          }}>
            {favorites.map((product) => {
              const price = product.price ?? 0;
              const discount = product.discountPercent ?? 0;
              const finalPrice = discount > 0 ? price * (1 - discount / 100) : price;
              const image = getImage(product);
              const name = product.name || 'Sin nombre';
              const inStock = product.stock === undefined || product.stock > 0;

              return (
                <div
                  key={product.id}
                  className="animate-fade-in"
                  style={{
                    background: 'var(--card)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                  }}
                  onClick={() => router.push(`/product/${product.id}`)}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow)'; }}
                >
                  <div style={{
                    width: '100%', height: 180, background: 'var(--input-bg)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                    position: 'relative',
                  }}>
                    {image ? (
                      <img src={image} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-light)' }}>
                        <ShoppingBag size={40} strokeWidth={1.2} />
                      </div>
                    )}
                    {discount > 0 && (
                      <div style={{
                        position: 'absolute', top: 10, left: 10,
                        background: 'var(--accent)', color: 'white',
                        fontSize: 11, fontWeight: 700,
                        padding: '3px 10px', borderRadius: 'var(--radius-full)',
                      }}>
                        -{discount}%
                      </div>
                    )}
                  </div>

                  <div style={{ padding: '14px 16px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{
                      fontSize: 15, fontWeight: 600, color: 'var(--text)',
                      marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      lineHeight: 1.4,
                    }}>
                      {name}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 'auto' }}>
                      <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--primary)' }}>
                        {formatPrice(finalPrice)}
                      </span>
                      {discount > 0 && (
                        <span style={{ fontSize: 13, color: 'var(--text-light)', textDecoration: 'line-through' }}>
                          {formatPrice(price)}
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                      {inStock && (
                        <button
                          onClick={(e) => { e.stopPropagation(); addToCart(product); }}
                          style={{
                            flex: 1, padding: '9px 0', borderRadius: 'var(--radius)',
                            background: 'var(--primary-gradient)', color: 'white',
                            fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            boxShadow: 'var(--shadow-accent)',
                          }}
                        >
                          <ShoppingCart size={15} />
                          Agregar
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); removeFavorite(product.id); }}
                        style={{
                          width: 38, height: 38, borderRadius: 'var(--radius)',
                          background: 'var(--danger-light)', border: '1px solid rgba(255,107,107,0.2)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', color: 'var(--danger)', flexShrink: 0,
                        }}
                        aria-label="Eliminar de favoritos"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
