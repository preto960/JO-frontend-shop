'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import { Shield, User, LogOut, Edit3, Check, Mail, Phone, Calendar } from 'lucide-react';
import { getInitials, showToast, getRoleLabel, getRoleBadgeColor } from '@/lib/utils';

export default function ProfilePage() {
  const { user, updateProfile, logout, userRole, refreshProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [phone, setPhone] = useState(user?.phone || '');
  const [birthdate, setBirthdate] = useState(user?.birthdate || '');
  const [saving, setSaving] = useState(false);

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

  const toggle2FA = async () => {
    try {
      const { default: api } = await import('@/lib/api');
      const res = await api.post('/auth/2fa/toggle');
      showToast(res?.message || '2FA actualizado', 'success');
      await refreshProfile();
    } catch (err: any) {
      showToast(err?.message || 'Error al cambiar 2FA', 'error');
    }
  };

  const roleColor = getRoleBadgeColor(userRole);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <Header title="Mi Perfil" showLogout={false} />

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
                  style={{ background: 'var(--input-bg)', opacity: 0.7, height: 40, fontSize: 14 }}
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
                  style={{ background: 'var(--input-bg)', opacity: 0.7, height: 40, fontSize: 14 }}
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
                  style={{ height: 40, fontSize: 14 }}
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
                  style={{ height: 40, fontSize: 14 }}
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

        {/* 2FA Toggle */}
        <div className="animate-fade-in" style={{
          background: 'var(--white)', borderRadius: 20, padding: 20,
          boxShadow: 'var(--shadow)', marginBottom: 16,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, background: 'var(--info-light)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Shield size={22} style={{ color: 'var(--info)' }} />
              </div>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>
                  Autenticación en dos pasos
                </h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  Agrega una capa extra de seguridad
                </p>
              </div>
            </div>
            <button
              onClick={toggle2FA}
              style={{
                width: 54, height: 30, borderRadius: 15, border: 'none',
                background: user?.twoFactorEnabled ? 'var(--success)' : 'var(--text-light)',
                cursor: 'pointer', position: 'relative', transition: 'background 0.3s',
                boxShadow: user?.twoFactorEnabled ? 'var(--shadow-success)' : 'none',
              }}
            >
              <div style={{
                width: 24, height: 24, borderRadius: '50%', background: 'white',
                position: 'absolute', top: 3,
                left: user?.twoFactorEnabled ? 27 : 3,
                transition: 'left 0.3s', boxShadow: 'var(--shadow)',
              }} />
            </button>
          </div>
        </div>

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
