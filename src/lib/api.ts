import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://jo-backend-shop.vercel.app';

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('joshop_auth');
    if (stored) {
      try {
        const { token } = JSON.parse(stored);
        if (token) config.headers.Authorization = `Bearer ${token}`;
      } catch {
        localStorage.removeItem('joshop_auth');
      }
    }
  }
  return config;
});

// Response interceptor - unwrap data, handle 401
api.interceptors.response.use(
  (res) => res.data,
  async (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('joshop_auth');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error.response?.data || error);
  }
);

// Helper to extract data from various API response shapes
export function extractData(response: any): any[] {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (response.data && Array.isArray(response.data)) return response.data;
  if (response.products && Array.isArray(response.products)) return response.products;
  if (response.results && Array.isArray(response.results)) return response.results;
  if (response.orders && Array.isArray(response.orders)) return response.orders;
  if (response.users && Array.isArray(response.users)) return response.users;
  if (response.stores && Array.isArray(response.stores)) return response.stores;
  if (response.categories && Array.isArray(response.categories)) return response.categories;
  if (response.roles && Array.isArray(response.roles)) return response.roles;
  return Array.isArray(response) ? response : [];
}

// Helper to extract single item from response
export function extractItem(response: any): any {
  if (!response) return null;
  if (response.data && !Array.isArray(response.data)) return response.data;
  if (response.product) return response.product;
  if (response.order) return response.order;
  if (response.user) return response.user;
  if (response.store) return response.store;
  if (response.category) return response.category;
  if (response.role) return response.role;
  if (response.config) return response.config;
  if (typeof response === 'object' && !Array.isArray(response)) {
    // If it has an id, it's probably the item itself
    if (response.id) return response;
  }
  return response;
}

// Type the api so TypeScript knows interceptors unwrap the response
const typedApi = api as any;

export default typedApi;
