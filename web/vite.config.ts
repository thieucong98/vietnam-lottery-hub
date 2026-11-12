/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { dataBundlesPlugin } from './build/dataBundles'
import { preloadFontsPlugin } from './build/preloadFonts'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Sinh gói dữ liệu gọn theo màn hình từ public/data (xem build/dataBundles.ts)
    dataBundlesPlugin({ dataDir: fileURLToPath(new URL('./public/data', import.meta.url)) }),
    // Font chữ chính (tiếng Việt cần cả subset latin và vietnamese)
    preloadFontsPlugin([/plus-jakarta-sans-(latin|vietnamese)-wght-normal-[\w-]+\.woff2$/]),
  ],
  base: './',
  server: {
    port: 5173,
    host: true
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}', 'build/**/*.test.ts'],
    setupFiles: ['./src/test/setup.ts'],
    css: { modules: { classNameStrategy: 'non-scoped' } },
  },
})
