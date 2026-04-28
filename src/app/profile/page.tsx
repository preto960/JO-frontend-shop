'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import { Shield, ShieldCheck, ShieldOff, User, LogOut, Edit3, Check, Mail, Phone, Calendar, ArrowLeft, RefreshCw, Lock, Unlock, Smartphone, KeyRound, Copy, Download, AlertTriangle, Info, ChevronRight } from 'lucide-react';
import { getInitials, showToast, getRoleLabel, getRoleBadgeColor } from '@/lib/utils';

type TwoFactorStep = 'idle' | 'choose_method' | 'email_confirming' | 'email_verifying' | 'totp_setup' | 'totp_verify' | 'totp_backup' | 'disable_confirming' | 'disable_verifying' | 'backup_codes_view';

export default function ProfilePage() {
  const {
    user, isLoading, updateProfile, logout, userRole, refreshProfile,
    send2FACode, verify2FASetup, setupTOTP, enableTOTP, getBackupCodes,
  } = useAuth();
  const router = useRouter();

  // Profile editing
  const [editing, setEditing] = useState(false);
  const [phone, setPhone] = useState(user?.phone || '');
  const [birthdate, setBirthdate] = useState(user?.birthdate || '');
  const [saving, setSaving] = useState(false);

  // 2FA general state
  const [twoFaStep, setTwoFaStep] = useState<TwoFactorStep>('idle');
  const [twoFaLoading, setTwoFaLoading] = useState(false);

  // Email 2FA state (Option A)
  const [emailCode, setEmailCode] = useState(['', '', '', '', '', '']);
  const [emailResendTimer, setEmailResendTimer] = useState(0);
  const emailInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // TOTP state (Option B)
  const [totpSecret, setTotpSecret] = useState('');
  const [totpQrCode, setTotpQrCode] = useState('');
  const [totpCode, setTotpCode] = useState(['', '', '', '', '', '']);
  const [totpBackupCodes, setTotpBackupCodes] = useState<string[]>([]);
  const [totpInputRefs, setTotpInputRefs] = useState<(HTMLInputElement | null)[]>([]);
  const [totpCopied, setTotpCopied] = useState(false);
  const [totpCodesCopied, setTotpCodesCopied] = useState(false);
  const [regeneratingCodes, setRegeneratingCodes] = useState(false);

  // Disable 2FA state
  const [disableCode, setDisableCode] = useState(['', '', '', '', '', '']);
  const [disableResendTimer, setDisableResendTimer] = useState(0);
  const disableInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // View backup codes
  const [viewBackupCodes, setViewBackupCodes] = useState<string[]>([]);
  const [viewCodesLoading, setViewCodesLoading] = useState(false);
  const [viewCodesCopied, setViewCodesCopied] = useState(false);

  // Timers
  useEffect(() => {
    if (emailResendTimer <= 0) return;
    const interval = setInterval(() => setEmailResendTimer(prev => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [emailResendTimer]);

  useEffect(() => {
    if (disableResendTimer <= 0) return;
    const interval = setInterval(() => setDisableResendTimer(prev => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [disableResendTimer]);

  // Auto-focus first OTP input
  useEffect(() => {
    if (twoFaStep === 'email_verifying' && emailInputRefs.current[0]) {
      setTimeout(() => emailInputRefs.current[0]?.focus(), 100);
    }
    if (twoFaStep === 'totp_verify' && totpInputRefs[0]) {
      setTimeout(() => totpInputRefs[0]?.focus(), 100);
    }
    if (twoFaStep === 'disable_verifying' && disableInputRefs.current[0]) {
      setTimeout(() => disableInputRefs.current[0]?.focus(), 100);
    }
  }, [twoFaStep]);

  // ─── Profile Save ────────────────────────────────────────────────
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

  // ─── OTP helpers (shared) ────────────────────────────────────────
  const handleOtpChange = (setter: Function, index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...(index === 0 ? ['', '', '', '', '', ''] : [])];
    // We pass the full current array
    setter(index, value);
  };

  const handleCodeChange = (index: number, value: string, codes: string[], setCodes: Function, refs: (HTMLInputElement | null)[]) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...codes];
    newCode[index] = value.slice(-1);
    setCodes(newCode);
    if (value && index < 5) {
      refs[index + 1]?.focus();
    }
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent, codes: string[], setCodes: Function, refs: (HTMLInputElement | null)[]) => {
    if (e.key === 'Backspace' && !codes[index] && index > 0) {
      refs[index - 1]?.focus();
    }
  };

  const handleCodePaste = (e: React.ClipboardEvent, setCodes: Function, refs: (HTMLInputElement | null)[]) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setCodes(pasted.split(''));
      refs[5]?.focus();
    }
  };

  const renderOtpInputs = (
    codes: string[],
    setCodes: Function,
    refs: (HTMLInputElement | null)[],
  ) => (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 20 }}
      onPaste={(e) => handleCodePaste(e, setCodes, refs)}>
      {codes.map((digit, index) => (
        <input key={index} ref={(el) => { if (setRefsSetter) return; }}
          type="text" inputMode="numeric" maxLength={1} value={digit}
          onChange={(e) => handleCodeChange(index, e.target.value, codes, setCodes, refs)}
          onKeyDown={(e) => handleCodeKeyDown(index, e, codes, setCodes, refs)}
          style={{
            width: 46, height: 52, borderRadius: 10,
            border: `2px solid ${digit ? 'var(--primary)' : 'var(--border)'}`,
            background: digit ? 'var(--primary-light)' : 'var(--white)',
            textAlign: 'center', fontSize: 22, fontWeight: 700, color: 'var(--text)',
            outline: 'none', transition: 'all 0.2s ease',
            boxShadow: digit ? '0 0 0 3px rgba(255,107,53,0.1)' : 'none',
          }}
        />
      ))}
    </div>
  );

  const setRefsSetter = false; // placeholder, we handle refs manually below

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // ─── 2FA Disable Flow (Email verification) ─────────────────────
  const handleDisable2FA = async () => {
    setTwoFaLoading(true);
    try {
      await send2FACode('disable');
      setTwoFaStep('disable_verifying');
      setDisableCode(['', '', '', '', '', '']);
      setDisableResendTimer(60);
      showToast('Código de confirmación enviado a tu correo', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Error al enviar código', 'error');
    } finally {
      setTwoFaLoading(false);
    }
  };

  const handleDisableVerify = async () => {
    const code = disableCode.join('');
    if (code.length !== 6) { showToast('Ingresa el código completo', 'error'); return; }
    setTwoFaLoading(true);
    try {
      const success = await verify2FASetup(code, 'disable');
      if (success) {
        showToast('2FA desactivado exitosamente', 'success');
        await refreshProfile();
        setTwoFaStep('idle');
      }
    } catch (err: any) {
      showToast(err?.message || 'Código inválido', 'error');
      setDisableCode(['', '', '', '', '', '']);
      disableInputRefs.current[0]?.focus();
    } finally {
      setTwoFaLoading(false);
    }
  };

  const handleDisableResend = async () => {
    if (disableResendTimer > 0 || twoFaLoading) return;
    setTwoFaLoading(true);
    try {
      await send2FACode('disable');
      showToast('Código reenviado', 'success');
      setDisableResendTimer(60);
      setDisableCode(['', '', '', '', '', '']);
      disableInputRefs.current[0]?.focus();
    } catch (err: any) {
      showToast(err?.message || 'Error al reenviar', 'error');
    } finally {
      setTwoFaLoading(false);
    }
  };

  // ─── Email 2FA Flow (Option A) ──────────────────────────────────
  const handleEmail2FA = async () => {
    setTwoFaLoading(true);
    try {
      await send2FACode('enable');
      setTwoFaStep('email_verifying');
      setEmailCode(['', '', '', '', '', '']);
      setEmailResendTimer(60);
      showToast('Código de verificación enviado a tu correo', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Error al enviar código', 'error');
    } finally {
      setTwoFaLoading(false);
    }
  };

  const handleEmailVerify = async () => {
    const code = emailCode.join('');
    if (code.length !== 6) { showToast('Ingresa el código completo', 'error'); return; }
    setTwoFaLoading(true);
    try {
      const success = await verify2FASetup(code, 'enable');
      if (success) {
        showToast('2FA por email activado exitosamente', 'success');
        await refreshProfile();
        setTwoFaStep('idle');
      }
    } catch (err: any) {
      showToast(err?.message || 'Código inválido', 'error');
      setEmailCode(['', '', '', '', '', '']);
      emailInputRefs.current[0]?.focus();
    } finally {
      setTwoFaLoading(false);
    }
  };

  const handleEmailResend = async () => {
    if (emailResendTimer > 0 || twoFaLoading) return;
    setTwoFaLoading(true);
    try {
      await send2FACode('enable');
      showToast('Código reenviado', 'success');
      setEmailResendTimer(60);
      setEmailCode(['', '', '', '', '', '']);
      emailInputRefs.current[0]?.focus();
    } catch (err: any) {
      showToast(err?.message || 'Error al reenviar', 'error');
    } finally {
      setTwoFaLoading(false);
    }
  };

  // ─── TOTP 2FA Flow (Option B) ───────────────────────────────────
  const handleTotpSetup = async () => {
    setTwoFaLoading(true);
    try {
      const result = await setupTOTP();
      setTotpSecret(result.secret);
      setTotpQrCode(result.qrCode);
      setTotpCode(['', '', '', '', '', '']);
      setTwoFaStep('totp_verify');
    } catch (err: any) {
      showToast(err?.message || 'Error al generar TOTP', 'error');
    } finally {
      setTwoFaLoading(false);
    }
  };

  const handleTotpEnable = async () => {
    const code = totpCode.join('');
    if (code.length !== 6) { showToast('Ingresa el código completo', 'error'); return; }
    setTwoFaLoading(true);
    try {
      const result = await enableTOTP(code);
      setTotpBackupCodes(result.backupCodes);
      setTwoFaStep('totp_backup');
    } catch (err: any) {
      showToast(err?.message || 'Código inválido. Verifica tu app authenticator.', 'error');
      setTotpCode(['', '', '', '', '', '']);
      totpInputRefs[0]?.focus();
    } finally {
      setTwoFaLoading(false);
    }
  };

  // ─── Backup Codes ───────────────────────────────────────────────
  const handleRegenerateBackupCodes = async () => {
    setRegeneratingCodes(true);
    try {
      const newCodes = await getBackupCodes();
      setTotpBackupCodes(newCodes);
      showToast('Nuevos códigos generados', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Error al generar códigos', 'error');
    } finally {
      setRegeneratingCodes(false);
    }
  };

  const handleViewBackupCodes = async () => {
    setViewCodesLoading(true);
    try {
      const codes = await getBackupCodes();
      setViewBackupCodes(codes);
      setTwoFaStep('backup_codes_view');
    } catch (err: any) {
      showToast(err?.message || 'Error al obtener códigos', 'error');
    } finally {
      setViewCodesLoading(false);
    }
  };

  const copyToClipboard = (text: string, callback: Function) => {
    navigator.clipboard.writeText(text).then(() => {
      callback(true);
      setTimeout(() => callback(false), 2000);
    }).catch(() => {
      showToast('Error al copiar', 'error');
    });
  };

  const downloadBackupCodes = (codes: string[]) => {
    const text = `JO-Shop - Códigos de Recuperación 2FA\n` +
      `Generados: ${new Date().toLocaleString('es-ES')}\n` +
      `Usuario: ${user?.email}\n` +
      `\nIMPORTANTE: Guarda estos códigos en un lugar seguro.\n` +
      `Cada código solo puede usarse UNA VEZ.\n\n` +
      codes.map((code, i) => `${i + 1}. ${code}`).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `joshop-backup-codes-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Códigos descargados', 'success');
  };

  const handleCancel = () => {
    setTwoFaStep('idle');
    setEmailCode(['', '', '', '', '', '']);
    setTotpCode(['', '', '', '', '', '']);
    setDisableCode(['', '', '', '', '', '']);
    setTotpSecret('');
    setTotpQrCode('');
    setTotpBackupCodes([]);
    setEmailResendTimer(0);
    setDisableResendTimer(0);
  };

  // ─── Protect route ──────────────────────────────────────────────
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
  const isEnabledTOTP = user?.twoFactorType === 'totp';
  const isEnabledEmail = isEnabled && !isEnabledTOTP;
  const hasBackup = user?.hasBackupCodes ?? false;

  const renderCard = (children: React.ReactNode) => (
    <div className="animate-fade-in" style={{
      background: 'var(--white)', borderRadius: 20, padding: 24,
      boxShadow: 'var(--shadow)', marginBottom: 16,
    }}>
      {children}
    </div>
  );

  const renderButton = (onClick: () => void, text: string, opts: {
    primary?: boolean; danger?: boolean; disabled?: boolean; loading?: boolean; fullWidth?: boolean; icon?: React.ReactNode;
  } = {}) => (
    <button onClick={onClick} disabled={opts.disabled || opts.loading}
      style={{
        width: opts.fullWidth ? '100%' : undefined,
        padding: '14px 20px', borderRadius: 12,
        background: opts.danger ? 'var(--white)' : opts.primary ? 'var(--primary-gradient)' : 'var(--input-bg)',
        color: opts.danger ? 'var(--danger)' : opts.primary ? 'white' : 'var(--text-secondary)',
        fontSize: 15, fontWeight: 700,
        border: opts.danger ? '2px solid var(--danger)' : 'none',
        cursor: (opts.disabled || opts.loading) ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        opacity: (opts.disabled || opts.loading) ? 0.7 : 1,
        transition: 'all 0.25s ease',
        boxShadow: opts.primary && !opts.loading ? 'var(--shadow-accent)' : 'none',
      }}>
      {opts.loading && <div style={{ width: 18, height: 18, border: `2.5px solid ${opts.danger ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.3)'}`, borderTopColor: opts.danger ? 'var(--danger)' : 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />}
      {opts.icon}
      {opts.loading ? 'Procesando...' : text}
    </button>
  );

  const renderOtpInputs6 = (
    codes: string[],
    setCodes: React.Dispatch<React.SetStateAction<string[]>>,
    refs: React.MutableRefObject<(HTMLInputElement | null)[]>,
  ) => (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 20 }}
      onPaste={(e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pasted.length === 6) { setCodes(pasted.split('')); refs.current[5]?.focus(); }
      }}>
      {codes.map((digit, index) => (
        <input key={index} ref={(el) => { refs.current[index] = el; }}
          type="text" inputMode="numeric" maxLength={1} value={digit}
          onChange={(e) => {
            if (!/^\d*$/.test(e.target.value)) return;
            const nc = [...codes]; nc[index] = e.target.value.slice(-1); setCodes(nc);
            if (e.target.value && index < 5) refs.current[index + 1]?.focus();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Backspace' && !codes[index] && index > 0) refs.current[index - 1]?.focus();
          }}
          style={{
            width: 46, height: 52, borderRadius: 10,
            border: `2px solid ${digit ? 'var(--primary)' : 'var(--border)'}`,
            background: digit ? 'var(--primary-light)' : 'var(--white)',
            textAlign: 'center', fontSize: 22, fontWeight: 700, color: 'var(--text)',
            outline: 'none', transition: 'all 0.2s ease',
            boxShadow: digit ? '0 0 0 3px rgba(255,107,53,0.1)' : 'none',
          }}
        />
      ))}
    </div>
  );

  const renderResendSection = (timer: number, onResend: () => void, loading: boolean) => (
    <div style={{ textAlign: 'center', marginTop: 16 }}>
      {timer > 0 ? (
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          Reenviar en {formatTime(timer)}
        </span>
      ) : (
        <button onClick={onResend} disabled={loading}
          style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)', background: 'none', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, opacity: loading ? 0.6 : 1 }}>
          {loading ? <RefreshCw size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Mail size={14} />}
          Reenviar código
        </button>
      )}
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <Header title="Mi Perfil" showLogout={false} />

      <div style={{ padding: '16px 16px 32px', maxWidth: 600, margin: '0 auto' }}>
        {/* ─── Avatar Card ─── */}
        {renderCard(
          <div style={{ textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 80, background: 'var(--primary-gradient)', opacity: 0.1 }} />
            <div style={{ position: 'relative' }}>
              <div style={{ width: 88, height: 88, borderRadius: '50%', background: 'var(--primary-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, fontWeight: 800, color: 'white', margin: '0 auto 16px', boxShadow: 'var(--shadow-accent)' }}>
                {getInitials(user?.name || '')}
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>{user?.name || 'Usuario'}</h2>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 12 }}>{user?.email || ''}</p>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 16px', borderRadius: 'var(--radius-full)', background: roleColor + '15', fontSize: 13, fontWeight: 600, color: roleColor }}>
                <Shield size={14} />{getRoleLabel(userRole)}
              </span>
            </div>
          </div>
        )}

        {/* ─── Personal Info Card ─── */}
        {renderCard(
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>Información personal</h3>
              <button onClick={() => { if (editing) { setPhone(user?.phone || ''); setBirthdate(user?.birthdate || ''); } setEditing(!editing); }}
                style={{ padding: '8px 16px', borderRadius: 'var(--radius)', background: editing ? 'var(--input-bg)' : 'var(--primary-gradient)', color: editing ? 'var(--text)' : 'white', fontSize: 13, fontWeight: 600, boxShadow: editing ? 'none' : 'var(--shadow-accent)' }}>
                {editing ? 'Cancelar' : 'Editar'}
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {[{ icon: User, label: 'Nombre', value: user?.name || '', disabled: true },
                { icon: Mail, label: 'Correo electrónico', value: user?.email || '', disabled: true },
                { icon: Phone, label: 'Teléfono', value: phone, disabled: !editing, placeholder: '+1 (555) 123-4567', onChange: setPhone, type: 'tel' },
                { icon: Calendar, label: 'Fecha de nacimiento', value: birthdate, disabled: !editing, onChange: setBirthdate, type: 'date' },
              ].map((field, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--input-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <field.icon size={18} style={{ color: 'var(--text-secondary)' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 11, color: 'var(--text-light)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{field.label}</p>
                    <input type={field.type || 'text'} value={field.value} onChange={(e) => field.onChange?.(e.target.value)} disabled={field.disabled} placeholder={field.placeholder}
                      style={{ background: 'var(--input-bg)', opacity: field.disabled ? 0.7 : 1, height: 40, fontSize: 14, width: '100%', boxSizing: 'border-box' }} />
                  </div>
                </div>
              ))}
            </div>
            {editing && renderButton(handleSave, 'Guardar cambios', { primary: true, fullWidth: true, loading: saving, icon: <Check size={18} /> })}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            2FA SECTION - IDLE STATE
            ═══════════════════════════════════════════════════════════ */}
        {twoFaStep === 'idle' && renderCard(
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: isEnabled ? 'var(--success-light)' : 'var(--info-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {isEnabled ? <ShieldCheck size={22} style={{ color: 'var(--success)' }} /> : <ShieldOff size={22} style={{ color: 'var(--info)' }} />}
                </div>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>Autenticación en dos pasos</h3>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    {isEnabled
                      ? `Protección activada (${isEnabledTOTP ? 'App Authenticator' : 'Email'})`
                      : 'Sin protección adicional'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Status banner */}
            <div style={{ padding: '14px 16px', borderRadius: 12, marginBottom: 18, background: isEnabled ? 'linear-gradient(135deg, rgba(34,197,94,0.08), rgba(34,197,94,0.03))' : 'linear-gradient(135deg, rgba(255,149,0,0.08), rgba(255,149,0,0.03))', border: `1px solid ${isEnabled ? 'rgba(34,197,94,0.15)' : 'rgba(255,149,0,0.15)'}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {isEnabled ? <Lock size={18} style={{ color: 'var(--success)', flexShrink: 0 }} /> : <Unlock size={18} style={{ color: '#FF9500', flexShrink: 0 }} />}
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: isEnabled ? 'var(--success)' : '#FF9500', marginBottom: 2 }}>
                    {isEnabled ? 'Tu cuenta está protegida' : 'Tu cuenta no está protegida'}
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {isEnabledTOTP
                      ? 'Cada vez que inicies sesión, se te pedirá un código de tu aplicación authenticator (Google Auth / Authy).'
                      : isEnabledEmail
                        ? 'Cada vez que inicies sesión, se te pedirá un código enviado a tu correo electrónico.'
                        : 'Activa la autenticación en dos pasos para agregar una capa extra de seguridad a tu cuenta.'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Actions when enabled */}
            {isEnabled && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* View backup codes */}
                {isEnabledTOTP && (
                  <button onClick={handleViewBackupCodes} disabled={viewCodesLoading}
                    style={{ width: '100%', padding: '14px', borderRadius: 12, background: 'var(--input-bg)', color: 'var(--text)', fontSize: 14, fontWeight: 600, border: 'none', cursor: viewCodesLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <KeyRound size={18} style={{ color: '#3B82F6' }} />
                      {hasBackup ? 'Ver códigos de recuperación' : 'Generar códigos de recuperación'}
                    </span>
                    <ChevronRight size={18} style={{ color: 'var(--text-light)' }} />
                  </button>
                )}

                {/* Disable button */}
                {renderButton(handleDisable2FA, 'Desactivar autenticación en dos pasos', { danger: true, fullWidth: true, loading: twoFaLoading })}
              </div>
            )}

            {/* Activate button */}
            {!isEnabled && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {renderButton(() => setTwoFaStep('choose_method'), 'Activar autenticación en dos pasos', { primary: true, fullWidth: true, icon: <ShieldCheck size={18} /> })}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            2FA - CHOOSE METHOD
            ═══════════════════════════════════════════════════════════ */}
        {twoFaStep === 'choose_method' && renderCard(
          <div>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--success-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                <ShieldCheck size={28} style={{ color: 'var(--success)' }} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>Elige el método de verificación</h3>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Selecciona cómo quieres recibir tu código de verificación al iniciar sesión.
              </p>
            </div>

            {/* Option A: Email */}
            <button onClick={handleEmail2FA} disabled={twoFaLoading}
              style={{ width: '100%', padding: '20px', borderRadius: 14, background: 'var(--white)', border: '2px solid var(--border)', cursor: twoFaLoading ? 'not-allowed' : 'pointer', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 16, transition: 'all 0.2s ease', textAlign: 'left' }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,107,53,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Mail size={24} style={{ color: 'var(--primary)' }} />
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Por correo electrónico</h4>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Recibirás un código de 6 dígitos en tu correo cada vez que inicies sesión.
                </p>
              </div>
              <ChevronRight size={20} style={{ color: 'var(--text-light)', flexShrink: 0 }} />
            </button>

            {/* Option B: TOTP Authenticator */}
            <button onClick={handleTotpSetup} disabled={twoFaLoading}
              style={{ width: '100%', padding: '20px', borderRadius: 14, background: 'var(--white)', border: '2px solid var(--border)', cursor: twoFaLoading ? 'not-allowed' : 'pointer', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 16, transition: 'all 0.2s ease', textAlign: 'left' }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Smartphone size={24} style={{ color: '#3B82F6' }} />
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>App Authenticator</h4>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Usa Google Authenticator, Authy u otra app para generar códigos offline.
                </p>
              </div>
              <ChevronRight size={20} style={{ color: 'var(--text-light)', flexShrink: 0 }} />
            </button>

            {renderButton(handleCancel, 'Cancelar')}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            2FA - EMAIL VERIFY (Option A)
            ═══════════════════════════════════════════════════════════ */}
        {twoFaStep === 'email_verifying' && renderCard(
          <div>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--success-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                <Mail size={28} style={{ color: 'var(--success)' }} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>Verificar email - Activar 2FA</h3>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Ingresa el código de 6 dígitos enviado a tu correo:
              </p>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginTop: 6 }}>{user?.email}</p>
            </div>

            <button onClick={handleCancel} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 16, padding: 0 }}>
              <ArrowLeft size={16} /> Cancelar
            </button>

            {renderOtpInputs6(emailCode, setEmailCode, emailInputRefs)}

            {renderButton(handleEmailVerify, 'Activar 2FA por email', { primary: true, fullWidth: true, loading: twoFaLoading, disabled: emailCode.join('').length !== 6 })}
            {renderResendSection(emailResendTimer, handleEmailResend, twoFaLoading)}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            2FA - TOTP VERIFY (Option B - Scan QR + Enter Code)
            ═══════════════════════════════════════════════════════════ */}
        {twoFaStep === 'totp_verify' && renderCard(
          <div>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                <Smartphone size={28} style={{ color: '#3B82F6' }} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>Configurar App Authenticator</h3>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Escanea el código QR con Google Authenticator, Authy u otra app compatible.
              </p>
            </div>

            {/* QR Code */}
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              {totpQrCode && (
                <div style={{ display: 'inline-block', padding: 12, borderRadius: 12, background: '#fff', border: '2px solid var(--border)', marginBottom: 12 }}>
                  <img src={totpQrCode} alt="QR Code TOTP" style={{ width: 200, height: 200, display: 'block' }} />
                </div>
              )}
            </div>

            {/* Manual code */}
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 8, textAlign: 'center' }}>
                Si no puedes escanear, ingresa este código manualmente:
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                <code style={{ fontSize: 13, fontWeight: 600, color: '#3B82F6', background: 'rgba(59,130,246,0.08)', padding: '8px 14px', borderRadius: 8, letterSpacing: 1, wordBreak: 'break-all', flex: 1, textAlign: 'center' }}>
                  {totpSecret}
                </code>
                <button onClick={() => copyToClipboard(totpSecret, setTotpCopied)}
                  style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--input-bg)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {totpCopied ? <Check size={16} style={{ color: 'var(--success)' }} /> : <Copy size={16} style={{ color: 'var(--text-secondary)' }} />}
                </button>
              </div>
            </div>

            {/* Verification code */}
            <div style={{ marginBottom: 4 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', textAlign: 'center', marginBottom: 12 }}>
                Ingresa el código de 6 dígitos que muestra tu app:
              </p>
            </div>

            {renderOtpInputs6(totpCode, setTotpCode, { current: totpInputRefs } as React.MutableRefObject<(HTMLInputElement | null)[]> )}

            {renderButton(handleTotpEnable, 'Activar 2FA', { primary: true, fullWidth: true, loading: twoFaLoading, disabled: totpCode.join('').length !== 6, icon: <ShieldCheck size={18} /> })}
            {renderButton(handleCancel, 'Cancelar')}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            2FA - TOTP BACKUP CODES (shown once after activation)
            ═══════════════════════════════════════════════════════════ */}
        {twoFaStep === 'totp_backup' && renderCard(
          <div>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--success-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                <ShieldCheck size={28} style={{ color: 'var(--success)' }} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>
                2FA activado exitosamente
              </h3>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Guarda estos códigos de recuperación en un lugar seguro. Si pierdes acceso a tu app authenticator, puedes usar uno de estos códigos para iniciar sesión.
              </p>
            </div>

            {/* Warning */}
            <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
              <AlertTriangle size={18} style={{ color: '#F59E0B', flexShrink: 0 }} />
              <p style={{ fontSize: 13, color: '#92400E', lineHeight: 1.5 }}>
                Estos códigos <strong>solo se muestran esta vez</strong>. Cada código es de un solo uso.
              </p>
            </div>

            {/* Codes grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
              {totpBackupCodes.map((code, i) => (
                <div key={i} style={{ padding: '10px 14px', borderRadius: 8, background: 'var(--input-bg)', fontFamily: 'monospace', fontSize: 14, fontWeight: 600, color: 'var(--text)', textAlign: 'center', letterSpacing: 0.5 }}>
                  {code}
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button onClick={() => copyToClipboard(totpBackupCodes.join('\n'), setTotpCodesCopied)}
                style={{ width: '100%', padding: '12px', borderRadius: 10, background: 'var(--input-bg)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
                {totpCodesCopied ? <Check size={16} style={{ color: 'var(--success)' }} /> : <Copy size={16} />}
                {totpCodesCopied ? 'Copiado' : 'Copiar todos los códigos'}
              </button>
              <button onClick={() => downloadBackupCodes(totpBackupCodes)}
                style={{ width: '100%', padding: '12px', borderRadius: 10, background: 'var(--input-bg)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
                <Download size={16} /> Descargar como archivo de texto
              </button>
              {renderButton(handleCancel, 'Entendido, continuar', { primary: true, fullWidth: true })}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            2FA - VIEW BACKUP CODES (from profile when already enabled)
            ═══════════════════════════════════════════════════════════ */}
        {twoFaStep === 'backup_codes_view' && renderCard(
          <div>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                <KeyRound size={28} style={{ color: '#3B82F6' }} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>Códigos de recuperación</h3>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Estos son tus códigos de recuperación actuales. Úsalos si pierdes acceso a tu app authenticator.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
              {viewBackupCodes.map((code, i) => (
                <div key={i} style={{ padding: '10px 14px', borderRadius: 8, background: 'var(--input-bg)', fontFamily: 'monospace', fontSize: 14, fontWeight: 600, color: 'var(--text)', textAlign: 'center', letterSpacing: 0.5 }}>
                  {code}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button onClick={() => copyToClipboard(viewBackupCodes.join('\n'), setViewCodesCopied)}
                style={{ width: '100%', padding: '12px', borderRadius: 10, background: 'var(--input-bg)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
                {viewCodesCopied ? <Check size={16} style={{ color: 'var(--success)' }} /> : <Copy size={16} />}
                {viewCodesCopied ? 'Copiado' : 'Copiar todos los códigos'}
              </button>
              <button onClick={() => downloadBackupCodes(viewBackupCodes)}
                style={{ width: '100%', padding: '12px', borderRadius: 10, background: 'var(--input-bg)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
                <Download size={16} /> Descargar como archivo de texto
              </button>
              {renderButton(handleRegenerateBackupCodes, 'Generar nuevos códigos', { fullWidth: true, loading: regeneratingCodes, icon: <RefreshCw size={16} /> })}
              {renderButton(handleCancel, 'Volver', )}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            2FA - DISABLE VERIFY
            ═══════════════════════════════════════════════════════════ */}
        {(twoFaStep === 'disable_confirming' || twoFaStep === 'disable_verifying') && renderCard(
          <div>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--danger-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                <ShieldOff size={28} style={{ color: 'var(--danger)' }} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>Desactivar 2FA</h3>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Ingresa el código de 6 dígitos enviado a tu correo para confirmar la desactivación:
              </p>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginTop: 6 }}>{user?.email}</p>
            </div>

            <button onClick={handleCancel} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 16, padding: 0 }}>
              <ArrowLeft size={16} /> Cancelar
            </button>

            {renderOtpInputs6(disableCode, setDisableCode, disableInputRefs)}

            {renderButton(handleDisableVerify, 'Desactivar 2FA', { danger: true, fullWidth: true, loading: twoFaLoading, disabled: disableCode.join('').length !== 6 })}
            {renderResendSection(disableResendTimer, handleDisableResend, twoFaLoading)}
          </div>
        )}

        {/* ─── Logout ─── */}
        {renderCard(
          <button onClick={logout}
            style={{ width: '100%', padding: '16px', borderRadius: 16, background: 'var(--white)', color: 'var(--danger)', fontSize: 15, fontWeight: 700, border: '2px solid var(--danger)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <LogOut size={20} /> Cerrar sesión
          </button>
        )}
      </div>
    </div>
  );
}
