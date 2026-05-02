'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, Trash2, ShoppingBag, ShoppingCart, Plus } from 'lucide-react';
import { formatPrice, showToast } from '@/lib/utils';
import api from '@/lib/api';

const PLACEHOLDER_IMG = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiB2aWV3Qm94PSIwIDAgMjAwIDIwMCI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNmNWY1ZjUiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iI2NjYyIgZm9udC1zaXplPSIxNCI+U2luIGltYWdlbjwvdGV4dD48L3N2Zz4=';

interface FavoritesDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
}

interface FavProduct {
  id: string;
  name: string;
  price: number;
  discountPercent?: number;
  image?: string;
  thumbnail?: string;
  image_url?: string;
  imageUrl?: string;
  stock?: number;
}

export default function FavoritesDropdown({ isOpen, onClose, anchorRef }: FavoritesDropdownProps) {
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [favorites, setFavorites] = useState<FavProduct[]>([]);
  const [loading, setLoading] = useState(false);

  const loadFavorites = async () => {
    try {
      const favIds: string[] = JSON.parse(localStorage.getItem('joshop_favorites') || '[]');
      if (favIds.length === 0) {
        setFavorites([]);
        return;
      }
      setLoading(true);
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
    if (isOpen) loadFavorites();
    window.addEventListener('favoritesUpdated', loadFavorites);
    return () => window.removeEventListener('favoritesUpdated', loadFavorites);
  }, [isOpen]);

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

  const removeFavorite = (productId: string) => {
    try {
      const favs: string[] = JSON.parse(localStorage.getItem('joshop_favorites') || '[]');
      const updated = favs.filter((f) => f !== productId);
      localStorage.setItem('joshop_favorites', JSON.stringify(updated));
      setFavorites((prev) => prev.filter((p) => p.id !== productId));
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

  const goTo = (path: string) => {
    onClose();
    router.push(path);
  };

  const getImage = (p: FavProduct) => p.image || p.thumbnail || p.image_url || p.imageUrl || '';

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
              background: 'linear-gradient(135deg, #FF6B6B, #ee5a24)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Heart size={16} color="white" fill="white" />
            </div>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
                Mis Favoritos
              </h3>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                {favorites.length} {favorites.length === 1 ? 'producto' : 'productos'}
              </p>
            </div>
          </div>
        </div>

        {/* Favorites list */}
        <div style={{
          maxHeight: 320,
          overflowY: 'auto',
          padding: '8px 0',
        }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 36 }}>
              <div style={{ width: 28, height: 28, border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            </div>
          ) : favorites.length === 0 ? (
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
                <Heart size={24} color="var(--text-light)" />
              </div>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
                No tienes favoritos aun
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                Guarda productos que te gusten
              </p>
            </div>
          ) : (
            favorites.map((product, index) => {
              const price = product.price ?? 0;
              const discount = product.discountPercent ?? 0;
              const finalPrice = discount > 0 ? price * (1 - discount / 100) : price;
              const image = getImage(product);
              const inStock = product.stock === undefined || product.stock > 0;

              return (
                <div
                  key={product.id}
                  style={{
                    padding: '10px 18px',
                    display: 'flex',
                    gap: 12,
                    alignItems: 'center',
                    borderBottom: index < favorites.length - 1 ? '1px solid var(--input-bg)' : 'none',
                    cursor: 'pointer',
                  }}
                  onClick={() => goTo(`/product/${product.id}`)}
                >
                  {/* Product image */}
                  <div style={{
                    width: 48, height: 48, borderRadius: 10,
                    background: 'var(--input-bg)',
                    overflow: 'hidden', flexShrink: 0,
                  }}>
                    {image ? (
                      <img src={image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { (e.currentTarget as HTMLImageElement).src = PLACEHOLDER_IMG; }} />
                    ) : (
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        height: '100%',
                      }}>
                        <ShoppingBag size={20} color="var(--text-light)" strokeWidth={1.2} />
                      </div>
                    )}
                  </div>

                  {/* Product info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: 13, fontWeight: 600, color: 'var(--text)',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {product.name || 'Sin nombre'}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 2 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>
                        {formatPrice(finalPrice)}
                      </span>
                      {discount > 0 && (
                        <span style={{ fontSize: 11, color: 'var(--text-light)', textDecoration: 'line-through' }}>
                          {formatPrice(price)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Add to cart button */}
                  {inStock && (
                    <button
                      onClick={(e) => { e.stopPropagation(); addToCart(product); }}
                      style={{
                        width: 28, height: 28, borderRadius: 6,
                        border: 'none', background: '#E8F5E9',
                        cursor: 'pointer', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        color: '#4CAF50', flexShrink: 0,
                      }}
                      aria-label="Agregar al carrito"
                    >
                      <Plus size={14} />
                    </button>
                  )}

                  {/* Remove button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); removeFavorite(product.id); }}
                    style={{
                      width: 28, height: 28, borderRadius: 6,
                      border: 'none', background: '#FFE8E8',
                      cursor: 'pointer', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      color: '#FF6B6B', flexShrink: 0,
                    }}
                    aria-label="Eliminar de favoritos"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {favorites.length > 0 && (
          <div style={{
            padding: '14px 18px',
            borderTop: '1px solid var(--border)',
            background: 'var(--input-bg)',
          }}>
            <button
              onClick={() => goTo('/favorites')}
              style={{
                width: '100%', padding: '11px 0', borderRadius: 10,
                border: '2px solid var(--border)', background: 'white',
                color: 'var(--text)', cursor: 'pointer',
                fontWeight: 600, fontSize: 13,
                transition: 'all 0.2s',
              }}
            >
              Ver todos los favoritos
            </button>
          </div>
        )}
      </div>
    </>
  );
}
