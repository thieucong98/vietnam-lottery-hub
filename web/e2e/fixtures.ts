import { test as base, expect, Page } from '@playwright/test';

// Khóa của cổng 18+ (web/src/components/AgeGate.tsx)
const AGE_GATE_KEY = 'vlh_age_confirmed_v1';

/** Trang đã xác nhận 18+ để không bị cổng xác nhận che giao diện */
export const test = base.extend<{ page: Page }>({
  page: async ({ page }, use) => {
    await page.addInitScript((key) => window.localStorage.setItem(key, 'yes'), AGE_GATE_KEY);
    await use(page);
  },
});

export { expect };

/** Tổng số byte JSON dữ liệu (./data, ./bundles) trình duyệt đã tải */
export function trackDataBytes(page: Page) {
  const files: { url: string; bytes: number }[] = [];
  page.on('response', async (res) => {
    const url = res.url();
    if (!/\/(data|bundles)\/.+\.json/.test(url)) return;
    try {
      files.push({ url, bytes: (await res.body()).length });
    } catch {
      // body không đọc được (request bị hủy), bỏ qua
    }
  });
  return {
    files,
    total: () => files.reduce((sum, f) => sum + f.bytes, 0),
  };
}
