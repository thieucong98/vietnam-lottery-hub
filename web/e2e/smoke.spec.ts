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

  test('6. Phân tích minh bạch, phòng thí nghiệm và thống kê có điều kiện hiển thị cỡ mẫu', async ({ page }) => {
    await page.goto('./#/phan-tich');
    await expect(page.getByRole('heading', { name: 'Phân Tích Minh Bạch' })).toBeVisible();
    await expect(page.getByText(/nằm trong dao động ngẫu nhiên/).first()).toBeVisible();
    await expect(page.getByText('Cỡ mẫu:').first()).toBeVisible();

    await page.goto('./#/thuat-toan');
    await expect(page.getByRole('heading', { name: 'Phòng Thí Nghiệm Xác Suất' })).toBeVisible();
    await expect(page.getByText(/p-value so với ngẫu nhiên/)).toBeVisible();

    await page.goto('./#/bac-nho');
    await expect(page.getByRole('heading', { name: /Thống Kê Có Điều Kiện/ })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Tần suất nền' })).toBeVisible();
  });

  test('7. Quick Pick ngẫu nhiên có tùy chọn ghi rõ không làm tăng xác suất trúng', async ({ page }) => {
    await page.goto('./#/vietlott/645');
    await expect(page.getByText('không làm tăng xác suất trúng').first()).toBeVisible();
    await page.getByLabel('Số lượng số chẵn').selectOption('3');
    await page.getByRole('button', { name: 'Chọn ngẫu nhiên' }).click();
    // Dòng tóm tắt dưới bộ số (khác với <option> cùng nội dung trong ô chọn)
    await expect(page.locator('strong', { hasText: '3 chẵn - 3 lẻ' })).toBeVisible();
    await expect(page.getByText(/Gợi ý tránh chia giải/)).toBeVisible();
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
