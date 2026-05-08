'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';

// ─── Types ──────────────────────────────────────────────────────────────────
export interface AppNotification {
  id: string;
  type: 'order-created' | 'order-updated' | 'delivery-assigned' | 'order-message' | 'order-status-changed' | 'location-update' | 'new-message' | 'admin-chat' | 'system';
  title: string;
  body: string;
  data?: any;
  read: boolean;
  createdAt: Date;
}

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (notification: Omit<AppNotification, 'id' | 'read' | 'createdAt'>) => AppNotification;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  requestBrowserPermission: () => Promise<boolean>;
  browserPermission: NotificationPermission;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

let notifIdCounter = 0;

// ─── Sound utility ──────────────────────────────────────────────────────────
function playNotificationSound() {
  try {
    // Use Web Audio API for a subtle notification beep
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
    oscillator.frequency.setValueAtTime(1100, ctx.currentTime + 0.1); // higher

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.3);
  } catch {
    // Audio not supported or blocked
  }
}

// ─── Browser Notification utility ───────────────────────────────────────────
function showBrowserNotification(title: string, body: string, icon?: string, onClick?: () => void) {
  if (typeof window === 'undefined') return;
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  try {
    const notification = new Notification(title, {
      body,
      icon: icon || '/api/favicon',
      badge: '/api/favicon',
      tag: `joshop-${Date.now()}`,
    });

    if (onClick) {
      notification.onclick = () => {
        window.focus();
        onClick();
        notification.close();
      };
    }

    // Auto-close after 5 seconds
    setTimeout(() => notification.close(), 5000);
  } catch {
    // Notification API not available
  }
}

// ─── Provider ───────────────────────────────────────────────────────────────
export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>('default');
  const notifSoundRef = useRef(true);

  // Check browser permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setBrowserPermission(Notification.permission);
    }
  }, []);

  const requestBrowserPermission = useCallback(async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !('Notification' in window)) return false;
    try {
      const permission = await Notification.requestPermission();
      setBrowserPermission(permission);
      return permission === 'granted';
    } catch {
      return false;
    }
  }, []);

  const addNotification = useCallback((input: Omit<AppNotification, 'id' | 'read' | 'createdAt'>): AppNotification => {
    const notif: AppNotification = {
      ...input,
      id: `notif-${++notifIdCounter}-${Date.now()}`,
      read: false,
      createdAt: new Date(),
    };

    setNotifications(prev => [notif, ...prev].slice(0, 50)); // Keep max 50

    // Play sound
    if (notifSoundRef.current) {
      playNotificationSound();
    }

    // Show browser notification (only if page is not focused)
    if (typeof document !== 'undefined' && !document.hasFocus()) {
      showBrowserNotification(
        notif.title,
        notif.body,
        undefined,
        // Click handler could navigate based on notif type
      );
    }

    return notif;
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Clear notifications on logout
  useEffect(() => {
    if (!user) {
      setNotifications([]);
    }
  }, [user]);

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      addNotification,
      markAsRead,
      markAllAsRead,
      clearAll,
      requestBrowserPermission,
      browserPermission,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}
