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
}

const PusherContext = createContext<PusherContextType | undefined>(undefined);

export function PusherProvider({ children }: { children: React.ReactNode }) {
  const { user, token } = useAuth();
  const [pusher, setPusher] = useState<Pusher | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const userChannelRef = useRef<any>(null);
  const orderChannelsRef = useRef<Map<string, any>>(new Map());

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

    // Connection state handlers
    const onConnected = () => setIsConnected(true);
    const onDisconnected = () => setIsConnected(false);
    const onError = (err: any) => {
      console.error('[Pusher] Connection error:', err);
      setIsConnected(false);
    };

    client.bind('connected', onConnected);
    client.bind('disconnected', onDisconnected);
    client.bind('error', onError);

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
      client.unbind('connected', onConnected);
      client.unbind('disconnected', onDisconnected);
      client.unbind('error', onError);
      userChannel.unbind('pusher:subscription_error');
      userChannel.unbind('pusher:subscription_succeeded');
      userChannel.unbind('order-updated');
      userChannel.unbind('order-created');
      userChannel.unbind('delivery-assigned');
      userChannel.unbind('order-message');
      userChannelRef.current?.unsubscribe();
      orderChannelsRef.current.forEach((ch) => ch.unsubscribe());
      orderChannelsRef.current.clear();
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

  return (
    <PusherContext.Provider value={{
      pusher,
      isConnected,
      subscribeToUserChannel,
      subscribeToOrderChannel,
      unsubscribeFromOrderChannel,
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
