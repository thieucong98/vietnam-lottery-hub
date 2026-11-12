/**
 * Shared Lottery Utilities for Vietnam Lottery & Vietlott Hub
 * Eliminates code duplication across SmartFilterAndChecker, VietlottProductHub, and InstantLookupModal.
 */

/**
 * Tính số tổ hợp chập k của n phần tử: C(n, k)
 */
export function calcCombinations(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  let c = 1;
  for (let i = 1; i <= k; i++) {
    c = (c * (n - (k - i))) / i;
  }
  return Math.round(c);
}

/**
 * Định dạng số tiền sang chuẩn Việt Nam Đồng (VND)
 */
export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Chuẩn hóa số bóng thành 2 chữ số (VD: 7 -> '07')
 */
export function formatBallNumber(num: number | string): string {
  const str = String(num).trim();
  return str.padStart(2, '0');
}

/**
 * Tính tiền vốn vé bao Vietlott (Mỗi vé con 6 số = 10.000 VNĐ)
 * - Vé Bao 5 (Bao đảo): (MaxBall - 5) vé con
 * - Vé Bao n (n >= 6): C(n, 6) vé con
 */
export function getVietlottBaoSubTickets(size: number, maxBall: number = 55): number {
  if (size === 5) return maxBall - 5;
  if (size >= 6) return calcCombinations(size, 6);
  return 1;
}

export function getVietlottBaoCost(size: number, maxBall: number = 55): number {
  return getVietlottBaoSubTickets(size, maxBall) * 10_000;
}

/**
 * Giá trị kỳ vọng của 1 vé đơn 10.000đ (Power 6/55 hoặc Mega 6/45).
 * Tính chính xác theo tổ hợp từng cấp giải, Jackpot lấy ở mức khởi điểm
 * (30 tỷ / 12 tỷ), chưa trừ thuế TNCN và chưa tính trường hợp chia Jackpot,
 * nên giá trị thực tế còn thấp hơn.
 */
export function getVietlottTicketExpectedValue(is655: boolean): {
  ticketPrice: number;
  expectedPrize: number;
  expectedValue: number;
  totalCombinations: number;
} {
  const maxBall = is655 ? 55 : 45;
  const ticketPrice = 10_000;
  const totalCombinations = calcCombinations(maxBall, 6);
  const others = maxBall - 6;
  const ways = (k: number) => calcCombinations(6, k) * calcCombinations(others, 6 - k);

  let expectedSum: number;
  if (is655) {
    // Trùng 5 số: 1/49 khả năng số thứ 6 của vé trùng bóng đặc biệt (Jackpot 2)
    const jackpot2Ways = ways(5) / others;
    expectedSum =
      30_000_000_000 * ways(6) +
      3_000_000_000 * jackpot2Ways +
      40_000_000 * (ways(5) - jackpot2Ways) +
      500_000 * ways(4) +
      50_000 * ways(3);
  } else {
    expectedSum =
      12_000_000_000 * ways(6) +
      10_000_000 * ways(5) +
      300_000 * ways(4) +
      30_000 * ways(3);
  }

  const expectedPrize = expectedSum / totalCombinations;
  return {
    ticketPrice,
    expectedPrize,
    expectedValue: expectedPrize - ticketPrice,
    totalCombinations,
  };
}
