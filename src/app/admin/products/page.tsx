'use client';

import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, X } from 'lucide-react';
import api, { extractData } from '@/lib/api';
import { useConfig } from '@/contexts/ConfigContext';
import ConfirmModal from '@/components/ConfirmModal';
import { formatPrice, getProductImage, showToast, debounce } from '@/lib/utils';

export default function AdminProductsPage() {
  const { isMultiStore } = useConfig();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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
      let url = '/products';
      if (search) url += `?search=${encodeURIComponent(search)}`;
      const res = await api.get(url);
      setProducts(extractData(res));
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(extractData(res));
    } catch { /* ignore */ }
  };

  const fetchStores = async () => {
    if (!isMultiStore) return;
    try {
      const res = await api.get('/stores');
      setStores(extractData(res));
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
    const cat = product.categoryId || (product.category?.id) || '';
    const store = product.storeId || (product.store?.id) || '';
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
    <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)' }}>Productos</h1>
        <button onClick={openCreate} style={{
          padding: '10px 20px', borderRadius: 8, background: 'var(--accent)',
          color: 'white', fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <Plus size={18} /> Nuevo producto
        </button>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 20 }}>
        <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
        <input
          type="text" placeholder="Buscar productos..." defaultValue={search}
          onChange={(e) => debouncedSearch(e.target.value)}
          style={{ paddingLeft: 40, paddingRight: 16, background: 'var(--white)', borderRadius: 10, height: 44 }}
        />
      </div>

      {/* Products table */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        </div>
      ) : (
        <div style={{ background: 'var(--white)', borderRadius: 12, boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)', background: 'var(--input-bg)' }}>
                  <th style={{ textAlign: 'left', padding: '12px', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Producto</th>
                  <th style={{ textAlign: 'left', padding: '12px', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Precio</th>
                  <th style={{ textAlign: 'left', padding: '12px', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Stock</th>
                  <th style={{ textAlign: 'left', padding: '12px', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Categoría</th>
                  {isMultiStore && <th style={{ textAlign: 'left', padding: '12px', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Tienda</th>}
                  <th style={{ textAlign: 'right', padding: '12px', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product: any) => {
                  const catName = typeof product.category === 'object' ? (product.category.name || product.category.nombre) : '';
                  const storeName = typeof product.store === 'object' ? (product.store.name || product.store.nombre) : '';
                  return (
                    <tr key={product.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 40, height: 40, borderRadius: 8, background: 'var(--input-bg)',
                            overflow: 'hidden', flexShrink: 0,
                          }}>
                            {getProductImage(product) ? (
                              <img src={getProductImage(product)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-light)', fontSize: 16 }}>📦</div>
                            )}
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>
                            {product.name || product.nombre}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '12px', fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>
                        {formatPrice(product.price)}
                      </td>
                      <td style={{ padding: '12px', fontSize: 13, color: product.stock <= 0 ? 'var(--accent)' : 'var(--text)' }}>
                        {product.stock !== undefined ? product.stock : 'N/A'}
                      </td>
                      <td style={{ padding: '12px', fontSize: 13, color: 'var(--text-secondary)' }}>{catName || 'N/A'}</td>
                      {isMultiStore && <td style={{ padding: '12px', fontSize: 13, color: 'var(--text-secondary)' }}>{storeName || 'N/A'}</td>}
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                          <button onClick={() => openEdit(product)} style={{
                            width: 32, height: 32, borderRadius: 6, border: 'none',
                            background: '#3498DB15', color: '#3498DB', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => setDeleteModal(product)} style={{
                            width: 32, height: 32, borderRadius: 6, border: 'none',
                            background: '#E9456015', color: '#E94560', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <Trash2 size={14} />
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
            <p style={{ textAlign: 'center', padding: 30, color: 'var(--text-secondary)' }}>No hay productos</p>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      <div style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
        display: modalOpen ? 'flex' : 'none', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: 16,
      }} onClick={() => setModalOpen(false)}>
        <div className="animate-fade-in" onClick={(e) => e.stopPropagation()} style={{
          background: 'var(--white)', borderRadius: 16, padding: 24,
          maxWidth: 480, width: '100%', maxHeight: '90vh', overflowY: 'auto',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>{editingProduct ? 'Editar producto' : 'Nuevo producto'}</h2>
            <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Nombre *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nombre del producto" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Descripción</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Descripción" rows={3} style={{ resize: 'vertical' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Precio *</label>
                <input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0.00" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Stock</label>
                <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} placeholder="0" />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>URL de imagen</label>
              <input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="https://..." />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Categoría</label>
              <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                <option value="">Seleccionar categoría</option>
                {categories.map((cat: any) => (
                  <option key={cat.id} value={cat.id}>{cat.name || cat.nombre}</option>
                ))}
              </select>
            </div>
            {isMultiStore && (
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Tienda</label>
                <select value={form.storeId} onChange={(e) => setForm({ ...form, storeId: e.target.value })}>
                  <option value="">Seleccionar tienda</option>
                  {stores.map((store: any) => (
                    <option key={store.id} value={store.id}>{store.name || store.nombre}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
            <button onClick={() => setModalOpen(false)} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--white)', color: 'var(--text)', cursor: 'pointer', fontWeight: 500 }}>Cancelar</button>
            <button onClick={handleSave} disabled={saving} style={{
              padding: '10px 20px', borderRadius: 8, border: 'none',
              background: saving ? 'var(--accent-light)' : 'var(--accent)', color: 'white', cursor: 'pointer', fontWeight: 600,
            }}>
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
        confirmColor="var(--accent)"
        onConfirm={handleDelete}
        onCancel={() => setDeleteModal(null)}
      />
    </div>
  );
}
