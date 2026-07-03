import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // Aapka frontend ka port (jo bhi default chal raha ho)
    proxy: {
      // 🚀 THE PROXY BRIDGE CAPSULED LOCK
      // Jab bhi frontend par trigger hone wali fetch request '/api' se shuru hogi...
      '/api': {
        target: 'http://localhost:5000', // Yeh use automatically backend node par bypass karega
        changeOrigin: true,             // Isse cross-origin resource block (CORS) strictly bypass ho jata hai
        secure: false,                  // SSL verification security disable (local development ke liye safe hai)
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('❌ [PROXY_CRITICAL_ERROR]: Proxy connection mapping failure ->', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('📡 [PROXY_STREAM]: Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('💾 [PROXY_RESPONSE]: Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        },
      },
    },
  },
});