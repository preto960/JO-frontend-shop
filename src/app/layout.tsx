import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { ConfigProvider } from '@/contexts/ConfigContext';

export const metadata: Metadata = {
  title: 'JO-Shop',
  description: 'Tienda en línea JO-Shop',
};

// This script runs BEFORE React hydrates, preventing color flash.
// It reads cached theme from localStorage and sets CSS variables + reveals body.
const themeInitScript = `
(function() {
  try {
    var t = JSON.parse(localStorage.getItem('joshop_theme') || '{}');
    var r = document.documentElement;

    if (t.primary_color) {
      var pc = t.primary_color;
      r.style.setProperty('--primary', pc);
      r.style.setProperty('--primary-hover', pc);
      r.style.setProperty('--primary-light', pc + '1A');
      r.style.setProperty('--primary-gradient', 'linear-gradient(135deg, ' + pc + ' 0%, ' + pc + 'CC 100%)');
      r.style.setProperty('--shadow-accent', '0 4px 14px ' + pc + '4D');
    }

    if (t.accent_color) {
      var ac = t.accent_color;
      r.style.setProperty('--accent', ac);
      r.style.setProperty('--accent-light', ac + '1A');
    }

    if (t.shop_name && t.shop_name !== 'JO-Shop') {
      document.title = t.shop_name;
    }

    // Reveal body — the CSS rule html[data-theme-ready] body { opacity: 1 }
    // takes effect and shows the page with the correct colors already applied.
    r.setAttribute('data-theme-ready', '');
  } catch(e) {
    // Even on error, reveal body so user isn't stuck on blank screen
    document.documentElement.setAttribute('data-theme-ready', '');
  }

  // Safety timeout: force-reveal body after 1.5s in case script or React failed
  setTimeout(function() {
    if (!document.documentElement.hasAttribute('data-theme-ready')) {
      document.documentElement.setAttribute('data-theme-ready', '');
    }
  }, 1500);
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
