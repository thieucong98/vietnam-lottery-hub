/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
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
    // PWA: "Thêm vào màn hình chính", cache kết quả gần nhất để xem offline
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: null,
      manifest: {
        id: '/vietnam-lottery-hub/',
        name: 'Xổ Số & Vietlott Analytics Hub',
        short_name: 'XS & Vietlott Hub',
        description: 'Tra cứu kết quả XSMB, Vietlott Power 6/55, Mega 6/45 và thống kê mô tả dữ liệu lịch sử.',
        lang: 'vi',
        start_url: './',
        scope: './',
        display: 'standalone',
        background_color: '#080c14',
        theme_color: '#080c14',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Chỉ các file build (JS/CSS/font/HTML) được precache; data/bundles cache lúc chạy (luôn ưu tiên bản mới nhất).
        globPatterns: ['**/*.{js,css,html,woff2}'],
        navigateFallbackDenylist: [/^\/data\//, /^\/bundles\//],
        runtimeCaching: [
          {
            // Kết quả mới nhất & gói dữ liệu theo màn hình: có mạng thì luôn lấy bản mới,
            // mất mạng thì dùng bản cache lần gần nhất để xem offline.
            urlPattern: ({ url }) => url.pathname.includes('/data/') || url.pathname.includes('/bundles/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'vlh-data-v1',
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 14 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
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
