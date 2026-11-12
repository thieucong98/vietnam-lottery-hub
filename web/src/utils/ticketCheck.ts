/**
 * Logic dò vé dùng chung (không phụ thuộc React), có test trong ticketCheck.test.ts.
 * Chỉ đối chiếu với kết quả đã công bố; không đánh giá hay gợi ý khả năng trúng.
 */
import { NumberAppearance, VietlottHistoricalDraw } from '../types';
import { formatBallNumber } from './lotteryUtils';

export type VietlottGameId = 'vietlott_655' | 'vietlott_645';
export type VietlottPrizeTier = 'jackpot1' | 'jackpot2' | 'prize1' | 'prize2' | 'prize3';

/** Giá trị giải theo cơ cấu Vietlott (Jackpot lấy mức khởi điểm) */
export const VIETLOTT_PRIZE_VALUES: Record<VietlottGameId, Record<VietlottPrizeTier, number>> = {
  vietlott_655: {
    jackpot1: 30_000_000_000,
    jackpot2: 3_000_000_000,
    prize1: 40_000_000,
    prize2: 500_000,
    prize3: 50_000,
  },
  vietlott_645: {
    jackpot1: 12_000_000_000,
    jackpot2: 0,
    prize1: 10_000_000,
    prize2: 300_000,
    prize3: 30_000,
  },
};

/**
 * Hạng giải của một vé theo số bóng chính trùng và bóng đặc biệt.
 * Bóng đặc biệt chỉ có ở Power 6/55 và chỉ có nghĩa khi trùng đúng 5 bóng chính.
 */
export function classifyVietlottTier(
  game: VietlottGameId,
  mainMatches: number,
  matchedSpecial: boolean
): VietlottPrizeTier | null {
  if (mainMatches >= 6) return 'jackpot1';
  if (game === 'vietlott_655' && mainMatches === 5 && matchedSpecial) return 'jackpot2';
  if (mainMatches === 5) return 'prize1';
  if (mainMatches === 4) return 'prize2';
  if (mainMatches === 3) return 'prize3';
  return null;
}

export interface VietlottDrawMatch {
  draw: VietlottHistoricalDraw;
  matchedMain: number[];
  matchedSpecial: boolean;
  tier: VietlottPrizeTier | null;
}

export function matchVietlottDraw(game: VietlottGameId, draw: VietlottHistoricalDraw, picks: Set<number>): VietlottDrawMatch {
  const matchedMain = draw.balls.filter((b) => picks.has(b));
  const matchedSpecial = game === 'vietlott_655' && draw.special != null && picks.has(draw.special);
  return { draw, matchedMain, matchedSpecial, tier: classifyVietlottTier(game, matchedMain.length, matchedSpecial) };
}

export interface VietlottHistoryEvaluation {
  counts: Record<VietlottPrizeTier, number>;
  totalWinningDraws: number;
  /** Các kỳ có tổng số trùng (gồm bóng đặc biệt) >= minMatches, theo thứ tự đầu vào */
  matches: VietlottDrawMatch[];
}

/** Đối chiếu một bộ số (vé đơn hoặc vé bao) với toàn bộ lịch sử kỳ quay. */
export function evaluateVietlottHistory(
  game: VietlottGameId,
  draws: VietlottHistoricalDraw[],
  picks: number[],
  minMatches: number
): VietlottHistoryEvaluation {
  const counts: Record<VietlottPrizeTier, number> = { jackpot1: 0, jackpot2: 0, prize1: 0, prize2: 0, prize3: 0 };
  const matches: VietlottDrawMatch[] = [];
  if (picks.length < 2) return { counts, totalWinningDraws: 0, matches };

  const pickSet = new Set(picks);
  let totalWinningDraws = 0;
  for (const draw of draws) {
    const m = matchVietlottDraw(game, draw, pickSet);
    if (m.tier) {
      counts[m.tier]++;
      totalWinningDraws++;
    }
    if (m.matchedMain.length + (m.matchedSpecial ? 1 : 0) >= minMatches) matches.push(m);
  }
  return { counts, totalWinningDraws, matches };
}

/** Tách chuỗi người dùng nhập ("07, 18 24-35") thành các số nguyên trong khoảng [min, max], bỏ trùng. */
export function parseNumberList(text: string, min: number, max: number): number[] {
  const parsed = text
    .trim()
    .split(/[\s,;.|-]+/)
    .filter(Boolean)
    .map((t) => parseInt(t, 10))
    .filter((n) => !isNaN(n) && n >= min && n <= max);
  return Array.from(new Set(parsed));
}

export const XSMB_PRIZE_LABELS: [prefix: string, label: string][] = [
  ['special', 'Giải Đặc Biệt'],
  ['prize1', 'Giải Nhất'],
  ['prize2', 'Giải Nhì'],
  ['prize3', 'Giải Ba'],
  ['prize4', 'Giải Tư'],
  ['prize5', 'Giải Năm'],
  ['prize6', 'Giải Sáu'],
  ['prize7', 'Giải Bảy'],
];

export function xsmbPrizeLabel(key: string): string {
  return XSMB_PRIZE_LABELS.find(([prefix]) => key === prefix || key.startsWith(prefix))?.[1] ?? key;
}

export interface XsmbTwoDigitResult {
  query: string;
  /** 2 chữ số cuối dùng để đối chiếu */
  lastTwo: string;
  hits: number;
  prizes: string[];
  isSpecial: boolean;
}

/** Thống kê 2 chữ số cuối của số nhập vào xuất hiện ở những giải nào trong một kỳ XSMB. */
export function checkXsmbLastTwoDigits(
  query: string,
  rawPrizes: Record<string, unknown>,
  lotoNumbers: string[]
): XsmbTwoDigitResult | null {
  const raw = query.trim();
  if (!raw) return null;
  const lastTwo = raw.length >= 2 ? raw.slice(-2) : raw.padStart(2, '0');
  const hits = lotoNumbers.filter((n) => n === lastTwo).length;

  const prizes: string[] = [];
  let isSpecial = false;
  for (const [key, value] of Object.entries(rawPrizes)) {
    if (value === null || value === undefined || key === 'date') continue;
    const str = value.toString();
    if (!str.endsWith(lastTwo)) continue;
    if (key === 'special') isSpecial = true;
    prizes.push(`${xsmbPrizeLabel(key)} (${str})`);
  }
  return { query: raw, lastTwo, hits, prizes, isSpecial };
}

export interface PairCoOccurrence {
  date: string;
  num1Hits: number;
  num2Hits: number;
  isSpecial1?: boolean;
  isSpecial2?: boolean;
}

/** Các kỳ mà cả hai số cùng xuất hiện, từ lịch sử xuất hiện của từng số (thứ tự theo hist2). */
export function findPairCoOccurrences(
  hist1: NumberAppearance[],
  hist2: NumberAppearance[],
  num1: string,
  num2: string
): PairCoOccurrence[] {
  const byDate = new Map(hist1.map((item) => [item.date, item]));
  const n1 = parseInt(num1, 10);
  const n2 = parseInt(num2, 10);
  const isJackpot2Ball = (item: NumberAppearance, n: number) =>
    Boolean(item.result && item.result.length > 6 && item.result[6] === n);

  const out: PairCoOccurrence[] = [];
  for (const item2 of hist2) {
    const item1 = byDate.get(item2.date);
    if (!item1) continue;
    out.push({
      date: item2.date,
      num1Hits: item1.hits || 1,
      num2Hits: item2.hits || 1,
      isSpecial1: isJackpot2Ball(item1, n1),
      isSpecial2: isJackpot2Ball(item2, n2),
    });
  }
  return out;
}

export const formatBallList = (balls: number[], sep = ', ') => balls.map(formatBallNumber).join(sep);
