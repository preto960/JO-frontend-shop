'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';

import { getInitials, showToast } from '@/lib/utils';

export default function ProfilePage() {
  const { user, updateProfile, logout } = useAuth();
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
      const data = res.data || res;
      showToast(data.message || '2FA actualizado', 'success');
      // Refresh profile
      const profileRes = await api.get('/auth/me');
      const updated = (profileRes as any).data || (profileRes as any).user || profileRes;
      await updateProfile(updated);
    } catch (err: any) {
      showToast(err?.message || 'Error al cambiar 2FA', 'error');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <Header title="Mi Perfil" showLogout={false} />

      <div style={{ padding: '16px 16px 24px' }}>
        {/* Avatar section */}
        <div className="animate-fade-in" style={{
          background: 'var(--white)', borderRadius: 16, padding: 24,
          boxShadow: 'var(--shadow)', marginBottom: 16, textAlign: 'center',
        }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%', background: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, fontWeight: 700, color: 'white', margin: '0 auto 12px',
          }}>
            {getInitials(user?.name || '')}
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
            {user?.name || 'Usuario'}
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            {user?.email || ''}
          </p>
          <span style={{
            display: 'inline-block', marginTop: 8, padding: '4px 12px', borderRadius: 12,
            background: 'var(--input-bg)', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)',
          }}>
            {user?.role || 'customer'}
          </span>
        </div>

        {/* Profile form */}
        <div className="animate-fade-in" style={{
          background: 'var(--white)', borderRadius: 16, padding: 20,
          boxShadow: 'var(--shadow)', marginBottom: 16,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>Información personal</h3>
            <button
              onClick={() => {
                if (editing) {
                  setPhone(user?.phone || '');
                  setBirthdate(user?.birthdate || '');
                }
                setEditing(!editing);
              }}
              style={{
                padding: '6px 14px', borderRadius: 8, border: 'none',
                background: editing ? 'var(--input-bg)' : 'var(--accent)',
                color: editing ? 'var(--text)' : 'white',
                fontSize: 13, fontWeight: 500, cursor: 'pointer',
              }}
            >
              {editing ? 'Cancelar' : 'Editar'}
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text)', marginBottom: 6 }}>
                Nombre
              </label>
              <input
                type="text"
                value={user?.name || ''}
                disabled
                style={{ background: 'var(--input-bg)', opacity: 0.7 }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text)', marginBottom: 6 }}>
                Correo electrónico
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                style={{ background: 'var(--input-bg)', opacity: 0.7 }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text)', marginBottom: 6 }}>
                Teléfono
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={!editing}
                placeholder="+1 (555) 123-4567"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text)', marginBottom: 6 }}>
                Fecha de nacimiento
              </label>
              <input
                type="date"
                value={birthdate}
                onChange={(e) => setBirthdate(e.target.value)}
                disabled={!editing}
              />
            </div>
          </div>

          {editing && (
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                width: '100%', padding: '12px', borderRadius: 8,
                background: saving ? 'var(--accent-light)' : 'var(--accent)',
                color: 'white', fontSize: 14, fontWeight: 600,
                border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
                marginTop: 20,
              }}
            >
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          )}
        </div>

        {/* 2FA Toggle */}
        <div className="animate-fade-in" style={{
          background: 'var(--white)', borderRadius: 16, padding: 20,
          boxShadow: 'var(--shadow)', marginBottom: 16,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
                Autenticación de dos factores
              </h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                Agrega una capa extra de seguridad a tu cuenta
              </p>
            </div>
            <button
              onClick={toggle2FA}
              style={{
                width: 52, height: 28, borderRadius: 14, border: 'none',
                background: user?.twoFactorEnabled ? 'var(--success)' : 'var(--text-light)',
                cursor: 'pointer', position: 'relative', transition: 'background 0.3s',
              }}
            >
              <div style={{
                width: 22, height: 22, borderRadius: '50%', background: 'white',
                position: 'absolute', top: 3,
                left: user?.twoFactorEnabled ? 27 : 3,
                transition: 'left 0.3s',
                boxShadow: 'var(--shadow)',
              }} />
            </button>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          style={{
            width: '100%', padding: '14px', borderRadius: 12,
            background: 'var(--white)', color: 'var(--accent)',
            fontSize: 15, fontWeight: 600, border: '2px solid var(--accent)',
            cursor: 'pointer', boxShadow: 'var(--shadow)',
          }}
        >
          Cerrar sesión
        </button>
      </div>

    </div>
  );
}
