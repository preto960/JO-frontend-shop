'use client';
import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ImageIcon, Plus, Trash2, Clock, Link, Eye, EyeOff, Save, MoreVertical, X, Upload, ArrowLeft } from 'lucide-react';
import { useConfig } from '@/contexts/ConfigContext';
import { useAuth } from '@/contexts/AuthContext';
import { showToast } from '@/lib/utils';
import api from '@/lib/api';

/* ─── DurationInput component ─── */
interface DurationInputProps {
  value: number;
  onChange: (val: number) => void;
  compact?: boolean;
  disabled?: boolean;
}

const DurationInput: React.FC<DurationInputProps> = ({ value, onChange, compact = false, disabled = false }) => {
  const [local, setLocal] = useState(String(value));
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === '' || /^\d+$/.test(raw)) {
      setLocal(raw);
      const num = Number(raw);
      if (raw !== '' && (num < 4 || num > 30)) {
        setError('Entre 4 y 30 seg');
      } else {
        setError(null);
      }
      if (raw !== '' && num >= 4 && num <= 30) {
        onChange(num);
      }
    }
  };

  const inputWidth = compact ? 64 : 72;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ position: 'relative' }}>
        <input
          type="number"
          min={4}
          max={30}
          value={local}
          onChange={handleChange}
          disabled={disabled}
          style={{
            width: inputWidth,
            height: compact ? 32 : 42,
            borderRadius: 10,
            border: `2px solid ${error ? '#E74C3C' : 'var(--border)'}`,
            fontSize: compact ? 12 : 14,
            padding: '0 8px',
            textAlign: 'center',
            outline: 'none',
            background: 'var(--white)',
            color: 'var(--text)',
            transition: 'var(--transition-fast)',
            boxSizing: 'border-box',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = error ? '#E74C3C' : 'var(--primary)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = error ? '#E74C3C' : 'var(--border)';
          }}
        />
        {error && (
          <span style={{
            position: 'absolute', bottom: -16, left: 0, fontSize: 10, color: '#E74C3C', whiteSpace: 'nowrap',
          }}>
            {error}
          </span>
        )}
      </div>
      <span style={{ fontSize: compact ? 11 : 13, color: 'var(--text-secondary)', userSelect: 'none' }}>seg</span>
    </div>
  );
};

/* ─── Main Banners Page ─── */
const BannersPage: React.FC = () => {
  const router = useRouter();
  const { config, updateConfig } = useConfig();
  const { isAdmin } = useAuth();

  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── State ── */
  const bannersEnabled = config?.banners_enabled === 'true' || (config?.banners_enabled as any) === true;

  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [modalFile, setModalFile] = useState<File | null>(null);
  const [modalPreview, setModalPreview] = useState<string | null>(null);
  const [modalDuration, setModalDuration] = useState(8);
  const [modalLink, setModalLink] = useState('');

  // Per-banner edits
  const [localDurations, setLocalDurations] = useState<Record<number, string>>({});
  const [localLinks, setLocalLinks] = useState<Record<number, string>>({});
  const [savingId, setSavingId] = useState<number | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  /* ── Helpers ── */
  const loadBanners = async () => {
    setLoading(true);
    try {
      const res = await api.get('/banners/all');
      setBanners(res.data?.data ?? res.data ?? []);
    } catch {
      showToast('Error al cargar banners', 'error');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (bannersEnabled && isAdmin) {
      loadBanners();
    }
  }, [bannersEnabled, isAdmin]);

  React.useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    if (openMenuId !== null) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openMenuId]);

  const hasChanges = (id: number) => {
    const banner = banners.find((b) => b.id === id);
    if (!banner) return false;
    const durChanged = localDurations[id] !== undefined && String(localDurations[id]) !== String(banner.duration);
    const linkChanged = localLinks[id] !== undefined && localLinks[id] !== (banner.link || '');
    return durChanged || linkChanged;
  };

  /* ── Toggle banners enabled ── */
  const handleToggleBanners = async (value: boolean) => {
    try {
      await updateConfig({ banners_enabled: String(value) });
      if (value) loadBanners();
    } catch {
      showToast('Error al actualizar configuracion', 'error');
    }
  };

  /* ── Toggle banner active ── */
  const handleToggleActive = async (banner: any) => {
    try {
      const formData = new FormData();
      formData.append('active', String(!banner.active));
      await api.put(`/banners/${banner.id}`, formData);
      setBanners((prev) =>
        prev.map((b) => (b.id === banner.id ? { ...b, active: !b.active } : b)),
      );
      showToast(banner.active ? 'Banner desactivado' : 'Banner activado', 'success');
    } catch {
      showToast('Error al cambiar estado', 'error');
    }
  };

  /* ── Delete banner ── */
  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este banner?')) return;
    try {
      await api.delete(`/banners/${id}`);
      setBanners((prev) => prev.filter((b) => b.id !== id));
      showToast('Banner eliminado', 'success');
    } catch {
      showToast('Error al eliminar banner', 'error');
    }
  };

  /* ── Save banner edits ── */
  const handleSave = async (id: number) => {
    const banner = banners.find((b) => b.id === id);
    if (!banner) return;
    setSavingId(id);
    try {
      const formData = new FormData();
      const dur = localDurations[id] !== undefined ? localDurations[id] : banner.duration;
      const link = localLinks[id] !== undefined ? localLinks[id] : (banner.link || '');
      formData.append('duration', String(dur));
      formData.append('link', link);
      await api.put(`/banners/${id}`, formData);
      setBanners((prev) =>
        prev.map((b) => (b.id === id ? { ...b, duration: Number(dur), link } : b)),
      );
      setLocalDurations((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setLocalLinks((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      showToast('Banner actualizado', 'success');
    } catch {
      showToast('Error al guardar', 'error');
    } finally {
      setSavingId(null);
    }
  };

  /* ── Modal helpers ── */
  const openModal = () => {
    setModalFile(null);
    setModalPreview(null);
    setModalDuration(8);
    setModalLink('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalFile(null);
    if (modalPreview) URL.revokeObjectURL(modalPreview);
    setModalPreview(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('El archivo supera 5MB', 'error');
      return;
    }

    const allowedImage = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const allowedVideo = ['video/mp4', 'video/webm'];
    if (!allowedImage.includes(file.type) && !allowedVideo.includes(file.type)) {
      showToast('Formato no soportado', 'error');
      return;
    }

    setModalFile(file);
    if (modalPreview) URL.revokeObjectURL(modalPreview);
    setModalPreview(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!modalFile) {
      showToast('Selecciona un archivo', 'error');
      return;
    }
    setBannerUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', modalFile);
      formData.append('duration', String(modalDuration));
      if (modalLink.trim()) formData.append('link', modalLink.trim());
      await api.post('/banners', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      showToast('Banner subido correctamente', 'success');
      closeModal();
      loadBanners();
    } catch {
      showToast('Error al subir banner', 'error');
    } finally {
      setBannerUploading(false);
    }
  };

  /* ── Auth guard ── */
  if (!isAdmin) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400, color: 'var(--text-secondary)', fontSize: 16 }}>
        Acceso no autorizado
      </div>
    );
  }

  /* ── Media type helper ── */
  const getMediaType = (url: string) => {
    if (!url) return 'image';
    if (url.match(/\.(mp4|webm)(\?.*)?$/i)) return 'video';
    return 'image';
  };

  /* ── Render ── */
  return (
    <div style={{ padding: '24px 20px 40px' }}>
      {/* Back button */}
      <button
        onClick={() => router.push('/settings')}
        style={{
          display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24,
          background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)',
          fontSize: 14, fontWeight: 500, padding: 0, transition: 'var(--transition-fast)',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--primary)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
      >
        <ArrowLeft size={18} />
        Volver a Configuracion
      </button>

      {/* Section header */}
      <h2 style={{ margin: '0 0 24px', fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>
        Banners de Publicidad
      </h2>

      {/* Main card */}
      <div style={{
        background: 'var(--white)', borderRadius: 14, padding: 20,
        boxShadow: 'var(--shadow)', border: '1px solid var(--border)',
      }}>
        {/* Enable / Disable toggle */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 0', borderBottom: '1px solid var(--border)', marginBottom: 20,
        }}>
          <div>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>
              {bannersEnabled ? 'Banners activados' : 'Banners desactivados'}
            </p>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', marginTop: 3 }}>
              {bannersEnabled
                ? 'Los banners se muestran en la tienda online.'
                : 'Activa para mostrar banners en la tienda online.'}
            </p>
          </div>
          <button
            onClick={() => handleToggleBanners(!bannersEnabled)}
            style={{
              width: 52, height: 28, borderRadius: 14, border: 'none', cursor: 'pointer',
              background: bannersEnabled ? '#F39C12' : '#DFE4EA',
              position: 'relative', transition: 'var(--transition-fast)', flexShrink: 0,
            }}
          >
            <span style={{
              width: 22, height: 22, borderRadius: 11, background: '#FFF',
              position: 'absolute', top: 3,
              left: bannersEnabled ? 27 : 3,
              transition: 'var(--transition-fast)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            }} />
          </button>
        </div>

        {/* Banner list (only when enabled) */}
        {bannersEnabled && (
          <>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)', fontSize: 14 }}>
                Cargando banners...
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {banners.map((banner, index) => {
                  const changed = hasChanges(banner.id);
                  const isVideo = getMediaType(banner.imageUrl) === 'video';
                  const localDur = localDurations[banner.id] ?? String(banner.duration ?? 8);
                  const localLink = localLinks[banner.id] ?? (banner.link || '');

                  return (
                    <div
                      key={banner.id}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: 14, padding: 14,
                        borderRadius: 10, background: 'var(--input-bg)',
                        border: changed ? '2px solid #F39C12' : '2px solid transparent',
                        transition: 'var(--transition-fast)', position: 'relative',
                      }}
                    >
                      {/* Thumbnail */}
                      <div style={{
                        width: 120, height: 68, borderRadius: 8, overflow: 'hidden',
                        background: 'var(--border)', flexShrink: 0, position: 'relative',
                      }}>
                        {isVideo ? (
                          <div style={{
                            width: '100%', height: '100%', display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                            background: 'linear-gradient(135deg, #2C3E50, #34495E)',
                          }}>
                            <span style={{ color: '#FFF', fontSize: 20, fontWeight: 700 }}>▶</span>
                          </div>
                        ) : (
                          <img
                            src={banner.imageUrl}
                            alt={`Banner ${index + 1}`}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        )}
                        {/* Sort badge */}
                        <span style={{
                          position: 'absolute', top: 4, left: 4,
                          background: 'rgba(0,0,0,0.6)', color: '#FFF',
                          fontSize: 10, fontWeight: 600, padding: '2px 6px',
                          borderRadius: 4,
                        }}>
                          #{index + 1}
                        </span>
                        {/* Media type badge */}
                        <span style={{
                          position: 'absolute', top: 4, right: 4,
                          background: isVideo ? '#E74C3C' : 'var(--primary)',
                          color: '#FFF', fontSize: 9, fontWeight: 600, padding: '2px 6px',
                          borderRadius: 4, textTransform: 'uppercase',
                        }}>
                          {isVideo ? 'Video' : 'Img'}
                        </span>
                      </div>

                      {/* Details */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                          {/* Active status */}
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            fontSize: 11, fontWeight: 600,
                            color: banner.active ? '#27AE60' : 'var(--text-secondary)',
                            background: banner.active ? 'rgba(39,174,96,0.1)' : 'var(--input-bg)',
                            padding: '3px 8px', borderRadius: 6,
                          }}>
                            {banner.active ? <Eye size={12} /> : <EyeOff size={12} />}
                            {banner.active ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>

                        {/* Duration */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <Clock size={14} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
                          <DurationInput
                            compact
                            value={Number(localDur)}
                            onChange={(val) => setLocalDurations((prev) => ({ ...prev, [banner.id]: String(val) }))}
                          />
                        </div>

                        {/* Link */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Link size={14} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
                          <input
                            type="text"
                            placeholder="Enlace (opcional)"
                            value={localLink}
                            onChange={(e) => setLocalLinks((prev) => ({ ...prev, [banner.id]: e.target.value }))}
                            style={{
                              flex: 1, height: 32, borderRadius: 8, border: '1px solid var(--border)',
                              fontSize: 12, padding: '0 10px', outline: 'none',
                              background: 'var(--white)', color: 'var(--text)',
                              transition: 'var(--transition-fast)',
                            }}
                            onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--primary)')}
                            onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
                          />
                        </div>
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                        {/* Save button (when changes) */}
                        {changed && (
                          <button
                            onClick={() => handleSave(banner.id)}
                            disabled={savingId === banner.id}
                            style={{
                              width: 32, height: 32, borderRadius: 8, border: 'none', cursor: 'pointer',
                              background: 'var(--primary)', color: '#FFF', display: 'flex',
                              alignItems: 'center', justifyContent: 'center', transition: 'var(--transition-fast)',
                              opacity: savingId === banner.id ? 0.6 : 1,
                            }}
                            title="Guardar cambios"
                          >
                            <Save size={14} />
                          </button>
                        )}

                        {/* More menu */}
                        <div style={{ position: 'relative' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(openMenuId === banner.id ? null : banner.id);
                            }}
                            style={{
                              width: 32, height: 32, borderRadius: 8, border: 'none', cursor: 'pointer',
                              background: 'var(--input-bg)', color: 'var(--text-secondary)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              transition: 'var(--transition-fast)',
                            }}
                          >
                            <MoreVertical size={14} />
                          </button>

                          {openMenuId === banner.id && (
                            <div style={{
                              position: 'absolute', right: 0, top: 36, zIndex: 100,
                              background: 'var(--white)', borderRadius: 10,
                              boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)',
                              minWidth: 160, overflow: 'hidden',
                            }}>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleToggleActive(banner); setOpenMenuId(null); }}
                                style={{
                                  width: '100%', padding: '10px 14px', border: 'none', background: 'none',
                                  cursor: 'pointer', textAlign: 'left', fontSize: 13,
                                  color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 10,
                                  transition: 'var(--transition-fast)',
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--input-bg)')}
                                onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                              >
                                {banner.active ? <EyeOff size={14} /> : <Eye size={14} />}
                                {banner.active ? 'Desactivar' : 'Activar'}
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDelete(banner.id); setOpenMenuId(null); }}
                                style={{
                                  width: '100%', padding: '10px 14px', border: 'none', background: 'none',
                                  cursor: 'pointer', textAlign: 'left', fontSize: 13,
                                  color: '#E74C3C', display: 'flex', alignItems: 'center', gap: 10,
                                  transition: 'var(--transition-fast)',
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(231,76,60,0.06)')}
                                onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                              >
                                <Trash2 size={14} />
                                Eliminar
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Add banner button */}
                <button
                  onClick={openModal}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', gap: 10, padding: '28px 20px',
                    borderRadius: 10, border: '2px dashed var(--border)',
                    background: 'transparent', cursor: 'pointer',
                    transition: 'var(--transition-fast)', color: 'var(--text-secondary)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--primary)';
                    e.currentTarget.style.background = 'rgba(243,156,18,0.04)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%', border: '2px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'var(--transition-fast)',
                  }}>
                    <Plus size={20} style={{ color: 'var(--primary)' }} />
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
                    Agregar banner
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.4, maxWidth: 260 }}>
                    Maximo 5MB. Imagenes (JPG, PNG, WebP, GIF) o videos (MP4, WebM).
                  </span>
                </button>

                {/* Empty state */}
                {!loading && banners.length === 0 && (
                  <div style={{
                    textAlign: 'center', padding: '30px 20px',
                    color: 'var(--text-secondary)', fontSize: 14,
                  }}>
                    <ImageIcon size={36} style={{ marginBottom: 10, opacity: 0.3 }} />
                    <p style={{ margin: 0 }}>No hay banners configurados</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Disabled message */}
        {!bannersEnabled && (
          <div style={{
            textAlign: 'center', padding: '40px 20px',
            color: 'var(--text-secondary)', fontSize: 14,
          }}>
            <ImageIcon size={36} style={{ marginBottom: 10, opacity: 0.3 }} />
            <p style={{ margin: 0 }}>Los banners estan desactivados</p>
            <p style={{ margin: '6px 0 0', fontSize: 12 }}>
              Activa la funcion para gestionar tus banners.
            </p>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showModal && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20,
          }}
          onClick={closeModal}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--white)', borderRadius: 14, padding: 24,
              width: '100%', maxWidth: 460,
              boxShadow: 'var(--shadow-lg)',
              animation: 'fadeIn 0.2s ease-out',
            }}
          >
            {/* Modal header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 20,
            }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>
                Subir Banner
              </h3>
              <button
                onClick={closeModal}
                style={{
                  width: 32, height: 32, borderRadius: 8, border: 'none',
                  background: 'var(--input-bg)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--text-secondary)', transition: 'var(--transition-fast)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--border)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--input-bg)')}
              >
                <X size={16} />
              </button>
            </div>

            {/* File preview / select area */}
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: '100%', minHeight: 180, borderRadius: 12,
                border: '2px dashed var(--border)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden', marginBottom: 20, position: 'relative',
                transition: 'var(--transition-fast)',
                background: modalPreview ? '#000' : 'var(--input-bg)',
              }}
              onMouseEnter={(e) => {
                if (!modalPreview) e.currentTarget.style.borderColor = 'var(--primary)';
              }}
              onMouseLeave={(e) => {
                if (!modalPreview) e.currentTarget.style.borderColor = 'var(--border)';
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
                style={{ display: 'none' }}
                onChange={handleFileSelect}
              />

              {modalPreview && modalFile ? (
                <>
                  {modalFile.type.startsWith('video/') ? (
                    <video
                      src={modalPreview}
                      style={{ width: '100%', maxHeight: 220, objectFit: 'contain' }}
                      muted
                      autoPlay
                      loop
                    />
                  ) : (
                    <img
                      src={modalPreview}
                      alt="Preview"
                      style={{ width: '100%', maxHeight: 220, objectFit: 'contain' }}
                    />
                  )}
                  {/* Remove file overlay */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (modalPreview) URL.revokeObjectURL(modalPreview);
                      setModalFile(null);
                      setModalPreview(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    style={{
                      position: 'absolute', top: 8, right: 8,
                      width: 28, height: 28, borderRadius: '50%', border: 'none',
                      background: 'rgba(0,0,0,0.6)', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#FFF',
                    }}
                  >
                    <X size={14} />
                  </button>
                </>
              ) : (
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  gap: 8, padding: 20, textAlign: 'center',
                }}>
                  <Upload size={32} style={{ color: 'var(--text-secondary)', opacity: 0.5 }} />
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    Haz clic para seleccionar un archivo
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-light)' }}>
                    JPG, PNG, WebP, GIF, MP4, WebM — Max 5MB
                  </span>
                </div>
              )}
            </div>

            {/* Duration input */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>
                <Clock size={14} style={{ color: 'var(--text-secondary)' }} />
                Duracion
              </label>
              <DurationInput value={modalDuration} onChange={setModalDuration} />
            </div>

            {/* Link input */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>
                <Link size={14} style={{ color: 'var(--text-secondary)' }} />
                Enlace (opcional)
              </label>
              <input
                type="text"
                placeholder="https://ejemplo.com"
                value={modalLink}
                onChange={(e) => setModalLink(e.target.value)}
                style={{
                  width: '100%', height: 42, borderRadius: 10,
                  border: '2px solid var(--border)', fontSize: 14,
                  padding: '0 12px', outline: 'none', boxSizing: 'border-box',
                  background: 'var(--white)', color: 'var(--text)',
                  transition: 'var(--transition-fast)',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--primary)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
              />
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={closeModal}
                style={{
                  flex: 1, height: 44, borderRadius: 10, border: '2px solid var(--border)',
                  background: 'transparent', cursor: 'pointer', fontSize: 14,
                  fontWeight: 600, color: 'var(--text-secondary)', transition: 'var(--transition-fast)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--input-bg)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                Cancelar
              </button>
              <button
                onClick={handleUpload}
                disabled={bannerUploading || !modalFile}
                style={{
                  flex: 1, height: 44, borderRadius: 10, border: 'none',
                  background: bannerUploading || !modalFile ? 'var(--border)' : 'var(--primary-gradient)',
                  cursor: bannerUploading || !modalFile ? 'not-allowed' : 'pointer',
                  fontSize: 14, fontWeight: 600, color: '#FFF',
                  transition: 'var(--transition-fast)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                <Upload size={16} />
                {bannerUploading ? 'Subiendo...' : 'Subir Banner'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inline keyframes for modal animation */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default BannersPage;
