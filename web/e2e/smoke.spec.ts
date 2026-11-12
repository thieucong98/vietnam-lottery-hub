import { test, expect, trackDataBytes } from './fixtures';

// 5 luồng chính: xem kết quả XSMB, tra cứu một số, dò bộ số Vietlott, lọc vé, điều hướng bằng URL
test.describe('Luồng chính', () => {
  test('1. Trang chủ hiển thị kết quả XSMB mới nhất và chỉ tải dữ liệu nhẹ', async ({ page }) => {
    const data = trackDataBytes(page);
    await page.goto('./');
    await expect(page.locator('#xsmb-live-results')).toBeVisible();
    await page.waitForLoadState('networkidle');
    const kb = (await data.total()) / 1024;
    console.log(`Dữ liệu tải lúc mở trang: ${kb.toFixed(1)} KB`, data.files.map((f) => f.url.split('/').slice(-2).join('/')));
    expect(kb).toBeLessThan(100);
  });

  test('2. Tra cứu một số qua URL /#/so/68 và đóng bằng Esc', async ({ page }) => {
    await page.goto('./#/so/68');
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('Số 68', { exact: true })).toBeVisible();
    await expect(dialog.getByText('Tổng số lần đã về')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(page).toHaveURL(/#\/$/);
  });

  test('3. Dò bộ số Vietlott 6/55 với lịch sử kỳ quay', async ({ page }) => {
    await page.goto('./#/vietlott/655/bo-so?so=03-11-16-22-35-41');
    await expect(page.getByText(/Bộ Số & Vé Bao \(6 bóng\)/)).toBeVisible();
    await expect(page.getByText(/Kho Lịch Sử \([1-9]\d* kỳ\)/)).toBeVisible();
  });

  test('4. Tạo vé ngẫu nhiên có điều kiện ở màn hình Lọc vé', async ({ page }) => {
    await page.goto('./#/loc-ve');
    await expect(page.getByText('Không làm tăng xác suất trúng', { exact: false }).first()).toBeVisible();
    await page.getByRole('button', { name: /Chuẩn Bộ Lọc/ }).first().click();
    await expect(page.getByText(/Vé #1/).first()).toBeVisible();
  });

  test('5. Mỗi màn hình có URL riêng, nút back hoạt động', async ({ page, isMobile }) => {
    await page.goto('./');
    await expect(page.locator('#xsmb-live-results')).toBeVisible();
    if (isMobile) {
      await page.locator('.mobile-bottom-bar').getByTitle(/Keno/).click();
    } else {
      await page.getByRole('navigation').getByRole('button', { name: /Keno & 3D/ }).click();
    }
    await expect(page).toHaveURL(/#\/keno-3d$/);
    await page.goto('./#/nhiet');
    await expect(page.locator('.heatmap-grid')).toBeVisible();
    await page.goBack();
    await expect(page).toHaveURL(/#\/keno-3d$/);
    await page.goto('./#/xsmb/2026-01-01');
    await expect(page.locator('#xsmb-live-results')).toBeVisible();
  });
});
