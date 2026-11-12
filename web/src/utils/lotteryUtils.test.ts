import { calcCombinations, formatBallNumber, getVietlottBaoCost, getVietlottBaoSubTickets, getVietlottTicketExpectedValue } from './lotteryUtils';

describe('calcCombinations', () => {
  it('tính đúng tổ hợp chuẩn', () => {
    expect(calcCombinations(55, 6)).toBe(28_989_675);
    expect(calcCombinations(45, 6)).toBe(8_145_060);
    expect(calcCombinations(7, 6)).toBe(7);
    expect(calcCombinations(18, 6)).toBe(18_564);
  });
  it('trả 0 khi k ngoài khoảng và 1 ở biên', () => {
    expect(calcCombinations(5, 6)).toBe(0);
    expect(calcCombinations(5, -1)).toBe(0);
    expect(calcCombinations(6, 0)).toBe(1);
    expect(calcCombinations(6, 6)).toBe(1);
  });
});

describe('vé bao Vietlott', () => {
  it('bao 5 là bao đảo (maxBall - 5 vé con)', () => {
    expect(getVietlottBaoSubTickets(5, 55)).toBe(50);
    expect(getVietlottBaoSubTickets(5, 45)).toBe(40);
  });
  it('bao n >= 6 có C(n, 6) vé con, mỗi vé 10.000đ', () => {
    expect(getVietlottBaoSubTickets(6)).toBe(1);
    expect(getVietlottBaoCost(7)).toBe(70_000);
    expect(getVietlottBaoCost(10)).toBe(2_100_000);
  });
});

describe('getVietlottTicketExpectedValue', () => {
  it('giá trị kỳ vọng mỗi vé luôn âm', () => {
    for (const is655 of [true, false]) {
      const ev = getVietlottTicketExpectedValue(is655);
      expect(ev.ticketPrice).toBe(10_000);
      expect(ev.expectedValue).toBeLessThan(0);
      expect(ev.expectedPrize).toBeGreaterThan(0);
    }
  });
  it('dùng đúng tổng số tổ hợp (xác suất Jackpot thật)', () => {
    expect(getVietlottTicketExpectedValue(true).totalCombinations).toBe(28_989_675);
    expect(getVietlottTicketExpectedValue(false).totalCombinations).toBe(8_145_060);
  });
});

it('formatBallNumber chuẩn hóa 2 chữ số', () => {
  expect(formatBallNumber(7)).toBe('07');
  expect(formatBallNumber(' 68 ')).toBe('68');
});
