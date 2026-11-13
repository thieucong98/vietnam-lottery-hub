/**
 * Đăng ký service worker (xem vite.config.ts cấu hình VitePWA). Chỉ hoạt động trên
 * bản build production; trong dev, trình duyệt không có service worker nên bỏ qua.
 */
export function registerPwa() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  import('virtual:pwa-register')
    .then(({ registerSW }) => registerSW({ immediate: true }))
    .catch(() => {
      // Môi trường không hỗ trợ (ví dụ preview không qua build PWA): bỏ qua, ứng dụng vẫn chạy online
    });
}
