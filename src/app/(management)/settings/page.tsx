'use client';

import React, { useState, useRef } from 'react';
import {
  Settings, Store, Globe, Shield, Info, RefreshCw,
  ExternalLink, Palette, Upload, Trash2, Type, Image, Check, X, ImageIcon, Plus,
} from 'lucide-react';
import { useConfig } from '@/contexts/ConfigContext';
import { useAuth } from '@/contexts/AuthContext';
import { showToast } from '@/lib/utils';
import api from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://jo-backend-shop.vercel.app';

export default function SettingsPage() {
  const { user, isAdmin } = useAuth();
  const { config, isMultiStore, isSaving, updateConfig, uploadLogo, deleteLogo } = useConfig();
  const [multiStoreSwitch, setMultiStoreSwitch] = useState(isMultiStore);
  const [switchLoading, setSwitchLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  // Appearance state
  const [shopName, setShopName] = useState(config.shop_name || 'JO-Shop');
  const [primaryColor, setPrimaryColor] = useState(config.primary_color || '#FF6B35');
  const [accentColor, setAccentColor] = useState(config.accent_color || '#E94560');
  const [savingAppearance, setSavingAppearance] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleMultiStoreToggle = async (newValue: boolean) => {
    setSwitchLoading(true);
    setMultiStoreSwitch(newValue);
    try {
      await updateConfig({ multi_store: String(newValue) });
    } catch {
      setMultiStoreSwitch(!newValue);
    } finally {
      setSwitchLoading(false);
    }
  };

  const testConnection = async () => {
    setConnectionStatus('testing');
    try {
      await api.get('/health');
      setConnectionStatus('success');
      showToast('Conexion exitosa', 'success');
    } catch {
      try {
        await api.get('/');
        setConnectionStatus('success');
        showToast('Conexion exitosa', 'success');
      } catch {
        setConnectionStatus('error');
        showToast('No se pudo conectar al servidor', 'error');
      }
    }
  };

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
    setAccentColor('#E94560');
  };

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Settings size={22} color="var(--primary)" />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)' }}>Configuracion</h1>
        </div>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginLeft: 52 }}>Ajustes generales del sistema</p>
        <div style={{ height: 1, background: 'var(--border)', marginTop: 16 }} />
      </div>

      {/* ═══════════════════════════════════════════
          APPEARANCE SECTION (admin-only)
         ═══════════════════════════════════════════ */}
      {isAdmin && (
        <div className="animate-fade-in" style={{ marginBottom: 24 }}>
          <SectionHeader icon={Palette} iconColor="var(--accent)" iconBg="var(--accent-light)" title="Apariencia" description="Personaliza el nombre, colores y logo del sistema" />

          <div style={{ background: '#FFFFFF', borderRadius: 14, padding: 20, boxShadow: 'var(--shadow)', display: 'flex', flexDirection: 'column', gap: 20 }}>

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
                  <span style={{ color: 'white', fontWeight: 800, fontSize: 20 }}>{shopName || 'JO-Shop'}</span>
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
                        background: '#FDE8EC', color: '#EF4444', fontSize: 13, fontWeight: 600,
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
                  color: 'white', fontSize: 14, fontWeight: 700, cursor: savingAppearance ? 'wait' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: 8, boxShadow: savingAppearance ? 'none' : '0 4px 14px rgba(233,69,96,0.3)',
                  opacity: savingAppearance ? 0.7 : 1,
                }}>
                {savingAppearance ? <div style={{ width: 16, height: 16, border: '2.5px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> : <Check size={16} />}
                {savingAppearance ? 'Guardando...' : 'Guardar apariencia'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          STORE MODE SECTION (admin-only)
         ═══════════════════════════════════════════ */}
      {isAdmin && (
        <div className="animate-fade-in" style={{ marginBottom: 24 }}>
          <SectionHeader icon={Store} iconColor="#00B894" iconBg="#E8FBF5" title="Modo de Tienda" description="Configura el modo de operacion de tu tienda" />
          <div style={{ background: '#FFFFFF', borderRadius: 14, padding: 20, boxShadow: 'var(--shadow)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>Multi-Tienda</p>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {multiStoreSwitch
                    ? 'Permite gestionar multiples tiendas desde un solo panel.'
                    : 'Modo tienda unica. Todos los productos y pedidos pertenecen a una sola tienda.'}
                </p>
              </div>
              <button onClick={() => handleMultiStoreToggle(!multiStoreSwitch)} disabled={switchLoading}
                style={{
                  width: 52, height: 28, borderRadius: 14, border: 'none',
                  background: multiStoreSwitch ? '#00B894' : '#DFE4EA',
                  cursor: switchLoading ? 'wait' : 'pointer', position: 'relative', transition: 'all 0.3s ease',
                  opacity: switchLoading ? 0.6 : 1, flexShrink: 0,
                }}>
                <div style={{ position: 'absolute', top: 3, left: multiStoreSwitch ? 27 : 3, width: 22, height: 22, borderRadius: '50%', background: '#FFFFFF', boxShadow: '0 1px 4px rgba(0,0,0,0.2)', transition: 'left 0.3s ease' }} />
              </button>
            </div>
            <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 10, background: multiStoreSwitch ? '#E8FBF5' : 'var(--input-bg)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: multiStoreSwitch ? '#00B894' : '#B2BEC3', flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: 500, color: multiStoreSwitch ? '#00815A' : 'var(--text-secondary)' }}>
                {multiStoreSwitch ? 'Modo Multi-Tienda activado' : 'Modo Tienda Unica activado'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          BANNERS SECTION (admin-only)
         ═══════════════════════════════════════════ */}
      {isAdmin && (
        <BannersSection config={config} updateConfig={updateConfig} isSaving={isSaving} />
      )}

      {/* ═══════════════════════════════════════════
          BACKEND SERVER SECTION (admin-only)
         ═══════════════════════════════════════════ */}
      {isAdmin && (
        <div className="animate-fade-in" style={{ marginBottom: 24 }}>
          <SectionHeader icon={Globe} iconColor="#54A0FF" iconBg="#E8F1FF" title="Servidor Backend" description="Informacion de conexion al servidor" />
          <div style={{ background: '#FFFFFF', borderRadius: 14, padding: 20, boxShadow: 'var(--shadow)', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>URL del servidor (configurada)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px', height: 44, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--input-bg)' }}>
                <Globe size={16} color="var(--text-light)" />
                <span style={{ fontSize: 14, color: 'var(--text)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{API_URL}</span>
                <a href={API_URL} target="_blank" rel="noopener noreferrer" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }} title="Abrir en navegador"><ExternalLink size={16} /></a>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={testConnection} disabled={connectionStatus === 'testing'}
                style={{
                  flex: 1, padding: '10px 16px', borderRadius: 10, border: 'none',
                  background: connectionStatus === 'success' ? '#00B894' : connectionStatus === 'error' ? '#FF6B6B' : 'linear-gradient(135deg, #54A0FF, #74B3FF)',
                  color: 'white', cursor: connectionStatus === 'testing' ? 'wait' : 'pointer',
                  fontWeight: 600, fontSize: 13,
                  boxShadow: connectionStatus === 'success' ? '0 4px 14px rgba(0,184,148,0.3)' : connectionStatus === 'error' ? '0 4px 14px rgba(255,107,107,0.3)' : '0 4px 14px rgba(84,160,255,0.3)',
                  transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  opacity: connectionStatus === 'testing' ? 0.7 : 1,
                }}>
                {connectionStatus === 'testing' ? (
                  <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />Probando...</>
                ) : connectionStatus === 'success' ? 'Conexion exitosa' : connectionStatus === 'error' ? 'Sin conexion' : (<><RefreshCw size={15} />Probar conexion</>)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          ABOUT SECTION
         ═══════════════════════════════════════════ */}
      <div className="animate-fade-in" style={{ marginBottom: 24 }}>
        <SectionHeader icon={Info} iconColor="#A29BFE" iconBg="#F0EDFF" title="Acerca de" description="Informacion de la aplicacion" />
        <div style={{ background: '#FFFFFF', borderRadius: 14, padding: 20, boxShadow: 'var(--shadow)', display: 'flex', flexDirection: 'column', gap: 0 }}>
          {[
            { label: 'Aplicacion', value: config.shop_name || 'JO-Shop' },
            { label: 'Version', value: '1.0.0' },
            { label: 'Plataforma', value: 'Next.js (Web)' },
            { label: 'Rol actual', value: user?.roles?.[0]?.name || user?.role || 'N/A' },
            { label: 'Usuario', value: user?.name || user?.email || 'N/A' },
          ].map((item, idx) => (
            <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: idx < 4 ? '1px solid var(--border)' : 'none' }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>{item.label}</span>
              <span style={{ fontSize: 14, color: 'var(--text)', fontWeight: 600 }}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ icon: Icon, iconColor, iconBg, title, description }: { icon: any; iconColor: string; iconBg: string; title: string; description: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={18} color={iconColor} />
      </div>
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{title}</h2>
        <p style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 1 }}>{description}</p>
      </div>
    </div>
  );
}

function BannersSection({ config, updateConfig, isSaving }: { config: any; updateConfig: (s: Record<string, string>) => Promise<void>; isSaving: boolean }) {
  const [bannersEnabled, setBannersEnabled] = useState(config.banners_enabled === 'true');
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [bannerUploading, setBannerUploading] = useState(false);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Load banners from /banners/all
  const loadBanners = React.useCallback(async () => {
    try {
      const res: any = await api.get('/banners/all');
      setBanners(Array.isArray(res) ? res : res?.data || []);
    } catch {
      setBanners([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    setBannersEnabled(config.banners_enabled === 'true');
  }, [config.banners_enabled]);

  React.useEffect(() => {
    if (config.banners_enabled === 'true') loadBanners();
    else { setBanners([]); setLoading(false); }
  }, [config.banners_enabled, loadBanners]);

  const handleToggle = async (value: boolean) => {
    setBannersEnabled(value);
    try {
      await updateConfig({ banners_enabled: String(value) });
    } catch {
      setBannersEnabled(!value);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { showToast('Maximo 5MB por banner', 'error'); return; }
    setBannerUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res: any = await api.post('/banners', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res?.banner) {
        setBanners(prev => [...prev, res.banner]);
        showToast('Banner agregado', 'success');
      }
    } catch {
      showToast('No se pudo subir el banner', 'error');
    } finally {
      setBannerUploading(false);
      if (bannerInputRef.current) bannerInputRef.current.value = '';
    }
  };

  const handleRemove = async (id: number) => {
    setBanners(prev => prev.filter(b => b.id !== id));
    try {
      await api.delete(`/banners/${id}`);
      showToast('Banner eliminado', 'success');
    } catch {
      loadBanners();
      showToast('No se pudo eliminar', 'error');
    }
  };

  return (
    <div className="animate-fade-in" style={{ marginBottom: 24 }}>
      <SectionHeader icon={ImageIcon} iconColor="#F39C12" iconBg="#FEF3E2" title="Banners de Publicidad" description="Configura los banners del carrusel en la pagina principal" />
      <div style={{ background: '#FFFFFF', borderRadius: 14, padding: 20, boxShadow: 'var(--shadow)', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>Banners activos</p>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {bannersEnabled ? 'Los banners se muestran como carrusel en la pagina principal.' : 'Los banners estan ocultos.'}
            </p>
          </div>
          <button onClick={() => handleToggle(!bannersEnabled)} disabled={isSaving}
            style={{
              width: 52, height: 28, borderRadius: 14, border: 'none',
              background: bannersEnabled ? '#F39C12' : '#DFE4EA',
              cursor: isSaving ? 'wait' : 'pointer', position: 'relative', transition: 'all 0.3s ease',
              opacity: isSaving ? 0.6 : 1, flexShrink: 0,
            }}>
            <div style={{ position: 'absolute', top: 3, left: bannersEnabled ? 27 : 3, width: 22, height: 22, borderRadius: '50%', background: '#FFFFFF', boxShadow: '0 1px 4px rgba(0,0,0,0.2)', transition: 'left 0.3s ease' }} />
          </button>
        </div>

        {bannersEnabled && (
          <>
            {/* Banner list */}
            {loading ? (
              <p style={{ fontSize: 13, color: 'var(--text-light)', textAlign: 'center' }}>Cargando banners...</p>
            ) : banners.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {banners.map((banner) => (
                  <div key={banner.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 10, borderRadius: 10, background: 'var(--input-bg)' }}>
                    <img src={banner.imageUrl} alt={`Banner ${banner.sortOrder}`} style={{ width: 100, height: 56, borderRadius: 8, objectFit: 'cover', flexShrink: 0, background: 'var(--border)' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>
                        Banner {banner.sortOrder}
                        <span style={{ fontSize: 11, color: 'var(--text-light)', fontWeight: 400, marginLeft: 6 }}>
                          {banner.mediaType === 'video' ? 'Video' : 'Imagen'} - {banner.duration}s
                        </span>
                      </p>
                      {banner.link && <p style={{ fontSize: 11, color: 'var(--primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{banner.link}</p>}
                    </div>
                    <button onClick={() => handleRemove(banner.id)} disabled={isSaving}
                      style={{ padding: 6, borderRadius: 8, border: 'none', background: '#FDE8EC', color: '#EF4444', cursor: isSaving ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      title="Eliminar banner">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add banner button */}
            <input ref={bannerInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm" onChange={handleUpload} style={{ display: 'none' }} />
            <button onClick={() => bannerInputRef.current?.click()} disabled={bannerUploading || isSaving}
              style={{
                padding: '14px 16px', borderRadius: 10,
                border: '2px dashed var(--primary)', background: 'var(--primary-light)',
                color: 'var(--primary)', fontSize: 14, fontWeight: 600, cursor: (bannerUploading || isSaving) ? 'wait' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                opacity: (bannerUploading || isSaving) ? 0.6 : 1, transition: 'all 0.2s ease',
              }}>
              {bannerUploading ? (
                <><div style={{ width: 16, height: 16, border: '2px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Subiendo...</>
              ) : (
                <><Plus size={18} /> Agregar banner</>
              )}
            </button>
            <p style={{ fontSize: 11, color: 'var(--text-light)', margin: 0 }}>Maximo 5MB. Imagenes (JPG, PNG, WebP, GIF) o videos (MP4, WebM).</p>
          </>
        )}
      </div>
    </div>
  );
}
