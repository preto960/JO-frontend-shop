'use client';

import React from 'react';
import { ShoppingCart, ShoppingBag } from 'lucide-react';
import { formatPrice, getProductImage } from '@/lib/utils';

interface ProductCardProps {
  product: any;
  onAddToCart?: (product: any) => void;
  onClick?: (product: any) => void;
}

export default function ProductCard({ product, onAddToCart, onClick }: ProductCardProps) {
  const image = getProductImage(product);
  const price = product.price ?? product.precio ?? 0;
  const name = product.name || product.nombre || 'Sin nombre';
  const description = product.description || product.descripcion || '';

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart?.(product);
  };

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
      {/* Image */}
      <div style={{
        width: '100%', height: 180, background: 'var(--input-bg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
        position: 'relative',
      }}>
        {image ? (
          <img
            src={image}
            alt={name}
            style={{
              width: '100%', height: '100%', objectFit: 'cover',
              transition: 'transform 0.3s ease',
            }}
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              (e.target as HTMLImageElement).parentElement!.innerHTML = `
                <div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-light);">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
                </div>`;
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLImageElement).style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLImageElement).style.transform = 'scale(1)';
            }}
          />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-light)' }}>
            <ShoppingBag size={48} strokeWidth={1.2} />
          </div>
        )}
        {product.stock !== undefined && product.stock <= 0 && (
          <div style={{
            position: 'absolute', top: 10, left: 10,
            background: 'var(--danger)',
            color: 'white',
            fontSize: 11,
            fontWeight: 600,
            padding: '4px 12px',
            borderRadius: 'var(--radius-full)',
            letterSpacing: '0.2px',
          }}>
            Agotado
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
          <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--primary)', letterSpacing: '-0.3px' }}>
            {formatPrice(price)}
          </span>
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
