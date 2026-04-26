'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import api, { extractData } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useConfig } from '@/contexts/ConfigContext';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import ProductCard from '@/components/ProductCard';
import { showToast, debounce } from '@/lib/utils';

export default function HomePage() {
  const { user } = useAuth();
  const { isMultiStore } = useConfig();
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStore, setSelectedStore] = useState('');

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      let url = '/products';
      const params: string[] = [];
      if (search) params.push(`search=${encodeURIComponent(search)}`);
      if (selectedCategory) params.push(`category=${encodeURIComponent(selectedCategory)}`);
      if (selectedStore) params.push(`store=${encodeURIComponent(selectedStore)}`);
      if (params.length) url += '?' + params.join('&');
      const res = await api.get(url);
      setProducts(extractData(res));
    } catch (err: any) {
      showToast('Error al cargar productos', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory, selectedStore]);

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

  useEffect(() => {
    fetchCategories();
    fetchStores();
  }, [isMultiStore]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const debouncedSearch = useCallback(
    debounce((val: string) => setSearch(val), 400),
    []
  );

  const addToCart = (product: any) => {
    try {
      const cart: any[] = JSON.parse(localStorage.getItem('joshop_cart') || '[]');
      const idx = cart.findIndex((item: any) => item.id === product.id);
      if (idx >= 0) {
        cart[idx].quantity = (cart[idx].quantity || 1) + 1;
      } else {
        cart.push({ ...product, quantity: 1 });
      }
      localStorage.setItem('joshop_cart', JSON.stringify(cart));
      window.dispatchEvent(new Event('cartUpdated'));
      showToast('Producto agregado al carrito', 'success');
    } catch {
      showToast('Error al agregar al carrito', 'error');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <Header title="JO-Shop" showLogout />

      <div style={{ padding: '16px 16px 80px' }}>
        {/* Search bar */}
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input
            type="text"
            placeholder="Buscar productos..."
            defaultValue={search}
            onChange={(e) => debouncedSearch(e.target.value)}
            style={{ paddingLeft: 40, paddingRight: 16, background: 'var(--white)', borderRadius: 12, height: 44 }}
          />
        </div>

        {/* Categories */}
        {categories.length > 0 && (
          <div className="scrollbar-hide" style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
            <button
              onClick={() => setSelectedCategory('')}
              style={{
                padding: '8px 16px', borderRadius: 20, border: 'none', fontSize: 13, fontWeight: 500,
                whiteSpace: 'nowrap', cursor: 'pointer', transition: 'all 0.2s',
                background: !selectedCategory ? 'var(--accent)' : 'var(--white)',
                color: !selectedCategory ? 'white' : 'var(--text)',
                boxShadow: 'var(--shadow)',
              }}
            >
              Todos
            </button>
            {categories.map((cat: any) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id === selectedCategory ? '' : cat.id)}
                style={{
                  padding: '8px 16px', borderRadius: 20, border: 'none', fontSize: 13, fontWeight: 500,
                  whiteSpace: 'nowrap', cursor: 'pointer', transition: 'all 0.2s',
                  background: selectedCategory === cat.id ? 'var(--accent)' : 'var(--white)',
                  color: selectedCategory === cat.id ? 'white' : 'var(--text)',
                  boxShadow: 'var(--shadow)',
                }}
              >
                {cat.name || cat.nombre || cat.id}
              </button>
            ))}
          </div>
        )}

        {/* Store filter */}
        {isMultiStore && stores.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <select
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              style={{ background: 'var(--white)', borderRadius: 8, height: 40, fontSize: 13 }}
            >
              <option value="">Todas las tiendas</option>
              {stores.map((store: any) => (
                <option key={store.id} value={store.id}>
                  {store.name || store.nombre || store.id}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Products grid */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <div style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          </div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-secondary)' }}>
            <p style={{ fontSize: 48, marginBottom: 12 }}>🛒</p>
            <p style={{ fontSize: 16, fontWeight: 500 }}>No se encontraron productos</p>
            <p style={{ fontSize: 13, marginTop: 4 }}>Intenta con otra búsqueda</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 12,
          }}>
            {products.map((product: any) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={addToCart}
                onClick={(p) => router.push(`/product/${p.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
