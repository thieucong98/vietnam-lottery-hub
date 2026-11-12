import { dayAndProvince, decodeXsmbDraws, expandXsmbDraw } from './xsmbDraws';
import { compactXsmbDraws, XSMB_PRIZE_FIELDS } from '../../build/dataBundles';

const raw = Object.fromEntries(XSMB_PRIZE_FIELDS.map((f, i) => [f, 10000 + i * 37]));
raw.special = 74129;
raw.prize1 = 97579;

describe('expandXsmbDraw', () => {
  const draw = expandXsmbDraw(['date', ...XSMB_PRIZE_FIELDS], ['2026-11-11', ...XSMB_PRIZE_FIELDS.map((f) => raw[f])]);

  it('dựng lại giải ĐB, giải Nhất và 27 số loto đã sắp xếp', () => {
    expect(draw.special).toBe('74129');
    expect(draw.special_2d).toBe('29');
    expect(draw.prize1).toBe('97579');
    expect(draw.loto_numbers).toHaveLength(27);
    expect([...draw.loto_numbers].sort()).toEqual(draw.loto_numbers);
  });

  it('đầu/đuôi khớp với loto (cùng thuật toán engine/analytics/index_builder.py)', () => {
    const fromHeads = Object.entries(draw.heads).flatMap(([h, tails]) => tails.map((t) => `${h}${t}`));
    expect(fromHeads.sort()).toEqual(draw.loto_numbers);
    const fromTails = Object.entries(draw.tails).flatMap(([t, heads]) => heads.map((h) => `${h}${t}`));
    expect(fromTails.sort()).toEqual(draw.loto_numbers);
  });

  it('số câm là đầu/đuôi không có số nào', () => {
    for (const h of draw.silent_heads) expect(draw.heads[h]).toEqual([]);
    for (const t of draw.silent_tails) expect(draw.tails[t]).toEqual([]);
  });
});

it('thứ và đài quay theo lịch XSMB', () => {
  expect(dayAndProvince('2026-11-11')).toEqual(['Thứ Tư', 'Bắc Ninh']);
  expect(dayAndProvince('2026-11-15')).toEqual(['Chủ Nhật', 'Thái Bình']);
});

it('nén ở build rồi giải nén ở client giữ nguyên dữ liệu', () => {
  const compact = compactXsmbDraws([{ date: '2026-11-11', raw_prizes: raw }]);
  const [decoded] = decodeXsmbDraws(compact);
  expect(decoded.date).toBe('2026-11-11');
  expect(decoded.raw_prizes).toEqual(raw);
});
