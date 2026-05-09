'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { getPusherClient, disconnectPusher } from '@/lib/pusher';
import { useAuth } from './AuthContext';
import Pusher from 'pusher-js';

interface PusherContextType {
  pusher: Pusher | null;
  isConnected: boolean;
  subscribeToUserChannel: () => any;
  subscribeToOrderChannel: (orderId: number | string) => any;
  unsubscribeFromOrderChannel: (orderId: number | string) => void;
  // Admin chat presence channel
  subscribeToAdminChat: () => any;
  adminOnlineMembers: Map<string, any>;
}

const PusherContext = createContext<PusherContextType | undefined>(undefined);

export function PusherProvider({ children }: { children: React.ReactNode }) {
  const { user, token } = useAuth();
  const [pusher, setPusher] = useState<Pusher | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const userChannelRef = useRef<any>(null);
  const orderChannelsRef = useRef<Map<string, any>>(new Map());
  const adminChatRef = useRef<any>(null);
  const [adminOnlineMembers, setAdminOnlineMembers] = useState<Map<string, any>>(new Map());

  // Initialize Pusher when user is authenticated
  useEffect(() => {
    if (!user || !token) {
      // Disconnect if user logs out
      if (pusher) {
        userChannelRef.current?.unsubscribe();
        orderChannelsRef.current.forEach((ch) => ch.unsubscribe());
        orderChannelsRef.current.clear();
        disconnectPusher();
        setPusher(null);
        setIsConnected(false);
      }
      return;
    }

    const client = getPusherClient();
    setPusher(client);

    // Log initial connection state
    console.log('[Pusher] Initial connection state:', client.connection?.state);

    // Connection state handlers — MUST bind on client.connection, not on client
    const onConnected = () => {
      console.log('[Pusher] Connected, socket_id:', client.connection.socket_id);
      setIsConnected(true);
    };
    const onDisconnected = () => {
      console.log('[Pusher] Disconnected');
      setIsConnected(false);
    };
    const onError = (err: any) => {
      const msg = err?.data?.message || err?.message || '';
      const code = err?.data?.code;
      // "No current subscription" is a benign race condition — the subscription
      // completes successfully right after. Don't mark as disconnected.
      const isSubscriptionRace = msg.includes('No current subscription') || msg.includes('subscription in progress');
      // 1006 = abnormal WebSocket close (proxy timeout, network blip). Pusher auto-reconnects.
      const isAbnormalClose = code === 1006;
      if (isSubscriptionRace || isAbnormalClose) {
        console.warn('[Pusher] Benign error (suppressed):', code || msg || 'unknown');
        return;
      }
      console.error('[Pusher] Connection error:', JSON.stringify(err));
      if (err?.data) {
        console.error('[Pusher] Error data:', JSON.stringify(err.data));
      }
      setIsConnected(false);
    };
    const onStateChange = (state: any) => {
      console.log('[Pusher] State change:', state?.previous, '→', state?.current);
    };

    client.connection.bind('connected', onConnected);
    client.connection.bind('disconnected', onDisconnected);
    client.connection.bind('error', onError);
    client.connection.bind('state_change', onStateChange);

    // Check initial state
    if (client.connection?.state === 'connected') {
      setIsConnected(true);
    }

    // Subscribe to user's private channel
    const userChannel = client.subscribe(`private-user-${user.id}`);
    userChannelRef.current = userChannel;

    userChannel.bind('pusher:subscription_error', (err: any) => {
      console.error('[Pusher] Failed to subscribe to user channel:', err);
    });

    userChannel.bind('pusher:subscription_succeeded', () => {
      console.log(`[Pusher] Subscribed to private-user-${user.id}`);
    });

    // Listen for real-time order updates
    userChannel.bind('order-updated', (data: any) => {
      // Dispatch a custom event so any page can listen
      window.dispatchEvent(new CustomEvent('pusher:order-updated', { detail: data }));
    });

    userChannel.bind('order-created', (data: any) => {
      window.dispatchEvent(new CustomEvent('pusher:order-created', { detail: data }));
    });

    userChannel.bind('delivery-assigned', (data: any) => {
      window.dispatchEvent(new CustomEvent('pusher:delivery-assigned', { detail: data }));
    });

    userChannel.bind('order-message', (data: any) => {
      window.dispatchEvent(new CustomEvent('pusher:order-message', { detail: data }));
    });

    return () => {
      client.connection.unbind('connected', onConnected);
      client.connection.unbind('disconnected', onDisconnected);
      client.connection.unbind('error', onError);
      client.connection.unbind('state_change', onStateChange);
      userChannel.unbind('pusher:subscription_error');
      userChannel.unbind('pusher:subscription_succeeded');
      userChannel.unbind('order-updated');
      userChannel.unbind('order-created');
      userChannel.unbind('delivery-assigned');
      userChannel.unbind('order-message');
      userChannelRef.current?.unsubscribe();
      orderChannelsRef.current.forEach((ch) => ch.unsubscribe());
      orderChannelsRef.current.clear();
      // Unsubscribe from admin chat
      if (adminChatRef.current) {
        adminChatRef.current.unbind('pusher:subscription_succeeded');
        adminChatRef.current.unbind('pusher:member_added');
        adminChatRef.current.unbind('pusher:member_removed');
        adminChatRef.current.unsubscribe();
        adminChatRef.current = null;
        setAdminOnlineMembers(new Map());
      }
    };
  }, [user, token]);

  const subscribeToUserChannel = useCallback(() => {
    if (!pusher || !user) return null;
    return pusher.subscribe(`private-user-${user.id}`);
  }, [pusher, user]);

  const subscribeToOrderChannel = useCallback((orderId: number | string) => {
    if (!pusher) return null;
    const channelName = `private-order-${orderId}`;
    const existing = orderChannelsRef.current.get(channelName);
    if (existing) return existing;

    const channel = pusher.subscribe(channelName);
    orderChannelsRef.current.set(channelName, channel);

    channel.bind('status-changed', (data: any) => {
      window.dispatchEvent(new CustomEvent('pusher:order-status-changed', { detail: data }));
    });

    channel.bind('new-message', (data: any) => {
      window.dispatchEvent(new CustomEvent('pusher:order-new-message', { detail: data }));
    });

    channel.bind('location-update', (data: any) => {
      window.dispatchEvent(new CustomEvent('pusher:location-update', { detail: data }));
    });

    return channel;
  }, [pusher]);

  const unsubscribeFromOrderChannel = useCallback((orderId: number | string) => {
    if (!pusher) return;
    const channelName = `private-order-${orderId}`;
    const channel = orderChannelsRef.current.get(channelName);
    if (channel) {
      channel.unbind_all();
      pusher.unsubscribe(channelName);
      orderChannelsRef.current.delete(channelName);
    }
  }, [pusher]);

  // ─── Admin Chat Presence Channel (Fase 5 prep) ──────────────────────
  const subscribeToAdminChat = useCallback(() => {
    if (!pusher || !user) return null;
    if (adminChatRef.current) return adminChatRef.current;

    const channel = pusher.subscribe('presence-admin-chat');
    adminChatRef.current = channel;

    channel.bind('pusher:subscription_succeeded', (members: any) => {
      console.log('[Pusher] Subscribed to presence-admin-chat, members:', members.count);
      const map = new Map<string, any>();
      members.each((m: any) => map.set(m.id, m.info));
      setAdminOnlineMembers(map);
    });

    channel.bind('pusher:member_added', (member: any) => {
      console.log('[Pusher] Admin online:', member.id);
      setAdminOnlineMembers(prev => {
        const next = new Map(prev);
        next.set(member.id, member.info);
        return next;
      });
      window.dispatchEvent(new CustomEvent('pusher:admin-online', { detail: member }));
    });

    channel.bind('pusher:member_removed', (member: any) => {
      console.log('[Pusher] Admin offline:', member.id);
      setAdminOnlineMembers(prev => {
        const next = new Map(prev);
        next.delete(member.id);
        return next;
      });
      window.dispatchEvent(new CustomEvent('pusher:admin-offline', { detail: member }));
    });

    return channel;
  }, [pusher, user]);

  return (
    <PusherContext.Provider value={{
      pusher,
      isConnected,
      subscribeToUserChannel,
      subscribeToOrderChannel,
      unsubscribeFromOrderChannel,
      subscribeToAdminChat,
      adminOnlineMembers,
    }}>
      {children}
    </PusherContext.Provider>
  );
}

export function usePusher() {
  const ctx = useContext(PusherContext);
  if (!ctx) throw new Error('usePusher must be used within PusherProvider');
  return ctx;
}
