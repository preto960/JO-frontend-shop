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
  confirmColor = 'var(--accent)', onConfirm, onCancel, children,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: 16,
      }}
      onClick={onCancel}
    >
      <div
        className="animate-fade-in"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--white)', borderRadius: 16, padding: 24,
          maxWidth: 480, width: '100%', maxHeight: '90vh', overflowY: 'auto',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>{title}</h2>
          <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 4 }}>
            <X size={20} />
          </button>
        </div>

        {message && (
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.5 }}>
            {message}
          </p>
        )}

        {children}

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
          <button
            onClick={onCancel}
            style={{
              padding: '10px 20px', borderRadius: 8, border: '1px solid var(--border)',
              background: 'var(--white)', color: 'var(--text)', cursor: 'pointer',
              fontWeight: 500, fontSize: 14,
            }}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '10px 20px', borderRadius: 8, border: 'none',
              background: confirmColor, color: 'white', cursor: 'pointer',
              fontWeight: 500, fontSize: 14,
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
