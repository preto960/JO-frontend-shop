# JO-Shop Web Frontend

Tienda en línea completa para e-commerce, adaptada desde la aplicación React Native.

## 🚀 Despliegue en Vercel

1. Sube el repositorio a GitHub
2. Conecta el repositorio en [vercel.com](https://vercel.com)
3. Vercel detectará automáticamente Next.js
4. Haz clic en "Deploy"

No se requiere configuración adicional.

## 🛠️ Desarrollo Local

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Abrir http://localhost:3000
```

## 📋 Características

### Roles de usuario
- **Admin**: Acceso completo al panel de administración
- **Editor**: Panel de administración sin acceso a configuración
- **Repartidor**: Gestión de entregas
- **Cliente**: Catálogo de productos, carrito, pedidos, perfil

### Funcionalidades
- Autenticación con 2FA (OTP)
- Catálogo de productos con búsqueda y filtros
- Carrito de compras persistente (localStorage)
- Gestión de pedidos con seguimiento de estado
- Panel de administración completo (dashboard, productos, categorías, pedidos, tiendas, roles, usuarios)
- Modo multi-tienda
- Diseño responsivo (mobile-first)
- Toda la interfaz en español

## 🎨 Diseño

- Paleta de colores basada en CSS variables
- Tailwind CSS 4 para estilos
- Lucide React para iconos
- Componentes personalizados (sin shadcn/ui)
- Responsive: Mobile + Desktop

## 📁 Estructura

```
src/
├── app/
│   ├── layout.tsx          # Layout principal con providers
│   ├── page.tsx            # Redirect por rol
│   ├── login/              # Login con 2FA
│   ├── register/           # Registro
│   ├── home/               # Catálogo de productos
│   ├── cart/               # Carrito de compras
│   ├── orders/             # Mis pedidos
│   ├── profile/            # Perfil de usuario
│   ├── product/[id]/       # Detalle de producto
│   ├── admin/              # Panel de administración
│   └── delivery/           # Panel de repartidor
├── components/             # Componentes compartidos
├── contexts/               # Auth & Config contexts
└── lib/                    # API client y utilidades
```

## 🔌 API Backend

El frontend se conecta a: `https://jo-backend-shop.vercel.app`
