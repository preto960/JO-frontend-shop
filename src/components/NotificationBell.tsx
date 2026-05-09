'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Bell, X, Check, Trash2, Volume2, VolumeX } from 'lucide-react';
import { useNotifications, AppNotification } from '@/contexts/NotificationContext';
import { useAuth } from '@/contexts/AuthContext';
import { getStatusLabel } from '@/lib/utils';

// ─── Icon helper for notification types ─────────────────────────────────────
function getNotifIcon(type: AppNotification['type']): string {
  const icons: Record<string, string> = {
    'order-created': '🛒',
    'order-updated': '📦',
    'order-status-changed': '🔄',
    'delivery-assigned': '🚚',
    'order-message': '💬',
    'new-message': '💬',
    'location-update': '📍',
    'admin-chat': '👨‍💼',
    'system': '⚙️',
  };
  return icons[type] || '🔔';
}

function getNotifTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Ahora';
  if (diffMins < 60) return `Hace ${diffMins}m`;
  if (diffHours < 24) return `Hace ${diffHours}h`;
  if (diffDays < 7) return `Hace ${diffDays}d`;
  return new Date(date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

// ─── NotificationBell Component ─────────────────────────────────────────────
interface NotificationBellProps {
  anchorRef?: React.RefObject<HTMLButtonElement | null>;
}

export default function NotificationBell({ anchorRef: externalAnchorRef }: NotificationBellProps) {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll, requestBrowserPermission, browserPermission } = useNotifications();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifSound, setNotifSound] = useState(true);
  const internalRef = useRef<HTMLButtonElement>(null);
  const bellRef = externalAnchorRef || internalRef;
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        dropdownRef.current && !dropdownRef.current.contains(target) &&
        bellRef.current && !bellRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, bellRef]);

  const handleToggle = async () => {
    setIsOpen(!isOpen);
    // Request browser notification permission on first click
    if (!isOpen && browserPermission === 'default' && user) {
      await requestBrowserPermission();
    }
  };

  const handleMarkAllRead = useCallback(() => {
    markAllAsRead();
  }, [markAllAsRead]);

  const handleClearAll = useCallback(() => {
    clearAll();
  }, [clearAll]);

  if (!user) return null;

  return (
    <>
      {/* Bell button */}
      <button
        ref={bellRef}
        onClick={handleToggle}
        style={{
          background: 'rgba(255,255,255,0.15)',
          border: 'none',
          color: 'var(--white)',
          cursor: 'pointer',
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 40,
          height: 40,
          borderRadius: 'var(--radius-sm)',
          transition: 'var(--transition-fast)',
          position: 'relative',
        }}
        aria-label={`Notificaciones${unreadCount > 0 ? ` (${unreadCount} sin leer)` : ''}`}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: 2, right: 2,
            background: '#FF3B30', color: 'white',
            fontSize: 10, fontWeight: 700,
            minWidth: 16, height: 16, borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 4px',
            boxShadow: '0 2px 6px rgba(255,59,48,0.4)',
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="animate-fade-in-scale"
          style={{
            position: 'absolute',
            top: 64,
            right: 16,
            width: 380,
            maxWidth: 'calc(100vw - 32px)',
            background: 'var(--white)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-xl)',
            zIndex: 200,
            overflow: 'hidden',
            border: '1px solid var(--border)',
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 18px',
            borderBottom: '1px solid var(--border)',
            background: 'var(--background)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Bell size={18} style={{ color: 'var(--primary)' }} />
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
                Notificaciones
              </span>
              {unreadCount > 0 && (
                <span style={{
                  background: 'var(--primary-gradient)',
                  color: 'var(--white)',
                  fontSize: 11, fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                }}>
                  {unreadCount}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  title="Marcar todas como leídas"
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    padding: 6, borderRadius: 6,
                    color: 'var(--text-secondary)',
                    display: 'flex', alignItems: 'center',
                  }}
                >
                  <Check size={16} />
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={handleClearAll}
                  title="Limpiar todas"
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    padding: 6, borderRadius: 6,
                    color: 'var(--text-secondary)',
                    display: 'flex', alignItems: 'center',
                  }}
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Notification list */}
          <div style={{
            maxHeight: 400,
            overflowY: 'auto',
          }}>
            {notifications.length === 0 ? (
              <div style={{
                padding: '40px 20px',
                textAlign: 'center',
                color: 'var(--text-light)',
              }}>
                <Bell size={32} style={{ marginBottom: 8, opacity: 0.3 }} />
                <p style={{ fontSize: 14, fontWeight: 500 }}>Sin notificaciones</p>
                <p style={{ fontSize: 12, marginTop: 4 }}>Las notificaciones aparecerán aquí</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => markAsRead(notif.id)}
                  style={{
                    display: 'flex',
                    gap: 12,
                    padding: '14px 18px',
                    borderBottom: '1px solid var(--border)',
                    background: notif.read ? 'transparent' : 'var(--primary-light)',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease',
                  }}
                >
                  {/* Icon */}
                  <div style={{
                    width: 36, height: 36,
                    borderRadius: 'var(--radius-sm)',
                    background: notif.read ? 'var(--input-bg)' : 'var(--white)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18,
                    flexShrink: 0,
                    boxShadow: notif.read ? 'none' : 'var(--shadow)',
                  }}>
                    {getNotifIcon(notif.type)}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: 13, fontWeight: notif.read ? 500 : 600,
                      color: 'var(--text)',
                      marginBottom: 2,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {notif.title}
                    </p>
                    <p style={{
                      fontSize: 12, color: 'var(--text-secondary)',
                      lineHeight: 1.4,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}>
                      {notif.body}
                    </p>
                    <p style={{
                      fontSize: 11, color: 'var(--text-light)',
                      marginTop: 4,
                    }}>
                      {getNotifTime(notif.createdAt)}
                    </p>
                  </div>

                  {/* Unread dot */}
                  {!notif.read && (
                    <div style={{
                      width: 8, height: 8,
                      borderRadius: '50%',
                      background: 'var(--primary)',
                      flexShrink: 0,
                      marginTop: 6,
                    }} />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {browserPermission !== 'granted' && (
            <div style={{
              padding: '10px 18px',
              borderTop: '1px solid var(--border)',
              background: 'var(--warning-light)',
              fontSize: 11,
              color: 'var(--text-secondary)',
              textAlign: 'center',
            }}>
              Activa las notificaciones del navegador para alertas en segundo plano
            </div>
          )}
        </div>
      )}
    </>
  );
}
