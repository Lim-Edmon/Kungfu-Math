import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // biar bisa diakses dari HP di jaringan yang sama
    port: 5173,
  },
  build: {
    // Target modern browser (cukup untuk PWA)
    target: 'es2020',
  },
});
