import {
  checkXsmbLastTwoDigits,
  classifyVietlottTier,
  evaluateVietlottHistory,
  findPairCoOccurrences,
  parseNumberList,
  xsmbPrizeLabel,
} from './ticketCheck';
import type { VietlottHistoricalDraw } from '../types';

describe('classifyVietlottTier', () => {
  it('Power 6/55: bóng đặc biệt chỉ có nghĩa khi trùng đúng 5 bóng chính', () => {
    expect(classifyVietlottTier('vietlott_655', 6, false)).toBe('jackpot1');
    expect(classifyVietlottTier('vietlott_655', 5, true)).toBe('jackpot2');
    expect(classifyVietlottTier('vietlott_655', 5, false)).toBe('prize1');
    expect(classifyVietlottTier('vietlott_655', 4, true)).toBe('prize2');
    expect(classifyVietlottTier('vietlott_655', 3, false)).toBe('prize3');
    expect(classifyVietlottTier('vietlott_655', 2, true)).toBeNull();
  });
  it('Mega 6/45 không có Jackpot 2', () => {
    expect(classifyVietlottTier('vietlott_645', 5, true)).toBe('prize1');
    expect(classifyVietlottTier('vietlott_645', 6, false)).toBe('jackpot1');
  });
});

describe('evaluateVietlottHistory', () => {
  const draws: VietlottHistoricalDraw[] = [
    { id: '3', date: '2026-11-10', balls: [1, 2, 3, 4, 5, 6], special: 7 },
    { id: '2', date: '2026-11-08', balls: [1, 2, 3, 4, 5, 9], special: 6 },
    { id: '1', date: '2026-11-06', balls: [1, 2, 10, 11, 12, 13], special: 14 },
    { id: '0', date: '2026-11-04', balls: [20, 21, 22, 23, 24, 25], special: 1 },
  ];

  it('đếm đúng từng hạng giải với vé đơn 6 số', () => {
    const r = evaluateVietlottHistory('vietlott_655', draws, [1, 2, 3, 4, 5, 6], 3);
    expect(r.counts).toEqual({ jackpot1: 1, jackpot2: 1, prize1: 0, prize2: 0, prize3: 0 });
    expect(r.totalWinningDraws).toBe(2);
    expect(r.matches.map((m) => m.draw.id)).toEqual(['3', '2']);
  });

  it('bộ lọc minMatches tính cả bóng đặc biệt nhưng không tính là trúng giải', () => {
    const r = evaluateVietlottHistory('vietlott_655', draws, [1, 2, 3, 4, 5, 6], 1);
    const last = r.matches.find((m) => m.draw.id === '0')!;
    expect(last.matchedMain).toEqual([]);
    expect(last.matchedSpecial).toBe(true);
    expect(last.tier).toBeNull();
  });

  it('Mega 6/45 bỏ qua bóng đặc biệt', () => {
    const r = evaluateVietlottHistory('vietlott_645', draws, [1, 2, 3, 4, 5, 6], 3);
    expect(r.counts.jackpot2).toBe(0);
    expect(r.counts.prize1).toBe(1);
  });

  it('vé bao: bộ 7 số có thể trùng 6/6', () => {
    const r = evaluateVietlottHistory('vietlott_655', draws, [1, 2, 3, 4, 5, 6, 9], 6);
    expect(r.counts.jackpot1).toBe(2);
  });

  it('dưới 2 số thì không đối chiếu', () => {
    expect(evaluateVietlottHistory('vietlott_655', draws, [1], 1).matches).toEqual([]);
  });
});

describe('parseNumberList', () => {
  it('tách nhiều kiểu phân cách, bỏ trùng và số ngoài khoảng', () => {
    expect(parseNumberList('07, 18 24-35;41|55 07 99', 1, 55)).toEqual([7, 18, 24, 35, 41, 55]);
    expect(parseNumberList('00 5', 1, 45)).toEqual([5]);
    expect(parseNumberList('', 0, 99)).toEqual([]);
  });
});

describe('checkXsmbLastTwoDigits', () => {
  const rawPrizes = { date: '2026-11-11', special: 74129, prize1: 97529, prize7_1: 29, prize7_2: 51 };
  const loto = ['29', '29', '29', '51'];

  it('đối chiếu 2 số cuối với từng giải', () => {
    const r = checkXsmbLastTwoDigits('29', rawPrizes, loto)!;
    expect(r.hits).toBe(3);
    expect(r.isSpecial).toBe(true);
    expect(r.prizes).toEqual(['Giải Đặc Biệt (74129)', 'Giải Nhất (97529)', 'Giải Bảy (29)']);
  });

  it('vé 5 chữ số dùng 2 số cuối; 1 chữ số được thêm 0', () => {
    expect(checkXsmbLastTwoDigits('12351', rawPrizes, loto)!.lastTwo).toBe('51');
    expect(checkXsmbLastTwoDigits('5', rawPrizes, loto)!.lastTwo).toBe('05');
  });

  it('bỏ qua trường date và chuỗi rỗng', () => {
    expect(checkXsmbLastTwoDigits('11', rawPrizes, loto)!.prizes).toEqual([]);
    expect(checkXsmbLastTwoDigits('  ', rawPrizes, loto)).toBeNull();
  });

  it('nhãn giải theo tiền tố khóa', () => {
    expect(xsmbPrizeLabel('prize3_4')).toBe('Giải Ba');
    expect(xsmbPrizeLabel('unknown')).toBe('unknown');
  });
});

describe('findPairCoOccurrences', () => {
  it('chỉ giữ các ngày cả hai số cùng xuất hiện, nhận diện bóng Jackpot 2', () => {
    const h1 = [
      { date: '2026-11-10', prizes: [], hits: 2, result: [1, 2, 3, 4, 5, 6, 7] },
      { date: '2026-11-08', prizes: [], hits: 1 },
    ];
    const h2 = [
      { date: '2026-11-10', prizes: [], hits: 1, result: [1, 2, 3, 4, 5, 6, 7] },
      { date: '2026-11-01', prizes: [], hits: 1 },
    ];
    expect(findPairCoOccurrences(h1, h2, '03', '07')).toEqual([
      { date: '2026-11-10', num1Hits: 2, num2Hits: 1, isSpecial1: false, isSpecial2: true },
    ]);
  });
});
