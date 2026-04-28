'use client';

import React, { useState } from 'react';
import {
  Settings, Store, Globe, Shield, Info, RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { useConfig } from '@/contexts/ConfigContext';
import { useAuth } from '@/contexts/AuthContext';
import { showToast } from '@/lib/utils';
import api from '@/lib/api';

/* ═══════════════════════════════════════════════════════════════
   Settings / Configuration Page
   Matches mobile app SettingsScreen:
     - Multi-Store toggle (admin-only)
     - Backend URL info (read-only for web)
     - About section
   ═══════════════════════════════════════════════════════════════ */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://jo-backend-shop.vercel.app';

export default function SettingsPage() {
  const { user, isAdmin } = useAuth();
  const { isMultiStore, isSaving, updateConfig } = useConfig();
  const [multiStoreSwitch, setMultiStoreSwitch] = useState(isMultiStore);
  const [switchLoading, setSwitchLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  const handleMultiStoreToggle = async (newValue: boolean) => {
    setSwitchLoading(true);
    setMultiStoreSwitch(newValue);

    try {
      await updateConfig({ multi_store: String(newValue) });
    } catch {
      // Revert on error
      setMultiStoreSwitch(!newValue);
      showToast('Error al cambiar modo de tienda', 'error');
    } finally {
      setSwitchLoading(false);
    }
  };

  const testConnection = async () => {
    setConnectionStatus('testing');
    try {
      await api.get('/health');
      setConnectionStatus('success');
      showToast('Conexion exitosa', 'success');
    } catch {
      // Fallback: try root endpoint
      try {
        await api.get('/');
        setConnectionStatus('success');
        showToast('Conexion exitosa', 'success');
      } catch {
        setConnectionStatus('error');
        showToast('No se pudo conectar al servidor', 'error');
      }
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: '#FFF0E9', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Settings size={22} color="#FF6B35" />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)' }}>
            Configuracion
          </h1>
        </div>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginLeft: 52 }}>
          Ajustes generales del sistema
        </p>
        <div style={{ height: 1, background: 'var(--border)', marginTop: 16 }} />
      </div>

      {/* ═══════════════════════════════════════════
          STORE MODE SECTION (admin-only)
         ═══════════════════════════════════════════ */}
      {isAdmin && (
        <div className="animate-fade-in" style={{ marginBottom: 24 }}>
          <SectionHeader
            icon={Store}
            iconColor="#00B894"
            iconBg="#E8FBF5"
            title="Modo de Tienda"
            description="Configura el modo de operacion de tu tienda"
          />

          <div style={{
            background: '#FFFFFF', borderRadius: 14,
            padding: 20, boxShadow: 'var(--shadow)',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: 16,
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
                  Multi-Tienda
                </p>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {multiStoreSwitch
                    ? 'Permite gestionar multiples tiendas desde un solo panel. Los productos pueden pertenecer a diferentes tiendas y los pedidos se filtran por tienda.'
                    : 'Modo tienda unica. Todos los productos y pedidos pertenecen a una sola tienda.'
                  }
                </p>
              </div>
              <button
                onClick={() => handleMultiStoreToggle(!multiStoreSwitch)}
                disabled={switchLoading}
                style={{
                  width: 52, height: 28, borderRadius: 14, border: 'none',
                  background: multiStoreSwitch ? '#00B894' : '#DFE4EA',
                  cursor: switchLoading ? 'wait' : 'pointer',
                  position: 'relative', transition: 'all 0.3s ease',
                  opacity: switchLoading ? 0.6 : 1,
                  flexShrink: 0,
                }}
              >
                <div style={{
                  position: 'absolute', top: 3,
                  left: multiStoreSwitch ? 27 : 3,
                  width: 22, height: 22,
                  borderRadius: '50%', background: '#FFFFFF',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                  transition: 'left 0.3s ease',
                }} />
              </button>
            </div>

            {/* Mode indicator badge */}
            <div style={{
              marginTop: 14, padding: '10px 14px',
              borderRadius: 10,
              background: multiStoreSwitch ? '#E8FBF5' : 'var(--input-bg)',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: multiStoreSwitch ? '#00B894' : '#B2BEC3',
                flexShrink: 0,
              }} />
              <span style={{
                fontSize: 13, fontWeight: 500,
                color: multiStoreSwitch ? '#00815A' : 'var(--text-secondary)',
              }}>
                {multiStoreSwitch
                  ? 'Modo Multi-Tienda activado'
                  : 'Modo Tienda Unica activado'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          BACKEND SERVER SECTION (admin-only)
         ═══════════════════════════════════════════ */}
      {isAdmin && (
        <div className="animate-fade-in" style={{ marginBottom: 24 }}>
          <SectionHeader
            icon={Globe}
            iconColor="#54A0FF"
            iconBg="#E8F1FF"
            title="Servidor Backend"
            description="Informacion de conexion al servidor"
          />

          <div style={{
            background: '#FFFFFF', borderRadius: 14,
            padding: 20, boxShadow: 'var(--shadow)',
            display: 'flex', flexDirection: 'column', gap: 16,
          }}>
            {/* Embedded URL (read-only) */}
            <div>
              <label style={{
                display: 'block', fontSize: 12, fontWeight: 600,
                marginBottom: 6, color: 'var(--text-light)',
                textTransform: 'uppercase', letterSpacing: '0.5px',
              }}>
                URL del servidor (configurada)
              </label>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '0 14px', height: 44,
                borderRadius: 10, border: '1px solid var(--border)',
                background: 'var(--input-bg)',
              }}>
                <Globe size={16} color="var(--text-light)" />
                <span style={{ fontSize: 14, color: 'var(--text)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {API_URL}
                </span>
                <a
                  href={API_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-light)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}
                  title="Abrir en navegador"
                >
                  <ExternalLink size={16} />
                </a>
              </div>
            </div>

            {/* Connection test */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={testConnection}
                disabled={connectionStatus === 'testing'}
                style={{
                  flex: 1, padding: '10px 16px', borderRadius: 10, border: 'none',
                  background: connectionStatus === 'success'
                    ? '#00B894'
                    : connectionStatus === 'error'
                      ? '#FF6B6B'
                      : 'linear-gradient(135deg, #54A0FF, #74B3FF)',
                  color: 'white', cursor: connectionStatus === 'testing' ? 'wait' : 'pointer',
                  fontWeight: 600, fontSize: 13,
                  boxShadow: connectionStatus === 'success'
                    ? '0 4px 14px rgba(0,184,148,0.3)'
                    : connectionStatus === 'error'
                      ? '0 4px 14px rgba(255,107,107,0.3)'
                      : '0 4px 14px rgba(84,160,255,0.3)',
                  transition: 'all 0.2s ease',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  opacity: connectionStatus === 'testing' ? 0.7 : 1,
                }}
              >
                {connectionStatus === 'testing' ? (
                  <>
                    <div style={{
                      width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: 'white', borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                    }} />
                    Probando...
                  </>
                ) : connectionStatus === 'success' ? (
                  'Conexion exitosa'
                ) : connectionStatus === 'error' ? (
                  'Sin conexion'
                ) : (
                  <>
                    <RefreshCw size={15} />
                    Probar conexion
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          ABOUT SECTION
         ═══════════════════════════════════════════ */}
      <div className="animate-fade-in" style={{ marginBottom: 24 }}>
        <SectionHeader
          icon={Info}
          iconColor="#A29BFE"
          iconBg="#F0EDFF"
          title="Acerca de"
          description="Informacion de la aplicacion"
        />

        <div style={{
          background: '#FFFFFF', borderRadius: 14,
          padding: 20, boxShadow: 'var(--shadow)',
          display: 'flex', flexDirection: 'column', gap: 0,
        }}>
          {[
            { label: 'Aplicacion', value: 'JO-Shop' },
            { label: 'Version', value: '1.0.0' },
            { label: 'Plataforma', value: 'Next.js (Web)' },
            { label: 'Rol actual', value: user?.roles?.[0]?.name || user?.role || 'N/A' },
            { label: 'Usuario', value: user?.name || user?.email || 'N/A' },
          ].map((item, idx) => (
            <div
              key={item.label}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 0',
                borderBottom: idx < 4 ? '1px solid var(--border)' : 'none',
              }}
            >
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
                {item.label}
              </span>
              <span style={{ fontSize: 14, color: 'var(--text)', fontWeight: 600 }}>
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Reusable section header component
   ═══════════════════════════════════════════════════════════════ */

function SectionHeader({
  icon: Icon,
  iconColor,
  iconBg,
  title,
  description,
}: {
  icon: any;
  iconColor: string;
  iconBg: string;
  title: string;
  description: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: iconBg, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={18} color={iconColor} />
      </div>
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
          {title}
        </h2>
        <p style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 1 }}>
          {description}
        </p>
      </div>
    </div>
  );
}
