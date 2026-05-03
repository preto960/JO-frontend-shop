'use client';

import React from 'react';

export default function OrdersError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--background)',
      padding: 24,
    }}>
      <div style={{
        background: 'var(--white)',
        borderRadius: 20,
        padding: '40px 32px',
        maxWidth: 420,
        width: '100%',
        textAlign: 'center',
        boxShadow: 'var(--shadow-lg)',
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'var(--danger-light)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 20,
        }}>
          <span style={{ fontSize: 28 }}>&#9888;</span>
        </div>
        <h2 style={{
          fontSize: 20, fontWeight: 700, color: 'var(--text)',
          marginBottom: 8,
        }}>
          Error al cargar pedidos
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
            borderRadius: 'var(--radius-full)',
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
  );
}
