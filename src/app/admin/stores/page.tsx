'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Package } from 'lucide-react';
import api, { extractData } from '@/lib/api';
import ConfirmModal from '@/components/ConfirmModal';
import { showToast } from '@/lib/utils';

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
    <div style={{ padding: '24px', maxWidth: 800, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)' }}>Tiendas</h1>
        <button onClick={openCreate} style={{
          padding: '10px 20px', borderRadius: 8, background: 'var(--accent)',
          color: 'white', fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <Plus size={18} /> Nueva tienda
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        </div>
      ) : stores.length === 0 ? (
        <div style={{ background: 'var(--white)', borderRadius: 12, padding: 40, textAlign: 'center', boxShadow: 'var(--shadow)' }}>
          <p style={{ fontSize: 48, marginBottom: 12 }}>🏪</p>
          <p style={{ color: 'var(--text-secondary)' }}>No hay tiendas</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {stores.map((store: any) => (
            <div key={store.id} className="animate-fade-in" style={{
              background: 'var(--white)', borderRadius: 12, padding: 16,
              boxShadow: 'var(--shadow)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 12, background: 'var(--primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 20,
                  }}>
                    🏪
                  </div>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
                      {store.name || store.nombre}
                    </h3>
                    {store.address && <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>📍 {store.address}</p>}
                    {store.phone && <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>📞 {store.phone}</p>}
                    {store.description && <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{store.description}</p>}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8 }}>
                      <Package size={14} style={{ color: 'var(--text-light)' }} />
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        {productCounts[store.id] ?? 0} productos
                      </span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={() => openEdit(store)} style={{
                    width: 36, height: 36, borderRadius: 8, border: 'none',
                    background: '#3498DB15', color: '#3498DB', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => setDeleteModal(store)} style={{
                    width: 36, height: 36, borderRadius: 8, border: 'none',
                    background: '#E9456015', color: '#E94560', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Trash2 size={16} />
                  </button>
                </div>
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
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>{editingStore ? 'Editar tienda' : 'Nueva tienda'}</h2>
            <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Nombre *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nombre de la tienda" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Dirección</label>
              <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Dirección" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Teléfono</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Teléfono" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Descripción</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Descripción" rows={2} />
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
