import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath, URL } from 'url';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // We own public/manifest.json — do not generate a second one
      manifest: false,
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
      },
    }),
  ],
  resolve: {
    alias: {
      // Maps @homeschool/shared → packages/shared/src so imports resolve
      // without running npm install (workspace symlink not required in dev)
      '@homeschool/shared': fileURLToPath(
        new URL('../shared/src', import.meta.url)
      ),
    },
  },
  build: {
    outDir: '../../dist',
  },
});
