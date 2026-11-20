'use client';

import { useEffect, useState } from 'react';

/**
 * Conmutador de tema Liquid Neon (dark ↔ light).
 * Aplica data-theme en <html> y persiste en localStorage('jo-theme').
 * El script de layout.tsx ya fija el tema antes de pintar (dark default);
 * este componente solo lo alterna.
 */
export default function ThemeToggle({ size = 34 }: { size?: number }) {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const t = document.documentElement.getAttribute('data-theme');
    setTheme(t === 'light' ? 'light' : 'dark');
  }, []);

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('jo-theme', next); } catch {}
    setTheme(next);
  };

  return (
    <button
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
      title={theme === 'dark' ? 'Tema claro' : 'Tema oscuro'}
      style={{
        width: size, height: size,
        borderRadius: 12,
        background: 'var(--neon-bg)',
        border: '1px solid var(--neon-line)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.45,
        cursor: 'pointer',
        color: 'var(--neon-strong)',
        transition: 'transform .15s cubic-bezier(.34,1.56,.64,1)',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.08)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'none'; }}
    >
      {theme === 'dark' ? '☀' : '🌙'}
    </button>
  );
}
