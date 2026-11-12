import { checkXsmbTicket, parseXsmbTickets, XSMB_TIERS } from './xsmbTicket';

// Kỳ 2026-11-11 (web/public/data/summary.json), số nguyên đã mất số 0 đầu: prize3_5 = 972 là "00972"
const DRAW = {
  date: '2026-11-11',
  special: 74129,
  prize1: 97579,
  prize2_1: 20960,
  prize2_2: 11980,
  prize3_1: 13449,
  prize3_2: 30793,
  prize3_3: 18746,
  prize3_4: 86606,
  prize3_5: 972,
  prize3_6: 26471,
  prize4_1: 1760,
  prize4_2: 9505,
  prize4_3: 3676,
  prize4_4: 7568,
  prize5_1: 1494,
  prize5_2: 1478,
  prize5_3: 5404,
  prize5_4: 5724,
  prize5_5: 9888,
  prize5_6: 5597,
  prize6_1: 714,
  prize6_2: 93,
  prize6_3: 910,
  prize7_1: 51,
  prize7_2: 34,
  prize7_3: 12,
  prize7_4: 95,
};

const tiers = (ticket: string) => checkXsmbTicket(ticket, DRAW).wins.map((w) => w.tier);

describe('checkXsmbTicket', () => {
  it('trùng 5 số Giải Đặc Biệt: báo cần đối chiếu ký hiệu, không cộng thêm giải khuyến khích', () => {
    const r = checkXsmbTicket('74129', DRAW);
    expect(r.wins).toHaveLength(1);
    expect(r.wins[0]).toMatchObject({ tier: 'special', needsSeriesCheck: true, value: 25_000_000 });
  });

  it('giải khuyến khích khi trùng 2 số cuối Giải Đặc Biệt', () => {
    expect(tiers('11129')).toEqual(['consolation']);
  });

  it('giải 5 số giữ đúng số 0 đầu', () => {
    expect(tiers('00972')).toEqual(['prize3']);
    expect(tiers('10972')).toEqual([]);
    expect(tiers('97579')).toEqual(['prize1']);
    expect(tiers('11980')).toEqual(['prize2']);
  });

  it('giải theo số cuối: Tư/Năm 4 số, Sáu 3 số, Bảy 2 số', () => {
    expect(tiers('31760')).toEqual(['prize4']);
    expect(tiers('81494')).toEqual(['prize5']);
    expect(tiers('12093')).toEqual(['prize6']); // prize6_2 = 93 là "093"
    expect(tiers('12393')).toEqual([]);
    expect(tiers('99934')).toEqual(['prize7']);
  });

  it('một vé trúng nhiều giải được tính đủ, sắp theo thứ tự giải', () => {
    // 12 là Giải Bảy; 910 là Giải Sáu; vé 00910 không trùng giải 5 số nào
    const r = checkXsmbTicket('55910', DRAW);
    expect(r.wins.map((w) => w.tier)).toEqual(['prize6']);
    const multi = checkXsmbTicket('41494', { ...DRAW, prize7_1: 94 });
    expect(multi.wins.map((w) => w.tier)).toEqual(['prize5', 'prize7']);
    expect(multi.minTotal).toBe(200_000 + 40_000);
  });

  it('vé không trúng', () => {
    expect(checkXsmbTicket('00000', DRAW).wins).toEqual([]);
  });

  it('từ chối vé không đủ 5 chữ số', () => {
    expect(() => checkXsmbTicket('1234', DRAW)).toThrow();
  });

  it('cơ cấu giải đủ 9 hạng', () => {
    expect(XSMB_TIERS.map((t) => t.tier)).toHaveLength(9);
  });
});

describe('parseXsmbTickets', () => {
  it('tách vé, bỏ trùng, báo chuỗi sai', () => {
    const r = parseXsmbTickets('74129, 00972\n74129 1234 abcde 55910');
    expect(r.tickets).toEqual(['74129', '00972', '55910']);
    expect(r.duplicates).toBe(1);
    expect(r.invalid).toEqual(['1234', 'abcde']);
  });
  it('giới hạn số vé', () => {
    const text = Array.from({ length: 60 }, (_, i) => String(10000 + i)).join(' ');
    expect(parseXsmbTickets(text, 50).tickets).toHaveLength(50);
  });
});
