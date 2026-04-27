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
        background: '#F5F6FA',
        color: '#2D3436',
      }}>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: 20,
            padding: '40px 32px',
            maxWidth: 420,
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'linear-gradient(135deg, #FF6B35, #FF8C5E)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 20, color: 'white', fontWeight: 800, fontSize: 16,
            }}>
              JO
            </div>
            <h2 style={{
              fontSize: 20, fontWeight: 700, color: '#2D3436',
              marginBottom: 8,
            }}>
              Algo salio mal
            </h2>
            <p style={{
              fontSize: 14, color: '#636E72',
              marginBottom: 24, lineHeight: 1.6,
            }}>
              Ocurrio un error inesperado en JO-Shop. Por favor intenta de nuevo.
            </p>
            <button
              onClick={reset}
              style={{
                padding: '12px 28px',
                borderRadius: 9999,
                border: 'none',
                background: 'linear-gradient(135deg, #FF6B35, #FF8C5E)',
                color: 'white',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 14,
                boxShadow: '0 4px 14px rgba(255,107,53,0.3)',
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
