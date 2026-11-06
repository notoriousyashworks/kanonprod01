import { defineConfig, loadEnv } from 'vite';
import { resolve, basename } from 'path';
import { existsSync } from 'fs';
import { navbarHTML, footerHTML } from './src/js/shared/templates.js';
import { fillRegion } from './ssr/render.js';

function cleanUrlPlugin() {
  return {
    name: 'clean-urls',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url.includes('.') && req.url !== '/' && !req.url.startsWith('/api') && !req.url.startsWith('/@') && !req.url.startsWith('/src/')) {
          const url = new URL(req.url, `http://${req.headers.host}`);
          const page = existsSync(resolve(__dirname, `.${url.pathname}.html`)) ? url.pathname : '/404';
          req.url = req.url.replace(url.pathname, page + '.html');
        }
        next();
      });
    }
  };
}

// Bakes the shared navbar/footer markup into every page's <!--ssr:navbar--> /
// <!--ssr:footer--> regions at build time, so internal links are present in the
// static HTML even without JS (and even if the SSR process is unavailable).
// The page scripts still replace these containers exactly as before.
const NAV_ACTIVE_PAGE = {
  'index.html': 'home',
  'products.html': 'products',
  'product-details.html': 'product',
  'orders.html': 'home',
  'profile.html': 'home',
};
function staticShellPlugin(whatsappNumber) {
  return {
    name: 'ka-static-shell',
    transformIndexHtml(html, ctx) {
      const file = basename(ctx.filename || ctx.path || '');
      let out = fillRegion(html, 'navbar', navbarHTML(NAV_ACTIVE_PAGE[file] || 'policy'));
      out = fillRegion(out, 'footer', footerHTML({ whatsappNumber }));
      return out;
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const whatsappNumber = process.env.VITE_WHATSAPP_NUMBER || env.VITE_WHATSAPP_NUMBER;
  return {
    plugins: [cleanUrlPlugin(), staticShellPlugin(whatsappNumber)],
    root: '.',
    publicDir: 'public',
    build: {
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
          products: resolve(__dirname, 'products.html'),
          checkout: resolve(__dirname, 'checkout.html'),
          productDetails: resolve(__dirname, 'product-details.html'),
          shippingPolicy: resolve(__dirname, 'shipping-policy.html'),
          returnExchange: resolve(__dirname, 'return-exchange.html'),
          termsConditions: resolve(__dirname, 'terms-conditions.html'),
          privacyPolicy: resolve(__dirname, 'privacy-policy.html'),
          aboutUs: resolve(__dirname, 'about-us.html'),
          orders: resolve(__dirname, 'orders.html'),
          profile: resolve(__dirname, 'profile.html'),
          refundPolicy: resolve(__dirname, 'refund-policy.html'),
          notFound: resolve(__dirname, '404.html'),
        },
      },
    },
    server: {
      port: 5173,
      fs: {
        allow: ['..'],
      },
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:8080',
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
