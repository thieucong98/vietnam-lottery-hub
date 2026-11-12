import {
  addTickets,
  createTicket,
  exportTickets,
  importTickets,
  markSeen,
  normalizeTicketNumbers,
  SavedTicket,
  sanitizeTickets,
  telegramCommand,
  ticketStatus,
  unseenResults,
} from './myTickets';

const NOW = new Date('2026-11-12T04:00:00Z');
const make = (game: SavedTicket['game'], input: string, date: string) => {
  const t = createTicket(game, input, date, undefined, NOW);
  if ('error' in t) throw new Error(t.error);
  return t;
};

describe('normalizeTicketNumbers', () => {
  it('XSMB 5 chữ số, Vietlott sắp xếp 2 chữ số', () => {
    expect(normalizeTicketNumbers('xsmb', '00972')).toEqual({ numbers: '00972' });
    expect(normalizeTicketNumbers('xsmb', '972')).toHaveProperty('error');
    expect(normalizeTicketNumbers('vietlott_655', '51 1 2 21 38 39')).toEqual({ numbers: '01-02-21-38-39-51' });
    expect(normalizeTicketNumbers('vietlott_645', '1 2 3 4 5 50')).toHaveProperty('error');
  });
});

describe('addTickets', () => {
  it('bỏ vé trùng, vé mới đứng đầu', () => {
    const a = make('xsmb', '74129', '2026-11-11');
    const b = make('vietlott_655', '1 2 21 38 39 51', '2026-11-10');
    const r1 = addTickets([], [a, b]);
    const r2 = addTickets(r1.list, [make('xsmb', '74129', '2026-11-11'), make('xsmb', '74129', '2026-11-12')]);
    expect(r2.added).toBe(1);
    expect(r2.duplicates).toBe(1);
    expect(r2.list.map((t) => t.drawDate)).toEqual(['2026-11-12', '2026-11-11', '2026-11-10']);
  });
});

describe('xuất / nhập JSON', () => {
  it('xuất rồi nhập lại được đúng danh sách', () => {
    const list = [make('xsmb', '74129', '2026-11-11'), make('vietlott_645', '3 11 14 23 25 43', '2026-11-11')];
    const json = exportTickets(markSeen(list, [list[0].id], NOW), NOW);
    expect(json).not.toContain('seenAt');
    const r = importTickets(json, []);
    expect(r.error).toBeUndefined();
    expect(r.added).toBe(2);
    expect(r.list.map((t) => t.numbers).sort()).toEqual(['03-11-14-23-25-43', '74129']);
  });

  it('gộp với vé có sẵn, đếm vé hỏng', () => {
    const existing = [make('xsmb', '74129', '2026-11-11')];
    const r = importTickets(
      JSON.stringify([
        { game: 'xsmb', numbers: '74129', drawDate: '2026-11-11' },
        { game: '655', numbers: '01-02-21-38-39-51', drawDate: '2026-11-10' },
        { game: 'abc', numbers: '1', drawDate: '2026-11-10' },
        { game: '655', numbers: '1-2-3', drawDate: '2026-11-10' },
      ]),
      existing
    );
    expect(r).toMatchObject({ added: 1, duplicates: 1, invalid: 2 });
    expect(r.list).toHaveLength(2);
  });

  it('báo lỗi file sai', () => {
    expect(importTickets('không phải json', []).error).toBeTruthy();
    expect(importTickets('{"a":1}', []).error).toBeTruthy();
    expect(importTickets('x'.repeat(600 * 1024), []).error).toMatch(/quá lớn/);
  });

  it('sanitizeTickets bỏ phần hỏng trong localStorage', () => {
    expect(sanitizeTickets('hỏng')).toEqual([]);
    expect(sanitizeTickets([{ game: 'xsmb', numbers: '74129', drawDate: '2026-11-11', id: 'x' }, 5])).toHaveLength(1);
  });
});

describe('trạng thái vé', () => {
  const list = [make('xsmb', '74129', '2026-11-11'), make('vietlott_655', '1 2 21 38 39 51', '2026-11-12')];
  const latest = { xsmb: '2026-11-11', vietlott_655: '2026-11-10' };

  it('vé có kết quả khi ngày quay <= kỳ mới nhất', () => {
    expect(ticketStatus(list[0], latest)).toBe('ready');
    expect(ticketStatus(list[1], latest)).toBe('waiting');
  });

  it('nhắc vé có kết quả mới, không nhắc lại sau khi đã xem', () => {
    expect(unseenResults(list, latest)).toHaveLength(1);
    expect(unseenResults(markSeen(list, [list[0].id], NOW), latest)).toHaveLength(0);
    expect(unseenResults(list, { ...latest, vietlott_655: '2026-11-12' })).toHaveLength(2);
  });

  it('lệnh Telegram', () => {
    expect(telegramCommand(list)).toBe('/dove\nxsmb 2026-11-11 74129\n655 2026-11-12 01 02 21 38 39 51');
  });
});
