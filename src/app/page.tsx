'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, PackageSearch, ShoppingCart, Star, TrendingUp,
  Percent, ChevronRight, ChevronLeft, Truck, Shield, Clock, Sparkles,
  Menu, LogIn, LogOut, User,
} from 'lucide-react';
import api, { extractData } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useConfig } from '@/contexts/ConfigContext';
import SidebarMenu from '@/components/SidebarMenu';
import ProductCard from '@/components/ProductCard';
import CartDropdown from '@/components/CartDropdown';
import { showToast, debounce, formatPrice } from '@/lib/utils';

/* ═══════════════════════════════════════════════════════════════
   Public Landing Page — E-commerce JO-Shop
   Accessible without authentication. Cart requires login.
   ═══════════════════════════════════════════════════════════════ */

export default function HomePage() {
  const { user, isLoading: authLoading } = useAuth();
  const { config, isMultiStore } = useConfig();
  const shopName = config.shop_name || 'JO-Shop';
  const shopLogoUrl = config.shop_logo_url || '';
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStore, setSelectedStore] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [cartOpen, setCartOpen] = useState(false);
  const cartBtnRef = React.useRef<HTMLButtonElement>(null);

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
      // Show products section as empty if API call fails without auth
      setProducts([]);
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

  // Cart count listener
  useEffect(() => {
    const updateCart = () => {
      try {
        const cart = JSON.parse(localStorage.getItem('joshop_cart') || '[]');
        setCartCount(cart.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0));
      } catch {
        setCartCount(0);
      }
    };
    updateCart();
    window.addEventListener('cartUpdated', updateCart);
    window.addEventListener('storage', updateCart);
    return () => {
      window.removeEventListener('cartUpdated', updateCart);
      window.removeEventListener('storage', updateCart);
    };
  }, []);

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

  // Products with discountPercent > 0 — real offers from batch system
  const offerProducts = [...products]
    .filter((p) => {
      const dp = p.discountPercent ?? p.discount_percent ?? 0;
      return dp > 0;
    })
    .slice(0, 6);

  // Simulate "best sellers" — first 6 products
  const bestSellers = [...products].slice(0, 6);

  const hasActiveFilters = search || selectedCategory || selectedStore;

  // ─── Banners de publicidad ────────────────────────────────────────────
  const bannersEnabled = config.banners_enabled === 'true';
  const [banners, setBanners] = React.useState<any[]>([]);
  const [currentBanner, setCurrentBanner] = React.useState(0);
  const [bannerProgress, setBannerProgress] = React.useState(0);
  const bannerIntervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const bannerRafRef = React.useRef<number | null>(null);
  const bannerStartTimeRef = React.useRef<number>(0);

  React.useEffect(() => {
    if (!bannersEnabled) { setBanners([]); return; }
    const loadBanners = async () => {
      try {
        const res = await api.get('/banners');
        const list = Array.isArray(res) ? res : res?.data || [];
        setBanners(list);
      } catch { setBanners([]); }
    };
    loadBanners();
  }, [bannersEnabled]);

  // Get current banner's individual duration (fallback 4s)
  const currentBannerDuration = banners.length > 0
    ? (banners[currentBanner]?.duration || 4) * 1000
    : 4000;

  // Auto-rotate with per-banner duration + smooth progress bar
  React.useEffect(() => {
    if (banners.length <= 1) {
      setBannerProgress(100);
      return;
    }
    // Cleanup previous
    if (bannerIntervalRef.current) clearInterval(bannerIntervalRef.current);
    if (bannerRafRef.current) cancelAnimationFrame(bannerRafRef.current);

    setBannerProgress(0);
    bannerStartTimeRef.current = Date.now();

    // Animate progress bar smoothly
    const animateProgress = () => {
      const elapsed = Date.now() - bannerStartTimeRef.current;
      const progress = Math.min((elapsed / currentBannerDuration) * 100, 100);
      setBannerProgress(progress);
      if (progress < 100) {
        bannerRafRef.current = requestAnimationFrame(animateProgress);
      }
    };
    bannerRafRef.current = requestAnimationFrame(animateProgress);

    // Advance to next banner when duration expires
    bannerIntervalRef.current = setInterval(() => {
      setCurrentBanner(prev => (prev + 1) % banners.length);
    }, currentBannerDuration);

    return () => {
      if (bannerIntervalRef.current) clearInterval(bannerIntervalRef.current);
      if (bannerRafRef.current) cancelAnimationFrame(bannerRafRef.current);
    };
  }, [currentBanner, banners.length, currentBannerDuration]);

  const { logout } = useAuth();
  const isLoggedIn = !!user;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
      {/* ═══════════════════════════════════════════
          PUBLIC HEADER
         ═══════════════════════════════════════════ */}
      <header style={{
        background: 'var(--primary-gradient)', color: 'var(--white)',
        padding: '0 16px', height: 100, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        position: 'sticky', top: 0, zIndex: 100,
        boxShadow: 'var(--shadow-accent)',
        borderRadius: '0 0 16px 16px',
      }}>
        {/* Left section */}
        <div style={{ position: 'absolute', left: 16, display: 'flex', gap: 4, zIndex: 1 }}>
          {isLoggedIn && (
            <button
              onClick={() => setMenuOpen(true)}
              style={{
                background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white',
                cursor: 'pointer', width: 44, height: 44, borderRadius: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
              aria-label="Abrir menú"
            >
              <Menu size={24} />
            </button>
          )}
        </div>

        {/* Center title */}
        {shopLogoUrl ? (
          <img src={shopLogoUrl} alt={shopName} style={{ height: 80, width: 'auto', objectFit: 'contain', zIndex: 1 }} />
        ) : (
          <h1 style={{ fontSize: 18, fontWeight: 700, zIndex: 1 }}>{shopName}</h1>
        )}

        {/* Right section */}
        <div style={{ position: 'absolute', right: 16, display: 'flex', gap: 8, zIndex: 1 }}>
          <button
            ref={cartBtnRef}
            onClick={() => setCartOpen(!cartOpen)}
            style={{
              background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white',
              cursor: 'pointer', width: 44, height: 44, borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative',
            }}
            aria-label="Carrito"
          >
            <ShoppingCart size={22} />
            {cartCount > 0 && (
              <span style={{
                position: 'absolute', top: 2, right: 2,
                background: '#FF6B6B', color: 'white',
                fontSize: 10, fontWeight: 700,
                minWidth: 16, height: 16, borderRadius: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '0 4px',
              }}>
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </button>
          {isLoggedIn ? (
            <button
              onClick={logout}
              style={{
                background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white',
                cursor: 'pointer', width: 44, height: 44, borderRadius: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
              aria-label="Cerrar sesión"
            >
              <LogOut size={22} />
            </button>
          ) : (
            <button
              onClick={() => router.push('/login')}
              style={{
                background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white',
                cursor: 'pointer', width: 44, height: 44, borderRadius: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
              aria-label="Iniciar sesión"
            >
              <LogIn size={22} />
            </button>
          )}
          <CartDropdown
            isOpen={cartOpen}
            onClose={() => setCartOpen(false)}
            anchorRef={cartBtnRef}
          />
        </div>
      </header>

      {/* Sidebar menu (only if logged in) */}
      {isLoggedIn && <SidebarMenu open={menuOpen} onClose={() => setMenuOpen(false)} />}

      {/* ═══════════════════════════════════════════
          HERO BANNER
         ═══════════════════════════════════════════ */}
      <div style={{
        background: 'var(--primary-gradient)',
        padding: '28px 16px 32px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative elements */}
        <div style={{
          position: 'absolute', top: '-40px', right: '-40px',
          width: 160, height: 160, borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)',
        }} />
        <div style={{
          position: 'absolute', bottom: '-30px', left: '-30px',
          width: 120, height: 120, borderRadius: '50%',
          background: 'rgba(255,255,255,0.06)',
        }} />
        <div style={{
          position: 'absolute', top: '30%', right: '20%',
          width: 50, height: 50, borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)',
        }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 1200, margin: '0 auto' }}>
          <div className="animate-fade-in">
            <h2 style={{
              fontSize: 26, fontWeight: 800, color: 'white', marginBottom: 6,
              textShadow: '0 1px 4px rgba(0,0,0,0.1)',
            }}>
              Bienvenido{user?.name ? `, ${user.name.split(' ')[0]}` : ''}!
            </h2>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.9)', marginBottom: 20 }}>
              Descubre los mejores productos y haz tu pedido
            </p>
          </div>

          {/* Search bar */}
          <div className="animate-fade-in" style={{ position: 'relative' }}>
            <Search size={18} style={{
              position: 'absolute', left: 16, top: '50%',
              transform: 'translateY(-50%)', color: 'var(--text-light)',
              pointerEvents: 'none', zIndex: 1,
            }} />
            <input
              type="text"
              placeholder="Buscar productos..."
              defaultValue={search}
              onChange={(e) => debouncedSearch(e.target.value)}
              style={{
                paddingLeft: 44,
                paddingRight: 16,
                background: 'rgba(255,255,255,0.95)',
                borderRadius: 'var(--radius-full)',
                height: 50,
                border: 'none',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                fontSize: 15,
                color: 'var(--text)',
              }}
            />
          </div>
        </div>
      </div>

      <div style={{ padding: '20px 16px 32px', maxWidth: 1200, margin: '0 auto' }}>

        {/* ═══════════════════════════════════════════
            BANNER CAROUSEL (publicidad)
           ═══════════════════════════════════════════ */}
        {banners.length > 0 && !hasActiveFilters && (
          <div className="animate-fade-in" style={{
            position: 'relative',
            borderRadius: 16,
            overflow: 'hidden',
            height: 180,
            marginBottom: 24,
            background: 'var(--input-bg)',
          }}>
            {banners.map((banner, idx) => (
              <div
                key={`banner-${idx}`}
                style={{
                  position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                  opacity: idx === currentBanner ? 1 : 0,
                  transition: 'opacity 0.5s ease-in-out',
                  zIndex: idx === currentBanner ? 1 : 0,
                }}
              >
                {banner.link ? (
                  <a href={banner.link} target="_blank" rel="noopener noreferrer" style={{ display: 'block', width: '100%', height: '100%' }}>
                    {banner.mediaType === 'video'
                      ? <video src={banner.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} autoPlay muted loop playsInline />
                      : <img src={banner.imageUrl} alt={`Banner ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    }
                  </a>
                ) : (
                  banner.mediaType === 'video'
                    ? <video src={banner.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} autoPlay muted loop playsInline />
                    : <img src={banner.imageUrl} alt={`Banner ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
              </div>
            ))}
            {/* Subtle progress bar — thin line at bottom left corner */}
            {banners.length > 1 && (
              <div style={{
                position: 'absolute', bottom: 0, left: 0,
                width: 48, height: 2.5,
                background: 'rgba(255,255,255,0.15)',
                borderRadius: '0 2px 0 0',
                zIndex: 10,
                overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  width: `${bannerProgress}%`,
                  background: 'rgba(255,255,255,0.6)',
                  borderRadius: '0 2px 0 0',
                  transition: bannerProgress >= 99 ? 'none' : 'width 0.1s linear',
                }} />
              </div>
            )}
            {banners.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentBanner(prev => (prev - 1 + banners.length) % banners.length)}
                  style={{
                    position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                    zIndex: 10, width: 34, height: 34, borderRadius: '50%',
                    border: 'none', background: 'rgba(0,0,0,0.35)', color: 'white',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                  aria-label="Anterior"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={() => setCurrentBanner(prev => (prev + 1) % banners.length)}
                  style={{
                    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                    zIndex: 10, width: 34, height: 34, borderRadius: '50%',
                    border: 'none', background: 'rgba(0,0,0,0.35)', color: 'white',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                  aria-label="Siguiente"
                >
                  <ChevronRight size={20} />
                </button>
                <div style={{
                  position: 'absolute', bottom: 10, left: 0, right: 0,
                  display: 'flex', justifyContent: 'center', gap: 6, zIndex: 10,
                }}>
                  {banners.map((_, idx) => (
                    <button
                      key={`dot-${idx}`}
                      onClick={() => setCurrentBanner(idx)}
                      style={{
                        width: idx === currentBanner ? 20 : 7,
                        height: 7,
                        borderRadius: 4,
                        border: 'none',
                        background: idx === currentBanner ? 'white' : 'rgba(255,255,255,0.5)',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        padding: 0,
                      }}
                      aria-label={`Ir al banner ${idx + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════
            CATEGORY PILLS
           ═══════════════════════════════════════════ */}
        {categories.length > 0 && !search && (
          <div className="animate-fade-in" style={{
            display: 'flex', gap: 8, marginBottom: 24,
            overflowX: 'auto', paddingBottom: 4,
            paddingRight: 4,
          }}>
            <button
              onClick={() => setSelectedCategory('')}
              style={{
                height: 38,
                padding: '0 20px',
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
                  height: 38,
                  padding: '0 20px',
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
          <div style={{ marginBottom: 20 }}>
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
                maxWidth: 300,
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

        {/* ═══════════════════════════════════════════
            FEATURES STRIP
           ═══════════════════════════════════════════ */}
        {!search && !selectedCategory && !selectedStore && (
          <div className="animate-fade-in" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 12,
            marginBottom: 28,
          }}>
            {[
              { icon: Truck, label: 'Envio rapido', color: 'var(--primary)', bg: 'var(--primary-light)' },
              { icon: Shield, label: 'Pago seguro', color: '#00B894', bg: '#E8FBF5' },
              { icon: Clock, label: 'Soporte 24/7', color: '#54A0FF', bg: '#E8F1FF' },
            ].map((f) => (
              <div key={f.label} style={{
                background: 'var(--white)',
                borderRadius: 'var(--radius)',
                padding: '14px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                boxShadow: 'var(--shadow)',
              }}>
                <div style={{
                  width: 38, height: 38, borderRadius: '50%',
                  background: f.bg, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <f.icon size={18} color={f.color} />
                </div>
                <span style={{
                  fontSize: 12, fontWeight: 600, color: 'var(--text)',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {f.label}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* ═══════════════════════════════════════════
            BEST SELLERS SECTION (only when no filters)
           ═══════════════════════════════════════════ */}
        {!search && !selectedCategory && !selectedStore && bestSellers.length > 0 && (
          <div className="animate-slide-up" style={{ marginBottom: 32 }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 16,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'var(--primary-light)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <TrendingUp size={16} color="var(--primary)" />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>
                  Mas vendidos
                </h3>
              </div>
            </div>
            <div style={{ position: 'relative' }}>
              <div
                ref={(el: HTMLDivElement | null) => {
                  if (el) (window as any).__bestsellersScroll = el;
                }}
                className="scroll-container" data-scroll="bestsellers" style={{
                  display: 'flex', gap: 14,
                  overflowX: 'auto', paddingBottom: 8,
                  paddingRight: 16,
                  scrollBehavior: 'smooth',
                  WebkitOverflowScrolling: 'touch',
                  scrollSnapType: 'x mandatory',
                }}>
                {bestSellers.map((product: any) => (
                  <div key={product.id} style={{ minWidth: 200, maxWidth: 200, flexShrink: 0, scrollSnapAlign: 'start' }}>
                    <ProductCard
                      product={product}
                      onAddToCart={addToCart}
                      onClick={(p) => router.push(`/product/${p.id}`)}
                    />
                  </div>
                ))}
              </div>
              <button
                onClick={() => { const el = (window as any).__bestsellersScroll; if (el) el.scrollBy({ left: -220, behavior: 'smooth' }); }}
                className="scroll-arrow-btn scroll-arrow-left"
                style={{
                  position: 'absolute', left: -6, top: '50%', transform: 'translateY(-50%)',
                  width: 32, height: 32, borderRadius: '50%', border: 'none',
                  background: 'white', color: 'var(--text)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.12)', zIndex: 5,
                }}
                aria-label="Anterior"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => { const el = (window as any).__bestsellersScroll; if (el) el.scrollBy({ left: 220, behavior: 'smooth' }); }}
                className="scroll-arrow-btn scroll-arrow-right"
                style={{
                  position: 'absolute', right: -6, top: '50%', transform: 'translateY(-50%)',
                  width: 32, height: 32, borderRadius: '50%', border: 'none',
                  background: 'white', color: 'var(--text)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.12)', zIndex: 5,
                }}
                aria-label="Siguiente"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════
            OFFERS SECTION (only when no filters and offers exist)
           ═══════════════════════════════════════════ */}
        {!search && !selectedCategory && !selectedStore && offerProducts.length > 0 && (
          <div className="animate-slide-up" style={{ marginBottom: 32 }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 16,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: '#FFE8E8', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Percent size={16} color="#FF6B6B" />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>
                  Ofertas
                </h3>
              </div>
              <span style={{
                fontSize: 12, fontWeight: 600, color: '#FF6B6B',
                background: '#FFE8E8', padding: '4px 12px',
                borderRadius: 'var(--radius-full)',
              }}>
                Precios especiales
              </span>
            </div>
            <div style={{ position: 'relative' }}>
              <div
                ref={(el: HTMLDivElement | null) => {
                  if (el) (window as any).__offersScroll = el;
                }}
                className="scroll-container" data-scroll="offers" style={{
                  display: 'flex', gap: 14,
                  overflowX: 'auto', paddingBottom: 8,
                  paddingRight: 16,
                  scrollBehavior: 'smooth',
                  WebkitOverflowScrolling: 'touch',
                  scrollSnapType: 'x mandatory',
                }}>
                {offerProducts.map((product: any) => (
                  <div key={product.id} style={{ minWidth: 200, maxWidth: 200, flexShrink: 0, scrollSnapAlign: 'start' }}>
                    <ProductCard
                      product={product}
                      onAddToCart={addToCart}
                      onClick={(p) => router.push(`/product/${p.id}`)}
                    />
                  </div>
                ))}
              </div>
              <button
                onClick={() => { const el = (window as any).__offersScroll; if (el) el.scrollBy({ left: -220, behavior: 'smooth' }); }}
                className="scroll-arrow-btn scroll-arrow-left"
                style={{
                  position: 'absolute', left: -6, top: '50%', transform: 'translateY(-50%)',
                  width: 32, height: 32, borderRadius: '50%', border: 'none',
                  background: 'white', color: 'var(--text)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.12)', zIndex: 5,
                }}
                aria-label="Anterior"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => { const el = (window as any).__offersScroll; if (el) el.scrollBy({ left: 220, behavior: 'smooth' }); }}
                className="scroll-arrow-btn scroll-arrow-right"
                style={{
                  position: 'absolute', right: -6, top: '50%', transform: 'translateY(-50%)',
                  width: 32, height: 32, borderRadius: '50%', border: 'none',
                  background: 'white', color: 'var(--text)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.12)', zIndex: 5,
                }}
                aria-label="Siguiente"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════
            SECTION TITLE — All Products or Search Results
           ═══════════════════════════════════════════ */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'var(--primary-light)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Sparkles size={16} color="var(--primary)" />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>
              {hasActiveFilters
                ? `Resultados${search ? ` de "${search}"` : ''} (${products.length})`
                : 'Todos los productos'
              }
            </h3>
          </div>

          {hasActiveFilters && (
            <button
              onClick={() => {
                setSelectedCategory('');
                setSelectedStore('');
                setSearch('');
                const input = document.querySelector('input[placeholder="Buscar productos..."]') as HTMLInputElement;
                if (input) input.value = '';
              }}
              style={{
                fontSize: 13, fontWeight: 600, color: 'var(--primary)',
                background: 'var(--primary-light)', padding: '6px 14px',
                borderRadius: 'var(--radius-full)', border: 'none',
                cursor: 'pointer',
              }}
            >
              Limpiar filtros
            </button>
          )}
        </div>

        {/* Hint for non-logged-in users about checkout requiring login */}
        {!isLoggedIn && cartCount > 0 && (
          <div style={{
            background: 'var(--primary-light)', borderRadius: 12,
            padding: '12px 16px', marginBottom: 16,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <User size={18} color="var(--primary)" />
            <p style={{ fontSize: 13, color: 'var(--text)' }}>
              <span>Inicia sesión para completar tu compra</span>
            </p>
            <button
              onClick={() => router.push('/login')}
              style={{
                marginLeft: 'auto', padding: '6px 14px', borderRadius: 'var(--radius-full)',
                background: 'var(--primary-gradient)', color: 'white', border: 'none',
                cursor: 'pointer', fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap',
              }}
            >
              Iniciar sesión
            </button>
          </div>
        )}

        {/* ═══════════════════════════════════════════
            PRODUCTS GRID
           ═══════════════════════════════════════════ */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <div style={{
              width: 36, height: 36,
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
              Intenta con otra busqueda o categoria
            </p>
            <button
              onClick={() => {
                setSelectedCategory('');
                setSelectedStore('');
                setSearch('');
                const input = document.querySelector('input[placeholder="Buscar productos..."]') as HTMLInputElement;
                if (input) input.value = '';
              }}
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
              .products-grid > div { min-width: 0; }
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

      {/* ═══════════════════════════════════════════
          FOOTER
         ═══════════════════════════════════════════ */}
      {!search && !selectedCategory && (
        <footer style={{
          background: 'var(--white)',
          borderTop: '1px solid var(--border)',
          padding: '24px 16px',
          textAlign: 'center',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            marginBottom: 8,
          }}>
            {shopLogoUrl ? (
              <img src={shopLogoUrl} alt={shopName} style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <div style={{
                width: 80, height: 80, borderRadius: '50%',
                background: 'var(--primary-gradient)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: 22, color: 'white',
              }}>
                {shopName.slice(0, 2).toUpperCase()}
              </div>
            )}
            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
              {shopName}
            </span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-light)' }}>
            Tu tienda en linea - Todos los derechos reservados
          </p>
        </footer>
      )}
    </div>
  );
}
