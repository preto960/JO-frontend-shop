import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { PusherProvider } from '@/contexts/PusherContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { ConfigProvider } from '@/contexts/ConfigContext';
import PageTitle from '@/components/PageTitle';
import GlobalPusherListener from '@/components/GlobalPusherListener';

export const metadata: Metadata = {
  title: 'JO-Shop',
  description: 'Tienda en línea JO-Shop',
  icons: {
    icon: '/api/favicon',
  },
};

// Runs BEFORE React hydrates. Reads cached theme, applies colors to CSS vars
// and the loader overlay. If a loader image URL was saved, it replaces the
// text-initials fallback. The loader disappears only when ConfigContext fires
// the 'theme-ready' event after fetching the latest config from the API.
const themeInitScript = `
(function() {
  var loader = document.getElementById('theme-loader');
  var r = document.documentElement;
  var shopName = 'JO-Shop';
  var loaderUrl = '';

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
    if (t.shop_loader_url) {
      loaderUrl = t.shop_loader_url;
    }
  } catch(e) {}

  // Update loader: show image if available, otherwise show initials
  if (loader) {
    if (loaderUrl) {
      var logoEl = loader.querySelector('.loader-logo');
      if (logoEl) {
        logoEl.textContent = '';
        logoEl.style.backgroundImage = 'url(' + loaderUrl + ')';
        logoEl.style.backgroundSize = 'contain';
        logoEl.style.backgroundRepeat = 'no-repeat';
        logoEl.style.backgroundPosition = 'center';
        logoEl.classList.add('loader-has-image');
      }
    } else {
      var logoEl = loader.querySelector('.loader-logo');
      if (logoEl) logoEl.textContent = shopName.slice(0, 2).toUpperCase();
    }
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
        <link rel="icon" href="/api/favicon" type="image/png" />
      </head>
      <body>
        {/* Branded loading screen — visible until page is fully ready */}
        <div id="theme-loader">
          <div className="loader-logo">JO</div>
        </div>

        <AuthProvider>
          <PusherProvider>
            <NotificationProvider>
              <ConfigProvider>
                <GlobalPusherListener />
                <PageTitle />
                {children}
              </ConfigProvider>
            </NotificationProvider>
          </PusherProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
