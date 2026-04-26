'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { showToast } from '@/lib/utils';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpEmail, setOtpEmail] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const { login, verifyOtp } = useAuth();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Completa todos los campos', 'error');
      return;
    }
    setLoading(true);
    try {
      const result = await login(email, password);
      if (result.requiresOtp) {
        setOtpEmail(result.email || email);
      } else {
        router.push('/home');
      }
    } catch (err: any) {
      showToast(err?.message || 'Error al iniciar sesión', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode) {
      showToast('Ingresa el código de verificación', 'error');
      return;
    }
    setLoading(true);
    try {
      await verifyOtp(otpEmail!, otpCode);
      showToast('Verificación exitosa', 'success');
      router.push('/home');
    } catch (err: any) {
      showToast(err?.message || 'Código inválido', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
      padding: 16,
    }}>
      <div className="animate-fade-in" style={{
        background: 'var(--white)', borderRadius: 16, padding: 32,
        maxWidth: 400, width: '100%', boxShadow: 'var(--shadow-lg)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%', background: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 24, color: 'white', margin: '0 auto 12px',
          }}>
            JO
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)' }}>JO-Shop</h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>
            {otpEmail ? 'Verificación en dos pasos' : 'Inicia sesión en tu cuenta'}
          </p>
        </div>

        {!otpEmail ? (
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text)', marginBottom: 6 }}>
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                autoComplete="email"
              />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text)', marginBottom: 6 }}>
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '12px', borderRadius: 8,
                background: loading ? 'var(--accent-light)' : 'var(--accent)',
                color: 'white', fontSize: 15, fontWeight: 600,
                border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              {loading && <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />}
              {loading ? 'Ingresando...' : 'Iniciar sesión'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp}>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16, textAlign: 'center' }}>
              Se envió un código de verificación a <strong>{otpEmail}</strong>
            </p>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text)', marginBottom: 6 }}>
                Código de verificación
              </label>
              <input
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="000000"
                maxLength={6}
                style={{ textAlign: 'center', fontSize: 24, letterSpacing: 8 }}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '12px', borderRadius: 8,
                background: loading ? 'var(--accent-light)' : 'var(--accent)',
                color: 'white', fontSize: 15, fontWeight: 600,
                border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              {loading && <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />}
              {loading ? 'Verificando...' : 'Verificar'}
            </button>
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            ¿No tienes cuenta?{' '}
          </span>
          <a href="/register" style={{ fontSize: 14, color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
            Regístrate
          </a>
        </div>
      </div>
    </div>
  );
}
