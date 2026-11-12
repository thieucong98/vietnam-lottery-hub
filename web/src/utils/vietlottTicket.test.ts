import {
  checkVietlottTicket,
  parseVietlottTicket,
  parseVietlottTickets,
  subTicketCount,
  subTickets,
} from './vietlottTicket';

// Kỳ 01422 Power 6/55 (2026-11-10): 01 02 21 38 39 51, bóng đặc biệt 12
const DRAW_655 = { balls: [1, 2, 21, 38, 39, 51], special: 12 };
const DRAW_645 = { balls: [3, 11, 14, 23, 25, 43] };

describe('parseVietlottTicket', () => {
  it('chuẩn hóa, sắp xếp', () => {
    expect(parseVietlottTicket('51 1, 2-21 38 39', 'vietlott_655')).toEqual({ balls: [1, 2, 21, 38, 39, 51] });
  });
  it('báo lỗi số ngoài khoảng, trùng, sai số lượng', () => {
    expect(parseVietlottTicket('1 2 3 4 5 46', 'vietlott_645').error).toMatch(/ngoài khoảng/);
    expect(parseVietlottTicket('1 2 3 4 5 5', 'vietlott_655').error).toMatch(/trùng/);
    expect(parseVietlottTicket('1 2 3 4', 'vietlott_655').error).toMatch(/đang có 4 số/);
    expect(parseVietlottTicket(Array.from({ length: 19 }, (_, i) => i + 1).join(' '), 'vietlott_655').error).toBeTruthy();
  });
  it('nhiều vé, mỗi dòng một vé', () => {
    const r = parseVietlottTickets('1 2 3 4 5 6\n7 8 9 10 11 12 13; 1 2', 'vietlott_655');
    expect(r.map((t) => t.balls.length)).toEqual([6, 7, 0]);
  });
});

describe('subTickets', () => {
  it('số vé con của vé bao', () => {
    expect(subTicketCount(6, 55)).toBe(1);
    expect(subTicketCount(7, 55)).toBe(7);
    expect(subTicketCount(18, 55)).toBe(18564);
    expect(subTicketCount(5, 55)).toBe(50);
    expect(subTicketCount(5, 45)).toBe(40);
    expect(Array.from(subTickets([1, 2, 3, 4, 5, 6, 7, 8], 55))).toHaveLength(28);
    expect(Array.from(subTickets([1, 2, 3, 4, 5], 45))).toHaveLength(40);
  });
});

describe('checkVietlottTicket', () => {
  it('vé 6 số trùng 6 bóng: Jackpot 1', () => {
    const r = checkVietlottTicket('vietlott_655', [1, 2, 21, 38, 39, 51], DRAW_655);
    expect(r.counts.jackpot1).toBe(1);
    expect(r.jackpotWins).toBe(1);
    expect(r.cost).toBe(10_000);
  });

  it('Power 6/55: 5 bóng chính + bóng đặc biệt là Jackpot 2', () => {
    const r = checkVietlottTicket('vietlott_655', [1, 2, 12, 21, 38, 39], DRAW_655);
    expect(r.counts).toEqual({ jackpot1: 0, jackpot2: 1, prize1: 0, prize2: 0, prize3: 0 });
    expect(r.matchedSpecial).toBe(true);
  });

  it('Mega 6/45 không có Jackpot 2', () => {
    const r = checkVietlottTicket('vietlott_645', [3, 11, 14, 23, 25, 44], DRAW_645);
    expect(r.counts.prize1).toBe(1);
    expect(r.fixedPrizeTotal).toBe(10_000_000);
  });

  it('vé bao 7 trùng 6 bóng: 1 Jackpot 1 và 6 Giải Nhất', () => {
    // Bao 7 gồm 6 số trúng + số 40: 1 vé con trùng 6, 6 vé con trùng 5 (số 40 thay một số trúng)
    const r = checkVietlottTicket('vietlott_655', [1, 2, 21, 38, 39, 40, 51], DRAW_655);
    expect(r.subTickets).toBe(7);
    expect(r.counts).toEqual({ jackpot1: 1, jackpot2: 0, prize1: 6, prize2: 0, prize3: 0 });
    expect(r.fixedPrizeTotal).toBe(6 * 40_000_000);
  });

  it('vé bao 7 có bóng đặc biệt: vé con 5 bóng chính + bóng đặc biệt là Jackpot 2', () => {
    // 5 số chính trúng (1 2 21 38 39) + 12 (đặc biệt) + 40
    const r = checkVietlottTicket('vietlott_655', [1, 2, 12, 21, 38, 39, 40], DRAW_655);
    // Vé con có 5 số chính: {5 số} + 12 (Jackpot 2), {5 số} + 40 (Giải Nhất)
    // Vé con có 4 số chính: C(5,4) * C(2,2) = 5 vé (Giải Nhì)
    expect(r.counts).toEqual({ jackpot1: 0, jackpot2: 1, prize1: 1, prize2: 5, prize3: 0 });
  });

  it('vé bao 5 trùng 5 bóng chính (Mega 6/45)', () => {
    // Ghép với số trúng còn lại (43): Jackpot 1; ghép với 39 số khác: Giải Nhất
    const r = checkVietlottTicket('vietlott_645', [3, 11, 14, 23, 25], DRAW_645);
    expect(r.subTickets).toBe(40);
    expect(r.counts).toEqual({ jackpot1: 1, jackpot2: 0, prize1: 39, prize2: 0, prize3: 0 });
    expect(r.cost).toBe(400_000);
  });

  it('vé không trúng', () => {
    const r = checkVietlottTicket('vietlott_655', [3, 4, 5, 6, 7, 8], DRAW_655);
    expect(r.jackpotWins + r.fixedPrizeTotal).toBe(0);
  });
});
