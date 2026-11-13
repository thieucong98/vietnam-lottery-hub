import { test, expect } from './fixtures';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Lấy kỳ mới nhất từ dữ liệu thật để test không phụ thuộc ngày chạy
const dataDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../public/data');
const summary = JSON.parse(fs.readFileSync(path.join(dataDir, 'summary.json'), 'utf-8'));
const xsmbDate: string = summary.xsmb_latest.date;
const special = String(summary.xsmb_latest.raw_prizes.special).padStart(5, '0');
const v655 = summary.vietlott_655_latest;
const v655Main: string[] = v655.result.slice(0, 6).map((n: number) => String(n).padStart(2, '0'));

// Vé trùng 2 số cuối Giải Đặc Biệt nhưng khác 3 số đầu: luôn trúng ít nhất Giải Khuyến Khích
const consolationTicket = `${special.startsWith('999') ? '888' : '999'}${special.slice(-2)}`;

test.describe('Tiện ích Phase 3', () => {
  test('6. Dò nhiều vé XSMB theo cơ cấu giải', async ({ page }) => {
    await page.goto(`./#/do-ve?game=xsmb&ngay=${xsmbDate}`);
    await page.getByLabel('Số vé').fill(`${special}\n${consolationTicket}\n1234`);
    await page.getByRole('button', { name: 'Dò vé', exact: true }).click();
    await expect(page.getByTestId('check-summary')).toHaveText(/2 vé, 2 vé trúng giải/);
    await expect(page.getByText(/Giải Đặc Biệt hoặc phụ Đặc Biệt/)).toBeVisible();
    await expect(page.getByText(/Giải Khuyến Khích/).first()).toBeVisible();
    await expect(page.getByText('Không phải vé 5 chữ số')).toBeVisible();
    // URL giữ danh sách vé để chia sẻ hoặc tải lại
    await expect(page).toHaveURL(new RegExp(`ve=${special}\\.${consolationTicket}`));
  });

  test('7. Dò vé Vietlott từ URL, lưu vào Vé của tôi', async ({ page }) => {
    await page.goto(`./#/do-ve?game=655&ngay=${v655.date}&ve=${v655Main.join('-')}`);
    await expect(page.getByTestId('check-summary')).toHaveText(/1 vé, 1 vé trúng giải/);
    await expect(page.getByText(/Jackpot 1 × 1/)).toBeVisible();
    await page.getByRole('button', { name: 'Lưu vào Vé của tôi' }).click();
    await expect(page.getByText(/Đã lưu 1 vé/)).toBeVisible();
    await page.goto('./#/ve-cua-toi');
    await expect(page.getByTestId('saved-ticket')).toHaveCount(1);
  });

  test('8. Vé của tôi: thêm vé, tự dò, nhắc kết quả mới, xuất và nhập JSON', async ({ page }) => {
    await page.goto('./#/ve-cua-toi');
    await page.getByLabel('Loại vé').selectOption('xsmb');
    await page.getByLabel('Ngày quay').fill(xsmbDate);
    await page.getByLabel('Số trên vé').fill(consolationTicket);
    await page.getByRole('button', { name: 'Lưu vé' }).click();
    await expect(page.getByText('Đã lưu vé.')).toBeVisible();
    const saved = page.getByTestId('saved-ticket');
    await expect(saved).toHaveCount(1);
    await expect(saved.getByText(/Giải Khuyến Khích/)).toBeVisible();

    // Xuất JSON
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Xuất file JSON' }).click();
    const download = await downloadPromise;
    const exported = JSON.parse(fs.readFileSync((await download.path())!, 'utf-8'));
    expect(exported.tickets).toHaveLength(1);
    expect(exported.tickets[0]).toMatchObject({ game: 'xsmb', numbers: consolationTicket, drawDate: xsmbDate });

    // Xóa hết rồi nhập lại
    page.once('dialog', (d) => d.accept());
    await page.getByRole('button', { name: 'Xóa toàn bộ vé trên máy này' }).click();
    await expect(saved).toHaveCount(0);
    await page.getByTestId('import-file').setInputFiles({
      name: 've.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(exported)),
    });
    await expect(page.getByText(/Đã nhập 1 vé/)).toBeVisible();
    await expect(saved).toHaveCount(1);
  });

  test('9. Nhắc vé đã lưu có kết quả mới trên trang chủ', async ({ page }) => {
    await page.addInitScript(
      ([date, ticket]) =>
        window.localStorage.setItem(
          'vlh_my_tickets_v1',
          JSON.stringify([{ id: 'e2e', game: 'xsmb', numbers: ticket, drawDate: date, createdAt: '2026-01-01T00:00:00Z' }])
        ),
      [xsmbDate, consolationTicket]
    );
    await page.goto('./');
    const banner = page.getByTestId('ticket-results-banner');
    await expect(banner).toBeVisible();
    await banner.getByRole('button', { name: 'Xem kết quả' }).click();
    await expect(page).toHaveURL(/#\/ve-cua-toi$/);
    await expect(page.getByTestId('saved-ticket')).toHaveCount(1);
  });

  test('10. Lịch quay, tra cứu kỳ và ngân sách', async ({ page }) => {
    await page.goto('./#/lich-quay');
    await expect(page.getByTestId('countdown-xsmb')).toContainText(/\d{2}:\d{2}:\d{2}/);
    await expect(page.getByText('1/28.989.675').first()).toBeVisible();

    await page.goto(`./#/ket-qua/xsmb/${xsmbDate}`);
    await expect(page.getByTestId('xsmb-result')).toContainText(special);
    await page.goto(`./#/ket-qua/655/${v655.id}`);
    await expect(page.getByTestId('vietlott-result')).toBeVisible();

    await page.goto('./#/choi-co-trach-nhiem');
    await page.getByLabel('Ngân sách mỗi tháng (đồng)').fill('100.000');
    await page.getByRole('button', { name: 'Lưu ngân sách' }).click();
    await page.getByLabel('Số tiền (đồng)').fill('90000');
    await page.getByRole('button', { name: 'Ghi khoản chi' }).click();
    await expect(page.getByTestId('budget-summary')).toContainText(/Đã dùng từ 80% ngân sách/);
    await page.getByLabel('Số tiền (đồng)').fill('20000');
    await expect(page.getByText(/sẽ làm vượt ngân sách/)).toBeVisible();
    await page.getByRole('button', { name: 'Ghi khoản chi' }).click();
    await expect(page.getByTestId('budget-summary')).toContainText(/Đã vượt ngân sách/);
    // Dữ liệu còn sau khi tải lại trang (localStorage)
    await page.reload();
    await expect(page.getByTestId('budget-summary')).toContainText(/Đã vượt ngân sách/);
  });
});
