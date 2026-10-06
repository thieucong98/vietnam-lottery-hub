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
