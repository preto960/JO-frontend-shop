'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

/**
 * Píldora flotante del carrito — firma de Liquid Neon.
 * Vive abajo al centro en las vistas de cliente cuando hay items;
*  se oculta en carrito/checkout para no duplicar la acción.
 */
export default function FloatCartPill() {
  const [count, setCount] = useState(0);
  const [total, setTotal] = useState(0);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const update = () => {
      try {
        const cart = JSON.parse(localStorage.getItem('joshop_cart') || '[]');
        setCount(cart.reduce((s: number, i: any) => s + (i.quantity || 1), 0));
        setTotal(cart.reduce((s: number, i: any) => s + ((i.price || i.productPrice || 0) * (i.quantity || 1)), 0));
      } catch {
        setCount(0); setTotal(0);
      }
    };
    update();
    window.addEventListener('cartUpdated', update);
    window.addEventListener('storage', update);
    return () => {
      window.removeEventListener('cartUpdated', update);
      window.removeEventListener('storage', update);
    };
  }, [pathname]);

  const hidden = count === 0 || pathname === '/cart' || pathname === '/checkout' || pathname.startsWith('/admin');
  if (hidden) return null;

  return (
    <div
      onClick={() => router.push('/cart')}
      style={{
        position: 'fixed', bottom: 18, left: '50%', transform: 'translateX(-50%)', zIndex: 90,
        display: 'flex', alignItems: 'center', gap: 12,
        background: 'var(--paper2)', border: '1px solid var(--neon-line)',
        borderRadius: 99, padding: '10px 20px', cursor: 'pointer',
        boxShadow: 'var(--shadow-md)', fontSize: 13, color: 'var(--text)',
        transition: 'transform .15s cubic-bezier(.34,1.56,.64,1)',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateX(-50%) scale(1.04)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateX(-50%)'; }}
    >
      <span style={{
        background: 'var(--neon)', color: 'var(--accent-ink)',
        fontWeight: 700, width: 24, height: 24, borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12,
      }}>
        {count}
      </span>
      <span>Carrito</span>
      <span className="font-mono-l" style={{ color: 'var(--head)', fontWeight: 600 }}>${total.toFixed(2)}</span>
      <span className="lime" style={{ fontWeight: 700 }}>Pedir →</span>
    </div>
  );
}
