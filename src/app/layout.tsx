import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { ConfigProvider } from '@/contexts/ConfigContext';

export const metadata: Metadata = {
  title: 'JO-Shop',
  description: 'Tienda en línea JO-Shop',
};

// Runs BEFORE React hydrates. Reads cached theme, applies colors to CSS vars
// and the loader overlay. The loader disappears only when ConfigContext fires
// the 'theme-ready' event after fetching the latest config from the API.
const themeInitScript = `
(function() {
  var loader = document.getElementById('theme-loader');
  var r = document.documentElement;
  var shopName = 'JO-Shop';

  // Apply cached colors from previous visit
  try {
    var t = JSON.parse(localStorage.getItem('joshop_theme') || '{}');
    if (t.primary_color) {
      r.style.setProperty('--primary', t.primary_color);
      r.style.setProperty('--primary-hover', t.primary_color);
      r.style.setProperty('--primary-light', t.primary_color + '1A');
      r.style.setProperty('--primary-gradient', 'linear-gradient(135deg, ' + t.primary_color + ' 0%, ' + t.primary_color + 'CC 100%)');
      r.style.setProperty('--shadow-accent', '0 4px 14px ' + t.primary_color + '4D');
    }
    if (t.accent_color) {
      r.style.setProperty('--accent', t.accent_color);
      r.style.setProperty('--accent-light', t.accent_color + '1A');
    }
    if (t.shop_name && t.shop_name !== 'JO-Shop') {
      shopName = t.shop_name;
      document.title = shopName;
    }
  } catch(e) {}

  // Update loader logo text with shop initials
  if (loader) {
    var logoEl = loader.querySelector('.loader-logo');
    if (logoEl) logoEl.textContent = shopName.slice(0, 2).toUpperCase();
  }

  // Dismiss loader when ConfigContext finishes loading from API
  var dismissed = false;
  function reveal() {
    if (dismissed) return;
    dismissed = true;
    window.removeEventListener('theme-ready', reveal);
    r.setAttribute('data-theme-ready', '');
  }

  window.addEventListener('theme-ready', reveal);

  // Safety: force reveal after 4s if something went wrong
  setTimeout(reveal, 4000);
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
        {/* Branded loading screen — visible until page is fully ready */}
        <div id="theme-loader">
          <div className="loader-logo">JO</div>
        </div>

        <AuthProvider>
          <ConfigProvider>
            {children}
          </ConfigProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
