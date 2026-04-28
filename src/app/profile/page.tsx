'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import { Shield, ShieldCheck, ShieldOff, User, LogOut, Edit3, Check, Mail, Phone, Calendar, ArrowLeft, RefreshCw, Lock, Unlock } from 'lucide-react';
import { getInitials, showToast, getRoleLabel, getRoleBadgeColor } from '@/lib/utils';

type TwoFactorStep = 'idle' | 'confirming' | 'verifying';

export default function ProfilePage() {
  const { user, isLoading, updateProfile, logout, userRole, refreshProfile, send2FACode, verify2FASetup } = useAuth();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [phone, setPhone] = useState(user?.phone || '');
  const [birthdate, setBirthdate] = useState(user?.birthdate || '');
  const [saving, setSaving] = useState(false);

  // 2FA state
  const [twoFaStep, setTwoFaStep] = useState<TwoFactorStep>('idle');
  const [twoFaAction, setTwoFaAction] = useState<'enable' | 'disable'>('enable');
  const [twoFaLoading, setTwoFaLoading] = useState(false);
  const [twoFaCode, setTwoFaCode] = useState(['', '', '', '', '', '']);
  const [twoFaResendTimer, setTwoFaResendTimer] = useState(0);
  const twoFaInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // 2FA resend timer
  useEffect(() => {
    if (twoFaResendTimer <= 0) return;
    const interval = setInterval(() => {
      setTwoFaResendTimer(prev => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [twoFaResendTimer]);

  // Auto-focus first OTP input when verifying
  useEffect(() => {
    if (twoFaStep === 'verifying' && twoFaInputRefs.current[0]) {
      setTimeout(() => twoFaInputRefs.current[0]?.focus(), 100);
    }
  }, [twoFaStep]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({ phone, birthdate });
      showToast('Perfil actualizado', 'success');
      setEditing(false);
    } catch (err: any) {
      showToast(err?.message || 'Error al actualizar', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ─── 2FA Flow ───────────────────────────────────────────────────────────
  const handle2FaAction = async (action: 'enable' | 'disable') => {
    setTwoFaLoading(true);
    try {
      await send2FACode(action);
      setTwoFaAction(action);
      setTwoFaStep('confirming');
      setTwoFaCode(['', '', '', '', '', '']);
      setTwoFaResendTimer(60);
      showToast(
        action === 'enable'
          ? 'Código de verificación enviado a tu correo'
          : 'Código de confirmación enviado a tu correo',
        'success'
      );
    } catch (err: any) {
      showToast(err?.message || 'Error al enviar código', 'error');
    } finally {
      setTwoFaLoading(false);
    }
  };

  const handle2FaCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...twoFaCode];
    newCode[index] = value.slice(-1);
    setTwoFaCode(newCode);
    if (value && index < 5) {
      twoFaInputRefs.current[index + 1]?.focus();
    }
  };

  const handle2FaKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !twoFaCode[index] && index > 0) {
      twoFaInputRefs.current[index - 1]?.focus();
    }
  };

  const handle2FaPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setTwoFaCode(pasted.split(''));
      twoFaInputRefs.current[5]?.focus();
    }
  };

  const handle2FaVerify = async () => {
    const code = twoFaCode.join('');
    if (code.length !== 6) {
      showToast('Ingresa el código completo de 6 dígitos', 'error');
      return;
    }
    setTwoFaLoading(true);
    try {
      const success = await verify2FASetup(code, twoFaAction);
      if (success) {
        showToast(
          twoFaAction === 'enable'
            ? 'Autenticación en dos pasos activada'
            : 'Autenticación en dos pasos desactivada',
          'success'
        );
        await refreshProfile();
        setTwoFaStep('idle');
        setTwoFaCode(['', '', '', '', '', '']);
      } else {
        showToast('Código inválido', 'error');
        setTwoFaCode(['', '', '', '', '', '']);
        twoFaInputRefs.current[0]?.focus();
      }
    } catch (err: any) {
      showToast(err?.message || 'Código inválido', 'error');
      setTwoFaCode(['', '', '', '', '', '']);
      twoFaInputRefs.current[0]?.focus();
    } finally {
      setTwoFaLoading(false);
    }
  };

  const handle2FaResend = async () => {
    if (twoFaResendTimer > 0 || twoFaLoading) return;
    setTwoFaLoading(true);
    try {
      await send2FACode(twoFaAction);
      showToast('Código reenviado', 'success');
      setTwoFaResendTimer(60);
      setTwoFaCode(['', '', '', '', '', '']);
      twoFaInputRefs.current[0]?.focus();
    } catch (err: any) {
      showToast(err?.message || 'Error al reenviar', 'error');
    } finally {
      setTwoFaLoading(false);
    }
  };

  const handle2FaCancel = () => {
    setTwoFaStep('idle');
    setTwoFaCode(['', '', '', '', '', '']);
    setTwoFaResendTimer(0);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Protect route
  useEffect(() => {
    if (!isLoading && !user) router.replace('/login');
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--background)' }}>
        <div style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  const roleColor = getRoleBadgeColor(userRole);
  const isEnabled = user?.twoFactorEnabled ?? false;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <Header title="Mi Perfil" showLogout={true} />

      <div style={{ padding: '16px 16px 32px', maxWidth: 600, margin: '0 auto' }}>
        {/* Avatar card */}
        <div className="animate-fade-in" style={{
          background: 'var(--white)', borderRadius: 20, padding: '32px 24px',
          boxShadow: 'var(--shadow)', marginBottom: 16, textAlign: 'center',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Decorative gradient top */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 80,
            background: 'var(--primary-gradient)', opacity: 0.1,
          }} />

          <div style={{ position: 'relative' }}>
            {/* Avatar */}
            <div style={{
              width: 88, height: 88, borderRadius: '50%', background: 'var(--primary-gradient)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 30, fontWeight: 800, color: 'white', margin: '0 auto 16px',
              boxShadow: 'var(--shadow-accent)',
            }}>
              {getInitials(user?.name || '')}
            </div>

            <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>
              {user?.name || 'Usuario'}
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 12 }}>
              {user?.email || ''}
            </p>

            {/* Role badge */}
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '6px 16px', borderRadius: 'var(--radius-full)',
              background: roleColor + '15', fontSize: 13, fontWeight: 600, color: roleColor,
            }}>
              <Shield size={14} />
              {getRoleLabel(userRole)}
            </span>
          </div>
        </div>

        {/* Info card */}
        <div className="animate-fade-in" style={{
          background: 'var(--white)', borderRadius: 20, padding: 24,
          boxShadow: 'var(--shadow)', marginBottom: 16,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>Información personal</h3>
            <button
              onClick={() => {
                if (editing) { setPhone(user?.phone || ''); setBirthdate(user?.birthdate || ''); }
                setEditing(!editing);
              }}
              style={{
                padding: '8px 16px', borderRadius: 'var(--radius)',
                background: editing ? 'var(--input-bg)' : 'var(--primary-gradient)',
                color: editing ? 'var(--text)' : 'white',
                fontSize: 13, fontWeight: 600, boxShadow: editing ? 'none' : 'var(--shadow-accent)',
              }}
            >
              {editing ? 'Cancelar' : 'Editar'}
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10, background: 'var(--input-bg)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <User size={18} style={{ color: 'var(--text-secondary)' }} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 11, color: 'var(--text-light)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Nombre</p>
                <input
                  type="text" value={user?.name || ''} disabled
                  style={{ background: 'var(--input-bg)', opacity: 0.7, height: 40, fontSize: 14, width: '100%', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* Email */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10, background: 'var(--input-bg)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Mail size={18} style={{ color: 'var(--text-secondary)' }} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 11, color: 'var(--text-light)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Correo electrónico</p>
                <input
                  type="email" value={user?.email || ''} disabled
                  style={{ background: 'var(--input-bg)', opacity: 0.7, height: 40, fontSize: 14, width: '100%', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* Phone */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10, background: 'var(--input-bg)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Phone size={18} style={{ color: 'var(--text-secondary)' }} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 11, color: 'var(--text-light)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Teléfono</p>
                <input
                  type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                  disabled={!editing} placeholder="+1 (555) 123-4567"
                  style={{ height: 40, fontSize: 14, width: '100%', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* Birthdate */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10, background: 'var(--input-bg)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Calendar size={18} style={{ color: 'var(--text-secondary)' }} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 11, color: 'var(--text-light)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Fecha de nacimiento</p>
                <input
                  type="date" value={birthdate} onChange={(e) => setBirthdate(e.target.value)}
                  disabled={!editing}
                  style={{ height: 40, fontSize: 14, width: '100%', boxSizing: 'border-box' }}
                />
              </div>
            </div>
          </div>

          {editing && (
            <button
              onClick={handleSave} disabled={saving}
              style={{
                width: '100%', padding: '14px', borderRadius: 12, marginTop: 24,
                background: saving ? 'var(--primary-hover)' : 'var(--primary-gradient)',
                color: 'white', fontSize: 15, fontWeight: 700,
                boxShadow: saving ? 'none' : 'var(--shadow-accent)',
                opacity: saving ? 0.8 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              {saving ? (
                <div style={{ width: 18, height: 18, border: '2.5px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              ) : (
                <Check size={18} />
              )}
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          )}
        </div>

        {/* ─── 2FA Section ─── */}
        {twoFaStep === 'idle' && (
          <div className="animate-fade-in" style={{
            background: 'var(--white)', borderRadius: 20, padding: 24,
            boxShadow: 'var(--shadow)', marginBottom: 16,
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: isEnabled ? 'var(--success-light)' : 'var(--info-light)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {isEnabled
                    ? <ShieldCheck size={22} style={{ color: 'var(--success)' }} />
                    : <ShieldOff size={22} style={{ color: 'var(--info)' }} />
                  }
                </div>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>
                    Autenticación en dos pasos
                  </h3>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    {isEnabled ? 'Protección activada' : 'Sin protección adicional'}
                  </p>
                </div>
              </div>
            </div>

            {/* Status banner */}
            <div style={{
              padding: '14px 16px', borderRadius: 12, marginBottom: 18,
              background: isEnabled
                ? 'linear-gradient(135deg, rgba(34,197,94,0.08), rgba(34,197,94,0.03))'
                : 'linear-gradient(135deg, rgba(255,149,0,0.08), rgba(255,149,0,0.03))',
              border: `1px solid ${isEnabled ? 'rgba(34,197,94,0.15)' : 'rgba(255,149,0,0.15)'}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {isEnabled ? (
                  <Lock size={18} style={{ color: 'var(--success)', flexShrink: 0 }} />
                ) : (
                  <Unlock size={18} style={{ color: '#FF9500', flexShrink: 0 }} />
                )}
                <div>
                  <p style={{
                    fontSize: 13, fontWeight: 600,
                    color: isEnabled ? 'var(--success)' : '#FF9500',
                    marginBottom: 2,
                  }}>
                    {isEnabled ? 'Tu cuenta está protegida' : 'Tu cuenta no está protegida'}
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {isEnabled
                      ? 'Cada vez que inicies sesión, se te pedirá un código enviado a tu correo electrónico.'
                      : 'Activa la autenticación en dos pasos para agregar una capa extra de seguridad a tu cuenta.'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Action button */}
            <button
              onClick={() => handle2FaAction(isEnabled ? 'disable' : 'enable')}
              disabled={twoFaLoading}
              style={{
                width: '100%', padding: '14px', borderRadius: 12,
                background: isEnabled
                  ? 'var(--white)'
                  : 'var(--primary-gradient)',
                color: isEnabled ? 'var(--danger)' : 'white',
                fontSize: 15, fontWeight: 700,
                border: isEnabled ? '2px solid var(--danger)' : 'none',
                cursor: twoFaLoading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                opacity: twoFaLoading ? 0.7 : 1,
                transition: 'all 0.25s ease',
              }}
            >
              {twoFaLoading && (
                <div style={{
                  width: 18, height: 18,
                  border: `2.5px solid ${isEnabled ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.3)'}`,
                  borderTopColor: isEnabled ? 'var(--danger)' : 'white',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }} />
              )}
              {twoFaLoading
                ? 'Enviando código...'
                : isEnabled
                  ? 'Desactivar autenticación en dos pasos'
                  : 'Activar autenticación en dos pasos'
              }
            </button>
          </div>
        )}

        {/* ─── 2FA Confirm / Verify Step ─── */}
        {(twoFaStep === 'confirming' || twoFaStep === 'verifying') && (
          <div className="animate-fade-in" style={{
            background: 'var(--white)', borderRadius: 20, padding: 28,
            boxShadow: 'var(--shadow)', marginBottom: 16,
          }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: twoFaAction === 'enable' ? 'var(--success-light)' : 'var(--danger-light)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 14px',
              }}>
                {twoFaAction === 'enable'
                  ? <ShieldCheck size={28} style={{ color: 'var(--success)' }} />
                  : <ShieldOff size={28} style={{ color: 'var(--danger)' }} />
                }
              </div>
              <h3 style={{
                fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 6,
              }}>
                {twoFaAction === 'enable' ? 'Activar 2FA' : 'Desactivar 2FA'}
              </h3>
              <p style={{
                fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6,
              }}>
                {twoFaStep === 'confirming'
                  ? 'Te enviaremos un código de verificación a tu correo electrónico para confirmar esta acción.'
                  : 'Ingresa el código de 6 dígitos enviado a tu correo:'
                }
              </p>
              {twoFaStep === 'verifying' && (
                <p style={{
                  fontSize: 14, fontWeight: 700, color: 'var(--text)', marginTop: 6,
                }}>
                  {user?.email}
                </p>
              )}
            </div>

            {twoFaStep === 'confirming' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* Send code button */}
                <button
                  onClick={() => {
                    setTwoFaStep('verifying');
                    setTwoFaResendTimer(60);
                  }}
                  style={{
                    width: '100%', padding: '14px', borderRadius: 12,
                    background: 'var(--primary-gradient)',
                    color: 'white', fontSize: 15, fontWeight: 700,
                    border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    boxShadow: 'var(--shadow-accent)',
                  }}
                >
                  <Mail size={18} />
                  Enviar código a mi correo
                </button>

                {/* Cancel */}
                <button
                  onClick={handle2FaCancel}
                  style={{
                    width: '100%', padding: '14px', borderRadius: 12,
                    background: 'var(--input-bg)',
                    color: 'var(--text-secondary)', fontSize: 15, fontWeight: 600,
                    border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  }}
                >
                  <ArrowLeft size={18} />
                  Cancelar
                </button>
              </div>
            )}

            {twoFaStep === 'verifying' && (
              <div>
                {/* Back button */}
                <button
                  onClick={handle2FaCancel}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    fontSize: 13, color: 'var(--text-secondary)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    marginBottom: 16, padding: 0,
                  }}
                >
                  <ArrowLeft size={16} />
                  Cancelar
                </button>

                {/* 6-digit code inputs */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: 8,
                    marginBottom: 20,
                  }}
                  onPaste={handle2FaPaste}
                >
                  {twoFaCode.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => { twoFaInputRefs.current[index] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handle2FaCodeChange(index, e.target.value)}
                      onKeyDown={(e) => handle2FaKeyDown(index, e)}
                      style={{
                        width: 46,
                        height: 52,
                        borderRadius: 10,
                        border: `2px solid ${digit ? 'var(--primary)' : 'var(--border)'}`,
                        background: digit ? 'var(--primary-light)' : 'var(--white)',
                        textAlign: 'center',
                        fontSize: 22,
                        fontWeight: 700,
                        color: 'var(--text)',
                        outline: 'none',
                        transition: 'all 0.2s ease',
                        boxShadow: digit ? '0 0 0 3px rgba(255,107,53,0.1)' : 'none',
                      }}
                    />
                  ))}
                </div>

                {/* Verify button */}
                <button
                  onClick={handle2FaVerify}
                  disabled={twoFaLoading || twoFaCode.join('').length !== 6}
                  style={{
                    width: '100%', padding: '14px', borderRadius: 12,
                    background: twoFaAction === 'enable'
                      ? 'var(--success)'
                      : 'var(--danger)',
                    color: 'white', fontSize: 15, fontWeight: 700,
                    border: 'none',
                    cursor: (twoFaLoading || twoFaCode.join('').length !== 6) ? 'not-allowed' : 'pointer',
                    opacity: (twoFaLoading || twoFaCode.join('').length !== 6) ? 0.7 : 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    transition: 'all 0.25s ease',
                  }}
                >
                  {twoFaLoading && (
                    <div style={{
                      width: 18, height: 18,
                      border: '2.5px solid rgba(255,255,255,0.3)',
                      borderTopColor: 'white',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                    }} />
                  )}
                  {twoFaLoading
                    ? 'Verificando...'
                    : twoFaAction === 'enable'
                      ? 'Activar 2FA'
                      : 'Desactivar 2FA'
                  }
                </button>

                {/* Resend */}
                <div style={{ textAlign: 'center', marginTop: 16 }}>
                  {twoFaResendTimer > 0 ? (
                    <span style={{
                      fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    }}>
                      Reenviar en {formatTime(twoFaResendTimer)}
                    </span>
                  ) : (
                    <button
                      onClick={handle2FaResend}
                      disabled={twoFaLoading}
                      style={{
                        fontSize: 13, fontWeight: 700, color: 'var(--primary)',
                        background: 'none', border: 'none',
                        cursor: twoFaLoading ? 'not-allowed' : 'pointer',
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        opacity: twoFaLoading ? 0.6 : 1,
                      }}
                    >
                      {twoFaLoading ? (
                        <RefreshCw size={14} style={{ animation: 'spin 0.8s linear infinite' }} />
                      ) : (
                        <Mail size={14} />
                      )}
                      Reenviar código
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Logout */}
        <button
          onClick={logout}
          style={{
            width: '100%', padding: '16px', borderRadius: 16,
            background: 'var(--white)', color: 'var(--danger)',
            fontSize: 15, fontWeight: 700,
            border: '2px solid var(--danger)',
            cursor: 'pointer', boxShadow: 'var(--shadow)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          }}
        >
          <LogOut size={20} />
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
