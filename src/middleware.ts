import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Protección server-side de rutas privadas.
 *
 * El token de sesión vive en localStorage (inaccesible desde el servidor), así
 * que al iniciar sesión se deja una cookie de PRESENCIA (`joshop_session_hint`,
 * sin datos sensibles). El middleware la usa para cortar en el servidor el
 * acceso a rutas privadas antes de hidratar la página.
 *
 * IMPORTANTE: esta cookie no es un certificado de identidad — quien la falsifique
 * solo verá el shell de la UI; los datos siguen protegidos por el token Bearer
 * que valida el backend en cada endpoint. La cookie cierra la puerta del shell,
 * el backend sigue siendo la cerradura.
 */
const SESSION_COOKIE = 'joshop_session_hint';

export function middleware(request: NextRequest) {
  if (!request.cookies.has(SESSION_COOKIE)) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Panel de administración (route group "(management)")
    '/dashboard/:path*',
    '/manage-categories/:path*',
    '/manage-orders/:path*',
    '/manage-products/:path*',
    '/manage-roles/:path*',
    '/manage-stores/:path*',
    '/manage-users/:path*',
    '/admin-chat/:path*',
    '/product-batches/:path*',
    '/settings/:path*',
    // Panel de repartidor (route group "(delivery)")
    '/deliveries/:path*',
    // Rutas de cliente que ya estaban protegidas client-side
    '/checkout/:path*',
    '/my-orders/:path*',
    '/profile/:path*',
    '/favorites/:path*',
    '/tracking/:path*',
  ],
};
