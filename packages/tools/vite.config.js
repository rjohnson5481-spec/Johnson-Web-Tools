import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'url'
import { resolve } from 'path'

export default defineConfig({
  base: '/',

  plugins: [react()],

  resolve: {
    alias: {
      '@johnson-web-tools/shared': fileURLToPath(
        new URL('../shared/src', import.meta.url)
      ),
    },
  },

  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main:         resolve(__dirname, 'index.html'),
        teExtractor:  resolve(__dirname, 'te-extractor/index.html'),
      },
    },
  },
})
