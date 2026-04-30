'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ShoppingCart, ShoppingBag, Percent } from 'lucide-react';
import { formatPrice, getProductImages } from '@/lib/utils';

interface ProductCardProps {
  product: any;
  onAddToCart?: (product: any) => void;
  onClick?: (product: any) => void;
}

export default function ProductCard({ product, onAddToCart, onClick }: ProductCardProps) {
  const images = getProductImages(product);
  const hasMultiple = images.length > 1;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const price = product.price ?? product.precio ?? 0;
  const discountPercent = product.discountPercent ?? product.discount_percent ?? 0;
  const hasDiscount = discountPercent > 0;
  const discountedPrice = hasDiscount ? price * (1 - discountPercent / 100) : price;
  const name = product.name || product.nombre || 'Sin nombre';
  const description = product.description || product.descripcion || '';

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart?.(product);
  };

  const goToNext = useCallback(() => {
    if (images.length <= 1) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
      setIsTransitioning(false);
    }, 300);
  }, [images.length]);

  // Auto-rotate every 3 seconds when there are multiple images
  useEffect(() => {
    if (!hasMultiple) return;
    const interval = setInterval(goToNext, 3000);
    return () => clearInterval(interval);
  }, [hasMultiple, goToNext]);

  return (
    <div
      onClick={() => onClick?.(product)}
      className="animate-fade-in"
      style={{
        background: 'var(--card)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow)',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1), box-shadow 0.25s cubic-bezier(0.4,0,0.2,1)',
        display: 'flex',
        flexDirection: 'column',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'var(--shadow)';
      }}
    >
      {/* Image / Carousel */}
      <div style={{
        width: '100%', height: 180, background: 'var(--input-bg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
        position: 'relative',
      }}>
        {images.length > 0 ? (
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <img
              src={images[currentIndex] || images[0]}
              alt={name}
              style={{
                width: '100%', height: '100%', objectFit: 'cover',
                transition: 'opacity 0.3s ease, transform 0.3s ease',
                opacity: isTransitioning ? 0 : 1,
              }}
              loading="lazy"
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                img.style.display = 'none';
              }}
            />
            {/* Hidden placeholder for fallback on error */}
            <div style={{
              position: 'absolute', inset: 0,
              display: 'none', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-light)',
            }} id={`fallback-${product?.id}`}>
              <ShoppingBag size={48} strokeWidth={1.2} />
            </div>

            {/* Image counter badge */}
            {hasMultiple && (
              <div style={{
                position: 'absolute', top: 8, left: 8,
                background: 'rgba(0,0,0,0.55)',
                color: 'white',
                fontSize: 11, fontWeight: 600,
                padding: '3px 8px',
                borderRadius: 'var(--radius-full)',
                backdropFilter: 'blur(4px)',
                letterSpacing: '0.3px',
                pointerEvents: 'none',
                zIndex: 2,
              }}>
                {currentIndex + 1}/{images.length}
              </div>
            )}

            {/* Dots indicator */}
            {hasMultiple && (
              <div style={{
                position: 'absolute', bottom: 8, left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex', gap: 5,
                padding: '4px 10px',
                background: 'rgba(0,0,0,0.35)',
                borderRadius: 'var(--radius-full)',
                backdropFilter: 'blur(4px)',
                zIndex: 2,
              }}>
                {images.map((_, idx) => (
                  <div
                    key={idx}
                    style={{
                      width: currentIndex === idx ? 16 : 6,
                      height: 6,
                      borderRadius: 3,
                      background: currentIndex === idx ? 'white' : 'rgba(255,255,255,0.5)',
                      transition: 'width 0.3s ease, background 0.3s ease',
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-light)' }}>
            <ShoppingBag size={48} strokeWidth={1.2} />
          </div>
        )}
        {product.stock !== undefined && product.stock <= 0 && (
          <div style={{
            position: 'absolute', top: 10, right: 10,
            background: 'var(--danger)',
            color: 'white',
            fontSize: 11,
            fontWeight: 600,
            padding: '4px 12px',
            borderRadius: 'var(--radius-full)',
            letterSpacing: '0.2px',
            zIndex: 3,
          }}>
            Agotado
          </div>
        )}
        {hasDiscount && (
          <div style={{
            position: 'absolute', top: hasMultiple ? 10 : 10, right: 10,
            background: '#FF6B6B',
            color: 'white',
            fontSize: 11,
            fontWeight: 700,
            padding: '4px 10px',
            borderRadius: 'var(--radius-full)',
            letterSpacing: '0.2px',
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            boxShadow: '0 2px 8px rgba(255,107,107,0.4)',
            zIndex: 3,
          }}>
            <Percent size={10} />
            {Math.round(discountPercent)}%
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '14px 16px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <h3 style={{
          fontSize: 15, fontWeight: 600, color: 'var(--text)',
          marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          lineHeight: '1.4',
        }}>
          {name}
        </h3>
        <p style={{
          fontSize: 13, color: 'var(--text-secondary)',
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          lineHeight: 1.5,
          flex: 1,
        }}>
          {description}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {hasDiscount && (
              <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-light)', textDecoration: 'line-through' }}>
                {formatPrice(price)}
              </span>
            )}
            <span style={{
              fontSize: hasDiscount ? 16 : 18,
              fontWeight: 700,
              color: hasDiscount ? '#FF6B6B' : 'var(--primary)',
              letterSpacing: '-0.3px',
            }}>
              {formatPrice(discountedPrice)}
            </span>
          </div>
          {(product.stock === undefined || product.stock > 0) && (
            <button
              onClick={handleAdd}
              style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'var(--primary-gradient)',
                color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: 'none', cursor: 'pointer',
                transition: 'box-shadow 0.2s ease, transform 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = 'var(--shadow-accent)';
                e.currentTarget.style.transform = 'scale(1.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'scale(1)';
              }}
              aria-label="Agregar al carrito"
            >
              <ShoppingCart size={17} strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
