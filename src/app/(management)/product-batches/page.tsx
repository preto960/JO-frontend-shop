'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, X, Layers, Search, ArrowLeft, Edit2, Percent, Check, Package } from 'lucide-react';
import api, { extractData } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { formatPrice, getProductImage, showToast, debounce } from '@/lib/utils';

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
    maxWidth: 750, width: '100%', maxHeight: '90vh', overflowY: 'auto' as const,
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
  iconBtn: (bg: string, color: string) => ({
    width: 34, height: 34, borderRadius: '50%', border: 'none',
    background: bg, color: color, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.2s ease',
  }),
};

export default function ProductBatchesPage() {
  const { hasPermission } = useAuth();
  const router = useRouter();
  const [batches, setBatches] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchBatch, setSearchBatch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteModal, setDeleteModal] = useState<any>(null);
  const [viewBatch, setViewBatch] = useState<any>(null);
  const [editingBatch, setEditingBatch] = useState<any>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    discountPercent: '',
  });
  const [productSearch, setProductSearch] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);

  // Fetch batches
  const fetchBatches = async () => {
    try {
      setLoading(true);
      const res = await api.get('/product-batches?page=1&limit=100');
      const data = extractData(res);
      setBatches(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Error fetching batches:', err);
      setBatches([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all products for selection
  const fetchProducts = async () => {
    try {
      const res = await api.get('/products?page=1&limit=500');
      const data = extractData(res);
      setAllProducts(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Error fetching products:', err);
      setAllProducts([]);
    }
  };

  useEffect(() => { fetchBatches(); fetchProducts(); }, []);

  const filteredBatches = batches.filter(b =>
    !searchBatch || b.name?.toLowerCase().includes(searchBatch.toLowerCase())
  );

  // Products filtered by search, excluding already selected
  const availableProducts = useMemo(() => {
    const filtered = productSearch
      ? allProducts.filter(p =>
          (p.name || '').toLowerCase().includes(productSearch.toLowerCase())
        )
      : allProducts;
    return filtered;
  }, [allProducts, productSearch]);

  const selectedProducts = useMemo(() => {
    return allProducts.filter(p => selectedProductIds.includes(p.id));
  }, [allProducts, selectedProductIds]);

  const openCreate = () => {
    setEditingBatch(null);
    setForm({ name: '', description: '', discountPercent: '' });
    setProductSearch('');
    setSelectedProductIds([]);
    setModalOpen(true);
  };

  const openEdit = (batch: any) => {
    setEditingBatch(batch);
    setForm({
      name: batch.name || '',
      description: batch.description || '',
      discountPercent: String(batch.discountPercent || ''),
    });
    const currentIds = (batch.items || []).map((i: any) => i.productId || i.product?.id);
    setSelectedProductIds(currentIds.filter(Boolean));
    setProductSearch('');
    setViewBatch(null);
    setModalOpen(true);
  };

  const toggleProduct = (productId: number) => {
    setSelectedProductIds(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSave = async () => {
    if (!form.name || form.name.trim().length < 2) {
      showToast('Nombre del lote es obligatorio', 'error');
      return;
    }
    if (selectedProductIds.length === 0) {
      showToast('Selecciona al menos un producto', 'error');
      return;
    }
    const discount = form.discountPercent ? parseFloat(form.discountPercent) : 0;
    if (discount < 0 || discount > 100) {
      showToast('Descuento debe estar entre 0 y 100', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        name: form.name,
        description: form.description,
        discountPercent: discount,
        productIds: selectedProductIds,
      };

      if (editingBatch) {
        await api.put(`/product-batches/${editingBatch.id}`, payload);
        showToast(`Lote actualizado con ${selectedProductIds.length} productos`, 'success');
      } else {
        await api.post('/product-batches', payload);
        showToast(`Lote creado con ${selectedProductIds.length} productos, ${discount}% descuento aplicado`, 'success');
      }
      setModalOpen(false);
      fetchBatches();
      fetchProducts(); // Refresh to get updated discountPercent
    } catch (err: any) {
      showToast(err?.response?.data?.error || err?.message || 'Error al guardar lote', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    try {
      await api.delete(`/product-batches/${deleteModal.id}`);
      showToast('Lote eliminado. Descuentos reseteados a 0%.', 'success');
      fetchBatches();
      fetchProducts();
      setViewBatch((prev: any) => prev?.id === deleteModal.id ? null : prev);
    } catch (err: any) {
      showToast(err?.message || 'Error al eliminar', 'error');
    } finally {
      setDeleteModal(null);
    }
  };

  const debouncedBatchSearch = React.useCallback(
    debounce((val: string) => setSearchBatch(val), 400), []
  );
  const debouncedProductSearch = React.useCallback(
    debounce((val: string) => setProductSearch(val), 300), []
  );

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => router.push('/manage-products')}
            style={styles.iconBtn('var(--input-bg)', 'var(--text-secondary)')}
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Lotes de productos</h1>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '2px 0 0' }}>
              Aplica descuentos por lotes a productos existentes
            </p>
          </div>
        </div>
        {hasPermission('batches.create') && (
          <button onClick={openCreate} style={styles.newBtn}>
            <Plus size={18} /> Nuevo lote
          </button>
        )}
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 20 }}>
        <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
        <input
          type="text" placeholder="Buscar lotes..." defaultValue={searchBatch}
          onChange={(e) => debouncedBatchSearch(e.target.value)}
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
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Estado</th>
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Creador</th>
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Fecha</th>
                  <th style={{ textAlign: 'right', padding: '14px 16px', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredBatches.map((batch: any) => (
                  <tr key={batch.id} style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                    onClick={() => setViewBatch(viewBatch?.id === batch.id ? null : batch)}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--input-bg)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    <td style={{ padding: '14px 16px' }}>
                      <div>
                        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{batch.name}</span>
                        {batch.description && (
                          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{batch.description}</p>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        fontSize: 14, fontWeight: 700,
                        color: batch.discountPercent > 0 ? '#00B894' : 'var(--text-secondary)',
                        background: batch.discountPercent > 0 ? '#E8FBF5' : 'var(--input-bg)',
                        padding: '4px 12px', borderRadius: 20,
                      }}>
                        {batch.discountPercent > 0 ? `${batch.discountPercent}%` : '0%'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '4px 12px', borderRadius: 20, fontWeight: 600, fontSize: 13 }}>
                        {batch.items?.length || batch.productCount || 0}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 20,
                        background: batch.status === 'active' ? '#E8FBF5' : '#FFE8E8',
                        color: batch.status === 'active' ? '#00B894' : '#FF6B6B',
                      }}>
                        {batch.status === 'active' ? 'Activo' : batch.status === 'deleted' ? 'Eliminado' : batch.status}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text-secondary)' }}>
                      {batch.createdByUser?.name || '-'}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text-secondary)' }}>
                      {new Date(batch.createdAt).toLocaleDateString('es-ES')}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        {batch.active !== false && hasPermission('batches.edit') && (
                          <button
                            onClick={() => openEdit(batch)}
                            style={styles.iconBtn('#E8F1FF', '#54A0FF')}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.1)'; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
                          >
                            <Edit2 size={15} />
                          </button>
                        )}
                        {batch.active !== false && hasPermission('batches.delete') && (
                          <button
                            onClick={() => setDeleteModal(batch)}
                            style={styles.iconBtn('#FFE8E8', '#FF6B6B')}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.1)'; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Expanded row showing batch products */}
          {viewBatch && viewBatch.items && (
            <div style={{ background: 'var(--input-bg)', padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>
                <Package size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                Productos en lote ({viewBatch.items.length})
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {viewBatch.items.map((item: any, idx: number) => {
                  const prod = item.product;
                  if (!prod) return null;
                  return (
                    <div key={item.productId || idx} style={{
                      background: '#FFFFFF', borderRadius: 10, padding: '8px 14px',
                      display: 'flex', alignItems: 'center', gap: 10,
                      boxShadow: 'var(--shadow)', minWidth: 200,
                    }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 6, background: 'var(--input-bg)',
                        overflow: 'hidden', flexShrink: 0,
                      }}>
                        {getProductImage(prod) ? (
                          <img src={getProductImage(prod)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 14 }}>📦</div>
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {prod.name}
                        </p>
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                          {formatPrice(prod.price)}
                          {prod.discountPercent > 0 && (
                            <span style={{ color: '#00B894', marginLeft: 6 }}>-{prod.discountPercent}%</span>
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {filteredBatches.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px 24px' }}>
              <Layers size={48} color="var(--text-light)" style={{ marginBottom: 12 }} />
              <p style={{ fontSize: 15, color: 'var(--text-secondary)' }}>No hay lotes de productos</p>
              <p style={{ fontSize: 13, color: 'var(--text-light)', marginTop: 4 }}>Crea un lote para aplicar descuentos a productos existentes</p>
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Batch Modal */}
      <div
        style={{ ...styles.overlay, display: modalOpen ? 'flex' : 'none' }}
      >
        <div className="animate-fade-in" onClick={(e) => e.stopPropagation()} style={styles.modal}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>
              {editingBatch ? 'Editar lote' : 'Nuevo lote de descuento'}
            </h2>
            <button
              onClick={() => setModalOpen(false)}
              style={styles.iconBtn('var(--input-bg)', 'var(--text-secondary)')}
            >
              <X size={16} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Batch info */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text)' }}>Nombre del lote *</label>
              <input
                value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ej: Promo Navidad"
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
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text)' }}>
                <Percent size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                Descuento (%) — se aplicara a todos los productos seleccionados
              </label>
              <input
                type="number" min="0" max="100" step="0.1"
                value={form.discountPercent} onChange={(e) => setForm({ ...form, discountPercent: e.target.value })}
                placeholder="Ej: 15 para 15% de descuento"
                style={{ width: '100%', padding: '0 14px', height: 44, borderRadius: 10, border: '1px solid var(--border)', fontSize: 14, color: 'var(--text)', background: '#FFFFFF', outline: 'none' }}
              />
            </div>

            {/* Selected products preview */}
            {selectedProductIds.length > 0 && (
              <div style={{ background: '#E8FBF5', borderRadius: 12, padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#00B894' }}>
                    {selectedProductIds.length} producto{selectedProductIds.length > 1 ? 's' : ''} seleccionado{selectedProductIds.length > 1 ? 's' : ''}
                  </span>
                  <button
                    onClick={() => setSelectedProductIds([])}
                    style={{ fontSize: 12, fontWeight: 600, color: '#FF6B6B', background: '#FFE8E8', border: 'none', padding: '4px 10px', borderRadius: 20, cursor: 'pointer' }}
                  >
                    Limpiar
                  </button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxHeight: 100, overflowY: 'auto' }}>
                  {selectedProducts.map(p => (
                    <span key={p.id} style={{
                      fontSize: 12, fontWeight: 500, color: 'var(--text)',
                      background: '#FFFFFF', padding: '4px 10px', borderRadius: 6,
                      border: '1px solid #00B894', display: 'inline-flex', alignItems: 'center', gap: 4,
                    }}>
                      {p.name}
                      <X size={12} color="#FF6B6B" style={{ cursor: 'pointer' }} onClick={() => toggleProduct(p.id)} />
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Product search & selection */}
            <div style={{ borderTop: '2px solid var(--border)', paddingTop: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>
                Seleccionar productos
              </h3>
              <div style={{ position: 'relative', marginBottom: 12 }}>
                <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                <input
                  type="text" placeholder="Buscar producto por nombre..."
                  onChange={(e) => debouncedProductSearch(e.target.value)}
                  style={{ paddingLeft: 36, paddingRight: 16, background: '#FFFFFF', borderRadius: 8, height: 40, border: '1px solid var(--border)', fontSize: 13, color: 'var(--text)', width: '100%', outline: 'none' }}
                />
              </div>
              <div style={{ maxHeight: 280, overflowY: 'auto', borderRadius: 10, border: '1px solid var(--border)' }}>
                {availableProducts.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-secondary)', fontSize: 13 }}>
                    No se encontraron productos
                  </div>
                ) : (
                  availableProducts.map(product => {
                    const isSelected = selectedProductIds.includes(product.id);
                    return (
                      <div
                        key={product.id}
                        onClick={() => toggleProduct(product.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '10px 14px', cursor: 'pointer',
                          borderBottom: '1px solid var(--border)',
                          background: isSelected ? 'var(--primary-light)' : 'transparent',
                          transition: 'background 0.15s ease',
                        }}
                        onMouseEnter={(e) => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'var(--input-bg)'; }}
                        onMouseLeave={(e) => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                      >
                        {/* Checkbox */}
                        <div style={{
                          width: 22, height: 22, borderRadius: 6, border: isSelected ? '2px solid var(--primary)' : '2px solid var(--border)',
                          background: isSelected ? 'var(--primary)' : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                          transition: 'all 0.15s ease',
                        }}>
                          {isSelected && <Check size={14} color="white" strokeWidth={3} />}
                        </div>
                        {/* Image */}
                        <div style={{
                          width: 36, height: 36, borderRadius: 8, background: 'var(--input-bg)',
                          overflow: 'hidden', flexShrink: 0,
                        }}>
                          {getProductImage(product) ? (
                            <img src={getProductImage(product)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 16 }}>📦</div>
                          )}
                        </div>
                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {product.name}
                          </p>
                          <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                            {formatPrice(product.price)}
                            {product.discountPercent > 0 && (
                              <span style={{ color: '#00B894', marginLeft: 6 }}>ya tiene {product.discountPercent}%</span>
                            )}
                          </p>
                        </div>
                        {/* Selection indicator */}
                        {isSelected && (
                          <div style={{
                            width: 8, height: 8, borderRadius: '50%',
                            background: 'var(--primary)', flexShrink: 0,
                          }} />
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
            <button onClick={() => setModalOpen(false)} style={styles.cancelBtn}>Cancelar</button>
            <button
              onClick={handleSave} disabled={saving || selectedProductIds.length === 0}
              style={{
                ...styles.saveBtn,
                opacity: (saving || selectedProductIds.length === 0) ? 0.5 : 1,
              }}
            >
              {saving ? 'Guardando...' : `${editingBatch ? 'Actualizar' : 'Crear'} lote (${selectedProductIds.length} productos)`}
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <div
        style={{ ...styles.overlay, display: !!deleteModal ? 'flex' : 'none' }}
        onClick={() => setDeleteModal(null)}
      >
        <div className="animate-fade-in" onClick={(e) => e.stopPropagation()} style={{ ...styles.modal, maxWidth: 420 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>Eliminar lote</h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>
            El lote <strong>&quot;{deleteModal?.name}&quot;</strong> sera eliminado.
          </p>
          <p style={{ fontSize: 13, color: '#FF6B6B', marginBottom: 24, background: '#FFE8E8', padding: '10px 14px', borderRadius: 8 }}>
            El descuento se eliminara de los {deleteModal?.items?.length || deleteModal?.productCount || 0} productos asociados (se reseteara a 0%).
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button onClick={() => setDeleteModal(null)} style={styles.cancelBtn}>Cancelar</button>
            <button
              onClick={handleDelete}
              style={{ ...styles.saveBtn, background: '#FF6B6B', boxShadow: '0 4px 14px rgba(255,107,107,0.3)' }}
            >
              Eliminar lote
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
