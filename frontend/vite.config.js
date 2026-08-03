import { defineConfig } from 'vite';
import { resolve } from 'path';

function cleanUrlPlugin() {
  return {
    name: 'clean-urls',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url.includes('.') && req.url !== '/' && !req.url.startsWith('/api')) {
          const url = new URL(req.url, `http://${req.headers.host}`);
          req.url = req.url.replace(url.pathname, url.pathname + '.html');
        }
        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [cleanUrlPlugin()],
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
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
