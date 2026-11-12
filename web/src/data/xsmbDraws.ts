import { XSMBHistoricalDraw } from '../types';

/** Dạng nén do web/build/dataBundles.ts sinh: mỗi kỳ là [date, giải ĐB, giải Nhất, ...] */
export interface CompactXsmbDraws {
  fields: string[];
  draws: (string | number)[][];
}

// Lịch quay XSMB theo thứ trong tuần (Date.getUTCDay: 0 = Chủ Nhật)
const DAY_PROVINCE: Record<number, [string, string]> = {
  0: ['Chủ Nhật', 'Thái Bình'],
  1: ['Thứ Hai', 'Hà Nội'],
  2: ['Thứ Ba', 'Quảng Ninh'],
  3: ['Thứ Tư', 'Bắc Ninh'],
  4: ['Thứ Năm', 'Hà Nội'],
  5: ['Thứ Sáu', 'Hải Phòng'],
  6: ['Thứ Bảy', 'Nam Định'],
};

const pad = (n: number, width: number) => n.toString().padStart(width, '0');

export function dayAndProvince(date: string): [string, string] {
  const day = new Date(`${date}T00:00:00Z`).getUTCDay();
  return DAY_PROVINCE[day] ?? ['', ''];
}

/** Dựng lại đầy đủ một kỳ XSMB (loto, đầu, đuôi) từ 27 giải, giống engine/analytics/index_builder.py */
export function expandXsmbDraw(fields: string[], row: (string | number)[]): XSMBHistoricalDraw {
  const date = String(row[0]);
  const rawPrizes: Record<string, number> = {};
  const lotoValues: number[] = [];
  for (let i = 1; i < fields.length; i++) {
    const value = Number(row[i]);
    rawPrizes[fields[i]] = value;
    lotoValues.push(value % 100);
  }

  const heads: Record<string, number[]> = {};
  const tails: Record<string, number[]> = {};
  for (let d = 0; d < 10; d++) {
    heads[d] = lotoValues.filter((n) => Math.floor(n / 10) === d).map((n) => n % 10).sort((a, b) => a - b);
    tails[d] = lotoValues.filter((n) => n % 10 === d).map((n) => Math.floor(n / 10)).sort((a, b) => a - b);
  }

  const special = pad(rawPrizes.special ?? 0, 5);
  const [dayOfWeek, province] = dayAndProvince(date);
  return {
    date,
    day_of_week: dayOfWeek,
    province,
    special,
    special_2d: special.slice(-2),
    prize1: pad(rawPrizes.prize1 ?? 0, 5),
    raw_prizes: rawPrizes,
    loto_numbers: [...lotoValues].sort((a, b) => a - b).map((n) => pad(n, 2)),
    heads,
    tails,
    silent_heads: Object.keys(heads).filter((k) => heads[k].length === 0).map(Number),
    silent_tails: Object.keys(tails).filter((k) => tails[k].length === 0).map(Number),
  };
}

export function decodeXsmbDraws(raw: unknown): XSMBHistoricalDraw[] {
  const data = raw as CompactXsmbDraws;
  return data.draws.map((row) => expandXsmbDraw(data.fields, row));
}
