'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Plus, Edit2, Trash2, X, Layers } from 'lucide-react';
import api, { extractData } from '@/lib/api';
import { useConfig } from '@/contexts/ConfigContext';
import ConfirmModal from '@/components/ConfirmModal';
import { formatPrice, getProductImage, showToast, debounce } from '@/lib/utils';

const styles = {
  primaryGradient: 'var(--primary-gradient)',
  overlay: {
    position: 'fixed' as const, inset: 0, background: 'rgba(26,29,41,0.6)',
    backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, padding: 16,
  },
  modal: {
    background: '#FFFFFF', borderRadius: 20, padding: 28,
    maxWidth: 480, width: '100%', maxHeight: '90vh', overflowY: 'auto' as const,
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
  searchInput: {
    paddingLeft: 40, paddingRight: 16, background: '#FFFFFF',
    borderRadius: 10, height: 44, border: '1px solid var(--border)',
    boxShadow: 'var(--shadow)', fontSize: 14, color: 'var(--text)',
  },
  tableCard: {
    background: '#FFFFFF', borderRadius: 14,
    boxShadow: 'var(--shadow)', overflow: 'hidden',
  },
  editBtn: {
    width: 34, height: 34, borderRadius: '50%', border: 'none',
    background: '#E8F1FF', color: '#54A0FF', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.2s ease',
  },
  deleteBtn: {
    width: 34, height: 34, borderRadius: '50%', border: 'none',
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

export default function AdminProductsPage() {
  const { isMultiStore } = useConfig();
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [deleteModal, setDeleteModal] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', description: '', price: '', categoryId: '', storeId: '', stock: '', image: '',
  });

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setFetchError('');
      let url = '/products';
      const params: string[] = [];
      if (search) params.push(`search=${encodeURIComponent(search)}`);
      // Add pagination to ensure products are returned
      params.push('page=1');
      params.push('limit=100');
      if (params.length) url += '?' + params.join('&');
      const res = await api.get(url);
      console.log('[manage-products] API response:', JSON.stringify(res).slice(0, 500));
      const extracted = extractData(res);
      console.log('[manage-products] Extracted products count:', Array.isArray(extracted) ? extracted.length : 'not array', extracted);
      if (Array.isArray(extracted) && extracted.length > 0) {
        setProducts(extracted);
      } else {
        // Fallback: try to find products in nested response structures
        const fallback = tryExtractProducts(res);
        if (Array.isArray(fallback) && fallback.length > 0) {
          setProducts(fallback);
        } else {
          setProducts([]);
        }
      }
    } catch (err: any) {
      console.error('[manage-products] Error fetching products:', err);
      setFetchError(err?.message || 'Error de conexion');
      showToast('Error al cargar productos', 'error');
      setProducts([]);
    }
    finally { setLoading(false); }
  };

  // Deep fallback to find products in any response structure
  const tryExtractProducts = (data: any): any[] => {
    if (!data) return [];
    if (Array.isArray(data) && data.length > 0 && data[0]?.name) return data;
    if (Array.isArray(data) && data.length > 0 && data[0]?.id) return data;
    if (typeof data === 'object') {
      for (const key of Object.keys(data)) {
        if (key === 'pagination' || key === 'meta' || key === 'message') continue;
        const val = data[key];
        if (Array.isArray(val) && val.length > 0 && (val[0]?.name || val[0]?.id || val[0]?.price !== undefined)) {
          return val;
        }
        if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
          const nested = tryExtractProducts(val);
          if (nested.length > 0) return nested;
        }
      }
    }
    return [];
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      const extracted = extractData(res);
      setCategories(Array.isArray(extracted) ? extracted : []);
    } catch { /* ignore */ }
  };

  const fetchStores = async () => {
    if (!isMultiStore) return;
    try {
      const res = await api.get('/stores');
      const extracted = extractData(res);
      setStores(Array.isArray(extracted) ? extracted : []);
    } catch { /* ignore */ }
  };

  useEffect(() => { fetchCategories(); fetchStores(); }, [isMultiStore]);
  useEffect(() => { fetchProducts(); }, [search]);

  const openCreate = () => {
    setEditingProduct(null);
    setForm({ name: '', description: '', price: '', categoryId: '', storeId: '', stock: '', image: '' });
    setModalOpen(true);
  };

  const openEdit = (product: any) => {
    setEditingProduct(product);
    const cat = product.categoryId || (product.category && product.category.id) || '';
    const store = product.storeId || (product.store && product.store.id) || '';
    setForm({
      name: product.name || '',
      description: product.description || '',
      price: String(product.price || ''),
      categoryId: cat,
      storeId: store,
      stock: String(product.stock ?? ''),
      image: product.image || product.thumbnail || product.image_url || '',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.price) {
      showToast('Nombre y precio son obligatorios', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload: any = {
        name: form.name,
        description: form.description,
        price: parseFloat(form.price),
        stock: form.stock ? parseInt(form.stock) : undefined,
        image: form.image,
      };
      if (form.categoryId) payload.categoryId = form.categoryId;
      if (isMultiStore && form.storeId) payload.storeId = form.storeId;

      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, payload);
        showToast('Producto actualizado', 'success');
      } else {
        await api.post('/products', payload);
        showToast('Producto creado', 'success');
      }
      setModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      showToast(err?.message || 'Error al guardar', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    try {
      await api.delete(`/products/${deleteModal.id}`);
      showToast('Producto eliminado', 'success');
      fetchProducts();
    } catch (err: any) {
      showToast(err?.message || 'Error al eliminar', 'error');
    } finally {
      setDeleteModal(null);
    }
  };

  const debouncedSearch = React.useCallback(
    debounce((val: string) => setSearch(val), 400), []
  );

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)' }}>Productos</h1>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={() => router.push('/manage-batches')}
            style={{
              ...styles.newBtn,
              background: '#FF6B6B',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
          >
            <Layers size={18} /> Lotes de descuento
          </button>
          <button
            onClick={openCreate}
            style={styles.newBtn}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-accent)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-accent)'; }}
          >
            <Plus size={18} /> Nuevo producto
          </button>
        </div>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 20 }}>
        <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
        <input
          type="text" placeholder="Buscar productos..." defaultValue={search}
          onChange={(e) => debouncedSearch(e.target.value)}
          style={styles.searchInput}
        />
      </div>

      {/* Products table */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div style={{
            width: 36, height: 36,
            border: '3px solid var(--border)', borderTopColor: 'var(--primary)',
            borderRadius: '50%', animation: 'spin 1s linear infinite',
          }} />
        </div>
      ) : fetchError && products.length === 0 ? (
        <div style={{ background: '#FFFFFF', borderRadius: 14, padding: 48, textAlign: 'center', boxShadow: 'var(--shadow)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>Error al cargar productos</p>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>{fetchError}</p>
          <button
            onClick={fetchProducts}
            style={{
              padding: '10px 24px', borderRadius: 10, border: 'none',
              background: 'var(--primary-gradient)',
              color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: 14,
              boxShadow: 'var(--shadow-accent)',
            }}
          >
            Reintentar
          </button>
        </div>
      ) : (
        <div style={styles.tableCard}>
          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)', background: 'var(--input-bg)' }}>
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Producto</th>
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Precio</th>
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Stock</th>
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Categoría</th>
                  {isMultiStore && <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tienda</th>}
                  <th style={{ textAlign: 'right', padding: '14px 16px', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product: any) => {
                  const catName = product.category && typeof product.category === 'object' ? (product.category.name || product.category.nombre || '') : '';
                  const storeName = product.store && typeof product.store === 'object' ? (product.store.name || product.store.nombre || '') : '';
                  return (
                    <tr key={product.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s ease' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--input-bg)'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                    >
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{
                            width: 42, height: 42, borderRadius: 10, background: 'var(--input-bg)',
                            overflow: 'hidden', flexShrink: 0,
                          }}>
                            {getProductImage(product) ? (
                              <img src={getProductImage(product)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-light)', fontSize: 18 }}>📦</div>
                            )}
                          </div>
                          <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>
                            {product.name || product.nombre}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 700, color: 'var(--primary)' }}>
                        {formatPrice(product.price)}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 14, color: (product.stock != null && product.stock <= 0) ? '#FF6B6B' : 'var(--text)' }}>
                        {product.stock != null ? product.stock : 'N/A'}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text-secondary)' }}>{catName || 'N/A'}</td>
                      {isMultiStore && <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text-secondary)' }}>{storeName || 'N/A'}</td>}
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => openEdit(product)}
                            style={styles.editBtn}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.1)'; (e.currentTarget as HTMLElement).style.background = '#54A0FF'; (e.currentTarget as HTMLElement).style.color = '#fff'; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; (e.currentTarget as HTMLElement).style.background = '#E8F1FF'; (e.currentTarget as HTMLElement).style.color = '#54A0FF'; }}
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => setDeleteModal(product)}
                            style={styles.deleteBtn}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.1)'; (e.currentTarget as HTMLElement).style.background = '#FF6B6B'; (e.currentTarget as HTMLElement).style.color = '#fff'; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; (e.currentTarget as HTMLElement).style.background = '#FFE8E8'; (e.currentTarget as HTMLElement).style.color = '#FF6B6B'; }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {products.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px 24px' }}>
              <p style={{ fontSize: 48, marginBottom: 12 }}>📦</p>
              <p style={{ fontSize: 15, color: 'var(--text-secondary)' }}>No hay productos</p>
              <p style={{ fontSize: 13, color: 'var(--text-light)', marginTop: 4 }}>Crea tu primer producto para empezar</p>
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      <div
        style={{ ...styles.overlay, display: modalOpen ? 'flex' : 'none' }}
        onClick={() => setModalOpen(false)}
      >
        <div className="animate-fade-in" onClick={(e) => e.stopPropagation()} style={styles.modal}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>{editingProduct ? 'Editar producto' : 'Nuevo producto'}</h2>
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
                placeholder="Nombre del producto"
                style={{ width: '100%', padding: '0 14px', height: 44, borderRadius: 10, border: '1px solid var(--border)', fontSize: 14, color: 'var(--text)', background: '#FFFFFF', outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text)' }}>Descripción</label>
              <textarea
                value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Descripción" rows={3}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 14, color: 'var(--text)', background: '#FFFFFF', outline: 'none', resize: 'vertical' }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text)' }}>Precio *</label>
                <input
                  type="number" step="0.01" value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0.00"
                  style={{ width: '100%', padding: '0 14px', height: 44, borderRadius: 10, border: '1px solid var(--border)', fontSize: 14, color: 'var(--text)', background: '#FFFFFF', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text)' }}>Stock</label>
                <input
                  type="number" value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })} placeholder="0"
                  style={{ width: '100%', padding: '0 14px', height: 44, borderRadius: 10, border: '1px solid var(--border)', fontSize: 14, color: 'var(--text)', background: '#FFFFFF', outline: 'none' }}
                />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text)' }}>URL de imagen</label>
              <input
                value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })}
                placeholder="https://..."
                style={{ width: '100%', padding: '0 14px', height: 44, borderRadius: 10, border: '1px solid var(--border)', fontSize: 14, color: 'var(--text)', background: '#FFFFFF', outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text)' }}>Categoría</label>
              <select
                value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                style={{ width: '100%', padding: '0 14px', height: 44, borderRadius: 10, border: '1px solid var(--border)', fontSize: 14, color: 'var(--text)', background: '#FFFFFF', outline: 'none' }}
              >
                <option value="">Seleccionar categoría</option>
                {categories.map((cat: any) => (
                  <option key={cat.id} value={cat.id}>{cat.name || cat.nombre}</option>
                ))}
              </select>
            </div>
            {isMultiStore && (
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text)' }}>Tienda</label>
                <select
                  value={form.storeId} onChange={(e) => setForm({ ...form, storeId: e.target.value })}
                  style={{ width: '100%', padding: '0 14px', height: 44, borderRadius: 10, border: '1px solid var(--border)', fontSize: 14, color: 'var(--text)', background: '#FFFFFF', outline: 'none' }}
                >
                  <option value="">Seleccionar tienda</option>
                  {stores.map((store: any) => (
                    <option key={store.id} value={store.id}>{store.name || store.nombre}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
            <button onClick={() => setModalOpen(false)} style={styles.cancelBtn}>Cancelar</button>
            <button
              onClick={handleSave} disabled={saving}
              style={{
                ...styles.saveBtn,
                opacity: saving ? 0.7 : 1,
                background: saving ? '#FDCB6E' : styles.saveBtn.background,
              }}
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      <ConfirmModal
        isOpen={!!deleteModal}
        title="Eliminar producto"
        message={`¿Estás seguro de eliminar "${deleteModal?.name || 'este producto'}"?`}
        confirmText="Eliminar"
        confirmColor="#FF6B6B"
        onConfirm={handleDelete}
        onCancel={() => setDeleteModal(null)}
      />
    </div>
  );
}
