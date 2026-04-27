'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, PackageSearch } from 'lucide-react';
import api, { extractData } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useConfig } from '@/contexts/ConfigContext';
import Header from '@/components/Header';

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

      <div style={{ padding: '16px 16px 24px', maxWidth: 1200, margin: '0 auto' }}>
        {/* Search bar */}
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <Search size={18} style={{
            position: 'absolute', left: 16, top: '50%',
            transform: 'translateY(-50%)', color: 'var(--text-light)',
            pointerEvents: 'none',
          }} />
          <input
            type="text"
            placeholder="Buscar productos..."
            defaultValue={search}
            onChange={(e) => debouncedSearch(e.target.value)}
            style={{
              paddingLeft: 44,
              paddingRight: 16,
              background: 'var(--white)',
              borderRadius: 'var(--radius-full)',
              height: 48,
              border: 'none',
              boxShadow: 'var(--shadow-md)',
              fontSize: 15,
            }}
          />
        </div>

        {/* Category pills */}
        {categories.length > 0 && (
          <div className="scrollbar-hide" style={{
            display: 'flex', gap: 8, marginBottom: 16,
            overflowX: 'auto', paddingBottom: 4,
          }}>
            <button
              onClick={() => setSelectedCategory('')}
              style={{
                height: 36,
                padding: '0 18px',
                borderRadius: 'var(--radius-full)',
                border: 'none',
                fontSize: 13,
                fontWeight: 600,
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                transition: 'all 0.25s ease',
                background: !selectedCategory ? 'var(--primary-gradient)' : 'var(--white)',
                color: !selectedCategory ? '#fff' : 'var(--text)',
                boxShadow: !selectedCategory ? 'var(--shadow-accent)' : 'var(--shadow)',
              }}
            >
              Todos
            </button>
            {categories.map((cat: any) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id === selectedCategory ? '' : cat.id)}
                style={{
                  height: 36,
                  padding: '0 18px',
                  borderRadius: 'var(--radius-full)',
                  border: 'none',
                  fontSize: 13,
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  background: selectedCategory === cat.id ? 'var(--primary-gradient)' : 'var(--white)',
                  color: selectedCategory === cat.id ? '#fff' : 'var(--text)',
                  boxShadow: selectedCategory === cat.id ? 'var(--shadow-accent)' : 'var(--shadow)',
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
              style={{
                background: 'var(--white)',
                borderRadius: 10,
                height: 42,
                fontSize: 14,
                fontWeight: 500,
                border: '2px solid var(--border)',
                padding: '0 36px 0 14px',
                boxShadow: 'var(--shadow)',
              }}
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
            <div style={{
              width: 32, height: 32,
              border: '3px solid var(--border)',
              borderTopColor: 'var(--primary)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }} />
          </div>
        ) : products.length === 0 ? (
          <div className="animate-fade-in" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'var(--primary-light)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 16,
            }}>
              <PackageSearch size={36} color="var(--primary)" />
            </div>
            <p style={{
              fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 6,
            }}>
              No se encontraron productos
            </p>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20 }}>
              Intenta con otra búsqueda o categoría
            </p>
            <button
              onClick={() => { setSelectedCategory(''); setSearch(''); }}
              style={{
                padding: '12px 28px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--primary-gradient)',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: 14,
                boxShadow: 'var(--shadow-accent)',
                transition: 'all 0.25s ease',
              }}
            >
              Explorar productos
            </button>
          </div>
        ) : (
          <div className="animate-fade-in products-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 16,
          }}>
            <style>{`
              @media (min-width: 768px) {
                .products-grid { grid-template-columns: repeat(3, 1fr) !important; }
              }
              @media (min-width: 1024px) {
                .products-grid { grid-template-columns: repeat(4, 1fr) !important; }
              }
            `}</style>
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

    </div>
  );
}
