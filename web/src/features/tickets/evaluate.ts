/**
 * Đối chiếu vé (đã lưu hoặc vừa nhập) với dữ liệu kỳ quay đã tải. Hàm thuần, test trong evaluate.test.ts.
 */
import type { VietlottHistoricalDraw, XSMBHistoricalDraw } from '../../types';
import { isDrawDay } from '../../utils/drawSchedule';
import { LatestDates, SavedTicket, TicketGame, ticketBalls, ticketStatus } from '../../utils/myTickets';
import { checkVietlottTicket, VietlottTicketCheck } from '../../utils/vietlottTicket';
import { checkXsmbTicket, XsmbTicketResult } from '../../utils/xsmbTicket';
import type { VietlottGameId } from '../../utils/ticketCheck';

export interface DrawLookup {
  xsmb?: XSMBHistoricalDraw[] | null;
  vietlott_655?: VietlottHistoricalDraw[] | null;
  vietlott_645?: VietlottHistoricalDraw[] | null;
}

export type TicketOutcome =
  | { kind: 'waiting' }
  | { kind: 'loading' }
  /** Ngày không có kỳ quay, hoặc kỳ quay nằm ngoài dữ liệu đã tải */
  | { kind: 'missing'; reason: 'not_draw_day' | 'out_of_range' }
  | { kind: 'xsmb'; draw: XSMBHistoricalDraw; result: XsmbTicketResult }
  | { kind: 'vietlott'; game: VietlottGameId; draw: VietlottHistoricalDraw; result: VietlottTicketCheck };

export function findXsmbDraw(draws: XSMBHistoricalDraw[], date: string) {
  return draws.find((d) => d.date === date);
}

export function findVietlottDraw(draws: VietlottHistoricalDraw[], date: string) {
  return draws.find((d) => d.date === date);
}

export function checkAgainstDraw(game: TicketGame, numbers: string, draw: XSMBHistoricalDraw | VietlottHistoricalDraw): TicketOutcome {
  if (game === 'xsmb') {
    const d = draw as XSMBHistoricalDraw;
    return { kind: 'xsmb', draw: d, result: checkXsmbTicket(numbers, d.raw_prizes) };
  }
  const d = draw as VietlottHistoricalDraw;
  const balls = numbers.split('-').map((n) => parseInt(n, 10));
  return { kind: 'vietlott', game, draw: d, result: checkVietlottTicket(game, balls, d) };
}

export function evaluateSavedTicket(ticket: SavedTicket, latest: LatestDates, lookup: DrawLookup): TicketOutcome {
  if (!isDrawDay(ticket.game === 'xsmb' ? 'xsmb' : ticket.game, ticket.drawDate)) return { kind: 'missing', reason: 'not_draw_day' };
  if (ticketStatus(ticket, latest) === 'waiting') return { kind: 'waiting' };
  const draws = lookup[ticket.game];
  if (!draws) return { kind: 'loading' };
  const draw =
    ticket.game === 'xsmb'
      ? findXsmbDraw(draws as XSMBHistoricalDraw[], ticket.drawDate)
      : findVietlottDraw(draws as VietlottHistoricalDraw[], ticket.drawDate);
  if (!draw) return { kind: 'missing', reason: 'out_of_range' };
  if (ticket.game === 'xsmb') return checkAgainstDraw('xsmb', ticket.numbers, draw);
  return { kind: 'vietlott', game: ticket.game, draw: draw as VietlottHistoricalDraw, result: checkVietlottTicket(ticket.game, ticketBalls(ticket), draw as VietlottHistoricalDraw) };
}

/** Vé có trúng ít nhất một giải */
export function outcomeHasPrize(o: TicketOutcome): boolean {
  if (o.kind === 'xsmb') return o.result.wins.length > 0;
  if (o.kind === 'vietlott') return o.result.jackpotWins + o.result.fixedPrizeTotal > 0;
  return false;
}
