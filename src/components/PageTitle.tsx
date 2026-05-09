'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useConfig } from '@/contexts/ConfigContext';

// Map of routes to page names
const PAGE_TITLES: Record<string, string> = {
  '/': 'Inicio',
  '/home': 'Inicio',
  '/login': 'Iniciar sesión',
  '/register': 'Crear cuenta',
  '/cart': 'Carrito',
  '/checkout': 'Checkout',
  '/favorites': 'Favoritos',
  '/my-orders': 'Mis pedidos',
  '/profile': 'Mi perfil',
  '/deliveries': 'Entregas',
  // Management
  '/dashboard': 'Panel',
  '/manage-products': 'Productos',
  '/manage-categories': 'Categorías',
  '/manage-orders': 'Pedidos',
  '/manage-users': 'Usuarios',
  '/manage-roles': 'Roles',
  '/manage-stores': 'Tiendas',
  '/product-batches': 'Lotes',
  '/settings': 'Configuración',
  '/settings/appearance': 'Apariencia',
  '/settings/banners': 'Banners',
};

export default function PageTitle() {
  const pathname = usePathname();
  const { config } = useConfig();
  const shopName = config.shop_name || 'JO-Shop';

  useEffect(() => {
    // Find the most specific match for the current path
    let title = PAGE_TITLES[pathname];

    // If no exact match, try matching by prefix
    if (!title) {
      const sortedKeys = Object.keys(PAGE_TITLES).sort(
        (a, b) => b.length - a.length,
      );
      for (const key of sortedKeys) {
        if (key !== '/' && pathname.startsWith(key)) {
          title = PAGE_TITLES[key];
          break;
        }
      }
    }

    // Product detail: /product/[id]
    if (!title && pathname.startsWith('/product/')) {
      title = 'Producto';
    }

    if (title) {
      document.title = `${title} — ${shopName}`;
    } else {
      document.title = shopName;
    }
  }, [pathname, shopName]);

  return null; // This component renders nothing
}
