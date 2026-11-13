import { evaluateSavedTicket, outcomeHasPrize } from './evaluate';
import { createTicket, SavedTicket } from '../../utils/myTickets';
import type { VietlottHistoricalDraw, XSMBHistoricalDraw } from '../../types';

const make = (game: SavedTicket['game'], input: string, date: string) => {
  const t = createTicket(game, input, date);
  if ('error' in t) throw new Error(t.error);
  return t;
};

const xsmbDraw = {
  date: '2026-11-11',
  raw_prizes: { special: 74129, prize1: 97579, prize7_1: 51 },
} as unknown as XSMBHistoricalDraw;
const draw655: VietlottHistoricalDraw = { id: '01422', date: '2026-11-10', balls: [1, 2, 21, 38, 39, 51], special: 12 };

const latest = { xsmb: '2026-11-11', vietlott_655: '2026-11-10', vietlott_645: '2026-11-11' };

describe('evaluateSavedTicket', () => {
  it('chờ kết quả khi kỳ chưa quay', () => {
    expect(evaluateSavedTicket(make('vietlott_655', '1 2 3 4 5 6', '2026-11-12'), latest, {}).kind).toBe('waiting');
  });

  it('báo ngày không có kỳ quay', () => {
    expect(evaluateSavedTicket(make('vietlott_655', '1 2 3 4 5 6', '2026-11-11'), latest, {})).toEqual({
      kind: 'missing',
      reason: 'not_draw_day',
    });
  });

  it('đang tải khi chưa có dữ liệu kỳ quay', () => {
    expect(evaluateSavedTicket(make('xsmb', '74129', '2026-11-11'), latest, {}).kind).toBe('loading');
  });

  it('dò vé XSMB', () => {
    const o = evaluateSavedTicket(make('xsmb', '12351', '2026-11-11'), latest, { xsmb: [xsmbDraw] });
    expect(o.kind).toBe('xsmb');
    expect(outcomeHasPrize(o)).toBe(true);
  });

  it('dò vé Vietlott', () => {
    const o = evaluateSavedTicket(make('vietlott_655', '1 2 21 38 39 12', '2026-11-10'), latest, { vietlott_655: [draw655] });
    expect(o.kind === 'vietlott' && o.result.counts.jackpot2).toBe(1);
  });

  it('kỳ nằm ngoài dữ liệu', () => {
    const o = evaluateSavedTicket(make('xsmb', '12345', '2024-01-01'), latest, { xsmb: [xsmbDraw] });
    expect(o).toEqual({ kind: 'missing', reason: 'out_of_range' });
  });
});
