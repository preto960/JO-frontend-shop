'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit2, Trash2, X, ArrowLeft, Upload, ImageIcon, Power, PowerOff } from 'lucide-react';
import api, { extractData } from '@/lib/api';
import ConfirmModal from '@/components/ConfirmModal';
import { showToast } from '@/lib/utils';

const PLACEHOLDER_IMG = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiB2aWV3Qm94PSIwIDAgMjAwIDIwMCI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNmNWY1ZjUiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iI2NjYyIgZm9udC1zaXplPSIxNCI+U2luIGltYWdlbjwvdGV4dD48L3N2Zz4=';

const styles = {
  overlay: {
    position: 'fixed' as const, inset: 0, background: 'rgba(26,29,41,0.6)',
    backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, padding: 16,
  },
  modal: {
    background: '#FFFFFF', borderRadius: 20, padding: 28, maxWidth: 460, width: '100%',
    boxShadow: '0 25px 60px rgba(0,0,0,0.15)',
  },
  newBtn: {
    padding: '10px 20px', borderRadius: 10, border: 'none',
    background: 'var(--primary-gradient)',
    color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: 6,
    boxShadow: 'var(--shadow-accent)',
    transition: 'all 0.2s ease',
  },
  editBtn: {
    width: 34, height: 34, borderRadius: '50%' as const, border: 'none',
    background: '#E8F1FF', color: '#54A0FF', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.2s ease',
  },
  deleteBtn: {
    width: 34, height: 34, borderRadius: '50%' as const, border: 'none',
    background: '#FFE8E8', color: '#FF6B6B', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.2s ease',
  },
  saveBtn: {
    padding: '10px 20px', borderRadius: 10, border: 'none',
    background: 'var(--primary-gradient)',
    color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: 14,
    boxShadow: 'var(--shadow-accent)',
    transition: 'all 0.2s ease',
  },
  cancelBtn: {
    padding: '10px 20px', borderRadius: 10,
    border: '2px solid var(--border)', background: '#FFFFFF',
    color: 'var(--text)', cursor: 'pointer', fontSize: 14,
    transition: 'all 0.2s ease',
  },
};

export default function AdminCategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [deleteModal, setDeleteModal] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', image: '' });
  const [imageUploading, setImageUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      // Fetch ALL categories (including inactive) for admin view
      const res = await api.get('/categories?all=true');
      setCategories(extractData(res));
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCategories(); }, []);

  const openCreate = () => {
    setEditingCategory(null);
    setForm({ name: '', image: '' });
    setImagePreview(null);
    setModalOpen(true);
  };

  const openEdit = (cat: any) => {
    setEditingCategory(cat);
    setForm({ name: cat.name || '', image: cat.image || '' });
    setImagePreview(cat.image || null);
    setModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showToast('La imagen no debe superar 2MB', 'error');
      return;
    }
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif'];
    if (!allowed.includes(file.type)) {
      showToast('Formatos permitidos: JPG, PNG, WebP, SVG, GIF', 'error');
      return;
    }
    setImageUploading(true);
    // Show local preview
    const localUrl = URL.createObjectURL(file);
    setImagePreview(localUrl);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/categories/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = res?.data?.url || res?.url;
      if (url) {
        setForm((prev) => ({ ...prev, image: url }));
      }
      showToast('Imagen subida correctamente', 'success');
    } catch {
      showToast('Error al subir imagen', 'error');
      setImagePreview(form.image || null);
    } finally {
      setImageUploading(false);
      URL.revokeObjectURL(localUrl);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = () => {
    setForm((prev) => ({ ...prev, image: '' }));
    setImagePreview(null);
  };

  const handleSave = async () => {
    if (!form.name) {
      showToast('El nombre es obligatorio', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload: any = { name: form.name };
      if (form.image) {
        payload.image = form.image;
      } else if (editingCategory?.image) {
        // Explicitly clear the image when it was removed
        payload.image = null;
      }

      if (editingCategory) {
        await api.put(`/categories/${editingCategory.id}`, payload);
        showToast('Categoría actualizada', 'success');
        // Immediately update local state to reflect image removal
        setCategories((prev) =>
          prev.map((c) => (c.id === editingCategory.id ? { ...c, name: form.name, image: form.image || null } : c))
        );
      } else {
        await api.post('/categories', payload);
        showToast('Categoría creada', 'success');
      }
      setModalOpen(false);
      fetchCategories();
    } catch (err: any) {
      showToast(err?.message || 'Error al guardar', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    try {
      await api.delete(`/categories/${deleteModal.id}`);
      showToast('Categoría eliminada', 'success');
      fetchCategories();
    } catch (err: any) {
      showToast(err?.message || 'Error al eliminar', 'error');
    } finally {
      setDeleteModal(null);
    }
  };

  const handleToggleActive = async (cat: any) => {
    const newActive = !cat.active;
    setTogglingId(cat.id);
    try {
      await api.put(`/categories/${cat.id}`, { active: newActive });
      setCategories((prev) =>
        prev.map((c) => (c.id === cat.id ? { ...c, active: newActive } : c))
      );
      showToast(newActive ? 'Categoría activada' : 'Categoría desactivada', 'success');
    } catch {
      showToast('Error al cambiar estado', 'error');
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      {/* Back button */}
      <button
        onClick={() => router.push('/settings')}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-secondary)', fontSize: 14, fontWeight: 500,
          marginBottom: 20, padding: 0, transition: 'color 0.2s ease',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text)'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}
      >
        <ArrowLeft size={18} />
        Volver a Configuracion
      </button>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Categorías</h1>
        <button
          onClick={openCreate}
          style={styles.newBtn}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
        >
          <Plus size={18} /> Nueva categoría
        </button>
      </div>

      {/* Categories list */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div style={{
            width: 36, height: 36,
            border: '3px solid var(--border)', borderTopColor: 'var(--primary)',
            borderRadius: '50%', animation: 'spin 1s linear infinite',
          }} />
        </div>
      ) : categories.length === 0 ? (
        <div style={{ background: '#FFFFFF', borderRadius: 14, padding: 48, textAlign: 'center', boxShadow: 'var(--shadow)' }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%', background: 'var(--primary-light)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 16,
          }}>
            <ImageIcon size={28} color="var(--primary)" />
          </div>
          <p style={{ fontSize: 15, color: 'var(--text-secondary)' }}>No hay categorías</p>
          <p style={{ fontSize: 13, color: 'var(--text-light)', marginTop: 4 }}>Crea tu primera categoría para organizar tus productos</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {categories.map((cat: any) => (
            <div
              key={cat.id} className="animate-fade-in"
              style={{
                background: '#FFFFFF', borderRadius: 16, padding: 18,
                boxShadow: 'var(--shadow)', display: 'flex', alignItems: 'center', gap: 16,
                transition: 'all 0.2s ease',
                opacity: cat.active ? 1 : 0.6,
                position: 'relative',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-md)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
            >
              {/* Category image — outside the card content, bigger */}
              <div style={{
                width: 64, height: 64, borderRadius: 14,
                background: cat.image ? 'none' : 'var(--input-bg)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden', flexShrink: 0,
                border: cat.image ? '2px solid var(--border)' : 'none',
              }}>
                {cat.image ? (
                  <img src={cat.image} alt="" style={{ width: '100%', height: '100%', borderRadius: 12, objectFit: 'cover' }} onError={(e) => { (e.currentTarget as HTMLImageElement).src = PLACEHOLDER_IMG; }} />
                ) : (
                  <ImageIcon size={28} color="var(--text-light)" />
                )}
              </div>

              {/* Text content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', margin: '0 0 2px' }}>{cat.name || cat.nombre}</h3>
                {cat._count?.products > 0 && (
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
                    {cat._count.products} producto(s)
                  </p>
                )}
                {!cat.active && (
                  <span style={{
                    fontSize: 11, fontWeight: 600, color: '#FF6B6B',
                    background: '#FFE8E8', padding: '2px 8px', borderRadius: 6,
                    display: 'inline-block', marginTop: 4,
                  }}>
                    Inactiva
                  </span>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {/* Toggle active */}
                <button
                  onClick={() => handleToggleActive(cat)}
                  disabled={togglingId === cat.id}
                  title={cat.active ? 'Desactivar' : 'Activar'}
                  style={{
                    width: 34, height: 34, borderRadius: '50%', border: 'none',
                    background: cat.active ? '#E8FBF5' : '#FFE8E8',
                    color: cat.active ? '#27AE60' : '#FF6B6B',
                    cursor: togglingId === cat.id ? 'wait' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s ease',
                    opacity: togglingId === cat.id ? 0.5 : 1,
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.1)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
                >
                  {cat.active ? <Power size={15} /> : <PowerOff size={15} />}
                </button>

                <button
                  onClick={() => openEdit(cat)} style={styles.editBtn}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.1)'; (e.currentTarget as HTMLElement).style.background = '#54A0FF'; (e.currentTarget as HTMLElement).style.color = '#fff'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; (e.currentTarget as HTMLElement).style.background = '#E8F1FF'; (e.currentTarget as HTMLElement).style.color = '#54A0FF'; }}
                >
                  <Edit2 size={15} />
                </button>
                <button
                  onClick={() => setDeleteModal(cat)} style={styles.deleteBtn}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.1)'; (e.currentTarget as HTMLElement).style.background = '#FF6B6B'; (e.currentTarget as HTMLElement).style.color = '#fff'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; (e.currentTarget as HTMLElement).style.background = '#FFE8E8'; (e.currentTarget as HTMLElement).style.color = '#FF6B6B'; }}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <div
        style={{ ...styles.overlay, display: modalOpen ? 'flex' : 'none' }}
        onClick={() => setModalOpen(false)}
      >
        <div className="animate-fade-in" onClick={(e) => e.stopPropagation()} style={styles.modal}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', margin: 0 }}>{editingCategory ? 'Editar categoría' : 'Nueva categoría'}</h2>
            <button
              onClick={() => setModalOpen(false)}
              style={{
                width: 32, height: 32, borderRadius: '50%', border: 'none',
                background: 'var(--input-bg)', color: 'var(--text-secondary)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s ease',
              }}
            >
              <X size={16} />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Name */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text)' }}>Nombre *</label>
              <input
                value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Nombre de la categoría"
                style={{ width: '100%', padding: '0 14px', height: 44, borderRadius: 10, border: '1px solid var(--border)', fontSize: 14, color: 'var(--text)', background: '#FFFFFF', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            {/* Image upload */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text)' }}>Imagen de la categoría</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                {/* Preview */}
                <div style={{
                  width: 80, height: 80, borderRadius: 16,
                  border: '2px dashed var(--border)', background: 'var(--input-bg)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden', flexShrink: 0, position: 'relative',
                }}>
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { (e.currentTarget as HTMLImageElement).src = PLACEHOLDER_IMG; }} />
                  ) : (
                    <ImageIcon size={28} color="var(--text-light)" />
                  )}
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/svg+xml,image/gif"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={imageUploading}
                    style={{
                      padding: '9px 14px', borderRadius: 10,
                      border: '2px solid var(--border)', background: 'var(--input-bg)',
                      color: 'var(--text)', fontSize: 13, fontWeight: 600,
                      cursor: imageUploading ? 'wait' : 'pointer',
                      display: 'flex', alignItems: 'center', gap: 8,
                      opacity: imageUploading ? 0.6 : 1,
                    }}
                  >
                    {imageUploading ? (
                      <div style={{ width: 14, height: 14, border: '2px solid var(--border)', borderTopColor: 'var(--text)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    ) : (
                      <Upload size={15} />
                    )}
                    {imageUploading ? 'Subiendo...' : 'Subir imagen'}
                  </button>
                  {(imagePreview || form.image) && (
                    <button
                      onClick={handleRemoveImage}
                      style={{
                        padding: '7px 14px', borderRadius: 10, border: 'none',
                        background: '#FFE8E8', color: '#EF4444',
                        fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 6,
                      }}
                    >
                      <X size={13} /> Quitar imagen
                    </button>
                  )}
                  <p style={{ fontSize: 11, color: 'var(--text-light)', margin: 0 }}>
                    Max 2MB. JPG, PNG, WebP, SVG, GIF
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
            <button onClick={() => setModalOpen(false)} style={styles.cancelBtn}>Cancelar</button>
            <button
              onClick={handleSave} disabled={saving}
              style={{ ...styles.saveBtn, opacity: saving ? 0.7 : 1, background: saving ? '#FDCB6E' : styles.saveBtn.background }}
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      <ConfirmModal
        isOpen={!!deleteModal}
        title="Eliminar categoría"
        message={`¿Estás seguro de eliminar "${deleteModal?.name || 'esta categoría'}"?`}
        confirmText="Eliminar"
        onConfirm={handleDelete}
        onCancel={() => setDeleteModal(null)}
      />
    </div>
  );
}
