'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, ShoppingCart, ShoppingBag, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '@/lib/api';
import Header from '@/components/Header';

import { formatPrice, getProductImages, showToast } from '@/lib/utils';

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [progress, setProgress] = useState(0);

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

  // Auto-play with progress indicator
  useEffect(() => {
    if (!hasMultiple) return;
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          goNext();
          return 0;
        }
        return prev + 1;
      });
    }, 50); // 50ms * 100 steps = 5 seconds total
    return () => clearInterval(progressInterval);
  }, [hasMultiple, goNext]);

  // Pause auto-play on hover
  const [isPaused, setIsPaused] = useState(false);
  useEffect(() => {
    if (!isPaused || !hasMultiple) return;
    // Reset progress while paused is handled via the progress interval check
  }, [isPaused, hasMultiple]);

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
            {/* Product image / Carousel */}
            <div
              style={{
                width: '100%', height: 340, background: 'var(--input-bg)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                position: 'relative',
              }}
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              {images.length > 0 ? (
                <>
                  <img
                    src={images[currentSlide] || images[0]}
                    alt={`${name} - imagen ${currentSlide + 1}`}
                    style={{
                      width: '100%', height: '100%', objectFit: 'contain',
                      transition: 'opacity 0.3s ease',
                      opacity: isTransitioning ? 0 : 1,
                    }}
                  />

                  {/* Left arrow */}
                  {hasMultiple && (
                    <button
                      onClick={(e) => { e.stopPropagation(); goPrev(); }}
                      style={{
                        position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                        width: 40, height: 40, borderRadius: '50%',
                        background: 'rgba(255,255,255,0.85)',
                        border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        transition: 'all 0.2s ease',
                        zIndex: 5,
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.transform = 'translateY(-50%) scale(1.08)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.85)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1)'; }}
                      aria-label="Imagen anterior"
                    >
                      <ChevronLeft size={22} color="#333" />
                    </button>
                  )}

                  {/* Right arrow */}
                  {hasMultiple && (
                    <button
                      onClick={(e) => { e.stopPropagation(); goNext(); }}
                      style={{
                        position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                        width: 40, height: 40, borderRadius: '50%',
                        background: 'rgba(255,255,255,0.85)',
                        border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        transition: 'all 0.2s ease',
                        zIndex: 5,
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.transform = 'translateY(-50%) scale(1.08)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.85)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1)'; }}
                      aria-label="Imagen siguiente"
                    >
                      <ChevronRight size={22} color="#333" />
                    </button>
                  )}

                  {/* Progress bar */}
                  {hasMultiple && (
                    <div style={{
                      position: 'absolute', top: 0, left: 0, right: 0,
                      height: 3, background: 'rgba(0,0,0,0.1)', zIndex: 5,
                    }}>
                      <div style={{
                        height: '100%', width: `${isPaused ? progress : progress}%`,
                        background: 'var(--primary)',
                        transition: 'width 0.05s linear',
                        borderRadius: '0 2px 2px 0',
                      }} />
                    </div>
                  )}

                  {/* Dot indicators */}
                  {hasMultiple && (
                    <div style={{
                      position: 'absolute', bottom: 16, left: '50%',
                      transform: 'translateX(-50%)',
                      display: 'flex', gap: 8,
                      padding: '6px 14px',
                      background: 'rgba(0,0,0,0.4)',
                      borderRadius: 'var(--radius-full)',
                      backdropFilter: 'blur(6px)',
                      zIndex: 5,
                    }}>
                      {images.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={(e) => { e.stopPropagation(); goToSlide(idx); }}
                          style={{
                            width: currentSlide === idx ? 24 : 8,
                            height: 8,
                            borderRadius: 4,
                            background: currentSlide === idx ? 'white' : 'rgba(255,255,255,0.5)',
                            border: 'none', cursor: 'pointer', padding: 0,
                            transition: 'width 0.3s ease, background 0.3s ease',
                          }}
                          aria-label={`Ir a imagen ${idx + 1}`}
                        />
                      ))}
                    </div>
                  )}

                  {/* Image counter */}
                  {hasMultiple && (
                    <div style={{
                      position: 'absolute', top: 12, right: 12,
                      background: 'rgba(0,0,0,0.5)',
                      color: 'white', fontSize: 12, fontWeight: 600,
                      padding: '4px 10px', borderRadius: 'var(--radius-full)',
                      backdropFilter: 'blur(4px)',
                      letterSpacing: '0.3px', zIndex: 5,
                    }}>
                      {currentSlide + 1} / {images.length}
                    </div>
                  )}
                </>
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
                  fontSize: 12, fontWeight: 700, zIndex: 5,
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
