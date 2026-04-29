'use client';

import React, { useState, useRef } from 'react';
import {
  Settings, Store, Globe, Shield, Info, RefreshCw,
  ExternalLink, Palette, Upload, Trash2, Type, Image, Check, X, ImageIcon, Plus,
  Clock, Link, Eye, EyeOff, Save, MoreVertical,
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
    <div style={{ padding: 24 }}>
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

  // Upload modal state
  const [showModal, setShowModal] = useState(false);
  const [modalFile, setModalFile] = useState<File | null>(null);
  const [modalPreview, setModalPreview] = useState<string | null>(null);
  const [modalDuration, setModalDuration] = useState(4);
  const [modalLink, setModalLink] = useState('');

  // Inline edit state per banner — duration & link are always visible
  const [localDurations, setLocalDurations] = useState<Record<number, string>>({});
  const [localLinks, setLocalLinks] = useState<Record<number, string>>({});
  const [savingId, setSavingId] = useState<number | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  const getDurationText = (banner: any) => localDurations[banner.id] ?? String(banner.duration || 4);
  const getLinkText = (banner: any) => localLinks[banner.id] ?? (banner.link || '');
  const hasChanges = (banner: any) => {
    const dur = localDurations[banner.id];
    const lnk = localLinks[banner.id];
    return (dur !== undefined && dur !== String(banner.duration || 4)) || (lnk !== undefined && lnk !== (banner.link || ''));
  };
  const setDuration = (id: number, val: string) => setLocalDurations(prev => ({ ...prev, [id]: val }));
  const setLink = (id: number, val: string) => setLocalLinks(prev => ({ ...prev, [id]: val }));

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

  // ── Modal helpers ──
  const openModal = () => {
    setModalFile(null);
    setModalPreview(null);
    setModalDuration(4);
    setModalLink('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalFile(null);
    setModalPreview(null);
    if (bannerInputRef.current) bannerInputRef.current.value = '';
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast('Maximo 5MB por banner', 'error');
      if (bannerInputRef.current) bannerInputRef.current.value = '';
      return;
    }
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm'];
    if (!allowed.includes(file.type)) {
      showToast('Formato no soportado', 'error');
      if (bannerInputRef.current) bannerInputRef.current.value = '';
      return;
    }
    setModalFile(file);
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setModalPreview(url);
    } else if (file.type.startsWith('video/')) {
      setModalPreview('__video__');
    }
  };

  const handleModalUpload = async () => {
    if (!modalFile) { showToast('Selecciona un archivo', 'error'); return; }
    setBannerUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', modalFile);
      formData.append('duration', String(modalDuration));
      if (modalLink.trim()) formData.append('link', modalLink.trim());
      const res: any = await api.post('/banners', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res?.banner) {
        setBanners(prev => [...prev, res.banner]);
        showToast('Banner agregado', 'success');
        closeModal();
      }
    } catch {
      showToast('No se pudo subir el banner', 'error');
    } finally {
      setBannerUploading(false);
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

  // ── Inline save helper ──
  const saveBanner = async (banner: any) => {
    const durText = localDurations[banner.id];
    const lnkText = localLinks[banner.id];
    if (durText === undefined && lnkText === undefined) return;
    const durNum = durText !== undefined ? Number(durText) : banner.duration || 4;
    const linkVal = lnkText !== undefined ? lnkText : banner.link || '';
    setSavingId(banner.id);
    try {
      const formData = new FormData();
      formData.append('duration', String(Math.min(30, Math.max(4, durNum))));
      formData.append('link', linkVal.trim());
      const res: any = await api.put(`/banners/${banner.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res?.banner) {
        setBanners(prev => prev.map(b => b.id === banner.id ? res.banner : b));
        setLocalDurations(prev => { const n = { ...prev }; delete n[banner.id]; return n; });
        setLocalLinks(prev => { const n = { ...prev }; delete n[banner.id]; return n; });
        showToast('Banner actualizado', 'success');
      }
    } catch {
      showToast('No se pudo actualizar', 'error');
    } finally {
      setSavingId(null);
    }
  };

  const toggleBannerActive = async (banner: any) => {
    const newActive = !banner.active;
    setBanners(prev => prev.map(b => b.id === banner.id ? { ...b, active: newActive } : b));
    try {
      const formData = new FormData();
      formData.append('active', String(newActive));
      const res: any = await api.put(`/banners/${banner.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res?.banner) {
        setBanners(prev => prev.map(b => b.id === banner.id ? res.banner : b));
      }
    } catch {
      setBanners(prev => prev.map(b => b.id === banner.id ? { ...b, active: !newActive } : b));
      showToast('No se pudo cambiar estado', 'error');
    }
  };

  // ── Shared input style ──
  const inputStyle: React.CSSProperties = {
    height: 42, borderRadius: 10, border: '2px solid var(--border)', padding: '0 12px',
    fontSize: 14, width: '100%', boxSizing: 'border-box', outline: 'none',
    background: 'var(--input-bg)', color: 'var(--text)',
  };
  const labelStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600,
    color: 'var(--text)', marginBottom: 6,
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
                {banners.map((banner) => {
                  const changed = hasChanges(banner);
                  return (
                  <div key={banner.id} style={{
                    display: 'flex', flexDirection: 'column', gap: 10, padding: 14, borderRadius: 10,
                    background: banner.active ? 'var(--input-bg)' : '#F5F5F5',
                    border: changed ? '2px solid #F39C12' : '2px solid transparent',
                    opacity: banner.active ? 1 : 0.6, transition: 'all 0.2s ease',
                  }}>
                    {/* Top row: thumbnail + info + action buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <img src={banner.imageUrl} alt={`Banner ${banner.sortOrder}`}
                        style={{ width: 120, height: 68, borderRadius: 8, objectFit: 'cover', flexShrink: 0, background: 'var(--border)' }} />

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>
                          Banner {banner.sortOrder}
                          <span style={{ fontSize: 11, color: 'var(--text-light)', fontWeight: 400, marginLeft: 6 }}>
                            {banner.mediaType === 'video' ? 'Video' : 'Imagen'}
                          </span>
                          {!banner.active && <span style={{ fontSize: 10, color: '#EF4444', fontWeight: 600, marginLeft: 6, background: '#FDE8EC', padding: '1px 6px', borderRadius: 4 }}>Inactivo</span>}
                        </p>
                        <p style={{ fontSize: 10, color: 'var(--text-light)', margin: 0 }}>
                          {banner.active ? 'Visible en el carrusel' : 'Oculto del carrusel'}
                        </p>
                      </div>

                      {/* Three-dot menu */}
                      <div ref={(el) => {
                        if (el) {
                          const handler = (e: MouseEvent) => {
                            if (!el.contains(e.target as Node)) setOpenMenuId(null);
                          };
                          document.addEventListener('mousedown', handler);
                          return () => document.removeEventListener('mousedown', handler);
                        }
                      }} style={{ position: 'relative', flexShrink: 0 }}>
                        <button
                          onClick={() => setOpenMenuId(openMenuId === banner.id ? null : banner.id)}
                          style={{
                            width: 32, height: 32, borderRadius: 8, border: 'none',
                            background: 'var(--input-bg)', color: 'var(--text-secondary)',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          <MoreVertical size={18} />
                        </button>
                        {openMenuId === banner.id && (
                          <div style={{
                            position: 'absolute', top: 'calc(100% + 4px)', right: 0, zIndex: 50,
                            background: 'white', borderRadius: 10, border: '2px solid var(--border)',
                            boxShadow: '0 8px 30px rgba(0,0,0,0.12)', overflow: 'hidden', minWidth: 160,
                          }}>
                            <button onClick={() => { toggleBannerActive(banner); setOpenMenuId(null); }}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                                padding: '10px 14px', border: 'none', background: 'transparent',
                                cursor: 'pointer', fontSize: 13, fontWeight: 500, color: 'var(--text)',
                                textAlign: 'left',
                              }}
                              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--input-bg)'; }}
                              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                            >
                              {banner.active ? <EyeOff size={16} color="#F39C12" /> : <Eye size={16} color="#00B894" />}
                              {banner.active ? 'Desactivar' : 'Activar'}
                            </button>
                            <button onClick={() => { handleRemove(banner.id); setOpenMenuId(null); }}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                                padding: '10px 14px', border: 'none', background: 'transparent',
                                cursor: 'pointer', fontSize: 13, fontWeight: 500, color: '#EF4444',
                                textAlign: 'left',
                              }}
                              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#FFF5F5'; }}
                              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                            >
                              <Trash2 size={16} color="#EF4444" /> Eliminar
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom row: Duration + Link — always visible and editable */}
                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                      {/* Duration */}
                      <div style={{ minWidth: 140 }}>
                        <label style={{ ...labelStyle, marginBottom: 4 }}><Clock size={13} /> Duracion (seg)</label>
                        <DurationInput
                          value={Number(getDurationText(banner))}
                          onChange={(v) => setDuration(banner.id, String(v))}
                          compact
                        />
                      </div>

                      {/* Link */}
                      <div style={{ flex: 1, minWidth: 180 }}>
                        <label style={{ ...labelStyle, marginBottom: 4 }}><Link size={13} /> Enlace</label>
                        <input
                          type="url"
                          value={getLinkText(banner)}
                          onChange={e => setLink(banner.id, e.target.value)}
                          placeholder="https://ejemplo.com"
                          style={{ ...inputStyle, height: 36, fontSize: 13 }}
                        />
                      </div>

                      {/* Save button — appears only when there are changes */}
                      <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 0 }}>
                        {changed && (
                          <button
                            onClick={() => saveBanner(banner)}
                            disabled={savingId === banner.id}
                            style={{
                              height: 36, padding: '0 16px', borderRadius: 8, border: 'none',
                              background: savingId === banner.id ? '#F39C12' : 'linear-gradient(135deg, #F39C12, #E67E22)',
                              color: 'white', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap',
                              cursor: savingId === banner.id ? 'wait' : 'pointer',
                              display: 'flex', alignItems: 'center', gap: 6,
                              opacity: savingId === banner.id ? 0.6 : 1,
                              boxShadow: '0 4px 14px rgba(243,156,18,0.3)',
                            }}
                          >
                            {savingId === banner.id ? (
                              <><div style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />Guardando...</>
                            ) : (
                              <><Save size={14} />Guardar</>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}

            {/* Add banner button */}
            <input ref={bannerInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm" onChange={handleFileSelect} style={{ display: 'none' }} />
            <button onClick={openModal}
              style={{
                padding: '14px 16px', borderRadius: 10,
                border: '2px dashed var(--primary)', background: 'var(--primary-light)',
                color: 'var(--primary)', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 0.2s ease',
              }}>
              <Plus size={18} /> Agregar banner
            </button>
            <p style={{ fontSize: 11, color: 'var(--text-light)', margin: 0 }}>Maximo 5MB. Imagenes (JPG, PNG, WebP, GIF) o videos (MP4, WebM).</p>
          </>
        )}
      </div>

      {/* ═══ MODAL: Nuevo Banner ═══ */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', padding: 20 }} onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
          <div style={{ background: '#FFFFFF', borderRadius: 16, padding: 24, maxWidth: 460, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Nuevo Banner</h3>
                <p style={{ fontSize: 12, color: 'var(--text-light)', margin: '4px 0 0' }}>Configura la imagen o video del banner</p>
              </div>
              <button onClick={closeModal} style={{ padding: 6, borderRadius: 8, border: 'none', background: 'var(--input-bg)', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={20} />
              </button>
            </div>

            {/* File preview / select area */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ ...labelStyle, marginBottom: 8 }}><ImageIcon size={14} /> Archivo</label>
              {modalPreview ? (
                <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', background: 'var(--border)', marginBottom: 8 }}>
                  {modalPreview === '__video__' ? (
                    <div style={{ width: '100%', height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a1a2e' }}>
                      <div style={{ textAlign: 'center', color: 'white' }}>
                        <Upload size={32} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.6 }} />
                        <p style={{ fontSize: 13, opacity: 0.8 }}>{modalFile?.name}</p>
                      </div>
                    </div>
                  ) : (
                    <img src={modalPreview} alt="Vista previa" style={{ width: '100%', height: 180, objectFit: 'cover' }} />
                  )}
                  <button onClick={() => { setModalFile(null); setModalPreview(null); if (bannerInputRef.current) bannerInputRef.current.value = ''; }}
                    style={{ position: 'absolute', top: 8, right: 8, padding: 6, borderRadius: 8, border: 'none', background: 'rgba(0,0,0,0.6)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <button onClick={() => bannerInputRef.current?.click()}
                  style={{ width: '100%', height: 120, borderRadius: 12, border: '2px dashed var(--border)', background: 'var(--input-bg)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'border-color 0.2s' }}>
                  <Upload size={28} color="var(--text-light)" />
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', margin: 0 }}>Haz clic para seleccionar</p>
                  <p style={{ fontSize: 11, color: 'var(--text-light)', margin: 0 }}>JPG, PNG, WebP, GIF, MP4, WebM (max 5MB)</p>
                </button>
              )}
            </div>

            {/* Duration field */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ ...labelStyle, marginBottom: 8 }}>
                <Clock size={14} color="#F39C12" /> Duracion del banner
              </label>
              <DurationInput value={modalDuration} onChange={setModalDuration} />
              <p style={{ fontSize: 11, color: 'var(--text-light)', margin: '6px 0 0' }}>
                Tiempo que se muestra cada banner antes de pasar al siguiente (4 a 30 segundos)
              </p>
            </div>

            {/* Link field */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ ...labelStyle, marginBottom: 8 }}>
                <Link size={14} color="#54A0FF" /> Enlace
                <span style={{ fontWeight: 400, color: 'var(--text-light)', marginLeft: 4 }}>(opcional)</span>
              </label>
              <input type="url" value={modalLink} onChange={e => setModalLink(e.target.value)}
                placeholder="https://ejemplo.com"
                style={inputStyle} />
              <p style={{ fontSize: 11, color: 'var(--text-light)', margin: '6px 0 0' }}>
                Al hacer clic en el banner, redirige a esta direccion
              </p>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={closeModal}
                style={{ padding: '10px 20px', borderRadius: 10, border: '2px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text-secondary)', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                <X size={16} /> Cancelar
              </button>
              <button onClick={handleModalUpload} disabled={!modalFile || bannerUploading}
                style={{
                  padding: '10px 24px', borderRadius: 10, border: 'none',
                  background: (!modalFile || bannerUploading) ? 'var(--primary-hover)' : 'linear-gradient(135deg, #F39C12, #E67E22)',
                  color: 'white', fontSize: 14, fontWeight: 700,
                  cursor: (!modalFile || bannerUploading) ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6,
                  opacity: (!modalFile || bannerUploading) ? 0.5 : 1, transition: 'all 0.2s ease',
                  boxShadow: (modalFile && !bannerUploading) ? '0 4px 14px rgba(243,156,18,0.3)' : 'none',
                }}>
                {bannerUploading ? (
                  <><div style={{ width: 16, height: 16, border: '2.5px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Subiendo...</>
                ) : (
                  <><Upload size={16} /> Subir banner</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Duration Input — numeric field with validation (min 4, max 30)
   ═══════════════════════════════════════════════════════════════ */
function DurationInput({ value, onChange, compact }: { value: number; onChange: (v: number) => void; compact?: boolean }) {
  const [text, setText] = useState(String(value));
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // Allow only digits
    if (raw !== '' && !/^\d+$/.test(raw)) return;
    setText(raw);
    if (raw === '') { setError(''); onChange(4); return; }
    const num = Number(raw);
    if (num < 4) { setError('Minimo 4s'); }
    else if (num > 30) { setError('Maximo 30s'); }
    else { setError(''); }
    onChange(Math.min(30, Math.max(4, num)));
  };

  const handleBlur = () => {
    const num = Number(text);
    if (text === '' || num < 4) { setText('4'); onChange(4); setError(''); }
    else if (num > 30) { setText('30'); onChange(30); setError(''); }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={text}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="4"
          maxLength={2}
          style={{
            height: compact ? 36 : 42,
            width: compact ? 70 : 90,
            borderRadius: 10,
            border: error ? '2px solid #EF4444' : '2px solid var(--border)',
            padding: '0 10px',
            fontSize: compact ? 13 : 14,
            fontWeight: 600,
            boxSizing: 'border-box',
            outline: 'none',
            background: error ? '#FFF5F5' : 'var(--input-bg)',
            color: 'var(--text)',
            textAlign: 'center',
          }}
        />
      </div>
      <span style={{
        fontSize: compact ? 12 : 13,
        fontWeight: 600,
        color: error ? '#EF4444' : '#F39C12',
        whiteSpace: 'nowrap',
      }}>
        seg{error ? ` (${error})` : ''}
      </span>
    </div>
  );
}
