'use client';

import React, { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { getStatusLabel } from '@/lib/utils';

/**
 * GlobalPusherListener — catches all Pusher CustomEvents dispatched via
 * window.dispatchEvent() and converts them into in-app + browser notifications.
 *
 * Must be placed inside <PusherProvider> and <NotificationProvider>.
 */
export default function GlobalPusherListener() {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const userRef = useRef(user);
  userRef.current = user;

  useEffect(() => {
    if (!user) return;

    // ─── Order created ───────────────────────────────────────────────
    const onOrderCreated = (e: Event) => {
      const data = (e as CustomEvent).detail;
      if (!data) return;
      addNotification({
        type: 'order-created',
        title: 'Nuevo pedido',
        body: data.message || `Pedido #${String(data.orderId || '').slice(-8).toUpperCase()} creado`,
        data,
      });
    };

    // ─── Order updated (status change) ──────────────────────────────
    const onOrderUpdated = (e: Event) => {
      const data = (e as CustomEvent).detail;
      if (!data) return;
      const orderId = String(data.orderId || '').slice(-8).toUpperCase();
      const statusLabel = data.status ? getStatusLabel(data.status) : 'actualizado';
      addNotification({
        type: 'order-updated',
        title: `Pedido #${orderId}`,
        body: data.message || `Estado cambiado a: ${statusLabel}`,
        data,
      });
    };

    // ─── Order status changed (from order channel) ──────────────────
    const onOrderStatusChanged = (e: Event) => {
      const data = (e as CustomEvent).detail;
      if (!data) return;
      const orderId = String(data.orderId || '').slice(-8).toUpperCase();
      const statusLabel = data.status ? getStatusLabel(data.status) : 'actualizado';
      addNotification({
        type: 'order-status-changed',
        title: `Pedido #${orderId}`,
        body: data.message || `Estado cambiado a: ${statusLabel}`,
        data,
      });
    };

    // ─── Delivery assigned ──────────────────────────────────────────
    const onDeliveryAssigned = (e: Event) => {
      const data = (e as CustomEvent).detail;
      if (!data) return;
      addNotification({
        type: 'delivery-assigned',
        title: 'Entrega asignada',
        body: data.message || `Pedido #${String(data.orderId || '').slice(-8).toUpperCase()} te fue asignado`,
        data,
      });
    };

    // ─── Order message (from user channel) ──────────────────────────
    // Only fires for OTHER users (not the sender), so no need to filter own messages.
    // The "new-message" from order channel is handled by OrderChatModal directly;
    // we intentionally skip it here to avoid duplicate notifications.
    const onOrderMessage = (e: Event) => {
      const data = (e as CustomEvent).detail;
      if (!data) return;
      const senderName = data.senderName || 'Repartidor';
      const orderId = String(data.orderId || '').slice(-8).toUpperCase();
      addNotification({
        type: 'order-message',
        title: `Nuevo mensaje del repartidor`,
        body: `${senderName} te escribio en la orden #${orderId}`,
        data: { orderId: data.orderId, senderName },
      });
    };

    // ─── New message (from order channel) ───────────────────────────
    // Skip notifications here — OrderChatModal handles display.
    // The user-channel "order-message" already creates the notification.
    const onNewMessage = (_e: Event) => {
      // No notification — avoid duplicate with order-message
    };

    // ─── Location update ────────────────────────────────────────────
    const onLocationUpdate = (e: Event) => {
      // Don't create notification for every location ping — too noisy
      // Only dispatch event for map tracking
      // const data = (e as CustomEvent).detail;
    };

    // ─── Register all listeners ─────────────────────────────────────
    const events: Array<{ name: string; handler: EventListener }> = [
      { name: 'pusher:order-created', handler: onOrderCreated },
      { name: 'pusher:order-updated', handler: onOrderUpdated },
      { name: 'pusher:order-status-changed', handler: onOrderStatusChanged },
      { name: 'pusher:delivery-assigned', handler: onDeliveryAssigned },
      { name: 'pusher:order-message', handler: onOrderMessage },
      { name: 'pusher:order-new-message', handler: onNewMessage },
      { name: 'pusher:location-update', handler: onLocationUpdate },
    ];

    events.forEach(({ name, handler }) => {
      window.addEventListener(name, handler);
    });

    return () => {
      events.forEach(({ name, handler }) => {
        window.removeEventListener(name, handler);
      });
    };
  }, [user, addNotification]);

  // This component renders nothing visible
  return null;
}
