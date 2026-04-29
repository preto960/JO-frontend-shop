'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, X, Layers, Search, Package } from 'lucide-react';
import api, { extractData } from '@/lib/api';
import { useConfig } from '@/contexts/ConfigContext';
import { useAuth } from '@/contexts/AuthContext';
import { formatPrice, showToast, debounce } from '@/lib/utils';

const styles: any = {
  primaryGradient: 'var(--primary-gradient)',
  overlay: {
    position: 'fixed' as const, inset: 0, background: 'rgba(26,29,41,0.6)',
    backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, padding: 16,
  },
  modal: {
    background: '#FFFFFF', borderRadius: 20, padding: 28,
    maxWidth: 700, width: '100%', maxHeight: '90vh', overflowY: 'auto' as const,
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
  tableCard: {
    background: '#FFFFFF', borderRadius: 14,
    boxShadow: 'var(--shadow)', overflow: 'hidden',
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
  deleteBtn: {
    width: 34, height: 34, borderRadius: '50%', border: 'none',
    background: '#FFE8E8', color: '#FF6B6B', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.2s ease',
  },
};

interface BatchProduct {
  name: string;
  description: string;
  price: string;
  stock: string;
  image: string;
}

export default function ProductBatchesPage() {
  const { isMultiStore } = useConfig();
  const { hasPermission } = useAuth();
  const router = useRouter();
  const [batches, setBatches] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteModal, setDeleteModal] = useState<any>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    discountPercent: '',
    categoryId: '',
    storeIds: [] as string[],
  });
  const [batchProducts, setBatchProducts] = useState<BatchProduct[]>([
    { name: '', description: '', price: '', stock: '', image: '' },
  ]);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      let url = '/product-batches?page=1&limit=100';
      const res = await api.get(url);
      const data = extractData(res);
      setBatches(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Error fetching batches:', err);
      setBatches([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(Array.isArray(extractData(res)) ? extractData(res) : []);
    } catch { /* ignore */ }
  };

  const fetchStores = async () => {
    if (!isMultiStore) return;
    try {
      const res = await api.get('/stores');
      setStores(Array.isArray(extractData(res)) ? extractData(res) : []);
    } catch { /* ignore */ }
  };

  useEffect(() => { fetchCategories(); fetchStores(); }, [isMultiStore]);
  useEffect(() => { fetchBatches(); }, [search]);

  const openCreate = () => {
    setForm({ name: '', description: '', discountPercent: '', categoryId: '', storeIds: [] });
    setBatchProducts([{ name: '', description: '', price: '', stock: '', image: '' }]);
    setModalOpen(true);
  };

  const addProductRow = () => {
    setBatchProducts([...batchProducts, { name: '', description: '', price: '', stock: '', image: '' }]);
  };

  const removeProductRow = (index: number) => {
    if (batchProducts.length <= 1) return;
    setBatchProducts(batchProducts.filter((_, i) => i !== index));
  };

  const updateProductRow = (index: number, field: keyof BatchProduct, value: string) => {
    const updated = [...batchProducts];
    updated[index] = { ...updated[index], [field]: value };
    setBatchProducts(updated);
  };

  const handleSave = async () => {
    if (!form.name) {
      showToast('Nombre del lote es obligatorio', 'error');
      return;
    }
    const validProducts = batchProducts.filter(p => p.name.trim() && p.price);
    if (validProducts.length === 0) {
      showToast('Agrega al menos un producto con nombre y precio', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload: any = {
        name: form.name,
        description: form.description,
        discountPercent: form.discountPercent ? parseFloat(form.discountPercent) : 0,
        products: validProducts.map(p => ({
          name: p.name,
          description: p.description,
          price: parseFloat(p.price),
          stock: p.stock ? parseInt(p.stock) : 0,
          image: p.image || null,
        })),
      };
      if (form.categoryId) payload.categoryId = form.categoryId;
      if (isMultiStore && form.storeIds.length > 0) payload.storeIds = form.storeIds;

      await api.post('/product-batches', payload);
      showToast(`Lote creado con ${validProducts.length} productos`, 'success');
      setModalOpen(false);
      fetchBatches();
    } catch (err: any) {
      showToast(err?.response?.data?.error || err?.message || 'Error al crear lote', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    try {
      await api.delete(`/product-batches/${deleteModal.id}`);
      showToast('Lote eliminado', 'success');
      fetchBatches();
    } catch (err: any) {
      showToast(err?.message || 'Error al eliminar', 'error');
    } finally {
      setDeleteModal(null);
    }
  };

  const debouncedSearch = React.useCallback(
    debounce((val: string) => setSearch(val), 400), []
  );

  const filteredBatches = batches.filter(b =>
    !search || b.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => router.push('/manage-products')}
            style={{ background: 'var(--input-bg)', border: 'none', borderRadius: 8, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)' }}
          >
            <Search size={16} />
          </button>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)' }}>Lotes de productos</h1>
        </div>
        <button onClick={openCreate} style={styles.newBtn}>
          <Plus size={18} /> Nuevo lote
        </button>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 20 }}>
        <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
        <input
          type="text" placeholder="Buscar lotes..." defaultValue={search}
          onChange={(e) => debouncedSearch(e.target.value)}
          style={{ paddingLeft: 40, paddingRight: 16, background: '#FFFFFF', borderRadius: 10, height: 44, border: '1px solid var(--border)', boxShadow: 'var(--shadow)', fontSize: 14, color: 'var(--text)', width: '100%', outline: 'none' }}
        />
      </div>

      {/* Batches table */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div style={{ width: 36, height: 36, border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        </div>
      ) : (
        <div style={styles.tableCard}>
          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)', background: 'var(--input-bg)' }}>
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Lote</th>
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Descuento</th>
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Productos</th>
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Categoria</th>
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Estado</th>
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Fecha</th>
                  <th style={{ textAlign: 'right', padding: '14px 16px', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredBatches.map((batch: any) => (
                  <tr key={batch.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div>
                        <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{batch.name}</span>
                        {batch.description && (
                          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{batch.description}</p>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: batch.discountPercent > 0 ? '#00B894' : 'var(--text-secondary)', background: batch.discountPercent > 0 ? '#E8FBF5' : 'var(--input-bg)', padding: '4px 10px', borderRadius: 20 }}>
                        {batch.discountPercent > 0 ? `${batch.discountPercent}%` : '0%'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 14, color: 'var(--text)' }}>
                      <span style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '4px 10px', borderRadius: 20, fontWeight: 600, fontSize: 13 }}>
                        {batch.productCount}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text-secondary)' }}>
                      {batch.category?.name || 'N/A'}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 20,
                        background: batch.status === 'completed' ? '#E8FBF5' : batch.status === 'pending' ? '#FFF9E6' : '#FFE8E8',
                        color: batch.status === 'completed' ? '#00B894' : batch.status === 'pending' ? '#FDCB6E' : '#FF6B6B',
                      }}>
                        {batch.status === 'completed' ? 'Completado' : batch.status === 'pending' ? 'Pendiente' : batch.status}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text-secondary)' }}>
                      {new Date(batch.createdAt).toLocaleDateString('es-ES')}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      {hasPermission('product_batches.delete') && (
                        <button
                          onClick={() => setDeleteModal(batch)}
                          style={styles.deleteBtn}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.1)'; (e.currentTarget as HTMLElement).style.background = '#FF6B6B'; (e.currentTarget as HTMLElement).style.color = '#fff'; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; (e.currentTarget as HTMLElement).style.background = '#FFE8E8'; (e.currentTarget as HTMLElement).style.color = '#FF6B6B'; }}
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredBatches.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px 24px' }}>
              <Layers size={48} color="var(--text-light)" style={{ marginBottom: 12 }} />
              <p style={{ fontSize: 15, color: 'var(--text-secondary)' }}>No hay lotes de productos</p>
              <p style={{ fontSize: 13, color: 'var(--text-light)', marginTop: 4 }}>Crea un lote para agregar varios productos con descuento</p>
            </div>
          )}
        </div>
      )}

      {/* Create Batch Modal */}
      <div
        style={{ ...styles.overlay, display: modalOpen ? 'flex' : 'none' }}
        onClick={() => setModalOpen(false)}
      >
        <div className="animate-fade-in" onClick={(e) => e.stopPropagation()} style={styles.modal}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>Nuevo lote de productos</h2>
            <button onClick={() => setModalOpen(false)} style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: 'var(--input-bg)', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={16} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Batch info */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text)' }}>Nombre del lote *</label>
              <input
                value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ej: Promocion navidad"
                style={{ width: '100%', padding: '0 14px', height: 44, borderRadius: 10, border: '1px solid var(--border)', fontSize: 14, color: 'var(--text)', background: '#FFFFFF', outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text)' }}>Descripcion</label>
              <textarea
                value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Descripcion del lote (opcional)" rows={2}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 14, color: 'var(--text)', background: '#FFFFFF', outline: 'none', resize: 'vertical' }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text)' }}>Descuento (%)</label>
                <input
                  type="number" min="0" max="100" step="0.1"
                  value={form.discountPercent} onChange={(e) => setForm({ ...form, discountPercent: e.target.value })}
                  placeholder="0"
                  style={{ width: '100%', padding: '0 14px', height: 44, borderRadius: 10, border: '1px solid var(--border)', fontSize: 14, color: 'var(--text)', background: '#FFFFFF', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text)' }}>Categoria</label>
                <select
                  value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  style={{ width: '100%', padding: '0 14px', height: 44, borderRadius: 10, border: '1px solid var(--border)', fontSize: 14, color: 'var(--text)', background: '#FFFFFF', outline: 'none' }}
                >
                  <option value="">Sin categoria</option>
                  {categories.map((cat: any) => (
                    <option key={cat.id} value={cat.id}>{cat.name || cat.nombre}</option>
                  ))}
                </select>
              </div>
            </div>

            {isMultiStore && stores.length > 0 && (
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text)' }}>Tiendas (opcional)</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {stores.map((store: any) => {
                    const isSelected = form.storeIds.includes(String(store.id));
                    return (
                      <button
                        key={store.id}
                        onClick={() => {
                          const id = String(store.id);
                          setForm({
                            ...form,
                            storeIds: isSelected ? form.storeIds.filter(s => s !== id) : [...form.storeIds, id],
                          });
                        }}
                        style={{
                          padding: '6px 14px', borderRadius: 20, border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)',
                          background: isSelected ? 'var(--primary-light)' : '#fff', color: isSelected ? 'var(--primary)' : 'var(--text)',
                          fontSize: 13, fontWeight: 500, cursor: 'pointer',
                        }}
                      >
                        {store.name || store.nombre}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Products list */}
            <div style={{ borderTop: '2px solid var(--border)', paddingTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
                  Productos ({batchProducts.filter(p => p.name.trim()).length})
                </h3>
                <button
                  onClick={addProductRow}
                  style={{ padding: '6px 14px', borderRadius: 8, border: '1px dashed var(--primary)', background: 'transparent', color: 'var(--primary)', cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <Plus size={14} /> Agregar
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 400, overflowY: 'auto', paddingRight: 4 }}>
                {batchProducts.map((product, index) => (
                  <div key={index} style={{ background: 'var(--input-bg)', borderRadius: 12, padding: 14, position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Producto {index + 1}</span>
                      {batchProducts.length > 1 && (
                        <button
                          onClick={() => removeProductRow(index)}
                          style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: '#FFE8E8', color: '#FF6B6B', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <input
                        value={product.name} onChange={(e) => updateProductRow(index, 'name', e.target.value)}
                        placeholder="Nombre del producto *"
                        style={{ width: '100%', padding: '0 12px', height: 38, borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, color: 'var(--text)', background: '#FFFFFF', outline: 'none' }}
                      />
                      <input
                        value={product.description} onChange={(e) => updateProductRow(index, 'description', e.target.value)}
                        placeholder="Descripcion (opcional)"
                        style={{ width: '100%', padding: '0 12px', height: 38, borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, color: 'var(--text)', background: '#FFFFFF', outline: 'none' }}
                      />
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                        <input
                          type="number" step="0.01" value={product.price}
                          onChange={(e) => updateProductRow(index, 'price', e.target.value)}
                          placeholder="Precio *"
                          style={{ width: '100%', padding: '0 12px', height: 38, borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, color: 'var(--text)', background: '#FFFFFF', outline: 'none' }}
                        />
                        <input
                          type="number" value={product.stock}
                          onChange={(e) => updateProductRow(index, 'stock', e.target.value)}
                          placeholder="Stock"
                          style={{ width: '100%', padding: '0 12px', height: 38, borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, color: 'var(--text)', background: '#FFFFFF', outline: 'none' }}
                        />
                        <input
                          value={product.image} onChange={(e) => updateProductRow(index, 'image', e.target.value)}
                          placeholder="URL imagen"
                          style={{ width: '100%', padding: '0 12px', height: 38, borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, color: 'var(--text)', background: '#FFFFFF', outline: 'none' }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
            <button onClick={() => setModalOpen(false)} style={styles.cancelBtn}>Cancelar</button>
            <button
              onClick={handleSave} disabled={saving}
              style={{ ...styles.saveBtn, opacity: saving ? 0.7 : 1, background: saving ? '#FDCB6E' : styles.saveBtn.background }}
            >
              {saving ? 'Creando...' : `Crear lote (${batchProducts.filter(p => p.name.trim() && p.price).length} productos)`}
            </button>
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      <div
        style={{ ...styles.overlay, display: !!deleteModal ? 'flex' : 'none' }}
        onClick={() => setDeleteModal(null)}
      >
        <div className="animate-fade-in" onClick={(e) => e.stopPropagation()} style={{ ...styles.modal, maxWidth: 400 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>Eliminar lote</h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24 }}>
            El lote &quot;{deleteModal?.name}&quot; sera eliminado. Los productos creados no se eliminaran.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button onClick={() => setDeleteModal(null)} style={styles.cancelBtn}>Cancelar</button>
            <button
              onClick={handleDelete}
              style={{ ...styles.saveBtn, background: '#FF6B6B', boxShadow: '0 4px 14px rgba(255,107,107,0.3)' }}
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
