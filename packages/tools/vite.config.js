import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/',

  root: 'public',

  // No publicDir — static assets (manifest.json, sw.js) are copied by the build script
  publicDir: false,

  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      // Own manifest.json already exists in public/ — do not generate a second
      manifest: false,
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
      },
    }),
  ],

  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        // Preserve exact filenames — service worker depends on stable URLs
        entryFileNames: 'app.js',
        assetFileNames: (assetInfo) => {
          // SVG icon files go into icons/ to match the manifest and HTML references
          if (assetInfo.name?.endsWith('.svg')) return 'icons/[name][extname]';
          return '[name][extname]';
        },
      },
    },
  },
})
