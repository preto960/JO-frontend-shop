'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, ShoppingCart, ShoppingBag, ChevronLeft, ChevronRight, Minus, Plus, Tag, Heart, Share2 } from 'lucide-react';
import api from '@/lib/api';
import { formatPrice, getProductImages, showToast } from '@/lib/utils';

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const detailsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    setQuantity(1);
    setImageLoaded(false);
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

  // Check localStorage for favorites
  useEffect(() => {
    if (!product) return;
    try {
      const favs: string[] = JSON.parse(localStorage.getItem('joshop_favorites') || '[]');
      setIsFavorite(favs.includes(product.id));
    } catch {}
  }, [product]);

  const images = getProductImages(product);
  const hasMultiple = images.length > 1;

  const goToSlide = useCallback((index: number) => {
    if (images.length <= 1 || isTransitioning) return;
    setIsTransitioning(true);
    setImageLoaded(false);
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
    }, 50);
    return () => clearInterval(progressInterval);
  }, [hasMultiple, goNext]);

  const toggleFavorite = () => {
    if (!product) return;
    try {
      const favs: string[] = JSON.parse(localStorage.getItem('joshop_favorites') || '[]');
      if (favs.includes(product.id)) {
        const updated = favs.filter((f) => f !== product.id);
        localStorage.setItem('joshop_favorites', JSON.stringify(updated));
        setIsFavorite(false);
        showToast('Eliminado de favoritos', 'info');
      } else {
        favs.push(product.id);
        localStorage.setItem('joshop_favorites', JSON.stringify(favs));
        setIsFavorite(true);
        showToast('Agregado a favoritos', 'success');
      }
    } catch {}
  };

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

  const shareProduct = () => {
    if (navigator.share) {
      navigator.share({
        title: name,
        text: `Mira este producto: ${name} - ${formatPrice(finalPrice)}`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href).then(() => {
        showToast('Enlace copiado', 'success');
      }).catch(() => {
        showToast('No se pudo copiar el enlace', 'error');
      });
    }
  };

  const price = product?.price ?? product?.precio ?? 0;
  const discount = product?.discountPercent ?? 0;
  const finalPrice = discount > 0 ? price * (1 - discount / 100) : price;
  const name = product?.name || product?.nombre || 'Sin nombre';
  const desc = product?.description || product?.descripcion || '';
  const inStock = product?.stock === undefined || product?.stock > 0;
  const maxQty = product?.stock ?? 999;

  /* ════════════ Skeleton Loader ════════════ */
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
        <div style={{
          height: 56, background: 'var(--white)',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', padding: '0 12px', gap: 12,
        }}>
          <div className="skeleton" style={{ width: 42, height: 42, borderRadius: '50%' }} />
          <div className="skeleton" style={{ height: 18, flex: 1, maxWidth: 200 }} />
          <div className="skeleton" style={{ width: 42, height: 42, borderRadius: '50%' }} />
          <div className="skeleton" style={{ width: 42, height: 42, borderRadius: '50%' }} />
        </div>
        <div style={{ padding: '20px 16px', display: 'flex', justifyContent: 'center' }}>
          <div className="skeleton" style={{ width: '100%', maxWidth: 420, aspectRatio: '1/1', borderRadius: 'var(--radius-xl)' }} />
        </div>
        <div style={{ background: 'var(--white)', borderTopLeftRadius: 28, borderTopRightRadius: 28, marginTop: -16, padding: '28px 24px 32px' }}>
          <div className="skeleton" style={{ height: 22, width: 100, marginBottom: 12 }} />
          <div className="skeleton" style={{ height: 28, width: '75%', marginBottom: 12 }} />
          <div className="skeleton" style={{ height: 36, width: 120, marginBottom: 20 }} />
          <div style={{ height: 1, background: 'var(--border)', margin: '0 -24px 20px' }} />
          <div className="skeleton" style={{ height: 16, width: '100%', marginBottom: 8 }} />
          <div className="skeleton" style={{ height: 16, width: '85%', marginBottom: 24 }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
            <div className="skeleton" style={{ height: 36, width: 140, borderRadius: 'var(--radius-full)' }} />
            <div className="skeleton" style={{ height: 44, width: 120, borderRadius: 'var(--radius-full)' }} />
          </div>
          <div className="skeleton" style={{ height: 56, borderRadius: 16, width: '100%' }} />
        </div>
      </div>
    );
  }

  /* ════════════ Not Found ════════════ */
  if (!product) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--background)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <div style={{
          width: 100, height: 100, borderRadius: '50%', background: 'var(--input-bg)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20,
        }}>
          <ShoppingBag size={44} style={{ color: 'var(--text-light)' }} />
        </div>
        <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>Producto no encontrado</p>
        <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 24, textAlign: 'center' }}>
          El producto que buscas no existe o fue eliminado
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
          Volver al inicio
        </button>
      </div>
    );
  }

  /* ════════════ Main View ════════════ */
  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', paddingBottom: 90 }}>
      {/* ═══ Glassmorphism Header ═══ */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(245,246,250,0.82)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        borderBottom: '1px solid var(--border)',
        height: 56,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 12px',
      }}>
        <button
          onClick={() => router.back()}
          style={{
            width: 42, height: 42, borderRadius: '50%',
            background: 'var(--white)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--text)',
            boxShadow: 'var(--shadow)',
            transition: 'all 0.2s ease',
          }}
          aria-label="Volver"
        >
          <ArrowLeft size={20} strokeWidth={2.5} />
        </button>

        <h1 style={{
          fontSize: 16, fontWeight: 600, color: 'var(--text)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          maxWidth: 'calc(100% - 180px)',
        }}>
          {name}
        </h1>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={shareProduct}
            style={{
              width: 42, height: 42, borderRadius: '50%',
              background: 'var(--white)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--text-secondary)',
              boxShadow: 'var(--shadow)',
              transition: 'all 0.2s ease',
            }}
            aria-label="Compartir"
          >
            <Share2 size={18} />
          </button>
          <button
            onClick={toggleFavorite}
            style={{
              width: 42, height: 42, borderRadius: '50%',
              background: isFavorite ? 'var(--accent-light)' : 'var(--white)',
              border: `1px solid ${isFavorite ? 'var(--accent)' : 'var(--border)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: isFavorite ? 'var(--accent)' : 'var(--text-secondary)',
              boxShadow: 'var(--shadow)',
              transition: 'all 0.25s ease',
            }}
            aria-label="Favorito"
          >
            <Heart size={18} fill={isFavorite ? 'var(--accent)' : 'none'} />
          </button>
        </div>
      </header>

      <div className="animate-fade-in">
        {/* ═══ Product Image / Carousel Section ═══ */}
        <div style={{
          position: 'relative',
          background: 'linear-gradient(180deg, var(--white) 0%, var(--input-bg) 100%)',
          padding: '20px 16px',
          display: 'flex',
          justifyContent: 'center',
        }}>
          {/* Discount badge */}
          {discount > 0 && (
            <div style={{
              position: 'absolute', top: 28, left: 24, zIndex: 6,
              background: 'var(--accent)', color: 'white',
              padding: '6px 14px', borderRadius: 'var(--radius-full)',
              fontSize: 13, fontWeight: 700,
              boxShadow: '0 4px 12px rgba(233,69,96,0.35)',
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              -{discount}%
            </div>
          )}

          {/* Image counter (when carousel) */}
          {hasMultiple && (
            <div style={{
              position: 'absolute', top: 28, right: 24, zIndex: 6,
              background: 'rgba(45,52,54,0.75)',
              color: 'white', fontSize: 12, fontWeight: 600,
              padding: '5px 12px', borderRadius: 'var(--radius-full)',
              backdropFilter: 'blur(6px)',
              letterSpacing: '0.3px',
            }}>
              {currentSlide + 1} / {images.length}
            </div>
          )}

          {/* Out of stock overlay (when single image) */}
          {!inStock && !hasMultiple && (
            <div style={{
              position: 'absolute', top: 28, right: 24, zIndex: 6,
              background: 'var(--white)', color: 'var(--danger)',
              padding: '6px 14px', borderRadius: 'var(--radius-full)',
              fontSize: 12, fontWeight: 700,
              boxShadow: 'var(--shadow-md)',
              border: '1.5px solid var(--danger)',
            }}>
              Agotado
            </div>
          )}

          <div
            style={{
              width: '100%', maxWidth: 420,
              aspectRatio: '1/1',
              borderRadius: 'var(--radius-xl)',
              overflow: 'hidden',
              background: 'var(--white)',
              boxShadow: 'var(--shadow-xl)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {/* Skeleton placeholder */}
            {!imageLoaded && images.length > 0 && (
              <div className="skeleton" style={{ position: 'absolute', inset: 0, borderRadius: 'var(--radius-xl)' }} />
            )}

            {images.length > 0 ? (
              <img
                key={currentSlide}
                src={images[currentSlide] || images[0]}
                alt={`${name} - imagen ${currentSlide + 1}`}
                onLoad={() => setImageLoaded(true)}
                style={{
                  width: '100%', height: '100%', objectFit: 'contain',
                  padding: 20,
                  opacity: imageLoaded ? 1 : 0,
                  transition: 'opacity 0.35s ease',
                }}
              />
            ) : (
              <div style={{ color: 'var(--text-light)', opacity: 0.4 }}>
                <ShoppingBag size={80} strokeWidth={1} />
              </div>
            )}

            {/* Carousel: Left arrow */}
            {hasMultiple && (
              <button
                onClick={(e) => { e.stopPropagation(); goPrev(); }}
                style={{
                  position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                  width: 40, height: 40, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.9)',
                  border: '1px solid rgba(0,0,0,0.06)',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.12)',
                  transition: 'all 0.2s ease',
                  zIndex: 5,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.18)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(-50%) scale(1)'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.12)'; }}
                aria-label="Imagen anterior"
              >
                <ChevronLeft size={22} color="#333" strokeWidth={2.5} />
              </button>
            )}

            {/* Carousel: Right arrow */}
            {hasMultiple && (
              <button
                onClick={(e) => { e.stopPropagation(); goNext(); }}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  width: 40, height: 40, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.9)',
                  border: '1px solid rgba(0,0,0,0.06)',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.12)',
                  transition: 'all 0.2s ease',
                  zIndex: 5,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.18)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(-50%) scale(1)'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.12)'; }}
                aria-label="Imagen siguiente"
              >
                <ChevronRight size={22} color="#333" strokeWidth={2.5} />
              </button>
            )}

            {/* Carousel: Progress bar */}
            {hasMultiple && (
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0,
                height: 3, background: 'rgba(0,0,0,0.06)', zIndex: 5,
              }}>
                <div style={{
                  height: '100%', width: `${progress}%`,
                  background: 'var(--primary)',
                  transition: 'width 0.05s linear',
                  borderRadius: '0 2px 2px 0',
                }} />
              </div>
            )}

            {/* Carousel: Dot indicators */}
            {hasMultiple && (
              <div style={{
                position: 'absolute', bottom: 16, left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex', gap: 8,
                padding: '6px 14px',
                background: 'rgba(45,52,54,0.5)',
                borderRadius: 'var(--radius-full)',
                backdropFilter: 'blur(8px)',
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
                      background: currentSlide === idx ? 'white' : 'rgba(255,255,255,0.45)',
                      border: 'none', cursor: 'pointer', padding: 0,
                      transition: 'width 0.3s ease, background 0.3s ease',
                    }}
                    aria-label={`Ir a imagen ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ═══ Product Details Card ═══ */}
        <div
          ref={detailsRef}
          style={{
            background: 'var(--white)',
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            marginTop: -16,
            position: 'relative',
            boxShadow: '0 -4px 24px rgba(0,0,0,0.04)',
            padding: '28px 24px 32px',
          }}
        >
          {/* Category tag */}
          {product?.category && (
            <div style={{ marginBottom: 10 }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                background: 'var(--primary-light)', color: 'var(--primary)',
                padding: '5px 14px', borderRadius: 'var(--radius-full)',
                fontSize: 12, fontWeight: 600,
                letterSpacing: '0.3px',
              }}>
                <Tag size={12} strokeWidth={2.5} />
                {typeof product.category === 'object' ? (product.category.name || product.category.nombre) : product.category}
              </span>
            </div>
          )}

          {/* Product name */}
          <h2 style={{
            fontSize: 26, fontWeight: 800, color: 'var(--text)',
            lineHeight: 1.2, marginBottom: 10, letterSpacing: '-0.5px',
          }}>
            {name}
          </h2>

          {/* Price section */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 20 }}>
            <span style={{
              fontSize: 32, fontWeight: 800, color: 'var(--primary)',
              letterSpacing: '-0.5px', lineHeight: 1,
            }}>
              {formatPrice(finalPrice)}
            </span>
            {discount > 0 && (
              <span style={{
                fontSize: 17, fontWeight: 500, color: 'var(--text-light)',
                textDecoration: 'line-through',
              }}>
                {formatPrice(price)
              </span>
            )}
          </div>

          {/* Divider */}
          <div style={{
            height: 1, background: 'var(--border)',
            margin: '0 -24px 20px',
          }} />

          {/* Description */}
          {desc && (
            <div style={{ marginBottom: 20 }}>
              <h3 style={{
                fontSize: 13, fontWeight: 700, color: 'var(--text)',
                marginBottom: 8, textTransform: 'uppercase',
                letterSpacing: '0.6px',
              }}>
                Descripcion
              </h3>
              <p style={{
                fontSize: 15, color: 'var(--text-secondary)',
                lineHeight: 1.75, fontWeight: 400,
              }}>
                {desc}
              </p>
            </div>
          )}

          {/* Stock + Quantity row */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: 16, marginBottom: 24,
          }}>
            {/* Stock status */}
            {product?.stock !== undefined && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 16px', borderRadius: 'var(--radius-full)',
                background: inStock ? 'var(--success-light)' : 'var(--danger-light)',
                border: `1px solid ${inStock ? 'rgba(0,184,148,0.2)' : 'rgba(255,107,107,0.2)'}`,
              }}>
                <div style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: inStock ? 'var(--success)' : 'var(--danger)',
                  boxShadow: `0 0 6px ${inStock ? 'rgba(0,184,148,0.4)' : 'rgba(255,107,107,0.4)'}`,
                }} />
                <span style={{
                  fontSize: 13, fontWeight: 600,
                  color: inStock ? '#00876A' : 'var(--danger)',
                }}>
                  {inStock ? `${product.stock} en stock` : 'Agotado'}
                </span>
              </div>
            )}

            {/* Quantity selector */}
            {inStock && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 0,
                background: 'var(--input-bg)', borderRadius: 'var(--radius-full)',
                padding: 4,
              }}>
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  style={{
                    width: 38, height: 38, borderRadius: '50%',
                    background: 'var(--white)', border: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: 'var(--text)',
                    boxShadow: 'var(--shadow)',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text)'; }}
                  aria-label="Menos"
                >
                  <Minus size={16} strokeWidth={2.5} />
                </button>
                <span style={{
                  width: 48, textAlign: 'center',
                  fontSize: 17, fontWeight: 700, color: 'var(--text)',
                  userSelect: 'none',
                }}>
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(maxQty, quantity + 1))}
                  style={{
                    width: 38, height: 38, borderRadius: '50%',
                    background: 'var(--white)', border: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: 'var(--text)',
                    boxShadow: 'var(--shadow)',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text)'; }}
                  aria-label="Mas"
                >
                  <Plus size={16} strokeWidth={2.5} />
                </button>
              </div>
            )}
          </div>

          {/* Add to cart button */}
          <button
            onClick={addToCart}
            disabled={!inStock}
            style={{
              width: '100%',
              padding: '18px 24px',
              borderRadius: 16,
              background: addedToCart
                ? 'linear-gradient(135deg, #00B894, #00D2A0)'
                : inStock
                  ? 'var(--primary-gradient)'
                  : 'var(--input-bg)',
              color: 'white',
              fontSize: 16,
              fontWeight: 700,
              border: 'none',
              cursor: inStock ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              boxShadow: addedToCart
                ? '0 4px 14px rgba(0,184,148,0.35)'
                : inStock
                  ? 'var(--shadow-accent)'
                  : 'none',
              opacity: inStock ? 1 : 0.55,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: addedToCart ? 'scale(0.98)' : 'scale(1)',
              letterSpacing: '0.2px',
            }}
          >
            {addedToCart ? (
              <>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                Agregado al carrito
              </>
            ) : (
              <>
                <ShoppingCart size={21} strokeWidth={2} />
                {inStock
                  ? `Agregar al carrito  ·  ${formatPrice(finalPrice * quantity)}`
                  : 'Producto agotado'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
