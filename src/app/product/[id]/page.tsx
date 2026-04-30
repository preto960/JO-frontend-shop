'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ShoppingCart, ShoppingBag, ChevronLeft, ChevronRight, Minus, Plus, Tag, Heart, Share2 } from 'lucide-react';
import api from '@/lib/api';
import Header from '@/components/Header';
import { formatPrice, getProductImages, showToast } from '@/lib/utils';

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (!product) return;
    try {
      const favs: string[] = JSON.parse(localStorage.getItem('joshop_favorites') || '[]');
      setIsFavorite(favs.includes(product.id));
    } catch {}
  }, [product]);

  const toggleFavorite = () => {
    if (!product) return;
    try {
      const favs: string[] = JSON.parse(localStorage.getItem('joshop_favorites') || '[]');
      if (favs.includes(product.id)) {
        const updated = favs.filter((f) => f !== product.id);
        localStorage.setItem('joshop_favorites', JSON.stringify(updated));
        setIsFavorite(false);
        showToast('Eliminado de favoritos', 'info');
        window.dispatchEvent(new Event('favoritesUpdated'));
      } else {
        favs.push(product.id);
        localStorage.setItem('joshop_favorites', JSON.stringify(favs));
        setIsFavorite(true);
        showToast('Agregado a favoritos', 'success');
        window.dispatchEvent(new Event('favoritesUpdated'));
      }
    } catch {}
  };

  const shareProduct = () => {
    if (navigator.share) {
      navigator.share({ title: name, text: `Mira este producto: ${name} - ${formatPrice(finalPrice)}`, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href).then(() => showToast('Enlace copiado', 'success')).catch(() => showToast('No se pudo copiar', 'error'));
    }
  };

  useEffect(() => {
    if (!id) return;
    setQuantity(1);
    setAddedToCart(false);
    setCurrentSlide(0);
    setProgress(0);
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

  const images = getProductImages(product);
  const hasMultiple = images.length > 1;

  const goToSlide = useCallback((index: number) => {
    if (images.length <= 1 || isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentSlide(index);
      setIsTransitioning(false);
      setProgress(0);
    }, 300);
  }, [images.length, isTransitioning]);

  const goNext = useCallback(() => {
    if (images.length <= 1) return;
    goToSlide((currentSlide + 1) % images.length);
  }, [currentSlide, images.length, goToSlide]);

  const goPrev = useCallback(() => {
    if (images.length <= 1) return;
    goToSlide((currentSlide - 1 + images.length) % images.length);
  }, [currentSlide, images.length, goToSlide]);

  useEffect(() => {
    if (!hasMultiple || isPaused) return;
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          goNext();
          return 0;
        }
        return prev + 1;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [hasMultiple, isPaused, goNext]);

  const addToCart = () => {
    if (!product || !inStock) return;
    try {
      const cart: any[] = JSON.parse(localStorage.getItem('joshop_cart') || '[]');
      const idx = cart.findIndex((item: any) => item.id === product.id);
      if (idx >= 0) {
        cart[idx].quantity = (cart[idx].quantity || 1) + quantity;
      } else {
        cart.push({ ...product, quantity });
      }
      localStorage.setItem('joshop_cart', JSON.stringify(cart));
      window.dispatchEvent(new Event('cartUpdated'));
      setAddedToCart(true);
      showToast(`${quantity}x ${name} agregado al carrito`, 'success');
      setTimeout(() => setAddedToCart(false), 1800);
    } catch {
      showToast('Error al agregar al carrito', 'error');
    }
  };

  const price = product?.price ?? product?.precio ?? 0;
  const discount = product?.discountPercent ?? 0;
  const finalPrice = discount > 0 ? price * (1 - discount / 100) : price;
  const name = product?.name || product?.nombre || 'Sin nombre';
  const desc = product?.description || product?.descripcion || '';
  const inStock = product?.stock === undefined || product?.stock > 0;
  const maxQty = product?.stock ?? 999;

  const btnBase: React.CSSProperties = {
    background: 'rgba(255,255,255,0.15)',
    border: 'none',
    color: 'var(--white)',
    cursor: 'pointer',
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderRadius: 'var(--radius-sm)',
    transition: 'var(--transition-fast)',
  };

  /* ═══ Skeleton ═══ */
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
        <Header title="" showBack showLogout={false} />
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 20px', display: 'flex', gap: 32, alignItems: 'flex-start' }}>
          <div className="skeleton" style={{ width: '45%', aspectRatio: '1/1', borderRadius: 'var(--radius-lg)', flexShrink: 0 }} />
          <div style={{ flex: 1, paddingTop: 8 }}>
            <div className="skeleton" style={{ height: 20, width: 100, marginBottom: 16 }} />
            <div className="skeleton" style={{ height: 28, width: '80%', marginBottom: 12 }} />
            <div className="skeleton" style={{ height: 36, width: 140, marginBottom: 20 }} />
            <div style={{ height: 1, background: 'var(--border)', margin: '0 0 20px' }} />
            <div className="skeleton" style={{ height: 16, width: '100%', marginBottom: 8 }} />
            <div className="skeleton" style={{ height: 16, width: '90%', marginBottom: 8 }} />
            <div className="skeleton" style={{ height: 16, width: '60%', marginBottom: 24 }} />
            <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
              <div className="skeleton" style={{ height: 36, width: 140, borderRadius: 'var(--radius-full)' }} />
              <div className="skeleton" style={{ height: 44, width: 130, borderRadius: 'var(--radius-full)' }} />
            </div>
            <div className="skeleton" style={{ height: 52, borderRadius: 14, width: '100%' }} />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
        <Header title="Producto" showBack showLogout={false} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 80 }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--input-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <ShoppingBag size={36} style={{ color: 'var(--text-light)' }} />
          </div>
          <p style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>Producto no encontrado</p>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>El producto que buscas no existe o fue eliminado</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', paddingBottom: 90 }}>
      <Header title={name} showBack onBack={() => router.push('/')} showLogout={false} />

      <div id="product-layout" className="animate-fade-in" style={{
        maxWidth: 960,
        margin: '0 auto',
        padding: '24px 20px',
        display: 'flex',
        gap: 32,
        alignItems: 'flex-start',
      }}>
        {/* ═══ LEFT: Info ═══ */}
        <div id="product-info-col" style={{ flex: 1, minWidth: 0 }}>
          {/* Category */}
          {product?.category && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              background: 'var(--input-bg)', color: 'var(--text-secondary)',
              padding: '5px 14px', borderRadius: 'var(--radius-full)',
              fontSize: 13, fontWeight: 500, marginBottom: 16,
            }}>
              <Tag size={12} strokeWidth={2} />
              {typeof product.category === 'object' ? (product.category.name || product.category.nombre) : product.category}
            </span>
          )}

          {/* Name */}
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', lineHeight: 1.25, marginBottom: 12, letterSpacing: '-0.3px' }}>
            {name}
          </h1>

          {/* Action buttons row */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <button onClick={toggleFavorite} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 'var(--radius-full)', background: isFavorite ? 'var(--accent-light)' : 'var(--input-bg)', border: `1px solid ${isFavorite ? 'var(--accent)' : 'var(--border)'}`, cursor: 'pointer', color: isFavorite ? 'var(--accent)' : 'var(--text-secondary)', fontSize: 13, fontWeight: 500, transition: 'all 0.2s ease' }} aria-label="Favorito">
              <Heart size={16} fill={isFavorite ? 'var(--accent)' : 'none'} />
              {isFavorite ? 'Guardado' : 'Favorito'}
            </button>
            <button onClick={shareProduct} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 'var(--radius-full)', background: 'var(--input-bg)', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500, transition: 'all 0.2s ease' }} aria-label="Compartir">
              <Share2 size={16} />
              Compartir
            </button>
          </div>

          {/* Price */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 20 }}>
            <span style={{ fontSize: 32, fontWeight: 800, color: 'var(--primary)', letterSpacing: '-0.5px', lineHeight: 1 }}>
              {formatPrice(finalPrice)}
            </span>
            {discount > 0 && (
              <span style={{ fontSize: 17, fontWeight: 500, color: 'var(--text-light)', textDecoration: 'line-through' }}>
                {formatPrice(price)}
              </span>
            )}
          </div>

          <div style={{ height: 1, background: 'var(--border)', margin: '0 0 20px' }} />

          {/* Description */}
          {desc && (
            <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.75, marginBottom: 24 }}>
              {desc}
            </p>
          )}

          {/* Stock */}
          {product?.stock !== undefined && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '8px 16px', borderRadius: 'var(--radius)',
              background: inStock ? 'var(--success-light)' : 'var(--danger-light)',
              marginBottom: 20,
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: inStock ? 'var(--success)' : 'var(--danger)' }} />
              <span style={{ fontSize: 14, fontWeight: 500, color: inStock ? '#155724' : '#CC3333' }}>
                {inStock ? `En stock (${product.stock} disponibles)` : 'Agotado'}
              </span>
            </div>
          )}

          {/* Quantity selector */}
          {inStock && (
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Cantidad
              </p>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 0, background: 'var(--input-bg)', borderRadius: 'var(--radius-full)', padding: 4 }}>
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--white)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text)', boxShadow: 'var(--shadow)' }} aria-label="Menos">
                  <Minus size={16} strokeWidth={2.5} />
                </button>
                <span style={{ width: 48, textAlign: 'center', fontSize: 17, fontWeight: 700, color: 'var(--text)', userSelect: 'none' }}>{quantity}</span>
                <button onClick={() => setQuantity(Math.min(maxQty, quantity + 1))} style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--white)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text)', boxShadow: 'var(--shadow)' }} aria-label="Mas">
                  <Plus size={16} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          )}

          {/* Add to cart */}
          <button onClick={addToCart} disabled={!inStock} style={{
            width: '100%', maxWidth: 420, padding: '16px 24px', borderRadius: 14,
            background: addedToCart ? 'linear-gradient(135deg, #00B894, #00D2A0)' : inStock ? 'var(--primary-gradient)' : 'var(--input-bg)',
            color: 'white', fontSize: 16, fontWeight: 700, border: 'none',
            cursor: inStock ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            boxShadow: addedToCart ? '0 4px 14px rgba(0,184,148,0.35)' : inStock ? 'var(--shadow-accent)' : 'none',
            opacity: inStock ? 1 : 0.6,
            transition: 'all 0.25s ease',
          }}>
            {addedToCart ? (
              <>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                Agregado al carrito
              </>
            ) : (
              <>
                <ShoppingCart size={21} strokeWidth={2} />
                {inStock ? `Agregar al carrito  ·  ${formatPrice(finalPrice * quantity)}` : 'Producto agotado'}
              </>
            )}
          </button>
        </div>

        {/* ═══ RIGHT: Image / Carousel ═══ */}
        <div id="product-image-col" style={{
          width: '45%', flexShrink: 0, position: 'sticky', top: 76,
        }}>
          {/* Discount badge */}
          {discount > 0 && (
            <div style={{
              position: 'absolute', top: 8, left: 8, zIndex: 6,
              background: 'var(--accent)', color: 'white',
              padding: '5px 14px', borderRadius: 'var(--radius-full)',
              fontSize: 13, fontWeight: 700,
              boxShadow: '0 4px 12px rgba(233,69,96,0.3)',
            }}>
              -{discount}%
            </div>
          )}

          <div
            style={{
              width: '100%', aspectRatio: '1/1',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              background: 'var(--white)',
              boxShadow: 'var(--shadow-lg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {images.length > 0 ? (
              <img
                key={currentSlide}
                src={images[currentSlide] || images[0]}
                alt={`${name} - imagen ${currentSlide + 1}`}
                style={{
                  width: '100%', height: '100%', objectFit: 'contain', padding: 20,
                  transition: 'opacity 0.3s ease',
                  opacity: isTransitioning ? 0 : 1,
                }}
              />
            ) : (
              <div style={{ color: 'var(--text-light)' }}>
                <ShoppingBag size={72} strokeWidth={1.2} />
              </div>
            )}

            {/* Left arrow */}
            {hasMultiple && (
              <button onClick={(e) => { e.stopPropagation(); goPrev(); }} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-md)', transition: 'all 0.2s ease', zIndex: 5 }} aria-label="Imagen anterior">
                <ChevronLeft size={20} color="#333" />
              </button>
            )}

            {/* Right arrow */}
            {hasMultiple && (
              <button onClick={(e) => { e.stopPropagation(); goNext(); }} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-md)', transition: 'all 0.2s ease', zIndex: 5 }} aria-label="Imagen siguiente">
                <ChevronRight size={20} color="#333" />
              </button>
            )}

            {/* Progress bar */}
            {hasMultiple && (
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'rgba(0,0,0,0.08)', zIndex: 5 }}>
                <div style={{ height: '100%', width: `${progress}%`, background: 'var(--primary)', transition: 'width 0.05s linear', borderRadius: '0 2px 2px 0' }} />
              </div>
            )}

            {/* Dot indicators */}
            {hasMultiple && (
              <div style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 8, padding: '5px 14px', background: 'rgba(0,0,0,0.45)', borderRadius: 'var(--radius-full)', backdropFilter: 'blur(6px)', zIndex: 5 }}>
                {images.map((_, idx) => (
                  <button key={idx} onClick={(e) => { e.stopPropagation(); goToSlide(idx); }} style={{ width: currentSlide === idx ? 22 : 7, height: 7, borderRadius: 4, background: currentSlide === idx ? 'white' : 'rgba(255,255,255,0.45)', border: 'none', cursor: 'pointer', padding: 0, transition: 'width 0.3s ease, background 0.3s ease' }} aria-label={`Ir a imagen ${idx + 1}`} />
                ))}
              </div>
            )}

            {/* Image counter */}
            {hasMultiple && (
              <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.5)', color: 'white', fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 'var(--radius-full)', backdropFilter: 'blur(4px)', letterSpacing: '0.3px', zIndex: 5 }}>
                {currentSlide + 1} / {images.length}
              </div>
            )}

            {/* Out of stock */}
            {!inStock && (
              <div style={{ position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)', background: 'var(--danger)', color: 'white', padding: '6px 16px', borderRadius: 'var(--radius-full)', fontSize: 13, fontWeight: 700, zIndex: 5, boxShadow: '0 2px 8px rgba(255,107,107,0.3)' }}>
                Agotado
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ Mobile: stacked layout ═══ */}
      <style>{`
        @media (max-width: 768px) {
          #product-layout {
            flex-direction: column-reverse !important;
            gap: 20px !important;
          }
          #product-image-col {
            width: 100% !important;
            position: static !important;
          }
          #product-info-col {
            padding-bottom: 8px !important;
          }
        }
      `}</style>
    </div>
  );
}
