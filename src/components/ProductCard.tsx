'use client';

import React from 'react';
import { ShoppingCart } from 'lucide-react';
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
        borderRadius: 12,
        boxShadow: 'var(--shadow)',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        display: 'flex',
        flexDirection: 'column',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'var(--shadow)';
      }}
    >
      {/* Image */}
      <div style={{
        width: '100%', height: 160, background: 'var(--input-bg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
        position: 'relative',
      }}>
        {image ? (
          <img
            src={image}
            alt={name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              (e.target as HTMLImageElement).parentElement!.innerHTML = `
                <div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-light);">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
                </div>`;
            }}
          />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-light)' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" />
            </svg>
          </div>
        )}
        {product.stock !== undefined && product.stock <= 0 && (
          <div style={{
            position: 'absolute', top: 8, left: 8, background: 'var(--accent)',
            color: 'white', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4,
          }}>
            Agotado
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: 12, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <h3 style={{
          fontSize: 14, fontWeight: 600, color: 'var(--text)',
          marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {name}
        </h3>
        <p style={{
          fontSize: 12, color: 'var(--text-secondary)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          flex: 1,
        }}>
          {product.description || product.descripcion || ''}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent)' }}>
            {formatPrice(price)}
          </span>
          {(product.stock === undefined || product.stock > 0) && (
            <button
              onClick={handleAdd}
              style={{
                width: 32, height: 32, borderRadius: '50%', background: 'var(--accent)',
                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: 'none', cursor: 'pointer', transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent-light)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--accent)')}
              aria-label="Agregar al carrito"
            >
              <ShoppingCart size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
