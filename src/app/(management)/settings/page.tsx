'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Settings,
  Palette,
  Shield,
  Users,
  Tag,
  Store,
  Layers,
  ImageIcon,
  Globe,
  Info,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useConfig } from '@/contexts/ConfigContext';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface SettingsCard {
  id: string;
  title: string;
  description: string;
  path: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  color: string;
  bgColor: string;
  permission: 'admin' | 'products' | 'batches';
  showWhenMultiStore?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Card definitions (ordered logically)                               */
/* ------------------------------------------------------------------ */

const CARDS: SettingsCard[] = [
  {
    id: 'appearance',
    title: 'Apariencia',
    description: 'Nombre, colores y logo del sistema',
    path: '/settings/appearance',
    icon: Palette,
    color: '#E94560',
    bgColor: '#FDE8EC',
    permission: 'admin',
  },
  {
    id: 'roles',
    title: 'Roles y Permisos',
    description: 'Gestiona los roles y permisos del sistema',
    path: '/manage-roles',
    icon: Shield,
    color: '#6C5CE7',
    bgColor: '#F0EDFF',
    permission: 'admin',
  },
  {
    id: 'users',
    title: 'Usuarios',
    description: 'Administra los usuarios del sistema',
    path: '/manage-users',
    icon: Users,
    color: '#0984E3',
    bgColor: '#E8F1FF',
    permission: 'admin',
  },
  {
    id: 'categories',
    title: 'Categorías',
    description: 'Organiza las categorías de productos',
    path: '/manage-categories',
    icon: Tag,
    color: '#00B894',
    bgColor: '#E8FBF5',
    permission: 'products',
  },
  {
    id: 'batches',
    title: 'Lotes y Descuentos',
    description: 'Gestiona lotes con precios y descuentos especiales',
    path: '/product-batches',
    icon: Layers,
    color: '#E17055',
    bgColor: '#FFF9E6',
    permission: 'batches',
  },
  {
    id: 'stores',
    title: 'Tiendas',
    description: 'Gestiona las tiendas del sistema',
    path: '/manage-stores',
    icon: Store,
    color: '#00CEC9',
    bgColor: '#E8FAF9',
    permission: 'admin',
    showWhenMultiStore: true,
  },
  {
    id: 'banners',
    title: 'Banners de Publicidad',
    description: 'Configura los banners del carrusel principal',
    path: '/settings/banners',
    icon: ImageIcon,
    color: '#F39C12',
    bgColor: '#FEF3E2',
    permission: 'admin',
  },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function SettingsPage() {
  const router = useRouter();
  const { user, isAdmin, isEditor, canViewModule } = useAuth();
  const { config, isMultiStore, updateConfig } = useConfig();

  // Local toggle state synced with config
  const [multiStoreSwitch, setMultiStoreSwitch] = useState(isMultiStore);
  const [switchLoading, setSwitchLoading] = useState(false);

  // Keep local state in sync when config changes externally
  React.useEffect(() => {
    setMultiStoreSwitch(isMultiStore);
  }, [isMultiStore]);

  const handleMultiStoreToggle = async (newValue: boolean) => {
    setSwitchLoading(true);
    setMultiStoreSwitch(newValue);
    try {
      await updateConfig({ multi_store: String(newValue) });
    } catch {
      // Revert on failure
      setMultiStoreSwitch(!newValue);
    } finally {
      setSwitchLoading(false);
    }
  };

  /* ---- Visibility helpers ---- */

  const isCardVisible = (card: SettingsCard): boolean => {
    // Multi-store only cards
    if (card.showWhenMultiStore && !isMultiStore) return false;

    switch (card.permission) {
      case 'admin':
        return isAdmin;
      case 'products':
        return isAdmin || (isEditor && canViewModule('products'));
      case 'batches':
        return isAdmin || (isEditor && canViewModule('batches'));
      default:
        return false;
    }
  };

  const visibleCards = CARDS.filter(isCardVisible);

  /* ---- Helpers ---- */

  const currentRole = user?.roles?.[0]?.name || user?.role || 'N/A';
  const currentUser = user?.name || user?.email || 'N/A';

  /* ================================================================ */
  /*  Render                                                          */
  /* ================================================================ */

  return (
    <div style={{ padding: 24 }}>
      {/* ─── Page Header ─── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: 'var(--primary-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Settings size={22} color="var(--primary)" />
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', margin: 0, lineHeight: 1.3 }}>
              Configuracion
            </h1>
          </div>
        </div>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0, marginLeft: 52 }}>
          Administra y personaliza tu tienda
        </p>
        <div style={{ height: 1, background: 'var(--border)', marginTop: 16 }} />
      </div>

      {/* ─── Cards Grid ─── */}
      {/* Responsive 2-column grid via inline media query (desktop ≥768px) */}
      <style>{`
        @media (min-width: 768px) {
          .settings-card-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
      <div
        className="settings-card-grid animate-fade-in"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(1, 1fr)',
          gap: 16,
          marginBottom: 24,
        }}
      >
        {visibleCards.map((card) => (
          <NavigationCard key={card.id} card={card} onClick={() => router.push(card.path)} />
        ))}

        {/* ── Multi-Store Toggle Card (admin only) ── */}
        {isAdmin && (
          <MultiStoreToggleCard
            enabled={multiStoreSwitch}
            loading={switchLoading}
            onToggle={handleMultiStoreToggle}
          />
        )}
      </div>

      {/* ─── Info Section ─── */}
      <div className="animate-fade-in" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: '#F0EDFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Info size={18} color="#A29BFE" />
          </div>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Acerca de</h2>
            <p style={{ fontSize: 12, color: 'var(--text-light)', margin: 0 }}>Informacion de la aplicacion</p>
          </div>
        </div>

        <div
          style={{
            background: '#FFFFFF',
            borderRadius: 14,
            padding: 20,
            boxShadow: 'var(--shadow)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {[
            { label: 'Aplicacion', value: config.shop_name || 'JO-Shop' },
            { label: 'Version', value: '1.0.0' },
            { label: 'Plataforma', value: 'Next.js' },
            { label: 'Rol actual', value: currentRole },
            { label: 'Usuario', value: currentUser },
          ].map((item, idx, arr) => (
            <div
              key={item.label}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 0',
                borderBottom: idx < arr.length - 1 ? '1px solid var(--border)' : 'none',
              }}
            >
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>{item.label}</span>
              <span style={{ fontSize: 14, color: 'var(--text)', fontWeight: 600 }}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

/** Clickable navigation card */
function NavigationCard({
  card,
  onClick,
}: {
  card: SettingsCard;
  onClick: () => void;
}) {
  const Icon = card.icon;

  const [hovered, setHovered] = React.useState(false);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#FFFFFF',
        borderRadius: 14,
        padding: 20,
        boxShadow: hovered ? '0 8px 25px rgba(0,0,0,0.1)' : 'var(--shadow)',
        cursor: 'pointer',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        userSelect: 'none',
        outline: 'none',
      }}
    >
      {/* Icon circle */}
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: card.bgColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={22} color={card.color} />
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: 0, lineHeight: 1.3 }}>
          {card.title}
        </p>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0', lineHeight: 1.4 }}>
          {card.description}
        </p>
      </div>

      {/* Chevron */}
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
        <ChevronRight
          size={20}
          color={hovered ? card.color : 'var(--text-light)'}
          style={{ transition: 'color 0.2s ease' }}
        />
      </div>
    </div>
  );
}

/** Multi-store toggle card (non-navigable) */
function MultiStoreToggleCard({
  enabled,
  loading,
  onToggle,
}: {
  enabled: boolean;
  loading: boolean;
  onToggle: (value: boolean) => void;
}) {
  const [hovered, setHovered] = React.useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#FFFFFF',
        borderRadius: 14,
        padding: 20,
        boxShadow: hovered ? '0 8px 25px rgba(0,0,0,0.1)' : 'var(--shadow)',
        transition: 'box-shadow 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        userSelect: 'none',
      }}
    >
      {/* Icon circle */}
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: enabled ? '#E8FBF5' : 'var(--input-bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'background 0.3s ease',
        }}
      >
        <Globe size={22} color={enabled ? '#00B894' : 'var(--text-light)'} />
      </div>

      {/* Text + toggle */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: 0, lineHeight: 1.3 }}>
          {enabled ? 'Multi-Tienda' : 'Tienda Unica'}
        </p>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0', lineHeight: 1.4 }}>
          {enabled
            ? 'Multiples tiendas desde un solo panel de administracion.'
            : 'Modo tienda unica. Todos los productos y pedidos pertenecen a una sola tienda.'}
        </p>

        {/* Status indicator */}
        <div
          style={{
            marginTop: 10,
            padding: '8px 12px',
            borderRadius: 10,
            background: enabled ? '#E8FBF5' : 'var(--input-bg)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            transition: 'background 0.3s ease',
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: enabled ? '#00B894' : '#B2BEC3',
              flexShrink: 0,
              transition: 'background 0.3s ease',
            }}
          />
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: enabled ? '#00815A' : 'var(--text-secondary)',
              transition: 'color 0.3s ease',
            }}
          >
            {enabled ? 'Modo Multi-Tienda activado' : 'Modo Tienda Unica activado'}
          </span>
        </div>
      </div>

      {/* Toggle switch */}
      <button
        onClick={() => onToggle(!enabled)}
        disabled={loading}
        aria-label={enabled ? 'Desactivar modo multi-tienda' : 'Activar modo multi-tienda'}
        style={{
          width: 52,
          height: 28,
          borderRadius: 14,
          border: 'none',
          background: enabled ? '#00B894' : '#DFE4EA',
          cursor: loading ? 'wait' : 'pointer',
          position: 'relative',
          transition: 'background 0.3s ease',
          opacity: loading ? 0.6 : 1,
          flexShrink: 0,
          padding: 0,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 3,
            left: enabled ? 27 : 3,
            width: 22,
            height: 22,
            borderRadius: '50%',
            background: '#FFFFFF',
            boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
            transition: 'left 0.3s ease',
          }}
        />
      </button>
    </div>
  );
}
