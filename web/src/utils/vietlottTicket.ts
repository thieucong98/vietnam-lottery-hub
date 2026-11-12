/**
 * Dò vé Vietlott Power 6/55 và Mega 6/45 theo cơ cấu giải, gồm vé bao (bao 5, bao 7-18).
 * Vé bao được tách thành các vé con 6 số như cách Vietlott tính thưởng. Test trong vietlottTicket.test.ts.
 */
import { classifyVietlottTier, VietlottGameId, VietlottPrizeTier, VIETLOTT_PRIZE_VALUES } from './ticketCheck';
import { calcCombinations } from './lotteryUtils';

export const VIETLOTT_MAX_BALL: Record<VietlottGameId, number> = { vietlott_655: 55, vietlott_645: 45 };
export const VIETLOTT_GAME_LABEL: Record<VietlottGameId, string> = { vietlott_655: 'Power 6/55', vietlott_645: 'Mega 6/45' };
/** Xác suất trúng Jackpot 1 của một vé 6 số */
export const VIETLOTT_JACKPOT_ODDS: Record<VietlottGameId, string> = {
  vietlott_655: '1/28.989.675',
  vietlott_645: '1/8.145.060',
};
export const VIETLOTT_SUB_TICKET_PRICE = 10_000;

export const TIER_LABELS: Record<VietlottPrizeTier, string> = {
  jackpot1: 'Jackpot 1',
  jackpot2: 'Jackpot 2',
  prize1: 'Giải Nhất',
  prize2: 'Giải Nhì',
  prize3: 'Giải Ba',
};
export const TIER_ORDER: VietlottPrizeTier[] = ['jackpot1', 'jackpot2', 'prize1', 'prize2', 'prize3'];

/** Vé thường 6 số, vé bao 5 hoặc bao 7-18 */
export const isValidTicketSize = (n: number) => n === 5 || (n >= 6 && n <= 18);

export function ticketKindLabel(size: number): string {
  if (size === 6) return 'Vé 6 số';
  return `Vé bao ${size}`;
}

/** Số vé con 6 số của một vé (bao 5: ghép với từng số còn lại) */
export function subTicketCount(size: number, maxBall: number): number {
  if (size === 5) return maxBall - 5;
  return calcCombinations(size, 6);
}

export interface ParsedVietlottTicket {
  balls: number[];
  error?: string;
}

/** "07 18 24 35 41 55" -> [7, 18, 24, 35, 41, 55]; báo lỗi nếu số ngoài khoảng, trùng hoặc sai số lượng */
export function parseVietlottTicket(text: string, game: VietlottGameId): ParsedVietlottTicket {
  const maxBall = VIETLOTT_MAX_BALL[game];
  const tokens = text.split(/[^0-9]+/).filter(Boolean);
  const balls = tokens.map((t) => parseInt(t, 10));
  const outOfRange = balls.filter((n) => n < 1 || n > maxBall);
  if (outOfRange.length) return { balls: [], error: `Số ngoài khoảng 01-${maxBall}: ${outOfRange.join(', ')}` };
  const unique = Array.from(new Set(balls)).sort((a, b) => a - b);
  if (unique.length !== balls.length) return { balls: [], error: 'Có số bị trùng' };
  if (!isValidTicketSize(unique.length)) {
    return { balls: [], error: `Cần 6 số (vé thường) hoặc 5, 7-18 số (vé bao), đang có ${unique.length} số` };
  }
  return { balls: unique };
}

/** Mỗi dòng (hoặc mỗi đoạn cách nhau bởi dấu ;) là một vé */
export function parseVietlottTickets(text: string, game: VietlottGameId, limit = 50) {
  const lines = text
    .split(/[\n;]+/)
    .map((l) => l.trim())
    .filter(Boolean);
  return lines.slice(0, limit).map((line) => ({ line, ...parseVietlottTicket(line, game) }));
}

function* combinations(items: number[], k: number, start = 0, acc: number[] = []): Generator<number[]> {
  if (acc.length === k) {
    yield acc;
    return;
  }
  for (let i = start; i <= items.length - (k - acc.length); i++) {
    yield* combinations(items, k, i + 1, [...acc, items[i]]);
  }
}

/** Các vé con 6 số của một vé (vé thường trả về chính nó) */
export function* subTickets(balls: number[], maxBall: number): Generator<number[]> {
  if (balls.length === 5) {
    const picked = new Set(balls);
    for (let n = 1; n <= maxBall; n++) if (!picked.has(n)) yield [...balls, n];
    return;
  }
  yield* combinations(balls, 6);
}

export interface VietlottDrawResult {
  balls: number[];
  special?: number | null;
}

export interface VietlottTicketCheck {
  balls: number[];
  matchedMain: number[];
  matchedSpecial: boolean;
  subTickets: number;
  /** Số vé con trúng theo từng hạng giải */
  counts: Record<VietlottPrizeTier, number>;
  /** Tổng giải cố định (Giải Nhất, Nhì, Ba), chưa trừ thuế */
  fixedPrizeTotal: number;
  /** Số vé con trúng Jackpot (giá trị Jackpot thay đổi theo kỳ và có thể chia cho nhiều người) */
  jackpotWins: number;
  cost: number;
}

export function checkVietlottTicket(game: VietlottGameId, balls: number[], draw: VietlottDrawResult): VietlottTicketCheck {
  const maxBall = VIETLOTT_MAX_BALL[game];
  const main = new Set(draw.balls);
  const special = game === 'vietlott_655' ? draw.special ?? null : null;
  const counts: Record<VietlottPrizeTier, number> = { jackpot1: 0, jackpot2: 0, prize1: 0, prize2: 0, prize3: 0 };
  let total = 0;
  for (const sub of subTickets(balls, maxBall)) {
    total++;
    const hits = sub.filter((b) => main.has(b)).length;
    const tier = classifyVietlottTier(game, hits, special !== null && sub.includes(special));
    if (tier) counts[tier]++;
  }
  const values = VIETLOTT_PRIZE_VALUES[game];
  return {
    balls,
    matchedMain: balls.filter((b) => main.has(b)),
    matchedSpecial: special !== null && balls.includes(special),
    subTickets: total,
    counts,
    fixedPrizeTotal: counts.prize1 * values.prize1 + counts.prize2 * values.prize2 + counts.prize3 * values.prize3,
    jackpotWins: counts.jackpot1 + counts.jackpot2,
    cost: total * VIETLOTT_SUB_TICKET_PRICE,
  };
}

export const hasAnyPrize = (c: VietlottTicketCheck) => TIER_ORDER.some((t) => c.counts[t] > 0);
