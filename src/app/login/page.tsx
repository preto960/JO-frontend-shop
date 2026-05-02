'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useConfig } from '@/contexts/ConfigContext';
import { showToast } from '@/lib/utils';
import { ArrowLeft, ShieldCheck, RefreshCw, Smartphone, KeyRound, Copy, Check, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  // 2FA state
  const [otpEmail, setOtpEmail] = useState<string | null>(null);
  const [otpTwoFactorType, setOtpTwoFactorType] = useState<string>('email');
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);
  // Backup code state
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [backupCodeInput, setBackupCodeInput] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { login, verifyOtp, resendOtpCode, isDelivery, isLoading, user } = useAuth();
  const { config } = useConfig();
  const shopName = config.shop_name || 'JO-Shop';
  const shopLogoUrl = config.shop_logo_url || '';
  const router = useRouter();

  // If already logged in, redirect away from login
  useEffect(() => {
    if (!isLoading && user) {
      const savedRedirect = localStorage.getItem('joshop_redirect_after_login');
      if (savedRedirect) {
        localStorage.removeItem('joshop_redirect_after_login');
        router.replace(savedRedirect);
      } else if (isDelivery) {
        router.replace('/deliveries');
      } else {
        router.replace('/');
      }
    }
  }, [isLoading, user, isDelivery, router]);

  // Countdown timer for resend button
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer(prev => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Auto-focus first OTP input when switching to OTP view
  useEffect(() => {
    if (otpEmail && !useBackupCode && inputRefs.current[0]) {
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [otpEmail, useBackupCode]);

  const redirectByRole = () => {
    const savedRedirect = localStorage.getItem('joshop_redirect_after_login');
    if (savedRedirect) {
      localStorage.removeItem('joshop_redirect_after_login');
      router.replace(savedRedirect);
      return;
    }
    if (isDelivery) {
      router.replace('/deliveries');
    } else {
      router.replace('/');
    }
  };

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
        setOtpTwoFactorType(result.twoFactorType || 'email');
        setUseBackupCode(false);
        setBackupCodeInput('');
        if (result.twoFactorType !== 'totp') {
          setResendTimer(60); // Only for email, TOTP has no resend
        }
      } else if (result.error) {
        showToast(result.error, 'error');
      } else {
        redirectByRole();
      }
    } catch (err: any) {
      showToast(err?.message || 'Error al iniciar sesión', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...otpCode];
    newCode[index] = value.slice(-1);
    setOtpCode(newCode);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      const newCode = pasted.split('');
      setOtpCode(newCode);
      inputRefs.current[5]?.focus();
    }
  };

  const codeString = otpCode.join('');

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (useBackupCode) {
      if (!backupCodeInput.trim()) {
        showToast('Ingresa un código de recuperación', 'error');
        return;
      }
      setLoading(true);
      try {
        const success = await verifyOtp(otpEmail!, backupCodeInput.trim(), 'backup');
        if (success) {
          showToast('Verificación exitosa', 'success');
          redirectByRole();
        } else {
          showToast('Código de recuperación inválido', 'error');
          setBackupCodeInput('');
        }
      } catch (err: any) {
        showToast(err?.message || 'Código inválido', 'error');
        setBackupCodeInput('');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (codeString.length !== 6) {
      showToast('Ingresa el código completo de 6 dígitos', 'error');
      return;
    }
    setLoading(true);
    try {
      // Send the correct type for verification
      const verifyType = otpTwoFactorType === 'totp' ? 'totp' : 'email';
      const success = await verifyOtp(otpEmail!, codeString, verifyType);
      if (success) {
        showToast('Verificación exitosa', 'success');
        redirectByRole();
      } else {
        showToast('Código inválido', 'error');
        setOtpCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (err: any) {
      showToast(err?.message || 'Código inválido', 'error');
      setOtpCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendTimer > 0 || resendLoading) return;
    setResendLoading(true);
    try {
      const success = await resendOtpCode(otpEmail!);
      if (success) {
        showToast('Código reenviado', 'success');
        setResendTimer(60);
        setOtpCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else {
        showToast('Error al reenviar código', 'error');
      }
    } catch {
      showToast('Error al reenviar código', 'error');
    } finally {
      setResendLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setOtpEmail(null);
    setOtpTwoFactorType('email');
    setOtpCode(['', '', '', '', '', '']);
    setResendTimer(0);
    setUseBackupCode(false);
    setBackupCodeInput('');
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const isTOTP = otpTwoFactorType === 'totp';

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'stretch',
      justifyContent: 'stretch',
      background: 'var(--primary-gradient)',
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
          position: 'absolute', top: '40%', right: '10%',
          width: 60, height: 60, borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)',
        }} />

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

        <h1 style={{ fontSize: 32, fontWeight: 800, color: '#fff', marginBottom: 8, textAlign: 'center', textShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          {shopName}
        </h1>
        <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.9)', fontWeight: 500, marginBottom: 40, textAlign: 'center' }}>
          Tu tienda en línea
        </p>

        <div style={{ display: 'flex', gap: 20, fontSize: 36 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: 16, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(6px)' }}>🍕</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: 16, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(6px)' }}>🍔</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: 16, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(6px)' }}>🥗</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: 16, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(6px)' }}>🛒</span>
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }} className="lg:hidden">
            {shopLogoUrl ? (
              <img src={shopLogoUrl} alt={shopName} style={{ width: 100, height: 100, borderRadius: 16, objectFit: 'contain', marginBottom: 12, boxShadow: 'var(--shadow-accent)' }} />
            ) : (
              <div style={{ width: 80, height: 80, borderRadius: 16, background: 'var(--primary-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, boxShadow: 'var(--shadow-accent)' }}>
                <span style={{ fontWeight: 800, fontSize: 30, color: '#fff', letterSpacing: -0.5 }}>{shopName.slice(0, 2).toUpperCase()}</span>
              </div>
            )}
          </div>

          {/* Desktop Logo (small) */}
          <div style={{ display: 'none', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }} className="lg:flex">
            {shopLogoUrl ? (
              <img src={shopLogoUrl} alt={shopName} style={{ width: 100, height: 100, borderRadius: 16, objectFit: 'contain', marginBottom: 12, boxShadow: 'var(--shadow-accent)' }} />
            ) : (
              <div style={{ width: 80, height: 80, borderRadius: 16, background: 'var(--primary-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, boxShadow: 'var(--shadow-accent)' }}>
                <span style={{ fontWeight: 800, fontSize: 30, color: '#fff' }}>{shopName.slice(0, 2).toUpperCase()}</span>
              </div>
            )}
          </div>

          {!otpEmail ? (
            <>
              {/* ── LOGIN FORM ── */}
              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Bienvenido de vuelta</h1>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Inicia sesión en tu cuenta {shopName}</p>
              </div>

              <form onSubmit={handleLogin}>
                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 7 }}>Correo electrónico</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" autoComplete="email"
                    style={{ height: 46, borderRadius: 10, border: '2px solid var(--border)', padding: '0 14px', fontSize: 15, background: 'var(--white)', width: '100%', boxSizing: 'border-box' }} />
                </div>

                <div style={{ marginBottom: 26 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 7 }}>Contraseña</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password"
                      style={{ height: 46, borderRadius: 10, border: '2px solid var(--border)', padding: '0 44px 0 14px', fontSize: 15, background: 'var(--white)', width: '100%', boxSizing: 'border-box' }} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={loading}
                  style={{ width: '100%', height: 46, borderRadius: 10, background: loading ? 'var(--primary-hover)' : 'var(--primary-gradient)', color: 'white', fontSize: 16, fontWeight: 700, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: loading ? 'none' : 'var(--shadow-accent)', opacity: loading ? 0.8 : 1, transition: 'all 0.25s ease' }}>
                  {loading && (<div style={{ width: 18, height: 18, border: '2.5px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />)}
                  {loading ? 'Ingresando...' : 'Iniciar sesión'}
                </button>
              </form>
            </>
          ) : (
            <>
              {/* ── 2FA VERIFICATION ── */}
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%',
                  background: isTOTP ? 'rgba(59,130,246,0.1)' : 'var(--info-light)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px',
                }}>
                  {isTOTP
                    ? <Smartphone size={32} style={{ color: '#3B82F6' }} />
                    : <ShieldCheck size={32} style={{ color: 'var(--info)' }} />
                  }
                </div>
                <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
                  Verificación en dos pasos
                </h1>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {isTOTP
                    ? 'Ingresa el código de 6 dígitos de tu aplicación authenticator'
                    : 'Se envió un código de 6 dígitos a'
                  }
                </p>
                {!isTOTP && (
                  <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginTop: 4 }}>{otpEmail}</p>
                )}
              </div>

              {/* Back button */}
              <button onClick={handleBackToLogin}
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 20, padding: 0 }}>
                <ArrowLeft size={16} /> Volver al inicio de sesión
              </button>

              {/* Toggle: Use backup code */}
              <div style={{ marginBottom: 20 }}>
                <button
                  onClick={() => { setUseBackupCode(!useBackupCode); setOtpCode(['', '', '', '', '', '']); }}
                  style={{ fontSize: 13, fontWeight: 600, color: '#3B82F6', background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <KeyRound size={14} />
                  {useBackupCode ? 'Usar código authenticator' : 'Usar código de recuperación'}
                </button>
              </div>

              <form onSubmit={handleVerifyOtp}>
                {!useBackupCode ? (
                  <>
                    {/* 6-digit OTP inputs */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 24 }} onPaste={handleOtpPaste}>
                      {otpCode.map((digit, index) => (
                        <input key={index} ref={(el) => { inputRefs.current[index] = el; }} type="text" inputMode="numeric" maxLength={1} value={digit}
                          onChange={(e) => handleOtpChange(index, e.target.value)} onKeyDown={(e) => handleOtpKeyDown(index, e)}
                          style={{ width: 48, height: 56, borderRadius: 12, border: `2px solid ${digit ? 'var(--primary)' : 'var(--border)'}`, background: digit ? 'var(--primary-light)' : 'var(--white)', textAlign: 'center', fontSize: 24, fontWeight: 700, color: 'var(--text)', outline: 'none', transition: 'all 0.2s ease', boxShadow: digit ? 'var(--shadow-accent)' : 'none' }} />
                      ))}
                    </div>

                    {/* Verify button */}
                    <button type="submit" disabled={loading || codeString.length !== 6}
                      style={{ width: '100%', height: 46, borderRadius: 10, background: (loading || codeString.length !== 6) ? 'var(--primary-hover)' : 'var(--primary-gradient)', color: 'white', fontSize: 16, fontWeight: 700, border: 'none', cursor: (loading || codeString.length !== 6) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: (loading || codeString.length !== 6) ? 'none' : 'var(--shadow-accent)', opacity: (loading || codeString.length !== 6) ? 0.7 : 1, transition: 'all 0.25s ease' }}>
                      {loading && (<div style={{ width: 18, height: 18, border: '2.5px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />)}
                      {loading ? 'Verificando...' : 'Verificar código'}
                    </button>
                  </>
                ) : (
                  <>
                    {/* Backup code input */}
                    <div style={{ marginBottom: 24 }}>
                      <input type="text" value={backupCodeInput} onChange={(e) => setBackupCodeInput(e.target.value)} placeholder="XXXX-XXXX-XXXX" autoComplete="off"
                        style={{ width: '100%', height: 50, borderRadius: 10, border: '2px solid var(--border)', padding: '0 16px', fontSize: 18, fontWeight: 600, letterSpacing: 1, textAlign: 'center', background: 'var(--white)', boxSizing: 'border-box', outline: 'none' }} />
                      <p style={{ fontSize: 12, color: 'var(--text-light)', textAlign: 'center', marginTop: 8 }}>
                        Ingresa uno de tus códigos de recuperación de 12 caracteres
                      </p>
                    </div>

                    <button type="submit" disabled={loading || !backupCodeInput.trim()}
                      style={{ width: '100%', height: 46, borderRadius: 10, background: (loading || !backupCodeInput.trim()) ? 'var(--primary-hover)' : 'var(--primary-gradient)', color: 'white', fontSize: 16, fontWeight: 700, border: 'none', cursor: (loading || !backupCodeInput.trim()) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: (loading || !backupCodeInput.trim()) ? 'none' : 'var(--shadow-accent)', opacity: (loading || !backupCodeInput.trim()) ? 0.7 : 1, transition: 'all 0.25s ease' }}>
                      {loading && (<div style={{ width: 18, height: 18, border: '2.5px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />)}
                      {loading ? 'Verificando...' : 'Verificar código de recuperación'}
                    </button>
                  </>
                )}
              </form>

              {/* Resend code (only for email type) */}
              {!isTOTP && !useBackupCode && (
                <div style={{ textAlign: 'center', marginTop: 20 }}>
                  <p style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 8 }}>¿No recibiste el código?</p>
                  {resendTimer > 0 ? (
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      Reenviar en {formatTime(resendTimer)}
                    </span>
                  ) : (
                    <button onClick={handleResendCode} disabled={resendLoading}
                      style={{ fontSize: 14, fontWeight: 700, color: 'var(--primary)', background: 'none', border: 'none', cursor: resendLoading ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, opacity: resendLoading ? 0.6 : 1 }}>
                      {resendLoading && <RefreshCw size={14} style={{ animation: 'spin 0.8s linear infinite' }} />}
                      Reenviar código
                    </button>
                  )}
                </div>
              )}

              {/* TOTP hint */}
              {isTOTP && !useBackupCode && (
                <div style={{ textAlign: 'center', marginTop: 20 }}>
                  <p style={{ fontSize: 12, color: 'var(--text-light)', lineHeight: 1.6 }}>
                    Abre Google Authenticator, Authy u otra app compatible y busca el código correspondiente a <strong>{shopName}</strong>.
                  </p>
                </div>
              )}
            </>
          )}

          {/* Register link */}
          {!otpEmail && (
            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>¿No tienes cuenta? </span>
              <a href="/register" style={{ fontSize: 14, color: 'var(--primary)', fontWeight: 700, textDecoration: 'none', transition: 'color 0.2s ease' }}>Regístrate</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
