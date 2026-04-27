'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { showToast } from '@/lib/utils';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword) {
      showToast('Completa todos los campos', 'error');
      return;
    }
    if (password !== confirmPassword) {
      showToast('Las contraseñas no coinciden', 'error');
      return;
    }
    if (password.length < 6) {
      showToast('La contraseña debe tener al menos 6 caracteres', 'error');
      return;
    }
    setLoading(true);
    try {
      await register(name, email, password);
      showToast('Cuenta creada exitosamente.', 'success');
      const savedRedirect = localStorage.getItem('joshop_redirect_after_login');
      if (savedRedirect) {
        localStorage.removeItem('joshop_redirect_after_login');
        router.push(savedRedirect);
      } else {
        router.push('/');
      }
    } catch (err: any) {
      showToast(err?.message || 'Error al registrarse', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'stretch',
      justifyContent: 'stretch',
      background: 'linear-gradient(135deg, #FF6B35 0%, #FF8C5E 50%, #FDCB6E 100%)',
    }}>
      {/* ── Left Side: Illustration (Desktop Only) ── */}
      <div style={{
        flex: '0 0 45%',
        display: 'none',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
        position: 'relative',
        overflow: 'hidden',
      }} className="hidden lg:flex">
        {/* Decorative circles */}
        <div style={{
          position: 'absolute', top: '-80px', left: '-80px',
          width: 220, height: 220, borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)',
        }} />
        <div style={{
          position: 'absolute', bottom: '-60px', right: '-60px',
          width: 180, height: 180, borderRadius: '50%',
          background: 'rgba(255,255,255,0.06)',
        }} />
        <div style={{
          position: 'absolute', bottom: '30%', left: '8%',
          width: 50, height: 50, borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)',
        }} />

        {/* Logo */}
        <div className="animate-fade-in" style={{
          width: 100, height: 100, borderRadius: '50%',
          background: 'rgba(255,255,255,0.2)',
          backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 24,
          border: '2px solid rgba(255,255,255,0.3)',
        }}>
          <span style={{ fontWeight: 800, fontSize: 36, color: '#fff', letterSpacing: -1 }}>JO</span>
        </div>

        <h1 style={{
          fontSize: 32, fontWeight: 800, color: '#fff',
          marginBottom: 8, textAlign: 'center',
          textShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}>
          Únete a JO-Shop
        </h1>
        <p style={{
          fontSize: 18, color: 'rgba(255,255,255,0.9)',
          fontWeight: 500, marginBottom: 40, textAlign: 'center',
          maxWidth: 300,
        }}>
          Crea tu cuenta y descubre los mejores productos
        </p>

        {/* Decorative food icons */}
        <div style={{ display: 'flex', gap: 16, fontSize: 32 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 56, height: 56, borderRadius: 14,
            background: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(6px)',
          }}>🛍️</span>
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 56, height: 56, borderRadius: 14,
            background: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(6px)',
          }}>📦</span>
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 56, height: 56, borderRadius: 14,
            background: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(6px)',
          }}>🎉</span>
        </div>
      </div>

      {/* ── Right Side: Form ── */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}>
        <div className="animate-fade-in" style={{
          background: '#FFFFFF',
          borderRadius: 20,
          padding: 36,
          maxWidth: 420,
          width: '100%',
          boxShadow: 'var(--shadow-xl)',
        }}>
          {/* Mobile Logo */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 8,
          }} className="lg:hidden">
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'var(--primary-gradient)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 12,
              boxShadow: 'var(--shadow-accent)',
            }}>
              <span style={{ fontWeight: 800, fontSize: 28, color: '#fff', letterSpacing: -0.5 }}>JO</span>
            </div>
          </div>

          {/* Desktop Logo (small) */}
          <div style={{
            display: 'none',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 8,
          }} className="lg:flex">
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'var(--primary-gradient)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 12,
              boxShadow: 'var(--shadow-accent)',
            }}>
              <span style={{ fontWeight: 800, fontSize: 24, color: '#fff' }}>JO</span>
            </div>
          </div>

          {/* Title */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <h1 style={{
              fontSize: 26, fontWeight: 700, color: 'var(--text)',
              marginBottom: 4,
            }}>
              Crear cuenta
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
              Regístrate en JO-Shop para comenzar
            </p>
          </div>

          <form onSubmit={handleRegister}>
            {/* Name */}
            <div style={{ marginBottom: 16 }}>
              <label style={{
                display: 'block', fontSize: 13, fontWeight: 600,
                color: 'var(--text)', marginBottom: 7,
              }}>
                Nombre completo
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre"
                autoComplete="name"
                style={{
                  height: 46,
                  borderRadius: 10,
                  border: '2px solid var(--border)',
                  padding: '0 14px',
                  fontSize: 15,
                  background: 'var(--white)',
                }}
              />
            </div>

            {/* Email */}
            <div style={{ marginBottom: 16 }}>
              <label style={{
                display: 'block', fontSize: 13, fontWeight: 600,
                color: 'var(--text)', marginBottom: 7,
              }}>
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                autoComplete="email"
                style={{
                  height: 46,
                  borderRadius: 10,
                  border: '2px solid var(--border)',
                  padding: '0 14px',
                  fontSize: 15,
                  background: 'var(--white)',
                }}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 16 }}>
              <label style={{
                display: 'block', fontSize: 13, fontWeight: 600,
                color: 'var(--text)', marginBottom: 7,
              }}>
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                autoComplete="new-password"
                style={{
                  height: 46,
                  borderRadius: 10,
                  border: '2px solid var(--border)',
                  padding: '0 14px',
                  fontSize: 15,
                  background: 'var(--white)',
                }}
              />
            </div>

            {/* Confirm Password */}
            <div style={{ marginBottom: 26 }}>
              <label style={{
                display: 'block', fontSize: 13, fontWeight: 600,
                color: 'var(--text)', marginBottom: 7,
              }}>
                Confirmar contraseña
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite tu contraseña"
                autoComplete="new-password"
                style={{
                  height: 46,
                  borderRadius: 10,
                  border: '2px solid var(--border)',
                  padding: '0 14px',
                  fontSize: 15,
                  background: 'var(--white)',
                }}
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                height: 46,
                borderRadius: 10,
                background: loading ? 'var(--primary-hover)' : 'var(--primary-gradient)',
                color: 'white',
                fontSize: 16,
                fontWeight: 700,
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                boxShadow: loading ? 'none' : 'var(--shadow-accent)',
                opacity: loading ? 0.8 : 1,
                transition: 'all 0.25s ease',
              }}
            >
              {loading && (
                <div style={{
                  width: 18, height: 18,
                  border: '2.5px solid rgba(255,255,255,0.3)',
                  borderTopColor: 'white',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }} />
              )}
              {loading ? 'Registrando...' : 'Crear cuenta'}
            </button>
          </form>

          {/* Login link */}
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
              ¿Ya tienes cuenta?{' '}
            </span>
            <a href="/login" style={{
              fontSize: 14, color: 'var(--primary)',
              fontWeight: 700, textDecoration: 'none',
              transition: 'color 0.2s ease',
            }}>
              Inicia sesión
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
