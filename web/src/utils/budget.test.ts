import {
  addEntry,
  budgetLevel,
  EMPTY_BUDGET,
  levelAfterAdding,
  monthlyTotals,
  parseAmount,
  removeEntry,
  sanitizeBudget,
  setMonthlyLimit,
  summarizeMonth,
} from './budget';

const withLimit = setMonthlyLimit(EMPTY_BUDGET, 200_000);

describe('budgetLevel', () => {
  it('các mức cảnh báo', () => {
    expect(budgetLevel(100_000, null)).toBe('none');
    expect(budgetLevel(150_000, 200_000)).toBe('ok');
    expect(budgetLevel(160_000, 200_000)).toBe('warning');
    expect(budgetLevel(200_000, 200_000)).toBe('reached');
    expect(budgetLevel(200_001, 200_000)).toBe('exceeded');
  });
});

describe('summarizeMonth', () => {
  it('chỉ cộng khoản chi trong tháng', () => {
    let s = addEntry(withLimit, { date: '2026-11-02', amount: 50_000 });
    s = addEntry(s, { date: '2026-11-10', amount: 120_000, note: 'Vé bao 7' });
    s = addEntry(s, { date: '2026-10-31', amount: 90_000 });
    const nov = summarizeMonth(s, '2026-11');
    expect(nov.spent).toBe(170_000);
    expect(nov.remaining).toBe(30_000);
    expect(nov.level).toBe('warning');
    expect(nov.entries.map((e) => e.date)).toEqual(['2026-11-10', '2026-11-02']);
    expect(summarizeMonth(s, '2026-10').level).toBe('ok');
  });

  it('cảnh báo trước khi vượt', () => {
    const s = addEntry(withLimit, { date: '2026-11-02', amount: 150_000 });
    expect(levelAfterAdding(s, '2026-11-20', 60_000)).toBe('exceeded');
    expect(levelAfterAdding(s, '2026-12-01', 60_000)).toBe('ok');
  });

  it('xóa khoản chi', () => {
    const s = addEntry(withLimit, { date: '2026-11-02', amount: 150_000 });
    expect(summarizeMonth(removeEntry(s, s.entries[0].id), '2026-11').spent).toBe(0);
  });

  it('tổng theo tháng, qua năm', () => {
    let s = addEntry(EMPTY_BUDGET, { date: '2026-01-05', amount: 10_000 });
    s = addEntry(s, { date: '2025-12-20', amount: 20_000 });
    expect(monthlyTotals(s, '2026-01', 3)).toEqual([
      { month: '2026-01', spent: 10_000 },
      { month: '2025-12', spent: 20_000 },
      { month: '2025-11', spent: 0 },
    ]);
  });

  it('từ chối khoản chi không hợp lệ', () => {
    expect(() => addEntry(EMPTY_BUDGET, { date: '2026-02-30', amount: 1 })).toThrow();
    expect(() => addEntry(EMPTY_BUDGET, { date: '2026-02-01', amount: 0 })).toThrow();
  });
});

describe('parseAmount', () => {
  it.each([
    ['50.000', 50_000],
    ['50000', 50_000],
    ['1 000 000đ', 1_000_000],
    ['20,000 VND', 20_000],
    ['abc', null],
    ['0', null],
    ['-5', null],
  ])('%s -> %s', (text, value) => expect(parseAmount(text)).toBe(value));
});

describe('sanitizeBudget', () => {
  it('bỏ khoản chi hỏng, giữ phần hợp lệ', () => {
    const s = sanitizeBudget({
      monthlyLimit: 300_000,
      entries: [{ id: 'a', date: '2026-11-01', amount: 10_000 }, { date: 'x', amount: 5 }, null, { date: '2026-11-02', amount: -1 }],
    });
    expect(s.monthlyLimit).toBe(300_000);
    expect(s.entries).toHaveLength(1);
    expect(sanitizeBudget('hỏng')).toEqual(EMPTY_BUDGET);
    expect(sanitizeBudget({ monthlyLimit: -1 }).monthlyLimit).toBeNull();
  });
});
