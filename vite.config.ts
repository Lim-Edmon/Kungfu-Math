/** Kungfu Math — Author: Lim Edmon · Full disclaimer: src/App.tsx */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  },
  build: {
    target: 'es2020',
    // Jangan kirim source map ke production — lebih sulit di-trace dari browser
    sourcemap: false,
    minify: 'esbuild',
    cssMinify: true,
  },
});
