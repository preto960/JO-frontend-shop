'use client';

import React from 'react';
import { X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: string;
  onConfirm: () => void;
  onCancel: () => void;
  children?: React.ReactNode;
}

export default function ConfirmModal({
  isOpen, title, message, confirmText = 'Confirmar', cancelText = 'Cancelar',
  confirmColor, onConfirm, onCancel, children,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(26,29,41,0.6)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: 20,
      }}
      onClick={onCancel}
    >
      <div
        className="animate-fade-in-scale"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--white)',
          borderRadius: 'var(--radius-xl)',
          padding: 28,
          maxWidth: 480,
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: 'var(--shadow-xl)',
        }}
      >
        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.3px' }}>{title}</h2>
          <button
            onClick={onCancel}
            style={{
              background: 'var(--input-bg)',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              borderRadius: '50%',
              transition: 'var(--transition-fast)',
            }}
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        {message && (
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>
            {message}
          </p>
        )}

        {children}

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
          <button
            onClick={onCancel}
            style={{
              padding: '11px 22px',
              borderRadius: 10,
              border: '2px solid var(--border)',
              background: 'var(--white)',
              color: 'var(--text)',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: 14,
              transition: 'var(--transition-fast)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--input-bg)';
              e.currentTarget.style.borderColor = 'var(--text-light)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--white)';
              e.currentTarget.style.borderColor = 'var(--border)';
            }}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '11px 22px',
              borderRadius: 10,
              border: 'none',
              background: confirmColor || 'var(--primary-gradient)',
              color: 'white',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 14,
              boxShadow: 'var(--shadow-accent)',
              transition: 'var(--transition-fast)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = 'var(--shadow-accent)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'var(--shadow-accent)';
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
