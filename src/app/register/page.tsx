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
    color: 'var(--primary)',
    bgColor: 'var(--primary-light)',
  },
  {
    key: 'delivery',
    label: 'Delivery',
    description: 'Realizar entregas de pedidos',
    Icon: Bike,
    color: 'var(--teal)',
    bgColor: 'var(--teal-light)',
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
    { label: '6+ caracteres', met: password.length >= 6 },
    { label: '1 mayúscula', met: /[A-Z]/.test(password) },
    { label: '1 número', met: /[0-9]/.test(password) },
  ];
  const passwordsMatch = password.length > 0 && confirmPassword.length > 0 && password === confirmPassword;
  const allRulesMet = passwordRules.every(r => r.met) && passwordsMatch;

  const clearErrors = () => setLocalError('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();

    if (!selectedRole) { showToast('Selecciona un tipo de cuenta', 'error'); return; }
    if (!name.trim() || name.trim().length < 2) { showToast('El nombre debe tener al menos 2 caracteres', 'error'); return; }
    if (!email.trim()) { showToast('Ingresa tu correo electrónico', 'error'); return; }
    if (password.length < 6) { showToast('La contraseña debe tener al menos 6 caracteres', 'error'); return; }
    if (!/[A-Z]/.test(password)) { showToast('La contraseña debe tener al menos una mayúscula', 'error'); return; }
    if (!/[0-9]/.test(password)) { showToast('La contraseña debe tener al menos un número', 'error'); return; }
    if (password !== confirmPassword) { showToast('Las contraseñas no coinciden', 'error'); return; }

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

  const inputWrapperStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center',
    background: 'var(--input-bg)',
    borderRadius: 12,
    border: '1.5px solid var(--border)',
    padding: '0 14px',
    height: 48,
    gap: 10,
    transition: 'border-color 0.2s ease',
  };

  const inputInnerStyle: React.CSSProperties = {
    flex: 1, height: '100%', border: 'none', outline: 'none',
    fontSize: 14, background: 'transparent', color: 'var(--text)',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 5,
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
        <div style={{ position: 'absolute', top: '-80px', left: '-80px', width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
        <div style={{ position: 'absolute', bottom: '-60px', right: '-60px', width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ position: 'absolute', bottom: '30%', left: '8%', width: 50, height: 50, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />

        <div className="animate-fade-in" style={{
          width: 120, height: 120, borderRadius: 20,
          background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 24, border: '2px solid rgba(255,255,255,0.3)',
        }}>
          {shopLogoUrl ? (
            <img src={shopLogoUrl} alt={shopName} style={{ width: 100, height: 100, borderRadius: 14, objectFit: 'contain' }} />
          ) : (
            <span style={{ fontWeight: 800, fontSize: 36, color: 'var(--white)', letterSpacing: -1 }}>{shopName.slice(0, 2).toUpperCase()}</span>
          )}
        </div>

        <h1 style={{ fontSize: 32, fontWeight: 800, color: 'var(--white)', marginBottom: 8, textAlign: 'center', textShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          Únete a {shopName}
        </h1>
        <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.9)', fontWeight: 500, marginBottom: 40, textAlign: 'center', maxWidth: 300 }}>
          Crea tu cuenta y descubre los mejores productos
        </p>

        <div style={{ display: 'flex', gap: 16, fontSize: 32 }}>
          {['🛍️', '📦', '🎉'].map((emoji, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 56, height: 56, borderRadius: 14, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(6px)' }}>{emoji}</span>
          ))}
        </div>
      </div>

      {/* Right Side: Form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, overflowY: 'auto' }}>
        <div className="animate-fade-in" style={{
          background: 'var(--card)', borderRadius: 20, padding: '28px 24px',
          maxWidth: 480, width: '100%', boxShadow: 'var(--shadow-xl)',
        }}>
          {/* Logo (mobile + desktop) */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
            {shopLogoUrl ? (
              <img src={shopLogoUrl} alt={shopName} style={{ width: 90, height: 90, borderRadius: 16, objectFit: 'contain', marginBottom: 8, boxShadow: 'var(--shadow-accent)' }} />
            ) : (
              <div style={{ width: 70, height: 70, borderRadius: 16, background: 'var(--primary-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8, boxShadow: 'var(--shadow-accent)' }}>
                <span style={{ fontWeight: 800, fontSize: 24, color: 'var(--white)' }}>{shopName.slice(0, 2).toUpperCase()}</span>
              </div>
            )}
          </div>

          {/* Title */}
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Crear cuenta</h1>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Regístrate para empezar a usar {shopName}</p>
          </div>

          {/* Error */}
          {localError && (
            <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'var(--accent-light)', borderRadius: 10, padding: '8px 10px', marginBottom: 14, gap: 8 }}>
              <AlertCircle size={16} color="var(--danger)" style={{ flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 12, color: 'var(--danger)', fontWeight: 500 }}>{localError}</span>
              <button onClick={clearErrors} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}><X size={14} color="var(--text-secondary)" /></button>
            </div>
          )}

          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Role Selection - Compact inline */}
            <div>
              <label style={{ ...labelStyle, marginBottom: 6 }}>Tipo de cuenta</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {ROLE_OPTIONS.map(option => {
                  const isSelected = selectedRole === option.key;
                  const { Icon } = option;
                  return (
                    <button key={option.key} type="button" onClick={() => setSelectedRole(option.key)}
                      style={{
                        flex: 1, background: isSelected ? option.bgColor : 'var(--input-bg)',
                        borderRadius: 12, border: `1.5px solid ${isSelected ? option.color : 'var(--border)'}`,
                        padding: '10px 8px', display: 'flex', alignItems: 'center', gap: 8,
                        position: 'relative', cursor: 'pointer', transition: 'all 0.2s ease',
                        boxShadow: isSelected ? `0 2px 8px ${option.color}22` : 'none',
                      }}>
                      {isSelected && (
                        <div style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: 9, backgroundColor: option.color, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.15)' }}>
                          <Check size={11} color="var(--white)" />
                        </div>
                      )}
                      <div style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: isSelected ? option.color : 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.2s ease' }}>
                        <Icon size={18} color={isSelected ? 'var(--white)' : option.color} />
                      </div>
                      <div style={{ textAlign: 'left' }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: isSelected ? option.color : 'var(--text)', display: 'block' }}>{option.label}</span>
                        <span style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.2 }}>{option.description}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Name + Email in 2 columns */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={labelStyle}>Nombre completo</label>
                <div style={inputWrapperStyle}>
                  <User size={18} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
                  <input type="text" value={name} onChange={(e) => { setName(e.target.value); clearErrors(); }} placeholder="Tu nombre" autoComplete="name" style={inputInnerStyle} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Correo electrónico</label>
                <div style={inputWrapperStyle}>
                  <Mail size={18} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
                  <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); clearErrors(); }} placeholder="tu@correo.com" autoComplete="email" style={inputInnerStyle} />
                </div>
              </div>
            </div>

            {/* Password + Confirm in 2 columns */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={labelStyle}>Contraseña</label>
                <div style={inputWrapperStyle}>
                  <Lock size={18} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => { setPassword(e.target.value); clearErrors(); }} placeholder="Mínimo 6 car." autoComplete="new-password" style={inputInnerStyle} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div>
                <label style={labelStyle}>Confirmar contraseña</label>
                <div style={{
                  ...inputWrapperStyle,
                  border: confirmPassword.length > 0
                    ? `1.5px solid ${passwordsMatch ? 'var(--success)' : 'var(--danger)'}`
                    : '1.5px solid var(--border)',
                }}>
                  <Lock size={18} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
                  <input type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); clearErrors(); }} placeholder="Repite contraseña" autoComplete="new-password" style={inputInnerStyle} />
                  {confirmPassword.length > 0 && (
                    passwordsMatch
                      ? <Check size={18} color="var(--success)" style={{ flexShrink: 0 }} />
                      : <X size={18} color="var(--danger)" style={{ flexShrink: 0 }} />
                  )}
                </div>
              </div>
            </div>

            {/* Password Rules - Compact inline */}
            {password.length > 0 && (
              <div style={{
                display: 'flex', gap: 12, padding: '8px 12px', borderRadius: 10,
                background: allRulesMet ? 'var(--success-light)' : 'var(--input-bg)',
                border: `1px solid ${allRulesMet ? 'var(--success)' : 'var(--border)'}`,
              }}>
                {passwordRules.map((rule, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: rule.met ? 'var(--success)' : 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s ease' }}>
                      {rule.met && <Check size={9} color="var(--white)" />}
                    </div>
                    <span style={{ fontSize: 11, color: rule.met ? 'var(--success)' : 'var(--text-secondary)', fontWeight: rule.met ? 600 : 400 }}>{rule.label}</span>
                  </div>
                ))}
                {password.length > 0 && confirmPassword.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: passwordsMatch ? 'var(--success)' : 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {passwordsMatch && <Check size={9} color="var(--white)" />}
                    </div>
                    <span style={{ fontSize: 11, color: passwordsMatch ? 'var(--success)' : 'var(--text-secondary)', fontWeight: passwordsMatch ? 600 : 400 }}>Coinciden</span>
                  </div>
                )}
              </div>
            )}

            {/* Submit */}
            <button type="submit" disabled={loading} style={{
              width: '100%', height: 48, borderRadius: 12,
              background: loading ? 'var(--primary-hover)' : 'var(--primary-gradient)',
              color: 'var(--white)', fontSize: 15, fontWeight: 700, border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              boxShadow: loading ? 'none' : 'var(--shadow-accent)', opacity: loading ? 0.8 : 1,
              transition: 'all 0.25s ease', marginTop: 2,
            }}>
              {loading && (
                <div style={{ width: 16, height: 16, border: '2.5px solid rgba(255,255,255,0.3)', borderTopColor: 'var(--white)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              )}
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>

          {/* Login link */}
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              ¿Ya tienes cuenta?{' '}
            </span>
            <a href="/login" style={{
              fontSize: 13, color: 'var(--primary)',
              fontWeight: 600, textDecoration: 'none',
              transition: 'color 0.2s ease',
            }}>
              Inicia sesión
            </a>
          </div>

          {/* Back to home */}
          <div style={{ textAlign: 'center', marginTop: 10 }}>
            <a href="/" style={{ fontSize: 13, color: 'var(--text-secondary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, transition: 'color 0.2s ease' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              Volver al inicio
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
