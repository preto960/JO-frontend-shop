'use client';

import React from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <body style={{
        margin: 0,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        background: 'var(--background)',
        color: 'var(--text)',
      }}>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}>
          <div style={{
            background: 'var(--card)',
            borderRadius: 20,
            padding: '40px 32px',
            maxWidth: 420,
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'var(--primary-gradient)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 20, color: 'var(--white)', fontWeight: 800, fontSize: 14,
              overflow: 'hidden',
            }}>
              <span style={{ position: 'relative', zIndex: 1 }}>JS</span>
            </div>
            <h2 style={{
              fontSize: 20, fontWeight: 700, color: 'var(--text)',
              marginBottom: 8,
            }}>
              Algo salio mal
            </h2>
            <p style={{
              fontSize: 14, color: 'var(--text-secondary)',
              marginBottom: 24, lineHeight: 1.6,
            }}>
              Ocurrio un error inesperado. Por favor intenta de nuevo.
            </p>
            <button
              onClick={reset}
              style={{
                padding: '12px 28px',
                borderRadius: 9999,
                border: 'none',
                background: 'var(--primary-gradient)',
                color: 'var(--white)',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 14,
                boxShadow: 'var(--shadow-accent)',
              }}
            >
              Reintentar
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
