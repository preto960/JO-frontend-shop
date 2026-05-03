'use client';
import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Palette, Upload, Trash2, Type, Image, Check, RefreshCw, ArrowLeft } from 'lucide-react';
import { useConfig } from '@/contexts/ConfigContext';
import { useAuth } from '@/contexts/AuthContext';
import { showToast } from '@/lib/utils';

export default function AppearanceSettingsPage() {
  const router = useRouter();
  const { isAdmin } = useAuth();
  const { config, isSaving, updateConfig, uploadLogo, deleteLogo } = useConfig();

  const [shopName, setShopName] = useState(config.shop_name || 'JO-Shop');
  const [primaryColor, setPrimaryColor] = useState(config.primary_color || '#FF6B35');
  const [accentColor, setAccentColor] = useState(config.accent_color || 'var(--accent)');
  const [savingAppearance, setSavingAppearance] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveAppearance = async () => {
    setSavingAppearance(true);
    try {
      await updateConfig({
        shop_name: shopName,
        primary_color: primaryColor,
        accent_color: accentColor,
      });
    } catch {
      // error already handled by updateConfig
    } finally {
      setSavingAppearance(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showToast('La imagen no debe superar 2MB', 'error');
      return;
    }
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!allowed.includes(file.type)) {
      showToast('Formatos permitidos: JPG, PNG, WebP, SVG', 'error');
      return;
    }
    setLogoUploading(true);
    try {
      await uploadLogo(file);
    } catch {
      // error handled
    } finally {
      setLogoUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteLogo = async () => {
    try {
      await deleteLogo();
    } catch {
      // error handled
    }
  };

  const resetAppearanceDefaults = () => {
    setShopName('JO-Shop');
    setPrimaryColor('#FF6B35');
    setAccentColor('var(--accent)');
  };

  if (!isAdmin) {
    return (
      <div style={{ padding: 24, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Palette size={28} color="#EF4444" />
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>No autorizado</h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20 }}>No tienes permisos para acceder a esta seccion.</p>
          <button
            onClick={() => router.push('/settings')}
            style={{
              padding: '10px 24px', borderRadius: 10, border: '2px solid var(--border)',
              background: 'var(--input-bg)', color: 'var(--text)', fontSize: 14, fontWeight: 600,
              cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8,
            }}
          >
            <ArrowLeft size={16} /> Volver a Configuracion
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      {/* Back button */}
      <button
        onClick={() => router.push('/settings')}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-secondary)', fontSize: 14, fontWeight: 500,
          marginBottom: 20, padding: 0,
          transition: 'color 0.2s ease',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text)'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}
      >
        <ArrowLeft size={18} />
        Volver a Configuracion
      </button>

      {/* Section header */}
      <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', margin: '0 0 4px 0' }}>Apariencia</h1>

      <div style={{ height: 1, background: 'var(--border)', margin: '16px 0 28px 0' }} />

      {/* Main card */}
      <div style={{ background: 'var(--card)', borderRadius: 14, padding: 20, boxShadow: 'var(--shadow)', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Shop Name */}
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>
            <Type size={16} color="var(--text-secondary)" /> Nombre del sistema
          </label>
          <input
            type="text"
            value={shopName}
            onChange={e => setShopName(e.target.value)}
            placeholder="JO-Shop"
            style={{ height: 44, borderRadius: 10, border: '2px solid var(--border)', padding: '0 14px', fontSize: 15, width: '100%', boxSizing: 'border-box', outline: 'none' }}
          />
        </div>

        {/* Colors Row */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {/* Primary color */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>
              <Palette size={16} color={primaryColor} /> Color primario
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="color"
                value={primaryColor}
                onChange={e => setPrimaryColor(e.target.value)}
                style={{ width: 44, height: 44, borderRadius: 10, border: '2px solid var(--border)', cursor: 'pointer', padding: 2, background: 'none' }}
              />
              <input
                type="text"
                value={primaryColor}
                onChange={e => { if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) setPrimaryColor(e.target.value); }}
                placeholder="#FF6B35"
                maxLength={7}
                style={{ height: 44, borderRadius: 10, border: '2px solid var(--border)', padding: '0 14px', fontSize: 14, width: '100%', boxSizing: 'border-box', outline: 'none', fontFamily: 'monospace' }}
              />
            </div>
          </div>

          {/* Accent color */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>
              <Palette size={16} color={accentColor} /> Color secundario (accent)
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="color"
                value={accentColor}
                onChange={e => setAccentColor(e.target.value)}
                style={{ width: 44, height: 44, borderRadius: 10, border: '2px solid var(--border)', cursor: 'pointer', padding: 2, background: 'none' }}
              />
              <input
                type="text"
                value={accentColor}
                onChange={e => { if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) setAccentColor(e.target.value); }}
                placeholder="#E94560"
                maxLength={7}
                style={{ height: 44, borderRadius: 10, border: '2px solid var(--border)', padding: '0 14px', fontSize: 14, width: '100%', boxSizing: 'border-box', outline: 'none', fontFamily: 'monospace' }}
              />
            </div>
          </div>
        </div>

        {/* Color Preview */}
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-light)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Vista previa</p>
          <div style={{ display: 'flex', gap: 12, alignItems: 'stretch' }}>
            <div style={{ flex: 1, padding: 16, borderRadius: 12, background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 80 }}>
              <span style={{ color: 'var(--white)', fontWeight: 800, fontSize: 20 }}>{shopName || 'JO-Shop'}</span>
              <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>Tu tienda de confianza</span>
            </div>
            <div style={{ width: 80, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ flex: 1, borderRadius: 10, background: primaryColor, border: '2px solid var(--border)' }} />
              <div style={{ flex: 1, borderRadius: 10, background: accentColor, border: '2px solid var(--border)' }} />
            </div>
          </div>
        </div>

        {/* Logo Upload */}
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>
            <Image size={16} color="var(--text-secondary)" /> Logo del sistema
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Current logo */}
            <div style={{
              width: 80, height: 80, borderRadius: 12, border: '2px dashed var(--border)',
              background: 'var(--input-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden', flexShrink: 0, position: 'relative',
            }}>
              {config.shop_logo_url ? (
                <img src={config.shop_logo_url} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <Image size={28} color="var(--text-light)" />
              )}
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/svg+xml" onChange={handleLogoUpload} style={{ display: 'none' }} />
              <button onClick={() => fileInputRef.current?.click()} disabled={logoUploading || isSaving}
                style={{
                  padding: '10px 16px', borderRadius: 10, border: '2px solid var(--border)',
                  background: 'var(--input-bg)', color: 'var(--text)', fontSize: 13, fontWeight: 600,
                  cursor: (logoUploading || isSaving) ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                  opacity: (logoUploading || isSaving) ? 0.6 : 1,
                }}>
                {logoUploading ? <div style={{ width: 14, height: 14, border: '2px solid var(--border)', borderTopColor: 'var(--text)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> : <Upload size={16} />}
                {logoUploading ? 'Subiendo...' : 'Subir logo'}
              </button>
              {config.shop_logo_url && (
                <button onClick={handleDeleteLogo} disabled={isSaving}
                  style={{
                    padding: '8px 16px', borderRadius: 10, border: 'none',
                    background: 'var(--accent-light)', color: 'var(--danger)', fontSize: 13, fontWeight: 600,
                    cursor: isSaving ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                    opacity: isSaving ? 0.6 : 1,
                  }}>
                  <Trash2 size={14} /> Eliminar logo
                </button>
              )}
              <p style={{ fontSize: 11, color: 'var(--text-light)', margin: 0 }}>Maximo 2MB. Formatos: JPG, PNG, WebP, SVG</p>
            </div>
          </div>
        </div>

        {/* Save / Reset buttons */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 8, borderTop: '1px solid var(--border)' }}>
          <button onClick={resetAppearanceDefaults}
            style={{ padding: '10px 20px', borderRadius: 10, border: '2px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text-secondary)', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
            <RefreshCw size={15} /> Restaurar valores
          </button>
          <button onClick={handleSaveAppearance} disabled={savingAppearance}
            style={{
              padding: '10px 24px', borderRadius: 10, border: 'none',
              background: savingAppearance ? 'var(--primary-hover)' : 'var(--primary-gradient)',
              color: 'var(--white)', fontSize: 14, fontWeight: 700, cursor: savingAppearance ? 'wait' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 8, boxShadow: savingAppearance ? 'none' : '0 4px 14px rgba(233,69,96,0.3)',
              opacity: savingAppearance ? 0.7 : 1,
            }}>
            {savingAppearance ? <div style={{ width: 16, height: 16, border: '2.5px solid rgba(255,255,255,0.3)', borderTopColor: 'var(--white)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> : <Check size={16} />}
            {savingAppearance ? 'Guardando...' : 'Guardar apariencia'}
          </button>
        </div>
      </div>
    </div>
  );
}
