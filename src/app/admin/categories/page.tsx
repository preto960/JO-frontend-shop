'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import api, { extractData } from '@/lib/api';
import ConfirmModal from '@/components/ConfirmModal';
import { showToast } from '@/lib/utils';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [deleteModal, setDeleteModal] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', image: '' });

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await api.get('/categories');
      setCategories(extractData(res));
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCategories(); }, []);

  const openCreate = () => {
    setEditingCategory(null);
    setForm({ name: '', description: '', image: '' });
    setModalOpen(true);
  };

  const openEdit = (cat: any) => {
    setEditingCategory(cat);
    setForm({ name: cat.name || '', description: cat.description || '', image: cat.image || '' });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name) {
      showToast('El nombre es obligatorio', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload: any = { name: form.name, description: form.description };
      if (form.image) payload.image = form.image;

      if (editingCategory) {
        await api.put(`/categories/${editingCategory.id}`, payload);
        showToast('Categoría actualizada', 'success');
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

  return (
    <div style={{ padding: '24px', maxWidth: 800, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)' }}>Categorías</h1>
        <button onClick={openCreate} style={{
          padding: '10px 20px', borderRadius: 8, background: 'var(--accent)',
          color: 'white', fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <Plus size={18} /> Nueva categoría
        </button>
      </div>

      {/* Categories list */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        </div>
      ) : categories.length === 0 ? (
        <div style={{ background: 'var(--white)', borderRadius: 12, padding: 40, textAlign: 'center', boxShadow: 'var(--shadow)' }}>
          <p style={{ fontSize: 48, marginBottom: 12 }}>🏷️</p>
          <p style={{ color: 'var(--text-secondary)' }}>No hay categorías</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {categories.map((cat: any) => (
            <div key={cat.id} className="animate-fade-in" style={{
              background: 'var(--white)', borderRadius: 12, padding: 16,
              boxShadow: 'var(--shadow)', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 10, background: 'var(--input-bg)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                }}>
                  {cat.image ? (
                    <img src={cat.image} alt="" style={{ width: '100%', height: '100%', borderRadius: 10, objectFit: 'cover' }} />
                  ) : '🏷️'}
                </div>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{cat.name || cat.nombre}</h3>
                  {cat.description && <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>{cat.description}</p>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={() => openEdit(cat)} style={{
                  width: 36, height: 36, borderRadius: 8, border: 'none',
                  background: '#3498DB15', color: '#3498DB', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Edit2 size={16} />
                </button>
                <button onClick={() => setDeleteModal(cat)} style={{
                  width: 36, height: 36, borderRadius: 8, border: 'none',
                  background: '#E9456015', color: '#E94560', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <div style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
        display: modalOpen ? 'flex' : 'none', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: 16,
      }} onClick={() => setModalOpen(false)}>
        <div className="animate-fade-in" onClick={(e) => e.stopPropagation()} style={{
          background: 'var(--white)', borderRadius: 16, padding: 24, maxWidth: 400, width: '100%',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>{editingCategory ? 'Editar categoría' : 'Nueva categoría'}</h2>
            <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Nombre *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nombre de la categoría" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Descripción</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Descripción" rows={2} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>URL de imagen</label>
              <input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="https://..." />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
            <button onClick={() => setModalOpen(false)} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--white)', color: 'var(--text)', cursor: 'pointer' }}>Cancelar</button>
            <button onClick={handleSave} disabled={saving} style={{
              padding: '10px 20px', borderRadius: 8, border: 'none',
              background: 'var(--accent)', color: 'white', cursor: 'pointer', fontWeight: 600,
            }}>
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
