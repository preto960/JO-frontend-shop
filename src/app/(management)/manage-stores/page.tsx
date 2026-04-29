'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Package } from 'lucide-react';
import api, { extractData } from '@/lib/api';
import ConfirmModal from '@/components/ConfirmModal';
import { showToast } from '@/lib/utils';

const styles = {
  overlay: {
    position: 'fixed' as const, inset: 0, background: 'rgba(26,29,41,0.6)',
    backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, padding: 16,
  },
  modal: {
    background: '#FFFFFF', borderRadius: 20, padding: 28, maxWidth: 400, width: '100%',
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

export default function AdminStoresPage() {
  const [stores, setStores] = useState<any[]>([]);
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<any>(null);
  const [deleteModal, setDeleteModal] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', address: '', phone: '', description: '' });

  const fetchStores = async () => {
    try {
      setLoading(true);
      const res = await api.get('/stores');
      const storeList = extractData(res);
      setStores(storeList);

      // Count products per store
      const counts: Record<string, number> = {};
      for (const store of storeList) {
        try {
          const prodRes = await api.get(`/products?store=${store.id}`);
          const prods = extractData(prodRes);
          counts[store.id] = prods.length;
        } catch {
          counts[store.id] = 0;
        }
      }
      setProductCounts(counts);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchStores(); }, []);

  const openCreate = () => {
    setEditingStore(null);
    setForm({ name: '', address: '', phone: '', description: '' });
    setModalOpen(true);
  };

  const openEdit = (store: any) => {
    setEditingStore(store);
    setForm({
      name: store.name || '',
      address: store.address || '',
      phone: store.phone || '',
      description: store.description || '',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name) {
      showToast('El nombre es obligatorio', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload = { name: form.name, address: form.address, phone: form.phone, description: form.description };
      if (editingStore) {
        await api.put(`/stores/${editingStore.id}`, payload);
        showToast('Tienda actualizada', 'success');
      } else {
        await api.post('/stores', payload);
        showToast('Tienda creada', 'success');
      }
      setModalOpen(false);
      fetchStores();
    } catch (err: any) {
      showToast(err?.message || 'Error al guardar', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    try {
      await api.delete(`/stores/${deleteModal.id}`);
      showToast('Tienda eliminada', 'success');
      fetchStores();
    } catch (err: any) {
      showToast(err?.message || 'Error al eliminar', 'error');
    } finally {
      setDeleteModal(null);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)' }}>Tiendas</h1>
        <button
          onClick={openCreate}
          style={styles.newBtn}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-accent)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-accent)'; }}
        >
          <Plus size={18} /> Nueva tienda
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div style={{
            width: 36, height: 36,
            border: '3px solid var(--border)', borderTopColor: 'var(--primary)',
            borderRadius: '50%', animation: 'spin 1s linear infinite',
          }} />
        </div>
      ) : stores.length === 0 ? (
        <div style={{ background: '#FFFFFF', borderRadius: 14, padding: 48, textAlign: 'center', boxShadow: 'var(--shadow)' }}>
          <p style={{ fontSize: 48, marginBottom: 12 }}>🏪</p>
          <p style={{ fontSize: 15, color: 'var(--text-secondary)' }}>No hay tiendas</p>
          <p style={{ fontSize: 13, color: 'var(--text-light)', marginTop: 4 }}>Crea tu primera tienda para empezar a vender</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {stores.map((store: any) => (
            <div
              key={store.id} className="animate-fade-in"
              style={{
                background: '#FFFFFF', borderRadius: 14, padding: 18,
                boxShadow: 'var(--shadow)', transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-md)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: 14 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 12, background: 'var(--primary-light)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                    flexShrink: 0,
                  }}>
                    🏪
                  </div>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
                      {store.name || store.nombre}
                    </h3>
                    {store.address && <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 2 }}>📍 {store.address}</p>}
                    {store.phone && <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 2 }}>📞 {store.phone}</p>}
                    {store.description && <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{store.description}</p>}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                      <Package size={14} style={{ color: 'var(--primary)' }} />
                      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--primary)' }}>
                        {productCounts[store.id] ?? 0} productos
                      </span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => openEdit(store)} style={styles.editBtn}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.1)'; (e.currentTarget as HTMLElement).style.background = '#54A0FF'; (e.currentTarget as HTMLElement).style.color = '#fff'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; (e.currentTarget as HTMLElement).style.background = '#E8F1FF'; (e.currentTarget as HTMLElement).style.color = '#54A0FF'; }}
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    onClick={() => setDeleteModal(store)} style={styles.deleteBtn}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.1)'; (e.currentTarget as HTMLElement).style.background = '#FF6B6B'; (e.currentTarget as HTMLElement).style.color = '#fff'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; (e.currentTarget as HTMLElement).style.background = '#FFE8E8'; (e.currentTarget as HTMLElement).style.color = '#FF6B6B'; }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
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
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>{editingStore ? 'Editar tienda' : 'Nueva tienda'}</h2>
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
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text)' }}>Nombre *</label>
              <input
                value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Nombre de la tienda"
                style={{ width: '100%', padding: '0 14px', height: 44, borderRadius: 10, border: '1px solid var(--border)', fontSize: 14, color: 'var(--text)', background: '#FFFFFF', outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text)' }}>Dirección</label>
              <input
                value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Dirección"
                style={{ width: '100%', padding: '0 14px', height: 44, borderRadius: 10, border: '1px solid var(--border)', fontSize: 14, color: 'var(--text)', background: '#FFFFFF', outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text)' }}>Teléfono</label>
              <input
                value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="Teléfono"
                style={{ width: '100%', padding: '0 14px', height: 44, borderRadius: 10, border: '1px solid var(--border)', fontSize: 14, color: 'var(--text)', background: '#FFFFFF', outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text)' }}>Descripción</label>
              <textarea
                value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Descripción" rows={2}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 14, color: 'var(--text)', background: '#FFFFFF', outline: 'none' }}
              />
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

      <ConfirmModal
        isOpen={!!deleteModal}
        title="Eliminar tienda"
        message={`¿Estás seguro de eliminar "${deleteModal?.name || 'esta tienda'}"?`}
        confirmText="Eliminar"
        onConfirm={handleDelete}
        onCancel={() => setDeleteModal(null)}
      />
    </div>
  );
}
