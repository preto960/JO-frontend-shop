import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { ConfigProvider } from '@/contexts/ConfigContext';

export const metadata: Metadata = {
  title: 'JO-Shop',
  description: 'Tienda en línea JO-Shop',
};

// This script runs BEFORE React hydrates, preventing color flash
const themeInitScript = `
(function() {
  try {
    var t = JSON.parse(localStorage.getItem('joshop_theme') || '{}');
    if (t.primary_color || t.accent_color) {
      var r = document.documentElement;
      if (t.primary_color) {
        r.style.setProperty('--primary', t.primary_color);
        r.style.setProperty('--primary-hover', t.primary_color);
        r.style.setProperty('--primary-light', t.primary_color + '1A');
        r.style.setProperty('--primary-gradient', 'linear-gradient(135deg, ' + t.primary_color + ' 0%, ' + t.primary_color + 'CC 100%)');
        r.style.setProperty('--shadow-accent', '0 4px 14px ' + t.primary_color + '4D');
      }
      if (t.accent_color) {
        r.style.setProperty('--accent', t.accent_color);
        r.style.setProperty('--accent-light', t.accent_color);
      }
      if (t.shop_name && t.shop_name !== 'JO-Shop') {
        document.title = t.shop_name;
      }
    }
  } catch(e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <AuthProvider>
          <ConfigProvider>
            {children}
          </ConfigProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
