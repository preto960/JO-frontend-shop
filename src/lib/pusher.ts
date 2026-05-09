import Pusher from 'pusher-js';

// Strip trailing slash to avoid double-slash URLs
const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'https://jo-backend-shop.vercel.app').replace(/\/+$/, '');

let pusherInstance: Pusher | null = null;

export function getPusherClient(): Pusher {
  if (pusherInstance) return pusherInstance;

  pusherInstance = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY || '5c0dab8f11f43914d9a6', {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'us2',
    channelAuthorization: {
      endpoint: `${API_URL}/pusher/auth`,
      transport: 'ajax',
      headersProvider: () => {
        if (typeof window === 'undefined') return {};
        try {
          const stored = localStorage.getItem('joshop_auth');
          if (stored) {
            const { token } = JSON.parse(stored);
            if (token) return { Authorization: `Bearer ${token}`, 'X-Platform': 'frontend-shop' };
          }
        } catch {}
        return { 'X-Platform': 'frontend-shop' };
      },
      params: {},
    },
  });

  return pusherInstance;
}

export function disconnectPusher() {
  if (pusherInstance) {
    pusherInstance.disconnect();
    pusherInstance = null;
  }
}
