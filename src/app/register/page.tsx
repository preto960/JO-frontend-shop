'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useConfig } from '@/contexts/ConfigContext';
import { showToast } from '@/lib/utils';
import { ShoppingBag, Bike, User, Mail, Lock, Eye, EyeOff, Check, X, AlertCircle } from 'lucide-react';

const ROLE_OPTIONS = [
  {
    key: 'customer',
    label: 'Cliente',
    description: 'Comprar productos y hacer pedidos',
    Icon: ShoppingBag,
    color: '#FF6B35',
    bgColor: '#FF6B3515',
  },
  {
    key: 'delivery',
    label: 'Delivery',
    description: 'Realizar entregas de pedidos',
    Icon: Bike,
    color: '#1ABC9C',
    bgColor: '#1ABC9C15',
  },
];

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('customer');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');
  const { register } = useAuth();
  const { config } = useConfig();
  const shopName = config.shop_name || 'JO-Shop';
  const shopLogoUrl = config.shop_logo_url || '';
  const router = useRouter();

  // Password rules
  const passwordRules = [
    { label: 'Al menos 6 caracteres', met: password.length >= 6 },
    { label: 'Una letra mayúscula', met: /[A-Z]/.test(password) },
    { label: 'Un número', met: /[0-9]/.test(password) },
  ];
  const passwordsMatch = password.length > 0 && confirmPassword.length > 0 && password === confirmPassword;
  const allRulesMet = passwordRules.every(r => r.met) && passwordsMatch;

  const clearErrors = () => setLocalError('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();

    if (!selectedRole) {
      showToast('Selecciona un tipo de cuenta', 'error');
      return;
    }
    if (!name.trim() || name.trim().length < 2) {
      showToast('El nombre debe tener al menos 2 caracteres', 'error');
      return;
    }
    if (!email.trim()) {
      showToast('Ingresa tu correo electrónico', 'error');
      return;
    }
    if (password.length < 6) {
      showToast('La contraseña debe tener al menos 6 caracteres', 'error');
      return;
    }
    if (!/[A-Z]/.test(password)) {
      showToast('La contraseña debe tener al menos una mayúscula', 'error');
      return;
    }
    if (!/[0-9]/.test(password)) {
      showToast('La contraseña debe tener al menos un número', 'error');
      return;
    }
    if (password !== confirmPassword) {
      showToast('Las contraseñas no coinciden', 'error');
      return;
    }

    setLoading(true);
    try {
      await register(name.trim(), email.trim().toLowerCase(), password, selectedRole);
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

  const errorMessage = localError;

  const inputBaseStyle: React.CSSProperties = {
    height: 52,
    borderRadius: 12,
    border: '1.5px solid var(--border)',
    padding: '0 14px',
    fontSize: 15,
    background: 'var(--input-bg, #F8F9FA)',
    width: '100%',
    boxSizing: 'border-box',
    outline: 'none',
    color: 'var(--text)',
    transition: 'border-color 0.2s ease',
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'stretch',
      justifyContent: 'stretch',
      background: 'var(--primary-gradient)',
    }}>
      {/* Left Side: Illustration (Desktop Only) */}
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
          width: 120, height: 120, borderRadius: 20,
          background: 'rgba(255,255,255,0.2)',
          backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 24,
          border: '2px solid rgba(255,255,255,0.3)',
        }}>
          {shopLogoUrl ? (
            <img src={shopLogoUrl} alt={shopName} style={{ width: 100, height: 100, borderRadius: 14, objectFit: 'contain' }} />
          ) : (
            <span style={{ fontWeight: 800, fontSize: 36, color: '#fff', letterSpacing: -1 }}>{shopName.slice(0, 2).toUpperCase()}</span>
          )}
        </div>

        <h1 style={{
          fontSize: 32, fontWeight: 800, color: '#fff',
          marginBottom: 8, textAlign: 'center',
          textShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}>
          Únete a {shopName}
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

      {/* Right Side: Form */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        overflowY: 'auto',
      }}>
        <div className="animate-fade-in" style={{
          background: '#FFFFFF',
          borderRadius: 20,
          padding: '32px 28px',
          maxWidth: 440,
          width: '100%',
          boxShadow: 'var(--shadow-xl)',
        }}>
          {/* Mobile Logo */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 4,
          }} className="lg:hidden">
            {shopLogoUrl ? (
              <img src={shopLogoUrl} alt={shopName} style={{ width: 100, height: 100, borderRadius: 16, objectFit: 'contain', marginBottom: 8, boxShadow: 'var(--shadow-accent)' }} />
            ) : (
              <div style={{
                width: 80, height: 80, borderRadius: 16,
                background: 'var(--primary-gradient)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 8,
                boxShadow: 'var(--shadow-accent)',
              }}>
                <span style={{ fontWeight: 800, fontSize: 26, color: '#fff', letterSpacing: -0.5 }}>{shopName.slice(0, 2).toUpperCase()}</span>
              </div>
            )}
          </div>

          {/* Desktop Logo */}
          <div style={{
            display: 'none',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 4,
          }} className="lg:flex">
            {shopLogoUrl ? (
              <img src={shopLogoUrl} alt={shopName} style={{ width: 100, height: 100, borderRadius: 16, objectFit: 'contain', marginBottom: 8, boxShadow: 'var(--shadow-accent)' }} />
            ) : (
              <div style={{
                width: 80, height: 80, borderRadius: 16,
                background: 'var(--primary-gradient)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 8,
                boxShadow: 'var(--shadow-accent)',
              }}>
                <span style={{ fontWeight: 800, fontSize: 26, color: '#fff' }}>{shopName.slice(0, 2).toUpperCase()}</span>
              </div>
            )}
          </div>

          {/* Title */}
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <h1 style={{
              fontSize: 24, fontWeight: 700, color: 'var(--text)',
              marginBottom: 4,
            }}>
              Crear cuenta
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
              Regístrate para empezar a usar {shopName}
            </p>
          </div>

          {/* Error */}
          {errorMessage && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#FDE8EC',
              borderRadius: 10,
              padding: '10px 12px',
              marginBottom: 16,
              gap: 8,
            }}>
              <AlertCircle size={18} color="var(--primary)" style={{ flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 13, color: 'var(--primary)', fontWeight: 500 }}>{errorMessage}</span>
              <button onClick={clearErrors} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
                <X size={16} color="var(--text-secondary)" />
              </button>
            </div>
          )}

          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Role Selection */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>
                Tipo de cuenta
              </label>
              <div style={{ display: 'flex', gap: 10 }}>
                {ROLE_OPTIONS.map(option => {
                  const isSelected = selectedRole === option.key;
                  const { Icon } = option;
                  return (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => setSelectedRole(option.key)}
                      style={{
                        flex: 1,
                        background: isSelected ? option.bgColor : '#F8F9FA',
                        borderRadius: 14,
                        border: `1.5px solid ${isSelected ? option.color : 'var(--border)'}`,
                        padding: '16px 10px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        position: 'relative',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: isSelected ? `0 2px 8px ${option.color}22` : 'none',
                      }}
                    >
                      {/* Check badge */}
                      {isSelected && (
                        <div style={{
                          position: 'absolute', top: -8, right: -8,
                          width: 22, height: 22, borderRadius: 11,
                          backgroundColor: option.color,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                        }}>
                          <Check size={13} color="#fff" />
                        </div>
                      )}

                      {/* Icon */}
                      <div style={{
                        width: 46, height: 46, borderRadius: 23,
                        backgroundColor: isSelected ? option.color : '#E9ECEF',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        marginBottom: 8,
                        transition: 'background 0.2s ease',
                      }}>
                        <Icon size={22} color={isSelected ? '#fff' : option.color} />
                      </div>

                      {/* Label */}
                      <span style={{
                        fontSize: 14, fontWeight: 700,
                        color: isSelected ? option.color : 'var(--text)',
                        marginBottom: 2,
                      }}>
                        {option.label}
                      </span>

                      {/* Description */}
                      <span style={{
                        fontSize: 11, color: 'var(--text-secondary)',
                        textAlign: 'center', lineHeight: 1.3,
                      }}>
                        {option.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Name */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 7 }}>
                Nombre completo
              </label>
              <div style={{
                display: 'flex', alignItems: 'center',
                background: 'var(--input-bg, #F8F9FA)',
                borderRadius: 12,
                border: '1.5px solid var(--border)',
                padding: '0 14px',
                height: 52,
                gap: 10,
                transition: 'border-color 0.2s ease',
              }}>
                <User size={20} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); clearErrors(); }}
                  placeholder="Tu nombre"
                  autoComplete="name"
                  style={{
                    flex: 1, height: '100%', border: 'none', outline: 'none',
                    fontSize: 15, background: 'transparent', color: 'var(--text)',
                  }}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 7 }}>
                Correo electrónico
              </label>
              <div style={{
                display: 'flex', alignItems: 'center',
                background: 'var(--input-bg, #F8F9FA)',
                borderRadius: 12,
                border: '1.5px solid var(--border)',
                padding: '0 14px',
                height: 52,
                gap: 10,
                transition: 'border-color 0.2s ease',
              }}>
                <Mail size={20} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); clearErrors(); }}
                  placeholder="tu@correo.com"
                  autoComplete="email"
                  style={{
                    flex: 1, height: '100%', border: 'none', outline: 'none',
                    fontSize: 15, background: 'transparent', color: 'var(--text)',
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 7 }}>
                Contraseña
              </label>
              <div style={{
                display: 'flex', alignItems: 'center',
                background: 'var(--input-bg, #F8F9FA)',
                borderRadius: 12,
                border: '1.5px solid var(--border)',
                padding: '0 14px',
                height: 52,
                gap: 10,
                transition: 'border-color 0.2s ease',
              }}>
                <Lock size={20} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); clearErrors(); }}
                  placeholder="Mínimo 6 caracteres, 1 mayúscula, 1 número"
                  autoComplete="new-password"
                  style={{
                    flex: 1, height: '100%', border: 'none', outline: 'none',
                    fontSize: 15, background: 'transparent', color: 'var(--text)',
                  }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: 4,
                  color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Password Rules Indicator */}
            {password.length > 0 && (
              <div style={{
                backgroundColor: 'var(--input-bg, #F8F9FA)',
                borderRadius: 12,
                padding: '12px 14px',
                border: '1px solid var(--border)',
                animation: 'fadeSlideIn 0.2s ease',
              }}>
                <p style={{
                  fontSize: 12, fontWeight: 700,
                  color: allRulesMet ? 'var(--success)' : 'var(--text-secondary)',
                  marginBottom: 6,
                }}>
                  {allRulesMet ? 'Contraseña válida' : 'Requisitos de contraseña:'}
                </p>
                {passwordRules.map((rule, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <div style={{
                      width: 16, height: 16, borderRadius: 8,
                      backgroundColor: rule.met ? 'var(--success)' : 'var(--border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'background 0.2s ease',
                    }}>
                      {rule.met && <Check size={10} color="#fff" />}
                    </div>
                    <span style={{
                      fontSize: 12,
                      color: rule.met ? 'var(--success)' : 'var(--text-secondary)',
                      fontWeight: rule.met ? 600 : 400,
                      transition: 'color 0.2s ease',
                    }}>
                      {rule.label}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Confirm Password */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 7 }}>
                Confirmar contraseña
              </label>
              <div style={{
                display: 'flex', alignItems: 'center',
                background: 'var(--input-bg, #F8F9FA)',
                borderRadius: 12,
                border: confirmPassword.length > 0
                  ? `1.5px solid ${passwordsMatch ? 'var(--success)' : '#EF4444'}`
                  : '1.5px solid var(--border)',
                padding: '0 14px',
                height: 52,
                gap: 10,
                transition: 'border-color 0.2s ease',
              }}>
                <Lock size={20} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); clearErrors(); }}
                  placeholder="Repite tu contraseña"
                  autoComplete="new-password"
                  style={{
                    flex: 1, height: '100%', border: 'none', outline: 'none',
                    fontSize: 15, background: 'transparent', color: 'var(--text)',
                  }}
                />
                {confirmPassword.length > 0 && (
                  passwordsMatch
                    ? <Check size={20} color="var(--success)" style={{ flexShrink: 0 }} />
                    : <X size={20} color="#EF4444" style={{ flexShrink: 0 }} />
                )}
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                height: 50,
                borderRadius: 12,
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
                marginTop: 4,
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
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>

          {/* Login link */}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}>
            <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
              ¿Ya tienes cuenta?{' '}
            </span>
            <a href="/login" style={{
              fontSize: 14, color: 'var(--primary)',
              fontWeight: 600, textDecoration: 'none',
              marginLeft: 4,
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
